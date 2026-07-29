(() => {
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
  const copies = {
    zh: {
      archive: "返回 Journal",
      backHome: "返回 Mon Mode de Vie",
      location: "定位",
      previousEntry: "上一篇",
      nextEntry: "下一篇",
      light: "浅色",
      dark: "深色",
      toLight: "切换为浅色模式",
      toDark: "切换为深色模式",
      language: "正文语言",
      journalNavigation: "日志导航",
      siteNavigation: "站点导航",
      adjacentEntries: "相邻日志",
      note: "笔记",
      sourceNote: "原书注",
      sourceBook: "《朝花夕拾小故事（乙巳年第壹册）》",
      sourceChapter: "第 3 章 · 永生难忘的日志",
      textOnly: "纯文字",
      images: (count) => `${count} 幅图片`,
    },
    en: {
      archive: "Back to Journal",
      backHome: "Back to Mon Mode de Vie",
      location: "Place",
      previousEntry: "Previous entry",
      nextEntry: "Next entry",
      light: "Light",
      dark: "Dark",
      toLight: "Switch to light mode",
      toDark: "Switch to dark mode",
      language: "Journal language",
      journalNavigation: "Journal navigation",
      siteNavigation: "Site navigation",
      adjacentEntries: "Adjacent journal entries",
      note: "Note",
      sourceNote: "Original note",
      sourceBook: "Morning Blossoms Gathered at Dusk: Little Stories (Yisi Year, Book I)",
      sourceChapter: "Chapter 3 · Unforgettable Journals",
      textOnly: "Text only",
      images: (count) => `${count} image${count === 1 ? "" : "s"}`,
    },
    fr: {
      archive: "Retour au Journal",
      backHome: "Retour à Mon Mode de Vie",
      location: "Lieu",
      previousEntry: "Entrée précédente",
      nextEntry: "Entrée suivante",
      light: "Clair",
      dark: "Sombre",
      toLight: "Passer au mode clair",
      toDark: "Passer au mode sombre",
      language: "Langue du journal",
      journalNavigation: "Navigation du journal",
      siteNavigation: "Navigation du site",
      adjacentEntries: "Entrées voisines",
      note: "Note",
      sourceNote: "Note du texte original",
      sourceBook: "Petites histoires de Fleurs du matin cueillies le soir (année Yisi, livre I)",
      sourceChapter: "Chapitre 3 · Journaux inoubliables",
      textOnly: "Texte seul",
      images: (count) => `${count} image${count === 1 ? "" : "s"}`,
    },
    de: {
      archive: "Zurück zum Journal",
      backHome: "Zurück zu Mon Mode de Vie",
      location: "Ort",
      previousEntry: "Vorheriger Eintrag",
      nextEntry: "Nächster Eintrag",
      light: "Hell",
      dark: "Dunkel",
      toLight: "Zum hellen Modus wechseln",
      toDark: "Zum dunklen Modus wechseln",
      language: "Tagebuchsprache",
      journalNavigation: "Tagebuchnavigation",
      siteNavigation: "Seitennavigation",
      adjacentEntries: "Benachbarte Einträge",
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
})();
