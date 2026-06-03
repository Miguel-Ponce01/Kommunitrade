import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, KeyRound, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle, Sparkles } from "lucide-react";
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, createUserProfile } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import "../index.css";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@komunitrade.com";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
const ADMIN_DISPLAY_NAME = import.meta.env.VITE_ADMIN_DISPLAY_NAME || "System Admin";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && userProfile && userProfile.role === "admin") {
      navigate("/admin/dashboard");
    }
  }, [authLoading, userProfile, navigate]);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Initial check against environment credentials
    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      setError("Unauthorized access. Invalid developer/admin credentials.");
      setLoading(false);
      return;
    }

    try {
      let user;
      try {
        // Attempt login first
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
      } catch (authError) {
        // Only auto-provision if the account truly doesn't exist yet
        if (authError.code === "auth/user-not-found") {
          console.log("Admin account not found. Auto-provisioning...");
          const result = await createUserWithEmailAndPassword(auth, email, password);
          user = result.user;
          await createUserProfile(user, { displayName: ADMIN_DISPLAY_NAME });
        } else if (authError.code === "auth/invalid-credential" || authError.code === "auth/wrong-password") {
          setError("Incorrect access passkey. Please check your credentials.");
          setLoading(false);
          return;
        } else {
          throw authError;
        }
      }

      // Sync/validate profile structure in Firestore
      await createUserProfile(user, { displayName: ADMIN_DISPLAY_NAME });

      // Navigate to admin panel
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1800);
    } catch (e) {
      console.error("Admin login process failed:", e);
      setError(e.message || "An authentication error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: "linear-gradient(135deg, #090D16 0%, #151C2C 100%)" }}>
      <div className="auth-card" style={{ background: "rgba(21, 28, 44, 0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.05)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
        
        {/* Back Link */}
        <button className="auth-back-link" onClick={() => navigate("/")} style={{ color: "rgba(255,255,255,0.4)" }}>
          <ArrowLeft size={14} /> Back to Landing Page
        </button>

        {/* Header - No Icon */}
        <div className="auth-header" style={{ marginTop: "1rem" }}>
          <h2 style={{ color: "#FFF", fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.02em", fontFamily: "'Outfit', sans-serif" }}>
            Admin Access
          </h2>
          <p className="auth-subtitle" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Restricted System Administration Console
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-alert auth-alert-error" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#FCA5A5", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAdminSubmit} className="auth-form" style={{ marginTop: "1.5rem" }}>
          <div className="form-group">
            <label htmlFor="admin-email" style={{ color: "rgba(255,255,255,0.7)" }}>Administrator ID / Email</label>
            <input
              id="admin-email"
              type="email"
              className="form-control"
              placeholder="admin@komunitrade.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: "rgba(10, 15, 26, 0.5)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#FFF" }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password" style={{ color: "rgba(255,255,255,0.7)" }}>Access Passkey</label>
            <div className="input-icon-wrap">
              <input
                id="admin-password"
                type={showPass ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ background: "rgba(10, 15, 26, 0.5)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#FFF", paddingRight: "2.5rem" }}
                required
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPass((v) => !v)}
                style={{ color: "rgba(255, 255, 255, 0.4)" }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading}
            style={{
              background: "#EF4444",
              color: "#FFF",
              boxShadow: "0 10px 20px -5px rgba(239, 68, 68, 0.4)",
              border: "none",
              padding: "0.85rem",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "0.95rem",
              marginTop: "1.5rem"
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <Loader2 size={16} className="animate-spin" /> Authenticating...
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <KeyRound size={16} /> Admin Access
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer" style={{ marginTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
            All operations in this environment are cryptographically logged for audit trails.
          </p>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccess && (
        <div className="login-success-overlay">
          <div className="login-success-card" style={{ background: "var(--card-bg)", color: "var(--text-main)" }}>
            <div className="success-icon-wrap">
              <CheckCircle size={48} strokeWidth={2} />
              <div className="success-icon-badge">
                <Sparkles size={12} fill="white" />
              </div>
            </div>
            <h3 className="success-title">Developer Access Granted</h3>
            <p className="success-message">
              Session authorized for <strong>System Administrator</strong>!
              <br />
              Redirecting to secure console...
            </p>
            <div className="success-loader">
              <div className="success-loader-bar"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
