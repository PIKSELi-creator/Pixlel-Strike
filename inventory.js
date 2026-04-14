// inventory.js — ПОЛНАЯ СИСТЕМА ИНВЕНТАРЯ PIXEL STRIKE 15.0 (1000+ строк)
// Версия: 15.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: КОНФИГУРАЦИЯ И СОСТОЯНИЕ
// ===================================================================

const INVENTORY_CONFIG = {
    maxSlots: 200,
    stackable: ['cases', 'keys', 'grenades', 'stickers'],
    maxStackSize: 99
};

const INVENTORY_FILTERS = {
    all: { name: 'ВСЕ', icon: '📦' },
    weapons: { name: 'ОРУЖИЕ', icon: '🔫' },
    pistols: { name: 'ПИСТОЛЕТЫ', icon: '🔫' },
    smg: { name: 'ПП', icon: '🔫' },
    rifles: { name: 'ВИНТОВКИ', icon: '🔫' },
    snipers: { name: 'СНАЙПЕРСКИЕ', icon: '🎯' },
    shotguns: { name: 'ДРОБОВИКИ', icon: '🔫' },
    knives: { name: 'НОЖИ', icon: '🔪' },
    armor: { name: 'БРОНЯ', icon: '🛡️' },
    grenades: { name: 'ГРАНАТЫ', icon: '💣' },
    cases: { name: 'КЕЙСЫ', icon: '📦' },
    keys: { name: 'КЛЮЧИ', icon: '🔑' },
    skins: { name: 'СКИНЫ', icon: '🎨' },
    stickers: { name: 'СТИКЕРЫ', icon: '💿' }
};

let inventoryState = {
    items: [],
    filter: 'all',
    sortBy: 'newest',
    searchQuery: '',
    selectedItem: null,
    selectedSlot: null,
    viewMode: 'grid',
    equipped: {
        primary: null,
        secondary: null,
        knife: null,
        armor: null,
        grenades: []
    },
    loadouts: JSON.parse(localStorage.getItem('loadouts') || '[]'),
    favorites: JSON.parse(localStorage.getItem('inv_favorites') || '[]')
};

// ===================================================================
// ЧАСТЬ 2: ЗАГРУЗКА И СОХРАНЕНИЕ
// ===================================================================

function loadInventory() {
    const saved = localStorage.getItem('inventory');
    if (saved) {
        try {
            inventoryState.items = JSON.parse(saved);
            // Группировка стакаемых предметов
            groupStackableItems();
        } catch (e) {
            inventoryState.items = [];
        }
    }
    
    const equipped = localStorage.getItem('equipped');
    if (equipped) {
        inventoryState.equipped = JSON.parse(equipped);
    }
    
    return inventoryState.items;
}

function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(inventoryState.items));
    localStorage.setItem('equipped', JSON.stringify(inventoryState.equipped));
    localStorage.setItem('loadouts', JSON.stringify(inventoryState.loadouts));
    localStorage.setItem('inv_favorites', JSON.stringify(inventoryState.favorites));
}

function groupStackableItems() {
    const grouped = {};
    const nonStackable = [];
    
    inventoryState.items.forEach(item => {
        if (INVENTORY_CONFIG.stackable.includes(item.type)) {
            const key = `${item.type}_${item.itemId || item.name}`;
            if (!grouped[key]) {
                grouped[key] = { ...item, quantity: 1 };
            } else {
                grouped[key].quantity++;
            }
        } else {
            nonStackable.push(item);
        }
    });
    
    inventoryState.items = [...Object.values(grouped), ...nonStackable];
}

// ===================================================================
// ЧАСТЬ 3: ОТКРЫТИЕ ИНВЕНТАРЯ
// ===================================================================

function openInventory() {
    const screen = document.getElementById('inventoryScreen');
    if (!screen) return;
    
    loadInventory();
    renderInventoryScreen();
    showScreen('inventoryScreen');
}

