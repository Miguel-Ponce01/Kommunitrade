import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, MapPin, Clock, Loader2, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ChatModal from '../components/ChatModal';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  useEffect(() => {
    async function fetchItem() {
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() });
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
          ₱{item.price.toLocaleString()}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <MapPin size={16} /> {item.barangay}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Clock size={16} /> {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : item.createdAt}
        </span>
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
