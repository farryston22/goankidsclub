# Goan Kids Club — notes for Claude (maintainer)

Goan Kids Club is a site for Goan children in the UK (ages 3–6), linked to the owner's YouTube channel that teaches
Konkani and Goan culture. Owner: Farryston (GitHub `farryston22`). Claude maintains the site: when he asks for a
change, make it, test it in the browser pane, show him what changed, then commit and push to `main`.

## Stack
- Plain HTML, CSS and JavaScript (ES modules). **No build step, no npm, no framework.** Keep it that way.
- Static hosting from this repo (see "Publishing" below). Every push to `main` goes live.
- No server, no database, no accounts. Progress is stored in the child's browser (`localStorage` key `gkc-play-v1`).
  Keep it ad-free and tracking-free (UK Age Appropriate Design Code). Never add analytics, ads or third-party
  scripts without the owner asking. Google Fonts is the only outside request.

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
- Goan Indo-Portuguese look: lime-wash cream `#FBF5E6`, azulejo indigo `#1F4E9E`, ochre `#E9B634`, pink, palm green,
  roof red `#B5442E`, white trim. Fonts: Fredoka (UI), Andika (letters, single-storey a and g for early readers).
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
