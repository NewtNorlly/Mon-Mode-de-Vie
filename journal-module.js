/* ═══════════════════════════════════════════════
   Mon Mode de Vie — journal-module.js (v2 — inline reader)
   ═══════════════════════════════════════════════ */

(() => {
  const sheet = document.querySelector(".journal-sheet");
  if (!sheet) return;

  /* ── i18n ── */
  const copy = {
    zh: { loading:"正在把日记摆到桌面上…", error:"日记暂时没有摆好。", localOnly:"日记需要通过本地服务打开。请双击项目根目录的「启动网站.cmd」，等窗口显示网址后，用浏览器访问那个网址再看日记。直接用 file:// 打开网页时，浏览器会拦截日记文件的读取。", latest:"最新", textOnly:"纯文字", images:n=>`图片${n}张`, videos:n=>`视频${n}个`, open:d=>`打开 ${d} 的日记`, back:"← 返回日记主页", backLabel:"返回日记主页", articleBy:"作者", articleOn:"写于", locationLabel:"定位", noteLabel:"笔记", sourceNoteLabel:"原书注" },
    en: { loading:"Loading journals…", error:"Could not load journals.", localOnly:"Journals must be opened through the local server. Double-click 启动网站.cmd in the project root, then visit the URL it prints. Opening this page via file:// makes the browser block journal file reads.", latest:"Latest", textOnly:"Text", images:n=>`${n} image${n===1?"":"s"}`, videos:n=>`${n} video${n===1?"":"s"}`, original:"Original text", open:d=>`Open journal for ${d}`, back:"← Back to Journal", backLabel:"Back to Journal", articleBy:"by", articleOn:"on", locationLabel:"Location", noteLabel:"Note", sourceNoteLabel:"Book note" },
    fr: { loading:"Chargement des journaux…", error:"Impossible de charger les journaux.", localOnly:"Les journaux doivent être ouverts via le serveur local. Double-cliquez sur 启动网站.cmd à la racine du projet, puis visitez l’URL affichée. Avec file://, le navigateur bloque la lecture des fichiers du journal.", latest:"Nouveau", textOnly:"Texte seul", images:n=>`${n} image${n===1?"":"s"}`, videos:n=>`${n} vidéo${n===1?"":"s"}`, original:"Texte original", open:d=>`Ouvrir l’entrée du ${d}`, back:"← Retour au journal", backLabel:"Retour au journal", articleBy:"par", articleOn:"le", locationLabel:"Lieu", noteLabel:"Note", sourceNoteLabel:"Note de l’ouvrage" },
    de: { loading:"Lade Tagebücher…", error:"Konnte nicht geladen werden.", localOnly:"Tagebücher müssen über den lokalen Server geöffnet werden. Doppelklicken Sie auf 启动网站.cmd im Projektstamm und öffnen Sie die angezeigte URL. Über file:// blockiert der Browser das Lesen der Tagebuchdateien.", latest:"Neu", textOnly:"Text", images:n=>`${n} Bild${n===1?"":"er"}`, videos:n=>`${n} Video${n===1?"":"s"}`, original:"Originaltext", open:d=>`Tagebuch vom ${d} öffnen`, back:"← Zurück zum Tagebuch", backLabel:"Zurück zum Tagebuch", articleBy:"von", articleOn:"am", locationLabel:"Ort", noteLabel:"Notiz", sourceNoteLabel:"Buchnotiz" },
  };

  function lang() {
    const l = document.documentElement.lang.split("-")[0];
    return copy[l] ? l : "zh";
  }

  function isFileProtocol() {
    return window.location.protocol === "file:";
  }

  /* 正文标题的日期按界面语言显示；中文保持载荷里原有的排版（2026 年 10 月 31 日）。 */
  function fmtLongDate(iso, l) {
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return "";
    var locale = l === "fr" ? "fr-FR" : l === "de" ? "de-DE" : l === "en" ? "en-GB" : "zh-CN";
    try {
      return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(d);
    } catch (_) {
      return "";
    }
  }

  function sectionLangCode(value) {
    return String(value || "").toLowerCase().split("-")[0];
  }

  function fmtDate(dateStr,l){var d=new Date(dateStr+'T00:00:00');if(isNaN(d.getTime())){var m=parseInt(dateStr.slice(5,7)),day=parseInt(dateStr.slice(8,10));if(l==='zh')return m+'月'+day+'日';if(l==='fr')return day+'/'+m;if(l==='de')return day+'.'+m+'.';return m+'/'+day;}if(l==='zh')return (d.getMonth()+1)+'月'+d.getDate()+'日';if(l==='fr')return d.getDate()+'/'+(d.getMonth()+1);if(l==='de')return d.getDate()+'/'+(d.getMonth()+1)+'.';return (d.getMonth()+1)+'/'+d.getDate();}

  function assetUrl(p) {
    try { return new URL(p, new URL("./journals/", window.location.href)).href; }
    catch(_) { return "./journals/" + p; }
  }

  function layoutJournalMedia(root) {
    root.querySelectorAll(".prose, .journal-media-prose, .journal-body").forEach(function(section) {
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

  /* PDF 来源载荷的图片包在 .figure-grid 里；先把 figure 提为 .journal-body 的直接子元素，
     再交给 layoutJournalMedia 统一排版，保证与普通日记一致并接入灯箱。 */
  function normalizeJournalBodyFigures(article) {
    article.querySelectorAll(".journal-body .figure-grid").forEach(function(grid) {
      var figures = Array.from(grid.children).filter(function(el) { return el.matches("figure"); });
      if (!figures.length) { grid.remove(); return; }
      figures.forEach(function(figure) { grid.parentNode.insertBefore(figure, grid); });
      grid.remove();
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
    var hasProseBody = Array.from(article.querySelectorAll(".prose[lang]")).some(function(section) {
      return section.textContent.trim().length > 0;
    });
    /* PDF 来源载荷的正文在 .journal-body 的 data-journal-block-id 块（p/pre/aside）里，
       没有 .prose 元素，也要算作有正文，避免错误插入占位句。 */
    var hasJournalBody = Array.from(article.querySelectorAll(".journal-body [data-journal-block-id]")).some(function(el) {
      return el.textContent.trim().length > 0;
    });
    if (hasProseBody || hasJournalBody) return;
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
      if (anchor) anchor.insertAdjacentElement("afterend", section);
      else article.appendChild(section);
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

  /* ═══ 语言切换（界面语言 → 正文只显示一种语言） ═══
     一组正文 = 相邻的一串 .prose[lang] 兄弟节点（中文原文 + en/fr/de 译文）。
     一篇日记里可能有好几组（相邻两组之间由媒体块或别的元素隔开，例如「正文 / 时光轴 / 媒体」三段），
     所以必须按「相邻」分组，不能按父节点分组——否则多组日记只会显示一组、丢掉其余正文。
     规则：每组命中当前界面语言就只显示那一个 section；该组没有对应译文时回退中文原文。
     绝不把译文叠在中文原文下面（旧实现把 data-journal-original 强制 visible，导致「外文在中文底下」）。 */
  function proseGroups(root) {
    var groups = [];
    root.querySelectorAll(".prose[lang]").forEach(function (section) {
      var last = groups[groups.length - 1];
      if (last && last.parent === section.parentNode && last.sections[last.sections.length - 1].nextElementSibling === section) {
        last.sections.push(section);
        return;
      }
      groups.push({ parent: section.parentNode, sections: [section] });
    });
    return groups;
  }

  /* 只在一个语言分组里存在媒体时（如 2026-10-31 的插图只写在中文 section 里），
     把媒体提为一组之内所有语言 section 的共享兄弟节点，保证切换到英/法/德后图片不会消失。 */
  function hoistUnsharedGroupMedia(root) {
    proseGroups(root).forEach(function (group) {
      var list = group.sections;
      if (list.length < 2) return;
      function mediaOf(section) {
        return Array.from(section.children).filter(function (el) {
          return el.matches("figure, .journal-media-prose, .journal-media-group, video");
        });
      }
      var media = list.map(mediaOf);
      var counts = media.map(function (nodes) { return nodes.length; });
      var same = counts.every(function (n) { return n === counts[0]; });
      if (same) return; /* 每个语言各带一份媒体，隐藏其他语言即自动去重 */
      var anchor = list[0];
      var seen = Object.create(null);
      var wrapper = null;
      media.forEach(function (nodes) {
        nodes.forEach(function (node) {
          var sig = Array.from(node.querySelectorAll("img,video")).map(function (m) {
            return m.getAttribute("src") || m.getAttribute("data-hls") || "";
          }).join("|") || node.className;
          if (seen[sig]) { node.remove(); return; }
          seen[sig] = true;
          if (node.matches(".journal-media-prose")) {
            anchor.parentNode.insertBefore(node, anchor);
            return;
          }
          if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.className = "journal-media-prose";
            anchor.parentNode.insertBefore(wrapper, anchor);
          }
          wrapper.appendChild(node);
        });
      });
    });
  }

  function applyProseLanguage(l) {
    if (!detailContent) return;
    proseGroups(detailContent).forEach(function (group) {
      var list = group.sections;
      var match = null;
      var fallback = null;
      list.forEach(function (section) {
        var code = sectionLangCode(section.getAttribute("lang"));
        if (!fallback && (section.hasAttribute("data-journal-original") || code === "zh")) fallback = section;
        if (!match && code === l) match = section;
      });
      var chosen = match || fallback || list[0];
      list.forEach(function (section) { section.hidden = section !== chosen; });
    });
  }

  function applyHeaderLanguage(l) {
    var c = copy[l];
    var header = detailContent && detailContent.querySelector(".journal-header");
    if (!header) return;
    var timeEl = header.querySelector("h1 time") || header.querySelector("time[data-journal-date]");
    if (timeEl) {
      if (timeEl.dataset.zhText === undefined) timeEl.dataset.zhText = timeEl.textContent;
      var iso = (currentEntry && currentEntry.date) || timeEl.getAttribute("datetime") || "";
      if (iso) timeEl.setAttribute("datetime", iso);
      var localized = l === "zh" ? "" : fmtLongDate(iso, l);
      timeEl.textContent = localized || timeEl.dataset.zhText;
    }
    var locationEl = header.querySelector("[data-journal-location]") || header.querySelector(".subtitle");
    if (locationEl) {
      if (locationEl.dataset.zhText === undefined) locationEl.dataset.zhText = locationEl.textContent;
      var loc = currentEntry && currentEntry.locales && currentEntry.locales[l] && currentEntry.locales[l].location;
      locationEl.textContent = (l !== "zh" && loc) ? loc : locationEl.dataset.zhText;
    }
    detailContent.querySelectorAll("[data-journal-copy]").forEach(function (node) {
      var key = node.getAttribute("data-journal-copy");
      var label = key === "location" ? c.locationLabel : key === "note" ? c.noteLabel : key === "sourceNote" ? c.sourceNoteLabel : "";
      if (label) node.textContent = label;
    });
  }

  /* PDF 来源载荷：正文块在 .journal-body[data-journal-block-index] 里，
     四语文字存于 <script id="journalI18n"> 的 locales[lang].blocks（段落数一一对应）。 */
  function applyBlockLanguage(l) {
    if (!currentI18n || !detailContent) return;
    var locale = currentI18n.locales && currentI18n.locales[l];
    if (!locale || !Array.isArray(locale.blocks)) return;
    detailContent.querySelectorAll("[data-journal-block-index]").forEach(function (block) {
      var index = Number(block.getAttribute("data-journal-block-index"));
      if (!isFinite(index)) return;
      var target = block.querySelector("p") || block;
      if (!target) return;
      if (target.dataset.zhText === undefined) target.dataset.zhText = target.textContent;
      var text = l === "zh" ? target.dataset.zhText : locale.blocks[index];
      if (typeof text === "string") target.textContent = text;
    });
  }

  function applyLanguage() {
    var l = lang();
    if (detailContent) {
      applyProseLanguage(l);
      applyHeaderLanguage(l);
      applyBlockLanguage(l);
      applyLeafLabels(l);
    }
    if (backBtn) backBtn.textContent = copy[l].back;
  }

  /* 非正文的成块中文：聊天记录标题、时光轴小标题、插图说明等，按语言替换；
     只对已知文案生效，作者自己写的正文不动。 */
  var LEAF_COPY = {
    "微信聊天记录": ["WeChat chat history", "Historique de discussion WeChat", "WeChat-Chatverlauf"],
    "时光轴记录": ["Timeline entry", "Entrée de la chronologie", "Zeitleisten-Eintrag"],
    "时间线": ["Timeline", "Chronologie", "Zeitleiste"],
    "三个 Agent": ["Three agents", "Trois agents", "Drei Agenten"],
    "【影视推荐】": ["【Film & TV picks】", "【Sélection cinéma et séries】", "【Film- und Serientipps】"],
    "今天的插图": ["Today’s illustration", "Illustration du jour", "Heutige Illustration"]
  };
  var LEAF_IDX = { en: 0, fr: 1, de: 2 };

  function applyLeafLabels(l) {
    if (!detailContent) return;
    detailContent.querySelectorAll("h2, h3, figcaption").forEach(function (node) {
      var key = node.dataset.zhLabel;
      if (key === undefined) {
        var text = node.textContent.trim();
        if (!LEAF_COPY[text]) return;
        node.dataset.zhLabel = text;
        key = text;
      }
      if (!LEAF_COPY[key]) return;
      node.textContent = l === "zh" ? key : LEAF_COPY[key][LEAF_IDX[l]];
    });
    detailContent.querySelectorAll(".journal-dialogue").forEach(function (node) {
      node.hidden = l !== "zh";
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
  let currentEntry = null;
  let currentI18n = null;

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
    currentEntry = null;
    currentI18n = null;
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
    currentEntry = entry;
    setJournalRoute(entry.date, false);
    detailContent.innerHTML = `<p class="journal-reader__loading">${c.loading}</p>`;
    showDetail();

    const articleUrl = new URL(assetUrl(entry.file));
    articleUrl.searchParams.set("v", "20261101-i18n2");
    fetch(articleUrl.href, { cache: "no-store" })
      .then(r => { if (!r.ok) throw new Error("not found"); return r.text(); })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        /* extract article content */
        const article = doc.querySelector(".journal-article");
        if (!article) { detailContent.innerHTML = `<p class="journal-reader__error">${c.error}</p>`; return; }

        /* PDF 来源载荷的四语正文存在 #journalI18n 里（它是 .journal-article 的兄弟节点）；
           下面会把所有 script 移掉，先读出来备用。 */
        const i18nScript = doc.querySelector("#journalI18n") || article.querySelector("#journalI18n");
        currentI18n = null;
        if (i18nScript) {
          try { currentI18n = JSON.parse(i18nScript.textContent); } catch (_) { currentI18n = null; }
        }

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
        normalizeJournalBodyFigures(article);
        separateMixedMedia(article);
        layoutJournalMedia(article);
        layoutJournalVideos(article);
        hoistUnsharedGroupMedia(article);

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

        /* 只显示当前界面语言的正文（无译文时回退中文原文），并同步标题/地点/返回按钮 */
        applyLanguage();
      })
      .catch(() => {
        var message = isFileProtocol() ? c.localOnly : c.error;
        detailContent.innerHTML = `<p class="journal-reader__error">${message}</p>`;
      });
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

    if (!window.MMVJournalData) {
      listView.classList.remove("is-loading");
      listView.textContent = isFileProtocol() ? c.localOnly : c.error;
      return;
    }
    window.MMVJournalData.load().then(entries => {
      listView.classList.remove("is-loading");
      if (!entries.length) { listView.textContent = isFileProtocol() ? c.localOnly : c.error; return; }

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
    }).catch(() => {
      listView.classList.remove("is-loading");
      listView.textContent = isFileProtocol() ? copy[lang()].localOnly : copy[lang()].error;
    });
  }

  if (listView) { listView.textContent = copy[lang()].loading; }
  window.renderJournals = render;
  /* script.js 的 uil() 切换语言时调用，把已打开的阅读器一起换语（正文/标题/地点/返回按钮） */
  window.MMVJournalLang = { apply: applyLanguage };
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
