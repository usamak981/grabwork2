const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendNewRequestNotification = functions.firestore
    .document("requests/{requestId}")
    .onCreate(async (snap, context) => {
        const newRequest = snap.data();
        const providerId = newRequest.providerId;
        try {
            // Get the provider's document
            const providerDoc = await admin.firestore().collection("providers").doc(providerId).get();
            const providerData = providerDoc.data();
            const fcmToken = providerData.fcmToken; // Assuming you store the FCM token in the provider's document
            if (fcmToken) {
                const message = {
                    notification: {
                        title: "New Service Request",
                        body: `You have a new request for ${newRequest.serviceName}. Tap to view details.`,
                    },
                    data: {
                        requestId: context.params.requestId,
                    },
                    token: fcmToken,
                };
                // Send the message
                const response = await admin.messaging().send(message);
                console.log("Successfully sent message:", response);

                // Update the request document to indicate notification was sent
                await snap.ref.update({ notificationSent: true });
            } else {
                console.log("No FCM token found for provider:", providerId);
            }
        } catch (error) {
            console.error("Error sending notification:", error);
        }
    });
