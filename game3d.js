// game3d.js — ПОЛНЫЙ 3D-ДВИЖОК PIXEL STRIKE 15.0 (3000+ строк)
// Часть 1: Ядро, сцена, камера, освещение, загрузка карт

import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://unpkg.com/three@0.128.0/examples/jsm/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

// ===================================================================
// ЧАСТЬ 1: КОНФИГУРАЦИЯ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ===================================================================

const GAME_CONFIG = {
    version: '15.0.0',
    debug: false,
    showFPS: true,
    antialias: true,
    shadows: true,
    shadowQuality: 'high',
    renderDistance: 200,
    fov: 85,
    mouseSensitivity: 0.002,
    playerSpeed: 0.15,
    sprintMultiplier: 1.8,
    crouchHeight: 1.2,
    standHeight: 1.8
};

// Глобальные объекты
let scene, camera, renderer, labelRenderer;
let clock = new THREE.Clock();
let deltaTime = 0;
let elapsedTime = 0;
let frameCount = 0;
let fps = 60;

// Игровые состояния
let gameState = {
    mode: 'menu', // 'menu', 'loading', 'playing', 'paused', 'spectating'
    currentMap: null,
    players: new Map(),
    localPlayer: null,
    enemies: [],
    bullets: [],
    grenades: [],
    decals: [],
    powerups: []
};

// Управление
let keys = {};
let mouse = { x: 0, y: 0, left: false, right: false };
let isPointerLocked = false;

// Звуки
let soundManager = null;

// Интерфейс
let uiElements = {};

// ===================================================================
// ЧАСТЬ 2: ИНИЦИАЛИЗАЦИЯ СЦЕНЫ
// ===================================================================

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.008);
    
    camera = new THREE.PerspectiveCamera(
        GAME_CONFIG.fov,
        window.innerWidth / window.innerHeight,
        0.1,
        GAME_CONFIG.renderDistance
    );
    camera.position.set(0, 2, 10);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: GAME_CONFIG.antialias,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = GAME_CONFIG.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.bias = -0.0005;
    document.body.appendChild(renderer.domElement);
    
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.style.zIndex = '100';
    document.body.appendChild(labelRenderer.domElement);
    
    console.log('✅ Сцена инициализирована');
}

// ===================================================================
// ЧАСТЬ 3: ОСВЕЩЕНИЕ
// ===================================================================

function initLighting() {
    // Окружающий свет
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);
    
    // Основной направленный свет (солнце)
    const sunLight = new THREE.DirectionalLight(0xfff5d1, 1.5);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = GAME_CONFIG.shadows;
    sunLight.receiveShadow = GAME_CONFIG.shadows;
    
    if (GAME_CONFIG.shadowQuality === 'high') {
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
    } else {
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
    }
    
    const d = 60;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.bias = -0.0005;
    
    scene.add(sunLight);
    
    // Заполняющий свет
    const fillLight1 = new THREE.PointLight(0x4466ff, 0.4);
    fillLight1.position.set(-30, 20, 30);
    scene.add(fillLight1);
    
    const fillLight2 = new THREE.PointLight(0xffaa66, 0.3);
    fillLight2.position.set(30, 15, -30);
    scene.add(fillLight2);
    
    // Подсветка снизу
    const bottomLight = new THREE.PointLight(0x3355aa, 0.2);
    bottomLight.position.set(0, -10, 0);
    scene.add(bottomLight);
    
    console.log('💡 Освещение настроено');
}

// ===================================================================
// ЧАСТЬ 4: ЗАГРУЗКА 3D-КАРТЫ (WAREHOUSE GRID)
// ===================================================================

function loadMap(mapId) {
    const mapData = ALL_MAPS.find(m => m.id === mapId);
    if (!mapData) {
        console.error('❌ Карта не найдена:', mapId);
        return false;
    }
    
    gameState.currentMap = mapData;
    
    // Очищаем старую карту
    clearMap();
    
    // Создаём пол
    createFloor(mapData);
    
    // Создаём стены
    createWalls(mapData);
    
    // Создаём зоны
    createZones(mapData);
    
    // Создаём укрытия
    createCovers(mapData);
    
    // Создаём декорации
    createDecorations(mapData);
    
    // Устанавливаем спавн
    if (gameState.localPlayer) {
        const spawn = mapData.spawnCT;
        gameState.localPlayer.position.set(spawn.x, 1.8, spawn.y);
    }
    
    console.log('🗺️ Карта загружена:', mapData.name);
    return true;
}

function createFloor(mapData) {
    const width = mapData.width || 1280;
    const depth = mapData.height || 720;
    const scale = 0.05; // Масштабируем до разумных размеров
    
    const geometry = new THREE.PlaneGeometry(width * scale, depth * scale);
    const material = new THREE.MeshStandardMaterial({
        color: mapData.colors?.floor || '#4a5564',
        roughness: 0.7,
        metalness: 0.1
    });
    
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    floor.userData.isFloor = true;
    scene.add(floor);
    
    // Сетка на полу
    const gridHelper = new THREE.GridHelper(width * scale, 40, mapData.colors?.accent || '#f2a25a', '#334455');
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
    
    // Второй слой пола (для зон)
    if (mapData.zones) {
        mapData.zones.forEach(zone => {
            if (zone.type === 'high' || zone.type === 'room') {
                const zoneGeo = new THREE.BoxGeometry(zone.w * scale, 0.1, zone.h * scale);
                const zoneMat = new THREE.MeshStandardMaterial({
                    color: mapData.colors[zone.color] || '#667688',
                    transparent: true,
                    opacity: 0.3
                });
                const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
                zoneMesh.position.set(
                    (zone.x + zone.w/2) * scale,
                    0.05,
                    (zone.y + zone.h/2) * scale
                );
                zoneMesh.receiveShadow = true;
                scene.add(zoneMesh);
            }
        });
    }
}

function createWalls(mapData) {
    const scale = 0.05;
    const wallHeight = 4;
    
    if (!mapData.walls) return;
    
    mapData.walls.forEach(wall => {
        const width = Math.abs(wall.x2 - wall.x1) * scale;
        const depth = Math.abs(wall.y2 - wall.y1) * scale;
        
        // Определяем ориентацию стены
        const isHorizontal = Math.abs(wall.y2 - wall.y1) < Math.abs(wall.x2 - wall.x1);
        
        const geometry = new THREE.BoxGeometry(
            isHorizontal ? width : 0.5,
            wallHeight,
            isHorizontal ? 0.5 : depth
        );
        
        const material = new THREE.MeshStandardMaterial({
            color: mapData.colors?.wall || '#2b3442',
            roughness: 0.6,
            metalness: 0.1
        });
        
        const wallMesh = new THREE.Mesh(geometry, material);
        wallMesh.position.set(
            ((wall.x1 + wall.x2) / 2) * scale,
            wallHeight / 2,
            ((wall.y1 + wall.y2) / 2) * scale
        );
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        wallMesh.userData.isWall = true;
        wallMesh.userData.wallbang = wall.wallbang || false;
        
        scene.add(wallMesh);
        
        // Добавляем обводку
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: mapData.colors?.wallEdge || '#0f141c' })
        );
        line.position.copy(wallMesh.position);
        scene.add(line);
    });
}

function createZones(mapData) {
    const scale = 0.05;
    const loader = new CSS2DRenderer();
    
    if (!mapData.zones) return;
    
    mapData.zones.forEach(zone => {
        // Создаём текстовую метку
        const div = document.createElement('div');
        div.textContent = zone.label;
        div.style.color = mapData.colors?.text || '#f4f7fb';
        div.style.fontSize = zone.id.includes('Spawn') ? '20px' : '14px';
        div.style.fontWeight = 'bold';
        div.style.textShadow = '2px 2px 4px black';
        div.style.padding = '4px 12px';
        div.style.background = 'rgba(0,0,0,0.5)';
        div.style.borderRadius = '20px';
        div.style.border = '1px solid ' + (mapData.colors?.accent || '#f2a25a');
        div.style.whiteSpace = 'nowrap';
        
        const label = new CSS2DObject(div);
        label.position.set(
            (zone.x + zone.w/2) * scale,
            3.5,
            (zone.y + zone.h/2) * scale
        );
        scene.add(label);
        
        // Для важных зон добавляем свечение
        if (zone.type === 'combat' || zone.type === 'mid') {
            const light = new THREE.PointLight(mapData.colors[zone.color] || '#ff4444', 0.5, 15);
            light.position.set(
                (zone.x + zone.w/2) * scale,
                2,
                (zone.y + zone.h/2) * scale
            );
            scene.add(light);
        }
    });
}

