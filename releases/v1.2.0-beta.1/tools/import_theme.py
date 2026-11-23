#!/usr/bin/env python3
"""Import a theme exported by the Design System Previewer as a new brand next to ANTZ.

  python3 tools/import_theme.py <file.antz-theme.json> [--dry-run]
  python3 tools/import_theme.py --remove <slug> [--dry-run]

What it writes (nothing with --dry-run):
  themes/<slug>.css               the brand's overrides of the semantic tokens, light and dark
  themes/<slug>.antz-theme.json   a copy of the source file, for round-tripping
  themes/index.json               the list of brands the docs site offers in its brand switcher

ANTZ stays the default and is never changed: tokens.css is only read. A brand is applied with
<html data-brand="<slug>">. Only tokens that differ from ANTZ are written; everything else inherits.
Re-importing the same slug replaces that brand. No dependencies (Python 3.8+).

assets/theme-import.js is a JavaScript port of this file, used by the site's Import theme page
(pages/import-theme.html). Both must give byte-identical output: change them together and run
  node tools/test_import_parity.mjs
"""
import json, math, os, re, sys
from collections import Counter, OrderedDict
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(HERE, 'tools'))
import colors as C  # noqa: E402  (tokens.css parser, contrast maths and the approved pairs)

THEMES = os.path.join(HERE, 'themes')
MANIFEST = os.path.join(THEMES, 'index.json')
RESERVED = {'antz', 'light', 'dark', 'auto'}
SLUG = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*\Z')
HEX = re.compile(r'#[0-9A-Fa-f]{6}\Z')
FAMILY = re.compile(r'[A-Za-z0-9 ]{1,64}\Z')

# ── 1. Part → token mapping ──────────────────────────────────────────────
# Part ids are the Previewer's PARTS (app/src/theme/build.ts). Rows are in priority order:
# when two parts would set the same token, the first row that has a colour wins.
# Tokens that no row sets are derived (section 2) or inherited from ANTZ.
PART_MAP = [
    # part                 token(s)                                           Previewer meaning
    ('page',               ['--color-bg-app']),                               # behind everything
    ('sections',           ['--color-bg-canvas']),                            # section backgrounds
    ('cards',              ['--color-surface', '--color-surface-raised']),    # cards, rows, tiles
    ('cardInsets',         ['--color-surface-sunken']),                       # strips inside cards
    ('inputs',             ['--color-surface-muted']),                        # search fields, filter bar
    ('tabs',               ['--color-surface-muted']),                        # tab strip, segmented track
    ('textPrimary',        ['--color-text']),
    ('textSecondary',      ['--color-text-secondary']),
    ('inputContent',       ['--color-text-placeholder']),                     # placeholder text in fields
    ('textAccent',         ['--color-text-link', '--color-accent-text']),     # links and highlights
    ('btnSecondaryContent', ['--color-accent-text']),                         # only if textAccent is unset
    ('btnPrimary',         ['--color-accent']),                               # FAB, add, chat buttons
    ('tabActive',          ['--color-accent']),                               # only if btnPrimary is unset
    ('btnPrimaryContent',  ['--color-text-on-accent']),
    ('btnSecondary',       ['--color-accent-soft']),                          # icon buttons, pills
    ('dividers',           ['--color-border']),                               # card borders, rules
    ('chips',              ['--color-neutral-bg']),                           # unselected chips
    ('chipContent',        ['--color-neutral-text']),
    ('chipSelected',       ['--color-surface-selected']),
    ('feature',            ['--color-surface-strong']),                       # insights header, banners
    ('featureContent',     ['--color-text-on-strong']),
    ('overlays',           ['--color-surface-inverse']),                      # shade on photos, counters
    ('overlayContent',     ['--color-text-inverse']),
    ('alert',              ['--color-warning-bg']),                           # audit ticker, pending panel
    ('alertContent',       ['--color-warning-text']),
    ('scrim',              ['--color-overlay']),                              # keeps ANTZ's alpha
    ('avatars',            ['--hue-violet-soft']),                            # the default avatar fill
    ('avatarContent',      ['--hue-violet-ink']),
    ('status',             ['--color-signal-success', '--color-signal-warning',
                            '--color-signal-danger', '--color-signal-info']),  # one colour for every status
]
# Parts with no equivalent in the foundation (reported as "not used"):
UNMAPPED_PARTS = ['statusbar', 'statusbarContent', 'appbar', 'appbarTitle', 'appbarContent', 'textHeading',
                  'icons', 'chipSelectedContent', 'tabLabels', 'modTiles', 'modTileContent', 'images', 'imageMarks', 'badges', 'badgeContent']

