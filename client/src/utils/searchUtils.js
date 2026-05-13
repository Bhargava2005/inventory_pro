/**
 * Simple Fuzzy Matcher
 * Handles subsequence matching and minor typo tolerance (Levenshtein distance)
 */

export const fuzzyMatch = (target, query) => {
  if (!target || !query) return false;
  
  target = target.toLowerCase();
  query = query.toLowerCase().trim();
  if (!query) return true; // Empty search matches everything

  // 1. Exact or Substring match (Fastest)
  if (target.includes(query)) return true;

  // 2. Subsequence match (e.g., "apl" matches "apple")
  // Allows for illiterate users who skip letters
  let qIdx = 0;
  let tIdx = 0;
  while (qIdx < query.length && tIdx < target.length) {
    if (query[qIdx] === target[tIdx]) {
      qIdx++;
    }
    tIdx++;
  }
  if (qIdx === query.length) return true;

  // 3. Typo Tolerance (Levenshtein Distance)
  // Only for longer words to avoid too many false positives
  if (query.length > 3) {
    const distance = levenshteinDistance(target, query);
    // Allow 1 typo for every 4 characters
    const threshold = Math.floor(query.length / 4) + 1;
    if (distance <= threshold) return true;
  }

  return false;
};

// Standard Levenshtein distance algorithm
const levenshteinDistance = (a, b) => {
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
