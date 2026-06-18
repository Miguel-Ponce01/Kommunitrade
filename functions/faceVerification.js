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

const safeJsonParse = (text) => {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\n?/, "").replace(/```$/, "").trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\n?/, "").replace(/```$/, "").trim();
  }
  return JSON.parse(cleaned);
};

// ─── Configurable Gemini Model ───────────────────────────────────────────────
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const GEMINI_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

// ─── Unified Identity Verification helper ────────────────────────────────────
async function verifyIdentityUnified({ idImage, selfieImage, geminiApiKey }) {
  if (!geminiApiKey) throw new Error('Missing GEMINI_API_KEY credentials.');

  const cleanedId     = cleanBase64(idImage);
  const cleanedSelfie = cleanBase64(selfieImage);
  const idMime        = getMime(idImage);
  const selfieMime    = getMime(selfieImage);

  logger.info(`Sending unified verification prompt to Gemini (${GEMINI_MODEL})...`);

  let response;
  try {
    response = await axios.post(
      GEMINI_URL(geminiApiKey),
      {
        contents: [{
          parts: [
            {
              text:
                'You are an identity verification assistant. Analyze the two uploaded images:\n' +
                'Image 1: A government-issued identity document.\n' +
                'Image 2: A live user selfie.\n\n' +
                'Tasks:\n' +
                '1. Face Presence: Check if a face is clearly visible in both the ID card (Image 1) and the selfie (Image 2).\n' +
                '2. Facial Similarity Assessment: Compare the facial features between the face in the ID card and the face in the selfie. Determine if they likely belong to the same person, and assign a similarity confidence score (0-100).\n' +
                '3. Image Quality Assessment: Identify any heavy blur, excessive glare, cropping/cut-off edges, or severe darkness in either of the images.\n' +
                '4. OCR Information Extraction: Extract the full name, ID number, and expiration date (if applicable) from the ID card (Image 1).\n\n' +
                'Output MUST be a single, valid JSON object with the following exact keys:\n' +
                '{\n' +
                '  "verified": boolean (true only if faceMatch is true, idDetected is true, selfieDetected is true, confidence >= 80, and quality has no severe blur/darkness),\n' +
                '  "confidence": number (similarity confidence score between 0 and 100),\n' +
                '  "faceMatch": boolean (true if the faces belong to the same person based on facial similarity assessment),\n' +
                '  "idDetected": boolean (true if a face is detected on the ID card),\n' +
                '  "selfieDetected": boolean (true if a face is detected on the selfie),\n' +
                '  "quality": {\n' +
                '    "blur": boolean (true if either image is severely blurry),\n' +
                '    "glare": boolean (true if either image has excessive glare),\n' +
                '    "cropped": boolean (true if either image is cropped or cut off),\n' +
                '    "dark": boolean (true if either image is too dark)\n' +
                '  },\n' +
                '  "reason": "a concise, detailed English sentence explaining the verification outcome (e.g. why it succeeded, or which specific quality/matching threshold failed)",\n' +
                '  "extractedData": {\n' +
                '    "fullName": "extracted full name, or null if not found",\n' +
                '    "idNumber": "extracted ID number exactly as printed, or null if not found",\n' +
                '    "expiryDate": "extracted expiry date in YYYY-MM-DD format, or null if not found/no expiry"\n' +
                '  }\n' +
                '}\n\n' +
                'Do not include any markup other than the raw JSON.'
            },
            { inlineData: { mimeType: idMime,      data: cleanedId } },
            { inlineData: { mimeType: selfieMime,   data: cleanedSelfie } }
          ]
        }]
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );
  } catch (err) {
    try {
      const probe = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
      logger.info('Probe ListModels succeeded:', probe.data);
    } catch (probeErr) {
      const probeDetails = probeErr.response?.data?.error?.message || probeErr.message;
      logger.error('Gemini key diagnostic failure:', probeDetails);
      throw new Error(`Gemini Key Diagnostic: ${probeDetails}`);
    }
    const errorDetails = err.response?.data?.error?.message || err.message;
    logger.error('Gemini unified verification API call failed:', errorDetails);
    throw new Error(`Gemini API Error: ${errorDetails}`);
  }

  const candidate = response.data?.candidates?.[0];
  if (!candidate) {
    throw new Error('Gemini returned an empty response. The images may have been blocked by safety filters.');
  }
  const part = candidate.content?.parts?.[0];
  if (!part || !part.text) {
    throw new Error(`Gemini did not return any text. Finish reason: ${candidate.finishReason || 'UNKNOWN'}`);
  }

  try {
    const json = safeJsonParse(part.text);
    return json;
  } catch (parseErr) {
    logger.error('Failed to parse Gemini unified verification response:', part.text);
    throw new Error('Failed to parse verification response.');
  }
}

module.exports = { verifyIdentityUnified };
