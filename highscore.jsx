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
          0% { box-shadow: 0 0 15px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.8); transform: scale(1); }
          50% { box-shadow: 0 0 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,1); transform: scale(1.02); }
          100% { box-shadow: 0 0 15px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.8); transform: scale(1); }
        }
        .high-score-card {
          animation: darkPulse 3s infinite ease-in-out;
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
    background: 'linear-gradient(145deg, #2b2b2b, #000000)',
    borderRadius: '15px',
    width: '280px',
    margin: '20px auto',
    textAlign: 'center',
    border: '2px solid #444',
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
