/* ==========================================================================
   Antz Design System · components.js (optional)
   Behaviour for components that need it. No dependencies. Load it after
   components.css with <script src=".../components.js" defer></script>.
   Without it every component still works; motion simply falls back to the
   instant CSS states. All timing comes from the motion tokens, so reduced
   motion (which sets the duration tokens to 0) turns the motion off.

     Tabs and segmented controls  one indicator glides to the selected item
     Animal card                  compact ⇄ expanded with an eased resize
     Side sheets (1.2)            open/close work drawers and floating sheets
     Navigation drawer (1.2)      open/close from the hamburger, module tabs,
                                  Escape, focus return; the tone fades
   ========================================================================== */
(function () {
  'use strict';
  var doc = document;
  function token(name, fallback) { var v = getComputedStyle(doc.documentElement).getPropertyValue(name).trim(); return v || fallback; }
  function ms(v) { return v.indexOf('ms') > -1 ? parseFloat(v) : parseFloat(v) * 1000; }
  function reducedMotion() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* ── Tabs and segmented controls: a sliding indicator ──────────────────
     Works for .segmented (all variants) and the docs' .page-tabs. The group
     gets .has-indicator, which hides the per-item highlight; a single
     .tab-indicator moves to the selected item (aria-selected or
     aria-pressed) and settles with an elastic overshoot (--ease-elastic over
     --duration-slower, set in components.css). */
  var TABS = '.segmented, .page-tabs';
  function selectedIn(g) {
    for (var i = 0; i < g.children.length; i++) {
      var c = g.children[i];
      if (c.getAttribute('aria-selected') === 'true' || c.getAttribute('aria-pressed') === 'true') return c;
    }
    return null;
  }
  function place(g, instant) {
    var ind = g._antzIndicator, b = selectedIn(g);
    if (!ind) return;
    if (!b || !b.offsetWidth) { ind.style.opacity = '0'; return; }
    ind.style.opacity = '';
    if (instant) ind.classList.add('is-instant');
    g.style.setProperty('--ind-x', b.offsetLeft + 'px');
    g.style.setProperty('--ind-y', b.offsetTop + 'px');
    g.style.setProperty('--ind-w', b.offsetWidth + 'px');
    g.style.setProperty('--ind-h', b.offsetHeight + 'px');
    if (instant) { void ind.offsetWidth; ind.classList.remove('is-instant'); }
  }
  function initTabs(g) {
    if (g._antzIndicator || g.dataset.indicator === 'off') return;
    var ind = doc.createElement('span');
    ind.className = 'tab-indicator'; ind.setAttribute('aria-hidden', 'true');
    g.appendChild(ind); g._antzIndicator = ind; g.classList.add('has-indicator');
    place(g, true);
    new MutationObserver(function () { place(g, false); }).observe(g, { subtree: true, attributes: true, attributeFilter: ['aria-selected', 'aria-pressed'] });
    if ('ResizeObserver' in window) new ResizeObserver(function () { place(g, true); }).observe(g);
  }
  function scan(root) {
    if (root.matches && root.matches(TABS)) initTabs(root);
    if (root.querySelectorAll) Array.prototype.forEach.call(root.querySelectorAll(TABS), initTabs);
  }

  /* ── Animal card: compact ⇄ expanded ───────────────────────────────────
     The real photo animates its width and height and the card its height on
     --ease-elastic over --duration-slower (a small overshoot, then settle) (the photo stays framed, never
     stretched); neighbours move with the card; the text, AAID, pills and
     footer fade in from 40% of the way. No snapshots, so no ghosting. */
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-animal-toggle]'); if (!b) return;
    var card = b.closest('.animal-card'); if (!card || card.classList.contains('is-morphing')) return;
    var next = card.dataset.state === 'expanded' ? 'compact' : 'expanded';
    var media = card.querySelector('.animal-card__media');
    var before = media ? media.getBoundingClientRect() : null, cardBefore = card.getBoundingClientRect().height;
    card.dataset.state = next;
    b.setAttribute('aria-expanded', String(next === 'expanded'));
    b.setAttribute('aria-label', next === 'expanded' ? 'Show less' : 'Show more');
    var use = b.querySelector('use'); if (use) use.setAttribute('href', next === 'expanded' ? '#i-minimize' : '#i-maximize');
    if (reducedMotion() || !media || !media.animate) return;
    var dur = ms(token('--duration-slower', '500ms')), ease = token('--ease-elastic', 'cubic-bezier(.34, 1.56, .64, 1)'), easeOut = token('--ease-out', 'ease-out'), rise = token('--space-1-5', '6px');
    if (!(dur > 0)) return;   // a zero duration token means no motion
    var after = media.getBoundingClientRect(), cardAfter = card.getBoundingClientRect().height;
    card.classList.add('is-morphing');
    var grow = media.animate([{ width: before.width + 'px', height: before.height + 'px' }, { width: after.width + 'px', height: after.height + 'px' }], { duration: dur, easing: ease });
    card.animate([{ height: cardBefore + 'px' }, { height: cardAfter + 'px' }], { duration: dur, easing: ease });
    Array.prototype.forEach.call(card.querySelectorAll('.animal-card__body, .animal-card__foot, .animal-card__overlay'), function (el) {
      if (!el.getClientRects().length) return;
      el.animate([{ opacity: 0, transform: 'translateY(' + rise + ')' }, { opacity: 1, transform: 'none' }],
        { duration: dur * 0.6, delay: dur * 0.4, easing: easeOut, fill: 'backwards' });   // text starts at 40% of the photo's move
    });
    function done() { card.classList.remove('is-morphing'); }
    grow.onfinish = done; grow.oncancel = done;
  });

  /* ── Start, and pick up components added later (cloned templates) ───── */
  function start() {
    scan(doc);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1 && !(n.classList && n.classList.contains('tab-indicator'))) scan(n); }); });
    }).observe(doc.documentElement, { childList: true, subtree: true });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
  window.AntzComponents = { refresh: function (root) { scan(root || doc); } };
})();

