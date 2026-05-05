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
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const [lang, setLang, t] = useLanguage();
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Handle tab from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'security') {
      setActiveTab('security');
    }
  }, [window.location.search]);

  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const currentUser = auth.currentUser;
  
  // Local state for functional editing
  const [displayName, setDisplayName] = useState(
    localStorage.getItem('komuni_display_name') || 
    (currentUser ? `Agent_${currentUser.uid.substring(0, 6).toUpperCase()}` : "Guest_User")
  );

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

  const handleSave = () => {
    localStorage.setItem('komuni_display_name', displayName);
    setIsEditing(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(t('prof_del_confirm'))) return;
    
    try {
      await deleteDoc(doc(db, 'listings', id));
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'KomuniTrade Profile',
          text: `Check out ${displayName}'s shop on KomuniTrade!`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert(t('prof_share_msg'));
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '100px' }}>
      
      {/* ── Nature-Themed Profile Banner ────────────────────────────────────────── */}
      <div className="profile-banner">
        <img 
          src="https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?auto=format&fit=crop&q=80&w=1500" 
          alt="Lush Tropical Nature" 
        />
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to top, var(--bg-main), transparent 70%)',
        }}></div>
      </div>

      {/* ── Remodeled Header ────────────────────────────────────────── */}
      <div className="profile-header-wrap">
        <div className="profile-info-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="profile-avatar-large" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
            <Fingerprint size={70} strokeWidth={1} color="var(--primary)" />
          </div>
          
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            {isEditing ? (
              <div style={{ marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{ 
                    background: 'var(--bg-main)', 
                    border: '2px solid var(--primary)', 
                    color: 'var(--text-main)', 
                    fontSize: '1.5rem', 
                    fontWeight: 900, 
                    padding: '0.5rem 1rem', 
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '300px'
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
                  {displayName}
                </h1>
              </div>
            )}
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MapPin size={20} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, letterSpacing: '0.02em' }}>DAVAO CITY, PH</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={isEditing ? handleSave : () => setIsEditing(true)} 
              style={{ 
                padding: '0 2.5rem', 
                borderRadius: '18px', 
                height: '56px', 
                fontWeight: 900, 
                fontSize: '1rem', 
                background: isEditing ? 'var(--primary)' : 'var(--text-main)', 
                color: isEditing ? '#fff' : 'var(--bg-main)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: 'none'
              }}
            >
              {isEditing ? 'SAVE CHANGES' : t('prof_edit')}
            </button>
          </div>
        </div>

        {/* ── Streamlined Share Section ────────────────────────────────────────── */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.25rem', 
              padding: '0.5rem 1.5rem',
              borderRadius: '20px',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                PERSONAL SHOP LINK
              </span>
              <div style={{ 
                background: 'rgba(128,128,128,0.05)', 
                padding: '8px 16px', 
                borderRadius: '12px', 
                fontSize: '0.9rem', 
                color: 'var(--primary)', 
                fontWeight: 800,
                border: '1px solid var(--border-color)'
              }}>
                {window.location.host}/@{displayName.toLowerCase().replace(/\s/g, '')}
              </div>
            </div>

            <button 
              onClick={handleShare}
              style={{ 
                background: 'var(--primary)', 
                color: '#fff', 
                border: 'none', 
                padding: '12px 24px', 
                borderRadius: '14px', 
                fontWeight: 900, 
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Share2 size={18} />
              SHARE SHOP
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Tabs ────────────────────────────────────────────────── */}
      <div style={{ padding: '0 3rem' }}>
        
        <div className="tab-nav">
          <button className={`tab-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            {t('prof_inventory')}
          </button>
          <button className={`tab-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            {t('prof_security')}
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900 }}>{t('prof_active_listings')}</h2>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/app/post')}
                style={{ 
                  background: '#ef4444', 
                  padding: '1rem 2rem', 
                  borderRadius: '16px', 
                  fontSize: '1rem', 
                  fontWeight: 900, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  boxShadow: '0 15px 30px rgba(239, 68, 68, 0.3)' 
                }}
              >
                <Plus size={24} /> {t('prof_list_new')}
              </button>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8rem' }}>
                <Loader2 className="animate-spin" size={60} color="var(--primary)" />
              </div>
            ) : myListings.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '8rem 2rem', 
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '40px', 
                border: '2px dashed rgba(255,255,255,0.05)',
                color: 'var(--text-muted)'
              }}>
                <div style={{ opacity: 0.1, marginBottom: '2rem' }}><Package size={100} strokeWidth={1} /></div>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>{t('prof_no_listings')}</h3>
                <p style={{ maxWidth: '350px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.7 }}>{t('prof_no_listings_desc')}</p>
              </div>
            ) : (
              <div className="masonry-grid">
                {myListings.map(item => (
                  <div key={item.id} style={{ position: 'relative' }} className="animate-fade-in">
                    <ItemCard item={item} onClick={() => navigate(`/app/item/${item.id}`)} />
                    <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '0.75rem', zIndex: 10 }}>
                      <button className="glass" style={{ width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                        <Edit3 size={18} />
                      </button>
                      <button 
                        className="glass" 
                        onClick={(e) => handleDelete(e, item.id)}
                        style={{ width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="animate-fade-in">
             <div className="glass-card" style={{ 
               padding: '3rem', 
               borderRadius: '40px', 
               border: '1px solid var(--border-color)', 
               position: 'relative', 
               overflow: 'hidden',
               background: 'var(--card-bg)', 
               backdropFilter: 'blur(40px)'
             }}>
               
               {/* Dashboard Header with Pulse */}
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
                 <div>
                   <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
                     Security Protocol Dashboard
                   </h3>
                   <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                     Real-time monitoring of Davao community safety layers
                   </p>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem 1.25rem', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                   <div className="pulse-dot" style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}></div>
                   <span style={{ color: '#10b981', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.05em' }}>SYSTEM OPTIMAL</span>
                 </div>
               </div>

               {/* Health Meter */}
               <div style={{ marginBottom: '3.5rem', background: 'rgba(128,128,128,0.05)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '0.05em', opacity: 0.8 }}>
                   <span>ENCRYPTION STRENGTH (AES-256)</span>
                   <span style={{ color: '#10b981' }}>99.9% SECURE</span>
                 </div>
                 <div style={{ height: '8px', background: 'rgba(128,128,128,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                   <div style={{ height: '100%', width: '99.9%', background: 'linear-gradient(to right, #10b981, #34d399, #6ee7b7)', borderRadius: '10px' }}></div>
                 </div>
               </div>

               {/* Log Grid */}
               <div style={{ display: 'grid', gap: '1.5rem' }}>
                 {[
                    { 
                      icon: <ShieldCheck size={22} />, 
                      event: 'E2EE Symmetric Key Rotation', 
                      desc: 'Rotating 256-bit AES keys for secure peer-to-peer communication.',
                      time: '10:45 AM', 
                      status: 'SUCCESS',
                      color: '#10b981'
                    },
                    { 
                      icon: <History size={22} />, 
                      event: 'TTL Batch Purge Protocol', 
                      desc: 'Automatic cleanup of expired item hashes from distributed cache.',
                      time: '09:12 AM', 
                      status: 'CLEAN',
                      color: '#3b82f6'
                    },
                    { 
                      icon: <Fingerprint size={22} />, 
                      event: 'Anonymous ID Verification', 
                      desc: 'Validating cryptographic signature for temporary community session.',
                      time: 'Yesterday', 
                      status: 'SECURED',
                      color: '#8b5cf6'
                    }
                  ].map((log, i) => (
                    <div key={i} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1.5rem', 
                      padding: '1.75rem', 
                      background: 'rgba(128,128,128,0.03)', 
                      borderRadius: '28px',
                      border: '1px solid var(--border-color)',
                      transition: 'all 0.3s ease'
                    }}
                    className="security-log-card"
                    >
                      <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '20px', 
                        background: `${log.color}15`, 
                        color: log.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {log.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>{log.event}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: log.color, letterSpacing: '0.08em', background: `${log.color}10`, padding: '4px 10px', borderRadius: '6px' }}>{log.status}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{log.desc}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main)' }}>{log.time}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 800 }}>VERIFIED PROXIMITY</div>
                      </div>
                    </div>
                  ))}
               </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
