async function notifyDiscord(message) {
    console.log("🎵 Sending Discord notification:", message);

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
            console.error("❌ Discord webhook error:", errorText);
            throw new Error(`Discord returned ${response.status}: ${errorText}`);
        }

        console.log("✅ Discord notification sent");
    } catch (error) {
        console.error("💥 Error sending Discord notification:", error.message);
        throw error;
    }
}

module.exports = { notifyDiscord };