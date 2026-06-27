# KomuniTrade - Hyperlocal Neighborhood Marketplace

KomuniTrade is a peer-to-peer web application designed to help neighbors in Davao City buy, sell, or barter items locally. The system simplifies listing items, handles secure communications, and incorporates trust and safety features to make local meetups safer.

---

## Table of Contents
* [Local Setup & Development](#local-setup--development)
* [User Guide](#user-guide)
* [How it Works & Key Features](#how-it-works--key-features)
* [Technical Design & Stack](#technical-design--stack)
* [Project Walkthrough & Structure](#project-walkthrough--structure)
* [Database Fields & Collections](#database-fields--collections)
* [Changelog](#changelog)

---

## Local Setup & Development

### What you need
* **Node.js**: Version 20.x or higher
* **Firebase CLI**: Installed globally (`npm install -g firebase-tools`)

### Setup Steps
1. Clone the project and install the dependencies for the frontend:
   ```bash
   npm install
   ```
2. Navigate to the `functions` directory and install the dependencies for the cloud functions:
   ```bash
   cd functions
   npm install
   cd ..
   ```
3. Set up the local environment variables. Create a `.env` file inside the `functions` directory and configure the following keys:
   ```env
   RECAPTCHA_SECRET_KEY="your_recaptcha_secret"
   GEMINI_API_KEY="your_gemini_api_key"
   GEMINI_MODEL="gemini-2.5-flash"
   GOOGLE_VISION_API_KEY="your_vision_api_key"
   ROBOFLOW_API_KEY="your_roboflow_api_key"
   ```

### Running the App
* **Start the Web App**: Run the development server:
  ```bash
  npm run dev
  ```
* **Start Firebase Emulators**: Run the local emulators to test database and function operations locally:
  ```bash
  firebase emulators:start
  ```

---

## User Guide

### 1. Posting an Item
* Click **"Post Item"** in the navigation bar.
* Upload a photo of the product. The app automatically scans the image to identify the item, categorize it, and suggest a title, tags, and reasonable local price.
* Review and edit the suggested details, set your location (Davao barangay), and publish.

### 2. Secure Chat & Safe Meetup Recommender
* If you find an item you like, click **"Chat with Seller"** to start negotiating. Conversations are end-to-end encrypted (ECDH P-256 and AES-GCM) directly in the browser to keep messages private.
* Once a deal is agreed upon, clicking **"Finalize Agreement"** suggests safe public meetup spots (like parks or local precincts) close to the midpoint between both users.

### 3. Meetup PIN Handshake
* After confirming the meeting terms, both parties receive a unique verification PIN.
* During the physical meetup, swap and enter each other's PINs in the app to complete the transaction. Completing a trade safely boosts both users' trust scores.

### 4. Cancellation Rules
* If you need to cancel a meetup before it happens, you can cancel the deal via the receipt screen. This restores the listing back to the marketplace.
* To discourage spam cancellations, the system applies a small trust score penalty (`-5` trust points) to the user who initiated the cancellation.

### 5. Admin Moderation Portal
* Admins can access the moderation portal to review reported chat issues, check biometric verification submissions, manage disputes, and manually adjust trust scores if rules are violated.

---

## How it Works & Key Features

* **Smart Listing Suggestions**: Combines image classification models (Roboflow workflows) with text OCR (Google Vision) and Gemini to automatically generate listings from a single photo.
* **Biometric Profile Verification**: Sellers can verify their identity by uploading a government ID and a selfie. The system uses a multimodal comparison matching model to award verification badges.
* **E2EE Communication**: Enforces local encryption keys so chat details remain private to the two participants.
* **Hyperlocal Geohash Filtering**: Encodes item locations to index and display posts using proximity grids, ensuring you only see deals within your local community or barangay.
* **Environmental Impact Ledger**: Displays structural benefits on user profiles, calculating landfill waste diversion (kg), CO2 reduction offsets, and total money saved.
* **Automatic Expiration**: Scheduled backend jobs automatically clean up inactive or outdated listings after 30 days.

---

## Technical Design & Stack

* **Frontend**: React and Vite (fast, responsive SPA)
* **Backend**: Firebase Cloud Functions (executes server-side logic and API calls securely)
* **Database**: Cloud Firestore (real-time document storage)
* **Encryption**: Web Crypto API (browser-native ECDH key exchange)
* **Geospatial Processing**: Geohash grid coordinates (precision-6) with Haversine distance calculations

---

## Project Walkthrough & Structure

```text
KomuniTrade/
├── functions/                    # Server-side Firebase Cloud Functions
│   ├── faceVerification.js       # ID and selfie matching comparison logic
│   ├── visionProcessor.js        # Image classification and metadata generator
│   └── index.js                  # Cloud functions registration entry point
├── public/                       # Web assets, icons, and themes
├── scripts/                      # Developer setup and data seeding scripts
├── src/                          # React Application Frontend
│   ├── components/               # Maps, Chat modals, and PIN inputs
│   ├── contexts/                 # Authentication state
│   ├── pages/                    # Views (Home, Post, Verification, Admin)
│   └── utils/                    # Geohash math, distance, and local encryption helper
├── firebase.json                 # Firebase deployment configurations
├── firestore.rules               # Security rules for collections
└── README.md                     # Project documentation guide
```

---

## Database Fields & Collections

### `users`
Profiles and reputation levels for registered users:
* `id`: Unique user identifier.
* `email` / `displayName` / `phoneNumber`: Contact details and names.
* `trustScore` / `communityStatus`: User ratings and trust badges.
* `isVerified` / `verificationScore` / `verifiedAt`: Identity matching metrics.

### `listings`
Marketplace items posted by sellers:
* `id` / `sellerId`: Identifiers.
* `title` / `price` / `category` / `condition`: Product details.
* `geohash` / `barangay` / `timeMark`: Location markers.
* `imageUrl` / `description` / `tags`: Listing data.
* `isSold` / `expiresAt`: Status and lifecycle controls.

### `chats` & `messages`
Real-time negotiations:
* `chats` collection: `participants`, `lastMessage`, `lastTimestamp`, `itemId`.
* `messages` sub-collection: `text` (encrypted), `senderId`, `timestamp`, `isEncrypted`.

### `transactions`
Meetup details and receipts:
* `reference_number` / `agreed_price` / `payment_method` / `meetup_location`: Transaction specifications.
* `buyerId` / `sellerId` / `status`: Negotiation tracking.

### `reports` & `disputes`
Flagging behavior and admin monitoring cases:
* `reports`: `reporterId`, `reportedUserId`, `chatId`, `reason`, `status`.
* `disputes`: `transactionId`, `reporterId`, `description`, `evidenceUrls`, `status`.

---

## Changelog

* **June 2026**: Fixed a race condition in `GoogleMap.jsx` where Google Maps API script loaded slower than Google Identity SDK (resolved blank black screens on publish). Overhauled trust score timelines, midpoint hotspots recommendations, and PIN handshakes.
* **May 2026**: Migrated Roboflow classifier and facial verification server-side to proxy API requests and secure credentials. Implemented local end-to-end encryption hooks and geohash neighbor scanning.
