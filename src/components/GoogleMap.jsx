import React, { useEffect, useRef } from 'react';

const DAVAO_CENTER = { lat: 7.0707, lng: 125.6092 };

// Helper to validate that coordinates are valid numbers and not null/undefined
const isValidCoords = (c) => 
  c && 
  typeof c.lat === 'number' && 
  typeof c.lng === 'number' && 
  !isNaN(c.lat) && 
  !isNaN(c.lng);

export default function GoogleMap({ 
  center = DAVAO_CENTER, 
  zoom = 14, 
  radius = 0, 
  onLocationSelect = null,
  markers = []
}) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const circleRef = useRef(null);
  const markerRef = useRef(null);
  const extraMarkersRef = useRef([]);

  const [isMapLoaded, setIsMapLoaded] = React.useState(false);

  useEffect(() => {
    // Guard: require window.google.maps.Map to be a real constructor —
    // NOT just window.google (which Google Identity Services sets early)
    if (typeof window.google?.maps?.Map === 'function') {
      setIsMapLoaded(true);
      return;
    }

    // Script tag already exists — poll until Maps is fully bootstrapped
    if (document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js"]')) {
      const checkInterval = setInterval(() => {
        if (typeof window.google?.maps?.Map === 'function') {
          setIsMapLoaded(true);
          clearInterval(checkInterval);
        }
      }, 150);
      return () => clearInterval(checkInterval);
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY &&
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
      ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      : '';

    // Use a named global callback instead of script.onload.
    // The Maps API guarantees it calls this callback only after it has fully
    // bootstrapped window.google.maps — solving the race with Identity Services.
    const callbackName = '__googleMapsInit_' + Date.now();
    window[callbackName] = () => {
      setIsMapLoaded(true);
      delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('[GoogleMap] Failed to load Maps script.');
      delete window[callbackName];
    };

    // Fallback poll in case callback is blocked (ad blocker, CSP, etc.)
    const fallback = setInterval(() => {
      if (typeof window.google?.maps?.Map === 'function') {
        setIsMapLoaded(true);
        clearInterval(fallback);
      }
    }, 300);

    document.head.appendChild(script);
    return () => {
      clearInterval(fallback);
      delete window[callbackName];
    };
  }, []);

  useEffect(() => {
    // Require the Map constructor to actually be a function before calling it
    if (!isMapLoaded || !mapRef.current || typeof window.google?.maps?.Map !== 'function') return;

    // Use the validated coordinate or fall back to Davao Center
    const mapCenter = isValidCoords(center) ? center : DAVAO_CENTER;

    let map;
    try {
      map = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: zoom,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
    } catch (e) {
      console.error('[GoogleMap] Map constructor error:', e);
      // Retry: reset isMapLoaded so the effect re-runs after a short delay
      const retryTimer = setTimeout(() => {
        setIsMapLoaded(false);
        setTimeout(() => setIsMapLoaded(true), 400);
      }, 500);
      return () => clearTimeout(retryTimer);
    }

    googleMapRef.current = map;

    // Add main marker
    markerRef.current = new window.google.maps.Marker({
      position: mapCenter,
      map: radius > 0 ? null : map, // Hide pin when privacy circle is active
      draggable: !!onLocationSelect,
      animation: window.google.maps.Animation.DROP
    });

    // Add radius circle
    if (radius > 0) {
      circleRef.current = new window.google.maps.Circle({
        strokeColor: '#4F46E5',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4F46E5',
        fillOpacity: 0.15,
        map: map,
        center: mapCenter,
        radius: radius * 1000, // Convert km to meters
      });
    }

    if (onLocationSelect) {
      const clickListener = map.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const newPos = { lat, lng };
        updatePosition(newPos);
        onLocationSelect(newPos);
      });

      const dragListener = markerRef.current.addListener('dragend', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onLocationSelect({ lat, lng });
      });

      return () => {
        window.google.maps.event.removeListener(clickListener);
        window.google.maps.event.removeListener(dragListener);
      };
    }
  }, [isMapLoaded]);

  // Update center/radius when props change
  useEffect(() => {
    if (!isMapLoaded || !googleMapRef.current) return;

    const pos = isValidCoords(center) ? { lat: center.lat, lng: center.lng } : DAVAO_CENTER;
    
    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    }

    if (circleRef.current) {
      circleRef.current.setCenter(pos);
      circleRef.current.setRadius(radius * 1000);
    }

    googleMapRef.current.panTo(pos);
  }, [center, radius]);

  useEffect(() => {
    if (!isMapLoaded || !googleMapRef.current || typeof window.google?.maps?.Marker !== 'function') return;

    // Clear old markers
    extraMarkersRef.current.forEach(m => m.setMap(null));
    extraMarkersRef.current = [];

    // Add new markers
    markers.forEach(m => {
      if (!isValidCoords(m)) return;
      const marker = new window.google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: googleMapRef.current,
        title: m.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: '#4F46E5',
          fillOpacity: 1,
          strokeWeight: 0
        }
      });
      extraMarkersRef.current.push(marker);
    });
  }, [markers]);

  const updatePosition = (pos) => {
    if (!isValidCoords(pos)) return;
    if (markerRef.current) markerRef.current.setPosition(pos);
    if (circleRef.current) circleRef.current.setCenter(pos);
  };

  if (!isMapLoaded) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}>LOADING SATELLITE LINK...</div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        borderRadius: 'inherit',
        background: '#f1f5f9'
      }} 
    />
  );
}
