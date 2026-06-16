const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Admin SDK
admin.initializeApp();

const { processImageWithVisionAndAI } = require('./visionProcessor');
const { verifyUserFace, extractIdData } = require('./faceVerification');


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
 * Cloud Function: verify user identity.
 * Runs Gemini OCR (ID data extraction) and face biometric match in parallel.
 * On success, writes verification fields to Firestore via Admin SDK only.
 * Full ID number is NEVER stored — only the last 4 digits (DPA compliance).
 */
exports.verifyUserIdentity = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to verify identity.');
  }

  const { idImage, selfieImage, idType: clientIdType } = request.data;
  if (!idImage || !selfieImage) {
    throw new HttpsError('invalid-argument', 'Missing ID or Selfie image data.');
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    logger.error('Missing GEMINI_API_KEY in environment.');
    throw new HttpsError('failed-precondition', 'Service configuration error: Missing backend credentials.');
  }

  try {
    logger.info(`Starting parallel OCR + face verification for user: ${request.auth.uid}`);

    // Run OCR and face match simultaneously — saves ~5–8 seconds vs sequential
    const [ocrResult, faceResult] = await Promise.all([
      extractIdData({ idImage, geminiApiKey }),
      verifyUserFace({ idImage, selfieImage, geminiApiKey })
    ]);

    logger.info('OCR result:', {
      idType:   ocrResult.idType,
      expired:  ocrResult.expired,
      readable: ocrResult.isReadable,
    });
    logger.info('Face result:', {
      success: faceResult.success,
      score:   faceResult.score,
    });

    // Gate 1: Reject expired IDs immediately
    if (ocrResult.expired) {
      return {
        success: false,
        score: 0,
        reason: 'The ID document has expired. Please use a valid, non-expired government ID.',
        ocrData: null,
      };
    }

    // Gate 2: Reject unreadable IDs
    if (ocrResult.isReadable === false) {
      return {
        success: false,
        score: 0,
        reason: 'The ID photo was too blurry or had too much glare to read. Please retake in good lighting.',
        ocrData: null,
      };
    }

    // Write to Firestore if both gates pass and face matches
    if (faceResult.success) {
      const db = admin.firestore();
      const userRef = db.collection('users').doc(request.auth.uid);

      // Mask the full ID number — store only last 4 digits for audit reference
      const idNumberLast4 = ocrResult.idNumber
        ? ocrResult.idNumber.replace(/[\s\-]/g, '').slice(-4)
        : null;

      await userRef.update({
        verified:             true,
        isVerified:           true,
        verificationStatus:   'VERIFIED',
        verificationScore:    faceResult.score,
        verifiedAt:           admin.firestore.FieldValue.serverTimestamp(),
        // OCR-extracted fields (masked)
        idType:               ocrResult.idType || clientIdType || null,
        idNumberLast4,                                  // e.g. "4521" — never full number
        idNameExtracted:      ocrResult.fullName || null,
        idBirthDate:          ocrResult.birthDate || null,
      });

      logger.info(`User ${request.auth.uid} verified — score: ${faceResult.score}, idType: ${ocrResult.idType}`);
    } else {
      logger.info(`User ${request.auth.uid} failed verification — score: ${faceResult.score}`);
    }

    return {
      success:  faceResult.success,
      score:    faceResult.score,
      reason:   faceResult.reason,
      ocrData: faceResult.success ? {
        idType:   ocrResult.idType,
        fullName: ocrResult.fullName,
      } : null,
    };

  } catch (error) {
    logger.error('Verification pipeline failed:', error);
    throw new HttpsError('internal', `Verification service error: ${error.message}`);
  }
});

