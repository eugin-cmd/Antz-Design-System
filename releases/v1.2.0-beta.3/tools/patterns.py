#!/usr/bin/env python3
"""Draw the four animal coat patterns used behind the docs home hero (assets/img/patterns/*.svg).
Original procedural artwork (seeded, so the output is stable): run `python3 tools/patterns.py` to regenerate.
Each SVG is a black-on-transparent mask; the page colours it with tokens."""
import math, os, random

W, H = 1600, 640
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img', 'patterns')
os.makedirs(OUT, exist_ok=True)
f = lambda v: f'{v:.1f}'

def svg(name, body):
    open(os.path.join(OUT, name + '.svg'), 'w').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">{body}</svg>\n')

def smooth_closed(pts):
    """Closed path through midpoints with quadratic curves (rounded, organic edges)."""
    n = len(pts); mids = [((pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2) for i in range(n)]
    d = f'M{f(mids[-1][0])} {f(mids[-1][1])}'
    for i in range(n): d += f'Q{f(pts[i][0])} {f(pts[i][1])} {f(mids[i][0])} {f(mids[i][1])}'
    return d + 'Z'

# ── Zebra: bold flowing bands, slightly diagonal, varying width ──────────────────
def zebra():
    r = random.Random(7); paths = []
    y = -260
    while y < H + 260:
        th = r.uniform(40, 62); ph, amp, k = r.uniform(0, 6.3), r.uniform(30, 70), r.uniform(0.003, 0.006)
        top, bot = [], []
        for x in range(-100, W + 101, 50):
            yy = y + amp * math.sin(x * k + ph) + r.uniform(-4, 4) + x * 0.28
            t = th * (0.55 + 0.45 * math.sin(x * 0.004 + ph * 1.7) ** 2)
            top.append((x, yy)); bot.append((x, yy + t))
        paths.append(smooth_closed(top + bot[::-1]))
        y += r.uniform(92, 118)
    svg('zebra', f'<path fill="#000" d="{"".join(paths)}"/>')

# ── Tiger: tapered stripes from the edges, some forking ──────────────────────────
def stripe(r, x0, y0, ang, length, width):
    pts, x, y, a = [], x0, y0, ang
    steps = 14
    for i in range(steps + 1):
        pts.append((x, y)); a += r.uniform(-0.16, 0.16); x += math.cos(a) * length / steps; y += math.sin(a) * length / steps
    left, right = [], []
    for i, (px, py) in enumerate(pts):
        t = i / steps; w = width * (1 - t) ** 0.45 + 0.8
        nx, ny = (pts[min(i + 1, steps)][1] - pts[max(i - 1, 0)][1]), -(pts[min(i + 1, steps)][0] - pts[max(i - 1, 0)][0])
        nl = math.hypot(nx, ny) or 1; nx, ny = nx / nl, ny / nl
        left.append((px + nx * w / 2, py + ny * w / 2)); right.append((px - nx * w / 2, py - ny * w / 2))
    return smooth_closed(left + right[::-1]), pts

def tiger():
    r = random.Random(11); paths = []
    x = -40
    while x < W + 40:
        for edge in (0, 1):
            xs = x + r.uniform(-10, 10) + (22 if edge else 0)
            y0 = -10 if edge == 0 else H + 10
            ang = (math.pi / 2 if edge == 0 else -math.pi / 2) + r.uniform(-0.35, 0.35) + 0.25
            length, width = r.uniform(300, 460), r.uniform(30, 46)
            d, pts = stripe(r, xs, y0, ang, length, width); paths.append(d)
            if r.random() < 0.55:
                k = r.randint(4, 7); bx, by = pts[k]
                d2, _ = stripe(r, bx, by, ang + r.choice([-1, 1]) * r.uniform(0.35, 0.6), length * 0.45, width * 0.55); paths.append(d2)
        x += r.uniform(78, 104)
    svg('tiger', f'<path fill="#000" d="{"".join(paths)}"/>')

# ── Leopard: broken rosettes around a hollow centre, plus small spots ─────────────
def leopard():
    r = random.Random(23); shapes = []
    step = 96
    for gy in range(-1, H // step + 2):
        for gx in range(-1, W // step + 2):
            cx = gx * step + (step / 2 if gy % 2 else 0) + r.uniform(-14, 14); cy = gy * step * 0.88 + r.uniform(-12, 12)
            rad = r.uniform(19, 25); n = r.randint(4, 6); a0 = r.uniform(0, 6.28)
            for i in range(n):
                a = a0 + i * 2 * math.pi / n + r.uniform(-0.25, 0.25)
                ex, ey = cx + math.cos(a) * rad, cy + math.sin(a) * rad
                rx, ry = r.uniform(10, 14), r.uniform(5.5, 8)
                shapes.append(f'<ellipse cx="{f(ex)}" cy="{f(ey)}" rx="{f(rx)}" ry="{f(ry)}" transform="rotate({f(math.degrees(a) + 90)} {f(ex)} {f(ey)})"/>')
            if r.random() < 0.5:
                sx, sy = cx + r.uniform(-step / 2, step / 2), cy + r.uniform(-step / 2, step / 2)
                shapes.append(f'<circle cx="{f(sx)}" cy="{f(sy)}" r="{f(r.uniform(3.5, 6))}"/>')
    svg('leopard', f'<g fill="#000">{"".join(shapes)}</g>')

# ── Giraffe: irregular patches (Voronoi cells) with pale seams ────────────────────
def clip(poly, a, b, c):
    """Keep the part of poly where a*x + b*y <= c (Sutherland-Hodgman, one half-plane)."""
    out = []
    for i in range(len(poly)):
        p, q = poly[i], poly[(i + 1) % len(poly)]
        pin, qin = a * p[0] + b * p[1] <= c, a * q[0] + b * q[1] <= c
        if pin: out.append(p)
        if pin != qin:
            t = (c - a * p[0] - b * p[1]) / ((a * (q[0] - p[0]) + b * (q[1] - p[1])) or 1e-9)
            out.append((p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])))
    return out

def giraffe():
    r = random.Random(31); step = 112; pts = []
    for gy in range(-1, H // step + 3):
        for gx in range(-1, W // step + 3):
            pts.append((gx * step + (step / 2 if gy % 2 else 0) + r.uniform(-30, 30), gy * step * 0.9 + r.uniform(-26, 26)))
    paths = []
    for i, p in enumerate(pts):
        poly = [(p[0] - 200, p[1] - 200), (p[0] + 200, p[1] - 200), (p[0] + 200, p[1] + 200), (p[0] - 200, p[1] + 200)]
        for j, q in enumerate(pts):
            if i == j or abs(q[0] - p[0]) > 260 or abs(q[1] - p[1]) > 260: continue
            a, b = q[0] - p[0], q[1] - p[1]; c = (q[0] ** 2 + q[1] ** 2 - p[0] ** 2 - p[1] ** 2) / 2
            poly = clip(poly, a, b, c)
            if not poly: break
        if len(poly) < 3: continue
        cx, cy = sum(x for x, _ in poly) / len(poly), sum(y for _, y in poly) / len(poly)
        s = r.uniform(0.8, 0.86)
        shrunk = [(cx + (x - cx) * s + r.uniform(-3, 3), cy + (y - cy) * s + r.uniform(-3, 3)) for x, y in poly]
        paths.append(smooth_closed(shrunk))
    svg('giraffe', f'<path fill="#000" d="{"".join(paths)}"/>')

zebra(); tiger(); leopard(); giraffe()
print('patterns written to', os.path.normpath(OUT))
