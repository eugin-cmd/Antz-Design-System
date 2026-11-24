#!/usr/bin/env node
/**
 * ANTZ Line animated icons (proposal): an outline style for the Primary (module) icons.
 * Light even outlines in the text colour, one accent detail in a green-to-teal gradient, drawn on and settled with
 * the elastic ease. Original drawings on a 48px grid (live area 4–44), 1.5px round strokes: slim and even, shown at 48 to 72px.
 *
 *   node tools/primary-line.mjs     write icons/antz-rounded/primary-line/<name>.svg and index.json
 *
 * Colours come from tokens when the SVG is inline: ink is --color-text (follows light, dark and high contrast); the
 * accent runs --scale-primary-600 to --scale-secondary-600, which pass 3:1 on light and dark surfaces. As an <img>
 * the light fallbacks apply. Under reduced motion the
 * icon shows its final frame. Zero dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'icons/antz-rounded/primary-line');
const LOOP = 3600; // ms
const EASE = { draw: 'cubic-bezier(0.16, 1, 0.3, 1)', pop: 'cubic-bezier(0.34, 1.56, 0.64, 1)', sway: 'cubic-bezier(0.65, 0, 0.35, 1)' }; // --ease-out, --ease-elastic, --ease-in-out

/* Each icon: ink and accent shapes. A shape is [tag, attrs, motion?]. Motion: 'draw' (default), 'pop' (scale in),
   'rise' (bubbles), 'wiggle', 'swing', 'pulse'. `at` is when it starts, as a fraction of the draw phase. */
const ICONS = {
  home: { label: 'Home', module: 'Home', ink: [
      ['path', { d: 'M6 22 24 8l18 14' }],
      ['path', { d: 'M10 19v19a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V19' }, { at: 0.2 }],
      ['path', { d: 'M32 13V8h4v8' }, { at: 0.4 }],
      ['rect', { x: 29, y: 25, width: 6, height: 6, rx: 1 }, { at: 0.55 }],
      ['path', { d: 'M32 25v6M29 28h6' }, { at: 0.7 }],
    ], accent: [
      ['path', { d: 'M15 40v-9a4 4 0 0 1 8 0v9' }],
      ['circle', { cx: 34, cy: 5, r: 1.2 }, { motion: 'rise', at: 0.3, dist: 4 }],
      ['circle', { cx: 36.5, cy: 4.5, r: 0.9 }, { motion: 'rise', at: 0.6, dist: 3 }],
    ] },
  animals: { label: 'Animals', module: 'Animals and species', ink: [
      ['path', { d: 'M14 34c0-6 4.5-11 10-11s10 5 10 11c0 3.5-2.5 6-5.5 6-1.8 0-3-1.2-4.5-1.2S21.3 40 19.5 40C16.5 40 14 37.5 14 34Z' }],
    ], accent: [
      ['circle', { cx: 11, cy: 22, r: 3.2 }, { motion: 'pop', at: 0 }],
      ['circle', { cx: 18, cy: 13, r: 3.2 }, { motion: 'pop', at: 0.15 }],
      ['circle', { cx: 30, cy: 13, r: 3.2 }, { motion: 'pop', at: 0.3 }],
      ['circle', { cx: 37, cy: 22, r: 3.2 }, { motion: 'pop', at: 0.45 }],
    ] },
  medical: { label: 'Medical', module: 'Medical', ink: [
      ['rect', { x: 6, y: 16, width: 36, height: 24, rx: 4 }],
      ['path', { d: 'M18 16v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3' }, { at: 0.3 }],
      ['path', { d: 'M12 16v24M36 16v24' }, { at: 0.55 }],
    ], accent: [
      ['path', { d: 'M24 22v12M18 28h12' }, { motion: 'pulse' }],
    ] },
  lab: { label: 'Lab', module: 'Lab', ink: [
      ['path', { d: 'M18 7h12' }],
      ['path', { d: 'M21 7v11L10.6 36.2A3.2 3.2 0 0 0 13.4 41h21.2a3.2 3.2 0 0 0 2.8-4.8L27 18V7' }, { at: 0.15 }],
      ['path', { d: 'M27 12h2.5M27 16h2.5' }, { at: 0.6 }],
    ], accent: [
      ['path', { d: 'M15 30c3-1.5 6-1.5 9 0s6 1.5 9 0' }],
      ['circle', { cx: 21, cy: 35, r: 1.2 }, { motion: 'rise', at: 0.2 }],
      ['circle', { cx: 27, cy: 36, r: 1.2 }, { motion: 'rise', at: 0.5 }],
      ['circle', { cx: 24, cy: 37, r: 0.9 }, { motion: 'rise', at: 0.75 }],
    ] },
  eggs: { label: 'Eggs', module: 'Eggs', wiggle: true, ink: [
      ['path', { d: 'M24 7c-7 0-13 11.5-13 20a13 13 0 0 0 26 0c0-8.5-6-20-13-20Z' }],
      ['path', { d: 'M17 20c.8-2.5 2-4.6 3.5-6' }, { at: 0.6 }],
    ], accent: [
      ['path', { d: 'M15 27l4.5 3 4.5-4 4.5 4 4.5-3' }],
    ] },
  notifications: { label: 'Notifications', module: 'Notifications', swing: true, ink: [
      ['path', { d: 'M13 33V23a11 11 0 0 1 22 0v10l3.5 4h-29Z' }],
      ['path', { d: 'M24 12V9' }, { at: 0.3 }],
      ['path', { d: 'M20.5 41a3.5 3.5 0 0 0 7 0' }, { at: 0.45 }],
      ['path', { d: 'M17.5 23a6.5 6.5 0 0 1 4-6' }, { at: 0.65 }],
    ], accent: [
      ['path', { d: 'M7 17a17 17 0 0 1 5-7M41 17a17 17 0 0 0-5-7' }],
      ['circle', { cx: 35, cy: 13, r: 2.6 }, { motion: 'pop', at: 0.4 }],
    ] },
};

