/* terminal.js — PI TERMINAL SANDBOX
 * A fully simulated Raspberry Pi OS Bookworm shell (Bash) running entirely in the browser.
 * In-memory virtual filesystem rooted at /home/pi, accurate core commands, and
 * content-aware superpowers (man → glossary, find → search, lessons → chapters).
 */

import { el, icon, toast } from '../ui.js';
import { loadGlossary, manifest, getChapter, order, routeFor } from '../content.js';
import { query } from '../search.js';

/* ───────────────────────────── one-time CSS ───────────────────────────── */
function injectCSS() {
  if (document.getElementById('w-piterm-css')) return;
  const s = document.createElement('style');
  s.id = 'w-piterm-css';
  s.textContent = `
  .w-piterm{
    --term-bg: var(--code-bg); --term-ink: var(--code-ink);
    display:flex; flex-direction:column; border:1px solid var(--line);
    border-radius:var(--radius); overflow:hidden; background:var(--term-bg);
    box-shadow:var(--shadow); font-family:var(--font-mono);
    min-height:360px;
  }
  .w-piterm.is-overlay{ height:100%; min-height:0; flex:1 1 auto; }
  .w-piterm .pt-bar{
    display:flex; align-items:center; gap:.5rem; padding:.5rem .75rem;
    background:var(--surface2); border-bottom:1px solid var(--line);
    font-family:var(--font-body); flex:0 0 auto;
  }
  .w-piterm .pt-dots{ display:flex; gap:.4rem; }
  .w-piterm .pt-dots i{ width:11px; height:11px; border-radius:50%; display:block; opacity:.85; }
  .w-piterm .pt-dots i:nth-child(1){ background:#ff5f56; }
  .w-piterm .pt-dots i:nth-child(2){ background:#ffbd2e; }
  .w-piterm .pt-dots i:nth-child(3){ background:#27c93f; }
  .w-piterm .pt-title{
    font-size:.78rem; color:var(--ink-soft); letter-spacing:.02em;
    display:flex; align-items:center; gap:.4rem; flex:1 1 auto; min-width:0;
  }
  .w-piterm .pt-title svg{ flex:0 0 auto; color:var(--accent2); }
  .w-piterm .pt-title b{ color:var(--ink); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .w-piterm .pt-btn{
    font-family:var(--font-body); font-size:.72rem; cursor:pointer;
    background:transparent; border:1px solid var(--line); color:var(--ink-soft);
    border-radius:var(--radius-sm); padding:.22rem .55rem; line-height:1;
    min-height:28px; display:inline-flex; align-items:center; justify-content:center;
    transition:background .15s,color .15s,border-color .15s;
  }
  .w-piterm .pt-btn:hover{ background:var(--surface); color:var(--ink); }
  .w-piterm .pt-btn:focus-visible{ outline:2px solid var(--accent2); outline-offset:1px; }
  .w-piterm .pt-busy{
    margin-left:auto; flex:0 0 auto; display:none; align-items:center; gap:.35rem;
    font-family:var(--font-body); font-size:.7rem; color:var(--accent2);
  }
  .w-piterm.is-busy .pt-busy{ display:inline-flex; }
  .w-piterm .pt-busy i{
    width:8px; height:8px; border-radius:50%; background:var(--accent2);
    animation:pt-pulse 1s ease-in-out infinite;
  }
  @keyframes pt-pulse{ 0%,100%{ opacity:.25; } 50%{ opacity:1; } }
  @media (prefers-reduced-motion: reduce){
    .w-piterm .pt-busy i{ animation:none; opacity:.8; }
  }

  .w-piterm .pt-screen{
    flex:1 1 auto; overflow-y:auto; overflow-x:hidden; padding:.85rem 1rem 1rem;
    color:var(--term-ink); font-size:.86rem; line-height:1.5;
    cursor:text; background:var(--term-bg);
    min-height:0; overscroll-behavior:contain;
  }
  .w-piterm:not(.is-overlay) .pt-screen{ max-height:440px; }
  .w-piterm .pt-screen::-webkit-scrollbar{ width:10px; }
  .w-piterm .pt-screen::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.16); border-radius:6px; }
  .w-piterm .pt-line{ white-space:pre-wrap; word-break:break-word; }
  .w-piterm .pt-line.pt-cmd{ color:var(--term-ink); }
  .w-piterm .pt-prompt-user{ color:#27c93f; }
  .w-piterm .pt-prompt-host{ color:#27c93f; }
  .w-piterm .pt-prompt-sep{ color:rgba(255,255,255,.55); }
  .w-piterm .pt-prompt-path{ color:#4aa3ff; }
  .w-piterm .pt-prompt-dollar{ color:rgba(255,255,255,.78); }
  .w-piterm .pt-dir{ color:#4aa3ff; font-weight:600; }
  .w-piterm .pt-exe{ color:#27c93f; }
  .w-piterm .pt-muted{ color:rgba(255,255,255,.5); }
  .w-piterm .pt-err{ color:#ff7b72; }
  .w-piterm .pt-warn{ color:#ffbd2e; }
  .w-piterm .pt-accent{ color:#ff9db0; }
  .w-piterm .pt-ok{ color:#27c93f; }
  .w-piterm .pt-link{
    color:#ffbd2e; cursor:pointer; text-decoration:none;
    border-bottom:1px dotted rgba(255,189,46,.5);
  }
  .w-piterm .pt-link:hover{ color:#ffd45e; border-bottom-color:#ffd45e; }
  .w-piterm .pt-link:focus-visible{ outline:2px solid #ffbd2e; outline-offset:2px; border-radius:2px; }

  .w-piterm .pt-inputline{ display:flex; align-items:baseline; flex-wrap:wrap; }
  .w-piterm .pt-prompt{ white-space:pre; flex:0 0 auto; }
  .w-piterm .pt-inputwrap{ position:relative; flex:1 1 120px; display:inline-flex; align-items:center; }
  .w-piterm .pt-input{
    flex:1 1 auto; min-width:60px; background:transparent; border:0; outline:0;
    color:var(--term-ink); font-family:var(--font-mono); font-size:.86rem;
    padding:0; margin:0; caret-color:transparent;
  }
  .w-piterm .pt-cursor{
    position:absolute; width:.55em; height:1.15em; background:var(--term-ink);
    opacity:.85; pointer-events:none; transform:translateY(.05em);
    animation:pt-blink 1.05s steps(1) infinite;
  }
  @keyframes pt-blink{ 50%{ opacity:0; } }
  @media (prefers-reduced-motion: reduce){
    .w-piterm .pt-cursor{ animation:none; }
  }
  .w-piterm .pt-screen:focus-within .pt-cursor{ display:block; }
  /* On touch / coarse pointers, show the real native caret and hide the fake one,
     so tapping to place the cursor behaves as the user expects. */
  @media (pointer: coarse){
    .w-piterm .pt-input{ caret-color:var(--term-ink); }
    .w-piterm .pt-cursor{ display:none !important; }
  }
  `;
  document.head.append(s);
}

