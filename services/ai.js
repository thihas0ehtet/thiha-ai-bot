import axios from "axios";
import { createGithubIssue } from "./github.js";
import { createClickUpTask } from "./clickup.js";
import { notifyDiscord } from "./discord.js";

export async function handleCommand(command) {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const aiResponse = await axios.post(
        url,
        { contents: [{ parts: [{ text: command }] }] }
    );

    const action = aiResponse.data.action; // assuming AI returns structured action

    // Example: GitHub issue
    if (action.type === "github_issue") {
        const issue = await createGithubIssue(action.title, action.body);
        await createClickUpTask(action.title, action.assignee);
        await notifyDiscord(`New Task Assigned: ${action.title}`);
        return `✅ Task created and synced: ${issue.html_url}`;
    }

    return aiResponse.data.text; // fallback plain text
}