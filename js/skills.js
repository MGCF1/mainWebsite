// Skills section — a fixed-size background image with a leading-edge
// accordion overlaid on it, each item expanding inline to show its overview
// and tags. Same interaction model on both breakpoints (CSS repositions the
// accordion — beside the image on desktop, overlaid at its bottom on
// mobile — see .skills-accordion-column in styles.css); the background
// media itself crossfades but never resizes.
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
    const imageEmpty = document.getElementById('skillsImageEmpty');

    if (!media || !accordion || skillsCatalog.length === 0) return;

    let visibleLayerIndex = 0;
    let accordionOpenIndex = -1;

    // SF Symbols-style outline icon — a real vector glyph (circle + plus),
    // not a background-color div standing in for one.
    const ICON_PLUS_CIRCLE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';
    // Mobile-only (see .skills-accordion-chevron in CSS) — the item
    // immediately before/after the focused one doubles as the prev/next
    // control, so it needs a directional glyph instead of the plus above.
    // One SVG pointing right; CSS rotates it 180deg for the "prev" side.
    const ICON_CHEVRON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"/></svg>';

    function renderTags(container, tags) {
        container.innerHTML = '';
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'skills-tag';
            span.textContent = tag;
            container.appendChild(span);
        });
    }

    // Which of the four directions each caller means (styles.css reads
    // the results via --media-in-x/y and --media-out-x/y) — desktop's
    // up/down stepper moves vertically; a direct capsule click/selection,
    // with no directional information to go on, defaults to 'right' on
    // desktop and 'down' on mobile; mobile's arrow taps and swipes move
    // horizontally, relative to whichever side was tapped/swiped.
    // Percentages, not a fixed pixel distance — relative to
    // the element's OWN size, and this element is always exactly the size
    // of the box (inset: 0), so this scales correctly with the box at any
    // viewport rather than under/overshooting on very small or very large
    // ones the way a fixed px distance would.
    const MEDIA_DIRECTIONS = {
        down: { inX: '0%', inY: '50%', outX: '0%', outY: '-50%' },
        up: { inX: '0%', inY: '-50%', outX: '0%', outY: '50%' },
        left: { inX: '-50%', inY: '0%', outX: '50%', outY: '0%' },
        right: { inX: '50%', inY: '0%', outX: '-50%', outY: '0%' }
    };

    function isMobileViewport() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    // Used by openAccordionIndex — a direct capsule tap (including mobile's
    // arrow cards, which route through the same click handler) rather than
    // the desktop stepper or a swipe.
    function resolveOpenDirection(fromIndex, toIndex) {
        if (isMobileViewport()) {
            if (fromIndex === -1) return 'down'; // fresh tap, nothing to be relative to
            return toIndex > fromIndex ? 'right' : 'left'; // arrow tap, relative to which side
        }
        return 'right'; // desktop: any direct capsule selection defaults to right-in
    }

    // Used by stepAccordion — the up/down stepper (desktop) and swipe
    // gesture (mobile) both move through the catalog by +1/-1; which axis
    // that step reads as depends on the breakpoint.
    function resolveStepDirection(step) {
        if (isMobileViewport()) return step > 0 ? 'right' : 'left';
        return step > 0 ? 'down' : 'up';
    }

    function updateMedia(index, direction) {
        const skill = skillsCatalog[index];
        if (!skill || mediaLayers.length < 2) return;

        const nextLayerIndex = visibleLayerIndex === 0 ? 1 : 0;
        const nextLayer = mediaLayers[nextLayerIndex];
        const currentLayer = mediaLayers[visibleLayerIndex];

        const d = MEDIA_DIRECTIONS[direction] || MEDIA_DIRECTIONS.down;
        media.style.setProperty('--media-in-x', d.inX);
        media.style.setProperty('--media-in-y', d.inY);
        media.style.setProperty('--media-out-x', d.outX);
        media.style.setProperty('--media-out-y', d.outY);

        // background-image, not the background shorthand — the shorthand
        // resets background-size/position/repeat to their defaults, which
        // would undo the CSS contain/center rules. Real image if the
        // catalog entry has one, gradient as the fallback for any entry
        // that doesn't yet.
        nextLayer.style.backgroundImage = skill.image ? `url('${skill.image}')` : skill.gradient;

        // Rapid stepping could catch this layer still mid-exit from a
        // couple calls ago (it was the "current" layer then) — clear that
        // first so it starts from a clean resting state, not wherever its
        // own exit animation had gotten to.
        if (nextLayer._mediaExitTimer) {
            clearTimeout(nextLayer._mediaExitTimer);
            nextLayer._mediaExitTimer = null;
        }
        nextLayer.classList.remove('is-exiting');

        // Not visible yet, but the --media-in-x/y custom properties it
        // reads for its resting transform just changed above — pin it
        // there with transitions off first, THEN flip to is-visible on
        // the next frame instead of in this same tick. Adding is-visible
        // immediately, while transition: none was still in effect, was
        // the actual bug: it jumped straight to its final state in that
        // same instant, and by the time transitions were re-enabled a
        // frame later there was nothing left to animate — the enter
        // transition just never played.
        nextLayer.style.transition = 'none';
        void nextLayer.offsetWidth; // force layout so 'none' actually applies before the flip below

        requestAnimationFrame(() => {
            nextLayer.style.transition = '';
            nextLayer.classList.add('is-visible');
            currentLayer.classList.remove('is-visible');
            // Applied the same instant is-visible is removed above —
            // without it, the outgoing layer would just fall back to the
            // plain resting state (styles.css), which uses the ENTERING
            // offset, not the mirrored exit direction it should continue
            // away in.
            currentLayer.classList.add('is-exiting');
        });

        // Cleared once its own exit transition has actually finished, so
        // it's a plain resting layer again (not still "exiting") the next
        // time it's reused as the entering one.
        if (currentLayer._mediaExitTimer) clearTimeout(currentLayer._mediaExitTimer);
        currentLayer._mediaExitTimer = setTimeout(() => {
            currentLayer.classList.remove('is-exiting');
            currentLayer._mediaExitTimer = null;
        }, 420);

        visibleLayerIndex = nextLayerIndex;
    }

    // Closing doesn't bring in a new skill (nothing replaces the current
    // one — the accordion just goes back to nothing selected), so this
    // only plays the exit half of updateMedia's transition, on whichever
    // layer is currently showing. Without this, closeAccordion never
    // touched the media layers at all, so the last-viewed image just sat
    // there frozen in place instead of animating away.
    function exitMedia(direction) {
        if (mediaLayers.length < 2) return;
        const currentLayer = mediaLayers[visibleLayerIndex];
        // d.inX/inY, not d.outX/outY — those are the MIRROR offsets used
        // when something is also entering, e.g. direction 'left' means
        // "the new image enters FROM the left" (inX) and the old one
        // continues on to the right (outX), away from it. There's no
        // entering counterpart here, just this one layer leaving, so
        // 'left' needs to mean this layer actually travels left — d.inX's
        // own literal value ('-50%' for 'left'), not d.outX's mirrored
        // one ('50%', which was sending it right instead).
        const d = MEDIA_DIRECTIONS[direction] || MEDIA_DIRECTIONS.down;
        media.style.setProperty('--media-out-x', d.inX);
        media.style.setProperty('--media-out-y', d.inY);

        currentLayer.classList.remove('is-visible');
        currentLayer.classList.add('is-exiting');

        if (currentLayer._mediaExitTimer) clearTimeout(currentLayer._mediaExitTimer);
        currentLayer._mediaExitTimer = setTimeout(() => {
            currentLayer.classList.remove('is-exiting');
            currentLayer._mediaExitTimer = null;
        }, 420);
    }

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
            // Same click handler regardless of current role — tapping any
            // non-focused card just focuses it (toggleAccordion only
            // *closes* when the tapped index is already the open one,
            // which a non-focused card never is), so this doubles as the
            // prev/next control for free.
            head.addEventListener('click', () => toggleAccordion(index));

            // Mobile-only, shown instead of the head above when this item
            // is playing the before/after-open role (see
            // syncAccordionState) — a plain overlay sibling of head, not a
            // child of it, so its own padding/justify-content/opacity can
            // never affect head's box (and by extension the item's own
            // measured collapsed width, see pinCollapsedWidths — head has
            // to stay free to shrink-wrap to just the icon+name for that
            // measurement to be correct). Its own click listener, since it
            // isn't nested inside the head button anymore.
            const arrow = document.createElement('span');
            arrow.className = 'skills-accordion-head-arrow';

            const chevron = document.createElement('span');
            chevron.className = 'skills-accordion-chevron';
            chevron.innerHTML = ICON_CHEVRON;

            arrow.appendChild(chevron);
            arrow.addEventListener('click', () => toggleAccordion(index));

            const body = document.createElement('div');
            body.className = 'skills-accordion-body';

            const bodyInner = document.createElement('div');
            bodyInner.className = 'skills-accordion-body-inner';

            const panel = document.createElement('div');
            panel.className = 'skills-accordion-panel';

            const overview = document.createElement('p');
            overview.className = 'skills-overview';
            overview.textContent = skill.overview;

            // Same tags as .skills-image-tags (desktop's image overlay) —
            // CSS hides this copy on desktop and shows it on mobile, which
            // has no separate tags row (see .skills-accordion-tags).
            const tags = document.createElement('div');
            tags.className = 'skills-tags skills-accordion-tags';
            renderTags(tags, skill.tags);

            panel.appendChild(overview);
            panel.appendChild(tags);
            bodyInner.appendChild(panel);
            body.appendChild(bodyInner);

            item.appendChild(head);
            item.appendChild(arrow);
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

    function updateImageTags(index) {
        const skill = skillsCatalog[index];
        if (!skill || !imageTags) return;
        renderTags(imageTags, skill.tags);
    }

    function toggleAccordion(index) {
        if (accordionOpenIndex === index) {
            closeAccordion();
            return;
        }
        openAccordionIndex(index);
    }

    function openAccordionIndex(index) {
        // Tapping one of the arrow cards (is-before-open/is-after-open)
        // comes through here too, not just stepAccordion below — same
        // toggleAccordion click handler regardless of which card was
        // tapped (see renderAccordion), and the same 350ms default applies
        // either way: whether width is actually growing (a genuine first
        // tap from the collapsed row) or just height (stepping from an
        // already-open card), that's the one CSS transition duration used
        // throughout this component, so matching it is what keeps the
        // previous card collapsing, the new one expanding, and the scroll
        // moving all reading as one single motion instead of a sequence.
        const fromIndex = accordionOpenIndex; // captured before it's overwritten, for resolveOpenDirection below
        accordionOpenIndex = index;
        updateMedia(index, resolveOpenDirection(fromIndex, index));
        updateImageTags(index);
        syncAccordionState();
        scrollToIndex(index);
    }

    function stepAccordion(step) {
        const fromIndex = accordionOpenIndex === -1
            ? (step > 0 ? -1 : 0)
            : accordionOpenIndex;
        accordionOpenIndex = (fromIndex + step + skillsCatalog.length) % skillsCatalog.length;
        updateMedia(accordionOpenIndex, resolveStepDirection(step));
        updateImageTags(accordionOpenIndex);
        syncAccordionState();
        scrollToIndex(accordionOpenIndex);
    }

    function closeAccordion() {
        if (accordionOpenIndex === -1) return;
        const closingIndex = accordionOpenIndex;
        accordionOpenIndex = -1;
        syncAccordionState();
        // Closing has no "which direction did this come from" to be
        // relative to the way stepping/selecting does, so this just picks
        // one fixed exit per breakpoint — left on desktop (mirroring a
        // capsule's own resting position, to the left of the image), up
        // on mobile.
        exitMedia(isMobileViewport() ? 'up' : 'left');
        // Same precomputed-target approach as opening/stepping, and for
        // the same reason — matches the CSS width transition's own 350ms
        // curve exactly, since the closing item really is shrinking back
        // down while this runs.
        scrollToClosedIndex(closingIndex);
    }

    // The exact SAME curve every width/height transition in this component
    // uses (cubic-bezier(0.4, 0, 0.2, 1), styles.css) — needed so that
    // while an item is genuinely growing (a fresh open from the collapsed
    // row), the scroll and the layout's own width growth land at the same
    // fractional progress at every intermediate frame, not just at the
    // very end. A different-shaped curve — even one that finishes at
    // exactly the same time — moves through that time differently moment
    // to moment: it was arriving at the target scroll position well before
    // the still-growing items around it had caught up to their own final
    // width, so the item looked off-center for most of the animation and
    // only snapped into place once the width growth actually finished.
    // Standard Newton-Raphson bezier solve (find t for a given x, then
    // evaluate y at that t) — same technique browsers use internally.
    function easeStandard(x) {
        const p1x = 0.4, p1y = 0, p2x = 0.2, p2y = 1;
        const sampleX = t => { const mt = 1 - t; return 3 * mt * mt * t * p1x + 3 * mt * t * t * p2x + t * t * t; };
        const sampleY = t => { const mt = 1 - t; return 3 * mt * mt * t * p1y + 3 * mt * t * t * p2y + t * t * t; };
        let t = x;
        for (let i = 0; i < 6; i++) {
            const dx = sampleX(t) - x;
            if (Math.abs(dx) < 1e-5) break;
            const mt = 1 - t;
            const derivative = 3 * mt * mt * p1x + 6 * mt * t * (p2x - p1x) + 3 * t * t * (1 - p2x);
            if (Math.abs(derivative) < 1e-6) break;
            t -= dx / derivative;
        }
        return sampleY(t);
    }

    // Scrolls toward a PRECOMPUTED, fixed target instead of continuously
    // chasing an item's live (still-animating) center — chasing a live
    // target was the source of the original jittery motion: with several
    // siblings all resizing at once on a decelerating curve, the live
    // target moves fastest right when a reactive filter has had the least
    // time to catch up, and it ends up hunting back and forth trying to
    // track it. A single fixed number, approached on the exact same curve
    // as the layout change driving it (easeStandard above), has nothing to
    // hunt after and stays in sync with it the whole way, not just at the
    // end. Shared by scrollToIndex and scrollToClosedIndex below, and by
    // extension opening, stepping, and closing all move the same way.
    //
    // Stepping through several skills quickly calls one of those again
    // before an earlier call's loop has finished — without cancelling that
    // one first, both would keep running at once, each nudging scrollLeft
    // toward a DIFFERENT target every frame, fighting each other instead
    // of smoothly landing on whichever one ran last. centeringFrameId is
    // the one in-flight loop this component ever has; a new call always
    // cancels it before starting its own.
    let centeringFrameId = null;

    function animateScrollTo(target, duration) {
        if (centeringFrameId !== null) cancelAnimationFrame(centeringFrameId);
        const startScroll = accordion.scrollLeft;
        const distance = target - startScroll;
        const start = performance.now();
        function tick(now) {
            const t = Math.min((now - start) / duration, 1);
            accordion.scrollLeft = startScroll + distance * easeStandard(t);
            centeringFrameId = (t < 1) ? requestAnimationFrame(tick) : null;
        }
        centeringFrameId = requestAnimationFrame(tick);
    }

    // Opening/stepping target — every item shares the same width once
    // anything's open (--skills-open-w) and a fixed 8px gap
    // (.skills-accordion's own gap, styles.css), so the item's eventual
    // position is fully known up front, without waiting for the CSS width
    // transition to actually finish.
    function openTargetFor(index) {
        const openWidth = parseFloat(getComputedStyle(accordion).getPropertyValue('--skills-open-w')) || 0;
        const gap = 8;
        const leadingSpacer = 40;
        // leadingSpacer + gap, not just leadingSpacer — the spacer is a
        // real flex child (styles.css), and the row's own flex gap applies
        // between IT and item0 too, same as between any other two items.
        // Missing that gap here made every target a flat 8px short,
        // shifting the open card 8px right of true center: more room
        // peeking on the left than the right, for every skill, not just
        // the boundary ones.
        const itemCenter = leadingSpacer + gap + index * (openWidth + gap) + openWidth / 2;
        return itemCenter - accordion.clientWidth / 2;
    }

    // This can easily exceed what the row's CURRENT (pre-transition,
    // still-collapsed) scrollable width actually allows right at the
    // start — the browser would just clamp it — which is what the
    // trailing spacer's own huge, un-transitioned width (styles.css) is
    // for: it guarantees there's already enough room the instant this
    // runs, regardless of which skill was tapped.
    function scrollToIndex(index, duration = 350) {
        animateScrollTo(openTargetFor(index), duration);
    }

    // Closing target — the mirror of scrollToIndex above, but every item
    // has its OWN collapsed width (--skills-item-w, pinned once in
    // pinCollapsedWidths) rather than sharing one, and the row's own 16px
    // padding takes the place of the leading spacer (both only apply while
    // something's open — see .skills-accordion/.has-open-item, styles.css)
    // — so this has to sum each preceding item's actual width instead of
    // using a flat per-item formula.
    function scrollToClosedIndex(index, duration = 350) {
        const items = accordion.querySelectorAll('.skills-accordion-item');
        const gap = 8;
        const rowPadding = 16;
        let left = rowPadding;
        for (let i = 0; i < index; i++) {
            const w = parseFloat(getComputedStyle(items[i]).getPropertyValue('--skills-item-w')) || 0;
            left += w + gap;
        }
        const targetWidth = parseFloat(getComputedStyle(items[index]).getPropertyValue('--skills-item-w')) || 0;
        animateScrollTo(left + targetWidth / 2 - accordion.clientWidth / 2, duration);
    }

    function syncAccordionState() {
        const hasOpen = accordionOpenIndex !== -1;
        // Toggled BEFORE accordion.clientWidth is read below, not after —
        // this is what switches the row's own padding from 16px to 0 (see
        // .skills-accordion.has-open-item in styles.css), so reading
        // clientWidth first (on a genuinely fresh open, where this hadn't
        // been applied yet on any earlier call) measured the row 32px
        // narrower than it was about to become, undersizing --skills-open-w
        // for every card. Stepping to another skill afterward didn't show
        // this — has-open-item was already applied from the initial open
        // by then — which was what made it look like only one side/one
        // specific interaction was affected rather than every fresh open.
        accordion.classList.toggle('has-open-item', hasOpen);
        // An explicit pixel value (not left+right auto-sizing) so opening
        // an item can transition width from its collapsed size (also a
        // plain pixel value, --skills-item-w) to this — plain property
        // transitions handle that fine on their own since every item stays
        // a real, in-flow flex child the whole time (see --skills-open-w
        // in the mobile media query in styles.css). 40px on each side
        // reserves room for a sliver of the adjacent (also full-width)
        // item to peek in past the row's own edge.
        const openWidth = hasOpen ? accordion.clientWidth - 40 - 40 : null;
        if (openWidth !== null) accordion.style.setProperty('--skills-open-w', `${openWidth}px`);

        accordion.querySelectorAll('.skills-accordion-item').forEach(item => {
            const index = Number(item.dataset.index);
            const isOpen = index === accordionOpenIndex;
            item.classList.toggle('is-open', isOpen);
            // Mobile-only roles: every OTHER skill, not just the immediate
            // neighbors, doubles as a directional control while one is
            // focused — see the shared click handler in renderAccordion.
            // Layout (width: 100%, padding, justify-content — see CSS)
            // applies immediately, in step with the item's own width
            // growth; the actual name/icon -> chevron content swap is a
            // separate, delayed .is-arrow class (below) so it doesn't
            // happen the instant the card starts growing, well before it
            // even looks like an arrow yet.
            const isBeforeOpen = hasOpen && index < accordionOpenIndex;
            const isAfterOpen = hasOpen && index > accordionOpenIndex;
            item.classList.toggle('is-before-open', isBeforeOpen);
            item.classList.toggle('is-after-open', isAfterOpen);
            item.querySelector('.skills-accordion-head').setAttribute('aria-expanded', String(isOpen));

            if (isBeforeOpen || isAfterOpen) {
                // Only schedule once — if it's already an arrow, or
                // already has a swap pending, leave it alone rather than
                // pushing the delay out further on every sync call.
                if (!item.classList.contains('is-arrow') && !item._arrowTimer) {
                    item._arrowTimer = setTimeout(() => {
                        item.classList.add('is-arrow');
                        item._arrowTimer = null;
                    }, 175);
                }
            } else {
                // No longer before/after-open (became the open item
                // itself, or nothing's open anymore) — drop the pending
                // swap and any content-swap already applied right away,
                // matching how quickly everything else (text, width)
                // reacts to no longer being in that role.
                if (item._arrowTimer) {
                    clearTimeout(item._arrowTimer);
                    item._arrowTimer = null;
                }
                item.classList.remove('is-arrow');
            }
        });

        // Icon stays a plain plus.circle always (CSS fades it out on the
        // open item) — closing is handled by the single close control
        // below, not by re-clicking the item's own icon. has-open-item
        // itself was already toggled at the top of this function.
        accordionNavWrap.classList.toggle('has-open', hasOpen);
        accordionClose.classList.toggle('is-visible', hasOpen);
        if (imageEmpty) imageEmpty.classList.toggle('is-visible', !hasOpen);
        if (imageTags) imageTags.classList.toggle('is-visible', hasOpen);
    }

    // ── Init ──────────────────────────────────────────────────────────
    renderAccordion();

    if (accordionUp) accordionUp.addEventListener('click', () => stepAccordion(-1));
    if (accordionDown) accordionDown.addEventListener('click', () => stepAccordion(1));
    if (accordionClose) accordionClose.addEventListener('click', closeAccordion);

    // Every size this component uses (--skills-item-w, --skills-open-w,
    // the scroll targets derived from them) is measured/computed against
    // the viewport at the moment it happens to run, not kept continuously
    // in sync — so a resize (rotating the device, resizing a desktop
    // window) between those moments leaves it all stale until the next
    // tap. Debounced (a resize fires continuously while dragging/
    // rotating, not once at the end) — recomputes collapsed widths and
    // --skills-open-w unconditionally, and if something's currently open,
    // snaps it straight to its new centered position instead of
    // re-animating there (a resize isn't a transition, so easing toward it
    // would just look like an unprompted slide).
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            pinCollapsedWidths();
            syncAccordionState();
            if (accordionOpenIndex !== -1) {
                if (centeringFrameId !== null) cancelAnimationFrame(centeringFrameId);
                accordion.scrollLeft = openTargetFor(accordionOpenIndex);
            }
        }, 150);
    });

    // Swipe between skills while one is focused (mobile only in practice —
    // on desktop nothing ever overlaps the row enough for a swipe gesture
    // to make sense, and there's no touch input to fire these events).
    // Ignored entirely while nothing's open, so the row's native
    // horizontal scroll (collapsed capsules) isn't hijacked.
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    accordion.addEventListener('touchstart', (e) => {
        if (accordionOpenIndex === -1) return;
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
    }, { passive: true });

    accordion.addEventListener('touchend', (e) => {
        if (accordionOpenIndex === -1) return;
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const elapsed = Date.now() - touchStartTime;

        if (elapsed < 600 && Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            stepAccordion(deltaX < 0 ? 1 : -1);
        }
    }, { passive: true });
});
