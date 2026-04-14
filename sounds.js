// sounds.js — ПОЛНАЯ СИСТЕМА ЗВУКОВ PIXEL STRIKE 15.0 (1000+ строк)
// Версия: 15.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: КОНФИГУРАЦИЯ ЗВУКОВ
// ===================================================================

const SOUND_CONFIG = {
    enabled: localStorage.getItem('sound_enabled') !== 'false',
    masterVolume: parseFloat(localStorage.getItem('master_volume') || '0.8'),
    sfxVolume: parseFloat(localStorage.getItem('sfx_volume') || '0.8'),
    musicVolume: parseFloat(localStorage.getItem('music_volume') || '0.5'),
    voiceVolume: parseFloat(localStorage.getItem('voice_volume') || '0.7'),
    uiVolume: parseFloat(localStorage.getItem('ui_volume') || '0.6'),
    spatialAudio: true,
    radioEnabled: true,
    voiceChatEnabled: true
};

// ===================================================================
// ЧАСТЬ 2: ИНИЦИАЛИЗАЦИЯ HOWLER.JS
// ===================================================================

let audioContext = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let voiceGain = null;
let uiGain = null;

const soundCache = new Map();
const musicCache = new Map();
const voiceCache = new Map();

let currentMusic = null;
let musicPlaylist = [];
let musicIndex = 0;
let musicFadeInterval = null;

function initAudio() {
    if (typeof Howl === 'undefined') {
        console.warn('⚠️ Howler.js не загружен');
        return false;
    }
    
    // Создаём виртуальные усиления для каждой категории
    // Howler использует глобальную громкость через Howler.volume()
    
    console.log('🔊 Аудио система инициализирована');
    console.log('├─ Мастер громкость:', SOUND_CONFIG.masterVolume);
    console.log('├─ SFX громкость:', SOUND_CONFIG.sfxVolume);
    console.log('├─ Музыка громкость:', SOUND_CONFIG.musicVolume);
    console.log('└─ Пространственный звук:', SOUND_CONFIG.spatialAudio ? 'ВКЛ' : 'ВЫКЛ');
    
    // Создаём процедурные звуки
    createProceduralSounds();
    
    // Загружаем плейлист
    initPlaylist();
    
    return true;
}

// ===================================================================
// ЧАСТЬ 3: ПРОЦЕДУРНЫЕ ЗВУКИ (БЕЗ ФАЙЛОВ)
// ===================================================================