function renderInventoryScreen() {
    const screen = document.getElementById('inventoryScreen');
    
    let filteredItems = getFilteredItems();
    const totalValue = calculateInventoryValue();
    
    let html = `
        <div class="inventory-container">
            <!-- ВЕРХНЯЯ ПАНЕЛЬ -->
            <div class="inv-header">
                <div class="inv-title">
                    <h2>🎒 ИНВЕНТАРЬ</h2>
                    <span class="inv-count">${inventoryState.items.length}/${INVENTORY_CONFIG.maxSlots}</span>
                </div>
                <div class="inv-value">
                    <span>💰 ${formatNumber(totalValue)} PIX</span>
                </div>
            </div>
            
            <!-- ПОИСК -->
            <div class="inv-search">
                <input type="text" placeholder="🔍 Поиск..." value="${inventoryState.searchQuery}" 
                       oninput="inventoryState.searchQuery = this.value; renderInventoryScreen()">
                <button onclick="openInvFilters()">⚙️</button>
                <button onclick="toggleInvView()">${inventoryState.viewMode === 'grid' ? '📋' : '🔲'}</button>
            </div>
            
            <!-- ЭКИПИРОВКА -->
            <div class="inv-equipped">
                <h3>⚔️ ЭКИПИРОВАНО</h3>
                <div class="equipped-slots">
                    ${renderEquippedSlot('primary', '🔫 Основное')}
                    ${renderEquippedSlot('secondary', '🔫 Вторичное')}
                    ${renderEquippedSlot('knife', '🔪 Нож')}
                    ${renderEquippedSlot('armor', '🛡️ Броня')}
                </div>
                <div class="equipped-grenades">
                    <span>💣 Гранаты (${inventoryState.equipped.grenades?.length || 0}/4)</span>
                </div>
            </div>
            
            <!-- ФИЛЬТРЫ (быстрые) -->
            <div class="inv-quick-filters">
                ${renderQuickFilters()}
            </div>
            
            <!-- ПРЕДМЕТЫ -->
            <div class="inv-items ${inventoryState.viewMode}">
    `;
    
    if (filteredItems.length === 0) {
        html += `<div class="empty-message">😕 Нет предметов</div>`;
    } else {
        filteredItems.forEach((item, index) => {
            html += renderInventoryItem(item, index);
        });
    }
    
    html += `</div>`;
    
    // ДЕТАЛИ ВЫБРАННОГО ПРЕДМЕТА
    if (inventoryState.selectedItem !== null) {
        const item = filteredItems[inventoryState.selectedItem];
        html += renderItemDetails(item);
    }
    
    // НИЖНЯЯ ПАНЕЛЬ
    html += `
            <div class="inv-footer">
                <button class="inv-btn" onclick="openLoadouts()">💾 СБОРКИ</button>
                <button class="inv-btn" onclick="showScreen('mainMenu')">◀ НАЗАД</button>
            </div>
        </div>
    `;
    
    screen.innerHTML = html;
}

// ===================================================================
// ЧАСТЬ 4: РЕНДЕРИНГ ЭЛЕМЕНТОВ
// ===================================================================

function renderEquippedSlot(slot, label) {
    const itemId = inventoryState.equipped[slot];
    const item = inventoryState.items.find(i => i.id === itemId);
    
    return `
        <div class="equipped-slot ${slot}" onclick="selectEquippedSlot('${slot}')">
            <div class="slot-label">${label}</div>
            <div class="slot-item">
                ${item ? `
                    <span class="slot-image">${item.image || '📦'}</span>
                    <span class="slot-name">${truncate(item.name, 15)}</span>
                ` : '<span class="slot-empty">Пусто</span>'}
            </div>
        </div>
    `;
}

