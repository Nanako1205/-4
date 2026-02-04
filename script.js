// script.js（寺=赤／神社=緑、カード連動、参拝済み記録＋ポップアップで即保存＋URLリンク）

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

  /* ---------------------------
     参拝済みのローカル保存（名前ベース）
     将来同名が出る可能性があれば id ベースに変更推奨
  --------------------------- */
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

  // 下部カードのボタン文言を現在の visited 状態に合わせて更新
  function syncCardButton(name) {
    const btn = document.getElementById("visited-btn");
    if (!btn) return;
    btn.textContent = isVisited(name) ? "参拝済み ✓" : "参拝済みにする";
  }

  /* ---------------------------
     ポップアップのHTML
     - 「save保存」を廃止（ラジオ変更で即保存）
     - URL があればリンクを表示（spot.url / spot.link）
  --------------------------- */
  function buildPopupHtml(spot, isTemple) {
    const name = spot.name ?? "名称不明";
    const address = spot.address ?? "";
    const memo = spot.memo ?? "";
    const url = spot.url ?? spot.link ?? ""; // データにあれば表示
    const current = isVisited(name) ? "visited" : "unvisited";
    const statusText = current === "visited" ? "✅参拝済み" : "未参拝";

    // URL があれば外部リンクを表示（新規タブ）
    const linkHtml = url
      ? `<div style="margin-top:.35rem;">
           ${encodeURI(url)}公式/参考サイトを開く ↗
         </div>`
      : "";

    return `
      <div class="visit-popup" data-name="${name}">
        <div class="title">${name}</div>
        <small>${address}</small><br/>
        <em>${memo}</em><br/>
        <div style="margin-top:.35rem; color:#444;">現在: <strong>${statusText}</strong></div>

        <div class="row" style="margin-top:.35rem;">
          <label style="display:block; margin:.25rem 0;">
            <input type="radio" name="visit-${CSS.escape(name)}" value="unvisited" ${current === "unvisited" ? "checked" : ""}>
            未参拝
          </label>
          <label style="display:block;">
            <input type="radio" name="visit-${CSS.escape(name)}" value="visited" ${current === "visited" ? "checked" : ""}>
            参拝済み
          </label>
        </div>

        ${linkHtml}
      </div>
    `;
  }

  /* ---------------------------
     ポップアップ内イベント配線
     - ラジオ変更で即保存 & UI再描画
  --------------------------- */
  function wirePopupEvents(marker, spot, isTemple) {
    const popup = marker.getPopup();
    const container = popup?.getElement?.();
    if (!container) return;

    const name = spot.name ?? "名称不明";
    const radios = container.querySelectorAll(`input[name="visit-${CSS.escape(name)}"]`);
    if (!radios.length) return;

    // 多重登録を避けるためにラジオをクローンして差し替え
    radios.forEach((r) => {
      const cloned = r.cloneNode(true);
      r.replaceWith(cloned);
    });

    // 付け直したラジオを取得してイベント付与
    const freshRadios = container.querySelectorAll(`input[name="visit-${CSS.escape(name)}"]`);
    freshRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        const val = radio.value === "visited" ? "visited" : "unvisited";

        // 保存（名前ベース）
        if (val === "visited") markVisited(name);
        else unmarkVisited(name);

        // 下部カードのボタン表示を同期
        const shownName = document.getElementById("shrine-name")?.textContent || "";
        if (shownName === name) {
          syncCardButton(name);
        }

        // ポップアップの表示を再生成（現在値＆URLリンク含む）
        marker.setPopupContent(buildPopupHtml(spot, isTemple));
        // setPopupContent後はDOMが作り直されるので、イベントを再付与
        setTimeout(() => wirePopupEvents(marker, spot, isTemple), 0);
      });
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

        // ★ ポップアップ：フォームUI（ラジオ即保存＋URLリンク）に差し替え
        m.bindPopup(buildPopupHtml(s, isTemple));

        // ポップアップが開いたら中のラジオへイベント配線
        m.on("popupopen", () => wirePopupEvents(m, s, isTemple));

        // クリック時：下部カードに反映（既存の動きは維持）
        m.on("click", () => {
          const card = document.getElementById("card");
          card.classList.remove("hidden");
          document.getElementById("shrine-name").textContent = s.name ?? "";
          document.getElementById("goshuin-type").textContent = isTemple ? "寺院" : "神社";
          document.getElementById("memo").textContent = s.memo ?? "";

          const btn = document.getElementById("visited-btn");
          // ボタンはワンタップで参拝済みにするシンプル動作（再クリックで未参拝へ戻す仕様にしてもOK）
          syncCardButton(s.name ?? "");
          btn.onclick = () => {
            if (isVisited(s.name ?? "")) {
              // もし未参拝へ戻したい運用ならこちら
              // unmarkVisited(s.name ?? "");
              // ここでは「押したら参拝済みにする」の現行仕様を維持
              return;
            }
            markVisited(s.name ?? "");
            syncCardButton(s.name ?? "");
            // ポップアップが開いていれば内容も最新化
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
``
