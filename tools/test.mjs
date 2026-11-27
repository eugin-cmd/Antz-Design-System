#!/usr/bin/env node
/* Antz Design System · guardrail self-test
   Proves the gates work: the token build passes, the bad fixture trips every
   automated rule, and the good fixture passes. Run: node tools/test.mjs */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = (...a) => { try { return { code: 0, out: execFileSync('node', a, { cwd: ROOT, stdio: 'pipe' }).toString() }; } catch (e) { return { code: e.status, out: e.stdout.toString() + e.stderr.toString() }; } };
let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`); if (!cond) fails++; };

console.log('Antz guardrail self-test');
ok(node('tools/build.mjs', '--check').code === 0, 'token build and contrast gate pass');
ok(node('tools/icons.mjs', '--check').code === 0, 'ANTZ Rounded icons: sprite, UI icons and docs grid are up to date');
const bad = JSON.parse(node('tools/check.mjs', '--json', 'tools/fixtures/bad-prototype.html').out);
const hit = new Set(bad.findings.map((f) => f.rule));
for (const r of ['ANTZ-GRD-01', 'ANTZ-COL-03', 'ANTZ-COL-01', 'ANTZ-TYP-02', 'ANTZ-TYP-01', 'ANTZ-TYP-03', 'ANTZ-SPC-01', 'ANTZ-SHP-01', 'ANTZ-ELV-01', 'ANTZ-COL-02', 'ANTZ-TOK-01', 'ANTZ-TOK-02', 'ANTZ-MOT-01', 'ANTZ-A11Y-01', 'ANTZ-A11Y-02', 'ANTZ-A11Y-03'])
  ok(hit.has(r), `bad fixture trips ${r}`);
ok(node('tools/check.mjs', 'tools/fixtures/bad-prototype.html').code === 1, 'bad fixture fails the check (exit 1)');
const good = JSON.parse(node('tools/check.mjs', '--json', 'tools/fixtures/good-prototype.html').out);
ok(good.findings.length === 0, `good fixture passes (${good.findings.length} findings)`);
// DD-009: the tag chip and the priority picker share one priority scale, on status tokens.
const css = fs.readFileSync(path.join(ROOT, 'components.css'), 'utf8');
const rule = (sel) => (css.match(new RegExp('^' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}', 'm')) || [])[1] || '';
for (const [mod, fam] of [['normal', 'info'], ['high', 'caution'], ['critical', 'danger']])
  ok(rule(`.tag-chip--${mod}`).includes(`--color-${fam}-bg`) && rule(`.tag-chip--${mod}`).includes(`--color-${fam}-text`), `tag chip ${mod} uses the ${fam} tokens`);
ok(/--color-neutral-bg/.test(rule('.tag-chip')), 'tag chip without a priority is neutral');
ok(rule('.priority__opt--high').includes('--color-caution-'), 'priority picker High is amber (caution), same scale as tag chips');
ok(/\.priority__opt--critical\b/.test(css) && /\.priority__opt--emergency\b/.test(css), 'priority picker has Critical, and keeps --emergency as an alias (shipped in beta.6)');
// DD-009 review fixes: focus shows inside the clipped private shape; +N reads on any photo and says what it shows.
ok(/inset 0 0 0 var\(--focus-ring-width\) var\(--color-focus\)/.test(rule('.tag-chip--private:focus-visible')), 'private tag chip focus ring is drawn inside its clip-path');
ok(/background:\s*var\(--color-surface\)/.test(rule('.tag-strip__more')), '+N in the tag strip has an opaque background, so its contrast never depends on the photo');
const tagsPage = fs.readFileSync(path.join(ROOT, 'pages', 'tags.html'), 'utf8');
const more = (tagsPage.match(/<button class="tag-strip__more"[^>]*>.*?<\/button>/) || [''])[0];
ok(!!more && !/aria-label=/.test(more) && /\+5/.test(more) && /sr-only/.test(more), '+N keeps "+5" in its accessible name (no aria-label override)');
// DD-009: React Native gets the same tag chip colours as the web, in every scheme.
const rnSrc = fs.readFileSync(path.join(ROOT, 'dist', 'react-native', 'antz-theme.js'), 'utf8');
const rnTheme = JSON.parse(rnSrc.slice(rnSrc.indexOf('{'), rnSrc.lastIndexOf('}') + 1));
const lightTokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'colors.json'), 'utf8')).light;
const tc = rnTheme.roles?.light?.tagChip;
ok(!!tc && ['none', 'normal', 'high', 'critical'].every((k) => tc[k]?.bg && tc[k]?.text), 'RN theme has tag chip roles: none, normal, high, critical');
ok(tc?.high?.bg === lightTokens['color-caution-bg'].$value && tc?.critical?.text === lightTokens['color-danger-text'].$value, 'RN tag chip High is caution and Critical is danger, as on the web');
console.log(fails ? `\n✗ ${fails} self-test failure(s)` : '\n✓ All guardrail self-tests pass.');
process.exit(fails ? 1 : 0);
