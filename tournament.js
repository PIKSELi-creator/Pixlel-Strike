// tournament.js — ТУРНИРЫ PIXEL STRIKE (500+ строк)
// Версия: 1.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: СОСТОЯНИЕ ТУРНИРОВ
// ===================================================================

let tournamentState = {
  currentTab: 'active', // active, upcoming, history, my
  registeredTournaments: JSON.parse(localStorage.getItem('registered_tournaments') || '[]'),
  tournamentHistory: JSON.parse(localStorage.getItem('tournament_history') || '[]'),
  myTeam: JSON.parse(localStorage.getItem('tournament_team') || 'null')
};

// Имитация турниров
let tournaments = [
  {
    id: 't1',
    name: 'PIXEL STRIKE CUP',
    icon: '🏆',
    type: 'solo',
    status: 'active',
    players: 64,
    maxPlayers: 128,
    prize: 50000,
    entryFee: 1000,
    map: 'DUST II',
    mode: 'competitive',
    startDate: '2026-04-15',
    endDate: '2026-04-20',
    description: 'Главный турнир месяца! Одиночные сражения 1v1.',
    registered: 64,
    rounds: ['1/64', '1/32', '1/16', '1/8', '1/4', '1/2', 'Финал']
  },
  {
    id: 't2',
    name: 'TEAM WARFARE',
    icon: '⚔️',
    type: 'team',
    status: 'active',
    teams: 16,
    maxTeams: 32,
    prize: 100000,
    entryFee: 5000,
    map: 'MIRAGE',
    mode: 'competitive',
    startDate: '2026-04-18',
    endDate: '2026-04-25',
    description: 'Командный турнир 5v5. Собери команду и докажи своё превосходство!',
    registered: 12
  },
  {
    id: 't3',
    name: 'SNIPER ELITE',
    icon: '🎯',
    type: 'solo',
    status: 'upcoming',
    players: 0,
    maxPlayers: 64,
    prize: 25000,
    entryFee: 500,
    map: 'NUKE',
    mode: 'deathmatch',
    startDate: '2026-04-25',
    description: 'Только снайперские винтовки! Докажи, что ты лучший стрелок.'
  },
  {
    id: 't4',
    name: 'KNIGHT CHALLENGE',
    icon: '🛡️',
    type: 'solo',
    status: 'upcoming',
    players: 0,
    maxPlayers: 32,
    prize: 15000,
    entryFee: 0,
    map: 'ANCIENT',
    mode: 'wingman',
    startDate: '2026-05-01',
    description: 'Бесплатный турнир для новичков! Отличный шанс проявить себя.'
  }
];

// ===================================================================
// ЧАСТЬ 2: ОТКРЫТИЕ ТУРНИРОВ
// ===================================================================

function openTournament() {
  const screen = document.getElementById('tournamentScreen');
  if (!screen) {
    createTournamentScreen();
  }
  
  renderTournamentScreen();
  showScreen('tournamentScreen');
}

function createTournamentScreen() {
  const screen = document.createElement('div');
  screen.id = 'tournamentScreen';
  screen.className = 'screen';
  document.body.appendChild(screen);
}

// ===================================================================
// ЧАСТЬ 3: РЕНДЕРИНГ ЭКРАНА
// ===================================================================

function renderTournamentScreen() {
  const screen = document.getElementById('tournamentScreen');
  if (!screen) return;
  
  let html = `
    <div style="padding:15px; padding-bottom:80px;">
      <h2 style="color:#ffd700; text-align:center;">🏆 ТУРНИРЫ</h2>
      
      <!-- ВКЛАДКИ -->
      <div style="display:flex; gap:5px; margin-bottom:15px;">
        <button onclick="switchTournamentTab('active')" class="tournament-tab ${tournamentState.currentTab === 'active' ? 'active' : ''}">
          🔥 АКТИВНЫЕ
        </button>
        <button onclick="switchTournamentTab('upcoming')" class="tournament-tab ${tournamentState.currentTab === 'upcoming' ? 'active' : ''}">
          📅 СКОРО
        </button>
        <button onclick="switchTournamentTab('my')" class="tournament-tab ${tournamentState.currentTab === 'my' ? 'active' : ''}">
          👤 МОИ
        </button>
        <button onclick="switchTournamentTab('history')" class="tournament-tab ${tournamentState.currentTab === 'history' ? 'active' : ''}">
          📜 ИСТОРИЯ
        </button>
      </div>
  `;
  
  if (tournamentState.currentTab === 'active') {
    html += renderActiveTournaments();
  } else if (tournamentState.currentTab === 'upcoming') {
    html += renderUpcomingTournaments();
  } else if (tournamentState.currentTab === 'my') {
    html += renderMyTournaments();
  } else {
    html += renderTournamentHistory();
  }
  
  html += `
      <button onclick="showScreen('mainMenu')" style="width:100%; margin-top:20px; padding:15px; background:#333; border:none; border-radius:10px; color:white;">
        ◀ НАЗАД В МЕНЮ
      </button>
    </div>
  `;
  
  screen.innerHTML = html;
}

