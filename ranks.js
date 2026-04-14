// ranks.js — СИСТЕМА РАНГОВ И ELO

// Получение текущего ранга
function getCurrentRank() {
  const elo = playerData.elo || 0;
  
  for (let i = CONFIG.ranks.length - 1; i >= 0; i--) {
    if (elo >= CONFIG.ranks[i].minElo) {
      return CONFIG.ranks[i];
    }
  }
  
  return CONFIG.ranks[0];
}

// Получение следующего ранга
function getNextRank() {
  const current = getCurrentRank();
  const currentIndex = CONFIG.ranks.findIndex(r => r.name === current.name);
  
  if (currentIndex < CONFIG.ranks.length - 1) {
    return CONFIG.ranks[currentIndex + 1];
  }
  
  return null;
}

// Обновление отображения ранга
function updateRankDisplay() {
  const rank = getCurrentRank();
  const nextRank = getNextRank();
  
  // Значок ранга
  const badgeEl = document.getElementById('rankBadge');
  if (badgeEl) badgeEl.textContent = rank.icon;
  
  // Название ранга
  const rankEl = document.getElementById('playerRank');
  if (rankEl) {
    rankEl.textContent = rank.name;
    rankEl.style.color = rank.color;
  }
  
  // Полоса прогресса до следующего ранга
  const rankProgress = document.getElementById('rankProgress');
  if (rankProgress && nextRank) {
    const currentElo = playerData.elo;
    const minElo = rank.minElo;
    const maxElo = nextRank.minElo;
    const progress = ((currentElo - minElo) / (maxElo - minElo)) * 100;
    rankProgress.style.width = Math.min(100, Math.max(0, progress)) + '%';
  }
}

// Открытие экрана рангов
function openRanks() {
  const screen = document.getElementById('ranksScreen');
  const currentRank = getCurrentRank();
  const nextRank = getNextRank();
  
  let html = `
    <h2>🏆 РАНГИ</h2>
    
    <div style="text-align:center; margin-bottom:20px;">
      <div style="font-size:60px;">${currentRank.icon}</div>
      <div style="font-size:24px; font-weight:bold; color:${currentRank.color};">${currentRank.name}</div>
      <div style="color:#888; margin:5px 0;">ELO: ${playerData.elo}</div>
  `;
  
  if (nextRank) {
    const progress = ((playerData.elo - currentRank.minElo) / (nextRank.minElo - currentRank.minElo)) * 100;
    html += `
      <div style="margin:15px 0;">
        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
          <span>${currentRank.name}</span>
          <span>${nextRank.name}</span>
        </div>
        <div style="height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
          <div style="height:100%; width:${progress}%; background:linear-gradient(90deg, ${currentRank.color}, ${nextRank.color}); border-radius:4px;"></div>
        </div>
        <div style="margin-top:5px; font-size:12px; color:#888;">
          ${playerData.elo - currentRank.minElo} / ${nextRank.minElo - currentRank.minElo} ELO
        </div>
      </div>
    `;
  } else {
    html += `<div style="margin:15px 0; color:#ffd700;">🏆 МАКСИМАЛЬНЫЙ РАНГ!</div>`;
  }
  
  html += `</div>`;
  
  // Список всех рангов
  html += `<div style="max-height:400px; overflow-y:auto;">`;
  
  CONFIG.ranks.forEach((rank, index) => {
    const isCurrent = rank.name === currentRank.name;
    const isAchieved = playerData.elo >= rank.minElo;
    
    html += `
      <div style="display:flex; align-items:center; gap:15px; padding:12px; 
                  background:${isCurrent ? 'rgba(255,215,0,0.1)' : 'rgba(0,0,0,0.2)'}; 
                  border-radius:12px; margin-bottom:8px; 
                  border:1px solid ${isCurrent ? '#ffd700' : 'transparent'};
                  opacity:${isAchieved ? 1 : 0.5};">
        <div style="font-size:30px; width:40px; text-align:center;">${rank.icon}</div>
        <div style="flex:1;">
          <div style="font-weight:bold; color:${isAchieved ? rank.color : '#888'};">${rank.name}</div>
          <div style="font-size:12px; color:#888;">${rank.minElo} ELO</div>
        </div>
        ${isCurrent ? '<span style="color:#ffd700;">✓</span>' : ''}
        ${!isAchieved ? '<span style="color:#888;">🔒</span>' : ''}
      </div>
    `;
  });
  
  html += `</div>`;
  
  // Награды за ранги
  html += `
    <div style="margin-top:20px; padding:15px; background:rgba(0,0,0,0.3); border-radius:15px;">
      <h3 style="margin-bottom:10px;">🎁 НАГРАДЫ ЗА РАНГИ</h3>
      <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px; font-size:12px;">
        <div>🥉 Silver → 500 PIX</div>
        <div>🌟 Gold Nova → 1000 PIX</div>
        <div>🛡️ Master Guardian → Кейс</div>
        <div>🦅 Legendary Eagle → 5 Гемов</div>
        <div>👑 Supreme → 100 Коинов</div>
        <div>🌍 Global Elite → ЛЕГЕНДАРНЫЙ СКИН</div>
      </div>
    </div>
    
    <button onclick="showScreen('mainMenu')" class="back-btn">◀ НАЗАД</button>
  `;
  
  screen.innerHTML = html;
  showScreen('ranksScreen');
}

// Экспорт
window.getCurrentRank = getCurrentRank;
window.updateRankDisplay = updateRankDisplay;
window.openRanks = openRanks;