(() => {
  let journalPromise;

  function isSafeJournalAsset(path) {
    return typeof path === "string" && !/^(?:data|javascript):/i.test(path);
  }

  function normalizeEntry(entry) {
    if (!entry || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date || "")) return null;
    if (!/^[\w-]+\.html$/i.test(entry.file || "")) return null;
    return {
      ...entry,
      images: Array.isArray(entry.images)
        ? entry.images.filter((image) => image && isSafeJournalAsset(image.file))
        : [],
    };
  }

  function load() {
    if (!journalPromise) {
      const embedded = Array.isArray(window.MMV_JOURNALS)
        ? Promise.resolve(window.MMV_JOURNALS)
        : fetch("./journals/data/journals.json", { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error(`Journal data: ${response.status}`);
          return response.json();
        });
      journalPromise = embedded.then((entries) => {
          if (!Array.isArray(entries)) throw new Error("Journal data is not an array");
          return entries
            .map(normalizeEntry)
            .filter(Boolean)
            .sort((left, right) => right.date.localeCompare(left.date));
      });
    }
    return journalPromise;
  }

  window.MMVJournalData = Object.freeze({ load });
})();
