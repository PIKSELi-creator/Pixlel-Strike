// player.js — ПОЛНАЯ СИСТЕМА ИГРОКА PIXEL STRIKE 15.0 (1000+ строк)
// Версия: 15.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: ДАННЫЕ ИГРОКА
// ===================================================================

let playerData = {
    // Основное
    uid: null,
    name: 'PLAYER',
    avatar: '👤',
    email: null,
    provider: null,
    
    // Прогрессия
    level: 1,
    xp: 0,
    xpToNextLevel: 1000,
    prestige: 0,
    totalXP: 0,
    
    // Ранг
    rank: 'SILVER I',
    rankIndex: 0,
    elo: 300,
    peakElo: 300,
    
    // Ресурсы (только 2 валюты)
    pixels: 10000,
    coins: 500,
    totalPixelsEarned: 10000,
    totalCoinsEarned: 500,
    
    // Статистика (общая)
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    maxWinStreak: 0,
    loseStreak: 0,
    
    // Боевая статистика
    kills: 0,
    deaths: 0,
    assists: 0,
    headshots: 0,
    mvps: 0,
    aces: 0,
    clutches: 0,
    firstBloods: 0,
    
    // Повреждения
    totalDamage: 0,
    totalShots: 0,
    totalHits: 0,
    accuracy: 0,
    
    // Бомба
    bombsPlanted: 0,
    bombsDefused: 0,
    bombsExploded: 0,
    
    // Экономика
    moneyEarned: 0,
    moneySpent: 0,
    casesOpened: 0,
    
    // Время
    playTime: 0,
    lastLogin: null,
    createdAt: new Date().toISOString(),
    
    // Настройки
    settings: {
        sound: true,
        music: true,
        vibration: true,
        notifications: true,
        language: 'ru',
        crosshair: 'default',
        sensitivity: 70,
        fov: 90
    },
    
    // Достижения
    achievements: [],
    titles: [],
    
    // Инвентарь
    inventory: [],
    equipped: {
        primary: null,
        secondary: 'glock18',
        knife: 'default_knife',
        armor: null,
        grenades: []
    },
    
    // Кланы и друзья
    clan: null,
    friends: [],
    friendRequests: [],
    
    // Боевой пропуск
    battlepass: {
        level: 1,
        xp: 0,
        premium: false,
        claimedFree: [],
        claimedPremium: []
    },
    
    // Ежедневные
    dailyStreak: 0,
    lastDailyClaim: null,
    dailyQuests: [],
    dailyProgress: {},
    
    // Статистика по картам
    mapStats: {},
    
    // Статистика по оружию
    weaponStats: {}
};

// ===================================================================
// ЧАСТЬ 2: ЗАГРУЗКА И СОХРАНЕНИЕ
// ===================================================================

function loadPlayerData() {
    const saved = localStorage.getItem('player_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            playerData = { ...playerData, ...data };
        } catch (e) {
            console.error('Ошибка загрузки данных игрока:', e);
        }
    }
    
    // Загружаем валюты отдельно
    playerData.pixels = parseInt(localStorage.getItem('pixels')) || 10000;
    playerData.coins = parseInt(localStorage.getItem('coins')) || 500;
    
    // Загружаем инвентарь
    const inventory = localStorage.getItem('inventory');
    if (inventory) playerData.inventory = JSON.parse(inventory);
    
    // Загружаем экипировку
    const equipped = localStorage.getItem('equipped');
    if (equipped) playerData.equipped = JSON.parse(equipped);
    
    // Загружаем достижения
    const achievements = localStorage.getItem('achievements');
    if (achievements) playerData.achievements = JSON.parse(achievements);
    
    // Обновляем ранг на основе ELO
    updateRankFromElo();
    
    // Обновляем UI
    updatePlayerUI();
    
    return playerData;
}

function savePlayerData() {
    localStorage.setItem('player_data', JSON.stringify(playerData));
    localStorage.setItem('pixels', playerData.pixels);
    localStorage.setItem('coins', playerData.coins);
    localStorage.setItem('player_name', playerData.name);
    localStorage.setItem('player_avatar', playerData.avatar);
    localStorage.setItem('player_rank', playerData.rank);
    localStorage.setItem('player_level', playerData.level);
    localStorage.setItem('player_xp', playerData.xp);
    localStorage.setItem('player_elo', playerData.elo);
    localStorage.setItem('inventory', JSON.stringify(playerData.inventory));
    localStorage.setItem('equipped', JSON.stringify(playerData.equipped));
    localStorage.setItem('achievements', JSON.stringify(playerData.achievements));
}

