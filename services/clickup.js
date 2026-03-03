/**
 * Create a task in ClickUp
 * @param {string} name - Task name/title
 * @param {string|null} assigneeId - Optional assignee ID
 * @returns {Promise<object>} ClickUp task object with ID
 */
async function createClickUpTask(name, assigneeId) {
    const listId = "901816397206";

    try {
        const response = await fetch(
            `https://api.clickup.com/api/v2/list/${listId}/task`,
            {
                method: 'POST',
                headers: {
                    'Authorization': process.env.CLICKUP_TOKEN,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    assignees: assigneeId ? [assigneeId] : [],
                    status: "to do"
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ClickUp API returned ${response.status}: ${errorText}`);
        }

        const task = await response.json();
        return task;
    } catch (error) {
        console.error("ClickUp task creation failed:", error.message);
        throw error;
    }
}

module.exports = { createClickUpTask };