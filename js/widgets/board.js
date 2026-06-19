/* widgets/board.js — Hero Board Inspector: interactive Raspberry Pi 5 top-down SVG
   Exports: mount(container, ctx = {}) → cleanup fn */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Component definitions ───────────────────────────────────────────────── */
const COMPONENTS = [
  {
    id: 'usbc',
    label: 'USB-C Power',
    tip: 'Power input only — plug in the 27 W supply here. Never use a phone charger.',
    chapter: '#/chapter/ch02',
    // SVG shape: rect [x,y,w,h] in board-local coords
    shape: { type: 'rect', x: 152, y: 200, w: 22, h: 11 },
    color: '#0E8C7E',
  },
  {
    id: 'gpio',
    label: '40-pin GPIO header',
    tip: 'Forty programmable pins for connecting LEDs, sensors, motors and more (3.3 V logic).',
    chapter: '#/chapter/ch12',
    shape: { type: 'rect', x: 26, y: 14, w: 118, h: 13 },
    color: '#C7A320',
  },
  {
    id: 'usb',
    label: 'USB ports (×4)',
    tip: 'Two fast blue USB 3.0 ports on top, two standard black USB 2.0 ports below. Use the blue ones for storage drives.',
    chapter: '#/chapter/ch02',
    shape: { type: 'rect', x: 195, y: 42, w: 17, h: 78 },
    color: '#1a5fb4',
  },
  {
    id: 'ethernet',
    label: 'Gigabit Ethernet',
    tip: 'Wired network at up to 1 Gbps — faster and more reliable than Wi-Fi.',
    chapter: '#/chapter/ch09',
    shape: { type: 'rect', x: 195, y: 16, w: 17, h: 22 },
    color: '#C7A320',
  },
  {
    id: 'hdmi',
    label: 'micro-HDMI (×2)',
    tip: 'Two micro-HDMI ports for up to two 4K monitors. Always plug your main screen into port 0 (the inner one).',
    chapter: '#/chapter/ch04',
    shape: { type: 'rect', x: 86, y: 200, w: 50, h: 11 },
    color: '#6d28d9',
  },
  {
    id: 'sd',
    label: 'microSD slot',
    tip: 'The Pi\'s "hard drive" — push until it clicks in. Never remove while the Pi is running.',
    chapter: '#/chapter/ch10',
    shape: { type: 'rect', x: 14, y: 190, w: 16, h: 21 },
    color: '#888',
  },
  {
    id: 'pcie',
    label: 'PCIe / FPC connector',
    tip: 'High-speed slot for adding an NVMe SSD via an M.2 HAT — makes storage many times faster than microSD.',
    chapter: '#/chapter/ch10',
    shape: { type: 'rect', x: 18, y: 142, w: 68, h: 9 },
    color: '#b45309',
  },
  {
    id: 'soc',
    label: 'SoC + 16 GB RAM',
    tip: 'The brain: a Broadcom BCM2712 quad-core Arm Cortex-A76 at 2.4 GHz, with 16 GB LPDDR4X RAM stacked on top.',
    chapter: '#/chapter/ch01',
    shape: { type: 'rect', x: 68, y: 52, w: 88, h: 88 },
    color: '#888',
  },
  {
    id: 'pwrbtn',
    label: 'Power button',
    tip: 'Short press = clean shutdown. Long press (5 s) = emergency cut. Always shut down before pulling the plug.',
    chapter: '#/chapter/ch02',
    shape: { type: 'circle', cx: 55, cy: 23, r: 8 },
    color: '#6d28d9',
  },
  {
    id: 'actled',
    label: 'Activity LED',
    tip: 'Green LED that flashes whenever the Pi reads or writes to the microSD card.',
    chapter: '#/chapter/ch02',
    shape: { type: 'circle', cx: 29, cy: 23, r: 5 },
    color: '#1F8A4C',
  },
];

