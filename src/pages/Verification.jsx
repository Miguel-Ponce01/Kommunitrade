import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Shield, Camera, RefreshCw,
  CheckCircle, XCircle, Loader2, AlertTriangle, Info,
  Smartphone, FileText, Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

// ─── Philippine ID types with guidance ───────────────────────────────────────
const PH_ID_TYPES = [
  {
    id: 'philsys',
    label: 'PhilSys National ID',
    tier: 'Primary',
    guidance: 'Place the front of your PhilID flat on a dark surface. Ensure the QR code and your photo are fully visible.',
  },
  {
    id: 'passport',
    label: 'Philippine Passport',
    tier: 'Primary',
    guidance: 'Open to the photo page. Make sure the MRZ lines (two rows of text at the bottom) are fully readable.',
  },
  {
    id: 'drivers_license',
    label: "LTO Driver's License",
    tier: 'Primary',
    guidance: 'Capture the front side. Avoid glare on the lamination — tilt slightly if needed.',
  },
  {
    id: 'umid',
    label: 'UMID Card',
    tier: 'Primary',
    guidance: 'Place the front face up. Ensure your name and ID number are clearly visible.',
  },
  {
    id: 'sss',
    label: 'SSS ID',
    tier: 'Secondary',
    guidance: 'Older SSS IDs may have lower OCR accuracy. Ensure all text is sharp and unobscured.',
  },
  {
    id: 'prc',
    label: 'PRC ID',
    tier: 'Secondary',
    guidance: 'Capture the front side clearly. Include the license number and expiry date in frame.',
  },
  {
    id: 'voters',
    label: "Voter's ID",
    tier: 'Secondary',
    guidance: 'Place flat and capture the full card. Older formats have lower accuracy.',
  },
  {
    id: 'tin',
    label: 'TIN ID',
    tier: 'Secondary',
    guidance: 'Ensure your name, TIN number, and signature are all visible and in focus.',
  },
];

// ─── Liveness challenge prompts ───────────────────────────────────────────────
const LIVENESS_CHALLENGES = [
  'Blink slowly twice',
  'Smile naturally',
  'Turn your head slightly left',
  'Turn your head slightly right',
  'Raise your eyebrows briefly',
];

// ─── Canvas image compressor ──────────────────────────────────────────────────
// Targets ≤600KB to stay well under Firebase's 10MB httpsCallable payload limit.
// Two images × 600KB = 1.2MB total — safe even on the slowest connections.
async function compressImageToBase64(videoElement, maxKB = 600) {
  const canvas = document.createElement('canvas');
  const maxDim = 1024;
  let w = videoElement.videoWidth || videoElement.naturalWidth || 640;
  let h = videoElement.videoHeight || videoElement.naturalHeight || 480;

  if (w > maxDim || h > maxDim) {
    if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
    else { w = Math.round(w * maxDim / h); h = maxDim; }
  }

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, w, h);

  // Try decreasing quality until we hit the size target
  let quality = 0.8;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length * 0.75 > maxKB * 1024 && quality > 0.3) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  return dataUrl; // full data URI — Cloud Function strips the prefix
}

// Same but from an <img> snapshot (review step)
async function compressFromImg(imgElement, maxKB = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = imgElement.naturalWidth || imgElement.width;
  canvas.height = imgElement.naturalHeight || imgElement.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgElement, 0, 0);
  let quality = 0.8;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length * 0.75 > maxKB * 1024 && quality > 0.3) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  return dataUrl;
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDot({ index, current, label }) {
  const done = index < current;
  const active = index === current;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem',
        background: done ? '#10b981' : active ? 'var(--primary)' : 'var(--border-color)',
        color: done || active ? 'white' : 'var(--text-muted)',
        border: active ? '2px solid white' : 'none',
        boxShadow: active ? '0 0 0 3px rgba(16,185,129,0.3)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        {done ? <CheckCircle size={16} /> : index + 1}
      </div>
      <span style={{ fontSize: '0.65rem', color: active ? 'var(--primary)' : 'var(--text-muted)', fontWeight: active ? 700 : 400 }}>
        {label}
      </span>
    </div>
  );
}

