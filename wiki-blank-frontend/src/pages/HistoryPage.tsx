import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface GameHistoryEntry {
  id: number;
  username: string;
  title: string;
  status: string;
  category: string;
  obfuscatedText: string;
  attemptsCount: number;
  timeElapsedSec: number;
  date: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('generale');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/games/history?category=${selectedCategory}`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Errore nel recupero dello storico', err);
      }
    };
    fetchHistory();
  }, [selectedCategory]);

  return (
    <div className="container">
      <div className="space-between" style={{ marginBottom: '20px' }}>
        <h2 className="title" style={{ marginBottom: 0 }}>📖 Storico Partite Concluse</h2>
        <button className="btn" onClick={() => navigate(-1)}>Indietro</button>
      </div>

      <div className="card flex-row">
        <label htmlFor="history-category" style={{ fontWeight: 'bold' }}>Filtra per Categoria:</label>
        <select 
          id="history-category"
          className="select-field"
          style={{ width: 'auto' }}
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="generale">Generale (Tutte le categorie)</option>
          <option value="videogioco">Videogiochi</option>
          <option value="film">Film</option>
          <option value="libro">Libri</option>
          <option value="serie tv">Serie TV</option>
        </select>
      </div>

      {history.length === 0 ? (
        <p className="text-muted">Nessuna partita conclusa in questa categoria.</p>
      ) : (
        <div className="flex-col">
          {history.map((game) => (
            <div key={game.id} className="card">
              
              <div className="flex-row" style={{ marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>{game.title}</h3>
                {game.status === 'WON' ? (
                   <span className="badge badge-success">Vinta 🏆</span>
                ) : (
                   <span className="badge badge-danger">Persa 🏳️</span>
                )}
                <span className="badge badge-neutral">{game.category}</span>
              </div>
              
              <div className="flex-row text-muted" style={{ marginBottom: '15px' }}>
                <span><strong>Giocatore:</strong> {game.username}</span>
                <span><strong>Tentativi:</strong> {game.attemptsCount}</span>
                <span><strong>Tempo:</strong> {game.timeElapsedSec} s</span>
                <span><strong>Data:</strong> {new Date(game.date).toLocaleDateString()}</span>
              </div>
              
              <div className="obfuscated-text-container">
                {game.obfuscatedText}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}