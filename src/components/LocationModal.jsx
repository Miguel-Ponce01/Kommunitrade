import React, { useState } from 'react';
import { X, MapPin, ChevronDown, Navigation } from 'lucide-react';
import '../index.css';

export default function LocationModal({ isOpen, onClose, initialLocation, initialRadius, onApply }) {
  const [location, setLocation] = useState(initialLocation || "Davao City");
  const [radius, setRadius] = useState(initialRadius || 20);

  if (!isOpen) return null;

  const radiusOptions = [1, 2, 5, 10, 20, 40, 60, 80, 100, 250, 500];

  const handleApply = () => {
    onApply(location, radius);
    onClose();
  };

  return (
    <div className="location-modal-overlay" onClick={onClose}>
      <div className="location-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="location-modal-header">
          <h2>Change location</h2>
          <button className="location-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="location-modal-body">
          <p className="location-input-label">Search by city, neighborhood or ZIP code.</p>
          
          <div className="location-input-wrapper">
            <div className="location-icon-wrapper">
              <MapPin size={18} />
            </div>
            <div className="location-input-container">
              <label>Location</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location" 
              />
            </div>
          </div>

          <div className="radius-select-wrapper">
            <label>Radius</label>
            <div className="radius-select-container">
              <select 
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              >
                {radiusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt} kilometer{opt !== 1 ? 's' : ''}</option>
                ))}
              </select>
              <ChevronDown size={16} className="radius-chevron" />
            </div>
          </div>

          <div className="map-placeholder">
            <div className="map-circle-overlay">
              <div className="map-pin-center">
                <div className="pin-head"></div>
                <div className="pin-point"></div>
              </div>
            </div>
            <button className="current-location-btn">
              <Navigation size={14} fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="location-modal-footer">
          <button className="btn-primary" onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
