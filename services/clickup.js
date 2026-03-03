async function createClickUpTask(name, assigneeId) {
    console.log("✅ Creating ClickUp task:", name);

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
            console.error("❌ ClickUp API error:", errorText);
            throw new Error(`ClickUp API returned ${response.status}: ${errorText}`);
        }

        const task = await response.json();
        console.log("✅ ClickUp task created:", task.id);
        return task;
    } catch (error) {
        console.error("💥 Error creating ClickUp task:", error.message);
        throw error;
    }
}

module.exports = { createClickUpTask };