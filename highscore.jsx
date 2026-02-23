import { useEffect, useState } from 'react';
import { supabase } from './supabaseclient';

function HighScore({ scoresUpdated }) {
  const [highScore, setHighScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHighScore();
  }, [scoresUpdated]);

  async function fetchHighScore() {
    setLoading(true);
    const { data, error } = await supabase
      .from('game_scores')
      .select('score')
      .order('score', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching score:', error.message);
    } else {
      setHighScore(data ? data.score : 0);
    }

    setLoading(false);
  }

  if (loading) return <p style={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Loading high score...</p>;

  return (
    <>
      <style>{`
        @keyframes darkPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes rgbBorder {
          0% { border-color: #ff0000; box-shadow: 0 0 15px #ff0000, inset 0 0 10px rgba(0,0,0,0.8); }
          16% { border-color: #ff00ff; box-shadow: 0 0 15px #ff00ff, inset 0 0 10px rgba(0,0,0,0.8); }
          33% { border-color: #0000ff; box-shadow: 0 0 15px #0000ff, inset 0 0 10px rgba(0,0,0,0.8); }
          50% { border-color: #00ffff; box-shadow: 0 0 15px #00ffff, inset 0 0 10px rgba(0,0,0,0.8); }
          66% { border-color: #00ff00; box-shadow: 0 0 15px #00ff00, inset 0 0 10px rgba(0,0,0,0.8); }
          83% { border-color: #ffff00; box-shadow: 0 0 15px #ffff00, inset 0 0 10px rgba(0,0,0,0.8); }
          100% { border-color: #ff0000; box-shadow: 0 0 15px #ff0000, inset 0 0 10px rgba(0,0,0,0.8); }
        }
        .high-score-card {
          animation: darkPulse 3s infinite ease-in-out, rgbBorder 4s linear infinite;
        }
      `}</style>
      <div style={styles.card} className="high-score-card">
      <h2 style={{ color: '#fff', textShadow: '0 2px 4px #000', margin: '0 0 10px 0' }}>🏆 Highest Score</h2>
      <p style={styles.score}>{highScore}</p>
    </div>
    </>
  );
}

const styles = {
  card: {
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '15px',
    width: '500px',
    margin: '20px auto',
    textAlign: 'center',
    border: '3px solid transparent',
    position: 'relative',
    zIndex: 10
  },
  score: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#00ff88',
    margin: 0,
    textShadow: '0 0 10px rgba(0, 255, 136, 0.5), 2px 2px 0 #000'
  }
};

export default HighScore;
