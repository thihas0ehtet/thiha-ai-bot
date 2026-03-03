const { Telegraf } = require("telegraf");
const { handleCommand } = require("../services/ai");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Handle unhandled rejections from Telegraf
process.on("unhandledRejection", (reason, promise) => {
    console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("💥 Uncaught Exception:", error);
});

bot.start((ctx) => ctx.reply("✨ AI Assistant Ready! Send me a command."));

bot.command("ai", async (ctx) => {
    const command = ctx.message.text.replace("/ai", "").trim();
    console.log("💬 AI command received:", command);

    if (!command) {
        console.log("⚠️ Empty command provided");
        return ctx.reply("Please provide a command!");
    }

    try {
        console.log("⏳ Waiting for handleCommand response...");
        const result = await handleCommand(command);
        console.log("📤 Sending response to Telegram:", result.slice(0, 100) + "...");
        ctx.reply(result);
    } catch (err) {
        console.error("🔴 Error in AI command handler:", err.message, err.stack);
        ctx.reply("❌ Error: " + err.message);
    }
});

module.exports = async function handler(req, res) {
    console.log("📥 Incoming request:", req.method);
    console.log("📝 Request body:", JSON.stringify(req.body));

    // Set timeout for Vercel
    res.setHeader("Connection", "close");

    if (req.method === "POST") {
        try {
            console.log("🤖 Handling Telegram update...");
            await bot.handleUpdate(req.body);
            console.log("✅ Update handled successfully");
            res.status(200).json({ ok: true });
        } catch (err) {
            console.error("❌ Handler error:", err.message);
            console.error("📍 Error details:", err.stack);
            res.status(200).json({ ok: true }); // Still return 200 to avoid Telegram retries
        }
    } else {
        console.log("ℹ️ Health check request");
        res.status(200).json({ message: "AI Assistant Live!" });
    }
};