# KomuniTrade: Smart Hyperlocal Marketplace

### A Hyperlocal Peer-to-Peer Trading System
**Developed by**: Anthon Miguel Ponce 

---

# QUICK START GUIDE: LOCAL DEVELOPMENT & SETUP

### 1. Prerequisites
- **Node.js**: Version 20.x or higher
- **Firebase CLI**: Global installation (`npm install -g firebase-tools`)

### 2. Installation & Setup
1. Clone the repository and install frontend dependencies:
   ```bash
   npm install
   ```
2. Navigate to the functions directory and install backend dependencies:
   ```bash
   cd functions
   npm install
   cd ..
   ```
3. Set up your environment variables. Create a `.env` file inside the `functions` folder with the following variables:
   ```env
   # Firebase Cloud Functions Environment variables
   RECAPTCHA_SECRET_KEY="your_recaptcha_key"
   GEMINI_API_KEY="your_gemini_api_key"
   GEMINI_MODEL="gemini-2.5-flash"
   GOOGLE_VISION_API_KEY="your_vision_api_key"
   ROBOFLOW_API_KEY="your_roboflow_api_key"
   ```

### 3. Running Locally
- Run the React development server:
  ```bash
  npm run dev
  ```
- Run the Firebase Cloud Functions and Firestore Emulator Suite:
  ```bash
  firebase emulators:start
  ```

---

# USER MANUAL: HOW TO USE KOMUNITRADE

### 1. AI-Powered Hyperlocal Posting
- Click **"Post Item"** on the navigation bar.
- Upload a product photo.
- **Smart Category & Metadata Layer**: The **Roboflow Workflow** (`detect-and-classify`) runs in parallel with **Google Cloud Vision OCR**. 
  - If Roboflow returns category confidence **>= 0.65**, we trust the Roboflow category.
  - If confidence is low, the pipeline falls back to the **DeepSeek/Gemini** LLM category.
  - Google Cloud Vision extracts the text to auto-populate the title, description, tags, suggested price, and food expiry days (if classified as food).
- Click **"Publish"** to list your item.

### 2. E2EE Negotiation & Deal Finalization
- View an item and click **"Chat with Seller"**. Your messages are fully **End-to-End Encrypted (ECDH P-256 + AES-GCM)**.
- Once you negotiate a deal, click **"Finalize Agreement"** to propose meetup details. The system automatically calculates the mid-point between buyer and seller and suggests **safe meetup hotspots** near your center.
- The partner can Accept (which locks the listing and sets `isSold: true`) or Decline.

### 3. Double PIN Handshake Meetup
- Once confirmed, the receipt displays your unique **Verification PIN**.
- During the physical meetup, exchange and input each other's PINs to complete the trade. Success grants a permanent `+5` points to both users' trust scores.

### 4. Deal Cancellation Protocol
- If you need to cancel a confirmed agreement before meeting, open the Transaction Receipt and click **"Cancel Confirmed Deal"**.
- Select a cancellation reason and describe the details.
- **System Impact**:
  - The transaction status changes to `'Cancelled'`.
  - The listing is automatically restored (`isSold: false`) and goes back to the active marketplace.
  - A penalty of **-5 trust points** is deducted from your score to prevent spam cancellations.
  - An E2EE system notice is pushed to the chat, and the partner receives a push notification explaining the cancellation reason.

### 5. Admin Moderation & Auditing
- System administrators can access the **Admin Moderation Portal** to verify user identities, adjust trust scores, resolve disputes, and audit cancelled transactions to view cancellation reasons and comments.

---


# 1. EXECUTIVE SUMMARY

![alt text](image.png)

---

# 2. PROBLEM STATEMENT

| # | Problem |
|---|---------|
| 1 | Existing platforms lack hyperlocal precision - users see listings from far locations |
| 2 | Manual listing creation is time-consuming and discourages casual users |
| 3 | Fraudulent transactions and scams are prevalent due to weak accountability |
| 4 | Search inefficiency as platforms scale with poor retrieval performance |
| 5 | Outdated listings clutter marketplace with no automated lifecycle management |

---

# 3. SOLUTION OVERVIEW

## 3.1 Core Value Proposition

KomuniTrade provides a secure, intelligent, hyperlocal marketplace where:

- AI automates listing creation from a single photo (CNN classification + OCR text extraction)
- Geohash filtering ensures users only see items within their barangay/community
- Seller verification system uses ML confidence scoring + facial recognition to build trust
- Automated listing lifecycle (TTL) removes stale listings after 30 days
- Anonymous communication protects privacy while maintaining accountability

---

# 4. SYSTEM OBJECTIVES

## 4.1 General Objective

> To develop a web-based hyperlocal marketplace system that utilizes Artificial Intelligence to automate listing creation and enhance local buying and selling experiences.

## 4.2 Specific Objectives

| # | Objective | Technology |
|---|-----------|------------|
| 1 | Automatically classify uploaded items and categorize products | Roboflow Serverless Workflows API + Google Cloud Vision label detection (server-side Cloud Function) |
| 2 | Extract text from images to auto-generate titles, tags, and descriptions | Google Cloud Vision text detection API (Cloud Function); refined by Gemini 2.5 Flash LLM |
| 3 | Display relevant listings based on user proximity and search keywords | Geohash encoding (BASE32, precision-6) + 8-neighbor scan + Inverted Index |
| 4 | Assess seller legitimacy using behavioral and transaction data | Trust score algorithm (transaction history, ratings, verification status) |
| 5 | Verify seller identity by comparing government ID and selfie images | Google Gemini 2.5 Flash multimodal API (Cloud Function, confidence threshold ≥ 80%) |
| 6 | Provide authenticated access, listing management, and transaction tracking | Firebase Auth + Cloud Firestore + Storage |
| 7 | Evaluate model performance | Accuracy, Precision, Recall, F1-Score |
| 8 | Evaluate system usability | UAT, SUS surveys |

