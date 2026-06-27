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
* [Deployment & Technical Project Documentation](#deployment--technical-project-documentation)
  * [1. Deployment Strategy Explanation](#1-deployment-strategy-explanation)
  * [2. Technical Justification](#2-technical-justification)
  * [3. System Configuration and Setup](#3-system-configuration-and-setup)
  * [4. Frontend Deployment](#4-frontend-deployment)
  * [5. Backend and Data Processing Configuration](#5-backend-and-data-processing-configuration)
  * [6. Machine Learning Configuration](#6-machine-learning-configuration)
  * [7. Deployment Challenges Analysis](#7-deployment-challenges-analysis)
  * [8. UI/UX Refinement](#8-uiux-refinement)
  * [9. Deployment Proof and Evidence](#9-deployment-proof-and-evidence)
  * [10. Reflection](#10-reflection)
  * [11. Deployment Readiness Assessment](#11-deployment-readiness-assessment)
  * [12. Limitations and Recommendations](#12-limitations-and-recommendations)


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

---

## Deployment & Technical Project Documentation

### 1. Deployment Strategy Explanation
KomuniTrade uses a serverless cloud-based deployment strategy centered on the **Firebase Cloud Platform** and integrated AI API services. 

* **Frontend Hosting (Firebase Hosting):** The client-side single-page application (SPA), built using React 18 and Vite, is compiled into optimized static assets and deployed to Firebase's global content delivery network (CDN). Rewrite rules route all endpoints to `index.html` to allow React Router to manage client-side routing.
* **Serverless Backend (Firebase Cloud Functions):** Server-side operations are handled by Firebase Cloud Functions (v2 HTTPS callable functions). This avoids client-side API key exposure and offloads computationally heavy operations (such as image compression, API aggregation, and data masking) from low-end mobile devices to Google's backend infrastructure.
* **Database & Sync (Cloud Firestore):** Firestore manages user profiles, listings, chats, transactions, trust score logs, and reports. Real-time document listeners (`onSnapshot`) sync changes to chats, listings, and agreements instantly without constant HTTP polling.
* **Asset Storage (Firebase Cloud Storage):** Handles secure storage of product images and identity verification uploads (selfies and government-issued IDs), applying strict Firebase Storage rules to prevent unauthorized reads.

### 2. Technical Justification
The serverless backend architecture was chosen over a traditional monolithic server for several key reasons:
* **API Key Security & Confidentiality:** Executing image classification (Roboflow), optical character recognition (Google Vision), and LLM content generation (Gemini) requires highly confidential API keys. Storing these keys in client-side code exposes them to reverse-engineering. Offloading these calls to Cloud Functions keeps all credentials secure in environment variables.
* **Serverless Cost-Efficiency & Elastic Scaling:** The platform utilizes Firebase's Spark plan, which operates within a generous free tier. Cloud Functions scale to zero when inactive, avoiding running server costs, and spin up automatically to handle peak traffic.
* **Image Preprocessing Offloading:** Using the server-side `sharp` library to preprocess, resize, and compress images (JPEG quality 80, max 1024x1024) reduces the base64 payload size by approximately 65%. This speeds up API transmission times and reduces bandwidth consumption on mobile networks.
* **Data Privacy Compliance (DPA 2012):** For identity verification, the system extracts the user's full name, birth date, and ID number. To comply with the Philippines' Data Privacy Act of 2012 (DPA), Cloud Functions mask this data. The full ID number is never written to Firestore; instead, only the last four digits are stored (`idNumberLast4`), and the images are deleted or secured with read restrictions.

### 3. System Configuration and Setup
* **Hardware and Environment Requirements:** Node.js version 20.x or higher, Git, and Firebase CLI. Runs on any desktop, tablet, or mobile modern web browser (Chrome, Safari, Firefox, Edge).
* **API Credentials (configured in `functions/.env`):**
  ```env
  RECAPTCHA_SECRET_KEY="your_recaptcha_private_key"
  GEMINI_API_KEY="your_google_gemini_api_key"
  GEMINI_MODEL="gemini-2.5-flash"
  GOOGLE_VISION_API_KEY="your_google_cloud_vision_api_key"
  ROBOFLOW_API_KEY="your_roboflow_private_workspace_api_key"
  ```
* **Configuration Files:** `firebase.json` for hosting rewrite rules, `firestore.rules` for collection rules (securing chat threads, listing modifications, and preventing self-verification), and `storage.rules` for asset validation.

### 4. Frontend Deployment
The React application frontend is deployed using the following pipeline:
1. **Compilation & Optimization:** Run `npm run build` to compile JSX, minify CSS, and generate chunked JavaScript files into the `/dist` directory.
2. **Caching Strategy:** `firebase.json` applies static headers to static images, stylesheets, and scripts to leverage browser caching (`Cache-Control: public, max-age=31536000, immutable`).
3. **Deployment Command:** Run `firebase deploy --only hosting` to upload assets to the Firebase global CDN.

### 5. Backend and Data Processing Configuration
* **Geospatial Processing (Hyperlocal Filtering):** Item coordinates are encoded into a 6-character Geohash string (representing a ~1.22 km × 0.61 km boundary box). When browsing listings, the system queries the center Geohash and its 8 adjacent neighbors from Firestore, executing a secondary Haversine formula calculation in-memory to filter items precisely within the user's selected radius.
* **Image Compression & Transformation:** Base64 image payloads or URLs are processed on the backend using the `sharp` library to compress images (JPEG quality 80, 1024x1024 max dimensions) before running vision and matching models.
* **Real-time Synchronization:** Firestore collections use `onSnapshot` real-time listeners to sync chat messages and transaction status updates instantly.

### 6. Machine Learning Configuration
* **Listing Analysis Pipeline:**
  1. *Google Cloud Vision (Parallel Call):* Performs text OCR and CNN label detection on uploaded listing photos.
  2. *Roboflow Workflows (Parallel Call):* Runs object detection to identify item class name and confidence score.
  3. *Google Gemini Synthesis:* Takes the raw image, OCR text segments, CNN labels, and user hint, prompting Gemini 2.0/2.5 Flash to return a structured JSON string containing suggested title, strict category (Electronic, House, Books, Clothing, Food, Service, Furniture, Vehicles, Waste, Other), tags, Philippine Peso (PHP) suggested price, and food expiry estimates.
* **Biometric Identity Verification Pipeline:**
  Sellers upload a government ID card and a live selfie. The `verifyUserIdentity` Cloud Function calls Gemini models (utilizing a fallback array of `gemini-2.5-flash`, `gemini-2.5-flash-lite`, and `gemini-flash-latest`) to compare faces, verify ID documents, analyze image quality (blur, glare, shadows, dark), and extract user metadata securely. A confidence score $\ge 80$ automatically upgrades the user status to `VERIFIED` and logs a trust audit trail. A score of 70-79 triggers a `PENDING_REVIEW` state in the Admin Moderation Portal, while scores under 70 default to `FAILED`.

### 7. Deployment Challenges Analysis
* **Map and Internet Dependency:**
  * *Challenge:* Hyperlocal listing browsing and meetup spot locator depend on Google Maps and internet access. In low-coverage areas, map renders may fail or coordinates fail to resolve.
  * *Mitigation:* The system uses Firestore's offline persistence to support offline listing and chat browsing. In addition, a fallback manual Barangay dropdown is provided in the listing wizard if GPS fails. An offline queue registers and uploads transaction agreements and chat messages once connection returns.
* **Route Calculation Delay:**
  * *Challenge:* Generating meetup spot paths in real-time between buyer and seller coordinates creates high API processing latency.
  * *Mitigation:* Spot matching is asynchronous. The system suggests safe spots first using a static lookup of police precinct boundaries and city parks within overlapping Geohashes. Navigation paths are loaded asynchronously onto the maps card once the main selection has completed.
* **Machine Learning Accuracy Limitations:**
  * *Challenge:* Bad lighting, cluttered backgrounds, or rare items can skew AI-suggested categories and prices.
  * *Mitigation:* The system treats AI outputs as editable suggestions. The user review form in the wizard allows overriding titles, categories, prices, and tags. Ground truth is logged to `ai_predictions` when users publish listings to allow continuous tuning using macro evaluation metrics.

### 8. UI/UX Refinement
* **Visual Identity & Brand Canvas:** The web app features a dual-canvas design to balance brand personality with transaction safety. Marketing and landing pages use a dark theme canvas (`#000000`) with large Neue Haas Grotesk display type, while transaction pages (listing form, chats, receipt screens) transition to a light cream-mint canvas (`#fbfbf5`) using pastel aloe (`#c1fbd4`) and pistachio (`#d4f9e0`) greens to reduce user friction and promote trust.
* **Micro-interactions:** Clear visual indicators for trust badges, real-time message delivery animations, and interactive PIN inputs.

### 9. Deployment Proof and Evidence
* **AI Model Macro Evaluation (evaluated using `evaluate-performance.cjs`):**
  * Overall category classification accuracy: **86.2%**
  * Google Vision OCR printed text accuracy: **92.3%**
  * Overall system OCR text extraction accuracy: **82.9%** (with average latency of 3.1s).
  * Macro Average F1-score across 10 categories: **85.2%**
* **ISO/IEC 25010 Quality Evaluation Grand Mean:** **4.74 / 5.00** (Verbal Interpretation: *Outstanding*). Breakdown: Functional Suitability (4.83), Usability (4.79), Security (4.85), Reliability (4.70), and Performance Efficiency (4.65).
* **System Usability Scale (SUS) Score:** **84.50 / 100** (Grade A, Adjective Rating: *Excellent*).

### 10. Reflection
* **Key Lessons & Architecture Transitions:** Migrating image processing and AI orchestration from heavy client-side scripts (which caused high mobile CPU consumption and exposed secret keys) to Firebase serverless Cloud Functions secured API keys and reduced listing analysis times from 12 seconds to 3.1 seconds.
* **Trade-offs:** Maintaining a local Geohash/Haversine hybrid matching engine was selected over a full PostGIS database to minimize hosting costs while ensuring neighborhood-level proximity search performance.

### 11. Deployment Readiness Assessment
The KomuniTrade application is classified as **Ready for Public Beta Release**. Uptime matches the serverless 99.9% target, local E2EE keys are secured via the browser's native Web Crypto API, and the grand evaluation mean of 4.74 verifies a highly secure, functional, and user-friendly experience.

### 12. Limitations and Recommendations
* **System Limitations:** High reliance on external API quotas (Gemini, Vision, Roboflow) which require billing limits monitoring. Offline operations are limited to cache memory; finalizing meetups or PIN checkouts requires active internet. Midpoint recommendations rely on static coordinates datasets rather than dynamic availability.
* **Future Recommendations:**
  1. *Automated Path Routing:* Integrate Directions APIs (like OpenStreetMap or Google Directions) to display optimal transit/pedestrian routes directly on the midpoint map.
  2. *Native Mobile Shell:* Recompile using React Native or Flutter to access native camera features, secure keychain hardware storage, and push notifications.
  3. *Behavioral Anomaly Detection:* Implement ML threat models to identify and block bot activities based on trade speed, listing frequencies, and cancellations.
  4. *Multilingual Interface:* Incorporate Tagalog, Bisaya, and Cebuano translations to enhance hyperlocal accessibility.

