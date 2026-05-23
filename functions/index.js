const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const axios = require("axios");

// Initialize Admin SDK
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Cloud Function to securely run CNN and OCR analysis on an uploaded item photo,
 * and fetch smart listing recommendations from DeepSeek.
 */
exports.analyzeListingWithAI = onCall({ cors: true }, async (request) => {
  // Enforce authentication check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to analyze images.");
  }

  const { imageBase64 } = request.data;
  if (!imageBase64) {
    throw new HttpsError("invalid-argument", "Missing base64 image data.");
  }

  // Retrieve keys from environments or standard fallbacks for local dev
  const googleApiKey = process.env.GOOGLE_VISION_API_KEY || "AIzaSyDfNqvVTFFRYTgRTceIAV5rVZe-ifsmpoM";
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY || "sk-4424ef214c1543ee8217de10af604036";

  try {
    logger.info("Executing Google Vision API call internally...");
    const visionResponse = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
      {
        requests: [
          {
            image: { content: imageBase64 },
            features: [
              { type: "TEXT_DETECTION" },
              { type: "LABEL_DETECTION" }
            ]
          }
        ]
      }
    );

    const visionData = visionResponse.data.responses[0];
    const textAnnotations = visionData.textAnnotations;
    const ocrText = textAnnotations && textAnnotations.length > 0 ? textAnnotations[0].description : "";

    const labelAnnotations = visionData.labelAnnotations || [];
    const labels = labelAnnotations.map(l => ({
      className: l.description,
      probability: l.score
    }));
    const topLabel = labels.length > 0 ? labels[0].className : "Unnamed Item";

    logger.info("Vision API complete. Querying DeepSeek Smart Advisor...");

    // Construct prompt
    const prompt = `
You are the KomuniTrade Smart Advisor. You help users optimize their marketplace listings.
Given the user's input, analyze the item and return a JSON object with the following exact structure:
{
  "title": "Optimized Title (max 60 chars)",
  "category": "One of: Electronics, Clothing, Books & Media, Furniture, Appliances, Real Estate, Automotive, Other",
  "tags": ["tag1", "tag2", "tag3"], // 3-5 relevant keywords
  "suggestedPrice": 0 // Numeric suggested price in PHP if possible based on description, else 0
}

User Input:
Title: None
Description: None
OCR Text from Image: ${ocrText || topLabel || "None"}
`;

    const deepseekResponse = await axios.post(
      "https://api.deepseek.com/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful API that returns strictly valid JSON without any markdown formatting." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekApiKey}`
        }
      }
    );

    let content = deepseekResponse.data.choices[0].message.content.trim();
    if (content.startsWith("```json")) {
      content = content.replace(/^```json\n?/, "").replace(/```$/, "").trim();
    } else if (content.startsWith("```")) {
      content = content.replace(/^```\n?/, "").replace(/```$/, "").trim();
    }

    const parsedDeepseek = JSON.parse(content);

    logger.info("AI Analysis completed successfully.");
    return {
      success: true,
      ocr: {
        success: true,
        text: ocrText,
        confidence: 1.0
      },
      cnn: {
        success: true,
        topPrediction: labels.length > 0 ? labels[0] : null,
        allPredictions: labels
      },
      deepseek: {
        success: true,
        data: {
          title: parsedDeepseek.title || topLabel || "Unnamed Item",
          category: parsedDeepseek.category || "Other",
          tags: Array.isArray(parsedDeepseek.tags) ? parsedDeepseek.tags : [],
          suggestedPrice: parsedDeepseek.suggestedPrice || 0
        }
      }
    };

  } catch (error) {
    logger.error("AI Analysis failed on Cloud Function:", error.message);
    throw new HttpsError("internal", `AI analysis failed: ${error.message}`);
  }
});

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

  // Retrieve Gemini API Key
  const geminiApiKey = process.env.GEMINI_API_KEY || "AIzaSyC5OkfwoReCICZ3XPPh2mMgJUe7-K90t-0";

  // Helpers to clean up base64 and retrieve mime type
  const cleanBase64 = (str) => {
    if (str.startsWith("data:")) {
      const idx = str.indexOf(",");
      if (idx !== -1) return str.substring(idx + 1);
    }
    return str;
  };

  const getMime = (str) => {
    if (str.startsWith("data:")) {
      const match = str.match(/^data:([^;]+);/);
      if (match) return match[1];
    }
    return "image/jpeg";
  };

  const cleanedId = cleanBase64(idImage);
  const cleanedSelfie = cleanBase64(selfieImage);
  const idMime = getMime(idImage);
  const selfieMime = getMime(selfieImage);

  try {
    logger.info(`Starting biometric verification for user: ${request.auth.uid}`);

    // Call Gemini 1.5 Flash API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: "Compare the face in the first image (Government ID) with the face in the second image (User Selfie). Analyze facial features like eyes, nose, mouth shape, and face structure. Determine if they belong to the same person. Return a JSON response with the following keys: 'isMatch' (boolean), 'confidenceScore' (number from 0 to 100 representing similarity/confidence), and 'reason' (string explanation)."
              },
              {
                inlineData: {
                  mimeType: idMime,
                  data: cleanedId
                }
              },
              {
                inlineData: {
                  mimeType: selfieMime,
                  data: cleanedSelfie
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const resultText = response.data.candidates[0].content.parts[0].text.trim();
    const resultJson = JSON.parse(resultText);

    logger.info("Gemini verification result:", resultJson);

    const isMatch = !!resultJson.isMatch;
    const score = Number(resultJson.confidenceScore) || 0;

    const THRESHOLD = 65;
    const verified = isMatch && score >= THRESHOLD;

    if (verified) {
      const db = admin.firestore();
      const userRef = db.collection("users").doc(request.auth.uid);
      await userRef.update({
        verified: true,
        isVerified: true,
        verificationScore: score,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      logger.info(`User ${request.auth.uid} successfully verified with score: ${score}`);
    } else {
      logger.info(`User ${request.auth.uid} verification failed with score: ${score}`);
    }

    return {
      success: verified,
      score,
      reason: resultJson.reason || ""
    };

  } catch (error) {
    logger.error("Biometric verification failed:", error);
    throw new HttpsError("internal", `Verification service error: ${error.message}`);
  }
});

