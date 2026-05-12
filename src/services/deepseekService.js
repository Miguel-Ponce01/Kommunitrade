export const analyzeListingWithDeepSeek = async ({ title, description, ocrText }) => {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DeepSeek API key is missing.");
  }

  const prompt = `
You are the KomuniTrade Smart Advisor. You help users optimize their marketplace listings.
Given the user's input, analyze the item and return a JSON object with the following exact structure:
{
  "title": "Optimized Title (max 60 chars)",
  "category": "One of: Electronics, Clothing, Books & Media, Furniture, Appliances, Real Estate, Automotive, Other",
  "tags": ["tag1", "tag2", "tag3"], // 3-5 relevant keywords
  "suggestedPrice": 0 // Numeric suggested price in PHP if possible based on description, else 0
}

User Input:
Title: ${title || 'None provided'}
Description: ${description || 'None provided'}
OCR Text from Image: ${ocrText || 'None provided'}
`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful API that returns strictly valid JSON without any markdown formatting." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API Error:", errText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Strip markdown code blocks if the model ignored response_format
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n?/, '').replace(/```$/, '').trim();
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n?/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(content);
    return {
      success: true,
      data: {
        title: parsed.title || title || '',
        category: parsed.category || 'Other',
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(t => t.toLowerCase()) : [],
        suggestedPrice: parsed.suggestedPrice || 0
      }
    };
  } catch (error) {
    console.error("DeepSeek Analysis Failed:", error);
    return { success: false, error: error.message };
  }
};
