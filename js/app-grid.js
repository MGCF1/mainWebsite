let projects = [];

function loadProjects() {
    projects = window.projectsData || [];
}

// Create floating background icons
function createFloatingIcons() {
    const backLayer = document.getElementById('appGridBack');
    const frontLayer = document.getElementById('appGridFront');
    if (!backLayer || !frontLayer) {
        console.error('Background layers not found');
        return;
    }

    if (projects.length === 0) {
        console.warn('No projects loaded, cannot create icons');
        return;
    }

    // Clear existing icons before creating new ones (for resize support)
    // Preserve the overlay divs
    backLayer.querySelectorAll('.floating-icon').forEach(el => el.remove());
    frontLayer.querySelectorAll('.floating-icon').forEach(el => el.remove());

    const isMobile = window.innerWidth < 600;

    // ========================================================
    // COLUMN CONFIG — edit these to change the layout
    // Size labels: S = small (behind hero), M = medium, L = large
    // ========================================================
    const DESKTOP_SIZES = { S: 150, M: 185, L: 220 };
    const MOBILE_SIZES  = { S: 100, M: 125, L: 150 };

    const desktopLayout = ['M', 'L', 'S', 'L', 'M'];  // 5 columns, center out
    //                      ↑    ↑    ↑    ↑    ↑
    //                     col0 col1 col2 col3 col4

    const mobileLayout = ['M', 'S', 'M'];              // 3 columns

    const layout = isMobile ? mobileLayout : desktopLayout;
    const SIZES = isMobile ? MOBILE_SIZES : DESKTOP_SIZES;

    // Derived: columns behind hero are 'S' (smallest)
    // Everything else goes in front
    // ========================================================

    // Define column positions and counts based on screen size
    const columns = isMobile
        ? [15, 50, 85] // 3 columns for mobile
        : [8, 28, 50, 72, 92]; // 5 columns for desktop

    const iconsPerColumn = isMobile
        ? [5, 4, 5] // More icons per column on mobile to fill vertical space
        : [4, 4, 2, 4, 4]; // Total: 18 icons for desktop

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const totalIcons = iconsPerColumn.reduce((sum, count) => sum + count, 0);
    const repeats = Math.ceil(totalIcons / projects.length);
    let pool = [];
    for (let r = 0; r < repeats; r++) {
        pool = pool.concat(projects);
    }
    shuffle(pool);

    function isSameProject(a, b) {
        if (!a || !b) return false;
        return a.id === b.id || a.name === b.name;
    }

    const iconsByColumn = columns.map((columnX, columnIndex) => []);
    const maxRows = Math.max(...iconsPerColumn);

    for (let row = 0; row < maxRows; row++) {
        const usedInRow = new Set();
        for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
            if (row >= iconsPerColumn[columnIndex]) continue;

            const prevInColumn = iconsByColumn[columnIndex][row - 1];
            let pickIndex = pool.findIndex(candidate => {
                const key = candidate.id || candidate.name;
                return !usedInRow.has(key) && !isSameProject(candidate, prevInColumn);
            });

            if (pickIndex === -1) {
                pickIndex = pool.findIndex(candidate => !isSameProject(candidate, prevInColumn));
            }

            if (pickIndex === -1) {
                pickIndex = 0;
            }

            const project = pool.splice(pickIndex, 1)[0];
            const projectKey = project.id || project.name;
            usedInRow.add(projectKey);
            iconsByColumn[columnIndex].push({ ...project, columnIndex, positionInColumn: row });
        }
    }

    // Flatten all icons
    const allIcons = iconsByColumn.flat();

    allIcons.forEach((project) => {
        const icon = document.createElement('a');
        icon.href = project.url;
        icon.className = `floating-icon`;

        // Open external links in new tab
        if (project.external) {
            icon.target = '_blank';
            icon.rel = 'noopener noreferrer';
        }

        // Check if icon is an image path or emoji
        if (project.icon.includes('.png') || project.icon.includes('.jpg') || project.icon.includes('.svg')) {
            // For images, don't use gradient background
            icon.style.background = 'none';
            const img = document.createElement('img');
            img.src = project.icon;
            img.alt = project.name;
            img.decoding = 'async';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            icon.appendChild(img);
        } else {
            // For emoji, use gradient background
            icon.style.background = project.gradient;
            icon.innerHTML = project.icon;
        }

        const columnIndex = project.columnIndex;
        const positionInColumn = project.positionInColumn;
        const columnIconCount = iconsPerColumn[columnIndex];

        const baseX = columns[columnIndex];
        const variation = (Math.random() - 0.5) * 10; // -5% to +5%
        const startX = Math.max(5, Math.min(95, baseX + variation));
        icon.style.left = `${startX}%`;

        // Derive size, speed, z-index, and layer from layout config
        const sizeLabel = layout[columnIndex];
        const size = SIZES[sizeLabel];
        icon.style.width = `${size}px`;
        icon.style.height = `${size}px`;
        icon.style.fontSize = `${size * 0.5}px`;

        // Speed: smaller = slower (far away), larger = faster (close up)
        const allSizes = Object.values(SIZES);
        const minPx = Math.min(...allSizes);
        const maxPx = Math.max(...allSizes);
        const minSpeed = 60;  // fastest (largest icons)
        const maxSpeed = 90;  // slowest (smallest icons)
        const sizeRatio = (size - minPx) / (maxPx - minPx); // 0 = smallest, 1 = largest
        const speed = maxSpeed - (sizeRatio * (maxSpeed - minSpeed));

        // Full opacity, no blur
        icon.style.opacity = 1;
        icon.style.filter = 'none';

        // Depth layering: S behind hero (z:2), M in front (z:6), L in front (z:10)
        const zByLabel = { S: 2, M: 6, L: 10 };
        const baseZIndex = zByLabel[sizeLabel];
        icon.style.zIndex = baseZIndex;
        icon.dataset.baseZIndex = baseZIndex;

        // Space icons evenly within column for seamless looping
        // Calculate spacing so icons loop perfectly: 120% visible range / number of icons
        const totalRange = 140; // Full loop range from -20% to 120%
        const columnSpacing = totalRange / columnIconCount;

        // Offset mirrored columns so they aren't perfectly aligned
        // Desktop: U D X D U — Mobile: U X D
        const columnOffsets = isMobile
            ? [1, 0, -1]          // U X D
            : [1, -1, 0, 1, -1];  // U D X U D
        const offsetDirection = columnOffsets[columnIndex];
        const columnOffset = offsetDirection * columnSpacing * 0.25;

        const startY = -20 + (positionInColumn * columnSpacing) + columnOffset;
        icon.style.top = `${startY}%`;

        // Store animation data
        icon.dataset.speed = speed;
        icon.dataset.startY = startY;
        icon.dataset.startX = startX;
        icon.dataset.columnIconCount = columnIconCount;
        icon.dataset.totalRange = totalRange;

        // S icons go to back layer (behind hero), M and L to front
        const targetLayer = sizeLabel === 'S' ? backLayer : frontLayer;
        targetLayer.appendChild(icon);
    });
}

