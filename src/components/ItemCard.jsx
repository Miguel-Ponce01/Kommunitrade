import { useState, memo } from 'react';
import { MapPin, Heart, CheckCircle2, Clock, Timer, Calendar } from 'lucide-react';
import { getExpiryLabel } from '../utils/geo';

const formatDate = (dateValue) => {
  if (!dateValue) return "";
  try {
    const d = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return String(dateValue);
  }
};

const formatTime = (dateValue) => {
  if (!dateValue) return "12:00 PM";
  try {
    const d = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(d.getTime())) return "12:00 PM";
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return "12:00 PM";
  }
};

const ItemCard = memo(({ item, onClick }) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <div className="item-card premium-card animate-scale-in" onClick={() => onClick(item.id)}>
      <div className="item-img-wrap placeholder-wrap">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="item-placeholder">
            <span>?</span>
          </div>
        )}
        {item.condition && (
          <div className={`item-badge-top-left ${
            item.condition === 'New' ? 'badge-new' : 
            item.condition === 'Like New' ? 'badge-like-new' : 
            item.condition === 'Good' ? 'badge-good' : 
            item.condition === 'Fair' ? 'badge-fair' : 
            item.condition === 'Poor' ? 'badge-poor' : 
            'badge-used'
          }`}>
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
      </div>

      <div className="item-info">
        <div className="item-header-row">
          <h3 className="item-title-premium">{item.title}</h3>
          <div className="item-price-premium">₱{(item.price ?? 0).toLocaleString()}</div>
        </div>

        <div className="item-meta-row">
          <span className="item-location-premium">
            <MapPin size={14} className="icon-primary" /> {item.barangay}
          </span>
          {item.verified && (
            <span className="verified-badge-premium">
              <CheckCircle2 size={14} />
            </span>
          )}
        </div>

        {/* Expandable description on hover */}
        {item.description && (
          <p className="item-desc-reveal-premium">{item.description}</p>
        )}

        {/* Expandable tags on hover */}
        {item.tags && item.tags.length > 0 && (
          <div className="item-tags-reveal-premium">
            {item.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="item-tag-pill">#{tag}</span>
            ))}
          </div>
        )}

        <div className="item-footer-premium">
          <div className="item-time-premium">
             {typeof item.createdAt === 'string' && item.createdAt.includes('now') ? (
               <>
                 <Clock size={12} className="icon-primary" />
                 <span>{item.createdAt}</span>
               </>
             ) : (
               <>
                 <Calendar size={12} className="icon-primary" />
                 <span>{formatDate(item.createdAt)}</span>
                 <span className="dot-separator">•</span>
                 <Clock size={12} className="icon-primary" />
                 <span>{formatTime(item.createdAt)}</span>
               </>
             )}
          </div>
          
          {getExpiryLabel(item.expiresAt) && (
            <div className="item-expiry-premium" style={{
              color: getExpiryLabel(item.expiresAt).includes('today') || getExpiryLabel(item.expiresAt).includes('tomorrow') ? '#ef4444' : '#f59e0b',
            }}>
              <Timer size={12} />
              <span>{getExpiryLabel(item.expiresAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ItemCard;
