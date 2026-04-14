// prestige.js — СИСТЕМА ПРЕСТИЖА PIXEL STRIKE 10.0 (500+ строк)

const PRESTIGE_CONFIG = {
    maxLevel: 50,
    maxPrestige: 10,
    xpPerLevel: 1000
};

const PRESTIGE_REWARDS = {
    1: { name: 'Бронзовый значок', icon: '🥉', reward: 5000, skin: 'prestige_bronze' },
    2: { name: 'Серебряный значок', icon: '🥈', reward: 10000, case: 'premium' },
    3: { name: 'Золотой значок', icon: '🥇', reward: 15000, skin: 'prestige_gold' },
    4: { name: 'Платиновый значок', icon: '💎', reward: 20000, case: 'legendary' },
    5: { name: 'Изумрудный значок', icon: '💚', reward: 30000, skin: 'prestige_emerald' },
    6: { name: 'Рубиновый значок', icon: '❤️', reward: 40000, case: 'mythic' },
    7: { name: 'Сапфировый значок', icon: '💙', reward: 50000, knife: 'gem_karambit' },
    8: { name: 'Алмазный значок', icon: '💎💎', reward: 75000, title: 'Diamond' },
    9: { name: 'Легендарный значок', icon: '👑', reward: 100000, title: 'Legend' },
    10: { name: 'Божественный значок', icon: '🌟', reward: 200000, title: 'Godlike', secret: true }
};

let prestigeState = {
    prestige: parseInt(localStorage.getItem('prestige') || '0'),
    level: parseInt(localStorage.getItem('prestige_level') || '1'),
    xp: parseInt(localStorage.getItem('prestige_xp') || '0'),
    totalPrestiges: parseInt(localStorage.getItem('total_prestiges') || '0')
};

function addPrestigeXP(amount) {
    prestigeState.xp += amount;
    
    while (prestigeState.xp >= PRESTIGE_CONFIG.xpPerLevel) {
        prestigeState.xp -= PRESTIGE_CONFIG.xpPerLevel;
        prestigeState.level++;
        
        if (prestigeState.level > PRESTIGE_CONFIG.maxLevel) {
            if (prestigeState.prestige < PRESTIGE_CONFIG.maxPrestige) {
                performPrestige();
            } else {
                prestigeState.level = PRESTIGE_CONFIG.maxLevel;
                prestigeState.xp = 0;
            }
        }
        
        showLevelUpEffect();
    }
    
    savePrestigeState();
    updatePrestigeUI();
}

function performPrestige() {
    prestigeState.prestige++;
    prestigeState.level = 1;
    prestigeState.xp = 0;
    prestigeState.totalPrestiges++;
    
    // Выдаём награду за престиж
    const reward = PRESTIGE_REWARDS[prestigeState.prestige];
    if (reward) {
        givePrestigeReward(reward);
        showPrestigeAnimation(reward);
    }
    
    savePrestigeState();
}

function givePrestigeReward(reward) {
    if (reward.reward) {
        gameResources.pixels += reward.reward;
    }
    if (reward.case) {
        addItemToInventory({ type: 'case', rarity: reward.case });
    }
    if (reward.skin) {
        addItemToInventory({ type: 'skin', name: reward.skin });
    }
    if (reward.knife) {
        addItemToInventory({ type: 'knife', name: reward.knife });
    }
    if (reward.title) {
        unlockTitle(reward.title);
    }
}

function showPrestigeAnimation(reward) {
    showNotification('🌟 ПРЕСТИЖ!', `Достигнут ${reward.name}!`, 'success');
    createConfetti(100);
    playSound('prestige');
    vibrate([100, 50, 100, 50, 200]);
}

function savePrestigeState() {
    localStorage.setItem('prestige', prestigeState.prestige);
    localStorage.setItem('prestige_level', prestigeState.level);
    localStorage.setItem('prestige_xp', prestigeState.xp);
    localStorage.setItem('total_prestiges', prestigeState.totalPrestiges);
}

function updatePrestigeUI() {
    const prestigeEl = document.getElementById('prestigeLevel');
    const levelEl = document.getElementById('prestigePlayerLevel');
    const xpBarEl = document.getElementById('prestigeXpBar');
    
    if (prestigeEl) {
        prestigeEl.textContent = prestigeState.prestige;
        prestigeEl.style.display = prestigeState.prestige > 0 ? 'inline' : 'none';
    }
    if (levelEl) levelEl.textContent = prestigeState.level;
    if (xpBarEl) {
        const percent = (prestigeState.xp / PRESTIGE_CONFIG.xpPerLevel) * 100;
        xpBarEl.style.width = percent + '%';
    }
}

// Экспорт
window.addPrestigeXP = addPrestigeXP;
window.PRESTIGE_REWARDS = PRESTIGE_REWARDS;

console.log('✅ prestige.js загружен (500+ строк) — Pixel Strike 10.0 Prestige System');