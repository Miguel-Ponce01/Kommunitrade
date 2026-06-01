import { runCNN, runOCR } from './offlineModels';
import { saveOfflineListing } from './syncQueue';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Heuristics categories list
const TRENDING_KEYWORDS = {
  'Electronics': ['smartphone', 'laptop', 'computer', 'tv', 'television', 'iphone', 'samsung', 'redmi', 'poco', 'realme', 'vivo', 'oppo', 'pixel', 'gaming pc', 'rtx', 'ryzen', 'intel', 'keyboard', 'monitor', 'ps5', 'switch', 'deck', 'watch', 'smartwatch', 'stopwatch', 'wearable', 'iwatch', 'headphone', 'headphones', 'earphone', 'earphones', 'headset', 'audio', 'speaker', 'sound', 'camera', 'lens', 'charger', 'cable', 'battery', 'tablet', 'ipad', 'mouse', 'router', 'modem'],
  'Clothing': ['shirt', 'dress', 'jean', 'pants', 'shoe', 'sneaker', 'hoodie', 'jersey', 'cargo', 'jorts', 'denim', 'jacket', 'puffer', 'flannel', 'polo', 'tank top', 'tracksuit'],
  'Books & Media': ['book', 'magazine'],
  'Furniture': ['furniture', 'chair', 'table', 'desk', 'sofa'],
  'Appliances': ['refrigerator', 'microwave', 'oven', 'washing machine']
};

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
    return 'Electronic';
  }
  if (c.includes('cloth') || c.includes('shirt') || c.includes('pants') || c.includes('shoe') || c.includes('dress') || c.includes('apparel')) {
    return 'Clothing';
  }
  if (c.includes('book') || c.includes('school') || c.includes('media') || c.includes('textbook')) {
    return 'Books';
  }
  if (c.includes('furniture') || c.includes('chair') || c.includes('table') || c.includes('sofa') || c.includes('bed')) {
    return 'Furniture';
  }
  if (c.includes('food') || c.includes('drink') || c.includes('beverage') || c.includes('snack') || c.includes('meal')) {
    return 'Food';
  }
  if (c.includes('service') || c.includes('repair') || c.includes('cleaning') || c.includes('plumb')) {
    return 'Service';
  }
  if (c.includes('vehicle') || c.includes('car') || c.includes('motor') || c.includes('bike') || c.includes('cycle')) {
    return 'Vehicles';
  }
  if (c.includes('waste') || c.includes('recycle') || c.includes('scrap') || c.includes('plastic')) {
    return 'Waste';
  }
  if (c.includes('home') || c.includes('living') || c.includes('appliance') || c.includes('kitchen') || c.includes('decor') || c.includes('fan')) {
    return 'House';
  }
  
  const mapping = {
    'electronics': 'Electronic',
    'home & living': 'House',
    'books & school': 'Books',
    'clothing': 'Clothing',
    'food & drinks': 'Food',
    'services': 'Service',
    'furniture': 'Furniture',
    'vehicles': 'Vehicles',
    'recyclables': 'Waste'
  };
  
  return mapping[c] || 'Other';
}

