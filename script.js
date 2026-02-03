// script.js（最小復旧版）
document.addEventListener("DOMContentLoaded", () => {
  if (typeof L === "undefined") {
    alert("Leafletが読み込まれていません"); return;
  }
  const map = L.map("map").setView([33.5597, 133.5311], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.marker([33.5597,133.5311]).addTo(map).bindPopup("テストマーカー");
});
