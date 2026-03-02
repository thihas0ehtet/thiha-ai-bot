import { Telegraf } from "telegraf";
import { handleCommand } from "../services/ai.js";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply("✨ AI Assistant Ready! Send me a command."));
bot.command("ai", async (ctx) => {
    const command = ctx.message.text.replace("/ai", "").trim();
    if (!command) return ctx.reply("Please give a command!");

    try {
        const result = await handleCommand(command);
        ctx.reply(result);
    } catch (err) {
        ctx.reply("❌ Error: " + err.message);
    }
});

export default async function handler(req, res) {
    if (req.method === "POST") {
        bot.handleUpdate(req.body);
        res.status(200).send("OK");
    } else {
        res.status(200).send("Hello from Thiha AI Assistant!");
    }
}