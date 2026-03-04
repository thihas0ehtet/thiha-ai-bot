# Thiha AI Assistant (Pro)

An intelligent, multi-model AI bot that integrates with **Telegram, GitHub, ClickUp, Discord, and Firebase**. Designed to automate project management and provide contextual development assistance.

## 🚀 Key Features

- 🧠 **Smart Memory Layers**
  - **Short-Term (Session):** Remembers the last 10 messages for active context.
  - **Long-Term (Firebase):** Persists facts about your skills, products, and profile via Firestore.
- 🤖 **Multi-Model Support** — Switch between **Gemini**, **OpenAI (GPT-3.5-Turbo)**, and **OpenRouter** on the fly.
- ✅ **Advanced ClickUp Management** — Full control over Sprints, Tasks, Assignees, and Deadlines using natural language.
- 🐙 **GitHub Automation** — Create repositories and issues with ease.
- 🎵 **Discord Sync** — Real-time notifications for every AI action.
- ⚡ **AI Caching** — Intelligent MD5-based request caching to reduce API costs and improve speed.

---

## 📱 Telegram Commands

### AI Control
| Command | Description |
|---|---|
| `/model [name]` | Switch AI provider (gemini, openai, openrouter) |
| `/clear` | Wipe short-term session memory for a fresh start |
| `/clearcache` | Reset the AI response cache |
| `who are you?` | Custom identity response for Thiha's Assistant |
| `now ai model?` | Check which specific model is currently active |

### ClickUp & GitHub (Natural Language)
- `what's the current sprint in MyProject?`
- `show remaining tasks in Engineering space`
- `who is assigned to tasks in Sprint 1?`
- `create a GitHub repository named "NextJs-App"`
- `I'm an expert in Flutter` (Saves to Long-Term Memory)

---

## 🛠️ Hierarchy Mapping

The bot understands the following relationship structure:
```
Thiha's Workspace
 └── Space (Integration Space)
      └── Folder = Project (e.g. MyanOne, AI Bot)
           └── List = Sprint (e.g. Sprint 1, Backlog)
                └── Tasks
```

---

## ⚙️ Environment Configuration

Create a `.env` file with these keys (see `.env.example` for details):

```bash
# Core
TELEGRAM_BOT_TOKEN=...
AUTHORIZED_USER_IDS=...

# AI Keys
GEMINI_API_KEY=...
OPENAI_API_KEY=...
OPENROUTER_API_KEY=...

# Integrations
GITHUB_TOKEN=...
CLICKUP_TOKEN=...
DISCORD_WEBHOOK_URL=...

# Firebase (Long-Term Memory)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."
```

---

## 🏗️ Installation & Deployment

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Locally:**
   ```bash
   # Make sure your .env is set up
   node api/telegram.js
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel deploy --prod
   ```

---

## 📁 Project Structure

```
thiha-ai-bot/
├── api/
│   ├── index.js             # Project Info UI (Dashboard)
│   └── telegram.js          # Telegram Bot Webhook
├── services/
│   ├── ai.js                # Core Wisdom & Routing
│   ├── models.js            # AI Provider Logic (Caching + Multi-Model)
│   ├── firebase.js          # Long-Term Memory (Firestore)
│   ├── clickup.js           # ClickUp API Integration
│   ├── github.js            # GitHub API Integration
│   ├── discord.js           # Discord Webhook Service
│   └── constants.js         # System Prompts & Config
├── vercel.json              # Deployment Config
└── README.md                # This Guide
```

---

## ⚖️ License
ISC | Built by [Thiha Soe Htet](https://github.com/thihas0ehtet)
