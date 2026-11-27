#!/usr/bin/env node
/* ==========================================================================
   Antz Design System · token build
   Reads tokens/src (DTCG 2025.10 JSON), validates it, runs the contrast gate
   and writes every platform output. No dependencies: Node 18+ only.

     node tools/build.mjs            build + gate (fails on any error)
     node tools/build.mjs --check    validate + gate only, write nothing

   Outputs (generated: never edit by hand)
     tokens.css                         designer CSS (drop-in for Foundation v0.2)
     colors.json                        every colour, resolved, per theme
     dist/tokens/antz.tokens.json       all tokens resolved per mode (DTCG)
     dist/tokens/token-index.json       flat index used by the docs and theme tester
     dist/figma/antz.tokens-studio.json token sets with aliases (Tokens Studio / Figma variables)
     dist/mui/antz-mui-theme.js         MUI createTheme options, light and dark
     dist/react-native/antz-theme.ts    React Native theme object
     dist/contrast-report.md            the contrast gate's results
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'tokens/src');
const CHECK_ONLY = process.argv.includes('--check');
const VERSION = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();

const errors = [];
const warn = [];
const read = (rel) => JSON.parse(fs.readFileSync(path.join(SRC, rel), 'utf8'));

// ── Load and flatten ─────────────────────────────────────────────────────
const LAYERS = {
  primitive: ['primitive/color.json'],
  base: ['base/typography.json', 'base/space.json', 'base/shape.json', 'base/motion.json', 'base/layout.json'],
  light: ['theme/light.json'],
  dark: ['theme/dark.json'],
  'hc-light': ['theme/contrast-high.light.json'],
  'hc-dark': ['theme/contrast-high.dark.json'],
  compact: ['theme/density-compact.json'],
};

function flatten(node, trail, file, outMap, inheritedType) {
  const type = node.$type || inheritedType;
  if ('$value' in node) {
    const name = trail.join('.');
    if (outMap.has(name)) errors.push(`${file}: duplicate token ${name}`);
    outMap.set(name, { name, path: trail, type, value: node.$value, desc: node.$description || '', ext: node.$extensions || {}, file });
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === '$root') { flatten(v, trail, file, outMap, type); continue; }
    if (k.startsWith('$')) continue;
    if (/[{}.$]/.test(k)) errors.push(`${file}: illegal character in name "${k}"`);
    if (v && typeof v === 'object') flatten(v, [...trail, k], file, outMap, type);
  }
}
const layer = {};
for (const [id, files] of Object.entries(LAYERS)) {
  layer[id] = new Map();
  for (const f of files) flatten(read(f), [], f, layer[id], undefined);
}

const cssName = (t) => '--' + t.path.join('-');
const REF = /\{([^}]+)\}/g;
const isRef = (v) => typeof v === 'string' && /^\{[^}]+\}$/.test(v);

// ── Validation (governance as code) ──────────────────────────────────────
const brand = layer.primitive.get('green.brand');
if (!brand || brand.value !== '#37BD69') errors.push('FD-001: color primitive green.brand must be exactly #37BD69');
for (const t of layer.primitive.values()) {
  if (typeof t.value === 'string' && REF.test(t.value)) errors.push(`${t.file}: primitive ${t.name} must not reference other tokens`);
  REF.lastIndex = 0;
  if (t.type === 'color' && !/^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(t.value)) errors.push(`${t.file}: ${t.name} must be an uppercase 6 or 8 digit hex (got ${t.value})`);
}
for (const id of ['light', 'dark', 'hc-light', 'hc-dark']) {
  for (const t of layer[id].values()) {
    if (t.type === 'color' && !isRef(t.value)) errors.push(`${t.file}: semantic colour ${t.name} must reference a primitive, not a raw value (${t.value})`);
    if (id !== 'light' && !layer.light.has(t.name)) errors.push(`${t.file}: ${t.name} overrides a token that the light theme does not define`);
    if (t.type === 'gradient' && /#[0-9A-Fa-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/.test(String(t.value).replace(/var\([^)]*\)/g, ""))) errors.push(`${t.file}: gradient ${t.name} must build its colours from primitives (var(--…)); only black, white and transparent may be literal`);
  }
}
for (const t of layer.compact.values()) if (!layer.base.has(t.name)) errors.push(`${t.file}: ${t.name} overrides a token that base does not define`);
const cssNames = new Map();
for (const id of ['primitive', 'base', 'light']) for (const t of layer[id].values()) {
  const n = cssName(t);
  if (cssNames.has(n) && cssNames.get(n) !== t.name) errors.push(`CSS name collision: ${n} (${cssNames.get(n)} and ${t.name})`);
  cssNames.set(n, t.name);
}
const byCss = new Map();

// ── Resolution per mode ──────────────────────────────────────────────────
function modeSet(...ids) { const m = new Map(); for (const id of ids) for (const [k, v] of layer[id]) m.set(k, v); return m; }
const MODES = {
  light: modeSet('primitive', 'base', 'light'),
  dark: modeSet('primitive', 'base', 'light', 'dark'),
  'light-hc': modeSet('primitive', 'base', 'light', 'hc-light'),
  'dark-hc': modeSet('primitive', 'base', 'light', 'dark', 'hc-dark'),
};
// Dark high contrast in CSS also receives the light high-contrast rules (both selectors match), so every token that
// light high contrast changes is re-declared for dark high contrast with its dark value. Then the CSS cascade equals
// the dark-hc mode the contrast gate checks, and nothing set for light high contrast can leak into dark.
const hcDarkCss = new Map(layer['hc-dark']);
for (const [k] of layer['hc-light']) {
  if (hcDarkCss.has(k)) continue;
  const v = MODES['dark-hc'].get(k);
  if (!v) { errors.push(`dark high contrast: ${k} is set for light high contrast but has no dark value`); continue; }
  hcDarkCss.set(k, v);
}
// Guard: what the browser applies in dark high contrast must match what the gate checked.
{
  const cascade = new Map([...MODES.dark, ...layer['hc-light'], ...hcDarkCss]);
  for (const [k, v] of MODES['dark-hc']) if (cascade.get(k) !== v) errors.push(`dark high contrast: CSS cascade differs from the checked mode for ${k}`);
}
for (const t of MODES.light.values()) byCss.set(cssName(t), t.name);

function resolve(set, name, seen = new Set()) {
  const t = set.get(name);
  if (!t) { errors.push(`unresolved reference {${name}}`); return '#000000'; }
  if (seen.has(name)) { errors.push(`circular reference at ${name}`); return '#000000'; }
  seen.add(name);
  let v = t.value;
  if (isRef(v)) return resolve(set, v.slice(1, -1), seen);
  if (typeof v === 'string') {
    v = v.replace(REF, (_, r) => fmt(set.get(r), resolve(set, r, new Set(seen))));
    v = v.replace(/var\((--[a-z0-9-]+)\)/g, (m, n) => (byCss.has(n) ? String(fmtResolved(set, byCss.get(n), seen)) : m));
  }
  return v;
}
function fmtResolved(set, name, seen) { const t = set.get(name); return fmt(t, resolve(set, name, new Set(seen))); }
function fmt(t, v) {
  if (!t) return v;
  if (t.type === 'cubicBezier' && Array.isArray(v)) return `cubic-bezier(${v.join(', ')})`;
  if (t.type === 'fontFamily' && Array.isArray(v)) return v.map((f) => (/\s/.test(f) && !f.startsWith('-') ? `"${f}"` : f)).join(', ');
  return v;
}
const resolved = {};
for (const [m, set] of Object.entries(MODES)) {
  resolved[m] = new Map();
  for (const name of set.keys()) resolved[m].set(name, fmt(set.get(name), resolve(set, name)));
}
for (const t of layer.base.values()) if (t.type === 'color') errors.push(`${t.file}: colours belong in primitive or theme files (${t.name})`);

// ── Contrast gate ────────────────────────────────────────────────────────
function rgb(hex) { const h = hex.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
function lum(hex) { return rgb(hex).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }).reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0); }
function ratio(a, b) { const [x, y] = [lum(a), lum(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
const T = 4.5, U = 3; // text, UI parts and large text
const PAIRS = [
  ['color.text', 'color.surface', T], ['color.text', 'color.bg.app', T], ['color.text.secondary', 'color.surface', T], ['color.text.secondary', 'color.bg.app', T],
  ['color.text.muted', 'color.surface', T], ['color.text.muted', 'color.bg.app', T], ['color.text.muted', 'color.surface.sunken', T], ['color.text.placeholder', 'color.surface', T],
  ['color.text.link', 'color.surface', T], ['color.text.link', 'color.bg.app', T], ['color.accent.text', 'color.surface', T], ['color.accent.text', 'color.accent.soft', T],
  ['color.text.on-accent', 'color.accent', T], ['color.text.on-accent', 'color.accent.hover', T], ['color.text.on-accent', 'color.accent.pressed', T],
  ['color.text.on-bright', 'color.accent.bright', T], ['color.accent.indicator', 'color.surface', U], ['color.accent.on-indicator', 'color.accent.indicator', U], ['color.focus', 'color.surface', U], ['color.focus', 'color.bg.app', U],
  ['color.border.input', 'color.surface', U], ['color.text.on-strong', 'color.surface.strong', T], ['color.text.on-tertiary', 'color.surface.tertiary', T],
  ['color.secondary.on-solid', 'color.secondary.solid', T], ['color.secondary.text', 'color.secondary.soft', T], ['color.secondary.text', 'color.surface', T],
  ['color.tertiary.on-solid', 'color.tertiary.solid', T], ['color.tertiary.text', 'color.tertiary.soft', T], ['color.tertiary.text', 'color.surface', T],
  ...['success', 'warning', 'caution', 'danger', 'info'].flatMap((s) => [[`color.${s}.text`, `color.${s}.bg`, T], [`color.${s}.text`, 'color.surface', T], [`color.${s}.on-solid`, `color.${s}.solid`, T], [`color.signal.${s}`, 'color.surface', U]]),
  ['color.neutral.text', 'color.neutral.bg', T],
  // Peach widget (gradient coral 95 to 80) and maroon hero (coral 10 to 25)
  ['color.peach.text', 'coral.80', T], ['color.peach.caption', 'coral.80', T], ['color.peach.figure', 'coral.80', T], ['color.peach.caption', 'coral.95', T],
  ['color.text.on-strong', 'coral.25', T],
  // New families (DD-006): mint fill (on-bright text), teal fill on lagoon (white), band heroes (white)
  ...['mint.97', 'mint.92', 'mint.88'].map((s) => ['color.text.on-bright', s, T]),
  ...['lagoon.40', 'lagoon.35', 'lagoon.25'].map((s) => ['color.text.on-strong', s, T]),
  ...['lagoon.15', 'lagoon.30', 'wine.10', 'wine.20', 'wine.30', 'bronze.5', 'bronze.15', 'bronze.30', 'sky.40', 'sky.35', 'sky.30', 'green.20', 'green.30', 'green.35'].map((s) => ['color.text.on-strong', s, T]),
  ['color.peach.text', 'coral.border', T], ['color.peach.caption', 'coral.border', T], ['color.peach.figure', 'coral.border', T],
  // Butter widget (amber 95 to 80)
  ['color.butter.text', 'amber.80', T], ['color.butter.caption', 'amber.80', T], ['color.butter.figure', 'amber.80', T], ['color.butter.caption', 'amber.95', T],
  // Module tones (navigation drawer, rail tabs, module band) and launcher tiles (1.2)
  ...['green', 'amber', 'navy', 'slate', 'violet', 'rose', 'coral'].flatMap((t) => [[`color.module.${t}.ink`, `color.module.${t}.ta`, T], [`color.module.${t}.ink`, `color.module.${t}.tb`, T], [`color.module.${t}.ink`, `color.module.${t}.a`, T],
    [`color.text`, `color.module.${t}.a`, T], [`color.text`, `color.module.${t}.b`, T], [`color.text.secondary`, `color.module.${t}.a`, T], [`color.text.secondary`, `color.module.${t}.b`, T]]),
  ...['green', 'amber', 'sky', 'slate', 'coral'].flatMap((t) => [[`color.text.on-strong`, `color.launch.${t}.start`, U], [`color.text.on-strong`, `color.launch.${t}.end`, U]]),
  ...['start', 'mid', 'end'].flatMap((s) => [[`color.text-gradient.${s}`, 'color.surface', U], [`color.text-gradient.${s}`, 'color.bg.app', U]]),
  ['color.figure.warm', 'color.surface.strong', U], ['color.text.on-strong', 'color.surface.strong', T],
  // Stat panels on a wash: figures (large text, 3:1) and labels (4.5:1) on every stop
  ...['mint', 'rose', 'butter', 'aqua', 'sky', 'pink'].flatMap((w) => [['color.accent.text', `gradient-stop.${w}`, U], ['color.text', `gradient-stop.${w}`, T], ['color.text.secondary', `gradient-stop.${w}`, T]]),
  ...['green', 'teal', 'sky', 'coral', 'amber', 'violet', 'navy'].flatMap((h) => [[`hue.${h}.ink`, `hue.${h}.soft`, T], [`hue.${h}`, 'color.surface', U]]),
];
const report = [];
let gateFails = 0;
for (const m of Object.keys(MODES)) {
  for (const [fg, bg, min] of PAIRS) {
    const a = resolved[m].get(fg), b = resolved[m].get(bg);
    if (!a || !b) { errors.push(`contrast pair ${fg} on ${bg}: token missing`); continue; }
    if (a.length !== 7 || b.length !== 7) continue;
    const r = ratio(a, b);
    const ok = r >= min;
    if (!ok) gateFails++;
    report.push({ m, fg, bg, a, b, r, min, ok });
  }
}
for (const x of report.filter((x) => !x.ok)) errors.push(`contrast [${x.m}] ${x.fg} ${x.a} on ${x.bg} ${x.b} = ${x.r.toFixed(2)}:1, needs ${x.min}:1`);

// ── Stop on errors ───────────────────────────────────────────────────────
const summary = `${[...MODES.light.keys()].length} tokens, ${report.length} contrast checks in ${Object.keys(MODES).length} modes`;
if (errors.length) {
  console.error(`\n✗ Token build failed (${errors.length} error${errors.length > 1 ? 's' : ''}):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
for (const w of warn) console.warn('  ! ' + w);
if (CHECK_ONLY) { console.log(`✓ Tokens valid. ${summary}. All pass.`); process.exit(0); }

// ── Writers ──────────────────────────────────────────────────────────────
const write = (rel, text) => { const p = path.join(ROOT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); };
const HEADER = (what) => `Antz Design System ${VERSION} · ${what}\nGenerated by tools/build.mjs from tokens/src. DO NOT EDIT: change tokens/src and run \`node tools/build.mjs\`.`;

function cssValue(t) {
  let v = t.value;
  if (isRef(v)) return `var(${cssName({ path: v.slice(1, -1).split('.') })})`;
  if (typeof v === 'string') v = v.replace(REF, (_, r) => `var(--${r.replace(/\./g, '-')})`);
  return fmt(t, v);
}
function block(map, indent = '  ') {
  let out = '', lastGroup = '';
  for (const t of map.values()) {
    const g = t.path[0];
    if (g !== lastGroup) { out += `\n${indent}/* ${g} */\n`; lastGroup = g; }
    out += `${indent}${cssName(t)}: ${cssValue(t)};\n`;
  }
  return out;
}
const reducedMotion = ['duration.fast', 'duration.base', 'duration.moderate', 'duration.slow', 'duration.slower', 'duration.enter', 'duration.count', 'duration.shimmer', 'duration.spin']
  .map((n) => `--${n.replace('.', '-')}: 0ms;`).join(' ');
const css = `/* ==========================================================================
   ${HEADER('tokens').replace(/\n/g, '\n   ')}

   Layers
     1. Primitives  --{family}-{tone}  (e.g. --green-40, --green-brand). Never use
                    in components or product CSS; they only build semantic tokens.
     2. Base        type, space, radius, size, motion, breakpoints, layers.
     3. Semantic    --color-*, --hue-*, --shadow-*, --gradient-*. Switch with theme.
   Themes
     light (default) · dark: prefers-color-scheme or <html data-theme="dark">
     high contrast: prefers-contrast: more or <html data-contrast="high">
     compact density: <html data-density="compact">
   ========================================================================== */

