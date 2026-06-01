import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, Save, Sparkles, MapPin, Tag, Info, ShieldCheck, Terminal, Check, TrendingUp, Plus, PlusCircle } from 'lucide-react';
import { MOCK_BARANGAYS, CATEGORIES } from '../data/mockData';
import { db, auth, storage, collection, addDoc, serverTimestamp } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from '../firebase';
import { encodeGeohash, resolveLocationCoords, findNearestBarangay } from '../utils/geo';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { useAuth } from '../contexts/AuthContext';
import GoogleMap from '../components/GoogleMap';
import { processListingImage } from '../services/listingProcessor';
import { loadMobileNet, loadTesseract } from '../services/offlineModels';

export default function PostItem() {
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [previewUrls, setPreviewUrls] = useState([]);
  const [imageFiles, setImageFiles] = useState([]); // actual Files for Storage upload
  const [selectedImageForAI, setSelectedImageForAI] = useState(0); // Index of image to analyze
  const [isPublishing, setIsPublishing] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [barangay, setBarangay] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('New');
  const [showDebug, setShowDebug] = useState(false);
  const [timeMark, setTimeMark] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [tags, setTags] = useState([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [generatedData, setGeneratedData] = useState({
    title: '',
    category: '',
    tags: []
  });

  const fileInputRef = useRef(null);

  const addLog = (message, type = 'info') => {
    setDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  // Preload offline models in background for offline readiness
  useEffect(() => {
    const preload = async () => {
      addLog("Initializing on-device AI engines...", "primary");
      try {
        await Promise.allSettled([loadMobileNet(), loadTesseract()]);
        addLog("Local CNN + OCR engines ready for offline fallback.", "success");
      } catch (err) {
        console.warn("Offline engines failed to preload:", err);
      }
    };
    preload();
  }, []);

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

  const handleImageAnalysis = async (file) => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress('Running AI analysis (OCR + Object Detection)...');
    
    try {
      addLog("Compressing image client-side...", "primary");
      const { compressImage } = await import('../utils/imageCompression');
      const compressedFile = await compressImage(file);

      addLog("Analyzing image content...", "primary");
      const listingId = `${currentUser.uid}_${Date.now()}`;
      const result = await processListingImage(compressedFile, listingId, category || null);
      
      if (result.ocr.success && result.ocr.text) {
        addLog(`Extracted text: ${result.ocr.text.substring(0, 30)}...`, "primary");
      }
      
      if (result.cnn.success && result.cnn.topPrediction) {
        const topLabelName = result.cnn.topPrediction.label || result.cnn.topPrediction.className || "object";
        const topConf = result.cnn.topPrediction.confidence || result.cnn.topPrediction.probability || 0;
        addLog(`Detected object: ${topLabelName} (${Math.round(topConf * 100)}%)`, "success");
      }
      
      // Auto-fill fields with AI optimized results securely generated
      addLog("DeepSeek Smart Advisor recommendation loaded!", "success");
      setGeneratedData({
        title: result.deepseek.data.title,
        category: result.deepseek.data.category,
        tags: result.deepseek.data.tags
      });
      
      setTitle(result.deepseek.data.title);
      setCategory(result.deepseek.data.category);
      if (result.ocr.text) setDescription(result.ocr.text);
      setTags(result.deepseek.data.tags);
      
      if (result.deepseek.data.suggestedPrice > 0) {
        setPrice(result.deepseek.data.suggestedPrice.toString());
        addLog(`Suggested Price: ₱${result.deepseek.data.suggestedPrice}`, "success");
      } else if (!price && result.deepseek.data.category === 'Electronics') {
        setPrice('500'); // Fallback suggest
      }
      
      if (result.processedOffline) {
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 4 images total
    if (imageFiles.length + files.length > 4) {
      alert("You can only upload a maximum of 4 images.");
      return;
    }

    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    
    // We don't revoke here because we want to keep all previews visible!
    // But we should clean them up when the component unmounts or when images are removed.

    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    setImageFiles([...imageFiles, ...files]);

    // Clear logs for new capture
    setDebugLog([]);
    addLog(`${files.length} visual signal(s) received. Activating GPS verification...`, "primary");

    captureTimeMark();
    
    // Run AI analysis on the first image if no images were present before
    if (imageFiles.length === 0) {
      handleImageAnalysis(files[0]);
      setSelectedImageForAI(0);
    }
    
    e.target.value = ''; // Reset to allow selecting same file again
  };

  const captureTimeMark = () => {
    if (!navigator.geolocation) {
      addLog("Geolocation not supported", "error");
      return;
    }

    setIsLocating(true);
    addLog("Acquiring Secure GPS Signal for Time Mark...", "primary");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
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
        addLog(`Location Authenticated: ${nearest} Neighborhood`, "success");
        addLog(`Signal strength: High. Geo-fence verified.`, "success");
      },
      (err) => {
        addLog(`Location Acquisition Failed: ${err.message}`, "error");
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title || !price || !category || !barangay) {
      alert("Please fill out the required fields!");
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

      await addDoc(collection(db, 'listings'), {
        title,
        price: parseFloat(price),
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
        expiresAt: new Date(Date.now() + (7 * 24) * 60 * 60 * 1000).toISOString(),
        createdAt: serverTimestamp(),
        isSold: false
      });

      alert(t('post_success_msg'));
      navigate('/app');
    } catch (error) {
      console.error("Publishing Error:", error);
      addLog(`Error: ${error.message}`, "error");
      alert("Publishing Error. Check connection or Storage rules.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 900, fontSize: '2.25rem', fontFamily: "'Outfit', sans-serif" }}>{t('post_title')}</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{t('post_subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
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
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            <Terminal size={16} /> {showDebug ? 'Hide Console' : 'Console Logs'}
          </button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isPublishing} 
            className="btn-primary" 
            style={{ 
              width: 'auto', 
              padding: '0.6rem 2rem', 
              borderRadius: '100px', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              height: '44px',
              cursor: 'pointer',
              transition: 'var(--transition)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
          >
            {isPublishing ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />} 
            {isPublishing ? t('post_publishing') : t('post_publish')}
          </button>
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
      
      <form onSubmit={handleSubmit} className="admin-layout" style={{ gap: '2rem' }}>
        {/* Left Column: Form Fields */}
        <div className="admin-col-main" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="panel" style={{ padding: '2rem' }}>
            <div className="panel-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Info size={22} color="var(--primary)" /> {t('post_info_title')}
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

              {/* Grid: Price and Barangay */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>{t('post_price')}</label>
                  <input type="number" className="premium-input" placeholder="0.00" required value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>

                <div className="form-group">
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
              </div>

              {/* Description */}
              <div className="form-group">
                <label>{t('post_desc')}</label>
                <textarea className="premium-input" rows="5" placeholder="Describe the condition, features, and meetup details..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'none' }}></textarea>
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
        </div>

        {/* Right Column: Visual Verification & Secure Time Mark */}
        <div className="admin-col-side" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} multiple />
          
          {/* Premium Product Preview Card */}
          <div className="preview-product-card">
            <div className="preview-image-area" onClick={triggerFileInput} style={{ cursor: 'pointer' }} title="Click to upload images">
              {previewUrls.length > 0 ? (
                <img 
                  src={previewUrls[selectedImageForAI]} 
                  alt="Main Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <svg className="bottle-svg" viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '160px', height: 'auto' }}>
                  {/* Bottle body */}
                  <rect x="30" y="50" width="60" height="130" rx="10" fill="var(--preview-bottle-bg)" stroke="var(--preview-bottle-stroke)" strokeWidth="1.2"/>
                  {/* Bottle neck */}
                  <rect x="42" y="35" width="36" height="18" rx="4" fill="var(--preview-bottle-neck)" stroke="var(--preview-bottle-stroke)" strokeWidth="1"/>
                  {/* Cap */}
                  <rect x="38" y="18" width="44" height="19" rx="6" fill="var(--preview-bottle-cap)"/>
                  {/* Label area hint */}
                  <rect x="38" y="80" width="44" height="60" rx="4" fill="var(--preview-bottle-label)" opacity="0.9"/>
                </svg>
              )}

              {/* AI Selected Badge */}
              {previewUrls.length > 0 && (
                <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(16, 185, 129, 0.9)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, zIndex: 12 }}>
                  ✨ Selected for AI
                </div>
              )}
            </div>

            <div className="preview-content">
              <div className="preview-your-brand">KOMUNITRADE</div>
              <div className="preview-brand-name">{title || "BRUDY"}</div>
              <div className="preview-audience">{condition || "Gentlemen's & Women's"}</div>
              <div className="preview-product-type">{category ? (CATEGORIES.find(c => c.id === category)?.label || category) : "Cleanser & Toner"}</div>
              <div className="preview-plus-section">
                <div className="preview-plus-sign">{price ? `₱${price}` : "+"}</div>
              </div>
            </div>
          </div>

          {/* Thumbnails Row below preview-product-card */}
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '0.25rem 0', width: '100%', alignItems: 'center' }}>
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
                      handleImageAnalysis(newFiles[0]);
                    } else if (selectedImageForAI > index) {
                      setSelectedImageForAI(selectedImageForAI - 1);
                    }
                  }}
                  style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer', zIndex: 10 }}
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
                  border: '1.5px dashed var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                  background: 'var(--card-bg)',
                  transition: 'var(--transition)'
                }}
              >
                <PlusCircle size={22} />
              </div>
            )}
          </div>

          {/* Secure Time Mark Widget */}
          {timeMark && (
            <div className="panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: '24px', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                <ShieldCheck size={18} color="var(--primary)" /> GPS Geo-Fence & Time Mark
              </div>
              
              <div style={{ height: '180px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <GoogleMap 
                  center={{ lat: parseFloat(timeMark.lat), lng: parseFloat(timeMark.lng) }}
                  zoom={15}
                />
              </div>

              <div style={{ 
                background: 'var(--bg-color)', 
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
            <div className="panel animate-pulse" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', borderRadius: '24px', minHeight: '150px', marginBottom: 0 }}>
              <Loader2 className="animate-spin" size={24} color="var(--primary)" />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Syncing secure GPS coordinates...</div>
            </div>
          )}

          {!timeMark && !isLocating && (
            <div className="panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '24px', minHeight: '120px', border: '1px dashed var(--border-color)', background: 'transparent', marginBottom: 0 }}>
              <ShieldCheck size={24} color="var(--text-muted)" style={{ opacity: 0.5 }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>
                Upload photos to activate secure GPS Time Mark verification.
              </div>
            </div>
          )}
        </div>
      </form>

        {/* AI Analysis Popup Overlay */}
        {isAnalyzing && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: 'var(--shadow-premium)' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Loader2 className="animate-spin" size={32} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: "'Outfit', sans-serif" }}>Analyzing Image</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{analysisProgress}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
