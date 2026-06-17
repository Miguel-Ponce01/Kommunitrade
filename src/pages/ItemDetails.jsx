import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, MapPin, Clock, Loader2, AlertCircle, Shield, X, Star } from 'lucide-react';
import { db, doc, getDoc, collection, getDocs } from '../firebase';
import ChatModal from '../components/ChatModal';
import GoogleMap from '../components/GoogleMap';
import { calculateBayesianRating, getTrustLevel } from '../utils/reputation';
import { useAuth } from '../contexts/AuthContext';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [item, setItem] = useState(null);
  const [seller, setSeller] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showVerifyWarningModal, setShowVerifyWarningModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [sellerRating, setSellerRating] = useState(5.0);
  const [sellerReviewsCount, setSellerReviewsCount] = useState(0);
  const [trustLevel, setTrustLevel] = useState({ label: "Community Member", color: "var(--text-muted)", badgeClass: "regular" });
  
  useEffect(() => {
    async function fetchItem() {
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const itemData = { id: docSnap.id, ...docSnap.data() };
          setItem(itemData);
          
          // Fetch seller info
          const sellerId = itemData.userId || itemData.sellerId;
          if (sellerId) {
            const sellerRef = doc(db, 'users', sellerId);
            const sellerSnap = await getDoc(sellerRef);
            if (sellerSnap.exists()) {
              setSeller(sellerSnap.data());
            }

            // Fetch seller's ratings & calculate Bayesian reputation score
            try {
              const reviewsSnap = await getDocs(collection(db, 'users', sellerId, 'reviews'));
              const reviewsList = reviewsSnap.docs.map(d => d.data());
              const calculated = calculateBayesianRating(reviewsList);
              setSellerRating(calculated);
              setSellerReviewsCount(reviewsList.length);
              setTrustLevel(getTrustLevel(calculated));
            } catch (revErr) {
              console.error("Failed to fetch reviews:", revErr);
            }
          }
        } else {
          setError("Listing not found");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Failed to load item details");
      } finally {
        setIsLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        <p>Fetching listing details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <AlertCircle size={48} color="#ef4444" />
        <h3>{error || "Item not found"}</h3>
        <button className="btn" onClick={() => navigate('/app')} style={{ width: 'auto' }}>Go back home</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <img src={selectedImage || item.imageUrl} alt={item.title} className="detail-img" />
          
          {item.imageUrls && item.imageUrls.length > 1 && (
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              overflowX: 'auto', 
              padding: '0.5rem', 
              background: 'rgba(0,0,0,0.5)', 
              backdropFilter: 'blur(4px)',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10
            }}>
              {item.imageUrls.map((url, index) => (
                <div 
                  key={index} 
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    border: (selectedImage || item.imageUrl) === url ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  onClick={() => setSelectedImage(url)}
                >
                  <img src={url} alt={`Thumb ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <h1 className="heading-xl" style={{ flex: 1, margin: 0 }}>{item.title}</h1>
        <div className="heading-xl" style={{ color: 'var(--text-main)', marginLeft: '1rem', margin: 0 }}>
          ₱{(item.price ?? 0).toLocaleString()}
        </div>
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {item.tags.map((tag, index) => (
            <span key={index} style={{ border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', fontWeight: 550, fontFamily: "'Inter', sans-serif" }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: "'Inter', sans-serif" }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MapPin size={16} /> {item.barangay}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={16} /> {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : item.createdAt}
        </span>
      </div>

      <div style={{ marginBottom: '2rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '240px', border: '1px solid var(--border-color)' }}>
        <GoogleMap 
          center={{ lat: item.lat || 7.0707, lng: item.lng || 125.6092 }}
          radius={0.3} // Privacy circle
          zoom={15}
        />
      </div>

      {/* Seller Section */}
      <div 
        onClick={() => {
          const sellerId = seller?.uid || item.userId || item.sellerId;
          if (sellerId) navigate(`/app/profile?uid=${sellerId}`);
        }}
        style={{ 
          background: 'transparent', 
          padding: '1.25rem 0', 
          borderBottom: '1px solid var(--border-color)', 
          borderTop: '1px solid var(--border-color)', 
          marginBottom: '2rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', overflow: 'hidden', flexShrink: 0 }}>
          {seller?.photoURL ? <img src={seller.photoURL} alt={seller.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: "'Inter', sans-serif" }}>
            {seller?.displayName || "Anonymous Seller"}
            {(seller?.verified || seller?.isVerified || item.verified) && (
              <Star size={16} fill="#F59E0B" color="#F59E0B" style={{ flexShrink: 0 }} title="Verified Trader (Guaranteed 100 Baseline)" />
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', fontFamily: "'Inter', sans-serif" }}>
              ⭐ {sellerRating.toFixed(1)} ({sellerReviewsCount} reviews)
            </div>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', fontFamily: "'Inter', sans-serif" }}>
              {trustLevel.label}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
          <button 
            className="button-outline-on-light"
            onClick={(e) => {
              e.stopPropagation();
              const isVerified = userProfile?.verified || userProfile?.isVerified;
              if (!isVerified) {
                setShowVerifyWarningModal(true);
              } else {
                setIsChatOpen(true);
              }
            }}
            title="Contact Seller"
            style={{ padding: '10px 20px', fontSize: '0.9rem' }}
          >
            <MessageCircle size={18} />
            <span>Message</span>
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h3 className="heading-md" style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Description</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', fontFamily: "'Inter', sans-serif", whiteSpace: 'pre-wrap' }}>
          {item.description}
        </p>
      </div>

      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        item={item} 
      />

      {/* Identity Verification Warning Modal */}
      {showVerifyWarningModal && (
        <div className="location-modal-overlay" onClick={() => setShowVerifyWarningModal(false)} style={{ zIndex: 3000 }}>
          <div className="auth-modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center', padding: '2.5rem 2rem', borderRadius: '24px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ background: '#FEE2E2', color: '#EF4444', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={32} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.75rem', fontFamily: "'Outfit', sans-serif" }}>
              Identity Verification Required
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              To keep our hyperlocal Davao community safe and secure, all buyers must complete identity verification using a Government ID and Selfie before contacting sellers.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={() => {
                  setShowVerifyWarningModal(false);
                  navigate('/app/verification');
                }} 
                className="btn-primary" 
                style={{ width: '100%', padding: '0.85rem 1.5rem', borderRadius: '14px', fontWeight: 700, fontSize: '0.95rem', background: 'var(--primary)', color: 'white', border: 'none' }}
              >
                Verify My Identity
              </button>
              <button 
                onClick={() => setShowVerifyWarningModal(false)} 
                className="btn-secondary" 
                style={{ width: '100%', padding: '0.85rem 1.5rem', borderRadius: '14px', fontWeight: 700, fontSize: '0.95rem' }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
