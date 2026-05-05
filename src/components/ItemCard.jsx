import { useState, memo } from 'react';
import { MapPin, Heart, CheckCircle2, Clock, Timer } from 'lucide-react';
import { getExpiryLabel } from '../utils/geo';

const ItemCard = memo(({ item, onClick }) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <div className="item-card" onClick={() => onClick(item.id)}>
      <div className="item-img-wrap">
        {item.condition && (
          <div className={`item-badge-top-left ${item.condition === 'New' ? 'badge-new' : item.condition === 'Like New' ? 'badge-like-new' : ''}`}>
            {item.condition}
          </div>
        )}
        <button 
          className={`item-wishlist-btn ${isSaved ? 'active' : ''}`}
          onClick={handleSave}
          aria-label="Save to wishlist"
        >
          <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
        </button>
        <img 
          src={item.imageUrl} 
          alt={item.title} 
          className="item-img" 
          loading="lazy" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=300';
          }}
        />
      </div>
      <div className="item-info">
        <h3 className="item-title">{item.title}</h3>
        <span className="item-location">
          <MapPin size={12} /> {item.barangay}
          {item.verified && (
            <span className="verified-badge" title="Verified Seller">
              <CheckCircle2 size={12} />
            </span>
          )}
        </span>
        <div className="item-card-footer">
          <div className="item-price">₱{item.price.toLocaleString()}</div>
          {item.createdAt && (
            <span className="item-time">
              <Clock size={10} /> {item.createdAt}
            </span>
          )}
        </div>
        {/* TTL Expiry Badge — visible proof of Time-to-Live mechanism */}
        {getExpiryLabel(item.expiresAt) && (
          <div className="item-expiry-badge" style={{
            marginTop: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: getExpiryLabel(item.expiresAt) === 'Expires today' || getExpiryLabel(item.expiresAt) === 'Expires tomorrow' ? '#ef4444' : '#f59e0b',
          }}>
            <Timer size={10} />
            {getExpiryLabel(item.expiresAt)}
          </div>
        )}
      </div>
    </div>
  );
});

export default ItemCard;
