const axios = require('axios');
const { logger } = require('firebase-functions');

// ─── Shared helpers ───────────────────────────────────────────────────────────

const cleanBase64 = (str) => {
  if (str && str.startsWith('data:')) {
    const idx = str.indexOf(',');
    if (idx !== -1) return str.substring(idx + 1);
  }
  return str;
};

const getMime = (str) => {
  if (str && str.startsWith('data:')) {
    const match = str.match(/^data:([^;]+);/);
    if (match) return match[1];
  }
  return 'image/jpeg';
};

const GEMINI_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

// ─── Face biometric match ─────────────────────────────────────────────────────

async function verifyUserFace({ idImage, selfieImage, geminiApiKey }) {
  if (!geminiApiKey) throw new Error('Missing GEMINI_API_KEY credentials.');

  const cleanedId     = cleanBase64(idImage);
  const cleanedSelfie = cleanBase64(selfieImage);
  const idMime        = getMime(idImage);
  const selfieMime    = getMime(selfieImage);

  logger.info('Sending face matching prompt to Gemini...');

  const response = await axios.post(
    GEMINI_URL(geminiApiKey),
    {
      contents: [{
        parts: [
          {
            text:
              'You are a biometric verification system. Compare the face in ' +
              'Image 1 (government-issued ID photo) with the face in Image 2 ' +
              '(live selfie). Carefully analyse facial features: eye shape and ' +
              'spacing, nose bridge and tip, mouth width, jawline, and overall ' +
              'face structure. Account for lighting differences, angles, and ' +
              'aging. Determine if both images are of the same person. ' +
              'Respond ONLY with valid JSON containing exactly these keys: ' +
              '"isMatch" (boolean), "confidenceScore" (integer 0–100), ' +
              '"reason" (one sentence in English).'
          },
          { inlineData: { mimeType: idMime,      data: cleanedId } },
          { inlineData: { mimeType: selfieMime,   data: cleanedSelfie } }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const raw  = response.data.candidates[0].content.parts[0].text.trim();
  const json = JSON.parse(raw);

  logger.info('Gemini face match result:', json);

  const isMatch = !!json.isMatch;
  const score   = Number(json.confidenceScore) || 0;

  // Raised from 65 → 80 per plan (marketplace middle ground)
  const THRESHOLD = 80;
  const verified  = isMatch && score >= THRESHOLD;

  return {
    success: verified,
    score,
    reason: json.reason || ''
  };
}

// ─── OCR data extraction ──────────────────────────────────────────────────────

async function extractIdData({ idImage, geminiApiKey }) {
  if (!geminiApiKey) throw new Error('Missing GEMINI_API_KEY credentials.');

  const cleanedId = cleanBase64(idImage);
  const idMime    = getMime(idImage);

  logger.info('Sending OCR extraction prompt to Gemini...');

  const response = await axios.post(
    GEMINI_URL(geminiApiKey),
    {
      contents: [{
        parts: [
          {
            text:
              'You are an OCR engine specialised in Philippine government-issued ' +
              'identity documents. Extract all readable text fields from this ID ' +
              'image and return ONLY valid JSON with these exact keys:\n' +
              '- "fullName": string (as printed on the card, surname first if visible)\n' +
              '- "birthDate": string in YYYY-MM-DD format, or null if not found\n' +
              '- "idNumber": string (the primary ID number, including hyphens/spaces as printed)\n' +
              '- "idType": one of ["PhilSys","Passport","DriversLicense","UMID","SSS","PRC","Voters","TIN","GSIS","PhilHealth","Other"]\n' +
              '- "expiryDate": string in YYYY-MM-DD format, or null if not found or no expiry\n' +
              '- "isReadable": boolean — true if the ID text is clear enough to extract, false if too blurry/glared\n' +
              'If a field cannot be determined, use null. Do not guess.'
          },
          { inlineData: { mimeType: idMime, data: cleanedId } }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const raw  = response.data.candidates[0].content.parts[0].text.trim();
  const json = JSON.parse(raw);

  logger.info('Gemini OCR result:', {
    idType:     json.idType,
    isReadable: json.isReadable,
    hasName:    !!json.fullName,
    hasBirth:   !!json.birthDate,
    hasIdNum:   !!json.idNumber,
  });

  // Check if the ID has already expired
  if (json.expiryDate) {
    const expiry = new Date(json.expiryDate);
    if (!isNaN(expiry) && expiry < new Date()) {
      return { ...json, expired: true };
    }
  }

  return { ...json, expired: false };
}

module.exports = { verifyUserFace, extractIdData };
