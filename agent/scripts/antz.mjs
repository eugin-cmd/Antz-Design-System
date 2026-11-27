#!/usr/bin/env node
/* Antz Design System · agent helper (Node 18+, no dependencies), shared by the plugin's skills

   Talks to a pinned release of the Antz Design System, either a local clone or the team site,
   so any project can look things up and run the guardrail check without copying the system.

     node antz.mjs info                       which source and version are in use
     node antz.mjs starter                    the <head> links for a prototype (pinned release)
     node antz.mjs tokens <words…> [--type color|dimension|…] [--primitive]
                                              search approved tokens (semantic only unless --primitive)
     node antz.mjs components                 list every documented component, pattern and screen
     node antz.mjs component <name>           classes, usage notes and copyable markup for one page
     node antz.mjs rules                      the governance rules every UI must follow
     node antz.mjs check <paths…> [--report] [--json]
                                              run the release's guardrail check on your files
                                              (CSS, HTML, MUI sx/style, React Native StyleSheet)
     node antz.mjs deprecated                 names that still work but must not be used in new work
     node antz.mjs audit <paths…> [--url <url>]… [--out report.md] [--json]
                                              /systemauditor: read-only compliance audit of a product.
                                              Code checks on the paths; rendered checks (contrast in four
                                              modes, tap targets, focus, labels) on each --url and HTML file
     node antz.mjs guide [--print]            /openvisualguide: open the official visual guide in Chrome

   Source (first match wins):
     --source <path|url> or ANTZ_DS_SOURCE    a clone of the repository, or the site URL
     an "antz-design-system" folder in this directory or any parent
     https://antz-design-system.eugin-736.workers.dev   (the team site)
   Version: --version <x.y.z> or ANTZ_DS_VERSION, else this plugin's own version (the release tag the team
   installed), else the latest published release. Maintainers testing unreleased work in a clone: --version working. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const DEFAULT_SITE = 'https://antz-design-system.eugin-736.workers.dev';
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };

const sourceArg = opt('--source') || process.env.ANTZ_DS_SOURCE;
const versionArg = opt('--version') || process.env.ANTZ_DS_VERSION;
const [cmd = 'help', ...rest] = argv;

function findLocalRepo(start) {
  const isRepo = (d) => fs.existsSync(path.join(d, 'releases', 'index.json')) && fs.existsSync(path.join(d, 'VERSION'));
  let dir = path.resolve(start);
  while (true) {
    if (isRepo(dir)) return dir;
    const child = path.join(dir, 'antz-design-system');
    if (isRepo(child)) return child;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const source = (() => {
  if (sourceArg) return /^https?:\/\//.test(sourceArg) ? { kind: 'url', base: sourceArg.replace(/\/$/, '') } : { kind: 'dir', base: path.resolve(sourceArg) };
  const local = findLocalRepo(process.cwd());
  return local ? { kind: 'dir', base: local } : { kind: 'url', base: DEFAULT_SITE };
})();

async function readRaw(rel) {
  if (source.kind === 'dir') return fs.readFileSync(path.join(source.base, rel), 'utf8');
  const res = await fetch(`${source.base}/${rel}`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} fetching ${source.base}/${rel}`);
  return res.text();
}
const readJson = async (rel) => JSON.parse(await readRaw(rel));

// The plugin's own version: installing the plugin from a release tag pins the design system to that release.
const PLUGIN_VERSION = (() => { try { return JSON.parse(fs.readFileSync(new URL('../.claude-plugin/plugin.json', import.meta.url), 'utf8')).version; } catch { return null; } })();
let _version, _why;
async function version() {
  if (_version) return _version;
  if (versionArg === 'working') { if (source.kind !== 'dir') throw new Error('--version working needs a local clone.'); _why = 'the clone\'s unreleased working copy: maintainers only, never for product work'; return (_version = 'working'); }
  const idx = await readJson('releases/index.json');
  const pluginOk = PLUGIN_VERSION && idx.versions.some((x) => x.version === PLUGIN_VERSION);
  const v = versionArg || (pluginOk ? PLUGIN_VERSION : idx.latest);
  _why = versionArg ? (process.env.ANTZ_DS_VERSION === versionArg ? 'pinned by ANTZ_DS_VERSION' : 'pinned by --version') : pluginOk ? 'the plugin\'s release' : 'latest published';
  if (!idx.versions.some((x) => x.version === v)) throw new Error(`Version ${v} is not published. Published: ${idx.versions.map((x) => x.version).join(', ')}`);
  return (_version = v);
}
const rel = async (p) => ((await version()) === 'working' ? p : `releases/v${await version()}/${p}`);
const release = async (p) => readRaw(await rel(p));

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const text = (html) => decode(html.replace(/<(script|style|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<\/(p|li|h[1-6]|tr|div|dd|dt)>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

const commands = {
  async help() { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0].replace('/*', '').trim()); },

  async info() {
    const idx = await readJson('releases/index.json');
    const v = await version();
    console.log(`Antz Design System ${v} (${_why})`);
    console.log(`Source:    ${source.kind === 'dir' ? 'local clone ' : 'site '}${source.base}`);
    console.log(`Agent:     plugin ${PLUGIN_VERSION || 'not installed as a plugin'}`);
    console.log(`Latest:    ${idx.latest}${idx.latest !== v ? `  (newer than the version in use: upgrade by installing the plugin from tag v${idx.latest})` : ''}`);
    console.log(`Published: ${idx.versions.map((x) => x.version).join(', ')}`);
    if (source.kind === 'dir') {
      // A clone can hold unreleased work: say so, and keep building from the release.
      const work = (f) => { try { return fs.readFileSync(path.join(source.base, f), 'utf8'); } catch { return null; } };
      const changed = ['tokens.css', 'components.css', 'components.js'].filter((f) => work(f) !== work(`releases/v${v}/${f}`));
      const wv = (work('VERSION') || '').trim();
      if (changed.length || wv !== v) console.log(`Drift:     the clone's working copy differs from release ${v} (${[wv !== v ? `VERSION ${wv}` : '', ...changed].filter(Boolean).join(', ')}). Build from the release, never from unreleased work.`);
      else console.log(`Drift:     none; the working copy matches release ${v}.`);
    }
  },

  async deprecated() {
    let list = [];
    try { list = JSON.parse(await release('governance/deprecations.json')).deprecated; } catch { /* older releases have no list */ }
    if (!list.length) { console.log(`No deprecated names in ${await version()}.`); return; }
    console.log(`Deprecated in Antz ${await version()} (they still work; don't use them in new work):`);
    for (const d of list) console.log(`  ${d.type.padEnd(6)} ${d.name.padEnd(28)} → ${d.replacement}   since ${d.since}${d.note ? `. ${d.note}` : ''}`);
  },

  async starter() {
    const v = await version();
    const base = source.kind === 'dir' ? `${path.relative(process.cwd(), source.base) || '.'}/releases/v${v}` : `${source.base}/releases/v${v}`;
    console.log(`<!-- Antz Design System ${v}: pinned release. Upgrade by changing the version; roll back by changing it back. -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}/tokens.css">
<link rel="stylesheet" href="${base}/components.css">
<script src="${base}/components.js" defer></script>  <!-- optional: tab and animal card motion -->
<!-- Light/dark follow the OS. Force one with <html data-theme="light|dark">. -->`);
    if (source.kind === 'url') console.log('\nNote: linking the team site works for quick prototypes. For anything shared or long-lived, clone the repository and link the local releases/ folder.');
  },

  async tokens() {
    const type = opt('--type'); const prim = flag('--primitive');
    const words = rest.filter((w) => !w.startsWith('--')).map((w) => w.toLowerCase());
    const all = (await readJson(await rel('dist/tokens/token-index.json'))).tokens;
    const hits = all.filter((t) => (prim || t.tier !== 'primitive') && (!type || t.type === type)
      && words.every((w) => `${t.css} ${t.name} ${t.description} ${t.light} ${t.type}`.toLowerCase().includes(w)));
    if (!hits.length) { console.log(`No approved token matches "${words.join(' ')}". If the need is real, it is a proposal, not a local value (node antz.mjs rules).`); return; }
    for (const t of hits.slice(0, 60)) {
      const vals = t.light === t.dark ? `${t.light}` : `light ${t.light} · dark ${t.dark}`;
      console.log(`var(${t.css})  [${t.type}]  ${vals}${t.description ? `  — ${t.description}` : ''}`);
    }
    if (hits.length > 60) console.log(`… ${hits.length - 60} more; add words to narrow.`);
  },

  async components() {
    const nav = await readJson(await rel('pages/_nav.json'));
    for (const g of nav.groups) {
      if (!/component|pattern|stat|screen/i.test(g.title)) continue;
      console.log(`\n${g.title}`);
      for (const l of g.links) console.log(`  ${l.href.replace(/\.html$/, '').padEnd(22)} ${l.title}`);
    }
    console.log('\nNext: node antz.mjs component <name>');
  },

  async component() {
    const q = rest.join(' ').toLowerCase().replace(/\.html$/, '');
    if (!q) throw new Error('Name a component, e.g. node antz.mjs component buttons');
    const nav = await readJson(await rel('pages/_nav.json'));
    const links = nav.groups.flatMap((g) => g.links);
    const link = links.find((l) => l.href.replace(/\.html$/, '') === q) || links.find((l) => `${l.href} ${l.title}`.toLowerCase().includes(q));
    if (!link) { console.log(`No page matches "${q}". Run: node antz.mjs components`); return; }
    const html = await release(`pages/${link.href}`);
    console.log(`# ${link.title}  (pages/${link.href}, Antz ${await version()})`);
    const lead = html.match(/<p class="lead"[^>]*>([\s\S]*?)<\/p>/);
    if (lead) console.log(`\n${text(lead[1])}`);
    const usage = html.match(/id="panel-usage"[\s\S]*?(?=<section class="tab-panel"|<\/main>)/);
    if (usage) { const u = text(usage[0].replace(/^id="panel-usage"[^>]*>/, '')); console.log(`\n## Usage\n${u.length > 2500 ? u.slice(0, 2500) + ' …' : u}`); }
    const code = html.match(/id="panel-code"[\s\S]*?(?=<section class="tab-panel"|<\/main>)/);
    if (!code) { console.log('\n(No code examples on this page. Build it from the components it lists, and check with node antz.mjs check.)'); return; }
    for (const block of code[0].split(/<div class="doc" id="/).slice(1)) {
      const title = block.match(/<h3>([\s\S]*?)<\/h3>/);
      const classes = [...(block.match(/<h4>Classes<\/h4><div class="chips">([\s\S]*?)<\/div>/)?.[1] || '').matchAll(/<code>([^<]+)<\/code>/g)].map((m) => m[1]);
      console.log(`\n## ${title ? text(title[1]) : 'Example'}`);
      if (classes.length) console.log(`Classes: ${classes.join(' ')}`);
      for (const ex of block.matchAll(/<summary>([^<]*)<\/summary>\s*<pre><code>([\s\S]*?)<\/code><\/pre>/g)) {
        const lines = decode(ex[2]).split('\n');
        console.log(`\n### ${ex[1]}\n\`\`\`html\n${lines.slice(0, 160).join('\n')}${lines.length > 160 ? `\n<!-- … ${lines.length - 160} more lines: see pages/${link.href} -->` : ''}\n\`\`\``);
      }
    }
  },

  async classes() {
    // Every component class lives in components.css; this finds ones a docs page doesn't show (e.g. the work drawer).
    const q = rest.join(' ').toLowerCase().replace(/^\./, '');
    if (!q) throw new Error('Name a class or word, e.g. node antz.mjs classes drawer');
    const css = await release('components.css');
    let section = '';
    const hits = [];
    for (const line of css.split('\n')) {
      const head = line.match(/^\/\*\s*[─-]*\s*(.+?)\s*[─-]*\s*\*\/?\s*$/);
      if (head && /──/.test(line)) section = head[1];
      const sel = line.match(/^([^{}/]+)\{/);
      if (sel && sel[1].toLowerCase().includes(q)) hits.push({ section, sel: sel[1].trim(), rule: line.trim() });
    }
    if (!hits.length) { console.log(`No class matches "${q}" in components.css ${await version()}. If the component is missing, that is a proposal.`); return; }
    let last;
    for (const h of hits.slice(0, 50)) {
      if (h.section !== last) { console.log(`\n## ${h.section || 'components.css'}`); last = h.section; }
      console.log(h.rule.length > 220 ? h.rule.slice(0, 220) + ' …' : h.rule);
    }
    console.log('\nThese are the styles, not usage docs: build the markup from the class names, keep the documented behaviour (e.g. one drawer, 562px, add/edit only), and run check.');
  },

  async icons() {
    const js = await release('assets/site.js');
    const m = js.match(/insertAdjacentHTML\('afterbegin', ("<svg[\s\S]*?<\/svg>")\)/);
    if (!m) throw new Error('Icon sprite not found in this release');
    const sprite = JSON.parse(m[1]);
    if (flag('--sprite')) { console.log(sprite); return; }
    const ids = [...sprite.matchAll(/<symbol id="i-([^"]+)"/g)].map((x) => x[1]);
    console.log(`${ids.length} icons (24px outline, stroke follows currentColor):\n${ids.join(', ')}`);
    console.log('\nUse: <svg class="icon" aria-hidden="true"><use href="#i-NAME"/></svg>. Paste the sprite once per page (node antz.mjs icons --sprite), before the first icon. More icons: the ANTZ Rounded set (207, line and filled, drafts) is icons/antz-rounded/sprite.svg, used as #antz-NAME and #antz-NAME-filled; see pages/icon-library.html. Need an icon that is not here? That is a proposal.');
  },

  async rules() {
    const r = await readJson(await rel('governance/rules.json'));
    for (const x of r.rules) console.log(`${x.id}  ${x.statement}${x.enforcedBy === 'check' ? '  [checked automatically]' : ''}`);
  },

  async check() {
    const report = flag('--report'); const json = flag('--json');
    const paths = rest.filter((p) => !p.startsWith('--'));
    if (!paths.length) throw new Error('Name the files or folders to check, e.g. node antz.mjs check src/');
    const script = await checkerScript();
    const res = spawnSync(process.execPath, [script, ...(report ? ['--report'] : []), ...(json ? ['--json'] : []), ...paths], { stdio: 'inherit' });
    process.exit(res.status ?? 1);
  },

  async audit() { await audit(); },
  async guide() { openGuide(); },
};

async function checkerScript() {
    let script;
    if (source.kind === 'dir') script = path.join(source.base, await rel('tools/check.mjs'));
    else {
      // Mirror the four files the checker needs into a per-version cache, in the layout it expects.
      const dir = path.join(os.homedir(), '.cache', 'antz-design-system', `v${await version()}`);
      for (const f of ['tools/check.mjs', 'governance/rules.json', 'governance/exceptions.json', 'dist/tokens/token-index.json', 'governance/deprecations.json']) {
        const out = path.join(dir, f);
        if (!fs.existsSync(out)) { try { const body = await release(f); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, body); } catch (e) { if (!f.endsWith('deprecations.json')) throw e; } }
      }
      script = path.join(dir, 'tools/check.mjs');
    }
    return script;
}

