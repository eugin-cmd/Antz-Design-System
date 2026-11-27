/* Import theme page (pages/import-theme.html). Docs site only, not part of the system.
   The import itself is assets/theme-import.js, the JavaScript twin of tools/import_theme.py. */
import { importTheme, writeToDirectory, ThemeError } from './theme-import.js?v=10';

const root = document.documentElement;
const BASE = (root.dataset.root || '.') + '/';
const LOCAL_KEY = 'antz-ds-local-themes';
const MAX_BYTES = 2 * 1024 * 1024;
const $ = (s, el) => (el || document).querySelector(s);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const site = () => window.ANTZSite || { setBrand() {}, refreshBrands() {}, rebuildToc() {} };

let tokensCss = null, manifestText = null, current = null;   // current: { text, r, from }

/* ── Site files this page needs: tokens.css (the ANTZ baseline) and the site's theme list ── */
async function loadBase() {
  if (tokensCss) return;
  const res = await fetch(BASE + 'tokens.css', { cache: 'no-cache' });
  if (!res.ok) throw new Error('tokens.css could not be loaded (' + res.status + ')');
  tokensCss = await res.text();
  manifestText = await fetch(BASE + 'themes/index.json', { cache: 'no-cache' }).then((x) => (x.ok ? x.text() : null)).catch(() => null);
}
function siteSlugs() {
  try { const m = JSON.parse(manifestText || 'null'); return new Map((m && m.themes || []).map((t) => [t.slug, t])); } catch (e) { return new Map(); }
}

/* ── This browser's themes ── */
function readLocal() {
  let o = null; try { o = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); } catch (e) { o = null; }
  return o && o.themes && typeof o.themes === 'object' ? o : { version: 1, themes: {} };
}
function writeLocal(o) { localStorage.setItem(LOCAL_KEY, JSON.stringify(o)); }

/* ── Messages ── */
function status(msg, kind) {
  const el = $('#ti-status');
  el.className = 'ti-status' + (msg ? ' alert alert--' + (kind || 'success') : '');
  el.innerHTML = msg ? '<svg class="icon"><use href="#i-' + (kind === 'danger' ? 'alert' : kind === 'info' ? 'info' : 'check') + '"/></svg><div>' + msg + '</div>' : '';
}
function showError(title, msg, hint) {
  const box = $('#ti-error');
  $('#ti-error-title').textContent = title;
  $('#ti-error-msg').textContent = msg;
  $('#ti-error-hint').textContent = hint ? ' ' + hint : '';
  box.hidden = false; box.focus();
  for (const id of ['#ti-check', '#ti-use']) $(id).hidden = true;
  current = null; site().rebuildToc();
}
function clearError() { $('#ti-error').hidden = true; }

function explain(e) {
  const m = e.message || String(e);
  if (/^(Expecting|Extra data|Unterminated|Invalid control|Invalid \\escape)/.test(m)) {
    return ['This isn’t valid JSON', 'The text breaks off or has a typo: ' + m + '.', 'Export or copy the theme from the Previewer again and use it unedited.'];
  }
  if (/^not a JSON object|^format must be/.test(m)) return ['This isn’t an ANTZ theme', 'Expected a Previewer export with "format": "antz-theme" (' + m + ').', 'Use Export or Copy in the Previewer, not another JSON file.'];
  if (/^unsupported version/.test(m)) return ['This theme is from a newer Previewer', m + '.', 'Update this site’s importer, or export again from a Previewer that writes version 1.'];
  if (/^slug /.test(m) || /^name is missing/.test(m)) return ['The theme’s name or slug can’t be used', m + '.', 'Rename the theme in the Previewer and export it again.'];
  if (/^colors\./.test(m)) return ['A colour in the theme is not usable', m + '.', 'Every colour must be written as #RRGGBB.'];
  if (/^fonts\./.test(m)) return ['A font in the theme is not usable', m + '.', 'Font families may use letters, digits and spaces; weights are 100 to 900 in steps of 100.'];
  return ['This theme can’t be imported', m + '.', ''];
}

