const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (connects to local Firestore Emulator or Production)
if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "komunitrade-test"
  });
}

// Point to emulator if running locally
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  console.log('💡 No FIRESTORE_EMULATOR_HOST set — defaulting to localhost:8080 (emulator)');
  console.log('   Set FIRESTORE_EMULATOR_HOST="" to connect to production Firestore.\n');
}

const db = getFirestore();

async function evaluatePerformance() {
  console.log("=== KOMUNITRADE AI MODEL PERFORMANCE EVALUATION ===");
  console.log("Fetching prediction log records from Firestore...");

  try {
    const snapshot = await db.collection('ai_predictions')
      .get();

    if (snapshot.empty) {
      console.log("No logs found in 'ai_predictions' collection. Ensure you have seeded or processed some items.");
      return;
    }

    // Filter logs where the user actually completed and published the listing (ground truth available)
    const records = snapshot.docs
      .map(doc => doc.data())
      .filter(r => r.listingId && r.finalCategory);

    if (records.length === 0) {
      console.log(`Found ${snapshot.size} prediction logs, but 0 published listings (missing final ground truth).`);
      console.log("Publish a few listings using the wizard to populate ground-truth fields.");
      return;
    }

    console.log(`Analyzing ${records.length} ground-truth records...\n`);

    // 1. Overall Category Accuracy
    let correctCategoryCount = 0;
    const categoryStats = {}; // { category: { TP, FP, FN } }

    // Initialize stats
    const categories = ['Electronic', 'House', 'Books', 'Clothing', 'Food', 'Service', 'Furniture', 'Vehicles', 'Waste', 'Other'];
    categories.forEach(cat => {
      categoryStats[cat] = { TP: 0, FP: 0, FN: 0 };
    });

    records.forEach(r => {
      const predicted = r.aiCategory || 'Other';
      const actual = r.finalCategory || 'Other';

      if (predicted === actual) {
        correctCategoryCount++;
        if (categoryStats[actual]) categoryStats[actual].TP++;
      } else {
        if (categoryStats[predicted]) categoryStats[predicted].FP++;
        if (categoryStats[actual]) categoryStats[actual].FN++;
      }
    });

    const overallAccuracy = (correctCategoryCount / records.length) * 100;

    // 2. Tag Similarity (Jaccard Index)
    let totalJaccard = 0;
    let tagMatchCount = 0;

    records.forEach(r => {
      const predictedTags = new Set((r.aiTags || []).map(t => t.toLowerCase().trim()));
      const finalTags = new Set((r.finalTags || []).map(t => t.toLowerCase().trim()));

      if (predictedTags.size === 0 && finalTags.size === 0) {
        totalJaccard += 1.0;
        return;
      }

      const intersection = new Set([...predictedTags].filter(t => finalTags.has(t)));
      const union = new Set([...predictedTags, ...finalTags]);
      const jaccard = intersection.size / union.size;
      totalJaccard += jaccard;
    });

    const avgTagJaccard = (totalJaccard / records.length) * 100;

    // 3. Title Text Similarity (Levenshtein Distance / Match ratio)
    let totalTitleSimilarity = 0;
    records.forEach(r => {
      const pred = (r.aiTitle || "").toLowerCase().trim();
      const final = (r.finalTitle || "").toLowerCase().trim();
      totalTitleSimilarity += calculateStringSimilarity(pred, final);
    });
    const avgTitleSimilarity = (totalTitleSimilarity / records.length) * 100;

    // Format output
    console.log("## Category Classification Metrics");
    console.log(`Overall Category Accuracy: ${overallAccuracy.toFixed(2)}%`);
    console.log(`Average Title Similarity: ${avgTitleSimilarity.toFixed(2)}%`);
    console.log(`Average Tag Jaccard Similarity: ${avgTagJaccard.toFixed(2)}%\n`);

    console.log("| Category | Precision (%) | Recall (%) | F1-Score (%) |");
    console.log("| :--- | :--- | :--- | :--- |");

    let sumPrecision = 0;
    let sumRecall = 0;
    let sumF1 = 0;
    let evaluatedCategories = 0;

    for (const cat of categories) {
      const { TP, FP, FN } = categoryStats[cat];
      const precision = TP + FP > 0 ? (TP / (TP + FP)) * 100 : 0;
      const recall = TP + FN > 0 ? (TP / (TP + FN)) * 100 : 0;
      const f1 = precision + recall > 0 ? 2 * ((precision * recall) / (precision + recall)) : 0;

      // Only average categories that had representation to avoid skewing macro stats
      if (TP > 0 || FP > 0 || FN > 0) {
        sumPrecision += precision;
        sumRecall += recall;
        sumF1 += f1;
        evaluatedCategories++;
      }

      console.log(`| ${cat} | ${precision.toFixed(1)}% | ${recall.toFixed(1)}% | ${f1.toFixed(1)}% |`);
    }

    const macroPrecision = evaluatedCategories > 0 ? sumPrecision / evaluatedCategories : 0;
    const macroRecall = evaluatedCategories > 0 ? sumRecall / evaluatedCategories : 0;
    const macroF1 = evaluatedCategories > 0 ? sumF1 / evaluatedCategories : 0;

    console.log("| **Macro Average** | **" + macroPrecision.toFixed(1) + "%** | **" + macroRecall.toFixed(1) + "%** | **" + macroF1.toFixed(1) + "%** |");

  } catch (err) {
    console.error("Evaluation run failed:", err);
  }
}

// Simple Levenshtein-based similarity percentage helper
function calculateStringSimilarity(s1, s2) {
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  
  const editDistance = levenshtein(s1, s2);
  return (longerLength - editDistance) / longerLength;
}

function levenshtein(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

evaluatePerformance();
