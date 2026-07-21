// Skills section — a fixed-size background image with two interaction
// variants overlaid on it (CSS shows only one per breakpoint): a desktop
// leading-edge accordion where each item expands inline, and a mobile
// bottom pill row that expands a single floating card. Both variants share
// the same background media, which crossfades but never resizes.
const skillsCatalog = window.skillsCatalog || [];

document.addEventListener('DOMContentLoaded', () => {
    const media = document.getElementById('skillsMedia');
    const mediaLayers = media ? media.querySelectorAll('.skills-media-layer') : [];
    const accordion = document.getElementById('skillsAccordion');
    const accordionNavWrap = document.getElementById('skillsAccordionNavWrap');
    const accordionUp = document.getElementById('skillsAccordionUp');
    const accordionDown = document.getElementById('skillsAccordionDown');
    const accordionClose = document.getElementById('skillsAccordionClose');
    const imageTags = document.getElementById('skillsImageTags');
    const pillrow = document.getElementById('skillsPillrow');
    const card = document.getElementById('skillsCard');
    const close = document.getElementById('skillsClose');
    const prev = document.getElementById('skillsPrev');
    const next = document.getElementById('skillsNext');
    const cardTitle = document.getElementById('skillsTitle');
    const cardOverview = document.getElementById('skillsOverview');
    const cardTags = document.getElementById('skillsTags');

    if (!media || !accordion || !pillrow || skillsCatalog.length === 0) return;

    let visibleLayerIndex = 0;
    // Both the accordion and the mobile card start with nothing selected.
    let accordionOpenIndex = -1;
    let cardActiveIndex = 0;
    let cardExpanded = false;

    // SF Symbols-style outline icons — real vector glyphs (circle + plus /
    // circle + plus), not a background-color div standing in for one.
    const ICON_PLUS_CIRCLE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';

    function renderTags(container, tags) {
        container.innerHTML = '';
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'skills-tag';
            span.textContent = tag;
            container.appendChild(span);
        });
    }

    function updateMedia(index) {
        const skill = skillsCatalog[index];
        if (!skill || mediaLayers.length < 2) return;

        const nextLayerIndex = visibleLayerIndex === 0 ? 1 : 0;
        const nextLayer = mediaLayers[nextLayerIndex];
        const currentLayer = mediaLayers[visibleLayerIndex];

        // background-image, not the background shorthand — the shorthand
        // resets background-size/position/repeat to their defaults, which
        // would silently undo the CSS contain/center rules meant for
        // future transparent-background images (gradients render the same
        // either way, so this doesn't change anything visible today).
        nextLayer.style.backgroundImage = skill.gradient;
        nextLayer.classList.add('is-visible');
        currentLayer.classList.remove('is-visible');
        visibleLayerIndex = nextLayerIndex;
    }

    // ── Desktop: leading-edge accordion ─────────────────────────────────
    function renderAccordion() {
        skillsCatalog.forEach((skill, index) => {
            const item = document.createElement('div');
            item.className = 'skills-accordion-item';
            item.dataset.index = String(index);

            const head = document.createElement('button');
            head.type = 'button';
            head.className = 'skills-accordion-head';
            head.setAttribute('aria-expanded', 'false');

            const icon = document.createElement('span');
            icon.className = 'skills-accordion-icon';
            icon.innerHTML = ICON_PLUS_CIRCLE;

            const name = document.createElement('span');
            name.className = 'skills-accordion-name';
            name.textContent = skill.name;

            head.appendChild(icon);
            head.appendChild(name);
            head.addEventListener('click', () => toggleAccordion(index));

            const body = document.createElement('div');
            body.className = 'skills-accordion-body';

            const bodyInner = document.createElement('div');
            bodyInner.className = 'skills-accordion-body-inner';

            const panel = document.createElement('div');
            panel.className = 'skills-accordion-panel';

            const overview = document.createElement('p');
            overview.className = 'skills-overview';
            overview.textContent = skill.overview;

            // Tags live in the image panel now, not here — see updateImageTags.
            panel.appendChild(overview);
            bodyInner.appendChild(panel);
            body.appendChild(bodyInner);

            item.appendChild(head);
            item.appendChild(body);
            accordion.appendChild(item);
        });

        pinCollapsedWidths();
        syncAccordionState();
    }

    // CSS can't transition to/from width: auto, so measure each item's
    // natural (collapsed) width once — the head's own content width is
    // independent of its sibling .skills-accordion-body regardless of the
    // body's current size, so this is accurate even though nothing is
    // open yet — and pin it as a custom property the item's width
    // transition can animate to/from.
    function pinCollapsedWidths() {
        accordion.querySelectorAll('.skills-accordion-item').forEach(item => {
            const head = item.querySelector('.skills-accordion-head');
            if (!head) return;
            const width = head.getBoundingClientRect().width;
            item.style.setProperty('--skills-item-w', `${width}px`);
        });
    }

    // Desktop-only — mobile keeps its own tags inside #skillsCard, updated
    // by renderCardContent instead.
    function updateImageTags(index) {
        const skill = skillsCatalog[index];
        if (!skill || !imageTags) return;
        renderTags(imageTags, skill.tags);
    }

    function toggleAccordion(index) {
        accordionOpenIndex = accordionOpenIndex === index ? -1 : index;
        if (accordionOpenIndex !== -1) {
            updateMedia(accordionOpenIndex);
            updateImageTags(accordionOpenIndex);
        }
        syncAccordionState();
    }

    function stepAccordion(direction) {
        const fromIndex = accordionOpenIndex === -1
            ? (direction > 0 ? -1 : 0)
            : accordionOpenIndex;
        accordionOpenIndex = (fromIndex + direction + skillsCatalog.length) % skillsCatalog.length;
        updateMedia(accordionOpenIndex);
        updateImageTags(accordionOpenIndex);
        syncAccordionState();
    }

    function closeAccordion() {
        accordionOpenIndex = -1;
        syncAccordionState();
    }

    function syncAccordionState() {
        const hasOpen = accordionOpenIndex !== -1;
        accordion.querySelectorAll('.skills-accordion-item').forEach(item => {
            const index = Number(item.dataset.index);
            const isOpen = index === accordionOpenIndex;
            item.classList.toggle('is-open', isOpen);
            item.querySelector('.skills-accordion-head').setAttribute('aria-expanded', String(isOpen));
        });
        // Icon stays a plain plus.circle always (CSS fades it out on the
        // open item) — closing is handled by the single close control
        // below, not by re-clicking the item's own icon.
        accordionNavWrap.classList.toggle('has-open', hasOpen);
        accordionClose.classList.toggle('is-visible', hasOpen);
    }

    // ── Mobile: bottom pill row + floating card ─────────────────────────
    function renderPillrow() {
        skillsCatalog.forEach((skill, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'skills-pill';
            button.dataset.index = String(index);
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-controls', 'skillsCard');

            const hint = document.createElement('span');
            hint.className = 'skills-pill-hint';
            hint.setAttribute('aria-hidden', 'true');
            hint.textContent = '+';

            button.appendChild(hint);
            button.appendChild(document.createTextNode(skill.name));
            button.addEventListener('click', () => expandCard(index));

            pillrow.appendChild(button);
        });
    }

    function renderCardContent(index) {
        const skill = skillsCatalog[index];
        if (!skill) return;

        cardTitle.textContent = skill.name;
        cardOverview.textContent = skill.overview;
        renderTags(cardTags, skill.tags);
    }

    function syncPillrowState() {
        pillrow.querySelectorAll('.skills-pill').forEach(button => {
            const isActive = cardExpanded && Number(button.dataset.index) === cardActiveIndex;
            button.setAttribute('aria-expanded', String(isActive));
        });
    }

    function expandCard(index) {
        cardActiveIndex = index;
        cardExpanded = true;
        renderCardContent(index);
        updateMedia(index);
        card.classList.add('is-expanded');
        card.setAttribute('aria-hidden', 'false');
        pillrow.classList.add('is-hidden');
        prev.classList.add('is-visible');
        next.classList.add('is-visible');
        syncPillrowState();
    }

    function collapseCard() {
        cardExpanded = false;
        card.classList.remove('is-expanded');
        card.setAttribute('aria-hidden', 'true');
        pillrow.classList.remove('is-hidden');
        prev.classList.remove('is-visible');
        next.classList.remove('is-visible');
        syncPillrowState();
    }

    function stepCard(direction) {
        cardActiveIndex = (cardActiveIndex + direction + skillsCatalog.length) % skillsCatalog.length;
        renderCardContent(cardActiveIndex);
        updateMedia(cardActiveIndex);
    }

    // ── Init ──────────────────────────────────────────────────────────
    renderAccordion();
    renderPillrow();
    updateMedia(accordionOpenIndex !== -1 ? accordionOpenIndex : 0);
    updateImageTags(accordionOpenIndex !== -1 ? accordionOpenIndex : 0);
    renderCardContent(0);

    if (accordionUp) accordionUp.addEventListener('click', () => stepAccordion(-1));
    if (accordionDown) accordionDown.addEventListener('click', () => stepAccordion(1));
    if (accordionClose) accordionClose.addEventListener('click', closeAccordion);

    close.addEventListener('click', collapseCard);
    prev.addEventListener('click', () => stepCard(-1));
    next.addEventListener('click', () => stepCard(1));

    card.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') stepCard(-1);
        else if (e.key === 'ArrowRight') stepCard(1);
        else if (e.key === 'Escape') collapseCard();
    });

    // Swipe navigation while expanded (touch devices)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    card.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const elapsed = Date.now() - touchStartTime;

        if (elapsed < 600 && Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            stepCard(deltaX < 0 ? 1 : -1);
        }
    }, { passive: true });
});