# Only for themes built on a Previewer preset (colors.base != "build"): there the M3 roles are real colours,
# so they seed the tokens before the parts are applied. With base "build" the roles are the grey base and are ignored.
ROLE_MAP = [
    # role                     token(s)                                                   modes
    ('surfaceContainer',       ['--color-bg-app'],                                       ('light',)),  # light board sits below white cards
    ('background',             ['--color-bg-app'],                                       ('dark',)),
    ('surfaceContainerLow',    ['--color-bg-canvas', '--color-surface-sunken'],          ('light', 'dark')),
    ('surfaceContainerLowest', ['--color-surface', '--color-surface-raised'],            ('light',)),
    ('surfaceContainer',       ['--color-surface'],                                      ('dark',)),   # dark cards sit above the board
    ('surfaceContainerHigh',   ['--color-surface-muted'],                                ('light', 'dark')),
    ('onSurface',              ['--color-text'],                                         ('light', 'dark')),
    ('onSurfaceVariant',       ['--color-text-secondary'],                               ('light', 'dark')),
    ('primary',                ['--color-accent', '--color-text-link', '--color-accent-text'], ('light', 'dark')),
    ('onPrimary',              ['--color-text-on-accent'],                               ('light', 'dark')),
    ('outlineVariant',         ['--color-border'],                                       ('light', 'dark')),
    ('inverseSurface',         ['--color-surface-inverse'],                              ('light', 'dark')),
    ('inverseOnSurface',       ['--color-text-inverse'],                                 ('light', 'dark')),
]

# ── Colour maths (OKLab / OKLCH, sRGB D65) ───────────────────────────────
def hex_rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb_hex(c):
    return '#%02X%02X%02X' % tuple(max(0, min(255, int(round(v)))) for v in c[:3])


def _lin(v):
    v /= 255.0; return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def _gam(v):
    v = 12.92 * v if v <= 0.0031308 else 1.055 * (v ** (1 / 2.4)) - 0.055
    return v * 255.0


def to_oklab(h):
    r, g, b = (_lin(v) for v in hex_rgb(h))
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = (math.copysign(abs(x) ** (1 / 3), x) for x in (l, m, s))
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)


def _oklab_lin(L, a, b):
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)


def to_oklch(h):
    L, a, b = to_oklab(h)
    return L, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360


def from_oklch(L, Cc, H):
    """OKLCH to hex, reducing chroma until the colour fits sRGB."""
    L = max(0.0, min(1.0, L))
    lo, hi = 0.0, Cc
    def fits(c):
        rgb = _oklab_lin(L, c * math.cos(math.radians(H)), c * math.sin(math.radians(H)))
        return all(-1e-4 <= v <= 1 + 1e-4 for v in rgb), rgb
    ok, rgb = fits(Cc)
    if not ok:
        for _ in range(24):
            mid = (lo + hi) / 2
            if fits(mid)[0]: lo = mid
            else: hi = mid
        rgb = fits(lo)[1]
    return rgb_hex([_gam(max(0.0, min(1.0, v))) for v in rgb])


def set_l(h, L, max_c=None):
    _, c, hue = to_oklch(h)
    return from_oklch(L, c if max_c is None else min(c, max_c), hue)


def shift_l(h, d):
    L, c, hue = to_oklch(h); return from_oklch(L + d, c, hue)


def mix(a, b, t):
    """t of b into a, in OKLab."""
    x, y = to_oklab(a), to_oklab(b)
    L, A, B = (x[i] + (y[i] - x[i]) * t for i in range(3))
    return rgb_hex([_gam(max(0.0, min(1.0, v))) for v in _oklab_lin(L, A, B)])


def rgb4(h):
    return hex_rgb(h) + (1.0,)


def contrast(a, b):
    return C.ratio(rgb4(a), rgb4(b))


def is_light(h):
    return C.lum(rgb4(h)) > 0.18


def ensure(fg, bgs, target):
    """Move fg's lightness away from the backgrounds until it reaches target on all of them."""
    bgs = [b for b in bgs if b]
    if all(contrast(fg, b) >= target for b in bgs): return fg
    darker = sum(is_light(b) for b in bgs) * 2 >= len(bgs)
    L, c, hue = to_oklch(fg)
    for _ in range(100):
        L += -0.01 if darker else 0.01
        cand = from_oklch(L, c, hue)
        if all(contrast(cand, b) >= target for b in bgs) or L <= 0 or L >= 1: return cand
    return cand


def best_on(bg, keep=None, target=4.5):
    """Text colour for a fill: keep the current one if it passes, else white or a dark ink of the fill's hue."""
    if keep and contrast(keep, bg) >= target: return keep
    ink = set_l(bg, 0.24, 0.08)
    return max(('#FFFFFF', ink), key=lambda c: contrast(c, bg))


def rgba(h, a):
    r, g, b = hex_rgb(h); return 'rgba(%d, %d, %d, %s)' % (r, g, b, ('%.2f' % a).rstrip('0').lstrip('0') or '0')