// Call Roboflow category detector workflow API
async function callRoboflowCategoryDetector(base64Image) {
  try {
    const response = await fetch('https://serverless.roboflow.com/anthons-workspace/workflows/kommunitrade-product-category-detector-1780295212880', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: '0iF62YZkgTJUA9R0k8NP',
        inputs: {
          "image": {
            "type": "base64",
            "value": base64Image
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Roboflow API returned status ${response.status}`);
    }

    const result = await response.json();
    console.log("Roboflow Category Detection Result:", result);
    
    const topClass = extractTopClass(result);
    return {
      className: topClass,
      category: mapRoboflowCategory(topClass)
    };
  } catch (error) {
    console.warn("Roboflow Category Detector failed:", error);
    return null;
  }
}

export async function processListingImage(imageFile, listingId, userHint = null) {
  const isOnline = navigator.onLine;
  let roboflowCategory = null;
  let roboflowClass = null;

  if (isOnline) {
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      const rfResult = await callRoboflowCategoryDetector(base64);
      if (rfResult) {
        roboflowCategory = rfResult.category;
        roboflowClass = rfResult.className;
      }
    } catch (err) {
      console.warn("Failed to get Roboflow prediction:", err);
    }
  }

  let finalResult;
  if (isOnline) {
    try {
      // Try Cloud function analysis first
      finalResult = await processWithCloud(imageFile, listingId, userHint);
    } catch (cloudError) {
      console.warn('Cloud processing failed, falling back to local client models:', cloudError);
      finalResult = await processLocally(imageFile, listingId, userHint, roboflowClass);
    }
  } else {
    // Offline mode fallback
    finalResult = await processLocally(imageFile, listingId, userHint, roboflowClass);
  }

  // Override/refine the category if Roboflow returned a valid prediction
  if (roboflowCategory && roboflowCategory !== 'Other') {
    if (finalResult && finalResult.deepseek && finalResult.deepseek.data) {
      finalResult.deepseek.data.category = roboflowCategory;
    }
  }

  // Override title and inject class into tags if Roboflow found a clean class name
  if (roboflowClass) {
    if (finalResult && finalResult.deepseek && finalResult.deepseek.data) {
      if (finalResult.deepseek.data.title === "Unnamed Item" || !finalResult.deepseek.data.title) {
        finalResult.deepseek.data.title = roboflowClass.charAt(0).toUpperCase() + roboflowClass.slice(1);
      }
      const tagsList = finalResult.deepseek.data.tags || [];
      if (!tagsList.includes(roboflowClass.toLowerCase())) {
        tagsList.push(roboflowClass.toLowerCase());
      }
      finalResult.deepseek.data.tags = tagsList.slice(0, 5);
    }
  }

  return finalResult;
}

async function processWithCloud(imageFile, listingId, userHint) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      const functions = getFunctions();
      
      // Call renamed processListingImage Cloud Function
      const processImageFn = httpsCallable(functions, 'processListingImage');

      try {
        const result = await processImageFn({
          imageBase64: base64,
          listingId,
          userHint
        });
        resolve(result.data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}

async function processLocally(imageFile, listingId, userHint, roboflowClass = null) {
  // Create image element for CNN
  const imageUrl = URL.createObjectURL(imageFile);
  const img = new Image();

  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = imageUrl;
  });

  // Run CNN and OCR in parallel
  const [cnnResults, ocrResults] = await Promise.all([
    runCNN(img),
    runOCR(imageFile)
  ]);

  URL.revokeObjectURL(imageUrl);

  // Clean up OCR results line-by-line using our robust filter
  const validOcrLines = ocrResults.map(line => {
    const trimmed = line.trim();
    const cleaned = trimmed.replace(/[^a-zA-Z0-9]/g, '');
    if (cleaned.length >= 3) {
      return trimmed;
    }
    return null;
  }).filter(Boolean);

  // Combine results locally
  const combined = await combineResultsLocally(cnnResults, validOcrLines, userHint, roboflowClass);

  // If offline, save listing details into IndexedDB for syncing later
  if (!navigator.onLine) {
    await saveOfflineListing(listingId, combined, imageFile);
  }

  return combined;
}

async function combineResultsLocally(cnnResults, ocrResults, userHint, roboflowClass = null) {
  // If user is online, attempt to call DeepSeek Client-side
  if (navigator.onLine) {
    try {
      return await callDeepSeekLocal(cnnResults, ocrResults, userHint);
    } catch (err) {
      console.warn('Local DeepSeek API call failed, falling back to rule-based parser:', err);
    }
  }

  // Rule-based parsing
  const bestCnn = cnnResults.length > 0 ? cnnResults[0] : null;
  
  // Format item name
  let title = roboflowClass ? (roboflowClass.charAt(0).toUpperCase() + roboflowClass.slice(1)) : "Unnamed Item";
  if (title === "Unnamed Item" && bestCnn && bestCnn.confidence > 0.4) {
    const classNameClean = bestCnn.label.split(',')[0].trim();
    title = classNameClean.charAt(0).toUpperCase() + classNameClean.slice(1);
  }
  if (ocrResults.length > 0 && title === "Unnamed Item") {
    title = ocrResults[0];
  }

  // Categories Map Heuristics
  let category = userHint || 'Other';
  const checkText = (title + ' ' + ocrResults.join(' ')).toLowerCase();
  
  for (const [catName, keywords] of Object.entries(TRENDING_KEYWORDS)) {
    for (const kw of keywords) {
      if (checkText.includes(kw)) {
        category = catName;
        break;
      }
    }
    if (category !== 'Other') break;
  }

  // Generate descriptive tags
  const tags = new Set();
  if (roboflowClass) {
    tags.add(roboflowClass.toLowerCase());
  }
  
  // Clean CNN Predictions into tags
  cnnResults.forEach(pred => {
    if (pred.confidence >= 0.10) {
      pred.label.split(',').forEach(label => tags.add(label.trim().toLowerCase()));
    }
  });

  // Extract common color descriptions
  const colorList = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'grey', 'gray', 'brown', 'silver', 'gold'];
  ocrResults.forEach(text => {
    const cleanText = text.toLowerCase();
    colorList.forEach(color => {
      if (cleanText.includes(color)) tags.add(color);
    });
  });

  // Extract common brands
  const brandList = ['apple', 'samsung', 'sony', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'nike', 'adidas', 'puma', 'uniqlo', 'zara', 'h&m', 'levis', 'canon', 'nikon', 'lg', 'xiaomi', 'oppo', 'vivo', 'realme'];
  ocrResults.forEach(text => {
    const cleanText = text.toLowerCase();
    brandList.forEach(brand => {
      if (cleanText.includes(brand)) tags.add(brand);
    });
  });

  return {
    ocr: {
      success: true,
      text: ocrResults.join('\n'),
      confidence: 1.0
    },
    cnn: {
      success: true,
      topPrediction: bestCnn,
      allPredictions: cnnResults
    },
    deepseek: {
      success: true,
      data: {
        title: title,
        category: category,
        tags: Array.from(tags).slice(0, 5),
        suggestedPrice: 0
      }
    },
    processedOffline: !navigator.onLine
  };
}

async function callDeepSeekLocal(cnnResults, ocrResults, userHint) {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === "your_deepseek_key_here") {
    throw new Error("Local DeepSeek key missing.");
  }

  const cnnStr = JSON.stringify(cnnResults.slice(0, 5));
  const ocrStr = JSON.stringify(ocrResults.slice(0, 20));
  const hintStr = userHint ? `User selected category hint: "${userHint}"` : '';

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You combine CNN and OCR for product listings. Output ONLY valid JSON.',
        },
        {
          role: 'user',
          content: `CNN: ${cnnStr}\nOCR: ${ocrStr}\nHint: ${hintStr}\n\nOutput format:\n{\n  "title": "optimized title",\n  "category": "Electronics|Clothing|Books & Media|Furniture|Appliances|Real Estate|Automotive|Other",\n  "tags": ["tag1", "tag2"],\n  "suggestedPrice": 0\n}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const raw = await response.json();
  const data = JSON.parse(raw.choices[0].message.content);

  return {
    ocr: {
      success: true,
      text: ocrResults.join('\n'),
      confidence: 1.0
    },
    cnn: {
      success: true,
      topPrediction: cnnResults[0] || null,
      allPredictions: cnnResults
    },
    deepseek: {
      success: true,
      data: {
        title: data.title || "Unnamed Item",
        category: data.category || "Other",
        tags: Array.isArray(data.tags) ? data.tags : [],
        suggestedPrice: Number(data.suggestedPrice) || 0
      }
    }
  };
}
