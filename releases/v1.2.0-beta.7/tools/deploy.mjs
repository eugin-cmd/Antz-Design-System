#!/usr/bin/env node
/* ==========================================================================
   Antz Design System · deploy the docs site to Cloudflare

     node tools/deploy.mjs                        make the current commit live
     node tools/deploy.mjs --preview [name]       upload the current commit as a preview, NOT live,
                                                  at https://<name>-<site> (default name: preview)
     node tools/deploy.mjs --ref <tag|commit>     deploy the site as it was at a tag or commit
                                                  (combine with --preview to look without going live)
     node tools/deploy.mjs --list                 recent snapshots: date, commit, which is live, URL
     node tools/deploy.mjs --rollback [id]        make an earlier snapshot live again, instantly
                                                  (default: the one live before the current one)

   What goes up is exactly what Git has committed (git archive), never stray local
   files, plus deploy/robots.txt and deploy/_headers (noindex: the site is private).
   Settings live in deploy/site.json, so a deploy no longer depends on a temporary folder.

   Snapshots: Cloudflare keeps every upload as a version with its own permanent URL,
   https://<first 8 of version id>-<site>. Each upload is labelled with the commit it
   came from, so any past state of the site can be opened, compared or put back live.
   ========================================================================== */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'deploy', 'site.json'), 'utf8'));
const SITE = `${CFG.name}.${CFG.subdomain}`;
const git = (...a) => execFileSync('git', a, { cwd: ROOT, stdio: 'pipe', maxBuffer: 256 * 1024 * 1024 }).toString().trim();
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };

