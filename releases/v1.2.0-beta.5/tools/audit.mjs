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
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

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

function findChrome() {
  const c = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
  const hit = c.find((p) => fs.existsSync(p));
  if (!hit) { console.error('Chrome or Chromium not found. Set CHROME=/path/to/chrome.'); process.exit(2); }
  return hit;
}
if (typeof WebSocket === 'undefined') { console.error('Node 22 or later is needed (built-in WebSocket).'); process.exit(2); }

async function browser() {
  const port = 9600 + Math.floor(Math.random() * 300);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'antz-audit-'));
  const proc = spawn(findChrome(), ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 80 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find((t) => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch {} if (!ws) await new Promise((r) => setTimeout(r, 200)); }
  if (!ws) { console.error('Could not start Chrome.'); process.exit(2); }
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(); const events = [];
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else events.push(m); });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const b = {
    send, events,
    async goto(url, wait = 1600) { events.length = 0; await send('Page.navigate', { url }); await new Promise((r) => setTimeout(r, wait)); },
    async eval(expr, ms = 25000) {
      const r = await Promise.race([send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), new Promise((res) => setTimeout(() => res({ timeout: true }), ms))]);
      if (r.timeout) throw new Error('timed out'); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 200));
      return r.result?.result?.value;
    },
    media: (features) => send('Emulation.setEmulatedMedia', { features }),
    close() { try { ws.close(); } catch {} proc.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} },
  };
  return b;
}

// Minimal PNG decoder (8-bit RGB/RGBA, non-interlaced: what Chrome produces)
function decodePng(buf) {
  let p = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    else if (type === 'IDAT') idat.push(data); else if (type === 'IEND') break;
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0, b = y ? out[(y - 1) * stride + x] : 0, c = x >= bpp && y ? out[(y - 1) * stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[y * stride + x] = v & 255;
    }
  }
  const px = []; for (let i = 0; i < out.length; i += bpp) px.push([out[i], out[i + 1], out[i + 2]]);
  return px;
}
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const nav = JSON.parse(fs.readFileSync(path.join(ROOT, 'pages/_nav.json'), 'utf8'));
const ALL = [...new Set(['index.html', ...nav.groups.flatMap((g) => g.links.map((l) => (l.href.startsWith('../') ? l.href.slice(3) : 'pages/' + l.href)))])]
  .filter((h) => fs.existsSync(path.join(ROOT, h)) && h !== 'pages/import-theme.html');
const PAGES = opt('--pages') ? opt('--pages').split(',') : ALL;
const MODES = [['light', 'standard'], ['dark', 'standard'], ['light', 'high'], ['dark', 'high']];
const FREEZE = `(()=>{const s=document.createElement('style');s.textContent='*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}.reveal-wait{opacity:1!important}';document.head.appendChild(s);document.querySelectorAll('.reveal-wait').forEach(e=>e.classList.remove('reveal-wait'));return 1})()`;

