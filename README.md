# 🛒 KomuniTrade

> **Your Trusted Hyper-local, Community-Driven Marketplace in Davao City** 🏙️

KomuniTrade is a modern, mobile-first web application designed to simplify buying and selling within immediate neighborhoods (barangays). By focusing on geographic proximity and community trust, it ensures a safe, frictionless, and convenient commerce experience for everyone.

---

## ✨ Key Features (MVP Prototype)

📱 **Mobile-First Experience**
A highly polished, app-like interface optimized for smartphones, ensuring seamless accessibility.

📍 **Hyperlocal Geographic Filtering**
Browse and discover listings specific to your local barangay in Davao City instantly via intuitive filtering.

🤖 **AI-Assisted Frictionless Posting**
A streamlined "Sell an Item" interface. Upload an image, and our simulated AI instantly categorizes and drafts a listing for you.

🎨 **Modern & Premium UI/UX**
Built with a vibrant, trustworthy color palette, stunning glassmorphism effects, interactive animations, and modern typography (Plus Jakarta Sans).

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | ⚛️ React 18 |
| **Build Tool** | ⚡ Vite |
| **Routing** | 🛣️ React Router v6 |
| **Styling** | 🎨 Vanilla CSS (Custom Variables, Flexbox/Grid) |
| **Icons** | 🌠 Lucide React |
| **Containerization** | 🐳 Docker |

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 📥 Installation
1. Clone the repository or navigate to the project folder:
   ```bash
   cd KomuniTrade
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```

### 💻 Running the App Locally

**🐳 Using Docker (Recommended)**
Start the Vite development server within an isolated Docker container:
```bash
docker compose up
```

**📦 Using npm directly**
Start the local Vite development server:
```bash
npm run dev
```
Once running, open your browser and navigate to `http://localhost:5173`.

---

## 🔌 APIs & External Services

Currently, in the **Phase 1 MVP Prototype**, the application operates entirely on the client side using the following external services:

* 🗺️ **OpenStreetMap / Leaflet API**: Powers the interactive community map on the landing page.
* 🖼️ **Unsplash Source API**: Dynamically fetches high-quality, realistic placeholder images for dummy listings.
* ⚡ **Simulated Endpoints**: Core features like Authentication and AI Image Processing utilize simulated delays (`setTimeout`) to mimic real backend behavior.

---

## 🔒 Security & API Encryption Architecture (Phase 2 Roadmap)

To guarantee that the KomuniTrade backend cannot be breached and that user data remains strictly private, we will implement the following security architecture in Phase 2:

1. 🔐 **HTTPS / TLS Encryption (Data in Transit)**: All API communication will be encrypted using TLS 1.2+ to prevent man-in-the-middle (MITM) attacks.
2. 🔑 **JWT & Token Authentication**: API endpoints will require a secure, short-lived JSON Web Token (JWT) in the `Authorization: Bearer` header. Unauthenticated requests will be strictly rejected.
3. 🛡️ **CORS Restrictions**: Cross-Origin Resource Sharing (CORS) will be strictly configured to only accept API requests originating from the official production domain.
4. 🤫 **Environment Secrets**: All sensitive API keys and database credentials will be stored securely in `.env` files, completely hidden from the public frontend codebase.
5. 🚦 **Rate Limiting**: API endpoints will be rate-limited per IP address to prevent brute-force attacks, DDOS, and general abuse.

---

## 🗺️ Project Roadmap

- [x] **Phase 1 (Current)**: High-Fidelity UI Prototype & Mock Data generation.
- [ ] **Phase 2**: Backend Integration with Firebase (Firestore & Storage) for real-time data and image uploads.
- [ ] **Phase 3**: Integration of Real AI (Computer Vision & OCR) for automated, zero-friction listing creation.
- [ ] **Phase 4**: Anonymous real-time chat system implementation for buyer-seller communication.

---
*🎓 Built as a Capstone Project focusing on community trust, safety, and hyperlocal commerce.*
