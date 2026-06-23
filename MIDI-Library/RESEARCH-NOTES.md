# EDM Theory Reference — what this library is built on

Compiled from deep web research across reputable production sources (Attack
Magazine, EDMProd, Native Instruments, Mixed In Key, Beatportal, Unison,
Melodigging, The Producer School, Hooktheory, Wikipedia, Screech House, LANDR,
Audiotent, PresetGround, Chordoo, and others). Each genre's claims were
cross-checked across 2+ independent sources before being baked into the
generator. Notes spelled in concrete keys for clarity.

> **Sourcing caveat:** many production blogs block automated fetching, so a
> portion of this rests on search-engine extractions of those same pages rather
> than full-page reads. The highest-consensus facts (signature progressions,
> BPM centres, bass archetypes) appeared in 3–4 independent sources. Voicing and
> motif-length figures are lower confidence (often 2 sources). Treat it as a
> strong working reference, not gospel.

Degrees below are scale degrees of the **natural minor** scale
(i ii° III iv v VI VII), which is how the generator addresses chords.

---

## House family

### Deep House — 122 BPM
- **Scales:** natural minor + **Dorian** (the soulful major-6th colour); minor pentatonic for melody.
- **Progressions:** `i–VII–VI–VII` (Am–G–F–G, hypnotic/Andalusian) · `i–VI–III–VII` (Am–F–C–G) · jazz `ii–V–I` (Dm7–G7–Cmaj7) · `vi–ii–V–I`.
- **Extensions are mandatory:** min7 / **min9** / maj7, often +9th/+11th. This is the genre's strongest single consensus item.
- **Bass:** warm sub *between the kicks* — root on beat 1, octave-up on the "and"; syncopated 8ths following chord roots.
- **Voicing:** spread/jazzy stabs — root low + a 2–3 note cluster holding 3rd/7th/9th; drop the 5th.