function createCovers(mapData) {
    const scale = 0.05;
    
    if (!mapData.zones) return;
    
    const coverZones = mapData.zones.filter(z => z.type === 'cover');
    
    coverZones.forEach(zone => {
        // Ящики
        const crateCount = 3;
        for (let i = 0; i < crateCount; i++) {
            const crateGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            const crateMat = new THREE.MeshStandardMaterial({
                color: 0x8B6914,
                roughness: 0.8
            });
            const crate = new THREE.Mesh(crateGeo, crateMat);
            crate.position.set(
                (zone.x + 30 + i * 40) * scale,
                0.75,
                (zone.y + zone.h/2) * scale
            );
            crate.castShadow = true;
            crate.receiveShadow = true;
            crate.userData.isCover = true;
            scene.add(crate);
        }
    });
}

function createDecorations(mapData) {
    const scale = 0.05;
    
    // Бочки в опасной зоне
    const riskZone = mapData.zones?.find(z => z.id === 'risk');
    if (riskZone) {
        for (let i = 0; i < 8; i++) {
            const barrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8);
            const barrelMat = new THREE.MeshStandardMaterial({
                color: 0xCC4444,
                roughness: 0.5
            });
            const barrel = new THREE.Mesh(barrelGeo, barrelMat);
            barrel.position.set(
                (riskZone.x + 50 + i * 80) * scale,
                0.75,
                (riskZone.y + riskZone.h/2 + (i % 2 === 0 ? 30 : -30)) * scale
            );
            barrel.castShadow = true;
            barrel.receiveShadow = true;
            scene.add(barrel);
        }
    }
    
    // Вентиляционные решётки
    const vents = mapData.zones?.filter(z => z.type === 'utility');
    vents?.forEach(vent => {
        const ventGeo = new THREE.BoxGeometry(vent.w * scale, 0.2, vent.h * scale);
        const ventMat = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.9,
            metalness: 0.5
        });
        const ventMesh = new THREE.Mesh(ventGeo, ventMat);
        ventMesh.position.set(
            (vent.x + vent.w/2) * scale,
            0.2,
            (vent.y + vent.h/2) * scale
        );
        ventMesh.receiveShadow = true;
        scene.add(ventMesh);
    });
}

function clearMap() {
    // Удаляем все объекты карты
    scene.children.forEach(child => {
        if (child.userData.isFloor || child.userData.isWall || child.userData.isCover || child.userData.isDecoration) {
            scene.remove(child);
        }
        if (child instanceof CSS2DObject) {
            scene.remove(child);
        }
    });
}

// ===================================================================
// ЧАСТЬ 5: СОЗДАНИЕ ИГРОКА
// ===================================================================

function createPlayer(isLocal = false, team = 'ct') {
    const playerGroup = new THREE.Group();
    
    // Материалы
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 });
    const teamMat = new THREE.MeshStandardMaterial({
        color: team === 'ct' ? 0x4db2ff : 0xd37a3d,
        roughness: 0.4
    });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.7 });
    const helmetMat = new THREE.MeshStandardMaterial({
        color: team === 'ct' ? 0x3a5a8a : 0x5a3a2a,
        roughness: 0.3
    });
    
    // Тело
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 1.2, 8), teamMat);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    playerGroup.add(body);
    
    // Голова
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), skinMat);
    head.position.y = 1.35;
    head.castShadow = true;
    head.receiveShadow = true;
    playerGroup.add(head);
    
    // Шлем
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.27, 8, 8), helmetMat);
    helmet.position.y = 1.35;
    helmet.scale.set(1.1, 0.6, 1.0);
    helmet.castShadow = true;
    playerGroup.add(helmet);
    
    // Оружие (только для локального игрока)
    if (isLocal) {
        const weaponGroup = createWeapon('ak47');
        weaponGroup.position.set(0.5, 0.8, 0.3);
        weaponGroup.rotation.y = -0.2;
        playerGroup.add(weaponGroup);
        playerGroup.userData.weapon = weaponGroup;
    }
    
    // Руки
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 6), skinMat);
    leftArm.position.set(-0.5, 0.9, 0);
    leftArm.rotation.z = 0.15;
    leftArm.castShadow = true;
    playerGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 6), skinMat);
    rightArm.position.set(0.5, 0.9, 0);
    rightArm.rotation.z = -0.1;
    rightArm.castShadow = true;
    playerGroup.add(rightArm);
    
    // Ноги
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.7, 6), pantsMat);
    leftLeg.position.set(-0.2, 0.25, 0);
    leftLeg.castShadow = true;
    playerGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.7, 6), pantsMat);
    rightLeg.position.set(0.2, 0.25, 0);
    rightLeg.castShadow = true;
    playerGroup.add(rightLeg);
    
    // Данные игрока
    playerGroup.userData.team = team;
    playerGroup.userData.health = 100;
    playerGroup.userData.maxHealth = 100;
    playerGroup.userData.armor = 0;
    playerGroup.userData.isLocal = isLocal;
    
    // Метка с именем
    if (!isLocal) {
        const nameDiv = document.createElement('div');
        nameDiv.textContent = team === 'ct' ? 'CT' : 'T';
        nameDiv.style.color = 'white';
        nameDiv.style.fontSize = '12px';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.textShadow = '1px 1px 3px black';
        nameDiv.style.background = team === 'ct' ? '#4db2ff' : '#d37a3d';
        nameDiv.style.padding = '2px 8px';
        nameDiv.style.borderRadius = '10px';
        
        const nameLabel = new CSS2DObject(nameDiv);
        nameLabel.position.y = 2.2;
        playerGroup.add(nameLabel);
    }
    
    return playerGroup;
}

function createWeapon(type = 'ak47') {
    const weaponGroup = new THREE.Group();
    
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
    
    // Тело
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.6), bodyMat);
    body.position.z = 0.3;
    body.castShadow = true;
    weaponGroup.add(body);
    
    // Ствол
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), darkMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.65;
    barrel.castShadow = true;
    weaponGroup.add(barrel);
    
    // Магазин
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.1), darkMat);
    mag.position.set(0, -0.08, 0.25);
    mag.castShadow = true;
    weaponGroup.add(mag);
    
    // Приклад
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.3), bodyMat);
    stock.position.set(0, -0.02, -0.15);
    stock.castShadow = true;
    weaponGroup.add(stock);
    
    return weaponGroup;
}

// ===================================================================
// ЧАСТЬ 6: ЗАСТАВКА КОМПАНИИ (PIXEL STUDIOS)
// ===================================================================

