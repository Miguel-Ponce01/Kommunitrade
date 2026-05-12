KomuniTrade: Complete System Documentation

Trade Smart Within Your Community

# KomuniTrade: Complete System Documentation

## Trade Smart Within Your Community

---

# 1. EXECUTIVE SUMMARY

KomuniTrade is a web-based hyperlocal marketplace system that leverages Artificial Intelligence to automate listing creation and enhance local buying and selling experiences within barangays and communities in the Philippines.

Core Purpose: To enable safe, efficient, and intelligent peer-to-peer commerce within immediate geographic communities while addressing the limitations of existing platforms like Facebook Marketplace—specifically geographically irrelevant listings, manual listing creation, and fraudulent transactions.

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
| 1 | Automatically classify uploaded items and categorize products | CNN (EfficientNet/MobileNetV3) |
| 2 | Extract text from images to auto-generate titles, tags, and descriptions | OCR (Tesseract/Google Vision API) |
| 3 | Display relevant listings based on user proximity and search keywords | Geohash encoding + Inverted Index |
| 4 | Assess seller legitimacy using behavioral and transaction data | ML confidence scoring algorithm |
| 5 | Verify seller identity by comparing profile and ID images | Facial recognition (ArcFace/FaceNet) |
| 6 | Provide authenticated access, listing management, and transaction tracking | Firebase Auth + Firestore |
| 7 | Monitor platform activity and seller performance | Dashboard analytics module |
| 8 | Evaluate model performance | Accuracy, Precision, Recall, F1-Score |
| 9 | Evaluate system usability | UAT, SUS, ISO 25010 standards |

---

# 5. TECHNICAL ARCHITECTURE

## 5.1 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + Vite | User interface, fast development |
| Backend | Firebase (serverless) | Authentication, database, hosting |
| Database | Cloud Firestore | NoSQL, real-time updates |
| AI/ML - CNN | TensorFlow / PyTorch + MobileNetV3 | Image classification (lightweight for web) |
| AI/ML - OCR | Tesseract.js / Google Vision API | Text extraction from images |
| AI/ML - Facial | ArcFace / FaceNet | Facial similarity matching |
| Geospatial | Geohash library | Location encoding and proximity filtering |
| Search | Inverted Index | Keyword-based listing retrieval |
| Expiration | TTL mechanism | Auto-archive listings after 30 days |
| Hosting | Firebase Hosting / Vercel | Web deployment |

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
| Authentication Module | Email/password login, session management, security rules |
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
| High | CNN Item Classification | Auto-categorize items from images | Completed |
| High | OCR Auto-Tagging | Extract text for titles/descriptions | Completed |
| High | Geohash Location Filtering | Show only nearby listings | Completed |
| Medium | Inverted Index Search | Fast keyword search | Pending |
| Medium | Transaction History & Receipts | Track past purchases/sales with GCash-style receipts | Completed |
| Medium | Feedback Forum | Community feedback with admin moderation | Completed |
| Medium | Rules & Regulations | Davao-specific consumer guidelines | Completed |
| Medium | Anonymous Chat System | Private buyer-seller communication | Completed |
| Medium | TTL Auto-Archiving | Auto-expire listings after 30 days | Pending |
| Medium | Language Localization | Support for English (default), Tagalog, and Bisaya | Completed |
| Medium | Davao Cultural Theme | Landing page with Davao map background and cultural assets | Completed |

## 6.2 Extended Feature Set (Enhanced Objectives)

| Feature | Technology | Description | Status |
|---------|------------|-------------|--------|
| AI Price Suggestion | ML regression | Suggest price based on similar listings | Pending |
| Seller Credibility Score | ML confidence algorithm | Score based on history, ratings, verification | Pending |
| Verification Badges | Rule-based + ML | Display trust indicators on seller profiles | Completed |
| Facial Verification | ArcFace/FaceNet | Compare profile photo with ID document | Completed |
| Rating & Feedback System | User input + ML | Buyers rate sellers post-transaction | Pending |
| Dashboard Analytics | Data viz (Chart.js) | Admin monitoring of listings, sales, fraud | Pending |

---

# 7. FUNCTIONAL REQUIREMENTS (SRS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | User account creation with email + password | High |
| FR-02 | User login with registered credentials | High |
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
| Flow | 1. Upload selfie → 2. Upload ID → 3. System compares faces → 4. Confidence score ≥85% grants badge |
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
| Item images | 500-1,000 | Electronics, clothing, books, furniture, household |
| Seller profiles | Multiple | Diverse transaction histories |
| Text-containing images | 200+ | Product labels, handwritten notes, printed text |

