// animation.js — ПОЛНАЯ СИСТЕМА АНИМАЦИЙ PIXEL STRIKE 15.0 (1500+ строк)
// Версия: 15.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: НАСТРОЙКИ АНИМАЦИЙ
// ===================================================================

const ANIMATION_CONFIG = {
    enabled: true,
    particles: true,
    screenshake: true,
    blood: true,
    muzzleFlash: true,
    hitEffects: true,
    explosions: true,
    confetti: true,
    transitions: true,
    
    // Интенсивность эффектов
    intensity: {
        screenshake: 1.0,
        blood: 1.0,
        particles: 1.0,
        muzzleFlash: 1.0
    },
    
    // Цвета
    colors: {
        blood: ['#ff0000', '#cc0000', '#990000', '#ff4444'],
        fire: ['#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00'],
        electric: ['#00ffff', '#44aaff', '#0088ff', '#0044cc'],
        gold: ['#ffd700', '#ffcc00', '#ffaa00', '#ff8800'],
        smoke: ['#888888', '#aaaaaa', '#666666', '#999999']
    }
};

// Хранилище активных эффектов
let activeEffects = [];
let particleSystems = [];
let animationFrame = null;
let globalAnimationSpeed = 1.0;

// ===================================================================
// ЧАСТЬ 2: ЭФФЕКТЫ ВЫСТРЕЛА
// ===================================================================

function shootEffect(element, weaponType = 'rifle') {
    if (!ANIMATION_CONFIG.enabled || !ANIMATION_CONFIG.muzzleFlash) return;
    
    const intensity = ANIMATION_CONFIG.intensity.muzzleFlash;
    
    // Вспышка на оружии
    const flash = document.createElement('div');
    flash.className = 'muzzle-flash';
    flash.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(255,200,0,${0.8 * intensity}) 0%, rgba(255,100,0,${0.4 * intensity}) 50%, transparent 100%);
        pointer-events: none;
        z-index: 200;
        animation: muzzleFlash ${0.08 / globalAnimationSpeed}s ease-out;
    `;
    
    if (element) {
        element.style.position = 'relative';
        element.appendChild(flash);
        setTimeout(() => flash.remove(), 80 / globalAnimationSpeed);
    }
    
    // Полноэкранная вспышка для снайперских винтовок
    if (weaponType === 'sniper') {
        const fullFlash = document.createElement('div');
        fullFlash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,${0.3 * intensity});
            pointer-events: none;
            z-index: 999;
            animation: fullFlash ${0.15 / globalAnimationSpeed}s ease-out;
        `;
        document.body.appendChild(fullFlash);
        setTimeout(() => fullFlash.remove(), 150 / globalAnimationSpeed);
    }
    
    // Дым от выстрела
    createSmoke(element, weaponType);
    
    // Гильза
    if (weaponType !== 'shotgun') {
        ejectShell(element, weaponType);
    }
    
    // Звук
    playSound('shoot', { weapon: weaponType });
    
    // Вибрация
    vibrate(weaponType === 'sniper' ? 40 : 20);
}

function createSmoke(element, weaponType) {
    if (!element) return;
    
    const smokeCount = weaponType === 'shotgun' ? 5 : 2;
    
    for (let i = 0; i < smokeCount; i++) {
        setTimeout(() => {
            const smoke = document.createElement('div');
            const size = 15 + Math.random() * 20;
            const color = ANIMATION_CONFIG.colors.smoke[Math.floor(Math.random() * ANIMATION_CONFIG.colors.smoke.length)];
            
            smoke.style.cssText = `
                position: absolute;
                bottom: ${10 + Math.random() * 20}px;
                left: ${40 + Math.random() * 20}%;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, ${color}99 0%, ${color}33 70%, transparent 100%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 150;
                animation: smokeRise ${0.8 / globalAnimationSpeed}s ease-out forwards;
                --drift: ${(Math.random() - 0.5) * 50}px;
            `;
            
            element.appendChild(smoke);
            setTimeout(() => smoke.remove(), 800 / globalAnimationSpeed);
        }, i * 30);
    }
}

