import { encodeGeohash } from '../utils/geo';

export const MOCK_BARANGAYS = [
  "All Barangays",
  "Obrero",
  "Agdao",
  "Buhangin",
  "Matina",
  "Poblacion",
  "San Isidro",
  "Bagumbayan",
  "Pag-asa",
  "Sampaguita",
  "Greenpark Village",
  "Phase 1",
  "Phase 2"
];

export const CATEGORIES = [
  { id: "All", label: "All", emoji: "🏷️" },
  { id: "Electronic", label: "Electronics", emoji: "📱" },
  { id: "House", label: "Home & Living", emoji: "🏠" },
  { id: "Books", label: "Books & School", emoji: "📚" },
  { id: "Clothing", label: "Clothing", emoji: "👕" },
  { id: "Food", label: "Food & Drinks", emoji: "🍽️" },
  { id: "Service", label: "Services", emoji: "🔧" },
  { id: "Furniture", label: "Furniture", emoji: "🪑" },
  { id: "Vehicles", label: "Vehicles", emoji: "🏍️" },
  { id: "Waste", label: "Recyclables", emoji: "♻️" },
];

// ─── Helper: Generate an expiresAt date relative to today ─────────────────────
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
}

// ─── Mock Listings ─────────────────────────────────────────────────────────────
// Each listing has:
//   lat, lng  — approximate coordinates of the barangay
//   geohash   — 6-char geohash encoded from lat/lng (satisfies manuscript claim)
//   expiresAt — ISO date string for TTL mechanism (satisfies manuscript claim)
export const MOCK_LISTINGS = [];
