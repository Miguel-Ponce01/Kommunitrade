import { MapPin } from 'lucide-react';

export default function ItemCard({ item, onClick }) {
  return (
    <div className="item-card" onClick={() => onClick(item.id)}>
      <div className="item-img-wrap">
        <img src={item.imageUrl} alt={item.title} className="item-img" loading="lazy" />
      </div>
      <div className="item-info">
        <h3 className="item-title">{item.title}</h3>
        <span className="item-location">
          <MapPin size={12} /> {item.barangay}
        </span>
        <div className="item-price">₱{item.price.toLocaleString()}</div>
      </div>
    </div>
  );
}
