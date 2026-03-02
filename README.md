# Thiha AI Bot

An intelligent AI-powered bot that integrates with Telegram, GitHub, ClickUp, and Discord to automate task management and notifications.

## Features

- 🤖 **AI-Powered Commands** - Using Gemini AI to process and execute commands
- 📱 **Telegram Integration** - Interact with the bot via Telegram
- 🐙 **GitHub Integration** - Automatically create GitHub issues
- ✅ **ClickUp Integration** - Create and manage tasks in ClickUp
- 🎵 **Discord Integration** - Send notifications to Discord channels
- 🔄 **Service Sync** - Automatically sync tasks across multiple platforms

## Prerequisites

Make sure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager

## Environment Setup

### Configure Environment Variables

Edit the `.env` file in the project root and add your API credentials for each service:

#### **Telegram Bot Token**
1. Create a bot with [@BotFather](https://t.me/botfather) on Telegram
2. Copy the bot token and add it to:
   ```
   TELEGRAM_BOT_TOKEN=your_token_here
   ```

#### **Gemini API Key**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Add it to:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

#### **GitHub Token**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` and `issues` permissions
3. Add it to:
   ```
   GITHUB_TOKEN=your_token_here
   ```

#### **ClickUp Token**
1. Go to [ClickUp Settings](https://app.clickup.com/settings/integrations)
2. Generate an API token in the Integrations tab
3. Find your List ID by opening a list and copying the ID from the URL
4. CLICKUP_TOKEN=your_token_here
   ```

#### **Discord Webhook URL**
1. Create a Discord webhook in your server (Server Settings → Integrations → Webhooks)
2. Copy the webhook URL and add it to:
   Add it to:
   ```
   CLICKUP_TOKEN=your_token_hereptional)
```your_webhook_url_here
   ### 1. Install Dependencies

```bash
npm install
```

### 2. Verify Setup

Ensure all required environment variables are set:

```bash
# Check if .env file exists
ls -la .env

# Test by running your application
node api/telegram.js
```

## Usage

### Running the Bot

```bash
npm start
```

Or directly run:

```bash
node api/telegram.js
```

### Interacting with the Bot

Send a command to your Telegram bot:

```
/ai Create a GitHub issue titled "Fix login bug"
```

The bot will:
1. ✅ Process your command with Gemini AI
2. 🐙 Create a GitHub issue
3. ✅ Add a task to ClickUp
4. 🎵 Notify Discord about the new task

## Project Structure

```
thiha-ai-bot/
├── api/
│   └── telegram.js          # Telegram bot handler
├── services/
│   ├── ai.js               # AI command processor
│   ├── github.js           # GitHub integration
│   ├── clickup.js          # ClickUp integration
│   └── discord.js          # Discord notifications
├── package.json
├── .env.example            # Environment variables template
├── .env                    # Local environment variables (DO NOT COMMIT)
└── README.md              # This file
```

## Important Security Notes

- ⚠️ **Never commit the `.env` file** to version control
- The `.gitignore` should include `.env`
- Keep all API tokens and secrets confidential
- Use separate tokens for different environments (development, production)

## Troubleshooting

### "TELEGRAM_BOT_TOKEN is not defined"
- Make sure `.env` file exists in the project root
- Verify the variable name matches exactly
- Reload your application after updating `.env`

### "Invalid API Key" errors
- Double-check the API key is correct
- Ensure the token hasn't expired
- Verify the token has necessary permissions

### "Webhook request failed"
- Verify the Discord webhook URL is active
- Check the webhook hasn't been deleted from Discord settings
- Ensure the webhook has permission to send messages

## Dependencies

- **axios** - HTTP client for API requests
- **dotenv** - Environment variable loader
- **express** - Web framework
- **telegraf** - Telegram bot framework

## License

ISC

## Support

For issues or questions, please check the documentation for each integrated service or create an issue in the repository.
