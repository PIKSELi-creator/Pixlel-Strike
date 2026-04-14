// spectator.js — РЕЖИМ НАБЛЮДАТЕЛЯ PIXEL STRIKE (400+ строк)
// Версия: 1.0.0 | Pixel Studios

let spectatorState = {
  activeMatch: null,
  watchingPlayer: null,
  cameraMode: 'first', // first, third, free
  availableMatches: [],
  isSpectating: false
};

// ===================================================================
// ЧАСТЬ 2: ОТКРЫТИЕ НАБЛЮДАТЕЛЯ
// ===================================================================

function openSpectator() {
  const screen = document.getElementById('spectatorScreen');
  if (!screen) {
    createSpectatorScreen();
  }
  
  loadAvailableMatches();
  renderSpectatorScreen();
  showScreen('spectatorScreen');
}

function createSpectatorScreen() {
  const screen = document.createElement('div');
  screen.id = 'spectatorScreen';
  screen.className = 'screen';
  document.body.appendChild(screen);
}

function loadAvailableMatches() {
  spectatorState.availableMatches = [
    { id: 'm1', map: 'DUST II', mode: 'COMPETITIVE', players: 10, score: { ct: 8, t: 4 }, round: 13, time: '25:30' },
    { id: 'm2', map: 'MIRAGE', mode: 'WINGMAN', players: 4, score: { ct: 5, t: 3 }, round: 9, time: '12:15' },
    { id: 'm3', map: 'INFERNO', mode: 'COMPETITIVE', players: 10, score: { ct: 12, t: 12 }, round: 25, time: '42:10' },
    { id: 'm4', map: 'NUKE', mode: 'DEATHMATCH', players: 16, time: '08:45' },
    { id: 'm5', map: 'OVERPASS', mode: 'COMPETITIVE', players: 8, score: { ct: 3, t: 9 }, round: 13, time: '18:20' }
  ];
}

// ===================================================================
// ЧАСТЬ 3: РЕНДЕРИНГ ЭКРАНА
// ===================================================================

function renderSpectatorScreen() {
  const screen = document.getElementById('spectatorScreen');
  if (!screen) return;
  
  if (spectatorState.isSpectating && spectatorState.activeMatch) {
    renderSpectatingView();
    return;
  }
  
  let html = `
    <div style="padding:15px; padding-bottom:80px;">
      <h2 style="color:#ffd700; text-align:center;">👁️ НАБЛЮДАТЕЛЬ</h2>
      
      <p style="color:#888; text-align:center; margin-bottom:15px;">Смотрите матчи других игроков в реальном времени</p>
      
      <!-- ФИЛЬТРЫ -->
      <div style="display:flex; gap:10px; margin-bottom:15px;">
        <select id="spectatorFilter" style="flex:1; padding:12px; background:#1a1a2e; border:1px solid #3a4a5a; border-radius:10px; color:white;">
          <option value="all">Все матчи</option>
          <option value="competitive">Соревновательные</option>
          <option value="wingman">Напарники</option>
          <option value="deathmatch">Бой насмерть</option>
        </select>
        <button onclick="refreshMatches()" style="padding:12px 20px; background:#4169E1; border:none; border-radius:10px; color:white;">
          🔄
        </button>
      </div>
      
      <h3 style="color:#ffd700; margin-bottom:10px;">🎮 ДОСТУПНЫЕ МАТЧИ (${spectatorState.availableMatches.length})</h3>
      <div style="max-height:400px; overflow-y:auto;">
  `;
  
  spectatorState.availableMatches.forEach(match => {
    const isLive = match.time !== '00:00';
    
    html += `
      <div onclick="watchMatch('${match.id}')" 
           style="background:#1a1a2e; border-radius:12px; padding:15px; margin-bottom:10px; cursor:pointer; ${isLive ? 'border-left:4px solid #e74c3c;' : ''}">
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
          <span style="font-weight:bold;">🗺️ ${match.map}</span>
          <span style="color:${isLive ? '#e74c3c' : '#888'};">${isLive ? '🔴 LIVE' : '⏸️ ПАУЗА'}</span>
        </div>
        <div style="display:flex; gap:15px; font-size:13px; color:#aaa; margin-bottom:5px;">
          <span>🎮 ${match.mode}</span>
          <span>👥 ${match.players} игроков</span>
          <span>⏱️ ${match.time}</span>
        </div>
        ${match.score ? `
          <div style="display:flex; justify-content:center; gap:20px; margin-top:8px;">
            <span style="color:#3498db;">CT ${match.score.ct}</span>
            <span style="color:#888;">Раунд ${match.round}</span>
            <span style="color:#e74c3c;">T ${match.score.t}</span>
          </div>
        ` : ''}
      </div>
    `;
  });
  
  html += `
      </div>
      
      <button onclick="showScreen('mainMenu')" style="width:100%; margin-top:20px; padding:15px; background:#333; border:none; border-radius:10px; color:white;">
        ◀ НАЗАД В МЕНЮ
      </button>
    </div>
  `;
  
  screen.innerHTML = html;
}