function switchTournamentTab(tab) {
  tournamentState.currentTab = tab;
  renderTournamentScreen();
}

// ===================================================================
// ЧАСТЬ 4: ВКЛАДКИ ТУРНИРОВ
// ===================================================================

function renderActiveTournaments() {
  const active = tournaments.filter(t => t.status === 'active');
  
  if (active.length === 0) {
    return `<p style="text-align:center; color:#888; padding:40px;">😕 Нет активных турниров</p>`;
  }
  
  let html = `<div style="max-height:450px; overflow-y:auto;">`;
  
  active.forEach(tournament => {
    const isRegistered = tournamentState.registeredTournaments.includes(tournament.id);
    const progress = tournament.type === 'solo' 
      ? Math.round((tournament.registered / tournament.maxPlayers) * 100)
      : Math.round((tournament.registered / tournament.maxTeams) * 100);
    
    html += `
      <div onclick="showTournamentDetails('${tournament.id}')" 
           style="background:#1a1a2e; border:1px solid #ffd70040; border-radius:15px; padding:15px; margin-bottom:15px; cursor:pointer;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
          <div style="font-size:40px;">${tournament.icon}</div>
          <div style="flex:1;">
            <div style="font-weight:bold; font-size:18px; color:#ffd700;">${tournament.name}</div>
            <div style="font-size:13px; color:#aaa;">${tournament.type === 'solo' ? '👤 Соло' : '👥 Командный'} • ${tournament.map} • ${tournament.mode}</div>
          </div>
          ${isRegistered ? '<span style="color:#2ecc71; font-weight:bold;">✅ ЗАРЕГИСТРИРОВАН</span>' : ''}
        </div>
        
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <span>👥 ${tournament.registered}/${tournament.type === 'solo' ? tournament.maxPlayers : tournament.maxTeams}</span>
          <span>🏆 ${formatNumber(tournament.prize)} PIX</span>
          <span>💰 Взнос: ${tournament.entryFee > 0 ? formatNumber(tournament.entryFee) + ' PIX' : 'БЕСПЛАТНО'}</span>
        </div>
        
        <div style="height:4px; background:#333; border-radius:2px; margin-bottom:10px;">
          <div style="width:${progress}%; height:100%; background:#2ecc71; border-radius:2px;"></div>
        </div>
        
        <div style="display:flex; justify-content:space-between; font-size:12px; color:#888;">
          <span>📅 Старт: ${tournament.startDate}</span>
          <span>🏁 Финал: ${tournament.endDate}</span>
        </div>
        
        ${!isRegistered ? `
          <button onclick="event.stopPropagation(); registerForTournament('${tournament.id}')" 
                  style="width:100%; margin-top:12px; padding:10px; background:#2ecc71; border:none; border-radius:8px; color:white; font-weight:bold;">
            📝 ЗАРЕГИСТРИРОВАТЬСЯ
          </button>
        ` : ''}
      </div>
    `;
  });
  
  html += `</div>`;
  return html;
}

