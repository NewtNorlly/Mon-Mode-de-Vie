/* ═══════════════════════════════════════════════
   Mon Mode de Vie — album-module.js (rebuild)
   ═══════════════════════════════════════════════ */

(() => {
  const data = Array.isArray(window.MMV_ALBUM_DATA) ? window.MMV_ALBUM_DATA : [];
  const tabsRoot = document.querySelector("#albumTabs");
  const gridRoot = document.querySelector("#albumGrid");
  if (!data.length || !tabsRoot || !gridRoot) return;

  const copy = {
    zh: { close:"关闭" },
    en: { close:"Close" },
    fr: { close:"Fermer" },
    de: { close:"Schließen" },
  };
  function lang() { const l = document.documentElement.lang.split("-")[0]; return copy[l] ? l : "zh"; }
  function loc(v) { return v && typeof v === "object" ? (v[lang()] || v.zh || v.en || "") : String(v||""); }

  let activeAlbum = 0;

  function current() { return data[activeAlbum]; }

  function buildLightbox() {
    const d = document.createElement("dialog"); d.className = "album-lightbox"; d.id = "albumLightbox";
    d.innerHTML = `<div class="album-lightbox__panel">
      <button class="album-lightbox__close" type="button"><svg><use href="#icon-close"/></svg></button>
      <div class="album-lightbox__media"><img id="albumLightboxImage" decoding="async" /></div>
      <div class="album-lightbox__caption">
        <div class="album-lightbox__caption-top"><span id="albumLightboxMeta"></span></div>
        <h2 id="albumLightboxTitle"></h2><p id="albumLightboxCaption"></p>
      </div></div>`;
    document.body.append(d);
    d.querySelector(".album-lightbox__close").onclick = () => d.close();
    d.addEventListener("click", e => { if (e.target === d) d.close(); });
    d.addEventListener("close", () => { document.documentElement.removeAttribute("data-album-lightbox"); });
    return d;
  }

  const lightbox = buildLightbox();

  /* ── 预加载：切换分册时后台加载该分册所有大图 ── */
  const preloaded = new Set();
  function preloadAlbum(a) {
    if (!a || !a.items) return;
    a.items.forEach(item => {
      if (preloaded.has(item.file)) return;
      preloaded.add(item.file);
      const img = new Image();
      img.src = item.file;
    });
  }

  function showPhoto(idx) {
    var albumId = document.getElementById("albumLightbox").dataset.albumId;
    var a = albumId ? data.find(function(ab){return ab.id === albumId}) : current();
    if (!a || !a.items.length) return;
    const item = a.items[idx];
    if (!item) return;
    document.getElementById("albumLightboxImage").src = item.file;
    document.getElementById("albumLightboxImage").alt = loc(item.caption);
    document.getElementById("albumLightboxTitle").textContent = loc(item.title);
    document.getElementById("albumLightboxCaption").textContent = loc(item.caption);
    document.getElementById("albumLightboxMeta").textContent = `${loc(a.medium)} / ${loc(item.scene)}`;
    const dlg = document.getElementById("albumLightbox");
    if (!dlg) return;
    if (!dlg.open) { document.documentElement.dataset.albumLightbox = "open"; dlg.showModal(); }
  }

  function renderGrid() {
    const a = current();
    const c = copy[lang()];
    const frag = document.createDocumentFragment();
    a.items.forEach((item, i) => {
      const btn = document.createElement("button"); btn.className = "album-card"; btn.type = "button";
      const img = document.createElement("img"); img.src = item.file.replace(/(\.\w+)$/, '_thumb$1'); img.alt = loc(item.caption); img.loading = i < 3 ? "eager" : "lazy"; img.decoding = "async";
      img.onload = () => btn.classList.add("is-loaded");
      if (img.complete && img.naturalWidth) btn.classList.add("is-loaded");
      btn.innerHTML += `<span class="album-card__folio">${String(i+1).padStart(2,"0")}</span><span class="album-card__label"><strong>${loc(item.title)}</strong><small>${loc(item.scene)}</small></span>`;
      btn.prepend(img);
      btn.onclick = () => { document.getElementById("albumLightbox").dataset.albumId = a.id; showPhoto(i); };
      frag.append(btn);
    });
    gridRoot.replaceChildren(frag);
  }

  function renderTabs() {
    tabsRoot.replaceChildren();
    data.forEach((a, i) => {
      const t = document.createElement("button"); t.className = "album-tab"; t.type = "button";
      t.setAttribute("role","tab"); t.textContent = loc(a.name);
      t.onclick = () => { activeAlbum = i; renderTabs(); renderGrid(); preloadAlbum(data[i]); };
      if (i === activeAlbum) { t.setAttribute("aria-selected","true"); t.tabIndex = 0; }
      else { t.setAttribute("aria-selected","false"); t.tabIndex = -1; }
      tabsRoot.append(t);
    });
  }

  renderTabs();
  renderGrid();
  window.renderAlbums = function() { renderTabs(); renderGrid(); };
})();
