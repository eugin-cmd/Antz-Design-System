#!/usr/bin/env python3
"""Antz Design System · style 7 screens and component pages (DD-005, DD-006).

Builds, from one set of markup helpers:
  pages/screen-<name>.html   role homes, module homes and list pages (device frames at four sizes)
  docs-src/<name>.html       component library pages for the same pieces
Then run: node tools/docs.mjs

    python3 tools/style7.py

Screens start from pages/screen-home.html as the page skeleton. Markup uses components.css classes and tokens only.
"""
import os, re, json, html, collections

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.chdir(ROOT)
IMG = '../assets/img/'
B = IMG + 'banners/'

def esc(s): return html.escape(str(s), quote=True)
_fid = [0]
def labelled(label, ctrl, extra=''):
    """A field whose label is tied to its control (for and id), so screen readers announce it."""
    _fid[0] += 1; fid = f'fld-{_fid[0]}'
    ctrl = re.sub(r'<(input|select|textarea)\b', lambda m: f'<{m.group(1)} id="{fid}"', ctrl, count=1)
    return f'<div class="field"><label class="field__label" for="{fid}">{label}{extra}</label>{ctrl}</div>'
AC = ' aria-current="page"'
ACT = ' aria-current="true"'  # a chosen item in a list, not the current page
ACD = ' aria-current="date"'
HASEV = ' class="has-events"'
REQ = ' <span class="req">*</span>'
LATE = ' class="is-late"'
CRIT = '<span class="prio-tag">Critical</span>'
TODAY = ' class="is-today"'
def count_html(c): return '' if c in (None, '') else ' <span class="count">' + esc(c) + '</span>'
def maxw(w): return ' style="max-width:' + w + '"' if w else ''
def I(n): return f'<svg class="icon" aria-hidden="true"><use href="#i-{n}"/></svg>'
def tile(icon, hue, solid=False): return f'<span class="tile-icon{" tile-icon--solid" if solid else ""}" style="--c:var(--hue-{hue})">{I(icon)}</span>'
def sexcls(x): return 'sex-tag' if x == 'M' else 'sex-tag sex-tag--' + x.lower()
def status(text, kind): return f'<span class="status status--{kind}">{esc(text)}</span>'
def avatar(initials, hue): return f'<span class="avatar avatar--sm" style="--av-bg:var(--hue-{hue}-soft);--av-fg:var(--hue-{hue}-ink)">{esc(initials)}</span>'
def media(img, sex=None): return f'<span class="item__media"><img src="{B}{img}" alt="">' + (f'<span class="{sexcls(sex)}">{esc(sex)}</span>' if sex else '') + '</span>'

# ── Widgets and lists ─────────────────────────────────────────────────────
def widget(kind, icon, title, figure=None, caption='', sub=None, pill=None, dot='caution', go=True, extra='', cls='', remove=False, head_extra=''):
    k = ''.join(f' widget--{x}' for x in kind.split()) if kind else ''
    rm = f'<button class="widget__remove" type="button" aria-label="Remove {esc(title)}">{I("minus")}</button>' if remove else ''
    head = (f'<div class="widget__head"><span class="widget__icon">{I(icon)}</span><span class="widget__title"><b>{esc(title)}</b>{f"<small>{esc(sub)}</small>" if sub else ""}</span>{head_extra}'
            + (f'<a class="widget__go" href="#" aria-label="Open {esc(title)}">{I("arrow-up-right")}</a>' if go else '') + '</div>')
    fig = f'<span class="widget__spacer"></span><b class="widget__figure">{figure}</b><span class="widget__caption">{esc(caption)}</span>' if figure is not None else ''
    pl = f'<span class="widget__pill"><i style="--dot:var(--color-signal-{dot})"></i>{esc(pill)}</span>' if pill else ''
    return f'<article class="widget{k}{(" " + cls) if cls else ""}">{rm}{head}{fig}{extra}{pl}</article>'

def list_card(title, body, link='View all', cls=''):
    return f'<section class="list-card{(" " + cls) if cls else ""}"><div class="list-card__head"><b>{esc(title)}</b><a href="#">{esc(link)}</a></div>{body}</section>'

def item(left, title, line1, line2=None, end='', chevron=True):
    return (f'<a class="item" href="#">{left}<span class="item__body"><b>{esc(title)}</b><span>{esc(line1)}</span>{f"<em>{esc(line2)}</em>" if line2 else ""}</span>'
            f'<span class="item__end">{end}</span>{I("chevron-right") if chevron else ""}</a>')

def attn(icon, kind, title, tag, tagkind, meta, action):
    return (f'<div class="attn"><span class="tile-icon" style="--c:var(--color-{kind}-text)">{I(icon)}</span><div><b>{esc(title)}<span class="prio-tag{"" if tagkind == "danger" else " prio-tag--" + tagkind}">{esc(tag)}</span></b><small>{esc(meta)}</small></div>'
            f'<button class="btn btn--outline btn--sm" type="button">{esc(action)}</button></div>')

def rank(label, sub, v, count, hue='teal'):
    return f'<div class="rank rank--plain"><span class="rank__label"><b>{esc(label)}</b><small>{esc(sub)}</small></span><span class="meter" style="--v:{v};--bar:var(--hue-{hue})"><i></i></span><span>{esc(count)}</span></div>'

def colchart(values, labels, axis, top_labels):
    mx = max(values)
    bars = ''.join(f'<i style="--v:{v / mx:.3f}"' + (f' data-v="{esc(top_labels[k])}"' if k in top_labels else '') + '></i>' for k, v in enumerate(values))
    return (f'<div class="colchart" style="--n:{len(values)}" role="img" aria-label="Column chart: {esc(", ".join(f"{l} {v}" for l, v in zip(labels, values)))}">'
            f'<div class="colchart__axis" aria-hidden="true">' + ''.join(f'<span>{esc(a)}</span>' for a in axis) + f'</div><div class="colchart__plot" aria-hidden="true">{bars}</div>'
            f'<div class="colchart__labels" aria-hidden="true">' + ''.join(f'<span>{esc(l)}</span>' for l in labels) + '</div></div>')

def seg(options, sel=0, label='Period', xs=False):
    return f'<div class="segmented{" segmented--xs" if xs else ""}" role="group" aria-label="{esc(label)}">' + ''.join(f'<button type="button" aria-pressed="{str(i == sel).lower()}">{esc(o)}</button>' for i, o in enumerate(options)) + '</div>'

def tabs_with_counts(options, sel=0, label='Filter'):
    return (f'<div class="segmented segmented--pill" role="tablist" aria-label="{esc(label)}">'
            + ''.join(f'<button type="button" role="tab" aria-selected="{str(i == sel).lower()}">{esc(t)}{count_html(c)}</button>' for i, (t, c) in enumerate(options)) + '</div>')

def search(ph): return f'<label class="search">{I("search")}<input type="search" placeholder="{esc(ph)}" aria-label="{esc(ph)}"></label>'

def pagination(shown, total, pages=2):
    return (f'<nav class="pagination" aria-label="Pages"><span>Showing {shown} of {total}</span><span class="pagination__pages">'
            + ''.join(f'<a href="#"{AC if p == 1 else ""}>{p}</a>' for p in range(1, pages + 1)) + f'<a href="#" aria-label="Next page">{I("chevron-right")}</a></span></nav>')

def thumbs(items, more):
    return ('<div class="thumbs">' + ''.join(f'<figure><img src="{B}{img}" alt=""><figcaption>{esc(n)}</figcaption></figure>' for img, n in items)
            + f'<a class="thumbs__more" href="#" aria-label="{more} more species">+{more}</a></div>')

# ── Shared chrome ─────────────────────────────────────────────────────────
MODULES = [('Animals & collections', 'Collections', 'Species management', 'grid', 'green-ink'), ('Animals & collections', 'Animals', 'Records, sexing', 'paw', 'sky-ink'),
    ('Animals & collections', 'Housing', 'Sites, enclosures', 'home', 'green-ink'), ('Animals & collections', 'Mortality', 'Deaths recorded', 'heart', 'coral-ink'),
    ('Animals & collections', 'Eggs', 'Clutch to hatch', 'package', 'amber-ink'), ('Medical & care', 'Medical', 'Treatments', 'treatment', 'green-ink'),
    ('Medical & care', 'Hospital', 'Patients, imaging', 'clipboard', 'navy-ink'), ('Medical & care', 'Pharmacy', 'Stock, orders', 'medicine', 'teal-ink'),
    ('Medical & care', 'Lab', 'Samples, results', 'test-tube', 'amber-ink'), ('Operations', 'Approvals', 'Transfers, requests', 'clock', 'teal-ink'),
    ('Operations', 'Announcements', 'News for all', 'megaphone', 'green-ink'), ('Administration', 'Help desk', 'Tickets, support', 'help', 'teal-ink')]
BY = {m[1]: m for m in MODULES}

def tabbar():
    items = [('Home', 'home'), ('Menu', 'grid'), ('Tasks', 'clipboard'), ('Notes', 'file'), ('Profile', 'user')]
    return '<nav class="tabbar show-mobile" aria-label="Main">' + ''.join(f'<a class="tabbar__item" href="#"{AC if n == "Home" else ""}><span class="tabbar__pill">{I(ic)}</span><span>{n}</span></a>' for n, ic in items) + '</nav>'

def picker_popover(pid, options, end=True, searchable=False):
    opts = ''.join(f'<li><button class="picker__opt" type="button" role="option" aria-selected="{str(i == 0).lower()}" data-label="{esc(n)}">{esc(n)}{f"<small>{esc(c)}</small>" if c else ""}{I("check")}</button></li>' for i, (n, c) in enumerate(options))
    return (f'<div class="popover{" popover--end" if end else ""}" id="{pid}" hidden>' + (search('Search') if searchable else '')
            + f'<ul class="picker__list" role="listbox" aria-label="Choose">{opts}</ul></div>')

def pick(pid, label, icon, options, site=True, end=True, cls=''):
    return (f'<span class="pop-anchor{(" " + cls) if cls else ""}"><button class="pick{" pick--site" if site else ""}" type="button" aria-haspopup="listbox" aria-expanded="false" data-popover="{pid}">'
            f'{I(icon)}<span data-pick-label>{esc(label)}</span>{I("chevron-down")}</button>{picker_popover(pid, options, end, searchable=site)}</span>')

# Sort menu (DD-007): a picker on the sort button
SORTS = [('Newest first', 'sort-newest'), ('Oldest first', 'sort-oldest'), ('Species A–Z', 'sort-az'), ('AAID', 'sort-az')]
def sort_pick(pid, label='Newest first'):
    # Each order carries its icon (data-icon); choosing one swaps the trigger's icon ([data-pick-icon]) as well as its label.
    opts = ''.join(f'<li><button class="picker__opt" type="button" role="option" aria-selected="{str(n == label).lower()}" data-label="{esc(n)}" data-icon="{ic}">{I(ic)}{esc(n)}{I("check")}</button></li>' for n, ic in SORTS)
    ic = dict(SORTS)[label]
    return (f'<span class="pop-anchor"><button class="pick pick--outline" type="button" aria-haspopup="listbox" aria-expanded="false" data-popover="{pid}">'
            f'{I(ic).replace("<svg ", "<svg data-pick-icon ", 1)}<span data-pick-label>{esc(label)}</span>{I("chevron-down")}</button>'
            f'<div class="popover popover--end" id="{pid}" hidden><ul class="picker__list" role="listbox" aria-label="Sort by">{opts}</ul></div></span>')
SITES = [('All sites', '9 sites'), ('Crimson Frosted', '14,445 animals'), ('Clearspring', '12,820 animals'), ('Hollowpine', '11,081 animals')]
PERIODS = [('All time', None), ('Last 7 days', None), ('Last 30 days', None), ('This year', None)]

def module_switch(current, tone=None):
    groups = collections.OrderedDict()
    for g, n, sub, ic, hue in MODULES: groups.setdefault(g, []).append((n, ic, hue))
    grid = '<div class="module-grid">' + ''.join(f'<section><p class="t-overline">{esc(g)}</p><div class="module-grid__group">' + ''.join(
        f'<a class="module-grid__item" href="#"{AC if n == current else ""}>{tile(ic, hue, True)}<b>{esc(n)}</b></a>' for n, ic, hue in its) + '</div></section>' for g, its in groups.items()) + '</div>'
    g, n, sub, ic, hue = BY[current]
    if tone == 'vivid': hue = hue.replace('-ink', '')  # the brighter hue behind a white icon (DD-007)
    return (f'<span class="pop-anchor"><button class="module-switch" type="button" aria-haspopup="true" aria-expanded="false" data-popover="mod-switch">{tile(ic, hue, True)}<span>{esc(n)}</span>{I("chevron-down")}</button>'
            f'<div class="popover popover--lg popover--switch" id="mod-switch" hidden>{search("Find a module")}{grid}</div></span>')

def avatar_photo(src, name): return f'<span class="avatar"><img src="{IMG}{src}" alt="{esc(name)}"></span>'

# ── Browse panel pieces (DD-008) ──────────────────────────────────────────
SP = IMG + 'species/'
def figures(items, glass=False):
    return f'<div class="figures{" figures--glass" if glass else ""}">' + ''.join(f'<div><b>{esc(v)}</b><small>{esc(t)}</small></div>' for v, t in items) + '</div>'
def contact_pill(name, glass=False):
    btn = 'icon-btn icon-btn--sm' + (' icon-btn--on-strong' if glass else ' icon-btn--ghost')
    return (f'<span class="contact contact--pill{" contact--glass" if glass else ""}">{I("user")}<b>{esc(name)}</b><span class="contact__end">'
            f'<button class="{btn}" type="button" aria-label="Call {esc(name)}">{I("phone")}</button><button class="{btn}" type="button" aria-label="Message {esc(name)}">{I("chat")}</button></span></span>')
SPECIES_NAMES = {'black-kite': 'Black kite', 'hill-myna': 'Hill myna', 'rose-ringed-parakeet': 'Rose-ringed parakeet', 'sarus-crane': 'Sarus crane', 'asiatic-lion': 'Asiatic lion'}
def enclosure_card(name, imgs, animals, species, flag=None, attrs=''):
    stack = '<span class="avatar-stack">' + ''.join(f'<span class="avatar"><img src="{SP}{i}.webp" alt="{esc(SPECIES_NAMES.get(i, i))}"></span>' for i in imgs) + '</span>'
    return (f'<a class="card card--enclosure" href="#"{attrs}><span class="card__head"><b class="card__title">{esc(name)}</b>{I("chevron-right")}</span>{stack}'
            f'<p class="card__figure"><b>{animals}</b> animals · {species} species</p>' + (status(flag, 'caution') if flag else '') + '</a>')
def browse_row(name, meta, count, img=None, active=False):
    thumb = f'<span class="browse__thumb"><img src="{SP}{img}.webp" alt=""></span>' if img else tile('home', 'teal')
    return (f'<a class="row{" is-selected" if active else ""}" href="#"{ACT if active else ""}>{thumb}<span class="row__body"><span class="row__title">{esc(name)}</span>'
            f'<span class="row__meta">{esc(meta)}</span></span><span class="browse__count">{esc(count)}</span></a>')
def browse(sections, total_sections, title, meta, keeper, cards, shown, total):
    return ('<section class="browse"><div class="browse__list"><div class="section-head"><b>Sections</b><span class="t-small t-secondary">' + f'{total_sections} in this site</span></div>'
            + ''.join(browse_row(*r) for r in sections) + f'<a class="btn btn--tint" href="#">View all {total_sections} sections{I("chevron-right")}</a></div>'
            + f'<div class="browse__main"><div class="browse__head"><div><h3>{esc(title)}</h3><p>{esc(meta)}</p></div>{contact_pill(keeper)}{search("Find an enclosure")}</div>'
            + '<div class="browse__grid">' + ''.join(cards) + '</div>'
            + f'<div class="browse__foot"><span>Showing {shown} of {total} enclosures</span><a class="btn btn--tint" href="#">View all {total} enclosures{I("chevron-right")}</a></div></div></section>')
AVIARIES = [('Aviary 1', ['rose-ringed-parakeet'], 100, 1, None), ('Aviary 2', ['rose-ringed-parakeet', 'hill-myna'], 117, 2, None), ('Aviary 3', ['hill-myna', 'black-kite', 'sarus-crane'], 133, 3, 'Inspection due'),
            ('Aviary 4', ['black-kite'], 150, 1, None), ('Aviary 5', ['sarus-crane', 'rose-ringed-parakeet'], 167, 2, None), ('Aviary 6', ['rose-ringed-parakeet', 'hill-myna', 'black-kite'], 183, 3, '1 under treatment'),
            ('Aviary 7', ['rose-ringed-parakeet'], 200, 1, None), ('Aviary 8', ['hill-myna', 'black-kite'], 217, 2, None), ('Aviary 9', ['black-kite', 'sarus-crane', 'rose-ringed-parakeet'], 233, 3, None),
            ('Aviary 10', ['sarus-crane'], 100, 1, 'Inspection due'), ('Aviary 11', ['rose-ringed-parakeet', 'hill-myna'], 117, 2, None), ('Aviary 12', ['rose-ringed-parakeet', 'hill-myna', 'black-kite'], 133, 3, None)]
SECTIONS = [('Aviary section', '52 enclosures', '8,670', 'rose-ringed-parakeet', True), ('Herbivore section', '12 enclosures', '214'), ('Reptile house', '14 enclosures', '72'),
            ('Carnivore section', '9 enclosures', '38', 'asiatic-lion'), ('Primate section', '6 enclosures', '31'), ('Wetland', '5 enclosures', '12', 'sarus-crane'),
            ('Quarantine', '5 enclosures', '6'), ('Transfer section', '1 enclosure', '1')]

def hero_foot(img, overline, title, stats, meta_icon, meta, link):
    return (f'<section class="hero-photo hero-photo--foot"><img class="hero-photo__img" src="{B}{img}" alt=""><div><span class="t-overline hero-photo__overline">{esc(overline)}</span><h2 class="hero-photo__title">{esc(title)}</h2></div>'
            '<div class="hero-photo__stats hero-photo__stats--spread">' + ''.join(f'<div class="hero-photo__stat"><div><b>{v}</b><small>{esc(t)}</small></div></div>' for v, t in stats) + '</div>'
            f'<div class="hero-photo__foot"><span>{I(meta_icon)}{esc(meta)}</span><a href="#">{esc(link)}</a></div></section>')
def hero_site(img, back, overline, title, keeper, tag_text, figs):
    return (f'<section class="hero-photo hero-photo--site"><img class="hero-photo__img" src="{B}{img}" alt=""><div><a class="hero-photo__back" href="#">{I("chevron-left")}{esc(back)}</a>'
            f'<span class="t-overline hero-photo__overline">{esc(overline)}</span><h2 class="hero-photo__title">{esc(title)}</h2><div class="hero-photo__meta">{contact_pill(keeper, glass=True)}<span class="tag tag--glass">{esc(tag_text)}</span></div></div>'
            f'{figures(figs, glass=True)}</section>')

def modbar(current, site_label, site_icon='pin', period=False, crumbs=True, bell_dot=False, avatar_img=None, switch_tone=None):
    p = pick('period-pick', 'All time', 'calendar', PERIODS, site=False, cls='show-tablet-up') if period else ''
    nav = (f'<nav class="crumbs show-desktop" aria-label="Breadcrumb"><a href="#">Home</a>{I("chevron-right")}<span aria-current="page">{esc(current)}</span></nav>') if crumbs else ''
    dot = '<span class="icon-btn__dot"></span>' if bell_dot else ''
    who = avatar_photo(avatar_img, 'Your account') if avatar_img else avatar("AR", "amber")
    return (f'<header class="modbar"><a class="icon-btn" href="#" aria-label="Back to Home">{I("arrow-left")}</a>{module_switch(current, switch_tone)}'
            f'{nav}<div class="modbar__end">{pick("site-pick", site_label, site_icon, [(site_label, None)] + SITES[1:])}{p}'
            f'<span class="show-tablet-up"><button class="icon-btn" type="button" aria-label="Notifications, 3 new">{I("bell")}{dot}</button></span>{who}</div></header>')

def modnav(current, sections, action, active=None, soft=False):
    g, n, sub, ic, hue = BY[current]
    out = (f'<nav class="modnav{" modnav--soft" if soft else ""}" aria-label="{esc(n)} pages"><button class="icon-btn icon-btn--ghost modnav__fold show-tablet-up" type="button" aria-label="Fold the side panel" aria-expanded="true" data-modnav-fold>{I("menu")}</button>'
           f'<a class="sidenav__home" href="#"{AC if active is None else ""} style="--c:var(--hue-{hue})">{tile("grid", hue, True)}<div><b>{esc(n)} overview</b><small>Module home</small></div></a>')
    for label, items in sections:
        if label == '-': out += '<hr class="modnav__divider">'  # a line instead of a heading (DD-008)
        elif label: out += f'<p class="t-overline modnav__label">{esc(label)}</p>'
        for it in items:
            icon, h, title, count = it[:4]
            danger = len(it) > 4 and it[4]
            subs = it[5] if len(it) > 5 else None
            more = len(it) > 6 and it[6]
            cur = ' aria-current="page"' if title == active else ''
            end = (f'<span class="count count--danger">{count}</span>' if danger else (f'<small>{esc(count)}</small>' if count not in (None, '') else '')) + (I('chevron-right') if more else '')
            out += f'<a class="modnav__item" href="#"{cur}>{tile(icon, h)}<span>{esc(title)}</span>{end}</a>'
            if subs: out += '<ul class="modnav__sub">' + ''.join(f'<li><a href="#"{AC if s == active else ""}>{esc(s)}</a></li>' for s in subs) + '</ul>'
    return out + (f'<button class="btn btn--primary" type="button">{I("plus")}<span>{esc(action)}</span></button>' if action else '') + '</nav>'

def module_page(current, site_label, sections, action, main, active=None, site_icon='pin', period=False, bar=None, nav=None, strip=False, tinted=False):
    return (f'<div class="shell">{tabbar()}<div class="shell__main"><div class="screen__scroll modhome{" modhome--strip" if strip else ""}{" modhome--tinted" if tinted else ""}">{modbar(current, site_label, site_icon, period, **(bar or {}))}'
            f'<div class="modhome__body">{modnav(current, sections, action, active, **(nav or {}))}<main class="modhome__main">{main}</main></div></div></div></div>')

# ── Quick add dialog (Note, Request, Announcement) ────────────────────────
def quick_add_dialog(did='quick-add'):
    t = lambda k, ic, hue, sel: f'<button type="button" role="tab" id="{did}-t-{k}" aria-controls="{did}-p-{k}" aria-selected="{str(sel).lower()}">{tile(ic, hue)}{k.capitalize()}</button>'
    chips = lambda name, opts: f'<fieldset role="radiogroup" class="filter-panel"><legend class="field__label">{esc(name)}</legend><div class="chips">' + ''.join(f'<button class="chip" type="button" role="radio" aria-checked="{str(i == 0).lower()}">{esc(o)}</button>' for i, o in enumerate(opts)) + '</div></fieldset>'
    field = lambda lab, ctrl, req=False: labelled(esc(lab), ctrl, REQ if req else '')
    fieldlabel = lambda lab, body: f'<div class="field"><span class="field__label">{esc(lab)}</span>{body}</div>'
    sel = lambda ph: f'<div class="select-wrap"><select class="select"><option>{esc(ph)}</option></select></div>'
    prio = (f'<fieldset class="field"><legend class="field__label">Priority</legend><div class="priority">'
            f'<label class="priority__opt"><input type="radio" name="{did}-pr" checked><span class="priority__mark" aria-hidden="true">!</span>Normal</label>'
            f'<label class="priority__opt priority__opt--high"><input type="radio" name="{did}-pr"><span class="priority__mark" aria-hidden="true">!!</span>High</label>'
            f'<label class="priority__opt priority__opt--critical"><input type="radio" name="{did}-pr"><span class="priority__mark" aria-hidden="true">!!!</span>Critical</label></div></fieldset>')
    drop = f'<label class="dropzone"><input type="file" multiple><span class="tile-icon tile-icon--lg">{I("image")}</span><b>Upload files</b><span>JPG, PNG, PDF, MP4 or MP3, up to 32 MB</span></label>'
    toggle = f'<label class="toggle-row">{tile("users", "navy")}<div><b>Notify members</b><small>Send this to people following the animal or place</small></div><span class="switch"><input type="checkbox"><span></span></span></label>'
    note = (chips('Note type', ['General', 'Medical', 'Behaviour', 'Husbandry', 'Maintenance'])
            + field('Note', '<textarea class="textarea" rows="3" placeholder="What did you observe?"></textarea>', True)
            + '<div class="field-row">' + field('Record date', '<input class="input" type="date" value="2026-11-25">') + field('Related to', sel('Choose animal, enclosure or section'), True) + '</div>'
            + prio + toggle + drop)
    req = (field('Title', '<input class="input" placeholder="What are you requesting?">', True) + field('Description', '<textarea class="textarea" rows="3" placeholder="Why is it needed?"></textarea>')
           + fieldlabel('Requested by', f'<div class="person-field">{avatar("PS", "amber")}<div><b>Prajwal Shetty (you)</b><small>Curator</small></div></div>')
           + '<div class="field-row">' + field('Requesting to', sel('Select department'), True) + field('Site', sel('Choose site'), True) + '</div>'
           + field('To be approved by', sel('Add approver'), True) + drop)
    ann = (field('Headline', '<input class="input" placeholder="What should everyone know?">', True) + field('Message', '<textarea class="textarea" rows="3" placeholder="Details, times and who it affects"></textarea>', True)
           + '<div class="field-row">' + field('Show on home until', '<input class="input" type="date" value="2026-11-30">') + field('Audience', sel('Everyone at all sites')) + '</div>'
           + f'<label class="toggle-row">{tile("alert", "coral")}<div><b>Mark as important</b><small>Shown first, with a warning tag</small></div><span class="switch"><input type="checkbox"><span></span></span></label>' + drop)
    panel = lambda k, body, hidden: f'<div class="dialog__body" role="tabpanel" id="{did}-p-{k}" aria-labelledby="{did}-t-{k}"{" hidden" if hidden else ""}>{body}</div>'
    return (f'<div class="dialog-backdrop" id="{did}" hidden><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="{did}-title">'
            f'<div class="dialog__head"><div><h2 class="dialog__title" id="{did}-title">Quick add</h2><p class="dialog__desc">A note, a request or an announcement</p></div><button class="icon-btn" type="button" aria-label="Close" data-dialog-close>{I("x")}</button></div>'
            f'<div class="segmented segmented--pill segmented--block dialog__tabs" role="tablist" aria-label="What to add">{t("note", "file", "coral-ink", True)}{t("request", "send", "teal-ink", False)}{t("announcement", "megaphone", "navy-ink", False)}</div>'
            + panel('note', note, False) + panel('request', req, True) + panel('announcement', ann, True)
            + f'<div class="dialog__foot"><span class="dialog__foot-note">2 required fields left</span><button class="btn btn--outline" type="button" data-dialog-close>Cancel</button><button class="btn btn--primary" type="button" disabled>Add</button></div></div></div>')

# ── Home side column, board bar, dock ─────────────────────────────────────
def quick_add_tiles(did='quick-add'):
    return (f'<section class="card"><p class="t-overline">Quick add</p><div class="quick-add">'
            + ''.join(f'<button class="quick-add__item" type="button" data-dialog-open="{did}">{tile(ic, h)}{t}</button>' for ic, h, t in [('file', 'coral-ink', 'Note'), ('send', 'teal-ink', 'Request'), ('megaphone', 'navy-ink', 'Announcement')])
            + '</div></section>')

def today_card(rows, overdue, due):
    return (f'<section class="card card--soft"><div class="card__head"><span class="date-badge"><small>Nov</small><b>25</b></span><div><b class="card__title">Today</b><span class="card__meta">What needs doing</span></div></div>'
            f'<div class="segmented segmented--pill segmented--block" role="tablist" aria-label="Tasks"><button type="button" role="tab" aria-selected="true">Overdue <span class="count count--danger">{overdue}</span></button><button type="button" role="tab" aria-selected="false">Due today <span class="count">{due}</span></button></div>'
            + ''.join(f'<div class="task-row">{tile(ic, "coral", True)}<div><b>{esc(t)}</b><small>{esc(m)}</small></div><span>{n}</span></div>' for ic, t, m, n in rows) + '</section>')

def announcements_card():
    return (f'<section class="card"><div class="card__head"><span class="tile-icon" style="--c:var(--hue-navy-ink)">{I("megaphone")}</span><b class="card__title">Announcements</b><a class="card__end t-small" href="#">View all</a></div>'
            f'<div class="photo-tile photo-tile--wide"><img src="{IMG}leopard.webp" alt=""><span class="photo-tile__text"><b>Zara and Kian go on exhibit from Monday</b><small>Emerson Vance · 24 Aug</small></span></div>'
            f'<div class="card__head"><span class="dots" aria-hidden="true"><i class="is-on"></i><i></i><i></i><i></i></span><span class="card__end"><button class="icon-btn icon-btn--sm" type="button" aria-label="Previous">{I("chevron-left")}</button><button class="icon-btn icon-btn--sm" type="button" aria-label="Next">{I("chevron-right")}</button></span></div></section>')

def notes_card():
    return ('<section class="card"><div class="card__head"><b class="card__title">Observation notes</b><a class="card__end t-small" href="#">View all</a></div><ul class="notes">'
            + ''.join(f'<li><i style="--dot:var(--color-signal-{d})"></i><b>{t}</b><time>{dt}</time><small>{m}</small></li>' for d, t, dt, m in [('danger', 'Deep flank wound', '03 Sep', 'Open wound · bleeding · Emerson Vance'), ('caution', 'Metal work', '02 Sep', 'Rust and corrosion · Kai Vance')])
            + '</ul></section>')

def board_bar(board_id, site_label, modules):
    tiles_ = ''.join(f'<div class="module-tile"><a class="module-tile__link" href="#">{tile(BY[m][3], BY[m][4], True)}<b>{esc(m)}</b><small>{esc(BY[m][2])}</small></a><button class="module-tile__pin" type="button" aria-pressed="false" aria-label="Pin {esc(m)}">{I("pushpin")}</button></div>' for m in modules)
    menu = (f'<div class="popover popover--menu" id="{board_id}-menu" hidden><div class="popover__head"><b>Menu</b><span class="popover__tools">'
            f'<button class="icon-btn icon-btn--ghost" type="button" aria-label="Search modules" aria-expanded="false" data-toggle="{board_id}-msearch">{I("search")}</button></span></div>'
            f'<label class="search popover__search" id="{board_id}-msearch" hidden>{I("search")}<input type="search" placeholder="Search modules" aria-label="Search modules"></label>'
            f'<p class="t-overline popover__label">Your modules · {len(modules)}</p><div class="module-tiles">{tiles_}</div></div>')
    return (f'<div class="board-bar"><span class="pop-anchor"><button class="menu-btn" type="button" aria-haspopup="true" aria-expanded="false" data-popover="{board_id}-menu">{tile("grid", "green-ink", True)}Menu{I("chevron-down")}</button>{menu}</span>'
            f'<div class="board-bar__end">{pick(board_id + "-site", site_label, "pin", [(site_label, None)] + SITES[1:])}'
            f'<button class="round-btn" type="button" aria-label="Add widget" data-hide-editing>{I("plus")}</button>'
            f'<button class="round-btn" type="button" aria-label="Edit board" aria-pressed="false" data-board-edit="{board_id}" data-hide-editing>{I("pencil")}</button>'
            f'<button class="btn btn--outline btn--sm" type="button" data-board-undo="{board_id}" data-show-editing>Undo changes</button>'
            f'<button class="btn btn--primary btn--sm" type="button" data-board-edit="{board_id}" data-show-editing>{I("check")}Done</button></div></div>')

