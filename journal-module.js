/* ═══════════════════════════════════════════════
   Mon Mode de Vie — journal-module.js (v2 — inline reader)
   ═══════════════════════════════════════════════ */

(() => {
  const sheet = document.querySelector(".journal-sheet");
  if (!sheet) return;

  /* ── i18n ── */
  const copy = {
    zh: { loading:"正在把日记摆到桌面上…", error:"日记暂时没有摆好。", latest:"最新", textOnly:"纯文字", images:n=>`${n} 张图片`, open:d=>`打开 ${d} 的日记`, back:"← 返回日志主页", backLabel:"返回日志主页", articleBy:"作者", articleOn:"写于" },
    en: { loading:"Loading journals…", error:"Could not load journals.", latest:"Latest", textOnly:"Text", images:n=>`${n} image${n===1?"":"s"}`, open:d=>`Open journal for ${d}`, back:"← Back to Journal", backLabel:"Back to Journal", articleBy:"by", articleOn:"on" },
    fr: { loading:"Chargement…", error:"Impossible de charger.", latest:"Récent", textOnly:"Texte", images:n=>`${n} image${n===1?"":"s"}`, open:d=>`Ouvrir le journal du ${d}`, back:"← Retour au Journal", backLabel:"Retour au Journal", articleBy:"par", articleOn:"le" },
    de: { loading:"Lade Tagebücher…", error:"Konnte nicht geladen werden.", latest:"Neu", textOnly:"Text", images:n=>`${n} Bild${n===1?"":"er"}`, open:d=>`Tagebuch vom ${d} öffnen`, back:"← Zurück zum Tagebuch", backLabel:"Zurück zum Tagebuch", articleBy:"von", articleOn:"am" },
  };

  function lang() {
    const l = document.documentElement.lang.split("-")[0];
    return copy[l] ? l : "zh";
  }

  function assetUrl(p) {
    try { return new URL(p, new URL("./journals/", window.location.href)).href; }
    catch(_) { return "./journals/" + p; }
  }

  /* ── container references ── */
  const listView = document.getElementById("journalLedger");
  const detailView = document.getElementById("journalReader");
  const detailContent = document.getElementById("journalReaderContent");
  const backBtn = document.getElementById("journalBackBtn");

  /* ── show list / detail ── */
  function showList() {
    if (listView) listView.hidden = false;
    if (detailView) detailView.hidden = true;
  }
  function showDetail() {
    if (listView) listView.hidden = true;
    if (detailView) detailView.hidden = false;
    if (detailContent) detailContent.scrollTop = 0;
  }

  /* ── back button ── */
  if (backBtn) {
    backBtn.addEventListener("click", showList);
    backBtn.setAttribute("data-i18n-title", "backLabel");
  }

  /* ── open journal entry ── */
  function openJournal(entry) {
    const l = lang();
    const c = copy[l];
    if (!detailContent) return;
    detailContent.innerHTML = `<p class="journal-reader__loading">${c.loading}</p>`;
    showDetail();

    fetch(assetUrl(entry.file))
      .then(r => { if (!r.ok) throw new Error("not found"); return r.text(); })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        /* extract article content */
        const article = doc.querySelector(".journal-article");
        if (!article) { detailContent.innerHTML = `<p class="journal-reader__error">${c.error}</p>`; return; }

        /* strip unwanted elements */
        article.querySelectorAll(".language-switcher, .theme-toggle, .site-bar, script").forEach(el => el.remove());

        /* fix relative image paths */
        article.querySelectorAll("img").forEach(img => {
          var s = img.getAttribute("src");
          if (s && !s.startsWith("http") && !s.startsWith("data:") && !s.startsWith("/")) {
            img.src = assetUrl(s);
          }
        });

        /* inject article */
        detailContent.innerHTML = "";
        detailContent.appendChild(article);

        /* update back button text */
        if (backBtn) backBtn.textContent = c.back;
      })
      .catch(() => { detailContent.innerHTML = `<p class="journal-reader__error">${c.error}</p>`; });
  }

  /* ── render list ── */
  function render() {
    const l = lang();
    const c = copy[l];
    if (!listView) return;
    listView.replaceChildren();
    showList();

    if (!window.MMVJournalData) { listView.textContent = c.error; return; }
    window.MMVJournalData.load().then(entries => {
      if (!entries.length) { listView.textContent = c.error; return; }

      const grouped = new Map();
      entries.forEach(e => { const y = e.date.slice(0,4); if (!grouped.has(y)) grouped.set(y,[]); grouped.get(y).push(e); });

      grouped.forEach((items, year) => {
        const sec = document.createElement("section"); sec.className = "journal-year";
        const h2 = document.createElement("h2"); h2.className = "journal-year__heading"; h2.textContent = year;
        sec.append(h2);
        const listEl = document.createElement("div"); listEl.className = "journal-year__list";

        items.forEach(e => {
          const loc = e.locales?.[l] || {};

          /* use button instead of anchor to avoid page navigation */
          const btn = document.createElement("button");
          btn.className = "journal-entry";
          btn.type = "button";
          btn.title = c.open(loc.title || e.date);
          btn.addEventListener("click", function(ev) { ev.preventDefault(); openJournal(e); });

          const time = document.createElement("time"); time.className = "journal-entry__date"; time.dateTime = e.date;
          time.innerHTML = `<span>${parseInt(e.date.slice(5,7))}月${parseInt(e.date.slice(8,10))}日</span>`;

          const body = document.createElement("span"); body.className = "journal-entry__body";
          const tl = document.createElement("span"); tl.className = "journal-entry__topline";
          tl.append(Object.assign(document.createElement("span"),{className:"journal-entry__location",textContent:loc.location||e.location||""}));
          body.append(tl, Object.assign(document.createElement("span"),{className:"journal-entry__excerpt",textContent:loc.excerpt||e.excerpt||""}));

          const meta = document.createElement("span"); meta.className = "journal-entry__meta";
          meta.innerHTML = `<small>${e.images.length ? c.images(e.images.length) : c.textOnly}</small><small>${loc.sourceLabel||e.source?.label||""}</small>`;

          const vis = document.createElement("span"); vis.className = "journal-entry__visual";
          if (e.images.length) {
            const img = document.createElement("img"); img.src = assetUrl(e.images[0].file); img.alt = ""; img.loading = "lazy"; img.decoding = "async";
            img.onerror = () => { vis.className += " is-text-preview"; vis.innerHTML = `<span class="journal-entry__paper-preview"><small>${e.date.slice(5,7)}.${e.date.slice(8,10)}</small></span>`; };
            vis.append(img);
          } else {
            vis.className += " is-text-preview";
            vis.innerHTML = `<span class="journal-entry__paper-preview"><small class="journal-entry__paper-date">${e.date.slice(5,7)}.${e.date.slice(8,10)}</small><span class="journal-entry__paper-snippet">${(loc.excerpt||e.excerpt||"").slice(0,60)}</span></span>`;
          }

          btn.append(time, body, meta, vis);
          listEl.append(btn);
        });

        sec.append(listEl);
        listView.append(sec);
      });
    }).catch(() => { listView.textContent = copy[lang()].error; });
  }

  if (listView) { listView.textContent = copy[lang()].loading; }
  window.renderJournals = render;
  render();
})();
