const admin = require("firebase-admin");

// Initialize Firebase
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
            }),
        });
    } catch (error) {
        console.error("Firebase initialization error:", error.message);
    }
}

const db = admin.apps.length ? admin.firestore() : null;

/**
 * Get user long-term memory from Firestore
 */
async function getUserMemory(userId) {
    if (!db) return {};
    try {
        const doc = await db.collection("users").doc(userId.toString()).get();
        return doc.exists ? doc.data() : {};
    } catch (error) {
        console.error("Error fetching user memory:", error.message);
        return {};
    }
}

/**
 * Update user long-term memory in Firestore
 */
async function updateUserMemory(userId, key, value) {
    if (!db) return false;
    try {
        const update = {};
        update[key] = value;
        update.lastUpdated = admin.firestore.FieldValue.serverTimestamp();

        await db.collection("users").doc(userId.toString()).set(update, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating user memory:", error.message);
        return false;
    }
}

module.exports = {
    getUserMemory,
    updateUserMemory,
};
