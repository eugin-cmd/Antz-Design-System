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
for (const [mod, fam] of [['normal', 'info'], ['high', 'caution'], ['emergency', 'danger']])
  ok(rule(`.tag-chip--${mod}`).includes(`--color-${fam}-bg`) && rule(`.tag-chip--${mod}`).includes(`--color-${fam}-text`), `tag chip ${mod} uses the ${fam} tokens`);
ok(/--color-neutral-bg/.test(rule('.tag-chip')), 'tag chip without a priority is neutral');
ok(rule('.priority__opt--high').includes('--color-caution-'), 'priority picker High is amber (caution), same scale as tag chips');
console.log(fails ? `\n✗ ${fails} self-test failure(s)` : '\n✓ All guardrail self-tests pass.');
process.exit(fails ? 1 : 0);