:root {
  /* ── 1. Primitives ── */${block(layer.primitive)}
  /* ── 2. Base ── */${block(layer.base)}
  /* ── 3. Semantic: light (default) ── */
  color-scheme: light;${block(layer.light)}}

/* Dark: follows the OS unless the page forces light */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;${block(layer.dark, '    ')}  }
}
/* Dark: forced */
:root[data-theme="dark"] {
  color-scheme: dark;${block(layer.dark)}}

/* High contrast, light */
@media (prefers-contrast: more) {
  :root:not([data-contrast="standard"]) {${block(layer['hc-light'], '    ')}  }
}
:root[data-contrast="high"] {${block(layer['hc-light'])}}

/* High contrast, dark */
@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
  :root:not([data-contrast="standard"]):not([data-theme="light"]) {${block(hcDarkCss, '    ')}  }
}
@media (prefers-color-scheme: dark) {
  :root[data-contrast="high"]:not([data-theme="light"]) {${block(hcDarkCss, '    ')}  }
}
:root[data-theme="dark"][data-contrast="high"] {${block(hcDarkCss)}}
/* High contrast, dark: the page forces dark while the OS asks for more contrast */
@media (prefers-contrast: more) {
  :root[data-theme="dark"]:not([data-contrast="standard"]) {${block(hcDarkCss, '    ')}  }
}