/* ── CSS ─────────────────────────────────────────────────────────────────── */
function injectCSS() {
  if (document.getElementById('w-board-css')) return;
  const s = document.createElement('style');
  s.id = 'w-board-css';
  s.textContent = `
.w-board {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  width: 100%;
  user-select: none;
}

/* ---- SVG wrapper ---- */
.w-board .board-svg-wrap {
  position: relative;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
}
.w-board .board-svg-wrap svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
  filter: drop-shadow(0 4px 18px rgba(0,0,0,.18));
}

/* ---- Hotspot buttons ---- */
.w-board .hs-btn {
  position: absolute;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
  border-radius: 4px;
  outline: none;
  transition: none;
  /* keep the visible hotspot exactly over the SVG shape... */
}
.w-board .hs-btn:focus-visible .hs-ring,
.w-board .hs-btn:hover .hs-ring,
.w-board .hs-btn.is-active .hs-ring {
  opacity: 1 !important;
}
.w-board .hs-ring {
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  transition: opacity 160ms ease;
  box-shadow: 0 0 0 2.5px var(--hs-color, var(--accent2)), 0 0 10px 2px var(--hs-color, var(--accent2));
}
.w-board .hs-btn.circle-btn {
  border-radius: 50%;
}
.w-board .hs-btn.circle-btn .hs-ring {
  border-radius: 50%;
}
/* ...but on coarse (touch) pointers, grow the invisible hit area so taps are easy.
   A transparent ::after pad extends the touch target without moving the ring. */
@media (pointer: coarse) {
  .w-board .hs-btn::after {
    content: "";
    position: absolute;
    inset: -10px;
    border-radius: inherit;
    /* minimum comfortable touch target ~44px */
    min-width: 44px;
    min-height: 44px;
    transform: translate(0, 0);
  }
  .w-board .hs-btn.circle-btn::after { border-radius: 50%; }
}

/* ---- Tooltip ---- */
.w-board-tooltip {
  position: fixed;
  z-index: 1200;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lift);
  padding: .65rem .85rem;
  max-width: 240px;
  pointer-events: auto;
  transition: opacity 120ms ease, transform 120ms ease;
  font-family: var(--font-body);
}
.w-board-tooltip.hidden {
  opacity: 0;
  transform: translateY(4px);
  pointer-events: none;
}
.w-board-tooltip .tt-label {
  font-size: .78rem;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: .25rem;
  font-family: var(--font-display);
}
.w-board-tooltip .tt-tip {
  font-size: .74rem;
  color: var(--ink-soft);
  line-height: 1.45;
  margin-bottom: .4rem;
}
.w-board-tooltip .tt-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: .8rem;
  font-weight: 600;
  color: var(--accent2);
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  padding: .25rem 0;
  min-height: 32px;
  font-family: var(--font-body);
}
.w-board-tooltip .tt-link:hover { text-decoration: underline; }

/* ---- Legend / hint ---- */
.w-board .board-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  margin-top: .55rem;
  font-size: .72rem;
  color: var(--ink-soft);
  font-family: var(--font-body);
  letter-spacing: .02em;
  text-align: center;
  max-width: 28ch;
  line-height: 1.4;
}
.w-board .board-hint .hint-dot {
  display: inline-block;
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent2);
  opacity: .7;
}

/* ---- GPIO ambient pulse (steady-state, after wake) ---- */
@keyframes gpio-pulse {
  0%,100% { opacity:.22; }
  50%      { opacity:.55; }
}
.w-board .gpio-pin-glow {
  animation: gpio-pulse 2.4s ease-in-out infinite;
}

/* ---- BOARD WAKE: per-pin left-to-right ripple (one-shot) ---- */
@keyframes gpio-wake {
  0%   { opacity: .25; transform: translateY(0); }
  35%  { opacity: 1;   transform: translateY(-0.4px); }
  100% { opacity: .85; transform: translateY(0); }
}
.w-board .gpio-pin.waking {
  transform-box: fill-box;
  transform-origin: center;
  animation: gpio-wake 620ms cubic-bezier(.2,.7,.3,1) both;
}

/* ---- Activity LED: boot (two quick blinks) then slow breathing ---- */
@keyframes led-boot {
  0%   { opacity: .15; }
  12%  { opacity: 1; }
  24%  { opacity: .15; }
  40%  { opacity: 1; }
  52%  { opacity: .15; }
  100% { opacity: .15; }
}
@keyframes led-breathe {
  0%,100% { opacity: .45; }
  50%     { opacity: 1; }
}
.w-board .act-led-glow.booting {
  animation: led-boot 1.05s steps(1, end) 1 both;
}
.w-board .act-led-glow.breathing {
  animation: led-breathe 3.2s ease-in-out infinite;
}

/* ---- Compact / hero mode ---- */
.w-board.compact .board-svg-wrap {
  max-width: 280px;
}

/* tiny breadboard preview (compact mode) */
.w-board .gpio-preview {
  margin-top: .55rem;
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .4rem .6rem .4rem .5rem;
  background: var(--surface2, var(--surface));
  border: 1px solid var(--line);
  border-radius: var(--radius-sm, 10px);
  cursor: pointer;
  color: var(--ink-soft);
  font-family: var(--font-body);
  font-size: .72rem;
  text-decoration: none;
  transition: border-color 160ms ease, transform 160ms ease;
  -webkit-tap-highlight-color: transparent;
}
.w-board .gpio-preview:hover,
.w-board .gpio-preview:focus-visible {
  border-color: var(--success, #1F8A4C);
  transform: translateY(-1px);
  outline: none;
}
.w-board .gpio-preview svg { display: block; flex: 0 0 auto; }
.w-board .gpio-preview .gp-text { line-height: 1.3; }
.w-board .gpio-preview .gp-text strong {
  display: block;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: .74rem;
  font-weight: 700;
}
@keyframes gp-led-breathe {
  0%,100% { opacity: .5; r: 3.1; }
  50%     { opacity: 1;  r: 3.7; }
}
.w-board .gp-led.breathe {
  animation: gp-led-breathe 2.6s ease-in-out infinite;
}
`;
  document.head.appendChild(s);
}

