// game.js — PIXEL STRIKE ИГРОВОЙ ДВИЖОК (700+ строк)
// Версия: 2.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И СОСТОЯНИЕ ИГРЫ
// ===================================================================

let currentMatch = null;
let gameInterval = null;
let enemySpawnInterval = null;
let renderLoopId = null;

// Игрок
let player = {
  x: 85, y: 80, angle: Math.PI,
  hp: 100, maxHp: 100, armor: 100, maxArmor: 100,
  ammo: 30, maxAmmo: 90,
  weapon: 'glock18',
  weaponData: null,
  money: 800,
  kills: 0,
  deaths: 0,
  isReloading: false,
  reloadTimer: 0,
  shootCooldown: 0,
  team: 'ct'
};

// Состояние игры
let gameState = {
  round: 1,
  maxRounds: 30,
  score: { t: 0, ct: 0 },
  bombPlanted: false,
  bombSite: null,
  bombTimer: null,
  phase: 'buy', // buy, action, end
  timer: 15,
  freezeTime: 0
};

// Враги (боты)
let enemies = [];
const MAX_ENEMIES = 5;

// Стены карты
let walls = [];

// Точки карты
let bombSites = { A: { x: 70, y: 30 }, B: { x: 30, y: 70 } };
let spawnCT = { x: 85, y: 80 };
let spawnT = { x: 15, y: 20 };

// Оружие (из config.js)
let WEAPONS = {};

// Эффекты
let shootFlash = 0;
let hitMarker = 0;
let killFeed = [];

// ===================================================================
// ЧАСТЬ 2: ИНИЦИАЛИЗАЦИЯ КАРТЫ
// ===================================================================

function initMap(mapId = 'dust2') {
  walls = [
    // Границы карты
    { x1: 0, y1: 0, x2: 100, y2: 0 },
    { x1: 100, y1: 0, x2: 100, y2: 100 },
    { x1: 100, y1: 100, x2: 0, y2: 100 },
    { x1: 0, y1: 100, x2: 0, y2: 0 },
    
    // Центральная стена (MID)
    { x1: 45, y1: 20, x2: 55, y2: 20 },
    { x1: 55, y1: 20, x2: 55, y2: 80 },
    { x1: 45, y1: 80, x2: 55, y2: 80 },
    { x1: 45, y1: 20, x2: 45, y2: 80 },
    
    // Ящики на A
    { x1: 60, y1: 25, x2: 75, y2: 25 },
    { x1: 75, y1: 25, x2: 75, y2: 40 },
    { x1: 60, y1: 40, x2: 75, y2: 40 },
    { x1: 60, y1: 25, x2: 60, y2: 40 },
    
    // Ящики на B
    { x1: 25, y1: 60, x2: 40, y2: 60 },
    { x1: 40, y1: 60, x2: 40, y2: 75 },
    { x1: 25, y1: 75, x2: 40, y2: 75 },
    { x1: 25, y1: 60, x2: 25, y2: 75 },
    
    // Укрытие Long A
    { x1: 80, y1: 45, x2: 90, y2: 45 },
    { x1: 90, y1: 45, x2: 90, y2: 55 },
    { x1: 80, y1: 55, x2: 90, y2: 55 },
    { x1: 80, y1: 45, x2: 80, y2: 55 },
    
    // Укрытие B Tunnels
    { x1: 10, y1: 65, x2: 20, y2: 65 },
    { x1: 20, y1: 65, x2: 20, y2: 75 },
    { x1: 10, y1: 75, x2: 20, y2: 75 },
    { x1: 10, y1: 65, x2: 10, y2: 75 }
  ];
}

// ===================================================================
// ЧАСТЬ 3: ЗАПУСК МАТЧА
// ===================================================================

