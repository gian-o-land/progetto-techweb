import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://192.168.0.134:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Credenziali non valide');
      }

      // Salva il token e lo username nel browser
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      
      // Rimanda l'utente alla schermata di gioco principale (che creeremo dopo)
      navigate('/');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Si è verificato un errore inaspettato');
      }
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>Accesso WikiBlank</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required 
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <button type="submit" style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}>
          Entra
        </button>
      </form>
      <p style={{ marginTop: '20px' }}>
        Nuovo giocatore? <Link to="/register">Crea un account</Link>
      </p>
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px', textAlign: 'center' }}>
        <span>🏆 Scopri i campioni: </span>
        <Link to="/leaderboard" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#2196F3' }}>
          Guarda la Classifica Globale
        </Link>
        <br/><br/>
        <span>📖 Consulta l'archivio: </span>
        <Link to="/history" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#2196F3' }}>
          Vedi lo Storico Partite
        </Link>
      </div>
    </div>
  );
}