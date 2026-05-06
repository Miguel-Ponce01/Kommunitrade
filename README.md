# 🛒 KomuniTrade

> **Davao's Premier Hyper-local Marketplace Engine** 🏙️🚀

KomuniTrade is a high-velocity, community-driven marketplace application designed to revolutionize commerce within Davao City's barangays. Built as a high-fidelity prototype for academic defense, it leverages **Computer Vision (AI)** and **Geospatial Authentication** to ensure that every listing is verified, local, and trustworthy.

---

## ✨ Key Features (Academic Defense Edition)

### 🛰️ **Anti-Gravity AI Marketplace Engine**
Native integration with **Google Gemini 1.5 Flash** for "Zero-Friction" listing creation.
- **Visual Intelligence**: Automated item identification, categorization, and fair-market price estimation (₱).
- **Dual-Model Failover**: Integrated redundancy that automatically pivots to `gemini-pro-vision` if the primary signal is interrupted.
- **Hardware-Level Processing**: On-device image compression ensures lightning-fast uploads even on low-bandwidth neighborhood networks.

### ⏱️ **Context & Time Mark Engine**
A proprietary verification system that anchors digital listings to physical reality.
- **GPS Authentication**: Captures real-time coordinates and maps them to the nearest Davao City barangay.
- **Time-Stamping**: Hard-coded digital "Time Marks" prevent listing spoofing and ensure all items are current.
- **Visual Evidence**: Real-time overlays on item photos provide immediate proof of location and time for potential buyers.

### 🛡️ **Academic Defense Mode (TTL)**
A specialized evaluation mode designed to showcase the system's "Anti-Scam" logic.
- **Rapid Lifecycle**: Toggles a strict **1-hour Time-to-Live (TTL)** for listings, demonstrating the automated expiration and cleanup mechanism.
- **Technical Module Output**: A real-time developer console (Tech-Log) that exposes the system's raw JSON payloads, API status codes, and confidence scores for faculty review.

### 🎨 **Premium "Nature-Tech" Identity**
A sophisticated, emerald-themed design system optimized for trust and high-performance.
- **Premium Item Cards**: Enhanced layout with bold typography, color-coded condition badges, and high-visibility price/time metadata.
- **Glassmorphic UI**: High-fidelity frosted glass panels, shimmering skeleton loaders, and hardware-accelerated animations (60FPS).
- **Typography**: Utilizing `Outfit` for bold technical headings and `Inter` for precise metadata.

### 🌍 **Hyper-Local Personalization**
Ensuring the app feels like it was built for your specific Davao neighborhood.
- **Multi-Language Engine**: Seamless toggling between **English** and **Natural Tagalog**, with community-aware phrasing.
- **Condition Scale**: A standardized 5-point quality assessment (New to Poor) with color-coded visual indicators.
- **Enhanced Profile**: Robust personalization including Bio, Profile Photo, and an editable "Community Status" box.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Core** | ⚛️ React 18 + Vite |
| **Backend / Database** | 🔥 Firebase Cloud Firestore |
| **Authentication** | 🔐 Firebase Anonymous Auth |
| **Computer Vision** | 🧠 Google Gemini 1.5 (Multi-modal) |
| **Geospatial Logic** | 🗺️ Geohash Encoding & Haversine Algorithms |
| **Animations** | ✨ CSS Keyframes (GPU Accelerated) |
| **Icons** | 🌠 Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- A valid **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

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
    VITE_GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

### 💻 Running the App
```bash
npm run dev
```
Navigate to `http://localhost:5174` (or your local Vite port).

---

## 🗺️ Implementation Roadmap

- [x] **Phase 1**: High-Fidelity UI Prototype & Brand Identity.
- [x] **Phase 2**: Integration of "Anti-Gravity" AI Engine for Computer Vision.
- [x] **Phase 3**: Real-time Firebase Backend (Firestore Sync).
- [x] **Phase 4**: Geospatial Authentication & Barangay Mapping.
- [x] **Phase 5**: "Context & Time Mark" Engine for physical verification.
- [x] **Phase 6**: "Defense Mode" Toggle & Technical Module Console.
- [x] **Phase 7**: Performance Optimization (Skeleton Loading & Memoization).

---
*🎓 Built as an Advanced Information Management Capstone Project.*
