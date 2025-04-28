import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8b6aLHGcvvuuLEHic98Brf3fgqSEs7Ug",
  authDomain: "cyberxbyts.firebaseapp.com",
  databaseURL:
    "https://cyberxbyts-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cyberxbyts",
  storageBucket: "cyberxbyts.firebasestorage.app",
  messagingSenderId: "689370104692",
  appId: "1:689370104692:web:0f236bdec8d0d0d5e76221",
  measurementId: "G-66YNWC95BG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Realtime Database
export const rtdb = getDatabase(app);

export { analytics };
