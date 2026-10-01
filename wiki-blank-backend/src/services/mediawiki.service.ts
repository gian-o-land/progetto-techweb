// wiki-blank-backend/src/services/mediawiki.service.ts

const WIKI_API_URL = 'https://it.wikipedia.org/w/api.php';

interface ArticleData {
  title: string;
  originalText: string;
}

/**
 * Recupera un articolo casuale da Wikipedia scartando quelli troppo brevi o troppo lunghi.
 */
export const fetchValidRandomArticle = async (): Promise<ArticleData> => {
  const MIN_LENGTH = 1500;
  const MAX_LENGTH = 15000;

  while (true) {
    // 1. Ottiene un titolo casuale (namespace 0 = solo articoli reali, niente redirect)
    const randomUrl = `${WIKI_API_URL}?action=query&list=random&rnnamespace=0&rnlimit=1&rnfilterredir=nonredirects&format=json`;
    const randRes = await fetch(randomUrl);
    const randData = await randRes.json();
    const title = randData.query.random[0].title;

    // 2. Recupera il testo pulito (plain text) dell'articolo
    const textUrl = `${WIKI_API_URL}?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(title)}&format=json`;
    const textRes = await fetch(textUrl);
    const textData = await textRes.json();
    
    const pages = textData.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (!pageId) continue;

    const originalText = pages[pageId].extract;

    // 3. Valida la lunghezza. Se l'articolo è idoneo interrompe il ciclo e lo restituisce
    if (originalText && originalText.length >= MIN_LENGTH && originalText.length <= MAX_LENGTH) {
      return { title, originalText };
    }
  }
};

/**
 * Oscura il testo originale rivelando solo le parole presenti nell'array dei tentativi corretti.
 * La punteggiatura e gli spazi vengono mantenuti intatti.
 */
export const obfuscateText = (originalText: string, revealedWords: string[]): string => {
  // Convertiamo in Set per una ricerca O(1) ignorando il case sensitive
  const revealedSet = new Set(revealedWords.map(w => w.toLowerCase()));
  
  // Trova tutte le sequenze di lettere/numeri (incluse accentate italiane)
  return originalText.replace(/[a-zA-ZÀ-ÿ0-9]+/g, (word) => {
    if (revealedSet.has(word.toLowerCase())) {
      return word; // Parola indovinata, la mostra
    }
    // Parola non indovinata, la sostituisce con il carattere di blocco mantenendo la lunghezza
    return '█'.repeat(word.length);
  });
};