# 🛒 KomuniTrade

> **Davao's Premier Hyper-local Marketplace Engine** 🏙️🚀

KomuniTrade is a high-velocity, community-driven marketplace application designed to revolutionize commerce within Davao City's barangays. Built as a high-fidelity prototype for academic defense, it leverages **Computer Vision (AI)**, **Geospatial Authentication**, and a **Universal Responsive Framework** to ensure a seamless experience on any device.

---

## ✨ Key Features (Academic Defense Edition)

### 📱 **Universal Responsiveness Engine**
Engineered for "Zero-Friction" accessibility across all hardware platforms.
- **Bulletproof Layout**: Fluid typography and adaptive grid systems ensure the platform is perfect on 320px (Mobile) to 4K (Desktop).
- **Mobile-First UX**: Implemented sleek "Bottom Sheets" for authentication and a sticky "Bottom Navigation Bar" for effortless one-handed use on smartphones.
- **Dynamic Orientation**: Optimized for both vertical and horizontal viewports with automated spacing adjustments.

### 🎨 **Bespoke "Nature-Tech" Branding**
A sophisticated, emerald-themed design system optimized for trust and high-performance.
- **Custom SVG Identity**: Integrated a handcrafted vector logo representing Davao's community spirit (the home-basket hybrid).
- **Glassmorphic UI**: High-fidelity frosted glass panels, shimmering skeleton loaders, and hardware-accelerated animations (60FPS).
- **Fluid Typography**: Utilizing `Outfit` for bold technical headings and `Inter` for precise metadata, scaling dynamically with the viewport.

### 🛰️ **Anti-Gravity AI Marketplace Engine**
Native integration with **Google Gemini 1.5 Flash** for "Zero-Friction" listing creation.
- **Visual Intelligence**: Automated item identification, categorization, and fair-market price estimation (₱).
- **Hardware-Level Processing**: On-device image compression ensures lightning-fast uploads even on low-bandwidth neighborhood networks.

### 🌍 **Hyper-Local Bilingual Support**
Ensuring the app feels like it was built for your specific Davao neighborhood.
- **One-Touch Toggle**: Seamlessly switch between **English** and **Tagalog** via a minimalist footer control.
- **Geospatial Mapping**: Real-time GPS authentication anchors digital listings to physical Davao City barangays.

### 💾 **Data Persistence & Real-time Sync**
Built on a high-availability serverless architecture for reliable neighborhood trading.
- **Firebase Firestore**: Utilizes a NoSQL document-based structure for sub-second real-time synchronization of item listings across all active clients.
- **Offline Persistence**: Implemented local caching so users can browse previously loaded listings even with intermittent Davao neighborhood connectivity.
- **Scalable Geo-Queries**: Optimized data structure to support rapid proximity-based filtering without performance degradation.

### 🛠️ **Developer Tech-Log (Defense Module)**
A specialized evaluation console designed for technical audit during faculty review.
- **JSON Payloads**: Exposes the raw data transmitted between the frontend and Firebase for transparency.
- **API Monitoring**: Real-time tracking of Gemini AI response times and confidence scores.
- **System Health**: Visual indicators for database connection status and geospatial mapping accuracy.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Core** | ⚛️ React 18 + Vite |
| **Styling** | 🎨 Vanilla CSS (Modern Fluid Design) |
| **Backend / Database** | 🔥 Firebase Cloud Firestore |
| **Authentication** | 🔐 Firebase Anonymous Auth |
| **Computer Vision** | 🧠 Google Gemini 1.5 (Multi-modal) |
| **Geospatial Logic** | 🗺️ Google Maps API & Haversine Algorithms |
| **Animations** | ✨ CSS Keyframes (GPU Accelerated) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- A valid **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)
- A **Google Maps API Key** (for geo-location features)

### 📥 Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/Miguel-Ponce01/KomuniTrade.git
    cd KomuniTrade
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables (`.env.local`):
    ```env
    VITE_GEMINI_API_KEY="YOUR_GEMINI_KEY"
    VITE_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_KEY"
    ```

### 💻 Running the App
```bash
npm run dev
```
Navigate to `http://localhost:5173`.

---

## 🗺️ Implementation Roadmap

- [x] **Phase 1**: High-Fidelity UI Prototype & Brand Identity.
- [x] **Phase 2**: Integration of "Anti-Gravity" AI Engine for Computer Vision.
- [x] **Phase 3**: Real-time Firebase Backend (Firestore Sync).
- [x] **Phase 4**: Geospatial Authentication & Google Maps Integration.
- [x] **Phase 5**: "Universal Responsiveness" Overhaul (Mobile, Tablet, PC).
- [x] **Phase 6**: Bilingual (English/Tagalog) Localization Engine.
- [x] **Phase 7**: Final Performance Optimization & Asset Hardening (SVG Migration).

---
*🎓 Built as an Advanced Information Management Capstone Project.*
