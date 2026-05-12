import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, MapPin, Clock, Loader2, AlertCircle } from 'lucide-react';
import { db, doc, getDoc } from '../firebase';
import ChatModal from '../components/ChatModal';
import GoogleMap from '../components/GoogleMap';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [seller, setSeller] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
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
        <img src={item.imageUrl} alt={item.title} className="detail-img" />
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
      <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', overflow: 'hidden' }}>
          {seller?.photoURL ? <img src={seller.photoURL} alt={seller.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{seller?.displayName || "Anonymous Seller"}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Seller</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: 'var(--accent)' }}>⭐ 4.5</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credibility Score</div>
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Description</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {item.description}
        </p>
      </div>

      {/* Fixed bottom action area for details page */}
      <div style={{ 
        position: 'fixed', 
        bottom: '70px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: '100%', 
        maxWidth: '600px', 
        padding: '1rem',
        background: 'var(--bg-color)',
        borderTop: '1px solid var(--border-color)',
        zIndex: 40
      }}>
        <button className="btn btn-primary" onClick={() => setIsChatOpen(true)}>
          <MessageCircle size={20} /> Contact Seller
        </button>
      </div>

      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        item={item} 
      />
    </div>
  );
}
