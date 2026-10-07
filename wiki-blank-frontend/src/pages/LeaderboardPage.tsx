import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  username: string;
  gamesWon: number;
  avgTimeSec: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('http://192.168.0.134:3000/api/games/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        }
      } catch (err) {
        console.error('Errore nel recupero della classifica', err);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>🏆 Classifica WikiBlank</h2>
      <button onClick={() => navigate('/')} style={{ marginBottom: '20px', padding: '8px 12px', cursor: 'pointer' }}>
        Torna al Gioco
      </button>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
              <td colSpan={4} style={{ padding: '12px', textAlign: 'center' }}>Nessuna partita vinta ancora.</td>
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