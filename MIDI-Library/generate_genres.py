"""
generate_genres.py — Genre-specific EDM clips, derived from cross-checked research
(BPMs, signature progressions, bass rhythms, voicings per genre). Imported and
called by generate.py. Degrees are 0-based scale degrees of NATURAL MINOR;
(degree, quality_override) tuples allow sus/borrowed chords.

Research consensus baked in (see RESEARCH-NOTES.md for sources):
  Deep House   122  i-VII-VI-VII (Am-G-F-G)   m9 stabs, offbeat root+octave bass
  Future House 126  i-v-VI-VII   (Em-Bm-C-D)  7th stabs, rolling/octave bass
  Prog House   128  i-VI-III-VII (Am-F-C-G)   add9 supersaws, rolling sub
  Tech House   126  i-VII-VI     (Am-G-F)     filtered stabs, offbeat 8ths
  Techno       130  i<->isus4    (Fm<->Fsus4) tonic-locked rolling 16ths
  Mel. Techno  124  i-VI-III-VII (Am-F-C-G)   m9, 2 bars/chord, roots-following
  Trance       138  i-VI-III-VII (Am-F-C-G)   harmonic-minor leads, rolling bass
  Hardstyle    150  i-VII-VI-III (Em-D-C-G)   reverse offbeat bass, screech octave-up
  Hardcore     180  i-VI-VII     (Am-F-G)     Phrygian, distorted kick-as-bass root
  Dubstep      140  i-VI-VII     (Am-F-G)     reese sustain, half-time
  Future Bass  150  i-VI-III-VII lush 9ths    octave bass, supersaw chords
  Lo-fi        85   i-iv-VII-III jazzy 7ths   swung, sustained sub
"""

from midilib import safe_key_name

# name, bpm, progression(degrees), bass_pattern, chord_flavour, melody_scale,
# arp_pattern, bars_per_chord
GENRES = [
    ("01_Deep-House",     122, [(0, None), (6, None), (5, None), (6, None)],
     "root_octave_8ths", "9", "minor_pentatonic", "up", 1.0),
    ("02_Future-House",   126, [(0, None), (4, None), (5, None), (6, None)],
     "rolling_16ths", "7", "natural_minor", "octave_up", 1.0),
    ("03_Progressive-House", 128, [(0, None), (5, None), (2, None), (6, None)],
     "rolling_16ths", "9", "natural_minor", "updown", 1.0),
    ("04_Tech-House",     126, [(0, None), (6, None), (5, None)],
     "offbeat_8ths", None, "natural_minor", "up", 1.0),
    ("05_Techno",         130, [(0, "min"), (0, "sus4"), (0, "min"), (0, "sus4")],
     "rolling_16ths", None, "phrygian", "up", 1.0),
    ("06_Melodic-Techno", 124, [(0, None), (5, None), (2, None), (6, None)],
     "rolling_16ths", "9", "natural_minor", "updown", 2.0),
    ("07_Trance",         138, [(0, None), (5, None), (2, None), (6, None)],
     "rolling_16ths", None, "harmonic_minor", "updown", 1.0),
    ("08_Hardstyle",      150, [(0, None), (6, None), (5, None), (2, None)],
     "hardstyle_offbeat", None, "harmonic_minor", "up", 1.0),
    ("09_Hardcore-Gabber", 180, [(0, None), (5, None), (6, None)],
     "sustained", None, "phrygian", "up", 1.0),
    ("10_Dubstep",        140, [(0, None), (5, None), (6, None)],
     "reese_sustain", None, "natural_minor", "up", 1.0),
    ("11_Future-Bass",    150, [(0, None), (5, None), (2, None), (6, None)],
     "root_octave_8ths", "9", "minor_pentatonic", "octave_up", 1.0),
    ("12_Lofi-Chill",      85, [(0, None), (3, None), (6, None), (2, None)],
     "sustained", "7", "dorian", "up", 1.0),
]

SIG_KEY_PC = 9  # A minor — signature key for melody/arp demos


def _prog_label(degrees) -> str:
    roman = {0: "i", 1: "ii", 2: "III", 3: "iv", 4: "v", 5: "VI", 6: "VII"}
    parts = []
    for d, q in degrees:
        r = roman[d % 7]
        if q == "sus4":
            r += "sus4"
        elif q == "maj":
            r = r.upper()
        parts.append(r)
    return "-".join(parts)


def build(add, _minor_progs, realise_progression, bassline, melody, arpeggio):
    for (gname, bpm, degrees, bass_pat, flavour, mel_scale, arp_pat, bpc) in GENRES:
        plabel = _prog_label(degrees)
        # Chords + bass in ALL 12 keys (transpose) — the reusable core.
        for pc in range(12):
            kn = safe_key_name(pc)
            pads = realise_progression(pc, degrees, flavour, bars_per_chord=bpc)
            add(f"Progressions/By-Genre/{gname}/{kn}m_{gname}_{plabel}_chords.mid",
                pads, bpm, "progression",
                f"{gname} chords — {kn} minor {plabel}",
                key=kn, scale="natural_minor", genre=gname)

            bass = bassline(pc, degrees, bass_pat, bars_per_chord=bpc)
            add(f"Basslines/By-Genre/{gname}/{kn}m_{gname}_bass_{bass_pat}.mid",
                bass, bpm, "bassline",
                f"{gname} bassline ({bass_pat}) — {kn} minor",
                key=kn, scale="natural_minor", genre=gname)

        # Melody + arp demo in the signature key (A minor).
        kn = safe_key_name(SIG_KEY_PC)
        for v in range(2):
            mel = melody(SIG_KEY_PC, degrees, mel_scale, seed=hash(gname) % 9999 + v,
                         octave=5, bars_per_chord=bpc)
            add(f"Melodies/By-Genre/{gname}/{kn}m_{gname}_melody_{mel_scale}_{v+1}.mid",
                mel, bpm, "melody",
                f"{gname} melody ({mel_scale}) v{v+1} — {kn}",
                key=kn, scale=mel_scale, genre=gname)

        arp = arpeggio(SIG_KEY_PC, degrees, arp_pat, flavour, bars_per_chord=bpc)
        add(f"Arps/By-Genre/{gname}/{kn}m_{gname}_arp_{arp_pat}.mid",
            arp, bpm, "arp",
            f"{gname} arp ({arp_pat}) — {kn}",
            key=kn, scale="natural_minor", genre=gname)
