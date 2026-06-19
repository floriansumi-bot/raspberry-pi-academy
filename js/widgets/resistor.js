/* widgets/resistor.js — LED Resistor / Ohm's Law Calculator */
import { el } from '../ui.js';

/* ── E12 standard resistor series ── */
const E12 = [
  10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82,
  100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820,
  1000, 1200, 1500, 1800, 2200, 2700, 3300, 3900, 4700, 5600, 6800, 8200,
  10000
];

function nearestE12Above(r) {
  for (const v of E12) if (v >= r) return v;
  return E12[E12.length - 1];
}

/* ── Resistor colour bands ── */
const BAND_COLOURS = {
  0: '#000000', 1: '#8B4513', 2: '#CC0000', 3: '#FF8C00',
  4: '#FFD700', 5: '#228B22', 6: '#0000CD', 7: '#8A2BE2',
  8: '#808080', 9: '#FFFFFF'
};
const BAND_NAMES = ['Black','Brown','Red','Orange','Yellow','Green','Blue','Violet','Grey','White'];
const MULTIPLIERS = { 1:0, 10:1, 100:2, 1000:3, 10000:4 };

function resistorBands(ohms) {
  // Find the best 3-digit representation
  let multiplier = 1;
  let val = ohms;
  while (val >= 100 && multiplier <= 10000) { val /= 10; multiplier *= 10; }
  while (val < 10 && multiplier >= 10) { val *= 10; multiplier /= 10; }
  val = Math.round(val);
  const d1 = Math.floor(val / 10);
  const d2 = val % 10;
  const mult = multiplier;
  return { d1, d2, mult };
}

function bandsSVG(ohms) {
  const { d1, d2, mult } = resistorBands(ohms);
  const multBand = MULTIPLIERS[mult] ?? 0;
  const c1 = BAND_COLOURS[d1];
  const c2 = BAND_COLOURS[d2];
  const c3 = BAND_COLOURS[multBand];
  const c4 = '#C0C0C0'; // silver = ±10% tolerance

  return `<svg viewBox="0 0 180 54" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Resistor colour bands: ${BAND_NAMES[d1]}, ${BAND_NAMES[d2]}, ${BAND_NAMES[multBand]}, Silver">
    <!-- leads -->
    <line x1="0" y1="27" x2="30" y2="27" stroke="#aaa" stroke-width="2"/>
    <line x1="150" y1="27" x2="180" y2="27" stroke="#aaa" stroke-width="2"/>
    <!-- body -->
    <rect x="30" y="10" width="120" height="34" rx="17" fill="#d4c5a0" stroke="#b8a880" stroke-width="1"/>
    <!-- band 1 -->
    <rect x="50" y="10" width="14" height="34" rx="2" fill="${c1}" opacity="0.93"/>
    <!-- band 2 -->
    <rect x="72" y="10" width="14" height="34" rx="2" fill="${c2}" opacity="0.93"/>
    <!-- band 3 (multiplier) -->
    <rect x="94" y="10" width="14" height="34" rx="2" fill="${c3}" opacity="0.93"/>
    <!-- band 4 (tolerance) — slightly separated -->
    <rect x="118" y="10" width="14" height="34" rx="2" fill="${c4}" opacity="0.93"/>
  </svg>`;
}

/* ── LED colour presets ── */
const LED_PRESETS = [
  { label: 'Red',        vf: 1.8 },
  { label: 'Yellow',     vf: 2.1 },
  { label: 'Green',      vf: 2.2 },
  { label: 'Blue/White', vf: 3.0 },
];

/* ── Format resistance ── */
function fmtR(ohms) {
  if (ohms >= 1000) return (ohms / 1000).toFixed(ohms % 1000 === 0 ? 0 : 1) + ' kΩ';
  return ohms + ' Ω';
}

