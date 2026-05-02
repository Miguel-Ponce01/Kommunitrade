import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { MOCK_LISTINGS, MOCK_BARANGAYS } from '../data/mockData';

export default function Home() {
  const navigate = useNavigate();
  const [selectedBarangay, setSelectedBarangay] = useState("All Barangays");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredListings = MOCK_LISTINGS.filter(item => {
    const matchesBarangay = selectedBarangay === "All Barangays" || item.barangay === selectedBarangay;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBarangay && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
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

      {/* Feed */}
      <div className="masonry-grid">
        {filteredListings.length > 0 ? (
          filteredListings.map(item => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onClick={(id) => navigate(`/item/${id}`)}
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
