#!/usr/bin/env node
/* ==========================================================================
   Antz Design System · docs site tool
   Keeps every docs page consistent and renders new pages from fragments.

     node tools/docs.mjs        render docs-src/*.html into pages/, then update
                                the header, navigation, pager and footer of
                                every page from pages/_nav.json

   Add a page: write docs-src/<slug>.html (see an existing one), add the slug
   to pages/_nav.json, run this tool. Never hand-edit the nav in a page.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
// Cache-busting tag: a short hash of the shared assets, so every deploy that changes them makes browsers fetch the new files.
const ASSET_V = (await import('node:crypto')).createHash('sha256').update(['tokens.css', 'components.css', 'components.js', 'assets/site.css', 'assets/site.js', 'assets/screens.js']
  .map((f) => { try { return fs.readFileSync(path.join(ROOT, f)); } catch { return ''; } }).join('')).digest('hex').slice(0, 10);
const NAV = JSON.parse(fs.readFileSync(path.join(ROOT, 'pages/_nav.json'), 'utf8'));
const SITE = 'Antz Design System';
const label = VERSION.replace(/-beta\.(\d+)/, ' beta $1').replace(/-rc\.(\d+)/, ' RC $1');

// ── Render new pages from docs-src fragments ─────────────────────────────
// Fragment: <!--meta {"title":..,"group":..,"intro":..,"icon":..,"hue":..}--> overview HTML <!--usage--> usage HTML <!--code--> code HTML
const SRC = path.join(ROOT, 'docs-src');
const titleOf = {};
for (const g of NAV.groups) for (const l of g.links) titleOf[l.href] = l.title;
if (fs.existsSync(SRC)) for (const f of fs.readdirSync(SRC).filter((n) => n.endsWith('.html'))) {
  const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
  const meta = JSON.parse(raw.match(/<!--meta\s*([\s\S]*?)-->/)[1]);
  const body = raw.replace(/<!--meta[\s\S]*?-->/, '');
  const [overview, rest = ''] = body.split('<!--usage-->');
  const [usage = '', code = ''] = rest.split('<!--code-->');
  const slug = f.replace(/\.html$/, '');
  const tab = (id, label, html, first) => html.trim() ? `<section class="tab-panel" id="panel-${id}" data-tab="${id}" role="tabpanel" aria-labelledby="tab-${id}"${first ? '' : ' hidden'}>${html.trim()}</section>` : '';
  const tabs = [['overview', 'Overview', overview], ['usage', 'Usage', usage], ['code', 'Code', code]].filter((t) => t[2].trim());
  const page = `<!doctype html>
<html lang="en" data-root="..">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title} · ${SITE}</title>
<link rel="icon" href="data:,">
<meta name="description" content="${meta.intro.replace(/"/g, '&quot;')}">
<script>/*head*/</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../tokens.css?v=1">
<link rel="stylesheet" href="../components.css?v=1">
<link rel="stylesheet" href="../assets/site.css?v=1">
</head>
<body data-page="${slug}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-top"></header><div class="site-scrim"></div>
<div class="site">
<nav class="site-nav" id="site-nav" aria-label="Documentation"></nav>
<main class="site-main" id="main">
<header class="page-banner"><div class="page-banner__text"><span class="t-overline">${meta.group}</span><h1 class="page-banner__title">${meta.title}</h1><p class="page-banner__intro">${meta.intro}</p></div><div class="page-banner__art" style="--c:var(--hue-${meta.hue || 'green'})" aria-hidden="true"><svg class="icon"><use href="#i-${meta.icon || 'grid'}"/></svg></div></header>
${tabs.length > 1 ? `<div class="page-tabs" role="tablist" aria-label="Page sections">${tabs.map((t, i) => `<button role="tab" type="button" id="tab-${t[0]}" aria-controls="panel-${t[0]}" aria-selected="${i === 0}" data-tab="${t[0]}"${i ? ' tabindex="-1"' : ''}>${t[1]}</button>`).join('')}</div>` : ''}
<div class="page-body"><div class="page-content">
${tabs.map((t, i) => tab(t[0], t[1], t[2], i === 0)).join('')}
<nav class="pager" aria-label="Previous and next page"></nav>
</div><aside class="page-toc" id="page-toc" aria-label="On this page"></aside></div>
<footer class="site-foot"></footer>
</main>
</div>
<div class="toast-region" id="toasts" role="status" aria-live="polite"></div>
<script src="../components.js?v=1"></script>
<script src="../assets/site.js?v=1"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, 'pages', slug + '.html'), page);
}

