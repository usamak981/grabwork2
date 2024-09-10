// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';
import { getStorage } from 'firebase/storage'; // Add this line

const firebaseConfig = {
  apiKey: "AIzaSyC8C7nCVw46ELsgzAla79ReCCIa5p6-D-w",
  authDomain: "grabwork-3e495.firebaseapp.com",
  projectId: "grabwork-3e495",
  storageBucket: "grabwork-3e495.appspot.com",
  messagingSenderId: "524034439198",
  appId: "1:524034439198:web:cf9110764349f171b7160f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app);
export const storage = getStorage(app); // Add this line