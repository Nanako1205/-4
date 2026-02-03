// script.js
// 依存: Leaflet (leaflet.css / leaflet.js) が index.html で読み込まれていること
// 機能: 住所 -> Nominatimで緯度経度に変換(1.2秒間隔) -> ピン追加 -> localStorageキャッシュ

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof L === "undefined") {
    alert("Leafletが読み込めていません。leaflet.js の読み込み順を確認してください。");
    return;
  }

  // --- 地図初期化（高知市中心） ---
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

  // --- 表示対象（必要に応じてここに追加/編集OK） ---
  const spots = [
    { id: "tosajinja", name: "土佐神社", address: "高知県高知市一宮しなね2-16-1" },
    { id: "watatsumi", name: "海津見神社（龍王宮）", address: "高知県高知市浦戸宇城山831" },
    { id: "chikurinji", name: "竹林寺", address: "高知県高知市五台山3577" },
    { id: "wakamiya", name: "若宮八幡宮", address: "高知県高知市長浜6600" },
    { id: "zenrakuji", name: "善楽寺", address: "高知県高知市一宮しなね2丁目23-11" },
    { id: "kongofukuji", name: "金剛福寺", address: "高知県土佐清水市足摺岬214-1" },
    { id: "kochi-hachiman", name: "高知八幡宮", address: "高知県高知市はりまや町3丁目8-11" },
    { id: "tosa-kokubunji", name: "土佐国分寺", address: "高知県南国市国分546" },
    { id: "yamanouchi", name: "山内神社", address: "高知県高知市鷹匠町2-4-65" },
    { id: "hotsumisaki", name: "最御崎寺", address: "高知県室戸市室戸岬町4058-1" },
    { id: "kochi-daijingu", name: "高知大神宮", address: "高知県高知市帯屋町2-7-2" },
    { id: "ushioe-tenmangu", name: "潮江天満宮", address: "高知県高知市天神町19-20" },
    { id: "iwamotoji", name: "岩本寺", address: "高知県高岡郡四万十町茂串町3-13" },
    { id: "sekkeiji", name: "雪蹊寺", address: "高知県高知市長浜857-3" },
    { id: "zenjibushi", name: "禅師峰寺", address: "高知県南国市十市3084" },
    { id: "kiyotaki", name: "清瀧寺", address: "高知県土佐市高岡町丁568-1" },
    { id: "shoryuji", name: "青龍寺", address: "高知県土佐市宇佐町龍旧寺山601" },
    { id: "dainichi", name: "大日寺", address: "高知県香南市野市町母代寺476-1" },
    { id: "enkouji", name: "延光寺", address: "高知県宿毛市平田町中山390" },
    { id: "shinshoji", name: "津照寺", address: "高知県室戸市室津2652" },
    { id: "konomine", name: "神峯寺", address: "高知県安芸郡安田町唐浜2594" },
    { id: "rokujo-hachiman", name: "六條八幡宮", address: "高知県高知市春野町西分3522" },
    { id: "ichijo", name: "一條神社", address: "高知県四万十市中村本町1-3" },
    { id: "tanemaji", name: "種間寺", address: "高知県高知市春野町秋山72" },
    { id: "hata-jinja", name: "秦神社", address: "高知県高知市長浜857-イ" }
  ];

  // --- ジオコーディングキャッシュ ---
  const CACHE_KEY = "goshuin-geocoded-v1";
  const cache = loadCache();
  function loadCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
  }
  function saveCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
  }
  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  // --- Nominatim (公開API) で住所→座標 ---
  async function geocode(address) {
    if (cache[address]) return cache[address]; // [lat, lon]
    await sleep(1200); // 1件ごとに間隔（公開API配慮）
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", address);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "0");
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
    const js = await res.json();
    if (!Array.isArray(js) || js.length === 0) throw new Error("No result");
    const lat = parseFloat(js[0].lat);
    const lon = parseFloat(js[0].lon);
    cache[address] = [lat, lon];
    saveCache();
    return [lat, lon];
  }

  // --- ピン生成（順次） ---
  let done = 0;
  for (const s of spots) {
    try {
      const ll = await geocode(s.address);
      const marker = L.marker(ll).addTo(map);
      marker.bindTooltip(s.name, { direction: "top", offset: [0, -8] });

      marker.on("click", () => {
        nameEl.textContent = s.name;
        typeEl.textContent = "";        // 御朱印タイプ等は必要ならデータ追加
        memoEl.textContent = s.address; // 住所をメモ欄に表示
        card.classList.remove("hidden");
        visitedBtn.textContent = "参拝済みにする";
      });

      done++;
      // 進捗ログ（F12 → Consoleで確認）
      console.log(`ピン追加: ${s.name} (${done}/${spots.length})`);
    } catch (e) {
      console.warn("ジオコーディング失敗:", s.name, s.address, e);
    }
  }

  // 地図クリックでカードを閉じる・レイアウト補正
  map.on("click", () => card.classList.add("hidden"));
  window.addEventListener("resize", () => setTimeout(() => map.invalidateSize(), 100));

  // // 読み込み確認用のテストマーカー（必要なら有効化）
  // L.marker(center).addTo(map).bindPopup("読み込み確認用テストマーカー");
});