function tmpConfig(dir) {
  const conf = { name: CFG.name, account_id: CFG.account_id, compatibility_date: CFG.compatibility_date, workers_dev: true, preview_urls: true, assets: { directory: './site', html_handling: 'auto-trailing-slash' } };
  fs.writeFileSync(path.join(dir, 'wrangler.json'), JSON.stringify(conf, null, 2));
  return path.join(dir, 'wrangler.json');
}
function wrangler(wargs, { cwd = os.tmpdir(), capture = false } = {}) {
  return execFileSync('npx', ['--yes', 'wrangler@4', ...wargs], { cwd, stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }, maxBuffer: 64 * 1024 * 1024 })?.toString() ?? '';
}
// The site is private: after every deploy, prove search engines are still told to stay away.
async function checkPrivate(base) {
  const ok = [];
  for (let i = 0; i < 4; i++) {
    try {
      const head = await fetch(base + '/', { method: 'HEAD', redirect: 'follow' });
      const robots = await (await fetch(base + '/robots.txt')).text();
      ok[0] = /noindex/i.test(head.headers.get('x-robots-tag') || ''); ok[1] = /Disallow:\s*\/\s*$/m.test(robots);
      if (ok[0] && ok[1]) { console.log('  ✓ Still private: noindex header and robots.txt in place.'); return; }
    } catch {}
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.error(`\n  ✗ WARNING: ${base} is NOT fully private (noindex header: ${ok[0] ? 'yes' : 'NO'}, robots.txt Disallow: ${ok[1] ? 'yes' : 'NO'}).`);
  console.error('    Redeploy with: node tools/deploy.mjs   (it always adds deploy/robots.txt and deploy/_headers)');
  process.exitCode = 1;
}
const json = (out) => JSON.parse(out.slice(out.indexOf(out.trimStart()[0])));

// ── List snapshots ─────────────────────────────────────────────────────
if (args.includes('--list')) {
  const versions = json(wrangler(['versions', 'list', '--name', CFG.name, '--json'], { capture: true }));
  const status = json(wrangler(['deployments', 'status', '--name', CFG.name, '--json'], { capture: true }));
  const live = new Set((status.versions || []).map((v) => v.version_id));
  const n = Number(opt('--list')) || 15;
  console.log(`Snapshots of https://${SITE} (newest first; every one keeps its own URL):\n`);
  for (const v of versions.slice(-n).reverse()) {
    const msg = v.annotations?.['workers/message'] || '(no label: deployed before snapshots were labelled)';
    const alias = v.annotations?.['workers/alias'];
    console.log(`${live.has(v.id) ? '● LIVE' : '      '}  ${v.metadata.created_on.slice(0, 16).replace('T', ' ')}  ${v.id}`);
    console.log(`        ${msg}${alias ? `  [preview: https://${alias}-${SITE}]` : ''}`);
    console.log(`        https://${v.id.slice(0, 8)}-${SITE}\n`);
  }
  console.log('Put one back live: node tools/deploy.mjs --rollback <id>');
  process.exit(0);
}

// ── Roll the live site back to an earlier snapshot ──────────────────────
if (args.includes('--rollback')) {
  let id = opt('--rollback');
  if (!id) {
    const deps = json(wrangler(['deployments', 'list', '--name', CFG.name, '--json'], { capture: true }));
    const prev = deps[deps.length - 2];
    if (!prev) { console.error('✗ There is no earlier deployment to go back to.'); process.exit(1); }
    id = prev.versions[0].version_id;
  }
  console.log(`Putting snapshot ${id} back live at https://${SITE} …`);
  wrangler(['rollback', id, '--name', CFG.name, '--message', `Rollback to ${id} (tools/deploy.mjs)`, '--yes']);
  console.log(`\n✓ Live again: ${id}. It is also kept at https://${id.slice(0, 8)}-${SITE}`);
  console.log('  The Git source is unchanged. To bring the source back too: node tools/rollback.mjs <version>');
  await checkPrivate(`https://${SITE}`);
  process.exit(process.exitCode || 0);
}

// ── Upload (live or preview) ────────────────────────────────────────────
const ref = opt('--ref') || 'HEAD';
const preview = args.includes('--preview');
const alias = preview ? (opt('--preview') || 'preview') : null;
if (alias && !/^[a-z0-9][a-z0-9-]{0,30}$/.test(alias)) { console.error('✗ Preview name: lowercase letters, digits and hyphens only (for example: dd-007).'); process.exit(1); }
let sha;
try { sha = git('rev-parse', '--short', ref + '^{commit}'); } catch { console.error(`✗ ${ref} is not a tag or commit in this repository.`); process.exit(1); }
if (ref === 'HEAD') {
  const dirty = git('status', '--porcelain');
  if (dirty) { console.error('✗ Uncommitted changes would not be deployed (only committed work goes up). Commit them first:\n' + dirty); process.exit(1); }
}
const subject = git('log', '-1', '--format=%s', sha).slice(0, 80);
const tags = git('tag', '--points-at', sha).split('\n').filter(Boolean);
const message = `${sha}${tags.length ? ' (' + tags.join(', ') + ')' : ''} ${subject}`.slice(0, 100);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'antz-deploy-'));
const site = path.join(dir, 'site');
fs.mkdirSync(site);
const tar = path.join(dir, 'site.tar');
git('archive', '--format=tar', '-o', tar, sha);
execFileSync('tar', ['-xf', tar, '-C', site]);
fs.rmSync(tar);
fs.rmSync(path.join(site, 'deploy'), { recursive: true, force: true });
for (const f of ['robots.txt', '_headers']) fs.copyFileSync(path.join(ROOT, 'deploy', f), path.join(site, f));
const config = tmpConfig(dir);

console.log(`${preview ? 'Preview' : 'Live'} deploy of ${message}`);
try {
  if (preview) wrangler(['versions', 'upload', '--config', config, '--message', message, '--tag', sha, '--preview-alias', alias], { cwd: dir });
  else wrangler(['deploy', '--config', config, '--message', message, '--tag', sha], { cwd: dir });
} finally { fs.rmSync(dir, { recursive: true, force: true }); }

if (preview) console.log(`\n✓ Preview (not live): https://${alias}-${SITE}\n  The live site is unchanged: https://${SITE}`);
else console.log(`\n✓ Live: https://${SITE}\n  This snapshot keeps its own URL; see: node tools/deploy.mjs --list`);
await checkPrivate(preview ? `https://${alias}-${SITE}` : `https://${SITE}`);
