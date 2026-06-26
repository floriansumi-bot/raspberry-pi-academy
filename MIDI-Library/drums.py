"""
drums.py — Genre-accurate drum-pattern MIDI on the General-MIDI drum map
(channel 10 / index 9). Imported by generate.py. Drop a clip onto any drum
rack (Battery, Drum Rack, FPC, Geism) — 36=kick, 38=snare, 39=clap, 42=hat…

Patterns reflect the rhythm conventions in RESEARCH-NOTES.md:
four-on-the-floor for house/techno/trance/hard styles, half-time for
dubstep/future bass, swung boom-bap for lo-fi.
"""

from midilib import Note

# General MIDI percussion keys
KICK, RIM, SNARE, CLAP = 36, 37, 38, 39
CHH, PHH, OHH = 42, 44, 46
CRASH, RIDE = 49, 51
LOWTOM, HITOM, SHAKER, TAMB = 45, 50, 70, 54

STEP = 0.25  # one 16th note in beats; 16 steps per bar


def _steps(track_steps, pitch, vel, swing=0.0, bar=0):
    """Turn a list of 16th-step indices into Notes for one bar."""
    out = []
    for s in track_steps:
        t = bar * 4.0 + s * STEP
        if swing and s % 2 == 1:            # delay offbeat 16ths for groove
            t += STEP * swing
        out.append(Note(t, STEP * 0.9, pitch, vel))
    return out


# Per genre: dict of (pitch, steps, velocity) rows + swing amount.
# steps are 16th positions 0..15 within a bar.
PATTERNS = {
    "01_Deep-House": dict(swing=0.18, rows=[
        (KICK, [0, 4, 8, 12], 112), (CLAP, [4, 12], 100),
        (OHH, [2, 6, 10, 14], 92), (CHH, [0, 2, 4, 6, 8, 10, 12, 14], 70),
        (SHAKER, [1, 3, 5, 7, 9, 11, 13, 15], 55)]),
    "02_Future-House": dict(swing=0.0, rows=[
        (KICK, [0, 4, 8, 12], 116), (CLAP, [4, 12], 104),
        (OHH, [2, 6, 10, 14], 96), (CHH, list(range(16)), 64)]),
    "03_Progressive-House": dict(swing=0.0, rows=[
        (KICK, [0, 4, 8, 12], 116), (CLAP, [4, 12], 100),
        (OHH, [2, 6, 10, 14], 94), (CHH, [0, 2, 4, 6, 8, 10, 12, 14], 66),
        (RIDE, [0, 4, 8, 12], 60)]),
    "04_Tech-House": dict(swing=0.12, rows=[
        (KICK, [0, 4, 8, 12], 114), (CLAP, [4, 12], 96),
        (OHH, [2, 6, 10, 14], 90), (CHH, list(range(16)), 60),
        (RIM, [7, 15], 80), (SHAKER, [2, 6, 10, 14], 55)]),
    "05_Techno": dict(swing=0.0, rows=[
        (KICK, [0, 4, 8, 12], 118), (CLAP, [4, 12], 88),
        (OHH, [2, 6, 10, 14], 96), (CHH, list(range(16)), 58),
        (RIM, [3, 11], 70)]),
    "06_Melodic-Techno": dict(swing=0.0, rows=[
        (KICK, [0, 4, 8, 12], 114), (CLAP, [4, 12], 84),
        (OHH, [2, 6, 10, 14], 88), (CHH, [0, 2, 4, 6, 8, 10, 12, 14], 60),
        (SHAKER, [1, 3, 5, 7, 9, 11, 13, 15], 50)]),
    "07_Trance": dict(swing=0.0, rows=[
        (KICK, [0, 4, 8, 12], 118), (CLAP, [4, 12], 100),
        (OHH, [2, 6, 10, 14], 98), (CHH, list(range(16)), 62),
        (CRASH, [0], 90)]),
    "08_Hardstyle": dict(swing=0.0, rows=[
        (KICK, [0, 4, 8, 12], 122), (CLAP, [4, 12], 104),
        (OHH, [2, 6, 10, 14], 92), (CHH, [2, 6, 10, 14], 70)]),
    "09_Hardcore-Gabber": dict(swing=0.0, rows=[
        (KICK, [0, 4, 8, 12], 125), (CLAP, [4, 12], 100),
        (OHH, [2, 6, 10, 14], 90), (CHH, [0, 2, 4, 6, 8, 10, 12, 14], 64)]),
    "10_Dubstep": dict(swing=0.0, rows=[
        (KICK, [0, 10], 120), (SNARE, [8], 110),
        (CHH, [0, 2, 4, 6, 8, 10, 12, 14], 66), (OHH, [6, 14], 80)]),
    "11_Future-Bass": dict(swing=0.0, rows=[
        (KICK, [0, 6], 116), (SNARE, [8], 108),
        (CHH, list(range(16)), 60), (CHH, [7, 15], 90),  # hat rolls/accents
        (OHH, [12], 78)]),
    "12_Lofi-Chill": dict(swing=0.22, rows=[
        (KICK, [0, 6, 10], 100), (SNARE, [4, 12], 88), (RIM, [4, 12], 60),
        (CHH, [0, 2, 4, 6, 8, 10, 12, 14], 64)]),
}

GENRE_BPM = {
    "01_Deep-House": 122, "02_Future-House": 126, "03_Progressive-House": 128,
    "04_Tech-House": 126, "05_Techno": 130, "06_Melodic-Techno": 124,
    "07_Trance": 138, "08_Hardstyle": 150, "09_Hardcore-Gabber": 180,
    "10_Dubstep": 140, "11_Future-Bass": 150, "12_Lofi-Chill": 85,
}


def _render(rows, swing, bars=4, fill=True):
    notes = []
    for bar in range(bars):
        for pitch, steps, vel in rows:
            notes += _steps(steps, pitch, vel, swing=swing, bar=bar)
        if fill and bar == bars - 1:        # snare fill in the last bar
            notes += _steps([12, 13, 14, 15], SNARE, 96, bar=bar)
    return notes


def build(add_multi):
    for genre, spec in PATTERNS.items():
        bpm = GENRE_BPM[genre]
        rows, swing = spec["rows"], spec["swing"]

        full = _render(rows, swing, bars=4, fill=True)
        add_multi(f"Drums/By-Genre/{genre}/{genre}_beat_full.mid",
                  [dict(name="drums", notes=full, channel=9)],
                  bpm, "drums", f"{genre} drum groove (4 bars)", genre=genre)

        minimal_rows = [r for r in rows if r[0] in (KICK, CLAP, SNARE)]
        minimal = _render(minimal_rows, swing, bars=4, fill=False)
        add_multi(f"Drums/By-Genre/{genre}/{genre}_beat_minimal.mid",
                  [dict(name="drums", notes=minimal, channel=9)],
                  bpm, "drums", f"{genre} kick+clap only (4 bars)", genre=genre)

        top_rows = [r for r in rows if r[0] in (CHH, OHH, PHH, RIDE, SHAKER, TAMB, RIM)]
        tops = _render(top_rows, swing, bars=4, fill=False)
        add_multi(f"Drums/By-Genre/{genre}/{genre}_beat_tops.mid",
                  [dict(name="drums", notes=tops, channel=9)],
                  bpm, "drums", f"{genre} hats/percussion only (4 bars)", genre=genre)