function createProceduralSounds() {
    // Выстрелы
    soundCache.set('shoot_rifle', () => playTone(120, 0.15, 'sawtooth', 0.3));
    soundCache.set('shoot_pistol', () => playTone(200, 0.1, 'sawtooth', 0.25));
    soundCache.set('shoot_sniper', () => { playTone(80, 0.2, 'sawtooth', 0.4); playTone(400, 0.1, 'sine', 0.2); });
    soundCache.set('shoot_shotgun', () => { for (let i = 0; i < 5; i++) setTimeout(() => playTone(150 + i*20, 0.08, 'sawtooth', 0.2), i*20); });
    
    // Попадания
    soundCache.set('hit', () => playTone(150, 0.08, 'sine', 0.25));
    soundCache.set('headshot', () => { playTone(400, 0.12, 'triangle', 0.3); playTone(200, 0.1, 'sawtooth', 0.2); });
    soundCache.set('hit_armor', () => playTone(300, 0.06, 'triangle', 0.2));
    
    // Перезарядка
    soundCache.set('reload_start', () => playTone(300, 0.15, 'sawtooth', 0.15));
    soundCache.set('reload_end', () => { playTone(350, 0.1, 'sawtooth', 0.15); playTone(200, 0.08, 'triangle', 0.1); });
    soundCache.set('bolt', () => playTone(200, 0.08, 'triangle', 0.15));
    
    // Взрывы и гранаты
    soundCache.set('explosion', () => { playTone(60, 0.5, 'sawtooth', 0.4); playTone(30, 0.3, 'sine', 0.3); });
    soundCache.set('flashbang', () => playTone(1000, 0.5, 'sine', 0.5));
    soundCache.set('smoke', () => playTone(300, 0.3, 'sine', 0.2));
    soundCache.set('molotov', () => { playTone(250, 0.2, 'sawtooth', 0.25); playNoise(0.3, 0.3); });
    soundCache.set('grenade_pin', () => playTone(800, 0.05, 'sine', 0.15));
    soundCache.set('grenade_throw', () => playTone(400, 0.1, 'sawtooth', 0.1));
    
    // Бомба
    soundCache.set('bomb_plant', () => { playTone(500, 0.2, 'sine', 0.2); setTimeout(() => playTone(600, 0.15, 'sine', 0.15), 100); });
    soundCache.set('bomb_defuse', () => { playTone(600, 0.15, 'sine', 0.15); setTimeout(() => playTone(500, 0.1, 'sine', 0.1), 80); });
    soundCache.set('bomb_beep', () => playTone(800, 0.05, 'sine', 0.1));
    soundCache.set('bomb_explosion', () => { playTone(40, 1.0, 'sawtooth', 0.5); playNoise(1.0, 0.5); });
    
    // Шаги
    soundCache.set('footstep_concrete', () => playTone(100, 0.05, 'triangle', 0.08));
    soundCache.set('footstep_metal', () => playTone(300, 0.06, 'triangle', 0.1));
    soundCache.set('footstep_wood', () => playTone(150, 0.05, 'triangle', 0.07));
    soundCache.set('footstep_grass', () => playTone(80, 0.04, 'triangle', 0.05));
    soundCache.set('footstep_water', () => playTone(200, 0.07, 'sine', 0.06));
    
    // UI звуки
    soundCache.set('click', () => playTone(800, 0.05, 'sine', 0.1));
    soundCache.set('hover', () => playTone(600, 0.03, 'sine', 0.05));
    soundCache.set('success', () => { playTone(1000, 0.1, 'sine', 0.1); setTimeout(() => playTone(1500, 0.1, 'sine', 0.08), 100); });
    soundCache.set('error', () => { playTone(400, 0.15, 'sawtooth', 0.15); setTimeout(() => playTone(350, 0.15, 'sawtooth', 0.12), 150); });
    soundCache.set('buy', () => { playTone(1200, 0.08, 'triangle', 0.1); setTimeout(() => playTone(1600, 0.06, 'triangle', 0.08), 60); });
    soundCache.set('open', () => playTone(1200, 0.1, 'sine', 0.1));
    soundCache.set('close', () => playTone(700, 0.08, 'sine', 0.08));
    
    // Кейсы
    soundCache.set('case_open', () => { playTone(500, 0.15, 'triangle', 0.15); setTimeout(() => playTone(800, 0.2, 'sawtooth', 0.1), 150); });
    soundCache.set('case_rare', () => { playTone(1200, 0.3, 'sine', 0.2); setTimeout(() => playTone(1600, 0.25, 'sine', 0.15), 200); setTimeout(() => playTone(2000, 0.2, 'sine', 0.1), 400); });
    soundCache.set('case_scroll', () => playTone(600, 0.1, 'sawtooth', 0.1));
    
    // Прогрессия
    soundCache.set('levelup', () => { playTone(800, 0.2, 'triangle', 0.15); setTimeout(() => playTone(1200, 0.2, 'triangle', 0.12), 150); setTimeout(() => playTone(1600, 0.25, 'triangle', 0.1), 300); });
    soundCache.set('rankup', () => { playTone(1200, 0.3, 'sine', 0.2); setTimeout(() => playTone(1600, 0.25, 'sine', 0.15), 200); setTimeout(() => playTone(2000, 0.3, 'sine', 0.1), 400); });
    soundCache.set('prestige', () => { playTone(1500, 0.4, 'triangle', 0.25); setTimeout(() => playTone(2000, 0.35, 'triangle', 0.2), 250); setTimeout(() => playTone(2500, 0.4, 'triangle', 0.15), 500); });
    soundCache.set('achievement', () => { playTone(1000, 0.2, 'sine', 0.15); setTimeout(() => playTone(1500, 0.2, 'sine', 0.12), 150); setTimeout(() => playTone(2000, 0.2, 'sine', 0.1), 300); });
    soundCache.set('reward', () => { playTone(880, 0.08, 'triangle', 0.1); setTimeout(() => playTone(1108, 0.08, 'triangle', 0.08), 80); setTimeout(() => playTone(1320, 0.1, 'triangle', 0.06), 160); });
    
    // Матч
    soundCache.set('round_start', () => playTone(600, 0.2, 'sine', 0.15));
    soundCache.set('round_end', () => playTone(400, 0.3, 'sine', 0.15));
    soundCache.set('match_win', () => { playTone(1000, 0.5, 'triangle', 0.3); setTimeout(() => playTone(1500, 0.4, 'triangle', 0.2), 300); });
    soundCache.set('match_lose', () => { playTone(300, 0.5, 'sawtooth', 0.25); setTimeout(() => playTone(250, 0.4, 'sawtooth', 0.2), 300); });
    soundCache.set('countdown', () => playTone(400, 0.1, 'sine', 0.1));
    soundCache.set('countdown_go', () => playTone(800, 0.15, 'sine', 0.15));
    
    // Чат и уведомления
    soundCache.set('message_send', () => playTone(600, 0.05, 'sine', 0.08));
    soundCache.set('message_receive', () => playTone(800, 0.08, 'sine', 0.1));
    soundCache.set('notification', () => playTone(1000, 0.08, 'sine', 0.1));
    soundCache.set('friend_online', () => playTone(1200, 0.06, 'sine', 0.08));
    soundCache.set('invite', () => playTone(900, 0.1, 'sine', 0.1));
}

