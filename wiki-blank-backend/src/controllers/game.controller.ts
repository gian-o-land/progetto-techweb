import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../models/prismaClient';
import { fetchValidRandomArticle, obfuscateText } from '../services/mediawiki.service';

// Parole base sempre svelate all'inizio
const DEFAULT_REVEALED_WORDS = ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'e', 'o', 'che'];

export const startGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.body;

    if (!category) {
      res.status(400).json({ error: 'Devi selezionare un argomento per iniziare' });
      return;
    }

    // Invece di una sola categoria radice, creiamo pool di SOTTOCATEGORIE ricchissime di articoli
    const wikiCategories: Record<string, string[]> = {
      'videogioco': [
        "Categoria:Videogiochi_d'azione",
        "Categoria:Videogiochi_di_ruolo",
        "Categoria:Videogiochi_platform",
        "Categoria:Videogiochi_sparatutto",
        "Categoria:Videogiochi_d'avventura"
      ],
      'film': [
        "Categoria:Film_commedia",
        "Categoria:Film_drammatici",
        "Categoria:Film_di_fantascienza",
        "Categoria:Film_thriller",
        "Categoria:Film_d'azione"
      ],
      'libro': [
        "Categoria:Romanzi_del_XX_secolo",
        "Categoria:Romanzi_del_XIX_secolo",
        "Categoria:Romanzi_fantasy",
        "Categoria:Romanzi_di_fantascienza",
        "Categoria:Romanzi_gialli"
      ],
      'serie tv': [
        "Categoria:Serie_televisive_comiche",
        "Categoria:Serie_televisive_drammatiche",
        "Categoria:Serie_televisive_di_fantascienza",
        "Categoria:Serie_televisive_thriller",
        "Categoria:Serie_televisive_d'azione"
      ]
    };

    const targetCategoriesList = wikiCategories[category];
    if (!targetCategoriesList) {
      res.status(400).json({ error: 'Argomento non valido' });
      return;
    }

    // Scegliamo una SOTTOCATEGORIA a caso dal nostro pool
    const selectedSubcategory = targetCategoriesList[Math.floor(Math.random() * targetCategoriesList.length)];

    // 1. Chiediamo a Wikipedia fino a 500 articoli appartenenti a quella specifica sottocategoria
    const catUrl = `https://it.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${selectedSubcategory}&cmnamespace=0&cmlimit=500&format=json`;
    
    const catResponse = await fetch(catUrl);
    const catData = await catResponse.json();
    const members = catData.query?.categorymembers;

    if (!members || members.length === 0) {
      res.status(500).json({ error: 'Nessun articolo trovato, riprova' });
      return;
    }

    // 2. Estraiamo un TITOLO a caso (da qui in poi il tuo codice rimane identico!)
    const randomArticle = members[Math.floor(Math.random() * members.length)];
    const selectedTitle = randomArticle.title;
    
    // 3. Facciamo una SECONDA CHIAMATA per farci dare il testo di quel titolo specifico
    const textUrl = `https://it.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(selectedTitle)}&format=json`;
    const textResponse = await fetch(textUrl);
    const textData = await textResponse.json();
    
    // Estraiamo il testo dall'oggetto "pages" di Wikipedia
    const pages = textData.query?.pages;
    if (!pages) throw new Error("Errore nel parsing della pagina Wikipedia");
    
    const pageId = Object.keys(pages)[0];
    if (!pageId) {
      res.status(500).json({ error: 'ID pagina Wikipedia non trovato' });
      return;
    }
    
    const articleText = pages[pageId].extract;

    if (!articleText || articleText.trim() === '') {
      res.status(500).json({ error: 'Il testo di questo articolo è vuoto, riprova' });
      return;
    }

    const userId = req.user!.userId;

    // 4. Ora salviamo il gioco nel DB usando il VERO testo (articleText)
    const newGame = await prisma.game.create({
      data: {
        userId: userId,
        articleTitle: selectedTitle,
        originalText: articleText, // <--- Qui passiamo il testo appena scaricato!
        revealedWords: DEFAULT_REVEALED_WORDS, // Assicurati di avere questa costante importata in cima
        status: 'IN_PROGRESS',
        category: category,
      }
    });

    // Oscura il testo usando le parole base
    const obfuscated = obfuscateText(articleText, DEFAULT_REVEALED_WORDS);

    // Invia i dati al frontend
    res.status(201).json({
      gameId: newGame.id,
      obfuscatedText: obfuscated,
      revealedWords: newGame.revealedWords,
      attemptsCount: newGame.attemptsCount,
      timeElapsedSec: newGame.timeElapsedSec
    });
  } catch (error) {
    console.error("Errore avvio partita:", error);
    res.status(500).json({ error: 'Impossibile avviare la partita' });
  }
};