/* ── Reading the input ── */
async function run(text, from) {
  clearError(); status('');
  if (!text.trim()) { showError('Nothing to import', from === 'paste' ? 'The paste box is empty.' : 'The file is empty.', 'Choose the .antz-theme.json file exported from the Previewer.'); return; }
  try { await loadBase(); } catch (e) { showError('This page couldn’t load the site’s tokens', e.message + '.', 'Reload the page; the importer needs tokens.css from this site.'); return; }
  let r;
  try { r = importTheme(text, { tokensCss, manifestText }); } catch (e) {
    if (!(e instanceof ThemeError)) console.warn(e);
    const [t, m, h] = explain(e); showError(t, m, h); return;
  }
  current = { text, r, from };
  render(r);
  $('#ti-check').hidden = false; $('#ti-use').hidden = false; $('#ti-dl').hidden = true;
  site().rebuildToc();
  $('#ti-check-title').focus();
  status('Checked “' + esc(r.name) + '”. Review it below, then apply it or save it.', 'info');
}

function readFile(file) {
  if (!file) return;
  $('#ti-file-name').textContent = file.name;
  if (!/\.json$/i.test(file.name)) { showError('That isn’t a theme file', '“' + file.name + '” is not a .json file.', 'Choose the .antz-theme.json file the Previewer exported.'); return; }
  if (file.size > MAX_BYTES) { showError('That file is too large', '“' + file.name + '” is ' + Math.round(file.size / 1024) + ' KB; a theme is a few dozen KB.', 'Choose the .antz-theme.json file the Previewer exported.'); return; }
  file.text().then((t) => run(t, 'file'), () => showError('The file couldn’t be read', '“' + file.name + '” could not be opened.', 'Try choosing it again.'));
}

/* ── Preview ── */
const KEY_TOKENS = [['--color-bg-app', 'Page (board)'], ['--color-surface', 'Cards'], ['--color-text', 'Text'], ['--color-accent', 'Accent'], ['--color-text-on-accent', 'Text on accent'], ['--color-border', 'Border']];
const THEME_TOKENS = /^--(color|hue|shadow|gradient)-/;
const FONT_TOKENS = ['--font-heading', '--font-body', '--font-family-sans'];

function origin(r, mode, t) {
  const m = r.report.modes[mode].mapped.find((x) => x[0] === t);
  if (m) return 'from ' + m[1].replace(/^(part|role) /, '$1 ');
  if (r.report.modes[mode].derived.indexOf(t) > -1) return 'worked out';
  return 'ANTZ';
}
function chip(ok, label) { return '<span class="' + (ok ? 'pass' : 'fail') + '">' + label + ' ' + (ok ? 'pass' : 'fail') + '</span>'; }
function num(x) { return x == null ? '–' : x.toFixed(2); }

function scopeCss(r) {
  const out = [];
  for (const mode of ['light', 'dark']) {
    const v = r.preview.values[mode], decl = [];
    for (const k of Object.keys(v)) if (THEME_TOKENS.test(k)) decl.push(k + ': ' + v[k] + ';');
    for (const k of FONT_TOKENS) if (r.preview.blocks.light[k]) decl.push(k + ': ' + r.preview.blocks.light[k] + ';');
    out.push('.ti-scope--' + mode + ' { color-scheme: ' + mode + '; ' + decl.join(' ') + ' }');
  }
  return out.join('\n');
}
function loadFonts(url) {
  let l = document.getElementById('ti-fonts-css');
  if (!url) { if (l) l.remove(); return; }
  if (!l) { l = document.createElement('link'); l.id = 'ti-fonts-css'; l.rel = 'stylesheet'; document.head.appendChild(l); }
  if (l.getAttribute('href') !== url) l.href = url;
}

