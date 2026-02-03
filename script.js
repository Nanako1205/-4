// script.js（寺=赤／神社=緑、カード連動、参拝済み記録）

document.addEventListener("DOMContentLoaded", () => {
  if (typeof L === "undefined") {
    alert("Leafletが読み込まれていません");
    return;
  }

  // 高知市あたりを初期中心
  const map = L.map("map").setView([33.5589, 133.5311], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // 色違いアイコン（まずはCDNを使用。後でimg/に保存して相対パスに変えてもOK）
  const iconGreen = L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const iconRed = L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // 参拝済みのローカル保存
  const VISITED_KEY = "visited_shrines";
  const loadVisited = () => JSON.parse(localStorage.getItem(VISITED_KEY) || "[]");
  const saveVisited = (arr) => localStorage.setItem(VISITED_KEY, JSON.stringify(arr));
  const isVisited = (name) => loadVisited().includes(name);

  const group = L.featureGroup().addTo(map);

  // ⚠️ geocodedファイルを読む（キャッシュ無効化のためクエリ付与）
  fetch("./data/spots_geocoded.json?ts=" + Date.now(), { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then((spots) => {
      spots.forEach((s) => {
        const lat = Number(s.lat);
        const lng = Number(s.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          // ジオコーディング見つからず・エラーの行はスキップ
          return;
        }

        // 「寺」の判定（簡易）：名前に「寺」「寺院」が含まれる → 赤、それ以外は緑
        // 後で精度を上げたい場合、spots_geocoded.json に "type": "寺"/"神社" を追加して判定に使ってください。
        const isTemple = /寺|寺院/.test(s.name);
        const icon = isTemple ? iconRed : iconGreen;

        const m = L.marker([lat, lng], { icon }).addTo(group);

        // ポップアップ（神社名＋住所＋参拝メモ＋参拝済みマーク）
        const memo = s.memo ?? "";
        const visitedMark = isVisited(s.name) ? "✅参拝済み" : "未参拝";
        m.bindPopup(
          `<div>
            <strong>${s.name ?? "名称不明"}</strong><br/>
            <small>${s.address ?? ""}</small><br/>
            <em>${memo}</em><br/>
            <span>${visitedMark}</span>
          </div>`
        );

        // クリックで下部カードに反映
        m.on("click", () => {
          const card = document.getElementById("card");
          card.classList.remove("hidden");
          document.getElementById("shrine-name").textContent = s.name ?? "";
          document.getElementById("goshuin-type").textContent = isTemple ? "寺院" : "神社";
          document.getElementById("memo").textContent = memo;

          const btn = document.getElementById("visited-btn");
          btn.textContent = isVisited(s.name) ? "参拝済み ✓" : "参拝済みにする";
          btn.onclick = () => {
            const list = loadVisited();
            if (!list.includes(s.name)) list.push(s.name);
            saveVisited(list);
            btn.textContent = "参拝済み ✓";
          };
        });
      });

      // 収まりよく表示
      if (group.getLayers().length) {
        map.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    })
    .catch((err) => {
      console.error("geocodedデータ読み込みエラー:", err);
      alert("データの読み込みに失敗しました: " + err.message);
    });
});
