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
    generatedCategory: mapCnnToCategory(cnnResult),
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

// Helper: Map CNN prediction to your categories
const mapCnnToCategory = (cnnResult) => {
  if (!cnnResult.success) return 'Other';
  
  const className = cnnResult.topPrediction.className.toLowerCase();
  
  const categoryMap = {
    'smartphone': 'Electronics',
    'laptop': 'Electronics',
    'computer': 'Electronics',
    'tv': 'Electronics',
    'television': 'Electronics',
    'shirt': 'Clothing',
    'dress': 'Clothing',
    'jean': 'Clothing',
    'pants': 'Clothing',
    'shoe': 'Clothing',
    'sneaker': 'Clothing',
    'book': 'Books & Media',
    'magazine': 'Books & Media',
    'furniture': 'Furniture',
    'chair': 'Furniture',
    'table': 'Furniture',
    'desk': 'Furniture',
    'sofa': 'Furniture',
    'refrigerator': 'Appliances',
    'microwave': 'Appliances',
    'oven': 'Appliances',
    'washing machine': 'Appliances'
  };
  
  for (const [key, category] of Object.entries(categoryMap)) {
    if (className.includes(key)) return category;
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
  
  // Extract potential tags from OCR text
  if (ocrResult.success && ocrResult.text) {
    const words = ocrResult.text.split(/\s+/);
    const commonBrands = ['apple', 'samsung', 'nike', 'adidas', 'canon', 'sony', 'lg', 'hp', 'dell'];
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      if (commonBrands.includes(lowerWord)) tags.add(lowerWord);
      // Extract potential price (numbers with currency)
      if (lowerWord.match(/\d+/) && lowerWord.length < 10) tags.add('item');
    });
  }
  
  return Array.from(tags).slice(0, 5);
};
