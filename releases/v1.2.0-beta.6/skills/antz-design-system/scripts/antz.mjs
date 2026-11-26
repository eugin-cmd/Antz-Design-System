#!/usr/bin/env node
/* Antz Design System · skill helper (Node 18+, no dependencies)

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

   Source (first match wins):
     --source <path|url> or ANTZ_DS_SOURCE    a clone of the repository, or the site URL
     an "antz-design-system" folder in this directory or any parent
     https://antz-design-system.eugin-736.workers.dev   (the team site)
   Version: --version <x.y.z> or ANTZ_DS_VERSION, else the latest published release. */
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

let _version;
async function version() {
  if (_version) return _version;
  const idx = await readJson('releases/index.json');
  const v = versionArg || idx.latest;
  if (!idx.versions.some((x) => x.version === v)) throw new Error(`Version ${v} is not published. Published: ${idx.versions.map((x) => x.version).join(', ')}`);
  return (_version = v);
}
const rel = async (p) => `releases/v${await version()}/${p}`;
const release = async (p) => readRaw(await rel(p));

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const text = (html) => decode(html.replace(/<(script|style|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<\/(p|li|h[1-6]|tr|div|dd|dt)>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

const commands = {
  async help() { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0].replace('/*', '').trim()); },

  async info() {
    const idx = await readJson('releases/index.json');
    console.log(`Source:   ${source.kind === 'dir' ? 'local clone ' : 'site '}${source.base}`);
    console.log(`Version:  ${await version()}${versionArg ? ' (pinned)' : ' (latest)'}`);
    console.log(`Published: ${idx.versions.map((v) => `${v.version} (${v.date})`).join(', ')}`);
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
    let script;
    if (source.kind === 'dir') script = path.join(source.base, await rel('tools/check.mjs'));
    else {
      // Mirror the four files the checker needs into a per-version cache, in the layout it expects.
      const dir = path.join(os.homedir(), '.cache', 'antz-design-system', `v${await version()}`);
      for (const f of ['tools/check.mjs', 'governance/rules.json', 'governance/exceptions.json', 'dist/tokens/token-index.json']) {
        const out = path.join(dir, f);
        if (!fs.existsSync(out)) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, await release(f)); }
      }
      script = path.join(dir, 'tools/check.mjs');
    }
    const res = spawnSync(process.execPath, [script, ...(report ? ['--report'] : []), ...(json ? ['--json'] : []), ...paths], { stdio: 'inherit' });
    process.exit(res.status ?? 1);
  },
};

(commands[cmd] || commands.help)().catch((e) => { console.error(`antz: ${e.message}`); process.exit(2); });