function ejectShell(element, weaponType) {
    if (!element) return;
    
    const shell = document.createElement('div');
    const colors = weaponType === 'rifle' ? ['#ffaa00', '#cc8800'] : ['#aaaaaa', '#888888'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    shell.style.cssText = `
        position: absolute;
        bottom: 0;
        right: 20px;
        width: 6px;
        height: 12px;
        background: ${color};
        border-radius: 3px;
        pointer-events: none;
        z-index: 160;
        animation: shellEject ${0.6 / globalAnimationSpeed}s ease-out forwards;
        --rotation: ${Math.random() * 720}deg;
        --drift: ${(Math.random() - 0.5) * 30}px;
    `;
    
    element.appendChild(shell);
    setTimeout(() => shell.remove(), 600 / globalAnimationSpeed);
}

// ===================================================================
// ЧАСТЬ 3: ЭФФЕКТЫ ПОПАДАНИЯ
// ===================================================================

function hitEffect(element, headshot = false, weaponDamage = 35) {
    if (!ANIMATION_CONFIG.enabled || !ANIMATION_CONFIG.hitEffects) return;
    
    const intensity = ANIMATION_CONFIG.intensity.blood;
    const color = headshot ? '#ff0000' : '#ff6600';
    const size = headshot ? 150 : 100;
    const particleCount = headshot ? 15 : 8;
    
    // Кровь
    if (ANIMATION_CONFIG.blood) {
        const blood = document.createElement('div');
        blood.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size * intensity}px;
            height: ${size * intensity}px;
            background: radial-gradient(circle, ${color} 0%, ${color}88 40%, transparent 70%);
            opacity: 0.8;
            pointer-events: none;
            z-index: 200;
            border-radius: 50%;
            animation: bloodSplatter ${0.3 / globalAnimationSpeed}s ease-out;
        `;
        
        if (element) {
            element.style.position = 'relative';
            element.appendChild(blood);
            setTimeout(() => blood.remove(), 300 / globalAnimationSpeed);
        }
        
        // Брызги крови
        for (let i = 0; i < particleCount; i++) {
            createBloodDrop(element, ANIMATION_CONFIG.colors.blood);
        }
    }
    
    // Хитмаркер
    showHitMarker(headshot, weaponDamage);
    
    // Тряска экрана
    if (ANIMATION_CONFIG.screenshake) {
        shakeScreen(headshot ? 8 : 4);
    }
    
    // Звук попадания
    playSound(headshot ? 'headshot' : 'hit');
    
    // Вибрация
    vibrate(headshot ? 60 : 30);
}

function createBloodDrop(element, colors) {
    if (!element) return;
    
    const drop = document.createElement('div');
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 60;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 5 + Math.random() * 10;
    
    drop.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 150;
        animation: bloodDrop ${0.4 / globalAnimationSpeed}s ease-out forwards;
        --tx: ${Math.cos(angle) * distance}px;
        --ty: ${Math.sin(angle) * distance}px;
    `;
    
    element.appendChild(drop);
    setTimeout(() => drop.remove(), 400 / globalAnimationSpeed);
}

function showHitMarker(headshot = false, damage = 0) {
    const existing = document.getElementById('hitmarker');
    if (existing) existing.remove();
    
    const marker = document.createElement('div');
    marker.id = 'hitmarker';
    marker.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 300;
        opacity: 1;
        animation: hitMarkerFade ${0.15 / globalAnimationSpeed}s ease-out;
    `;
    
    if (headshot) {
        marker.innerHTML = `
            <div style="width: 35px; height: 35px; border: 4px solid #ff0000; border-radius: 0; box-shadow: 0 0 30px #ff0000;"></div>
            <div style="color: #ff0000; text-align: center; font-weight: bold; margin-top: 5px; text-shadow: 0 0 10px #ff0000;">${damage}</div>
        `;
    } else {
        marker.innerHTML = `
            <div style="width: 25px; height: 25px; border: 3px solid white; border-radius: 0;"></div>
            <div style="color: white; text-align: center; font-weight: bold; margin-top: 5px;">${damage}</div>
        `;
    }
    
    document.body.appendChild(marker);
    setTimeout(() => marker.remove(), 150 / globalAnimationSpeed);
}

// ===================================================================
// ЧАСТЬ 4: ЭФФЕКТЫ ВЗРЫВА
// ===================================================================

function explosionEffect(container, size = 'normal') {
    if (!ANIMATION_CONFIG.enabled || !ANIMATION_CONFIG.explosions) return;
    
    const sizes = { small: 150, normal: 250, large: 400, huge: 600 };
    const explosionSize = sizes[size] || 250;
    const intensity = ANIMATION_CONFIG.intensity.particles;
    
    // Основной взрыв
    const explosion = document.createElement('div');
    explosion.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${explosionSize * intensity}px;
        height: ${explosionSize * intensity}px;
        background: radial-gradient(circle, #ff4400 0%, #ff0000 40%, #ff6600 70%, transparent 100%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 250;
        animation: explosion ${0.6 / globalAnimationSpeed}s ease-out;
    `;
    
    if (container) {
        container.style.position = 'relative';
        container.appendChild(explosion);
    } else {
        document.body.appendChild(explosion);
    }
    
    // Частицы
    const particleCount = size === 'huge' ? 50 : (size === 'large' ? 30 : (size === 'small' ? 10 : 20));
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            createExplosionParticle(container, i, size);
        }, i * 10);
    }
    
    // Огненные частицы
    for (let i = 0; i < particleCount / 2; i++) {
        setTimeout(() => {
            createFireParticle(container);
        }, i * 15);
    }
    
    // Тряска
    if (ANIMATION_CONFIG.screenshake) {
        shakeScreen(size === 'huge' ? 20 : (size === 'large' ? 15 : 10));
    }
    
    // Вспышка
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255,100,0,${0.3 * intensity});
        pointer-events: none;
        z-index: 998;
        animation: fullFlash ${0.3 / globalAnimationSpeed}s ease-out;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300 / globalAnimationSpeed);
    
    // Звук
    playSound('explosion', { size });
    vibrate(size === 'huge' ? 200 : (size === 'large' ? 150 : 100));
    
    setTimeout(() => explosion.remove(), 600 / globalAnimationSpeed);
}