function showStudioSplash() {
    return new Promise(resolve => {
        const splashDiv = document.createElement('div');
        splashDiv.id = 'studioSplash';
        splashDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            opacity: 1;
            transition: opacity 0.5s;
        `;
        
        splashDiv.innerHTML = `
            <div style="text-align: center; animation: studioPulse 2s ease-in-out;">
                <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 40px;">
                    <div style="width: 50px; height: 50px; background: white; animation: blockFloat 1s infinite alternate;"></div>
                    <div style="width: 50px; height: 50px; background: white; animation: blockFloat 1s infinite alternate 0.2s;"></div>
                    <div style="width: 50px; height: 50px; background: white; animation: blockFloat 1s infinite alternate 0.4s;"></div>
                </div>
                <div style="font-family: 'Courier New', monospace; font-size: 36px; color: white; letter-spacing: 10px; margin-bottom: 20px;">
                    PIXEL STUDIOS
                </div>
                <div style="font-family: 'Courier New', monospace; font-size: 16px; color: #888; letter-spacing: 6px;">
                    PRESENTS
                </div>
            </div>
        `;
        
        // Добавляем стили анимации
        const style = document.createElement('style');
        style.textContent = `
            @keyframes studioPulse {
                0% { opacity: 0; transform: scale(0.95); }
                20% { opacity: 1; transform: scale(1); }
                80% { opacity: 1; }
                100% { opacity: 0; }
            }
            @keyframes blockFloat {
                from { transform: translateY(0); }
                to { transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(splashDiv);
        
        // Через 3 секунды скрываем
        setTimeout(() => {
            splashDiv.style.opacity = '0';
            setTimeout(() => {
                splashDiv.remove();
                resolve();
            }, 500);
        }, 3000);
    });
}

// ===================================================================
// ЧАСТЬ 7: ЗАГРУЗОЧНЫЙ ЭКРАН
// ===================================================================

function showLoadingScreen(mapName = 'WAREHOUSE GRID') {
    return new Promise(resolve => {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingScreen';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0a0a0f, #1a1a2e);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
        `;
        
        loadingDiv.innerHTML = `
            <div style="text-align: center; max-width: 400px; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 30px;">🎮</div>
                <h1 style="color: #ffd700; margin-bottom: 10px;">PIXEL STRIKE</h1>
                <p style="color: #888; margin-bottom: 30px;">${mapName}</p>
                
                <div style="width: 300px; height: 6px; background: #333; border-radius: 3px; overflow: hidden; margin: 20px auto;">
                    <div id="loadingBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #ffd700, #ff4500); transition: width 0.3s;"></div>
                </div>
                
                <p id="loadingStatus" style="color: #ffd700; margin: 15px 0;">Загрузка карты...</p>
                <p id="loadingTip" style="color: #aaa; font-size: 14px; margin-top: 30px;"></p>
            </div>
        `;
        
        document.body.appendChild(loadingDiv);
        
        const tips = [
            '💡 Используйте укрытия для защиты',
            '💡 Контролируйте центр карты',
            '💡 Вентиляция позволяет быстро менять позицию',
            '💡 High Ground даёт преимущество',
            '💡 Safe Cover — лучшие места для перезарядки'
        ];
        
        let progress = 0;
        const statuses = [
            'Загрузка текстур...',
            'Загрузка моделей...',
            'Построение карты...',
            'Расстановка игроков...',
            'Готово!'
        ];
        
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                document.getElementById('loadingBar').style.width = '100%';
                document.getElementById('loadingStatus').textContent = '✅ Готово!';
                
                setTimeout(() => {
                    loadingDiv.style.opacity = '0';
                    loadingDiv.style.transition = 'opacity 0.5s';
                    setTimeout(() => {
                        loadingDiv.remove();
                        resolve();
                    }, 500);
                }, 500);
            } else {
                document.getElementById('loadingBar').style.width = progress + '%';
                const statusIndex = Math.floor((progress / 100) * statuses.length);
                document.getElementById('loadingStatus').textContent = statuses[Math.min(statusIndex, statuses.length - 1)];
                document.getElementById('loadingTip').textContent = tips[Math.floor(Math.random() * tips.length)];
            }
        }, 100);
    });
}

// ===================================================================
// ЧАСТЬ 8: ЛОББИ (3D-ПЕРСОНАЖ В ЦЕНТРЕ)
// ===================================================================

function showLobby() {
    gameState.mode = 'menu';
    
    // Очищаем сцену
    while(scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    
    // Устанавливаем красивый фон
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.015);
    
    // Освещение для лобби
    initLobbyLighting();
    
    // Создаём персонажа в центре
    const playerModel = createPlayer(true, 'ct');
    playerModel.position.set(0, 0, 0);
    playerModel.scale.set(1.5, 1.5, 1.5);
    scene.add(playerModel);
    gameState.lobbyCharacter = playerModel;
    
    // Платформа под персонажем
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 0.2, 32),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.5, metalness: 0.3 })
    );
    platform.position.y = -0.1;
    platform.receiveShadow = true;
    scene.add(platform);
    
    // Кольцо вокруг платформы
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.05, 16, 64),
        new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x442200, emissiveIntensity: 0.3 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    scene.add(ring);
    
    // Частицы на фоне
    createLobbyParticles();
    
    // Камера для лобби
    camera.position.set(4, 2.5, 6);
    camera.lookAt(0, 1.5, 0);
    
    console.log('🏠 Лобби загружено');
}

function initLobbyLighting() {
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);
    
    const mainLight = new THREE.DirectionalLight(0xfff5d1, 1.2);
    mainLight.position.set(3, 5, 4);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    const backLight = new THREE.PointLight(0x4466ff, 0.5);
    backLight.position.set(-2, 2, -3);
    scene.add(backLight);
    
    const goldLight = new THREE.PointLight(0xffd700, 0.6);
    goldLight.position.set(2, 2, 3);
    scene.add(goldLight);
    
    const fillLight = new THREE.PointLight(0xffaa66, 0.3);
    fillLight.position.set(-1, 1, 2);
    scene.add(fillLight);
}

function createLobbyParticles() {
    const geometry = new THREE.BufferGeometry();
    const count = 400;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 20;
        positions[i+1] = (Math.random() - 0.5) * 15;
        positions[i+2] = (Math.random() - 0.5) * 20;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 0.03,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    gameState.lobbyParticles = particles;
}

// ===================================================================
// ЭКСПОРТ (продолжение в Части 2)
// ===================================================================

console.log('✅ game3d.js — Часть 1 загружена (ядро, карты, лобби, заставка, загрузка)');

// game3d.js — ЧАСТЬ 2: Игровой цикл, управление, стрельба, физика, мультиплеер, UI
// Продолжение Части 1

// ===================================================================
// ЧАСТЬ 9: ИГРОВОЙ ЦИКЛ (АНИМАЦИЯ)
// ===================================================================

function gameLoop() {
    requestAnimationFrame(gameLoop);
    
    deltaTime = clock.getDelta();
    elapsedTime += deltaTime;
    frameCount++;
    
    // Обновление FPS
    if (frameCount % 60 === 0) {
        fps = Math.round(1 / deltaTime);
        if (GAME_CONFIG.showFPS) {
            updateFPSDisplay();
        }
    }
    
    // Обновление в зависимости от режима
    switch (gameState.mode) {
        case 'menu':
            updateLobby();
            break;
        case 'playing':
            updateGame();
            break;
        case 'spectating':
            updateSpectator();
            break;
    }
    
    // Рендеринг
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function updateLobby() {
    if (gameState.lobbyCharacter) {
        // Плавное покачивание персонажа
        gameState.lobbyCharacter.rotation.y = Math.sin(elapsedTime * 0.3) * 0.1;
        gameState.lobbyCharacter.position.y = Math.sin(elapsedTime * 2) * 0.03;
    }
    
    if (gameState.lobbyParticles) {
        gameState.lobbyParticles.rotation.y += 0.001;
    }
    
    // Камера плавно движется
    camera.position.x = 4 + Math.sin(elapsedTime * 0.2) * 0.5;
    camera.lookAt(0, 1.5, 0);
}

function updateGame() {
    if (!gameState.localPlayer) return;
    
    // Обновление физики игрока
    updatePlayerPhysics();
    
    // Обновление врагов (ИИ)
    updateEnemies();
    
    // Обновление пуль
    updateBullets();
    
    // Обновление гранат
    updateGrenades();
    
    // Обновление декалей
    updateDecals();
    
    // Обновление эффектов
    updateEffects();
    
    // Проверка условий победы/поражения
    checkGameConditions();
    
    // Обновление UI
    updateHUD();
}

function updateSpectator() {
    // Следим за выбранным игроком
    if (gameState.spectateTarget) {
        camera.position.copy(gameState.spectateTarget.position).add(new THREE.Vector3(0, 2, 5));
        camera.lookAt(gameState.spectateTarget.position.clone().add(new THREE.Vector3(0, 1, 0)));
    }
}

// ===================================================================
// ЧАСТЬ 10: УПРАВЛЕНИЕ ИГРОКОМ
// ===================================================================

function initControls() {
    // Клавиатура
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        // Предотвращаем скролл
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
        
        // Действия
        if (e.code === 'KeyR') reload();
        if (e.code === 'KeyG') throwGrenade();
        if (e.code === 'KeyE') useAction();
        if (e.code === 'KeyF') inspectWeapon();
        if (e.code === 'KeyQ') switchToPreviousWeapon();
        if (e.code === 'Digit1') switchWeapon(0);
        if (e.code === 'Digit2') switchWeapon(1);
        if (e.code === 'Digit3') switchWeapon(2);
        if (e.code === 'KeyB') openBuyMenu();
        if (e.code === 'KeyM') toggleMap();
        if (e.code === 'Tab') { e.preventDefault(); showScoreboard(true); }
        if (e.code === 'Escape') togglePause();
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            gameState.sprinting = false;
        }
        if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
            gameState.crouching = false;
        }
        if (e.code === 'Tab') {
            e.preventDefault();
            showScoreboard(false);
        }
    });
    
    // Мышь
    window.addEventListener('mousemove', (e) => {
        if (!isPointerLocked || gameState.mode !== 'playing') return;
        
        mouse.x += e.movementX * GAME_CONFIG.mouseSensitivity;
        mouse.y += e.movementY * GAME_CONFIG.mouseSensitivity;
        
        // Ограничение вертикального поворота
        mouse.y = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, mouse.y));
    });
    
    window.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            mouse.left = true;
            startShooting();
        }
        if (e.button === 2) {
            mouse.right = true;
            startAiming();
        }
    });
    
    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            mouse.left = false;
            stopShooting();
        }
        if (e.button === 2) {
            mouse.right = false;
            stopAiming();
        }
    });
    
    // Контекстное меню
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Pointer Lock
    renderer.domElement.addEventListener('click', () => {
        if (gameState.mode === 'playing') {
            renderer.domElement.requestPointerLock();
        }
    });
    
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === renderer.domElement;
    });
    
    console.log('🎮 Управление инициализировано');
}

function updatePlayerPhysics() {
    const player = gameState.localPlayer;
    if (!player || player.userData.health <= 0) return;
    
    // Поворот камеры
    if (isPointerLocked) {
        player.rotation.y = -mouse.x;
        camera.rotation.x = -mouse.y;
    }
    
    // Определение скорости
    let speed = GAME_CONFIG.playerSpeed;
    if (keys['ShiftLeft'] || keys['ShiftRight']) {
        speed *= GAME_CONFIG.sprintMultiplier;
        gameState.sprinting = true;
    } else {
        gameState.sprinting = false;
    }
    
    // Приседание
    if (keys['ControlLeft'] || keys['ControlRight']) {
        gameState.crouching = true;
        player.userData.height = GAME_CONFIG.crouchHeight;
        speed *= 0.5;
    } else {
        gameState.crouching = false;
        player.userData.height = GAME_CONFIG.standHeight;
    }
    
    // Вектор движения
    const moveX = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
    const moveZ = (keys['KeyS'] ? 1 : 0) - (keys['KeyW'] ? 1 : 0);
    
    if (moveX !== 0 || moveZ !== 0) {
        const angle = player.rotation.y;
        const newX = player.position.x + (moveX * Math.cos(angle) + moveZ * Math.sin(angle)) * speed;
        const newZ = player.position.z + (moveX * Math.sin(angle) - moveZ * Math.cos(angle)) * speed;
        
        // Проверка коллизий
        if (!checkCollision(newX, player.position.y, newZ)) {
            player.position.x = newX;
            player.position.z = newZ;
        }
        
        // Анимация ходьбы
        animateWalk();
    }
    
    // Прыжок
    if (keys['Space'] && player.userData.isGrounded) {
        player.userData.velocityY = 0.15;
        player.userData.isGrounded = false;
        playSound('jump');
    }
    
    // Гравитация
    player.userData.velocityY -= 0.008;
    player.position.y += player.userData.velocityY;
    
    // Проверка земли
    if (player.position.y <= 0) {
        player.position.y = 0;
        player.userData.velocityY = 0;
        player.userData.isGrounded = true;
    }
    
    // Обновление позиции камеры
    camera.position.copy(player.position).add(new THREE.Vector3(0, player.userData.height * 0.8, 0));
}

function checkCollision(x, y, z) {
    const playerRadius = 0.4;
    
    // Проверка стен
    const walls = gameState.currentMap?.walls || [];
    for (const wall of walls) {
        // Упрощённая проверка AABB
        const minX = Math.min(wall.x1, wall.x2) * 0.05 - playerRadius;
        const maxX = Math.max(wall.x1, wall.x2) * 0.05 + playerRadius;
        const minZ = Math.min(wall.y1, wall.y2) * 0.05 - playerRadius;
        const maxZ = Math.max(wall.y1, wall.y2) * 0.05 + playerRadius;
        
        if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
            return true;
        }
    }
    
    return false;
}

function animateWalk() {
    const player = gameState.localPlayer;
    if (!player) return;
    
    const weapon = player.userData.weapon;
    if (!weapon) return;
    
    // Покачивание оружия при ходьбе
    const bobAmount = gameState.sprinting ? 0.05 : 0.03;
    const bobSpeed = gameState.sprinting ? 15 : 10;
    
    weapon.position.x = 0.5 + Math.sin(elapsedTime * bobSpeed) * bobAmount;
    weapon.position.y = 0.8 + Math.abs(Math.sin(elapsedTime * bobSpeed)) * bobAmount * 0.5;
}

// ===================================================================
// ЧАСТЬ 11: СТРЕЛЬБА И БОЕВАЯ СИСТЕМА
// ===================================================================

let shootInterval = null;
let currentWeapon = {
    type: 'ak47',
    ammo: 30,
    maxAmmo: 90,
    damage: 36,
    fireRate: 100,
    reloadTime: 2.5,
    isReloading: false
};

function startShooting() {
    if (gameState.mode !== 'playing') return;
    if (currentWeapon.isReloading) return;
    if (currentWeapon.ammo <= 0) {
        reload();
        return;
    }
    
    shoot();
    shootInterval = setInterval(() => {
        if (currentWeapon.ammo <= 0) {
            stopShooting();
            reload();
            return;
        }
        shoot();
    }, currentWeapon.fireRate);
}

function stopShooting() {
    if (shootInterval) {
        clearInterval(shootInterval);
        shootInterval = null;
    }
}

function shoot() {
    if (currentWeapon.ammo <= 0) return;
    
    currentWeapon.ammo--;
    updateAmmoDisplay();
    
    // Эффекты
    createMuzzleFlash();
    createBulletTrail();
    shakeCamera(0.03);
    playSound('shoot');
    
    // Отдача
    if (gameState.localPlayer) {
        mouse.x += (Math.random() - 0.5) * 0.01;
        mouse.y += (Math.random() - 0.5) * 0.01;
    }
    
    // Рейкаст
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    
    // Разброс
    const spread = gameState.aiming ? 0.01 : 0.03;
    direction.x += (Math.random() - 0.5) * spread;
    direction.y += (Math.random() - 0.5) * spread;
    direction.normalize();
    
    raycaster.set(camera.position, direction);
    
    // Проверка попадания
    const enemies = gameState.enemies;
    const intersects = raycaster.intersectObjects(enemies, true);
    
    if (intersects.length > 0) {
        const hit = intersects[0];
        let enemy = hit.object;
        
        while (enemy && !enemy.userData?.health) {
            enemy = enemy.parent;
        }
        
        if (enemy && enemy.userData) {
            const distance = hit.distance;
            let damage = currentWeapon.damage;
            let headshot = false;
            
            // Проверка хэдшота
            if (hit.point.y - enemy.position.y > 1.2) {
                damage *= 3.5;
                headshot = true;
            } else if (distance > 30) {
                damage *= 0.7;
            }
            
            // Учёт брони
            if (enemy.userData.armor > 0) {
                damage *= 0.5;
                enemy.userData.armor = Math.max(0, enemy.userData.armor - damage);
            }
            
            enemy.userData.health -= damage;
            
            // Эффекты
            createHitEffect(hit.point, headshot);
            showHitMarker(headshot);
            
            if (enemy.userData.health <= 0) {
                killEnemy(enemy, headshot);
            }
            
            // Отправка на сервер (мультиплеер)
            if (gameState.socket) {
                gameState.socket.emit('playerHit', {
                    targetId: enemy.userData.id,
                    damage: damage,
                    headshot: headshot
                });
            }
        }
    }
}

function reload() {
    if (currentWeapon.isReloading) return;
    if (currentWeapon.maxAmmo <= 0) return;
    
    currentWeapon.isReloading = true;
    playSound('reload');
    
    // Анимация
    const weapon = gameState.localPlayer?.userData.weapon;
    if (weapon) {
        weapon.rotation.z = 0.3;
        weapon.position.y = 0.7;
    }
    
    setTimeout(() => {
        const needed = 30 - currentWeapon.ammo;
        const reloadAmount = Math.min(needed, currentWeapon.maxAmmo);
        currentWeapon.ammo += reloadAmount;
        currentWeapon.maxAmmo -= reloadAmount;
        currentWeapon.isReloading = false;
        
        if (weapon) {
            weapon.rotation.z = 0;
            weapon.position.y = 0.8;
        }
        
        updateAmmoDisplay();
        playSound('reload_done');
    }, currentWeapon.reloadTime * 1000);
}

function killEnemy(enemy, headshot) {
    gameState.kills++;
    gameState.money += headshot ? 400 : 300;
    
    // Эффекты
    createDeathEffect(enemy.position);
    playSound(headshot ? 'headshot' : 'kill');
    
    // Удаление врага
    scene.remove(enemy);
    gameState.enemies = gameState.enemies.filter(e => e !== enemy);
    
    // Обновление UI
    updateHUD();
    addKillFeed(headshot ? '🎯 ХЭДШОТ' : '💀 УБИТ', enemy.userData.name || 'Враг');
}

// ===================================================================
// ЧАСТЬ 12: ИИ ВРАГОВ
// ===================================================================

function spawnEnemy(team = 't', position = null) {
    const enemy = createPlayer(false, team);
    
    if (position) {
        enemy.position.copy(position);
    } else {
        const spawn = team === 't' ? gameState.currentMap?.spawnT : gameState.currentMap?.spawnCT;
        if (spawn) {
            enemy.position.set(spawn.x * 0.05, 0, spawn.y * 0.05);
        }
    }
    
    enemy.userData.health = 100;
    enemy.userData.maxHealth = 100;
    enemy.userData.armor = 0;
    enemy.userData.speed = 0.05;
    enemy.userData.state = 'patrol';
    enemy.userData.name = `Bot_${Math.floor(Math.random() * 1000)}`;
    
    scene.add(enemy);
    gameState.enemies.push(enemy);
    
    return enemy;
}

function updateEnemies() {
    gameState.enemies.forEach(enemy => {
        if (enemy.userData.health <= 0) return;
        
        const player = gameState.localPlayer;
        if (!player) return;
        
        const dist = enemy.position.distanceTo(player.position);
        
        // ИИ: преследование
        if (dist < 40 && dist > 5) {
            enemy.userData.state = 'chase';
            
            const direction = new THREE.Vector3()
                .subVectors(player.position, enemy.position)
                .normalize();
            
            enemy.position.x += direction.x * enemy.userData.speed;
            enemy.position.z += direction.z * enemy.userData.speed;
            
            // Поворот к игроку
            enemy.lookAt(player.position.x, enemy.position.y, player.position.z);
        }
        
        // ИИ: атака
        if (dist < 15 && enemy.userData.attackCooldown <= 0) {
            player.userData.health -= 10;
            enemy.userData.attackCooldown = 60;
            
            if (player.userData.health <= 0) {
                playerDeath();
            }
        }
        
        if (enemy.userData.attackCooldown > 0) {
            enemy.userData.attackCooldown--;
        }
    });
}

// ===================================================================
// ЧАСТЬ 13: ЭФФЕКТЫ
// ===================================================================

function createMuzzleFlash() {
    const flash = new THREE.PointLight(0xFFAA00, 2, 5);
    flash.position.copy(camera.position).add(new THREE.Vector3(0.5, -0.2, -1));
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 50);
}

function createBulletTrail() {
    const start = camera.position.clone();
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const end = start.clone().add(direction.multiplyScalar(50));
    
    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xFFAA00 });
    const line = new THREE.Line(geometry, material);
    
    scene.add(line);
    setTimeout(() => scene.remove(line), 30);
}

function createHitEffect(position, headshot) {
    const color = headshot ? 0xff0000 : 0xff6600;
    const count = headshot ? 20 : 10;
    
    for (let i = 0; i < count; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.05 + Math.random() * 0.1),
            new THREE.MeshStandardMaterial({ color, emissive: color })
        );
        particle.position.copy(position);
        particle.position.x += (Math.random() - 0.5) * 0.5;
        particle.position.y += (Math.random() - 0.5) * 0.5;
        particle.position.z += (Math.random() - 0.5) * 0.5;
        
        scene.add(particle);
        gameState.effects = gameState.effects || [];
        gameState.effects.push({
            mesh: particle,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                Math.random() * 0.1,
                (Math.random() - 0.5) * 0.1
            ),
            life: 1.0
        });
    }
}

function createDeathEffect(position) {
    for (let i = 0; i < 30; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.08 + Math.random() * 0.15),
            new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x440000 })
        );
        particle.position.copy(position);
        particle.position.y += 1;
        
        scene.add(particle);
        gameState.effects.push({
            mesh: particle,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.15,
                Math.random() * 0.1,
                (Math.random() - 0.5) * 0.15
            ),
            life: 1.5
        });
    }
}

function updateEffects() {
    if (!gameState.effects) return;
    
    gameState.effects = gameState.effects.filter(effect => {
        effect.mesh.position.add(effect.velocity);
        effect.velocity.y -= 0.008;
        effect.life -= 0.01;
        effect.mesh.material.opacity = effect.life;
        effect.mesh.material.transparent = true;
        
        if (effect.life <= 0 || effect.mesh.position.y < 0) {
            scene.remove(effect.mesh);
            return false;
        }
        return true;
    });
}

function shakeCamera(intensity) {
    const originalPos = camera.position.clone();
    camera.position.x += (Math.random() - 0.5) * intensity;
    camera.position.y += (Math.random() - 0.5) * intensity;
    camera.position.z += (Math.random() - 0.5) * intensity;
    setTimeout(() => camera.position.copy(originalPos), 50);
}

// ===================================================================
// ЧАСТЬ 14: UI И HUD
// ===================================================================

function createUI() {
    // Контейнер HUD
    const hud = document.createElement('div');
    hud.id = 'gameHUD';
    hud.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
        font-family: 'Segoe UI', Arial, sans-serif;
    `;
    
    hud.innerHTML = `
        <!-- Верхняя панель -->
        <div style="position: absolute; top: 20px; left: 20px; color: white; text-shadow: 2px 2px 4px black;">
            <div>❤️ <span id="healthDisplay">100</span>%</div>
            <div>🛡️ <span id="armorDisplay">0</span></div>
        </div>
        
        <!-- Патроны -->
        <div style="position: absolute; bottom: 30px; right: 30px; color: white; text-shadow: 2px 2px 4px black; font-size: 24px;">
            <span id="ammoDisplay">30</span> / <span id="maxAmmoDisplay">90</span>
        </div>
        
        <!-- Деньги -->
        <div style="position: absolute; top: 20px; right: 20px; color: #2ecc71; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px black;">
            💰 $<span id="moneyDisplay">800</span>
        </div>
        
        <!-- Киллфид -->
        <div id="killFeed" style="position: absolute; top: 60px; right: 20px; color: white; text-align: right;"></div>
        
        <!-- Прицел -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
            <div id="crosshair" style="width: 6px; height: 6px; background: rgba(0,255,0,0.8); border-radius: 50%; box-shadow: 0 0 10px #00ff00;"></div>
            <div id="hitMarker" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0;"></div>
        </div>
        
        <!-- Миникарта -->
        <div id="minimap" style="position: absolute; bottom: 20px; left: 20px; width: 150px; height: 150px; background: rgba(0,0,0,0.5); border: 2px solid #ffd700; border-radius: 10px;"></div>
        
        <!-- Счёт -->
        <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); color: white; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px black;">
            <span style="color: #d37a3d;">T <span id="tScore">0</span></span> : 
            <span style="color: #4db2ff;"><span id="ctScore">0</span> CT</span>
        </div>
        
        <!-- Таймер раунда -->
        <div style="position: absolute; top: 60px; left: 50%; transform: translateX(-50%); color: #ffd700; font-size: 20px; text-shadow: 2px 2px 4px black;">
            <span id="roundTimer">01:55</span>
        </div>
    `;
    
    document.body.appendChild(hud);
    
    // Создаём мини-карту
    createMinimap();
}

function updateHUD() {
    const player = gameState.localPlayer;
    if (!player) return;
    
    document.getElementById('healthDisplay').textContent = Math.max(0, Math.floor(player.userData.health));
    document.getElementById('armorDisplay').textContent = player.userData.armor || 0;
    document.getElementById('ammoDisplay').textContent = currentWeapon.ammo;
    document.getElementById('maxAmmoDisplay').textContent = currentWeapon.maxAmmo;
    document.getElementById('moneyDisplay').textContent = gameState.money || 800;
    document.getElementById('tScore').textContent = gameState.tScore || 0;
    document.getElementById('ctScore').textContent = gameState.ctScore || 0;
}

function updateAmmoDisplay() {
    document.getElementById('ammoDisplay').textContent = currentWeapon.ammo;
    document.getElementById('maxAmmoDisplay').textContent = currentWeapon.maxAmmo;
}

function updateFPSDisplay() {
    let fpsEl = document.getElementById('fpsDisplay');
    if (!fpsEl) {
        fpsEl = document.createElement('div');
        fpsEl.id = 'fpsDisplay';
        fpsEl.style.cssText = 'position: fixed; bottom: 10px; right: 10px; color: #0f0; font-size: 12px; z-index: 1000;';
        document.body.appendChild(fpsEl);
    }
    fpsEl.textContent = fps + ' FPS';
}

function showHitMarker(headshot) {
    const marker = document.getElementById('hitMarker');
    if (!marker) return;
    
    marker.style.opacity = '1';
    marker.style.border = headshot ? '3px solid #ff0000' : '2px solid white';
    marker.style.borderRadius = '0';
    
    setTimeout(() => marker.style.opacity = '0', 100);
}

function addKillFeed(killer, victim, weapon = '🔫') {
    const feed = document.getElementById('killFeed');
    if (!feed) return;
    
    const item = document.createElement('div');
    item.textContent = `${weapon} ${killer} убил ${victim}`;
    item.style.cssText = 'margin-bottom: 5px; animation: fadeOut 3s forwards;';
    
    feed.appendChild(item);
    setTimeout(() => item.remove(), 3000);
}

function createMinimap() {
    // Заглушка для мини-карты
    const minimap = document.getElementById('minimap');
    if (!minimap) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    minimap.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    function updateMinimap() {
        ctx.clearRect(0, 0, 150, 150);
        
        // Фон
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 150, 150);
        
        // Игрок в центре
        ctx.fillStyle = '#4db2ff';
        ctx.beginPath();
        ctx.arc(75, 75, 5, 0, Math.PI * 2);
        ctx.fill();
        
        requestAnimationFrame(updateMinimap);
    }
    
    updateMinimap();
}

// ===================================================================
// ЧАСТЬ 15: ЗВУКИ (ЗАГЛУШКА)
// ===================================================================

function playSound(type) {
    // Заглушка, можно подключить Howler.js
    console.log('🔊', type);
}

// ===================================================================
// ЧАСТЬ 16: МУЛЬТИПЛЕЕР (ЗАГЛУШКА)
// ===================================================================

function connectToServer(url) {
    console.log('🌐 Подключение к серверу:', url);
    // Здесь будет WebSocket подключение
}

// ===================================================================
// ЧАСТЬ 17: ЗАПУСК ИГРЫ
// ===================================================================

async function startGame() {
    // Показываем заставку студии
    await showStudioSplash();
    
    // Показываем загрузочный экран
    await showLoadingScreen('WAREHOUSE GRID');
    
    // Инициализируем сцену
    initScene();
    initLighting();
    
    // Загружаем карту
    loadMap('warehouse');
    
    // Создаём игрока
    gameState.localPlayer = createPlayer(true, 'ct');
    gameState.localPlayer.position.set(5, 0, 5);
    scene.add(gameState.localPlayer);
    
    // Создаём врагов
    for (let i = 0; i < 5; i++) {
        spawnEnemy('t');
    }
    
    // Создаём UI
    createUI();
    
    // Инициализируем управление
    initControls();
    
    // Устанавливаем режим
    gameState.mode = 'playing';
    gameState.money = 800;
    gameState.kills = 0;
    gameState.tScore = 0;
    gameState.ctScore = 0;
    
    // Запускаем игровой цикл
    gameLoop();
    
    console.log('🎮 ИГРА ЗАПУЩЕНА!');
}

// Показываем лобби при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initScene();
    initLighting();
    showLobby();
    gameLoop();
    
    console.log('🏠 ЛОББИ ЗАГРУЖЕНО — нажмите START для игры');
});

// Экспорт функций
window.startGame = startGame;
window.showLobby = showLobby;

console.log('✅ game3d.js — Часть 2 загружена (игровой цикл, стрельба, UI)');

// game3d.js — ЧАСТЬ 3: Гранаты, физика, декали, мультиплеер, кастомизация
// Продолжение Части 2

// ===================================================================
// ЧАСТЬ 18: ГРАНАТЫ
// ===================================================================

const GRENADE_TYPES = {
    frag: { name: 'Осколочная', damage: 80, radius: 8, fuseTime: 3.0, color: 0x556633 },
    flash: { name: 'Световая', damage: 0, radius: 10, fuseTime: 2.0, color: 0xFFFFAA, blind: true },
    smoke: { name: 'Дымовая', damage: 0, radius: 6, fuseTime: 2.0, color: 0x888888, smoke: true },
    molotov: { name: 'Молотов', damage: 20, radius: 5, fuseTime: 2.0, color: 0xFF4400, fire: true }
};

let grenadeCount = {
    frag: 1,
    flash: 1,
    smoke: 1,
    molotov: 0
};

let currentGrenade = 'frag';

function throwGrenade() {
    if (grenadeCount[currentGrenade] <= 0) {
        showNotification('❌ Нет гранат', 'Купите в магазине', 'error');
        return;
    }
    
    grenadeCount[currentGrenade]--;
    
    const grenade = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshStandardMaterial({ color: GRENADE_TYPES[currentGrenade].color })
    );
    
    grenade.position.copy(camera.position);
    grenade.position.y += 0.5;
    
    const direction = new THREE.Vector3(0, 0.3, -0.7);
    direction.applyQuaternion(camera.quaternion);
    
    grenade.userData = {
        type: currentGrenade,
        velocity: direction.clone().multiplyScalar(0.3),
        timer: GRENADE_TYPES[currentGrenade].fuseTime * 60,
        fuseTime: GRENADE_TYPES[currentGrenade].fuseTime,
        config: GRENADE_TYPES[currentGrenade]
    };
    
    grenade.castShadow = true;
    scene.add(grenade);
    gameState.grenades.push(grenade);
    
    playSound('grenade_throw');
    showNotification('💣 Граната брошена!', GRENADE_TYPES[currentGrenade].name, 'info');
}