// Animate floating icons - simple upward movement
function animateFloatingIcons() {
    let isAnyHovered = false;
    let slowMotionFactor = 1;

    // Animation loop
    let lastTime = Date.now() / 1000;
    let animationTime = 0;

    function animate() {
        const icons = document.querySelectorAll('.floating-icon');
        const currentTime = Date.now() / 1000;
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // Track hover state for slow motion effect - ONLY at the top of the page
        isAnyHovered = Array.from(icons).some(i => i.matches(':hover')) && window.scrollY < 100;

        // Smoothly transition slow motion factor
        const targetSlowMotion = isAnyHovered ? 0.2 : 1;
        slowMotionFactor += (targetSlowMotion - slowMotionFactor) * 0.1;

        // Update animation time with slow motion applied
        animationTime += deltaTime * slowMotionFactor;

        icons.forEach((icon) => {
            const speed = parseFloat(icon.dataset.speed);
            const startY = parseFloat(icon.dataset.startY);
            const totalRange = parseFloat(icon.dataset.totalRange);

            // Calculate vertical position - move UPWARD continuously
            const progress = (animationTime / speed) % 1; // 0 to 1 over duration
            const currentY = startY - (progress * totalRange); // Move upward by totalRange

            // Wrap around: when icon goes off top, loop back to bottom seamlessly
            let wrappedY = currentY;
            if (wrappedY < -20) {
                // Add totalRange to wrap back to bottom
                wrappedY = wrappedY + totalRange;
            }

            // Only top changes per frame; left and transform are set at creation
            icon.style.top = `${wrappedY}%`;
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// Blur and fade icons on scroll
function setupScrollBlur() {
    const backLayer = document.getElementById('appGridBack');
    const frontLayer = document.getElementById('appGridFront');
    if (!backLayer || !frontLayer) return;

    let ticking = false;

    function updateBlur() {
        const scrollY = window.scrollY;
        const isAtTop = scrollY < 100;

        // Start blurring after 100px scroll, max at 800px
        const blurAmount = Math.min((scrollY / 800) * 15, 15);
        const iconOpacity = Math.max(1 - (scrollY / 800) * 0.5, 0.5);

        // PERFORMANCE OPTIMIZATION:
        // When scrolled, we blur the ENTIRE container once.
        // This is significantly faster than blurring 18 individual moving icons.
        const overlayBack = document.getElementById('scrollFadeOverlayBack');
        const overlayFront = document.getElementById('scrollFadeOverlayFront');
        const heroContent = document.getElementById('heroContent');

        if (!isAtTop) {
            backLayer.style.filter = `blur(${blurAmount}px)`;
            frontLayer.style.filter = `blur(${blurAmount}px)`;
            backLayer.classList.add('is-scrolled');
            frontLayer.classList.add('is-scrolled');

            const overlayOpacity = Math.min(0.5, scrollY / 300);

            // Fade in overlay to hide icons
            if (overlayBack) overlayBack.style.opacity = overlayOpacity;
            if (overlayFront) overlayFront.style.opacity = overlayOpacity;
            // Fade and blur hero text at the same rate as icons — never fully disappear
            if (heroContent) {
                heroContent.style.opacity = Math.max(0.3, 1 - overlayOpacity * 0.7);
                heroContent.style.filter = `blur(${blurAmount}px)`;
            }
        } else {
            backLayer.style.filter = 'none';
            frontLayer.style.filter = 'none';
            backLayer.classList.remove('is-scrolled');
            frontLayer.classList.remove('is-scrolled');
            // Hide overlay when at top
            if (overlayBack) overlayBack.style.opacity = '0';
            if (overlayFront) overlayFront.style.opacity = '0';
            // Restore hero text
            if (heroContent) {
                heroContent.style.opacity = '1';
                heroContent.style.filter = 'none';
            }
        }

        const icons = document.querySelectorAll('.floating-icon');
        icons.forEach(icon => {
            const baseZ = icon.dataset.baseZIndex || '0';
            // Individual filters ONLY for the hover highlight at the top
            if (isAtTop) {
                if (icon.matches(':hover')) {
                    icon.style.filter = 'none';
                    icon.style.zIndex = '20';
                } else {
                    icon.style.filter = 'none'; // Background is not blurred yet
                    icon.style.zIndex = baseZ;
                }
            } else {
                // When scrolled, individual icon filters are removed
                // because the PARENT is blurred. Icons stay fully opaque.
                icon.style.filter = 'none';
                icon.style.zIndex = baseZ;
            }
        });

        ticking = false;
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updateBlur);
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll);
    updateBlur();

    // Re-check on hover to trigger highlight immediately (only if at top)
    document.addEventListener('mouseover', (e) => {
        if (window.scrollY < 100 && e.target.closest('.floating-icon')) {
            onScroll();
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (window.scrollY < 100 && e.target.closest('.floating-icon')) {
            onScroll();
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load project data first
    loadProjects();

    // Then create icons and set up animations
    createFloatingIcons();
    setupScrollBlur();

    // Re-create icons on resize ONLY if the breakpoint is crossed
    let resizeTimer;
    let currentIsMobile = window.innerWidth < 600;

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const newIsMobile = window.innerWidth < 600;
            if (newIsMobile !== currentIsMobile) {
                currentIsMobile = newIsMobile;
                createFloatingIcons();
            }
        }, 250);
    });

    // Start animations after a brief delay
    setTimeout(() => {
        animateFloatingIcons();
    }, 100);
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
