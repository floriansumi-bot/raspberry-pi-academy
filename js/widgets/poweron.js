/* poweron.js — Project Power-On Preview card widget */
import { el } from '../ui.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Per-chapter metadata */
const META = {
  ch13: { title: 'Media Centre', difficulty: 'Easy', time: '~30 min', needs: 'A USB drive or network share' },
  ch14: { title: 'Retro Gaming', difficulty: 'Easy', time: '~45 min', needs: 'A USB gamepad / controller' },
  ch15: { title: 'Pi-hole Ad Blocker', difficulty: 'Medium', time: 'An afternoon', needs: 'A spare SD card' },
  ch16: { title: 'Home Server', difficulty: 'Medium', time: 'An afternoon', needs: 'A USB hard drive' },
  ch17: { title: 'Home Assistant', difficulty: 'Medium', time: 'An afternoon', needs: 'Smart plugs or bulbs' },
  ch18: { title: 'Docker', difficulty: 'Medium', time: '~1 hour', needs: 'A Pi 4 or later (2 GB+ RAM)' },
  ch19: { title: 'Local AI', difficulty: 'Hard', time: 'An afternoon', needs: 'A Pi 5 (4 GB+ RAM)' },
};

/* ─── animated screen mocks ─────────────────────────────────────────── */

function mockCh13(screen) {
  screen.innerHTML = `
    <div class="po-label">Now Playing</div>
    <div class="po-np">
      <div class="po-thumb po-thumb--playing"><div class="po-play-icon">▶</div></div>
      <div class="po-np-info">
        <div class="po-np-title">Big Buck Bunny</div>
        <div class="po-np-sub">2024 · 1080p · MKV</div>
        <div class="po-np-bar"><div class="po-np-fill"></div></div>
      </div>
    </div>
    <div class="po-label po-label--mt">Library</div>
    <div class="po-grid">
      <div class="po-tile po-tile--active"><div class="po-tile-icon">🎬</div><div class="po-tile-name">Movies</div><div class="po-tile-count">42 items</div></div>
      <div class="po-tile"><div class="po-tile-icon">📺</div><div class="po-tile-name">TV Shows</div><div class="po-tile-count">18 items</div></div>
      <div class="po-tile"><div class="po-tile-icon">🎵</div><div class="po-tile-name">Music</div><div class="po-tile-count">231 items</div></div>
      <div class="po-tile"><div class="po-tile-icon">📷</div><div class="po-tile-name">Photos</div><div class="po-tile-count">1.2k items</div></div>
    </div>`;

  if (!REDUCED) {
    const fill = screen.querySelector('.po-np-fill');
    let pct = 34;
    const iv = setInterval(() => {
      pct = pct >= 95 ? 5 : pct + 0.4;
      fill.style.width = pct + '%';
    }, 80);
    screen._cleanup = () => clearInterval(iv);
  } else {
    screen.querySelector('.po-np-fill').style.width = '34%';
  }
}

function mockCh14(screen) {
  const games = [
    { icon: '🚀', title: 'Super Mario World', sys: 'SNES' },
    { icon: '🎮', title: 'Sonic the Hedgehog', sys: 'Mega Drive' },
    { icon: '⚔️', title: 'The Legend of Zelda', sys: 'NES' },
    { icon: '🏎️', title: 'Mario Kart 64', sys: 'N64' },
    { icon: '👾', title: 'Street Fighter II', sys: 'Arcade' },
  ];
  let sel = 1;

  function render() {
    screen.innerHTML = `
      <div class="po-label">Select Game</div>
      <div class="po-carousel">
        ${games.map((g, i) => `
          <div class="po-game-card ${i === sel ? 'po-game-card--sel' : ''}">
            <div class="po-game-icon">${g.icon}</div>
            <div class="po-game-title">${g.title}</div>
            <div class="po-game-sys">${g.sys}</div>
          </div>`).join('')}
      </div>
      <div class="po-launch-hint">${REDUCED ? '' : 'Press ▶ to launch'}</div>`;
  }

  render();

  if (!REDUCED) {
    const iv = setInterval(() => {
      sel = (sel + 1) % games.length;
      render();
    }, 1800);
    screen._cleanup = () => clearInterval(iv);
  }
}

