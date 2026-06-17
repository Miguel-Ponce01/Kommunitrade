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
  const queryParams = new URLSearchParams(location.search);
  const uidParam = queryParams.get('uid');
  const { currentUser } = useAuth();
  const targetUid = uidParam || (currentUser ? currentUser.uid : null);
  const isOwnProfile = !uidParam || (currentUser && uidParam === currentUser.uid);

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
  
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedListingForTransaction, setSelectedListingForTransaction] = useState(null);
  const [transactionData, setTransactionData] = useState({
    price: '',
    paymentMethod: 'Cash on Meetup',
    buyerName: '',
    meetupLocation: ''
  });

  const [completedTxCount, setCompletedTxCount] = useState(0);
  const [totalValueSaved, setTotalValueSaved] = useState(0);
  const [trustLogs, setTrustLogs] = useState([]);

  useEffect(() => {
    if (!currentUser || !isOwnProfile) return;
    
    // Subscribe to trust logs
    const qLogs = query(
      collection(db, 'trust_logs'),
      where('userId', '==', currentUser.uid)
    );
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleString() : new Date().toLocaleString()
        };
      });
      // Sort descending
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setTrustLogs(logs);
    });

    // Subscribe to completed transactions
    // 1. Seller completed
    const qSellerCompleted = query(
      collection(db, 'transactions'),
      where('sellerId', '==', currentUser.uid),
      where('status', '==', 'Completed')
    );
    // 2. Buyer completed
    const qBuyerCompleted = query(
      collection(db, 'transactions'),
      where('buyerId', '==', currentUser.uid),
      where('status', '==', 'Completed')
    );

    const unsubSellerCompleted = onSnapshot(qSellerCompleted, (snapshot) => {
      const sellerCount = snapshot.docs.length;
      let sellerSaved = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.payment_method === 'Barter') {
          sellerSaved += parseFloat(data.agreed_price || 0);
        } else {
          sellerSaved += parseFloat(data.agreed_price || 0) * 0.40;
        }
      });

      // Fetch buyer completed
      const unsubBuyerCompleted = onSnapshot(qBuyerCompleted, (buyerSnapshot) => {
        const buyerCount = buyerSnapshot.docs.length;
        let buyerSaved = 0;
        buyerSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.payment_method === 'Barter') {
            buyerSaved += parseFloat(data.agreed_price || 0);
          } else {
            buyerSaved += parseFloat(data.agreed_price || 0) * 0.40;
          }
        });

        setCompletedTxCount(sellerCount + buyerCount);
        setTotalValueSaved(sellerSaved + buyerSaved);
      });

      return () => unsubBuyerCompleted();
    });

    return () => {
      unsubLogs();
      unsubSellerCompleted();
    };
  }, [currentUser, isOwnProfile]);



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
      const bPin = Math.floor(100000 + Math.random() * 900000).toString();
      const sPin = Math.floor(100000 + Math.random() * 900000).toString();

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
        listingId: selectedListingForTransaction.id,
        buyerPin: bPin,
        sellerPin: sPin
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
              <h2 className="heading-xl" style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                {displayName}
                {(profileData?.verified || profileData?.isVerified) && (
                  <Star size={20} fill="#F59E0B" color="#F59E0B" style={{ flexShrink: 0 }} title="Verified Trader (Guaranteed 100 Baseline)" />
                )}
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
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isOwnProfile ? (
              <>
                <button 
                  className="button-primary-pill" 
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {isEditing ? 'SAVE CHANGES' : t('prof_edit')}
                </button>
                <button 
                  className="button-secondary-pill" 
                  onClick={handleShare}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Share2 size={18} /> SHARE
                </button>
              </>
            ) : (
              <>
                <button 
                  className="button-primary-pill" 
                  onClick={() => {
                    alert("To start a secure chat, please click on one of the seller's active listings below and click 'Contact Seller'.");
                  }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <MessageCircle size={18} /> MESSAGE SELLER
                </button>
                <button 
                  className="button-secondary-pill" 
                  onClick={handleShare}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Share2 size={18} /> SHARE PROFILE
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column: About & Content */}
        <div className="profile-main-content" style={{ paddingTop: '1.5rem' }}>
          
          {/* Tabs for Inventory / Security / Ledger */}
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
                marginRight: '2rem',
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
            <button 
              className={`tab-item ${activeTab === 'ledger' ? 'active' : ''}`} 
              onClick={() => setActiveTab('ledger')}
              style={{ 
                padding: '1rem 0', 
                background: 'none', 
                border: 'none',
                borderBottom: activeTab === 'ledger' ? '3px solid var(--text-main)' : '3px solid transparent',
                fontWeight: 700,
                cursor: 'pointer',
                color: activeTab === 'ledger' ? 'var(--text-main)' : 'var(--text-muted)'
              }}
            >
              Impact Ledger
            </button>
          </div>

          {activeTab === 'inventory' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 className="heading-md" style={{ margin: 0 }}>{t('prof_active_listings')}</h2>
                {isOwnProfile && (
                  <button 
                    className="button-primary-pill" 
                    onClick={() => navigate('/app/post')}
                    style={{ width: 'auto', padding: '0.5rem 1rem' }}
                  >
                    <Plus size={16} /> {t('prof_list_new')}
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
                      className="button-primary-pill" 
                      onClick={() => navigate('/app/post')}
                      style={{ width: 'auto' }}
                    >
                      <Plus size={18} /> {t('prof_list_new')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="listing-grid-profile">
                  {myListings.map(item => (
                    <div key={item.id} style={{ position: 'relative' }}>
                      <ItemCard item={item} onClick={() => navigate(`/app/item/${item.id}`)} />
                      {isOwnProfile && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.4rem', zIndex: 10 }}>
                          <button title="Mark as Sold" className="button-outline-on-light" onClick={(e) => handleMarkAsSold(e, item)} style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={16} /></button>
                          <button className="button-outline-on-light" onClick={(e) => { e.stopPropagation(); navigate(`/app/edit-item/${item.id}`); }} style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={16} /></button>
                          <button className="button-outline-on-light" onClick={(e) => handleDelete(e, item.id)} style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><Trash2 size={16} /></button>
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
              <div style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Security Dashboard</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'left' }}>Active security protocols and identity verification metrics.</p>
                <div style={{ display: 'grid', gap: '1rem' }}>
                   {[
                    { event: 'E2EE Encryption Active', status: 'Optimal', icon: <ShieldCheck size={18} /> },
                    { event: 'Identity Verification', status: (profileData?.verified || profileData?.isVerified) ? 'Verified' : 'Unverified', icon: <Fingerprint size={18} /> },
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

              {/* Trust Score History Logs Audit Trail */}
              <div style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'left' }}>Trust Rating Audit Trail</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'left' }}>Transparent audit log of your Trust Score adjustments. Governed by community rules.</p>
                
                {trustLogs.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No trust adjustments recorded yet. Maintain honest trade practices to preserve your score!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1.5rem', marginLeft: '0.5rem' }}>
                    {trustLogs.map((log) => {
                      const isPositive = log.change > 0;
                      return (
                        <div key={log.id} style={{ position: 'relative', textAlign: 'left' }}>
                          {/* Timeline Dot */}
                          <div style={{
                            position: 'absolute',
                            left: 'calc(-1.5rem - 7px)',
                            top: '4px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: isPositive ? '#10b981' : '#ef4444',
                            border: '2px solid var(--card-bg)',
                            boxShadow: '0 0 0 4px var(--border-color)'
                          }} />
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{log.event}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {log.ruleApplied || 'General'}
                                </span>
                              </div>
                              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.reason}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 900, fontSize: '1.1rem', color: isPositive ? '#10b981' : '#ef4444' }}>
                                {isPositive ? `+${log.change}` : log.change}%
                              </span>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{log.timestamp}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Stat Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                
                <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                  <div style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trades Completed</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: 'var(--text-main)' }}>{completedTxCount}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified local meetup exchanges</div>
                </div>

                <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                  <div style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approximate Value Saved</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: 'var(--primary)' }}>₱{totalValueSaved.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saved by bartering or buying pre-owned</div>
                </div>

                <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                  <div style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>CO2 Offset</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#059669' }}>{completedTxCount * 12} kg</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saved by trading pre-manufactured goods</div>
                </div>

                <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                  <div style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Landfill Diversion</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#059669' }}>{completedTxCount * 5} kg</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total weight of items kept in circulation</div>
                </div>

              </div>

              {/* Detail Ledger Information Box */}
              <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 850, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🛡️ How Your Ledger is Calculated
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <p>
                    <strong>Local Cash Savings</strong>: Calculated by adding 100% of the agreed value for Barter deals (zero cash spent) and assuming a baseline 40% value discount for Cash/GCash trades compared to purchasing equivalent brand-new retail goods.
                  </p>
                  <p>
                    <strong>CO2 & Landfill Offsets</strong>: Every traded and reused item diverts roughly 5kg of solid waste from city landfills and saves 12kg of greenhouse gas emissions by eliminating the need to manufacture, package, and transport new products.
                  </p>
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