// ─── Live Camera component ────────────────────────────────────────────────────
function LiveCamera({ facingMode = 'environment', overlayType = 'card', onCapture, onError, autoCaptureStart = false, autoCaptureSeconds = 10 }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [camError, setCamError] = useState(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (autoCaptureStart && ready && countdown === null) {
      setCountdown(autoCaptureSeconds);
    } else if (!autoCaptureStart) {
      setCountdown(null);
    }
  }, [autoCaptureStart, ready, autoCaptureSeconds, countdown]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const t = setTimeout(() => {
      if (countdown === 1) handleCapture();
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const startCamera = useCallback(async () => {
    setCamError(null);
    setReady(false);
    try {
      // Wall 4: getUserMedia fails on HTTP (non-localhost). Show clear message.
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('HTTPS_REQUIRED');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch (err) {
      let msg = 'Camera access denied.';
      if (err.message === 'HTTPS_REQUIRED') {
        msg = 'Camera requires HTTPS. Please use the deployed app URL or test on localhost.';
      } else if (err.name === 'NotAllowedError') {
        msg = 'Camera permission denied. Please allow camera access in your browser settings and try again.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        msg = 'Camera is in use by another app. Please close it and try again.';
      }
      setCamError(msg);
      onError?.(msg);
    }
  }, [facingMode, onError]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [startCamera]);

  const handleCapture = async () => {
    if (!videoRef.current || !ready) return;
    const dataUrl = await compressImageToBase64(videoRef.current, 600);
    onCapture(dataUrl);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', aspectRatio: overlayType === 'card' ? '16/10' : '4/3' }}>
        {camError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', color: '#ef4444', textAlign: 'center', minHeight: '220px' }}>
            <AlertTriangle size={32} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{camError}</p>
            <button onClick={startCamera} className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1.5rem', borderRadius: '100px' }}>
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: ready ? 'block' : 'none' }}
            />
            {!ready && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
                <Loader2 className="animate-spin" size={28} color="var(--primary)" />
              </div>
            )}

            {/* Overlay guide */}
            {ready && overlayType === 'card' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{
                  width: '85%', height: '72%',
                  border: '2px solid rgba(16,185,129,0.9)',
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                }}>
                  {/* Corner brackets */}
                  {[['0 auto auto 0','top','left'],['0 0 auto auto','top','right'],['auto auto 0 0','bottom','left'],['auto 0 0 auto','bottom','right']].map(([m,v,h], i) => (
                    <div key={i} style={{
                      position: 'absolute', [v]: -2, [h]: -2,
                      width: 20, height: 20,
                      borderTop: v === 'top' ? '3px solid #10b981' : 'none',
                      borderBottom: v === 'bottom' ? '3px solid #10b981' : 'none',
                      borderLeft: h === 'left' ? '3px solid #10b981' : 'none',
                      borderRight: h === 'right' ? '3px solid #10b981' : 'none',
                    }} />
                  ))}
                </div>
                <p style={{ position: 'absolute', bottom: 12, color: 'white', fontSize: '0.75rem', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)', letterSpacing: '0.05em' }}>
                  ALIGN ID WITHIN FRAME
                </p>
              </div>
            )}

            {ready && overlayType === 'face' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{
                  width: '55%', paddingBottom: '65%',
                  border: '3px dashed rgba(16,185,129,0.9)',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
                  animation: 'pulse 2s infinite'
                }} />
                <p style={{ position: 'absolute', bottom: 12, color: 'white', fontSize: '0.75rem', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  CENTER YOUR FACE
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {ready && !camError && countdown === null && (
        <button
          onClick={handleCapture}
          className="btn-primary"
          style={{ width: '100%', height: '50px', borderRadius: '14px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Camera size={20} /> Capture Photo
        </button>
      )}
      {ready && !camError && countdown !== null && (
        <div style={{ width: '100%', height: '50px', borderRadius: '14px', fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: 'white' }}>
          Capturing in {countdown}s...
        </div>
      )}
    </div>
  );
}

// ─── Main Verification Page ────────────────────────────────────────────────────
export default function Verification() {
  const navigate = useNavigate();
  const { currentUser, refreshUserProfile } = useAuth();

  // 5 steps: 0=consent, 1=id-type, 2=id-camera, 3=selfie, 4=result
  const [step, setStep] = useState(0);
  const [consentChecked, setConsentChecked] = useState(false);
  const [selectedIdType, setSelectedIdType] = useState('');
  const [idSnapshot, setIdSnapshot] = useState(null);       // base64 data URI
  const [selfieSnapshot, setSelfieSnapshot] = useState(null); // base64 data URI
  const [livenessChallenge] = useState(() =>
    LIVENESS_CHALLENGES[Math.floor(Math.random() * LIVENESS_CHALLENGES.length)]
  );
  const [livenesDone, setLivenessDone] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null); // { success, score, reason } | null
  const [error, setError] = useState(null);

  // Wall 2: warn about emulator in dev
  const isDevEmulator = import.meta.env.DEV;

  const selectedId = PH_ID_TYPES.find(id => id.id === selectedIdType);

  const runVerification = async () => {
    if (!idSnapshot || !selfieSnapshot) return;
    setIsProcessing(true);
    setError(null);

    try {
      const verifyFn = httpsCallable(functions, 'verifyUserIdentity');
      const response = await verifyFn({
        idImage: idSnapshot,
        selfieImage: selfieSnapshot,
        idType: selectedIdType,
      });

      const { success, score, reason } = response.data;
      setResult({ success, score, reason });

      // Wall 3: refresh context so PostItem seller gate reflects new verified status
      if (success) {
        await refreshUserProfile();
      }
    } catch (err) {
      console.error('Verification error:', err);
      let msg = 'Verification failed. Please check your connection and try again.';
      if (err?.code === 'functions/unauthenticated') {
        msg = 'You must be signed in to verify your identity.';
      } else if (err?.code === 'functions/failed-precondition') {
        msg = 'Verification service is not configured. The Gemini API key may be missing — please contact support.';
      } else if (err?.code === 'functions/internal') {
        msg = 'The AI verification service encountered an error. Please try again in a moment.';
      }
      setError(msg);
      setResult({ success: false });
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-submit when both snapshots are ready and we reach step 4
  useEffect(() => {
    if (step === 4 && idSnapshot && selfieSnapshot && !result) {
      runVerification();
    }
  }, [step]);

  const cardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '1.5rem',
  };

  const STEPS = ['Consent', 'ID Type', 'Scan ID', 'Selfie', 'Result'];

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem 1rem', maxWidth: '540px', margin: '0 auto', paddingBottom: '5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ position: 'relative', top: 0, left: 0, flexShrink: 0 }}>
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", margin: 0, color: 'var(--text-main)' }}>
            Identity Verification
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
            Required to post listings on KomuniTrade
          </p>
        </div>
      </div>

      {/* Step indicator */}
      {step < 4 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '2rem' }}>
          {STEPS.slice(0, 4).map((label, i) => (
            <React.Fragment key={i}>
              <StepDot index={i} current={step} label={label} />
              {i < 3 && (
                <div style={{ flex: 1, height: 2, background: i < step ? 'var(--primary)' : 'var(--border-color)', margin: '0 4px', transition: 'background 0.3s' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Dev emulator warning (Wall 2) */}
      {isDevEmulator && step > 0 && (
        <div style={{ ...cardStyle, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#f59e0b' }}>
            <strong>Dev mode:</strong> Cloud Functions route to <code>localhost:5001</code>. Start the emulator (<code>firebase emulators:start</code>) or deploy Functions to test real verification.
          </p>
        </div>
      )}

      {/* ── STEP 0: DPA CONSENT ─────────────────────────────────────── */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
          <div style={{ ...cardStyle, borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <Shield size={22} color="var(--primary)" style={{ flexShrink: 0 }} />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Data Privacy Consent
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 1rem' }}>
              In compliance with the <strong>Philippine Data Privacy Act of 2012 (RA 10173)</strong>, KomuniTrade needs your explicit consent before collecting your biometric and identity data.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { icon: '📋', title: 'What we collect', body: 'A photo of your government-issued ID and a real-time selfie.' },
                { icon: '🎯', title: 'Why we collect it', body: 'To verify your identity and prevent fraudulent seller accounts on KomuniTrade.' },
                { icon: '🔒', title: 'How it is protected', body: 'Images are sent over HTTPS to our secure AI service, processed immediately, and not stored on our servers.' },
                { icon: '🗑️', title: 'Retention', body: 'Raw images are discarded after processing. Only a verification status and last 4 digits of your ID number are recorded for audit purposes.' },
                { icon: '⚖️', title: 'Your rights', body: 'You may withdraw consent and request deletion of your data at any time by contacting support@komunitrade.com.' },
              ].map(({ icon, title, body }) => (
                <div key={title} style={{ background: 'var(--bg-color)', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '2px' }}>{title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>

            <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', padding: '0.75rem', background: consentChecked ? 'rgba(16,185,129,0.08)' : 'var(--bg-color)', borderRadius: '12px', border: `1px solid ${consentChecked ? 'var(--primary)' : 'var(--border-color)'}`, transition: 'all 0.2s' }}>
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)', marginTop: 2, flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                I have read and understood the above. I give my <strong>explicit, informed consent</strong> for KomuniTrade to collect and process my government ID and biometric selfie for identity verification in accordance with RA 10173.
              </span>
            </label>
          </div>

          <button
            className="btn-primary"
            onClick={() => setStep(1)}
            disabled={!consentChecked}
            style={{ width: '100%', height: '52px', borderRadius: '14px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: consentChecked ? 1 : 0.4, cursor: consentChecked ? 'pointer' : 'not-allowed', transition: 'opacity 0.2s' }}
          >
            Begin Verification <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* ── STEP 1: ID TYPE ─────────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <FileText size={22} color="var(--primary)" />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Select Your Government ID</h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
              Choose the ID you will use. Primary IDs give the highest verification success rate.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {['Primary', 'Secondary'].map(tier => (
                <div key={tier}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0.75rem 0 0.4rem' }}>
                    {tier} IDs {tier === 'Primary' ? '— Recommended' : '— Lower accuracy'}
                  </div>
                  {PH_ID_TYPES.filter(id => id.tier === tier).map(id => (
                    <label key={id.id} style={{
                      display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem 1rem',
                      background: selectedIdType === id.id ? 'rgba(16,185,129,0.08)' : 'var(--bg-color)',
                      border: `1px solid ${selectedIdType === id.id ? 'var(--primary)' : 'var(--border-color)'}`,
                      borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s', marginBottom: '0.4rem'
                    }}>
                      <input
                        type="radio"
                        name="idType"
                        value={id.id}
                        checked={selectedIdType === id.id}
                        onChange={() => setSelectedIdType(id.id)}
                        style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                      />
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>{id.label}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>

            {selectedId && (
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{selectedId.guidance}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => setStep(0)} style={{ flex: 1, height: '48px', borderRadius: '14px' }}>Back</button>
            <button
              className="btn-primary"
              onClick={() => setStep(2)}
              disabled={!selectedIdType}
              style={{ flex: 2, height: '48px', borderRadius: '14px', fontWeight: 800, opacity: selectedIdType ? 1 : 0.4, cursor: selectedIdType ? 'pointer' : 'not-allowed' }}
            >
              Scan My ID <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: ID CAMERA ───────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
          {!idSnapshot ? (
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800 }}>Scan Your {selectedId?.label}</h2>
              <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Hold your ID flat and steady. Avoid glare and shadows.
              </p>
              <LiveCamera
                facingMode="environment"
                overlayType="card"
                onCapture={dataUrl => setIdSnapshot(dataUrl)}
                onError={msg => setError(msg)}
              />
            </div>
          ) : (
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>Review ID Photo</h2>
              <img
                src={idSnapshot}
                alt="ID capture"
                style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '240px' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn-secondary" onClick={() => setIdSnapshot(null)} style={{ flex: 1, height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <RefreshCw size={16} /> Retake
                </button>
                <button className="btn-primary" onClick={() => setStep(3)} style={{ flex: 2, height: '46px', borderRadius: '12px', fontWeight: 800 }}>
                  Looks Good <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '12px', padding: '0.75rem 1rem', color: '#ef4444', fontSize: '0.82rem', display: 'flex', gap: '0.5rem' }}>
              <XCircle size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: SELFIE + LIVENESS ───────────────────────────────── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">
          {!selfieSnapshot ? (
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800 }}>Take a Selfie</h2>

              {/* Liveness challenge */}
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '14px', padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                  Liveness Challenge
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '8px' }}>
                  {livenessChallenge}
                </div>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <input type="checkbox" checked={livenesDone} onChange={e => setLivenessDone(e.target.checked)} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                  I have done this — now I'm ready to capture
                </label>
              </div>

              <LiveCamera
                facingMode="user"
                overlayType="face"
                autoCaptureStart={livenesDone}
                autoCaptureSeconds={10}
                onCapture={dataUrl => {
                  setError(null);
                  setSelfieSnapshot(dataUrl);
                }}
                onError={msg => setError(msg)}
              />
            </div>
          ) : (
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>Review Selfie</h2>
              <img
                src={selfieSnapshot}
                alt="Selfie capture"
                style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '300px' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn-secondary" onClick={() => { setSelfieSnapshot(null); setLivenessDone(false); }} style={{ flex: 1, height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <RefreshCw size={16} /> Retake
                </button>
                <button className="btn-primary" onClick={() => setStep(4)} style={{ flex: 2, height: '46px', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  Submit <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '12px', padding: '0.75rem 1rem', color: '#ef4444', fontSize: '0.82rem', display: 'flex', gap: '0.5rem' }}>
              <XCircle size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}
          <button className="btn-secondary" onClick={() => setStep(2)} style={{ width: '100%', height: '44px', borderRadius: '12px' }}>← Back to ID Scan</button>
        </div>
      )}

      {/* ── STEP 4: PROCESSING / RESULT ─────────────────────────────── */}
      {step === 4 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isProcessing && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem 2rem' }}>
              <Loader2 className="animate-spin" size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
              <h2 style={{ fontWeight: 900, fontSize: '1.2rem', margin: '0 0 0.5rem' }}>Verifying Your Identity</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Our AI is comparing your ID and selfie. This takes 10–20 seconds.
              </p>
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['Reading ID document…', 'Extracting facial features…', 'Running biometric match…'].map((msg, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Loader2 size={12} className="animate-spin" color="var(--primary)" style={{ flexShrink: 0 }} />
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isProcessing && result?.success && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '2.5rem 2rem', border: '1px solid #22c55e' }}>
              <CheckCircle size={64} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ color: '#22c55e', fontWeight: 900, margin: '0 0 0.5rem' }}>Identity Verified!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 2rem' }}>
                Your account now has a <strong>Verified Seller</strong> badge. You can start posting listings.
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate('/app/post')}
                style={{ width: '100%', height: '50px', borderRadius: '14px', fontWeight: 800, fontSize: '1rem' }}
              >
                Post My First Listing →
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/app')}
                style={{ width: '100%', height: '46px', borderRadius: '14px', marginTop: '0.75rem' }}
              >
                Back to Marketplace
              </button>
            </div>
          )}

          {!isProcessing && result && !result.success && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '2.5rem 2rem', border: '1px solid #ef4444' }}>
              <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ color: '#ef4444', fontWeight: 900, margin: '0 0 0.5rem' }}>Verification Failed</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 0.5rem' }}>
                We could not confirm your identity. Common reasons:
              </p>
              <ul style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.8, margin: '0 0 1.5rem', paddingLeft: '1.25rem' }}>
                <li>ID photo was blurry, glared, or partially cut off</li>
                <li>Selfie lighting was too dark or had strong shadows</li>
                <li>The ID photo and selfie did not match the same person</li>
              </ul>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#ef4444' }}>
                  {error}
                </div>
              )}
              <button
                className="btn-primary"
                onClick={() => { setStep(0); setIdSnapshot(null); setSelfieSnapshot(null); setResult(null); setError(null); setConsentChecked(false); setLivenessDone(false); }}
                style={{ width: '100%', height: '50px', borderRadius: '14px', fontWeight: 800 }}
              >
                Try Again
              </button>
            </div>
          )}

          {!isProcessing && !result && error && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
              <AlertTriangle size={48} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ fontWeight: 900, margin: '0 0 0.5rem' }}>Connection Error</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>{error}</p>
              <button className="btn-primary" onClick={runVerification} style={{ width: '100%', height: '48px', borderRadius: '14px', fontWeight: 800 }}>
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
