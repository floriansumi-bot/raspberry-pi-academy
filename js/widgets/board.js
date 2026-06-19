/* widgets/board.js — Hero Board Inspector: interactive Raspberry Pi 5 top-down SVG
   Exports: mount(container, ctx = {}) */

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
}
.w-board .hs-btn:focus-visible .hs-ring,
.w-board .hs-btn:hover .hs-ring {
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
  pointer-events: none;
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
  font-size: .73rem;
  font-weight: 600;
  color: var(--accent2);
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
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
}
.w-board .board-hint .hint-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent2);
  opacity: .7;
}

/* ---- GPIO pulse animation ---- */
@keyframes gpio-pulse {
  0%,100% { opacity:.22; }
  50%      { opacity:.55; }
}
.gpio-pin-glow {
  animation: gpio-pulse 2.4s ease-in-out infinite;
}

/* ---- Activity LED blink ---- */
@keyframes led-blink {
  0%,100%  { opacity: 1; }
  48%,52%  { opacity: .18; }
}
.act-led-glow {
  animation: led-blink 1.7s ease-in-out infinite;
}

/* compact mode adjustments */
.w-board.compact .board-svg-wrap {
  max-width: 280px;
}
`;
  document.head.appendChild(s);
}

/* ── SVG Board ───────────────────────────────────────────────────────────── */
// viewBox: 212 wide × 212 tall (portrait Pi 5, rotated to typical top-down view)
// Board is 212×212 with real-estate mapping:
//   Top edge (y≈14):  GPIO header
//   Right edge (x≈195): USB stack + Ethernet (stacked USB-A + ETH on one short edge)
//   Bottom edge (y≈200): micro-HDMI pair + USB-C power + microSD
//   Left: mostly free, PCIe FPC ribbon connector inside
//   Centre-ish: SoC+RAM (large square under Active Cooler shield)
//   Top corner: power button + activity LED

function buildSVG(compact) {
  const VW = 212, VH = 212;
  // GPIO pin rows (visual dots along top)
  let gpioPins = '';
  for (let i = 0; i < 20; i++) {
    const x = 26 + i * 5.9 + 1.5;
    gpioPins += `<circle class="gpio-pin" cx="${x}" cy="17" r="1.6" fill="#d4a017"/>`;
    gpioPins += `<circle class="gpio-pin" cx="${x}" cy="22" r="1.6" fill="#d4a017"/>`;
  }

  // PCIe ribbon connector teeth
  let pciePins = '';
  for (let i = 0; i < 12; i++) {
    pciePins += `<rect x="${22 + i * 5}" y="144" width="3" height="5" rx="0.5" fill="#555"/>`;
  }

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
  ${REDUCED ? '' : '<circle class="act-led-glow" cx="29" cy="23" r="3.5" fill="#22cc66" opacity=".9"/>'}
  ${REDUCED ? '<circle cx="29" cy="23" r="3.5" fill="#22cc66" opacity=".9"/>' : ''}
  <!-- GPIO glow strip (ambient) -->
  ${REDUCED ? '' : `<rect class="gpio-pin-glow" x="26" y="14" width="118" height="13" rx="2" fill="#d4a017" opacity=".0"/>`}
</svg>`;
  return svg;
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
  // We'll overlay absolute-positioned buttons that track the SVG viewBox
  const VW = 212, VH = 212;

  function pct(v, total) { return (v / total * 100).toFixed(3) + '%'; }

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  wrap.style.position = 'relative';
  wrap.appendChild(overlay);

  COMPONENTS.forEach((comp) => {
    const btn = document.createElement('button');
    btn.className = 'hs-btn';
    btn.setAttribute('aria-label', comp.label + ' — ' + comp.tip);
    btn.setAttribute('title', comp.label);
    btn.setAttribute('tabindex', '0');
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
    function onEnter() {
      const rect = btn.getBoundingClientRect();
      showTooltip(comp, rect, go);
    }
    function onLeave(e) {
      // don't hide if we moved into the tooltip
      if (ttEl && ttEl.contains(e.relatedTarget)) return;
      hideTooltip();
    }

    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('mouseleave', onLeave);
    btn.addEventListener('focus', onEnter);
    btn.addEventListener('blur', (e) => {
      if (!btn.contains(e.relatedTarget)) hideTooltip();
    });
    btn.addEventListener('click', () => {
      // On touch: toggle tooltip; second tap navigates
      const tt = getTooltip();
      if (tt.classList.contains('hidden')) {
        onEnter();
      } else {
        hideTooltip();
      }
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const tt = getTooltip();
        if (tt.classList.contains('hidden')) {
          onEnter();
        } else {
          go(comp.chapter);
          hideTooltip();
        }
      }
      if (e.key === 'Escape') hideTooltip();
    });

    overlay.appendChild(btn);
  });

  /* Hint legend */
  const hint = document.createElement('div');
  hint.className = 'board-hint';
  hint.innerHTML = '<span class="hint-dot"></span><span>Tap any component to learn what it does</span>';
  container.appendChild(hint);

  /* Cleanup: hide tooltip when container leaves DOM */
  const obs = new MutationObserver(() => {
    if (!document.contains(container)) {
      hideTooltip();
      obs.disconnect();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}
