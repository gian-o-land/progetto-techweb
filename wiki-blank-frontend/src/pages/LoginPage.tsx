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
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Credenziali non valide');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
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
    <div className="container auth-container">
      <h2 className="title text-center">Accesso WikiBlank</h2>
      {error && <div className="text-danger text-center">{error}</div>}
      
      <form onSubmit={handleSubmit} className="card flex-col">
        <input 
          type="text" 
          className="input-field"
          placeholder="Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required 
        />
        <input 
          type="password" 
          className="input-field"
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
        />
        <button type="submit" className="btn btn-primary">
          Entra
        </button>
      </form>

      <p className="text-center text-muted" style={{ marginTop: '20px' }}>
        Nuovo giocatore? <Link to="/register" className="link-text">Crea un account</Link>
      </p>

      <div className="card text-center flex-col" style={{ marginTop: '30px', padding: '15px' }}>
        <div>
          <span>🏆 Scopri i campioni: </span>
          <Link to="/leaderboard" className="link-text">Guarda la Classifica Globale</Link>
        </div>
        <div>
          <span>📚 Consulta l'archivio: </span>
          <Link to="/history" className="link-text">Vedi lo Storico Partite</Link>
        </div>
      </div>
    </div>
  );
}