function updateGrenades() {
    gameState.grenades = gameState.grenades.filter(grenade => {
        // Гравитация
        grenade.userData.velocity.y -= 0.008;
        grenade.position.add(grenade.userData.velocity);
        
        // Отскок от земли
        if (grenade.position.y < 0.15) {
            grenade.position.y = 0.15;
            grenade.userData.velocity.y = -grenade.userData.velocity.y * 0.3;
            grenade.userData.velocity.x *= 0.8;
            grenade.userData.velocity.z *= 0.8;
        }
        
        // Таймер
        grenade.userData.timer--;
        
        // Мигание перед взрывом
        if (grenade.userData.timer < 60) {
            grenade.material.emissive = new THREE.Color(0xFF0000);
            grenade.material.emissiveIntensity = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
        }
        
        // Взрыв
        if (grenade.userData.timer <= 0) {
            explodeGrenade(grenade);
            scene.remove(grenade);
            return false;
        }
        
        return true;
    });
}

function explodeGrenade(grenade) {
    const config = grenade.userData.config;
    const position = grenade.position.clone();
    
    switch (grenade.userData.type) {
        case 'frag':
            createExplosion(position, config.damage, config.radius);
            playSound('explosion');
            break;
            
        case 'flash':
            createFlashbang(position, config.radius);
            playSound('flashbang');
            break;
            
        case 'smoke':
            createSmoke(position, config.radius);
            playSound('smoke');
            break;
            
        case 'molotov':
            createMolotov(position, config.radius);
            playSound('molotov');
            break;
    }
    
    // Урон игрокам
    const players = [gameState.localPlayer, ...gameState.enemies];
    players.forEach(player => {
        if (!player) return;
        
        const dist = player.position.distanceTo(position);
        if (dist < config.radius) {
            const damage = config.damage * (1 - dist / config.radius);
            player.userData.health -= damage;
            
            if (player === gameState.localPlayer && player.userData.health <= 0) {
                playerDeath();
            }
        }
    });
}

