/* ==========================================================================
   Antz Design System · components.js (optional)
   Behaviour for components that need it. No dependencies. Load it after
   components.css with <script src=".../components.js" defer></script>.
   Without it every component still works; motion simply falls back to the
   instant CSS states. All timing comes from the motion tokens, so reduced
   motion (which sets the duration tokens to 0) turns the motion off.

     Tabs and segmented controls  one indicator glides to the selected item
     Animal card                  compact ⇄ expanded with an eased resize
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
     --ease-in-out over --duration-slower (the photo stays framed, never
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
    var dur = ms(token('--duration-slower', '500ms')), ease = token('--ease-in-out', 'ease-in-out'), easeOut = token('--ease-out', 'ease-out'), rise = token('--space-1-5', '6px');
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
