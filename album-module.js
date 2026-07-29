/* ═══════════════════════════════════════════════
   Mon Mode de Vie — album-module.js (rebuild)
   ═══════════════════════════════════════════════ */

(() => {
  const data = Array.isArray(window.MMV_ALBUM_DATA) ? window.MMV_ALBUM_DATA : [];
  const tabsRoot = document.querySelector("#albumTabs");
  const gridRoot = document.querySelector("#albumGrid");
  if (!data.length || !tabsRoot || !gridRoot) return;

  const copy = {
    zh: { open:v=>`打开《${v}》`, close:"关闭", prev:"上一张", next:"下一张", pos:(c,t)=>`${c} / ${t}` },
    en: { open:v=>`Open "${v}"`, close:"Close", prev:"Previous", next:"Next", pos:(c,t)=>`${c} of ${t}` },
    fr: { open:v=>`Ouvrir « ${v} »`, close:"Fermer", prev:"Précédente", next:"Suivante", pos:(c,t)=>`${c} sur ${t}` },
    de: { open:v=>`"${v}" öffnen`, close:"Schließen", prev:"Zurück", next:"Weiter", pos:(c,t)=>`${c} von ${t}` },
  };
  function lang() { const l = document.documentElement.lang.split("-")[0]; return copy[l] ? l : "zh"; }
  function loc(v) { return v && typeof v === "object" ? (v[lang()] || v.zh || v.en || "") : String(v||""); }

  let activeAlbum = 0, activePhoto = 0;

  function current() { return data[activeAlbum]; }

  function buildLightbox() {
    const d = document.createElement("dialog"); d.className = "album-lightbox"; d.id = "albumLightbox";
    d.innerHTML = `<div class="album-lightbox__panel">
      <button class="album-lightbox__close" type="button"><svg><use href="#icon-close"/></svg></button>
      <div class="album-lightbox__media"><img id="albumLightboxImage" decoding="async" /></div>
      <button class="album-lightbox__nav album-lightbox__nav--previous" type="button"><svg><use href="#icon-chevron"/></svg></button>
      <button class="album-lightbox__nav album-lightbox__nav--next" type="button"><svg><use href="#icon-chevron"/></svg></button>
      <div class="album-lightbox__caption">
        <div class="album-lightbox__caption-top"><span id="albumLightboxMeta"></span><span id="albumLightboxPosition"></span></div>
        <h2 id="albumLightboxTitle"></h2><p id="albumLightboxCaption"></p>
      </div></div>`;
    document.body.append(d);
    d.querySelector(".album-lightbox__close").onclick = () => d.close();
    d.querySelector(".album-lightbox__nav--previous").onclick = () => showPhoto(activePhoto - 1);
    d.querySelector(".album-lightbox__nav--next").onclick = () => showPhoto(activePhoto + 1);
    d.addEventListener("click", e => { if (e.target === d) d.close(); });
    d.addEventListener("keydown", e => {
      if (e.key === "ArrowLeft") { e.preventDefault(); showPhoto(activePhoto - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); showPhoto(activePhoto + 1); }
    });
    d.addEventListener("close", () => document.documentElement.removeAttribute("data-album-lightbox"));
    return d;
  }

  const lightbox = buildLightbox();

  function showPhoto(idx) {
    const a = current();
    if (!a.items.length) return;
    activePhoto = ((idx % a.items.length) + a.items.length) % a.items.length;
    const item = a.items[activePhoto];
    const c = copy[lang()];
    document.getElementById("albumLightboxImage").src = item.file;
    document.getElementById("albumLightboxImage").alt = loc(item.caption);
    document.getElementById("albumLightboxTitle").textContent = loc(item.title);
    document.getElementById("albumLightboxCaption").textContent = loc(item.caption);
    document.getElementById("albumLightboxMeta").textContent = `${loc(a.medium)} / ${loc(item.scene)}`;
    document.getElementById("albumLightboxPosition").textContent = c.pos(activePhoto + 1, a.items.length);
    if (!lightbox.open) { document.documentElement.dataset.albumLightbox = "open"; lightbox.showModal(); }
  }

  function renderGrid() {
    const a = current();
    const c = copy[lang()];
    const frag = document.createDocumentFragment();
    a.items.forEach((item, i) => {
      const btn = document.createElement("button"); btn.className = "album-card"; btn.type = "button";
      const img = document.createElement("img"); img.src = item.file; img.alt = loc(item.caption); img.loading = i < 3 ? "eager" : "lazy"; img.decoding = "async";
      img.onload = () => btn.classList.add("is-loaded");
      if (img.complete && img.naturalWidth) btn.classList.add("is-loaded");
      btn.innerHTML += `<span class="album-card__folio">${String(i+1).padStart(2,"0")}</span><span class="album-card__label"><strong>${loc(item.title)}</strong><small>${loc(item.scene)}</small></span>`;
      btn.prepend(img);
      btn.onclick = () => { activePhoto = i; showPhoto(i); };
      frag.append(btn);
    });
    gridRoot.replaceChildren(frag);
  }

  function renderTabs() {
    tabsRoot.replaceChildren();
    data.forEach((a, i) => {
      const t = document.createElement("button"); t.className = "album-tab"; t.type = "button";
      t.setAttribute("role","tab"); t.textContent = loc(a.name);
      t.onclick = () => { activeAlbum = i; renderTabs(); renderGrid(); };
      if (i === activeAlbum) { t.setAttribute("aria-selected","true"); t.tabIndex = 0; }
      else { t.setAttribute("aria-selected","false"); t.tabIndex = -1; }
      tabsRoot.append(t);
    });
  }

  renderTabs();
  renderGrid();
})();
