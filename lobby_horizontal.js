// lobby_horizontal.js — ЛОББИ PIXEL STRIKE (РАБОЧИЕ КНОПКИ + КВАДРАТНЫЙ СТАРТ)
// Версия: 15.0.0 | Pixel Studios

function openLobby() {
    const menu = document.getElementById('mainMenu');
    if (!menu) return;
    
    // Данные игрока
    const player = {
        name: localStorage.getItem('player_name') || 'SHIKATILO',
        avatar: localStorage.getItem('player_avatar') || '👤',
        level: parseInt(localStorage.getItem('player_level') || '15'),
        rank: localStorage.getItem('player_rank') || '🥉 SILVER I',
        pixels: parseInt(localStorage.getItem('pixels') || '10500'),
        coins: parseInt(localStorage.getItem('coins') || '500'),
        bpLevel: parseInt(localStorage.getItem('bp_level') || '12'),
        bpProgress: parseInt(localStorage.getItem('bp_progress') || '35'),
        xp: parseInt(localStorage.getItem('player_xp') || '350'),
        xpToNext: 1000
    };
    
    const xpPercent = (player.xp / player.xpToNext) * 100;
    
    menu.innerHTML = `
        <div class="lobby-container-v2">
            
            <!-- ===== ВЕРХНЯЯ ПАНЕЛЬ ===== -->
            <div class="lobby-header-v2">
                <!-- ПРОФИЛЬ (КЛИКАБЕЛЬНЫЙ) -->
                <div class="lobby-profile-v2" onclick="openProfile()">
                    <div class="profile-avatar">${player.avatar}</div>
                    <div class="profile-info">
                        <div class="profile-name">${player.name}</div>
                        <div class="profile-rank">${player.rank}</div>
                        <div class="profile-level-container">
                            <div class="profile-level-bar">
                                <div class="profile-level-fill" style="width:${xpPercent}%"></div>
                            </div>
                            <span class="profile-level-text">Ур. ${player.level}</span>
                        </div>
                    </div>
                </div>
                
                <!-- РЕСУРСЫ -->
                <div class="lobby-resources-v2">
                    <div class="resource-item">
                        <span>💰</span>
                        <span>${formatNumber(player.pixels)}</span>
                    </div>
                    <div class="resource-item">
                        <span>🪙</span>
                        <span>${formatNumber(player.coins)}</span>
                    </div>
                </div>
                
                <!-- ИКОНКИ -->
                <div class="lobby-header-icons-v2">
                    <button class="icon-btn" onclick="openNotifications()">📧</button>
                    <button class="icon-btn" onclick="openSettings()">⚙️</button>
                </div>
            </div>
            
            <!-- ===== ОСНОВНОЙ КОНТЕНТ ===== -->
            <div class="lobby-main-v2">
                
                <!-- ЛЕВАЯ КОЛОНКА -->
                <div class="lobby-left-v2">
                    <button class="lobby-btn-left" onclick="openInventory()">
                        <span>🎒</span> ИНВЕНТАРЬ
                    </button>
                    <button class="lobby-btn-left" onclick="openShop()">
                        <span>🛒</span> МАГАЗИН
                    </button>
                    <button class="lobby-btn-left" onclick="openCases()">
                        <span>🎲</span> КЕЙСЫ
                    </button>
                    
                    <!-- БОЕВОЙ ПРОПУСК -->
                    <div class="lobby-card-v2" onclick="openBattlepass()">
                        <div class="card-title">🎫 БОЕВОЙ ПРОПУСК</div>
                        <div class="card-progress">
                            <div class="card-progress-bar">
                                <div class="card-progress-fill" style="width:${player.bpProgress}%"></div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <span>${player.bpProgress}%</span>
                            <span>${player.bpLevel}/50</span>
                        </div>
                    </div>
                    
                    <!-- ЕЖЕДНЕВНАЯ НАГРАДА -->
                    <div class="lobby-card-v2 daily-card" onclick="claimDailyReward()">
                        <div class="card-title">📅 ЕЖЕДНЕВНАЯ НАГРАДА</div>
                        <div class="daily-timer" id="dailyTimer">23:59:59</div>
                        <div class="daily-badge">3</div>
                    </div>
                </div>
                
                <!-- ЦЕНТР (ПЕРСОНАЖ + РЕЖИМЫ) -->
                <div class="lobby-center-v2">
                    <div class="character-display-v2">
                        <div class="character-shadow-v2"></div>
                        <div class="character-model-v2">👤</div>
                        <div class="character-glow-v2"></div>
                    </div>
                    
                    <!-- РЕЖИМЫ ИГРЫ -->
                    <div class="lobby-modes-v2">
                        <button class="mode-btn-v2 active" onclick="selectMode('rating')">
                            🏆 РЕЙТИНГ
                        </button>
                        <button class="mode-btn-v2" onclick="selectMode('casual')">
                            🎮 ОБЫЧНЫЙ
                        </button>
                        <button class="mode-btn-v2" onclick="selectMode('deathmatch')">
                            💀 БОЙНЯ
                        </button>
                    </div>
                </div>
                
                <!-- ПРАВАЯ КОЛОНКА -->
                <div class="lobby-right-v2">
                    <button class="lobby-btn-right" onclick="openTeam()">
                        <span>👥</span> КОМАНДА
                    </button>
                    <button class="lobby-btn-right" onclick="openFriends()">
                        <span>👤</span> ДРУЗЬЯ
                    </button>
                    <button class="lobby-btn-right" onclick="openClan()">
                        <span>🛡️</span> КЛАН
                    </button>
                </div>
            </div>
            
            <!-- ===== НИЖНЯЯ ПАНЕЛЬ ===== -->
            <div class="lobby-footer-v2">
                <!-- КНОПКА МЕНЮ -->
                <button class="menu-btn-v2" onclick="toggleSideMenu()">
                    <span>≡</span> МЕНЮ
                </button>
                
                <!-- КВАДРАТНАЯ КНОПКА СТАРТ -->
                <button class="start-btn-v2" onclick="quickPlay()">
                    <span class="start-icon">⚡</span>
                    <span class="start-text">СТАРТ</span>
                </button>
            </div>
        </div>
        
        <!-- БОКОВОЕ МЕНЮ (СВАЙП ВЛЕВО) -->
        <div class="side-menu-v2" id="sideMenu">
            <div class="side-menu-header-v2">
                <button class="side-menu-close" onclick="toggleSideMenu()">✕</button>
                <span>МЕНЮ</span>
            </div>
            <div class="side-menu-items-v2">
                <button class="side-item-v2" onclick="openProfile()">
                    <span>👤</span> Профиль
                </button>
                <button class="side-item-v2" onclick="openStats()">
                    <span>📊</span> Статистика
                </button>
                <button class="side-item-v2" onclick="openAchievements()">
                    <span>🏅</span> Достижения
                </button>
                <button class="side-item-v2" onclick="openRanks()">
                    <span>🏆</span> Ранги
                </button>
                <button class="side-item-v2" onclick="openMaps()">
                    <span>🗺️</span> Карты
                </button>
                <button class="side-item-v2" onclick="openSettings()">
                    <span>⚙️</span> Настройки
                </button>
                <button class="side-item-v2 logout" onclick="exitGame()">
                    <span>🚪</span> Выйти
                </button>
            </div>
        </div>
    `;
    
    // Добавляем стили
    injectLobbyStylesV2();
    
    // Запускаем таймер
    startDailyTimer();
    
    // Показываем экран
    showScreen('mainMenu');
}

