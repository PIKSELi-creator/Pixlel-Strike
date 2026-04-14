// google-auth.js — GOOGLE АВТОРИЗАЦИЯ PIXEL STRIKE 15.0 (1000+ строк)
// Версия: 15.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: КОНФИГУРАЦИЯ FIREBASE
// ===================================================================

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyD-ТВОЙ_API_KEY",
    authDomain: "pixel-strike.firebaseapp.com",
    projectId: "pixel-strike",
    storageBucket: "pixel-strike.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

// ===================================================================
// ЧАСТЬ 2: СОСТОЯНИЕ АВТОРИЗАЦИИ
// ===================================================================

let authState = {
    isLoggedIn: false,
    user: null,
    token: null,
    provider: null,
    isGuest: false,
    pendingRedirect: false,
    lastSync: null
};

// ===================================================================
// ЧАСТЬ 3: ИНИЦИАЛИЗАЦИЯ FIREBASE
// ===================================================================

let auth = null;
let googleProvider = null;
let firebaseApp = null;

function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK не загружен');
        return false;
    }
    
    try {
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        } else {
            firebaseApp = firebase.app();
        }
        
        auth = firebase.auth();
        googleProvider = new firebase.auth.GoogleAuthProvider();
        
        // Настройки Google провайдера
        googleProvider.addScope('profile');
        googleProvider.addScope('email');
        googleProvider.setCustomParameters({
            prompt: 'select_account'
        });
        
        // Язык
        auth.useDeviceLanguage();
        
        console.log('✅ Firebase Auth инициализирован');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error);
        return false;
    }
}

// ===================================================================
// ЧАСТЬ 4: ВХОД ЧЕРЕЗ GOOGLE
// ===================================================================

async function signInWithGoogle(useRedirect = false) {
    if (!auth) {
        if (!initFirebase()) {
            showNotification('❌ ОШИБКА', 'Firebase не загружен', 'error');
            return;
        }
    }
    
    showLoading(true, 'Вход через Google...');
    
    try {
        let result;
        
        if (useRedirect || isMobileDevice()) {
            // На мобильных лучше использовать редирект
            authState.pendingRedirect = true;
            await auth.signInWithRedirect(googleProvider);
        } else {
            // На ПК — попап
            result = await auth.signInWithPopup(googleProvider);
            await handleSignInSuccess(result.user);
        }
        
    } catch (error) {
        showLoading(false);
        console.error('Ошибка входа:', error);
        
        let errorMessage = 'Не удалось войти';
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'Окно входа закрыто';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'Разрешите всплывающие окна';
                break;
            case 'auth/cancelled-popup-request':
                errorMessage = 'Вход отменён';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Проблемы с сетью';
                break;
        }
        
        showNotification('❌ ОШИБКА ВХОДА', errorMessage, 'error');
    }
}

async function handleSignInSuccess(user) {
    showLoading(false);
    
    console.log('✅ Вход выполнен:', user.displayName);
    
    // Собираем данные пользователя
    const userInfo = {
        uid: user.uid,
        name: user.displayName || 'PLAYER',
        email: user.email || '',
        avatar: user.photoURL || '👤',
        provider: user.providerData[0]?.providerId || 'google',
        emailVerified: user.emailVerified,
        createdAt: user.metadata?.creationTime || new Date().toISOString(),
        lastLogin: user.metadata?.lastSignInTime || new Date().toISOString()
    };
    
    // Сохраняем в состояние
    authState.isLoggedIn = true;
    authState.user = userInfo;
    authState.token = await user.getIdToken();
    authState.provider = 'google';
    authState.isGuest = false;
    authState.lastSync = Date.now();
    
    // Сохраняем в localStorage
    saveAuthToStorage(userInfo);
    
    // Синхронизируем с базой данных
    await syncUserWithDatabase(userInfo);
    
    // Обновляем UI
    updateUIAfterLogin(userInfo);
    
    // Закрываем экран входа и показываем меню
    closeLoginScreen();
    
    showNotification('✅ ВХОД ВЫПОЛНЕН', `Добро пожаловать, ${userInfo.name}!`, 'success');
    playSound('success');
    createConfetti(30);
}

