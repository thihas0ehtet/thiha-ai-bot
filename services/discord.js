// Send message notification to Discord webhook
async function notifyDiscord(message) {
    try {
        const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: message })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Discord returned ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error("Discord notification failed:", error.message);
        throw error;
    }
}

module.exports = { notifyDiscord };