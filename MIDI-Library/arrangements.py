"""
arrangements.py — One-file 8-bar starter templates per genre. Each .mid is a
multi-track Format-1 file: drop it in once and Chords / Bass / Arp / Drums each
land on their own track at the genre's tempo, in the genre's signature key.
A complete loop skeleton to build a track on. Imported by generate.py.
"""

from generate_genres import GENRES, SIG_KEY_PC
from midilib import safe_key_name
import drums


def build(add_multi, realise_progression, bassline, arpeggio):
    for (gname, bpm, degrees, bass_pat, flavour, mel_scale, arp_pat, bpc) in GENRES:
        kn = safe_key_name(SIG_KEY_PC)
        # Repeat the progression to span ~8 bars.
        prog_bars = len(degrees) * bpc
        repeats = max(1, round(8 / prog_bars))
        deg8 = degrees * repeats

        chords = realise_progression(SIG_KEY_PC, deg8, flavour, bars_per_chord=bpc)
        bass = bassline(SIG_KEY_PC, deg8, bass_pat, bars_per_chord=bpc)
        arp = arpeggio(SIG_KEY_PC, deg8, arp_pat, flavour, bars_per_chord=bpc)

        total_bars = int(round(prog_bars * repeats))
        spec = drums.PATTERNS[gname]
        drum_notes = drums._render(spec["rows"], spec["swing"],
                                   bars=total_bars, fill=True)

        parts = [
            dict(name="Chords", notes=chords, channel=0),
            dict(name="Bass", notes=bass, channel=1),
            dict(name="Arp", notes=arp, channel=2),
            dict(name="Drums", notes=drum_notes, channel=9),
        ]
        add_multi(f"Arrangement-Templates/{gname}/{kn}m_{gname}_template_{total_bars}bars.mid",
                  parts, bpm, "template",
                  f"{gname} {total_bars}-bar template (chords/bass/arp/drums) — {kn} minor",
                  key=kn, scale="natural_minor", genre=gname)
