#!/usr/bin/env bash
# Builds the sellable zip from the generated library. Reproducible: re-run anytime.
set -euo pipefail
cd "$(dirname "$0")"

PACK="EDM-MIDI-Essentials-Vol1"
STAGE="$(mktemp -d)/$PACK"
mkdir -p "$STAGE" dist

# Content folders (the actual product)
for d in Chords Progressions Basslines Melodies Arps Drums Arrangement-Templates; do
  cp -r "$d" "$STAGE/"
done

# Index + buyer-facing docs
cp MANIFEST.csv                       "$STAGE/MANIFEST.csv"
cp Marketplace/PRODUCT-README.txt     "$STAGE/README.txt"
cp Marketplace/BUYER-LICENSE.txt      "$STAGE/LICENSE.txt"
cp RESEARCH-NOTES.md                  "$STAGE/BONUS-EDM-Theory-Guide.md"

# Zip it (store at the pack-name root)
rm -f "dist/$PACK.zip"
( cd "$(dirname "$STAGE")" && zip -rq "$OLDPWD/dist/$PACK.zip" "$PACK" )

COUNT=$(find "$STAGE" -name '*.mid' | wc -l | tr -d ' ')
SIZE=$(du -h "dist/$PACK.zip" | cut -f1)
echo "Built dist/$PACK.zip  ($COUNT MIDI files, $SIZE)"
rm -rf "$(dirname "$STAGE")"
