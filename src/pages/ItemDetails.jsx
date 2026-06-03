import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, MapPin, Clock, Loader2, AlertCircle } from 'lucide-react';
import { db, doc, getDoc, collection, getDocs } from '../firebase';
import ChatModal from '../components/ChatModal';
import GoogleMap from '../components/GoogleMap';
import { calculateBayesianRating, getTrustLevel } from '../utils/reputation';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [seller, setSeller] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', lineHeight: '1.2', fontWeight: 700, flex: 1 }}>{item.title}</h1>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginLeft: '1rem' }}>
          ₱{(item.price ?? 0).toLocaleString()}
        </div>
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {item.tags.map((tag, index) => (
            <span key={index} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <MapPin size={16} /> {item.barangay}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Clock size={16} /> {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : item.createdAt}
        </span>
      </div>

      <div style={{ marginBottom: '1.5rem', borderRadius: '16px', overflow: 'hidden', height: '200px', border: '1px solid var(--border-color)' }}>
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
          background: 'var(--card-bg)', 
          padding: '1.25rem', 
          borderRadius: '16px', 
          border: '1px solid var(--border-color)', 
          marginBottom: '1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: 'var(--shadow-sm)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', overflow: 'hidden' }}>
          {seller?.photoURL ? <img src={seller.photoURL} alt={seller.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {seller?.displayName || "Anonymous Seller"}
            {(seller?.verified || seller?.isVerified || item.verified) && (
              <span title="Verified Identity" style={{ color: 'var(--primary)', display: 'inline-flex' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: trustLevel.color }}>
            {trustLevel.label}
          </div>
          
          {/* Trust Meter Gauge Overlay */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <div style={{ flex: 1, height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', maxWidth: '100px' }}>
              <div style={{ height: '100%', width: `${(sellerRating / 5) * 100}%`, background: trustLevel.color || 'var(--primary)', borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{((sellerRating / 5) * 100).toFixed(0)}% trust</span>
          </div>

          {/* Dynamic Badges Row */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            {(seller?.verified || seller?.isVerified || item.verified) && (
              <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                🛡️ Verified Identity
              </span>
            )}
            {item.timeMark && (
              <span style={{ fontSize: '0.65rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                📍 Presence Verified
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 900, color: 'var(--accent)', fontSize: '1.1rem' }}>⭐ {sellerRating.toFixed(1)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sellerReviewsCount} reviews</div>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent navigating to profile page
              setIsChatOpen(true);
            }}
            title="Contact Seller"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.background = 'var(--primary)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'var(--primary-light)';
              e.currentTarget.style.color = 'var(--primary)';
            }}
          >
            <MessageCircle size={20} />
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Description</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {item.description}
        </p>
      </div>

      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        item={item} 
      />
    </div>
  );
}