function mockCh15(screen) {
  screen.innerHTML = `
    <div class="po-pihole-header">
      <span class="po-pihole-dot"></span>
      <span class="po-pihole-title">Pi-hole</span>
      <span class="po-pihole-status">Active</span>
    </div>
    <div class="po-pihole-stat">
      <div class="po-pihole-num" id="po-blocked-count">0</div>
      <div class="po-pihole-desc">Ads blocked today</div>
    </div>
    <div class="po-pihole-pct-row">
      <span class="po-pihole-pct-label">Block rate</span>
      <span class="po-pihole-pct-val">22.4%</span>
    </div>
    <div class="po-pihole-bars">
      <div class="po-bar-row"><span class="po-bar-label">00:00</span><div class="po-bar-track"><div class="po-bar-fill" style="width:20%"></div></div></div>
      <div class="po-bar-row"><span class="po-bar-label">04:00</span><div class="po-bar-track"><div class="po-bar-fill" style="width:8%"></div></div></div>
      <div class="po-bar-row"><span class="po-bar-label">08:00</span><div class="po-bar-track"><div class="po-bar-fill" style="width:55%"></div></div></div>
      <div class="po-bar-row"><span class="po-bar-label">12:00</span><div class="po-bar-track"><div class="po-bar-fill" style="width:72%"></div></div></div>
      <div class="po-bar-row"><span class="po-bar-label">16:00</span><div class="po-bar-track"><div class="po-bar-fill" style="width:88%"></div></div></div>
      <div class="po-bar-row"><span class="po-bar-label">20:00</span><div class="po-bar-track"><div class="po-bar-fill" style="width:46%"></div></div></div>
    </div>`;

  const target = 14387;
  const numEl = screen.querySelector('#po-blocked-count');

  if (!REDUCED) {
    let cur = 0;
    const step = Math.ceil(target / 60);
    const iv = setInterval(() => {
      cur = Math.min(cur + step, target);
      numEl.textContent = cur.toLocaleString();
      if (cur >= target) clearInterval(iv);
    }, 40);
    screen._cleanup = () => clearInterval(iv);

    /* animate bars in */
    const fills = screen.querySelectorAll('.po-bar-fill');
    const targets = [20, 8, 55, 72, 88, 46];
    fills.forEach((f, i) => {
      f.style.width = '0%';
      setTimeout(() => { f.style.transition = 'width 0.8s ease'; f.style.width = targets[i] + '%'; }, 100 + i * 120);
    });
  } else {
    numEl.textContent = target.toLocaleString();
  }
}

function mockCh16(screen) {
  const files = [
    { icon: '📁', name: 'Documents', size: '12.4 GB', type: 'folder' },
    { icon: '🎬', name: 'Videos', size: '220 GB', type: 'folder' },
    { icon: '🎵', name: 'Music', size: '8.1 GB', type: 'folder' },
    { icon: '💾', name: 'Backups', size: '45.2 GB', type: 'folder' },
    { icon: '📄', name: 'README.txt', size: '2 KB', type: 'file' },
  ];

  screen.innerHTML = `
    <div class="po-label">Home Server — /mnt/data</div>
    <div class="po-file-list">
      ${files.map(f => `
        <div class="po-file-row">
          <span class="po-file-icon">${f.icon}</span>
          <span class="po-file-name">${f.name}</span>
          <span class="po-file-size">${f.size}</span>
        </div>`).join('')}
    </div>
    <div class="po-storage-section">
      <div class="po-storage-row">
        <span class="po-storage-label">Storage used</span>
        <span class="po-storage-val">285.7 GB / 1 TB</span>
      </div>
      <div class="po-storage-track"><div class="po-storage-fill" id="po-sfill"></div></div>
    </div>`;

  const fill = screen.querySelector('#po-sfill');
  if (!REDUCED) {
    fill.style.width = '0%';
    setTimeout(() => { fill.style.transition = 'width 1s ease'; fill.style.width = '28.6%'; }, 150);
  } else {
    fill.style.width = '28.6%';
  }
}

