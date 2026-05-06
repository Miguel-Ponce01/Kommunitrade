import React, { useState } from 'react';
import { X, MapPin, ChevronDown, Navigation, Loader2 } from 'lucide-react';
import '../index.css';
import { encodeGeohash, resolveLocationCoords, resolveBarangayFromGeohash } from '../utils/geo';

export default function LocationModal({ isOpen, onClose, initialLocation, initialRadius, onApply }) {
  const [location, setLocation] = useState(initialLocation || "Davao City");
  const [radius, setRadius] = useState(initialRadius || 20);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [detectedGeohash, setDetectedGeohash] = useState(null);
  const [resolvedCoords, setResolvedCoords] = useState(null);

  if (!isOpen) return null;

  const radiusOptions = [1, 2, 5, 10, 20, 40, 60, 80, 100, 250, 500];

  const handleApply = () => {
    let lat, lng;
    if (resolvedCoords) {
      lat = resolvedCoords.lat;
      lng = resolvedCoords.lng;
    } else {
      const coords = resolveLocationCoords(location);
      lat = coords.lat;
      lng = coords.lng;
    }
    onApply(location, radius, lat, lng);
    onClose();
  };

  /**
   * Uses the browser's Geolocation API to get the user's actual position.
   * Encodes it into a geohash for display — directly demonstrates the
   * manuscript's geohash encoding claim.
   */
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setIsGeolocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const gh = encodeGeohash(latitude, longitude);
        const brgy = resolveBarangayFromGeohash(gh);
        setDetectedGeohash(gh);
        setResolvedCoords({ lat: latitude, lng: longitude });
        setLocation(brgy);
        setIsGeolocating(false);
      },
      (err) => {
        setGeoError("Could not detect location. Please enter it manually.");
        setIsGeolocating(false);
        console.warn("Geolocation error:", err);
      },
      { timeout: 8000 }
    );
  };

  const handleLocationInput = (val) => {
    setLocation(val);
    setDetectedGeohash(null);
    setResolvedCoords(null);
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
                onChange={(e) => handleLocationInput(e.target.value)}
                placeholder="Enter location" 
              />
            </div>
          </div>

          {/* Geohash display — visible proof of encoding for academic defense */}
          {detectedGeohash && (
            <div style={{
              margin: '0.5rem 0 0.25rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(var(--primary-rgb, 79,70,229), 0.08)',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: 'monospace',
              fontWeight: 700,
            }}>
              <MapPin size={13} />
              Geohash: <span style={{ letterSpacing: '0.08em' }}>{detectedGeohash}</span>
            </div>
          )}

          {geoError && (
            <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.25rem' }}>{geoError}</p>
          )}

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
            <div 
              className="map-circle-overlay"
              style={{
                width: `${Math.max(40, Math.min(180, 60 + (radius / 100) * 120))}px`,
                height: `${Math.max(40, Math.min(180, 60 + (radius / 100) * 120))}px`,
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div className="map-pin-center">
                <div className="pin-head"></div>
                <div className="pin-point"></div>
              </div>
            </div>
            <button
              className="current-location-btn"
              onClick={handleUseMyLocation}
              disabled={isGeolocating}
              title="Use my current location"
            >
              {isGeolocating
                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                : <Navigation size={14} fill="currentColor" />
              }
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
