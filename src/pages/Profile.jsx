import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Package, 
  Settings, 
  Edit3, 
  Trash2, 
  Tag, 
  Fingerprint, 
  TrendingUp, 
  ShieldCheck,
  Plus
} from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Profile() {
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Fetch only listings where the current anonymous user is the seller
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

  // Generate a display name from the UID
  const anonymousName = currentUser ? `Agent_${currentUser.uid.substring(0, 6).toUpperCase()}` : "Guest_User";

  return (
    <div className="animate-fade-in" style={{ padding: '1rem', paddingBottom: '100px' }}>
      
      {/* ── Premium Header ────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ 
        padding: '2rem 1.5rem', 
        borderRadius: '24px', 
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(var(--primary-rgb), 0.2)'
      }}>
        {/* Background Accent */}
        <div style={{ 
          position: 'absolute', 
          top: '-50px', 
          right: '-50px', 
          width: '150px', 
          height: '150px', 
          background: 'var(--primary)', 
          filter: 'blur(80px)', 
          opacity: 0.2,
          zIndex: 0 
        }}></div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div className="animate-float" style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)'
            }}>
              <Fingerprint size={40} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }} className="text-gradient">
                  {anonymousName}
                </h1>
                <div className="anonymous-badge" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                  VERIFIED ANONYMOUS
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <ShieldCheck size={14} />
                <span>ID: {currentUser?.uid.substring(0, 16)}...</span>
              </div>
            </div>
          </div>
          <button className="settings-btn glass" onClick={() => navigate('/app/settings')}>
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* ── Stats Dashboard ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ color: 'var(--primary)' }}><Package size={18} /></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Listings</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{myListings.length}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ color: '#10b981' }}><TrendingUp size={18} /></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Shop Impact</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>Local</div>
        </div>
      </div>

      {/* ── My Shop Section ──────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>My Shop Inventory</h2>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/app/post')}
            style={{ padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> List New Item
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading your shop...
          </div>
        ) : myListings.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '24px', border: '1px dashed var(--border-color)' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}><Package size={48} strokeWidth={1} /></div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Your shop is empty</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Start selling to your community today!</p>
          </div>
        ) : (
          <div className="masonry-grid">
            {myListings.map(item => (
              <div key={item.id} style={{ position: 'relative' }} className="animate-fade-in">
                <ItemCard item={item} onClick={() => navigate(`/app/item/${item.id}`)} />
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '0.4rem', zIndex: 10 }}>
                  <button className="glass" style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <Edit3 size={16} />
                  </button>
                  <button className="glass" style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
