/* ==========================================================================
   Theme importer, JavaScript port of tools/import_theme.py (ES module, no dependencies).

   Runs in the browser (pages/import-theme.html) and in node (tools/test_import_parity.mjs).
   For the same input it produces exactly what the Python CLI writes: themes/<slug>.css,
   themes/<slug>.antz-theme.json, themes/index.json and the printed report.
   tools/test_import_parity.mjs checks that. Change both files together.

     import { importTheme } from './theme-import.js';
     const r = importTheme(jsonText, { tokensCss, manifestText, now: new Date() });
     r.css, r.sourceText, r.manifestText, r.entry, r.report.lines, r.preview

   The parts of colors.py the importer uses (tokens.css parser, WCAG maths, the approved pairs)
   are ported here too, as are the bits of Python behaviour that show in the output: JSON key order,
   ints versus floats, round-half-even and '%.2f' formatting.
   ========================================================================== */

/* ── Python-compatible JSON: keeps key order, duplicate keys (last value, first position) and int vs float ── */
export class PyFloat { constructor(v) { this.v = v; } valueOf() { return this.v; } }

export class ThemeError extends Error { constructor(msg) { super(msg); this.name = 'ThemeError'; } }

export function pyJsonParse(text) {
  let i = 0;
  const n = text.length;
  const where = (k) => {
    const before = text.slice(0, k), line = before.split('\n').length, col = k - before.lastIndexOf('\n');
    return ': line ' + line + ' column ' + col + ' (char ' + k + ')';
  };
  const fail = (msg, k) => { throw new ThemeError(msg + where(k === undefined ? i : k)); };
  const ws = () => { while (i < n && (text[i] === ' ' || text[i] === '\t' || text[i] === '\n' || text[i] === '\r')) i++; };
  const NUM = /-?(?:0|[1-9]\d*)(\.\d+)?([eE][-+]?\d+)?/y;
  function str() {
    const start = i; i++;
    for (;;) {
      if (i >= n) fail('Unterminated string starting at', start);
      const c = text[i];
      if (c === '"') { i++; break; }
      if (c === '\\') { i += 2; continue; }
      if (c < ' ') fail('Invalid control character at', i);
      i++;
    }
    try { return JSON.parse(text.slice(start, i)); } catch (e) { return fail('Invalid \\escape', start); }
  }
  function value() {
    const c = text[i];
    if (c === '{') {
      const m = new Map(); i++; ws();
      if (text[i] === '}') { i++; return m; }
      for (;;) {
        if (text[i] !== '"') fail('Expecting property name enclosed in double quotes');
        const k = str(); ws();
        if (text[i] !== ':') fail("Expecting ':' delimiter");
        i++; ws();
        m.set(k, value()); ws();
        if (text[i] === ',') { i++; ws(); continue; }
        if (text[i] === '}') { i++; return m; }
        fail("Expecting ',' delimiter");
      }
    }
    if (c === '[') {
      const a = []; i++; ws();
      if (text[i] === ']') { i++; return a; }
      for (;;) {
        a.push(value()); ws();
        if (text[i] === ',') { i++; ws(); continue; }
        if (text[i] === ']') { i++; return a; }
        fail("Expecting ',' delimiter");
      }
    }
    if (c === '"') return str();
    if (text.startsWith('null', i)) { i += 4; return null; }
    if (text.startsWith('true', i)) { i += 4; return true; }
    if (text.startsWith('false', i)) { i += 5; return false; }
    if (text.startsWith('NaN', i)) { i += 3; return new PyFloat(NaN); }
    if (text.startsWith('Infinity', i)) { i += 8; return new PyFloat(Infinity); }
    if (text.startsWith('-Infinity', i)) { i += 9; return new PyFloat(-Infinity); }
    NUM.lastIndex = i;
    const m = NUM.exec(text);
    if (m) {
      i += m[0].length;
      if (m[1] || m[2]) return new PyFloat(Number(m[0]));
      const b = BigInt(m[0]), x = Number(b);
      return Number.isSafeInteger(x) ? x : b;
    }
    return fail('Expecting value');
  }
  if (text.charCodeAt(0) === 0xFEFF) i = 1;   // a BOM (Python refuses it; harmless to skip)
  ws();
  const v = value(); ws();
  if (i !== n) fail('Extra data');
  return v;
}

export function pyFloatRepr(x) {
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (x === 0) return Object.is(x, -0) ? '-0.0' : '0.0';
  let [mant, e] = x.toExponential().split('e');
  e = +e;
  const neg = mant[0] === '-'; if (neg) mant = mant.slice(1);
  const digits = mant.replace('.', '');
  let out;
  if (e < -4 || e >= 16) out = (digits.length > 1 ? digits[0] + '.' + digits.slice(1) : digits) + 'e' + (e < 0 ? '-' : '+') + String(Math.abs(e)).padStart(2, '0');
  else {
    const point = e + 1;
    if (point <= 0) out = '0.' + '0'.repeat(-point) + digits;
    else if (point >= digits.length) out = digits + '0'.repeat(point - digits.length) + '.0';
    else out = digits.slice(0, point) + '.' + digits.slice(point);
  }
  return (neg ? '-' : '') + out;
}

/* json.dump(x, indent=2, ensure_ascii=False). Plain JS numbers are ints unless they have a fraction. */
export function pyJsonDump(v, ind = '') {
  if (v === null || v === undefined) return 'null';
  if (v === true) return 'true';
  if (v === false) return 'false';
  if (v instanceof PyFloat) return pyFloatRepr(v.v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : pyFloatRepr(v);
  if (typeof v === 'string') return JSON.stringify(v);
  const inner = ind + '  ';
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    return '[\n' + v.map((x) => inner + pyJsonDump(x, inner)).join(',\n') + '\n' + ind + ']';
  }
  const entries = v instanceof Map ? [...v.entries()] : Object.entries(v);
  if (!entries.length) return '{}';
  return '{\n' + entries.map(([k, x]) => inner + JSON.stringify(String(k)) + ': ' + pyJsonDump(x, inner)).join(',\n') + '\n' + ind + '}';
}

/* tree (Map / PyFloat) to plain JSON values, for storage and the site script */
export function toPlain(v) {
  if (v instanceof PyFloat) return v.v;
  if (typeof v === 'bigint') return Number(v);
  if (Array.isArray(v)) return v.map(toPlain);
  if (v instanceof Map) { const o = {}; for (const [k, x] of v) o[k] = toPlain(x); return o; }
  return v;
}

