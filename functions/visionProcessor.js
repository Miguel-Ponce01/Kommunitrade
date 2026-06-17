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

  // 2. Call Google Cloud Vision (label detection + text detection)
  if (!visionClient) {
    // Fallback if client isn't loaded
    const visionApiKey = process.env.GOOGLE_VISION_API_KEY;
    visionClient = visionApiKey 
      ? new vision.ImageAnnotatorClient({ apiKey: visionApiKey })
      : new vision.ImageAnnotatorClient();
  }

  logger.info("Executing Google Cloud Vision API call...");
  const [labelResult, textResult] = await Promise.all([
    visionClient.labelDetection({ image: { content: processedBuffer.toString('base64') } }),
    visionClient.textDetection({ image: { content: processedBuffer.toString('base64') } }),
  ]);

  const cnnDetections = labelResult[0].labelAnnotations.map(label => ({
    label: label.description.toLowerCase(),
    confidence: label.score,
  }));

  const ocrTexts = textResult[0].textAnnotations
    ? textResult[0].textAnnotations.map(t => t.description)
    : [];

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
          }],
          generationConfig: { responseMimeType: 'application/json' }
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
        title: aiResult.title || topLabel || "Unnamed Item",
        category: aiResult.category || "Other",
        tags: Array.isArray(aiResult.tags) ? aiResult.tags : [],
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
