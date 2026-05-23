import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  updateDoc,
  startAt,
  endAt,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getOrCreateUserKeys } from "./utils/crypto";

const firebaseConfig = {
  apiKey: "AIzaSyBElwEUo-IJ02SEooL4lNmnZvJ1cu1B4TE",
  authDomain: "komunitrade.firebaseapp.com",
  projectId: "komunitrade",
  storageBucket: "komunitrade.firebasestorage.app",
  messagingSenderId: "635774409762",
  appId: "1:635774409762:web:3783f42ba945255e9efe7b",
  measurementId: "G-YKEQD2MFCM",
};

const app = initializeApp(firebaseConfig);

// Initialize App Check
if (import.meta.env.DEV) {
  // This enables the debug provider and prints a debug token in the console
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to Functions emulator in local development mode
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

// Auth providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Auth helpers
export {
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
};

// Firestore helpers
export {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  updateDoc,
  startAt,
  endAt,
};

// Storage helpers
export { ref, uploadBytes, getDownloadURL };



/**
 * Creates or updates a user profile in Firestore.
 * Called after any successful sign-in.
 */
export const createUserProfile = async (user, extraData = {}) => {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  
  // Retrieve or generate browser-local E2EE keys
  const keys = await getOrCreateUserKeys();
  const publicKeyJwk = keys ? keys.publicKeyJwk : null;

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || extraData.displayName || "KomuniTrade User",
      email: user.email || null,
      phoneNumber: user.phoneNumber || null,
      photoURL: user.photoURL || null,
      barangay: "",
      trustScore: 100,
      verified: false,
      publicKeyJwk: publicKeyJwk, // register public key for E2EE
      createdAt: serverTimestamp(),
      ...extraData,
    });
  } else {
    // If user profile exists but public key is missing or different (e.g. new device), update it
    const data = snap.data();
    if (publicKeyJwk) {
      const isDiff = !data.publicKeyJwk || 
        data.publicKeyJwk.x !== publicKeyJwk.x || 
        data.publicKeyJwk.y !== publicKeyJwk.y ||
        data.publicKeyJwk.kty !== publicKeyJwk.kty ||
        data.publicKeyJwk.crv !== publicKeyJwk.crv;
      if (isDiff) {
        await updateDoc(userRef, {
          publicKeyJwk: publicKeyJwk
        });
      }
    }
  }
};

export default app;