function render(r) {
  const p = r.preview, rep = r.report, onSite = siteSlugs().get(r.slug), local = readLocal().themes[r.slug];
  $('#ti-name').textContent = r.name;
  $('#ti-meta').innerHTML = 'Slug <code>' + esc(r.slug) + '</code> · ' + (current.from === 'paste' ? 'pasted' : 'from a file');
  const ex = [];
  if (onSite) ex.push('The site already has a theme with this slug (“' + esc(onSite.name || r.slug) + '”). Applying it overrides the site’s copy in this browser; saving it replaces the site’s copy.');
  if (local) ex.push('This browser already has a copy of this theme; applying replaces it.');
  $('#ti-existing').innerHTML = ex.join(' '); $('#ti-existing').hidden = !ex.length;
  document.querySelectorAll('.ti-slug').forEach((el) => { el.textContent = r.slug; });
  $('#ti-apply-label').textContent = r.name + ' · this browser' + (onSite ? ' (overrides site)' : '');

  // warnings
  const warn = [];
  if (!p.accentSet) warn.push(['No accent set', 'Buttons, links, the header and the hero stay ANTZ green. Set Primary buttons or Links in the Previewer to give the theme its own accent.']);
  rep.warnings.forEach((w) => warn.push(['Status colours look alike', w.charAt(0).toUpperCase() + w.slice(1)]));
  if (rep.unknownParts.length) warn.push(['Unknown parts ignored', 'This importer doesn’t know: ' + rep.unknownParts.join(', ') + '. Update the part map in both importers to use them.']);
  if (rep.catalogUnknown.length) warn.push(['New parts in the Previewer', 'Its part list has parts this importer doesn’t know: ' + rep.catalogUnknown.join(', ') + '.']);
  if (rep.fails) warn.push(['Some pairs are below target', rep.fails + ' of ' + rep.pairs + ' approved colour pairs miss their contrast target. They are listed under Contrast; the import is not blocked.']);
  $('#ti-warnings').innerHTML = warn.map(([t, m]) => '<div class="alert alert--warning"><svg class="icon"><use href="#i-alert"/></svg><div><b>' + esc(t) + '</b>' + esc(m) + '</div></div>').join('');

  // key colours
  $('#ti-swatches').innerHTML = KEY_TOKENS.map(([t, label]) => '<tr><th scope="row"><code>' + t + '</code><br><span class="t-caption">' + label + '</span></th>' +
    ['light', 'dark'].map((m) => '<td><span class="ti-sw"><span class="sw" style="background:' + esc(p.values[m][t]) + '"></span><span><code>' + esc(p.values[m][t]) + '</code><br><span class="t-caption">' + esc(origin(r, m, t)) + '</span></span></span></td>').join('') + '</tr>').join('');

  // live preview
  let st = document.getElementById('ti-scope-css');
  if (!st) { st = document.createElement('style'); st.id = 'ti-scope-css'; document.head.appendChild(st); }
  st.textContent = scopeCss(r);
  loadFonts(p.fonts.url);
  $('#ti-live').innerHTML = ['light', 'dark'].map((m) => '<figure class="ti-mode"><figcaption>' + (m === 'light' ? 'Light' : 'Dark') + '</figcaption>' +
    '<div class="ti-scope ti-scope--' + m + '" inert aria-hidden="true">' +
    '<div class="ti-mini-top"><span class="tile-icon"><svg class="icon"><use href="#i-grid"/></svg></span><span>Design System <em>Foundation</em></span></div>' +
    '<div class="ti-mini-body"><div class="card"><div class="card__head"><span class="tile-icon"><svg class="icon"><use href="#i-paw"/></svg></span><div><b class="card__title">Morning round</b><span class="card__meta">Enclosure 4 · 08:30</span></div><span class="status status--success card__end">Done</span></div>' +
    '<p class="t-small">12 animals seen, water topped up. <span class="t-secondary">Next check at noon.</span> <a href="#">View notes</a></p>' +
    '<div class="ti-btns"><button class="btn btn--primary btn--sm" type="button">Save</button><button class="btn btn--secondary btn--sm" type="button">Share</button><button class="btn btn--outline btn--sm" type="button">Later</button></div>' +
    '<input class="input" placeholder="Search animals"></div></div></div></figure>').join('');

  // fonts
  const stackOf = (k) => p.blocks.light[k] || 'var(--font-body)';
  const w = (fam) => (p.fonts.weights[fam] || []).join(', ');
  $('#ti-fonts').innerHTML =
    '<div class="card card--flat ti-font"><span class="t-overline">Headings</span><b style="font-family:' + esc(stackOf('--font-heading')) + '">' + esc(p.fonts.heading) + '</b><span class="t-caption t-secondary">' + (w(p.fonts.heading) ? 'Weights ' + esc(w(p.fonts.heading)) : 'ANTZ’s Inter') + '</span></div>' +
    '<div class="card card--flat ti-font"><span class="t-overline">Body</span><b style="font-family:' + esc(stackOf('--font-body')) + '">' + esc(p.fonts.body) + '</b><span class="t-caption t-secondary">' + (w(p.fonts.body) ? 'Weights ' + esc(w(p.fonts.body)) : 'ANTZ’s Inter') + '</span></div>' +
    (p.fonts.unused.length ? '<p class="t-small t-secondary">Not used (the foundation has one heading and one body family): ' + esc(p.fonts.unused.join(', ')) + '</p>' : '');

  // counts
  $('#ti-counts').innerHTML = ['light', 'dark'].map((m) => { const c = p.counts[m];
    return '<tr><th scope="row">' + (m === 'light' ? 'Light' : 'Dark') + '</th><td class="num"><b>' + c.mapped + '</b></td><td class="num"><b>' + c.derived + '</b></td><td class="num"><b>' + c.written + '</b></td><td>Inherits ANTZ</td></tr>'; }).join('');

  // contrast
  $('#ti-contrast').innerHTML = rep.keyPairs.map((x) => '<tr><td><span class="aa-sample" style="background:' + esc(p.values.light[x.bg]) + ';color:' + esc(p.values.light[x.fg]) + '">Aa</span> <code>' + x.fg.slice(8) + '</code> on <code>' + x.bg.slice(8) + '</code></td>' +
    '<td class="num"><b>' + num(x.light) + '</b></td><td>' + chip(x.light >= 4.5, 'AA') + '</td><td class="num"><b>' + num(x.dark) + '</b></td><td>' + chip(x.dark >= 4.5, 'AA') + '</td></tr>').join('');
  $('#ti-contrast-sum').textContent = 'All ' + rep.pairs + ' approved pairs checked: ' + (rep.fails ? rep.fails + ' below target.' : 'every one meets its target.');
  $('#ti-below').innerHTML = rep.belowTarget.map((b) => '<li><code>' + b.fg + '</code> on <code>' + b.bg + '</code>: ' + b.bad.map((x) => x[0] + ' ' + num(x[1])).join(', ') + ' (needs ' + b.need.toFixed(1) + ')' + (b.antzToo ? ', ANTZ misses this too' : '') + '</li>').join('');

  // not used
  const unused = rep.unusedParts;
  $('#ti-unused').innerHTML = unused.length ? '<p class="t-small t-secondary">Parts with no equivalent in the foundation, so they were skipped:</p><div class="ti-chips">' + unused.map((u) => '<code>' + esc(u) + '</code>').join('') + '</div>'
    : '<p class="t-small t-secondary">Every part the theme sets is used.</p>';

  $('#ti-report').textContent = rep.lines.join('\n');
}