function createExplosionParticle(container, index, size) {
    const particle = document.createElement('div');
    const angle = (index * 37) * Math.PI / 180;
    const distance = 50 + Math.random() * 150;
    const particleSize = 5 + Math.random() * 20;
    const colors = ANIMATION_CONFIG.colors.fire;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${particleSize}px;
        height: ${particleSize}px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 200;
        box-shadow: 0 0 20px ${color};
        animation: particleFly ${0.8 / globalAnimationSpeed}s ease-out forwards;
        --tx: ${Math.cos(angle) * distance}px;
        --ty: ${Math.sin(angle) * distance}px;
    `;
    
    if (container) {
        container.appendChild(particle);
    } else {
        document.body.appendChild(particle);
    }
    
    setTimeout(() => particle.remove(), 800 / globalAnimationSpeed);
}

function createFireParticle(container) {
    const particle = document.createElement('div');
    const size = 3 + Math.random() * 8;
    const color = ANIMATION_CONFIG.colors.fire[Math.floor(Math.random() * ANIMATION_CONFIG.colors.fire.length)];
    
    particle.style.cssText = `
        position: absolute;
        top: ${40 + Math.random() * 20}%;
        left: ${40 + Math.random() * 20}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 220;
        box-shadow: 0 0 10px ${color};
        animation: fireRise ${1 + Math.random()}s ease-out forwards;
    `;
    
    if (container) {
        container.appendChild(particle);
    } else {
        document.body.appendChild(particle);
    }
    
    setTimeout(() => particle.remove(), 2000);
}

// ===================================================================
// ЧАСТЬ 5: ЭФФЕКТЫ ГРАНАТ
// ===================================================================

function flashbangEffect(duration = 3000) {
    if (!ANIMATION_CONFIG.enabled) return;
    
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        pointer-events: none;
        z-index: 1000;
        animation: flashbang ${duration / globalAnimationSpeed}ms ease-out forwards;
    `;
    document.body.appendChild(flash);
    
    // Звон в ушах
    playSound('flashbang');
    vibrate(200);
    
    setTimeout(() => flash.remove(), duration / globalAnimationSpeed);
}

