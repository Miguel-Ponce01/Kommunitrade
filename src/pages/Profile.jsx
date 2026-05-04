import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Settings, 
  Edit3, 
  Trash2, 
  ShieldCheck,
  Plus,
  Fingerprint,
  BarChart3,
  History,
  Share2,
  Loader2,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'listings'),
      where('sellerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMyListings(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this listing?")) return;
    
    try {
      await deleteDoc(doc(db, 'listings', id));
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Failed to delete item.");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'KomuniTrade Profile',
      text: `Check out ${anonymousName}'s shop on KomuniTrade!`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Profile link copied to clipboard!");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const anonymousName = currentUser ? `Agent_${currentUser.uid.substring(0, 6).toUpperCase()}` : "Guest_User";

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '100px' }}>
      
      {/* ── High-Contrast Banner ────────────────────────────────────────── */}
      <div className="profile-banner">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1500" 
          alt="Abstract Dark Banner" 
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
      </div>

      {/* ── Professional Glass Header ────────────────────────────────────────── */}
      <div className="profile-header-wrap">
        <div className="profile-info-card">
          <div className="profile-avatar-large">
            <Fingerprint size={70} strokeWidth={1} />
          </div>
          
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#fff' }}>
                {anonymousName}
              </h1>
              <div style={{ background: 'var(--primary)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> VERIFIED
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 600 }}>Trust Score: <span style={{ color: '#fff' }}>98%</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MapPin size={18} />
                <span>Davao City, PH</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
            <button className="glass" onClick={handleShare} style={{ width: '54px', height: '54px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Share2 size={22} color="#fff" />
            </button>
            <button className="glass" onClick={() => navigate('/app/settings')} style={{ width: '54px', height: '54px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Settings size={22} color="#fff" />
            </button>
            <button className="btn-primary" onClick={() => alert("Edit Profile Coming Soon!")} style={{ padding: '0 2rem', borderRadius: '18px', height: '54px', fontWeight: 800, fontSize: '0.95rem', background: '#fff', border: 'none', color: '#111', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout ────────────────────────────────────────────────── */}
      <div style={{ padding: '0 3rem' }}>
        
        {/* Modern Tab System */}
        <div className="tab-nav">
          <button className={`tab-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            Inventory
          </button>
          <button className={`tab-item ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
            Insights
          </button>
          <button className={`tab-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            Security
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Active Listings</h2>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/app/post')}
                style={{ background: '#ef4444', padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)' }}
              >
                <Plus size={20} /> List New Item
              </button>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
              </div>
            ) : myListings.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '6rem 2rem', 
                background: 'var(--card-bg)',
                borderRadius: '32px', 
                border: '2px dashed var(--border-color)',
                color: 'var(--text-muted)'
              }}>
                <div style={{ opacity: 0.3, marginBottom: '1.5rem' }}><Package size={64} strokeWidth={1} /></div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No active listings</h3>
                <p style={{ maxWidth: '300px', margin: '0 auto', lineHeight: 1.6 }}>Your inventory is currently empty. Start selling to your neighborhood!</p>
              </div>
            ) : (
              <div className="masonry-grid">
                {myListings.map(item => (
                  <div key={item.id} style={{ position: 'relative' }} className="animate-fade-in">
                    <ItemCard item={item} onClick={() => navigate(`/app/item/${item.id}`)} />
                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                      <button className="glass" style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                        <Edit3 size={16} />
                      </button>
                      <button 
                        className="glass" 
                        onClick={(e) => handleDelete(e, item.id)}
                        style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ... (Insights and Security sections remain but with improved spacing) */}
        {activeTab === 'insights' && (
          <div className="animate-fade-in">
            <div className="stat-grid">
              <div className="stat-card">
                <span className="stat-label">Total Views</span>
                <div className="stat-value">1,284</div>
              </div>
              <div className="stat-card">
                <span className="stat-label">Reach Index</span>
                <div className="stat-value">85%</div>
              </div>
              <div className="stat-card">
                <span className="stat-label">Response Time</span>
                <div className="stat-value">14m</div>
              </div>
              <div className="stat-card" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' }}>
                <span className="stat-label" style={{ color: '#047857' }}>Trust Status</span>
                <div className="stat-value" style={{ color: '#059669' }}>High</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="animate-fade-in">
             <div className="glass-card" style={{ padding: '2rem', borderRadius: '24px' }}>
               <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Protocol Verification Logs</h3>
               {[
                  { time: '10:45 AM', event: 'E2EE Symmetric Key Rotation', status: 'Success' },
                  { time: '09:12 AM', event: 'TTL Batch Purge Simulation', status: 'Clean' },
                  { time: 'Yesterday', event: 'Anonymous ID Verified', status: 'Secured' }
                ].map((log, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{log.event}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.time}</div>
                    </div>
                    <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem' }}>{log.status}</div>
                  </div>
                ))}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
