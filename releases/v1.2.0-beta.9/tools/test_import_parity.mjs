#!/usr/bin/env node
/* Parity test: assets/theme-import.js must give exactly what tools/import_theme.py gives.

     node tools/test_import_parity.mjs            # every example and theme, plus generated and broken inputs
     node tools/test_import_parity.mjs --quick    # skip the generated themes

   For each input it runs both importers and compares:
     - the report (python --dry-run stdout against the JS report lines);
     - the files written into a scratch copy of this folder (themes/<slug>.css, <slug>.antz-theme.json,
       index.json), byte for byte. Imports run one after another into the same copies, so appending to and
       replacing entries in index.json are compared too. The JS is given the Python run's own timestamp,
       so nothing needs to be ignored;
     - the error message, for inputs that should be refused.
   Needs python3 and node 18+. Exits 1 on any difference. */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importTheme, writeToDirectory, ThemeError } from '../assets/theme-import.js';

const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const quick = process.argv.includes('--quick');
let failures = 0, checks = 0;
function same(label, a, b) {
  checks++;
  if (a === b) return true;
  failures++;
  const al = a.split('\n'), bl = b.split('\n');
  let k = 0; while (k < al.length && al[k] === bl[k]) k++;
  console.log('DIFF ' + label + ' at line ' + (k + 1) + ':\n  python: ' + JSON.stringify(al[k]) + '\n  js:     ' + JSON.stringify(bl[k]));
  return false;
}

/* A directory handle (File System Access API shape) over a real folder, for writeToDirectory() */
class FileH {
  constructor(p) { this.p = p; this.kind = 'file'; this.name = path.basename(p); }
  async getFile() { const p = this.p; return { text: async () => fs.readFileSync(p, 'utf8') }; }
  async createWritable() { const p = this.p; let buf = ''; return { write: async (t) => { buf += t; }, close: async () => { fs.writeFileSync(p, buf); } }; }
}
class DirH {
  constructor(p) { this.p = p; this.kind = 'directory'; this.name = path.basename(p); }
  async getDirectoryHandle(n, o) {
    const p = path.join(this.p, n);
    if (!fs.existsSync(p)) { if (o && o.create) fs.mkdirSync(p); else throw Object.assign(new Error('NotFoundError'), { name: 'NotFoundError' }); }
    if (!fs.statSync(p).isDirectory()) throw Object.assign(new Error('TypeMismatchError'), { name: 'TypeMismatchError' });
    return new DirH(p);
  }
  async getFileHandle(n, o) {
    const p = path.join(this.p, n);
    if (!fs.existsSync(p)) { if (o && o.create) fs.writeFileSync(p, ''); else throw Object.assign(new Error('NotFoundError'), { name: 'NotFoundError' }); }
    return new FileH(p);
  }
}

/* Two scratch copies of the parts of this folder the importer reads and writes */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'antz-parity-'));
const PY = path.join(tmp, 'py'), JS = path.join(tmp, 'js');
for (const d of [PY, JS]) {
  fs.mkdirSync(path.join(d, 'tools'), { recursive: true });
  fs.copyFileSync(path.join(HERE, 'tokens.css'), path.join(d, 'tokens.css'));
  for (const f of ['import_theme.py', 'colors.py']) fs.copyFileSync(path.join(HERE, 'tools', f), path.join(d, 'tools', f));
  fs.cpSync(path.join(HERE, 'themes'), path.join(d, 'themes'), { recursive: true });
}
const tokensCss = fs.readFileSync(path.join(HERE, 'tokens.css'), 'utf8');

function py(args) {
  const r = spawnSync('python3', [path.join(PY, 'tools', 'import_theme.py'), ...args], { encoding: 'utf8' });
  if (r.stderr) console.log('python stderr: ' + r.stderr.trim().split('\n').slice(-1)[0]);
  return { out: r.stdout, code: r.status };
}

