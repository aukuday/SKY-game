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

  if (loading) return <p>Loading high score...</p>;

  return (
    <div style={styles.card}>
      <h2>🏆 Highest Score</h2>
      <p style={styles.score}>{highScore}</p>
    </div>
  );
}

const styles = {
  card: {
    padding: '20px',
    background: '#ffffff',
    borderRadius: '10px',
    width: '250px',
    margin: '20px auto',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
  },
  score: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#4CAF50'
  }
};

export default HighScore;
