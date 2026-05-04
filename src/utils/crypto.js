/**
 * KomuniTrade — Pseudo-E2EE Utilities
 * Provides simple symmetric encryption to simulate end-to-end encryption
 * for manuscript claim verification.
 */

// A fixed demo key (in a real app, this would be negotiated per-chat)
const DEMO_SECRET = "KomuniTrade_Secure_2026";

/**
 * Encrypts a string using a simple XOR-based cipher.
 * For demo purposes, we also Base64 encode the result.
 */
export function encryptMessage(text) {
  if (!text) return "";
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ DEMO_SECRET.charCodeAt(i % DEMO_SECRET.length));
  }
  return btoa(result);
}

/**
 * Decrypts a Base64-encoded XOR-cipher string.
 */
export function decryptMessage(encodedText) {
  if (!encodedText) return "";
  try {
    const decoded = atob(encodedText);
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ DEMO_SECRET.charCodeAt(i % DEMO_SECRET.length));
    }
    return result;
  } catch (e) {
    return encodedText; // Fallback to raw text if not encoded
  }
}