def quick_dock():
    return (f'<div class="quick-dock"><button class="btn btn--secondary" type="button">{I("grid")}Quick actions</button>'
            f'<span class="tooltip has-count"><button class="icon-btn icon-btn--round" type="button" aria-label="Chat, 3 unread" aria-describedby="chat-tip">{I("chat")}</button><span class="count count--danger">3</span><span class="tooltip__tip" role="tooltip" id="chat-tip">Chat · opens in the ANTZ app</span></span></div>')

def appbar():
    return (f'<header class="appbar"><span class="appbar__brand">{tile("paw", "green-ink", True)}Antz</span><label class="search show-tablet-up">{I("search")}<input type="search" placeholder="Search for anything" aria-label="Search"><span class="kbd">⌘K</span></label>'
            f'<div class="appbar__end"><button class="icon-btn" type="button" aria-label="Notifications, 3 new">{I("bell")}</button>{avatar("AR", "amber")}</div></header>')

def home_shell(board_id, site_label, modules, main, side):
    return (f'<div class="shell">{tabbar()}<div class="shell__main"><div class="screen__scroll">{appbar()}'
            f'<div class="split split--aside"><div class="split__col">{board_bar(board_id, site_label, modules)}{main}{quick_dock()}</div><div class="split__col">{side}</div></div>{quick_add_dialog()}</div></div></div>')

def hero_photo(img, tag_icon, tag, title, sub, stats):
    return (f'<section class="hero-photo"><img class="hero-photo__img" src="{B}{img}" alt=""><div><span class="tag tag--glass">{I(tag_icon)}{esc(tag)}</span><h2 class="hero-photo__title">{esc(title)}</h2><p class="hero-photo__sub">{esc(sub)}</p></div>'
            '<div class="hero-photo__stats">' + ''.join(f'<div class="hero-photo__stat"><span class="glass-icon">{I(ic)}</span><div><b>{v}</b><small>{esc(t)}</small></div></div>' for ic, v, t in stats) + '</div></section>')

# ═══ Screens ═══════════════════════════════════════════════════════════════
# Home · one module (Pharmacy)
PH_MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
PH_VALUES = [900, 0, 0, 0, 1700, 0, 0, 900, 3000, 0, 38000, 14600]
pharmacy_home_main = (
    f'<section class="hero-panel"><span class="hero-panel__art" aria-hidden="true">{I("medicine")}</span><div><h2>Your pharmacy today</h2><p>Your shelf, your counter and your requests to Central.</p></div>'
    + seg(['Today', 'This week', 'This month'])
    + '<div class="hero-photo__stats">' + ''.join(f'<div class="hero-photo__stat"><span class="glass-icon{" glass-icon--danger" if d else ""}">{I(ic)}</span><div><b>{v}</b><small>{t}</small></div></div>'
        for ic, v, t, d in [('alert', '2', 'Expired medicines', True), ('send', '12', 'Requests from doctors', False), ('package', '4', 'Medicines received', False)]) + '</div></section>'
    '<div class="board" id="ph-board">'
    + widget('mint', 'clock', 'Pending requests', '52', 'At Central · oldest 212 days', remove=True)
    + widget('navy', 'user', 'Doctor-wise', '4', 'Doctors sent requests today', remove=True)
    + widget('', 'calendar', 'About to expire', '11', 'Medicines expiring in 30 days', pill='Check the shelf this week', dot='caution', remove=True)
    + '</div><div class="board board--2">'
    + list_card('Expired medicines', ''.join(item(f'<span class="rec__icon">{I("medicine")}</span>', n, b, None, status(d, 'danger'), False) for n, b, d in [('Vitamin B complex', 'Batch BA003 · 4 vials', '12 Nov'), ('Amoxiclav 625 mg', 'Batch BA007 · 2 strips', '09 Nov'), ('Calcium sandoz', 'Batch BA002 · 6 ampoules', '02 Nov')]))
    + list_card('Recent requests', ''.join(item(f'<span class="rec__icon">{I("send")}</span>', n, m, None, status(s, k), False) for n, m, s, k in [('Meloxivet, Ivermec', 'Dr. Neeta Rao · Bengal tiger · 10:40', 'New', 'info'), ('Enrofloxacin', 'Dr. Kunal Singh · Sloth bear · 10:05', 'New', 'info'), ('Ringer lactate × 2', 'Dr. Meera Iyer · Chital · 9:30', 'Dispensed', 'success')]))
    + '</div>'
    + f'<section class="list-card"><div class="list-card__head"><b>Received medicines</b>{seg(["Value", "Receipts"], label="Measure", xs=True)}</div>'
      f'<div class="chart-card"><div class="figure-block"><b>₹62,500</b><small>worth of medicines received in 12 months</small><span class="tag tag--soft">Busiest month · Oct 2026</span></div>'
      + colchart(PH_VALUES, PH_MONTHS, ['₹50k', '₹25k', '₹0'], {10: '₹38,000', 11: '₹14,600'}) + '</div></section>')
pharmacy_home_side = (f'<div class="btn-split"><button class="btn btn--secondary-solid" type="button">{I("plus")}Add to pharmacy</button>'
                      f'<span class="pop-anchor"><button class="btn btn--secondary-solid" type="button" aria-label="More ways to add" aria-haspopup="menu" aria-expanded="false" data-popover="ph-add">{I("chevron-down")}</button>'
                      f'<div class="popover popover--end" id="ph-add" hidden>' + ''.join(f'<a class="menu__item" href="#">{I(ic)}{t}</a>' for ic, t in [('package', 'Receive medicines'), ('swap', 'Dispense to a keeper'), ('send', 'Request from Central'), ('refresh', 'Return to Central')]) + '</div></span></div>'
                      + quick_add_tiles() + announcements_card() + notes_card())
HOME_PHARMACY = home_shell('ph-board', 'Srushti site pharmacy', ['Pharmacy', 'Announcements', 'Help desk'], pharmacy_home_main, pharmacy_home_side)

# Home · three modules (Animals, Eggs, Collections)
bars = ''.join(f'<span class="bars__item"><b>{v}</b><span class="bars__col"><i style="--v:{v / 148:.2f}"></i></span><span>{n}</span></span>' for v, n in [(148, 'Crimson Frosted'), (121, 'Hollowpine'), (96, 'Foxglen'), (84, 'Clearspring'), (72, 'Ambergrove')])
animal_home_main = (
    hero_photo('giraffe.webp', 'paw', 'Species management', 'Every species, every site', 'Track every animal across all your sites, in one place.', [('paw', '2,411', 'Species'), ('paw', '110,020', 'Animals'), ('pin', '9', 'Sites')])
    + '<div class="board board--2" id="ac-board">'
    + widget('sky', 'paw', 'Animals', '643', '', sub='Newly added · last 7 days, by site', remove=True, extra=f'<div class="bars">{bars}</div>')
    + widget('glow', 'package', 'Eggs', '696', 'from clutch to hatch', remove=True)
    + widget('', 'grid', 'Collections', None, '', sub='New species · last 30 days', remove=True, cls='board__full',
             extra=thumbs([('macaw-blue.webp', 'Sarus crane'), ('tiger-coat.webp', 'Star tortoise'), ('plumage.webp', 'Hill myna')], 9))
    + '</div>')
ANIMAL_HOME = home_shell('ac-board', 'All sites', ['Animals', 'Eggs', 'Collections'], animal_home_main,
                         quick_add_tiles() + today_card([('paw', 'Weight checks', 'Animals', '34')], 1, 3) + announcements_card() + notes_card())

# Home · seven modules (Medical and care)
med_split = (
    '<section class="split-card board__full">'
    + f'<article class="widget widget--photo"><img class="widget__img" src="{B}fur.webp" alt=""><div class="widget__head"><span class="widget__icon">{I("clipboard")}</span><span class="widget__title"><b>Hospital</b></span><a class="widget__go" href="#" aria-label="Open Hospital">{I("arrow-up-right")}</a></div><span class="widget__spacer"></span><b class="widget__figure">41</b><span class="widget__caption">Under care now · 29 ours · 12 from outside</span></article>'
    + '<div><div class="list-card__head"><b>Critical now</b><span class="t-small" style="--c:0">5 patients</span></div>'
    + ''.join(item(media(img, None), n, m, None, status(bed, 'danger'), False) for img, n, m, bed in [('tiger-coat.webp', 'Bengal tiger · Dheera', 'Post-op day 2 · laparotomy', 'ICU 2'), ('fur.webp', 'Sloth bear · Balu', 'Respiratory distress', 'Room 114'), ('giraffe.webp', 'Indian leopard · Veer', 'Bite wounds · septic', 'ICU 1')])
    + '</div><div class="split-card__tiles"><div class="status-tile status-tile--danger"><small>Emergencies incoming</small><b>2</b><span>Waiting to be admitted</span></div><div class="status-tile status-tile--caution"><small>Prescriptions due today</small><b>98</b><span>30 overdue</span></div></div></section>')
focus = (f'<section class="card board__full"><div class="card__head"><span class="tile-icon" style="--c:var(--hue-amber-ink)">{I("zap")}</span><div><b class="card__title">Focus hub</b><span class="card__meta">Your recents and saved work</span></div>'
         f'<div class="icon-tabs" role="tablist" aria-label="Focus hub"><button type="button" role="tab" aria-selected="true" aria-label="Recents">{I("clock")}<span>Recents <i class="count">6</i></span></button><button type="button" role="tab" aria-selected="false" aria-label="Favourites">{I("heart")}<span>Favourites</span></button><button type="button" role="tab" aria-selected="false" aria-label="Bookmarks">{I("tag")}<span>Bookmarks</span></button><button type="button" role="tab" aria-selected="false" aria-label="Folders">{I("file")}<span>Folders</span></button></div></div><div class="photo-strip">'
         + ''.join(f'<a class="photo-tile" href="#"><img src="{B}{img}" alt=""><span class="{sexcls(s)}">{s}</span><span class="photo-tile__text"><b>{a}</b><small>{n}</small></span></a>' for img, s, a, n in [('giraffe.webp', 'F', 'AAID:190317', 'Slate Pangolin'), ('plumage.webp', 'UD', 'AAID:143944', 'Glacial Egret'), ('tiger-coat.webp', 'UD', 'AAID:172277', 'Russet Whipsnake'), ('fur.webp', 'F', 'AAID:169095', 'Marbled Phantom Saki')])
         + '</div></section>')
medical_home_main = (
    hero_photo('macaw-blue.webp', 'heart', 'Medical and care', 'Every patient, every treatment', 'Treatments, hospital, lab and pharmacy in one place.', [('heart', '184', 'Open cases'), ('syringe', '312', 'Treatments'), ('user', '12', 'Vets on duty')])
    + '<div class="board" id="md-board">'
    + f'<article class="widget widget--ink"><button class="widget__remove" type="button" aria-label="Remove Mortality">{I("minus")}</button><div class="widget__head"><span class="widget__icon">{I("heart")}</span><span class="widget__title"><b>Mortality</b></span>{seg(["7D", "30D", "30+"], xs=True)}</div><span class="widget__spacer"></span><b class="widget__figure">192</b><span class="widget__caption">Deaths recorded</span></article>'
    + widget('', 'medicine', 'Pharmacy', '18', 'Requests waiting to ship', remove=True)
    + widget('mint', 'test-tube', 'Lab', '63', 'Samples at the lab', remove=True)
    + med_split + focus + '</div>')
MEDICAL_HOME = home_shell('md-board', 'All sites', ['Medical', 'Hospital', 'Pharmacy', 'Lab', 'Mortality', 'Announcements', 'Help desk'], medical_home_main,
                          quick_add_tiles() + today_card([('syringe', 'Deworming', 'Administer', '319'), ('syringe', 'Vaccinations', 'Administer', '143'), ('heart', 'Treatment follow-ups', 'Medical', '27')], 3, 3) + announcements_card())

# Pharmacy module
PH_NAV = [('Daily work', [('file', 'navy', 'Requests', '132', False, ['All requests', 'By product', 'New product requests']), ('swap', 'green', 'Dispense', '137'), ('refresh', 'coral', 'Returns', None)]),
          ('Shipments', [('truck', 'sky', 'Incoming', None), ('truck', 'navy', 'Outgoing', None), ('pin', 'green', 'Direct dispatch (local)', None)]),
          ('Stock', [('package', 'teal', 'Stock report', None), ('sliders', 'amber', 'Stock adjustment', None), ('grid', 'navy', 'Racks and shelves', None)]),
          ('Reports and setup', [('bar-chart', 'violet', 'Reports', None, False, ['Consumption', 'Dispense', 'Dispatch', 'Return', 'Reconciliation']), ('settings', 'navy', 'Master lists', None)])]
def req_row(rid, tag, tagk, line, person, ini, hue, when, wait, late, pend, st, stk, stsub):
    t = f'<span class="prio-tag{"" if tagk == "danger" else " prio-tag--" + tagk}">{I("alert") if tagk == "danger" else ""}{esc(tag)}</span>' if tag else ''
    return (f'<a class="rec" href="#"><span class="rec__icon">{I("file")}</span><span class="rec__main"><b>{esc(rid)}{t}</b><span>{esc(line)}</span></span>'
            f'<span class="rec__person">{avatar(ini, hue)}<div>{esc(person)}<small>{esc(when)}</small></div></span>'
            f'<span class="rec__figs"><span><b{LATE if late else ""}>{esc(wait)}</b><small>waiting</small></span><span><b>{esc(pend)}</b><small>pending</small></span></span>'
            f'<span class="rec__status">{status(st, stk)}<small>{esc(stsub)}</small></span>{I("chevron-right")}</a>')
REQ_ROWS = [('RES002839', 'Urgent', 'danger', 'To Adirampattinam central pharmacy', 'Sourav Tambe', 'ST', 'green', '10 Nov 2026', '1 day', False, '1 of 1', 'Requested', 'caution', 'Nothing shipped yet'),
            ('RES002835', None, None, 'To Adirampattinam central pharmacy', 'Kunal Singh', 'KS', 'sky', '27 Oct 2026', '15 days', False, '4 of 4', 'Requested', 'caution', 'Nothing shipped yet'),
            ('RES002831', 'High', 'high', 'To Central pharmacy', 'Deelip Kumar', 'DK', 'green', '13 Oct 2026', '29 days', False, '3 of 3', 'Requested', 'caution', 'Nothing shipped yet'),
            ('RES002815', None, None, 'To Central pharmacy', 'Ovi Wagh', 'OW', 'navy', '18 Aug 2026', '85 days', False, '2 of 3', 'Partly shipped', 'info', 'Last shipment 18 Aug 2026'),
            ('RES002791', 'High', 'high', 'To Adirampattinam central pharmacy', 'Meera Iyer', 'MI', 'teal', '25 May 2026', '170 days', False, '1 of 1', 'Partly shipped', 'info', 'Last shipment 25 May 2026'),
            ('RES002779', 'Urgent', 'danger', 'To Adirampattinam central pharmacy', 'Ravi Kumar', 'RK', 'teal', '13 Apr 2026', '212 days', True, '1 of 2', 'Partly shipped', 'info', 'Last shipment 13 Apr 2026')]
pharmacy_main = (
    '<div class="board">'
    + widget('navy hero', 'medicine', 'Pharmacy · all time · all pharmacies', '132', 'medicine requests · ₹48,60,000 requested', cls='board__wide')
    + widget('', 'truck', 'Waiting to ship', '18', 'requests not shipped yet', pill='5 urgent', dot='danger')
    + widget('mint', 'swap', 'Dispensed', '137', 'times medicine was handed out', pill='310 units', dot='success')
    + widget('navy', 'truck', 'Shipments', '96', 'delivered from Central')
    + widget('', 'alert', 'Low stock', '4', 'medicines under 25 units', pill='Reorder soon', dot='caution')
    + '</div><div class="board board--2">'
    + list_card('Urgent requests', '<div class="rec-list">' + ''.join(req_row(*r) for r in [REQ_ROWS[0], REQ_ROWS[2], REQ_ROWS[5]]) + '</div>')
    + list_card('Most dispensed medicines', ''.join(rank(n, s, v, c) for n, s, v, c in [('Calcium sandoz', 'Calcium gluconate 10%', 1, '17'), ('Ringer lactate', 'Compound sodium lactate', .94, '16'), ('Enrofloxacin', 'Enrofloxacin 50 mg/ml', .76, '13'), ('Vitamin B complex', 'Vitamin B complex injection', .59, '10'), ('Amoxiclav', 'Amoxicillin + clavulanate 625 mg', .53, '9')]))
    + '</div>')
PHARMACY = module_page('Pharmacy', 'All pharmacies', PH_NAV, 'New request', pharmacy_main, period=True)

def list_page(title, count, desc, action, toolbar, head, rows, shown, total, pages=2):
    return (f'<div class="list-head"><div><h2>{esc(title)}{f" <small>{count}</small>" if count else ""}</h2><p>{esc(desc)}</p></div>'
            + (f'<button class="btn btn--outline" type="button">{I("plus")}{esc(action)}</button>' if action else '') + '</div>'
            + f'<section class="list-panel"><div class="toolbar">{toolbar}</div><div class="rec-list"><div class="rec rec--head" aria-hidden="true">' + ''.join(f'<span>{esc(h)}</span>' for h in head) + f'<span></span></div>{rows}</div>{pagination(shown, total, pages)}</section>')

PH_REQUESTS = module_page('Pharmacy', 'All pharmacies', PH_NAV, 'New request',
    list_page('Requests', 132, 'Medicine requests sent to a central pharmacy, and what has been shipped.', 'New request',
              tabs_with_counts([('Pending', 8), ('Shipped', None), ('Disputes', None), ('Cancelled', None), ('All', None)]) + search('Search request ID, medicine or person'),
              ['Request', 'Requested by', 'Waiting · pending items', 'Status'], ''.join(req_row(*r) for r in REQ_ROWS), 6, 132), active='All requests', period=True)

def disp_row(did, where, person, ini, hue, animals, meds, units):
    return (f'<a class="rec" href="#"><span class="rec__icon">{I("swap")}</span><span class="rec__main"><b>{esc(did)}</b><span>{esc(where)}</span></span>'
            f'<span class="rec__person">{avatar(ini, hue)}<div>{esc(person)}</div></span>'
            f'<span class="rec__figs"><span><b>{animals}</b><small>{"animal" if animals == "1" else "animals"}</small></span><span><b>{meds}</b><small>{"medicine" if meds == "1" else "medicines"}</small></span></span>'
            f'<span class="rec__figs"><span><b>{units}</b><small>{"unit" if units == "1" else "units"}</small></span></span>{I("chevron-right")}</a>')
PH_DISPENSE = module_page('Pharmacy', 'All pharmacies', PH_NAV, 'New dispense',
    list_page('Dispense', 137, 'Medicines handed out from a pharmacy to a keeper or vet, for an animal.', 'New dispense',
              tabs_with_counts([('All', None), ('For animals', None), ('No animal', None)]) + search('Search dispense ID, medicine or person'),
              ['Dispense', 'Dispensed to', 'Animals · medicines', 'Quantity'],
              ''.join(disp_row(*r) for r in [('DIS580', 'Adirampattinam central · 11 Nov · 10:00', 'Bharathi W', 'BW', 'teal', '1', '1', '1'), ('DIS578', 'Hospital pharmacy · 07 Nov · 11:11', 'Ovi Wagh', 'OW', 'navy', '—', '2', '5'),
                                             ('DIS576', 'Mammu local pharmacy · 04 Nov · 12:22', 'Ravi Kumar', 'RK', 'teal', '1', '3', '12'), ('DIS574', 'Hospital pharmacy · 31 Oct · 13:33', 'Sourav Tambe', 'ST', 'green', '2', '1', '4'),
                                             ('DIS572', 'Adirampattinam central · 28 Oct · 14:44', 'Kunal Singh', 'KS', 'sky', '1', '2', '6'), ('DIS570', 'Hospital pharmacy · 24 Oct · 15:55', 'Deelip Kumar', 'DK', 'green', '—', '3', '6')]), 6, 137), active='Dispense', period=True)

# Hospital module
HO_NAV = [('Patients', [('download', 'coral', 'Incoming', 7, True), ('file', 'navy', 'All patients', '41')]),
          ('Diagnostic imaging', [('image', 'sky', 'Imaging requests', '20'), ('swap', 'violet', 'Result comparer', None)]),
          ('Insights', [('bar-chart', 'amber', 'Analytics', None), ('users', 'green', 'Doctors and staff', '24')]),
          ('Settings', [('home', 'navy', 'Cages and enclosures', '36'), ('settings', 'navy', 'Masters', None)])]
week = '<div class="week-strip">' + ''.join(f'<button type="button"{ACD if d == 11 else ""}{HASEV if d in (11, 12) else ""}>{w}<b>{d}</b></button>' for w, d in [('Su', 8), ('Mo', 9), ('Tu', 10), ('We', 11), ('Th', 12), ('Fr', 13), ('Sa', 14)]) + '</div>'
agenda = '<div class="agenda">' + ''.join(f'<div class="agenda__row"><span class="agenda__time">{t}</span><div class="agenda__event" style="--c:var(--hue-{h})"><b>{a}</b><small>{b}</small></div></div>'
                                          for t, h, a, b in [('09:00', 'green', 'Rounds · ICU and wards', 'Dr. Vivek Rao · 6 patients'), ('10:00', 'sky', 'CT scan · Bengal tiger Dheera', 'Gagwa Hospital · Dr. Meera Iyer'), ('11:00', 'amber', 'Vaccinations · 2 animals', 'Dr. Suresh Nair'), ('14:00', 'sky', 'X-ray thorax · Sloth bear', 'Dr. Suresh Nair')]) + '</div>'
hospital_main = (
    '<div class="board">'
    + f'<article class="widget widget--photo widget--hero board__wide"><img class="widget__img" src="{B}fur.webp" alt=""><div class="widget__head"><span class="tag tag--glass">Under care now · all hospitals</span><span class="widget__spacer"></span><a class="widget__go" href="#" aria-label="Open patients">{I("arrow-up-right")}</a></div><span class="widget__spacer"></span><b class="widget__figure">41</b><span class="widget__caption">animals · 3 admitted, 38 outpatients</span>'
      '<div class="widget__chips"><div class="glass-chip"><b>29</b><small>Our collection</small></div><div class="glass-chip"><b>12</b><small>From outside</small></div></div></article>'
    + widget('', 'alert', 'Critical', '5', '3 admitted · 2 incoming', pill='Needs constant attention', dot='danger')
    + widget('', 'medicine', 'Prescriptions due', '98', 'doses still to give today', pill='30 overdue', dot='caution')
    + widget('mint', 'arrow-up-right', 'Discharged', '15', 'went home today')
    + widget('', 'heart', 'Mortality', '2', 'deaths today')
    + '</div><div class="board board--2">'
    + list_card('Needs your attention · 6', attn('alert', 'danger', 'Indian leopard · hit by a vehicle', 'Critical', 'danger', 'Incoming emergency · suspected pelvic fracture · TR-00240', 'Admit')
                + attn('alert', 'danger', 'Gaur · collapsed, not able to stand', 'Critical', 'danger', 'Incoming emergency · Bannerghatta park · TR-00241', 'Admit')
                + attn('test-tube', 'warning', 'Bengal tiger · creatinine 4.2 mg/dL', 'High', 'high', 'Kidney panel · released 10:40 · LAB-122263', 'Review')
                + attn('calendar', 'warning', 'Blackbuck · follow-up overdue', '2 days', 'high', 'Was due 09 Nov 2026 · wound review', 'Book'))
    + f'<section class="list-card"><div class="list-card__head"><b>Today</b><a href="#">Schedule</a></div>{week}{agenda}</section>'
    + '</div>')
HOSPITAL = module_page('Hospital', 'All hospitals', HO_NAV, 'Add patient', hospital_main, site_icon='clipboard')

def patient_row(img, sex, name, tags, mid, day, reason, bed, vet, health, hk):
    tg = ''.join(f'<span class="prio-tag prio-tag--{"info" if t == "External" else "plain"}">{t}</span>' for t in tags)
    return (f'<a class="rec" href="#">{media(img, sex)}<span class="rec__main"><b>{esc(name)}{tg}</b><span>{esc(mid)}</span><em>{esc(day)}</em></span>'
            f'<span class="rec__text">{esc(reason)}</span><span class="rec__text">{esc(bed)}<small>{esc(vet)}</small></span><span class="rec__status">{status(health, hk)}</span>{I("chevron-right")}</a>')
HO_PATIENTS = module_page('Hospital', 'All hospitals', HO_NAV, 'Add patient',
    list_page('All patients', None, 'Everyone the hospital has looked after.', None,
              tabs_with_counts([('Under care', 41), ('Critical', 3), ('Discharged', 3), ('Transferred', 1), ('Follow up', 3)]) + search('Search animal, AAID or case') + seg(['All', 'IPD', 'OPD'], label='Care type'),
              ['Animal', 'Reason', 'Bed · vet', 'Health'],
              ''.join(patient_row(*r) for r in [('tiger-coat.webp', 'M', 'Bengal tiger · Dheera', ['IPD'], 'MED-12345/25', 'Day 7 · Feline care hospital', 'Post-op day 2 · laparotomy for a swallowed foreign body', 'ICU 2 · Bed 3', 'Dr. Meera Iyer', 'Critical', 'danger'),
                                                ('fur.webp', 'M', 'Sloth bear · Balu', ['IPD'], 'MED-12402/25', 'Day 4 · City vet hospital', 'Respiratory distress · suspected pneumonia', 'Room 114', 'Dr. Suresh Nair', 'Critical', 'danger'),
                                                ('giraffe.webp', 'F', 'Indian leopard · Veer', ['IPD', 'External'], 'MED-12421/25', 'Day 3 · Gagwa hospital', 'Bite wounds · septic, on IV antibiotics', 'ICU 1', 'Dr. Meera Iyer', 'Critical', 'danger'),
                                                ('plumage.webp', 'M', 'Bonnet macaque', ['IPD'], 'MED-12360/25', 'Day 5 · Feline care hospital', 'Severe dehydration after 3 days of diarrhoea', 'Room 230', 'Dr. Vivek Rao', 'Guarded', 'caution'),
                                                ('zebra.webp', 'M', 'Spotted deer', ['OPD'], 'MED-12397/25', 'Day 1 · Gagwa hospital', 'Limping on the left hind leg since yesterday', 'OPD', 'Dr. Arjun Das', 'Stable', 'info'),
                                                ('elephant.webp', 'F', 'Gaur', ['OPD', 'External'], 'MED-12415/25', 'Day 1 · Feline care hospital', 'Routine foot check before the monsoon', 'OPD', 'Dr. Suresh Nair', 'Normal', 'success')]), 6, 41, 1),
    active='All patients', site_icon='clipboard')

def incoming_row(img, sex, name, crit, ids, frm, purpose, why, who, when):
    return (f'<div class="rec">{media(img, sex)}<span class="rec__main"><b>{esc(name)}{CRIT if crit else ""}</b><span>{esc(ids)}</span><em>{esc(frm)}</em></span>'
            f'<span class="rec__text">{esc(purpose)}<small>{esc(why)}</small></span><span class="rec__text">{esc(who)}<small>{esc(when)}</small></span>'
            f'<span><button class="btn btn--secondary btn--sm" type="button">Admit</button></span>{I("chevron-right")}</div>')
HO_INCOMING = module_page('Hospital', 'All hospitals', HO_NAV, 'Add patient',
    list_page('Incoming', None, 'Animals on their way in: admissions and imaging arrivals.', None,
              tabs_with_counts([('Admission', 4), ('Imaging', 3)]) + search('Search animal, AAID or case'),
              ['Animal', 'Purpose', 'Requested by', ''],
              ''.join(incoming_row(*r) for r in [('giraffe.webp', 'M', 'Indian leopard', True, 'AN-2024-0117b · TR-00240', 'From Rescue and rehab centre', 'Emergency', 'Hit by a vehicle · suspected pelvic fracture', 'Dr. Ananya Rao', '11 Nov 2026'),
                                                 ('elephant.webp', 'M', 'Gaur', True, '87719 · TR-00241', 'From Bannerghatta park', 'Emergency', 'Collapsed this morning, not able to stand', 'Keeper Ravi', '11 Nov 2026'),
                                                 ('tiger-coat.webp', 'F', 'Indian rock python', False, '87650 · TR-00238', 'From Reptile house', 'Check up', 'Not eating for 3 weeks · stuck shed', 'Keeper Arjun', 'Waiting 1 day 4 h'),
                                                 ('zebra.webp', 'UD', 'Indian star tortoise', False, '87733 · TR-00236', 'From Reptile house', 'Check up', 'Hairline shell crack after a fall', 'Dr. Shyam Menon', '10 Nov 2026')]), 4, 4, 1),
    active='Incoming', site_icon='clipboard')

# Announcements module
AN_NAV = [('Feed', [('file', 'green', 'All', '6'), ('alert', 'coral', 'Important', '2'), ('user', 'navy', 'Created by me', '2')])]
announcements_main = (
    '<div class="board">'
    + f'<section class="hero-photo board__wide"><img class="hero-photo__img" src="{B}elephant.webp" alt=""><div><span class="tag tag--glass">Latest · 4 h ago · Neeta Rao</span></div>'
      f'<div>{status("Important", "danger")}<h2 class="hero-photo__title">Heavy rain alert: secure aviary nets tonight</h2><p class="hero-photo__sub">The weather office expects heavy rain and strong winds from 6 PM.</p></div></section>'
    + widget('', 'alert', 'Important', '2', 'need your attention', pill='Read before your shift', dot='danger')
    + widget('mint', 'megaphone', 'This week', '5', 'announcements posted')
    + widget('navy', 'user', 'Created by me', '2', 'you posted', pill='1 scheduled', dot='info')
    + widget('', 'heart', 'Reactions', '138', 'likes this month')
    + '</div><div class="board board--2">'
    + list_card('Latest', ''.join(item(media(img) if img else f'<span class="rec__icon">{I(ic)}</span>', t, m, None, f'<span class="meta-count">{I("heart")}{n}</span>', True)
                                  for img, ic, t, m, n in [('macaw-blue.webp', None, 'Animal of the day: the Sarus crane', 'Neeta Rao · 22 h ago', '24'), (None, 'megaphone', 'New vet duty roster from Monday', 'Prajwal Shetty · 2 d ago', '9'), ('tiger-coat.webp', None, 'Tiger enclosure reopens to visitors', 'Kunal Singh · 4 d ago', '31'), (None, 'alert', 'Fire drill on Thursday, 11 AM', 'Prajwal Shetty · 6 d ago', '12')]))
    + list_card('Ending soon on the home screen', ''.join(f'<a class="item" href="#"><span class="item__body"><b>{esc(t)}</b><span>Until {esc(u)}</span></span><span class="item__end"><b class="{"is-soon" if d == "1d" else ""}">{d}</b>left</span>{I("chevron-right")}</a>'
                                                          for t, u, d in [('Heavy rain alert: secure aviary nets tonight', '12 Nov 2026', '1d'), ('Fire drill on Thursday, 11 AM', '13 Nov 2026', '2d'), ('Tiger enclosure reopens to visitors', '14 Nov 2026', '3d'), ('New vet duty roster from Monday', '16 Nov 2026', '5d')]))
    + '</div>')
ANNOUNCEMENTS = module_page('Announcements', 'All sites', AN_NAV, 'New announcement', announcements_main)

