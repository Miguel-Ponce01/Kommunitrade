# 🛒 KomuniTrade

> **Your Trusted Hyper-local, Community-Driven Marketplace in Davao City** 🏙️

KomuniTrade is a modern, mobile-first web application designed to simplify buying and selling within immediate neighborhoods (barangays). By focusing on geographic proximity and community trust, it ensures a safe, frictionless, and convenient commerce experience for everyone.

---

## ✨ Key Features (MVP Prototype)

📱 **Mobile-First & Theme-Aware UI**
A highly polished, app-like interface optimized for smartphones with a premium bottom-dock navigation. Features a sophisticated **High-Contrast Dark Mode** and a **Clean Light Mode**, both using glassmorphic design principles and fluid typography (`clamp`).

🛡️ **Security Protocol Dashboard**
A dedicated command-center interface that visualizes the application's underlying security layers. This includes real-time monitoring of:
- **E2EE Symmetric Key Rotation**: Visual proof of end-to-end encrypted messaging.
- **TTL Batch Purge Protocol**: Real-time status of the automated data lifecycle management.
- **Anonymous ID Verification**: Cryptographic signature validation for temporary community sessions.

🤖 **AI-Powered "Zero-Friction" Posting**
Integrated natively with **Google's Gemini 1.5 Flash AI**. Simply snap or upload a photo, and the AI analyzes the image to instantly generate high-conversion titles, accurate categorization, and optimized descriptions—reducing listing time to seconds.

🎨 **Localized Community Identity**
Deeply integrated with the **Davao City** local context. The UI features immersive nature-themed banners (Mount Apo area) and community-centric labels to build trust and familiarity within Philippine barangays.

🔗 **Personalized Shop Sharing**
Functional profile personalization allowing users to customize their anonymous identity and generate personalized shop links. Integrated with the browser's native sharing API for effortless community growth.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | ⚛️ React 18 |
| **Build Tool** | ⚡ Vite |
| **State Management** | 🎣 React Hooks (useContext, useTheme, useLanguage) |
| **Routing** | 🛣️ React Router v6 (Deep Linking Support) |
| **Styling** | 🎨 Vanilla CSS (Theme-Aware Variables, Fluid Design) |
| **Backend / DB** | 🔥 Firebase (Auth, Firestore, Storage) |
| **AI Integration** | 🧠 Google Gemini 1.5 Flash API |
| **Icons** | 🌠 Lucide React |
| **Containerization** | 🐳 Docker |

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 📥 Installation
1. Clone the repository or navigate to the project folder.
2. Install dependencies:
   ```bash
   npm install
   ```

### 💻 Running the App Locally

**🐳 Using Docker (Recommended)**
```bash
docker compose up
```

**📦 Using npm directly**
```bash
npm run dev
```
Once running, open your browser and navigate to `http://localhost:5173`.

---

## 🔌 APIs & External Services

Currently, in the **Production-Ready Prototype**, the application utilizes the following external services:

* 🔥 **Firebase Cloud Firestore**: Powers the real-time marketplace feed, listing persistence, and chat messaging.
* 🔐 **Firebase Auth**: Manages anonymous session persistence for trust-based interactions.
* 🧠 **Gemini API**: Powers the automated image recognition and text generation for new listings.
* 🏙️ **Unsplash Source API**: Dynamically fetches localized, high-quality community imagery.

---

## 🔒 Security Architecture (Defense Ready)

To guarantee that the KomuniTrade ecosystem remains strictly private and secure, we have implemented the following core protocols:

1. 🔐 **End-to-End Encryption (E2EE)**: Messaging payloads are encrypted on the client side before reaching Firestore, ensuring only the buyer and seller can read the content.
2. 🔑 **Anonymous Identity Protocol**: Users are identified by unique, cryptographic `Agent_IDs`, removing the need for personally identifiable information (PII).
3. 🛡️ **TTL (Time-to-Live) Data Purging**: Automated cleanup scripts expire and delete old listings and expired communication keys from the distributed cache.
4. 🚦 **Rate Limiting & CORS**: Strictly configured access controls to prevent brute-force attacks and unauthorized origin requests.

---

## 🗺️ Project Roadmap

- [x] **Phase 1**: High-Fidelity UI Prototype & AI Image Recognition (Gemini 1.5).
- [x] **Phase 2**: Real-time Firebase Integration (Firestore, Storage, Anonymous Auth).
- [x] **Phase 3**: Editorial Rebrand & Theme-Aware Design System.
- [x] **Phase 4**: **Security Protocol Dashboard** implementation for academic demo.
- [x] **Phase 5**: Anonymous real-time chat with E2EE payload encryption.
- [x] **Phase 6**: Localization (Davao City context & multi-language support).
- [x] **Phase 7**: Deployment to Google Cloud / Firebase Hosting.

---
*🎓 Built as a Capstone Project focusing on community trust, safety, and hyperlocal commerce.*