/* ───────────────────────────── helpers ───────────────────────────── */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stripTags = (s) => String(s).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

/* ───────────────────────── virtual filesystem ───────────────────────── */
/* Node: { type:'dir', children:{} }  or  { type:'file', content:'…' } */
function buildFS() {
  const file = (content) => ({ type: 'file', content });
  const dir = (children = {}) => ({ type: 'dir', children });
  return dir({
    home: dir({
      pi: dir({
        Documents: dir({
          'notes.txt': file('Shopping list:\n- microSD card (A2, 64GB)\n- USB-C power supply (27W)\n- mini HDMI cable\n\nRemember: back up the SD card before tinkering!'),
          'README.txt': file('Welcome to your Raspberry Pi.\n\nThis Documents folder is where your own files live.\nTry: cat notes.txt   or   nano notes.txt'),
        }),
        Downloads: dir({
          'raspios-bookworm.img.xz': file('(binary disk image — 1.1 GB — not shown)'),
        }),
        Desktop: dir({}),
        Pictures: dir({
          'first-boot.png': file('(image data — a screenshot of your very first desktop)'),
        }),
        Music: dir({}),
        Videos: dir({}),
        Bookshelf: dir({
          'Beginners-Guide.pdf': file('(The official Raspberry Pi Beginner’s Guide — open in a PDF reader)'),
        }),
        projects: dir({
          'blink.py': file('# blink.py — flash an LED on GPIO 17\nfrom gpiozero import LED\nfrom time import sleep\n\nled = LED(17)\nwhile True:\n    led.on()\n    sleep(1)\n    led.off()\n    sleep(1)\n'),
        }),
        'hello.py': file('# hello.py — your first program\nprint("Hello from your Raspberry Pi!")\n'),
        'notes.txt': file('Things to learn:\n1. The terminal (you are here!)\n2. Installing software with apt\n3. Writing Python\n4. Wiring up an LED\n'),
        'README.txt': file('This is your home folder (~  =  /home/pi).\n\nEverything you own lives under here. Type `ls` to look around,\n`help` to see what this sandbox can do, or `lessons` to jump\nstraight into the book.\n'),
        '.bashrc': file('# ~/.bashrc — runs every time a new shell starts\nalias ll=\'ls -lah\'\nalias update=\'sudo apt update && sudo apt full-upgrade\'\n'),
        '.bash_history': file('ls\ncd projects\npython3 blink.py\n'),
      }),
    }),
    etc: dir({
      'hostname': file('raspberrypi\n'),
      'os-release': file('PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nNAME="Raspberry Pi OS"\nVERSION_ID="12"\nVERSION="12 (bookworm)"\nID=debian\n'),
    }),
    usr: dir({ bin: dir({}), share: dir({}) }),
    var: dir({ log: dir({}) }),
    boot: dir({ firmware: dir({}) }),
    tmp: dir({}),
  });
}

/* fake long-format metadata, deterministic per name */
function lsMeta(name, node) {
  const isDir = node.type === 'dir';
  const perms = isDir ? 'drwxr-xr-x' : (name.endsWith('.py') ? '-rwxr-xr-x' : '-rw-r--r--');
  let bytes;
  if (isDir) bytes = 4096;
  else if (typeof node.content === 'string' && !node.content.startsWith('(')) bytes = node.content.length;
  else { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 900000; bytes = 11000 + h; }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let h = 5; for (const c of name) h = (h * 17 + c.charCodeAt(0)) >>> 0;
  const mon = months[h % 12]; const day = String((h >> 4) % 27 + 1).padStart(2, ' ');
  const hh = String((h >> 8) % 24).padStart(2, '0'); const mm = String((h >> 3) % 60).padStart(2, '0');
  return { perms, links: isDir ? 2 : 1, owner: 'pi', group: 'pi', bytes, date: `${mon} ${day} ${hh}:${mm}` };
}
function human(b) {
  if (b < 1024) return b + '';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1).replace(/\.0$/, '') + 'K';
  return (b / 1048576).toFixed(1).replace(/\.0$/, '') + 'M';
}

