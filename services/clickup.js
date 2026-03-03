const CLICKUP_BASE = 'https://api.clickup.com/api/v2';

function headers() {
    return {
        'Authorization': process.env.CLICKUP_TOKEN,
        'Content-Type': 'application/json'
    };
}

async function clickupFetch(path, options = {}) {
    const response = await fetch(`${CLICKUP_BASE}${path}`, {
        ...options,
        headers: { ...headers(), ...options.headers }
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`ClickUp API ${response.status}: ${text}`);
    }
    return response.json();
}

// ─── Core Data Retrieval ────────────────────────────────────────

async function getWorkspaces() {
    const data = await clickupFetch('/team');
    return data.teams;
}

async function getSpaces(teamId) {
    const data = await clickupFetch(`/team/${teamId}/space`);
    return data.spaces;
}

async function getFolders(spaceId) {
    const data = await clickupFetch(`/space/${spaceId}/folder`);
    return data.folders;
}

async function getLists(folderId) {
    const data = await clickupFetch(`/folder/${folderId}/list`);
    return data.lists;
}

async function getFolderlessLists(spaceId) {
    const data = await clickupFetch(`/space/${spaceId}/list`);
    return data.lists;
}

async function getTasks(listId, includeCompleted = true) {
    const params = includeCompleted ? '?include_closed=true' : '';
    const data = await clickupFetch(`/list/${listId}/task${params}`);
    return data.tasks;
}

async function getTaskDetails(taskId) {
    return await clickupFetch(`/task/${taskId}`);
}

async function getWorkspaceMembers(teamId) {
    const teams = await getWorkspaces();
    const team = teamId
        ? teams.find(t => t.id === teamId)
        : teams[0];
    return team?.members || [];
}

// ─── Name-Based Lookups ─────────────────────────────────────────

async function getDefaultTeamId() {
    if (process.env.CLICKUP_TEAM_ID) return process.env.CLICKUP_TEAM_ID;
    const teams = await getWorkspaces();
    if (!teams.length) throw new Error('No ClickUp workspaces found');
    return teams[0].id;
}

async function findSpaceByName(spaceName) {
    const teamId = await getDefaultTeamId();
    const spaces = await getSpaces(teamId);
    const space = spaces.find(s =>
        s.name.toLowerCase() === spaceName.toLowerCase()
    );
    if (!space) throw new Error(`Space "${spaceName}" not found`);
    return space;
}

async function findFolderByName(spaceId, folderName) {
    const folders = await getFolders(spaceId);
    const folder = folders.find(f =>
        f.name.toLowerCase() === folderName.toLowerCase()
    );
    if (!folder) throw new Error(`Folder/Project "${folderName}" not found in space`);
    return folder;
}

async function findListByName(folderId, listName) {
    const lists = await getLists(folderId);
    const list = lists.find(l =>
        l.name.toLowerCase() === listName.toLowerCase()
    );
    if (!list) throw new Error(`List/Sprint "${listName}" not found in folder`);
    return list;
}

// Resolve space + folder names to IDs
async function resolveProject(spaceName, folderName) {
    const space = await findSpaceByName(spaceName);
    const folder = await findFolderByName(space.id, folderName);
    return { space, folder };
}

// ─── Sprint Functions (Lists = Sprints) ─────────────────────────

async function getAllSprints(spaceId, folderName) {
    const folder = await findFolderByName(spaceId, folderName);
    const lists = await getLists(folder.id);
    return lists.map(l => ({
        id: l.id,
        name: l.name,
        status: l.status,
        startDate: l.start_date ? new Date(parseInt(l.start_date)).toISOString() : null,
        dueDate: l.due_date ? new Date(parseInt(l.due_date)).toISOString() : null,
        taskCount: l.task_count
    }));
}

