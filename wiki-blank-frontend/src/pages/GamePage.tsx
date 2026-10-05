import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface GameData {
  gameId: number;
  obfuscatedText: string;
  revealedWords: string[];
  attemptsCount: number;
  timeElapsedSec?: number;
  status?: string;
  originalText?: string;
}

export default function GamePage() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [wordGuess, setWordGuess] = useState('');
  const [titleGuess, setTitleGuess] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    // Cerca una partita in corso al caricamento della pagina
    const fetchCurrentGame = async () => {
      try {
        const res = await fetch('http://192.168.242.128:3000/api/games/current', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGameData(data);
          setMessage('Bentornato! Continua la tua partita.');
        }
      } catch (err) {
        console.error('Errore nel recupero della partita', err);
      }
    };

    fetchCurrentGame();
  }, [navigate]);

  const startGame = async () => {
    try {
      setMessage('Caricamento articolo...');
      setGameData(null); // Resetta i dati precedenti
      const res = await fetch('http://192.168.242.128:3000/api/games/start', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) {
        setGameData(data);
        setMessage('Nuova partita iniziata!');
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage('Errore di connessione al server' + err);
    }
  };

  const handleWordGuess = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!wordGuess.trim() || !gameData) return;

    try {
      const res = await fetch(`http://192.168.242.128:3000/api/games/${gameData.gameId}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ word: wordGuess })
      });
      const data = await res.json();
      if (res.ok) {
        setGameData({ ...gameData, ...data });
        setMessage(data.message);
        setWordGuess('');
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage('Errore durante il tentativo.' + err);
    }
  };

  const handleTitleGuess = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!titleGuess.trim() || !gameData) return;

    try {
      const res = await fetch(`http://192.168.242.128:3000/api/games/${gameData.gameId}/guess-title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ title: titleGuess })
      });
      const data = await res.json();
      if (res.ok) {
        setGameData({ ...gameData, status: data.status, obfuscatedText: data.originalText || gameData.obfuscatedText, attemptsCount: data.attemptsCount, timeElapsedSec: data.timeElapsedSec });
        setMessage(data.message);
        setTitleGuess('');
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage('Errore durante il tentativo.' + err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>WikiBlank</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/history')} style={{ padding: '5px 10px', cursor: 'pointer' }}>Storico</button>
          <button onClick={() => navigate('/leaderboard')} style={{ padding: '5px 10px', cursor: 'pointer' }}>Classifica</button>
          <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ margin: '20px 0', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <strong>Stato:</strong> {message}
      </div>

      {!gameData ? (
        <button onClick={startGame} style={{ padding: '10px 20px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>
          Nuova Partita
        </button>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div><strong>Tentativi:</strong> {gameData.attemptsCount}</div>
          </div>

          {gameData.status === 'WON' && (
            <div style={{ padding: '15px', backgroundColor: '#e8f5e9', border: '1px solid #4CAF50', borderRadius: '5px', marginBottom: '20px' }}>
              <h3 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>Hai Vinto! 🎉</h3>
              <p>Tempo impiegato: <strong>{gameData.timeElapsedSec} secondi</strong></p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button onClick={startGame} style={{ padding: '10px 15px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>Gioca Ancora</button>
                <button onClick={() => navigate('/leaderboard')} style={{ padding: '10px 15px', cursor: 'pointer', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px' }}>Vedi Classifica</button>
              </div>
            </div>
          )}

          {gameData.status !== 'WON' && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <form onSubmit={handleWordGuess} style={{ display: 'flex', gap: '5px' }}>
                <input value={wordGuess} onChange={(e) => setWordGuess(e.target.value)} placeholder="Indovina una parola" style={{ padding: '8px' }} />
                <button type="submit" style={{ padding: '8px', cursor: 'pointer' }}>Invia</button>
              </form>
              <form onSubmit={handleTitleGuess} style={{ display: 'flex', gap: '5px' }}>
                <input value={titleGuess} onChange={(e) => setTitleGuess(e.target.value)} placeholder="Indovina il titolo!" style={{ padding: '8px', borderColor: 'gold' }} />
                <button type="submit" style={{ padding: '8px', cursor: 'pointer', backgroundColor: 'gold', border: '1px solid darkgoldenrod' }}>Risolvi</button>
              </form>
            </div>
          )}

          <div style={{ lineHeight: '1.8', fontSize: '16px', whiteSpace: 'pre-wrap', backgroundColor: '#fff', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            {gameData.obfuscatedText}
          </div>
        </div>
      )}
    </div>
  );
}