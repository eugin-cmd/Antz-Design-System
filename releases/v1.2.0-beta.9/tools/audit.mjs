#!/usr/bin/env node
/* ==========================================================================
   Antz Design System · rendered audit (needs Chrome or Chromium; no npm packages)
   Checks what the browser actually shows, which the token build cannot see:

     node tools/audit.mjs                 everything (about 10 minutes)
     node tools/audit.mjs cascade         every colour token in all 36 combinations of
                                          OS scheme, OS contrast, page theme, page contrast
     node tools/audit.mjs contrast        every text element on every docs page and the
                                          theme tester, in light, dark and both high contrasts;
                                          suspects are re-measured on the real pixels
     node tools/audit.mjs motion          anything still moving under reduced motion
     node tools/audit.mjs links           missing files, broken anchors, JS errors, tap targets
     --pages pages/buttons.html,index.html   limit contrast, motion and links to some pages
     --report                              list findings but exit 0
     --out <file>                          also write the findings as JSON

   Chrome is found automatically; set CHROME=/path/to/chrome to choose one.
   Exit code 1 when a real finding remains. Run it before every release.
   Deliberate "don't" examples opt out with data-audit-ignore (or sit in
   .never__sample / .aa-sample / .tt-swatch).
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { browser, makeScan, pixelRatio } from '../agent/scripts/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Serve the site over a local HTTP server, so pages load as visitors get them (file:// blocks some features, such as CSS masks).
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.md': 'text/plain', '.ts': 'text/plain' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); const file = path.join(ROOT, rel.endsWith('/') ? rel + 'index.html' : rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i < 0 ? undefined : args[i + 1]; };
const REPORT = args.includes('--report');
const OUT = opt('--out');
const PARTS = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && args[i - 1] !== '--report'));
const parts = PARTS.length ? PARTS : ['cascade', 'motion', 'links', 'contrast'];
const IGNORE = '[data-audit-ignore], .never__sample, .aa-sample, .tt-swatch';
const SCAN = makeScan(IGNORE);

if (typeof WebSocket === 'undefined') { console.error('Node 22 or later is needed (built-in WebSocket).'); process.exit(2); }


const nav = JSON.parse(fs.readFileSync(path.join(ROOT, 'pages/_nav.json'), 'utf8'));
const ALL = [...new Set(['index.html', ...nav.groups.flatMap((g) => g.links.map((l) => (l.href.startsWith('../') ? l.href.slice(3) : 'pages/' + l.href)))])]
  .filter((h) => fs.existsSync(path.join(ROOT, h)) && h !== 'pages/import-theme.html');
const PAGES = opt('--pages') ? opt('--pages').split(',') : ALL;
const MODES = [['light', 'standard'], ['dark', 'standard'], ['light', 'high'], ['dark', 'high']];
const FREEZE = `(()=>{const s=document.createElement('style');s.textContent='*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}.reveal-wait{opacity:1!important}';document.head.appendChild(s);document.querySelectorAll('.reveal-wait').forEach(e=>e.classList.remove('reveal-wait'));return 1})()`;

const findings = {}; const say = (s) => process.stdout.write(s + '\n');
let b;
try { b = await browser(); } catch (e) { console.error(`✗ ${e.message}`); server.close(); process.exit(2); }
try {
  if (parts.includes('cascade')) {
    say('· Cascade: every colour token in 36 combinations of OS and page settings');
    const colors = JSON.parse(fs.readFileSync(path.join(ROOT, 'colors.json'), 'utf8'));
    const hex = (v) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(v); return m ? '#' + m.slice(1, 4).map((x) => (+x).toString(16).padStart(2, '0')).join('').toUpperCase() : v.toUpperCase(); };
    await b.goto(BASE + 'index.html', 1400); const out = [];
    for (const os_ of ['light', 'dark']) for (const osc of ['no-preference', 'more']) for (const th of ['', 'light', 'dark']) for (const ct of ['', 'standard', 'high']) {
      await b.media([{ name: 'prefers-color-scheme', value: os_ }, { name: 'prefers-contrast', value: osc }]);
      const got = await b.eval(`(()=>{const h=document.documentElement;${th ? `h.dataset.theme='${th}'` : 'delete h.dataset.theme'};${ct ? `h.dataset.contrast='${ct}'` : 'delete h.dataset.contrast'};const cs=getComputedStyle(h);const o={};for(const n of ${JSON.stringify(Object.keys(colors.light))})o[n]=cs.getPropertyValue('--'+n).trim();return o})()`);
      const mode = ((th ? th === 'dark' : os_ === 'dark') ? 'dark' : 'light') + ((ct ? ct === 'high' : osc === 'more') ? '-hc' : '');
      for (const [n, v] of Object.entries(colors[mode])) { const g = got[n]; if (g && !/^var\(/.test(g) && hex(g).slice(0, 7) !== String(v.$value).toUpperCase().slice(0, 7)) out.push(`OS ${os_}/${osc}, theme ${th || 'auto'}, contrast ${ct || 'auto'}: --${n} is ${hex(g)}, gate checked ${v.$value} (${mode})`); }
    }
    await b.media([]); findings.cascade = out; say(`  ${out.length} mismatch(es)`);
  }
  if (parts.includes('motion')) {
    say('· Reduced motion: anything still animating');
    await b.media([{ name: 'prefers-reduced-motion', value: 'reduce' }]); const moving = {};
    for (const pg of PAGES) {
      await b.goto(BASE + pg, 1200);
      const r = await b.eval(String.raw`(()=>{const o=[];const sec=(v)=>Math.max(...v.split(',').map(x=>parseFloat(x)*(x.includes('ms')?0.001:1)));for(const el of document.querySelectorAll('body *')){const cs=getComputedStyle(el);const a=cs.animationName!=='none'&&sec(cs.animationDuration)>0;const t=sec(cs.transitionDuration)>0;if((a||t)&&el.getBoundingClientRect().width>0)o.push((typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/)[0]:el.tagName.toLowerCase())+(a?' animation '+cs.animationName:'')+(t?' transition '+cs.transitionProperty.slice(0,30):''))}return [...new Set(o)]})()`).catch(() => []);
      for (const x of r) (moving[x] ||= []).push(pg);
    }
    await b.media([]); findings.motion = Object.entries(moving).map(([k, v]) => `${k} (${v.length} page${v.length > 1 ? 's' : ''}, e.g. ${v[0]})`); say(`  ${findings.motion.length} finding(s)`);
  }
  if (parts.includes('links')) {
    say('· Links, files, JavaScript errors and tap targets');
    const out = [];
    for (const pg of [...PAGES, ...(opt('--pages') ? [] : ['tester.html', 'tester-frame.html'])]) {
      await b.goto(BASE + pg, 1300);
      const r = await b.eval(String.raw`(()=>{const u=[...document.querySelectorAll('a[href],img[src],script[src],link[href],use[href],source[src]')].map(e=>e.getAttribute('href')||e.getAttribute('src'));const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);const small=[];for(const el of document.querySelectorAll('a,button,input,select,textarea,[role=button],[role=tab],summary')){if(el.closest('.device, .devices, .tt-frame, .screen, .phone, [data-audit-ignore]'))continue;const r=el.getBoundingClientRect();if(r.width<1||r.height<1)continue;if(parseFloat(getComputedStyle(el).opacity)<0.05)continue;if(el.tagName==='A'&&el.closest('p,li,td,dd,small,.t-small'))continue;if(el.type==='checkbox'||el.type==='radio')continue;let s=el;let scaled=false;while(s){const tf=getComputedStyle(s).transform;if(tf&&tf!=='none'&&!/matrix\(1, 0, 0, 1/.test(tf)){scaled=true;break}s=s.parentElement}if(scaled)continue;if(r.width<23.5||r.height<23.5)small.push((typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/)[0]:el.tagName.toLowerCase())+' '+Math.round(r.width)+'×'+Math.round(r.height)+' "'+(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,24)+'"')}return {u,ids,small:[...new Set(small)]}})()`).catch(() => ({ u: [], ids: [], small: [] }));
      const dir = path.dirname(path.join(ROOT, pg));
      for (const raw of r.u) {
        if (!raw || /^(https?:|mailto:|tel:|data:|javascript:)/.test(raw)) continue;
        const [file, hash] = raw.split('#'); const clean = file.split('?')[0];
        if (!clean) { if (hash && !hash.startsWith('i-') && !r.ids.includes(hash)) out.push(`${pg}: anchor #${hash} not found`); continue; }
        if (!fs.existsSync(path.resolve(dir, clean))) out.push(`${pg}: missing file ${raw}`);
      }
      for (const s of r.small) out.push(`${pg}: tap target under 24px ${s}`);
      for (const e of b.events.filter((x) => x.method === 'Runtime.exceptionThrown')) out.push(`${pg}: JavaScript error ${(e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text || '').split('\n')[0]}`);
    }
    findings.links = out; say(`  ${out.length} finding(s)`);
  }
  if (parts.includes('contrast')) {
    say('· Contrast: every text element, four modes, real pixels for suspects');
    const out = []; const pages = [...PAGES, ...(opt('--pages') ? [] : ['tester.html'])];
    for (const pg of pages) {
      await b.goto(BASE + pg, pg === 'tester.html' ? 2600 : 1500);
      for (const [t, c] of MODES) {
        try {
          await b.eval(`(()=>{const h=document.documentElement;h.dataset.theme='${t}';h.dataset.contrast='${c}';document.querySelectorAll('[data-audit-id]').forEach(e=>e.removeAttribute('data-audit-id'));return 1})()`);
          await b.eval(FREEZE); await new Promise((r) => setTimeout(r, 120));
          const r = await b.eval(SCAN);
          for (const f of r.fails) {
            let real = await pixelRatio(b, f).catch(() => null);
            // Confirm a failure with a second capture: the first one can land before the page repaints after scrolling
            if (real !== null && real < f.need - 0.01) { await new Promise((r) => setTimeout(r, 350)); const again = await pixelRatio(b, f).catch(() => null); if (again !== null) real = Math.max(real, again); }
            if (real === null || real < f.need - 0.01) out.push(`${pg} [${t}${c === 'high' ? ' high contrast' : ''}]: "${f.text}" ${f.path} is ${real === null ? f.estimate : Math.round(real * 100) / 100}:1, needs ${f.need}:1`);
          }
          if (process.stdout.isTTY) process.stdout.write(`  ${pg} ${t}/${c}: ${r.checked} checked`.padEnd(78) + '\r');
        } catch (e) { out.push(`${pg} [${t}/${c}]: could not be checked (${e.message})`); }
      }
    }
    if (process.stdout.isTTY) process.stdout.write(' '.repeat(80) + '\r');
    findings.contrast = [...new Set(out)]; say(`  ${findings.contrast.length} finding(s)`);
  }
} finally { b.close(); server.close(); }

const all = Object.entries(findings).flatMap(([k, v]) => v.map((x) => `${k.padEnd(9)} ${x}`));
if (OUT) fs.writeFileSync(path.resolve(OUT), JSON.stringify(findings, null, 1));
say('');
if (all.length) { for (const x of all) say('  ✗ ' + x); say(`\nAntz rendered audit: ${all.length} finding(s).${REPORT ? ' Report mode: not failing.' : ''}`); process.exit(REPORT ? 0 : 1); }
say('Antz rendered audit: clean. ✓');
