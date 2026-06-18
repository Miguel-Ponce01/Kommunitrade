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

export async function processListingImage(imageFile, listingId, userHint = null) {
  const isOnline = navigator.onLine;

  let finalResult;
  if (isOnline) {
    try {
      // Try Cloud function analysis first
      finalResult = await processWithCloud(imageFile, listingId, userHint);
    } catch (cloudError) {
      console.warn('Cloud processing failed, falling back to local client models:', cloudError);
      finalResult = await processLocally(imageFile, listingId, userHint);
    }
  } else {
    // Offline mode fallback
    finalResult = await processLocally(imageFile, listingId, userHint);
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

async function processLocally(imageFile, listingId, userHint) {
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
  const combined = await combineResultsLocally(cnnResults, validOcrLines, userHint);

  // If offline, save listing details into IndexedDB for syncing later
  if (!navigator.onLine) {
    await saveOfflineListing(listingId, combined, imageFile);
  }

  return combined;
}

async function combineResultsLocally(cnnResults, ocrResults, userHint) {
  // Rule-based parsing
  const bestCnn = cnnResults.length > 0 ? cnnResults[0] : null;
  
  // Format item name
  let title = "Unnamed Item";
  if (bestCnn && bestCnn.confidence > 0.4) {
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
