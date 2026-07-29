/* ═══════════════════════════════════════════════
   Mon Mode de Vie — journal-module.js (rebuild)
   ═══════════════════════════════════════════════ */

(() => {
  const ledger = document.querySelector("#journalLedger");
  if (!ledger) return;

  const copy = {
    zh: { loading:"正在把日记摆到桌面上…", error:"日记暂时没有摆好。", latest:"最新", textOnly:"纯文字", images:n=>`${n} 张图片`, open:d=>`打开 ${d} 的日记` },
    en: { loading:"Loading journals…", error:"Could not load journals.", latest:"Latest", textOnly:"Text", images:n=>`${n} image${n===1?"":"s"}`, open:d=>`Open journal for ${d}` },
    fr: { loading:"Chargement…", error:"Impossible de charger.", latest:"Récent", textOnly:"Texte", images:n=>`${n} image${n===1?"":"s"}`, open:d=>`Ouvrir le journal du ${d}` },
    de: { loading:"Lade Tagebücher…", error:"Konnte nicht geladen werden.", latest:"Neu", textOnly:"Text", images:n=>`${n} Bild${n===1?"":"er"}`, open:d=>`Tagebuch vom ${d} öffnen` },
  };

  function lang() {
    const l = document.documentElement.lang.split("-")[0];
    return copy[l] ? l : "zh";
  }

  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||"");
    if (!m) return iso;
    return new Intl.DateTimeFormat({zh:"zh-CN",en:"en-GB",fr:"fr-FR",de:"de-DE"}[lang()]||"zh-CN", {year:"numeric",month:"long",day:"numeric",timeZone:"UTC"}).format(new Date(+m[1],+m[2]-1,+m[3],12));
  }

  function assetUrl(p) { return new URL(p, new URL("./journals/", window.location.href)).href; }

  function render() {
    const l = lang();
    const c = copy[l];
    ledger.replaceChildren();

    if (!window.MMVJournalData) { ledger.textContent = c.error; return; }
    window.MMVJournalData.load().then(entries => {
      if (!entries.length) { ledger.textContent = c.error; return; }

      const grouped = new Map();
      entries.forEach(e => { const y = e.date.slice(0,4); if (!grouped.has(y)) grouped.set(y,[]); grouped.get(y).push(e); });

      let first = true;
      grouped.forEach((items, year) => {
        const sec = document.createElement("section"); sec.className = "journal-year";
        const h2 = document.createElement("h2"); h2.className = "journal-year__heading"; h2.textContent = year;
        sec.append(h2);
        const list = document.createElement("div"); list.className = "journal-year__list";

        items.forEach(e => {
          const loc = e.locales?.[l] || {};
          const a = document.createElement("a"); a.className = "journal-entry"; a.href = `./journals/${e.file}`;

          const time = document.createElement("time"); time.className = "journal-entry__date"; time.dateTime = e.date;
          time.innerHTML = `<span>${e.date.slice(5,7)}.${e.date.slice(8,10)}</span><small>${e.date}</small>`;

          const body = document.createElement("span"); body.className = "journal-entry__body";
          const tl = document.createElement("span"); tl.className = "journal-entry__topline";
          if (first) { const em = document.createElement("em"); em.className = "journal-entry__latest"; em.textContent = c.latest; tl.append(em); first = false; }
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

          a.append(time, body, meta, vis);
          list.append(a);
        });

        sec.append(list);
        ledger.append(sec);
      });
    }).catch(() => { ledger.textContent = copy[lang()].error; });
  }

  ledger.textContent = copy[lang()].loading;
  render();
})();