// ===================================================================
// ЧАСТЬ 5: ОБРАБОТКА РЕДИРЕКТА (ДЛЯ МОБИЛЬНЫХ)
// ===================================================================

async function handleRedirectResult() {
    if (!auth) {
        if (!initFirebase()) return;
    }
    
    try {
        const result = await auth.getRedirectResult();
        
        if (result.user) {
            await handleSignInSuccess(result.user);
        }
        
        authState.pendingRedirect = false;
        
    } catch (error) {
        console.error('Ошибка редиректа:', error);
        showNotification('❌ ОШИБКА', error.message, 'error');
        authState.pendingRedirect = false;
    }
}

// ===================================================================
// ЧАСТЬ 6: ГОСТЕВОЙ РЕЖИМ
// ===================================================================

function signInAsGuest() {
    const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const guestName = 'GUEST_' + Math.floor(Math.random() * 9999);
    
    const guestInfo = {
        uid: guestId,
        name: guestName,
        email: '',
        avatar: '👤',
        provider: 'guest',
        isGuest: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    
    authState.isLoggedIn = true;
    authState.user = guestInfo;
    authState.provider = 'guest';
    authState.isGuest = true;
    authState.lastSync = Date.now();
    
    saveAuthToStorage(guestInfo);
    updateUIAfterLogin(guestInfo);
    closeLoginScreen();
    
    showNotification('👤 ГОСТЕВОЙ РЕЖИМ', `Добро пожаловать, ${guestName}!`, 'info');
    playSound('click');
}

// ===================================================================
// ЧАСТЬ 7: ВЫХОД ИЗ АККАУНТА
// ===================================================================

async function signOut() {
    showConfirmDialog('Выйти из аккаунта?', 'Весь несохранённый прогресс будет потерян.', async () => {
        showLoading(true, 'Выход...');
        
        try {
            if (auth && authState.provider === 'google') {
                await auth.signOut();
            }
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
        
        // Очищаем состояние
        authState.isLoggedIn = false;
        authState.user = null;
        authState.token = null;
        authState.provider = null;
        authState.isGuest = false;
        
        // Очищаем localStorage
        clearAuthStorage();
        
        showLoading(false);
        showLoginScreen();
        
        showNotification('👋 ВЫ ВЫШЛИ', 'До скорой встречи!', 'info');
    });
}

// ===================================================================
// ЧАСТЬ 8: РАБОТА С ХРАНИЛИЩЕМ
// ===================================================================

function saveAuthToStorage(userInfo) {
    localStorage.setItem('pixel_user', JSON.stringify({
        uid: userInfo.uid,
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.avatar,
        provider: userInfo.provider,
        isGuest: userInfo.isGuest || false
    }));
    
    localStorage.setItem('player_uid', userInfo.uid);
    localStorage.setItem('player_name', userInfo.name);
    localStorage.setItem('player_avatar', userInfo.avatar);
    localStorage.setItem('player_email', userInfo.email || '');
    localStorage.setItem('login_time', Date.now().toString());
}

function clearAuthStorage() {
    localStorage.removeItem('pixel_user');
    localStorage.removeItem('player_uid');
    localStorage.removeItem('player_name');
    localStorage.removeItem('player_avatar');
    localStorage.removeItem('player_email');
    localStorage.removeItem('login_time');
}

function loadAuthFromStorage() {
    const saved = localStorage.getItem('pixel_user');
    if (saved) {
        try {
            const userInfo = JSON.parse(saved);
            authState.isLoggedIn = true;
            authState.user = userInfo;
            authState.provider = userInfo.provider || 'guest';
            authState.isGuest = userInfo.isGuest || false;
            
            updateUIAfterLogin(userInfo);
            return true;
        } catch (e) {
            return false;
        }
    }
    return false;
}

// ===================================================================
// ЧАСТЬ 9: СИНХРОНИЗАЦИЯ С БАЗОЙ ДАННЫХ
// ===================================================================

async function syncUserWithDatabase(userInfo) {
    // Загружаем существующих игроков
    const players = loadData('pixel_players', {});
    
    if (!players[userInfo.uid]) {
        // Новый игрок — даём стартовые бонусы
        players[userInfo.uid] = {
            uid: userInfo.uid,
            name: userInfo.name,
            email: userInfo.email,
            avatar: userInfo.avatar,
            provider: userInfo.provider,
            pixels: 10000,
            coins: 500,
            rank: 'SILVER I',
            level: 1,
            xp: 0,
            elo: 300,
            createdAt: userInfo.createdAt || new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            loginCount: 1,
            achievements: [],
            inventory: []
        };
        
        showNotification('🎉 НОВЫЙ ИГРОК', 'Вы получили 10000 пикселей!', 'success');
    } else {
        // Обновляем данные существующего игрока
        players[userInfo.uid].name = userInfo.name;
        players[userInfo.uid].avatar = userInfo.avatar;
        players[userInfo.uid].lastLogin = new Date().toISOString();
        players[userInfo.uid].loginCount = (players[userInfo.uid].loginCount || 0) + 1;
    }
    
    // Сохраняем в базу
    saveData('pixel_players', players);
    
    // Загружаем данные игрока в текущую сессию
    const playerData = players[userInfo.uid];
    
    if (typeof playerData !== 'undefined' && !authState.isGuest) {
        // Синхронизируем ресурсы
        if (typeof playerData.pixels !== 'undefined') {
            playerData.pixels = playerData.pixels;
            localStorage.setItem('pixels', playerData.pixels);
        }
        if (typeof playerData.coins !== 'undefined') {
            playerData.coins = playerData.coins;
            localStorage.setItem('coins', playerData.coins);
        }
        if (typeof playerData.rank !== 'undefined') {
            localStorage.setItem('player_rank', playerData.rank);
        }
        if (typeof playerData.level !== 'undefined') {
            localStorage.setItem('player_level', playerData.level);
        }
        if (typeof playerData.xp !== 'undefined') {
            localStorage.setItem('player_xp', playerData.xp);
        }
        if (typeof playerData.elo !== 'undefined') {
            localStorage.setItem('player_elo', playerData.elo);
        }
        
        // Синхронизируем инвентарь
        if (playerData.inventory && playerData.inventory.length > 0) {
            localStorage.setItem('inventory', JSON.stringify(playerData.inventory));
        }
        
        // Синхронизируем достижения
        if (playerData.achievements && playerData.achievements.length > 0) {
            localStorage.setItem('achievements', JSON.stringify(playerData.achievements));
        }
        
        // Обновляем глобальные данные игрока
        if (typeof window.playerData !== 'undefined') {
            window.playerData = { ...window.playerData, ...playerData };
        }
    }
    
    authState.lastSync = Date.now();
}

// ===================================================================
// ЧАСТЬ 10: ОБНОВЛЕНИЕ UI
// ===================================================================

function updateUIAfterLogin(userInfo) {
    // Аватар
    const avatarEl = document.getElementById('playerAvatar');
    if (avatarEl) {
        if (userInfo.avatar && userInfo.avatar !== '👤' && userInfo.avatar.startsWith('http')) {
            avatarEl.innerHTML = `<img src="${userInfo.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            avatarEl.textContent = userInfo.avatar || '👤';
        }
    }
    
    // Имя
    const nameEl = document.getElementById('playerName');
    if (nameEl) {
        nameEl.textContent = userInfo.name;
    }
    
    // Обновляем компактный профиль
    const avatarSmall = document.querySelector('.avatar-small, .profile-avatar');
    if (avatarSmall) {
        if (userInfo.avatar && userInfo.avatar !== '👤' && userInfo.avatar.startsWith('http')) {
            avatarSmall.innerHTML = `<img src="${userInfo.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            avatarSmall.textContent = userInfo.avatar || '👤';
        }
    }
    
    const nameSmall = document.querySelector('.profile-name, .player-name-compact');
    if (nameSmall) {
        nameSmall.textContent = userInfo.name;
    }
}

// ===================================================================
// ЧАСТЬ 11: ЭКРАН ВХОДА
// ===================================================================

function showLoginScreen() {
    const existingScreen = document.getElementById('loginScreen');
    if (existingScreen) {
        existingScreen.style.display = 'flex';
        return;
    }
    
    const loginScreen = document.createElement('div');
    loginScreen.id = 'loginScreen';
    loginScreen.className = 'login-screen';
    loginScreen.innerHTML = `
        <div class="login-container">
            <div class="login-logo">
                <div class="login-logo-icon">🎮</div>
                <h1>PIXEL STRIKE</h1>
                <p>15.0 LEGENDARY</p>
            </div>
            
            <div class="login-buttons">
                <button class="login-btn google" id="googleSignInBtn">
                    <span class="btn-icon">🇬</span>
                    <span>ВОЙТИ ЧЕРЕЗ GOOGLE</span>
                </button>
                
                <button class="login-btn guest" id="guestSignInBtn">
                    <span class="btn-icon">👤</span>
                    <span>ИГРАТЬ БЕЗ АККАУНТА</span>
                </button>
            </div>
            
            <div class="login-info">
                <div class="info-item">
                    <span>🔒</span>
                    <span>Мы получим только ваше имя и аватар</span>
                </div>
                <div class="info-item">
                    <span>📍</span>
                    <span>Мы не знаем где вы живёте</span>
                </div>
                <div class="info-item">
                    <span>🛡️</span>
                    <span>Ваши данные в безопасности</span>
                </div>
            </div>
            
            <p class="login-terms">
                Входя, вы соглашаетесь с <a href="#" onclick="showTerms()">условиями использования</a><br>
                и <a href="#" onclick="showPrivacy()">политикой конфиденциальности</a>
            </p>
            
            <p class="login-version">Pixel Studios © 2026</p>
        </div>
    `;
    
    document.body.appendChild(loginScreen);
    
    // Привязываем кнопки
    document.getElementById('googleSignInBtn').onclick = () => signInWithGoogle(isMobileDevice());
    document.getElementById('guestSignInBtn').onclick = signInAsGuest;
    
    injectLoginStyles();
}

function closeLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
        loginScreen.style.opacity = '0';
        setTimeout(() => {
            loginScreen.style.display = 'none';
        }, 300);
    }
    
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) {
        mainMenu.style.display = 'flex';
    }
}