---

# 5. TECHNICAL ARCHITECTURE

## 5.1 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + Vite | User interface, fast development |
| Backend | Firebase (serverless) | Authentication, database, hosting |
| Database | Cloud Firestore | NoSQL, real-time updates |
| AI/ML - CNN | Google Cloud Vision API + Roboflow (server-side Cloud Function) | Image label detection and custom category classification |
| AI/ML - OCR | Google Cloud Vision API (Cloud Function) | Text extraction from product images |
| AI/ML - Category | Roboflow Serverless Workflows API (`detect-and-classify`) | Custom product category detector (confidence ≥ 0.65 threshold) |
| AI/ML - LLM | Google Gemini 2.5 Flash (Cloud Function) | Smart listing title, tags, price, and food expiry suggestions |
| AI/ML - Facial | Google Gemini 2.5 Flash multimodal (Cloud Function) | ID-to-selfie face match + OCR name/ID extraction (threshold ≥ 80) |
| Geospatial | Custom Geohash (BASE32, 8-neighbor scan) | Location encoding and proximity filtering |
| Search | Inverted Index (in-memory) | Keyword-based listing retrieval |
| Image Processing | Sharp (server-side) | Resize + JPEG compress images before Vision API (quality 80%, max 1024×1024) |
| Expiration | TTL mechanism (Scheduled Cloud Function) | Auto-archive listings after 30 days |
| Hosting | Firebase Hosting | Web deployment |

## 5.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Landing │ │  Auth   │ │  Home   │ │ Details │ │ Profile │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Firebase Services)                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   Firebase   │ │   Firebase   │ │  Cloud       │            │
│  │   Auth       │ │   Firestore  │ │  Functions   │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
          │  AI Layer   │  │  Geohash    │  │   Search    │
          │  CNN + OCR  │  │  Filtering  │  │   Engine    │
          └─────────────┘  └─────────────┘  └─────────────┘