// ── Shared chrome ────────────────────────────────────────────────────────
const HEAD_SCRIPT = `<script>try { var d = document.documentElement, t = localStorage.getItem('antz-ds-theme'), c = localStorage.getItem('antz-ds-contrast'), n = localStorage.getItem('antz-ds-density'); if (t === 'light' || t === 'dark') d.dataset.theme = t; if (c === 'high' || c === 'standard') d.dataset.contrast = c; if (n === 'compact') d.dataset.density = n; var b = (/[?&]brand=([a-z0-9-]+)/.exec(location.search) || [])[1]; if (b) { if (b === 'antz') localStorage.removeItem('antz-ds-brand'); else localStorage.setItem('antz-ds-brand', b); } else b = localStorage.getItem('antz-ds-brand'); if (b && b !== 'antz' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(b)) { d.dataset.brand = b; var lt = null; try { lt = JSON.parse(localStorage.getItem('antz-ds-local-themes') || 'null'); } catch (e) {} var lc = lt && lt.themes && lt.themes[b], l; if (lc && typeof lc.css === 'string') { l = document.createElement('style'); l.textContent = lc.css; } else { l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('blocking', 'render'); l.href = (d.dataset.root || '.') + '/themes/' + b + '.css'; } l.id = 'brand-css'; document.head.appendChild(l); } } catch (e) {}</script>`;

