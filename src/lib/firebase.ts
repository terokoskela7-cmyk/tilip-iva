import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCy6nT6e-2wMGwE8hbiY55Q4yCEgUkZIDY",
  authDomain: "tilipaiva-prod.firebaseapp.com",
  projectId: "tilipaiva-prod",
  storageBucket: "tilipaiva-prod.firebasestorage.app",
  messagingSenderId: "515021197552",
  appId: "1:515021197552:web:bef8633235b1985462f235"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
