const admin = require("firebase-admin");
const serviceAccount = require("../tests/grabwork-3e495-firebase-adminsdk-j57gb-ed945c894f.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function testFirestore() {
    try {
        console.log("Attempting to add document to Firestore...");

        // Pasting the new document creation line here
        const docRef = await db.collection("newTestCollection").add({
            name: "Test",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log("Document successfully written with ID: ", docRef.id);
    } catch (error) {
        console.error("Error writing document: ", error);
        console.error("Error Details: ", error.details);
        console.error("Error Metadata: ", error.metadata);
    } finally {
        admin.app().delete();
    }
}

testFirestore();