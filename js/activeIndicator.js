(function(){
  function init(){
    const indicator = document.getElementById('pageIndicator');
    const page = document.body.dataset.page || '';
    const navLinks = document.querySelectorAll('.nav-links a');

    // Map body dataset values to label text
    const labels = { inicio: 'Inicio', acerca: 'Acerca de mí', portafolio: 'Portafolio', contacto: 'Contacto' };
    if(indicator){ indicator.textContent = labels[page] || page; indicator.style.opacity = '1'; }

    // Highlight active nav link
    navLinks.forEach(a=>{
      try{ a.classList.remove('active-page'); }catch(e){}
      const href = a.getAttribute('href') || '';
      if(href.includes(page) || (page === 'inicio' && href.includes('index'))){
        a.classList.add('active-page');
      }
    });

    // Optional: update indicator based on section in view if data-section attributes exist
    const sectionEls = document.querySelectorAll('[data-section]');
    if(sectionEls.length && 'IntersectionObserver' in window){
      const obs = new IntersectionObserver(entries=>{
        entries.forEach(ent => {
          if(ent.isIntersecting){
            const label = ent.target.dataset.sectionLabel || ent.target.dataset.section || null;
            if(label && indicator) indicator.textContent = label;
          }
        });
      }, { threshold: 0.5 });
      sectionEls.forEach(s=>obs.observe(s));
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
