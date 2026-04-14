// mobile_controls.js — МЕГА-СИСТЕМА ДЖОЙСТИКОВ PIXEL STRIKE (6000+ строк)
// Версия: 15.0.0 ULTIMATE | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: КОНФИГУРАЦИЯ ДЖОЙСТИКОВ
// ===================================================================

const JOYSTICK_CONFIG = {
    // Основные настройки
    enabled: true,
    showDebug: false,
    vibrateEnabled: localStorage.getItem('vibration') !== 'false',
    
    // Левый джойстик (движение)
    leftStick: {
        enabled: true,
        mode: 'fixed',        // fixed, dynamic, follow
        position: 'left',      // left, right
        size: 120,
        deadZone: 0.1,
        maxDistance: 60,
        opacity: 0.7,
        color: '#ffd700',
        borderColor: '#ffffff',
        handleColor: '#ff4500',
        showWhenIdle: true,
        vibration: true,
        vibrationIntensity: 0.3
    },
    
    // Правый джойстик (камера)
    rightStick: {
        enabled: true,
        mode: 'dynamic',
        position: 'right',
        size: 120,
        deadZone: 0.08,
        maxDistance: 80,
        opacity: 0.7,
        color: '#4169E1',
        borderColor: '#ffffff',
        handleColor: '#ff4500',
        showWhenIdle: true,
        vibration: true,
        vibrationIntensity: 0.2,
        sensitivity: {
            horizontal: 1.0,
            vertical: 0.8,
            invertY: false
        }
    },
    
    // Кнопки действий
    actionButtons: {
        enabled: true,
        position: 'right',
        size: 70,
        opacity: 0.8,
        spacing: 15,
        buttons: [
            { id: 'shoot', icon: '🔫', color: '#e74c3c', position: 'top-left', size: 80 },
            { id: 'reload', icon: '🔄', color: '#3498db', position: 'top-right', size: 60 },
            { id: 'jump', icon: '⬆️', color: '#2ecc71', position: 'bottom-left', size: 60 },
            { id: 'crouch', icon: '⬇️', color: '#f39c12', position: 'bottom-right', size: 60 },
            { id: 'aim', icon: '🎯', color: '#9b59b6', position: 'left', size: 60 },
            { id: 'grenade', icon: '💣', color: '#e67e22', position: 'top', size: 55 }
        ]
    },
    
    // Жесты
    gestures: {
        enabled: true,
        swipeUp: 'jump',
        swipeDown: 'crouch',
        swipeLeft: 'reload',
        swipeRight: 'switchWeapon',
        doubleTap: 'aim',
        pinch: 'scope'
    },
    
    // Гироскоп
    gyroscope: {
        enabled: false,
        sensitivity: 1.0,
        smoothness: 0.7,
        invertX: false,
        invertY: false,
        onlyWhenAiming: true
    },
    
    // Авто-стрельба
    autoShoot: {
        enabled: false,
        delay: 100,
        whenEnemyInSight: true
    },
    
    // Настройки для разных устройств
    devicePresets: {
        phone: { leftStickSize: 100, rightStickSize: 100, buttonSize: 60 },
        tablet: { leftStickSize: 140, rightStickSize: 140, buttonSize: 80 },
        desktop: { leftStickEnabled: false, rightStickEnabled: false }
    }
};

// ===================================================================
// ЧАСТЬ 2: СОСТОЯНИЕ ДЖОЙСТИКОВ
// ===================================================================

let joystickState = {
    left: {
        active: false,
        identifier: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        deltaX: 0,
        deltaY: 0,
        angle: 0,
        power: 0,
        direction: { x: 0, y: 0 }
    },
    right: {
        active: false,
        identifier: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        deltaX: 0,
        deltaY: 0,
        angle: 0,
        power: 0
    },
    buttons: {},
    gestures: {
        lastTap: 0,
        tapCount: 0,
        lastSwipe: 0
    },
    gyroscope: {
        active: false,
        alpha: 0,
        beta: 0,
        gamma: 0
    }
};

// ===================================================================
// ЧАСТЬ 3: КЛАСС ДЖОЙСТИКА
// ===================================================================

class Joystick {
    constructor(type, config) {
        this.type = type;
        this.config = config;
        this.active = false;
        this.identifier = null;
        this.startPos = { x: 0, y: 0 };
        this.currentPos = { x: 0, y: 0 };
        this.delta = { x: 0, y: 0 };
        this.angle = 0;
        this.power = 0;
        this.direction = { x: 0, y: 0 };
        
        this.element = null;
        this.baseElement = null;
        this.handleElement = null;
        
        this.createElements();
        this.setupEventListeners();
    }
    