/* Module tones: tone gradients re-resolve wherever [data-tone] sets the current tone */
[data-tone] {${block(new Map([...layer.light].filter(([, t]) => t.ext?.['com.antz']?.scope === 'tone')))}}

/* Compact density: data-dense tables and forms */
[data-density="compact"] {${block(layer.compact)}}

/* Reduced motion: every duration and distance drops to zero */
@media (prefers-reduced-motion: reduce) {
  :root { ${reducedMotion} --stagger: 0ms; --motion-lift: 0px; --motion-press: 1; --motion-rise: 0px; }
}
`;
write('tokens.css', css);

// Resolved JSON per mode
function nest(map) {
  const out = {};
  for (const [name, v] of map) {
    const t = MODES.light.get(name) || [...Object.values(MODES)].map((s) => s.get(name)).find(Boolean);
    let o = out; const p = name.split('.');
    for (let i = 0; i < p.length - 1; i++) { if (o[p[i]] && '$value' in o[p[i]]) o[p[i]] = { $root: o[p[i]] }; o = o[p[i]] = o[p[i]] || {}; }
    const leaf = { $type: t.type, $value: v }; if (t.desc) leaf.$description = t.desc;
    if (o[p.at(-1)] && !('$value' in o[p.at(-1)])) o[p.at(-1)].$root = leaf; else o[p.at(-1)] = leaf;
  }
  return out;
}
const modeJson = Object.fromEntries(Object.keys(MODES).map((m) => [m, nest(resolved[m])]));
write('dist/tokens/antz.tokens.json', JSON.stringify({ $description: HEADER('all tokens, resolved per mode (DTCG)'), version: VERSION, modes: modeJson }, null, 2) + '\n');

const index = [...MODES.light.values()].map((t) => ({
  name: t.name, css: cssName(t), type: t.type, tier: layer.primitive.has(t.name) ? 'primitive' : layer.base.has(t.name) ? 'base' : 'semantic',
  description: t.desc, light: resolved.light.get(t.name), dark: resolved.dark.get(t.name), 'light-hc': resolved['light-hc'].get(t.name), 'dark-hc': resolved['dark-hc'].get(t.name),
  ref: isRef(t.value) ? t.value.slice(1, -1) : (layer.dark.get(t.name) ? undefined : undefined), darkRef: layer.dark.get(t.name) && isRef(layer.dark.get(t.name).value) ? layer.dark.get(t.name).value.slice(1, -1) : undefined,
}));
write('dist/tokens/token-index.json', JSON.stringify({ version: VERSION, generated: 'tools/build.mjs', tokens: index }, null, 2) + '\n');
// Same index as a script, so the theme tester also works when opened straight from disk (file://), where fetch is blocked.
write('dist/tokens/token-index.js', `/* ${HEADER('token index for the theme tester').replace(/\n/g, ' ')} */\nwindow.ANTZ_TOKEN_INDEX = ${JSON.stringify({ version: VERSION, tokens: index })};\n`);

// colors.json (kept at the root for continuity with Foundation v0.2)
const colorsOut = { $description: HEADER('every colour token, resolved, per theme'), version: VERSION };
for (const m of Object.keys(MODES)) {
  colorsOut[m] = {};
  for (const t of index.filter((x) => x.type === 'color')) colorsOut[m][t.css.slice(2)] = { $type: 'color', $value: t[m], ...(t.description ? { $description: t.description } : {}) };
}
write('colors.json', JSON.stringify(colorsOut, null, 2) + '\n');

// Tokens Studio / Figma variables: sets keep aliases so Figma variables alias primitives
function rawNest(map) { const o = {}; for (const t of map.values()) { let n = o; t.path.slice(0, -1).forEach((k) => { n = n[k] = n[k] || {}; }); n[t.path.at(-1)] = { $type: t.type === 'cubicBezier' ? 'cubicBezier' : t.type, $value: t.value, ...(t.desc ? { $description: t.desc } : {}) }; } return o; }
const figma = {
  'antz/primitive': rawNest(layer.primitive), 'antz/base': rawNest(layer.base), 'antz/light': rawNest(layer.light), 'antz/dark': rawNest(layer.dark),
  'antz/contrast-high-light': rawNest(layer['hc-light']), 'antz/contrast-high-dark': rawNest(layer['hc-dark']), 'antz/density-compact': rawNest(layer.compact),
  $themes: [
    { id: 'light', name: 'Light', group: 'Mode', selectedTokenSets: { 'antz/primitive': 'source', 'antz/base': 'enabled', 'antz/light': 'enabled' } },
    { id: 'dark', name: 'Dark', group: 'Mode', selectedTokenSets: { 'antz/primitive': 'source', 'antz/base': 'enabled', 'antz/light': 'enabled', 'antz/dark': 'enabled' } },
    { id: 'light-hc', name: 'Light high contrast', group: 'Mode', selectedTokenSets: { 'antz/primitive': 'source', 'antz/base': 'enabled', 'antz/light': 'enabled', 'antz/contrast-high-light': 'enabled' } },
    { id: 'dark-hc', name: 'Dark high contrast', group: 'Mode', selectedTokenSets: { 'antz/primitive': 'source', 'antz/base': 'enabled', 'antz/light': 'enabled', 'antz/dark': 'enabled', 'antz/contrast-high-dark': 'enabled' } },
  ],
  $metadata: { tokenSetOrder: ['antz/primitive', 'antz/base', 'antz/light', 'antz/dark', 'antz/contrast-high-light', 'antz/contrast-high-dark', 'antz/density-compact'], antzVersion: VERSION },
};
write('dist/figma/antz.tokens-studio.json', JSON.stringify(figma, null, 2) + '\n');

// Colour scales (ANTZ Design Library): { primary: { 50: '#…', … }, … } for MUI and React Native
const SCALES = {};
for (const t of layer.primitive.values()) { if (t.path[0] !== 'scale' || t.type !== 'color') continue; ((SCALES[t.path[1]] ||= {}))[t.path[2]] = t.value; }

// MUI theme options
const R = (m, n) => resolved[m].get(n);
const px = (v) => parseFloat(v);
const ms = (v) => parseFloat(v);
function mui(m) {
  return {
    palette: {
      mode: m.startsWith('dark') ? 'dark' : 'light',
      primary: { main: R(m, 'color.accent'), dark: R(m, 'color.accent.pressed'), light: R(m, 'color.accent.bright'), contrastText: R(m, 'color.text.on-accent') },
      secondary: { main: R(m, 'color.secondary.solid'), contrastText: R(m, 'color.secondary.on-solid') },
      error: { main: R(m, 'color.danger.solid'), contrastText: R(m, 'color.danger.on-solid') },
      warning: { main: R(m, 'color.warning.solid'), contrastText: R(m, 'color.warning.on-solid') },
      info: { main: R(m, 'color.info.solid'), contrastText: R(m, 'color.info.on-solid') },
      success: { main: R(m, 'color.success.solid'), contrastText: R(m, 'color.success.on-solid') },
      text: { primary: R(m, 'color.text'), secondary: R(m, 'color.text.secondary'), disabled: R(m, 'color.text.disabled') },
      background: { default: R(m, 'color.bg.app'), paper: R(m, 'color.surface') },
      divider: R(m, 'color.border'),
      action: { hover: R(m, 'color.surface.hover'), selected: R(m, 'color.surface.selected'), disabledBackground: R(m, 'color.disabled-bg'), disabled: R(m, 'color.text.disabled') },
      antz: { scale: SCALES, brand: R(m, 'color.brand.primary'), brandText: R(m, 'color.accent.text'), focus: R(m, 'color.focus'), tertiary: R(m, 'color.tertiary.solid'), caution: R(m, 'color.caution.solid'), board: R(m, 'color.bg.app') },
    },
    typography: {
      fontFamily: R(m, 'font.body'), fontSize: px(R(m, 'text.md')),
      fontWeightLight: 300, fontWeightRegular: 400, fontWeightMedium: 500, fontWeightBold: 600,
      h4: { fontSize: px(R(m, 'text.4xl')), fontWeight: 600, letterSpacing: R(m, 'tracking.heading') },
      h5: { fontSize: px(R(m, 'text.3xl')), fontWeight: 600, letterSpacing: R(m, 'tracking.heading') },
      h6: { fontSize: px(R(m, 'text.2xl')), fontWeight: 600 },
      subtitle1: { fontSize: px(R(m, 'text.lg')), fontWeight: 600 },
      body1: { fontSize: px(R(m, 'text.lg')) }, body2: { fontSize: px(R(m, 'text.md')) },
      button: { fontSize: px(R(m, 'text.md')), fontWeight: 600, textTransform: 'none' },
      caption: { fontSize: px(R(m, 'text.xs')) }, overline: { fontSize: px(R(m, 'text.2xs')), fontWeight: 600, letterSpacing: R(m, 'tracking.overline') },
    },
    shape: { borderRadius: px(R(m, 'radius.control')) },
    transitions: {
      easing: { easeInOut: R(m, 'ease.standard'), easeOut: R(m, 'ease.out'), easeIn: R(m, 'ease.exit'), sharp: R(m, 'ease.in-out') },
      duration: { shortest: ms(R(m, 'duration.instant')), shorter: ms(R(m, 'duration.fast')), short: ms(R(m, 'duration.base')), standard: ms(R(m, 'duration.moderate')), complex: ms(R(m, 'duration.slow')), enteringScreen: ms(R(m, 'duration.moderate')), leavingScreen: ms(R(m, 'duration.fast')) },
    },
    components: {
      MuiButton: { styleOverrides: { root: { borderRadius: px(R(m, 'radius.control')), boxShadow: 'none' }, containedPrimary: { color: R(m, 'color.text.on-accent'), '&:hover': { backgroundColor: R(m, 'color.accent.hover'), boxShadow: 'none' } }, outlinedPrimary: { color: R(m, 'color.accent.text'), borderColor: R(m, 'color.accent.text') }, textPrimary: { color: R(m, 'color.accent.text') } } },
      MuiCard: { styleOverrides: { root: { borderRadius: px(R(m, 'radius.lg')) } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: px(R(m, 'radius.xl')) } } },
      MuiOutlinedInput: { styleOverrides: { notchedOutline: { borderColor: R(m, 'color.border.input') } } },
      MuiLink: { styleOverrides: { root: { color: R(m, 'color.text.link') } } },
      MuiSwitch: { styleOverrides: { switchBase: { '&.Mui-checked + .MuiSwitch-track': { backgroundColor: R(m, 'color.accent.indicator'), opacity: 1 } } } },
      MuiCheckbox: { styleOverrides: { root: { '&.Mui-checked': { color: R(m, 'color.accent.indicator') } } } },
      MuiTabs: { styleOverrides: { indicator: { backgroundColor: R(m, 'color.accent.indicator') } } },
    },
  };
}
const muiSrc = `/**
 * ${HEADER('MUI theme options').replace(/\n/g, '\n * ')}
 *
 * Usage (Next.js + MUI v5/v6):
 *   import { createTheme } from '@mui/material/styles';
 *   import { antzLight, antzDark } from '@antz/design-tokens/mui';
 *   const theme = createTheme(prefersDark ? antzDark : antzLight);
 *
 * Breakpoints are deliberately not overridden: the dashboard keeps MUI's defaults.
 * palette.antz.scale holds the colour scales (palette.antz.scale.primary[600]); use them for illustration and data, not for components.
 * palette.antz carries Antz-only roles (brand, brandText, focus, tertiary, caution, board).
 */
