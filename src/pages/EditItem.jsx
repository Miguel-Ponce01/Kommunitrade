import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Loader2, Save, Sparkles, MapPin, Tag, Info, ShieldCheck, Terminal, Check, TrendingUp } from 'lucide-react';
import { MOCK_BARANGAYS, CATEGORIES } from '../data/mockData';
import { db, auth, storage, doc, getDoc, updateDoc } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from '../firebase';
import { encodeGeohash, resolveLocationCoords, findNearestBarangay } from '../utils/geo';
import { useLanguage } from '../hooks/useLanguage.jsx';
import GoogleMap from '../components/GoogleMap';
import { extractText } from '../services/imageAnalysisService';
import { analyzeListingWithDeepSeek } from '../services/deepseekService';

export default function EditItem() {
  const { id } = useParams();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
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
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Permission check
          if (auth.currentUser && auth.currentUser.uid !== data.sellerId) {
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
  }, [id, navigate]);

  // Revoke previous blob URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const localImageUrl = URL.createObjectURL(file);
    setPreviewUrl(localImageUrl);
    setImageFile(file);

    setDebugLog([]);
    addLog("Visual signal received. Activating GPS verification...", "primary");
    captureTimeMark();
    handleImageAnalysis(file);
  };

  const runDeepSeekAnalysis = async (ocrText = '') => {
    setIsAnalyzing(true);
    setAnalysisProgress('DeepSeek AI is optimizing your listing...');
    
    const result = await analyzeListingWithDeepSeek({ title, description, ocrText });
    
    if (result.success) {
      if (result.data.title && result.data.title !== "None provided") setTitle(result.data.title);
      if (result.data.category && result.data.category !== "Other") setCategory(result.data.category);
      if (result.data.tags && result.data.tags.length > 0) setTags(result.data.tags);
      if (result.data.suggestedPrice && !price) setPrice(result.data.suggestedPrice.toString());
      
      setAnalysisProgress('DeepSeek Optimization complete! Review suggestions below.');
      addLog("DeepSeek API optimization applied.", "success");
    } else {
      setAnalysisProgress('AI Analysis failed.');
      addLog("DeepSeek API failed: " + result.error, "error");
    }
    setIsAnalyzing(false);
  };

  const handleImageAnalysis = async (file) => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress('Extracting text from image...');
    
    try {
      const ocrResult = await extractText(file);
      const extractedText = ocrResult.success ? ocrResult.text : '';
      
      if (extractedText) {
        addLog(`Extracted text: ${extractedText.substring(0, 30)}...`, "primary");
      }
      
      await runDeepSeekAnalysis(extractedText);
    } catch (error) {
      console.error('Image analysis failed:', error);
      setAnalysisProgress('Analysis failed.');
      setIsAnalyzing(false);
    }
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

    const currentUser = auth.currentUser;
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
        geohash: encodeGeohash(coords.lat, coords.lng)
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
            style={{ width: 'auto', padding: '0 1.25rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}
          >
            <Terminal size={14} /> {showDebug ? 'Hide Logs' : 'View Network Log'}
          </button>
          <button type="button" onClick={handleSubmit} disabled={isPublishing} className="btn-primary" style={{ width: 'auto', padding: '0 2rem', height: '54px', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isPublishing ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
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
        <div className="admin-col-main" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="panel" style={{ padding: '2rem' }}>
            <div className="panel-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldCheck size={22} color="var(--primary)" /> Image & Location
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
              
              <div className="image-upload-area" onClick={triggerFileInput} style={{ 
                position: 'relative', height: '320px', borderRadius: '24px', border: '2px dashed var(--border-color)',
                background: 'var(--bg-color)', overflow: 'hidden'
              }}>
                {previewUrl ? (
                  <>
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    
                    {timeMark && (
                      <div style={{ 
                        position: 'absolute', top: '15px', right: '15px', 
                        width: '120px', height: '120px', borderRadius: '16px',
                        overflow: 'hidden', border: '3px solid white',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 20
                      }}>
                         <GoogleMap 
                           center={{ lat: parseFloat(timeMark.lat), lng: parseFloat(timeMark.lng) }}
                           zoom={15}
                         />
                      </div>
                    )}

                    {timeMark && (
                      <div style={{ 
                        position: 'absolute', bottom: '15px', left: '15px', right: '15px',
                        background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '18px',
                        padding: '1.25rem', color: 'white', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-end', textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                        animation: 'animate-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 11,
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Authenticated Time Mark</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{timeMark.time}</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.8, marginTop: '4px' }}>{timeMark.date}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <ShieldCheck size={14} color="var(--primary)" /> {timeMark.barangay?.toUpperCase()}
                          </div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.7, fontFamily: 'monospace', marginTop: '4px' }}>{timeMark.lat}, {timeMark.lng}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em', marginTop: '4px' }}>VERIFIED GPS SIGNAL</div>
                        </div>
                      </div>
                    )}
                    {isLocating && (
                      <div style={{ position: 'absolute', top: '15px', left: '15px', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', borderRadius: '10px', color: 'white', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 11 }}>
                        <Loader2 className="animate-spin" size={12} /> SYNCING GPS...
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary)' }}>
                        <Camera size={32} />
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>Take or Upload Photo</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Visual proof is required for Time Mark</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: '2rem' }}>
            <div className="panel-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Info size={22} color="var(--primary)" /> {t('post_info_title')}
              </div>
              <button type="button" onClick={() => runDeepSeekAnalysis('')} disabled={isAnalyzing} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }}>
                {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} 
                {isAnalyzing ? analysisProgress : "Auto-Fill with DeepSeek"}
              </button>
            </div>
            <div className="form-group">
              <label>{t('post_item_title')}</label>
              <input type="text" className="premium-input" placeholder="e.g. Vintage Camera" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>{t('post_desc')}</label>
              <textarea className="premium-input" rows="5" placeholder="Describe the condition, features, and meetup details..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'none' }}></textarea>
            </div>
            <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
              <label>{t('post_price')}</label>
              <input type="number" className="premium-input" placeholder="0.00" required value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="admin-col-side" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div className="panel-header" style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>{t('post_cat')}</div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
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

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
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

            <div className="form-group" style={{ marginBottom: 0 }}>
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

          <div className="panel" style={{ padding: '1.5rem' }}>
            <div className="panel-header" style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>{t('post_logistics')}</div>
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

        </div>
      </form>
    </div>
  );
}