// ── /openvisualguide ────────────────────────────────────────────────────
const GUIDE_URL = DEFAULT_SITE + '/';
function openGuide() {
  if (argv.includes('--print')) { console.log(GUIDE_URL); return; }
  const tries = process.platform === 'darwin' ? [['open', ['-a', 'Google Chrome', GUIDE_URL]]]
    : process.platform === 'win32' ? [['cmd', ['/c', 'start', '', 'chrome', GUIDE_URL]]]
    : [['google-chrome', [GUIDE_URL]], ['google-chrome-stable', [GUIDE_URL]], ['chromium', [GUIDE_URL]], ['chromium-browser', [GUIDE_URL]]];
  for (const [cmdName, cmdArgs] of tries) {
    const r = spawnSync(cmdName, cmdArgs, { stdio: 'ignore', detached: process.platform !== 'win32' });
    if (r.status === 0) { console.log(`Opened the official Antz visual guide in Chrome: ${GUIDE_URL}`); return; }
  }
  console.log(`Chrome could not be opened here. The official Antz visual guide: ${GUIDE_URL}`);
}

// ── /systemauditor ──────────────────────────────────────────────────────
// Read-only. Code checks come from the release's own checker; rendered checks use the shared browser engine.
const CATEGORY = (rule) => /^ANTZ-(COL|TOK|GRD-01)|^ANTZ-TYP-02/.test(rule) ? 'B' : /^ANTZ-DEP/.test(rule) ? 'D' : /^ANTZ-A11Y|^RENDER-/.test(rule) ? 'E' : 'C';
const CAT_TITLE = { B: 'Critical: brand colours, unapproved tokens, fonts or gradients', C: 'Major: spacing, type scale, radii, shadows, motion', D: 'Minor: deprecated names', E: 'Accessibility: contrast, labels, focus, tap targets' };
const FIX = { 'ANTZ-A11Y-01': 'keep the focus outline, or replace it in the same rule with the system ring: outline: var(--focus-ring-width) solid var(--color-focus)',
  'ANTZ-A11Y-02': 'add an aria-label that names the action, e.g. aria-label="Close"', 'ANTZ-A11Y-03': 'add alt text that says what the image shows (alt="" if it is decoration)',
  'RENDER-CONTRAST': 'use the text and surface tokens meant for that surface (run antz.mjs tokens text)', 'RENDER-TAP': 'make it at least 24 × 24 px (--size-control-sm or larger; 44 px on touch screens)',
  'RENDER-NAME': 'give it visible text or an aria-label', 'RENDER-ALT': 'add alt text (alt="" if it is decoration)', 'RENDER-FOCUS': 'show the system focus ring: outline: var(--focus-ring-width) solid var(--color-focus)',
  'RENDER-JS': 'fix the error so the screen runs cleanly' };
