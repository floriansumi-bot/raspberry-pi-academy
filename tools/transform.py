# -*- coding: utf-8 -*-
"""
Transform the finished handbook HTML fragments into the web app's content layer:
  content/chapters/<id>.html   (cleaned fragment with h2 anchor ids + widget hooks)
  content/manifest.json        (parts, chapters, sections, reading time)
  content/glossary.json        (term -> definition html)
  content/search-index.json    (per-chapter searchable text + headings)
Re-runnable.
"""
import os, re, json, html

SRC = r"C:\Users\flori\Documents\raspberry-pi-guide\build\chapters"
APP = r"C:\Users\flori\Documents\raspberry-pi-academy"
OUTCH = os.path.join(APP, "content", "chapters")

# id -> (n, raw title)
META = {
  "ch01":(1,"Meet the Raspberry Pi"),
  "ch02":(2,"Your Kit, Unboxed"),
  "ch03":(3,"The Absolute Basics"),
  "ch04":(4,"First Boot: Installing the Operating System"),
  "ch05":(5,"A Tour of the Desktop"),
  "ch06":(6,"The Terminal, Demystified"),
  "ch07":(7,"Files, Folders & Permissions"),
  "ch08":(8,"Installing & Updating Software"),
  "ch09":(9,"Getting Connected: Network & Remote Control"),
  "ch10":(10,"Storage, Backups & Booting from an SSD"),
  "ch11":(11,"Your First Code with Python"),
  "ch12":(12,"Physical Computing: The GPIO Pins"),
  "ch13":(13,"Project: A Media Centre for Your TV"),
  "ch14":(14,"Project: Retro Gaming"),
  "ch15":(15,"Project: Block Ads with Pi-hole"),
  "ch16":(16,"Project: Your Own Home Server & Private Cloud"),
  "ch17":(17,"Project: A Private Smart-Home Hub"),
  "ch18":(18,"Project: Host a Website & Self-Host with Docker"),
  "ch19":(19,"Project: Run AI on Your Pi"),
  "ch20":(20,"Security & Good Habits"),
  "ch21":(21,"Maintenance & Troubleshooting"),
  "ch22":(22,"Where to Go Next"),
  "apxA":(23,"Appendix A: Command Quick-Reference"),
  "glos":(24,"Glossary of Terms"),
}

PARTS = [
  ("getting-started","Getting Started","Box to working computer","From an unopened box to a working, connected machine you feel at home with.",
     ["ch01","ch02","ch03","ch04","ch05"]),
  ("learning-system","Learning the System","The core skills","The terminal, files, software and networking that every project relies on.",
     ["ch06","ch07","ch08","ch09","ch10"]),
  ("making-things","Making Things","Code & electronics","Write your first code, then make the Pi control real-world electronics.",
     ["ch11","ch12"]),
  ("projects","Projects","Seven things to build","Seven complete, self-contained builds. Do them in any order.",
     ["ch13","ch14","ch15","ch16","ch17","ch18","ch19"]),
  ("looking-after","Looking After It","Keep it healthy","Keep your Pi safe and healthy — and find your next adventure.",
     ["ch20","ch21","ch22"]),
  ("reference","Reference","Cheat-sheet & glossary","A command quick-reference and a plain-English glossary of every term.",
     ["apxA","glos"]),
]

# which interactive widget(s) to embed in which chapter, and where (after which h2 index, 0-based; -1 = before content end)
WIDGETS = {
  "ch06":[("terminal","after-intro")],     # simulated terminal sandbox
  "ch12":[("gpio","after-intro"),("resistor","end")],  # GPIO explorer + resistor calc
  "ch13":[("picker","after-intro")],        # project recommender lives at the start of Projects
}

def kind_of(cid):
    if cid=="apxA": return "appendix"
    if cid=="glos": return "glossary"
    n,t = META[cid]
    return "project" if t.startswith("Project:") else "chapter"

def clean_title(cid):
    n,t = META[cid]
    t = re.sub(r"^Appendix A:\s*","",t)
    t = re.sub(r"^Project:\s*","",t)
    if cid=="glos": return "Glossary of Terms"
    return t

def part_of(cid):
    for p in PARTS:
        if cid in p[4]: return p[0]
    return None

def sanitize(frag):
    frag = re.sub(r"(?is)<!doctype.*?>","",frag)
    frag = re.sub(r"(?is)</?html[^>]*>","",frag)
    frag = re.sub(r"(?is)<head.*?</head>","",frag)
    frag = re.sub(r"(?is)</?body[^>]*>","",frag)
    frag = re.sub(r"(?is)<style.*?</style>","",frag)
    frag = re.sub(r"(?is)<script.*?</script>","",frag)
    frag = re.sub(r"(?is)<h1[^>]*>(.*?)</h1>", r"<h2>\1</h2>", frag)
    frag = re.sub(r'(?is)\s+style="[^"]*"', "", frag)
    return frag.strip()

