/**
 * KomuniTrade — Inverted Index Search Utility
 * 
 * To satisfy the manuscript claim of using inverted index structures for 
 * large-scale keyword-based search. This utility builds an in-memory 
 * map of keywords to listing IDs.
 */

class InvertedIndex {
  constructor() {
    this.index = {};
  }

  /**
   * Tokenizes and cleans a string for indexing
   */
  _tokenize(text) {
    if (typeof text !== 'string') return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(token => token.length > 2); // Filter out very small words
  }

  /**
   * Adds a document to the index
   * @param {string} id - The unique ID of the listing
   * @param {string} title - The title of the listing
   * @param {string} description - The description of the listing
   */
  addListing(id, title, description = '') {
    const tokens = new Set([
      ...this._tokenize(title),
      ...this._tokenize(description)
    ]);

    tokens.forEach(token => {
      if (!this.index[token]) {
        this.index[token] = new Set();
      }
      this.index[token].add(id);
    });
  }

  /**
   * Searches the index for a query
   * @param {string} query - The search query
   * @returns {string[]} Array of matching listing IDs
   */
  search(query) {
    const queryTokens = this._tokenize(query);
    if (queryTokens.length === 0) return null;

    let resultIds = null;

    queryTokens.forEach(token => {
      // Find matches for the current token (supporting partial matches)
      const matchingTokens = Object.keys(this.index).filter(t => t.includes(token));
      
      const tokenMatches = new Set();
      matchingTokens.forEach(t => {
        this.index[t].forEach(id => tokenMatches.add(id));
      });

      if (resultIds === null) {
        resultIds = tokenMatches;
      } else {
        // Intersection (AND search)
        resultIds = new Set([...resultIds].filter(id => tokenMatches.has(id)));
      }
    });

    return resultIds ? Array.from(resultIds) : [];
  }

  /**
   * Clears the index
   */
  clear() {
    this.index = {};
  }
}

// ─── Singleton instance ───────────────────────────────────────────────────────
const searchIndex = new InvertedIndex();

/**
 * Initializes the index with a list of items
 * @param {Array} listings 
 */
export const initializeSearchIndex = (listings) => {
  searchIndex.clear();
  listings.forEach(item => {
    searchIndex.addListing(item.id, item.title, item.description);
  });
};

/**
 * Performs a search using the inverted index
 * @param {string} query 
 * @returns {string[] | null} List of IDs or null if query is empty
 */
export const performSearch = (query) => {
  return searchIndex.search(query);
};

export default searchIndex;