// ===================================================================
// ЧАСТЬ 3: ПРОГРЕССИЯ (ОПЫТ, УРОВНИ, ПРЕСТИЖ)
// ===================================================================

function addXP(amount) {
    playerData.xp += amount;
    playerData.totalXP += amount;
    
    let leveledUp = false;
    
    while (playerData.xp >= playerData.xpToNextLevel) {
        playerData.xp -= playerData.xpToNextLevel;
        playerData.level++;
        playerData.xpToNextLevel = calculateXPForNextLevel(playerData.level);
        leveledUp = true;
        
        // Награда за уровень
        giveLevelReward(playerData.level);
    }
    
    if (leveledUp) {
        onLevelUp();
    }
    
    // Добавляем опыт в боевой пропуск
    addBattlepassXP(amount);
    
    savePlayerData();
    updatePlayerUI();
    
    return leveledUp;
}

function calculateXPForNextLevel(level) {
    return Math.floor(1000 * Math.pow(1.1, level - 1));
}

function giveLevelReward(level) {
    const reward = LEVEL_REWARDS[level];
    if (!reward) {
        playerData.pixels += 500;
        return;
    }
    
    if (reward.pixels) addPixels(reward.pixels);
    if (reward.coins) addCoins(reward.coins);
    if (reward.case) addItemToInventory({ type: 'case', rarity: reward.case, name: `КЕЙС ${reward.case.toUpperCase()}`, image: '📦' });
    if (reward.skin) addItemToInventory({ type: 'skin', name: reward.skin, image: '🔫' });
}

function onLevelUp() {
    showLevelUpEffect();
    showNotification('⬆️ УРОВЕНЬ ПОВЫШЕН!', `Теперь вы ${playerData.level} уровня!`, 'success');
    playSound('levelup');
    createConfetti(30);
}

function performPrestige() {
    if (playerData.level < 50) {
        showNotification('❌ НЕЛЬЗЯ', 'Достигните 50 уровня для престижа', 'error');
        return false;
    }
    
    playerData.prestige++;
    playerData.level = 1;
    playerData.xp = 0;
    playerData.xpToNextLevel = 1000;
    
    // Награда за престиж
    const prestigeRewards = {
        1: { pixels: 5000, coins: 200 },
        2: { pixels: 10000, coins: 500, case: 'rare' },
        3: { pixels: 15000, coins: 1000, skin: 'prestige_gold' },
        5: { pixels: 30000, coins: 2000, knife: 'karambit_prestige' },
        10: { pixels: 100000, coins: 5000, title: 'LEGEND' }
    };
    
    const reward = prestigeRewards[playerData.prestige] || { pixels: 5000 * playerData.prestige };
    if (reward.pixels) addPixels(reward.pixels);
    if (reward.coins) addCoins(reward.coins);
    if (reward.case) addItemToInventory({ type: 'case', rarity: reward.case, name: 'ПРЕСТИЖ КЕЙС', image: '🌟' });
    if (reward.skin) addItemToInventory({ type: 'skin', name: reward.skin, image: '👑' });
    if (reward.knife) addItemToInventory({ type: 'knife', name: reward.knife, image: '🔪' });
    if (reward.title) playerData.titles.push(reward.title);
    
    savePlayerData();
    updatePlayerUI();
    
    showNotification('🌟 ПРЕСТИЖ!', `Престиж ${playerData.prestige} достигнут!`, 'success');
    playSound('prestige');
    createConfetti(100);
    
    return true;
}

// ===================================================================
// ЧАСТЬ 4: РАНГИ И ELO
// ===================================================================

function updateRankFromElo() {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (playerData.elo >= RANKS[i].minElo) {
            if (playerData.rankIndex !== i) {
                playerData.rankIndex = i;
                playerData.rank = RANKS[i].name;
                onRankUp(RANKS[i]);
            }
            break;
        }
    }
    
    if (playerData.elo > playerData.peakElo) {
        playerData.peakElo = playerData.elo;
    }
}

