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

// Extract top class recursively from Roboflow response
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
  return topClass;
}

// Map Roboflow category labels to KomuniTrade category IDs
function mapRoboflowCategory(className) {
  if (!className) return 'Other';
  const c = className.toLowerCase().trim();
  
  if (c.includes('electronic') || c.includes('phone') || c.includes('laptop') || c.includes('computer') || c.includes('gadget') || c.includes('camera') || c.includes('watch') || c.includes('smartwatch') || c.includes('wearable')) {
    return 'Electronics';
  }
  if (c.includes('cloth') || c.includes('shirt') || c.includes('pants') || c.includes('shoe') || c.includes('dress') || c.includes('apparel')) {
    return 'Clothing';
  }
  if (c.includes('book') || c.includes('school') || c.includes('media') || c.includes('textbook')) {
    return 'Books & Media';
  }
  if (c.includes('furniture') || c.includes('chair') || c.includes('table') || c.includes('sofa') || c.includes('bed')) {
    return 'Furniture';
  }
  if (c.includes('home') || c.includes('living') || c.includes('appliance') || c.includes('kitchen') || c.includes('decor') || c.includes('fan') || c.includes('refrigerator') || c.includes('microwave') || c.includes('oven') || c.includes('washing machine')) {
    return 'Appliances';
  }
  if (c.includes('vehicle') || c.includes('car') || c.includes('motor') || c.includes('bike') || c.includes('cycle') || c.includes('automotive')) {
    return 'Automotive';
  }
  
  const mapping = {
    'electronics': 'Electronics',
    'home & living': 'Appliances',
    'books & school': 'Books & Media',
    'clothing': 'Clothing',
    'furniture': 'Furniture',
    'vehicles': 'Automotive',
    'appliances': 'Appliances'
  };
  
  return mapping[c] || 'Other';
}

// Call Roboflow category detector workflow API securely server-side
async function callRoboflowCategoryDetector(base64Image) {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) {
    logger.warn("ROBOFLOW_API_KEY is missing in backend environment.");
    return null;
  }
  try {
    const response = await axios.post(
      'https://serverless.roboflow.com/anthons-workspace/workflows/kommunitrade-product-category-detector-1780295212880',
      {
        api_key: apiKey,
        inputs: {
          image: {
            type: "base64",
            value: base64Image
          }
        }
      },
      { timeout: 10000 } // 10s timeout
    );
    
    const result = response.data;
    const topClass = extractTopClass(result);
    return {
      className: topClass,
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
    callRoboflowCategoryDetector(base64Image)
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
        logger.info("Initiating fallback to Gemini 1.5 Flash...");
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
      logger.info("Sending listing refinement prompt to Gemini 1.5 Flash...");
      const aiPrompt = buildAIPrompt(cnnDetections, ocrTexts, userHint);
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

      const response = await axios.post(
        geminiUrl,
        {
          contents: [{
            parts: [
              { text: aiPrompt }
            ]
          }]
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const raw = response.data.candidates[0].content.parts[0].text.trim();
      aiResult = JSON.parse(raw);
    } catch (geminiError) {
      logger.error("Gemini 1.5 Flash fallback failed:", geminiError.message);
      throw new Error(`Listing analysis failed on both DeepSeek and Gemini: ${geminiError.message}`);
    }
  }

  let title = aiResult.title || topLabel || "Unnamed Item";
  let category = aiResult.category || "Other";
  let tagsList = Array.isArray(aiResult.tags) ? aiResult.tags : [];

  if (rfResult) {
    const { className, category: roboflowCategory } = rfResult;
    if (roboflowCategory && roboflowCategory !== 'Other') {
      category = roboflowCategory;
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
        tags: tagsList,
        suggestedPrice: Number(aiResult.suggestedPrice) || 0
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
3. Choose the most fitting category from: Electronics, Clothing, Books & Media, Furniture, Appliances, Real Estate, Automotive, Other.
4. Generate 3 to 5 tags. Make sure the tags capture specific attributes like the brand, object name, color, and category.
5. Provide a realistic suggested price in PHP (Philippine Pesos) if you can estimate it from the item name/brand/class. If not, default to 0.

Output format:
{
  "title": "string",
  "category": "Electronics|Clothing|Books & Media|Furniture|Appliances|Real Estate|Automotive|Other",
  "tags": ["tag1", "tag2"],
  "suggestedPrice": 0
}

Rules:
- Max 5 tags.
- No full sentences.
`;
}

module.exports = { processImageWithVisionAndAI };
