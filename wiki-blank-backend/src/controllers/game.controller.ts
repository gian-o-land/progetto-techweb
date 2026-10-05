import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../models/prismaClient';
import { fetchValidRandomArticle, obfuscateText } from '../services/mediawiki.service';

// Parole base sempre svelate all'inizio
const DEFAULT_REVEALED_WORDS = ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'e', 'o', 'che'];

export const startGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // 1. Recupera un articolo valido da Wikipedia
    const article = await fetchValidRandomArticle();

    // 2. Crea la nuova partita nel database
    const newGame = await prisma.game.create({
      data: {
        userId: userId,
        articleTitle: article.title,
        originalText: article.originalText,
        revealedWords: DEFAULT_REVEALED_WORDS,
        status: 'IN_PROGRESS',
      }
    });

    // 3. Oscura il testo usando le parole base
    const obfuscated = obfuscateText(article.originalText, DEFAULT_REVEALED_WORDS);

    // 4. Invia i dati al frontend nascondendo il testo e il titolo originali
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
    const users = await prisma.user.findMany({
      include: {
        games: { where: { status: 'WON' } }
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