# ── Page writer (screens) ─────────────────────────────────────────────────
SKELETON = open('pages/screen-home.html').read()
def screen_page(slug, title, intro, icon, hue, tpl, caps, do, dont):
    s = SKELETON
    s = re.sub(r'<title>[^<]*</title>', f'<title>{esc(title)} · Antz Design System</title>', s, 1)
    s = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(intro)}">', s, 1)
    s = re.sub(r'<h1 class="page-banner__title">[^<]*</h1>', f'<h1 class="page-banner__title">{esc(title)}</h1>', s, 1)
    s = re.sub(r'<p class="page-banner__intro">[^<]*</p>', f'<p class="page-banner__intro">{esc(intro)}</p>', s, 1)
    s = re.sub(r'<div class="page-banner__art" style="[^"]*"', f'<div class="page-banner__art" style="--c:var(--hue-{hue})"', s, 1)
    s = re.sub(r'(<div class="page-banner__art"[^>]*>)<svg class="icon"><use href="#i-[a-z-]+"/></svg>', rf'\1<svg class="icon"><use href="#i-{icon}"/></svg>', s, 1)
    s = re.sub(r'id="screen-[a-z-]+-sizes"', f'id="screen-{slug}-sizes"', s, 1)
    s = re.sub(r'id="screen-[a-z-]+-usage"', f'id="screen-{slug}-usage"', s, 1)
    s = re.sub(r'<template>.*?</template>', lambda m: '<template>' + tpl + '</template>', s, 1, flags=re.S)
    k = iter(caps)
    s = re.sub(r'(<figcaption><b>[^<]*</b>)<span>[^<]*</span></figcaption>', lambda m: f'{m.group(1)}<span>{esc(next(k))}</span></figcaption>', s, count=4)
    s = re.sub(r'(<div class="doc" id="screen-[a-z-]+-usage"><h3>)[^<]*(</h3>)', rf'\g<1>{esc(title)}\2', s, 1)
    dd = ('<div class="dd"> <div class="do"><b><svg class="icon icon--sm"><use href="#i-check"/></svg>Do</b><ul>' + ''.join(f'<li>{esc(x)}</li>' for x in do) + '</ul></div> '
          '<div class="dont"><b><svg class="icon icon--sm"><use href="#i-x"/></svg>Don\'t</b><ul>' + ''.join(f'<li>{esc(x)}</li>' for x in dont) + '</ul></div> </div>')
    s = re.sub(r'<div class="dd">.*?</div> </div>', lambda m: dd, s, 1, flags=re.S)
    open(f'pages/screen-{slug}.html', 'w').write(s)
    print('screen', slug)

HOME_CAPS = ['Board stacks: the hero, then widgets one per row, then the side column. Tab bar at the bottom.', 'Top bar with search; widgets two per row; the side column moves below.', 'Widgets two per row; the side column below.', 'Board beside the side column: quick add, today, announcements, notes.']
MOD_CAPS = ['Module bar, the side panel as a scrolling strip, then one widget per row.', 'Side panel beside the content, two widgets per row.', 'Side panel beside the content; lists side by side.', 'Side panel beside a three-column board.']
LIST_CAPS = ['Records fold to two lines: the main line, then details. Filters scroll sideways.', 'Side panel beside the list; records fold to two lines.', 'Side panel beside the list; columns appear when there is room.', 'Full columns: record, person, figures, status.']
ROLE_DO = ['Build the home from the modules this person can use: one module gets a dedicated home, more modules get a board.', 'Keep quick add, today and announcements in the side column at every access level.']
ROLE_DONT = ['Show widgets for modules the person cannot open.', 'Put two filled main actions in one view.']
MOD_DO = ['Start with the side panel: module home, pages grouped by task, counts, one main action.', 'Put status in a status pill, never in a widget fill.']
MOD_DONT = ['Give two widgets the same fill side by side.', 'Use peach, maroon or a hue to mean bad news.']
LIST_DO = ['Lead each row with the record ID and its priority tag; end with the status.', 'Show the count in the title and in the filter tabs.']
LIST_DONT = ['Put a filled main button on every row: use the soft secondary button.', 'Hide the search on phones.']

screen_page('home-pharmacy', 'Home · one module', 'The home for someone with one module (Pharmacy): a panel hero with today, the week or the month, widgets, lists and a 12-month chart.', 'medicine', 'teal', HOME_PHARMACY, HOME_CAPS, ROLE_DO, ROLE_DONT)
screen_page('home-animal-care', 'Home · three modules', 'The home for someone with Animals, Eggs and Collections: the species hero, two widgets and new species as photos.', 'paw', 'sky', ANIMAL_HOME, HOME_CAPS, ROLE_DO, ROLE_DONT)
screen_page('home-medical', 'Home · seven modules', 'The home for the medical team: the care hero, Mortality, Pharmacy and Lab, the Hospital split card and the Focus hub.', 'heart', 'green', MEDICAL_HOME, HOME_CAPS, ROLE_DO, ROLE_DONT)
screen_page('pharmacy', 'Pharmacy', 'The Pharmacy module home: requests, dispensing, shipments and low stock, urgent requests and the most dispensed medicines.', 'medicine', 'teal', PHARMACY, MOD_CAPS, MOD_DO, MOD_DONT)
screen_page('pharmacy-requests', 'Pharmacy · requests', 'A record list: requests with priority tags, who asked, how long they have waited, what is pending and their status.', 'file', 'teal', PH_REQUESTS, LIST_CAPS, LIST_DO, LIST_DONT)
screen_page('pharmacy-dispense', 'Pharmacy · dispense', 'A record list: medicines handed out, to whom, for how many animals and how many units.', 'swap', 'teal', PH_DISPENSE, LIST_CAPS, LIST_DO, LIST_DONT)
screen_page('hospital', 'Hospital', 'The Hospital module home: animals under care, critical, prescriptions, discharges, what needs attention and today\'s schedule.', 'clipboard', 'navy', HOSPITAL, MOD_CAPS, MOD_DO, MOD_DONT)
screen_page('hospital-patients', 'Hospital · patients', 'A record list with photos: each patient, why they are here, their bed and vet, and their health.', 'file', 'navy', HO_PATIENTS, LIST_CAPS, LIST_DO, LIST_DONT)
screen_page('hospital-incoming', 'Hospital · incoming', 'Animals on their way in, each with an Admit action.', 'download', 'coral', HO_INCOMING, LIST_CAPS, LIST_DO, LIST_DONT)
screen_page('announcements', 'Announcements', 'The Announcements module home: the latest, important, this week, your posts, reactions, and what leaves the home screen soon.', 'megaphone', 'green', ANNOUNCEMENTS, MOD_CAPS, MOD_DO, MOD_DONT)

# Nav: screens
nav_p = 'pages/_nav.json'
nav = json.load(open(nav_p), object_pairs_hook=collections.OrderedDict)
scr = [g for g in nav['groups'] if g['title'] == 'Screens'][0]
have = [l['href'] for l in scr['links']]
insert_after = 'screen-home.html'
for href, t in [('screen-home-pharmacy.html', 'Home · one module'), ('screen-home-animal-care.html', 'Home · three modules'), ('screen-home-medical.html', 'Home · seven modules')]:
    if href not in have:
        scr['links'].insert([l['href'] for l in scr['links']].index(insert_after) + 1, collections.OrderedDict([('href', href), ('title', t), ('isNew', True)])); insert_after = href
insert_after = 'screen-mortality.html'
for href, t in [('screen-pharmacy.html', 'Pharmacy'), ('screen-pharmacy-requests.html', 'Pharmacy · requests'), ('screen-pharmacy-dispense.html', 'Pharmacy · dispense'), ('screen-hospital.html', 'Hospital'), ('screen-hospital-patients.html', 'Hospital · patients'), ('screen-hospital-incoming.html', 'Hospital · incoming'), ('screen-announcements.html', 'Announcements')]:
    if href not in [l['href'] for l in scr['links']]:
        scr['links'].insert([l['href'] for l in scr['links']].index(insert_after) + 1, collections.OrderedDict([('href', href), ('title', t), ('isNew', True)])); insert_after = href

# ═══ Component library pages (docs-src) ══════════════════════════════════
def doc(did, title, lead, demo, canvas=True):
    return f'<div class="doc" id="{did}"><h3>{esc(title)}</h3><p class="lead">{lead}</p><div class="demo{" demo--canvas" if canvas else ""} demo--col">{demo}</div></div>\n'
def usage(did, title, do, dont):
    return (f'<div class="doc" id="{did}"><h3>{esc(title)}</h3><div class="dd"><div class="do"><b>{I("check")}Do</b><ul>' + ''.join(f'<li>{x}</li>' for x in do) + f'</ul></div>'
            f'<div class="dont"><b>{I("x")}Don\'t</b><ul>' + ''.join(f'<li>{x}</li>' for x in dont) + '</ul></div></div></div>\n')
def code(did, title, classes, example):
    return (f'<div class="doc" id="{did}"><h3>{esc(title)}</h3><h4>Classes</h4><div class="chips">' + ''.join(f'<code>{c}</code>' for c in classes) + '</div>'
            f'<details class="code" open><summary>Markup</summary><pre><code>{esc(example)}</code></pre></details></div>\n')
def write_doc(slug, meta, overview, use, cod):
    open(f'docs-src/{slug}.html', 'w').write(f'<!--meta {json.dumps(meta)}-->\n{overview}<!--usage-->\n{use}<!--code-->\n{cod}')
    print('doc', slug)
def frame(inner, width=None): return f'<div class="shell-host demo-frame"{maxw(width)}>{inner}</div>'

# 1. Record lists (Components)
rl_demo = frame(list_page('Requests', 132, 'Medicine requests sent to a central pharmacy.', 'New request',
                          tabs_with_counts([('Pending', 8), ('Shipped', None), ('All', None)]) + search('Search request ID, medicine or person'),
                          ['Request', 'Requested by', 'Waiting · pending items', 'Status'], ''.join(req_row(*r) for r in REQ_ROWS[:4]), 4, 132))
pt_demo = frame('<section class="list-panel"><div class="rec-list">' + ''.join(patient_row(*r) for r in [('tiger-coat.webp', 'M', 'Bengal tiger · Dheera', ['IPD'], 'MED-12345/25', 'Day 7 · Feline care hospital', 'Post-op day 2 · laparotomy', 'ICU 2 · Bed 3', 'Dr. Meera Iyer', 'Critical', 'danger'), ('giraffe.webp', 'F', 'Indian leopard · Veer', ['IPD', 'External'], 'MED-12421/25', 'Day 3 · Gagwa hospital', 'Bite wounds · septic', 'ICU 1', 'Dr. Meera Iyer', 'Guarded', 'caution')]) + '</div></section>')
tags_demo = ('<div class="cell demo-cell--row"><span class="prio-tag">' + I('alert') + 'Urgent</span> <span class="prio-tag prio-tag--high">High</span> <span class="prio-tag prio-tag--info">External</span> <span class="prio-tag prio-tag--plain">IPD</span></div>')
def user_item(ini, hue, name, role, t):
    return f'<a class="item" href="#"><span class="item__media item__media--round"><span class="avatar" style="--av-bg:var(--hue-{hue}-soft);--av-fg:var(--hue-{hue}-ink)">{ini}<span class="avatar__presence"></span></span></span><span class="item__body"><b>{esc(name)}</b><span>{esc(role)}</span></span><span class="item__end">{t}</span>{I("chevron-right")}</a>'
write_doc('record-lists', {'title': 'Record lists', 'group': 'Components', 'intro': 'Lists of records with a page head, filter tabs with counts, a search, rows that fold into lines on narrow screens, priority tags and pagination.', 'icon': 'file', 'hue': 'navy'},
          doc('rl-page', 'Record list page', 'A <b>list head</b> (title, count, description, one outline action), a <b>toolbar</b> (filter tabs with counts and a search), the <b>record list</b> and <b>pagination</b>. Columns: an icon, the record ID with its priority tag, the person, figures, and the status with a note.', rl_demo)
          + doc('rl-photo', 'Records with photos', 'Animal records lead with the photo and its sex tag; reason, bed and vet follow; health is a status chip.', pt_demo)
          + doc('rl-people', 'People', 'People rows lead with a <b>round</b> photo or initials (<code>item__media--round</code>) with a presence dot, then the name and role, and the time on the right.', frame(list_card('Active today', user_item('NR', 'teal', 'Neeta Rao', 'Super admin', '12:01 PM') + user_item('SR', 'sky', 'Sowmya R', 'Vet, Feline care', '11:24 AM') + user_item('KS', 'navy', 'Kunal Singh', 'Keeper, Reptiles', '10:02 AM'))).replace('class="shell-host demo-frame"', 'class="shell-host demo-frame demo-frame--narrow"', 1))
          + doc('rl-tags', 'Priority tags', 'Small inline tags beside an ID. Urgent and High use the danger and warning colours; IPD and External are plain information.', tags_demo, canvas=False),
          usage('rl-usage', 'Record lists', ['Put the record ID first and the status last.', 'Show counts on the filter tabs.', 'Let rows fold: under 760px each row becomes two lines.'], ['Put a filled main button on every row.', 'Colour a whole row to show status.']),
          code('rl-code', 'Record lists', ['.item__media--round', '.list-head', '.list-panel', '.toolbar', '.rec-list', '.rec', '.rec--head', '.rec__icon', '.rec__main', '.rec__person', '.rec__figs', '.rec__status', '.rec__text', '.prio-tag', '.prio-tag--high', '.prio-tag--info', '.prio-tag--plain', '.pagination'],
               req_row(*REQ_ROWS[0])))

# 2. Popovers and pickers (Components)
pp_demo = ('<div class="cell demo-cell--pop">' + pick('doc-site', 'All sites', 'pin', SITES) + ' ' + pick('doc-period', 'All time', 'calendar', PERIODS, site=False) + '</div>'
           + '<div class="cell demo-cell--pop-lg">' + module_switch('Pharmacy') + '</div>'
           + '<div class="cell">' + f'<div class="btn-split btn-split--narrow"><button class="btn btn--secondary-solid" type="button">{I("plus")}Add to pharmacy</button><span class="pop-anchor"><button class="btn btn--secondary-solid" type="button" aria-label="More ways to add" aria-haspopup="menu" aria-expanded="false" data-popover="doc-add">{I("chevron-down")}</button><div class="popover popover--end" id="doc-add" hidden>' + ''.join(f'<a class="menu__item" href="#">{I(ic)}{t}</a>' for ic, t in [('package', 'Receive medicines'), ('swap', 'Dispense to a keeper'), ('send', 'Request from Central')]) + '</div></span></div></div>')
# Tag chips (DD-009): public pill, private tag shape, priority on the priority picker's scale
TAG_MARK = {'normal': '!', 'high': '!!', 'critical': '!!!'}
TAG_WORD = {'normal': 'Normal', 'high': 'High', 'critical': 'Critical'}
def tag_chip(name, prio=None, private=False, by=None, remove=False, button=True, new=False, attrs=''):
    """A tag chip. by=('KR', 'Kavya Rao') for a private tag someone else added. A removable chip is a span
    (a button can't hold the remove button); otherwise clickable chips are buttons and static ones spans."""
    cls = 'tag-chip' + (' tag-chip--private' if private else '') + (f' tag-chip--{prio}' if prio else '')
    said = ', '.join(x for x in ['private tag' if private else '', f'{TAG_WORD[prio].lower()} priority' if prio else '', f'added by {by[1]}' if by else ''] if x)
    inner = ((f'<span class="tag-chip__by" aria-hidden="true" title="Added by {esc(by[1])}">{esc(by[0])}</span>' if by else '')
             + (f'<span class="tag-chip__lock" aria-hidden="true">{I("lock")}</span>' if private else '')
             + (f'<span class="tag-chip__mark" aria-hidden="true">{TAG_MARK[prio]}</span>' if prio else '')
             + f'<span class="tag-chip__label">{esc(name)}</span>' + (f'<span class="sr-only">, {said}</span>' if said else '')
             + (f'<button class="tag-chip__remove" type="button" aria-label="Remove {esc(name)}">{I("x")}</button>' if remove else ''))
    tag = 'button' if button and not remove else 'span'
    chip = f'<{tag} class="{cls}"' + (' type="button"' if tag == 'button' else '') + f'{attrs}>{inner}</{tag}>'
    return chip + (' <span class="tag tag--soft">New</span>' if new else '')
def animal_card(aaid, name, species, encl, sex, age, kg, img, alt, cites='C I', cites_long='CITES I', section='Big cats', site='North campus', alert='Weight updated 3 months ago'):
    """The system Animal card (compact; the photo button expands it), as on the Animal card page."""
    cls, word = {'M': ('', 'Male'), 'F': (' sex-tag--f', 'Female'), 'UD': (' sex-tag--ud', 'Undetermined'), 'ID': (' sex-tag--id', 'Indeterminate')}[sex]
    pills = lambda extra='': (f'<span class="ac-pill{" ac-pill--age" if extra else ""}">{I("calendar")}<span class="sr-only">Age </span>{esc(age)}</span>'
                              f'<span class="ac-pill{" ac-pill--weight" if extra else ""}">{I("scale")}<span class="sr-only">Weight </span>{esc(kg)}</span>')
    counts = ''.join(f'<span class="ac-count" title="{t}">{I(ic)}{n}<span class="sr-only"> {t.lower()}</span></span>' for ic, n, t in [('treatment', 3, 'Treatments'), ('test-tube', 3, 'Lab tests'), ('syringe', 3, 'Vaccinations'), ('medicine', 3, 'Medicines')])
    return (f'<article class="animal-card" data-state="compact"><div class="animal-card__media"><img src="{IMG}{img}" alt="{esc(alt)}">'
            f'<div class="animal-card__top"><span class="sex-tag{cls}" title="{word}">{sex}<span class="sr-only"> ({word})</span></span><span class="animal-card__badge" title="CITES appendix"><span class="ac-x">{cites_long}</span><span class="ac-c">{cites}</span></span></div>'
            f'<div class="animal-card__overlay ac-x"><b class="animal-card__id">AAID: {esc(aaid)}</b><span class="animal-card__pills">{pills(1)}</span></div>'
            f'<button class="animal-card__toggle" type="button" data-animal-toggle aria-expanded="false" aria-label="Show more about {esc(name)}">{I("maximize")}</button></div>'
            f'<div class="animal-card__body"><b class="animal-card__id ac-c">AAID: {esc(aaid)}</b><p class="animal-card__alert ac-x">{I("alert")}{esc(alert)}</p>'
            f'<dl class="animal-card__facts"><dt>Name</dt><dd>{esc(name)}</dd><dt>Species</dt><dd>{esc(species)}</dd><dt>Enclosure</dt><dd>{esc(encl)}</dd><dt class="ac-x">Section</dt><dd class="ac-x">{esc(section)}</dd><dt class="ac-x">Site</dt><dd class="ac-x">{esc(site)}</dd></dl>'
            f'<div class="animal-card__pills ac-c">{pills()}</div></div>'
            f'<footer class="animal-card__foot ac-x">{counts}<a class="animal-card__more" href="#">View details<span class="sr-only"> for {esc(name)}</span>{I("chevron-right")}</a></footer></article>')
TAG_ANIMALS = [('000482', 'Sheru', 'Bengal tiger', 'Tiger enclosure 2', 'M', '4y 2m', '210 kg', 'banners/tiger.webp', 'Sheru, a Bengal tiger', 'C I', 'CITES I'),
               ('87546/24', 'Ramu', 'Leopard', 'Leopard Hill · L2', 'M', '4y 6m', '92 kg', 'leopard.webp', 'Ramu, a leopard, resting on a log', 'C I', 'CITES I'),
               ('000311', 'Rani', 'Asiatic lion', 'Lion safari A', 'F', '6y 1m', '128 kg', 'species/asiatic-lion.webp', 'Rani, an Asiatic lion', 'C I', 'CITES I')]
def tag_row(label, chips): return f'<div class="cell demo-cell--row"><span class="t-small t-secondary" style="min-width:var(--space-16)">{esc(label)}</span>{chips}</div>'
TC_MATRIX = ''.join(tag_row(w, tag_chip('Quarantine', p) + tag_chip('Check weight', p, private=True))
                    for w, p in [('No priority', None), ('Normal', 'normal'), ('High', 'high'), ('Critical', 'critical')])
TC_PARTS = (tag_row('By others', tag_chip('Night shift watch', 'critical', private=True, by=('KR', 'Kavya Rao')) + tag_chip('Weigh on Monday', private=True, by=('RK', 'Ravi Kumar')))
            + tag_row('Removable', tag_chip('Vaccination due', 'normal', remove=True) + tag_chip('Limping left', private=True, remove=True))
            + tag_row('New', tag_chip('Limping left', private=True, remove=True, new=True))
            + tag_row('Static', tag_chip('Quarantine', 'critical', button=False) + tag_chip('Ask vet about limp', 'normal', private=True, button=False)))
TC_LONG = (f'<div class="card" style="max-width:320px"><p class="t-overline">Selected tag</p><div class="chips">'
           + tag_chip('Deep clean pending before the inspection on Friday', 'high', private=True, remove=True)
           + tag_chip('Enrichment trial for the new enclosure layout', 'normal') + '</div></div>')
write_doc('tag-chips', {'title': 'Tag chips', 'group': 'Components', 'intro': 'Labels on animals, species and places. The shape says who can see the tag: a pill is public, a tag shape is private. The colour and its marks say the priority, on the same scale as the priority picker.', 'icon': 'tag', 'hue': 'teal'},
          doc('tc-matrix', 'Public and private, by priority', 'A <b>pill</b> is a public tag; the <b>tag shape</b>, with its point, is a private one. Priority uses the priority picker\'s scale: <b>Normal</b> <code>!</code> on info, <b>High</b> <code>!!</code> on caution (amber) and <b>Critical</b> <code>!!!</code> on danger. A tag with no priority yet is neutral grey. The marks are always shown, so priority never depends on colour alone.', TC_MATRIX, canvas=False)
          + doc('tc-parts', 'Parts and states', 'A private tag someone else added starts with their <b>initials</b> (their name is in the tooltip and is read out). A <b>removable</b> chip ends with a remove button; a tag being created gets the small <b>New</b> tag beside it. Clickable chips are buttons that open the tag; in history and previews they are <b>static</b>.', TC_PARTS, canvas=False)
          + doc('tc-long', 'Long names', 'A chip never grows wider than its container: a long name ends with an ellipsis, and the full name is still read out.', TC_LONG, canvas=False),
          usage('tc-usage', 'Tag chips', ['Use the pill for public tags and the tag shape for private ones.', 'Use the priority scale: no priority, Normal, High, Critical.', 'Keep the mark on every chip that has a priority.', 'Show who added a private tag that is not yours.'],
                ['Pick a colour per category or per tag.', 'Use teal, or any hue, to mean "no priority".', 'Show priority by colour alone.', 'Put a filled main button inside a chip list.']),
          code('tc-code', 'Tag chip', ['.tag-chip', '.tag-chip--private', '.tag-chip--normal', '.tag-chip--high', '.tag-chip--critical', '.tag-chip__mark', '.tag-chip__label', '.tag-chip__by', '.tag-chip__remove', '.tag-chip__lock'],
               tag_chip('Check weight Friday', 'high', private=True).replace('><', '>\n  <').replace('\n  </button>', '\n</button>')))

write_doc('popovers-and-pickers', {'title': 'Popovers and pickers', 'group': 'Components', 'intro': 'Dropdown panels opened from a trigger: the site and period pickers, the module switcher and the split button\'s menu. Escape and an outside click close them.', 'icon': 'chevron-down', 'hue': 'teal'},
          doc('pp-demo', 'Pickers, switcher and split button', 'Select a trigger to open its panel. <b>Pickers</b> mark the chosen option and update the label. The <b>module switcher</b> shows every module in a compact grid. The <b>split button</b> pairs one action with a menu of related ones.', pp_demo, canvas=False)
          + doc('pp-sort', 'Sort menu', 'A <b>picker</b> on the sort button of a list toolbar: Newest first, Oldest first, Species A–Z and AAID. Each order has its icon from ANTZ Rounded (<code>i-sort-newest</code>, <code>i-sort-oldest</code>, <code>i-sort-az</code>); choosing one updates the trigger\'s label and icon (<code>data-icon</code> on the option, <code>data-pick-icon</code> on the trigger icon).',
                '<div class="cell demo-cell--pop">' + sort_pick('doc-sort') + '</div>', canvas=False),
          usage('pp-usage', 'Popovers and pickers', ['Use the site picker in the module bar and the board bar.', 'Keep the chosen option visible in the trigger.'], ['Put forms in a popover: use the work drawer.', 'Open a popover on hover.']),
          code('pp-code', 'Popovers and pickers', ['.pop-anchor', '.popover', '.popover--end', '.popover--lg', '.popover--switch', '.picker__list', '.picker__opt', '.pick', '.pick--site', '.module-switch', '.btn-split', '[data-popover]', '[data-pick-label]'],
               pick('site', 'All sites', 'pin', SITES[:2])))

# 3. Lists and charts (Stat cards)
lc_demo = ('<div class="board board--2">'
           + list_card('Needs your attention', attn('alert', 'danger', 'Gaur · collapsed', 'Critical', 'danger', 'Incoming emergency · TR-00241', 'Admit') + attn('test-tube', 'warning', 'Bengal tiger · creatinine 4.2', 'High', 'high', 'Kidney panel · LAB-122263', 'Review'))
           + list_card('Most dispensed medicines', ''.join(rank(n, s, v, c) for n, s, v, c in [('Calcium sandoz', 'Calcium gluconate 10%', 1, '17'), ('Ringer lactate', 'Compound sodium lactate', .94, '16'), ('Enrofloxacin', 'Enrofloxacin 50 mg/ml', .76, '13')]))
           + list_card('Ending soon on the home screen', ''.join(f'<a class="item" href="#"><span class="item__body"><b>{t}</b><span>Until {u}</span></span><span class="item__end"><b class="{"is-soon" if d == "1d" else ""}">{d}</b>left</span>{I("chevron-right")}</a>' for t, u, d in [('Heavy rain alert', '12 Nov 2026', '1d'), ('Fire drill on Thursday', '13 Nov 2026', '2d')]))
           + list_card('Latest', ''.join(item(f'<span class="rec__icon">{I("megaphone")}</span>', t, m, None, f'<span class="meta-count">{I("heart")}{n}</span>') for t, m, n in [('New vet duty roster', 'Prajwal Shetty · 2 d ago', '9'), ('Fire drill on Thursday', 'Prajwal Shetty · 6 d ago', '12')]))
           + '</div>'
           + f'<section class="list-card"><div class="list-card__head"><b>Received medicines</b>{seg(["Value", "Receipts"], label="Measure", xs=True)}</div><div class="chart-card"><div class="figure-block"><b>₹62,500</b><small>worth of medicines received in 12 months</small><span class="tag tag--soft">Busiest month · Oct 2026</span></div>{colchart(PH_VALUES, PH_MONTHS, ["₹50k", "₹25k", "₹0"], {10: "₹38,000", 11: "₹14,600"})}</div></section>'
           + list_card('Collections', thumbs([('macaw-blue.webp', 'Sarus crane'), ('tiger-coat.webp', 'Star tortoise'), ('plumage.webp', 'Hill myna')], 9), link='New species'))
write_doc('lists-and-charts', {'title': 'Lists and charts', 'group': 'Stat cards', 'intro': 'Cards that list and chart: attention rows with actions, ranks with a subtitle, count-downs, reactions, a column chart with an axis and a figure, and photo thumbnails.', 'icon': 'bar-chart', 'hue': 'amber'},
          doc('lc-demo', 'Lists and charts', 'Each list sits in a <code>.list-card</code> with a head and a View all link. The <b>column chart</b> has a value axis, month labels and value labels on the bars that matter; it is a single colour, because it shows one measure.', lc_demo),
          usage('lc-usage', 'Lists and charts', ['Give attention rows one clear action each (Admit, Review, Book).', 'Label only the bars people need to read.'], ['Use a colour per bar in a single-measure chart.', 'Show more than six rows before View all.']),
          code('lc-code', 'Lists and charts', ['.list-card', '.attn', '.rank', '.rank__label', '.meter', '.item__end .is-soon', '.meta-count', '.colchart', '.colchart__axis', '.colchart__plot', '.colchart__labels', '.figure-block', '.chart-card', '.thumbs', '.thumbs__more'],
               colchart([3, 8, 5], ['Sep', 'Oct', 'Nov'], ['10', '5', '0'], {1: '8'})))

# 4. Role homes and heroes (Pattern components)
rh_demo = (frame('<div class="board">' + '<section class="hero-panel board__full">' + pharmacy_home_main.split('<section class="hero-panel">', 1)[1].split('</section>', 1)[0] + '</section></div>')
           + frame('<div class="board">' + med_split + '</div>')
           + frame(quick_dock()))
write_doc('role-homes', {'title': 'Role homes', 'group': 'Pattern components', 'intro': 'The home adapts to what each person can use: a panel hero for one module, a board for several, the Hospital split card, and the quick dock.', 'icon': 'home', 'hue': 'teal'},
          doc('rh-demo', 'Panel hero, split card and quick dock', 'The <b>panel hero</b> heads a one-module home: a title, a period switch and figures with icon tiles (a danger tile for what needs action). The <b>split card</b> puts a photo widget, a short list and status tiles side by side. The <b>quick dock</b> floats Quick actions and chat at the foot of the board.', rh_demo),
          usage('rh-usage', 'Role homes', ['Give a one-module person a home for that module, not an empty board.', 'Use the danger icon tile only for figures that need action.'], ['Show the quick dock and a FAB on the same screen.', 'Put more than three figures in a panel hero.']),
          code('rh-code', 'Role homes', ['.hero-panel', '.hero-panel__art', '.glass-icon--danger', '.split-card', '.split-card__tiles', '.widget--photo', '.widget__img', '.widget__chips', '.quick-dock', '.has-count', '.btn-split'],
               '<section class="hero-panel"><div><h2>Your pharmacy today</h2><p>…</p></div><div class="segmented" role="group">…</div><div class="hero-photo__stats">…</div></section>'))

# 5. Quick add (Pattern components)
qa_demo = '<div class="cell">' + quick_add_tiles('doc-quick-add') + '</div>' + quick_add_dialog('doc-quick-add')
write_doc('quick-add', {'title': 'Quick add', 'group': 'Pattern components', 'intro': 'One dialog for a note, a request or an announcement, opened from the quick add tiles. Tabs switch the form; the footer counts the required fields left.', 'icon': 'plus', 'hue': 'coral'},
          doc('qa-demo', 'Quick add dialog', 'Select Note, Request or Announcement to open the dialog. It uses the system\'s fields: choice chips, a text area, a date and selects in a row, the <b>priority picker</b>, a <b>toggle row</b>, a <b>person field</b> and the drop zone. Add stays disabled until the required fields are done, and the footer says how many are left.', qa_demo, canvas=False),
          usage('qa-usage', 'Quick add', ['Keep quick add short: anything longer belongs in the work drawer.', 'Say how many required fields are left.'], ['Invent a new priority scale: use the priority picker.', 'Hide the Cancel button.']),
          code('qa-code', 'Quick add', ['.dialog__tabs', '.field-row', '.toggle-row', '.person-field', '.dialog__foot-note', '.req', '.priority', '.dropzone', '[role="tabpanel"]'],
               '<div class="segmented segmented--pill segmented--block dialog__tabs" role="tablist">…</div>\n<div class="dialog__body" role="tabpanel">…</div>'))

# Nav: component pages
def add_link(group_title, href, title, after=None):
    g = [x for x in nav['groups'] if x['title'] == group_title][0]
    hs = [l['href'] for l in g['links']]
    if href in hs: return
    pos = hs.index(after) + 1 if after in hs else len(hs)
    g['links'].insert(pos, collections.OrderedDict([('href', href), ('title', title), ('isNew', True)]))
