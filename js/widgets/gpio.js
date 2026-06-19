/* gpio.js — GPIO & BREADBOARD PLAYGROUND
 * The centrepiece maker moment for Chapter 12.
 *   (1) Interactive 40-pin pinout with identify tooltips + legend
 *   (2) Virtual breadboard + parts bin — click-to-assign an LED circuit
 *   (3) Run the book's real code; correct circuit makes the on-screen LED blink
 *   (4) Electrical rules: series resistor required, LED polarity, no short
 *   (5) 3.3 V safety guard — connecting 5 V flares the wire RED + verbatim warning
 *   (6) Button(27) demo — press to toggle the LED
 * Colours/legend/starred pins/warning all reused verbatim from content/chapters/ch12.html.
 */
import { el, icon, toast } from '../ui.js';

/* ── Verbatim 3.3 V damage warning, quoted from ch12.html (the "Careful" warn box) ── */
const WARN_33V =
  'The GPIO pins on the Raspberry Pi 5 operate at 3.3 V logic. If you connect anything ' +
  'that pushes 5 V into a GPIO input pin, you will permanently damage the Pi 5 — there is ' +
  'no fuse to protect it. Always use 3.3 V-compatible components on GPIO pins, or use a ' +
  'level-shifter circuit when you must interface with 5 V devices.';

/* Legend colours — taken straight from the chapter's pinout SVG. */
const C = {
  pwr33: '#f97316',  // 3.3 V power  (orange)
  pwr5:  '#dc2626',  // 5 V power    (red)
  gnd:   '#374151',  // ground       (grey)
  gpio:  '#6d28d9',  // GPIO         (purple)
  spec:  '#0ea5a4',  // special-fn   (teal)
};

/* Full 40-pin map (physical pin → details), matching the chapter pinout exactly.
 * kind drives the colour; bcm/role power the identify tooltip. */
const PINS = [
  { p: 1,  kind: 'pwr33', name: '3.3 V', role: '3.3 V power' },
  { p: 2,  kind: 'pwr5',  name: '5 V',   role: '5 V power' },
  { p: 3,  kind: 'spec',  name: 'GPIO 2',  bcm: 2,  role: 'I²C data (SDA1)' },
  { p: 4,  kind: 'pwr5',  name: '5 V',   role: '5 V power' },
  { p: 5,  kind: 'spec',  name: 'GPIO 3',  bcm: 3,  role: 'I²C clock (SCL1)' },
  { p: 6,  kind: 'gnd',   name: 'GND',   role: 'Ground (0 V)' },
  { p: 7,  kind: 'gpio',  name: 'GPIO 4',  bcm: 4,  role: 'General-purpose I/O' },
  { p: 8,  kind: 'spec',  name: 'GPIO 14', bcm: 14, role: 'UART transmit (TXD)' },
  { p: 9,  kind: 'gnd',   name: 'GND',   role: 'Ground (0 V)' },
  { p: 10, kind: 'spec',  name: 'GPIO 15', bcm: 15, role: 'UART receive (RXD)' },
  { p: 11, kind: 'gpio',  name: 'GPIO 17', bcm: 17, role: 'General-purpose I/O', star: '★ Project 1 — LED' },
  { p: 12, kind: 'spec',  name: 'GPIO 18', bcm: 18, role: 'PWM0 / general I/O' },
  { p: 13, kind: 'gpio',  name: 'GPIO 27', bcm: 27, role: 'General-purpose I/O', star: '✦ Project 2 — Button' },
  { p: 14, kind: 'gnd',   name: 'GND',   role: 'Ground (0 V)' },
  { p: 15, kind: 'gpio',  name: 'GPIO 22', bcm: 22, role: 'General-purpose I/O' },
  { p: 16, kind: 'gpio',  name: 'GPIO 23', bcm: 23, role: 'General-purpose I/O' },
  { p: 17, kind: 'pwr33', name: '3.3 V', role: '3.3 V power' },
  { p: 18, kind: 'gpio',  name: 'GPIO 24', bcm: 24, role: 'General-purpose I/O' },
  { p: 19, kind: 'spec',  name: 'GPIO 10', bcm: 10, role: 'SPI data out (MOSI)' },
  { p: 20, kind: 'gnd',   name: 'GND',   role: 'Ground (0 V)' },
  { p: 21, kind: 'spec',  name: 'GPIO 9',  bcm: 9,  role: 'SPI data in (MISO)' },
  { p: 22, kind: 'gpio',  name: 'GPIO 25', bcm: 25, role: 'General-purpose I/O' },
  { p: 23, kind: 'spec',  name: 'GPIO 11', bcm: 11, role: 'SPI clock (SCLK)' },
  { p: 24, kind: 'spec',  name: 'GPIO 8',  bcm: 8,  role: 'SPI chip-select (CE0)' },
  { p: 25, kind: 'gnd',   name: 'GND',   role: 'Ground (0 V)' },
  { p: 26, kind: 'spec',  name: 'GPIO 7',  bcm: 7,  role: 'SPI chip-select (CE1)' },
  { p: 27, kind: 'spec',  name: 'GPIO 0',  bcm: 0,  role: 'I²C ID EEPROM (ID_SD)' },
  { p: 28, kind: 'spec',  name: 'GPIO 1',  bcm: 1,  role: 'I²C ID EEPROM (ID_SC)' },
  { p: 29, kind: 'gpio',  name: 'GPIO 5',  bcm: 5,  role: 'General-purpose I/O' },
  { p: 30, kind: 'gnd',   name: 'GND',   role: 'Ground (0 V)' },
  { p: 31, kind: 'gpio',  name: 'GPIO 6',  bcm: 6,  role: 'General-purpose I/O' },
  { p: 32, kind: 'spec',  name: 'GPIO 12', bcm: 12, role: 'PWM0 / general I/O' },
  { p: 33, kind: 'spec',  name: 'GPIO 13', bcm: 13, role: 'PWM1 / general I/O' },
  { p: 34, kind: 'gnd',   name: 'GND',   role: 'Ground (0 V)' },
  { p: 35, kind: 'spec',  name: 'GPIO 19', bcm: 19, role: 'SPI data in (MISO)' },
  { p: 36, kind: 'gpio',  name: 'GPIO 16', bcm: 16, role: 'General-purpose I/O' },
  { p: 37, kind: 'gpio',  name: 'GPIO 26', bcm: 26, role: 'General-purpose I/O' },
  { p: 38, kind: 'spec',  name: 'GPIO 20', bcm: 20, role: 'SPI data out (MOSI)' },
  { p: 39, kind: 'gnd',   name: 'GND',   role: 'Ground (0 V)' },
  { p: 40, kind: 'spec',  name: 'GPIO 21', bcm: 21, role: 'SPI clock (SCLK)' },
];
const PIN_BY = (p) => PINS.find((x) => x.p === p);
const LEGEND = [
  ['pwr33', '3.3 V power'],
  ['pwr5',  '5 V power'],
  ['gnd',   'Ground (GND)'],
  ['gpio',  'GPIO (programmable)'],
  ['spec',  'Special-function GPIO'],
];

