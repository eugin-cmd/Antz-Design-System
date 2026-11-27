/* Antz Design System · browser engine shared by the repository's audit (tools/audit.mjs) and the agent's
   /systemauditor (agent/scripts/antz.mjs audit). Chrome or Chromium over the DevTools protocol; Node 22+
   (built-in WebSocket); no npm packages. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';

export function findChrome() {
  const c = [process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
  const hit = c.find((p) => fs.existsSync(p));
  if (!hit) throw new Error('Chrome or Chromium not found. Set CHROME=/path/to/chrome.');
  return hit;
}

export async function browser() {
  const port = 9600 + Math.floor(Math.random() * 300);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'antz-audit-'));
  const proc = spawn(findChrome(), ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 80 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find((t) => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch {} if (!ws) await new Promise((r) => setTimeout(r, 200)); }
  if (!ws) throw new Error('Could not start Chrome.');
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(); const events = [];
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else events.push(m); });
  // Every command has a deadline: a reply Chrome never sends must fail the audit, not hang it for hours.
  const send = (method, params = {}, ms = 30000) => new Promise((res) => { const i = ++id; const t = setTimeout(() => { pending.delete(i); res({ timeout: true, method }); }, ms); pending.set(i, (m) => { clearTimeout(t); res(m); }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const b = {
    send, events,
    async goto(url, wait = 1600) {
      for (let attempt = 0; ; attempt++) {
        events.length = 0; const r = await send('Page.navigate', { url });
        if (!r.timeout) break;
        if (attempt) throw new Error(`Chrome did not answer when opening ${url} (twice, 30s each). Re-run the audit.`);
        await send('Page.stopLoading', {}, 5000);
      }
      await new Promise((r) => setTimeout(r, wait));
    },
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
export function decodePng(buf) {
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
export const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
export const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// In-page scan: real text colour against the composited background (colours, gradient stops, opacity).
export const makeScan = (IGNORE) => String.raw`(() => {
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
export async function pixelRatio(b, f) {
  const r = await b.eval(`(()=>{const e=document.querySelector('[data-audit-id="${f.id}"]');if(!e)return null;e.scrollIntoView({block:'center',behavior:'instant'});document.getAnimations().forEach((x)=>{try{x.finish()}catch(_){}});e.style.setProperty('color','transparent','important');e.style.setProperty('-webkit-text-fill-color','transparent','important');e.style.setProperty('text-shadow','none','important');const r=e.getBoundingClientRect();return {x:r.left,y:r.top+scrollY,w:r.width,h:r.height}})()`);
  if (!r) return null;
  // Wait for web fonts and two paint frames, so a late reflow or an unpainted frame is not measured
  await b.eval(`document.fonts.ready.then(()=>new Promise((res)=>requestAnimationFrame(()=>requestAnimationFrame(()=>res(1)))))`).catch(() => null);
  const r2 = await b.eval(`(()=>{const e=document.querySelector('[data-audit-id="${f.id}"]');const q=e.getBoundingClientRect();return {x:q.left,y:q.top+scrollY,w:q.width,h:q.height}})()`).catch(() => null);
  if (r2) Object.assign(r, r2);
  const shot = await b.send('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: Math.max(2, r.w), height: Math.max(2, r.h), scale: 1 }, captureBeyondViewport: true });
  await b.eval(`(()=>{const e=document.querySelector('[data-audit-id="${f.id}"]');e.style.removeProperty('color');e.style.removeProperty('-webkit-text-fill-color');e.style.removeProperty('text-shadow');return 1})()`);
  const px = decodePng(Buffer.from(shot.result.data, 'base64'));
  const m = f.fg.match(/rgba?\(([^)]+)\)/) || f.fg.match(/color\(srgb ([^)]+)\)/); const v = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
  const srgb = /color\(srgb/.test(f.fg), fg = srgb ? v.slice(0, 3).map((x) => x * 255) : v.slice(0, 3), a = v[3] === undefined ? 1 : v[3];
  const step = Math.max(1, Math.floor(px.length / 4000)), rs = [];
  for (let i = 0; i < px.length; i += step) { const p = px[i]; rs.push(ratio([0, 1, 2].map((k) => fg[k] * a + p[k] * (1 - a)), p)); }
  rs.sort((x, y) => x - y); return rs[Math.floor(rs.length / 10)];
}