/* ───────────────────────────── the widget ───────────────────────────── */
export function mount(container, ctx = {}) {
  injectCSS();
  const go = ctx.navigate || ((h) => { location.hash = h; });

  const fs = buildFS();
  let cwd = ['home', 'pi'];           // path segments from root
  const history = [];                 // command strings
  let histIdx = -1;                   // navigation pointer
  let draft = '';                     // stashed in-progress line while browsing history
  let busy = false;                   // true while an async command (man/find) is pending

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- path utilities (operate on segment arrays) ---- */
  function resolveSegs(path) {
    // returns array of segments from root, or null if syntactically home-relative handled
    let segs;
    if (path === '~' || path === '') segs = ['home', 'pi'];
    else if (path === '~/' ) segs = ['home', 'pi'];
    else if (path.startsWith('~/')) segs = ['home', 'pi', ...path.slice(2).split('/')];
    else if (path === '/') segs = [];
    else if (path.startsWith('/')) segs = path.slice(1).split('/');
    else segs = [...cwd, ...path.split('/')];
    const out = [];
    for (const part of segs) {
      if (part === '' || part === '.') continue;
      if (part === '..') { out.pop(); continue; }
      out.push(part);
    }
    return out;
  }
  function nodeAt(segs) {
    let n = { type: 'dir', children: fs.children };
    for (const seg of segs) {
      if (n.type !== 'dir' || !n.children[seg]) return null;
      n = n.children[seg];
    }
    return n;
  }
  function parentOf(segs) { return nodeAt(segs.slice(0, -1)); }
  function cwdNode() { return nodeAt(cwd); }
  function pathStr(segs) { return '/' + segs.join('/'); }
  function promptPath() {
    if (cwd.length >= 2 && cwd[0] === 'home' && cwd[1] === 'pi') {
      const rest = cwd.slice(2);
      return rest.length ? '~/' + rest.join('/') : '~';
    }
    return cwd.length ? '/' + cwd.join('/') : '/';
  }

  /* ---- DOM scaffold ---- */
  container.classList.add('w-piterm');
  if (ctx.overlay) container.classList.add('is-overlay');

  const screen = el('div', { class: 'pt-screen', tabindex: '-1' });
  const bar = el('div', { class: 'pt-bar' },
    el('span', { class: 'pt-dots' }, el('i'), el('i'), el('i')),
    el('span', { class: 'pt-title', html: `${icon('terminal', 16)} <b>pi@raspberrypi</b>: Bash sandbox` }),
    el('button', {
      class: 'pt-btn', type: 'button', 'aria-label': 'Clear the terminal screen',
      onClick: () => { cmdClear(); focusInput(); }
    }, 'clear'),
    el('button', {
      class: 'pt-btn', type: 'button', 'aria-label': 'Show available commands',
      onClick: () => { runLine('help'); }
    }, 'help'),
    el('span', {
      class: 'pt-busy', role: 'status', 'aria-live': 'polite',
      html: '<i></i>working…'
    }),
  );
  container.append(bar, screen);

  /* ---- input line ---- */
  const input = el('input', {
    class: 'pt-input', type: 'text', inputmode: 'text', spellcheck: 'false', autocomplete: 'off',
    autocapitalize: 'off', autocorrect: 'off', 'aria-label': 'Terminal command input',
  });
  const cursor = el('span', { class: 'pt-cursor' });
  const promptSpan = el('span', { class: 'pt-prompt' });
  const inputWrap = el('span', { class: 'pt-inputwrap' }, input, cursor);
  const inputLine = el('div', { class: 'pt-line pt-inputline' }, promptSpan, inputWrap);

  function promptHTML() {
    return `<span class="pt-prompt-user">pi@raspberrypi</span>` +
      `<span class="pt-prompt-sep">:</span>` +
      `<span class="pt-prompt-path">${esc(promptPath())}</span>` +
      `<span class="pt-prompt-dollar"> $ </span>`;
  }
  function refreshPrompt() { promptSpan.innerHTML = promptHTML(); }

  /* keep the fake cursor glued to the real caret position */
  function syncCursor() {
    // measure width of current value using a hidden span
    const v = input.value;
    meas.textContent = v.slice(0, input.selectionStart ?? v.length) || '';
    const w = meas.getBoundingClientRect().width;
    cursor.style.left = w + 'px';
  }
  const meas = el('span', { style: { position: 'absolute', visibility: 'hidden', whiteSpace: 'pre', font: 'inherit' } });
  inputWrap.append(meas);

  /* ---- output helpers ---- */
  function out(html, cls = '') {
    const line = el('div', { class: 'pt-line' + (cls ? ' ' + cls : ''), html });
    screen.insertBefore(line, inputLine);
    return line;
  }
  function outText(text, cls = '') { return out(esc(text), cls); }
  function blank() { out('&nbsp;'); }
  function scrollDown() { screen.scrollTop = screen.scrollHeight; }
  function focusInput() { input.focus(); syncCursor(); }

  function echoCommand(raw) {
    const line = el('div', { class: 'pt-line pt-cmd', html: promptHTML() + esc(raw) });
    screen.insertBefore(line, inputLine);
  }

  /* clickable navigation line */
  function navLine(label, hash, sub) {
    const a = el('a', {
      class: 'pt-link', href: '#', role: 'link', tabindex: '0',
      onClick: (e) => { e.preventDefault(); go(hash); },
      onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(hash); } },
    }, label);
    const wrap = el('div', { class: 'pt-line' }, a);
    if (sub) wrap.append(el('span', { class: 'pt-muted', text: '  ' + sub }));
    screen.insertBefore(wrap, inputLine);
    return wrap;
  }

  /* ───────────────────────── command parsing ───────────────────────── */
  function tokenize(str) {
    const toks = []; let cur = ''; let q = null; let had = false;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (q) { if (c === q) q = null; else cur += c; had = true; }
      else if (c === '"' || c === "'") { q = c; had = true; }
      else if (c === ' ' || c === '\t') { if (cur || had) { toks.push(cur); cur = ''; had = false; } }
      else { cur += c; had = true; }
    }
    if (cur || had) toks.push(cur);
    return toks;
  }

  /* ───────────────────────────── commands ───────────────────────────── */
  const COMMANDS = {}; // name -> fn(args, rawAfter)

  function cmdClear() {
    [...screen.querySelectorAll('.pt-line')].forEach((n) => { if (n !== inputLine) n.remove(); });
  }

  // ---- navigation
  COMMANDS.pwd = () => outText(pathStr(cwd) || '/');

  COMMANDS.cd = (args) => {
    const target = args[0];
    if (target === undefined || target === '~') { cwd = ['home', 'pi']; refreshPrompt(); return; }
    if (target === '-') { cwd = ['home', 'pi']; refreshPrompt(); return; } // simplified: prev → home
    const segs = resolveSegs(target);
    const node = nodeAt(segs);
    if (!node) { out(`<span class="pt-err">bash: cd: ${esc(target)}: No such file or directory</span>`); return; }
    if (node.type !== 'dir') { out(`<span class="pt-err">bash: cd: ${esc(target)}: Not a directory</span>`); return; }
    cwd = segs; refreshPrompt();
  };

  function listing(segs) {
    const node = nodeAt(segs);
    if (!node) return null;
    if (node.type === 'file') return [{ name: segs[segs.length - 1], node }];
    return Object.keys(node.children).sort((a, b) => a.localeCompare(b)).map((name) => ({ name, node: node.children[name] }));
  }

  COMMANDS.ls = (args) => {
    const flags = new Set();
    const paths = [];
    for (const a of args) {
      if (a.startsWith('-') && a.length > 1) for (const ch of a.slice(1)) flags.add(ch);
      else paths.push(a);
    }
    const targetSegs = paths.length ? resolveSegs(paths[0]) : cwd;
    let items = listing(targetSegs);
    if (items === null) { out(`<span class="pt-err">ls: cannot access '${esc(paths[0])}': No such file or directory</span>`); return; }
    const all = flags.has('a');
    const long = flags.has('l');
    const hum = flags.has('h');

    let names = items.slice();
    if (all && (nodeAt(targetSegs)?.type === 'dir')) {
      names = [{ name: '.', node: { type: 'dir', children: {} } }, { name: '..', node: { type: 'dir', children: {} } }, ...names];
    } else {
      names = names.filter((it) => !it.name.startsWith('.'));
    }

    if (long) {
      const totalBlocks = names.reduce((s, it) => s + Math.ceil(lsMeta(it.name, it.node).bytes / 1024) * 4, 0);
      out(`<span class="pt-muted">total ${totalBlocks || 0}</span>`);
      for (const it of names) {
        const m = lsMeta(it.name, it.node);
        const sz = hum ? human(m.bytes).padStart(6) : String(m.bytes).padStart(7);
        const isDir = it.node.type === 'dir';
        const cls = isDir ? 'pt-dir' : (it.name.endsWith('.py') ? 'pt-exe' : '');
        out(`${m.perms} ${m.links} ${m.owner} ${m.group} ${sz} ${m.date} ` +
          `<span class="${cls}">${esc(it.name)}</span>`);
      }
    } else {
      const parts = names.map((it) => {
        const isDir = it.node.type === 'dir';
        const cls = isDir ? 'pt-dir' : (it.name.endsWith('.py') ? 'pt-exe' : '');
        return cls ? `<span class="${cls}">${esc(it.name)}</span>` : esc(it.name);
      });
      out(parts.join('  ') || '<span class="pt-muted">(empty)</span>');
    }
  };

  // ---- making things
  COMMANDS.mkdir = (args) => {
    const names = args.filter((a) => !a.startsWith('-'));
    const parents = args.includes('-p');
    if (!names.length) { out('<span class="pt-err">mkdir: missing operand</span>'); return; }
    for (const name of names) {
      const segs = resolveSegs(name);
      const parent = nodeAt(segs.slice(0, -1));
      if (!parent || parent.type !== 'dir') {
        if (parents) { /* pretend deep create works */ out(`<span class="pt-muted">created directory '${esc(name)}'</span>`); continue; }
        out(`<span class="pt-err">mkdir: cannot create directory '${esc(name)}': No such file or directory</span>`); continue;
      }
      const leaf = segs[segs.length - 1];
      if (parent.children[leaf]) { out(`<span class="pt-err">mkdir: cannot create directory '${esc(name)}': File exists</span>`); continue; }
      parent.children[leaf] = { type: 'dir', children: {} };
    }
  };

  COMMANDS.touch = (args) => {
    const names = args.filter((a) => !a.startsWith('-'));
    if (!names.length) { out('<span class="pt-err">touch: missing file operand</span>'); return; }
    for (const name of names) {
      const segs = resolveSegs(name);
      const parent = nodeAt(segs.slice(0, -1));
      const leaf = segs[segs.length - 1];
      if (!parent || parent.type !== 'dir') { out(`<span class="pt-err">touch: cannot touch '${esc(name)}': No such file or directory</span>`); continue; }
      if (!parent.children[leaf]) parent.children[leaf] = { type: 'file', content: '' };
    }
  };

  COMMANDS.rm = (args) => {
    const names = args.filter((a) => !a.startsWith('-'));
    if (!names.length) { out('<span class="pt-err">rm: missing operand</span>'); return; }
    for (const name of names) {
      const segs = resolveSegs(name);
      const parent = nodeAt(segs.slice(0, -1));
      const leaf = segs[segs.length - 1];
      if (!parent || parent.type !== 'dir' || !parent.children[leaf]) {
        out(`<span class="pt-err">rm: cannot remove '${esc(name)}': No such file or directory</span>`); continue;
      }
      delete parent.children[leaf];
    }
    out('<span class="pt-warn">Note: this is a safe sandbox — nothing on a real Pi was touched.</span>');
    out('<span class="pt-muted">(On a real Pi, rm permanently deletes files. There is no undo — handle with care.)</span>');
  };

  // ---- reading
  COMMANDS.cat = (args) => {
    const names = args.filter((a) => !a.startsWith('-'));
    if (!names.length) { out('<span class="pt-muted">(cat with no file just echoes what you type — try `cat notes.txt`)</span>'); return; }
    for (const name of names) {
      const segs = resolveSegs(name);
      const node = nodeAt(segs);
      if (!node) { out(`<span class="pt-err">cat: ${esc(name)}: No such file or directory</span>`); continue; }
      if (node.type === 'dir') { out(`<span class="pt-err">cat: ${esc(name)}: Is a directory</span>`); continue; }
      const txt = node.content || '';
      if (!txt) { /* empty file → no output */ continue; }
      txt.split('\n').forEach((l) => outText(l));
    }
  };

  COMMANDS.less = (args) => {
    const name = args.find((a) => !a.startsWith('-'));
    if (!name) { out('<span class="pt-err">less: missing filename</span>'); return; }
    const node = nodeAt(resolveSegs(name));
    if (!node) { out(`<span class="pt-err">${esc(name)}: No such file or directory</span>`); return; }
    if (node.type === 'dir') { out(`<span class="pt-err">${esc(name)}: Is a directory</span>`); return; }
    out('<span class="pt-muted">── less (sandbox): showing the whole file. On a real Pi, Space=down, B=up, Q=quit. ──</span>');
    (node.content || '').split('\n').forEach((l) => outText(l));
    out('<span class="pt-muted">(END)</span>');
  };

  COMMANDS.echo = (args, raw) => {
    // raw is everything after "echo "; tokenizer already stripped quotes from args.
    // Handle simple redirects > and >> into the virtual fs.
    let redirect = null, append = false, fileName = null;
    const words = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '>' || a === '>>') { append = a === '>>'; fileName = args[i + 1]; redirect = true; break; }
      if (a.startsWith('>>')) { append = true; fileName = a.slice(2) || args[i + 1]; redirect = true; break; }
      if (a.startsWith('>')) { append = false; fileName = a.slice(1) || args[i + 1]; redirect = true; break; }
      words.push(a);
    }
    const text = words.join(' ');
    if (redirect && fileName) {
      const segs = resolveSegs(fileName);
      const parent = nodeAt(segs.slice(0, -1)); const leaf = segs[segs.length - 1];
      if (!parent || parent.type !== 'dir') { out(`<span class="pt-err">bash: ${esc(fileName)}: No such file or directory</span>`); return; }
      const existing = parent.children[leaf];
      if (append && existing && existing.type === 'file') existing.content += (existing.content ? '\n' : '') + text;
      else parent.children[leaf] = { type: 'file', content: text };
      return; // redirect → nothing printed to screen
    }
    outText(text);
  };

  // ---- identity / system
  COMMANDS.whoami = () => outText('pi');
  COMMANDS.hostname = () => outText('raspberrypi');
  COMMANDS.uname = (args) => {
    if (args.includes('-a') || args.includes('--all'))
      outText('Linux raspberrypi 6.6.31-v8-16k+ #1 SMP PREEMPT Debian 1:6.6.31-1+rpt1 (2026-05-30) aarch64 GNU/Linux');
    else if (args.includes('-r')) outText('6.6.31-v8-16k+');
    else if (args.includes('-m')) outText('aarch64');
    else outText('Linux');
  };
  COMMANDS.date = () => {
    const d = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const p = (n) => String(n).padStart(2, '0');
    outText(`${days[d.getDay()]} ${p(d.getDate())} ${mons[d.getMonth()]} ${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} BST`);
  };
  COMMANDS.history = () => {
    if (!history.length) { out('<span class="pt-muted">(no history yet — start typing commands!)</span>'); return; }
    history.forEach((h, i) => outText(`${String(i + 1).padStart(4)}  ${h}`));
  };

  // ---- tree
  COMMANDS.tree = () => {
    const root = cwdNode();
    if (!root || root.type !== 'dir') { out('<span class="pt-err">tree: not a directory</span>'); return; }
    outText('.');
    let dirs = 0, files = 0;
    const walk = (node, prefix) => {
      const keys = Object.keys(node.children).filter((k) => !k.startsWith('.')).sort((a, b) => a.localeCompare(b));
      keys.forEach((k, i) => {
        const last = i === keys.length - 1;
        const child = node.children[k];
        const branch = last ? '└── ' : '├── ';
        const isDir = child.type === 'dir';
        if (isDir) dirs++; else files++;
        const cls = isDir ? 'pt-dir' : (k.endsWith('.py') ? 'pt-exe' : '');
        out(`<span class="pt-muted">${esc(prefix + branch)}</span>` + (cls ? `<span class="${cls}">${esc(k)}</span>` : esc(k)));
        if (isDir) walk(child, prefix + (last ? '    ' : '│   '));
      });
    };
    walk(root, '');
    blank();
    outText(`${dirs} director${dirs === 1 ? 'y' : 'ies'}, ${files} file${files === 1 ? '' : 's'}`);
  };

  // ---- apt (canned, changes nothing)
  COMMANDS.sudo = (args) => {
    if (!args.length) { out('<span class="pt-muted">usage: sudo &lt;command&gt;   — runs a command as administrator (root).</span>'); return; }
    // easter egg
    if (args[0] === 'make-coffee' || (args[0] === 'make' && args[1] === 'coffee')) { coffee(); return; }
    const sub = args[0];
    if (sub === 'apt' || sub === 'apt-get') { return aptRun(args.slice(1)); }
    if (sub === 'nano') {
      out(`<span class="pt-muted">nano is an interactive editor — it can't run inside this sandbox.</span>`);
      out(`<span class="pt-muted">On a real Pi: edit, then press Ctrl+O Enter to save and Ctrl+X to exit.</span>`);
      return;
    }
    if (sub === 'reboot' || sub === 'shutdown') { out('<span class="pt-warn">Nice try! Rebooting is disabled in the sandbox. 🙂</span>'); return; }
    // run the inner command normally (with root vibes)
    const inner = COMMANDS[sub];
    if (inner) { inner(args.slice(1), args.slice(1).join(' ')); return; }
    out(`<span class="pt-muted">sudo: ran '<span class="pt-accent">${esc(args.join(' '))}</span>' as root (sandbox — no real changes made).</span>`);
  };
  COMMANDS.apt = (args) => aptRun(args);
  COMMANDS['apt-get'] = (args) => aptRun(args);

  function aptRun(args) {
    const action = args[0];
    if (action === 'update') {
      ['Hit:1 http://deb.debian.org/debian bookworm InRelease',
        'Hit:2 http://deb.debian.org/debian-security bookworm-security InRelease',
        'Hit:3 http://archive.raspberrypi.com/debian bookworm InRelease',
        'Reading package lists... Done',
        'Building dependency tree... Done',
        'All packages are up to date.'].forEach((l) => outText(l));
      return;
    }
    if (action === 'upgrade' || action === 'full-upgrade' || action === 'dist-upgrade') {
      ['Reading package lists... Done',
        'Building dependency tree... Done',
        'Reading state information... Done',
        'Calculating upgrade... Done',
        '0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.'].forEach((l) => outText(l));
      return;
    }
    if (action === 'install') {
      const pkgs = args.slice(1).filter((a) => !a.startsWith('-'));
      const pkg = pkgs.join(' ') || 'a-package';
      ['Reading package lists... Done',
        'Building dependency tree... Done',
        'Reading state information... Done',
        `The following NEW packages will be installed:`,
        `  ${pkgs.join(' ') || pkg}`,
        `0 upgraded, ${pkgs.length || 1} newly installed, 0 to remove and 0 not upgraded.`,
        `Get:1 http://archive.raspberrypi.com/debian bookworm/main arm64 ${pkgs[0] || pkg} [1,234 kB]`,
        `Fetched 1,234 kB in 1s (1,180 kB/s)`,
        `Selecting previously unselected package ${pkgs[0] || pkg}.`,
        `Unpacking ${pkgs[0] || pkg} ...`,
        `Setting up ${pkgs[0] || pkg} ...`,
        `Processing triggers for man-db (2.11.2-2) ...`].forEach((l) => outText(l));
      out('<span class="pt-warn">(sandbox: nothing was really installed — but that’s exactly what it looks like!)</span>');
      return;
    }
    if (action === 'remove' || action === 'autoremove' || action === 'purge') {
      outText('Reading package lists... Done');
      outText('0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.');
      return;
    }
    out('<span class="pt-muted">apt commands the book teaches: <span class="pt-accent">sudo apt update</span>, <span class="pt-accent">sudo apt full-upgrade</span>, <span class="pt-accent">sudo apt install &lt;pkg&gt;</span></span>');
  }

  // ---- easter egg
  function coffee() {
    const cup = [
      '        (  )   (   )  )',
      '         ) (   )  (  (',
      '         ( )  (    ) )',
      '         _____________',
      '        <_____________> ___',
      '        |             |/ _ \\',
      '        |               | | |',
      '        |               |_| |',
      '     ___|             |\\___/',
      '    /    \\___________/    \\',
      '    \\_____________________/',
    ];
    cup.forEach((l) => out(`<span class="pt-accent">${esc(l)}</span>`));
    out('<span class="pt-ok">☕ brewing… your coffee is ready! (the Pi cannot actually make coffee — yet.)</span>');
  }

  // ---- content-aware: man → glossary
  COMMANDS.man = async (args) => {
    const term = args.filter((a) => !a.startsWith('-')).join(' ').trim();
    if (!term) { out('<span class="pt-err">What manual page do you want? Try: man ls</span>'); return; }
    let gloss;
    try { gloss = await loadGlossary(); } catch { out('<span class="pt-err">man: could not load the manual right now.</span>'); return; }
    const lc = term.toLowerCase();
    let hit = gloss.find((g) => g.term.toLowerCase() === lc);
    if (!hit) hit = gloss.find((g) => g.term.toLowerCase().replace(/[^a-z0-9]/g, '') === lc.replace(/[^a-z0-9]/g, ''));
    if (!hit) hit = gloss.find((g) => g.term.toLowerCase().includes(lc));
    if (!hit) {
      out(`<span class="pt-err">No manual entry for ${esc(term)}</span>`);
      out('<span class="pt-muted">Tip: `man` here reads the book’s plain-English glossary. Try a term like `man apt` or `man sudo`.</span>');
      return;
    }
    out(`<span class="pt-ok">${esc(hit.term.toUpperCase())}(1)</span>` +
      `<span class="pt-muted">  —  Raspberry Pi Academy glossary</span>`);
    blank();
    out('<span class="pt-accent">DESCRIPTION</span>');
    const def = stripTags(hit.def);
    // wrap to ~76 cols with a 4-space indent
    wrap(def, 72).forEach((l) => outText('    ' + l));
    blank();
    navLine('→ open the full glossary', '#/glossary', '(the whole A–Z, beautifully formatted)');
  };

  function wrap(text, width) {
    const words = text.split(/\s+/); const lines = []; let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > width) { if (cur) lines.push(cur); cur = w; }
      else cur = (cur ? cur + ' ' : '') + w;
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  // ---- content-aware: find → search
  COMMANDS.find = async (args) => {
    const word = args.filter((a) => !a.startsWith('-') && a !== '.' && a !== '~').join(' ').trim();
    if (!word) { out('<span class="pt-muted">Usage: find &lt;word&gt;  — searches every page of the book.</span>'); return; }
    out(`<span class="pt-muted">Searching the book for “${esc(word)}”…</span>`);
    let hits;
    try { hits = await query(word); } catch { out('<span class="pt-err">find: search index could not be loaded.</span>'); return; }
    if (!hits || !hits.length) {
      out(`<span class="pt-err">No results for “${esc(word)}”.</span>`);
      out('<span class="pt-muted">Try a simpler keyword, or type `lessons` to browse every chapter.</span>');
      return;
    }
    const top = hits.slice(0, 8);
    out(`<span class="pt-ok">${hits.length} result${hits.length === 1 ? '' : 's'}</span>` +
      `<span class="pt-muted"> — showing top ${top.length}, click any line to jump there:</span>`);
    blank();
    for (const h of top) {
      const hash = idToHash(h.id);
      const tag = h.kind && h.kind !== 'chapter' ? `[${h.kind}] ` : (h.n ? `${String(h.n).padStart(2)}. ` : '');
      const where = h.where ? `  ›  ${stripTags(h.where)}` : '';
      navLine(`${tag}${stripTags(h.title)}${where}`, hash);
      if (h.snippet) {
        const snip = wrap(stripTags(h.snippet), 80)[0];
        const wrapEl = el('div', { class: 'pt-line pt-muted', text: '      ' + snip });
        screen.insertBefore(wrapEl, inputLine);
      }
    }
  };

  const idToHash = routeFor;

  // ---- content-aware: lessons → chapter list
  COMMANDS.lessons = () => {
    const m = manifest();
    const o = (typeof order === 'function' ? order() : []) || [];
    if (!m || !o.length) { out('<span class="pt-err">lessons: the book index isn’t loaded yet.</span>'); return; }
    out('<span class="pt-ok">The Raspberry Pi 5 Course</span><span class="pt-muted"> — click any lesson to open it:</span>');
    blank();
    o.forEach((id) => {
      const ch = getChapter(id);
      if (!ch) return;
      const num = ch.kind === 'chapter' ? `${String(ch.n).padStart(2)}.` : '  •';
      const tag = ch.kind && ch.kind !== 'chapter' ? ` [${ch.kind}]` : '';
      navLine(`${num} ${ch.title}${tag}`, idToHash(id), ch.read_min ? `${ch.read_min} min` : '');
    });
  };

  // ---- help
  COMMANDS.help = () => {
    const groups = [
      ['Looking around', [
        ['pwd', 'print the folder you are in'],
        ['ls [-l -a -la -lah]', 'list files (long / all / human sizes)'],
        ['cd <dir>', 'change folder ( .. = up, ~ = home, - = back)'],
        ['tree', 'draw the folder tree below you'],
      ]],
      ['Files & folders', [
        ['mkdir <name>', 'make a new folder ( -p for nested )'],
        ['touch <file>', 'create an empty file'],
        ['cat <file>', 'print a file to the screen'],
        ['less <file>', 'view a long file'],
        ['echo <text>', 'print text ( > or >> writes to a file )'],
        ['rm <file>', 'delete (safe here — real Pi has no undo!)'],
      ]],
      ['The system', [
        ['whoami / hostname', 'who and where you are'],
        ['uname -a', 'kernel & architecture'],
        ['date / history', 'time, and what you have typed'],
        ['clear', 'wipe the screen ( Ctrl+L )'],
        ['sudo apt update', 'refresh the software list (canned)'],
        ['sudo apt install <pkg>', 'install software (canned)'],
      ]],
      ['Book superpowers ✨', [
        ['man <term>', 'plain-English glossary definition'],
        ['find <word>', 'search every page — click a result to jump'],
        ['lessons', 'list every chapter as clickable links'],
      ]],
    ];
    out('<span class="pt-ok">Pi Terminal Sandbox</span> <span class="pt-muted">— a real Raspberry Pi OS shell, simulated in your browser.</span>');
    blank();
    for (const [title, rows] of groups) {
      out(`<span class="pt-accent">${esc(title)}</span>`);
      for (const [cmd, desc] of rows) {
        out(`  <span class="pt-exe">${esc(cmd.padEnd(24))}</span><span class="pt-muted">${esc(desc)}</span>`);
      }
      blank();
    }
    out('<span class="pt-muted">Bonus: Tab completes commands & filenames, ↑/↓ walks history, and `sudo make-coffee` … well, try it. ☕</span>');
  };
  COMMANDS['--help'] = COMMANDS.help;

  /* Toggle the pending/busy state. While busy, Enter is ignored (see keydown
     handler) so async output can't race ahead of a freshly-typed prompt. */
  function setBusy(on) {
    busy = on;
    container.classList.toggle('is-busy', on);
    input.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  /* ──────────────────────── run a single line ──────────────────────── */
  async function runLine(raw) {
    // Guard against re-entrancy while an async command is still pending.
    if (busy) return;
    const trimmed = raw.replace(/\s+$/, '');
    echoCommand(raw);
    const cmdText = trimmed.trim();
    if (cmdText) { history.push(cmdText); }
    histIdx = history.length;
    draft = '';

    if (cmdText) {
      const toks = tokenize(cmdText);
      let name = toks[0];
      let args = toks.slice(1);
      // allow "apt install" without sudo, and bare "make-coffee"
      if (name === 'make-coffee') { coffee(); }
      else if (name === 'cls') { cmdClear(); }
      else if (name === 'clear') { cmdClear(); }
      else if (COMMANDS[name]) {
        try {
          const after = cmdText.slice(name.length).trim();
          const r = COMMANDS[name](args, after);
          if (r && typeof r.then === 'function') {
            // Async command (man/find/…): mark busy until it settles so the
            // prompt can't be reused mid-flight and output can't interleave.
            setBusy(true);
            try { await r; }
            finally { setBusy(false); }
          }
        } catch (err) {
          out('<span class="pt-err">Hmm, something went sideways in the sandbox. Type `help` to see what works.</span>');
        }
      } else {
        unknown(name);
      }
    }
    refreshPrompt();
    // move input line to the end & scroll
    screen.append(inputLine);
    scrollDown();
  }

  function unknown(name) {
    out(`<span class="pt-warn">${esc(name)}</span><span class="pt-muted">: command not found in this sandbox.</span>`);
    // gentle suggestion if it's close to a known command
    const known = Object.keys(COMMANDS).filter((k) => !k.startsWith('--'));
    const near = known.find((k) => k.startsWith(name) || name.startsWith(k) || lev(k, name) <= 1);
    if (near) out(`<span class="pt-muted">Did you mean <span class="pt-exe">${esc(near)}</span>?  Type <span class="pt-exe">help</span> for the full list.</span>`);
    else out('<span class="pt-muted">Type <span class="pt-exe">help</span> to see everything this terminal can do.</span>');
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9;
    const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }

  /* ──────────────────────── TAB completion ──────────────────────── */
  function complete() {
    const value = input.value;
    const caret = input.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const toks = before.split(/(\s+)/); // keep separators
    // figure out the current word
    const m = before.match(/(\S*)$/);
    const word = m ? m[1] : '';
    const isFirstWord = before.trimStart() === word; // no space before it

    let candidates;
    if (isFirstWord) {
      candidates = Object.keys(COMMANDS).filter((k) => !k.startsWith('--') && k.startsWith(word));
      candidates.push(...['make-coffee'].filter((k) => k.startsWith(word) && !candidates.includes(k)));
    } else {
      // filename completion in the relevant directory
      const slash = word.lastIndexOf('/');
      const dirPart = slash >= 0 ? word.slice(0, slash + 1) : '';
      const frag = slash >= 0 ? word.slice(slash + 1) : word;
      const baseSegs = dirPart ? resolveSegs(dirPart) : cwd;
      const node = nodeAt(baseSegs);
      if (!node || node.type !== 'dir') return;
      candidates = Object.keys(node.children)
        .filter((n) => n.startsWith(frag))
        .map((n) => dirPart + n + (node.children[n].type === 'dir' ? '/' : ''));
      // re-frame candidates so common-prefix logic compares full words
    }
    if (!candidates.length) return;

    if (candidates.length === 1) {
      let comp = candidates[0];
      if (isFirstWord && !comp.endsWith('/')) comp += ' ';
      replaceWord(before, word, comp, value.slice(caret));
    } else {
      const cp = commonPrefix(candidates);
      if (cp.length > word.length) {
        replaceWord(before, word, cp, value.slice(caret));
      } else {
        // show options
        out(promptHTMLInlineEcho());
        out(candidates.map((c) => `<span class="pt-${c.endsWith('/') ? 'dir' : 'exe'}">${esc(c.replace(/\/$/, isFirstWord ? '' : '/'))}</span>`).join('   '));
        scrollDown();
      }
    }
  }
  function promptHTMLInlineEcho() {
    return promptHTML() + esc(input.value);
  }
  function replaceWord(before, word, completion, after) {
    const newBefore = before.slice(0, before.length - word.length) + completion;
    input.value = newBefore + after;
    const pos = newBefore.length;
    input.setSelectionRange(pos, pos);
    syncCursor();
  }
  function commonPrefix(arr) {
    if (!arr.length) return '';
    let p = arr[0];
    for (const s of arr) { while (!s.startsWith(p)) p = p.slice(0, -1); }
    return p;
  }

  /* ──────────────────────── events ──────────────────────── */
  input.addEventListener('keydown', (e) => {
    // While an async command is pending, swallow Enter / Tab / history keys so
    // nothing races the prompt. Allow plain typing & navigation to feel alive.
    if (busy && (e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (busy) return;
      const raw = input.value;
      input.value = '';
      syncCursor();
      runLine(raw);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      if (histIdx === history.length) draft = input.value;
      histIdx = Math.max(0, histIdx - 1);
      input.value = history[histIdx] ?? '';
      requestAnimationFrame(() => { const p = input.value.length; input.setSelectionRange(p, p); syncCursor(); });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!history.length) return;
      histIdx = Math.min(history.length, histIdx + 1);
      input.value = histIdx === history.length ? draft : (history[histIdx] ?? '');
      requestAnimationFrame(() => { const p = input.value.length; input.setSelectionRange(p, p); syncCursor(); });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      cmdClear(); screen.append(inputLine); scrollDown();
    } else if (e.key === 'c' && e.ctrlKey && (input.selectionStart === input.selectionEnd)) {
      // Ctrl+C with no selection → cancel current line (Bash-style ^C)
      e.preventDefault();
      const raw = input.value;
      echoCommand(raw + '^C');
      input.value = ''; histIdx = history.length; draft = '';
      screen.append(inputLine); syncCursor(); scrollDown();
    }
  });
  input.addEventListener('input', syncCursor);
  input.addEventListener('keyup', syncCursor);
  input.addEventListener('click', syncCursor);

  // On focus (esp. mobile, where the soft keyboard reflows the page), keep the
  // prompt in view: scroll the scrollback to the bottom and the input into view.
  input.addEventListener('focus', () => {
    syncCursor();
    scrollDown();
    // Defer past the keyboard animation / layout settle, then nudge into view.
    setTimeout(() => {
      scrollDown();
      if (typeof input.scrollIntoView === 'function') {
        input.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }, 250);
  });

  // click anywhere on the screen → focus input (unless selecting text or clicking a link)
  screen.addEventListener('mousedown', (e) => {
    if (e.target.closest('a')) return;          // let links work
    const sel = window.getSelection();
    if (sel && sel.toString().length) return;    // user is selecting text
    // defer so caret isn't stolen mid-selection
    setTimeout(focusInput, 0);
  });
  container.addEventListener('click', (e) => {
    if (e.target.closest('a') || e.target.closest('.pt-btn')) return;
    if (e.target === input) return;
  });

  /* ──────────────────────── boot the terminal ──────────────────────── */
  refreshPrompt();
  screen.append(inputLine);

  // welcome banner
  out('<span class="pt-ok">Linux raspberrypi 6.6.31-v8-16k+ aarch64</span>');
  out('<span class="pt-muted">Raspberry Pi OS (Bookworm) — simulated shell. Last login: today on tty1</span>');
  blank();
  out('<span class="pt-muted">This is a real working shell, faked entirely in your browser — yes, on a static page. \u{1F92F}</span>');
  out('<span class="pt-muted">Type <span class="pt-exe">help</span> to begin, <span class="pt-exe">lessons</span> to open the book, or just poke around with <span class="pt-exe">ls</span> and <span class="pt-exe">cd</span>.</span>');
  blank();
  screen.append(inputLine);
  scrollDown();

  // initial command
  if (typeof ctx.initialCommand === 'string' && ctx.initialCommand.trim()) {
    runLine(ctx.initialCommand.trim());
  }

  // focus shortly after mount (don't steal focus on the very first paint if overlay)
  const bootTimer = setTimeout(() => { if (!ctx.compact) focusInput(); else syncCursor(); }, 60);

  /* ──────────────────────── teardown ──────────────────────── */
  // The terminal adds no document/window listeners (all are scoped to elements
  // inside `container`, which the app removes on teardown), but it does schedule
  // timers. Clear any that may still be pending so nothing fires after unmount.
  function cleanup() {
    clearTimeout(bootTimer);
    setBusy(false);
  }

  // Return a cleanup function (new contract). Keep the legacy { destroy } shape
  // accessible too, in case any caller still reaches for it.
  cleanup.destroy = cleanup;
  return cleanup;
}
