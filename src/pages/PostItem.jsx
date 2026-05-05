import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Bot, Loader2, Save, Sparkles, MapPin, Tag, Info, ShieldCheck, Terminal, AlertTriangle, RefreshCcw } from 'lucide-react';
import { MOCK_BARANGAYS, CATEGORIES } from '../data/mockData';
import { db, auth, collection, addDoc, serverTimestamp } from '../firebase';
import { encodeGeohash, resolveLocationCoords, findNearestBarangay } from '../utils/geo';

export default function PostItem() {
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const [apiError, setApiError] = useState(null);
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [barangay, setBarangay] = useState('');
  const [description, setDescription] = useState('');
  const [aiMetadata, setAiMetadata] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [timeMark, setTimeMark] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const fileInputRef = useRef(null);

  const addLog = (message, type = 'info') => {
    setDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
        };
      };
    });
  };

  const analyzeWithGemini = async (file) => {
    setApiError(null);
    addLog("Initializing Anti-Gravity AI Engine...", "primary");
    
    try {
      addLog("Compressing image payload for transport...");
      const base64Image = await compressImage(file);
      
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      if (!API_KEY || API_KEY.length < 10) {
        throw new Error("API_KEY_INVALID_OR_MISSING");
      }

      const prompt = `ACT AS: The "Anti-Gravity" Hyperlocal Computer Vision Engine.
TASK: Analyze the attached image and generate a high-conversion marketplace listing.
STRICT INSTRUCTION: Your identification MUST be based ONLY on the visual content of the image.

IDENTIFICATION GOALS:
1. Precise Item Name (Brand + Model + Key Feature).
2. Appropriate Category (Choose from: House, Electronic, Service, Food, Waste).
3. Technical description bullets.
4. Estimated fair market value in Philippine Pesos (₱).

OUTPUT FORMAT: Return a raw JSON object (no markdown) with this structure:
{
  "item_identified": boolean,
  "confidence_score": float,
  "suggested_title": "string",
  "suggested_price": number,
  "category": "string",
  "attributes": { "brand": "string", "model": "string", "color": "string" },
  "description_bullets": ["string", "string"]
}`;

      const models = ["gemini-1.5-flash", "gemini-pro-vision"];
      let success = false;
      let lastError = null;

      for (const modelName of models) {
        try {
          addLog(`Attempting analysis with model: ${modelName}...`);
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
          
          const requestBody = {
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: base64Image } }
              ]
            }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });

          if (response.status === 404) {
            addLog(`Model ${modelName} not found (404). Trying next...`, "warn");
            continue;
          }
          if (response.status === 403) throw new Error("API_KEY_REJECTED_LEAK");
          if (!response.ok) throw new Error(`API_ERROR_${response.status}`);

          const data = await response.json();
          const textResponse = data.candidates[0].content.parts[0].text;
          const parsed = JSON.parse(textResponse);
          
          addLog(`Signal decoded. Item identified as: ${parsed.suggested_title}`, "success");

          setIsAnalyzing(false);
          setTitle(parsed.suggested_title || '');
          setPrice(parsed.suggested_price?.toString() || '');
          setCategory(parsed.category || 'House');
          if (parsed.description_bullets && parsed.description_bullets.length > 0) {
            setDescription(parsed.description_bullets.map(b => "• " + b).join('\n'));
          }
          
          setAiMetadata({
            confidence: parsed.confidence_score || 0.85,
            item: parsed.item_identified ? "Identified" : "Uncertain",
            brand: parsed.attributes?.brand || 'Generic',
            raw: parsed
          });
          
          success = true;
          break;
        } catch (err) {
          lastError = err;
          addLog(`Model ${modelName} failed: ${err.message}`, "error");
        }
      }

      if (!success) throw lastError || new Error("ALL_MODELS_FAILED");

    } catch (error) {
      console.error("Gemini Vision Error:", error);
      setApiError(error.message);
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const localImageUrl = URL.createObjectURL(file);
    setPreviewUrl(localImageUrl);
    
    setTitle('');
    setPrice('');
    setCategory('');
    setDescription('');
    setAiMetadata(null);
    setDebugLog([]);
    setIsAnalyzing(true);
    
    analyzeWithGemini(file);
    captureTimeMark();
  };

  const captureTimeMark = () => {
    if (!navigator.geolocation) {
      addLog("Geolocation not supported", "error");
      return;
    }

    setIsLocating(true);
    addLog("Acquiring GPS Signal for Time Mark...", "primary");

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
        addLog(`Location Authenticated: ${nearest} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`, "success");
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
    setIsAnalyzing(true);
    
    try {
      await addDoc(collection(db, 'listings'), {
        title,
        price: parseFloat(price),
        description,
        category,
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

      alert("🎉 Listing published to Anti-Gravity Marketplace!");
      navigate('/app');
    } catch (error) {
      alert("Publishing Error. Check connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 900, fontSize: '2.25rem', fontFamily: "'Outfit', sans-serif" }}>Create Listing</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Powered by Anti-Gravity AI Engine</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="button" 
            onClick={() => setShowDebug(!showDebug)} 
            className="btn-secondary" 
            style={{ width: 'auto', padding: '0 1.25rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}
          >
            <Terminal size={14} /> {showDebug ? 'Hide Logs' : 'View Tech Log'}
          </button>
          <button type="button" onClick={handleSubmit} className="btn-primary" style={{ width: 'auto', padding: '0 2rem', height: '54px', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Save size={20} /> Publish Item
          </button>
        </div>
      </div>

      {showDebug && (
        <div className="panel animate-slide-up" style={{ marginBottom: '2rem', background: '#0f172a', border: '1px solid #1e293b', padding: '1.5rem', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={14} color="var(--primary)" /> Anti-Gravity System Console
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Vite-HMR Active • Gemini-1.5-Flash</div>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {debugLog.length === 0 && <div style={{ color: '#475569', fontSize: '0.85rem', fontFamily: 'monospace' }}>_ Waiting for system event...</div>}
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
              <Sparkles size={22} color="var(--primary)" /> Context & Time Mark Engine
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
              
              <div className="image-upload-area" onClick={triggerFileInput} style={{ 
                position: 'relative', height: '320px', borderRadius: '24px', border: '2px dashed var(--border-color)',
                background: 'var(--bg-color)', overflow: 'hidden'
              }}>
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {isAnalyzing && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10 }}>
                        <div style={{ position: 'relative' }}>
                          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--primary)' }} />
                          <Bot size={20} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }} />
                        </div>
                        <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '0.1em', marginTop: '1.5rem', textTransform: 'uppercase' }}>AI Core Analysis</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.5rem' }}>Extracting metadata from visual signal...</span>
                      </div>
                    )}
                    {timeMark && !isAnalyzing && (
                      <div style={{ 
                        position: 'absolute', bottom: '15px', left: '15px', right: '15px',
                        background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '18px',
                        padding: '1.25rem', color: 'white', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-end', textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                        animation: 'animate-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 5,
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
                      <div style={{ position: 'absolute', top: '15px', right: '15px', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', borderRadius: '10px', color: 'white', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 11 }}>
                        <Loader2 className="animate-spin" size={12} /> SYNCING GPS...
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ padding: '2rem', background: 'var(--primary-light)', borderRadius: '50%', marginBottom: '1.5rem' }}>
                      <Camera size={40} color="var(--primary)" />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>Capture Time Mark</span>
                    <span style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>We'll automatically verify the time and location.</span>
                  </>
                )}
              </div>

              {apiError && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <AlertTriangle color="#ef4444" size={24} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.9rem' }}>AI Signal Interrupted</div>
                    <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>
                      {apiError === 'API_KEY_REJECTED_LEAK' ? 'Security protocol: API Key has been blocked. Update configuration.' : 'Technical error in computer vision module.'}
                    </div>
                  </div>
                  <button onClick={() => analyzeWithGemini(fileInputRef.current.files[0])} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444' }}>
                    <RefreshCcw size={16} />
                  </button>
                </div>
              )}
              
              {aiMetadata && (
                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--card-bg)', border: '1px solid var(--primary)', borderRadius: '16px', boxShadow: 'var(--shadow-glow)' }}>
                  <div style={{ fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.75rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bot size={14} /> AI Intelligence Output
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '10px' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700 }}>CLASSIFICATION</div>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>{(aiMetadata.confidence * 100).toFixed(0)}% Match</div>
                    </div>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '10px' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700 }}>OBJECT ID</div>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>{aiMetadata.brand}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="panel" style={{ padding: '2rem' }}>
            <div className="panel-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Info size={22} color="var(--primary)" /> Listing Information
            </div>
            <div className="form-group">
              <label>Item Title</label>
              <input type="text" className="premium-input" placeholder="e.g. Vintage Camera" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>Description</label>
              <textarea className="premium-input" rows="5" placeholder="Describe the condition, features, and meetup details..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'none' }}></textarea>
            </div>
            <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
              <label>Price (₱)</label>
              <input type="number" className="premium-input" placeholder="0.00" required value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="admin-col-side" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div className="panel-header" style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Classification</div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Category</label>
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
          </div>

          <div className="panel" style={{ padding: '1.5rem' }}>
            <div className="panel-header" style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Logistics</div>
            <div className="form-group">
              <label>Your Barangay</label>
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

          <div style={{ 
            padding: '1.5rem', background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', borderRadius: '24px', 
            border: '1px solid #FCD34D', boxShadow: '0 10px 15px -3px rgba(252, 211, 77, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '0.6rem', background: '#FCD34D', borderRadius: '12px' }}>
                <ShieldCheck size={20} color="#92400E" />
              </div>
              <div>
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#92400E', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Defense Mode</span>
                <p style={{ fontSize: '0.75rem', color: '#B45309', margin: '0.25rem 0 1rem', lineHeight: 1.4 }}>Enforces a strict 1-hour Time-to-Live for rapid evaluation.</p>
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
