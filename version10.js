// version10.js — PIXEL STRIKE 10.0 (ГЛАВНЫЙ ФАЙЛ)

const VERSION_10 = {
    version: '10.0.0',
    codename: 'LEGENDARY',
    releaseDate: '2026-04-12',
    
    features: [
        '🎮 25+ нового оружия',
        '🗺️ 5 новых карт',
        '🏆 Система престижа (10 уровней)',
        '🎨 100+ новых скинов',
        '🔊 Полный саундтрек',
        '📱 PWA установка',
        '🌐 Глобальные сервера',
        '👥 Клановая система',
        '🏅 Сезонный рейтинг',
        '💎 Мифические предметы'
    ],
    
    patchNotes: `
        ╔══════════════════════════════════════════════════════════╗
        ║              PIXEL STRIKE 10.0 — LEGENDARY               ║
        ╠══════════════════════════════════════════════════════════╣
        ║                                                          ║
        ║  🔫 НОВОЕ ОРУЖИЕ:                                        ║
        ║     • Golden Desert Eagle (Легендарный)                  ║
        ║     • AWP Dragon Lore (Мифический)                       ║
        ║     • M134 Minigun                                       ║
        ║     • RPG-7 (Взрывное)                                  ║
        ║     • EMP и Газовые гранаты                             ║
        ║                                                          ║
        ║  🗺️ НОВЫЕ КАРТЫ:                                        ║
        ║     • Кибер-город (Cyber City)                          ║
        ║     • Ледяная крепость (Ice Fortress)                   ║
        ║     • Неоновый Токио (Neon Tokyo)                       ║
        ║     • Заброшенный бункер (Abandoned Bunker)             ║
        ║     • Космическая станция (Space Station)               ║
        ║                                                          ║
        ║  🏆 СИСТЕМА ПРЕСТИЖА:                                   ║
        ║     • 10 уровней престижа                               ║
        ║     • Уникальные награды                                ║
        ║     • Эксклюзивные скины и ножи                         ║
        ║                                                          ║
        ║  🎨 НОВЫЕ СКИНЫ:                                        ║
        ║     • Допплер, Градиент, Паутина                        ║
        ║     • StatTrak™ технология                              ║
        ║     • 5 уровней качества                                ║
        ║                                                          ║
        ║  👥 КЛАНЫ:                                              ║
        ║     • Создание клана (5000 PIX)                         ║
        ║     • Клановые войны                                    ║
        ║     • Общий банк и награды                              ║
        ║                                                          ║
        ║  🏅 СЕЗОННЫЙ РЕЙТИНГ:                                   ║
        ║     • 3-месячные сезоны                                 ║
        ║     • Топ-100 игроков                                   ║
        ║     • Эксклюзивные награды                              ║
        ║                                                          ║
        ╚══════════════════════════════════════════════════════════╝
    `
};

function showVersion10Welcome() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); z-index: 100000;
        display: flex; align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e, #0a0a0f); 
                    border: 3px solid #FFD700; border-radius: 30px; 
                    padding: 30px; max-width: 500px; text-align: center;
                    animation: versionReveal 1s ease-out;">
            <div style="font-size: 60px; margin-bottom: 20px;">🎮🔥</div>
            <h1 style="color: #FFD700; font-size: 48px; margin-bottom: 10px;">PIXEL STRIKE</h1>
            <h2 style="color: #FF4500; font-size: 36px; margin-bottom: 20px;">10.0 LEGENDARY</h2>
            <p style="color: #ccc; margin-bottom: 30px;">${VERSION_10.features.slice(0, 5).join(' • ')}</p>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="padding: 15px 40px; background: #FFD700; border: none; 
                           border-radius: 15px; color: black; font-weight: bold; 
                           font-size: 18px; cursor: pointer;">
                🎮 ИГРАТЬ
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    playSound('victory');
    createConfetti(100);
}

// Показать приветствие при загрузке
document.addEventListener('DOMContentLoaded', () => {
    const hasSeen = localStorage.getItem('seen_v10');
    if (!hasSeen) {
        setTimeout(showVersion10Welcome, 1000);
        localStorage.setItem('seen_v10', 'true');
    }
});

window.VERSION_10 = VERSION_10;

console.log('✅ version10.js загружен — Pixel Strike 10.0 LEGENDARY');