// ===================================================================
// СТИЛИ (КВАДРАТНЫЙ СТАРТ + ВСЁ ОСТАЛЬНОЕ)
// ===================================================================

function injectLobbyStylesV2() {
    const style = document.createElement('style');
    style.textContent = `
        .lobby-container-v2 {
            width: 100%;
            min-height: 100vh;
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
            display: flex;
            flex-direction: column;
            padding: 12px 15px;
            position: relative;
        }
        
        /* ВЕРХНЯЯ ПАНЕЛЬ */
        .lobby-header-v2 {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .lobby-profile-v2 {
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(20, 25, 40, 0.85);
            backdrop-filter: blur(10px);
            padding: 10px 15px;
            border-radius: 50px;
            border: 1px solid #ffd70040;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .lobby-profile-v2:active {
            background: #ffd70020;
            transform: scale(0.98);
        }
        
        .profile-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid #ffd700;
            background: linear-gradient(135deg, #2a2a4a, #1a1a2e);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            box-shadow: 0 0 20px #ffd70040;
        }
        
        .profile-info {
            min-width: 140px;
        }
        
        .profile-name {
            font-weight: bold;
            color: white;
            font-size: 15px;
        }
        
        .profile-rank {
            color: #ffd700;
            font-size: 12px;
            margin: 2px 0;
        }
        
        .profile-level-container {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .profile-level-bar {
            flex: 1;
            height: 4px;
            background: #333;
            border-radius: 2px;
            overflow: hidden;
        }
        
        .profile-level-fill {
            height: 100%;
            background: linear-gradient(90deg, #ffd700, #ff8c00);
            border-radius: 2px;
        }
        
        .profile-level-text {
            color: #ffd700;
            font-size: 11px;
            font-weight: bold;
        }
        
        .lobby-resources-v2 {
            display: flex;
            gap: 12px;
            background: rgba(20, 25, 40, 0.85);
            backdrop-filter: blur(10px);
            padding: 10px 20px;
            border-radius: 50px;
            border: 1px solid #ffd70040;
        }
        
        .resource-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: bold;
            color: #ffd700;
            font-size: 16px;
        }
        
        .lobby-header-icons-v2 {
            display: flex;
            gap: 8px;
        }
        
        .icon-btn {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: rgba(20, 25, 40, 0.85);
            backdrop-filter: blur(10px);
            border: 1px solid #ffd70040;
            color: white;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .icon-btn:active {
            background: #ffd70020;
        }
        
        /* ОСНОВНОЙ КОНТЕНТ */
        .lobby-main-v2 {
            flex: 1;
            display: flex;
            justify-content: space-between;
            gap: 15px;
        }
        
        /* ЛЕВАЯ КОЛОНКА */
        .lobby-left-v2 {
            width: 170px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .lobby-btn-left, .lobby-btn-right {
            padding: 12px;
            background: rgba(26, 26, 46, 0.9);
            border: 1px solid #ffd70040;
            border-radius: 12px;
            color: white;
            font-size: 13px;
            font-weight: bold;
            text-align: left;
            cursor: pointer;
            backdrop-filter: blur(5px);
            transition: all 0.2s;
        }
        
        .lobby-btn-left span, .lobby-btn-right span {
            margin-right: 8px;
        }
        
        .lobby-btn-left:active, .lobby-btn-right:active {
            background: #ffd70020;
            border-color: #ffd700;
        }
        
        .lobby-card-v2 {
            background: rgba(26, 26, 46, 0.9);
            border: 1px solid #ffd70040;
            border-radius: 12px;
            padding: 12px;
            backdrop-filter: blur(5px);
            cursor: pointer;
            position: relative;
        }
        
        .card-title {
            color: #ffd700;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .card-progress-bar {
            height: 5px;
            background: #333;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 5px;
        }
        
        .card-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ffd700, #ff8c00);
            border-radius: 3px;
        }
        
        .card-footer {
            display: flex;
            justify-content: space-between;
            color: #aaa;
            font-size: 11px;
        }
        
        .daily-card {
            margin-top: 5px;
        }
        
        .daily-timer {
            color: white;
            font-size: 18px;
            font-weight: bold;
        }
        
        .daily-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            width: 24px;
            height: 24px;
            background: #e74c3c;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid #1a1a2e;
        }
        
        /* ЦЕНТР */
        .lobby-center-v2 {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .character-display-v2 {
            position: relative;
            width: 200px;
            height: 220px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .character-shadow-v2 {
            position: absolute;
            bottom: 10px;
            width: 120px;
            height: 15px;
            background: radial-gradient(ellipse, #ffd70030, transparent);
            border-radius: 50%;
        }
        
        .character-model-v2 {
            font-size: 140px;
            filter: drop-shadow(0 0 30px #ffd70060);
            animation: characterIdle 3s ease-in-out infinite;
        }
        
        @keyframes characterIdle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        
        .character-glow-v2 {
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, #ffd70020, transparent 70%);
            border-radius: 50%;
        }
        
        .lobby-modes-v2 {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .mode-btn-v2 {
            padding: 10px 18px;
            background: rgba(26, 26, 46, 0.9);
            border: 1px solid #3a4a5a;
            border-radius: 30px;
            color: #aaa;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            backdrop-filter: blur(5px);
            transition: all 0.2s;
        }
        
        .mode-btn-v2.active {
            background: #ffd700;
            color: black;
            border-color: #ffd700;
        }
        
        /* ПРАВАЯ КОЛОНКА */
        .lobby-right-v2 {
            width: 170px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        /* НИЖНЯЯ ПАНЕЛЬ */
        .lobby-footer-v2 {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 15px;
        }
        
        .menu-btn-v2 {
            padding: 12px 25px;
            background: rgba(26, 26, 46, 0.9);
            border: 2px solid #ffd700;
            border-radius: 15px;
            color: #ffd700;
            font-weight: bold;
            font-size: 18px;
            cursor: pointer;
        }
        
        .menu-btn-v2 span {
            margin-right: 8px;
            font-size: 22px;
        }
        
        /* КВАДРАТНАЯ КНОПКА СТАРТ */
        .start-btn-v2 {
            width: 160px;
            height: 80px;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            border: 3px solid #ffd700;
            border-radius: 20px;
            box-shadow: 0 0 40px #e74c3c80;
            color: white;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            animation: startPulse 2s infinite;
        }
        
        .start-btn-v2:active {
            transform: scale(0.95);
        }
        
        .start-icon {
            font-size: 30px;
        }
        
        .start-text {
            font-size: 22px;
            letter-spacing: 2px;
        }
        
        @keyframes startPulse {
            0%, 100% { box-shadow: 0 0 40px #e74c3c80; }
            50% { box-shadow: 0 0 60px #e74c3c, 0 0 80px #ffd70040; }
        }
        
        /* БОКОВОЕ МЕНЮ */
        .side-menu-v2 {
            position: fixed;
            top: 0;
            left: 0;
            width: 280px;
            height: 100%;
            background: linear-gradient(135deg, #1a1a2e, #0a0a0f);
            border-right: 1px solid #ffd70040;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.3s ease-out;
            box-shadow: 5px 0 30px rgba(0,0,0,0.5);
        }
        
        .side-menu-v2.open {
            transform: translateX(0);
        }
        
        .side-menu-header-v2 {
            display: flex;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #ffd70040;
            color: #ffd700;
            font-weight: bold;
            font-size: 20px;
        }
        
        .side-menu-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            margin-right: 20px;
        }
        
        .side-menu-items-v2 {
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .side-item-v2 {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: transparent;
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: left;
        }
        
        .side-item-v2:active {
            background: #ffd70020;
        }
        
        .side-item-v2 span {
            font-size: 22px;
            width: 30px;
        }
        
        .side-item-v2.logout {
            color: #e74c3c;
            margin-top: 20px;
            border-top: 1px solid #333;
            padding-top: 20px;
        }
    `;
    document.head.appendChild(style);
}

