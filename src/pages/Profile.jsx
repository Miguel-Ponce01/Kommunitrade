import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Shield,
  MessageCircle
} from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { db, auth, collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from '../firebase';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { encodeGeohash, resolveBarangayFromGeohash } from '../utils/geo';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Handle tab from URL query params (reactive via useLocation)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'security') {
      setActiveTab('security');
    }
  }, [location.search]);

  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { currentUser } = useAuth();
  
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedListingForTransaction, setSelectedListingForTransaction] = useState(null);
  const [transactionData, setTransactionData] = useState({
    price: '',
    paymentMethod: 'Cash on Meetup',
    buyerName: '',
    meetupLocation: ''
  });

  const queryParams = new URLSearchParams(location.search);
  const uidParam = queryParams.get('uid');
  const targetUid = uidParam || (currentUser ? currentUser.uid : null);
  const isOwnProfile = !uidParam || (currentUser && uidParam === currentUser.uid);

  const [profileData, setProfileData] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Local state for functional editing
  const [displayName, setDisplayName] = useState(
    localStorage.getItem('komuni_display_name') || 
    (currentUser ? `Agent_${currentUser.uid.substring(0, 6).toUpperCase()}` : "Guest_User")
  );
  const [userLocation, setUserLocation] = useState(
    localStorage.getItem('komuni_user_location') || "Davao City"
  );
  const [userBio, setUserBio] = useState(
    localStorage.getItem('komuni_user_bio') || "Passionate community member interested in sustainable trading."
  );
  const [communityStatus, setCommunityStatus] = useState(
    localStorage.getItem('komuni_comm_status') || "Active member of the Davao trading community. Focused on sustainable exchange and supporting local barangays."
  );
  const [tempStatus, setTempStatus] = useState(communityStatus);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem('komuni_profile_image') || null
  );
  const [isGeolocating, setIsGeolocating] = useState(false);
  const fileInputRef = React.useRef(null);

  // Fetch target profile data from Firestore
  useEffect(() => {
    if (!targetUid) return;
    setIsProfileLoading(true);
    const userRef = doc(db, 'users', targetUid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData(data);
        setDisplayName(data.displayName || `Agent_${targetUid.substring(0, 6).toUpperCase()}`);
        setUserLocation(data.barangay || "Davao City");
        setUserBio(data.bio || "Passionate community member interested in sustainable trading.");
        setCommunityStatus(data.communityStatus || "Active member of the Davao trading community. Focused on sustainable exchange and supporting local barangays.");
        setProfileImage(data.photoURL || null);
      }
      setIsProfileLoading(false);
    }, (err) => {
      console.error("Failed to load profile:", err);
      setIsProfileLoading(false);
    });
    return () => unsubscribe();
  }, [targetUid]);

  // Fetch listings for the target user
  useEffect(() => {
    if (!targetUid) return;

    const q = query(
      collection(db, 'listings'),
      where('sellerId', '==', targetUid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(item => !item.isSold); // Hide sold items from active inventory
      setMyListings(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [targetUid]);

  const handleSave = async () => {
    if (!isOwnProfile || !currentUser) return;

    localStorage.setItem('komuni_display_name', displayName);
    localStorage.setItem('komuni_user_location', userLocation);
    localStorage.setItem('komuni_user_bio', userBio);
    localStorage.setItem('komuni_comm_status', communityStatus);
    if (profileImage) localStorage.setItem('komuni_profile_image', profileImage);
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName,
        barangay: userLocation,
        bio: userBio,
        communityStatus,
        photoURL: profileImage
      });
    } catch (err) {
      console.error("Failed to update profile in Firestore:", err);
    }

    setIsEditing(false);
  };

  const handleStatusSave = async () => {
    setCommunityStatus(tempStatus);
    localStorage.setItem('komuni_comm_status', tempStatus);

    if (isOwnProfile && currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          communityStatus: tempStatus
        });
      } catch (err) {
        console.error("Failed to update status in Firestore:", err);
      }
    }

    setIsEditingStatus(false);
  };

  const handleStatusCancel = () => {
    setTempStatus(communityStatus);
    setIsEditingStatus(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const gh = encodeGeohash(latitude, longitude);
        const brgy = resolveBarangayFromGeohash(gh);
        setUserLocation(brgy);
        setIsGeolocating(false);
      },
      () => setIsGeolocating(false),
      { timeout: 8000 }
    );
  };

  const handleMarkAsSold = (e, item) => {
    e.stopPropagation();
    setSelectedListingForTransaction(item);
    setTransactionData({
      price: item.price || '',
      paymentMethod: 'Cash on Meetup',
      buyerName: '',
      meetupLocation: item.barangay || ''
    });
    setShowTransactionModal(true);
  };

  const submitTransaction = async (e) => {
    e.preventDefault();
    if (!selectedListingForTransaction || !currentUser) return;

    try {
      // 1. Create transaction record
      await addDoc(collection(db, 'transactions'), {
        reference_number: `TRX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'Completed',
        item_name: selectedListingForTransaction.title,
        item_condition: selectedListingForTransaction.condition || 'Used',
        agreed_price: parseFloat(transactionData.price) || 0,
        payment_method: transactionData.paymentMethod,
        seller_masked_name: displayName,
        sellerId: currentUser.uid,
        buyer_name: transactionData.buyerName || 'Guest User',
        meetup_location: transactionData.meetupLocation,
        meetup_date: new Date().toLocaleDateString(),
        meetup_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agreement_summary: `Transaction completed. Both buyer and seller agreed to the purchase of ${selectedListingForTransaction.title} worth ₱${transactionData.price}.`,
        created_at: serverTimestamp(),
        listingId: selectedListingForTransaction.id
      });

      // 2. Mark listing as sold
      const listingRef = doc(db, 'listings', selectedListingForTransaction.id);
      await updateDoc(listingRef, { isSold: true });

      alert("Transaction recorded successfully!");
      setShowTransactionModal(false);
      setSelectedListingForTransaction(null);
    } catch (error) {
      console.error("Error recording transaction:", error);
      alert("Failed to record transaction.");
    }
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
    <div className="animate-fade-in profile-premium-bg" style={{ paddingBottom: '100px', minHeight: '100vh' }}>
      
      {/* Premium Cover Banner */}
      <div className="profile-cover-banner">
        <div className="profile-cover-gradient"></div>
        <div className="profile-cover-pattern"></div>
      </div>

      <div className="profile-container-redesign animate-slide-up">
        
        {/* Left Column: Profile Card */}
        <div className="profile-sidebar-card">
          <div className="profile-avatar-circle" style={{ position: 'relative', overflow: 'hidden' }}>
             {profileImage ? (
               <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             ) : (
               <Fingerprint size={80} strokeWidth={1} color="var(--primary)" />
             )}
             
             {isEditing && (
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 style={{
                   position: 'absolute',
                   inset: 0,
                   background: 'rgba(0,0,0,0.65)',
                   backdropFilter: 'blur(4px)',
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   justifyContent: 'center',
                   color: '#FFF',
                   fontSize: '0.7rem',
                   fontWeight: 800,
                   cursor: 'pointer',
                   transition: 'all 0.3s'
                 }}
               >
                 <Edit3 size={20} style={{ marginBottom: '4px' }} />
                 {t('prof_change_photo')}
               </div>
             )}
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleImageChange} 
               accept="image/*" 
               hidden 
             />
          </div>
          
          {isEditing ? (
            <div style={{ marginBottom: '1rem', width: '100%' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textAlign: 'left' }}>
                {t('prof_name_label')}
              </label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="premium-input"
                style={{ textAlign: 'center' }}
              />
              
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', margin: '1rem 0 4px', textAlign: 'left' }}>
                {t('prof_bio')}
              </label>
              <textarea 
                value={userBio}
                onChange={(e) => setUserBio(e.target.value)}
                placeholder={t('prof_bio_placeholder')}
                className="premium-input"
                style={{ 
                  height: '100px', 
                  resize: 'none', 
                  fontSize: '0.85rem',
                  padding: '12px'
                }}
              />
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem', fontFamily: "'Outfit', sans-serif" }}>
                {displayName}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                {userBio}
              </p>
            </>
          )}

          {/* Premium Stats Grid */}
          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <div className="profile-stat-icon-wrapper">
                <Package size={16} />
              </div>
              <span className="profile-stat-num">{myListings.length}</span>
              <span className="profile-stat-lbl">Listings</span>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-icon-wrapper">
                <Star size={16} />
              </div>
              <span className="profile-stat-num">4.9</span>
              <span className="profile-stat-lbl">Rating</span>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-icon-wrapper">
                <History size={16} />
              </div>
              <span className="profile-stat-num">1</span>
              <span className="profile-stat-lbl">Year</span>
            </div>
          </div>

          {(profileData?.verified || profileData?.isVerified) ? (
            <div className="verified-badge-pill">
              <CheckCircle2 size={16} color="#10B981" />
              Identity verified
            </div>
          ) : (
            <div className="verified-badge-pill unverified">
              <Shield size={16} />
              Unverified Seller
            </div>
          )}

          {/* Meta Details List */}
          <div className="profile-meta-list">
            <div className="profile-meta-row-item">
              <Languages className="profile-meta-icon" size={16} />
              <span>Speaks English and Tagalog</span>
            </div>
            <div className="profile-meta-row-item">
              <MapPin className="profile-meta-icon" size={16} />
              {isEditing && isOwnProfile ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                  <input 
                    type="text" 
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    className="premium-input-small"
                    style={{ flex: 1, padding: '4px 8px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                  />
                  <button 
                    onClick={detectLocation}
                    disabled={isGeolocating}
                    className="detect-loc-btn"
                    style={{ background: 'var(--primary-light)', border: 'none', color: 'var(--primary)', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    {isGeolocating ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
                  </button>
                </div>
              ) : (
                <span>Lives in {userLocation}, PH</span>
              )}
            </div>
          </div>

          {/* Community Contribution Box */}
          <div className="community-contribution-card">
            <div className="contribution-header">
              <span>Community Contribution</span>
              <Shield size={12} color="var(--primary)" />
            </div>
            {isEditingStatus && isOwnProfile ? (
              <div className="status-editor">
                <textarea 
                  value={tempStatus}
                  onChange={(e) => setTempStatus(e.target.value)}
                  className="premium-textarea"
                  style={{ width: '100%', height: '60px', resize: 'none', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
                  placeholder="Share your community involvement..."
                />
                <div className="status-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={handleStatusSave} className="btn-save-small" style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>CONFIRM</button>
                  <button onClick={handleStatusCancel} className="btn-cancel-small" style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>CANCEL</button>
                </div>
              </div>
            ) : (
              <div className="status-display" onClick={() => isOwnProfile && setIsEditingStatus(true)} style={{ cursor: isOwnProfile ? 'pointer' : 'default', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                 <p className="contribution-quote">{communityStatus}</p>
                 {isOwnProfile && <Edit3 size={14} className="status-edit-icon" style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isOwnProfile ? (
              <>
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
              </>
            ) : (
              <>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    alert("To start a secure chat, please click on one of the seller's active listings below and click 'Contact Seller'.");
                  }}
                  style={{ width: '100%', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <MessageCircle size={18} /> MESSAGE SELLER
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={handleShare}
                  style={{ width: '100%', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Share2 size={18} /> SHARE PROFILE
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column: About & Content */}
        <div className="profile-main-content" style={{ paddingTop: '1.5rem' }}>
          
          {/* Tabs for Inventory / Security */}
          <div className="tab-nav" style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', display: isOwnProfile ? 'flex' : 'none' }}>
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
                {isOwnProfile && (
                  <button 
                    className="btn-primary" 
                    onClick={() => navigate('/app/post')}
                    style={{ borderRadius: '12px', padding: '0.6rem 1.2rem', width: 'auto' }}
                  >
                    <Plus size={20} /> {t('prof_list_new')}
                  </button>
                )}
              </div>

              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                  <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                </div>
              ) : myListings.length === 0 ? (
                <div className="premium-empty-state">
                  <div className="empty-state-glowing-icon">
                    <Package size={36} />
                  </div>
                  <h3 className="empty-state-title">{t('prof_no_listings')}</h3>
                  <p className="empty-state-desc">{t('prof_no_listings_desc')}</p>
                  {isOwnProfile && (
                    <button 
                      className="btn-primary" 
                      onClick={() => navigate('/app/post')}
                      style={{ width: 'auto', padding: '0.85rem 2rem', borderRadius: '14px', fontSize: '0.95rem' }}
                    >
                      <Plus size={20} /> {t('prof_list_new')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="listing-grid-profile">
                  {myListings.map(item => (
                    <div key={item.id} style={{ position: 'relative' }}>
                      <ItemCard item={item} onClick={() => navigate(`/app/item/${item.id}`)} />
                      {isOwnProfile && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                          <button title="Mark as Sold" className="glass" onClick={(e) => handleMarkAsSold(e, item)} style={{ width: '36px', height: '36px', borderRadius: '10px', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={16} /></button>
                          <button className="glass" onClick={(e) => { e.stopPropagation(); navigate(`/app/edit-item/${item.id}`); }} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={16} /></button>
                          <button className="glass" onClick={(e) => handleDelete(e, item.id)} style={{ width: '36px', height: '36px', borderRadius: '10px', color: '#ef4444', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                        </div>
                      )}
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

      {showTransactionModal && selectedListingForTransaction && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="panel animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 color="var(--primary)" /> Record Transaction
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Mark <strong>{selectedListingForTransaction.title}</strong> as sold.</p>
            
            <form onSubmit={submitTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Final Agreed Price (₱)</label>
                <input type="number" className="premium-input" required value={transactionData.price} onChange={(e) => setTransactionData({...transactionData, price: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Payment Method</label>
                <select className="premium-input premium-select" required value={transactionData.paymentMethod} onChange={(e) => setTransactionData({...transactionData, paymentMethod: e.target.value})}>
                  <option value="Cash on Meetup">Cash on Meetup</option>
                  <option value="GCash">GCash</option>
                  <option value="Maya">Maya</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Buyer Name / Alias</label>
                <input type="text" className="premium-input" placeholder="e.g. Alex from FB" required value={transactionData.buyerName} onChange={(e) => setTransactionData({...transactionData, buyerName: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Meetup Location</label>
                <input type="text" className="premium-input" required value={transactionData.meetupLocation} onChange={(e) => setTransactionData({...transactionData, meetupLocation: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowTransactionModal(false)} className="btn-secondary" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}>Confirm Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