/* ── Navigation drawer (1.2) ───────────────────────────────────────────────
   Markup: a trigger with data-navdrawer-open="<drawer id>", an
   <aside class="navdrawer" id="<drawer id>" hidden>, and (optional) a
   .drawer-backdrop with data-navdrawer-backdrop="<drawer id>" hidden.
   Rail tabs (role="tab", aria-controls → a .navdrawer__menu, data-tone) switch
   the menu and the drawer's tone; the tone colours fade (CSS @property). */
(function () {
  'use strict';
  var doc = document, lastTrigger = null;
  function backdropFor(d) { return doc.querySelector('[data-navdrawer-backdrop="' + d.id + '"]'); }
  function open(d, trigger) {
    lastTrigger = trigger || doc.activeElement;
    d.hidden = false; d.classList.remove('is-leaving');
    var b = backdropFor(d); if (b) b.hidden = false;
    doc.querySelectorAll('[data-navdrawer-open="' + d.id + '"]').forEach(function (t) { t.setAttribute('aria-expanded', 'true'); });
    var focus = d.querySelector('.navdrawer__tab[aria-selected="true"]') || d.querySelector('button, a, input');
    if (focus) focus.focus();
  }
  function close(d) {
    if (d.hidden) return;
    var dur = parseFloat(getComputedStyle(d).animationDuration) || 0;
    var finish = function () { d.hidden = true; d.classList.remove('is-leaving'); var b = backdropFor(d); if (b) b.hidden = true; };
    doc.querySelectorAll('[data-navdrawer-open="' + d.id + '"]').forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
    if (dur > 0) { d.classList.add('is-leaving'); setTimeout(finish, dur * 1000); } else finish();
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }
  function select(tab) {
    var d = tab.closest('.navdrawer'); if (!d) return;
    d.querySelectorAll('.navdrawer__tab').forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      var m = t.getAttribute('aria-controls') && doc.getElementById(t.getAttribute('aria-controls'));
      if (m) m.hidden = !on;
    });
    if (tab.dataset.tone) d.dataset.tone = tab.dataset.tone;
  }
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-navdrawer-open]');
    if (t) { var d = doc.getElementById(t.getAttribute('data-navdrawer-open')); if (d) { if (d.hidden) open(d, t); else close(d); } return; }
    var c = e.target.closest('[data-navdrawer-close]');
    if (c) { var d2 = c.closest('.navdrawer'); if (d2) close(d2); return; }
    var bd = e.target.closest('[data-navdrawer-backdrop]');
    if (bd) { var d3 = doc.getElementById(bd.getAttribute('data-navdrawer-backdrop')); if (d3) close(d3); return; }
    var tab = e.target.closest('.navdrawer__tab'); if (tab) select(tab);
  });
  doc.addEventListener('keydown', function (e) {
    var d = e.target.closest && e.target.closest('.navdrawer');
    if (e.key === 'Escape') { var open1 = d || doc.querySelector('.navdrawer:not([hidden])'); if (open1 && !open1.hasAttribute('data-navdrawer-static')) close(open1); return; }
    var tab = e.target.closest && e.target.closest('.navdrawer__tab');
    if (tab && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End')) {
      var tabs = Array.prototype.slice.call(tab.parentNode.querySelectorAll('.navdrawer__tab')), i = tabs.indexOf(tab);
      var n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
      e.preventDefault(); select(tabs[n]); tabs[n].focus();
    }
  });
})();

