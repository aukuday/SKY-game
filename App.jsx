import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import HighScore from './highscore';
import { THEMES } from './themes';
import { supabase } from './supabaseclient';
import BackgroundMusic from './BackgroundMusic';

function HoverButton({ onClick, style, children, hoverColor, ...props }) {
  const [isHovered, setIsHovered] = useState(false);

  const finalStyle = {
    ...style,
    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
    boxShadow: isHovered ? '0 0 20px rgba(255, 255, 255, 0.6)' : style.boxShadow,
    backgroundColor: isHovered ? (hoverColor || '#535bf2') : style.backgroundColor,
    transition: 'all 0.3s ease',
  };

  return (
    <button
      onClick={onClick}
      style={finalStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
}

// --- Enhanced Welcome Screen Components ---

function CloudWelcomeBackground() {
  const containerRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      targetRef.current = {
        x: e.clientX - window.innerWidth / 2,
        y: e.clientY - window.innerHeight / 2
      };
    };

    const animate = () => {
      // Smooth easing (lerp) for no jitter
      const ease = 0.05;
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * ease;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * ease;

      if (containerRef.current) {
        containerRef.current.style.setProperty('--mouse-x', `${currentRef.current.x}px`);
        containerRef.current.style.setProperty('--mouse-y', `${currentRef.current.y}px`);
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Cloud configuration for layering
  const clouds = [
    // Back layer (slower, blurred, smaller)
    { id: 1, top: '15%', duration: '25s', delay: '0s', scale: 0.6, blur: '4px', opacity: 0.7, zIndex: 1, parallax: 0.02 },
    { id: 2, top: '35%', duration: '28s', delay: '-12s', scale: 0.7, blur: '3px', opacity: 0.6, zIndex: 1, parallax: 0.03 },
    // Middle layer
    { id: 3, top: '25%', duration: '18s', delay: '-4s', scale: 1.0, blur: '1px', opacity: 0.85, zIndex: 2, parallax: 0.05 },
    { id: 4, top: '65%', duration: '20s', delay: '-10s', scale: 0.9, blur: '2px', opacity: 0.8, zIndex: 2, parallax: 0.06 },
    // Front layer (faster, sharp, larger)
    { id: 5, top: '45%', duration: '12s', delay: '-1s', scale: 1.4, blur: '0px', opacity: 0.95, zIndex: 3, parallax: 0.1 },
    { id: 6, top: '10%', duration: '14s', delay: '-6s', scale: 1.3, blur: '0px', opacity: 0.9, zIndex: 3, parallax: 0.09 },
    { id: 7, top: '80%', duration: '15s', delay: '-3s', scale: 1.5, blur: '0px', opacity: 0.95, zIndex: 3, parallax: 0.11 },
  ];

  return (
    <div ref={containerRef} className="sky-background">
      <style>{`
        .sky-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%);
          background-size: 200% 200%;
          animation: skyGradient 20s ease infinite;
          overflow: hidden;
          z-index: 0;
          --mouse-x: 0px;
          --mouse-y: 0px;
        }
        @keyframes skyGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .sun-container {
          position: absolute;
          top: 40%;
          left: 50%;
          width: 0;
          height: 0;
          z-index: 0;
          pointer-events: none;
          transform: translate(calc(var(--mouse-x) * 0.02), calc(var(--mouse-y) * 0.02));
        }

        .sun {
          position: absolute;
          width: 150px;
          height: 150px;
          background: radial-gradient(circle, #fff 20%, #ffd700 60%, rgba(255, 215, 0, 0) 100%);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 80px 40px rgba(255, 223, 0, 0.5);
        }

        .light-rays {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100vmax;
          height: 100vmax;
          background: repeating-conic-gradient(
            from 0deg,
            rgba(255, 255, 255, 0.05) 0deg 10deg,
            transparent 10deg 20deg
          );
          transform: translate(-50%, -50%);
          animation: rotateRays 60s linear infinite;
          border-radius: 50%;
        }

        @keyframes rotateRays {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .cloud {
          position: absolute;
          left: -300px;
          background: linear-gradient(to bottom, #fff 0%, #f2f2f2 100%);
          border-radius: 100px;
          filter: drop-shadow(0 8px 5px rgba(0,0,0,0.1));
          will-change: transform;
        }
        .cloud::after, .cloud::before {
          content: '';
          position: absolute;
          background: inherit;
          border-radius: 50%;
        }
        .cloud::after { width: 50px; height: 50px; top: -25px; left: 25px; }
        .cloud::before { width: 70px; height: 70px; top: -35px; left: 50px; }
        
        @keyframes moveCloud {
          from { left: -300px; }
          to { left: 110%; }
        }
      `}</style>

      <div className="sun-container">
        <div className="sun"></div>
        <div className="light-rays"></div>
      </div>

      {clouds.map(cloud => (
        <div
          key={cloud.id}
          className="cloud"
          style={{
            top: cloud.top,
            width: '180px',
            height: '70px',
            zIndex: cloud.zIndex,
            opacity: cloud.opacity,
            filter: `blur(${cloud.blur})`,
            transform: `translate(calc(var(--mouse-x) * ${cloud.parallax}), calc(var(--mouse-y) * ${cloud.parallax})) scale(${cloud.scale})`,
            animation: `moveCloud ${cloud.duration} linear infinite`,
            animationDelay: cloud.delay
          }}
        />
      ))}
    </div>
  );
}

function WelcomeScreen({ onContinue }) {
  return (
    <div className="App welcome-container">
      <style>{`
        .welcome-container {
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 100vh;
        }
      `}</style>
      <CloudWelcomeBackground />
      <main style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', zIndex: 2, position: 'relative' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.5)', fontSize: '4rem', margin: 0 }}>Welcome to SKY</h1>
          <p style={{ fontSize: '1.5rem', margin: '20px 0 40px', color: '#fff', textShadow: '0 0 5px rgba(0,0,0,0.5)' }}>Your adventure is about to begin.</p>
          <HoverButton onClick={onContinue} style={styles.button}>Continue to Play</HoverButton>
        </div>
      </main>
    </div>
  );
}

function App() {
  // --- State ---
  const [view, setView] = useState('welcome'); // 'welcome', 'game'
  const [gameState, setGameState] = useState('home'); // 'home', 'playing', 'paused', 'gameover', 'leaderboard'
  const [playerName, setPlayerName] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(THEMES.find(t => t.id === 'cyberpunk'));
  const [scoresUpdated, setScoresUpdated] = useState(0);
  const [combo, setCombo] = useState(0);
  const [coinScore, setCoinScore] = useState(0);
  const [countdown, setCountdown] = useState(3);

  // --- Refs (Mutable Game State) ---
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const gameContainerRef = useRef(null);
  const scoreSpanRef = useRef(null); // Direct DOM access for performance
  const comboSpanRef = useRef(null);
  const coinSpanRef = useRef(null);
  const bgImageRef = useRef(null);
  const dragonImageRef = useRef(null);
  
  // Game entities stored in ref to avoid closure staleness in loop
  const gameData = useRef({
    initialized: false,
    player: { x: 50, y: 0, width: 30, height: 30, velocityY: 0, isJumping: false },
    obstacles: [],
    score: 0,
    gameSpeed: 2,
    frameCounter: 0,
    isGameOver: false,
    combo: 0,
    flashActive: false,
    coins: [],
    coinScore: 0,
    flashTimer: 0,
    bgLayers: []
  });

  // Constants
  const GRAVITY = 0.5;
  const JUMP_STRENGTH = -12;
  const BOOSTER_JUMP_STRENGTH = -20;

  useEffect(() => {
    const img = new Image();
    img.src = selectedTheme.url;
    bgImageRef.current = img;
  }, [selectedTheme]);

  useEffect(() => {
    const img = new Image();
    img.src = "https://cdn.dribbble.com/userupload/2585188/file/original-5908efaf5d226c3d90acab6bcf6d5b5c.png?resize=1600x1200";
    dragonImageRef.current = img;
  }, []);

  // --- Responsive Canvas ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = gameContainerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const containerWidth = container.clientWidth;
      canvas.width = containerWidth;
      canvas.height = containerWidth / 2.5;
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
  const startGame = () => {
    if (!playerName.trim()) {
      alert("Please enter your name!");
      return;
    }

    setGameState('theme-selection');
  };

  const launchGame = (theme) => {
    if (theme.id !== 'cyberpunk' && theme.id !== 'jungle' && theme.id !== 'space' && theme.id !== 'lava' && theme.id !== 'ice' && theme.id !== 'desert' && theme.id !== 'candy' && theme.id !== 'underwater') {
      return;
    }

    setSelectedTheme(theme);
    // Signal for re-initialization in the game loop effect
    gameData.current.initialized = false;
    setCombo(0);
    setCoinScore(0);
    setCountdown(3);
    setGameState('countdown');
  };
  const selectTheme = (theme) => {
    setSelectedTheme(theme);
  };

  const restartGame = () => {
    setGameState('home');
  };

  const pauseGame = () => {
    setGameState('paused');
  };

  const resumeGame = () => {
    setGameState('playing');
  };

  const exitGame = () => {
    setGameState('home');
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

  // --- Auto Pause on Tab Switch ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === 'playing') {
        setGameState('paused');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameState]);

  // --- Countdown Timer ---
  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState('playing');
      }
    }
  }, [gameState, countdown]);

  // --- Game Loop ---
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'countdown') {
      cancelAnimationFrame(requestRef.current);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Initialize game state here, where canvas is guaranteed to exist
    if (!gameData.current.initialized) {
        gameData.current = {
            initialized: true,
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
            gameSpeed: 10,
            frameCounter: 0,
            isGameOver: false,
            bgX: 0,
            combo: 0,
            coins: [],
            coinScore: 0,
            flashActive: false, // ... other properties
            boosters: [],
            boosterActive: false,
            boosterTimer: 0,
            flashTimer: 0, // ... other properties
            bgLayers: JSON.parse(JSON.stringify(selectedTheme.layers)) // Deep copy
        };
        setCombo(0);
    }


    const handleInput = (e) => {
      // Ignore input if clicking a button (gameState check is implicit via useEffect dependency)
      if (e.target.tagName === 'BUTTON') return;

      // Prevent scrolling for Space and Touch
      if (e.type === 'touchstart' || (e.type === 'keydown' && e.code === 'Space')) {
        e.preventDefault();
      }

      const { player, boosterActive } = gameData.current;
      if ((e.code === 'Space' || e.code === 'ArrowUp' || e.type === 'touchstart' || e.type === 'mousedown') && !player.isJumping) {
        player.velocityY = boosterActive ? BOOSTER_JUMP_STRENGTH : JUMP_STRENGTH;
        player.isJumping = true;
      }
    };

    const drawDragon = (ctx, player, frame) => {
      const { x, y, width, height } = player;

      if (dragonImageRef.current && dragonImageRef.current.complete) {
        ctx.drawImage(dragonImageRef.current, x, y, width, height);
        return;
      }

      const wingFlapSpeed = 0.2;
      const wingAngle = Math.sin(frame * wingFlapSpeed) * (Math.PI / 6); // Flap angle

      ctx.save();
      ctx.shadowBlur = 0; // Removed shadow for performance
      // ctx.shadowColor = '#00ffff';

      // Tail
      ctx.fillStyle = '#00b8b8';
      ctx.beginPath();
      ctx.moveTo(x, y + height / 2);
      ctx.lineTo(x - 15, y + height / 2 + 5);
      ctx.lineTo(x - 10, y + height / 2);
      ctx.lineTo(x - 15, y + height / 2 - 5);
      ctx.closePath();
      ctx.fill();

      // Body
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(x, y, width, height);

      // Head
      ctx.fillRect(x + width, y, 10, height * 0.8);

      // Wing
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate(wingAngle);
      ctx.fillRect(0, -height / 2, 25, height); // A simple rectangle wing
      ctx.restore();
    };

    const drawNeonRect = (x, y, w, h, color, glowColor) => {
      ctx.shadowBlur = 0; // Removed shadow for performance
      ctx.shadowColor = glowColor || color;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.shadowBlur = 0;
    };

    const drawDrone = (x, y) => {
      // Drone body
      drawNeonRect(x, y, 40, 20, '#ff0055', '#ff0055');
      // Propellers
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 5, y - 5, 10, 5);
      ctx.fillRect(x + 35, y - 5, 10, 5);
    };

    const drawPole = (x, y, h) => {
      drawNeonRect(x, y, 10, h, '#00ffcc', '#00ffcc');
      // Electric sparks
      if (Math.random() > 0.8) {
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x, y + Math.random() * h);
        ctx.lineTo(x + 20, y + Math.random() * h);
        ctx.stroke();
      }
    };

    const drawCoin = (x, y, radius, value) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, false);
      
      // Intensive gold gradient
      const gradient = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
      if (value >= 5) {
        gradient.addColorStop(0, '#fff59d'); // Light center
        gradient.addColorStop(0.5, '#ffd700'); // Gold
        gradient.addColorStop(1, '#ff6f00'); // Dark orange edge
      } else {
        gradient.addColorStop(0, '#fff9c4');
        gradient.addColorStop(0.5, '#fbc02d');
        gradient.addColorStop(1, '#f57f17');
      }
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add a shiny border
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      
      // Sparkle Animation
      const sparkleTime = (gameData.current.frameCounter + x) % 100; // Use x to offset animations
      if (sparkleTime < 15) {
        const progress = sparkleTime / 15;
        const opacity = Math.sin(progress * Math.PI); // Fade in and out
        const sparkleRadius = radius * 0.5;
        const sparkleX = x + radius * 0.5 * Math.cos(Math.PI * 1.75); // Top-left glint
        const sparkleY = y - radius * 0.5 * Math.sin(Math.PI * 1.75);

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
        ctx.beginPath();
        ctx.moveTo(sparkleX, sparkleY - sparkleRadius);
        ctx.lineTo(sparkleX + sparkleRadius * 0.3, sparkleY - sparkleRadius * 0.3);
        ctx.lineTo(sparkleX + sparkleRadius, sparkleY);
        ctx.lineTo(sparkleX + sparkleRadius * 0.3, sparkleY + sparkleRadius * 0.3);
        ctx.lineTo(sparkleX, sparkleY + sparkleRadius);
        ctx.lineTo(sparkleX - sparkleRadius * 0.3, sparkleY + sparkleRadius * 0.3);
        ctx.lineTo(sparkleX - sparkleRadius, sparkleY);
        ctx.lineTo(sparkleX - sparkleRadius * 0.3, sparkleY - sparkleRadius * 0.3);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
    };

    const drawBooster = (x, y) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + 15, y);
      ctx.lineTo(x + 30, y + 15);
      ctx.lineTo(x + 15, y + 30);
      ctx.lineTo(x, y + 15);
      ctx.closePath();
      
      const gradient = ctx.createRadialGradient(x + 15, y + 15, 5, x + 15, y + 15, 20);
      gradient.addColorStop(0, '#8B008B'); // Dark intense magenta
      gradient.addColorStop(1, '#2F0030'); // Very dark purple
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.fillText('⚡', x + 8, y + 22);
      ctx.restore();
    };

    const loop = () => {
      const state = gameData.current;

      if (state.isGameOver) {
        const calculatedFinalScore = Math.floor(state.score) + state.coinScore;
        setFinalScore(calculatedFinalScore);
        setGameState('gameover');
        saveScore(calculatedFinalScore);
        return;
      }

      // Draw Background
      // Clear with dark night color
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Parallax Buildings
      state.bgLayers.forEach((layer, i) => {
        if (gameState === 'playing') {
          layer.elements.forEach(el => el.x -= state.gameSpeed * layer.speed);
          layer.elements = layer.elements.filter(el => el.x + el.w > 0);
        }

        const lastEl = layer.elements[layer.elements.length - 1];
        if (layer.allowOverlap || !lastEl || lastEl.x + lastEl.w < canvas.width) {
          selectedTheme.spawn(layer, i, canvas);
        }
        layer.elements.forEach(el => selectedTheme.draw(ctx, el, i, state.frameCounter));
      });

      // Normal speed progression
      if (gameState === 'playing') {
        state.gameSpeed = 4 + (state.score / 500);
      }

      // Draw Ground with Glitch
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 2);
      for (let i = 0; i < canvas.width; i += 20) {
         // Random glitch offset
         const offset = Math.random() > 0.9 ? Math.random() * 10 - 5 : 0;
         ctx.lineTo(i, canvas.height - 2 + offset);
      }
      ctx.stroke();

      // Update Player
      if (gameState === 'playing') {
        state.player.velocityY += GRAVITY;
        state.player.y += state.player.velocityY;

        // Floor Collision
        if (state.player.y > canvas.height - state.player.height) {
          state.player.y = canvas.height - state.player.height;
          state.player.velocityY = 0;
          state.player.isJumping = false;
        }
      }

      // Draw Player
      drawDragon(ctx, state.player, state.frameCounter);

      // Handle Obstacles
      if (gameState === 'playing') {
        state.frameCounter++;
        // Spawn obstacle and a high-value coin
        if (state.obstacles.length === 0 && state.frameCounter % Math.floor(1000 / (state.gameSpeed * 10)) === 0) {
          const type = Math.random() > 0.5 ? 'drone' : 'pole';
          let newObstacle;
          if (type === 'drone') {
              newObstacle = {
                  type: 'drone',
                  x: canvas.width,
                  y: canvas.height - 90 - Math.random() * 50, // Flying high
                  width: 40,
                  height: 20,
                  passed: false
              };
              state.obstacles.push(newObstacle);
          } else {
              const h = 40 + Math.random() * 40;
              newObstacle = {
                  type: 'pole',
                  x: canvas.width,
                  y: canvas.height - h,
                  width: 10,
                  height: h,
                  passed: false
              };
              state.obstacles.push(newObstacle);
          }
          // Spawn a high-value coin near the obstacle
          state.coins.push({
            x: newObstacle.x + newObstacle.width / 2,
            y: newObstacle.y - 60, // Positioned above the obstacle
            radius: 10,
            value: 5,
          });
        }

        // Spawn low-value coins periodically
        if (state.frameCounter % 75 === 0) {
          state.coins.push({
            x: canvas.width,
            y: canvas.height * 0.2 + Math.random() * canvas.height * 0.6, // Random height in the middle
            radius: 8,
            value: 1,
          });
        }

        // Spawn Booster
        if (state.frameCounter % 1000 === 0) {
          state.boosters.push({
            x: canvas.width,
            y: canvas.height - 80 - Math.random() * 50, // Lower, reachable height
            width: 30,
            height: 30
          });
        }
      }

      // Use reverse loop for safe removal and better performance
      for (let index = state.obstacles.length - 1; index >= 0; index--) {
        const obs = state.obstacles[index];
        if (gameState === 'playing') {
          obs.x -= state.gameSpeed;
        }
        
        if (obs.type === 'drone') {
            drawDrone(obs.x, obs.y);
        } else {
            drawPole(obs.x, obs.y, obs.height);
        }

        if (gameState === 'playing') {
          // Collision Detection
          if (
            state.player.x < obs.x + obs.width &&
            state.player.x + state.player.width > obs.x &&
            state.player.y < obs.y + obs.height &&
            state.player.y + state.player.height > obs.y
          ) {
            state.isGameOver = true;
          }

          // Near Miss Combo Logic
          if (!obs.passed && !obs.nearMissChecked) {
              const distance = obs.x - (state.player.x + state.player.width);
              if (distance < 50 && distance > 0 && Math.abs(state.player.y - obs.y) < 100) {
                  state.combo++;
                if (comboSpanRef.current) comboSpanRef.current.innerText = state.combo;
                  obs.nearMissChecked = true;
              }
          }

          // Score Calculation: Increment when obstacle passes player
          if (!obs.passed && obs.x + obs.width < state.player.x) {
            // Only award 1 point for successfully jumping over a ground obstacle.
            if (obs.type === 'pole' && state.player.y < canvas.height - state.player.height) {
              state.score += 1;
              
              if (scoreSpanRef.current) {
                const span = scoreSpanRef.current;
                span.style.color = '#ffffff';
                span.style.textShadow = '0 0 20px #ffffff';
                span.style.transform = 'scale(1.5)';
                span.style.display = 'inline-block';
                span.style.transition = 'all 0.1s ease';
                
                setTimeout(() => {
                    if (scoreSpanRef.current) {
                        span.style.color = '';
                        span.style.textShadow = '';
                        span.style.transform = 'scale(1)';
                    }
                }, 150);
              }
            }
            obs.passed = true;
          }

          // Remove off-screen obstacles
          if (obs.x + obs.width < 0) {
            state.obstacles.splice(index, 1);
          }
        }
      }

      // Handle Coins
      for (let i = state.coins.length - 1; i >= 0; i--) {
        const coin = state.coins[i];

        if (gameState === 'playing') {
          coin.x -= state.gameSpeed;
        }

        drawCoin(coin.x, coin.y, coin.radius, coin.value);

        // Collision with player
        const dx = state.player.x + state.player.width / 2 - coin.x;
        const dy = state.player.y + state.player.height / 2 - coin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < state.player.width / 2 + coin.radius) {
          state.coinScore += coin.value;
          if (coinSpanRef.current) coinSpanRef.current.innerText = state.coinScore;
          state.coins.splice(i, 1); // Remove coin
        } else if (coin.x + coin.radius < 0) {
          // Remove off-screen coins
          state.coins.splice(i, 1);
        }
      }

      // Handle Boosters
      for (let i = state.boosters.length - 1; i >= 0; i--) {
        const booster = state.boosters[i];
        if (gameState === 'playing') {
          booster.x -= state.gameSpeed;
        }

        drawBooster(booster.x, booster.y);

        if (gameState === 'playing') {
          // Collision
          if (
            state.player.x < booster.x + booster.width &&
            state.player.x + state.player.width > booster.x &&
            state.player.y < booster.y + booster.height &&
            state.player.y + state.player.height > booster.y
          ) {
            state.boosterActive = true;
            state.boosterTimer = 600; // 10 seconds at 60fps
            state.boosters.splice(i, 1);
          } else if (booster.x + booster.width < 0) {
            state.boosters.splice(i, 1);
          }
        }
      }

      // Update Booster Timer
      if (state.boosterActive && gameState === 'playing') {
        state.boosterTimer--;
        if (state.boosterTimer <= 0) {
          state.boosterActive = false;
        }
        // Visual indicator
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`BOOSTER: ${Math.ceil(state.boosterTimer / 60)}`, 20, 80);
      }

      // Update Score
      
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

  return (
    <>
      <BackgroundMusic gameState={gameState} view={view} />
      {view === 'welcome' ? <WelcomeScreen onContinue={() => setView('game')} /> : (
        <div className="App">
      <header>
        <h1>WELCOME TO SKY</h1>
      </header>

      <main>
        {gameState === 'home' && (
          <div id="homeScreen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>            
            <HighScore scoresUpdated={scoresUpdated} />
            <h2 style={{ marginTop: '15px' }}>Enter Your Name</h2>
            <input
              type="text"
              placeholder="Your Name"
              maxLength="15"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={styles.input}
            />
            <button onClick={startGame} style={styles.button}>Start Game</button>
          </div>
        )}

        {gameState === 'theme-selection' && (
          <div id="themeSelectionScreen">
            <div className="theme-selection-box">
            <h2>Choose Your World</h2>
            <div className="theme-grid">
              {THEMES.map((theme) => (
                <div 
                  key={theme.id} 
                  className="theme-card" 
                  onClick={() => launchGame(theme)}
                  style={{ opacity: (theme.id === 'cyberpunk' || theme.id === 'jungle' || theme.id === 'space' || theme.id === 'lava' || theme.id === 'ice' || theme.id === 'desert' || theme.id === 'candy' || theme.id === 'underwater') ? 1 : 0.5, cursor: (theme.id === 'cyberpunk' || theme.id === 'jungle' || theme.id === 'space' || theme.id === 'lava' || theme.id === 'ice' || theme.id === 'desert' || theme.id === 'candy' || theme.id === 'underwater') ? 'pointer' : 'not-allowed' }}
                >
                  <img src={theme.url} alt={theme.name} className="theme-preview" />
                  <span className="theme-name">{theme.name}</span>
                </div>
              ))}
            </div>
            <button className="back-button" onClick={() => setGameState('home')} style={{...styles.button, marginTop: '30px', transition: 'all 0.3s ease'}}>Back</button>
            </div>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'paused' || gameState === 'countdown') && (
          <div ref={gameContainerRef} className="game-container" style={{ margin: '100px auto', border: '4px solid white', borderRadius: '15px', maxWidth: '80vw', boxShadow: '0 0 20px rgba(0,0,0,0.5)', position: 'relative', boxSizing: 'border-box' }}>
            <div id="score-container" style={{
              fontSize: '1.6rem',
              marginBottom: '15px',
              padding: '10px 20px',
              backgroundColor: 'rgba(0, 40, 0, 0.75)',
              border: '2px solid #00ff00',
              borderRadius: '8px',
              color: '#00ff00',
              textShadow: '0 0 5px #00ff00, 0 0 10px #00ff00',
              fontFamily: '"Orbitron", sans-serif',
              textAlign: 'center'
            }}>
              Coins: <span ref={coinSpanRef}>{coinScore}</span> | Obstacles: <span ref={scoreSpanRef}>0</span>
            </div>
            <canvas ref={canvasRef} />
            {gameState === 'playing' && (
              <HoverButton 
                id="pause-btn" 
                onClick={pauseGame}
                style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, ...styles.button, fontSize: '1.2rem', padding: '12px 24px', border: '2px solid white', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
              >
                Pause ⏸
              </HoverButton>
            )}
            {gameState === 'paused' && (
              <div id="pauseScreen" className="overlay-screen" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.8), rgba(65, 105, 225, 0.8))', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 20, backdropFilter: 'blur(5px)' }}>
                <h2 style={{ color: 'white', textShadow: '0 0 10px #00ffff', fontSize: '4rem', marginBottom: '40px', letterSpacing: '5px' }}>PAUSED</h2>
                <HoverButton onClick={resumeGame} style={styles.button}>Resume ▶</HoverButton>
                <HoverButton onClick={exitGame} style={{ ...styles.button, backgroundColor: '#f44336' }} hoverColor="#d32f2f">Exit to Menu 🏠</HoverButton>
              </div>
            )}
            {gameState === 'countdown' && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 20, borderRadius: '11px' }}>
                <h1 style={{ fontSize: '8rem', color: '#00ff00', textShadow: '0 0 20px #00ff00', margin: 0, animation: 'pulse 0.5s infinite' }}>{countdown}</h1>
                <h2 style={{ color: 'white', marginTop: '20px', fontSize: '2rem' }}>Get Ready!</h2>
              </div>
            )}
          </div>
        )}

        {gameState === 'leaderboard' && (
          <div id="leaderboardScreen">
            <div className="leaderboard-card">
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
            <button onClick={() => setGameState('home')} style={styles.button}>Back</button>
            <button onClick={resetScores} style={{ ...styles.button, backgroundColor: '#dc3545', marginTop: '10px' }}>Reset Scores</button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div id="gameOverScreen">
            <style>{`
              .cloud-wrapper {
                position: relative;
                width: 600px;
                height: 400px;
                margin: 0 auto;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: float 3s ease-in-out infinite;
              }
              .cloud-puff {
                position: absolute;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 50%;
                box-shadow: 
                  inset 0 0 20px rgba(255, 255, 255, 1),
                  0 15px 35px rgba(0, 114, 255, 0.3);
              }
              .p-main {
                width: 420px;
                height: 240px;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                border-radius: 120px;
                z-index: 10;
                background: linear-gradient(145deg, #4e54c8, #b65f0f);
                border: 4px solid;
                animation: border-glow 4s linear infinite;
              }

              .game-over-content {
                position: relative;
                z-index: 20;
                text-align: center;
                color: #ffffff;
              }
              .game-over-title {
                font-size: 2.5rem;
                margin: 0 0 10px 0;
                background: linear-gradient(to right, #a855f7, #ec4899);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 2px;
                filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
                text-shadow: 0 0 15px rgba(236, 72, 153, 0.5);
              }
              .final-score-text {
                font-size: 1.8rem;
                margin: 10px 0 30px 0;
                font-weight: 600;
                color: #e5e7eb;
              }
              .final-score-value {
                color: #fde047;
                font-size: 2.5rem;
                font-weight: 900;
                text-shadow: 0 0 10px #fde047, 0 0 20px #f59e0b;
              }
              @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-15px); }
              }
              @keyframes border-glow {
                0%, 100% { border-color: #8b5cf6; box-shadow: 0 0 20px #8b5cf6, inset 0 0 10px rgba(255,255,255,0.1); }
                50% { border-color: #38bdf8; box-shadow: 0 0 35px #38bdf8, inset 0 0 10px rgba(255,255,255,0.1); }
              }
            `}</style>
            <div className="cloud-wrapper">
              <div className="cloud-puff p-main"></div>

              <div className="game-over-content">
                <h2 className="game-over-title">Game Over</h2>
                <p className="final-score-text">Final Score: <span className="final-score-value">{finalScore}</span></p>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', width: '100%' }}>
                  <button className="game-over-btn" onClick={restartGame} style={{ ...styles.button, animation: 'pulse 1.5s infinite', backgroundColor: '#ff4081', border: 'none', boxShadow: '0 4px 15px rgba(7, 13, 109, 0.4)' }}>Play Again</button>
                  <button className="game-over-btn" onClick={exitGame} style={{ ...styles.button, backgroundColor: '#076879', border: 'none', boxShadow: '0 4px 15px rgba(22, 21, 21, 0.84)' }}>Exit</button>
                </div>
              </div>
            </div>
          </div>
        )}
        </main>
        </div>
      )}
    </>
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
    boxShadow: '0 4px 6px rgba(146, 14, 14, 0.2)',
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