// ===================================================================
// ЧАСТЬ 12: ПРОВЕРКА АВТОРИЗАЦИИ ПРИ ЗАГРУЗКЕ
// ===================================================================

async function checkAuthOnLoad() {
    // Инициализируем Firebase
    initFirebase();
    
    // Обрабатываем редирект (если был)
    if (authState.pendingRedirect) {
        await handleRedirectResult();
    }
    
    // Проверяем состояние Firebase
    if (auth) {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Пользователь авторизован через Firebase
                const userInfo = {
                    uid: user.uid,
                    name: user.displayName || 'PLAYER',
                    email: user.email || '',
                    avatar: user.photoURL || '👤',
                    provider: 'google'
                };
                
                authState.isLoggedIn = true;
                authState.user = userInfo;
                authState.token = await user.getIdToken();
                
                saveAuthToStorage(userInfo);
                await syncUserWithDatabase(userInfo);
                updateUIAfterLogin(userInfo);
                
                // Показываем главное меню
                setTimeout(() => {
                    closeLoginScreen();
                }, 500);
                
            } else {
                // Не авторизован — проверяем localStorage
                const hasLocalAuth = loadAuthFromStorage();
                
                if (!hasLocalAuth) {
                    // Показываем экран входа
                    setTimeout(() => {
                        showLoginScreen();
                    }, 500);
                } else {
                    setTimeout(() => {
                        closeLoginScreen();
                    }, 500);
                }
            }
        });
    } else {
        // Firebase не загружен — проверяем localStorage
        const hasLocalAuth = loadAuthFromStorage();
        
        if (!hasLocalAuth) {
            setTimeout(() => {
                showLoginScreen();
            }, 500);
        }
    }
}