function startMatch(map, mode) {
  currentMatch = { map, mode };
  initMap(map?.id || 'dust2');
  
  // Загружаем оружие из глобальной переменной
  if (typeof window.WEAPONS !== 'undefined') {
    WEAPONS = window.WEAPONS;
  }
  
  // Сбрасываем состояние игрока
  player = {
    x: spawnCT.x, y: spawnCT.y, angle: Math.PI,
    hp: 100, maxHp: 100, armor: 100, maxArmor: 100,
    ammo: 12, maxAmmo: 60,
    weapon: 'glock18',
    weaponData: WEAPONS?.pistols?.glock18 || null,
    money: 800,
    kills: 0, deaths: 0,
    isReloading: false, reloadTimer: 0, shootCooldown: 0,
    team: 'ct'
  };
  
  // Сбрасываем состояние игры
  gameState = {
    round: 1,
    maxRounds: mode?.rounds || 30,
    score: { t: 0, ct: 0 },
    bombPlanted: false,
    bombSite: null,
    bombTimer: null,
    phase: 'buy',
    timer: 15,
    freezeTime: 0
  };
  
  enemies = [];
  killFeed = [];
  
  renderGameScreen(map, mode);
  showScreen('gameScreen');
  
  startEnemySpawn();
  startRoundTimer();
  startRenderLoop();
  
  if (typeof playSound === 'function') playSound('win');
  if (typeof showNotification === 'function') {
    showNotification('🎮 МАТЧ НАЧАЛСЯ!', `${map?.name || 'DUST II'} • ${mode?.name || 'COMPETITIVE'}`, 'success');
  }
}

// ===================================================================
// ЧАСТЬ 4: ОТРИСОВКА ЭКРАНА ИГРЫ
// ===================================================================

function renderGameScreen(map, mode) {
  const screen = document.getElementById('gameScreen');
  const weaponInfo = player.weaponData || { name: 'Glock-18', damage: 22, magazine: 12 };
  
  screen.innerHTML = `
    <div style="height:100vh; display:flex; flex-direction:column; background:${map?.background || '#1a1a2e'}; position:relative;">
      
      <!-- ВЕРХНЯЯ ПАНЕЛЬ -->
      <div style="padding:8px; background:rgba(0,0,0,0.9);">
        <div style="display:flex; justify-content:space-between; color:white;">
          <span>${map?.icon || '🏜️'} ${map?.name || 'DUST II'}</span>
          <span style="font-weight:bold;">
            <span style="color:#e74c3c;">T ${gameState.score.t}</span> : 
            <span style="color:#3498db;">${gameState.score.ct} CT</span>
          </span>
          <span id="roundDisplay">Р${gameState.round}/${gameState.maxRounds}</span>
        </div>
        <div style="display:flex; justify-content:center; margin-top:5px;">
          <span id="roundTimer" style="color:#ffd700; font-size:18px; font-weight:bold;">${formatTime(gameState.timer)}</span>
          <span id="gamePhase" style="color:#aaa; margin-left:10px;">${getPhaseText()}</span>
        </div>
      </div>
      
      <!-- КАРТА (CANVAS) -->
      <div style="flex:1; position:relative; background:#1a1a2e;">
        <canvas id="gameCanvas" style="width:100%; height:100%; display:block;"></canvas>
        
        <!-- ПРИЦЕЛ -->
        <div id="crosshair" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none; z-index:100;">
          ${getCrosshairHTML()}
        </div>
        
        <!-- ХИТМАРКЕР -->
        <div id="hitmarker" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none; z-index:101; opacity:0;">
          <div style="width:20px; height:20px; border:2px solid white; border-radius:0;"></div>
        </div>
        
        <!-- KILL FEED -->
        <div id="killFeed" style="position:absolute; top:60px; right:10px; z-index:50; text-align:right;"></div>
      </div>
      
      <!-- НИЖНЯЯ ПАНЕЛЬ -->
      <div style="padding:10px; background:rgba(0,0,0,0.95);">
        
        <!-- HP И БРОНЯ -->
        <div style="display:flex; gap:10px; margin-bottom:8px;">
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; color:#ff4444;">
              <span>❤️ HP</span><span id="hpValue">${player.hp}</span>
            </div>
            <div style="height:6px; background:#333; border-radius:3px;">
              <div id="hpBar" style="width:${player.hp}%; height:100%; background:#ff4444;"></div>
            </div>
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; color:#4488ff;">
              <span>🛡️ БРОНЯ</span><span id="armorValue">${player.armor}</span>
            </div>
            <div style="height:6px; background:#333; border-radius:3px;">
              <div id="armorBar" style="width:${player.armor}%; height:100%; background:#4488ff;"></div>
            </div>
          </div>
        </div>
        
        <!-- ОРУЖИЕ И ДЕНЬГИ -->
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <span>
            <span style="color:#ffd700;">🔫 ${weaponInfo.name}</span>
            <span style="color:#aaa;" id="ammoDisplay">${player.ammo}/${player.maxAmmo}</span>
            ${player.isReloading ? '<span style="color:#f39c12;"> 🔄</span>' : ''}
          </span>
          <span style="color:#2ecc71;">💰 $<span id="moneyDisplay">${player.money}</span></span>
          <span style="color:#e74c3c;">💀 <span id="killsDisplay">${player.kills}</span></span>
        </div>
        
        <!-- КНОПКИ УПРАВЛЕНИЯ -->
        <div style="display:flex; gap:5px; margin-bottom:5px;">
          <button id="btnForward" style="flex:1; padding:12px; background:#2c3e50; border:none; border-radius:8px; color:white; font-size:20px;">⬆️</button>
          <button id="btnShoot" style="flex:1; padding:12px; background:#e74c3c; border:none; border-radius:8px; color:white; font-size:20px;">🔫</button>
          <button id="btnReload" style="flex:1; padding:12px; background:#3498db; border:none; border-radius:8px; color:white; font-size:16px;">🔄</button>
        </div>
        <div style="display:flex; gap:5px; margin-bottom:5px;">
          <button id="btnLeft" style="flex:1; padding:12px; background:#2c3e50; border:none; border-radius:8px; color:white; font-size:20px;">⬅️</button>
          <button id="btnBackward" style="flex:1; padding:12px; background:#2c3e50; border:none; border-radius:8px; color:white; font-size:20px;">⬇️</button>
          <button id="btnRight" style="flex:1; padding:12px; background:#2c3e50; border:none; border-radius:8px; color:white; font-size:20px;">➡️</button>
        </div>
        <div style="display:flex; gap:5px;">
          <button id="btnPlant" style="flex:1; padding:10px; background:#8e44ad; border:none; border-radius:6px; color:white;">💣 ЗАЛОЖИТЬ</button>
          <button id="btnBuy" style="flex:1; padding:10px; background:#2ecc71; border:none; border-radius:6px; color:white;">🛒 ЗАКУП</button>
          <button id="btnExit" style="flex:1; padding:10px; background:#555; border:none; border-radius:6px; color:#aaa;">↩ СДАТЬСЯ</button>
        </div>
      </div>
    </div>
  `;
  
  bindGameButtons();
}

