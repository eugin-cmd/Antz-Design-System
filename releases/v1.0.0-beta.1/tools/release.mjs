#!/usr/bin/env node
/* ==========================================================================
   Antz Design System · release (Development → Published)
   Turns the working copy into an immutable, versioned release.

     node tools/release.mjs                  publish the version in VERSION
     node tools/release.mjs --verify         prove no published file has changed
     node tools/release.mjs --list           list published versions

   Publishing:
     1. refuses if the Git working tree has uncommitted changes
     2. runs the gates: token build (incl. contrast), guardrail check,
        guardrail tests, and --verify of existing releases
     3. refuses if releases/v<VERSION>/ already exists (published = immutable)
     4. copies the system (tokens, components, outputs, docs, specs) into
        releases/v<VERSION>/ and writes MANIFEST.json with a SHA-256 per file
     5. adds the version to releases/index.json (read by the docs switcher)
     6. commits and tags v<VERSION> in Git

   Products link a pinned release, e.g. releases/v1.0.0-beta.1/tokens.css,
   never the working copy. Rolling back = pointing back at an older release.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REL = path.join(ROOT, 'releases');
const INDEX = path.join(REL, 'index.json');
const sh = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'pipe' }).toString().trim();
const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const readIndex = () => (fs.existsSync(INDEX) ? JSON.parse(fs.readFileSync(INDEX, 'utf8')) : { $description: 'Published Antz Design System versions. Written by tools/release.mjs. Never edit by hand.', latest: null, versions: [] });

function filesUnder(dir, base = dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) filesUnder(p, base, out); else if (n !== 'MANIFEST.json' && n !== '.DS_Store') out.push(path.relative(base, p));
  }
  return out.sort();
}

function verify() {
  const idx = readIndex();
  let bad = 0;
  for (const v of idx.versions) {
    const dir = path.join(REL, 'v' + v.version);
    const manPath = path.join(dir, 'MANIFEST.json');
    if (!fs.existsSync(manPath)) { console.error(`✗ v${v.version}: MANIFEST.json missing`); bad++; continue; }
    const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
    const now = filesUnder(dir);
    const listed = Object.keys(man.files).sort();
    for (const f of listed) {
      const p = path.join(dir, f);
      if (!fs.existsSync(p)) { console.error(`✗ v${v.version}: ${f} was deleted`); bad++; }
      else if (sha(p) !== man.files[f]) { console.error(`✗ v${v.version}: ${f} was modified after publishing`); bad++; }
    }
    for (const f of now) if (!(f in man.files)) { console.error(`✗ v${v.version}: ${f} was added after publishing`); bad++; }
    const manSha = crypto.createHash('sha256').update(JSON.stringify(man.files)).digest('hex');
    if (v.manifestSha256 && v.manifestSha256 !== manSha) { console.error(`✗ v${v.version}: MANIFEST.json does not match releases/index.json`); bad++; }
  }
  if (bad) { console.error(`\n${bad} problem(s): published releases are immutable (rule ANTZ-REL-01). Restore with: git checkout -- releases/`); process.exit(1); }
  console.log(`✓ ${idx.versions.length} published release(s) verified unchanged.`);
}

if (process.argv.includes('--verify')) { verify(); process.exit(0); }
if (process.argv.includes('--list')) {
  const idx = readIndex();
  for (const v of idx.versions) console.log(`v${v.version}  ${v.date}  ${v.channel}  ${v.commit}${v.version === idx.latest ? '  (latest)' : ''}`);
  if (!idx.versions.length) console.log('No published releases yet.');
  process.exit(0);
}

// ── Publish ──────────────────────────────────────────────────────────────
const VERSION = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
if (!/^\d+\.\d+\.\d+(-(alpha|beta|rc)\.\d+)?$/.test(VERSION)) { console.error(`✗ VERSION "${VERSION}" is not semantic (e.g. 1.2.0 or 1.2.0-beta.1)`); process.exit(1); }
const dirty = sh('git status --porcelain');
if (dirty) { console.error('✗ Uncommitted changes. Commit (or stash) them first, so the release matches a commit:\n' + dirty); process.exit(1); }
const dest = path.join(REL, 'v' + VERSION);
if (fs.existsSync(dest)) { console.error(`✗ v${VERSION} is already published and cannot change. Bump VERSION (patch, minor or major) for a new release.`); process.exit(1); }
const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
if (!changelog.includes(`## ${VERSION}`)) { console.error(`✗ CHANGELOG.md has no "## ${VERSION}" section. Describe the release first.`); process.exit(1); }

console.log(`Gates for v${VERSION}:`);
run('node tools/build.mjs --check');
run('node tools/check.mjs');
run('node tools/test.mjs');
verify();

const INCLUDE = ['tokens.css', 'components.css', 'colors.json', 'VERSION', 'CHANGELOG.md', 'README.md', 'HOW-IT-WORKS.md', 'AGENTS.md', 'CLAUDE.md', 'index.html', 'tester.html', 'tester-frame.html', 'assets', 'pages', 'themes', 'dist', 'tokens', 'governance', 'specs', 'tools'];
fs.mkdirSync(dest, { recursive: true });
for (const item of INCLUDE) {
  const src = path.join(ROOT, item);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(dest, item), { recursive: true, filter: (p) => !p.endsWith('.DS_Store') });
}
const files = {};
for (const f of filesUnder(dest)) files[f] = sha(path.join(dest, f));
const commit = sh('git rev-parse --short HEAD');
const manifest = { version: VERSION, date: new Date().toISOString().slice(0, 10), commit, files };
fs.writeFileSync(path.join(dest, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');

const idx = readIndex();
const channel = VERSION.includes('-') ? VERSION.split('-')[1].split('.')[0] : 'stable';
idx.versions.unshift({ version: VERSION, date: manifest.date, channel, commit, path: `releases/v${VERSION}/`, manifestSha256: crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex') });
idx.latest = VERSION;
if (channel === 'stable') idx.latestStable = VERSION;
fs.writeFileSync(INDEX, JSON.stringify(idx, null, 2) + '\n');

run(`git add releases && git -c user.name="Antz Design System" -c user.email="design-system@antz.local" commit -q -m "Release v${VERSION}" && git tag -a v${VERSION} -m "Antz Design System v${VERSION}"`);
console.log(`\n✓ Published v${VERSION} → releases/v${VERSION}/ (${Object.keys(files).length} files, tag v${VERSION}).`);
console.log(`  Products pin it with: <link rel="stylesheet" href=".../releases/v${VERSION}/tokens.css">`);
