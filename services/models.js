/**
 * AI Model Provider Service
 * Encapsulates API calls to different AI providers (Gemini, OpenAI, etc.)
 */

/**
 * Call Gemini API
 */
async function callGemini(systemPrompt, userMessage) {
    const apiKey = process.env.GEMINI_API_KEY;
    const baseUrl = process.env.GEMINI_API_URL;
    
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    if (!baseUrl) throw new Error("GEMINI_API_URL is not set");

    const url = `${baseUrl}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userMessage }] }]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response structure from Gemini API");
    }

    return data.candidates[0].content.parts[0].text;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(systemPrompt, userMessage) {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
    
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

    const url = "https://api.openai.com/v1/chat/completions";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid response structure from OpenAI API");
    }

    return data.choices[0].message.content;
}

/**
 * Router for AI providers
 */
async function callAI(provider, systemPrompt, userMessage) {
    const normalizedProvider = (provider || "gemini").toLowerCase();
    
    switch (normalizedProvider) {
        case "gemini":
            return await callGemini(systemPrompt, userMessage);
        case "openai":
            return await callOpenAI(systemPrompt, userMessage);
        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
}

/**
 * Helper to parse JSON from AI response
 */
function parseAIResponse(responseText) {
    try {
        let jsonStr = responseText;
        // Handle markdown code blocks
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }
        return JSON.parse(jsonStr);
    } catch (e) {
        // If not valid JSON, return null or throw depending on needs
        // In our case, we'll return null to signal it's a plain message
        return null;
    }
}

module.exports = {
    callAI,
    parseAIResponse
};