function getPhaseText() {
  switch(gameState.phase) {
    case 'buy': return '🛒 ЗАКУПКА';
    case 'action': return '⚔️ БОЙ';
    case 'end': return '⏳ КОНЕЦ РАУНДА';
    default: return '';
  }
}

function getCrosshairHTML() {
  const settings = JSON.parse(localStorage.getItem('pixel_settings') || '{"crosshair":"default"}');
  switch(settings.crosshair) {
    case 'dot': return '<div style="width:6px;height:6px;background:#00ff00;border-radius:50%;"></div>';
    case 'cross': return '<div style="position:relative;"><div style="position:absolute;width:20px;height:2px;background:#00ff00;top:-1px;left:-10px;"></div><div style="position:absolute;width:2px;height:20px;background:#00ff00;left:-1px;top:-10px;"></div></div>';
    case 'circle': return '<div style="width:20px;height:20px;border:2px solid #00ff00;border-radius:50%;"></div>';
    default: return '<div style="position:relative;"><div style="position:absolute;width:15px;height:2px;background:#00ff00;top:-1px;left:-7px;"></div><div style="position:absolute;width:2px;height:15px;background:#00ff00;left:-1px;top:-7px;"></div></div>';
  }
}

// ===================================================================
// ЧАСТЬ 5: ПРИВЯЗКА КНОПОК
// ===================================================================

function bindGameButtons() {
  const bind = (id, event, handler) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); handler(e); });
    btn.addEventListener('mousedown', (e) => { e.preventDefault(); handler(e); });
  };
  
  bind('btnForward', 'touchstart', () => startMove('forward'));
  bind('btnForward', 'touchend', stopMove);
  bind('btnBackward', 'touchstart', () => startMove('backward'));
  bind('btnBackward', 'touchend', stopMove);
  bind('btnLeft', 'touchstart', () => startMove('left'));
  bind('btnLeft', 'touchend', stopMove);
  bind('btnRight', 'touchstart', () => startMove('right'));
  bind('btnRight', 'touchend', stopMove);
  
  const btnShoot = document.getElementById('btnShoot');
  if (btnShoot) btnShoot.addEventListener('click', () => shoot());
  
  const btnReload = document.getElementById('btnReload');
  if (btnReload) btnReload.addEventListener('click', () => reloadWeapon());
  
  const btnPlant = document.getElementById('btnPlant');
  if (btnPlant) btnPlant.addEventListener('click', () => plantBomb());
  
  const btnBuy = document.getElementById('btnBuy');
  if (btnBuy) btnBuy.addEventListener('click', () => openBuyMenu());
  
  const btnExit = document.getElementById('btnExit');
  if (btnExit) btnExit.addEventListener('click', () => endMatch());
}

