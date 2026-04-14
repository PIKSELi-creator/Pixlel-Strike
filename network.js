// network.js — МУЛЬТИПЛЕЕРНАЯ СЕТЬ PIXEL STRIKE 15.0 (1000+ строк)
// Версия: 15.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: КОНФИГУРАЦИЯ СЕТИ
// ===================================================================

const NETWORK_CONFIG = {
    host: window.location.hostname || 'localhost',
    port: 8081,
    reconnectDelay: 3000,
    maxReconnectAttempts: 10,
    pingInterval: 5000,
    timeout: 10000,
    useSSL: window.location.protocol === 'https:',
    compression: true
};

// ===================================================================
// ЧАСТЬ 2: СОСТОЯНИЕ ПОДКЛЮЧЕНИЯ
// ===================================================================

let networkState = {
    socket: null,
    connected: false,
    connecting: false,
    reconnectAttempts: 0,
    playerId: null,
    playerName: null,
    roomId: null,
    team: null,
    latency: 0,
    lastPing: 0,
    lastPong: 0,
    messagesSent: 0,
    messagesReceived: 0,
    compressionRatio: 1
};

// Очереди
let messageQueue = [];
let reliableMessageQueue = [];

// Колбэки
let networkCallbacks = {
    onConnected: null,
    onDisconnected: null,
    onError: null,
    onPlayerList: null,
    onMatchFound: null,
    onGameStarted: null,
    onPlayerMoved: null,
    onPlayerShot: null,
    onPlayerDamaged: null,
    onPlayerDied: null,
    onChatMessage: null,
    onKillFeed: null,
    onRoundEnd: null,
    onMatchEnd: null,
    onRoomUpdate: null,
    onVoiceData: null
};

// Списки
let onlinePlayers = [];
let chatHistory = [];
let voiceChatEnabled = false;
let voiceStream = null;

// ===================================================================
// ЧАСТЬ 3: ПОДКЛЮЧЕНИЕ К СЕРВЕРУ
// ===================================================================

