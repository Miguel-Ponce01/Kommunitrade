import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { MOCK_LISTINGS, MOCK_BARANGAYS } from '../data/mockData';

export default function Home() {
  const navigate = useNavigate();
  const [selectedBarangay, setSelectedBarangay] = useState("All Barangays");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const CATEGORIES = ["All", "House", "Electronic", "Service", "Food", "Waste"];

  const filteredListings = MOCK_LISTINGS.filter(item => {
    const matchesBarangay = selectedBarangay === "All Barangays" || item.barangay === selectedBarangay;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesBarangay && matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div style={{ padding: '0 0.25rem 1rem 0.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          Local Deals
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Discover items and services near you
        </p>
      </div>

      {/* Header Actions */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search items..." 
            style={{ paddingLeft: '2.75rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: 0 }}>
          <select 
            className="form-control" 
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            style={{ fontWeight: 600, color: 'var(--primary)' }}
          >
            {MOCK_BARANGAYS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Filter Scroll */}
      <div className="category-filter-container">
        {CATEGORIES.map(category => (
          <button
            key={category}
            className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="masonry-grid">
        {filteredListings.length > 0 ? (
          filteredListings.map(item => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onClick={(id) => navigate(`/app/item/${id}`)}
            />
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            No items found in this area.
          </div>
        )}
      </div>
    </div>
  );
}
