import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Shield, Loader2 } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import LocationModal from '../components/LocationModal';
import { CATEGORIES } from '../data/mockData';
import { haversineDistance, isListingActive, resolveLocationCoords, encodeGeohash, getGeohashPrecisionForRadius, getGeohashNeighbors } from '../utils/geo';
import { initializeSearchIndex, performSearch } from '../utils/searchIndex';
import { db, collection, onSnapshot, query, orderBy, startAt, endAt } from '../firebase';
import { useLanguage } from '../hooks/useLanguage.jsx';

// Default to Davao City center
const DAVAO_CENTER = { lat: 7.0731, lng: 125.6128 };

export default function Home() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const [location, setLocation] = useState(localStorage.getItem('komuni_user_location') || "Davao City");
  const [radius, setRadius] = useState(5);
  
  // Resolve coordinates based on initial location
  const initialCoords = resolveLocationCoords(location);
  const [userLat, setUserLat] = useState(initialCoords.lat);
  const [userLng, setUserLng] = useState(initialCoords.lng);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || "";
  const selectedCategory = searchParams.get('category') || "All";
  
  const setSearchQuery = (val) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val) next.set('q', val);
      else next.delete('q');
      return next;
    });
  };

  const setSelectedCategory = (val) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val && val !== 'All') next.set('category', val);
      else next.delete('category');
      return next;
    });
  };

  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const precision = getGeohashPrecisionForRadius(radius);
    const userGeohash = encodeGeohash(userLat, userLng, precision);
    const neighbors = getGeohashNeighbors(userGeohash);
    const targetGeohashes = [userGeohash, ...neighbors];

    const resultsMap = {};
    const unsubscribes = [];

    targetGeohashes.forEach((gh) => {
      const q = query(
        collection(db, 'listings'),
        orderBy('geohash'),
        startAt(gh),
        endAt(gh + '\uf8ff')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        resultsMap[gh] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          rawDate: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now())
        }));

        // Merge all listings from all target geohash cells
        const mergedListings = [];
        const seenIds = new Set();

        Object.values(resultsMap).forEach(listingsList => {
          listingsList.forEach(item => {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              mergedListings.push(item);
            }
          });
        });

        // Sort by date in memory
        mergedListings.sort((a, b) => b.rawDate - a.rawDate);

        // Map to display format
        const displayListings = mergedListings.map(item => ({
          ...item,
          createdAt: item.createdAt?.toDate ? "Just now" : item.createdAt
        }));

        setListings(displayListings);
        initializeSearchIndex(displayListings);
        setIsLoading(false);
      }, (error) => {
        console.error(`Firestore Geohash Query Error for cell ${gh}:`, error);
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [userLat, userLng, radius]);




  const searchResults = performSearch(searchQuery);

  const filteredListings = listings.filter(item => {
    // ── TTL Filter ─────────────────────────────────────────────────────────────
    if (!isListingActive(item.expiresAt)) return false;

    // ── Inverted Index Search Filter ──────────────────────────────────────────
    if (searchResults !== null && !searchResults.includes(item.id)) return false;

    // ── Geohash/Proximity Filter ───────────────────────────────────────────────
    if (item.lat && item.lng) {
      // 1. Geohash prefix filter (Primary check)
      const reqPrecision = getGeohashPrecisionForRadius(radius);
      const userGeohash = encodeGeohash(userLat, userLng, reqPrecision);
      const neighbors = getGeohashNeighbors(userGeohash);
      const targetGeohashes = [userGeohash, ...neighbors];
      const itemGeohash = item.geohash || encodeGeohash(item.lat, item.lng, reqPrecision);
      
      // Check if item falls in center geohash or any neighbor cell
      const inGeohashGrid = targetGeohashes.some(gh => itemGeohash.startsWith(gh));
      if (!inGeohashGrid) {
        return false;
      }

      // 2. Exact circular boundary pruning
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
            <Shield size={14} />
            <span>{t('dash_verify_badge')}</span>
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
          <MapPin size={16} />
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
            {cat.label}
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
            {radius < 50 && (
              <button 
                className="btn btn-primary" 
                onClick={() => setRadius(radius + 10)} 
                style={{ width: 'auto', marginTop: '1rem' }}
              >
                Expand Radius to {radius + 10}km
              </button>
            )}
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
