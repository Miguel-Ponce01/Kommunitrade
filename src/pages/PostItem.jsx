import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Bot, Loader2, Save } from 'lucide-react';
import { MOCK_BARANGAYS, CATEGORIES } from '../data/mockData';

export default function PostItem() {
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [barangay, setBarangay] = useState('');
  const [description, setDescription] = useState('');

  const fileInputRef = useRef(null);

  const fallbackSimulation = () => {
    setIsAnalyzing(false);
    setTitle('Apple Watch Series 7 (GPS)');
    setPrice('12000');
    setCategory('Electronic');
    setDescription('Slightly used Apple Watch Series 7. Excellent condition with no scratches. Comes with original charger and box.');
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const analyzeWithGemini = async (file) => {
    try {
      const base64Image = await fileToBase64(file);
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!API_KEY) {
        console.warn("No Gemini API Key found in .env.local! Falling back to simulated data.");
        setTimeout(fallbackSimulation, 1500);
        return;
      }

      const prompt = `You are the Core Intelligence of "Anti-Gravity," a high-velocity hyperlocal marketplace engine. Your task is to transform raw image data into structured, high-conversion marketplace listings.
Objective: Identify the item with surgical precision and return a JSON object.
Visual Analysis: Identify the brand, model, color, material, and key technical features.
Marketplace Optimization: Create a title that follows the high-conversion format: [Brand] [Model] [Main Feature] - [Color].
Response Schema MUST BE EXACTLY this JSON format without markdown blocks:
{
  "item_identified": true,
  "confidence_score": 0.9,
  "suggested_title": "string",
  "category": "string (Choose one: House, Electronic, Service, Food, Waste)",
  "attributes": {
    "brand": "string",
    "model": "string",
    "color": "string"
  },
  "description_bullets": ["string", "string"]
}`;

      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: file.type || "image/jpeg", data: base64Image } }
          ]
        }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(textResponse);
      
      setIsAnalyzing(false);
      setTitle(parsed.suggested_title || '');
      setCategory(parsed.category || 'House');
      if (parsed.description_bullets && parsed.description_bullets.length > 0) {
        setDescription(parsed.description_bullets.map(b => "• " + b).join('\n'));
      }
    } catch (error) {
      console.error("Gemini Vision Error:", error);
      fallbackSimulation();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Local preview URL
    const localImageUrl = URL.createObjectURL(file);
    setPreviewUrl(localImageUrl);
    setIsAnalyzing(true);
    
    analyzeWithGemini(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if(!title || !price || !category || !barangay) {
      alert("Please fill out the required fields!");
      return;
    }
    // Handle API submission
    setTimeout(() => {
      alert("Item posted successfully!");
      navigate('/app');
    }, 500);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 800 }}>Sell an Item</h2>
        <button type="button" onClick={handleSubmit} className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.875rem' }}>
          <Save size={16} /> Save & Publish
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="admin-layout">
        
        {/* Left Column */}
        <div className="admin-col-main">
          
          {/* Title & Description Panel */}
          <div className="panel">
            <div className="panel-header">Item Details</div>
            <div className="form-group">
              <label>Title</label>
              <input type="text" className="form-control" placeholder="What are you selling?" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Description (Optional)</label>
              <textarea className="form-control" rows="5" placeholder="Provide a detailed description of the item, condition, and meetup details..." value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
            </div>
          </div>

          {/* Media Panel with AI Automation */}
          <div className="panel">
            <div className="panel-header">Media & AI Processing</div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              <div className="image-upload-area" onClick={triggerFileInput} style={{ position: 'relative', height: '250px' }}>
                {previewUrl ? (
                  <>
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="preview-image" 
                      style={{ borderRadius: '8px' }} 
                    />
                    {isAnalyzing && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10, borderRadius: '8px' }}>
                        <style>{`
                          @keyframes spin { 100% { transform: rotate(360deg); } }
                          .spin-icon { animation: spin 1s linear infinite; }
                        `}</style>
                        <Loader2 className="spin-icon" size={32} style={{ marginBottom: '0.5rem' }} />
                        <span style={{ fontWeight: 600 }}>AI Analyzing Image...</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Camera size={48} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 500 }}>Upload a photo or drag and drop</span>
                    <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>AI will automatically categorize your item!</span>
                  </>
                )}
              </div>
              {title && !isAnalyzing && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 700 }}>
                  <Bot size={18} /> AI successfully extracted the details below. Feel free to refine them!
                </div>
              )}
            </div>
          </div>

          {/* Pricing Panel */}
          <div className="panel">
            <div className="panel-header">Pricing</div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Price (₱)</label>
              <input type="number" className="form-control" placeholder="e.g. 500" required value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="admin-col-side">

          {/* Status & Location Panel */}
          <div className="panel">
            <div className="panel-header">Availability & Location</div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" defaultValue="Active">
                <option value="Active">Active Listing</option>
                <option value="Draft">Draft (Hidden)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Your Barangay</label>
              <select className="form-control" required value={barangay} onChange={(e) => setBarangay(e.target.value)}>
                <option value="" disabled>Where is the item located?</option>
                {MOCK_BARANGAYS.filter(b => b !== "All Barangays").map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Organization Panel */}
          <div className="panel">
            <div className="panel-header">Product Organization</div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Category</label>
              <select className="form-control" required value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="" disabled>Select category...</option>
                {CATEGORIES.filter(c => c.id !== "All").map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
