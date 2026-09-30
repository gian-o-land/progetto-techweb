import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente dal file .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Permette al frontend di comunicare con questo backend
app.use(express.json()); // Permette di leggere i body delle richieste in formato JSON

// Rotta di test
app.get('/', (req: Request, res: Response) => {
  res.send('Le API di WikiBlank sono operative!');
});

// Avvio del server
app.listen(port, () => {
  console.log(`Server backend in ascolto sulla porta ${port}`);
});