function header(pre) {
  return `<header class="site-top"><button class="icon-btn site-menu-btn" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="site-nav" data-nav-toggle><svg class="icon"><use href="#i-menu"/></svg></button><a class="icon-btn site-home-btn" href="${pre}index.html" aria-label="Home"><svg class="icon"><use href="#i-home"/></svg></a><a class="site-brand" href="${pre}index.html" aria-label="${SITE}, home"><span class="site-logo"><img class="logo-on-light" src="${pre}assets/img/antz-logo.svg" alt="Antz" width="509" height="194"><img class="logo-on-dark" src="${pre}assets/img/antz-logo-white.svg" alt="Antz" width="509" height="194"></span><span class="site-divider" aria-hidden="true"></span><span class="site-brand__name">Antz Design System</span><small>v${label}</small></a><label class="site-search"><svg class="icon"><use href="#i-search"/></svg><input type="search" placeholder="Search pages" aria-label="Search pages"><kbd>/</kbd></label><button class="icon-btn site-search-btn" type="button" aria-label="Search pages" data-nav-search><svg class="icon"><use href="#i-search"/></svg></button><a class="btn btn--sm site-tester-link" href="${pre}tester.html"><svg class="icon"><use href="#i-sliders"/></svg>Theme tester</a><button class="icon-btn icon-btn--sm site-contrast-btn" type="button" aria-label="High contrast" aria-pressed="false" data-contrast-toggle title="High contrast"><svg class="icon"><use href="#i-eye"/></svg></button><div class="segmented segmented--pill theme-seg" role="group" aria-label="Theme"><button type="button" data-theme-set="auto" aria-pressed="true"><svg class="icon icon--sm"><use href="#i-monitor"/></svg><span>Auto</span></button><button type="button" data-theme-set="light" aria-pressed="false"><svg class="icon icon--sm"><use href="#i-sun"/></svg><span>Light</span></button><button type="button" data-theme-set="dark" aria-pressed="false"><svg class="icon icon--sm"><use href="#i-moon"/></svg><span>Dark</span></button></div></header>`;
}
// Sidebar: the navigation drawer component (floating), with the docs sections as the rail and their pages as the menu.
const TONES = ['green', 'amber', 'navy', 'violet', 'coral', 'slate', 'rose', 'green', 'navy'];
function nav(pre, current) {
  const href = (l) => (l.href.startsWith('../') ? (pre ? l.href : l.href.slice(3)) : (pre ? '' : 'pages/') + l.href);
  let sel = NAV.groups.findIndex((g) => g.links.some((l) => l.href === current)); if (sel < 0) sel = 0;
  const tabs = NAV.groups.map((g, i) => `<button class="navdrawer__tab" type="button" role="tab" id="sn-tab-${i + 1}" aria-controls="sn-${i + 1}" aria-selected="${i === sel}" tabindex="${i === sel ? 0 : -1}" data-tone="${TONES[i % TONES.length]}"><svg class="icon" aria-hidden="true"><use href="#i-${g.icon}"/></svg><span>${g.title.replace('Pattern components', 'Patterns').replace('Getting started', 'Start')}</span></button>`).join('');
  const menus = NAV.groups.map((g, i) => {
    let m = `<div class="navdrawer__menu" role="tabpanel" id="sn-${i + 1}" aria-labelledby="sn-tab-${i + 1}"${i === sel ? '' : ' hidden'}><p class="navdrawer__group">${g.title}</p>`;
    if (i === 0) m += `<a class="navdrawer__item nav-link" href="${pre}index.html"${current === 'index.html' ? ' aria-current="page"' : ''}>Welcome</a>`;
    for (const l of g.links) m += `<a class="navdrawer__item nav-link" href="${href(l)}"${l.href === current ? ' aria-current="page"' : ''}>${l.title}${l.isNew ? ' <span class="nav-new">New</span>' : ''}</a>`;
    return m + '</div>';
  }).join('');
  return `<nav class="site-nav navdrawer navdrawer--floating navdrawer--site" id="site-nav" aria-label="Documentation" data-tone="${TONES[sel % TONES.length]}" data-navdrawer-static>`
    + `<div class="navdrawer__rail"><div class="navdrawer__tabs" role="tablist" aria-orientation="vertical" aria-label="Sections">${tabs}</div></div>`
    + `<div class="navdrawer__panel"><div class="navdrawer__head"><label class="search nav-search"><svg class="icon" aria-hidden="true"><use href="#i-search"/></svg><input type="search" placeholder="Search pages" aria-label="Search pages"></label></div>`
    + menus + `<div class="navdrawer__menu nav-results" hidden><p class="navdrawer__group">Results</p><div class="nav-results__list"></div><p class="nav-empty t-caption" hidden>No page matches.</p></div>`
    + `<footer class="navdrawer__foot"><div class="navdrawer__user"><div><b>Antz Design System</b><small>v${VERSION} · <a href="${pre}pages/versions.html">Versions</a></small></div><a class="icon-btn icon-btn--ghost" href="${pre}tester.html" aria-label="Theme tester"><svg class="icon" aria-hidden="true"><use href="#i-sliders"/></svg></a></div></footer></div></nav>`;
}
const order = NAV.groups.flatMap((g) => g.links.filter((l) => !l.href.startsWith('../')).map((l) => ({ ...l, group: g.title })));
function pager(current) {
  const i = order.findIndex((l) => l.href === current);
  if (i < 0) return '';
  const prev = i > 0 ? order[i - 1] : { href: '../index.html', title: 'Welcome', group: '' };
  const next = order[i + 1];
  return `<nav class="pager" aria-label="Previous and next page"><a class="pager__prev" href="${prev.href}"><svg class="icon"><use href="#i-arrow-left"/></svg><span><small>Previous</small><b>${prev.title}</b></span></a>${next ? `<a class="pager__next" href="${next.href}"><span><small>Next · ${next.group}</small><b>${next.title}</b></span><svg class="icon"><use href="#i-arrow-right"/></svg></a>` : ''}</nav>`;
}
const footer = (pre) => `<footer class="site-foot">${SITE} v${label} · <a href="${pre}pages/versions.html">Versions</a> · <a href="${pre}CHANGELOG.md">Changelog</a> · <a href="${pre}HOW-IT-WORKS.md">How it works</a> · <a href="${pre}colors.json" download>colors.json</a></footer>`.replace(/pages\/pages\//g, 'pages/');

// ── Apply to every page ──────────────────────────────────────────────────
const targets = ['index.html', ...fs.readdirSync(path.join(ROOT, 'pages')).filter((n) => n.endsWith('.html')).map((n) => 'pages/' + n)];
let count = 0;
for (const rel of targets) {
  const p = path.join(ROOT, rel);
  let s = fs.readFileSync(p, 'utf8');
  const inPages = rel.startsWith('pages/');
  const pre = inPages ? '../' : '';
  const cur = inPages ? path.basename(rel) : 'index.html';
  s = s.replace(/<title>([^<]*?) · [^<]*<\/title>/, `<title>$1 · ${SITE}</title>`).replace(/<title>ANTZ Design System Foundation<\/title>/, `<title>${SITE}</title>`);
  s = s.replace(/<script>(\/\*head\*\/|try \{ var d = document\.documentElement[\s\S]*?)<\/script>/, HEAD_SCRIPT);
  if (!s.includes('components.js')) s = s.replace(/<script src="([.\/]*)assets\/site\.js/, '<script src="$1components.js?v=1"></script>\n<script src="$1assets/site.js');
  s = s.replace(/(tokens|components|site)\.(css|js)\?v=[0-9a-z]+/g, `$1.$2?v=${ASSET_V}`);
  s = s.replace(/<header class="site-top">[\s\S]*?<\/header>/, header(pre));
  s = s.replace(/<nav class="site-nav"[\s\S]*?<\/nav>/, nav(pre, cur));
  if (inPages) s = s.replace(/<nav class="pager"[\s\S]*?<\/nav>/, pager(cur));
  s = s.replace(/<footer class="site-foot">[\s\S]*?<\/footer>/, footer(pre));
  fs.writeFileSync(p, s);
  count++;
}
// The theme tester pages carry the same cache-busting tag
for (const f of ['tester.html', 'tester-frame.html']) {
  const p = path.join(ROOT, f); if (!fs.existsSync(p)) continue;
  const t = fs.readFileSync(p, 'utf8'); const u = t.replace(/(tokens|components|site|screens|token-index)\.(css|js)\?v=[0-9a-z]+/g, `$1.$2?v=${ASSET_V}`);
  if (u !== t) fs.writeFileSync(p, u);
}
// Screen templates as a script, so the theme tester works when opened straight from disk (file://).
const screens = {};
for (const f of fs.readdirSync(path.join(ROOT, 'pages')).filter((n) => /^screen-[a-z-]+\.html$/.test(n))) {
  const m = fs.readFileSync(path.join(ROOT, 'pages', f), 'utf8').match(/<template>([\s\S]*?)<\/template>/);
  if (m) screens[f.slice(7, -5)] = m[1];
}
fs.writeFileSync(path.join(ROOT, 'assets/screens.js'), `/* Antz Design System ${VERSION} · screen templates for the theme tester. Generated by tools/docs.mjs from pages/screen-*.html. DO NOT EDIT. */\nwindow.ANTZ_SCREENS = ${JSON.stringify(screens)};\n`);

console.log(`✓ Docs updated: ${count} pages (nav from pages/_nav.json, v${VERSION}).`);
