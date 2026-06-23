# Pilot — Learn your Raspberry Pi 5

**A friendly, interactive course that turns a 447-page Raspberry Pi 5 handbook into something you can finish — with a real Pi terminal and a wireable circuit board you can try right in the browser.**

🔗 **Live:** _(deployed via GitHub Pages)_
📄 Companion: the full 447-page PDF handbook is bundled and downloadable from inside the app.

---

## What it is

Pilot is a zero-build, installable **Progressive Web App** (vanilla JS, ES modules — no framework, no bundler) that reframes a complete beginner's Raspberry Pi 5 book as a **35-lesson learning path**. It is designed for a total beginner: warm, plain-English, and impossible to get lost in.

### Highlights

- 🛤️ **The Learning Path** — a winding, Duolingo-style trail of all 35 lessons across 7 parts, with persisted progress, completion rings, copper circuit-trace connectors, and a "you are here" marker.
- 🧪 **The Maker Lab** — a project-driven Part where every build teaches a *named* Python or electronics fundamental: a traffic-light controller (lists & loops), a reaction-timer game (events & timing), a salvaged sound machine and mood lamp (PWM & recycling old electronics), an ultrasonic parking sensor (classes & a 5 V→3.3 V voltage divider), a plant data-logger (files & CSV), a motion alarm from e-waste, a Flask + HTML/CSS/JavaScript sensor dashboard capstone, a finale that **reanimates old LEGO Mindstorms NXT 2.0 motors and sensors into an AI-assisted, camera-driven robot**, and an honest, safety-first guide to **harvesting usable parts from a dead smartphone** (battery, speaker, vibration motor — and the whole phone as a wireless camera).
- 💻 **A real Pi terminal sandbox** — a hand-written Raspberry Pi OS shell (virtual filesystem, history, tab-completion) that runs the commands the book teaches. `man <term>` pulls the glossary; `find <word>` full-text-searches every lesson. The terminal *is* the search engine behind ⌘K.
- 🔌 **A wireable GPIO board** — an interactive 40-pin pinout + breadboard where you wire an LED through a resistor on GPIO 17, press **Run** on real `gpiozero` code, and watch it blink — with enforced electrical rules and a 3.3 V safety guard that quotes the handbook's exact damage warning.
- 🍓 **Hero board inspector** — click any component on a Raspberry Pi 5 board to learn what it does and jump to the lesson that uses it.
- 🔎 **⌘K command palette** + a **living glossary** — every technical term in the prose links to a hover-definition card, and one shortcut searches lessons, glossary, and the command reference at once.
- 📊 **My Pi dashboard** — progress core, milestone badges (First Boot, It Blinks!, AI on the Pi…), exportable progress, and a printable completion certificate.
- 🌗 **Two co-equal themes** — a warm **Daylight** course (default) and a graphite **Workbench** mode with a breathing power-LED, one sunrise/sunset toggle apart.
- 📶 **Offline-first PWA** — installable, service-worker cached, works on a train.

---

## How it was built

The content and the app were produced with a multi-phase agentic pipeline:

1. The source **447-page handbook** (24 chapters) was written by a write→technical-edit agent team and typeset to PDF.
2. A **content-transform** step turned each chapter into structured app content (manifest, per-chapter HTML fragments, a 123-term glossary, a full-text search index).
3. A **concept panel** of independent design directions was synthesised into one creative brief + design tokens.
4. The **SPA shell, design system, router, and views** were hand-built to that brief.
5. The **interactive widgets** (terminal, GPIO sim, board inspector, calculators, project picker, power-on previews) and the **per-chapter quizzes** were fanned out as independent modules against a strict `mount()` contract.

---

## Run it locally

It's static files — serve the folder with anything:

```bash
python -m http.server 5050
# then open http://localhost:5050
```

(A server is needed because it uses ES modules and `fetch`; opening `index.html` from disk won't work.)

## Project structure

```
index.html            app shell + top bar
css/                  base (tokens+themes) · layout · components · home
js/
  app.js              boot: theme, router, ⌘K, service worker
  router.js store.js  hash router · localStorage progress
  content.js search.js  manifest/chapters/glossary · lazy search index
  views/              home (path) · reader · glossary · reference · tools · me
  widgets/            board · terminal · gpio · resistor · picker · poweron
content/
  manifest.json       parts, chapters, sections, reading time
  chapters/*.html     the 35 lessons
  glossary.json  search-index.json  quizzes/*.json
sw.js  manifest.webmanifest  assets/
```

## Tech

Vanilla JavaScript (ES modules), SVG, the Web App Manifest + a service worker. No framework, no build step, no backend. Fonts: Fraunces · Inter · JetBrains Mono.

---

_Built for learning. Nothing in the browser can break a real Raspberry Pi._