def hue_to(css, ref, old_hue_range=(120, 175)):
    """Re-hue every #RRGGBB / rgba() in a gradient whose hue is in the ANTZ green range to ref's hue."""
    _, rc, rh = to_oklch(ref)
    def one(h):
        L, c, hue = to_oklch(h)
        if c < 0.02 or not (old_hue_range[0] <= hue <= old_hue_range[1]): return h
        return from_oklch(L, c if rc >= 0.04 else rc, rh)
    css = re.sub(r'#[0-9A-Fa-f]{6}\b', lambda m: one(m.group(0)), css)
    def rg(m):
        r, g, b = (int(x) for x in m.group(1, 2, 3))
        n = hex_rgb(one(rgb_hex((r, g, b))))
        return 'rgba(%d, %d, %d, %s)' % (n + (m.group(4),))
    return re.sub(r'rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)', rg, css)


# ── 2. Derived tokens ────────────────────────────────────────────────────
# Rules (s = direction: light mode goes darker for "more", dark mode lighter; all in OKLCH):
#   bg-canvas          mix(bg-app, surface, .45)                    if page changed and sections is unset
#   surface-sunken     light mix(surface, bg-app, .35) · dark = bg-canvas
#   surface-muted      mix(surface, text, .05 light / .06 dark)
#   surface-hover      mix(surface, text, .045 light / .07 dark)
#   surface-selected   mix(surface, accent, .07 light / .18 dark)
#   surface-raised     light = surface · dark = surface L+.025
#   text-secondary     mix(text, surface, .25), AA on every surface   if textSecondary is unset
#   text-muted         mix(text-secondary, surface, .18), AA on surface, sunken, muted, canvas and bg-app
#   text-placeholder   light = muted · dark mix(muted, surface, .12), AA on surface
#   text-disabled      mix(text, surface, .62 light / .58 dark)    (exempt from AA)
#   disabled-bg        mix(surface, text, .20 light / .10 dark)
#   border             mix(surface, text, .12 light / .14 dark)     if dividers is unset
#   border-subtle      mix(border, surface, .40) · border-strong mix(border, text, .15 / .20)
#   border-input       mix(border, text, .35), 3:1 on surface
#   accent-hover       L -.06 light / +.07 dark · accent-pressed L -.12 light / -.06 dark
#   accent-soft        accent at L .95 light / .31 dark, chroma ≤ .06 · accent-soft-hover L -.03 / +.04
#   accent-text, link  accent (dark: L +.04), AA on surface and accent-soft
#   text-on-accent     ANTZ's if it passes AA, else white or a dark ink of the accent's hue
#   accent-bright      accent at L .87 (dark: the accent itself if L ≥ .75) · text-on-bright: ink of it, AA
#   focus              ANTZ sky ring, darkened/lightened until 3:1 on surface and canvas
#   focus-glow         rgba(accent, .12) light · rgba(focus, .25) dark (as ANTZ)
#   hue-green(-soft/-ink)  follow accent / accent-soft / accent-text (ANTZ's brand hue)
#   *-on-solid, text-on-strong, text-inverse, warning-text: kept if AA on the new fill, else best_on()
#   warning-border     mix(warning-bg, warning-text, .25) · overlay: the scrim colour with ANTZ's alpha
#   shadows            light: ANTZ's green tints replaced by the accent's hue at L .25; shadow-accent rgba(accent, .9)
#   gradients          green, deep, mint and glow re-hued to the accent (lightness kept, so text on them keeps its contrast)
COLOR_KEYS = None  # filled at load


