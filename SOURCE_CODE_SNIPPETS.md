# APPENDIX E - SOURCE CODE SNIPPETS
**Manuscript & Technical Project Defense Documentation**

This appendix contains the core software implementation snippets for the algorithmic modules of the KomuniTrade platform, including CNN Classification, OCR Extraction, Geohash Filtering, and Facial Verification.

---

## F.1 CNN Classification Module

The CNN classification workflow is executed server-side in Firebase Cloud Functions. It uses the Roboflow Inference API to run an object detector model and maps the output classes to the 10 KomuniTrade database categories.

### Implementation Snippet (`functions/visionProcessor.js`):
```javascript
// Map Roboflow category labels to KomuniTrade category IDs
function mapRoboflowCategory(className) {
  if (!className) return 'Other';
  const c = className.toLowerCase().trim();
  
  if (c.includes('electronic') || c.includes('phone') || c.includes('laptop') || c.includes('computer') || c.includes('gadget') || c.includes('camera') || c.includes('watch') || c.includes('smartwatch') || c.includes('wearable') || c.includes('tv') || c.includes('television') || c.includes('mouse') || c.includes('keyboard') || c.includes('monitor') || c.includes('webcam') || c.includes('audio') || c.includes('speaker') || c.includes('headphone') || c.includes('earphone')) {
    return 'Electronic';
  }
  if (c.includes('cloth') || c.includes('shirt') || c.includes('pants') || c.includes('shoe') || c.includes('dress') || c.includes('apparel')) {
    return 'Clothing';
  }
  if (c.includes('book') || c.includes('school') || c.includes('media') || c.includes('textbook')) {
    return 'Books';
  }
  if (c.includes('furniture') || c.includes('chair') || c.includes('table') || c.includes('sofa') || c.includes('bed') || c.includes('desk')) {
    return 'Furniture';
  }
  if (c.includes('home') || c.includes('living') || c.includes('appliance') || c.includes('kitchen') || c.includes('decor') || c.includes('fan') || c.includes('refrigerator') || c.includes('microwave') || c.includes('oven') || c.includes('washing machine')) {
    return 'House';
  }
  if (c.includes('vehicle') || c.includes('car') || c.includes('motor') || c.includes('bike') || c.includes('cycle') || c.includes('automotive')) {
    return 'Vehicles';
  }
  if (c.includes('waste') || c.includes('recycle') || c.includes('recyclable') || c.includes('scrap') || c.includes('carton') || c.includes('plastic') || c.includes('metal')) {
    return 'Waste';
  }
  const foodKeywords = [
    'food', 'drink', 'beverage', 'meal', 'fresh', 'bread', 'chicken', 'fruit', 'vegetable', 'vegetables',
    'baguette', 'croissant', 'cabbage', 'potato', 'strawberry', 'apple', 'orange', 'banana', 'egg', 'beef',
    'cheese', 'chocolate', 'durian', 'snack', 'burger', 'sandwich', 'pizza', 'rice', 'noodle', 'milk', 'juice'
  ];
  if (foodKeywords.some(kw => c.includes(kw))) {
    return 'Food';
  }
  if (c.includes('service') || c.includes('repair') || c.includes('plumb') || c.includes('clean') || c.includes('tutor') || c.includes('labor')) {
    return 'Service';
  }
  
  const mapping = {
    'electronics': 'Electronic',
    'electronic': 'Electronic',
    'home & living': 'House',
    'house': 'House',
    'books & school': 'Books',
    'books': 'Books',
    'clothing': 'Clothing',
    'furniture': 'Furniture',
    'vehicles': 'Vehicles',
    'waste': 'Waste',
    'recyclables': 'Waste',
    'food': 'Food',
    'service': 'Service'
  };
  
  return mapping[c] || 'Other';
}

// Call Roboflow category detector workflow API securely server-side
async function callRoboflowCategoryDetector(base64Image, imageUrl) {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) {
    logger.warn("ROBOFLOW_API_KEY is missing in backend environment.");
    return null;
  }
  try {
    const inputPayload = imageUrl
      ? { type: "url", value: imageUrl }
      : { type: "base64", value: base64Image };

    const response = await axios.post(
      'https://serverless.roboflow.com/anthons-workspace/workflows/detect-and-classify',
      {
        api_key: apiKey,
        inputs: {
          image: inputPayload
        }
      },
      { timeout: 10000 }
    );
    
    const result = response.data;
    const { topClass, maxConfidence } = extractTopClass(result);
    return {
      className: topClass,
      confidence: maxConfidence,
      category: mapRoboflowCategory(topClass)
    };
  } catch (error) {
    logger.warn("Roboflow Category Detector failed:", error.message);
    return null;
  }
}
```

---

## F.2 OCR Extraction Module

OCR details are extracted using the Google Cloud Vision API inside Firebase Cloud Functions. The Vision API text detection task is executed in parallel with CNN object classifications.

