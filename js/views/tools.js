/* views/tools.js — standalone hub for the interactive sandboxes */
import { el, icon } from '../ui.js';
import { openTerminalOverlay } from '../overlays.js';

export async function renderTools(params, view) {
  const wrap = el('div', { class: 'wrap', style: { paddingBlock: '2.5rem 5rem' } });
  wrap.append(
    el('span', { class: 'eyebrow', text: 'Sandboxes' }),
    el('h1', { style: { fontSize: 'var(--step-3)', margin: '.3rem 0 .4rem' }, text: 'Tools' }),
    el('p', { class: 'muted', text: 'Play with a real Raspberry Pi terminal and a wireable GPIO board — no hardware required, nothing can break.' })
  );

  const grid = el('div', { style: { display: 'grid', gap: '1.4rem', marginTop: '2rem' } });

  // Terminal launcher card
  const termCard = el('div', { class: 'widget-shell' },
    el('div', { class: 'widget-head' }, el('span', { class: 'wtag', text: 'Sandbox' }), el('h4', { text: 'Pi Terminal' })),
    el('div', { class: 'widget-body' },
      el('p', { class: 'muted', style: { marginBottom: '1rem' }, text: 'A simulated Raspberry Pi OS shell. Try pwd, ls, cd, mkdir — plus man <term> for the glossary and find <word> to search the whole course.' }),
      (() => { const b = el('button', { class: 'btn btn-primary', html: icon('terminal', 16) + ' Open terminal' }); b.addEventListener('click', () => openTerminalOverlay('')); return b; })()
    )
  );
  grid.append(termCard);

  // GPIO inline mount
  const gpioMount = el('div', { class: 'widget-mount' });
  grid.append(gpioMount);
  wrap.append(grid);
  view.append(wrap);

  import('../widgets/gpio.js').then((m) => m.mount(gpioMount, { standalone: true, navigate: (h) => (location.hash = h) }))
    .catch(() => { gpioMount.innerHTML = '<div class="widget-shell"><div class="widget-body muted" style="text-align:center;padding:2rem">The GPIO playground loads here.</div></div>'; });
}