def strip_tags(s):
    s = re.sub(r"(?s)<[^>]+>"," ", s)
    s = html.unescape(s)
    return re.sub(r"\s+"," ", s).strip()

def slugify(text):
    s = re.sub(r"[^a-z0-9]+","-", strip_tags(text).lower()).strip("-")
    return s[:48] or "section"

def process_chapter(cid):
    raw = open(os.path.join(SRC, cid+".html"), encoding="utf-8").read()
    frag = sanitize(raw)

    # inject ids on h2 + collect sections
    sections=[]
    used=set()
    def repl_h2(m):
        attrs=m.group(1) or ""
        inner=m.group(2)
        base=slugify(inner); sid=base; k=2
        while sid in used: sid="%s-%d"%(base,k); k+=1
        used.add(sid)
        sections.append({"id":sid,"title":strip_tags(inner)})
        if "id=" in attrs: return m.group(0)
        return '<h2%s id="%s">%s</h2>'%(attrs, sid, inner)
    frag = re.sub(r"(?is)<h2([^>]*)>(.*?)</h2>", repl_h2, frag)

    # inject widget hooks
    hooks = WIDGETS.get(cid, [])
    if hooks:
        # split off lead paragraph to allow "after-intro" placement
        for w,pos in hooks:
            hook = '\n<div class="widget-mount" data-widget="%s"></div>\n'%w
            if pos=="after-intro":
                # place after first closing </p> of the lead
                m=re.search(r"(?is)</p>", frag)
                if m:
                    frag = frag[:m.end()] + hook + frag[m.end():]
                else:
                    frag = hook + frag
            else:  # end -> before the keyterms block if present, else append
                m=re.search(r'(?is)<div class="keyterms"', frag)
                if m: frag = frag[:m.start()] + hook + frag[m.start():]
                else: frag = frag + hook

    text = strip_tags(frag)
    words = len(text.split())
    out = open(os.path.join(OUTCH, cid+".html"),"w",encoding="utf-8")
    out.write(frag); out.close()
    return sections, words, text

# ---- run ----
manifest = {"title":"Raspberry Pi 5 Course","parts":[], "chapters":{}, "order":[]}
search=[]
order=[cid for p in PARTS for cid in p[4]]

for p in PARTS:
    pid,plabel,pshort,pblurb,ids = p
    manifest["parts"].append({"id":pid,"label":plabel,"short":pshort,"blurb":pblurb,"chapters":list(ids)})

for cid in order:
    sections, words, text = process_chapter(cid)
    n,_=META[cid]
    rt = max(3, round(words/200))
    has_w = [w for (w,_) in WIDGETS.get(cid,[])]
    entry = {
        "id":cid, "n":n, "title":clean_title(cid), "kind":kind_of(cid),
        "part":part_of(cid), "words":words, "read_min":rt, "sections":sections,
        "widgets":has_w
    }
    manifest["chapters"][cid]=entry
    manifest["order"].append(cid)
    search.append({"id":cid,"n":n,"title":clean_title(cid),"part":part_of(cid),
                   "kind":kind_of(cid),
                   "headings":[s["title"] for s in sections], "text":text})

json.dump(manifest, open(os.path.join(APP,"content","manifest.json"),"w",encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(search, open(os.path.join(APP,"content","search-index.json"),"w",encoding="utf-8"), ensure_ascii=False)

# ---- glossary ----
glos = open(os.path.join(SRC,"glos.html"), encoding="utf-8").read()
terms={}
for m in re.finditer(r"(?is)<tr>\s*<td>\s*<strong>(.*?)</strong>\s*</td>\s*<td>(.*?)</td>\s*</tr>", glos):
    term = strip_tags(m.group(1))
    definition = m.group(2).strip()
    if term and term.lower()!="term":
        terms[term]=definition
glossary=[{"term":k,"def":v} for k,v in sorted(terms.items(), key=lambda kv: kv[0].lower())]
json.dump(glossary, open(os.path.join(APP,"content","glossary.json"),"w",encoding="utf-8"), ensure_ascii=False, indent=1)

print("chapters:", len(order))
print("glossary terms:", len(glossary))
print("manifest parts:", len(manifest["parts"]))
si = os.path.getsize(os.path.join(APP,"content","search-index.json"))
print("search-index size: %.0f KB"%(si/1024))
print("total words:", sum(manifest["chapters"][c]["words"] for c in order))
print("sample chapter ch12 sections:", [s["id"] for s in manifest["chapters"]["ch12"]["sections"]][:6])
