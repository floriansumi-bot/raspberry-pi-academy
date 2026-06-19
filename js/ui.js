/* ui.js — tiny DOM helpers, toasts, progress rings, icons (no deps) */

export function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return n;
}

/* standard tool/page header: eyebrow + title + subtitle (spread into a container) */
export function toolHeader(eyebrow, title, sub) {
  return [
    el('span', { class: 'eyebrow', text: eyebrow }),
    el('h1', { class: 'tool-h1', text: title }),
    sub ? el('p', { class: 'muted', text: sub }) : null,
  ].filter(Boolean);
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastT;
export function toast(msg, ms = 2200) {
  const host = $('#toast-host'); if (!host) return;
  const t = el('div', { class: 'toast', html: msg });
  host.append(t);
  clearTimeout(toastT);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 300); }, ms);
}

/* circular progress ring. returns {node, set(p)} where p in 0..1 */
export function ring(size = 34, stroke = 4, label = false) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, cx = size / 2;
  const wrap = el('span', { class: 'ring', style: { width: size + 'px', height: size + 'px' } });
  wrap.innerHTML = `<svg viewBox="0 0 ${size} ${size}"><circle class="ring-track" cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke-width="${stroke}"/><circle class="ring-fill" cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke-width="${stroke}" stroke-dasharray="${c}" stroke-dashoffset="${c}"/></svg>`;
  const lab = label ? el('span', { class: 'ring-label' }) : null;
  if (lab) wrap.append(lab);
  const fill = wrap.querySelector('.ring-fill');
  return {
    node: wrap,
    set(p) {
      p = Math.max(0, Math.min(1, p));
      fill.style.strokeDashoffset = String(c * (1 - p));
      if (lab) lab.textContent = Math.round(p * 100) + '%';
    }
  };
}

/* focus trap for modal dialogs. Returns release() that detaches + restores focus. */
export function trapFocus(container, onEscape) {
  const prev = document.activeElement;
  const sel = 'a[href],button:not([disabled]),input:not([disabled]),textarea,select,[tabindex]:not([tabindex="-1"])';
  function focusable() { return [...container.querySelectorAll(sel)].filter((el) => el.offsetParent !== null || el === document.activeElement); }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); onEscape && onEscape(); return; }
    if (e.key !== 'Tab') return;
    const f = focusable(); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  container.addEventListener('keydown', onKey);
  return function release() { container.removeEventListener('keydown', onKey); try { prev && prev.focus && prev.focus(); } catch {} };
}

const ICONS = {
  check: '<path d="M20 6L9 17l-5-5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 3v18"/>',
  terminal: '<path d="M4 5h16v14H4z"/><path d="M8 9l3 3-3 3M13 15h4"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>',
  spark: '<path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>',
};
export function icon(name, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

/* small confetti burst (canvas, GC'd). Respects reduced motion. */
export function bloom(x, y, color = '#C7152A') {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = el('canvas', { style: { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '950' } });
  cv.width = innerWidth; cv.height = innerHeight; document.body.append(cv);
  const ctx = cv.getContext('2d');
  const col = getComputedStyle(document.documentElement).getPropertyValue('--accent') || color;
  const col2 = getComputedStyle(document.documentElement).getPropertyValue('--accent2') || color;
  const ps = Array.from({ length: 36 }, () => ({
    x, y, a: Math.random() * 6.28, v: 2 + Math.random() * 6, g: .12,
    vy: -2 - Math.random() * 4, life: 1, c: Math.random() > .5 ? col : col2, s: 2 + Math.random() * 3
  }));
  let t0;
  function frame(t) {
    if (!t0) t0 = t; const dt = (t - t0) / 16.7;
    ctx.clearRect(0, 0, cv.width, cv.height);
    let alive = false;
    for (const p of ps) {
      p.x += Math.cos(p.a) * p.v; p.vy += p.g; p.y += p.vy; p.life -= .015 * dt;
      if (p.life > 0) { alive = true; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fill(); }
    }
    if (alive) requestAnimationFrame(frame); else cv.remove();
  }
  requestAnimationFrame(frame);
}
