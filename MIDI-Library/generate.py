#!/usr/bin/env python3
"""
generate.py — Builds the entire MIDI-Library from music theory. Zero deps.

Run:  python3 generate.py
Output: organised .mid files under Chords/, Progressions/, Basslines/,
        Melodies/, Arps/  plus a MANIFEST.csv index.

Everything is derived from theory in midilib.py, so it is fully reproducible:
delete the output folders, re-run, get byte-identical files.
"""

from __future__ import annotations
import os
import csv
import random

from midilib import (
    Note, write_midi, write_midi_multi, note_number, safe_key_name,
    chord_pitches, scale_pitches, QUALITY_LABEL, MINOR_DIATONIC_QUALITY, SCALES,
)

ROOT = os.path.dirname(os.path.abspath(__file__))
MANIFEST: list[dict] = []
BAR = 4.0  # beats per bar (4/4)


def add(path: str, notes: list[Note], bpm: float, category: str, desc: str,
        key: str = "", scale: str = "", genre: str = "", program=None):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    name = os.path.splitext(os.path.basename(path))[0]
    write_midi(full, notes, bpm=bpm, track_name=name[:32], program=program)
    MANIFEST.append(dict(file=path, category=category, key=key, scale=scale,
                         genre=genre, bpm=bpm, bars=_bars(notes), notes=len(notes),
                         description=desc))


def add_multi(path: str, parts: list[dict], bpm: float, category: str, desc: str,
              key: str = "", scale: str = "", genre: str = ""):
    """Register + write a multi-track clip (one MTrk per part)."""
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    name = os.path.splitext(os.path.basename(path))[0]
    write_midi_multi(full, parts, bpm=bpm, song_name=name[:32])
    allnotes = [n for p in parts for n in p["notes"]]
    MANIFEST.append(dict(file=path, category=category, key=key, scale=scale,
                         genre=genre, bpm=bpm, bars=_bars(allnotes),
                         notes=len(allnotes), description=desc))


def _bars(notes: list[Note]) -> int:
    if not notes:
        return 0
    end = max(n.start + n.dur for n in notes)
    return max(1, int(round(end / BAR)))


# --------------------------------------------------------------------------- #
#  Voice-leading: realise a chord near a previous voicing for smooth pads
# --------------------------------------------------------------------------- #

def voice_chord(root_pc: int, quality: str, prev_center: int | None,
                base_octave: int = 3) -> list[int]:
    """Return MIDI notes for the chord, octave-placed for smooth voice leading."""
    from midilib import CHORD_INTERVALS
    root = note_number(root_pc, base_octave)
    raw = [root + iv for iv in CHORD_INTERVALS[quality]]
    if prev_center is None:
        return raw
    # Nudge whole chord up/down an octave to sit closest to prev_center.
    center = sum(raw) / len(raw)
    while center - prev_center > 6:
        raw = [p - 12 for p in raw]; center -= 12
    while prev_center - center > 6:
        raw = [p + 12 for p in raw]; center += 12
    return raw


# --------------------------------------------------------------------------- #
#  Progression library — degrees are 0-based scale degrees of NATURAL MINOR.
#  quality=None -> use diatonic quality. Extensions add 7th/9th flavour.
# --------------------------------------------------------------------------- #

# name -> list of (degree, quality_override_or_None)
MINOR_PROGRESSIONS = {
    "i-VI-III-VII":     [(0, None), (5, None), (2, None), (6, None)],   # Am F C G
    "i-VII-VI-VII":     [(0, None), (6, None), (5, None), (6, None)],
    "i-VI-VII":         [(0, None), (5, None), (6, None)],
    "i-iv-VI-V":        [(0, None), (3, None), (5, None), (4, "maj")],  # harmonic V
    "VI-VII-i":         [(5, None), (6, None), (0, None)],
    "i-III-VII-VI":     [(0, None), (2, None), (6, None), (5, None)],
    "i-iv-v-i":         [(0, None), (3, None), (4, None), (0, None)],
    "i-VI-III-VII-alt": [(0, None), (5, None), (2, None), (6, None)],
    "i-v-VI-IV_borrow": [(0, None), (4, None), (5, None), (3, "maj")],
    "i-VII-III-VI":     [(0, None), (6, None), (2, None), (5, None)],
    "i-iv-VII-III":     [(0, None), (3, None), (6, None), (2, None)],
    "i-VI-iv-V":        [(0, None), (5, None), (3, None), (4, "maj")],
}

