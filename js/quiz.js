/* quiz.js — friendly end-of-chapter micro-check. No shaming, peek allowed. */
import { el, icon } from './ui.js';
import { store } from './store.js';

const KEYS = ['A', 'B', 'C', 'D', 'E'];

export function renderQuiz(quiz, chapterId, onComplete) {
  const wrap = el('section', { class: 'quiz', 'aria-label': 'Check your understanding' });
  const total = quiz.questions.length;
  let answered = 0, correct = 0;

  wrap.append(el('div', { class: 'quiz-head' },
    el('h3', { text: 'Quick check' }),
    el('p', { text: 'A few light questions — wrong answers cost nothing, and you can always peek.' })
  ));

  const body = el('div', { class: 'quiz-body' });
  const foot = el('div', { class: 'quiz-foot' });
  const score = el('span', { class: 'quiz-score muted', text: `0 / ${total}` });

  quiz.questions.forEach((q, qi) => {
    const item = el('div', { class: 'q-item' });
    item.append(el('div', { class: 'q-text', id: 'q-' + chapterId + '-' + qi, text: `${qi + 1}. ${q.q}` }));
    const choices = el('div', { class: 'q-choices', role: 'group', 'aria-labelledby': 'q-' + chapterId + '-' + qi });
    const fb = el('div', { class: 'q-feedback', role: 'status', 'aria-live': 'polite' });
    let locked = false;

    q.choices.forEach((c, ci) => {
      const btn = el('button', { class: 'q-choice', type: 'button' },
        el('span', { class: 'q-key', text: KEYS[ci] }),
        el('span', { text: c })
      );
      btn.addEventListener('click', () => {
        if (locked) return;
        locked = true; answered++;
        const right = ci === q.answer;
        if (right) { btn.classList.add('correct'); correct++; }
        else {
          btn.classList.add('chosen', 'miss');
          choices.children[q.answer].classList.add('correct');
        }
        [...choices.children].forEach((b) => (b.disabled = true));
        fb.innerHTML = (right ? '<strong>Nice — that\'s right.</strong> ' : '<strong>Good try.</strong> ') + (q.explain || '');
        fb.classList.add('show');
        score.textContent = `${correct} / ${total}`;
        if (answered === total) finish();
      });
      choices.append(btn);
    });

    const peek = el('button', { class: 'peek', type: 'button', text: 'Reveal answer' });
    peek.addEventListener('click', () => {
      if (locked) return;
      locked = true; answered++;
      choices.children[q.answer].classList.add('correct');
      [...choices.children].forEach((b) => (b.disabled = true));
      fb.innerHTML = `<strong>Answer: ${KEYS[q.answer]}.</strong> ${q.explain || ''}`;
      fb.classList.add('show');
      if (answered === total) finish();
    });
    fb.classList.add('show'); fb.innerHTML = '';
    fb.classList.remove('show');

    item.append(choices, fb, el('div', { style: { marginTop: '.5rem', fontSize: '.82rem' } }, peek));
    body.append(item);
  });

  function finish() {
    store.setQuiz(chapterId, correct, total);
    score.textContent = `${correct} / ${total} ✓`;
    score.classList.remove('muted');
    if (onComplete) onComplete(correct, total);
  }

  foot.append(score, el('span', { class: 'muted', style: { fontSize: '.8rem' }, text: 'Answer all to finish the check' }));
  wrap.append(body, foot);
  return wrap;
}
