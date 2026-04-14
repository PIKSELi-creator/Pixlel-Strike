// models_loader.js — ЗАГРУЗЧИК 3D-МОДЕЛЕЙ PIXEL STRIKE 15.0

const MODELS = {
    weapons: {},
    players: {},
    cases: {}
};

// Загрузка модели оружия
async function loadWeaponModel(weaponId, path) {
    const loader = new THREE.GLTFLoader();
    
    return new Promise((resolve, reject) => {
        loader.load(
            path,
            (gltf) => {
                MODELS.weapons[weaponId] = gltf.scene;
                console.log(`✅ Загружена модель: ${weaponId}`);
                resolve(gltf.scene);
            },
            undefined,
            (error) => {
                console.error(`❌ Ошибка загрузки ${weaponId}:`, error);
                reject(error);
            }
        );
    });
}

// Загрузка модели игрока
async function loadPlayerModel(team, path) {
    const loader = new THREE.GLTFLoader();
    
    return new Promise((resolve, reject) => {
        loader.load(
            path,
            (gltf) => {
                MODELS.players[team] = gltf.scene;
                console.log(`✅ Загружена модель игрока: ${team}`);
                resolve(gltf.scene);
            },
            undefined,
            reject
        );
    });
}

// Загрузка модели кейса
async function loadCaseModel(caseType, path) {
    const loader = new THREE.GLTFLoader();
    
    return new Promise((resolve, reject) => {
        loader.load(
            path,
            (gltf) => {
                MODELS.cases[caseType] = gltf.scene;
                console.log(`✅ Загружена модель кейса: ${caseType}`);
                resolve(gltf.scene);
            },
            undefined,
            reject
        );
    });
}

// Предзагрузка всех моделей
async function preloadAllModels() {
    const modelsToLoad = [
        // Оружие
        { type: 'weapon', id: 'ak47', path: './models/weapons/ak47.glb' },
        { type: 'weapon', id: 'm4a4', path: './models/weapons/m4a4.glb' },
        { type: 'weapon', id: 'awp', path: './models/weapons/awp.glb' },
        { type: 'weapon', id: 'deagle', path: './models/weapons/deagle.glb' },
        { type: 'weapon', id: 'knife', path: './models/weapons/karambit.glb' },
        
        // Игроки
        { type: 'player', id: 'ct', path: './models/players/ct.glb' },
        { type: 'player', id: 't', path: './models/players/t.glb' },
        
        // Кейсы
        { type: 'case', id: 'weapon_case', path: './models/cases/weapon_case.glb' },
        { type: 'case', id: 'premium_case', path: './models/cases/premium_case.glb' },
        { type: 'case', id: 'knife_case', path: './models/cases/knife_case.glb' }
    ];
    
    showLoadingScreen('Загрузка 3D-моделей...');
    
    for (let i = 0; i < modelsToLoad.length; i++) {
        const m = modelsToLoad[i];
        updateLoadingProgress(i, modelsToLoad.length, m.id);
        
        try {
            if (m.type === 'weapon') {
                await loadWeaponModel(m.id, m.path);
            } else if (m.type === 'player') {
                await loadPlayerModel(m.id, m.path);
            } else if (m.type === 'case') {
                await loadCaseModel(m.id, m.path);
            }
        } catch (e) {
            console.warn(`⚠️ Не удалось загрузить ${m.id}, используется заглушка`);
        }
    }
    
    hideLoadingScreen();
    console.log('✅ Все модели загружены!');
}

function showLoadingScreen(text) {
    const loading = document.createElement('div');
    loading.id = 'modelLoading';
    loading.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: #0a0a0f; z-index: 100000;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        color: white;
    `;
    loading.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 30px;">${text}</div>
        <div style="width: 250px; height: 6px; background: #333; border-radius: 3px; overflow: hidden;">
            <div id="loadingProgress" style="width: 0%; height: 100%; background: #ffd700; transition: width 0.3s;"></div>
        </div>
        <div id="loadingStatus" style="margin-top: 15px; color: #888;"></div>
    `;
    document.body.appendChild(loading);
}

function updateLoadingProgress(current, total, name) {
    const progress = document.getElementById('loadingProgress');
    const status = document.getElementById('loadingStatus');
    if (progress) progress.style.width = ((current + 1) / total * 100) + '%';
    if (status) status.textContent = `Загрузка: ${name}`;
}

function hideLoadingScreen() {
    const loading = document.getElementById('modelLoading');
    if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => loading.remove(), 500);
    }
}

// Экспорт
window.MODELS = MODELS;
window.loadWeaponModel = loadWeaponModel;
window.loadPlayerModel = loadPlayerModel;
window.loadCaseModel = loadCaseModel;
window.preloadAllModels = preloadAllModels;

console.log('✅ models_loader.js загружен');