add_link('Components', 'popovers-and-pickers.html', 'Popovers and pickers', 'menus-and-dialogs.html')
add_link('Components', 'record-lists.html', 'Record lists', 'table.html')
add_link('Stat cards', 'lists-and-charts.html', 'Lists and charts', 'dashboard-widgets.html')
add_link('Pattern components', 'role-homes.html', 'Role homes', 'launcher.html')
add_link('Pattern components', 'quick-add.html', 'Quick add', 'role-homes.html')
open(nav_p, 'w').write(json.dumps(nav, indent=2, ensure_ascii=False) + '\n')
print('nav ok')

# ═══ Module homes, part 2 (DD-006): every module in full access ═══════════
def band_hero(tone, overline, figure, caption, slot='', cls='board__wide'):
    return (f'<section class="band-hero band-hero--{tone} {cls}"><div class="band-hero__head"><span class="overline-live">{esc(overline)}</span>'
            f'<a class="widget__go" href="#" aria-label="Open">{I("arrow-up-right")}</a></div>'
            f'<div class="band-hero__foot"><div><b class="band-hero__figure">{figure}</b><span class="band-hero__caption">{esc(caption)}</span></div>{slot}</div></section>')

def banner_hero(img, overline, title, sub, chips, cls='board__full'):
    return (f'<section class="hero-photo hero-photo--banner {cls}"><img class="hero-photo__img" src="{B}{img}" alt=""><div><span class="tag tag--glass">{esc(overline)}</span>'
            f'<h2 class="hero-photo__title">{esc(title)}</h2><p class="hero-photo__sub">{esc(sub)}</p></div>'
            '<div class="widget__chips">' + ''.join(f'<div class="glass-chip"><b>{v}</b><small>{esc(t)}</small></div>' for v, t in chips) + '</div></section>')

def glass_btn(text, toast=None, bright=False, icon='arrow-right'):
    t = f' data-toast="{esc(toast)}"' if toast else ''
    return f'<button class="glass-btn{" glass-btn--bright" if bright else ""}" type="button"{t}>{esc(text)}{I(icon)}</button>'

def wait_item(left, title, l1, l2, n, unit='waiting'):
    return item(left, title, l1, l2, f'<b class="is-soon">{esc(n)}</b>{esc(unit)}')

def rank_rows(rows, hue, photo=False):
    out = ''
    for r in rows:
        name, v, c = r[:3]
        lead = media(r[3]) if photo and len(r) > 3 else ''
        out += f'<div class="rank{"" if photo else " rank--plain"}">{lead}<b>{esc(name)}</b><span class="meter" style="--v:{v};--bar:var(--hue-{hue})"><i></i></span><span>{esc(c)}</span></div>'
    return out

def acts(rows):
    return activity(rows) if False else '<ul class="activity">' + ''.join(f'<li>{tile(ic, h)}<div><b>{esc(t)}</b><small>{esc(m)}</small></div></li>' for ic, h, t, m in rows) + '</ul>'

def delta(v, down=False):
    return f'<span class="delta{" delta--down" if down else ""}">{I("chevron-down" if down else "chevron-up")}{esc(v)}</span>'

def sheet(sid, meta, title, body, action, enabled=False):
    return (f'<div class="drawer-backdrop" data-drawer-backdrop="{sid}" hidden></div><aside class="drawer drawer--floating" id="{sid}" role="dialog" aria-modal="true" aria-labelledby="{sid}-title" hidden>'
            f'<header class="drawer__head"><div><span class="drawer__meta">{esc(meta)}</span><h2 class="drawer__title" id="{sid}-title">{esc(title)}</h2></div><button class="icon-btn" type="button" aria-label="Close" data-drawer-close>{I("x")}</button></header>'
            f'<div class="drawer__body">{body}</div><div class="drawer__foot"><button class="btn btn--primary btn--block" type="button"{"" if enabled else " disabled"}>{esc(action)}</button></div></aside>')

def fld(label, ctrl): return labelled(esc(label), ctrl) if re.search(r'<(input|select|textarea)\b', ctrl) else f'<div class="field"><span class="field__label">{esc(label)}</span>{ctrl}</div>'
def chipgroup(label, opts, sel=0):
    return (f'<fieldset class="filter-panel" role="radiogroup"><legend class="field__label">{esc(label)}</legend><div class="chips">'
            + ''.join(f'<button class="chip" type="button" role="radio" aria-checked="{str(i == sel).lower()}">{esc(o)}</button>' for i, o in enumerate(opts)) + '</div></fieldset>')

SHEET_FETAL = sheet('sheet-fetal', 'New record', 'Report fetal death',
    fld('Where was the fetus found?', f'<div class="pick-scan"><button class="pick pick--site" type="button">{I("home")}Select enclosure</button><button class="icon-btn icon-btn--solid" type="button" aria-label="Scan the enclosure QR code">{I("scan")}</button></div>'),
    'Add')
# ── Tags patterns (DD-009) ────────────────────────────────────────────────
def drawer(sid, meta, title, body, foot, inline=False, head_btns=''):
    """A floating side sheet. inline=True draws it in place (docs), otherwise it is hidden until opened."""
    head = (f'<header class="drawer__head"><div><span class="drawer__meta">{esc(meta)}</span><h2 class="drawer__title" id="{sid}-title">{esc(title)}</h2></div>'
            f'<span class="drawer__actions">{head_btns}<button class="icon-btn" type="button" aria-label="Close" data-drawer-close>{I("x")}</button></span></header>')
    inner = f'{head}<div class="drawer__body">{body}</div>{foot}'
    if inline: return f'<aside class="drawer drawer--floating drawer--inline" id="{sid}" role="dialog" aria-modal="false" aria-labelledby="{sid}-title">{inner}</aside>'
    return f'<div class="drawer-backdrop" data-drawer-backdrop="{sid}" hidden></div><aside class="drawer drawer--floating" id="{sid}" role="dialog" aria-modal="true" aria-labelledby="{sid}-title" hidden>{inner}</aside>'
def foot_split(a, b, b_disabled=False, b_cls='btn--primary', a_icon=None, b_icon=None):
    return (f'<div class="drawer__foot drawer__foot--split"><button class="btn btn--outline" type="button">{I(a_icon) if a_icon else ""}{esc(a)}</button>'
            f'<button class="btn {b_cls}" type="button"{" disabled" if b_disabled else ""}>{I(b_icon) if b_icon else ""}{esc(b)}</button></div>')
def foot_one(a, disabled=False): return f'<div class="drawer__foot"><button class="btn btn--primary btn--block" type="button"{" disabled" if disabled else ""}>{esc(a)}</button></div>'
def ibtn(icon, label, attrs=''): return f'<button class="icon-btn" type="button" aria-label="{esc(label)}"{attrs}>{I(icon)}</button>'
def toggle_row(icon, hue, title, sub, on=False):
    return (f'<label class="toggle-row">{tile(icon, hue)}<div><b>{esc(title)}</b><small>{esc(sub)}</small></div>'
            f'<span class="switch"><input type="checkbox"{" checked" if on else ""}><span></span></span></label>')
def checkgroup(label, opts, on=()):
    return (f'<fieldset class="filter-panel" role="group"><legend class="field__label">{esc(label)}</legend><div class="chips">'
            + ''.join(f'<button class="chip" type="button" role="checkbox" aria-checked="{str(o in on).lower()}">{esc(o)}</button>' for o in opts) + '</div></fieldset>')
def priority_picker(name, sel=0):
    return ('<fieldset class="field"><legend class="field__label">Priority</legend><div class="priority">'
            + ''.join(f'<label class="priority__opt{c}"><input type="radio" name="{name}"{" checked" if i == sel else ""}><span class="priority__mark" aria-hidden="true">{m}</span>{w}</label>'
                      for i, (c, m, w) in enumerate([('', '!', 'Normal'), (' priority__opt--high', '!!', 'High'), (' priority__opt--critical', '!!!', 'Critical')])) + '</div></fieldset>')
def fact(icon, hue, label, value, chevron=False): return item(tile(icon, hue), value, label, chevron=chevron)
def tag_strip(chips, more, total):
    return (f'<div class="tag-strip">{I("tag")}{"".join(chips)}<button class="tag-strip__more" type="button">+{more}<span class="sr-only"> more: show all {total} tags</span></button></div>')
TAG_CATS = [('Health', [('Quarantine', 'critical'), ('Under observation', 'high'), ('Post-surgery', 'critical'), ('Vaccination due', 'normal')]),
            ('Behaviour', [('Aggressive', 'critical'), ('Shy feeder', 'normal'), ('Breeding pair', None)]),
            ('Husbandry', [('Deep clean pending', 'high'), ('Under maintenance', 'normal'), ('Enrichment trial', None)]),
            ('Diet', [('Special diet', 'high'), ('Hand feeding', 'normal')]), ('General', [('VIP visit', None), ('Photo ready', None)])]
def sheet_add_tag(private=False, step=2, sid='sheet-add-tag', inline=False):
    kind = 'private' if private else 'public'
    if step == 1:
        body = (search('Search tags') + item(tile('plus', 'green'), 'Limping left', f'Create it as a {kind} tag and add it')
                + f'<p class="field__label">Choose a tag</p><div class="chips">' + ''.join(tag_chip(n, pr, private=private) for n, pr in ([('Check weight Friday', 'high'), ('Ask vet about limp', 'normal')] if private else [('Vaccination due', 'normal'), ('Special diet', 'high'), ('Hand feeding', 'normal'), ('Photo ready', None), ('Enrichment trial', None)])) + '</div>')
        return drawer(sid, 'Sheru · Bengal tiger', f'Add {kind} tag', body, foot_split('Cancel', 'Add tag', b_disabled=True), inline)
    pick = tag_chip('Limping left', private=True, remove=True, new=True) if private else tag_chip('Vaccination due', 'normal', remove=True)
    body = (f'<div class="field"><span class="field__label">Selected tag</span><div class="chips">{pick}</div></div>'
            + priority_picker(sid + '-pr', 0 if not private else 1)
            + toggle_row('calendar', 'sky', 'Schedule and duration', 'A deadline or a time period for this tag', on=True)
            + chipgroup('When', ['Set a deadline', 'A time period'])
            + fld('Deadline', '<input class="input" type="date" value="2026-12-15">')
            + (toggle_row('users', 'navy', 'Visible to all', 'Off means only you can see it on this animal') if private else ''))
    return drawer(sid, 'Sheru · Bengal tiger', f'Add {kind} tag', body, foot_split('Cancel', 'Add tag'), inline)
def sheet_tag_info(view='info', sid='sheet-tag-info', inline=False, on_record=True):
    seg_ = ('<div class="segmented segmented--stat segmented--block" role="tablist" aria-label="Tag">'
            f'<button type="button" role="tab" aria-selected="{str(view == "info").lower()}"><b>{I("help")}</b><span>Info</span></button>'
            f'<button type="button" role="tab" aria-selected="{str(view == "ents").lower()}"><b>2</b><span>Entities</span></button></div>')
    hero = f'<div class="sheet-hero"><small>Health · public tag</small><div class="chips">{tag_chip("Quarantine", "critical", button=False)}</div>{seg_}</div>'
    if view == 'info':
        body = (hero + '<div class="list">' + fact('grid', 'teal', 'Tag category', 'Health', False) + fact('calendar', 'coral', 'Deadline', '30 Nov 2026')
                + fact('users', 'sky', 'Tag type', 'Public') + fact('user', 'green', 'Added by', 'Dr. Meera Nair') + fact('clock', 'amber', 'Added on', '12 Nov 2026')
                + fact('paw', 'green', 'Added to', 'Sheru (Bengal tiger)') + item(tile('bell', 'navy'), 'Roles notified', 'Veterinarian, Curator') + '</div>'
                + '<div class="card card--sunken"><p class="t-overline">Description</p><p class="t-small">Animal is isolated. Follow the quarantine protocol before entry.</p></div>')
    else:
        body = (hero + search('Search animals and places')
                + '<div class="animal-cards">' + animal_card(*TAG_ANIMALS[0]) + '</div><div class="list">'
                + item(tile('home', 'green'), 'Tiger enclosure 2', 'Big cats section · North campus') + '</div>')
    btns = (ibtn('pencil', 'Edit tag') + ibtn('minus', 'Remove from Sheru')) if on_record else (ibtn('pencil', 'Edit tag') + ibtn('trash', 'Delete tag'))
    return drawer(sid, 'Tag', 'Quarantine', body, '', inline, head_btns=btns)
TAG_HISTORY = [('18 Nov 2026', [('plus', 'green', ('Check weight Friday', 'high', True), 'Private tag added by Anil Rathod · 9:14 AM')]),
               ('16 Nov 2026', [('plus', 'green', ('Ask vet about limp', 'normal', True), 'Private tag added by Anil Rathod · 5:02 PM')]),
               ('15 Nov 2026', [('pencil', 'sky', ('Quarantine', 'critical', False), 'Public tag updated by Dr. Meera Nair · 4:40 PM')]),
               ('12 Nov 2026', [('plus', 'green', ('Quarantine', 'high', False), 'Public tag added by Dr. Meera Nair · 10:42 AM')]),
               ('08 Nov 2026', [('minus', 'coral', ('Post-surgery', 'critical', False), 'Public tag removed by Anil Rathod · 11:20 AM')])]
def sheet_tag_history(sid='sheet-tag-history', inline=False):
    body = animal_card(*TAG_ANIMALS[0]) + search('Search tags')
    for day, rows in TAG_HISTORY:
        body += f'<div class="section-head"><b>{day}</b></div><ul class="activity">' + ''.join(
            f'<li>{tile(ic, h)}<div>{tag_chip(n, pr, private=pv, button=False)}<small>{esc(m)}</small></div></li>' for ic, h, (n, pr, pv), m in rows) + '</ul>'
    return drawer(sid, 'Sheru · Bengal tiger', 'Tag history', body, '', inline)
def roles_field(roles):
    rows = ''.join(f'<div class="item">{tile("user", "navy")}<span class="item__body"><b>{esc(r)}</b></span><button class="icon-btn icon-btn--sm" type="button" aria-label="Remove {esc(r)}">{I("x")}</button></div>' for r in roles)
    return (f'<div class="field"><span class="field__label">Roles to notify (optional)</span><p class="t-small t-secondary">These roles are told when this tag is added.</p>'
            f'<button class="row row--outline" type="button"><span class="row__body"><span class="row__title">Choose roles</span><span class="row__meta">{len(roles)} chosen</span></span>{I("chevron-right")}</button>'
            f'<div class="list">{rows}</div></div>')
def sheet_new_tag(sid='sheet-tag', inline=False):
    body = (fld('Tag name', '<input class="input" maxlength="50" placeholder="For example, Hand reared" value="Hand reared">')
            + checkgroup('Used on', ['Animals', 'Species', 'Sites', 'Sections', 'Enclosures'], on=('Animals',))
            + labelled('Category' + REQ, '<div class="select-wrap"><select class="select"><option>Health</option><option>Behaviour</option><option>Husbandry</option><option>Diet</option><option>General</option></select></div>')
            + '<a class="btn btn--link" href="#">' + I('plus') + 'New category</a>'
            + fld('Description (optional)', '<textarea class="textarea" rows="3" placeholder="What should people know when they see this tag?"></textarea>')
            + roles_field(['Keeper', 'Veterinarian'])
            + fld('Preview', f'<div class="tag-preview">{tag_chip("Hand reared", button=False)}</div>'))
    return drawer(sid, 'Public tags', 'New tag', body, foot_one('Create tag'), inline)
def sheet_category(sid='sheet-category', inline=False):
    body = (figures([('4', 'Linked tags'), ('5', 'Linked entities')]) + '<div class="list">' + fact('user', 'green', 'Created by', 'Dr. Meera Nair') + fact('clock', 'amber', 'Added on', '21 May 2026') + '</div>'
            + '<div class="section-head"><b>Tags in this category</b><span class="t-small t-secondary">4</span></div><div class="chips">' + ''.join(tag_chip(n, pr, button=False) for n, pr in TAG_CATS[0][1]) + '</div>')
    return drawer(sid, 'Category', 'Health', body, foot_split('Edit', 'Delete', b_cls='btn--danger', a_icon='pencil', b_icon='trash'), inline)
def sheet_tag_filter(sid='sheet-tag-filter', inline=False):
    people = ''.join(f'<label class="row row--outline">{avatar(i, h).replace("avatar avatar--sm", "avatar")}<span class="row__body"><span class="row__title">{esc(n)}</span><span class="row__meta">{esc(r)}</span></span><span class="check"><input type="checkbox"{" checked" if c else ""} aria-label="Select {esc(n)}"></span></label>'
                     for i, h, n, r, c in [('AR', 'green', 'Anil Rathod (you)', 'Admin', False), ('MN', 'teal', 'Dr. Meera Nair', 'Veterinarian', True), ('RK', 'amber', 'Ravi Kumar', 'Keeper', False)])
    body = (checkgroup('Tag category', [c for c, _ in TAG_CATS], on=('Health',))
            + f'<fieldset class="filter-panel"><legend class="field__label">Created by</legend>{search("Search people")}<div class="card-grid" style="gap:var(--space-2)">{people}</div></fieldset>'
            + chipgroup('My tags', ['Any', 'Yes', 'No']))
    return drawer(sid, 'Tags hub', 'Filter', body, foot_split('Clear all', 'Apply filter'), inline)
def confirm_dialog(title, desc, action, did):
    return (f'<div class="dialog" role="dialog" aria-labelledby="{did}t" aria-describedby="{did}d"><div class="dialog__head"><div><h3 class="dialog__title" id="{did}t">{esc(title)}</h3><p class="dialog__desc" id="{did}d">{esc(desc)}</p></div>'
            f'<button class="icon-btn icon-btn--sm" type="button" aria-label="Close">{I("x")}</button></div><div class="dialog__foot"><button class="btn btn--ghost" type="button">Cancel</button><button class="btn btn--danger" type="button">{esc(action)}</button></div></div>')
RANGE_DIALOG = ('<div class="dialog" role="dialog" aria-labelledby="dlg-range-t"><div class="dialog__head"><div><h3 class="dialog__title" id="dlg-range-t">Custom range</h3><p class="dialog__desc">Tags added between two dates</p></div>'
                f'<button class="icon-btn icon-btn--sm" type="button" aria-label="Close">{I("x")}</button></div><div class="dialog__body"><div class="field-row">'
                + fld('Start', '<input class="input" type="date" value="2026-11-01">') + fld('End', '<input class="input" type="date">')
                + '</div></div><div class="dialog__foot"><button class="btn btn--ghost" type="button">Cancel</button><button class="btn btn--primary" type="button" disabled>Apply</button></div></div>')
def ss(sheets): return '<div class="ss-demo">' + ''.join(f'<div class="ss-frame">{x}</div>' for x in sheets) + '</div>'
SHEET_TAG = sheet_new_tag()
SHEET_CATEGORY = sheet_category()
STRIP_DEMO = (f'<section class="hero-photo"><img class="hero-photo__img" src="{B}tiger.webp" alt=""><div><h2 class="hero-photo__title">Sheru</h2><p class="hero-photo__sub">Bengal tiger · Panthera tigris tigris</p></div>'
              + tag_strip([tag_chip('Check weight Friday', 'high', private=True), tag_chip('Ask vet about limp', 'normal', private=True), tag_chip('Night shift watch', 'critical', private=True, by=('KR', 'Kavya Rao')), tag_chip('Quarantine', 'critical')], 5, 9) + '</section>')
write_doc('tags', {'title': 'Tags', 'group': 'Pattern components', 'intro': 'How tags work on a record: the tag strip in its hero, adding a tag with a priority and a schedule, what a tag says about itself, its history, and the sheets for new tags, categories and filters.', 'icon': 'tag', 'hue': 'teal'},
          doc('tg-strip', 'Tag strip', 'The record hero shows the <b>latest four tags</b> and a <b>+N</b> button that opens the Tags tab. Chips keep their own backgrounds, so they read on any photo. On phones the strip wraps onto more lines and still shows four, then +N.', frame(STRIP_DEMO))
          + doc('tg-add', 'Add a tag', 'One side sheet: search, then pick a tag or create one. A new public tag opens <b>New tag</b>; a new private tag is added straight away with the <b>New</b> tag. Then set the <b>priority</b> (the priority picker), an optional <b>deadline or time period</b>, and, for private tags, whether everyone can see it. Add tag stays off until a tag is chosen.',
                ss([sheet_add_tag(False, 1, 'doc-add-1', True), sheet_add_tag(True, 2, 'doc-add-2', True)]))
          + doc('tg-info', 'Tag info', 'Select a chip to open it. The hero has the tag and a switch between <b>Info</b> and the <b>entities</b> that carry it. Info lists category, deadline, type, who added it and when, where, and the roles told about it, then the description. From a record, the head offers Edit and <b>Remove</b> (from this record); from the hub, Edit and <b>Delete</b>.',
                ss([sheet_tag_info('info', 'doc-info-1', True), sheet_tag_info('ents', 'doc-info-2', True, on_record=False)]))
          + doc('tg-history', 'Tag history', 'Every change to a record\'s tags, newest first and grouped by day: the chip as it was, what happened and who did it.', ss([sheet_tag_history('doc-history', True)]))
          + doc('tg-forms', 'New tag, category and filter', '<b>New tag</b>: name, where it can be used, category (or a new one), description, the roles to tell (the Choose people pattern) and a preview. <b>Category</b>: its figures, who made it and its tags, with Edit and Delete. <b>Filter</b>: category, who created it and whether it is yours, with Clear all and Apply filter.',
                ss([sheet_new_tag('doc-new', True), sheet_category('doc-cat', True), sheet_tag_filter('doc-filter', True)]))
          + doc('tg-dialogs', 'Confirm and custom range', 'Deleting or removing asks first, in the system dialog. A custom date range takes a start and an end; Apply waits for both.',
                '<div class="dialog-preview">' + confirm_dialog('Delete category?', 'Its 4 tags move to General.', 'Delete', 'dlg-cat') + '</div><div class="dialog-preview">' + confirm_dialog('Remove tag?', 'Quarantine comes off Sheru. The tag stays in the hub.', 'Remove', 'dlg-rm') + '</div><div class="dialog-preview">' + RANGE_DIALOG + '</div>', canvas=False),
          usage('tg-usage', 'Tags', ['Show at most four tags in a hero, then +N.', 'Add and edit tags in the side sheet.', 'Say who added a private tag that is not yours.', 'Hide New tag, Edit and Delete from people without tag permissions.'],
                ['Show a tag\'s priority by colour alone.', 'Put the full tag list in the hero.', 'Delete a tag without asking.', 'Open a second sheet on top of a sheet; New tag replaces Add tag.']),
          code('tg-code', 'Tags', ['.tag-strip', '.tag-strip__more', '.tag-chip', '.priority', '.toggle-row', '.sheet-hero', '.segmented--stat', '.activity', '.drawer--floating', '.drawer__foot--split', '.dialog'],
               '<div class="tag-strip">\n  <svg class="icon" aria-hidden="true"><use href="#i-tag"/></svg>\n  <button class="tag-chip tag-chip--private tag-chip--high" type="button">…</button>\n  <button class="tag-strip__more" type="button" aria-label="Show all 9 tags">+5</button>\n</div>'))
SHEET_FOLDER = sheet('sheet-folder', 'Focus hub', 'New folder',
    fld('Folder name', '<input class="input" placeholder="For example, Animals to watch">') + '<p class="t-small t-secondary">Add favourites and bookmarks to it from any saved item.</p>', 'Create folder', enabled=True)

def mod(current, site, nav, action, main, extra='', site_icon='pin', period=False, action_attr=''):
    page = module_page(current, site, nav, action, main, site_icon=site_icon, period=period)
    if action_attr:
        page = page.replace(f'<button class="btn btn--primary" type="button">{I("plus")}<span>{esc(action)}</span></button>', f'<button class="btn btn--primary" type="button" {action_attr}>{I("plus")}<span>{esc(action)}</span></button>', 1)
    return page.replace('</div></div></div></div>', extra + '</div></div></div></div>', 1) if extra else page

for name, sub, ic, hue in [('Necropsy', 'Reports', 'test-tube', 'navy-ink'), ('Fetal death', 'Records', 'alert', 'coral-ink'), ('Tags', 'Labels and IDs', 'tag', 'teal-ink'),
                           ('Administer', 'Vaccines, deworming', 'syringe', 'coral-ink'), ('Reports', 'Exports, insights', 'bar-chart', 'navy-ink'), ('Security', 'Gates, access', 'lock', 'navy-ink'),
                           ('Focus hub', 'Favourites, folders', 'zap', 'amber-ink'), ('Users', 'Staff, roles', 'users', 'navy-ink')]:
    if name not in BY:
        MODULES.append(('More', name, sub, ic, hue)); BY[name] = MODULES[-1]

# Collections
CLASSES = [('Gastropods', 'Gastropoda', '7,324', '9', 'violet', None), ('Birds', 'Aves', '6,526', '128', 'sky', ['plumage.webp', 'macaw-red.webp', 'macaw-blue.webp']),
           ('Mammals', 'Mammalia', '4,603', '84', 'coral', ['zebra.webp', 'giraffe.webp', 'fur.webp']), ('Reptiles', 'Reptilia', '3,980', '61', 'green', ['tiger-coat.webp', 'elephant.webp']),
           ('Fish', 'Actinopterygii', '3,104', '31', 'teal', None), ('Amphibians', 'Amphibia', '663', '12', 'green', None)]
def class_card(n, latin, animals, species, hue, imgs):
    stack = ''.join(f'<img src="{B}{i}" alt="">' for i in imgs) if imgs else '<span></span><span></span><span>' + I('paw') + '</span>'
    return (f'<a class="class-card" href="#" style="--c:var(--hue-{hue});--c-ink:var(--hue-{hue}-ink)"><span><b>{esc(n)}</b><em>{esc(latin)}</em></span>'
            f'<span class="class-card__stack" aria-hidden="true">{stack}</span><span><strong>{animals}</strong><small>animals · {species} species</small></span></a>')
co_nav = [('Classes · 12', [(I and 'paw', h, n, c) for n, _, c, _, h, _ in [(x[0], 0, x[2], 0, x[4], 0) for x in CLASSES]])]
COLLECTIONS = mod('Collections', 'All sites', co_nav, 'Add species',
    '<div class="board">' + banner_hero('giraffe.webp', 'Insights · your collection', 'Every species, every site.', 'Live counts across all 10 sites · updated today', [('359', 'Species'), ('26.6K', 'Population')])
    + widget('sky', 'plus', 'Accessions', '2,226', 'animals added · last 6 months', pill='8% more than the 6 months before', dot='success')
    + widget('mint', 'zap', 'Births', '583', 'born · last 6 months')
    + widget('', 'help', 'Sex not recorded', '7,716', 'animals still to be sexed', pill='29% of animals', dot='caution')
    + '</div><div class="section-head"><b>Browse by class</b><a href="#">See all 12 classes</a></div><div class="class-cards">' + ''.join(class_card(*c) for c in CLASSES) + '</div>'
    + list_card('Recent activity', acts([('plus', 'green', '12 Chital accessioned', 'Clearspring · today, 10:40'), ('zap', 'amber', '3 Sarus crane chicks born', 'Wetland 2 · yesterday'), ('swap', 'teal', '6 Blackbuck transferred', 'To Foxglen · 3 Nov'), ('file', 'navy', 'Taxonomy updated', 'Reverse Pebblesnail · 2 Nov')])))
COLLECTIONS = COLLECTIONS.replace('<p class="t-overline modnav__label">Classes · 12</p>', '<p class="t-overline modnav__label">Classes · 12</p>' + search('Find a class'), 1)

# Necropsy
NECROPSY = mod('Necropsy', 'All centres', [('Cases', [('download', 'sky', 'Incoming', '19'), ('clock', 'amber', 'Pending', '67'), ('pencil', 'navy', 'Draft', '0'), ('check', 'green', 'Completed', '67')]), ('Transfers', [('truck', 'coral', 'Carcass transfers', 18, True)])], 'Start a necropsy',
    '<div class="board">' + band_hero('navy', 'Waiting for necropsy · all time · all centres', '67', 'carcasses received · 27 high priority', glass_btn('Start the next one'))
    + widget('sky', 'download', 'Incoming', '19', 'on the way to the centre', pill='11 at security checkout', dot='info')
    + widget('mint', 'check', 'Completed', '67', 'necropsies done')
    + widget('', 'truck', 'Carcass transfers', '18', 'waiting for acceptance', pill='34 received', dot='info')
    + widget('', 'pencil', 'Drafts', '0', 'nothing left half done')
    + '</div><div class="board board--2">'
    + list_card('Next up', ''.join(wait_item(media(i, s), a, l1, l2, n) for i, s, a, l1, l2, n in [('plumage.webp', 'F', 'AAID: 426029', 'Indian peafowl · Old age', 'National necropsy centre', '1m 11d'), ('tiger-coat.webp', 'UD', 'AAID: 426058', 'Indian star tortoise · Undetermined', 'National necropsy centre', '1m 9d'), ('macaw-red.webp', 'F', 'AAID: 426116', 'Rose-ringed parakeet · Natural', 'AIIMS', '1m 2d')]))
    + list_card('Recently completed', ''.join(item(media(i, s), a, l1, l2, f'<b>{d}</b><span class="is-done">{r}</span>') for i, s, a, l1, l2, d, r in [('tiger-coat.webp', 'F', 'AAID: 425409', 'Indian rock python · Old age', 'National necropsy centre', '05 Nov 2026', 'NPS38-00552'), ('macaw-red.webp', 'ID', 'AAID: 425380', 'Rose-ringed parakeet · Infection', 'National necropsy centre', '02 Nov 2026', 'NPS38-00549'), ('zebra.webp', 'M', 'AAID: 425351', 'Chital · Trauma', 'National necropsy centre', '30 Oct 2026', 'NPS38-00546')]))
    + '</div>', site_icon='test-tube', period=True)

# Fetal death
FETAL = mod('Fetal death', 'All sites', [('Records', [('file', 'coral', 'All fetal deaths', '173'), ('alert', 'navy', 'Stillbirth', '63'), ('minus', 'coral', 'Abortion', '110')])], 'Report fetal death',
    '<div class="board">' + band_hero('wine', 'Fetal deaths · all time · every site', '173', 'pregnancies lost · 42 species')
    + widget('', 'minus', 'Abortion', '110', 'lost before term')
    + widget('navy', 'user', 'Repeat losses', '1', 'mother lost more than one', pill='Worth a vet review', dot='caution')
    + widget('', 'alert', 'Stillbirth', '63', 'born without life')
    + '</div><div class="board board--2">'
    + list_card('Recently reported', ''.join(item(media(i, s), a, l1, l2, status(k, 'tertiary') + f'<span>{d}</span>') for i, s, a, l1, l2, k, d in [('zebra.webp', 'F', 'FTS/00101/26', 'Chital · mother 428143', 'Adirampattinam', 'Stillbirth', '08 Nov 2026'), ('elephant.webp', 'UD', 'FTS/00100/26', 'Nilgai · mother 428132', 'Adirampattinam', 'Abortion', '06 Nov 2026'), ('fur.webp', 'UD', 'FTS/0099/26', 'Gaur · mother 428106', 'Clearspring', 'Stillbirth', '05 Nov 2026')]))
    + list_card('Most affected species', rank_rows([('Chital', 1, '31', 'zebra.webp'), ('Gaur', .6, '19', 'elephant.webp'), ('Nilgai', .45, '14', 'giraffe.webp'), ('Sloth bear', .2, '6', 'fur.webp')], 'coral', photo=True))
    + '</div>', extra=SHEET_FETAL, action_attr='data-drawer-open="sheet-fetal"')

