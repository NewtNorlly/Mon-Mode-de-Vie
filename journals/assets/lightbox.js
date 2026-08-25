/* ═══════════════════════════════════════════════
   Mon Mode de Vie — Diary Lightbox v2
   Handles all images within journal content areas
   (.prose, .journal-body):
   · [data-jlb] 九宫格 → opens WebP from data-jlb
   · figure.journal-illustration img → opens original src
   · figure.journal-figure img → opens original src
   · any other img in content → opens its src
   List thumbnails & 去年今日 cards unaffected.
   ═══════════════════════════════════════════════ */
(function(){
  if (window.MMVJournalLightbox) { window.MMVJournalLightbox.scan(); return; }
  var orphanShield = document.getElementById('jlbShield');
  if (orphanShield && orphanShield.parentNode) orphanShield.parentNode.removeChild(orphanShield);

  /* ── Shield DOM ── */
  var shield = document.createElement('div');
  shield.id = 'jlbShield';
  shield.setAttribute('role','dialog');
  shield.setAttribute('aria-label','图片灯箱');
  shield.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.25);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;visibility:hidden;opacity:0;pointer-events:none';

  var closeBtn = document.createElement('button');
  closeBtn.id = 'jlbClose';
  closeBtn.setAttribute('aria-label','关闭');
  closeBtn.textContent = '\u00d7';
  closeBtn.style.cssText = 'position:fixed;top:16px;right:24px;z-index:1;padding:0;font-size:36px;color:#fff;background:none;border:none;cursor:pointer;line-height:1;opacity:.6';

  var lbImg = document.createElement('img');
  lbImg.id = 'jlbImage';
  lbImg.alt = '';
  lbImg.style.cssText = 'display:block;max-width:96vw;max-height:93vh;object-fit:contain;border-radius:8px;box-shadow:0 4px 32px rgba(0,0,0,.45);cursor:default';

  var lbVideo = document.createElement('video');
  lbVideo.id = 'jlbVideo'; lbVideo.controls = true; lbVideo.playsInline = true; lbVideo.preload = 'metadata';
  lbVideo.disablePictureInPicture = true; lbVideo.setAttribute('disablepictureinpicture', '');
  var prevBtn = document.createElement('button'); prevBtn.id = 'jlbPrev'; prevBtn.className = 'jlb-nav jlb-nav--prev'; prevBtn.setAttribute('aria-label','Previous media'); prevBtn.textContent = '\u2039';
  var nextBtn = document.createElement('button'); nextBtn.id = 'jlbNext'; nextBtn.className = 'jlb-nav jlb-nav--next'; nextBtn.setAttribute('aria-label','Next media'); nextBtn.textContent = '\u203a';
  var counter = document.createElement('span'); counter.id = 'jlbCounter'; counter.setAttribute('aria-live','polite');

  shield.appendChild(closeBtn);
  shield.appendChild(lbImg);
  shield.appendChild(lbVideo);
  shield.appendChild(prevBtn); shield.appendChild(nextBtn); shield.appendChild(counter);
  document.body.appendChild(shield);

  var items = [], activeIndex = 0, swapTimer = 0;

  function renderActive(direction) {
    if (!items.length) return;
    activeIndex = Math.max(0, Math.min(activeIndex, items.length - 1));
    var item = items[activeIndex];
    shield.classList.add('is-swapping');
    clearTimeout(swapTimer);
    swapTimer = setTimeout(function(){
      lbVideo.pause(); lbVideo.removeAttribute('src'); lbImg.removeAttribute('src');
      if (item.type === 'video') { lbVideo.src = item.src; lbVideo.hidden = false; lbImg.hidden = true; }
      else { lbImg.src = item.src; lbImg.alt = item.alt || ''; lbImg.hidden = false; lbVideo.hidden = true; }
      counter.textContent = (activeIndex + 1) + ' / ' + items.length;
      prevBtn.disabled = activeIndex === 0; nextBtn.disabled = activeIndex === items.length - 1;
      prevBtn.hidden = nextBtn.hidden = counter.hidden = items.length < 2;
      shield.classList.remove('is-swapping');
    }, shield.classList.contains('is-open') ? 90 : 0);
  }

  function openGroup(group, index) {
    try { items = JSON.parse(group.dataset.mediaItems || '[]'); } catch (_) { items = []; }
    if (!items.length) return;
    activeIndex = Number(index) || 0; renderActive();
    shield.style.visibility = ''; shield.style.opacity = ''; shield.style.pointerEvents = ''; shield.classList.add('is-open');
  }

  /* ── Open / Close ── */
  function open(src) {
    if (!src) return;
    items = [{type:'img',src:src,alt:''}]; activeIndex = 0; renderActive();
    shield.style.visibility = ''; shield.style.opacity = ''; shield.style.pointerEvents = ''; shield.classList.add('is-open');
  }

  function close() {
    shield.classList.remove('is-open');
    lbVideo.pause();
    setTimeout(function(){ lbImg.removeAttribute('src'); lbVideo.removeAttribute('src'); items=[]; }, 220);
  }

  function move(step) { var next=activeIndex+step; if(next<0||next>=items.length)return; activeIndex=next; renderActive(step); }

  closeBtn.onclick = close;
  prevBtn.onclick = function(){move(-1);}; nextBtn.onclick = function(){move(1);};
  closeBtn.onmouseenter = function(){ closeBtn.style.opacity = '1'; };
  closeBtn.onmouseleave = function(){ closeBtn.style.opacity = '0.6'; };
  shield.addEventListener('click', function(e) { if (e.target === shield) close(); });
  document.addEventListener('keydown', function(e) {
    if (!shield.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
  });

  /* ── Delegate click on each content container ── */
  function bindContainer(el) {
    if (el._jlbBound) return;
    el._jlbBound = true;

    el.addEventListener('click', function(e) {
      var target = e.target;
      var mediaItem = target.closest('.journal-media-item');
      if (mediaItem) {
        /* Native video controls must keep their own click/pointer events. */
        if (target.closest('video')) return;
        e.preventDefault(); e.stopPropagation(); openGroup(mediaItem.closest('.journal-media-group'), mediaItem.dataset.mediaIndex); return;
      }

      /* Case 1: clicked on or inside [data-jlb] (九宫格 thumbnail wrapper) */
      var jlbWrap = target.closest('[data-jlb]');
      if (jlbWrap) {
        e.preventDefault();
        e.stopPropagation();
        var src = jlbWrap.getAttribute('data-jlb');
        if (src) open(src);
        return;
      }

      /* Case 2: clicked directly on an <img> (not inside [data-jlb]) */
      if (target.tagName === 'IMG') {
        if (target.closest('[data-jlb]')) return;
        /* Skip tiny decorative images */
        if (target.naturalWidth > 0 && target.naturalWidth < 40) return;
        e.preventDefault();
        e.stopPropagation();
        open(target.src);
        return;
      }
    });
    el.addEventListener('keydown', function(e){var mediaItem=e.target.closest&&e.target.closest('.journal-media-item');if(mediaItem&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openGroup(mediaItem.closest('.journal-media-group'),mediaItem.dataset.mediaIndex);}});
  }

  /* ── Scan for journal content containers ── */
  var CONTENT_SELECTOR = '.prose, .journal-body, .journal-media-prose';
  function scan() {
    var sections = document.querySelectorAll(CONTENT_SELECTOR);
    for (var i = 0; i < sections.length; i++) {
      bindContainer(sections[i]);
    }
  }

  window.MMVJournalLightbox = { scan: scan };

  /* ── Init ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan, { once: true });
  } else {
    scan();
  }

  /* ── Expose for programmatic use ── */
  window._jlbOpen = open;
  window._jlbClose = close;
})();
