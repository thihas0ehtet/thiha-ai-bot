const { createGithubIssue, createRepository } = require("./github.js");
const { createClickUpTask } = require("./clickup.js");
const { notifyDiscord } = require("./discord.js");

/**
 * Process user commands using Gemini AI to identify action types
 * Supports: GitHub issues, GitHub repos, regular messages
 * @param {string} command - User command text
 * @returns {Promise<string>} Response or result of action
 */
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

/**
 * Handle GitHub issue creation workflow
 * Creates issue, syncs with ClickUp, notifies Discord
 * @param {object} action - Action object with title and body
 * @returns {Promise<string>} Success message or error
 */
async function handleGithubIssue(action) {
    try {
        const { title, body } = action;

        if (!title) {
            return "❌ Issue title is required";
        }

        // Create GitHub issue
        const issue = await createGithubIssue(title, body || "");
        const issueUrl = issue.html_url;

        // Create ClickUp task synced with GitHub issue
        const taskName = `GitHub Issue: ${title}`;
        await createClickUpTask(taskName, null);

        // Notify Discord channel about new issue
        const discordMessage = `🚀 New GitHub Issue Created!\n📌 **${title}**\n🔗 ${issueUrl}\n✅ Task added to ClickUp`;
        await notifyDiscord(discordMessage);

/**
 * Handle GitHub repository creation workflow
 * Creates repo and notifies Discord
 * @param {object} action - Action object with name, description, and private flag
 * @returns {Promise<string>} Success message or error
 */
async function handleCreateRepo(action) {
    try {
        const { name, description, private: isPrivate } = action;

        if (!name) {
            return "❌ Repository name is required";
        }

        // Create GitHub repository
        const repo = await createRepository(name, description || "", isPrivate || false);
        const repoUrl = repo.html_url;

        // Notify Discord channel about new repository
        const repoType = isPrivate ? "Private" : "Public";
        const discordMessage = `🎉 New ${repoType} Repository Created!\n📦 **${name}**\n🔗 ${repoUrl}\n📝 ${description || "No description"}`;
        await notifyDiscord(discordMessage);

        return `✅ Success! Created ${repoType.toLowerCase()} repository:\n${repoUrl}`;
    } catch (error) {
        return `❌ Error: ${error.message}`;
    }
}

module.exports = { handleCommand };