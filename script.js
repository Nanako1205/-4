// script.js（強化版）
// 住所 -> Nominatimで緯度経度に変換（1.5秒間隔、Koichi県に範囲限定） -> ピン追加 -> localStorageキャッシュ
// 依存: index.htmlで Leaflet (leaflet.css / leaflet.js) を先に読み込むこと

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof L === "undefined") {
    alert("Leafletが読み込めていません。leaflet.js の読み込み順を確認してください。");
    return;
  }

  // --- 地図初期化（高知中心） ---
  const center = [33.5597, 133.5311];
  const map = L.map("map").setView(center, 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // --- カードUI参照 ---
  const card = document.getElementById("card");
  const nameEl = document.getElementById("shrine-name");
  const typeEl = document.getElementById("goshuin-type");
  const memoEl = document.getElementById("memo");
  const visitedBtn = document.getElementById("visited-btn");

  // --- 表示対象（必要に応じて追加・編集OK） ---
  // 住所に「付近」「（…）」が含まれていてもOK（後段でクレンジングします）
  const spots = [
    { id: "tosajinja",         name: "土佐神社",                 address: "高知県高知市一宮しなね2-16-1" },
    { id: "watatsumi",         name: "海津見神社（龍王宮）",     address: "高知県高知市浦戸宇城山831" },
    { id: "chikurinji",        name: "竹林寺",                   address: "高知県高知市五台山3577" },
    { id: "wakamiya",          name: "若宮八幡宮",               address: "高知県高知市長浜6600" },
    { id: "zenrakuji",         name: "善楽寺",                   address: "高知県高知市一宮しなね2丁目23-11" },
