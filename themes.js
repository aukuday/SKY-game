export const THEMES = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    url: 'https://img.freepik.com/free-vector/gradient-cyberpunk-city-background_23-2149249874.jpg',
    bgColor: '#050510',
    layers: [{ speed: 0.5, elements: [] }, { speed: 2, elements: [] }],
    spawn: (layer, i, canvas) => {
      layer.elements.push({
        x: canvas.width + Math.random() * 50,
        w: 50 + Math.random() * 100,
        h: 50 + Math.random() * 150,
        color: i === 0 ? '#1a1a2e' : '#2a2a4e', // Darker for far, lighter for near
      });
    },
    draw: (ctx, el, i, frame) => {
      ctx.fillStyle = el.color;
      ctx.fillRect(el.x, ctx.canvas.height - el.h, el.w, el.h);
      // Windows
      if (i === 1 && Math.random() > 0.95) { // Occasional window flicker
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(el.x + 10, ctx.canvas.height - el.h + 10, 5, 5);
      }
    },
  },
  {
    id: 'jungle',
    name: 'Jungle',
    url: 'https://img.freepik.com/free-vector/flat-design-forest-landscape_23-2149155031.jpg',
    bgColor: '#1a2f1a',
    layers: [{ speed: 0.5, elements: [] }, { speed: 2.5, elements: [] }],
    spawn: (layer, i, canvas) => {
      if (i === 0) { // Mid-ground
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
      } else { // Foreground
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
    },
    draw: (ctx, el, i, frame) => {
      if (el.type === 'tree') {
        ctx.fillStyle = '#5D4037'; // Trunk
        ctx.fillRect(el.x + el.w * 0.3, el.y, el.w * 0.4, el.h);
        ctx.fillStyle = '#2E7D32'; // Leaves
        ctx.beginPath();
        ctx.arc(el.x + el.w / 2, el.y, el.w, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.type === 'vine') {
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(el.x, 0);
        ctx.quadraticCurveTo(el.x + Math.sin(frame * 0.05 + el.x) * 10, el.h / 2, el.x, el.h);
        ctx.stroke();
      } else if (el.type === 'ruin') {
        ctx.fillStyle = '#757575';
        ctx.fillRect(el.x, el.y, el.w, el.h);
        ctx.fillStyle = '#424242'; // Cracks
        ctx.fillRect(el.x + 10, el.y + 10, el.w - 20, 5);
      } else if (el.type === 'bush') {
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(el.x + el.w / 2, el.y, el.w / 2, Math.PI, 0);
        ctx.fill();
      } else if (el.type === 'rock') {
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        ctx.arc(el.x + el.w / 2, el.y, el.w / 2, Math.PI, 0);
        ctx.fill();
      } else if (el.type === 'grass') {
        ctx.strokeStyle = '#32CD32';
        ctx.lineWidth = 2;
        for (let k = 0; k < el.w; k += 5) {
          ctx.beginPath();
          ctx.moveTo(el.x + k, el.y);
          ctx.lineTo(el.x + k + Math.sin(frame * 0.1 + k) * 3, el.y - el.h);
          ctx.stroke();
        }
      }
    }
  },
  {
    id: 'space',
    name: 'Space Runner',
    url: 'https://img.freepik.com/free-vector/space-game-background-neon-landscape-futuristic_107791-163.jpg',
    bgColor: '#050010',
    layers: [
      { speed: 0.1, elements: [], allowOverlap: true }, // Distant stars
      { speed: 0.5, elements: [] }, // Deep space
      { speed: 1.5, elements: [] }, // Mid layer
      { speed: 3.0, elements: [] }  // Foreground
    ],
    spawn: (layer, i, canvas) => {
      if (i === 0) { // Layer 4: Distant stars
        if (Math.random() < 0.3) {
          const isShooting = Math.random() < 0.005;
          layer.elements.push({ type: isShooting ? 'shootingStar' : 'star', x: canvas.width + Math.random() * 50, y: Math.random() * canvas.height, w: isShooting ? 50 : Math.random() * 2 + 1, h: isShooting ? 2 : Math.random() * 2 + 1, opacity: Math.random() });
        }
      } else if (i === 1) { // Layer 3: Deep space (Nebula)
        if (Math.random() < 0.005) {
          layer.elements.push({ type: 'nebula', x: canvas.width, y: Math.random() * canvas.height, w: 200 + Math.random() * 300, h: 100 + Math.random() * 200, color: Math.random() > 0.5 ? 'rgba(75, 0, 130, 0.3)' : 'rgba(0, 0, 139, 0.3)' });
        }
      } else if (i === 2) { // Layer 2: Mid layer
        if (Math.random() < 0.01) {
          const type = Math.random() > 0.4 ? 'asteroid' : (Math.random() > 0.5 ? 'satellite' : 'station');
          layer.elements.push({ type, x: canvas.width, y: Math.random() * (canvas.height - 150), w: 40 + Math.random() * 40, h: 40 + Math.random() * 40 });
        }
      } else if (i === 3) { // Layer 1: Foreground
        if (Math.random() < 0.05) {
          const type = Math.random() > 0.6 ? 'debris' : (Math.random() > 0.5 ? 'meteor' : 'spark');
          layer.elements.push({ type, x: canvas.width, y: Math.random() * canvas.height, w: 5 + Math.random() * 10, h: 5 + Math.random() * 10 });
        }
      }
    },
    draw: (ctx, el, i, frame) => {
      if (i === 0) { // Stars
        if (el.type === 'shootingStar') {
          el.x -= 10;
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(el.x, el.y); ctx.lineTo(el.x + el.w, el.y - 10); ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(frame * 0.05 + el.x) * 0.7})`;
          ctx.fillRect(el.x, el.y, el.w, el.h);
        }
      } else if (i === 1) { // Nebula
        ctx.fillStyle = el.color; ctx.beginPath(); ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, el.w / 2, el.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      } else if (i === 2) { // Mid
        if (el.type === 'asteroid') {
          ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(el.x + el.w / 2, el.y + el.h / 2, el.w / 2, 0, Math.PI * 2); ctx.fill();
        } else if (el.type === 'satellite') {
          ctx.fillStyle = '#888'; ctx.fillRect(el.x, el.y + el.h / 3, el.w, el.h / 3); ctx.fillStyle = '#00a'; ctx.fillRect(el.x, el.y, 10, el.h); ctx.fillRect(el.x + el.w - 10, el.y, 10, el.h);
        } else { // station
          ctx.fillStyle = '#777'; ctx.fillRect(el.x, el.y, el.w, el.h); ctx.fillStyle = '#f00'; ctx.fillRect(el.x + 5, el.y + 5, 3, 3);
        }
      } else if (i === 3) { // Fore
        if (el.type === 'debris') {
          ctx.fillStyle = '#444'; ctx.fillRect(el.x, el.y, el.w, el.h);
        } else if (el.type === 'meteor') {
          ctx.fillStyle = '#666'; ctx.beginPath(); ctx.arc(el.x, el.y, el.w / 2, 0, Math.PI * 2); ctx.fill();
        } else { // spark
          ctx.fillStyle = '#0ff'; ctx.fillRect(el.x, el.y, el.w, 2);
        }
      }
    }
  },
  {
    id: 'lava',
    name: 'Lava / Volcano',
    url: 'https://img.freepik.com/free-vector/volcano-eruption-background-flat-style_23-2148664267.jpg',
    bgColor: '#220000',
    layers: [
      { speed: 0.1, elements: [], allowOverlap: true }, // Sky
      { speed: 0.5, elements: [] }, // Background
      { speed: 1.5, elements: [] }, // Mid
      { speed: 3.0, elements: [] }  // Fore
    ],
    spawn: (layer, i, canvas) => {
      if (i === 0) { // Layer 4: Sky (Ash, Red smoke)
        if (Math.random() < 0.2) {
          layer.elements.push({ type: 'ash', x: canvas.width + Math.random() * 50, y: Math.random() * canvas.height, w: 2 + Math.random() * 3, h: 2 + Math.random() * 3, opacity: 0.5 + Math.random() * 0.5 });
        }
      } else if (i === 1) { // Layer 3: Background (Volcano)
        if (Math.random() < 0.005) {
          layer.elements.push({ type: 'volcano', x: canvas.width, y: canvas.height - 50, w: 300 + Math.random() * 200, h: 200 + Math.random() * 100 });
        }
      } else if (i === 2) { // Layer 2: Mid layer (Rocks, Lava falls)
        if (Math.random() < 0.01) {
          const type = Math.random() > 0.3 ? 'rockFormation' : 'lavaFall';
          layer.elements.push({ type, x: canvas.width, y: canvas.height - (type === 'lavaFall' ? 150 : 100), w: 50 + Math.random() * 50, h: 100 + Math.random() * 50 });
        }
      } else if (i === 3) { // Layer 1: Foreground (Cracked rocks, Splashes, Embers)
        if (Math.random() < 0.05) {
          const type = Math.random() < 0.4 ? 'crackedRock' : (Math.random() < 0.7 ? 'splash' : 'ember');
          layer.elements.push({ type, x: canvas.width, y: type === 'ember' ? canvas.height : canvas.height - 20, w: type === 'ember' ? 5 : 30 + Math.random() * 20, h: type === 'ember' ? 5 : 20 + Math.random() * 20 });
        }
      }
    },
    draw: (ctx, el, i, frame) => {
      if (i === 0) { // Sky
        if (el.type === 'ash') { ctx.fillStyle = `rgba(150, 150, 150, ${el.opacity})`; ctx.fillRect(el.x, el.y, el.w, el.h); }
      } else if (i === 1) { // Background
        if (el.type === 'volcano') {
          ctx.fillStyle = '#1a0505'; ctx.beginPath(); ctx.moveTo(el.x, ctx.canvas.height); ctx.lineTo(el.x + el.w / 2, ctx.canvas.height - el.h); ctx.lineTo(el.x + el.w, ctx.canvas.height); ctx.fill();
          ctx.strokeStyle = '#ff4500'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(el.x + el.w / 2, ctx.canvas.height - el.h); ctx.quadraticCurveTo(el.x + el.w / 2 + Math.sin(frame * 0.05) * 20, ctx.canvas.height - el.h / 2, el.x + el.w / 2 + 50, ctx.canvas.height); ctx.stroke();
        }
      } else if (i === 2) { // Mid
        if (el.type === 'rockFormation') { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(el.x, ctx.canvas.height); ctx.lineTo(el.x + el.w / 2, el.y); ctx.lineTo(el.x + el.w, ctx.canvas.height); ctx.fill(); }
        else if (el.type === 'lavaFall') { ctx.fillStyle = '#ff3300'; ctx.fillRect(el.x, el.y, el.w, el.h); }
      } else if (i === 3) { // Fore
        if (el.type === 'crackedRock') {
          ctx.fillStyle = '#111'; ctx.fillRect(el.x, ctx.canvas.height - el.h, el.w, el.h); ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(el.x, ctx.canvas.height - el.h); ctx.lineTo(el.x + el.w, ctx.canvas.height); ctx.stroke();
        } else if (el.type === 'splash') {
          ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(el.x, ctx.canvas.height, el.w / 2, Math.PI, 0); ctx.fill();
        } else if (el.type === 'ember') {
          el.y -= 2; ctx.fillStyle = '#ffff00'; ctx.fillRect(el.x, el.y, el.w, el.h);
        }
      }
    }
  },
  {
    id: 'ice',
    name: 'Ice World',
    url: 'https://tse3.mm.bing.net/th/id/OIP.IXk4999-dHEmPlHPermK3wHaFj?rs=1&pid=ImgDetMain&o=7&rm=3',
    bgColor: '#0a1a2a',
    layers: [
      { speed: 0.1, elements: [], allowOverlap: true }, // Sky
      { speed: 0.5, elements: [] }, // Background
      { speed: 1.5, elements: [] }, // Mid
      { speed: 3.0, elements: [] }  // Fore
    ],
    spawn: (layer, i, canvas) => {
      if (i === 0) { // Layer 4: Sky (Aurora, Snowfall)
        if (Math.random() < 0.005) { layer.elements.push({ type: 'aurora', x: canvas.width, y: Math.random() * (canvas.height / 3), w: 300 + Math.random() * 200, h: 100 + Math.random() * 100, color: Math.random() > 0.5 ? 'rgba(0, 255, 255, 0.15)' : 'rgba(255, 0, 255, 0.15)' }); }
        if (Math.random() < 0.4) { layer.elements.push({ type: 'snow', x: canvas.width + Math.random() * 50, y: Math.random() * canvas.height, w: 2 + Math.random() * 2, h: 2 + Math.random() * 2, speedY: 1 + Math.random() * 2 }); }
      } else if (i === 1) { // Layer 3: Background (Mountains, Cliffs)
        if (Math.random() < 0.008) { const type = Math.random() > 0.5 ? 'mountain' : 'cliff'; layer.elements.push({ type, x: canvas.width, y: canvas.height, w: 200 + Math.random() * 150, h: 150 + Math.random() * 150 }); }
      } else if (i === 2) { // Layer 2: Mid (Trees, Icicles, Rocks)
        if (Math.random() < 0.015) {
          const type = Math.random() < 0.4 ? 'frozenTree' : (Math.random() < 0.7 ? 'icicle' : 'snowRock');
          let w, h, y;
          if (type === 'frozenTree') { w = 50 + Math.random() * 30; h = 100 + Math.random() * 50; y = canvas.height - h; }
          else if (type === 'icicle') { w = 20 + Math.random() * 10; h = 50 + Math.random() * 40; y = 0; }
          else { w = 40 + Math.random() * 30; h = 30 + Math.random() * 20; y = canvas.height - h; }
          layer.elements.push({ type, x: canvas.width, y, w, h });
        }
      } else if (i === 3) { // Layer 1: Fore (Piles, Chunks, Dust)
        if (Math.random() < 0.05) {
          const type = Math.random() < 0.4 ? 'snowPile' : (Math.random() < 0.7 ? 'iceChunk' : 'snowDust');
          let w, h, y;
          if (type === 'snowPile') { w = 60 + Math.random() * 40; h = 30 + Math.random() * 20; y = canvas.height; }
          else if (type === 'iceChunk') { w = 20 + Math.random() * 15; h = 20 + Math.random() * 15; y = canvas.height - 20; }
          else { w = 4; h = 4; y = canvas.height - Math.random() * 100; }
          layer.elements.push({ type, x: canvas.width, y, w, h });
        }
      }
    },
    draw: (ctx, el, i, frame) => {
      if (i === 0) { // Sky
        if (el.type === 'aurora') { const grad = ctx.createLinearGradient(el.x, el.y, el.x, el.y + el.h); grad.addColorStop(0, el.color); grad.addColorStop(1, 'transparent'); ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, el.w / 2, el.h / 2, 0, 0, Math.PI * 2); ctx.fill(); }
        else if (el.type === 'snow') { el.y += el.speedY; if (el.y > ctx.canvas.height) el.y = 0; ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.beginPath(); ctx.arc(el.x, el.y, el.w / 2, 0, Math.PI * 2); ctx.fill(); }
      } else if (i === 1) { // Background
        ctx.fillStyle = el.type === 'mountain' ? '#90a4ae' : '#78909c'; ctx.beginPath(); ctx.moveTo(el.x, ctx.canvas.height); ctx.lineTo(el.x + el.w / 2, ctx.canvas.height - el.h); ctx.lineTo(el.x + el.w, ctx.canvas.height); ctx.fill();
        ctx.fillStyle = '#e1f5fe'; ctx.beginPath(); ctx.moveTo(el.x + el.w / 2, ctx.canvas.height - el.h); ctx.lineTo(el.x + el.w / 2 - 20, ctx.canvas.height - el.h + 40); ctx.lineTo(el.x + el.w / 2 + 20, ctx.canvas.height - el.h + 40); ctx.fill();
      } else if (i === 2) { // Mid
        if (el.type === 'frozenTree') { ctx.fillStyle = '#455a64'; ctx.fillRect(el.x + el.w * 0.4, el.y, el.w * 0.2, el.h); ctx.fillStyle = '#b3e5fc'; ctx.beginPath(); ctx.moveTo(el.x, el.y + el.h * 0.8); ctx.lineTo(el.x + el.w / 2, el.y); ctx.lineTo(el.x + el.w, el.y + el.h * 0.8); ctx.fill(); }
        else if (el.type === 'icicle') { ctx.fillStyle = 'rgba(225, 245, 254, 0.8)'; ctx.beginPath(); ctx.moveTo(el.x, 0); ctx.lineTo(el.x + el.w / 2, el.h); ctx.lineTo(el.x + el.w, 0); ctx.fill(); }
        else { ctx.fillStyle = '#607d8b'; ctx.beginPath(); ctx.arc(el.x + el.w / 2, el.y + el.h, el.w / 2, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#e1f5fe'; ctx.fillRect(el.x, el.y + el.h / 2, el.w, 8); }
      } else if (i === 3) { // Fore
        if (el.type === 'snowPile') { ctx.fillStyle = '#e1f5fe'; ctx.beginPath(); ctx.arc(el.x + el.w / 2, el.y, el.w / 2, Math.PI, 0); ctx.fill(); }
        else if (el.type === 'iceChunk') { ctx.fillStyle = '#81d4fa'; ctx.fillRect(el.x, el.y, el.w, el.h); }
        else { el.y -= 1; ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.beginPath(); ctx.arc(el.x, el.y, 2, 0, Math.PI * 2); ctx.fill(); }
      }
    }
  },
  {
    id: 'desert',
    name: 'Desert',
    url: 'https://img.freepik.com/free-vector/desert-landscape-scene-sunset_1308-54565.jpg',
    bgColor: (ctx, canvas) => { const grad = ctx.createLinearGradient(0, 0, 0, canvas.height); grad.addColorStop(0, '#FFD700'); grad.addColorStop(1, '#FF8C00'); return grad; },
    layers: [
      { speed: 0.1, elements: [] }, // Sky
      { speed: 0.5, elements: [] }, // Background
      { speed: 1.5, elements: [] }, // Mid
      { speed: 3.0, elements: [], allowOverlap: true }  // Fore
    ],
    spawn: (layer, i, canvas) => {
      if (i === 0) { // Layer 4: Sky
        if (Math.random() < 0.001 && layer.elements.length === 0) { layer.elements.push({ type: 'sun', x: canvas.width, y: 50, w: 60, h: 60 }); }
      } else if (i === 1) { // Layer 3: Background
        if (Math.random() < 0.005) { const type = Math.random() > 0.3 ? 'duneLarge' : 'pyramid'; layer.elements.push({ type, x: canvas.width, y: canvas.height - 50, w: 150 + Math.random() * 150, h: 100 + Math.random() * 100 }); }
      } else if (i === 2) { // Layer 2: Mid
        if (Math.random() < 0.01) { const type = Math.random() < 0.4 ? 'duneSmall' : (Math.random() < 0.7 ? 'cart' : 'cactus'); layer.elements.push({ type, x: canvas.width, y: canvas.height - 40, w: 50 + Math.random() * 50, h: 50 + Math.random() * 50 }); }
      } else if (i === 3) { // Layer 1: Fore
        if (Math.random() < 0.1) { const type = Math.random() < 0.5 ? 'sand' : (Math.random() < 0.7 ? 'rock' : (Math.random() < 0.85 ? 'skull' : 'shrub')); layer.elements.push({ type, x: canvas.width, y: type === 'sand' ? Math.random() * canvas.height : canvas.height - 10, w: type === 'sand' ? 2 : 20 + Math.random() * 10, h: type === 'sand' ? 2 : 20 + Math.random() * 10 }); }
      }
    },
    draw: (ctx, el, i, frame) => {
      if (i === 0) { // Sky
        if (el.type === 'sun') { ctx.fillStyle = '#FFFF00'; ctx.beginPath(); ctx.arc(el.x, el.y, el.w, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 20; ctx.shadowColor = '#FFD700'; ctx.stroke(); ctx.shadowBlur = 0; }
      } else if (i === 1) { // Background
        if (el.type === 'duneLarge') { ctx.fillStyle = '#CD853F'; ctx.beginPath(); ctx.moveTo(el.x, ctx.canvas.height); ctx.quadraticCurveTo(el.x + el.w / 2, el.y, el.x + el.w, ctx.canvas.height); ctx.fill(); }
        else if (el.type === 'pyramid') { ctx.fillStyle = '#D2691E'; ctx.beginPath(); ctx.moveTo(el.x, ctx.canvas.height); ctx.lineTo(el.x + el.w / 2, el.y); ctx.lineTo(el.x + el.w, ctx.canvas.height); ctx.fill(); }
      } else if (i === 2) { // Mid
        if (el.type === 'duneSmall') { ctx.fillStyle = '#DAA520'; ctx.beginPath(); ctx.moveTo(el.x, ctx.canvas.height); ctx.quadraticCurveTo(el.x + el.w / 2, el.y + 20, el.x + el.w, ctx.canvas.height); ctx.fill(); }
        else if (el.type === 'cart') { ctx.fillStyle = '#8B4513'; ctx.fillRect(el.x, el.y + el.h / 2, el.w, el.h / 2); ctx.fillStyle = '#A0522D'; ctx.beginPath(); ctx.arc(el.x + 10, el.y + el.h, 10, 0, Math.PI * 2); ctx.arc(el.x + el.w - 10, el.y + el.h, 10, 0, Math.PI * 2); ctx.fill(); }
        else if (el.type === 'cactus') { ctx.fillStyle = '#228B22'; ctx.fillRect(el.x + el.w / 2 - 5, el.y, 10, el.h); ctx.fillRect(el.x + el.w / 2 - 15, el.y + 20, 10, 5); ctx.fillRect(el.x + el.w / 2 - 15, el.y + 10, 5, 15); }
      } else if (i === 3) { // Fore
        if (el.type === 'sand') { el.x -= 2; ctx.fillStyle = '#F4A460'; ctx.fillRect(el.x, el.y, el.w, el.h); }
        else if (el.type === 'rock') { ctx.fillStyle = '#808080'; ctx.beginPath(); ctx.arc(el.x, ctx.canvas.height, el.w / 2, Math.PI, 0); ctx.fill(); }
        else if (el.type === 'skull') { ctx.fillStyle = '#F5F5DC'; ctx.beginPath(); ctx.arc(el.x, ctx.canvas.height - 5, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#000'; ctx.fillRect(el.x - 3, ctx.canvas.height - 5, 2, 2); ctx.fillRect(el.x + 1, ctx.canvas.height - 5, 2, 2); }
        else if (el.type === 'shrub') { ctx.fillStyle = '#556B2F'; ctx.beginPath(); ctx.arc(el.x, ctx.canvas.height, el.w / 2, Math.PI, 0); ctx.fill(); }
      }
    }
  },
  {
    id: 'candy',
    name: 'Candy',
    url: 'https://img.freepik.com/free-vector/fantasy-sweet-candyland-background_107791-1763.jpg',
    bgColor: (ctx, canvas) => { const grad = ctx.createLinearGradient(0, 0, 0, canvas.height); grad.addColorStop(0, '#ffe6e9'); grad.addColorStop(1, '#e0f7fa'); return grad; },
    layers: [
      { speed: 0.1, elements: [], allowOverlap: true }, // Sky
      { speed: 0.5, elements: [] }, // Background
      { speed: 1.5, elements: [] }, // Mid
      { speed: 3.0, elements: [] }  // Fore
    ],
    spawn: (layer, i, canvas) => {
      if (i === 0) { // Layer 4: Sky
        if (Math.random() < 0.1) { layer.elements.push({ type: 'sprinkle', x: canvas.width, y: Math.random() * canvas.height, w: 4, h: 10, color: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#1a535c'][Math.floor(Math.random() * 4)], rotation: Math.random() * Math.PI }); }
      } else if (i === 1) { // Layer 3: Background
        if (Math.random() < 0.005) { const type = Math.random() > 0.3 ? 'cottonCloud' : (Math.random() > 0.5 ? 'chocoMountain' : 'castle'); layer.elements.push({ type, x: canvas.width, y: canvas.height - (type === 'chocoMountain' ? 0 : 50), w: type === 'castle' ? 100 : 150 + Math.random() * 100, h: type === 'castle' ? 150 : 100 + Math.random() * 50 }); }
      } else if (i === 2) { // Layer 2: Mid
        if (Math.random() < 0.015) { const type = Math.random() < 0.4 ? 'lollipop' : (Math.random() < 0.7 ? 'gumdrop' : 'cane'); layer.elements.push({ type, x: canvas.width, y: canvas.height - (type === 'gumdrop' ? 40 : 100), w: type === 'gumdrop' ? 60 : 40, h: type === 'gumdrop' ? 40 : 100 }); }
      } else if (i === 3) { // Layer 1: Fore
        if (Math.random() < 0.05) { const type = Math.random() < 0.4 ? 'jelly' : (Math.random() < 0.7 ? 'crumb' : 'drip'); layer.elements.push({ type, x: canvas.width, y: type === 'drip' ? 0 : canvas.height - 10, w: type === 'crumb' ? 5 : 30, h: type === 'drip' ? 40 : (type === 'crumb' ? 5 : 20) }); }
      }
    },
    draw: (ctx, el, i, frame) => {
      if (i === 0) { // Sky
        if (el.type === 'sprinkle') { ctx.save(); ctx.translate(el.x, el.y); ctx.rotate(el.rotation); ctx.fillStyle = el.color; ctx.fillRect(-el.w / 2, -el.h / 2, el.w, el.h); ctx.restore(); }
      } else if (i === 1) { // Background
        if (el.type === 'cottonCloud') { ctx.fillStyle = 'rgba(255, 192, 203, 0.6)'; ctx.beginPath(); ctx.arc(el.x, el.y, el.w / 3, 0, Math.PI * 2); ctx.arc(el.x + el.w / 2, el.y - 20, el.w / 3, 0, Math.PI * 2); ctx.arc(el.x + el.w, el.y, el.w / 3, 0, Math.PI * 2); ctx.fill(); }
        else if (el.type === 'chocoMountain') { ctx.fillStyle = '#5D4037'; ctx.beginPath(); ctx.moveTo(el.x, ctx.canvas.height); ctx.quadraticCurveTo(el.x + el.w / 2, el.y - el.h, el.x + el.w, ctx.canvas.height); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.moveTo(el.x + el.w / 2 - 20, el.y - el.h + 35); ctx.quadraticCurveTo(el.x + el.w / 2, el.y - el.h, el.x + el.w / 2 + 20, el.y - el.h + 35); ctx.fill(); }
        else if (el.type === 'castle') { ctx.fillStyle = '#FF69B4'; ctx.fillRect(el.x, el.y, el.w, el.h); ctx.fillStyle = '#FF1493'; ctx.beginPath(); ctx.moveTo(el.x - 10, el.y); ctx.lineTo(el.x + el.w / 2, el.y - 50); ctx.lineTo(el.x + el.w + 10, el.y); ctx.fill(); }
      } else if (i === 2) { // Mid
        if (el.type === 'lollipop') { ctx.fillStyle = '#FFF'; ctx.fillRect(el.x + el.w / 2 - 2, el.y + 30, 4, el.h - 30); ctx.fillStyle = '#FF4081'; ctx.beginPath(); ctx.arc(el.x + el.w / 2, el.y + 30, 30, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(el.x + el.w / 2 - 10, el.y + 20, 5, 0, Math.PI * 2); ctx.fill(); }
        else if (el.type === 'gumdrop') { ctx.fillStyle = '#AB47BC'; ctx.beginPath(); ctx.arc(el.x + el.w / 2, el.y + el.h, el.w / 2, Math.PI, 0); ctx.fill(); }
        else if (el.type === 'cane') { ctx.strokeStyle = '#F44336'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(el.x, el.y + el.h); ctx.lineTo(el.x, el.y + 20); ctx.arc(el.x + 15, el.y + 20, 15, Math.PI, 0); ctx.stroke(); }
      } else if (i === 3) { // Fore
        if (el.type === 'jelly') { ctx.fillStyle = 'rgba(0, 255, 0, 0.6)'; ctx.beginPath(); ctx.arc(el.x, ctx.canvas.height, el.w, Math.PI, 0); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(el.x - 5, ctx.canvas.height - 15, 5, 2, Math.PI / 4, 0, Math.PI * 2); ctx.fill(); }
        else if (el.type === 'crumb') { ctx.fillStyle = '#FF9800'; ctx.fillRect(el.x, el.y, el.w, el.h); }
        else if (el.type === 'drip') { ctx.fillStyle = '#795548'; ctx.beginPath(); ctx.moveTo(el.x, 0); ctx.lineTo(el.x, el.h - 10); ctx.arc(el.x + el.w / 2, el.h - 10, el.w / 2, 0, Math.PI); ctx.lineTo(el.x + el.w, 0); ctx.fill(); }
      }
    }
  },
  {
    id: 'underwater',
    name: 'Underwater',
    url: 'https://img.freepik.com/free-vector/underwater-ocean-background-with-fish-corals_107791-667.jpg',
    bgColor: (ctx, canvas) => { const grad = ctx.createLinearGradient(0, 0, 0, canvas.height); grad.addColorStop(0, '#006994'); grad.addColorStop(1, '#001e36'); return grad; },
    layers: [
      { speed: 0.1, elements: [], allowOverlap: true }, // Water light layer
      { speed: 0.5, elements: [] }, // Deep background
      { speed: 1.5, elements: [] }, // Mid layer
      { speed: 3.0, elements: [], allowOverlap: true }  // Foreground
    ],
    spawn: (layer, i, canvas) => {
      if (i === 0) { // Layer 4: Water light layer
        if (Math.random() < 0.02) { layer.elements.push({ type: 'lightRay', x: canvas.width, y: 0, w: 50 + Math.random() * 100, h: canvas.height, opacity: 0.05 + Math.random() * 0.15 }); }
      } else if (i === 1) { // Layer 3: Deep background
        if (Math.random() < 0.005) { const type = Math.random() > 0.5 ? 'shadowRock' : 'ruinSilhouette'; layer.elements.push({ type, x: canvas.width, y: canvas.height - (type === 'ruinSilhouette' ? 150 : 100), w: 100 + Math.random() * 150, h: 100 + Math.random() * 100 }); }
      } else if (i === 2) { // Layer 2: Mid layer
        if (Math.random() < 0.01) { const type = Math.random() < 0.4 ? 'coral' : (Math.random() < 0.7 ? 'shipPart' : 'pillar'); layer.elements.push({ type, x: canvas.width, y: canvas.height - (type === 'pillar' ? 120 : 60), w: 60 + Math.random() * 40, h: 60 + Math.random() * 60 }); }
      } else if (i === 3) { // Layer 1: Foreground
        if (Math.random() < 0.05) { const type = Math.random() < 0.4 ? 'bubble' : (Math.random() < 0.7 ? 'fish' : 'seaweed'); layer.elements.push({ type, x: canvas.width, y: type === 'bubble' ? canvas.height : Math.random() * canvas.height, w: type === 'bubble' ? 5 + Math.random() * 10 : (type === 'fish' ? 20 : 10), h: type === 'bubble' ? 5 + Math.random() * 10 : (type === 'fish' ? 10 : 50) }); }
      }
    },
    draw: (ctx, el, i, frame) => {
      if (i === 0) { // Light rays
        if (el.type === 'lightRay') { ctx.fillStyle = `rgba(255, 255, 255, ${el.opacity})`; ctx.beginPath(); ctx.moveTo(el.x, 0); ctx.lineTo(el.x + el.w, 0); ctx.lineTo(el.x + el.w - 50, ctx.canvas.height); ctx.lineTo(el.x - 50, ctx.canvas.height); ctx.fill(); }
      } else if (i === 1) { // Deep background
        ctx.fillStyle = '#001020';
        if (el.type === 'shadowRock') { ctx.beginPath(); ctx.arc(el.x + el.w / 2, el.y + el.h, el.w / 2, Math.PI, 0); ctx.fill(); }
        else if (el.type === 'ruinSilhouette') { ctx.fillRect(el.x, el.y, el.w, el.h); ctx.clearRect(el.x + 20, el.y + 20, 10, 20); }
      } else if (i === 2) { // Mid layer
        if (el.type === 'coral') { ctx.fillStyle = '#ff7f50'; ctx.beginPath(); ctx.moveTo(el.x, ctx.canvas.height); ctx.quadraticCurveTo(el.x, el.y, el.x + el.w / 2, el.y + 20); ctx.quadraticCurveTo(el.x + el.w, el.y, el.x + el.w, ctx.canvas.height); ctx.fill(); }
        else if (el.type === 'shipPart') { ctx.fillStyle = '#8b4513'; ctx.beginPath(); ctx.moveTo(el.x, ctx.canvas.height); ctx.lineTo(el.x + 20, el.y); ctx.lineTo(el.x + el.w, el.y + 20); ctx.lineTo(el.x + el.w - 10, ctx.canvas.height); ctx.fill(); }
        else if (el.type === 'pillar') { ctx.fillStyle = '#708090'; ctx.fillRect(el.x, el.y, el.w, el.h); ctx.fillStyle = '#2f4f4f'; ctx.fillRect(el.x + 5, el.y + 5, el.w - 10, 5); }
      } else if (i === 3) { // Foreground
        if (el.type === 'bubble') { el.y -= 2; ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.beginPath(); ctx.arc(el.x, el.y, el.w / 2, 0, Math.PI * 2); ctx.stroke(); }
        else if (el.type === 'fish') { el.x -= 2; ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.ellipse(el.x, el.y, el.w, el.h, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(el.x + el.w, el.y); ctx.lineTo(el.x + el.w + 10, el.y - 5); ctx.lineTo(el.x + el.w + 10, el.y + 5); ctx.fill(); }
        else if (el.type === 'seaweed') { ctx.strokeStyle = '#32cd32'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(el.x, ctx.canvas.height); ctx.quadraticCurveTo(el.x + Math.sin(frame * 0.1) * 10, ctx.canvas.height - el.h / 2, el.x, ctx.canvas.height - el.h); ctx.stroke(); }
      }
    }
  }
];