function renderUpcomingTournaments() {
  const upcoming = tournaments.filter(t => t.status === 'upcoming');
  
  if (upcoming.length === 0) {
    return `<p style="text-align:center; color:#888; padding:40px;">😕 Нет предстоящих турниров</p>`;
  }
  
  let html = `<div style="max-height:450px; overflow-y:auto;">`;
  
  upcoming.forEach(tournament => {
    html += `
      <div onclick="showTournamentDetails('${tournament.id}')" 
           style="background:#1a1a2e; border-radius:15px; padding:15px; margin-bottom:15px; cursor:pointer;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
          <div style="font-size:40px;">${tournament.icon}</div>
          <div style="flex:1;">
            <div style="font-weight:bold; font-size:18px;">${tournament.name}</div>
            <div style="font-size:13px; color:#aaa;">${tournament.type === 'solo' ? '👤 Соло' : '👥 Командный'} • ${tournament.map}</div>
          </div>
        </div>
        
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <span>🏆 ${formatNumber(tournament.prize)} PIX</span>
          <span>💰 ${tournament.entryFee > 0 ? formatNumber(tournament.entryFee) + ' PIX' : 'БЕСПЛАТНО'}</span>
        </div>
        
        <div style="display:flex; justify-content:space-between; font-size:12px; color:#888;">
          <span>📅 Старт: ${tournament.startDate}</span>
          <span>👥 Макс: ${tournament.maxPlayers || tournament.maxTeams}</span>
        </div>
        
        <button onclick="event.stopPropagation(); notifyWhenStarts('${tournament.id}')" 
                style="width:100%; margin-top:12px; padding:10px; background:#f39c12; border:none; border-radius:8px; color:white;">
          🔔 УВЕДОМИТЬ О СТАРТЕ
        </button>
      </div>
    `;
  });
  
  html += `</div>`;
  return html;
}