/* A pin can carry power/signal — used for the safety + correctness checks. */
const isGnd  = (p) => p && PIN_BY(p) && PIN_BY(p).kind === 'gnd';
const is5V   = (p) => p && PIN_BY(p) && PIN_BY(p).kind === 'pwr5';
const isGpio = (p) => p && PIN_BY(p) && PIN_BY(p).kind === 'gpio';

export function mount(container, ctx = {}) {
  injectCSS();
  container.classList.add('w-gpio');
  container.innerHTML = '';

  /* ── circuit state ── */
  const S = {
    step: 0,                 // guided build step (0..4 complete)
    sourcePin: null,         // chosen header pin feeding the circuit
    resistor: false,         // 330Ω placed in series
    ledForward: true,        // LED polarity correct (long leg toward source)
    ledPlaced: false,
    gndPin: null,            // chosen GND-side header pin
    blinking: false,
    buttonHeld: false,
  };

  /* ── layout shell ── */
  const wrap = el('div', { class: 'gp-wrap' });

  wrap.append(
    el('div', { class: 'gp-title' },
      el('span', { class: 'gp-kicker', html: icon('chip', 16) + 'INTERACTIVE' }),
      el('h3', { text: 'GPIO & Breadboard Playground' }),
      el('p', { class: 'gp-sub', text: 'Identify the pins, wire a real LED circuit by clicking, then run the book’s code and watch it blink — safely.' }),
    ),
  );

  /* tabs */
  const tabs = el('div', { class: 'gp-tabs', role: 'tablist' });
  const panels = el('div', { class: 'gp-panels' });
  const TABS = [
    ['pinout', 'Pinout', 'chip'],
    ['build',  'Wire it up', 'spark'],
    ['button', 'Button demo', 'terminal'],
  ];
  const panelEls = {};
  TABS.forEach(([id, label, ic], i) => {
    const b = el('button', {
      class: 'gp-tab' + (i === 0 ? ' on' : ''), role: 'tab', type: 'button',
      'aria-selected': i === 0 ? 'true' : 'false', dataset: { tab: id },
      html: icon(ic, 16) + `<span>${label}</span>`,
      onClick: () => selectTab(id),
    });
    tabs.append(b);
    const pane = el('div', { class: 'gp-pane' + (i === 0 ? ' on' : ''), role: 'tabpanel', dataset: { pane: id } });
    panelEls[id] = pane;
    panels.append(pane);
  });
  wrap.append(tabs, panels);
  container.append(wrap);

  function selectTab(id) {
    tabs.querySelectorAll('.gp-tab').forEach((t) => {
      const on = t.dataset.tab === id;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.querySelectorAll('.gp-pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === id));
  }

  /* shared tooltip element (used by both pinout grids) */
  const tip = el('div', { class: 'gp-tip', role: 'status', 'aria-live': 'polite' });
  container.append(tip);
  let tipPin = null;
  function showTip(pin, target) {
    const d = PIN_BY(pin); if (!d) return;
    tipPin = pin;
    tip.innerHTML =
      `<span class="gp-tip-sw" style="background:${C[d.kind]}"></span>` +
      `<strong>Physical pin ${d.p}</strong> · ${escapeH(d.name)}` +
      (d.bcm != null ? ` <span class="gp-tip-bcm">BCM ${d.bcm}</span>` : '') +
      `<div class="gp-tip-role">${escapeH(d.role)}</div>` +
      (d.star ? `<div class="gp-tip-star">${escapeH(d.star)}</div>` : '');
    const r = target.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    tip.style.left = (r.left - cr.left + r.width / 2) + 'px';
    tip.style.top = (r.top - cr.top - 8) + 'px';
    tip.classList.add('on');
  }
  function hideTip() { tip.classList.remove('on'); tipPin = null; }

  /* ───────────────────────── (1) PINOUT ───────────────────────── */
  buildPinout(panelEls.pinout, { showTip, hideTip, onPick });

  /* ───────────────────────── (2) BUILD ───────────────────────── */
  const buildUI = buildPlayground(panelEls.build, S, { showTip, hideTip, onPick, render });

  /* ───────────────────────── (3) BUTTON ───────────────────────── */
  buildButtonDemo(panelEls.button, S);

  /* Clicking a header pin assigns it to the next slot in the build flow. */
  function onPick(pin) {
    selectTab('build');
    const d = PIN_BY(pin);
    // Decide what this click means based on where we are.
    if (!S.sourcePin) {
      // first connection — the wire LEAVING the header toward the resistor/LED
      if (is5V(pin)) {            // 5 V into the signal path → fire the guard
        S.sourcePin = pin;
        buildUI.flare5V();
        buildUI.render();
        return;
      }
      S.sourcePin = pin;
      buildUI.render();
      toast(`Source set to ${d.name} (pin ${d.p})`);
    } else if (!S.gndPin && isGnd(pin)) {
      S.gndPin = pin;
      buildUI.render();
      toast(`Return leg connected to GND (pin ${d.p})`);
    } else if (is5V(pin)) {
      buildUI.flare5V();
    } else {
      // re-pick the source
      S.sourcePin = pin;
      buildUI.render();
    }
  }

  function render() { buildUI.render(); }

  // expose the active tooltip pin so keyboard users get parity (handled inside grids)
  void tipPin;
}

/* ════════════════ PINOUT GRID (reused by build pane too) ════════════════ */
function pinGrid({ showTip, hideTip, onPick, compact }) {
  const grid = el('div', { class: 'gp-grid' + (compact ? ' compact' : '') });
  // header strip illustration
  grid.append(el('div', { class: 'gp-board-edge', html: '◤ pin 1 nearest the board corner' }));
  const rows = el('div', { class: 'gp-rows' });
  for (let r = 0; r < 20; r++) {
    const left = PIN_BY(r * 2 + 1);
    const right = PIN_BY(r * 2 + 2);
    const row = el('div', { class: 'gp-row' });
    row.append(pinBtn(left, 'L', { showTip, hideTip, onPick }));
    row.append(pinBtn(right, 'R', { showTip, hideTip, onPick }));
    rows.append(row);
  }
  grid.append(rows);
  return grid;
}

function pinBtn(d, side, { showTip, hideTip, onPick }) {
  const b = el('button', {
    type: 'button',
    class: `gp-pin k-${d.kind} side-${side}` + (d.star ? ' star' : ''),
    dataset: { pin: String(d.p) },
    'aria-label': `Physical pin ${d.p}, ${d.name}, ${d.role}`,
    style: { '--pc': C[d.kind] },
    onMouseenter: (e) => showTip(d.p, e.currentTarget),
    onFocus: (e) => showTip(d.p, e.currentTarget),
    onMouseleave: hideTip,
    onBlur: hideTip,
    onClick: () => onPick && onPick(d.p),
  });
  const num = el('span', { class: 'gp-pin-num', text: String(d.p) });
  const lab = el('span', { class: 'gp-pin-lab', text: d.name });
  const hole = el('span', { class: 'gp-pin-hole', 'aria-hidden': 'true' });
  if (side === 'L') { b.append(lab, hole, num); }
  else { b.append(num, hole, lab); }
  if (d.star) b.append(el('span', { class: 'gp-pin-star', 'aria-hidden': 'true', text: d.star[0] }));
  return b;
}

function buildPinout(pane, h) {
  pane.append(el('p', { class: 'gp-lead', text: 'Hover, tap, or keyboard-focus any pin to identify it — physical number, GPIO (BCM) name, and what it does. The two starred pins are the ones the projects use.' }));
  pane.append(legendRow());
  pane.append(pinGrid({ ...h, compact: false }));
  pane.append(el('p', { class: 'gp-foot', html: '★ <strong>GPIO 17</strong> (pin 11) drives the LED · ✦ <strong>GPIO 27</strong> (pin 13) reads the button. Click a pin to start wiring it in the next tab.' }));
}

function legendRow() {
  const row = el('div', { class: 'gp-legend', role: 'list', 'aria-label': 'Pin colour legend' });
  LEGEND.forEach(([k, label]) => {
    row.append(el('span', { class: 'gp-leg', role: 'listitem' },
      el('span', { class: 'gp-leg-sw', style: { background: C[k] } }),
      el('span', { text: label }),
    ));
  });
  return row;
}

/* ════════════════════════ PLAYGROUND (wire it up) ════════════════════════ */
function buildPlayground(pane, S, h) {
  /* layout: left = mini pin column + parts bin; right = breadboard + run */
  pane.append(el('p', { class: 'gp-lead', text: 'Build the LED circuit by clicking. Follow the hint at each step: pick a signal pin, drop the 330 Ω resistor in series, set the LED the right way round, then run the wire’s other leg to a GND pin.' }));

  const cols = el('div', { class: 'gp-cols' });

  /* — left column: compact header + parts bin — */
  const leftCol = el('div', { class: 'gp-left' });
  leftCol.append(el('div', { class: 'gp-cap', text: 'GPIO header — click a pin' }));
  leftCol.append(legendRow());
  leftCol.append(pinGrid({ ...h, compact: true }));
  cols.append(leftCol);

  /* — right column: breadboard, parts, run — */
  const rightCol = el('div', { class: 'gp-right' });

  /* the visible LED + breadboard schematic */
  const stage = el('div', { class: 'gp-stage' });
  stage.innerHTML = stageSVG();
  rightCol.append(stage);

  /* parts bin (click to toggle into the circuit) */
  const bin = el('div', { class: 'gp-bin' });
  const partResistor = el('button', {
    type: 'button', class: 'gp-part', dataset: { part: 'res' },
    'aria-pressed': 'false',
    html: partSVG('res') + '<span>330 Ω resistor</span><em>series — required</em>',
    onClick: () => { S.resistor = !S.resistor; render(); toast(S.resistor ? 'Resistor placed in series' : 'Resistor removed'); },
  });
  const partLed = el('button', {
    type: 'button', class: 'gp-part', dataset: { part: 'led' },
    'aria-pressed': 'false',
    html: partSVG('led') + '<span>LED</span><em>long leg = + (anode)</em>',
    onClick: () => { S.ledPlaced = !S.ledPlaced; if (!S.ledPlaced) S.ledForward = true; render(); },
  });
  const partFlip = el('button', {
    type: 'button', class: 'gp-part gp-flip',
    html: partSVG('flip') + '<span>Flip the LED</span><em>swap polarity</em>',
    onClick: () => { if (!S.ledPlaced) { toast('Place the LED first'); return; } S.ledForward = !S.ledForward; render(); toast(S.ledForward ? 'LED forward (long leg toward signal)' : 'LED reversed'); },
  });
  const partWire = el('button', {
    type: 'button', class: 'gp-part gp-wire-part',
    html: partSVG('wire') + '<span>Jumper wire</span><em>auto-routed</em>',
    onClick: () => toast('Wires route automatically as you pick pins'),
  });
  bin.append(partResistor, partLed, partFlip, partWire);
  rightCol.append(el('div', { class: 'gp-cap', text: 'Parts bin' }), bin);

  /* hint + status line */
  const hint = el('div', { class: 'gp-hint', role: 'status', 'aria-live': 'polite' });
  rightCol.append(hint);

  /* run + reset */
  const runRow = el('div', { class: 'gp-runrow' });
  const runBtn = el('button', { type: 'button', class: 'gp-run', html: '<span class="gp-run-ic" aria-hidden="true">▶</span> Run the code', onClick: doRun });
  const resetBtn = el('button', { type: 'button', class: 'gp-reset', text: 'Reset', onClick: doReset });
  runRow.append(runBtn, resetBtn);
  rightCol.append(runRow);

  /* the book's real code block */
  const code = el('pre', { class: 'gp-code' });
  code.innerHTML = codeBlock(false);
  rightCol.append(code);

  /* result line + safety guard host */
  const result = el('div', { class: 'gp-result' });
  rightCol.append(result);
  const guard = el('div', { class: 'gp-guard', hidden: true });
  rightCol.append(guard);

  cols.append(rightCol);
  pane.append(cols);

  /* ── helpers that read S and repaint ── */
  function stageRefs() {
    return {
      svg: stage.querySelector('svg'),
      led: stage.querySelector('#gp-led'),
      glow: stage.querySelector('#gp-glow'),
      wSig: stage.querySelector('#gp-w-sig'),
      wGnd: stage.querySelector('#gp-w-gnd'),
      res: stage.querySelector('#gp-res'),
      ledLabel: stage.querySelector('#gp-led-label'),
      srcLabel: stage.querySelector('#gp-src-label'),
      gndLabel: stage.querySelector('#gp-gnd-label'),
      anode: stage.querySelector('#gp-anode'),
      cathode: stage.querySelector('#gp-cathode'),
    };
  }

  function diagnose() {
    // returns {ok, msg, level} — level: 'ok'|'warn'|'danger'|'info'
    if (S.sourcePin && is5V(S.sourcePin))
      return { ok: false, level: 'danger', msg: 'A 5 V pin is wired into the signal path — that is exactly the move the book warns about. See the red warning below.' };
    if (!S.sourcePin)
      return { ok: false, level: 'info', msg: 'Step 1 — click a signal pin on the header. GPIO 17 (pin 11, starred) is the one the book uses.' };
    if (isGnd(S.sourcePin))
      return { ok: false, level: 'warn', msg: 'That is a GND pin. The current has to start from a GPIO signal pin — try GPIO 17 (pin 11).' };
    if (!S.resistor)
      return { ok: false, level: 'warn', msg: 'An LED needs a series resistor or it will burn out — click the 330 Ω resistor in the parts bin.' };
    if (!S.ledPlaced)
      return { ok: false, level: 'info', msg: 'Step 3 — click the LED in the parts bin to drop it in after the resistor.' };
    if (!S.ledForward)
      return { ok: false, level: 'warn', msg: 'The LED looks backwards — its long leg (anode) must face the signal side. Try flipping it.' };
    if (!S.gndPin)
      return { ok: false, level: 'info', msg: 'Last step — connect the LED’s other leg to a GND pin (the grey ones, e.g. pin 6).' };
    return { ok: true, level: 'ok', msg: 'Circuit complete: ' + PIN_BY(S.sourcePin).name + ' → 330 Ω → LED → GND. Hit Run.' };
  }

  function render() {
    const r = stageRefs();
    const dg = diagnose();
    const short5 = S.sourcePin && is5V(S.sourcePin);

    // parts pressed state
    partResistor.classList.toggle('on', S.resistor);
    partResistor.setAttribute('aria-pressed', String(S.resistor));
    partLed.classList.toggle('on', S.ledPlaced);
    partLed.setAttribute('aria-pressed', String(S.ledPlaced));
    partFlip.classList.toggle('rev', S.ledPlaced && !S.ledForward);

    // resistor visible only when placed
    if (r.res) r.res.style.opacity = S.resistor ? '1' : '0.18';

    // LED placement + polarity flip (rotate the LED group)
    if (r.led) {
      r.led.style.opacity = S.ledPlaced ? '1' : '0.18';
      r.led.style.transform = S.ledForward ? 'none' : 'translateX(355px) scaleX(-1)';
    }

    // signal wire colour: source pin's colour, or red flare on 5 V
    const srcCol = S.sourcePin ? (short5 ? C.pwr5 : C[PIN_BY(S.sourcePin).kind]) : '#9aa3af';
    if (r.wSig) {
      r.wSig.setAttribute('stroke', srcCol);
      r.wSig.classList.toggle('flare', short5);
      r.wSig.style.opacity = S.sourcePin ? '1' : '0.3';
    }
    if (r.wGnd) {
      r.wGnd.style.opacity = S.gndPin ? '1' : '0.3';
      r.wGnd.setAttribute('stroke', S.gndPin ? C.gnd : '#9aa3af');
    }

    // labels
    if (r.srcLabel) r.srcLabel.textContent = S.sourcePin ? `${PIN_BY(S.sourcePin).name} · pin ${S.sourcePin}` : 'pick a signal pin';
    if (r.gndLabel) r.gndLabel.textContent = S.gndPin ? `GND · pin ${S.gndPin}` : 'pick a GND pin';

    // hint
    hint.className = 'gp-hint lv-' + dg.level;
    hint.innerHTML = (dg.ok ? icon('check', 16) : '') + `<span>${escapeH(dg.msg)}</span>`;

    // run button enabled only when complete (and not on a 5 V short)
    runBtn.disabled = !dg.ok;
    runBtn.classList.toggle('ready', dg.ok);

    // safety guard visibility (only via 5 V path; explicit flare also calls it)
    if (short5) showGuard(); else hideGuard();

    // sync the button-demo LED if it mirrors
  }

  function doRun() {
    const dg = diagnose();
    if (!dg.ok) { toast(dg.msg); return; }
    code.innerHTML = codeBlock(true);
    const r = stageRefs();
    S.blinking = true;
    if (r.led) r.led.classList.add('blink');
    if (r.glow) r.glow.classList.add('blink');
    result.className = 'gp-result ok show';
    result.innerHTML = `${icon('check', 18)} <strong>It blinks! 🎉</strong> Your GPIO 17 LED is flashing on for one second, off for one second — exactly what <code>led.blink()</code> does on a real Pi.`;
    if (typeof window !== 'undefined') {
      try { import('../ui.js').then((m) => m.bloom && m.bloom(innerWidth / 2, 180)); } catch (e) { /* optional */ }
    }
  }

  function doReset() {
    S.sourcePin = null; S.resistor = false; S.ledPlaced = false; S.ledForward = true; S.gndPin = null; S.blinking = false;
    const r = stageRefs();
    if (r.led) r.led.classList.remove('blink');
    if (r.glow) r.glow.classList.remove('blink');
    code.innerHTML = codeBlock(false);
    result.className = 'gp-result';
    result.innerHTML = '';
    hideGuard();
    render();
  }

  function showGuard() {
    guard.hidden = false;
    guard.innerHTML =
      `<div class="gp-guard-head">${icon('spark', 18)} 5 V into a signal pin — STOP</div>` +
      `<blockquote class="gp-guard-quote">“${escapeH(WARN_33V)}”</blockquote>` +
      `<div class="gp-guard-foot">Good news: here it is just a lesson. On a real Pi this is the one mistake there is no undo for — that is why the wire flared <strong>red</strong>. Pick GPIO 17 (pin 11) instead.</div>`;
    guard.classList.add('show');
  }
  function hideGuard() { guard.classList.remove('show'); guard.hidden = true; }

  function flare5V() {
    // force a brief stage flash even before full render
    showGuard();
    const r = stageRefs();
    if (r.wSig) { r.wSig.classList.add('flare'); }
    toast('⚠ 5 V can permanently damage a GPIO pin');
  }

  render();
  return { render, flare5V };
}

/* ════════════════════════ BUTTON DEMO ════════════════════════ */
function buildButtonDemo(pane, S) {
  pane.append(el('p', { class: 'gp-lead', html: 'Project 2 mirrored: a <strong>Button(27)</strong> wired to GPIO 27 (pin 13). Press and hold it — the LED lights while held and goes off when released, just like <code>button.when_pressed</code> / <code>when_released</code> in the book.' }));

  const stage = el('div', { class: 'gp-btn-stage' });
  stage.innerHTML = btnStageSVG();
  pane.append(stage);

  const ledEl = stage.querySelector('#gpb-led');
  const glowEl = stage.querySelector('#gpb-glow');

  const controls = el('div', { class: 'gp-btn-controls' });
  const push = el('button', {
    type: 'button', class: 'gp-bigbtn',
    'aria-pressed': 'false',
    html: '<span class="gp-bigbtn-cap" aria-hidden="true"></span><span class="gp-bigbtn-txt">Press &amp; hold</span>',
  });
  const setHeld = (held) => {
    S.buttonHeld = held;
    push.classList.toggle('down', held);
    push.setAttribute('aria-pressed', String(held));
    if (ledEl) ledEl.classList.toggle('on', held);
    if (glowEl) glowEl.classList.toggle('on', held);
    stateLine.innerHTML = held
      ? `<span class="lv-ok">${icon('check', 15)} Pressed → GPIO 27 reads HIGH → <code>led.on()</code> → LED ON</span>`
      : `<span class="lv-info">Released → internal pull-down holds GPIO 27 LOW → <code>led.off()</code> → LED off</span>`;
  };
  // pointer + keyboard hold semantics
  push.addEventListener('pointerdown', (e) => { e.preventDefault(); setHeld(true); });
  push.addEventListener('pointerup', () => setHeld(false));
  push.addEventListener('pointerleave', () => { if (S.buttonHeld) setHeld(false); });
  push.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); setHeld(true); } });
  push.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setHeld(false); } });
  push.addEventListener('blur', () => { if (S.buttonHeld) setHeld(false); });
  controls.append(push);
  pane.append(controls);

  const stateLine = el('div', { class: 'gp-btn-state', role: 'status', 'aria-live': 'polite' });
  pane.append(stateLine);

  const code = el('pre', { class: 'gp-code' });
  code.innerHTML =
    '<span class="k">from</span> gpiozero <span class="k">import</span> LED, Button\n' +
    '<span class="k">from</span> signal <span class="k">import</span> pause\n\n' +
    'led = <span class="t">LED</span>(<span class="n">17</span>)\n' +
    'button = <span class="t">Button</span>(<span class="n">27</span>)\n\n' +
    'button.when_pressed = led.on\n' +
    'button.when_released = led.off\n\n' +
    '<span class="t">pause</span>()';
  pane.append(code);

  setHeld(false);
}

