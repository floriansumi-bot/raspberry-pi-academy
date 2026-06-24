/* badges.js — the single source of truth for milestone badges (used by the
   reader to award them and by the My Pi dashboard to render the parts tray). */

export const BADGES = [
  { id: 'first-boot', name: 'First Boot', ch: 'ch04', svg: '<rect x="14" y="8" width="20" height="32" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="32" r="3" fill="currentColor"/><path d="M24 14v10" stroke="currentColor" stroke-width="3"/>' },
  { id: 'terminal-tamer', name: 'Terminal Tamer', ch: 'ch06', svg: '<rect x="6" y="10" width="36" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><path d="M14 20l5 4-5 4M26 28h8" stroke="currentColor" stroke-width="3" fill="none"/>' },
  { id: 'it-blinks', name: 'It Blinks!', ch: 'ch12', svg: '<circle cx="24" cy="20" r="9" fill="none" stroke="currentColor" stroke-width="3"/><path d="M20 29h8l-1 8h-6z" fill="currentColor"/><path d="M24 4v4M11 9l3 3M37 9l-3 3" stroke="currentColor" stroke-width="3"/>' },
  { id: 'adblock-up', name: 'Ad-Blocker Up', ch: 'ch15', svg: '<path d="M24 6l14 5v9c0 9-6 15-14 18-8-3-14-9-14-18v-9z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M16 24l5 5 11-11" stroke="currentColor" stroke-width="3" fill="none"/>' },
  { id: 'server-online', name: 'Home Server', ch: 'ch16', svg: '<rect x="8" y="10" width="32" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><rect x="8" y="26" width="32" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="14" cy="16" r="2" fill="currentColor"/><circle cx="14" cy="32" r="2" fill="currentColor"/>' },
  { id: 'ai-on-pi', name: 'AI on the Pi', ch: 'ch19', svg: '<rect x="12" y="12" width="24" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="20" cy="22" r="2.5" fill="currentColor"/><circle cx="28" cy="22" r="2.5" fill="currentColor"/><path d="M19 30h10M24 4v8M24 36v8M4 24h8M36 24h8" stroke="currentColor" stroke-width="3"/>' },
  { id: 'kernel-diver', name: 'Under the Hood', ch: 'ch32', svg: '<circle cx="24" cy="24" r="9" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="24" r="3" fill="currentColor"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4" stroke="currentColor" stroke-width="3"/>' },
];

export function badgeForChapter(ch) { return BADGES.find((b) => b.ch === ch) || null; }
