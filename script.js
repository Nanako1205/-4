// Leaflet の地図を初期化
const map = L.map("map").setView([33.5597, 133.5311], 9);

// タイルレイヤー（OpenStreetMap）
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// 動作確認
console.log("地図OK");


// ------------------------------
// 神社データ
// ------------------------------
const shrines = [
  {
    name: "土佐神社",
    lat: 33.5753,
    lng: 133.5698,
    type: "通常御朱印",
    memo: "高知を代表する古社"
  },
  {
    name: "潮江天満宮",
    lat: 33.5591,
    lng: 133.5317,
    type: "学業御朱印",
    memo: "学問の神様"
  }
];

// ------------------------------
// 地図の初期化
// ------------------------------
const map = L.map("map").setView([33.5597, 133.5311], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// ------------------------------
// カードの要素取得
// ------------------------------
const card = document.getElementById("card");
const shrineName = document.getElementById("shrine-name");
const goshuinType = document.getElementById("goshuin-type");
const memo = document.getElementById("memo");
const visitedBtn = document.getElementById("visited-btn");

// ------------------------------
// ピンを立てる
// ------------------------------
shrines.forEach((shrine) => {
  const marker = L.marker([shrine.lat, shrine.lng]).addTo(map);

  marker.on("click", () => {
    showShrineCard(shrine);
  });
});

// ------------------------------
// カードを表示する関数
// ------------------------------
function showShrineCard(shrine) {
  shrineName.textContent = shrine.name;
  goshuinType.textContent = `御朱印：${shrine.type}`;
  memo.textContent = shrine.memo;

  // 参拝済みチェック
  const visited = localStorage.getItem(shrine.name);
  visitedBtn.textContent = visited ? "参拝済み ✔" : "参拝済みにする";

  // ボタンに神社名を記録
  visitedBtn.dataset.shrine = shrine.name;

  card.classList.remove("hidden");
}

// ------------------------------
// 参拝済みボタン
// ------------------------------
visitedBtn.addEventListener("click", () => {
  const name = visitedBtn.dataset.shrine;

  // localStorage に保存
  localStorage.setItem(name, "visited");

  // ボタンの表示変更
  visitedBtn.textContent = "参拝済み ✔";
});
