(() => {
  const standaloneMatch = location.pathname.match(/\/journals\/(\d{4}-\d{2}-\d{2})\.html$/);
  if (standaloneMatch && window.top === window.self) {
    document.documentElement.style.visibility = "hidden";
    location.replace(`../index.html#journal/${standaloneMatch[1]}`);
    return;
  }
  const root = document.documentElement;
  const themeButton = document.querySelector("[data-theme-toggle]");
  const storageKeys = {
    mode: "mmv-mode",
    theme: "mmv-theme",
    language: "mmv-language",
  };
  const localeNames = {
    zh: "中文",
    en: "English",
    fr: "Français",
    de: "Deutsch",
  };
  const dateLocales = {
    zh: "zh-CN",
    en: "en-GB",
    fr: "fr-FR",
    de: "de-DE",
  };
  const vocabTranslations = {
    Gut: { en: "good", fr: "bon", de: "gut" }, also: { en: "so, therefore", fr: "donc, alors", de: "also" }, dann: { en: "then", fr: "puis, alors", de: "dann" }, nehmen: { en: "to take; to order", fr: "prendre ; commander", de: "nehmen; bestellen" }, wir: { en: "we", fr: "nous", de: "wir" },
    "ein Stück": { en: "a piece, a slice", fr: "un morceau, une part", de: "ein Stück" }, Marmorkuchen: { en: "marble cake", fr: "gâteau marbré", de: "Marmorkuchen" }, und: { en: "and", fr: "et", de: "und" }, Erdbeersahnetorte: { en: "strawberry cream cake", fr: "gâteau à la fraise et à la crème", de: "Erdbeersahnetorte" }, Kellner: { en: "waiter", fr: "serveur", de: "Kellner" },
    zahlen: { en: "to pay", fr: "payer", de: "zahlen" }, zusammen: { en: "together", fr: "ensemble", de: "zusammen" }, oder: { en: "or", fr: "ou", de: "oder" }, getrennt: { en: "separately", fr: "séparément", de: "getrennt" }, Entschuldigung: { en: "excuse me; sorry", fr: "excusez-moi ; pardon", de: "Entschuldigung" }, Platz: { en: "place, seat", fr: "place, siège", de: "Platz" },
    noch: { en: "still; another", fr: "encore", de: "noch" }, bezahlen: { en: "to pay", fr: "payer", de: "bezahlen" }, "die Rechnung": { en: "the bill", fr: "l’addition", de: "die Rechnung" }, bestellen: { en: "to order", fr: "commander", de: "bestellen" }, möchten: { en: "would like", fr: "aimerait", de: "möchten" }, gern: { en: "gladly; like to", fr: "volontiers", de: "gern" },
    "das Trinkgeld": { en: "the tip", fr: "le pourboire", de: "das Trinkgeld" }, "die Speisekarte": { en: "the menu", fr: "la carte", de: "die Speisekarte" }, bringen: { en: "to bring", fr: "apporter", de: "bringen" }, "der Kaffee": { en: "coffee", fr: "le café", de: "der Kaffee" }, "der Tee": { en: "tea", fr: "le thé", de: "der Tee" }, "das Glas": { en: "glass", fr: "le verre", de: "das Glas" }, "die Tasse": { en: "cup", fr: "la tasse", de: "die Tasse" }, "das Wasser": { en: "water", fr: "l’eau", de: "das Wasser" }, "der Saft": { en: "juice", fr: "le jus", de: "der Saft" }, "das Eis": { en: "ice cream", fr: "la glace", de: "das Eis" },
    "die Mahlzeit": { en: "meal", fr: "le repas", de: "die Mahlzeit" }, Deutschland: { en: "Germany", fr: "l’Allemagne", de: "Deutschland" }, "die Hauptmahlzeit": { en: "main meal", fr: "le repas principal", de: "die Hauptmahlzeit" }, "das Mittagessen": { en: "lunch", fr: "le déjeuner", de: "das Mittagessen" }, "die Uhr": { en: "clock; o’clock", fr: "l’horloge ; heure", de: "die Uhr" }, "das Fleisch": { en: "meat", fr: "la viande", de: "das Fleisch" }, "das Gemüse": { en: "vegetables", fr: "les légumes", de: "das Gemüse" }, "die Kartoffel": { en: "potato", fr: "la pomme de terre", de: "die Kartoffel" }, "die Schule": { en: "school", fr: "l’école", de: "die Schule" }, "das Geschäft": { en: "shop; business", fr: "le magasin ; l’entreprise", de: "das Geschäft" }, "das Büro": { en: "office", fr: "le bureau", de: "das Büro" }, "die Mittagspause": { en: "lunch break", fr: "la pause déjeuner", de: "die Mittagspause" }, "die Kantine": { en: "canteen", fr: "la cantine", de: "die Kantine" }, "das Restaurant": { en: "restaurant", fr: "le restaurant", de: "das Restaurant" }, zwischen: { en: "between", fr: "entre", de: "zwischen" }, mittags: { en: "at noon", fr: "à midi", de: "mittags" }, essen: { en: "to eat", fr: "manger", de: "essen" }, man: { en: "one; people", fr: "on", de: "man" }, warm: { en: "warm", fr: "chaud", de: "warm" }, "bestehen aus": { en: "to consist of", fr: "se composer de", de: "bestehen aus" }, da: { en: "there; since", fr: "là ; puisque", de: "da" }, aus: { en: "from; out of", fr: "de ; en", de: "aus" }, machen: { en: "to make; to do", fr: "faire", de: "machen" }, oft: { en: "often", fr: "souvent", de: "oft" }, viele: { en: "many", fr: "beaucoup de", de: "viele" }, "zu Hause": { en: "at home", fr: "à la maison", de: "zu Hause" }, andere: { en: "other", fr: "autre", de: "andere" }, gehen: { en: "to go", fr: "aller", de: "gehen" }, nicht: { en: "not", fr: "ne… pas", de: "nicht" }, "nach Hause": { en: "homeward; home", fr: "à la maison", de: "nach Hause" }, sondern: { en: "but rather", fr: "mais plutôt", de: "sondern" },
  };
  const copies = {
    zh: {
      archive: "返回 Journal",
      backHome: "返回 Mon Mode de Vie",
      location: "定位",
      light: "浅色",
      dark: "深色",
      toLight: "切换为浅色模式",
      toDark: "切换为深色模式",
      language: "正文语言",
      journalNavigation: "日记导航",
      siteNavigation: "站点导航",
      note: "笔记",
      sourceNote: "原书注",
      sourceBook: "《朝花夕拾小故事（乙巳年第壹册）》",
      sourceChapter: "第 3 章 · 永生难忘的日记",
      textOnly: "纯文字",
      images: (count) => `${count} 幅图片`,
    },
    en: {
      archive: "Back to the Journal",
      backHome: "Back to Mon Mode de Vie",
      location: "Place",
      light: "Light",
      dark: "Dark",
      toLight: "Switch to light mode",
      toDark: "Switch to dark mode",
      language: "Entry language",
      journalNavigation: "Journal navigation",
      siteNavigation: "Site navigation",
      note: "Note",
      sourceNote: "Original note",
      sourceBook: "Morning Blossoms Gathered at Dusk: Little Stories (Yisi Year, Book I)",
      sourceChapter: "Chapter 3 · Unforgettable Journals",
      textOnly: "Text only",
      images: (count) => `${count} image${count === 1 ? "" : "s"}`,
    },
    fr: {
      archive: "Retour au journal",
      backHome: "Retour à Mon Mode de Vie",
      location: "Lieu",
      light: "Clair",
      dark: "Sombre",
      toLight: "Passer au mode clair",
      toDark: "Passer au mode sombre",
      language: "Langue du journal",
      journalNavigation: "Navigation du journal",
      siteNavigation: "Navigation du site",
      note: "Note",
      sourceNote: "Note du texte original",
      sourceBook: "Petites histoires de Fleurs du matin cueillies au soir (année Yisi, livre I)",
      sourceChapter: "Chapitre 3 · Journaux inoubliables",
      textOnly: "Texte seul",
      images: (count) => `${count} image${count === 1 ? "" : "s"}`,
    },
    de: {
      archive: "Zurück zum Journal",
      backHome: "Zurück zu Mon Mode de Vie",
      location: "Ort",
      light: "Hell",
      dark: "Dunkel",
      toLight: "Zum hellen Modus wechseln",
      toDark: "Zum dunklen Modus wechseln",
      language: "Tagebuchsprache",
      journalNavigation: "Tagebuchnavigation",
      siteNavigation: "Seitennavigation",
      note: "Notiz",
      sourceNote: "Anmerkung im Original",
      sourceBook: "Kleine Geschichten aus Am Abend gesammelte Morgenblüten (Yisi-Jahr, Band I)",
      sourceChapter: "Kapitel 3 · Unvergessliche Tagebücher",
      textOnly: "Nur Text",
      images: (count) => `${count} Bild${count === 1 ? "" : "er"}`,
    },
  };

  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) {}
  }

  function readJsonScript(id) {
    const node = document.getElementById(id);
    if (!node) return null;
    try {
      return JSON.parse(node.textContent || "null");
    } catch (_) {
      return null;
    }
  }

  const themeData = window.MMV_JOURNAL_THEME_DATA;
  const themes = (() => {
    if (!themeData || !Array.isArray(themeData.keys) || !Array.isArray(themeData.rows)) return {};
    return Object.fromEntries(
      themeData.rows.map(([id, preview, light, dark]) => [
        id,
        {
          id,
          preview,
          light: Object.fromEntries(themeData.keys.map((key, index) => [key, light[index]])),
          dark: Object.fromEntries(themeData.keys.map((key, index) => [key, dark[index]])),
        },
      ]),
    );
  })();

  const storedLanguage = readStorage(storageKeys.language);
  const storedMode = readStorage(storageKeys.mode);
  const storedTheme = readStorage(storageKeys.theme);
  const state = {
    language: copies[storedLanguage] ? storedLanguage : "zh",
    mode: storedMode === "light" || storedMode === "dark"
      ? storedMode
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    theme: themes[storedTheme] ? storedTheme : "neko",
  };
  const articleI18n = readJsonScript("journalI18n");
  const archiveI18n = readJsonScript("journalArchiveI18n");

  function layoutJournalMedia(rootNode) {
    rootNode.querySelectorAll(".prose, .journal-body").forEach(function(section) {
      var figures = Array.from(section.children).filter(function(el) { return el.matches("figure") && el.querySelector("img, video"); });
      var consumed = new Set();
      figures.forEach(function(first) {
        if (consumed.has(first)) return;
        var run = [first], next = first.nextElementSibling;
        while (next && next.matches("figure") && next.querySelector("img, video")) { run.push(next); next = next.nextElementSibling; }
        var media = [], captions = [];
        run.forEach(function(figure) {
          figure.querySelectorAll("img, video").forEach(function(node) { media.push(node); });
          figure.querySelectorAll("figcaption").forEach(function(node) { var value=node.textContent.trim(); if(value) captions.push(value); });
          consumed.add(figure);
        });
        if (!media.length) return;
        var group=document.createElement("figure");
        group.className="journal-media-group journal-media-group--"+(media.length===1?"single":media.length<=4?"quad":"nine");
        group.dataset.mediaCount=media.length;
        group.dataset.mediaItems=JSON.stringify(media.map(function(node){return{type:node.tagName.toLowerCase(),src:node.currentSrc||node.src||node.getAttribute("src"),alt:node.alt||node.title||""};}));
        var grid=document.createElement("div"); grid.className="journal-media-grid";
        media.slice(0,9).forEach(function(node,index){
          var item=document.createElement("div"); item.className="journal-media-item";item.dataset.mediaIndex=index;item.tabIndex=0;item.setAttribute("role","button");
          node.removeAttribute("style");
          if(node.tagName==="IMG"){node.loading="lazy";node.decoding="async";}
          if(node.tagName==="VIDEO"){node.preload="metadata";node.controls=true;node.setAttribute("playsinline","");node.setAttribute("webkit-playsinline","");item.classList.add("is-video");}
          item.appendChild(node);
          if(index===8&&media.length>9){var more=document.createElement("span");more.className="journal-media-more";more.textContent="+"+(media.length-9);item.appendChild(more);}
          grid.appendChild(item);
        });
        group.appendChild(grid);
        if(captions.length===1){var caption=document.createElement("figcaption");caption.textContent=captions[0];group.appendChild(caption);}
        first.replaceWith(group);run.slice(1).forEach(function(figure){figure.remove();});
      });
    });
  }

  function hsl(value) {
    return `hsl(${value})`;
  }

  function updateThemeButton() {
    if (!themeButton) return;
    const copy = copies[state.language];
    const isDark = state.mode === "dark";
    themeButton.textContent = isDark ? copy.light : copy.dark;
    themeButton.setAttribute("aria-pressed", String(isDark));
    themeButton.setAttribute("aria-label", isDark ? copy.toLight : copy.toDark);
  }

  function applyTheme() {
    const theme = themes[state.theme] || themes.neko;
    if (theme) {
      state.theme = theme.id;
      const variant = theme[state.mode];
      const journalTokens = {
        page: variant.background,
        paper: variant.card,
        ink: variant["card-foreground"],
        muted: variant["muted-foreground"],
        faint: variant["muted-foreground"],
        line: variant.border,
        accent: variant["accent-foreground"],
        "accent-soft": variant.accent,
        note: variant.secondary,
        "media-matte": variant.background,
      };
      Object.entries(journalTokens).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, hsl(value));
      });
      root.style.setProperty(
        "--shadow",
        state.mode === "dark"
          ? `0 24px 72px hsl(${variant.background} / 0.42)`
          : `0 20px 60px hsl(${variant.foreground} / 0.10)`,
      );
    }
    root.dataset.theme = state.theme;
    root.dataset.mode = state.mode;
    root.style.colorScheme = state.mode;
    updateThemeButton();
  }

  function parseDate(isoDate) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || "");
    if (!match) return null;
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  }

  function formatDate(isoDate) {
    const parsed = parseDate(isoDate);
    if (!parsed) return isoDate;
    return new Intl.DateTimeFormat(dateLocales[state.language], {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(parsed);
  }

  function localizedValue(primary, fallback) {
    if (typeof primary === "string" && primary.length) return { value: primary, fallback: false };
    return { value: typeof fallback === "string" ? fallback : "", fallback: true };
  }

  function setLocalizedText(node, primary, fallback) {
    if (!node) return;
    const selected = localizedValue(primary, fallback);
    node.textContent = selected.value;
    if (state.language !== "zh" && selected.fallback) node.lang = "zh-CN";
    else node.removeAttribute("lang");
  }

  function applyStaticCopy() {
    const copy = copies[state.language];
    document.querySelectorAll("[data-journal-copy]").forEach((node) => {
      const translated = copy[node.dataset.journalCopy];
      if (typeof translated === "string") node.textContent = translated;
    });
    document.querySelectorAll("[data-journal-copy-aria-label]").forEach((node) => {
      const translated = copy[node.dataset.journalCopyAriaLabel];
      if (typeof translated === "string") node.setAttribute("aria-label", translated);
    });
  }

  function applyDates() {
    document.querySelectorAll("[data-journal-date]").forEach((node) => {
      const isoDate = node.getAttribute("datetime");
      if (isoDate) node.textContent = formatDate(isoDate);
    });
  }

  function applyArticleLanguage() {
    if (!articleI18n || !articleI18n.locales) return;
    const original = articleI18n.locales.zh || {};
    const selected = articleI18n.locales[state.language] || original;

    setLocalizedText(
      document.querySelector("[data-journal-location]"),
      selected.location,
      original.location,
    );
    setLocalizedText(
      document.querySelector("[data-journal-source-label]"),
      selected.sourceLabel,
      original.sourceLabel,
    );

    document.querySelectorAll("[data-journal-block-index]").forEach((container) => {
      const index = Number(container.dataset.journalBlockIndex);
      const target = container.matches("p")
        ? container
        : container.querySelector(container.matches("pre") ? "code" : "p");
      setLocalizedText(target, selected.blocks?.[index], original.blocks?.[index]);
    });

    document.querySelectorAll("[data-journal-image-caption]").forEach((node) => {
      const index = Number(node.dataset.journalImageCaption);
      setLocalizedText(node, selected.imageCaptions?.[index], original.imageCaptions?.[index]);
    });
    document.querySelectorAll("[data-journal-image-alt]").forEach((image) => {
      const index = Number(image.dataset.journalImageAlt);
      const caption = localizedValue(selected.imageCaptions?.[index], original.imageCaptions?.[index]);
      image.alt = caption.value;
    });
    document.querySelectorAll("[data-journal-image-source]").forEach((node) => {
      const index = Number(node.dataset.journalImageSource);
      setLocalizedText(node, selected.imageSources?.[index], original.imageSources?.[index]);
    });

    const firstParagraphIndex = Array.from(document.querySelectorAll("[data-journal-block-index]"))
      .findIndex((node) => node.matches("p"));
    const description = localizedValue(
      selected.blocks?.[firstParagraphIndex],
      original.blocks?.[firstParagraphIndex],
    ).value;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) metaDescription.content = description.slice(0, 160);
    document.title = `${formatDate(articleI18n.date)} · Journal · Mon Mode de Vie`;
  }

  function applyArchiveLanguage() {
    if (!archiveI18n || !Array.isArray(archiveI18n.entries)) return;
    const byDate = new Map(archiveI18n.entries.map((entry) => [entry.date, entry]));
    const copy = copies[state.language];
    document.querySelectorAll("[data-journal-entry-date]").forEach((card) => {
      const entry = byDate.get(card.dataset.journalEntryDate);
      if (!entry?.locales) return;
      const original = entry.locales.zh || {};
      const selected = entry.locales[state.language] || original;
      setLocalizedText(card.querySelector("[data-entry-location]"), selected.location, original.location);
      setLocalizedText(card.querySelector("[data-entry-excerpt]"), selected.excerpt, original.excerpt);
      setLocalizedText(
        card.querySelector("[data-entry-source-label]"),
        selected.sourceLabel,
        original.sourceLabel,
      );
      const countNode = card.querySelector("[data-entry-image-count]");
      const count = Number(countNode?.dataset.entryImageCount || 0);
      if (countNode) countNode.textContent = count ? copy.images(count) : copy.textOnly;
    });
  }

  function updateLanguageControls() {
    document.querySelectorAll("[data-language-choice]").forEach((button) => {
      const isSelected = button.dataset.languageChoice === state.language;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
      button.setAttribute("aria-label", localeNames[button.dataset.languageChoice] || button.textContent);
      button.title = localeNames[button.dataset.languageChoice] || "";
    });
  }

  function applyLanguage() {
    root.lang = dateLocales[state.language];
    applyStaticCopy();
    applyDates();
    applyArticleLanguage();
    document.querySelectorAll(".vocab-card tr").forEach((row) => {
      const term = row.querySelector(".vc-de")?.textContent.trim();
      const meaning = row.querySelector(".vc-zh");
      if (!meaning) return;
      if (!meaning.dataset.originalMeaning) meaning.dataset.originalMeaning = meaning.textContent.trim();
      const translated = state.language === "zh"
        ? meaning.dataset.originalMeaning
        : vocabTranslations[term]?.[state.language];
      if (translated) meaning.textContent = translated;
    });
    applyArchiveLanguage();
    updateLanguageControls();
    updateThemeButton();
  }

  document.querySelectorAll("[data-language-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const language = button.dataset.languageChoice;
      if (!copies[language] || language === state.language) return;
      state.language = language;
      writeStorage(storageKeys.language, language);
      applyLanguage();
    });
  });

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      state.mode = state.mode === "dark" ? "light" : "dark";
      writeStorage(storageKeys.mode, state.mode);
      applyTheme();
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === storageKeys.language && copies[event.newValue]) {
      state.language = event.newValue;
      applyLanguage();
    }
    if (event.key === storageKeys.mode && (event.newValue === "light" || event.newValue === "dark")) {
      state.mode = event.newValue;
      applyTheme();
    }
    if (event.key === storageKeys.theme && themes[event.newValue]) {
      state.theme = event.newValue;
      applyTheme();
    }
  });

  window.addEventListener("pageshow", () => {
    const language = readStorage(storageKeys.language);
    const mode = readStorage(storageKeys.mode);
    const theme = readStorage(storageKeys.theme);
    if (copies[language]) state.language = language;
    if (mode === "light" || mode === "dark") state.mode = mode;
    if (themes[theme]) state.theme = theme;
    applyTheme();
    applyLanguage();
  });

  applyTheme();
  applyLanguage();
  layoutJournalMedia(document);
  document.querySelectorAll('iframe[src*="gallery.html"]').forEach(function(frame){var src=frame.getAttribute('src');if(src&&!src.includes('v=20260812-media2'))frame.src=src.replace('gallery.html','gallery.html?v=20260812-media2');});

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
