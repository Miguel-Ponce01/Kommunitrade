const vision = require('@google-cloud/vision');
const axios = require('axios');
const sharp = require('sharp');
const { logger } = require('firebase-functions');

// Initialize Google Vision Client
let visionClient;
try {
  // Use the API key provided in the .env file
  const visionApiKey = process.env.GOOGLE_VISION_API_KEY;
  if (visionApiKey) {
    visionClient = new vision.ImageAnnotatorClient({ apiKey: visionApiKey });
  } else {
    // Fallback to Application Default Credentials
    visionClient = new vision.ImageAnnotatorClient();
  }
} catch (err) {
  logger.error("Failed to initialize Vision Annotator client:", err);
}

// DeepSeek API Configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Gemini API Configuration
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Extract top class and confidence recursively from Roboflow response
function extractTopClass(obj) {
  let topClass = null;
  let maxConfidence = -1;

  function traverse(node) {
    if (!node || typeof node !== 'object') return;
    
    if (typeof node.class === 'string' && typeof node.confidence === 'number') {
      if (node.confidence > maxConfidence) {
        maxConfidence = node.confidence;
        topClass = node.class;
      }
    }
    
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        traverse(node[key]);
      }
    }
  }

  traverse(obj);
  return { topClass, maxConfidence: maxConfidence > -1 ? maxConfidence : 0 };
}

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
    'bouillon', 'garni', 'loaf', 'nut', 'nuts', 'baguette', 'croissant', 'chicory', 'cabbage', 'potato', 'potatoes',
    'strawberry', 'strawberries', 'tart', 'apple', 'orange', 'banana', 'egg', 'beef', 'beer', 'butter', 'cheese',
    'chocolate', 'coconut', 'corn', 'cucumber', 'eggplant', 'fish', 'garlic', 'pineapple', 'tomato', 'avocado',
    'broccoli', 'cauliflower', 'durian', 'snack', 'candy', 'lechon', 'burger', 'sandwich', 'pizza', 'rice',
    'noodle', 'pasta', 'soup', 'stew', 'milk', 'yogurt', 'cream', 'sauce', 'spices', 'herb', 'herbs', 'wine',
    'cider', 'champagne', 'juice', 'tea', 'coffee', 'espresso', 'cookie', 'cookies', 'muffin', 'pastry',
    'biscuit', 'pie', 'pudding', 'donut', 'bun', 'roll', 'ham', 'bacon', 'sausage', 'pork', 'turkey', 'duck',
    'lamb', 'shrimp', 'crab', 'lobster', 'oyster', 'mussel', 'clam', 'squid', 'octopus', 'tuna', 'salmon',
    'onion', 'ginger', 'chili', 'pear', 'peach', 'plum', 'cherry', 'grape', 'berry', 'berries', 'lemon', 'lime',
    'mango', 'papaya', 'melon', 'watermelon', 'fig', 'date', 'apricot', 'raisin', 'currant', 'almond', 'walnut',
    'pecan', 'cashew', 'pistachio', 'peanut', 'hazelnut', 'chestnut', 'bean', 'beans', 'pea', 'peas', 'lentil',
    'tofu', 'soy', 'honey', 'maple', 'jam', 'jelly', 'marmalade', 'mustard', 'ketchup', 'mayonnaise', 'hummus',
    'pesto', 'salsa', 'guacamole', 'curry', 'gravy', 'dressing', 'dip', 'spread', 'water', 'olive', 'olives'
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
    'vehicle': 'Vehicles',
    'automotive': 'Vehicles',
    'appliances': 'House',
    'appliance': 'House',
    'waste': 'Waste',
    'recyclables': 'Waste',
    'food': 'Food',
    'food & drinks': 'Food',
    'service': 'Service',
    'services': 'Service'
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
      { timeout: 10000 } // 10s timeout
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

