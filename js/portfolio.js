// Filtrado del portafolio
document.addEventListener('DOMContentLoaded', function() {
    // Filters removed — unified portfolio view. Keep portfolio items selection for animations.
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    // Navegación móvil (compartida)
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
    
    // Animación de items al hacer scroll
    const animateItems = function() {
        const items = document.querySelectorAll('.portfolio-item');
        
        items.forEach((item, index) => {
            const itemTop = item.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (itemTop < windowHeight - 100) {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 40);
            }
        });
    };
    
    // Inicializar animación
    portfolioItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(12px)';
        item.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    });
    
    window.addEventListener('scroll', animateItems);
    animateItems();
});