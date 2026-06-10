/**
 * KomuniTrade — Geospatial Utilities
 * Implements geohash encoding and Haversine distance calculation
 * to support the manuscript's location-based filtering claims.
 */

// ─── Geohash Constants ────────────────────────────────────────────────────────
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encodes a lat/lng pair into a geohash string.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Geohash length (default: 6)
 * @returns {string} Geohash string
 */
export function encodeGeohash(lat, lng, precision = 6) {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90, latMax = 90;
  let lngMin = -180, lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      // bisect E-W longitude
      const lngMid = (lngMin + lngMax) / 2;
      if (lng >= lngMid) {
        idx = idx * 2 + 1;
        lngMin = lngMid;
      } else {
        idx = idx * 2;
        lngMax = lngMid;
      }
    } else {
      // bisect N-S latitude
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        idx = idx * 2 + 1;
        latMin = latMid;
      } else {
        idx = idx * 2;
        latMax = latMid;
      }
    }
    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }
  return geohash;
}

export function decodeGeohash(geohash) {
  let evenBit = true;
  let latMin = -90, latMax = 90;
  let lngMin = -180, lngMax = 180;

  for (const char of geohash) {
    const idx = BASE32.indexOf(char);
    for (let bits = 4; bits >= 0; bits--) {
      const bitN = (idx >> bits) & 1;
      if (evenBit) {
        const lngMid = (lngMin + lngMax) / 2;
        if (bitN === 1) lngMin = lngMid; else lngMax = lngMid;
      } else {
        const latMid = (latMin + latMax) / 2;
        if (bitN === 1) latMin = latMid; else latMax = latMid;
      }
      evenBit = !evenBit;
    }
  }
  return {
    lat: (latMin + latMax) / 2,
    lng: (lngMin + lngMax) / 2,
    latMin,
    latMax,
    lngMin,
    lngMax
  };
}

/**
 * Calculates the geohashes of the 8 surrounding neighbor cells of a given geohash.
 * @param {string} geohash - Center geohash cell
 * @returns {string[]} Array of 8 neighboring geohash strings
 */
export function getGeohashNeighbors(geohash) {
  if (!geohash) return [];
  const { lat, lng, latMin, latMax, lngMin, lngMax } = decodeGeohash(geohash);
  
  const latHeight = latMax - latMin;
  const lngWidth = lngMax - lngMin;
  const precision = geohash.length;

  const offsets = [
    [1, 0],   // North
    [-1, 0],  // South
    [0, 1],   // East
    [0, -1],  // West
    [1, 1],   // North-East
    [1, -1],  // North-West
    [-1, 1],  // South-East
    [-1, -1]  // South-West
  ];

  return offsets.map(([latOffset, lngOffset]) => {
    let nLat = lat + latOffset * latHeight;
    let nLng = lng + lngOffset * lngWidth;
    
    // Normalize latitude
    if (nLat > 90) nLat = 90;
    if (nLat < -90) nLat = -90;
    
    // Normalize longitude
    if (nLng > 180) nLng -= 360;
    if (nLng < -180) nLng += 360;
    
    return encodeGeohash(nLat, nLng, precision);
  });
}

/**
 * Determines the geohash prefix length required to cover a given radius in km.
 * @param {number} radiusKm 
 * @returns {number} Geohash precision length
 */
export function getGeohashPrecisionForRadius(radiusKm) {
  if (radiusKm <= 0.04) return 8; // ~38m
  if (radiusKm <= 0.15) return 7; // ~150m
  if (radiusKm <= 1.2) return 6;  // ~1.2km
  if (radiusKm <= 4.9) return 5;  // ~4.9km
  if (radiusKm <= 39) return 4;   // ~39km
  if (radiusKm <= 156) return 3;  // ~156km
  return 2;
}

// ─── Haversine Distance ────────────────────────────────────────────────────────
/**
 * Calculates the great-circle distance between two coordinates using the
 * Haversine formula. Returns distance in kilometers.
 *
 * @param {number} lat1 - Latitude of point A
 * @param {number} lng1 - Longitude of point A
 * @param {number} lat2 - Latitude of point B
 * @param {number} lng2 - Longitude of point B
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// ─── TTL Utilities ─────────────────────────────────────────────────────────────
/**
 * Returns true if a listing has NOT yet expired.
 * @param {string} expiresAt - ISO date string (e.g. "2026-06-01")
 * @returns {boolean}
 */
export function isListingActive(expiresAt) {
  if (!expiresAt) return true;
  
  // Handle Firebase Timestamp objects
  const expiryDate = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
  
  return expiryDate > new Date();
}

/**
 * Returns a human-readable countdown string.
 * e.g. "Expires in 3 days", "Expires today", "Expired"
 * @param {string} expiresAt - ISO date string
 * @returns {string}
 */
export function getExpiryLabel(expiresAt) {
  if (!expiresAt) return null;
  const now = new Date();
  const exp = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
  const diffMs = exp - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Expires today';
  if (diffDays === 1) return 'Expires tomorrow';
  if (diffDays <= 7) return `Expires in ${diffDays} days`;
  return null; // Don't show badge for listings far from expiry
}

