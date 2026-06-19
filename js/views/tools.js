/* views/tools.js — standalone hub for the interactive sandboxes */
import { el, icon } from '../ui.js';
import { openTerminalOverlay } from '../overlays.js';
import { onCleanup } from '../router.js';

function mountWidget(name, container, ctx) {
  import(`../widgets/${name}.js`)
    .then((m) => { const d = m.mount(container, ctx); if (typeof d === 'function') onCleanup(d); else if (d && d.destroy) onCleanup(() => d.destroy()); })
    .catch(() => { container.innerHTML = `<div class="widget-shell"><div class="widget-body muted" style="text-align:center;padding:2rem">The ${name} sandbox loads here.</div></div>`; });
}

export async function renderTools(params, view) {
  const wrap = el('div', { class: 'wrap', style: { paddingBlock: '2.5rem 5rem' } });
  wrap.append(
    el('span', { class: 'eyebrow', text: 'Sandboxes' }),
    el('h1', { style: { fontSize: 'var(--step-3)', margin: '.3rem 0 .4rem' }, text: 'Tools' }),
    el('p', { class: 'muted', text: 'Play with a real Raspberry Pi terminal, a wireable GPIO board, an LED resistor calculator, and a project finder — no hardware required, nothing can break.' })
  );

  const grid = el('div', { style: { display: 'grid', gap: '1.4rem', marginTop: '2rem' } });

  // Terminal launcher
  const termBtn = el('button', { class: 'btn btn-primary', html: icon('terminal', 16) + ' Open terminal' });
  termBtn.addEventListener('click', () => openTerminalOverlay(''));
  grid.append(el('div', { class: 'widget-shell' },
    el('div', { class: 'widget-head' }, el('span', { class: 'wtag', text: 'Sandbox' }), el('h4', { text: 'Pi Terminal' })),
    el('div', { class: 'widget-body' },
      el('p', { class: 'muted', style: { marginBottom: '1rem' }, text: 'A simulated Raspberry Pi OS shell. Try pwd, ls, cd, mkdir — plus man <term> for the glossary and find <word> to search the whole course.' }),
      termBtn
    )
  ));

  // GPIO + resistor + picker mounts
  const gpioMount = el('div', { class: 'widget-mount' });
  const resistorMount = el('div', { class: 'widget-mount' });
  const pickerMount = el('div', { class: 'widget-mount' });
  grid.append(gpioMount, resistorMount, pickerMount);
  wrap.append(grid);
  view.append(wrap);

  const ctx = { standalone: true, navigate: (h) => (location.hash = h) };
  mountWidget('gpio', gpioMount, ctx);
  mountWidget('resistor', resistorMount, ctx);
  mountWidget('picker', pickerMount, ctx);
}
