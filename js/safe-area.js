(() => {
    const root = document.documentElement;

    function updateSafeArea() {
        if (!window.visualViewport) {
            root.style.setProperty('--dynamic-safe-bottom', 'var(--safe-bottom)');
            return;
        }

        const vv = window.visualViewport;
        const bottomInset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
        root.style.setProperty('--dynamic-safe-bottom', `${bottomInset}px`);
    }

    updateSafeArea();

    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateSafeArea);
        window.visualViewport.addEventListener('scroll', updateSafeArea);
    }
})();
