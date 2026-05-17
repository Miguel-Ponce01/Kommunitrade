import React, { useState } from 'react';
import { X, MapPin, ChevronDown, Navigation, Loader2 } from 'lucide-react';
import '../index.css';
import { encodeGeohash, resolveLocationCoords, resolveBarangayFromGeohash } from '../utils/geo';
import GoogleMap from './GoogleMap';

export default function LocationModal({ isOpen, onClose, initialLocation, initialRadius, onApply }) {
  const [location, setLocation] = useState(initialLocation || "Davao City");
  const [radius, setRadius] = useState(initialRadius || 20);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [detectedGeohash, setDetectedGeohash] = useState(null);
  const [resolvedCoords, setResolvedCoords] = useState(initialLocation ? resolveLocationCoords(initialLocation) : { lat: 7.0707, lng: 125.6092 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!isOpen) return null;

  const radiusOptions = [1, 2, 5, 10, 20, 50];

  const formatRadiusLabel = (r) => {
    if (r < 1) return `${r * 1000} meters`;
    return `${r} kilometer${r !== 1 ? 's' : ''}`;
  };

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
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Radius</label>
            <div className="radius-select-container" style={{ position: 'relative' }}>
              <button 
                type="button"
                className="custom-dropdown-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                <span style={{ fontWeight: 700 }}>{formatRadiusLabel(radius)}</span>
                <ChevronDown size={16} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
              </button>

              {isDropdownOpen && (
                <div 
                  className="custom-dropdown-list"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-premium)',
                    zIndex: 100,
                    overflow: 'hidden'
                  }}
                >
                  {radiusOptions.map(opt => (
                    <div 
                      key={opt}
                      className="custom-dropdown-option"
                      onClick={() => {
                        setRadius(opt);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                        fontSize: '0.95rem',
                        background: radius === opt ? 'rgba(var(--primary-rgb, 79,70,229), 0.1)' : 'transparent',
                        fontWeight: radius === opt ? 700 : 400,
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => {
                        if (radius !== opt) e.target.style.background = 'rgba(255,255,255,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (radius !== opt) e.target.style.background = 'transparent';
                      }}
                    >
                      <span>{formatRadiusLabel(opt)}</span>
                      {radius === opt && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="map-placeholder" style={{ padding: 0, overflow: 'hidden' }}>
            <GoogleMap 
              center={resolvedCoords}
              radius={radius}
              onLocationSelect={(coords) => {
                setResolvedCoords(coords);
                const gh = encodeGeohash(coords.lat, coords.lng);
                const brgy = resolveBarangayFromGeohash(gh);
                setLocation(brgy);
                setDetectedGeohash(gh);
              }}
            />
            <button
              className="current-location-btn"
              onClick={handleUseMyLocation}
              disabled={isGeolocating}
              title="Use my current location"
              style={{ zIndex: 10 }}
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
