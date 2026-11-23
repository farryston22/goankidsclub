# Goan Kids Club — notes for Claude (maintainer)

Goan Kids Club is a site for Goan children in the UK (ages 3–6), linked to the owner's YouTube channel that teaches
Konkani and Goan culture. Owner: GitHub `farryston22` (never put the owner's real name on the site or in the repo). Claude maintains the site: when the owner asks for a
change, make it, test it in the browser pane, show the owner what changed, then commit and push to `main`.

## Stack
- Plain HTML, CSS and JavaScript (ES modules). **No build step, no npm, no framework.** Keep it that way.
- Static hosting from this repo (see "Publishing" below). Every push to `main` goes live.
- No accounts. Progress is stored in the child's browser (`localStorage` key `gkc-play-v1`).
  Keep it ad-free and tracking-free (UK Age Appropriate Design Code). Never add analytics, ads or third-party
  scripts without the owner asking. Outside requests: Google Fonts, and Supabase only when a grown-up turns on saving.
- **Optional online saving** (Grown-ups → Save progress online): a family code (`WORD-WORD-WORD-1234`) is the key,
  only its SHA-256 hash is stored. Supabase project `goankidsclub` (ref `pqhyevbhnfeguqiiwygy`, London, free plan,
  GoaPages org). Schema in `supabase/migrations/`. Table `family_progress` is locked (RLS on, no policies); browsers
  can only call `gkc_load` / `gkc_save` / `gkc_delete`. Client: `games/js/sync.js` (merge: newest `updatedAt` per
  child wins, deleted ids are kept as tombstones), keys in `games/js/cloud-config.js` (publishable, safe to be public).
  Children must always be able to play without it.
- **Admin dashboard** `admin/` (noindex). Reads everything via `gkc_admin(password)`; the password's bcrypt hash is in
  `admin_secret` (set by SQL, never committed; the owner keeps the password in a local file). Data:
  - anonymous counts from `games/js/stats.js` → `gkc_track` → `usage_daily` (kinds: active, childday, newchild, play,
    quit, hour, sticker, lock, cloudon, limit, timer, support, share). No ids or names. Grown-ups can switch it off
    (Privacy card, `settings.stats`). Never sent from localhost (add `?stats=1` to test).
  - first names + progress ONLY for children a grown-up ticked in "Share progress" → `gkc_share` → `shared_children`
    (per-child secret `shareKey`, only its hash stored; unticking or deleting the child calls `gkc_unshare`).
  Never show names without that opt-in, and keep `privacy.html` in step. Schema: `supabase/migrations/002_dashboard.sql`.
- **Play time** (Grown-ups → Play time): per child daily limit, "timer from now", +10/+20 min, no limit today, and a
  7-day chart. Counted every 5 s only on child screens while visible (`p.days`, `p.time` in app.js). When time is up
  a game in progress may finish (hard stop 2 min over), then the "Time for a break" nap screen locks the games. Keep `privacy.html` in step with what is stored.

## Layout
- `index.html` — small landing page with a "Play games" button.
- `games/` — the Play & Learn app (`games/README.md` explains it for humans).
  - `js/app.js` profiles, hub, stages, stars, sticker book, grown-ups area, `GAMES` list and categories.
  - `js/engine.js` shared mechanics: `choice` (tap the answer), `drag` (drag or tap-tap), `tapOrder`.
  - `js/games/*.js` one file per section: `heritage`, `goa` (Discover Goa: 13 games), `bible` (Bible Stories: 13 picture stories + 13 games, prayers, Goan saints), `christmas` (8 games incl. kuswar, Goan star, crib is in bible), `numbers`, `times` (1–10 times tables), `letters`, `shapes`, `thinking`, `world`.
  - Goa facts live in `js/games/goa.js` with sources at the top. Goa has **3 districts** since 31 Dec 2025 (North Goa, South Goa,
    Kushavati). Konkani greetings there are drafts: the owner must check them.
  - Bible content: simple retellings, told gently for ages 3–6; prayers are the traditional English texts; Konkani prayers play only
    from the owner's recordings (audio/konkani/prayer-*.mp3). Do not use the KJV text (UK Crown copyright) or modern copyrighted Bibles.
  - Voiceovers: `games/audio/VOICEOVERS.md` (regenerate with `node tools/voiceovers.mjs`). Clips: `konkani/<word>`, `goa/<name-slug>`,
    and any sentence as `say/<sentence-slug>` (audio.js plays it instead of the robot voice).
  - `js/data.js` content (phonics in UK Letters and Sounds order, words, animals, colours, shapes, UK coins, Konkani).
  - `js/art.js` SVG art: Goan houses (balcão, oyster-shell windows, Mangalore roof), church, palms, azulejo tiles.
  - `js/audio.js` en-GB text-to-speech + recorded clips from `audio/` (listed in `audio/manifest.json`).
  - `css/app.css` all styles; Goan palette in CSS variables at the top.
  - `sw.js` offline cache. **Bump `VERSION` on every change** or iPads keep the old version.
- `serve.js` local preview: `node serve.js` → http://localhost:5180/games/

## Design rules (must keep)
- Colours come from the logo (`logo.png`, round badge: two waving Goan kids, church, palms, beach, sun):
  blue `#1D4F91` (G), yellow `#F3B72B` (o), orange `#E5572B` (a), green `#3A8A3F` (n), navy text `#142B57`,
  sea-blue wave `#4EA6DC`, yellow ring `#F8C33A`, cream background `#FDFBF3`. Tagline: LEARN • PLAY • DISCOVER.
  The wordmark "Goan" is always one colour per letter in that order.
- Goan Indo-Portuguese art on top: lime-washed houses, red Mangalore roofs `#B5442E`, white trim, azulejo tiles.
  Fonts: Fredoka (UI, matches the logo's rounded letters), Andika (letters, single-storey a and g for early readers).
- Mascot: Daisy the bunny 🐰 (a rabbit; renamed from Tara the turtle in Nov 2026).
- UK English everywhere (colour, maths, mum, ladybird, 1p/£1). Phonics as pure sounds ("sss", not "ess").
- Big touch targets (iPad first), works at 375px phone width with no sideways scroll.
- Kind feedback: never "wrong!"; after 2 misses the right answer glows.

## Adding a game
1. Write a game object in the right `js/games/*.js` file: `{ id, title, icon, cat, minBand, color, desc, stages, start, question(ctx) }`
   (`start` = first unlocked stage for age bands 1/2/3; optional `rounds`, `roundsFor(stage)`, `board(ctx)`, `stars(mistakes, stage)`).
2. Use `choice` / `drag` / `tapOrder` from `engine.js` where possible.
3. Add it to `GAMES` in `js/app.js`, add the file to `FILES` in `sw.js` if new, bump `VERSION`.
4. Test every stage in the browser pane at tablet (768) and phone (375) sizes.

- `audio/konkani/*.mp3` (35 words) are the owner's cloned voice made with VoiceStudio (local, Goan Konkani mode, text in
  Devanagari). The owner approved them; they can replace any with a real recording of the same name. Konkani prayers are
  never AI: real recordings only.
- English narration: `audio/say/*.mp3` (~1,300 sentences and sentence pieces) and `audio/num/<n>.mp3` (0–100, ordinals as
  `num/<n>th`) in the owner's cloned voice. `audio.js` plays a sentence's own clip, or, for sentences with numbers or
  the child's name, the pieces around them (name left out, still shown in the bubble); else the robot voice.
  New or changed sentences fall back to the robot voice until voiced. Scripts: `D:\Goan Kids Club\voice-tools\`.

## Things to check with the owner
- Konkani spellings in `js/data.js` (`KONKANI`) — the owner teaches Konkani; ask before changing them.
- Recorded audio clips go in `games/audio/` and must be listed in `games/audio/manifest.json`.
