import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  username: string;
  gamesWon: number;
  avgTimeSec: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('generale'); // "generale" è il default
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Aggiungiamo la categoria come query parameter nell'URL
        const res = await fetch(`http://localhost:3000/api/games/leaderboard?category=${selectedCategory}`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        }
      } catch (err) {
        console.error('Errore nel recupero della classifica', err);
      }
    };
    
    fetchLeaderboard();
  }, [selectedCategory]); // <--- Ricarica i dati ogni volta che cambia la categoria

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>🏆 Classifica WikiBlank</h2>
        <button onClick={() => navigate('/')} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          Torna al Gioco
        </button>
      </div>

      <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <label htmlFor="category-select" style={{ fontWeight: 'bold' }}>Filtra per Categoria:</label>
        <select 
          id="category-select"
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

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '12px' }}>Pos.</th>
            <th style={{ padding: '12px' }}>Giocatore</th>
            <th style={{ padding: '12px' }}>Partite Vinte</th>
            <th style={{ padding: '12px' }}>Tempo Medio (sec)</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '12px', textAlign: 'center' }}>Nessuna partita vinta in questa categoria.</td>
            </tr>
          ) : (
            leaderboard.map((entry, index) => (
              <tr key={entry.username} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{index + 1}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{entry.username}</td>
                <td style={{ padding: '12px' }}>{entry.gamesWon}</td>
                <td style={{ padding: '12px' }}>{entry.avgTimeSec} s</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}