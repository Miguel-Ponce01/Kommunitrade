import React, { useState } from 'react';
import { X, MapPin, ChevronDown, Navigation, Loader2 } from 'lucide-react';
import '../index.css';
import { encodeGeohash, resolveLocationCoords, resolveBarangayFromGeohash, findNearestBarangay, BARANGAY_COORDS } from '../utils/geo';
import GoogleMap from './GoogleMap';

export default function LocationModal({ isOpen, onClose, initialLocation, initialRadius, onApply }) {
  const [location, setLocation] = useState(initialLocation || "Davao City");
  const [radius, setRadius] = useState(initialRadius || 20);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [detectedGeohash, setDetectedGeohash] = useState(null);
  const [resolvedCoords, setResolvedCoords] = useState(initialLocation ? resolveLocationCoords(initialLocation) : { lat: 7.0707, lng: 125.6092 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState(null);

  const reverseGeocode = (lat, lng) => {
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setDetectedAddress(results[0].formatted_address);
        } else {
          const brgy = findNearestBarangay(lat, lng);
          setDetectedAddress(`${brgy}, Davao City (Local Resolution)`);
        }
      });
    } else {
      const brgy = findNearestBarangay(lat, lng);
      setDetectedAddress(`${brgy}, Davao City (Local Resolution)`);
    }
  };

  React.useEffect(() => {
    if (resolvedCoords) {
      const gh = encodeGeohash(resolvedCoords.lat, resolvedCoords.lng);
      setDetectedGeohash(gh);
      
      let isResolvedFromGoogle = false;
      
      const tryGeocode = (isRetry = false) => {
        if (isResolvedFromGoogle) return;
        
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: resolvedCoords.lat, lng: resolvedCoords.lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              setDetectedAddress(results[0].formatted_address);
              isResolvedFromGoogle = true;
            } else if (isRetry) {
              const brgy = findNearestBarangay(resolvedCoords.lat, resolvedCoords.lng);
              setDetectedAddress(`${brgy}, Davao City (Local Resolution)`);
            }
          });
        } else if (isRetry) {
          const brgy = findNearestBarangay(resolvedCoords.lat, resolvedCoords.lng);
          setDetectedAddress(`${brgy}, Davao City (Local Resolution)`);
        }
      };
      
      tryGeocode(false);
      const timer = setTimeout(() => tryGeocode(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

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
        reverseGeocode(latitude, longitude);
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
    
    if (val.trim().length >= 3) {
      const matchedKey = Object.keys(BARANGAY_COORDS).find(k => 
        k.toLowerCase() === val.trim().toLowerCase()
      );
      
      if (matchedKey) {
        const coords = BARANGAY_COORDS[matchedKey];
        setResolvedCoords(coords);
        const gh = encodeGeohash(coords.lat, coords.lng);
        setDetectedGeohash(gh);
        reverseGeocode(coords.lat, coords.lng);
        return;
      }
    }
    
    setDetectedGeohash(null);
    setResolvedCoords(null);
    setDetectedAddress(null);
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

          {/* Detailed Location info for validation & user clarity */}
          {(detectedGeohash || resolvedCoords) && (
            <div style={{
              margin: '0.25rem 0 0.5rem',
              padding: '0.85rem 1rem',
              background: 'rgba(var(--primary-rgb, 79,70,229), 0.05)',
              border: '1px solid rgba(var(--primary-rgb, 79,70,229), 0.12)',
              borderRadius: '12px',
              fontSize: '0.8rem',
              color: 'var(--text-main)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--primary)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                <MapPin size={14} />
                <span>LOCATION TELEMETRY</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontFamily: 'monospace' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Latitude</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{resolvedCoords?.lat ? resolvedCoords.lat.toFixed(6) : 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Longitude</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{resolvedCoords?.lng ? resolvedCoords.lng.toFixed(6) : 'N/A'}</span>
                </div>
              </div>

              {detectedGeohash && (
                <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'monospace' }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Geohash (Precision 6)</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>{detectedGeohash}</span>
                </div>
              )}

              {detectedAddress && (
                <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(var(--primary-rgb, 79,70,229), 0.1)', paddingTop: '0.4rem', marginTop: '0.1rem' }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '2px' }}>Resolved Address</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4, fontSize: '0.8rem' }}>{detectedAddress}</span>
                </div>
              )}
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
                reverseGeocode(coords.lat, coords.lng);
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
          <button className="button-primary-pill" onClick={handleApply} style={{ width: '100%' }}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
