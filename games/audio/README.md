# Your own voice recordings

**The full list of recordings, with file names, is in [VOICEOVERS.md](VOICEOVERS.md).**

The games talk using the device's British English voice. That voice can't say pure phonics sounds
or Konkani words properly, so you can record your own and the games will use them automatically.

## How to add a recording

1. Record a short clip (one word or sound, about 1 second; trim the silence). MP3 or M4A (iPhone Voice Memos) both work.
2. Save it in this folder using the name below, e.g. `audio/konkani/tin.mp3` or `audio/konkani/tin.m4a`.
3. Add it to `audio/manifest.json`. Names without an extension are treated as `.mp3`:

```json
["konkani/ek", "konkani/don", "konkani/tin.m4a", "phonics/s", "phonics/a"]
```

4. Upload, then bump `VERSION` in `sw.js` (e.g. `gkc-v2`) so phones fetch the new files.

## Names the games look for

**Konkani** (`audio/konkani/…`)
- Numbers: `ek`, `don`, `tin`, `char`, `panch`, `sou`, `sat`, `att`, `nov`, `dha`
- Colours: `tambdo`, `pivllo`, `hirvo`, `nillo`, `kallo`, `dhovo`
- Animals: `gai`, `mazor`, `sunnem`, `nustem`, `hatti`, `makodd`, `kombo`, `dukor`

Please check these Romi spellings against your own teaching and change them in `js/data.js`
(the `KONKANI` list) if needed. The file name must match the spelling there.

**Phonics** (`audio/phonics/…`): one pure sound each, said the way UK schools teach it
(say "sss", not "ess"): `s a t p i n m d g o c k e u r h b f l j v w y z`

A phone voice-memo app is fine. Record somewhere quiet, close to the mic.