async function processImageWithVisionAndAI({ imageUrl, imageBuffer, userHint }) {
  // 1. Prepare image for Vision API and compress using sharp
  let processedBuffer;
  
  try {
    if (imageBuffer) {
      // Compress and resize base64 buffer
      processedBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 80 })
        .resize(1024, 1024, { fit: 'inside' })
        .toBuffer();
    } else if (imageUrl) {
      // Download image URL and compress
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      processedBuffer = await sharp(Buffer.from(response.data))
        .jpeg({ quality: 80 })
        .resize(1024, 1024, { fit: 'inside' })
        .toBuffer();
    }
  } catch (compressErr) {
    logger.warn("Image compression failed, utilizing raw input instead:", compressErr.message);
    processedBuffer = imageBuffer || Buffer.from((await axios.get(imageUrl, { responseType: 'arraybuffer' })).data);
  }

  // 2. Call Google Cloud Vision and Roboflow in parallel
  let cnnDetections = [];
  let ocrTexts = [];
  let visionSuccess = false;
  let visionError = null;

  logger.info("Executing Google Cloud Vision and Roboflow API calls...");
  const base64Image = processedBuffer.toString('base64');

  const visionPromise = (async () => {
    try {
      if (!visionClient) {
        // Fallback if client isn't loaded
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
      logger.warn("Google Cloud Vision API call failed, continuing with fallback path:", visionErr.message);
      visionError = visionErr.message;
      visionSuccess = false;
    }
  })();

  const [_, rfResult] = await Promise.all([
    visionPromise,
    callRoboflowCategoryDetector(base64Image, imageUrl)
  ]);

  const topLabel = cnnDetections.length > 0 ? cnnDetections[0].label : "Unnamed Item";
  const ocrTextCombined = ocrTexts.length > 0 ? ocrTexts[0] : "";

  // 3. Call Google Gemini API directly as primary
  let aiResult = null;
  let geminiSuccess = false;
  let geminiErrorMsg = null;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    const aiPrompt = buildAIPrompt(cnnDetections, ocrTexts, userHint);
    
    // Valid model candidates only
    const modelCandidates = [...new Set([
      GEMINI_MODEL,
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ])];

    let lastError = null;
    for (const model of modelCandidates) {
      try {
        logger.info(`Sending listing refinement prompt to Gemini (${model}) as primary parser...`);
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

        const response = await axios.post(
          geminiUrl,
          {
            contents: [{
              parts: [
                { text: aiPrompt },
                { inlineData: { mimeType: "image/jpeg", data: base64Image } }
              ]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
        );

        const raw = response.data.candidates[0].content.parts[0].text.trim();
        let cleaned = raw;
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.replace(/^```json\n?/, "").replace(/```$/, "").trim();
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```\n?/, "").replace(/```$/, "").trim();
        }
        aiResult = JSON.parse(cleaned);
        geminiSuccess = true;
        break; // Success!
      } catch (geminiError) {
        logger.warn(`Gemini (${model}) call failed: ${geminiError.message}`);
        lastError = geminiError;
      }
    }

    if (!aiResult) {
      logger.error("All Gemini model candidates failed.");
      geminiErrorMsg = lastError ? lastError.message : "Gemini failed";
    }
  } else {
    logger.warn("GEMINI_API_KEY is missing in backend environment.");
    geminiErrorMsg = "GEMINI_API_KEY is missing";
  }

  // Fallback defaults on AI failure
  if (!aiResult) {
    aiResult = {
      title: topLabel || "Unnamed Item",
      category: "Other",
      subcategory: null,
      confidence_notes: "AI analysis was unavailable.",
      foodExpiryDays: null,
      tags: cnnDetections.slice(0, 3).map(d => d.label) || [],
      suggestedPrice: 0
    };
  }

  let title = (aiResult && aiResult.title) || topLabel || "Unnamed Item";
  let category = (aiResult && aiResult.category) || "Other";
  let tagsList = (aiResult && Array.isArray(aiResult.tags)) ? aiResult.tags : [];

  if (rfResult) {
    const { className, confidence, category: roboflowCategory } = rfResult;
    if (roboflowCategory && roboflowCategory !== 'Other' && confidence >= 0.65) {
      category = roboflowCategory;
    } else {
      category = (aiResult && aiResult.category) || "Other";
    }
    if (className) {
      if (title === "Unnamed Item" || !title) {
        title = className.charAt(0).toUpperCase() + className.slice(1);
      }
      if (!tagsList.includes(className.toLowerCase())) {
        tagsList.push(className.toLowerCase());
      }
      tagsList = tagsList.slice(0, 5);
    }
  }

  return {
    success: true,
    ocr: {
      success: visionSuccess,
      text: ocrTextCombined,
      confidence: 1.0
    },
    cnn: {
      success: visionSuccess,
      topPrediction: cnnDetections.length > 0 ? cnnDetections[0] : null,
      allPredictions: cnnDetections
    },
    deepseek: {
      success: true,
      data: {
        title: title,
        category: category,
        subcategory: (aiResult && aiResult.subcategory) || null,
        confidenceNotes: (aiResult && aiResult.confidence_notes) || null,
        roboflowCategory: rfResult ? rfResult.category : null,
        roboflowConfidence: rfResult ? rfResult.confidence : null,
        tags: tagsList,
        suggestedPrice: (aiResult && Number(aiResult.suggestedPrice)) || 0,
        foodExpiryDays: (aiResult && aiResult.foodExpiryDays) || null
      }
    },
    apiHealth: {
      googleVision: visionSuccess ? 'SUCCESS' : 'FAILED',
      googleVisionError: visionError || null,
      roboflow: rfResult ? 'SUCCESS' : 'FAILED',
      gemini: geminiSuccess ? 'SUCCESS' : 'FAILED',
      geminiError: geminiErrorMsg || null,
      deepseek: 'DEPRECATED'
    }
  };
}

