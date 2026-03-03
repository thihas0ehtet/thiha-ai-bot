const { Telegraf } = require("telegraf");
// const { handleCommand } = require("../services/ai");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply("✨ AI Assistant Ready! Send me a command."));

bot.command("ai", async (ctx) => {
    const command = ctx.message.text.replace("/ai", "").trim();
    if (!command) return ctx.reply("Please provide a command!");

    try {
        // const result = await handleCommand(command);
        ctx.reply("AI command received: " + command);
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Error: " + err.message);
    }
});

module.exports = async function handler(req, res) {
    if (req.method === "POST") {
        bot.handleUpdate(req.body);
        res.status(200).send("OK");
    } else {
        res.status(200).send("AI Assistant Live!");
    }
};