/**
 * AI Model Provider Service
 * Encapsulates API calls to different AI providers (Gemini, OpenAI, etc.)
 */

/**
 * Call Gemini API with history
 */
async function callGemini(systemPrompt, history) {
    const apiKey = process.env.GEMINI_API_KEY;
    const baseUrl = process.env.GEMINI_API_URL;

    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    if (!baseUrl) throw new Error("GEMINI_API_URL is not set");

    const url = `${baseUrl}:generateContent?key=${apiKey}`;

    // Map history to Gemini format (user/model)
    const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: contents
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
 * Call OpenAI API with history
 */
async function callOpenAI(systemPrompt, history) {
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
                ...history
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
 * Call OpenRouter API with history
 */
async function callOpenRouter(systemPrompt, history) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openrouter/free";

    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

    const url = "https://openrouter.ai/api/v1/chat/completions";

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
                ...history
            ]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid response structure from OpenRouter API");
    }

    return data.choices[0].message.content;
}

/**
 * Router for AI providers
 */
async function callAI(provider, systemPrompt, history) {
    const normalizedProvider = (provider || "gemini").toLowerCase();

    switch (normalizedProvider) {
        case "gemini":
            return await callGemini(systemPrompt, history);
        case "openai":
            return await callOpenAI(systemPrompt, history);
        case "openrouter":
            return await callOpenRouter(systemPrompt, history);
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
        return null;
    }
}

module.exports = {
    callAI,
    parseAIResponse
};
