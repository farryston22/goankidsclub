# Goan Kids Club — notes for Claude (maintainer)

Goan Kids Club is a site for Goan children in the UK (ages 3–6), linked to the owner's YouTube channel that teaches
Konkani and Goan culture. Owner: Farryston (GitHub `farryston22`). Claude maintains the site: when he asks for a
change, make it, test it in the browser pane, show him what changed, then commit and push to `main`.

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
- **Play time** (Grown-ups → Play time): per child daily limit, "timer from now", +10/+20 min, no limit today, and a
  7-day chart. Counted every 5 s only on child screens while visible (`p.days`, `p.time` in app.js). When time is up
  a game in progress may finish (hard stop 2 min over), then the "Time for a break" nap screen locks the games. Keep `privacy.html` in step with what is stored.

## Layout
- `index.html` — small landing page with a "Play games" button.
- `games/` — the Play & Learn app (`games/README.md` explains it for humans).
  - `js/app.js` profiles, hub, stages, stars, sticker book, grown-ups area, `GAMES` list and categories.
  - `js/engine.js` shared mechanics: `choice` (tap the answer), `drag` (drag or tap-tap), `tapOrder`.
  - `js/games/*.js` one file per section: `heritage`, `numbers`, `letters`, `shapes`, `thinking`, `world`.
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
- Mascot: Tara the olive ridley turtle 🐢.
- UK English everywhere (colour, maths, mum, ladybird, 1p/£1). Phonics as pure sounds ("sss", not "ess").
- Big touch targets (iPad first), works at 375px phone width with no sideways scroll.
- Kind feedback: never "wrong!"; after 2 misses the right answer glows.

## Adding a game
1. Write a game object in the right `js/games/*.js` file: `{ id, title, icon, cat, minBand, color, desc, stages, start, question(ctx) }`
   (`start` = first unlocked stage for age bands 1/2/3; optional `rounds`, `roundsFor(stage)`, `board(ctx)`, `stars(mistakes, stage)`).
2. Use `choice` / `drag` / `tapOrder` from `engine.js` where possible.
3. Add it to `GAMES` in `js/app.js`, add the file to `FILES` in `sw.js` if new, bump `VERSION`.
4. Test every stage in the browser pane at tablet (768) and phone (375) sizes.

## Things to check with the owner
- Konkani spellings in `js/data.js` (`KONKANI`) — he teaches Konkani; ask before changing them.
- Recorded audio clips go in `games/audio/` and must be listed in `games/audio/manifest.json`.
