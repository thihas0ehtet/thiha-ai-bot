/**
 * Create a GitHub issue in the repository
 * @param {string} title - Issue title
 * @param {string} body - Issue description
 * @returns {Promise<object>} GitHub issue object with URL
 */
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

module.exports = { createGithubIssue };