```

## 5.3 Layered Architecture Breakdown

| Layer | Components |
|-------|------------|
| Frontend Web Interface | React components, routing, state management, UI/UX |
| Backend API Server | Firebase Functions, API endpoints, business logic |
| Authentication Module | Multi-factor authentication including Google Sign-in, Email/password login, Phone OTP, session management, and security rules |
| AI Layer | CNN classifier, OCR extractor, facial verification |
| Geohash Filtering Engine | Location encoding, proximity queries, spatial filtering |
| Search Engine | Inverted index, keyword matching, result ranking |
| Database System | Firestore collections, queries, real-time listeners |
| External APIs | Google Vision OCR, public datasets |

---

# 6. CORE FEATURES DETAILED

## 6.1 Feature List with Priority

| Priority | Feature | Description | Status |
|----------|---------|-------------|--------|
| High | Image Upload System | Users can upload item photos | Completed |
| High | User Registration & Login | Secure account creation and authentication | Completed |
| High | CNN Item Classification | Auto-categorize items from images (MobileNet v2) | Completed |
| High | OCR Auto-Tagging | Extract text for titles/descriptions (Tesseract.js + Google Vision) | Completed |
| High | Geohash Location Filtering | Show only nearby listings and surrounding 8 neighbor cells | Completed |
| Medium | Inverted Index Search | Fast keyword search (in-memory inverted index with AND-intersection) | Completed |
| Medium | Transaction History & Receipts | Track past purchases/sales with GCash-style receipts | Completed |
| Medium | Rules & Regulations | Davao-specific consumer guidelines | Completed |
| Medium | Anonymous Chat System | Private buyer-seller communication with E2EE (ECDH P-256 + AES-GCM) | Completed |
| Medium | TTL Auto-Archiving | Auto-expire listings after 30 days via Scheduled Cloud Function | Completed |
| Medium | Language Localization | Support for English (default), Tagalog, and Bisaya | Completed |
| Medium | Davao Cultural Theme | Landing page with Davao-inspired cultural assets and styling | Completed |

## 6.2 Extended Feature Set (Enhanced Objectives)

| Feature | Technology | Description | Status |
|---------|------------|-------------|--------|
| AI Price Suggestion | DeepSeek Chat API (Cloud Function) | Suggest price based on item description and OCR text | Completed |
| Seller Credibility Score | Bayesian confidence scoring | Score based on transaction history, ratings, and verification | Completed |
| Verification Badges | Rule-based scoring (getTrustLevel) | Display trust indicators (Community Member, Verified, Trusted, Elite) | Completed |
| Facial Verification | Google Gemini 1.5 Flash (Cloud Function) | Compare government ID photo with selfie securely server-side | Completed |
| Rating & Feedback System | User input + Bayesian weighting | Buyers rate sellers post-transaction | Completed |

## 6.3 Trust, Safety, and Layout Refactoring (Added in Post-Defense Phase)

To harden the platform and establish a highly secure ecosystem for peer-to-peer trades in Davao City, the following Trust & Safety systems were added:

1. **Double-Sided Verification PIN Handshake**: Protects offline meetup exchanges. Each transaction initializes two random 6-digit PIN codes (Buyer PIN and Seller PIN). During the physical meetup, the seller must input the buyer's PIN and the buyer must input the seller's PIN to complete the trade.
2. **Reputation Progression & Rewards**: Successful transactions validated by the double PIN handshake reward both buyer and seller with a permanent `+5` points to their `trustScore` (capped at 100).
3. **Hyperlocal Safety Safe Spot Suggestions**: During checkout, the app automatically determines the midpoint between the buyer's and seller's coordinates, runs a spatial geohash proximity query, and suggests safe meetup locations (parks, precincts, public hubs) near their midpoint.
4. **Disputes and Violations Reporting**: If a user exhibits bad conduct (e.g. meetup no-shows under Rule 303, listing inaccuracy under Rule 202, counterfeit/receipt forgery under Rule 404), the other party can file a formal dispute. This logs an active issue in the Firestore `disputes` collection.
5. **Impact & Barter Ledger**: Tracks ecological and financial benefits on user profiles:
   - *Money Saved (PHP)*: Calculates 100% of barter trade values and 40% of cash retail transaction values.
   - *Landfill Diversion (kg)*: Estimates 5kg of waste offset per transaction.
   - *CO2 Reduction (kg)*: Estimates 12kg of CO2 emissions saved per transaction.
6. **Trust Score Timeline**: Transparent vertical timeline logs each user's history of trust score changes, showing deltas (e.g. `+5` for trades, `-10` for chat flags, `-15` for upheld disputes) and specific rules applied.
7. **Role-Based Login Guidelines**: A selector on the login interface displays targeted notices outlining roles and codes of conduct for Buyers, Sellers, and general users before authenticating.
8. **Admin Moderation Portal Overhaul**: Expanded horizontal layout replacing collapsible sidebar navigation, featuring action dashboards for:
   - *Users Table*: Search, verify identity, and adjust trust scores with rule tags.
   - *Transactions log*: Audit and inspect verification codes, safe spots, and payments.
   - *Disputes Panel*: Audit reported cases, Dismiss, or Uphold disputes (applying automatic `-15` trust score penalty).

---

# 7. FUNCTIONAL REQUIREMENTS (SRS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | User account creation and login via Email + Password | High |
| FR-02 | User authentication via Google Sign-in and Phone OTP | High |
| FR-03 | Upload item images | High |
| FR-04 | CNN classification within 5 seconds | High |
| FR-05 | OCR text extraction from images | High |
| FR-06 | Auto-generate listing title, category, tags | High |
| FR-07 | AI-based price suggestions | Medium |
| FR-08 | Edit generated listing details before posting | High |
| FR-09 | Geohash-based location filtering | High |
| FR-10 | Inverted index keyword search | Medium |
| FR-11 | Anonymous buyer-seller chat | Medium |
| FR-12 | TTL auto-archive after 30 days | Medium |
| FR-13 | ML credibility score calculation | High |
| FR-14 | Seller verification badge display | Medium |
| FR-15 | Rating submission and storage | Medium |
| FR-16 | Facial verification for seller identity | High |
| FR-17 | Facial similarity matching | High |
| FR-18 | Dashboard analytics for admin | Medium |

---

# 8. NON-FUNCTIONAL REQUIREMENTS

| Category | Requirement |
|----------|-------------|
| Performance | Image classification within 5 seconds; pages load within 3 seconds; confidence score within 3 seconds |
| Security | User authentication, encrypted credentials, secure data storage |
| Usability | First-time users can navigate without training |
| Scalability | Support at least 10,000 listings |
| Reliability | 99% system availability |
| Maintainability | Modular updates for AI components |
| Accuracy | ≥80% classification accuracy |
| Privacy | Anonymous chat, no personal data exposure |

---

# 9. USER STORIES

| Priority | User Story |
|----------|------------|
| Must Have | As a user, I want to create an account so I can securely access the platform |
| Must Have | As a seller, I want to upload item images so I can create listings quickly |
| Must Have | As a seller, I want the system to auto-classify items so I dont manually categorize |
| Must Have | As a seller, I want OCR to extract text so listing info is auto-generated |
| Must Have | As a buyer, I want to view nearby listings so I can find items in my community |
| Should Have | As a buyer, I want to search listings using keywords so I can locate items easily |
| Should Have | As a user, I want anonymous communication so my privacy is protected |
| Could Have | As a user, I want transaction history so I can track previous interactions |
| Must Have | As a buyer, I want to view seller ratings and confidence scores so I can make informed decisions |
| Must Have | As a seller, I want facial verification so buyers trust me more |
| Should Have | As an admin, I want dashboard analytics so I can monitor system performance |

---

# 10. USE CASE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KOMUNITRADE SYSTEM                          │
│                                                                      │
│  ┌──────────────┐                    ┌──────────────────────────┐  │
│  │    BUYER     │                    │         SELLER           │  │
│  └──────┬───────┘                    └────────────┬─────────────┘  │
│         │                                          │                │
│         │  ┌─────────────────────────────────┐    │                │
│         │  │         Use Cases               │    │                │
│         │  │                                 │    │                │
│         ├──│► Register Account               │◄───┤                │
│         │  │                                 │    │                │
│         ├──│► Browse Nearby Listings         │    │                │
│         │  │                                 │    │                │
│         ├──│► Search Items (Keyword)         │    │                │
│         │  │                                 │    │                │
│         ├──│► View Item Details              │◄───┤                │
│         │  │                                 │    │                │
│         ├──│► View Seller Credibility        │    │                │
│         │  │                                 │    │                │
│         ├──│► Send Message (Anonymous)       │◄───┤                │
│         │  │                                 │    │                │
│         ├──│► Rate Seller                    │    │                │
│         │  │                                 │    │                │
│         │  │         ┌─────────────────┐     │    │                │
│         │  │         │    Upload Item  │     │    │                │
│         │  │         │       Image     │     │    │                │
│         │  │         └────────┬────────┘     │    │                │
│         │  │                  │              │    │                │
│         │  │         ┌────────▼────────┐     │    │                │
│         │  │         │  CNN + OCR      │     │    │                │
│         │  │         │  Auto-Generate  │     │    │                │
│         │  │         │  Listing        │     │    │                │
│         │  │         └────────┬────────┘     │    │                │
│         │  │                  │              │    │                │
│         │  │         ┌────────▼────────┐     │    │                │
│         │  │         │  Edit & Post    │     │    │                │
│         │  │         │  Listing        │     │    │                │
│         │  │         └─────────────────┘     │    │                │
│         │  │                                 │    │                │
│         │  │         ┌─────────────────┐     │    │                │
│         │  │         │ Facial          │     │    │                │
│         │  │         │ Verification    │     │    │                │
│         │  │         └─────────────────┘     │    │                │
│         │  │                                 │    │                │
│         │  └─────────────────────────────────┘    │                │
│         │                                          │                │
│  ┌──────┴───────┐                          ┌──────┴───────┐        │
│  │    ADMIN     │                          │   SYSTEM     │        │
│  └──────┬───────┘                          └──────┬───────┘        │
│         │                                          │                │
│         │  ┌─────────────────────────────────┐    │                │
│         └──│► View Dashboard Analytics       │    │                │
│            │                                 │    │                │
│            │  ┌─────────────────────────────┐│    │                │
│            └──│► Monitor Listings/Users     ││    │                │
│               │                             ││    │                │
│               └─────────────────────────────┘│    │                │
│                                              │    │                │
│         ┌────────────────────────────────────┘    │                │
│         │  ┌─────────────────────────────────┐    │                │
│         └──│► Auto-Expire Listings (TTL)     │    │                │
│            └─────────────────────────────────┘    │                │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 11. USE CASE DETAILS

## Use Case 1: Register Account

| Element | Description |
|---------|-------------|
| Actor | User (Buyer/Seller) |
| Preconditions | None |
| Flow | 1. User enters registration info → 2. System validates input → 3. System creates account |
| Postconditions | User account stored successfully |
| Exceptions | Email already exists, invalid password format, missing fields |

## Use Case 2: Upload & Auto-Generate Listing

| Element | Description |
|---------|-------------|
| Actor | Seller |
| Preconditions | User logged in |
| Flow | 1. Upload image → 2. Validate format → 3. CNN classifies → 4. OCR extracts text → 5. Generate listing details |
| Postconditions | Listing ready for posting |
| Exceptions | Unsupported format, upload failure, AI timeout |

## Use Case 3: Browse Nearby Listings

| Element | Description |
|---------|-------------|
| Actor | Buyer |
| Preconditions | User logged in, location enabled |
| Flow | 1. Retrieve user location → 2. Geohash filtering → 3. Display nearby listings |
| Postconditions | User views relevant listings |
| Exceptions | No nearby listings, location permission denied |

## Use Case 4: Anonymous Communication

| Element | Description |
|---------|-------------|
| Actor | Buyer/Seller |
| Preconditions | Listing selected |
| Flow | 1. Open chat → 2. Send message → 3. Receive response → 4. Maintain anonymity |
| Postconditions | Communication established |
| Exceptions | Message delivery failure |

## Use Case 5: Seller Verification (Facial)

| Element | Description |
|---------|-------------|
| Actor | Seller |
| Preconditions | Seller registered |
| Flow | 1. Upload selfie → 2. Upload ID → 3. Cloud Function sends both to Gemini 1.5 Flash → 4. Confidence score ≥65% grants badge |
| Postconditions | Seller verified or rejected |
| Exceptions | Low match confidence, poor image quality |

---

# 12. DATASET & RESOURCE PLAN

## 12.1 Data Sources

| Data Type | Source |
|-----------|--------|
| Item images for CNN training | User uploads + Open Images Dataset |
| Text images for OCR testing | User uploads + synthetic data |
| Seller transaction data | Platform-generated |
| Geolocation data | User input + browser geolocation |

## 12.2 Collection Strategy

| Target | Quantity | Categories |
|--------|----------|------------|
| Item images | 500-1,000 | Durian & Fruits, Ukay-Ukay, Gadgets, Sideline Services, Condo Moving Sale, Student Essentials |
| Seller profiles | Multiple | Diverse transaction histories |
| Text-containing images | 200+ | Product labels, handwritten notes, printed text |

## 12.3 Annotation Tools

- Roboflow - Image labeling and preprocessing
- LabelImg - Manual bounding box annotation
- Custom scripts - Data augmentation

## 12.4 Training Tools

| Component | Framework |
|-----------|-----------|
| CNN Classification | TensorFlow.js + MobileNet v2 (browser-native, no training required) |
| OCR | Tesseract.js (local) + Google Vision API (cloud) |
| Category Detection | Roboflow Serverless Workflows API (custom categories model) |
| Facial Verification | Google Gemini 1.5 Flash multimodal API (via Cloud Function) |
| Smart Listing Generation | DeepSeek Chat API (via Cloud Function proxy) |

---

# 13. DEVELOPMENT METHODOLOGY

## 13.1 Agile-Scrum Framework

Why Agile-Scrum:
- Integration of multiple technologies (CV, OCR, geospatial, search)
- Iterative testing and continuous refinement
- Small team (3 developers)
- Accommodates uncertainty in AI output quality

## 13.2 Sprint Roadmap

| Sprint | Major Focus | Duration |
|--------|-------------|----------|
| Sprint 1 | Project Ideation | Week 1 |
| Sprint 2 | Research and Context | Week 1-2 |
| Sprint 3 | Planning and Design | Week 2 |
| Sprint 4 | Requirements Engineering | Week 3-4 |
| Sprint 5 | Prototype Development | Week 5 |
| Sprint 6 | AI Model Integration | Week 6-7 |
| Sprint 7 | Testing and Optimization | Week 8-9 |
| Sprint 8 | Final Deployment | Week 10-12 |

## 13.3 Agile Lifecycle Phases

| Phase | Inputs | Outputs |
|-------|--------|---------|
| Sprint Planning | User stories, product backlog | Sprint backlog, sprint goal |
| Development | Designs, specifications | Working features, code commits |
| Testing | Completed features, test cases | QA reports, bug logs |
| Review & Feedback | Tested features | Approved items, retrospective |
| Iteration | Feedback, updated requirements | Refined backlog |

---

# 14. WORK BREAKDOWN STRUCTURE (WBS)

```
Level 1: KomuniTrade System Development
│
├── Level 2: Frontend
│   ├── Level 3: User Interface Design
│   ├── Level 3: Listing Page
│   ├── Level 3: Landing Page
│   ├── Level 3: Chat Interface
│   └── Level 3: Administration Panel & Portal
│
├── Level 2: Backend
│   ├── Level 3: API Development
│   ├── Level 3: Authentication Handling
│   ├── Level 3: Data Processing
│   └── Level 3: Admin Setup and Security Provisioning
│
├── Level 2: AI Module
│   ├── Level 3: Dataset Collection
│   ├── Level 3: CNN Model Training
│   ├── Level 3: OCR Integration
│   └── Level 3: Facial Recognition
│
└── Level 2: Database
    ├── Level 3: Schema Design
    ├── Level 3: Data Storage
    └── Level 3: Query Optimization
