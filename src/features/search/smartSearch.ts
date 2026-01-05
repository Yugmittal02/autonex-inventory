export type SmartSearchOptions = {
  useFuzzy?: boolean;
};

export type SmartSearchResult<TItem = any> = {
  match: boolean;
  items: Array<TItem & { score?: number; pageName?: string }>;
  interpretedAs: string;
  keywords?: string[];
};

// ---------------------------------------------------------
// DESI DICTIONARY (SYNONYM MAP) - Hindi/Hinglish -> English
// ---------------------------------------------------------
export const synonymMap: Record<string, string> = {
  // Liquids
  tel: 'oil',
  paani: 'coolant',
  coolent: 'coolant',
  pani: 'coolant',
  grease: 'lubricant',
  petrol: 'fuel',
  diesel: 'fuel',

  // Body Parts
  sheesha: 'mirror',
  glass: 'mirror',
  batti: 'light',
  headlight: 'light',
  'tail light': 'back light',
  dabba: 'kit',
  pahiya: 'wheel',
  tyre: 'tire',
  patti: 'belt',
  patla: 'gasket',

  // Engine Parts
  plug: 'spark plug',
  coil: 'ignition',
  injector: 'fuel injector',
  silencer: 'exhaust',
  radiator: 'coolant',
  ac: 'air conditioner',

  // Actions/Status
  awaz: 'sound',
  'khat khat': 'suspension',
  thanda: 'ac',
  garam: 'heat',
  'start nahi': 'battery',
  jhatka: 'plug',
  dhuan: 'smoke',
  leak: 'seal',

  // Common Misspellings
  filtar: 'filter',
  filtter: 'filter',
  brack: 'brake',
  brek: 'brake',
  cushon: 'cushion',
  shocker: 'shock absorber',
  shockar: 'shock absorber',
  steerin: 'steering',
  clutc: 'clutch',
  geer: 'gear',

  // Car Names (Common Hindi/Hinglish)
  swiftt: 'swift',
  creata: 'creta',
  cretta: 'creta',
  tharr: 'thar',
  innova: 'innova crysta',
  fortunar: 'fortuner',
  baleeno: 'baleno',
};

export function applySynonyms(input: string): string {
  const raw = (input || '').toLowerCase().trim();
  if (!raw) return '';

  let processed = raw;
  for (const key of Object.keys(synonymMap)) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(processed)) processed = processed.replace(regex, synonymMap[key]);
  }
  return processed;
}

// ---------------------------------------------------------
// FUZZY SEARCH (Levenshtein)
// ---------------------------------------------------------
function fuzzySearch(query: string, items: string[], maxDistance: number = 2): string[] {
  const levenshtein = (a: string, b: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] =
          b[i - 1] === a[j - 1]
            ? matrix[i - 1][j - 1]
            : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  };

  const q = (query || '').toLowerCase();
  return items
    .map((item) => ({ item, distance: levenshtein(q, (item || '').toLowerCase()) }))
    .filter((r) => r.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .map((r) => r.item);
}

// ---------------------------------------------------------
// TRIE (prefix suggestions)
// ---------------------------------------------------------
type TrieResult<T> = { word: string; data: T };

class TrieNode<T> {
  children = new Map<string, TrieNode<T>>();
  results: Array<TrieResult<T>> = [];
}

class Trie<T = any> {
  private root = new TrieNode<T>();

  insert(word: string, data: T): void {
    const normalized = (word || '').toLowerCase().trim();
    if (!normalized) return;

    let node = this.root;
    for (const ch of normalized) {
      const next = node.children.get(ch) ?? new TrieNode<T>();
      node.children.set(ch, next);
      node = next;
    }
    node.results.push({ word: normalized, data });
  }

  searchPrefix(prefix: string, limit: number = 10): Array<TrieResult<T>> {
    const normalized = (prefix || '').toLowerCase().trim();
    if (!normalized) return [];

    let node = this.root;
    for (const ch of normalized) {
      const next = node.children.get(ch);
      if (!next) return [];
      node = next;
    }

    const out: Array<TrieResult<T>> = [];
    const stack: TrieNode<T>[] = [node];
    while (stack.length && out.length < limit) {
      const current = stack.pop()!;
      for (const r of current.results) {
        out.push(r);
        if (out.length >= limit) break;
      }
      if (out.length >= limit) break;
      for (const child of current.children.values()) stack.push(child);
    }
    return out;
  }
}

// ---------------------------------------------------------
// BLOOM FILTER (kept for parity; currently only populated)
// ---------------------------------------------------------
class BloomFilter {
  private bitArray: boolean[];
  private hashFunctions: number;