### Implementation Snippet (`functions/visionProcessor.js`):
```javascript
// Google Cloud Vision Text and Label Detection Integration
const visionPromise = (async () => {
  try {
    if (!visionClient) {
      const visionApiKey = process.env.GOOGLE_VISION_API_KEY;
      visionClient = visionApiKey 
        ? new vision.ImageAnnotatorClient({ apiKey: visionApiKey })
        : new vision.ImageAnnotatorClient();
    }
    const [labelResult, textResult] = await Promise.all([
      visionClient.labelDetection({ image: { content: base64Image } }),
      visionClient.textDetection({ image: { content: base64Image } })
    ]);

    const labelAnnotations = labelResult[0]?.labelAnnotations || [];
    cnnDetections = labelAnnotations.map(label => ({
      label: label.description.toLowerCase(),
      confidence: label.score,
    }));

    const textAnnotations = textResult[0]?.textAnnotations || [];
    ocrTexts = textAnnotations.map(t => t.description);
    visionSuccess = true;
  } catch (visionErr) {
    logger.warn("Google Cloud Vision API call failed:", visionErr.message);
    visionError = visionErr.message;
    visionSuccess = false;
  }
})();
```

---

## F.3 Geohash Filtering Module

Geohash strings are generated, decoded, and analyzed client-side using standard Base32 encoding. A 9-cell bounding grid is compiled (center + 8 surrounding neighbor cells) to retrieve hyperlocal listings without exposing exact user coordinates.

### Implementation Snippet (`src/utils/geo.js`):
```javascript
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encodes a lat/lng pair into a geohash string.
 */
export function encodeGeohash(lat, lng, precision = 6) {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90, latMax = 90;
  let lngMin = -180, lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const lngMid = (lngMin + lngMax) / 2;
      if (lng >= lngMid) {
        idx = idx * 2 + 1;
        lngMin = lngMid;
      } else {
        idx = idx * 2;
        lngMax = lngMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        idx = idx * 2 + 1;
        latMin = latMid;
      } else {
        idx = idx * 2;
        latMax = latMid;
      }
    }
    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }
  return geohash;
}

/**
 * Calculates the geohashes of the 8 surrounding neighbor cells of a given geohash.
 */
export function getGeohashNeighbors(geohash) {
  if (!geohash) return [];
  const { lat, lng, latMin, latMax, lngMin, lngMax } = decodeGeohash(geohash);
  
  const latHeight = latMax - latMin;
  const lngWidth = lngMax - lngMin;
  const precision = geohash.length;

  const offsets = [
    [1, 0],   // North
    [-1, 0],  // South
    [0, 1],   // East
    [0, -1],  // West
    [1, 1],   // North-East
    [1, -1],  // North-West
    [-1, 1],  // South-East
    [-1, -1]  // South-West
  ];

  return offsets.map(([latOffset, lngOffset]) => {
    let nLat = lat + latOffset * latHeight;
    let nLng = lng + lngOffset * lngWidth;
    
    if (nLat > 90) nLat = 90;
    if (nLat < -90) nLat = -90;
    if (nLng > 180) nLng -= 360;
    if (nLng < -180) nLng += 360;
    
    return encodeGeohash(nLat, nLng, precision);
  });
}
```

---

## F.4 Facial Verification Module

Selfie identity and government ID biometric matching is unified in a multi-modal analysis step using Google Gemini API (`gemini-2.5-flash`). It runs face checks, quality audits (blur, glare, dark, crop), and extracts OCR names and ID numbers.

### Implementation Snippet (`functions/faceVerification.js`):
```javascript
// Unified Identity Verification helper using Google Gemini Multi-modal API
async function verifyIdentityUnified({ idImage, selfieImage, geminiApiKey }) {
  if (!geminiApiKey) throw new Error('Missing GEMINI_API_KEY credentials.');

  const cleanedId     = cleanBase64(idImage);
  const cleanedSelfie = cleanBase64(selfieImage);
  const idMime        = getMime(idImage);
  const selfieMime    = getMime(selfieImage);

  const modelCandidates = [
    GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-latest'
  ];

  let response;
  let lastError = null;
  for (const model of modelCandidates) {
    try {
      logger.info(`Sending unified verification prompt to Gemini (${model})...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      response = await axios.post(
        url,
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
                  '    "blur": boolean,\n' +
                  '    "glare": boolean,\n' +
                  '    "cropped": boolean,\n' +
                  '    "dark": boolean\n' +
                  '  },\n' +
                  '  "reason": "explanation of outcome",\n' +
                  '  "extractedData": {\n' +
                  '    "fullName": "extracted full name, or null if not found",\n' +
                  '    "idNumber": "extracted ID number exactly as printed, or null if not found",\n' +
                  '    "expiryDate": "extracted expiry date in YYYY-MM-DD format, or null if not found"\n' +
                  '  }\n' +
                  '}\n\n' +
                  'Do not include any markup other than the raw JSON.'
              },
              { inlineData: { mimeType: idMime,      data: cleanedId } },
              { inlineData: { mimeType: selfieMime,   data: cleanedSelfie } }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      );
      break;
    } catch (err) {
      logger.warn(`Gemini (${model}) verification call failed: ${err.message}`);
      lastError = err;
    }
  }

  if (!response) {
    throw new Error(`Gemini API Error: ${lastError.message}`);
  }

  const candidate = response.data?.candidates?.[0];
  const part = candidate?.content?.parts?.[0];
  if (!part || !part.text) {
    throw new Error('Gemini returned an empty response.');
  }

  return JSON.parse(part.text.trim());
}
```
