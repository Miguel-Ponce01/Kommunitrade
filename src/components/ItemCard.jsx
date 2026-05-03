import { useState } from 'react';
import { MapPin, Heart, CheckCircle2 } from 'lucide-react';

export default function ItemCard({ item, onClick }) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.stopPropagation(); // Prevent card click
    setIsSaved(!isSaved);
  };

  return (
    <div className="item-card" onClick={() => onClick(item.id)}>
      <div className="item-img-wrap">
        {item.condition && (
          <div className="item-badge-top-left">{item.condition}</div>
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
        <div className="item-price">₱{item.price.toLocaleString()}</div>
      </div>
    </div>
  );
}