export const antzVersion = ${JSON.stringify(VERSION)};
export const antzLight = ${JSON.stringify(mui('light'), null, 2)};
export const antzDark = ${JSON.stringify(mui('dark'), null, 2)};
export const antzLightHighContrast = ${JSON.stringify(mui('light-hc'), null, 2)};
export const antzDarkHighContrast = ${JSON.stringify(mui('dark-hc'), null, 2)};
export function antzThemeOptions({ mode = 'light', contrast = 'standard' } = {}) {
  if (mode === 'dark') return contrast === 'high' ? antzDarkHighContrast : antzDark;
  return contrast === 'high' ? antzLightHighContrast : antzLight;
}
`;
write('dist/mui/antz-mui-theme.js', muiSrc);

// React Native theme
const camel = (s) => s.replace(/[-.]([a-z0-9])/g, (_, c) => c.toUpperCase());
function rnColors(m) { const o = {}; for (const t of index) if (t.type === 'color' && t.tier === 'semantic') o[camel(t.name.replace(/^color\./, ''))] = resolved[m].get(t.name); return o; }
const scale = (prefix) => Object.fromEntries(index.filter((t) => t.name.startsWith(prefix + '.')).map((t) => [t.name.slice(prefix.length + 1), px(t.light)]).filter(([, v]) => !Number.isNaN(v)));
// React Native extras: shadows, gradients, type rhythm and colour roles, per colour scheme
const RN_SCHEMES = { light: 'light', dark: 'dark', lightHighContrast: 'light-hc', darkHighContrast: 'dark-hc' };
const splitTop = (v) => { const out = []; let d = 0, cur = ''; for (const ch of String(v)) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
function rnShadow(v) {
  if (!v || v === 'none') return { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 };
  const layers = splitTop(v).filter((l) => !/^inset\b/.test(l)).map((l) => { const color = (l.match(/rgba?\([^)]*\)|#[0-9A-Fa-f]{3,8}/) || ['rgba(0, 0, 0, 0.2)'])[0]; const n = l.replace(color, '').trim().split(/\s+/).map(parseFloat); return { x: n[0] || 0, y: n[1] || 0, blur: n[2] || 0, color }; });
  if (!layers.length) return null;
  const big = layers.reduce((a, b) => (b.blur > a.blur ? b : a)); // React Native draws one shadow: keep the softest, largest layer
  return { shadowColor: big.color, shadowOffset: { width: big.x, height: big.y }, shadowOpacity: 1, shadowRadius: Math.round(big.blur / 2), elevation: Math.min(24, Math.round(big.blur / 3)) };
}
function rnGradient(v) {
  const s = String(v).trim(); const m = /^linear-gradient\((.*)\)$/.exec(s);
  if (!m || splitTop(s).length > 1) return null; // radial and layered gradients have no faithful React Native form
  const parts = splitTop(m[1]); let angle = 180;
  if (/^-?[\d.]+deg$/.test(parts[0])) angle = parseFloat(parts.shift()); else if (/^to /.test(parts[0])) { const dir = parts.shift(); angle = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }[dir] ?? 180; }
  const stops = parts.map((p) => { const c = (p.match(/^(rgba?\([^)]*\)|#[0-9A-Fa-f]{3,8}|transparent)/) || [])[0]; const pos = (p.slice(c ? c.length : 0).match(/(-?[\d.]+)%/) || [])[1]; return { c, pos: pos === undefined ? null : parseFloat(pos) / 100 }; });
  if (stops.some((x) => !x.c)) return null;
  const locations = stops.map((x, i) => (x.pos ?? (stops.length === 1 ? 0 : i / (stops.length - 1))));
  const r = (angle * Math.PI) / 180, dx = Math.sin(r) / 2, dy = -Math.cos(r) / 2, f = (n) => Math.round(n * 1000) / 1000;
  return { colors: stops.map((x) => (x.c === 'transparent' ? 'rgba(0, 0, 0, 0)' : x.c)), locations: locations.map(f), start: { x: f(0.5 - dx), y: f(0.5 - dy) }, end: { x: f(0.5 + dx), y: f(0.5 + dy) }, angle };
}
const rnShadows = {}, rnGradients = {}, rnWebOnly = new Set();
for (const [k, m] of Object.entries(RN_SCHEMES)) {
  rnShadows[k] = {}; rnGradients[k] = {};
  for (const t of index) {
    if (t.type === 'shadow') { const sh = rnShadow(R(m, t.name)); if (sh) rnShadows[k][camel(t.name.replace(/^shadow\./, ''))] = sh; }
    if (t.type === 'gradient' && t.name.startsWith('gradient.')) { const g = rnGradient(R(m, t.name)); const key = camel(t.name.slice(9)); if (g) rnGradients[k][key] = g; else rnWebOnly.add(key); }
  }
}
for (const k of Object.keys(RN_SCHEMES)) for (const key of [...rnWebOnly]) if (rnGradients[k][key]) rnWebOnly.delete(key);
function rnRoles(cs) {
  const st = (n, dot) => ({ bg: cs[n + 'Bg'], text: cs[n + 'Text'], dot: cs[dot] });
  const hue = (h) => ({ text: cs['hue' + h + 'Ink'], bg: cs['hue' + h + 'Soft'], solid: cs['hue' + h + 'Ink'], onSolid: cs.surface });
  return {
    status: { success: st('success', 'signalSuccess'), warning: st('warning', 'signalWarning'), caution: st('caution', 'signalCaution'), danger: st('danger', 'signalDanger'), info: st('info', 'signalInfo'), neutral: { bg: cs.neutralBg, text: cs.neutralText, dot: cs.neutralText } },
    priority: { urgent: { bg: cs.dangerBg, text: cs.dangerText }, high: { bg: cs.warningBg, text: cs.warningText }, info: { bg: cs.infoBg, text: cs.infoText }, plain: { bg: cs.tertiarySoft, text: cs.tertiaryText } },
    sex: { M: hue('Sky'), F: hue('Coral'), UD: hue('Amber'), ID: hue('Teal'), G: hue('Navy') },
    // DD-009: tag chip, on the priority picker's scale (no priority, Normal, High, Critical)
    tagChip: { none: { bg: cs.neutralBg, text: cs.neutralText }, normal: { bg: cs.infoBg, text: cs.infoText }, high: { bg: cs.cautionBg, text: cs.cautionText }, critical: { bg: cs.dangerBg, text: cs.dangerText } },
  };
}
const rn = {
  version: VERSION,
  colors: { light: rnColors('light'), dark: rnColors('dark'), lightHighContrast: rnColors('light-hc'), darkHighContrast: rnColors('dark-hc') },
  roles: Object.fromEntries(Object.entries(RN_SCHEMES).map(([k, m]) => [k, rnRoles(rnColors(m))])), // status pill, priority tag, sex tag and tag chip colour pairs
  scale: SCALES, // colour scales: antzTheme.scale.primary[600]
  space: scale('space'), radius: scale('radius'), fontSize: scale('text'),
  fontFamily: { body: 'Inter', heading: 'Inter', mono: 'Menlo' },
  fontWeight: { light: '300', regular: '400', medium: '500', semibold: '600', bold: '700' },
  size: scale('size'),
  lineHeight: Object.fromEntries(index.filter((t) => t.name.startsWith('leading.')).map((t) => [t.name.slice(8), Number(R('light', t.name))])), // multiply by the font size
  letterSpacing: Object.fromEntries(index.filter((t) => t.name.startsWith('tracking.')).map((t) => [t.name.slice(9), parseFloat(R('light', t.name))])), // em: multiply by the font size
  shadow: rnShadows, // spread on a View: { ...antzTheme.shadow.light.md }
  gradient: rnGradients, // expo-linear-gradient: <LinearGradient {...antzTheme.gradient.light.green} />
  gradientWebOnly: [...rnWebOnly].sort(), // radial or layered on the web: no faithful React Native form
  motion: {
    duration: Object.fromEntries(index.filter((t) => t.name.startsWith('duration.')).map((t) => [t.name.slice(9), ms(t.light)])),
    easing: Object.fromEntries([...layer.base.values()].filter((t) => t.type === 'cubicBezier').map((t) => { let v = t.value; for (let i = 0; i < 5 && typeof v === 'string'; i++) { const ref = /^\{(.+)\}$/.exec(v); v = ref ? layer.base.get(ref[1])?.value : v; } return [camel(t.name.slice(5)), v]; })), // aliases such as move = {ease.elastic} resolve to the curve
    stagger: ms(R('light', 'stagger')), lift: px(R('light', 'motion.lift')), press: Number(R('light', 'motion.press')), rise: px(R('light', 'motion.rise')),
  },
};
const rnSrc = `/**
 * ${HEADER('React Native theme').replace(/\n/g, '\n * ')}
 *
 * Usage:
 *   import { antzTheme } from '@antz/design-system/react-native';
 *   const scheme = useColorScheme();
 *   const c = antzTheme.colors[scheme === 'dark' ? 'dark' : 'light'];
 *   <Pressable style={{ backgroundColor: c.accent, borderRadius: antzTheme.radius.control }}>
 *     <Text style={{ color: c.textOnAccent }}>Save</Text>
 *   </Pressable>
 * Easing arrays plug into Reanimated: Easing.bezier(...antzTheme.motion.easing.standard).
 * Respect AccessibilityInfo.isReduceMotionEnabled(): use duration 0 when it is on.
 */