function onRankUp(rank) {
    showNotification('🏆 НОВЫЙ РАНГ!', `${rank.icon} ${rank.name}`, 'success');
    playSound('rankup');
    createConfetti(50);
    
    // Награда за ранг
    if (rank.reward) {
        addPixels(rank.reward);
    }
}

function updateEloAfterMatch(won, enemyElo, kills, deaths, mvp, ace, clutch) {
    const kFactor = 32;
    const expected = 1 / (1 + Math.pow(10, (enemyElo - playerData.elo) / 400));
    const score = won ? 1 : 0;
    let eloChange = Math.round(kFactor * (score - expected));
    
    // Бонусы
    if (mvp) eloChange += 5;
    if (ace) eloChange += 10;
    if (clutch) eloChange += 8;
    if (kills > deaths * 2) eloChange += 5;
    
    playerData.elo = Math.max(0, playerData.elo + eloChange);
    updateRankFromElo();
    savePlayerData();
    
    return eloChange;
}

// ===================================================================
// ЧАСТЬ 5: ВАЛЮТЫ (ТОЛЬКО ПИКСЕЛИ И КОИНЫ)
// ===================================================================

function addPixels(amount) {
    playerData.pixels += amount;
    playerData.totalPixelsEarned += amount;
    savePlayerData();
    updatePlayerUI();
    return playerData.pixels;
}

function addCoins(amount) {
    playerData.coins += amount;
    playerData.totalCoinsEarned += amount;
    savePlayerData();
    updatePlayerUI();
    return playerData.coins;
}

function spendPixels(amount) {
    if (playerData.pixels >= amount) {
        playerData.pixels -= amount;
        playerData.moneySpent += amount;
        savePlayerData();
        updatePlayerUI();
        return true;
    }
    return false;
}

function spendCoins(amount) {
    if (playerData.coins >= amount) {
        playerData.coins -= amount;
        savePlayerData();
        updatePlayerUI();
        return true;
    }
    return false;
}

// ===================================================================
// ЧАСТЬ 6: СТАТИСТИКА ПОСЛЕ МАТЧА
// ===================================================================

function updateStatsAfterMatch(matchData) {
    playerData.matches++;
    
    if (matchData.won) {
        playerData.wins++;
        playerData.winStreak++;
        playerData.loseStreak = 0;
        if (playerData.winStreak > playerData.maxWinStreak) {
            playerData.maxWinStreak = playerData.winStreak;
        }
    } else if (matchData.lost) {
        playerData.losses++;
        playerData.loseStreak++;
        playerData.winStreak = 0;
    } else {
        playerData.draws++;
    }
    
    playerData.kills += matchData.kills || 0;
    playerData.deaths += matchData.deaths || 0;
    playerData.assists += matchData.assists || 0;
    playerData.headshots += matchData.headshots || 0;
    if (matchData.mvp) playerData.mvps++;
    if (matchData.ace) playerData.aces++;
    if (matchData.clutch) playerData.clutches++;
    if (matchData.firstBlood) playerData.firstBloods++;
    
    playerData.totalDamage += matchData.damage || 0;
    playerData.totalShots += matchData.shots || 0;
    playerData.totalHits += matchData.hits || 0;
    playerData.accuracy = playerData.totalShots > 0 ? (playerData.totalHits / playerData.totalShots * 100) : 0;
    
    if (matchData.bombPlanted) playerData.bombsPlanted++;
    if (matchData.bombDefused) playerData.bombsDefused++;
    
    playerData.moneyEarned += matchData.moneyEarned || 0;
    playerData.playTime += matchData.playTime || 300;
    
    // Обновление ELO
    updateEloAfterMatch(matchData.won, matchData.enemyElo || 1500, matchData.kills || 0, matchData.deaths || 0, matchData.mvp, matchData.ace, matchData.clutch);
    
    // Опыт за матч
    const xpGained = calculateMatchXP(matchData);
    addXP(xpGained);
    
    // Достижения после матча
    checkPostMatchAchievements(matchData);
    
    // Ежедневные задания
    updateDailyQuests(matchData);
    
    savePlayerData();
    updatePlayerUI();
    
    return xpGained;
}

function calculateMatchXP(matchData) {
    let xp = 100;
    if (matchData.won) xp += 100;
    xp += (matchData.kills || 0) * 10;
    xp += (matchData.headshots || 0) * 5;
    if (matchData.mvp) xp += 50;
    if (matchData.ace) xp += 100;
    if (matchData.clutch) xp += 75;
    return xp;
}

