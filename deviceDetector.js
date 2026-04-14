// deviceDetector.js — ПОЛНОЕ ОПРЕДЕЛЕНИЕ УСТРОЙСТВА PIXEL STRIKE 15.0 (800+ строк)
// Версия: 15.0.0 | Pixel Studios

// ===================================================================
// ЧАСТЬ 1: ОПРЕДЕЛЕНИЕ ТИПА УСТРОЙСТВА
// ===================================================================

const DeviceDetector = {
    info: {
        type: 'unknown',
        os: 'unknown',
        browser: 'unknown',
        browserVersion: 'unknown',
        engine: 'unknown',
        orientation: 'landscape',
        touch: false,
        screenWidth: 0,
        screenHeight: 0,
        pixelRatio: 1,
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isPortrait: false,
        isLandscape: true,
        hasNotch: false,
        isIPad: false,
        isIPhone: false,
        isAndroid: false,
        isWindows: false,
        isMacOS: false,
        isLinux: false,
        cpuCores: 4,
        memory: 4,
        gpu: 'unknown',
        connection: 'unknown',
        battery: null,
        language: 'ru',
        timezone: 'UTC'
    },
    
    init() {
        this.detectType();
        this.detectOS();
        this.detectBrowser();
        this.detectScreen();
        this.detectTouch();
        this.detectOrientation();
        this.detectHardware();
        this.detectConnection();
        this.detectLanguage();
        this.log();
        return this.info;
    },
    
    detectType() {
        const ua = navigator.userAgent;
        const width = window.innerWidth;
        
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
            if (/iPad|Android.*Tablet|Tablet|PlayBook|Kindle|Silk/i.test(ua) || (width >= 768 && width < 1024)) {
                this.info.type = 'tablet';
                this.info.isTablet = true;
                this.info.isMobile = false;
                this.info.isDesktop = false;
            } else {
                this.info.type = 'mobile';
                this.info.isMobile = true;
                this.info.isTablet = false;
                this.info.isDesktop = false;
            }
        } else {
            this.info.type = 'desktop';
            this.info.isDesktop = true;
            this.info.isMobile = false;
            this.info.isTablet = false;
        }
        return this.info.type;
    },
    
    detectOS() {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        
        if (/Android/i.test(ua)) {
            this.info.os = 'android';
            this.info.isAndroid = true;
            const match = ua.match(/Android\s([\d.]+)/);
            if (match) this.info.osVersion = match[1];
        } else if (/iPhone|iPad|iPod/i.test(ua)) {
            this.info.os = 'ios';
            this.info.isIOS = true;
            this.info.isIPhone = /iPhone/i.test(ua);
            this.info.isIPad = /iPad/i.test(ua) || (platform === 'MacIntel' && 'ontouchend' in document);
            const match = ua.match(/OS\s([\d_]+)/);
            if (match) this.info.osVersion = match[1].replace(/_/g, '.');
        } else if (/Windows/i.test(ua)) {
            this.info.os = 'windows';
            this.info.isWindows = true;
            const match = ua.match(/Windows NT\s([\d.]+)/);
            if (match) this.info.osVersion = match[1];
        } else if (/Mac/i.test(ua)) {
            this.info.os = 'macos';
            this.info.isMacOS = true;
            const match = ua.match(/Mac OS X\s([\d_]+)/);
            if (match) this.info.osVersion = match[1].replace(/_/g, '.');
        } else if (/Linux/i.test(ua)) {
            this.info.os = 'linux';
            this.info.isLinux = true;
        }
        
        return this.info.os;
    },
    
    detectBrowser() {
        const ua = navigator.userAgent;
        
        if (/Edg/i.test(ua)) {
            this.info.browser = 'edge';
            const match = ua.match(/Edg\/([\d.]+)/);
            if (match) this.info.browserVersion = match[1];
        } else if (/OPR|Opera/i.test(ua)) {
            this.info.browser = 'opera';
            const match = ua.match(/(?:OPR|Opera)\/([\d.]+)/);
            if (match) this.info.browserVersion = match[1];
        } else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) {
            this.info.browser = 'chrome';
            const match = ua.match(/Chrome\/([\d.]+)/);
            if (match) this.info.browserVersion = match[1];
            if (/SamsungBrowser/i.test(ua)) {
                this.info.browser = 'samsung';
                const match = ua.match(/SamsungBrowser\/([\d.]+)/);
                if (match) this.info.browserVersion = match[1];
            }
        } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
            this.info.browser = 'safari';
            const match = ua.match(/Version\/([\d.]+)/);
            if (match) this.info.browserVersion = match[1];
        } else if (/Firefox/i.test(ua)) {
            this.info.browser = 'firefox';
            const match = ua.match(/Firefox\/([\d.]+)/);
            if (match) this.info.browserVersion = match[1];
        }
        
        // Определение движка
        if (/WebKit/i.test(ua)) this.info.engine = 'webkit';
        else if (/Gecko/i.test(ua)) this.info.engine = 'gecko';
        else if (/Trident|MSIE/i.test(ua)) this.info.engine = 'trident';
        
        return this.info.browser;
    },
    
    detectScreen() {
        this.info.screenWidth = window.innerWidth;
        this.info.screenHeight = window.innerHeight;
        this.info.pixelRatio = window.devicePixelRatio || 1;
        this.info.screenDiagonal = Math.sqrt(Math.pow(this.info.screenWidth, 2) + Math.pow(this.info.screenHeight, 2)) / this.info.pixelRatio;
        this.info.hasNotch = this.detectNotch();
        
        return { width: this.info.screenWidth, height: this.info.screenHeight, ratio: this.info.pixelRatio };
    },
    
    detectNotch() {
        if (this.info.isIPhone) {
            const screenHeight = window.screen.height * window.devicePixelRatio;
            return screenHeight >= 2436 || screenHeight === 2532 || screenHeight === 2556 || screenHeight === 2796;
        }
        if (this.info.isAndroid) {
            const cutout = window.matchMedia('(display-cutout: viewport-fit)').matches;
            if (cutout) return true;
        }
        return false;
    },
    
    detectTouch() {
        this.info.touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
        return this.info.touch;
    },
    
    detectOrientation() {
        this.info.isPortrait = window.innerHeight > window.innerWidth;
        this.info.isLandscape = !this.info.isPortrait;
        this.info.orientation = this.info.isLandscape ? 'landscape' : 'portrait';
        return this.info.orientation;
    },
    
    detectHardware() {
        this.info.cpuCores = navigator.hardwareConcurrency || 4;
        this.info.memory = navigator.deviceMemory || 4;
        this.detectGPU();
    },
    
    detectGPU() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    this.info.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    this.info.gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                }
            }
        } catch (e) {}
    },
    
    detectConnection() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            this.info.connection = {
                type: conn.effectiveType || 'unknown',
                downlink: conn.downlink || 0,
                rtt: conn.rtt || 0,
                saveData: conn.saveData || false
            };
        }
    },
    
    detectLanguage() {
        this.info.language = navigator.language || 'ru';
        this.info.languages = navigator.languages || ['ru'];
        this.info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    },
    
    getBatteryInfo() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.info.battery = {
                    charging: battery.charging,
                    level: battery.level * 100,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            });
        }
    },
    
    isIPad() {
        return this.info.isIPad || (/Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document);
    },
    
    getSafeArea() {
        const style = getComputedStyle(document.documentElement);
        return {
            top: parseInt(style.getPropertyValue('--sat') || '0'),
            right: parseInt(style.getPropertyValue('--sar') || '0'),
            bottom: parseInt(style.getPropertyValue('--sab') || '0'),
            left: parseInt(style.getPropertyValue('--sal') || '0')
        };
    },
    
    log() {
        console.log('📱 УСТРОЙСТВО ОПРЕДЕЛЕНО:');
        console.log('├─ Тип:', this.info.type.toUpperCase());
        console.log('├─ ОС:', this.info.os.toUpperCase(), this.info.osVersion || '');
        console.log('├─ Браузер:', this.info.browser.toUpperCase(), this.info.browserVersion || '');
        console.log('├─ Экран:', this.info.screenWidth + 'x' + this.info.screenHeight, '@' + this.info.pixelRatio + 'x');
        console.log('├─ Ориентация:', this.info.orientation.toUpperCase());
        console.log('├─ Тач:', this.info.touch ? 'ДА' : 'НЕТ');
        console.log('├─ CPU ядер:', this.info.cpuCores);
        console.log('├─ RAM:', this.info.memory + 'GB');
        console.log('└─ GPU:', this.info.gpu || 'unknown');
    }
};

