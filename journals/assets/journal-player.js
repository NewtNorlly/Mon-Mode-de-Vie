(() => {
  "use strict";
  const loaded = new WeakSet();
  const instances = new WeakMap();

  function disableUnsafePictureInPicture(video) {
    // Some Chromium builds advertise Picture-in-Picture support but crash the
    // renderer when it is entered. A process crash cannot be caught in JS, so
    // keep the stable playback and fullscreen paths and opt this video out.
    video.disablePictureInPicture = true;
    video.setAttribute("disablepictureinpicture", "");
  }

  function enhance(video) {
    if (loaded.has(video)) return;
    loaded.add(video);
    disableUnsafePictureInPicture(video);
    const hlsSource = video.dataset.hls;
    const fallback = video.dataset.fallback || video.currentSrc || video.src;
    let hls = null;
    function useFallback() { if (fallback && video.src !== fallback) { video.src = fallback; video.load(); } }
    if (hlsSource && video.canPlayType("application/vnd.apple.mpegurl")) video.src = hlsSource;
    else if (hlsSource && window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({ enableWorker:true, startLevel:-1, capLevelToPlayerSize:true });
      hls.loadSource(hlsSource); hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        else { hls.destroy(); hls = null; useFallback(); }
      });
    }
    video.addEventListener("error", useFallback, { once:true });
    const player = window.Plyr ? new window.Plyr(video, { controls:["play-large","play","progress","current-time","mute","volume","settings","fullscreen"], settings:["quality","speed"], seekTime:10, keyboard:{focused:true,global:false}, tooltips:{controls:true,seek:true} }) : null;
    instances.set(video, { player, hls });
  }

  function destroyAll(root = document) {
    const videos = root.matches && root.matches("video") ? [root] : Array.from(root.querySelectorAll("video"));
    videos.forEach(video => {
      const instance = instances.get(video);
      try { video.pause(); } catch (_) {}
      if (instance) {
        try { if (instance.hls) instance.hls.destroy(); } catch (_) {}
        try { if (instance.player) instance.player.destroy(); } catch (_) {}
        instances.delete(video);
      }
      loaded.delete(video);
    });
  }
  window.MMVJournalPlayer = {
    enhanceAll(root = document) { root.querySelectorAll("video").forEach(enhance); },
    destroyAll
  };
})();