export const antzTheme = ${JSON.stringify(rn, null, 2)} as const;
export type AntzColorScheme = keyof typeof antzTheme.colors;
export type AntzColors = typeof antzTheme.colors.light;
export default antzTheme;
`;
if (/"\{[a-z0-9.-]+\}"/.test(rnSrc)) { console.error('✗ React Native theme: an unresolved token reference was exported (' + rnSrc.match(/"\{[a-z0-9.-]+\}"/)[0] + ')'); process.exit(1); }
write('dist/react-native/antz-theme.ts', rnSrc);
const rnJson = JSON.stringify(rn, null, 2);
write('dist/react-native/antz-theme.js', `/* ${HEADER('React Native theme (JavaScript)')} */\nexport const antzTheme = ${rnJson};\nexport default antzTheme;\n`);
write('dist/react-native/antz-theme.d.ts', `/* ${HEADER('React Native theme types')} */\nexport declare const antzTheme: ${rnJson};\nexport type AntzTheme = typeof antzTheme;\nexport type AntzColorScheme = keyof typeof antzTheme.colors;\nexport type AntzColors = typeof antzTheme.colors.light;\nexport default antzTheme;\n`);
// package.json: install a pinned release straight from git, e.g. npm i github:eugin-cmd/Antz-Design-System#v1.2.0-beta.6
write('package.json', JSON.stringify({
  name: '@antz/design-system', version: VERSION, private: true,
  description: 'Antz Design System: tokens, CSS components and the MUI and React Native themes. Generated by tools/build.mjs; do not edit.',
  license: 'UNLICENSED', type: 'module',
  exports: {
    './react-native': { types: './dist/react-native/antz-theme.d.ts', default: './dist/react-native/antz-theme.js' },
    './mui': './dist/mui/antz-mui-theme.js',
    './tokens.json': './dist/tokens/antz.tokens.json',
    './tokens.css': './tokens.css', './components.css': './components.css', './components.js': './components.js',
    './package.json': './package.json',
  },
  'react-native': './dist/react-native/antz-theme.js',
  files: ['dist', 'tokens.css', 'components.css', 'components.js', 'colors.json'],
  sideEffects: ['*.css', './components.js'],
}, null, 2) + '\n');

// Contrast report
let md = `# Contrast report\n\n${HEADER('contrast gate').replace(/\n/g, '  \n')}\n\nText needs 4.5:1; UI parts and large text need 3:1. ${report.length} checks, ${gateFails} failures.\n`;
for (const m of Object.keys(MODES)) {
  md += `\n## ${m}\n\n| Foreground | Background | Ratio | Needs | Result |\n|---|---|---|---|---|\n`;
  for (const x of report.filter((r) => r.m === m)) md += `| \`${x.fg}\` ${x.a} | \`${x.bg}\` ${x.b} | ${x.r.toFixed(2)}:1 | ${x.min}:1 | ${x.ok ? 'Pass' : '**Fail**'} |\n`;
}
write('dist/contrast-report.md', md);