/* ── SVG Board ───────────────────────────────────────────────────────────── */
// viewBox: 212 wide × 212 tall (portrait Pi 5, rotated to typical top-down view)
function buildSVG(compact) {
  const VW = 212, VH = 212;
  // GPIO pin rows (visual dots along top). 20 columns × 2 rows = 40 pins.
  // Each column gets a left-to-right wake delay so the header "lights up".
  let gpioPins = '';
  for (let i = 0; i < 20; i++) {
    const x = 26 + i * 5.9 + 1.5;
    const delay = (i * 26).toFixed(0); // ms, left → right
    const style = REDUCED ? '' : ` style="animation-delay:${delay}ms"`;
    gpioPins += `<circle class="gpio-pin" cx="${x}" cy="17" r="1.6" fill="#d4a017"${style}/>`;
    gpioPins += `<circle class="gpio-pin" cx="${x}" cy="22" r="1.6" fill="#d4a017"${style}/>`;
  }

  // PCIe ribbon connector teeth
  let pciePins = '';
  for (let i = 0; i < 12; i++) {
    pciePins += `<rect x="${22 + i * 5}" y="144" width="3" height="5" rx="0.5" fill="#555"/>`;
  }

  // Activity LED end-state class wiring:
  //  - reduced motion → static lit dot (no animation)
  //  - motion → start in boot/breathe via classes added on mount
  const ledGlow = REDUCED
    ? `<circle class="act-led-glow" cx="29" cy="23" r="3.5" fill="#22cc66" opacity=".9"/>`
    : `<circle class="act-led-glow" cx="29" cy="23" r="3.5" fill="#22cc66" opacity=".45"/>`;

  const svg = `<svg viewBox="0 0 ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Raspberry Pi 5 board diagram">
  <title>Raspberry Pi 5 — interactive board diagram</title>

  <!-- PCB base -->
  <rect x="12" y="10" width="186" height="192" rx="9" ry="9" fill="#1a3d1a" stroke="#2d5a27" stroke-width="2.2"/>

  <!-- PCB texture / silk-screen dots -->
  <rect x="12" y="10" width="186" height="192" rx="9" fill="url(#pcb-grid)" opacity=".06"/>
  <defs>
    <pattern id="pcb-grid" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="0.7" fill="#8fbc8f"/>
    </pattern>
  </defs>

  <!-- Mounting holes corners -->
  <circle cx="22" cy="20" r="3" fill="#111" stroke="#2d5a27" stroke-width="1"/>
  <circle cx="190" cy="20" r="3" fill="#111" stroke="#2d5a27" stroke-width="1"/>
  <circle cx="22" cy="198" r="3" fill="#111" stroke="#2d5a27" stroke-width="1"/>
  <circle cx="190" cy="198" r="3" fill="#111" stroke="#2d5a27" stroke-width="1"/>

  <!-- === GPIO Header (top, horizontal bar) === -->
  <rect x="26" y="14" width="118" height="13" rx="2" fill="#8B6914" stroke="#C7A320" stroke-width="1"/>
  ${gpioPins}

  <!-- === SoC: RF shield (silver square, centre-ish) === -->
  <rect x="68" y="52" width="88" height="88" rx="4" fill="#808080" stroke="#606060" stroke-width="1.5"/>
  <!-- lid shine -->
  <rect x="70" y="54" width="84" height="6" rx="2" fill="#aaa" opacity=".45"/>
  <text x="112" y="93" text-anchor="middle" fill="#3a3a3a" font-size="9" font-family="sans-serif" font-weight="bold">BCM2712</text>
  <text x="112" y="104" text-anchor="middle" fill="#3a3a3a" font-size="8" font-family="sans-serif">SoC + 16 GB RAM</text>
  <!-- Active Cooler dashed outline -->
  <rect x="64" y="48" width="96" height="96" rx="5" fill="none" stroke="#4a90d9" stroke-width="1" stroke-dasharray="4,3" opacity=".5"/>
  <text x="112" y="44" text-anchor="middle" fill="#4a90d9" font-size="7" font-family="sans-serif" opacity=".7">Active Cooler</text>

  <!-- === PCIe / FPC ribbon connector === -->
  <rect x="18" y="142" width="68" height="9" rx="2" fill="#5a4020" stroke="#b45309" stroke-width="1"/>
  ${pciePins}

  <!-- === USB stack (right edge — 4 stacked USB-A) === -->
  <!-- USB 3.0 ×2 (blue) -->
  <rect x="196" y="42" width="16" height="18" rx="2" fill="#1a5fb4" stroke="#0d3a8a" stroke-width="1"/>
  <rect x="198" y="44" width="12" height="14" rx="1" fill="#0a2060" opacity=".5"/>
  <rect x="196" y="64" width="16" height="18" rx="2" fill="#1a5fb4" stroke="#0d3a8a" stroke-width="1"/>
  <rect x="198" y="66" width="12" height="14" rx="1" fill="#0a2060" opacity=".5"/>
  <!-- USB 2.0 ×2 (black) -->
  <rect x="196" y="86" width="16" height="18" rx="2" fill="#222" stroke="#444" stroke-width="1"/>
  <rect x="198" y="88" width="12" height="14" rx="1" fill="#111" opacity=".7"/>
  <rect x="196" y="108" width="16" height="18" rx="2" fill="#222" stroke="#444" stroke-width="1"/>
  <rect x="198" y="110" width="12" height="14" rx="1" fill="#111" opacity=".7"/>

  <!-- === Gigabit Ethernet (right edge, top) === -->
  <rect x="196" y="16" width="16" height="22" rx="2" fill="#C8A000" stroke="#9a7a00" stroke-width="1"/>
  <!-- LEDs on ethernet jack -->
  <circle cx="199" cy="19" r="2" fill="#f0c040" opacity=".8"/>
  <circle cx="209" cy="19" r="2" fill="#40c040" opacity=".8"/>

  <!-- === micro-HDMI ×2 (bottom edge) === -->
  <!-- HDMI 0 (inner, left) -->
  <rect x="86" y="201" width="20" height="10" rx="1.5" fill="#222" stroke="#555" stroke-width="1"/>
  <rect x="88" y="203" width="16" height="6" rx="1" fill="#0a0a14" opacity=".8"/>
  <!-- HDMI 1 (outer, right) -->
  <rect x="112" y="201" width="20" height="10" rx="1.5" fill="#222" stroke="#555" stroke-width="1"/>
  <rect x="114" y="203" width="16" height="6" rx="1" fill="#0a0a14" opacity=".8"/>

  <!-- === USB-C Power (bottom edge, far right) === -->
  <rect x="152" y="201" width="22" height="10" rx="3" fill="#333" stroke="#666" stroke-width="1"/>
  <rect x="156" y="203" width="14" height="6" rx="2" fill="#111" opacity=".8"/>

  <!-- === microSD slot (bottom-left, inset) === -->
  <rect x="13" y="190" width="16" height="21" rx="2" fill="#7a7a7a" stroke="#555" stroke-width="1"/>
  <rect x="15" y="193" width="12" height="15" rx="1" fill="#999" opacity=".5"/>

  <!-- === Wi-Fi / BT module (small chip near SoC) === -->
  <rect x="155" y="70" width="30" height="20" rx="2" fill="#2a2a3a" stroke="#4a4a6a" stroke-width="1"/>
  <text x="170" y="79" text-anchor="middle" fill="#8888cc" font-size="6" font-family="sans-serif">Wi-Fi 5</text>
  <text x="170" y="87" text-anchor="middle" fill="#8888cc" font-size="6" font-family="sans-serif">BT 5.0</text>

  <!-- === RTC battery connector (tiny, near GPIO) === -->
  <rect x="165" y="31" width="18" height="7" rx="1" fill="#444" stroke="#666" stroke-width="0.8"/>
  <text x="174" y="37" text-anchor="middle" fill="#888" font-size="5.5" font-family="sans-serif">RTC</text>

  <!-- Fan connector -->
  <rect x="150" y="14" width="12" height="8" rx="1" fill="#0a5a5a" stroke="#0E8C7E" stroke-width="0.8"/>

  <!-- Trace lines (decorative PCB traces) -->
  <line x1="144" y1="155" x2="144" y2="205" stroke="#2d5a27" stroke-width="0.8" opacity=".4"/>
  <line x1="80" y1="145" x2="80" y2="205" stroke="#2d5a27" stroke-width="0.8" opacity=".4"/>
  <line x1="174" y1="38" x2="196" y2="38" stroke="#2d5a27" stroke-width="0.8" opacity=".3"/>
  <line x1="174" y1="42" x2="196" y2="62" stroke="#2d5a27" stroke-width="0.8" opacity=".3"/>

  <!-- === Power button (top corner area) === -->
  <circle cx="55" cy="23" r="8" fill="#3a1a6a" stroke="#6d28d9" stroke-width="1.2"/>
  <circle cx="55" cy="23" r="5" fill="#4a2880" stroke="#9050d8" stroke-width="0.8"/>
  <text x="55" y="26.5" text-anchor="middle" fill="#d0b0ff" font-size="5" font-family="sans-serif" font-weight="bold">PWR</text>

  <!-- === Activity LED === -->
  <circle cx="29" cy="23" r="5" fill="#0a2a0a" stroke="#1F8A4C" stroke-width="1"/>
  ${ledGlow}

  <!-- GPIO glow strip (ambient, added after wake) -->
  ${REDUCED ? '' : `<rect class="gpio-pin-glow" x="26" y="14" width="118" height="13" rx="2" fill="#d4a017" opacity=".0"/>`}
</svg>`;
  return svg;
}

