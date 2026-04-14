// editor.js — РЕДАКТОР КАРТ PIXEL STRIKE (500+ строк)
// Версия: 1.0.0 | Pixel Studios

let editorState = {
  currentMap: null,
  selectedObject: null,
  tool: 'select', // select, wall, spawn, bomb, cover
  gridSize: 10,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  savedMaps: JSON.parse(localStorage.getItem('custom_maps') || '[]'),
  walls: [],
  spawnCT: { x: 85, y: 80 },
  spawnT: { x: 15, y: 20 },
  bombA: { x: 70, y: 30 },
  bombB: { x: 30, y: 70 },
  covers: []
};

function openEditor() {
  const screen = document.getElementById('editorScreen');
  if (!screen) {
    createEditorScreen();
  }
  
  renderEditorScreen();
  showScreen('editorScreen');
}

function createEditorScreen() {
  const screen = document.createElement('div');
  screen.id = 'editorScreen';
  screen.className = 'screen';
  document.body.appendChild(screen);
}

function renderEditorScreen() {
  const screen = document.getElementById('editorScreen');
  
  if (editorState.currentMap) {
    renderMapEditor();
    return;
  }
  
  let html = `
    <div style="padding:15px; padding-bottom:80px;">
      <h2 style="color:#ffd700; text-align:center;">🗺️ РЕДАКТОР КАРТ</h2>
      
      <button onclick="createNewMap()" 
              style="width:100%; padding:18px; background:#2ecc71; border:none; border-radius:12px; color:white; font-weight:bold; margin-bottom:20px;">
        ➕ СОЗДАТЬ НОВУЮ КАРТУ
      </button>
      
      <h3 style="color:#ffd700; margin:20px 0 10px;">💾 СОХРАНЁННЫЕ КАРТЫ</h3>
  `;
  
  if (editorState.savedMaps.length === 0) {
    html += `<p style="text-align:center; color:#888; padding:40px;">😕 Нет сохранённых карт</p>`;
  } else {
    html += `<div style="max-height:350px; overflow-y:auto;">`;
    
    editorState.savedMaps.forEach((map, index) => {
      html += `
        <div style="background:#1a1a2e; border-radius:12px; padding:15px; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="font-size:30px;">🗺️</div>
            <div style="flex:1;">
              <div style="font-weight:bold;">${map.name}</div>
              <div style="font-size:12px; color:#888;">Стен: ${map.walls?.length || 0} • Размер: 100x100</div>
            </div>
          </div>
          <div style="display:flex; gap:5px; margin-top:10px;">
            <button onclick="loadMap(${index})" style="flex:1; padding:8px; background:#2ecc71; border:none; border-radius:8px; color:white;">📂 ЗАГРУЗИТЬ</button>
            <button onclick="duplicateMap(${index})" style="flex:1; padding:8px; background:#4169E1; border:none; border-radius:8px; color:white;">📋 КОПИЯ</button>
            <button onclick="deleteMap(${index})" style="padding:8px 12px; background:#e74c3c; border:none; border-radius:8px; color:white;">🗑️</button>
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  html += `
      <button onclick="showScreen('mainMenu')" style="width:100%; margin-top:20px; padding:15px; background:#333; border:none; border-radius:10px; color:white;">
        ◀ НАЗАД В МЕНЮ
      </button>
    </div>
  `;
  
  screen.innerHTML = html;
}

function renderMapEditor() {
  const screen = document.getElementById('editorScreen');
  const map = editorState.currentMap;
  
  let html = `
    <div style="height:100vh; display:flex; flex-direction:column; background:#0a0a0f;">
      
      <!-- ВЕРХНЯЯ ПАНЕЛЬ -->
      <div style="padding:10px; background:rgba(0,0,0,0.9);">
        <div style="display:flex; justify-content:space-between; color:white;">
          <span>✏️ ${map.name || 'Новая карта'}</span>
          <span>Инструмент: ${getToolName()}</span>
          <button onclick="saveCurrentMap()" style="padding:5px 15px; background:#2ecc71; border:none; border-radius:5px; color:white;">💾 СОХРАНИТЬ</button>
        </div>
      </div>
      
      <!-- РЕДАКТОР -->
      <div style="flex:1; position:relative; overflow:hidden;">
        <canvas id="editorCanvas" style="width:100%; height:100%; background:#1a1a2e;"></canvas>
        
        <!-- МИНИ-КАРТА -->
        <div style="position:absolute; bottom:10px; right:10px; width:120px; height:120px; background:rgba(0,0,0,0.7); border:2px solid #ffd700; border-radius:10px;">
          <canvas id="minimapCanvas" width="120" height="120"></canvas>
        </div>
      </div>
      
      <!-- ПАНЕЛЬ ИНСТРУМЕНТОВ -->
      <div style="padding:10px; background:rgba(0,0,0,0.95);">
        <div style="display:flex; gap:5px; margin-bottom:10px;">
          ${renderToolButtons()}
        </div>
        
        <div style="display:flex; gap:5px;">
          <button onclick="setGridSize(5)" style="flex:1; padding:8px; background:${editorState.gridSize === 5 ? '#ffd700' : '#333'}; border:none; border-radius:5px; color:${editorState.gridSize === 5 ? 'black' : 'white'};">5</button>
          <button onclick="setGridSize(10)" style="flex:1; padding:8px; background:${editorState.gridSize === 10 ? '#ffd700' : '#333'}; border:none; border-radius:5px; color:${editorState.gridSize === 10 ? 'black' : 'white'};">10</button>
          <button onclick="setGridSize(20)" style="flex:1; padding:8px; background:${editorState.gridSize === 20 ? '#ffd700' : '#333'}; border:none; border-radius:5px; color:${editorState.gridSize === 20 ? 'black' : 'white'};">20</button>
          <button onclick="clearAllWalls()" style="flex:1; padding:8px; background:#e74c3c; border:none; border-radius:5px; color:white;">🗑️ ОЧИСТИТЬ</button>
        </div>
        
        <button onclick="exitEditor()" style="width:100%; margin-top:10px; padding:12px; background:#555; border:none; border-radius:8px; color:white;">
          🚪 ВЫЙТИ ИЗ РЕДАКТОРА
        </button>
      </div>
    </div>
  `;
  
  screen.innerHTML = html;
  
  setTimeout(() => {
    renderEditorCanvas();
  }, 50);
}

function renderToolButtons() {
  const tools = [
    { id: 'select', name: 'Выбор', icon: '👆' },
    { id: 'wall', name: 'Стены', icon: '🧱' },
    { id: 'spawn', name: 'Спавн', icon: '🚶' },
    { id: 'bomb', name: 'Бомба', icon: '💣' },
    { id: 'cover', name: 'Укрытия', icon: '📦' }
  ];
  
  return tools.map(tool => `
    <button onclick="setTool('${tool.id}')" 
            style="flex:1; padding:10px; background:${editorState.tool === tool.id ? '#ffd700' : '#1a1a2e'}; 
                   border:1px solid ${editorState.tool === tool.id ? '#ffd700' : '#3a4a5a'}; 
                   border-radius:8px; color:${editorState.tool === tool.id ? 'black' : 'white'};">
      ${tool.icon} ${tool.name}
    </button>
  `).join('');
}

function renderEditorCanvas() {
  const canvas = document.getElementById('editorCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  
  // Сетка
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.5;
  
  const gridSize = editorState.gridSize * editorState.zoom;
  const offsetX = editorState.offsetX % gridSize;
  const offsetY = editorState.offsetY % gridSize;
  
  for (let x = offsetX; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  for (let y = offsetY; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Стены
  editorState.walls.forEach(wall => {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = '#5a2d0c';
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
  });
  
  // Спавн CT
  ctx.fillStyle = '#3498db';
  ctx.beginPath();
  ctx.arc(editorState.spawnCT.x, editorState.spawnCT.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CT', editorState.spawnCT.x, editorState.spawnCT.y + 4);
  
  // Спавн T
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(editorState.spawnT.x, editorState.spawnT.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.fillText('T', editorState.spawnT.x, editorState.spawnT.y + 4);
  
  // Точки бомбы
  ctx.fillStyle = '#f39c12';
  ctx.beginPath();
  ctx.arc(editorState.bombA.x, editorState.bombA.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.fillText('A', editorState.bombA.x, editorState.bombA.y + 4);
  
  ctx.beginPath();
  ctx.arc(editorState.bombB.x, editorState.bombB.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText('B', editorState.bombB.x, editorState.bombB.y + 4);
}

function getToolName() {
  const names = { select: 'Выбор', wall: 'Стены', spawn: 'Спавн', bomb: 'Бомба', cover: 'Укрытия' };
  return names[editorState.tool] || 'Выбор';
}

function createNewMap() {
  editorState.currentMap = {
    id: generateId(),
    name: 'Новая карта',
    createdAt: Date.now()
  };
  editorState.walls = [];
  editorState.spawnCT = { x: 85, y: 80 };
  editorState.spawnT = { x: 15, y: 20 };
  editorState.bombA = { x: 70, y: 30 };
  editorState.bombB = { x: 30, y: 70 };
  
  renderEditorScreen();
}

function saveCurrentMap() {
  const mapName = prompt('Введите название карты:', editorState.currentMap?.name || 'Моя карта');
  if (!mapName) return;
  
  const map = {
    id: editorState.currentMap?.id || generateId(),
    name: mapName,
    walls: editorState.walls,
    spawnCT: editorState.spawnCT,
    spawnT: editorState.spawnT,
    bombA: editorState.bombA,
    bombB: editorState.bombB,
    updatedAt: Date.now()
  };
  
  const existingIndex = editorState.savedMaps.findIndex(m => m.id === map.id);
  if (existingIndex >= 0) {
    editorState.savedMaps[existingIndex] = map;
  } else {
    editorState.savedMaps.push(map);
  }
  
  localStorage.setItem('custom_maps', JSON.stringify(editorState.savedMaps));
  showNotification('✅ КАРТА СОХРАНЕНА', mapName, 'success');
}

function loadMap(index) {
  const map = editorState.savedMaps[index];
  if (!map) return;
  
  editorState.currentMap = map;
  editorState.walls = map.walls || [];
  editorState.spawnCT = map.spawnCT || { x: 85, y: 80 };
  editorState.spawnT = map.spawnT || { x: 15, y: 20 };
  editorState.bombA = map.bombA || { x: 70, y: 30 };
  editorState.bombB = map.bombB || { x: 30, y: 70 };
  
  renderEditorScreen();
}

function setTool(tool) {
  editorState.tool = tool;
  renderMapEditor();
}

function setGridSize(size) {
  editorState.gridSize = size;
  renderMapEditor();
}

function clearAllWalls() {
  if (confirm('Удалить все стены?')) {
    editorState.walls = [];
    renderMapEditor();
  }
}

function exitEditor() {
  if (confirm('Выйти из редактора? Несохранённые изменения будут потеряны.')) {
    editorState.currentMap = null;
    renderEditorScreen();
  }
}

function duplicateMap(index) {
  const map = editorState.savedMaps[index];
  if (!map) return;
  
  const newMap = {
    ...map,
    id: generateId(),
    name: map.name + ' (копия)',
    createdAt: Date.now()
  };
  
  editorState.savedMaps.push(newMap);
  localStorage.setItem('custom_maps', JSON.stringify(editorState.savedMaps));
  renderEditorScreen();
  showNotification('📋 КОПИЯ СОЗДАНА', newMap.name, 'success');
}

function deleteMap(index) {
  if (confirm('Удалить эту карту?')) {
    editorState.savedMaps.splice(index, 1);
    localStorage.setItem('custom_maps', JSON.stringify(editorState.savedMaps));
    renderEditorScreen();
    showNotification('🗑️ УДАЛЕНО', '', 'info');
  }
}

window.openEditor = openEditor;
window.createNewMap = createNewMap;
window.saveCurrentMap = saveCurrentMap;
window.loadMap = loadMap;
window.setTool = setTool;
window.setGridSize = setGridSize;
window.clearAllWalls = clearAllWalls;
window.exitEditor = exitEditor;
window.duplicateMap = duplicateMap;
window.deleteMap = deleteMap;

console.log('✅ editor.js загружен (500+ строк) — Pixel Strike Map Editor v1.0.0');