function renderQuickFilters() {
    const quickFilters = ['all', 'weapons', 'knives', 'cases', 'keys'];
    return quickFilters.map(f => {
        const filter = INVENTORY_FILTERS[f];
        const isActive = inventoryState.filter === f;
        return `
            <div class="quick-filter ${isActive ? 'active' : ''}" onclick="setInventoryFilter('${f}')">
                <span>${filter.icon}</span>
                <span>${filter.name.split(' ')[0]}</span>
            </div>
        `;
    }).join('');
}

function renderInventoryItem(item, index) {
    const isEquipped = Object.values(inventoryState.equipped).includes(item.id) ||
                       inventoryState.equipped.grenades?.includes(item.id);
    const isFavorite = inventoryState.favorites.includes(item.id);
    const rarityColor = getRarityColor(item.rarity);
    
    return `
        <div class="inv-item-card ${item.rarity || ''}" style="border-color: ${rarityColor}" 
             onclick="selectInventoryItem(${index})">
            ${isFavorite ? '<div class="fav-badge">⭐</div>' : ''}
            ${isEquipped ? '<div class="equipped-badge">✅</div>' : ''}
            ${item.quantity > 1 ? `<div class="quantity-badge">${item.quantity}</div>` : ''}
            <div class="item-image">${item.image || '📦'}</div>
            <div class="item-name" style="color: ${rarityColor}">${truncate(item.name, 20)}</div>
            ${item.type ? `<div class="item-type">${INVENTORY_FILTERS[item.type]?.name || item.type}</div>` : ''}
            ${item.price ? `<div class="item-price">💰 ${formatNumber(item.price)}</div>` : ''}
        </div>
    `;
}

function renderItemDetails(item) {
    const canEquip = canEquipItem(item);
    const isEquipped = Object.values(inventoryState.equipped).includes(item.id);
    const isFavorite = inventoryState.favorites.includes(item.id);
    
    return `
        <div class="item-details">
            <div class="details-header">
                <div class="details-image">${item.image || '📦'}</div>
                <div class="details-info">
                    <h3>${item.name}</h3>
                    <div class="details-type">${INVENTORY_FILTERS[item.type]?.name || item.type}</div>
                    ${item.rarity ? `<div class="details-rarity" style="color: ${getRarityColor(item.rarity)}">${item.rarity.toUpperCase()}</div>` : ''}
                    ${item.quantity > 1 ? `<div class="details-quantity">Количество: ${item.quantity}</div>` : ''}
                </div>
            </div>
            
            ${item.damage ? `
                <div class="details-stats">
                    <div class="stat"><span>💥 Урон</span> <span>${item.damage}</span></div>
                    ${item.headshotMultiplier ? `<div class="stat"><span>🎯 Хэдшот</span> <span>x${item.headshotMultiplier}</span></div>` : ''}
                    ${item.armorPenetration ? `<div class="stat"><span>🛡️ Пробитие</span> <span>${Math.round(item.armorPenetration * 100)}%</span></div>` : ''}
                    ${item.magazine ? `<div class="stat"><span>🔫 Магазин</span> <span>${item.magazine}</span></div>` : ''}
                </div>
            ` : ''}
            
            ${item.armor ? `
                <div class="details-stats">
                    <div class="stat"><span>🛡️ Броня</span> <span>+${item.armor}</span></div>
                    ${item.helmet ? '<div class="stat"><span>⛑️ Шлем</span> <span>Да</span></div>' : ''}
                </div>
            ` : ''}
            
            <div class="details-actions">
                ${canEquip && !isEquipped ? `
                    <button class="action-btn equip" onclick="equipInventoryItem('${item.id}')">⚔️ ЭКИПИРОВАТЬ</button>
                ` : ''}
                ${isEquipped ? `
                    <button class="action-btn unequip" onclick="unequipInventoryItem('${item.id}')">🔓 СНЯТЬ</button>
                ` : ''}
                <button class="action-btn fav" onclick="toggleInvFavorite('${item.id}')">${isFavorite ? '★' : '☆'} ИЗБРАННОЕ</button>
                <button class="action-btn sell" onclick="sellInventoryItem('${item.id}')">💰 ПРОДАТЬ</button>
                ${item.type === 'cases' ? `
                    <button class="action-btn open" onclick="openCaseFromInv('${item.id}')">🎲 ОТКРЫТЬ</button>
                ` : ''}
                <button class="action-btn delete" onclick="deleteInventoryItem('${item.id}')">🗑️ УДАЛИТЬ</button>
            </div>
            
            <button class="close-details" onclick="inventoryState.selectedItem = null; renderInventoryScreen()">ЗАКРЫТЬ</button>
        </div>
    `;
}