/* ── Inputs ── */
const inputs = [];
for (const dir of [path.join(HERE, '..', 'theme-exports', 'examples'), path.join(HERE, 'themes')]) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).sort()) if (f.endsWith('.antz-theme.json')) inputs.push(path.join(dir, f));
}
const gen = path.join(tmp, 'inputs'); fs.mkdirSync(gen);
function put(name, text) { const p = path.join(gen, name); fs.writeFileSync(p, text); return p; }

/* Generated themes: random parts, presets read from M3 roles, fonts with ties, odd JSON */
if (!quick) {
  let seed = 20261119;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const hex = () => '#' + Array.from({ length: 3 }, () => Math.floor(rnd() * 256).toString(16).padStart(2, '0')).join('').toUpperCase();
  const parts = ['page', 'sections', 'cards', 'cardInsets', 'inputs', 'tabs', 'textPrimary', 'textSecondary', 'inputContent', 'textAccent',
    'btnSecondaryContent', 'btnPrimary', 'tabActive', 'btnPrimaryContent', 'btnSecondary', 'dividers', 'chips', 'chipContent', 'chipSelected',
    'feature', 'featureContent', 'overlays', 'overlayContent', 'alert', 'alertContent', 'scrim', 'avatars', 'avatarContent', 'status', 'appbar', 'icons', 'mystery'];
  const roles = ['surfaceContainer', 'background', 'surfaceContainerLow', 'surfaceContainerLowest', 'surfaceContainerHigh', 'onSurface', 'onSurfaceVariant',
    'primary', 'onPrimary', 'outlineVariant', 'inverseSurface', 'inverseOnSurface'];
  const fams = ['Poppins', 'Lora', 'Inter', 'Roboto Slab', 'Space Mono', 'Caveat', 'Playfair Display'];
  const cats = { Poppins: 'sans-serif', Lora: 'serif', Inter: 'sans-serif', 'Roboto Slab': 'serif', 'Space Mono': 'monospace', Caveat: 'handwriting', 'Playfair Display': 'display' };
  for (let n = 0; n < (+process.env.PARITY_N || 60); n++) {
    const preset = rnd() < 0.25;
    const pick = (list, p) => Object.fromEntries(list.filter(() => rnd() < p).map((k) => [k, hex()]));
    const doc = { format: 'antz-theme', version: 1, name: 'Generated ' + n, slug: 'gen-' + (n % 45), createdAt: '2026-11-19T10:00:00Z',
      colors: { base: preset ? 'tonal-spot' : 'build', parts: preset ? {} : { light: pick(parts, 0.22) }, roles: { light: pick(roles, 0.8), dark: pick(roles, 0.8) } },
      fonts: { resolved: {} } };
    if (!preset && rnd() < 0.6) doc.colors.parts.dark = pick(parts, 0.15);
    if (rnd() < 0.3) doc.colors.partCatalog = [{ id: 'page' }, { id: 'newPart' }];
    for (const r of ['display', 'headline', 'title', 'body', 'label']) {
      if (rnd() < 0.15) { doc.fonts.resolved[r] = null; continue; }
      if (rnd() < 0.8) doc.fonts.resolved[r] = { family: fams[Math.floor(rnd() * fams.length)], weights: [100 * (1 + Math.floor(rnd() * 9))] };
    }
    doc.fonts.categories = cats;
    if (rnd() < 0.3) doc.fonts.allText = { family: 'Caveat', weight: rnd() < 0.5 ? 700 : null };
    let text = JSON.stringify(doc, null, rnd() < 0.5 ? 2 : 0);
    if (n % 7 === 3) text = text.replace('"createdAt"', '"extra": {"b": 1.0, "a": 2.50, "big": 12345678901234567890, "tiny": 1e-7, "n": -0, "e": 1E400, "2": "x", "1": "y"}, "createdAt"');
    if (n % 11 === 5) text = text.replace('"version":1', '"version":1.0').replace('"version": 1', '"version": 1.0');
    if (n % 13 === 6) text = text.replace('"name":', '"name": "Shadowed", "name":');
    inputs.push(put('gen-' + n + '.antz-theme.json', text));
  }
}

