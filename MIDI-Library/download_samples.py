#!/usr/bin/env python3
"""
download_samples.py — License-aware free-sample fetcher (Freesound API).

Freesound is the one big free source designed for *programmatic* download with
explicit per-file Creative-Commons licensing — perfect for legally building a
personal EDM/techno/hardcore sample library. This script searches curated
queries, keeps only commercially-safe licenses (CC0 + CC-BY), downloads the
high-quality preview of each result, and records full attribution in a
per-folder LICENSES.csv so you stay compliant.

Zero third-party deps (urllib only).

────────────────────────────────────────────────────────────────────────────
SETUP (2 minutes, free):
  1. Make a free account at https://freesound.org
  2. Get an API key: https://freesound.org/apiv2/apply/  (choose a token/"API key")
  3. Run:   FREESOUND_TOKEN=your_key  python3 download_samples.py
            (or:  python3 download_samples.py --token your_key)

USEFUL FLAGS:
  --limit N       results per query   (default 8)
  --categories a,b limit to some categories (default: all)
  --cc0-only      only public-domain CC0 sounds (no attribution ever needed)
  --out DIR       output folder       (default ./Samples)
  --list          print the query plan and exit

NOTES:
  • Previews are high-quality MP3 (~128kbps). For lossless WAV originals,
    Freesound requires OAuth2 user auth + the /download/ endpoint — out of
    scope here; the previews are production-usable for most purposes.
  • CC-BY sounds REQUIRE crediting the author — LICENSES.csv has everything you
    need. CC0 needs no credit. The script never downloads CC-BY-NC.
  • This couldn't be live-tested in the build sandbox (Freesound was outside the
    sandbox's network allowlist); it runs normally on your own machine.
────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations
import argparse
import csv
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

API = "https://freesound.org/apiv2"
SAFE_LICENSES_ALL = ["Creative Commons 0", "Attribution"]   # CC0 + CC-BY
SAFE_LICENSES_CC0 = ["Creative Commons 0"]

# Curated query plan — what a producer actually needs, by genre/category.
QUERY_PLAN = {
    "Kicks-Techno":      ["techno kick", "rumble kick", "hard techno kick"],
    "Kicks-Hardcore":    ["gabber kick", "hardcore kick", "distorted kick"],
    "Kicks-House":       ["house kick", "deep house kick", "punchy kick"],
    "Claps-Snares":      ["clap", "snare", "rim shot"],
    "Hats-Percussion":   ["closed hihat", "open hat", "shaker percussion", "ride cymbal"],
    "Bass-Subs":         ["sub bass one shot", "reese bass", "808 bass"],
    "Synth-Stabs":       ["synth stab", "hoover stab", "pluck one shot"],
    "Screeches-Leads":   ["hardstyle screech", "supersaw lead"],
    "FX-Risers":         ["riser", "uplifter sweep", "downlifter"],
    "FX-Impacts":        ["impact hit", "boom impact", "cymbal crash reverse"],
    "Vocals":            ["vocal chop", "acapella vocal loop", "vox shot"],
    "Atmospheres":       ["dark atmosphere", "drone texture", "ambient pad texture"],
}


def _req(url: str, token: str, retries: int = 4):
    headers = {"Authorization": f"Token {token}", "User-Agent": "edm-midi-lib/1.0"}
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            if i == retries - 1:
                raise
            time.sleep(2 ** i)
    return None


def _download(url: str, dest: str, retries: int = 4):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "edm-midi-lib/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
                f.write(r.read())
            return True
        except Exception:
            if i == retries - 1:
                return False
            time.sleep(2 ** i)
    return False


def _safe(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("_")[:60] or "sound"


def search(token, query, licenses, limit):
    flt = " OR ".join(f'license:"{l}"' for l in licenses)
    params = urllib.parse.urlencode({
        "query": query, "filter": flt, "page_size": limit,
        "sort": "rating_desc",
        "fields": "id,name,username,license,previews,duration,tags",
    })
    data = _req(f"{API}/search/text/?{params}", token)
    return (data or {}).get("results", [])


def main():
    ap = argparse.ArgumentParser(description="Freesound license-aware sample fetcher")
    ap.add_argument("--token", default=os.environ.get("FREESOUND_TOKEN"))
    ap.add_argument("--limit", type=int, default=8)
    ap.add_argument("--out", default="Samples")
    ap.add_argument("--categories", default="")
    ap.add_argument("--cc0-only", action="store_true")
    ap.add_argument("--list", action="store_true")
    args = ap.parse_args()

    plan = QUERY_PLAN
    if args.categories:
        wanted = {c.strip() for c in args.categories.split(",")}
        plan = {k: v for k, v in plan.items() if k in wanted}

    if args.list:
        for cat, qs in plan.items():
            print(f"{cat}: {', '.join(qs)}")
        return

    if not args.token:
        sys.exit("No API token. Get a free key at https://freesound.org/apiv2/apply/ "
                 "then:  FREESOUND_TOKEN=key python3 download_samples.py  "
                 "(see the header of this file).")

    licenses = SAFE_LICENSES_CC0 if args.cc0_only else SAFE_LICENSES_ALL
    total = 0
    for cat, queries in plan.items():
        cat_dir = os.path.join(args.out, cat)
        os.makedirs(cat_dir, exist_ok=True)
        lic_path = os.path.join(cat_dir, "LICENSES.csv")
        new_file = not os.path.exists(lic_path)
        with open(lic_path, "a", newline="") as lf:
            w = csv.writer(lf)
            if new_file:
                w.writerow(["file", "sound_id", "title", "author",
                            "license", "freesound_url", "attribution_text"])
            for q in queries:
                print(f"[{cat}] searching: {q!r}")
                for s in search(args.token, q, licenses, args.limit):
                    prev = (s.get("previews") or {}).get("preview-hq-mp3")
                    if not prev:
                        continue
                    fname = f"{s['id']}_{_safe(s['name'])}.mp3"
                    dest = os.path.join(cat_dir, fname)
                    if os.path.exists(dest):
                        continue
                    if _download(prev, dest):
                        total += 1
                        url = f"https://freesound.org/s/{s['id']}/"
                        attr = (f'"{s["name"]}" by {s["username"]} — {s["license"]} '
                                f'({url})')
                        w.writerow([fname, s["id"], s["name"], s["username"],
                                    s["license"], url, attr])
                        print(f"    ✓ {fname}  [{s['license']}]")
                    time.sleep(0.4)   # be polite to the API
    print(f"\nDone. Downloaded {total} samples into '{args.out}/'. "
          f"Credit CC-BY authors using each folder's LICENSES.csv.")


if __name__ == "__main__":
    main()