// ===================================================================
// ЧАСТЬ 6: ДВИЖЕНИЕ
// ===================================================================

let moveDirection = null;
let moveInterval = null;

function startMove(dir) {
  moveDirection = dir;
  if (moveInterval) clearInterval(moveInterval);
  
  moveInterval = setInterval(() => {
    if (gameState.phase !== 'action' || player.hp <= 0) return;
    
    const speed = 2.5;
    let newX = player.x;
    let newY = player.y;
    
    switch(moveDirection) {
      case 'forward':
        newX += Math.cos(player.angle) * speed;
        newY += Math.sin(player.angle) * speed;
        break;
      case 'backward':
        newX -= Math.cos(player.angle) * speed * 0.7;
        newY -= Math.sin(player.angle) * speed * 0.7;
        break;
      case 'left':
        player.angle -= 0.12;
        break;
      case 'right':
        player.angle += 0.12;
        break;
    }
    
    if (!checkWallCollision(newX, newY)) {
      player.x = Math.max(5, Math.min(95, newX));
      player.y = Math.max(5, Math.min(95, newY));
    }
    
    checkBombSiteProximity();
    
  }, 30);
}

function stopMove() {
  moveDirection = null;
  if (moveInterval) {
    clearInterval(moveInterval);
    moveInterval = null;
  }
}

function checkWallCollision(x, y) {
  const r = 4;
  for (const wall of walls) {
    const minX = Math.min(wall.x1, wall.x2) - r;
    const maxX = Math.max(wall.x1, wall.x2) + r;
    const minY = Math.min(wall.y1, wall.y2) - r;
    const maxY = Math.max(wall.y1, wall.y2) + r;
    if (x > minX && x < maxX && y > minY && y < maxY) return true;
  }
  return false;
}

// ===================================================================
// ЧАСТЬ 7: СТРЕЛЬБА И БОЕВАЯ СИСТЕМА
// ===================================================================

function shoot() {
  if (gameState.phase !== 'action') {
    showNotification('❌ СЕЙЧАС НЕЛЬЗЯ СТРЕЛЯТЬ!', '', 'warning');
    return;
  }
  
  if (player.hp <= 0) return;
  if (player.isReloading) return;
  if (player.shootCooldown > 0) return;
  
  if (player.ammo <= 0) {
    showNotification('❌ НЕТ ПАТРОНОВ!', 'Нажмите ПЕРЕЗАРЯДКА', 'error');
    if (typeof playSound === 'function') playSound('error');
    return;
  }
  
  const weapon = player.weaponData || { damage: 22, fireRate: 0.1 };
  
  player.ammo--;
  player.shootCooldown = weapon.fireRate || 0.1;
  
  updateAmmoDisplay();
  
  // Эффект выстрела
  shootFlash = 5;
  
  // Звук и вибрация
  if (typeof playSound === 'function') playSound('shoot');
  if (typeof vibrate === 'function') vibrate(20);
  
  // Проверка попадания
  checkHit();
  
  // Отдача
  player.angle += (Math.random() - 0.5) * 0.03;
}

function checkHit() {
  const weapon = player.weaponData || { damage: 22, headshotMultiplier: 3.5 };
  const range = 40;
  
  let hit = false;
  let headshot = false;
  
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    if (distance < range) {
      const enemyAngle = Math.atan2(dy, dx);
      let angleDiff = Math.abs(enemyAngle - player.angle);
      while (angleDiff > Math.PI) angleDiff -= 2*Math.PI;
      
      if (angleDiff < 0.25) {
        headshot = Math.random() < 0.15;
        const damage = headshot ? weapon.damage * weapon.headshotMultiplier : weapon.damage;
        
        // Учёт брони
        let finalDamage = damage;
        if (enemy.armor > 0) {
          finalDamage *= 0.5;
          enemy.armor = Math.max(0, enemy.armor - damage * 0.5);
        }
        
        enemy.hp -= finalDamage;
        hit = true;
        
        // Хитмаркер
        showHitMarker(headshot);
        
        // Урон по броне
        if (enemy.armor <= 0) enemy.armor = 0;
        
        if (enemy.hp <= 0) {
          killEnemy(i, headshot);
        }
        
        break;
      }
    }
  }
  
  if (!hit) {
    if (typeof showNotification === 'function') {
      showNotification('❌ МИМО!', '', 'warning');
    }
  }
}