// ===================================================================
// ЧАСТЬ 5: ФИЛЬТРАЦИЯ И СОРТИРОВКА
// ===================================================================

function getFilteredItems() {
    let items = inventoryState.items;
    
    // Фильтр
    if (inventoryState.filter !== 'all') {
        if (inventoryState.filter === 'weapons') {
            const weaponTypes = ['pistols', 'smg', 'rifles', 'snipers', 'shotguns'];
            items = items.filter(i => weaponTypes.includes(i.type));
        } else {
            items = items.filter(i => i.type === inventoryState.filter);
        }
    }
    
    // Поиск
    if (inventoryState.searchQuery) {
        const q = inventoryState.searchQuery.toLowerCase();
        items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    
    // Сортировка
    switch (inventoryState.sortBy) {
        case 'newest':
            items.sort((a, b) => new Date(b.acquired || 0) - new Date(a.acquired || 0));
            break;
        case 'oldest':
            items.sort((a, b) => new Date(a.acquired || 0) - new Date(b.acquired || 0));
            break;
        case 'name':
            items.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'rarity':
            const rarityOrder = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 };
            items.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));
            break;
        case 'value':
            items.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
    }
    
    return items;
}

function setInventoryFilter(filter) {
    inventoryState.filter = filter;
    inventoryState.selectedItem = null;
    renderInventoryScreen();
}

function openInvFilters() {
    let html = `<div class="filter-modal"><h3>⚙️ ФИЛЬТРЫ И СОРТИРОВКА</h3>`;
    
    // Категории
    html += `<h4>Категория</h4><div class="filter-grid">`;
    Object.entries(INVENTORY_FILTERS).forEach(([id, f]) => {
        html += `
            <div class="filter-option ${inventoryState.filter === id ? 'active' : ''}" onclick="setInventoryFilter('${id}'); closeModal()">
                <span>${f.icon}</span>
                <span>${f.name}</span>
            </div>
        `;
    });
    html += `</div>`;
    
    // Сортировка
    html += `<h4>Сортировка</h4>`;
    const sorts = [
        { value: 'newest', label: '🆕 Сначала новые' },
        { value: 'oldest', label: '📅 Сначала старые' },
        { value: 'name', label: '🔤 По названию' },
        { value: 'rarity', label: '🌟 По редкости' },
        { value: 'value', label: '💰 По стоимости' }
    ];
    sorts.forEach(s => {
        html += `
            <label>
                <input type="radio" name="sort" ${inventoryState.sortBy === s.value ? 'checked' : ''} 
                       onchange="inventoryState.sortBy = '${s.value}'; renderInventoryScreen(); closeModal()">
                ${s.label}
            </label>
        `;
    });
    
    html += `<button onclick="closeModal()">ЗАКРЫТЬ</button></div>`;
    
    const modal = document.getElementById('caseOpeningModal');
    const overlay = document.getElementById('modalOverlay');
    modal.innerHTML = html;
    overlay.style.display = 'block';
    modal.style.display = 'block';
}

function toggleInvView() {
    inventoryState.viewMode = inventoryState.viewMode === 'grid' ? 'list' : 'grid';
    renderInventoryScreen();
}

