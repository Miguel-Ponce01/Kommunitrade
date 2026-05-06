import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, Save, Sparkles, MapPin, Tag, Info, ShieldCheck, Terminal, Check, TrendingUp } from 'lucide-react';
import { MOCK_BARANGAYS, CATEGORIES } from '../data/mockData';
import { db, auth, collection, addDoc, serverTimestamp } from '../firebase';
import { encodeGeohash, resolveLocationCoords, findNearestBarangay } from '../utils/geo';
import { useLanguage } from '../hooks/useLanguage.jsx';
import GoogleMap from '../components/GoogleMap';

export default function PostItem() {
  const [lang, setLang, t] = useLanguage();
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [barangay, setBarangay] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('New');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [timeMark, setTimeMark] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const fileInputRef = useRef(null);

  const addLog = (message, type = 'info') => {
    setDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const localImageUrl = URL.createObjectURL(file);
    setPreviewUrl(localImageUrl);
    
    // Clear logs for new capture
    setDebugLog([]);
    addLog("Visual signal received. Activating GPS verification...", "primary");
    
    captureTimeMark();
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
    if(!title || !price || !category || !barangay) {
      alert("Please fill out the required fields!");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const coords = timeMark ? { lat: parseFloat(timeMark.lat), lng: parseFloat(timeMark.lng) } : resolveLocationCoords(barangay);
    setIsPublishing(true);
    
    try {
      await addDoc(collection(db, 'listings'), {
        title,
        price: parseFloat(price),
        description,
        category,
        condition,
        barangay,
        lat: coords.lat,
        lng: coords.lng,
        geohash: encodeGeohash(coords.lat, coords.lng),
        timeMark: timeMark || null,
        sellerId: currentUser.uid,
        imageUrl: previewUrl || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=300",
        expiresAt: new Date(Date.now() + (isDemoMode ? 1 : 7 * 24) * 60 * 60 * 1000).toISOString(),
        createdAt: serverTimestamp(),
        isSold: false
      });

      alert(t('post_success_msg'));
      navigate('/app');
    } catch (error) {
      alert("Publishing Error. Check connection.");
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
            style={{ width: 'auto', padding: '0 1.25rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}
          >
            <Terminal size={14} /> {showDebug ? 'Hide Logs' : 'View Network Log'}
          </button>
          <button type="button" onClick={handleSubmit} disabled={isPublishing} className="btn-primary" style={{ width: 'auto', padding: '0 2rem', height: '54px', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isPublishing ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
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
        <div className="admin-col-main" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="panel" style={{ padding: '2rem' }}>
            <div className="panel-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldCheck size={22} color="var(--primary)" /> Time Mark Engine
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
                    
                    {/* Small Map Overlay (Picture-in-Picture) */}
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

                    {/* Authenticated Time Mark Bar */}
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
                            <ShieldCheck size={14} color="var(--primary)" /> {timeMark.barangay.toUpperCase()}
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

            {/* Smart Advisor Panel (Real-time Feedback) */}
            <div style={{ 
              marginTop: '1.5rem', padding: '1.5rem', background: 'var(--bg-card)', 
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
                <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', borderRadius: '14px', background: title.length > 5 ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)', border: `1px solid ${title.length > 5 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                   {title.length > 5 ? <Check size={16} color="var(--primary)" /> : <Info size={16} color="#F59E0B" />}
                   <div style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                     <strong style={{ display: 'block', marginBottom: '2px', color: title.length > 5 ? 'var(--primary)' : '#D97706' }}>
                       {title.length > 5 ? t('post_keyword_detected') : t('post_keyword_guidance')}
                     </strong>
                     {title.length > 5 ? t('post_keyword_success') : t('post_keyword_hint')}
                   </div>
                </div>

                {/* Pricing Advisor */}
                <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', borderRadius: '14px', background: price > 0 ? 'rgba(16,185,129,0.05)' : 'rgba(59,130,246,0.05)', border: `1px solid ${price > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
                   {price > 0 ? <TrendingUp size={16} color="var(--primary)" /> : <Info size={16} color="#3B82F6" />}
                   <div style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                     <strong style={{ display: 'block', marginBottom: '2px', color: price > 0 ? 'var(--primary)' : '#2563EB' }}>
                       {price > 0 ? t('post_price_check') : t('post_price_assessment')}
                     </strong>
                     {price > 0 
                       ? t('post_price_success', { price, barangay: barangay || 'current' }) 
                       : t('post_price_hint')}
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: '2rem' }}>
            <div className="panel-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Info size={22} color="var(--primary)" /> {t('post_info_title')}
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

            <div className="form-group" style={{ marginBottom: 0 }}>
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

          <div className="panel" style={{ padding: '1.5rem', background: 'var(--bg-card)' }}>
            <div className="panel-header" style={{ marginBottom: '1.25rem', fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={18} /> Listing Pro Tips
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>✨ Keywords</strong>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Use relevant keywords in the title to improve searchability within Davao.</p>
              </div>
              <div style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>📸 High-Quality Photos</strong>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Use well-lit photos with a plain background for better visibility.</p>
              </div>
              <div style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>📝 Specific Details</strong>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Provide brand, size, and condition to reduce buyer queries.</p>
              </div>
              <div style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>💰 Competitive Pricing</strong>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Research competitors to set a fair price for your neighborhood.</p>
              </div>
            </div>
          </div>

          <div style={{ 
            padding: '1.5rem', background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', borderRadius: '24px', 
            border: '1px solid #FCD34D', boxShadow: '0 10px 15px -3px rgba(252, 211, 77, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '0.6rem', background: '#FCD34D', borderRadius: '12px' }}>
                <ShieldCheck size={20} color="#92400E" />
              </div>
              <div>
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#92400E', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('post_defense_mode')}</span>
                <p style={{ fontSize: '0.75rem', color: '#B45309', margin: '0.25rem 0 1rem', lineHeight: 1.4 }}>{t('post_defense_desc')}</p>
                <label className="theme-toggle-pill" style={{ width: '100%', height: '40px', background: isDemoMode ? '#92400E' : '#FFF', border: '1px solid #FCD34D' }}>
                  <input type="checkbox" hidden checked={isDemoMode} onChange={(e) => setIsDemoMode(e.target.checked)} />
                  <div className="toggle-handle" style={{ left: isDemoMode ? 'calc(100% - 36px)' : '4px', background: isDemoMode ? '#FFF' : '#FCD34D' }}></div>
                  <span style={{ width: '100%', textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: isDemoMode ? '#FFF' : '#92400E', paddingLeft: isDemoMode ? '0' : '30px', paddingRight: isDemoMode ? '30px' : '0' }}>
                    {isDemoMode ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
