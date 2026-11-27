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
// Developer code (design agent): the checker reads MUI sx/style objects and React Native StyleSheet.
const js = (f) => { const r = JSON.parse(node('tools/check.mjs', '--json', f).out); return { n: r.findings.length, rules: new Set(r.findings.map((x) => x.rule)) }; };
const bm = js('tools/fixtures/bad-mui.tsx');
for (const r of ['ANTZ-COL-01', 'ANTZ-COL-03', 'ANTZ-TYP-01', 'ANTZ-TYP-02', 'ANTZ-TYP-03', 'ANTZ-SPC-01', 'ANTZ-SHP-01', 'ANTZ-ELV-01', 'ANTZ-MOT-01', 'ANTZ-DEP-01']) ok(bm.rules.has(r), `MUI fixture trips ${r}`);
const br = js('tools/fixtures/bad-rn.tsx');
for (const r of ['ANTZ-COL-01', 'ANTZ-TYP-01', 'ANTZ-TYP-02', 'ANTZ-TYP-03', 'ANTZ-SPC-01', 'ANTZ-SHP-01', 'ANTZ-ELV-01']) ok(br.rules.has(r), `React Native fixture trips ${r}`);
ok(js('tools/fixtures/good-mui.tsx').n === 0, 'good MUI fixture passes (theme values and tokens)');
ok(js('tools/fixtures/good-rn.tsx').n === 0, 'good React Native fixture passes (antzTheme values)');
ok(node('tools/check.mjs', 'tools/fixtures/bad-rn.tsx').code === 1 && node('tools/check.mjs', 'tools/fixtures/good-mui.tsx').code === 0, 'developer-code findings fail the check; deprecations alone warn');
// Design agent: the plugin is published from this repository, versioned with the system, with three skills.
const readJ = (f) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); } catch { return null; } };
const VERSION_NOW = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
const mkt = readJ('.claude-plugin/marketplace.json'), plug = readJ('agent/.claude-plugin/plugin.json');
ok(mkt?.name === 'antz' && mkt.plugins?.some((p) => p.name === 'antz-design-system' && p.source === './agent'), 'marketplace "antz" lists the antz-design-system plugin from ./agent');
ok(plug?.name === 'antz-design-system' && plug.version === VERSION_NOW, `plugin.json is antz-design-system at the system version (${VERSION_NOW})`);
for (const sk of ['systemdesigner', 'systemauditor', 'openvisualguide']) {
  const md = (() => { try { return fs.readFileSync(path.join(ROOT, 'agent/skills', sk, 'SKILL.md'), 'utf8'); } catch { return ''; } })();
  ok(new RegExp('^---\\nname: ' + sk + '\\n').test(md) && /\ndescription: .{40,}/.test(md), `skill /${sk} exists with a name and a description`);
  ok(/\ndescription: '[^\n]*'\n/.test(md), `skill /${sk}: description is a quoted YAML string (a bare colon or quote would drop it)`);
}
ok(fs.existsSync(path.join(ROOT, 'agent/scripts/antz.mjs')), 'the shared helper lives in agent/scripts/antz.mjs');
// /systemauditor: read-only, graded, names the version; code-only audits say rendered checks did not run.
const aud = (f) => { try { return JSON.parse(execFileSync('node', ['agent/scripts/antz.mjs', 'audit', f, '--version', 'working', '--json'], { cwd: ROOT, stdio: 'pipe' }).toString()); } catch (e) { return null; } };
const ab = aud('tools/fixtures/bad-rn.tsx'), ag = aud('tools/fixtures/good-rn.tsx');
ok(ab?.verdict === 'Not compliant' && ab.findings.some((x) => x.rule === 'ANTZ-ELV-01' && x.cat === 'C') && ab.findings.some((x) => x.rule === 'ANTZ-COL-01' && x.cat === 'B'), 'auditor grades a bad React Native file: critical colours, major elevation');
ok(ag?.verdict === 'Compliant' && ag.notRan.some((x) => /Rendered checks: not run/.test(x)) && ag.version === 'working', 'auditor passes a good file and says rendered checks did not run');
// Governance: the owner reviews every file; rulesets protect main and the release tags.
const owners = (() => { try { return fs.readFileSync(path.join(ROOT, '.github/CODEOWNERS'), 'utf8'); } catch { return ''; } })();
ok(/^\*\s+@eugin-cmd/m.test(owners) && ['/tokens/', '/components.css', '/governance/', '/agent/', '/releases/'].every((p) => owners.includes(p)), 'CODEOWNERS: the System Owner owns every file, critical paths listed');
const rsMain = readJ('.github/rulesets/main.json'), rsTags = readJ('.github/rulesets/release-tags.json');
ok(rsMain?.rules?.some((r) => r.type === 'pull_request' && r.parameters.require_code_owner_review) && rsMain.rules.some((r) => r.type === 'non_fast_forward') && rsTags?.target === 'tag' && ['update', 'deletion'].every((t) => rsTags.rules.some((r) => r.type === t)), 'rulesets: main needs code-owner review and no force-push; v* tags never move or disappear');
const old = (() => { try { return JSON.parse(execFileSync('node', ['agent/scripts/antz.mjs', 'audit', 'tools/fixtures/bad-rn.tsx', '--version', '1.2.0-beta.7', '--json'], { cwd: ROOT, stdio: 'pipe' }).toString()); } catch { return null; } })();
ok(old && old.verdict !== 'Compliant' && old.notRan.some((x) => /can't read them/.test(x)), 'auditor never calls code "compliant" when the release checker could not read its styles');
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
// DD-009 mobile: the opt-in bottom sheet rises from the bottom on phones, in the viewport and in a shell frame.
ok(/@media \(max-width: 599px\) \{[^}]*\.drawer--bottom[^}]*\}/.test(css) && /@container shell \(max-width: 599\.98px\) \{[^}]*\.drawer--bottom/.test(css) && /@keyframes ds-sheet-up/.test(css), 'drawer--bottom is a bottom sheet under 600px (viewport and shell container)');
// DD-009: React Native gets the same tag chip colours as the web, in every scheme.
const rnSrc = fs.readFileSync(path.join(ROOT, 'dist', 'react-native', 'antz-theme.js'), 'utf8');
const rnTheme = JSON.parse(rnSrc.slice(rnSrc.indexOf('{'), rnSrc.lastIndexOf('}') + 1));
const lightTokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'colors.json'), 'utf8')).light;
const tc = rnTheme.roles?.light?.tagChip;
ok(!!tc && ['none', 'normal', 'high', 'critical'].every((k) => tc[k]?.bg && tc[k]?.text), 'RN theme has tag chip roles: none, normal, high, critical');
ok(tc?.high?.bg === lightTokens['color-caution-bg'].$value && tc?.critical?.text === lightTokens['color-danger-text'].$value, 'RN tag chip High is caution and Critical is danger, as on the web');
console.log(fails ? `\n✗ ${fails} self-test failure(s)` : '\n✓ All guardrail self-tests pass.');
process.exit(fails ? 1 : 0);
