/* ═══════════════════════════════════════════════
   Mon Mode de Vie — journal-module.js (v2 — inline reader)
   ═══════════════════════════════════════════════ */

(() => {
  const sheet = document.querySelector(".journal-sheet");
  if (!sheet) return;

  /* ── i18n ── */
  const copy = {
    zh: { loading:"正在把日记摆到桌面上…", error:"日记暂时没有摆好。", latest:"最新", textOnly:"纯文字", images:n=>`图片${n}张`, videos:n=>`视频${n}个`, open:d=>`打开 ${d} 的日记`, back:"← 返回日记主页", backLabel:"返回日记主页", articleBy:"作者", articleOn:"写于" },
    en: { loading:"Loading journals…", error:"Could not load journals.", latest:"Latest", textOnly:"Text", images:n=>`${n} image${n===1?"":"s"}`, videos:n=>`${n} video${n===1?"":"s"}`, original:"Original text", open:d=>`Open journal for ${d}`, back:"← Back to Journal", backLabel:"Back to Journal", articleBy:"by", articleOn:"on" },
    fr: { loading:"Chargement des journaux…", error:"Impossible de charger les journaux.", latest:"Nouveau", textOnly:"Texte seul", images:n=>`${n} image${n===1?"":"s"}`, videos:n=>`${n} vidéo${n===1?"":"s"}`, original:"Texte original", open:d=>`Ouvrir l’entrée du ${d}`, back:"← Retour au journal", backLabel:"Retour au journal", articleBy:"par", articleOn:"le" },
    de: { loading:"Lade Tagebücher…", error:"Konnte nicht geladen werden.", latest:"Neu", textOnly:"Text", images:n=>`${n} Bild${n===1?"":"er"}`, videos:n=>`${n} Video${n===1?"":"s"}`, original:"Originaltext", open:d=>`Tagebuch vom ${d} öffnen`, back:"← Zurück zum Tagebuch", backLabel:"Zurück zum Tagebuch", articleBy:"von", articleOn:"am" },
  };

  function lang() {
    const l = document.documentElement.lang.split("-")[0];
    return copy[l] ? l : "zh";
  }

  function fmtDate(dateStr,l){var d=new Date(dateStr+'T00:00:00');if(isNaN(d.getTime())){var m=parseInt(dateStr.slice(5,7)),day=parseInt(dateStr.slice(8,10));if(l==='zh')return m+'月'+day+'日';if(l==='fr')return day+'/'+m;if(l==='de')return day+'.'+m+'.';return m+'/'+day;}if(l==='zh')return (d.getMonth()+1)+'月'+d.getDate()+'日';if(l==='fr')return d.getDate()+'/'+(d.getMonth()+1);if(l==='de')return d.getDate()+'.'+(d.getMonth()+1)+'.';return (d.getMonth()+1)+'/'+d.getDate();}

  function assetUrl(p) {
    try { return new URL(p, new URL("./journals/", window.location.href)).href; }
    catch(_) { return "./journals/" + p; }
  }

  function layoutJournalMedia(root) {
    root.querySelectorAll(".prose, .journal-media-prose").forEach(function(section) {
      var figures = Array.from(section.children).filter(function(el) {
        return el.matches("figure") && el.querySelector("img") && !el.querySelector("video");
      });
      var consumed = new Set();
      figures.forEach(function(first) {
        if (consumed.has(first)) return;
        var run = [first], next = first.nextElementSibling;
        while (next && next.matches("figure") && next.querySelector("img") && !next.querySelector("video")) {
          run.push(next); next = next.nextElementSibling;
        }
        var media = [];
        var captions = [];
        run.forEach(function(figure) {
          figure.querySelectorAll("img").forEach(function(node) { media.push(node); });
          figure.querySelectorAll("figcaption").forEach(function(node) {
            var value = node.textContent.trim(); if (value) captions.push(value);
          });
          consumed.add(figure);
        });
        if (!media.length) return;
        var group = document.createElement("figure");
        group.className = "journal-media-group journal-media-group--" + (media.length === 1 ? "single" : media.length <= 4 ? "quad" : "nine");
        group.dataset.mediaCount = media.length;
        group.dataset.mediaItems = JSON.stringify(media.map(function(node) { return { type: node.tagName.toLowerCase(), src: node.currentSrc || node.src || node.getAttribute("src"), alt: node.alt || node.title || "" }; }));
        var grid = document.createElement("div"); grid.className = "journal-media-grid";
        media.slice(0, 9).forEach(function(node, index) {
          var item = document.createElement("div"); item.className = "journal-media-item"; item.dataset.mediaIndex = index; item.tabIndex = 0; item.setAttribute("role", "button");
          node.removeAttribute("style");
          if (node.tagName === "IMG") { node.loading = "lazy"; node.decoding = "async"; }
          item.appendChild(node);
          if (index === 8 && media.length > 9) {
            var more = document.createElement("span"); more.className = "journal-media-more"; more.textContent = "+" + (media.length - 9); more.setAttribute("aria-label", (media.length - 9) + " more media items"); item.appendChild(more);
          }
          grid.appendChild(item);
        });
        group.appendChild(grid);
        if (captions.length === 1) { var caption = document.createElement("figcaption"); caption.textContent = captions[0]; group.appendChild(caption); }
        first.replaceWith(group);
        run.slice(1).forEach(function(figure) { figure.remove(); });
      });
    });
  }

  function separateMixedMedia(root) {
    root.querySelectorAll("figure").forEach(function(figure) {
      var videos = Array.from(figure.children).filter(function(node) { return node.tagName === "VIDEO"; });
      var images = Array.from(figure.children).filter(function(node) { return node.tagName === "IMG"; });
      if (!videos.length || !images.length) return;
      videos.forEach(function(video) {
        var videoFigure = document.createElement("figure");
        videoFigure.className = "journal-video-figure";
        figure.insertAdjacentElement("afterend", videoFigure);
        videoFigure.appendChild(video);
      });
    });
  }

  function layoutJournalVideos(root) {
    root.querySelectorAll("video").forEach(function(video, index) {
      var figure = video.closest("figure");
      if (!figure) {
        figure = document.createElement("figure");
        video.replaceWith(figure);
        figure.appendChild(video);
      }
      figure.classList.add("journal-video-figure");
      video.preload = "metadata";
      video.controls = true;
      video.disablePictureInPicture = true;
      video.setAttribute("disablepictureinpicture", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("aria-label", video.getAttribute("aria-label") || ("Journal video " + (index + 1)));
      function applyOrientation() {
        var declaredWidth = Number(video.getAttribute("width"));
        var declaredHeight = Number(video.getAttribute("height"));
        var width = declaredWidth || video.videoWidth;
        var height = declaredHeight || video.videoHeight;
        if (!width || !height) return;
        figure.style.setProperty("--journal-video-ratio", width + " / " + height);
        figure.classList.toggle("is-portrait", height > width);
        figure.classList.toggle("is-landscape", width >= height);
      }
      video.addEventListener("loadedmetadata", applyOrientation, { once: true });
      applyOrientation();
    });
  }

  function ensureJournalBody(article) {
    var messages = {
      "zh-CN": "今天的日记没有正文文本啦",
      en: "There is no written text for today's journal entry.",
      fr: "L’entrée du jour ne contient pas de texte.",
      de: "Der heutige Tagebucheintrag enthält keinen Text."
    };
    var hasBody = Array.from(article.querySelectorAll(".prose[lang]")).some(function(section) {
      return section.textContent.trim().length > 0;
    });
    if (hasBody) return;
    var anchor = article.querySelector(".journal-header");
    Object.keys(messages).reverse().forEach(function(code) {
      var section = document.createElement("section");
      section.className = "prose journal-empty-body";
      section.lang = code;
      section.dataset.journalLang = code;
      section.hidden = code !== "zh-CN";
      var paragraph = document.createElement("p");
      paragraph.textContent = messages[code];
      section.appendChild(paragraph);
      anchor.insertAdjacentElement("afterend", section);
    });
  }

  function formatOriginalParagraphs(root) {
    root.querySelectorAll(".journal-original-text > p").forEach(function(paragraph) {
      var blocks = paragraph.textContent.replace(/\r\n?/g, "\n").split(/\n{2,}/).filter(function(part) {
        return part.trim().length > 0;
      });
      var parts = [];
      blocks.forEach(function(block) {
        var lines = block.split("\n").filter(function(line) { return line.trim().length > 0; });
        var longLines = lines.filter(function(line) { return line.trim().length >= 36; }).length;
        var looksLikeThread = lines.some(function(line) {
          var text = line.trim();
          return /^\d{4}年\d{1,2}月\d{1,2}日/.test(text) || /^[^，。！？\n]{1,30}(?:\s+回复[^:：\n]{1,30})?\s+[:：]/.test(text);
        });
        if (lines.length > 1 && longLines >= 2 && !looksLikeThread) parts.push.apply(parts, lines);
        else parts.push(block);
      });
      if (parts.length < 2) return;
      var fragment = document.createDocumentFragment();
      parts.forEach(function(text) {
        var next = document.createElement("p");
        next.textContent = text.replace(/^\n+|\n+$/g, "");
        fragment.appendChild(next);
      });
      paragraph.parentNode.replaceChild(fragment, paragraph);
    });
  }

  /* ── lazy-load lightbox assets (idempotent) ── */
  var _lightboxLoaded = false;
  var _playerPromise = null;
  function ensurePlayer(root) {
    if (!root.querySelector("video")) return;
    if (window.MMVJournalPlayer) { window.MMVJournalPlayer.enhanceAll(root); return; }
    if (!_playerPromise) {
      var css=document.createElement("link"); css.rel="stylesheet"; css.href=assetUrl("assets/vendor/plyr.css?v=1"); document.head.appendChild(css);
      _playerPromise=["assets/vendor/hls.min.js?v=1","assets/vendor/plyr.min.js?v=1","assets/journal-player.js?v=20260812-pip-safe1"].reduce(function(p,src){return p.then(function(){return new Promise(function(resolve,reject){var s=document.createElement("script");s.src=assetUrl(src);s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});});},Promise.resolve());
    }
    _playerPromise.then(function(){if(root.isConnected&&window.MMVJournalPlayer)window.MMVJournalPlayer.enhanceAll(root);});
  }
  function ensureLightbox() {
    if (window.MMVJournalLightbox) { window.MMVJournalLightbox.scan(); return; }
    if (_lightboxLoaded) return;
    _lightboxLoaded = true;

    /* CSS */
    var lbCss = document.createElement('link');
    lbCss.rel = 'stylesheet';
    lbCss.href = new URL('./journals/assets/lightbox.css?v=20260812-media2', window.location.href).href;
    document.head.appendChild(lbCss);

    /* JS — data-cfasync="false" keeps Cloudflare Rocket Loader away */
    var lbJs = document.createElement('script');
    lbJs.src = new URL('./journals/assets/lightbox.js?v=20260814-gallery5', window.location.href).href;
    lbJs.setAttribute('data-cfasync', 'false');
    lbJs.addEventListener('load', function(){ if (window.MMVJournalLightbox) window.MMVJournalLightbox.scan(); }, { once: true });
    document.head.appendChild(lbJs);
  }

  /* ── container references ── */
  const listView = document.getElementById("journalLedger");
  const detailView = document.getElementById("journalReader");
  const detailContent = document.getElementById("journalReaderContent");
  const backBtn = document.getElementById("journalBackBtn");
  let viewTransition = 0;
  let currentEntryDate = "";

  function routeDate() {
    const match = location.hash.match(/^#journal(?:\/|=)(\d{4}-\d{2}-\d{2})$/);
    return match ? match[1] : "";
  }

  function setJournalRoute(date, replace) {
    const parts = date ? ["journal", date] : ["journal"];
    const hash = `#${parts.join("/")}`;
    if (location.hash === hash) return;
    if (window.MMVRoute) window.MMVRoute.set(parts, replace);
    else history[replace ? "replaceState" : "pushState"](null, "", hash);
  }

  /* ── show list / detail ── */
  function showList(updateRoute = true) {
    if (!listView || !detailView) return;
    const transition = ++viewTransition;
    currentEntryDate = "";
    listView.classList.remove("is-leaving-back", "is-entering-back");
    if (updateRoute) setJournalRoute("", false);
    if (detailView.hidden) {
      listView.hidden = false;
      return;
    }
    detailView.classList.add("is-leaving-forward");
    setTimeout(() => {
      if (transition !== viewTransition) return;
      detailView.hidden = true;
      detailView.classList.remove("is-leaving-forward");
      listView.hidden = false;
      listView.classList.add("is-entering-back");
      requestAnimationFrame(() => requestAnimationFrame(() => listView.classList.remove("is-entering-back")));
    }, 160);
  }
  function showDetail() {
    if (!listView || !detailView) return;
    const transition = ++viewTransition;
    detailView.classList.remove("is-leaving-forward", "is-entering-forward");
    listView.classList.add("is-leaving-back");
    setTimeout(() => {
      if (transition !== viewTransition) return;
      listView.hidden = true;
      listView.classList.remove("is-leaving-back");
      detailView.hidden = false;
      detailView.classList.add("is-entering-forward");
      if (detailContent) detailContent.scrollTop = 0;
      requestAnimationFrame(() => requestAnimationFrame(() => detailView.classList.remove("is-entering-forward")));
    }, 160);
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
    if (window.MMVJournalPlayer) window.MMVJournalPlayer.destroyAll(detailContent);
    currentEntryDate = entry.date;
    setJournalRoute(entry.date, false);
    detailContent.innerHTML = `<p class="journal-reader__loading">${c.loading}</p>`;
    showDetail();

    const articleUrl = new URL(assetUrl(entry.file));
    articleUrl.searchParams.set("v", "20260813-september-media1");
    fetch(articleUrl.href, { cache: "no-store" })
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
        article.querySelectorAll("video").forEach(function(video) {
          ["src","poster","data-hls","data-fallback"].forEach(function(name){var s=video.getAttribute(name);if(s&&!s.startsWith("http")&&!s.startsWith("data:")&&!s.startsWith("/"))video.setAttribute(name,assetUrl(s));});
          video.preload="metadata"; video.setAttribute("playsinline","");
        });

        /* fix relative iframe gallery src paths */
        article.querySelectorAll("iframe[src*='gallery.html']").forEach(el => {
          var s = el.getAttribute("src");
          if (s && !s.startsWith("http") && !s.startsWith("data:") && !s.startsWith("/")) {
            el.src = assetUrl(s).replace("gallery.html", "gallery.html?v=20260812-media2");
          }
        });

        ensureJournalBody(article);
        formatOriginalParagraphs(article);
        separateMixedMedia(article);
        layoutJournalMedia(article);
        layoutJournalVideos(article);

        /* Ensure the lightbox is ready before or just after the new article is injected. */
        ensureLightbox();

        /* inject article */
        if (window.MMVJournalPlayer) window.MMVJournalPlayer.destroyAll(detailContent);
        detailContent.innerHTML = "";
        detailContent.appendChild(article);
        /* Bind newly injected media even when the lightbox script was already loaded. */
        if (window.MMVJournalLightbox) window.MMVJournalLightbox.scan();
        else ensureLightbox();
        ensurePlayer(article);

        /* switch prose sections to current language */
        var proseSections = detailContent.querySelectorAll(".prose[lang]");
        proseSections.forEach(function(sec){
          if (sec.hasAttribute("data-journal-original")) { sec.hidden = false; return; }
          var sectionLang = sec.getAttribute("lang") || "";
          sec.hidden = sectionLang !== l && !sectionLang.startsWith(l);
        });

        /* update back button text */
        if (backBtn) backBtn.textContent = c.back;
      })
      .catch(() => { detailContent.innerHTML = `<p class="journal-reader__error">${c.error}</p>`; });
  }

  /* ── render list ── */
  function render() {
    const l = lang();
    const c = copy[l];
    const requestedBeforeRender = routeDate();
    if (!listView) return;
    listView.replaceChildren();
    listView.classList.add("is-loading");
    if (!requestedBeforeRender) showList(false);

    if (!window.MMVJournalData) { listView.classList.remove("is-loading"); listView.textContent = c.error; return; }
    window.MMVJournalData.load().then(entries => {
      listView.classList.remove("is-loading");
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

          /* Real anchors keep entries bookmarkable before JavaScript finishes. */
          const btn = document.createElement("a");
          btn.className = "journal-entry";
          btn.href = `#journal/${e.date}`;
          btn.title = c.open(loc.title || e.date);
          btn.addEventListener("click", function(event) {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            openJournal(e);
          });

          const time = document.createElement("time"); time.className = "journal-entry__date"; time.dateTime = e.date;
          time.innerHTML = '<span>'+fmtDate(e.date,l)+'</span>';

          const body = document.createElement("span"); body.className = "journal-entry__body";
          const tl = document.createElement("span"); tl.className = "journal-entry__topline";
          tl.append(Object.assign(document.createElement("span"),{className:"journal-entry__location",textContent:loc.location||e.location||""}));
          body.append(tl, Object.assign(document.createElement("span"),{className:"journal-entry__excerpt",textContent:loc.excerpt||e.excerpt||""}));

          const mediaItems = Array.isArray(e.images) ? e.images : [];
          const videoItems = mediaItems.filter(item => /\.(?:mp4|m4v|webm)(?:$|[?#])/i.test(item.file || ""));
          const imageItems = mediaItems.filter(item => !videoItems.includes(item));
          const mediaLabels = [];
          if (imageItems.length) mediaLabels.push(c.images(imageItems.length));
          if (videoItems.length) mediaLabels.push(c.videos(videoItems.length));
          if (!mediaLabels.length) mediaLabels.push(c.textOnly);
          const meta = document.createElement("span"); meta.className = "journal-entry__meta";
          const sourceLabel = e.source?.kind === "pdf" ? (loc.sourceLabel || e.source.label || "") : "";
          meta.innerHTML = `<small>${mediaLabels.join(" · ")}</small>${sourceLabel ? `<small>${sourceLabel}</small>` : ""}`;

          const vis = document.createElement("span"); vis.className = "journal-entry__visual";
          if (mediaItems.length) {
            const firstMedia = imageItems[0] || videoItems[0];
            const isVideo = /\.(?:mp4|m4v|webm)(?:$|[?#])/i.test(firstMedia.file || "");
            const previewFile = firstMedia.poster || firstMedia.thumbnail || (isVideo ? "assets/images/journal-video-poster.svg" : firstMedia.file);
            const img = document.createElement("img"); img.src = assetUrl(previewFile); img.alt = ""; img.loading = "lazy"; img.decoding = "async";
            img.onerror = () => { vis.className += " is-text-preview"; vis.innerHTML = `<span class="journal-entry__paper-preview"><small>${fmtDate(e.date,l)}</small></span>`; };
            vis.append(img);
            if (isVideo) {
              vis.classList.add("is-video-preview");
              img.addEventListener("load", function() {
                if (!img.naturalWidth || !img.naturalHeight) return;
                vis.style.setProperty("--journal-preview-ratio", img.naturalWidth + " / " + img.naturalHeight);
                vis.classList.toggle("is-portrait", img.naturalHeight > img.naturalWidth);
              }, { once: true });
              const play=document.createElement("span"); play.className="journal-entry__play"; play.setAttribute("aria-hidden","true"); play.textContent="▶"; vis.append(play);
            }
          } else {
            vis.className += " is-text-preview";
            vis.innerHTML = `<span class="journal-entry__paper-preview"><small>${fmtDate(e.date,l)}</small></span>`;
          }

          btn.append(time, body, meta, vis);
          listEl.append(btn);
        });

        sec.append(listEl);
        listView.append(sec);
      });
      const requested = routeDate();
      if (requested) {
        const entry = entries.find(item => item.date === requested);
        if (entry && currentEntryDate !== requested) openJournal(entry);
      }
    }).catch(() => { listView.classList.remove("is-loading"); listView.textContent = copy[lang()].error; });
  }

  if (listView) { listView.textContent = copy[lang()].loading; }
  window.renderJournals = render;
  render();

  window.addEventListener("hashchange", function() {
    const requested = routeDate();
    if (!requested && currentEntryDate) showList(false);
    else if (requested && requested !== currentEntryDate && window.MMVJournalData) {
      window.MMVJournalData.load().then(entries => { const entry=entries.find(item=>item.date===requested); if(entry) openJournal(entry); });
    }
  });

  /* ── Gallery iframe auto-resize ── */
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'mmv:gallery-resize') return;
    var iframes = document.querySelectorAll('iframe[src*="gallery.html"]');
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].contentWindow === e.source && e.data.height > 0) {
        iframes[i].style.height = e.data.height + 'px';
      }
    }
  });
})();