## 12.3 Annotation Tools

- Roboflow - Image labeling and preprocessing
- LabelImg - Manual bounding box annotation
- Custom scripts - Data augmentation

## 12.4 Training Tools

| Component | Framework |
|-----------|-----------|
| CNN Training | TensorFlow / PyTorch |
| OCR | Tesseract + Google Vision API |
| Facial Recognition | ArcFace / FaceNet |

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
│   └── Level 3: Chat Interface
│
├── Level 2: Backend
│   ├── Level 3: API Development
│   ├── Level 3: Authentication Handling
│   └── Level 3: Data Processing
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
| ISO/IEC 25010 | Evaluate quality characteristics |
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
| Government-level ID verification | Complex legal integration |
| Native mobile app | Web-based only (React) |

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
Stores profile and reputation data for registered users.

| Field | Type | Description |
|---|---|---|
| `id` | String (PK) | Unique User ID (from Firebase Auth) |
| `email` | String | User's email address |
| `phoneNumber` | String | User's contact number |
| `verifiedNeighborhood` | String | The Barangay where the user is verified |
| `bio` | String | User biography |
| `profileImage` | String | URL to the profile image |
| `communityStatus` | String | Member badge or status level |
| `trustScore` | Float | Reputation score based on interactions |
| `tradingMode` | String | Default trading mode (Cash, Barter, Both) |
| `savedSpots` | Array | Saved meetup hotspots (Davao locations) |
| `notificationPrefs` | Map | Notification toggle settings |

## 23.2 Listings Collection
Stores item listings with location and AI-generated data.

| Field | Type | Description |
|---|---|---|
| `id` | String (PK) | Unique Item ID |
| `sellerId` | String (FK) | ID of the user who owns the listing |
| `title` | String | Item name or title |
| `price` | Float | Price in PHP |
| `category` | String | Product category (Electronics, Clothing, etc.) |
| `condition` | String | Quality scale (New, Used, etc.) |
| `barangay` | String | Hyperlocal location |
| `timeMark` | Object | GPS Proof (lat, lng, timestamp) |
| `geohash` | String | Search index for location filtering |
| `expiresAt` | Timestamp | TTL (Time To Live) for auto-archiving |
| `isSold` | Boolean | Status of the item |

## 23.3 Messages Collection
Stores chat messages between buyers and sellers.

| Field | Type | Description |
|---|---|---|
| `id` | String (PK) | Unique Message ID |
| `listingId` | String (FK) | ID of the listing the chat is about |
| `senderId` | String (FK) | ID of the message sender |
| `text` | String | Message content |
| `createdAt` | Timestamp | Time message was sent |

---

# 22. CONCEPTUAL FRAMEWORK (IPO Model)

```
┌─────────────────────────────────────────────────────────────────────┐
│                              INPUTS                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ User        │ │ Item Images │ │ Location    │ │ Search      │   │
│  │ Registration│ │             │ │ Data        │ │ Keywords    │   │
...
The above content was truncated as it is too long. To view the rest of the file, use the view_file tool.

---

# 24. CHANGELOG & MAJOR UPDATES

| Date | Time | Update |
|---|---|---|
| May 13, 2026 | 06:51 AM | **Feature**: Implemented Edit Listing feature, completing Sprint 5 backend CRUD operations. Added `EditItem.jsx` linked from Profile. |
| May 13, 2026 | 06:51 AM | **Settings**: Finalized Privacy & Security (Exact Location sharing) and Support & About settings sections. |
| May 13, 2026 | 06:45 AM | **Settings & DB Schema**: Synchronized user preferences (Phone, Trading Modes, Notification Preferences, Saved Spots) directly with Firestore `Users` collection. |
| May 13, 2026 | 06:45 AM | **Bug Fix**: Resolved critical race condition in Firebase Authentication across `Settings.jsx` and `Profile.jsx` using reactive `useAuth()` context. |
| May 13, 2026 | 06:45 AM | **Bug Fix**: Fixed fatal rendering crash in `ItemDetails.jsx` regarding missing listing price data. |
| May 12, 2026 | 11:30 PM | **Feature**: Implemented Location Filtering using Geohash to automatically sort and display items based on proximity. |
| May 12, 2026 | 08:00 PM | **UI/UX**: Overhauled UI with modern festival-inspired color palette, responsive navigation, and language switcher. |