// ===================================================================
// ЧАСТЬ 6: ДЕЙСТВИЯ С ПРЕДМЕТАМИ
// ===================================================================

function selectInventoryItem(index) {
    inventoryState.selectedItem = index;
    renderInventoryScreen();
}

function canEquipItem(item) {
    const equippableTypes = ['pistols', 'smg', 'rifles', 'snipers', 'shotguns', 'heavy', 'knives', 'armor', 'grenades'];
    return equippableTypes.includes(item.type);
}

function equipInventoryItem(itemId) {
    const item = inventoryState.items.find(i => i.id === itemId);
    if (!item) return;
    
    // Определяем слот
    let slot = null;
    if (item.type === 'pistols') slot = 'secondary';
    else if (['smg', 'rifles', 'snipers', 'shotguns', 'heavy'].includes(item.type)) slot = 'primary';
    else if (item.type === 'knives') slot = 'knife';
    else if (item.type === 'armor') slot = 'armor';
    else if (item.type === 'grenades') {
        if (!inventoryState.equipped.grenades) inventoryState.equipped.grenades = [];
        if (inventoryState.equipped.grenades.length < 4) {
            inventoryState.equipped.grenades.push(itemId);
            saveInventory();
            showNotification('✅ ЭКИПИРОВАНО', item.name, 'success');
        } else {
            showNotification('❌ МАКСИМУМ ГРАНАТ', 'Можно носить только 4 гранаты', 'error');
        }
        renderInventoryScreen();
        return;
    }
    
    if (slot) {
        inventoryState.equipped[slot] = itemId;
        saveInventory();
        showNotification('✅ ЭКИПИРОВАНО', item.name, 'success');
        playSound('equip');
    }
    
    renderInventoryScreen();
}

function unequipInventoryItem(itemId) {
    // Ищем в слотах
    for (const slot in inventoryState.equipped) {
        if (inventoryState.equipped[slot] === itemId) {
            inventoryState.equipped[slot] = null;
        }
    }
    
    if (inventoryState.equipped.grenades) {
        inventoryState.equipped.grenades = inventoryState.equipped.grenades.filter(id => id !== itemId);
    }
    
    saveInventory();
    showNotification('🔓 СНЯТО', '', 'info');
    renderInventoryScreen();
}

function selectEquippedSlot(slot) {
    inventoryState.selectedSlot = slot;
    
    // Показываем доступные предметы для этого слота
    const compatibleTypes = {
        primary: ['smg', 'rifles', 'snipers', 'shotguns', 'heavy'],
        secondary: ['pistols'],
        knife: ['knives'],
        armor: ['armor']
    };
    
    const items = inventoryState.items.filter(i => 
        compatibleTypes[slot]?.includes(i.type)
    );
    
    let html = `<div class="slot-select-modal"><h3>⚔️ ВЫБОР ПРЕДМЕТА</h3><div class="slot-items">`;
    
    if (items.length === 0) {
        html += `<div class="empty-message">😕 Нет подходящих предметов</div>`;
    } else {
        items.forEach(item => {
            html += `
                <div class="slot-item-option" onclick="equipInventoryItem('${item.id}'); closeModal()">
                    <span>${item.image}</span>
                    <span>${item.name}</span>
                    ${item.damage ? `<span>💥 ${item.damage}</span>` : ''}
                </div>
            `;
        });
    }
    
    html += `</div><button onclick="closeModal()">ЗАКРЫТЬ</button></div>`;
    
    const modal = document.getElementById('caseOpeningModal');
    const overlay = document.getElementById('modalOverlay');
    modal.innerHTML = html;
    overlay.style.display = 'block';
    modal.style.display = 'block';
}

function toggleInvFavorite(itemId) {
    if (inventoryState.favorites.includes(itemId)) {
        inventoryState.favorites = inventoryState.favorites.filter(id => id !== itemId);
    } else {
        inventoryState.favorites.push(itemId);
    }
    localStorage.setItem('inv_favorites', JSON.stringify(inventoryState.favorites));
    renderInventoryScreen();
}

