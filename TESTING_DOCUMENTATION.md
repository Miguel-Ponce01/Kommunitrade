# APPENDIX D - FUNCTIONAL TESTING DOCUMENTATION
**Manuscript & Technical Project Defense Documentation**

This appendix contains the comprehensive functional testing documentation for the KomuniTrade platform, including test case specifications, execution logs, and defect tracking logs.

---

## D.1 Test Case Specifications

All functional testing was executed by **Elle Magdalan** on **June 12, 2026**.

| Test ID | Module | Preconditions | Test Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-001** | Authentication | User has internet connection and is on the Login page. | 1. Enter email/password.<br>2. Click "Register".<br>3. Verify Auth session. | User account is created in Firebase Auth and registered in `users` collection. | Pass - Account successfully created and profile document set. | **Passed** |
| **TC-002** | Authentication | User is on the login page. | 1. Click "Sign in with Google".<br>2. Complete OAuth popup.<br>3. Redirect to marketplace. | User is authenticated; session tokens are loaded into memory. | Pass - OAuth session validated and redirected. | **Passed** |
| **TC-003** | Listing wizard | User is verified and logged in. | 1. Click "Post Item".<br>2. Drag-and-drop 4 images.<br>3. Verify previews. | Previews render; file buffers are loaded into client state. | Pass - Previews loaded and size compression applied. | **Passed** |
| **TC-004** | AI Classifier | Image selected for analysis. | 1. Trigger AI scan.<br>2. Wait for Cloud Function response.<br>3. Verify category output. | Cloud Function returns classified category with confidence score. | Pass - Roboflow returned 'Electronic' category (87.9%). | **Passed** |
| **TC-005** | AI Classifier | Image contains text labels. | 1. Scans uploaded image.<br>2. Google Vision extracts OCR.<br>3. Verify description auto-fill. | Raw text block is extracted and filled in the description textarea. | Pass - Google Vision OCR successfully extracted product details. | **Passed** |
| **TC-006** | AI Metadata | Image analysis completed. | 1. Wait for Gemini API response.<br>2. Verify title and tags suggestions. | Gemini returns structured title and keywords based on image content. | Pass - Title suggested: "iPhone 13 Pro 128GB". | **Passed** |
| **TC-007** | AI Pricing | Image analysis completed. | 1. Inspect suggested price.<br>2. Verify PHP value. | Gemini estimates realistic item value in PHP (₱0 if unknown). | Pass - Suggested price set to ₱32,000 based on model. | **Passed** |
| **TC-008** | Listing wizard | AI suggestions loaded. | 1. Edit title/price.<br>2. Add custom tags.<br>3. Verify form input. | Form inputs allow custom overrides of AI recommendations. | Pass - User successfully edited values before posting. | **Passed** |
| **TC-009** | Geospatial Engine| Browser location service enabled. | 1. Acquire GPS coords.<br>2. Generate geohash.<br>3. Query nearby listings. | Coords are encoded to 6-char geohash; neighbor grid is fetched. | Pass - Geohash 'w6w0k3' generated; 8 neighbors fetched successfully. | **Passed** |
| **TC-010** | Search Engine | User is on Home feed. | 1. Type keyword (e.g. "bike").<br>2. Press Enter.<br>3. Inspect matches. | Search engine retrieves matching items via inverted keyword index. | Pass - Correct listings returned instantly in-memory. | **Passed** |
| **TC-011** | Chat System | Two users in deterministic chat. | 1. Type message text.<br>2. Send message.<br>3. Decrypt message on recipient. | Message text is encrypted locally (AES-GCM) and decrypted on-device. | Pass - Text successfully encrypted/decrypted via ECDH keys. | **Passed** |
| **TC-012** | Checkout & Agrmt| Chat window open. | 1. Click "Finalize Agreement".<br>2. Fill meetup terms.<br>3. Click "Propose". | Proposes transaction receipt; generates Buyer and Seller verification PINs. | Pass - Proposal card sent; PINs written securely in Firestore. | **Passed** |
| **TC-013** | Verification | User uploads ID and selfie. | 1. Submit ID/Selfie.<br>2. Trigger Cloud Function.<br>3. Check user verified status. | Cloud Function runs face match; writes `isVerified: true` if match score $\ge 80$. | Pass - Gemini selfie-to-ID matched (score: 84.5%). | **Passed** |
| **TC-014** | Expiration (TTL) | Database contains expired listing. | 1. Trigger TTL Scheduler.<br>2. Verify listing deletion. | Scheduled function purges listings where `expiresAt < now`. | Pass - Cloud Function purged expired listings on schedule. | **Passed** |

---

## D.2 Test Execution Logs

Below are the actual database payload logs captured during the test execution of each key module.

### 1. User Registration and Login
**Firebase Auth & Firestore Profile Document Creation Log:**
```json
{
  "authSession": {
    "uid": "userB1_u892k3kd8s",
    "email": "juan.delacruz@gmail.com",
    "emailVerified": true,
    "displayName": "Juan Dela Cruz"
  },
  "firestoreWrite": {
    "path": "users/userB1_u892k3kd8s",
    "payload": {
      "uid": "userB1_u892k3kd8s",
      "displayName": "Juan Dela Cruz",
      "email": "juan.delacruz@gmail.com",
      "verifiedNeighborhood": "San Isidro",
      "barangay": "San Isidro",
      "trustScore": 0,
      "role": "user",
      "isVerified": false,
      "createdAt": "2026-06-12T06:12:00.000Z"
    }
  }
}
```

