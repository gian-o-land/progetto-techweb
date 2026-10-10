import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  username: string;
  gamesWon: number;
  avgTimeSec: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('generale');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
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
  }, [selectedCategory]);

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <div className="space-between" style={{ marginBottom: '20px' }}>
        <h2 className="title" style={{ marginBottom: 0 }}>🏆 Classifica WikiBlank</h2>
        <button className="btn" onClick={() => navigate('/')}>Torna al Gioco</button>
      </div>

      <div className="card flex-row">
        <label htmlFor="category-select" style={{ fontWeight: 'bold' }}>Filtra per Categoria:</label>
        <select 
          id="category-select"
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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Pos.</th>
              <th>Giocatore</th>
              <th>Partite Vinte</th>
              <th>Tempo Medio</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted">Nessuna partita vinta in questa categoria.</td>
              </tr>
            ) : (
              leaderboard.map((entry, index) => (
                <tr key={entry.username}>
                  <td>{index + 1}</td>
                  <td style={{ fontWeight: 'bold' }}>{entry.username}</td>
                  <td>{entry.gamesWon}</td>
                  <td>{entry.avgTimeSec} s</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}