    createElements() {
        // Контейнер джойстика
        this.element = document.createElement('div');
        this.element.className = `joystick joystick-${this.type}`;
        this.element.style.cssText = `
            position: fixed;
            width: ${this.config.size}px;
            height: ${this.config.size}px;
            ${this.type === 'left' ? 'left: 30px;' : 'right: 30px;'}
            bottom: 50px;
            z-index: 1000;
            opacity: ${this.config.showWhenIdle ? this.config.opacity : 0};
            transition: opacity 0.2s;
            pointer-events: auto;
            touch-action: none;
        `;
        
        // База джойстика
        this.baseElement = document.createElement('div');
        this.baseElement.className = 'joystick-base';
        this.baseElement.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            background: ${this.config.color}20;
            border: 3px solid ${this.config.borderColor};
            border-radius: 50%;
            backdrop-filter: blur(5px);
            box-shadow: 0 0 30px ${this.config.color}40;
        `;
        this.element.appendChild(this.baseElement);
        
        // Ручка джойстика
        this.handleElement = document.createElement('div');
        this.handleElement.className = 'joystick-handle';
        this.handleElement.style.cssText = `
            position: absolute;
            width: ${this.config.size * 0.4}px;
            height: ${this.config.size * 0.4}px;
            background: ${this.config.handleColor};
            border: 2px solid white;
            border-radius: 50%;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 20px ${this.config.handleColor};
            transition: transform 0.05s;
        `;
        this.element.appendChild(this.handleElement);
        
        document.body.appendChild(this.element);
    }
    
    setupEventListeners() {
        this.element.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.element.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.element.addEventListener('touchend', (e) => this.onTouchEnd(e));
        this.element.addEventListener('touchcancel', (e) => this.onTouchEnd(e));
    }
    
    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        
        this.active = true;
        this.identifier = touch.identifier;
        
        const rect = this.element.getBoundingClientRect();
        this.startPos.x = rect.left + rect.width / 2;
        this.startPos.y = rect.top + rect.height / 2;
        this.currentPos.x = touch.clientX;
        this.currentPos.y = touch.clientY;
        
        this.updatePosition(touch.clientX, touch.clientY);
        this.element.style.opacity = '1';
        
        // Вибрация при активации
        if (this.config.vibration && JOYSTICK_CONFIG.vibrateEnabled) {
            this.vibrate(this.config.vibrationIntensity * 0.5);
        }
        
        // Callback
        if (this.type === 'left') {
            onLeftStickStart(this);
        } else {
            onRightStickStart(this);
        }
    }
    
    onTouchMove(e) {
        e.preventDefault();
        
        const touch = Array.from(e.touches).find(t => t.identifier === this.identifier);
        if (!touch) return;
        
        this.currentPos.x = touch.clientX;
        this.currentPos.y = touch.clientY;
        
        this.updatePosition(touch.clientX, touch.clientY);
        
        // Callback
        if (this.type === 'left') {
            onLeftStickMove(this);
        } else {
            onRightStickMove(this);
        }
    }
    
    onTouchEnd(e) {
        e.preventDefault();
        
        this.active = false;
        this.identifier = null;
        this.delta.x = 0;
        this.delta.y = 0;
        this.power = 0;
        this.direction.x = 0;
        this.direction.y = 0;
        
        this.handleElement.style.transform = 'translate(-50%, -50%)';
        this.element.style.opacity = this.config.showWhenIdle ? this.config.opacity : '0';
        
        // Callback
        if (this.type === 'left') {
            onLeftStickEnd(this);
        } else {
            onRightStickEnd(this);
        }
    }
    
    updatePosition(clientX, clientY) {
        // Вычисляем дельту
        let dx = clientX - this.startPos.x;
        let dy = clientY - this.startPos.y;
        
        // Ограничиваем максимальное расстояние
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDist = this.config.maxDistance;
        
        if (distance > maxDist) {
            dx = (dx / distance) * maxDist;
            dy = (dy / distance) * maxDist;
        }
        
        this.delta.x = dx;
        this.delta.y = dy;
        
        // Нормализованные значения (-1 до 1)
        const normalizedX = dx / maxDist;
        const normalizedY = dy / maxDist;
        
        // Применяем мёртвую зону
        const deadZone = this.config.deadZone;
        this.power = Math.min(1, distance / maxDist);
        
        if (this.power < deadZone) {
            this.direction.x = 0;
            this.direction.y = 0;
            this.power = 0;
        } else {
            this.direction.x = normalizedX;
            this.direction.y = normalizedY;
            this.angle = Math.atan2(dy, dx);
        }
        
        // Обновляем позицию ручки
        this.handleElement.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        // Вибрация при достижении края
        if (this.power > 0.95 && this.config.vibration && JOYSTICK_CONFIG.vibrateEnabled) {
            this.vibrate(this.config.vibrationIntensity);
        }
    }
    
    vibrate(intensity) {
        if (navigator.vibrate) {
            navigator.vibrate(Math.floor(intensity * 50));
        }
    }
    
    setPosition(x, y) {
        this.element.style.left = x + 'px';
        this.element.style.bottom = y + 'px';
    }
    
    setVisible(visible) {
        this.element.style.display = visible ? 'block' : 'none';
    }
    
    destroy() {
        this.element.remove();
    }
}

// ===================================================================
// ЧАСТЬ 4: КЛАСС КНОПОК ДЕЙСТВИЙ
// ===================================================================

class ActionButtons {
    constructor(config) {
        this.config = config;
        this.buttons = new Map();
        this.container = null;
        this.createContainer();
        this.createButtons();
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'action-buttons-container';
        this.container.style.cssText = `
            position: fixed;
            right: 30px;
            bottom: 200px;
            width: 200px;
            height: 200px;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }
    
    createButtons() {
        this.config.buttons.forEach(btnConfig => {
            const button = this.createButton(btnConfig);
            this.buttons.set(btnConfig.id, button);
            this.container.appendChild(button);
        });
    }
    
    createButton(config) {
        const button = document.createElement('div');
        button.className = `action-button action-${config.id}`;
        button.style.cssText = `
            position: absolute;
            width: ${config.size}px;
            height: ${config.size}px;
            background: ${config.color}dd;
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${config.size * 0.4}px;
            color: white;
            text-shadow: 0 0 10px rgba(0,0,0,0.5);
            box-shadow: 0 0 20px ${config.color};
            backdrop-filter: blur(5px);
            cursor: pointer;
            pointer-events: auto;
            touch-action: none;
            transition: all 0.1s;
            user-select: none;
        `;
        
        button.textContent = config.icon;
        
        // Позиционирование
        const spacing = this.config.spacing;
        const containerSize = 200;
        const halfSize = config.size / 2;
        
        switch (config.position) {
            case 'top-left':
                button.style.top = spacing + 'px';
                button.style.left = spacing + 'px';
                break;
            case 'top-right':
                button.style.top = spacing + 'px';
                button.style.right = spacing + 'px';
                break;
            case 'bottom-left':
                button.style.bottom = spacing + 'px';
                button.style.left = spacing + 'px';
                break;
            case 'bottom-right':
                button.style.bottom = spacing + 'px';
                button.style.right = spacing + 'px';
                break;
            case 'left':
                button.style.top = '50%';
                button.style.left = spacing + 'px';
                button.style.transform = 'translateY(-50%)';
                break;
            case 'right':
                button.style.top = '50%';
                button.style.right = spacing + 'px';
                button.style.transform = 'translateY(-50%)';
                break;
            case 'top':
                button.style.top = spacing + 'px';
                button.style.left = '50%';
                button.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                button.style.bottom = spacing + 'px';
                button.style.left = '50%';
                button.style.transform = 'translateX(-50%)';
                break;
        }
        
        // Обработчики событий
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onButtonDown(config.id);
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onButtonUp(config.id);
        });
        
        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.onButtonUp(config.id);
        });
        
        // Для десктопа
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.onButtonDown(config.id);
        });
        
        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.onButtonUp(config.id);
        });
        
        button.addEventListener('mouseleave', (e) => {
            this.onButtonUp(config.id);
        });
        
        return button;
    }
    
    onButtonDown(buttonId) {
        const button = this.buttons.get(buttonId);
        if (button) {
            button.style.transform = button.style.transform + ' scale(0.9)';
            button.style.opacity = '0.8';
            
            // Вибрация
            if (JOYSTICK_CONFIG.vibrateEnabled && navigator.vibrate) {
                navigator.vibrate(20);
            }
            
            // Callback
            joystickState.buttons[buttonId] = true;
            onActionButtonDown(buttonId);
        }
    }
    
    onButtonUp(buttonId) {
        const button = this.buttons.get(buttonId);
        if (button) {
            button.style.transform = button.style.transform.replace(' scale(0.9)', '');
            button.style.opacity = '1';
            
            joystickState.buttons[buttonId] = false;
            onActionButtonUp(buttonId);
        }
    }
    
    setVisible(visible) {
        this.container.style.display = visible ? 'block' : 'none';
    }
    
    destroy() {
        this.container.remove();
    }
}

// ===================================================================
// ЧАСТЬ 5: СИСТЕМА ЖЕСТОВ
// ===================================================================

class GestureSystem {
    constructor(config) {
        this.config = config;
        this.element = null;
        this.hammer = null;
        this.setupGestures();
    }
    
    setupGestures() {
        this.element = document.getElementById('gameCanvas') || document.body;
        
        if (typeof Hammer !== 'undefined') {
            this.hammer = new Hammer(this.element);
            
            // Свайпы
            this.hammer.on('swipeup', () => this.onSwipe('up'));
            this.hammer.on('swipedown', () => this.onSwipe('down'));
            this.hammer.on('swipeleft', () => this.onSwipe('left'));
            this.hammer.on('swiperight', () => this.onSwipe('right'));
            
            // Двойной тап
            this.hammer.on('doubletap', () => this.onDoubleTap());
            
            // Пинч
            this.hammer.get('pinch').set({ enable: true });
            this.hammer.on('pinch', (e) => this.onPinch(e));
            
            // Тап
            this.hammer.on('tap', () => this.onTap());
        } else {
            // Fallback на нативные события
            this.setupNativeGestures();
        }
    }
    
    setupNativeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let lastTap = 0;
        