/* ── Apply in this browser ── */
function apply() {
  if (!current) return;
  const r = current.r, store = readLocal();
  store.themes[r.slug] = { slug: r.slug, name: r.name, css: r.css, entry: r.entryPlain, source: r.sourceText, importedAt: r.entryPlain.importedAt, appliedAt: new Date().toISOString() };
  try { writeLocal(store); } catch (e) { status('This browser wouldn’t store the theme (its storage is full or blocked). Save it into the site files instead.', 'danger'); return; }
  site().refreshBrands(); site().setBrand(r.slug, true);
  renderLocal();
  status('“' + esc(r.name) + '” is applied in this browser. Every page here now uses it; nobody else sees it until it is saved into the site files and the site is redeployed.');
}

/* ── Save into the site folder ── */
async function save() {
  if (!current) return;
  let dir;
  try { dir = await window.showDirectoryPicker({ id: 'antz-foundation', mode: 'readwrite' }); }
  catch (e) { if (e && e.name === 'AbortError') { status('Saving cancelled. Nothing was written.', 'info'); return; } status('The folder couldn’t be opened: ' + esc(e.message || e) + '.', 'danger'); return; }
  let r;
  try { r = await writeToDirectory(dir, current.text); }
  catch (e) {
    if (e instanceof ThemeError) status(esc(e.message) + ' Nothing was written.', 'danger');
    else if (e && e.name === 'NotAllowedError') status('Permission to write into “' + esc(dir.name) + '” was refused. Nothing was written.', 'danger');
    else status('Saving failed: ' + esc(e.message || e) + '.', 'danger');
    return;
  }
  // The browser copy steps aside once the site serves the saved files (now, if this page is served from that
  // folder; otherwise after the redeploy).
  const store = readLocal(), had = store.themes[r.slug];
  let served = false;
  try { const m = await fetch(BASE + 'themes/index.json', { cache: 'no-cache' }).then((x) => x.json()); served = (m.themes || []).some((t) => t.slug === r.slug && t.importedAt === r.entryPlain.importedAt); } catch (e) {}
  if (had) {
    if (served) delete store.themes[r.slug]; else had.savedImportedAt = r.entryPlain.importedAt;
    try { writeLocal(store); } catch (e) {}
  }
  if (served) { manifestText = null; tokensCss = null; }
  site().refreshBrands(); renderLocal();
  const files = '<code>themes/' + esc(r.slug) + '.css</code>, <code>themes/' + esc(r.slug) + '.antz-theme.json</code> and <code>themes/index.json</code>';
  status('Saved. ' + (r.existing ? 'Updated ' : 'Wrote ') + files + ' in “' + esc(dir.name) + '”. Redeploy with <code>vercel --prod</code> from this folder to publish.' +
    (had ? (served ? ' This browser’s copy was removed; the site now serves the saved files.' : ' This browser keeps its copy until the site serves the saved files, then drops it.') : ''));
}

