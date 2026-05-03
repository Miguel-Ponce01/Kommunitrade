import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Package, CheckCircle, Settings, Edit3, Trash2, Tag } from 'lucide-react';
import ItemCard from '../components/ItemCard';

export default function Profile() {
  const navigate = useNavigate();
  
  // User State
  const user = {
    name: 'Juan Dela Cruz',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200&h=200',
    location: 'Brgy. Obrero, Davao City',
    memberSince: 'May 2024',
    trustScore: 100,
    itemsSold: 12,
    activeListingsCount: 3,
  };

  // Active Listings State
  const [activeListings, setActiveListings] = useState([
    {
      id: 1,
      title: 'Handwoven Rattan Basket',
      price: 350,
      imageUrl: 'https://images.unsplash.com/photo-1595039011702-861f1c29e1f5?auto=format&fit=crop&q=80&w=300',
      barangay: 'Brgy. Obrero',
      isSold: false
    },
    {
      id: 2,
      title: 'Monstera Deliciosa Plant',
      price: 850,
      imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=300',
      barangay: 'Brgy. Obrero',
      isSold: false
    },
    {
      id: 3,
      title: 'Pre-loved Denim Jacket (M)',
      price: 450,
      imageUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=300',
      barangay: 'Brgy. Obrero',
      isSold: true
    }
  ]);

  const toggleSoldStatus = (id) => {
    setActiveListings(prev => 
      prev.map(item => item.id === id ? { ...item, isSold: !item.isSold } : item)
    );
  };

  return (
    <div className="profile-page animate-fade-in">
      <div className="profile-header">
        <div className="profile-cover"></div>
        <div className="profile-info-container">
          <div className="profile-avatar-wrap">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="profile-avatar" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200&h=200';
              }}
            />
            <button className="edit-avatar-btn">
              <Edit3 size={16} />
            </button>
          </div>
          <div className="profile-details">
            <h1 className="profile-name">{user.name}</h1>
            <div className="profile-location">
              <MapPin size={14} />
              <span>{user.location} • Member since {user.memberSince}</span>
            </div>
          </div>
          <button className="settings-btn glass" onClick={() => navigate('/app/settings')}>
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-icon trust"><Star size={20} fill="currentColor" /></div>
          <div className="stat-value">{user.trustScore}%</div>
          <div className="stat-label">Trust Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon sold"><CheckCircle size={20} /></div>
          <div className="stat-value">{user.itemsSold}</div>
          <div className="stat-label">Items Sold</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active"><Package size={20} /></div>
          <div className="stat-value">{user.activeListingsCount}</div>
          <div className="stat-label">Active</div>
        </div>
      </div>

      <div className="profile-listings-section">
        <div className="section-header">
          <h2>My Active Listings</h2>
          <button className="btn-primary" onClick={() => navigate('/app/post')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            + Add Listing
          </button>
        </div>
        <div className="masonry-grid">
          {activeListings.map(item => (
            <div key={item.id} style={{ position: 'relative', opacity: item.isSold ? 0.6 : 1 }}>
              {item.isSold && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '1.25rem', zIndex: 30, pointerEvents: 'none', boxShadow: 'var(--shadow-md)' }}>
                  SOLD
                </div>
              )}
              <ItemCard item={item} onClick={() => {}} />
              <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '0.5rem', zIndex: 20 }}>
                <button onClick={() => toggleSoldStatus(item.id)} className="glass" style={{ border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: item.isSold ? 'var(--primary)' : 'var(--text-main)' }} title={item.isSold ? "Mark as Available" : "Mark as Sold"}>
                  <Tag size={16} />
                </button>
                <button className="glass" style={{ border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }} title="Edit Listing">
                  <Edit3 size={16} />
                </button>
                <button className="glass" style={{ border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }} title="Delete Listing">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
