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
  const url = spot.url ?? spot.link ?? ""; // ← データに url or link があれば使う
  const current = isVisited(name) ? "visited" : "unvisited";
  const statusText = current === "visited" ? "✅参拝済み" : "未参拝";

  // URL があればアンカー表示（target=_blank, rel=noopener）
  const linkHtml = url
    ? `<div style="margin-top:.35rem;">
         <a href="${encodeURI(url)}" target="_blank" rel="noopener noreferrer">公式/参考サイトを開く ↗</a>
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