// ===================================================================
// ЧАСТЬ 7: ИНВЕНТАРЬ
// ===================================================================

function addItemToInventory(item) {
    const newItem = {
        id: generateId('item_'),
        ...item,
        acquired: new Date().toISOString()
    };
    playerData.inventory.push(newItem);
    savePlayerData();
    return newItem;
}

function removeItemFromInventory(itemId) {
    const index = playerData.inventory.findIndex(i => i.id === itemId);
    if (index >= 0) {
        playerData.inventory.splice(index, 1);
        savePlayerData();
        return true;
    }
    return false;
}

function equipItem(itemId, slot) {
    const item = playerData.inventory.find(i => i.id === itemId);
    if (!item) return false;
    
    playerData.equipped[slot] = itemId;
    savePlayerData();
    return true;
}

function unequipItem(slot) {
    playerData.equipped[slot] = null;
    savePlayerData();
}

// ===================================================================
// ЧАСТЬ 8: БОЕВОЙ ПРОПУСК
// ===================================================================

function addBattlepassXP(amount) {
    playerData.battlepass.xp += amount;
    
    while (playerData.battlepass.xp >= 1000 && playerData.battlepass.level < 50) {
        playerData.battlepass.xp -= 1000;
        playerData.battlepass.level++;
        showNotification('⬆️ БОЕВОЙ ПРОПУСК', `Уровень ${playerData.battlepass.level}`, 'success');
    }
    
    savePlayerData();
}

function claimBattlepassReward(level, type) {
    const rewards = type === 'free' ? BP_FREE_REWARDS : BP_PREMIUM_REWARDS;
    const reward = rewards[level];
    if (!reward) return false;
    
    const claimed = type === 'free' ? playerData.battlepass.claimedFree : playerData.battlepass.claimedPremium;
    if (claimed.includes(level)) return false;
    if (playerData.battlepass.level < level) return false;
    
    if (reward.pixels) addPixels(reward.pixels);
    if (reward.coins) addCoins(reward.coins);
    if (reward.case) addItemToInventory({ type: 'case', rarity: reward.case, name: 'КЕЙС БП', image: '📦' });
    if (reward.skin) addItemToInventory({ type: 'skin', name: reward.skin, image: '🔫' });
    if (reward.knife) addItemToInventory({ type: 'knife', name: reward.knife, image: '🔪' });
    
    if (type === 'free') {
        playerData.battlepass.claimedFree.push(level);
    } else {
        playerData.battlepass.claimedPremium.push(level);
    }
    
    savePlayerData();
    return true;
}

// ===================================================================
// ЧАСТЬ 9: ЕЖЕДНЕВНЫЕ ЗАДАНИЯ
// ===================================================================

function initDailyQuests() {
    const today = new Date().toDateString();
    
    if (playerData.lastDailyClaim !== today) {
        playerData.dailyStreak++;
        playerData.lastDailyClaim = today;
        generateDailyQuests();
    }
}

function generateDailyQuests() {
    const allQuests = DAILY_QUESTS_LIST;
    const shuffled = [...allQuests].sort(() => Math.random() - 0.5);
    playerData.dailyQuests = shuffled.slice(0, 3);
    playerData.dailyProgress = {};
    savePlayerData();
}

function updateDailyQuests(matchData) {
    playerData.dailyQuests.forEach(quest => {
        if (!playerData.dailyProgress[quest.id]) {
            playerData.dailyProgress[quest.id] = 0;
        }
        
        let progress = 0;
        if (quest.id === 'kills') progress = matchData.kills || 0;
        else if (quest.id === 'wins' && matchData.won) progress = 1;
        else if (quest.id === 'headshots') progress = matchData.headshots || 0;
        else if (quest.id === 'matches') progress = 1;
        
        playerData.dailyProgress[quest.id] += progress;
    });
    
    savePlayerData();
}

function claimDailyQuestReward(questId) {
    const quest = playerData.dailyQuests.find(q => q.id === questId);
    if (!quest) return false;
    
    const progress = playerData.dailyProgress[questId] || 0;
    if (progress < quest.target) return false;
    
    if (quest.reward.pixels) addPixels(quest.reward.pixels);
    if (quest.reward.coins) addCoins(quest.reward.coins);
    
    playerData.dailyQuests = playerData.dailyQuests.filter(q => q.id !== questId);
    savePlayerData();
    
    showNotification('✅ ЗАДАНИЕ ВЫПОЛНЕНО', `+${quest.reward.pixels || quest.reward.coins} ${quest.reward.pixels ? '💰' : '🪙'}`, 'success');
    return true;
}

