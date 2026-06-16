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
  applyActionCode,
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
let appCheck = null;
const disableAppCheck = import.meta.env.VITE_DISABLE_APP_CHECK === "true";

if (!disableAppCheck) {
  if (import.meta.env.DEV) {
    // Use a persistent debug token in dev mode to avoid a new random UUID on every refresh
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || "3222d5e6-1006-4a94-9523-e51fc4f1c2c4";
  }

  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    console.warn("App Check failed to initialize:", err);
  }
}

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
  applyActionCode,
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

  const isAdminAccount = user.email === "admin@komunitrade.com";

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || extraData.displayName || (isAdminAccount ? "System Admin" : "KomuniTrade User"),
      email: user.email || null,
      phoneNumber: user.phoneNumber || null,
      photoURL: user.photoURL || null,
      barangay: isAdminAccount ? "Central Office" : "",
      trustScore: 100,
      verified: isAdminAccount ? true : false,
      publicKeyJwk: publicKeyJwk, // register public key for E2EE
      createdAt: serverTimestamp(),
      role: isAdminAccount ? "admin" : "user",
      ...extraData,
    });
  } else {
    // If user profile exists but public key is missing or different (e.g. new device), update it
    const data = snap.data();
    const updates = {};
    
    if (isAdminAccount && data.role !== "admin") {
      updates.role = "admin";
      updates.verified = true;
    }
    
    if (publicKeyJwk) {
      const isDiff = !data.publicKeyJwk || 
        data.publicKeyJwk.x !== publicKeyJwk.x || 
        data.publicKeyJwk.y !== publicKeyJwk.y ||
        data.publicKeyJwk.kty !== publicKeyJwk.kty ||
        data.publicKeyJwk.crv !== publicKeyJwk.crv;
      if (isDiff) {
        updates.publicKeyJwk = publicKeyJwk;
      }
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
    }
  }
};

export default app;