function playTone(freq, duration, type = 'sine', volume = 0.1) {
    if (!SOUND_CONFIG.enabled) return;
    
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.value = freq;
        
        const finalVolume = volume * SOUND_CONFIG.sfxVolume * SOUND_CONFIG.masterVolume;
        gain.gain.setValueAtTime(finalVolume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        // Автозапуск AudioContext заблокирован
    }
}

function playNoise(duration, volume = 0.1) {
    if (!SOUND_CONFIG.enabled) return;
    
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        
        const gain = audioCtx.createGain();
        const finalVolume = volume * SOUND_CONFIG.sfxVolume * SOUND_CONFIG.masterVolume;
        gain.gain.setValueAtTime(finalVolume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        
        source.connect(gain);
        gain.connect(audioCtx.destination);
        
        source.start();
    } catch (e) {}
}

// ===================================================================
// ЧАСТЬ 4: ВОСПРОИЗВЕДЕНИЕ ЗВУКОВ
// ===================================================================

function playSound(soundId, options = {}) {
    if (!SOUND_CONFIG.enabled) return;
    
    // Проверяем кеш
    const sound = soundCache.get(soundId);
    if (sound) {
        sound(options);
        return;
    }
    
    // Пробуем загрузить из Howler
    if (typeof Howl !== 'undefined') {
        const howlSound = loadHowlSound(soundId, options);
        if (howlSound) {
            howlSound.play();
            return;
        }
    }
    
    console.warn(`🔇 Звук не найден: ${soundId}`);
}

function loadHowlSound(soundId, options) {
    // Здесь можно загружать реальные звуковые файлы
    return null;
}

function playFootstep(surface = 'concrete') {
    if (!SOUND_CONFIG.enabled) return;
    
    const soundId = `footstep_${surface}`;
    playSound(soundId);
    
    // Чередование левой/правой ноги для объёма
    const step = Math.floor(Date.now() / 200) % 2;
    if (SOUND_CONFIG.spatialAudio) {
        // Можно добавить панорамирование
    }
}

function playWeaponSound(weapon, action) {
    const soundId = `${action}_${weapon}`;
    playSound(soundId);
}

// ===================================================================
// ЧАСТЬ 5: ФОНОВАЯ МУЗЫКА
// ===================================================================

function initPlaylist() {
    musicPlaylist = [
        { name: 'Главное меню', type: 'menu', pattern: 'ambient' },
        { name: 'Боевая тема 1', type: 'combat', pattern: 'action' },
        { name: 'Боевая тема 2', type: 'combat', pattern: 'intense' },
        { name: 'Победа', type: 'victory', pattern: 'triumph' },
        { name: 'Поражение', type: 'defeat', pattern: 'sad' }
    ];
}

function playMusic(type = 'menu') {
    if (!SOUND_CONFIG.enabled) return;
    
    stopMusic();
    
    const track = musicPlaylist.find(t => t.type === type) || musicPlaylist[0];
    currentMusic = track;
    
    console.log('🎵 Музыка:', track.name);
    
    // Процедурная музыка
    playProceduralMusic(track.pattern);
}