function renderMyTournaments() {
  const registered = tournaments.filter(t => tournamentState.registeredTournaments.includes(t.id));
  
  if (registered.length === 0) {
    return `
      <div style="text-align:center; padding:40px;">
        <div style="font-size:60px; margin-bottom:20px;">🏆</div>
        <p style="color:#ccc; margin-bottom:20px;">Вы не зарегистрированы ни в одном турнире</p>
        <button onclick="switchTournamentTab('active')" 
                style="padding:15px 30px; background:#2ecc71; border:none; border-radius:10px; color:white; font-weight:bold;">
          🔥 СМОТРЕТЬ АКТИВНЫЕ ТУРНИРЫ
        </button>
      </div>
    `;
  }
  
  let html = `<div style="max-height:450px; overflow-y:auto;">`;
  
  registered.forEach(tournament => {
    html += `
      <div onclick="showTournamentDetails('${tournament.id}')" 
           style="background:#1a1a2e; border:2px solid #2ecc71; border-radius:15px; padding:15px; margin-bottom:15px; cursor:pointer;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="font-size:40px;">${tournament.icon}</div>
          <div style="flex:1;">
            <div style="font-weight:bold; color:#ffd700;">${tournament.name}</div>
            <div style="font-size:13px; color:#2ecc71;">✅ Вы зарегистрированы</div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  return html;
}

function renderTournamentHistory() {
  const history = tournamentState.tournamentHistory;
  
  if (history.length === 0) {
    return `<p style="text-align:center; color:#888; padding:40px;">😕 Нет истории участия</p>`;
  }
  
  let html = `<div style="max-height:450px; overflow-y:auto;">`;
  
  history.forEach(record => {
    html += `
      <div style="background:#1a1a2e; border-radius:12px; padding:15px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between;">
          <span style="font-weight:bold;">${record.tournamentName}</span>
          <span style="color:#ffd700;">🏆 ${record.place} место</span>
        </div>
        <div style="font-size:12px; color:#888; margin-top:5px;">${record.date}</div>
        <div style="color:#2ecc71; margin-top:5px;">+${formatNumber(record.reward)} PIX</div>
      </div>
    `;
  });
  
  html += `</div>`;
  return html;
}

// ===================================================================
// ЧАСТЬ 5: ДЕТАЛИ ТУРНИРА
// ===================================================================

function showTournamentDetails(tournamentId) {
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return;
  
  const modal = document.getElementById('caseOpeningModal');
  const overlay = document.getElementById('modalOverlay');
  const isRegistered = tournamentState.registeredTournaments.includes(tournamentId);
  
  modal.innerHTML = `
    <div style="text-align:center; max-height:500px; overflow-y:auto;">
      <h3 style="color:#ffd700; margin-bottom:15px;">${tournament.icon} ${tournament.name}</h3>
      
      <p style="color:#ccc; margin-bottom:15px;">${tournament.description}</p>
      
      <div style="background:#0a0a0f; border-radius:10px; padding:15px; margin-bottom:15px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div><span>🗺️ Карта:</span> ${tournament.map}</div>
          <div><span>🎮 Режим:</span> ${tournament.mode}</div>
          <div><span>👥 Тип:</span> ${tournament.type === 'solo' ? 'Соло' : 'Командный'}</div>
          <div><span>🏆 Приз:</span> ${formatNumber(tournament.prize)} PIX</div>
          <div><span>💰 Взнос:</span> ${tournament.entryFee > 0 ? formatNumber(tournament.entryFee) + ' PIX' : 'Бесплатно'}</div>
          <div><span>📅 Старт:</span> ${tournament.startDate}</div>
        </div>
      </div>
      
      ${tournament.rounds ? `
        <div style="background:#0a0a0f; border-radius:10px; padding:15px; margin-bottom:15px;">
          <h4 style="color:#ffd700; margin-bottom:10px;">📋 СЕТКА ТУРНИРА</h4>
          <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:5px;">
            ${tournament.rounds.map(r => `<span style="padding:5px 10px; background:#1a1a2e; border-radius:15px; font-size:11px;">${r}</span>`).join(' → ')}
          </div>
        </div>
      ` : ''}
      
      ${isRegistered ? `
        <div style="background:#2ecc7120; border:1px solid #2ecc71; border-radius:10px; padding:15px; margin-bottom:15px;">
          <span style="color:#2ecc71;">✅ ВЫ ЗАРЕГИСТРИРОВАНЫ</span>
        </div>
      ` : `
        <button onclick="registerForTournament('${tournamentId}'); closeModal();" 
                style="width:100%; padding:15px; background:#2ecc71; border:none; border-radius:10px; color:white; font-weight:bold; margin-bottom:10px;">
          📝 ЗАРЕГИСТРИРОВАТЬСЯ
        </button>
      `}
      
      <button onclick="closeModal()" style="width:100%; padding:12px; background:#333; border:none; border-radius:10px; color:white;">
        ЗАКРЫТЬ
      </button>
    </div>
  `;
  
  overlay.style.display = 'block';
  modal.style.display = 'block';
}

// ===================================================================
// ЧАСТЬ 6: ФУНКЦИИ ТУРНИРОВ
// ===================================================================

function registerForTournament(tournamentId) {
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return;
  
  if (tournamentState.registeredTournaments.includes(tournamentId)) {
    showNotification('⚠️ УЖЕ ЗАРЕГИСТРИРОВАНЫ', '', 'warning');
    return;
  }
  
  if (tournament.entryFee > 0) {
    if ((gameResources?.pixels || 0) < tournament.entryFee) {
      showNotification('❌ НЕДОСТАТОЧНО СРЕДСТВ', `Нужно ${formatNumber(tournament.entryFee)} PIX`, 'error');
      return;
    }
    gameResources.pixels -= tournament.entryFee;
    saveResources();
  }
  
  tournamentState.registeredTournaments.push(tournamentId);
  localStorage.setItem('registered_tournaments', JSON.stringify(tournamentState.registeredTournaments));
  
  tournament.registered++;
  
  showNotification('✅ РЕГИСТРАЦИЯ УСПЕШНА', tournament.name, 'success');
  renderTournamentScreen();
}

function notifyWhenStarts(tournamentId) {
  showNotification('🔔 УВЕДОМЛЕНИЕ ВКЛЮЧЕНО', 'Мы сообщим когда турнир начнётся', 'success');
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// ===================================================================
// ЧАСТЬ 7: СТИЛИ И ЭКСПОРТ
// ===================================================================

const tournamentStyle = document.createElement('style');
tournamentStyle.textContent = `
  .tournament-tab {
    flex: 1;
    padding: 12px;
    background: #1a1a2e;
    border: 1px solid #3a4a5a;
    border-radius: 10px;
    color: white;
    font-size: 13px;
    cursor: pointer;
  }
  .tournament-tab.active {
    background: #ffd70020;
    border-color: #ffd700;
    color: #ffd700;
  }
`;
document.head.appendChild(tournamentStyle);

window.openTournament = openTournament;
window.switchTournamentTab = switchTournamentTab;
window.showTournamentDetails = showTournamentDetails;
window.registerForTournament = registerForTournament;
window.notifyWhenStarts = notifyWhenStarts;

console.log('✅ tournament.js загружен (500+ строк) — Pixel Strike Tournament System v1.0.0');