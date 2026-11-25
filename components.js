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
    var finish = function () { d.hidden = true; d.classList.remove('is-leaving'); var b = backdropFor(d); if (b) b.hidden = true; };
    doc.querySelectorAll('[data-navdrawer-open="' + d.id + '"]').forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
    d.classList.add('is-leaving'); var dur = parseFloat(getComputedStyle(d).animationDuration) || 0;
    if (dur > 0) setTimeout(finish, dur * 1000); else finish();
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
    var rail = tab.closest('.navdrawer__rail'); if (rail) place(rail, false);
  }
  // Sliding notch: the selected tab travels (elastic) instead of jumping
  function place(rail, instant) {
    var sel = rail.querySelector('.navdrawer__tab[aria-selected="true"]'); if (!sel || !rail.offsetHeight) return;
    if (instant) rail.classList.add('is-instant');
    rail.style.setProperty('--nd-y', sel.offsetTop + 'px');
    rail.style.setProperty('--nd-h', sel.offsetHeight + 'px');
    rail.style.setProperty('--nd-total', rail.scrollHeight + 'px');
    if (instant) requestAnimationFrame(function () { requestAnimationFrame(function () { rail.classList.remove('is-instant'); }); });
  }
  function initRail(rail) {
    if (rail.classList.contains('has-notch')) return;
    ['above', 'notch', 'below'].forEach(function (k) {
      var el = doc.createElement('span'); el.setAttribute('aria-hidden', 'true');
      el.className = k === 'notch' ? 'navdrawer__notch' : 'navdrawer__fill navdrawer__fill--' + k;
      rail.appendChild(el);
    });
    rail.classList.add('has-notch'); place(rail, true);
    // Re-place without animation when the rail is shown or resized (overlay drawers start hidden)
    if (window.ResizeObserver) new ResizeObserver(function () { place(rail, true); }).observe(rail);
  }
  function initAll() { doc.querySelectorAll('.navdrawer__rail').forEach(initRail); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', initAll); else initAll();
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
    var done = function () { d.hidden = true; d.classList.remove('is-leaving'); var b = bd(d); if (b) b.hidden = true; };
    d.classList.add('is-leaving'); var dur = parseFloat(getComputedStyle(d).animationDuration) || 0;
    if (dur > 0) setTimeout(done, dur * 1000); else done();
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

/* ── Animated icons (1.2): play once, replay on demand ─────────────────────────
   ANTZ Line animated icons play once (2.8s) and hold their final frame, so nothing
   loops (WCAG 2.2.2). Put data-icon-replay on the icon or on its control (a tile,
   a nav item, a button) and the icon replays on hover, keyboard focus or tap.
   window.AntzIcons.replay(el) replays every icon animation inside el. Reduced
   motion: there is nothing to replay (the icons show their final frame). */
(function () {
  'use strict';
  var doc = document;
  function replay(el) {
    if (!el || !el.getAnimations) return;
    el.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); a.play(); });
  }
  function host(t) { return t && t.closest ? t.closest('[data-icon-replay]') : null; }
  doc.addEventListener('mouseover', function (e) { var h = host(e.target); if (h && !h.contains(e.relatedTarget)) replay(h); });
  doc.addEventListener('focusin', function (e) { var h = host(e.target); if (h && !h.contains(e.relatedTarget)) replay(h); });
  doc.addEventListener('click', function (e) { var h = host(e.target); if (h) replay(h); });
  window.AntzIcons = { replay: replay };
})();

/* ── Module homes and the widget board (1.2, DD-005) ─────────────────────────
   Popovers: a trigger with data-popover="<id>" toggles <div class="popover" id hidden>.
   Outside click and Escape close it; focus returns to the trigger.
   Dialogs: data-dialog-open="<id>" shows <div class="dialog-backdrop" id hidden>;
   data-dialog-close, a click on the backdrop itself, or Escape close it. Focus stays inside while open.
   Pickers: .picker__opt marks the chosen option (aria-selected) and closes its popover.
   Choices: role="radio" chips in a group (.filter-panel fieldset) are single choice.
   Board: .widget__remove hides a widget while editing; data-board-undo="<board id>" brings them back.
   Gallery: data-gallery-pick shows step 2 (style and size); data-gallery-back returns.
   Modules dialog: data-module-pick="<name>" selects a module and names it in the detail pane.
   Module panel: data-modnav-fold folds .modnav to icons.
   Toggles: data-toggle="<id>" shows or hides a panel in place (menu search and filters).
   Pins: .module-tile__pin toggles aria-pressed and its label (Pin / Unpin). */
