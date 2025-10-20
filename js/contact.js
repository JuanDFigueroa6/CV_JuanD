// (Se eliminó initMap porque usamos un iframe embebido en contact.html)


// Form Validation and Submission
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validación básica
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            // Comprobar botón submit
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (!submitBtn) {
                showNotification('No se encontró el botón de envío.', 'error');
                return;
            }
            const originalText = submitBtn.innerHTML;

            if (!name || !email || !message) {
                showNotification('Por favor, completa todos los campos requeridos', 'error');
                return;
            }

            // Validación simple de email
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                showNotification('Introduce un correo electrónico válido.', 'error');
                return;
            }

            // Envío real usando fetch a un endpoint '/api/contact'
            // Construir payload
            const payload = {
                name: name,
                email: email,
                service: contactForm.querySelector('#service') ? contactForm.querySelector('#service').value : '',
                message: message
            };

            // Mostrar spinner (insertar elemento dentro del botón en vez de reemplazar innerHTML)
            const spinner = document.createElement('i');
            spinner.className = 'fas fa-spinner fa-spin button-spinner';
            submitBtn.setAttribute('aria-busy', 'true');
            submitBtn.disabled = true;
            submitBtn.prepend(spinner);

            // Realizar petición
            (async () => {
                try {
                    const res = await fetch('/api/contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!res.ok) {
                        const errText = await res.text();
                        throw new Error(errText || 'Error en el servidor');
                    }

                    const data = await res.json();
                    showNotification(data.message || '¡Mensaje enviado con éxito! Te contactaremos pronto.', 'success');
                    contactForm.reset();
                } catch (err) {
                    console.error('Error enviando formulario:', err);
                    showNotification('Ocurrió un error al enviar. Por favor intenta más tarde.', 'error');
                } finally {
                    // Restaurar botón
                    submitBtn.removeAttribute('aria-busy');
                    submitBtn.disabled = false;
                    if (spinner && spinner.parentNode) spinner.parentNode.removeChild(spinner);
                }
            })();
        });
    }
    
    // Función de notificación
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <span>${message}</span>
        `;
    
        // Accesibilidad
        notification.setAttribute('role', 'status');
        notification.setAttribute('aria-live', 'polite');

            // El estilo visual se gestiona desde CSS (.notification, .success, .error)

        document.body.appendChild(notification);

        // Also write to inline status region if present (for screen readers and inline context)
        const statusRegion = document.getElementById('contactStatus');
        if (statusRegion) {
            statusRegion.textContent = message;
            // remove text after a while to keep region clean
            setTimeout(() => { statusRegion.textContent = ''; }, 6000);
        }

        setTimeout(() => {
            // use utility class so CSS handles the animation timing
            notification.classList.add('animate-out-right');
            // remove after animation completes
            notification.addEventListener('animationend', () => {
                if (notification && notification.parentNode) document.body.removeChild(notification);
            }, { once: true });
        }, 4500);
    }
    
    // Navegación móvil (compartida)
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
    
    // Animaciones al hacer scroll: usar IntersectionObserver para mejor rendimiento
    const animatedElements = document.querySelectorAll('.contact-form, .contact-info, .contact-item');

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});