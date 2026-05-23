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

  const [isMapLoaded, setIsMapLoaded] = React.useState(false);

  useEffect(() => {
    if (window.google) {
      setIsMapLoaded(true);
      return;
    }

    // Prevent duplicate script injections
    if (document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js"]')) {
      const checkInterval = setInterval(() => {
        if (window.google) {
          setIsMapLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY_HERE" 
      ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY 
      : "";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

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
      map: radius > 0 ? null : map, // Hide pin when privacy circle is active to preserve anonymity
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
    if (!isMapLoaded || !googleMapRef.current) return;

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

  useEffect(() => {
    if (!isMapLoaded || !googleMapRef.current || !window.google) return;

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
