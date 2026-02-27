import { Card } from '../services/api';

export function sortSearchResults(cards: Card[], searchTerm: string): Card[] {
  // Normalize strings to handle punctuation mismatches (e.g. "Magicians" vs "Magician's")
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '');
  
  const term = normalize(searchTerm);
  
  return [...cards].sort((a, b) => {
      const nameA = normalize(a.name);
      const nameB = normalize(b.name);

      // 1. Exact Match
      if (nameA === term && nameB !== term) return -1;
      if (nameB === term && nameA !== term) return 1;

      // 2. Starts With
      const startsA = nameA.startsWith(term);
      const startsB = nameB.startsWith(term);

      if (startsA && !startsB) return -1;
      if (!startsA && startsB) return 1;

      if (startsA && startsB) {
          // Both start with term -> Sort by length (shortest first)
          if (nameA.length !== nameB.length) {
              return nameA.length - nameB.length;
          }
          // Same length -> Alphabetical
          return nameA.localeCompare(nameB);
      }

      // 3. Contains (or anything else) -> Sort by length, then alphabetical
      if (nameA.length !== nameB.length) {
          return nameA.length - nameB.length;
      }
      
      return nameA.localeCompare(nameB);
  });
}
