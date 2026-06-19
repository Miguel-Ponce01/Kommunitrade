const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load functions/.env
const envPath = path.join(__dirname, 'functions', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const key = env.GEMINI_API_KEY;
const model = env.GEMINI_MODEL || "gemini-2.0-flash";
console.log(`Using model: ${model}`);
console.log(`Using API key: ${key.substring(0, 10)}...`);
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

async function run() {
  try {
    const res = await axios.post(url, {
      contents: [{
        parts: [{ text: "Hello, reply with 'test success'" }]
      }]
    });
    console.log("Success:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error status:", err.response?.status);
    console.error("Error:", JSON.stringify(err.response?.data?.error || err.message, null, 2));
  }
}

run();
