const { handleGithubIssue, handleCreateRepo } = require("./github.js");

// Process user commands using Gemini AI to identify action types
async function handleCommand(command) {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        // Send command to Gemini with system prompt to identify action type
        const systemPrompt = `You are an AI assistant that helps create GitHub issues, GitHub repositories, ClickUp tasks, and Discord notifications.

When the user wants to create a GitHub issue, respond with ONLY a valid JSON object:
{
  "type": "github_issue",
  "title": "issue title",
  "body": "issue description"
}

When the user wants to create a GitHub repository, respond with ONLY a valid JSON object:
{
  "type": "github_repo",
  "name": "repository name",
  "description": "repository description",
  "private": false
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

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const aiResponse = await response.json();

        // Extract text from Gemini API response
        if (!aiResponse.candidates || !aiResponse.candidates[0] || !aiResponse.candidates[0].content) {
            return "Unable to process request";
        }

        const responseText = aiResponse.candidates[0].content.parts[0].text;

        // Parse structured action from AI response
        let action = {};
        try {
            // Extract JSON from markdown code blocks if present
            let jsonStr = responseText;
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }

            action = JSON.parse(jsonStr);
        } catch (e) {
            // If JSON parsing fails, return AI response as plain text
            return responseText;
        }

        // Handle different action types
        if (action.type === "github_issue") {
            return await handleGithubIssue(action);
        } else if (action.type === "github_repo") {
            return await handleCreateRepo(action);
        } else if (action.type === "message") {
            return action.text || responseText;
        }

        return responseText;
    } catch (error) {
        throw error;
    }
}

module.exports = { handleCommand };