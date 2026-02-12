document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.about-scroll');
    if (!container || !window.aboutData) return;

    window.aboutData.forEach(card => {
        const wrapper = document.createElement('div');
        wrapper.className = 'about-card-wrap';

        const el = document.createElement('div');
        el.className = 'about-card';

        if (card.backgroundImage) {
            el.classList.add('about-card-has-bg');
            el.style.backgroundImage = `url('${card.backgroundImage}')`;
        }

        const textWrap = document.createElement('div');
        textWrap.className = 'about-card-text';

        if (card.caption) {
            const label = document.createElement('div');
            label.className = 'caption-label about-card-label';
            label.textContent = card.caption;
            textWrap.appendChild(label);
        }

        const value = document.createElement('div');
        value.className = 'about-card-value';
        value.textContent = card.title;
        textWrap.appendChild(value);

        if (card.subtitle) {
            const sub = document.createElement('div');
            sub.className = 'about-card-sub';
            sub.textContent = card.subtitle;
            textWrap.appendChild(sub);
        }

        el.appendChild(textWrap);
        wrapper.appendChild(el);
        container.appendChild(wrapper);
    });

    // Mobile: scale up the card closest to center
    if (window.innerWidth <= 768) {
        const cards = container.querySelectorAll('.about-card-wrap');
        let currentCentered = null;

        function updateCenteredCard() {
            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.left + containerRect.width / 2;

            let closestCard = null;
            let closestDistance = Infinity;

            cards.forEach(card => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.left + cardRect.width / 2;
                const distance = Math.abs(cardCenter - containerCenter);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestCard = card;
                }
            });

            // Only update if centered card changed
            if (closestCard !== currentCentered) {
                if (currentCentered) {
                    currentCentered.classList.remove('about-card-centered');
                }
                if (closestCard) {
                    closestCard.classList.add('about-card-centered');
                }
                currentCentered = closestCard;
            }
        }

        // Debounced scroll handler
        let scrollTimeout;
        container.addEventListener('scroll', () => {
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => {
                updateCenteredCard();
                scrollTimeout = null;
            }, 50);
        }, { passive: true });

        // Also update on scroll end
        let scrollEndTimeout;
        container.addEventListener('scroll', () => {
            clearTimeout(scrollEndTimeout);
            scrollEndTimeout = setTimeout(updateCenteredCard, 120);
        }, { passive: true });

        requestAnimationFrame(updateCenteredCard);
    }
});
