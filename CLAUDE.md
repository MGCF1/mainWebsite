# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Milo Cassarino's personal portfolio site (mgcf1.com) — a static HTML/CSS/vanilla-JS site with no build step, no bundler, and no package.json. Deployed via GitHub Pages (see `CNAME`, `_config.yml`).

## Running locally

There's no npm install or build step. Serve the directory as static files, e.g.:

```
npx serve . -l 3000
```

A `.claude/launch.json` config already wires this up for the preview tool (`Static Site`, port 3000).

## Architecture

**Data/render split.** Content lives in plain JS files under `data/*.js` (each sets a `window.<name>Data` / `window.<name>Catalog` global), and rendering logic lives in matching files under `js/*.js`. `index.html` loads each data file immediately before its renderer script, in this order: `projects` → `app-grid.js`, `tools-data` → `tools.js`, `highlights-data` → `highlights.js`, `connect-data` → `connect.js`, `about-data` → `about.js`. To change site content (project list, tools, highlights, contact links, about facts), edit the relevant `data/*.js` file — don't touch the renderer unless the display logic itself needs to change.

- `data/projects.js` → `js/app-grid.js`: the animated floating-icon background grid on the hero section. Also the source of truth for the app list used elsewhere (e.g. project icons).
- `data/tools-data.js` → `js/tools.js`: the "Tools" section (sidebar list + floating icon grid + click-to-expand detail view).
- `data/highlights-data.js` → `js/highlights.js`: the "Recent Highlights" horizontal-scroll cards.
- `data/connect-data.js` → `js/connect.js`: the phone-mockup contact icons in the footer.
- `data/about-data.js` → `js/about.js`: the "About Me" horizontal-scroll cards.
- `js/safe-area.js`: computes a `--dynamic-safe-bottom` CSS var from `visualViewport` for iOS safe-area handling; not tied to a specific data file.

**`data/projects.json` and `data/about-data.json` are unused legacy files** — nothing references them; the live data is in the `.js` sibling files (`projects.js`, `about-data.js`). Don't edit the `.json` files expecting them to affect the site.

**Project detail pages** live in `projects/*.html`, one file per app, linked from `data/projects.js` (`url` field) and `data/highlights-data.js` (`link` field). Only `projects/nybiker.html` is a real, fully custom page (scroll-hijacked phone animation, own inline `<style>` block). `projects/project-1.html` through `project-10.html` are an unused placeholder/boilerplate template (copies of the same generic scaffold with `[task/purpose]`-style filler copy) — not linked from anywhere live; treat them as a starting template if a new project page is needed, not as real content.

**CSS.** `css/styles.css` holds global/shared styles (reset, nav, hero, sections, tools, about, connect/phone mockup) and defines the color system as CSS custom properties on `:root` with a `@media (prefers-color-scheme: dark)` override block — no light/dark JS toggle, it follows the OS setting. `css/project.css` holds shared styles for the `projects/*.html` detail pages. Project pages that need unique visuals (like `nybiker.html`) add their own scoped inline `<style>` block rather than editing the shared CSS files.

**No frameworks, no modules.** All JS is plain global-scope scripts loaded via `<script src>` tags in a specific order (data before renderer); there's no bundler, no ES module imports, no npm dependencies. Keep new code consistent with this style unless asked to change the architecture.

**iOS integration files:** `.well-known/apple-app-site-association` defines universal links / App Clip associations for NYBiker, Divvy, and QuickVo (`/nybiker*`, `/divvy*`, `/quickvo*` paths route to the respective iOS apps). `_config.yml` is a minimal Jekyll config that exists solely so GitHub Pages includes the dotfile-prefixed `.well-known` directory in the build (Jekyll excludes dotfiles by default).

## Conventions observed in existing code

- Data entries commonly include a `gradient` (CSS `linear-gradient(...)`) used as an icon fallback/background alongside an `icon` image path.
- Entries linking off-site set `"external": true` so renderers add `target="_blank" rel="noopener noreferrer"`.
- No test suite, linter, or CI config exists in this repo.