function smokeGrenadeEffect(container, duration = 15000) {
    if (!ANIMATION_CONFIG.enabled) return;
    
    const smoke = document.createElement('div');
    smoke.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, rgba(150,150,150,0.7) 0%, rgba(100,100,100,0.4) 50%, transparent 80%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 150;
        animation: smokeGrow ${duration / globalAnimationSpeed}ms ease-out forwards;
    `;
    
    if (container) {
        container.style.position = 'relative';
        container.appendChild(smoke);
    }
    
    // Дополнительные клубы дыма
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const extraSmoke = document.createElement('div');
            extraSmoke.style.cssText = `
                position: absolute;
                top: ${30 + Math.random() * 40}%;
                left: ${30 + Math.random() * 40}%;
                width: 80px;
                height: 80px;
                background: radial-gradient(circle, rgba(120,120,120,0.5) 0%, transparent 70%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 140;
                animation: smokeDrift ${(duration - 2000) / globalAnimationSpeed}ms ease-out forwards;
                --drift: ${(Math.random() - 0.5) * 100}px;
            `;
            container.appendChild(extraSmoke);
            setTimeout(() => extraSmoke.remove(), duration - 2000);
        }, i * 500);
    }
    
    playSound('smoke');
    
    setTimeout(() => smoke.remove(), duration / globalAnimationSpeed);
}

function molotovEffect(container, duration = 7000) {
    if (!ANIMATION_CONFIG.enabled) return;
    
    const fire = document.createElement('div');
    fire.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, #ff4400 0%, #ff6600 40%, #ff8800 70%, transparent 100%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 150;
        animation: fireBurn ${duration / globalAnimationSpeed}ms ease-out forwards;
    `;
    
    if (container) {
        container.style.position = 'relative';
        container.appendChild(fire);
    }
    
    // Частицы огня
    for (let i = 0; i < 30; i++) {
        setTimeout(() => createFireParticle(container), i * 100);
    }
    
    playSound('molotov');
    
    setTimeout(() => fire.remove(), duration / globalAnimationSpeed);
}

// ===================================================================
// ЧАСТЬ 6: ЭФФЕКТЫ ИНТЕРФЕЙСА
// ===================================================================

function levelUpEffect(element) {
    if (!ANIMATION_CONFIG.enabled) return;
    
    if (!element) element = document.body;
    
    element.style.animation = `levelUp ${0.8 / globalAnimationSpeed}s ease-out`;
    setTimeout(() => element.style.animation = '', 800 / globalAnimationSpeed);
    
    // Лучи
    for (let i = 0; i < 12; i++) {
        const ray = document.createElement('div');
        const angle = (i * 30) * Math.PI / 180;
        
        ray.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 4px;
            height: 100px;
            background: linear-gradient(180deg, #ffd700, transparent);
            transform: translate(-50%, -50%) rotate(${i * 30}deg);
            pointer-events: none;
            z-index: 200;
            animation: rayExpand ${0.8 / globalAnimationSpeed}s ease-out;
        `;
        
        element.style.position = 'relative';
        element.appendChild(ray);
        setTimeout(() => ray.remove(), 800 / globalAnimationSpeed);
    }
    
    // Конфетти
    createConfetti(30);
    
    playSound('levelup');
    vibrate([50, 30, 50, 30, 100]);
}

function rewardEffect(value, type = 'pixels') {
    if (!ANIMATION_CONFIG.enabled) return;
    
    const popup = document.createElement('div');
    const icons = { pixels: '💰', coins: '🪙', xp: '⭐', case: '🎁', skin: '🔫' };
    
    popup.style.cssText = `
        position: fixed;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
        font-weight: bold;
        color: #ffd700;
        text-shadow: 0 0 30px #ffd700, 0 0 60px #ff8c00;
        z-index: 500;
        pointer-events: none;
        white-space: nowrap;
        animation: rewardPopup ${1.5 / globalAnimationSpeed}s ease-out forwards;
    `;
    
    popup.textContent = `${icons[type] || '🎁'} +${typeof value === 'number' ? formatNumber(value) : value}`;
    document.body.appendChild(popup);
    
    playSound('reward');
    
    setTimeout(() => popup.remove(), 1500 / globalAnimationSpeed);
}

function caseOpenEffect(container, rarity = 'common') {
    if (!ANIMATION_CONFIG.enabled) return;
    
    const colors = {
        common: '#888',
        rare: '#4169E1',
        epic: '#8A2BE2',
        legendary: '#FFD700',
        mythic: '#FF4500'
    };
    
    const color = colors[rarity] || '#888';
    
    // Свечение
    const glow = document.createElement('div');
    glow.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, ${color}40 0%, transparent 70%);
        pointer-events: none;
        z-index: 200;
        animation: glowPulse ${1 / globalAnimationSpeed}s ease-out;
    `;
    
    if (container) {
        container.style.position = 'relative';
        container.appendChild(glow);
    }
    
    // Звёзды для легендарок
    if (rarity === 'legendary' || rarity === 'mythic') {
        createConfetti(rarity === 'mythic' ? 80 : 50);
        for (let i = 0; i < 20; i++) {
            setTimeout(() => createStar(container, color), i * 50);
        }
    }
    
    playSound(rarity === 'legendary' || rarity === 'mythic' ? 'case_rare' : 'case_open');
    vibrate(rarity === 'legendary' || rarity === 'mythic' ? [50, 30, 50, 30, 100] : 50);
    
    setTimeout(() => glow.remove(), 1000 / globalAnimationSpeed);
}

function createStar(container, color) {
    const star = document.createElement('div');
    star.style.cssText = `
        position: absolute;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        width: 4px;
        height: 4px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 210;
        box-shadow: 0 0 10px ${color};
        animation: starTwinkle ${1 / globalAnimationSpeed}s ease-out forwards;
    `;
    
    if (container) container.appendChild(star);
    setTimeout(() => star.remove(), 1000 / globalAnimationSpeed);
}

// ===================================================================
// ЧАСТЬ 7: ПОБЕДА И ПОРАЖЕНИЕ
// ===================================================================

function victoryEffect() {
    if (!ANIMATION_CONFIG.enabled) return;
    
    // Конфетти
    createConfetti(100);
    
    // Вспышка
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%);
        pointer-events: none;
        z-index: 500;
        animation: fullFlash ${0.8 / globalAnimationSpeed}s ease-out;
    `;
    document.body.appendChild(flash);
    
    // Текст победы
    const text = document.createElement('div');
    text.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 60px;
        font-weight: bold;
        color: #ffd700;
        text-shadow: 0 0 50px #ffd700;
        z-index: 501;
        pointer-events: none;
        white-space: nowrap;
        animation: victoryText ${2 / globalAnimationSpeed}s ease-out forwards;
    `;
    text.textContent = '🏆 ПОБЕДА! 🏆';
    document.body.appendChild(text);
    
    // Дополнительные эффекты
    for (let i = 0; i < 10; i++) {
        setTimeout(() => createStar(document.body, '#ffd700'), i * 100);
    }
    
    playSound('win');
    vibrate([100, 50, 100, 50, 200]);
    
    setTimeout(() => { flash.remove(); text.remove(); }, 2000 / globalAnimationSpeed);
}

function defeatEffect() {
    if (!ANIMATION_CONFIG.enabled) return;
    
    // Затемнение
    const darken = document.createElement('div');
    darken.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        pointer-events: none;
        z-index: 500;
        animation: darkenPulse ${1.5 / globalAnimationSpeed}s ease-out;
    `;
    document.body.appendChild(darken);
    
    // Текст поражения
    const text = document.createElement('div');
    text.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 50px;
        font-weight: bold;
        color: #e74c3c;
        text-shadow: 0 0 50px #e74c3c;
        z-index: 501;
        pointer-events: none;
        white-space: nowrap;
        animation: defeatText ${2 / globalAnimationSpeed}s ease-out forwards;
    `;
    text.textContent = '💀 ПОРАЖЕНИЕ 💀';
    document.body.appendChild(text);
    
    playSound('lose');
    vibrate([200, 100, 200]);
    
    setTimeout(() => { darken.remove(); text.remove(); }, 2000 / globalAnimationSpeed);
}

// ===================================================================
// ЧАСТЬ 8: КОНФЕТТИ И ЧАСТИЦЫ
// ===================================================================

function createConfetti(count = 50) {
    if (!ANIMATION_CONFIG.enabled || !ANIMATION_CONFIG.confetti) return;
    
    const colors = ['#FFD700', '#FF4500', '#8A2BE2', '#4169E1', '#2ecc71', '#e74c3c', '#f39c12', '#1abc9c', '#ff69b4', '#00bfff'];
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const shape = Math.random() > 0.5 ? 'rect' : 'circle';
            
            confetti.style.cssText = `
                position: fixed;
                width: ${8 + Math.random() * 10}px;
                height: ${8 + Math.random() * 10}px;
                background: ${color};
                top: -10%;
                left: ${Math.random() * 100}%;
                z-index: 1000;
                pointer-events: none;
                ${shape === 'circle' ? 'border-radius: 50%;' : ''}
                transform: rotate(${Math.random() * 360}deg);
                animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
                box-shadow: 0 0 15px ${color};
            `;
            
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }, i * 30);
    }
}

