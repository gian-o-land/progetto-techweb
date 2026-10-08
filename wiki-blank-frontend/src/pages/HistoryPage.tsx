import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface GameHistoryEntry {
  id: number;
  username: string;
  title: string;
  status: string;
  category: string; // <-- Aggiunto
  obfuscatedText: string;
  attemptsCount: number;
  timeElapsedSec: number;
  date: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('generale'); // <-- Stato del filtro
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Aggiungiamo la query string per la categoria, proprio come per la leaderboard
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
  }, [selectedCategory]); // Ricarica lo storico quando la categoria cambia

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>📚 Storico Partite Concluse</h2>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          Indietro
        </button>
      </div>

      {/* Menu a tendina per il filtro */}
      <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <label htmlFor="history-category" style={{ fontWeight: 'bold' }}>Filtra per Categoria:</label>
        <select 
          id="history-category"
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '8px', fontSize: '16px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <option value="generale">Generale (Tutte le categorie)</option>
          <option value="videogioco">Videogiochi</option>
          <option value="film">Film</option>
          <option value="libro">Libri</option>
          <option value="serie tv">Serie TV</option>
        </select>
      </div>

      {history.length === 0 ? (
        <p>Nessuna partita conclusa in questa categoria.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
          {history.map((game) => (
            <div key={game.id} style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '15px', backgroundColor: '#f9f9f9' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <h3 style={{ margin: '0', color: '#2c3e50' }}>{game.title}</h3>
                
                {/* Badge Vittoria/Sconfitta */}
                {game.status === 'WON' ? (
                   <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Vinta 🏆</span>
                ) : (
                   <span style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Persa 🏳️</span>
                )}
                
                {/* Badge Categoria (in grigio e con prima lettera maiuscola) */}
                <span style={{ backgroundColor: '#e0e0e0', color: '#333', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {game.category}
                </span>
              </div>
              
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