/* ════════════════════════ SVG / code builders ════════════════════════ */
function stageSVG() {
  return `
  <svg viewBox="0 0 560 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="LED circuit schematic from the GPIO signal pin through a 330 ohm resistor to the LED and back to ground">
    <!-- header stub -->
    <rect x="8" y="40" width="70" height="120" rx="8" fill="var(--code-bg)"/>
    <text x="43" y="34" text-anchor="middle" class="gp-svg-cap">header</text>
    <circle cx="40" cy="74" r="6" fill="${C.gpio}"/>
    <text id="gp-src-label" x="40" y="98" text-anchor="middle" class="gp-svg-pin">pick a signal pin</text>
    <circle cx="40" cy="128" r="6" fill="${C.gnd}"/>
    <text id="gp-gnd-label" x="40" y="152" text-anchor="middle" class="gp-svg-pin">pick a GND pin</text>

    <!-- signal wire: header -> resistor -> LED -->
    <path id="gp-w-sig" d="M46 74 H150" fill="none" stroke="#9aa3af" stroke-width="5" stroke-linecap="round"/>
    <!-- resistor -->
    <g id="gp-res">
      <rect x="150" y="60" width="70" height="28" rx="7" fill="#d4a372" stroke="var(--ink)" stroke-width="1.5"/>
      <rect x="160" y="60" width="6" height="28" fill="${C.pwr33}"/>
      <rect x="170" y="60" width="6" height="28" fill="${C.pwr33}"/>
      <rect x="180" y="60" width="6" height="28" fill="#92400e"/>
      <rect x="196" y="60" width="6" height="28" fill="#ca8a04"/>
      <text x="185" y="52" text-anchor="middle" class="gp-svg-cap">330 Ω</text>
    </g>
    <path d="M220 74 H300" fill="none" stroke="${C.gpio}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>

    <!-- LED group (flippable). long leg (anode) on left toward signal -->
    <g id="gp-led">
      <ellipse id="gp-glow" cx="338" cy="64" rx="34" ry="26" fill="#fde047" opacity="0"/>
      <path d="M322 86 v-22 a16 16 0 0 1 32 0 v22 z" fill="#ef4444" stroke="var(--ink)" stroke-width="1.6"/>
      <ellipse cx="338" cy="64" rx="16" ry="9" fill="#f87171" stroke="var(--ink)" stroke-width="1.6"/>
      <!-- anode (long) left, cathode (short) right -->
      <line id="gp-anode" x1="328" y1="86" x2="328" y2="150" stroke="var(--ink)" stroke-width="3"/>
      <line id="gp-cathode" x1="348" y1="86" x2="348" y2="128" stroke="var(--ink)" stroke-width="3"/>
      <text id="gp-led-label" x="338" y="106" text-anchor="middle" class="gp-svg-cap" dy="2"></text>
      <text x="318" y="124" text-anchor="end" class="gp-svg-leg" fill="${C.gpio}">＋ long</text>
      <text x="360" y="120" text-anchor="start" class="gp-svg-leg">－ short</text>
    </g>

    <!-- ground return wire: cathode -> back to header GND -->
    <path id="gp-w-gnd" d="M348 128 V178 H40 V134" fill="none" stroke="#9aa3af" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- breadboard hint -->
    <rect x="110" y="40" width="280" height="150" rx="10" fill="none" stroke="#c9b89a" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.5"/>
    <text x="250" y="206" text-anchor="middle" class="gp-svg-cap" opacity="0.7">breadboard</text>
  </svg>`;
}

