const { handleGithubIssue, handleCreateRepo } = require("./github.js");
const clickup = require("./clickup.js");

// Format date for display
function formatDate(isoStr) {
    if (!isoStr) return 'Not set';
    return new Date(isoStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
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

// Process user commands using Gemini AI to identify action types
async function handleCommand(command) {
    const apiKey = process.env.GEMINI_API_KEY;
    const baseUrl = process.env.GEMINI_API_URL;
    const url = `${baseUrl}:generateContent?key=${apiKey}`;

    try {
        const systemPrompt = `You are an AI assistant that helps manage GitHub and ClickUp projects, and send Discord notifications.

IMPORTANT: Always respond with ONLY valid JSON, nothing else. No markdown, no explanation.

=== GITHUB ACTIONS ===

Create GitHub issue:
{ "type": "github_issue", "title": "issue title", "body": "issue description" }

Create GitHub repository:
{ "type": "github_repo", "name": "repo name", "description": "repo description", "private": false }

=== CLICKUP ACTIONS ===

The user will refer to projects by SPACE NAME and FOLDER/PROJECT NAME. Sprints are LISTS within folders.

Create a task in a specific sprint/list:
{ "type": "clickup_create_task", "space_name": "MySpace", "folder_name": "MyProject", "list_name": "Sprint 1", "task_name": "task title", "description": "optional description", "priority": null }

Get current sprint info:
{ "type": "clickup_current_sprint", "space_name": "MySpace", "folder_name": "MyProject" }

Get remaining tasks in current sprint:
{ "type": "clickup_remaining_tasks", "space_name": "MySpace", "folder_name": "MyProject", "list_name": null }

Get sprint deadline:
{ "type": "clickup_sprint_deadline", "space_name": "MySpace", "folder_name": "MyProject" }

Get next sprint:
{ "type": "clickup_next_sprint", "space_name": "MySpace", "folder_name": "MyProject" }

Get full project info:
{ "type": "clickup_project_info", "space_name": "MySpace", "folder_name": "MyProject" }

See who is assigned to tasks:
{ "type": "clickup_task_assignees", "space_name": "MySpace", "folder_name": "MyProject" }

List all projects in a space:
{ "type": "clickup_list_projects", "space_name": "MySpace" }

Update a task (need task_id):
{ "type": "clickup_update_task", "task_id": "taskid", "status": "complete", "task_name": null, "priority": null }

Delete a task (need task_id):
{ "type": "clickup_delete_task", "task_id": "taskid" }

=== REGULAR MESSAGE ===

For regular conversation or questions:
{ "type": "message", "text": "your response here" }

RULES:
- Extract space_name, folder_name, list_name from user's message
- If user says "project X" it refers to folder_name
- If user says "sprint 1" or "list name" it refers to list_name
- If user says "in space X" it refers to space_name
- Always respond with ONLY valid JSON`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: command }] }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const aiResponse = await response.json();

        if (!aiResponse.candidates?.[0]?.content) {
            return "Unable to process request";
        }

        const responseText = aiResponse.candidates[0].content.parts[0].text;

        // Parse structured action from AI response
        let action = {};
        try {
            let jsonStr = responseText;
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }
            action = JSON.parse(jsonStr);
        } catch (e) {
            return responseText;
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

module.exports = { handleCommand };