// ===================================================================
// ЧАСТЬ 10: ДОСТИЖЕНИЯ
// ===================================================================

function checkPostMatchAchievements(matchData) {
    if (playerData.matches === 1) unlockAchievement('first_match');
    if (playerData.wins === 1) unlockAchievement('first_win');
    if (playerData.kills >= 100) unlockAchievement('100_kills');
    if (playerData.headshots >= 50) unlockAchievement('headshot_master');
    if (playerData.mvps >= 10) unlockAchievement('mvp_collector');
    if (playerData.aces >= 1) unlockAchievement('ace');
    if (playerData.clutches >= 5) unlockAchievement('clutch_master');
    if (playerData.maxWinStreak >= 10) unlockAchievement('win_streak_10');
    if (playerData.prestige >= 1) unlockAchievement('prestige_1');
}

function unlockAchievement(achievementId) {
    if (playerData.achievements.includes(achievementId)) return false;
    
    playerData.achievements.push(achievementId);
    savePlayerData();
    
    const ach = ACHIEVEMENTS_LIST.find(a => a.id === achievementId);
    if (ach) {
        showAchievementUnlocked(ach);
        if (ach.reward) addPixels(ach.reward);
    }
    
    return true;
}

function showAchievementUnlocked(achievement) {
    showNotification('🏅 ДОСТИЖЕНИЕ!', achievement.name, 'success');
    playSound('achievement');
    createConfetti(40);
}

// ===================================================================
// ЧАСТЬ 11: UI И ОТОБРАЖЕНИЕ
// ===================================================================

function updatePlayerUI() {
    // Имя и аватар
    const nameEl = document.getElementById('playerName');
    const avatarEl = document.getElementById('playerAvatar');
    if (nameEl) nameEl.textContent = playerData.name;
    if (avatarEl) avatarEl.textContent = playerData.avatar;
    
    // Ранг и уровень
    const rankEl = document.getElementById('playerRank');
    const levelEl = document.getElementById('playerLevel');
    if (rankEl) rankEl.textContent = playerData.rank;
    if (levelEl) levelEl.textContent = playerData.level;
    
    // Валюты
    const pixelEl = document.getElementById('pixelDisplay');
    const coinEl = document.getElementById('coinDisplay');
    if (pixelEl) pixelEl.textContent = formatNumber(playerData.pixels);
    if (coinEl) coinEl.textContent = formatNumber(playerData.coins);
    
    // Опыт
    const xpFill = document.getElementById('xpFill');
    if (xpFill) {
        const percent = (playerData.xp / playerData.xpToNextLevel) * 100;
        xpFill.style.width = percent + '%';
    }
    
    // Статистика
    const winsEl = document.getElementById('winsDisplay');
    const kdEl = document.getElementById('kdDisplay');
    if (winsEl) winsEl.textContent = playerData.wins;
    if (kdEl) {
        const kd = playerData.deaths > 0 ? (playerData.kills / playerData.deaths).toFixed(2) : playerData.kills.toFixed(2);
        kdEl.textContent = kd;
    }
    
    // Престиж
    const prestigeEl = document.getElementById('prestigeLevel');
    if (prestigeEl) {
        prestigeEl.textContent = playerData.prestige;
        prestigeEl.style.display = playerData.prestige > 0 ? 'inline' : 'none';
    }
}

function showLevelUpEffect() {
    const element = document.querySelector('.player-level') || document.body;
    element.style.animation = 'levelUp 0.5s ease-out';
    setTimeout(() => element.style.animation = '', 500);
}

// ===================================================================
// ЧАСТЬ 12: ПРОФИЛЬ (ИЗМЕНЕНИЕ ДАННЫХ)
// ===================================================================

function changePlayerName(newName) {
    if (!newName || newName.length < 3 || newName.length > 16) {
        showNotification('❌ ОШИБКА', 'Имя должно быть от 3 до 16 символов', 'error');
        return false;
    }
    
    playerData.name = newName.toUpperCase();
    savePlayerData();
    updatePlayerUI();
    showNotification('✅ ИМЯ ИЗМЕНЕНО', newName.toUpperCase(), 'success');
    return true;
}

