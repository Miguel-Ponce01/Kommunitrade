import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, MapPin, Clock } from 'lucide-react';
import { MOCK_LISTINGS } from '../data/mockData';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const item = MOCK_LISTINGS.find(l => l.id === id);

  if (!item) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Item not found</div>;
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
          <Clock size={16} /> {item.createdAt}
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
        <button className="btn btn-primary" onClick={() => alert("Opening anonymous chat...")}>
          <MessageCircle size={20} /> Contact Seller
        </button>
      </div>
    </div>
  );
}
