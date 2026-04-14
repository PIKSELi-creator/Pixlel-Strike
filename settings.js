function openSettings() {
  document.getElementById('mainMenu').classList.add('hidden');
  const html = `
    <div class="screen-content">
      <h2>НАСТРОЙКИ</h2>
      <button onclick="backToMenu()" style="position:absolute;top:20px;right:20px;">НАЗАД</button>
      <div style="margin:40px auto; max-width:600px;">
        <label>ГРОМКОСТЬ ЗВУКА <input type="range" value="85" style="width:100%; accent-color:#ff8c00;"></label><br><br>
        <label>ЧУВСТВИТЕЛЬНОСТЬ МЫШИ <input type="range" value="70" style="width:100%; accent-color:#ff8c00;"></label><br><br>
        <label>ГРАФИКА <select style="background:#000;color:#ff8c00;border:3px solid #ff8c00;padding:10px;"><option>Valve Ultra</option><option>ПИКСЕЛЬ 4K</option></select></label>
      </div>
      <button onclick="alert('Сохранено! ПИКСЕЛЬ не потрачен 😉')">СОХРАНИТЬ</button>
    </div>`;
  document.getElementById('settingsScreen').innerHTML = html;
  document.getElementById('settingsScreen').classList.remove('hidden');
}

window.openSettings = openSettings;