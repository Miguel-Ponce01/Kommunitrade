import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Sparkles, Loader2 } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import LocationModal from '../components/LocationModal';
import { CATEGORIES } from '../data/mockData';
import { haversineDistance, isListingActive, resolveLocationCoords } from '../utils/geo';
import { initializeSearchIndex, performSearch } from '../utils/searchIndex';
import { db, collection, onSnapshot, query, orderBy } from '../firebase';
import { useLanguage } from '../hooks/useLanguage.jsx';

// Default to Davao City center
const DAVAO_CENTER = { lat: 7.0731, lng: 125.6128 };

export default function Home() {
  const navigate = useNavigate();
  const [lang, setLang, t] = useLanguage();
  const [location, setLocation] = useState(localStorage.getItem('komuni_user_location') || "Davao City");
  const [radius, setRadius] = useState(20);
  
  // Resolve coordinates based on initial location
  const initialCoords = resolveLocationCoords(location);
  const [userLat, setUserLat] = useState(initialCoords.lat);
  const [userLng, setUserLng] = useState(initialCoords.lng);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveListings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Handle Firestore timestamps vs ISO strings
        createdAt: doc.data().createdAt?.toDate ? "Just now" : doc.data().createdAt 
      }));
      setListings(liveListings);
      initializeSearchIndex(liveListings);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update search index when listings change
  useEffect(() => {
    if (listings.length > 0) {
      initializeSearchIndex(listings);
    }
  }, [listings]);

  const searchResults = performSearch(searchQuery);

  const filteredListings = listings.filter(item => {
    // ── TTL Filter ─────────────────────────────────────────────────────────────
    if (!isListingActive(item.expiresAt)) return false;

    // ── Inverted Index Search Filter ──────────────────────────────────────────
    if (searchResults !== null && !searchResults.includes(item.id)) return false;

    // ── Geohash/Proximity Filter ───────────────────────────────────────────────
    if (item.lat && item.lng) {
      const distKm = haversineDistance(userLat, userLng, item.lat, item.lng);
      if (distKm > radius) return false;
    }

    // ── Category Filter ───────────────────────────────────────────────────────
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

    return matchesCategory;
  });

  const handleLocationApply = (locName, rad, lat, lng) => {
    setLocation(locName || "Davao City");
    setRadius(rad);
    // Use provided coordinates or resolve from name
    if (lat && lng) {
      setUserLat(lat);
      setUserLng(lng);
    } else {
      const coords = resolveLocationCoords(locName);
      setUserLat(coords.lat);
      setUserLng(coords.lng);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">
            <Sparkles size={14} />
            <span>{t('dash_ai_badge')}</span>
          </div>
          <h1 className="home-hero-title">{t('dash_title')}</h1>
          <p className="home-hero-subtitle">{t('dash_subtitle')}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="home-filters">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="form-control search-input" 
            placeholder={t('dash_search_ph')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button 
          className="location-trigger-btn"
          onClick={() => setIsLocationModalOpen(true)}
        >
          <MapPin size={16} style={{ color: 'var(--primary)' }} />
          <span>{location} • {radius}km</span>
        </button>
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
        <span className="results-count">{filteredListings.length} {t('dash_results')}</span>
        {selectedCategory !== "All" && (
          <button className="clear-filter" onClick={() => setSelectedCategory("All")}>
            {t('dash_clear')} ✕
          </button>
        )}
      </div>

      {/* Feed */}
      <div className="masonry-grid">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-img"></div>
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-price"></div>
            </div>
          ))
        ) : filteredListings.length > 0 ? (
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
            <h3>{t('dash_empty_title')}</h3>
            <p>{t('dash_empty_desc')}</p>
          </div>
        )}
      </div>

      <LocationModal 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        initialLocation={location}
        initialRadius={radius}
        onApply={handleLocationApply}
      />
    </div>
  );
}