/* ── Small Python helpers ── */
const isDict = (x) => x instanceof Map;
const get = (x, k, dflt) => (isDict(x) && x.has(k) ? x.get(k) : dflt);
function truthy(x) {
  if (x === null || x === undefined || x === false || x === 0 || x === '' || x === 0n) return false;
  if (x instanceof PyFloat) return x.v !== 0;
  if (Array.isArray(x)) return x.length > 0;
  if (isDict(x)) return x.size > 0;
  return true;
}
const or = (x, dflt) => (truthy(x) ? x : dflt);
function pyRepr(x) {
  if (x === null || x === undefined) return 'None';
  if (x === true) return 'True';
  if (x === false) return 'False';
  if (x instanceof PyFloat) return pyFloatRepr(x.v);
  if (typeof x === 'number' || typeof x === 'bigint') return String(x);
  if (typeof x === 'string') {
    const q = x.indexOf("'") > -1 && x.indexOf('"') < 0 ? '"' : "'";
    const body = x.replace(/[\\\n\r\t]/g, (c) => ({ '\\': '\\\\', '\n': '\\n', '\r': '\\r', '\t': '\\t' })[c])
      .replace(/[\x00-\x1f\x7f]/g, (c) => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0'));
    return q + (q === "'" ? body.replace(/'/g, "\\'") : body) + q;
  }
  if (Array.isArray(x)) return '[' + x.map(pyRepr).join(', ') + ']';
  if (isDict(x)) return '{' + [...x].map(([k, v]) => pyRepr(k) + ': ' + pyRepr(v)).join(', ') + '}';
  return String(x);
}
function pyStr(x) { return typeof x === 'string' ? x : pyRepr(x); }
const numOf = (x) => (x === true ? 1 : x === false ? 0 : x instanceof PyFloat ? x.v : typeof x === 'bigint' ? Number(x) : x);
const isPyInt = (x) => typeof x === 'boolean' || typeof x === 'bigint' || (typeof x === 'number' && Number.isInteger(x));

/* Exact decimal formatting with Python's round-half-even ('%.Nf' and round(x, N)) */
export function pyFixed(x, d) {
  if (!Number.isFinite(x)) return Number.isNaN(x) ? 'nan' : x > 0 ? 'inf' : '-inf';
  const neg = x < 0 || Object.is(x, -0);
  const s = Math.abs(x).toFixed(100);
  let [ip, fp] = s.split('.');
  const keep = fp.slice(0, d), rest = fp.slice(d);
  let digits = ip + keep, up;
  if (rest[0] > '5') up = true;
  else if (rest[0] < '5') up = false;
  else up = /[1-9]/.test(rest.slice(1)) || (+digits[digits.length - 1]) % 2 === 1;
  if (up) {
    const a = digits.split(''); let k = a.length - 1;
    while (k >= 0) { if (a[k] === '9') { a[k] = '0'; k--; } else { a[k] = String(+a[k] + 1); break; } }
    if (k < 0) a.unshift('1');
    digits = a.join('');
  }
  const il = digits.length - d;
  return (neg ? '-' : '') + (d ? digits.slice(0, il) + '.' + digits.slice(il) : digits);
}
const pyRound = (x, d) => Number(pyFixed(x, d));
function pyRoundInt(v) {
  const f = Math.floor(v), diff = v - f;
  if (diff > 0.5) return f + 1;
  if (diff < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}
function pyMod(x, w) {
  let m = x % w;
  if (m) { if ((w < 0) !== (m < 0)) m += w; } else m = w < 0 ? -0 : 0;
  return m;
}
const hex2 = (v) => v.toString(16).toUpperCase().padStart(2, '0');
const sortStr = (a) => a.slice().sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));

/* ══════════ colors.py: tokens.css parser and WCAG contrast ══════════ */
const DECL = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;
function declMap(s) { const m = new Map(); for (const x of s.matchAll(DECL)) m.set(x[1], x[2]); return m; }

export function cssBlocks(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const idx = (needle) => { const k = css.indexOf(needle); if (k < 0) throw new ThemeError('tokens.css: "' + needle + '" not found'); return k; };
  const body = (start) => {
    let depth = 0; const i = css.indexOf('{', start);
    for (let j = i; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') { depth--; if (depth === 0) return css.slice(i + 1, j); }
    }
    throw new ThemeError('tokens.css: unbalanced braces');
  };
  const root = body(idx(':root {'));
  let media = body(idx('@media (prefers-color-scheme: dark)'));
  const forced = body(idx(':root[data-theme="dark"]'));
  media = media.slice(media.indexOf('{') + 1, media.lastIndexOf('}'));
  return [declMap(root), declMap(media), declMap(forced)];
}

export function cssThemes(tokensCss) {
  const [light, media, forced] = cssBlocks(tokensCss);
  const same = media.size === forced.size && [...media].every(([k, v]) => forced.has(k) && forced.get(k) === v);
  if (!same) throw new ThemeError('tokens.css: the two dark blocks differ');
  const dark = new Map(light); for (const [k, v] of forced) dark.set(k, v);
  return { light, dark, darkNames: new Set(forced.keys()) };
}

function resolve(name, theme, seen = []) {
  if (!theme.has(name)) throw new ThemeError('KeyError: ' + name);
  const v = theme.get(name).trim();
  const m = /^var\((--[a-z0-9-]+)\)$/.exec(v);
  if (m) {
    if (seen.indexOf(m[1]) > -1) throw new ThemeError('tokens.css: circular var() at ' + name);
    return resolve(m[1], theme, seen.concat([name]));
  }
  return v;
}

function pyInt(s) { if (!/^\s*[+-]?\d+\s*$/.test(s)) throw new ThemeError('ValueError: int ' + s); return parseInt(s, 10); }
function pyFloat(s) { if (!/^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?\s*$/.test(s)) throw new ThemeError('ValueError: float ' + s); return Number(s); }

export function parseColor(v) {
  v = v.trim();
  if (v === '#fff' || v === '#FFF') v = '#FFFFFF';
  let m = /^#([0-9a-fA-F]{6})$/.exec(v);
  if (m) { const h = m[1]; return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1.0]; }
  m = /^#([0-9a-fA-F]{3})$/.exec(v);
  if (m) return m[1].split('').map((c) => parseInt(c + c, 16)).concat([1.0]);
  m = /^rgba?\(([^)]*)\)$/.exec(v);
  if (m) {
    const p = m[1].split(',').map((x) => x.trim());
    if (p.length < 3) throw new ThemeError('IndexError: ' + v);
    return [pyInt(p[0]), pyInt(p[1]), pyInt(p[2]), p.length > 3 ? pyFloat(p[3]) : 1.0];
  }
  return null;
}

export function toHex(c) {
  const h = '#' + hex2(c[0]) + hex2(c[1]) + hex2(c[2]);
  return c[3] >= 1 ? h : h + hex2(pyRoundInt(c[3] * 255));
}

export function lum(c) {
  const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
}
export function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

