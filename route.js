(() => {
  "use strict";
  function parts() { return decodeURIComponent(location.hash.slice(1)).split("/").filter(Boolean); }
  function set(next, replace) {
    const hash = "#" + next.map(encodeURIComponent).join("/");
    if (location.hash === hash) return;
    history[replace ? "replaceState" : "pushState"](null, "", hash);
  }
  window.MMVRoute = { parts, set };
})();
