import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase'; // Adjust this import based on your firebase.js file

export async function createNewRequest(serviceData) {
  try {
    const docRef = await addDoc(collection(db, "requests"), {
      serviceName: serviceData.serviceName,
      providerId: serviceData.providerId,
      userId: serviceData.userId,
      createdAt: new Date(),
      status: "pending"
    });
    console.log("New request created with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating new request: ", error);
    throw error;
  }
}