function colorsOf(name, theme) {
  const v = resolve(name, theme);
  const c = parseColor(v);
  if (c) return [c];
  return (v.match(/#[0-9A-Fa-f]{6}/g) || []).map(parseColor);
}
function minRatio(fgs, bgs) {
  if (!fgs.length || !bgs.length) throw new ThemeError('ValueError: min() arg is an empty sequence');
  let r = Infinity;
  for (const a of fgs) for (const b of bgs) { const x = ratio(a, b); if (x < r) r = x; }
  return r;
}

const HUES = ['green', 'teal', 'sky', 'coral', 'amber', 'violet', 'navy'];
/* (fg, bg, kind, use): the approved pairs of tools/colors.py, in the same order */
export const PAIRS = [
  ['--color-text', '--color-surface', 'text', 'Body text on cards'],
  ['--color-text', '--color-bg-app', 'text', 'Text on the board'],
  ['--color-text', '--color-surface-muted', 'text', 'Text in filled controls'],
  ['--color-text-secondary', '--color-surface', 'text', 'Labels'],
  ['--color-text-secondary', '--color-surface-sunken', 'text', 'Labels in rows'],
  ['--color-text-muted', '--color-surface', 'text', 'Meta and captions'],
  ['--color-text-muted', '--color-surface-sunken', 'text', 'Meta in rows'],
  ['--color-text-muted', '--color-surface-muted', 'text', 'Meta in filled controls'],
  ['--color-text-muted', '--color-bg-canvas', 'text', 'Meta on the canvas'],
  ['--color-text-muted', '--color-bg-app', 'text', 'Meta on the board'],
  ['--color-text-placeholder', '--color-surface', 'text', 'Placeholders'],
  ['--color-text-link', '--color-surface', 'text', 'Links'],
  ['--color-accent-text', '--color-surface', 'text', 'Accent text, selected labels'],
  ['--color-accent-text', '--color-accent-soft', 'text', 'Secondary button, active nav'],
  ['--color-text-on-accent', '--color-accent', 'text', 'Primary button'],
  ['--color-text-on-accent', '--color-accent-hover', 'text', 'Primary button, hover'],
  ['--color-success-text', '--color-success-bg', 'text', 'Success chip and alert'],
  ['--color-warning-text', '--color-warning-bg', 'text', 'Warning chip and alert'],
  ['--color-danger-text', '--color-danger-bg', 'text', 'Danger chip and alert'],
  ['--color-info-text', '--color-info-bg', 'text', 'Info chip and alert'],
  ['--color-neutral-text', '--color-neutral-bg', 'text', 'Neutral status chip'],
  ['--color-success-text', '--color-surface', 'text', 'Success hint text'],
  ['--color-warning-text', '--color-surface', 'text', 'Warning hint text'],
  ['--color-danger-text', '--color-surface', 'text', 'Error text'],
  ['--color-info-text', '--color-surface', 'text', 'Info text'],
  ['--color-success-on-solid', '--color-success-solid', 'text', 'Solid success'],
  ['--color-warning-on-solid', '--color-warning-solid', 'text', 'Warning button, high priority'],
  ['--color-danger-on-solid', '--color-danger-solid', 'text', 'Danger button, emergency'],
  ['--color-info-on-solid', '--color-info-solid', 'text', 'Info button, normal priority'],
  ['--color-text-inverse', '--color-surface-inverse', 'text', 'Toasts, tooltips'],
  ['--color-text-on-strong', '--color-surface-strong', 'text', 'Charcoal card'],
  ['--color-text-on-strong', '--gradient-deep', 'text', 'Text on the deep green fill (every stop)'],
  ['--color-accent-bright', '--gradient-deep', 'text', 'Lime figures on the deep green fill (every stop)'],
  ['--color-text-on-strong', '--gradient-green', 'text', 'Not approved for small text: move it to --gradient-deep'],
].concat(HUES.map((h) => ['--hue-' + h + '-ink', '--hue-' + h + '-soft', 'text', 'Tinted chip, tag or avatar']))
  .concat(HUES.map((h) => ['--hue-' + h + '-ink', '--color-surface', 'text', 'Hue text on a card']))
  .concat(HUES.map((h) => ['--hue-' + h, '--color-surface', 'ui', 'Chart series, icon in a tile']))
  .concat([
    ['--color-border-input', '--color-surface', 'ui', 'Field border'],
    ['--color-focus', '--color-surface', 'ui', 'Focus ring on cards'],
    ['--color-focus', '--color-bg-canvas', 'ui', 'Focus ring on the canvas'],
    ['--color-accent', '--color-surface', 'ui', 'Selected control, switch on'],
    ['--color-signal-success', '--color-surface', 'ui', 'Success dot, bar or rail'],
    ['--color-signal-warning', '--color-surface', 'ui', 'Warning dot, bar or rail'],
    ['--color-signal-danger', '--color-surface', 'ui', 'Danger dot, bar or rail'],
    ['--color-signal-info', '--color-surface', 'ui', 'Info dot, bar or rail'],
    ['--color-text-disabled', '--color-surface', 'exempt', 'Disabled text (exempt from WCAG)'],
  ]);

function evaluateAntz(th) {
  return PAIRS.map(([fg, bg, kind, use]) => [fg, bg, kind, use, [th.light, th.dark].map((t) => minRatio(colorsOf(fg, t), colorsOf(bg, t)))]);
}

/* ══════════ import_theme.py ══════════ */
const RESERVED = new Set(['antz', 'light', 'dark', 'auto']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9A-Fa-f]{6}$/;
const FAMILY = /^[A-Za-z0-9 ]{1,64}$/;

/* 1. Part to token mapping (priority order: the first row with a colour wins a token) */
export const PART_MAP = [
  ['page', ['--color-bg-app']],
  ['sections', ['--color-bg-canvas']],
  ['cards', ['--color-surface', '--color-surface-raised']],
  ['cardInsets', ['--color-surface-sunken']],
  ['inputs', ['--color-surface-muted']],
  ['tabs', ['--color-surface-muted']],
  ['textPrimary', ['--color-text']],
  ['textSecondary', ['--color-text-secondary']],
  ['inputContent', ['--color-text-placeholder']],
  ['textAccent', ['--color-text-link', '--color-accent-text']],
  ['btnSecondaryContent', ['--color-accent-text']],
  ['btnPrimary', ['--color-accent']],
  ['tabActive', ['--color-accent']],
  ['btnPrimaryContent', ['--color-text-on-accent']],
  ['btnSecondary', ['--color-accent-soft']],
  ['dividers', ['--color-border']],
  ['chips', ['--color-neutral-bg']],
  ['chipContent', ['--color-neutral-text']],
  ['chipSelected', ['--color-surface-selected']],
  ['feature', ['--color-surface-strong']],
  ['featureContent', ['--color-text-on-strong']],
  ['overlays', ['--color-surface-inverse']],
  ['overlayContent', ['--color-text-inverse']],
  ['alert', ['--color-warning-bg']],
  ['alertContent', ['--color-warning-text']],
  ['scrim', ['--color-overlay']],
  ['avatars', ['--hue-violet-soft']],
  ['avatarContent', ['--hue-violet-ink']],
  ['status', ['--color-signal-success', '--color-signal-warning', '--color-signal-danger', '--color-signal-info']],
];
export const UNMAPPED_PARTS = ['statusbar', 'statusbarContent', 'appbar', 'appbarTitle', 'appbarContent', 'textHeading',
  'icons', 'chipSelectedContent', 'tabLabels', 'modTiles', 'modTileContent', 'images', 'imageMarks', 'badges', 'badgeContent'];
const ROLE_MAP = [
  ['surfaceContainer', ['--color-bg-app'], ['light']],
  ['background', ['--color-bg-app'], ['dark']],
  ['surfaceContainerLow', ['--color-bg-canvas', '--color-surface-sunken'], ['light', 'dark']],
  ['surfaceContainerLowest', ['--color-surface', '--color-surface-raised'], ['light']],
  ['surfaceContainer', ['--color-surface'], ['dark']],
  ['surfaceContainerHigh', ['--color-surface-muted'], ['light', 'dark']],
  ['onSurface', ['--color-text'], ['light', 'dark']],
  ['onSurfaceVariant', ['--color-text-secondary'], ['light', 'dark']],
  ['primary', ['--color-accent', '--color-text-link', '--color-accent-text'], ['light', 'dark']],
  ['onPrimary', ['--color-text-on-accent'], ['light', 'dark']],
  ['outlineVariant', ['--color-border'], ['light', 'dark']],
  ['inverseSurface', ['--color-surface-inverse'], ['light', 'dark']],
  ['inverseOnSurface', ['--color-text-inverse'], ['light', 'dark']],
];

/* Colour maths (OKLab / OKLCH, sRGB D65), in the same order of operations as the Python */
function hexRgb(h) { h = h.replace(/^#+/, ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
function rgbHex(c) { return '#' + c.slice(0, 3).map((v) => hex2(Math.max(0, Math.min(255, pyRoundInt(v))))).join(''); }
function lin(v) { v /= 255.0; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }
function gam(v) { v = v <= 0.0031308 ? 12.92 * v : 1.055 * (v ** (1 / 2.4)) - 0.055; return v * 255.0; }
function cbrtSigned(x) { const p = Math.abs(x) ** (1 / 3); return (x < 0 || Object.is(x, -0)) ? -p : p; }
function toOklab(h) {
  const [r, g, b] = hexRgb(h).map(lin);
  let l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  let m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  let s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  l = cbrtSigned(l); m = cbrtSigned(m); s = cbrtSigned(s);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function oklabLin(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
const RAD_TO_DEG = 180.0 / Math.PI, DEG_TO_RAD = Math.PI / 180.0;
function toOklch(h) { const [L, a, b] = toOklab(h); return [L, Math.hypot(a, b), pyMod(RAD_TO_DEG * Math.atan2(b, a), 360)]; }
function fromOklch(L, Cc, H) {
  L = Math.max(0.0, Math.min(1.0, L));
  let lo = 0.0, hi = Cc;
  const fits = (c) => {
    const rgb = oklabLin(L, c * Math.cos(DEG_TO_RAD * H), c * Math.sin(DEG_TO_RAD * H));
    return [rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4), rgb];
  };
  let [ok, rgb] = fits(Cc);
  if (!ok) {
    for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; if (fits(mid)[0]) lo = mid; else hi = mid; }
    rgb = fits(lo)[1];
  }
  return rgbHex(rgb.map((v) => gam(Math.max(0.0, Math.min(1.0, v)))));
}
function setL(h, L, maxC) { const [, c, hue] = toOklch(h); return fromOklch(L, maxC == null ? c : Math.min(c, maxC), hue); }
function shiftL(h, d) { const [L, c, hue] = toOklch(h); return fromOklch(L + d, c, hue); }
function mix(a, b, t) {
  const x = toOklab(a), y = toOklab(b);
  const v = [0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t);
  return rgbHex(oklabLin(v[0], v[1], v[2]).map((u) => gam(Math.max(0.0, Math.min(1.0, u)))));
}
const rgb4 = (h) => hexRgb(h).concat([1.0]);
const contrast = (a, b) => ratio(rgb4(a), rgb4(b));
const isLight = (h) => lum(rgb4(h)) > 0.18;
function ensure(fg, bgs, target) {
  bgs = bgs.filter(Boolean);
  if (bgs.every((b) => contrast(fg, b) >= target)) return fg;
  const darker = bgs.filter(isLight).length * 2 >= bgs.length;
  let [L, c, hue] = toOklch(fg), cand;
  for (let k = 0; k < 100; k++) {
    L += darker ? -0.01 : 0.01;
    cand = fromOklch(L, c, hue);
    if (bgs.every((b) => contrast(cand, b) >= target) || L <= 0 || L >= 1) return cand;
  }
  return cand;
}
function bestOn(bg, keep, target = 4.5) {
  if (keep && contrast(keep, bg) >= target) return keep;
  const ink = setL(bg, 0.24, 0.08);
  return contrast(ink, bg) > contrast('#FFFFFF', bg) ? ink : '#FFFFFF';
}
function rgba(h, a) {
  const [r, g, b] = hexRgb(h);
  const s = pyFixed(a, 2).replace(/0+$/, '').replace(/^0+/, '') || '0';
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + s + ')';
}
function hueTo(css, ref, range = [120, 175]) {
  const [, rc, rh] = toOklch(ref);
  const one = (h) => {
    const [L, c, hue] = toOklch(h);
    if (c < 0.02 || !(range[0] <= hue && hue <= range[1])) return h;
    return fromOklch(L, rc >= 0.04 ? c : rc, rh);
  };
  css = css.replace(/#[0-9A-Fa-f]{6}\b/g, (m) => one(m));
  return css.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/g, (m0, r, g, b, a) => {
    const n = hexRgb(one(rgbHex([+r, +g, +b])));
    return 'rgba(' + n[0] + ', ' + n[1] + ', ' + n[2] + ', ' + a + ')';
  });
}
function norm(v) {
  const c = parseColor(v);
  return c ? toHex(c).toUpperCase() : v.trim().replace(/\s+/g, ' ');
}

/* 2. Derived tokens (see the rules in import_theme.py) */
function derive(mode, m, antz) {
  const dark = mode === 'dark';
  const v = new Map(antz); for (const [k, x] of m) v.set(k, x);
  const d = new Set();
  const V = (t) => { if (!v.has(t)) throw new ThemeError('KeyError: ' + t); return v.get(t); };
  const A = (t) => { if (!antz.has(t)) throw new ThemeError('KeyError: ' + t); return antz.get(t); };
  const changed = (...ts) => ts.some((t) => m.has(t) && norm(m.get(t)) !== norm(A(t)));
  const put = (t, val) => { if (m.has(t)) return; v.set(t, val); d.add(t); };

  if (changed('--color-bg-app') && !m.has('--color-bg-canvas')) put('--color-bg-canvas', mix(V('--color-bg-app'), V('--color-surface'), 0.45));
  const surf = changed('--color-surface', '--color-bg-app', '--color-bg-canvas');
  if (surf) {
    if (!dark) put('--color-surface-sunken', mix(V('--color-surface'), V('--color-bg-app'), 0.35));
    else put('--color-surface-sunken', V('--color-bg-canvas'));
  }
  if (changed('--color-surface')) put('--color-surface-raised', !dark ? V('--color-surface') : shiftL(V('--color-surface'), 0.025));
  const txt = changed('--color-text');
  if (changed('--color-surface') || txt) {
    put('--color-surface-muted', mix(V('--color-surface'), V('--color-text'), dark ? 0.06 : 0.05));
    put('--color-surface-hover', mix(V('--color-surface'), V('--color-text'), dark ? 0.07 : 0.045));
    put('--color-disabled-bg', mix(V('--color-surface'), V('--color-text'), dark ? 0.10 : 0.20));
    put('--color-text-disabled', mix(V('--color-text'), V('--color-surface'), dark ? 0.58 : 0.62));
    if (!m.has('--color-border')) put('--color-border', mix(V('--color-surface'), V('--color-text'), dark ? 0.14 : 0.12));
  }
  const surfaces = [V('--color-surface'), V('--color-surface-sunken'), V('--color-surface-muted'), V('--color-bg-canvas'), V('--color-bg-app')];
  if (txt && !m.has('--color-text-secondary')) put('--color-text-secondary', ensure(mix(V('--color-text'), V('--color-surface'), 0.25), surfaces, 4.6));
  if (changed('--color-text-secondary', '--color-text') || surf) {
    put('--color-text-muted', ensure(mix(V('--color-text-secondary'), V('--color-surface'), 0.18), surfaces, 4.6));
    const ph = !dark ? V('--color-text-muted') : ensure(mix(V('--color-text-muted'), V('--color-surface'), 0.12), [V('--color-surface')], 4.5);
    put('--color-text-placeholder', ph);
  }
  if (m.has('--color-border') || d.has('--color-border') || txt) {
    const b = V('--color-border');
    put('--color-border-subtle', mix(b, V('--color-surface'), 0.40));
    put('--color-border-strong', mix(b, V('--color-text'), dark ? 0.20 : 0.15));
    put('--color-border-input', ensure(mix(b, V('--color-text'), 0.35), [V('--color-surface')], 3.0));
  }

  const acc = changed('--color-accent');
  if (acc) {
    const a = V('--color-accent');
    put('--color-accent-hover', shiftL(a, dark ? 0.07 : -0.06));
    put('--color-accent-pressed', shiftL(a, dark ? -0.06 : -0.12));
    put('--color-text-on-accent', bestOn(a, A('--color-text-on-accent')));
    if (!m.has('--color-accent-soft')) put('--color-accent-soft', setL(a, dark ? 0.31 : 0.95, 0.06));
  }
  if (acc || changed('--color-accent-soft')) put('--color-accent-soft-hover', shiftL(V('--color-accent-soft'), dark ? 0.04 : -0.03));
  if (acc) {
    const a = V('--color-accent');
    const txtAcc = ensure(dark ? shiftL(a, 0.04) : a, [V('--color-surface'), V('--color-accent-soft')], 4.6);
    put('--color-accent-text', txtAcc);
    put('--color-text-link', txtAcc);
    const bright = dark && toOklch(a)[0] >= 0.75 ? a : setL(a, 0.87);
    put('--color-accent-bright', bright);
    put('--color-text-on-bright', ensure(setL(bright, 0.3, 0.1), [bright], 4.6));
    put('--hue-green', a);
    put('--hue-green-soft', V('--color-accent-soft'));
    put('--hue-green-ink', V('--color-accent-text'));
    put('--color-surface-selected', mix(V('--color-surface'), a, dark ? 0.18 : 0.07));
  } else if (changed('--color-surface')) {
    put('--color-surface-selected', mix(V('--color-surface'), A('--color-accent'), dark ? 0.18 : 0.07));
  }
  if (surf) put('--color-focus', ensure(A('--color-focus'), [V('--color-surface'), V('--color-bg-canvas')], 3.0));
  if (acc || d.has('--color-focus')) put('--color-focus-glow', dark ? rgba(V('--color-focus'), 0.25) : rgba(V('--color-accent'), 0.12));

  for (const [fill, on] of [['--color-surface-strong', '--color-text-on-strong'], ['--color-surface-inverse', '--color-text-inverse'],
    ['--color-success-solid', '--color-success-on-solid'], ['--color-warning-solid', '--color-warning-on-solid'],
    ['--color-danger-solid', '--color-danger-on-solid'], ['--color-info-solid', '--color-info-on-solid']]) {
    if (changed(fill)) put(on, bestOn(V(fill), A(on)));
  }
  if (changed('--color-warning-bg')) {
    if (!m.has('--color-warning-text')) put('--color-warning-text', ensure(A('--color-warning-text'), [V('--color-warning-bg')], 4.6));
    put('--color-warning-border', mix(V('--color-warning-bg'), V('--color-warning-text'), 0.25));
  }
  if (changed('--color-neutral-bg') && !m.has('--color-neutral-text')) put('--color-neutral-text', ensure(A('--color-neutral-text'), [V('--color-neutral-bg')], 4.6));
  if (changed('--hue-violet-soft') && !m.has('--hue-violet-ink')) put('--hue-violet-ink', ensure(A('--hue-violet-ink'), [V('--hue-violet-soft')], 4.6));

  if (acc) {
    const a = V('--color-accent');
    if (!dark) {
      const tint = setL(a, 0.25, 0.06), [tr, tg, tb] = hexRgb(tint);
      for (const t of ['--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl', '--shadow-float']) {
        put(t, A(t).replace(/rgba\((0, 60, 30|20, 40, 30|0, 40, 20),/g, 'rgba(' + tr + ', ' + tg + ', ' + tb + ','));
      }
    }
    const [ar, ag, ab] = hexRgb(a);
    put('--shadow-accent', A('--shadow-accent').split('rgba')[0] + 'rgba' + '(' + ar + ', ' + ag + ', ' + ab + ', .9)');
    for (const t of ['--gradient-green', '--gradient-deep', '--gradient-mint', '--gradient-glow']) put(t, hueTo(A(t), a));
    const deep = colorsOf('--gradient-deep', v).map(toHex);
    if (d.has('--color-accent-bright')) {
      v.set('--color-accent-bright', ensure(v.get('--color-accent-bright'), deep, 4.6));
      v.set('--color-text-on-bright', ensure(setL(v.get('--color-accent-bright'), 0.3, 0.1), [v.get('--color-accent-bright')], 4.6));
    }
  }
  if (changed('--color-surface')) {
    const sf = V('--color-surface');
    for (const st of ['success', 'warning', 'danger', 'info']) {
      const tt = '--color-' + st + '-text', sg = '--color-signal-' + st;
      if (contrast(V(tt), sf) < 4.5) put(tt, ensure(V(tt), [sf, V('--color-' + st + '-bg')], 4.5));
      if (contrast(V(sg), sf) < 3) put(sg, ensure(V(sg), [sf], 3.0));
    }
    for (const h of HUES) {
      const ink = '--hue-' + h + '-ink', base = '--hue-' + h, soft = '--hue-' + h + '-soft';
      if (contrast(V(ink), sf) < 4.5) put(ink, ensure(V(ink), [sf, V(soft)], 4.5));
      if (contrast(V(base), sf) < 3) put(base, ensure(V(base), [sf], 3.0));
    }
  }
  return [v, d];
}

/* Reading the input */
export function validate(doc) {
  if (!isDict(doc)) throw new ThemeError('not a JSON object');
  if (get(doc, 'format') !== 'antz-theme') throw new ThemeError('format must be "antz-theme"');
  const ver = get(doc, 'version');
  if (!(ver === true || numOf(ver) === 1 && (typeof ver === 'number' || ver instanceof PyFloat || typeof ver === 'bigint'))) {
    throw new ThemeError('unsupported version ' + pyRepr(ver === undefined ? null : ver) + ' (this importer reads version 1)');
  }
  const name = get(doc, 'name'), slug = get(doc, 'slug');
  if (typeof name !== 'string' || !name.trim()) throw new ThemeError('name is missing');
  if (typeof slug !== 'string' || !SLUG.test(slug)) throw new ThemeError('slug ' + pyRepr(slug === undefined ? null : slug) + ' is not kebab-case (a-z, 0-9 and single hyphens)');
  if (RESERVED.has(slug)) throw new ThemeError('slug ' + pyRepr(slug) + ' is reserved; rename the theme in the Previewer');
  const cols = or(get(doc, 'colors'), new Map());
  if (!isDict(cols)) throw new ThemeError('colors is not an object');
  for (const sect of ['parts', 'roles']) {
    const s = or(get(cols, sect), new Map());
    if (!isDict(s)) throw new ThemeError('colors.' + sect + ' is not an object');
    for (const [mode, mp] of s) {
      if (mode !== 'light' && mode !== 'dark') throw new ThemeError('colors.' + sect + '.' + mode + ': mode must be light or dark');
      if (!isDict(mp)) throw new ThemeError('colors.' + sect + '.' + mode + ' is not an object');
      for (const [k, h] of mp) {
        if (typeof h !== 'string' || !HEX.test(h)) throw new ThemeError('colors.' + sect + '.' + mode + '.' + k + ': ' + pyRepr(h) + ' is not #RRGGBB');
      }
    }
  }
  const fonts = or(get(doc, 'fonts'), new Map());
  if (!isDict(fonts)) throw new ThemeError('fonts is not an object');
  const resolved = or(get(fonts, 'resolved'), new Map());
  if (!isDict(resolved)) throw new ThemeError('fonts.resolved is not an object');
  for (const [role, f] of resolved) {
    if (f === null) continue;
    if (!isDict(f) || typeof get(f, 'family') !== 'string' || !FAMILY.test(get(f, 'family'))) {
      throw new ThemeError('fonts.resolved.' + role + ': family is missing or has unexpected characters');
    }
    const ws = or(get(f, 'weights'), []);
    for (const w of (Array.isArray(ws) ? ws : typeof ws === 'string' ? ws.split('') : [ws])) {
      if (!isPyInt(w) || !(100 <= numOf(w) && numOf(w) <= 900) || numOf(w) % 100) throw new ThemeError('fonts.resolved.' + role + ': weight ' + pyRepr(w));
    }
  }
  return doc;
}

function mappedTokens(doc, mode) {
  const cols = or(get(doc, 'colors'), new Map());
  const parts = or(get(or(get(cols, 'parts'), new Map()), mode), new Map());
  const roles = or(get(or(get(cols, 'roles'), new Map()), mode), new Map());
  const out = new Map(), src = new Map();
  if (get(cols, 'base', 'build') !== 'build') {
    for (const [role, toks, modes] of ROLE_MAP) {
      if (roles.has(role) && modes.indexOf(mode) > -1) for (const t of toks) { out.set(t, roles.get(role).toUpperCase()); src.set(t, 'role ' + role); }
    }
  }
  const claimed = new Set();
  for (const [part, toks] of PART_MAP) {
    if (!parts.has(part)) continue;
    for (const t of toks) {
      if (claimed.has(t)) continue;
      claimed.add(t); out.set(t, parts.get(part).toUpperCase()); src.set(t, 'part ' + part);
    }
  }
  return [out, src];
}

function unknownParts(doc) {
  const known = new Set(PART_MAP.map((r) => r[0]).concat(UNMAPPED_PARTS));
  const cols = or(get(doc, 'colors'), new Map());
  const catList = or(get(cols, 'partCatalog'), []);
  const cat = new Set((Array.isArray(catList) ? catList : []).filter(isDict).map((p) => get(p, 'id', null)));
  const seen = new Set();
  for (const mp of or(get(cols, 'parts'), new Map()).values()) for (const k of mp.keys()) seen.add(k);
  const unmapped = new Set(UNMAPPED_PARTS);
  return [sortStr([...seen].filter((x) => unmapped.has(x))), sortStr([...seen].filter((x) => !known.has(x))),
    cat.size ? sortStr([...cat].filter((x) => !known.has(x)).map(pyStr)) : []];
}

/* Fonts */
const STACKS = {
  'sans-serif': 'system-ui, -apple-system, "Segoe UI", sans-serif',
  'serif': 'Georgia, "Times New Roman", serif',
  'monospace': 'ui-monospace, "SF Mono", Menlo, monospace',
  'cursive': 'cursive',
};
const ANTZ_FAMILY = 'Inter';
const CATEGORY_ALIAS = { 'display': 'sans-serif', 'handwriting': 'cursive' };

function fontsOf(doc) {
  const f = or(get(doc, 'fonts'), new Map());
  const res = new Map(or(get(f, 'resolved'), new Map()));
  const roles = or(get(f, 'roles'), new Map());
  const every = get(f, 'allText', null);
  for (const r of ['display', 'headline', 'title', 'body', 'label']) {
    if (truthy(get(res, r))) continue;
    const pk = or(get(roles, r), every);
    if (truthy(pk) && truthy(get(pk, 'family'))) {
      res.set(r, new Map([['family', get(pk, 'family')], ['weights', truthy(get(pk, 'weight')) ? [get(pk, 'weight')] : [400]]]));
    }
  }
  const fam = (r) => get(res.get(r), 'family');
  const pick = (order, tie) => {
    const fams = order.filter((r) => truthy(get(res, r))).map(fam);
    if (!fams.length) return ANTZ_FAMILY;
    const cnt = new Map(); for (const x of fams) cnt.set(x, (cnt.get(x) || 0) + 1);
    const top = Math.max(...cnt.values());
    const winners = [...cnt.keys()].filter((x) => cnt.get(x) === top);
    if (winners.length > 1 && truthy(get(res, tie)) && winners.indexOf(fam(tie)) > -1) return fam(tie);
    return fams.find((x) => winners.indexOf(x) > -1);
  };
  const heading = pick(['display', 'headline', 'title'], 'title');
  const body = pick(['body', 'label'], 'body');
  const cats = or(get(f, 'categories'), new Map());
  const stack = (fm) => {
    if (fm === ANTZ_FAMILY) return null;
    const c0 = get(cats, fm, 'sans-serif');
    let gen = Object.prototype.hasOwnProperty.call(CATEGORY_ALIAS, c0) ? CATEGORY_ALIAS[c0] : get(cats, fm, null);
    gen = typeof gen === 'string' && Object.prototype.hasOwnProperty.call(STACKS, gen) ? gen : 'sans-serif';
    return '"' + fm + '", ' + STACKS[gen];
  };
  const weights = new Map();   // family -> Map(numeric key -> value), a Python set of ints
  for (const x of res.values()) {
    if (truthy(x) && (get(x, 'family') === heading || get(x, 'family') === body) && get(x, 'family') !== ANTZ_FAMILY) {
      if (!weights.has(get(x, 'family'))) weights.set(get(x, 'family'), new Map());
      const set = weights.get(get(x, 'family'));
      for (const w of or(get(x, 'weights'), [400])) { const k = numOf(w); if (!set.has(k)) set.set(k, w); }
    }
  }
  const sortedW = (set) => [...set.keys()].sort((a, b) => a - b).map((k) => set.get(k));
  let url = null;
  if (weights.size) {
    url = 'https://fonts.googleapis.com/css2?' + sortStr([...weights.keys()]).map((fm) =>
      'family=' + fm.replace(/ /g, '+') + ':wght@' + sortedW(weights.get(fm)).map(pyStr).join(';')).join('&') + '&display=swap';
  }
  const fams = new Set(); for (const x of res.values()) if (truthy(x)) fams.add(get(x, 'family'));
  const unused = sortStr([...fams].filter((x) => x !== heading && x !== body));
  const tokens = new Map();
  if (stack(heading)) tokens.set('--font-heading', stack(heading));
  if (stack(body)) { tokens.set('--font-body', stack(body)); tokens.set('--font-family-sans', stack(body)); }
  const wout = new Map(); for (const [k, set] of weights) wout.set(k, sortedW(set));
  return { heading, body, url, unused, tokens, weights: wout };
}

/* ANTZ baseline */
export function antzBaseline(tokensCss) {
  const th = cssThemes(tokensCss);
  const flat = (t) => {
    const out = new Map();
    for (const k of t.keys()) { const v = resolve(k, t), c = parseColor(v); out.set(k, c && c[3] >= 1 ? toHex(c) : v); }
    return out;
  };
  return { al: flat(th.light), ad: flat(th.dark), darkNames: th.darkNames, themes: th };
}

const THEME_TOKENS = /^--(color|hue|shadow|gradient)-/;
function cssBlock(sel, decls, indent = '  ') { return sel + ' {\n' + [...decls].map(([k, v]) => indent + k + ': ' + v + ';').join('\n') + '\n}'; }
const ymd = (now) => now.toISOString().slice(0, 10);
const stamp = (now) => now.toISOString().slice(0, 19) + 'Z';

function build(doc, base, now) {
  const slug = get(doc, 'slug');
  const { al, ad, darkNames } = base;
  const res = {};
  for (const [mode, bm] of [['light', al], ['dark', ad]]) {
    const [m, src] = mappedTokens(doc, mode);
    for (const t of [...m.keys()]) {
      if (t === '--color-overlay') { const a = parseColor(bm.get(t))[3]; m.set(t, rgba(m.get(t), a)); }
    }
    const carried = [];
    if (mode === 'dark') {
      const lm = res.light.mapped;
      for (const [t, L] of [['--color-accent', 0.80], ['--color-text-link', 0.82], ['--color-accent-text', 0.82]]) {
        if (lm.has(t) && !m.has(t) && norm(lm.get(t)) !== norm(al.get(t))) { m.set(t, setL(lm.get(t), Math.max(L, toOklch(lm.get(t))[0]))); carried.push(t); }
      }
    }
    const [vals, der] = derive(mode, m, bm);
    for (const t of carried) { m.delete(t); der.add(t); }
    res[mode] = { values: vals, mapped: m, src, derived: der };
  }
  for (const t of ['--gradient-green', '--gradient-deep', '--gradient-mint', '--gradient-glow']) {
    res.dark.values.set(t, res.light.values.get(t));
    if (res.light.derived.has(t)) res.dark.derived.add(t); else res.dark.derived.delete(t);
  }
  const fonts = fontsOf(doc);
  const lightd = new Map();
  for (const k of al.keys()) if (THEME_TOKENS.test(k) && norm(res.light.values.get(k)) !== norm(al.get(k))) lightd.set(k, res.light.values.get(k));
  for (const [k, v] of fonts.tokens) lightd.set(k, v);
  const darkd = new Map();
  for (const k of ad.keys()) {
    if (!THEME_TOKENS.test(k)) continue;
    const want = res.dark.values.get(k);
    const fallback = lightd.has(k) && !darkNames.has(k) ? lightd.get(k) : ad.get(k);
    if ((lightd.has(k) && darkNames.has(k)) || norm(want) !== norm(fallback)) darkd.set(k, want);
  }
  const name = get(doc, 'name');
  const head = '/* ' + name.split('*/').join('* /') + ' · brand theme for the ANTZ Design System Foundation.\n' +
    '   Generated by tools/import_theme.py from ' + slug + '.antz-theme.json on ' + ymd(now) + '. Do not edit by hand:\n' +
    '   change the theme in the Previewer, export it and import it again.\n' +
    '   Applies with <html data-brand="' + slug + '">; only tokens that differ from ANTZ are listed. */\n';
  const imp = fonts.url ? '@import url("' + fonts.url + '");\n\n' : '';
  const sel = ':root[data-brand="' + slug + '"]';
  let css = imp + head + '\n' + cssBlock(sel, lightd) + '\n\n';
  if (darkd.size) {
    css += '/* Dark: follows the OS unless the page forces light */\n@media (prefers-color-scheme: dark) {\n' +
      cssBlock('  ' + sel + ':not([data-theme="light"])', darkd, '    ').split('\n}').join('\n  }') + '\n}\n' +
      '/* Dark: forced */\n' + cssBlock(sel + '[data-theme="dark"]', darkd) + '\n';
  }
  return { res, fonts, lightd, darkd, css };
}

function contrastRows(res) {
  return PAIRS.map(([fg, bg, kind, use]) => {
    const rs = ['light', 'dark'].map((mode) => {
      try { return pyRound(minRatio(colorsOf(fg, res[mode].values), colorsOf(bg, res[mode].values)), 2); } catch (e) { return null; }
    });
    return { fg, bg, kind, use, light: rs[0], dark: rs[1] };
  });
}

export const KEY_PAIRS = [['--color-text', '--color-bg-app'], ['--color-text', '--color-surface'], ['--color-text-on-accent', '--color-accent'],
  ['--color-text-secondary', '--color-surface'], ['--color-text-link', '--color-surface']];

function report(doc, res, fonts, lightd, darkd, rows, base) {
  const lines = [], p = (s) => { for (const l of String(s).split('\n')) lines.push(l); };
  const cols = or(get(doc, 'colors'), new Map());
  const data = { warnings: [], notes: [], keyPairs: [], belowTarget: [], modes: {} };
  p('Theme "' + get(doc, 'name') + '" (' + get(doc, 'slug') + ')  base: ' + pyStr(get(cols, 'base', 'build')));
  const [used, unknown, catUnknown] = unknownParts(doc);
  for (const mode of ['light', 'dark']) {
    const r = res[mode];
    p('\n' + mode.toUpperCase());
    p('  mapped  (' + r.mapped.size + '): ' + ([...r.mapped.keys()].map((t) => t.slice(2) + '<-' + r.src.get(t).split(' ').slice(1).join(' ')).join(', ') || '-'));
    p('  derived (' + r.derived.size + '): ' + (sortStr([...r.derived].map((t) => t.slice(2))).join(', ') || '-'));
    const nWritten = mode === 'light' ? lightd.size : darkd.size;
    p('  written to the ' + mode + ' block: ' + nWritten + ' tokens; every other token inherits ANTZ');
    data.modes[mode] = { mapped: [...r.mapped.keys()].map((t) => [t, r.src.get(t)]), derived: sortStr([...r.derived]), written: nWritten };
  }
  data.unusedParts = used; data.unknownParts = unknown; data.catalogUnknown = catUnknown;
  if (used.length) p('\nParts with no foundation equivalent (not used): ' + used.join(', '));
  if (unknown.length) p('Unknown part ids (ignored; update PART_MAP): ' + unknown.join(', '));
  if (catUnknown.length) p('Part ids in partCatalog this importer does not know: ' + catUnknown.join(', '));
  const partsOf = (m) => or(get(or(get(cols, 'parts'), new Map()), m), new Map());
  if (['light', 'dark'].some((m) => partsOf(m).has('status'))) {
    const w = 'the Status part sets all four signal colours to one colour, so success, warning, danger and info dots look alike.';
    p('WARNING: ' + w); data.warnings.push(w);
  }
  if (!lightd.has('--color-accent') && !darkd.has('--color-accent')) {
    const w = 'no accent set: buttons, links, the header and the hero keep the ANTZ greens.';
    p('NOTE: ' + w); data.notes.push(w);
  }
  p('\nFONTS  heading: ' + fonts.heading + ' · body: ' + fonts.body);
  if (fonts.url) p('  Google Fonts: ' + fonts.url);
  if (fonts.unused.length) p('  Not used (the foundation has one heading and one body family): ' + fonts.unused.join(', '));
  const antzRows = new Map(evaluateAntz(base.themes).map((x) => [x[0] + ' ' + x[1], x[4]]));
  p('\nCONTRAST (WCAG 2)            light    dark');
  let fails = 0;
  const f52 = (x) => pyFixed(x, 2).padStart(5, ' ');
  for (const [fg, bg] of KEY_PAIRS) {
    const row = rows.find((x) => x.fg === fg && x.bg === bg);
    const vals = [row.light, row.dark];
    const bad = ['light', 'dark'].filter((m, k) => vals[k] !== null && vals[k] < 4.5);
    p('  ' + fg.slice(8).padEnd(24, ' ') + ' on ' + bg.slice(8).padEnd(16, ' ') + ' ' + f52(vals[0]) + '   ' + f52(vals[1]) + '  ' + (bad.length ? 'FAILS AA in ' + bad.join('+') : 'AA'));
    data.keyPairs.push({ fg, bg, light: vals[0], dark: vals[1], bad });
  }
  for (const x of rows) {
    const need = { text: 4.5, ui: 3.0 }[x.kind];
    if (need === undefined) continue;
    const bad = ['light', 'dark'].filter((m) => x[m] !== null && x[m] < need);
    if (bad.length) fails++;
    if (bad.length && !KEY_PAIRS.some(([f, b]) => f === x.fg && b === x.bg)) {
      const ar = antzRows.get(x.fg + ' ' + x.bg);
      const same = !!ar && bad.every((m) => ar[['light', 'dark'].indexOf(m)] < need);
      p('  WARN ' + x.fg + ' on ' + x.bg + ': ' + bad.map((m) => m + ' ' + pyFixed(x[m], 2)).join(', ') + ' (' + x.kind + ' needs ' + pyFixed(need, 1) + ')' + (same ? '  [ANTZ fails this too]' : ''));
      data.belowTarget.push({ fg: x.fg, bg: x.bg, kind: x.kind, need, bad: bad.map((m) => [m, x[m]]), antzToo: same });
    }
  }
  p('  all approved pairs: ' + rows.length + ', below target: ' + fails + ' (warnings only; the import is not blocked)');
  data.pairs = rows.length; data.fails = fails;
  return { lines, data };
}

function summary(res, lightd, darkd) {
  const out = new Map();
  for (const [mode, block] of [['light', lightd], ['dark', darkd]]) {
    const r = res[mode];
    out.set(mode, new Map([['set', sortStr([...r.mapped.keys()])], ['derived', sortStr([...r.derived])], ['written', block.size], ['inherited', 'every other token']]));
  }
  return out;
}

function loadManifest(text) {
  if (text != null) {
    try {
      const m = pyJsonParse(text);
      if (isDict(m) && Array.isArray(get(m, 'themes'))) return m;
    } catch (e) { /* fall through, as the Python does on a broken file */ }
  }
  return new Map([['$description', 'Brands offered by the docs site brand switcher. Written by tools/import_theme.py.'], ['themes', []]]);
}
export const dumpFile = (tree) => pyJsonDump(tree) + '\n';

/**
 * Import one theme. text: the .antz-theme.json text. opts.tokensCss: tokens.css text (required).
 * opts.manifestText: the current themes/index.json text (or null). opts.now: Date (default now).
 * Throws ThemeError with a message like the Python CLI's.
 */
export function importTheme(text, opts) {
  const now = (opts && opts.now) || new Date();
  if (!opts || typeof opts.tokensCss !== 'string') throw new Error('importTheme: tokensCss is required');
  const doc = validate(pyJsonParse(text));
  const base = antzBaseline(opts.tokensCss);
  const { res, fonts, lightd, darkd, css } = build(doc, base, now);
  const rows = contrastRows(res);
  const rep = report(doc, res, fonts, lightd, darkd, rows, base);
  const slug = get(doc, 'slug');
  const manifest = loadManifest(opts.manifestText);
  const entry = new Map([
    ['slug', slug], ['name', get(doc, 'name')], ['createdAt', get(doc, 'createdAt', null)],
    ['importedAt', stamp(now)],
    ['css', 'themes/' + slug + '.css'], ['source', 'themes/' + slug + '.antz-theme.json'],
    ['fonts', new Map([['heading', fonts.heading], ['body', fonts.body], ['url', fonts.url], ['weights', fonts.weights]])],
    ['tokens', summary(res, lightd, darkd)],
    ['contrast', rows.map((r) => new Map([['fg', r.fg], ['bg', r.bg], ['kind', r.kind], ['use', r.use],
      ['light', r.light === null ? null : new PyFloat(r.light)], ['dark', r.dark === null ? null : new PyFloat(r.dark)]]))],
  ]);
  const themes = get(manifest, 'themes');
  const at = themes.findIndex((t) => get(t, 'slug') === slug);
  if (at > -1) themes[at] = entry; else themes.push(entry);
  const written = [
    '',
    (at > -1 ? 'Updated' : 'Wrote') + ' themes/' + slug + '.css (' + lightd.size + ' light, ' + darkd.size + ' dark tokens), themes/' + slug + '.antz-theme.json and themes/index.json.',
    'Preview: python3 -m http.server 8092 --bind 127.0.0.1, then open http://localhost:8092/?brand=' + slug,
  ];
  const valsOf = (mode) => { const o = {}; for (const [k, v] of res[mode].values) o[k] = v; return o; };
  return {
    slug, name: get(doc, 'name'), doc, css,
    sourceText: dumpFile(doc),
    manifestText: dumpFile(manifest),
    entry, entryPlain: toPlain(entry), existing: at > -1,
    report: { lines: rep.lines, writtenLines: written, ...rep.data },
    preview: {
      values: { light: valsOf('light'), dark: valsOf('dark') },
      blocks: { light: Object.fromEntries(lightd), dark: Object.fromEntries(darkd) },
      fonts: { heading: fonts.heading, body: fonts.body, url: fonts.url, unused: fonts.unused, weights: toPlain(fonts.weights) },
      counts: {
        light: { mapped: res.light.mapped.size, derived: res.light.derived.size, written: lightd.size },
        dark: { mapped: res.dark.mapped.size, derived: res.dark.derived.size, written: darkd.size },
      },
      accentSet: lightd.has('--color-accent') || darkd.has('--color-accent'),
      contrast: rows,
    },
  };
}

/* ── Writing into the site folder through a File System Access directory handle (or a mock of one) ── */
async function readText(dir, path) {
  let d = dir; const parts = path.split('/');
  for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p);
  const fh = await d.getFileHandle(parts[parts.length - 1]);
  return (await fh.getFile()).text();
}
async function writeText(dir, name, text) {
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(text); await w.close();
}

/* Is this the design-system-foundation folder? It must hold tokens.css and themes/. */
export async function checkFolder(dir) {
  let tokensCss;
  try { tokensCss = await readText(dir, 'tokens.css'); } catch (e) { throw new ThemeError('That folder has no tokens.css. Pick the design-system-foundation folder itself.'); }
  try { await dir.getDirectoryHandle('themes'); } catch (e) { throw new ThemeError('That folder has no themes/ folder. Pick the design-system-foundation folder itself.'); }
  if (!/--color-accent\s*:/.test(tokensCss)) throw new ThemeError('tokens.css in that folder is not the ANTZ foundation tokens file.');
  return tokensCss;
}

/* Re-run the import against the folder's own tokens.css and themes/index.json and write the three files,
   exactly as `python3 tools/import_theme.py <file>` would. Returns the importTheme() result. */
export async function writeToDirectory(dir, text, opts) {
  const tokensCss = await checkFolder(dir);
  const themes = await dir.getDirectoryHandle('themes');
  let manifestText = null;
  try { manifestText = await readText(themes, 'index.json'); } catch (e) { manifestText = null; }
  const r = importTheme(text, { tokensCss, manifestText, now: (opts && opts.now) || new Date() });
  await writeText(themes, r.slug + '.css', r.css);
  await writeText(themes, r.slug + '.antz-theme.json', r.sourceText);
  await writeText(themes, 'index.json', r.manifestText);
  return r;
}
