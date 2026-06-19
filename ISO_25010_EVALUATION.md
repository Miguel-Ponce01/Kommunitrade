# KOMUNITRADE: ISO/IEC 25010 Quality Evaluation Results
**Manuscript & Project Defense Documentation**

This document contains the technical results of the ISO/IEC 25010 Software Quality Evaluation and System Usability Scale (SUS) survey conducted for the KomuniTrade platform. The evaluation was carried out by 5 IT Experts (System Architects/Software Engineers) and 30 End-Users (local barangay buyers and sellers) using a 5-point Likert scale:
* *5.00 – 4.50:* Outstanding (O)
* *4.49 – 3.50:* Very Satisfactory (VS)
* *3.49 – 2.50:* Satisfactory (S)
* *2.49 – 1.50:* Fair (F)
* *1.49 – 1.00:* Poor (P)

---

## 1. ISO/IEC 25010 Quality Evaluation Summary

| Quality Characteristic | Expert Mean | User Mean | Grand Mean | Verbal Interpretation |
| :--- | :---: | :---: | :---: | :---: |
| **1. Functional Suitability** | 4.80 | 4.85 | **4.83** | Outstanding |
| **2. Performance Efficiency** | 4.60 | 4.70 | **4.65** | Outstanding |
| **3. Compatibility** | 4.50 | 4.65 | **4.58** | Outstanding |
| **4. Usability** | 4.70 | 4.88 | **4.79** | Outstanding |
| **5. Reliability** | 4.65 | 4.75 | **4.70** | Outstanding |
| **6. Security** | 4.90 | 4.80 | **4.85** | Outstanding |
| **7. Maintainability** | 4.75 | N/A | **4.75** | Outstanding |
| **8. Portability** | 4.80 | N/A | **4.80** | Outstanding |
| **Overall Grand Mean** | **4.71** | **4.77** | **4.74** | **Outstanding** |

---

## 2. Detailed Characteristic Breakdown & Remarks

### 2.1 Functional Suitability (Mean: 4.83)
Evaluates whether the system provides functions that meet stated and implied needs when used under specified conditions.
* *Remarks:* The AI image-to-listing workflow (CNN categorization and OCR text extraction) successfully automated listing metadata generation in 98% of test runs. Geohash boundary scanning accurately retrieved nearby items within local neighborhoods without exposing user locations.

### 2.2 Performance Efficiency (Mean: 4.65)
Evaluates the performance relative to the amount of resources used under specified conditions.
* *Remarks:* Server-side image preprocessing using the `sharp` library reduced the base64 API transmission payload size by approximately 65%, maintaining rapid Cloud Function execution times (averaging 2.4 seconds for Gemini + Roboflow analysis).

### 2.3 Compatibility (Mean: 4.58)
Evaluates the degree to which a product can exchange information with other products/systems, and perform its required functions while sharing the same hardware/software environment.
* *Remarks:* The web application compiles and renders responsively on Google Chrome, Safari, and Firefox. It performs cleanly across mobile viewports, tablets, and desktop screen sizes.

### 2.4 Usability (Mean: 4.79)
Evaluates the degree to which a product can be used by specified users to achieve specified goals with effectiveness, efficiency, and satisfaction.
* *Remarks:* End-users rated the listing posting wizard extremely highly, noting that the AI auto-fill capability significantly reduces manual data entry time. Visual feedback indicators (trust badges, verification indicators) were reported as clear and intuitive.

### 2.5 Reliability (Mean: 4.70)
Evaluates the degree to which a system performs specified functions under specified conditions for a specified period of time.
* *Remarks:* System availability was maintained at 99.9% during testing. The offline queue system (`offlineQueue` in Firestore rules) successfully cached listings and chat messages in IndexedDB when network coverage was lost, uploading them automatically upon reconnection.

### 2.6 Security (Mean: 4.85)
Evaluates the degree to which a product protects information and data so that persons/other products have the degree of data access appropriate to their types and levels of authorization.
* *Remarks:* Rated highest by IT experts due to client-side End-to-End Encryption (E2EE) using ECDH Curve P-256 for key exchange and AES-GCM for message body encryption. Strict Firestore collection security rules prevent unauthorized access to private chats and masked transaction receipts.

### 2.7 Maintainability (Mean: 4.75)
Evaluates the degree of effectiveness and efficiency with which a product can be modified by the intended maintainers.
* *Remarks:* The clean division between Vite/React on the frontend and Firebase serverless Cloud Functions on the backend allows for independent updates to AI models and security rules. Codebase folders are highly modular and decoupled.

### 2.8 Portability (Mean: 4.80)
Evaluates the degree of effectiveness and efficiency with which a system can be transferred from one hardware, software or other operational or usage environment to another.
* *Remarks:* Firebase hosting configurations (`firebase.json`) and CLI deployments make setting up the system environment quick and repeatable.

---

## 3. System Usability Scale (SUS) Results

A standard 10-question System Usability Scale (SUS) questionnaire was administered to the 30 end-users immediately after completing their evaluation tasks. 

### 3.1 SUS Score Summary
* **Average SUS Score:** **84.50 / 100**
* **Grade Equivalent:** **A**
* **Adjective Rating:** **Excellent**
* **Acceptability:** **Acceptable**

### 3.2 Discussion of Usability Impact
A score of 84.50 places KomuniTrade in the top 10% of usable software systems. Evaluators attributed this high rating to:
1. **Low Cognitive Load:** The AI assistant autogenerates listing details (title, category, tags) directly from a photo upload, removing the need for manual typing.
2. **Confidence-Building Interface:** Verification indicators, safe meeting spot recommendations, and clear transaction terms build user trust throughout the trade workflow.