// Docs: the contrast table on Colour guardrails is generated from the gate, so it can't drift.
const guardPage = path.join(ROOT, 'pages/colour-guardrails.html');
if (fs.existsSync(guardPage)) {
  const css = (n) => '--' + n.replace(/\./g, '-');
  const use = (fg, bg) => (MODES.light.get(fg)?.desc || MODES.light.get(bg)?.desc || '').replace(/</g, '&lt;');
  const chips = (r, min) => (min === U ? [['UI 3:1', r >= 3]] : [['AA', r >= 4.5], ['AA large', r >= 3]]).map(([l, ok]) => `<span class="${ok ? 'pass' : 'fail'}">${l}</span>`).join(' ');
  const rows = PAIRS.map(([fg, bg, min]) => {
    const l = report.find((x) => x.m === 'light' && x.fg === fg && x.bg === bg), d = report.find((x) => x.m === 'dark' && x.fg === fg && x.bg === bg);
    if (!l || !d) return '';
    const sample = min === U ? `<span class="aa-sample" style="background:var(${css(bg)});box-shadow:inset 0 0 0 3px var(${css(fg)});color:var(--color-text)">UI</span>` : `<span class="aa-sample" style="background:var(${css(bg)});color:var(${css(fg)})">Aa</span>`;
    return `<tr><td>${sample}</td><td><code>${css(fg)}</code> on <code>${css(bg)}</code><br><span class="t-caption">${use(fg, bg)}</span></td><td class="num"><b>${l.r.toFixed(2)}</b></td><td>${chips(l.r, min)}</td><td class="num"><b>${d.r.toFixed(2)}</b></td><td>${chips(d.r, min)}</td></tr>`;
  }).join('\n');
  const page = fs.readFileSync(guardPage, 'utf8').replace(/<!-- contrast-pairs:start -->[\s\S]*?<!-- contrast-pairs:end -->/, `<!-- contrast-pairs:start -->\n${rows}\n<!-- contrast-pairs:end -->`);
  fs.writeFileSync(guardPage, page);
}