function buildAIPrompt(cnnDetections, ocrTexts, userHint) {
  const cnnStr = cnnDetections && cnnDetections.length > 0 ? JSON.stringify(cnnDetections.slice(0, 5)) : 'None';
  const ocrStr = ocrTexts && ocrTexts.length > 0 ? JSON.stringify(ocrTexts.slice(0, 20)) : 'None';
  const hintStr = userHint ? `User selected category hint: "${userHint}"` : '';

  return `You are a Listing Intelligence Agent. Analyze the attached item image, along with any optional CNN labels and OCR text.

CNN detections (label + confidence):
${cnnStr}

OCR extracted text (segments):
${ocrStr}

${hintStr}

Your task:
1. Synthesize visual features of the item image, CNN labels, and OCR text to determine exactly what the item is.
2. In the "title", generate a clean, professional, and descriptive title (max 60 chars). Include key details like brand name, model, size, color if clear from the image.
3. Choose the most fitting category strictly from this list of database category IDs:
   - Electronic (Electronics, phones, computers, gadgets, TVs, keyboards, mouse, cameras, headsets, webcams)
   - House (Home decor, kitchenware, fans, refrigerators, microwaves, ovens, washing machines, home & living)
   - Books (Books, school textbooks, school notebooks, school supplies, media)
   - Clothing (Clothing, shirts, pants, shoes, bags, preloved apparel)
   - Food (Food items, drinks, snacks, baked goods, fresh foods, fruits, chicken, banana bread)
   - Service (Plumbing, tutoring, cleaning, services)
   - Furniture (Chairs, tables, desks, sofas, beds, cabinets)
   - Vehicles (Cars, motorcycles, bikes, scooters, automotive parts)
   - Waste (Recyclable materials, junk, metal scraps, plastic bottles, cartons)
   - Other (Unclassified objects)
4. Choose a specific subcategory label (e.g. ukay-ukay, smartphone, textbook, durian, sofa, etc.) and specify it in the "subcategory" key.
5. Provide a brief sentence or phrase in the "confidence_notes" key explaining the visual rationale or text evidence for the categorization choice.
6. If you classify the item as "Food", estimate the number of days until the food expires based on its typical freshness and description (e.g., fresh bread, cooked meals). Suggest either 1 (expires tomorrow), 2 (expires day after tomorrow), or 3 (expires in 3 days) in the "foodExpiryDays" key. For non-food items, set "foodExpiryDays" to null.
7. Generate 3 to 5 tags. Make sure the tags capture specific attributes like the brand, object name, color, and category.
8. Provide a realistic suggested price in PHP (Philippine Pesos) if you can estimate it from the item name/brand/class. If not, default to 0.

Output format (JSON):
{
  "title": "string",
  "category": "Electronic|House|Books|Clothing|Food|Service|Furniture|Vehicles|Waste|Other",
  "subcategory": "string",
  "confidence_notes": "string",
  "foodExpiryDays": 1|2|3|null,
  "tags": ["tag1", "tag2"],
  "suggestedPrice": 0
}

Rules:
- Max 5 tags.
- No full sentences in tags.
- Output ONLY the raw JSON string structure, no markdown formatting.
`;
}

module.exports = { processImageWithVisionAndAI };