def derive(mode, m, antz, set_by):
    """m: tokens set from parts for this mode. antz: ANTZ resolved values. Returns (values, derived names)."""
    dark = mode == 'dark'
    v = dict(antz); v.update(m)
    d = set()
    # a token counts as changed only if its colour differs from ANTZ (a preset may repeat ANTZ's own values)
    changed = lambda *ts: any(t in m and norm(m[t]) != norm(antz[t]) for t in ts)

    def put(t, val):
        if t in m: return
        v[t] = val; d.add(t)

    if changed('--color-bg-app') and '--color-bg-canvas' not in m:
        put('--color-bg-canvas', mix(v['--color-bg-app'], v['--color-surface'], .45))
    surf = changed('--color-surface', '--color-bg-app', '--color-bg-canvas')
    if surf:
        if not dark: put('--color-surface-sunken', mix(v['--color-surface'], v['--color-bg-app'], .35))
        else: put('--color-surface-sunken', v['--color-bg-canvas'])
    if changed('--color-surface'):
        put('--color-surface-raised', v['--color-surface'] if not dark else shift_l(v['--color-surface'], .025))
    txt = changed('--color-text')
    if changed('--color-surface') or txt:
        put('--color-surface-muted', mix(v['--color-surface'], v['--color-text'], .06 if dark else .05))
        put('--color-surface-hover', mix(v['--color-surface'], v['--color-text'], .07 if dark else .045))
        put('--color-disabled-bg', mix(v['--color-surface'], v['--color-text'], .10 if dark else .20))
        put('--color-text-disabled', mix(v['--color-text'], v['--color-surface'], .58 if dark else .62))
        if '--color-border' not in m:
            put('--color-border', mix(v['--color-surface'], v['--color-text'], .14 if dark else .12))
    surfaces = [v['--color-surface'], v['--color-surface-sunken'], v['--color-surface-muted'], v['--color-bg-canvas'], v['--color-bg-app']]
    if txt and '--color-text-secondary' not in m:
        put('--color-text-secondary', ensure(mix(v['--color-text'], v['--color-surface'], .25), surfaces, 4.6))
    if changed('--color-text-secondary', '--color-text') or surf:
        put('--color-text-muted', ensure(mix(v['--color-text-secondary'], v['--color-surface'], .18), surfaces, 4.6))
        ph = v['--color-text-muted'] if not dark else ensure(mix(v['--color-text-muted'], v['--color-surface'], .12), [v['--color-surface']], 4.5)
        put('--color-text-placeholder', ph)
    if '--color-border' in m or '--color-border' in d or txt:
        b = v['--color-border']
        put('--color-border-subtle', mix(b, v['--color-surface'], .40))
        put('--color-border-strong', mix(b, v['--color-text'], .20 if dark else .15))
        put('--color-border-input', ensure(mix(b, v['--color-text'], .35), [v['--color-surface']], 3.0))

    acc = changed('--color-accent')
    if acc:
        a = v['--color-accent']
        put('--color-accent-hover', shift_l(a, .07 if dark else -.06))
        put('--color-accent-pressed', shift_l(a, -.06 if dark else -.12))
        put('--color-text-on-accent', best_on(a, antz['--color-text-on-accent']))
        if '--color-accent-soft' not in m:
            put('--color-accent-soft', set_l(a, .31 if dark else .95, .06))
    if acc or changed('--color-accent-soft'):
        put('--color-accent-soft-hover', shift_l(v['--color-accent-soft'], .04 if dark else -.03))
    if acc:
        a = v['--color-accent']
        txt_acc = ensure(shift_l(a, .04) if dark else a, [v['--color-surface'], v['--color-accent-soft']], 4.6)
        put('--color-accent-text', txt_acc)
        put('--color-text-link', txt_acc)
        bright = a if dark and to_oklch(a)[0] >= .75 else set_l(a, .87)
        put('--color-accent-bright', bright)
        put('--color-text-on-bright', ensure(set_l(bright, .3, .1), [bright], 4.6))
        put('--hue-green', a)
        put('--hue-green-soft', v['--color-accent-soft'])
        put('--hue-green-ink', v['--color-accent-text'])
        put('--color-surface-selected', mix(v['--color-surface'], a, .18 if dark else .07))
    elif changed('--color-surface'):
        put('--color-surface-selected', mix(v['--color-surface'], antz['--color-accent'], .18 if dark else .07))
    if surf:
        put('--color-focus', ensure(antz['--color-focus'], [v['--color-surface'], v['--color-bg-canvas']], 3.0))
    if acc or '--color-focus' in d:
        put('--color-focus-glow', rgba(v['--color-focus'], .25) if dark else rgba(v['--color-accent'], .12))

    # Text on fills that changed
    for fill, on in (('--color-surface-strong', '--color-text-on-strong'), ('--color-surface-inverse', '--color-text-inverse'),
                     ('--color-success-solid', '--color-success-on-solid'), ('--color-warning-solid', '--color-warning-on-solid'),
                     ('--color-danger-solid', '--color-danger-on-solid'), ('--color-info-solid', '--color-info-on-solid')):
        if changed(fill): put(on, best_on(v[fill], antz[on]))
    if changed('--color-warning-bg'):
        if '--color-warning-text' not in m:
            put('--color-warning-text', ensure(antz['--color-warning-text'], [v['--color-warning-bg']], 4.6))
        put('--color-warning-border', mix(v['--color-warning-bg'], v['--color-warning-text'], .25))
    if changed('--color-neutral-bg') and '--color-neutral-text' not in m:
        put('--color-neutral-text', ensure(antz['--color-neutral-text'], [v['--color-neutral-bg']], 4.6))
    if changed('--hue-violet-soft') and '--hue-violet-ink' not in m:
        put('--hue-violet-ink', ensure(antz['--hue-violet-ink'], [v['--hue-violet-soft']], 4.6))

    # Shadows and gradients follow the accent
    if acc:
        a = v['--color-accent']
        if not dark:
            tint = set_l(a, .25, .06)
            tr, tg, tb = hex_rgb(tint)
            for t in ('--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl', '--shadow-float'):
                put(t, re.sub(r'rgba\((0, 60, 30|20, 40, 30|0, 40, 20),', 'rgba(%d, %d, %d,' % (tr, tg, tb), antz[t]))
        put('--shadow-accent', 'rgba'.join([antz['--shadow-accent'].split('rgba')[0], '(%d, %d, %d, .9)' % hex_rgb(a)]))
        for t in ('--gradient-green', '--gradient-deep', '--gradient-mint', '--gradient-glow'):
            put(t, hue_to(antz[t], a))
        # the bright accent sits on the deep fill (figures, header focus ring): keep it at AA on every stop
        deep = [C.to_hex(c) for c in C.colors_of('--gradient-deep', v)]
        if '--color-accent-bright' in d:
            v['--color-accent-bright'] = ensure(v['--color-accent-bright'], deep, 4.6)
            v['--color-text-on-bright'] = ensure(set_l(v['--color-accent-bright'], .3, .1), [v['--color-accent-bright']], 4.6)
    if changed('--color-surface'):
        # inherited text and signal colours must still pass on the new card colour
        sf = v['--color-surface']
        for st in ('success', 'warning', 'danger', 'info'):
            put('--color-%s-text' % st, ensure(v['--color-%s-text' % st], [sf, v['--color-%s-bg' % st]], 4.5)) if contrast(v['--color-%s-text' % st], sf) < 4.5 else None
            put('--color-signal-%s' % st, ensure(v['--color-signal-%s' % st], [sf], 3.0)) if contrast(v['--color-signal-%s' % st], sf) < 3 else None
        for h in ('green', 'teal', 'sky', 'coral', 'amber', 'violet', 'navy'):
            ink, base_, soft = '--hue-%s-ink' % h, '--hue-%s' % h, '--hue-%s-soft' % h
            if contrast(v[ink], sf) < 4.5: put(ink, ensure(v[ink], [sf, v[soft]], 4.5))
            if contrast(v[base_], sf) < 3: put(base_, ensure(v[base_], [sf], 3.0))
    return v, d