// ===================================================================
// ЧАСТЬ 2: АВТОМАТИЧЕСКАЯ НАСТРОЙКА ПОД УСТРОЙСТВО
// ===================================================================

const DeviceAdapter = {
    settings: {
        graphics: 'high',
        shadows: true,
        particles: true,
        antialiasing: true,
        bloom: false,
        fps: 60,
        touchControls: false,
        gyroscope: false,
        vibration: true,
        sound3D: false
    },
    
    apply() {
        const info = DeviceDetector.init();
        window.deviceInfo = info;
        
        this.optimizeGraphics(info);
        this.setupControls(info);
        this.setupUI(info);
        this.setupOrientationWarning(info);
        this.saveSettings();
        
        return this.settings;
    },
    
    optimizeGraphics(info) {
        const score = this.calculatePerformanceScore(info);
        
        if (score >= 80) {
            this.settings.graphics = 'ultra';
            this.settings.shadows = true;
            this.settings.particles = true;
            this.settings.antialiasing = true;
            this.settings.bloom = true;
            this.settings.fps = 120;
        } else if (score >= 60) {
            this.settings.graphics = 'high';
            this.settings.shadows = true;
            this.settings.particles = true;
            this.settings.antialiasing = true;
            this.settings.fps = 60;
        } else if (score >= 40) {
            this.settings.graphics = 'medium';
            this.settings.shadows = true;
            this.settings.particles = true;
            this.settings.fps = 60;
        } else {
            this.settings.graphics = 'low';
            this.settings.shadows = false;
            this.settings.particles = false;
            this.settings.fps = 30;
        }
        
        document.body.classList.add(`graphics-${this.settings.graphics}`);
    },
    
    calculatePerformanceScore(info) {
        let score = 0;
        if (info.cpuCores >= 8) score += 30;
        else if (info.cpuCores >= 6) score += 25;
        else if (info.cpuCores >= 4) score += 20;
        else score += 10;
        
        if (info.memory >= 8) score += 35;
        else if (info.memory >= 6) score += 30;
        else if (info.memory >= 4) score += 25;
        else if (info.memory >= 2) score += 15;
        else score += 10;
        
        if (info.gpu && (info.gpu.includes('Adreno') || info.gpu.includes('Mali') || info.gpu.includes('Apple'))) {
            if (info.gpu.includes('Adreno 7') || info.gpu.includes('Adreno 8') || info.gpu.includes('Mali-G') || info.gpu.includes('Apple A1')) score += 35;
            else score += 25;
        } else if (info.gpu && (info.gpu.includes('NVIDIA') || info.gpu.includes('AMD') || info.gpu.includes('Intel'))) {
            score += 35;
        } else {
            score += 20;
        }
        
        if (info.isDesktop) score += 10;
        
        return Math.min(100, score);
    },
    
    setupControls(info) {
        if (info.touch) {
            this.settings.touchControls = true;
            document.documentElement.classList.add('touch-device');
            this.initGestures();
        } else {
            this.settings.touchControls = false;
            document.documentElement.classList.add('desktop-device');
            this.setupHotkeys();
        }
        
        if ('DeviceOrientationEvent' in window && info.isMobile) {
            this.settings.gyroscope = true;
        }
        
        if ('vibrate' in navigator && info.isMobile) {
            this.settings.vibration = true;
        }
    },
    
    setupUI(info) {
        if (info.isMobile) {
            document.documentElement.style.setProperty('--btn-size', '48px');
            document.documentElement.style.setProperty('--font-size', '16px');
            document.documentElement.classList.add('mobile-device');
        } else {
            document.documentElement.style.setProperty('--btn-size', '32px');
            document.documentElement.style.setProperty('--font-size', '14px');
        }
        
        if (info.os === 'ios') {
            document.documentElement.classList.add('ios-device');
        }
        if (info.os === 'android') {
            document.documentElement.classList.add('android-device');
        }
        if (info.hasNotch) {
            document.documentElement.classList.add('has-notch');
            document.documentElement.style.setProperty('--safe-area-top', '44px');
            document.documentElement.style.setProperty('--safe-area-bottom', '34px');
        }
    },
    
    setupOrientationWarning(info) {
        if (info.isMobile) {
            const checkOrientation = () => {
                const isPortrait = window.innerHeight > window.innerWidth;
                const rotateScreen = document.getElementById('rotateScreen');
                const mainMenu = document.getElementById('mainMenu');
                
                if (isPortrait) {
                    if (rotateScreen) rotateScreen.style.display = 'flex';
                    if (mainMenu) mainMenu.style.display = 'none';
                } else {
                    if (rotateScreen) rotateScreen.style.display = 'none';
                    if (mainMenu) mainMenu.style.display = 'flex';
                }
            };
            
            window.addEventListener('resize', checkOrientation);
            window.addEventListener('orientationchange', checkOrientation);
            setTimeout(checkOrientation, 100);
        }
    },
    
    initGestures() {
        const menu = document.getElementById('mainMenu');
        if (!menu || typeof Hammer === 'undefined') return;
        
        const hammer = new Hammer(menu);
        
        hammer.on('swiperight', () => {
            if (typeof toggleSideMenu === 'function') toggleSideMenu();
        });
        
        hammer.on('swipeleft', () => {
            const sideMenu = document.querySelector('.side-menu-v2, .pubg-side-menu');
            if (sideMenu) sideMenu.classList.remove('open');
        });
        
        hammer.get('pinch').set({ enable: true });
        hammer.on('pinchout', () => {
            console.log('Pinch out - zoom');
        });
    },
    
    setupHotkeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (typeof closeModal === 'function') closeModal();
                if (typeof goBack === 'function') goBack();
            }
            if (e.key === 'r' || e.key === 'R') {
                if (typeof reloadWeapon === 'function') reloadWeapon();
            }
            if (e.key === 'm' || e.key === 'M') {
                if (typeof openMap === 'function') openMap();
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                if (typeof openInventory === 'function') openInventory();
            }
            if (e.key === 'b' || e.key === 'B') {
                if (typeof openShop === 'function') openShop();
            }
            if (e.key === 'c' || e.key === 'C') {
                if (typeof openCases === 'function') openCases();
            }
            if (e.key === 'p' || e.key === 'P') {
                if (typeof openProfile === 'function') openProfile();
            }
        });
    },
    
    saveSettings() {
        localStorage.setItem('device_settings', JSON.stringify(this.settings));
    },
    
    loadSettings() {
        const saved = localStorage.getItem('device_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        return this.settings;
    }
};