  constructor(size: number = 1000, hashFunctions: number = 3) {
    this.bitArray = new Array(size).fill(false);
    this.hashFunctions = hashFunctions;
  }

  private hash(str: string, seed: number): number {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % this.bitArray.length;
  }

  add(item: string): void {
    for (let i = 0; i < this.hashFunctions; i++) {
      const index = this.hash(item, i * 31);
      this.bitArray[index] = true;
    }
  }

  mightContain(item: string): boolean {
    for (let i = 0; i < this.hashFunctions; i++) {
      const index = this.hash(item, i * 31);
      if (!this.bitArray[index]) return false;
    }
    return true;
  }
}

const productTrie = new Trie<any>();
const searchBloomFilter = new BloomFilter(10000, 5);

// ---------------------------------------------------------
// SMART SEARCH WITH TRIE + FUZZY MATCHING
// ---------------------------------------------------------
export const SmartSearchEngine = {
  initialized: false,

  initialize(entries: any[]) {
    if (SmartSearchEngine.initialized) return;
    (entries || []).forEach((entry: any) => {
      productTrie.insert(entry.car, entry);
      if (entry?.car) searchBloomFilter.add(String(entry.car).toLowerCase());
    });
    SmartSearchEngine.initialized = true;
  },

  search(query: string, entries: any[], useFuzzy: boolean = false) {
    if (!query?.trim()) return entries;

    const queryLower = query.toLowerCase();

    const trieResults = productTrie.searchPrefix(queryLower, 50);
    if (trieResults.length > 0) {
      const trieIds = new Set(trieResults.map((r) => r.data?.id).filter(Boolean));
      return (entries || []).filter((e: any) => trieIds.has(e.id) || String(e.car || '').toLowerCase().includes(queryLower));
    }

    if (useFuzzy) {
      const allNames = (entries || []).map((e: any) => e.car);
      const fuzzyMatches = fuzzySearch(query, allNames, 2);
      const fuzzySet = new Set(fuzzyMatches.map((m) => String(m).toLowerCase()));
      return (entries || []).filter((e: any) => fuzzySet.has(String(e.car || '').toLowerCase()));
    }

    return (entries || []).filter((e: any) => String(e.car || '').toLowerCase().includes(queryLower));
  },

  getSuggestions(query: string, limit: number = 5) {
    if (!query?.trim()) return [];
    return productTrie.searchPrefix(query.toLowerCase(), limit).map((r) => r.word);
  },
};

// ---------------------------------------------------------
// INTELLIGENT SEARCH ALGORITHM (Fuzzy Brain)
// ---------------------------------------------------------
export function performSmartSearch(
  rawTranscript: string,
  inventory: any[],
  pages: any[],
  options: SmartSearchOptions = {}
): SmartSearchResult {
  const useFuzzy = options.useFuzzy !== false;

  const processedText = applySynonyms(rawTranscript);

  // Keep the original console behavior (useful for debugging voice search)
  try {
    console.log(`Original: "${rawTranscript}" -> Processed: "${processedText}"`);
  } catch {
    /* noop */
  }

  const fillerWords = /\b(check|search|find|dhundo|dekho|batao|kya|hai|available|stock|mein|ka|ki|ke|se|aur|or|the|is|a|an|for|in|of)\b/gi;
  const keywords = processedText
    .replace(fillerWords, '')
    .trim()
    .split(/\s+/)
    .filter((k) => k.length > 1);

  if (keywords.length === 0) return { match: false, items: [], interpretedAs: processedText };

  const scoredItems = (inventory || []).map((item: any) => {
    let score = 0;
    const itemCar = String(item.car || '').toLowerCase();
    const page = (pages || []).find((p: any) => p.id === item.pageId);
    const itemName = String(page?.itemName || '').toLowerCase();
    const combinedText = `${itemCar} ${itemName}`;

    keywords.forEach((word) => {
      if (combinedText.includes(word)) {
        score += 10;
        return;
      }

      if (!useFuzzy) return;

      if (word.length > 3) {
        const partialWord = word.slice(0, -1);
        if (combinedText.includes(partialWord)) score += 5;
      } else if (combinedText.split(' ').some((w) => w.startsWith(word[0]))) {
        score += 2;
      }
    });

    return { ...item, score, pageName: itemName };
  });

  const matches = scoredItems
    .filter((i: any) => i.score > 0)
    .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
    .slice(0, 10);

  return {
    match: matches.length > 0,
    items: matches,
    interpretedAs: processedText,
    keywords,
  };
}
