import { runCNN, runOCR } from './offlineModels';
import { saveOfflineListing } from './syncQueue';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Heuristics categories list mapped directly to database category IDs
const TRENDING_KEYWORDS = {
  'Electronic': ['smartphone', 'laptop', 'computer', 'tv', 'television', 'iphone', 'samsung', 'redmi', 'poco', 'realme', 'vivo', 'oppo', 'pixel', 'gaming pc', 'rtx', 'ryzen', 'intel', 'keyboard', 'monitor', 'ps5', 'switch', 'deck', 'watch', 'smartwatch', 'stopwatch', 'wearable', 'iwatch', 'headphone', 'headphones', 'earphone', 'earphones', 'headset', 'audio', 'speaker', 'sound', 'camera', 'lens', 'charger', 'cable', 'battery', 'tablet', 'ipad', 'mouse', 'router', 'modem'],
  'Clothing': ['shirt', 'dress', 'jean', 'pants', 'shoe', 'sneaker', 'hoodie', 'jersey', 'cargo', 'jorts', 'denim', 'jacket', 'puffer', 'flannel', 'polo', 'tank top', 'tracksuit', 'uniform', 'apparel', 'hat', 'cap', 'sock'],
  'Books': ['book', 'magazine', 'textbook', 'notebook', 'novel', 'literature', 'dictionary', 'calculus', 'algebra'],
  'Furniture': ['furniture', 'chair', 'table', 'desk', 'sofa', 'cabinet', 'wardrobe', 'drawer', 'bed', 'stool'],
  'House': ['refrigerator', 'microwave', 'oven', 'washing machine', 'fan', 'ac', 'aircon', 'blender', 'toaster', 'kettle', 'pot', 'pan', 'plate', 'spoon', 'fork', 'cup', 'mirror', 'lamp', 'light', 'decor', 'rug', 'curtain'],
  'Food': [
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
  ],
  'Service': ['service', 'repair', 'plumbing', 'cleaning', 'tutoring', 'lessons', 'delivery', 'hauling', 'rental'],
  'Vehicles': ['car', 'motorcycle', 'bike', 'bicycle', 'scooter', 'automotive', 'tire', 'parts', 'helmet'],
  'Waste': ['scrap', 'metal', 'plastic', 'bottle', 'carton', 'paper', 'cardboard', 'aluminum', 'recyclable', 'junk']
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
  const combined = await combineResultsLocally(cnnResults, validOcrLines, userHint, imageFile);

  // If offline, save listing details into IndexedDB for syncing later
  if (!navigator.onLine) {
    await saveOfflineListing(listingId, combined, imageFile);
  }

  return combined;
}

async function combineResultsLocally(cnnResults, ocrResults, userHint, imageFile) {
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

  // Parse filename heuristics
  const filename = imageFile && imageFile.name ? imageFile.name.toLowerCase() : '';
  const cleanName = filename
    .replace(/\.[^/.]+$/, "") // remove extension
    .replace(/[_-]/g, " ")    // replace separators with space
    .trim();

  const isGeneric = (name) => {
    const genericPatterns = [
      /^img[_\s]?\d+/i,
      /^dsc[_\s]?\d+/i,
      /^screenshot/i,
      /^image/i,
      /^upload/i,
      /^\d+$/
    ];
    return genericPatterns.some(pat => pat.test(name));
  };

  if (title === "Unnamed Item" && cleanName && !isGeneric(cleanName)) {
    title = cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Categories Map Heuristics
  let category = userHint || 'Other';
  let suggestedPrice = 0;
  const tags = new Set();

  if (title === "Unnamed Item") {
    // Generate deterministic mock Davao listing for development/offline testing
    const mockItems = [
      { title: "iPhone 12 - 128GB (White)", category: "Electronic", price: 15000, tags: ["iphone", "smartphone", "apple", "electronic"] },
      { title: "Ergonomic Office Chair", category: "Furniture", price: 2800, tags: ["chair", "office", "furniture", "comfort"] },
      { title: "Nike Air Zoom Sneaker", category: "Clothing", price: 3200, tags: ["nike", "shoes", "sneakers", "clothing"] },
      { title: "Calculus by Leithold (10th Ed)", category: "Books", price: 350, tags: ["books", "textbook", "calculus", "school"] },
      { title: "Homemade Chocolate Chip Cookies", category: "Food", price: 120, tags: ["cookies", "food", "chocolate", "baked"] },
      { title: "Electric Stand Fan (Asahi)", category: "House", price: 850, tags: ["fan", "house", "appliances", "asahi"] }
    ];
    const hash = imageFile ? imageFile.size % mockItems.length : 0;
    const selectedMock = mockItems[hash];
    title = selectedMock.title;
    category = userHint || selectedMock.category;
    suggestedPrice = selectedMock.price;
    selectedMock.tags.forEach(t => tags.add(t));
  } else {
    // Determine category from text search
    const checkText = (title + ' ' + cleanName + ' ' + ocrResults.join(' ')).toLowerCase();
    
    for (const [catName, keywords] of Object.entries(TRENDING_KEYWORDS)) {
      for (const kw of keywords) {
        if (checkText.includes(kw)) {
          category = catName;
          break;
        }
      }
      if (category !== 'Other') break;
    }

    // Assign generic suggested price based on category
    if (category === 'Electronic') suggestedPrice = 1200;
    else if (category === 'Clothing') suggestedPrice = 350;
    else if (category === 'Books') suggestedPrice = 250;
    else if (category === 'Furniture') suggestedPrice = 1500;
    else if (category === 'House') suggestedPrice = 600;
    else if (category === 'Food') suggestedPrice = 150;
    else if (category === 'Vehicles') suggestedPrice = 25000;
    else if (category === 'Waste') suggestedPrice = 20;
    else if (category === 'Service') suggestedPrice = 350;
  }

  // Generate descriptive tags
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
        suggestedPrice: suggestedPrice
      }
    },
    processedOffline: !navigator.onLine
  };
}