function connectToServer() {
    if (networkState.connected || networkState.connecting) {
        console.log('⚠️ Уже подключены или подключаемся');
        return;
    }
    
    networkState.connecting = true;
    
    const protocol = NETWORK_CONFIG.useSSL ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${NETWORK_CONFIG.host}:${NETWORK_CONFIG.port}`;
    
    console.log(`🌐 Подключение к ${wsUrl}...`);
    
    try {
        networkState.socket = new WebSocket(wsUrl);
        
        networkState.socket.onopen = handleSocketOpen;
        networkState.socket.onmessage = handleSocketMessage;
        networkState.socket.onclose = handleSocketClose;
        networkState.socket.onerror = handleSocketError;
        
    } catch (e) {
        console.error('❌ Ошибка создания WebSocket:', e);
        networkState.connecting = false;
        attemptReconnect();
    }
}

function handleSocketOpen() {
    console.log('✅ WebSocket подключен');
    
    networkState.connected = true;
    networkState.connecting = false;
    networkState.reconnectAttempts = 0;
    
    // Отправляем отложенные сообщения
    flushMessageQueue();
    
    // Запускаем пинг
    startPing();
    
    // Отправляем данные авторизации
    sendAuth();
    
    if (networkCallbacks.onConnected) {
        networkCallbacks.onConnected();
    }
    
    showNotification('✅ ПОДКЛЮЧЕНО', 'К серверу Pixel Strike', 'success');
}

function handleSocketMessage(event) {
    networkState.messagesReceived++;
    
    try {
        const message = JSON.parse(event.data);
        handleMessage(message);
    } catch (e) {
        console.error('❌ Ошибка парсинга сообщения:', e);
    }
}

function handleSocketClose(event) {
    console.log(`🔌 WebSocket закрыт (код: ${event.code})`);
    
    networkState.connected = false;
    networkState.connecting = false;
    networkState.socket = null;
    
    if (networkCallbacks.onDisconnected) {
        networkCallbacks.onDisconnected(event.code, event.reason);
    }
    
    // Пытаемся переподключиться
    attemptReconnect();
}

function handleSocketError(error) {
    console.error('❌ Ошибка WebSocket:', error);
    if (networkCallbacks.onError) {
        networkCallbacks.onError(error);
    }
}

// ===================================================================
// ЧАСТЬ 4: ПЕРЕПОДКЛЮЧЕНИЕ
// ===================================================================

function attemptReconnect() {
    if (networkState.reconnectAttempts >= NETWORK_CONFIG.maxReconnectAttempts) {
        console.log('❌ Достигнут лимит попыток переподключения');
        showNotification('❌ ОШИБКА ПОДКЛЮЧЕНИЯ', 'Не удалось подключиться к серверу', 'error');
        return;
    }
    
    networkState.reconnectAttempts++;
    
    const delay = NETWORK_CONFIG.reconnectDelay * Math.pow(1.5, networkState.reconnectAttempts - 1);
    
    console.log(`🔄 Попытка ${networkState.reconnectAttempts}/${NETWORK_CONFIG.maxReconnectAttempts} через ${Math.round(delay/1000)}с`);
    
    showNotification('🔄 ПЕРЕПОДКЛЮЧЕНИЕ', `Попытка ${networkState.reconnectAttempts}`, 'info');
    
    setTimeout(() => {
        if (!networkState.connected && !networkState.connecting) {
            connectToServer();
        }
    }, delay);
}

function disconnectFromServer() {
    if (networkState.socket) {
        networkState.socket.close();
        networkState.socket = null;
    }
    networkState.connected = false;
    networkState.connecting = false;
    networkState.playerId = null;
    stopPing();
}

// ===================================================================
// ЧАСТЬ 5: ОТПРАВКА СООБЩЕНИЙ
// ===================================================================

function sendToServer(data, reliable = true) {
    networkState.messagesSent++;
    
    if (networkState.connected && networkState.socket && networkState.socket.readyState === WebSocket.OPEN) {
        try {
            networkState.socket.send(JSON.stringify(data));
        } catch (e) {
            console.error('Ошибка отправки:', e);
            if (reliable) {
                reliableMessageQueue.push(data);
            }
        }
    } else {
        if (reliable) {
            reliableMessageQueue.push(data);
        } else {
            messageQueue.push(data);
        }
        
        // Пытаемся подключиться
        if (!networkState.connected && !networkState.connecting) {
            connectToServer();
        }
    }
}

function flushMessageQueue() {
    if (messageQueue.length > 0) {
        console.log(`📤 Отправка ${messageQueue.length} отложенных сообщений`);
        messageQueue.forEach(msg => sendToServer(msg, false));
        messageQueue = [];
    }
    
    if (reliableMessageQueue.length > 0) {
        console.log(`📤 Отправка ${reliableMessageQueue.length} надёжных сообщений`);
        reliableMessageQueue.forEach(msg => sendToServer(msg, true));
        reliableMessageQueue = [];
    }
}

function sendAuth() {
    const playerName = localStorage.getItem('player_name') || 'PLAYER';
    const playerId = localStorage.getItem('player_uid') || generateId('player_');
    
    sendToServer({
        type: 'auth',
        playerId,
        playerName,
        version: '15.0.0',
        device: getDeviceInfo()
    });
}

// ===================================================================
// ЧАСТЬ 6: ПИНГ И ЛАТЕНТНОСТЬ
// ===================================================================

function startPing() {
    stopPing();
    
    networkState.pingInterval = setInterval(() => {
        if (networkState.connected) {
            networkState.lastPing = Date.now();
            sendToServer({ type: 'ping', timestamp: networkState.lastPing }, false);
        }
    }, NETWORK_CONFIG.pingInterval);
}

function stopPing() {
    if (networkState.pingInterval) {
        clearInterval(networkState.pingInterval);
        networkState.pingInterval = null;
    }
}

function handlePong(timestamp) {
    networkState.lastPong = Date.now();
    networkState.latency = networkState.lastPong - timestamp;
}

// ===================================================================
// ЧАСТЬ 7: ОБРАБОТКА ВХОДЯЩИХ СООБЩЕНИЙ
// ===================================================================

function handleMessage(message) {
    switch (message.type) {
        case 'pong':
            handlePong(message.timestamp);
            break;
            
        case 'connected':
            handleConnected(message);
            break;
            
        case 'playerList':
            handlePlayerList(message);
            break;
            
        case 'matchmakingStarted':
            handleMatchmakingStarted(message);
            break;
            
        case 'matchmakingCancelled':
            handleMatchmakingCancelled(message);
            break;
            
        case 'matchFound':
            handleMatchFound(message);
            break;
            
        case 'gameStarted':
            handleGameStarted(message);
            break;
            
        case 'playerMoved':
            handlePlayerMoved(message);
            break;
            
        case 'playerShot':
            handlePlayerShot(message);
            break;
            
        case 'playerDamaged':
            handlePlayerDamaged(message);
            break;
            
        case 'playerDied':
            handlePlayerDied(message);
            break;
            
        case 'playerLeft':
            handlePlayerLeft(message);
            break;
            
        case 'chatMessage':
            handleChatMessage(message);
            break;
            
        case 'killFeed':
            handleKillFeed(message);
            break;
            
        case 'phaseChanged':
            handlePhaseChanged(message);
            break;
            
        case 'timerUpdate':
            handleTimerUpdate(message);
            break;
            
        case 'bombPlanted':
            handleBombPlanted(message);
            break;
            
        case 'bombDefused':
            handleBombDefused(message);
            break;
            
        case 'roundEnd':
            handleRoundEnd(message);
            break;
            
        case 'roundReset':
            handleRoundReset(message);
            break;
            
        case 'matchEnd':
            handleMatchEnd(message);
            break;
            
        case 'roomUpdate':
            handleRoomUpdate(message);
            break;
            
        case 'voiceData':
            handleVoiceData(message);
            break;
            
        case 'error':
            handleError(message);
            break;
            
        default:
            console.log('📨 Неизвестный тип сообщения:', message.type);
    }
}

// ===================================================================
// ЧАСТЬ 8: ОБРАБОТЧИКИ КОНКРЕТНЫХ СООБЩЕНИЙ
// ===================================================================

function handleConnected(message) {
    networkState.playerId = message.playerId;
    networkState.playerName = message.playerName;
    
    console.log(`✅ Авторизован как ${networkState.playerName} (ID: ${networkState.playerId})`);
    
    showNotification('✅ ПОДКЛЮЧЕНО', `Добро пожаловать, ${networkState.playerName}!`, 'success');
}

function handlePlayerList(message) {
    onlinePlayers = message.players || [];
    
    const onlineCount = document.getElementById('onlineCount');
    if (onlineCount) {
        onlineCount.textContent = message.total;
    }
    
    if (networkCallbacks.onPlayerList) {
        networkCallbacks.onPlayerList(onlinePlayers, message.total);
    }
}

function handleMatchmakingStarted(message) {
    console.log(`🔍 Поиск матча... Очередь: ${message.queueLength}`);
    showNotification('🔍 ПОИСК МАТЧА', `В очереди: ${message.queueLength} игроков`, 'info');
}

function handleMatchmakingCancelled(message) {
    console.log('🚫 Поиск матча отменён');
    showNotification('🚫 ПОИСК ОТМЕНЁН', '', 'info');
}

function handleMatchFound(message) {
    networkState.roomId = message.roomId;
    networkState.team = message.team;
    
    console.log(`🎮 Матч найден! Комната: ${message.roomId}, Команда: ${message.team}, Карта: ${message.map}`);
    
    showNotification('🎮 МАТЧ НАЙДЕН!', `Карта: ${message.map} | Команда: ${message.team.toUpperCase()}`, 'success');
    
    if (networkCallbacks.onMatchFound) {
        networkCallbacks.onMatchFound(message);
    }
}

function handleGameStarted(message) {
    console.log('⚔️ ИГРА НАЧАЛАСЬ!');
    showNotification('⚔️ ИГРА НАЧАЛАСЬ!', 'Приготовьтесь к бою!', 'success');
    playSound('round_start');
    
    if (networkCallbacks.onGameStarted) {
        networkCallbacks.onGameStarted(message.gameState);
    }
}

function handlePlayerMoved(message) {
    if (networkCallbacks.onPlayerMoved) {
        networkCallbacks.onPlayerMoved(message.playerId, message.position, message.rotation);
    }
}

function handlePlayerShot(message) {
    if (networkCallbacks.onPlayerShot) {
        networkCallbacks.onPlayerShot(message.playerId, message.weapon, message.direction);
    }
}

function handlePlayerDamaged(message) {
    if (message.targetId === networkState.playerId) {
        if (typeof player !== 'undefined') {
            player.health = message.targetHp;
            player.armor = message.targetArmor;
            updateUI();
        }
        showNotification('💔 ПОПАДАНИЕ!', `-${Math.round(message.damage)} HP`, 'warning');
        
        if (typeof hitEffect === 'function') {
            hitEffect(document.getElementById('gameCanvas'), message.headshot);
        }
    }
    
    if (networkCallbacks.onPlayerDamaged) {
        networkCallbacks.onPlayerDamaged(message);
    }
}

function handlePlayerDied(message) {
    addKillFeedToUI(`${message.killerName} 🔫 ${message.victimName}`);
    
    if (message.victimId === networkState.playerId) {
        showNotification('💀 ВЫ УБИТЫ!', `Убил: ${message.killerName}`, 'error');
        if (typeof player !== 'undefined') {
            player.health = 0;
            player.deaths++;
            updateUI();
        }
    }
    
    if (message.killerId === networkState.playerId) {
        showNotification('💀 ВРАГ УБИТ!', message.headshot ? '🎯 ХЭДШОТ!' : '', 'success');
        if (typeof player !== 'undefined') {
            player.kills++;
            player.money += message.headshot ? 400 : 300;
            updateUI();
        }
    }
    
    if (networkCallbacks.onPlayerDied) {
        networkCallbacks.onPlayerDied(message);
    }
}

function handlePlayerLeft(message) {
    console.log(`👋 ${message.playerName} покинул игру`);
    showNotification('👋 ИГРОК ВЫШЕЛ', message.playerName, 'info');
}

function handleChatMessage(message) {
    chatHistory.push({
        playerName: message.playerName,
        text: message.text,
        timestamp: message.timestamp
    });
    
    if (chatHistory.length > 100) chatHistory.shift();
    
    if (networkCallbacks.onChatMessage) {
        networkCallbacks.onChatMessage(message);
    }
    
    addChatToUI(message.playerName, message.text);
}

function handleKillFeed(message) {
    if (networkCallbacks.onKillFeed) {
        networkCallbacks.onKillFeed(message.feed);
    }
}

function handlePhaseChanged(message) {
    if (typeof gameState !== 'undefined') {
        gameState.phase = message.phase;
        gameState.timer = message.timer;
    }
}

function handleTimerUpdate(message) {
    if (typeof gameState !== 'undefined') {
        gameState.timer = message.timer;
    }
}

function handleBombPlanted(message) {
    showNotification('💣 БОМБА ЗАЛОЖЕНА!', `Точка ${message.site}`, 'warning');
    addKillFeedToUI(`💣 БОМБА ЗАЛОЖЕНА НА ${message.site}`);
    playSound('bomb_plant');
}

function handleBombDefused(message) {
    showNotification('✅ БОМБА ОБЕЗВРЕЖЕНА!', '', 'success');
    addKillFeedToUI('✅ БОМБА ОБЕЗВРЕЖЕНА');
    playSound('bomb_defuse');
}

function handleRoundEnd(message) {
    const won = (message.winner === 'ct' && networkState.team === 'ct') || 
                (message.winner === 't' && networkState.team === 't');
    
    showNotification(
        won ? '🏆 РАУНД ВЫИГРАН!' : '💀 РАУНД ПРОИГРАН',
        `Счёт: ${message.score.ct} : ${message.score.t}`,
        won ? 'success' : 'error'
    );
    
    if (networkCallbacks.onRoundEnd) {
        networkCallbacks.onRoundEnd(message);
    }
}

function handleRoundReset(message) {
    console.log(`🔄 Раунд ${message.round}`);
    showNotification(`🔄 РАУНД ${message.round}`, 'Приготовьтесь!', 'info');
}

function handleMatchEnd(message) {
    const won = (message.winner === 'ct' && networkState.team === 'ct') || 
                (message.winner === 't' && networkState.team === 't');
    
    showNotification(
        won ? '🏆 МАТЧ ВЫИГРАН!' : '💀 МАТЧ ПРОИГРАН',
        `Финальный счёт: ${message.finalScore.ct} : ${message.finalScore.t}`,
        won ? 'success' : 'error'
    );
    
    networkState.roomId = null;
    networkState.team = null;
    
    if (networkCallbacks.onMatchEnd) {
        networkCallbacks.onMatchEnd(message);
    }
    
    setTimeout(() => {
        if (typeof showScreen === 'function') {
            showScreen('mainMenu');
        }
    }, 5000);
}

function handleRoomUpdate(message) {
    if (networkCallbacks.onRoomUpdate) {
        networkCallbacks.onRoomUpdate(message.room);
    }
}

function handleVoiceData(message) {
    if (!voiceChatEnabled) return;
    if (networkCallbacks.onVoiceData) {
        networkCallbacks.onVoiceData(message.playerId, message.data);
    }
}

function handleError(message) {
    console.error('❌ Ошибка сервера:', message.message);
    showNotification('❌ ОШИБКА', message.message, 'error');
}

// ===================================================================
// ЧАСТЬ 9: ИГРОВЫЕ ДЕЙСТВИЯ
// ===================================================================

function sendFindMatch(map = 'dust2', mode = 'competitive') {
    sendToServer({
        type: 'findMatch',
        map,
        mode
    });
}

function sendCancelMatch() {
    sendToServer({ type: 'cancelMatch' });
}

function sendPlayerMove(position, rotation) {
    sendToServer({
        type: 'playerMove',
        position,
        rotation
    }, false); // Ненадёжная отправка для частых обновлений
}

function sendPlayerShoot(weapon, direction) {
    sendToServer({
        type: 'playerShoot',
        weapon,
        direction
    });
}

function sendPlayerHit(targetId, damage, headshot, weapon) {
    sendToServer({
        type: 'playerHit',
        targetId,
        damage,
        headshot,
        weapon
    });
}

function sendPlayerReload() {
    sendToServer({ type: 'playerReload' });
}

function sendPlantBomb(site) {
    sendToServer({
        type: 'plantBomb',
        site
    });
}

function sendDefuseBomb() {
    sendToServer({ type: 'defuseBomb' });
}

function sendChatMessage(text) {
    if (!text || text.length > 200) return;
    
    sendToServer({
        type: 'chatMessage',
        text
    });
}

function sendBuyWeapon(weapon) {
    sendToServer({
        type: 'buyWeapon',
        weapon
    });
}

function sendLeaveRoom() {
    sendToServer({ type: 'leaveRoom' });
}

function sendCreateRoom(name, maxPlayers = 10, map = 'dust2', mode = 'competitive') {
    sendToServer({
        type: 'createRoom',
        name,
        maxPlayers,
        map,
        mode
    });
}

function sendJoinRoom(roomId, password = '') {
    sendToServer({
        type: 'joinRoom',
        roomId,
        password
    });
}

function sendVoiceData(data) {
    if (!voiceChatEnabled) return;
    sendToServer({
        type: 'voiceData',
        data
    }, false);
}

// ===================================================================
// ЧАСТЬ 10: ГОЛОСОВОЙ ЧАТ
// ===================================================================

async function startVoiceChat() {
    if (voiceChatEnabled) return;
    
    try {
        voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        voiceChatEnabled = true;
        
        // Здесь должна быть обработка аудио и отправка через WebRTC
        
        console.log('🎤 Голосовой чат активирован');
        showNotification('🎤 ГОЛОСОВОЙ ЧАТ', 'Активирован', 'success');
        
    } catch (e) {
        console.error('Ошибка доступа к микрофону:', e);
        showNotification('❌ ОШИБКА', 'Нет доступа к микрофону', 'error');
    }
}

function stopVoiceChat() {
    if (voiceStream) {
        voiceStream.getTracks().forEach(track => track.stop());
        voiceStream = null;
    }
    voiceChatEnabled = false;
    console.log('🎤 Голосовой чат остановлен');
}

function toggleVoiceChat() {
    if (voiceChatEnabled) {
        stopVoiceChat();
    } else {
        startVoiceChat();
    }
    return voiceChatEnabled;
}

// ===================================================================
// ЧАСТЬ 11: UI ФУНКЦИИ
// ===================================================================

function addKillFeedToUI(text) {
    const feedEl = document.getElementById('killFeed');
    if (!feedEl) return;
    
    const item = document.createElement('div');
    item.style.cssText = 'color:#fff; text-shadow:1px 1px 2px black; margin-bottom:3px; animation:fadeIn 0.3s;';
    item.textContent = text;
    feedEl.appendChild(item);
    
    setTimeout(() => item.remove(), 5000);
    
    // Ограничиваем количество
    while (feedEl.children.length > 10) {
        feedEl.removeChild(feedEl.firstChild);
    }
}

function addChatToUI(playerName, text) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    
    const msg = document.createElement('div');
    msg.style.cssText = 'padding:5px; border-bottom:1px solid #333;';
    msg.innerHTML = `<span style="color:#ffd700;">${playerName}:</span> <span style="color:#ccc;">${escapeHtml(text)}</span>`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    while (chatBox.children.length > 50) {
        chatBox.removeChild(chatBox.firstChild);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================================================
// ЧАСТЬ 12: НАСТРОЙКА КОЛБЭКОВ
// ===================================================================

function setNetworkCallback(event, callback) {
    if (networkCallbacks.hasOwnProperty(event)) {
        networkCallbacks[event] = callback;
    }
}

// ===================================================================
// ЧАСТЬ 13: ПОЛУЧЕНИЕ ДАННЫХ
// ===================================================================

function getOnlinePlayers() {
    return onlinePlayers;
}

function getPlayerId() {
    return networkState.playerId;
}

function getPlayerName() {
    return networkState.playerName;
}

function getRoomId() {
    return networkState.roomId;
}

function getTeam() {
    return networkState.team;
}

function isConnected() {
    return networkState.connected;
}

function getLatency() {
    return networkState.latency;
}

function getNetworkStats() {
    return {
        connected: networkState.connected,
        latency: networkState.latency,
        playerId: networkState.playerId,
        roomId: networkState.roomId,
        onlinePlayers: onlinePlayers.length,
        messagesSent: networkState.messagesSent,
        messagesReceived: networkState.messagesReceived,
        reconnectAttempts: networkState.reconnectAttempts
    };
}

// ===================================================================
// ЧАСТЬ 14: ИНИЦИАЛИЗАЦИЯ И ЭКСПОРТ
// ===================================================================

function initNetwork() {
    console.log('🌐 Инициализация Network модуля...');
    
    // Автоматическое подключение
    setTimeout(() => {
        connectToServer();
    }, 1000);
    
    // Стили для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', initNetwork);

// Экспорт
window.NETWORK_CONFIG = NETWORK_CONFIG;
window.connectToServer = connectToServer;
window.disconnectFromServer = disconnectFromServer;
window.sendFindMatch = sendFindMatch;
window.sendCancelMatch = sendCancelMatch;
window.sendPlayerMove = sendPlayerMove;
window.sendPlayerShoot = sendPlayerShoot;
window.sendPlayerHit = sendPlayerHit;
window.sendPlayerReload = sendPlayerReload;
window.sendPlantBomb = sendPlantBomb;
window.sendDefuseBomb = sendDefuseBomb;
window.sendChatMessage = sendChatMessage;
window.sendBuyWeapon = sendBuyWeapon;
window.sendLeaveRoom = sendLeaveRoom;
window.sendCreateRoom = sendCreateRoom;
window.sendJoinRoom = sendJoinRoom;
window.setNetworkCallback = setNetworkCallback;
window.getOnlinePlayers = getOnlinePlayers;
window.getPlayerId = getPlayerId;
window.getPlayerName = getPlayerName;
window.getRoomId = getRoomId;
window.getTeam = getTeam;
window.isConnected = isConnected;
window.getLatency = getLatency;
window.getNetworkStats = getNetworkStats;
window.startVoiceChat = startVoiceChat;
window.stopVoiceChat = stopVoiceChat;
window.toggleVoiceChat = toggleVoiceChat;

console.log('✅ network.js загружен — 1000+ строк | Pixel Strike 15.0');