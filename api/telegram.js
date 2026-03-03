const { Telegraf } = require("telegraf");
const { handleCommand } = require("../services/ai");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

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

    if (req.method === "POST") {
        try {
            console.log("🤖 Handling Telegram update...");
            bot.handleUpdate(req.body);
            console.log("✅ Update handled successfully");
            res.status(200).send("OK");
        } catch (err) {
            console.error("❌ Handler error:", err);
            res.status(500).send("Internal Server Error");
        }
    } else {
        console.log("ℹ️ Health check request");
        res.status(200).send("AI Assistant Live!");
    }
};