(function () {
  'use strict';
  var doc = document, openPop = null, popTrigger = null, lastDialogTrigger = null;
  function closePop(focus) {
    if (!openPop) return;
    openPop.hidden = true;
    if (popTrigger) { popTrigger.setAttribute('aria-expanded', 'false'); if (focus) popTrigger.focus(); }
    openPop = null; popTrigger = null;
  }
  // Screens are cloned into several device frames, so ids repeat: look in the clicked frame first
  function byId(el, id) { var scope = el.closest('.shell-host'); return (scope && scope.querySelector('#' + CSS.escape(id))) || doc.getElementById(id); }
  function openDialog(d, t) {
    lastDialogTrigger = t; d.hidden = false;
    var f = d.querySelector('[data-dialog-close], input, button'); if (f) f.focus();
  }
  function closeDialog(d) { if (!d || d.hidden) return; d.hidden = true; if (lastDialogTrigger) lastDialogTrigger.focus(); }
  doc.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-popover]'))) {
      var p = byId(t, t.getAttribute('data-popover')); if (!p) return;
      var was = openPop === p; closePop(false);
      if (!was) { p.hidden = false; openPop = p; popTrigger = t; t.setAttribute('aria-expanded', 'true'); var f = p.querySelector('input, [aria-selected="true"], button'); if (f) f.focus({ preventScroll: true }); }
      return;
    }
    if (openPop && !openPop.contains(e.target)) closePop(false);
    if ((t = e.target.closest('.picker__opt'))) {
      var list = t.closest('.picker__list'); if (list) list.querySelectorAll('.picker__opt').forEach(function (o) { o.setAttribute('aria-selected', String(o === t)); });
      var pop = t.closest('.popover'); if (pop && pop === openPop) { var label = popTrigger && popTrigger.querySelector('[data-pick-label]'); if (label) label.textContent = t.dataset.label || t.firstChild.textContent.trim(); closePop(true); }
      return;
    }
    if ((t = e.target.closest('[role="radio"]'))) {
      var g = t.closest('[role="radiogroup"], fieldset'); if (g) g.querySelectorAll('[role="radio"]').forEach(function (r) { r.setAttribute('aria-checked', String(r === t)); });
      return;
    }
    if ((t = e.target.closest('[data-dialog-open]'))) { var d = byId(t, t.getAttribute('data-dialog-open')); if (d) openDialog(d, t); return; }
    if ((t = e.target.closest('[data-dialog-close]'))) { closeDialog(t.closest('.dialog-backdrop')); return; }
    if (e.target.classList && e.target.classList.contains('dialog-backdrop') && e.target.id) { closeDialog(e.target); return; }
    if ((t = e.target.closest('.widget__remove'))) {
      var w = t.closest('.widget, .board > *'); if (w) { w.hidden = true; w.setAttribute('data-removed', ''); }
      return;
    }
    if ((t = e.target.closest('[data-board-undo]'))) {
      var b = byId(t, t.getAttribute('data-board-undo')); if (b) b.querySelectorAll('[data-removed]').forEach(function (x) { x.hidden = false; x.removeAttribute('data-removed'); });
      return;
    }
    if ((t = e.target.closest('[data-gallery-pick]'))) {
      var gal = t.closest('[data-gallery]'); if (!gal) return;
      gal.querySelector('[data-step="1"]').hidden = true; gal.querySelector('[data-step="2"]').hidden = false;
      var name = gal.querySelector('[data-gallery-name]'); if (name) name.textContent = t.getAttribute('data-gallery-pick');
      var back = gal.querySelector('[data-gallery-back]'); if (back) back.focus();
      return;
    }
    if ((t = e.target.closest('[data-gallery-back]'))) {
      var gal2 = t.closest('[data-gallery]'); if (!gal2) return;
      gal2.querySelector('[data-step="2"]').hidden = true; gal2.querySelector('[data-step="1"]').hidden = false;
      return;
    }
    if ((t = e.target.closest('[data-module-pick]'))) {
      var md = t.closest('.modules-dialog'); if (!md) return;
      md.querySelectorAll('[data-module-pick]').forEach(function (m) { m.setAttribute('aria-current', String(m === t)); });
      var nm = md.querySelector('[data-module-name]'); if (nm) nm.textContent = t.getAttribute('data-module-pick');
      return;
    }
    if ((t = e.target.closest('[role="tab"][aria-controls]')) && t.closest('.dialog__tabs')) {
      // Tabs inside a dialog switch its panels
      t.closest('.dialog__tabs').querySelectorAll('[role="tab"]').forEach(function (x) {
        var on = x === t; x.setAttribute('aria-selected', String(on));
        var panel = byId(x, x.getAttribute('aria-controls')); if (panel) panel.hidden = !on;
      });
      return;
    }
    if ((t = e.target.closest('[data-toast]'))) {
      // A short toast, e.g. "New lab request · opens in the ANTZ app"
      var host = t.closest('.shell-host, .shell') || doc.body, old = host.querySelector('.toast-anchor'); if (old) old.remove();
      var wrap = doc.createElement('div'); wrap.className = 'toast-anchor'; wrap.setAttribute('role', 'status');
      wrap.innerHTML = '<span class="toast"></span>'; wrap.firstChild.textContent = t.getAttribute('data-toast');
      host.appendChild(wrap); setTimeout(function () { wrap.remove(); }, 2600);
      return;
    }
    if ((t = e.target.closest('.module-tile__pin'))) {
      var pinned = t.getAttribute('aria-pressed') !== 'true'; t.setAttribute('aria-pressed', String(pinned));
      var nm2 = (t.getAttribute('aria-label') || '').replace(/^(Pin|Unpin) /, ''); t.setAttribute('aria-label', (pinned ? 'Unpin ' : 'Pin ') + nm2);
      return;
    }
    if ((t = e.target.closest('[data-toggle]'))) {
      // Show or hide a panel in place (menu search, filters); the trigger reflects it in aria-expanded
      var target = byId(t, t.getAttribute('data-toggle')); if (!target) return;
      target.hidden = !target.hidden;
      var scope = t.closest('.popover') || doc;
      scope.querySelectorAll('[data-toggle="' + t.getAttribute('data-toggle') + '"]').forEach(function (x) { if (x.hasAttribute('aria-expanded')) x.setAttribute('aria-expanded', String(!target.hidden)); });
      if (!target.hidden) { var f = target.querySelector('input, [aria-checked="true"], button'); if (f) f.focus({ preventScroll: true }); }
      return;
    }
    if ((t = e.target.closest('[data-modnav-fold]'))) {
      var nav = t.closest('.modnav'); if (!nav) return;
      var folded = nav.classList.toggle('is-folded'); t.setAttribute('aria-expanded', String(!folded)); t.setAttribute('aria-label', folded ? 'Expand the side panel' : 'Fold the side panel');
    }
  });
  // Modal dialogs keep focus inside while open (Tab and Shift+Tab wrap)
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function trap(e) {
    var d = doc.querySelector('.dialog-backdrop[id]:not([hidden])'); if (!d) return;
    var box = d.querySelector('[role="dialog"]') || d;
    var items = Array.prototype.filter.call(box.querySelectorAll(FOCUSABLE), function (el) { return el.offsetParent !== null || el === doc.activeElement; });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (!box.contains(doc.activeElement)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') { trap(e); return; }
    if (e.key !== 'Escape') return;
    if (openPop) { closePop(true); return; }
    var d = (lastDialogTrigger && lastDialogTrigger.closest('.shell-host') || doc).querySelector('.dialog-backdrop[id]:not([hidden])') || doc.querySelector('.dialog-backdrop[id]:not([hidden])'); if (d) closeDialog(d);
  });
})();