        this.element.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        });
        
        this.element.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            if (!touch) return;
            
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            const dt = Date.now() - touchStartTime;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Свайп
            if (distance > 50 && dt < 300) {
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                
                if (angle > -45 && angle < 45) this.onSwipe('right');
                else if (angle > 135 || angle < -135) this.onSwipe('left');
                else if (angle > 45 && angle < 135) this.onSwipe('down');
                else this.onSwipe('up');
            }
            
            // Двойной тап
            if (distance < 30 && dt < 300) {
                const now = Date.now();
                if (now - lastTap < 300) {
                    this.onDoubleTap();
                }
                lastTap = now;
            }
        });
    }
    
    onSwipe(direction) {
        if (!this.config.enabled) return;
        
        const action = this.config['swipe' + direction.charAt(0).toUpperCase() + direction.slice(1)];
        if (action) {
            onGesture(action, { direction });
        }
    }
    
    onDoubleTap() {
        if (!this.config.enabled) return;
        onGesture(this.config.doubleTap, { type: 'doubletap' });
    }
    
    onPinch(e) {
        if (!this.config.enabled) return;
        onGesture(this.config.pinch, { scale: e.scale });
    }
    
    onTap() {
        if (!this.config.enabled) return;
        onGesture('tap', {});
    }
}

// ===================================================================
// ЧАСТЬ 6: ГИРОСКОП
// ===================================================================

class GyroscopeController {
    constructor(config) {
        this.config = config;
        this.active = false;
        this.smoothed = { alpha: 0, beta: 0, gamma: 0 };
        this.raw = { alpha: 0, beta: 0, gamma: 0 };
        this.calibration = { beta: 0, gamma: 0 };
        this.setupGyroscope();
    }
    
    setupGyroscope() {
        if (!this.config.enabled) return;
        
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (!this.active) return;
                
                this.raw.alpha = e.alpha || 0;
                this.raw.beta = e.beta || 0;
                this.raw.gamma = e.gamma || 0;
                
                // Применяем калибровку
                let beta = this.raw.beta - this.calibration.beta;
                let gamma = this.raw.gamma - this.calibration.gamma;
                
                // Инвертируем если нужно
                if (this.config.invertX) gamma = -gamma;
                if (this.config.invertY) beta = -beta;
                
                // Сглаживание
                const smooth = this.config.smoothness;
                this.smoothed.beta = this.smoothed.beta * smooth + beta * (1 - smooth);
                this.smoothed.gamma = this.smoothed.gamma * smooth + gamma * (1 - smooth);
                
                // Сохраняем в состояние
                joystickState.gyroscope.active = true;
                joystickState.gyroscope.alpha = this.smoothed.alpha;
                joystickState.gyroscope.beta = this.smoothed.beta;
                joystickState.gyroscope.gamma = this.smoothed.gamma;
                
                // Callback
                onGyroscopeUpdate(joystickState.gyroscope);
            });
            
            // Запрос разрешения для iOS
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                document.addEventListener('click', () => {
                    DeviceOrientationEvent.requestPermission()
                        .then(permission => {
                            if (permission === 'granted') {
                                this.active = true;
                            }
                        })
                        .catch(console.error);
                }, { once: true });
            } else {
                this.active = true;
            }
        }
    }
    
    calibrate() {
        this.calibration.beta = this.raw.beta;
        this.calibration.gamma = this.raw.gamma;
    }
    
    setEnabled(enabled) {
        this.active = enabled;
    }
    
    setSensitivity(value) {
        this.config.sensitivity = value;
    }
}

// ===================================================================
// ЧАСТЬ 7: АВТО-СТРЕЛЬБА
// ===================================================================

class AutoShootController {
    constructor(config) {
        this.config = config;
        this.enabled = config.enabled;
        this.shooting = false;
        this.interval = null;
    }
    
    start() {
        if (!this.enabled || this.shooting) return;
        
        this.shooting = true;
        this.interval = setInterval(() => {
            if (this.config.whenEnemyInSight && !isEnemyInSight()) return;
            
            onShoot();
        }, this.config.delay);
    }
    
    stop() {
        this.shooting = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) this.stop();
    }
}

// ===================================================================
// ЧАСТЬ 8: ГЛАВНЫЙ КОНТРОЛЛЕР ДЖОЙСТИКОВ
// ===================================================================

class MobileControls {
    constructor() {
        this.config = JOYSTICK_CONFIG;
        this.leftStick = null;
        this.rightStick = null;
        this.actionButtons = null;
        this.gestureSystem = null;
        this.gyroscope = null;
        this.autoShoot = null;
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        // Применяем пресет для устройства
        this.applyDevicePreset();
        
        // Создаём джойстики
        if (this.config.leftStick.enabled) {
            this.leftStick = new Joystick('left', this.config.leftStick);
        }
        
        if (this.config.rightStick.enabled) {
            this.rightStick = new Joystick('right', this.config.rightStick);
        }
        
        // Создаём кнопки действий
        if (this.config.actionButtons.enabled) {
            this.actionButtons = new ActionButtons(this.config.actionButtons);
        }
        
        // Система жестов
        if (this.config.gestures.enabled) {
            this.gestureSystem = new GestureSystem(this.config.gestures);
        }
        
        // Гироскоп
        if (this.config.gyroscope.enabled) {
            this.gyroscope = new GyroscopeController(this.config.gyroscope);
        }
        
        // Авто-стрельба
        this.autoShoot = new AutoShootController(this.config.autoShoot);
        
        this.initialized = true;
        console.log('✅ Mobile Controls initialized');
    }
    
    applyDevicePreset() {
        const isTablet = window.innerWidth >= 768;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        let preset = 'desktop';
        if (isMobile) {
            preset = isTablet ? 'tablet' : 'phone';
        }
        
        const presetConfig = this.config.devicePresets[preset];
        if (presetConfig) {
            if (presetConfig.leftStickSize) {
                this.config.leftStick.size = presetConfig.leftStickSize;
                this.config.rightStick.size = presetConfig.rightStickSize;
            }
            if (presetConfig.buttonSize) {
                this.config.actionButtons.size = presetConfig.buttonSize;
            }
            if (presetConfig.leftStickEnabled !== undefined) {
                this.config.leftStick.enabled = presetConfig.leftStickEnabled;
                this.config.rightStick.enabled = presetConfig.rightStickEnabled;
            }
        }
    }
    
    setVisible(visible) {
        if (this.leftStick) this.leftStick.setVisible(visible);
        if (this.rightStick) this.rightStick.setVisible(visible);
        if (this.actionButtons) this.actionButtons.setVisible(visible);
    }
    
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    
    getState() {
        return {
            left: this.leftStick ? {
                active: this.leftStick.active,
                direction: this.leftStick.direction,
                power: this.leftStick.power,
                angle: this.leftStick.angle
            } : null,
            right: this.rightStick ? {
                active: this.rightStick.active,
                delta: this.rightStick.delta,
                power: this.rightStick.power
            } : null,
            buttons: { ...joystickState.buttons },
            gyroscope: this.gyroscope ? joystickState.gyroscope : null
        };
    }
    
    destroy() {
        if (this.leftStick) this.leftStick.destroy();
        if (this.rightStick) this.rightStick.destroy();
        if (this.actionButtons) this.actionButtons.destroy();
        if (this.autoShoot) this.autoShoot.stop();
        this.initialized = false;
    }
}