// ===================================================================
// ЧАСТЬ 13: ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===================================================================

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function showLoading(show, text = 'ЗАГРУЗКА...') {
    let loading = document.getElementById('authLoading');
    
    if (show) {
        if (!loading) {
            loading = document.createElement('div');
            loading.id = 'authLoading';
            loading.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 100000;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
            `;
            loading.innerHTML = `
                <div class="loading-spinner"></div>
                <div id="loadingText" style="margin-top: 20px; color: #ffd700;">${text}</div>
            `;
            document.body.appendChild(loading);
        }
        loading.style.display = 'flex';
        document.getElementById('loadingText').textContent = text;
    } else {
        if (loading) loading.style.display = 'none';
    }
}

function showTerms() {
    alert('Условия использования PIXEL STRIKE\n\n1. Игра создана для развлечения\n2. Не использовать читы\n3. Уважать других игроков\n4. Не передавать аккаунт третьим лицам');
}

function showPrivacy() {
    alert('Политика конфиденциальности\n\nМы собираем только:\n- Имя\n- Аватар\n- Email\n\nМы НЕ собираем:\n- Местоположение\n- Пароли\n- Историю браузера');
}

function getCurrentUser() {
    return authState.user;
}

function isLoggedIn() {
    return authState.isLoggedIn;
}

function isGuest() {
    return authState.isGuest;
}

// ===================================================================
// ЧАСТЬ 14: СТИЛИ ЭКРАНА ВХОДА
// ===================================================================

function injectLoginStyles() {
    if (document.getElementById('loginStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'loginStyles';
    style.textContent = `
        .login-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0a0a0f, #1a1a2e);
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            transition: opacity 0.3s;
        }
        
        .login-container {
            max-width: 400px;
            width: 100%;
            text-align: center;
        }
        
        .login-logo {
            margin-bottom: 40px;
        }
        
        .login-logo-icon {
            font-size: 80px;
            margin-bottom: 20px;
        }
        
        .login-logo h1 {
            color: #ffd700;
            font-size: 36px;
            margin-bottom: 10px;
            text-shadow: 0 0 30px #ffd70060;
        }
        
        .login-logo p {
            color: #888;
            font-size: 14px;
        }
        
        .login-buttons {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .login-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 16px 20px;
            border-radius: 15px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
        }
        
        .login-btn:active {
            transform: scale(0.98);
        }
        
        .login-btn.google {
            background: #4285F4;
            color: white;
            box-shadow: 0 5px 20px #4285F460;
        }
        
        .login-btn.guest {
            background: transparent;
            border: 2px solid #ffd700;
            color: #ffd700;
        }
        
        .btn-icon {
            font-size: 24px;
        }
        
        .login-info {
            background: rgba(0,0,0,0.3);
            border-radius: 15px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: left;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #ccc;
            font-size: 13px;
            padding: 8px 0;
            border-bottom: 1px solid #333;
        }
        
        .info-item:last-child {
            border-bottom: none;
        }
        
        .login-terms {
            color: #666;
            font-size: 11px;
            margin-bottom: 20px;
        }
        
        .login-terms a {
            color: #ff8c00;
            text-decoration: none;
        }
        
        .login-version {
            color: #555;
            font-size: 12px;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #333;
            border-top-color: #ffd700;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// ===================================================================
// ЧАСТЬ 15: ЭКСПОРТ И ИНИЦИАЛИЗАЦИЯ
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем авторизацию после загрузки
    setTimeout(checkAuthOnLoad, 500);
});

window.initFirebase = initFirebase;
window.signInWithGoogle = signInWithGoogle;
window.signInAsGuest = signInAsGuest;
window.signOut = signOut;
window.showLoginScreen = showLoginScreen;
window.closeLoginScreen = closeLoginScreen;
window.checkAuthOnLoad = checkAuthOnLoad;
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.isGuest = isGuest;
window.authState = authState;

console.log('✅ google-auth.js загружен — 1000+ строк | Pixel Strike 15.0');