function showHitMarker(headshot) {
  hitMarker = 10;
  const marker = document.getElementById('hitmarker');
  if (marker) {
    marker.style.opacity = '1';
    marker.innerHTML = headshot ? 
      '<div style="width:25px;height:25px;border:3px solid #ff0000;border-radius:0;"></div>' :
      '<div style="width:20px;height:20px;border:2px solid white;border-radius:0;"></div>';
    setTimeout(() => { if (marker) marker.style.opacity = '0'; }, 100);
  }
}

function killEnemy(index, headshot) {
  const enemy = enemies[index];
  player.kills++;
  player.money += headshot ? 400 : 300;
  
  // Добавляем в киллфид
  addKillFeed(`🔥 ВЫ ${headshot ? '🎯' : '🔫'} ${enemy.name || 'ВРАГ'}`);
  
  enemies.splice(index, 1);
  
  updateUI();
  
  if (typeof showNotification === 'function') {
    showNotification(headshot ? '🎯 ХЭДШОТ!' : '💀 ВРАГ УБИТ!', `+$${headshot ? 400 : 300}`, 'success');
  }
  
  if (typeof playSound === 'function') playSound(headshot ? 'headshot' : 'kill');
  
  // Шанс дропа патронов
  if (Math.random() < 0.3) {
    player.maxAmmo += 30;
    showNotification('🔫 +30 ПАТРОНОВ', '', 'info');
  }
}

// ===================================================================
// ЧАСТЬ 8: ПЕРЕЗАРЯДКА
// ===================================================================

function reloadWeapon() {
  if (player.isReloading) return;
  if (player.ammo >= (player.weaponData?.magazine || 12)) return;
  if (player.maxAmmo <= 0) {
    showNotification('❌ НЕТ ЗАПАСНЫХ ПАТРОНОВ!', '', 'error');
    return;
  }
  
  const weapon = player.weaponData || { magazine: 12, reloadTime: 2.0 };
  
  player.isReloading = true;
  player.reloadTimer = weapon.reloadTime;
  
  showNotification('🔄 ПЕРЕЗАРЯДКА...', '', 'info');
  
  const interval = setInterval(() => {
    player.reloadTimer -= 0.1;
    if (player.reloadTimer <= 0) {
      const needed = weapon.magazine - player.ammo;
      const reloadAmount = Math.min(needed, player.maxAmmo);
      player.ammo += reloadAmount;
      player.maxAmmo -= reloadAmount;
      player.isReloading = false;
      
      updateAmmoDisplay();
      showNotification('✅ ГОТОВО!', '', 'success');
      
      clearInterval(interval);
    }
  }, 100);
}

// ===================================================================
// ЧАСТЬ 9: ВРАГИ (БОТЫ)
// ===================================================================

function startEnemySpawn() {
  enemySpawnInterval = setInterval(() => {
    if (gameState.phase !== 'action') return;
    if (enemies.length >= MAX_ENEMIES) return;
    
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const x = side === 'left' ? spawnT.x + (Math.random() - 0.5) * 15 : 50 + Math.random() * 30;
    const y = side === 'left' ? spawnT.y + (Math.random() - 0.5) * 15 : 50 + Math.random() * 30;
    
    enemies.push({
      x, y,
      hp: 100,
      maxHp: 100,
      armor: Math.random() > 0.5 ? 100 : 0,
      name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
      weapon: 'ak47'
    });
  }, 5000);
}

const BOT_NAMES = ['Террорист', 'Бандит', 'Диверсант', 'Наёмник', 'Головорез'];

// ===================================================================
// ЧАСТЬ 10: БОМБА
// ===================================================================

function checkBombSiteProximity() {
  const dA = Math.sqrt((player.x - bombSites.A.x)**2 + (player.y - bombSites.A.y)**2);
  const dB = Math.sqrt((player.x - bombSites.B.x)**2 + (player.y - bombSites.B.y)**2);
  
  const btn = document.getElementById('btnPlant');
  if (!btn) return;
  
  if (player.team !== 't') {
    btn.style.background = '#555';
    btn.textContent = '💣 ТОЛЬКО Т';
    return;
  }
  
  if (dA < 15) {
    btn.style.background = '#27ae60';
    btn.textContent = '💣 ЗАЛОЖИТЬ A';
  } else if (dB < 15) {
    btn.style.background = '#27ae60';
    btn.textContent = '💣 ЗАЛОЖИТЬ B';
  } else {
    btn.style.background = '#8e44ad';
    btn.textContent = '💣 ЗАЛОЖИТЬ';
  }
}

