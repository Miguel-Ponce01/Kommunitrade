/**
 * KomuniTrade Dataset Seeder Script
 * Run this script to populate your Firestore database with 70 realistic local listings
 * and 5 mock user profiles distributed across Davao City.
 *
 * Usage: node scripts/seed-listings.cjs
 */

const https = require("https");
const fs = require("path");
const fileSys = require("fs");

const API_KEY = "AIzaSyBElwEUo-IJ02SEooL4lNmnZvJ1cu1B4TE";
let ADMIN_EMAIL = "admin@komunitrade.com";
let ADMIN_PASSWORD = "admin123";
const PROJECT_ID = "komunitrade";

// Geohash Encoding helper (standard 15-line base32 geohash encoder)
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
function encodeGeohash(lat, lng, precision = 6) {
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let geohash = "";
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    if (isEven) {
      let mid = (minLng + maxLng) / 2;
      if (lng > mid) {
        ch |= (1 << (4 - bit));
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      let mid = (minLat + maxLat) / 2;
      if (lat > mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return geohash;
}

// Attempt to load credentials from local environment file
try {
  const envPath = fs.join(__dirname, "../.env.local");
  if (fileSys.existsSync(envPath)) {
    const envContent = fileSys.readFileSync(envPath, "utf-8");
    const emailMatch = envContent.match(/VITE_ADMIN_EMAIL\s*=\s*["']?([^"'\r\n]+)["']?/);
    const passMatch = envContent.match(/VITE_ADMIN_PASSWORD\s*=\s*["']?([^"'\r\n]+)["']?/);
    if (emailMatch) ADMIN_EMAIL = emailMatch[1].trim();
    if (passMatch) ADMIN_PASSWORD = passMatch[1].trim();
  }
} catch (e) {
  // Fall back to default
}

function post(url, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(url, options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => resolve(JSON.parse(raw)));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function patchFirestore(collectionId, docId, fields, token) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionId}/${docId}`;
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ fields });
    const options = {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(url, options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.message || `Status ${res.statusCode}: ${raw}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// Converts JS values into Firestore REST API fields format
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: String(val) };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (val instanceof Date) {
      fields[key] = { timestampValue: val.toISOString() };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(item => {
            if (typeof item === 'string') return { stringValue: item };
            if (typeof item === 'number') return Number.isInteger(item) ? { integerValue: String(item) } : { doubleValue: item };
            if (typeof item === 'boolean') return { booleanValue: item };
            if (typeof item === 'object') return { mapValue: { fields: toFirestoreFields(item) } };
            return { nullValue: null };
          })
        }
      };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    }
  }
  return fields;
}

// Data Sets
const BARANGAYS = [
  { name: "Obrero", lat: 7.0750, lng: 125.6180 },
  { name: "Agdao", lat: 7.0820, lng: 125.6270 },
  { name: "Buhangin", lat: 7.1000, lng: 125.6350 },
  { name: "Matina", lat: 7.0560, lng: 125.5930 },
  { name: "Poblacion", lat: 7.0695, lng: 125.6120 },
  { name: "San Isidro", lat: 7.0900, lng: 125.6100 },
  { name: "Bagumbayan", lat: 7.0780, lng: 125.6200 },
  { name: "Pag-asa", lat: 7.0650, lng: 125.6050 },
  { name: "Sampaguita", lat: 7.0720, lng: 125.6150 },
  { name: "Greenpark Village", lat: 7.0850, lng: 125.6300 },
  { name: "Phase 1", lat: 7.0800, lng: 125.6220 },
  { name: "Phase 2", lat: 7.0810, lng: 125.6230 }
];

const MOCK_USERS = [
  { uid: "mock_user_juan", displayName: "Juan Dela Cruz", email: "juan@komunitrade.mock", trustScore: 85, verified: true, barangay: "Matina" },
  { uid: "mock_user_maria", displayName: "Maria Santos", email: "maria@komunitrade.mock", trustScore: 92, verified: true, barangay: "Obrero" },
  { uid: "mock_user_sarah", displayName: "Sarah Geronimo", email: "sarah@komunitrade.mock", trustScore: 78, verified: false, barangay: "Buhangin" },
  { uid: "mock_user_ken", displayName: "Ken Sumilang", email: "ken@komunitrade.mock", trustScore: 95, verified: true, barangay: "Poblacion" },
  { uid: "mock_user_elena", displayName: "Elena Torralba", email: "elena@komunitrade.mock", trustScore: 62, verified: false, barangay: "Agdao" }
];

