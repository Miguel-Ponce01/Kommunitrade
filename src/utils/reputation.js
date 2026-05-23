/**
 * KomuniTrade - Bayesian Reputation Scoring
 * Implements the weighted Bayesian rating system to counter new-seller bias.
 */

/**
 * Calculates the Bayesian average rating.
 * Formula: W = (v / (v + m)) * R + (m / (v + m)) * C
 * where:
 * - v = number of ratings for the seller
 * - R = average rating of the seller
 * - m = minimum ratings required to be considered credible (baseline weight, e.g. 3)
 * - C = average platform rating baseline (e.g. 4.5)
 * 
 * @param {Array<{rating: number}>} ratings List of rating objects
 * @param {number} m Minimum ratings threshold (default 3)
 * @param {number} C Platform baseline mean rating (default 4.5)
 * @returns {number} Weighted Bayesian rating (1.0 to 5.0 scale)
 */
export function calculateBayesianRating(ratings = [], m = 3, C = 4.5) {
  const v = ratings.length;
  if (v === 0) return 5.0; // Default brand new sellers to 5.0 with low weight

  const totalRating = ratings.reduce((sum, item) => sum + parseFloat(item.rating || 0), 0);
  const R = totalRating / v;

  const W = (v / (v + m)) * R + (m / (v + m)) * C;
  return parseFloat(W.toFixed(2));
}

/**
 * Resolves a visual trust badge class and text based on a credibility score.
 * @param {number} score Credibility rating
 * @returns {{label: string, color: string, badgeClass: string}}
 */
export function getTrustLevel(score) {
  if (score >= 4.8) {
    return { label: "Elite Seller", color: "var(--accent)", badgeClass: "elite" };
  } else if (score >= 4.4) {
    return { label: "Trusted Seller", color: "var(--primary)", badgeClass: "trusted" };
  } else if (score >= 4.0) {
    return { label: "Verified Seller", color: "#10b981", badgeClass: "verified" };
  } else {
    return { label: "Community Member", color: "var(--text-muted)", badgeClass: "regular" };
  }
}
