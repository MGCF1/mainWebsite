// Tools section interactivity
const toolsCatalog = window.toolsCatalog || [];

const toolsData = {};
const toolKeys = [];

toolsCatalog.forEach(group => {
    group.items.forEach(item => {
        toolsData[item.key] = item;
        toolKeys.push(item.key);
    });
});

const iconPositions = (() => {
    const toolsGrid = document.querySelector('.tools-grid');
    const gridWidth = toolsGrid ? toolsGrid.offsetWidth : 400;
    const isMobile = window.innerWidth <= 768;
    const baseSize = gridWidth * (isMobile ? 0.22 : 0.18);

    const positions = [];
    const cols = isMobile ? 3 : 4;
    const rows = isMobile ? 4 : 3;

    for (let i = 0; i < toolKeys.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;

        // Grid cell centers
        const baseX = ((col + 0.5) / cols) * 100;
        const baseY = ((row + 0.5) / rows) * 100;

        // Minimal deterministic jitter (+/- 2% max) for "nearly exact" feel
        const jitterX = ((37 * i) % 4 - 2);
        const jitterY = ((17 * i) % 4 - 2);

        const x = baseX + jitterX;
        const y = baseY + jitterY;

        positions.push({
            x,
            y,
            size: baseSize * (0.95 + ((i * 13) % 10) / 100), // very subtle scale var
            phaseX: (i * 1.5) % (Math.PI * 2),
            phaseY: (i * 2.5) % (Math.PI * 2),
            speedX: 0.0006 + ((i * 7) % 5) * 0.0001,
            speedY: 0.0006 + ((i * 3) % 5) * 0.0001,
            amp: 0.5 + ((i * 11) % 5) * 0.05 // Tiny sway
        });
    }

    return positions;
})();

