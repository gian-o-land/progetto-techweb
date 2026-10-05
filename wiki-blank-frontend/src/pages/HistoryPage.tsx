import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface GameHistoryEntry {
  id: number;
  username: string;
  title: string;
  obfuscatedText: string;
  attemptsCount: number;
  timeElapsedSec: number;
  date: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('http://192.168.242.128:3000/api/games/history');
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Errore nel recupero dello storico', err);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>📚 Storico Partite Concluse</h2>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          Indietro
        </button>
      </div>

      {history.length === 0 ? (
        <p>Nessuna partita è stata ancora completata.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
          {history.map((game) => (
            <div key={game.id} style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '15px', backgroundColor: '#f9f9f9' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{game.title}</h3>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', fontSize: '14px', color: '#555' }}>
                <span><strong>Giocatore:</strong> {game.username}</span>
                <span><strong>Tentativi:</strong> {game.attemptsCount}</span>
                <span><strong>Tempo:</strong> {game.timeElapsedSec} s</span>
                <span><strong>Data:</strong> {new Date(game.date).toLocaleDateString()}</span>
              </div>
              <div style={{ 
                lineHeight: '1.6', 
                fontSize: '14px', 
                whiteSpace: 'pre-wrap', 
                backgroundColor: '#fff', 
                padding: '15px', 
                border: '1px solid #eee',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {game.obfuscatedText}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}