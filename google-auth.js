// google-auth.js — ВХОД ЧЕРЕЗ GOOGLE ДЛЯ PIXEL STRIKE 15.0
// Версия: 1.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: КОНФИГУРАЦИЯ GOOGLE AUTH
// ===================================================================

// ВАЖНО: Замени на свои ключи из Google Cloud Console!
const GOOGLE_CONFIG = {
apiKey: "AIzaSyBsQs1CI1xrejhjBHoUjGrbhllomzTRki4",

  authDomain: "pixel-strike-web.firebaseapp.com",

  projectId: "pixel-strike-web",

  storageBucket: "pixel-strike-web.firebasestorage.app",

  messagingSenderId: "1066590636401",

  appId: "1:1066590636401:web:f4ce307f1b2ea7eed18ed0",

  measurementId: "G-6EHRC0PY3F"

};
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ]
};

// Состояние авторизации
let authState = {
    isLoggedIn: false,
    user: null,
    token: null,
    provider: null
};

// ===================================================================
// ЧАСТЬ 2: ИНИЦИАЛИЗАЦИЯ GOOGLE API
// ===================================================================

function initGoogleAuth() {
    return new Promise((resolve, reject) => {
        // Загружаем Google API
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log('✅ Google API загружен');
            initializeGoogleButton();
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function initializeGoogleButton() {
    // Проверяем, есть ли уже сохранённая сессия
    checkExistingSession();
}

// ===================================================================
// ЧАСТЬ 3: ВХОД ЧЕРЕЗ GOOGLE (ВСПЛЫВАЮЩЕЕ ОКНО)
// ===================================================================

async function signInWithGoogle() {
    showLoading(true, 'Вход через Google...');
    
    try {
        // Инициализируем OAuth2 клиент
        const client = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CONFIG.clientId,
            scope: GOOGLE_CONFIG.scopes.join(' '),
            callback: async (response) => {
                if (response.error) {
                    showLoading(false);
                    showNotification('❌ Ошибка входа', response.error, 'error');
                    return;
                }
                
                // Получаем данные пользователя
                await fetchUserInfo(response.access_token);
            }
        });
        
        // Запрашиваем токен
        client.requestAccessToken();
        
    } catch (error) {
        showLoading(false);
        console.error('Ошибка входа:', error);
        showNotification('❌ Ошибка', 'Не удалось войти через Google', 'error');
    }
}

// ===================================================================
// ЧАСТЬ 4: ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
// ===================================================================

async function fetchUserInfo(accessToken) {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const userInfo = await response.json();
        
        // Сохраняем данные пользователя
        const user = {
            id: userInfo.sub,
            name: userInfo.name,
            email: userInfo.email,
            avatar: userInfo.picture,
            provider: 'google',
            accessToken: accessToken
        };
        
        // Входим в игру
        completeSignIn(user);
        
    } catch (error) {
        showLoading(false);
        console.error('Ошибка получения данных:', error);
        showNotification('❌ Ошибка', 'Не удалось получить данные профиля', 'error');
    }
}

// ===================================================================
// ЧАСТЬ 5: ЗАВЕРШЕНИЕ ВХОДА
// ===================================================================

function completeSignIn(user) {
    // Сохраняем в состояние
    authState.isLoggedIn = true;
    authState.user = user;
    authState.token = user.accessToken;
    authState.provider = 'google';
    
    // Сохраняем в localStorage
    localStorage.setItem('pixel_user', JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: 'google'
    }));
    
    localStorage.setItem('player_uid', user.id);
    localStorage.setItem('player_name', user.name);
    localStorage.setItem('player_avatar', user.avatar);
    localStorage.setItem('player_email', user.email);
    
    // Обновляем UI
    updateUIAfterLogin(user);
    
    showLoading(false);
    showNotification('✅ Вход выполнен', `Добро пожаловать, ${user.name}!`, 'success');
    playSound('success');
    
    // Закрываем экран входа и показываем главное меню
    const loginScreen = document.getElementById('loginScreen');
    const mainMenu = document.getElementById('mainMenu');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainMenu) mainMenu.style.display = 'flex';
    
    // Синхронизируем с базой данных
    syncUserWithDatabase(user);
}

// ===================================================================
// ЧАСТЬ 6: ОБНОВЛЕНИЕ UI ПОСЛЕ ВХОДА
// ===================================================================

