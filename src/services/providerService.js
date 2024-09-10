import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';  // Adjust the path to your Firebase config

export const searchProviders = async (service, city, region, property) => {
  const providersCollection = collection(db, 'providers');
  const q = query(
    providersCollection, 
    where('service', '==', service),
    where('location.city', '==', city),
    where('location.region', '==', region),
    where('location.properties', 'array-contains', property)  // Use array-contains to check for the property in the array
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};