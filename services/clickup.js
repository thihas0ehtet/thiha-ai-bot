// const axios = require("axios");

// export async function createClickUpTask(name, assigneeId) {
//     const listId = "901816397206";
//     const response = await axios.post(
//         `https://api.clickup.com/api/v2/list/${listId}/task`,
//         { name, assignees: [assigneeId], status: "to do" },
//         { headers: { Authorization: process.env.CLICKUP_TOKEN } }
//     );
//     return response.data;
// }