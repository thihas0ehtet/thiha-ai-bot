const { createGithubIssue } = require("./github.js");
const { createClickUpTask } = require("./clickup.js");
const { notifyDiscord } = require("./discord.js");

async function handleCommand(command) {
    console.log("🔍 Processing command:", command);

    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        // Step 1: Send command to Gemini to analyze and structure the request
        console.log("🚀 Sending fetch request to Gemini API...");

        const systemPrompt = `You are an AI assistant that helps create GitHub issues, ClickUp tasks, and Discord notifications.
When the user wants to create a GitHub issue, respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "type": "github_issue",
  "title": "issue title",
  "body": "issue description",
  "action": "created"
}

When the user sends a regular message, respond with JSON:
{
  "type": "message",
  "text": "your response here"
}

IMPORTANT: Always respond with ONLY valid JSON, nothing else.`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{ parts: [{ text: command }] }]
            })
        });

        console.log("📊 Response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ API error response:", errorText);
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const aiResponse = await response.json();
        console.log("✅ AI Response received:", JSON.stringify(aiResponse).slice(0, 300) + "...");

        // Step 2: Extract text from Gemini API response
        if (!aiResponse.candidates || !aiResponse.candidates[0] || !aiResponse.candidates[0].content) {
            console.warn("⚠️ No candidates in response");
            return "Unable to process request";
        }

        const responseText = aiResponse.candidates[0].content.parts[0].text;
        console.log("📄 AI response text:", responseText.slice(0, 200));

        // Step 3: Parse the structured action from AI response
        let action = {};
        try {
            // Extract JSON from markdown code blocks if present
            let jsonStr = responseText;
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
                console.log("📋 Extracted JSON from markdown:", jsonStr.slice(0, 100));
            }

            action = JSON.parse(jsonStr);
            console.log("✅ Parsed action:", action.type);
        } catch (e) {
            console.error("⚠️ Could not parse JSON from AI response, treating as plain message");
            console.error("📍 Parse error:", e.message);
            return responseText;
        }

        // Step 4: Handle different action types
        if (action.type === "github_issue") {
            console.log("📌 GitHub issue action detected");
            return await handleGithubIssue(action);
        } else if (action.type === "message") {
            console.log("💬 Regular message response");
            return action.text || responseText;
        }

        return responseText;
    } catch (error) {
        console.error("💥 Error in handleCommand:", error.message);
        console.error("📍 Stack trace:", error.stack);
        throw error;
    }
}

async function handleGithubIssue(action) {
    try {
        console.log("🔄 Processing GitHub issue creation...");

        const { title, body } = action;

        if (!title) {
            return "❌ Issue title is required";
        }

        // Create GitHub issue
        const issue = await createGithubIssue(title, body || "");
        const issueUrl = issue.html_url;

        // Create ClickUp task
        const taskName = `GitHub Issue: ${title}`;
        console.log("📋 Creating related ClickUp task...");
        await createClickUpTask(taskName, null);

        // Notify Discord
        const discordMessage = `🚀 New GitHub Issue Created!\n📌 **${title}**\n🔗 ${issueUrl}\n✅ Task added to ClickUp`;
        console.log("🔔 Notifying Discord...");
        await notifyDiscord(discordMessage);

        return `✅ Success! Created GitHub issue and synced with ClickUp and Discord:\n${issueUrl}`;
    } catch (error) {
        console.error("❌ Error handling GitHub issue:", error.message);
        return `❌ Error: ${error.message}`;
    }
}

module.exports = { handleCommand };