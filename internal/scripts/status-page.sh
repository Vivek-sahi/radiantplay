#!/usr/bin/env bash
# Shared page parts for the project canvas: the style block, the look and mode
# bootstrap, and the page script. internal/scripts/status.sh sources this file,
# and both the maintainer canvas and the designer canvas
# (internal/scripts/status-designer.sh) call these functions, so the two pages
# share one look. The heredocs are unquoted on purpose: STATUS_LOOK expands
# when a function runs.

# <style> through the marked.js tag, for <head>. Reads STATUS_LOOK.
canvas_style() {
  cat <<CANVAS_STYLE
<style>
  /* ─────────────────────────────────────────────────────────────────────
     Two looks, one token layer.

     "ascii"  Modern ASCII, the repo canon: flat squares, JetBrains-style mono
              labels, warm amber as the only accent, 1px visible borders.
     "studio" borrowed from the agentspot Data Apps canvas: rounded surfaces,
              sans labels, indigo links, a soft peach wash behind the header.

     Every component below reads the semantic tokens only, so the look toggle
     changes shape, label voice and accent, not just hue. Blocks are ordered
     base, ascii dark, studio light, studio dark; the combined selector is the
     most specific, so it wins for studio in dark.
     ───────────────────────────────────────────────────────────────────── */
  :root {
    --sans: ui-sans-serif, -apple-system, "SF Pro Text", "Inter", system-ui, sans-serif;
    --mono: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Monaco, Consolas, monospace;

    /* Modern ASCII palette */
    --cream-00: #faf7ee; --cream-10: #f5f1e8; --cream-20: #ede7d6; --cream-30: #e0d8c0;
    --ink-90: #0f172a;
    --ink-70: rgba(15,23,42,.72); --ink-55: rgba(15,23,42,.55);
    --ink-40: rgba(15,23,42,.40); --ink-25: rgba(15,23,42,.25);

    /* Semantic hues, separate from the accent */
    --green: #166534; --green-bg: rgba(22,101,52,.09);
    --amber: #92600a; --amber-deep: #78500a;
    --amber-bg: rgba(146,96,10,.08); --amber-border: rgba(146,96,10,.22);
    --red: #991b1b; --red-bg: rgba(153,27,27,.08);
    --blue: #1d4ed8; --purple: #6d28d9;

    /* Surfaces and lines */
    --page-bg: var(--cream-00);
    --page-grad: none;
    --wash-op: 0;
    --surface: var(--cream-10);
    --surface-2: var(--cream-20);
    --hover: rgba(146,96,10,.05);
    --border: var(--amber-border);
    --border-strong: rgba(146,96,10,.40);
    --row-border: var(--amber-border);
    --th-bg: transparent;
    --code-bg: var(--amber-bg);

    /* Text */
    --text: var(--ink-90); --text-2: var(--ink-70);
    --text-3: var(--ink-55); --text-4: var(--ink-40);

    /* Accent and links */
    --accent: var(--amber-deep);
    --accent-bg: var(--amber-bg);
    --accent-border: var(--amber-border);
    --link: var(--amber-deep); --link-h: var(--amber);

    /* Chips */
    --chip-live-bg: var(--green-bg); --chip-live-tx: var(--green);
    --chip-wip-bg: var(--amber-bg);  --chip-wip-tx: var(--amber-deep);
    --chip-flat-bg: var(--cream-20); --chip-flat-tx: var(--ink-55);
    --chip-down-bg: var(--red-bg);   --chip-down-tx: var(--red);

    /* Shape: flat squares are signature 1 of the ASCII system */
    --radius: 0px; --radius-sm: 0px; --radius-pill: 0px;
    --shadow: none;

    /* Label voice: mono, uppercase, wide tracking */
    --label-font: var(--mono);
    --label-tr: uppercase;
    --label-ls: .14em;
    --label-w: 700;
    --label-size: 11.5px;
  }

  html[data-mode="dark"] {
    --cream-00: #0b1120; --cream-10: #111827; --cream-20: #1a2436; --cream-30: #283145;
    --ink-90: #f5f1e8;
    --ink-70: rgba(245,241,232,.78); --ink-55: rgba(245,241,232,.58);
    --ink-40: rgba(245,241,232,.40); --ink-25: rgba(245,241,232,.24);
    --green: #4ade80; --green-bg: rgba(74,222,128,.12);
    --amber: #e0a868; --amber-deep: #f2c089;
    --amber-bg: rgba(224,168,104,.10); --amber-border: rgba(224,168,104,.30);
    --red: #f87171; --red-bg: rgba(248,113,113,.12);
    --blue: #60a5fa; --purple: #c4b5fd;
    --hover: rgba(224,168,104,.07);
    --border-strong: rgba(224,168,104,.52);
    color-scheme: dark;
  }

  html[data-look="studio"] {
    --page-bg: #fafafa;
    --page-grad: linear-gradient(145deg, #fdf8f7 0%, #fafafa 45%, #f7f6fc 100%);
    --wash-op: 1;
    --surface: #ffffff;
    --surface-2: #f5f5f8;
    --hover: #f7f7f9;
    --border: #d9d9e0;
    --border-strong: #c2c2cc;
    --row-border: #efeff3;
    --th-bg: #f5f5f8;
    --code-bg: #f2f2f4;
    --text: #16161a; --text-2: #3a3a44; --text-3: #5e5e6a; --text-4: #8a8a95;
    --green: #15803d; --amber: #b45309; --amber-deep: #b45309; --red: #b91c1c;
    --accent: #5a62d8;
    --accent-bg: rgba(90,98,216,.07);
    --accent-border: rgba(90,98,216,.28);
    --link: #5a62d8; --link-h: #3f47c4;
    --chip-live-bg: #e8f6ed; --chip-live-tx: #15803d;
    --chip-wip-bg: #fdf0dd;  --chip-wip-tx: #b45309;
    --chip-flat-bg: #ededf1; --chip-flat-tx: #5f5f69;
    --chip-down-bg: #fdeaea; --chip-down-tx: #b91c1c;
    --radius: 10px; --radius-sm: 6px; --radius-pill: 999px;
    --shadow: 0 1px 2px rgba(28,28,32,.04);
    --label-font: var(--sans);
    --label-tr: uppercase;
    --label-ls: .06em;
    --label-w: 750;
    --label-size: 11px;
    color-scheme: light;
  }

  html[data-look="studio"][data-mode="dark"] {
    --page-bg: #111114;
    --page-grad: linear-gradient(145deg, #16141a 0%, #111114 45%, #121118 100%);
    --wash-op: .14;
    --surface: #1a1a1f;
    --surface-2: #1f1f25;
    --hover: #222228;
    --border: #2c2c34;
    --border-strong: #3d3d47;
    --row-border: #232329;
    --th-bg: #1f1f25;
    --code-bg: #26262d;
    --text: #f2f2f7; --text-2: #cdcdd7; --text-3: #a0a0ac; --text-4: #7c7c88;
    --green: #4ade80; --amber: #f0b45c; --amber-deep: #f0b45c; --red: #f87171;
    --accent: #8b93f8;
    --accent-bg: rgba(139,147,248,.12);
    --accent-border: rgba(139,147,248,.32);
    --link: #8b93f8; --link-h: #aab0fa;
    --chip-live-bg: rgba(74,222,128,.13); --chip-live-tx: #4ade80;
    --chip-wip-bg: rgba(240,180,92,.13);  --chip-wip-tx: #f0b45c;
    --chip-flat-bg: #26262d;              --chip-flat-tx: #a2a2ae;
    --chip-down-bg: rgba(248,113,113,.14);--chip-down-tx: #f87171;
    color-scheme: dark;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    font: 15px/1.55 var(--sans);
    background: var(--page-bg);
    color: var(--text-2);
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }
  html[data-look="studio"] body { background: var(--page-grad) fixed, var(--page-bg); }

  /* Peach wash behind the header. Inert in the ASCII look, where --wash-op is 0. */
  .wash { position: fixed; inset: 0 0 auto 0; height: 340px; pointer-events: none; z-index: 0; overflow: hidden; }
  .wash::before {
    content: ""; position: absolute; inset: 0; opacity: var(--wash-op);
    background:
      radial-gradient(ellipse 60rem 24rem at 46% -2rem, rgba(249,196,163,.36) 0%, rgba(249,196,163,.15) 34%, transparent 78%),
      radial-gradient(ellipse 46rem 20rem at 64% .5rem, rgba(247,170,138,.18) 0%, transparent 74%);
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 40%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 40%, transparent 100%);
  }
  .shell { position: relative; z-index: 1; }

  /* ── Header and toolbar ─────────────────────────────────────────────── */
  header { padding: 28px 36px 0; }
  header .label {
    font: var(--label-w) var(--label-size)/1 var(--label-font);
    letter-spacing: var(--label-ls); text-transform: var(--label-tr);
    color: var(--accent); margin-bottom: 8px;
  }
  header h1 {
    margin: 0; font-family: var(--sans);
    font-size: 30px; font-weight: 800; letter-spacing: -.025em;
    color: var(--text);
  }
  header h1 em { font-style: normal; color: var(--accent); }
  header .meta { color: var(--text-3); font: 13.5px/1.4 var(--sans); margin-top: 6px; }
  header .meta code { font-size: 12px; }
  header .meta .num { font-variant-numeric: tabular-nums; }

  .toolbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap;
    padding: 18px 36px 0; margin-bottom: 22px;
  }
  nav.tabs {
    display: inline-flex; gap: 3px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: calc(var(--radius) + 2px); padding: 3px;
  }
  nav.tabs button {
    background: none; border: 0; font: inherit;
    font-size: 12.5px; line-height: 18px; font-weight: 600;
    color: var(--text-2); padding: 6px 14px;
    border-radius: var(--radius-sm); cursor: pointer;
  }
  nav.tabs button:hover { color: var(--text); background: var(--hover); }
  nav.tabs button.active {
    background: var(--page-bg); color: var(--text);
    outline: 1px solid var(--border-strong);
  }
  html[data-look="ascii"] nav.tabs button {
    font: var(--label-w) var(--label-size)/18px var(--label-font);
    letter-spacing: var(--label-ls); text-transform: var(--label-tr);
  }
  html[data-look="ascii"] nav.tabs button.active { color: var(--accent); }
  nav.tabs button .n {
    color: var(--text-3); font-weight: 600; margin-left: 6px;
    font-size: 11px; font-variant-numeric: tabular-nums;
  }
  .tools { display: inline-flex; align-items: center; gap: 8px; }
  .pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 6px 13px; border-radius: calc(var(--radius) - 1px);
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text); font-size: 12.5px; font-weight: 600;
    text-decoration: none; white-space: nowrap;
  }
  button.pill { font-family: var(--sans); cursor: pointer; }
  button.pill:hover { border-color: var(--border-strong); }
  .pill .m { color: var(--text-3); font-weight: 500; font-variant-numeric: tabular-nums; }
  .pill .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); flex: none; }
  .pill .dot.warn { background: var(--amber); }
  .pill .dot.down { background: var(--text-4); }

  main { padding: 0 36px 64px; max-width: 1400px; }
  section { display: none; }
  section.active { display: block; }

  h2 {
    font: var(--label-w) var(--label-size)/1 var(--label-font);
    letter-spacing: var(--label-ls); text-transform: var(--label-tr);
    color: var(--accent);
    margin: 32px 0 10px; padding-bottom: 8px;
    background: linear-gradient(to right, var(--border), transparent) bottom/100% 1px no-repeat;
  }
  html[data-look="studio"] h2 { color: var(--text); background: none; padding-bottom: 2px; }
  h2:first-child { margin-top: 0; }
  h2 .n { color: var(--text-3); font-weight: 600; margin-left: 7px; text-transform: none; letter-spacing: 0; }
  p { margin: 6px 0 14px; }

  /* ── Tables ─────────────────────────────────────────────────────────── */
  table {
    width: 100%; font: 13.5px/1.5 var(--sans);
    border-collapse: separate; border-spacing: 0;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden; margin-bottom: 18px;
  }
  html[data-look="ascii"] table { background: transparent; border: 0; }
  th, td {
    text-align: left; padding: 10px 12px;
    border-bottom: 1px solid var(--row-border);
    vertical-align: top; color: var(--text-2);
  }
  td strong { color: var(--text); }
  tr:last-child td { border-bottom: 0; }
  html[data-look="ascii"] tr:last-child td { border-bottom: 1px solid var(--row-border); }
  th {
    font: var(--label-w) 11px/1 var(--label-font);
    letter-spacing: var(--label-ls); text-transform: var(--label-tr);
    color: var(--text-2); background: var(--th-bg);
    padding-top: 8px; padding-bottom: 8px;
  }
  td.num, .num { font-variant-numeric: tabular-nums; }
  tr.ok td:nth-child(2) { color: var(--green); font-weight: 600; }
  tr.warn td:nth-child(2) { color: var(--amber); font-weight: 600; }
  tr.muted td { color: var(--text-4); }

  code {
    font: 500 13px/1.4 var(--mono);
    background: var(--code-bg); color: var(--accent);
    border: 1px solid var(--accent-border);
    border-radius: var(--radius-sm); padding: 1px 6px;
  }
  html[data-look="studio"] code { color: var(--text-2); border-color: transparent; }
  code.has-note { border-bottom-style: dotted; cursor: help; }
  pre code, pre { background: transparent; border: 0; padding: 0; }
  a { color: var(--link); text-decoration: none; border-bottom: 1px solid var(--accent-border); }
  a:hover { color: var(--link-h); border-bottom-color: var(--link-h); }
  strong { color: var(--text); font-weight: 700; }
  em { font-style: normal; color: var(--accent); }

  /* ── Chips ──────────────────────────────────────────────────────────── */
  .chip {
    display: inline-block; font: 700 10px/1.6 var(--sans);
    letter-spacing: .02em; padding: 2px 8px;
    border-radius: var(--radius-pill); white-space: nowrap;
  }
  html[data-look="ascii"] .chip { border: 1px solid currentColor; }
  .chip.live { background: var(--chip-live-bg); color: var(--chip-live-tx); }
  .chip.wip  { background: var(--chip-wip-bg);  color: var(--chip-wip-tx); }
  .chip.flat { background: var(--chip-flat-bg); color: var(--chip-flat-tx); }
  .chip.down { background: var(--chip-down-bg); color: var(--chip-down-tx); }

  .badge { font: 700 9.5px/1.6 var(--sans); letter-spacing: .06em; padding: 1px 6px;
    border-radius: var(--radius-pill); margin-left: 6px; white-space: nowrap; }
  .badge.local { background: var(--chip-wip-bg); color: var(--chip-wip-tx); }

  /* ── Cards (Content tab) ────────────────────────────────────────────── */
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; margin-bottom: 22px; }
  .card {
    display: flex; flex-direction: column; gap: 5px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 13px 15px;
    text-decoration: none; color: inherit; box-shadow: var(--shadow);
    transition: border-color .12s ease;
  }
  a.card { border-bottom: 1px solid var(--border); cursor: pointer; }
  .card.md-link { cursor: pointer; text-align: left; font: inherit; }
  a.card:hover, .card.md-link:hover { border-color: var(--border-strong); background: var(--hover); }
  a.card:focus-visible, .card.md-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  a.card .c-title, .card.md-link .c-title { text-decoration: none; }
  .card:hover { border-color: var(--border-strong); }
  .c-top { display: flex; align-items: center; gap: 9px; }
  .c-title { font-size: 14px; font-weight: 650; color: var(--text); flex: 1; min-width: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .c-desc { color: var(--text-2); font-size: 12.5px; line-height: 1.45; margin: 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .c-desc code { font-size: 11.5px; }
  .c-foot { display: flex; align-items: center; gap: 8px; margin-top: 2px;
    font-size: 11px; font-weight: 500; color: var(--text-3); }
  .type { font-weight: 700; letter-spacing: .04em; border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 0 5px; }
  .mtime { margin-left: auto; }

  /* ── Stats, details, misc ───────────────────────────────────────────── */
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .stat { background: var(--surface); padding: 14px 16px; border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: var(--shadow); }
  .stat .k {
    font: var(--label-w) 11px/1 var(--label-font);
    letter-spacing: var(--label-ls); text-transform: var(--label-tr);
    color: var(--text-2);
  }
  .stat .v { font: 700 20px/1.2 var(--sans); color: var(--text); margin-top: 6px;
    font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
  .diagram { font: 500 12.5px/1.5 var(--mono); color: var(--text-2); background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 18px;
    overflow-x: auto; margin: 0 0 18px; }
  .file-list { font: 500 12.5px/1.6 var(--mono); color: var(--text-2); margin: 0; white-space: pre-wrap; word-break: break-word; }
  .empty { color: var(--text-4); font-style: italic; }
  details { margin-bottom: 10px; }
  details summary { cursor: pointer; color: var(--text-2); font-weight: 600; font-size: 13.5px;
    padding: 6px 0; list-style-position: outside; }
  details summary:hover { color: var(--text); }
  ul li::marker { color: var(--text-4); }
  .proto-block { margin-bottom: 16px; }
  .proto-block h4 { margin: 0 0 4px; font-size: 13.5px; color: var(--text); }
  .proto-block ul { margin: 0 0 10px; padding-left: 20px; }
  .proto-block li::marker { color: var(--text-4); }
  footer { padding: 18px 36px 40px; color: var(--text-4); font: 12.5px/1.5 var(--mono);
    border-top: 1px solid var(--border); margin: 0 36px; }

  .subtabs { display: inline-flex; gap: 3px; background: var(--surface);
    border: 1px solid var(--border); border-radius: calc(var(--radius) + 2px);
    padding: 3px; margin-bottom: 18px; }
  .sub-btn { background: none; border: 0; font: inherit; font-size: 12px; font-weight: 600;
    color: var(--text-3); padding: 5px 12px; border-radius: var(--radius-sm); cursor: pointer; }
  .sub-btn:hover { color: var(--text); background: var(--hover); }
  .sub-btn.active { background: var(--page-bg); color: var(--text); outline: 1px solid var(--border-strong); }
  .sub-section.hidden { display: none; }
  .sub-section + .sub-section h2 { margin-top: 32px; }
  .sub-section:last-child { margin-bottom: 0; }

  .md-link { background: none; border: 0; font: 500 13px/1.4 var(--mono); color: var(--link);
    cursor: pointer; padding: 0; text-align: left; border-bottom: 1px solid var(--accent-border); }
  .md-link:hover { color: var(--link-h); border-bottom-color: var(--link-h); }
  /* ── Doc reading view ───────────────────────────────────────────────────
     A markdown file opens as its own page rather than a modal, the way the
     agentspot canvas does it with apps-doc.html. The difference is that the
     content is already embedded in this file, so the reading view takes over
     the page instead of navigating. That keeps the whole canvas working from
     file:// with nothing served.
     ─────────────────────────────────────────────────────────────────────── */
  body.reading > .shell > header,
  body.reading > .shell > .toolbar,
  body.reading > .shell > main,
  body.reading > .shell > footer { display: none; }
  #docview { display: none; }
  body.reading #docview { display: block; }
  .doc-topbar {
    position: sticky; top: 0; z-index: 8;
    display: flex; align-items: center; gap: 14px;
    padding: 12px 24px; border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .backlink {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: 1px solid var(--border); border-radius: var(--radius-sm);
    color: var(--text-2); font: 600 12.5px var(--sans);
    padding: 5px 11px; cursor: pointer;
  }
  .backlink:hover { color: var(--text); border-color: var(--border-strong); }
  .pagelabel {
    font: var(--label-w) 11px/1 var(--label-font);
    letter-spacing: var(--label-ls); text-transform: var(--label-tr);
    color: var(--text-3);
  }
  .doc-wrap { max-width: 860px; margin: 0 auto; padding: 34px 24px 96px; }
  .docmeta { color: var(--text-3); font-size: 12px; margin: 0 0 26px;
    border-bottom: 1px solid var(--border); padding-bottom: 18px; }
  .md { font-size: 14.5px; line-height: 1.68; color: var(--text-2); }
  .md > :first-child { margin-top: 0; }
  .md h1, .md h2, .md h3, .md h4 { color: var(--text); font-family: var(--sans);
    background: none; text-transform: none; }
  .md h1 { font-size: 26px; font-weight: 700; letter-spacing: -.01em; margin: 34px 0 12px; }
  .md h2 { font-size: 19px; font-weight: 700; margin: 32px 0 10px; padding-bottom: 6px;
    border-bottom: 1px solid var(--border); letter-spacing: -.005em; }
  .md h3 { font-size: 15.5px; font-weight: 650; margin: 26px 0 8px; }
  .md h4 { font-size: 14px; font-weight: 650; margin: 20px 0 6px; color: var(--text-2); }
  .md p { margin: 0 0 15px; }
  .md ul, .md ol { padding-left: 22px; margin: 0 0 15px; }
  .md li { margin-bottom: 5px; }
  .md li::marker { color: var(--text-4); }
  .md a { color: var(--link); }
  .md code { background: var(--code-bg); border: 0; border-radius: var(--radius-sm);
    padding: 1.5px 5px; font: 500 12.5px var(--mono); color: var(--text); }
  .md pre { background: #16161a; color: #e6e6ea; border: 0;
    border-radius: var(--radius); padding: 14px 16px; overflow-x: auto; margin: 0 0 16px; }
  .md pre code { background: none; padding: 0; color: inherit; font-size: 12.5px; }
  .md blockquote { margin: 0 0 16px; padding: 8px 16px;
    border-left: 3px solid var(--border-strong); background: var(--surface);
    color: var(--text-2); }
  .md table { width: 100%; margin: 0 0 18px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .md th, .md td { text-align: left; vertical-align: top; padding: 10px 13px;
    border-bottom: 1px solid var(--row-border); font-size: 13px; color: var(--text-2); }
  .md th { font: 650 11px/1.5 var(--sans); text-transform: uppercase;
    letter-spacing: .04em; color: var(--text-2); background: var(--th-bg); }
  .md tr:last-child td { border-bottom: 0; }
  .md hr { border: 0; border-top: 1px solid var(--border); margin: 26px 0; }
  .md img { max-width: 100%; }

  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
  @media (max-width: 720px) {
    header, .toolbar, main { padding-left: 18px; padding-right: 18px; }
    footer { margin: 0 18px; padding-left: 0; padding-right: 0; }
    header h1 { font-size: 24px; }
  }
</style>
<script>
  // Runs before <body> so the chosen look and mode are on <html> at first paint.
  // The config default only applies until the reader picks their own.
  (function () {
    var DEFAULT_LOOK = '${STATUS_LOOK}';
    var look, mode, seenDefault;
    try { look = localStorage.getItem('rp-canvas-look'); } catch (e) { look = null; }
    try { mode = localStorage.getItem('rp-canvas-mode'); } catch (e) { mode = null; }
    try { seenDefault = localStorage.getItem('rp-canvas-look-default'); } catch (e) { seenDefault = null; }
    // A change to STATUS_LOOK in the config wins once, even in a browser that
    // has already toggled. After that the reader's own choice sticks again.
    if (seenDefault !== DEFAULT_LOOK) {
      look = DEFAULT_LOOK;
      try {
        localStorage.setItem('rp-canvas-look', look);
        localStorage.setItem('rp-canvas-look-default', DEFAULT_LOOK);
      } catch (e) {}
    }
    if (look !== 'ascii' && look !== 'studio') look = (DEFAULT_LOOK === 'studio') ? 'studio' : 'ascii';
    if (mode !== 'light' && mode !== 'dark') {
      mode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-look', look);
    document.documentElement.setAttribute('data-mode', mode);
  })();
</script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" onerror="window.markedFailed=true"></script>
CANVAS_STYLE
}

# The page script: tabs, look and mode toggles, Docs sub-tabs and the markdown
# reading view. The page needs #mode-toggle and #doc-back; #look-toggle is optional.
canvas_script() {
  cat <<CANVAS_SCRIPT
<script>
  // Tab switching.
  function showTab(name) {
    document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('main section').forEach(x => x.classList.remove('active'));
    const btn = document.querySelector('.tab-btn[data-tab="' + name + '"]');
    const sec = document.getElementById(name);
    if (btn) btn.classList.add('active');
    if (sec) sec.classList.add('active');
  }
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.addEventListener('click', () => showTab(b.dataset.tab));
  });
  const sitePill = document.getElementById('site-pill');
  if (sitePill) sitePill.addEventListener('click', () => showTab(sitePill.dataset.tab || 'sites'));

  // Look and mode toggles. Both persist per browser, so a re-run of the script
  // does not reset what the reader chose.
  const root = document.documentElement;
  const lookName = document.getElementById('look-name');
  const modeName = document.getElementById('mode-name');
  const LOOK_LABEL = { ascii: 'ASCII', studio: 'Studio' };
  function paintToggles() {
    if (lookName) lookName.textContent = LOOK_LABEL[root.getAttribute('data-look')] || 'ASCII';
    if (modeName) modeName.textContent = root.getAttribute('data-mode') === 'dark' ? 'Dark' : 'Light';
  }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  const lookToggle = document.getElementById('look-toggle');
  if (lookToggle) lookToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-look') === 'studio' ? 'ascii' : 'studio';
    root.setAttribute('data-look', next);
    store('rp-canvas-look', next);
    paintToggles();
  });
  document.getElementById('mode-toggle').addEventListener('click', () => {
    const next = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-mode', next);
    store('rp-canvas-mode', next);
    paintToggles();
  });
  paintToggles();

  // Sub-tab filtering inside Docs and plans.
  document.querySelectorAll('.sub-btn').forEach(b => {
    b.addEventListener('click', () => {
      const filter = b.dataset.sub;
      document.querySelectorAll('.sub-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      document.querySelectorAll('.sub-section').forEach(s => {
        s.classList.toggle('hidden', filter !== 'all' && s.dataset.sub !== filter);
      });
    });
  });

  // Markdown reading view. The file is already embedded in this page, so
  // opening a doc takes the page over rather than navigating, which is what
  // keeps the canvas working from file:// with nothing served.
  const docview = document.getElementById('docview');
  const bodyEl = document.getElementById('doc-body');
  const pathEl = document.getElementById('doc-path');
  const labelEl = document.getElementById('doc-label');

  function escapeHtml(s) {
    return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  }

  let returnScroll = 0;

  function openMd(targetId) {
    const src = document.getElementById(targetId);
    if (!src) return;
    const raw = src.textContent.replace(/^\s*\n/, '');
    const path = src.dataset.path || '';
    pathEl.textContent = path;
    labelEl.textContent = path.split('/').pop() || 'Doc';
    if (window.marked && !window.markedFailed) {
      bodyEl.innerHTML = marked.parse(raw);
    } else {
      bodyEl.innerHTML = '<pre>' + escapeHtml(raw) + '</pre>';
    }
    returnScroll = window.scrollY;
    document.body.classList.add('reading');
    window.scrollTo(0, 0);
    document.title = (path ? path.split('/').pop() + ' · ' : '') + BASE_TITLE;
  }
  function closeMd() {
    if (!document.body.classList.contains('reading')) return;
    document.body.classList.remove('reading');
    document.title = BASE_TITLE;
    window.scrollTo(0, returnScroll);
  }
  const BASE_TITLE = document.title;

  document.querySelectorAll('.md-link').forEach(b => {
    b.addEventListener('click', () => openMd(b.dataset.target));
    b.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMd(b.dataset.target); }
    });
  });
  document.getElementById('doc-back').addEventListener('click', closeMd);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMd(); });
</script>
CANVAS_SCRIPT
}