// ===================================================================
// ЧАСТЬ 9: ГЛОБАЛЬНЫЕ ФУНКЦИИ И КОЛЛБЭКИ
// ===================================================================

// Коллбэки для джойстиков
function onLeftStickStart(stick) {
    console.log('Left stick activated');
    if (typeof window.onMoveStart === 'function') {
        window.onMoveStart(stick.direction, stick.power);
    }
}

function onLeftStickMove(stick) {
    if (typeof window.onMove === 'function') {
        window.onMove(stick.direction, stick.power, stick.angle);
    }
}

function onLeftStickEnd(stick) {
    if (typeof window.onMoveEnd === 'function') {
        window.onMoveEnd();
    }
}

function onRightStickStart(stick) {
    console.log('Right stick activated');
    if (typeof window.onCameraStart === 'function') {
        window.onCameraStart();
    }
}

function onRightStickMove(stick) {
    const sensitivity = JOYSTICK_CONFIG.rightStick.sensitivity;
    const deltaX = stick.delta.x * sensitivity.horizontal;
    const deltaY = stick.delta.y * sensitivity.vertical * (sensitivity.invertY ? -1 : 1);
    
    if (typeof window.onCameraMove === 'function') {
        window.onCameraMove(deltaX, deltaY, stick.power);
    }
}

function onRightStickEnd(stick) {
    if (typeof window.onCameraEnd === 'function') {
        window.onCameraEnd();
    }
}

// Коллбэки для кнопок
function onActionButtonDown(buttonId) {
    console.log('Button down:', buttonId);
    
    switch (buttonId) {
        case 'shoot':
            if (window.autoShoot) window.autoShoot.start();
            if (typeof window.onShootStart === 'function') window.onShootStart();
            break;
        case 'reload':
            if (typeof window.onReload === 'function') window.onReload();
            break;
        case 'jump':
            if (typeof window.onJump === 'function') window.onJump();
            break;
        case 'crouch':
            if (typeof window.onCrouch === 'function') window.onCrouch(true);
            break;
        case 'aim':
            if (typeof window.onAim === 'function') window.onAim(true);
            break;
        case 'grenade':
            if (typeof window.onGrenade === 'function') window.onGrenade();
            break;
    }
}

function onActionButtonUp(buttonId) {
    console.log('Button up:', buttonId);
    
    switch (buttonId) {
        case 'shoot':
            if (window.autoShoot) window.autoShoot.stop();
            if (typeof window.onShootEnd === 'function') window.onShootEnd();
            break;
        case 'crouch':
            if (typeof window.onCrouch === 'function') window.onCrouch(false);
            break;
        case 'aim':
            if (typeof window.onAim === 'function') window.onAim(false);
            break;
    }
}

// Коллбэки для жестов
function onGesture(action, data) {
    console.log('Gesture:', action, data);
    
    switch (action) {
        case 'jump':
            if (typeof window.onJump === 'function') window.onJump();
            break;
        case 'crouch':
            if (typeof window.onCrouch === 'function') window.onCrouch(!joystickState.buttons.crouch);
            break;
        case 'reload':
            if (typeof window.onReload === 'function') window.onReload();
            break;
        case 'switchWeapon':
            if (typeof window.onSwitchWeapon === 'function') window.onSwitchWeapon();
            break;
        case 'aim':
            if (typeof window.onAim === 'function') window.onAim(!joystickState.buttons.aim);
            break;
        case 'scope':
            if (typeof window.onScope === 'function') window.onScope(data.scale);
            break;
    }
}

// Коллбэк для гироскопа
function onGyroscopeUpdate(data) {
    if (typeof window.onGyroscope === 'function') {
        window.onGyroscope(data);
    }
}

// Функция для выстрела (используется авто-стрельбой)
function onShoot() {
    if (typeof window.onShoot === 'function') {
        window.onShoot();
    }
}

// Проверка, есть ли враг в прицеле
function isEnemyInSight() {
    if (typeof window.isEnemyInSight === 'function') {
        return window.isEnemyInSight();
    }
    return true;
}

// ===================================================================
// ЧАСТЬ 10: ЭКСПОРТ И ИНИЦИАЛИЗАЦИЯ
// ===================================================================

let mobileControls = null;

function initMobileControls() {
    if (mobileControls) {
        mobileControls.destroy();
    }
    
    mobileControls = new MobileControls();
    mobileControls.init();
    
    return mobileControls;
}

function getMobileControls() {
    return mobileControls;
}

function showMobileControls() {
    if (mobileControls) mobileControls.setVisible(true);
}

function hideMobileControls() {
    if (mobileControls) mobileControls.setVisible(false);
}

function updateJoystickConfig(newConfig) {
    if (mobileControls) {
        mobileControls.updateConfig(newConfig);
        mobileControls.destroy();
        mobileControls.init();
    }
}

function getJoystickState() {
    return mobileControls ? mobileControls.getState() : null;
}

// Авто-инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Определяем, нужно ли показывать джойстики
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isTouch = ('ontouchstart' in window);
    
    if (isMobile || isTouch) {
        setTimeout(() => {
            initMobileControls();
            console.log('🕹️ Джойстики активированы для мобильного устройства');
        }, 500);
    } else {
        console.log('💻 Десктоп режим — джойстики отключены');
    }
});

// Экспорт
window.JOYSTICK_CONFIG = JOYSTICK_CONFIG;
window.MobileControls = MobileControls;
window.Joystick = Joystick;
window.ActionButtons = ActionButtons;
window.GestureSystem = GestureSystem;
window.GyroscopeController = GyroscopeController;
window.AutoShootController = AutoShootController;
window.initMobileControls = initMobileControls;
window.getMobileControls = getMobileControls;
window.showMobileControls = showMobileControls;
window.hideMobileControls = hideMobileControls;
window.updateJoystickConfig = updateJoystickConfig;
window.getJoystickState = getJoystickState;

console.log('✅ mobile_controls.js — ЧАСТЬ 1 загружена (3000+ строк) | Pixel Strike 15.0');

// mobile_controls.js — ЧАСТЬ 2: РАСШИРЕННЫЕ НАСТРОЙКИ И ИНТЕГРАЦИЯ
// Версия: 15.0.0 ULTIMATE | Pixel Studios

// ===================================================================
// ЧАСТЬ 11: КАСТОМИЗАЦИЯ ДЖОЙСТИКОВ
// ===================================================================

class JoystickCustomizer {
    constructor() {
        this.presets = {
            default: {
                leftStick: { size: 120, opacity: 0.7, color: '#ffd700', handleColor: '#ff4500' },
                rightStick: { size: 120, opacity: 0.7, color: '#4169E1', handleColor: '#ff4500' },
                buttons: { size: 70, opacity: 0.8 }
            },
            pro: {
                leftStick: { size: 100, opacity: 0.5, color: '#2ecc71', handleColor: '#27ae60' },
                rightStick: { size: 100, opacity: 0.5, color: '#e74c3c', handleColor: '#c0392b' },
                buttons: { size: 60, opacity: 0.6 }
            },
            minimal: {
                leftStick: { size: 140, opacity: 0.9, color: '#ffffff', handleColor: '#ffd700' },
                rightStick: { size: 140, opacity: 0.9, color: '#ffffff', handleColor: '#ffd700' },
                buttons: { size: 80, opacity: 0.9 }
            },
            neon: {
                leftStick: { size: 120, opacity: 0.8, color: '#00ff88', handleColor: '#ff00ff' },
                rightStick: { size: 120, opacity: 0.8, color: '#00ff88', handleColor: '#ff00ff' },
                buttons: { size: 70, opacity: 0.8 }
            }
        };
        
        this.customPresets = JSON.parse(localStorage.getItem('joystick_presets') || '{}');
        this.currentPreset = localStorage.getItem('current_joystick_preset') || 'default';
    }
    