export const guessWord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "ID partita mancante nell'URL" });
      return;
    }

    const gameId = parseInt(id as string, 10);
    const { word } = req.body;

    if (!word || typeof word !== 'string') {
      res.status(400).json({ error: 'Parola mancante o formato non valido' });
      return;
    }

    // Puliamo la parola da spazi e la rendiamo minuscola per evitare doppioni (es: "Casa" e "casa")
    const cleanWord = word.trim().toLowerCase();

    const game = await prisma.game.findUnique({ where: { id: gameId } });

    if (!game || game.userId !== userId) {
      res.status(404).json({ error: 'Partita non trovata o non autorizzata' });
      return;
    }

    if (game.status !== 'IN_PROGRESS') {
      res.status(400).json({ error: 'Questa partita è già terminata' });
      return;
    }

    // Se l'utente ha già indovinato questa parola, non sprechiamo un tentativo
    if (game.revealedWords.includes(cleanWord)) {
      const obfuscated = obfuscateText(game.originalText, game.revealedWords);
      res.json({
        message: 'Parola già inserita!',
        obfuscatedText: obfuscated,
        revealedWords: game.revealedWords,
        attemptsCount: game.attemptsCount
      });
      return;
    }

    // Prisma ci permette di "spingere" (push) un nuovo elemento in un array JSON e incrementare i contatori in un colpo solo
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        revealedWords: { push: cleanWord },
        attemptsCount: { increment: 1 }
      }
    });

    const obfuscated = obfuscateText(updatedGame.originalText, updatedGame.revealedWords);

    res.json({
      message: 'Tentativo registrato',
      obfuscatedText: obfuscated,
      revealedWords: updatedGame.revealedWords,
      attemptsCount: updatedGame.attemptsCount
    });
  } catch (error) {
    console.error("Errore durante il guess:", error);
    res.status(500).json({ error: 'Impossibile registrare il tentativo' });
  }
};

export const guessTitle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!id || !title || typeof title !== 'string') {
      res.status(400).json({ error: 'ID partita o titolo mancante' });
      return;
    }

    const gameId = parseInt(id as string, 10);
    const userId = req.user!.userId;

    const game = await prisma.game.findUnique({ where: { id: gameId } });

    if (!game || game.userId !== userId) {
      res.status(404).json({ error: 'Partita non trovata o non autorizzata' });
      return;
    }

    if (game.status !== 'IN_PROGRESS') {
      res.status(400).json({ error: 'Questa partita è già terminata' });
      return;
    }

    // Normalizziamo le stringhe per ignorare maiuscole e spazi extra
    const cleanGuess = title.trim().toLowerCase();
    const actualTitle = game.articleTitle.trim().toLowerCase();

    if (cleanGuess === actualTitle) {
      // Calcola i secondi trascorsi dall'inizio della partita
      const timeElapsed = Math.floor((Date.now() - game.createdAt.getTime()) / 1000);

      const wonGame = await prisma.game.update({
        where: { id: gameId },
        data: {
          status: 'WON',
          attemptsCount: { increment: 1 },
          timeElapsedSec: timeElapsed // Salviamo il tempo nel database
        }
      });

      res.json({
        message: 'Hai vinto! Titolo indovinato.',
        status: wonGame.status,
        originalText: wonGame.originalText,
        attemptsCount: wonGame.attemptsCount,
        timeElapsedSec: wonGame.timeElapsedSec
      });
    } else {
      // Errore: incrementiamo solo i tentativi
      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
          attemptsCount: { increment: 1 }
        }
      });

      res.json({
        message: 'Titolo errato, riprova!',
        status: updatedGame.status,
        attemptsCount: updatedGame.attemptsCount
      });
    }
  } catch (error) {
    console.error("Errore durante la verifica del titolo:", error);
    res.status(500).json({ error: 'Impossibile elaborare il tentativo' });
  }
};

