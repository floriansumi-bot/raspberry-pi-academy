"""
midilib.py — Zero-dependency Standard MIDI File (SMF) writer + music-theory toolkit.

No pip installs required: pure Python stdlib only. Writes Format-1 MIDI files
(tempo/meta track + note track) that load cleanly into Ableton, FL Studio,
Logic, Bitwig, Cubase, Studio One, Reaper, etc.

Conventions
-----------
- Time is expressed in BEATS (quarter notes). 1 bar of 4/4 == 4.0 beats.
- A "clip" is a list of Note objects. A Note is (start_beat, dur_beats, pitch, vel).
- MIDI note 60 == C4 (middle C) in the common DAW convention used here.
"""

from __future__ import annotations
import struct
from dataclasses import dataclass

TICKS_PER_BEAT = 480  # high resolution, standard for most DAWs


# --------------------------------------------------------------------------- #
#  Music theory
# --------------------------------------------------------------------------- #

# Pitch-class names (sharps). Index == semitone offset from C.
NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
NAME_TO_PC = {n: i for i, n in enumerate(NOTE_NAMES)}
# Common flat aliases so callers can pass "Bb", "Eb", etc.
NAME_TO_PC.update({"Db": 1, "Eb": 3, "Gb": 6, "Ab": 8, "Bb": 10})

# Filesystem-safe key labels (sharps spelled with 's' to avoid '#').
SAFE_NAMES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"]


def note_number(pitch_class: int, octave: int) -> int:
    """MIDI note number. octave 4 + pc 0 == C4 == 60."""
    return (octave + 1) * 12 + pitch_class


def safe_key_name(pc: int) -> str:
    return SAFE_NAMES[pc % 12]


# Chord quality -> interval pattern (semitones from root).
CHORD_INTERVALS = {
    # triads
    "min":      [0, 3, 7],
    "maj":      [0, 4, 7],
    "dim":      [0, 3, 6],
    "aug":      [0, 4, 8],
    "sus2":     [0, 2, 7],
    "sus4":     [0, 5, 7],
    # sevenths
    "min7":     [0, 3, 7, 10],
    "maj7":     [0, 4, 7, 11],
    "dom7":     [0, 4, 7, 10],
    "min7b5":   [0, 3, 6, 10],   # half-diminished
    "dim7":     [0, 3, 6, 9],
    "minMaj7":  [0, 3, 7, 11],
    # sixths
    "min6":     [0, 3, 7, 9],
    "maj6":     [0, 4, 7, 9],
    # ninths / adds (the EDM bread & butter)
    "add9":     [0, 4, 7, 14],
    "madd9":    [0, 3, 7, 14],
    "min9":     [0, 3, 7, 10, 14],
    "maj9":     [0, 4, 7, 11, 14],
    "dom9":     [0, 4, 7, 10, 14],
    "sus2add9": [0, 2, 7, 14],
}

# Human-readable folder/file labels per quality.
QUALITY_LABEL = {
    "min": "Minor", "maj": "Major", "dim": "Diminished", "aug": "Augmented",
    "sus2": "Sus2", "sus4": "Sus4",
    "min7": "Minor7", "maj7": "Major7", "dom7": "Dominant7",
    "min7b5": "HalfDim7", "dim7": "Dim7", "minMaj7": "MinMajor7",
    "min6": "Minor6", "maj6": "Major6",
    "add9": "Add9", "madd9": "MinorAdd9",
    "min9": "Minor9", "maj9": "Major9", "dom9": "Dominant9",
    "sus2add9": "Sus2Add9",
}

# Scale -> interval pattern (semitones from tonic).
SCALES = {
    "natural_minor":  [0, 2, 3, 5, 7, 8, 10],
    "harmonic_minor": [0, 2, 3, 5, 7, 8, 11],
    "melodic_minor":  [0, 2, 3, 5, 7, 9, 11],
    "dorian":         [0, 2, 3, 5, 7, 9, 10],
    "phrygian":       [0, 1, 3, 5, 7, 8, 10],
    "major":          [0, 2, 4, 5, 7, 9, 11],
    "minor_pentatonic": [0, 3, 5, 7, 10],
    "minor_blues":      [0, 3, 5, 6, 7, 10],
}