function mockCh17(screen) {
  const devices = [
    { icon: '💡', label: 'Living Room Light', on: true },
    { icon: '🔌', label: 'Coffee Maker', on: true },
    { icon: '💡', label: 'Bedroom Light', on: false },
    { icon: '🌡️', label: 'Thermostat', on: true, val: '21°C' },
    { icon: '🔌', label: 'TV Standby', on: false },
  ];

  function render(states) {
    screen.innerHTML = `
      <div class="po-label">Home Assistant</div>
      <div class="po-ha-list">
        ${states.map((d, i) => `
          <div class="po-ha-row" data-idx="${i}">
            <span class="po-ha-icon ${d.on ? 'po-ha-icon--on' : ''}">${d.icon}</span>
            <span class="po-ha-name">${d.label}</span>
            ${d.val ? `<span class="po-ha-val">${d.val}</span>` : ''}
            <button class="po-ha-toggle ${d.on ? 'po-ha-toggle--on' : ''}" aria-label="Toggle ${d.label}" data-idx="${i}">
              <span class="po-ha-knob"></span>
            </button>
          </div>`).join('')}
      </div>`;

    screen.querySelectorAll('.po-ha-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.dataset.idx;
        states[idx].on = !states[idx].on;
        render(states);
      });
    });
  }

  const states = devices.map(d => ({ ...d }));
  render(states);

  if (!REDUCED) {
    const seq = [2, 4, 0];
    let si = 0;
    const iv = setInterval(() => {
      if (si >= seq.length) { clearInterval(iv); return; }
      states[seq[si]].on = !states[seq[si]].on;
      render(states);
      si++;
    }, 1200);
    screen._cleanup = () => clearInterval(iv);
  }
}

function mockCh18(screen) {
  const containers = [
    { name: 'nginx', image: 'nginx:alpine', port: '80→80', up: true },
    { name: 'portainer', image: 'portainer/portainer-ce', port: '9000→9000', up: true },
    { name: 'pihole', image: 'pihole/pihole', port: '53→53', up: true },
    { name: 'nextcloud', image: 'nextcloud:latest', port: '8080→80', up: false },
    { name: 'homeassistant', image: 'homeassistant/raspberrypi', port: '8123→8123', up: true },
  ];

  screen.innerHTML = `
    <div class="po-label">Docker — Containers</div>
    <div class="po-docker-list">
      ${containers.map(c => `
        <div class="po-docker-row">
          <span class="po-docker-dot ${c.up ? 'po-docker-dot--up' : 'po-docker-dot--down'}" ${c.up && !REDUCED ? 'data-pulse="1"' : ''}></span>
          <span class="po-docker-name">${c.name}</span>
          <span class="po-docker-image">${c.image}</span>
          <span class="po-docker-port">${c.port}</span>
          <span class="po-docker-status ${c.up ? 'po-docker-status--up' : ''}">${c.up ? 'running' : 'exited'}</span>
        </div>`).join('')}
    </div>
    <div class="po-docker-footer">
      <span class="po-docker-summary">4 running · 1 stopped</span>
    </div>`;
}