/* ── Tiny breadboard motif (compact hero mode) ───────────────────────────── */
function buildPreviewSVG() {
  // small breadboard slab + one green LED that softly pulses
  const ledAnim = REDUCED ? '' : ' breathe';
  return `<svg width="48" height="38" viewBox="0 0 48 38" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" focusable="false">
    <!-- breadboard body -->
    <rect x="2" y="6" width="44" height="26" rx="3" fill="#e8e3d6" stroke="#c9c2b0" stroke-width="1"/>
    <!-- centre channel -->
    <rect x="2" y="18" width="44" height="2" fill="#cfc8b6"/>
    <!-- tie-point dots -->
    <g fill="#bdb6a3">
      <circle cx="8" cy="11" r="1"/><circle cx="14" cy="11" r="1"/><circle cx="20" cy="11" r="1"/>
      <circle cx="34" cy="11" r="1"/><circle cx="40" cy="11" r="1"/>
      <circle cx="8" cy="27" r="1"/><circle cx="14" cy="27" r="1"/><circle cx="20" cy="27" r="1"/>
      <circle cx="34" cy="27" r="1"/><circle cx="40" cy="27" r="1"/>
    </g>
    <!-- LED legs -->
    <line x1="27" y1="14" x2="27" y2="24" stroke="#9a9a9a" stroke-width="1"/>
    <line x1="31" y1="14" x2="31" y2="24" stroke="#9a9a9a" stroke-width="1"/>
    <!-- LED glow halo -->
    <circle cx="29" cy="13" r="6" fill="#3bd16a" opacity=".18"/>
    <!-- LED body -->
    <circle class="gp-led${ledAnim}" cx="29" cy="13" r="3.4" fill="#2fcf63" opacity="${REDUCED ? '1' : '.85'}"/>
    <circle cx="28" cy="12" r="1.1" fill="#d6ffe2" opacity=".85"/>
  </svg>`;
}

