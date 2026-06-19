/* views/me.js — "My Pi" dashboard: progress, badges, export/import, certificate */
import { el, ring, icon, toast } from '../ui.js';
import { store } from '../store.js';
import { parts, getChapter, order, stats } from '../content.js';

const BADGES = [
  { id: 'first-boot', name: 'First Boot', ch: 'ch04', svg: '<rect x="14" y="8" width="20" height="32" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="32" r="3" fill="currentColor"/><path d="M24 14v10" stroke="currentColor" stroke-width="3"/>' },
  { id: 'terminal-tamer', name: 'Terminal Tamer', ch: 'ch06', svg: '<rect x="6" y="10" width="36" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><path d="M14 20l5 4-5 4M26 28h8" stroke="currentColor" stroke-width="3" fill="none"/>' },
  { id: 'it-blinks', name: 'It Blinks!', ch: 'ch12', svg: '<circle cx="24" cy="20" r="9" fill="none" stroke="currentColor" stroke-width="3"/><path d="M20 29h8l-1 8h-6z" fill="currentColor"/><path d="M24 4v4M11 9l3 3M37 9l-3 3" stroke="currentColor" stroke-width="3"/>' },
  { id: 'adblock-up', name: 'Ad-Blocker Up', ch: 'ch15', svg: '<path d="M24 6l14 5v9c0 9-6 15-14 18-8-3-14-9-14-18v-9z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M16 24l5 5 11-11" stroke="currentColor" stroke-width="3" fill="none"/>' },
  { id: 'server-online', name: 'Home Server', ch: 'ch16', svg: '<rect x="8" y="10" width="32" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><rect x="8" y="26" width="32" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="14" cy="16" r="2" fill="currentColor"/><circle cx="14" cy="32" r="2" fill="currentColor"/>' },
  { id: 'ai-on-pi', name: 'AI on the Pi', ch: 'ch19', svg: '<rect x="12" y="12" width="24" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="20" cy="22" r="2.5" fill="currentColor"/><circle cx="28" cy="22" r="2.5" fill="currentColor"/><path d="M19 30h10M24 4v8M24 36v8M4 24h8M36 24h8" stroke="currentColor" stroke-width="3"/>' },
];

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
      el('div', { style: { marginTop: '1rem', display: 'flex', gap: '.6rem', flexWrap: 'wrap' } },
        cont ? el('a', { class: 'btn btn-primary', href: '#/chapter/' + cont }, 'Continue', el('span', { html: icon('arrow', 16) })) : el('a', { class: 'btn btn-primary', href: '#/' }, 'Review the path'),
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
    partList.append(el('div', { style: { display: 'flex', alignItems: 'center', gap: '.8rem', padding: '.6rem 0', borderBottom: '1px solid var(--line)' } },
      r.node,
      el('div', { style: { flex: '1' } }, el('div', { style: { fontWeight: '600' }, text: p.label }), el('div', { class: 'muted', style: { fontSize: '.8rem' }, text: `${done}/${p.chapters.length} lessons` }))
    ));
  });

  const grid = el('div', { class: 'dash-grid' });
  grid.append(
    el('div', { class: 'dash-card', style: { gridColumn: '1/-1' } }, el('h3', { text: '🏅 Badge tray' }), tray),
    el('div', { class: 'dash-card' }, el('h3', { text: 'Progress by part' }), partList),
    el('div', { class: 'dash-card' }, el('h3', { text: 'Your data' }), dataCard())
  );
  dash.append(grid);

  if (s.done === s.total && s.total > 0) dash.append(certificate());
  view.append(dash);
}

function dataCard() {
  const box = el('div');
  box.append(el('p', { class: 'muted', style: { fontSize: '.85rem', marginBottom: '.8rem' }, text: 'Progress is saved on this device. Export it to keep a backup or move to another browser.' }));
  const exportBtn = el('button', { class: 'btn btn-ghost btn-sm', html: icon('download', 14) + ' Export' });
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'pilot-progress.json' }); a.click();
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
  const resetBtn = el('button', { class: 'btn btn-sm', style: { color: 'var(--danger)' }, text: 'Reset' });
  resetBtn.addEventListener('click', () => { if (confirm('Reset all progress on this device?')) { store.reset(); location.reload(); } });
  box.append(el('div', { style: { display: 'flex', gap: '.5rem', flexWrap: 'wrap' } }, exportBtn, importBtn, importInput, resetBtn));
  return box;
}

function certificate() {
  const c = el('div', { class: 'dash-card cert', style: { marginTop: '1rem', border: '2px solid var(--accent)' } });
  c.innerHTML = `<div style="font-size:3rem">🎓</div><h2 style="font-family:var(--font-display);margin:.4rem 0">Certificate of Completion</h2>
    <p class="muted">You finished all 24 lessons of the Raspberry Pi 5 course.</p>`;
  const print = el('button', { class: 'btn btn-primary', style: { marginTop: '1rem' }, text: 'Print certificate' });
  print.addEventListener('click', () => window.print());
  c.append(print);
  return c;
}
