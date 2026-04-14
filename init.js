// init.js — ИНИЦИАЛИЗАЦИЯ ИГРЫ

// Глобальные ресурсы
let gameResources = {
  pixels: CONFIG.startPixels,
  coins: CONFIG.startCoins,
  gems: CONFIG.startGems
};

// Загрузка ресурсов
function loadResources() {
  const saved = loadData('resources');
  if (saved) {
    gameResources = { ...gameResources, ...saved };
  }
  updateResourcesUI();
}

// Сохранение ресурсов
function saveResources() {
  saveData('resources', gameResources);
}

// Обновление UI ресурсов
function updateResourcesUI() {
  const pixelEl = document.getElementById('pixelDisplay');
  const coinEl = document.getElementById('coinDisplay');
  const gemEl = document.getElementById('gemDisplay');
  
  if (pixelEl) pixelEl.textContent = formatNumber(gameResources.pixels);
  if (coinEl) coinEl.textContent = formatNumber(gameResources.coins);
  if (gemEl) gemEl.textContent = formatNumber(gameResources.gems);
}

// Добавление предмета в инвентарь
function addItemToInventory(item) {
  const inventory = loadData('inventory', []);
  inventory.push(item);
  saveData('inventory', inventory);
}

// Закрытие модального окна
function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

// Скрытие загрузочного экрана
function hideLoadingScreen() {
  const loading = document.getElementById('loadingScreen');
  if (loading) {
    loading.style.opacity = '0';
    setTimeout(() => {
      loading.style.display = 'none';
    }, 500);
  }
}

// Параллакс эффект
function initParallax() {
  const layer1 = document.getElementById('bgLayer1');
  const layer2 = document.getElementById('bgLayer2');
  
  if (!layer1 || !layer2) return;
  
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    
    layer1.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    layer2.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
  });
  
  // Для мобильных - гироскоп
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (!e.gamma || !e.beta) return;
      
      const x = Math.max(-30, Math.min(30, e.gamma)) / 30 * 15;
      const y = Math.max(-30, Math.min(30, e.beta)) / 30 * 15;
      
      layer1.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      layer2.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
    });
  }
}

// Прогресс загрузки
function simulateLoading() {
  const bar = document.getElementById('loadingBar');
  if (!bar) return;
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      bar.style.width = '100%';
      clearInterval(interval);
      setTimeout(hideLoadingScreen, 300);
    } else {
      bar.style.width = progress + '%';
    }
  }, 100);
}

// Сброс всего прогресса
function resetAllProgress() {
  if (!confirm('⚠️ ТОЧНО СБРОСИТЬ ВЕСЬ ПРОГРЕСС? Это действие нельзя отменить!')) return;
  
  localStorage.clear();
  
  gameResources = {
    pixels: CONFIG.startPixels,
    coins: CONFIG.startCoins,
    gems: CONFIG.startGems
  };
  
  playerData = {
    name: 'PLAYER',
    avatar: '👤',
    level: 1,
    xp: 0,
    elo: 0,
    wins: 0,
    losses: 0,
    kills: 0,
    deaths: 0,
    headshots: 0,
    mvps: 0,
    matches: 0,
    playTime: 0,
    lastDaily: null,
    loginStreak: 0
  };
  
  saveResources();
  savePlayerData();
  saveData('inventory', []);
  saveData('settings', CONFIG.defaultSettings);
  
  updateResourcesUI();
  updatePlayerUI();
  updateRankDisplay();
  
  showNotification('🔄 СБРОС', 'Весь прогресс сброшен!', 'warning');
  showScreen('mainMenu');
}

// Инициализация всего
function initGame() {
  // Создаём частицы
  createParticles();
  
  // Загружаем данные
  loadResources();
  initPlayer();
  
  // Инициализируем параллакс
  initParallax();
  
  // Симуляция загрузки
  simulateLoading();
  
  // Показываем приветствие
  setTimeout(() => {
    const rank = getCurrentRank();
    showNotification(
      `👋 ДОБРО ПОЖАЛОВАТЬ, ${playerData.name}!`,
      `Ранг: ${rank.name} • Уровень: ${playerData.level}`,
      'success'
    );
  }, 500);
  
  console.log('%c🎮 CS:GO FAN MOBILE', 'color:#ffd700; font-size:20px; font-weight:bold;');
  console.log('%cВерсия 1.0.0 • Сделано с душой', 'color:#888; font-size:12px;');
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', initGame);

// Экспорт
window.gameResources = gameResources;
window.loadResources = loadResources;
window.saveResources = saveResources;
window.updateResourcesUI = updateResourcesUI;
window.addItemToInventory = addItemToInventory;
window.closeModal = closeModal;
window.resetAllProgress = resetAllProgress;