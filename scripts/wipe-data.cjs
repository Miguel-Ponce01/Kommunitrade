/**
 * KomuniTrade Dataset Wiper Script
 * Run this script to delete all seeded/mock listings, user profiles, and logs from Firestore.
 * It preserves the admin account.
 *
 * Usage: node scripts/wipe-data.cjs
 */

const https = require("https");
const path = require("path");
const fs = require("fs");

const API_KEY = "AIzaSyBElwEUo-IJ02SEooL4lNmnZvJ1cu1B4TE";
let ADMIN_EMAIL = "admin@komunitrade.com";
let ADMIN_PASSWORD = "admin123";
const PROJECT_ID = "komunitrade";

// Attempt to load credentials from local environment file
try {
  const envPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
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

function getFirestoreDocs(collectionId, token) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionId}?pageSize=300`;
  return new Promise((resolve, reject) => {
    const options = {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    const req = https.request(url, options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed.documents || []);
          } else {
            // If the collection doesn't exist yet, it returns a 404 which is fine, treat as empty
            if (res.statusCode === 404) {
              resolve([]);
            } else {
              reject(new Error(parsed.error?.message || `Status ${res.statusCode}: ${raw}`));
            }
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function deleteFirestoreDoc(docPath, token) {
  const url = `https://firestore.googleapis.com/v1/${docPath}`;
  return new Promise((resolve, reject) => {
    const options = {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    };
    const req = https.request(url, options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          try {
            const parsed = JSON.parse(raw);
            reject(new Error(parsed.error?.message || `Status ${res.statusCode}: ${raw}`));
          } catch (e) {
            reject(new Error(`Status ${res.statusCode}: ${raw}`));
          }
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  console.log("🧹 KomuniTrade Production Dataset Wiper Program");
  console.log("===============================================");
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

  const collections = [
    "listings",
    "users",
    "feedback",
    "reports",
    "transactions",
    "disputes",
    "trust_logs",
    "chats",
    "notifications",
    "ai_predictions"
  ];

  for (const collectionId of collections) {
    console.log(`\nFetching documents from collection: '${collectionId}'...`);
    try {
      const docs = await getFirestoreDocs(collectionId, token);
      console.log(`Found ${docs.length} documents.`);
      
      let deletedCount = 0;
      for (const doc of docs) {
        // Extract the document path (e.g. projects/komunitrade/databases/(default)/documents/users/admin_uid)
        const name = doc.name;
        const parts = name.split("/");
        const docId = parts[parts.length - 1];

        // Skip deleting the admin user document
        if (collectionId === "users" && docId === adminUid) {
          console.log(`   - Skipping admin user profile (${docId})`);
          continue;
        }

        try {
          await deleteFirestoreDoc(name, token);
          deletedCount++;
        } catch (err) {
          console.error(`   ❌ Failed to delete document ${name}:`, err.message);
        }
      }
      console.log(`✅ Successfully deleted ${deletedCount} documents from '${collectionId}'.`);
    } catch (err) {
      console.error(`❌ Failed to process collection '${collectionId}':`, err.message);
    }
  }

  console.log("\n===============================================");
  console.log("🎉 Database wipe complete!");
  console.log("👉 Run the app locally and verify that the items feed is clean.");
}

main().catch(console.error);