// ===================================================================
// ФУНКЦИИ
// ===================================================================

function startDailyTimer() {
    const timer = document.getElementById('dailyTimer');
    if (!timer) return;
    
    function update() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        timer.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    update();
    setInterval(update, 1000);
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function selectMode(mode) {
    document.querySelectorAll('.mode-btn-v2').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    localStorage.setItem('selected_mode', mode);
    playSound('click');
}

function quickPlay() {
    showScreen('mapSelectScreen');
    playSound('click');
}

function toggleSideMenu() {
    const menu = document.getElementById('sideMenu');
    if (menu) menu.classList.toggle('open');
}

// Функции для кнопок
function openProfile() {
    showScreen('profileScreen');
    playSound('click');
}

function openInventory() {
    showScreen('inventoryScreen');
    playSound('click');
}

function openShop() {
    showScreen('shopScreen');
    playSound('click');
}

function openCases() {
    showScreen('casesScreen');
    playSound('click');
}

function openBattlepass() {
    showScreen('battlepassScreen');
    playSound('click');
}

function openTeam() {
    showScreen('lobbyScreen');
    playSound('click');
}

function openFriends() {
    showScreen('friendsScreen');
    playSound('click');
}

function openClan() {
    showScreen('clanScreen');
    playSound('click');
}

function openStats() {
    showScreen('statsScreen');
    playSound('click');
}

function openAchievements() {
    showScreen('achievementsScreen');
    playSound('click');
}

function openRanks() {
    showScreen('ranksScreen');
    playSound('click');
}

function openMaps() {
    showScreen('mapSelectScreen');
    playSound('click');
}

function openSettings() {
    showScreen('settingsScreen');
    playSound('click');
}

function openNotifications() {
    showNotification('📧 УВЕДОМЛЕНИЯ', 'У вас 3 новых сообщения', 'info');
    playSound('click');
}

function claimDailyReward() {
    const pixels = parseInt(localStorage.getItem('pixels') || '10000');
    localStorage.setItem('pixels', pixels + 500);
    showNotification('🎁 ЕЖЕДНЕВНАЯ НАГРАДА', '+500 пикселей!', 'success');
    playSound('reward');
    setTimeout(() => openLobby(), 100);
}

function exitGame() {
    if (confirm('Выйти из игры?')) {
        if (typeof signOut === 'function') signOut();
        window.location.href = 'about:blank';
    }
}

function playSound(type) {
    if (typeof window.playSound === 'function') window.playSound(type);
}

function showNotification(title, message, type) {
    if (typeof window.showNotification === 'function') {
        window.showNotification(title, message, type);
    }
}

// ===================================================================
// ЭКСПОРТ
// ===================================================================

window.openLobby = openLobby;
window.selectMode = selectMode;
window.quickPlay = quickPlay;
window.toggleSideMenu = toggleSideMenu;
window.openProfile = openProfile;
window.openInventory = openInventory;
window.openShop = openShop;
window.openCases = openCases;
window.openBattlepass = openBattlepass;
window.openTeam = openTeam;
window.openFriends = openFriends;
window.openClan = openClan;
window.openStats = openStats;
window.openAchievements = openAchievements;
window.openRanks = openRanks;
window.openMaps = openMaps;
window.openSettings = openSettings;
window.openNotifications = openNotifications;
window.claimDailyReward = claimDailyReward;
window.exitGame = exitGame;

console.log('✅ lobby_horizontal.js загружен — Квадратный СТАРТ + рабочий профиль!');