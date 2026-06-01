const axios = require('axios');
const { logger } = require('firebase-functions');

async function verifyUserFace({ idImage, selfieImage, geminiApiKey }) {
  if (!geminiApiKey) {
    throw new Error("Missing GEMINI_API_KEY credentials.");
  }

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

  logger.info("Sending face matching prompt to Gemini API...");

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

  return {
    success: verified,
    score,
    reason: resultJson.reason || ""
  };
}

module.exports = { verifyUserFace };
