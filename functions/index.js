const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Admin SDK
admin.initializeApp();

const { processImageWithVisionAndAI } = require('./visionProcessor');
const { verifyUserFace } = require('./faceVerification');

/**
 * Cloud Function to securely run CNN and OCR analysis on an uploaded item photo
 * using Google Cloud Vision and DeepSeek.
 */
exports.processListingImage = onCall({ cors: true }, async (request) => {
  // Enforce authentication check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to analyze images.");
  }

  const { imageBase64, imageUrl } = request.data;
  if (!imageBase64 && !imageUrl) {
    throw new HttpsError("invalid-argument", "Missing base64 image data or image URL.");
  }

  try {
    const result = await processImageWithVisionAndAI({
      imageUrl,
      imageBuffer: imageBase64 ? Buffer.from(imageBase64, 'base64') : null,
      userHint: request.data.userHint || null
    });

    return result;
  } catch (error) {
    logger.error("Listing image processing failed:", error.message);
    throw new HttpsError("internal", `Listing analysis failed: ${error.message}`);
  }
});

/**
 * Batch processor for multiple images
 */
exports.batchProcessImages = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to analyze images.");
  }

  const { imageUrls, listingId } = request.data;
  if (!imageUrls || !Array.isArray(imageUrls)) {
    throw new HttpsError("invalid-argument", "imageUrls must be an array.");
  }

  const results = [];
  for (const url of imageUrls) {
    try {
      const result = await processImageWithVisionAndAI({ imageUrl: url });
      results.push(result);
    } catch (err) {
      results.push({ error: err.message, imageUrl: url });
    }
  }

  // Merge results from multiple images
  const merged = mergeVisionResults(results);

  if (listingId) {
    const db = admin.firestore();
    await db.collection("listings").doc(listingId).update({
      aiItemName: merged.title,
      aiCategory: merged.category,
      aiTags: merged.tags,
      multiImageProcessed: true
    });
  }

  return merged;
});

function mergeVisionResults(results) {
  const validResults = results.filter(r => !r.error && r.deepseek?.data?.title);
  if (!validResults.length) {
    return {
      title: "Unnamed Item",
      category: "Other",
      tags: [],
      suggestedPrice: 0
    };
  }

  // Pick the one with the highest confidence / most details
  const best = validResults.reduce((a, b) => 
    (a.deepseek?.data?.tags?.length || 0) > (b.deepseek?.data?.tags?.length || 0) ? a : b
  );

  const allTags = [...new Set(validResults.flatMap(r => r.deepseek?.data?.tags || []))];

  return {
    title: best.deepseek.data.title,
    category: best.deepseek.data.category,
    tags: allTags.slice(0, 8),
    suggestedPrice: best.deepseek.data.suggestedPrice
  };
}

/**
 * Scheduled Cloud Function running once an hour to automatically purge expired listings.
 */
exports.scheduledTTLCleanup = onSchedule("every 1 hours", async (event) => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();

  try {
    logger.info("Starting scheduled TTL listings cleanup...");
    
    // Query expired listings
    const snapshot = await db.collection("listings")
      .where("expiresAt", "<", now.toDate().toISOString()) // ISO 8601 string comparison
      .limit(500)
      .get();

    if (snapshot.empty) {
      logger.info("No expired listings found.");
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    logger.info(`Successfully purged ${snapshot.size} expired listing(s).`);

  } catch (error) {
    logger.error("Error running scheduled TTL cleanup:", error);
  }
});

/**
 * Cloud Function to securely verify user identity by comparing base64 ID and Selfie images.
 * Uses the Google Gemini API.
 */
exports.verifyUserIdentity = onCall({ cors: true }, async (request) => {
  // Enforce authentication check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to verify identity.");
  }

  const { idImage, selfieImage } = request.data;
  if (!idImage || !selfieImage) {
    throw new HttpsError("invalid-argument", "Missing ID or Selfie image data.");
  }

  // Retrieve Gemini API Key (must be configured via functions/.env)
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    logger.error("Missing backend API credentials for Gemini. Please configure GEMINI_API_KEY environment variable.");
    throw new HttpsError("failed-precondition", "Service configuration error: Missing backend credentials.");
  }

  try {
    logger.info(`Starting biometric verification for user: ${request.auth.uid}`);

    const verificationResult = await verifyUserFace({
      idImage,
      selfieImage,
      geminiApiKey
    });

    if (verificationResult.success) {
      const db = admin.firestore();
      const userRef = db.collection("users").doc(request.auth.uid);
      await userRef.update({
        verified: true,
        isVerified: true,
        verificationScore: verificationResult.score,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      logger.info(`User ${request.auth.uid} successfully verified with score: ${verificationResult.score}`);
    } else {
      logger.info(`User ${request.auth.uid} verification failed with score: ${verificationResult.score}`);
    }

    return verificationResult;

  } catch (error) {
    logger.error("Biometric verification failed:", error);
    throw new HttpsError("internal", `Verification service error: ${error.message}`);
  }
});
