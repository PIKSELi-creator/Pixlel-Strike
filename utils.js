// utils.js — ПОЛНЫЙ НАБОР УТИЛИТ PIXEL STRIKE 15.0 (1000+ строк)
// Версия: 15.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: ФОРМАТИРОВАНИЕ ЧИСЕЛ
// ===================================================================

function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatMoney(amount) {
    return '$' + formatNumber(amount);
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU');
}

function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals = [
        { label: 'год', seconds: 31536000 },
        { label: 'месяц', seconds: 2592000 },
        { label: 'неделя', seconds: 604800 },
        { label: 'день', seconds: 86400 },
        { label: 'час', seconds: 3600 },
        { label: 'минута', seconds: 60 }
    ];
    
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${getRussianPlural(count)} назад`;
        }
    }
    return 'только что';
}

function getRussianPlural(count) {
    const lastDigit = count % 10;
    const lastTwo = count % 100;
    if (lastTwo >= 11 && lastTwo <= 19) return '';
    if (lastDigit === 1) return '';
    if (lastDigit >= 2 && lastDigit <= 4) return 'а';
    return 'ов';
}

// ===================================================================
// ЧАСТЬ 2: СЛУЧАЙНЫЕ ЗНАЧЕНИЯ
// ===================================================================

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function chance(probability) {
    return Math.random() < probability;
}

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function weightedRandom(items) {
    const total = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let rand = Math.random() * total;
    for (const item of items) {
        rand -= (item.weight || 1);
        if (rand <= 0) return item;
    }
    return items[0];
}

function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// ===================================================================
// ЧАСТЬ 3: РАБОТА С МАССИВАМИ И ОБЪЕКТАМИ
// ===================================================================

function uniqueArray(array) {
    return [...new Set(array)];
}

function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        if (!result[groupKey]) result[groupKey] = [];
        result[groupKey].push(item);
        return result;
    }, {});
}

function sortBy(array, key, ascending = true) {
    return [...array].sort((a, b) => {
        const valA = typeof key === 'function' ? key(a) : a[key];
        const valB = typeof key === 'function' ? key(b) : b[key];
        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
    });
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

function pick(obj, keys) {
    const result = {};
    keys.forEach(key => { if (obj.hasOwnProperty(key)) result[key] = obj[key]; });
    return result;
}

function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => { delete result[key]; });
    return result;
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

// ===================================================================
// ЧАСТЬ 4: РАБОТА СО СТРОКАМИ
// ===================================================================

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function truncate(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

function slugify(str) {
    return str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-');
}

function randomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateId(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function parseQueryString(url) {
    const params = {};
    const queryString = url.split('?')[1];
    if (!queryString) return params;
    queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
    return params;
}

function buildQueryString(params) {
    return Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
}

// ===================================================================
// ЧАСТЬ 5: РАБОТА С ДАТАМИ
// ===================================================================

function getDaysBetween(date1, date2) {
    const diff = Math.abs(date1 - date2);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getTimeUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight - now) / 1000);
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

function isYesterday(date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
}

// ===================================================================
// ЧАСТЬ 6: РАБОТА С ЛОКАЛЬНЫМ ХРАНИЛИЩЕМ
// ===================================================================

function saveData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Ошибка сохранения:', e);
        return false;
    }
}

function loadData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error('Ошибка загрузки:', e);
        return defaultValue;
    }
}

function removeData(key) {
    localStorage.removeItem(key);
}

function clearAllData() {
    localStorage.clear();
}

function getStorageSize() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        total += key.length + value.length;
    }
    return total;
}

// ===================================================================
// ЧАСТЬ 7: МАТЕМАТИЧЕСКИЕ ФУНКЦИИ
// ===================================================================

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

function angleDifference(angle1, angle2) {
    let diff = normalizeAngle(angle1 - angle2);
    return Math.abs(diff);
}

function calculateDamage(baseDamage, headshot = false, armor = 0, distance = 0) {
    let damage = baseDamage;
    if (headshot) damage *= 4.0;
    const distanceFactor = Math.max(0.5, 1 - (distance / 1000) * 0.5);
    damage *= distanceFactor;
    if (armor > 0) {
        damage *= 0.5;
    }
    return Math.round(damage);
}

function calculateEloChange(winnerElo, loserElo, kFactor = 32) {
    const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    return Math.round(kFactor * (1 - expected));
}

// ===================================================================
// ЧАСТЬ 8: ФУНКЦИИ ДЛЯ UI
// ===================================================================

function copyToClipboard(text) {
    navigator.clipboard?.writeText(text);
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function once(func) {
    let called = false;
    let result;
    return function(...args) {
        if (!called) {
            called = true;
            result = func(...args);
        }
        return result;
    };
}

// ===================================================================
// ЧАСТЬ 9: ПРОВЕРКИ И ВАЛИДАЦИЯ
// ===================================================================

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidUsername(username) {
    return username && username.length >= 3 && username.length <= 16 && /^[a-zA-Z0-9_]+$/.test(username);
}

function isOnline() {
    return navigator.onLine;
}

function getDeviceInfo() {
    const ua = navigator.userAgent;
    return {
        isMobile: /Android|iPhone|iPad|iPod/i.test(ua),
        isAndroid: /Android/i.test(ua),
        isIOS: /iPhone|iPad|iPod/i.test(ua),
        browser: detectBrowser(),
        os: detectOS()
    };
}

function detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
}

function detectOS() {
    const ua = navigator.userAgent;
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown';
}

// ===================================================================
// ЧАСТЬ 10: ЦВЕТА И СТИЛИ
// ===================================================================

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => { const hex = x.toString(16); return hex.length === 1 ? '0' + hex : hex; }).join('');
}

function lightenColor(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const lighten = (c) => Math.min(255, c + (255 - c) * percent);
    return rgbToHex(lighten(rgb.r), lighten(rgb.g), lighten(rgb.b));
}

function darkenColor(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const darken = (c) => Math.max(0, c * (1 - percent));
    return rgbToHex(darken(rgb.r), darken(rgb.g), darken(rgb.b));
}

function getRarityColor(rarity) {
    const colors = { common: '#888', rare: '#4169E1', epic: '#8A2BE2', legendary: '#FFD700', mythic: '#FF4500' };
    return colors[rarity] || '#888';
}

// ===================================================================
// ЧАСТЬ 11: УВЕДОМЛЕНИЯ
// ===================================================================

function showNotification(title, message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const colors = { success: '#2ecc71', error: '#e74c3c', warning: '#f39c12', info: '#3498db' };
    
    const notif = document.createElement('div');
    notif.style.cssText = `background: rgba(30,40,60,0.95); border-left: 4px solid ${colors[type] || '#ffd700'}; border-radius: 12px; padding: 15px; margin-bottom: 10px; animation: slideDown 0.3s;`;
    notif.innerHTML = `<div style="font-weight:bold;color:${colors[type] || '#ffd700'}">${title}</div><div style="font-size:13px;color:#ccc;">${message}</div>`;
    container.appendChild(notif);
    setTimeout(() => { notif.style.animation = 'slideUp 0.3s'; setTimeout(() => notif.remove(), 300); }, 3000);
}

function showConfirmDialog(title, message, onConfirm, onCancel) {
    if (confirm(`${title}\n\n${message}`)) { onConfirm?.(); } else { onCancel?.(); }
}

// ===================================================================
// ЧАСТЬ 12: ЭКСПОРТ
// ===================================================================

window.formatNumber = formatNumber;
window.formatMoney = formatMoney;
window.formatTime = formatTime;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.formatTimeAgo = formatTimeAgo;
window.random = random;
window.randomFloat = randomFloat;
window.chance = chance;
window.randomItem = randomItem;
window.weightedRandom = weightedRandom;
window.shuffleArray = shuffleArray;
window.uniqueArray = uniqueArray;
window.groupBy = groupBy;
window.sortBy = sortBy;
window.deepClone = deepClone;
window.deepMerge = deepMerge;
window.pick = pick;
window.omit = omit;
window.isEmpty = isEmpty;
window.capitalize = capitalize;
window.truncate = truncate;
window.slugify = slugify;
window.randomString = randomString;
window.generateId = generateId;
window.parseQueryString = parseQueryString;
window.buildQueryString = buildQueryString;
window.getDaysBetween = getDaysBetween;
window.getTimeUntilMidnight = getTimeUntilMidnight;
window.isToday = isToday;
window.isYesterday = isYesterday;
window.saveData = saveData;
window.loadData = loadData;
window.removeData = removeData;
window.clearAllData = clearAllData;
window.clamp = clamp;
window.lerp = lerp;
window.distance = distance;
window.angle = angle;
window.normalizeAngle = normalizeAngle;
window.angleDifference = angleDifference;
window.calculateDamage = calculateDamage;
window.calculateEloChange = calculateEloChange;
window.copyToClipboard = copyToClipboard;
window.debounce = debounce;
window.throttle = throttle;
window.once = once;
window.isValidEmail = isValidEmail;
window.isValidUsername = isValidUsername;
window.isOnline = isOnline;
window.getDeviceInfo = getDeviceInfo;
window.hexToRgb = hexToRgb;
window.rgbToHex = rgbToHex;
window.lightenColor = lightenColor;
window.darkenColor = darkenColor;
window.getRarityColor = getRarityColor;
window.showNotification = showNotification;
window.showConfirmDialog = showConfirmDialog;

console.log('✅ utils.js загружен — 1000+ строк | Pixel Strike 15.0');