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
export const MOCK_LISTINGS = [
  {
    id: "1",
    title: "iPhone 11 — 64GB, Good Condition",
    category: "Electronic",
    price: 12000,
    barangay: "Obrero",
    lat: 7.0750, lng: 125.6180,
    geohash: encodeGeohash(7.0750, 125.6180),
    imageUrl: "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&q=80&w=400",
    description: "Used for 2 years, no scratches. Battery health 85%. Comes with original box and charger. Meetup at Obrero Plaza.",
    sellerId: "anon_123",
    createdAt: "2 hours ago",
    expiresAt: daysFromNow(28),
    condition: "Used",
    verified: true
  },
  {
    id: "2",
    title: "Plumbing Repair Service",
    category: "Service",
    price: 450,
    barangay: "Obrero",
    lat: 7.0750, lng: 125.6180,
    geohash: encodeGeohash(7.0750, 125.6180),
    imageUrl: "https://images.unsplash.com/photo-1581560201227-339cece25e7e?auto=format&fit=crop&q=80&w=400",
    description: "Available for basic plumbing repairs around the neighborhood. Experienced and reliable.",
    sellerId: "anon_456",
    createdAt: "5 hours ago",
    expiresAt: daysFromNow(5), // Expires soon — shows badge
    condition: null,
    verified: true
  },
  {
    id: "3",
    title: "Electric Fan (Asahi) — 16 inch",
    category: "House",
    price: 800,
    barangay: "Agdao",
    lat: 7.0820, lng: 125.6270,
    geohash: encodeGeohash(7.0820, 125.6270),
    imageUrl: "https://images.unsplash.com/photo-1565151443681-49651cfa85bf?auto=format&fit=crop&q=80&w=400",
    description: "Working perfectly, 3-speed. Selling because moving out next week.",
    sellerId: "anon_789",
    createdAt: "1 day ago",
    expiresAt: daysFromNow(3), // Expires very soon
    condition: "Used",
    verified: false
  },
  {
    id: "4",
    title: "Homemade Banana Bread — Fresh",
    category: "Food",
    price: 150,
    barangay: "Matina",
    lat: 7.0560, lng: 125.5930,
    geohash: encodeGeohash(7.0560, 125.5930),
    imageUrl: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&q=80&w=400",
    description: "Freshly baked banana bread. Pick up only. Order before 3PM for same-day.",
    sellerId: "anon_101",
    createdAt: "2 days ago",
    expiresAt: daysFromNow(1), // Expires tomorrow
    condition: "New",
    verified: true
  },
  {
    id: "5",
    title: "Scrap Metal & Cartons",
    category: "Waste",
    price: 50,
    barangay: "Buhangin",
    lat: 7.1000, lng: 125.6350,
    geohash: encodeGeohash(7.1000, 125.6350),
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400",
    description: "Assorted cartons and scrap metal ready for junk shop pickup.",
    sellerId: "anon_202",
    createdAt: "3 days ago",
    expiresAt: daysFromNow(0), // Expires today
    condition: "Used",
    verified: false
  },
  {
    id: "6",
    title: "Calculus by Leithold (10th Ed)",
    category: "Books",
    price: 350,
    barangay: "San Isidro",
    lat: 7.0900, lng: 125.6100,
    geohash: encodeGeohash(7.0900, 125.6100),
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
    description: "College textbook, some highlights but pages intact. Great for engineering students.",
    sellerId: "anon_301",
    createdAt: "4 hours ago",
    expiresAt: daysFromNow(25),
    condition: "Used",
    verified: true
  },
  {
    id: "7",
    title: "Preloved Nike Air Max — Size 10",
    category: "Clothing",
    price: 2800,
    barangay: "Poblacion",
    lat: 7.0695, lng: 125.6120,
    geohash: encodeGeohash(7.0695, 125.6120),
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400",
    description: "Authentic, worn 3x only. With box. Selling because wrong size.",
    sellerId: "anon_401",
    createdAt: "6 hours ago",
    expiresAt: daysFromNow(20),
    condition: "Like New",
    verified: true
  },
  {
    id: "8",
    title: "Wooden Dining Table — 6 Seater",
    category: "Furniture",
    price: 3500,
    barangay: "Bagumbayan",
    lat: 7.0780, lng: 125.6200,
    geohash: encodeGeohash(7.0780, 125.6200),
    imageUrl: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&q=80&w=400",
    description: "Solid wood, minor scratches. Moving out sale. Pick-up only.",
    sellerId: "anon_501",
    createdAt: "1 day ago",
    expiresAt: daysFromNow(15),
    condition: "Used",
    verified: false
  },
  {
    id: "9",
    title: "Samsung Galaxy A54 — 128GB",
    category: "Electronic",
    price: 9500,
    barangay: "Greenpark Village",
    lat: 7.0850, lng: 125.6300,
    geohash: encodeGeohash(7.0850, 125.6300),
    imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&q=80&w=400",
    description: "Complete set with box. Screen perfect, minor crack on back glass.",
    sellerId: "anon_601",
    createdAt: "8 hours ago",
    expiresAt: daysFromNow(22),
    condition: "Used",
    verified: true
  },
  {
    id: "10",
    title: "Math Tutoring — Grade 7-10",
    category: "Service",
    price: 200,
    barangay: "Sampaguita",
    lat: 7.0720, lng: 125.6150,
    geohash: encodeGeohash(7.0720, 125.6150),
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400",
    description: "Per hour rate. College student tutor. Home visit within the subdivision.",
    sellerId: "anon_701",
    createdAt: "12 hours ago",
    expiresAt: daysFromNow(7),
    condition: null,
    verified: true
  },
  {
    id: "11",
    title: "School Uniform Set — Size M",
    category: "Clothing",
    price: 500,
    barangay: "Phase 1",
    lat: 7.0800, lng: 125.6220,
    geohash: encodeGeohash(7.0800, 125.6220),
    imageUrl: "https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?auto=format&fit=crop&q=80&w=400",
    description: "Complete PE and daily uniform set. Used 1 semester only.",
    sellerId: "anon_801",
    createdAt: "2 days ago",
    expiresAt: daysFromNow(12),
    condition: "Used",
    verified: false
  },
  {
    id: "12",
    title: "Lechon Manok — Whole Chicken",
    category: "Food",
    price: 250,
    barangay: "Pag-asa",
    lat: 7.0650, lng: 125.6050,
    geohash: encodeGeohash(7.0650, 125.6050),
    imageUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&q=80&w=400",
    description: "Charcoal roasted. Order by 10AM, pick up by 5PM. Liver sauce included.",
    sellerId: "anon_901",
    createdAt: "3 days ago",
    expiresAt: daysFromNow(0), // Expires today
    condition: "New",
    verified: true
  },
];
