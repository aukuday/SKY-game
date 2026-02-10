import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import HighScore from './highscore';
import { supabase } from './supabaseclient';

const THEMES = [
  { id: 'day', name: 'Day', url: 'https://img.freepik.com/free-vector/blue-sky-with-clouds-background_1017-26302.jpg' },
  { id: 'night', name: 'Night', url: 'https://img.freepik.com/premium-photo/amazing-halloween-background-concept-backgrounds-night-sky_952778-9985.jpg' },
  { id: 'sunset', name: 'Sunset', url: 'https://tse3.mm.bing.net/th/id/OIP.-efWzvcfQbuztsgIg9scwgHaE7?w=626&h=417&rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'snow', name: 'Snow', url: 'https://tse3.mm.bing.net/th/id/OIP.IXk4999-dHEmPlHPermK3wHaFj?rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'forest', name: 'Forest', url: 'https://img.freepik.com/free-vector/flat-design-forest-landscape_23-2149155031.jpg' }
];

function App() {
  // --- State ---
  const [view, setView] = useState('landing'); // 'landing', 'game'
  const [gameState, setGameState] = useState('menu'); // 'menu', 'start', 'mode-selection', 'ready', 'playing', 'paused', 'gameover', 'leaderboard'
  const [playerName, setPlayerName] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [scoresUpdated, setScoresUpdated] = useState(0);

  // --- Refs (Mutable Game State) ---
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const gameContainerRef = useRef(null);
  const scoreSpanRef = useRef(null); // Direct DOM access for performance
  const bgImageRef = useRef(null);

  // Game entities stored in ref to avoid closure staleness in loop
  const gameData = useRef({
    player: { x: 50, y: 0, width: 30, height: 30, velocityY: 0, isJumping: false },
    obstacles: [],
    score: 0,
    gameSpeed: 4,
    frameCounter: 0,
    isGameOver: false,
    bgX: 0
  });

  // Constants
  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -10;

  useEffect(() => {
    const img = new Image();
    img.src = selectedTheme.url;
    bgImageRef.current = img;
  }, [selectedTheme]);

  // --- Responsive Canvas ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = gameContainerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      // Only resize when not in active gameplay to avoid distorting the game
      if (gameState !== 'playing' && gameState !== 'paused') {
        const containerWidth = container.clientWidth;
        canvas.width = containerWidth;
        canvas.height = containerWidth / 3; // Maintain 3:1 aspect ratio (from 600x200)
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [gameState]);

  // --- Supabase Functions ---
  const fetchLeaderboard = async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('game_scores')
      .select('name, score')
      .order('score', { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching leaderboard:", error.message);
    } else if (data) {
      setLeaderboard(data);
    }
  };

  const saveScore = async (newScore) => {
    if (!supabase) {
      console.warn("Supabase not configured, score not saved.");
      return;
    }

    const { error } = await supabase
      .from('game_scores')
      .insert([{ name: playerName, score: newScore }]);

    if (error) {
      console.error("Error saving score:", error.message);
      if (error.code === '42501') {
        alert("Error: Permission denied! Please disable 'Row Level Security' (RLS) on your 'game_scores' table in Supabase.");
      } else {
        alert("Error saving score: " + error.message);
      }
    } else {
      fetchLeaderboard();
    }
  };

  // --- Game Logic ---
  const goToModes = () => {
    if (!playerName.trim()) {
      alert("Please enter your name!");
      return;
    }
    setGameState('mode-selection');
  };

  const startGame = () => {
    // Reset Game Data
    const canvas = canvasRef.current;
    gameData.current = {
      player: { 
        x: 50, 
        y: canvas.height - 30, 
        width: 30, 
        height: 30, 
        velocityY: 0, 
        isJumping: false 
      },
      obstacles: [],
      score: 0,
      gameSpeed: 4,
      frameCounter: 0,
      isGameOver: false,
      bgX: 0
    };

    setGameState('playing');
  };

  const selectTheme = (theme) => {
    setSelectedTheme(theme);
    setGameState('ready');
  };

  const restartGame = () => {
    setGameState('start');
  };

  const pauseGame = () => {
    setGameState('paused');
  };

  const resumeGame = () => {
    setGameState('playing');
  };

  const exitGame = () => {
    setGameState('menu');
    setPlayerName('');
  };

  const viewLeaderboard = () => {
    fetchLeaderboard();
    setGameState('leaderboard');
  };

  const resetScores = async () => {
    if (!supabase) {
      alert("Supabase is not configured. Cannot reset scores.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to reset all scores? This action cannot be undone.");
    if (confirmed) {
      const { error } = await supabase
        .from('game_scores')
        .delete()
        .neq('score', -1); // A condition to delete all rows

      if (error) {
        alert(`Error resetting scores: ${error.message}. Make sure RLS policies on 'game_scores' allow deletion.`);
      } else {
        alert("All scores have been reset successfully.");
        fetchLeaderboard();
        setScoresUpdated(c => c + 1); // Trigger re-fetch in HighScore component
      }
    }
  };

  // --- Game Loop ---
  useEffect(() => {
    if (gameState !== 'playing') {
      cancelAnimationFrame(requestRef.current);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const handleInput = (e) => {
      // Ignore input if clicking a button (gameState check is implicit via useEffect dependency)
      if (e.target.tagName === 'BUTTON') return;

      // Prevent scrolling for Space and Touch
      if (e.type === 'touchstart' || (e.type === 'keydown' && e.code === 'Space')) {
        e.preventDefault();
      }

      const { player } = gameData.current;
      if ((e.code === 'Space' || e.code === 'ArrowUp' || e.type === 'touchstart' || e.type === 'mousedown') && !player.isJumping) {
        player.velocityY = JUMP_STRENGTH;
        player.isJumping = true;
      }
    };

    const loop = () => {
      const state = gameData.current;

      if (state.isGameOver) {
        setFinalScore(Math.floor(state.score));
        setGameState('gameover');
        saveScore(Math.floor(state.score));
        return;
      }

      // Draw Background
      if (bgImageRef.current && bgImageRef.current.complete) {
        state.bgX -= state.gameSpeed * 0.2; // Parallax speed (slower than game speed)
        if (state.bgX <= -canvas.width) {
          state.bgX = 0;
        }
        // Draw two images for seamless scrolling
        ctx.drawImage(bgImageRef.current, state.bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImageRef.current, state.bgX + canvas.width, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Update Player
      state.player.velocityY += GRAVITY;
      state.player.y += state.player.velocityY;

      // Floor Collision
      if (state.player.y > canvas.height - state.player.height) {
        state.player.y = canvas.height - state.player.height;
        state.player.velocityY = 0;
        state.player.isJumping = false;
      }

      // Draw Player
      ctx.fillStyle = '#333';
      ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);

      // Handle Obstacles
      state.frameCounter++;
      if (state.frameCounter % 100 === 0) {
        const obsHeight = Math.random() * 40 + 20;
        state.obstacles.push({ 
          x: canvas.width, 
          y: canvas.height - obsHeight, 
          width: 20, 
          height: obsHeight,
          passed: false
        });
      }

      state.obstacles.forEach((obs, index) => {
        obs.x -= state.gameSpeed;
        ctx.fillStyle = '#f44336';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Collision Detection
        if (
          state.player.x < obs.x + obs.width &&
          state.player.x + state.player.width > obs.x &&
          state.player.y < obs.y + obs.height &&
          state.player.y + state.player.height > obs.y
        ) {
          state.isGameOver = true;
        }

        // Score Calculation: Increment when obstacle passes player
        if (!obs.passed && obs.x + obs.width < state.player.x) {
          state.score += 1;
          obs.passed = true;
        }

        // Remove off-screen obstacles
        if (obs.x + obs.width < 0) {
          state.obstacles.splice(index, 1);
        }
      });

      // Update Score
      state.gameSpeed += 0.001;
      
      // Update DOM directly for performance
      if (scoreSpanRef.current) {
        scoreSpanRef.current.innerText = Math.floor(state.score);
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    // Input Listeners
    window.addEventListener('keydown', handleInput);
    window.addEventListener('mousedown', handleInput);
    window.addEventListener('touchstart', handleInput, { passive: false });

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('mousedown', handleInput);
      window.removeEventListener('touchstart', handleInput);
    };
  }, [gameState]);

  if (view === 'landing') {
    return (
      <div className="App">
        <div className="overlay-screen" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1>Welcome to SKY Runner</h1>
          <p style={{ fontSize: '1.2rem', margin: '20px 0 40px' }}>Your adventure is about to begin.</p>
          <button onClick={() => setView('game')} style={styles.button}>
            Continue to Play
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header>
        <h1>WELCOME TO SKY </h1>
      </header>

      <main>
        <HighScore scoresUpdated={scoresUpdated} />
        <h2>SKY</h2>
        <div ref={gameContainerRef} className="game-container">
          <div id="score-container" style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
            Score: <span ref={scoreSpanRef}>0</span>
          </div>
          
          <canvas ref={canvasRef} />

          {/* --- Responsive Styles --- */}
          <style>{`
            .App {
              width: 90%;
              padding: 1rem;
            }
            canvas {
              background-color: #f0f0f0; /* Fallback color */
              border-radius: 8px;
            }
            @media (max-width: 768px) {
              .App {
                width: 95%;
                padding: 1rem;
              }
              h1 { font-size: 1.8rem; }
              h2 { font-size: 1.4rem; }
            }
            @media (max-width: 480px) {
              .App {
                width: 100%;
                padding: 0.5rem;
                border-radius: 0;
              }
            }
          `}</style>

          {gameState === 'playing' && (
            <button 
              id="pause-btn" 
              onClick={pauseGame}
              style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, ...styles.button, fontSize: '0.8rem', padding: '8px 16px' }}
            >
              Pause
            </button>
          )}

          {gameState === 'menu' && (
            <div id="menuScreen" className="overlay-screen">
              <h2>Main Menu</h2>
              <button onClick={() => setGameState('start')} style={styles.button}>Start Game</button>
              <button onClick={viewLeaderboard} style={styles.button}>Visit Highest Scoreboard</button>
              <button onClick={resetScores} style={{ ...styles.button, backgroundColor: '#dc3545', marginTop: '20px' }}>Reset All Scores</button>
            </div>
          )}

          {gameState === 'leaderboard' && (
            <div id="leaderboardScreen" className="overlay-screen">
              <h2>Leaderboard</h2>
              <ul className="leaderboard-list">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, index) => (
                    <li key={index}>
                      <span>{entry.name || 'Anonymous'}</span>
                      <span>{entry.score}</span>
                    </li>
                  ))
                ) : (
                  <li>Loading or No Scores...</li>
                )}
              </ul>
              <button onClick={() => setGameState('menu')} style={styles.button}>Back</button>
            </div>
          )}

          {gameState === 'mode-selection' && (
            <div id="modeScreen" className="overlay-screen">
              <h2>Choose Your Mode</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                {THEMES.map((theme) => (
                  <button key={theme.id} onClick={() => selectTheme(theme)} style={styles.modeButton}>
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'ready' && (
            <div id="readyScreen" className="overlay-screen">
              <h2>Are you ready to play?</h2>
              <p>Mode: <strong>{selectedTheme.name}</strong></p>
              <button onClick={startGame} style={styles.button}>Play</button>
              <button onClick={() => setGameState('mode-selection')} style={{ ...styles.button, backgroundColor: '#888' }}>Back</button>
            </div>
          )}

          {gameState === 'start' && (
            <div id="startScreen" className="overlay-screen">
              <h2>Welcome to SKY</h2>
              <input 
                type="text" 
                placeholder="Enter your name" 
                maxLength="15"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={styles.input}
              />
              <button onClick={goToModes} style={styles.button}>Next</button>
              <button onClick={() => setGameState('menu')} style={{ ...styles.button, backgroundColor: '#888' }}>Back</button>
            </div>
          )}

          {gameState === 'paused' && (
            <div id="pauseScreen" className="overlay-screen">
              <h2>Paused</h2>
              <button onClick={resumeGame} style={styles.button}>Resume</button>
              <button onClick={exitGame} style={{ ...styles.button, backgroundColor: '#f44336' }}>Exit to Menu</button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div id="gameOverScreen" className="overlay-screen">
              <h2>Game Over</h2>
              <p>Final Score: <span>{finalScore}</span></p>
              <h3>Top 5 Leaderboard</h3>
              <ul className="leaderboard-list">
                {leaderboard.map((entry, index) => (
                  <li key={index}>
                    <span>{entry.name || 'Anonymous'}</span>
                    <span>{entry.score}</span>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="game-over-btn" onClick={restartGame} style={styles.button}>Play Again</button>
                <button className="game-over-btn" onClick={exitGame} style={{ ...styles.button, backgroundColor: '#f44336' }}>Exit</button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer>
        <p>&copy; 2026 My Awesome App</p>
      </footer>
    </div>
  );
}

const styles = {
  button: {
    padding: '12px 24px',
    fontSize: '1.2rem',
    backgroundColor: '#646cff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    margin: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  input: {
    padding: '12px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '2px solid #965f5f',
    marginBottom: '20px',
    width: '100%',
    maxWidth: '300px',
    textAlign: 'center',
    outline: 'none',
  },
  modeButton: {
    padding: '15px 20px',
    fontSize: '1rem',
    backgroundColor: '#fff',
    color: '#333',
    border: '2px solid #646cff',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  }
};

export default App;