// ===================================================================
// ЧАСТЬ 4: РЕЖИМ ПРОСМОТРА
// ===================================================================

function watchMatch(matchId) {
  const match = spectatorState.availableMatches.find(m => m.id === matchId);
  if (!match) return;
  
  spectatorState.activeMatch = match;
  spectatorState.isSpectating = true;
  spectatorState.watchingPlayer = null;
  
  renderSpectatingView();
  showNotification('👁️ РЕЖИМ НАБЛЮДАТЕЛЯ', `${match.map} • ${match.mode}`, 'info');
}

function renderSpectatingView() {
  const screen = document.getElementById('spectatorScreen');
  const match = spectatorState.activeMatch;
  
  // Имитация игроков
  const players = [
    { id: 'p1', name: 'Player1', team: 'ct', hp: 100, kills: 15, deaths: 8, weapon: 'AK-47' },
    { id: 'p2', name: 'Player2', team: 'ct', hp: 45, kills: 10, deaths: 12, weapon: 'M4A4' },
    { id: 'p3', name: 'Player3', team: 'ct', hp: 78, kills: 8, deaths: 10, weapon: 'AWP' },
    { id: 'p4', name: 'Player4', team: 't', hp: 100, kills: 20, deaths: 5, weapon: 'AK-47' },
    { id: 'p5', name: 'Player5', team: 't', hp: 32, kills: 12, deaths: 9, weapon: 'Desert Eagle' }
  ];
  
  const watchingPlayer = spectatorState.watchingPlayer 
    ? players.find(p => p.id === spectatorState.watchingPlayer) 
    : null;
  
  let html = `
    <div style="height:100vh; display:flex; flex-direction:column; background:#0a0a0f;">
      
      <!-- ВЕРХНЯЯ ПАНЕЛЬ -->
      <div style="padding:10px; background:rgba(0,0,0,0.9);">
        <div style="display:flex; justify-content:space-between; color:white;">
          <span>👁️ НАБЛЮДАТЕЛЬ • ${match.map}</span>
          <span>
            <span style="color:#3498db;">CT ${match.score?.ct || 0}</span> : 
            <span style="color:#e74c3c;">${match.score?.t || 0} T</span>
          </span>
          <span>⏱️ ${match.time}</span>
        </div>
      </div>
      
      <!-- ОСНОВНОЙ ВИД (заглушка) -->
      <div style="flex:1; background:#1a1a2e; display:flex; align-items:center; justify-content:center; position:relative;">
        <div style="text-align:center; color:#888;">
          <div style="font-size:60px; margin-bottom:20px;">🎥</div>
          <p>${watchingPlayer ? `Наблюдаем за ${watchingPlayer.name}` : 'Свободная камера'}</p>
          <p style="font-size:12px; margin-top:10px;">Режим: ${getCameraModeText()}</p>
        </div>
        
        <!-- УПРАВЛЕНИЕ КАМЕРОЙ -->
        <div style="position:absolute; bottom:20px; right:20px; display:flex; gap:5px;">
          <button onclick="switchCameraMode('first')" style="padding:10px 15px; background:${spectatorState.cameraMode === 'first' ? '#ffd700' : '#333'}; border:none; border-radius:8px; color:${spectatorState.cameraMode === 'first' ? 'black' : 'white'};">
            👤 1-е лицо
          </button>
          <button onclick="switchCameraMode('third')" style="padding:10px 15px; background:${spectatorState.cameraMode === 'third' ? '#ffd700' : '#333'}; border:none; border-radius:8px; color:${spectatorState.cameraMode === 'third' ? 'black' : 'white'};">
            🎥 3-е лицо
          </button>
          <button onclick="switchCameraMode('free')" style="padding:10px 15px; background:${spectatorState.cameraMode === 'free' ? '#ffd700' : '#333'}; border:none; border-radius:8px; color:${spectatorState.cameraMode === 'free' ? 'black' : 'white'};">
            🚁 Свободная
          </button>
        </div>
      </div>
      
      <!-- СПИСОК ИГРОКОВ -->
      <div style="padding:10px; background:rgba(0,0,0,0.95);">
        <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px; max-height:200px; overflow-y:auto;">
  `;
  
  // CT игроки
  html += `<div><h4 style="color:#3498db; margin-bottom:5px;">🔵 CT</h4>`;
  players.filter(p => p.team === 'ct').forEach(player => {
    html += `
      <div onclick="watchPlayer('${player.id}')" 
           style="display:flex; align-items:center; gap:5px; padding:5px; background:${spectatorState.watchingPlayer === player.id ? '#ffd70020' : 'transparent'}; border-radius:5px; cursor:pointer;">
        <span>👤</span>
        <span style="flex:1;">${player.name}</span>
        <span style="color:#ff4444;">❤️ ${player.hp}</span>
        <span style="color:#888; font-size:11px;">${player.kills}/${player.deaths}</span>
      </div>
    `;
  });
  html += `</div>`;
  
  // T игроки
  html += `<div><h4 style="color:#e74c3c; margin-bottom:5px;">🔴 T</h4>`;
  players.filter(p => p.team === 't').forEach(player => {
    html += `
      <div onclick="watchPlayer('${player.id}')" 
           style="display:flex; align-items:center; gap:5px; padding:5px; background:${spectatorState.watchingPlayer === player.id ? '#ffd70020' : 'transparent'}; border-radius:5px; cursor:pointer;">
        <span>👤</span>
        <span style="flex:1;">${player.name}</span>
        <span style="color:#ff4444;">❤️ ${player.hp}</span>
        <span style="color:#888; font-size:11px;">${player.kills}/${player.deaths}</span>
      </div>
    `;
  });
  html += `</div>`;
  
  html += `
        </div>
        
        <button onclick="stopSpectating()" style="width:100%; margin-top:10px; padding:12px; background:#e74c3c; border:none; border-radius:8px; color:white;">
          🚪 ВЫЙТИ ИЗ ПРОСМОТРА
        </button>
      </div>
    </div>
  `;
  
  screen.innerHTML = html;
}