/* ── Tooltip singleton ───────────────────────────────────────────────────── */
let ttEl = null;
function getTooltip() {
  if (!ttEl) {
    ttEl = document.createElement('div');
    ttEl.className = 'w-board-tooltip hidden';
    document.body.appendChild(ttEl);
  }
  return ttEl;
}

function showTooltip(comp, anchorRect, navigate) {
  const tt = getTooltip();
  tt.innerHTML = `
    <div class="tt-label">${comp.label}</div>
    <div class="tt-tip">${comp.tip}</div>
    <button class="tt-link" data-chapter="${comp.chapter}">Learn more →</button>
  `;
  tt.querySelector('.tt-link').addEventListener('click', () => {
    hideTooltip();
    navigate(comp.chapter);
  });
  tt.classList.remove('hidden');

  // Position: prefer below anchor, flip if near bottom
  const GAP = 8;
  const vw = window.innerWidth, vh = window.innerHeight;
  const tw = Math.min(240, vw - 20);
  tt.style.maxWidth = tw + 'px';
  // measure
  tt.style.left = '0px'; tt.style.top = '-9999px';
  const th = tt.offsetHeight;
  let tx = anchorRect.left + anchorRect.width / 2 - tw / 2;
  tx = Math.max(10, Math.min(tx, vw - tw - 10));
  let ty = anchorRect.bottom + GAP;
  if (ty + th > vh - 10) ty = anchorRect.top - th - GAP;
  tt.style.left = tx + 'px';
  tt.style.top = ty + 'px';
}

