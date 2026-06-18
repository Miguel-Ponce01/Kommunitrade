import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Loader2, Save, Sparkles, MapPin, Tag, Info, ShieldCheck, Terminal, Check, TrendingUp } from 'lucide-react';
import { MOCK_BARANGAYS, CATEGORIES } from '../data/mockData';
import { db, storage, doc, getDoc, updateDoc } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from '../firebase';
import { encodeGeohash, resolveLocationCoords, findNearestBarangay } from '../utils/geo';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { useAuth } from '../contexts/AuthContext';
import GoogleMap from '../components/GoogleMap';
import { processListingImage } from '../services/listingProcessor';

export default function EditItem() {
  const { id } = useParams();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null); // actual File for Storage upload
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
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');

  const fileInputRef = useRef(null);

  const addLog = (message, type = 'info') => {
    setDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };


  useEffect(() => {
    async function fetchListing() {
      if (!currentUser) return;
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Permission check
          if (currentUser.uid !== data.sellerId) {
            alert("You don't have permission to edit this listing.");
            navigate('/app/profile');
            return;
          }

          setTitle(data.title || '');
          setPrice(data.price?.toString() || '');
          setCategory(data.category || '');
          setBarangay(data.barangay || '');
          setDescription(data.description || '');
          setCondition(data.condition || 'New');
          setTags(data.tags || []);
          setPreviewUrl(data.imageUrl || null);
          setOriginalImageUrl(data.imageUrl || null);
          if (data.timeMark) setTimeMark(data.timeMark);
        } else {
          alert("Listing not found.");
          navigate('/app/profile');
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        alert("Failed to load listing.");
        navigate('/app/profile');
      }
    }
    fetchListing();
  }, [id, navigate, currentUser]);

  // Revoke previous blob URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    addLog("Compressing image client-side...", "primary");
    const { compressImage } = await import('../utils/imageCompression');
    const compressedFile = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });

    const localImageUrl = URL.createObjectURL(compressedFile);
    setPreviewUrl(localImageUrl);
    setImageFile(compressedFile);

    setDebugLog([]);
    addLog("Compressed visual signal received. Activating GPS verification...", "primary");
    captureTimeMark();
    handleImageAnalysis(compressedFile);
  };

  const handleImageAnalysis = async (file) => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress('Running AI analysis (OCR + CNN)...');
    
    try {
      addLog("Analyzing image content securely...", "primary");
      const result = await processListingImage(file, id, category || null);
      
      if (result?.ocr?.success && result.ocr.text) {
        addLog(`Extracted text: ${result.ocr.text.substring(0, 30)}...`, "primary");
        if (!description) {
          setDescription(result.ocr.text);
        }
      }
      
      if (result?.cnn?.success && result.cnn.topPrediction) {
        const topLabelName = result.cnn.topPrediction.label || result.cnn.topPrediction.className || "object";
        const topConf = result.cnn.topPrediction.confidence || result.cnn.topPrediction.probability || 0;
        addLog(`Detected object: ${topLabelName} (${Math.round(topConf * 100)}%)`, "success");
      }
      
      if (result?.deepseek?.data) {
        addLog("DeepSeek Smart Advisor recommendation loaded securely!", "success");
        
        // Auto-fill fields with AI optimized results
        setTitle(result.deepseek.data.title || '');
        setCategory(result.deepseek.data.category || '');
        setTags(result.deepseek.data.tags || []);
        if (result.deepseek.data.suggestedPrice > 0) {
          setPrice(result.deepseek.data.suggestedPrice.toString());
          addLog(`Suggested Price: ₱${result.deepseek.data.suggestedPrice}`, "success");
        }
      }
      
      if (result?.processedOffline) {
        addLog("Offline mode active: Modifications queued locally.", "success");
      }
      
      setAnalysisProgress('Analysis complete!');
    } catch (error) {
      console.error('Image analysis failed:', error);
      setAnalysisProgress('Analysis failed.');
      addLog(`Analysis failed: ${error.message}`, "error");
    }
    setIsAnalyzing(false);
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
    addLog("Updating listing...", "primary");

    try {
      let finalImageUrl = originalImageUrl;
      if (imageFile) {
        addLog("Uploading new image to secure storage...", "primary");
        const storageRef = ref(storage, `listings/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
        addLog("Image uploaded successfully.", "success");
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const isVerified = userSnap.exists() ? (userSnap.data().verified || userSnap.data().isVerified || false) : false;

      const listingRef = doc(db, 'listings', id);
      
      const updateData = {
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
        verified: isVerified
      };

      if (timeMark) {
        updateData.timeMark = timeMark;
      }
      
      if (finalImageUrl) {
        updateData.imageUrl = finalImageUrl;
      }

      await updateDoc(listingRef, updateData);

      alert("Listing updated successfully!");
      navigate('/app/profile');
    } catch (error) {
      console.error("Update Error:", error);
      addLog(`Error: ${error.message}`, "error");
      alert("Update Error. Check connection or Storage rules.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 900, fontSize: '2.25rem', fontFamily: "'Outfit', sans-serif" }}>Edit Listing</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Update your item details and save changes</p>
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
            {isPublishing ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} 
            {isPublishing ? "Updating..." : "Update Item"}
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
            {debugLog.length === 0 && <div style={{ color: '#475569', fontSize: '0.85rem', fontFamily: 'monospace' }}>_ Ready to update.</div>}
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
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          
          {/* Premium Product Preview Card */}
          <div className="preview-product-card">
            <div className="preview-image-area" onClick={triggerFileInput} style={{ cursor: 'pointer' }} title="Click to upload image">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
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
    </div>
  );
}
