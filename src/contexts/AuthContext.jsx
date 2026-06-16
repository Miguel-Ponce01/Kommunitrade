import { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  updateProfile,
  createUserProfile,
  doc,
  getDoc,
  applyActionCode,
} from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Verify profile exists and E2EE keys are synced
          await createUserProfile(user);
        } catch (e) {
          console.error("Failed to sync/create profile on state change:", e);
        }
        // Fetch Firestore profile
        const snap = await getDoc(doc(db, "users", user.uid));
        setUserProfile(snap.exists() ? snap.data() : null);
      } else {
        setUserProfile(null);
      }
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Google Sign-In ─────────────────────────────────────────────
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserProfile(result.user);
    return result.user;
  };

  // ── Email Register ─────────────────────────────────────────────
  const registerWithEmail = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    try {
      await updateProfile(result.user, { displayName });
    } catch (updateErr) {
      console.warn("Failed to update user profile displayName:", updateErr);
    }
    
    try {
      await sendEmailVerification(result.user);
    } catch (emailErr) {
      console.warn("Failed to send verification email:", emailErr);
    }

    try {
      await createUserProfile(result.user, { displayName });
    } catch (profileErr) {
      // Profile creation failed (e.g., App Check / rules issue), but the Firebase Auth
      // account was created successfully. The onAuthStateChanged listener will retry
      // createUserProfile on next sign-in.
      console.warn("Profile creation after registration failed (will retry on login):", profileErr);
    }
    return result.user;
  };

  // ── Email Sign-In ──────────────────────────────────────────────
  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await createUserProfile(result.user);
    return result.user;
  };

  // ── Resend Verification Email ──────────────────────────────────
  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  // ── Verify Email Code ──────────────────────────────────────────
  const verifyEmailCode = async (oobCode) => {
    await applyActionCode(auth, oobCode);
    await refreshUserProfile();
  };

  // ── Setup reCAPTCHA for Phone Auth ─────────────────────────────
  const setupRecaptcha = (containerId) => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {},
    });
    return window.recaptchaVerifier;
  };

  // ── Send Phone OTP ─────────────────────────────────────────────
  const sendPhoneOTP = async (phoneNumber, containerId) => {
    const recaptcha = setupRecaptcha(containerId);
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptcha);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  };

  // ── Verify Phone OTP ───────────────────────────────────────────
  const verifyPhoneOTP = async (otp) => {
    if (!window.confirmationResult) throw new Error("No OTP session found. Please try again.");
    const result = await window.confirmationResult.confirm(otp);
    await createUserProfile(result.user);
    return result.user;
  };

  // ── Logout ─────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  };

  // ── Refresh user profile from Firestore (call after verification) ─
  const refreshUserProfile = async () => {
    if (!auth.currentUser) return;
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
    setUserProfile(snap.exists() ? snap.data() : null);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signInWithGoogle,
    registerWithEmail,
    loginWithEmail,
    resendVerification,
    sendPhoneOTP,
    verifyPhoneOTP,
    verifyEmailCode,
    logout,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
