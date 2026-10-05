import { Router } from 'express';
import { startGame, guessWord, guessTitle, getCurrentGame, getLeaderboard } from '../controllers/game.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Rotta pubblica per la leaderboard
router.get('/leaderboard', getLeaderboard);

// Tutte le rotte in questo file saranno protette dal middleware
router.use(authenticateToken);

router.get('/current', getCurrentGame);
router.post('/start', startGame);
router.post('/:id/guess', guessWord);
router.post('/:id/guess-title', guessTitle);
export default router;