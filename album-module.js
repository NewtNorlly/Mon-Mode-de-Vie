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
  let activePhoto = -1;
  let gridTransition = 0;

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
    let closeTimer = 0;
    const closeLightbox = () => {
      if (!d.open || d.classList.contains("is-closing")) return;
      d.classList.add("is-closing");
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => d.close(), 180);
    };
    d.querySelector(".album-lightbox__close").onclick = closeLightbox;
    d.addEventListener("click", e => { if (e.target === d) closeLightbox(); });
    d.addEventListener("cancel", e => { e.preventDefault(); closeLightbox(); });
    d.addEventListener("close", () => { clearTimeout(closeTimer); d.classList.remove("is-closing"); document.documentElement.removeAttribute("data-album-lightbox"); activePhoto=-1; updateRoute(); });
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
    activeAlbum = data.indexOf(a); activePhoto = idx;
    document.getElementById("albumLightboxImage").src = item.file;
    document.getElementById("albumLightboxImage").alt = loc(item.caption);
    document.getElementById("albumLightboxTitle").textContent = loc(item.title);
    document.getElementById("albumLightboxCaption").textContent = loc(item.caption);
    document.getElementById("albumLightboxMeta").textContent = `${loc(a.medium)} / ${loc(item.scene)}`;
    const dlg = document.getElementById("albumLightbox");
    if (!dlg) return;
    if (!dlg.open) { dlg.classList.remove("is-closing"); document.documentElement.dataset.albumLightbox = "open"; dlg.showModal(); }
    updateRoute();
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
      t.onclick = () => switchAlbum(i);
      if (i === activeAlbum) { t.setAttribute("aria-selected","true"); t.tabIndex = 0; }
      else { t.setAttribute("aria-selected","false"); t.tabIndex = -1; }
      tabsRoot.append(t);
    });
  }

  function updateRoute(replace) {
    if (!window.MMVRoute || !current()) return;
    const parts = ["album", current().id];
    if (activePhoto >= 0 && current().items[activePhoto]) parts.push(current().items[activePhoto].id);
    window.MMVRoute.set(parts, replace);
  }

  function switchAlbum(next, fromRoute) {
    if (next === activeAlbum) { if (!fromRoute) { activePhoto=-1; updateRoute(); } return; }
    const transition = ++gridTransition;
    gridRoot.classList.add("is-leaving");
    setTimeout(() => {
      if (transition !== gridTransition) return;
      activeAlbum = next;
      activePhoto = -1;
      renderTabs();
      renderGrid();
      preloadAlbum(data[next]);
      if (!fromRoute) updateRoute();
      gridRoot.classList.remove("is-leaving");
      gridRoot.classList.add("is-entering");
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (transition === gridTransition) gridRoot.classList.remove("is-entering");
      }));
    }, 160);
  }

  renderTabs();
  renderGrid();
  window.applyAlbumRoute = function(parts) {
    if (!parts || parts[0] !== "album") return;
    const albumIndex = Math.max(0, data.findIndex(a => a.id === parts[1]));
    if (albumIndex !== activeAlbum) { activeAlbum=albumIndex; activePhoto=-1; renderTabs(); renderGrid(); preloadAlbum(data[albumIndex]); }
    const photoIndex = parts[2] ? current().items.findIndex(item => item.id === parts[2]) : -1;
    if (photoIndex >= 0 && photoIndex !== activePhoto) showPhoto(photoIndex);
    else if (photoIndex < 0 && lightbox.open) lightbox.close();
    if (!parts[1] && window.MMVRoute) updateRoute(true);
  };
  window.applyAlbumRoute(window.MMVRoute ? window.MMVRoute.parts() : []);
  window.renderAlbums = function() { renderTabs(); renderGrid(); };
})();
