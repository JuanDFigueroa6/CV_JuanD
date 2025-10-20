// Navegación móvil
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const header = document.querySelector('header');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks) navLinks.classList.remove('active');
        });
    });

    // Header con scroll: alternar clase 'scrolled' para controlar estilos desde CSS
    function updateHeaderOnScroll() {
        if (!header) return;
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', updateHeaderOnScroll);
    updateHeaderOnScroll(); // establecer estado inicial

    // Animaciones al hacer scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.service-card, .section-title');

        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top;
            const windowHeight = window.innerHeight;
            // Softer reveal: smaller translate and larger threshold
            if (elementTop < windowHeight - 40) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    // Inicializar elementos animados
    document.querySelectorAll('.service-card, .section-title').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        el.style.transition = 'opacity 0.84s cubic-bezier(.22,.9,.35,1), transform 0.84s cubic-bezier(.22,.9,.35,1)';
    });

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Ejecutar una vez al cargar

    // Modal de servicios (index.html)
    const modal = document.getElementById('serviceModal');
    const modalTitle = modal ? modal.querySelector('#serviceModalTitle') : null;
    const modalBody = modal ? modal.querySelector('.modal-body') : null;
    const modalClose = modal ? modal.querySelector('.modal-close') : null;
    let lastFocused = null;

    function openModal(title, bodyHtml, invokerElement) {
        if (!modal) return;
        // Si el invocador pasa data-attributes, rellenar campos enriquecidos
        if (modalTitle) modalTitle.textContent = title;
        const imgEl = document.getElementById('serviceModalImg');
        const descEl = document.getElementById('serviceModalDesc');
        const bulletsEl = document.getElementById('serviceModalBullets');
        const ctaEl = document.getElementById('serviceModalCTA');

        // Set default body — don't replace the full modal structure, only the description
        if (modalBody) {
            const descInner = modalBody.querySelector('#serviceModalDesc');
            if (descInner) descInner.innerHTML = bodyHtml || '';
        }
    // Determine the originating card (supports .service-card and .portfolio-item)
    const invoker = invokerElement || (document.activeElement && document.activeElement.closest ? document.activeElement.closest('.service-card, .portfolio-item') : null);

        if (invoker) {
            const img = invoker.getAttribute('data-img') || '';
            const desc = invoker.getAttribute('data-desc') || '';
            const bullets = (invoker.getAttribute('data-bullets') || '').split('||').filter(Boolean);
            const ctaText = invoker.getAttribute('data-cta-text') || 'Contactar';
            const ctaUrl = invoker.getAttribute('data-cta-url') || 'contact.html';

            if (imgEl) imgEl.src = img;
            if (imgEl) imgEl.alt = title || desc || 'Imagen del servicio';
            if (descEl) descEl.textContent = desc;
            if (bulletsEl) {
                bulletsEl.innerHTML = '';
                bullets.forEach(b => {
                    const li = document.createElement('li');
                    li.textContent = b;
                    bulletsEl.appendChild(li);
                });
            }
            if (ctaEl) { ctaEl.textContent = ctaText; ctaEl.href = ctaUrl; }
        }
        modal.setAttribute('aria-hidden', 'false');
        lastFocused = document.activeElement;
        // mark invoker as expanded for assistive tech
        if (invoker) invoker.setAttribute('aria-expanded', 'true');
        // focus the close button for accessibility
        if (modalClose) modalClose.focus();
        document.body.style.overflow = 'hidden';
    }

    // Recalcular focusables cuando cambia el DOM del modal (más robusto)
    if (window.MutationObserver && modal) {
        const mo = new MutationObserver(() => {
            // No-op here; the global keydown handler queries DOM each time so it will pick up new focusables
        });
        mo.observe(modal, { childList: true, subtree: true, attributes: true });
    }

    function closeModal() {
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // unset aria-expanded on the previously focused invoker if any
        try {
            const prevInvoker = document.querySelector('[aria-expanded="true"]');
            if (prevInvoker) prevInvoker.setAttribute('aria-expanded', 'false');
        } catch (e) {}
        if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    // Vincular eventos en las service-card
    // Attach to service cards only (portfolio items navigate to their own pages now)
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h3') ? card.querySelector('h3').textContent : 'Servicio';
            const body = card.querySelector('p') ? `<p>${card.querySelector('p').textContent}</p>` : '';
            openModal(title, body, card);
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });

    // Abrir modal desde los botones de icono dentro de las cards
    document.querySelectorAll('.service-icon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.service-card');
            if (!card) return;
            const title = card.querySelector('h3') ? card.querySelector('h3').textContent : 'Servicio';
            const body = card.querySelector('p') ? `<p>${card.querySelector('p').textContent}</p>` : '';
            openModal(title, body, card);
        });
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // Cerrar modal eventos
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target && e.target.matches('[data-dismiss="modal"]')) closeModal();
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal && modal.getAttribute('aria-hidden') === 'false') closeModal();
        }
    });

    // Focus-trap simple: evitar que Tab salga del modal cuando está abierto
    document.addEventListener('keydown', function(e) {
        if (!modal || modal.getAttribute('aria-hidden') === 'true') return;
        if (e.key !== 'Tab') return;
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) { // shift + tab
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else { // tab
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    // Toggle background-attachment for .hero-bg based on viewport width (fixed on desktop)
    (function(){
        const mq = window.matchMedia('(min-width: 768px)');
        function apply(){
            document.querySelectorAll('.hero-bg').forEach(el=>{
                el.style.backgroundAttachment = mq.matches ? 'fixed' : 'local';
            });
        }
        apply();
        if(mq.addEventListener) mq.addEventListener('change', apply);
        else if(mq.addListener) mq.addListener(apply);
    })();
});