# 🛒 KomuniTrade

> **Your Trusted Hyper-local, Community-Driven Marketplace in Davao City** 🏙️

KomuniTrade is a modern, mobile-first web application designed to simplify buying and selling within immediate neighborhoods (barangays). By focusing on geographic proximity and community trust, it ensures a safe, frictionless, and convenient commerce experience for everyone.

---

## ✨ Key Features (MVP Prototype)

📱 **Mobile-First & Desktop Ready**
A highly polished, app-like interface optimized for smartphones (bottom dock navigation), alongside a sophisticated editorial desktop view featuring a persistent sidebar and grid layouts.

🤖 **AI-Powered "Zero-Friction" Posting**
Integrated natively with **Google's Gemini 1.5 Flash AI**. Simply snap or upload a photo, and the AI will analyze the image to instantly generate a high-conversion title, accurate categorization, and optimized descriptions—reducing listing time to seconds.

🎨 **Premium Editorial Brand Identity**
Built with a vibrant, trustworthy design system:
- **Linen Base (#FAF9F6)**: A warm, eye-comforting background.
- **Deep Indigo (#4834D4)**: Structural anchors and sidebar navigation.
- **Muted Apricot (#FD9644)**: High-energy primary actions.
- **Pale Turquoise (#81ECEC)**: Subtle micro-interaction hover states and system feedback.
- **Typography**: Utilizing the native Apple ecosystem font `SF Pro Display` paired with elegant `Georgia` serif accents.

🔐 **Seamless Glassmorphic Authentication**
A beautiful, pop-up modal authentication system (inspired by Carousell) directly on the landing page, allowing users to sign up or log in without jarring redirects.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | ⚛️ React 18 |
| **Build Tool** | ⚡ Vite |
| **Routing** | 🛣️ React Router v6 |
| **Styling** | 🎨 Vanilla CSS (Custom Variables, Flexbox/Grid/Masonry) |
| **AI Integration** | 🧠 Google Gemini 1.5 Flash API |
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

* 🧠 **Gemini API**: Powers the automated image recognition and text generation for new listings.
* 🖼️ **Unsplash Source API**: Dynamically fetches high-quality, realistic placeholder images for dummy listings.
* ⚡ **Simulated Endpoints**: Core features like Authentication utilize simulated data to mimic real backend behavior for presentation purposes.

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

- [x] **Phase 1**: High-Fidelity UI Prototype & Mock Data generation.
- [x] **Phase 2**: Integration of Real AI (Google Gemini) for automated, zero-friction listing creation.
- [x] **Phase 3**: Editorial Rebrand (Linen/Indigo aesthetic, Masonry grids, Glassmorphic Modals).
- [ ] **Phase 4**: Backend Integration with Firebase (Firestore & Storage) for real-time data persistence and image uploads.
- [ ] **Phase 5**: Anonymous real-time chat system implementation for buyer-seller communication.

---
*🎓 Built as a Capstone Project focusing on community trust, safety, and hyperlocal commerce.*
