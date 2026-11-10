import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";
import { getFunctions, Functions } from "firebase/functions";
import { getMessaging, Messaging, isSupported } from "firebase/messaging";

// Client configuration strictly from whatsapp-61eaa project
const firebaseConfig = {
  apiKey: "AIzaSyCFb0V_wQyd5fBNWu62ZjnU3ALQLpFGMx8",
  authDomain: "whatsapp-61eaa.firebaseapp.com",
  databaseURL: "https://whatsapp-61eaa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "whatsapp-61eaa",
  messagingSenderId: "438138259374",
  appId: "1:438138259374:web:b24650522c78b02ff66a3f",
};

// Initialize Firebase App singleton
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth
export const auth: Auth = getAuth(app);

// Cloud Firestore: Stores user profiles, conversations, messages, group information, call history and media metadata
export const db: Firestore = getFirestore(app);

// Realtime Database: Online/offline presence, last seen, typing indicators, WebRTC call signaling
export const rtdb: Database = getDatabase(app);

// Cloud Functions: Node.js + TypeScript functions
export const functions: Functions = getFunctions(app, "us-central1");

// Firebase Cloud Messaging (Guarded for SSR/browser support)
export let messaging: Messaging | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      try {
        messaging = getMessaging(app);
      } catch (err) {
        console.warn("FCM messaging initialization skipped:", err);
      }
    }
  });
}

// STRICT REQUIREMENT: Firebase Storage is intentionally NOT initialized or imported anywhere.
export default app;