function createExplosion(position, damage, radius) {
    // Свет
    const light = new THREE.PointLight(0xFF4400, 3, radius * 2);
    light.position.copy(position);
    scene.add(light);
    setTimeout(() => scene.remove(light), 200);
    
    // Частицы
    for (let i = 0; i < 40; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.1 + Math.random() * 0.2),
            new THREE.MeshStandardMaterial({ color: 0xFF4400, emissive: 0xFF2200 })
        );
        particle.position.copy(position);
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            Math.random() * 0.4,
            (Math.random() - 0.5) * 0.5
        );
        
        scene.add(particle);
        gameState.effects.push({ mesh: particle, velocity, life: 1.0 });
    }
    
    // Тряска камеры
    const distToPlayer = camera.position.distanceTo(position);
    if (distToPlayer < radius * 2) {
        shakeCamera((1 - distToPlayer / (radius * 2)) * 0.2);
    }
}

function createFlashbang(position, radius) {
    const distToPlayer = camera.position.distanceTo(position);
    if (distToPlayer < radius) {
        const intensity = 1 - distToPlayer / radius;
        
        // Белый экран
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            opacity: ${intensity * 0.9};
            pointer-events: none;
            z-index: 1000;
            animation: flashFade 2s forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 2000);
        
        // Звон в ушах
        playSound('flashbang_ring');
    }
}

