
// Vercel Deployment Service
/**
 * Vercel Deployment Service
 * Handles direct file deployments to Vercel
 */


/**
 * Creates a new deployment on Vercel
 * @param {string} name - The name of the project/deployment
 * @param {Array} files - Array of { file: string, contents: string }
 * @returns {Promise<Object>} - The deployment object from Vercel
 */
async function createDeployment(name, files) {
    const token = process.env.VERCEL_TOKEN;

    if (!token) {
        throw new Error("VERCEL_TOKEN is not configured in environment variables.");
    }

    try {
        // Convert files to Vercel format
        const vercelFiles = files.map(f => ({
            file: f.file,
            data: Buffer.from(f.contents).toString('base64'),
            encoding: 'base64'
        }));

        const response = await fetch('https://api.vercel.com/v13/deployments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                files: vercelFiles,
                projectSettings: {
                    framework: null // Simple static files
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Vercel API error: ${JSON.stringify(errorData.error)}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Vercel deployment failed:", error.message);
        throw error;
    }
}

/**
 * Handler for the Vercel deployment workflow
 */
async function handleVercelDeploy(action) {
    try {
        const { name, files } = action;

        if (!name || !files || !files.length) {
            return "❌ Project name and files are required for Vercel deployment.";
        }

        const deployment = await createDeployment(name, files);
        return `🚀 Successfully deployed to Vercel!\n🔗 Link: https://${deployment.url}`;
    } catch (error) {
        return `❌ Vercel Error: ${error.message}`;
    }
}

module.exports = { createDeployment, handleVercelDeploy };
