// Lightweight gallery/lightbox for portfolio pages
document.addEventListener('DOMContentLoaded', function(){
  // collect portfolio items (exclude grouped modules which are handled separately);
  // support items that either have data-src or contain an <img>
  const rawItems = Array.from(document.querySelectorAll('.portfolio-item:not(.portfolio-group)'));

  // Normalize a path by encoding each path segment but preserving protocol and querystring
  function normalizeSrc(src){
    if(!src) return src;
    // If already an absolute URL or data/blob, return as-is
    if(/^(data:|blob:|https?:|file:)/i.test(src)) return src;
    // split querystring
    const parts = src.split('?');
    const path = parts[0];
    const query = parts.length > 1 ? '?' + parts.slice(1).join('?') : '';
    // normalize backslashes and encode each segment
    const segments = path.replace(/\\/g, '/').split('/');
    const encoded = segments.map(s => encodeURIComponent(s)).join('/');
    return encoded + query;
  }

  const allItems = rawItems.map(el => {
    // prefer explicit data-src attribute, otherwise try to find an <img src="..."> attribute (raw)
    const rawSrcAttr = el.getAttribute('data-src') || (el.querySelector('img') ? el.querySelector('img').getAttribute('src') : null);
    const src = rawSrcAttr || null;
    const title = el.getAttribute('data-title') || (el.querySelector('.item-info h3') ? el.querySelector('.item-info h3').textContent.trim() : (el.querySelector('img') ? el.querySelector('img').alt : ''));
    // determine media type by extension (basic heuristic)
    let type = 'image';
    if (src) {
      const ext = src.split('.').pop().split('?')[0].toLowerCase();
      if (['mp4','webm','ogg'].includes(ext)) type = 'video';
      if (ext === 'mp3') type = 'audio';
    }
    return { el, src, normSrc: normalizeSrc(src), title, type };
  }).filter(item => item.src); // only include items that resolve to a source

  // Group items by base filename (strip trailing numeric suffix like _1, -1, 1)
  const groups = {};
  function getGroupKey(src){
    if(!src) return '';
    // extract filename without path
    const fn = src.split('/').pop();
    // remove extension
    const base = fn.replace(/\.[^\.]+$/, '');
    // strip trailing separators and numbers (e.g., _1, -01,  1)
    const key = base.replace(/[\s_\-]*\d+$/,'');
    return key || base;
  }
  // Do not auto-group items across different module elements.
  // Grouping will be built per-module when the element is clicked (see click handler below).
  allItems.forEach(item => {
    item.groupKey = null;
    item.groupIndex = 0;
  });

  // activeGroup will hold the currently-open group's items when a modal is opened
  let activeGroup = null;

  // Create lightbox markup once
  let lightbox = document.querySelector('.lightbox');
  if(!lightbox){
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-hidden','true');
    lightbox.innerHTML = `
      <div class="lightbox-overlay" data-dismiss="lightbox"></div>
      <div class="lightbox-dialog" role="dialog" aria-modal="true">
        <button class="lightbox-close" aria-label="Cerrar">&times;</button>
        <div class="lightbox-inner">
          <div class="lightbox-media"></div>
          <div class="lightbox-caption">
            <h3 class="lightbox-title"></h3>
            <div class="lightbox-thumbs" role="toolbar" aria-label="Miniaturas"></div>
          </div>
          <button class="lightbox-prev" aria-label="Anterior">&#8249;</button>
          <button class="lightbox-next" aria-label="Siguiente">&#8250;</button>
        </div>
      </div>
    `;
    document.body.appendChild(lightbox);
  }

  const lbOverlay = lightbox.querySelector('.lightbox-overlay');
  const lbClose = lightbox.querySelector('.lightbox-close');
  const lbMedia = lightbox.querySelector('.lightbox-media');
  const lbTitle = lightbox.querySelector('.lightbox-title');
  const lbPrev = lightbox.querySelector('.lightbox-prev');
  const lbNext = lightbox.querySelector('.lightbox-next');
  const lbThumbs = lightbox.querySelector('.lightbox-thumbs');

  let currentIndex = -1;

  function openLightbox(index){
    const item = activeGroup ? activeGroup[index] : null;
    if(!item) return;
    // clear previous media
    lbMedia.innerHTML = '';
    // Helper to try a list of src candidates and use the first that loads (image)
    function tryLoadImage(candidates, onSuccess, onFail){
      if(!candidates || !candidates.length) return onFail && onFail();
      let i = 0;
      const tryNext = () => {
        if(i >= candidates.length) return onFail && onFail();
        const url = candidates[i++];
        const img = new Image();
        img.onload = () => onSuccess && onSuccess(url);
        img.onerror = () => tryNext();
        img.src = url;
      };
      tryNext();
    }
    function tryLoadVideoSource(candidates, onSuccess, onFail){
      if(!candidates || !candidates.length) return onFail && onFail();
      let i = 0;
      const tryNext = () => {
        if(i >= candidates.length) return onFail && onFail();
        const url = candidates[i++];
        // attempt to fetch HEAD to see if exists (fast). If fetch not available/cross-origin, fall back to trying the source in a video element.
        fetch(url, { method: 'HEAD' }).then(resp => {
          if(resp.ok) return onSuccess && onSuccess(url);
          tryNext();
        }).catch(()=>{
          // last resort: create video and wait for loadedmetadata
          const v = document.createElement('video');
          v.preload = 'metadata';
          v.src = url;
          v.onloadedmetadata = () => onSuccess && onSuccess(url);
          v.onerror = () => tryNext();
        });
      };
      tryNext();
    }
    // small helper to pick a thumbnail image for a media item (video/audio)
    function getThumbCandidate(it){
      // prefer explicit poster on the element
      const parent = it.el;
      if(parent && parent.getAttribute){
        const poster = parent.getAttribute('data-poster') || parent.dataset.poster || parent.getAttribute('data-thumb') || parent.dataset.thumb;
        if(poster) return normalizeSrc(poster);
      }
      // try replace extension with jpg/png
      if(it.src){
        const candBase = it.src.replace(/\.[^/.]+$/, '');
        return normalizeSrc(candBase + '.jpg');
      }
      return '/assets/blog3.jpg';
    }
  if (item.type === 'video') {
      // Create a source-backed video element (more reliable across browsers)
      const vid = document.createElement('video');
      vid.className = 'lightbox-video';
      vid.controls = true;
      vid.playsInline = true;
      vid.autoplay = false; // do not force autoplay (may be blocked); allow user control
      vid.preload = 'metadata';
      vid.setAttribute('aria-label', item.title || 'Video');
      // Build candidate list: item.normSrc then any fallbackImages on parent element (data-fallback-images)
      const candidates = [];
      if(item.normSrc) candidates.push(item.normSrc);
      const parent = item.el;
      if(parent && parent.getAttribute){
        const fb = parent.getAttribute('data-fallback-images') || parent.dataset.fallbackImages || '';
        if(fb){ fb.split('|').map(s=>s.trim()).filter(Boolean).forEach(s=>candidates.push(normalizeSrc(s))); }
      }
      // Also try encoded and raw original src variants
      if(item.src && !candidates.includes(item.src)) candidates.push(item.src);

      tryLoadVideoSource(candidates, (goodUrl) => {
        const source = document.createElement('source');
        source.src = goodUrl;
        const ext = (goodUrl || '').split('.').pop().split('?')[0].toLowerCase();
        let mime = 'video/mp4';
        if (ext === 'webm') mime = 'video/webm';
        else if (ext === 'ogg' || ext === 'ogv') mime = 'video/ogg';
        source.type = mime;
        vid.appendChild(source);
        // make the video fit the viewport while leaving margins
        vid.style.maxWidth = 'calc(100vw - 80px)';
        vid.style.maxHeight = 'calc(100vh - 140px)';
        vid.style.width = '100%';
        vid.style.height = 'auto';
        // disable download via controlsList and prevent context menu
        try{ vid.setAttribute('controlsList','nodownload'); vid.controlsList = 'nodownload'; }catch(e){}
        vid.addEventListener('contextmenu', (ev) => ev.preventDefault());
        lbMedia.appendChild(vid);
        vid.play && vid.play().catch(()=>{});
      }, () => {
        // fail silently: show an error placeholder
        const err = document.createElement('div'); err.className = 'media-error'; err.textContent = 'No se pudo cargar el video.'; lbMedia.appendChild(err);
      });
    } else if (item.type === 'audio') {
      // Audio modal view
      const aud = document.createElement('audio');
      aud.className = 'lightbox-audio';
      aud.controls = true;
      aud.preload = 'metadata';
      aud.setAttribute('aria-label', item.title || 'Audio');
      try{ aud.setAttribute('controlsList','nodownload'); aud.controlsList = 'nodownload'; }catch(e){}
      aud.style.maxWidth = '90vw';
      aud.style.display = 'block';
      aud.style.margin = '0 auto';
      aud.addEventListener('contextmenu', (ev) => ev.preventDefault());
      const candidates = [];
      if(item.normSrc) candidates.push(item.normSrc);
      if(item.src && !candidates.includes(item.src)) candidates.push(item.src);
      tryLoadVideoSource(candidates, (goodUrl) => {
        const source = document.createElement('source');
        source.src = goodUrl;
        source.type = 'audio/mpeg';
        aud.appendChild(source);
        lbMedia.appendChild(aud);
      }, () => {
        const err = document.createElement('div'); err.className = 'media-error'; err.textContent = 'No se pudo cargar el audio.'; lbMedia.appendChild(err);
      });
    } else {
      const parent = item.el;
      const candidates = [];
      if(item.normSrc) candidates.push(item.normSrc);
      if(parent && parent.getAttribute){
        const fb = parent.getAttribute('data-fallback-images') || parent.dataset.fallbackImages || '';
        if(fb){ fb.split('|').map(s=>s.trim()).filter(Boolean).forEach(s=>candidates.push(normalizeSrc(s))); }
      }
      if(item.src && !candidates.includes(item.src)) candidates.push(item.src);

      tryLoadImage(candidates, (goodUrl) => {
        const img = document.createElement('img');
        img.className = 'lightbox-image';
        img.src = goodUrl;
        img.alt = item.title || '';
        img.setAttribute('draggable','false');
        img.addEventListener('contextmenu', (ev) => ev.preventDefault());
        lbMedia.appendChild(img);
      }, () => {
        const err = document.createElement('div'); err.className = 'media-error'; err.textContent = 'No se pudo cargar la imagen.'; lbMedia.appendChild(err);
      });
    }
    lbTitle.textContent = item.title || '';
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    currentIndex = index;
    // render thumbs for the active group and highlight current
    renderThumbs(currentIndex);
    lbClose && lbClose.focus();
  }

  function closeLightbox(){
    lightbox.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    currentIndex = -1;
    // stop any playing video and clean up src to free memory
    const v = lightbox.querySelector('.lightbox-video');
    if (v) {
      try { v.pause(); } catch(e){}
      try {
        // remove <source> children first (if any)
        const sources = v.querySelectorAll('source');
        sources.forEach(s => s.remove());
        v.removeAttribute('src');
        v.load && v.load();
      } catch(e){}
    }
    lbMedia.innerHTML = '';
  }

  function showNext(){ if(currentIndex < 0 || !activeGroup) return; openLightbox((currentIndex + 1) % activeGroup.length); }
  function showPrev(){ if(currentIndex < 0 || !activeGroup) return; openLightbox((currentIndex - 1 + activeGroup.length) % activeGroup.length); }

  // Attach click handlers: when clicking an item, build a self-contained group for that element only
  allItems.forEach(itemObj => {
    const el = itemObj.el;
    // Skip audio items: audio cards will handle embeds inline and should not open the lightbox
    try{
      if(el.getAttribute && el.getAttribute('data-category') === 'audio') return;
    }catch(e){}

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      // If this element has data-images, parse as a group (useful for modules built as portfolio-group too)
      const dataImages = el.getAttribute && el.getAttribute('data-images');
      if(dataImages){
        const parts = dataImages.split('|').map(s=>s.trim()).filter(Boolean);
        activeGroup = parts.map((src, i) => ({ el, src, normSrc: normalizeSrc(src), title: el.getAttribute('data-title') || itemObj.title, type: (src.split('.').pop().toLowerCase().startsWith('mp4') ? 'video' : 'image'), groupIndex: i }));
        openLightbox(0);
        return false;
      }
      // Otherwise, create a single-item group from the clicked element
      activeGroup = [{ el, src: itemObj.src, normSrc: itemObj.normSrc, title: itemObj.title, type: itemObj.type, groupIndex: 0 }];
      openLightbox(0);
      return false;
    });
    el.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
  });

  // Handle grouped modules (.portfolio-group) which provide an explicit list of images in data-images
  const groupEls = Array.from(document.querySelectorAll('.portfolio-group'));
  function buildGroupFromData(groupEl){
    const raw = groupEl.getAttribute('data-images') || '';
    const title = groupEl.getAttribute('data-title') || (groupEl.querySelector('.item-info h3') ? groupEl.querySelector('.item-info h3').textContent.trim() : '');
    const parts = raw.split('|').map(s => s.trim()).filter(Boolean);
    const result = parts.map((src, i) => {
      let type = 'image';
      const ext = src.split('.').pop().split('?')[0].toLowerCase();
      if(['mp4','webm','ogg'].includes(ext)) type = 'video';
      return { el: groupEl, src, normSrc: normalizeSrc(src), title, type, groupIndex: i };
    });
    return result;
  }

  // Keep explicit portfolio-group elements working (they provide data-images already)
  groupEls.forEach(gEl => {
    gEl.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const grp = buildGroupFromData(gEl);
      if(!grp.length) return;
      activeGroup = grp;
      openLightbox(0);
      return false;
    });
    gEl.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const grp = buildGroupFromData(gEl); if(!grp.length) return; activeGroup = grp; openLightbox(0); } });
  });

  // Render thumbnail strip for activeGroup inside the lightbox
  function renderThumbs(activeIndex){
    if(!lbThumbs) return;
    lbThumbs.innerHTML = '';
    if(!activeGroup || !activeGroup.length) return;
    activeGroup.forEach((it, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lightbox-thumb';
      btn.setAttribute('data-index', i);
      const img = document.createElement('img');
      img.alt = it.title || '';
      img.loading = 'lazy';
      // choose a thumbnail candidate: for images use the image, for video/audio attempt poster or same-base jpg
      if(it.type === 'image'){
        img.src = it.normSrc || normalizeSrc(it.src || '');
      } else {
        img.src = getThumbCandidate(it);
        // if thumbnail 404, fallback to a generic image
        img.onerror = () => { img.onerror = null; img.src = '/assets/blog3.jpg'; };
      }
      img.setAttribute('draggable','false');
      img.addEventListener('contextmenu', (ev) => ev.preventDefault());
      btn.appendChild(img);
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); openLightbox(i); });
      lbThumbs.appendChild(btn);
    });
    // highlight active
    const activeBtn = lbThumbs.querySelector('.lightbox-thumb[data-index="' + activeIndex + '"]');
    if(activeBtn){
      lbThumbs.querySelectorAll('.lightbox-thumb').forEach(b=>b.classList.remove('active'));
      activeBtn.classList.add('active');
      // ensure visible in scrollable strip
      try{ activeBtn.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}); }catch(e){}
    }
  }

  // Reveal portfolio items on scroll using IntersectionObserver
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(ent => {
        if(ent.isIntersecting){
          ent.target.classList.add('is-visible');
          io.unobserve(ent.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    document.querySelectorAll('.portfolio-item').forEach(el=>{
      el.classList.remove('is-visible');
      io.observe(el);
    });
  } else {
    // Fallback: make all visible
    document.querySelectorAll('.portfolio-item').forEach(el=>el.classList.add('is-visible'));
  }

  lbOverlay && lbOverlay.addEventListener('click', closeLightbox);
  lbClose && lbClose.addEventListener('click', closeLightbox);
  lbNext && lbNext.addEventListener('click', showNext);
  lbPrev && lbPrev.addEventListener('click', showPrev);

  // Minimal focus trap + keyboard navigation
  document.addEventListener('keydown', (e) => {
    if(lightbox.getAttribute('aria-hidden') === 'true') return;
    if(e.key === 'Escape') return closeLightbox();
    if(e.key === 'ArrowRight') return showNext();
    if(e.key === 'ArrowLeft') return showPrev();
    if(e.key === 'Tab'){
      const focusable = lightbox.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if(!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if(e.shiftKey){ if(document.activeElement === first){ e.preventDefault(); last.focus(); } }
      else { if(document.activeElement === last){ e.preventDefault(); first.focus(); } }
    }
  });
});