function createSmoke(position, radius) {
    const smokeParticles = [];
    
    for (let i = 0; i < 20; i++) {
        const smoke = new THREE.Mesh(
            new THREE.SphereGeometry(0.5 + Math.random() * 0.5),
            new THREE.MeshStandardMaterial({
                color: 0xAAAAAA,
                transparent: true,
                opacity: 0.5,
                roughness: 1
            })
        );
        
        smoke.position.copy(position);
        smoke.position.x += (Math.random() - 0.5) * radius;
        smoke.position.z += (Math.random() - 0.5) * radius;
        smoke.position.y += Math.random() * 2;
        
        scene.add(smoke);
        smokeParticles.push(smoke);
    }
    
    // Постепенное рассеивание
    let timer = 0;
    const interval = setInterval(() => {
        timer++;
        smokeParticles.forEach(s => {
            s.scale.multiplyScalar(1.02);
            s.material.opacity *= 0.98;
        });
        
        if (timer > 300) {
            clearInterval(interval);
            smokeParticles.forEach(s => scene.remove(s));
        }
    }, 50);
}

function createMolotov(position, radius) {
    const fires = [];
    
    for (let i = 0; i < 15; i++) {
        const fire = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 0.6, 6),
            new THREE.MeshStandardMaterial({ color: 0xFF6600, emissive: 0xFF3300 })
        );
        
        fire.position.copy(position);
        fire.position.x += (Math.random() - 0.5) * radius;
        fire.position.z += (Math.random() - 0.5) * radius;
        fire.position.y = 0.15;
        
        scene.add(fire);
        fires.push({ mesh: fire, life: 420 });
    }
    
    // Урон от огня
    const burnInterval = setInterval(() => {
        fires.forEach(f => {
            f.life--;
            
            const players = [gameState.localPlayer, ...gameState.enemies];
            players.forEach(player => {
                if (!player) return;
                
                const dist = player.position.distanceTo(f.mesh.position);
                if (dist < 1.5) {
                    player.userData.health -= 5;
                }
            });
        });
        
        const allDead = fires.every(f => f.life <= 0);
        if (allDead) {
            clearInterval(burnInterval);
            fires.forEach(f => scene.remove(f.mesh));
        }
    }, 200);
}

// ===================================================================
// ЧАСТЬ 19: ДЕКАЛИ (СЛЕДЫ ОТ ПУЛЬ, КРОВЬ)
// ===================================================================

