import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Sparkles } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { MOCK_LISTINGS, MOCK_BARANGAYS, CATEGORIES } from '../data/mockData';

export default function Home() {
  const navigate = useNavigate();
  const [selectedBarangay, setSelectedBarangay] = useState("All Barangays");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredListings = MOCK_LISTINGS.filter(item => {
    const matchesBarangay = selectedBarangay === "All Barangays" || item.barangay === selectedBarangay;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesBarangay && matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">
            <Sparkles size={14} />
            <span>AI-Powered Marketplace</span>
          </div>
          <h1 className="home-hero-title">Discover Local Deals</h1>
          <p className="home-hero-subtitle">Buy & sell within your barangay — safe, fast, and easy</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="home-filters">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="form-control search-input" 
            placeholder="Search items, services..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="barangay-select-wrapper">
          <MapPin size={16} className="select-icon" />
          <select 
            className="form-control barangay-select" 
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
          >
            {MOCK_BARANGAYS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Filter Scroll */}
      <div className="category-filter-container">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span className="cat-emoji">{cat.emoji}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="results-bar">
        <span className="results-count">{filteredListings.length} items found</span>
        {selectedCategory !== "All" && (
          <button className="clear-filter" onClick={() => setSelectedCategory("All")}>
            Clear filter ✕
          </button>
        )}
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
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No items found</h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
}
