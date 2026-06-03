/**
 * One-time Admin Account Provisioner
 * Run this script once to create/reset the admin account in Firebase Auth.
 * Usage: node scripts/create-admin.cjs
 */

const https = require("https");

const fs = require("fs");
const path = require("path");

const API_KEY = "AIzaSyBElwEUo-IJ02SEooL4lNmnZvJ1cu1B4TE";
let ADMIN_EMAIL = "admin@komunitrade.com";
let ADMIN_PASSWORD = "admin123";

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
  // Fall back to defaults
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

async function main() {
  console.log("🔧 KomuniTrade Admin Account Provisioner\n");

  // Step 1: Try to sign in (check if account exists with correct password)
  console.log("1. Checking if admin account already works...");
  const signInRes = await post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }
  );

  if (signInRes.idToken) {
    console.log("✅ Admin account already works! You can log in now.");
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    return;
  }

  // Step 2: Try to create the account
  console.log("2. Creating new admin account in Firebase Auth...");
  const createRes = await post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }
  );

  if (createRes.idToken) {
    console.log("✅ Admin account created successfully!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("👉 Now go to: localhost:5174/admin and log in!");
    return;
  }

  if (createRes.error?.message === "EMAIL_EXISTS") {
    console.log("⚠️  Account exists but password is different.");
    console.log("We will delete the account or try resetting it. Let's see if we can do password reset.");
    console.log("Let's try to update the user password using a password reset email or another method.");
    
    // Using Firebase Auth REST API we can send a password reset email:
    // https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=[API_KEY]
    console.log("\nAttempting to send password reset email to reset password...");
    const resetRes = await post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
      { requestType: "PASSWORD_RESET", email: ADMIN_EMAIL }
    );
    
    if (resetRes.email) {
      console.log(`✉️ Password reset email sent to ${ADMIN_EMAIL}.`);
    } else {
      console.log("❌ Could not send reset email automatically:", resetRes.error?.message || resetRes);
    }
    
    console.log("\n🔧 Alternate Fix: Go to Firebase Console → Authentication → Users");
    console.log("   Click on admin@komunitrade.com → Delete account");
    console.log("   After deleting, run this script again and it will successfully create it with password 'admin123'!");
    return;
  }

  console.error("❌ Unexpected error:", createRes.error?.message || createRes);
}

main().catch(console.error);
