import { useState } from 'react';
import { MapPin, Star, Package, CheckCircle, Settings, Edit3 } from 'lucide-react';
import ItemCard from '../components/ItemCard';

export default function Profile() {
  // Dummy data for user profile
  const user = {
    name: 'Maria Santos',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
    location: 'Brgy. San Lorenzo, Makati',
    memberSince: 'Oct 2023',
    trustScore: 98,
    itemsSold: 24,
    activeListingsCount: 3,
  };

  // Dummy active listings
  const activeListings = [
    {
      id: 1,
      title: 'Handwoven Rattan Basket',
      price: 350,
      image: 'https://images.unsplash.com/photo-1595039011702-861f1c29e1f5?auto=format&fit=crop&q=80&w=300',
      location: 'Brgy. San Lorenzo',
    },
    {
      id: 2,
      title: 'Monstera Deliciosa Plant',
      price: 850,
      image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=300',
      location: 'Brgy. San Lorenzo',
    },
    {
      id: 3,
      title: 'Pre-loved Denim Jacket (M)',
      price: 450,
      image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=300',
      location: 'Brgy. San Lorenzo',
    }
  ];

  return (
    <div className="profile-page animate-fade-in">
      <div className="profile-header">
        <div className="profile-cover"></div>
        <div className="profile-info-container">
          <div className="profile-avatar-wrap">
            <img src={user.avatar} alt={user.name} className="profile-avatar" />
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
          <button className="settings-btn glass">
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
          <button className="view-all-btn">View All</button>
        </div>
        <div className="masonry-grid">
          {activeListings.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