function plantBomb() {
  if (player.team !== 't') {
    showNotification('❌ ТОЛЬКО ТЕРРОРИСТЫ!', '', 'error');
    return;
  }
  
  const dA = Math.sqrt((player.x - bombSites.A.x)**2 + (player.y - bombSites.A.y)**2);
  const dB = Math.sqrt((player.x - bombSites.B.x)**2 + (player.y - bombSites.B.y)**2);
  
  let site = null;
  if (dA < 15) site = 'A';
  else if (dB < 15) site = 'B';
  
  if (!site) {
    showNotification('❌ СЛИШКОМ ДАЛЕКО!', '', 'error');
    return;
  }
  
  if (gameState.bombPlanted) {
    showNotification('❌ УЖЕ ЗАЛОЖЕНА!', '', 'error');
    return;
  }
  
  gameState.bombPlanted = true;
  gameState.bombSite = site;
  
  showNotification(`💣 БОМБА ЗАЛОЖЕНА НА ${site}!`, '40 секунд до взрыва!', 'warning');
  addKillFeed(`💣 БОМБА ЗАЛОЖЕНА НА ${site}`);
  
  let time = 40;
  gameState.bombTimer = setInterval(() => {
    time--;
    if (time <= 0) {
      clearInterval(gameState.bombTimer);
      winRound('bomb');
    }
  }, 1000);
}

// ===================================================================
// ЧАСТЬ 11: МЕНЮ ЗАКУПКИ
// ===================================================================

function openBuyMenu() {
  if (gameState.phase !== 'buy') {
    showNotification('❌ СЕЙЧАС НЕЛЬЗЯ ПОКУПАТЬ!', '', 'error');
    return;
  }
  
  const modal = document.getElementById('caseOpeningModal');
  const overlay = document.getElementById('modalOverlay');
  
  let html = `
    <div style="text-align:center;">
      <h3 style="color:#ffd700;">🛒 ЗАКУПКА ($${player.money})</h3>
      <div style="max-height:400px; overflow-y:auto; margin:15px 0;">
  `;
  
  // Пистолеты
  html += '<h4 style="color:#ffd700;">🔫 ПИСТОЛЕТЫ</h4>';
  for (const [id, w] of Object.entries(WEAPONS?.pistols || {})) {
    html += createBuyButton(id, w);
  }
  
  // SMG
  html += '<h4 style="color:#ffd700;">🔫 ПП</h4>';
  for (const [id, w] of Object.entries(WEAPONS?.smg || {})) {
    html += createBuyButton(id, w);
  }
  
  // Винтовки
  html += '<h4 style="color:#ffd700;">🔫 ВИНТОВКИ</h4>';
  for (const [id, w] of Object.entries(WEAPONS?.rifles || {})) {
    html += createBuyButton(id, w);
  }
  
  html += `
      </div>
      <button onclick="closeModal()" style="width:100%; padding:12px; background:#333; border:none; border-radius:10px; color:white;">ЗАКРЫТЬ</button>
    </div>
  `;
  
  modal.innerHTML = html;
  overlay.style.display = 'block';
  modal.style.display = 'block';
}

function createBuyButton(id, weapon) {
  const canBuy = player.money >= (weapon.price || 0);
  return `
    <button onclick="buyWeapon('${id}')" ${!canBuy ? 'disabled' : ''}
            style="width:100%; padding:10px; margin:5px 0; background:${canBuy ? '#2ecc71' : '#555'}; 
                   border:none; border-radius:8px; color:white; text-align:left;">
      <span>${weapon.image || '🔫'} ${weapon.name}</span>
      <span style="float:right;">$${weapon.price || 0}</span>
    </button>
  `;
}

function buyWeapon(weaponId) {
  const weapon = getWeapon(weaponId);
  if (!weapon) return;
  
  if (player.money < weapon.price) {
    showNotification('❌ НЕДОСТАТОЧНО ДЕНЕГ!', '', 'error');
    return;
  }
  
  player.money -= weapon.price;
  player.weapon = weaponId;
  player.weaponData = weapon;
  player.ammo = weapon.magazine;
  player.maxAmmo = weapon.magazine * 3;
  
  updateUI();
  closeModal();
  
  showNotification('✅ КУПЛЕНО', weapon.name, 'success');
  if (typeof playSound === 'function') playSound('buy');
}

// ===================================================================
// ЧАСТЬ 12: ТАЙМЕРЫ И РАУНДЫ
// ===================================================================

