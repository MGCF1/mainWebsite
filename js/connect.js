// Connect section phone scroll animation
document.addEventListener('DOMContentLoaded', () => {
    const iconsGrid = document.querySelector('.phone-icons-grid');
    if (iconsGrid && window.connectData) {
        iconsGrid.innerHTML = '';
        window.connectData.forEach(item => {
            const link = document.createElement('a');
            const className = item.className ? `phone-app-icon ${item.className}` : 'phone-app-icon';
            link.className = className;
            link.href = item.href;
            link.setAttribute('aria-label', item.label);

            if (item.external) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            }

            const iconWrap = document.createElement('div');
            iconWrap.className = 'phone-app-icon-img';

            const icon = document.createElement('img');
            icon.src = item.icon;
            icon.alt = item.label;
            iconWrap.appendChild(icon);

            const label = document.createElement('span');
            label.className = 'phone-app-icon-label';
            label.textContent = item.label;

            link.appendChild(iconWrap);
            link.appendChild(label);
            iconsGrid.appendChild(link);
        });
    }

    const phoneFrame = document.querySelector('.phone-frame');
    if (!phoneFrame) return;

    let targetY = 0;
    let currentY = 0;
    let lastTime = 0;

    // Ease-out cubic — decelerates smoothly as phone enters view
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function updateTarget() {
        const windowHeight = window.innerHeight;
        const scrollY = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight;
        const maxScroll = scrollHeight - windowHeight;

        const startTrigger = maxScroll - 300;
        const linearProgress = Math.min(Math.max((scrollY - startTrigger) / 300, 0), 1);
        const progress = easeOutCubic(linearProgress);

        const frameHeight = phoneFrame.offsetHeight || 650;
        const startPos = frameHeight;
        const endPos = frameHeight * 0.5;

        targetY = startPos - (startPos - endPos) * progress;
    }

    function animate(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms to avoid jumps
        lastTime = timestamp;

        // Frame-rate independent exponential smoothing
        // smoothTime ~0.15s means ~85% of the way there in 0.15 seconds
        const smoothTime = 0.15;
        const factor = 1 - Math.exp(-dt / smoothTime * 5);
        currentY += (targetY - currentY) * factor;

        // Snap when close enough
        if (Math.abs(targetY - currentY) < 0.5) {
            currentY = targetY;
        }

        phoneFrame.style.transform = `translateY(${currentY}px)`;
        requestAnimationFrame(animate);
    }

    // Initialize current position
    const frameHeight = phoneFrame.offsetHeight || 650;
    currentY = frameHeight;
    targetY = frameHeight;
    phoneFrame.style.transform = `translateY(${currentY}px)`;

    window.addEventListener('scroll', updateTarget, { passive: true });
    updateTarget();
    requestAnimationFrame(animate);
});
