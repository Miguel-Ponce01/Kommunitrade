const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load API key from functions/.env
const envPath = path.join(__dirname, '../functions/.env');
if (!fs.existsSync(envPath)) {
  console.error(".env file not found at", envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/^GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/m);
if (!match) {
  console.error("GEMINI_API_KEY not found in .env file");
  process.exit(1);
}
const apiKey = match[1];
console.log("Using API Key:", apiKey.substring(0, 10) + "...");

const models = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro'
];

async function testModel(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  console.log(`\nTesting model: ${model}...`);
  try {
    const res = await axios.post(url, {
      contents: [{
        parts: [{ text: "Hello, reply with 'test success'" }]
      }]
    }, { timeout: 8000 });
    console.log(`[${model}] SUCCESS!`);
    console.log(`Response: ${res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()}`);
  } catch (err) {
    console.error(`[${model}] FAILED.`);
    console.error(`Status: ${err.response?.status}`);
    console.error(`Error details:`, JSON.stringify(err.response?.data?.error || err.message));
  }
}

async function runAll() {
  for (const model of models) {
    await testModel(model);
  }
}

runAll();