# Diatonic triad qualities for the natural-minor scale (i ii dim III iv v VI VII).
MINOR_DIATONIC_QUALITY = ["min", "dim", "maj", "min", "min", "maj", "maj"]
MAJOR_DIATONIC_QUALITY = ["maj", "min", "min", "maj", "maj", "min", "dim"]


def chord_pitches(root_note: int, quality: str) -> list[int]:
    return [root_note + iv for iv in CHORD_INTERVALS[quality]]


def scale_pitches(tonic_note: int, scale: str, octaves: int = 2) -> list[int]:
    pat = SCALES[scale]
    out = []
    for o in range(octaves):
        for iv in pat:
            out.append(tonic_note + 12 * o + iv)
    out.append(tonic_note + 12 * octaves)  # cap with the octave
    return out


# --------------------------------------------------------------------------- #
#  Note + MIDI writing
# --------------------------------------------------------------------------- #

@dataclass
class Note:
    start: float   # beats
    dur: float     # beats
    pitch: int     # MIDI note number
    vel: int = 96  # velocity 1..127


def _vlq_encode(value: int) -> bytes:
    """Variable-length quantity encoding for delta-times."""
    if value < 0:
        raise ValueError("negative delta time")
    out = bytearray([value & 0x7F])
    value >>= 7
    while value:
        out.insert(0, (value & 0x7F) | 0x80)
        value >>= 7
    return bytes(out)


def write_midi(path: str, notes: list[Note], bpm: float = 124.0,
               time_sig=(4, 4), track_name: str = "clip",
               program: int | None = None) -> None:
    """Write a Format-1 MIDI file: track 0 = tempo/meta, track 1 = notes."""
    tpb = TICKS_PER_BEAT

    # ---- Track 0: tempo + time signature ----
    meta = bytearray()
    meta += _vlq_encode(0) + b"\xFF\x03" + _len_prefixed(track_name.encode("ascii", "replace"))
    micros = int(round(60_000_000 / bpm))
    meta += _vlq_encode(0) + b"\xFF\x51\x03" + struct.pack(">I", micros)[1:]
    num, den = time_sig
    denpow = {1: 0, 2: 1, 4: 2, 8: 3, 16: 4}.get(den, 2)
    meta += _vlq_encode(0) + b"\xFF\x58\x04" + bytes([num, denpow, 24, 8])
    meta += _vlq_encode(0) + b"\xFF\x2F\x00"  # end of track
    track0 = b"MTrk" + struct.pack(">I", len(meta)) + bytes(meta)

    # ---- Track 1: notes ----
    events = []  # (tick, order, status, data1, data2)
    for n in notes:
        on_t = int(round(n.start * tpb))
        off_t = int(round((n.start + n.dur) * tpb))
        v = max(1, min(127, int(n.vel)))
        p = max(0, min(127, int(n.pitch)))
        # order: note-off (0) before note-on (1) at same tick
        events.append((off_t, 0, 0x80, p, 0))
        events.append((on_t, 1, 0x90, p, v))
    events.sort(key=lambda e: (e[0], e[1]))

    body = bytearray()
    if program is not None:
        body += _vlq_encode(0) + bytes([0xC0, program & 0x7F])
    prev = 0
    for tick, _order, status, d1, d2 in events:
        delta = tick - prev
        prev = tick
        body += _vlq_encode(delta) + bytes([status, d1, d2])
    body += _vlq_encode(0) + b"\xFF\x2F\x00"
    track1 = b"MTrk" + struct.pack(">I", len(body)) + bytes(body)

    header = b"MThd" + struct.pack(">IHHH", 6, 1, 2, tpb)
    with open(path, "wb") as f:
        f.write(header + track0 + track1)


def _len_prefixed(data: bytes) -> bytes:
    return _vlq_encode(len(data)) + data