function createDecal(position, normal, type = 'bullet') {
    const size = type === 'bullet' ? 0.15 : 0.4;
    const color = type === 'bullet' ? 0x333333 : 0x8B0000;
    
    const decal = new THREE.Mesh(
        new THREE.CircleGeometry(size, 6),
        new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            depthWrite: false
        })
    );
    
    decal.position.copy(position);
    decal.position.add(normal.clone().multiplyScalar(0.05));
    decal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    
    scene.add(decal);
    gameState.decals.push({ mesh: decal, life: 600 });
}

function updateDecals() {
    gameState.decals = gameState.decals.filter(decal => {
        decal.life--;
        decal.mesh.material.opacity = decal.life / 600 * 0.8;
        
        if (decal.life <= 0) {
            scene.remove(decal.mesh);
            return false;
        }
        return true;
    });
}

// ===================================================================
// ЧАСТЬ 20: МУЛЬТИПЛЕЕР (WEBSOCKET)
// ===================================================================

let socket = null;
let playerId = null;
let remotePlayers = new Map();

function connectToMultiplayer(serverUrl = 'ws://localhost:8081') {
    socket = new WebSocket(serverUrl);
    
    socket.onopen = () => {
        console.log('🌐 Подключено к серверу');
        showNotification('🌐 МУЛЬТИПЛЕЕР', 'Подключено к серверу', 'success');
        
        // Отправляем данные игрока
        const playerData = {
            name: localStorage.getItem('player_name') || 'Player',
            avatar: localStorage.getItem('player_avatar') || '👤',
            rank: localStorage.getItem('player_rank') || 'SILVER I',
            level: parseInt(localStorage.getItem('player_level') || '1')
        };
        
        socket.send(JSON.stringify({
            type: 'join',
            data: playerData
        }));
    };
    
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleMultiplayerMessage(message);
    };
    
    socket.onclose = () => {
        console.log('🔌 Отключено от сервера');
        showNotification('🔌 МУЛЬТИПЛЕЕР', 'Соединение потеряно', 'warning');
        
        // Пробуем переподключиться через 3 секунды
        setTimeout(() => {
            if (gameState.mode === 'playing') {
                connectToMultiplayer(serverUrl);
            }
        }, 3000);
    };
    
    socket.onerror = (error) => {
        console.error('❌ Ошибка WebSocket:', error);
    };
    
    gameState.socket = socket;
}

function handleMultiplayerMessage(message) {
    switch (message.type) {
        case 'welcome':
            playerId = message.playerId;
            console.log('👤 Мой ID:', playerId);
            
            // Загружаем существующих игроков
            message.players?.forEach(player => {
                if (player.id !== playerId) {
                    spawnRemotePlayer(player);
                }
            });
            break;
            
        case 'playerJoined':
            showNotification('👋 Игрок присоединился', message.data.name, 'info');
            spawnRemotePlayer(message.data);
            break;
            
        case 'playerLeft':
            showNotification('👋 Игрок вышел', message.data.name, 'info');
            removeRemotePlayer(message.playerId);
            break;
            
        case 'playerMoved':
            updateRemotePlayerPosition(message.playerId, message.position, message.rotation);
            break;
            
        case 'playerShot':
            showRemotePlayerShoot(message.playerId);
            break;
            
        case 'playerHit':
            if (message.targetId === playerId) {
                gameState.localPlayer.userData.health -= message.damage;
                showHitMarker(message.headshot);
                if (gameState.localPlayer.userData.health <= 0) {
                    playerDeath();
                }
            }
            break;
            
        case 'playerDied':
            addKillFeed(message.killerName, message.victimName);
            if (message.victimId === playerId) {
                playerDeath();
            }
            break;
            
        case 'chatMessage':
            addChatMessage(message.playerName, message.text);
            break;
            
        case 'bombPlanted':
            showNotification('💣 БОМБА ЗАЛОЖЕНА', `Точка ${message.site}`, 'warning');
            playSound('bomb_plant');
            break;
            
        case 'bombDefused':
            showNotification('✅ БОМБА ОБЕЗВРЕЖЕНА', '', 'success');
            playSound('bomb_defuse');
            break;
            
        case 'roundStart':
            resetRound();
            break;
            
        case 'roundEnd':
            endRound(message.winner);
            break;
            
        case 'matchEnd':
            endMatch(message.winner, message.score);
            break;
    }
}

function spawnRemotePlayer(data) {
    const player = createPlayer(false, data.team || 't');
    player.position.set(data.position.x, data.position.y, data.position.z);
    player.userData.id = data.id;
    player.userData.name = data.name;
    player.userData.health = data.health || 100;
    
    scene.add(player);
    remotePlayers.set(data.id, player);
}

function removeRemotePlayer(id) {
    const player = remotePlayers.get(id);
    if (player) {
        scene.remove(player);
        remotePlayers.delete(id);
    }
}

function updateRemotePlayerPosition(id, position, rotation) {
    const player = remotePlayers.get(id);
    if (player) {
        // Плавное движение
        player.position.lerp(new THREE.Vector3(position.x, position.y, position.z), 0.3);
        player.rotation.y = rotation.y;
    }
}

function showRemotePlayerShoot(id) {
    const player = remotePlayers.get(id);
    if (player) {
        createMuzzleFlashAt(player.position.clone().add(new THREE.Vector3(0.5, 1, 0.5)));
    }
}

function sendPlayerPosition() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!gameState.localPlayer) return;
    
    socket.send(JSON.stringify({
        type: 'playerMove',
        position: {
            x: gameState.localPlayer.position.x,
            y: gameState.localPlayer.position.y,
            z: gameState.localPlayer.position.z
        },
        rotation: {
            y: gameState.localPlayer.rotation.y
        }
    }));
}

function sendChatMessage(text) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    
    socket.send(JSON.stringify({
        type: 'chatMessage',
        text: text.substring(0, 200)
    }));
}

function addChatMessage(name, text) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    
    const msg = document.createElement('div');
    msg.style.cssText = 'padding: 5px; border-bottom: 1px solid #333;';
    msg.innerHTML = `<span style="color: #ffd700;">${name}:</span> <span style="color: #ccc;">${text}</span>`;
    
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Автоудаление старых сообщений
    if (chatBox.children.length > 50) {
        chatBox.removeChild(chatBox.children[0]);
    }
}

// ===================================================================
// ЧАСТЬ 21: КАСТОМИЗАЦИЯ И НАСТРОЙКИ
// ===================================================================

const GAME_SETTINGS = {
    graphics: {
        quality: localStorage.getItem('gfx_quality') || 'high',
        shadows: localStorage.getItem('gfx_shadows') !== 'false',
        particles: localStorage.getItem('gfx_particles') !== 'false',
        antialiasing: localStorage.getItem('gfx_aa') !== 'false',
        fps: parseInt(localStorage.getItem('gfx_fps') || '60')
    },
    audio: {
        master: parseFloat(localStorage.getItem('audio_master') || '0.8'),
        sfx: parseFloat(localStorage.getItem('audio_sfx') || '0.8'),
        music: parseFloat(localStorage.getItem('audio_music') || '0.5'),
        voice: parseFloat(localStorage.getItem('audio_voice') || '0.7')
    },
    controls: {
        sensitivity: parseFloat(localStorage.getItem('ctrl_sens') || '1.0'),
        invertY: localStorage.getItem('ctrl_invert') === 'true',
        autoReload: localStorage.getItem('ctrl_autoreload') !== 'false'
    },
    crosshair: {
        type: localStorage.getItem('crosshair_type') || 'default',
        color: localStorage.getItem('crosshair_color') || '#00ff00',
        size: parseInt(localStorage.getItem('crosshair_size') || '6'),
        outline: localStorage.getItem('crosshair_outline') === 'true'
    }
};

function applySettings() {
    // Графика
    GAME_CONFIG.shadows = GAME_SETTINGS.graphics.shadows;
    GAME_CONFIG.antialias = GAME_SETTINGS.graphics.antialiasing;
    GAME_CONFIG.particles = GAME_SETTINGS.graphics.particles;
    
    if (renderer) {
        renderer.shadowMap.enabled = GAME_SETTINGS.graphics.shadows;
    }
    
    // Управление
    GAME_CONFIG.mouseSensitivity = 0.002 * GAME_SETTINGS.controls.sensitivity;
    
    // Прицел
    updateCrosshair();
}