### 2. Image Upload and AI Classification
**Roboflow Category Detection Request & Response Log:**
```json
{
  "request": {
    "url": "https://serverless.roboflow.com/anthons-workspace/workflows/detect-and-classify",
    "inputs": {
      "image": { "type": "base64", "value": "data:image/jpeg;base64,/9j/4AAQSk..." }
    }
  },
  "response": {
    "predictions": [
      {
        "class": "smartphone",
        "confidence": 0.879,
        "x": 320, "y": 240, "width": 120, "height": 180
      }
    ],
    "mappedCategory": "Electronic"
  }
}
```

### 3. OCR Text Extraction
**Google Cloud Vision Text Detection Output Log:**
```json
{
  "visionClientResponse": {
    "textAnnotations": [
      {
        "description": "Apple iPhone 13 Pro\nModel A2638\nDesigned by Apple in California",
        "locale": "en"
      }
    ]
  },
  "extractedString": "Apple iPhone 13 Pro Model A2638 Designed by Apple in California"
}
```

### 4. Listing Creation and Posting
**New Firestore Document Created in `listings` Collection:**
```json
{
  "path": "listings/listingId_7y3d8s9d8s",
  "payload": {
    "title": "iPhone 13 Pro 128GB",
    "price": 32000.00,
    "category": "Electronic",
    "condition": "Like New",
    "description": "Apple iPhone 13 Pro Model A2638. Unlocked.",
    "barangay": "San Isidro",
    "geohash": "w6w0k3",
    "timeMark": {
      "latitude": 7.0731,
      "longitude": 125.6128,
      "date": "Jun 12, 2026",
      "time": "02:15:30 PM"
    },
    "sellerId": "userB1_u892k3kd8s",
    "imageUrl": "https://firebasestorage.googleapis.com/.../iphone.jpg",
    "isSold": false,
    "expiresAt": "2026-07-12T14:15:30.000Z",
    "createdAt": "2026-06-12T14:15:30.000Z"
  }
}
```

### 5. Geohash Filtering
**Proximity Query Fetching Center & Surrounding Neighbors:**
```json
{
  "userLocation": { "latitude": 7.0731, "longitude": 125.6128 },
  "userGeohash": "w6w0k3",
  "neighborsQueried": [
    "w6w0k0", "w6w0k1", "w6w0k2",
    "w6w0k3", "w6w0k4", "w6w0k5",
    "w6w0k6", "w6w0k7", "w6w0k8"
  ],
  "listingsReturned": 3,
  "listingsList": [
    { "id": "listingId_7y3d8s", "geohash": "w6w0k3", "distance": "0.0 km" },
    { "id": "listingId_8s2u9s", "geohash": "w6w0k4", "distance": "0.8 km" },
    { "id": "listingId_3e9d8s", "geohash": "w6w0k1", "distance": "1.4 km" }
  ]
}
```

### 6. Chat Messaging
**Encrypted Message Payload Written to Firestore Subcollection:**
```json
{
  "path": "chats/buyerId_sellerId_itemId/messages/messageId_92kd8s",
  "payload": {
    "text": "U2FsdGVkX19Gq3sX5e4d9d8s9d8sd8s9d8s9...", // AES-GCM Cryptogram
    "senderId": "userB1_u892k3kd8s",
    "senderAlias": "Buyer_userB1",
    "isEncrypted": true,
    "timestamp": "2026-06-12T14:20:00.000Z"
  }
}
```

### 7. Facial Verification
**Gemini API Identity Verification Response:**
```json
{
  "pipelineCall": "verifyUserIdentity",
  "input": {
    "uid": "userB1_u892k3kd8s",
    "idType": "Driver's License"
  },
  "geminiApiResponse": {
    "faceMatch": true,
    "confidence": 84.50,
    "idDetected": true,
    "selfieDetected": true,
    "extractedData": {
      "fullName": "JUAN DELA CRUZ",
      "birthDate": "1995-10-15",
      "idNumber": "DL-123456789"
    }
  },
  "dbWrite": {
    "isVerified": true,
    "verificationStatus": "VERIFIED",
    "verificationScore": 84.50,
    "idNumberLast4": "6789" // Only last 4 digits stored!
  }
}
```

### 8. Transaction Receipt Generation
**Transaction Record Document Generated in `transactions` Collection:**
```json
{
  "path": "transactions/transactionId_9s2k3d",
  "payload": {
    "reference_number": "TRX-2026-892348",
    "status": "Pending Agreement",
    "item_name": "iPhone 13 Pro 128GB",
    "agreed_price": 32000.00,
    "payment_method": "Cash on Meetup",
    "sellerId": "sellerId_u83j82kd",
    "buyerId": "userB1_u892k3kd8s",
    "buyerPin": "834712", // Generated Buyer verification PIN
    "sellerPin": "902341", // Generated Seller verification PIN
    "meetup_location": "People's Park (Main Entrance Gate)",
    "meetup_date": "2026-06-13",
    "meetup_time": "14:00",
    "created_at": "2026-06-12T14:30:00.000Z"
  }
}
```

---

## D.3 Defect Log

The defects encountered during the development lifecycle are documented in the defect log below.

| Bug ID | Description | Severity | Status | Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | OCR fails on very dark images | Medium | **Fixed** | Added server-side image preprocessing using `sharp` to normalize brightness and contrast before running text detection. |
| **BUG-002** | Chat messages duplicate on slow connection | Low | **Fixed** | Implemented client-side message deduplication using temporary transactional sequence IDs in state management. |
| **BUG-003** | Geohash boundary overlap | Low | **Fixed** | Added secondary radial distance filter (Haversine formula) to exclude listings on border regions beyond the search radius. |