async function getCurrentSprint(spaceName, folderName) {
    const { space, folder } = await resolveProject(spaceName, folderName);
    const lists = await getLists(folder.id);
    const now = Date.now();

    // Find active sprint: list whose start_date <= now <= due_date
    let currentList = lists.find(l => {
        const start = l.start_date ? parseInt(l.start_date) : 0;
        const end = l.due_date ? parseInt(l.due_date) : Infinity;
        return start <= now && now <= end;
    });

    // Fallback: first non-closed list or the latest list
    if (!currentList) {
        currentList = lists.find(l => l.status?.status !== 'closed') || lists[0];
    }

    if (!currentList) {
        return { error: 'No sprint lists found in this project' };
    }

    return await getSprintDetails(currentList.id, currentList);
}

async function getSprintDetails(listId, listMeta = null) {
    const tasks = await getTasks(listId);
    const meta = listMeta || await clickupFetch(`/list/${listId}`);

    const completedStatuses = ['closed', 'complete', 'done', 'resolved'];
    const completed = tasks.filter(t =>
        completedStatuses.includes(t.status?.status?.toLowerCase())
    );
    const remaining = tasks.filter(t =>
        !completedStatuses.includes(t.status?.status?.toLowerCase())
    );

    return {
        name: meta.name,
        id: meta.id || listId,
        startDate: meta.start_date ? new Date(parseInt(meta.start_date)).toISOString() : null,
        dueDate: meta.due_date ? new Date(parseInt(meta.due_date)).toISOString() : null,
        totalTasks: tasks.length,
        completedTasks: completed.length,
        remainingTasks: remaining.length,
        tasks: tasks.map(t => ({
            id: t.id,
            name: t.name,
            status: t.status?.status,
            assignees: t.assignees?.map(a => a.username || a.email) || [],
            priority: t.priority?.priority,
            dueDate: t.due_date ? new Date(parseInt(t.due_date)).toISOString() : null
        }))
    };
}

async function getRemainingTasks(spaceName, folderName, listName) {
    let listId;
    if (listName) {
        const { folder } = await resolveProject(spaceName, folderName);
        const list = await findListByName(folder.id, listName);
        listId = list.id;
    } else {
        // Use current sprint
        const sprint = await getCurrentSprint(spaceName, folderName);
        if (sprint.error) return sprint;
        return {
            sprintName: sprint.name,
            remainingCount: sprint.remainingTasks,
            tasks: sprint.tasks.filter(t =>
                !['closed', 'complete', 'done', 'resolved'].includes(t.status?.toLowerCase())
            )
        };
    }

    const tasks = await getTasks(listId);
    const completedStatuses = ['closed', 'complete', 'done', 'resolved'];
    const remaining = tasks.filter(t =>
        !completedStatuses.includes(t.status?.status?.toLowerCase())
    );

    return {
        remainingCount: remaining.length,
        tasks: remaining.map(t => ({
            id: t.id,
            name: t.name,
            status: t.status?.status,
            assignees: t.assignees?.map(a => a.username || a.email) || [],
            priority: t.priority?.priority,
            dueDate: t.due_date ? new Date(parseInt(t.due_date)).toISOString() : null
        }))
    };
}

async function getNextSprint(spaceName, folderName) {
    const { folder } = await resolveProject(spaceName, folderName);
    const lists = await getLists(folder.id);
    const now = Date.now();

    // Find lists starting after now
    const futureLists = lists
        .filter(l => l.start_date && parseInt(l.start_date) > now)
        .sort((a, b) => parseInt(a.start_date) - parseInt(b.start_date));

    if (futureLists.length > 0) {
        const next = futureLists[0];
        return {
            name: next.name,
            id: next.id,
            startDate: new Date(parseInt(next.start_date)).toISOString(),
            dueDate: next.due_date ? new Date(parseInt(next.due_date)).toISOString() : null,
            taskCount: next.task_count
        };
    }

    // Fallback: find the list right after current sprint
    const currentIdx = lists.findIndex(l => {
        const start = l.start_date ? parseInt(l.start_date) : 0;
        const end = l.due_date ? parseInt(l.due_date) : Infinity;
        return start <= now && now <= end;
    });

    if (currentIdx >= 0 && currentIdx + 1 < lists.length) {
        const next = lists[currentIdx + 1];
        return {
            name: next.name,
            id: next.id,
            startDate: next.start_date ? new Date(parseInt(next.start_date)).toISOString() : null,
            dueDate: next.due_date ? new Date(parseInt(next.due_date)).toISOString() : null,
            taskCount: next.task_count
        };
    }

    return { error: 'No next sprint found' };
}