# ── Reading the input ────────────────────────────────────────────────────
class Bad(Exception):
    pass


def validate(doc):
    if not isinstance(doc, dict): raise Bad('not a JSON object')
    if doc.get('format') != 'antz-theme': raise Bad('format must be "antz-theme"')
    if doc.get('version') != 1: raise Bad('unsupported version %r (this importer reads version 1)' % doc.get('version'))
    name, slug = doc.get('name'), doc.get('slug')
    if not isinstance(name, str) or not name.strip(): raise Bad('name is missing')
    if not isinstance(slug, str) or not SLUG.match(slug): raise Bad('slug %r is not kebab-case (a-z, 0-9 and single hyphens)' % slug)
    if slug in RESERVED: raise Bad('slug %r is reserved; rename the theme in the Previewer' % slug)
    cols = doc.get('colors') or {}
    for sect in ('parts', 'roles'):
        for mode, mp in (cols.get(sect) or {}).items():
            if mode not in ('light', 'dark'): raise Bad('colors.%s.%s: mode must be light or dark' % (sect, mode))
            if not isinstance(mp, dict): raise Bad('colors.%s.%s is not an object' % (sect, mode))
            for k, h in mp.items():
                if not isinstance(h, str) or not HEX.match(h): raise Bad('colors.%s.%s.%s: %r is not #RRGGBB' % (sect, mode, k, h))
    fonts = doc.get('fonts') or {}
    for role, f in (fonts.get('resolved') or {}).items():
        if f is None: continue
        if not isinstance(f, dict) or not isinstance(f.get('family'), str) or not FAMILY.match(f['family']):
            raise Bad('fonts.resolved.%s: family is missing or has unexpected characters' % role)
        for w in f.get('weights') or []:
            if not isinstance(w, int) or not 100 <= w <= 900 or w % 100: raise Bad('fonts.resolved.%s: weight %r' % (role, w))
    return doc


def mapped_tokens(doc, mode):
    """{token: hex} from roles (presets only) and parts; plus {token: source} for the report."""
    cols = doc.get('colors') or {}
    parts = (cols.get('parts') or {}).get(mode) or {}
    roles = (cols.get('roles') or {}).get(mode) or {}
    out, src = {}, {}
    if cols.get('base', 'build') != 'build':
        for role, toks, modes in ROLE_MAP:
            if role in roles and mode in modes:
                for t in toks: out[t], src[t] = roles[role].upper(), 'role ' + role
    claimed = set()
    for part, toks in PART_MAP:
        if part not in parts: continue
        for t in toks:
            if t in claimed: continue
            claimed.add(t); out[t], src[t] = parts[part].upper(), 'part ' + part
    return out, src


def unknown_parts(doc):
    known = {p for p, _ in PART_MAP} | set(UNMAPPED_PARTS)
    cat = {p.get('id') for p in (doc.get('colors') or {}).get('partCatalog') or [] if isinstance(p, dict)}
    seen = set()
    for mp in ((doc.get('colors') or {}).get('parts') or {}).values(): seen |= set(mp)
    return sorted(seen & set(UNMAPPED_PARTS)), sorted(seen - known), sorted(cat - known) if cat else []


# ── Fonts ────────────────────────────────────────────────────────────────
STACKS = {
    'sans-serif': 'system-ui, -apple-system, "Segoe UI", sans-serif',
    'serif': 'Georgia, "Times New Roman", serif',
    'monospace': 'ui-monospace, "SF Mono", Menlo, monospace',
    'cursive': 'cursive',
}
ANTZ_FAMILY = 'Inter'
# The Previewer's categories: sans-serif, serif, display, handwriting, monospace
CATEGORY_ALIAS = {'display': 'sans-serif', 'handwriting': 'cursive'}