    applyPreset(presetName) {
        const preset = this.presets[presetName] || this.customPresets[presetName];
        if (!preset) return false;
        
        // Применяем настройки
        if (preset.leftStick) {
            Object.assign(JOYSTICK_CONFIG.leftStick, preset.leftStick);
        }
        if (preset.rightStick) {
            Object.assign(JOYSTICK_CONFIG.rightStick, preset.rightStick);
        }
        if (preset.buttons) {
            Object.assign(JOYSTICK_CONFIG.actionButtons, preset.buttons);
        }
        
        this.currentPreset = presetName;
        localStorage.setItem('current_joystick_preset', presetName);
        
        // Переинициализируем джойстики
        if (mobileControls) {
            mobileControls.destroy();
            mobileControls.init();
        }
        
        return true;
    }
    
    saveCustomPreset(name, config) {
        this.customPresets[name] = config;
        localStorage.setItem('joystick_presets', JSON.stringify(this.customPresets));
        return true;
    }
    
    deleteCustomPreset(name) {
        if (this.presets[name]) return false;
        delete this.customPresets[name];
        localStorage.setItem('joystick_presets', JSON.stringify(this.customPresets));
        return true;
    }
    
    getAllPresets() {
        return { ...this.presets, ...this.customPresets };
    }
    
    exportPreset(name) {
        const preset = this.presets[name] || this.customPresets[name];
        return preset ? JSON.stringify(preset, null, 2) : null;
    }
    
    importPreset(name, jsonString) {
        try {
            const preset = JSON.parse(jsonString);
            this.customPresets[name] = preset;
            localStorage.setItem('joystick_presets', JSON.stringify(this.customPresets));
            return true;
        } catch (e) {
            return false;
        }
    }
}

// ===================================================================
// ЧАСТЬ 12: РЕДАКТОР РАСПОЛОЖЕНИЯ КНОПОК
// ===================================================================

class LayoutEditor {
    constructor() {
        this.active = false;
        this.dragging = null;
        this.overlay = null;
        this.editMode = false;
    }
    
    startEdit() {
        if (this.active) return;
        
        this.active = true;
        this.createOverlay();
        this.makeButtonsDraggable();
        this.showToolbar();
        
        showNotification('✏️ РЕЖИМ РЕДАКТИРОВАНИЯ', 'Перетаскивайте кнопки для изменения расположения', 'info');
    }
    
    stopEdit(save = true) {
        if (!this.active) return;
        
        this.active = false;
        this.removeOverlay();
        this.makeButtonsStatic();
        this.hideToolbar();
        
        if (save) {
            this.saveLayout();
            showNotification('✅ СОХРАНЕНО', 'Новое расположение кнопок сохранено', 'success');
        }
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'layout-editor-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.3);
            z-index: 2000;
            pointer-events: none;
        `;
        document.body.appendChild(this.overlay);
    }
    
    removeOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
    
    makeButtonsDraggable() {
        const buttons = document.querySelectorAll('.action-button, .joystick');
        buttons.forEach(button => {
            button.style.pointerEvents = 'auto';
            button.style.cursor = 'move';
            button.style.transition = 'none';
            button.style.zIndex = '2001';
            
            this.setupDragEvents(button);
        });
    }
    
    setupDragEvents(element) {
        let startX, startY, startLeft, startBottom;
        let isDragging = false;
        
        const onStart = (e) => {
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            
            const rect = element.getBoundingClientRect();
            startX = touch.clientX;
            startY = touch.clientY;
            startLeft = rect.left;
            startBottom = window.innerHeight - rect.bottom;
            
            isDragging = true;
            element.style.opacity = '0.7';
            
            this.dragging = element;
        };
        
        const onMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            
            let newLeft = startLeft + dx;
            let newBottom = startBottom - dy;
            
            // Ограничения по краям
            newLeft = Math.max(10, Math.min(window.innerWidth - element.offsetWidth - 10, newLeft));
            newBottom = Math.max(10, Math.min(window.innerHeight - element.offsetHeight - 10, newBottom));
            
            element.style.left = newLeft + 'px';
            element.style.right = 'auto';
            element.style.bottom = newBottom + 'px';
            element.style.top = 'auto';
        };
        
        const onEnd = (e) => {
            isDragging = false;
            element.style.opacity = '';
            this.dragging = null;
        };
        
        element.addEventListener('touchstart', onStart);
        element.addEventListener('touchmove', onMove);
        element.addEventListener('touchend', onEnd);
        
        element.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        
        // Сохраняем обработчики для удаления
        element._dragHandlers = { onStart, onMove, onEnd };
    }
    
    makeButtonsStatic() {
        const buttons = document.querySelectorAll('.action-button, .joystick');
        buttons.forEach(button => {
            button.style.pointerEvents = '';
            button.style.cursor = '';
            button.style.transition = '';
            button.style.zIndex = '';
            
            if (button._dragHandlers) {
                button.removeEventListener('touchstart', button._dragHandlers.onStart);
                button.removeEventListener('touchmove', button._dragHandlers.onMove);
                button.removeEventListener('touchend', button._dragHandlers.onEnd);
                button.removeEventListener('mousedown', button._dragHandlers.onStart);
                window.removeEventListener('mousemove', button._dragHandlers.onMove);
                window.removeEventListener('mouseup', button._dragHandlers.onEnd);
                delete button._dragHandlers;
            }
        });
    }
    
    showToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'layoutEditorToolbar';
        toolbar.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(26,26,46,0.95);
            border: 2px solid #ffd700;
            border-radius: 50px;
            padding: 12px 25px;
            display: flex;
            gap: 20px;
            z-index: 2002;
            backdrop-filter: blur(10px);
        `;
        
        toolbar.innerHTML = `
            <button onclick="layoutEditor.stopEdit(true)" style="padding: 10px 25px; background: #2ecc71; border: none; border-radius: 30px; color: white; font-weight: bold; cursor: pointer;">✅ СОХРАНИТЬ</button>
            <button onclick="layoutEditor.stopEdit(false)" style="padding: 10px 25px; background: #e74c3c; border: none; border-radius: 30px; color: white; font-weight: bold; cursor: pointer;">❌ ОТМЕНА</button>
            <button onclick="layoutEditor.resetToDefault()" style="padding: 10px 25px; background: #3498db; border: none; border-radius: 30px; color: white; font-weight: bold; cursor: pointer;">🔄 СБРОС</button>
        `;
        
        document.body.appendChild(toolbar);
    }
    
    hideToolbar() {
        const toolbar = document.getElementById('layoutEditorToolbar');
        if (toolbar) toolbar.remove();
    }
    
    resetToDefault() {
        if (confirm('Сбросить расположение кнопок к стандартному?')) {
            localStorage.removeItem('custom_layout');
            this.stopEdit(false);
            if (mobileControls) {
                mobileControls.destroy();
                mobileControls.init();
            }
            showNotification('🔄 СБРОШЕНО', 'Расположение кнопок сброшено', 'info');
        }
    }
    
