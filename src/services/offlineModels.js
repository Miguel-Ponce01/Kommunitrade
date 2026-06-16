/**
 * offlineModels.js — Lightweight stubs
 *
 * TensorFlow.js and Tesseract.js have been removed from the project.
 * All image analysis is handled server-side via the processListingImage
 * Cloud Function (Roboflow + Gemini). These stubs ensure the offline
 * fallback path in listingProcessor.js still compiles and runs without
 * crashing when the Cloud Function is unavailable.
 */

// Stub: no local CNN model — return empty predictions
export async function loadMobileNet() {
  return null;
}

// Stub: no local OCR worker — return null
export async function loadTesseract() {
  return null;
}

// Stub: CNN analysis not available locally — return empty array
export async function runCNN(_imageElement) {
  console.info('Local CNN not available — analysis handled by Cloud Function.');
  return [];
}

// Stub: OCR not available locally — return empty array
export async function runOCR(_imageFileOrUrl) {
  console.info('Local OCR not available — analysis handled by Cloud Function.');
  return [];
}

// No-op cleanup
export async function cleanupOfflineModels() {
  // Nothing to clean up
}

