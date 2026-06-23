# 🎹 EDM MIDI Library — "Never Buy a MIDI Pack Again"

A **1,150+ file** MIDI library generated entirely from music theory + cross-checked
EDM production research. Zero dependencies, fully reproducible, royalty-free
(it's math — you own everything it produces).

Drop any `.mid` onto a synth/instrument track in **Ableton, FL Studio, Logic,
Bitwig, Cubase, Studio One, Reaper**, etc. Every file carries its own tempo so it
drops in at the right BPM automatically.

---

## 📂 Folder structure

```
MIDI-Library/
├── Chords/                     # Every chord quality, all 12 roots (one bar each)
│   ├── Minor/  Minor7/  Minor9/  Minor6/  MinorAdd9/  HalfDim7/
│   ├── Major/  Major7/  Add9/  Dominant7/
│   └── Diminished/  Dim7/  Augmented/  Sus2/  Sus4/
│
├── Progressions/
│   ├── By-Scale/   <Key>-minor/   12 keys × 12 progressions × 3 voicings
│   └── By-Genre/   01_Deep-House … 12_Lofi-Chill  (authentic per-genre prog, all 12 keys)
│
├── Basslines/
│   ├── By-Scale/   6 rhythm patterns per key
│   └── By-Genre/   genre-correct bass rhythm, all 12 keys
│
├── Melodies/
│   ├── By-Scale/   natural-minor / pentatonic / dorian / harmonic-minor × 2 variants
│   └── By-Genre/   melody in each genre's signature scale (A-minor demos)
│
├── Arps/
│   ├── By-Scale/   up / down / updown / octave-up per key
│   └── By-Genre/   genre-flavoured arp (A-minor demos)
│
├── MANIFEST.csv                # Index of every file: key, scale, genre, BPM, bars, notes
├── RESEARCH-NOTES.md           # The EDM theory this was built from (with sources)
├── midilib.py                  # Zero-dep MIDI writer + music-theory toolkit
├── generate.py / generate_genres.py   # Regenerate everything with `python3 generate.py`
└── Resources/                  # Curated free Serum-preset + sample download directories
```

### Naming convention
`<Key>m_<what>_<detail>.mid` — e.g. `Am_03_Progressive-House_i-VI-III-VII_chords.mid`,
`Fm_Minor9.mid`, `Gm_bass_rolling_16ths.mid`. Sharps are spelled `s` (filesystem-safe):
`As` = A#, `Cs` = C#.

---

## 🎛️ Genre quick-reference (baked into the By-Genre clips)

| Folder | BPM | Signature progression | Bass | Chord colour |
|---|---|---|---|---|
| 01 Deep House | 122 | i–VII–VI–VII (Am–G–F–G) | offbeat root+octave | min9 stabs |
| 02 Future House | 126 | i–v–VI–VII (Em–Bm–C–D) | rolling 16ths | 7th stabs |
| 03 Progressive House | 128 | i–VI–III–VII (Am–F–C–G) | rolling sub | add9 supersaw |
| 04 Tech House | 126 | i–VII–VI (Am–G–F) | offbeat 8ths | filtered stabs |
| 05 Techno | 130 | i↔isus4 (Fm↔Fsus4) | tonic-locked 16ths | dark/sus |
| 06 Melodic Techno | 124 | i–VI–III–VII (Am–F–C–G) | roots-following 16ths | min9, 2 bars/chord |
| 07 Trance | 138 | i–VI–III–VII (Am–F–C–G) | rolling 16ths | harmonic-minor leads |
| 08 Hardstyle | 150 | i–VII–VI–III (Em–D–C–G) | reverse offbeat | screech octave-up |
| 09 Hardcore/Gabber | 180 | i–VI–VII (Am–F–G) | distorted kick-as-bass | Phrygian |
| 10 Dubstep | 140 | i–VI–VII (Am–F–G) | reese sustain (half-time) | borrowed bVI/bVII |
| 11 Future Bass | 150 | i–VI–III–VII lush 9ths | octave bass | maj7/9/sus stacks |
| 12 Lo-fi/Chill | 85 | i–iv–VII–III (jazzy 7ths) | swung sustained sub | rootless Rhodes |

Full theory + every source URL is in **`RESEARCH-NOTES.md`**.

---

## ▶️ Regenerate / customise

```bash
cd MIDI-Library
python3 generate.py          # rebuilds all folders + MANIFEST.csv (no pip installs)
```

Want more keys, extra progressions, different BPMs? Edit the dicts at the top of
`generate.py` (chord/progression lists) or `generate_genres.py` (per-genre table)
and re-run. It's deterministic — same input, identical files.

---

## ☁️ Getting this into your OneDrive Documents

This was built in a cloud container that **cannot reach your OneDrive directly**, so
it lives in your git repo. To get it into `OneDrive\Documents`:

**Option A — drag & drop (simplest):** download/clone the repo, drag the
`MIDI-Library` folder into `OneDrive\Documents`.

**Option B — PowerShell one-liner (Windows):**
```powershell
git clone <your-repo-url> "$env:TEMP\rpa"
Copy-Item "$env:TEMP\rpa\MIDI-Library" "$env:USERPROFILE\OneDrive\Documents\MIDI-Library" -Recurse
```

Then in your DAW, point your browser/places at
`OneDrive\Documents\MIDI-Library` and drag clips straight onto tracks. (Set the
folder to **"Always keep on this device"** so your DAW doesn't choke on
online-only files.)

See **`Resources/`** for the free Serum-preset and sample-pack directories.
