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
  MapPin,
  Languages,
  Briefcase,
  Star,
  Shield
} from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { db, auth, collection, query, where, onSnapshot, doc, deleteDoc } from '../firebase';
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
    <div className="animate-fade-in" style={{ paddingBottom: '100px', background: 'var(--bg-color)', minHeight: '100vh' }}>
      
      <div className="profile-container-redesign">
        
        {/* Left Column: Profile Card */}
        <div className="profile-sidebar-card">
          <div className="profile-avatar-circle">
             <Fingerprint size={80} strokeWidth={1} color="var(--primary)" />
          </div>
          
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
                  fontSize: '1.2rem', 
                  fontWeight: 800, 
                  padding: '0.5rem', 
                  borderRadius: '8px',
                  width: '100%',
                  textAlign: 'center'
                }}
              />
            </div>
          ) : (
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem' }}>{displayName}</h2>
          )}
          
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
             <Shield size={14} color="var(--primary)" /> {t('trust_badge')}
          </p>

          <div className="profile-stats-row">
            <div className="profile-stat-item">
              <span className="stat-num">{myListings.length}</span>
              <span className="stat-label-small">Listings</span>
            </div>
            <div className="profile-stat-item">
              <span className="stat-num">4.9</span>
              <span className="stat-label-small">Rating</span>
            </div>
            <div className="profile-stat-item">
              <span className="stat-num">1</span>
              <span className="stat-label-small">Year</span>
            </div>
          </div>

          <div className="verified-badge-pill">
            <CheckCircle2 size={18} color="var(--primary)" />
            Identity verified
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              className="btn-primary" 
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              style={{ width: '100%', borderRadius: '12px' }}
            >
              {isEditing ? 'SAVE CHANGES' : t('prof_edit')}
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleShare}
              style={{ width: '100%', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Share2 size={18} /> SHARE
            </button>
          </div>
        </div>

        {/* Right Column: About & Content */}
        <div className="profile-main-content">
          
          <div className="about-section">
            <h1 style={{ marginBottom: '1.5rem' }}>About {displayName}</h1>
            
            <div className="info-grid">
              <div className="info-item">
                <Briefcase className="info-icon" />
                <span>My work: Trading Expert</span>
              </div>
              <div className="info-item">
                <Languages className="info-icon" />
                <span>Speaks English and Tagalog</span>
              </div>
              <div className="info-item">
                <MapPin className="info-icon" />
                <span>Lives in Davao City, PH</span>
              </div>
            </div>

            <p className="bio-text">
              Active member of the Davao trading community. Focused on sustainable exchange and supporting local barangays. Always looking for fresh produce and tech gadgets to trade.
            </p>
          </div>

          {/* Tabs for Inventory / Security */}
          <div className="tab-nav" style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex' }}>
            <button 
              className={`tab-item ${activeTab === 'inventory' ? 'active' : ''}`} 
              onClick={() => setActiveTab('inventory')}
              style={{ 
                padding: '1rem 0', 
                marginRight: '2rem', 
                background: 'none', 
                border: 'none',
                borderBottom: activeTab === 'inventory' ? '3px solid var(--text-main)' : '3px solid transparent',
                fontWeight: 700,
                cursor: 'pointer',
                color: activeTab === 'inventory' ? 'var(--text-main)' : 'var(--text-muted)'
              }}
            >
              {t('prof_inventory')}
            </button>
            <button 
              className={`tab-item ${activeTab === 'security' ? 'active' : ''}`} 
              onClick={() => setActiveTab('security')}
              style={{ 
                padding: '1rem 0', 
                background: 'none', 
                border: 'none',
                borderBottom: activeTab === 'security' ? '3px solid var(--text-main)' : '3px solid transparent',
                fontWeight: 700,
                cursor: 'pointer',
                color: activeTab === 'security' ? 'var(--text-main)' : 'var(--text-muted)'
              }}
            >
              {t('prof_security')}
            </button>
          </div>

          {activeTab === 'inventory' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('prof_active_listings')}</h2>
                <button 
                  className="btn-primary" 
                  onClick={() => navigate('/app/post')}
                  style={{ borderRadius: '12px', padding: '0.6rem 1.2rem', width: 'auto' }}
                >
                  <Plus size={20} /> {t('prof_list_new')}
                </button>
              </div>

              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                  <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                </div>
              ) : myListings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                  <Package size={60} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <h3>{t('prof_no_listings')}</h3>
                  <p>{t('prof_no_listings_desc')}</p>
                </div>
              ) : (
                <div className="listing-grid-profile">
                  {myListings.map(item => (
                    <div key={item.id} style={{ position: 'relative' }}>
                      <ItemCard item={item} onClick={() => navigate(`/app/item/${item.id}`)} />
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                        <button className="glass" style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={16} /></button>
                        <button className="glass" onClick={(e) => handleDelete(e, item.id)} style={{ width: '36px', height: '36px', borderRadius: '10px', color: '#ef4444', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-fade-in">
              <div style={{ background: 'var(--card-bg)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Security Dashboard</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                   {[
                    { event: 'E2EE Encryption Active', status: 'Optimal', icon: <ShieldCheck size={18} /> },
                    { event: 'Identity Verification', status: 'Verified', icon: <Fingerprint size={18} /> },
                    { event: 'Last Login', status: 'Today', icon: <History size={18} /> }
                   ].map((log, i) => (
                     <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'var(--bg-color)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <div style={{ color: 'var(--primary)', background: 'var(--primary-light)', padding: '8px', borderRadius: '10px' }}>{log.icon}</div>
                         <span style={{ fontWeight: 700 }}>{log.event}</span>
                       </div>
                       <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{log.status}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