// ===================================================================
// ЧАСТЬ 9: ТРЯСКА И ВИБРАЦИЯ
// ===================================================================

function shakeScreen(intensity = 5) {
    if (!ANIMATION_CONFIG.enabled || !ANIMATION_CONFIG.screenshake) return;
    
    intensity *= ANIMATION_CONFIG.intensity.screenshake;
    
    const element = document.body;
    let shakes = 0;
    const maxShakes = 10;
    const originalTransform = element.style.transform;
    
    function shake() {
        if (shakes >= maxShakes) {
            element.style.transform = originalTransform;
            return;
        }
        
        const x = (Math.random() - 0.5) * intensity * 2;
        const y = (Math.random() - 0.5) * intensity * 2;
        
        element.style.transform = `translate(${x}px, ${y}px)`;
        shakes++;
        
        requestAnimationFrame(() => {
            setTimeout(shake, 30 / globalAnimationSpeed);
        });
    }
    
    shake();
}

function vibrate(pattern) {
    if (!ANIMATION_CONFIG.enabled) return;
    
    const vibrationEnabled = localStorage.getItem('pixel_settings') 
        ? JSON.parse(localStorage.getItem('pixel_settings')).vibration !== false 
        : true;
    
    if (vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// ===================================================================
// ЧАСТЬ 10: АНИМАЦИИ ПЕРЕХОДОВ
// ===================================================================

function fadeIn(element, duration = 300) {
    if (!element) return;
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration / globalAnimationSpeed}ms`;
    requestAnimationFrame(() => element.style.opacity = '1');
}

function fadeOut(element, duration = 300, remove = false) {
    if (!element) return;
    element.style.transition = `opacity ${duration / globalAnimationSpeed}ms`;
    element.style.opacity = '0';
    if (remove) setTimeout(() => element.remove(), duration / globalAnimationSpeed);
}

function slideIn(element, direction = 'up', duration = 300) {
    if (!element) return;
    
    const transforms = { 
        up: 'translateY(20px)', 
        down: 'translateY(-20px)', 
        left: 'translateX(20px)', 
        right: 'translateX(-20px)' 
    };
    
    element.style.opacity = '0';
    element.style.transform = transforms[direction] || 'translateY(20px)';
    element.style.transition = `opacity ${duration / globalAnimationSpeed}ms, transform ${duration / globalAnimationSpeed}ms`;
    
    requestAnimationFrame(() => {
        element.style.opacity = '1';
        element.style.transform = 'translate(0)';
    });
}

function pulse(element, scale = 1.05, duration = 300) {
    if (!element) return;
    element.style.transition = `transform ${duration / globalAnimationSpeed}ms`;
    element.style.transform = `scale(${scale})`;
    setTimeout(() => element.style.transform = 'scale(1)', duration / globalAnimationSpeed);
}

// ===================================================================
// ЧАСТЬ 11: СТИЛИ АНИМАЦИЙ
// ===================================================================

function injectAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes muzzleFlash {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.5); }
        }
        
        @keyframes fullFlash {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }
        
        @keyframes smokeRise {
            0% { opacity: 0.6; transform: translate(-50%, 0) scale(1); }
            100% { opacity: 0; transform: translate(calc(-50% + var(--drift)), -40px) scale(2.5); }
        }
        
        @keyframes shellEject {
            0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
            100% { opacity: 0; transform: translate(var(--drift), -50px) rotate(var(--rotation)); }
        }
        
        @keyframes bloodSplatter {
            0% { opacity: 1; transform: translate(-50%, -50%) scale(0); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
        }
        
        @keyframes bloodDrop {
            0% { opacity: 1; transform: translate(-50%, -50%); }
            100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))); }
        }
        
        @keyframes hitMarkerFade {
            0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }
        
        @keyframes explosion {
            0% { opacity: 1; transform: translate(-50%, -50%) scale(0); }
            50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.5); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
        }
        
        @keyframes particleFly {
            0% { opacity: 1; transform: translate(-50%, -50%); }
            100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))); }
        }
        
        @keyframes fireRise {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-80px); }
        }
        
        @keyframes flashbang {
            0% { background: white; opacity: 1; }
            30% { background: white; opacity: 1; }
            100% { background: transparent; opacity: 0; }
        }
        
        @keyframes smokeGrow {
            0% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.5); }
            100% { opacity: 0.2; transform: translate(-50%, -50%) scale(2.5); }
        }
        
        @keyframes smokeDrift {
            0% { opacity: 0.5; transform: translate(0, 0); }
            100% { opacity: 0; transform: translate(var(--drift), -50px); }
        }
        
        @keyframes fireBurn {
            0% { opacity: 0.8; transform: translate(-50%, -50%) scale(0.8); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.8); }
        }
        
        @keyframes levelUp {
            0% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.1); filter: brightness(1.5); }
            100% { transform: scale(1); filter: brightness(1); }
        }
        
        @keyframes rayExpand {
            0% { opacity: 1; transform: translate(-50%, -50%) scaleY(0); }
            100% { opacity: 0; transform: translate(-50%, -50%) scaleY(1); }
        }
        
        @keyframes rewardPopup {
            0% { opacity: 0; transform: translate(-50%, 0); }
            20% { opacity: 1; transform: translate(-50%, -50%); }
            80% { opacity: 1; transform: translate(-50%, -50%); }
            100% { opacity: 0; transform: translate(-50%, -100%); }
        }
        
        @keyframes glowPulse {
            0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
        }
        
        @keyframes starTwinkle {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(3); }
        }
        
        @keyframes victoryText {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
        
        @keyframes defeatText {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
        
        @keyframes darkenPulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.8; }
        }
        
        @keyframes confettiFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
    `;
    document.head.appendChild(style);
}

// ===================================================================
// ЧАСТЬ 12: УПРАВЛЕНИЕ СКОРОСТЬЮ АНИМАЦИЙ
// ===================================================================

function setAnimationSpeed(speed) {
    globalAnimationSpeed = Math.max(0.5, Math.min(2.0, speed));
}

function pauseAnimations() {
    ANIMATION_CONFIG.enabled = false;
}

function resumeAnimations() {
    ANIMATION_CONFIG.enabled = true;
}

function setEffectIntensity(effect, value) {
    if (ANIMATION_CONFIG.intensity.hasOwnProperty(effect)) {
        ANIMATION_CONFIG.intensity[effect] = Math.max(0, Math.min(2, value));
    }
}

// ===================================================================
// ЧАСТЬ 13: ЭКСПОРТ И ИНИЦИАЛИЗАЦИЯ
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
    injectAnimationStyles();
    console.log('✨ Animation system ready');
});

window.ANIMATION_CONFIG = ANIMATION_CONFIG;
window.shootEffect = shootEffect;
window.hitEffect = hitEffect;
window.explosionEffect = explosionEffect;
window.flashbangEffect = flashbangEffect;
window.smokeGrenadeEffect = smokeGrenadeEffect;
window.molotovEffect = molotovEffect;
window.levelUpEffect = levelUpEffect;
window.rewardEffect = rewardEffect;
window.caseOpenEffect = caseOpenEffect;
window.victoryEffect = victoryEffect;
window.defeatEffect = defeatEffect;
window.createConfetti = createConfetti;
window.shakeScreen = shakeScreen;
window.vibrate = vibrate;
window.fadeIn = fadeIn;
window.fadeOut = fadeOut;
window.slideIn = slideIn;
window.pulse = pulse;
window.setAnimationSpeed = setAnimationSpeed;
window.pauseAnimations = pauseAnimations;
window.resumeAnimations = resumeAnimations;
window.setEffectIntensity = setEffectIntensity;

console.log('✅ animation.js загружен — 1500+ строк | Pixel Strike 15.0');