// In-page scan: real text colour against the composited background (colours, gradient stops, opacity).
const SCAN = String.raw`(() => {
  const IGN = ${JSON.stringify(IGNORE)};
  const parse = (s) => { if (!s) return null; let m = s.match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]; }
    m = s.match(/color\(srgb ([^)]+)\)/); if (m) { const p = m[1].split(/[ \/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] === undefined ? 1 : p[3]]; } return null; };
  const colorsIn = (img) => { const out = []; const re = /rgba?\([^)]+\)|color\(srgb [^)]+\)/g; let m; while ((m = re.exec(img))) out.push(parse(m[0])); return out.filter(Boolean); };
  const over = (t, b) => { const a = t[3] + b[3] * (1 - t[3]); if (!a) return [0, 0, 0, 0]; return [0, 1, 2].map((i) => (t[i] * t[3] + b[i] * b[3] * (1 - t[3])) / a).concat(a); };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  function bgs(el) {
    const layers = []; let e = el, opacity = 1;
    while (e && e.nodeType === 1) {
      const cs = getComputedStyle(e); opacity *= parseFloat(cs.opacity);
      const img = cs.backgroundImage, col = parse(cs.backgroundColor);
      if (img && img !== 'none') { if (/url\(/.test(img) && !/gradient/.test(img)) return { image: true, opacity }; const cl = colorsIn(img); layers.push({ grad: cl, col }); if ((col && col[3] >= 1) || cl.some((c) => c[3] >= 0.99)) break; }
      else if (col && col[3] > 0) { layers.push({ col }); if (col[3] >= 1) break; }
      e = e.parentElement;
    }
    let bases = [parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255, 1]];
    for (let i = layers.length - 1; i >= 0; i--) { const L = layers[i], next = []; for (const b of bases) { let bb = b; if (L.col && L.col[3] > 0) bb = over(L.col, bb); if (L.grad && L.grad.length) for (const g of L.grad) next.push(over(g, bb)); else next.push(bb); } bases = next.slice(0, 12); }
    return { list: bases, opacity };
  }
  const fails = []; let checked = 0, n = 0; const seen = new Set();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const t = w.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    if (el.closest('svg, script, style, noscript, [hidden], [aria-hidden="true"], .sr-only, .visually-hidden, option, template, ' + IGN)) continue;
    if (el.closest('button:disabled, [aria-disabled="true"], [disabled], label:has(input:disabled)')) continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (cs.backgroundClip === 'text') continue;
    const bg = bgs(el); if (bg.image || bg.opacity < 0.05) continue;
    const fg = parse(cs.color); if (!fg) continue;
    const size = parseFloat(cs.fontSize), wt = parseInt(cs.fontWeight, 10), need = size >= 24 || (size >= 18.66 && wt >= 700) ? 3 : 4.5;
    let worst = 99; for (const b of bg.list) { const f = fg[3] < 1 ? over(fg, b) : fg; worst = Math.min(worst, ratio(f, b)); }
    checked++;
    if (worst < need - 0.01) { el.setAttribute('data-audit-id', ++n); const p = []; let e = el; for (let i = 0; i < 3 && e && e !== document.body; i++) { p.unshift(e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : '')); e = e.parentElement; }
      fails.push({ id: n, text: t.textContent.trim().slice(0, 40), path: p.join(' > '), need, estimate: Math.round(worst * 100) / 100, fg: cs.color }); }
  }
  return { checked, fails };
})()`;

// Real pixels: hide the text, capture the box, take the 10th-percentile worst contrast against the text colour.
async function pixelRatio(b, f) {
  const r = await b.eval(`(()=>{const e=document.querySelector('[data-audit-id="${f.id}"]');if(!e)return null;e.scrollIntoView({block:'center',behavior:'instant'});document.getAnimations().forEach((x)=>{try{x.finish()}catch(_){}});e.style.setProperty('color','transparent','important');e.style.setProperty('-webkit-text-fill-color','transparent','important');e.style.setProperty('text-shadow','none','important');const r=e.getBoundingClientRect();return {x:r.left,y:r.top+scrollY,w:r.width,h:r.height}})()`);
  if (!r) return null;
  await new Promise((res) => setTimeout(res, 80));
  const shot = await b.send('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: Math.max(2, r.w), height: Math.max(2, r.h), scale: 1 }, captureBeyondViewport: true });
  await b.eval(`(()=>{const e=document.querySelector('[data-audit-id="${f.id}"]');e.style.removeProperty('color');e.style.removeProperty('-webkit-text-fill-color');e.style.removeProperty('text-shadow');return 1})()`);
  const px = decodePng(Buffer.from(shot.result.data, 'base64'));
  const m = f.fg.match(/rgba?\(([^)]+)\)/) || f.fg.match(/color\(srgb ([^)]+)\)/); const v = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
  const srgb = /color\(srgb/.test(f.fg), fg = srgb ? v.slice(0, 3).map((x) => x * 255) : v.slice(0, 3), a = v[3] === undefined ? 1 : v[3];
  const step = Math.max(1, Math.floor(px.length / 4000)), rs = [];
  for (let i = 0; i < px.length; i += step) { const p = px[i]; rs.push(ratio([0, 1, 2].map((k) => fg[k] * a + p[k] * (1 - a)), p)); }
  rs.sort((x, y) => x - y); return rs[Math.floor(rs.length / 10)];
}

const findings = {}; const say = (s) => process.stdout.write(s + '\n');
const b = await browser();
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
