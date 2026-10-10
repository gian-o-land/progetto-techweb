import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';

interface GameData {
  gameId: number;
  obfuscatedText: string;
  revealedWords: string[];
  attemptsCount: number;
  timeElapsedSec?: number;
  status?: string;
  originalText?: string;
  articleTitle?: string;
}

export default function GamePage() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [category, setCategory] = useState('');
  const [wordGuess, setWordGuess] = useState('');
  const [titleGuess, setTitleGuess] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Cerca una partita in corso al caricamento della pagina
    const fetchCurrentGame = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/games/current', {
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
  }, [navigate, token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const startGame = async () => {
    try {
      setMessage('Caricamento articolo...');
      setGameData(null); // Resetta i dati precedenti
      const res = await fetch('http://localhost:3000/api/games/start', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ category })
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

  const handleWordGuess = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!wordGuess.trim() || !gameData) return;

    try {
      const res = await fetch(`http://localhost:3000/api/games/${gameData.gameId}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

  const handleTitleGuess = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!titleGuess.trim() || !gameData) return;

    try {
      const res = await fetch(`http://localhost:3000/api/games/${gameData.gameId}/guess-title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

  const handleSurrender = async (): Promise<void> => {
    if (!gameData) return;
    
    // Piccola conferma per evitare click accidentali
    if (!window.confirm('Sei sicuro di volerti arrendere? Il titolo e il testo verranno svelati.')) return;

    try {
      const res = await fetch(`http://localhost:3000/api/games/${gameData.gameId}/surrender`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setGameData({ 
          ...gameData, 
          status: data.status, 
          obfuscatedText: data.originalText, 
          articleTitle: data.articleTitle, 
          timeElapsedSec: data.timeElapsedSec 
        });
        setMessage(data.message);
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage('Errore durante la resa.' + err);
    }
  };

  return (
    <div className="container">
      <div className="space-between" style={{ marginBottom: '20px' }}>
        <h2 className="title">WikiBlank</h2>
        <div className="flex-row">
          <button className="btn btn-primary" onClick={() => navigate('/leaderboard')}>Classifica</button>
          <button className="btn btn-primary" onClick={() => navigate('/history')}>Storico</button>
          <button className="btn btn-danger" onClick={handleLogout}>Esci</button>
        </div>
      </div>

      {message && (
        <div className="card" style={{ backgroundColor: '#e0f2fe', borderColor: '#bae6fd', color: '#0369a1' }}>
          {message}
        </div>
      )}

      {!gameData ? (
        <div className="card flex-row">
          <select 
            className="select-field"
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="" disabled>Seleziona argomento</option>
            <option value="videogioco">Videogioco</option>
            <option value="film">Film</option>
            <option value="libro">Libro</option>
            <option value="serie tv">Serie TV</option>
          </select>
          
          <button 
            className="btn btn-success"
            onClick={startGame} 
            disabled={!category}
          >
            Nuova Partita
          </button>
        </div>
      ) : (
        <>
          <div className="card space-between">
            <div>
              <p><strong>Tentativi:</strong> {gameData.attemptsCount}</p>
              <p><strong>Parole scoperte:</strong> {gameData.revealedWords.length}</p>
            </div>
          </div>

          {/* Banner Vittoria */}
          {gameData.status === 'WON' && (
            <div className="card" style={{ backgroundColor: '#ecfdf5', borderColor: '#10b981' }}>
              <h3 style={{ color: 'var(--success-color)', marginBottom: '10px' }}>Hai Vinto! 🎉</h3>
              <p>Tempo impiegato: <strong>{gameData.timeElapsedSec} secondi</strong></p>
              <div className="flex-row" style={{ marginTop: '15px' }}>
                <button className="btn btn-success" onClick={() => { setGameData(null); setMessage(''); }}>Nuova Partita</button>
              </div>
            </div>
          )}

          {/* Banner Sconfitta */}
          {gameData.status === 'LOST' && (
            <div className="card" style={{ backgroundColor: '#fef2f2', borderColor: '#ef4444' }}>
              <h3 style={{ color: 'var(--danger-color)', marginBottom: '10px' }}>Ti sei arreso 🏳️</h3>
              <p>Il titolo dell'articolo era: <strong>{gameData.articleTitle}</strong></p>
              <p>Tempo impiegato: <strong>{gameData.timeElapsedSec} secondi</strong></p>
              <div className="flex-row" style={{ marginTop: '15px' }}>
                <button className="btn btn-success" onClick={() => { setGameData(null); setMessage(''); }}>Scegli un nuovo articolo</button>
              </div>
            </div>
          )}

          {/* Form di gioco */}
          {gameData.status !== 'WON' && gameData.status !== 'LOST' && (
            <div className="card flex-row">
              <form onSubmit={handleWordGuess} className="flex-row">
                <input className="input-field" value={wordGuess} onChange={(e) => setWordGuess(e.target.value)} placeholder="Indovina parola" />
                <button type="submit" className="btn btn-primary">Invia</button>
              </form>
              
              <form onSubmit={handleTitleGuess} className="flex-row">
                <input className="input-field" style={{ borderColor: 'var(--warning-color)' }} value={titleGuess} onChange={(e) => setTitleGuess(e.target.value)} placeholder="Indovina il titolo!" />
                <button type="submit" className="btn" style={{ backgroundColor: 'var(--warning-color)', color: 'white' }}>Risolvi</button>
              </form>

              <button className="btn btn-danger" onClick={handleSurrender} style={{ marginLeft: 'auto' }}>
                Mi Arrendo
              </button>
            </div>
          )}

          {/* Testo Offuscato */}
          <div className="obfuscated-text-container">
            {gameData.obfuscatedText}
          </div>
        </>
      )}
    </div>
  );
}