const TEMPLATES = {
  "Electronic": [
    {
      titles: ["iPhone 12 - 128GB, Factory Unlocked", "Preloved iPhone 12 Pro Max", "iPhone 12 (Midnight Black)"],
      descriptions: ["Battery health is at 88%. Screen is 100% scratch-free since day one. Comes with free shockproof case and original charging cable.", "Slightly used, no issues, no history of repair. True tone and Face ID are perfectly working. Test all you want during meetup."],
      priceRange: [18000, 24000],
      images: ["https://images.unsplash.com/photo-1556656793-08538906a9f8"],
      tags: ["iphone", "apple", "smartphone", "electronic"]
    },
    {
      titles: ["Mechanical Gaming Keyboard (Red Switches)", "RK61 Mechanical Keyboard", "RGB Wireless Mechanical Keyboard"],
      descriptions: ["Hot-swappable keyboard in excellent condition. Compact 60% layout, perfect for gaming or coding. USB-C cable included.", "Used for 3 months only. Modded with foam for a deeper sound profile. RGB backlights fully working. Bluetooth and 2.4Ghz wireless options."],
      priceRange: [1200, 2500],
      images: ["https://images.unsplash.com/photo-1563770660941-20978e870e26"],
      tags: ["keyboard", "gaming", "rgb", "pc"]
    },
    {
      titles: ["Wireless Noise Cancelling Earbuds", "Bluetooth Earbuds - Waterproof", "Preloved Airpods Gen 2"],
      descriptions: ["Superb bass quality and active noise cancellation. Batteries last 6 hours on a single charge. Charging case included.", "Perfect for working out or daily commute. Auto-connects instantly. Clear mic quality for calls."],
      priceRange: [800, 3200],
      images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df"],
      tags: ["earbuds", "audio", "bluetooth", "music"]
    }
  ],
  "House": [
    {
      titles: ["Standing Electric Fan (Asahi 16\")", "Preloved Asahi Floor Fan", "Metal Blades Electric Fan"],
      descriptions: ["Heavy-duty motor, 3-speed speed selector. Keeps the whole living room cool. Working smoothly and silently.", "Selling cheap because moving out. In perfect working condition, only used for a few months."],
      priceRange: [750, 1500],
      images: ["https://images.unsplash.com/photo-1574269909862-7e1d70bb8078"],
      tags: ["fan", "appliances", "home", "cooling"]
    },
    {
      titles: ["Digital Air Fryer - 4.5L Capacity", "Smart Air Fryer (Used)", "Compact Healthy Air Fryer"],
      descriptions: ["Cooks crispy chicken and fries with 90% less oil. Touch control panel with presets. Clean and fully functioning.", "Perfect for small family meals. Easy to wash and maintain. Selling since upgrading to a larger size."],
      priceRange: [1800, 3500],
      images: ["https://images.unsplash.com/photo-1626806787461-102c1bfaaea1"],
      tags: ["airfryer", "kitchen", "appliances", "cooking"]
    }
  ],
  "Books": [
    {
      titles: ["Thomas' Calculus (13th Edition)", "Calculus Textbook for Engineers", "Calculus with Analytic Geometry"],
      descriptions: ["Hardcover textbook used for engineering classes. Has minor pencil highlights but all pages are clean and intact.", "Great helper for college math. Clear diagrams. Offering a very low price to help students."],
      priceRange: [400, 950],
      images: ["https://images.unsplash.com/photo-1532012197267-da84d127e765"],
      tags: ["calculus", "textbook", "college", "math", "books"]
    },
    {
      titles: ["Noli Me Tangere by Jose Rizal", "Philippine Literature Classics Book", "Noli Me Tangere (English translation)"],
      descriptions: ["Required reading for high school/college. Excellent translation, pages are clean, spine is not broken.", "Classic Philippine novel. Read once. Clean cover and perfect pages."],
      priceRange: [120, 250],
      images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f"],
      tags: ["rizal", "history", "novel", "books", "filipino"]
    }
  ],
  "Clothing": [
    {
      titles: ["Preloved Nike Air Max Sneaker (Size 10)", "Nike running shoes (Red/White)", "Nike Sports Shoes - Size 10 US"],
      descriptions: ["Authentic Nike sneakers. Worn only 5 times. Still looks fresh with clean soles. Very comfortable for daily wear.", "Excellent condition. No heel drags. Original box included. Perfect for running or casual outfit."],
      priceRange: [2200, 4500],
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff"],
      tags: ["shoes", "nike", "sneakers", "clothing", "fashion"]
    },
    {
      titles: ["Vintage Denim Jacket (Size L)", "Unisex Jeans Jacket - Heavy Cotton", "Denim Oversized Jacket"],
      descriptions: ["Stylized vintage denim jacket. Heavyweight material, classic fit. No stains or tears. All metal buttons intact.", "Perfect layering piece. Bought from thrift store, washed and ready to wear. Meetup at local mall."],
      priceRange: [450, 950],
      images: ["https://images.unsplash.com/photo-1523381210434-271e8be1f52b"],
      tags: ["denim", "jacket", "vintage", "thrift", "clothing"]
    }
  ],
  "Food": [
    {
      titles: ["Freshly Baked Banana Bread - Loaf", "Homemade Banana Cake with Walnuts", "Healthy Banana Bread Loaves"],
      descriptions: ["Freshly baked every morning! Moist, rich, and naturally sweetened. Order before noon for same-day delivery or meetup.", "Rich chocolate chip and walnut topping. Perfect partner for coffee. Packaged nicely in box."],
      priceRange: [150, 280],
      images: ["https://images.unsplash.com/photo-1576618148400-f54bed99fcfd"],
      tags: ["banana", "bread", "cake", "food", "baked"]
    },
    {
      titles: ["Charcoal Lechon Manok (Whole)", "Roasted Chicken - Davao Hot", "Lechon Manok with Special Sauce"],
      descriptions: ["Juicy and fully roasted whole chicken. Marinated with local lemongrass and spices. Hot and fresh upon pick up.", "Perfect family dinner! Hot and fresh from the charcoal roaster. Liver sauce and gravy included."],
      priceRange: [240, 270],
      images: ["https://images.unsplash.com/photo-1598103442097-8b74394b95c6"],
      tags: ["chicken", "roasted", "dinner", "food", "lechon"]
    }
  ],
  "Service": [
    {
      titles: ["Aircon Cleaning & AC Maintenance", "Split-Type Aircon Cleaning Service", "Professional Aircon Maintenance"],
      descriptions: ["We clean window type and split type ACs. Prevents bad odor, saves electricity. Service includes cleaning coils and filters.", "Experiencing low cooling? Book our cleaning service. Experienced technician located in Davao City."],
      priceRange: [600, 1200],
      images: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e"],
      tags: ["aircon", "cleaning", "service", "home", "repair"]
    },
    {
      titles: ["Math & Physics Tutoring - Grade 8-12", "Hyperlocal Math Tutor - Poblacion", "High School Algebra Tutor"],
      descriptions: ["One-on-one sessions for Algebra, Geometry, and Calculus. Tutor is an engineering student. Rate is per hour.", "We make math easy! Home visits within Poblacion area. 2 hours sessions recommended. Book your slots now."],
      priceRange: [200, 350],
      images: ["https://images.unsplash.com/photo-1434030216411-0b793f4b4173"],
      tags: ["tutor", "math", "physics", "education", "service"]
    }
  ],
  "Furniture": [
    {
      titles: ["Ergonomic Mesh Office Chair", "Preloved Study Desk Chair", "Swivel Chair with Armrests"],
      descriptions: ["Has pneumatic height adjustment, 360-degree swivel, and breathable mesh back. Good support for remote work or study.", "Slightly used chair. Gas lift is fully working. Casters roll smoothly. Pick up at our barangay."],
      priceRange: [1500, 3200],
      images: ["https://images.unsplash.com/photo-1524758631624-e2822e304c36"],
      tags: ["chair", "office", "furniture", "homeoffice"]
    },
    {
      titles: ["Wooden Study Desk with Drawers", "Solid Wood Computer Table", "Minimalist Writing Desk"],
      descriptions: ["Wooden desk in warm oak finish. Has two drawers for storing school supplies. Durable and clean surfaces.", "Perfect size for student rooms. Holds laptop, books, and lamps easily. Sturdy design. Minor paint chips."],
      priceRange: [1800, 3800],
      images: ["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd"],
      tags: ["table", "desk", "wooden", "furniture", "study"]
    }
  ],
  "Vehicles": [
    {
      titles: ["Mountain Bike (Trinx 26\")", "Preloved Alloy Frame Bicycle", "21-Speed Mountain Bike Trinx"],
      descriptions: ["Shimano tourney shifters, mechanical disc brakes, front suspension fork. Smooth tires, ready for trail or road.", "Bicycle in very good running condition. No rust. Brake pads recently replaced. Great for commuting in Davao."],
      priceRange: [4500, 7500],
      images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e"],
      tags: ["bike", "bicycle", "trinx", "cycling", "vehicle"]
    },
    {
      titles: ["SEC Motorcycle Helmet (Large)", "Full Face Motorcycle Helmet SEC", "Preloved Dual Visor Helmet"],
      descriptions: ["Dual visor helmet, ICC certified. Size Large. Foam padding is clean and fresh. Never dropped or involved in crash.", "Dual visor model. Quick release buckle. Used as extra helmet for passenger. Minor exterior scratches."],
      priceRange: [1400, 2800],
      images: ["https://images.unsplash.com/photo-1542362567-b07eac790acd"],
      tags: ["helmet", "motorcycle", "sec", "safety", "vehicle"]
    }
  ],
  "Waste": [
    {
      titles: ["Bulk Corrugated Carton Boxes (30kg+)", "Newspaper & Carton Stack for Junk Shop", "Clean Carton Cardboards for Recycling"],
      descriptions: ["Flattened boxes stored in dry garage. Ideal for shipping, packing, or recycling shop buyers.", "Assorted carton cards and dry newspapers. Good weight. Must pick up whole batch from Obrero."],
      priceRange: [50, 150],
      images: ["https://images.unsplash.com/photo-1604187351574-c75ca79f5807"],
      tags: ["carton", "recycling", "paper", "waste"]
    },
    {
      titles: ["Clean Empty Plastic Bottles (bulk)", "PET bottles for school projects/junk shop", "1.5L Coke Bottles for recycling"],
      descriptions: ["Around 150 pieces of clean, dry PET bottles with caps. Sorted in plastic bags. Good for crafts or recycling center.", "Assorted mineral water and softdrink bottles. Stored clean. Safe for school garden projects."],
      priceRange: [60, 120],
      images: ["https://images.unsplash.com/photo-1611284446314-60a58ac0deb9"],
      tags: ["plastic", "bottles", "recycling", "waste", "pet"]
    }
  ]
};

