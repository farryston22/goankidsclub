# Goan Kids Club – Play & Learn

Learning games for children aged 3 to 6, with a Goan look and feel. They work in any browser on iPad,
iPhone, Android and computers, and can be added to the home screen like an app (offline too).

- **26 games, 5 stages each**, in 7 sections: Goan Heritage, Numbers, Letters (UK phonics), Shapes & Colours,
  Thinking, Animals and Konkani.
- **3 age groups**: 3–4 (Little Stars), 4–5 (Busy Bees, Reception), 5–6 (Super Explorers, Year 1).
  Each age group starts at the right stage and sees the right games.
- **Earning**: up to 3 stars per round. Stars unlock the next stage and buy stickers in a sticker book.
  A child's own house from *Build a Goan House* joins the village at the top of the screen.
- **Grown-ups area** (gate question): profiles for several children, progress per game, voice settings.
- **Safe for kids**: no ads, no sign-up, no tracking. Progress is stored only on the device.
- **No build step**: plain HTML, CSS and JavaScript. Upload the folder and it works.

## Try it on this PC

```bash
node serve.js
```

Then open http://localhost:5180

## Put it on your website with GitHub Pages

### Option A – the website is already a GitHub Pages site (easiest)

1. Copy this whole folder into your website repository as a folder called `games`.
2. Commit and push:
   ```bash
   git add games
   git commit -m "Add Play & Learn games"
   git push
   ```
3. The games are live at `https://YOUR-SITE/games/` (or `https://USERNAME.github.io/REPO/games/`).
4. Add a big "Play games" button on your home page that links to `games/`.

### Option B – the website is on Wix, WordPress, Squarespace or similar

1. Create a new GitHub repository, for example `kids-games`, and upload the contents of this folder.
2. In the repository go to **Settings → Pages**. Under "Build and deployment" choose
   **Deploy from a branch**, branch `main`, folder `/ (root)`, then **Save**.
3. After a minute the games are live at `https://USERNAME.github.io/kids-games/`.
4. Either link to that address from your site, or embed it on a page:
   ```html
   <iframe src="https://USERNAME.github.io/kids-games/" style="width:100%;height:90vh;border:0;border-radius:16px"
           allow="autoplay; fullscreen" title="Goan Kids Club games"></iframe>
   ```
   A direct link works best on iPads, because children then get the full screen.
5. Optional, for your own address such as `play.yourdomain.co.uk`: in **Settings → Pages → Custom domain**,
   enter it, then add a `CNAME` record at your domain provider pointing to `USERNAME.github.io`.

## Updating the games

1. Change the files.
2. Open `sw.js` and bump `VERSION` (for example `gkc-v1` to `gkc-v2`). This tells phones and iPads to download the new version.
3. Commit and push.

## Your own voice (recommended)

The robot voice can't say pure phonics sounds or Konkani well. Record your own clips and drop them in
`audio/`. See `audio/README.md`. Please also check the Konkani spellings in `js/data.js`.

## Where things are

| File | What it does |
| --- | --- |
| `index.html` | The page |
| `css/app.css` | Look and feel (Goan colours, azulejo tiles) |
| `js/app.js` | Profiles, game list, stages, stars, sticker book, grown-ups area |
| `js/art.js` | Goan houses, church, palms and azulejo tiles (drawn in code) |
| `js/data.js` | Words, phonics, animals, colours, shapes, coins, Konkani |
| `js/games/*.js` | The games, one file per section |
| `audio/` | Your recordings |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline support and "Add to Home Screen" |
