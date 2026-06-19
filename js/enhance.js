/* enhance.js — upgrade rendered chapter HTML: copyable code blocks + "Try it" */
import { icon, toast } from './ui.js';

export function enhanceCode(root, ctx = {}) {
  root.querySelectorAll('pre.code, .code').forEach((block) => {
    if (block.dataset.enhanced) return;
    block.dataset.enhanced = '1';
    const codeEl = block.querySelector('code') || block;
    const text = codeEl.textContent.replace(/ /g, ' ').trimEnd();

    const sweep = document.createElement('div'); sweep.className = 'sweep'; block.append(sweep);

    const copy = document.createElement('button');
    copy.className = 'copy-btn'; copy.type = 'button';
    copy.innerHTML = icon('book', 13).replace('book', '') + 'Copy';
    copy.innerHTML = 'Copy';
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(text); }
      catch { const t = document.createElement('textarea'); t.value = text; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
      sweep.classList.remove('go'); void sweep.offsetWidth; sweep.classList.add('go');
      copy.textContent = '✓ Copied'; copy.classList.add('done');
      setTimeout(() => { copy.textContent = 'Copy'; copy.classList.remove('done'); }, 1600);
    });
    block.append(copy);

    if (ctx.hasTerminal && ctx.openTerminal) {
      const firstCmd = text.split('\n').map((l) => l.replace(/^\s*\$\s?/, '').trim()).find((l) => l && !l.startsWith('#'));
      if (firstCmd && /^(pwd|ls|cd|mkdir|touch|cat|less|clear|whoami|uname|echo|man|find|sudo|date|hostname|tree|history)\b/.test(firstCmd)) {
        const tryBtn = document.createElement('button');
        tryBtn.className = 'try-btn'; tryBtn.type = 'button'; tryBtn.textContent = '▶ Try it';
        tryBtn.addEventListener('click', () => ctx.openTerminal(firstCmd));
        block.append(tryBtn);
      }
    }
  });
}