// ─── Project Info ───────────────────────────────────────────────

async function getProjectInfo(spaceName, folderName) {
    const { space, folder } = await resolveProject(spaceName, folderName);
    const lists = await getLists(folder.id);

    let totalTasks = 0;
    let completedTasks = 0;
    for (const list of lists) {
        totalTasks += list.task_count || 0;
    }

    // Get tasks from all lists to compute completed count
    const allTasks = [];
    for (const list of lists) {
        const tasks = await getTasks(list.id);
        allTasks.push(...tasks);
    }

    const completedStatuses = ['closed', 'complete', 'done', 'resolved'];
    completedTasks = allTasks.filter(t =>
        completedStatuses.includes(t.status?.status?.toLowerCase())
    ).length;

    return {
        projectName: folder.name,
        projectId: folder.id,
        spaceName: space.name,
        spaceId: space.id,
        sprints: lists.map(l => ({
            name: l.name,
            id: l.id,
            taskCount: l.task_count,
            startDate: l.start_date ? new Date(parseInt(l.start_date)).toISOString() : null,
            dueDate: l.due_date ? new Date(parseInt(l.due_date)).toISOString() : null
        })),
        totalTasks: allTasks.length,
        completedTasks,
        remainingTasks: allTasks.length - completedTasks
    };
}

async function listProjects(spaceName) {
    const space = await findSpaceByName(spaceName);
    const folders = await getFolders(space.id);
    return folders.map(f => ({
        name: f.name,
        id: f.id,
        listCount: f.lists?.length || 0
    }));
}

// ─── Task Management ────────────────────────────────────────────

async function createTask(listId, taskData) {
    const body = {
        name: taskData.name,
        description: taskData.description || '',
        assignees: taskData.assignees || [],
        priority: taskData.priority || null,
        status: taskData.status || 'to do',
        due_date: taskData.dueDate || null,
        start_date: taskData.startDate || null
    };

    return await clickupFetch(`/list/${listId}/task`, {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

async function createTaskByNames(spaceName, folderName, listName, taskData) {
    const { folder } = await resolveProject(spaceName, folderName);
    const list = await findListByName(folder.id, listName);
    const task = await createTask(list.id, taskData);
    return {
        id: task.id,
        name: task.name,
        url: task.url,
        status: task.status?.status,
        list: list.name
    };
}

async function updateTask(taskId, updates) {
    const body = {};
    if (updates.name) body.name = updates.name;
    if (updates.description) body.description = updates.description;
    if (updates.status) body.status = updates.status;
    if (updates.priority) body.priority = updates.priority;
    if (updates.dueDate) body.due_date = updates.dueDate;
    if (updates.assignees) body.assignees = { add: updates.assignees };

    return await clickupFetch(`/task/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

async function deleteTask(taskId) {
    await clickupFetch(`/task/${taskId}`, { method: 'DELETE' });
    return { success: true, taskId };
}

// ─── Legacy compatibility ───────────────────────────────────────

async function createClickUpTask(name, assigneeId, listId = process.env.CLICKUP_LIST_ID) {
    if (!listId) throw new Error('CLICKUP_LIST_ID not set and no listId provided');
    return await createTask(listId, {
        name,
        assignees: assigneeId ? [assigneeId] : []
    });
}

// ─── Exports ────────────────────────────────────────────────────

module.exports = {
    // Core
    getWorkspaces,
    getSpaces,
    getFolders,
    getLists,
    getFolderlessLists,
    getTasks,
    getTaskDetails,
    getWorkspaceMembers,
    // Lookups
    getDefaultTeamId,
    findSpaceByName,
    findFolderByName,
    findListByName,
    resolveProject,
    // Sprint
    getAllSprints,
    getCurrentSprint,
    getSprintDetails,
    getRemainingTasks,
    getNextSprint,
    // Project
    getProjectInfo,
    listProjects,
    // Task Management
    createTask,
    createTaskByNames,
    updateTask,
    deleteTask,
    // Legacy
    createClickUpTask
};