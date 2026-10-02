import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
//import { fetchValidRandomArticle, obfuscateText } from './services/mediawiki.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotta base
app.get('/', (req: Request, res: Response) => {
  res.send('Le API di WikiBlank sono operative!');
});

/*
// Rotta di test per il Service MediaWiki
app.get('/api/test-wiki', async (req: Request, res: Response) => {
  try {
    console.log("Recupero articolo casuale da Wikipedia in corso...");
    
    const article = await fetchValidRandomArticle();
    
    // Fingiamo che l'utente abbia già indovinato queste parole base
    const testRevealedWords = ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'e', 'o', 'che'];
    
    const obfuscated = obfuscateText(article.originalText, testRevealedWords);

    // Restituiamo i primi 1000 caratteri per confrontarli
    res.json({
      title: article.title,
      textLength: article.originalText.length,
      originalPreview: article.originalText.substring(0, 1000) + '...',
      obfuscatedPreview: obfuscated.substring(0, 1000) + '...'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore durante la chiamata a MediaWiki" });
  }
});
*/

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server backend in ascolto su http://0.0.0.0:${port}`);
});