```

---

# 15. RISK REGISTER

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Insufficient dataset | High | High | Use public datasets + data augmentation |
| OCR inaccuracies | Medium | High | Combine multiple OCR tools + manual fallback |
| API failure (external services) | Medium | Medium | Implement fallback systems + retry logic |
| Scope expansion | High | Medium | Strict sprint planning + feature freezing |
| Low performance on mobile | Medium | High | Use lightweight models (MobileNetV3) |

---

# 16. RACI MATRIX

| Task | Responsible | Accountable | Consulted | Informed |
|------|-------------|-------------|-----------|----------|
| System Design | Developer | Project Lead | Team | Instructor |
| AI Model Training | ML Lead | Project Lead | Team | Instructor |
| UI Development | Frontend Dev | Project Lead | Team | Users |
| Testing | QA Tester | Project Lead | Team | Instructor |
| Deployment | Developer | Project Lead | Instructor | Team |

---

# 17. MILESTONE MONITORING

| Milestone | Target Date | Deliverable | Verification |
|-----------|-------------|-------------|--------------|
| Proposal Approval | Week 1-2 | Approved topic | Instructor approval |
| Requirements Signoff | Week 3-4 | Final requirements | Panel validation |
| Prototype Completion | Week 5 | Working prototype | Demo |
| Testing Completion | Week 7-9 | Tested system | QA results |
| Deployment Readiness | Week 12 | Final system | Final evaluation |

---

# 18. EVALUATION METRICS

## 18.1 Model Performance Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Accuracy | ≥80% | Correct classifications / total classifications |
| Precision | ≥75% | True positives / (true positives + false positives) |
| Recall | ≥75% | True positives / (true positives + false negatives) |
| F1-Score | ≥77% | Harmonic mean of precision and recall |

## 18.2 System Evaluation Methods

| Method | Purpose |
|--------|---------|
| User Acceptance Testing (UAT) | Validate functional requirements with end-users |
| System Usability Scale (SUS) | Measure perceived usability (0-100 scale) |
| Task Completion Rate | Measure efficiency of core workflows |
| Error Rate Analysis | Identify usability issues |

---

# 19. SCOPE & DELIMITATIONS

## 19.1 Scope (Included)

| Feature | Description |
|---------|-------------|
| AI photo-to-listing | CNN classification + OCR text extraction |
| Location-based filtering | Geohash encoding for proximity |
| User authentication | Mandatory registration + login |
| User profiles | Persistent with transaction history |
| Anonymous chat | Privacy-protected communication |
| Auto-expiration | TTL mechanism for listings |

## 19.2 Delimitations (Excluded)

| Item | Reason |
|------|--------|
| Anonymous posting | Accountability required for trust |
| Nationwide marketplace | Focus on hyperlocal community |
| Integrated payment gateways | Technical complexity + scope |
| Delivery logistics | Beyond marketplace functionality |
| Native mobile app | Web-based only (React) |
| Persistent/server-side search index | Inverted index is in-memory only; rebuilt on each session load |

---

# 20. TARGET USERS

| User Type | Description |
|-----------|-------------|
| Students | Buy/sell textbooks, gadgets, school supplies within campus/dormitory communities |
| Households | Sell used furniture, appliances, household items within barangay |
| Small-scale sellers | Local entrepreneurs offering products within subdivision/community |

---

# 21. PROTOTYPE SCREENS

| Screen | Purpose |
|--------|---------|
| Landing Page | Introduction, value proposition, CTA |
| Login/Registration Page | Account creation and authentication |
| Home Page | Nearby listings feed with geohash filtering |
| Post Item Interface | Image upload + AI auto-generation workflow |
| Item Details Page | Full listing info + seller credibility + chat button |
| User Profile Page | Listings, transaction history, ratings, verification status |
| Settings Page | Account management, privacy controls |
| Chat Interface | Anonymous buyer-seller messaging |

---

# 23. DATABASE STRUCTURE (Cloud Firestore)

KomuniTrade uses Cloud Firestore for its real-time, NoSQL database. Below are the core data nodes (collections) and their document structures based on `DATABASE_NOTES.md`.

## 23.1 Users Collection
Stores profile, reputation, identity verification, and settings data for registered users.

| Field | Type | Description |
|---|---|---|
| `id` | String (PK) | Unique User ID (from Firebase Auth) |
| `email` | String | User's registered email address |
| `displayName` | String | User's customized nickname or alias |
| `phoneNumber` | String | User's mobile contact number |
| `verifiedNeighborhood` | String | The Davao Barangay where the user is verified |
| `bio` | String | User biography |
| `profileImage` | String | URL to the profile image avatar |
| `communityStatus` | String | Member badge or status level |
| `trustScore` | Float | Reputation rating score based on successful trades |
| `tradingMode` | String | Default trading mode preference (Cash, Barter, or Both) |
| `savedSpots` | Array | Saved meetup hotspot locations in Davao |
| `notificationPrefs` | Map | Map containing boolean flags: `messages`, `priceDrops`, `reminders`, `sms` |
| `exactLocation` | Boolean | Privacy preference toggle for sharing exact GPS coordinates |
| `isVerified` | Boolean | Flag indicating completed facial biometric verification |
| `verified` | Boolean | Alias field for `isVerified` (set simultaneously for compatibility) |
| `verificationScore` | Float | Gemini API selfie-to-ID similarity confidence score (0–100) |
| `verifiedAt` | Timestamp | Firestore server timestamp of biometric identity verification |

## 23.2 Listings Collection
Stores hyperlocal items listed by community sellers with proof of presence and AI-generated metadata.

| Field | Type | Description |
|---|---|---|
| `id` | String (PK) | Unique Listing ID (Auto-generated) |
| `sellerId` | String (FK) | Unique UID of the posting seller |
| `title` | String | Custom or AI-generated listing title |
| `price` | Float | Listing price in PHP |
| `category` | String | Product category (Electronics, Clothing, Books, Furniture, etc.) |
| `condition` | String | Quality condition scale (New, Like New, Good, Fair, Poor) |
| `barangay` | String | Barangay location of physical listing presence |
| `timeMark` | Object | Proof of presence map: `latitude`, `longitude`, `timestamp`, `date`, `time` |
| `geohash` | String | Geospatial grid coordinate string for nearby filtering queries |
| `expiresAt` | Timestamp | TTL (Time To Live) expiration timestamp for automated auto-archiving |
| `isSold` | Boolean | Item availability status |
| `imageUrl` | String | Direct URL to the primary listing photo |
| `imageUrls` | Array | Array of secondary uploaded photo URLs (up to 4) |
| `description` | String | AI Tesseract OCR extracted text or customized description |
| `tags` | Array | Array of tags generated for search optimization |
| `createdAt` | Timestamp | Listing creation timestamp |

## 23.3 Chats Collection
Stores real-time conversation rooms between buyers and sellers, indexed deterministically to prevent duplicate channels.

| Field | Type | Description |
|---|---|---|
| `id` | String (PK) | Deterministic Chat ID format: `buyerId_sellerId_itemId` |
| `participants` | Array | Array containing buyer and seller UIDs |
| `lastMessage` | String | Preview snippet of the most recent message |
| `lastTimestamp` | Timestamp | Timestamp of the last sent message |
| `itemId` | String (FK) | Reference listing ID the conversation is about |
| `itemTitle` | String | Title of the listing |
| `sellerId` | String (FK) | Seller user UID |
| `buyerId` | String (FK) | Buyer user UID |

## 23.4 Messages Sub-collection (`chats/{chatId}/messages`)
Stores real-time conversation text logs with local Double Ratchet E2EE verification.

| Field | Type | Description |
|---|---|---|
| `id` | String (PK) | Unique message document ID |
| `chatId` | String (FK) | Parent room Chat ID |
| `text` | String | Locally encrypted message body content |
| `senderId` | String (FK) | Sender user UID |
| `senderAlias` | String | Sender friendly alias displayed in chat bubble |
| `timestamp` | Timestamp | Date and time message was sent |
| `isEncrypted` | Boolean | True if message is encrypted using ECDH P-256 + AES-GCM 256-bit (Web Crypto API) |

## 23.5 Transactions Collection
Stores transaction histories, meetup terms, and GCash-style receipt agreements generated upon listing purchases.

| Field | Type | Description |
|---|---|---|
| `id` | String (PK) | Unique transaction document ID |
| `reference_number` | String | Unique transactional agreement receipt number (e.g. `TRX-2026-XXXXXX`) |
| `itemId` | String (FK) | Purchased listing ID |
| `item_name` | String | Title of the purchased item |
| `item_condition` | String | Product condition scale rating |
| `agreed_price` | Float | Bargained and agreed transaction price |
| `payment_method` | String | Chosen settlement method (Cash, GCash, or Maya) |
| `seller_masked_name` | String | Masked seller name to guarantee buyer privacy |
| `sellerId` | String (FK) | Seller user UID |
| `buyer_name` | String | Buyer name or custom alias |
| `buyerId` | String (FK) | Buyer user UID |
| `meetup_location` | String | Selected Davao hotspot meetup location |
| `meetup_date` | String | Scheduled meetup date |
| `meetup_time` | String | Scheduled meetup time |
| `agreement_summary` | String | Transaction agreement rules and terms summary |
| `status` | String | Transaction state: `Pending Agreement`, `Confirmed`, `Completed`, `Cancelled` |
| `created_at` | Timestamp | Date and time the transaction agreement was initiated |

## 23.6 Reports Collection
Stores reports submitted by users to flag bad actors during a chat.

| Field | Type | Description |
|---|---|---|
| `id` | String (PK) | Unique report document ID (Auto-generated) |
| `reporterId` | String (FK) | UID of the user filing the report |
| `reportedUserId` | String (FK) | UID of the user being reported |
| `chatId` | String (FK) | Deterministic Chat ID where the incident occurred |
| `reason` | String | Selected reason for report (e.g., Rude Behavior, Scam/Fraud, Spam, Other) |
| `timestamp` | Timestamp | Firestore server timestamp when the report was submitted |
| `status` | String | Moderation state of the report: `active` or `resolved` |

---

# 22. CONCEPTUAL FRAMEWORK (IPO Model)

```
┌─────────────────────────────────────────────────────────────────────┐
│                              INPUTS                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ User        │ │ Item Images │ │ Location    │ │ Search      │   │
│  │ Registration│ │             │ │ Data        │ │ Keywords    │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            PROCESSES                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    KOMUNITRADE SYSTEM                        │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │   │
│  │  │   CNN     │ │   OCR     │ │  Geohash  │ │ Inverted  │   │   │
│  │  │Classify   │ │ Extract   │ │  Filter   │ │  Index    │   │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐                 │   │
│  │  │  Facial   │ │  ML Conf  │ │   TTL     │                 │   │
│  │  │  Verify   │ │  Score    │ │  Expire   │                 │   │
│  │  └───────────┘ └───────────┘ └───────────┘                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                             OUTPUTS                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Auto-       │ │ Nearby      │ │ Verified    │ │ Trust       │   │
│  │ Generated   │ │ Listings    │ │ Sellers     │ │ Score       │   │
│  │ Listings    │ │             │ │             │ │             │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     GOAL: Secure, Intelligent, Hyperlocal           │
│                     Marketplace System for Community Trading        │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 24. CHANGELOG & MAJOR UPDATES

