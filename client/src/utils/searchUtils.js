/**
 * Enhanced Search Utility
 * 1. Checks for exact SKU matches (highest priority)
 * 2. Performs fuzzy matching for product names
 * 3. Sorts results by match quality
 */

// Basic Levenshtein distance
const getLevenshteinDistance = (a, b) => {
  const matrix = Array.from({ length: a.length + 1 }, () => 
    Array.from({ length: b.length + 1 }, () => 0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[a.length][b.length];
};

/**
 * Calculates a match score between query and target
 * Higher is better.
 */
const getMatchScore = (query, target) => {
  if (!target || !query) return 0;
  target = target.toLowerCase();
  query = query.toLowerCase();

  // 1. Exact Match
  if (target === query) return 1000;

  // 2. Starts with query (Prefix match)
  if (target.startsWith(query)) return 500 + query.length;

  // 3. Contains query (Substring match)
  if (target.includes(query)) return 400 + query.length;

  // 4. Subsequence match (e.g., "bil" matches "birla")
  let qIdx = 0;
  let tIdx = 0;
  while (qIdx < query.length && tIdx < target.length) {
    if (query[qIdx] === target[tIdx]) {
      qIdx++;
    }
    tIdx++;
  }
  if (qIdx === query.length) {
    // Score based on how tight the subsequence is
    return 300 + (query.length / target.length) * 100;
  }

  // 5. Fuzzy match (Levenshtein) - number of identical characters logic
  const distance = getLevenshteinDistance(query, target);
  const maxLength = Math.max(query.length, target.length);
  
  // Calculate similarity based on distance
  const similarity = ((maxLength - distance) / maxLength);
  
  // More inclusive threshold for short queries
  const threshold = query.length <= 3 ? 0.3 : 0.4;
  if (similarity > threshold) {
    return similarity * 100;
  }

  return 0;
};

/**
 * Searches a list of products based on a query
 * @param {Array} products - List of product objects
 * @param {string} query - Search string
 * @returns {Array} - Filtered and sorted products
 */
export const searchProducts = (products, query) => {
  if (!query || !query.trim()) return products;
  
  const q = query.trim().toLowerCase();

  // 1. Check for EXACT SKU match (highest priority requirement)
  const exactSkuMatch = products.find(p => p.sku?.toLowerCase() === q);
  if (exactSkuMatch) {
    return [exactSkuMatch];
  }

  // 2. Otherwise, perform fuzzy search on names and SKUs
  const results = products
    .map(p => {
      const nameScore = getMatchScore(q, p.name || '');
      const skuScore = p.sku?.toLowerCase().includes(q) ? 300 : 0;
      const brandScore = getMatchScore(q, p.brand || '');
      
      const maxScore = Math.max(nameScore, skuScore, brandScore);
      
      return { product: p, score: maxScore };
    })
    .filter(res => res.score > 0)
    .sort((a, b) => b.score - a.score);

  return results.map(res => res.product);
};

/**
 * Legacy fuzzyMatch for backward compatibility
 */
export const fuzzyMatch = (target, query) => {
  if (!target || !query) return false;
  target = target.toLowerCase();
  query = query.toLowerCase().trim();
  
  if (!query) return true;
  if (target.includes(query)) return true;

  const distance = getLevenshteinDistance(query, target);
  const maxLength = Math.max(query.length, target.length);
  return (maxLength - distance) / maxLength > 0.5;
};
