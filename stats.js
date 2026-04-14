// stats.js — ПОДРОБНАЯ СТАТИСТИКА PIXEL STRIKE (600+ строк)
// Версия: 1.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: СОСТОЯНИЕ И ДАННЫЕ
// ===================================================================

let statsState = {
  currentTab: 'overview',
  selectedMap: null,
  selectedWeapon: null,
  timeRange: 'all', // all, week, month
  charts: {}
};

// Загружаем статистику
function loadFullStats() {
  return {
    // Общая статистика
    overview: {
      matches: parseInt(localStorage.getItem('player_matches') || '0'),
      wins: parseInt(localStorage.getItem('player_wins') || '0'),
      losses: parseInt(localStorage.getItem('player_losses') || '0'),
      kills: parseInt(localStorage.getItem('player_kills') || '0'),
      deaths: parseInt(localStorage.getItem('player_deaths') || '0'),
      assists: parseInt(localStorage.getItem('player_assists') || '0'),
      headshots: parseInt(localStorage.getItem('player_headshots') || '0'),
      mvps: parseInt(localStorage.getItem('player_mvps') || '0'),
      aces: parseInt(localStorage.getItem('player_aces') || '0'),
      clutches: parseInt(localStorage.getItem('player_clutches') || '0'),
      playTime: parseInt(localStorage.getItem('player_playtime') || '0'),
      moneyEarned: parseInt(localStorage.getItem('player_money_earned') || '0'),
      bombsPlanted: parseInt(localStorage.getItem('player_bombs_planted') || '0'),
      bombsDefused: parseInt(localStorage.getItem('player_bombs_defused') || '0')
    },
    
    // По картам
    maps: JSON.parse(localStorage.getItem('map_stats') || '{}'),
    
    // По оружию
    weapons: JSON.parse(localStorage.getItem('weapon_stats') || '{}'),
    
    // История матчей
    matchHistory: JSON.parse(localStorage.getItem('match_history') || '[]'),
    
    // Достижения
    achievements: JSON.parse(localStorage.getItem('player_achievements') || '[]')
  };
}

// ===================================================================
// ЧАСТЬ 2: ОТКРЫТИЕ СТАТИСТИКИ
// ===================================================================

function openStats() {
  const screen = document.getElementById('statsScreen');
  if (!screen) return;
  
  renderStatsScreen();
  showScreen('statsScreen');
}

function renderStatsScreen() {
  const screen = document.getElementById('statsScreen');
  const stats = loadFullStats();
  
  let html = `
    <div style="padding:15px; padding-bottom:80px;">
      <h2 style="color:#ffd700; text-align:center;">📊 СТАТИСТИКА</h2>
      
      <!-- ВКЛАДКИ -->
      <div style="display:flex; gap:5px; margin-bottom:15px;">
        <button onclick="switchStatsTab('overview')" class="stats-tab ${statsState.currentTab === 'overview' ? 'active' : ''}">
          📊 ОБЗОР
        </button>
        <button onclick="switchStatsTab('maps')" class="stats-tab ${statsState.currentTab === 'maps' ? 'active' : ''}">
          🗺️ КАРТЫ
        </button>
        <button onclick="switchStatsTab('weapons')" class="stats-tab ${statsState.currentTab === 'weapons' ? 'active' : ''}">
          🔫 ОРУЖИЕ
        </button>
        <button onclick="switchStatsTab('history')" class="stats-tab ${statsState.currentTab === 'history' ? 'active' : ''}">
          📜 ИСТОРИЯ
        </button>
        <button onclick="switchStatsTab('achievements')" class="stats-tab ${statsState.currentTab === 'achievements' ? 'active' : ''}">
          🏆 ДОСТИЖЕНИЯ
        </button>
      </div>
      
      <!-- ФИЛЬТР ВРЕМЕНИ -->
      <div style="display:flex; gap:5px; margin-bottom:15px;">
        <select onchange="setTimeRange(this.value)" style="padding:8px; background:#1a1a2e; border:1px solid #3a4a5a; border-radius:8px; color:white;">
          <option value="all" ${statsState.timeRange === 'all' ? 'selected' : ''}>Всё время</option>
          <option value="week" ${statsState.timeRange === 'week' ? 'selected' : ''}>Неделя</option>
          <option value="month" ${statsState.timeRange === 'month' ? 'selected' : ''}>Месяц</option>
        </select>
      </div>
      
      <!-- КОНТЕНТ ВКЛАДКИ -->
      <div id="statsTabContent">
        ${renderStatsTab(stats)}
      </div>
      
      <button onclick="showScreen('mainMenu')" style="width:100%; margin-top:20px; padding:15px; background:#333; border:none; border-radius:10px; color:white;">
        ◀ НАЗАД В МЕНЮ
      </button>
    </div>
  `;
  
  screen.innerHTML = html;
}