/* ── Mount ── */
export function mount(container, ctx = {}) {
  if (!document.getElementById('w-resistor-css')) {
    const s = document.createElement('style');
    s.id = 'w-resistor-css';
    s.textContent = `
.w-resistor {
  font-family: var(--font-body, Inter, sans-serif);
}
.w-resistor .rc-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.4rem 1.5rem 1.5rem;
  max-width: 540px;
}
.w-resistor .rc-title {
  font-family: var(--font-display, serif);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 .15rem;
  display: flex;
  align-items: center;
  gap: .5rem;
}
.w-resistor .rc-led-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--led, #22c55e);
  display: inline-block;
  box-shadow: 0 0 6px var(--led, #22c55e);
  flex-shrink: 0;
}
.w-resistor .rc-subtitle {
  font-size: .8rem;
  color: var(--ink-soft);
  margin: 0 0 1.1rem;
}
.w-resistor .rc-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .7rem 1rem;
  margin-bottom: .7rem;
}
.w-resistor .rc-field {
  display: flex;
  flex-direction: column;
  gap: .25rem;
}
.w-resistor .rc-field label {
  font-size: .75rem;
  font-weight: 600;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: .04em;
}
.w-resistor .rc-field input[type=number],
.w-resistor .rc-field select {
  background: var(--surface2, var(--surface));
  border: 1px solid var(--line);
  border-radius: var(--radius-sm, 8px);
  color: var(--ink);
  font-family: var(--font-body, sans-serif);
  font-size: .92rem;
  padding: .38rem .6rem;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  transition: border-color .15s;
}
.w-resistor .rc-field input[type=number]:focus,
.w-resistor .rc-field select:focus {
  border-color: var(--accent2, teal);
}
.w-resistor .rc-slider-row {
  margin-bottom: .9rem;
  display: flex;
  flex-direction: column;
  gap: .25rem;
}
.w-resistor .rc-slider-row label {
  font-size: .75rem;
  font-weight: 600;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: .04em;
  display: flex;
  justify-content: space-between;
}
.w-resistor .rc-slider-row label span {
  font-size: .85rem;
  color: var(--ink);
  font-weight: 700;
}
.w-resistor input[type=range] {
  width: 100%;
  accent-color: var(--accent2, teal);
}
.w-resistor .rc-divider {
  border: none;
  border-top: 1px solid var(--line);
  margin: 1rem 0;
}
.w-resistor .rc-formula {
  background: var(--code-bg, #111);
  color: var(--code-ink, #eee);
  border-radius: var(--radius-sm, 8px);
  padding: .55rem .85rem;
  font-family: var(--font-mono, monospace);
  font-size: .82rem;
  margin-bottom: .85rem;
  line-height: 1.6;
}
.w-resistor .rc-results {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .6rem;
  margin-bottom: .85rem;
}
.w-resistor .rc-result-box {
  background: var(--surface2, var(--surface));
  border: 1px solid var(--line);
  border-radius: var(--radius-sm, 8px);
  padding: .6rem .8rem;
}
.w-resistor .rc-result-box .rc-result-label {
  font-size: .7rem;
  color: var(--ink-soft);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  margin-bottom: .18rem;
}
.w-resistor .rc-result-box .rc-result-value {
  font-family: var(--font-mono, monospace);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent2, teal);
}
.w-resistor .rc-result-box .rc-result-sub {
  font-size: .72rem;
  color: var(--ink-soft);
  margin-top: .12rem;
}
.w-resistor .rc-recommend {
  background: var(--success-soft, #dcfce7);
  border: 1px solid var(--success, #22c55e);
  border-radius: var(--radius-sm, 8px);
  padding: .65rem .85rem;
  margin-bottom: .85rem;
  display: flex;
  align-items: flex-start;
  gap: .55rem;
}
.w-resistor .rc-recommend-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: .05rem;
}
.w-resistor .rc-recommend-text {
  font-size: .84rem;
  color: var(--ink);
  line-height: 1.5;
}
.w-resistor .rc-recommend-text strong {
  color: var(--success, #22c55e);
}
.w-resistor .rc-warn {
  background: var(--warm-soft, #fef9c3);
  border: 1px solid var(--warm, #f59e0b);
  border-radius: var(--radius-sm, 8px);
  padding: .65rem .85rem;
  margin-bottom: .85rem;
  font-size: .84rem;
  color: var(--ink);
  line-height: 1.5;
}
.w-resistor .rc-bands-section {
  display: flex;
  flex-direction: column;
  gap: .4rem;
}
.w-resistor .rc-bands-title {
  font-size: .75rem;
  font-weight: 600;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: .04em;
}
.w-resistor .rc-bands-svg {
  width: 100%;
  max-width: 280px;
}
.w-resistor .rc-bands-legend {
  display: flex;
  gap: .9rem;
  flex-wrap: wrap;
  font-size: .72rem;
  color: var(--ink-soft);
}
.w-resistor .rc-bands-legend span {
  display: flex;
  align-items: center;
  gap: .3rem;
}
.w-resistor .rc-bands-legend .swatch {
  width: 10px; height: 10px;
  border-radius: 2px;
  border: 1px solid rgba(0,0,0,.15);
  flex-shrink: 0;
}
@media (max-width: 420px) {
  .w-resistor .rc-row { grid-template-columns: 1fr; }
  .w-resistor .rc-results { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .w-resistor * { transition: none !important; }
}
    `;
    document.head.append(s);
  }

  container.classList.add('w-resistor');

  // ── State ──
  let vsupply = 3.3;
  let vf = 2.0;
  let iMa = 10;

  // ── Build DOM ──
  const card = el('div', { class: 'rc-card' });

  const title = el('div', { class: 'rc-title' });
  title.append(
    el('span', { class: 'rc-led-dot', 'aria-hidden': 'true' }),
    document.createTextNode('LED Resistor & Ohm\'s Law')
  );

  const subtitle = el('p', { class: 'rc-subtitle', text: 'Series resistor calculator for GPIO-driven LEDs' });

  // Inputs row
  const row = el('div', { class: 'rc-row' });

  // Supply voltage
  const vsField = el('div', { class: 'rc-field' });
  const vsLabel = el('label', { text: 'Supply voltage (V)' });
  vsLabel.setAttribute('for', 'rc-vsupply');
  const vsInput = el('input', {
    type: 'number', id: 'rc-vsupply',
    min: '1.8', max: '12', step: '0.1', value: '3.3',
    'aria-label': 'Supply voltage in volts'
  });
  vsField.append(vsLabel, vsInput);

  // LED colour / Vf
  const vfField = el('div', { class: 'rc-field' });
  const vfLabel = el('label', { text: 'LED colour / Vf' });
  vfLabel.setAttribute('for', 'rc-ledcolour');
  const vfSelect = el('select', { id: 'rc-ledcolour', 'aria-label': 'LED colour preset' });
  LED_PRESETS.forEach((p, i) => {
    const opt = el('option', { value: i, text: `${p.label} — ${p.vf} V` });
    if (i === 0) opt.selected = true;
    vfSelect.append(opt);
  });
  const vfManualLabel = el('label', { text: 'Override Vf (V)', style: { marginTop: '.4rem' } });
  vfManualLabel.setAttribute('for', 'rc-vf');
  const vfInput = el('input', {
    type: 'number', id: 'rc-vf',
    min: '1.0', max: '4.5', step: '0.05', value: '2.0',
    'aria-label': 'LED forward voltage in volts'
  });
  vfField.append(vfLabel, vfSelect, vfManualLabel, vfInput);

  row.append(vsField, vfField);

  // Current slider
  const sliderRow = el('div', { class: 'rc-slider-row' });
  const sliderLabel = el('label');
  sliderLabel.setAttribute('for', 'rc-current');
  const sliderLabelText = document.createTextNode('LED current — ');
  const sliderValSpan = el('span', { text: '10 mA' });
  sliderLabel.append(sliderLabelText, sliderValSpan);
  const slider = el('input', {
    type: 'range', id: 'rc-current',
    min: '1', max: '20', step: '1', value: '10',
    'aria-label': 'Desired LED current in milliamps'
  });
  sliderRow.append(sliderLabel, slider);

  const hr = el('hr', { class: 'rc-divider' });

  // Formula display
  const formulaBox = el('div', { class: 'rc-formula' });

  // Results
  const resultsGrid = el('div', { class: 'rc-results' });
  const calcBox = el('div', { class: 'rc-result-box' });
  const calcLabel = el('div', { class: 'rc-result-label', text: 'Calculated R' });
  const calcValue = el('div', { class: 'rc-result-value' });
  const calcSub = el('div', { class: 'rc-result-sub' });
  calcBox.append(calcLabel, calcValue, calcSub);

  const stdBox = el('div', { class: 'rc-result-box' });
  const stdLabel = el('div', { class: 'rc-result-label', text: 'Nearest E12 (≥ R)' });
  const stdValue = el('div', { class: 'rc-result-value' });
  const stdSub = el('div', { class: 'rc-result-sub' });
  stdBox.append(stdLabel, stdValue, stdSub);

  resultsGrid.append(calcBox, stdBox);

  // Warning / recommend area
  const msgArea = el('div');

  // Colour bands
  const bandsSection = el('div', { class: 'rc-bands-section' });
  const bandsTitle = el('div', { class: 'rc-bands-title', text: 'Colour code (4-band)' });
  const bandsSvgWrap = el('div', { class: 'rc-bands-svg' });
  const bandsLegend = el('div', { class: 'rc-bands-legend' });
  bandsSection.append(bandsTitle, bandsSvgWrap, bandsLegend);

  card.append(
    title, subtitle,
    row, sliderRow, hr,
    formulaBox, resultsGrid,
    msgArea, bandsSection
  );
  container.append(card);

  // ── Compute & render ──
  function render() {
    const vDrop = vsupply - vf;
    const iA = iMa / 1000;

    sliderValSpan.textContent = iMa + ' mA';

    // Under-voltage guard
    if (vf >= vsupply) {
      formulaBox.innerHTML = `R = (V<sub>supply</sub> − V<sub>f</sub>) / I = (<b>${vsupply.toFixed(2)}</b> − <b>${vf.toFixed(2)}</b>) / ${iMa} mA`;
      calcValue.textContent = '—';
      calcSub.textContent = 'No drop across resistor';
      stdValue.textContent = '—';
      stdSub.textContent = '';

      msgArea.innerHTML = '';
      const warn = el('div', { class: 'rc-warn' });
      warn.innerHTML = `&#9888;&#xFE0F; <strong>LED won't light.</strong> The forward voltage V<sub>f</sub> = <b>${vf.toFixed(2)} V</b> is greater than or equal to the supply voltage <b>${vsupply.toFixed(2)} V</b>. Lower V<sub>f</sub> or raise the supply.`;
      msgArea.append(warn);

      bandsSvgWrap.innerHTML = '';
      bandsLegend.innerHTML = '';
      return;
    }

    // R = (Vsupply − Vf) / I
    const rExact = vDrop / iA;
    const rStd = nearestE12Above(Math.ceil(rExact));
    const iActual = (vDrop / rStd) * 1000; // mA

    // Formula
    formulaBox.innerHTML =
      `R = (V<sub>supply</sub> − V<sub>f</sub>) / I<br>` +
      `R = (${vsupply.toFixed(2)} V − ${vf.toFixed(2)} V) / ${iMa} mA<br>` +
      `R = ${vDrop.toFixed(2)} V / ${(iMa/1000).toFixed(4)} A = <b>${rExact.toFixed(1)} Ω</b>`;

    // Results
    calcValue.textContent = rExact.toFixed(1) + ' Ω';
    calcSub.textContent = 'Minimum safe value';

    stdValue.textContent = fmtR(rStd);
    stdSub.textContent = `Actual I = ${iActual.toFixed(1)} mA`;

    // Recommendation / safety note
    msgArea.innerHTML = '';
    const recommend = el('div', { class: 'rc-recommend' });
    const isHandbook = (rStd === 330 && vsupply >= 3.2 && vsupply <= 3.4);
    recommend.innerHTML =
      `<span class="rc-recommend-icon" aria-hidden="true">&#x2714;&#xFE0F;</span>` +
      `<span class="rc-recommend-text">` +
      `Use a <strong>${fmtR(rStd)}</strong> resistor (nearest E12 at or above the calculated value).` +
      (isHandbook
        ? ` This is the <strong>330 Ω</strong> the handbook recommends for 3.3 V GPIO — a safe, common choice.`
        : ` For a 3.3 V GPIO pin the handbook's safe default is <strong>330 Ω</strong>, which limits current to ~10 mA.`) +
      `<br><em style="font-size:.8em;color:var(--ink-soft)">Why a series resistor? Without it the LED draws unlimited current from the GPIO pin, burning out the LED and potentially the Pi's GPIO chip. The resistor limits current to a safe level.</em>` +
      `</span>`;
    msgArea.append(recommend);

    // Colour bands
    const { d1, d2, mult } = resistorBands(rStd);
    const multIdx = MULTIPLIERS[mult] ?? 0;
    bandsSvgWrap.innerHTML = bandsSVG(rStd);

    bandsLegend.innerHTML = '';
    const bandDefs = [
      { idx: d1,      role: 'Band 1 (1st digit)' },
      { idx: d2,      role: 'Band 2 (2nd digit)' },
      { idx: multIdx, role: 'Band 3 (multiplier)' },
      { idx: 8,       role: 'Band 4 (tolerance ±10%)' }, // 8 = grey but we're using silver
    ];
    // Special: band 4 is silver
    const c4 = '#C0C0C0';
    const band4Name = 'Silver (±10%)';
    bandDefs.forEach((b, i) => {
      const colour = i === 3 ? c4 : BAND_COLOURS[b.idx];
      const name   = i === 3 ? band4Name : BAND_NAMES[b.idx];
      const swatch = el('span', { class: 'swatch', style: { background: colour } });
      const sp = el('span');
      sp.append(swatch, document.createTextNode(name));
      sp.title = b.role;
      bandsLegend.append(sp);
    });
  }

  // ── Event listeners ──
  vsInput.addEventListener('input', () => {
    const v = parseFloat(vsInput.value);
    if (!isNaN(v) && v >= 1.8 && v <= 12) { vsupply = v; render(); }
  });

  vfSelect.addEventListener('change', () => {
    const preset = LED_PRESETS[parseInt(vfSelect.value)];
    if (preset) {
      vf = preset.vf;
      vfInput.value = vf.toFixed(2);
      render();
    }
  });

  vfInput.addEventListener('input', () => {
    const v = parseFloat(vfInput.value);
    if (!isNaN(v) && v >= 0.5 && v <= 5) { vf = v; render(); }
  });

  slider.addEventListener('input', () => {
    iMa = parseInt(slider.value, 10);
    render();
  });

  // Initial render
  render();
}