function updateUIAfterLogin(user) {
    // Обновляем аватар и имя в профиле
    const avatarEl = document.getElementById('playerAvatar');
    const nameEl = document.getElementById('playerName');
    
    if (avatarEl) {
        if (user.avatar) {
            avatarEl.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            avatarEl.textContent = '👤';
        }
    }
    
    if (nameEl) {
        nameEl.textContent = user.name;
    }
    
    // Обновляем аватар в компактном профиле
    const avatarSmall = document.querySelector('.avatar-small');
    if (avatarSmall) {
        if (user.avatar) {
            avatarSmall.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        }
    }
}

// ===================================================================
// ЧАСТЬ 7: ПРОВЕРКА СУЩЕСТВУЮЩЕЙ СЕССИИ
// ===================================================================

function checkExistingSession() {
    const savedUser = localStorage.getItem('pixel_user');
    
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            authState.isLoggedIn = true;
            authState.user = user;
            authState.provider = user.provider;
            
            updateUIAfterLogin(user);
            
            console.log('✅ Сессия восстановлена:', user.name);
        } catch (e) {
            console.error('Ошибка восстановления сессии:', e);
        }
    }
}

// ===================================================================
// ЧАСТЬ 8: ВЫХОД ИЗ АККАУНТА
// ===================================================================

function signOut() {
    showConfirmDialog('Выйти из аккаунта?', 'Вы будете перенаправлены на экран входа.', () => {
        // Очищаем состояние
        authState.isLoggedIn = false;
        authState.user = null;
        authState.token = null;
        
        // Очищаем localStorage
        localStorage.removeItem('pixel_user');
        localStorage.removeItem('player_uid');
        localStorage.removeItem('player_name');
        localStorage.removeItem('player_avatar');
        localStorage.removeItem('player_email');
        
        // Отзываем токен Google (опционально)
        if (authState.token) {
            google.accounts.oauth2.revoke(authState.token, () => {
                console.log('✅ Токен отозван');
            });
        }
        
        // Показываем экран входа
        const mainMenu = document.getElementById('mainMenu');
        const loginScreen = document.getElementById('loginScreen');
        
        if (mainMenu) mainMenu.style.display = 'none';
        if (loginScreen) loginScreen.style.display = 'flex';
        
        showNotification('👋 Вы вышли', 'До скорой встречи!', 'info');
    });
}

// ===================================================================
// ЧАСТЬ 9: СИНХРОНИЗАЦИЯ С БАЗОЙ ДАННЫХ
// ===================================================================