function btnStageSVG() {
  return `
  <svg viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Button on GPIO 27 toggling the GPIO 17 LED">
    <rect x="8" y="36" width="70" height="110" rx="8" fill="var(--code-bg)"/>
    <circle cx="40" cy="66" r="6" fill="${C.gpio}"/>
    <text x="40" y="88" text-anchor="middle" class="gp-svg-pin">GPIO 27 · 13</text>
    <circle cx="40" cy="116" r="6" fill="${C.pwr33}"/>
    <text x="40" y="138" text-anchor="middle" class="gp-svg-pin">3.3 V · 1</text>

    <!-- GPIO27 wire to button -->
    <path d="M46 66 H210" stroke="${C.gpio}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <!-- 3.3V wire to button -->
    <path d="M46 116 H250 V96" stroke="${C.pwr33}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- button -->
    <rect x="208" y="56" width="46" height="46" rx="6" fill="var(--code-bg)" stroke="var(--ink)" stroke-width="2"/>
    <circle cx="231" cy="79" r="10" fill="${C.gpio}"/>
    <text x="231" y="120" text-anchor="middle" class="gp-svg-cap">Button(27)</text>

    <!-- wire button-LED -->
    <path d="M254 79 H300" stroke="${C.gpio}" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.85"/>

    <!-- LED -->
    <ellipse id="gpb-glow" class="gpb-glow" cx="360" cy="70" rx="34" ry="26" fill="#fde047" opacity="0"/>
    <g id="gpb-led" class="gpb-led">
      <path d="M344 92 v-22 a16 16 0 0 1 32 0 v22 z" fill="#ef4444" stroke="var(--ink)" stroke-width="1.6"/>
      <ellipse cx="360" cy="70" rx="16" ry="9" fill="#f87171" stroke="var(--ink)" stroke-width="1.6"/>
      <line x1="350" y1="92" x2="350" y2="150" stroke="var(--ink)" stroke-width="3"/>
      <line x1="370" y1="92" x2="370" y2="150" stroke="var(--ink)" stroke-width="3"/>
    </g>
    <text x="360" y="172" text-anchor="middle" class="gp-svg-cap">LED on GPIO 17</text>
  </svg>`;
}

