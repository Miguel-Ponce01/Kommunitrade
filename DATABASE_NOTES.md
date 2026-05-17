# KOMUNITRADE: Database Schema & Entity Relationship Model

This file contains the technical notes for the KomuniTrade database structure, designed for use in your manuscript and project defense.

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    %% Relationships
    USER ||--o{ LISTING : "posts" %% A user can post many listings
    USER ||--o{ CHAT : "participates" %% A user can participate in many chats (as buyer or seller)
    USER ||--o{ MESSAGE : "sends" %% A user can send many messages
    USER ||--o{ TRANSACTION : "involved in" %% A user can be involved in many transactions
    
    LISTING ||--o{ CHAT : "has" %% A listing can have many chat threads
    LISTING ||--o{ TRANSACTION : "part of" %% A listing can be part of transactions (usually 1 successful)
    
    CHAT ||--o{ MESSAGE : "contains" %% A chat thread contains many messages

    USER {
        string uid PK "Anonymous ID (Firebase Auth)"
        string email "Email Address"
        string displayName "Alias"
        string phoneNumber "Mobile Number"
        string verifiedNeighborhood "Barangay"
        string bio "User Bio"
        string profileImage "Avatar URL"
        string communityStatus "Member Badge"
        float trustScore "Reputation Rating"
        string tradingMode "Default Trading Mode (Cash/Barter/Both)"
        array savedSpots "Saved hotspot list"
        object notificationPrefs "Messages, Price Drops, Reminders, SMS toggles"
        boolean exactLocation "Privacy toggle for GPS precision"
        boolean isVerified "Identity Verified via Face API"
        float verificationScore "Facial Match Confidence"
        string verifiedAt "Verification Timestamp"
    }

    LISTING {
        string id PK "Item ID (Auto-generated)"
        string sellerId FK "Owner"
        string title "Name"
        float price "PHP"
        string category "Type"
        string condition "Quality Scale"
        string barangay "Location"
        object timeMark "GPS Proof (lat, lng, date, time)"
        string geohash "Search Index"
        timestamp expiresAt "TTL expiration"
        boolean isSold "Status"
        string imageUrl "Primary Photo URL"
        array imageUrls "Up to 4 Photos"
        timestamp createdAt "Posting timestamp"
        string description "Extracted OCR or Custom Text"
        array tags "Search keywords"
    }

    CHAT {
        string id PK "buyerId_sellerId_itemId (Deterministic)"
        array participants "Array of UIDs"
        string lastMessage "Preview content"
        string lastTimestamp "Last activity time"
        string itemTitle "Listing Title"
        string itemId FK "Listings.id"
        string sellerId FK "Users.uid"
        string buyerId FK "Users.uid"
    }

    MESSAGE {
        string id PK "Auto-generated"
        string chatId FK "Chats.id"
        string text "Encrypted message content"
        string senderId FK "Users.uid"
        string senderAlias "Friendly name"
        string timestamp "Sending time"
        boolean isEncrypted "Double Ratchet Signal E2EE flag"
    }

    TRANSACTION {
        string id PK "Auto-generated"
        string reference_number "TRX receipt format (TRX-YYYY-XXXXXX)"
        string itemId FK "Listings.id"
        string item_name "Item Title"
        string item_condition "Listing condition"
        float agreed_price "Agreed amount"
        string payment_method "Cash, GCash, or Maya"
        string seller_masked_name "Masked Seller Name"
        string sellerId FK "Users.uid"
        string buyer_name "Buyer Alias"
        string buyerId FK "Users.uid"
        string meetup_location "Hotspot name"
        string meetup_date "Scheduled date"
        string meetup_time "Scheduled time"
        string agreement_summary "Receipt terms description"
        string status "Pending Agreement, Confirmed, Completed, Cancelled"
        timestamp created_at "Initiation timestamp"
    }
```

### Relationships Explained

- **USER to LISTING (1:M)**: A user can post multiple listings, but each listing belongs to only one owner (seller).
- **USER to CHAT (1:M)**: A user can participate in multiple chats (either as a buyer or a seller).
- **USER to MESSAGE (1:M)**: A user can send multiple messages.
- **USER to TRANSACTION (1:M)**: A user can be involved in multiple transactions (as buyer or seller).
- **LISTING to CHAT (1:M)**: A single listing can have multiple chat threads associated with it (different buyers interested).
- **LISTING to TRANSACTION (1:M)**: A listing can be involved in transactions (usually one successful sale).
- **CHAT to MESSAGE (1:M)**: A chat thread contains multiple messages chronologically.

---

## 2. Structural Breakdown

### Users (Anonymous & Profile Preferences)
- **Concept**: Users remain anonymous to protect PII (Personally Identifiable Information).
- **UID**: Directly linked to Firebase Auth.
- **Preferences & Toggles**:
  - `tradingMode` manages default transactional preferences (e.g. Cash, Barter, or Both).
  - `savedSpots` is an array of regional meeting locations chosen by the user in Settings.
  - `notificationPrefs` handles map toggles for SMS alerts, messages, price drops, and reminders.
  - `exactLocation` toggles advanced GPS sharing preferences.
- **Facial Identity Verification**:
  - `isVerified` is flag indicating completed biometric scanning.
  - `verificationScore` stores the Euclidean matching result (threshold of $\geq 65\%$ for matches) via browser-side `face-api.js` SSD Mobilenet v1 & Face Landmarks.
  - `verifiedAt` records the timestamp of successful validation.

### Listings (Hyperlocal Proof of Presence)
- **Time Mark**: A critical technical feature for the defense. It stores the exact `lat`, `lng`, and `timestamp` when a photo was taken, proving the item is physically present in the claimed Barangay.
- **Geohash**: A base32 string representing a geographic area. Used to filter items within a specific radius without heavy SQL calculations.
- **TTL (Time-to-Live)**: The `expiresAt` field determines when a listing is automatically hidden or deleted. Managed by local purge routines in the developer console.

### Messages (Secure & Organized)
- **Privacy**: Messages are indexed by UIDs and listing IDs to ensure only the parties involved can access the thread.
- **Consistent Chat IDs**: Uses a deterministic `chatId` (`buyerId_sellerId_itemId`) to ensure all messages between a buyer and seller for a specific item stay in a single chat box, preventing duplicate threads.
- **Double Ratchet (E2EE)**: Messages carry `isEncrypted: true` with text values locally secured using local browser key states.

### Transactions (Proof of Agreement)
- **GCash-style Receipts**: Transactions log unique `reference_number` values, item metadata, prices, meetup terms, and agreement conditions. Masked identities protect users during final deal completion.

---

## 3. Defense Key Points

- **NoSQL Advantage**: We use Firestore for scalability and real-time synchronization.
- **Data Privacy**: The schema is designed to function without real names, email addresses, or exact home locations.
- **Verification Proof**: The `timeMark` object is the "Digital Receipt" of a listing's authenticity.
- **Hybrid AI Architecture**: Demonstrates the use of both edge AI (TensorFlow.js in browser) and cloud AI (Imagga/Google) for optimal performance and cost balance.
