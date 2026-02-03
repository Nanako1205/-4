// script.js
document.addEventListener("DOMContentLoaded", () => {
  // 高知市周辺
  const kochiCenter = [33.5597, 133.5311];
  const map = L.map("map").setView(kochiCenter, 13);

  // タイル（OpenStreetMap）
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // 動作確認用のマーカー（あとで削除してOK）
  L.marker(kochiCenter).addTo(map).bindPopup("高知・中心あたり");
});