# 7th/9th "lush EDM" voicing flavours applied on top of a progression.
EXTENSION_FLAVOURS = {
    "triads": None,
    "7th":    "7",
    "9th":    "9",
}


def realise_progression(key_pc: int, degrees, flavour: str | None,
                        bars_per_chord: float = 1.0, base_octave: int = 3) -> list[Note]:
    """Turn a degree list into voiced pad Notes with smooth voice leading."""
    scale = SCALES["natural_minor"]
    notes: list[Note] = []
    prev_center = None
    t = 0.0
    for degree, q_override in degrees:
        root_pc = (key_pc + scale[degree % 7]) % 12
        quality = q_override or MINOR_DIATONIC_QUALITY[degree % 7]
        quality = _apply_flavour(quality, flavour)
        voiced = voice_chord(root_pc, quality, prev_center, base_octave)
        prev_center = sum(voiced) / len(voiced)
        dur = BAR * bars_per_chord
        for p in voiced:
            notes.append(Note(t, dur * 0.98, p, 90))
        t += dur
    return notes


def _apply_flavour(quality: str, flavour: str | None) -> str:
    if not flavour:
        return quality
    if flavour == "7":
        return {"min": "min7", "maj": "maj7", "dim": "min7b5"}.get(quality, quality)
    if flavour == "9":
        return {"min": "min9", "maj": "maj9", "dim": "min7b5"}.get(quality, quality)
    return quality


# --------------------------------------------------------------------------- #
#  Basslines
# --------------------------------------------------------------------------- #

def bassline(key_pc: int, degrees, pattern: str, bars_per_chord: float = 1.0,
             octave: int = 1) -> list[Note]:
    scale = SCALES["natural_minor"]
    notes: list[Note] = []
    t = 0.0
    for degree, _q in degrees:
        root_pc = (key_pc + scale[degree % 7]) % 12
        root = note_number(root_pc, octave)
        fifth = root + 7
        span = BAR * bars_per_chord
        notes += _bass_cell(pattern, t, span, root, fifth)
        t += span
    return notes


def _bass_cell(pattern: str, t0: float, span: float, root: int, fifth: int) -> list[Note]:
    out: list[Note] = []
    if pattern == "offbeat_8ths":          # classic house: on every "and"
        beat = 0.5
        while beat < span:
            out.append(Note(t0 + beat, 0.45, root, 100))
            beat += 1.0
    elif pattern == "rolling_16ths":       # techno driver
        i = 0.0
        while i < span:
            p = root if int(i * 4) % 2 == 0 else root  # root-heavy
            out.append(Note(t0 + i, 0.22, p, 95 if int(i*4) % 4 else 110))
            i += 0.25
    elif pattern == "sustained":           # trance/long
        out.append(Note(t0, span * 0.98, root, 90))
    elif pattern == "root_octave_8ths":    # offbeat root + octave accents
        beat = 0.0
        while beat < span:
            out.append(Note(t0 + beat, 0.22, root, 105))
            out.append(Note(t0 + beat + 0.5, 0.22, root + 12, 85))
            beat += 1.0
    elif pattern == "hardstyle_offbeat":   # kick on beat, bass on the &
        beat = 0.0
        while beat < span:
            out.append(Note(t0 + beat + 0.5, 0.4, root, 110))
            beat += 1.0
    elif pattern == "reese_sustain":       # dnb/dubstep style held root
        out.append(Note(t0, span * 0.99, root - 12, 100))
    else:                                   # fallback: root on the one
        out.append(Note(t0, span * 0.98, root, 100))
    return out


# --------------------------------------------------------------------------- #
#  Melodies — chord-tone targeting + stepwise motion, seeded for reproducibility
# --------------------------------------------------------------------------- #

