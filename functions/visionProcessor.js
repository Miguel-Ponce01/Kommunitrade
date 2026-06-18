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
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

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
  if (c.includes('food') || c.includes('drink') || c.includes('meal') || c.includes('fresh') || c.includes('bread') || c.includes('chicken') || c.includes('fruit') || c.includes('vegetable')) {
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
  if (!visionClient) {
    // Fallback if client isn't loaded
    const visionApiKey = process.env.GOOGLE_VISION_API_KEY;
    visionClient = visionApiKey 
      ? new vision.ImageAnnotatorClient({ apiKey: visionApiKey })
      : new vision.ImageAnnotatorClient();
  }

  logger.info("Executing Google Cloud Vision and Roboflow API calls...");
  const base64Image = processedBuffer.toString('base64');
  const [labelResult, textResult, rfResult] = await Promise.all([
    visionClient.labelDetection({ image: { content: base64Image } }),
    visionClient.textDetection({ image: { content: base64Image } }),
    callRoboflowCategoryDetector(base64Image, imageUrl)
  ]);

  const labelAnnotations = labelResult[0]?.labelAnnotations || [];
  const cnnDetections = labelAnnotations.map(label => ({
    label: label.description.toLowerCase(),
    confidence: label.score,
  }));

  const textAnnotations = textResult[0]?.textAnnotations || [];
  const ocrTexts = textAnnotations.map(t => t.description);

  const topLabel = cnnDetections.length > 0 ? cnnDetections[0].label : "Unnamed Item";
  const ocrTextCombined = ocrTexts.length > 0 ? ocrTexts[0] : "";

  // 3. Call DeepSeek API with Gemini Fallback
  let aiResult;
  let useGemini = false;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === "your_deepseek_key_here") {
    logger.warn("DeepSeek API key is missing or default. Routing to Gemini fallback directly...");
    useGemini = true;
  }

  if (!useGemini) {
    try {
      const aiPrompt = buildAIPrompt(cnnDetections, ocrTexts, userHint);
      logger.info("Sending prompt to DeepSeek API...");
      const deepseekResponse = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a precise listing intelligence agent. Output ONLY valid JSON.',
            },
            {
              role: 'user',
              content: aiPrompt,
            },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000 // 15s timeout
        }
      );

      let content = deepseekResponse.data.choices[0].message.content.trim();
      if (content.startsWith("```json")) {
        content = content.replace(/^```json\n?/, "").replace(/```$/, "").trim();
      } else if (content.startsWith("```")) {
        content = content.replace(/^```\n?/, "").replace(/```$/, "").trim();
      }

      aiResult = JSON.parse(content);
    } catch (dsError) {
      logger.error("DeepSeek API call failed:", dsError.message);
      if (dsError.response) {
        logger.error(`DeepSeek returned status ${dsError.response.status}:`, dsError.response.data);
      }
      
      if (geminiApiKey) {
        logger.info(`Initiating fallback to Gemini (${GEMINI_MODEL})...`);
        useGemini = true;
      } else {
        throw new Error(`DeepSeek failed and no GEMINI_API_KEY is available: ${dsError.message}`);
      }
    }
  }

  if (useGemini) {
    if (!geminiApiKey) {
      throw new Error("Both DeepSeek and Gemini API keys are un configured or failing.");
    }
    try {
      logger.info(`Sending listing refinement prompt to Gemini (${GEMINI_MODEL})...`);
      const aiPrompt = buildAIPrompt(cnnDetections, ocrTexts, userHint);
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;

      const response = await axios.post(
        geminiUrl,
        {
          contents: [{
            parts: [
              { text: aiPrompt }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const raw = response.data.candidates[0].content.parts[0].text.trim();
      let cleaned = raw;
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\n?/, "").replace(/```$/, "").trim();
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\n?/, "").replace(/```$/, "").trim();
      }
      aiResult = JSON.parse(cleaned);
    } catch (geminiError) {
      logger.error(`Gemini (${GEMINI_MODEL}) fallback failed:`, geminiError.message);
      throw new Error(`Listing analysis failed on both DeepSeek and Gemini: ${geminiError.message}`);
    }
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
      success: true,
      text: ocrTextCombined,
      confidence: 1.0
    },
    cnn: {
      success: true,
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
    }
  };
}

function buildAIPrompt(cnnDetections, ocrTexts, userHint) {
  const cnnStr = JSON.stringify(cnnDetections.slice(0, 5));
  const ocrStr = JSON.stringify(ocrTexts.slice(0, 20));
  const hintStr = userHint ? `User selected category hint: "${userHint}"` : '';

  return `You are a Listing Intelligence Agent. Combine CNN labels and OCR text.

CNN detections (label + confidence):
${cnnStr}

OCR extracted text (segments):
${ocrStr}

${hintStr}

Your task:
1. Synthesize visual CNN descriptors and textual OCR elements to identify the specific item.
2. In the "title", generate a clean, professional, and descriptive title (max 60 chars). Include key details like brand name, model, size, color if clear.
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

Output format:
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
- No full sentences.
`;
}

module.exports = { processImageWithVisionAndAI };