const pct = (x) => `${Math.round(x * 1000) / 10}%`;
function svgFor(name, ic) {
  const c = `antz-l-${name}`, kf = [], shapes = [];
  // Timeline (fractions of the loop): ink draws 0–0.30, accent 0.30–0.50, hold, fade 0.90–0.97, rest
  const phase = (from, to, at = 0) => from + (to - from) * at * 0.6;
  const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');
  let n = 0;
  const add = (cls, [tag, a, m = {}], from, to) => {
    const id = `${c}-${n++}`, motion = m.motion || 'draw', s = phase(from, to, m.at || 0), e = Math.min(s + (to - from) * 0.7, 0.88);
    const frames = {
      draw: `0%,${pct(s)}{stroke-dashoffset:1}${pct(e)},90%{stroke-dashoffset:0;opacity:1}97%,100%{stroke-dashoffset:0;opacity:0}`,
      pop: `0%,${pct(s)}{transform:scale(0);opacity:0}${pct(s + 0.01)}{opacity:1}${pct(s + 0.12)},90%{transform:scale(1);opacity:1}97%,100%{transform:scale(1);opacity:0}`,
      pulse: `0%,${pct(s)}{stroke-dashoffset:1;transform:scale(1)}${pct(e)}{stroke-dashoffset:0;transform:scale(1)}${pct(e + 0.08)}{transform:scale(1.18)}${pct(e + 0.2)},90%{stroke-dashoffset:0;transform:scale(1);opacity:1}97%,100%{opacity:0}`,
      rise: `0%,${pct(s)}{transform:translateY(0);opacity:0}${pct(s + 0.04)}{opacity:1}${pct(s + 0.3)}{transform:translateY(-${m.dist || 12}px);opacity:0}100%{opacity:0}`,
    }[motion];
    kf.push(`@keyframes ${id}{${frames}}`);
    const ease = motion === 'pop' || motion === 'pulse' ? EASE.pop : motion === 'rise' ? EASE.sway : EASE.draw;
    const isDraw = motion === 'draw' || motion === 'pulse';
    shapes.push(`<${tag} class="${cls} ${id}" ${attrs(a)}${isDraw ? ' pathLength="1"' : ''}/>`);
    return `.${id}{${isDraw ? 'stroke-dasharray:1;' : ''}animation:${id} ${LOOP}ms ${ease} infinite}`;
  };
  const rules = [...ic.ink.map((s) => add('i', s, 0, 0.3)), ...ic.accent.map((s) => add('a', s, 0.3, 0.5))];
  let group = '';
  if (ic.wiggle) { kf.push(`@keyframes ${c}-w{0%,52%{transform:rotate(0)}56%{transform:rotate(-7deg)}61%{transform:rotate(6deg)}66%{transform:rotate(-3deg)}71%,100%{transform:rotate(0)}}`); group = `.${c}-g{transform-origin:24px 40px;animation:${c}-w ${LOOP}ms ${EASE.sway} infinite}`; }
  if (ic.swing) { kf.push(`@keyframes ${c}-s{0%,52%{transform:rotate(0)}57%{transform:rotate(12deg)}63%{transform:rotate(-10deg)}69%{transform:rotate(6deg)}75%{transform:rotate(-3deg)}80%,100%{transform:rotate(0)}}`); group = `.${c}-g{transform-origin:24px 9px;animation:${c}-s ${LOOP}ms ${EASE.sway} infinite}`; }
  const style = [
    `.${c} .i,.${c} .a{fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;transform-box:fill-box;transform-origin:center}`,
    `.${c} .i{stroke:var(--antz-ink,var(--color-text,#0E1512))}`,
    `.${c} .a{stroke:url(#${c}-acc)}`,
    `.${c} .acc-a{stop-color:var(--antz-accent-a,var(--scale-primary-600,#21924E))}.${c} .acc-b{stop-color:var(--antz-accent-b,var(--scale-secondary-600,#00A698))}`,
    ...rules, group, ...kf,
    `@media (prefers-reduced-motion:reduce){.${c} *{animation:none!important;stroke-dashoffset:0!important;opacity:1!important;transform:none!important}}`,
  ].filter(Boolean).join('\n');
  const body = shapes.join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" class="${c}" role="img" aria-label="${ic.label}">
<defs><linearGradient id="${c}-acc" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop offset="0" class="acc-a"/><stop offset="1" class="acc-b"/></linearGradient></defs>
<style>
${style}
</style>
${group ? `<g class="${c}-g">\n${body}\n</g>` : body}
</svg>
`;
}

fs.mkdirSync(OUT, { recursive: true });
const index = { $description: 'ANTZ Line animated: proposal outline style for the Primary icons. Generated by tools/primary-line.mjs.', style: 'antz-line-animated', status: 'proposal', loopMs: LOOP, icons: [] };
for (const [name, ic] of Object.entries(ICONS)) {
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svgFor(name, ic));
  index.icons.push({ name, label: ic.label, module: ic.module, status: 'proposal', svg: `${name}.svg` });
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`✓ ANTZ Line animated: ${index.icons.length} icons in icons/antz-rounded/primary-line/`);