### Future House — 126 BPM
- **Scales:** minor (F#m, G#m, Fm, Gm common).
- **Progressions:** `i–v–VI–VII` (Em–Bm–C–D, ascending/euphoric — the flagship) · `VI–VII–i` · `i–VII–VI–VII` · major-framed `vi–IV–I–V`.
- **Extensions:** 7ths/9ths on stabs.
- **Bass:** the star — metallic FM "talking"/elastic lead-bass, octave-doubled. Two rhythms: octave-jump 8ths or rolling 16ths.
- **Voicing:** punchy short m7/m9 stabs + plucks (not sustained pads).

### Progressive House — 128 BPM
- **Scales:** natural minor (major for euphoric breakdowns).
- **Progressions:** `i–VI–III–VII` (Am–F–C–G, anthemic) · `i–VII–VI–VII` · major `I–V–vi–IV` / `vi–IV–I–V` · Deadmau5 `i–VIIadd9–VI–IV`.
- **Extensions:** add9 + passing 6th→7th/9th chords ("Strobe" technique).
- **Bass:** rolling sub-heavy, root-driven with octave jumps/slides; offbeat groove.
- **Voicing:** wide lush supersaw pads (4–6 note stacks) + pluck arps; melodies develop gradually (the "progressive" trait, variation every 4–8 bars).

---

## Tech / Techno family

### Tech House — 126 BPM
- **Harmony is minimal/riff-based.** Often a single tonic stab; when used: `i–VII–VI` (Am–G–F) or `i–VI–III–VII`.
- **Scales:** natural minor; **Phrygian** as a signature dark/Spanish flavour trick (not the default).
- **Bass:** gritty mid-range (not pure sub). Offbeat 8ths, or Chris-Stussy rolling-16th 3-note pattern (tonic on kick, 5th+octave fills). Root-driven.
- **Voicing:** filtered stabs/plucks + chopped vocal stabs as a harmonic/rhythmic element.

### Techno (peak-time/driving) — 130 BPM
- **Harmony minimal/tension-driven**, often one chord. Canonical move: `i ↔ isus4` (Fm↔Fsus4). Single tonic stab evolved by filtering is the most common "progression."
- **Scales:** natural minor; Phrygian/harmonic minor for dissonant tension; dissonant metallic stabs prized over consonance.
- **Bass:** rolling/hypnotic 16ths *or* offbeat "rumble" (long reverb→distortion→low-pass→sidechain). **Root-only / tonic-locked.**
- **Voicing:** timbre (sound design) carries the interest more than chord choice.

### Melodic Techno — 124 BPM
- **The most harmonic of the three.** Chords change ~every 2 bars (8-bar loops).
- **Progressions:** `i–VI–III–VII` (Am–F–C–G — the Afterlife/Tale of Us/Anyma flagship, 4-source consensus) · two-chord `i–VI`/`i–VII` loops · `i–v–VI–iv` (Am–Em–F–Dm, haunting).
- **Extensions:** min7/min9/add9/sus; **upper-structure voicings** (play only 7th/9th/11th, bass supplies root).
- **Bass:** rolling 16th/8th mono synth, **doubles the chord roots** (so pads can float rootless).
- **Lead:** long evolving arps/motifs — **8–16 bars**, an octave+ above chords, often arpeggiator-derived from chord tones.

---

## Trance / Hard family

### Uplifting Trance — 138 BPM
- **Scales:** natural minor for chords; **harmonic minor for leads** (raised 7th = classic-trance exotic tension); major for euphoric rests.
- **Progressions:** `i–VI–III–VII` (Am–F–C–G, anthemic) · `vi–IV–I–V` · euphoric `I–V–vi–IV` · `i–VI–VII` (the trance "blues") · darker `i–v–VI–VII`.
- **Extensions:** sus4→3 resolution at the drop (Asus4→A) for release; add9/maj7 pad colourings.
- **Bass:** root-driven — offbeat "donk", double-offbeat, or signature rolling 1/16 (kick-step notes omitted, offbeat dropped an octave); octave-jump for euphoria.
- **Lead:** long 16–32 bar emotional leads in harmonic minor, layered at the octave + a 3rd; supersaw (5–7 detuned saws) + pluck.

### Hardstyle — 150 BPM
- **Scales:** natural minor + **harmonic minor** for euphoric leads; Phrygian for rawstyle.
- **Progressions:** `i–VII–VI–III` (Em–D–C–G, euphoric staple) · `i–VI–III–VII` (Em–C–G–D) · euphoric major sections · minimal `i–VI–VII`.
- **Bass = reverse bass:** kick on the downbeat, sub-bass on the offbeat ("and"), sidechained to duck completely under each kick. Bass plays the chord root; kick is a distorted tonal kick-bass tuned to the key root.
- **Lead:** euphoric screech/supersaw (7 unison voices, heavy detune) an octave above the chords; 16-bar climax.

### Hardcore / Gabber — 180 BPM
- **Scales:** natural minor + Phrygian (b2 tension); simple memorable minor riffs.
- **Harmony minimal — percussion-driven.** `i–VI–III–VII` (Am–F–C–G) or `i–VI–VII` (Am–F–G) as 4–8 bar loops, frequently as **monophonic "hoover" stabs** rather than pads; Phrygian `i–bII` move on stabs.
- **Bass = the kick.** A heavily distorted/overdriven TR-909 kick tuned to the root, four-on-the-floor; its tonal tail supplies the bass. Root-only.
- **Voicing:** monophonic distorted stabs (hoover/gabber-stab), metallic/industrial, clipped/saturated.

---

## Bass / Chill family

### Dubstep (melodic / brostep) — 140 BPM (half-time ~70)
- **Scales:** natural minor default; Phrygian/harmonic minor for dark brostep; Dorian for brighter melodic; borrowed bVI/bVII.
- **Progressions:** `i–VI–III–VII` (Am–F–C–G, the emotional workhorse) · `i–III–VII–VI` (Am–C–G–F) · `i–VII–VI–VII` · cadential `VI–VII–i` into the drop.
- **Bass (the drop):** half-time, root-driven, two layers — clean static **sub on the chord root** + mid/growl/Reese/wobble carrying all the movement, harmonised in **5ths and octaves** (not triads) for mono-compatibility.
- **Lead:** melodic-dubstep tops chords ~an octave up; brostep "leads" are the growl riffs themselves.

### Future Bass — 150 BPM (half-time 75)
- **Scales:** major OR minor freely; heavy R&B/jazz borrowing (secondary dominants, deceptive cadences).
- **Progressions — never bare triads, always extended (maj7/min7/min9/add9/sus/11):** `vi–IV–I–V` (Am7–Fmaj9–Cmaj7–Gsus, the signature) · `I–IV–V–vi` · "Axis" `I–V–vi–IV` · minor reading `i–VI–III–VII`. Keep common tones / stepwise voice-leading.
- **Bass:** atypically **no traditional bassline** — the pitched **supersaw chord stack is the drop lead**, played as sidechained stabs/stutters with pitch-bend/portamento; clean sub follows the root underneath.
- **Voicing:** wide detuned supersaw stacks spread over multiple octaves (root low, extensions high); vocal chops share the lead role.

### Lo-fi / Chill — 85 BPM
- **Scales:** jazz/modal — major+minor with 7th/9th extension everywhere; **Dorian** signature; Mixolydian/pentatonic for melody.
- **Progressions — jazz-ify every chord into a 7th:** `Imaj7–vi7–IVmaj7–V7` (Cmaj7–Am7–Fmaj7–G7) · jazz **`ii7–V7–Imaj7`** (Dm7–G7–Cmaj7, the harmonic core) · `I–vi–ii–V` turnaround · `Imaj7–iii7–vi7–IV`.
- **Bass:** soft, swung, root-driven with light **walking** movement (chromatic/diatonic into the next root); upright/double-bass timbre, behind-the-beat.
- **Voicing:** jazzy rootless/close voicings on Rhodes/EP; spread 2+ octaves; wow-flutter/vinyl character. Melody = simple repetitive 4-note motif, swung 8ths, lots of space.

---

## Cross-genre universals
- **`i–VI–III–VII` (Am–F–C–G)** is the single most-recurring progression — it powers progressive house, melodic techno, trance, dubstep and future bass (the relative-major reading is `vi–IV–I–V`). It's the safest "works every time" EDM loop.
- **Natural minor** is the default tonality across nearly every genre; **harmonic minor** for emotional/exotic leads (trance, hardstyle); **Phrygian** for dark/aggressive (techno, hardcore, rawstyle); **Dorian** for soulful/jazzy (deep house, lo-fi).
- **7th/9th extensions** separate "pro" EDM chords from bare triads — mandatory in deep house, melodic techno, future bass and lo-fi.
- **Bass almost always tracks the chord root**; the genre's identity lives in the *rhythm* (offbeat 8ths vs rolling 16ths vs reverse-bass vs half-time growl) and the *timbre*, not the notes.

---

### Source URLs (consolidated)
House/Prog: attackmagazine.com · edmprod.com · mixedinkey.com · benrainey.co.uk ·
unison.audio · blog.native-instruments.com · hooktheory.com · landr.com ·
soundmasters.org · emastered.com.
Tech/Techno: beatportal.com · presetground.com · chordoo.com · theproducerschool.com ·
f9-audio.com · sonicacademy.com · soundtrap.com · iqsounds.com · samplesoundmusic.com.
Trance/Hard: en.wikipedia.org/wiki/Uplifting_trance · theoryhelper.com · melodigging.com ·
kingofchords.com · screechhouse.com · houseoftracks.com · hardcultr.com · adsrsounds.com ·
classace.io · corehistory.blogspot.com.
Bass/Chill: audiotent.com · off-the-beat.com · feelyoursound.com · pointblankmusicschool.com ·
richardpryn.com · lofiweekly.com · notreble.com · melodics.com · merelymusic.com ·
soundation.com · theproaudiofiles.com.