function mockCh19(screen) {
  const exchanges = [
    { role: 'user', text: 'Explain what a neural network is.' },
    { role: 'ai', text: 'A neural network is a system inspired by the human brain, made of layers of connected nodes that learn patterns from data — without being explicitly programmed.' },
  ];

  let msgIdx = 0;
  let charIdx = 0;
  let phase = 'typing'; // typing | pause | reset

  screen.innerHTML = `
    <div class="po-label">Local AI — Ollama (llama3.2)</div>
    <div class="po-chat" id="po-chat-area"></div>
    <div class="po-chat-input-row">
      <div class="po-chat-input">Ask me anything…</div>
      <button class="po-chat-send" aria-label="Send">▶</button>
    </div>`;

  const chatArea = screen.querySelector('#po-chat-area');

  function renderMessages(msgs, partial = '') {
    chatArea.innerHTML = msgs.map(m => `
      <div class="po-chat-bubble po-chat-bubble--${m.role}">
        ${m.role === 'ai' ? '<span class="po-chat-ai-tag">AI</span>' : ''}
        ${m.text}
      </div>`).join('') + (partial !== '' ? `
      <div class="po-chat-bubble po-chat-bubble--ai po-chat-bubble--typing">
        <span class="po-chat-ai-tag">AI</span>${partial}<span class="po-cursor">▌</span>
      </div>` : '');
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  if (REDUCED) {
    renderMessages(exchanges);
    return;
  }

  renderMessages([exchanges[0]]);

  const iv = setInterval(() => {
    if (phase === 'typing') {
      charIdx++;
      const partial = exchanges[1].text.slice(0, charIdx);
      renderMessages([exchanges[0]], partial);
      if (charIdx >= exchanges[1].text.length) {
        phase = 'pause';
        charIdx = 0;
      }
    } else if (phase === 'pause') {
      charIdx++;
      if (charIdx > 30) {
        phase = 'reset';
        charIdx = 0;
      }
    } else {
      renderMessages([exchanges[0]]);
      charIdx = 0;
      phase = 'typing';
    }
  }, 35);

  screen._cleanup = () => clearInterval(iv);
}

const MOCKS = { ch13: mockCh13, ch14: mockCh14, ch15: mockCh15, ch16: mockCh16, ch17: mockCh17, ch18: mockCh18, ch19: mockCh19 };

/* ─── CSS ────────────────────────────────────────────────────────────── */

const CSS = `
.w-poweron {
  font-family: var(--font-body, Inter, sans-serif);
}
.w-poweron .po-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.w-poweron .po-heading {
  font-family: var(--font-display, serif);
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink);
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 8px;
}
.w-poweron .po-heading-icon {
  color: var(--accent);
  flex-shrink: 0;
}
.w-poweron .po-screen {
  background: var(--code-bg, #0d1117);
  color: var(--code-ink, #e6edf3);
  font-family: var(--font-mono, monospace);
  font-size: 0.72rem;
  min-height: 200px;
  padding: 12px 14px;
  overflow: hidden;
  position: relative;
}
/* ── meta strip ── */
.w-poweron .po-meta {
  display: flex;
  gap: 0;
  border-top: 1px solid var(--line);
}
.w-poweron .po-meta-item {
  flex: 1;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-right: 1px solid var(--line);
}
.w-poweron .po-meta-item:last-child { border-right: none; }
.w-poweron .po-meta-key {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-soft);
  font-family: var(--font-body);
}
.w-poweron .po-meta-val {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink);
  font-family: var(--font-body);
}
.w-poweron .po-meta-val--easy   { color: var(--success); }
.w-poweron .po-meta-val--medium { color: var(--warm); }
.w-poweron .po-meta-val--hard   { color: var(--danger); }
/* ── shared screen helpers ── */
.w-poweron .po-label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent2, #06b6d4);
  margin-bottom: 6px;
}
.w-poweron .po-label--mt { margin-top: 10px; }

/* ── ch13 media centre ── */
.w-poweron .po-np {
  display: flex;
  gap: 10px;
  align-items: center;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 4px;
}
.w-poweron .po-thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background: linear-gradient(135deg, #1a3a5c, #2d6a9f);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.w-poweron .po-thumb--playing {
  animation: ${REDUCED ? 'none' : 'po-pulse 2s ease-in-out infinite'};
}
@keyframes po-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(6,182,212,0.4); }
  50% { box-shadow: 0 0 0 6px rgba(6,182,212,0); }
}
.w-poweron .po-play-icon { color: #fff; font-size: 1rem; }
.w-poweron .po-np-info { flex: 1; min-width: 0; }
.w-poweron .po-np-title { font-weight: 600; font-size: 0.78rem; margin-bottom: 2px; }
.w-poweron .po-np-sub { color: #8b949e; font-size: 0.65rem; margin-bottom: 5px; }
.w-poweron .po-np-bar {
  height: 3px;
  background: rgba(255,255,255,0.12);
  border-radius: 2px;
  overflow: hidden;
}
.w-poweron .po-np-fill {
  height: 100%;
  width: 34%;
  background: var(--accent2, #06b6d4);
  border-radius: 2px;
  transition: width 0.3s linear;
}
.w-poweron .po-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.w-poweron .po-tile {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 5px;
  padding: 7px 8px;
}
.w-poweron .po-tile--active {
  border-color: var(--accent2, #06b6d4);
  background: rgba(6,182,212,0.08);
}
.w-poweron .po-tile-icon { font-size: 1rem; }
.w-poweron .po-tile-name { font-size: 0.7rem; font-weight: 600; margin-top: 2px; }
.w-poweron .po-tile-count { font-size: 0.6rem; color: #8b949e; }

/* ── ch14 retro gaming ── */
.w-poweron .po-carousel {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 4px;
  margin-bottom: 6px;
}
.w-poweron .po-carousel::-webkit-scrollbar { display: none; }
.w-poweron .po-game-card {
  flex-shrink: 0;
  width: 70px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 6px;
  padding: 8px 6px;
  text-align: center;
  transition: border-color 0.3s, transform 0.3s;
}
.w-poweron .po-game-card--sel {
  border-color: var(--accent, #C7152A);
  background: rgba(199,21,42,0.12);
  transform: translateY(-2px);
}
.w-poweron .po-game-icon { font-size: 1.4rem; }
.w-poweron .po-game-title { font-size: 0.56rem; font-weight: 600; margin-top: 4px; line-height: 1.2; }
.w-poweron .po-game-sys { font-size: 0.55rem; color: #8b949e; margin-top: 2px; }
.w-poweron .po-launch-hint { font-size: 0.62rem; color: var(--accent, #C7152A); text-align: center; }

/* ── ch15 pi-hole ── */
.w-poweron .po-pihole-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.w-poweron .po-pihole-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--success, #2ea043);
  animation: ${REDUCED ? 'none' : 'po-blink 2s ease-in-out infinite'};
}
@keyframes po-blink {
  0%,100% { opacity: 1; } 50% { opacity: 0.4; }
}
.w-poweron .po-pihole-title { font-size: 0.8rem; font-weight: 700; }
.w-poweron .po-pihole-status {
  margin-left: auto;
  font-size: 0.6rem;
  color: var(--success, #2ea043);
  border: 1px solid var(--success, #2ea043);
  border-radius: 20px;
  padding: 1px 7px;
}
.w-poweron .po-pihole-stat { text-align: center; margin-bottom: 8px; }
.w-poweron .po-pihole-num {
  font-family: var(--font-mono, monospace);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent2, #06b6d4);
  line-height: 1;
}
.w-poweron .po-pihole-desc { font-size: 0.62rem; color: #8b949e; margin-top: 3px; }
.w-poweron .po-pihole-pct-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.62rem;
  margin-bottom: 5px;
}
.w-poweron .po-pihole-pct-val { color: var(--accent2, #06b6d4); }
.w-poweron .po-bar-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}
.w-poweron .po-bar-label { font-size: 0.58rem; color: #8b949e; width: 28px; flex-shrink: 0; }
.w-poweron .po-bar-track {
  flex: 1;
  height: 5px;
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  overflow: hidden;
}
.w-poweron .po-bar-fill {
  height: 100%;
  background: var(--accent2, #06b6d4);
  border-radius: 3px;
  width: 0%;
}

/* ── ch16 home server ── */
.w-poweron .po-file-list {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 8px;
}
.w-poweron .po-file-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 0.68rem;
}
.w-poweron .po-file-row:last-child { border-bottom: none; }
.w-poweron .po-file-icon { font-size: 0.9rem; flex-shrink: 0; }
.w-poweron .po-file-name { flex: 1; }
.w-poweron .po-file-size { color: #8b949e; font-size: 0.62rem; }
.w-poweron .po-storage-section { }
.w-poweron .po-storage-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.62rem;
  margin-bottom: 4px;
}
.w-poweron .po-storage-val { color: var(--accent2, #06b6d4); }
.w-poweron .po-storage-track {
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  overflow: hidden;
}
.w-poweron .po-storage-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent2, #06b6d4), var(--success, #2ea043));
  border-radius: 3px;
  width: 0%;
}

/* ── ch17 home assistant ── */
.w-poweron .po-ha-list { display: flex; flex-direction: column; gap: 5px; }
.w-poweron .po-ha-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.03);
  border-radius: 5px;
  padding: 6px 8px;
}
.w-poweron .po-ha-icon { font-size: 1rem; filter: grayscale(0.8); transition: filter 0.3s; }
.w-poweron .po-ha-icon--on { filter: grayscale(0); }
.w-poweron .po-ha-name { flex: 1; font-size: 0.68rem; }
.w-poweron .po-ha-val { font-size: 0.68rem; color: var(--accent2, #06b6d4); }
.w-poweron .po-ha-toggle {
  width: 28px; height: 16px;
  background: rgba(255,255,255,0.12);
  border-radius: 8px;
  border: none;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background 0.25s;
  padding: 0;
}
.w-poweron .po-ha-toggle--on { background: var(--success, #2ea043); }
.w-poweron .po-ha-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.25s;
}
.w-poweron .po-ha-toggle--on .po-ha-knob { left: 14px; }

/* ── ch18 docker ── */
.w-poweron .po-docker-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}
.w-poweron .po-docker-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.64rem;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.w-poweron .po-docker-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.w-poweron .po-docker-dot--up {
  background: var(--success, #2ea043);
  animation: ${REDUCED ? 'none' : 'po-blink 2.5s ease-in-out infinite'};
}
.w-poweron .po-docker-dot--down { background: #8b949e; }
.w-poweron .po-docker-name { width: 82px; font-weight: 600; flex-shrink: 0; }
.w-poweron .po-docker-image { flex: 1; color: #8b949e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.w-poweron .po-docker-port { color: var(--accent2, #06b6d4); flex-shrink: 0; width: 70px; text-align: right; }
.w-poweron .po-docker-status { flex-shrink: 0; font-size: 0.58rem; color: #8b949e; width: 38px; text-align: right; }
.w-poweron .po-docker-status--up { color: var(--success, #2ea043); }
.w-poweron .po-docker-footer { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 5px; }
.w-poweron .po-docker-summary { font-size: 0.6rem; color: #8b949e; }

/* ── ch19 local AI ── */
.w-poweron .po-chat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 130px;
  max-height: 140px;
  overflow-y: auto;
  scrollbar-width: none;
  margin-bottom: 8px;
}
.w-poweron .po-chat::-webkit-scrollbar { display: none; }
.w-poweron .po-chat-bubble {
  border-radius: 8px;
  padding: 6px 9px;
  font-size: 0.68rem;
  line-height: 1.4;
  max-width: 95%;
}
.w-poweron .po-chat-bubble--user {
  background: rgba(199,21,42,0.15);
  border: 1px solid rgba(199,21,42,0.25);
  align-self: flex-end;
  color: #e6edf3;
}
.w-poweron .po-chat-bubble--ai {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  align-self: flex-start;
}
.w-poweron .po-chat-ai-tag {
  display: inline-block;
  font-size: 0.55rem;
  background: var(--accent2, #06b6d4);
  color: #000;
  border-radius: 3px;
  padding: 1px 4px;
  margin-right: 5px;
  font-weight: 700;
  vertical-align: middle;
}
.w-poweron .po-cursor {
  animation: ${REDUCED ? 'none' : 'po-blink-cur 0.7s step-end infinite'};
}
@keyframes po-blink-cur {
  0%,100% { opacity: 1; } 50% { opacity: 0; }
}
.w-poweron .po-chat-input-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.w-poweron .po-chat-input {
  flex: 1;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 5px;
  padding: 5px 9px;
  font-size: 0.65rem;
  color: #8b949e;
}
.w-poweron .po-chat-send {
  background: var(--accent, #C7152A);
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 0.7rem;
  cursor: pointer;
}
`;

/* ─── mount ──────────────────────────────────────────────────────────── */

export function mount(container, ctx = {}) {
  const chapter = (ctx.dataset && ctx.dataset.chapter) || '';
  const meta = META[chapter];
  const mockFn = MOCKS[chapter];

  if (!meta || !mockFn) {
    /* graceful fallback for unknown chapters */
    container.textContent = '';
    return;
  }

  /* inject CSS once */
  if (!document.getElementById('w-poweron-css')) {
    const s = document.createElement('style');
    s.id = 'w-poweron-css';
    s.textContent = CSS;
    document.head.append(s);
  }

  container.classList.add('w-poweron');

  const diffLower = meta.difficulty.toLowerCase();

  const card = el('div', { class: 'po-card' });

  /* heading */
  card.append(el('div', { class: 'po-heading' },
    el('span', { class: 'po-heading-icon', html: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>` }),
    `What you're building — ${meta.title}`
  ));

  /* screen */
  const screen = el('div', { class: 'po-screen' });
  card.append(screen);

  /* meta strip */
  card.append(
    el('div', { class: 'po-meta' },
      el('div', { class: 'po-meta-item' },
        el('span', { class: 'po-meta-key', text: 'Difficulty' }),
        el('span', { class: `po-meta-val po-meta-val--${diffLower}`, text: meta.difficulty })
      ),
      el('div', { class: 'po-meta-item' },
        el('span', { class: 'po-meta-key', text: 'Time' }),
        el('span', { class: 'po-meta-val', text: meta.time })
      ),
      el('div', { class: 'po-meta-item' },
        el('span', { class: 'po-meta-key', text: "What you'll need" }),
        el('span', { class: 'po-meta-val', text: meta.needs })
      )
    )
  );

  container.append(card);

  /* run the mock renderer */
  mockFn(screen);

  /* cleanup on disconnect */
  const obs = new MutationObserver(() => {
    if (!document.contains(container)) {
      if (screen._cleanup) screen._cleanup();
      obs.disconnect();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}
