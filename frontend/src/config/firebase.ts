import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration with Vite env support
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDRRn9KvB7hIf3fNCnYeEk1y9KEpn21KWc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sih-thermal-trace-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sih-thermal-trace-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sih-thermal-trace-ai.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "876182865682",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:876182865682:web:a29e75150943f5b61155cb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-C913V7VYD0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Firebase Analytics not supported in this environment:", err);
  });
}