document.addEventListener('DOMContentLoaded', () => {
    const toolsList = document.getElementById('toolsList');
    const toolsGrid = document.getElementById('toolsGrid');
    const toolsDetail = document.getElementById('toolsDetail');

    if (!toolsList || !toolsGrid || !toolsDetail) return;

    toolsCatalog.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.className = 'tools-group';

        const title = document.createElement('h3');
        title.className = 'caption-label tools-group-title';
        title.textContent = group.title;
        groupEl.appendChild(title);

        const list = document.createElement('ul');
        list.className = 'tools-group-items';

        group.items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'tools-group-item';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'tool-name';
            button.dataset.tool = item.key;
            button.setAttribute('aria-pressed', 'false');

            const toggle = document.createElement('span');
            toggle.className = 'tool-toggle';
            toggle.setAttribute('aria-hidden', 'true');

            button.appendChild(toggle);
            button.appendChild(document.createTextNode(item.name));

            li.appendChild(button);
            list.appendChild(li);
        });

        groupEl.appendChild(list);
        toolsList.appendChild(groupEl);
    });

    toolKeys.forEach(key => {
        const tool = toolsData[key];
        if (!tool) return;

        const iconItem = document.createElement('div');
        iconItem.className = 'tool-icon-item';
        iconItem.dataset.tool = key;

        const img = document.createElement('img');
        img.src = tool.image;
        img.alt = tool.name;
        iconItem.appendChild(img);

        toolsGrid.appendChild(iconItem);
    });

    const toolNames = toolsList.querySelectorAll('.tool-name');
    const toolIconItems = toolsGrid.querySelectorAll('.tool-icon-item');

    let activeToolKey = null;
    let gridRect = toolsGrid.getBoundingClientRect();

    window.addEventListener('resize', () => {
        gridRect = toolsGrid.getBoundingClientRect();
    });

    // Initialize properties on items
    toolIconItems.forEach((el, i) => {
        const pos = iconPositions[i] || { x: 50, y: 50, size: 90 };
        el.dataset.baseX = pos.x;
        el.dataset.baseY = pos.y;
        el.dataset.phaseX = pos.phaseX || 0;
        el.dataset.phaseY = pos.phaseY || 0;
        el.dataset.speedX = pos.speedX || 0.001;
        el.dataset.speedY = pos.speedY || 0.001;
        el.dataset.amp = pos.amp || 1;
        el.style.width = pos.size + 'px';
        el.style.height = pos.size + 'px';
    });

    function updateIcons() {
        if (activeToolKey) return; // Pause while detail is shown

        const time = performance.now();

        toolIconItems.forEach((el) => {
            const baseX = parseFloat(el.dataset.baseX);
            const baseY = parseFloat(el.dataset.baseY);
            const phaseX = parseFloat(el.dataset.phaseX);
            const phaseY = parseFloat(el.dataset.phaseY);
            const speedX = parseFloat(el.dataset.speedX);
            const speedY = parseFloat(el.dataset.speedY);
            const amp = parseFloat(el.dataset.amp);

            // Smoothing with multi-wave oscillation
            const swayX = (Math.sin(time * speedX + phaseX) * 0.7 + Math.sin(time * speedX * 0.5 + phaseX) * 0.3) * amp;
            const swayY = (Math.cos(time * speedY + phaseY) * 0.7 + Math.cos(time * speedY * 0.5 + phaseY) * 0.3) * amp;

            const finalX = baseX + swayX;
            const finalY = baseY + swayY;

            // Use cached gridRect to avoid layout thrashing (eliminates jitter)
            const pxX = (finalX / 100) * gridRect.width;
            const pxY = (finalY / 100) * gridRect.height;

            el.style.transform = `translate3d(${pxX}px, ${pxY}px, 0) translate(-50%, -50%)`;
        });

        requestAnimationFrame(updateIcons);
    }

    toolsGrid.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        isMouseInside = true;
    });

    toolsGrid.addEventListener('mouseleave', () => {
        isMouseInside = false;
    });

    requestAnimationFrame(updateIcons);

    function updateToggles() {
        // Icon swap is handled purely via CSS (.active class toggles background-image)
    }

    function updateActiveState(toolKey) {
        toolNames.forEach(el => {
            const isActive = el.dataset.tool === toolKey;
            el.classList.toggle('active', isActive);
            el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        updateToggles();
    }

    function selectTool(toolKey) {
        // If clicking the same tool, deselect
        if (activeToolKey === toolKey) {
            deselectTool();
            return;
        }

        activeToolKey = toolKey;
        const tool = toolsData[toolKey];
        if (!tool) return;

        updateActiveState(toolKey);

        // Populate detail view
        const detailIcon = toolsDetail.querySelector('.tools-detail-icon');
        const detailName = toolsDetail.querySelector('.tools-detail-name');
        const detailDesc = toolsDetail.querySelector('.tools-detail-desc');

        detailIcon.src = tool.image;
        detailIcon.alt = tool.name;
        detailName.textContent = tool.name;
        detailDesc.textContent = tool.description;

        // Transition: hide grid, show detail
        toolsGrid.classList.add('is-hidden');
        toolsGrid.setAttribute('aria-hidden', 'true');
        toolsDetail.classList.add('is-visible');
        toolsDetail.setAttribute('aria-hidden', 'false');
    }

    function deselectTool() {
        const wasSelected = activeToolKey !== null;
        activeToolKey = null;
        updateActiveState(null);
        toolsGrid.classList.remove('is-hidden');
        toolsGrid.setAttribute('aria-hidden', 'false');
        toolsDetail.classList.remove('is-visible');
        toolsDetail.setAttribute('aria-hidden', 'true');

        // Restart animation loop if it was paused
        if (wasSelected) {
            requestAnimationFrame(updateIcons);
        }
    }

    // Click handlers on tool names in sidebar
    toolNames.forEach(el => {
        el.addEventListener('click', () => {
            selectTool(el.dataset.tool);
        });
    });

    // Click handlers on grid icons
    toolIconItems.forEach(el => {
        el.addEventListener('click', () => {
            selectTool(el.dataset.tool);
        });
    });

    // No default selection — start with grid visible
});