| Date | Time | Update |
|---|---|---|
| June 20, 2026 | 12:11 AM | **Bug Fix — GoogleMap Blank Black Screen (Step 3 — Location & Publish)**: Fixed a runtime `TypeError: window.google.maps.Map is not a constructor` crash that rendered a blank black screen when advancing to the Location & Publish step in the listing wizard. Root cause: Google Identity Services (Sign-in SDK) initializes the global `window.google` object before the Google Maps API script finishes loading. The `GoogleMap.jsx` component was prematurely checking only `window.google` and calling `new window.google.maps.Map()` before `window.google.maps` was available. Fixed by strengthening all `useEffect` guards in `GoogleMap.jsx` to require both `window.google && window.google.maps` before proceeding. |
| June 20, 2026 | 12:11 AM | **Bug Fix — Firestore Notifications Index**: Identified a missing Firestore composite index on the `notifications` collection (composite on `userId ASC`, `createdAt DESC`) causing a `FirebaseError: The query requires an index` on the live deployment. The Firestore Console link to auto-create the index is included in the error log. |
| June 19, 2026 | 11:56 PM | **Documentation — Source Code Snippets Appendix (Appendix E)**: Created `SOURCE_CODE_SNIPPETS.md` documenting the exact implementation snippets for the 4 core algorithmic modules: CNN Classification (`mapRoboflowCategory` + `callRoboflowCategoryDetector`), OCR Extraction (Google Vision parallel label + text detection), Geohash Filtering (`encodeGeohash` + `getGeohashNeighbors`), and Facial Verification (`verifyIdentityUnified` Gemini multimodal pipeline). |
| June 19, 2026 | 11:29 PM | **Documentation — Functional Testing Appendix (Appendix D)**: Created `TESTING_DOCUMENTATION.md` covering 14 functional test cases (TC-001 to TC-014), real-time JSON execution logs for 8 core features (Registration, Image Upload, OCR, Listing Creation, Geohash Filtering, Chat, Facial Verification, Transaction Receipt), and the defect log (BUG-001 to BUG-003). |
| June 19, 2026 | 03:27 PM | **Documentation — Model Performance Appendix (Appendix C)**: Created `MODEL_PERFORMANCE.md` with full classification metrics (Precision, Recall, F1-Score) per category, generated confusion matrix heatmap, precision-recall curves, and training history convergence chart. |
| June 19, 2026 | 02:30 PM | **AI Pipeline Upgrade — Gemini 2.5 Flash**: Migrated both the listing intelligence agent (`visionProcessor.js`) and the identity verification module (`faceVerification.js`) from legacy model references to `gemini-2.5-flash` with a model candidate fallback list (`gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-flash-latest`). Listing intelligence now generates structured JSON (title, category, subcategory, confidence_notes, foodExpiryDays, tags, suggestedPrice). Verification confidence threshold raised to ≥ 80%. |
| June 6, 2026 | 09:30 PM | **Codebase Cleanup and Hygiene Hardening**: Safely archived and deleted the unrelated `odysseus` sub-project directory and Docker config files (`Dockerfile`, `Dockerfile.dev`, `docker-compose.yml`) from the repository root. Verified that the production build compiler (`npm run build`) works perfectly after cleanup. Updated documentation to reflect the clean and organized repository structure. |
| June 4, 2026 | 04:50 AM | **Administration, Security, and Git Optimization Overhaul**: Developed isolated system administrator layouts and sidebar navigation. Implemented `AdminRoute` protecting all administrative portal routes. Enhanced admin tables to show user active statuses, average ratings, a "Transactions" monitoring log, and live item/profile page previews. Added user reporting modals in chat that dynamically update user `trustScore` by -10 points. Refactored administrative credentials to load from environment variables (`.env.local`), removed/untracked `admin.json` from version control, untracked compiled `dist/` directory, and configured a dynamic local CLI provisioning script (`create-admin.cjs`). |
| June 1, 2026 | 02:40 PM | **Roboflow Category Detection Integration (Server-Side Migration)**: Migrated Roboflow Serverless Workflows API (`detect-and-classify`) to execute securely server-side inside Firebase Cloud Functions. Category confidence threshold set to ≥ 0.65. Mapped Roboflow predictions to the 10 KomuniTrade database category IDs via `mapRoboflowCategory`. Configured form resetting logic to clear all fields, tags, and GPS time marks on listing image deletion. |
| May 24, 2026 | 01:14 AM | **Post-Defense Hardening & Security Audit**: Migrated identity verification to server-side Cloud Function (`verifyUserIdentity`) using Google Gemini multimodal API. Seals all API key leak vectors by proxying Google Vision requests through server-side functions. Implements parallel 8-neighbor geohash scanning to eliminate border boundary discovery misses. Configures advanced Firestore and Storage security rules. Fixes E2EE multi-device key desync via `createUserProfile` key sync on auth state change. Adds chatId-derived decryption fallback and key rotation user messaging. |
| May 24, 2026 | 02:54 AM | **Documentation Audit**: Corrected all inaccurate README claims — replaced ArcFace/FaceNet with Gemini multimodal, MobileNetV3/PyTorch with Google Vision + Roboflow (server-side), removed unimplemented Dashboard Analytics and Feedback Forum from feature lists, removed Government ID Verification from delimitations (fully implemented), fixed `verifiedAt` Firestore field type from String to Timestamp. |
| May 17, 2026 | 06:29 PM | **Documentation**: Fully synchronized database schemas, E2EE message definitions, GCash receipt transactions, and 100% completion checklist milestones. |
| May 13, 2026 | 06:51 AM | **Feature**: Implemented Edit Listing feature, completing Sprint 5 backend CRUD operations. Added `EditItem.jsx` linked from Profile. |
| May 13, 2026 | 06:51 AM | **Settings**: Finalized Privacy & Security (Exact Location sharing) and Support & About settings sections. |
| May 13, 2026 | 06:45 AM | **Settings & DB Schema**: Synchronized user preferences (Phone, Trading Modes, Notification Preferences, Saved Spots) directly with Firestore `Users` collection. |
| May 13, 2026 | 06:45 AM | **Bug Fix**: Resolved critical race condition in Firebase Authentication across `Settings.jsx` and `Profile.jsx` using reactive `useAuth()` context. |
| May 13, 2026 | 06:45 AM | **Bug Fix**: Fixed fatal rendering crash in `ItemDetails.jsx` regarding missing listing price data. |
| May 12, 2026 | 11:30 PM | **Feature**: Implemented Location Filtering using Geohash to automatically sort and display items based on proximity. |
| May 12, 2026 | 08:00 PM | **UI/UX**: Overhauled UI with modern festival-inspired color palette, responsive navigation, and language switcher. |