def melody(key_pc: int, degrees, scale_name: str, seed: int,
           octave: int = 5, bars_per_chord: float = 1.0) -> list[Note]:
    rng = random.Random(seed)
    sc = scale_pitches(note_number(key_pc, octave), scale_name, octaves=2)
    nm_scale = SCALES["natural_minor"]
    notes: list[Note] = []
    t = 0.0
    # one repeated rhythmic motif per chord keeps melodies catchy
    rhythms = [
        [0.5, 0.5, 1.0, 1.0, 1.0],
        [1.0, 0.5, 0.5, 1.0, 1.0],
        [0.5, 0.5, 0.5, 0.5, 1.0, 1.0],
        [1.5, 0.5, 1.0, 1.0],
    ]
    rhythm = rng.choice(rhythms)
    idx = len(sc) // 2  # start mid-range
    for degree, _q in degrees:
        chord_root_pc = (key_pc + nm_scale[degree % 7]) % 12
        chord_tones = {(chord_root_pc) % 12, (chord_root_pc + 3) % 12,
                       (chord_root_pc + 7) % 12}
        span = BAR * bars_per_chord
        local_t = 0.0
        ri = 0
        while local_t < span - 1e-6:
            dur = rhythm[ri % len(rhythm)]
            if local_t + dur > span:
                dur = span - local_t
            strong = (abs(local_t - round(local_t)) < 1e-6)  # on a beat
            # move stepwise, but on strong beats snap to a chord tone
            step = rng.choice([-2, -1, -1, 1, 1, 2])
            idx = max(1, min(len(sc) - 2, idx + step))
            if strong:
                for _ in range(7):
                    if sc[idx] % 12 in chord_tones:
                        break
                    idx = max(1, min(len(sc) - 2, idx + (1 if rng.random() < .5 else -1)))
            vel = 104 if strong else 84
            notes.append(Note(t + local_t, dur * 0.9, sc[idx], vel))
            local_t += dur
            ri += 1
        t += span
    return notes


# --------------------------------------------------------------------------- #
#  Arpeggios
# --------------------------------------------------------------------------- #

def arpeggio(key_pc: int, degrees, pattern: str, flavour: str | None,
             rate: float = 0.25, bars_per_chord: float = 1.0,
             base_octave: int = 4) -> list[Note]:
    scale = SCALES["natural_minor"]
    notes: list[Note] = []
    t = 0.0
    prev_center = None
    for degree, q_override in degrees:
        root_pc = (key_pc + scale[degree % 7]) % 12
        quality = q_override or MINOR_DIATONIC_QUALITY[degree % 7]
        quality = _apply_flavour(quality, flavour)
        voiced = voice_chord(root_pc, quality, prev_center, base_octave)
        prev_center = sum(voiced) / len(voiced)
        seq = _arp_sequence(voiced, pattern)
        span = BAR * bars_per_chord
        i = 0.0
        k = 0
        while i < span - 1e-6:
            p = seq[k % len(seq)]
            notes.append(Note(t + i, rate * 0.9, p, 92 if k % 2 else 100))
            i += rate
            k += 1
        t += span
    return notes


def _arp_sequence(voiced: list[int], pattern: str) -> list[int]:
    up = list(voiced) + [voiced[0] + 12]
    if pattern == "up":
        return up
    if pattern == "down":
        return list(reversed(up))
    if pattern == "updown":
        return up + list(reversed(up))[1:-1]
    if pattern == "octave_up":
        return [p for v in voiced for p in (v, v + 12)]
    return up


# --------------------------------------------------------------------------- #
#  Build steps
# --------------------------------------------------------------------------- #

CHORD_QUALITIES_TO_EXPORT = [
    "min", "min7", "min9", "min6", "madd9", "min7b5",
    "maj", "maj7", "add9", "dom7",
    "dim", "dim7", "aug", "sus2", "sus4",
]

DEFAULT_BPM = 124