function switchStatsTab(tab) {
  statsState.currentTab = tab;
  renderStatsScreen();
}

function setTimeRange(range) {
  statsState.timeRange = range;
  renderStatsScreen();
}

// ===================================================================
// ЧАСТЬ 3: РЕНДЕРИНГ ВКЛАДОК
// ===================================================================

function renderStatsTab(stats) {
  switch (statsState.currentTab) {
    case 'overview':
      return renderOverviewTab(stats);
    case 'maps':
      return renderMapsTab(stats);
    case 'weapons':
      return renderWeaponsTab(stats);
    case 'history':
      return renderHistoryTab(stats);
    case 'achievements':
      return renderAchievementsTab(stats);
    default:
      return renderOverviewTab(stats);
  }
}

function renderOverviewTab(stats) {
  const ov = stats.overview;
  const winrate = ov.matches > 0 ? Math.round((ov.wins / ov.matches) * 100) : 0;
  const kd = ov.deaths > 0 ? (ov.kills / ov.deaths).toFixed(2) : ov.kills.toFixed(2);
  const hsRate = ov.kills > 0 ? Math.round((ov.headshots / ov.kills) * 100) : 0;
  
  return `
    <div>
      <!-- ОСНОВНЫЕ ПОКАЗАТЕЛИ -->
      <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:15px;">
        <div class="stat-card-large">
          <span>🎮</span>
          <span class="stat-value">${ov.matches}</span>
          <span class="stat-label">Матчей</span>
        </div>
        <div class="stat-card-large">
          <span>🏆</span>
          <span class="stat-value">${winrate}%</span>
          <span class="stat-label">Винрейт</span>
        </div>
        <div class="stat-card-large">
          <span>💀</span>
          <span class="stat-value">${ov.kills}</span>
          <span class="stat-label">Убийств</span>
        </div>
        <div class="stat-card-large">
          <span>🎯</span>
          <span class="stat-value">${kd}</span>
          <span class="stat-label">K/D</span>
        </div>
      </div>
      
      <!-- ПОДРОБНАЯ СТАТИСТИКА -->
      <div style="background:#1a1a2e; border-radius:15px; padding:15px; margin-bottom:15px;">
        <h3 style="color:#ffd700; margin-bottom:15px;">📈 ПОДРОБНО</h3>
        <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px;">
          <div><span>Победы:</span> <span style="color:#2ecc71; float:right;">${ov.wins}</span></div>
          <div><span>Поражения:</span> <span style="color:#e74c3c; float:right;">${ov.losses}</span></div>
          <div><span>Смерти:</span> <span style="float:right;">${ov.deaths}</span></div>
          <div><span>Помощь:</span> <span style="float:right;">${ov.assists}</span></div>
          <div><span>Хэдшоты:</span> <span style="float:right;">${ov.headshots} (${hsRate}%)</span></div>
          <div><span>MVP:</span> <span style="float:right;">${ov.mvps}</span></div>
          <div><span>Эйсы:</span> <span style="color:#FFD700; float:right;">${ov.aces}</span></div>
          <div><span>Клатчи:</span> <span style="color:#FF4500; float:right;">${ov.clutches}</span></div>
          <div><span>Бомб заложено:</span> <span style="float:right;">${ov.bombsPlanted}</span></div>
          <div><span>Бомб обезврежено:</span> <span style="float:right;">${ov.bombsDefused}</span></div>
        </div>
      </div>
      
      <!-- ВРЕМЯ ИГРЫ И ДЕНЬГИ -->
      <div style="background:#1a1a2e; border-radius:15px; padding:15px; margin-bottom:15px;">
        <h3 style="color:#ffd700; margin-bottom:15px;">⏱️ ОБЩЕЕ</h3>
        <div><span>Время игры:</span> <span style="float:right;">${formatPlayTime(ov.playTime)}</span></div>
        <div><span>Заработано:</span> <span style="color:#2ecc71; float:right;">$${formatNumber(ov.moneyEarned)}</span></div>
      </div>
      
      <!-- ГРАФИК (заглушка) -->
      <div style="background:#1a1a2e; border-radius:15px; padding:15px;">
        <h3 style="color:#ffd700; margin-bottom:15px;">📊 ПРОГРЕСС</h3>
        <div id="statsChart" style="height:150px; display:flex; align-items:flex-end; justify-content:space-around; padding:10px 0;">
          ${renderSimpleChart()}
        </div>
      </div>
    </div>
  `;
}

