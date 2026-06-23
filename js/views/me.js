/* views/me.js — "My Pi" dashboard: progress, badges, export/import, certificate */
import { el, ring, icon, toast } from '../ui.js';
import { store } from '../store.js';
import { parts, getChapter, order, stats, routeFor } from '../content.js';
import { BADGES } from '../badges.js';

export async function renderMe(params, view) {
  const s = stats(store.get());
  const st = store.get();
  const dash = el('div', { class: 'dash' });

  const bigRing = ring(120, 10, true); bigRing.set(s.pct);
  const cont = order().find((id) => !store.isComplete(id));
  dash.append(el('div', { class: 'dash-hero' },
    el('div', { class: 'big-ring' }, bigRing.node),
    el('div', {},
      el('span', { class: 'eyebrow', text: 'My Pi' }),
      el('h1', { text: s.done === s.total ? 'Course complete — congratulations!' : `You're ${Math.round(s.pct * 100)}% of the way there` }),
      el('p', { class: 'muted', text: `${s.done} of ${s.total} lessons done · ${Object.values(st.badges).filter(Boolean).length}/${BADGES.length} badges earned` }),
      store.streak() > 1 ? el('div', { style: { marginTop: '.5rem' } }, el('span', { class: 'tag streak-chip', text: `🔥 ${store.streak()}-day streak` })) : '',
      el('div', { class: 'dash-actions' },
        cont ? el('a', { class: 'btn btn-primary', href: routeFor(cont) }, 'Continue', el('span', { html: icon('arrow', 16) })) : el('a', { class: 'btn btn-primary', href: '#/' }, 'Review the path'),
        el('a', { class: 'btn btn-ghost', href: './assets/Raspberry-Pi-5-Handbook.pdf', target: '_blank' }, icon('download', 16), 'Get the PDF')
      )
    )
  ));

  // badges tray
  const tray = el('div', { class: 'parts-tray' });
  BADGES.forEach((b) => {
    const earned = store.hasBadge(b.id);
    tray.append(el('div', { class: 'badge' + (earned ? ' earned' : ''), title: earned ? 'Earned' : 'Complete ' + (getChapter(b.ch)?.title || '') },
      el('div', { class: 'badge-ic', html: `<svg viewBox="0 0 48 48" style="color:${earned ? 'var(--accent)' : 'var(--ink-soft)'}">${b.svg}</svg>` }),
      el('div', { class: 'badge-name', text: b.name })
    ));
  });

  // per-part progress
  const partList = el('div');
  parts().forEach((p) => {
    const done = p.chapters.filter((c) => store.isComplete(c)).length;
    const r = ring(28, 4); r.set(p.chapters.length ? done / p.chapters.length : 0);
    partList.append(el('div', { class: 'part-row' },
      r.node,
      el('div', { style: { flex: '1' } }, el('div', { class: 'pr-name', text: p.label }), el('div', { class: 'muted pr-sub', text: `${done}/${p.chapters.length} lessons` }))
    ));
  });

  const earnedCount = BADGES.filter((b) => store.hasBadge(b.id)).length;
  const grid = el('div', { class: 'dash-grid' });
  grid.append(
    el('div', { class: 'dash-card', style: { gridColumn: '1/-1' } }, el('h3', { text: `🏅 Parts tray — ${earnedCount}/${BADGES.length} collected` }), tray),
    el('div', { class: 'dash-card' }, el('h3', { text: 'Progress by part' }), partList),
    el('div', { class: 'dash-card' }, el('h3', { text: 'Your data' }), dataCard())
  );
  dash.append(grid);

  if (s.done === s.total && s.total > 0) dash.append(certificate());
  view.append(dash);
}

function dataCard() {
  const box = el('div');
  box.append(el('p', { class: 'muted dash-note', text: 'Progress is saved on this device. Export it to keep a backup or move to another browser.' }));
  const exportBtn = el('button', { class: 'btn btn-ghost btn-sm', html: icon('download', 14) + ' Export' });
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: 'pilot-progress.json' }); a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Progress exported');
  });
  const importInput = el('input', { type: 'file', accept: 'application/json', class: 'hidden' });
  importInput.addEventListener('change', () => {
    const f = importInput.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { store.importJSON(rd.result) ? (toast('Progress restored'), location.hash = '#/me', location.reload()) : toast('Could not read that file'); };
    rd.readAsText(f);
  });
  const importBtn = el('button', { class: 'btn btn-ghost btn-sm', html: '⤒ Import' });
  importBtn.addEventListener('click', () => importInput.click());
  const resetBtn = el('button', { class: 'btn btn-sm btn-danger', text: 'Reset' });
  resetBtn.addEventListener('click', () => { if (confirm('Reset all progress on this device?')) { store.reset(); location.reload(); } });
  box.append(el('div', { class: 'btn-row' }, exportBtn, importBtn, importInput, resetBtn));
  return box;
}

function certificate() {
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const c = el('div', { class: 'dash-card cert', style: { marginTop: '1rem' } });
  const sheet = el('div', { class: 'cert-sheet' },
    el('div', { class: 'cert-seal', text: '🍓' }),
    el('div', { class: 'cert-eyebrow', text: 'Pilot · The Raspberry Pi 5 Course' }),
    el('h2', { text: 'Certificate of Completion' }),
    el('p', { class: 'cert-awarded', text: 'awarded to' }),
    el('div', { class: 'cert-name', text: store.name || 'A curious learner' }),
    el('p', { class: 'cert-body', text: 'for finishing all 25 lessons — from first boot to building real things on a Raspberry Pi 5.' }),
    el('div', { class: 'cert-date', text: date })
  );
  const nameInput = el('input', { class: 'field', type: 'text', placeholder: 'Your name (for the certificate)', value: store.name || '', 'aria-label': 'Your name', style: { width: 'min(320px, 100%)' } });
  nameInput.addEventListener('input', () => { store.name = nameInput.value; sheet.querySelector('.cert-name').textContent = nameInput.value || 'A curious learner'; });
  const print = el('button', { class: 'btn btn-primary', text: 'Print / save as PDF' });
  print.addEventListener('click', () => {
    document.body.classList.add('printing-cert');
    const after = () => { document.body.classList.remove('printing-cert'); removeEventListener('afterprint', after); };
    addEventListener('afterprint', after);
    window.print();
    setTimeout(after, 1500);
  });
  c.append(sheet, el('div', { class: 'cert-actions' }, nameInput, print));
  return c;
}
