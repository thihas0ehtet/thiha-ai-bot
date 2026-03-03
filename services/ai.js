// const { createGithubIssue } = require("./github");
// const { createClickUpTask } = require("./clickup");
// const { notifyDiscord } = require("./discord");

export async function handleCommand(command) {
    console.log("🔍 Processing command:", command);

    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        console.log("🚀 Sending fetch request to Gemini API...");
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contents: [{ parts: [{ text: command }] }] })
        });

        console.log("📊 Response status:", response.status);
        console.log("📋 Response headers:", Object.fromEntries(response.headers));

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ API error response:", errorText);
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const aiResponse = await response.json();
        console.log("✅ AI Response received:", JSON.stringify(aiResponse).slice(0, 200) + "...");

        // Extract text from Gemini API response
        if (aiResponse.candidates && aiResponse.candidates[0] && aiResponse.candidates[0].content) {
            const text = aiResponse.candidates[0].content.parts[0].text;
            console.log("📄 Extracted text:", text);
            return text;
        }

        // Fallback for structured actions (if API returns them differently)
        const action = aiResponse.action;
        if (action && action.type === "github_issue") {
            // Example: GitHub issue
            // const issue = await createGithubIssue(action.title, action.body);
            // await createClickUpTask(action.title, action.assignee);
            // await notifyDiscord(`New Task Assigned: ${action.title}`);
            // return `✅ Task created and synced: ${issue.html_url}`;
        }

        console.warn("⚠️ Unexpected response structure:", aiResponse);
        return "Unable to parse AI response";
    } catch (error) {
        console.error("💥 Error in handleCommand:", error.message);
        console.error("📍 Stack trace:", error.stack);
        throw error;
    }
}