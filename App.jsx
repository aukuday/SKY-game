import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import HighScore from './highscore';
import { supabase } from './supabaseclient';

const THEMES = [
  { id: 'cyberpunk', name: 'Cyberpunk', url: 'https://img.freepik.com/free-vector/gradient-cyberpunk-city-background_23-2149249874.jpg' },
  { id: 'jungle', name: 'Jungle', url: 'https://img.freepik.com/free-vector/flat-design-forest-landscape_23-2149155031.jpg' },
  { id: 'space', name: 'Space Runner', url: 'https://img.freepik.com/free-vector/space-game-background-neon-landscape-futuristic_107791-163.jpg' },
  { id: 'lava', name: 'Lava / Volcano', url: 'https://img.freepik.com/free-vector/volcano-eruption-background-flat-style_23-2148664267.jpg' },
  { id: 'ice', name: 'Ice World', url: 'https://tse3.mm.bing.net/th/id/OIP.IXk4999-dHEmPlHPermK3wHaFj?rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'desert', name: 'Desert', url: 'https://img.freepik.com/free-vector/desert-landscape-scene-sunset_1308-54565.jpg' },
  { id: 'candy', name: 'Candy', url: 'https://img.freepik.com/free-vector/fantasy-sweet-candyland-background_107791-1763.jpg' },
  { id: 'underwater', name: 'Underwater', url: 'https://img.freepik.com/free-vector/underwater-ocean-background-with-fish-corals_107791-667.jpg' }
];

function App() {
  // --- State ---
  const [view, setView] = useState('welcome'); // 'welcome', 'game'
  const [gameState, setGameState] = useState('home'); // 'home', 'playing', 'paused', 'gameover', 'leaderboard'
  const [playerName, setPlayerName] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [scoresUpdated, setScoresUpdated] = useState(0);
  const [combo, setCombo] = useState(0);

  // --- Refs (Mutable Game State) ---
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const gameContainerRef = useRef(null);
  const scoreSpanRef = useRef(null); // Direct DOM access for performance
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
    flashTimer: 0,
    bgLayers: []
  });

  // Constants
  const GRAVITY = 0.5;
  const JUMP_STRENGTH = -12;

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
    setGameState('playing');
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

  // --- Game Loop ---
  useEffect(() => {
    if (gameState !== 'playing') {
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
            flashActive: false,
            flashTimer: 0,
            bgLayers: selectedTheme.id === 'jungle' 
              ? [ { speed: 0.5, elements: [] }, { speed: 2.5, elements: [] } ] // Jungle: Mid (0.5), Fore (2.5 - fastest)
              : selectedTheme.id === 'space'
              ? [ 
                  { speed: 0.1, elements: [] }, // Layer 4: Distant stars (Very slow)
                  { speed: 0.5, elements: [] }, // Layer 3: Deep space (Slow)
                  { speed: 1.5, elements: [] }, // Layer 2: Mid layer (Medium)
                  { speed: 3.0, elements: [] }  // Layer 1: Foreground (Fast)
                ]
              : selectedTheme.id === 'lava'
              ? [
                  { speed: 0.1, elements: [] }, // Layer 4: Sky layer (Very slow)
                  { speed: 0.5, elements: [] }, // Layer 3: Background (Slow)
                  { speed: 1.5, elements: [] }, // Layer 2: Mid layer (Medium)
                  { speed: 3.0, elements: [] }  // Layer 1: Foreground (Fastest)
                ]
              : selectedTheme.id === 'ice'
              ? [
                  { speed: 0.1, elements: [] }, // Layer 4: Sky (Aurora, Snowfall)
                  { speed: 0.5, elements: [] }, // Layer 3: Background (Mountains, Cliffs)
                  { speed: 1.5, elements: [] }, // Layer 2: Mid (Trees, Icicles, Rocks)
                  { speed: 3.0, elements: [] }  // Layer 1: Fore (Piles, Chunks, Dust)
                ]
              : selectedTheme.id === 'desert'
              ? [
                  { speed: 0.1, elements: [] }, // Layer 4: Sky (Sun, Heat haze)
                  { speed: 0.5, elements: [] }, // Layer 3: Background (Large dunes, Pyramids)
                  { speed: 1.5, elements: [] }, // Layer 2: Mid (Dunes, Carts, Cactus)
                  { speed: 3.0, elements: [] }  // Layer 1: Fore (Sand, Rocks, Skulls, Shrubs)
                ]
              : selectedTheme.id === 'candy'
              ? [
                  { speed: 0.1, elements: [] }, // Layer 4: Sky (Pastel gradient, Sprinkles)
                  { speed: 0.5, elements: [] }, // Layer 3: Background (Clouds, Mountains, Castle)
                  { speed: 1.5, elements: [] }, // Layer 2: Mid (Lollipops, Gumdrops, Canes)
                  { speed: 3.0, elements: [] }  // Layer 1: Fore (Splashes, Crumbs, Drips)
                ]
              : selectedTheme.id === 'underwater'
              ? [
                  { speed: 0.1, elements: [] }, // Layer 4: Water light layer (Very slow)
                  { speed: 0.5, elements: [] }, // Layer 3: Deep background (Slow)
                  { speed: 1.5, elements: [] }, // Layer 2: Mid layer (Medium)
                  { speed: 3.0, elements: [] }  // Layer 1: Foreground (Fast)
                ]
              : [ { speed: 0.5, elements: [] }, { speed: 2, elements: [] } ]   // Cyberpunk
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

      const { player } = gameData.current;
      if ((e.code === 'Space' || e.code === 'ArrowUp' || e.type === 'touchstart' || e.type === 'mousedown') && !player.isJumping) {
        player.velocityY = JUMP_STRENGTH;
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
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ffff';

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
      ctx.shadowBlur = 15;
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

    const loop = () => {
      const state = gameData.current;

      if (state.isGameOver) {
        setFinalScore(Math.floor(state.score));
        setGameState('gameover');
        saveScore(Math.floor(state.score));
        return;
      }

      // Draw Background
      // Clear with dark night color
      if (selectedTheme.id === 'jungle') {
        ctx.fillStyle = '#1a2f1a'; // Dark forest green
      } else if (selectedTheme.id === 'space') {
        ctx.fillStyle = '#050010'; // Deep space dark
      } else if (selectedTheme.id === 'lava') {
        ctx.fillStyle = '#220000'; // Dark red/black for lava sky base
      } else if (selectedTheme.id === 'ice') {
        ctx.fillStyle = '#0a1a2a'; // Dark blueish night sky
      } else if (selectedTheme.id === 'desert') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#FFD700'); // Light gold
        grad.addColorStop(1, '#FF8C00'); // Deep orange
        ctx.fillStyle = grad;
      } else if (selectedTheme.id === 'candy') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#ffe6e9'); // Pastel pink
        grad.addColorStop(1, '#e0f7fa'); // Pastel blue
        ctx.fillStyle = grad;
      } else if (selectedTheme.id === 'underwater') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#006994'); // Deep blue
        grad.addColorStop(1, '#001e36'); // Darker blue
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#050510'; // Cyberpunk night
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Parallax Buildings
      state.bgLayers.forEach((layer, i) => {
        // Move elements
        layer.elements.forEach(el => el.x -= state.gameSpeed * layer.speed);
        // Remove off-screen
        layer.elements = layer.elements.filter(el => el.x + el.w > 0);
        // Add new elements
        const lastEl = layer.elements[layer.elements.length - 1];
        // For space stars (layer 0), allow overlap to create density. For others, ensure gap.
        const allowOverlap = selectedTheme.id === 'space' && i === 0;
        const allowLavaOverlap = selectedTheme.id === 'lava' && i === 0;
        const allowIceOverlap = selectedTheme.id === 'ice' && i === 0;
        const allowDesertOverlap = selectedTheme.id === 'desert' && (i === 0 || i === 3);
        const allowCandyOverlap = selectedTheme.id === 'candy' && i === 0;
        const allowUnderwaterOverlap = selectedTheme.id === 'underwater' && (i === 0 || i === 3);

        if (allowOverlap || allowLavaOverlap || allowIceOverlap || allowDesertOverlap || allowCandyOverlap || allowUnderwaterOverlap || !lastEl || lastEl.x + lastEl.w < canvas.width) {
          if (selectedTheme.id === 'jungle') {
             // Jungle Spawning
             if (i === 0) { // Mid-ground (Layer 2 in prompt)
                const type = Math.random() < 0.4 ? 'tree' : (Math.random() < 0.7 ? 'vine' : 'ruin');
                let w, h, y;
                if (type === 'tree') {
                    w = 60 + Math.random() * 40; h = 120 + Math.random() * 80; y = canvas.height - h;
                } else if (type === 'vine') {
                    w = 30; h = 60 + Math.random() * 80; y = 0; // Hanging from top
                } else { // ruin
                    w = 60 + Math.random() * 50; h = 50 + Math.random() * 50; y = canvas.height - h;
                }
                layer.elements.push({ type, x: canvas.width + Math.random() * 50, y, w, h });
             } else { // Foreground (Layer 1 in prompt)
                const type = Math.random() < 0.4 ? 'bush' : (Math.random() < 0.7 ? 'rock' : 'grass');
                let w, h, y;
                if (type === 'bush') {
                    w = 40 + Math.random() * 30; h = 30 + Math.random() * 10; y = canvas.height;
                } else if (type === 'rock') {
                    w = 20 + Math.random() * 20; h = 15 + Math.random() * 15; y = canvas.height;
                } else { // grass
                    w = 80 + Math.random() * 50; h = 20 + Math.random() * 10; y = canvas.height;
                }
                layer.elements.push({ type, x: canvas.width + Math.random() * 20, y, w, h });
             }
          } else if (selectedTheme.id === 'space') {
             // Space Spawning
             if (i === 0) { // Layer 4: Distant stars
                if (Math.random() < 0.3) { // Frequent stars
                    const isShooting = Math.random() < 0.005; // Rare shooting star
                    layer.elements.push({
                        type: isShooting ? 'shootingStar' : 'star',
                        x: canvas.width + Math.random() * 50,
                        y: Math.random() * canvas.height,
                        w: isShooting ? 50 : Math.random() * 2 + 1,
                        h: isShooting ? 2 : Math.random() * 2 + 1,
                        opacity: Math.random()
                    });
                }
             } else if (i === 1) { // Layer 3: Deep space (Nebula)
                if (Math.random() < 0.005) {
                    layer.elements.push({
                        type: 'nebula',
                        x: canvas.width,
                        y: Math.random() * canvas.height,
                        w: 200 + Math.random() * 300,
                        h: 100 + Math.random() * 200,
                        color: Math.random() > 0.5 ? 'rgba(75, 0, 130, 0.3)' : 'rgba(0, 0, 139, 0.3)'
                    });
                }
             } else if (i === 2) { // Layer 2: Mid layer
                if (Math.random() < 0.01) {
                    const type = Math.random() > 0.4 ? 'asteroid' : (Math.random() > 0.5 ? 'satellite' : 'station');
                    layer.elements.push({
                        type,
                        x: canvas.width,
                        y: Math.random() * (canvas.height - 150),
                        w: 40 + Math.random() * 40,
                        h: 40 + Math.random() * 40
                    });
                }
             } else if (i === 3) { // Layer 1: Foreground
                if (Math.random() < 0.05) {
                    const type = Math.random() > 0.6 ? 'debris' : (Math.random() > 0.5 ? 'meteor' : 'spark');
                    layer.elements.push({ type, x: canvas.width, y: Math.random() * canvas.height, w: 5 + Math.random() * 10, h: 5 + Math.random() * 10 });
                }
             }
          } else if (selectedTheme.id === 'lava') {
             // Lava Spawning
             if (i === 0) { // Layer 4: Sky (Ash, Red smoke)
                if (Math.random() < 0.2) {
                    layer.elements.push({
                        type: 'ash',
                        x: canvas.width + Math.random() * 50,
                        y: Math.random() * canvas.height,
                        w: 2 + Math.random() * 3,
                        h: 2 + Math.random() * 3,
                        opacity: 0.5 + Math.random() * 0.5
                    });
                }
             } else if (i === 1) { // Layer 3: Background (Volcano)
                if (Math.random() < 0.005) {
                    layer.elements.push({
                        type: 'volcano',
                        x: canvas.width,
                        y: canvas.height - 50, // Base y
                        w: 300 + Math.random() * 200,
                        h: 200 + Math.random() * 100
                    });
                }
             } else if (i === 2) { // Layer 2: Mid layer (Rocks, Lava falls)
                if (Math.random() < 0.01) {
                    const type = Math.random() > 0.3 ? 'rockFormation' : 'lavaFall';
                    layer.elements.push({
                        type,
                        x: canvas.width,
                        y: canvas.height - (type === 'lavaFall' ? 150 : 100),
                        w: 50 + Math.random() * 50,
                        h: 100 + Math.random() * 50
                    });
                }
             } else if (i === 3) { // Layer 1: Foreground (Cracked rocks, Splashes, Embers)
                if (Math.random() < 0.05) {
                    const type = Math.random() < 0.4 ? 'crackedRock' : (Math.random() < 0.7 ? 'splash' : 'ember');
                    layer.elements.push({
                        type,
                        x: canvas.width,
                        y: type === 'ember' ? canvas.height : canvas.height - 20,
                        w: type === 'ember' ? 5 : 30 + Math.random() * 20,
                        h: type === 'ember' ? 5 : 20 + Math.random() * 20
                    });
                }
             }
          } else if (selectedTheme.id === 'ice') {
             // Ice Spawning
             if (i === 0) { // Layer 4: Sky (Aurora, Snowfall)
                if (Math.random() < 0.005) {
                    layer.elements.push({
                        type: 'aurora',
                        x: canvas.width,
                        y: Math.random() * (canvas.height / 3),
                        w: 300 + Math.random() * 200,
                        h: 100 + Math.random() * 100,
                        color: Math.random() > 0.5 ? 'rgba(0, 255, 255, 0.15)' : 'rgba(255, 0, 255, 0.15)'
                    });
                }
                if (Math.random() < 0.4) {
                    layer.elements.push({
                        type: 'snow',
                        x: canvas.width + Math.random() * 50,
                        y: Math.random() * canvas.height,
                        w: 2 + Math.random() * 2,
                        h: 2 + Math.random() * 2,
                        speedY: 1 + Math.random() * 2
                    });
                }
             } else if (i === 1) { // Layer 3: Background (Mountains, Cliffs)
                if (Math.random() < 0.008) {
                    const type = Math.random() > 0.5 ? 'mountain' : 'cliff';
                    layer.elements.push({
                        type,
                        x: canvas.width,
                        y: canvas.height,
                        w: 200 + Math.random() * 150,
                        h: 150 + Math.random() * 150
                    });
                }
             } else if (i === 2) { // Layer 2: Mid (Trees, Icicles, Rocks)
                if (Math.random() < 0.015) {
                    const type = Math.random() < 0.4 ? 'frozenTree' : (Math.random() < 0.7 ? 'icicle' : 'snowRock');
                    let w, h, y;
                    if (type === 'frozenTree') {
                        w = 50 + Math.random() * 30; h = 100 + Math.random() * 50; y = canvas.height - h;
                    } else if (type === 'icicle') {
                        w = 20 + Math.random() * 10; h = 50 + Math.random() * 40; y = 0;
                    } else { // snowRock
                        w = 40 + Math.random() * 30; h = 30 + Math.random() * 20; y = canvas.height - h;
                    }
                    layer.elements.push({ type, x: canvas.width, y, w, h });
                }
             } else if (i === 3) { // Layer 1: Fore (Piles, Chunks, Dust)
                if (Math.random() < 0.05) {
                    const type = Math.random() < 0.4 ? 'snowPile' : (Math.random() < 0.7 ? 'iceChunk' : 'snowDust');
                    let w, h, y;
                    if (type === 'snowPile') {
                        w = 60 + Math.random() * 40; h = 30 + Math.random() * 20; y = canvas.height;
                    } else if (type === 'iceChunk') {
                        w = 20 + Math.random() * 15; h = 20 + Math.random() * 15; y = canvas.height - 20;
                    } else { // snowDust
                        w = 4; h = 4; y = canvas.height - Math.random() * 100;
                    }
                    layer.elements.push({ type, x: canvas.width, y, w, h });
                }
             }
          } else if (selectedTheme.id === 'desert') {
             // Desert Spawning
             if (i === 0) { // Layer 4: Sky
                if (Math.random() < 0.001 && layer.elements.length === 0) {
                    layer.elements.push({
                        type: 'sun',
                        x: canvas.width,
                        y: 50,
                        w: 60,
                        h: 60
                    });
                }
             } else if (i === 1) { // Layer 3: Background
                if (Math.random() < 0.005) {
                    const type = Math.random() > 0.3 ? 'duneLarge' : 'pyramid';
                    layer.elements.push({
                        type,
                        x: canvas.width,
                        y: canvas.height - 50,
                        w: 150 + Math.random() * 150,
                        h: 100 + Math.random() * 100
                    });
                }
             } else if (i === 2) { // Layer 2: Mid
                if (Math.random() < 0.01) {
                    const type = Math.random() < 0.4 ? 'duneSmall' : (Math.random() < 0.7 ? 'cart' : 'cactus');
                    layer.elements.push({
                        type,
                        x: canvas.width,
                        y: canvas.height - 40,
                        w: 50 + Math.random() * 50,
                        h: 50 + Math.random() * 50
                    });
                }
             } else if (i === 3) { // Layer 1: Fore
                if (Math.random() < 0.1) {
                    const type = Math.random() < 0.5 ? 'sand' : (Math.random() < 0.7 ? 'rock' : (Math.random() < 0.85 ? 'skull' : 'shrub'));
                    layer.elements.push({ type, x: canvas.width, y: type === 'sand' ? Math.random() * canvas.height : canvas.height - 10, w: type === 'sand' ? 2 : 20 + Math.random() * 10, h: type === 'sand' ? 2 : 20 + Math.random() * 10 });
                }
             }
          } else if (selectedTheme.id === 'candy') {
             // Candy Spawning
             if (i === 0) { // Layer 4: Sky
                if (Math.random() < 0.1) {
                    layer.elements.push({
                        type: 'sprinkle',
                        x: canvas.width,
                        y: Math.random() * canvas.height,
                        w: 4, h: 10,
                        color: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#1a535c'][Math.floor(Math.random() * 4)],
                        rotation: Math.random() * Math.PI
                    });
                }
             } else if (i === 1) { // Layer 3: Background
                if (Math.random() < 0.005) {
                     const type = Math.random() > 0.3 ? 'cottonCloud' : (Math.random() > 0.5 ? 'chocoMountain' : 'castle');
                     layer.elements.push({
                         type,
                         x: canvas.width,
                         y: canvas.height - (type === 'chocoMountain' ? 0 : 50),
                         w: type === 'castle' ? 100 : 150 + Math.random() * 100,
                         h: type === 'castle' ? 150 : 100 + Math.random() * 50
                     });
                }
             } else if (i === 2) { // Layer 2: Mid
                if (Math.random() < 0.015) {
                    const type = Math.random() < 0.4 ? 'lollipop' : (Math.random() < 0.7 ? 'gumdrop' : 'cane');
                    layer.elements.push({
                        type,
                        x: canvas.width,
                        y: canvas.height - (type === 'gumdrop' ? 40 : 100),
                        w: type === 'gumdrop' ? 60 : 40,
                        h: type === 'gumdrop' ? 40 : 100
                    });
                }
             } else if (i === 3) { // Layer 1: Fore
                if (Math.random() < 0.05) {
                    const type = Math.random() < 0.4 ? 'jelly' : (Math.random() < 0.7 ? 'crumb' : 'drip');
                    layer.elements.push({ type, x: canvas.width, y: type === 'drip' ? 0 : canvas.height - 10, w: type === 'crumb' ? 5 : 30, h: type === 'drip' ? 40 : (type === 'crumb' ? 5 : 20) });
                }
             }
          } else if (selectedTheme.id === 'underwater') {
             // Underwater Spawning
             if (i === 0) { // Layer 4: Water light layer
                if (Math.random() < 0.02) {
                    layer.elements.push({
                        type: 'lightRay',
                        x: canvas.width,
                        y: 0,
                        w: 50 + Math.random() * 100,
                        h: canvas.height,
                        opacity: 0.05 + Math.random() * 0.15
                    });
                }
             } else if (i === 1) { // Layer 3: Deep background
                if (Math.random() < 0.005) {
                    const type = Math.random() > 0.5 ? 'shadowRock' : 'ruinSilhouette';
                    layer.elements.push({
                        type,
                        x: canvas.width,
                        y: canvas.height - (type === 'ruinSilhouette' ? 150 : 100),
                        w: 100 + Math.random() * 150,
                        h: 100 + Math.random() * 100
                    });
                }
             } else if (i === 2) { // Layer 2: Mid layer
                if (Math.random() < 0.01) {
                    const type = Math.random() < 0.4 ? 'coral' : (Math.random() < 0.7 ? 'shipPart' : 'pillar');
                    layer.elements.push({
                        type,
                        x: canvas.width,
                        y: canvas.height - (type === 'pillar' ? 120 : 60),
                        w: 60 + Math.random() * 40,
                        h: 60 + Math.random() * 60
                    });
                }
             } else if (i === 3) { // Layer 1: Foreground
                if (Math.random() < 0.05) {
                    const type = Math.random() < 0.4 ? 'bubble' : (Math.random() < 0.7 ? 'fish' : 'seaweed');
                    layer.elements.push({
                        type,
                        x: canvas.width,
                        y: type === 'bubble' ? canvas.height : Math.random() * canvas.height,
                        w: type === 'bubble' ? 5 + Math.random() * 10 : (type === 'fish' ? 20 : 10),
                        h: type === 'bubble' ? 5 + Math.random() * 10 : (type === 'fish' ? 10 : 50)
                    });
                }
             }
          } else {
             // Cyberpunk Spawning
             layer.elements.push({
               x: canvas.width + Math.random() * 50,
               w: 50 + Math.random() * 100,
               h: 50 + Math.random() * 150,
               color: i === 0 ? '#1a1a2e' : '#2a2a4e' // Darker for far, lighter for near
             });
          }
        }
        // Draw
        layer.elements.forEach(el => {
          if (selectedTheme.id === 'jungle') {
             if (el.type === 'tree') {
                 ctx.fillStyle = '#5D4037'; // Trunk
                 ctx.fillRect(el.x + el.w * 0.3, el.y, el.w * 0.4, el.h);
                 ctx.fillStyle = '#2E7D32'; // Leaves
                 ctx.beginPath();
                 ctx.arc(el.x + el.w/2, el.y, el.w, 0, Math.PI * 2);
                 ctx.fill();
             } else if (el.type === 'vine') {
                 ctx.strokeStyle = '#4CAF50';
                 ctx.lineWidth = 4;
                 ctx.beginPath();
                 ctx.moveTo(el.x, 0);
                 ctx.quadraticCurveTo(el.x + Math.sin(state.frameCounter * 0.05 + el.x) * 10, el.h/2, el.x, el.h);
                 ctx.stroke();
             } else if (el.type === 'ruin') {
                 ctx.fillStyle = '#757575';
                 ctx.fillRect(el.x, el.y, el.w, el.h);
                 ctx.fillStyle = '#424242'; // Cracks
                 ctx.fillRect(el.x + 10, el.y + 10, el.w - 20, 5);
             } else if (el.type === 'bush') {
                 ctx.fillStyle = '#228B22';
                 ctx.beginPath();
                 ctx.arc(el.x + el.w/2, el.y, el.w/2, Math.PI, 0);
                 ctx.fill();
             } else if (el.type === 'rock') {
                 ctx.fillStyle = '#616161';
                 ctx.beginPath();
                 ctx.arc(el.x + el.w/2, el.y, el.w/2, Math.PI, 0);
                 ctx.fill();
             } else if (el.type === 'grass') {
                 ctx.strokeStyle = '#32CD32';
                 ctx.lineWidth = 2;
                 for(let k=0; k<el.w; k+=5) {
                     ctx.beginPath();
                     ctx.moveTo(el.x + k, el.y);
                     ctx.lineTo(el.x + k + Math.sin(state.frameCounter * 0.1 + k) * 3, el.y - el.h);
                     ctx.stroke();
                 }
             }
          } else if (selectedTheme.id === 'space') {
             if (i === 0) { // Stars
                 if (el.type === 'shootingStar') {
                     el.x -= 10; // Move faster
                     ctx.strokeStyle = '#fff';
                     ctx.lineWidth = 2;
                     ctx.beginPath();
                     ctx.moveTo(el.x, el.y);
                     ctx.lineTo(el.x + el.w, el.y - 10);
                     ctx.stroke();
                 } else {
                     ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(state.frameCounter * 0.05 + el.x) * 0.7})`; // Twinkle
                     ctx.fillRect(el.x, el.y, el.w, el.h);
                 }
             } else if (i === 1) { // Nebula
                 ctx.fillStyle = el.color;
                 ctx.beginPath();
                 ctx.ellipse(el.x + el.w/2, el.y + el.h/2, el.w/2, el.h/2, 0, 0, Math.PI * 2);
                 ctx.fill();
             } else if (i === 2) { // Mid
                 if (el.type === 'asteroid') {
                     ctx.fillStyle = '#555';
                     ctx.beginPath();
                     ctx.arc(el.x + el.w/2, el.y + el.h/2, el.w/2, 0, Math.PI * 2);
                     ctx.fill();
                 } else if (el.type === 'satellite') {
                     ctx.fillStyle = '#888';
                     ctx.fillRect(el.x, el.y + el.h/3, el.w, el.h/3);
                     ctx.fillStyle = '#00a'; // Solar panels
                     ctx.fillRect(el.x, el.y, 10, el.h);
                     ctx.fillRect(el.x + el.w - 10, el.y, 10, el.h);
                 } else { // station
                     ctx.fillStyle = '#777';
                     ctx.fillRect(el.x, el.y, el.w, el.h);
                     ctx.fillStyle = '#f00'; // Lights
                     ctx.fillRect(el.x + 5, el.y + 5, 3, 3);
                 }
             } else if (i === 3) { // Fore
                 if (el.type === 'debris') {
                     ctx.fillStyle = '#444';
                     ctx.fillRect(el.x, el.y, el.w, el.h);
                 } else if (el.type === 'meteor') {
                     ctx.fillStyle = '#666';
                     ctx.beginPath();
                     ctx.arc(el.x, el.y, el.w/2, 0, Math.PI * 2);
                     ctx.fill();
                 } else { // spark
                     ctx.fillStyle = '#0ff';
                     ctx.fillRect(el.x, el.y, el.w, 2);
                 }
             }
          } else if (selectedTheme.id === 'lava') {
             if (i === 0) { // Sky
                 if (el.type === 'ash') {
                     ctx.fillStyle = `rgba(150, 150, 150, ${el.opacity})`;
                     ctx.fillRect(el.x, el.y, el.w, el.h);
                 }
             } else if (i === 1) { // Background
                 if (el.type === 'volcano') {
                     // Silhouette
                     ctx.fillStyle = '#1a0505';
                     ctx.beginPath();
                     ctx.moveTo(el.x, canvas.height);
                     ctx.lineTo(el.x + el.w / 2, canvas.height - el.h);
                     ctx.lineTo(el.x + el.w, canvas.height);
                     ctx.fill();
                     // Lava flow
                     ctx.strokeStyle = '#ff4500';
                     ctx.lineWidth = 5;
                     ctx.beginPath();
                     ctx.moveTo(el.x + el.w / 2, canvas.height - el.h);
                     ctx.quadraticCurveTo(el.x + el.w / 2 + Math.sin(state.frameCounter * 0.05) * 20, canvas.height - el.h / 2, el.x + el.w / 2 + 50, canvas.height);
                     ctx.stroke();
                 }
             } else if (i === 2) { // Mid
                 if (el.type === 'rockFormation') {
                     ctx.fillStyle = '#000';
                     ctx.beginPath();
                     ctx.moveTo(el.x, canvas.height);
                     ctx.lineTo(el.x + el.w/2, el.y);
                     ctx.lineTo(el.x + el.w, canvas.height);
                     ctx.fill();
                 } else if (el.type === 'lavaFall') {
                     ctx.fillStyle = '#ff3300';
                     ctx.fillRect(el.x, el.y, el.w, el.h);
                 }
             } else if (i === 3) { // Fore
                 if (el.type === 'crackedRock') {
                     ctx.fillStyle = '#111';
                     ctx.fillRect(el.x, canvas.height - el.h, el.w, el.h);
                     // Cracks
                     ctx.strokeStyle = '#ff0000';
                     ctx.lineWidth = 1;
                     ctx.beginPath();
                     ctx.moveTo(el.x, canvas.height - el.h);
                     ctx.lineTo(el.x + el.w, canvas.height);
                     ctx.stroke();
                 } else if (el.type === 'splash') {
                     ctx.fillStyle = '#ffaa00';
                     ctx.beginPath();
                     ctx.arc(el.x, canvas.height, el.w/2, Math.PI, 0);
                     ctx.fill();
                 } else if (el.type === 'ember') {
                     el.y -= 2; // Fly up
                     ctx.fillStyle = '#ffff00';
                     ctx.fillRect(el.x, el.y, el.w, el.h);
                 }
             }
          } else if (selectedTheme.id === 'ice') {
             if (i === 0) { // Sky
                 if (el.type === 'aurora') {
                     const grad = ctx.createLinearGradient(el.x, el.y, el.x, el.y + el.h);
                     grad.addColorStop(0, el.color);
                     grad.addColorStop(1, 'transparent');
                     ctx.fillStyle = grad;
                     ctx.beginPath();
                     ctx.ellipse(el.x + el.w/2, el.y + el.h/2, el.w/2, el.h/2, 0, 0, Math.PI * 2);
                     ctx.fill();
                 } else if (el.type === 'snow') {
                     el.y += el.speedY;
                     if (el.y > canvas.height) el.y = 0;
                     ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                     ctx.beginPath();
                     ctx.arc(el.x, el.y, el.w/2, 0, Math.PI * 2);
                     ctx.fill();
                 }
             } else if (i === 1) { // Background
                 ctx.fillStyle = el.type === 'mountain' ? '#90a4ae' : '#78909c'; // Blue-grey
                 ctx.beginPath();
                 ctx.moveTo(el.x, canvas.height);
                 ctx.lineTo(el.x + el.w/2, canvas.height - el.h);
                 ctx.lineTo(el.x + el.w, canvas.height);
                 ctx.fill();
                 // Snow cap
                 ctx.fillStyle = '#e1f5fe';
                 ctx.beginPath();
                 ctx.moveTo(el.x + el.w/2, canvas.height - el.h);
                 ctx.lineTo(el.x + el.w/2 - 20, canvas.height - el.h + 40);
                 ctx.lineTo(el.x + el.w/2 + 20, canvas.height - el.h + 40);
                 ctx.fill();
             } else if (i === 2) { // Mid
                 if (el.type === 'frozenTree') {
                     ctx.fillStyle = '#455a64'; // Dark trunk
                     ctx.fillRect(el.x + el.w*0.4, el.y, el.w*0.2, el.h);
                     ctx.fillStyle = '#b3e5fc'; // Frozen leaves (light blue)
                     ctx.beginPath();
                     ctx.moveTo(el.x, el.y + el.h * 0.8);
                     ctx.lineTo(el.x + el.w/2, el.y);
                     ctx.lineTo(el.x + el.w, el.y + el.h * 0.8);
                     ctx.fill();
                 } else if (el.type === 'icicle') {
                     ctx.fillStyle = 'rgba(225, 245, 254, 0.8)'; // Semi-transparent ice
                     ctx.beginPath();
                     ctx.moveTo(el.x, 0);
                     ctx.lineTo(el.x + el.w/2, el.h);
                     ctx.lineTo(el.x + el.w, 0);
                     ctx.fill();
                 } else { // snowRock
                     ctx.fillStyle = '#607d8b';
                     ctx.beginPath();
                     ctx.arc(el.x + el.w/2, el.y + el.h, el.w/2, Math.PI, 0);
                     ctx.fill();
                     ctx.fillStyle = '#e1f5fe'; // Snow
                     ctx.fillRect(el.x, el.y + el.h/2, el.w, 8);
                 }
             } else if (i === 3) { // Fore
                 if (el.type === 'snowPile') {
                     ctx.fillStyle = '#e1f5fe';
                     ctx.beginPath();
                     ctx.arc(el.x + el.w/2, el.y, el.w/2, Math.PI, 0);
                     ctx.fill();
                 } else if (el.type === 'iceChunk') {
                     ctx.fillStyle = '#81d4fa';
                     ctx.fillRect(el.x, el.y, el.w, el.h);
                 } else { // snowDust
                     el.y -= 1; // Float up
                     ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                     ctx.beginPath();
                     ctx.arc(el.x, el.y, 2, 0, Math.PI * 2);
                     ctx.fill();
                 }
             }
          } else if (selectedTheme.id === 'desert') {
             if (i === 0) { // Sky
                 if (el.type === 'sun') {
                     ctx.fillStyle = '#FFFF00';
                     ctx.beginPath();
                     ctx.arc(el.x, el.y, el.w, 0, Math.PI * 2);
                     ctx.fill();
                     ctx.shadowBlur = 20;
                     ctx.shadowColor = '#FFD700';
                     ctx.stroke();
                     ctx.shadowBlur = 0;
                 }
             } else if (i === 1) { // Background
                 if (el.type === 'duneLarge') {
                     ctx.fillStyle = '#CD853F';
                     ctx.beginPath();
                     ctx.moveTo(el.x, canvas.height);
                     ctx.quadraticCurveTo(el.x + el.w/2, el.y, el.x + el.w, canvas.height);
                     ctx.fill();
                 } else if (el.type === 'pyramid') {
                     ctx.fillStyle = '#D2691E';
                     ctx.beginPath();
                     ctx.moveTo(el.x, canvas.height);
                     ctx.lineTo(el.x + el.w/2, el.y);
                     ctx.lineTo(el.x + el.w, canvas.height);
                     ctx.fill();
                 }
             } else if (i === 2) { // Mid
                 if (el.type === 'duneSmall') {
                     ctx.fillStyle = '#DAA520';
                     ctx.beginPath();
                     ctx.moveTo(el.x, canvas.height);
                     ctx.quadraticCurveTo(el.x + el.w/2, el.y + 20, el.x + el.w, canvas.height);
                     ctx.fill();
                 } else if (el.type === 'cart') {
                     ctx.fillStyle = '#8B4513';
                     ctx.fillRect(el.x, el.y + el.h/2, el.w, el.h/2);
                     ctx.fillStyle = '#A0522D';
                     ctx.beginPath();
                     ctx.arc(el.x + 10, el.y + el.h, 10, 0, Math.PI*2);
                     ctx.arc(el.x + el.w - 10, el.y + el.h, 10, 0, Math.PI*2);
                     ctx.fill();
                 } else if (el.type === 'cactus') {
                     ctx.fillStyle = '#228B22';
                     ctx.fillRect(el.x + el.w/2 - 5, el.y, 10, el.h);
                     ctx.fillRect(el.x + el.w/2 - 15, el.y + 20, 10, 5);
                     ctx.fillRect(el.x + el.w/2 - 15, el.y + 10, 5, 15);
                 }
             } else if (i === 3) { // Fore
                 if (el.type === 'sand') {
                     el.x -= 2; // Blow faster
                     ctx.fillStyle = '#F4A460';
                     ctx.fillRect(el.x, el.y, el.w, el.h);
                 } else if (el.type === 'rock') {
                     ctx.fillStyle = '#808080';
                     ctx.beginPath();
                     ctx.arc(el.x, canvas.height, el.w/2, Math.PI, 0);
                     ctx.fill();
                 } else if (el.type === 'skull') {
                     ctx.fillStyle = '#F5F5DC';
                     ctx.beginPath();
                     ctx.arc(el.x, canvas.height - 5, 8, 0, Math.PI*2);
                     ctx.fill();
                     ctx.fillStyle = '#000';
                     ctx.fillRect(el.x - 3, canvas.height - 5, 2, 2);
                     ctx.fillRect(el.x + 1, canvas.height - 5, 2, 2);
                 } else if (el.type === 'shrub') {
                     ctx.fillStyle = '#556B2F';
                     ctx.beginPath();
                     ctx.arc(el.x, canvas.height, el.w/2, Math.PI, 0);
                     ctx.fill();
                 }
             }
          } else if (selectedTheme.id === 'candy') {
             if (i === 0) { // Sky
                 if (el.type === 'sprinkle') {
                     ctx.save();
                     ctx.translate(el.x, el.y);
                     ctx.rotate(el.rotation);
                     ctx.fillStyle = el.color;
                     ctx.fillRect(-el.w/2, -el.h/2, el.w, el.h);
                     ctx.restore();
                 }
             } else if (i === 1) { // Background
                 if (el.type === 'cottonCloud') {
                     ctx.fillStyle = 'rgba(255, 192, 203, 0.6)'; // Pink fluffy
                     ctx.beginPath();
                     ctx.arc(el.x, el.y, el.w/3, 0, Math.PI*2);
                     ctx.arc(el.x + el.w/2, el.y - 20, el.w/3, 0, Math.PI*2);
                     ctx.arc(el.x + el.w, el.y, el.w/3, 0, Math.PI*2);
                     ctx.fill();
                 } else if (el.type === 'chocoMountain') {
                     ctx.fillStyle = '#5D4037'; // Chocolate
                     ctx.beginPath();
                     ctx.moveTo(el.x, canvas.height);
                     ctx.quadraticCurveTo(el.x + el.w/2, el.y - el.h, el.x + el.w, canvas.height);
                     ctx.fill();
                     // Snow/Icing on top
                     ctx.fillStyle = '#FFF';
                     ctx.beginPath();
                     ctx.moveTo(el.x + el.w/2 - 20, el.y - el.h + 35);
                     ctx.quadraticCurveTo(el.x + el.w/2, el.y - el.h, el.x + el.w/2 + 20, el.y - el.h + 35);
                     ctx.fill();
                 } else if (el.type === 'castle') {
                     ctx.fillStyle = '#FF69B4';
                     ctx.fillRect(el.x, el.y, el.w, el.h);
                     ctx.fillStyle = '#FF1493'; // Roof
                     ctx.beginPath();
                     ctx.moveTo(el.x - 10, el.y);
                     ctx.lineTo(el.x + el.w/2, el.y - 50);
                     ctx.lineTo(el.x + el.w + 10, el.y);
                     ctx.fill();
                 }
             } else if (i === 2) { // Mid
                 if (el.type === 'lollipop') {
                     ctx.fillStyle = '#FFF'; // Stick
                     ctx.fillRect(el.x + el.w/2 - 2, el.y + 30, 4, el.h - 30);
                     ctx.fillStyle = '#FF4081'; // Candy
                     ctx.beginPath();
                     ctx.arc(el.x + el.w/2, el.y + 30, 30, 0, Math.PI*2);
                     ctx.fill();
                     // Gloss
                     ctx.fillStyle = 'rgba(255,255,255,0.4)';
                     ctx.beginPath();
                     ctx.arc(el.x + el.w/2 - 10, el.y + 20, 5, 0, Math.PI*2);
                     ctx.fill();
                 } else if (el.type === 'gumdrop') {
                     ctx.fillStyle = '#AB47BC'; // Purple
                     ctx.beginPath();
                     ctx.arc(el.x + el.w/2, el.y + el.h, el.w/2, Math.PI, 0);
                     ctx.fill();
                 } else if (el.type === 'cane') {
                     ctx.strokeStyle = '#F44336';
                     ctx.lineWidth = 8;
                     ctx.beginPath();
                     ctx.moveTo(el.x, el.y + el.h);
                     ctx.lineTo(el.x, el.y + 20);
                     ctx.arc(el.x + 15, el.y + 20, 15, Math.PI, 0);
                     ctx.stroke();
                 }
             } else if (i === 3) { // Fore
                 if (el.type === 'jelly') {
                     ctx.fillStyle = 'rgba(0, 255, 0, 0.6)'; // Green jelly
                     ctx.beginPath();
                     ctx.arc(el.x, canvas.height, el.w, Math.PI, 0);
                     ctx.fill();
                     // Gloss
                     ctx.fillStyle = 'rgba(255,255,255,0.8)';
                     ctx.beginPath();
                     ctx.ellipse(el.x - 5, canvas.height - 15, 5, 2, Math.PI/4, 0, Math.PI*2);
                     ctx.fill();
                 } else if (el.type === 'crumb') {
                     ctx.fillStyle = '#FF9800';
                     ctx.fillRect(el.x, el.y, el.w, el.h);
                 } else if (el.type === 'drip') {
                     ctx.fillStyle = '#795548';
                     ctx.beginPath();
                     ctx.moveTo(el.x, 0);
                     ctx.lineTo(el.x, el.h - 10);
                     ctx.arc(el.x + el.w/2, el.h - 10, el.w/2, 0, Math.PI);
                     ctx.lineTo(el.x + el.w, 0);
                     ctx.fill();
                 }
             }
          } else if (selectedTheme.id === 'underwater') {
             if (i === 0) { // Light rays
                 if (el.type === 'lightRay') {
                     ctx.fillStyle = `rgba(255, 255, 255, ${el.opacity})`;
                     ctx.beginPath();
                     ctx.moveTo(el.x, 0);
                     ctx.lineTo(el.x + el.w, 0);
                     ctx.lineTo(el.x + el.w - 50, canvas.height);
                     ctx.lineTo(el.x - 50, canvas.height);
                     ctx.fill();
                 }
             } else if (i === 1) { // Deep background
                 ctx.fillStyle = '#001020'; // Very dark blue/black
                 if (el.type === 'shadowRock') {
                     ctx.beginPath();
                     ctx.arc(el.x + el.w/2, el.y + el.h, el.w/2, Math.PI, 0);
                     ctx.fill();
                 } else if (el.type === 'ruinSilhouette') {
                     ctx.fillRect(el.x, el.y, el.w, el.h);
                     ctx.clearRect(el.x + 20, el.y + 20, 10, 20); // Window
                 }
             } else if (i === 2) { // Mid layer
                 if (el.type === 'coral') {
                     ctx.fillStyle = '#ff7f50'; // Coral color
                     ctx.beginPath();
                     ctx.moveTo(el.x, canvas.height);
                     ctx.quadraticCurveTo(el.x, el.y, el.x + el.w/2, el.y + 20);
                     ctx.quadraticCurveTo(el.x + el.w, el.y, el.x + el.w, canvas.height);
                     ctx.fill();
                 } else if (el.type === 'shipPart') {
                     ctx.fillStyle = '#8b4513'; // Wood
                     ctx.beginPath();
                     ctx.moveTo(el.x, canvas.height);
                     ctx.lineTo(el.x + 20, el.y);
                     ctx.lineTo(el.x + el.w, el.y + 20);
                     ctx.lineTo(el.x + el.w - 10, canvas.height);
                     ctx.fill();
                 } else if (el.type === 'pillar') {
                     ctx.fillStyle = '#708090'; // Slate gray
                     ctx.fillRect(el.x, el.y, el.w, el.h);
                     ctx.fillStyle = '#2f4f4f';
                     ctx.fillRect(el.x + 5, el.y + 5, el.w - 10, 5); // Detail
                 }
             } else if (i === 3) { // Foreground
                 if (el.type === 'bubble') {
                     el.y -= 2; // Float up
                     ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                     ctx.beginPath();
                     ctx.arc(el.x, el.y, el.w/2, 0, Math.PI*2);
                     ctx.stroke();
                 } else if (el.type === 'fish') {
                     el.x -= 2; // Swim faster
                     ctx.fillStyle = '#ffd700'; // Gold fish
                     ctx.beginPath();
                     ctx.ellipse(el.x, el.y, el.w, el.h, 0, 0, Math.PI*2);
                     ctx.fill();
                     ctx.beginPath(); // Tail
                     ctx.moveTo(el.x + el.w, el.y);
                     ctx.lineTo(el.x + el.w + 10, el.y - 5);
                     ctx.lineTo(el.x + el.w + 10, el.y + 5);
                     ctx.fill();
                 } else if (el.type === 'seaweed') {
                     ctx.strokeStyle = '#32cd32';
                     ctx.lineWidth = 3;
                     ctx.beginPath();
                     ctx.moveTo(el.x, canvas.height);
                     ctx.quadraticCurveTo(el.x + Math.sin(state.frameCounter * 0.1) * 10, canvas.height - el.h/2, el.x, canvas.height - el.h);
                     ctx.stroke();
                 }
             }
          } else {
             // Cyberpunk Draw
             ctx.fillStyle = el.color;
             ctx.fillRect(el.x, canvas.height - el.h, el.w, el.h);
             // Windows
             if (i === 1 && Math.random() > 0.95) { // Occasional window flicker
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(el.x + 10, canvas.height - el.h + 10, 5, 5);
             }
          }
        });
      });

      // Normal speed progression
      state.gameSpeed = 4 + (state.score / 500);

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
      state.player.velocityY += GRAVITY;
      state.player.y += state.player.velocityY;

      // Floor Collision
      if (state.player.y > canvas.height - state.player.height) {
        state.player.y = canvas.height - state.player.height;
        state.player.velocityY = 0;
        state.player.isJumping = false;
      }

      // Draw Player
      drawDragon(ctx, state.player, state.frameCounter);

      // Handle Obstacles
      state.frameCounter++;
      // Spawn rate depends on speed
      if (state.obstacles.length === 0 && state.frameCounter % Math.floor(1000 / (state.gameSpeed * 10)) === 0) {
        const type = Math.random() > 0.5 ? 'drone' : 'pole';
        if (type === 'drone') {
            state.obstacles.push({
                type: 'drone',
                x: canvas.width,
                y: canvas.height - 90 - Math.random() * 50, // Flying high
                width: 40,
                height: 20,
                passed: false
            });
        } else {
            const h = 40 + Math.random() * 40;
            state.obstacles.push({
                type: 'pole',
                x: canvas.width,
                y: canvas.height - h,
                width: 10,
                height: h,
                passed: false
            });
        }
      }

      state.obstacles.forEach((obs, index) => {
        obs.x -= state.gameSpeed;
        
        if (obs.type === 'drone') {
            drawDrone(obs.x, obs.y);
        } else {
            drawPole(obs.x, obs.y, obs.height);
        }

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
                setCombo(state.combo);
                obs.nearMissChecked = true;
            }
        }

        // Score Calculation: Increment when obstacle passes player
        if (!obs.passed && obs.x + obs.width < state.player.x) {
          state.score += 1 + (state.combo * 0.1); // Combo multiplier
          obs.passed = true;
        }

        // Remove off-screen obstacles
        if (obs.x + obs.width < 0) {
          state.obstacles.splice(index, 1);
        }
      });

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

  if (view === 'welcome') {
    return (
      <>
        <style>{`
          .App.welcome-background {
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
            position: relative;
            overflow: hidden;
          }

          .welcome-background::before,
          .welcome-background::after {
            content: '';
            position: absolute;
            z-index: 0;
            background: rgba(255, 255, 255, 0.07);
            animation: rotate 40s linear infinite;
          }

          .welcome-background::before {
            width: 150vmax;
            height: 150vmax;
            left: -50%;
            top: -90%;
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          }

          .welcome-background::after {
            width: 120vmax;
            height: 120vmax;
            right: -50%;
            bottom: -90%;
            animation-direction: reverse;
            clip-path: polygon(0 0, 100% 0, 50% 100%);
          }

          @keyframes gradientBG { 0% {background-position: 0% 50%;} 50% {background-position: 100% 50%;} 100% {background-position: 0% 50%;} }
          @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

          .welcome-background main { position: relative; z-index: 1; background: transparent; }
          .welcome-background h1, .welcome-background p { color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
          .welcome-background main button {
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          }
          .welcome-background main button:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 15px rgba(0,0,0,0.3);
          }
          body { margin: 0; overflow: hidden; }
          .App.welcome-background { height: 100vh; height: 100dvh; width: 100%; }
        `}</style>
        <div className="App welcome-background">
          <main style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <h1>Welcome to SKY</h1>
          <p style={{ fontSize: '1.2rem', margin: '20px 0 40px' }}>Your adventure is about to begin.</p>
          <button onClick={() => setView('game')} style={styles.button}>
            Continue to Play
          </button>
        </main>
        </div>
      </>
    );
  }

  return (
    <div className="App">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; overflow: hidden; }
        .App {
          height: 100vh;
          height: 100dvh;
          width: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        header {
          padding: 10px;
          text-align: center;
          flex-shrink: 0;
          z-index: 20;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        header h1 { margin: 0; font-size: clamp(1.5rem, 5vw, 2.5rem); color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        main {
          flex: 1;
          display: flex;
          width: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          position: relative;
        }
        main > div { margin: auto; }
      `}</style>
      <header>
        <h1>WELCOME TO SKY</h1>
      </header>

      <main>
        {gameState === 'home' && (
          <div id="homeScreen">
            <style>{`
              .App {
                background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
                background-size: 400% 400%;
                animation: gradientBG 15s ease infinite;
                min-height: 100vh;
              }
              .App::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: 
                  linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%) -20px 0,
                  linear-gradient(225deg, rgba(255,255,255,0.1) 25%, transparent 25%) -20px 0,
                  linear-gradient(315deg, rgba(255,255,255,0.1) 25%, transparent 25%),
                  linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%);
                background-size: 40px 40px;
                z-index: 0;
                pointer-events: none;
              }
              .App > * { position: relative; z-index: 1; }
              .App h1, .App h2 { color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
              @keyframes gradientBG { 0% {background-position: 0% 50%;} 50% {background-position: 100% 50%;} 100% {background-position: 0% 50%;} }
              #homeScreen button {
                transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
              }
              #homeScreen button:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 15px rgba(0,0,0,0.3);
              }
            `}</style>
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
            <button onClick={viewLeaderboard} style={{...styles.button, backgroundColor: '#6c757d'}}>View Leaderboard</button>
          </div>
        )}

        {gameState === 'theme-selection' && (
          <div id="themeSelectionScreen">
            <style>{`
              @keyframes themePulse {
                0% { box-shadow: 0 0 15px rgba(138, 43, 226, 0.4), inset 0 0 10px rgba(138, 43, 226, 0.3); transform: scale(1); }
                50% { box-shadow: 0 0 25px rgba(138, 43, 226, 0.7), inset 0 0 20px rgba(138, 43, 226, 0.5); transform: scale(1.03); }
                100% { box-shadow: 0 0 15px rgba(138, 43, 226, 0.4), inset 0 0 10px rgba(138, 43, 226, 0.3); transform: scale(1); }
              }
              .theme-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 25px;
                max-width: 900px;
                margin: 0 auto;
                padding: 20px;
              }
              .theme-card {
                background: linear-gradient(145deg, #240046, #10002b);
                border: 2px solid #5a189a;
                border-radius: 15px;
                padding: 15px;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                animation: themePulse 3s infinite ease-in-out;
                position: relative;
                z-index: 10;
                transition: transform 0.2s, box-shadow 0.2s;
              }
              .theme-card:hover {
                animation: none;
                transform: scale(1.1);
                box-shadow: 0 0 30px rgba(224, 170, 255, 0.8);
                border-color: #e0aaff;
                z-index: 11;
              }
              .theme-preview {
                width: 100%;
                height: 100px;
                object-fit: cover;
                border-radius: 10px;
                margin-bottom: 10px;
                border: 1px solid rgba(255,255,255,0.1);
              }
              .theme-name {
                color: #e0aaff;
                font-weight: bold;
                font-size: 1.1rem;
                text-shadow: 0 0 5px rgba(224, 170, 255, 0.5);
              }
              #themeSelectionScreen h2 {
                color: white;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                margin-bottom: 30px;
                font-size: 2.5rem;
              }
            `}</style>
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
            <button onClick={() => setGameState('home')} style={{...styles.button, marginTop: '30px'}}>Back</button>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'paused') && (
          <div ref={gameContainerRef} className="game-container">
            <style>{`
              body {
                overflow: hidden;
                touch-action: none;
                overscroll-behavior: none;
                background-color: #050505;
              }
              .App {
                height: 100vh;
                height: 100dvh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
              }
              @keyframes rgbBorder {
                0% { border-color: #ff0055; box-shadow: 0 0 15px #ff0055, 0 30px 60px rgba(0,0,0,0.8); }
                25% { border-color: #00ff00; box-shadow: 0 0 15px #00ff00, 0 30px 60px rgba(0,0,0,0.8); }
                50% { border-color: #00ccff; box-shadow: 0 0 15px #00ccff, 0 30px 60px rgba(0,0,0,0.8); }
                75% { border-color: #ffff00; box-shadow: 0 0 15px #ffff00, 0 30px 60px rgba(0,0,0,0.8); }
                100% { border-color: #ff0055; box-shadow: 0 0 15px #ff0055, 0 30px 60px rgba(0,0,0,0.8); }
              }
              .game-container {
                transform: perspective(1000px) rotateX(5deg) scale(0.95) translateY(-10%);
                transform-style: preserve-3d;
                border: 4px solid #fff;
                border-radius: 20px;
                transition: transform 0.3s ease;
                max-width: 1200px;
                width: 98%;
                background: #000;
                animation: rgbBorder 5s linear infinite;
                position: relative;
              }
              main { overflow: hidden !important; }
              canvas {
                display: block;
                max-width: 100%;
                height: auto;
                border-radius: 16px;
              }
            `}</style>
            <div id="score-container" style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
              Score: <span ref={scoreSpanRef}>0</span> | Combo: {combo}x
            </div>
            <canvas ref={canvasRef} />
            {gameState === 'playing' && (
              <button 
                id="pause-btn" 
                onClick={pauseGame}
                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, ...styles.button, fontSize: '0.8rem', padding: '8px 16px' }}
              >
                Pause
              </button>
            )}
            {gameState === 'paused' && (
              <div id="pauseScreen" className="overlay-screen">
                <h2>Paused</h2>
                <button onClick={resumeGame} style={styles.button}>Resume</button>
                <button onClick={exitGame} style={{ ...styles.button, backgroundColor: '#f44336' }}>Exit to Menu</button>
              </div>
            )}
          </div>
        )}

        {gameState === 'leaderboard' && (
          <div id="leaderboardScreen">
            <style>{`
              .App {
                background: #111;
                perspective: 1000px;
                overflow: hidden;
              }
              .App::before {
                content: '';
                position: absolute;
                inset: -50%;
                background: 
                  repeating-linear-gradient(90deg, rgba(255, 0, 255, 0.3) 0 2px, transparent 2px 100px),
                  repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.3) 0 2px, transparent 2px 100px);
                transform: rotateX(45deg) rotateZ(45deg);
                animation: moveGrid 20s linear infinite;
                z-index: 0;
              }
              @keyframes moveGrid { 0% { background-position: 0 0; } 100% { background-position: 100px 100px; } }
              .leaderboard-card {
                position: relative; z-index: 1;
                background: linear-gradient(145deg, #000000, #1a1a1a); padding: 40px; border-radius: 20px;
                border: 3px solid transparent;
                background-clip: padding-box;
                box-shadow: 0 0 30px rgba(0,255,255,0.5);
                transform: rotateX(10deg);
                border-image: linear-gradient(45deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff) 1;
              }
              .App h2, .App li { color: white; text-shadow: 0 0 10px rgba(255,255,255,0.5); }
              .leaderboard-list li { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.2); font-family: monospace; font-size: 1.2rem; }
            `}</style>
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
              .App {
                background: #050505;
                perspective: 800px;
                overflow: hidden;
              }
              .App::before {
                content: ''; position: absolute; inset: -100%;
                background: 
                  repeating-linear-gradient(90deg, rgba(255, 50, 50, 0.4) 0 4px, transparent 4px 80px),
                  repeating-linear-gradient(0deg, rgba(50, 50, 255, 0.4) 0 4px, transparent 4px 80px);
                transform: rotateX(60deg);
                animation: planeMove 10s linear infinite;
                z-index: 0;
              }
              @keyframes planeMove { 0% { transform: rotateX(60deg) translateY(0); } 100% { transform: rotateX(60deg) translateY(80px); } }
              .game-over-card {
                position: relative; z-index: 1;
                background: linear-gradient(145deg, #000000, #1a1a1a); padding: 40px; border-radius: 20px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 0 2px rgba(255,255,255,0.1);
                transform: rotateX(5deg);
                backdrop-filter: blur(10px);
                overflow: hidden;
                width: 100%;
                max-width: 500px;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .App h2, .App h3, .App p, .App li { color: white; text-shadow: 0 2px 5px black; }
              /* Colorful moving lines */
              .game-over-card::before {
                content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 4px;
                background: linear-gradient(90deg, transparent, #ff0055, #00ccff, transparent);
                animation: slideLine 3s linear infinite;
              }
              .game-over-card::after {
                content: ''; position: absolute; bottom: 0; right: -100%; width: 100%; height: 4px;
                background: linear-gradient(90deg, transparent, #00ccff, #ff0055, transparent);
                animation: slideLine 3s linear infinite reverse;
              }
              @keyframes slideLine { 0% { left: -100%; } 50% { left: 100%; } 100% { left: 100%; } }

              /* Extra vertical lines */
              .vertical-line-left {
                position: absolute; top: -100%; left: 0; width: 4px; height: 100%;
                background: linear-gradient(180deg, transparent, #ff0055, #00ccff, transparent);
                animation: slideLineVertical 3s linear infinite 1.5s;
              }
              .vertical-line-right {
                position: absolute; bottom: -100%; right: 0; width: 4px; height: 100%;
                background: linear-gradient(180deg, transparent, #00ccff, #ff0055, transparent);
                animation: slideLineVertical 3s linear infinite reverse 1.5s;
              }
              @keyframes slideLineVertical { 0% { top: -100%; } 50% { top: 100%; } 100% { top: 100%; } }

              .App h2 { 
                font-size: 3rem; color: #ff0055; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 10px;
                text-shadow: 0 0 15px rgba(255, 0, 85, 0.6);
                animation: pulseText 2s infinite;
              }
              @keyframes pulseText { 0% { text-shadow: 0 0 15px rgba(255, 0, 85, 0.6); } 50% { text-shadow: 0 0 25px rgba(255, 0, 85, 1); } 100% { text-shadow: 0 0 15px rgba(255, 0, 85, 0.6); } }

              .final-score { font-size: 1.5rem; color: #ccc; margin-bottom: 20px; }
              .final-score span { color: #fff; font-size: 2.5rem; font-weight: bold; text-shadow: 0 0 10px rgba(255,255,255,0.5); }
              
              .leaderboard-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; margin-top: 10px; }
              .leaderboard-table th { text-align: center; color: #888; padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
              .leaderboard-table td { padding: 12px 10px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.05); font-family: monospace; font-size: 1.2rem; text-align: center; }
              .leaderboard-table tr:last-child td { border-bottom: none; }
              .leaderboard-table tr:hover td { background: rgba(255, 255, 255, 0.1); color: #00ccff; cursor: default; transform: scale(1.02); transition: transform 0.2s; }
              
              .game-over-btn { transition: transform 0.2s, box-shadow 0.2s; margin: 0 10px; }
              .game-over-btn:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 5px 15px rgba(0,0,0,0.4); }
            `}</style>
            <div className="game-over-card">
            <div className="vertical-line-left"></div>
            <div className="vertical-line-right"></div>
            <h2>Game Over</h2>
            <p className="final-score">Final Score: <span>{finalScore}</span></p>
            
            <h3 style={{color: '#00ccff', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px'}}>Top 5 Leaderboard</h3>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.name || 'Anonymous'}</td>
                    <td>{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', width: '100%' }}>
              <button className="game-over-btn" onClick={restartGame} style={styles.button}>Play Again</button>
              <button className="game-over-btn" onClick={exitGame} style={{ ...styles.button, backgroundColor: '#f44336' }}>Exit</button>
            </div>
          </div>
          </div>
        )}
      </main>
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