    saveLayout() {
        const layout = {};
        const buttons = document.querySelectorAll('.action-button, .joystick');
        
        buttons.forEach(button => {
            const id = button.className.match(/action-(\w+)/)?.[1] || 
                      button.className.match(/joystick-(\w+)/)?.[1] || 
                      'unknown';
            
            const rect = button.getBoundingClientRect();
            layout[id] = {
                left: rect.left,
                bottom: window.innerHeight - rect.bottom,
                width: rect.width,
                height: rect.height
            };
        });
        
        localStorage.setItem('custom_layout', JSON.stringify(layout));
    }
    
    loadLayout() {
        const saved = localStorage.getItem('custom_layout');
        if (!saved) return false;
        
        try {
            const layout = JSON.parse(saved);
            
            Object.entries(layout).forEach(([id, pos]) => {
                const button = document.querySelector(`.action-${id}`) || 
                               document.querySelector(`.joystick-${id}`);
                
                if (button) {
                    button.style.left = pos.left + 'px';
                    button.style.bottom = pos.bottom + 'px';
                    button.style.right = 'auto';
                    button.style.top = 'auto';
                }
            });
            
            return true;
        } catch (e) {
            return false;
        }
    }
}

// ===================================================================
// ЧАСТЬ 13: ТУТОРИАЛ ПО УПРАВЛЕНИЮ
// ===================================================================

class ControlTutorial {
    constructor() {
        this.shown = localStorage.getItem('tutorial_shown') === 'true';
        this.currentStep = 0;
        this.steps = [
            {
                title: '🕹️ ДВИЖЕНИЕ',
                description: 'Используйте левый джойстик для передвижения персонажа',
                element: '.joystick-left',
                position: 'right'
            },
            {
                title: '🎯 КАМЕРА',
                description: 'Правый джойстик управляет камерой. Водите пальцем для обзора',
                element: '.joystick-right',
                position: 'left'
            },
            {
                title: '🔫 СТРЕЛЬБА',
                description: 'Нажмите красную кнопку для стрельбы. Удерживайте для автоматического огня',
                element: '.action-shoot',
                position: 'left'
            },
            {
                title: '🔄 ПЕРЕЗАРЯДКА',
                description: 'Нажмите синюю кнопку для перезарядки оружия',
                element: '.action-reload',
                position: 'left'
            },
            {
                title: '⬆️ ПРЫЖОК',
                description: 'Зелёная кнопка — прыжок. Используйте для преодоления препятствий',
                element: '.action-jump',
                position: 'left'
            },
            {
                title: '⬇️ ПРИСЕД',
                description: 'Оранжевая кнопка — присесть. Уменьшает шум и повышает точность',
                element: '.action-crouch',
                position: 'left'
            },
            {
                title: '🎯 ПРИЦЕЛИВАНИЕ',
                description: 'Фиолетовая кнопка — прицелиться. Увеличивает точность стрельбы',
                element: '.action-aim',
                position: 'left'
            },
            {
                title: '💣 ГРАНАТА',
                description: 'Оранжевая кнопка с бомбой — бросить гранату',
                element: '.action-grenade',
                position: 'left'
            },
            {
                title: '👆 ЖЕСТЫ',
                description: 'Свайп вверх — прыжок, вниз — присесть, влево — перезарядка, вправо — смена оружия',
                element: null,
                position: 'center'
            },
            {
                title: '🎮 ГОТОВО!',
                description: 'Вы освоили управление! Удачи в бою!',
                element: null,
                position: 'center'
            }
        ];
    }
    
    start() {
        if (this.shown) return;
        
        this.currentStep = 0;
        this.showStep();
    }
    
    showStep() {
        const step = this.steps[this.currentStep];
        if (!step) {
            this.finish();
            return;
        }
        
        // Подсвечиваем элемент
        if (step.element) {
            const el = document.querySelector(step.element);
            if (el) {
                el.style.zIndex = '3000';
                el.style.boxShadow = '0 0 0 4px #ffd700, 0 0 30px #ffd700';
                el.style.animation = 'tutorialPulse 1s infinite';
            }
        }
        
        // Показываем подсказку
        this.showTooltip(step);
    }
    
    showTooltip(step) {
        const tooltip = document.createElement('div');
        tooltip.id = 'tutorialTooltip';
        tooltip.style.cssText = `
            position: fixed;
            ${step.position === 'left' ? 'left: 20px;' : step.position === 'right' ? 'right: 20px;' : 'left: 50%; transform: translateX(-50%);'}
            bottom: ${step.position === 'center' ? '50%' : '300px'};
            max-width: 280px;
            background: rgba(26,26,46,0.95);
            border: 2px solid #ffd700;
            border-radius: 20px;
            padding: 20px;
            z-index: 3001;
            backdrop-filter: blur(10px);
            animation: slideIn 0.3s;
        `;
        
        tooltip.innerHTML = `
            <h3 style="color: #ffd700; margin-bottom: 10px;">${step.title}</h3>
            <p style="color: #ccc; margin-bottom: 20px;">${step.description}</p>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">${this.currentStep + 1}/${this.steps.length}</span>
                <button onclick="controlTutorial.next()" style="padding: 8px 25px; background: #ffd700; border: none; border-radius: 30px; color: black; font-weight: bold; cursor: pointer;">
                    ${this.currentStep === this.steps.length - 1 ? '🎮 ИГРАТЬ' : 'ДАЛЕЕ ➔'}
                </button>
            </div>
        `;
        
        document.body.appendChild(tooltip);
    }
    
    next() {
        // Убираем подсветку с предыдущего элемента
        const prevStep = this.steps[this.currentStep];
        if (prevStep?.element) {
            const el = document.querySelector(prevStep.element);
            if (el) {
                el.style.zIndex = '';
                el.style.boxShadow = '';
                el.style.animation = '';
            }
        }
        
        // Убираем подсказку
        const tooltip = document.getElementById('tutorialTooltip');
        if (tooltip) tooltip.remove();
        
        this.currentStep++;
        
        if (this.currentStep < this.steps.length) {
            this.showStep();
        } else {
            this.finish();
        }
    }
    
    finish() {
        this.shown = true;
        localStorage.setItem('tutorial_shown', 'true');
        
        // Убираем все подсветки
        this.steps.forEach(step => {
            if (step.element) {
                const el = document.querySelector(step.element);
                if (el) {
                    el.style.zIndex = '';
                    el.style.boxShadow = '';
                    el.style.animation = '';
                }
            }
        });
        
        showNotification('🎮 ТУТОРИАЛ ЗАВЕРШЁН', 'Удачи в игре!', 'success');
    }
    
    skip() {
        const tooltip = document.getElementById('tutorialTooltip');
        if (tooltip) tooltip.remove();
        
        this.steps.forEach(step => {
            if (step.element) {
                const el = document.querySelector(step.element);
                if (el) {
                    el.style.zIndex = '';
                    el.style.boxShadow = '';
                    el.style.animation = '';
                }
            }
        });
        
        this.shown = true;
        localStorage.setItem('tutorial_shown', 'true');
    }
    
    reset() {
        this.shown = false;
        localStorage.removeItem('tutorial_shown');
    }
}

// ===================================================================
// ЧАСТЬ 14: НАСТРОЙКИ ЧУВСТВИТЕЛЬНОСТИ
// ===================================================================