function changePlayerAvatar(avatar) {
    playerData.avatar = avatar;
    savePlayerData();
    updatePlayerUI();
    showNotification('✅ АВАТАР ИЗМЕНЁН', '', 'success');
    return true;
}

function updateSettings(key, value) {
    playerData.settings[key] = value;
    savePlayerData();
}

// ===================================================================
// ЧАСТЬ 13: СТАТИСТИКА ПО КАРТАМ И ОРУЖИЮ
// ===================================================================

function updateMapStats(mapId, data) {
    if (!playerData.mapStats[mapId]) {
        playerData.mapStats[mapId] = { played: 0, wins: 0, kills: 0, deaths: 0 };
    }
    
    const stats = playerData.mapStats[mapId];
    stats.played++;
    if (data.won) stats.wins++;
    stats.kills += data.kills || 0;
    stats.deaths += data.deaths || 0;
    
    savePlayerData();
}

function updateWeaponStats(weaponId, data) {
    if (!playerData.weaponStats[weaponId]) {
        playerData.weaponStats[weaponId] = { kills: 0, shots: 0, hits: 0, headshots: 0 };
    }
    
    const stats = playerData.weaponStats[weaponId];
    stats.kills += data.kills || 0;
    stats.shots += data.shots || 0;
    stats.hits += data.hits || 0;
    stats.headshots += data.headshots || 0;
    
    savePlayerData();
}

// ===================================================================
// ЧАСТЬ 14: ПОЛУЧЕНИЕ ДАННЫХ
// ===================================================================

function getPlayerKD() {
    return playerData.deaths > 0 ? (playerData.kills / playerData.deaths).toFixed(2) : playerData.kills.toFixed(2);
}

function getWinrate() {
    return playerData.matches > 0 ? Math.round((playerData.wins / playerData.matches) * 100) : 0;
}

function getAccuracy() {
    return playerData.totalShots > 0 ? Math.round((playerData.totalHits / playerData.totalShots) * 100) : 0;
}

function getHeadshotRate() {
    return playerData.kills > 0 ? Math.round((playerData.headshots / playerData.kills) * 100) : 0;
}

function getPlayerSummary() {
    return {
        name: playerData.name,
        level: playerData.level,
        prestige: playerData.prestige,
        rank: playerData.rank,
        kd: getPlayerKD(),
        winrate: getWinrate(),
        matches: playerData.matches,
        kills: playerData.kills,
        pixels: playerData.pixels,
        coins: playerData.coins
    };
}

// ===================================================================
// ЧАСТЬ 15: ЭКСПОРТ И ИНИЦИАЛИЗАЦИЯ
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadPlayerData();
    initDailyQuests();
    console.log('✅ player.js загружен — Игрок:', playerData.name);
});

window.playerData = playerData;
window.loadPlayerData = loadPlayerData;
window.savePlayerData = savePlayerData;
window.addXP = addXP;
window.addPixels = addPixels;
window.addCoins = addCoins;
window.spendPixels = spendPixels;
window.spendCoins = spendCoins;
window.performPrestige = performPrestige;
window.updateStatsAfterMatch = updateStatsAfterMatch;
window.addItemToInventory = addItemToInventory;
window.removeItemFromInventory = removeItemFromInventory;
window.equipItem = equipItem;
window.unequipItem = unequipItem;
window.addBattlepassXP = addBattlepassXP;
window.claimBattlepassReward = claimBattlepassReward;
window.claimDailyQuestReward = claimDailyQuestReward;
window.unlockAchievement = unlockAchievement;
window.changePlayerName = changePlayerName;
window.changePlayerAvatar = changePlayerAvatar;
window.updateSettings = updateSettings;
window.updateMapStats = updateMapStats;
window.updateWeaponStats = updateWeaponStats;
window.getPlayerKD = getPlayerKD;
window.getWinrate = getWinrate;
window.getAccuracy = getAccuracy;
window.getHeadshotRate = getHeadshotRate;
window.getPlayerSummary = getPlayerSummary;
window.updatePlayerUI = updatePlayerUI;

console.log('✅ player.js загружен — 1000+ строк | Pixel Strike 15.0');