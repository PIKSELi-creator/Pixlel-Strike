// mapselect.js — Выбор карты
const maps = [
  { id: "dust", name: "DUST2_FAN", desc: "Classic. Bomb sites A/B" },
  { id: "mirage", name: "MIRAGE_CS", desc: "Night Edition. Mid control" },
  { id: "inferno", name: "INFERNO_VALVE", desc: "Blaze. Banana fight" },
  { id: "nuke", name: "NUKE_DEEP", desc: "Underground. Secret tunnels" },
  { id: "pizza", name: "PIZZA_HQ", desc: "Fun mode. Gabe's pizza party" }
];

function renderMapSelect() {
  let html = `<div class="screen-content">
    <h2>ВЫБОР КАРТЫ</h2>
    <button onclick="backToMenu()" style="position:absolute;top:20px;right:20px;">НАЗАД</button>
    <div class="map-grid">`;
  
  maps.forEach(map => {
    html += `
      <div class="map-card" onclick="selectMap('${map.id}')">
        <h3>${map.name}</h3>
        <p>${map.desc}</p>
      </div>`;
  });
  
  html += `</div></div>`;
  document.getElementById('mapSelectScreen').innerHTML = html;
  document.getElementById('mapSelectScreen').classList.remove('hidden');
}

function selectMap(mapId) {
  alert(`🎮 Карта выбрана: ${mapId.toUpperCase()}!\nМатч запускается...`);
  document.getElementById('mapSelectScreen').classList.add('hidden');
  if (typeof initGame === 'function') initGame(); // из game.js
}

window.renderMapSelect = renderMapSelect;