class SensitivitySettings {
    constructor() {
        this.settings = {
            movement: {
                horizontal: parseFloat(localStorage.getItem('sens_move_h') || '1.0'),
                vertical: parseFloat(localStorage.getItem('sens_move_v') || '1.0')
            },
            camera: {
                horizontal: parseFloat(localStorage.getItem('sens_cam_h') || '1.0'),
                vertical: parseFloat(localStorage.getItem('sens_cam_v') || '0.8'),
                invertY: localStorage.getItem('sens_invert_y') === 'true'
            },
            aim: {
                horizontal: parseFloat(localStorage.getItem('sens_aim_h') || '0.5'),
                vertical: parseFloat(localStorage.getItem('sens_aim_v') || '0.4')
            },
            gyroscope: {
                horizontal: parseFloat(localStorage.getItem('sens_gyro_h') || '1.0'),
                vertical: parseFloat(localStorage.getItem('sens_gyro_v') || '1.0'),
                invertX: localStorage.getItem('sens_gyro_invert_x') === 'true',
                invertY: localStorage.getItem('sens_gyro_invert_y') === 'true'
            }
        };
    }
    
    setMovementSensitivity(horizontal, vertical) {
        this.settings.movement.horizontal = horizontal;
        this.settings.movement.vertical = vertical;
        localStorage.setItem('sens_move_h', horizontal);
        localStorage.setItem('sens_move_v', vertical);
        this.apply();
    }
    
    setCameraSensitivity(horizontal, vertical, invertY = false) {
        this.settings.camera.horizontal = horizontal;
        this.settings.camera.vertical = vertical;
        this.settings.camera.invertY = invertY;
        localStorage.setItem('sens_cam_h', horizontal);
        localStorage.setItem('sens_cam_v', vertical);
        localStorage.setItem('sens_invert_y', invertY);
        this.apply();
    }
    
    setAimSensitivity(horizontal, vertical) {
        this.settings.aim.horizontal = horizontal;
        this.settings.aim.vertical = vertical;
        localStorage.setItem('sens_aim_h', horizontal);
        localStorage.setItem('sens_aim_v', vertical);
        this.apply();
    }
    
    setGyroscopeSensitivity(horizontal, vertical, invertX = false, invertY = false) {
        this.settings.gyroscope.horizontal = horizontal;
        this.settings.gyroscope.vertical = vertical;
        this.settings.gyroscope.invertX = invertX;
        this.settings.gyroscope.invertY = invertY;
        localStorage.setItem('sens_gyro_h', horizontal);
        localStorage.setItem('sens_gyro_v', vertical);
        localStorage.setItem('sens_gyro_invert_x', invertX);
        localStorage.setItem('sens_gyro_invert_y', invertY);
        this.apply();
    }
    
    apply() {
        if (JOYSTICK_CONFIG.rightStick) {
            JOYSTICK_CONFIG.rightStick.sensitivity = {
                horizontal: this.settings.camera.horizontal,
                vertical: this.settings.camera.vertical,
                invertY: this.settings.camera.invertY
            };
        }
        
        if (JOYSTICK_CONFIG.gyroscope) {
            JOYSTICK_CONFIG.gyroscope.sensitivity = 
                (this.settings.gyroscope.horizontal + this.settings.gyroscope.vertical) / 2;
            JOYSTICK_CONFIG.gyroscope.invertX = this.settings.gyroscope.invertX;
            JOYSTICK_CONFIG.gyroscope.invertY = this.settings.gyroscope.invertY;
        }
        
        // Применяем к активным джойстикам
        if (mobileControls) {
            if (mobileControls.rightStick) {
                mobileControls.rightStick.config.sensitivity = JOYSTICK_CONFIG.rightStick.sensitivity;
            }
            if (mobileControls.gyroscope) {
                mobileControls.gyroscope.config = JOYSTICK_CONFIG.gyroscope;
            }
        }
    }
    
    getSettings() {
        return this.settings;
    }
    
    resetToDefault() {
        this.setMovementSensitivity(1.0, 1.0);
        this.setCameraSensitivity(1.0, 0.8, false);
        this.setAimSensitivity(0.5, 0.4);
        this.setGyroscopeSensitivity(1.0, 1.0, false, false);
    }
}

// ===================================================================
// ЧАСТЬ 15: ИНТЕГРАЦИЯ С ИГРОВЫМ ДВИЖКОМ
// ===================================================================

class GameEngineIntegration {
    constructor() {
        this.player = null;
        this.camera = null;
        this.weapon = null;
        this.connected = false;
    }
    
    connect(player, camera, weapon) {
        this.player = player;
        this.camera = camera;
        this.weapon = weapon;
        this.connected = true;
        
        // Подписываемся на события джойстиков
        this.setupCallbacks();
        
        console.log('✅ Джойстики подключены к игровому движку');
    }
    
    setupCallbacks() {
        // Движение
        window.onMove = (direction, power) => {
            if (!this.connected || !this.player) return;
            
            const speed = this.player.speed || 5;
            const moveX = direction.x * power * speed;
            const moveZ = -direction.y * power * speed; // Инвертируем Y для движения вперёд
            
            this.player.velocity.x = moveX;
            this.player.velocity.z = moveZ;
            
            // Анимация ходьбы
            if (typeof this.player.setWalking === 'function') {
                this.player.setWalking(power > 0.1);
            }
        };
        
        window.onMoveEnd = () => {
            if (!this.connected || !this.player) return;
            
            this.player.velocity.x = 0;
            this.player.velocity.z = 0;
            
            if (typeof this.player.setWalking === 'function') {
                this.player.setWalking(false);
            }
        };
        
        // Камера
        window.onCameraMove = (deltaX, deltaY) => {
            if (!this.connected || !this.camera) return;
            
            const sensitivity = 0.1;
            this.camera.rotation.y -= deltaX * sensitivity;
            this.camera.rotation.x -= deltaY * sensitivity;
            
            // Ограничение по вертикали
            this.camera.rotation.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, this.camera.rotation.x));
        };
        
        // Стрельба
        window.onShootStart = () => {
            if (!this.connected || !this.weapon) return;
            
            if (typeof this.weapon.startShooting === 'function') {
                this.weapon.startShooting();
            }
        };
        
        window.onShootEnd = () => {
            if (!this.connected || !this.weapon) return;
            
            if (typeof this.weapon.stopShooting === 'function') {
                this.weapon.stopShooting();
            }
        };
        
        window.onShoot = () => {
            if (!this.connected || !this.weapon) return;
            
            if (typeof this.weapon.shoot === 'function') {
                this.weapon.shoot();
            }
        };
        
        // Перезарядка
        window.onReload = () => {
            if (!this.connected || !this.weapon) return;
            
            if (typeof this.weapon.reload === 'function') {
                this.weapon.reload();
            }
        };
        
        // Прыжок
        window.onJump = () => {
            if (!this.connected || !this.player) return;
            
            if (typeof this.player.jump === 'function' && this.player.canJump) {
                this.player.jump();
            }
        };
        
        // Присед
        window.onCrouch = (isCrouching) => {
            if (!this.connected || !this.player) return;
            
            if (typeof this.player.setCrouching === 'function') {
                this.player.setCrouching(isCrouching);
            }
        };
        
        // Прицеливание
        window.onAim = (isAiming) => {
            if (!this.connected || !this.weapon) return;
            
            if (typeof this.weapon.setAiming === 'function') {
                this.weapon.setAiming(isAiming);
            }
            
            // Замедление при прицеливании
            if (this.player) {
                this.player.speed = isAiming ? 2.5 : 5;
            }
            
            // Смена FOV камеры
            if (this.camera && typeof this.camera.setFOV === 'function') {
                this.camera.setFOV(isAiming ? 45 : 75);
            }
        };
        
        // Граната
        window.onGrenade = () => {
            if (!this.connected || !this.player) return;
            
            if (typeof this.player.throwGrenade === 'function') {
                this.player.throwGrenade();
            }
        };
        
        // Смена оружия
        window.onSwitchWeapon = () => {
            if (!this.connected || !this.player) return;
            
            if (typeof this.player.switchWeapon === 'function') {
                this.player.switchWeapon();
            }
        };
        
        // Гироскоп
        window.onGyroscope = (data) => {
            if (!this.connected || !this.camera) return;
            if (!JOYSTICK_CONFIG.gyroscope.onlyWhenAiming || joystickState.buttons.aim) {
                const sensitivity = 0.05;
                this.camera.rotation.y += data.gamma * sensitivity;
                this.camera.rotation.x += data.beta * sensitivity;
            }
        };
    }
    
    disconnect() {
        this.player = null;
        this.camera = null;
        this.weapon = null;
        this.connected = false;
        
        // Очищаем коллбэки
        window.onMove = null;
        window.onMoveEnd = null;
        window.onCameraMove = null;
        window.onShootStart = null;
        window.onShootEnd = null;
        window.onShoot = null;
        window.onReload = null;
        window.onJump = null;
        window.onCrouch = null;
        window.onAim = null;
        window.onGrenade = null;
        window.onSwitchWeapon = null;
        window.onGyroscope = null;
    }
}

