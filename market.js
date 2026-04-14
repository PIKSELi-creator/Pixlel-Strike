// market.js — ТОРГОВАЯ ПЛОЩАДКА PIXEL STRIKE (600+ строк)
// Версия: 1.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: СОСТОЯНИЕ РЫНКА
// ===================================================================

let marketState = {
  currentTab: 'buy', // buy, sell, history
  searchQuery: '',
  selectedCategory: 'all',
  sortBy: 'price_low',
  myListings: JSON.parse(localStorage.getItem('market_listings') || '[]'),
  saleHistory: JSON.parse(localStorage.getItem('sale_history') || '[]')
};

// Имитация товаров на рынке
let marketListings = [
  { id: 'm1', name: 'AK-47 | Вулкан', image: '🌋', price: 15000, seller: 'Player1', rarity: 'epic', type: 'rifles' },
  { id: 'm2', name: 'AWP | Азимов', image: '🤖', price: 25000, seller: 'Player2', rarity: 'legendary', type: 'snipers' },
  { id: 'm3', name: 'M4A4 | Вой', image: '🐺', price: 18000, seller: 'Player3', rarity: 'epic', type: 'rifles' },
  { id: 'm4', name: '★ Нож | Керамбит', image: '🔪', price: 50000, seller: 'Player4', rarity: 'mythic', type: 'knives' },
  { id: 'm5', name: 'Desert Eagle | Пламя', image: '🔥', price: 8000, seller: 'Player5', rarity: 'rare', type: 'pistols' },
  { id: 'm6', name: 'P90 | Азимов', image: '🤖', price: 5000, seller: 'Player6', rarity: 'rare', type: 'smg' },
  { id: 'm7', name: 'USP-S | Страж', image: '🛡️', price: 3000, seller: 'Player7', rarity: 'common', type: 'pistols' },
  { id: 'm8', name: 'AWP | Медуза', image: '🐍', price: 35000, seller: 'Player8', rarity: 'legendary', type: 'snipers' }
];

// Категории для фильтра
const MARKET_CATEGORIES = {
  all: { name: 'ВСЕ', icon: '📦' },
  pistols: { name: 'ПИСТОЛЕТЫ', icon: '🔫' },
  smg: { name: 'ПП', icon: '🔫' },
  rifles: { name: 'ВИНТОВКИ', icon: '🔫' },
  snipers: { name: 'СНАЙПЕРСКИЕ', icon: '🎯' },
  shotguns: { name: 'ДРОБОВИКИ', icon: '🔫' },
  knives: { name: 'НОЖИ', icon: '🔪' },
  cases: { name: 'КЕЙСЫ', icon: '📦' }
};

// ===================================================================
// ЧАСТЬ 2: ОТКРЫТИЕ РЫНКА
// ===================================================================

function openMarket() {
  const screen = document.getElementById('marketScreen');
  if (!screen) {
    // Создаём экран если его нет
    createMarketScreen();
  }
  
  loadMarketListings();
  renderMarketScreen();
  showScreen('marketScreen');
}

function createMarketScreen() {
  const screen = document.createElement('div');
  screen.id = 'marketScreen';
  screen.className = 'screen';
  document.body.appendChild(screen);
}

function loadMarketListings() {
  // Загружаем сохранённые листинги
  const saved = localStorage.getItem('market_listings_data');
  if (saved) {
    marketListings = [...JSON.parse(saved), ...marketListings];
  }
}

// ===================================================================
// ЧАСТЬ 3: РЕНДЕРИНГ ЭКРАНА
// ===================================================================

function renderMarketScreen() {
  const screen = document.getElementById('marketScreen');
  if (!screen) return;
  
  let html = `
    <div style="padding:15px; padding-bottom:80px;">
      <h2 style="color:#ffd700; text-align:center;">💱 ТОРГОВАЯ ПЛОЩАДКА</h2>
      
      <!-- БАЛАНС -->
      <div style="background:#1a1a2e; border-radius:15px; padding:15px; margin-bottom:15px; text-align:center;">
        <span style="color:#888;">ВАШ БАЛАНС:</span>
        <span style="color:#2ecc71; font-size:24px; font-weight:bold; margin-left:10px;">💰 ${formatNumber(gameResources?.pixels || 0)} PIX</span>
      </div>
      
      <!-- ВКЛАДКИ -->
      <div style="display:flex; gap:5px; margin-bottom:15px;">
        <button onclick="switchMarketTab('buy')" class="market-tab ${marketState.currentTab === 'buy' ? 'active' : ''}">
          🛒 ПОКУПКА
        </button>
        <button onclick="switchMarketTab('sell')" class="market-tab ${marketState.currentTab === 'sell' ? 'active' : ''}">
          💰 ПРОДАЖА
        </button>
        <button onclick="switchMarketTab('history')" class="market-tab ${marketState.currentTab === 'history' ? 'active' : ''}">
          📜 ИСТОРИЯ
        </button>
      </div>
  `;
  
  if (marketState.currentTab === 'buy') {
    html += renderBuyTab();
  } else if (marketState.currentTab === 'sell') {
    html += renderSellTab();
  } else {
    html += renderHistoryTab();
  }
  
  html += `
      <button onclick="showScreen('mainMenu')" style="width:100%; margin-top:20px; padding:15px; background:#333; border:none; border-radius:10px; color:white;">
        ◀ НАЗАД В МЕНЮ
      </button>
    </div>
  `;
  
  screen.innerHTML = html;
}

