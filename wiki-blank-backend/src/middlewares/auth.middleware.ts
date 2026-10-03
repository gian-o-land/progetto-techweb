import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-segreto-di-sviluppo';

// Estendiamo l'interfaccia Request di Express per includere i dati dell'utente loggato
export interface AuthRequest extends Request {
  user?: { userId: number; username: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  // Il token arriva nel formato "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Accesso negato. Token mancante.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
    req.user = decoded; // Salviamo i dati dell'utente nella richiesta per usarli nei controller successivi
    next(); // Passiamo il controllo alla rotta vera e propria
  } catch (error) {
    res.status(403).json({ error: 'Token non valido o scaduto.' });
  }
};