function startRoundTimer() {
  gameInterval = setInterval(() => {
    if (gameState.timer > 0) {
      gameState.timer--;
    }
    
    updateTimerDisplay();
    
    // Смена фаз
    if (gameState.phase === 'buy' && gameState.timer <= 0) {
      gameState.phase = 'action';
      gameState.timer = 115;
      showNotification('⚔️ БОЙ НАЧАЛСЯ!', '', 'info');
    }
    
    if (gameState.phase === 'action' && gameState.timer <= 0) {
      loseRound('time');
    }
    
  }, 1000);
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('roundTimer');
  const phaseEl = document.getElementById('gamePhase');
  if (timerEl) timerEl.textContent = formatTime(gameState.timer);
  if (phaseEl) phaseEl.textContent = getPhaseText();
}

function winRound(reason) {
  clearInterval(gameInterval);
  clearInterval(enemySpawnInterval);
  if (gameState.bombTimer) clearInterval(gameState.bombTimer);
  
  gameState.score.ct++;
  player.money += 3250;
  
  showRoundResult(true, reason);
}

function loseRound(reason) {
  clearInterval(gameInterval);
  clearInterval(enemySpawnInterval);
  if (gameState.bombTimer) clearInterval(gameState.bombTimer);
  
  gameState.score.t++;
  player.money += 1400;
  player.deaths++;
  
  showRoundResult(false, reason);
}

function showRoundResult(won, reason) {
  const reward = won ? 2000 : 500;
  if (typeof gameResources !== 'undefined') {
    gameResources.pixels = (gameResources.pixels || 0) + reward;
    if (typeof saveResources === 'function') saveResources();
  }
  
  const modal = document.getElementById('caseOpeningModal');
  const overlay = document.getElementById('modalOverlay');
  
  modal.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:70px;">${won ? '🏆' : '💀'}</div>
      <h2 style="color:${won ? '#2ecc71' : '#e74c3c'};">${won ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}</h2>
      <p style="color:#ffd700; font-size:24px;">+${reward} PIX</p>
      <p>${gameState.score.ct} : ${gameState.score.t}</p>
      <button onclick="nextRound()" style="padding:15px 40px; background:${won ? '#2ecc71' : '#e74c3c'}; border:none; border-radius:10px; color:white; font-weight:bold; margin-top:20px;">
        ${gameState.round >= gameState.maxRounds ? 'ЗАВЕРШИТЬ' : 'СЛЕДУЮЩИЙ РАУНД ➔'}
      </button>
    </div>
  `;
  
  overlay.style.display = 'block';
  modal.style.display = 'block';
  
  if (won) {
    if (typeof victoryEffect === 'function') victoryEffect();
  } else {
    if (typeof defeatEffect === 'function') defeatEffect();
  }
}

function nextRound() {
  closeModal();
  
  if (gameState.round >= gameState.maxRounds || gameState.score.ct >= 16 || gameState.score.t >= 16) {
    endMatch();
    return;
  }
  
  gameState.round++;
  gameState.phase = 'buy';
  gameState.timer = 15;
  gameState.bombPlanted = false;
  
  player.hp = 100;
  player.armor = 100;
  player.x = spawnCT.x;
  player.y = spawnCT.y;
  
  enemies = [];
  
  renderGameScreen(currentMatch?.map, currentMatch?.mode);
  startEnemySpawn();
  startRoundTimer();
}

// ===================================================================
// ЧАСТЬ 13: ЗАВЕРШЕНИЕ МАТЧА
// ===================================================================

function endMatch() {
  clearInterval(gameInterval);
  clearInterval(enemySpawnInterval);
  if (gameState.bombTimer) clearInterval(gameState.bombTimer);
  
  showScreen('mainMenu');
  showNotification('📊 МАТЧ ЗАВЕРШЁН', `${player.kills} убийств • ${player.deaths} смертей`, 'info');
}

// ===================================================================
// ЧАСТЬ 14: 3D РЕНДЕРИНГ
// ===================================================================

function startRenderLoop() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  function render() {
    canvas.width = canvas.clientWidth || 400;
    canvas.height = canvas.clientHeight || 600;
    
    const w = canvas.width;
    const h = canvas.height;
    const horizon = h * 0.5;
    
    // Небо и пол
    ctx.fillStyle = '#1a1a3e';
    ctx.fillRect(0, 0, w, horizon);
    ctx.fillStyle = '#2a2a1e';
    ctx.fillRect(0, horizon, w, h - horizon);
    
    // Отрисовка стен (псевдо-3D)
    const fov = Math.PI / 3;
    const numRays = Math.min(120, Math.floor(w / 3));
    
    for (let i = 0; i < numRays; i++) {
      const rayAngle = player.angle - fov/2 + (i / numRays) * fov;
      const distance = castRay(player.x, player.y, rayAngle);
      
      if (distance < 100) {
        const wallHeight = Math.min(h * 0.7, (h * 0.4) / (distance * 0.05 + 0.1));
        const wallTop = horizon - wallHeight / 2;
        const brightness = Math.max(0.3, 1 - distance / 120);
        
        ctx.fillStyle = `rgb(${100 * brightness}, ${70 * brightness}, ${50 * brightness})`;
        ctx.fillRect(i * (w / numRays), wallTop, (w / numRays) + 1, wallHeight);
      }
    }
    
    // Отрисовка врагов
    enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance < 50) {
        const enemyAngle = Math.atan2(dy, dx);
        let angleDiff = enemyAngle - player.angle;
        while (angleDiff > Math.PI) angleDiff -= 2*Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2*Math.PI;
        
        if (Math.abs(angleDiff) < fov/1.3) {
          const screenX = w/2 + (angleDiff / (fov/2)) * w/2;
          const size = Math.min(100, 150 / (distance * 0.1 + 0.5));
          
          ctx.font = `${size}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#e74c3c';
          ctx.fillText('👺', screenX, horizon + size/4);
          
          const hpPercent = enemy.hp / enemy.maxHp;
          ctx.fillStyle = '#333';
          ctx.fillRect(screenX - 20, horizon - size/2 - 15, 40, 5);
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(screenX - 20, horizon - size/2 - 15, 40 * hpPercent, 5);
        }
      }
    });
    
    // Эффект выстрела
    if (shootFlash > 0) {
      ctx.fillStyle = `rgba(255, 200, 0, ${shootFlash * 0.05})`;
      ctx.fillRect(0, 0, w, h);
      shootFlash--;
    }
    
    renderLoopId = requestAnimationFrame(render);
  }
  
  render();
}