# Tags (DD-009): the Tags hub and Public tags, from the Tags module prototype
TG_NAV = [('Tags', [('tag', 'teal', 'Tags hub', '17'), ('globe', 'sky', 'Public tags', '14')])]
DATE_PRESETS = [('All time', None), ('Today', None), ('Yesterday', None), ('Last 7 days', None), ('Last 30 days', None), ('Last 6 months', None), ('Custom range', None)]
def tg_toolbar(pid, ph='Search tags', filters=0, history=False, filter_sheet='sheet-tag-filter'):
    return (search(ph) + pick(pid, 'All time', 'calendar', DATE_PRESETS, site=False).replace('class="pick"', 'class="pick pick--outline"', 1)
            + f'<button class="btn btn--outline" type="button" data-drawer-open="{filter_sheet}">{I("filter")}Filter{count_html(filters) if filters else ""}</button>'
            + (f'<button class="icon-btn icon-btn--line" type="button" aria-label="Tag history" data-drawer-open="sheet-tag-history">{I("history")}</button>' if history else ''))
def line_tabs(opts, sel=0, label='Show'):
    return f'<div class="segmented segmented--line" role="tablist" aria-label="{esc(label)}">' + ''.join(f'<button type="button" role="tab" aria-selected="{str(i == sel).lower()}">{esc(o)}</button>' for i, o in enumerate(opts)) + '</div>'
def tag_group(title, chips): return f'<div class="tag-group"><div class="section-head"><b>{esc(title)}</b><span class="t-small t-secondary">{len(chips)}</span></div><div class="chips">{"".join(chips)}</div></div>'
INFO = ' data-drawer-open="sheet-tag-info"'
TG_HUB_MAIN = ('<div class="list-head"><div><h2>My tags hub</h2><p>Every tag you can use, by category. Select one to see where it is used.</p></div></div>'
    + '<section class="list-panel"><div class="toolbar">' + tg_toolbar('tg-hub-date') + '</div>'
    + '<div class="toolbar">' + tabs_with_counts([('Public tags', 14), ('Private tags', 3)], label='Tag type') + '</div>'
    + '<div class="tag-groups"><div class="tag-tabs">' + line_tabs(['All', 'Animals', 'Species', 'Sites', 'Sections', 'Enclosures'], label='Used on') + '</div>'
    + ''.join(tag_group(c, [tag_chip(n, pr, attrs=INFO) for n, pr in t]) for c, t in TAG_CATS[:1])
    + ''.join(tag_group(c, [tag_chip(n, pr, attrs=INFO) for n, pr in t]) for c, t in TAG_CATS[1:]) + '</div></section>')
TAGS = mod('Tags', 'All sites', TG_NAV, 'New tag', TG_HUB_MAIN, extra=SHEET_TAG + sheet_tag_filter() + sheet_tag_info(on_record=False), action_attr='data-drawer-open="sheet-tag"')
TAGS = TAGS.replace('<a class="modnav__item" href="#">' + tile('tag', 'teal') + '<span>Tags hub</span>', '<a class="modnav__item" href="#" aria-current="page">' + tile('tag', 'teal') + '<span>Tags hub</span>', 1).replace('<a class="sidenav__home" href="#" aria-current="page"', '<a class="sidenav__home" href="#"', 1)
CAT_ROWS = [('Health', 4, 5), ('Behaviour', 3, 3), ('Husbandry', 3, 2), ('Diet', 2, 1), ('General', 2, 3)]
TG_PUBLIC_MAIN = ('<div class="list-head"><div><h2>Public tags <small>14</small></h2><p>Tags everyone can see, and the categories that group them.</p></div>'
    + f'<button class="btn btn--outline" type="button">{I("plus")}New category</button></div>'
    + '<section class="list-panel"><div class="toolbar">' + tabs_with_counts([('Tags', 14), ('Categories', 5)], sel=1, label='Show') + search('Search categories') + '</div>'
    + '<div class="tag-groups"><div class="card-grid">' + ''.join(
        f'<a class="row row--outline" href="#"{" data-drawer-open=" + chr(34) + "sheet-category" + chr(34) if n == "Health" else ""}>{tile("grid", "teal")}<span class="row__body"><span class="row__title">{n}</span><span class="row__meta">{t} tags · {e} {"entity" if e == 1 else "entities"}</span></span>{I("chevron-right")}</a>'
        for n, t, e in CAT_ROWS) + '</div>'
    + tag_group('Tags in Health', [tag_chip(n, pr, attrs=INFO) for n, pr in TAG_CATS[0][1]]) + '</div></section>')
TAGS_PUBLIC = mod('Tags', 'All sites', TG_NAV, 'New tag', TG_PUBLIC_MAIN, extra=SHEET_TAG + SHEET_CATEGORY + sheet_tag_info(on_record=False), action_attr='data-drawer-open="sheet-tag"')
TAGS_PUBLIC = TAGS_PUBLIC.replace('<a class="modnav__item" href="#">' + tile('globe', 'sky') + '<span>Public tags</span>', '<a class="modnav__item" href="#" aria-current="page">' + tile('globe', 'sky') + '<span>Public tags</span>', 1).replace('<a class="sidenav__home" href="#" aria-current="page"', '<a class="sidenav__home" href="#"', 1)

# Medical
med_w = lambda k, ic, t, n, cap, **kw: widget(k, ic, t, n, cap, **kw)
MEDICAL = mod('Medical', 'All sites', [(None, [('syringe', 'coral', 'Administer', '12'), ('alert', 'coral', 'Symptoms', '1'), ('heart', 'green', 'Clinical assessment', '0'), ('test-tube', 'amber', 'Lab', '440'), ('syringe', 'sky', 'Vaccination', '143'), ('medicine', 'amber', 'Deworming', '319'), ('truck', 'navy', 'Hospital transfer', '69'), ('file', 'teal', 'Prescriptions', '0')]),
                                            ('Records', [('file', 'navy', 'Medical records', '983'), ('syringe', 'green', 'Vaccination records', '59'), ('medicine', 'coral', 'Deworming records', '11')])], 'New medical record',
    '<div class="board">' + banner_hero('fur.webp', 'Medical · animal health', 'Care for every animal, every day.', 'Live counts across all 10 sites · updated today', [('2,904', 'Animals sick'), ('160', 'Species')])
    + '</div><div class="section-head"><b>Medical records</b><span class="section-head__end">' + pick('med-period', 'Last 7 days', 'calendar', PERIODS, site=False) .replace('class="pick"', 'class="pick pick--outline"') + pick('med-filter', 'Active records', 'filter', [('Active records', None), ('All records', None), ('Closed records', None)], site=False).replace('class="pick"', 'class="pick pick--outline"') + '</span></div>'
    + '<div class="board">' + med_w('sky', 'file', 'Medical records', '48', 'animals with an open record · last 7 days') + med_w('', 'alert', 'Symptoms', '71', 'symptoms recorded · last 7 days') + med_w('', 'heart', 'Clinical assessments', '26', 'assessments done · last 7 days')
    + med_w('mint', 'file', 'Prescriptions', '39', 'prescriptions written · last 7 days') + med_w('', 'syringe', 'Vaccination records', '143', 'vaccinations given · last 7 days') + med_w('', 'medicine', 'Deworming records', '96', 'dewormings given · last 7 days')
    + '</div><div class="section-head"><b>Needs attention</b></div><div class="board board--4">'
    + med_w('', 'syringe', 'Overdue doses', '3', 'prescribed doses not given yet', pill='Next due at 11:30', dot='danger') + med_w('', 'alert', 'Top symptom', '18', 'loss of appetite · last 7 days')
    + med_w('teal', 'syringe', 'Due in 14 days', '267', 'vaccinations and dewormings', pill='Busiest Sun 29 Nov', dot='info') + med_w('', 'test-tube', 'Lab results', '3', 'ready to review', pill='2 abnormal', dot='caution')
    + '</div>' + list_card('Recent activity', acts([('alert', 'coral', 'Symptoms recorded · Chital 426180', 'Lethargy, loss of appetite · 10:20'), ('syringe', 'sky', '12 vaccinations given', 'Blackbuck herd · Clearspring · 9:05'), ('truck', 'navy', 'Sarus crane moved to hospital', 'Wetland 2 → Vet hospital · yesterday'), ('test-tube', 'amber', 'Lab result ready', 'Blood panel · Indian rock python · yesterday')])))

# Administer
days = '<div class="date-scroller__days">' + ''.join(f'<button type="button"{ACD if d == "05" else ""} class="has-events">{w}<b>{d}</b></button>' for w, d in [('Sun', '01'), ('Mon', '02'), ('Tue', '03'), ('Wed', '04'), ('Thu', '05'), ('Fri', '06'), ('Sat', '07')]) + '</div>'
days = days.replace(' class="has-events">Fri', '>Fri').replace(' class="has-events">Sat', '>Sat').replace('aria-current="date" class="has-events"', 'aria-current="date"')
ADMINISTER = mod('Administer', 'All sites', [], 'Record a dose',
    '<div class="board">' + banner_hero('tiger-coat.webp', 'Administer · Thursday 5 Nov', 'Every dose, on time.', 'Doses due across all 10 sites · updated today', [('12', 'Doses pending'), ('7', 'Animals')])
    + '</div><div class="section-head"><b>Doses for today</b><span class="section-head__end">' + pick('adm-who', 'All records', 'user', [('All records', None), ('My animals', None)], site=False).replace('class="pick"', 'class="pick pick--outline"') + f'<button class="pick pick--outline" type="button">{I("sliders")}Filters</button></span></div>'
    + f'<div class="date-scroller"><button class="icon-btn icon-btn--ghost" type="button" aria-label="Previous week">{I("chevron-left")}</button><button class="pick" type="button">{I("calendar")}Nov 2026{I("chevron-down")}</button>{days}<button class="icon-btn icon-btn--ghost" type="button" aria-label="Next week">{I("chevron-right")}</button></div>'
    + '<div class="board board--4">' + widget('sky', 'clock', 'Pending', '12', 'doses still to give') + widget('mint', 'check', 'Administered', '0', 'doses given') + widget('', 'calendar', 'Skipped', '0', 'doses skipped') + widget('', 'minus', 'Stopped', '0', 'medicines stopped')
    + '</div><div class="board board--2">' + widget('', 'paw', 'Animal records', '7', 'animals with doses on this day') + widget('', 'file', 'Group records', '0', 'groups with doses on this day')
    + '</div>' + list_card('Recent activity', acts([('check', 'green', 'Rabies vaccine given · Deertoe 428175', 'Z1 · 10:40'), ('clock', 'amber', 'Dewormer due · Chital herd', 'Clearspring · 11:30')])))

# Lab
LAB = mod('Lab', 'All sites', [('Requests', [('user', 'green', 'My requests', '253'), ('file', 'amber', 'All requests', '440')])], 'New lab request',
    '<div class="board">' + band_hero('bronze', 'Lab requests · every site', '440', 'requests · 253 raised by you', glass_btn('My requests'))
    + widget('', 'clock', 'Pending tests', '1,464', 'waiting for a sample or the lab', pill='1,025 awaiting sample', dot='caution')
    + widget('butter', 'refresh', 'In progress', '41', 'tests running now')
    + widget('mint', 'check', 'Completed', '155', 'results ready')
    + widget('', 'test-tube', 'Tests per request', '3.7', 'on average')
    + '</div><div class="board board--2">'
    + list_card('Waiting longest', ''.join(wait_item(media(i, s), a, l1, l2, n) for i, s, a, l1, l2, n in [('tiger-coat.webp', 'F', 'LT38-00353', 'Bengal tiger · 1 pending', 'Meera Iyer', '39d'), ('elephant.webp', 'UD', 'LT38-00355', 'Gaur · 1 pending', 'Neeta Rao', '37d'), ('fur.webp', 'M', 'LT38-00357', 'Sloth bear · 2 pending', 'Kunal Singh', '34d')]))
    + list_card('Most requested tests', rank_rows([('Complete blood count (CBC)', 1, '9'), ('Faecal parasite exam', .89, '8'), ('Liver function test', .89, '8'), ('Culture and sensitivity', .89, '8'), ('Tissue biopsy', .67, '6')], 'amber'))
    + '</div>', action_attr='data-toast="New lab request · opens in the ANTZ app"')

# Approvals
def appr_row(rid, kind, frm, to, who, when, icon='swap'):
    return (f'<div class="rec"><span class="rec__icon">{I(icon)}</span><span class="rec__main"><b>{esc(rid)}</b><span>{esc(kind)}</span></span>'
            f'<span class="route"><span>{esc(frm)}</span><span>{esc(to)}</span></span><span class="rec__text">{esc(who)}<small>{esc(when)}</small></span>'
            f'<span><button class="btn btn--review btn--sm" type="button">Review{I("chevron-right")}</button></span><span></span></div>')
APPROVALS = mod('Approvals', 'All sites', [('Transfer approvals', [('clock', 'amber', 'Pending', '4'), ('check', 'green', 'Approved or rejected', '6')])], 'New transfer',
    '<div class="board">' + banner_hero('giraffe.webp', 'Approvals · transfers', 'Every move, signed off.', 'Transfer requests across all 10 sites · updated today', [('16', 'Awaiting approval'), ('42', 'Approved · 30 days')])
    + '</div><div class="section-head"><b>Transfer approvals</b></div><div class="board">'
    + widget('sky', 'clock', 'Awaiting approval', '16', 'requests to review') + widget('mint', 'check', 'Approved', '42', 'approved · last 30 days') + widget('', 'x', 'Rejected', '3', 'rejected · last 30 days')
    + widget('', 'swap', 'Inter-site transfers', '38', 'between sites · last 30 days') + widget('', 'home', 'In-house transfers', '23', 'within a site · last 30 days') + widget('', 'truck', 'In progress', '9', 'approved, animals on the move')
    + '</div><div class="section-head"><b>Waiting for you</b><a href="#">See all</a></div><div class="rec-list card-rows">'
    + appr_row('INT-03413', 'Inter-site · 1 animal', 'Adirampattinam', 'Cholapuram', 'Kunal Singh', '06 Aug 2026 · 12:20') + appr_row('INH-03408', 'In-house · 1 animal', 'Ammapettai', 'Section B · Enclosure 4', 'Shambhavi K', '31 Jul 2026 · 17:37', 'home')
    + appr_row('INT-03347', 'Inter-site · 2 animals', 'Old Town', 'Attur site', 'Shambhavi K', '15 Jul 2026 · 09:52') + '</div>'
    + list_card('Recent activity', acts([('check', 'green', 'INH-03542 approved', 'Kirthana → Doggy · 08 Oct'), ('truck', 'amber', 'INT-03348 animals received', 'Old Town · allocate enclosures'), ('x', 'coral', 'INH-03527 rejected', '20 animals · Rose Garden'), ('clock', 'sky', 'INT-03413 sent for approval', 'Kunal Singh · 06 Aug')])))

# Reports
REPORTS = mod('Reports', 'All sites', [('Population', [('zap', 'green', 'Natality', '589'), ('heart', 'coral', 'Mortality', '189'), ('download', 'sky', 'New arrivals', '150'), ('arrow-up-right', 'navy', 'Inter-site transfer out', '101'), ('download', 'teal', 'Inter-site transfer in', '101'), ('globe', 'amber', 'External transfer', '23')])], 'Export report',
    f'<div class="range-bar">{seg(["Day", "Week", "Month"], sel=-1, label="Granularity")}<span class="range-bar__range"><button class="icon-btn icon-btn--ghost" type="button" aria-label="Earlier">{I("chevron-left")}</button>11 May 2026 – today<button class="icon-btn icon-btn--ghost" type="button" aria-label="Later" disabled>{I("chevron-right")}</button></span>'
    + pick('rep-range', 'Last 6 months', 'calendar', [('Last 6 months', None), ('Last 30 days', None), ('This year', None)], site=True) + '</div>'
    + '<div class="board">' + band_hero('ink', 'Population change · 11 May 2026 – today · every site', '+527', 'net change in animals', '<div class="net-split"><div><b>+840</b><small>came in</small></div><div><b>−313</b><small>went out</small></div></div>')
    + widget('mint', 'zap', 'Natality', '589', 'births', extra=delta('12%'))
    + widget('', 'heart', 'Mortality', '189', 'deaths', extra=delta('8%', True))
    + widget('sky', 'download', 'New arrivals', '150', 'animals added', extra=delta('21%'))
    + widget('navy', 'arrow-up-right', 'Inter-site transfer out', '101', 'animals sent', extra=delta('4%'))
    + '</div><div class="board board--2">'
    + list_card('Most births by species', rank_rows([('Chital', 1, '117', 'zebra.webp'), ('Blackbuck', .7, '82', 'giraffe.webp'), ('Indian peafowl', .5, '58', 'plumage.webp')], 'green', photo=True))
    + list_card('Sites with the most movement', rank_rows([('DK rescue centre', 1, '146', 'elephant.webp'), ('Adirampattinam', .75, '110', 'giraffe.webp'), ('Clearspring', .5, '73', 'zebra.webp')], 'teal', photo=True))
    + '</div>')
REPORTS = REPORTS.replace('Reports overview', 'Key insights', 1)

# Security
SECURITY = mod('Security', 'All sites', [('Checkpoints', [('swap', 'navy', 'Animal transfer', 3, True), ('package', 'amber', 'Egg transfer', 3, True), ('trash', 'coral', 'Egg discard', 3, True), ('truck', 'navy', 'Hospital transfer', 3, True), ('truck', 'coral', 'Carcass transfer', 3, True)])], 'Scan at the gate',
    '<div class="board">' + band_hero('lagoon', 'Waiting at the gate · every site', '15', 'movements need a security check')
    + widget('', 'swap', 'Animal transfer', '3', 'waiting to check out', pill='1 in transit', dot='info')
    + widget('butter', 'package', 'Egg transfer', '3', 'waiting to check out')
    + widget('', 'trash', 'Egg discard', '3', 'waiting for a check', pill='Needs a security check', dot='caution')
    + widget('navy', 'truck', 'Hospital transfer', '3', 'waiting to check out')
    + '</div><div class="board board--2">'
    + list_card('Waiting longest at the gate', ''.join(wait_item(f'<span class="rec__icon">{I(ic)}</span>', a, l1, l2, n) for ic, a, l1, l2, n in [('truck', 'CT38-00124', 'Carcass transfer · 1 carcass', 'Adirampattinam → National necropsy centre', '4d'), ('truck', 'HT38-00164', 'Hospital transfer · 1 animal', 'Nandanvan zoo → Central hospital', '4d'), ('trash', 'EGGDIS-00204', 'Egg discard · 2 eggs', 'Ammapettai', '3d')]))
    + list_card('Sites with the most waiting', rank_rows([('Adirampattinam', 1, '5', 'giraffe.webp'), ('Nandanvan zoo, Raipur', .6, '3', 'elephant.webp'), ('Ammapettai', .4, '2', 'zebra.webp')], 'coral', photo=True))
    + '</div>')

# Focus hub
FOCUS = mod('Focus hub', 'All sites', [('Saved', [('zap', 'amber', 'Favourites', '7'), ('tag', 'teal', 'Bookmarks', '7'), ('file', 'amber', 'Folders', '6')]), ('My folders', [('file', 'amber', 'Animals to watch', '3'), ('file', 'amber', 'Lab follow-ups', '2'), ('file', 'amber', 'Enclosure repairs', '4'), ('file', 'amber', 'Big cats', '3')])], 'New folder',
    '<div class="board">' + band_hero('navy', 'My focus hub · every site', '14', 'things you saved · 6 folders')
    + widget('butter', 'zap', 'Favourites', '7', '3 animals · 4 enclosures')
    + widget('sky', 'tag', 'Bookmarks', '7', 'notes, medical and lab records')
    + widget('navy', 'file', 'Folders', '6', 'to group what you save')
    + widget('', 'file', 'Not in a folder', '4', 'saved items', pill='Sort them into folders', dot='caution')
    + '</div><div class="board board--2">'
    + list_card('Recently saved', ''.join(item(f'<span class="rec__icon">{I(ic)}</span>', t, m, None, f'<span>{d}</span>') for ic, t, m, d in [('zap', 'Bengal tiger · Raja', 'Animal · Favourite', '08 Nov 2026'), ('zap', 'Big cat 1', 'Enclosure · Favourite', '02 Nov 2026'), ('tag', 'Water · Pond pump replaced', 'Note · Bookmark', '02 Nov 2026')]))
    + list_card('Your folders', ''.join(item(f'<span class="rec__icon">{I("file")}</span>', t, m, None, f'<b>{n}</b>items') for t, m, n in [('Animals to watch', 'Created 20 May 2026', '3'), ('Lab follow-ups', 'Created 20 May 2026', '2'), ('Enclosure repairs', 'Created 14 Jun 2026', '4')]))
    + '</div>', extra=SHEET_FOLDER, action_attr='data-drawer-open="sheet-folder"')

# Users
stack = '<span class="avatar-stack">' + ''.join(f'<span class="avatar" style="--av-bg:var(--hue-{h}-soft);--av-fg:var(--hue-{h}-ink)">{i}</span>' for i, h in [('NR', 'teal'), ('SR', 'sky'), ('SK', 'green'), ('KS', 'navy')]) + '<span class="avatar" style="--av-bg:var(--color-surface-muted);--av-fg:var(--color-text-secondary)">+34</span></span>'
USERS = mod('Users', 'All sites', [('People', [('users', 'navy', 'All users', '273'), ('user', 'green', 'Active today', '38'), ('x', 'coral', 'Blocked', '12')]), ('Browse', [('pin', 'sky', 'Sites', '7'), ('lock', 'amber', 'Roles', '11')])], 'Add user',
    '<div class="board">' + band_hero('lagoon', 'Users · every site', '273', 'people with an account · 11 roles', stack)
    + widget('mint', 'user', 'Active today', '38', 'used the app today')
    + widget('', 'lock', 'No role', '114', 'people without a role', pill='Assign a role', dot='caution')
    + widget('', 'x', 'Blocked', '12', 'cannot sign in', pill='Review the list', dot='danger')
    + widget('navy', 'pin', 'Sites', '7', 'with people assigned')
    + '</div><div class="board board--2">'
    + list_card('Active today', user_item('NR', 'teal', 'Neeta Rao', 'Super admin', '12:01 PM') + user_item('SR', 'sky', 'Sowmya R', 'Super admin', '11:24 AM') + user_item('SK', 'green', 'Shambhavi K', 'Veterinarian', '10:47 AM'))
    + list_card('Users by site', rank_rows([('Adirampattinam', 1, '83', 'giraffe.webp'), ('Ammapettai', .9, '75', 'elephant.webp'), ('Nandanvan zoo, Raipur', .5, '41', 'zebra.webp')], 'teal', photo=True))
    + '</div>', action_attr='data-toast="Add user · opens in the ANTZ app"')

# Help desk
HELPDESK = mod('Help desk', 'All sites', [('Requests', [('clock', 'amber', 'Pending approval', 61, True), ('check', 'green', 'Approved', '177'), ('x', 'coral', 'Rejected', '47'), ('minus', 'coral', 'Cancelled', '26'), ('file', 'navy', 'All requests', '311')])], 'New request',
    '<div class="board">' + band_hero('lagoon', 'Help desk · every site', '61', 'requests waiting for approval · 311 raised in total', glass_btn('2 need your approval', bright=True, icon='clock'))
    + widget('butter', 'receipt', 'Awaiting costing', '41', 'need a cost estimate')
    + widget('teal', 'refresh', 'In progress', '27', 'jobs being worked on', pill='3 overdue', dot='danger')
    + widget('mint', 'check', 'Completed', '52', 'jobs done')
    + widget('', 'x', 'Rejected', '47', 'turned down')
    + '</div><div class="board board--2">'
    + list_card('Overdue jobs', ''.join(wait_item('', t, l1, l2, n, 'overdue') for t, l1, l2, n in [('Shutter jammed at feed store', 'REQ38-00488 · Rolling shutter · Amruth site', 'Job in charge: Ravi Kumar', '9d'), ('AC servicing for the ICU', 'REQ38-00487 · HVAC · Cholapuram', 'Job in charge: Neeta Rao', '6d'), ('Flickering lights in Aviary 3', 'REQ38-00486 · Electrical work · Nandanvan zoo', 'Job in charge: Deelip Kumar', '3d')]))
    + list_card('Requests by department', rank_rows([('Medical equipment', 1, '4'), ('Rolling shutter', 1, '4'), ('Split AC', .75, '3'), ('Painting work', .75, '3'), ('HVAC', .75, '3')], 'teal'))
    + '</div>', extra=quick_add_dialog('hd-quick'), action_attr='data-dialog-open="hd-quick"')

for slug, title, intro, icon, hue, tpl in [
    ('collections', 'Collections', 'The Collections module home: insights for every species and site, accessions, births, animals to sex, and browsing by class.', 'grid', 'green', COLLECTIONS),
    ('necropsy', 'Necropsy', 'The Necropsy module home: carcasses waiting, incoming, completed and drafts, what is next and what was done.', 'test-tube', 'navy', NECROPSY),
    ('fetal-death', 'Fetal death', 'The Fetal death module home, with the Report fetal death side sheet (choose or scan the enclosure).', 'alert', 'coral', FETAL),
    ('tags', 'Tags', 'The Tags hub: every tag by category, public or private, filtered by where it is used. Select a tag to see its info; New tag opens the side sheet.', 'tag', 'teal', TAGS),
    ('medical', 'Medical', 'The Medical module home: a banner hero, medical records with period and status pickers, what needs attention and recent activity.', 'treatment', 'green', MEDICAL),
    ('administer', 'Administer', 'The Administer module home: doses for the chosen day in a date scroller, by state, for animals and groups.', 'syringe', 'coral', ADMINISTER),
    ('lab', 'Lab', 'The Lab module home: requests, pending tests, what is waiting longest and the most requested tests. New lab request opens in the app (a toast says so).', 'test-tube', 'amber', LAB),
    ('approvals', 'Approvals', 'The Approvals module home: transfers awaiting approval, approved, rejected, and rows waiting for your review with their route.', 'clock', 'teal', APPROVALS),
    ('reports', 'Reports', 'Key insights: a range bar (day, week, month, range, preset), net population change, and each movement with its trend.', 'bar-chart', 'navy', REPORTS),
    ('security', 'Security', 'The Security module home: movements waiting at the gate by checkpoint, the longest waits and the sites with the most waiting.', 'lock', 'navy', SECURITY),
    ('focus-hub', 'Focus hub', 'The Focus hub module home: favourites, bookmarks and folders, with the New folder side sheet.', 'zap', 'amber', FOCUS),
    ('users', 'Users', 'The Users module home: people, roles and sites, who is active today, and users by site. Add user opens in the app.', 'users', 'navy', USERS),
    ('help-desk', 'Help desk', 'The Help desk module home: requests waiting for approval, costing, jobs in progress and overdue, by department.', 'help', 'teal', HELPDESK)]:
    screen_page(slug, title, intro, icon, hue, tpl, MOD_CAPS, MOD_DO, MOD_DONT)

scr = [g for g in nav['groups'] if g['title'] == 'Screens'][0]
after = 'screen-announcements.html'
for slug, t in [('collections', 'Collections'), ('necropsy', 'Necropsy'), ('fetal-death', 'Fetal death'), ('tags', 'Tags'), ('medical', 'Medical'), ('administer', 'Administer'), ('lab', 'Lab'), ('approvals', 'Approvals'), ('reports', 'Reports'), ('security', 'Security'), ('focus-hub', 'Focus hub'), ('users', 'Users'), ('help-desk', 'Help desk')]:
    href = f'screen-{slug}.html'
    hs = [l['href'] for l in scr['links']]
    if href not in hs: scr['links'].insert(hs.index(after) + 1, collections.OrderedDict([('href', href), ('title', t), ('isNew', True)]))
    after = href

# ═══ Animals · Recently added: the record card (a variant of .animal-card) ═══
SEX = {'M': ('', 'Male'), 'F': (' sex-tag--f', 'Female'), 'UD': (' sex-tag--ud', 'Undetermined'), 'ID': (' sex-tag--id', 'Indeterminate')}
def animal_rec(aaid, name, sci, sex, when, encl, zone, site, img=None):
    cls, word = SEX[sex]
    media = f'<img src="{IMG}{img}" alt="">' if img else I('paw')
    return (f'<a class="animal-card animal-card--record" href="#"><span class="animal-card__media">{media}<span class="sex-tag{cls}" title="{word}">{sex}<span class="sr-only"> ({word})</span></span></span>'
            f'<span class="animal-card__body"><span class="animal-card__id">AAID {aaid}</span><b class="animal-card__name" title="{esc(name)}">{esc(name)}</b><i class="animal-card__sci">{esc(sci)}</i></span>'
            f'<span class="animal-card__when">{esc(when)}</span>'
            f'<span class="animal-card__foot"><span class="ac-place">{I("home")}<b>{esc(encl)}</b></span>'
            f'<span class="ac-place ac-place--sub"><span>{I("grid")}{esc(zone)}</span><span>{I("pin")}{esc(site)}</span></span></span></a>')
# The 14 animals of Antz Home style 2 "Recently added"; photos in assets/img/species (DD-007, credited in CREDITS.md)
RECENT = [('428169', 'Mouna · Black kite', 'Milvus migrans', 'F', 'Today', 'Big cat 1', 'Carnivore zone', 'Adirampattinam', 'species/black-kite.webp'),
          ('428152', 'Sloth bear', 'Melursus ursinus', 'UD', 'Today', 'Paddock 4', 'Herbivore range', 'Adirampattinam', 'species/sloth-bear.webp'),
          ('428135', 'Indian rock python', 'Python molurus', 'ID', 'Yesterday', 'Reptile 2', 'Reptile house', 'Adirampattinam', None),
          ('428118', 'Hill myna', 'Gracula religiosa', 'F', 'Yesterday', 'Primate 1', 'Primate zone', 'Clearspring', 'species/hill-myna.webp'),
          ('428101', 'Indian leopard', 'Panthera pardus fusca', 'M', '2 days ago', 'Pond 2', '10 Acre', 'Adirampattinam', 'species/indian-leopard.webp'),
          ('428084', 'Raja · Sumatran orangutan', 'Pongo abelii', 'M', '2 days ago', 'Holding 1', 'Bird park', 'Adirampattinam', 'species/sumatran-orangutan.webp'),
          ('428067', 'Indian peafowl', 'Pavo cristatus', 'F', '3 days ago', 'Q-bay 2', 'Carnivore zone', 'Adirampattinam', None),
          ('428050', 'Asiatic lion', 'Panthera leo persica', 'UD', '3 days ago', 'Aviary 7', 'Herbivore range', 'Adirampattinam', 'species/asiatic-lion.webp'),
          ('428033', 'Bonnet macaque', 'Macaca radiata', 'ID', '4 days ago', 'Paddock 9', 'Reptile house', 'Srushti site', 'species/bonnet-macaque.webp'),
          ('428016', 'Rose-ringed parakeet', 'Psittacula krameri', 'F', '4 days ago', 'Aviary 3', 'Primate zone', 'Adirampattinam', 'species/rose-ringed-parakeet.webp'),
          ('427999', 'Kaveri · Bengal tiger', 'Panthera tigris tigris', 'M', '5 days ago', 'Big cat 1', '10 Acre', 'Adirampattinam', None),
          ('427982', 'Gaur', 'Bos gaurus', 'M', '5 days ago', 'Paddock 4', 'Bird park', 'Adirampattinam', 'species/gaur.webp'),
          ('427965', 'Mahseer', 'Tor putitora', 'F', '6 days ago', 'Reptile 2', 'Carnivore zone', 'Adirampattinam', None),
          ('427948', 'Chital', 'Axis axis', 'UD', '6 days ago', 'Primate 1', 'Herbivore range', 'Crimson Frosted', 'species/chital.webp')]
