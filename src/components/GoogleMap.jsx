import React, { useEffect, useRef } from 'react';

const DAVAO_CENTER = { lat: 7.0707, lng: 125.6092 };

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

  const isPlaceholderKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE";

  useEffect(() => {
    if (isPlaceholderKey || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: zoom,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        {
          "featureType": "poi",
          "elementType": "labels",
          "stylers": [{ "visibility": "off" }]
        }
      ]
    });

    googleMapRef.current = map;

    // Add main marker
    markerRef.current = new window.google.maps.Marker({
      position: center,
      map: map,
      draggable: !!onLocationSelect,
      animation: window.google.maps.Animation.DROP
    });

    // Add radius circle
    if (radius > 0) {
      circleRef.current = new window.google.maps.Circle({
        strokeColor: "#4F46E5",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#4F46E5",
        fillOpacity: 0.15,
        map: map,
        center: center,
        radius: radius * 1000, // Convert km to meters
      });
    }

    if (onLocationSelect) {
      const clickListener = map.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        updatePosition({ lat, lng });
        onLocationSelect({ lat, lng });
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
  }, []);

  // Update center/radius when props change
  useEffect(() => {
    if (isPlaceholderKey || !googleMapRef.current) return;

    const pos = { lat: center.lat, lng: center.lng };
    
    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    }

    if (circleRef.current) {
      circleRef.current.setCenter(pos);
      circleRef.current.setRadius(radius * 1000);
    }

    googleMapRef.current.panTo(pos);
  }, [center, radius]);

  // Update extra markers when markers prop changes
  useEffect(() => {
    if (isPlaceholderKey || !googleMapRef.current || !window.google) return;

    // Clear old markers
    extraMarkersRef.current.forEach(m => m.setMap(null));
    extraMarkersRef.current = [];

    // Add new markers
    markers.forEach(m => {
      const marker = new window.google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: googleMapRef.current,
        title: m.title,
        icon: {
           path: window.google.maps.SymbolPath.CIRCLE,
           scale: 5,
           fillColor: "#4F46E5",
           fillOpacity: 1,
           strokeWeight: 0
        }
      });
      extraMarkersRef.current.push(marker);
    });
  }, [markers]);

  const updatePosition = (pos) => {
    if (markerRef.current) markerRef.current.setPosition(pos);
    if (circleRef.current) circleRef.current.setCenter(pos);
  };

  if (isPlaceholderKey) {
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          borderRadius: 'inherit',
          background: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #1e293b'
        }} 
      >
        {/* Radar Animation Background */}
        <div className="radar-ping" style={{ 
          position: 'absolute', width: '200%', height: '200%', 
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
          animation: 'pulse 3s infinite'
        }} />
        
        <div style={{ zIndex: 2, textAlign: 'center', padding: '1rem' }}>
          <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.6rem', letterSpacing: '0.2em', marginBottom: '8px' }}>GPS AUTHENTICATED</div>
          <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>LAT: {center.lat.toFixed(4)}</div>
          <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>LNG: {center.lng.toFixed(4)}</div>
          <div style={{ marginTop: '12px', height: '2px', width: '40px', background: 'var(--primary)', margin: '12px auto' }} />
          <div style={{ color: 'var(--primary)', fontSize: '0.5rem', fontWeight: 800 }}>SATELLITE LOCK: ACTIVE</div>
        </div>

        {/* Grid lines overlay */}
        <div style={{ 
          position: 'absolute', inset: 0, opacity: 0.1, 
          backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
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