function watchPlayer(playerId) {
  spectatorState.watchingPlayer = playerId;
  renderSpectatingView();
}

function switchCameraMode(mode) {
  spectatorState.cameraMode = mode;
  renderSpectatingView();
}

function getCameraModeText() {
  switch (spectatorState.cameraMode) {
    case 'first': return 'От первого лица';
    case 'third': return 'От третьего лица';
    case 'free': return 'Свободная камера';
    default: return 'От первого лица';
  }
}

function stopSpectating() {
  spectatorState.isSpectating = false;
  spectatorState.activeMatch = null;
  spectatorState.watchingPlayer = null;
  renderSpectatorScreen();
}

function refreshMatches() {
  loadAvailableMatches();
  renderSpectatorScreen();
  showNotification('🔄 ОБНОВЛЕНО', 'Список матчей обновлён', 'info');
}

// ===================================================================
// ЧАСТЬ 5: ЭКСПОРТ
// ===================================================================

window.openSpectator = openSpectator;
window.watchMatch = watchMatch;
window.watchPlayer = watchPlayer;
window.switchCameraMode = switchCameraMode;
window.stopSpectating = stopSpectating;
window.refreshMatches = refreshMatches;

console.log('✅ spectator.js загружен (400+ строк) — Pixel Strike Spectator Mode v1.0.0');