/* ── Side sheets (1.2): the work drawer and its floating variant ─────────────
   A trigger with data-drawer-open="<id>" opens <aside class="drawer" id hidden>;
   data-drawer-close inside it, its backdrop ([data-drawer-backdrop="<id>"])
   and Escape close it. Focus moves into the sheet and back to the trigger. */
(function () {
  'use strict';
  var doc = document, last = null;
  function bd(d) { return doc.querySelector('[data-drawer-backdrop="' + d.id + '"]'); }
  function open(d, t) { last = t; d.hidden = false; d.classList.remove('is-leaving'); var b = bd(d); if (b) b.hidden = false; if (t) t.setAttribute('aria-expanded', 'true'); var f = d.querySelector('[data-drawer-close], button, a, input'); if (f) f.focus(); }
  function close(d) {
    if (d.hidden) return;
    var dur = parseFloat(getComputedStyle(d).animationDuration) || 0;
    var done = function () { d.hidden = true; d.classList.remove('is-leaving'); var b = bd(d); if (b) b.hidden = true; };
    if (dur > 0) { d.classList.add('is-leaving'); setTimeout(done, dur * 1000); } else done();
    if (last) { last.setAttribute('aria-expanded', 'false'); last.focus(); }
  }
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-drawer-open]');
    if (t) { var d = doc.getElementById(t.getAttribute('data-drawer-open')); if (d) open(d, t); return; }
    var c = e.target.closest('[data-drawer-close]'); if (c) { var d2 = c.closest('.drawer'); if (d2) close(d2); return; }
    var b = e.target.closest('[data-drawer-backdrop]'); if (b) { var d3 = doc.getElementById(b.getAttribute('data-drawer-backdrop')); if (d3) close(d3); }
  });
  doc.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; var d = doc.querySelector('.drawer:not([hidden]):not(.drawer--inline)'); if (d) close(d); });
})();

/* ── Edit board (1.2): a button with data-board-edit="<board id>" toggles
   .is-editing on the board, which shows each widget's remove badge. ───────── */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-board-edit]'); if (!t) return;
    var b = document.getElementById(t.getAttribute('data-board-edit')); if (!b) return;
    var on = b.classList.toggle('is-editing'); t.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
})();