const RENDER_RULE = { 'RENDER-CONTRAST': 'Text meets WCAG 2.2 AA contrast: 4.5:1, or 3:1 for large text (ANTZ-A11Y-04).', 'RENDER-TAP': 'Tap targets are at least 24 × 24 px (WCAG 2.5.8); 44 px on touch screens.', 'RENDER-FOCUS': 'Every focusable control shows a visible focus indicator (ANTZ-A11Y-01).', 'RENDER-NAME': 'Every button and link has an accessible name (ANTZ-A11Y-02).', 'RENDER-ALT': 'Every image has alt text (ANTZ-A11Y-03).', 'RENDER-JS': 'The screen runs without JavaScript errors.' };

async function audit() {
  const outFile = opt('--out'); const asJson = flag('--json');
  const urls = []; for (let u; (u = opt('--url')); ) urls.push(u);
  const paths = argv.slice(1).filter((p) => !p.startsWith('--'));
  if (!paths.length && !urls.length) throw new Error('Name files or folders to audit, and/or --url <address of the running screen>.');
  const v = await version();
  const ran = [], notRan = [], findings = []; let partial = false;
  const rulesById = {};
  try { for (const r of JSON.parse(await release('governance/rules.json')).rules) rulesById[r.id] = r.statement; } catch {}

  // 1. Code checks
  if (paths.length) {
    const checker = await checkerScript();
    const readsObjects = /jsObjectChunks/.test(fs.readFileSync(checker, 'utf8'));   // checkers before 1.2.0-beta.8 don't read JS style objects
    const r = spawnSync(process.execPath, [checker, '--json', ...paths], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    let data; try { data = JSON.parse(r.stdout); } catch { throw new Error('The checker did not return a result: ' + (r.stderr || r.stdout).slice(0, 300)); }
    ran.push(`Code checks on ${data.files} file(s) with the release ${v} checker: CSS, HTML${readsObjects ? ', MUI sx/style objects, React Native StyleSheet and deprecated names' : ' and CSS-in-JS strings'}`);
    const hasJs = paths.some((p) => /\.(jsx?|tsx?)$/.test(p) || (fs.existsSync(p) && fs.statSync(p).isDirectory()));
    if (!readsObjects && hasJs) { notRan.push(`MUI sx/style objects and React Native StyleSheet values: the ${v} checker can't read them (from 1.2.0-beta.8 it can). Audit with a newer --version, or review those styles by hand.`); partial = true; }
    for (const x of data.findings) findings.push({ cat: CATEGORY(x.rule), where: `${x.file}:${x.line}`, rule: x.rule, issue: x.msg, expected: rulesById[x.rule] || '', snippet: x.snippet });
    const files = paths.flatMap((p) => { try { return fs.statSync(p).isDirectory() ? [] : [p]; } catch { return []; } });
    if (paths.some((p) => /\.(jsx?|tsx?)$/.test(p) || fs.existsSync(p) && fs.statSync(p).isDirectory())) notRan.push('Values computed at run time (variables, functions, theme overrides) are not read from code; check those screens rendered, or by review.');
  }
  // 2. Rendered checks
  const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'releases']);
  const htmlIn = (p) => { try { const st = fs.statSync(p); if (st.isFile()) return /\.html?$/i.test(p) ? [p] : []; return fs.readdirSync(p).filter((n) => !SKIP.has(n) && !n.startsWith('.')).flatMap((n) => htmlIn(path.join(p, n))); } catch { return []; } };
  const htmlFiles = paths.flatMap(htmlIn);
  if (htmlFiles.length > 20) notRan.push(`Rendered checks covered the first 20 of ${htmlFiles.length} HTML files; pass the ones that matter, or --url.`);
  const htmlTargets = htmlFiles.slice(0, 20).map((p) => 'file://' + path.resolve(p));
  const targets = [...urls, ...htmlTargets];
  if (targets.length) {
    let engine;
    try { engine = await import(new URL('./browser.mjs', import.meta.url)); if (typeof WebSocket === 'undefined') throw new Error('Node 22 or later is needed for rendered checks.'); }
    catch (e) { notRan.push(`Rendered checks: not run (${e.message}).`); engine = null; }
    if (engine) {
      let b;
      try { b = await engine.browser(); } catch (e) { notRan.push(`Rendered checks: not run (${e.message}).`); }
      if (b) try {
        const SCAN = engine.makeScan('[data-audit-ignore]');
        const MODES = [['light', 'no-preference'], ['dark', 'no-preference'], ['light', 'more'], ['dark', 'more']];
        for (const t of targets) {
          const tn = t.startsWith('file://') ? path.relative(process.cwd(), t.slice(7)) : t;
          for (const [scheme, contrast] of MODES) {
            const mode = scheme + (contrast === 'more' ? ', high contrast' : '');
            await b.media([{ name: 'prefers-color-scheme', value: scheme }, { name: 'prefers-contrast', value: contrast }]);
            await b.goto(t, 1800);
            await b.eval(`(()=>{const h=document.documentElement;h.dataset.theme='${scheme}';${contrast === 'more' ? "h.dataset.contrast='high'" : 'delete h.dataset.contrast'};document.getAnimations().forEach(a=>a.finish());return 1})()`).catch(() => null);
            const scan = await b.eval(SCAN).catch(() => ({ fails: [] }));
            for (const f of scan.fails) {
              let real = await engine.pixelRatio(b, f).catch(() => null);
              if (real !== null && real >= f.need - 0.01) continue;
              findings.push({ cat: 'E', where: `${tn} (${mode}, rendered)`, rule: 'RENDER-CONTRAST', issue: `"${f.text}" (${f.path}) is ${Math.round((real ?? f.estimate) * 100) / 100}:1, needs ${f.need}:1`, expected: RENDER_RULE['RENDER-CONTRAST'], snippet: f.path });
            }
            if (scheme === 'light' && contrast === 'no-preference') {
              const r = await b.eval(String.raw`(()=>{const small=[],noname=[],noalt=[];for(const el of document.querySelectorAll('a[href],button,input,select,textarea,[role=button],[role=tab],summary')){const q=el.getBoundingClientRect();if(q.width<1||q.height<1||getComputedStyle(el).visibility==='hidden')continue;if(el.tagName==='A'&&el.closest('p,li,td,dd'))continue;if(el.type==='checkbox'||el.type==='radio')continue;if(q.width<23.5||q.height<23.5)small.push((el.textContent||el.getAttribute('aria-label')||el.tagName).trim().slice(0,30)+' '+Math.round(q.width)+'×'+Math.round(q.height));if((el.tagName==='BUTTON'||el.tagName==='A')&&!(el.textContent||'').trim()&&!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')&&!el.getAttribute('title'))noname.push(el.outerHTML.slice(0,80))}for(const i of document.querySelectorAll('img:not([alt])'))noalt.push(i.getAttribute('src')||'img');return {small:[...new Set(small)],noname,noalt}})()`).catch(() => ({ small: [], noname: [], noalt: [] }));
              for (const x of r.small) findings.push({ cat: 'E', where: `${tn} (rendered)`, rule: 'RENDER-TAP', issue: `Tap target too small: ${x}`, expected: RENDER_RULE['RENDER-TAP'], snippet: x });
              for (const x of r.noname) findings.push({ cat: 'E', where: `${tn} (rendered)`, rule: 'RENDER-NAME', issue: 'Button or link without an accessible name', expected: RENDER_RULE['RENDER-NAME'], snippet: x });
              for (const x of r.noalt) findings.push({ cat: 'E', where: `${tn} (rendered)`, rule: 'RENDER-ALT', issue: `Image without alt text: ${x}`, expected: RENDER_RULE['RENDER-ALT'], snippet: x });
              // Focus: tab through the first controls and see whether anything visible changes.
              const nofocus = [];
              for (let i = 0; i < 12; i++) {
                await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
                const f = await b.eval(`(()=>{const e=document.activeElement;if(!e||e===document.body)return null;const c=getComputedStyle(e);const on=(c.outlineStyle!=='none'&&parseFloat(c.outlineWidth)>0)||c.boxShadow!=='none';return on?'':(e.textContent||e.getAttribute('aria-label')||e.tagName).trim().slice(0,30)})()`).catch(() => null);
                if (f) nofocus.push(f);
              }
              for (const x of [...new Set(nofocus)]) findings.push({ cat: 'E', where: `${tn} (rendered)`, rule: 'RENDER-FOCUS', issue: `No visible focus on "${x}"`, expected: RENDER_RULE['RENDER-FOCUS'], snippet: x });
              for (const e of b.events.filter((x) => x.method === 'Runtime.exceptionThrown')) findings.push({ cat: 'C', where: `${tn} (rendered)`, rule: 'RENDER-JS', issue: `JavaScript error: ${(e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text || '').split('\n')[0]}`, expected: RENDER_RULE['RENDER-JS'], snippet: '' });
            }
          }
        }
        ran.push(`Rendered checks on ${targets.length} screen(s) in Chrome: text contrast in light, dark and both high contrasts (suspects re-measured on real pixels), tap targets, accessible names, alt text, keyboard focus, JavaScript errors`);
      } finally { b.close(); }
    }
  } else notRan.push('Rendered checks: not run. Give --url with the running screen (for React Native, the Expo web build) or an HTML file to check what users actually see.');

  // 3. Report
  const n = (c) => findings.filter((f) => f.cat === c).length;
  const verdict = n('B') || n('E') ? 'Not compliant' : n('C') ? 'Partly compliant' : partial ? 'Not fully checked: no findings in what could be checked' : n('D') ? 'Compliant, with deprecated names to replace' : 'Compliant';
  if (asJson) { console.log(JSON.stringify({ version: v, verdict, ran, notRan, findings }, null, 2)); return; }
  let md = `# Antz Design System audit\n\nDesign system version: **${v}** · ${new Date().toISOString().slice(0, 10)} · read-only (nothing was changed)\n\n`;
  md += `## A. Overall compliance: ${verdict}\n\nCritical ${n('B')} · Major ${n('C')} · Minor ${n('D')} · Accessibility ${n('E')}\n\n**Checks that ran**\n${ran.map((x) => '- ' + x).join('\n') || '- none'}\n\n**Not checked**\n${notRan.map((x) => '- ' + x).join('\n') || '- nothing left out'}\n`;
  for (const c of ['B', 'C', 'D', 'E']) {
    const xs = findings.filter((f) => f.cat === c);
    md += `\n## ${c}. ${CAT_TITLE[c]} (${xs.length})\n`;
    if (!xs.length) { md += '\nNone found.\n'; continue; }
    for (const f of xs) md += `\n- **${f.where}** · ${f.rule}\n  - Issue: ${f.issue}${f.snippet ? `  \n    \`${f.snippet.replace(/\`/g, "'")}\`` : ''}\n  - Rule: ${f.expected || 'see the rule register'}\n  - Fix: ${FIX[f.rule] || (/: use (.+)$/.test(f.issue) ? 'use ' + f.issue.match(/: use (.+)$/)[1] : 'follow the rule above')}\n`;
  }
  md += `\n## Summary of required fixes\n\n${findings.length ? `Fix the ${n('B') + n('E')} critical and accessibility finding(s) first, then the ${n('C')} major one(s). Deprecated names (${n('D')}) still work but should be replaced.` : 'Nothing to fix.'} Ask /systemdesigner to make the fixes if you want them done; this audit changed nothing.\n`;
  if (outFile) { fs.writeFileSync(outFile, md); console.log(`Report written to ${outFile}. Verdict: ${verdict}.`); } else console.log(md);
}

(commands[cmd] || commands.help)().catch((e) => { console.error(`antz: ${e.message}`); process.exit(2); });
