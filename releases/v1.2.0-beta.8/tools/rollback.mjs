#!/usr/bin/env node
/* ==========================================================================
   Antz Design System · rollback (go back to a published version)

     node tools/rollback.mjs --list                   versions you can go back to
     node tools/rollback.mjs 1.2.0-beta.3             dry run: what would change
     node tools/rollback.mjs 1.2.0-beta.3 --yes       restore it as a new commit

   Going back never erases history. The working copy is set to the source of
   the chosen release (its Git tag) and saved as a NEW commit, so everything
   in between stays in Git and the rollback itself can be undone with
   `git revert <commit>`.

   VERSION comes back too, so the working copy is exactly that release. A published
   number can't be released again (release.mjs refuses), so bump VERSION before
   the next release.

   Kept as they are (not rolled back):
     releases/               published versions are immutable (ANTZ-REL-01);
                             newer releases stay published and browsable
     CHANGELOG.md            history only grows; a "Rolled back" entry is added
     governance/decisions/   the decision log only grows
     tools/rollback.mjs, tools/deploy.mjs, deploy/   the way back and out

   Steps (with --yes):
     1. refuses if the working tree has uncommitted changes
     2. restores every other file from tag v<version>, removing files added since
     3. runs the gates: token build (incl. contrast), guardrail check, tests,
        release --verify. If any fails, the restore is undone and nothing is committed
     4. commits "Rollback to v<version>". Nothing is pushed or deployed.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { execSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (...a) => execFileSync('git', a, { cwd: ROOT, stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 }).toString().trim();
const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'releases', 'index.json'), 'utf8'));
const KEEP = [/^releases\//, /^CHANGELOG\.md$/, /^governance\/decisions\//, /^tools\/rollback\.mjs$/, /^tools\/deploy\.mjs$/, /^deploy\//];
const kept = (f) => KEEP.some((r) => r.test(f));
const args = process.argv.slice(2);

if (args.includes('--list') || !args.filter((a) => !a.startsWith('--')).length) {
  console.log('Published versions you can go back to:');
  for (const v of index.versions) console.log(`  ${v.version.padEnd(16)} ${v.date}  ${v.channel.padEnd(6)} commit ${v.commit}${v.version === index.latest ? '  (latest)' : ''}`);
  console.log('\nDry run:  node tools/rollback.mjs <version>\nRestore:  node tools/rollback.mjs <version> --yes');
  process.exit(0);
}

const version = args.find((a) => !a.startsWith('--')).replace(/^v/, '');
const tag = 'v' + version;
if (!index.versions.some((v) => v.version === version)) { console.error(`✗ ${version} is not a published version. See: node tools/rollback.mjs --list`); process.exit(1); }
try { git('rev-parse', '--verify', '--quiet', tag + '^{commit}'); } catch { console.error(`✗ Git tag ${tag} is missing. Fetch tags first: git fetch --tags`); process.exit(1); }

const then = new Set(git('ls-tree', '-r', '--name-only', tag).split('\n').filter(Boolean));
const now = new Set(git('ls-files').split('\n').filter(Boolean));
const restore = [...then].filter((f) => !kept(f));
const remove = [...now].filter((f) => !then.has(f) && !kept(f));
const changed = git('diff', '--name-only', tag, 'HEAD').split('\n').filter((f) => f && !kept(f) && then.has(f) && now.has(f));
const added = restore.filter((f) => !now.has(f));

console.log(`Rollback to ${tag} (published ${index.versions.find((v) => v.version === version).date}):`);
console.log(`  ${changed.length} file(s) change back, ${added.length} come back, ${remove.length} added since are removed.`);
console.log('  Kept as they are: releases/, CHANGELOG.md, governance/decisions/, the rollback and deploy tools.');
if (!changed.length && !added.length && !remove.length) { console.log(`✓ The working copy already matches ${tag}. Nothing to do.`); process.exit(0); }
const show = (label, list) => { if (!list.length) return; console.log(`\n  ${label}:`); for (const f of list.slice(0, 12)) console.log('    ' + f); if (list.length > 12) console.log(`    … and ${list.length - 12} more`); };
show('Change back', changed); show('Come back', added); show('Removed', remove);

if (!args.includes('--yes')) { console.log(`\nDry run only. To restore ${tag} as a new commit: node tools/rollback.mjs ${version} --yes`); process.exit(0); }

const dirty = git('status', '--porcelain');
if (dirty) { console.error('\n✗ Uncommitted changes. Commit or stash them first, so the rollback can be undone cleanly:\n' + dirty); process.exit(1); }
const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch === 'HEAD') { console.error('\n✗ Not on a branch (detached HEAD). Check out a branch first.'); process.exit(1); }
const from = git('rev-parse', '--short', 'HEAD');

const undo = (why) => { console.error(`\n✗ ${why}. Undoing the restore: nothing was committed.`); git('reset', '-q', '--hard', 'HEAD'); process.exit(1); };
try {
  for (let i = 0; i < restore.length; i += 200) git('checkout', tag, '--', ...restore.slice(i, i + 200));
  for (let i = 0; i < remove.length; i += 200) git('rm', '-q', '--', ...remove.slice(i, i + 200));
  const day = new Date().toISOString().slice(0, 10);
  const log = path.join(ROOT, 'CHANGELOG.md');
  let c = fs.readFileSync(log, 'utf8');
  const entry = `### Rolled back to ${tag} (${day})\n- The system's source was restored to ${tag}, from ${from} on ${branch}. Everything in between is still in Git; undo with \`git revert\` on the rollback commit. Bump VERSION before the next release: a published number can't be reused.\n\n`;
  c = c.includes('\n## Unreleased\n') ? c.replace('\n## Unreleased\n\n', `\n## Unreleased\n\n${entry}`) : c.replace(/\n## /, `\n## Unreleased\n\n${entry}## `);
  fs.writeFileSync(log, c);
  git('add', 'CHANGELOG.md');
} catch (e) { undo('The restore failed (' + e.message.split('\n')[0] + ')'); }

console.log(`\nGates for the restored ${tag}:`);
try {
  run('node tools/build.mjs --check');
  run('node tools/check.mjs');
  run('node tools/test.mjs');
  run('node tools/release.mjs --verify');
} catch { undo('A gate failed'); }

try { git('commit', '-q', '-m', `Rollback to ${tag}\n\nRestores the source of published version ${tag} as a new commit (from ${from}).\nreleases/, CHANGELOG.md and governance/decisions/ are kept.\nUndo with: git revert HEAD`); }
catch (e) { const out = `${e.stdout || ''}${e.stderr || ''}`.trim().split('\n').filter((l) => /✗|error/i.test(l)); undo('The commit was refused' + (out.length ? ':\n  ' + out.slice(0, 6).join('\n  ') : '')); }
console.log(`\n✓ Rolled back to ${tag} as commit ${git('rev-parse', '--short', 'HEAD')} on ${branch}. Nothing was pushed or deployed.`);
console.log('  Next: review it locally, then push and deploy (node tools/deploy.mjs). Undo: git revert HEAD');
