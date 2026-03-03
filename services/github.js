async function createGithubIssue(title, body) {
    console.log("🐙 Creating GitHub issue:", title);

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
            console.error("❌ GitHub API error:", errorText);
            throw new Error(`GitHub API returned ${response.status}: ${errorText}`);
        }

        const issue = await response.json();
        console.log("✅ GitHub issue created:", issue.html_url);
        return issue;
    } catch (error) {
        console.error("💥 Error creating GitHub issue:", error.message);
        throw error;
    }
}

module.exports = { createGithubIssue };