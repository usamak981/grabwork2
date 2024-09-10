// src/services/messaging.js
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from './firebase';

export const requestNotificationPermission = async () => {
  try {
    await Notification.requestPermission();
  } catch (error) {
    console.error('An error occurred while requesting permission ', error);
  }
};

export const getMessagingToken = async () => {
  let currentToken = '';
  try {
    currentToken = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
    if (currentToken) {
      console.log('current token for client: ', currentToken);
      // Here you might want to send this token to your server
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
  }
  return currentToken;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });