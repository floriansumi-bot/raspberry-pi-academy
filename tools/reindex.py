# -*- coding: utf-8 -*-
"""
Rebuild the DERIVED content data (manifest sections/word-counts, search index,
glossary JSON) from the ALREADY-PROCESSED academy chapter fragments.

Unlike transform.py (which builds the academy content from the personal PDF
source), this reads content/chapters/*.html as-is — so manual/edited chapter
content stays the source of truth and is never clobbered. Run after editing any
chapter HTML.
"""
import os, re, json

APP = r"C:\Users\flori\Documents\raspberry-pi-academy"
CHDIR = os.path.join(APP, "content", "chapters")

def strip_tags(s):
    s = re.sub(r"(?s)<[^>]+>", " ", s)
    import html as _h
    s = _h.unescape(s)
    return re.sub(r"\s+", " ", s).strip()

manifest = json.load(open(os.path.join(APP, "content", "manifest.json"), encoding="utf-8"))
order = manifest["order"]
search = []

for cid in order:
    raw = open(os.path.join(CHDIR, cid + ".html"), encoding="utf-8").read()
    sections = []
    for m in re.finditer(r'(?is)<h2[^>]*\bid="([^"]+)"[^>]*>(.*?)</h2>', raw):
        sections.append({"id": m.group(1), "title": strip_tags(m.group(2))})
    text = strip_tags(raw)
    words = len(text.split())
    ch = manifest["chapters"][cid]
    ch["sections"] = sections
    ch["words"] = words
    ch["read_min"] = max(3, round(words / 200))
    search.append({"id": cid, "n": ch["n"], "title": ch["title"], "part": ch["part"],
                   "kind": ch["kind"], "headings": [s["title"] for s in sections], "text": text})

json.dump(manifest, open(os.path.join(APP, "content", "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(search, open(os.path.join(APP, "content", "search-index.json"), "w", encoding="utf-8"), ensure_ascii=False)

# glossary from the (edited) glossary chapter
glos = open(os.path.join(CHDIR, "glos.html"), encoding="utf-8").read()
terms = {}
for m in re.finditer(r"(?is)<tr>\s*<td>\s*<strong>(.*?)</strong>\s*</td>\s*<td>(.*?)</td>\s*</tr>", glos):
    term = strip_tags(m.group(1)); definition = m.group(2).strip()
    if term and term.lower() != "term":
        terms[term] = definition
glossary = [{"term": k, "def": v} for k, v in sorted(terms.items(), key=lambda kv: kv[0].lower())]
json.dump(glossary, open(os.path.join(APP, "content", "glossary.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

print("reindexed", len(order), "chapters |", len(glossary), "glossary terms |",
      "search %.0fKB" % (os.path.getsize(os.path.join(APP, 'content', 'search-index.json')) / 1024))