def fonts_of(doc):
    f = doc.get('fonts') or {}
    res = dict(f.get('resolved') or {})
    roles = f.get('roles') or {}
    every = f.get('allText')
    for r in ('display', 'headline', 'title', 'body', 'label'):   # fill gaps from roles / allText
        if res.get(r): continue
        pick = roles.get(r) or every
        if pick and pick.get('family'):
            res[r] = {'family': pick['family'], 'weights': [pick['weight']] if pick.get('weight') else [400]}
    def pick(order, tie):
        fams = [res[r]['family'] for r in order if res.get(r)]
        if not fams: return ANTZ_FAMILY
        cnt = Counter(fams); top = max(cnt.values())
        winners = [x for x in cnt if cnt[x] == top]
        if len(winners) > 1 and res.get(tie) and res[tie]['family'] in winners: return res[tie]['family']
        return next(x for x in fams if x in winners)
    heading = pick(['display', 'headline', 'title'], 'title')
    body = pick(['body', 'label'], 'body')
    cats = f.get('categories') or {}
    def stack(fam):
        if fam == ANTZ_FAMILY: return None
        gen = CATEGORY_ALIAS.get(cats.get(fam, 'sans-serif'), cats.get(fam)); gen = gen if gen in STACKS else 'sans-serif'
        return '"%s", %s' % (fam, STACKS[gen])
    weights = {}
    for r, x in res.items():
        if x and x['family'] in (heading, body) and x['family'] != ANTZ_FAMILY:
            weights.setdefault(x['family'], set()).update(x.get('weights') or [400])
    url = None
    if weights:
        url = 'https://fonts.googleapis.com/css2?' + '&'.join(
            'family=%s:wght@%s' % (fam.replace(' ', '+'), ';'.join(str(w) for w in sorted(ws)))
            for fam, ws in sorted(weights.items())) + '&display=swap'
    unused = sorted({x['family'] for x in res.values() if x} - {heading, body})
    tokens = OrderedDict()
    if stack(heading): tokens['--font-heading'] = stack(heading)
    if stack(body):
        tokens['--font-body'] = stack(body); tokens['--font-family-sans'] = stack(body)
    return {'heading': heading, 'body': body, 'url': url, 'unused': unused, 'tokens': tokens,
            'weights': {k: sorted(v) for k, v in weights.items()}}


# ── ANTZ baseline ────────────────────────────────────────────────────────
def antz():
    light, dark, dark_names, _ = C.themes()
    def flat(th):
        out = {}
        for k in th:
            v = C.resolve(k, th); c = C.parse_color(v)
            out[k] = C.to_hex(c) if c and c[3] >= 1 else v   # '#fff' -> '#FFFFFF'; rgba() stays as written
        return out
    return flat(light), flat(dark), dark_names


def norm(v):
    c = C.parse_color(v)
    return C.to_hex(c).upper() if c else re.sub(r'\s+', ' ', v.strip())


THEME_TOKENS = re.compile(r'--(color|hue|shadow|gradient)-')


def css_block(sel, decls, indent='  '):
    return '%s {\n%s\n}' % (sel, '\n'.join('%s%s: %s;' % (indent, k, val) for k, val in decls.items()))


# ── Import ───────────────────────────────────────────────────────────────
def build(doc):
    slug = doc['slug']
    al, ad, dark_names = antz()
    res = {}
    for mode, base in (('light', al), ('dark', ad)):
        m, src = mapped_tokens(doc, mode)
        for t in list(m):
            if t == '--color-overlay':      # the scrim keeps ANTZ's alpha
                a = C.parse_color(base[t])[3]; m[t] = rgba(m[t], a)
        carried = []
        if mode == 'dark':
            # The brand's accent is part of its identity: if only light has one, carry it into dark, lightened
            lm = res['light']['mapped']
            for t, L in (('--color-accent', .80), ('--color-text-link', .82), ('--color-accent-text', .82)):
                if t in lm and t not in m and norm(lm[t]) != norm(al[t]):
                    m[t] = set_l(lm[t], max(L, to_oklch(lm[t])[0])); carried.append(t)
        vals, der = derive(mode, m, base, src)
        for t in carried:
            del m[t]; der.add(t)
        res[mode] = {'values': vals, 'mapped': m, 'src': src, 'derived': der}
    for t in ('--gradient-green', '--gradient-deep', '--gradient-mint', '--gradient-glow'):
        res['dark']['values'][t] = res['light']['values'][t]   # feature fills are the same in both themes, as in ANTZ
        if t in res['light']['derived']: res['dark']['derived'].add(t)
        else: res['dark']['derived'].discard(t)
    fonts = fonts_of(doc)

    lightd = OrderedDict((k, res['light']['values'][k]) for k in al
                         if THEME_TOKENS.match(k) and norm(res['light']['values'][k]) != norm(al[k]))
    lightd.update(fonts['tokens'])
    darkd = OrderedDict()
    for k in ad:
        if not THEME_TOKENS.match(k): continue
        want = res['dark']['values'][k]
        fallback = lightd[k] if (k in lightd and k not in dark_names) else ad[k]
        if (k in lightd and k in dark_names) or norm(want) != norm(fallback):
            darkd[k] = want
    head = ('/* %s · brand theme for the ANTZ Design System Foundation.\n'
            '   Generated by tools/import_theme.py from %s.antz-theme.json on %s. Do not edit by hand:\n'
            '   change the theme in the Previewer, export it and import it again.\n'
            '   Applies with <html data-brand="%s">; only tokens that differ from ANTZ are listed. */\n'
            % (doc['name'].replace('*/', '* /'), slug, datetime.now(timezone.utc).strftime('%Y-%m-%d'), slug))
    imp = '@import url("%s");\n\n' % fonts['url'] if fonts['url'] else ''
    sel = ':root[data-brand="%s"]' % slug
    css = imp + head + '\n' + css_block(sel, lightd) + '\n\n'
    if darkd:
        css += ('/* Dark: follows the OS unless the page forces light */\n@media (prefers-color-scheme: dark) {\n'
                + css_block('  %s:not([data-theme="light"])' % sel, darkd, '    ').replace('\n}', '\n  }') + '\n}\n'
                + '/* Dark: forced */\n' + css_block('%s[data-theme="dark"]' % sel, darkd) + '\n')
    return res, fonts, lightd, darkd, css, (al, ad)