// Recupera la partita in corso se l'utente aggiorna la pagina
export const getCurrentGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const game = await prisma.game.findFirst({
      where: { userId: userId, status: 'IN_PROGRESS' },
      orderBy: { createdAt: 'desc' }
    });

    if (!game) {
      res.status(404).json({ message: 'Nessuna partita in corso' });
      return;
    }

    const obfuscated = obfuscateText(game.originalText, game.revealedWords);
    res.json({
      gameId: game.id,
      obfuscatedText: obfuscated,
      revealedWords: game.revealedWords,
      attemptsCount: game.attemptsCount,
      status: game.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero della partita' });
  }
};

// Genera la classifica basata su partite vinte e tempo medio
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query;

    const gameFilter: any = { status: 'WON' };

    if (category && category !== 'generale') {
      gameFilter.category = category as string;
    }
    
    const users = await prisma.user.findMany({
      include: {
        games: { where: gameFilter }
      }
    });

    const leaderboard = users.map(user => {
      const wonGames = user.games;
      const gamesWon = wonGames.length;
      const totalTime = wonGames.reduce((acc, game) => acc + (game.timeElapsedSec || 0), 0);
      const avgTimeSec = gamesWon > 0 ? Math.round(totalTime / gamesWon) : 0;

      return { username: user.username, gamesWon, avgTimeSec };
    })
    .filter(u => u.gamesWon > 0) // Mostriamo solo chi ha vinto almeno una volta
    .sort((a, b) => {
      if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon; // 1° criterio: Partite vinte
      return a.avgTimeSec - b.avgTimeSec; // 2° criterio: Tempo medio (minore è meglio)
    });

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel caricamento della classifica' });
  }
};

export const getCompletedGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query;

    const gameFilter: any = { status: { in: ['WON', 'LOST'] } };
    
    if (category && category !== 'generale') {
      gameFilter.category = category as string;
    }

    // Recuperiamo le ultime 50 partite vinte, dal più recente al più vecchio
    const games = await prisma.game.findMany({
      where: gameFilter,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } }
      },
      take: 50 
    });

    const history = games.map(game => ({
      id: game.id,
      username: game.user.username,
      title: game.articleTitle,
      status: game.status,
      category: game.category,
      obfuscatedText: obfuscateText(game.originalText, game.revealedWords),
      attemptsCount: game.attemptsCount,
      timeElapsedSec: game.timeElapsedSec,
      date: game.createdAt
    }));

    res.json(history);
  } catch (error) {
    console.error("Errore recupero storico:", error);
    res.status(500).json({ error: 'Errore nel caricamento dello storico partite' });
  }
};

export const surrenderGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const gameId = parseInt(id as string, 10);
    const userId = req.user!.userId;

    const game = await prisma.game.findUnique({ where: { id: gameId } });

    if (!game || game.userId !== userId) {
      res.status(404).json({ error: 'Partita non trovata o non autorizzata' });
      return;
    }

    if (game.status !== 'IN_PROGRESS') {
      res.status(400).json({ error: 'Questa partita è già terminata' });
      return;
    }

    const timeElapsed = Math.floor((Date.now() - game.createdAt.getTime()) / 1000);

    const lostGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'LOST',
        timeElapsedSec: timeElapsed
      }
    });

    res.json({
      message: 'Ti sei arreso. Ecco la soluzione!',
      status: lostGame.status,
      originalText: lostGame.originalText,
      articleTitle: lostGame.articleTitle, // Restituiamo il titolo da mostrare all'utente
      attemptsCount: lostGame.attemptsCount,
      timeElapsedSec: lostGame.timeElapsedSec
    });
  } catch (error) {
    console.error("Errore durante la resa:", error);
    res.status(500).json({ error: 'Impossibile elaborare la resa' });
  }
};