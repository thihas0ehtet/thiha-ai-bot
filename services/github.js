// Create a GitHub issue in the repository
async function createGithubIssue(title, body) {
    try {
        const response = await fetch(
            `https://api.github.com/repos/thihas0ehtet/thiha-ai-bot/issues`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, body })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API returned ${response.status}: ${errorText}`);
        }

        const issue = await response.json();
        return issue;
    } catch (error) {
        console.error("GitHub issue creation failed:", error.message);
        throw error;
    }
}

// Get a GitHub repository
async function getRepository(name) {
    try {
        // First try to get user's own repo
        const response = await fetch(
            `https://api.github.com/repos/thihas0ehtet/${name}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (response.status === 404) return null;
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API returned ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("GitHub repository lookup failed:", error.message);
        throw error;
    }
}

// Push a file to a GitHub repository
async function pushFile(repoName, path, content, message = "Update file from AI Bot") {
    try {
        const owner = "thihas0ehtet"; // Default owner based on current context
        const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;

        // 1. Check if file exists to get its SHA
        let sha = null;
        const getResponse = await fetch(url, {
            headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (getResponse.ok) {
            const fileData = await getResponse.json();
            sha = fileData.sha;
        }

        // 2. Create or Update file
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                content: Buffer.from(content).toString('base64'),
                sha: sha || undefined
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API returned ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("GitHub file push failed:", error.message);
        throw error;
    }
}

// Create a new GitHub repository
async function createRepository(name, description, isPrivate = false) {

    try {
        const response = await fetch(
            `https://api.github.com/user/repos`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    description,
                    private: isPrivate,
                    auto_init: true
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API returned ${response.status}: ${errorText}`);
        }

        const repo = await response.json();
        return repo;
    } catch (error) {
        console.error("GitHub repository creation failed:", error.message);
        throw error;
    }
}

// Handle GitHub issue creation workflow: create issue, sync with ClickUp, notify Discord
async function handleGithubIssue(action) {
    const { createClickUpTask } = require("./clickup.js");
    const { notifyDiscord } = require("./discord.js");

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

        return `✅ Success! Created GitHub issue and synced with ClickUp and Discord:\n${issueUrl}`;
    } catch (error) {
        return `❌ Error: ${error.message}`;
    }
}

// Handle GitHub repository creation workflow: create repo and notify Discord
async function handleCreateRepo(action) {
    const { notifyDiscord } = require("./discord.js");

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

module.exports = {
    createGithubIssue,
    createRepository,
    getRepository,
    pushFile,
    handleGithubIssue,
    handleCreateRepo
};