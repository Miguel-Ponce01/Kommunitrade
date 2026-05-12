import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, updateDoc } from '../firebase';

export default function Verification() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [idImage, setIdImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null); // 'success', 'fail', null
  const [score, setScore] = useState(0);
  const [error, setError] = useState(null);

  const idRef = useRef();
  const selfieRef = useRef();

  useEffect(() => {
    // Load face-api models from CDN
    const loadModels = async () => {
      try {
        if (!window.faceapi) {
          setError("Face API library not loaded yet. Please refresh.");
          return;
        }
        
        const MODEL_URL = 'https://vladmandic.github.io/face-api/model/';
        
        await window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        setIsModelLoaded(true);
      } catch (err) {
        console.error("Failed to load models:", err);
        setError("Failed to load AI models. Please check your internet connection.");
      }
    };

    loadModels();
  }, []);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'id') {
        setIdImage(file);
        setIdPreview(reader.result);
      } else {
        setSelfieImage(file);
        setSelfiePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const runVerification = async () => {
    if (!idPreview || !selfiePreview) {
      alert("Please upload both ID and Selfie.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setVerificationResult(null);

    try {
      // 1. Create HTML Image elements from previews
      const idImg = await window.faceapi.fetchImage(idPreview);
      const selfieImg = await window.faceapi.fetchImage(selfiePreview);

      // 2. Detect faces and compute descriptors
      const idResult = await window.faceapi
        .detectSingleFace(idImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      const selfieResult = await window.faceapi
        .detectSingleFace(selfieImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!idResult) {
        setError("No face detected in the ID image. Please ensure your face is clearly visible.");
        setIsProcessing(false);
        return;
      }

      if (!selfieResult) {
        setError("No face detected in the Selfie. Please ensure your face is clearly visible.");
        setIsProcessing(false);
        return;
      }

      // 3. Compare descriptors (Euclidean distance)
      const distance = window.faceapi.euclideanDistance(idResult.descriptor, selfieResult.descriptor);
      
      // Distance < 0.6 is usually considered a match. 
      // Let's convert it to a similarity score percentage.
      // Score = (1 - distance) * 100
      const similarityScore = Math.max(0, (1 - distance) * 100);
      setScore(similarityScore);

      const THRESHOLD = 65; // Relaxed threshold for prototype, usually 60-70 is good for FaceNet
      
      if (similarityScore >= THRESHOLD) {
        setVerificationResult('success');
        
        // Update user status in Firebase
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            isVerified: true,
            verificationScore: similarityScore,
            verifiedAt: new Date()
          });
        }
      } else {
        setVerificationResult('fail');
      }

    } catch (err) {
      console.error("Verification Error:", err);
      setError("An error occurred during processing. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '600px', margin: '0 auto', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="back-btn" onClick={() => navigate(-1)} style={{ position: 'relative', top: 0, left: 0 }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", margin: 0 }}>ID Verification</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Verify your identity to build trust</p>
        </div>
      </div>

      {!isModelLoaded && !error && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
          <p>Loading AI models... This may take a few seconds.</p>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <XCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {isModelLoaded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Instructions */}
          <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={24} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Upload a clear photo of your Government ID and a live selfie. Our AI will compare them to verify your identity. Your photos are not stored on our servers.
            </span>
          </div>

          {/* Uploaders */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            {/* ID Upload */}
            <div 
              onClick={() => idRef.current.click()}
              style={{ 
                background: 'var(--card-bg)', 
                border: '2px dashed var(--border-color)', 
                borderRadius: '16px', 
                padding: '1.5rem', 
                textAlign: 'center',
                cursor: 'pointer',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundImage: idPreview ? `url(${idPreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}
            >
              {!idPreview && (
                <>
                  <Upload size={24} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Upload ID</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Passport, Driver's License, etc.</span>
                </>
              )}
              {idPreview && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                  <Upload size={24} />
                </div>
              )}
              <input type="file" ref={idRef} onChange={(e) => handleFileChange(e, 'id')} accept="image/*" style={{ display: 'none' }} />
            </div>

            {/* Selfie Upload */}
            <div 
              onClick={() => selfieRef.current.click()}
              style={{ 
                background: 'var(--card-bg)', 
                border: '2px dashed var(--border-color)', 
                borderRadius: '16px', 
                padding: '1.5rem', 
                textAlign: 'center',
                cursor: 'pointer',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundImage: selfiePreview ? `url(${selfiePreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}
            >
              {!selfiePreview && (
                <>
                  <Upload size={24} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Upload Selfie</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Take a clear live photo</span>
                </>
              )}
              {selfiePreview && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                  <Upload size={24} />
                </div>
              )}
              <input type="file" ref={selfieRef} onChange={(e) => handleFileChange(e, 'selfie')} accept="image/*" style={{ display: 'none' }} />
            </div>

          </div>

          {/* Action Button */}
          <button 
            className={`btn ${isProcessing ? 'btn-secondary' : 'btn-primary'}`}
            onClick={runVerification}
            disabled={isProcessing || !idPreview || !selfiePreview}
            style={{ width: '100%', height: '50px' }}
          >
            {isProcessing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={20} />
                <span>Processing...</span>
              </div>
            ) : (
              <span>Verify Identity</span>
            )}
          </button>

          {/* Results */}
          {verificationResult && (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '1.5rem', borderRadius: '16px', background: verificationResult === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${verificationResult === 'success' ? '#22c55e' : '#ef4444'}` }}>
              {verificationResult === 'success' ? (
                <>
                  <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ color: '#22c55e', margin: '0 0 0.5rem' }}>Verification Successful!</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    We found a match! Similarity score: <strong>{score.toFixed(1)}%</strong>. Your profile has been updated with a verification badge.
                  </p>
                </>
              ) : (
                <>
                  <XCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ color: '#ef4444', margin: '0 0 0.5rem' }}>Verification Failed</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    The faces do not seem to match. Similarity score: <strong>{score.toFixed(1)}%</strong>. Please ensure both photos are clear and well-lit.
                  </p>
                </>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
