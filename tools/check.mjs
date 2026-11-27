#!/usr/bin/env node
/* ==========================================================================
   Antz Design System · guardrail check
   Scans designer and product files (CSS, HTML, JS/TS/JSX/TSX) for breaks of
   the rules in governance/rules.json. No dependencies: Node 18+ only.
   In JS/TS it also reads style objects: MUI sx={{…}} and style={{…}},
   styled(…)({…}) and React Native StyleSheet.create({…}). Values that come
   from the theme (theme.…, antzTheme.…) or tokens (var(--…)) pass.
   Deprecated names (governance/deprecations.json) are reported as warnings.

     node tools/check.mjs <file-or-folder> [...]   check these paths
     node tools/check.mjs                          check this repo's system files
     node tools/check.mjs --report <path>          report only: list, never fail
     node tools/check.mjs --json <path>            machine-readable output

   Exit code 1 when any error remains (expired exceptions count as errors).
   Live exceptions in governance/exceptions.json silence named rules for
   named files until they expire.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const REPORT = args.includes('--report');
const JSON_OUT = args.includes('--json');
const targets = args.filter((a) => !a.startsWith('--'));
const DEFAULT_TARGETS = ['components.css', 'components.js'];

const rules = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, 'governance/rules.json'), 'utf8')).rules.map((r) => [r.id, r]));
const exceptions = JSON.parse(fs.readFileSync(path.join(ROOT, 'governance/exceptions.json'), 'utf8')).exceptions;
const today = new Date().toISOString().slice(0, 10);
const DEP_FILE = path.join(ROOT, 'governance/deprecations.json');
const deprecations = fs.existsSync(DEP_FILE) ? JSON.parse(fs.readFileSync(DEP_FILE, 'utf8')).deprecated : [];

// Token knowledge comes from the generated index, so the checker always matches the build.
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist/tokens/token-index.json'), 'utf8')).tokens;
const known = new Set(index.map((t) => t.css));
const primitive = new Set(index.filter((t) => t.tier === 'primitive').map((t) => t.css));

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'releases', '.next', 'build', 'coverage']);
const EXT = /\.(css|scss|html?|jsx?|tsx?|mjs|vue|svelte)$/i;
function walk(p, out) {
  const st = fs.statSync(p);
  if (st.isDirectory()) { for (const n of fs.readdirSync(p)) if (!SKIP_DIRS.has(n) && !n.startsWith('.')) walk(path.join(p, n), out); }
  else if (EXT.test(p) && !/(^|\/)tokens\.css$/.test(p) && !/\.min\./.test(p)) out.push(p);
  return out;
}
const files = (targets.length ? targets : DEFAULT_TARGETS.map((t) => path.join(ROOT, t))).flatMap((t) => walk(path.resolve(t), []));

const findings = [];
const add = (file, line, rule, msg, snippet) => findings.push({ file: path.relative(process.cwd(), file) || file, line, rule, severity: rules[rule]?.severity || 'error', msg, snippet: snippet.trim().slice(0, 140) });

function exceptionFor(file, rule) {
  // Exceptions name files relative to this repository; they never cover files elsewhere.
  const rel = path.relative(ROOT, path.resolve(file));
  if (rel.startsWith('..') || path.isAbsolute(rel)) return undefined;
  return exceptions.find((e) => e.rules.includes(rule) && e.files.includes(rel));
}

// Extract CSS-ish text with line numbers: whole CSS files, <style> blocks, style="" attributes, and style objects/strings in JS.
function cssChunks(text, kind) {
  if (kind === 'css') return [{ text, offset: 0 }];
  const chunks = [];
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) chunks.push({ text: m[1], offset: m.index + m[0].indexOf(m[1]) });
  for (const m of text.matchAll(/style\s*=\s*"([^"]*)"/gi)) chunks.push({ text: m[1], offset: m.index });
  for (const m of text.matchAll(/style\s*=\s*'([^']*)'/gi)) chunks.push({ text: m[1], offset: m.index });
  if (kind === 'js') for (const m of text.matchAll(/(?:css|styled\.[a-z]+|createGlobalStyle|keyframes)`([\s\S]*?)`/g)) chunks.push({ text: m[1], offset: m.index });
  return chunks;
}
const lineAt = (text, i) => text.slice(0, i).split('\n').length;

const TOKEN_NS = /^--(color|space|text|radius|shadow|duration|ease|gradient|hue|font|weight|size|z|bp|leading|tracking|motion|stagger|wash|green|teal|navy|ink|night|red|coral|amber|sky|olive|violet|board|alpha)-/;
const PX_OK = new Set(['0', '0px', '1px', 'auto', 'inherit', 'initial', 'unset', '100%', '50%']);
function checkCss(file, full, chunk) {
  const t = chunk.text;
  const declRe = /([a-z-]+)\s*:\s*([^;{}]+)/gi;
  for (const m of t.matchAll(declRe)) {
    const prop = m[1].toLowerCase(); const val = m[2].trim(); const at = chunk.offset + m.index; const line = lineAt(full, at); const snip = `${prop}: ${val}`;
    if (prop.startsWith('--')) { /* custom property definitions are checked through their values below */ }
    // retired brand values
    if (/#(52F990|38BD69|36BC69)\b/i.test(val)) add(file, line, 'ANTZ-COL-03', 'Retired brand colour', snip);
    // raw colours
    else if (/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/i.test(val.replace(/url\([^)]*\)/g, '')) && !/^--/.test(prop)) add(file, line, 'ANTZ-COL-01', 'Raw colour: use a semantic --color-* token', snip);
    // gradients
    if (/(linear|radial|conic)-gradient\(/i.test(val) && !/var\(--gradient-/.test(val)) add(file, line, 'ANTZ-GRD-01', 'Ad hoc gradient: use a --gradient-* token', snip);
    // brand green as text
    if (/^(color|fill|stroke|-webkit-text-fill-color|text-decoration-color|caret-color)$/.test(prop) && /var\(--color-accent\)|var\(--color-brand-primary\)/.test(val)) add(file, line, 'ANTZ-COL-02', 'Brand fill used as text or line: use --color-accent-text (text) or --color-accent-indicator (lines)', snip);
    if (/^(outline|outline-color|border|border-color|border-(top|bottom|left|right)(-color)?)$/.test(prop) && /var\(--color-accent\)/.test(val)) add(file, line, 'ANTZ-COL-02', 'Brand fill used as a line: use --color-accent-indicator or --color-focus', snip);
    // tokens: primitive or invented
    for (const v of val.matchAll(/var\((--[a-z0-9-]+)/gi)) {
      const name = v[1];
      if (primitive.has(name)) add(file, line, 'ANTZ-TOK-01', `Primitive token ${name}: use a semantic token`, snip);
      else if (!known.has(name) && !localProps.has(name)) {
        // var(--slot, fallback) is a component slot set from markup; allowed outside the token namespaces.
        const hasFallback = new RegExp(name.replace(/[-]/g, '\\-') + '\\s*,').test(val);
        if (!(hasFallback && !TOKEN_NS.test(name))) add(file, line, 'ANTZ-TOK-02', `Unknown token ${name}: not defined in tokens.css`, snip);
      }
    }
    // type
    if (prop === 'font-size' && /\d(px|rem|em|pt)\b/.test(val) && !/var\(--text-/.test(val)) add(file, line, 'ANTZ-TYP-01', 'Literal font size: use --text-*', snip);
    if (prop === 'font-family' && !/var\(--font-(body|heading|mono)\)|inherit|initial/.test(val)) add(file, line, 'ANTZ-TYP-02', 'Unapproved font: use var(--font-body | --font-heading | --font-mono)', snip);
    if (prop === 'font' && /\d(px|rem)/.test(val) && !/var\(--text-/.test(val)) add(file, line, 'ANTZ-TYP-01', 'Literal font shorthand size: use --text-*', snip);
    if (prop === 'font-weight' && /^\d{3}$/.test(val)) add(file, line, 'ANTZ-TYP-03', 'Literal font weight: use --weight-*', snip);
    // spacing
    if (/^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left|margin-(top|bottom|left|right|inline|block)(-start|-end)?|padding-(top|bottom|left|right|inline|block)(-start|-end)?)$/.test(prop)) {
      for (const n of val.replace(/var\([^)]*\)|calc\([^)]*\)/g, ' ').split(/\s+/)) if (/^-?\d+(\.\d+)?px$/.test(n) && !PX_OK.has(n.replace('-', ''))) { add(file, line, 'ANTZ-SPC-01', `Literal spacing ${n}: use --space-*`, snip); break; }
    }
    if (/^border(-[a-z-]+)?-radius$/.test(prop) && /\d+px/.test(val) && !/var\(--radius-/.test(val)) add(file, line, 'ANTZ-SHP-01', 'Literal radius: use --radius-*', snip);
    if (prop === 'box-shadow' && !/var\(--shadow-/.test(val)) {
      // Elevation = a blurred shadow. Rings and hairlines (blur 0, token colour) are borders, not elevation.
      const blurred = val.replace(/var\([^)]*\)/g, 'C').split(',').some((sh) => { const n = sh.match(/-?\d*\.?\d+px|\b0\b/g) || []; return n.length >= 3 && parseFloat(n[2]) > 0; });
      if (blurred) add(file, line, 'ANTZ-ELV-01', 'Literal shadow: use --shadow-*', snip);
    }
    // motion
    if (/^(transition|transition-duration|transition-timing-function|animation|animation-duration|animation-timing-function|animation-delay|transition-delay)$/.test(prop)) {
      const bare = val.replace(/var\([^)]*\)|calc\([^)]*\)/g, ' ');
      if (/\b\d+(\.\d+)?m?s\b/.test(bare)) add(file, line, 'ANTZ-MOT-01', 'Literal duration: use --duration-*', snip);
      else if (/cubic-bezier\(|\bease(-in|-out|-in-out)?\b|\blinear\b(?!-)/.test(bare) && !/infinite|steps/.test(bare)) add(file, line, 'ANTZ-MOT-01', 'Literal easing: use --ease-*', snip);
    }
    // focus
    if (prop === 'outline' && /^(none|0)\b/.test(val) && !/focus-replaced/.test(t.slice(m.index, t.indexOf('\n', m.index) + 1 || undefined))) {
      const rule = t.slice(t.lastIndexOf('{', m.index) + 1, t.indexOf('}', m.index));
      if (!/box-shadow|border-color|outline-offset/.test(rule.replace(m[0], ''))) add(file, line, 'ANTZ-A11Y-01', 'Focus outline removed without a visible replacement', snip);
    }
  }
}
// ── Style objects in JS/TS (MUI sx, style props, styled(...)({...}), React Native StyleSheet) ──
// Each literal "key: value" inside such an object becomes one CSS declaration and goes through checkCss.
// Values that are expressions (theme.palette…, antzTheme.space…, variables) are not literals and pass.
const OBJ_START = /\b(?:sx|style)\s*=\s*\{\{|\b(?:sx|style)\s*=\s*\{\[[^\]{]*\{|\bStyleSheet\.create\(\s*\{|\bstyled\([^)]*\)\(\s*\{|\b(?:makeStyles|createStyles)\(\s*(?:\([^)]*\)\s*=>\s*\(?)?\s*\{/g;
const MUI_SPACING = { p: 'padding', pt: 'padding-top', pb: 'padding-bottom', pl: 'padding-left', pr: 'padding-right', px: 'padding-inline', py: 'padding-block',
  m: 'margin', mt: 'margin-top', mb: 'margin-bottom', ml: 'margin-left', mr: 'margin-right', mx: 'margin-inline', my: 'margin-block', bgcolor: 'background-color' };
const RN_ALIAS = { paddingHorizontal: 'padding-inline', paddingVertical: 'padding-block', marginHorizontal: 'margin-inline', marginVertical: 'margin-block' };
const UNIT_PROPS = /^(font-size|padding|margin|gap|row-gap|column-gap|top|right|bottom|left|inset|border(-[a-z-]+)?-radius)(-[a-z-]+)?$/;
const NAMED_COLOUR = /^(white|black|red|green|blue|gray|grey|yellow|orange|purple|pink|brown|cyan|magenta|silver|gold|navy|teal|maroon|olive|lime)$/i;
function jsObjectChunks(text) {
  const out = [];
  for (const m of text.matchAll(OBJ_START)) {
    let i = m.index + m[0].length - 1, depth = 0, j = i;
    for (; j < text.length; j++) { const ch = text[j]; if (ch === '{') depth++; else if (ch === '}' && --depth === 0) break; }
    const body = text.slice(i, j + 1);
    for (const e of body.matchAll(/([A-Za-z]+)\s*:\s*('[^'\n]*'|"[^"\n]*"|`[^`]*`|-?\d+(?:\.\d+)?)(?=\s*[,}\n])/g)) {
      const key = e[1], raw = e[2], at = i + e.index;
      const prop = MUI_SPACING[key] || RN_ALIAS[key] || key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
      let val = /^['"`]/.test(raw) ? raw.slice(1, -1) : raw;
      if (/\$\{/.test(val)) continue;                                   // template with expressions: not a literal
      const isNum = /^-?\d/.test(raw);
      if (isNum && MUI_SPACING[key] && key !== 'bgcolor') { if (+val !== 0) add(currentFile, lineAt(text, at), 'ANTZ-SPC-01', `MUI spacing ${key}: ${raw} (${+val * 8}px by default): use var(--space-*); the Antz MUI theme has no spacing scale`, `${key}: ${raw}`); continue; }
      if (isNum && (prop === 'elevation' || prop === 'shadow-radius')) { if (+val > 0) add(currentFile, lineAt(text, at), 'ANTZ-ELV-01', 'Literal elevation or shadow: use antzTheme.shadow / --shadow-*', `${key}: ${raw}`); continue; }
      if (isNum && UNIT_PROPS.test(prop) && +val !== 0 && !(Math.abs(+val) === 1 && !/^font-size$/.test(prop))) val = val + 'px';
      if (isNum && prop === 'font-weight') val = String(val);
      if (/color$|^background$|^background-color$|^fill$|^stroke$/.test(prop) && NAMED_COLOUR.test(val)) { add(currentFile, lineAt(text, at), 'ANTZ-COL-01', 'Raw colour: use a semantic token or antzTheme colour', `${key}: ${raw}`); continue; }
      out.push({ text: `${prop}: ${val};`, offset: at, snippet: `${key}: ${raw}` });
    }
  }
  return out;
}
function checkDeprecations(file, text) {
  for (const d of deprecations) {
    const re = d.type === 'token' ? new RegExp('var\\(\\s*' + d.name.replace(/[-]/g, '\\-') + '\\b', 'g') : new RegExp('(?<![\\w-])' + d.name.replace(/[-]/g, '\\-') + '(?![\\w-])', 'g');
    for (const m of text.matchAll(re)) add(file, lineAt(text, m.index), 'ANTZ-DEP-01', `Deprecated ${d.type} ${d.name} (since ${d.since}): use ${d.replacement}`, text.slice(m.index, text.indexOf('\n', m.index) > 0 ? text.indexOf('\n', m.index) : undefined));
  }
}
let currentFile = '';
let localProps = new Set();
function checkMarkup(file, text) {
  for (const m of text.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attrs = m[1], inner = m[2];
    const visible = inner.replace(/<svg[\s\S]*?<\/svg>/gi, '').replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, 'x').trim();
    if (!visible && !/aria-label(ledby)?\s*=/.test(attrs) && !/class="[^"]*sr-only/.test(inner)) add(file, lineAt(text, m.index), 'ANTZ-A11Y-02', 'Icon-only button without aria-label', m[0].slice(0, 120));
  }
  for (const m of text.matchAll(/<img\b([^>]*)>/gi)) if (!/\balt\s*=/.test(m[1])) add(file, lineAt(text, m.index), 'ANTZ-A11Y-03', 'Image without alt text', m[0]);
}

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const kind = /\.s?css$/i.test(f) ? 'css' : /\.html?$/i.test(f) || /\.(vue|svelte)$/i.test(f) ? 'html' : 'js';
  localProps = new Set([...text.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]).filter((n) => !known.has(n)));
  currentFile = f;
  for (const ch of cssChunks(text, kind)) checkCss(f, text, ch);
  if (kind === 'js') for (const ch of jsObjectChunks(text)) checkCss(f, text, ch);
  if (kind !== 'css') checkMarkup(f, text);
  if (!/(^|\/)(components\.css|components\.js)$/.test(f)) checkDeprecations(f, text);
}

// React Native files: point to antzTheme instead of CSS tokens.
const RN_HINT = [[/--color-\*|semantic --color-\* token|semantic token or antzTheme colour/, 'antzTheme.colors.<scheme>.*'], [/--space-\*/, 'antzTheme.space'], [/--text-\*/, 'antzTheme.fontSize'], [/--weight-\*/, 'antzTheme.fontWeight'],
  [/--font-body/, 'antzTheme.fontFamily'], [/--radius-\*/, 'antzTheme.radius'], [/--shadow-\*/, 'antzTheme.shadow'], [/--duration-\*/, 'antzTheme.motion.duration']];
const rnFiles = new Set(files.filter((f) => /from\s+['"]react-native['"]/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(process.cwd(), f) || f));
for (const x of findings) if (rnFiles.has(x.file)) { const h = RN_HINT.find(([re]) => re.test(x.msg)); if (h && !x.msg.includes('antzTheme.')) x.msg += ` (React Native: ${h[1]})`; }

// Apply exceptions
const live = [], silenced = [], expired = new Set();
for (const x of findings) {
  const e = exceptionFor(x.file, x.rule);
  if (e && e.expires >= today) silenced.push({ ...x, exception: e.id });
  else { if (e) { x.msg += ` (exception ${e.id} expired ${e.expires})`; expired.add(e.id); } live.push(x); }
}
const errorsLeft = live.filter((x) => x.severity === 'error');

if (JSON_OUT) { console.log(JSON.stringify({ files: files.length, findings: live, silenced: silenced.length, expired: [...expired] }, null, 2)); }
else {
  const byFile = {};
  for (const x of live) (byFile[x.file] ||= []).push(x);
  for (const [f, xs] of Object.entries(byFile)) {
    console.log(`\n${f}`);
    for (const x of xs.sort((a, b) => a.line - b.line)) console.log(`  ${String(x.line).padStart(5)}  ${x.rule.padEnd(12)} ${x.msg}\n         ${x.snippet}`);
  }
  const counts = {};
  for (const x of live) counts[x.rule] = (counts[x.rule] || 0) + 1;
  console.log(`\nAntz guardrail check: ${files.length} file(s), ${live.length} finding(s)${silenced.length ? `, ${silenced.length} covered by live exceptions` : ''}.`);
  if (Object.keys(counts).length) console.log('  ' + Object.entries(counts).map(([r, n]) => `${r} ×${n}`).join('  '));
  if (expired.size) console.log(`  Expired exceptions: ${[...expired].join(', ')}`);
  console.log(errorsLeft.length ? (REPORT ? '  Report mode: not failing.' : '  ✗ Fails the guardrails. Fix, or request an exception (governance/README.md).') : '  ✓ Passes the guardrails.');
}
process.exit(errorsLeft.length && !REPORT ? 1 : 0);