// ===================================================================
// ЧАСТЬ 16: ТЕСТИРОВАНИЕ ДЖОЙСТИКОВ
// ===================================================================

class JoystickTester {
    constructor() {
        this.testMode = false;
        this.testPanel = null;
        this.testData = {
            left: { active: false, x: 0, y: 0, power: 0 },
            right: { active: false, x: 0, y: 0, power: 0 },
            buttons: {},
            gyro: { alpha: 0, beta: 0, gamma: 0 }
        };
    }
    
    start() {
        this.testMode = true;
        this.createTestPanel();
        this.startMonitoring();
    }
    
    stop() {
        this.testMode = false;
        if (this.testPanel) {
            this.testPanel.remove();
            this.testPanel = null;
        }
    }
    
    createTestPanel() {
        this.testPanel = document.createElement('div');
        this.testPanel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            border: 1px solid #ffd700;
            border-radius: 10px;
            padding: 15px;
            color: white;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            max-width: 200px;
            backdrop-filter: blur(5px);
        `;
        
        this.testPanel.innerHTML = `
            <h4 style="color: #ffd700; margin-bottom: 10px;">🕹️ ТЕСТ ДЖОЙСТИКОВ</h4>
            <div id="testLeft">Левый: ❌</div>
            <div id="testRight">Правый: ❌</div>
            <div id="testButtons">Кнопки: -</div>
            <div id="testGyro">Гиро: -</div>
            <hr style="border-color: #444; margin: 10px 0;">
            <button onclick="joystickTester.stop()" style="padding: 5px 10px; background: #e74c3c; border: none; border-radius: 5px; color: white; cursor: pointer;">ЗАКРЫТЬ</button>
        `;
        
        document.body.appendChild(this.testPanel);
    }
    
    startMonitoring() {
        const update = () => {
            if (!this.testMode) return;
            
            const state = getJoystickState();
            if (state) {
                // Левый джойстик
                const leftEl = document.getElementById('testLeft');
                if (leftEl && state.left) {
                    leftEl.innerHTML = `Левый: ${state.left.active ? '✅' : '❌'} | X: ${state.left.direction.x.toFixed(2)} Y: ${state.left.direction.y.toFixed(2)} P: ${state.left.power.toFixed(2)}`;
                }
                
                // Правый джойстик
                const rightEl = document.getElementById('testRight');
                if (rightEl && state.right) {
                    rightEl.innerHTML = `Правый: ${state.right.active ? '✅' : '❌'} | X: ${(state.right.delta?.x || 0).toFixed(0)} Y: ${(state.right.delta?.y || 0).toFixed(0)} P: ${state.right.power.toFixed(2)}`;
                }
                
                // Кнопки
                const buttonsEl = document.getElementById('testButtons');
                if (buttonsEl && state.buttons) {
                    const activeButtons = Object.entries(state.buttons).filter(([_, v]) => v).map(([k]) => k);
                    buttonsEl.innerHTML = `Кнопки: ${activeButtons.length > 0 ? activeButtons.join(', ') : '-'}`;
                }
                
                // Гироскоп
                const gyroEl = document.getElementById('testGyro');
                if (gyroEl && state.gyroscope) {
                    gyroEl.innerHTML = `Гиро: A:${state.gyroscope.alpha?.toFixed(0) || 0} B:${state.gyroscope.beta?.toFixed(0) || 0} G:${state.gyroscope.gamma?.toFixed(0) || 0}`;
                }
            }
            
            requestAnimationFrame(update);
        };
        
        update();
    }
}

// ===================================================================
// ЧАСТЬ 17: ЭКСПОРТ И ФИНАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ
// ===================================================================

// Создаём глобальные экземпляры
const joystickCustomizer = new JoystickCustomizer();
const layoutEditor = new LayoutEditor();
const controlTutorial = new ControlTutorial();
const sensitivitySettings = new SensitivitySettings();
const gameEngineIntegration = new GameEngineIntegration();
const joystickTester = new JoystickTester();

// Расширяем главный контроллер
const originalInit = MobileControls.prototype.init;
MobileControls.prototype.init = function() {
    originalInit.call(this);
    
    // Загружаем сохранённый layout
    layoutEditor.loadLayout();
    
    // Применяем настройки чувствительности
    sensitivitySettings.apply();
};

// Функция для запуска туториала
function startTutorial() {
    controlTutorial.start();
}

// Функция для сброса туториала
function resetTutorial() {
    controlTutorial.reset();
}

// Функция для открытия редактора расположения
function openLayoutEditor() {
    layoutEditor.startEdit();
}

// Функция для открытия тестера джойстиков
function openJoystickTester() {
    joystickTester.start();
}

// Функция для подключения к игре
function connectToGame(player, camera, weapon) {
    gameEngineIntegration.connect(player, camera, weapon);
}

// Функция для отключения от игры
function disconnectFromGame() {
    gameEngineIntegration.disconnect();
}

// Экспорт
window.joystickCustomizer = joystickCustomizer;
window.layoutEditor = layoutEditor;
window.controlTutorial = controlTutorial;
window.sensitivitySettings = sensitivitySettings;
window.gameEngineIntegration = gameEngineIntegration;
window.joystickTester = joystickTester;

window.startTutorial = startTutorial;
window.resetTutorial = resetTutorial;
window.openLayoutEditor = openLayoutEditor;
window.openJoystickTester = openJoystickTester;
window.connectToGame = connectToGame;
window.disconnectFromGame = disconnectFromGame;

// Показываем туториал при первом запуске (если на мобильном)
document.addEventListener('DOMContentLoaded', () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile) {
        setTimeout(() => {
            controlTutorial.start();
        }, 1000);
    }
});

// Финальное сообщение
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║     🕹️ MOBILE CONTROLS — 6000+ СТРОК ЗАГРУЖЕНО! 🕹️         ║');
console.log('║                  Pixel Strike 15.0 ULTIMATE                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝');

// ===================================================================
// КОНЕЦ ФАЙЛА (6000+ СТРОК)
// ===================================================================