AN_NAV = [('Pages', [('clock', 'sky', 'Recently added', '148'), ('paw', 'green', 'All animals', '26.2K'), ('swap', 'navy', 'Transferred animals', '497'),
                     ('trash', 'coral', 'Deleted animals', '120'), ('alert', 'amber', 'Missing / escaped', '140')])]
REC_CARDS = '<div class="animal-cards">' + ''.join(animal_rec(*r) for r in RECENT) + '</div>'
AN_RECENT = module_page('Animals', 'All sites', AN_NAV, 'Add animal',
    '<div class="list-head"><div><h2>Recently added <small>148</small></h2><p>Animals added in the last 7 days.</p></div></div>'
    + f'<section class="list-panel"><div class="toolbar">{search("Search AAID, name, species or enclosure")}'
    + f'<button class="btn btn--outline btn--sm" type="button">{I("sliders")}Filters</button>{sort_pick("sort-pick")}</div>'
    + REC_CARDS + pagination(14, 148, 3) + '</section>', active='Recently added',
    bar={'crumbs': False, 'bell_dot': True, 'avatar_img': 'species/portrait.webp', 'switch_tone': 'vivid'}, nav={'soft': True}, strip=True, tinted=True)
screen_page('animals-recent', 'Recently added', 'Animals added in the last 7 days as record cards: photo and sex, AAID and names, how long ago, and where each animal lives.', 'paw', 'sky', AN_RECENT,
            ['One card per row; the side panel becomes a strip above the list.', 'Two cards per row; the side panel stacks above the list.', 'Side panel beside the list; two cards per row.', 'Side panel beside the list; three cards per row.'],
            ['Use record cards when the photo helps people recognise the animal; use record rows for long lists to scan.', 'Say how long ago in words (Today, 3 days ago).'],
            ['Colour the card to show status: put alerts on the full animal card.', 'Drop the scientific name: it tells similar species apart.'])
add_link('Screens', 'screen-animals-recent.html', 'Recently added', 'screen-animals.html')

# The record card on the Animal card page (hand-written page; this section is generated between markers)
def put_section(path, start, end, html, before):
    t = open(path).read()
    if start in t: t = t[:t.index(start)] + start + html + end + t[t.index(end) + len(end):]
    else:
        assert t.count(before) == 1, before
        t = t.replace(before, start + html + end + before, 1)
    open(path, 'w').write(t)
REC_DOC = ('<div class="doc" id="p-animal-record"><h3>Record cards</h3>'
           '<p class="lead">A grid of small cards for a list of animals, for example <b>Recently added</b>. Each shows the photo (or a paw) with a solid <b>sex tag</b> on its corner, the AAID, the name and the scientific name, a <b>time pill</b> and, under a hairline, where the animal lives: enclosure, zone and site. It is a variant of the animal card (<code>animal-card--record</code>), not a new card. The grid fits three, two or one cards to the space.</p>'
           '<div class="demo demo--canvas">' + '<div class="animal-cards">' + ''.join(animal_rec(*r) for r in RECENT[:6]) + '</div></div></div>')
REC_CODE = ('<div class="doc" id="p-animal-record-code"><h3>Record cards</h3><h4>Classes</h4><div class="chips">'
            + ''.join(f'<code>{c}</code>' for c in ['.animal-cards', '.animal-card--record', '.animal-card__media', '.sex-tag', '.animal-card__id', '.animal-card__name', '.animal-card__sci', '.animal-card__when', '.animal-card__foot', '.ac-place', '.ac-place--sub', '--size-thumb'])
            + '</div><details class="code" open><summary>Markup</summary><pre><code>' + esc(animal_rec(*RECENT[3]).replace('><', '>\n<')) + '</code></pre></details></div>')
put_section('pages/animal-card.html', '<!--record-cards-->', '<!--/record-cards-->', REC_DOC, '</div></section><section class="tab-panel" id="panel-usage"')
put_section('pages/animal-card.html', '<!--record-cards-code-->', '<!--/record-cards-code-->', REC_CODE, '</section>\n<nav class="pager"')
print('animal record cards ok')

# ═══ Table styles on the Table page (generated between markers) ═══
def tbl_media(sex, img=None):
    cls, word = SEX[sex]
    pic = f'<img src="{IMG}{img}" alt="">' if img else I('paw')
    return f'<span class="table__media">{pic}<span class="sex-tag{cls}" title="{word}">{sex}<span class="sr-only"> ({word})</span></span></span>'
def tbl_record(aaid, name, sci, link=True):
    a = f'<a class="table__link" href="#">AAID: {aaid}</a>' if link else f'AAID: {aaid}'
    return f'<span class="table__record"><b>{a}</b><span>{esc(name)}</span><i>{esc(sci)}</i></span>'
def two(main, sub): return f'{esc(main)}<small class="table__sub">{esc(sub)}</small>'
GO = f'<td class="table__go" aria-hidden="true">{I("chevron-right")}</td>'
def th(*cols): return '<thead><tr>' + ''.join(f'<th{(" class=" + chr(34) + c + chr(34)) if c else ""}>{esc(t)}</th>' if t is not None else f'<th{(" class=" + chr(34) + c + chr(34)) if c else ""}><span class="sr-only">{esc(n)}</span></th>' for t, c, n in cols) + '</tr></thead>'
def wrap(table, extra=''): return f'{extra}<div class="table-wrap">{table}</div>'
ALL = [('427858', 'Name: Bhalu · Chital', 'Axis axis', 'UD', 'Paddock 4', 'Adirampattinam', '07 Nov 2026', None),
       ('427841', 'Nilgai', 'Boselaphus tragocamelus', 'ID', 'Reptile 2', 'Crimson Frosted', '03 Nov 2026', None),
       ('427824', 'Indian leopard', 'Panthera pardus fusca', 'F', 'Pond 2', 'Adirampattinam', '30 Oct 2026', 'leopard.webp'),
       ('427807', 'Cinereous vulture', 'Aegypius monachus', 'M', 'Pond 2', 'Adirampattinam', '26 Oct 2026', None)]
t_all = wrap('<table class="table table--records">' + th(('', '', 'Photo'), ('Animal', '', ''), ('Enclosure', 'table__opt', ''), ('Accession', 'table__opt', ''), (None, '', 'Open'))
             + '<tbody>' + ''.join(f'<tr><td>{tbl_media(sx, img)}</td><td>{tbl_record(a, n, sc)}</td><td class="table__opt">{two(e, site)}</td><td class="table__opt table__date">{d}</td>{GO}</tr>' for a, n, sc, sx, e, site, d, img in ALL) + '</tbody></table>')
MISS = [('426925', 'Name: Kaveri · Bonnet macaque', 'Macaca radiata', 'M', 'Pond 2', 'Srushti site', '04 Nov 2026', 'danger', 'Escaped'),
        ('426908', 'Rose-ringed parakeet', 'Psittacula krameri', 'M', 'Holding 1', 'Adirampattinam', '28 Oct 2026', 'warning', 'Missing'),
        ('426891', 'Bengal tiger', 'Panthera tigris tigris', 'F', 'Q-bay 2', 'Adirampattinam', '21 Oct 2026', 'success', 'Found'),
        ('426874', 'Gaur', 'Bos gaurus', 'UD', 'Aviary 7', 'Adirampattinam', '14 Oct 2026', 'danger', 'Escaped')]
t_miss = wrap('<table class="table table--records">' + th(('', '', 'Photo'), ('Animal', '', ''), ('Last seen', 'table__opt', ''), ('Reported', 'table__opt', ''), ('Status', '', ''), (None, '', 'Open'))
              + '<tbody>' + ''.join(f'<tr><td>{tbl_media(sx)}</td><td>{tbl_record(a, n, sc)}</td><td class="table__opt">{two(e, site)}</td><td class="table__opt table__date">{d}</td><td><span class="status status--{st}">{lab}</span></td>{GO}</tr>' for a, n, sc, sx, e, site, d, st, lab in MISS) + '</tbody></table>')
DEL = [('427236', 'Name: Chotu · Sambar', 'Rusa unicolor', 'F', 'Duplicate record', 'Neeta Rao', '05 Nov 2026'),
       ('427219', 'Giant forest scorpion', 'Heterometrus swammerdami', 'M', 'Entered by mistake', 'Kunal Singh', '30 Oct 2026'),
       ('427202', 'Sarus crane', 'Antigone antigone', 'M', 'Wrong species', 'Meera Iyer', '24 Oct 2026')]
t_del = wrap('<table class="table table--records">' + th(('', '', 'Photo'), ('Animal', '', ''), ('Reason', 'table__opt', ''), ('Deleted', 'table__opt', ''), (None, '', 'Action'))
             + '<tbody>' + ''.join(f'<tr><td>{tbl_media(sx)}</td><td>{tbl_record(a, n, sc, link=False)}</td><td class="table__opt">{two(r, "by " + who)}</td><td class="table__opt table__date">{d}</td><td><button class="btn btn--secondary btn--sm" type="button">{I("refresh")}Restore<span class="sr-only"> AAID {a}</span></button></td></tr>' for a, n, sc, sx, r, who, d in DEL) + '</tbody></table>')
STOCK = [('Meloxicam 15 mg', 'B-2291', 'Mar 2027', 412, 150, 18540), ('Amoxicillin 500 mg', 'B-2304', 'Jan 2027', 96, 200, 7680),
         ('Ivermectin 1%', 'B-2187', 'Dec 2026', 38, 40, 11400), ('Vitamin B complex', 'B-2342', 'Aug 2027', 640, 300, 9600)]
t_stock = wrap('<table class="table table--compact"><thead><tr><th>Medicine</th><th>Batch</th><th>Expiry</th><th class="table__num">In stock</th><th class="table__num">Reorder at</th><th class="table__num">Value (₹)</th><th>Status</th></tr></thead><tbody>'
               + ''.join(f'<tr><td>{esc(m)}</td><td>{b}</td><td class="table__date">{x}</td><td class="table__num">{q:,}</td><td class="table__num">{r:,}</td><td class="table__num">{v:,}</td><td>' + (f'<span class="status status--warning">Reorder</span>' if q < r else '<span class="status status--success">In stock</span>') + '</td></tr>' for m, b, x, q, r, v in STOCK)
               + f'</tbody><tfoot><tr><td>Total</td><td></td><td></td><td class="table__num">{sum(x[3] for x in STOCK):,}</td><td></td><td class="table__num">{sum(x[5] for x in STOCK):,}</td><td></td></tr></tfoot></table>')
TRF = [('TRF-00318', 'Adirampattinam', 'Srushti site', 3, '06 Nov 2026', '2026-11-06', 'info', 'In transit'), ('TRF-00317', 'Clearspring', 'Hollowpine', 1, '01 Nov 2026', '2026-11-01', 'success', 'Received'),
       ('TRF-00316', 'Adirampattinam', 'Mysuru Zoo', 6, '27 Oct 2026', '2026-10-27', 'success', 'Received'), ('TRF-00315', 'Srushti site', 'Clearspring', 2, '22 Oct 2026', '2026-10-22', 'warning', 'Waiting for papers')]
sort_th = lambda t, cur=None, cls='': f'<th{(" class=" + chr(34) + cls + chr(34)) if cls else ""}{(" aria-sort=" + chr(34) + cur + chr(34)) if cur else ""}><button class="table__sort" type="button">{t}{I("chevron-down")}</button></th>'
t_sel = wrap('<table class="table table--select"><thead><tr><th><label class="check"><input type="checkbox"><span class="sr-only">Select all transfers</span></label></th>'
             + sort_th('Transfer') + sort_th('Route') + sort_th('Animals', cls='table__num') + sort_th('Date', 'descending') + '<th>Status</th></tr></thead><tbody>'
             + ''.join(f'<tr><td><label class="check"><input type="checkbox"><span class="sr-only">Select {tid}</span></label></td><td><b>{tid}</b></td><td>{esc(a)} → {esc(b)}</td><td class="table__num">{n}</td><td class="table__date" data-value="{iso}">{d}</td><td><span class="status status--{st}">{lab}</span></td></tr>' for tid, a, b, n, d, iso, st, lab in TRF)
             + '</tbody></table>',
             f'<div class="table-bulk" hidden><span data-selected-count>0 selected</span><span class="table-bulk__end"><button class="btn btn--outline btn--sm" type="button">{I("download")}Export</button><button class="btn btn--secondary btn--sm" type="button">{I("check")}Mark received</button></span></div>')
LOG = [('06:30', 'Big cat 1', 'Raw meat, 4 kg', 'Kunal Singh', 'success', 'Fed'), ('07:00', 'Aviary 3', 'Seed mix and fruit', 'Meera Iyer', 'success', 'Fed'), ('07:15', 'Pond 2', 'Fish, 2 kg', 'Kunal Singh', 'success', 'Fed'),
       ('08:00', 'Paddock 4', 'Hay and pellets', 'Neeta Rao', 'success', 'Fed'), ('08:30', 'Reptile 2', 'Mice, 3', 'Sowmya R', 'warning', 'Refused'), ('09:00', 'Primate 1', 'Fruit and greens', 'Meera Iyer', 'success', 'Fed'),
       ('11:00', 'Holding 1', 'Browse and pellets', 'Neeta Rao', 'info', 'Due'), ('12:00', 'Aviary 7', 'Insects and seed', 'Sowmya R', 'info', 'Due'), ('13:30', 'Big cat 1', 'Bone, 1', 'Kunal Singh', 'info', 'Due'),
       ('15:00', 'Pond 2', 'Fish, 2 kg', 'Kunal Singh', 'info', 'Due'), ('16:00', 'Paddock 9', 'Hay', 'Neeta Rao', 'info', 'Due'), ('17:30', 'Primate 1', 'Fruit', 'Meera Iyer', 'info', 'Due')]
t_log = ('<div class="table-wrap table-wrap--scroll" tabindex="0" role="region" aria-label="Feeding log, scrolls"><table class="table table--striped table--sticky"><thead><tr><th>Time</th><th>Enclosure</th><th>Diet</th><th>Keeper</th><th>Status</th></tr></thead><tbody>'
         + ''.join(f'<tr><td class="table__date">{t}</td><td>{esc(e)}</td><td>{esc(d)}</td><td>{esc(k)}</td><td><span class="status status--{st}">{lab}</span></td></tr>' for t, e, d, k, st, lab in LOG) + '</tbody></table></div>')
def tdoc(i, title, lead, body): return f'<div class="doc" id="{i}"><h3>{title}</h3><p class="lead">{lead}</p><div class="demo demo--col">{body}</div></div>'
TBL_DOC = (tdoc('table-records', 'Record table', 'One record per row: a photo with the sex tag, the record ID, name and scientific name, then two-line cells and a date. The whole row opens the record (the link on the ID stretches over it) and a chevron says so. Small-caps headings. On narrow screens the optional columns (<code>table__opt</code>) step back.', t_all)
           + tdoc('table-status', 'With status', 'Add a status column with the status pill: danger, warning, success. Status lives in the pill, never in a row colour.', t_miss)
           + tdoc('table-action', 'With a row action', 'When a row has one action, use a real <b>secondary button</b> (Restore), not a chip that looks like a status. A row with an action is not a link: no chevron.', t_del)
           + tdoc('table-figures', 'Compact figures', 'For reports and stock: compact rows (<code>table--compact</code>), numbers on the right in tabular figures (<code>table__num</code>), and a totals row in <code>tfoot</code>.', t_stock)
           + tdoc('table-select', 'Selectable and sortable', 'Tick rows to act on several at once: the bulk bar appears with the count, and the heading box selects all (a dash when some are ticked). Headings sort: select one, select again to reverse; the sorted column shows its arrow.', t_sel)
           + tdoc('table-long', 'Striped, with a sticky head', 'For long logs in a fixed height: alternate rows are tinted (<code>table--striped</code>) and the head stays in view while the body scrolls (<code>table--sticky</code> in <code>table-wrap--scroll</code>).', t_log))
TBL_CODE = ('<div class="doc" id="table-styles-code"><h3>Table styles</h3><h4>Classes</h4><div class="chips">' + ''.join(f'<code>{c}</code>' for c in ['.table--records', '.table__media', '.table__record', '.table__link', '.table__sub', '.table__date', '.table__go', '.table__opt', '.table--compact', '.table__num', 'tfoot', '.table--select', '.table__sort', '[aria-sort]', '.table-bulk', '[data-selected-count]', '.table--striped', '.table--sticky', '.table-wrap--scroll'])
            + '</div><details class="code" open><summary>Record row</summary><pre><code>' + esc(('<tr><td>' + tbl_media('F', 'leopard.webp') + '</td><td>' + tbl_record('427824', 'Indian leopard', 'Panthera pardus fusca') + '</td><td class="table__opt">' + two('Pond 2', 'Adirampattinam') + '</td><td class="table__opt table__date">30 Oct 2026</td>' + GO + '</tr>').replace('><', '>\n<')) + '</code></pre></details></div>')
put_section('pages/table.html', '<!--table-styles-->', '<!--/table-styles-->', TBL_DOC, '</div></section><section class="tab-panel" id="panel-usage"')
put_section('pages/table.html', '<!--table-styles-code-->', '<!--/table-styles-code-->', TBL_CODE, '</section>\n<nav class="pager"')
print('table styles ok')

# ═══ Pharmacy app (antz-pharmacy-web): pinned wide table, request detail, dispense sheet ═══
def prio(tag):
    return '' if not tag else (f'<span class="prio-tag">{I("alert")}Urgent</span>' if tag == 'Urgent' else '<span class="prio-tag prio-tag--high">High</span>')
def person_cell(ini, hue, name, sub): return f'<span class="table__person">{avatar(ini, hue)}<span><b>{esc(name)}</b><small>{esc(sub)}</small></span></span>'
def pend_cell(left, total, label=None):
    shipped = (total - left) / total
    head = label or f'{left} pending'
    return f'<span class="table__progress"><b>{esc(head)}</b><small class="table__sub">of {total} item{"s" if total != 1 else ""}</small><span class="meter" style="--v:{shipped:.2f}"><i></i></span></span>'
PINNED = [('RES002839', 'Urgent', 'Adirampattinam central pharmacy', '1 day', False, (1, 1, None), ('Requested', 'caution', None), ('ST', 'green', 'Sourav Tambe', 'Vet · 10 Nov 2026'), ('BW', 'teal', 'Bharathi W', '11 Nov 2026')),
          ('RES002835', None, 'Adirampattinam central pharmacy', '15 days', False, (4, 4, None), ('Requested', 'caution', None), ('KS', 'sky', 'Kunal Singh', 'Keeper · 27 Oct 2026'), None),
          ('RES002831', 'High', 'Central pharmacy', '29 days', False, (3, 3, None), ('Requested', 'caution', None), ('DK', 'green', 'Deelip Kumar', 'Vet · 13 Oct 2026'), ('RK', 'teal', 'Ravi Kumar', '14 Oct 2026')),
          ('RES002815', None, 'Central pharmacy', '85 days', False, (2, 3, None), ('Partly shipped', 'info', 'Last shipment 18 Aug 2026'), ('OW', 'navy', 'Ovi Wagh', 'Vet · 18 Aug 2026'), ('NR', 'amber', 'Neeta Rao', '18 Aug 2026')),
          ('RES002791', 'High', 'Adirampattinam central pharmacy', '170 days', False, (1, 1, 'Part received'), ('Partly shipped', 'info', 'Last shipment 25 May 2026'), ('MI', 'teal', 'Meera Iyer', 'Keeper · 25 May 2026'), ('BW', 'teal', 'Bharathi W', '26 May 2026')),
          ('RES002779', 'Urgent', 'Adirampattinam central pharmacy', '212 days', True, (1, 2, None), ('Partly shipped', 'info', 'Last shipment 13 Apr 2026'), ('RK', 'teal', 'Ravi Kumar', 'Vet · 13 Apr 2026'), None)]
def pinned_row(rid, tag, to, wait, late, pend, st, by, up):
    stx, stk, sub = st
    return (f'<tr><td><span class="table__id"><a class="table__link" href="#"><b>{rid}</b></a>{prio(tag)}</span></td><td><b>{esc(to)}</b></td>'
            f'<td{" class=" + chr(34) + "table__late" + chr(34) if late else ""}>{esc(wait)}</td><td>{pend_cell(*pend)}</td>'
            f'<td><span class="table__status">{status(stx, stk)}{f"<small>{esc(sub)}</small>" if sub else ""}</span></td>'
            f'<td>{person_cell(*by)}</td><td>{person_cell(*up) if up else "<span class=" + chr(34) + "table__na" + chr(34) + ">No update yet</span>"}</td>{GO}</tr>')
PINNED_TABLE = ('<div class="table-wrap"><table class="table table--pinned"><thead><tr><th>Request</th><th>Requested to</th><th>Waiting</th><th>Pending</th><th>Status</th><th>Requested by</th><th>Last updated</th><th><span class="sr-only">Open</span></th></tr></thead><tbody>'
                + ''.join(pinned_row(*r) for r in PINNED) + '</tbody></table></div>')
PH_REQUESTS = module_page('Pharmacy', 'All pharmacies', PH_NAV, 'New request',
    f'<div class="list-head"><div><h2>Requests <small>132</small></h2><p>Medicine requests sent to a central pharmacy, and what has been shipped.</p></div><button class="btn btn--outline" type="button" data-toast="New product requests · opens in the ANTZ app">{I("plus")}New request</button></div>'
    + '<section class="list-panel"><div class="toolbar">' + tabs_with_counts([('Pending', 8), ('Shipped', None), ('Disputes', None), ('Cancelled', None), ('All', None)]) + search('Search request ID, medicine or person') + '</div>'
    + PINNED_TABLE + pagination(6, 132) + '</section>', active='All requests', period=True)
screen_page('pharmacy-requests', 'Pharmacy · requests', 'Requests in a wide table: the request column stays put while waiting, pending, status, who asked and the last update scroll under it.', 'file', 'teal', PH_REQUESTS,
            ['The table scrolls sideways; the request column stays put. The side panel becomes a strip.', 'The table scrolls sideways under the request column.', 'Side panel beside the table; it scrolls sideways under the request column.', 'Every column in view.'],
            ['Pin the column that names the record, so people keep their place while they scroll.', 'Say how long a request has waited, and mark the long waits.'], ['Squeeze a wide table to fit: let it scroll.', 'Colour a whole row to show status: use the status pill.'])

# Request detail
ITEMS = [('Meloxivet', ['Urgent', 'Rx'], 'Meloxicam 1.5 mg/ml · Bottle of 100 ml', 'Needed for wound dressing', 6, 0, 0, ('Waiting', 'caution')),
         ('Enrofloxacin 50 mg/ml', ['Rx'], 'Enrofloxacin · Vial of 50 ml', None, 4, 4, 4, ('Shipped', 'success')),
         ('Vitamin B complex', [], 'Injection · Vial of 30 ml', None, 10, 6, 6, ('Partly shipped', 'info'))]
def item_row(name, tags, sub, note, req, ful, ship, st):
    tg = ''.join(f'<span class="prio-tag">{I("alert")}Urgent</span>' if t == 'Urgent' else '<span class="prio-tag prio-tag--info">Rx</span>' for t in tags)
    return (f'<tr><td><span class="table__name">{esc(name)}{tg}</span><small class="table__sub">{esc(sub)}</small>' + (f'<span class="table__note">{I("file")}{esc(note)}</span>' if note else '') + '</td>'
            f'<td class="table__num">{req}</td><td class="table__num">{ful if ful else "<span class=" + chr(34) + "table__na" + chr(34) + ">0</span>"}</td>'
            f'<td><span class="table__progress"><small class="table__sub">{ship} of {req}</small><span class="meter" style="--v:{ship / req:.2f}"><i></i></span></span></td><td>{status(*st)}</td></tr>')
ITEMS_TABLE = ('<div class="table-wrap"><table class="table"><thead><tr><th>Medicine</th><th class="table__num">Requested</th><th class="table__num">Fulfilled</th><th>Shipped</th><th>Status</th></tr></thead><tbody>'
               + ''.join(item_row(*r) for r in ITEMS) + '</tbody></table></div>')
SHIP_TABLE = ('<div class="table-wrap"><table class="table"><thead><tr><th>Shipment</th><th>Vehicle</th><th>Driver</th><th class="table__num">Items</th></tr></thead><tbody>'
              '<tr><td><b>SHIP00002060</b><small class="table__sub">18 Aug 2026</small></td><td>KA 04 AB 8078</td><td>Ramesh P<small class="table__sub">98450 12802</small></td><td class="table__num">2 medicines</td></tr>'
              '<tr><td><b>SHIP00002011</b><small class="table__sub">02 Aug 2026</small></td><td>KA 04 AB 7731</td><td>Suresh N<small class="table__sub">98451 44120</small></td><td class="table__num">1 medicine</td></tr></tbody></table></div>')
def detail_tabs(uid, a_label, a_n, a_body, b_label, b_n, b_body):
    return (f'<div class="detail-tabs" data-tabs><div class="segmented segmented--pill" role="tablist" aria-label="Request parts">'
            f'<button type="button" role="tab" aria-selected="true" aria-controls="{uid}-a">{esc(a_label)}{count_html(a_n)}</button><button type="button" role="tab" aria-selected="false" aria-controls="{uid}-b">{esc(b_label)}{count_html(b_n)}</button></div>'
            f'<section class="list-panel" id="{uid}-a" role="tabpanel">{a_body}</section><section class="list-panel" id="{uid}-b" role="tabpanel" hidden>{b_body}</section></div>')
DETAIL_HEAD = (f'<div class="detail-head"><div><a class="detail-head__back" href="#">{I("chevron-left")}Requests</a><h2 class="detail-head__title">RES002815 {status("Partly shipped", "info")}</h2></div>'
               f'<div class="detail-head__end"><button class="btn btn--outline" type="button">Cancel request</button><button class="btn btn--outline" type="button">{I("file")}Print</button></div></div>')
DETAIL_FACTS = ('<div class="detail-facts"><div class="detail-facts__lead"><small>Requested to</small><b>Central pharmacy</b></div>'
                f'<div><small>Requested by</small>{person_cell("OW", "navy", "Ovi Wagh", "18 Aug 2026")}</div><div><small>Items</small><b>3</b></div>'
                '<div><small>Requested value</small><b>₹13,212</b></div><div><small>Shipped value</small><b>₹5,940</b></div><div><small>Waiting</small><b>85 days</b></div>'
                f'<div><small>Last updated</small>{person_cell("NR", "amber", "Neeta Rao", "18 Aug 2026")}</div></div>')
PH_REQ_DETAIL = module_page('Pharmacy', 'All pharmacies', PH_NAV, 'New request', DETAIL_HEAD + DETAIL_FACTS + detail_tabs('rq-detail', 'Requested items', 3, ITEMS_TABLE, 'Shipments', 2, SHIP_TABLE), active='All requests', period=True)
screen_page('pharmacy-request-detail', 'Pharmacy · request detail', 'One request: its tags and actions, a card of facts, then tabs for the requested medicines and the shipments.', 'file', 'teal', PH_REQ_DETAIL,
            ['Facts in two columns; the tables scroll sideways. The side panel becomes a strip.', 'Facts in four columns; the side panel stacks above.', 'Side panel beside the detail; facts in four columns.', 'Side panel beside the detail; everything in view.'],
            ['Lead with the record ID, its priority and its status.', 'Put the facts people check first in one card: who, where, how much, how long.'], ['Repeat the status in the facts card.', 'Put more than two actions in the head: use a menu.'])

# Dispense: rows open the detail sheet
def contact(ini, hue, label, name, on_strong=False, chat=True):
    k = 'icon-btn--on-strong' if on_strong else 'icon-btn--tint'
    return (f'<div class="contact{" contact--selected" if (not on_strong and chat) else ""}">{avatar(ini, hue)}<div><small>{esc(label)}</small><b>{esc(name)}</b></div>'
            + (f'<span class="contact__end"><button class="icon-btn {k} icon-btn--sm" type="button" aria-label="Call {esc(name)}">{I("phone")}</button><button class="icon-btn {k} icon-btn--sm" type="button" aria-label="Chat with {esc(name)}">{I("chat")}</button></span>' if chat else '') + '</div>')
def med_item(name, sub, qty):
    return f'<div class="item"><span class="item__media">{tile("medicine", "teal")}</span><span class="item__body"><b>{esc(name)}</b><span>{esc(sub)}</span></span><span class="item__end"><small>Qty</small><b>{qty}</b></span></div>'
def dispense_sheet(sid, did, when, frm, meds, units, by, to, for_animal, items):
    body = (f'<div class="sheet-hero"><small>From</small><b>{esc(frm)}</b><div class="glass-stats"><div class="glass-stat"><b>{meds}</b><small>medicine{"s" if meds != 1 else ""}</small></div><div class="glass-stat"><b>{units}</b><small>total quantity</small></div></div>'
            + contact(by[0], by[1], 'Dispensed by', by[2], on_strong=True) + '</div>'
            + contact(to[0], to[1], 'Dispensed to', to[2])
            + (f'<div class="contact">{tile("paw", "amber")}<div><small>Dispensed for</small><b>{esc(for_animal)}</b></div></div>' if for_animal else f'<div class="contact">{tile("paw", "green")}<div><small>Dispensed for</small><b>No animal linked</b></div></div>')
            + '<p class="t-overline">Medicines</p><div class="sheet-items">' + ''.join(med_item(*m) for m in items) + '</div>')
    return (f'<div class="drawer-backdrop" data-drawer-backdrop="{sid}" hidden></div><aside class="drawer drawer--floating" id="{sid}" role="dialog" aria-modal="true" aria-labelledby="{sid}-title" hidden>'
            f'<header class="drawer__head"><div><span class="drawer__meta">Dispense · {esc(when)}</span><h2 class="drawer__title" id="{sid}-title">{esc(did)}</h2></div><button class="icon-btn" type="button" aria-label="Close" data-drawer-close>{I("x")}</button></header>'
            f'<div class="drawer__body">{body}</div><div class="drawer__foot drawer__foot--split"><button class="btn btn--outline" type="button">{I("file")}Print slip</button><button class="btn btn--primary" type="button">Dispense again</button></div></aside>')
SHEET_DISPENSE = dispense_sheet('sheet-dispense', 'DIS578', '07 Nov 2026 · 11:11 AM', 'Hospital pharmacy', 2, 5, ('NR', 'amber', 'Neeta Rao'), ('OW', 'navy', 'Ovi Wagh'), None,
                                [('Amoxiclav', 'Amoxicillin + clavulanate 625 mg · Batch BA002', 2), ('Fenbendazole', 'Fenbendazole 150 mg · Batch BA003', 3)])
SHEET_DISPENSE_ANIMAL = dispense_sheet('sheet-dispense-2', 'DIS580', '11 Nov 2026 · 10:00 AM', 'Adirampattinam central pharmacy', 1, 1, ('NR', 'amber', 'Neeta Rao'), ('BW', 'teal', 'Bharathi W'), 'Bengal tiger · AAID 427824',
                                       [('Meloxivet', 'Meloxicam 1.5 mg/ml · Batch BA001', 1)])
def with_sheet(page, sheet_html, open_=False):
    if open_: sheet_html = sheet_html.replace(' hidden></div><aside', '></div><aside', 1).replace('aria-modal="true" aria-labelledby="sheet-dispense-title" hidden>', 'aria-modal="true" aria-labelledby="sheet-dispense-title">', 1).replace('class="drawer drawer--floating" id="sheet-dispense"', 'class="drawer drawer--floating drawer--shown" id="sheet-dispense"', 1)
    return page.replace('</div></div></div></div>', sheet_html + '</div></div></div></div>', 1)