def contrast_rows(res):
    rows = []
    for fg, bg, kind, use in C.PAIRS:
        rs = []
        for mode in ('light', 'dark'):
            th = res[mode]['values']
            try:
                rs.append(round(min(C.ratio(a, b) for a in C.colors_of(fg, th) for b in C.colors_of(bg, th)), 2))
            except (KeyError, ValueError):
                rs.append(None)
        rows.append({'fg': fg, 'bg': bg, 'kind': kind, 'use': use, 'light': rs[0], 'dark': rs[1]})
    return rows


KEY_PAIRS = [('--color-text', '--color-bg-app'), ('--color-text', '--color-surface'), ('--color-text-on-accent', '--color-accent'),
             ('--color-text-secondary', '--color-surface'), ('--color-text-link', '--color-surface')]


def report(doc, res, fonts, lightd, darkd, rows):
    p = print
    p('Theme "%s" (%s)  base: %s' % (doc['name'], doc['slug'], (doc.get('colors') or {}).get('base', 'build')))
    used, unknown, cat_unknown = unknown_parts(doc)
    for mode in ('light', 'dark'):
        r = res[mode]
        p('\n%s' % mode.upper())
        p('  mapped  (%d): %s' % (len(r['mapped']), ', '.join('%s<-%s' % (t[2:], r['src'][t].split(' ', 1)[1]) for t in r['mapped']) or '-'))
        p('  derived (%d): %s' % (len(r['derived']), ', '.join(sorted(t[2:] for t in r['derived'])) or '-'))
        n_written = len(lightd) if mode == 'light' else len(darkd)
        p('  written to the %s block: %d tokens; every other token inherits ANTZ' % (mode, n_written))
    if used: p('\nParts with no foundation equivalent (not used): ' + ', '.join(used))
    if unknown: p('Unknown part ids (ignored; update PART_MAP): ' + ', '.join(unknown))
    if cat_unknown: p('Part ids in partCatalog this importer does not know: ' + ', '.join(cat_unknown))
    if any('status' in ((doc.get('colors') or {}).get('parts') or {}).get(m, {}) for m in ('light', 'dark')):
        p('WARNING: the Status part sets all four signal colours to one colour, so success, warning, danger and info dots look alike.')
    if '--color-accent' not in lightd and '--color-accent' not in darkd:
        p('NOTE: no accent set: buttons, links, the header and the hero keep the ANTZ greens.')
    p('\nFONTS  heading: %s · body: %s' % (fonts['heading'], fonts['body']))
    if fonts['url']: p('  Google Fonts: ' + fonts['url'])
    if fonts['unused']: p('  Not used (the foundation has one heading and one body family): ' + ', '.join(fonts['unused']))
    antz_rows = {(fg, bg): r for fg, bg, kind, use, r in C.evaluate()}
    p('\nCONTRAST (WCAG 2)            light    dark')
    fails = 0
    for fg, bg in KEY_PAIRS:
        row = next(x for x in rows if x['fg'] == fg and x['bg'] == bg) if any(x['fg'] == fg and x['bg'] == bg for x in rows) else None
        if row is None:
            vals = [contrast(C.to_hex(C.parse_color(res[m]['values'][fg]))[:7], C.to_hex(C.parse_color(res[m]['values'][bg]))[:7]) for m in ('light', 'dark')]
        else:
            vals = [row['light'], row['dark']]
        bad = [m for m, x in zip(('light', 'dark'), vals) if x is not None and x < 4.5]
        p('  %-24s on %-16s %5.2f   %5.2f  %s' % (fg[8:], bg[8:], vals[0], vals[1], 'FAILS AA in ' + '+'.join(bad) if bad else 'AA'))
    for x in rows:
        need = {'text': 4.5, 'ui': 3.0}.get(x['kind'])
        if need is None: continue
        bad = [m for m in ('light', 'dark') if x[m] is not None and x[m] < need]
        if bad: fails += 1
        if bad and (x['fg'], x['bg']) not in KEY_PAIRS:
            ar = antz_rows.get((x['fg'], x['bg']))
            same = ar and all(ar[('light', 'dark').index(m)] < need for m in bad)
            p('  WARN %s on %s: %s (%s needs %.1f)%s' % (x['fg'], x['bg'], ', '.join('%s %.2f' % (m, x[m]) for m in bad), x['kind'], need,
                                                       '  [ANTZ fails this too]' if same else ''))
    p('  all approved pairs: %d, below target: %d (warnings only; the import is not blocked)' % (len(rows), fails))
    return fails