// ─── Davao City Barangay Coordinates ─────────────────────────────────────────
export const BARANGAY_COORDS = {
  'Obrero':            { lat: 7.0750, lng: 125.6180 },
  'Agdao':             { lat: 7.0820, lng: 125.6270 },
  'Buhangin':          { lat: 7.1000, lng: 125.6350 },
  'Matina':            { lat: 7.0560, lng: 125.5930 },
  'Poblacion':         { lat: 7.0695, lng: 125.6120 },
  'San Isidro':        { lat: 7.0900, lng: 125.6100 },
  'Bagumbayan':        { lat: 7.0780, lng: 125.6200 },
  'Pag-asa':           { lat: 7.0650, lng: 125.6050 },
  'Sampaguita':        { lat: 7.0720, lng: 125.6150 },
  'Greenpark Village': { lat: 7.0850, lng: 125.6300 },
  'Phase 1':           { lat: 7.0800, lng: 125.6220 },
  'Phase 2':           { lat: 7.0810, lng: 125.6230 },
  // Default city center fallback
  'Davao City':        { lat: 7.0731, lng: 125.6128 },
};

/**
 * Finds the nearest Barangay from the BARANGAY_COORDS map.
 * @param {number} lat 
 * @param {number} lng 
 * @returns {string} Barangay name
 */
export function findNearestBarangay(lat, lng) {
  let nearest = 'Davao City';
  let minDistance = Infinity;

  Object.entries(BARANGAY_COORDS).forEach(([name, coords]) => {
    if (name === 'Davao City') return; // Skip the default fallback
    const dist = haversineDistance(lat, lng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = name;
    }
  });

  return nearest;
}

/**
 * Resolves a location name string to coordinates.
 * Falls back to Davao City center if unrecognized.
 * @param {string} locationName
 * @returns {{ lat: number, lng: number }}
 */
export function resolveLocationCoords(locationName) {
  if (!locationName) return BARANGAY_COORDS['Davao City'];
  // Try exact match first
  if (BARANGAY_COORDS[locationName]) return BARANGAY_COORDS[locationName];
  // Try partial match (case-insensitive)
  const key = Object.keys(BARANGAY_COORDS).find(k =>
    k.toLowerCase().includes(locationName.toLowerCase()) ||
    locationName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? BARANGAY_COORDS[key] : BARANGAY_COORDS['Davao City'];
}
/**
 * Resolves a geohash string to the nearest Barangay name.
 * Useful for "Hyperlocal" claim verification.
 * @param {string} geohash 
 * @returns {string} Barangay name
 */
export function resolveBarangayFromGeohash(geohash) {
  if (!geohash) return 'Davao City';
  const { lat, lng } = decodeGeohash(geohash);
  return findNearestBarangay(lat, lng);
}

// ─── Davao City Safe Meetup Hotspots ──────────────────────────────────────────
export const SAFE_HOTSPOTS = {
  'Obrero': ['Obrero Barangay Hall', 'Obrero Police Precinct 5 (Bajada)', 'Gaisano Mall of Davao (Main Entrance)'],
  'Agdao': ['Agdao Barangay Hall', 'Agdao Public Market (Front Gate)', 'Agdao Police Outpost'],
  'Buhangin': ['Buhangin Barangay Hall', 'Buhangin Police Station', 'SM City Lanang (Atrium Center)'],
  'Matina': ['Matina Aplaya Barangay Hall', 'NCCC Mall Matina (Front Entrance)', 'Matina Crossing Police Precinct'],
  'Poblacion': ['Davao City Hall Plaza', 'People\'s Park (Main Entrance Gate)', 'Poblacion Police Precinct'],
  'San Isidro': ['San Isidro Barangay Hall', 'San Isidro Multi-Purpose Gym'],
  'Bagumbayan': ['Bagumbayan Hall', 'Bagumbayan Public Plaza'],
  'Greenpark Village': ['Greenpark Clubhouse', 'Greenpark Main Security Gatehouse'],
  'Phase 1': ['Phase 1 Community Park', 'Phase 1 Security Guard House'],
  'Phase 2': ['Phase 2 Guardhouse', 'Phase 2 Covered Court'],
  'Davao City': ['Rizal Park (City Hall)', 'Abreeza Mall (Activity Center)', 'Davao City Police Office Headquarters']
};

/**
 * Returns the verified safe hotspots for a given Barangay name.
 * Falls back to Davao City general hotspots if not specifically mapped.
 * @param {string} barangay - Name of the Barangay
 * @returns {string[]} List of safe meetup locations
 */
export function getSafeMeetupSpots(barangay) {
  if (!barangay) return SAFE_HOTSPOTS['Davao City'];
  
  // Direct exact match
  if (SAFE_HOTSPOTS[barangay]) return SAFE_HOTSPOTS[barangay];
  
  // Partial match (case-insensitive)
  const key = Object.keys(SAFE_HOTSPOTS).find(k =>
    k.toLowerCase().includes(barangay.toLowerCase()) ||
    barangay.toLowerCase().includes(k.toLowerCase())
  );
  
  return key ? SAFE_HOTSPOTS[key] : SAFE_HOTSPOTS['Davao City'];
}