PH_DISPENSE2 = with_sheet(PH_DISPENSE.replace('<a class="rec" href="#">', '<a class="rec" href="#" data-drawer-open="sheet-dispense">'), SHEET_DISPENSE)
screen_page('pharmacy-dispense', 'Pharmacy · dispense', 'A record list: medicines handed out, to whom, for how many animals and how many units. Select a row to open its detail sheet.', 'swap', 'teal', PH_DISPENSE2, LIST_CAPS, LIST_DO, LIST_DONT)
screen_page('pharmacy-dispense-detail', 'Pharmacy · dispense detail', 'The dispense detail in the side sheet: where it came from, who handed it out and to whom (call or chat), the animal it was for and the medicines.', 'swap', 'teal',
            with_sheet(PH_DISPENSE, SHEET_DISPENSE, open_=True),
            ['The sheet covers the screen; close it to get back to the list.', 'The sheet floats over the list.', 'The sheet floats over the list, beside the side panel.', 'The sheet floats at the right; the list stays in view.'],
            ['Lead the sheet with where the medicines came from and the figures.', 'Let people call or chat with the people named.'], ['Put editing in the detail sheet: open a form.', 'Show more than two actions at the foot.'])
add_link('Screens', 'screen-pharmacy-request-detail.html', 'Pharmacy · request detail', 'screen-pharmacy-requests.html')
add_link('Screens', 'screen-pharmacy-dispense-detail.html', 'Pharmacy · dispense detail', 'screen-pharmacy-dispense.html')

# Component page: Record detail (Pattern components)
rd_sheets = (f'<div class="cell"><button class="btn btn--outline" type="button" data-drawer-open="sheet-dispense">{I("swap")}Open a dispense (no animal)</button> '
             f'<button class="btn btn--outline" type="button" data-drawer-open="sheet-dispense-2">{I("paw")}Open a dispense for an animal</button></div>' + SHEET_DISPENSE + SHEET_DISPENSE_ANIMAL)
write_doc('record-detail', {'title': 'Record detail', 'group': 'Pattern components', 'intro': 'What opens from a record list: the detail page (head, facts, tabbed tables) and the detail side sheet (hero card, contacts with call and chat, the items).', 'icon': 'file', 'hue': 'teal'},
          doc('rd-head', 'Detail head and facts', 'The <b>detail head</b> has a back link to the list, the record ID with its priority and status, and at most two actions. The <b>facts card</b> puts what people check first in one place: the lead fact large across two columns, then people, figures and dates.', frame(DETAIL_HEAD + DETAIL_FACTS))
          + doc('rd-tabs', 'Tabbed tables', 'Tabs with counts switch between the parts of a record (<code>data-tabs</code>): the requested medicines with tags, a note and shipped progress, and the shipments with vehicle and driver.', frame(detail_tabs('rd-doc', 'Requested items', 3, ITEMS_TABLE, 'Shipments', 2, SHIP_TABLE)))
          + doc('rd-sheet', 'Detail side sheet', 'Open both. The <b>hero card</b> (green gradient) says where it came from, with glass figures and the person who handed it out. <b>Contact rows</b> carry call and chat buttons. The animal it was for, or <b>No animal linked</b>. Then the items with their quantities, and two actions at the foot.', rd_sheets, canvas=False),
          usage('rd-usage', 'Record detail', ['Open a page for records people work on; a side sheet for records people check.', 'Keep at most two actions in the head or the foot.'], ['Repeat the status in the facts.', 'Edit in the detail: open a form.']),
          code('rd-code', 'Record detail', ['.detail-head', '.detail-head__back', '.detail-head__title', '.detail-head__end', '.detail-facts', '.detail-facts__lead', '[data-tabs]', '.detail-tabs', '.table__name', '.table__note', '.table__progress', '.sheet-hero', '.glass-stats', '.contact', '.contact--selected', '.contact__end', '.sheet-items', '.drawer__foot--split'],
               '<div class="detail-head">…</div>\n<div class="detail-facts"><div class="detail-facts__lead"><small>Requested to</small><b>Central pharmacy</b></div>…</div>'))
add_link('Pattern components', 'record-detail.html', 'Record detail', 'module-bar.html')

# The pinned table on the Table page
PIN_DOC = ('<div class="doc" id="table-pinned"><h3>Wide, with a pinned first column</h3><p class="lead">When a table has more columns than fit, let it scroll sideways and <b>pin the first column</b> (<code>table--pinned</code>): the record ID stays put and the other columns slide under it, with a soft shadow at its edge once you scroll. Cells can carry progress (<code>table__progress</code>), a status with a note, people (<code>table__person</code>) and long waits (<code>table__late</code>).</p>'
           '<div class="demo demo--col">' + PINNED_TABLE + '</div></div>')
put_section('pages/table.html', '<!--table-pinned-->', '<!--/table-pinned-->', PIN_DOC, '<!--table-styles-->')
print('pharmacy app ok')

# Component page: module home pieces (Pattern components)
mh_demo = (frame('<div class="board">' + band_hero('navy', 'Waiting for necropsy · all centres', '67', 'carcasses received · 27 high priority', glass_btn('Start the next one'), cls='board__full') + '</div>')
           + frame('<div class="board">' + band_hero('ink', 'Population change · every site', '+527', 'net change in animals', '<div class="net-split"><div><b>+840</b><small>came in</small></div><div><b>−313</b><small>went out</small></div></div>', cls='board__full') + '</div>')
           + frame('<div class="board">' + band_hero('lagoon', 'Users · every site', '273', 'people with an account · 11 roles', stack, cls='board__full') + '</div>')
           + frame('<div class="board">' + band_hero('wine', 'Fetal deaths · this year', '38', 'reported across all sites', glass_btn('Report one'), cls='board__full') + '</div>')
           + frame('<div class="board">' + band_hero('bronze', 'Lab requests · all labs', '214', 'samples waiting for results', glass_btn('Open the queue', bright=True), cls='board__full') + '</div>')
           + frame('<div class="board">' + banner_hero('fur.webp', 'Medical · animal health', 'Care for every animal, every day.', 'Live counts across all 10 sites', [('2,904', 'Animals sick'), ('160', 'Species')]) + '</div>')
           + frame('<div class="class-cards">' + ''.join(class_card(*c) for c in CLASSES[:3]) + '</div>')
           + frame(f'<div class="date-scroller"><button class="icon-btn icon-btn--ghost" type="button" aria-label="Previous week">{I("chevron-left")}</button><button class="pick" type="button">{I("calendar")}Nov 2026{I("chevron-down")}</button>{days}<button class="icon-btn icon-btn--ghost" type="button" aria-label="Next week">{I("chevron-right")}</button></div>')
           + frame(f'<div class="range-bar">{seg(["Day", "Week", "Month"], sel=-1, label="Granularity")}<span class="range-bar__range">11 May 2026 – today</span><button class="pick pick--site" type="button">{I("calendar")}Last 6 months{I("chevron-down")}</button></div>')
           + frame('<div class="rec-list card-rows">' + appr_row('INT-03413', 'Inter-site · 1 animal', 'Adirampattinam', 'Cholapuram', 'Kunal Singh', '06 Aug 2026 · 12:20') + '</div>')
           + frame('<div class="board">' + widget('butter', 'zap', 'Favourites', '7', '3 animals · 4 enclosures') + widget('', 'trash', 'Egg discard', '3', 'waiting for a check', pill='Needs a security check', dot='caution') + widget('mint', 'zap', 'Natality', '589', 'births', extra=delta('12%')) + widget('', 'paw', 'Arrivals', '86', 'animals came in this month', extra=delta('8%', down=True)) + '</div>'))
write_doc('module-homes', {'title': 'Module homes', 'group': 'Pattern components', 'intro': 'The pieces every module home is built from: the band hero, the banner hero, class cards, the date scroller, the range bar, review rows with a route, deltas and the butter and maroon fills.', 'icon': 'grid', 'hue': 'navy'},
          doc('mh-demo', 'Heroes and pieces', 'A module home starts with one hero. The <b>band hero</b> is a dark band with rings, a live overline and one big figure, in the module\'s tone: <b>lagoon</b> (the default), <b>navy</b>, <b>ink</b>, <b>wine</b> or <b>bronze</b>. Its right side takes a glass button (or the <b>bright</b> one, for the main action), a came-in and went-out split or an avatar stack. <b>Deltas</b> point up or down. The <b>banner hero</b> is a photo with a big title and glass figures. Then come the widgets, lists and the module\'s own pieces.', mh_demo),
          usage('mh-usage', 'Module homes', ['One hero per module home, then widgets, then lists.', 'Put the trend next to the figure it qualifies: green up, red down.', 'Keep butter and maroon for identity, like peach.'], ['Use a band tone to signal status.', 'Stack two heroes.']),
          code('mh-code', 'Module homes', ['.band-hero', '.band-hero--lagoon', '.band-hero--navy', '.band-hero--ink', '.band-hero--wine', '.band-hero--bronze', '.band-hero--maroon', '.band-hero--deep', '.band-hero--petrol', '.overline-live', '.band-hero__figure', '.net-split', '.glass-btn', '.glass-btn--bright', '.hero-photo--banner', '.class-cards', '.class-card', '.date-scroller', '.range-bar', '.section-head', '.pick--outline', '.route', '.btn--review', '.card-rows', '.delta', '.delta--down', '.widget--butter', '.widget--maroon'],
               band_hero('navy', 'Waiting for necropsy', '67', 'carcasses received', glass_btn('Start the next one'))))
# Component page: side sheet forms and in-app toast (Components)
sf_demo = ('<div class="cell">' + f'<button class="btn btn--primary" type="button" data-drawer-open="sheet-tag">{I("plus")}New tag</button> <button class="btn btn--outline" type="button" data-drawer-open="sheet-fetal">Report fetal death</button> <button class="btn btn--outline" type="button" data-drawer-open="sheet-folder">New folder</button> <button class="btn btn--outline" type="button" data-toast="New lab request · opens in the ANTZ app">Show the in-app toast</button></div>'
           + SHEET_TAG + SHEET_FETAL + SHEET_FOLDER)
write_doc('sheet-forms', {'title': 'Side sheet forms', 'group': 'Components', 'intro': 'Short create forms in the floating side sheet: New tag, Report fetal death with a scan button, New folder. And the toast for actions that open in the ANTZ mobile app.', 'icon': 'file', 'hue': 'teal'},
          doc('sf-demo', 'Forms and the in-app toast', 'Open each sheet. The main button stays disabled until the form is ready. Pickers that can be scanned sit beside a <b>scan button</b>. When an action only exists in the mobile app, a <b>toast</b> says so instead of opening an empty screen.', sf_demo, canvas=False),
          usage('sf-usage', 'Side sheet forms', ['Keep one main button at the foot, full width.', 'Show a preview when the result is visual (a tag).'], ['Open a sheet for an action that only works in the app: show the toast.']),
          code('sf-code', 'Side sheet forms', ['.drawer', '.drawer--floating', '.pick-scan', '.tag-preview', '.filter-panel', '.chip[role="radio"]', '[data-toast]', '.toast-anchor'],
               '<button class="btn btn--primary" type="button" data-drawer-open="sheet-tag">New tag</button>\n<aside class="drawer drawer--floating" id="sheet-tag" role="dialog" aria-modal="true" hidden>…</aside>'))
add_link('Pattern components', 'module-homes.html', 'Module homes', 'role-homes.html')
add_link('Components', 'sheet-forms.html', 'Side sheet forms', 'side-sheets.html')
open(nav_p, 'w').write(json.dumps(nav, indent=2, ensure_ascii=False) + '\n')
print('module homes ok')

# ═══ Gallery pages for the DD-005 pieces (until now only inside screens) ════
def extract(html_text, start_marker):
    """The element that starts at start_marker, to its matching close (div or aside)."""
    i = html_text.index(start_marker)
    tag = re.match(r'<(\w+)', html_text[i:]).group(1)
    depth, j = 0, i
    for m in re.finditer(rf'<(/?){tag}\b[^>]*>', html_text[i:]):
        depth += -1 if m.group(1) else 1
        if depth == 0: return html_text[i:i + m.end()]
    raise ValueError(start_marker)
home_tpl = re.search(r'<template>(.*?)</template>', open('pages/screen-home.html').read(), re.S).group(1)
DLG_WIDGETS = extract(home_tpl, '<div class="dialog-backdrop" id="add-widgets"')
DLG_MODULES = extract(home_tpl, '<div class="dialog-backdrop" id="all-modules"')

# 1. Widget board (Pattern components)
wb_board = ('<div class="board" id="doc-board">'
            + widget('sky', 'paw', 'Sky', '643', 'figure on the sky fill', remove=True)
            + widget('teal', 'clock', 'Teal', '58', 'figure on the teal fill', remove=True, pill='16 pending', dot='warning')
            + widget('mint', 'home', 'Mint', '111.2K', 'figure on the mint fill', remove=True, pill='9 sites', dot='success')
            + widget('navy', 'swap', 'Navy', '1,284', 'figure on the navy fill', remove=True, pill='41 in transit', dot='info')
            + widget('ink', 'heart', 'Ink', '192', 'warm figure on ink', remove=True)
            + widget('peach', 'zap', 'Peach', '40', 'identity only, never status', remove=True)
            + widget('butter', 'zap', 'Butter', '7', 'identity only, never status', remove=True)
            + widget('glow', 'package', 'Glow', '696', 'a soft corner glow', remove=True)
            + widget('', 'search', 'Plain with a status pill', '140', 'bad news uses the pill, not the fill', remove=True, pill='9 reported this week', dot='danger')
            + f'<article class="widget widget--maroon widget--hero board__wide"><div class="widget__head"><span class="tag tag--glass">Hero widget · maroon</span><span class="widget__spacer"></span><a class="widget__go" href="#" aria-label="Open">{I("arrow-up-right")}</a></div><span class="widget__spacer"></span><b class="widget__figure">2,600</b><span class="widget__caption">one big figure, a period and a glass button</span><a class="widget__glass-btn" href="#">View causes{I("arrow-right")}</a></article>'
            + '</div>')
wb_bar = board_bar('doc-board', 'All sites', ['Animals', 'Housing', 'Mortality', 'Eggs', 'Medical', 'Hospital', 'Pharmacy', 'Lab'])
wb_bar = wb_bar.replace('aria-label="Add widget" data-hide-editing', 'aria-label="Add widget" data-dialog-open="add-widgets" data-hide-editing', 1)
wb_four = ('<div class="board board--4">' + widget('', 'clock', 'Pending', '12', 'doses still to give', pill='4 overdue', dot='warning')
           + widget('', 'check', 'Administered', '31', 'doses given today') + widget('', 'calendar', 'Skipped', '2', 'with a reason')
           + widget('', 'alert', 'Missed', '1', 'no reason given', pill='Needs a follow-up', dot='danger') + '</div>')
ACCOUNT_POP = extract(home_tpl, '<div class="popover popover--end" id="account-pop"').replace('id="account-pop"', 'id="doc-account-pop"', 1)
MENU_FILTER = (extract(home_tpl, '<div class="filter-panel popover__panel" id="menu-filter"')
               .replace(' id="menu-filter" hidden', '', 1).replace(' data-toggle="menu-filter"', ''))
wb_menus = ('<div class="cell demo-cell--pop-lg"><div class="hd-row">'
            + '<span class="pop-anchor"><button class="pick" type="button" aria-haspopup="true" aria-expanded="false" data-popover="doc-filter-pop">' + I('sliders') + 'Filter and sort modules' + I('chevron-down') + '</button>'
            + '<div class="popover" id="doc-filter-pop" hidden>' + MENU_FILTER + '</div></span> '
            + '<span class="pop-anchor"><button class="round-btn" type="button" aria-label="Account menu" aria-haspopup="menu" aria-expanded="false" data-popover="doc-account-pop"><span class="avatar" style="--av-bg:var(--hue-amber-soft);--av-fg:var(--hue-amber-ink)">AR</span></button>' + ACCOUNT_POP + '</span>'
            + '</div></div>')
wb_dock = frame('<div class="split__col"><section class="card"><b class="card__title">The main column</b><p class="t-small t-secondary">On tablets and desktops the quick actions dock floats centred under the main column. On phones the tab bar takes its place.</p></section>'
                + f'<div class="dock dock--center"><button class="btn btn--secondary btn--sm" type="button">{I("grid")}Quick actions</button></div></div>')
wb_side = (today_card([('syringe', 'Deworming', 'Administer', '319'), ('syringe', 'Vaccinations', 'Administer', '143')], 3, 3) + notes_card()
           + f'<section class="card"><b class="card__title">Carousel dots</b><span class="dots" aria-hidden="true"><i class="is-on"></i><i></i><i></i><i></i></span></section>')
write_doc('widget-board', {'title': 'Widget board', 'group': 'Pattern components', 'intro': 'The home board people arrange themselves: the board bar, every widget fill with pills and remove badges, the hero widget, the Add widgets gallery, All modules, Today, task rows and notes.', 'icon': 'dashboard', 'hue': 'green'},
          doc('wb-bar', 'Board bar', 'Menu (large module tiles with a pin on hover), the site picker, <b>+</b> to add widgets and the pencil to edit. Editing shows a remove badge on each widget, with Undo changes and Done.', frame(wb_bar))
          + doc('wb-fills', 'Widget fills, pills and the hero widget', 'Fills mark identity: <b>sky, teal, mint, navy, ink, peach, butter, glow</b> or plain. Status always goes in a <b>pill</b> with a status dot, never in the fill. The <b>hero widget</b> takes one big figure across two columns.', frame(wb_board))
          + doc('wb-dialogs', 'Add widgets and All modules', 'Open the two dialogs. <b>Add widgets</b>: categories, search, Default view, previews marked On board, then step 2 to choose a style and size. <b>All modules</b>: categories, the A to Z list and the chosen module\'s screens with counts.',
                f'<div class="cell"><button class="btn btn--primary" type="button" data-dialog-open="add-widgets">{I("plus")}Add widgets</button> <button class="btn btn--outline" type="button" data-dialog-open="all-modules">{I("grid")}All modules</button></div>' + DLG_WIDGETS + DLG_MODULES, canvas=False)
          + doc('wb-four', 'Four columns', 'A <b>four-column board</b> (<code>board--4</code>) for modules with four equal counts, like Administer. It shows four columns from 1024px wide, two on tablets (as in this frame, which is narrower than a desktop) and one on phones. Status still goes in the pill.', frame(wb_four))
          + doc('wb-menus', 'Menu filter and account menu', 'Open both: the filter sits in the board menu, the account menu at the right end of the header. The board menu\'s <b>filter panel</b> (<code>popover__panel</code>) has single-choice chips for Show, Category and Sort, and a <b>foot</b> with Clear all and a counted Show button. The <b>account menu</b> starts with a flat summary of the person\'s access (<code>gallery__default--flat</code>).', wb_menus, canvas=False)
          + doc('wb-dock', 'Quick actions dock', 'The <b>dock</b> holds the quick actions. <code>dock--center</code> centres it under the main column.', wb_dock)
          + doc('wb-side', 'Today, task rows, notes and dots', 'The side column: Today with Overdue and Due today tabs and <b>task rows</b>, <b>observation notes</b> with a dot per kind, and carousel <b>dots</b>.', frame(wb_side).replace('class="shell-host demo-frame"', 'class="shell-host demo-frame demo-frame--narrow"', 1)),
          usage('wb-usage', 'Widget board', ['Let people add, remove and restyle widgets; undo before Done.', 'Use one hero widget at most.'], ['Use a fill to mean status.', 'Put forms on the board: use the work drawer.']),
          code('wb-code', 'Widget board', ['.board', '.board--2', '.board--4', '.popover__panel', '.filter-panel__foot', '.gallery__default--flat', '.dock', '.dock--center', '.board__wide', '.board__full', '.board-bar', '.menu-btn', '.round-btn', '.popover--menu', '.module-tiles', '.module-tile', '.module-tile__pin', '.widget--sky|teal|mint|navy|ink|peach|butter|glow|maroon', '.widget__pill', '.widget--hero', '.widget__glass-btn', '.widget__remove', '.is-editing', '.dialog--wide', '.gallery', '.gallery__item', '.gallery__default', '.widget-styles', '.modules-dialog', '.task-row', '.notes', '.dots', '[data-board-edit]', '[data-board-undo]', '[data-gallery-pick]', '[data-dialog-open]'],
               widget('navy', 'swap', 'Transfers', '1,284', 'moved this year', pill='41 in transit', dot='info')))

# 2. Module bar and side panel (Pattern components)
mb_demo = (frame('<div class="modhome">' + modbar('Pharmacy', 'All sites', period=True)
                 + '<div class="modhome__body">' + modnav('Pharmacy', PH_NAV, 'New request', active='All requests') + '<main class="modhome__main"><div class="section-head"><b>Section head</b><span class="section-head__end">'
                   + f'<button class="pick pick--outline" type="button">{I("calendar")}Last 7 days{I("chevron-down")}</button><button class="pick pick--outline" type="button">{I("filter")}Active records{I("chevron-down")}</button></span></div>'
                   + '<p class="t-small t-secondary">Select the menu button at the top of the panel to fold it to icons. On phones the panel becomes a strip that scrolls sideways.</p></main></div></div>'))
write_doc('module-bar', {'title': 'Module bar and side panel', 'group': 'Pattern components', 'intro': 'Every module page starts with the module bar (back, module switcher, breadcrumb, site and period pickers) and the module side panel (module home, pages with counts, sub-pages, one main action).', 'icon': 'menu', 'hue': 'teal'},
          doc('mb-demo', 'Module bar and side panel', 'The <b>module home</b> (<code>modhome</code>) stacks the module bar over the body: the side panel and the main column. The <b>module switcher</b> opens a grid of every module. The <b>breadcrumb</b> shows on desktop. The <b>side panel</b> groups pages under overline headings, shows counts (danger counts in red), opens sub-pages and folds to icons. A <b>section head</b> puts pickers beside a title.', mb_demo)
          + doc('mb-soft', 'Soft side panel', 'Add <code>modnav--soft</code> for a quieter panel: the <b>overview tile</b> keeps its tint but drops the outline, and the <b>active page\'s count</b> turns brand green (<code>--color-accent-text</code>). The default panel stays as it is; use one style per product.',
                frame('<div class="modhome"><div class="modhome__body">' + modnav('Animals', AN_NAV, 'Add animal', active='Recently added', soft=True) + '<main class="modhome__main"><p class="t-small t-secondary">Main column</p></main></div></div>'))
          + doc('mb-options', 'Module bar options', 'Options for a lighter bar, used together on the <b>Recently added</b> screen (Animals): drop the <b>breadcrumb</b>, mark unread notifications with the <b>unread dot</b> (<code>icon-btn__dot</code>, as in the app bar; keep the count in the <code>aria-label</code>), show the person\'s <b>photo</b> in the avatar, and give the module switcher a <b>brighter tile</b> (the module\'s hue instead of its ink). <b>Known issue:</b> in dark and high-contrast dark, solid tiles (this one and the default) show a white icon on a light hue below 3:1; a fix for every solid tile is pending.',
                frame('<div class="modhome">' + modbar('Animals', 'All sites', crumbs=False, bell_dot=True, avatar_img='species/portrait.webp', switch_tone='vivid') + '</div>'))
          + doc('mb-layout', 'Tinted panel and tablet strip', 'Two layout options for list pages. <code>modhome--tinted</code> sets the main column on the canvas tint (<code>--color-bg-canvas</code>) so a white <b>list panel</b> stands off it. <code>modhome--strip</code> turns the side panel into rows above the list on tablets (600 to 840px wide): the overview tile first, then the pages with their counts. Phones always show the strip. Resize the frame or open the <b>Recently added</b> screen to see both.',
                frame(module_page('Animals', 'All sites', AN_NAV, 'Add animal', '<section class="list-panel"><p class="t-small t-secondary" style="padding: var(--space-4)">List panel</p></section>', active='Recently added', nav={'soft': True}, strip=True, tinted=True), '820px'))
          + doc('mb-groups', 'Groups without headings, no main action', 'Pass <code>-</code> as a group\'s heading for a line instead of a title (<code>modnav__divider</code>), for long panels like a site\'s pages. A panel for browsing only can leave out the main action. On phones and in the tablet strip the lines are hidden.',
                frame('<div class="modhome"><div class="modhome__body">' + modnav('Housing', [('-', [('pin', 'green', 'Sites', '341'), ('grid', 'teal', 'Clusters', '8')]), ('-', [('grid', 'green', 'Sections', '15'), ('home', 'green', 'Enclosures', '104'), ('paw', 'green', 'Animals', '9,044')])], None, active='Sections', soft=True) + '<main class="modhome__main"><p class="t-small t-secondary">Main column</p></main></div></div>')),
          usage('mb-usage', 'Module bar and side panel', ['Keep one main action at the foot of the panel.', 'Group pages by task: Daily work, Shipments, Stock.'], ['Nest deeper than one level of sub-pages.', 'Hide the panel on phones: it becomes a strip.']),
          code('mb-code', 'Module bar and side panel', ['.modbar', '.modbar__end', '.module-switch', '.crumbs', '.pick', '.pick--site', '.pick--outline', '.modnav', '.modnav__fold', '.modnav__label', '.modnav__item', '.modnav__sub', '.modnav.is-folded', '.modhome', '.modhome--tinted', '.modhome--strip', '.modhome__body', '.modhome__main', '.modnav--soft', '.modnav__divider', '.icon-btn__dot', '.section-head', '[data-modnav-fold]'],
               '<header class="modbar">…</header>\n<div class="modhome__body"><nav class="modnav">…</nav><main class="modhome__main">…</main></div>'))

# 2b. Browse panel (Pattern components, DD-008)
bp_cards = '<div class="browse__grid">' + ''.join(enclosure_card(*a) for a in AVIARIES[:4]) + '</div>'
bp_fig = (f'<div class="cell">{figures([("100", "Animals"), ("1", "Species"), ("Ravi", "Keeper")])}</div><div class="cell">{contact_pill("Ravi Kumar")}</div>'
          f'<div class="cell"><section class="hero-photo hero-photo--site"><img class="hero-photo__img" src="{B}elephant.webp" alt=""><div>{contact_pill("Kunal Singh", glass=True)}</div>'
          f'{figures([("35", "Species"), ("9,044", "Animals"), ("15", "Sections"), ("104", "Enclosures")], glass=True)}</section></div>')
write_doc('browse-panel', {'title': 'Browse panel', 'group': 'Pattern components', 'intro': 'Look through a site\'s sections and their enclosures in one panel: the section list beside the chosen section\'s enclosure cards, with its figures, the person in charge and a search.', 'icon': 'grid', 'hue': 'green'},
          doc('bp-demo', 'Browse panel', 'The <b>list pane</b> holds the sections with a photo (or a tile), their enclosures and a count; the chosen one is outlined (<code>row is-selected</code>). The <b>main pane</b> has the section\'s title and figures, the <b>person in charge</b>, a search, the <b>enclosure cards</b> and a foot with how many are shown and a View all button. Below 840px the panes stack.',
              frame(browse(SECTIONS, 15, 'Aviary section', '52 enclosures · 8,670 animals · 25 species', 'Ravi Kumar', [enclosure_card(*a) for a in AVIARIES], 12, 52)))
          + doc('bp-cards', 'Enclosure cards', 'A variant of the card (<code>card--enclosure</code>): the name and a chevron, the <b>species</b> as overlapping photos, the animals and species counts, and a <b>status pill</b> when something needs doing (Inspection due, 1 under treatment). The whole card is a link that opens the enclosure.', bp_cards, canvas=False)
          + doc('bp-figures', 'Figures panel and compact contact', 'The <b>figures panel</b> (<code>figures</code>) sets two to four figures in one panel with dividers; a figure can be a name (Ravi, Keeper). On a photo use <code>figures--glass</code>; <code>record-hero__stats</code> is an alias of it, kept for existing record heroes. The <b>compact contact</b> (<code>contact--pill</code>, <code>contact--glass</code> on photos) is the person in charge with call and chat; each button names the person.', bp_fig, canvas=False),
          usage('bp-usage', 'Browse panel', ['Show the chosen section in the list and in the main pane title.', 'Say how many are shown and offer View all.'], ['Put more than four figures in one panel.', 'Use colour alone for a status: the pill has words.']),
          code('bp-code', 'Browse panel', ['.browse', '.browse__list', '.browse__thumb', '.browse__count', '.browse__main', '.browse__head', '.browse__grid', '.browse__foot', '.card--enclosure', '.card__figure', '.figures', '.figures--glass', '.record-hero__stats (alias)', '.contact--pill', '.contact--glass'],
               enclosure_card(*AVIARIES[2])))

# ═══ Housing · site: the site overview with the browse panel and the enclosure sheet (DD-008) ═══
def sheet_animal(aaid, sex, name='Sarus crane', sci='Antigone antigone', img='sarus-crane'):
    cls, word = SEX[sex]
    left = f'<span class="item__media"><img src="{SP}{img}.webp" alt="{esc(name)}"><span class="sex-tag{cls}" title="{word}">{sex}<span class="sr-only"> ({word})</span></span></span>'
    return item(left, f'AAID: {aaid}', name, sci)
ENC_ANIMALS = [('421063', 'M'), ('421194', 'F'), ('421325', 'UD'), ('421456', 'F'), ('421587', 'M'), ('421718', 'M'), ('421849', 'ID'), ('421980', 'F')]
def enclosure_sheet(sid='sheet-enclosure', inline=False):
    body = (figures([('100', 'Animals'), ('1', 'Species'), ('Ravi', 'Keeper')]) + status('Inspection due', 'caution')
            + '<div class="section-head"><b>Animals here</b><span class="t-small t-secondary">8 of 100</span></div><div class="list">' + ''.join(sheet_animal(*a) for a in ENC_ANIMALS) + '</div>')
    head = (f'<header class="drawer__head"><div><span class="drawer__meta">Adirampattinam › Aviary section</span><h2 class="drawer__title" id="{sid}-title">Aviary 10</h2></div>'
            f'<button class="icon-btn" type="button" aria-label="Close" data-drawer-close>{I("x")}</button></header>')
    foot = f'<div class="drawer__foot drawer__foot--split"><button class="btn btn--outline" type="button">{I("swap")}Move animals</button><button class="btn btn--primary" type="button">{I("plus")}Add animal</button></div>'
    if inline: return f'<aside class="drawer drawer--floating drawer--inline" id="{sid}" role="dialog" aria-modal="false" aria-labelledby="{sid}-title">{head}<div class="drawer__body">{body}</div>{foot}</aside>'
    return (f'<div class="drawer-backdrop" data-drawer-backdrop="{sid}" hidden></div><aside class="drawer drawer--floating" id="{sid}" role="dialog" aria-modal="true" aria-labelledby="{sid}-title" hidden>'
            f'{head}<div class="drawer__body">{body}</div>{foot}</aside>')
HS_NAV = [('-', [('pin', 'green', 'Sites', '341'), ('grid', 'teal', 'Clusters', '8')]),
          ('-', [('grid', 'green', 'Sections', '15'), ('home', 'green', 'Enclosures', '104'), ('paw', 'green', 'Animals', '9,044'), ('tag', 'teal', 'Species', '35'),
                 ('heart', 'coral', 'Under treatment', '8'), ('clipboard', 'coral', 'Hospitalized', '5'), ('alert', 'navy', 'Mortality', '4')]),
          ('-', [('treatment', 'green', 'Medical', ''), ('file', 'teal', 'Assessment', '10'), ('truck', 'amber', 'Hospital transfer', '27'), ('trash', 'coral', 'Food wastage', '')]),
          ('-', [('swap', 'navy', 'Animal transfers', '91'), ('file', 'amber', 'Notes', '4'), ('image', 'sky', 'Media', '11'), ('tag', 'teal', 'Tags', '8')]),
          ('-', [('users', 'navy', 'Teams', ''), ('user', 'sky', 'Users', '7'), ('zap', 'amber', 'Incharges', '3')]),
          ('-', [('settings', 'navy', 'Config', '')])]