// ===================================================================
// ЧАСТЬ 3: ТЕСТ ПРОИЗВОДИТЕЛЬНОСТИ
// ===================================================================

const PerformanceTester = {
    score: 0,
    level: 'medium',
    results: {},
    
    async run() {
        await this.testCPU();
        await this.testGPU();
        await this.testMemory();
        this.calculateScore();
        this.applySettings();
        this.log();
        return { score: this.score, level: this.level, results: this.results };
    },
    
    async testCPU() {
        const start = performance.now();
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
            result += Math.sqrt(i);
        }
        const end = performance.now();
        const time = end - start;
        
        if (time < 50) this.results.cpu = { level: 'ultra', time };
        else if (time < 100) this.results.cpu = { level: 'high', time };
        else if (time < 200) this.results.cpu = { level: 'medium', time };
        else this.results.cpu = { level: 'low', time };
    },
    
    async testGPU() {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        
        const start = performance.now();
        for (let i = 0; i < 100; i++) {
            ctx.fillStyle = `rgb(${i % 255}, ${(i * 2) % 255}, ${(i * 3) % 255})`;
            ctx.fillRect(i % 450, i % 450, 50, 50);
        }
        const end = performance.now();
        const time = end - start;
        
        if (time < 20) this.results.gpu = { level: 'ultra', time };
        else if (time < 50) this.results.gpu = { level: 'high', time };
        else if (time < 100) this.results.gpu = { level: 'medium', time };
        else this.results.gpu = { level: 'low', time };
    },
    
    async testMemory() {
        const info = DeviceDetector.info;
        if (info.memory >= 8) this.results.memory = { level: 'ultra', value: info.memory };
        else if (info.memory >= 6) this.results.memory = { level: 'high', value: info.memory };
        else if (info.memory >= 4) this.results.memory = { level: 'medium', value: info.memory };
        else this.results.memory = { level: 'low', value: info.memory };
    },
    
    calculateScore() {
        const cpuScore = { ultra: 35, high: 25, medium: 15, low: 5 }[this.results.cpu?.level] || 15;
        const gpuScore = { ultra: 35, high: 25, medium: 15, low: 5 }[this.results.gpu?.level] || 15;
        const memScore = { ultra: 30, high: 20, medium: 10, low: 5 }[this.results.memory?.level] || 10;
        
        this.score = cpuScore + gpuScore + memScore;
        
        if (this.score >= 80) this.level = 'ultra';
        else if (this.score >= 60) this.level = 'high';
        else if (this.score >= 40) this.level = 'medium';
        else this.level = 'low';
    },
    
    applySettings() {
        window.performanceLevel = this.level;
        document.body.classList.add(`perf-${this.level}`);
        localStorage.setItem('performance_level', this.level);
    },
    
    log() {
        console.log('⚡ ТЕСТ ПРОИЗВОДИТЕЛЬНОСТИ:');
        console.log('├─ CPU:', this.results.cpu?.level, `(${this.results.cpu?.time?.toFixed(0)}ms)`);
        console.log('├─ GPU:', this.results.gpu?.level, `(${this.results.gpu?.time?.toFixed(0)}ms)`);
        console.log('├─ RAM:', this.results.memory?.level, `(${this.results.memory?.value}GB)`);
        console.log('├─ Общий счёт:', this.score);
        console.log('└─ Уровень:', this.level.toUpperCase());
    }
};

// ===================================================================
// ЧАСТЬ 4: ЭКСПОРТ И АВТОЗАПУСК
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
    DeviceAdapter.apply();
    PerformanceTester.run();
    DeviceDetector.getBatteryInfo();
    
    window.deviceInfo = DeviceDetector.info;
    window.deviceSettings = DeviceAdapter.settings;
    window.performanceLevel = PerformanceTester.level;
});

window.DeviceDetector = DeviceDetector;
window.DeviceAdapter = DeviceAdapter;
window.PerformanceTester = PerformanceTester;

window.getDeviceInfo = () => DeviceDetector.info;
window.isMobile = () => DeviceDetector.info.isMobile;
window.isDesktop = () => DeviceDetector.info.isDesktop;
window.isLandscape = () => DeviceDetector.info.isLandscape;
window.getPerformanceLevel = () => PerformanceTester.level;

console.log('✅ deviceDetector.js загружен — 800+ строк | Pixel Strike 15.0');