async function main() {
  console.log("🚀 KomuniTrade Production Dataset Seeding Program");
  console.log("=================================================");
  console.log(`Connecting as admin: ${ADMIN_EMAIL}...`);

  // Step 1: Auth
  const authRes = await post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }
  );

  if (!authRes.idToken) {
    console.error("❌ Authentication failed. Check credentials in .env.local.");
    console.error(authRes);
    process.exit(1);
  }

  const token = authRes.idToken;
  const adminUid = authRes.localId;
  console.log("✅ Authenticated successfully! Admin UID: " + adminUid);

  // Step 2: Seed Mock User Profiles
  console.log("\n👤 Seeding 5 Mock User profiles in Firestore...");
  const usersToSeed = [...MOCK_USERS];
  
  // Also seed/overwrite Admin User Profile to ensure it has correct fields
  usersToSeed.push({
    uid: adminUid,
    displayName: "System Admin",
    email: ADMIN_EMAIL,
    trustScore: 100,
    verified: true,
    barangay: "Central Office"
  });

  for (const user of usersToSeed) {
    const userFields = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      trustScore: user.trustScore,
      verified: user.verified,
      isVerified: user.verified,
      verificationStatus: user.verified ? "VERIFIED" : "UNVERIFIED",
      verifiedNeighborhood: user.barangay,
      barangay: user.barangay,
      createdAt: new Date(),
      role: user.uid === adminUid ? "admin" : "user",
      bio: `Active trader in Barangay ${user.barangay}. Interested in sustainable community barters.`
    };

    try {
      await patchFirestore("users", user.uid, toFirestoreFields(userFields), token);
      console.log(`   - Profile seeded: ${user.displayName} (${user.uid})`);
    } catch (err) {
      console.error(`   ❌ Failed seeding profile ${user.displayName}:`, err.message);
    }
  }

  // Step 3: Generate and Seed 70 listings
  console.log("\n📦 Generating 70 Davao City listings...");
  
  const categoriesList = Object.keys(TEMPLATES);
  const listings = [];

  for (let i = 1; i <= 70; i++) {
    // Determine Category
    const category = categoriesList[i % categoriesList.length];
    
    // Choose Template
    const templates = TEMPLATES[category];
    const template = templates[i % templates.length];
    
    // Random Title & Description
    const title = template.titles[i % template.titles.length] + ` (#${1000 + i})`;
    const description = template.descriptions[i % template.descriptions.length];
    
    // Random Price
    const minPrice = template.priceRange[0];
    const maxPrice = template.priceRange[1];
    const price = Math.round(minPrice + Math.random() * (maxPrice - minPrice));

    // Choose Seller (Assigned to adminUid to satisfy production Firestore rules without requiring rules redeployment)
    const seller = usersToSeed[i % usersToSeed.length];
    const sellerId = adminUid;
    
    // Barangay & Coordinates
    // Spread them across barangays. Use seller's barangay as base, or random barangay.
    const brgy = BARANGAYS[i % BARANGAYS.length];
    
    // Add a tiny random offset to create distinct points on the map
    const latOffset = (Math.random() - 0.5) * 0.005;
    const lngOffset = (Math.random() - 0.5) * 0.005;
    const lat = brgy.lat + latOffset;
    const lng = brgy.lng + lngOffset;
    const geohash = encodeGeohash(lat, lng, 6);

    // Random Date
    const daysAgo = Math.floor(Math.random() * 5); // 0 to 4 days ago
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 15 + Math.floor(Math.random() * 15)); // 15 to 30 days expiry

    // Condition
    const conditions = ["New", "Like New", "Used"];
    const condition = category === "Service" ? null : conditions[i % conditions.length];

    const listingFields = {
      id: `listing_seed_${i}`,
      sellerId: sellerId,
      title: title,
      price: price,
      category: category,
      condition: condition,
      barangay: brgy.name,
      geohash: geohash,
      lat: lat,
      lng: lng,
      isSold: false,
      imageUrl: template.images[i % template.images.length],
      imageUrls: [template.images[i % template.images.length]],
      description: description,
      tags: template.tags,
      createdAt: createdAt,
      expiresAt: expiresAt.toISOString(),
      verified: seller.verified,
      timeMark: {
        lat: lat,
        lng: lng,
        date: createdAt.toISOString().split('T')[0],
        time: createdAt.toTimeString().split(' ')[0].substring(0, 5)
      }
    };

    listings.push(listingFields);
  }

  console.log(`Seeding 70 listings sequentially in Firestore...`);
  
  let successCount = 0;
  for (const listing of listings) {
    try {
      await patchFirestore("listings", listing.id, toFirestoreFields(listing), token);
      successCount++;
      if (successCount % 10 === 0) {
        console.log(`   - Seeded ${successCount}/70 listings...`);
      }
    } catch (err) {
      console.error(`   ❌ Failed seeding listing ${listing.title}:`, err.message);
    }
  }

  console.log("\n=================================================");
  console.log(`🎉 Seeding complete! Successfully seeded ${successCount} listings.`);
  console.log("👉 Run the app locally and explore search, maps, filters, and charts!");
}

main().catch(console.error);