function hideTooltip() {
  const tt = getTooltip();
  tt.classList.add('hidden');
}

/* ── Mount ───────────────────────────────────────────────────────────────── */
export function mount(container, ctx = {}) {
  injectCSS();

  const go = ctx.navigate || ((h) => { location.hash = h; });
  const compact = !!ctx.compact;

  container.classList.add('w-board');
  if (compact) container.classList.add('compact');

  /* SVG wrapper */
  const wrap = document.createElement('div');
  wrap.className = 'board-svg-wrap';
  wrap.innerHTML = buildSVG(compact);
  container.appendChild(wrap);

  /* Overlay hotspot buttons — positioned over the SVG using percentage coords */
  const VW = 212, VH = 212;

  function pct(v, total) { return (v / total * 100).toFixed(3) + '%'; }

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  wrap.style.position = 'relative';
  wrap.appendChild(overlay);

  // Track the hotspot whose tooltip is currently open (for tap-toggle + outside dismiss)
  let activeBtn = null;

  function setActive(btn) {
    if (activeBtn && activeBtn !== btn) activeBtn.classList.remove('is-active');
    activeBtn = btn || null;
    if (activeBtn) activeBtn.classList.add('is-active');
  }
  function closeTooltip() {
    hideTooltip();
    if (activeBtn) activeBtn.classList.remove('is-active');
    activeBtn = null;
  }

  COMPONENTS.forEach((comp) => {
    const btn = document.createElement('button');
    btn.className = 'hs-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', comp.label + ' — ' + comp.tip);
    btn.setAttribute('title', comp.label);
    btn.style.setProperty('--hs-color', comp.color);
    btn.style.pointerEvents = 'auto';

    const ring = document.createElement('div');
    ring.className = 'hs-ring';
    btn.appendChild(ring);

    const sh = comp.shape;
    if (sh.type === 'rect') {
      btn.style.left = pct(sh.x, VW);
      btn.style.top = pct(sh.y, VH);
      btn.style.width = pct(sh.w, VW);
      btn.style.height = pct(sh.h, VH);
      btn.style.borderRadius = '3px';
    } else if (sh.type === 'circle') {
      const size = sh.r * 2;
      btn.classList.add('circle-btn');
      btn.style.left = pct(sh.cx - sh.r, VW);
      btn.style.top = pct(sh.cy - sh.r, VH);
      btn.style.width = pct(size, VW);
      btn.style.height = pct(size, VH);
    }

    /* show / hide tooltip */
    function openFor() {
      const rect = btn.getBoundingClientRect();
      showTooltip(comp, rect, go);
      setActive(btn);
    }
    function onLeave(e) {
      // don't hide if we moved into the tooltip
      if (ttEl && ttEl.contains(e.relatedTarget)) return;
      // keep open on touch (no hover) — only collapse hover-opened tooltips
      if (activeBtn === btn) return;
      hideTooltip();
    }

    btn.addEventListener('mouseenter', openFor);
    btn.addEventListener('mouseleave', onLeave);
    btn.addEventListener('focus', openFor);
    btn.addEventListener('blur', (e) => {
      if (btn.contains(e.relatedTarget)) return;
      if (ttEl && ttEl.contains(e.relatedTarget)) return;
      closeTooltip();
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Tap/click: toggle tooltip; a second tap on the SAME hotspot navigates.
      const tt = getTooltip();
      if (tt.classList.contains('hidden') || activeBtn !== btn) {
        openFor();
      } else {
        go(comp.chapter);
        closeTooltip();
      }
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const tt = getTooltip();
        if (tt.classList.contains('hidden') || activeBtn !== btn) {
          openFor();
        } else {
          go(comp.chapter);
          closeTooltip();
        }
      }
      if (e.key === 'Escape') {
        closeTooltip();
        btn.blur();
      }
    });

    overlay.appendChild(btn);
  });

  /* Dismiss tooltip when tapping/clicking anywhere outside a hotspot or the tooltip */
  function onDocPointerDown(e) {
    if (!activeBtn) return;
    if (e.target.closest && (e.target.closest('.hs-btn') || e.target.closest('.w-board-tooltip'))) return;
    closeTooltip();
  }
  document.addEventListener('pointerdown', onDocPointerDown, true);

  /* Hint legend */
  const hint = document.createElement('div');
  hint.className = 'board-hint';
  hint.innerHTML = '<span class="hint-dot"></span><span>Tap any component to learn what it does</span>';
  container.appendChild(hint);

  /* Compact hero mode: tiny breadboard preview linking to the GPIO sim (ch12) */
  let previewEl = null;
  if (compact) {
    previewEl = document.createElement('a');
    previewEl.className = 'gpio-preview';
    previewEl.href = '#/chapter/ch12';
    previewEl.setAttribute('role', 'link');
    previewEl.setAttribute('aria-label', 'Open the GPIO simulator — light up an LED on a breadboard (Chapter 12)');
    previewEl.innerHTML = `${buildPreviewSVG()}<span class="gp-text"><strong>GPIO sim</strong>Light an LED →</span>`;
    const openSim = (e) => { if (e) e.preventDefault(); go('#/chapter/ch12'); };
    previewEl.addEventListener('click', openSim);
    previewEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSim(); }
    });
    container.appendChild(previewEl);
  }

  /* ── BOARD WAKE animation (one-shot, gated behind !prefers-reduced-motion) ── */
  const timers = [];
  const svgEl = wrap.querySelector('svg');

  if (!REDUCED && svgEl) {
    // 1) GPIO pins ripple left→right via staggered animation-delay (set in buildSVG)
    svgEl.querySelectorAll('.gpio-pin').forEach((pin) => pin.classList.add('waking'));
    // after the ripple finishes, hand the header over to the ambient glow strip
    const glowStrip = svgEl.querySelector('.gpio-pin-glow');
    const t1 = setTimeout(() => {
      svgEl.querySelectorAll('.gpio-pin.waking').forEach((p) => p.classList.remove('waking'));
    }, 620 + 20 * 26 + 80);
    timers.push(t1);

    // 2) Activity LED: two quick boot blinks → settle into slow breathing
    const led = svgEl.querySelector('.act-led-glow');
    if (led) {
      led.classList.add('booting');
      const onBootEnd = () => {
        led.classList.remove('booting');
        led.classList.add('breathing');
      };
      led.addEventListener('animationend', onBootEnd, { once: true });
      // belt-and-braces fallback in case animationend doesn't fire
      const t2 = setTimeout(() => {
        if (!led.classList.contains('breathing')) onBootEnd();
      }, 1200);
      timers.push(t2);
    }

    // fade the ambient header glow in once the wake ripple is well underway
    if (glowStrip) {
      const t3 = setTimeout(() => { glowStrip.setAttribute('opacity', '.16'); }, 700);
      timers.push(t3);
    }
  } else if (svgEl) {
    // Reduced motion: render the lit/breathing END-STATE statically (no motion).
    const glowStrip = svgEl.querySelector('.gpio-pin-glow');
    if (glowStrip) glowStrip.setAttribute('opacity', '.16');
    // LED already drawn fully lit in buildSVG under REDUCED.
  }

  /* ── Cleanup (called by the app on view teardown) ── */
  return function cleanup() {
    timers.forEach(clearTimeout);
    document.removeEventListener('pointerdown', onDocPointerDown, true);
    closeTooltip();
  };
}
