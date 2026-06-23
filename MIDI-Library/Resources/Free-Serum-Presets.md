# 🎚️ Free Serum Presets — Curated Directory

> **Why I'm linking instead of generating presets:** Serum `.fxp` files wrap an
> **undocumented, closed Serum-specific binary blob** (Serum 1 uses an `XfsX`
> marker; Serum 2 changed the format entirely). Xfer never published the spec, so
> any third-party generator (e.g. the C# `SerumPresetGenerator`) explicitly warns
> that generated files "may or may not load." Hand-rolling binary presets blind is
> unreliable — **downloading existing free banks is the robust path.** The only
> way to author presets that reliably load is inside Serum itself.

All sources below are legitimately free. License notes are accurate as of the
research date — **always confirm the per-pack license before commercial release.**

---

## Multi-genre / all-rounders (start here)
| Source | What | License | Signup |
|---|---|---|---|
| **Cymatics – Serum Starter Pack** + [Free Download Vault](https://cymatics.fm/pages/free-download-vault) | 100 presets + 50 wavetables; vault has 1,000+ items | Royalty-free, commercial OK. **No redistribution/repackaging.** | Email |
| **ADSR – Free Presets** ([adsrsounds.com/synth/free](https://www.adsrsounds.com/synth/free/)) | Hundreds, sorted by genre (Serum + Serum 2) | 100% royalty-free | Free account |
| **Splice – Free Serum presets** ([splice.com/sounds/presets/serum](https://splice.com/sounds/presets/serum)) | Free section + monthly Free Drops; keep them even if you cancel | Royalty-free | Account |
| **PresetShare** ([presetshare.com/presets](https://presetshare.com/presets)) | 4,000+ community presets, preview before download | ⚠️ **Varies per uploader, often unstated** — fine for personal use, verify before commercial | No signup to download |
| **Ghosthack – Free Serum** ([ghosthack.de](https://www.ghosthack.de/free_sample_packs/free-serum-presets)) | 10 bass patches + 20 wavetables (+ Serum 2 set) | Royalty-free | Email |
| **Xfer (official)** | 626+ factory presets + 288 wavetables **bundled with Serum** — no standalone free pack exists | Included with license | n/a |

## By genre
- **Dubstep / Riddim / Trap / Future Bass:** Cymatics Starter Pack (bass patches) · Ghosthack free pack (Dubstep/Riddim/Trap/Future House).
- **Techno / Melodic / House:** Production Music Live ([productionmusiclive.com](https://www.productionmusiclive.com/collections/serum-presets)) — *mostly paid*, watch for free promos · Clash Music Studios Free Techno Pack (⚠️ small vendor, confirm license).
- **Hardstyle / Trance:** W.A. Production – [Free Hardstyle Serum Presets](https://www.waproduction.com/sounds/view/free-hardstyle-serum-presets) (25 presets — screeches/leads/kicks; free WAP account) · trance is best served by the multi-genre hubs above filtered by "trance."
- **Curated freebie roundups:** BPB ([bedroomproducersblog.com/free-download](https://bedroomproducersblog.com/free-download/)) links Loopmasters-25, Tunecraft "Cinematic Synths" 85, Francis Preve packs.

## ⚠️ Treat with caution
- **PresetShare / Reddit r/serum / "5000 free presets" aggregators** — licensing uploader-dependent or unstated; some re-share paid packs (piracy). Use as discovery, not for commercial releases.
- Any site advertising a "free Serum download" — almost always **skins or pirated full plugins**, not presets.

---

## How to install `.fxp` presets (Windows + OneDrive)
1. In Serum: **Menu → "Show Serum Presets Folder"** (don't guess the path — this opens the real one Serum scans).
2. Default path (Serum 1): `C:\Users\<You>\Documents\Xfer\Serum Presets\Presets\` — or, if Documents is redirected to OneDrive: `C:\Users\<You>\OneDrive\Documents\Xfer\Serum Presets\Presets\`. (Serum 2: `…\Xfer\Serum 2 Presets\`.)
3. Unzip the pack; copy `.fxp` files into a **named subfolder** under `…\Presets\`. Wavetables (`.wav`) → the sibling **`Tables`** folder; skins → **`Skins`**.
4. Back in Serum: **Menu → Rescan Folders on Disk.**
5. **OneDrive gotcha:** set the Xfer folder to **"Always keep on this device"** — if OneDrive offloads the files to online-only, Serum will fail to load them.

**"Never buy again" starter set:** Cymatics Vault + ADSR free hub + Ghosthack + Splice Free Drops + (personal use) PresetShare covers every genre listed in the MIDI library.

*Sources: github.com/potatoTeto/SerumPresetGenerator · spotify/pedalboard#277 · cymatics.fm · adsrsounds.com · splice.com · presetshare.com · ghosthack.de · bedroomproducersblog.com · waproduction.com · support.xferrecords.com*
