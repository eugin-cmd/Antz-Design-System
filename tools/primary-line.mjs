#!/usr/bin/env node
/**
 * ANTZ Line animated icons (proposal): an outline style for the Primary (module) icons, plus interface icons with
 * micro-animations. Light even outlines in the text colour, one accent detail in a green-to-teal gradient, drawn on
 * and settled with the elastic ease. Original drawings on a 48px grid (live area 4–44), 1.5px round strokes: slim
 * and even, shown at 48 to 72px.
 *
 *   node tools/primary-line.mjs     write icons/antz-rounded/primary-line/<name>.svg and index.json
 *
 * Colours come from tokens when the SVG is inline: ink is --color-text (follows light, dark and high contrast); the
 * accent runs --scale-primary-600 to --scale-secondary-600, which pass 3:1 on light and dark surfaces. As an <img>
 * the light fallbacks apply. Under reduced motion the icon shows its final frame.
 *
 * Overlaps: a shape marked `front: true` knocks out whatever is behind it (a mask, with a 1.5px gap around its
 * outline), so it reads as solid on any background, light or dark, and the cut-out moves with its animation.
 * Zero dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'icons/antz-rounded/primary-line');
const LOOP = 3600; // ms
const EASE = { draw: 'cubic-bezier(0.16, 1, 0.3, 1)', pop: 'cubic-bezier(0.34, 1.56, 0.64, 1)', sway: 'cubic-bezier(0.65, 0, 0.35, 1)' }; // --ease-out, --ease-elastic, --ease-in-out

const r1 = (x) => Math.round(x * 10) / 10;
// A gear outline: n teeth between radii ri and ro
function gear(cx, cy, ro, ri, n) {
  const pts = [], w = Math.PI / n;
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n;
    for (const [rad, da] of [[ri, -w * 0.62], [ro, -w * 0.38], [ro, w * 0.38], [ri, w * 0.62]]) pts.push([cx + rad * Math.cos(a + da), cy + rad * Math.sin(a + da)]);
  }
  return 'M' + pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L') + 'Z';
}
// A five-point star
function star(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r : R; pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]); }
  return 'M' + pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L') + 'Z';
}

// Short rays around a centre, from radius ra to rb, n of them, skipping angles in `skip` (degrees)
function rays(cx, cy, ra, rb, n, skip = []) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const deg = (i * 360) / n; if (skip.includes(deg)) continue;
    const a = (deg * Math.PI) / 180;
    d += `M${r1(cx + ra * Math.cos(a))} ${r1(cy + ra * Math.sin(a))}L${r1(cx + rb * Math.cos(a))} ${r1(cy + rb * Math.sin(a))}`;
  }
  return d;
}

/* Each icon: ink and accent shapes. A shape is [tag, attrs, motion?].
   Motions: 'draw' (default), 'pop' (scale in), 'pulse' (draw, then a beat), 'rise' (drifts up and fades),
   'move' (comes in from `from`, a CSS transform, and settles elastically; `origin` sets the pivot).
   `at` is when it starts within its phase. Icon options: wiggle, swing, spin, blink, bounce (whole-icon motion). */