function castRay(startX, startY, angle) {
  let x = startX, y = startY, dist = 0;
  while (dist < 100) {
    x += Math.cos(angle) * 0.5;
    y += Math.sin(angle) * 0.5;
    dist += 0.5;
    
    for (const wall of walls) {
      const minX = Math.min(wall.x1, wall.x2);
      const maxX = Math.max(wall.x1, wall.x2);
      const minY = Math.min(wall.y1, wall.y2);
      const maxY = Math.max(wall.y1, wall.y2);
      if (x > minX && x < maxX && y > minY && y < maxY) return dist;
    }
  }
  return 100;
}

// ===================================================================
// ЧАСТЬ 15: ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===================================================================

function updateUI() {
  document.getElementById('hpValue').textContent = player.hp;
  document.getElementById('hpBar').style.width = player.hp + '%';
  document.getElementById('armorValue').textContent = player.armor;
  document.getElementById('armorBar').style.width = player.armor + '%';
  document.getElementById('moneyDisplay').textContent = player.money;
  document.getElementById('killsDisplay').textContent = player.kills;
  updateAmmoDisplay();
}

function updateAmmoDisplay() {
  const el = document.getElementById('ammoDisplay');
  if (el) el.textContent = `${player.ammo}/${player.maxAmmo}`;
}

function addKillFeed(text) {
  killFeed.unshift({ text, time: Date.now() });
  if (killFeed.length > 5) killFeed.pop();
  
  const feedEl = document.getElementById('killFeed');
  if (feedEl) {
    feedEl.innerHTML = killFeed.map(k => 
      `<div style="color:#fff; text-shadow:1px 1px 2px black; margin-bottom:3px;">${k.text}</div>`
    ).join('');
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function showNotification(title, message, type) {
  if (typeof window.showNotification === 'function') {
    window.showNotification(title, message, type);
  }
}

function getWeapon(id) {
  for (const cat of Object.values(WEAPONS)) {
    if (cat[id]) return cat[id];
  }
  return null;
}

// ===================================================================
// ЧАСТЬ 16: ЭКСПОРТ
// ===================================================================

window.startMatch = startMatch;
window.startMove = startMove;
window.stopMove = stopMove;
window.shoot = shoot;
window.reloadWeapon = reloadWeapon;
window.plantBomb = plantBomb;
window.openBuyMenu = openBuyMenu;
window.buyWeapon = buyWeapon;
window.nextRound = nextRound;
window.endMatch = endMatch;

console.log('✅ game.js загружен (700+ строк) — Pixel Strike Game Engine v2.0.0');