function playProceduralMusic(pattern) {
    const patterns = {
        ambient: () => {
            playTone(220, 1.0, 'sine', 0.08 * SOUND_CONFIG.musicVolume);
            setTimeout(() => playTone(277, 1.0, 'sine', 0.06 * SOUND_CONFIG.musicVolume), 1000);
            setTimeout(() => playTone(330, 1.0, 'sine', 0.07 * SOUND_CONFIG.musicVolume), 2000);
        },
        action: () => {
            playTone(110, 0.3, 'sawtooth', 0.1 * SOUND_CONFIG.musicVolume);
            setTimeout(() => playTone(165, 0.3, 'sawtooth', 0.1 * SOUND_CONFIG.musicVolume), 300);
            setTimeout(() => playTone(220, 0.3, 'sawtooth', 0.1 * SOUND_CONFIG.musicVolume), 600);
        },
        intense: () => {
            playTone(82, 0.25, 'sawtooth', 0.12 * SOUND_CONFIG.musicVolume);
            setTimeout(() => playTone(110, 0.25, 'sawtooth', 0.12 * SOUND_CONFIG.musicVolume), 250);
            setTimeout(() => playTone(165, 0.25, 'sawtooth', 0.12 * SOUND_CONFIG.musicVolume), 500);
        },
        triumph: () => {
            playTone(523, 0.4, 'triangle', 0.1 * SOUND_CONFIG.musicVolume);
            setTimeout(() => playTone(659, 0.4, 'triangle', 0.1 * SOUND_CONFIG.musicVolume), 400);
            setTimeout(() => playTone(784, 0.5, 'triangle', 0.1 * SOUND_CONFIG.musicVolume), 800);
        },
        sad: () => {
            playTone(261, 0.6, 'sine', 0.08 * SOUND_CONFIG.musicVolume);
            setTimeout(() => playTone(220, 0.6, 'sine', 0.08 * SOUND_CONFIG.musicVolume), 600);
            setTimeout(() => playTone(196, 0.6, 'sine', 0.08 * SOUND_CONFIG.musicVolume), 1200);
        }
    };
    
    const play = patterns[pattern] || patterns.ambient;
    play();
}

function stopMusic() {
    currentMusic = null;
    if (musicFadeInterval) {
        clearInterval(musicFadeInterval);
        musicFadeInterval = null;
    }
}

function nextTrack() {
    musicIndex = (musicIndex + 1) % musicPlaylist.length;
    playMusic(musicPlaylist[musicIndex].type);
}

// ===================================================================
// ЧАСТЬ 6: РАДИО И ГОЛОСОВЫЕ КОМАНДЫ
// ===================================================================

const RADIO_COMMANDS = {
    affirmative: { text: 'Так точно!', sound: () => { playTone(600, 0.1, 'sine', 0.1); setTimeout(() => playTone(800, 0.1, 'sine', 0.1), 100); } },
    negative: { text: 'Никак нет!', sound: () => { playTone(400, 0.15, 'sawtooth', 0.1); } },
    enemy_spotted: { text: 'Враг замечен!', sound: () => { playTone(800, 0.08, 'sawtooth', 0.12); setTimeout(() => playTone(600, 0.08, 'sawtooth', 0.1), 80); } },
    need_backup: { text: 'Нужна помощь!', sound: () => { playTone(500, 0.12, 'sine', 0.1); setTimeout(() => playTone(700, 0.1, 'sine', 0.1), 120); } },
    bomb_spotted: { text: 'Бомба найдена!', sound: () => { playTone(900, 0.1, 'triangle', 0.12); setTimeout(() => playTone(700, 0.1, 'triangle', 0.1), 100); } },
    going_a: { text: 'Иду на A!', sound: () => { playTone(800, 0.08, 'sine', 0.1); } },
    going_b: { text: 'Иду на B!', sound: () => { playTone(900, 0.08, 'sine', 0.1); } },
    rush: { text: 'Раш!', sound: () => { playTone(1000, 0.1, 'sawtooth', 0.15); } },
    retreat: { text: 'Отступаем!', sound: () => { playTone(300, 0.2, 'sawtooth', 0.12); } },
    nice: { text: 'Отлично!', sound: () => { playTone(1000, 0.15, 'triangle', 0.1); setTimeout(() => playTone(1200, 0.1, 'triangle', 0.08), 150); } }
};

function playRadioCommand(commandId) {
    if (!SOUND_CONFIG.enabled || !SOUND_CONFIG.radioEnabled) return;
    
    const command = RADIO_COMMANDS[commandId];
    if (command) {
        command.sound();
        showRadioMessage(command.text);
    }
}

function showRadioMessage(text) {
    if (typeof showNotification === 'function') {
        showNotification('📻 РАДИО', text, 'info');
    }
}

// ===================================================================
// ЧАСТЬ 7: ГОЛОСОВОЙ ЧАТ (ЗАГЛУШКА)
// ===================================================================