def build_chords():
    """All exported chord qualities, all 12 roots, held one bar."""
    for quality in CHORD_QUALITIES_TO_EXPORT:
        label = QUALITY_LABEL[quality]
        for pc in range(12):
            kn = safe_key_name(pc)
            root = note_number(pc, 3)
            ns = [Note(0, BAR * 0.98, p, 96) for p in chord_pitches(root, quality)]
            path = f"Chords/{label}/{kn}_{label}.mid"
            add(path, ns, DEFAULT_BPM, "chord", f"{kn} {label} chord",
                key=kn, scale=quality)


def build_progressions_by_scale():
    for pc in range(12):
        kn = safe_key_name(pc)
        for prog_name, degrees in MINOR_PROGRESSIONS.items():
            for fl_name, fl in EXTENSION_FLAVOURS.items():
                ns = realise_progression(pc, degrees, fl)
                path = (f"Progressions/By-Scale/{kn}-minor/"
                        f"{kn}m_{prog_name}_{fl_name}.mid")
                add(path, ns, DEFAULT_BPM, "progression",
                    f"{kn} minor {prog_name} ({fl_name})",
                    key=kn, scale="natural_minor")


def build_basslines_by_scale():
    patterns = ["offbeat_8ths", "rolling_16ths", "sustained",
                "root_octave_8ths", "hardstyle_offbeat", "reese_sustain"]
    prog = MINOR_PROGRESSIONS["i-VI-III-VII"]
    for pc in range(12):
        kn = safe_key_name(pc)
        for pat in patterns:
            ns = bassline(pc, prog, pat)
            path = f"Basslines/By-Scale/{kn}-minor/{kn}m_bass_{pat}.mid"
            add(path, ns, DEFAULT_BPM, "bassline",
                f"{kn} minor bassline — {pat}", key=kn, scale="natural_minor")


def build_melodies_by_scale():
    scales = ["natural_minor", "minor_pentatonic", "dorian", "harmonic_minor"]
    prog = MINOR_PROGRESSIONS["i-VI-III-VII"]
    for pc in range(12):
        kn = safe_key_name(pc)
        for sc in scales:
            for variant in range(2):
                seed = pc * 1000 + hash(sc) % 1000 + variant
                ns = melody(pc, prog, sc, seed)
                path = (f"Melodies/By-Scale/{kn}-minor/"
                        f"{kn}m_melody_{sc}_{variant+1}.mid")
                add(path, ns, DEFAULT_BPM, "melody",
                    f"{kn} {sc} melody v{variant+1}", key=kn, scale=sc)


def build_arps_by_scale():
    patterns = ["up", "down", "updown", "octave_up"]
    prog = MINOR_PROGRESSIONS["i-VI-III-VII"]
    for pc in range(12):
        kn = safe_key_name(pc)
        for pat in patterns:
            ns = arpeggio(pc, prog, pat, flavour=None)
            path = f"Arps/By-Scale/{kn}-minor/{kn}m_arp_{pat}.mid"
            add(path, ns, DEFAULT_BPM, "arp",
                f"{kn} minor arpeggio — {pat}", key=kn, scale="natural_minor")


def write_manifest():
    path = os.path.join(ROOT, "MANIFEST.csv")
    cols = ["file", "category", "key", "scale", "genre", "bpm", "bars",
            "notes", "description"]
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for row in sorted(MANIFEST, key=lambda r: r["file"]):
            w.writerow(row)


def main():
    build_chords()
    build_progressions_by_scale()
    build_basslines_by_scale()
    build_melodies_by_scale()
    build_arps_by_scale()
    # genre clips, drum patterns and arrangement templates
    import generate_genres
    generate_genres.build(add, MINOR_PROGRESSIONS, realise_progression,
                          bassline, melody, arpeggio)
    import drums
    drums.build(add_multi)
    import arrangements
    arrangements.build(add_multi, realise_progression, bassline, arpeggio)
    write_manifest()
    print(f"Generated {len(MANIFEST)} MIDI files.")
    by_cat: dict[str, int] = {}
    for r in MANIFEST:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + 1
    for k, v in sorted(by_cat.items()):
        print(f"  {k:12s} {v}")


if __name__ == "__main__":
    main()