def load_manifest():
    try:
        with open(MANIFEST) as f: m = json.load(f)
        if isinstance(m, dict) and isinstance(m.get('themes'), list): return m
    except (OSError, ValueError):
        pass
    return {'$description': 'Brands offered by the docs site brand switcher. Written by tools/import_theme.py.', 'themes': []}


def save_manifest(m):
    os.makedirs(THEMES, exist_ok=True)
    with open(MANIFEST, 'w') as f:
        json.dump(m, f, indent=2, ensure_ascii=False); f.write('\n')


def summary(res, lightd, darkd):
    out = {}
    for mode, block in (('light', lightd), ('dark', darkd)):
        r = res[mode]
        out[mode] = {'set': sorted(r['mapped']), 'derived': sorted(r['derived']),
                     'written': len(block), 'inherited': 'every other token'}
    return out


def do_import(path, dry):
    try:
        with open(path) as f: doc = validate(json.load(f))
    except (OSError, ValueError, Bad) as e:
        print('error: %s: %s' % (path, e)); return 2
    res, fonts, lightd, darkd, css, _ = build(doc)
    rows = contrast_rows(res)
    report(doc, res, fonts, lightd, darkd, rows)
    slug = doc['slug']
    if dry:
        print('\n--dry-run: nothing written.'); return 0
    os.makedirs(THEMES, exist_ok=True)
    with open(os.path.join(THEMES, slug + '.css'), 'w') as f: f.write(css)
    with open(os.path.join(THEMES, slug + '.antz-theme.json'), 'w') as f:
        json.dump(doc, f, indent=2, ensure_ascii=False); f.write('\n')
    m = load_manifest()
    lv, dv = res['light']['values'], res['dark']['values']
    entry = OrderedDict([
        ('slug', slug), ('name', doc['name']), ('createdAt', doc.get('createdAt')),
        ('importedAt', datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')),
        ('css', 'themes/%s.css' % slug), ('source', 'themes/%s.antz-theme.json' % slug),
        ('fonts', OrderedDict([('heading', fonts['heading']), ('body', fonts['body']), ('url', fonts['url']), ('weights', fonts['weights'])])),
        ('tokens', summary(res, lightd, darkd)),
        ('contrast', rows),
    ])
    existing = [i for i, t in enumerate(m['themes']) if t.get('slug') == slug]
    if existing: m['themes'][existing[0]] = entry
    else: m['themes'].append(entry)
    save_manifest(m)
    print('\n%s themes/%s.css (%d light, %d dark tokens), themes/%s.antz-theme.json and themes/index.json.'
          % ('Updated' if existing else 'Wrote', slug, len(lightd), len(darkd), slug))
    print('Preview: python3 -m http.server 8092 --bind 127.0.0.1, then open http://localhost:8092/?brand=%s' % slug)
    return 0


def do_remove(slug, dry):
    if not SLUG.match(slug or '') or slug in RESERVED:
        print('error: %r is not a removable theme slug' % slug); return 2
    m = load_manifest()
    files = [os.path.join(THEMES, slug + ext) for ext in ('.css', '.antz-theme.json')]
    present = [f for f in files if os.path.exists(f)]
    listed = any(t.get('slug') == slug for t in m['themes'])
    if not present and not listed:
        print('No theme "%s" to remove.' % slug); return 1
    for f in present: print(('would remove ' if dry else 'removed ') + os.path.relpath(f, HERE))
    if listed: print(('would drop ' if dry else 'dropped ') + '"%s" from themes/index.json' % slug)
    if dry: print('--dry-run: nothing changed.'); return 0
    for f in present: os.remove(f)
    m['themes'] = [t for t in m['themes'] if t.get('slug') != slug]
    save_manifest(m)
    return 0


def main(argv):
    dry = '--dry-run' in argv
    args = [a for a in argv if a != '--dry-run']
    if len(args) == 2 and args[0] == '--remove': return do_remove(args[1], dry)
    if len(args) == 1 and not args[0].startswith('--'): return do_import(args[0], dry)
    print(__doc__.strip()); return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
