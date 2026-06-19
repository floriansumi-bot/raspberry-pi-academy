import { el, icon } from '../ui.js';
import { getChapter } from '../content.js';

const PROJECT_MAP = [
  { id: 'ch13', label: 'Watch your films', icon: 'M15 10l-7 4V6l7 4z', iconBg: 'purple' },
  { id: 'ch14', label: 'Play retro games', icon: 'M6 12h4M8 10v4M15 11h.01M18 11h.01M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', iconBg: 'teal' },
  { id: 'ch15', label: 'Make the whole network nicer', sublabel: '(block ads)', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', iconBg: 'coral' },
  { id: 'ch16', label: 'Keep your files private', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', iconBg: 'blue' },
  { id: 'ch17', label: 'Control your home', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', iconBg: 'amber' },
  { id: 'ch18', label: 'Run your own website', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z', iconBg: 'green' },
  { id: 'ch19', label: 'Chat with your own AI', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', iconBg: 'pink' },
];

const TIME_OPTS = [
  { value: 'evening', label: 'An evening', sub: '2–4 hours' },
  { value: 'weekend', label: 'A weekend', sub: 'a full day or two' },
  { value: 'ongoing', label: 'Ongoing', sub: 'I want a long-term project' },
];

const SKILL_OPTS = [
  { value: 'new', label: 'New to it', sub: 'I avoid the terminal if possible' },
  { value: 'getting', label: 'Getting there', sub: 'I can run basic commands' },
  { value: 'confident', label: 'Confident', sub: 'I feel at home in the terminal' },
];

const PROJECT_META = {
  ch13: { why: 'A media centre is rewarding from the first boot — no programming needed.', difficulty: 'Beginner', time: '2–3 hours' },
  ch14: { why: 'Retro gaming is plug-and-play fun with a great community behind it.', difficulty: 'Beginner', time: '2–4 hours' },
  ch15: { why: 'Pi-hole runs in the background and quietly improves every device on your network.', difficulty: 'Beginner–intermediate', time: '1–2 hours + ongoing' },
  ch16: { why: 'Your own private cloud means your files stay yours, not a corporation\'s.', difficulty: 'Intermediate', time: 'a weekend' },
  ch17: { why: 'Home Assistant is the gold standard for local, privacy-first home automation.', difficulty: 'Intermediate', time: 'a weekend + ongoing' },
  ch18: { why: 'Hosting your own site teaches you how the web actually works, end to end.', difficulty: 'Intermediate', time: 'a weekend' },
  ch19: { why: 'Running AI locally means complete privacy — no data leaves your home.', difficulty: 'Intermediate–advanced', time: 'a weekend' },
};

const TIME_NOTE = {
  evening: { evening: 'Perfect — this one is doable in a single sitting.', weekend: 'You could tackle it in an evening, but a weekend gives comfortable breathing room.', ongoing: 'This project grows with you over time — great if you enjoy tinkering.' },
  weekend: { evening: 'This fits your weekend well — you\'ll finish with time to spare.', weekend: 'A weekend is exactly the right amount of time for this build.', ongoing: 'You can get it running in a weekend and keep refining it from there.' },
  ongoing: { evening: 'You can have this running in an evening, then customise it indefinitely.', weekend: 'This scales from weekend project to long-term hobby, whichever suits you.', ongoing: 'This one truly never stops — there\'s always another integration to add.' },
};

const SKILL_NOTE = {
  new: 'Even if the terminal feels unfamiliar right now, this guide walks you through every command step by step.',
  getting: 'You\'re at the ideal skill level for this — you\'ll stretch a little but won\'t get lost.',
  confident: 'You\'ll fly through the basics and have plenty of headroom to go further.',
};

function iconSvg(path) {
  return `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
}

const BG_COLORS = {
  purple: { bg: '#EEEDFE', ink: '#3C3489' },
  teal:   { bg: '#E1F5EE', ink: '#085041' },
  coral:  { bg: '#FAECE7', ink: '#712B13' },
  blue:   { bg: '#E6F1FB', ink: '#0C447C' },
  amber:  { bg: '#FAEEDA', ink: '#633806' },
  green:  { bg: '#EAF3DE', ink: '#27500A' },
  pink:   { bg: '#FBEAF0', ink: '#72243E' },
};

export function mount(container, ctx = {}) {
  const go = ctx.navigate || ((h) => { location.hash = h; });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.getElementById('w-picker-css')) {
    const s = document.createElement('style');
    s.id = 'w-picker-css';
    s.textContent = `
.w-picker { padding: 1rem 0; font-family: var(--font-body, system-ui, sans-serif); }
.w-picker .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.w-picker .step { animation: picker-in 0.28s ease both; }
@keyframes picker-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.w-picker[data-reduced] .step { animation: none; }
.w-picker .step-label { font-size: 13px; font-weight: 500; color: var(--ink-soft, var(--color-text-secondary)); letter-spacing: .04em; text-transform: uppercase; margin-bottom: 10px; }
.w-picker .question { font-size: 20px; font-weight: 500; color: var(--ink, var(--color-text-primary)); margin: 0 0 18px; line-height: 1.35; }
.w-picker .opts { display: flex; flex-direction: column; gap: 10px; }
.w-picker .opt-btn { display: flex; align-items: center; gap: 12px; background: var(--surface, var(--color-background-primary)); border: 0.5px solid var(--line, var(--color-border-tertiary)); border-radius: var(--radius, var(--border-radius-lg, 12px)); padding: 12px 16px; cursor: pointer; text-align: left; transition: border-color 0.15s, background 0.15s; font-family: inherit; }
.w-picker .opt-btn:hover { border-color: var(--accent, var(--color-border-secondary)); background: var(--surface2, var(--color-background-secondary)); }
.w-picker .opt-btn:focus-visible { outline: 2px solid var(--accent, #C7152A); outline-offset: 2px; }
.w-picker .opt-icon { flex-shrink: 0; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.w-picker .opt-text { display: flex; flex-direction: column; gap: 2px; }
.w-picker .opt-label { font-size: 15px; font-weight: 500; color: var(--ink, var(--color-text-primary)); }
.w-picker .opt-sub { font-size: 13px; color: var(--ink-soft, var(--color-text-secondary)); }
.w-picker .row2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
.w-picker .row2 .opt-btn { flex-direction: column; align-items: flex-start; gap: 8px; padding: 14px 16px; }
.w-picker .result-card { background: var(--surface, var(--color-background-primary)); border: 0.5px solid var(--line, var(--color-border-tertiary)); border-radius: var(--radius, var(--border-radius-lg, 12px)); padding: 20px 20px 18px; }
.w-picker .result-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
.w-picker .result-icon { flex-shrink: 0; width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.w-picker .result-title { font-size: 19px; font-weight: 500; color: var(--ink, var(--color-text-primary)); margin: 0 0 4px; line-height: 1.25; }
.w-picker .result-why { font-size: 14px; color: var(--ink-soft, var(--color-text-secondary)); margin: 0; line-height: 1.5; }
.w-picker .result-meta { display: flex; gap: 10px; flex-wrap: wrap; margin: 14px 0; }
.w-picker .meta-pill { font-size: 13px; padding: 4px 10px; border-radius: 20px; background: var(--surface2, var(--color-background-secondary)); border: 0.5px solid var(--line, var(--color-border-tertiary)); color: var(--ink-soft, var(--color-text-secondary)); display: flex; align-items: center; gap: 6px; }
.w-picker .result-note { font-size: 13px; color: var(--ink-soft, var(--color-text-secondary)); background: var(--surface2, var(--color-background-secondary)); border-radius: 8px; padding: 10px 12px; margin: 14px 0 18px; line-height: 1.5; }
.w-picker .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: var(--accent, #C7152A); color: var(--accent-ink, #fff); border: none; border-radius: 8px; padding: 10px 18px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
.w-picker .btn-primary:hover { opacity: 0.88; }
.w-picker .btn-primary:focus-visible { outline: 2px solid var(--accent, #C7152A); outline-offset: 3px; }
.w-picker .btn-ghost { background: none; border: 0.5px solid var(--line, var(--color-border-tertiary)); color: var(--ink-soft, var(--color-text-secondary)); border-radius: 8px; padding: 8px 14px; font-size: 13px; cursor: pointer; font-family: inherit; margin-top: 12px; transition: background 0.15s; }
.w-picker .btn-ghost:hover { background: var(--surface2, var(--color-background-secondary)); }
.w-picker .btn-ghost:focus-visible { outline: 2px solid var(--accent, #C7152A); outline-offset: 2px; }
.w-picker .result-actions { display: flex; flex-direction: column; align-items: flex-start; gap: 0; }
    `;
    document.head.append(s);
  }

  container.classList.add('w-picker');
  if (reduced) container.dataset.reduced = '';

  const h2 = document.createElement('h2');
  h2.className = 'sr-only';
  h2.textContent = 'Project recommender — answer three quick questions to find the right Part IV project for you.';
  container.append(h2);

  let chosenProject = null;
  let chosenTime = null;
  let chosenSkill = null;

  function showStep(html) {
    const div = document.createElement('div');
    div.className = 'step';
    container.innerHTML = '';
    container.append(h2);
    container.append(div);
    div.innerHTML = html;
    return div;
  }

  function step1() {
    const div = document.createElement('div');
    div.className = 'step';
    container.innerHTML = '';
    container.append(h2);
    container.append(div);

    const label = el('p', { class: 'step-label', text: 'Step 1 of 3' });
    const q = el('p', { class: 'question', text: 'What sounds most fun to you?' });
    const opts = el('div', { class: 'opts' });

    for (const p of PROJECT_MAP) {
      const col = BG_COLORS[p.iconBg];
      const iconWrap = el('span', { class: 'opt-icon', style: { background: col.bg, color: col.ink } });
      iconWrap.innerHTML = iconSvg(p.icon);

      const textWrap = el('span', { class: 'opt-text' });
      const lbl = el('span', { class: 'opt-label', text: p.label });
      textWrap.append(lbl);
      if (p.sublabel) {
        const sub = el('span', { class: 'opt-sub', text: p.sublabel });
        textWrap.append(sub);
      }

      const btn = el('button', { class: 'opt-btn', 'aria-label': p.label + (p.sublabel ? ' ' + p.sublabel : '') });
      btn.append(iconWrap, textWrap);
      btn.addEventListener('click', () => { chosenProject = p.id; step2(); });
      opts.append(btn);
    }

    div.append(label, q, opts);
  }

  function step2() {
    const div = document.createElement('div');
    div.className = 'step';
    container.innerHTML = '';
    container.append(h2);
    container.append(div);

    const label = el('p', { class: 'step-label', text: 'Step 2 of 3' });
    const q = el('p', { class: 'question', text: 'How much time do you have to spare?' });
    const opts = el('div', { class: 'opts row2' });

    for (const t of TIME_OPTS) {
      const textWrap = el('span', { class: 'opt-text' });
      textWrap.append(
        el('span', { class: 'opt-label', text: t.label }),
        el('span', { class: 'opt-sub', text: t.sub })
      );
      const btn = el('button', { class: 'opt-btn', 'aria-label': t.label + ' — ' + t.sub });
      btn.append(textWrap);
      btn.addEventListener('click', () => { chosenTime = t.value; step3(); });
      opts.append(btn);
    }

    div.append(label, q, opts);
  }

  function step3() {
    const div = document.createElement('div');
    div.className = 'step';
    container.innerHTML = '';
    container.append(h2);
    container.append(div);

    const label = el('p', { class: 'step-label', text: 'Step 3 of 3' });
    const q = el('p', { class: 'question', text: 'How comfortable are you in the terminal?' });
    const opts = el('div', { class: 'opts row2' });

    for (const s of SKILL_OPTS) {
      const textWrap = el('span', { class: 'opt-text' });
      textWrap.append(
        el('span', { class: 'opt-label', text: s.label }),
        el('span', { class: 'opt-sub', text: s.sub })
      );
      const btn = el('button', { class: 'opt-btn', 'aria-label': s.label + ' — ' + s.sub });
      btn.append(textWrap);
      btn.addEventListener('click', () => { chosenSkill = s.value; showResult(); });
      opts.append(btn);
    }

    div.append(label, q, opts);
  }

  function showResult() {
    const chapter = getChapter(chosenProject);
    const meta = PROJECT_META[chosenProject];
    const col = BG_COLORS[PROJECT_MAP.find(p => p.id === chosenProject).iconBg];
    const projIcon = PROJECT_MAP.find(p => p.id === chosenProject).icon;

    const timeKey = chosenProject ? (TIME_NOTE[chosenTime] || {}) : {};
    const projectMeta = PROJECT_META[chosenProject];

    const metaLookup = TIME_NOTE[chosenTime] || {};
    const timeMatchKey = Object.keys(metaLookup).find(k => {
      if (chosenProject === 'ch13' || chosenProject === 'ch14') return k === 'evening';
      if (chosenProject === 'ch15') return k === 'evening';
      if (chosenProject === 'ch16' || chosenProject === 'ch18') return k === 'weekend';
      if (chosenProject === 'ch17') return k === 'weekend';
      if (chosenProject === 'ch19') return k === 'weekend';
      return k === 'weekend';
    });
    const timeNote = (TIME_NOTE[chosenTime] || {})[timeMatchKey] || '';
    const skillNote = SKILL_NOTE[chosenSkill] || '';
    const combinedNote = [timeNote, skillNote].filter(Boolean).join(' ');

    const div = document.createElement('div');
    div.className = 'step';
    container.innerHTML = '';
    container.append(h2);
    container.append(div);

    const stepLbl = el('p', { class: 'step-label', text: 'Your recommendation' });

    const card = el('div', { class: 'result-card' });

    const iconWrap = el('span', { class: 'result-icon', style: { background: col.bg, color: col.ink } });
    iconWrap.innerHTML = iconSvg(projIcon);

    const titleBlock = el('div');
    titleBlock.append(
      el('p', { class: 'result-title', text: chapter ? chapter.title : chosenProject }),
      el('p', { class: 'result-why', text: meta.why })
    );

    const header = el('div', { class: 'result-header' });
    header.append(iconWrap, titleBlock);

    const metaBar = el('div', { class: 'result-meta' });

    const diffPill = el('span', { class: 'meta-pill' });
    diffPill.innerHTML = iconSvg('M3 3h18v18H3zM9 9h6M9 13h6M9 17h4').replace('28', '16').replace('28', '16');
    diffPill.append(document.createTextNode(meta.difficulty));

    const timePill = el('span', { class: 'meta-pill' });
    timePill.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
    timePill.append(document.createTextNode(meta.time));

    metaBar.append(diffPill, timePill);

    const noteEl = el('p', { class: 'result-note', text: combinedNote });

    const actions = el('div', { class: 'result-actions' });

    const startBtn = el('button', { class: 'btn-primary', 'aria-label': 'Start chapter: ' + (chapter ? chapter.title : chosenProject) });
    startBtn.innerHTML = 'Start this project ' + icon('arrow', 18);
    startBtn.addEventListener('click', () => { go('#/chapter/' + chosenProject); });

    const overBtn = el('button', { class: 'btn-ghost', text: 'Start over' });
    overBtn.addEventListener('click', () => { chosenProject = null; chosenTime = null; chosenSkill = null; step1(); });

    actions.append(startBtn, overBtn);

    card.append(header, metaBar, noteEl, actions);
    div.append(stepLbl, card);
  }

  step1();
}
