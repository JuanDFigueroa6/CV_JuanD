// Lightweight accessible carousel for the hero section
(function(){
  const carousel = document.getElementById('heroCarousel');
  if(!carousel) return;

  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
  const prev = carousel.querySelector('.carousel-prev');
  const next = carousel.querySelector('.carousel-next');
  const dots = Array.from(carousel.querySelectorAll('.dot'));
  // Defensive guards: ensure required pieces exist
  if(!track || slides.length === 0){ return; }
  let current = 0;
  let autoplayInterval = null;
  const AUTOPLAY_MS = 4500;

  function goTo(index, announce){
    index = (index + slides.length) % slides.length;
    const offset = -index * 100;
    track.style.transform = `translateX(${offset}%)`;
    slides.forEach((s,i)=>{
      s.setAttribute('aria-hidden', i===index ? 'false' : 'true');
      s.id = `slide-${i}`;
    });
    dots.forEach((d,i)=>{
      d.setAttribute('aria-selected', i===index ? 'true' : 'false');
      d.classList.toggle('active', i===index);
    });
    current = index;
    if(announce){
      // optional: announce to screen readers by toggling aria-live region if present
      const live = document.getElementById('carouselStatus');
      if(live) live.textContent = `Diapositiva ${index+1} de ${slides.length}`;
    }
  }

  function nextSlide(){ goTo(current+1, true); }
  function prevSlide(){ goTo(current-1, true); }

  if(next) next.addEventListener('click', ()=>{ nextSlide(); resetAutoplay(); });
  if(prev) prev.addEventListener('click', ()=>{ prevSlide(); resetAutoplay(); });

  if(dots && dots.length){
    dots.forEach(d=>{
      d.addEventListener('click', (e)=>{ const idx = parseInt(d.dataset.slide,10); goTo(idx, true); resetAutoplay(); });
    });
  }

  // Keyboard support
  carousel.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowRight') { nextSlide(); resetAutoplay(); }
    if(e.key === 'ArrowLeft') { prevSlide(); resetAutoplay(); }
    if(e.key === 'Home') { goTo(0, true); resetAutoplay(); }
    if(e.key === 'End') { goTo(slides.length-1, true); resetAutoplay(); }
  });

  // Autoplay
  function startAutoplay(){
    if(autoplayInterval) return;
    autoplayInterval = setInterval(()=>{ nextSlide(); }, AUTOPLAY_MS);
  }
  function stopAutoplay(){
    if(!autoplayInterval) return;
    clearInterval(autoplayInterval); autoplayInterval = null;
  }
  function resetAutoplay(){ stopAutoplay(); startAutoplay(); }

  // Pause on hover/focus
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  // Make controls focusable
  // Make controls focusable if they exist
  [prev,next].forEach(el=>{ if(el) el.tabIndex = 0; });
  if(dots && dots.length) dots.forEach(el=>{ if(el) el.tabIndex = 0; });

  // Initialize
  goTo(0);
  startAutoplay();
})();
