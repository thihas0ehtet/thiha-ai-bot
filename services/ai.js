const { handleGithubIssue, handleCreateRepo } = require("./github.js");
const clickup = require("./clickup.js");
const { callAI, parseAIResponse, clearCache } = require("./models.js");
const { SYSTEM_PROMPT } = require("./constants.js");
const { getUserMemory, updateUserMemory } = require("./firebase.js");

// Current active model (default from env or gemini)
let activeModel = process.env.AI_MODEL || "gemini";

// In-memory storage for conversation history per user
const userMemory = {};

function setModel(model) {
    activeModel = model || "gemini";
    return activeModel;
}

function getModel() {
    return activeModel;
}

/**
 * Clear conversation history for a specific user
 */
function clearMemory(userId) {
    if (userMemory[userId]) {
        delete userMemory[userId];
        return true;
    }
    return false;
}

// Format date for display
function formatDate(isoStr) {
    if (!isoStr) return 'Not set';
    return new Date(isoStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

// Process user commands using identified AI provider to identify action types
async function handleCommand(userId, command) {
    try {
        // 1. Fetch Long-Term Memory
        const longTermMemory = await getUserMemory(userId);
        const memoryStr = Object.keys(longTermMemory).length > 0
            ? `\n\n=== USER LONG-TERM MEMORY ===\n${JSON.stringify(longTermMemory, null, 2)}`
            : "";

        const enhancedSystemPrompt = SYSTEM_PROMPT + memoryStr;

        // 2. Manage Session History
        if (!userMemory[userId]) {
            userMemory[userId] = [];
        }

        userMemory[userId].push({ role: "user", content: command });

        if (userMemory[userId].length > 10) {
            userMemory[userId] = userMemory[userId].slice(-10);
        }

        // 3. Call AI
        const responseText = await callAI(activeModel, enhancedSystemPrompt, userMemory[userId]);

        // Add AI response to history
        userMemory[userId].push({ role: "assistant", content: responseText });

        // 4. Parse and Execute Action
        const action = parseAIResponse(responseText);

        if (!action) {
            return responseText;
        }

        // Handle Long-Term Memory Updates
        if (action.type === "update_memory") {
            const success = await updateUserMemory(userId, action.key, action.value);
            const msg = success
                ? `(Memory Updated: ${action.key}) `
                : `(Memory Update Failed) `;

            // Re-call AI message handler or just return the text if it was a message + memory update
            // Most AIs will just return the JSON. If it's update_memory, we might want to acknowledge it.
            return (action.text || "I've updated my long-term memory with that information.") + " ✅";
        }

        // Route to the correct handler
        if (action.type === "github_issue") {
            return await handleGithubIssue(action);
        } else if (action.type === "github_repo") {
            return await handleCreateRepo(action);
        } else if (action.type?.startsWith("clickup_")) {
            return await handleClickUpAction(action);
        } else if (action.type === "message") {
            return action.text || responseText;
        }

        return responseText;
    } catch (error) {
        throw error;
    }
}

// Handle all ClickUp actions dispatched by AI
async function handleClickUpAction(action) {
    try {
        switch (action.type) {
            case 'clickup_create_task': {
                const result = await clickup.createTaskByNames(
                    action.space_name,
                    action.folder_name,
                    action.list_name,
                    {
                        name: action.task_name,
                        description: action.description || '',
                        assignees: action.assignees || [],
                        priority: action.priority || null
                    }
                );
                return `✅ Task created!\n📌 **${result.name}**\n📋 List: ${result.list}\n🔗 ${result.url || 'No URL'}`;
            }

            case 'clickup_current_sprint': {
                const sprint = await clickup.getCurrentSprint(action.space_name, action.folder_name);
                if (sprint.error) return `⚠️ ${sprint.error}`;

                let msg = `📊 **Current Sprint: ${sprint.name}**\n`;
                msg += `📅 ${formatDate(sprint.startDate)} → ${formatDate(sprint.dueDate)}\n`;
                msg += `📈 Progress: ${sprint.completedTasks}/${sprint.totalTasks} tasks done\n`;
                msg += `⏳ Remaining: ${sprint.remainingTasks} tasks\n`;

                if (sprint.tasks.length > 0) {
                    msg += `\n📋 **Tasks:**\n`;
                    sprint.tasks.forEach(t => {
                        const assignees = t.assignees.length ? t.assignees.join(', ') : 'Unassigned';
                        msg += `• ${t.name} [${t.status}] → ${assignees}\n`;
                    });
                }
                return msg;
            }

            case 'clickup_remaining_tasks': {
                const result = await clickup.getRemainingTasks(
                    action.space_name,
                    action.folder_name,
                    action.list_name || null
                );
                if (result.error) return `⚠️ ${result.error}`;

                let msg = `⏳ **Remaining Tasks** (${result.remainingCount || result.tasks.length})\n\n`;
                result.tasks.forEach(t => {
                    const assignees = t.assignees?.length ? t.assignees.join(', ') : 'Unassigned';
                    const due = t.dueDate ? ` | Due: ${formatDate(t.dueDate)}` : '';
                    msg += `• ${t.name} [${t.status}] → ${assignees}${due}\n`;
                });
                return msg;
            }

            case 'clickup_sprint_deadline': {
                const sprint = await clickup.getCurrentSprint(action.space_name, action.folder_name);
                if (sprint.error) return `⚠️ ${sprint.error}`;

                let msg = `⏰ **Sprint Deadline: ${sprint.name}**\n`;
                msg += `📅 Start: ${formatDate(sprint.startDate)}\n`;
                msg += `🏁 Deadline: ${formatDate(sprint.dueDate)}\n`;

                if (sprint.dueDate) {
                    const daysLeft = Math.ceil((new Date(sprint.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                    msg += daysLeft > 0
                        ? `📆 ${daysLeft} days remaining\n`
                        : `🚨 Sprint is ${Math.abs(daysLeft)} days overdue!\n`;
                }

                msg += `📈 Progress: ${sprint.completedTasks}/${sprint.totalTasks} tasks done`;
                return msg;
            }

            case 'clickup_next_sprint': {
                const next = await clickup.getNextSprint(action.space_name, action.folder_name);
                if (next.error) return `⚠️ ${next.error}`;

                let msg = `⏭️ **Next Sprint: ${next.name}**\n`;
                msg += `📅 Starts: ${formatDate(next.startDate)}\n`;
                msg += `🏁 Due: ${formatDate(next.dueDate)}\n`;
                msg += `📋 Tasks: ${next.taskCount || 0}`;
                return msg;
            }

            case 'clickup_project_info': {
                const info = await clickup.getProjectInfo(action.space_name, action.folder_name);

                let msg = `📁 **Project: ${info.projectName}**\n`;
                msg += `🏢 Space: ${info.spaceName}\n`;
                msg += `📊 Total Tasks: ${info.totalTasks} (✅ ${info.completedTasks} done, ⏳ ${info.remainingTasks} remaining)\n\n`;
                msg += `📋 **Sprints/Lists:**\n`;
                info.sprints.forEach(s => {
                    msg += `• ${s.name} — ${s.taskCount || 0} tasks`;
                    if (s.dueDate) msg += ` | Due: ${formatDate(s.dueDate)}`;
                    msg += '\n';
                });
                return msg;
            }

            case 'clickup_task_assignees': {
                const sprint = await clickup.getCurrentSprint(action.space_name, action.folder_name);
                if (sprint.error) return `⚠️ ${sprint.error}`;

                const assigneeMap = {};
                sprint.tasks.forEach(t => {
                    const assignees = t.assignees.length ? t.assignees : ['Unassigned'];
                    assignees.forEach(a => {
                        if (!assigneeMap[a]) assigneeMap[a] = [];
                        assigneeMap[a].push(`${t.name} [${t.status}]`);
                    });
                });

                let msg = `👥 **Task Assignments — ${sprint.name}**\n\n`;
                Object.entries(assigneeMap).forEach(([person, tasks]) => {
                    msg += `**${person}** (${tasks.length} tasks):\n`;
                    tasks.forEach(t => msg += `  • ${t}\n`);
                    msg += '\n';
                });
                return msg;
            }

            case 'clickup_list_projects': {
                const projects = await clickup.listProjects(action.space_name);
                if (!projects.length) return `📭 No projects found in space "${action.space_name}"`;

                let msg = `📁 **Projects in "${action.space_name}":**\n\n`;
                projects.forEach(p => {
                    msg += `• **${p.name}** — ${p.listCount} lists/sprints\n`;
                });
                return msg;
            }

            case 'clickup_update_task': {
                const result = await clickup.updateTask(action.task_id, {
                    name: action.task_name || undefined,
                    status: action.status || undefined,
                    priority: action.priority || undefined,
                    assignees: action.assignees || undefined
                });
                return `✅ Task updated!\n📌 **${result.name}**\nStatus: ${result.status?.status || 'N/A'}`;
            }

            case 'clickup_delete_task': {
                await clickup.deleteTask(action.task_id);
                return `🗑️ Task deleted successfully (ID: ${action.task_id})`;
            }

            default:
                return `⚠️ Unknown ClickUp action: ${action.type}`;
        }
    } catch (error) {
        return `❌ ClickUp Error: ${error.message}`;
    }
}