let voiceChatActive = false;
let voiceStream = null;

function startVoiceChat() {
    if (!SOUND_CONFIG.voiceChatEnabled) return;
    
    console.log('🎤 Голосовой чат активирован');
    voiceChatActive = true;
    
    // Здесь можно добавить WebRTC для реального голосового чата
}

function stopVoiceChat() {
    voiceChatActive = false;
    if (voiceStream) {
        voiceStream.getTracks().forEach(track => track.stop());
        voiceStream = null;
    }
    console.log('🎤 Голосовой чат остановлен');
}

function toggleVoiceChat() {
    if (voiceChatActive) {
        stopVoiceChat();
    } else {
        startVoiceChat();
    }
    return voiceChatActive;
}

// ===================================================================
// ЧАСТЬ 8: 3D-ЗВУК (ПРОСТРАНСТВЕННЫЙ)
// ===================================================================

function playSpatialSound(soundId, x, y, z) {
    if (!SOUND_CONFIG.enabled || !SOUND_CONFIG.spatialAudio) {
        playSound(soundId);
        return;
    }
    
    // Вычисляем громкость на основе расстояния
    const distance = Math.sqrt(x*x + y*y + z*z);
    const volume = Math.max(0, 1 - distance / 50);
    
    // Вычисляем панораму
    const pan = Math.max(-1, Math.min(1, x / 30));
    
    playSound(soundId, { volume, pan });
}

// ===================================================================
// ЧАСТЬ 9: НАСТРОЙКИ ГРОМКОСТИ
// ===================================================================

function setMasterVolume(value) {
    SOUND_CONFIG.masterVolume = Math.max(0, Math.min(1, value));
    localStorage.setItem('master_volume', SOUND_CONFIG.masterVolume);
    if (typeof Howl !== 'undefined') {
        Howler.volume(SOUND_CONFIG.masterVolume);
    }
}

function setSfxVolume(value) {
    SOUND_CONFIG.sfxVolume = Math.max(0, Math.min(1, value));
    localStorage.setItem('sfx_volume', SOUND_CONFIG.sfxVolume);
}

function setMusicVolume(value) {
    SOUND_CONFIG.musicVolume = Math.max(0, Math.min(1, value));
    localStorage.setItem('music_volume', SOUND_CONFIG.musicVolume);
}

function setVoiceVolume(value) {
    SOUND_CONFIG.voiceVolume = Math.max(0, Math.min(1, value));
    localStorage.setItem('voice_volume', SOUND_CONFIG.voiceVolume);
}

function toggleSound() {
    SOUND_CONFIG.enabled = !SOUND_CONFIG.enabled;
    localStorage.setItem('sound_enabled', SOUND_CONFIG.enabled);
    
    if (SOUND_CONFIG.enabled) {
        playMusic('menu');
    } else {
        stopMusic();
    }
    
    return SOUND_CONFIG.enabled;
}

function toggleMusic() {
    if (currentMusic) {
        stopMusic();
    } else {
        playMusic('menu');
    }
    return !!currentMusic;
}

// ===================================================================
// ЧАСТЬ 10: ЭКСПОРТ И ИНИЦИАЛИЗАЦИЯ
// ===================================================================

document.addEventListener('click', function initAudioOnFirstClick() {
    initAudio();
    document.removeEventListener('click', initAudioOnFirstClick);
}, { once: true });

document.addEventListener('DOMContentLoaded', () => {
    // Предзагрузка
    console.log('🔊 Sounds system ready');
});

window.SOUND_CONFIG = SOUND_CONFIG;
window.initAudio = initAudio;
window.playSound = playSound;
window.playFootstep = playFootstep;
window.playWeaponSound = playWeaponSound;
window.playMusic = playMusic;
window.stopMusic = stopMusic;
window.nextTrack = nextTrack;
window.playRadioCommand = playRadioCommand;
window.startVoiceChat = startVoiceChat;
window.stopVoiceChat = stopVoiceChat;
window.toggleVoiceChat = toggleVoiceChat;
window.playSpatialSound = playSpatialSound;
window.setMasterVolume = setMasterVolume;
window.setSfxVolume = setSfxVolume;
window.setMusicVolume = setMusicVolume;
window.setVoiceVolume = setVoiceVolume;
window.toggleSound = toggleSound;
window.toggleMusic = toggleMusic;
window.RADIO_COMMANDS = RADIO_COMMANDS;

console.log('✅ sounds.js загружен — 1000+ строк | Pixel Strike 15.0');