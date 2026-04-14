// ui.js — РАБОЧАЯ ВЕРСИЯ ДЛЯ ТЕЛЕФОНА

// Показать экран
function showScreen(screenId) {
  // Скрываем всё
  document.getElementById('mainMenu').style.display = 'none';
  document.querySelectorAll('.screen').forEach(el => {
    el.style.display = 'none';
  });
  
  // Показываем нужное
  if (screenId === 'mainMenu') {
    document.getElementById('mainMenu').style.display = 'flex';
  } else {
    const target = document.getElementById(screenId);
    if (target) target.style.display = 'flex';
  }
  
  updateBalanceDisplay();
}

// Скрыть все экраны (для совместимости)
function hideAllScreens() {
  document.getElementById('mainMenu').style.display = 'none';
  document.querySelectorAll('.screen').forEach(el => {
    el.style.display = 'none';
  });
}

// Назад в меню
function backToMenu() {
  showScreen('mainMenu');
}

// Обновление баланса
function updateBalanceDisplay() {
  const pixels = localStorage.getItem('pixels') || '10000';
  const coins = localStorage.getItem('coins') || '500';
  
  const pixelEl = document.getElementById('pixelBalance');
  const coinEl = document.getElementById('coinBalance');
  
  if (pixelEl) pixelEl.textContent = parseInt(pixels);
  if (coinEl) coinEl.textContent = parseInt(coins);
}

// Заглушки для отсутствующих функций
function openLobby() {
  const screen = document.getElementById('lobbyScreen');
  screen.innerHTML = `
    <div style="text-align:center; padding:40px;">
      <h2>🎮 ЛОББИ</h2>
      <p>Скоро здесь будет сетевая игра!</p>
      <button onclick="showScreen('mainMenu')">НАЗАД</button>
    </div>
  `;
  showScreen('lobbyScreen');
}

function exitGame() {
  if (confirm('Выйти из игры?')) {
    window.close();
  }
}

function playSound(type) {
  console.log('🔊', type);
}

function showNotification(text) {
  alert(text);
}

// Глобальные переменные для баланса (для совместимости с game.js)
let pixelBalance = parseInt(localStorage.getItem('pixels') || '10000');
let coinBalance = parseInt(localStorage.getItem('coins') || '500');

function updateBalance() {
  localStorage.setItem('pixels', pixelBalance);
  localStorage.setItem('coins', coinBalance);
  updateBalanceDisplay();
}

// При загрузке
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('mainMenu').style.display = 'flex';
  updateBalanceDisplay();
});

// Экспорт
window.showScreen = showScreen;
window.hideAllScreens = hideAllScreens;
window.backToMenu = backToMenu;
window.updateBalanceDisplay = updateBalanceDisplay;
window.openLobby = openLobby;
window.exitGame = exitGame;
window.playSound = playSound;
window.showNotification = showNotification;
window.updateBalance = updateBalance;

// ui.js — добавить в конец файла

// Функция для запуска 3D-режима (заглушка с эффектом)
function launch3DGame(mapId, mode) {
  const map = MAPS.find(m => m.id === mapId);
  
  // Показываем загрузку
  const screen = document.getElementById('gameScreen');
  screen.innerHTML = `
    <div style="text-align:center; padding:20px;">
      <h2 style="color:#ffd700;">${map?.icon || '🎮'} ${map?.name || 'CS:GO FAN'}</h2>
      <div style="font-size:60px; margin:30px 0;">🎯</div>
      <div class="loading-progress">
        <div class="loading-bar" id="threeLoadBar" style="width:0%"></div>
      </div>
      <p id="loadStatus" style="color:#888; margin-top:15px;">Загрузка 3D-движка...</p>
    </div>
  `;
  showScreen('gameScreen');
  
  // Имитация загрузки
  let progress = 0;
  const interval = setInterval(() => {
    progress += 5;
    document.getElementById('threeLoadBar').style.width = progress + '%';
    
    if (progress >= 100) {
      clearInterval(interval);
      document.getElementById('loadStatus').textContent = 'Запуск сцены...';
      
      // Показываем 3D-заглушку
      setTimeout(() => {
        showSimple3DScene(map);
      }, 500);
    }
  }, 50);
}

