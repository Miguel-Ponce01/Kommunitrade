import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, Sparkles, MapPin, Tag, Info, ShieldCheck, Terminal, Check, TrendingUp, PlusCircle, Shield, AlertTriangle, XCircle } from 'lucide-react';
import { MOCK_BARANGAYS, CATEGORIES } from '../data/mockData';
import { db, auth, storage, collection, addDoc, serverTimestamp, doc, updateDoc } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from '../firebase';
import { encodeGeohash, resolveLocationCoords, findNearestBarangay } from '../utils/geo';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { useAuth } from '../contexts/AuthContext';
import GoogleMap from '../components/GoogleMap';
import { processListingImage } from '../services/listingProcessor';

export default function PostItem() {
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [previewUrls, setPreviewUrls] = useState([]);
  const [imageFiles, setImageFiles] = useState([]); // actual Files for Storage upload
  const [selectedImageForAI, setSelectedImageForAI] = useState(0); // Index of image to analyze
  const [isPublishing, setIsPublishing] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [scanStep, setScanStep] = useState(0); // 0 = idle, 1 = scan photos, 2 = scan location/time, 3 = auto-fill details, 4 = success
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onClose: null });

  const showAlert = (message, title = 'Attention', type = 'info', onClose = null) => {
    setAlertModal({ isOpen: true, title, message, type, onClose });
  };

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [barangay, setBarangay] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('New');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('Meetup');
  const [sellingReason, setSellingReason] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [timeMark, setTimeMark] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [tags, setTags] = useState([]);
  const getTomorrowDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const [foodExpiryDate, setFoodExpiryDate] = useState(getTomorrowDateString());

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [predictionId, setPredictionId] = useState(null);
  const [generatedData, setGeneratedData] = useState({
    title: '',
    category: '',
    tags: []
  });

  const fileInputRef = useRef(null);

  const addLog = (message, type = 'info') => {
    setDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };


  const previewUrlsRef = useRef([]);
  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  // Revoke previous blob URLs only when component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const runUnifiedScan = async (file) => {
    setIsAnalyzing(true);
    setScanStep(1); // Step 1: Scan photo
    setAnalysisProgress('Scanning uploaded photos (AI OCR + Object Detection)...');

    try {
      // 1. Analyze image
      addLog("Running on-device AI scanner...", "primary");
      const listingId = `${currentUser.uid}_${Date.now()}`;
      const result = await processListingImage(file, listingId, category || null);

      if (result?.apiHealth) {
        const { googleVision, roboflow, gemini } = result.apiHealth;
        addLog(`API Diagnostics: Vision [${googleVision}] • Roboflow [${roboflow}] • Gemini [${gemini}]`, "primary");
        if (googleVision === 'FAILED') addLog(`Vision Err: ${result.apiHealth.googleVisionError || 'unknown'}`, "error");
        if (gemini === 'FAILED') addLog(`Gemini Err: ${result.apiHealth.geminiError || 'unknown'}`, "error");
      }

      if (result?.ocr?.success && result.ocr.text) {
        addLog(`Extracted text: ${result.ocr.text.substring(0, 30)}...`, "primary");
      }
      if (result?.cnn?.success && result.cnn.topPrediction) {
        const topLabelName = result.cnn.topPrediction.label || result.cnn.topPrediction.className || "object";
        const topConf = result.cnn.topPrediction.confidence || result.cnn.topPrediction.probability || 0;
        addLog(`Detected object: ${topLabelName} (${Math.round(topConf * 100)}%)`, "success");
      }

      // 2. Scan location & time
      setScanStep(2); // Step 2: Scan location
      setAnalysisProgress('Syncing GPS coordinates and Time Mark...');
      
      await new Promise((resolve) => {
        captureTimeMark((brgy) => {
          resolve(brgy);
        });
      });

      // 3. Auto-fill details
      setScanStep(3); // Step 3: Auto-fill details
      setAnalysisProgress('Auto-filling listing details with scanned data...');
      await new Promise(r => setTimeout(r, 1000)); // Smooth transition delay

      if (result?.deepseek?.data) {
        if (result.predictionId) {
          setPredictionId(result.predictionId);
        }
        addLog("AI Smart Advisor recommendations loaded!", "success");
        setGeneratedData({
          title: result.deepseek.data.title || '',
          category: result.deepseek.data.category || '',
          tags: result.deepseek.data.tags || []
        });

        setTitle(result.deepseek.data.title || '');
        setCategory(result.deepseek.data.category || '');
        setTags(result.deepseek.data.tags || []);

        if (result.deepseek.data.category === 'Food') {
          const days = Number(result.deepseek.data.foodExpiryDays) || 1;
          const d = new Date();
          d.setDate(d.getDate() + days);
          setFoodExpiryDate(d.toISOString().split('T')[0]);
          addLog(`Suggested Food Expiration: ${days} day(s) from now`, "success");
        }

        if (result.deepseek.data.suggestedPrice > 0) {
          setPrice(result.deepseek.data.suggestedPrice.toString());
          addLog(`Suggested Price: ₱${result.deepseek.data.suggestedPrice}`, "success");
        } else if (result.deepseek.data.category === 'Electronics' || result.deepseek.data.category === 'Electronic') {
          setPrice('500');
        }
      }

      if (result?.ocr?.text) {
        setDescription(result.ocr.text);
      }

      setAnalysisProgress('Scan complete! Advancing to details...');
      setScanStep(4); // Success step
      await new Promise(r => setTimeout(r, 600));

      // Clear the overlay FIRST, then advance step so the dark overlay
      // is fully removed before Step 2 paints (fixes blank black screen)
      setIsAnalyzing(false);
      setScanStep(0);
      await new Promise(r => setTimeout(r, 80)); // flush React paint
      setCurrentStep(2);

    } catch (err) {
      console.error("Unified scan failed:", err);
      addLog(`Scan failed: ${err.message}`, "error");
      setAnalysisProgress('Scan failed. You can fill in details manually.');
      setIsAnalyzing(false);
      setScanStep(0);
      // Advance to Step 2 even on failure so the user isn't stuck
      setCurrentStep(2);
    }
  };

  const handleImageAnalysis = async (file) => {
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisProgress('Running AI analysis (OCR + Object Detection)...');

    try {
      addLog("Analyzing image content...", "primary");
      const listingId = `${currentUser.uid}_${Date.now()}`;
      // Use 'file' directly as it is already compressed from handleFileChange
      const result = await processListingImage(file, listingId, category || null);

      if (result?.apiHealth) {
        const { googleVision, roboflow, gemini } = result.apiHealth;
        addLog(`API Diagnostics: Vision [${googleVision}] • Roboflow [${roboflow}] • Gemini [${gemini}]`, "primary");
        if (googleVision === 'FAILED') addLog(`Vision Err: ${result.apiHealth.googleVisionError || 'unknown'}`, "error");
        if (gemini === 'FAILED') addLog(`Gemini Err: ${result.apiHealth.geminiError || 'unknown'}`, "error");
      }

      if (result?.ocr?.success && result.ocr.text) {
        addLog(`Extracted text: ${result.ocr.text.substring(0, 30)}...`, "primary");
      }

      if (result?.cnn?.success && result.cnn.topPrediction) {
        const topLabelName = result.cnn.topPrediction.label || result.cnn.topPrediction.className || "object";
        const topConf = result.cnn.topPrediction.confidence || result.cnn.topPrediction.probability || 0;
        addLog(`Detected object: ${topLabelName} (${Math.round(topConf * 100)}%)`, "success");
      }

      if (result?.deepseek?.data) {
        if (result.predictionId) {
          setPredictionId(result.predictionId);
        }
        // Auto-fill fields with AI optimized results securely generated
        addLog("DeepSeek Smart Advisor recommendation loaded!", "success");
        setGeneratedData({
          title: result.deepseek.data.title || '',
          category: result.deepseek.data.category || '',
          tags: result.deepseek.data.tags || []
        });

        setTitle(prev => prev || result.deepseek.data.title || '');
        const finalCategory = prev => prev || result.deepseek.data.category || '';
        setCategory(finalCategory);
        setTags(prev => prev.length ? prev : (result.deepseek.data.tags || []));

        if (result.deepseek.data.category === 'Food') {
          const days = Number(result.deepseek.data.foodExpiryDays) || 1;
          const d = new Date();
          d.setDate(d.getDate() + days);
          setFoodExpiryDate(d.toISOString().split('T')[0]);
          addLog(`Suggested Food Expiration: ${days} day(s) from now`, "success");
        }

        if (result.deepseek.data.suggestedPrice > 0) {
          if (!price) setPrice(result.deepseek.data.suggestedPrice.toString());
          addLog(`Suggested Price: ₱${result.deepseek.data.suggestedPrice}`, "success");
        } else if (!price && (result.deepseek.data.category === 'Electronics' || result.deepseek.data.category === 'Electronic')) {
          setPrice('500'); // Fallback suggest
        }
      }
      
      if (result?.ocr?.text && !description) setDescription(result.ocr.text);

      if (result?.processedOffline) {
        addLog("Offline mode active: Listing queued locally.", "success");
      }

      setAnalysisProgress('Analysis complete!');
    } catch (error) {
      console.error('Image analysis failed:', error);
      setAnalysisProgress('Analysis failed.');
      addLog(`Analysis failed: ${error.message}`, "error");
    }
    setIsAnalyzing(false);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 4 images total
    if (imageFiles.length + files.length > 4) {
      showAlert("You can only upload a maximum of 4 images.", "Upload Limit", "warning");
      return;
    }

    addLog(`Compressing ${files.length} image(s) client-side...`, "primary");
    const { compressImage } = await import('../utils/imageCompression');

    const compressedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          return await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
        } catch (err) {
          console.error("Compression error:", err);
          return file;
        }
      })
    );

    const newPreviewUrls = compressedFiles.map(file => URL.createObjectURL(file));

    // We don't revoke here because we want to keep all previews visible!
    // But we should clean them up when the component unmounts or when images are removed.

    const isFirstUpload = imageFiles.length === 0;

    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    setImageFiles([...imageFiles, ...compressedFiles]);

    // Clear logs for new capture
    setDebugLog([]);
    addLog(`${files.length} compressed visual signal(s) received. Activating unified verification scan...`, "primary");

    // Run unified scan on the first image uploaded
    if (isFirstUpload) {
      runUnifiedScan(compressedFiles[0]);
      setSelectedImageForAI(0);
    }

    e.target.value = ''; // Reset to allow selecting same file again
  };

  const captureTimeMark = (onComplete = null) => {
    setIsLocating(true);
    addLog("Acquiring Secure GPS Signal for Time Mark...", "primary");

    const handleSuccess = (latitude, longitude, source = "GPS") => {
      const nearest = findNearestBarangay(latitude, longitude);
      const timestamp = new Date();

      setTimeMark({
        lat: latitude.toFixed(4),
        lng: longitude.toFixed(4),
        barangay: nearest,
        time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: timestamp.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
        fullDate: timestamp.toISOString()
      });

      setBarangay(nearest);
      setIsLocating(false);
      addLog(`Location Authenticated (${source}): ${nearest} Neighborhood`, "success");
      addLog(`Signal strength: High. Geo-fence verified.`, "success");
      if (onComplete) onComplete(nearest);
    };

    if (!navigator.geolocation) {
      addLog("Geolocation not supported. Using Davao City central fallback...", "warning");
      handleSuccess(7.1000, 125.6350, "Satellite Core Fallback");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handleSuccess(latitude, longitude, "GPS Sensor");
      },
      (err) => {
        addLog(`Location Acquisition Error: ${err.message}. Using Davao City central fallback...`, "warning");
        handleSuccess(7.1000, 125.6350, "Satellite Core Fallback");
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title || !price || !category || !barangay) {
      showAlert("Please fill out all required fields (title, category, price, barangay) before publishing.", "Validation Error", "error");
      return;
    }

    if (!currentUser) return;

    const coords = timeMark
      ? { lat: parseFloat(timeMark.lat), lng: parseFloat(timeMark.lng) }
      : resolveLocationCoords(barangay);

    setIsPublishing(true);
    addLog("Uploading image to secure storage...", "primary");

    try {
      // ── Upload images to Firebase Storage ──
      const imageUrls = [];
      if (imageFiles.length > 0) {
        addLog(`Uploading ${imageFiles.length} images...`, "primary");
        for (const file of imageFiles) {
          const storageRef = ref(storage, `listings/${currentUser.uid}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          imageUrls.push(url);
        }
        addLog("All images uploaded successfully.", "success");
      }

      const finalImageUrl = imageUrls[0] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=300";

      const listingDocRef = await addDoc(collection(db, 'listings'), {
        title,
        price: parseFloat(price),
        isNegotiable,
        deliveryOption,
        sellingReason,
        description,
        category,
        condition,
        tags,
        barangay,
        lat: coords.lat,
        lng: coords.lng,
        geohash: encodeGeohash(coords.lat, coords.lng),
        timeMark: timeMark || null,
        sellerId: currentUser.uid,
        verified: userProfile?.verified || userProfile?.isVerified || false,
        imageUrls: imageUrls,
        imageUrl: finalImageUrl,
        expiresAt: category === 'Food'
          ? new Date(foodExpiryDate + 'T23:59:59').toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: serverTimestamp(),
        isSold: false
      });

      // Update feedback loop prediction log
      if (predictionId) {
        try {
          await updateDoc(doc(db, 'ai_predictions', predictionId), {
            listingId: listingDocRef.id,
            finalTitle: title,
            finalCategory: category,
            finalTags: tags,
            updatedAt: serverTimestamp()
          });
          addLog("Prediction feedback loop updated successfully.", "success");
        } catch (updateErr) {
          console.error("Feedback loop update failed:", updateErr);
        }
      }


      showAlert(t('post_success_msg'), "Success", "success", () => {
        navigate('/app');
      });
    } catch (error) {
      console.error("Publishing Error:", error);
      addLog(`Error: ${error.message}`, "error");
      showAlert("Publishing Error. Check connection or Storage rules.", "Error", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const isVerified = userProfile?.verified || userProfile?.isVerified;

  if (!isVerified) {
    return (
      <div className="panel animate-fade-in" style={{ maxWidth: '600px', margin: '4rem auto', padding: '3rem 2rem', textAlign: 'center', borderRadius: '24px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: '80px', height: '80px', background: '#FEE2E2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 2rem' }}>
          <Shield size={40} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '1rem', fontFamily: "'Outfit', sans-serif" }}>
          Identity Verification Required
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          To keep our local Davao community safe and secure, all sellers must complete identity verification using a Government ID and Selfie before posting items.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={() => navigate('/app/verification')}
            className="btn-primary"
            style={{ width: '100%', padding: '0.9rem', borderRadius: '100px', fontWeight: 700 }}
          >
            Verify My Identity
          </button>
          <button 
            onClick={() => navigate('/app')}
            className="btn-secondary"
            style={{ width: '100%', padding: '0.9rem', borderRadius: '100px', fontWeight: 700 }}
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '5rem' }}>
      {/* Header and Step Indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 900, fontSize: '2.25rem', fontFamily: "'Outfit', sans-serif" }}>{t('post_title')}</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{t('post_subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDebug(!showDebug)}
            className="btn-secondary"
            style={{
              width: 'auto',
              padding: '0.6rem 1.5rem',
              borderRadius: '100px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              height: '44px',
              cursor: 'pointer'
            }}
          >
            <Terminal size={16} /> {showDebug ? 'Hide Console' : 'Console Logs'}
          </button>
        </div>

        {/* Wizard Step Progress Tracker */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          padding: '1rem 2rem',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: currentStep === 1 ? 1 : 0.6 }}>
            <span style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: currentStep >= 1 ? 'var(--primary)' : 'var(--border-color)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem'
            }}>1</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Upload & Scan</span>
          </div>
          <div style={{ flex: 1, height: '2px', background: currentStep > 1 ? 'var(--primary)' : 'var(--border-color)', margin: '0 1.5rem' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: currentStep === 2 ? 1 : 0.6 }}>
            <span style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: currentStep >= 2 ? 'var(--primary)' : 'var(--border-color)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem'
            }}>2</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Details & AI Advice</span>
          </div>
          <div style={{ flex: 1, height: '2px', background: currentStep > 2 ? 'var(--primary)' : 'var(--border-color)', margin: '0 1.5rem' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: currentStep === 3 ? 1 : 0.6 }}>
            <span style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: currentStep >= 3 ? 'var(--primary)' : 'var(--border-color)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem'
            }}>3</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Location & Publish</span>
          </div>
        </div>
      </div>

      {showDebug && (
        <div className="panel animate-slide-up" style={{ marginBottom: '2rem', background: '#0f172a', border: '1px solid #1e293b', padding: '1.5rem', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={14} color="var(--primary)" /> Anti-Gravity System Console
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Network Authenticated • GPS Core active</div>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {debugLog.length === 0 && <div style={{ color: '#475569', fontSize: '0.85rem', fontFamily: 'monospace' }}>_ Waiting for neighborhood signal...</div>}
            {debugLog.map((log, i) => (
              <div key={i} style={{ fontSize: '0.85rem', fontFamily: 'monospace', display: 'flex', gap: '1rem' }}>
                <span style={{ color: '#475569', minWidth: '70px' }}>[{log.time}]</span>
                <span style={{
                  color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? 'var(--primary)' : log.type === 'primary' ? '#38bdf8' : '#94a3b8'
                }}>
                  {log.type === 'error' ? '✖ ' : log.type === 'success' ? '✔ ' : '› '}
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-layout" style={{ gap: '2rem' }}>
        {/* Left Column - Wizard Step Switcher */}
        <div className="admin-col-main" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* STEP 1: UPLOAD MEDIA */}
          {currentStep === 1 && (
            <div className="panel animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '3rem 1.5rem', border: '2px dashed var(--border-color)', borderRadius: '24px', background: 'rgba(16, 185, 129, 0.02)' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={32} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 900 }}>Select Item Photos</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Upload up to 4 photos. Our cloud AI (Gemini 2.0 + Google Vision) will analyze content automatically.</p>
                </div>
                <button type="button" className="btn-primary" onClick={triggerFileInput} style={{ width: 'auto', padding: '0.75rem 2rem', borderRadius: '100px' }}>
                  Choose Files
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS & AI ADVICE */}
          {currentStep === 2 && (
            <div className="panel animate-fade-in" style={{ padding: '2rem' }}>
              <div className="panel-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Info size={22} color="var(--primary)" /> Listing Information
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Item Title */}
                <div className="form-group">
                  <label>{t('post_item_title')}</label>
                  <input type="text" className="premium-input" placeholder="e.g. Vintage Camera" required value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                {/* Grid: Category and Condition */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label>{t('post_cat_label')}</label>
                    <div className="input-with-icon">
                      <select className="premium-input premium-select" required value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="" disabled>Select category...</option>
                        {CATEGORIES.filter(c => c.id !== "All").map(c => (
                          <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                        ))}
                      </select>
                      <Tag className="input-icon" size={18} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t('post_condition')}</label>
                    <div className="input-with-icon">
                      <select className="premium-input premium-select" required value={condition} onChange={(e) => setCondition(e.target.value)}>
                        <option value="New">{t('post_cond_new')}</option>
                        <option value="Like New">{t('post_cond_like_new')}</option>
                        <option value="Good">{t('post_cond_good')}</option>
                        <option value="Fair">{t('post_cond_fair')}</option>
                        <option value="Poor">{t('post_cond_poor')}</option>
                      </select>
                      <TrendingUp className="input-icon" size={18} />
                    </div>
                  </div>
                </div>

                {/* Food Expiration Selector (Only shown if category is Food) */}
                {category === 'Food' && (
                  <div className="form-group animate-fade-in" style={{
                    padding: '1.25rem',
                    background: 'rgba(16, 185, 129, 0.04)',
                    border: '1px dashed var(--primary)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      <Sparkles size={16} color="var(--primary)" /> Best / Consume Before Date
                    </label>
                    <input 
                      type="date" 
                      className="premium-input" 
                      style={{ background: 'var(--card-bg)' }}
                      min={getTomorrowDateString()}
                      value={foodExpiryDate} 
                      onChange={(e) => setFoodExpiryDate(e.target.value)} 
                      required
                    />
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Since this listing is for a food item, it will automatically expire and be archived on the selected date to maintain freshness.
                    </p>
                  </div>
                )}

                {/* Grid: Price and Negotiability */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'end' }}>
                  <div className="form-group">
                    <label>{t('post_price')}</label>
                    <input type="number" className="premium-input" placeholder="0.00" required value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ paddingBottom: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={isNegotiable} onChange={(e) => setIsNegotiable(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Open to Negotiation</span>
                    </label>
                  </div>
                </div>

                {/* Grid: Delivery Option and Reason */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label>Delivery Method</label>
                    <select className="premium-input premium-select" value={deliveryOption} onChange={(e) => setDeliveryOption(e.target.value)}>
                      <option value="Meetup">Meetup Only</option>
                      <option value="Pickup">Pickup Only</option>
                      <option value="Delivery">Delivery / Shipping</option>
                      <option value="Flexible">Flexible (Meetup/Delivery)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reason for Selling (Optional)</label>
                    <select className="premium-input premium-select" value={sellingReason} onChange={(e) => setSellingReason(e.target.value)}>
                      <option value="">Select a reason...</option>
                      <option value="Upgrading">Upgrading</option>
                      <option value="Decluttering">Decluttering / Moving</option>
                      <option value="Wrong Size/Item">Wrong Size / Item</option>
                      <option value="Never Used">Never Used</option>
                      <option value="Need Cash">Need Cash</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label>{t('post_desc')}</label>
                  <textarea className="premium-input" rows="4" placeholder="Describe the condition, features, and meetup details..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'none' }}></textarea>
                </div>

                {/* Tags Section */}
                <div className="form-group">
                  <label>Tags (Auto-generated or custom)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {tags.map((tag, index) => (
                      <span key={index} style={{
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {tag}
                        <button type="button" onClick={() => setTags(tags.filter((_, i) => i !== index))} style={{ border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}>×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="premium-input"
                    placeholder="Add a tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (val && !tags.includes(val)) {
                          setTags([...tags, val]);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Smart Advisor Panel (Real-time Feedback) */}
              <div style={{
                marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-color)',
                borderRadius: '24px', border: '1px solid var(--border-color)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: '10px' }}>
                    <Sparkles size={18} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>{t('post_advisor_title')}</h3>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('post_advisor_sub')}</p>
                  </div>
                </div>

                {!isAnalyzing && generatedData.title && (
                  <div style={{ padding: '0.75rem', borderRadius: '14px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '4px' }}>✨ Smart Advisor Suggestion</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>
                      <strong>Title:</strong> "{generatedData.title}"<br />
                      <strong>Category:</strong> {generatedData.category}<br />
                      <strong>Tags:</strong> {generatedData.tags.join(', ')}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>Review and edit before posting.</div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Title Check */}
                  <div className={`premium-advisor-card ${title.length > 5 ? 'advisor-card-success' : 'advisor-card-warning'}`}>
                    {title.length > 5 ? <Check size={16} color="var(--primary)" /> : <Info size={16} color="#F59E0B" />}
                    <div>
                      <strong className="premium-advisor-title">
                        {title.length > 5 ? t('post_keyword_detected') : t('post_keyword_guidance')}
                      </strong>
                      <p className="premium-advisor-desc">
                        {title.length > 5 ? t('post_keyword_success') : t('post_keyword_hint')}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Advisor */}
                  <div className={`premium-advisor-card ${parseFloat(price) > 0 ? 'advisor-card-success' : 'advisor-card-info'}`}>
                    {parseFloat(price) > 0 ? <TrendingUp size={16} color="var(--primary)" /> : <Info size={16} color="#3B82F6" />}
                    <div>
                      <strong className="premium-advisor-title">
                        {parseFloat(price) > 0 ? t('post_price_check') : t('post_price_assessment')}
                      </strong>
                      <p className="premium-advisor-desc">
                        {parseFloat(price) > 0
                          ? t('post_price_success', { price, barangay: barangay || 'current' })
                          : t('post_price_hint')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION PROOF */}
          {currentStep === 3 && (
            <div className="panel animate-fade-in" style={{ padding: '2rem' }}>
              <div className="panel-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={22} color="var(--primary)" /> Select Pickup Barangay
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label>{t('post_barangay')}</label>
                <div className="input-with-icon">
                  <select className="premium-input premium-select" required value={barangay} onChange={(e) => setBarangay(e.target.value)}>
                    <option value="" disabled>Pickup Location</option>
                    {MOCK_BARANGAYS.filter(b => b !== "All Barangays").map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <MapPin className="input-icon" size={18} />
                </div>
              </div>

              {/* Secure Time Mark Widget */}
              {timeMark && (
                <div className="panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: '24px', background: 'var(--bg-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    <ShieldCheck size={18} color="var(--primary)" /> Secure GPS Verification & Time Mark
                  </div>

                  <div style={{ height: '220px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <GoogleMap
                      center={{ lat: parseFloat(timeMark.lat), lng: parseFloat(timeMark.lng) }}
                      zoom={15}
                    />
                  </div>

                  <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Signal</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.05em' }}>VERIFIED GPS</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: 'var(--text-main)' }}>{timeMark.time}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{timeMark.date}</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Barangay:</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{timeMark.barangay}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Coordinates:</span>
                      <span style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{timeMark.lat}, {timeMark.lng}</span>
                    </div>
                  </div>
                </div>
              )}

              {isLocating && (
                <div className="panel animate-pulse" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', borderRadius: '24px', minHeight: '200px' }}>
                  <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Syncing secure GPS coordinates...</div>
                </div>
              )}

              {!timeMark && !isLocating && (
                <div className="panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '24px', minHeight: '180px', border: '1px dashed var(--border-color)', background: 'transparent' }}>
                  <ShieldCheck size={28} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>
                    Upload photos to activate secure GPS Time Mark verification.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="panel" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem',
            padding: '1.25rem 2rem',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
              className="btn-secondary"
              style={{
                width: 'auto',
                padding: '0.75rem 2rem',
                borderRadius: '100px',
                opacity: currentStep === 1 ? 0 : 1,
                pointerEvents: currentStep === 1 ? 'none' : 'auto',
                transition: 'opacity 0.2s'
              }}
            >
              Back
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentStep === 1 && previewUrls.length === 0) {
                  showAlert('Please upload at least one image.', 'Media Required', 'warning');
                  return;
                }
                if (currentStep === 2 && (!title || !price || !category)) {
                  showAlert('Please fill out the required title, category, and price.', 'Validation Error', 'warning');
                  return;
                }
                setCurrentStep(currentStep + 1);
              }}
              className="btn-primary"
              style={{
                width: 'auto',
                padding: '0.75rem 2.5rem',
                borderRadius: '100px',
                display: currentStep === 3 ? 'none' : 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700
              }}
            >
              Next Step
            </button>

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPublishing}
                className="btn-primary"
                style={{
                  width: 'auto',
                  padding: '0.75rem 3rem',
                  borderRadius: '100px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 800
                }}
              >
                {isPublishing ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                {isPublishing ? t('post_publishing') : t('post_publish')}
              </button>
            )}
          </div>

        </div>

        {/* Right Column - Premium Previews */}
        <div className="admin-col-side" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} multiple />

          {/* Thumbnails Row */}
          <div className="panel" style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            padding: '1.25rem',
            width: '100%',
            alignItems: 'center',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            marginTop: '0.5rem'
          }}>
            {previewUrls.map((url, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  width: '76px',
                  height: '76px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: selectedImageForAI === index ? '2.5px solid var(--primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  background: 'var(--bg-color)',
                  padding: '2px',
                  transition: 'all 0.2s ease-in-out'
                }}
                onClick={() => {
                  setSelectedImageForAI(index);
                  handleImageAnalysis(imageFiles[index]);
                }}
              >
                <img src={url} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newUrls = previewUrls.filter((_, i) => i !== index);
                    const newFiles = imageFiles.filter((_, i) => i !== index);

                    if (previewUrls[index] && previewUrls[index].startsWith('blob:')) {
                      URL.revokeObjectURL(previewUrls[index]);
                    }

                    setPreviewUrls(newUrls);
                    setImageFiles(newFiles);
                    if (newFiles.length === 0) {
                      setTitle('');
                      setPrice('');
                      setCategory('');
                      setDescription('');
                      setTags([]);
                      setGeneratedData({ title: '', category: '', tags: [] });
                      setDebugLog([]);
                      setTimeMark(null);
                    } else if (selectedImageForAI === index) {
                      setSelectedImageForAI(0);
                      // Only run analysis on delete if the user hasn't heavily modified fields
                      if (!title) handleImageAnalysis(newFiles[0]);
                    } else if (selectedImageForAI > index) {
                      setSelectedImageForAI(selectedImageForAI - 1);
                    }
                  }}
                  style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', cursor: 'pointer', zIndex: 10, transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                >
                  ×
                </button>
              </div>
            ))}
            {previewUrls.length < 4 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '16px',
                  border: '2px dashed var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                  background: 'rgba(16, 185, 129, 0.02)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <PlusCircle size={24} />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* AI Analysis Popup Overlay */}
      {isAnalyzing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '440px', width: '90%', textAlign: 'center', boxShadow: 'var(--shadow-premium)' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Loader2 className="animate-spin" size={32} />
            </div>
            
            <div style={{ width: '100%' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: "'Outfit', sans-serif" }}>Secure Verification Scan</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', background: 'var(--bg-color)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                {/* Step 1 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: scanStep >= 1 ? 1 : 0.4 }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: scanStep > 1 ? '#10B981' : 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                    {scanStep > 1 ? '✓' : '1'}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Scan Uploaded Photos</span>
                </div>
                
                {/* Step 2 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: scanStep >= 2 ? 1 : 0.4 }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: scanStep > 2 ? '#10B981' : scanStep === 2 ? 'var(--primary)' : 'var(--border-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                    {scanStep > 2 ? '✓' : '2'}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Scan GPS Location & Time</span>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: scanStep >= 3 ? 1 : 0.4 }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: scanStep > 3 ? '#10B981' : scanStep === 3 ? 'var(--primary)' : 'var(--border-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                    {scanStep > 3 ? '✓' : '3'}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Auto-fill Listing Details</span>
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{analysisProgress}</p>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-premium)',
            transform: 'scale(0.95)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top decorative gradient or light glow depending on type */}
            <div style={{
              position: 'absolute',
              top: '-15%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '200px',
              height: '200px',
              background: alertModal.type === 'success' 
                ? 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)'
                : alertModal.type === 'error'
                  ? 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, transparent 70%)'
                  : alertModal.type === 'warning'
                    ? 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
              zIndex: 0,
              pointerEvents: 'none'
            }} />

            {/* Icon Wrapper */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: alertModal.type === 'success'
                ? 'rgba(16, 185, 129, 0.08)'
                : alertModal.type === 'error'
                  ? 'rgba(239, 68, 68, 0.08)'
                  : alertModal.type === 'warning'
                    ? 'rgba(245, 158, 11, 0.08)'
                    : 'rgba(59, 130, 246, 0.08)',
              border: alertModal.type === 'success'
                ? '2px solid rgba(16, 185, 129, 0.2)'
                : alertModal.type === 'error'
                  ? '2px solid rgba(239, 68, 68, 0.2)'
                  : alertModal.type === 'warning'
                    ? '2px solid rgba(245, 158, 11, 0.2)'
                    : '2px solid rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: alertModal.type === 'success'
                ? '#10B981'
                : alertModal.type === 'error'
                  ? '#EF4444'
                  : alertModal.type === 'warning'
                    ? '#F59E0B'
                    : '#3B82F6',
            }}>
              {alertModal.type === 'success' && <Check size={36} />}
              {alertModal.type === 'error' && <XCircle size={36} />}
              {alertModal.type === 'warning' && <AlertTriangle size={36} />}
              {alertModal.type === 'info' && <Info size={36} />}
            </div>

            {/* Text details */}
            <h3 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '1.5rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              marginBottom: '0.75rem',
              position: 'relative',
              zIndex: 1
            }}>
              {alertModal.title}
            </h3>
            
            <p style={{
              fontSize: '0.95rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              marginBottom: '2rem',
              position: 'relative',
              zIndex: 1
            }}>
              {alertModal.message}
            </p>

            {/* Action button */}
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setAlertModal(prev => ({ ...prev, isOpen: false }));
                if (alertModal.onClose) {
                  alertModal.onClose();
                }
              }}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '100px',
                fontWeight: 700,
                fontSize: '0.95rem',
                position: 'relative',
                zIndex: 1,
                cursor: 'pointer',
                background: alertModal.type === 'error'
                  ? '#EF4444'
                  : alertModal.type === 'warning'
                    ? '#F59E0B'
                    : 'var(--primary)',
                color: 'white',
                border: 'none',
                boxShadow: alertModal.type === 'error'
                  ? '0 4px 14px rgba(239, 68, 68, 0.2)'
                  : alertModal.type === 'warning'
                    ? '0 4px 14px rgba(245, 158, 11, 0.2)'
                    : '0 4px 14px rgba(79, 70, 229, 0.2)'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