const ICONS = {
  // ── Primary (module) icons, in the Tile set's order ──
  home: { label: 'Home', module: 'Home', ink: [
      ['path', { d: 'M6 22 24 8l18 14' }],
      ['path', { d: 'M10 19v19a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V19' }, { at: 0.2 }],
      ['path', { d: 'M32 14.2V10h4v7.3' }, { at: 0.4 }],
      ['rect', { x: 29, y: 25, width: 6, height: 6, rx: 1 }, { at: 0.55 }],
      ['path', { d: 'M32 25v6M29 28h6' }, { at: 0.7 }],
    ], accent: [
      ['path', { d: 'M15 40v-9a4 4 0 0 1 8 0v9' }],
      ['circle', { cx: 34, cy: 6, r: 1.1 }, { motion: 'rise', at: 0.3, dist: 3 }],
      ['circle', { cx: 36.5, cy: 5, r: 0.8 }, { motion: 'rise', at: 0.6, dist: 2.5 }],
    ] },
  dashboard: { label: 'Dashboard', module: 'Dashboard (web home)', ink: [
      ['rect', { x: 7, y: 7, width: 15, height: 15, rx: 3 }],
      ['rect', { x: 26, y: 7, width: 15, height: 9, rx: 3 }, { at: 0.2 }],
      ['rect', { x: 7, y: 26, width: 15, height: 15, rx: 3 }, { at: 0.4 }],
      ['rect', { x: 26, y: 20, width: 15, height: 21, rx: 3 }, { at: 0.6 }],
    ], accent: [
      ['path', { d: 'M29.5 35l3-4 3 2 3-5' }],
      ['circle', { cx: 14.5, cy: 14.5, r: 3 }, { motion: 'pop', at: 0.4 }],
    ] },
  animals: { label: 'Animals', module: 'Animals and species', ink: [
      ['path', { d: 'M14 34c0-6 4.5-11 10-11s10 5 10 11c0 3.5-2.5 6-5.5 6-1.8 0-3-1.2-4.5-1.2S21.3 40 19.5 40C16.5 40 14 37.5 14 34Z' }],
    ], accent: [
      ['circle', { cx: 11, cy: 22, r: 3.2 }, { motion: 'pop', at: 0 }],
      ['circle', { cx: 18, cy: 13, r: 3.2 }, { motion: 'pop', at: 0.15 }],
      ['circle', { cx: 30, cy: 13, r: 3.2 }, { motion: 'pop', at: 0.3 }],
      ['circle', { cx: 37, cy: 22, r: 3.2 }, { motion: 'pop', at: 0.45 }],
    ] },
  species: { label: 'Species', module: 'Species / taxonomy', ink: [
      ['path', { d: 'M9 33V11a4 4 0 0 1 4-4h19' }],
      ['rect', { x: 14, y: 12, width: 26, height: 29, rx: 4 }, { at: 0.3 }],
    ], accent: [
      ['path', { d: 'M21.5 33c0-2.8 2.2-5 5-5s5 2.2 5 5c0 1.7-1.2 3-2.8 3-1 0-1.4-.6-2.2-.6s-1.2.6-2.2.6c-1.6 0-2.8-1.3-2.8-3Z' }],
      ['circle', { cx: 20.5, cy: 25, r: 1.6 }, { motion: 'pop', at: 0.2 }],
      ['circle', { cx: 24.5, cy: 21, r: 1.6 }, { motion: 'pop', at: 0.35 }],
      ['circle', { cx: 28.5, cy: 21, r: 1.6 }, { motion: 'pop', at: 0.5 }],
      ['circle', { cx: 32.5, cy: 25, r: 1.6 }, { motion: 'pop', at: 0.65 }],
    ] },
  family_tree: { label: 'Family tree', module: 'Family tree / parentage', ink: [
      ['rect', { x: 18, y: 6, width: 12, height: 9, rx: 3 }],
      ['circle', { cx: 12, cy: 35, r: 5 }, { at: 0.4 }],
      ['circle', { cx: 36, cy: 35, r: 5 }, { at: 0.55 }],
    ], accent: [
      ['path', { d: 'M24 15v6M12 30v-9h24v9' }],
      ['circle', { cx: 24, cy: 21, r: 1.5 }, { motion: 'pop', at: 0.5 }],
    ] },
  medical: { label: 'Medical', module: 'Medical', ink: [
      ['rect', { x: 6, y: 16, width: 36, height: 24, rx: 4 }],
      ['path', { d: 'M18 16v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3' }, { at: 0.3 }],
      ['path', { d: 'M12 16v24M36 16v24' }, { at: 0.55 }],
    ], accent: [
      ['path', { d: 'M24 22v12M18 28h12' }, { motion: 'pulse' }],
    ] },
  hospital: { label: 'Hospital', module: 'Hospital admissions', ink: [
      ['path', { d: 'M10 40V16a3 3 0 0 1 3-3h22a3 3 0 0 1 3 3v24' }],
      ['path', { d: 'M6 40h36' }, { at: 0.2 }],
      ['path', { d: 'M20 40v-7h8v7' }, { at: 0.45 }],
      ['path', { d: 'M14 30h3M31 30h3M14 35h3M31 35h3' }, { at: 0.65 }],
    ], accent: [
      ['path', { d: 'M24 17v8M20 21h8' }, { motion: 'pulse' }],
    ] },
  pharmacy: { label: 'Pharmacy', module: 'Pharmacy', wiggle: true, ink: [
      ['rect', { x: 15, y: 6, width: 18, height: 6, rx: 2 }],
      ['path', { d: 'M17 12v25a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4V12' }, { at: 0.25 }],
      ['rect', { x: 19, y: 20, width: 10, height: 12, rx: 1.5 }, { at: 0.55 }],
    ], accent: [
      ['path', { d: 'M24 23v6M21 26h6' }, { motion: 'pulse' }],
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
  housing: { label: 'Housing', module: 'Housing: site, section, enclosure', ink: [
      ['path', { d: 'M6 22 24 9l18 13' }],
      ['path', { d: 'M10 19v21M38 19v21M6 40h36' }, { at: 0.25 }],
      ['path', { d: 'M10 28h8M30 28h8M10 34h8M30 34h8' }, { at: 0.55 }],
    ], accent: [
      ['path', { d: 'M18 40V28a6 6 0 0 1 12 0v12' }, { front: true }],
      ['circle', { cx: 26.5, cy: 34, r: 1 }, { motion: 'pop', at: 0.5, front: true }],
    ] },
  move_animal: { label: 'Move animal', module: 'Move animal between enclosures', ink: [
      ['rect', { x: 5, y: 22, width: 14, height: 18, rx: 3 }],
      ['rect', { x: 29, y: 22, width: 14, height: 18, rx: 3 }, { at: 0.3 }],
      ['path', { d: 'M5 30h14M29 30h14' }, { at: 0.6 }],
    ], accent: [
      ['path', { d: 'M13 13h21M30 9l4 4-4 4' }, { motion: 'move', from: 'translateX(-7px)' }],
    ] },
  diet: { label: 'Diet', module: 'Diet', ink: [
      ['path', { d: 'M7 26h34c0 8.3-7.6 14-17 14S7 34.3 7 26Z' }],
      ['path', { d: 'M19 43h10' }, { at: 0.5 }],
    ], accent: [
      ['path', { d: 'M24 21c0-5.5 3.5-9.5 9-10.5 0 5.5-3.5 9.5-9 10.5Z' }],
      ['path', { d: 'M24 26v-5' }, { at: 0.4 }],
    ] },
  kitchen: { label: 'Kitchen', module: 'Kitchen', ink: [
      ['path', { d: 'M10 23h28v11a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6Z' }],
      ['path', { d: 'M7 23h34M10 27H6M38 27h4' }, { at: 0.3 }],
      ['path', { d: 'M21 19h6' }, { at: 0.55 }],
    ], accent: [
      ['path', { d: 'M18 15c-1.5-2 1.5-3.5 0-6' }],
      ['path', { d: 'M24 15c-1.5-2 1.5-3.5 0-6' }, { at: 0.3 }],
      ['path', { d: 'M30 15c-1.5-2 1.5-3.5 0-6' }, { at: 0.6 }],
    ] },
  mortality: { label: 'Mortality', module: 'Mortality', ink: [
      ['path', { d: 'M14 40V18a10 10 0 0 1 20 0v22' }],
      ['path', { d: 'M7 40h34' }, { at: 0.3 }],
      ['path', { d: 'M20 17h8M20 21.5h8' }, { at: 0.55 }],
    ], accent: [
      ['path', { d: 'M24 37v-6' }],
      ['path', { d: 'M24 32.5c-2.8 0-4.5-1.8-4.5-4.5 2.8 0 4.5 1.8 4.5 4.5Zm0-1.5c0-2.8 1.8-4.5 4.5-4.5 0 2.8-1.8 4.5-4.5 4.5Z' }, { at: 0.35 }],
    ] },
  necropsy: { label: 'Necropsy', module: 'Necropsy', ink: [
      ['rect', { x: 8, y: 9, width: 24, height: 32, rx: 3 }],
      ['path', { d: 'M15 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2' }, { at: 0.25 }],
      ['path', { d: 'M13 18h14M13 23h10M13 28h6' }, { at: 0.5 }],
    ], accent: [
      ['circle', { cx: 31, cy: 31, r: 6 }, { motion: 'move', from: 'translate(-5px,-5px)', origin: '31px 31px', front: true }],
      ['path', { d: 'M35.5 35.5 41 41' }, { motion: 'move', from: 'translate(-5px,-5px)', at: 0.1, front: true }],
    ] },
  assessments: { label: 'Assessments', module: 'Assessments', ink: [
      ['rect', { x: 10, y: 9, width: 28, height: 32, rx: 3 }],
      ['rect', { x: 18, y: 6, width: 12, height: 6, rx: 2 }, { at: 0.25 }],
      ['path', { d: 'M23 21h10M23 30h10' }, { at: 0.5 }],
    ], accent: [
      ['path', { d: 'M15 21l2 2 3-3.5' }],
      ['path', { d: 'M15 30l2 2 3-3.5' }, { at: 0.45 }],
    ] },
  transfers: { label: 'Transfers', module: 'Transfers', ink: [
      ['path', { d: 'M40 31H10M16 25l-6 6 6 6' }],
    ], accent: [
      ['path', { d: 'M8 17h30M32 11l6 6-6 6' }, { motion: 'move', from: 'translateX(-7px)' }],
    ] },
  requests: { label: 'Requests', module: 'Requests and approvals', ink: [
      ['path', { d: 'M12 6h15l9 9v25a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z' }],
      ['path', { d: 'M27 6v9h9' }, { at: 0.3 }],
      ['path', { d: 'M15 22h13M15 27h8' }, { at: 0.55 }],
    ], accent: [
      ['circle', { cx: 32, cy: 35, r: 6 }, { motion: 'pop', front: true }],
      ['path', { d: 'M29.5 35l2 2 3.5-4' }, { at: 0.4, front: true }],
    ] },
  notes: { label: 'Notes', module: 'Notes and journal', ink: [
      ['rect', { x: 8, y: 7, width: 24, height: 34, rx: 3 }],
      ['path', { d: 'M13 16h14M13 22h14M13 28h8' }, { at: 0.4 }],
    ], accent: [
      ['path', { d: 'M28 41v-4l11-11 4 4-11 11Z' }, { motion: 'move', from: 'translate(5px,-5px) rotate(12deg)', front: true }],
      ['path', { d: 'M36 29l4 4' }, { motion: 'move', from: 'translate(5px,-5px)', at: 0.05, front: true }],
    ] },
  announcements: { label: 'Announcements', module: 'Announcements', ink: [
      ['path', { d: 'M14 18h-4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4Z' }],
      ['path', { d: 'M14 18l14-8v28l-14-8' }, { at: 0.3 }],
    ], accent: [
      ['path', { d: 'M33 19a6.5 6.5 0 0 1 0 10' }],
      ['path', { d: 'M37 14a13 13 0 0 1 0 20' }, { at: 0.4 }],
    ] },
  notifications: { label: 'Notifications', module: 'Notifications', swing: true, ink: [
      ['path', { d: 'M13 33V23a11 11 0 0 1 22 0v10l3.5 4h-29Z' }],
      ['path', { d: 'M24 12V9' }, { at: 0.3 }],
      ['path', { d: 'M20.5 41a3.5 3.5 0 0 0 7 0' }, { at: 0.45 }],
      ['path', { d: 'M17.5 23a6.5 6.5 0 0 1 4-6' }, { at: 0.65 }],
    ], accent: [
      ['path', { d: 'M7 17a17 17 0 0 1 5-7M41 17a17 17 0 0 0-5-7' }],
      ['circle', { cx: 35, cy: 13, r: 2.6 }, { motion: 'pop', at: 0.4, front: true }],
    ] },
  chat: { label: 'Chat', module: 'Chat', ink: [
      ['path', { d: 'M12 8h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H22l-8 7v-7h-2a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z' }],
    ], accent: [
      ['circle', { cx: 17, cy: 20, r: 1.6 }, { motion: 'pop', at: 0 }],
      ['circle', { cx: 24, cy: 20, r: 1.6 }, { motion: 'pop', at: 0.25 }],
      ['circle', { cx: 31, cy: 20, r: 1.6 }, { motion: 'pop', at: 0.5 }],
    ] },
  reports: { label: 'Reports', module: 'Reports and insights', ink: [
      ['path', { d: 'M8 7v31a2 2 0 0 0 2 2h31' }],
    ], accent: [
      ['path', { d: 'M16 33v-8' }, { motion: 'move', from: 'scaleY(0)', origin: '16px 33px' }],
      ['path', { d: 'M24 33V17' }, { motion: 'move', from: 'scaleY(0)', origin: '24px 33px', at: 0.2 }],
      ['path', { d: 'M32 33V22' }, { motion: 'move', from: 'scaleY(0)', origin: '32px 33px', at: 0.4 }],
      ['path', { d: 'M40 33V12' }, { motion: 'move', from: 'scaleY(0)', origin: '40px 33px', at: 0.6 }],
    ] },
  staff: { label: 'Staff', module: 'Staff and keepers', ink: [
      ['circle', { cx: 24, cy: 15, r: 7 }],
      ['path', { d: 'M10 41v-2a9 9 0 0 1 9-9h10a9 9 0 0 1 9 9v2' }, { at: 0.35 }],
    ], accent: [
      ['rect', { x: 20.5, y: 33.5, width: 7, height: 5, rx: 1.5 }, { motion: 'pop' }],
      ['path', { d: 'M22.8 36h2.4' }, { at: 0.45 }],
    ] },
  department: { label: 'Department', module: 'Departments', ink: [
      ['path', { d: 'M6 18 24 8l18 10Z' }],
      ['path', { d: 'M8 38h32M6 42h36' }, { at: 0.3 }],
    ], accent: [
      ['path', { d: 'M12 23v11' }],
      ['path', { d: 'M20 23v11' }, { at: 0.2 }],
      ['path', { d: 'M28 23v11' }, { at: 0.4 }],
      ['path', { d: 'M36 23v11' }, { at: 0.6 }],
    ] },
  security: { label: 'Security', module: 'Security', ink: [
      ['path', { d: 'M24 6l14 5v11c0 9-6 15-14 20-8-5-14-11-14-20V11Z' }],
    ], accent: [
      ['path', { d: 'M18 24l4 4 8-8' }, { motion: 'pulse' }],
    ] },
  compliance: { label: 'Compliance', module: 'Compliance', ink: [
      ['rect', { x: 6, y: 8, width: 32, height: 24, rx: 3 }],
      ['path', { d: 'M12 16h20M12 22h11' }, { at: 0.45 }],
    ], accent: [
      ['circle', { cx: 33, cy: 31, r: 5 }, { motion: 'pop', front: true }],
      ['path', { d: 'M30 35.5 28 42l5-2.5 5 2.5-2-6.5' }, { at: 0.4, front: true }],
    ] },
  activity_log: { label: 'Activity log', module: 'Activity log', ink: [
      ['path', { d: 'M8.5 27A16 16 0 1 0 12.7 12.7L8 17' }],
      ['path', { d: 'M8 9v8h8' }, { at: 0.5 }],
    ], accent: [
      ['path', { d: 'M24 15v10l6 4' }, { motion: 'move', from: 'rotate(-60deg)', origin: '24px 25px' }],
    ] },
  settings: { label: 'Settings', module: 'Settings and masters', spin: true, ink: [
      ['path', { d: gear(24, 24, 17, 13, 8) }],
    ], accent: [
      ['circle', { cx: 24, cy: 24, r: 5.5 }, { motion: 'pop' }],
    ] },

  // ── Interface icons with micro-animations ──
  search: { set: 'ui', label: 'Search', module: 'Interface', wiggle: true, ink: [
      ['circle', { cx: 21, cy: 21, r: 13 }],
      ['path', { d: 'M30.5 30.5 41 41' }, { at: 0.5 }],
    ], accent: [
      ['path', { d: 'M14 18a8 8 0 0 1 5-5' }],
    ] },
  refresh: { set: 'ui', label: 'Refresh', module: 'Interface', spin: true, ink: [
      ['path', { d: 'M39 20A15.5 15.5 0 0 0 11 15' }],
      ['path', { d: 'M9 28a15.5 15.5 0 0 0 28 5' }, { at: 0.3 }],
    ], accent: [
      ['path', { d: 'M11 8v7h7' }],
      ['path', { d: 'M37 40v-7h-7' }, { at: 0.3 }],
    ] },
  download: { set: 'ui', label: 'Download', module: 'Interface', ink: [
      ['path', { d: 'M8 30v6a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4v-6' }],
    ], accent: [
      ['path', { d: 'M24 8v21M16 21l8 8 8-8' }, { motion: 'move', from: 'translateY(-9px)' }],
    ] },
  upload: { set: 'ui', label: 'Upload', module: 'Interface', ink: [
      ['path', { d: 'M8 30v6a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4v-6' }],
    ], accent: [
      ['path', { d: 'M24 29V8M16 16l8-8 8 8' }, { motion: 'move', from: 'translateY(9px)' }],
    ] },
  success: { set: 'ui', label: 'Success', module: 'Interface', ink: [
      ['circle', { cx: 24, cy: 24, r: 17 }],
    ], accent: [
      ['path', { d: 'M16 24.5l5.5 5.5L32 19' }, { motion: 'pulse' }],
    ] },
  delete: { set: 'ui', label: 'Delete', module: 'Interface', ink: [
      ['path', { d: 'M12 15l2 23a3 3 0 0 0 3 2.8h14a3 3 0 0 0 3-2.8l2-23' }],
      ['path', { d: 'M21 21v13M27 21v13' }, { at: 0.5 }],
    ], accent: [
      ['path', { d: 'M8 15h32M19 15v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4' }, { motion: 'move', from: 'translateY(-6px) rotate(-14deg)', origin: '8px 15px' }],
    ] },
  favourite: { set: 'ui', label: 'Favourite', module: 'Interface', ink: [], accent: [
      ['path', { d: 'M24 40S7 30.5 7 18.5A9.5 9.5 0 0 1 24 13a9.5 9.5 0 0 1 17 5.5C41 30.5 24 40 24 40Z' }, { motion: 'pulse' }],
    ] },
  calendar: { set: 'ui', label: 'Calendar', module: 'Interface', ink: [
      ['rect', { x: 7, y: 11, width: 34, height: 30, rx: 4 }],
      ['path', { d: 'M16 7v8M32 7v8M7 19h34' }, { at: 0.4 }],
    ], accent: [
      ['circle', { cx: 16, cy: 27, r: 1.6 }, { motion: 'pop', at: 0 }],
      ['circle', { cx: 24, cy: 27, r: 1.6 }, { motion: 'pop', at: 0.15 }],
      ['circle', { cx: 32, cy: 27, r: 1.6 }, { motion: 'pop', at: 0.3 }],
      ['circle', { cx: 16, cy: 34, r: 1.6 }, { motion: 'pop', at: 0.45 }],
      ['circle', { cx: 24, cy: 34, r: 1.6 }, { motion: 'pop', at: 0.6 }],
    ] },
  send: { set: 'ui', label: 'Send', module: 'Interface', ink: [
      ['path', { d: 'M8 35l5-5M13 41l3-3' }],
    ], accent: [
      ['path', { d: 'M41 7 7 20.5l13 5.5 5.5 13ZM41 7 20 26' }, { motion: 'move', from: 'translate(-8px,8px)' }],
    ] },
  lock: { set: 'ui', label: 'Lock', module: 'Interface', ink: [
      ['rect', { x: 10, y: 22, width: 28, height: 20, rx: 4 }],
      ['path', { d: 'M24 30v4' }, { at: 0.5 }],
    ], accent: [
      ['path', { d: 'M16 22v-6a8 8 0 0 1 16 0v6' }, { motion: 'move', from: 'translateY(-5px)' }],
    ] },
  visibility: { set: 'ui', label: 'Visibility', module: 'Interface', blink: true, ink: [
      ['path', { d: 'M4 24s7.5-13 20-13 20 13 20 13-7.5 13-20 13S4 24 4 24Z' }],
    ], accent: [
      ['circle', { cx: 24, cy: 24, r: 6 }, { motion: 'pop' }],
    ] },
  location: { set: 'ui', label: 'Location', module: 'Interface', bounce: true, ink: [
      ['path', { d: 'M24 42s-13-11.5-13-21a13 13 0 0 1 26 0c0 9.5-13 21-13 21Z' }],
    ], accent: [
      ['circle', { cx: 24, cy: 21, r: 4.5 }, { motion: 'pop' }],
    ] },
  alert: { set: 'ui', label: 'Alert', module: 'Interface', wiggle: true, ink: [
      ['path', { d: 'M21.4 8.5a3 3 0 0 1 5.2 0l15 26a3 3 0 0 1-2.6 4.5H9a3 3 0 0 1-2.6-4.5Z' }],
    ], accent: [
      ['path', { d: 'M24 19v9' }],
      ['circle', { cx: 24, cy: 33, r: 0.9 }, { motion: 'pop', at: 0.5 }],
    ] },
  star: { set: 'ui', label: 'Star', module: 'Interface', ink: [
      ['path', { d: star(23, 25, 16, 7) }],
    ], accent: [
      ['path', { d: 'M39 6v5M36.5 8.5h5' }, { motion: 'pop' }],
      ['path', { d: 'M41 17v3M39.5 18.5h3' }, { motion: 'pop', at: 0.4 }],
    ] },
  camera: { set: 'ui', label: 'Camera', module: 'Interface', ink: [
      ['path', { d: 'M6 17a3 3 0 0 1 3-3h6l3-4h12l3 4h6a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z' }],
      ['circle', { cx: 24, cy: 26, r: 7.5 }, { at: 0.5 }],
    ], accent: [
      ['circle', { cx: 24, cy: 26, r: 3 }, { motion: 'pop' }],
      ['circle', { cx: 36, cy: 19.5, r: 1 }, { motion: 'pop', at: 0.4 }],
    ] },
  add: { set: 'ui', label: 'Add', module: 'Interface', ink: [
      ['circle', { cx: 24, cy: 24, r: 17 }],
    ], accent: [
      ['path', { d: 'M24 16v16M16 24h16' }, { motion: 'move', from: 'rotate(-90deg) scale(0)', origin: '24px 24px' }],
    ] },
  // ── More interface icons ──
  filter: { set: 'ui', label: 'Filter', module: 'Interface', ink: [
      ['path', { d: 'M8 9h32L28 23v13l-8 4V23Z' }],
    ], accent: [
      ['path', { d: 'M17 15h14' }],
    ] },
  sort: { set: 'ui', label: 'Sort', module: 'Interface', ink: [
      ['path', { d: 'M16 8v32M10 34l6 6 6-6' }],
    ], accent: [
      ['path', { d: 'M32 40V8M26 14l6-6 6 6' }, { motion: 'move', from: 'translateY(7px)' }],
    ] },
  edit: { set: 'ui', label: 'Edit', module: 'Interface', ink: [
      ['path', { d: 'M8 41h20' }],
    ], accent: [
      ['path', { d: 'M30 9l7 7-19 19h-7v-7Z' }, { motion: 'move', from: 'translate(-5px,5px) rotate(-8deg)' }],
      ['path', { d: 'M26 13l7 7' }, { motion: 'move', from: 'translate(-5px,5px)', at: 0.05 }],
    ] },
  share: { set: 'ui', label: 'Share', module: 'Interface', ink: [
      ['circle', { cx: 34, cy: 11, r: 5 }, { motion: 'pop' }],
      ['circle', { cx: 14, cy: 24, r: 5 }, { motion: 'pop', at: 0.3 }],
      ['circle', { cx: 34, cy: 37, r: 5 }, { motion: 'pop', at: 0.6 }],
    ], accent: [
      ['path', { d: 'M19.9 20.2 28.1 14.8' }],
      ['path', { d: 'M19.9 27.8 28.1 33.2' }, { at: 0.4 }],
    ] },
  copy: { set: 'ui', label: 'Copy', module: 'Interface', ink: [
      ['path', { d: 'M13 30h-1a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v2' }],
    ], accent: [
      ['rect', { x: 18, y: 18, width: 22, height: 22, rx: 3 }, { motion: 'move', from: 'translate(-6px,-6px)' }],
    ] },
  print: { set: 'ui', label: 'Print', module: 'Interface', ink: [
      ['path', { d: 'M12 33H9a3 3 0 0 1-3-3V19a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3h-3' }],
      ['path', { d: 'M14 16V7h20v9' }, { at: 0.4 }],
      ['circle', { cx: 37, cy: 22, r: 1 }, { motion: 'pop', at: 0.7 }],
    ], accent: [
      ['path', { d: 'M14 27h20v14H14Z' }, { motion: 'move', from: 'translateY(-7px)' }],
      ['path', { d: 'M18 32h12M18 36h8' }, { motion: 'move', from: 'translateY(-7px)', at: 0.05 }],
    ] },
  logout: { set: 'ui', label: 'Log out', module: 'Interface', ink: [
      ['path', { d: 'M20 8h-9a3 3 0 0 0-3 3v26a3 3 0 0 0 3 3h9' }],
    ], accent: [
      ['path', { d: 'M18 24h22M33 17l7 7-7 7' }, { motion: 'move', from: 'translateX(-7px)' }],
    ] },
  link: { set: 'ui', label: 'Link', module: 'Interface', ink: [
      ['path', { d: 'M22 15l3-3a7 7 0 0 1 10 10l-3 3' }],
      ['path', { d: 'M26 33l-3 3a7 7 0 0 1-10-10l3-3' }, { at: 0.4 }],
    ], accent: [
      ['path', { d: 'M20 28l8-8' }, { motion: 'pulse' }],
    ] },
  attach: { set: 'ui', label: 'Attach', module: 'Interface', ink: [], accent: [
      ['path', { d: 'M32 15 18.5 28.5a3.5 3.5 0 0 0 5 5l14-14a7 7 0 0 0-10-10l-14 14a10.5 10.5 0 0 0 15 15L40 27' }],
    ] },
  mic: { set: 'ui', label: 'Microphone', module: 'Interface', ink: [
      ['rect', { x: 18, y: 6, width: 12, height: 22, rx: 6 }],
      ['path', { d: 'M11 22a13 13 0 0 0 26 0M24 35v6M18 41h12' }, { at: 0.4 }],
    ], accent: [
      ['path', { d: 'M22 14h4M22 19h4' }, { motion: 'pulse' }],
    ] },
  folder: { set: 'ui', label: 'Folder', module: 'Interface', ink: [
      ['path', { d: 'M6 14a3 3 0 0 1 3-3h9l4 4h17a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z' }],
    ], accent: [
      ['path', { d: 'M13 24h22' }],
      ['path', { d: 'M13 31h13' }, { at: 0.4 }],
    ] },
  bookmark: { set: 'ui', label: 'Bookmark', module: 'Interface', ink: [
      ['path', { d: 'M13 7h22a2 2 0 0 1 2 2v32l-13-9-13 9V9a2 2 0 0 1 2-2Z' }],
    ], accent: [
      ['path', { d: star(24, 19.5, 6, 2.6) }, { motion: 'pop' }],
    ] },

  // ── Animal care and operations ──
  vaccine: { set: 'care', label: 'Vaccine', module: 'Animal care', ink: [
      ['rect', { x: 18, y: 13, width: 12, height: 22, rx: 2 }],
      ['path', { d: 'M24 35v7' }, { at: 0.5 }],
      ['path', { d: 'M18 19h3M18 24h3M18 29h3' }, { at: 0.7 }],
    ], accent: [
      ['path', { d: 'M19 6h10M24 6v7' }, { motion: 'move', from: 'translateY(-5px)' }],
      ['path', { d: 'M25 24v8' }, { motion: 'move', from: 'scaleY(0)', origin: '25px 32px', at: 0.3 }],
    ] },
  pill: { set: 'care', label: 'Pill', module: 'Animal care', wiggle: true, ink: [
      ['path', { d: 'M20.5 36 36 20.5A6 6 0 0 0 27.5 12L12 27.5A6 6 0 0 0 20.5 36Z' }], // capsule at 45°, drawn as a path (no transform attribute)
    ], accent: [
      ['path', { d: 'M19.8 19.8 28.2 28.2' }],
      ['path', { d: 'M38 34v5M35.5 36.5h5' }, { motion: 'pop', at: 0.5 }],
    ] },
  vitals: { set: 'care', label: 'Vital signs', module: 'Animal care', ink: [
      ['path', { d: 'M24 40S7 30.5 7 18.5A9.5 9.5 0 0 1 24 13a9.5 9.5 0 0 1 17 5.5C41 30.5 24 40 24 40Z' }],
    ], accent: [
      ['path', { d: 'M4 25h9l3-6 5 12 4-10 3 4h16' }, { front: true }],
    ] },
  thermometer: { set: 'care', label: 'Temperature', module: 'Animal care', ink: [
      ['path', { d: 'M20 28V10a4 4 0 0 1 8 0v18a8 8 0 1 1-8 0Z' }],
      ['path', { d: 'M32 12h3M32 17h3M32 22h3' }, { at: 0.6 }],
    ], accent: [
      ['circle', { cx: 24, cy: 34, r: 3 }, { motion: 'pop' }],
      ['path', { d: 'M24 31V16' }, { motion: 'move', from: 'scaleY(0)', origin: '24px 31px', at: 0.3 }],
    ] },
  weight: { set: 'care', label: 'Weight', module: 'Animal care', ink: [
      ['rect', { x: 7, y: 10, width: 34, height: 30, rx: 5 }],
      ['path', { d: 'M15 26a9 9 0 0 1 18 0' }, { at: 0.5 }],
    ], accent: [
      ['path', { d: 'M24 26l4-6' }, { motion: 'move', from: 'rotate(-80deg)', origin: '24px 26px' }],
      ['circle', { cx: 24, cy: 26, r: 1.2 }, { motion: 'pop', at: 0.2 }],
    ] },
  water: { set: 'care', label: 'Water', module: 'Animal care', bounce: true, ink: [
      ['path', { d: 'M24 6s12 13.5 12 22a12 12 0 0 1-24 0c0-8.5 12-22 12-22Z' }],
    ], accent: [
      ['path', { d: 'M18 29a6 6 0 0 0 5 5.5' }],
    ] },
  weather: { set: 'care', label: 'Weather', module: 'Animal care', ink: [
      ['path', { d: 'M15 40h20a7 7 0 0 0 .6-14A9.5 9.5 0 0 0 17 28.6 5.8 5.8 0 0 0 15 40Z' }, { front: true }],
    ], accent: [
      ['circle', { cx: 17, cy: 16, r: 5.5 }, { motion: 'pop' }],
      ['path', { d: rays(17, 16, 9, 12, 8) }, { motion: 'pop', at: 0.4 }],
    ] },
  feather: { set: 'care', label: 'Birds', module: 'Animal care', wiggle: true, ink: [
      ['path', { d: 'M39 9c-15.5 0-26 10.5-26 26 15.5 0 26-10.5 26-26Z' }],
    ], accent: [
      ['path', { d: 'M8 40 30 18' }],
      ['path', { d: 'M22 26h4.5M26 22h4.5' }, { at: 0.4 }],
    ] },
  fish: { set: 'care', label: 'Fish', module: 'Animal care', wiggle: true, ink: [
      ['path', { d: 'M15 24c4-7 10-10 16.5-10 5.5 0 9 4.5 10.5 10-1.5 5.5-5 10-10.5 10C25 34 19 31 15 24Z' }],
      ['path', { d: 'M15 24 7 17v14Z' }, { at: 0.4 }],
    ], accent: [
      ['path', { d: 'M27 18a9 9 0 0 1 0 12' }],
      ['circle', { cx: 35, cy: 21.5, r: 1.3 }, { motion: 'pop', at: 0.4 }],
    ] },
  transport: { set: 'care', label: 'Transport', module: 'Animal care', bounce: true, ink: [
      ['path', { d: 'M27 34H7a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v22h14v-9l-6-7h-8' }],
    ], accent: [
      ['circle', { cx: 13, cy: 35, r: 4 }, { motion: 'pop', front: true }],
      ['circle', { cx: 34, cy: 35, r: 4 }, { motion: 'pop', at: 0.3, front: true }],
    ] },
  scan: { set: 'care', label: 'Scan tag', module: 'Animal care', ink: [
      ['path', { d: 'M7 15v-4a4 4 0 0 1 4-4h4M33 7h4a4 4 0 0 1 4 4v4M41 33v4a4 4 0 0 1-4 4h-4M15 41h-4a4 4 0 0 1-4-4v-4' }],
      ['rect', { x: 14, y: 14, width: 8, height: 8, rx: 1.5 }, { at: 0.3 }],
      ['rect', { x: 26, y: 14, width: 8, height: 8, rx: 1.5 }, { at: 0.45 }],
      ['rect', { x: 14, y: 26, width: 8, height: 8, rx: 1.5 }, { at: 0.6 }],
      ['path', { d: 'M27 27h1M33 27h1M27 33h1M33 33h1' }, { at: 0.75 }],
    ], accent: [
      ['path', { d: 'M10 24h28' }, { motion: 'move', from: 'translateY(-12px)', front: true }],
    ] },
  map: { set: 'care', label: 'Map', module: 'Animal care', ink: [
      ['path', { d: 'M6 11l11-4 14 4 11-4v30l-11 4-14-4-11 4Z' }],
      ['path', { d: 'M17 7v30M31 11v30' }, { at: 0.4 }],
    ], accent: [
      ['path', { d: 'M24 31s-6.5-5.5-6.5-10.5a6.5 6.5 0 0 1 13 0C30.5 25.5 24 31 24 31Z' }, { motion: 'move', from: 'translateY(-6px)', front: true }],
      ['circle', { cx: 24, cy: 20.5, r: 2 }, { motion: 'pop', at: 0.4, front: true }],
    ] },

};

const pct = (x) => `${Math.round(x * 1000) / 10}%`;
function svgFor(name, ic) {
  const c = `antz-l-${name}`, kf = [], shapes = [], fronts = [], cuts = [];
  const GAP = 1.5; // clear space around a front element, px
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
      move: `0%,${pct(s)}{transform:${m.from};opacity:0}${pct(s + 0.015)}{opacity:1}${pct(s + 0.16)},90%{transform:none;opacity:1}97%,100%{transform:none;opacity:0}`,
    }[motion];
    kf.push(`@keyframes ${id}{${frames}}`);
    const ease = motion === 'pop' || motion === 'pulse' || motion === 'move' ? EASE.pop : motion === 'rise' ? EASE.sway : EASE.draw;
    const isDraw = motion === 'draw' || motion === 'pulse';
    const el = `<${tag} class="${cls} ${id}" ${attrs(a)}${isDraw ? ' pathLength="1"' : ''}/>`;
    if (m.front) {
      // The same shape, in black, in the mask: it moves and fades with the element, so the cut-out follows it
      const closed = tag !== 'path' || /z\s*$/i.test(a.d);
      fronts.push(el);
      cuts.push(`<${tag} class="k ${id}" ${attrs(a)}${isDraw ? ' pathLength="1"' : ''} fill="${closed ? '#000' : 'none'}"/>`);
    } else shapes.push(el);
    return `.${id}{${isDraw ? 'stroke-dasharray:1;' : ''}${m.origin ? `transform-box:view-box;transform-origin:${m.origin};` : ''}animation:${id} ${LOOP}ms ${ease} infinite}`;
  };
  const rules = [...ic.ink.map((s) => add('i', s, 0, 0.3)), ...ic.accent.map((s) => add('a', s, ic.ink.length ? 0.3 : 0, 0.5))];
  // Whole-icon motion after the accent settles
  const GROUP = {
    wiggle: ['24px 40px', EASE.sway, '0%,52%{transform:rotate(0)}56%{transform:rotate(-7deg)}61%{transform:rotate(6deg)}66%{transform:rotate(-3deg)}71%,100%{transform:rotate(0)}'],
    swing: ['24px 9px', EASE.sway, '0%,52%{transform:rotate(0)}57%{transform:rotate(12deg)}63%{transform:rotate(-10deg)}69%{transform:rotate(6deg)}75%{transform:rotate(-3deg)}80%,100%{transform:rotate(0)}'],
    spin: ['24px 24px', EASE.pop, '0%,50%{transform:rotate(0)}66%,100%{transform:rotate(180deg)}'],
    blink: ['24px 24px', EASE.sway, '0%,56%{transform:scaleY(1)}59%{transform:scaleY(.08)}62%,100%{transform:scaleY(1)}'],
    bounce: ['24px 24px', EASE.sway, '0%,52%{transform:translateY(0)}57%{transform:translateY(-5px)}63%{transform:translateY(0)}67%{transform:translateY(-2px)}71%,100%{transform:translateY(0)}'],
  };
  let group = '';
  const gk = Object.keys(GROUP).find((k) => ic[k]);
  if (gk) { const [origin, ease, frames] = GROUP[gk]; kf.push(`@keyframes ${c}-g{${frames}}`); group = `.${c}-g{transform-origin:${origin};animation:${c}-g ${LOOP}ms ${ease} infinite}`; }
  const style = [
    `.${c} .i,.${c} .a{fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;transform-box:fill-box;transform-origin:center}`,
    `.${c} .i{stroke:var(--antz-ink,var(--color-text,#0E1512))}`,
    `.${c} .a{stroke:url(#${c}-acc)}`,
    `.${c} .k{stroke:#000;stroke-width:${1.5 + GAP * 2};stroke-linecap:round;stroke-linejoin:round;transform-box:fill-box;transform-origin:center}`,
    `.${c} .acc-a{stop-color:var(--antz-accent-a,var(--scale-primary-600,#21924E))}.${c} .acc-b{stop-color:var(--antz-accent-b,var(--scale-secondary-600,#00A698))}`,
    ...rules, group, ...kf,
    `@media (prefers-reduced-motion:reduce){.${c} *{animation:none!important;stroke-dashoffset:0!important;opacity:1!important;transform:none!important}}`,
  ].filter(Boolean).join('\n');
  // Elements behind are masked where a front element sits; front elements draw on top, unmasked
  const body = fronts.length ? `<g mask="url(#${c}-cut)">\n${shapes.join('\n')}\n</g>\n${fronts.join('\n')}` : shapes.join('\n');
  const mask = fronts.length ? `<mask id="${c}-cut" maskUnits="userSpaceOnUse" x="-8" y="-8" width="64" height="64"><rect x="-8" y="-8" width="64" height="64" fill="#fff"/>${cuts.join('')}</mask>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" class="${c}" role="img" aria-label="${ic.label}">
<defs><linearGradient id="${c}-acc" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop offset="0" class="acc-a"/><stop offset="1" class="acc-b"/></linearGradient>${mask}</defs>
<style>
${style}
</style>
${group ? `<g class="${c}-g">\n${body}\n</g>` : body}
</svg>
`;
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.svg') && !ICONS[f.slice(0, -4)]) fs.unlinkSync(path.join(OUT, f)); // drop icons no longer defined
const index = { $description: 'ANTZ Line animated: proposal outline style for the Primary icons, plus interface icons with micro-animations. Generated by tools/primary-line.mjs.', style: 'antz-line-animated', status: 'proposal', loopMs: LOOP, icons: [] };
let order = 0;
for (const [name, ic] of Object.entries(ICONS)) {
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svgFor(name, ic));
  index.icons.push({ name, label: ic.label, module: ic.module, set: ic.set || 'primary', order: ++order, status: 'proposal', svg: `${name}.svg` });
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');
const count = (k) => index.icons.filter((i) => i.set === k).length;
console.log(`✓ ANTZ Line animated: ${count('primary')} module, ${count('care')} animal care and ${count('ui')} interface icons in icons/antz-rounded/primary-line/`);
