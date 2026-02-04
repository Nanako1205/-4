// script.js（寺=赤／神社=緑、カード連動、参拝済み記録＋ポップアップで切替）

document.addEventListener("DOMContentLoaded", () => {
  if (typeof L === "undefined") {
    alert("Leafletが読み込まれていません");
    return;
  }

  // 高知市あたりを初期中心
  const map = L.map("map").setView([33.5589, 133.5311], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    // OSMはクレジット表記が必須
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // 色違いアイコン（寺=赤、神社=緑）
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

  // 参拝済みのローカル保存（名前ベース）
  const VISITED_KEY = "visited_shrines";
  const loadVisited = () => JSON.parse(localStorage.getItem(VISITED_KEY) || "[]");
  const saveVisited = (arr) => localStorage.setItem(VISITED_KEY, JSON.stringify(arr));
  const isVisited = (name) => loadVisited().includes(name);
  const markVisited = (name) => {
    const list = loadVisited();
    if (!list.includes(name)) {
      list.push(name);
      saveVisited(list);
    }
  };
  const unmarkVisited = (name) => {
    const list = loadVisited().filter(n => n !== name);
    saveVisited(list);
  };

  // 下部カードを現在の visited 状態に合わせて更新
  function syncCardButton(name) {
    const btn = document.getElementById("visited-btn");
    if (!btn) return;
    btn.textContent = isVisited(name) ? "参拝済み ✓" : "参拝済みにする";
  }

  // ポップアップの中身（未参拝/参拝済みのラジオ + 保存ボタン）
  function buildPopupHtml(spot, isTemple) {
    const name = spot.name ?? "名称不明";
    const address = spot.address ?? "";
    const memo = spot.memo ?? "";
    const current = isVisited(name) ? "visited" : "unvisited";
    const statusText = current === "visited" ? "✅参拝済み" : "未参拝";

    return `
      <div class="visit-popup" data-name="${name}">
        <div class="title">${name}</div>
        <small>${address}</small><br/>
        <em>${memo}</em><br/>
        <div style="margin-top:.35rem; color:#444;">現在: <strong>${statusText}</strong></div>
        <div class="row">
          <label style="display:block; margin:.25rem 0;">
            <input type="radio" name="visit-${CSS.escape(name)}" value="unvisited" ${current === "unvisited" ? "checked" : ""}>
            未参拝
          </label>
          <label style="display:block;">
            <input type="radio" name="visit-${CSS.escape(name)}" value="visited" ${current === "visited" ? "checked" : ""}>
            参拝済み
          </label>
        </div>
        save保存</button>
      </div>
    `;
  }

  // 開いているポップアップの「保存」ボタンにイベントを付与
  function wirePopupEvents(marker, spot, isTemple) {
    const popup = marker.getPopup();
    const container = popup?.getElement?.();
    if (!container) return;

    const name = spot.name ?? "名称不明";
    // 既存リスナ多重付与を避けるためにボタンをクローンして置換
    const btn = container.querySelector('button[data-action="save"]');
    if (!btn) return;
    const freshBtn = btn.cloneNode(true);
    btn.replaceWith(freshBtn);

    freshBtn.addEventListener("click", () => {
      // 選択された値を取得
      const selected = container.querySelector(`input[name="visit-${CSS.escape(name)}"]:checked`);
      const val = selected?.value === "visited" ? "visited" : "unvisited";

      // 保存（名前ベース）
      if (val === "visited") markVisited(name);
      else unmarkVisited(name);

      // 下部カードも同期（カードが同じスポットを表示中なら文言を更新）
      const shownName = document.getElementById("shrine-name")?.textContent || "";
      if (shownName === name) syncCardButton(name);

      // ポップアップの内容を更新（現在値表示とラジオの状態を反映）
      marker.setPopupContent(buildPopupHtml(spot, isTemple));
      // setPopupContent後にボタンが差し替わるので、再度配線
      setTimeout(() => wirePopupEvents(marker, spot, isTemple), 0);
    });
  }

  const group = L.featureGroup().addTo(map);

  // データ読み込み（キャッシュ無効化クエリを付与）
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
          // ジオコーディング未取得などはスキップ
          return;
        }

        // 「寺」の判定（簡易）：名前に「寺」「寺院」が含まれる
        const isTemple = /寺|寺院/.test(s.name ?? "");
        const icon = isTemple ? iconRed : iconGreen;

        const m = L.marker([lat, lng], { icon }).addTo(group);

        // ★ ポップアップ：フォームUIに差し替え
        m.bindPopup(buildPopupHtml(s, isTemple));

        // ポップアップが開いたら中の「保存」ボタンにイベント付与
        m.on("popupopen", () => wirePopupEvents(m, s, isTemple));

        // クリック時：下部カードに反映（既存の動きは維持）
        m.on("click", () => {
          const card = document.getElementById("card");
          card.classList.remove("hidden");
          document.getElementById("shrine-name").textContent = s.name ?? "";
          document.getElementById("goshuin-type").textContent = isTemple ? "寺院" : "神社";
          document.getElementById("memo").textContent = s.memo ?? "";

          const btn = document.getElementById("visited-btn");
          syncCardButton(s.name ?? "");
          btn.onclick = () => {
            markVisited(s.name ?? "");
            syncCardButton(s.name ?? "");
            // もしポップアップが開いていれば中身も最新化
            if (m.isPopupOpen()) {
              m.setPopupContent(buildPopupHtml(s, isTemple));
              setTimeout(() => wirePopupEvents(m, s, isTemple), 0);
            }
          };
        });
      });

      // 表示範囲を自動調整
      if (group.getLayers().length) {
        map.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    })
    .catch((err) => {
      console.error("geocodedデータ読み込みエラー:", err);
      alert("データの読み込みに失敗しました: " + err.message);
    });
});