/* Inputs both should refuse, with the same message */
const sunset = fs.readFileSync(path.join(HERE, 'themes', 'sunset.antz-theme.json'), 'utf8');
const bad = [
  ['empty', ''], ['not-json', '{"format": "antz-theme",}'], ['trailing', '{"a": 1} x'], ['colon', '{"a" 1}'], ['array', '[1, 2]'],
  ['format', sunset.replace('"antz-theme"', '"other"')], ['version', sunset.replace('"version": 1', '"version": 2')],
  ['no-name', sunset.replace('"name": "Sunset"', '"name": "  "')], ['slug', sunset.replace('"slug": "sunset"', '"slug": "Sun Set"')],
  ['reserved', sunset.replace('"slug": "sunset"', '"slug": "dark"')], ['hex', sunset.replace('"page": "#FFF8F0"', '"page": "#FFF8F"')],
  ['mode', sunset.replace('"light": {\n        "page"', '"dusk": {\n        "page"')],
  ['family', sunset.replace('"family": "Lora",\n        "weights"', '"family": "Lora;",\n        "weights"')],
  ['weight', sunset.replace('"weights": [\n          700', '"weights": [\n          750')],
  ['weight-float', sunset.replace('"weights": [\n          700', '"weights": [\n          700.0')],
].map(([n, t]) => [n, put('bad-' + n + '.antz-theme.json', t)]);

/* ── Run ── */
const now0 = new Date();
let n = 0;
for (const file of inputs) {
  const text = fs.readFileSync(file, 'utf8');
  const label = path.relative(HERE, file).startsWith('..' + path.sep + '..') ? path.basename(file) : path.relative(HERE, file);
  // 1. dry-run report against the scratch copy's current manifest
  const dry = py([file, '--dry-run']);
  let r;
  try { r = importTheme(text, { tokensCss, manifestText: fs.readFileSync(path.join(JS, 'themes', 'index.json'), 'utf8'), now: now0 }); }
  catch (e) { same(label + ' (import)', dry.out, 'error: ' + e.message); continue; }
  same(label + ' (report)', dry.out, r.report.lines.join('\n') + '\n\n--dry-run: nothing written.\n');
  // 2. write: python first, then the JS with python's timestamp
  const w = py([file]);
  const man = JSON.parse(fs.readFileSync(path.join(PY, 'themes', 'index.json'), 'utf8'));
  const at = (man.themes.find((t) => t.slug === r.slug) || {}).importedAt;
  const r2 = await writeToDirectory(new DirH(JS), text, { now: new Date(at) });
  same(label + ' (stdout)', w.out, r2.report.lines.concat(r2.report.writtenLines).join('\n') + '\n');
  for (const f of [r.slug + '.css', r.slug + '.antz-theme.json', 'index.json']) {
    same(label + ' -> themes/' + f, fs.readFileSync(path.join(PY, 'themes', f), 'utf8'), fs.readFileSync(path.join(JS, 'themes', f), 'utf8'));
  }
  n++;
}
for (const [name, file] of bad) {
  const out = py([file, '--dry-run']).out.trim();
  let msg;
  try { importTheme(fs.readFileSync(file, 'utf8'), { tokensCss, manifestText: null }); msg = '(accepted)'; }
  catch (e) { msg = e instanceof ThemeError ? e.message : 'crash: ' + e.message; }
  same('refuses ' + name, out, 'error: ' + file + ': ' + msg);
}
// the scratch folders must match file for file at the end
const list = (d) => fs.readdirSync(path.join(d, 'themes')).sort().join('\n');
same('themes/ file list', list(PY), list(JS));

fs.rmSync(tmp, { recursive: true, force: true });
console.log((failures ? 'FAIL' : 'OK') + ': ' + n + ' imports and ' + bad.length + ' refused inputs compared, ' + checks + ' checks, ' + failures + ' differences.');
process.exit(failures ? 1 : 0);