function partSVG(kind) {
  if (kind === 'res') return `<svg viewBox="0 0 60 28" class="gp-part-svg" aria-hidden="true"><line x1="2" y1="14" x2="12" y2="14" stroke="currentColor" stroke-width="2"/><rect x="12" y="6" width="36" height="16" rx="4" fill="#d4a372" stroke="var(--ink)" stroke-width="1"/><rect x="17" y="6" width="4" height="16" fill="${C.pwr33}"/><rect x="23" y="6" width="4" height="16" fill="${C.pwr33}"/><rect x="29" y="6" width="4" height="16" fill="#92400e"/><rect x="39" y="6" width="4" height="16" fill="#ca8a04"/><line x1="48" y1="14" x2="58" y2="14" stroke="currentColor" stroke-width="2"/></svg>`;
  if (kind === 'led') return `<svg viewBox="0 0 40 40" class="gp-part-svg" aria-hidden="true"><path d="M12 24 v-8 a8 8 0 0 1 16 0 v8 z" fill="#ef4444" stroke="var(--ink)" stroke-width="1.2"/><ellipse cx="20" cy="16" rx="8" ry="4.5" fill="#f87171" stroke="var(--ink)" stroke-width="1.2"/><line x1="15" y1="24" x2="15" y2="38" stroke="currentColor" stroke-width="2"/><line x1="25" y1="24" x2="25" y2="33" stroke="currentColor" stroke-width="2"/></svg>`;
  if (kind === 'flip') return `<svg viewBox="0 0 40 40" class="gp-part-svg" aria-hidden="true"><path d="M10 14 a12 12 0 1 1 -2 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M6 10 l4 6 -7 1 z" fill="currentColor"/></svg>`;
  return `<svg viewBox="0 0 40 28" class="gp-part-svg" aria-hidden="true"><path d="M4 14 C 14 4, 26 24, 36 14" fill="none" stroke="${C.gpio}" stroke-width="3" stroke-linecap="round"/><circle cx="4" cy="14" r="3" fill="${C.gpio}"/><circle cx="36" cy="14" r="3" fill="${C.gpio}"/></svg>`;
}

