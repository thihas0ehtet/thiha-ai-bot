# Thiha AI Bot

An intelligent AI-powered bot that integrates with Telegram, GitHub, ClickUp, and Discord to automate task management and notifications.

## Features

- 🤖 **AI-Powered Commands** — Gemini AI parses natural language and routes to the right service
- 📱 **Telegram Integration** — Interact with the bot via Telegram
- 🐙 **GitHub Integration** — Create issues and repositories
- ✅ **ClickUp Full Project Management** — Sprints, tasks, assignees, deadlines, and more
- 🎵 **Discord Integration** — Send notifications to Discord channels
- 🔄 **Cross-Platform Sync** — Automatically sync tasks across GitHub, ClickUp, and Discord

## ClickUp Commands

Talk to the bot in **natural language** via Telegram. No hardcoded IDs — just use space/project/sprint names:

| Command Example | What It Does |
|---|---|
| `list all projects in MySpace` | Lists all folders/projects in a space |
| `tell me about MyProject` | Full project overview: tasks, sprints, progress |
| `what's the current sprint in MyProject?` | Active sprint info with task list |
| `remaining tasks in current sprint of MyProject` | Unfinished tasks with assignees |
| `who is assigned in current sprint of MyProject?` | Task assignments grouped by person |
| `when is the sprint deadline for MyProject?` | Sprint start/end dates + days remaining |
| `what's the next sprint of MyProject?` | Next upcoming sprint details |
| `create task "Create user API" in Sprint 1 of MyProject` | Creates a task in a specific sprint |
| `mark task abc123 as complete` | Updates a task status (needs task ID) |
| `delete task abc123` | Deletes a task (needs task ID) |

> **Note:** Replace `MySpace`, `MyProject`, and `Sprint 1` with your actual ClickUp space, folder, and list names.

## ClickUp Hierarchy

The bot maps to ClickUp's structure:

```
Workspace (Team)
 └── Space (e.g. "Engineering")
      └── Folder = Project (e.g. "MyProject")
           └── List = Sprint (e.g. "Sprint 1", "Sprint 2")
                └── Tasks
```

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** package manager

## Environment Setup

Edit the `.env` file with your API credentials:

#### Telegram Bot Token
1. Create a bot with [@BotFather](https://t.me/botfather) on Telegram
2. Copy the bot token:
   ```
   TELEGRAM_BOT_TOKEN=your_token_here
   ```

#### Authorized Users
```
AUTHORIZED_USER_IDS=your_telegram_user_id
```

#### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/) and create an API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

#### GitHub Token
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate token with `repo` and `issues` permissions:
   ```
   GITHUB_TOKEN=your_token_here
   ```

#### ClickUp Token
1. Go to [ClickUp Settings](https://app.clickup.com/settings/integrations) → API tab
2. Generate a personal token:
   ```
   CLICKUP_TOKEN=your_token_here
   CLICKUP_TEAM_ID=your_team_id_here  # optional, speeds up lookups
   ```

#### Discord Webhook URL
1. Create a webhook in your Discord server (Server Settings → Integrations → Webhooks):
   ```
   DISCORD_WEBHOOK_URL=your_webhook_url_here
   ```

## Installation

```bash
npm install
```

## Usage

### Deploy to Vercel

The bot runs as a Vercel serverless function:

```bash
vercel deploy
```

### Running Locally

```bash
node api/telegram.js
```

### Interacting with the Bot

Send messages to your Telegram bot in natural language:

```
Create a GitHub issue titled "Fix login bug"
→ Creates GitHub issue + ClickUp task + Discord notification

Tell me about MyProject
→ Shows project summary with all sprints and task counts

What's the current sprint in MyProject?
→ Shows active sprint with tasks, assignees, and progress
```

## Project Structure

```
thiha-ai-bot/
├── api/
│   └── telegram.js          # Telegram bot handler (Vercel serverless)
├── services/
│   ├── ai.js               # AI command processor (Gemini + action routing)
│   ├── clickup.js          # ClickUp API v2 integration (full project mgmt)
│   ├── github.js           # GitHub integration (issues + repos)
│   └── discord.js          # Discord webhook notifications
├── vercel.json             # Vercel config
├── package.json
├── .env.example            # Environment variables template
└── README.md
```

## Security Notes

- ⚠️ **Never commit `.env`** — it's in `.gitignore`
- Keep all API tokens confidential
- Use separate tokens for dev/production environments

## Troubleshooting

| Error | Fix |
|---|---|
| `TELEGRAM_BOT_TOKEN is not defined` | Check `.env` exists and variable name matches |
| `Invalid API Key` | Verify the key is correct and hasn't expired |
| `Space "X" not found` | Check the space name matches exactly (case-insensitive) |
| `Folder/Project "X" not found` | Verify the folder name in ClickUp |
| `ClickUp API 401` | Regenerate your ClickUp API token |
| `Webhook request failed` | Check Discord webhook URL is still active |

## Dependencies

- **dotenv** — Environment variable loader
- **express** — Web framework
- **telegraf** — Telegram bot framework

## License

ISC
