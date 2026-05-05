import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, where } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export { signInAnonymously, signOut, onAuthStateChanged };
export { doc, setDoc, collection, getDocs, deleteDoc, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, where };

const firebaseConfig = {
  apiKey: "AIzaSyBElwEUo-IJ02SEooL4lNmnZvJ1cu1B4TE",
  authDomain: "komunitrade.firebaseapp.com",
  projectId: "komunitrade",
  storageBucket: "komunitrade.firebasestorage.app",
  messagingSenderId: "635774409762",
  appId: "1:635774409762:web:3783f42ba945255e9efe7b",
  measurementId: "G-YKEQD2MFCM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Ensures the user is signed in anonymously.
 * Essential for the "Anonymous Communication" claim in your manuscript.
 */
export const initAnonymousAuth = async () => {
  try {
    if (!auth.currentUser) {
      const userCredential = await signInAnonymously(auth);
      console.log("Signed in anonymously as:", userCredential.user.uid);
      return userCredential.user;
    }
    return auth.currentUser;
  } catch (error) {
    console.error("Anonymous Auth Error:", error);
    throw error;
  }
};

export default app;