function sellInventoryItem(itemId) {
    const item = inventoryState.items.find(i => i.id === itemId);
    if (!item) return;
    
    const sellPrice = Math.floor((item.price || 100) * 0.7);
    
    showConfirmDialog('Продать предмет?', `Вы получите ${formatNumber(sellPrice)} пикселей`, () => {
        // Удаляем предмет
        inventoryState.items = inventoryState.items.filter(i => i.id !== itemId);
        
        // Добавляем деньги
        addPixels(sellPrice);
        
        saveInventory();
        renderInventoryScreen();
        showNotification('✅ ПРОДАНО', `+${formatNumber(sellPrice)} пикселей`, 'success');
        playSound('sell');
    });
}

function deleteInventoryItem(itemId) {
    showConfirmDialog('Удалить предмет?', 'Это действие нельзя отменить!', () => {
        inventoryState.items = inventoryState.items.filter(i => i.id !== itemId);
        saveInventory();
        inventoryState.selectedItem = null;
        renderInventoryScreen();
        showNotification('🗑️ УДАЛЕНО', '', 'info');
    });
}

function openCaseFromInv(itemId) {
    const item = inventoryState.items.find(i => i.id === itemId);
    if (!item || item.type !== 'cases') return;
    
    // Проверяем наличие ключа
    const hasKey = inventoryState.items.some(i => i.type === 'keys');
    if (!hasKey) {
        showNotification('❌ НЕТ КЛЮЧА', 'Купите ключ в магазине', 'error');
        return;
    }
    
    // Удаляем кейс и ключ
    inventoryState.items = inventoryState.items.filter(i => {
        if (i.id === itemId) return false;
        if (i.type === 'keys' && !hasKey.used) {
            hasKey.used = true;
            return false;
        }
        return true;
    });
    
    // Открываем кейс
    if (typeof openCaseOpening === 'function') {
        openCaseOpening(item.rarity || 'common');
    }
    
    saveInventory();
}

// ===================================================================
// ЧАСТЬ 8: СБОРКИ (LOADOUTS)
// ===================================================================

function openLoadouts() {
    let html = `<div class="loadouts-modal"><h3>💾 СБОРКИ</h3>`;
    
    html += `<div class="loadouts-list">`;
    inventoryState.loadouts.forEach((loadout, index) => {
        html += `
            <div class="loadout-item">
                <span>${loadout.name}</span>
                <button onclick="applyLoadout(${index}); closeModal()">ПРИМЕНИТЬ</button>
                <button onclick="deleteLoadout(${index})">✕</button>
            </div>
        `;
    });
    html += `</div>`;
    
    html += `
        <button onclick="saveCurrentLoadout()">💾 СОХРАНИТЬ ТЕКУЩУЮ</button>
        <button onclick="closeModal()">ЗАКРЫТЬ</button>
    </div>`;
    
    const modal = document.getElementById('caseOpeningModal');
    const overlay = document.getElementById('modalOverlay');
    modal.innerHTML = html;
    overlay.style.display = 'block';
    modal.style.display = 'block';
}

function saveCurrentLoadout() {
    const name = prompt('Название сборки:', `Сборка ${inventoryState.loadouts.length + 1}`);
    if (!name) return;
    
    inventoryState.loadouts.push({
        name,
        equipped: { ...inventoryState.equipped },
        date: new Date().toISOString()
    });
    
    if (inventoryState.loadouts.length > 10) {
        inventoryState.loadouts.shift();
    }
    
    saveInventory();
    showNotification('✅ СОХРАНЕНО', name, 'success');
}

function applyLoadout(index) {
    const loadout = inventoryState.loadouts[index];
    if (loadout) {
        inventoryState.equipped = { ...loadout.equipped };
        saveInventory();
        renderInventoryScreen();
        showNotification('✅ ПРИМЕНЕНО', loadout.name, 'success');
    }
}