/* ── Download fallback ── */
function download() {
  if (!current) return;
  const r = current.r;
  const files = [[r.slug + '.css', r.css, 'text/css'], [r.slug + '.antz-theme.json', r.sourceText, 'application/json'], ['index.json', r.manifestText, 'application/json']];
  const links = files.map(([name, text, type]) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' })); a.download = name; a.textContent = name; return a; });
  links.forEach((a, k) => setTimeout(() => a.click(), k * 250));
  $('#ti-cmd').textContent = 'python3 tools/import_theme.py ~/Downloads/' + r.slug + '.antz-theme.json';
  const box = $('#ti-dl-links'); box.innerHTML = 'If a file didn’t download: ';
  links.forEach((a, k) => { const c = a.cloneNode(true); c.className = 'btn btn--link'; box.appendChild(c); if (k < links.length - 1) box.appendChild(document.createTextNode(' · ')); });
  $('#ti-dl').hidden = false;
  $('#ti-dl-title').focus();
  status('Downloading ' + files.map((f) => '<code>' + esc(f[0]) + '</code>').join(', ') + '. Then follow the steps below.', 'info');
}

/* ── Themes in this browser ── */
function renderLocal() {
  const store = readLocal(), list = Object.values(store.themes).filter((t) => t && t.slug && typeof t.css === 'string');
  const onSite = siteSlugs(), active = root.dataset.brand;
  const box = $('#ti-local-list');
  if (!list.length) { box.innerHTML = '<div class="empty"><span class="tile-icon"><svg class="icon"><use href="#i-sliders"/></svg></span><b>No themes in this browser</b>Themes you apply here are listed until they are part of the site files.</div>'; return; }
  box.innerHTML = list.map((t) => {
    const when = t.appliedAt ? new Date(t.appliedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    const meta = ['<code>' + esc(t.slug) + '</code>', when && 'applied ' + esc(when), onSite.has(t.slug) && 'overrides the site’s copy', t.savedImportedAt && 'saved to files, waiting for the redeploy'].filter(Boolean).join(' · ');
    return '<div class="row"><div class="row__body"><span class="row__title">' + esc(t.name || t.slug) + (active === t.slug ? ' <span class="status status--success">In use</span>' : '') + '</span><span class="row__meta">' + meta + '</span></div>' +
      '<div class="ti-btns"><button class="btn btn--secondary btn--sm" type="button" data-use="' + esc(t.slug) + '"' + (active === t.slug ? ' disabled' : '') + '>Use</button>' +
      '<button class="btn btn--ghost btn--sm" type="button" data-remove-local="' + esc(t.slug) + '" aria-label="Remove ' + esc(t.name || t.slug) + ' from this browser">Remove</button></div></div>';
  }).join('');
}
function removeLocal(slug) {
  const store = readLocal(), t = store.themes[slug]; if (!t) return;
  delete store.themes[slug];
  try { writeLocal(store); } catch (e) {}
  site().refreshBrands(); renderLocal();
  const onSite = siteSlugs().has(slug);
  status('Removed “' + esc(t.name || slug) + '” from this browser.' + (onSite ? ' The site’s own copy of this theme is used again.' : root.dataset.brand ? '' : ' The site is back to ANTZ.'));
  $('#ti-local-title').focus();
}

/* ── Wiring ── */
const drop = $('#ti-drop'), fileIn = $('#ti-file');
$('#ti-pick').addEventListener('click', () => fileIn.click());
fileIn.addEventListener('change', () => { readFile(fileIn.files[0]); fileIn.value = ''; });
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; drop.classList.add('is-over'); }));
['dragleave', 'dragend'].forEach((ev) => drop.addEventListener(ev, (e) => { if (!drop.contains(e.relatedTarget)) drop.classList.remove('is-over'); }));
drop.addEventListener('drop', (e) => {
  e.preventDefault(); drop.classList.remove('is-over');
  const files = e.dataTransfer.files;
  if (!files || !files.length) { showError('Nothing to import', 'What was dropped isn’t a file.', 'Drop the .antz-theme.json file, or paste its text below.'); return; }
  if (files.length > 1) { showError('One theme at a time', files.length + ' files were dropped.', 'Drop a single .antz-theme.json file.'); return; }
  readFile(files[0]);
});
// a file dropped next to the zone shouldn't open in the tab
window.addEventListener('dragover', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
window.addEventListener('drop', (e) => { if (!drop.contains(e.target)) e.preventDefault(); });
$('#ti-paste-go').addEventListener('click', () => { const t = $('#ti-paste'); t.removeAttribute('aria-invalid'); run(t.value, 'paste'); });
$('#ti-apply').addEventListener('click', apply);
$('#ti-download').addEventListener('click', download);
$('#ti-copy').addEventListener('click', async () => {
  const text = $('#ti-cmd').textContent;
  try { await navigator.clipboard.writeText(text); status('Copied the command.', 'info'); }
  catch (e) { const sel = getSelection(), rg = document.createRange(); rg.selectNodeContents($('#ti-cmd')); sel.removeAllRanges(); sel.addRange(rg); status('Copying was blocked; the command is selected, press Ctrl+C or Cmd+C.', 'info'); }
});
$('#ti-local-list').addEventListener('click', (e) => {
  const u = e.target.closest('[data-use]'), rm = e.target.closest('[data-remove-local]');
  if (u) { site().setBrand(u.dataset.use, true); renderLocal(); status('Using “' + esc(u.dataset.use) + '” in this browser.'); const b = document.querySelector('[data-remove-local="' + u.dataset.use + '"]'); if (b) b.focus(); }
  if (rm) removeLocal(rm.dataset.removeLocal);
});
if (typeof window.showDirectoryPicker === 'function') $('#ti-save').addEventListener('click', save);
else { $('#ti-save').hidden = true; $('#ti-save-text').hidden = true; $('#ti-dl-text').hidden = false; $('#ti-download').className = 'btn btn--outline'; }
window.addEventListener('storage', (e) => { if (e.key === LOCAL_KEY) renderLocal(); });
new MutationObserver(renderLocal).observe(root, { attributes: true, attributeFilter: ['data-brand'] });
loadBase().catch(() => {}).then(renderLocal);
