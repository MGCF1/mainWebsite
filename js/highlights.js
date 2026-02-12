// Highlights section — data-driven card generation and carousel
document.addEventListener('DOMContentLoaded', () => {
    const scroll = document.querySelector('.highlights-scroll');
    if (!scroll) return;

    // Generate cards from data
    if (window.highlightsData) {
        window.highlightsData.forEach(item => {
            const card = document.createElement('a');
            const hasLink = Boolean(item.link && item.link !== '#');
            if (hasLink) {
                card.href = item.link;
            } else {
                card.href = '#';
                card.setAttribute('aria-disabled', 'true');
                card.tabIndex = -1;
                card.classList.add('is-disabled');
            }
            card.className = 'highlight-card';

            // Image/gradient area
            const imageDiv = document.createElement('div');
            imageDiv.className = 'highlight-card-image';
            if (item.backgroundImage) {
                imageDiv.style.backgroundImage = `url('${item.backgroundImage}')`;
            } else if (item.backgroundGradient) {
                imageDiv.style.background = item.backgroundGradient;
            }
            card.appendChild(imageDiv);

            // Content area
            const contentDiv = document.createElement('div');
            contentDiv.className = 'highlight-card-content';

            if (item.caption) {
                const tag = document.createElement('span');
                tag.className = 'caption-label highlight-card-tag';
                tag.textContent = item.caption;
                contentDiv.appendChild(tag);
            }

            const title = document.createElement('h3');
            title.className = 'highlight-card-title';
            title.textContent = item.title;
            contentDiv.appendChild(title);

            if (item.subtitle) {
                const desc = document.createElement('p');
                desc.className = 'highlight-card-desc';
                desc.textContent = item.subtitle;
                contentDiv.appendChild(desc);
            }

            card.appendChild(contentDiv);

            // CTA
            if (item.cta && hasLink) {
                const cta = document.createElement('span');
                cta.className = 'highlight-card-plus';

                const ctaText = document.createElement('span');
                ctaText.className = 'highlight-card-plus-text';
                ctaText.textContent = item.cta;

                const ctaChevron = document.createElement('span');
                ctaChevron.className = 'highlight-card-plus-chevron';
                ctaChevron.setAttribute('aria-hidden', 'true');
                ctaChevron.textContent = '›';

                cta.appendChild(ctaText);
                cta.appendChild(ctaChevron);
                card.appendChild(cta);
            }

            scroll.appendChild(card);
        });
    }

    const cards = scroll.querySelectorAll('.highlight-card');
    if (cards.length === 0) return;

    let autoScrollInterval;
    let resumeTimeout;
    let isHovered = false;
    let isAnimating = false;

    function updateFocus() {
        const scrollRect = scroll.getBoundingClientRect();
        const scrollCenter = scrollRect.left + scrollRect.width / 2;

        let closestCard = null;
        let closestDistance = Infinity;

        cards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const distance = Math.abs(scrollCenter - cardCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestCard = card;
            }
        });

        cards.forEach(card => {
            card.classList.toggle('is-focused', card === closestCard);
        });
    }

    let animationTimeout;
    function getCenteredOffset(card) {
        return card.offsetLeft - (scroll.clientWidth - card.offsetWidth) / 2;
    }

    function smoothScrollTo(element, target, duration) {
        const maxScroll = element.scrollWidth - element.clientWidth;
        const clampedTarget = maxScroll <= 0
            ? 0
            : Math.max(0, Math.min(target, maxScroll));
        element.classList.add('is-animating');
        isAnimating = true;

        const start = element.scrollLeft;
        const change = clampedTarget - start;
        let startTime = null;

        function animateScroll(currentTime) {
            if (!startTime) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);

            const ease = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            element.scrollLeft = start + change * ease;

            if (timeElapsed < duration) {
                requestAnimationFrame(animateScroll);
            } else {
                element.scrollLeft = clampedTarget;
                requestAnimationFrame(() => {
                    element.classList.remove('is-animating');
                    isAnimating = false;
                });
            }
        }

        requestAnimationFrame(animateScroll);
    }

    function getClosestCardIndex() {
        const scrollCenter = scroll.scrollLeft + scroll.clientWidth / 2;
        let closestIndex = 0;
        let closestDistance = Infinity;

        cards.forEach((card, index) => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(scrollCenter - cardCenter);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        return closestIndex;
    }

    function autoScroll() {
        if (isHovered) return;

        let nextIndex = getClosestCardIndex() + 1;
        if (nextIndex >= cards.length) {
            nextIndex = 0;
        }

        smoothScrollTo(scroll, getCenteredOffset(cards[nextIndex]), 1080);
    }

    function startAutoScroll() {
        stopAutoScroll();
        autoScrollInterval = setInterval(autoScroll, 3000);
    }

    function stopAutoScroll() {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
        }
    }

    function scheduleAutoScrollRestart() {
        stopAutoScroll();
        if (resumeTimeout) {
            clearTimeout(resumeTimeout);
        }
        resumeTimeout = setTimeout(() => {
            if (!isHovered) {
                startAutoScroll();
            }
        }, 4000);
    }

    scroll.addEventListener('scroll', () => {
        requestAnimationFrame(updateFocus);
        if (!isAnimating) {
            scheduleAutoScrollRestart();
        }
    });

    scroll.addEventListener('mouseenter', () => {
        isHovered = true;
        stopAutoScroll();
    });

    scroll.addEventListener('mouseleave', () => {
        isHovered = false;
        scheduleAutoScrollRestart();
    });

    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(eventName => {
        scroll.addEventListener(eventName, () => {
            if (!isAnimating) {
                scheduleAutoScrollRestart();
            }
        }, { passive: true });
    });

    // Initial setup
    updateFocus();
    startAutoScroll();
});