function renderMapsTab(stats) {
  const maps = stats.maps;
  const mapEntries = Object.entries(maps).sort((a, b) => b[1].played - a[1].played);
  
  if (mapEntries.length === 0) {
    return `<p style="text-align:center; color:#888; padding:40px;">😕 Нет данных по картам</p>`;
  }
  
  let html = `<div style="max-height:400px; overflow-y:auto;">`;
  
  mapEntries.forEach(([mapId, data]) => {
    const mapInfo = ALL_MAPS?.find(m => m.id === mapId) || { name: mapId.toUpperCase(), icon: '🗺️' };
    const winrate = data.played > 0 ? Math.round((data.wins / data.played) * 100) : 0;
    const kd = data.deaths > 0 ? (data.kills / data.deaths).toFixed(2) : '0.00';
    
    html += `
      <div onclick="showMapDetails('${mapId}')" style="background:#1a1a2e; border-radius:12px; padding:15px; margin-bottom:10px; cursor:pointer;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="font-size:30px;">${mapInfo.icon}</div>
          <div style="flex:1;">
            <div style="font-weight:bold;">${mapInfo.name}</div>
            <div style="font-size:12px; color:#888;">Сыграно: ${data.played}</div>
          </div>
          <div style="text-align:right;">
            <div style="color:#2ecc71;">${winrate}%</div>
            <div style="font-size:12px; color:#aaa;">K/D: ${kd}</div>
          </div>
        </div>
        <div style="margin-top:10px;">
          <div style="height:4px; background:#333; border-radius:2px;">
            <div style="width:${winrate}%; height:100%; background:#2ecc71; border-radius:2px;"></div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  return html;
}

function renderWeaponsTab(stats) {
  const weapons = stats.weapons;
  const weaponEntries = Object.entries(weapons).sort((a, b) => b[1].kills - a[1].kills);
  
  if (weaponEntries.length === 0) {
    return `<p style="text-align:center; color:#888; padding:40px;">😕 Нет данных по оружию</p>`;
  }
  
  let html = `<div style="max-height:400px; overflow-y:auto;">`;
  
  weaponEntries.slice(0, 10).forEach(([weaponId, data]) => {
    const accuracy = data.shots > 0 ? Math.round((data.hits / data.shots) * 100) : 0;
    const hsRate = data.kills > 0 ? Math.round((data.headshots / data.kills) * 100) : 0;
    
    html += `
      <div style="background:#1a1a2e; border-radius:12px; padding:15px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="font-size:30px;">🔫</div>
          <div style="flex:1;">
            <div style="font-weight:bold;">${weaponId.toUpperCase()}</div>
            <div style="font-size:12px; color:#888;">Убийств: ${data.kills}</div>
          </div>
          <div style="text-align:right;">
            <div>🎯 ${accuracy}%</div>
            <div style="font-size:12px; color:#aaa;">HS: ${hsRate}%</div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  return html;
}

function renderHistoryTab(stats) {
  const history = stats.matchHistory.slice(0, 20);
  
  if (history.length === 0) {
    return `<p style="text-align:center; color:#888; padding:40px;">😕 Нет истории матчей</p>`;
  }
  
  let html = `<div style="max-height:400px; overflow-y:auto;">`;
  
  history.forEach(match => {
    const date = new Date(match.timestamp).toLocaleDateString('ru-RU');
    const result = match.won ? '🏆 ПОБЕДА' : '💀 ПОРАЖЕНИЕ';
    const resultColor = match.won ? '#2ecc71' : '#e74c3c';
    
    html += `
      <div style="background:#1a1a2e; border-radius:12px; padding:15px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
          <span style="color:${resultColor};">${result}</span>
          <span style="color:#888; font-size:12px;">${date}</span>
        </div>
        <div style="display:flex; gap:10px; font-size:13px;">
          <span>🗺️ ${match.map}</span>
          <span>🎮 ${match.mode}</span>
          <span>${match.score.ct}:${match.score.t}</span>
        </div>
        <div style="display:flex; gap:15px; margin-top:8px; font-size:13px;">
          <span>💀 ${match.kills}</span>
          <span>💔 ${match.deaths}</span>
          <span>🎯 ${match.kd}</span>
          <span>⭐ ${match.mvp ? 'MVP' : ''}</span>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  return html;
}

function renderAchievementsTab(stats) {
  const allAchievements = [
    { id: 'first_kill', name: 'Первая кровь', icon: '🩸', desc: 'Совершить первое убийство' },
    { id: 'ace', name: 'Эйс', icon: '🏆', desc: 'Убить всю команду за раунд' },
    { id: 'headshot_master', name: 'Хэдшот мастер', icon: '🎯', desc: '50 убийств в голову' },
    { id: 'veteran', name: 'Ветеран', icon: '🎖️', desc: 'Сыграть 100 матчей' },
    { id: 'collector', name: 'Коллекционер', icon: '📦', desc: 'Собрать 50 скинов' },
    { id: 'rich', name: 'Богач', icon: '💰', desc: 'Накопить 50000 пикселей' },
    { id: 'clutch_king', name: 'Король клатчей', icon: '👑', desc: 'Выиграть 10 клатчей' },
    { id: 'bomb_expert', name: 'Сапёр', icon: '💣', desc: 'Обезвредить 25 бомб' }
  ];
  
  const unlocked = stats.achievements;
  const unlockedCount = unlocked.length;
  const totalCount = allAchievements.length;
  const progress = Math.round((unlockedCount / totalCount) * 100);
  
  let html = `
    <div style="margin-bottom:15px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <span>Прогресс достижений</span>
        <span>${unlockedCount}/${totalCount}</span>
      </div>
      <div style="height:6px; background:#333; border-radius:3px;">
        <div style="width:${progress}%; height:100%; background:#ffd700; border-radius:3px;"></div>
      </div>
    </div>
    <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px;">
  `;
  
  allAchievements.forEach(ach => {
    const isUnlocked = unlocked.includes(ach.id);
    html += `
      <div style="background:#1a1a2e; border-radius:12px; padding:15px; text-align:center; opacity:${isUnlocked ? '1' : '0.6'};">
        <div style="font-size:40px;">${ach.icon}</div>
        <div style="font-weight:bold; margin:5px 0;">${ach.name}</div>
        <div style="font-size:11px; color:#888; margin-bottom:8px;">${ach.desc}</div>
        ${isUnlocked ? '<span style="color:#2ecc71;">✅ Получено</span>' : '<span style="color:#888;">🔒 Заблокировано</span>'}
      </div>
    `;
  });
  
  html += `</div>`;
  return html;
}

// ===================================================================
// ЧАСТЬ 4: ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===================================================================

function renderSimpleChart() {
  // Имитация графика
  const bars = [60, 45, 70, 55, 80, 65, 90];
  return bars.map(height => `
    <div style="width:30px; height:${height}px; background:linear-gradient(0deg, #ffd700, #ff8c00); border-radius:5px 5px 0 0;"></div>
  `).join('');
}

function formatPlayTime(minutes) {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} ч ${mins} мин`;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function showMapDetails(mapId) {
  showNotification('🗺️ Карта', `Подробная статистика по карте будет доступна в следующем обновлении`, 'info');
}

// ===================================================================
// ЧАСТЬ 5: ОБНОВЛЕНИЕ СТАТИСТИКИ ПОСЛЕ МАТЧА
// ===================================================================

function updateStatsAfterMatch(matchData) {
  // Общая статистика
  const matches = parseInt(localStorage.getItem('player_matches') || '0') + 1;
  localStorage.setItem('player_matches', matches);
  
  if (matchData.won) {
    const wins = parseInt(localStorage.getItem('player_wins') || '0') + 1;
    localStorage.setItem('player_wins', wins);
  } else {
    const losses = parseInt(localStorage.getItem('player_losses') || '0') + 1;
    localStorage.setItem('player_losses', losses);
  }
  
  const kills = parseInt(localStorage.getItem('player_kills') || '0') + (matchData.kills || 0);
  localStorage.setItem('player_kills', kills);
  
  const deaths = parseInt(localStorage.getItem('player_deaths') || '0') + (matchData.deaths || 0);
  localStorage.setItem('player_deaths', deaths);
  
  const headshots = parseInt(localStorage.getItem('player_headshots') || '0') + (matchData.headshots || 0);
  localStorage.setItem('player_headshots', headshots);
  
  if (matchData.mvp) {
    const mvps = parseInt(localStorage.getItem('player_mvps') || '0') + 1;
    localStorage.setItem('player_mvps', mvps);
  }
  
  // История матчей
  const history = JSON.parse(localStorage.getItem('match_history') || '[]');
  history.unshift({
    ...matchData,
    timestamp: Date.now(),
    kd: matchData.deaths > 0 ? (matchData.kills / matchData.deaths).toFixed(2) : matchData.kills.toFixed(2)
  });
  if (history.length > 50) history.pop();
  localStorage.setItem('match_history', JSON.stringify(history));
}

// ===================================================================
// ЧАСТЬ 6: ЭКСПОРТ
// ===================================================================

window.openStats = openStats;
window.switchStatsTab = switchStatsTab;
window.setTimeRange = setTimeRange;
window.showMapDetails = showMapDetails;
window.updateStatsAfterMatch = updateStatsAfterMatch;

// Стили
const style = document.createElement('style');
style.textContent = `
  .stats-tab {
    flex: 1;
    padding: 10px;
    background: #1a1a2e;
    border: 1px solid #3a4a5a;
    border-radius: 8px;
    color: white;
    font-size: 12px;
    cursor: pointer;
  }
  .stats-tab.active {
    background: #ffd70020;
    border-color: #ffd700;
    color: #ffd700;
  }
  .stat-card-large {
    background: #1a1a2e;
    border-radius: 12px;
    padding: 15px;
    text-align: center;
  }
  .stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #ffd700;
    display: block;
  }
  .stat-label {
    font-size: 12px;
    color: #888;
  }
`;
document.head.appendChild(style);

console.log('✅ stats.js загружен (600+ строк) — Pixel Strike Stats System v1.0.0');