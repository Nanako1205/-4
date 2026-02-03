// script.js
// 使い方：index.html と同じ階層に置く
// 依存：Leaflet (leaflet.css / leaflet.js が index.html で読み込まれていること)

(function () {
  // Leaflet が読めていない場合に早期警告
  if (typeof L === "undefined") {
    console.error(
      "[御朱印マップ] Leaflet が読み込まれていません。index.html の <script src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'> を確認してください。"
    );
    return;
  }

  // DOM 構築完了後に初期化
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // 必須DOMの参照
    const mapEl = document.getElementById("map");
    const cardEl = document.getElementById("card");
    const nameEl = document.getElementById("shrine-name");
    const typeEl = document.getElementById("goshuin-type");
    const memoEl = document.getElementById("memo");
    const visitedBtn = document.getElementById("visited-btn");

    if (!mapEl) {
      console.error("[御朱印マップ] #map 要素が見つかりません。index.html を確認してください。");
      return;
    }
    if (!cardEl || !nameEl || !typeEl || !memoEl || !visitedBtn) {
      console.warn("[御朱印マップ] カードの要素が不足しているため、カード表示をスキップします。");
    }

    // --- 地図の初期化 ---
    const kochiCenter = [33.5597, 133.5311]; // はりまや橋付近
    const map = L.map("map", {
      zoomControl: true,
      attributionControl: true,
    }).setView(kochiCenter, 13);

    // タイルレイヤ（OpenStreetMap）
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // --- データ（サンプル）---
    // ここに寺社を追加していけばOK
    const shrines = [
      {
        id: "yamanouchi",
        name: "山内神社",
        latlng: [33.5555, 133.5312],
        goshuin: "紙御朱印",
        memo: "高知城近く。落ち着く境内。",
      },
      {
        id: "ushioe-tenmangu",
        name: "潮江天満宮",
        latlng: [33.5478, 133.5446],
        goshuin: "直書き/書置きあり",