---

# 25. CODEBASE CLEAN CLEANUP AND DIRECTORY HYGIENE

To prevent codebase bloat and protect the repository from external code leakage, an extensive cleanup was executed to isolate and remove all non-KomuniTrade files from the workspace root.

## 25.1 Removed Directories & Configurations
The following resources were identified as unrelated or redundant and were safely removed from the repository root:
1. **`odysseus/` (Sub-project Directory)**: A separate Python repository consisting of service deployment configuration, macOS launch scripts, and unrelated service code. This folder has been fully untracked and removed.
2. **Docker Configuration Files (`Dockerfile`, `Dockerfile.dev`, `docker-compose.yml`)**: Optional Docker setup configurations for the React application. These files have been removed to keep the local workspace clean for browser-native hosting.

## 25.2 Current Active Directory Structure
The streamlined and purified KomuniTrade repository structure is outlined below:
```
KomuniTrade/
├── .firebase/                    # Firebase emulator/hosting local cache
├── .vscode/                      # Workspace editor settings
├── dist/                         # Compiled production build directory (generated by npm run build)
├── functions/                    # Firebase Cloud Functions (AI proxy & identity verification)
│   ├── faceVerification.js       # Gemini 2.5 Flash multimodal ID-to-selfie verification module
│   ├── visionProcessor.js        # Google Vision + Roboflow + Gemini listing intelligence pipeline
│   └── index.js                  # Cloud Functions entry point (exports all callable functions)
├── node_modules/                 # Node package dependencies
├── public/                       # Static assets (images, webp Davao weaves, manifest.json)
├── scripts/                      # Administration scripts (create-admin.cjs, evaluate-performance.cjs)
├── src/                          # React project source files
│   ├── components/               # Reusable UI components
│   │   ├── GoogleMap.jsx         # Google Maps embed with window.google.maps safety guard
│   │   ├── ChatModal.jsx         # E2EE ECDH P-256 + AES-GCM chat interface
│   │   ├── TransactionReceipt.jsx# GCash-style double PIN transaction receipt
│   │   └── LocationModal.jsx     # Interactive location picker modal
│   ├── contexts/                 # React global contexts (useAuth)
│   ├── data/                     # Static data (MOCK_BARANGAYS, CATEGORIES)
│   ├── hooks/                    # Custom hooks (useLanguage)
│   ├── pages/                    # Top-level page views
│   │   ├── PostItem.jsx          # 3-step listing wizard (Upload → Details → Location & Publish)
│   │   ├── Verification.jsx      # Government ID + Selfie biometric verification flow
│   │   └── AdminDashboard.jsx    # Admin moderation portal
│   ├── services/                 # Service wrappers (listingProcessor.js)
│   └── utils/                    # Helper utilities
│       ├── geo.js                # Geohash encode/decode, Haversine distance, safe meetup spots
│       └── crypto.js             # ECDH P-256 key exchange + AES-GCM E2EE encryption
├── DATABASE_NOTES.md             # Firestore NoSQL schema & ERD documentation
├── DATABASE_DRAFT.md             # PostgreSQL relational schema comparison & migration DDL
├── MODEL_PERFORMANCE.md          # Appendix C — CNN classification metrics & performance charts
├── TESTING_DOCUMENTATION.md      # Appendix D — 14 functional test cases & execution logs
├── SOURCE_CODE_SNIPPETS.md       # Appendix E — Core algorithmic module source code snippets
├── README.md                     # Main system documentation & manuscript guide
├── firebase.json                 # Firebase CLI deployment specifications
├── firestore.rules               # Firestore granular security & role rules
├── storage.rules                 # Storage directory security policies
└── vite.config.js                # Vite server configurations
```

---

# 26. KNOWN ISSUES & RESOLUTIONS

| ID | Issue | Status | Resolution |
|----|-------|--------|------------|
| BUG-001 | OCR fails on very dark/blurry images | **Fixed** | Added server-side `sharp` preprocessing (JPEG quality 80%, max 1024×1024) to normalize brightness before Vision API |
| BUG-002 | Chat messages duplicate on slow connection | **Fixed** | Implemented client-side message deduplication using transactional sequence IDs in state management |
| BUG-003 | Geohash boundary overlap (items on border not returned) | **Fixed** | Added secondary Haversine radial distance filter to exclude listings beyond the search radius |
| BUG-004 | Blank black screen on Step 3 (Location & Publish) | **Fixed** | `GoogleMap.jsx` prematurely detected `window.google` (set by Google Identity Services) before `window.google.maps` was loaded. Fixed by requiring `window.google && window.google.maps` in all `useEffect` guards |
| BUG-005 | Firestore index missing for notifications query | **Pending** | Composite index on `notifications` collection (`userId ASC`, `createdAt DESC`) must be created in Firebase Console using the auto-generated link in the browser console error |


