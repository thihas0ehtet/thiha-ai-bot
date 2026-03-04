module.exports = (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thiha AI Bot - Project Info</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: #6366f1;
                --primary-dark: #4f46e5;
                --bg: #0f172a;
                --card-bg: #1e293b;
                --text: #f8fafc;
                --text-dim: #94a3b8;
                --accent: #10b981;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Outfit', sans-serif; 
                background-color: var(--bg); 
                color: var(--text);
                line-height: 1.6;
                padding: 20px;
            }
            .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
            header { text-align: center; margin-bottom: 60px; }
            h1 { font-size: 3rem; font-weight: 700; margin-bottom: 10px; background: linear-gradient(135deg, #fff 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            p.subtitle { font-size: 1.2rem; color: var(--text-dim); }
            
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px; }
            .card { 
                background: var(--card-bg); 
                padding: 30px; 
                border-radius: 20px; 
                border: 1px solid rgba(255,255,255,0.05);
                transition: transform 0.3s ease, border-color 0.3s ease;
            }
            .card:hover { transform: translateY(-5px); border-color: var(--primary); }
            .card h3 { font-size: 1.4rem; margin-bottom: 15px; color: var(--primary); display: flex; align-items: center; gap: 10px; }
            .card p { color: var(--text-dim); font-size: 0.95rem; }
            
            .section { margin-bottom: 60px; }
            h2 { font-size: 2rem; margin-bottom: 30px; padding-left: 15px; border-left: 4px solid var(--primary); }
            
            ul { list-style: none; }
            li { margin-bottom: 15px; display: flex; align-items: flex-start; gap: 12px; }
            li::before { content: '→'; color: var(--accent); font-weight: bold; }
            
            code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #e2e8f0; }
            
            .badge { 
                display: inline-block; 
                padding: 4px 12px; 
                background: rgba(99, 102, 241, 0.1); 
                color: var(--primary); 
                border-radius: 100px; 
                font-size: 0.75rem; 
                font-weight: 600; 
                text-transform: uppercase; 
                letter-spacing: 0.05em;
                margin-bottom: 10px;
            }
            
            footer { text-align: center; margin-top: 80px; color: var(--text-dim); font-size: 0.9rem; padding-bottom: 40px; }
            a { color: var(--primary); text-decoration: none; }
            a:hover { text-decoration: underline; }

            @media (max-width: 640px) {
                h1 { font-size: 2.2rem; }
                .grid { grid-template-columns: 1fr; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <div class="badge">V1.5.0 - PRO</div>
                <h1>Thiha AI Assistant</h1>
                <p class="subtitle">Intelligent Task Management & AI-Powered Development</p>
            </header>

            <div class="section">
                <h2>Overview</h2>
                <div class="grid">
                    <div class="card">
                        <h3>🤖 Multi-Model AI</h3>
                        <p>Powered by <b>Gemini 1.5 Flash</b>, <b>OpenAI (GPT-3.5)</b>, and <b>OpenRouter</b>. Switch between them instantly using <code>/model</code>.</p>
                    </div>
                    <div class="card">
                        <h3>🧠 Smart Memory</h3>
                        <p><b>Short-term:</b> Active session context (10 messages).<br><b>Long-term:</b> Firestore persistence for your skills, projects & personal facts.</p>
                    </div>
                    <div class="card">
                        <h3>⚡ High Performance</h3>
                        <p>Includes an <b>MD5-based AI Caching</b> system to minimize API costs and provide lightning-fast responses for repeated queries.</p>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Deep Instructions</h2>
                <div class="card" style="width: 100%;">
                    <h3>How to interact with Thiha Assistant</h3>
                    <ul>
                        <li><strong>Identity & Model:</strong> Ask <code>"who are you?"</code> or <code>"what model are you using?"</code> to see personalized identity responses.</li>
                        <li><strong>ClickUp Management:</strong> Use natural language like <code>"what's the current sprint in Project MyanOne?"</code> or <code>"remaining tasks in Space X"</code>.</li>
                        <li><strong>GitHub Automation:</strong> Say <code>"Create a repo named MyProject"</code> or <code>"Create issue fix login bug"</code>.</li>
                        <li><strong>Long-Term Memory:</strong> Tell the AI <code>"I'm an expert in NestJS"</code> or <code>"My product is MyanOne"</code>. It will save this to Firebase and remember it tomorrow!</li>
                        <li><strong>Utility Commands:</strong>
                            <br><code>/clear</code> — Wipe short-term session memory.
                            <br><code>/clearcache</code> — Reset AI response cache.
                            <br><code>/model [name]</code> — Switch AI providers.
                        </li>
                    </ul>
                </div>
            </div>

            <div class="section">
                <h2>Hierarchy Awareness</h2>
                <div class="card" style="width: 100%; font-family: monospace; white-space: pre-wrap; background: #000;">
ClickUp Mapping:
Workspace (Thiha's Team)
 └── Space (Integration Space)
      └── Folder = Project (e.g. MyanOne, Thiha AI Bot)
           └── List = Sprint (e.g. Sprint 1, Backlog)
                └── Tasks (AI Managed)
                </div>
            </div>

            <footer>
                Built by <a href="https://github.com/thihas0ehtet">Thiha Soe Htet</a> &bull; Powered by Vercel & AI
            </footer>
        </div>
    </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
};
