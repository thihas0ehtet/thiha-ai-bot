const { Telegraf } = require("telegraf");
const { handleCommand, setModel, getModel } = require("../services/ai.js");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Parse authorized user IDs from environment variable (comma-separated)
const AUTHORIZED_USER_IDS = (process.env.AUTHORIZED_USER_IDS || "").split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));

const isAuthorized = (userId) => AUTHORIZED_USER_IDS.includes(userId);

bot.start((ctx) => {
    if (!isAuthorized(ctx.from.id)) {
        return ctx.reply("❌ You don't have access to this bot.");
    }
    ctx.reply("✨ AI Assistant Ready! Just send me a message.\n\nUse /model to check or change the AI model.");
});

// Handle /model command
bot.command('model', async (ctx) => {
    if (!isAuthorized(ctx.from.id)) return;

    const text = ctx.message.text.split(' ');
    if (text.length === 1) {
        return ctx.reply(`🤖 Current model: **${getModel()}**\n\nTo switch, use:\n- \`/model gemini\`\n- \`/model openai\``, { parse_mode: 'Markdown' });
    }

    const newModel = text[1].toLowerCase();
    if (['gemini', 'openai'].includes(newModel)) {
        setModel(newModel);
        const details = newModel === 'openai' ? ` (${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'})` : '';
        ctx.reply(`✅ Switched to **${newModel}**${details}`, { parse_mode: 'Markdown' });
    } else {
        ctx.reply("❌ Invalid model. Use `gemini` or `openai`.");
    }
});

// Handle all text messages
bot.on('text', async (ctx) => {
    // Skip if it's a command
    if (ctx.message.text.startsWith('/')) return;

    // Check authorization
    if (!isAuthorized(ctx.from.id)) {
        return ctx.reply("❌ You don't have access to this bot.");
    }

    const command = ctx.message.text;

    try {
        const result = await handleCommand(command);
        ctx.reply(result);
    } catch (err) {
        console.error("Error processing message:", err.message);
        ctx.reply("❌ Error: " + err.message);
    }
});

// Vercel serverless handler
module.exports = async (req, res) => {
    try {
        await bot.handleUpdate(req.body);
        res.status(200).json({ ok: true });
    } catch (err) {
        console.error("Webhook error:", err.message);
        res.status(200).json({ ok: true });
    }
};