// Docs: the Colour scales grid is generated from the scale primitives, so it can't drift.
const scalesPage = path.join(ROOT, 'docs-src/colour-scales.html');
if (fs.existsSync(scalesPage)) {
  const FAM = { primary: 'Primary', secondary: 'Secondary', tertiary: 'Tertiary', error: 'Error', neutral: 'Neutral', 'neutral-variant': 'Neutral variant', success: 'Success', warning: 'Warning', caution: 'Caution', info: 'Info' };
  const ink = resolved.light.get('color.text');
  const grid = Object.entries(SCALES).map(([fam, steps]) => {
    const sw = Object.entries(steps).map(([st, hex]) => {
      const w = ratio('#FFFFFF', hex), k = ratio(ink, hex), white = w >= k;
      const label = (white ? w : k) >= 4.5 ? `${white ? 'White' : 'Ink'} ${(white ? w : k).toFixed(1)}` : `Large ${(white ? w : k).toFixed(1)}`;
      return `<figure class="scale__sw${st === '500' ? ' is-base' : ''}" title="--scale-${fam}-${st}"><span style="background:var(--scale-${fam}-${st})"></span><figcaption><b>${st}${st === '500' ? ' · base' : ''}</b><code>${hex}</code><small>${label}</small></figcaption></figure>`;
    }).join('');
    return `<div class="scale"><div class="scale__head"><b>${FAM[fam] || fam}</b><code>--scale-${fam}-50 … 950</code></div><div class="scale__row">${sw}</div></div>`;
  }).join('\n');
  const src = fs.readFileSync(scalesPage, 'utf8').replace(/<!-- colour-scales:start -->[\s\S]*?<!-- colour-scales:end -->/, `<!-- colour-scales:start -->\n<div class="scales">\n${grid}\n</div>\n<!-- colour-scales:end -->`);
  fs.writeFileSync(scalesPage, src);
}

console.log(`✓ Antz Design System ${VERSION} built. ${summary}. All pass.`);
console.log('  tokens.css, colors.json, dist/tokens, dist/figma, dist/mui, dist/react-native, dist/contrast-report.md');