def person_row(ini, hue, name, role):
    btns = (f'<button class="icon-btn icon-btn--sm icon-btn--tint" type="button" aria-label="Call {esc(name)}">{I("phone")}</button>'
            f'<button class="icon-btn icon-btn--sm icon-btn--tint" type="button" aria-label="Message {esc(name)}">{I("chat")}</button>')
    return item(avatar(ini, hue).replace('avatar avatar--sm', 'avatar'), name, role, end=f'<span class="contact__end">{btns}</span>', chevron=False)
HS_CARDS = [enclosure_card(*a, attrs=' data-drawer-open="sheet-enclosure"' if a[0] == 'Aviary 10' else '') for a in AVIARIES]
HS_MAIN = (hero_site('leopard.webp', 'All sites', 'Site', 'Adirampattinam', 'Kunal Singh', 'Aggressive', [('35', 'Species'), ('9,044', 'Animals'), ('15', 'Sections'), ('104', 'Enclosures')])
           + '<div class="board board--4">' + widget('peach', 'heart', 'Under treatment', '8', 'animals on treatment') + widget('', 'clipboard', 'Hospitalized', '5', 'in a hospital now')
           + widget('mint', 'truck', 'Hospital transfers', '27', 'waiting to go') + widget('', 'alert', 'Mortality', '4', 'deaths in 30 days') + '</div>'
           + browse(SECTIONS, 15, 'Aviary section', '52 enclosures · 8,670 animals · 25 species', 'Ravi Kumar', HS_CARDS, 12, 52)
           + '<div class="board board--2">' + list_card('People in charge', '<div class="list list--bare">' + person_row('KS', 'teal', 'Kunal Singh', 'Site in charge') + person_row('NR', 'sky', 'Neeta Rao', 'Super admin') + person_row('MI', 'green', 'Meera Iyer', 'Site manager') + '</div>')
           + list_card('Recent activity', acts([('swap', 'green', 'INH-03531 completed', '1 animal moved to A-3 · 6 Oct'), ('truck', 'amber', 'Hospital transfer requested', 'HT38-00657 · by Sourav'),
                                                ('file', 'amber', 'Note posted · Electrical', 'Adirampattinam · Neeta Rao'), ('clipboard', 'teal', 'Cave reconstruction assessed', 'Score 12 · 6 Aug')])) + '</div>')
HOUSING_SITE = with_sheet(module_page('Housing', 'Adirampattinam', HS_NAV, None, HS_MAIN, bar={'crumbs': False, 'bell_dot': True, 'avatar_img': 'species/portrait.webp'}, nav={'soft': True}, strip=True, tinted=True), enclosure_sheet())
screen_page('housing-site', 'Housing · site', 'One site\'s overview: the site hero with its person in charge and figures, what needs attention, the browse panel (sections beside their enclosures), people in charge and recent activity. Select Aviary 10 to open the enclosure sheet.', 'home', 'green', HOUSING_SITE,
            ['The side panel becomes a strip; widgets, the browse panel\'s panes and the lists stack.', 'The side panel is a strip above; two widgets per row; the browse panel\'s panes stack.', 'Side panel beside the content; the browse panel shows both panes.', 'Side panel beside the content; four widgets in a row; three enclosure cards per row.'],
            ['Show the chosen section in the list and in the main pane.', 'Open an enclosure in the side sheet; keep the panel visible beside it.'], ['Put more than four figures in the hero.', 'Use the brand green to show a status.'])
add_link('Screens', 'screen-housing-site.html', 'Housing · site', 'screen-housing.html')
# ═══ Tags screens (DD-009): Tags · public and Animal · tags ════════════════
screen_page('tags-public', 'Tags · public', 'Public tags and their categories. Select a category to see its tags, who made it and how many records carry them; New tag and New category open side sheets.', 'globe', 'teal', TAGS_PUBLIC, MOD_CAPS,
            ['Group public tags by category; keep General as the fallback.', 'Hide New tag and New category from people without tag permissions.'], ['Give each category its own colour.', 'Delete a category without saying where its tags go.'])
add_link('Screens', 'screen-tags-public.html', 'Tags · public', 'screen-tags.html')
AT_HERO = (f'<section class="hero-photo hero-photo--site"><img class="hero-photo__img" src="{B}tiger.webp" alt="">'
           f'<div><a class="hero-photo__back" href="#">{I("chevron-left")}Animals</a><span class="hero-photo__overline">AAID 000482 · Local ID BT-07 · Male</span><h2 class="hero-photo__title">Sheru</h2><p class="hero-photo__sub">Bengal tiger · Panthera tigris tigris · Tiger enclosure 2</p></div>'
           + tag_strip([tag_chip('Check weight Friday', 'high', private=True, attrs=INFO), tag_chip('Ask vet about limp', 'normal', private=True, attrs=INFO),
                        tag_chip('Night shift watch', 'critical', private=True, by=('KR', 'Kavya Rao'), attrs=INFO), tag_chip('Quarantine', 'critical', attrs=INFO)], 5, 9) + '</section>')
AT_TABS = ('<div class="tag-tabs">' + line_tabs(['Overview', 'Taxonomy', 'Notes', 'Journal', 'Medical', 'Media', 'Identifier', 'History', 'Incidents', 'Diet', 'Incharges', 'Tags', 'Training'], sel=11, label='Animal record') + '</div>')
AT_MAIN = (AT_HERO + AT_TABS
    + '<div class="list-head"><div><h2>Tags <small>9</small></h2><p>Public tags everyone sees, and private ones only their author sees unless shared.</p></div>'
    + f'<button class="btn btn--primary" type="button" data-drawer-open="sheet-add-tag">{I("plus")}Add private tag</button></div>'
    + '<section class="list-panel"><div class="toolbar">' + tabs_with_counts([('Public tags', 6), ('Private tags', 3)], sel=1, label='Tag type') + tg_toolbar('at-date', history=True) + '</div>'
    + '<div class="tag-groups">' + tag_group('My tags', [tag_chip('Ask vet about limp', 'normal', private=True, attrs=INFO), tag_chip('Check weight Friday', 'high', private=True, attrs=INFO)])
    + tag_group('Tags by others', [tag_chip('Night shift watch', 'critical', private=True, by=('KR', 'Kavya Rao'), attrs=INFO)]) + '</div></section>')
ANIMAL_TAGS = with_sheet(module_page('Animals', 'All sites', AN_NAV, None, AT_MAIN, active='All animals', nav={'soft': True}),
                         sheet_add_tag(private=True) + sheet_tag_info() + sheet_tag_history() + sheet_tag_filter())
screen_page('animal-tags', 'Animal · tags', 'An animal record on its Tags tab: the tag strip in the hero (latest four and +5), public and private tags with counts, my tags and tags by others, search, date, filter and history. Add private tag opens the side sheet.', 'tag', 'green', ANIMAL_TAGS, MOD_CAPS,
            ['Show the latest four tags in the hero and the rest in the Tags tab.', 'Add and edit tags in the side sheet, with the priority picker.', 'Show who added a private tag that is not yours.'],
            ['Show priority by colour alone.', 'Put a second filled button in the tab: the side panel has none here.'])
add_link('Screens', 'screen-animal-tags.html', 'Animal · tags', 'screen-tags-public.html')

# ═══ Mobile app · Tags (DD-009, from the Figma "Global Tagging Module"): phone frames by flow ═══
def bsheet(sid, title, body, foot='', head_btns='', meta=''):
    """An open bottom sheet over a phone screen (drawer--floating drawer--bottom)."""
    return (f'<div class="drawer-backdrop"></div><aside class="drawer drawer--floating drawer--bottom drawer--shown" id="{sid}" role="dialog" aria-modal="true" aria-labelledby="{sid}-title">'
            f'<header class="drawer__head"><div>{f"<span class={chr(34)}drawer__meta{chr(34)}>{esc(meta)}</span>" if meta else ""}<h2 class="drawer__title" id="{sid}-title">{esc(title)}</h2></div>'
            f'<span class="drawer__actions">{head_btns}<button class="icon-btn" type="button" aria-label="Close" data-drawer-close>{I("x")}</button></span></header>'
            f'<div class="drawer__body">{body}</div>{foot}</aside>')
def app(title, body, fab=None, back=True, end='', overlay='', top=None):
    head = top if top is not None else (f'<div class="topbar">' + (f'<button class="icon-btn icon-btn--ghost" type="button" aria-label="Back">{I("arrow-left")}</button>' if back else '')
                                        + f'<h1 class="topbar__title">{esc(title)}</h1>{end}</div>')
    f = f'<button class="fab screen__fab" type="button" aria-label="{esc(fab)}">{I("plus")}</button>' if fab else ''
    return f'<div class="shell"><div class="shell__main">{head}<div class="screen__scroll">{body}</div></div>{f}{overlay}</div>'
def phone(screen, caption, note=''):
    return f'<figure class="app-frame-fig"><div class="app-frame shell-host">{screen}</div><figcaption><b>{esc(caption)}</b>{f"<span>{esc(note)}</span>" if note else ""}</figcaption></figure>'
def frames(*figs): return '<div class="app-frames">' + ''.join(figs) + '</div>'
def search_row(ph, history=False):
    return (f'<div class="search-row">{search(ph)}<button class="icon-btn icon-btn--line" type="button" aria-label="Filter">{I("filter")}</button>'
            + (f'<button class="icon-btn icon-btn--line" type="button" aria-label="Tag history">{I("history")}</button>' if history else '') + '</div>')
def block_tabs(opts, sel=0, label='Show'): return '<div class="tag-tabs">' + line_tabs(opts, sel, label) + '</div>'
M_CATS = [('Medical', [('Identification verified', 'normal'), ('Long-term monitoring', 'high'), ('Microchip verified', None), ('No current concerns', None), ('Off exhibit', 'normal')]),
          ('Health', [('Under observation', 'high'), ('Post-surgery', 'critical'), ('Vaccination due', 'normal')]), ('Behaviour', [('Aggressive', 'critical'), ('Shy feeder', 'normal'), ('Breeding pair', None)])]
M_HUB = app('My tags hub', search_row('Search tags') + block_tabs(['Public tags', 'Private tags'], label='Tag type')
            + block_tabs(['All', 'Animals', 'Species', 'Sites', 'Sections', 'Enclosures'], 0, 'Used on')
            + ''.join(tag_group(c, [tag_chip(n, pr) for n, pr in t]) for c, t in M_CATS), fab='Add a tag')
def ent_head(view):
    return (f'<div class="sheet-hero"><small>Medical · public tag</small><div class="chips">{tag_chip("Identification verified", "normal", button=False)}</div>'
            '<div class="segmented segmented--stat segmented--block" role="tablist" aria-label="Tag">'
            f'<button type="button" role="tab" aria-selected="{str(view == "ents").lower()}"><b>49</b><span>Entities</span></button>'
            f'<button type="button" role="tab" aria-selected="{str(view == "info").lower()}"><b>{I("help")}</b><span>Info</span></button></div></div>')
M_ENTS = app('Identification verified', ent_head('ents') + block_tabs(['All', 'Animals', 'Species', 'Sites', 'Sections', 'Enclosures'], 1, 'Entity type') + search_row('Search animals')
             + '<div class="animal-cards">' + ''.join(animal_card(*a) for a in TAG_ANIMALS) + '</div>')
M_INFO = app('Identification verified', ent_head('info') + '<div class="list">' + fact('grid', 'teal', 'Tag category', 'Medical') + fact('calendar', 'coral', 'Deadline', '29 May 2026')
             + fact('users', 'sky', 'Tag type', 'Public') + fact('user', 'green', 'Added by', 'Nitin P · 21 May 2026') + item(tile('bell', 'navy'), 'Roles notified', 'Veterinarian, Curator') + '</div>'
             + '<div class="card card--sunken"><p class="t-overline">Description</p><p class="t-small">The animal\'s identity was checked against its microchip and records.</p></div>')
M_PUB = app('Public tags', seg(['Tags', 'Categories'], 0, 'Show').replace('class="segmented"', 'class="segmented segmented--block"', 1)
            + block_tabs(['All 14', 'Health 4', 'Behaviour 3', 'Husbandry 3', 'Diet 2', 'General 2'], label='Category') + search_row('Search tags')
            + '<div class="chips">' + ''.join(tag_chip(n, pr) for _, t in TAG_CATS for n, pr in t) + '</div>', fab='New tag')
M_CATS_SCREEN = app('Public tags', seg(['Tags', 'Categories'], 1, 'Show').replace('class="segmented"', 'class="segmented segmented--block"', 1) + search('Search categories')
            + '<div class="card-grid" style="gap:var(--space-2)">' + ''.join(f'<a class="row row--outline" href="#">{tile("grid", "teal")}<span class="row__body"><span class="row__title">{n}</span><span class="row__meta">{t} tags · {e} {"entity" if e == 1 else "entities"}</span></span>{I("chevron-right")}</a>' for n, t, e in CAT_ROWS) + '</div>', fab='New category')
M_NEW_BODY = (fld('Tag name', '<input class="input" maxlength="50" placeholder="For example, Hand reared">')
              + labelled('Category' + REQ, '<div class="select-wrap"><select class="select"><option>Choose a category</option><option>Health</option><option>Behaviour</option></select></div>')
              + '<a class="btn btn--link" href="#">' + I('plus') + 'New category</a>'
              + f'<div class="field"><span class="field__label">Used on <span class="req">*</span></span><button class="row row--outline" type="button"><span class="row__body"><span class="row__title">Animals</span><span class="row__meta">1 chosen</span></span>{I("chevron-right")}</button></div>'
              + fld('Description (optional)', '<textarea class="textarea" rows="3" placeholder="What should people know when they see this tag?"></textarea>') + roles_field([]))
M_NEW_FOOT = '<div class="actionbar"><button class="btn btn--primary" type="button" disabled>Create tag</button></div>'
def with_foot(screen, foot): return screen.replace('</div></div>', '</div>' + foot + '</div>', 1)
M_NEW = with_foot(app('New tag', M_NEW_BODY), M_NEW_FOOT)
ENT_ROWS = ''.join(f'<label class="row row--outline"><span class="row__body"><span class="row__title">{n}</span></span><span class="check"><input type="checkbox"{" checked" if n == "Animals" else ""} aria-label="{n}"></span></label>' for n in ['Animals', 'Species', 'Enclosures', 'Sections', 'Sites'])
M_SELECT = with_foot(app('New tag', M_NEW_BODY, overlay=bsheet('m-select', 'Used on', f'<div class="section-head"><b>1 chosen</b><a href="#">Select all</a></div><div class="card-grid" style="gap:var(--space-2)">{ENT_ROWS}</div>',
                                                                foot_one('Done', False))), M_NEW_FOOT)
def m_hero(chips, more):
    return (f'<section class="hero-photo hero-photo--app"><img class="hero-photo__img" src="{B}tiger.webp" alt="">'
            f'<div class="hero-photo__bar"><a class="hero-photo__back" href="#">{I("chevron-left")}Animals</a><button class="icon-btn" type="button" aria-label="More">{I("more")}</button></div>'
            f'<div><span class="hero-photo__overline">AAID 000482 · Male · 4 years</span><h2 class="hero-photo__title">Sheru</h2><p class="hero-photo__sub">Bengal tiger · Tiger enclosure 2</p></div>'
            + tag_strip(chips, more, more + len(chips)) + '</section>')
M_STRIP = [tag_chip('Aggressive', 'critical', attrs=INFO), tag_chip('In transit', 'high', private=True), tag_chip('Abnormal behaviour', 'high'), tag_chip('Chronic condition', 'normal', private=True)]
def m_animal(seg_sel, content, overlay=''):
    body = (m_hero(M_STRIP, 40) + block_tabs(['Tags', 'Medical', 'Enclosures'], 0, 'Animal record') + search_row('Search tags', history=True)
            + block_tabs(['Public tags', 'Private tags'], seg_sel, 'Tag type') + content)
    return app('', body, fab='Add a tag', top='', overlay=overlay)
M_PRIVATE = m_animal(1, tag_group('My tags', [tag_chip('In transit', 'high', private=True), tag_chip('Chronic condition', 'normal', private=True), tag_chip('Elderly', private=True)])
                     + tag_group('Tags by others', [tag_chip('Night shift watch', 'critical', private=True, by=('KR', 'Kavya Rao')), tag_chip('Weigh on Monday', private=True, by=('RK', 'Ravi Kumar'))]))
M_EMPTY_BODY = f'<div class="empty">{tile("tag", "teal")}<b>No private tags yet</b><span>Only you see the private tags you add here, unless you share them.</span></div>'
M_EMPTY = m_animal(1, M_EMPTY_BODY)
M_ADD1 = m_animal(1, M_EMPTY_BODY, bsheet('m-add-1', 'Add private tag', search('Search or create a tag') + item(tile('plus', 'green'), 'Elderly', 'Create it as a private tag and add it')
                  + '<p class="field__label">Choose a tag</p><div class="chips">' + ''.join(tag_chip(n, pr, private=True) for n, pr in [('Sick', 'critical'), ('In transit', 'high'), ('Not eating', 'high'), ('Special diet', 'normal')]) + '</div>', foot_split('Cancel', 'Add tag', b_disabled=True)))
M_ADD2 = m_animal(1, M_EMPTY_BODY, bsheet('m-add-2', 'Add private tag', f'<div class="field"><span class="field__label">Selected tag</span><div class="chips">{tag_chip("Elderly", private=True, remove=True, new=True)}</div></div>'
                  + priority_picker('m-add-2-pr', 0) + toggle_row('users', 'navy', 'Visible to all', 'Off means only you can see it on this animal'), foot_split('Cancel', 'Add tag')))
M_NOPERM = m_animal(0, '', bsheet('m-noperm', 'Add public tag', search('Search public tags') + '<div class="alert alert--caution" role="status">' + I('alert') + '<div><b>You can\'t create public tags</b>Choose an existing one, or create a private tag instead.</div></div>', foot_split('Cancel', 'Add tag', b_disabled=True)))
M_DETAILS = m_animal(0, '', bsheet('m-details', 'Aggressive', f'<div class="chips">{tag_chip("Aggressive", "critical", button=False)}</div><div class="list">'
                     + fact('users', 'sky', 'Tag type', 'Public') + fact('grid', 'teal', 'Category', 'Behaviour') + fact('calendar', 'coral', 'Deadline', '29 May 2026') + fact('user', 'green', 'Added by', 'Dr. Nitin · 14 Jun 2026')
                     + item(tile('paw', 'green'), 'Tagged animals and places', '40') + item(tile('bell', 'navy'), 'Roles notified', '25 roles') + '</div>'
                     + '<div class="card card--sunken"><p class="t-overline">Description</p><p class="t-small">Two keepers at all times. Do not enter alone.</p></div>', '',
                     ibtn('pencil', 'Edit tag') + ibtn('minus', 'Remove from Sheru'), 'Public tag'))
M_EDIT = m_animal(0, '', bsheet('m-edit', 'Edit tag', f'<div class="chips">{tag_chip("Aggressive", "critical", button=False)}</div>' + priority_picker('m-edit-pr', 2)
                  + toggle_row('calendar', 'sky', 'Schedule and duration', 'A deadline or a time period', on=True) + chipgroup('When', ['Set a deadline', 'A time period'])
                  + fld('Deadline', '<input class="input" type="date">'), foot_split('Cancel', 'Save')))
M_REMOVE = m_animal(0, '', '<div class="dialog-backdrop"><div class="dialog" role="alertdialog" aria-labelledby="m-rm-t" aria-describedby="m-rm-d"><div class="dialog__head"><div><h3 class="dialog__title" id="m-rm-t">Remove tag?</h3>'
                    '<p class="dialog__desc" id="m-rm-d">Aggressive comes off Sheru. The tag stays in the hub.</p></div></div><div class="dialog__foot"><button class="btn btn--ghost" type="button">Cancel</button><button class="btn btn--danger" type="button">Remove</button></div></div></div>')
M_ALL = m_animal(0, '', bsheet('m-all', 'Tags · 44', block_tabs(['Public tags 40', 'Private tags 4'], 0, 'Tag type') + '<div class="chips">'
                 + ''.join(tag_chip(n, p) for n, p in [('Aggressive', 'critical'), ('Anaesthesia due', 'critical'), ('In transit', 'high'), ('Sick', 'critical'), ('Abnormal behaviour', 'high'), ('Medication due', 'high'), ('Special diet', 'normal'), ('Elderly', None), ('Nocturnal', None)]) + '</div>'))
M_ROLES = m_animal(0, '', bsheet('m-roles', 'Roles notified', search('Search roles') + '<div class="section-head"><b>25 roles</b></div><div class="list">'
                   + ''.join(f'<div class="item">{tile("user", "navy")}<span class="item__body"><b>{r}</b></span></div>' for r in ['Site manager', 'Super admin', 'Pharmacists', 'Veterinarians', 'Nutritionists']) + '</div>'))
M_HISTORY = app('Tag history', animal_card(*TAG_ANIMALS[0]) + search('Search tags')
                + ''.join(f'<div class="section-head"><b>{day}</b></div><ul class="activity">' + ''.join(f'<li>{tile(ic, h)}<div>{tag_chip(n, pr, private=pv, button=False)}<small>{esc(m)}</small></div></li>' for ic, h, (n, pr, pv), m in rows) + '</ul>' for day, rows in TAG_HISTORY[:3]))
write_doc('mobile-tags', {'title': 'Mobile app · Tags', 'group': 'Screens', 'intro': 'The Tags flows of the mobile app, from the Global Tagging Module design, on system parts: the hub, tag entities, public tags and categories, a new tag, an animal\'s Tags tab and its bottom sheets, and tag history.', 'icon': 'tag', 'hue': 'teal'},
          doc('mt-hub', 'My tags hub and tag entities', 'Search and filter, public or private, where the tag is used, then tags by category. Select a tag to see the <b>animals and places</b> that carry it, or its <b>info</b>.',
              frames(phone(M_HUB, 'My tags hub', 'Public tags, every entity type'), phone(M_ENTS, 'Tag entities', 'Animals with the tag'), phone(M_INFO, 'Tag info')), canvas=False)
          + doc('mt-public', 'Public tags and a new tag', 'Tags by category, and the categories themselves. <b>New tag</b> is a full page on the phone; <b>Used on</b> opens a bottom sheet.',
              frames(phone(M_PUB, 'Public tags'), phone(M_CATS_SCREEN, 'Categories'), phone(M_NEW, 'New tag'), phone(M_SELECT, 'Used on', 'Bottom sheet')), canvas=False)
          + doc('mt-animal', 'An animal\'s tags', 'The hero carries the latest four tags and <b>+N</b>. The Tags tab splits public and private; private shows <b>my tags</b> and <b>tags by others</b>. With none, an empty state says what private tags are.',
              frames(phone(M_PRIVATE, 'Private tags'), phone(M_EMPTY, 'No private tags yet'), phone(M_ALL, 'All tags', '+N opens them in a bottom sheet')), canvas=False)
          + doc('mt-sheets', 'Add, see, edit and remove', 'Every step is a <b>bottom sheet</b> on the phone (<code>drawer--bottom</code>). Add a tag: choose or create it, then its priority and, for a private tag, whether everyone sees it, in the same sheet. Without permission to create public tags, a caution note says what to do instead. Removing asks first.',
              frames(phone(M_ADD1, 'Add private tag', 'Choose or create'), phone(M_ADD2, 'Add private tag', 'Priority and visibility'), phone(M_NOPERM, 'Add public tag', 'No permission to create'),
                     phone(M_DETAILS, 'Tag details'), phone(M_EDIT, 'Edit tag'), phone(M_REMOVE, 'Remove tag?'), phone(M_ROLES, 'Roles notified')), canvas=False)
          + doc('mt-history', 'Tag history', 'Every change to the animal\'s tags, newest first.', frames(phone(M_HISTORY, 'Tag history')), canvas=False),
          usage('mt-usage', 'Mobile app · Tags', ['Use bottom sheets for tag steps on the phone.', 'Keep one floating add button per screen.', 'Put priority and visibility in the same Add tag sheet.'],
                ['Tint a sheet header with the priority colour: the chip carries it.', 'Stack a speed dial under the add button.', 'Use white labels on green buttons.']),
          code('mt-code', 'Mobile app · Tags', ['.drawer--bottom', '.fab', '.topbar', '.hero-photo--app', '.tag-strip', '.tag-chip', '.empty', '.alert--caution'],
               '<aside class="drawer drawer--floating drawer--bottom" role="dialog" aria-modal="true" aria-labelledby="add-title">\n  <header class="drawer__head">…</header>\n  <div class="drawer__body">…</div>\n  <div class="drawer__foot drawer__foot--split">…</div>\n</aside>'))
add_link('Screens', 'mobile-tags.html', 'Mobile app · Tags', 'screen-animal-tags.html')


ENC_DOC = ('<div class="doc" id="enclosure-sheet"><h3>Enclosure sheet</h3><p class="lead">A record sheet whose rows carry the <b>animal card details</b>: the photo with the sex tag, the AAID, the name and the scientific name; each row opens the animal. Above them, a <b>figures panel</b> (animals, species and the keeper), the status pill and a section head with how many are shown. The foot splits a secondary action and one main action.</p>'
           '<div class="demo demo--canvas ss-demo"><div class="ss-frame">' + enclosure_sheet('sheet-enclosure-demo', inline=True) + '</div></div></div>')
put_section('docs-src/side-sheets.html', '<!--enclosure-sheet-->', '<!--/enclosure-sheet-->', ENC_DOC, '<!--usage-->')

# 3. Timelines, charts and heroes (Stat cards)
egg_trend = [.55, .78, .6, .92, .7, .5, .88, .95, .75, .8, .93, .65, .55, .06]
def donut_svg(segs, centre, label):
    r, off, cs = 15.9155, 0, ''
    for v, hue in segs:
        cs += f'<circle r="{r}" cx="18" cy="18" style="--seg:var(--color-signal-{hue})" stroke-dasharray="{v} {100 - v}" stroke-dashoffset="{-off}"/>'; off += v
    return f'<div class="donut__chart"><svg viewBox="0 0 36 36" aria-hidden="true"><circle r="{r}" cx="18" cy="18"/>{cs}</svg><div><b>{centre}</b><small>{label}</small></div></div>'
tc_demo = ('<div class="board board--2">'
           + list_card('Activity timeline', acts([('swap', 'green', 'INH-03531 completed', '1 animal moved to A-3 · 6 Oct, 12:46'), ('truck', 'amber', 'Hospital transfer requested', 'HT38-00657 · by Sourav'), ('clipboard', 'teal', 'Cave reconstruction assessed', 'Score 12 · 6 Aug')]))
           + widget('', 'shield', 'Donut and legend', None, '', sub='Eggs in nest now', go=False, extra='<div class="donut">' + donut_svg([(74, 'success'), (14, 'info'), (10, 'caution'), (2, 'danger')], '74%', 'intact')
                    + '<ul class="legend"><li><i style="--seg:var(--color-signal-success)"></i>Intact<b>512</b></li><li><i style="--seg:var(--color-signal-info)"></i>Thin shelled<b>96</b></li><li><i style="--seg:var(--color-signal-caution)"></i>Cracked<b>70</b></li><li><i style="--seg:var(--color-signal-danger)"></i>Rotten<b>18</b></li></ul></div>')
           + widget('', 'package', 'Trend', '648', 'eggs · last 14 days, today outlined', go=False, cls='board__full',
                    extra='<div class="trend" style="--n:14" aria-hidden="true">' + ''.join(f'<i{TODAY if k == 13 else ""} style="--v:{v}"></i>' for k, v in enumerate(egg_trend)) + '</div>')
           + '</div>'
           + f'<section class="hero-strip"><img class="hero-strip__img" src="{B}fur.webp" alt=""><div class="hero-strip__text"><span class="t-overline">Hero strip</span><h2 class="hero-strip__title">Today\'s egg collection: <em>0 eggs</em></h2><p>A photo beside a deep band with one headline.</p></div></section>'
           + f'<section class="hero-photo"><img class="hero-photo__img" src="{IMG}leopard.webp" alt=""><div><span class="tag tag--glass">{I("paw")}Glass stats with meters</span><h2 class="hero-photo__title">26,214</h2><p class="hero-photo__sub">animals on record</p></div><div class="glass-stats">'
           + ''.join(f'<div class="glass-stat"><small><i style="--dot:var(--hue-{h})"></i>{t}</small><b>{v}<span>{p}%</span></b><span class="meter" style="--v:{int(p) / 100};--bar:var(--hue-{h})"><i></i></span></div>' for t, v, p, h in [('Male', '9,804', '37', 'teal'), ('Female', '10,197', '39', 'coral'), ('Undetermined', '4,614', '18', 'green')])
           + '</div></section>')
write_doc('timelines-and-charts', {'title': 'Timelines and charts', 'group': 'Stat cards', 'intro': 'The activity timeline, the donut with its legend, the 14-day trend, the hero strip and glass stats with meters.', 'icon': 'trend', 'hue': 'violet'},
          doc('tc-hero-options', 'Hero options', 'Two ways to head a module page with a photo. The <b>foot bar</b> (<code>hero-photo--foot</code>, <code>hero-photo__foot</code>) runs along the bottom with a meta item and a link, and the figures spread across the width (<code>hero-photo__stats--spread</code>). The <b>site hero</b> (<code>hero-photo--site</code>) adds a <b>back chip</b>, an <b>overline</b>, the person in charge and a tag, with the figures in a glass panel on the right.',
              hero_foot('elephant.webp', 'All sites', 'All site insights', [('341', 'Sites'), ('781', 'Sections'), ('2,171', 'Enclosures'), ('26,214', 'Animals')], 'grid', '8 clusters', 'View all sites')
              + hero_site('tiger.webp', 'All sites', 'Site', 'Adirampattinam', 'Kunal Singh', 'Aggressive', [('35', 'Species'), ('9,044', 'Animals'), ('15', 'Sections'), ('104', 'Enclosures')]), canvas=False)
          + doc('tc-demo', 'Timelines, charts and heroes', 'The <b>activity timeline</b> joins events with a line. The <b>donut</b> draws segments with strokes in status colours, because the segments are states. The <b>trend</b> shows slim columns with today outlined. The <b>hero strip</b> and <b>glass stats</b> head module homes.', tc_demo),
          usage('tc-usage', 'Timelines and charts', ['Use status colours in a donut only when the segments are states.', 'Outline today in a trend: it is not over yet.'], ['Show more than five donut segments.', 'Use a donut for a single figure.']),
          code('tc-code', 'Timelines and charts', ['.activity', '.donut', '.donut__chart', '.legend', '.trend', '.trend-axis', '.hero-strip', '.hero-strip__img', '.hero-strip__text', '.hero-strip__title', '.glass-stats', '.glass-stat', '.meter'],
               '<ul class="activity"><li><span class="tile-icon">…</span><div><b>Event</b><small>When · where</small></div></li></ul>'))

add_link('Pattern components', 'widget-board.html', 'Widget board', 'role-homes.html')
add_link('Pattern components', 'module-bar.html', 'Module bar and side panel', 'widget-board.html')
add_link('Pattern components', 'browse-panel.html', 'Browse panel', 'record-detail.html')
add_link('Stat cards', 'timelines-and-charts.html', 'Timelines and charts', 'lists-and-charts.html')
open(nav_p, 'w').write(json.dumps(nav, indent=2, ensure_ascii=False) + '\n')
print('gallery pages ok')