// Простая 3D-сцена-заглушка (без полноценного Three.js)
function showSimple3DScene(map) {
  const screen = document.getElementById('gameScreen');
  
  screen.innerHTML = `
    <div style="position:relative; width:100%; height:100vh; background:${map?.background || 'linear-gradient(135deg, #1a1a2e, #16213e)'}; overflow:hidden;">
      
      <!-- ИМИТАЦИЯ 3D ОТ ПЕРВОГО ЛИЦА -->
      <div style="position:absolute; bottom:0; width:100%; height:70%; 
                  background:linear-gradient(transparent, rgba(0,0,0,0.5)); 
                  display:flex; flex-direction:column; justify-content:flex-end; align-items:center;">
        
        <!-- ПРИЦЕЛ -->
        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); 
                    width:4px; height:4px; background:#00ff00; border-radius:50%; 
                    box-shadow:0 0 20px #00ff00; z-index:100;"></div>
        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); 
                    width:40px; height:40px; border:2px solid rgba(0,255,0,0.3); border-radius:50%;"></div>
        
        <!-- СТЕНЫ (имитация коридора) -->
        <div style="position:absolute; bottom:0; left:0; width:20%; height:60%; 
                    background:linear-gradient(90deg, #2a2a3a, #1a1a2a); 
                    transform:skewY(5deg); transform-origin:bottom;"></div>
        <div style="position:absolute; bottom:0; right:0; width:20%; height:60%; 
                    background:linear-gradient(270deg, #2a2a3a, #1a1a2a); 
                    transform:skewY(-5deg); transform-origin:bottom;"></div>
        
        <!-- ПОЛ -->
        <div style="position:absolute; bottom:0; width:100%; height:30%; 
                    background:linear-gradient(transparent, #1a1a2e);"></div>
        
        <!-- МИШЕНИ (имитация врагов) -->
        <div style="position:absolute; bottom:30%; left:40%; 
                    width:50px; height:100px; background:#8b0000; 
                    border-radius:10px 10px 0 0; opacity:0.7;
                    box-shadow:0 0 30px #ff000040;"></div>
        <div style="position:absolute; bottom:35%; right:35%; 
                    width:50px; height:100px; background:#8b0000; 
                    border-radius:10px 10px 0 0; opacity:0.5;"></div>
        
        <!-- ОРУЖИЕ В РУКАХ -->
        <div style="position:absolute; bottom:-20px; right:-50px; 
                    width:300px; height:150px; 
                    background:linear-gradient(45deg, #3a3a4a, #2a2a3a);
                    transform:rotate(-15deg); 
                    border-radius:10px 50px 10px 10px;
                    border:2px solid #555;"></div>
      </div>
      
      <!-- МИНИ-КАРТА -->
      <div style="position:absolute; top:20px; right:20px; 
                  width:120px; height:120px; background:rgba(0,0,0,0.5); 
                  border:2px solid #ffd700; border-radius:50%;
                  display:flex; align-items:center; justify-content:center;">
        <span style="color:#ffd700; font-size:12px;">${map?.name || 'DUST II'}</span>
      </div>
      
      <!-- ХП И ПАТРОНЫ -->
      <div style="position:absolute; bottom:20px; left:20px; color:white; text-shadow:0 0 10px black;">
        <div style="font-size:24px;">❤️ 100</div>
        <div style="font-size:18px; color:#ffd700;">🔫 30 / 90</div>
      </div>
      
      <!-- КНОПКА ВЫХОДА -->
      <button onclick="showScreen('mainMenu')" 
              style="position:absolute; top:20px; left:20px; 
                     background:rgba(0,0,0,0.7); color:white; 
                     border:1px solid #ffd700; padding:10px 20px; 
                     border-radius:10px; z-index:1000;">
        ↩ В МЕНЮ
      </button>
      
      <!-- СТРЕЛЬБА ПО КЛИКУ -->
      <div style="position:absolute; bottom:30px; right:30px; 
                  width:80px; height:80px; background:rgba(255,255,255,0.1); 
                  border:2px solid white; border-radius:50%; 
                  display:flex; align-items:center; justify-content:center;
                  z-index:100;" onclick="shootEffect3D()">
        <span style="font-size:30px;">🔫</span>
      </div>
    </div>
  `;
  
  // Блокируем скролл
  document.body.style.overflow = 'hidden';
  
  // Запускаем звук начала матча
  playSound('win');
  vibrate(50);
}

// Эффект выстрела в 3D-режиме
function shootEffect3D() {
  // Вспышка
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255,255,200,0.3);
    pointer-events: none;
    z-index: 999;
    animation: flashFade 0.1s;
  `;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 100);
  
  // Звук и вибрация
  playSound('click');
  vibrate(20);
  
  // Анимация прицела
  const crosshair = document.querySelector('[style*="box-shadow:0 0 20px #00ff00"]');
  if (crosshair) {
    crosshair.style.transform = 'translate(-50%, -50%) scale(1.5)';
    setTimeout(() => crosshair.style.transform = 'translate(-50%, -50%) scale(1)', 50);
  }
  
  // Уменьшаем патроны
  const ammoEl = document.querySelector('[style*="🔫 30 / 90"]');
  if (ammoEl) {
    const match = ammoEl.textContent.match(/(\d+) \/ 90/);
    if (match) {
      const current = parseInt(match[1]) - 1;
      ammoEl.textContent = `🔫 ${current} / 90`;
    }
  }
}

// Экспорт
window.launch3DGame = launch3DGame;
window.shootEffect3D = shootEffect3D;