/* ==========================================================================
   Docs site script (not part of the system): site chrome, demos and motion.
   Runs on every page; every block checks that its elements exist.
   ========================================================================== */
(function () {
  var root = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* Icon sprite: 24px outline icons, referenced as <use href="#i-name"> */
  document.body.insertAdjacentHTML('afterbegin', "<svg width=\"0\" height=\"0\" style=\"position:absolute\" aria-hidden=\"true\">\n  <symbol id=\"i-search\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"m20 20-3.5-3.5\"/></symbol>\n  <symbol id=\"i-bell\" viewBox=\"0 0 24 24\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\"/><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\"/></symbol>\n  <symbol id=\"i-plus\" viewBox=\"0 0 24 24\"><path d=\"M12 5v14M5 12h14\"/></symbol>\n  <symbol id=\"i-pencil\" viewBox=\"0 0 24 24\"><path d=\"M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z\"/></symbol>\n  <symbol id=\"i-check\" viewBox=\"0 0 24 24\"><path d=\"M20 6 9 17l-5-5\"/></symbol>\n  <symbol id=\"i-x\" viewBox=\"0 0 24 24\"><path d=\"M18 6 6 18M6 6l12 12\"/></symbol>\n  <symbol id=\"i-chevron-down\" viewBox=\"0 0 24 24\"><path d=\"m6 9 6 6 6-6\"/></symbol>\n  <symbol id=\"i-chevron-right\" viewBox=\"0 0 24 24\"><path d=\"m9 18 6-6-6-6\"/></symbol>\n  <symbol id=\"i-arrow-up-right\" viewBox=\"0 0 24 24\"><path d=\"M7 17 17 7M7 7h10v10\"/></symbol>\n  <symbol id=\"i-swap\" viewBox=\"0 0 24 24\"><path d=\"M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4\"/></symbol>\n  <symbol id=\"i-send\" viewBox=\"0 0 24 24\"><path d=\"M22 2 11 13\"/><path d=\"M22 2 15 22l-4-9-9-4Z\"/></symbol>\n  <symbol id=\"i-mic\" viewBox=\"0 0 24 24\"><rect x=\"9\" y=\"2\" width=\"6\" height=\"12\" rx=\"3\"/><path d=\"M19 10v1a7 7 0 0 1-14 0v-1M12 18v4\"/></symbol>\n  <symbol id=\"i-clip\" viewBox=\"0 0 24 24\"><path d=\"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48\"/></symbol>\n  <symbol id=\"i-sliders\" viewBox=\"0 0 24 24\"><path d=\"M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6\"/></symbol>\n  <symbol id=\"i-users\" viewBox=\"0 0 24 24\"><path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"/></symbol>\n  <symbol id=\"i-chat\" viewBox=\"0 0 24 24\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/></symbol>\n  <symbol id=\"i-shield\" viewBox=\"0 0 24 24\"><path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10\"/></symbol>\n  <symbol id=\"i-clock\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 6v6l4 2\"/></symbol>\n  <symbol id=\"i-alert\" viewBox=\"0 0 24 24\"><path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"/><path d=\"M12 9v4M12 17h.01\"/></symbol>\n  <symbol id=\"i-info\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 16v-4M12 8h.01\"/></symbol>\n  <symbol id=\"i-lock\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/></symbol>\n  <symbol id=\"i-eye\" viewBox=\"0 0 24 24\"><path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></symbol>\n  <symbol id=\"i-grid\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/></symbol>\n  <symbol id=\"i-plug\" viewBox=\"0 0 24 24\"><path d=\"M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z\"/></symbol>\n  <symbol id=\"i-zap\" viewBox=\"0 0 24 24\"><path d=\"M13 2 3 14h9l-1 8 10-12h-9z\"/></symbol>\n  <symbol id=\"i-sun\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41\"/></symbol>\n  <symbol id=\"i-moon\" viewBox=\"0 0 24 24\"><path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9\"/></symbol>\n  <symbol id=\"i-monitor\" viewBox=\"0 0 24 24\"><rect x=\"2\" y=\"3\" width=\"20\" height=\"14\" rx=\"2\"/><path d=\"M8 21h8M12 17v4\"/></symbol>\n  <symbol id=\"i-file\" viewBox=\"0 0 24 24\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><path d=\"M14 2v6h6\"/></symbol>\n  <symbol id=\"i-calendar\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M16 2v4M8 2v4M3 10h18\"/></symbol>\n  <symbol id=\"i-home\" viewBox=\"0 0 24 24\"><path d=\"m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/><path d=\"M9 22V12h6v10\"/></symbol>\n  <symbol id=\"i-more\" viewBox=\"0 0 24 24\"><circle cx=\"5\" cy=\"12\" r=\"1\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"19\" cy=\"12\" r=\"1\"/></symbol>\n  <symbol id=\"i-memory\" viewBox=\"0 0 24 24\"><ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"/><path d=\"M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4 3 9 3s9-1.34 9-3\"/></symbol>\n  <!-- Added for the Figma components (same drawing style) -->\n  <symbol id=\"i-arrow-left\" viewBox=\"0 0 24 24\"><path d=\"M19 12H5M12 19l-7-7 7-7\"/></symbol>\n  <symbol id=\"i-arrow-right\" viewBox=\"0 0 24 24\"><path d=\"M5 12h14M12 5l7 7-7 7\"/></symbol>\n  <symbol id=\"i-chevron-left\" viewBox=\"0 0 24 24\"><path d=\"m15 18-6-6 6-6\"/></symbol>\n  <symbol id=\"i-chevron-up\" viewBox=\"0 0 24 24\"><path d=\"m18 15-6-6-6 6\"/></symbol>\n  <symbol id=\"i-menu\" viewBox=\"0 0 24 24\"><path d=\"M4 6h16M4 12h16M4 18h16\"/></symbol>\n  <symbol id=\"i-filter\" viewBox=\"0 0 24 24\"><path d=\"M3 6h18M7 12h10M10 18h4\"/></symbol>\n  <symbol id=\"i-scan\" viewBox=\"0 0 24 24\"><path d=\"M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10\"/></symbol>\n  <symbol id=\"i-user\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1\"/></symbol>\n  <symbol id=\"i-phone\" viewBox=\"0 0 24 24\"><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z\"/></symbol>\n  <symbol id=\"i-trash\" viewBox=\"0 0 24 24\"><path d=\"M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6\"/></symbol>\n  <symbol id=\"i-minus\" viewBox=\"0 0 24 24\"><path d=\"M5 12h14\"/></symbol>\n  <symbol id=\"i-more-v\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"5\" r=\"1\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"12\" cy=\"19\" r=\"1\"/></symbol>\n  <symbol id=\"i-image\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><circle cx=\"9\" cy=\"9\" r=\"2\"/><path d=\"m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21\"/></symbol>\n  <symbol id=\"i-play\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m10 8 6 4-6 4z\"/></symbol>\n  <symbol id=\"i-heart\" viewBox=\"0 0 24 24\"><path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\"/></symbol>\n  <symbol id=\"i-tag\" viewBox=\"0 0 24 24\"><path d=\"M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z\"/><circle cx=\"7.5\" cy=\"7.5\" r=\".5\"/></symbol>\n  <symbol id=\"i-trend\" viewBox=\"0 0 24 24\"><path d=\"M22 7 13.5 15.5l-5-5L2 17\"/><path d=\"M16 7h6v6\"/></symbol>\n  <symbol id=\"i-help\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01\"/></symbol>\n  <symbol id=\"i-paw\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"4\" r=\"2\"/><circle cx=\"18\" cy=\"8\" r=\"2\"/><circle cx=\"20\" cy=\"16\" r=\"2\"/><path d=\"M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z\"/></symbol>\n  <symbol id=\"i-pin\" viewBox=\"0 0 24 24\"><path d=\"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/></symbol>\n  <symbol id=\"i-clipboard\" viewBox=\"0 0 24 24\"><rect x=\"8\" y=\"2\" width=\"8\" height=\"4\" rx=\"1\"/><path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 13l2 2 4-4\"/></symbol>\n  <symbol id=\"i-megaphone\" viewBox=\"0 0 24 24\"><path d=\"m3 11 18-5v12L3 14v-3z\"/><path d=\"M11.6 16.8a3 3 0 1 1-5.8-1.6\"/></symbol>\n  <symbol id=\"i-refresh\" viewBox=\"0 0 24 24\"><path d=\"M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5\"/></symbol>\n  <symbol id=\"i-smartphone\" viewBox=\"0 0 24 24\"><rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"2\"/><path d=\"M12 18h.01\"/></symbol>\n  <symbol id=\"i-tablet\" viewBox=\"0 0 24 24\"><rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"2\"/><path d=\"M12 18h.01\"/></symbol>\n  <symbol id=\"i-download\" viewBox=\"0 0 24 24\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3\"/></symbol>\n  <symbol id=\"i-maximize\" viewBox=\"0 0 24 24\"><path d=\"M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3\"/></symbol>\n  <symbol id=\"i-minimize\" viewBox=\"0 0 24 24\"><path d=\"M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3\"/></symbol>\n  <symbol id=\"i-scale\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"4\"/><path d=\"M7.5 10a5.5 5.5 0 0 1 9 0\"/><path d=\"m12 10 1.6-2.2\"/></symbol>\n  <symbol id=\"i-treatment\" viewBox=\"0 0 24 24\"><path d=\"M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14\"/><path d=\"m7 18 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9\"/><path d=\"m2 13 6 6\"/><rect x=\"13\" y=\"1.5\" width=\"6\" height=\"6\" rx=\"1\"/><path d=\"M16 3v3M14.5 4.5h3\"/></symbol>\n  <symbol id=\"i-test-tube\" viewBox=\"0 0 24 24\"><path d=\"M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2\"/><path d=\"M8.5 2h7M14.5 16h-5\"/></symbol>\n  <symbol id=\"i-syringe\" viewBox=\"0 0 24 24\"><path d=\"m18 2 4 4M17 7l3-3M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6\"/></symbol>\n  <symbol id=\"i-medicine\" viewBox=\"0 0 24 24\"><path d=\"M9 2h6v3H9z\"/><path d=\"M8 5h8v3l1 2v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V10l1-2z\"/><path d=\"M10 15h4M12 13v4\"/></symbol>\n  <!-- Added for the navigation drawer (1.2) -->\n  <symbol id=\"i-pause\" viewBox=\"0 0 24 24\"><path d=\"M9 5v14M15 5v14\"/></symbol>\n  <symbol id=\"i-play-plain\" viewBox=\"0 0 24 24\"><path d=\"M8 5.5v13l10.5-6.5z\"/></symbol>\n  <symbol id=\"i-utensils\" viewBox=\"0 0 24 24\"><path d=\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\"/><path d=\"M7 2v20\"/><path d=\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\"/></symbol>\n  <symbol id=\"i-chef-hat\" viewBox=\"0 0 24 24\"><path d=\"M17 21a1 1 0 0 0 1-1v-5.35c0-.46.32-.84.73-1.04a4 4 0 0 0-2.14-7.59 5 5 0 0 0-9.18 0 4 4 0 0 0-2.14 7.59c.41.2.73.58.73 1.04V20a1 1 0 0 0 1 1Z\"/><path d=\"M6 17h12\"/></symbol>\n  <symbol id=\"i-package\" viewBox=\"0 0 24 24\"><path d=\"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z\"/><path d=\"M12 22V12\"/><path d=\"m3.3 7 7.7 4.73a2 2 0 0 0 2 0L20.7 7\"/></symbol>\n  <symbol id=\"i-truck\" viewBox=\"0 0 24 24\"><path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\"/><path d=\"M15 18H9\"/><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14\"/><circle cx=\"17\" cy=\"18\" r=\"2\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/></symbol>\n  <symbol id=\"i-bar-chart\" viewBox=\"0 0 24 24\"><path d=\"M3 3v16a2 2 0 0 0 2 2h16\"/><path d=\"M18 17V9M13 17V5M8 17v-3\"/></symbol>\n  <symbol id=\"i-settings\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z\"/></symbol>\n  <symbol id=\"i-book-open\" viewBox=\"0 0 24 24\"><path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z\"/><path d=\"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\"/></symbol>\n  <symbol id=\"i-history\" viewBox=\"0 0 24 24\"><path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"/><path d=\"M3 3v5h5M12 7v5l4 2\"/></symbol>\n  <symbol id=\"i-receipt\" viewBox=\"0 0 24 24\"><path d=\"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z\"/><path d=\"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11\"/></symbol>\n  <symbol id=\"i-globe\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20\"/></symbol>\n  <symbol id=\"i-dashboard\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"9\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"5\" rx=\"1\"/><rect x=\"14\" y=\"12\" width=\"7\" height=\"9\" rx=\"1\"/><rect x=\"3\" y=\"16\" width=\"7\" height=\"5\" rx=\"1\"/></symbol>\n</svg>");

  /* Theme tester frames only need the icon sprite: no chrome, no saved preferences */
  if (document.body.dataset.page === 'tester-frame') return;

  /* Links from the old single page */
  var OLD_LINKS = {"colour": "pages/colour.html#colour", "guardrails": "pages/colour-guardrails.html#guardrails", "contrast": "pages/contrast.html#contrast", "type": "pages/type.html#type", "spacing": "pages/spacing.html#spacing", "radii": "pages/radii.html#radii", "elevation": "pages/elevation.html#elevation", "motion": "pages/motion.html#motion", "icons": "pages/icons.html#icons", "layout": "pages/layout.html#layout", "responsive": "pages/responsive.html#responsive", "buttons": "pages/buttons.html#buttons", "fc-buttons": "pages/buttons.html#fc-buttons", "fields": "pages/text-fields.html#fields", "fc-fields": "pages/text-fields.html#fc-fields", "fc-search": "pages/text-fields.html#fc-search", "selection": "pages/selection.html#selection", "fc-groups": "pages/selection.html#fc-groups", "chips": "pages/chips-and-tabs.html#chips", "fc-chips": "pages/chips-and-tabs.html#fc-chips", "fc-tabs": "pages/chips-and-tabs.html#fc-tabs", "badges": "pages/badges.html#badges", "avatars": "pages/avatars.html#avatars", "cards": "pages/cards.html#cards", "rows": "pages/list-rows.html#rows", "feedback": "pages/alerts-and-toasts.html#feedback", "overlays": "pages/menus-and-dialogs.html#overlays", "progress": "pages/progress.html#progress", "table": "pages/table.html#table", "loading": "pages/loading.html#loading", "nav": "pages/navigation.html#nav", "fc-tabbar": "pages/navigation.html#fc-tabbar", "p-topbar": "pages/top-bar.html#p-topbar", "p-post": "pages/post-card.html#p-post", "p-attachments": "pages/attachments.html#p-attachments", "p-priority": "pages/priority.html#p-priority", "p-lists": "pages/lists.html#p-lists", "p-calendar": "pages/date-picker.html#p-calendar", "p-animal": "pages/animal-card.html#p-animal", "p-progress": "pages/progress-ring.html#p-progress", "s-figures": "pages/stat-figures.html#s-figures", "s-insights": "pages/key-insights.html#s-insights", "s-summary": "pages/insights-summary.html#s-summary", "s-site": "pages/site-card.html#s-site", "s-date": "pages/day-week-month.html#s-date", "voice": "pages/voice.html#voice", "fc-map": "pages/figma-mapping.html#fc-map", "intro": "pages/get-started.html", "principles": "pages/principles.html", "sc-daily": "pages/screens.html", "sc-forms": "pages/screens.html"};

  /* ════════ Site chrome: drawer, nav search, groups, tabs, on this page ════════ */
  var body = document.body;

  /* Old single-page links (index.html#buttons) go to the new page */
  if (body.dataset.page === 'welcome' && location.hash && OLD_LINKS[location.hash.slice(1)]) {
    location.replace(OLD_LINKS[location.hash.slice(1)]);
  }

  /* Drawer (below 1024px) */
  function setNav(open, focusSearch) {
    body.classList.toggle('nav-open', open);
    $$('[data-nav-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', String(open)); });
    // Focus the search only when the search button opened the menu: focusing a field on phones pans the page
    if (open) { var target = focusSearch ? $('.nav-search input') : $('#site-nav [aria-selected="true"]'); if (target) setTimeout(function () { target.focus({ preventScroll: true }); }, 60); }
  }
  // Hamburger: opens the menu drawer below 1024px; on wider screens it retracts or restores the sidebar.
  // The sidebar always loads open (it slides in on every page).
  var wide = window.matchMedia('(min-width: 1024px)');
  try { localStorage.removeItem('antz-ds-nav'); } catch (e) {}
  $$('[data-nav-toggle]').forEach(function (b) {
    if (wide.matches) b.setAttribute('aria-expanded', String(!body.classList.contains('nav-collapsed')));
    b.addEventListener('click', function () {
      if (!wide.matches) { setNav(!body.classList.contains('nav-open')); return; }
      var navEl = document.getElementById('site-nav'), c = !body.classList.contains('nav-collapsed');
      b.setAttribute('aria-expanded', String(!c));
      if (c && navEl) {
        navEl.classList.add('is-leaving');
        var d = parseFloat(getComputedStyle(navEl).animationDuration) || 0;
        setTimeout(function () { navEl.classList.remove('is-leaving'); body.classList.add('nav-collapsed'); }, d * 1000);
      } else body.classList.toggle('nav-collapsed', c);
    });
  });
  $$('[data-nav-search]').forEach(function (b) { b.addEventListener('click', function () { setNav(true, true); }); });
  var scrim = $('.site-scrim'); if (scrim) scrim.addEventListener('click', function () { setNav(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('nav-open')) setNav(false);
    if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      e.preventDefault(); var inp = $('.site-search input'); if (inp && inp.offsetParent) inp.focus(); else setNav(true);
    }
  });

  /* Collapsible groups: the current page's group starts open */
  function setGroup(btn, open) { btn.setAttribute('aria-expanded', String(open)); var list = document.getElementById(btn.getAttribute('aria-controls')); if (list) list.hidden = !open; }
  $$('.nav-group__toggle').forEach(function (b) {
    b.addEventListener('click', function () { setGroup(b, b.getAttribute('aria-expanded') !== 'true'); });
  });

  /* Search filters the nav; Enter opens the first match */
  var navLinks = $$('.site-nav .nav-link');
  function filterNav(q) {
    q = (q || '').trim().toLowerCase();
    var nav = $('.site-nav'); if (!nav) return null;
    var results = $('.nav-results', nav), list = $('.nav-results__list', nav), empty = $('.nav-empty', nav);
    var menus = $$('.navdrawer__menu:not(.nav-results)', nav), first = null;
    if (!results) return null;
    if (!q) { results.hidden = true; menus.forEach(function (m) { var t = document.getElementById(m.getAttribute('aria-labelledby')); m.hidden = !(t && t.getAttribute('aria-selected') === 'true'); }); return null; }
    menus.forEach(function (m) { m.hidden = true; }); results.hidden = false; list.innerHTML = '';
    menus.forEach(function (m) {
      var section = ($('.navdrawer__group', m) || {}).textContent || '';
      $$('.nav-link', m).forEach(function (a) {
        if ((a.textContent + ' ' + section).toLowerCase().indexOf(q) < 0) return;
        var c = a.cloneNode(true); c.insertAdjacentHTML('beforeend', '<small>' + section + '</small>'); list.appendChild(c); if (!first) first = c;
      });
    });
    if (empty) empty.hidden = !!first;
    return first;
  }
  $$('.site-search input, .nav-search input').forEach(function (inp) {
    inp.addEventListener('input', function () {
      $$('.site-search input, .nav-search input').forEach(function (o) { if (o !== inp) o.value = inp.value; });
      filterNav(inp.value);
      if (inp.value && !inp.closest('.site-nav') && window.innerWidth < 1024) setNav(true);
    });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var f = filterNav(inp.value); if (f) location.href = f.href; }
      if (e.key === 'Escape') { inp.value = ''; filterNav(''); }
    });
  });
  var cur = $('.site-nav [aria-current="page"]');
  if (cur && cur.scrollIntoView) { var navBox = $('.site-nav'); if (navBox) navBox.scrollTop = Math.max(0, cur.offsetTop - 160); }

  /* In-page tabs: Overview / Usage / Code */
  var tabs = $$('.page-tabs > [role="tab"]'), panels = $$('.tab-panel');
  function panelOf(el) { return el && el.closest ? el.closest('.tab-panel') : null; }
  function showTab(name, keepHash) {
    if (!tabs.length) return;
    if (!panels.some(function (p) { return p.dataset.tab === name; })) name = panels[0].dataset.tab;
    panels.forEach(function (p) { p.hidden = p.dataset.tab !== name; });
    tabs.forEach(function (t) { var on = t.dataset.tab === name; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    if (!keepHash && history.replaceState) history.replaceState(null, '', name === panels[0].dataset.tab ? location.pathname + location.search : '#' + name);
    buildToc(); fitDevices();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showTab(t.dataset.tab); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); showTab(n.dataset.tab);
    });
  });
  function followHash() {
    var h = decodeURIComponent(location.hash.slice(1));
    if (!h) { if (tabs.length) showTab(panels[0].dataset.tab, true); return; }
    if (tabs.some(function (t) { return t.dataset.tab === h; })) { showTab(h, true); return; }
    var el = document.getElementById(h), p = panelOf(el);
    if (p && tabs.length) showTab(p.dataset.tab, true);
    if (el) setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 0);
  }
  window.addEventListener('hashchange', followHash);

  /* On this page: sections and sub-headings of the visible tab */
  var tocLinks = [], tocIO = null;
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); }
  function buildToc() {
    var toc = $('#page-toc'), bodyEl = $('.page-body'); if (!toc) return;
    var panel = panels.filter(function (p) { return !p.hidden; })[0] || $('.page-content');
    var items = [];
    $$('.doc', panel).forEach(function (doc) {
      if (doc.hidden) return;
      var h = doc.querySelector(':scope > h3'); if (h && doc.id) items.push([doc.id, h.textContent, false]);
      $$(':scope > h4', doc).forEach(function (h4) { if (!h4.id) h4.id = (doc.id || 'sec') + '-' + slug(h4.textContent); items.push([h4.id, h4.textContent, true]); });
    });
    toc.innerHTML = items.length < 2 ? '' : '<h2>On this page</h2>' + items.map(function (it) { return '<a href="#' + it[0] + '"' + (it[2] ? ' class="sub"' : '') + '>' + esc(it[1]) + '</a>'; }).join('');
    if (bodyEl) bodyEl.classList.toggle('no-toc', items.length < 2);
    tocLinks = $$('a', toc);
    if (tocIO) tocIO.disconnect();
    if ('IntersectionObserver' in window && tocLinks.length) {
      tocIO = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) tocLinks.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id); }); });
      }, { rootMargin: '-140px 0px -70% 0px' });
      items.forEach(function (it) { var t = document.getElementById(it[0]); if (t) tocIO.observe(t); });
    }
  }

  /* ════════ Screens: one template, four device frames ════════ */
  var DEVICES = { mobile: [390, 844], 'tablet-p': [820, 1180], 'tablet-l': [1180, 820], desktop: [1440, 900] };
  $$('[data-screen-view]').forEach(function (view) {
    var tpl = $('template', view); if (!tpl) return;
    $$('.device', view).forEach(function (dev) {
      var key = dev.dataset.device, frame = $('.device__frame', dev), node = tpl.content.cloneNode(true), suffix = '-' + key;
      $$('[id]', node).forEach(function (el) { el.id += suffix; });
      $$('label[for]', node).forEach(function (el) { el.setAttribute('for', el.getAttribute('for') + suffix); });
      $$('input[type="radio"][name]', node).forEach(function (el) { el.name += suffix; });
      frame.appendChild(node);
      frame.style.setProperty('--frame-w', DEVICES[key][0] + 'px'); frame.style.setProperty('--frame-h', DEVICES[key][1] + 'px');
      dev.style.setProperty('--w', DEVICES[key][0]);
    });
    var wrap = $('.devices', view), seg = $('.device-bar .segmented', view);
    var saved = null; try { saved = localStorage.getItem('antz-ds-device'); } catch (e) {}
    function setView(v, store) {
      wrap.dataset.view = v;
      $$('.device', view).forEach(function (d) { d.classList.toggle('is-shown', v === 'all' || d.dataset.device === v); });
      if (seg) $$('button', seg).forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.view === v)); });
      var on = seg && $('[aria-selected="true"]', seg);
      if (on) { var over = on.getBoundingClientRect().right - seg.getBoundingClientRect().right; if (over > 0) seg.scrollLeft += over + 4; else if (on.offsetLeft < seg.scrollLeft) seg.scrollLeft = 0; }
      if (store) { try { localStorage.setItem('antz-ds-device', v); } catch (e) {} }
      fitDevices();
    }
    if (seg) $$('button', seg).forEach(function (b) { b.addEventListener('click', function () { setView(b.dataset.view, true); }); });
    $$('.device', view).forEach(function (d) { d.addEventListener('click', function (e) { if (wrap.dataset.view === 'all' && !e.target.closest('button, a, input, label, select, textarea')) setView(d.dataset.device, true); }); });
    setView(saved && (saved === 'all' || DEVICES[saved]) ? saved : 'all');
  });
  function fitDevices() {
    $$('.device').forEach(function (dev) {
      if (!dev.offsetParent) return;
      var d = DEVICES[dev.dataset.device], stage = $('.device__stage', dev), frame = $('.device__frame', dev);
      var bezel = dev.dataset.device === 'desktop' ? 4 : dev.dataset.device === 'mobile' ? 22 : 30;
      var avail = dev.clientWidth - bezel; if (avail <= 0) return;
      var s = Math.min(1, avail / d[0]);
      stage.style.width = Math.floor(d[0] * s) + 'px'; stage.style.height = Math.floor(d[1] * s) + 'px';
      stage.style.margin = Math.round(bezel / 2) + 'px 0';
      frame.style.setProperty('--frame-scale', s);
    });
  }
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(function () { fitDevices(); }); $$('.devices').forEach(function (w) { ro.observe(w); }); }
  window.addEventListener('resize', function () { requestAnimationFrame(fitDevices); });

  /* ── Theme toggle ── */
  function setTheme(mode) {
    if (mode === 'auto') delete root.dataset.theme; else root.dataset.theme = mode;
    try { if (mode === 'auto') localStorage.removeItem('antz-ds-theme'); else localStorage.setItem('antz-ds-theme', mode); } catch (e) {}
    $$('[data-theme-set]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.themeSet === mode)); });
    requestAnimationFrame(renderTokens);
  }
  $$('[data-theme-set]').forEach(function (b) { b.addEventListener('click', function () { setTheme(b.dataset.themeSet); }); });
  setTheme(root.dataset.theme || 'auto');
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { requestAnimationFrame(renderTokens); });
  new MutationObserver(function () { requestAnimationFrame(renderTokens); }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-brand', 'data-contrast', 'data-density'] });

  /* ── Brand: themes imported with tools/import_theme.py (listed in themes/index.json) or applied in this
        browser from the Import theme page (localStorage 'antz-ds-local-themes'). ANTZ is the default.
        The head script applies a saved brand (or ?brand=slug) before first paint; this adds the switcher.
        A theme in this browser wins over the site's copy of the same slug. ── */
  var BASE = (root.dataset.root || '.') + '/';
  var SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  var LOCAL_KEY = 'antz-ds-local-themes';
  var IMPORT_PAGE = BASE + 'pages/import-theme.html';
  var siteBrands = [], brands = [], manifestLoaded = false;
  function okSlug(s) { return typeof s === 'string' && SLUG.test(s) && !/^(antz|light|dark|auto)$/.test(s); }
  function readLocal() {
    var o = null; try { o = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); } catch (e) {}
    return o && o.themes && typeof o.themes === 'object' ? o : { version: 1, themes: {} };
  }
  function writeLocal(o) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(o)); return true; } catch (e) { return false; } }
  function mergeBrands() {
    var local = readLocal().themes, out = [], seen = {};
    siteBrands.forEach(function (t) {
      var l = local[t.slug];
      if (l && l.entry && typeof l.css === 'string') { out.push(Object.assign({}, l.entry, { local: true, overrides: true, localCss: l.css })); seen[t.slug] = 1; }
      else out.push(t);
    });
    Object.keys(local).forEach(function (s) {
      var l = local[s]; if (seen[s] || !okSlug(s) || !l || !l.entry || typeof l.css !== 'string') return;
      out.push(Object.assign({}, l.entry, { local: true, overrides: false, localCss: l.css }));
    });
    brands = out;
  }
  function activeBrand() { var s = root.dataset.brand; for (var i = 0; i < brands.length; i++) if (brands[i].slug === s) return brands[i]; return null; }
  function watchCss(l) { l.addEventListener('load', function () { requestAnimationFrame(renderTokens); if (document.fonts) document.fonts.ready.then(function () { requestAnimationFrame(renderTokens); }); }); }
  function loadBrandCss(slug) {
    var old = document.getElementById('brand-css'), b = null;
    if (!slug) { if (old) old.parentNode.removeChild(old); return; }
    for (var i = 0; i < brands.length; i++) if (brands[i].slug === slug) b = brands[i];
    var el;
    if (b && b.local) {
      if (old && old.tagName === 'STYLE' && old.textContent === b.localCss) return;
      el = document.createElement('style'); el.textContent = b.localCss;
      if (document.fonts) document.fonts.ready.then(function () { requestAnimationFrame(renderTokens); });
    } else {
      var href = BASE + 'themes/' + slug + '.css';
      if (old && old.tagName === 'LINK' && old.getAttribute('href') === href) return;
      el = document.createElement('link'); el.rel = 'stylesheet'; el.href = href; watchCss(el);
    }
    if (old) old.parentNode.removeChild(old);
    el.id = 'brand-css'; document.head.appendChild(el);
  }
  function setBrand(slug, store) {
    if (!slug || slug === 'antz' || !SLUG.test(slug)) slug = null;
    if (slug) root.dataset.brand = slug; else delete root.dataset.brand;
    if (store) { try { if (slug) localStorage.setItem('antz-ds-brand', slug); else localStorage.removeItem('antz-ds-brand'); } catch (e) {} }
    if (store && /[?&]brand=/.test(location.search) && window.history && history.replaceState) {
      var q = location.search.replace(/([?&])brand=[^&]*&?/, '$1').replace(/[?&]$/, '');
      history.replaceState(null, '', location.pathname + q + location.hash);
    }
    loadBrandCss(slug);
    var sel = $('#brand-select'); if (sel) sel.value = slug || 'antz';
    requestAnimationFrame(renderTokens);
  }
  var brandLink = document.getElementById('brand-css'); if (brandLink && brandLink.tagName === 'LINK') watchCss(brandLink);
  function brandLabel(b) {
    var n = String(b.name || b.slug);
    return b.local ? n + (b.overrides ? ' · this browser (overrides site)' : ' · this browser') : n;
  }
  function fillPicker(sel) {
    sel.innerHTML = '<option value="antz">ANTZ</option>' +
      brands.map(function (b) { return '<option value="' + b.slug + '">' + esc(brandLabel(b)) + '</option>'; }).join('') +
      '<option value="__import">Import theme…</option>';
    sel.value = activeBrand() ? root.dataset.brand : 'antz';
  }
  function buildPicker() {
    var seg = $('.site-top .theme-seg'); if (!seg) return;
    var sel = $('#brand-select'); if (sel) { fillPicker(sel); return; }
    var lab = document.createElement('label'); lab.className = 'brand-pick';
    lab.innerHTML = '<span class="sr-only">Brand theme</span><select id="brand-select" title="Brand theme"></select>';
    seg.parentNode.insertBefore(lab, seg);
    sel = $('select', lab); fillPicker(sel);
    var stepKey = 0;   // arrow keys change a closed select on some systems: don't leave the page on those
    sel.addEventListener('keydown', function (e) {
      if (/^(Arrow|Page|Home|End)/.test(e.key)) stepKey = Date.now();
      if (e.key === 'Enter' && sel.value === '__import') location.href = IMPORT_PAGE;
    });
    sel.addEventListener('change', function () {
      if (sel.value === '__import') { if (Date.now() - stepKey > 300) location.href = IMPORT_PAGE; return; }
      setBrand(sel.value, true);
    });
    sel.addEventListener('blur', function () { if (sel.value === '__import') sel.value = activeBrand() ? root.dataset.brand : 'antz'; });
  }
  /* Re-read the themes in this browser (after an import, a removal or a change in another tab) */
  function refreshBrands() {
    mergeBrands();
    if (root.dataset.brand && !activeBrand() && manifestLoaded) setBrand(null, true);
    else if (root.dataset.brand) loadBrandCss(root.dataset.brand);
    buildPicker(); typeFor = null; guardFor = null;
    requestAnimationFrame(renderTokens);
  }
  window.ANTZSite = { setBrand: setBrand, refreshBrands: refreshBrands, rebuildToc: function () { buildToc(); }, brands: function () { return brands.slice(); }, localKey: LOCAL_KEY };
  window.addEventListener('storage', function (e) { if (e.key === LOCAL_KEY || e.key === null) refreshBrands(); });
  mergeBrands();
  function loaded(list) {
    siteBrands = list; manifestLoaded = true;
    // a theme saved into the site files and now served by the site: drop this browser's copy
    var store = readLocal(), dropped = false;
    list.forEach(function (t) { var l = store.themes[t.slug]; if (l && l.savedImportedAt && l.savedImportedAt === t.importedAt) { delete store.themes[t.slug]; dropped = true; } });
    if (dropped) writeLocal(store);
    refreshBrands();
  }
  if (window.fetch) fetch(BASE + 'themes/index.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (m) { loaded((m && Array.isArray(m.themes) ? m.themes : []).filter(function (t) { return t && okSlug(t.slug); })); })
    .catch(function () { /* no manifest (file:// or not deployed): ANTZ and this browser's themes */ manifestLoaded = true; refreshBrands(); });
  else { manifestLoaded = true; refreshBrands(); }

  /* Text that names ANTZ's colours and font: [data-brand-text] keeps the ANTZ wording as its content */
  function brandText(b) {
    $$('[data-brand-text]').forEach(function (el) {
      if (el._antz == null) el._antz = el.innerHTML;
      if (!b) { if (el.innerHTML !== el._antz) el.innerHTML = el._antz; return; }
      var f = b.fonts || {}, body = f.body || 'Inter', head = f.heading || body, w = (f.weights || {})[body] || [];
      var fams = body === head ? body + ' only' : body + ' for text and ' + head + ' for headings';
      var wts = w.length > 1 ? ', weights ' + w[0] + ' to ' + w[w.length - 1] : w.length ? ', weight ' + w[0] : '';
      var v = {
        'accent-name': 'Accent ' + hex(rgb('--color-accent')),
        'bright-name': 'Bright accent ' + hex(rgb('--color-accent-bright')),
        'strong-name': 'Strong fill ' + hex(rgb('--color-surface-strong')),
        'bright-hex': 'the bright accent (' + hex(rgb('--color-accent-bright')) + ')',
        'font-summary': fams + wts + (f.url ? ', loaded from Google Fonts.' : '.'),
        'hero-intro': 'Tokens, components, patterns and guidance for ANTZ products, shown here in the ' + (b.name || b.slug) + ' theme: its own board, cards and accent, and ' +
          (body === head ? body + ' throughout.' : body + ' with ' + head + ' headings.'),
        'font-link': (f.url ? '<link href="' + f.url + '" rel="stylesheet">' : '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap" rel="stylesheet">') +
          '\n<link rel="stylesheet" href="design-system-foundation/themes/' + b.slug + '.css">  <!-- with <html data-brand="' + b.slug + '"> -->'
      }[el.dataset.brandText];
      if (v != null && el.textContent !== v) el.textContent = v;
    });
  }

  /* Colour guardrails: the static table is ANTZ's (tools/colors.py html). A brand shows its own figures,
     worked out by the importer for light and dark and stored in themes/index.json. */
  var guard = $('#guardrail-pairs tbody'), guardAntz = guard && guard.innerHTML, guardFor = 'antz';
  function guardrails(b) {
    if (!guard) return;
    var key = b ? b.slug : 'antz'; if (key === guardFor) return; guardFor = key;
    if (!b || !Array.isArray(b.contrast)) { guard.innerHTML = guardAntz; return; }
    function chips(r, kind) {
      if (kind === 'exempt') return '<span class="t-caption">Exempt</span>';
      if (r == null) return '';
      var v = kind === 'ui' ? [['UI 3:1', r >= 3]] : [['AA', r >= 4.5], ['AA large', r >= 3], ['UI 3:1', r >= 3]];
      return v.map(function (x) { return '<span class="' + (x[1] ? 'pass' : 'fail') + '">' + x[0] + '</span>'; }).join(' ');
    }
    function num(r) { return r == null ? '–' : r.toFixed(2); }
    guard.innerHTML = b.contrast.map(function (x) {
      var sample = x.kind === 'ui' ? '<span class="aa-sample" style="background:var(' + x.bg + ');box-shadow:inset 0 0 0 3px var(' + x.fg + ');color:var(--color-text)">UI</span>'
        : '<span class="aa-sample" style="background:var(' + x.bg + ');color:var(' + x.fg + ')">Aa</span>';
      return '<tr><td>' + sample + '</td><td><code>' + x.fg + '</code> on <code>' + x.bg + '</code><br><span class="t-caption">' + esc(String(x.use)) + '</span></td>' +
        '<td class="num"><b>' + num(x.light) + '</b></td><td>' + chips(x.light, x.kind) + '</td><td class="num"><b>' + num(x.dark) + '</b></td><td>' + chips(x.dark, x.kind) + '</td></tr>';
    }).join('');
  }

  /* ── Colour helpers: resolve any token to rgb via a probe ── */
  var probe = document.createElement('span'); probe.style.display = 'none'; document.body.appendChild(probe);
  function rgb(token) { probe.style.color = ''; probe.style.color = 'var(' + token + ')'; var m = getComputedStyle(probe).color.match(/[\d.]+/g) || [0, 0, 0]; return m.slice(0, 4).map(Number); }
  function hex(c) { return '#' + c.slice(0, 3).map(function (v) { return Math.round(v).toString(16).padStart(2, '0'); }).join('').toUpperCase() + (c.length > 3 && c[3] < 1 ? ' · ' + Math.round(c[3] * 100) + '%' : ''); }
  function lum(c) { var a = c.slice(0, 3).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  var semantic = [
    ['--color-brand-primary', 'Brand primary #37BD69: logo, brand moments'], ['--color-brand-secondary', 'Brand secondary (teal)'], ['--color-brand-tertiary', 'Brand tertiary (navy)'],
    ['--color-bg-app', 'Page background (the green board)'], ['--color-bg-canvas', 'Main canvas panel'], ['--color-surface', 'Cards, header, panels'], ['--color-surface-raised', 'Menus, dialogs, popovers'], ['--color-surface-sunken', 'Rows and grouped areas'], ['--color-surface-tertiary', 'Navy feature fill'],
    ['--color-text', 'Primary text'], ['--color-text-secondary', 'Secondary text, labels'], ['--color-text-muted', 'Meta, captions (AA)'], ['--color-text-link', 'Links'], ['--color-text-on-accent', 'Label on the brand fill'], ['--color-text-disabled', 'Disabled text (exempt from AA)'],
    ['--color-border', 'Hairlines, card outlines'], ['--color-border-subtle', 'Dividers inside cards'], ['--color-border-strong', 'Outline buttons, choice cards'], ['--color-border-input', 'Field borders (3:1)'],
    ['--color-accent', 'Brand fill: main button, active pill (fill only on light)'], ['--color-accent-hover', 'Brand fill hover'], ['--color-accent-text', 'Brand-coloured text and outlines'], ['--color-accent-indicator', 'Thin indicators: tabs, progress, switch, checkbox'], ['--color-accent-soft', 'Secondary button, active nav'], ['--color-accent-bright', 'Highlight fill (New tag)'],
    ['--color-secondary-solid', 'Secondary (teal) solid'], ['--color-tertiary-solid', 'Tertiary (navy) solid'],
    ['--color-success-bg', 'Success fill'], ['--color-success-text', 'Success text'], ['--color-warning-bg', 'Warning (coral) fill'], ['--color-warning-text', 'Warning text'], ['--color-caution-bg', 'Caution (amber) fill'], ['--color-caution-text', 'Caution text'], ['--color-danger-bg', 'Danger fill'], ['--color-danger-text', 'Danger text'], ['--color-info-bg', 'Info fill'], ['--color-info-text', 'Info text'],
    ['--color-focus', 'Focus ring']
  ];
  var hues = ['green', 'teal', 'sky', 'coral', 'amber', 'violet', 'navy'];
  var TONES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98];
  function ramp(f, extra) { return (extra || []).map(function (x) { return '--' + f + '-' + x; }).concat(TONES.map(function (t) { return '--' + f + '-' + t; })); }
  var ramps = {
    'Green (primary, key #37BD69)': ramp('green', ['brand', 'tint', 'soft']),
    'Teal (secondary, key #00D9C7)': ramp('teal', ['brand', 'tint']),
    'Navy (tertiary, key #1F415B)': ramp('navy', ['brand', 'tint']),
    'Board and ink (Antz core neutrals)': ['--board-app', '--board-canvas', '--ink-0', '--ink-25', '--ink-50', '--ink-75', '--ink-100', '--ink-150', '--ink-200', '--ink-300', '--ink-400', '--ink-450', '--ink-500', '--ink-550', '--ink-700', '--ink-900'],
    'Night (dark-theme neutrals)': ['--night-0', '--night-5', '--night-10', '--night-15', '--night-20', '--night-25', '--night-30', '--night-35', '--night-50', '--night-55', '--night-65', '--night-75', '--night-95'],
    'Olive (success)': ramp('olive', ['brand', 'tint']), 'Coral (warning)': ramp('coral', ['brand', 'tint']), 'Amber (caution)': ramp('amber', ['brand', 'tint']),
    'Red (error)': ramp('red', ['brand']), 'Sky (info)': ramp('sky', ['brand', 'tint']),
    'Gradient stops (reference SVGs)': ['--wash-mint', '--wash-rose', '--wash-butter', '--wash-aqua', '--wash-sky', '--wash-pink']
  };
  var derived = ['--green-brand', '--teal-brand', '--navy-brand'];
  // [fg, bg, kind] kind: text (4.5), large (3), ui (3)
  var pairs = [
    ['--color-text', '--color-surface', 'text'], ['--color-text-secondary', '--color-surface', 'text'], ['--color-text-muted', '--color-surface', 'text'], ['--color-text-muted', '--color-bg-canvas', 'text'], ['--color-text-muted', '--color-surface-sunken', 'text'], ['--color-text', '--color-bg-app', 'text'], ['--color-text-link', '--color-surface', 'text'],
    ['--color-text-on-accent', '--color-accent', 'text'], ['--color-accent-text', '--color-accent-soft', 'text'], ['--color-accent-text', '--color-surface', 'text'], ['--color-accent-indicator', '--color-surface', 'ui'], ['--color-caution-text', '--color-caution-bg', 'text'], ['--color-text-on-tertiary', '--color-surface-tertiary', 'text'],
    ['--color-success-text', '--color-success-bg', 'text'], ['--color-warning-text', '--color-warning-bg', 'text'], ['--color-danger-text', '--color-danger-bg', 'text'], ['--color-danger-text', '--color-surface', 'text'], ['--color-info-text', '--color-info-bg', 'text'], ['--color-danger-on-solid', '--color-danger-solid', 'text'],
    ['--color-text-inverse', '--color-surface-inverse', 'text'], ['--color-text-on-strong', '--color-surface-strong', 'text'],
    ['--hue-teal-ink', '--hue-teal-soft', 'text'], ['--hue-coral-ink', '--hue-coral-soft', 'text'], ['--hue-amber-ink', '--hue-amber-soft', 'text'], ['--hue-violet-ink', '--hue-violet-soft', 'text'], ['--hue-sky-ink', '--hue-sky-soft', 'text'], ['--hue-navy-ink', '--hue-navy-soft', 'text'],
    ['--color-border-input', '--color-surface', 'ui'], ['--color-focus', '--color-surface', 'ui'], ['--color-focus', '--color-bg-canvas', 'ui'], ['--color-accent', '--color-surface', 'ui'], ['--color-signal-danger', '--color-surface', 'ui'], ['--color-text-muted', '--color-surface', 'ui'],
    ['--ink-500', '--ink-0', 'text', 'Style 6 grey as text (replaced)'], ['--green-brand', '--ink-0', 'text', 'Brand green as text on white (never)']
  ];
  var typeRows = [
    ['t-display', '--text-display', '48–72px fluid · 400 · −0.045em', 'Hero figure'],
    ['t-title-xl', '--text-5xl', '36px · 600 · −0.03em', 'Page title'],
    ['t-title-lg', '--text-4xl', '28px · 700 · −0.02em', 'Greeting, section title'],
    ['t-stat', '--text-6xl', '48px · 300 · −0.05em', 'Stat number'],
    ['t-title-md', '--text-3xl', '24px · 600 · −0.02em', 'Card figure, brand'],
    ['t-title-sm', '--text-2xl', '20px · 600 · −0.01em', 'Dialog, widget title'],
    ['t-heading', '--text-xl', '18px · 600', 'Panel heading'],
    ['card__title', '--text-lg', '16px · 600', 'Card title, input text'],
    ['t-label', '--text-md', '14px · 600', 'Labels, buttons'],
    ['t-body', '--text-md', '14px · 400 · 1.45', 'Body'],
    ['t-small', '--text-sm', '13px · 400', 'Secondary body'],
    ['t-caption', '--text-xs', '12px · 400', 'Meta, captions'],
    ['t-overline', '--text-2xs', '11px · 700 · +0.08em · caps', 'Overline']
  ];
  var spaces = ['--space-0-5', '--space-1', '--space-1-5', '--space-2', '--space-2-5', '--space-3', '--space-3-5', '--space-4', '--space-4-5', '--space-5', '--space-6', '--space-6-5', '--space-8', '--space-10', '--space-12', '--space-16'];
  var radii = ['--radius-xs', '--radius-sm', '--radius-control', '--radius-md', '--radius-lg', '--radius-xl', '--radius-2xl', '--radius-full'];
  var shadows = [['--shadow-xs', 'Selected segment'], ['--shadow-sm', 'Cards (Style 6 --sh)'], ['--shadow-md', 'Card hover'], ['--shadow-float', 'Dock, toast'], ['--shadow-lg', 'Menus, popovers'], ['--shadow-xl', 'Dialogs']];
  var motions = [['--duration-fast', '--ease-standard', '150ms · colour'], ['--duration-base', '--ease-move', '200ms · lift and press (elastic)'], ['--duration-moderate', '--ease-move', '250ms · card hover, menu and dialog in (elastic)'], ['--duration-slow', '--ease-spring', '350ms · expand'], ['--duration-slower', '--ease-spring', '500ms · sliding pill, dialog'], ['--duration-enter', '--ease-out', '420ms · cards entering'], ['--duration-fast', '--ease-exit', '150ms · leaving (exit)'], ['--duration-moderate', '--ease-in-out', '250ms · symmetric swap'], ['--duration-slower', '--ease-elastic', '500ms · elastic settle (tab indicator)']];
  var icons = ['search', 'bell', 'plus', 'pencil', 'check', 'x', 'chevron-down', 'chevron-right', 'arrow-up-right', 'swap', 'send', 'mic', 'clip', 'sliders', 'users', 'chat', 'shield', 'clock', 'alert', 'info', 'lock', 'eye', 'grid', 'plug', 'zap', 'sun', 'moon', 'monitor', 'file', 'calendar', 'home', 'more', 'memory', 'arrow-left', 'arrow-right', 'chevron-left', 'chevron-up', 'menu', 'filter', 'scan', 'user', 'phone', 'trash', 'minus', 'more-v', 'image', 'play', 'heart', 'tag', 'trend', 'help', 'paw', 'pin', 'clipboard', 'megaphone', 'refresh', 'download', 'smartphone', 'tablet'];

  function cssVal(t) { return getComputedStyle(root).getPropertyValue(t).trim(); }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  var HEADING_TYPES = ['t-display', 't-title-xl', 't-title-lg', 't-title-md', 't-title-sm', 't-heading', 'card__title'];
  var typeFor = null;
  function renderTokens() {
    var t, b = activeBrand();
    brandText(b); guardrails(b);
    if ((t = $('#type-table tbody')) && typeFor !== (b ? b.slug : '')) {
      typeFor = b ? b.slug : '';
      t.innerHTML = typeRows.map(function (r) {
        var fam = b && b.fonts ? (HEADING_TYPES.indexOf(r[0]) > -1 ? b.fonts.heading : b.fonts.body) + ' · ' : '';
        return '<tr><td><span class="' + r[0] + '" style="display:block;white-space:nowrap">Good morning</span></td><td><code>' + r[1] + '</code><br><code>.' + r[0] + '</code></td><td>' + esc(fam) + r[2] + '</td><td>' + r[3] + '</td></tr>';
      }).join('');
    }
    if ((t = $('#semantic-table tbody'))) t.innerHTML = semantic.map(function (r) {
      return '<tr><td><span class="sw" style="background:var(' + r[0] + ')"></span></td><td><code>' + r[0] + '</code></td><td><code>' + hex(rgb(r[0])) + '</code></td><td>' + r[1] + '</td></tr>';
    }).join('');
    if ((t = $('#hue-ramp'))) t.innerHTML = hues.map(function (a) {
      return '<div class="chipsw"><span style="background:var(--hue-' + a + ')"></span><span><b>' + a + '</b>--hue-' + a + '<br>' + hex(rgb('--hue-' + a)) + '</span></div>';
    }).join('');
    if ((t = $('#primitive-ramps'))) t.innerHTML = Object.keys(ramps).map(function (k) {
      return '<div class="ramp-name">' + k + '</div><div class="ramp">' + ramps[k].map(function (v) {
        return '<div class="chipsw"><span style="background:var(' + v + ')"></span><span><b>' + v.replace('--', '') + '</b>' + hex(rgb(v)) + (derived.indexOf(v) > -1 ? '<br>derived' : '') + '</span></div>';
      }).join('') + '</div>';
    }).join('');
    if ((t = $('#contrast-table tbody'))) t.innerHTML = pairs.map(function (p) {
      var r = ratio(rgb(p[0]), rgb(p[1])); var need = p[2] === 'text' ? 4.5 : 3; var ok = r >= need;
      var sample = p[2] === 'ui' ? '<span class="aa-sample" style="background:var(' + p[1] + ');box-shadow:inset 0 0 0 2px var(' + p[0] + ');color:var(--color-text)">Border</span>' : '<span class="aa-sample" style="background:var(' + p[1] + ');color:var(' + p[0] + ')">Aa text</span>';
      return '<tr><td>' + sample + '</td><td><code>' + p[0] + '</code> on <code>' + p[1] + '</code>' + (p[3] ? '<br><span class="t-caption">' + p[3] + '</span>' : '') + '</td><td class="num"><b>' + r.toFixed(2) + '</b>:1</td><td>' + (p[2] === 'text' ? 'AA text 4.5' : 'UI / large 3') + '</td><td><span class="' + (ok ? 'pass' : 'fail') + '">' + (ok ? 'Pass' : 'Fail') + '</span></td></tr>';
    }).join('');
  }
  var el;
  if ((el = $('#space-list'))) el.innerHTML = spaces.map(function (t) { return '<div class="spacebar"><code>' + t + '</code><span>' + cssVal(t) + '</span><i style="width:var(' + t + ')"></i></div>'; }).join('');
  if ((el = $('#radius-list'))) el.innerHTML = radii.map(function (t) { return '<div class="cell" style="align-items:center"><div class="radius-box" style="border-radius:var(' + t + ')"></div><code>' + t + '</code><span class="t-caption">' + cssVal(t) + '</span></div>'; }).join('');
  if ((el = $('#elev-list'))) el.innerHTML = shadows.map(function (s) { return '<div class="elev-box" style="box-shadow:var(' + s[0] + ')"><span><code>' + s[0] + '</code><br>' + s[1] + '</span></div>'; }).join('');
  if ((el = $('#motion-list'))) el.innerHTML = motions.map(function (m) { return '<div class="cell"><span class="t-small"><code>' + m[0] + '</code> + <code>' + m[1] + '</code> · ' + m[2] + '</span><div class="motion-track"><i style="transition-duration:var(' + m[0] + ');transition-timing-function:var(' + m[1] + ')"></i></div></div>'; }).join('');
  if ((el = $('#motion-play'))) el.addEventListener('click', function () { $$('.motion-track').forEach(function (t) { t.classList.toggle('is-on'); }); });
  if ((el = $('#icon-grid'))) el.innerHTML = icons.map(function (i) { return '<div><svg class="icon"><use href="#i-' + i + '"/></svg>' + i + '</div>'; }).join('');
  renderTokens();

  /* ── Demos ── */
  $$('[data-demo-loading]').forEach(function (b) { b.addEventListener('click', function () { b.classList.add('is-loading'); b.setAttribute('aria-busy', 'true'); setTimeout(function () { b.classList.remove('is-loading'); b.removeAttribute('aria-busy'); }, 1600); }); });
  $$('.chip[aria-pressed]').forEach(function (c) { c.addEventListener('click', function () { c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')); }); });
  $$('.segmented:not(.theme-seg)').forEach(function (g) {
    var attr = g.getAttribute('role') === 'tablist' ? 'aria-selected' : 'aria-pressed';
    $$('button', g).forEach(function (b) { b.addEventListener('click', function () { $$('button', g).forEach(function (x) { x.setAttribute(attr, String(x === b)); }); }); });
  });
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = '<svg class="icon"><use href="#i-check"/></svg><span>' + esc(msg) + '</span>';
    var region = $('#toasts'); if (!region) return; region.appendChild(t); setTimeout(function () { t.remove(); }, 3800);
  }
  /* ── Demos for the Figma components ── */
  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  $$('[data-calendar]').forEach(function (cal) {
    var p = cal.dataset.calendar.split('-'), y = +p[0], m = +p[1] - 1;
    var today = { y: y, m: m, d: +cal.dataset.today || 0 }, picked = { y: y, m: m, d: +cal.dataset.selected || 0 };
    var grid = $('.calendar__grid', cal), title = $('.calendar__title', cal);
    function draw() {
      var lead = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), prev = new Date(y, m, 0).getDate();
      var html = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(function (d) { return '<span class="calendar__dow" aria-hidden="true">' + d + '</span>'; }).join('');
      for (var i = lead; i > 0; i--) html += '<button type="button" class="calendar__day is-outside" disabled tabindex="-1">' + (prev - i + 1) + '</button>';
      for (var d = 1; d <= days; d++) {
        var isToday = today.y === y && today.m === m && today.d === d, isPicked = picked.y === y && picked.m === m && picked.d === d;
        html += '<button type="button" class="calendar__day" data-day="' + d + '" aria-label="' + d + ' ' + monthNames[m] + ' ' + y + '"' + (isToday ? ' aria-current="date"' : '') + ' aria-pressed="' + isPicked + '">' + d + '</button>';
      }
      var tail = (7 - (lead + days) % 7) % 7;
      for (var t = 1; t <= tail; t++) html += '<button type="button" class="calendar__day is-outside" disabled tabindex="-1">' + t + '</button>';
      grid.innerHTML = html; title.textContent = monthNames[m] + ' ' + y;
    }
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.calendar__day'); if (!b || b.disabled) return;
      picked = { y: y, m: m, d: +b.dataset.day };
      $$('.calendar__day[data-day]', grid).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });
    $$('[data-cal-step]', cal).forEach(function (b) { b.addEventListener('click', function () { m += +b.dataset.calStep; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } draw(); }); });
    draw();
  });
  /* ── Motion helpers: read duration tokens, so reduced motion makes them 0 ── */
  function ms(token) { var v = getComputedStyle(root).getPropertyValue(token).trim(); return v.indexOf('ms') > -1 ? parseFloat(v) : parseFloat(v) * 1000 || 0; }
  function crossfade(el, apply) {
    var d = ms('--duration-fast');
    if (!d) { apply(); return; }
    el.classList.add('is-swapping');
    setTimeout(function () { apply(); el.classList.remove('is-swapping'); }, d);
  }

  /* Key insights: switching the period crossfades the figures */
  $$('[data-stat-tabs]').forEach(function (g) {
    $$('[role="tab"]', g).forEach(function (b) { b.addEventListener('click', function () {
      var vals = b.dataset.values.split(','), box = g.parentElement;
      crossfade(box, function () { $$('.stat__value', box).forEach(function (v, i) { if (vals[i] !== undefined) v.textContent = vals[i]; }); });
    }); });
  });

  /* Day, week, month: the stepper label follows the span and crossfades */
  $$('[data-stepper]').forEach(function (s) {
    var off = 0, out = $('.stepper__label', s), wrap = s.closest('.date-switch'), seg = wrap && $('.segmented', wrap);
    function span() { var b = seg && $('[aria-selected="true"]', seg); return b ? b.textContent.trim().toLowerCase() : 'day'; }
    function label() {
      var sp = span(), d = new Date();
      if (sp === 'week') {
        if (off === 0) return 'This week'; if (off === -1) return 'Last week'; if (off === 1) return 'Next week';
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + off * 7); return 'Week of ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      }
      if (sp === 'month') {
        if (off === 0) return 'This month'; if (off === -1) return 'Last month'; if (off === 1) return 'Next month';
        return new Date(d.getFullYear(), d.getMonth() + off, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      }
      if (off === 0) return 'Today'; if (off === -1) return 'Yesterday'; if (off === 1) return 'Tomorrow';
      d.setDate(d.getDate() + off); return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    function render() {
      var sp = span();
      $$('[data-step]', s).forEach(function (b) { b.setAttribute('aria-label', (b.dataset.step === '-1' ? 'Previous ' : 'Next ') + sp); });
      crossfade(out, function () { out.textContent = label(); });
    }
    $$('[data-step]', s).forEach(function (b) { b.addEventListener('click', function () { off += +b.dataset.step; render(); }); });
    if (seg) $$('button', seg).forEach(function (b) { b.addEventListener('click', function () { off = 0; setTimeout(render, 0); }); });
    render();
  });

  /* ── Cards rise into view, figures count up once ── */
  var CARDS = '.card, .stat-card, .site-card, .post, .animal, .file-tile, .list > .row, .row--alert';
  function countUp(v) {
    if (v.dataset.counted || v.dataset.counting) return; v.dataset.counted = '1';
    var txt = v.textContent.trim(), m = txt.match(/^([^\d]*)([\d,]*\.?\d+)(.*)$/), dur = ms('--duration-count');
    if (!m || !dur) return;
    v.dataset.counting = '1';
    var target = parseFloat(m[2].replace(/,/g, '')), dec = (m[2].split('.')[1] || '').length, comma = m[2].indexOf(',') > -1, t0 = null;
    function fmt(n) { return m[1] + (comma ? n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : n.toFixed(dec)) + m[3]; }
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      v.textContent = k < 1 ? fmt(target * e) : txt;
      if (k < 1) requestAnimationFrame(step); else delete v.dataset.counting;
    }
    requestAnimationFrame(step);
  }
  function reveal(el, i) {
    el.style.setProperty('--i', Math.min(i, 8));
    el.classList.remove('reveal-wait'); el.classList.add('reveal-in');
    el.addEventListener('animationend', function done(ev) {
      if (ev.target !== el || ev.animationName !== 'ds-rise') return;
      el.classList.remove('reveal-in'); el.removeEventListener('animationend', done);
    });
  }
  var cardIO = null, statIO = null;
  if ('IntersectionObserver' in window) {
    cardIO = new IntersectionObserver(function (es) {
      var n = 0;
      es.forEach(function (e) { if (e.isIntersecting) { cardIO.unobserve(e.target); reveal(e.target, n++); } });
    }, { threshold: 0 });
    statIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { statIO.unobserve(e.target); countUp(e.target); } });
    }, { threshold: 0.6 });
    $$(CARDS).forEach(function (el) {
      if (el.closest('.eg, .never, .device__frame') || (el.parentElement && el.parentElement.closest(CARDS))) return;
      el.classList.add('reveal-wait'); cardIO.observe(el);
    });
    $$('.stat__value').forEach(function (v) { if (!v.closest('.eg')) statIO.observe(v); });
  }

  /* Motion section: replay the card entrance, rail and count-up */
  var replay = $('#card-motion-replay');
  if (replay) replay.addEventListener('click', function () {
    var cards = $$('#card-motion-demo > *');
    cards.forEach(function (el) { el.classList.remove('reveal-in'); el.classList.add('reveal-wait'); });
    void document.body.offsetWidth;
    requestAnimationFrame(function () {
      cards.forEach(function (el, i) { reveal(el, i); });
      $$('#card-motion-demo .stat__value').forEach(function (v) { delete v.dataset.counted; countUp(v); });
    });
  });

  $$('[data-list-toggle]').forEach(function (b) { b.addEventListener('click', function () {
    var open = b.getAttribute('aria-expanded') !== 'false', list = b.closest('.list');
    b.setAttribute('aria-expanded', String(!open)); list.dataset.collapsed = String(open);
    $('use', b).setAttribute('href', open ? '#i-chevron-down' : '#i-chevron-up');
  }); });
  /* Remove buttons on chips, file tiles and rows (demo only) */
  document.addEventListener('click', function (e) {
    var r = e.target.closest('.chip__remove, .file-tile__remove, [data-remove]'); if (!r) return;
    var item = r.closest('.chip, .file-tile, .row'); if (item) item.parentNode.removeChild(item);
  });
  var td = $('#toast-demo'); if (td) td.addEventListener('click', function () { toast('Report saved. It goes out every Monday at 8am.'); });

  /* ── Contrast and density (Antz Design System 1.0) ── */
  function setContrast(v, store) {
    if (v === 'high') root.dataset.contrast = 'high'; else delete root.dataset.contrast;
    if (store !== false) try { if (v === 'high') localStorage.setItem('antz-ds-contrast', 'high'); else localStorage.removeItem('antz-ds-contrast'); } catch (e) {}
    $$('[data-contrast-set]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.contrastSet === (v === 'high' ? 'high' : 'standard'))); });
    $$('[data-contrast-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', String(v === 'high')); });
  }
  function setDensity(v, store) {
    if (v === 'compact') root.dataset.density = 'compact'; else delete root.dataset.density;
    if (store !== false) try { if (v === 'compact') localStorage.setItem('antz-ds-density', 'compact'); else localStorage.removeItem('antz-ds-density'); } catch (e) {}
    $$('[data-density-set]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.densitySet === (v === 'compact' ? 'compact' : 'comfortable'))); });
  }
  $$('[data-contrast-set]').forEach(function (b) { b.addEventListener('click', function () { setContrast(b.dataset.contrastSet); }); });
  $$('[data-contrast-toggle]').forEach(function (b) { b.addEventListener('click', function () { setContrast(root.dataset.contrast === 'high' ? 'standard' : 'high'); }); });
  $$('[data-density-set]').forEach(function (b) { b.addEventListener('click', function () { setDensity(b.dataset.densitySet); }); });
  setContrast(root.dataset.contrast, false); setDensity(root.dataset.density, false);

  /* ── Governance tables: rules, exceptions, versions (read live from the repo) ── */
  function escH(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function getJSON(rel) { return window.fetch ? fetch(BASE + rel, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }) : Promise.reject(); }
  var ruleBody = $('#rules-table tbody');
  if (ruleBody) getJSON('governance/rules.json').then(function (d) {
    var tone = { check: 'success', build: 'info', release: 'info', review: 'neutral' };
    ruleBody.innerHTML = d.rules.map(function (r) { return '<tr><td><code>' + escH(r.id) + '</code><br><span class="t-caption">' + escH(r.area) + '</span></td><td>' + escH(r.statement) + (r.source ? '<br><span class="t-caption">From ' + escH(r.source) + '</span>' : '') + '</td><td><span class="status status--plain status--' + (tone[r.enforcedBy] || 'neutral') + '">' + escH(r.enforcedBy) + '</span></td><td class="t-small">' + escH(r.owner) + '</td></tr>'; }).join('');
  }).catch(function () { ruleBody.innerHTML = '<tr><td colspan="4" class="t-caption">Open the site through a local server to load governance/rules.json.</td></tr>'; });
  var excBody = $('#exceptions-table tbody');
  if (excBody) getJSON('governance/exceptions.json').then(function (d) {
    var today = new Date().toISOString().slice(0, 10);
    excBody.innerHTML = d.exceptions.length ? d.exceptions.map(function (x) { var live = x.expires >= today; return '<tr><td><code>' + escH(x.id) + '</code></td><td class="t-small">' + x.rules.map(function (r) { return '<code>' + escH(r) + '</code>'; }).join(' ') + '</td><td><code>' + escH(x.files.join(', ')) + '</code></td><td class="t-small">' + escH(x.reason) + '</td><td><span class="status status--' + (live ? 'caution' : 'danger') + '">' + escH(x.expires) + (live ? '' : ' · expired') + '</span></td></tr>'; }).join('') : '<tr><td colspan="5" class="t-caption">No exceptions.</td></tr>';
  }).catch(function () { excBody.innerHTML = '<tr><td colspan="5" class="t-caption">Open the site through a local server to load governance/exceptions.json.</td></tr>'; });
  var verBody = $('#versions-table tbody');
  if (verBody) getJSON('releases/index.json').then(function (d) {
    verBody.innerHTML = d.versions.length ? d.versions.map(function (v) { return '<tr><td><b>v' + escH(v.version) + '</b>' + (v.version === d.latest ? ' <span class="status status--success status--plain">latest</span>' : '') + '</td><td>' + escH(v.channel) + '</td><td>' + escH(v.date) + '</td><td><code>' + escH(v.commit) + '</code></td><td><a class="btn btn--sm btn--outline-brand" href="' + BASE + escH(v.path) + 'index.html">Open</a></td></tr>'; }).join('') : '<tr><td colspan="5" class="t-caption">Nothing published yet.</td></tr>';
  }).catch(function () { verBody.innerHTML = '<tr><td colspan="5" class="t-caption">No releases/index.json yet, or the site is opened from the file system.</td></tr>'; });


  followHash(); buildToc(); fitDevices();
})();

/* Home hero: cycle the banner photos every 7 seconds (each loads just before its turn); still under reduced motion; pause button; pauses in background tabs */
(function () {
  var box = document.querySelector('.hero__patterns'); if (!box) return;
  var layers = Array.prototype.slice.call(box.children), i = 0, timer = null, paused = false;
  function load(k) { var l = layers[k % layers.length]; if (l && l.dataset.bg && !l.style.backgroundImage) l.style.backgroundImage = 'url("' + l.dataset.bg + '")'; }
  load(0); load(1);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)'), btn = document.querySelector('.hero__pause');
  function next() { layers[i].classList.remove('is-on'); i = (i + 1) % layers.length; load(i); layers[i].classList.add('is-on'); load(i + 1); }
  function start() { if (timer || paused || reduce.matches || document.hidden) return; timer = setInterval(next, 7000); }
  function stop() { clearInterval(timer); timer = null; }
  if (btn) btn.addEventListener('click', function () {
    paused = !paused; btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', paused ? 'Play the background animation' : 'Pause the background animation');
    btn.querySelector('use').setAttribute('href', paused ? '#i-play-plain' : '#i-pause');
    if (paused) stop(); else start();
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) stop(); else start(); });
  start();
})();
