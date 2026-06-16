import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingBag, Mail, Phone, Eye, EyeOff, ArrowRight, ArrowLeft, RotateCcw, CheckCircle, Sparkles, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// ─── Google Icon SVG ───────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.4C9.8 35.8 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C37.4 38.9 44 33.8 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

// ─── OTP Input Component ───────────────────────────────────────────────────
function OTPInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split("");

  const handleKey = (e, idx) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        const next = digits.map((d, i) => (i === idx ? "" : d)).join("");
        onChange(next);
      } else if (idx > 0) {
        inputs.current[idx - 1].focus();
      }
    }
  };

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/, "").slice(-1);
    const next = digits.map((d, i) => (i === idx ? val : d)).join("").padEnd(6, "").slice(0, 6);
    onChange(next);
    if (val && idx < 5) inputs.current[idx + 1].focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, ""));
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
    e.preventDefault();
  };

  return (
    <div className="otp-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="otp-box"
          value={digits[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}

// ─── Main Auth Page ────────────────────────────────────────────────────────
export default function Auth({ onClose }) {
  const navigate = useNavigate();
  const { currentUser, signInWithGoogle, registerWithEmail, loginWithEmail, resendVerification, sendPhoneOTP, verifyPhoneOTP } = useAuth();

  const [tab, setTab] = useState("google"); // google | email | phone
  const [mode, setMode] = useState("login"); // login | register (email tab)
  const [step, setStep] = useState(1); // 1 = form, 2 = verify
  const [roleNotice, setRoleNotice] = useState("general"); // general | seller | buyer

  // Email fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Phone fields
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("      ");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // If already logged in, go to app
  useEffect(() => {
    if (showSuccess) return;
    if (currentUser && currentUser.emailVerified) navigate("/app");
    if (currentUser && currentUser.phoneNumber) navigate("/app");
    if (currentUser && currentUser.providerData?.[0]?.providerId === "google.com") navigate("/app");
  }, [currentUser, navigate, showSuccess]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const resetState = () => {
    setStep(1); setError(""); setInfo(""); setOtp("      ");
  };

  const handleTabChange = (t) => {
    setTab(t); resetState();
  };

  // ── Firebase error messages → human readable ────────────────────
  const friendlyError = (code) => {
    const map = {
      "auth/email-already-in-use": "This email is already registered. Try logging in.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/user-not-found": "No account found with this email.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/invalid-verification-code": "The OTP you entered is wrong. Please check and retry.",
      "auth/code-expired": "OTP has expired. Please request a new one.",
      "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
      "auth/invalid-phone-number": "Please enter a valid phone number with country code (e.g. +63 9xx xxx xxxx).",
      "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    };
    return map[code] || "Something went wrong. Please try again.";
  };

  // ── Google ──────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try {
      await signInWithGoogle();
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/app");
      }, 1800);
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Email Submit ────────────────────────────────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");

    if (mode === "register") {
      if (password !== confirm) { setError("Passwords do not match."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await registerWithEmail(email, password, name || "KomuniTrade User");
        setStep(2);
        setInfo(`A verification email has been sent to ${email}. Please check your inbox (and spam folder).`);
      } else {
        const user = await loginWithEmail(email, password);
        if (!user.emailVerified) {
          setStep(2);
          setInfo("Your email is not verified yet. Check your inbox for the verification link.");
        } else {
          setShowSuccess(true);
          setTimeout(() => {
            navigate("/app");
          }, 1800);
        }
      }
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setError(""); setLoading(true);
    try {
      await resendVerification();
      setInfo("Verification email resent! Check your inbox.");
      setResendCooldown(60);
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Phone Step 1: Send OTP ──────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const fullPhone = phone.startsWith("+") ? phone : `+63${phone.replace(/^0/, "")}`;
      await sendPhoneOTP(fullPhone, "recaptcha-container");
      setStep(2);
      setInfo(`OTP sent to ${fullPhone}. Check your messages.`);
      setResendCooldown(60);
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Phone Step 2: Verify OTP ────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await verifyPhoneOTP(otp.trim());
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/app");
      }, 1800);
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(""); setLoading(true);
    try {
      const fullPhone = phone.startsWith("+") ? phone : `+63${phone.replace(/^0/, "")}`;
      await sendPhoneOTP(fullPhone, "recaptcha-container");
      setInfo("New OTP sent!");
      setResendCooldown(60);
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="auth-container">
      {/* Invisible reCAPTCHA anchor for Phone Auth */}
      <div id="recaptcha-container" style={{ position: "fixed", bottom: 0, left: 0 }} />

      <div className="auth-card">
        {/* Top row: Logo + close button inside the card */}
        <div className="auth-modal-top-row">
          <Link to="/" className="auth-modal-brand" style={{ textDecoration: 'none' }}>
            <ShoppingBag size={24} className="auth-icon" style={{ color: 'var(--primary)' }} />
            KomuniTrade
          </Link>
          {onClose && (
            <button className="auth-modal-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>
        {/* Subtitle */}
        <div className="auth-header">
          <p className="auth-subtitle" style={{ marginBottom: '1.25rem', marginTop: 0 }}>Your neighborhood marketplace</p>
        </div>

        {/* Role Selector & Notice */}
        <div style={{ margin: '0 0 1.5rem 0', background: 'var(--bg-color)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'left' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Select Role Perspective</div>
          <div style={{ display: 'flex', background: 'var(--border-color)', padding: '0.2rem', borderRadius: '8px', gap: '0.2rem', marginBottom: '0.75rem' }}>
            {['general', 'seller', 'buyer'].map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleNotice(role)}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  background: roleNotice === role ? 'var(--card-bg)' : 'transparent',
                  color: roleNotice === role ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: roleNotice === role ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Guideline Rules Box */}
          <div style={{ fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-main)' }}>
            {roleNotice === 'general' && (
              <div>
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>General Marketplace Rules</strong>
                • Share neighborhood location securely using Barangay presets.<br/>
                • Complete all trades in person at designated safe hotspots.<br/>
                • Maintain positive community code of conduct at all times.
              </div>
            )}
            {roleNotice === 'seller' && (
              <div>
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Seller Regulations (Rule 202 & 303)</strong>
                • Take real photos of your items at physical locations (`timeMark` presence check).<br/>
                • Accurate descriptions: False quality scales violate Rule 202 and deduct 10% trust.<br/>
                • Meetup commitment: No-show or late arrivals (Rule 303) deduct 15% trust rating.
              </div>
            )}
            {roleNotice === 'buyer' && (
              <div>
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Buyer Guidelines & PIN Handshake</strong>
                • Punctuality: Be on time for meetups. Rule 303 penalties apply to no-shows.<br/>
                • Safety check: Always verify the item's condition in person before trade.<br/>
                • Completed PIN Handshakes award both trading partners with +5% trust rating.
              </div>
            )}
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', marginTop: '0.5rem' }}>
              By signing in, you agree to the active regulations. Violations will impact your public trust score.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === "google" ? "active" : ""}`} onClick={() => handleTabChange("google")}>
            <GoogleIcon /> Google
          </button>
          <button className={`auth-tab ${tab === "email" ? "active" : ""}`} onClick={() => handleTabChange("email")}>
            <Mail size={16} /> Email
          </button>
          <button className={`auth-tab ${tab === "phone" ? "active" : ""}`} onClick={() => handleTabChange("phone")}>
            <Phone size={16} /> Phone
          </button>
        </div>

        {/* Error / Info */}
        {error && <div className="auth-alert auth-alert-error">{error}</div>}
        {info && !(tab === "phone" && step === 2) && <div className="auth-alert auth-alert-info">{info}</div>}

        {/* ── GOOGLE TAB ── */}
        {tab === "google" && (
          <div className="auth-section">
            <p className="auth-hint">Sign in instantly using your Google account. No password needed.</p>
            <button className="btn-google" onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              {loading ? "Connecting…" : "Continue with Google"}
            </button>
          </div>
        )}

        {/* ── EMAIL TAB ── */}
        {tab === "email" && step === 1 && (
          <form onSubmit={handleEmailSubmit} className="auth-form">
            {/* Login / Register toggle */}
            <div className="auth-mode-toggle">
              <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign In</button>
              <button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Create Account</button>
            </div>

            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input id="name" type="text" className="form-control" placeholder="Juan dela Cruz" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input id="email" type="email" className="form-control" placeholder="juan@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-icon-wrap">
                <input id="password" type={showPass ? "text" : "password"} className="form-control" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="input-icon-btn" onClick={() => setShowPass((v) => !v)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="confirm">Confirm Password</label>
                <div className="input-icon-wrap">
                  <input id="confirm" type={showPass ? "text" : "password"} className="form-control" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? "Please wait…" : mode === "register" ? "Create Account" : "Sign In"}
              {!loading && <ArrowRight size={16} style={{ marginLeft: 8 }} />}
            </button>
          </form>
        )}

        {/* EMAIL STEP 2: Verify */}
        {tab === "email" && step === 2 && (
          <div className="auth-section auth-verify">
            <div className="verify-icon"><CheckCircle size={48} strokeWidth={1.5} /></div>
            <h3>Check Your Email</h3>
            <p>Click the verification link in your inbox, then come back and sign in.</p>
            <button className="btn-primary btn-full" onClick={() => { setStep(1); setMode("login"); setError(""); setInfo(""); }} style={{ marginTop: "1rem" }}>
              Go to Sign In <ArrowRight size={16} style={{ marginLeft: 8 }} />
            </button>
            <button className="btn-ghost btn-full" onClick={handleResendEmail} disabled={loading || resendCooldown > 0} style={{ marginTop: "0.5rem" }}>
              <RotateCcw size={14} style={{ marginRight: 6 }} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Email"}
            </button>
            <button className="auth-back-link" onClick={() => { setStep(1); setError(""); setInfo(""); }}>
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        )}

        {/* ── PHONE TAB ── */}
        {tab === "phone" && step === 1 && (
          <form onSubmit={handleSendOTP} className="auth-form">
            <p className="auth-hint">We'll send a one-time code to your phone via SMS.</p>
            <div className="form-group">
              <label htmlFor="phone">Mobile Number</label>
              <div className="phone-input-wrap">
                <span className="phone-prefix">🇵🇭 +63</span>
                <input
                  id="phone"
                  type="tel"
                  className="form-control phone-input"
                  placeholder="9XX XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                  maxLength={10}
                  required
                />
              </div>
              <span className="form-hint">Enter your 10-digit number without the leading 0</span>
            </div>
            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? "Sending OTP…" : "Send OTP"}
              {!loading && <ArrowRight size={16} style={{ marginLeft: 8 }} />}
            </button>
          </form>
        )}

        {/* PHONE STEP 2: OTP */}
        {tab === "phone" && step === 2 && (
          <form onSubmit={handleVerifyOTP} className="auth-form" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Illustration Placeholder */}
              <div style={{ width: '120px', height: '120px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Phone size={48} color="var(--primary)" />
              </div>
              
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                Enter verification code
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                You'll get an SMS message on <strong>+63 ******* {phone.slice(-4)}</strong>
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', display: 'block' }}>
                6-digit code
              </label>
              <OTPInput value={otp} onChange={setOtp} />
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {resendCooldown > 0 ? (
                `Resend code in 0:${resendCooldown.toString().padStart(2, '0')}`
              ) : (
                <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }} onClick={handleResendOTP}>
                  Resend code
                </span>
              )}
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={loading || otp.trim().length < 6} style={{ padding: '0.85rem', borderRadius: '12px' }}>
              {loading ? "Verifying…" : "Next"}
            </button>

            <div style={{ marginTop: '1.5rem' }}>
              <button 
                type="button" 
                className="auth-back-link" 
                onClick={() => { setStep(1); setOtp("      "); setError(""); setInfo(""); }}
                style={{ justifyContent: 'center', width: '100%' }}
              >
                Try signing in another way
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="auth-footer">
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
            By continuing, you agree to KomuniTrade's{" "}
            <span style={{ color: "var(--primary)", cursor: "pointer" }}>Terms of Service</span>{" "}
            and{" "}
            <span style={{ color: "var(--primary)", cursor: "pointer" }}>Privacy Policy</span>.
          </p>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccess && (
        <div className="login-success-overlay">
          <div className="login-success-card">
            <div className="success-icon-wrap">
              <CheckCircle size={48} strokeWidth={2} />
              <div className="success-icon-badge">
                <Sparkles size={12} fill="white" />
              </div>
            </div>
            <h3 className="success-title">Login Successful!</h3>
            <p className="success-message">
              Welcome back, <strong>{currentUser?.displayName || currentUser?.email?.split('@')[0] || "neighbor"}</strong>!
              <br />
              Connecting you to the marketplace...
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