function codeBlock(running) {
  return (
    '<span class="k">from</span> gpiozero <span class="k">import</span> LED\n' +
    '<span class="k">from</span> signal <span class="k">import</span> pause\n\n' +
    'led = <span class="t">LED</span>(<span class="n">17</span>)\n' +
    `led.<span class="m">blink</span>()${running ? '  <span class="run-mark">▶ running…</span>' : ''}\n` +
    '<span class="t">pause</span>()'
  );
}

/* tiny escaper for tooltip text */
function escapeH(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ════════════════════════ STYLES ════════════════════════ */
function injectCSS() {
  if (document.getElementById('w-gpio-css')) return;
  const s = document.createElement('style');
  s.id = 'w-gpio-css';
  s.textContent = `
  .w-gpio{display:block;margin:1.4rem 0}
  .w-gpio *{box-sizing:border-box}
  .w-gpio .gp-wrap{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden}
  .w-gpio .gp-title{padding:1.1rem 1.2rem .6rem}
  .w-gpio .gp-kicker{display:inline-flex;align-items:center;gap:.4rem;font-family:var(--font-mono);font-size:.66rem;letter-spacing:.14em;color:var(--accent);background:var(--accent-soft);padding:.22rem .55rem;border-radius:999px}
  .w-gpio .gp-kicker svg{width:14px;height:14px}
  .w-gpio .gp-title h3{font-family:var(--font-display);font-size:1.4rem;margin:.5rem 0 .25rem;color:var(--ink)}
  .w-gpio .gp-sub{color:var(--ink-soft);font-size:.92rem;margin:0;max-width:60ch}

  .w-gpio .gp-tabs{display:flex;gap:.3rem;padding:0 1rem;border-bottom:1px solid var(--line);flex-wrap:wrap}
  .w-gpio .gp-tab{appearance:none;border:0;background:transparent;color:var(--ink-soft);font:inherit;font-size:.9rem;font-weight:600;display:inline-flex;align-items:center;gap:.4rem;padding:.7rem .85rem;cursor:pointer;border-bottom:2px solid transparent;border-radius:var(--radius-sm) var(--radius-sm) 0 0}
  .w-gpio .gp-tab svg{width:16px;height:16px;opacity:.8}
  .w-gpio .gp-tab:hover{color:var(--ink);background:var(--surface2)}
  .w-gpio .gp-tab.on{color:var(--accent);border-bottom-color:var(--accent)}
  .w-gpio .gp-tab:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

  .w-gpio .gp-pane{display:none;padding:1.1rem 1.2rem 1.3rem}
  .w-gpio .gp-pane.on{display:block;animation:gp-fade .25s ease}
  @keyframes gp-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion:reduce){.w-gpio .gp-pane.on{animation:none}}

  .w-gpio .gp-lead{color:var(--ink-soft);font-size:.9rem;margin:.1rem 0 .9rem;max-width:68ch}
  .w-gpio .gp-lead code,.w-gpio .gp-foot code{font-family:var(--font-mono);font-size:.82em;background:var(--surface2);padding:.05em .35em;border-radius:4px}
  .w-gpio .gp-foot{color:var(--ink-soft);font-size:.82rem;margin:.9rem 0 0}
  .w-gpio .gp-cap{font-family:var(--font-mono);font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft);margin:.2rem 0 .5rem}

  /* legend */
  .w-gpio .gp-legend{display:flex;flex-wrap:wrap;gap:.5rem .9rem;margin:0 0 .9rem;padding:.55rem .7rem;background:var(--surface2);border:1px solid var(--line);border-radius:var(--radius-sm)}
  .w-gpio .gp-leg{display:inline-flex;align-items:center;gap:.4rem;font-size:.78rem;color:var(--ink)}
  .w-gpio .gp-leg-sw{width:13px;height:13px;border-radius:3px;flex:0 0 auto;box-shadow:0 0 0 1px rgba(0,0,0,.15) inset}

  /* pin grid */
  .w-gpio .gp-grid{margin:0}
  .w-gpio .gp-board-edge{font-family:var(--font-mono);font-size:.66rem;color:var(--ink-soft);margin:0 0 .35rem}
  .w-gpio .gp-rows{display:flex;flex-direction:column;gap:4px;background:var(--code-bg);padding:10px;border-radius:var(--radius-sm);border:1px solid var(--line)}
  .w-gpio .gp-row{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .w-gpio .gp-pin{appearance:none;font:inherit;cursor:pointer;display:flex;align-items:center;gap:6px;padding:3px 7px;border-radius:7px;border:1px solid transparent;background:rgba(255,255,255,.04);color:#e8e8ee;min-height:30px;transition:transform .1s,background .15s,box-shadow .15s}
  .w-gpio .gp-pin.side-R{flex-direction:row}
  .w-gpio .gp-pin.side-L{flex-direction:row-reverse;text-align:right}
  .w-gpio .gp-pin-num{font-family:var(--font-mono);font-size:.7rem;font-weight:700;width:20px;text-align:center;color:#fff;background:rgba(255,255,255,.12);border-radius:4px;padding:1px 0;flex:0 0 auto}
  .w-gpio .gp-pin-hole{width:11px;height:11px;border-radius:50%;background:var(--pc);box-shadow:0 0 0 2px rgba(0,0,0,.35),0 0 6px var(--pc);flex:0 0 auto}
  .w-gpio .gp-pin-lab{font-size:.74rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1 1 auto}
  .w-gpio .gp-pin:hover,.w-gpio .gp-pin:focus-visible{background:rgba(255,255,255,.13);transform:translateY(-1px);outline:none}
  .w-gpio .gp-pin:focus-visible{box-shadow:0 0 0 2px var(--accent)}
  .w-gpio .gp-pin.star{box-shadow:0 0 0 1px var(--pc) inset}
  .w-gpio .gp-pin-star{font-size:.7rem;color:var(--pc);margin-left:auto}
  .w-gpio .gp-pin.side-L .gp-pin-star{margin-left:0;margin-right:auto;order:-1}
  /* compact (build column) */
  .w-gpio .gp-grid.compact .gp-rows{padding:7px;gap:3px}
  .w-gpio .gp-grid.compact .gp-pin{min-height:26px;padding:2px 5px}
  .w-gpio .gp-grid.compact .gp-pin-lab{font-size:.68rem}

  /* build columns */
  .w-gpio .gp-cols{display:grid;grid-template-columns:minmax(220px,1fr) minmax(280px,1.25fr);gap:1.1rem;align-items:start}
  @media (max-width:760px){.w-gpio .gp-cols{grid-template-columns:1fr}}
  .w-gpio .gp-left,.w-gpio .gp-right{min-width:0}

  /* stage */
  .w-gpio .gp-stage{background:var(--surface2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:.5rem}
  .w-gpio .gp-stage svg,.w-gpio .gp-btn-stage svg{width:100%;height:auto;display:block}
  .w-gpio .gp-svg-cap{font-family:var(--font-mono);font-size:9px;fill:var(--ink-soft)}
  .w-gpio .gp-svg-pin{font-family:var(--font-mono);font-size:8.5px;fill:#cfd3dc}
  .w-gpio .gp-svg-leg{font-family:var(--font-body);font-size:9px;fill:var(--ink-soft)}
  #gp-led,#gpb-led{transition:opacity .2s}
  #gp-w-sig{transition:stroke .2s,opacity .2s}
  #gp-w-sig.flare{stroke:${C.pwr5} !important;animation:gp-flare .7s ease-in-out infinite}
  @keyframes gp-flare{0%,100%{filter:drop-shadow(0 0 1px ${C.pwr5})}50%{filter:drop-shadow(0 0 7px ${C.pwr5})}}
  #gp-led.blink,#gpb-led.on{animation:gp-onoff 2s steps(1,end) infinite}
  #gpb-led.on{animation:none;filter:drop-shadow(0 0 8px #fde047)}
  #gp-glow.blink{animation:gp-glow 2s steps(1,end) infinite}
  #gpb-glow.on{opacity:.85 !important}
  @keyframes gp-onoff{0%,49%{filter:drop-shadow(0 0 9px #fde047) brightness(1.25)}50%,100%{filter:none;opacity:.55}}
  @keyframes gp-glow{0%,49%{opacity:.8}50%,100%{opacity:0}}
  @media (prefers-reduced-motion:reduce){
    #gp-w-sig.flare{animation:none;filter:drop-shadow(0 0 6px ${C.pwr5})}
    #gp-led.blink{animation:none;filter:drop-shadow(0 0 9px #fde047) brightness(1.25)}
    #gp-glow.blink{animation:none;opacity:.8}
  }

  /* parts bin */
  .w-gpio .gp-bin{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.8rem}
  @media (max-width:420px){.w-gpio .gp-bin{grid-template-columns:1fr}}
  .w-gpio .gp-part{appearance:none;font:inherit;text-align:left;cursor:pointer;display:flex;align-items:center;gap:.55rem;padding:.5rem .6rem;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface);color:var(--ink);transition:border-color .15s,background .15s,transform .1s;flex-wrap:wrap}
  .w-gpio .gp-part span{font-size:.8rem;font-weight:600}
  .w-gpio .gp-part em{font-size:.66rem;color:var(--ink-soft);font-style:normal;flex-basis:100%;margin-left:calc(40px + .55rem)}
  .w-gpio .gp-part-svg{width:40px;height:28px;flex:0 0 auto;color:var(--ink-soft)}
  .w-gpio .gp-part:hover{border-color:var(--accent);transform:translateY(-1px)}
  .w-gpio .gp-part:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .w-gpio .gp-part.on{border-color:var(--accent);background:var(--accent-soft)}
  .w-gpio .gp-part.on span{color:var(--accent)}
  .w-gpio .gp-flip.rev .gp-part-svg{color:var(--warm)}

  /* hint */
  .w-gpio .gp-hint{display:flex;align-items:flex-start;gap:.5rem;font-size:.85rem;padding:.6rem .75rem;border-radius:var(--radius-sm);border:1px solid var(--line);background:var(--surface2);color:var(--ink);margin-bottom:.7rem;min-height:2.4rem}
  .w-gpio .gp-hint svg{flex:0 0 auto;margin-top:1px}
  .w-gpio .gp-hint.lv-ok{background:var(--success-soft);border-color:var(--success);color:var(--ink)}
  .w-gpio .gp-hint.lv-ok svg{color:var(--success)}
  .w-gpio .gp-hint.lv-warn{background:var(--warm-soft);border-color:var(--warm)}
  .w-gpio .gp-hint.lv-danger{background:var(--accent-soft);border-color:var(--danger);color:var(--ink)}
  .w-gpio .gp-hint.lv-info{}

  /* run row */
  .w-gpio .gp-runrow{display:flex;gap:.5rem;align-items:center;margin-bottom:.7rem}
  .w-gpio .gp-run{appearance:none;font:inherit;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:.45rem;padding:.55rem 1rem;border-radius:var(--radius-sm);border:1px solid var(--line);background:var(--surface2);color:var(--ink-soft);transition:all .15s}
  .w-gpio .gp-run .gp-run-ic{font-size:.8em}
  .w-gpio .gp-run.ready{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);box-shadow:var(--shadow-lift)}
  .w-gpio .gp-run.ready:hover{transform:translateY(-1px)}
  .w-gpio .gp-run:disabled{cursor:not-allowed;opacity:.65}
  .w-gpio .gp-run:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .w-gpio .gp-reset{appearance:none;font:inherit;cursor:pointer;padding:.55rem .8rem;border-radius:var(--radius-sm);border:1px solid var(--line);background:transparent;color:var(--ink-soft)}
  .w-gpio .gp-reset:hover{color:var(--ink);border-color:var(--ink-soft)}
  .w-gpio .gp-reset:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

  /* code block */
  .w-gpio .gp-code{font-family:var(--font-mono);font-size:.82rem;line-height:1.55;background:var(--code-bg);color:var(--code-ink);border:1px solid var(--code-line);border-radius:var(--radius-sm);padding:.8rem .9rem;overflow-x:auto;margin:0 0 .7rem;white-space:pre}
  .w-gpio .gp-code .k{color:#c792ea}
  .w-gpio .gp-code .t{color:#82aaff}
  .w-gpio .gp-code .m{color:#7fdbca}
  .w-gpio .gp-code .n{color:#f78c6c}
  .w-gpio .gp-code .run-mark{color:var(--led);font-weight:700;animation:gp-pulse 1s ease-in-out infinite}
  @keyframes gp-pulse{50%{opacity:.4}}
  @media (prefers-reduced-motion:reduce){.w-gpio .gp-code .run-mark{animation:none}}

  /* result */
  .w-gpio .gp-result{font-size:.88rem;color:var(--ink);display:none}
  .w-gpio .gp-result.show{display:flex;gap:.5rem;align-items:flex-start;padding:.7rem .85rem;border-radius:var(--radius-sm);background:var(--success-soft);border:1px solid var(--success)}
  .w-gpio .gp-result svg{flex:0 0 auto;color:var(--success);margin-top:1px}
  .w-gpio .gp-result code{font-family:var(--font-mono);font-size:.82em;background:rgba(0,0,0,.08);padding:.05em .35em;border-radius:4px}

  /* 3.3V safety guard */
  .w-gpio .gp-guard{margin-top:.8rem;border:1.5px solid var(--danger);border-radius:var(--radius-sm);background:var(--accent-soft);padding:.85rem .95rem;animation:gp-shake .4s ease}
  .w-gpio .gp-guard[hidden]{display:none}
  @keyframes gp-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-3px)}40%,80%{transform:translateX(3px)}}
  @media (prefers-reduced-motion:reduce){.w-gpio .gp-guard{animation:none}}
  .w-gpio .gp-guard-head{display:flex;align-items:center;gap:.45rem;font-weight:800;color:var(--danger);font-size:.92rem;margin-bottom:.5rem;letter-spacing:.02em}
  .w-gpio .gp-guard-head svg{color:var(--danger)}
  .w-gpio .gp-guard-quote{margin:0 0 .55rem;padding:.55rem .75rem;border-left:3px solid var(--danger);background:var(--surface);border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-size:.85rem;line-height:1.55;color:var(--ink)}
  .w-gpio .gp-guard-foot{font-size:.8rem;color:var(--ink-soft)}

  /* button demo */
  .w-gpio .gp-btn-stage{background:var(--surface2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:.5rem;margin-bottom:.9rem}
  .w-gpio .gp-btn-controls{display:flex;justify-content:center;margin-bottom:.8rem}
  .w-gpio .gp-bigbtn{position:relative;appearance:none;font:inherit;font-weight:700;cursor:pointer;width:130px;height:130px;border-radius:50%;border:none;background:radial-gradient(circle at 50% 38%,var(--surface),var(--surface2));box-shadow:0 8px 0 var(--line),var(--shadow-lift);color:var(--ink);transition:transform .06s,box-shadow .06s;touch-action:none;user-select:none}
  .w-gpio .gp-bigbtn-cap{position:absolute;inset:14px;border-radius:50%;background:linear-gradient(160deg,var(--accent),var(--accent2));opacity:.92}
  .w-gpio .gp-bigbtn-txt{position:relative;color:var(--accent-ink);font-size:.92rem;text-shadow:0 1px 2px rgba(0,0,0,.3)}
  .w-gpio .gp-bigbtn:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
  .w-gpio .gp-bigbtn.down{transform:translateY(8px);box-shadow:0 0 0 var(--line),inset 0 3px 8px rgba(0,0,0,.3)}
  .w-gpio .gp-btn-state{font-size:.85rem;text-align:center;margin-bottom:.9rem;min-height:1.4rem}
  .w-gpio .gp-btn-state code,.w-gpio .gp-btn-state .lv-ok,.w-gpio .gp-btn-state .lv-info{display:inline-flex;align-items:center;gap:.3rem}
  .w-gpio .gp-btn-state code{font-family:var(--font-mono);font-size:.82em;background:var(--surface2);padding:.05em .35em;border-radius:4px}
  .w-gpio .gp-btn-state .lv-ok{color:var(--success);font-weight:600}
  .w-gpio .gp-btn-state .lv-info{color:var(--ink-soft)}

  /* shared tooltip */
  .w-gpio{position:relative}
  .w-gpio .gp-tip{position:absolute;z-index:40;transform:translate(-50%,-100%);pointer-events:none;background:var(--code-bg);color:var(--code-ink);border:1px solid var(--code-line);border-radius:8px;padding:.45rem .6rem;font-size:.76rem;line-height:1.4;max-width:230px;box-shadow:var(--shadow-lift);opacity:0;transition:opacity .12s;white-space:normal}
  .w-gpio .gp-tip.on{opacity:1}
  .w-gpio .gp-tip-sw{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:.35rem;vertical-align:middle}
  .w-gpio .gp-tip strong{color:#fff}
  .w-gpio .gp-tip-bcm{font-family:var(--font-mono);font-size:.7rem;color:#82aaff;background:rgba(130,170,255,.14);padding:0 .3em;border-radius:3px}
  .w-gpio .gp-tip-role{color:#c7cbd6;margin-top:.2rem}
  .w-gpio .gp-tip-star{color:var(--warm);margin-top:.2rem;font-weight:600}
  `;
  document.head.append(s);
}
