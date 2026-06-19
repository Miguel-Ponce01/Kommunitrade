const axios = require('axios');

const key = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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