function updateCrosshair() {
    const crosshair = document.getElementById('crosshair');
    if (!crosshair) return;
    
    const settings = GAME_SETTINGS.crosshair;
    
    switch (settings.type) {
        case 'dot':
            crosshair.style.width = settings.size + 'px';
            crosshair.style.height = settings.size + 'px';
            crosshair.style.borderRadius = '50%';
            crosshair.style.background = settings.color;
            crosshair.style.boxShadow = settings.outline ? '0 0 5px black' : 'none';
            break;
            
        case 'cross':
            crosshair.innerHTML = `
                <div style="position: absolute; width: ${settings.size * 2}px; height: 2px; background: ${settings.color}; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
                <div style="position: absolute; width: 2px; height: ${settings.size * 2}px; background: ${settings.color}; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
            `;
            break;
            
        case 'circle':
            crosshair.style.width = settings.size + 'px';
            crosshair.style.height = settings.size + 'px';
            crosshair.style.borderRadius = '50%';
            crosshair.style.background = 'transparent';
            crosshair.style.border = `2px solid ${settings.color}`;
            break;
            
        default:
            crosshair.style.width = settings.size + 'px';
            crosshair.style.height = settings.size + 'px';
            crosshair.style.borderRadius = '0';
            crosshair.style.background = 'transparent';
            crosshair.style.border = `1px solid ${settings.color}`;
    }
}

function openSettings() {
    // Создаём модальное окно настроек
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 2px solid #ffd700;
        border-radius: 20px;
        padding: 25px;
        z-index: 10000;
        color: white;
    `;
    
    modal.innerHTML = `
        <h2 style="color: #ffd700; margin-bottom: 20px;">⚙️ НАСТРОЙКИ</h2>
        
        <h3 style="color: #ffd700; margin: 15px 0;">🎨 ГРАФИКА</h3>
        <label>Качество: 
            <select id="gfx_quality">
                <option value="low" ${GAME_SETTINGS.graphics.quality === 'low' ? 'selected' : ''}>Низкое</option>
                <option value="medium" ${GAME_SETTINGS.graphics.quality === 'medium' ? 'selected' : ''}>Среднее</option>
                <option value="high" ${GAME_SETTINGS.graphics.quality === 'high' ? 'selected' : ''}>Высокое</option>
            </select>
        </label><br>
        <label><input type="checkbox" id="gfx_shadows" ${GAME_SETTINGS.graphics.shadows ? 'checked' : ''}> Тени</label><br>
        <label><input type="checkbox" id="gfx_particles" ${GAME_SETTINGS.graphics.particles ? 'checked' : ''}> Частицы</label><br>
        
        <h3 style="color: #ffd700; margin: 15px 0;">🔊 ЗВУК</h3>
        <label>Громкость: <input type="range" id="audio_master" min="0" max="1" step="0.1" value="${GAME_SETTINGS.audio.master}"></label><br>
        <label>Эффекты: <input type="range" id="audio_sfx" min="0" max="1" step="0.1" value="${GAME_SETTINGS.audio.sfx}"></label><br>
        
        <h3 style="color: #ffd700; margin: 15px 0;">🎮 УПРАВЛЕНИЕ</h3>
        <label>Чувствительность: <input type="range" id="ctrl_sens" min="0.5" max="2" step="0.1" value="${GAME_SETTINGS.controls.sensitivity}"></label><br>
        
        <h3 style="color: #ffd700; margin: 15px 0;">🎯 ПРИЦЕЛ</h3>
        <label>Тип:
            <select id="crosshair_type">
                <option value="default" ${GAME_SETTINGS.crosshair.type === 'default' ? 'selected' : ''}>Стандартный</option>
                <option value="dot" ${GAME_SETTINGS.crosshair.type === 'dot' ? 'selected' : ''}>Точка</option>
                <option value="cross" ${GAME_SETTINGS.crosshair.type === 'cross' ? 'selected' : ''}>Крест</option>
                <option value="circle" ${GAME_SETTINGS.crosshair.type === 'circle' ? 'selected' : ''}>Круг</option>
            </select>
        </label><br>
        <label>Цвет: <input type="color" id="crosshair_color" value="${GAME_SETTINGS.crosshair.color}"></label><br>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button onclick="saveSettings()" style="flex: 1; padding: 12px; background: #2ecc71; border: none; border-radius: 10px; color: white; font-weight: bold;">СОХРАНИТЬ</button>
            <button onclick="this.closest('div').remove()" style="flex: 1; padding: 12px; background: #e74c3c; border: none; border-radius: 10px; color: white; font-weight: bold;">ОТМЕНА</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function saveSettings() {
    GAME_SETTINGS.graphics.quality = document.getElementById('gfx_quality').value;
    GAME_SETTINGS.graphics.shadows = document.getElementById('gfx_shadows').checked;
    GAME_SETTINGS.graphics.particles = document.getElementById('gfx_particles').checked;
    GAME_SETTINGS.audio.master = parseFloat(document.getElementById('audio_master').value);
    GAME_SETTINGS.audio.sfx = parseFloat(document.getElementById('audio_sfx').value);
    GAME_SETTINGS.controls.sensitivity = parseFloat(document.getElementById('ctrl_sens').value);
    GAME_SETTINGS.crosshair.type = document.getElementById('crosshair_type').value;
    GAME_SETTINGS.crosshair.color = document.getElementById('crosshair_color').value;
    
    // Сохраняем в localStorage
    Object.entries(GAME_SETTINGS).forEach(([category, settings]) => {
        Object.entries(settings).forEach(([key, value]) => {
            localStorage.setItem(`${category}_${key}`, value);
        });
    });
    
    applySettings();
    document.querySelector('.modal')?.remove();
    showNotification('✅ НАСТРОЙКИ', 'Сохранены!', 'success');
}

// ===================================================================
// ЧАСТЬ 22: ЗАВЕРШЕНИЕ ИГРЫ
// ===================================================================

function playerDeath() {
    gameState.alive = false;
    
    showNotification('💀 ВЫ ПОГИБЛИ', '', 'error');
    playSound('death');
    
    // Переключение в режим наблюдателя
    gameState.mode = 'spectating';
    
    // Выбираем случайного игрока для наблюдения
    if (remotePlayers.size > 0) {
        gameState.spectateTarget = Array.from(remotePlayers.values())[0];
    }
    
    // Показываем экран смерти
    setTimeout(() => {
        if (gameState.mode === 'spectating') {
            showDeathScreen();
        }
    }, 2000);
}

function showDeathScreen() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 500;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
    `;
    
    overlay.innerHTML = `
        <div style="font-size: 60px; margin-bottom: 20px;">💀</div>
        <h2>ВЫ ПОГИБЛИ</h2>
        <p>Убийств: ${gameState.kills}</p>
        <div style="display: flex; gap: 10px; margin-top: 30px;">
            <button onclick="switchSpectateTarget(-1)">◀ ПРЕД.</button>
            <button onclick="switchSpectateTarget(1)">СЛЕД. ▶</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    gameState.deathScreen = overlay;
}

function switchSpectateTarget(direction) {
    const players = Array.from(remotePlayers.values());
    if (players.length === 0) return;
    
    let currentIndex = players.indexOf(gameState.spectateTarget);
    currentIndex = (currentIndex + direction + players.length) % players.length;
    gameState.spectateTarget = players[currentIndex];
}

function resetRound() {
    gameState.localPlayer.userData.health = 100;
    gameState.localPlayer.userData.armor = 0;
    gameState.alive = true;
    gameState.mode = 'playing';
    
    if (gameState.deathScreen) {
        gameState.deathScreen.remove();
    }
    
    // Возвращаем на спавн
    const spawn = gameState.currentMap?.spawnCT;
    if (spawn) {
        gameState.localPlayer.position.set(spawn.x * 0.05, 0, spawn.y * 0.05);
    }
}

function endRound(winner) {
    const won = (winner === 'ct' && gameState.localPlayer?.userData.team === 'ct') ||
                (winner === 't' && gameState.localPlayer?.userData.team === 't');
    
    showNotification(
        won ? '🏆 РАУНД ВЫИГРАН!' : '💀 РАУНД ПРОИГРАН',
        '',
        won ? 'success' : 'error'
    );
    
    if (won) {
        gameState.ctScore++;
        gameState.money += 3250;
    } else {
        gameState.tScore++;
        gameState.money += 1400;
    }
    
    updateHUD();
}

function endMatch(winner, score) {
    const won = (winner === 'ct' && gameState.localPlayer?.userData.team === 'ct') ||
                (winner === 't' && gameState.localPlayer?.userData.team === 't');
    
    showNotification(
        won ? '🏆 МАТЧ ВЫИГРАН!' : '💀 МАТЧ ПРОИГРАН',
        `Счёт: ${score.ct} : ${score.t}`,
        won ? 'success' : 'error'
    );
    
    setTimeout(() => {
        showLobby();
    }, 5000);
}

// ===================================================================
// ЭКСПОРТ ДОПОЛНИТЕЛЬНЫХ ФУНКЦИЙ
// ===================================================================

window.throwGrenade = throwGrenade;
window.switchGrenade = (type) => { currentGrenade = type; };
window.connectToMultiplayer = connectToMultiplayer;
window.sendChatMessage = sendChatMessage;
window.openSettings = openSettings;
window.saveSettings = saveSettings;
window.switchSpectateTarget = switchSpectateTarget;

console.log('✅ game3d.js — Часть 3 загружена (гранаты, мультиплеер, настройки)');
console.log('🎮 ПОЛНЫЙ 3D-ДВИЖОК ГОТОВ К РАБОТЕ!');