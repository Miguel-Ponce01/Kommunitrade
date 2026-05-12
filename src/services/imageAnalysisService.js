import { TRENDING_KEYWORDS } from '../data/trendingKeywords';

// Helper to dynamically load external scripts
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// CNN Model Cache
let mobilenetModel = null;

// Load MobileNet Model (once, reuse) via CDN
export const loadModel = async () => {
  if (!mobilenetModel) {
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js');
    mobilenetModel = await window.mobilenet.load();
  }
  return mobilenetModel;
};

// Detect Object in Image (CNN)
export const detectObject = async (imageElement) => {
  try {
    const model = await loadModel();
    const predictions = await model.classify(imageElement);
    return {
      success: true,
      topPrediction: predictions[0],
      allPredictions: predictions
    };
  } catch (error) {
    console.error('CNN classification failed:', error);
    return { success: false, error: error.message };
  }
};

// Extract Text from Image (OCR) via CDN
export const extractText = async (imageFile) => {
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
    const result = await window.Tesseract.recognize(
      imageFile,
      'eng',
      {
        logger: (m) => console.log(m) // Progress tracking
      }
    );
    return {
      success: true,
      text: result.data.text,
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return { success: false, error: error.message };
  }
};

// Combined Analysis (OCR + CNN)
export const analyzeImage = async (imageFile, imageElement) => {
  const [ocrResult, cnnResult] = await Promise.all([
    extractText(imageFile),
    detectObject(imageElement)
  ]);

  return {
    ocr: ocrResult,
    cnn: cnnResult,
    generatedTitle: generateTitle(ocrResult, cnnResult),
    generatedCategory: mapCnnToCategory(cnnResult, ocrResult),
    generatedTags: generateTags(ocrResult, cnnResult)
  };
};

// Helper: Generate title from OCR + CNN
const generateTitle = (ocrResult, cnnResult) => {
  let title = '';
  
  // Extract first meaningful line from OCR
  if (ocrResult.success && ocrResult.text) {
    const lines = ocrResult.text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      title = lines[0].trim().substring(0, 60);
    }
  }
  
  // Add CNN classification if available
  if (cnnResult.success && cnnResult.topPrediction) {
    const category = cnnResult.topPrediction.className;
    if (!title.toLowerCase().includes(category.toLowerCase())) {
      title = title ? `${title} (${category})` : category;
    }
  }
  
  return title || "Unnamed Item";
};

// Helper: Map CNN prediction and OCR text to categories
const mapCnnToCategory = (cnnResult, ocrResult) => {
  let className = '';
  if (cnnResult.success) {
    className = cnnResult.topPrediction.className.toLowerCase();
  }
  
  let ocrText = '';
  if (ocrResult.success && ocrResult.text) {
    ocrText = ocrResult.text.toLowerCase();
  }
  
  const categoryMap = {
    'Electronics': ['smartphone', 'laptop', 'computer', 'tv', 'television', 'iphone', 'samsung', 'redmi', 'poco', 'realme', 'vivo', 'oppo', 'pixel', 'gaming pc', 'rtx', 'ryzen', 'intel', 'keyboard', 'monitor', 'ps5', 'switch', 'deck'],
    'Clothing': ['shirt', 'dress', 'jean', 'pants', 'shoe', 'sneaker', 'hoodie', 'jersey', 'cargo', 'jorts', 'denim', 'jacket', 'puffer', 'flannel', 'polo', 'tank top', 'tracksuit'],
    'Books & Media': ['book', 'magazine'],
    'Furniture': ['furniture', 'chair', 'table', 'desk', 'sofa'],
    'Appliances': ['refrigerator', 'microwave', 'oven', 'washing machine']
  };
  
  // Check OCR text first (often more specific for brands/models)
  for (const [category, keywords] of Object.entries(categoryMap)) {
    for (const keyword of keywords) {
      if (ocrText.includes(keyword)) return category;
    }
  }
  
  // Fallback to CNN classification
  for (const [category, keywords] of Object.entries(categoryMap)) {
    for (const keyword of keywords) {
      if (className.includes(keyword)) return category;
    }
  }
  
  return 'Other';
};

// Helper: Generate tags
const generateTags = (ocrResult, cnnResult) => {
  const tags = new Set();
  
  // Add CNN label
  if (cnnResult.success && cnnResult.topPrediction) {
    tags.add(cnnResult.topPrediction.className.split(',')[0].toLowerCase());
  }
  
  // Extract potential tags from OCR text using trending keywords
  if (ocrResult.success && ocrResult.text) {
    const ocrText = ocrResult.text.toLowerCase();
    
    // Check all categories of keywords
    for (const [key, list] of Object.entries(TRENDING_KEYWORDS)) {
      list.forEach(keyword => {
        if (ocrText.includes(keyword.toLowerCase())) {
          tags.add(keyword.toLowerCase());
        }
      });
    }
    
    // Also extract potential price (numbers with currency)
    const words = ocrText.split(/\s+/);
    words.forEach(word => {
      if (word.match(/\d+/) && word.length < 10 && word.length > 2) {
        // Avoid adding simple short numbers as tags unless they look like models
        if (word.match(/^[a-zA-Z]*\d+[a-zA-Z]*$/)) tags.add(word);
      }
    });
  }
  
  return Array.from(tags).slice(0, 8); // Allow up to 8 tags
};
