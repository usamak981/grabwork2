import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  setDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';

export const getServices = async () => {
  const servicesRef = collection(db, 'services');
  const snapshot = await getDocs(servicesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getProviders = async (serviceId) => {
  const providersRef = collection(db, 'providers');
  const q = query(providersRef, where("services", "array-contains", serviceId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createRequest = async (requestData) => {
  const requestsRef = collection(db, 'requests');
  return await addDoc(requestsRef, requestData);
};

export const updateRequestStatus = async (requestId, status) => {
  const requestRef = doc(db, 'requests', requestId);
  await updateDoc(requestRef, { status });
};

export const createOrder = async (orderData) => {
  try {
    // Create the order
    const orderRef = await addDoc(collection(db, 'orders'), orderData);

    return { orderId: orderRef.id };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};
export const saveTemplate = async (userId, templateName, templateData) => {
  try {
    const templatesRef = collection(db, 'users', userId, 'cleanerTemplates');
    const docRef = await addDoc(templatesRef, {
      name: templateName,
      data: templateData,
      createdAt: new Date()
    });
    console.log("Template saved with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving template:", error);
    throw error;
  }
};

export const getTemplates = async (userId) => {
  try {
    const templatesRef = collection(db, 'users', userId, 'cleanerTemplates');
    const snapshot = await getDocs(templatesRef);
    const templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log("Retrieved templates:", templates);
    return templates;
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw error;
  }
};

export const updateTemplate = async (userId, templateId, templateData) => {
  try {
    const templateRef = doc(db, 'users', userId, 'cleanerTemplates', templateId);
    await updateDoc(templateRef, { data: templateData });
    console.log("Template updated successfully");
  } catch (error) {
    console.error("Error updating template:", error);
    throw error;
  }
};

export const deleteTemplate = async (userId, templateId) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'cleanerTemplates', templateId));
    console.log("Template deleted successfully");
  } catch (error) {
    console.error("Error deleting template:", error);
    throw error;
  }
};

export const getTemplate = async (userId, templateId) => {
  try {
    const templateRef = doc(db, 'users', userId, 'cleanerTemplates', templateId);
    const templateDoc = await getDoc(templateRef);
    if (templateDoc.exists()) {
      return { id: templateDoc.id, ...templateDoc.data() };
    } else {
      throw new Error("Template not found");
    }
  } catch (error) {
    console.error("Error fetching template:", error);
    throw error;
  }
};

export const createChat = async (orderId, userId, providerId, userName, providerName) => {
  try {
    const chatData = {
      orderId,
      userId,
      providerId,
      userName,
      providerName,
      lastMessage: '',
      lastMessageTime: null,
      participants: [userId, providerId]
    };

    const chatRef = await addDoc(collection(db, 'chats'), chatData);
    return chatRef.id;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};