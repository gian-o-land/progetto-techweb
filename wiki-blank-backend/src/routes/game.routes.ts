import { Router } from 'express';
import { startGame, guessWord, guessTitle } from '../controllers/game.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Tutte le rotte in questo file saranno protette dal middleware
router.use(authenticateToken);

router.post('/start', startGame);
router.post('/:id/guess', guessWord);
router.post('/:id/guess-title', guessTitle);
export default router;