function syncUserWithDatabase(user) {
    // Проверяем, есть ли игрок в базе
    const players = JSON.parse(localStorage.getItem('pixel_players') || '{}');
    
    if (!players[user.id]) {
        // Новый игрок — даём стартовый бонус
        players[user.id] = {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            pixels: 10000,
            coins: 500,
            rank: 'SILVER I',
            level: 1,
            xp: 0,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        showNotification('🎉 НОВЫЙ ИГРОК', 'Вы получили стартовый бонус 10000 пикселей!', 'success');
    } else {
        // Обновляем время последнего входа
        players[user.id].lastLogin = new Date().toISOString();
        players[user.id].name = user.name;
        players[user.id].avatar = user.avatar;
    }
    
    localStorage.setItem('pixel_players', JSON.stringify(players));
    
    // Загружаем данные игрока
    const playerData = players[user.id];
    localStorage.setItem('pixels', playerData.pixels);
    localStorage.setItem('coins', playerData.coins);
    localStorage.setItem('player_rank', playerData.rank);
    localStorage.setItem('player_level', playerData.level);
    localStorage.setItem('player_xp', playerData.xp);
}

// ===================================================================
// ЧАСТЬ 10: ЭКРАН ВХОДА
// ===================================================================

function showLoginScreen() {
    const existingScreen = document.getElementById('loginScreen');
    if (existingScreen) {
        existingScreen.style.display = 'flex';
        return;
    }
    
    const loginScreen = document.createElement('div');
    loginScreen.id = 'loginScreen';
    loginScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a0f, #1a1a2e);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    loginScreen.innerHTML = `
        <div style="max-width: 400px; width: 100%; text-align: center;">
            <div style="margin-bottom: 40px;">
                <div style="font-size: 60px; margin-bottom: 20px;">🎮</div>
                <h1 style="color: #ffd700; font-size: 36px; margin-bottom: 10px;">PIXEL STRIKE</h1>
                <p style="color: #888;">Войдите чтобы сохранять прогресс</p>
            </div>
            
            <button id="googleSignInBtn" style="
                width: 100%;
                padding: 16px;
                background: #4285F4;
                border: none;
                border-radius: 15px;
                color: white;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                cursor: pointer;
                margin-bottom: 15px;
                box-shadow: 0 5px 20px #4285F460;
            ">
                <span style="font-size: 24px;">🇬</span>
                <span>ВОЙТИ ЧЕРЕЗ GOOGLE</span>
            </button>
            
            <button id="guestLoginBtn" style="
                width: 100%;
                padding: 14px;
                background: transparent;
                border: 2px solid #ffd700;
                border-radius: 15px;
                color: #ffd700;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                margin-bottom: 20px;
            ">
                👤 ИГРАТЬ БЕЗ АККАУНТА
            </button>
            
            <div style="background: rgba(0,0,0,0.3); border-radius: 15px; padding: 15px; text-align: left;">
                <div style="display: flex; align-items: center; gap: 10px; color: #ccc; padding: 8px 0;">
                    <span>🔒</span>
                    <span>Мы получим только ваше имя и аватар</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; color: #ccc; padding: 8px 0;">
                    <span>📍</span>
                    <span>Мы не знаем где вы живёте</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; color: #ccc; padding: 8px 0;">
                    <span>🛡️</span>
                    <span>Ваши данные в безопасности</span>
                </div>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
                Входя, вы соглашаетесь с условиями использования
            </p>
        </div>
    `;
    
    document.body.appendChild(loginScreen);
    
    // Привязываем кнопки
    document.getElementById('googleSignInBtn').onclick = signInWithGoogle;
    document.getElementById('guestLoginBtn').onclick = playAsGuest;
}

// ===================================================================
// ЧАСТЬ 11: ГОСТЕВОЙ РЕЖИМ
// ===================================================================

function playAsGuest() {
    const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const guestUser = {
        id: guestId,
        name: 'GUEST_' + Math.floor(Math.random() * 9999),
        avatar: '👤',
        provider: 'guest'
    };
    
    authState.isLoggedIn = true;
    authState.user = guestUser;
    
    localStorage.setItem('player_uid', guestId);
    localStorage.setItem('player_name', guestUser.name);
    localStorage.setItem('player_avatar', '👤');
    
    updateUIAfterLogin(guestUser);
    
    const loginScreen = document.getElementById('loginScreen');
    const mainMenu = document.getElementById('mainMenu');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainMenu) mainMenu.style.display = 'flex';
    
    showNotification('👤 ГОСТЕВОЙ РЕЖИМ', 'Прогресс сохраняется локально', 'info');
}

// ===================================================================
// ЧАСТЬ 12: ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===================================================================

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
                <div style="width: 50px; height: 50px; border: 4px solid #333; border-top-color: #ffd700; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div id="loadingText" style="margin-top: 20px; color: #ffd700;">${text}</div>
            `;
            document.body.appendChild(loading);
            
            const style = document.createElement('style');
            style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }
        loading.style.display = 'flex';
        document.getElementById('loadingText').textContent = text;
    } else {
        if (loading) loading.style.display = 'none';
    }
}

function showConfirmDialog(title, message, onConfirm) {
    if (confirm(`${title}\n\n${message}`)) {
        onConfirm();
    }
}

function showNotification(title, message, type) {
    if (typeof window.showNotification === 'function') {
        window.showNotification(title, message, type);
    } else {
        alert(`${title}\n${message}`);
    }
}

function playSound(type) {
    if (typeof window.playSound === 'function') {
        window.playSound(type);
    }
}

// ===================================================================
// ЧАСТЬ 13: ИНИЦИАЛИЗАЦИЯ И ЭКСПОРТ
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
    initGoogleAuth().then(() => {
        console.log('✅ Google Auth готов');
        
        // Если нет сохранённого пользователя — показываем экран входа
        const savedUser = localStorage.getItem('pixel_user');
        if (!savedUser) {
            setTimeout(showLoginScreen, 1000);
        }
    });
});

// Экспорт
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
window.playAsGuest = playAsGuest;
window.showLoginScreen = showLoginScreen;
window.authState = authState;

console.log('✅ google-auth.js загружен — Pixel Strike Google Sign-In');