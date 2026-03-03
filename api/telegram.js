const { Telegraf } = require("telegraf");
const { handleCommand } = require("../services/ai.js");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Global error handlers for unhandled rejections and exceptions
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});

bot.start((ctx) => ctx.reply("✨ AI Assistant Ready! Just send me a message."));

// Handle all text messages
bot.on('text', async (ctx) => {
    const command = ctx.message.text;

    try {
        const result = await handleCommand(command);
        ctx.reply(result);
    } catch (err) {
        console.error("Error processing message:", err.message);
        ctx.reply("❌ Error: " + err.message);
    }
});

/**
 * Vercel serverless handler for Telegram webhook
 * Receives Telegram updates and processes them with the bot
 */
module.exports = async function handler(req, res) {
    // Prevent connection timeouts in Vercel
    res.setHeader("Connection", "close");

    if (req.method === "POST") {
        try {
            // Process incoming Telegram update
            await bot.handleUpdate(req.body);
            res.status(200).json({ ok: true });
        } catch (err) {
            console.error("Webhook handler error:", err.message);
            // Always return 200 to prevent Telegram from retrying
            res.status(200).json({ ok: true });
        }
    } else {
        // Health check endpoint
        res.status(200).json({ message: "AI Assistant Live!" });
    }
};