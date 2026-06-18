const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Admin SDK
admin.initializeApp();

const { processImageWithVisionAndAI } = require('./visionProcessor');
const { verifyIdentityUnified } = require('./faceVerification');



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

    // Write prediction log to Firestore
    try {
      const db = admin.firestore();
      const predictionRef = db.collection('ai_predictions').doc();
      const predictionId = predictionRef.id;

      await predictionRef.set({
        predictionId,
        uid: request.auth.uid,
        imageUrl: imageUrl || null,
        imageBase64Size: imageBase64 ? imageBase64.length : 0,
        roboflowCategory: result.deepseek?.data?.roboflowCategory || null,
        roboflowConfidence: result.deepseek?.data?.roboflowConfidence || null,
        aiCategory: result.deepseek?.data?.category || null,
        aiSubcategory: result.deepseek?.data?.subcategory || null,
        aiTitle: result.deepseek?.data?.title || null,
        aiTags: result.deepseek?.data?.tags || [],
        ocrText: result.ocr?.text || '',
        confidenceNotes: result.deepseek?.data?.confidenceNotes || null,
        userHint: request.data.userHint || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        listingId: null,
        finalCategory: null,
        finalTitle: null,
        finalTags: null
      });

      result.predictionId = predictionId;
    } catch (logErr) {
      logger.error("Failed to write to ai_predictions Firestore collection:", logErr.message);
    }

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
    logger.info(`Starting unified AI-assisted identity verification for user: ${request.auth.uid}`);

    const unifiedResult = await verifyIdentityUnified({ idImage, selfieImage, geminiApiKey });

    logger.info('Unified result:', {
      verified:       unifiedResult.verified,
      confidence:     unifiedResult.confidence,
      faceMatch:      unifiedResult.faceMatch,
      idDetected:     unifiedResult.idDetected,
      selfieDetected: unifiedResult.selfieDetected,
      quality:        unifiedResult.quality
    });

    const confidence = Number(unifiedResult.confidence) || 0;
    const isMatch    = !!unifiedResult.faceMatch;
    const idOk       = !!unifiedResult.idDetected;
    const selfieOk   = !!unifiedResult.selfieDetected;
    const isBlurry   = !!unifiedResult.quality?.blur;
    const isDark     = !!unifiedResult.quality?.dark;

    // Decision logic
    const passesAllQuality = !isBlurry && !isDark;
    const meetsVerificationScore = isMatch && confidence >= 80;
    const facesDetected = idOk && selfieOk;

    let status = 'FAILED';
    if (facesDetected && passesAllQuality && meetsVerificationScore) {
      status = 'VERIFIED';
    } else if (facesDetected && passesAllQuality && isMatch && confidence >= 70 && confidence < 80) {
      status = 'PENDING_REVIEW';
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(request.auth.uid);

    // Extract ID details for metadata logging
    const extractedData = unifiedResult.extractedData || {};
    const idNumberLast4 = extractedData.idNumber
      ? extractedData.idNumber.replace(/[\s\-]/g, '').slice(-4)
      : null;

    if (status === 'VERIFIED') {
      await userRef.update({
        verified:             true,
        isVerified:           true,
        verificationStatus:   'VERIFIED',
        verificationScore:    confidence,
        verifiedAt:           admin.firestore.FieldValue.serverTimestamp(),
        trustScore:           30, // baseline set to 30
        // Extracted fields (masked)
        idType:               unifiedResult.idType || clientIdType || null,
        idNumberLast4,
        idNameExtracted:      extractedData.fullName || null,
        idBirthDate:          extractedData.birthDate || null,
      });

      // Write initial baseline log to trust_logs
      await db.collection('trust_logs').add({
        uid: request.auth.uid,
        userId: request.auth.uid,
        change: 30,
        newScore: 30,
        event: 'Verification Approved',
        ruleApplied: 'Verification Bonus',
        reason: 'User successfully completed government identity verification.',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        action: 'identity_verification',
        points: 30,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info(`User ${request.auth.uid} verified — score: ${confidence}`);

      return {
        success: true,
        status: 'VERIFIED',
        score: confidence,
        reason: 'Identity confirmed successfully.'
      };
    } 
    
    if (status === 'PENDING_REVIEW') {
      await userRef.update({
        verified:             false,
        isVerified:           false,
        verificationStatus:   'PENDING_REVIEW',
        verificationScore:    confidence,
        // Extracted fields
        idType:               unifiedResult.idType || clientIdType || null,
        idNumberLast4,
        idNameExtracted:      extractedData.fullName || null,
        idBirthDate:          extractedData.birthDate || null,
      });

      logger.info(`User ${request.auth.uid} set to PENDING_REVIEW — score: ${confidence}`);

      return {
        success: false,
        status: 'PENDING_REVIEW',
        score: confidence,
        reason: 'Your submission requires additional review. Our moderation team will evaluate your ID and selfie shortly.',
        quality: unifiedResult.quality,
        idDetected: idOk,
        selfieDetected: selfieOk,
        faceMatch: isMatch
      };
    }

    // Default failure
    await userRef.update({
      verified:             false,
      isVerified:           false,
      verificationStatus:   'FAILED',
      verificationScore:    confidence,
    });

    let failureReason = 'We could not confirm your identity.';
    if (!facesDetected) {
      failureReason = 'Face not clearly visible on ID card or selfie.';
    } else if (isBlurry) {
      failureReason = 'ID image was blurry.';
    } else if (isDark) {
      failureReason = 'Selfie lighting was too dark or had strong shadows.';
    } else if (confidence < 70) {
      failureReason = 'Face match confidence below threshold.';
    } else {
      failureReason = unifiedResult.reason || 'Verification failed.';
    }

    logger.info(`User ${request.auth.uid} verification failed — reason: ${failureReason}`);

    return {
      success: false,
      status: 'FAILED',
      score: confidence,
      reason: failureReason,
      quality: unifiedResult.quality,
      idDetected: idOk,
      selfieDetected: selfieOk,
      faceMatch: isMatch
    };

  } catch (error) {
    logger.error('Verification pipeline failed:', error);
    throw new HttpsError('internal', `Verification service error: ${error.message}`);
  }
});