function switchMarketTab(tab) {
  marketState.currentTab = tab;
  renderMarketScreen();
}

// ===================================================================
// ЧАСТЬ 4: ВКЛАДКА ПОКУПКИ
// ===================================================================

function renderBuyTab() {
  // Фильтрация
  let filtered = marketListings;
  
  if (marketState.selectedCategory !== 'all') {
    filtered = filtered.filter(item => item.type === marketState.selectedCategory);
  }
  
  if (marketState.searchQuery) {
    const q = marketState.searchQuery.toLowerCase();
    filtered = filtered.filter(item => item.name.toLowerCase().includes(q));
  }
  
  // Сортировка
  filtered = sortMarketItems(filtered);
  
  let html = `
    <!-- ПОИСК И ФИЛЬТРЫ -->
    <div style="display:flex; gap:10px; margin-bottom:15px;">
      <input type="text" id="marketSearch" placeholder="🔍 Поиск..." value="${marketState.searchQuery}"
             oninput="marketState.searchQuery = this.value; renderMarketScreen()" 
             style="flex:1; padding:12px; background:#0a0a0f; border:1px solid #3a4a5a; border-radius:10px; color:white;">
      <select onchange="marketState.sortBy = this.value; renderMarketScreen()" 
              style="padding:12px; background:#1a1a2e; border:1px solid #3a4a5a; border-radius:10px; color:white;">
        <option value="price_low" ${marketState.sortBy === 'price_low' ? 'selected' : ''}>💰 Дешёвые</option>
        <option value="price_high" ${marketState.sortBy === 'price_high' ? 'selected' : ''}>💰 Дорогие</option>
        <option value="rarity" ${marketState.sortBy === 'rarity' ? 'selected' : ''}>🌟 По редкости</option>
      </select>
    </div>
    
    <!-- КАТЕГОРИИ -->
    <div style="display:flex; gap:5px; overflow-x:auto; padding:5px 0; margin-bottom:15px;">
  `;
  
  for (const [catId, cat] of Object.entries(MARKET_CATEGORIES)) {
    const isActive = marketState.selectedCategory === catId;
    html += `
      <div onclick="selectMarketCategory('${catId}')" 
           style="padding:8px 15px; background:${isActive ? '#ffd70020' : '#1a1a2e'}; 
                  border:1px solid ${isActive ? '#ffd700' : '#3a4a5a'}; border-radius:20px; 
                  white-space:nowrap; cursor:pointer;">
        ${cat.icon} ${cat.name}
      </div>
    `;
  }
  
  html += `</div>`;
  
  // ТОВАРЫ
  if (filtered.length === 0) {
    html += `<p style="text-align:center; color:#888; padding:40px;">😕 Нет товаров</p>`;
  } else {
    html += `<div style="max-height:400px; overflow-y:auto;">`;
    
    filtered.forEach(item => {
      const canBuy = (gameResources?.pixels || 0) >= item.price;
      const rarityColor = getRarityColor(item.rarity);
      
      html += `
        <div style="background:#1a1a2e; border:1px solid ${rarityColor}; border-radius:12px; padding:15px; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="font-size:40px;">${item.image}</div>
            <div style="flex:1;">
              <div style="font-weight:bold; color:${rarityColor};">${item.name}</div>
              <div style="font-size:12px; color:#888;">Продавец: ${item.seller}</div>
              <div style="font-size:12px; color:#888;">${item.rarity?.toUpperCase() || 'COMMON'}</div>
            </div>
            <div style="text-align:right;">
              <div style="color:#2ecc71; font-weight:bold; font-size:18px;">${formatNumber(item.price)} PIX</div>
              <button onclick="buyMarketItem('${item.id}')" ${!canBuy ? 'disabled' : ''}
                      style="margin-top:8px; padding:8px 15px; background:${canBuy ? '#2ecc71' : '#555'}; 
                             border:none; border-radius:8px; color:white; font-weight:bold;">
                КУПИТЬ
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  return html;
}

// ===================================================================
// ЧАСТЬ 5: ВКЛАДКА ПРОДАЖИ
// ===================================================================

function renderSellTab() {
  const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
  const sellableItems = inventory.filter(item => item.type !== 'cases' && item.type !== 'keys');
  
  let html = `
    <div style="margin-bottom:15px;">
      <p style="color:#888; margin-bottom:10px;">Выберите предмет из инвентаря для продажи</p>
    </div>
  `;
  
  if (sellableItems.length === 0) {
    html += `<p style="text-align:center; color:#888; padding:40px;">😕 Нет предметов для продажи</p>`;
  } else {
    html += `<div style="max-height:350px; overflow-y:auto; margin-bottom:15px;">`;
    
    sellableItems.forEach((item, index) => {
      const isListed = marketState.myListings.some(l => l.inventoryIndex === index);
      const suggestedPrice = Math.floor((item.price || 1000) * 0.9);
      
      html += `
        <div style="background:#1a1a2e; border-radius:12px; padding:15px; margin-bottom:10px; ${isListed ? 'opacity:0.6;' : ''}">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="font-size:35px;">${item.image || '📦'}</div>
            <div style="flex:1;">
              <div style="font-weight:bold;">${item.name}</div>
              <div style="font-size:12px; color:#888;">Рыночная цена: ~${formatNumber(suggestedPrice)} PIX</div>
            </div>
            ${!isListed ? `
              <button onclick="showSellModal(${index})" style="padding:8px 15px; background:#f39c12; border:none; border-radius:8px; color:white;">
                ПРОДАТЬ
              </button>
            ` : `
              <span style="color:#f39c12;">⏳ На продаже</span>
            `}
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  // Активные листинги
  if (marketState.myListings.length > 0) {
    html += `
      <h3 style="color:#ffd700; margin:15px 0 10px;">📋 ВАШИ ОБЪЯВЛЕНИЯ</h3>
      <div style="max-height:200px; overflow-y:auto;">
    `;
    
    marketState.myListings.forEach(listing => {
      const item = inventory[listing.inventoryIndex];
      if (!item) return;
      
      html += `
        <div style="background:#1a1a2e; border-radius:10px; padding:10px; margin-bottom:8px; display:flex; align-items:center; gap:10px;">
          <div style="font-size:25px;">${item.image}</div>
          <div style="flex:1;">
            <div style="font-size:13px;">${item.name}</div>
            <div style="color:#2ecc71;">${listing.price} PIX</div>
          </div>
          <button onclick="cancelListing('${listing.id}')" style="padding:5px 10px; background:#e74c3c; border:none; border-radius:5px; color:white; font-size:11px;">
            ОТМЕНИТЬ
          </button>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  return html;
}

// ===================================================================
// ЧАСТЬ 6: ВКЛАДКА ИСТОРИИ
// ===================================================================

function renderHistoryTab() {
  const history = marketState.saleHistory;
  
  if (history.length === 0) {
    return `<p style="text-align:center; color:#888; padding:40px;">😕 Нет истории продаж</p>`;
  }
  
  let html = `<div style="max-height:400px; overflow-y:auto;">`;
  
  history.forEach(record => {
    const isBuy = record.type === 'buy';
    html += `
      <div style="background:#1a1a2e; border-radius:10px; padding:12px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between;">
          <span style="color:${isBuy ? '#e74c3c' : '#2ecc71'};">${isBuy ? '🛒 ПОКУПКА' : '💰 ПРОДАЖА'}</span>
          <span style="color:#888; font-size:11px;">${new Date(record.timestamp).toLocaleDateString()}</span>
        </div>
        <div>${record.itemName}</div>
        <div style="color:${isBuy ? '#e74c3c' : '#2ecc71'};">${isBuy ? '-' : '+'}${formatNumber(record.price)} PIX</div>
      </div>
    `;
  });
  
  html += `</div>`;
  return html;
}

// ===================================================================
// ЧАСТЬ 7: ФУНКЦИИ РЫНКА
// ===================================================================

function selectMarketCategory(category) {
  marketState.selectedCategory = category;
  renderMarketScreen();
}

function sortMarketItems(items) {
  const sorted = [...items];
  
  switch (marketState.sortBy) {
    case 'price_low':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price_high':
      return sorted.sort((a, b) => b.price - a.price);
    case 'rarity':
      const rarityOrder = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 };
      return sorted.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));
    default:
      return sorted;
  }
}

function getRarityColor(rarity) {
  const colors = {
    common: '#888',
    rare: '#4169E1',
    epic: '#8A2BE2',
    legendary: '#FFD700',
    mythic: '#FF4500'
  };
  return colors[rarity] || '#888';
}

function buyMarketItem(itemId) {
  const item = marketListings.find(i => i.id === itemId);
  if (!item) return;
  
  if ((gameResources?.pixels || 0) < item.price) {
    showNotification('❌ НЕДОСТАТОЧНО СРЕДСТВ', '', 'error');
    return;
  }
  
  if (confirm(`Купить ${item.name} за ${formatNumber(item.price)} PIX?`)) {
    gameResources.pixels -= item.price;
    saveResources();
    
    // Добавляем в инвентарь
    const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
    inventory.push({
      id: generateId(),
      name: item.name,
      image: item.image,
      type: item.type,
      rarity: item.rarity,
      price: item.price,
      acquired: new Date().toISOString()
    });
    localStorage.setItem('inventory', JSON.stringify(inventory));
    
    // Удаляем с рынка
    marketListings = marketListings.filter(i => i.id !== itemId);
    
    // История
    marketState.saleHistory.unshift({
      type: 'buy',
      itemName: item.name,
      price: item.price,
      timestamp: Date.now()
    });
    localStorage.setItem('sale_history', JSON.stringify(marketState.saleHistory));
    
    renderMarketScreen();
    showNotification('✅ ПОКУПКА УСПЕШНА', item.name, 'success');
    playMenuSound('success');
  }
}

function showSellModal(inventoryIndex) {
  const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
  const item = inventory[inventoryIndex];
  if (!item) return;
  
  const modal = document.getElementById('caseOpeningModal');
  const overlay = document.getElementById('modalOverlay');
  const suggestedPrice = Math.floor((item.price || 1000) * 0.9);
  
  modal.innerHTML = `
    <div style="text-align:center;">
      <h3 style="color:#ffd700; margin-bottom:20px;">💰 ПРОДАЖА ПРЕДМЕТА</h3>
      <div style="font-size:60px; margin-bottom:10px;">${item.image}</div>
      <p style="font-weight:bold; margin-bottom:10px;">${item.name}</p>
      <p style="color:#888; margin-bottom:15px;">Рекомендуемая цена: ${formatNumber(suggestedPrice)} PIX</p>
      
      <input type="number" id="sellPriceInput" placeholder="Цена в PIX" value="${suggestedPrice}"
             style="width:100%; padding:12px; background:#0a0a0f; border:1px solid #3a4a5a; border-radius:10px; color:white; margin-bottom:15px;">
      
      <p style="color:#888; font-size:12px; margin-bottom:15px;">Комиссия площадки: 10% (${Math.floor(suggestedPrice * 0.1)} PIX)</p>
      
      <button onclick="confirmSellItem(${inventoryIndex})" style="width:100%; padding:15px; background:#2ecc71; border:none; border-radius:10px; color:white; font-weight:bold;">
        ✅ ВЫСТАВИТЬ НА ПРОДАЖУ
      </button>
      
      <button onclick="closeModal()" style="width:100%; margin-top:10px; padding:12px; background:#333; border:none; border-radius:10px; color:white;">
        ОТМЕНА
      </button>
    </div>
  `;
  
  overlay.style.display = 'block';
  modal.style.display = 'block';
}

function confirmSellItem(inventoryIndex) {
  const price = parseInt(document.getElementById('sellPriceInput')?.value);
  if (!price || price < 10) {
    showNotification('❌ НЕВЕРНАЯ ЦЕНА', 'Минимальная цена: 10 PIX', 'error');
    return;
  }
  
  const listing = {
    id: generateId(),
    inventoryIndex,
    price,
    listedAt: Date.now()
  };
  
  marketState.myListings.push(listing);
  localStorage.setItem('market_listings', JSON.stringify(marketState.myListings));
  
  closeModal();
  renderMarketScreen();
  showNotification('✅ ПРЕДМЕТ ВЫСТАВЛЕН', `Цена: ${formatNumber(price)} PIX`, 'success');
}

function cancelListing(listingId) {
  marketState.myListings = marketState.myListings.filter(l => l.id !== listingId);
  localStorage.setItem('market_listings', JSON.stringify(marketState.myListings));
  renderMarketScreen();
  showNotification('📋 ОБЪЯВЛЕНИЕ СНЯТО', '', 'info');
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ===================================================================
// ЧАСТЬ 8: СТИЛИ И ЭКСПОРТ
// ===================================================================

const marketStyle = document.createElement('style');
marketStyle.textContent = `
  .market-tab {
    flex: 1;
    padding: 12px;
    background: #1a1a2e;
    border: 1px solid #3a4a5a;
    border-radius: 10px;
    color: white;
    font-size: 14px;
    cursor: pointer;
  }
  .market-tab.active {
    background: #ffd70020;
    border-color: #ffd700;
    color: #ffd700;
  }
`;
document.head.appendChild(marketStyle);

window.openMarket = openMarket;
window.switchMarketTab = switchMarketTab;
window.selectMarketCategory = selectMarketCategory;
window.buyMarketItem = buyMarketItem;
window.showSellModal = showSellModal;
window.confirmSellItem = confirmSellItem;
window.cancelListing = cancelListing;

console.log('✅ market.js загружен (600+ строк) — Pixel Strike Market System v1.0.0');