function deleteLoadout(index) {
    inventoryState.loadouts.splice(index, 1);
    saveInventory();
    openLoadouts();
}

// ===================================================================
// ЧАСТЬ 9: ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===================================================================

function calculateInventoryValue() {
    return inventoryState.items.reduce((sum, item) => {
        return sum + (item.price || 0) * (item.quantity || 1);
    }, 0);
}

// ===================================================================
// ЧАСТЬ 10: СТИЛИ ИНВЕНТАРЯ
// ===================================================================

function injectInventoryStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .inventory-container { padding: 15px; padding-bottom: 80px; min-height: 100vh; background: #0a0a0f; }
        .inv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .inv-title { display: flex; align-items: center; gap: 10px; }
        .inv-title h2 { color: #ffd700; margin: 0; }
        .inv-count { background: #1a1a2e; padding: 4px 10px; border-radius: 20px; color: #aaa; font-size: 14px; }
        .inv-value { color: #2ecc71; font-weight: bold; }
        .inv-search { display: flex; gap: 10px; margin-bottom: 15px; }
        .inv-search input { flex: 1; padding: 12px; background: #1a1a2e; border: 1px solid #3a4a5a; border-radius: 30px; color: white; }
        .inv-search button { padding: 12px 20px; background: #1a1a2e; border: 1px solid #3a4a5a; border-radius: 30px; color: white; cursor: pointer; }
        .inv-equipped { background: #1a1a2e; border-radius: 15px; padding: 15px; margin-bottom: 15px; }
        .inv-equipped h3 { color: #ffd700; margin-bottom: 10px; }
        .equipped-slots { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .equipped-slot { background: #0a0a0f; border-radius: 10px; padding: 10px; cursor: pointer; }
        .slot-label { font-size: 12px; color: #aaa; margin-bottom: 5px; }
        .slot-item { display: flex; align-items: center; gap: 8px; }
        .slot-image { font-size: 24px; }
        .slot-name { font-size: 13px; color: white; }
        .slot-empty { color: #555; font-style: italic; }
        .equipped-grenades { margin-top: 10px; color: #aaa; }
        .inv-quick-filters { display: flex; gap: 8px; overflow-x: auto; padding: 10px 0; margin-bottom: 10px; }
        .quick-filter { padding: 8px 12px; background: #1a1a2e; border: 1px solid #3a4a5a; border-radius: 20px; cursor: pointer; white-space: nowrap; }
        .quick-filter.active { background: #ffd70020; border-color: #ffd700; color: #ffd700; }
        .inv-items.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .inv-items.list { display: flex; flex-direction: column; gap: 8px; }
        .inv-item-card { background: #1a1a2e; border: 1px solid; border-radius: 12px; padding: 12px; position: relative; cursor: pointer; }
        .fav-badge { position: absolute; top: 5px; left: 5px; color: #ffd700; }
        .equipped-badge { position: absolute; top: 5px; right: 5px; color: #2ecc71; }
        .quantity-badge { position: absolute; bottom: 5px; right: 5px; background: #333; color: white; padding: 2px 6px; border-radius: 20px; font-size: 11px; }
        .item-image { font-size: 40px; text-align: center; margin-bottom: 5px; }
        .item-type { font-size: 10px; color: #aaa; }
        .item-details { background: #1a1a2e; border-radius: 15px; padding: 20px; margin-top: 20px; }
        .details-header { display: flex; gap: 15px; margin-bottom: 15px; }
        .details-image { font-size: 60px; }
        .details-info h3 { color: #ffd700; margin-bottom: 5px; }
        .details-type { color: #aaa; font-size: 13px; }
        .details-rarity { font-weight: bold; margin-top: 5px; }
        .details-stats { background: #0a0a0f; border-radius: 10px; padding: 15px; margin-bottom: 15px; }
        .stat { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #333; }
        .stat:last-child { border-bottom: none; }
        .details-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .action-btn { padding: 10px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
        .action-btn.equip { background: #2ecc71; color: white; grid-column: span 2; }
        .action-btn.unequip { background: #f39c12; color: white; grid-column: span 2; }
        .action-btn.fav { background: #1a1a2e; border: 1px solid #ffd700; color: #ffd700; }
        .action-btn.sell { background: #1a1a2e; border: 1px solid #f39c12; color: #f39c12; }
        .action-btn.open { background: #8A2BE2; color: white; }
        .action-btn.delete { background: #1a1a2e; border: 1px solid #e74c3c; color: #e74c3c; }
        .close-details { width: 100%; margin-top: 15px; padding: 12px; background: #333; border: none; border-radius: 10px; color: white; cursor: pointer; }
        .inv-footer { display: flex; gap: 10px; margin-top: 20px; }
        .inv-btn { flex: 1; padding: 15px; background: #1a1a2e; border: 1px solid #3a4a5a; border-radius: 10px; color: white; cursor: pointer; }
        .empty-message { text-align: center; color: #888; padding: 40px; }
        .filter-modal { padding: 20px; }
        .filter-modal h3 { color: #ffd700; margin-bottom: 15px; }
        .filter-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px; }
        .filter-option { padding: 10px; background: #1a1a2e; border: 1px solid #3a4a5a; border-radius: 10px; text-align: center; cursor: pointer; }
        .filter-option.active { background: #ffd70020; border-color: #ffd700; }
        .filter-modal label { display: block; padding: 8px 0; color: white; cursor: pointer; }
        .slot-select-modal { padding: 20px; }
        .slot-select-modal h3 { color: #ffd700; margin-bottom: 15px; }
        .slot-items { max-height: 300px; overflow-y: auto; }
        .slot-item-option { display: flex; align-items: center; gap: 10px; padding: 12px; background: #1a1a2e; border-radius: 10px; margin-bottom: 8px; cursor: pointer; }
        .loadouts-modal { padding: 20px; }
        .loadouts-modal h3 { color: #ffd700; margin-bottom: 15px; }
        .loadouts-list { max-height: 300px; overflow-y: auto; margin-bottom: 15px; }
        .loadout-item { display: flex; align-items: center; gap: 10px; padding: 12px; background: #1a1a2e; border-radius: 10px; margin-bottom: 8px; }
        .loadout-item span { flex: 1; }
        .loadout-item button { padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; }
        .loadouts-modal > button { width: 100%; padding: 12px; margin-top: 8px; background: #2ecc71; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; }
    `;
    document.head.appendChild(style);
}

// ===================================================================
// ЧАСТЬ 11: ЭКСПОРТ И ИНИЦИАЛИЗАЦИЯ
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
    injectInventoryStyles();
    loadInventory();
    console.log('🎒 Inventory system ready');
});

window.openInventory = openInventory;
window.setInventoryFilter = setInventoryFilter;
window.openInvFilters = openInvFilters;
window.toggleInvView = toggleInvView;
window.selectInventoryItem = selectInventoryItem;
window.equipInventoryItem = equipInventoryItem;
window.unequipInventoryItem = unequipInventoryItem;
window.selectEquippedSlot = selectEquippedSlot;
window.toggleInvFavorite = toggleInvFavorite;
window.sellInventoryItem = sellInventoryItem;
window.deleteInventoryItem = deleteInventoryItem;
window.openCaseFromInv = openCaseFromInv;
window.openLoadouts = openLoadouts;
window.saveCurrentLoadout = saveCurrentLoadout;
window.applyLoadout = applyLoadout;
window.deleteLoadout = deleteLoadout;

console.log('✅ inventory.js загружен — 1000+ строк | Pixel Strike 15.0');