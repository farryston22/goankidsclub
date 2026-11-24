// Goan Kids Club — Play & Learn. App shell: profiles, hub, stages, rounds, rewards, sticker book, grown-ups area.
import { h, $, sleep, pick, rnd, range } from './util.js';
import { speak, stop, onTalk, bindSettings, loadClips, sfx, setChildName } from './audio.js';
import * as N from './games/numbers.js';
import * as L from './games/letters.js';
import * as SH from './games/shapes.js';
import * as T from './games/thinking.js';
import * as W from './games/world.js';
import * as HG from './games/heritage.js';
import * as G from './games/goa.js';
import * as TT from './games/times.js';
import * as BB from './games/bible.js';
import * as XM from './games/christmas.js';
import { villageSVG, tileURL } from './art.js';
import { cloudReady, newCode, normCode, loadFamily, saveFamily, deleteFamily, merge } from './sync.js';
import { track, once, statsOn, deviceKind, installed, newShareKey, shareChild, unshareChild } from './stats.js';

export const GAMES = [
  HG.goalife, G.mapgame, G.villages, G.jigsaw, G.quizferry,   // owner's picks: always first
  HG.house, HG.poder, HG.tiles,
  G.festivals, G.konkanitalk, G.symbols, G.safari, G.seasons, G.kitchen, G.rhythm, G.railway, G.monuments,
  BB.stories, BB.noah, BB.creation, BB.lostsheep, BB.loaves, BB.coat, BB.storyorder, BB.banimals, BB.bpuzzles, BB.verses, BB.crib, BB.churchyear, BB.saints, BB.prayers,
  XM.kuswar, XM.xstar, XM.tree, XM.advent, XM.presents, XM.jingle, XM.xsounds, XM.xpuzzles,
  N.count, N.bubbles, N.more, N.frog, N.add, N.shop, TT.times,
  L.sounds, L.trace, L.firstsound, L.words, L.abc,
  SH.sorter, SH.colours, SH.patterns,
  T.memory, T.shadows, T.odd, T.sizes,
  W.animals, W.homes, W.babies, W.konkani,
];
const CATS = [
  { id: 'all', label: 'All games', icon: '✨' }, { id: 'heritage', label: 'Goan Heritage', icon: '🏡' }, { id: 'goa', label: 'Discover Goa', icon: '🗺️' }, { id: 'bible', label: 'Bible Stories', icon: '✝️' }, { id: 'christmas', label: 'Christmas', icon: '🎄' }, { id: 'numbers', label: 'Numbers', icon: '🔢' },
  { id: 'letters', label: 'Letters', icon: '🔤' }, { id: 'shapes', label: 'Shapes & Colours', icon: '🎨' },
  { id: 'thinking', label: 'Thinking', icon: '🧠' }, { id: 'animals', label: 'Animals', icon: '🦁' },
  { id: 'konkani', label: 'Konkani', icon: '🌴' },
];
const BANDS = [
  { id: 1, age: '3–4', name: 'Little Stars', uk: 'Pre-school / Nursery', icon: '⭐' },
  { id: 2, age: '4–5', name: 'Busy Bees', uk: 'Reception', icon: '🐝' },
  { id: 3, age: '5–6', name: 'Super Explorers', uk: 'Year 1', icon: '🚀' },
];
const AVATARS = ['🐯', '🐼', '🦊', '🐰', '🐸', '🐵', '🦁', '🐨', '🐢', '🦀', '🐬', '🦄', '🐙', '🦚'];
const PRAISE = ['Brilliant!', 'Well done!', 'Fantastic!', 'Super!', 'Spot on!', 'Amazing!', 'Good thinking!', 'Yes!', 'Great job!', 'Wonderful!'];
const STICKERS = [
  { page: 'Goan Heritage', icon: '⛪', items: ['⛪', '🏡', '🚲', '🫓', '🥭', '🥥', '🎭', '🥁', '⭐', '🍰', '🛺', '🪔'] },
  { page: 'Goa Beach', icon: '🏖️', items: ['🏖️', '🌴', '🦀', '🐚', '⛵', '🐬', '🐢', '🌅', '🍍', '🦐', '🚣', '🐟'] },
  { page: 'Animals', icon: '🦁', items: ['🦁', '🐯', '🐼', '🦒', '🐘', '🦓', '🦘', '🐨', '🦩', '🦔', '🦦', '🐳'] },
  { page: 'Space', icon: '🚀', items: ['🚀', '🌙', '🌟', '🪐', '👽', '🛸', '☄️', '🌍', '🌞', '🔭', '👩‍🚀', '🌈'] },
  { page: 'Things that go', icon: '🚂', items: ['🚂', '🚌', '🚒', '🚑', '🚜', '🚲', '✈️', '🚁', '🛵', '🚤', '🏎️', '🚃'] },
  { page: 'Bible Stories', icon: '🌈', items: ['🌈', '🕊️', '⭐', '🐑', '🐋', '🦁', '🧥', '🧺', '🍞', '🐟', '👑', '✝️'] },
  { page: 'Christmas', icon: '🎄', items: ['🎄', '🌟', '🎁', '🔔', '⛄', '🦌', '🕯️', '🧦', '🎅', '🥟', '🍰', '👼'] },
  { page: 'Yummy', icon: '🍦', items: ['🍦', '🍉', '🍓', '🧁', '🍕', '🍩', '🍪', '🍨', '🥞', '🍫', '🍭', '🍿'] },
];
const price = i => (i >= 10 ? 10 : 5);

/* ---------- storage (this device only; nothing is sent anywhere) ---------- */
const KEY = 'gkc-play-v1';
const blank = () => ({ profiles: [], deleted: [], current: null, settings: { rate: 0.9, voice: true, sfx: true, stats: true }, sync: { code: null, last: 0, status: '' } });
let S;
try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { S = blank(); }
/** Save on this device. Pass the child whose progress changed so online saving knows which copy is newest. */
const save = changed => {
  if (changed) changed.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ }
  if (changed !== false) queueSync();
  if (changed && changed.share) queueShare(changed);
};

/* ---------- optional online saving (family code) ---------- */
S.deleted = S.deleted || []; S.sync = S.sync || { code: null, last: 0, status: '' };
let syncTimer = null, syncing = null;
function queueSync(ms = 2000) { if (S.sync.code && cloudReady()) { clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, ms); } }
async function syncNow() {
  if (!S.sync.code || !cloudReady()) return false;
  if (syncing) return syncing;
  syncing = (async () => {
    try {
      const remote = await loadFamily(S.sync.code);
      const m = merge({ profiles: S.profiles, deleted: S.deleted }, remote && remote.data);
      S.profiles = m.profiles; S.deleted = m.deleted;
      if (!S.profiles.some(p => p.id === S.current)) S.current = S.profiles[0]?.id || null;
      await saveFamily(S.sync.code, { v: 1, profiles: S.profiles, deleted: S.deleted });
      S.sync.last = Date.now(); S.sync.status = 'ok';
      return true;
    } catch (e) { S.sync.status = 'offline'; return false; }
    finally { save(false); syncing = null; }
  })();
  return syncing;
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') queueSync(500); });
bindSettings(S.settings);
if (S.settings.stats == null) S.settings.stats = true;
statsOn(S.settings.stats);
const me = () => S.profiles.find(p => p.id === S.current);
const gstate = (p, g) => (p.games[g.id] = p.games[g.id] || { best: [], plays: 0 });
const unlocked = (p, g, s) => s <= g.start[p.band - 1] || (gstate(p, g).best[s - 1] || 0) >= 2;
const gameStars = (p, g) => gstate(p, g).best.reduce((a, b) => a + (b || 0), 0);

/* ---------- play time: a daily limit and a "timer from now", set by grown-ups ----------
   p.days = { 'YYYY-MM-DD': seconds played }, p.time = { limit, day, extra, timerDay, timerEnd, off }.
   Time only counts while a child's screen is open and visible. When it runs out, Daisy naps and the games lock. */
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const usedSecs = (p, day = dayKey()) => (p.days && p.days[day]) || 0;
const ptime = p => (p.time = p.time || {});
function allowSecs(p) {
  const t = ptime(p), d = dayKey();
  if (t.off === d) return Infinity;
  let a = t.limit ? t.limit * 60 + (t.day === d ? t.extra || 0 : 0) : Infinity;
  if (t.timerDay === d && t.timerEnd != null) a = Math.min(a, t.timerEnd);
  return a;
}
const leftSecs = p => allowSecs(p) - usedSecs(p);
const isLocked = p => leftSecs(p) <= 0;
const fmtMins = s => { const m = Math.round(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };
function setTimer(p, mins) { const t = ptime(p); t.timerDay = dayKey(); t.timerEnd = usedSecs(p) + mins * 60; t.off = null; }
function giveMore(p, mins) {
  const t = ptime(p), d = dayKey(), u = usedSecs(p);
  if (t.timerDay === d && t.timerEnd != null) t.timerEnd = Math.max(u, t.timerEnd) + mins * 60;
  if (t.limit) { const base = t.limit * 60, cur = base + (t.day === d ? t.extra || 0 : 0); t.day = d; t.extra = Math.max(u, cur) + mins * 60 - base; }
}
let kidScreen = false, inGame = false, warned = '', lastTick = Date.now(), lastStore = 0;
const kidMode = (on, game = false) => { kidScreen = on; inGame = game; };
function clockText(p) { const l = leftSecs(p); return l <= 0 ? '0 min' : l < 60 ? 'under 1 min' : `${Math.ceil(l / 60)} min`; }
const clockChip = p => (allowSecs(p) === Infinity ? null
  : h('span', { class: 'chip clock' + (leftSecs(p) <= 120 ? ' low' : ''), id: 'clock', title: 'Play time left today', 'aria-label': 'Play time left' }, '⏳ ', h('b', {}, clockText(p))));
setInterval(() => {
  const now = Date.now(), dt = Math.min(15, (now - lastTick) / 1000); lastTick = now;
  const p = me();
  if (!p || !kidScreen || document.visibilityState !== 'visible') return;
  const d = dayKey(); p.days = p.days || {}; p.days[d] = (p.days[d] || 0) + dt;
  const keys = Object.keys(p.days).sort(); while (keys.length > 14) delete p.days[keys.shift()];
  if (now - lastStore > 30000) { lastStore = now; p.updatedAt = now; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } }
  const c = $('#clock'); if (c) { c.querySelector('b').textContent = clockText(p); c.classList.toggle('low', leftSecs(p) <= 120); }
  const left = leftSecs(p), tag = p.id + d + allowSecs(p);
  if (left > 0 && left <= 120 && !inGame && warned !== tag) { warned = tag; say(`${p.name}, two more minutes, then it's time for a break.`); }
  if (left <= 0 && (!inGame || left <= -120)) lockScreen();
}, 5000);

/* ---------- opt-in sharing: a grown-up ticks "Share progress with Goan Kids Club" for a child ---------- */
const shareTimers = {};
function shareData(p) {
  const last7 = range(0, 6).map(i => { const d = new Date(); d.setDate(d.getDate() - i); return Math.round(usedSecs(p, dayKey(d))); });
  return {
    id: p.id, name: String(p.name).slice(0, 20), avatar: p.avatar, band: p.band, stars: p.stars, total: p.total, stickers: p.stickers.length,
    games: Object.fromEntries(Object.entries(p.games || {}).filter(([, g]) => g.plays > 0).map(([id, g]) => [id, { b: (g.best || []).map(x => x || 0), p: g.plays || 0 }])),
    today: last7[0], week: last7.reduce((a, b) => a + b, 0), last: (p.log && p.log[0] && p.log[0].t) || null,
    limit: (p.time && p.time.limit) || 0,
  };
}
function queueShare(p, ms = 3000) {
  if (!p.share || !p.shareKey) return;
  clearTimeout(shareTimers[p.id]);
  shareTimers[p.id] = setTimeout(() => shareChild(p.id, p.shareKey, shareData(p)).catch(() => {}), ms);
}
document.addEventListener('visibilitychange', () => { const p = me(); if (document.visibilityState === 'hidden' && p && p.share) queueShare(p, 0); });

/* ---------- screen + mascot ---------- */
const app = $('#app');
let run = 0, lastSaid = '';
function screen(...nodes) { app.innerHTML = ''; app.append(...nodes.filter(n => n != null && n !== false)); app.scrollTop = 0; window.scrollTo(0, 0); }
function mascot(text = '') {
  return h('div', { class: 'mascotrow' },
    h('button', { class: 'mascot', 'aria-label': 'Daisy the bunny', onclick: () => say(lastSaid || 'Hello! I am Daisy the bunny.') }, '🐰'),
    h('button', { class: 'speech', id: 'speech', onclick: () => say(lastSaid) }, text));
}
onTalk(on => document.querySelectorAll('.mascot').forEach(m => m.classList.toggle('talk', on)));
function setBubble(t) { lastSaid = t; const b = $('#speech'); if (b) b.textContent = t; }
function say(text, parts) { setBubble(text); setChildName(me()?.name); return speak(parts || [text], text); }
/* Goan village skyline with an azulejo tile band; the child's own house (from Build a Goan House) joins the street. */
const village = p => h('div', { class: 'village' }, h('div', { class: 'sky', html: villageSVG(p && p.house) }), h('div', { class: 'azulejo' }));
/* Wordmark in the logo's colours: blue G, yellow o, orange a, green n, navy "Kids Club". */
const brand = () => h('span', { class: 'brand' }, h('span', { class: 'b1' }, 'G'), h('span', { class: 'b2' }, 'o'), h('span', { class: 'b3' }, 'a'), h('span', { class: 'b4' }, 'n'), ' Kids Club');
const tagline = () => h('div', { class: 'tagline' }, 'LEARN ', h('i', { class: 'd1' }, '•'), ' PLAY ', h('i', { class: 'd2' }, '•'), ' DISCOVER');
function top(left, title, right = []) {
  return h('header', { class: 'top' }, left, h('div', { class: 'ttl' }, title), ...right);
}
const iconBtn = (icon, label, fn, cls = '') => h('button', { class: 'ibtn ' + cls, 'aria-label': label, title: label, onclick: () => { sfx.tap(); fn(); } }, icon);
const starChip = p => h('button', { class: 'chip star', onclick: () => stickers(), 'aria-label': 'My stars' }, '⭐ ', h('b', { id: 'starcount' }, String(p.stars)));

/* ---------- effects ---------- */
export function sparkle(el) {
  if (!el || !el.getBoundingClientRect) return;
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, d = 50 + Math.random() * 30;
    const s = h('span', { class: 'spark', style: `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px` }, pick(['⭐', '✨', '💫']));
    document.body.append(s); setTimeout(() => s.remove(), 800);
  }
}
function confetti(n = 80) {
  const cols = ['#FF6B6B', '#FFC542', '#4ECDC4', '#6C5CE7', '#00B894', '#FD79A8'];
  for (let i = 0; i < n; i++) {
    const c = h('i', { class: 'confetti', style: `left:${Math.random() * 100}vw;background:${pick(cols)};animation-duration:${1.8 + Math.random() * 1.8}s;animation-delay:${Math.random() * 0.4}s;border-radius:${Math.random() < 0.5 ? '50%' : '3px'}` });
    document.body.append(c); setTimeout(() => c.remove(), 4500);
  }
}

/* ---------- who's playing ---------- */
function who() {
  run++; stop(); kidMode(false);
  if (!S.profiles.length) return editChild(null, true);
  screen(
    top(h('a', { class: 'logo', href: '../', 'aria-label': 'Goan Kids Club home' }, h('img', { src: 'icons/icon-180.png', alt: '' })), brand(), [iconBtn('👪', 'Grown-ups', parentGate)]),
    village(null), tagline(),
    mascot("Who's playing today?"),
    h('div', { class: 'kids' },
      S.profiles.map(p => h('button', { class: 'kid', onclick: () => { S.current = p.id; save(); sfx.tap(); hub(); } },
        h('span', { class: 'av' }, isLocked(p) ? '😴' : p.avatar), h('b', {}, p.name), h('small', {}, isLocked(p) ? 'Break time' : BANDS[p.band - 1].name + ' · ' + BANDS[p.band - 1].age))),
      S.profiles.length < 8 ? h('button', { class: 'kid add', onclick: () => editChild(null) }, h('span', { class: 'av' }, '➕'), h('b', {}, 'Add a child')) : null));
  say("Who's playing today?");
}

function editChild(p, first = false) {
  run++; stop(); kidMode(false);
  const d = p ? { ...p } : { name: '', avatar: pick(AVATARS), band: 2 };
  const name = h('input', { class: 'nameinput', placeholder: "Child's first name", maxlength: 14, value: d.name, autocomplete: 'off' });
  const avs = h('div', { class: 'avpick' }, AVATARS.map(a => h('button', { class: 'av' + (a === d.avatar ? ' on' : ''), onclick: e => { d.avatar = a; avs.querySelectorAll('.av').forEach(x => x.classList.toggle('on', x === e.currentTarget)); sfx.tap(); } }, a)));
  const bands = h('div', { class: 'bandpick' }, BANDS.map(b => h('button', { class: 'band' + (b.id === d.band ? ' on' : ''), onclick: e => { d.band = b.id; bands.querySelectorAll('.band').forEach(x => x.classList.toggle('on', x === e.currentTarget)); sfx.tap(); } },
    h('span', { class: 'bi' }, b.icon), h('b', {}, `Age ${b.age}`), h('span', {}, b.name), h('small', {}, b.uk))));
  const saveBtn = () => {
    const n = name.value.trim(); if (!n) { name.focus(); name.classList.add('shake'); return; }
    d.name = n.charAt(0).toUpperCase() + n.slice(1);
    let who2 = p;
    if (p) Object.assign(p, { name: d.name, avatar: d.avatar, band: d.band });
    else { who2 = { id: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: d.name, avatar: d.avatar, band: d.band, stars: 0, total: 0, stickers: [], games: {}, mins: 0, log: [] }; S.profiles.push(who2); S.current = who2.id; track('newchild', { b: d.band }); }
    save(who2); p ? parentArea() : hub(true);
  };
  name.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn(); });
  screen(
    top(first ? h('span', { class: 'logo' }, h('img', { src: 'icons/icon-180.png', alt: '' })) : iconBtn('⬅️', 'Back', () => (p ? parentArea() : who())), p ? 'Edit child' : first ? brand() : 'Add a child'),
    first ? village(null) : null, first ? tagline() : null,
    h('div', { class: 'form' },
      first ? h('p', { class: 'lead' }, 'Bem-vindo! Fun learning games for ages 3 to 6: numbers, UK phonics, shapes, thinking, animals, Konkani and Goan heritage. No ads, nothing to sign up for. Grown-ups, please set up your child below.') : null,
      h('label', {}, 'Name'), name,
      h('label', {}, 'Pick a buddy'), avs,
      h('label', {}, 'Age group (you can change this later)'), bands,
      h('button', { class: 'btn big', onclick: saveBtn }, p ? 'Save' : "Let's play! ▶"),
      first && cloudReady() ? h('button', { class: 'btn ghost sm', style: 'margin-top:14px', onclick: parentGate }, '☁️ Grown-ups: already saved progress online? Use your family code') : null));
}

/* ---------- hub ---------- */
let lastCat = 'all';
function hub(greet = false, cat = lastCat) {
  run++; stop(); lastCat = cat;
  const p = me(); if (!p) return who();
  if (isLocked(p)) return lockScreen();
  kidMode(true);
  once('c:' + p.id, dayKey(), 'childday', { b: p.band });
  const avail = GAMES.filter(g => g.minBand <= p.band);
  const list = avail.filter(g => cat === 'all' || g.cat === cat);
  const cats = CATS.filter(c => c.id === 'all' || avail.some(g => g.cat === c.id));
  screen(
    top(h('button', { class: 'ibtn av', 'aria-label': 'Change child', onclick: who }, p.avatar), `Hi, ${p.name}!`,
      [clockChip(p), starChip(p), iconBtn('📒', 'Sticker book', () => stickers()), iconBtn('👪', 'Grown-ups', parentGate)]),
    village(p),
    mascot(''),
    h('nav', { class: 'cats' }, cats.map(c => h('button', { class: 'cat' + (c.id === cat ? ' on' : ''), onclick: () => { sfx.tap(); hub(false, c.id); } }, c.icon + ' ' + c.label))),
    h('div', { class: 'grid' }, list.map(g => {
      const gs = gstate(p, g), got = gameStars(p, g), max = g.stages.length * 3;
      return h('button', { class: 'gcard', style: `--c:${g.color}`, onclick: () => { sfx.tap(); stagesScreen(g); } },
        h('span', { class: 'gicon' }, g.icon), h('b', {}, g.title),
        h('small', {}, gs.plays ? `⭐ ${got} / ${max}` : 'New!'),
        h('i', { class: 'bar' }, h('i', { style: `width:${got / max * 100}%` })));
    })));
  const msg = greet ? `Hello ${p.name}! I'm Daisy the bunny. Pick a game to play!` : cat === 'all' ? 'Pick a game!' : `${CATS.find(c => c.id === cat).label} games!`;
  if (greet) say(msg); else setBubble(msg);
}

/* ---------- stages ---------- */
function stagesScreen(g) {
  run++; stop();
  const p = me(), gs = gstate(p, g);
  if (isLocked(p)) return lockScreen();
  kidMode(true);
  let rec = g.stages.findIndex((_, s) => unlocked(p, g, s) && (gs.best[s] || 0) < 3);
  if (rec < 0) rec = g.stages.length - 1;
  screen(
    top(iconBtn('⬅️', 'All games', () => hub()), g.icon + ' ' + g.title, [clockChip(p), starChip(p)]),
    mascot(g.desc),
    h('div', { class: 'stages' }, g.stages.map((name, s) => {
      const open = unlocked(p, g, s), best = gs.best[s] || 0;
      return h('button', { class: 'stage' + (open ? '' : ' locked') + (s === rec ? ' rec' : ''), style: `--c:${g.color}`, onclick: () => { if (open) { sfx.tap(); play(g, s); } else { sfx.bad(); say('Get 2 stars on the stage before to unlock this one!'); } } },
        h('span', { class: 'snum' }, open ? String(s + 1) : '🔒'), h('b', {}, name),
        h('span', { class: 'sstars' }, open ? '★'.repeat(best) + '☆'.repeat(3 - best) : ''));
    })));
  say(g.desc);
}

/* ---------- play a round ---------- */
async function play(g, stage) {
  const my = ++run; stop();
  if (isLocked(me())) return lockScreen();
  kidMode(true, true);
  const p = me(), rounds = g.board ? 0 : (g.roundsFor ? g.roundsFor(stage) : g.rounds || 5);
  const board = h('main', { class: 'board' });
  const dots = h('div', { class: 'dots' }, range(1, rounds).map(() => h('i')));
  screen(
    top(iconBtn('✖', 'Stop playing', () => { track('quit', { g: g.id, s: stage, b: p.band }); stagesScreen(g); }, 'close'), `${g.icon} ${g.title}`, [clockChip(p), h('span', { class: 'chip' }, `Stage ${stage + 1}`)]),
    mascot(''), rounds ? dots : null, board);
  let mistakes = 0;
  const ctx = {
    stage, band: p.band, board, round: 0, profile: p,
    alive: () => my === run,
    say: (text, parts) => (my === run ? say(text, parts) : Promise.resolve()),
    good: async el => { if (my !== run) return; sfx.good(); if (el) sparkle(el); const m = $('.mascot'); m?.classList.remove('happy'); void m?.offsetWidth; m?.classList.add('happy'); await ctx.say(pick(PRAISE)); },
    bad: el => { mistakes++; sfx.bad(); if (el && el.classList) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } },
    mistake: () => { mistakes++; },
    sparkle, wait: sleep,
  };
  const t0 = Date.now();
  try {
    if (g.board) await g.board(ctx);
    else for (let i = 0; i < rounds; i++) {
      ctx.round = i; dots.children[i].className = 'now';
      const m0 = mistakes;
      await g.question(ctx);
      if (my !== run) return;
      dots.children[i].className = mistakes === m0 ? 'done' : 'ok';
      await sleep(250);
    }
  } catch (e) { console.error(e); if (my === run) say('Oops! Something went wrong. Let\'s try another game.'); return; }
  if (my !== run) return;
  const stars = g.stars ? g.stars(mistakes, stage) : mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1;
  finish(g, stage, stars, Math.round((Date.now() - t0) / 1000));
}

function finish(g, stage, stars, secs) {
  const p = me(), gs = gstate(p, g);
  const before = unlocked(p, g, stage + 1);
  gs.best[stage] = Math.max(gs.best[stage] || 0, stars); gs.plays++;
  p.stars += stars; p.total += stars; p.mins = (p.mins || 0) + secs / 60;
  p.log.unshift({ g: g.id, s: stage, st: stars, t: Date.now() }); p.log = p.log.slice(0, 80);
  save(p); kidMode(true);
  track('play', { g: g.id, s: stage, b: p.band, st: stars, secs }); track('hour', { s: new Date().getHours() });
  if (isLocked(p)) return lockScreen(stars);
  const hasNext = stage + 1 < g.stages.length, nowOpen = hasNext && unlocked(p, g, stage + 1);
  const canBuy = p.stars >= 5 && p.stickers.length < STICKERS.length * 12;
  screen(
    top(iconBtn('⬅️', 'Stages', () => stagesScreen(g)), `${g.icon} ${g.title}`, [starChip(p)]),
    h('div', { class: 'result' },
      h('div', { class: 'bigturtle' }, '🐰'),
      h('div', { class: 'earned' }, [1, 2, 3].map(i => h('span', { class: i <= stars ? 'on' : '', style: `animation-delay:${i * 0.25}s` }, '⭐'))),
      h('h2', {}, stars === 3 ? 'Superstar!' : stars === 2 ? 'Great work!' : 'Good try!'),
      h('p', { class: 'muted' }, `You earned ${stars} star${stars > 1 ? 's' : ''}. You have ${p.stars} in your star jar!`),
      mascot(''),
      h('div', { class: 'row gap wrap center' },
        nowOpen ? h('button', { class: 'btn big sun', onclick: () => play(g, stage + 1) }, `Stage ${stage + 2} ▶`) : null,
        h('button', { class: 'btn big' + (nowOpen ? ' ghost' : ''), onclick: () => play(g, stage) }, 'Play again ↻'),
        canBuy ? h('button', { class: 'btn big ghost', onclick: () => stickers() }, '📒 Get a sticker') : null,
        h('button', { class: 'btn big ghost', onclick: () => hub() }, 'All games'))));
  confetti(stars * 30); sfx.win();
  const unlockMsg = hasNext && nowOpen && !before ? ` You unlocked stage ${stage + 2}!` : '';
  say(`${stars === 3 ? 'Superstar' : 'Well done'}, ${p.name}! You earned ${stars} star${stars > 1 ? 's' : ''}.${unlockMsg}${canBuy ? ' You can get a new sticker!' : ''}`);
}

/* ---------- break time (play time is used up) ---------- */
function lockScreen(stars = 0) {
  run++; stop(); kidMode(false);
  const p = me(); if (!p) return who();
  if (!isLocked(p)) return hub();
  once('l:' + p.id, dayKey(), 'lock', { b: p.band });
  const mins = Math.max(1, Math.round(usedSecs(p) / 60));
  screen(
    top(h('button', { class: 'ibtn av', 'aria-label': 'Change child', onclick: who }, p.avatar), `Break time, ${p.name}`, [iconBtn('👪', 'Grown-ups', parentGate)]),
    h('div', { class: 'result nap' },
      h('div', { class: 'napturtle' }, h('span', {}, '🐰'), h('i', {}, 'z'), h('i', {}, 'z'), h('i', {}, 'Z')),
      h('h2', {}, 'Time for a break!'),
      stars ? h('p', {}, `You earned ${stars} star${stars > 1 ? 's' : ''} in your last game. You have ${p.stars} in your star jar!`) : null,
      h('p', { class: 'muted' }, `You played for ${mins} minute${mins > 1 ? 's' : ''} today. Daisy is having a little nap. Go and run, draw or read a book, and come back later!`),
      mascot(''),
      h('button', { class: 'btn ghost', onclick: () => { sfx.tap(); parentGate(); } }, '👪 Grown-ups: add more time')));
  sfx.win();
  say(`${stars ? `Well done, ${p.name}! You earned ${stars} star${stars > 1 ? 's' : ''}. ` : ''}It's time for a break, ${p.name}. Daisy is having a nap. See you later!`);
}

/* ---------- sticker book (spend stars) ---------- */
function stickers(page = 0) {
  run++; stop();
  const p = me();
  if (isLocked(p)) return lockScreen();
  kidMode(true);
  const pg = STICKERS[page];
  screen(
    top(iconBtn('⬅️', 'All games', () => hub()), '📒 Sticker book', [starChip(p)]),
    mascot(''),
    h('nav', { class: 'cats' }, STICKERS.map((s, i) => h('button', { class: 'cat' + (i === page ? ' on' : ''), onclick: () => { sfx.tap(); stickers(i); } }, `${s.icon} ${s.page} ${s.items.filter(x => p.stickers.includes(x)).length}/${s.items.length}`))),
    h('div', { class: 'stickers' }, pg.items.map((e, i) => {
      const own = p.stickers.includes(e), cost = price(i);
      return h('button', {
        class: 'sticker' + (own ? ' own' : '') + (cost > 5 ? ' rare' : ''), onclick: ev => {
          if (own) { sfx.tap(); sparkle(ev.currentTarget); return; }
          if (p.stars >= cost) {
            p.stars -= cost; p.stickers.push(e); save(p); track('sticker', { b: p.band }); sfx.win(); confetti(40);
            say(`Yay! A new sticker for your book! You have ${p.stars} stars left.`); stickers(page); setBubble(`Yay! A new sticker! You have ${p.stars} stars left.`);
          } else { sfx.bad(); say(`This sticker costs ${cost} stars. Play a game to earn ${cost - p.stars} more!`); }
        },
      }, h('span', { class: 'se' }, e), own ? null : h('span', { class: 'cost' }, `⭐${cost}`));
    })));
  setBubble(p.stars >= 5 ? `You have ${p.stars} stars. Tap a sticker to get it!` : `You have ${p.stars} stars. Play games to earn stars for stickers!`);
}

/* ---------- grown-ups ---------- */
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
function parentGate() {
  stop();
  const a = rnd(6, 12), b = rnd(5, 9);
  const inp = h('input', { inputmode: 'numeric', class: 'gateinput', autocomplete: 'off' });
  const go = () => { if (+inp.value === a + b) { m.remove(); parentArea(); } else { inp.value = ''; inp.placeholder = 'Try again'; inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400); } };
  const m = h('div', { class: 'modal', onclick: e => { if (e.target === m) m.remove(); } },
    h('div', { class: 'card center' }, h('h3', {}, '👪 Grown-ups only'), h('p', {}, `What is ${WORDS[a]} plus ${WORDS[b]}?`), inp,
      h('div', { class: 'row gap center' }, h('button', { class: 'btn ghost', onclick: () => m.remove() }, 'Cancel'), h('button', { class: 'btn', onclick: go }, 'Enter'))));
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  document.body.append(m); inp.focus();
}

/* ---------- keeping the family code safe: copy, WhatsApp to yourself, picture card, reminder ---------- */
const SAVE_MSG = "Please save your code now. It's the only way to get your progress back.";
async function copyCode(code) {
  try { await navigator.clipboard.writeText(code); return true; } catch (e) {
    const t = h('textarea', { style: 'position:fixed;opacity:0' }); t.value = code; document.body.append(t); t.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { /* ignore */ } t.remove(); return ok;
  }
}
const waLink = code => 'https://wa.me/?text=' + encodeURIComponent(`My Goan Kids Club family code: ${code}\n\nTo load our progress on another device: goankidsclub.com/games → Grown-ups → Save progress online → type this code. Keep it private.`);
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
/** Draw a Goan-tile card with the code and return it as a PNG blob. */
async function codeCard(code) {
  const W = 1000, H = 620, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  try { await document.fonts.load('700 60px Fredoka'); } catch (e) { /* system font */ }
  x.fillStyle = '#FDFBF3'; x.fillRect(0, 0, W, H);
  // azulejo border: blue and white tiles with a little flower
  const T = 44;
  const tileAt = (tx, ty) => {
    x.fillStyle = '#1D4F91'; x.fillRect(tx, ty, T, T); x.fillStyle = '#fff'; x.fillRect(tx + 3, ty + 3, T - 6, T - 6);
    x.fillStyle = '#1D4F91'; x.beginPath(); x.arc(tx + T / 2, ty + T / 2, 9, 0, 7); x.fill();
    x.fillStyle = '#4EA6DC'; [[0, 0], [T, 0], [0, T], [T, T]].forEach(([dx, dy]) => { x.beginPath(); x.arc(tx + dx, ty + dy, 10, 0, 7); x.fill(); });
    x.fillStyle = '#F3B72B'; x.beginPath(); x.arc(tx + T / 2, ty + T / 2, 4, 0, 7); x.fill();
  };
  for (let i = 0; i * T < W; i++) { tileAt(i * T, 0); tileAt(i * T, H - T); }
  for (let j = 1; (j + 1) * T < H; j++) { tileAt(0, j * T); tileAt(W - T, j * T); }
  x.save(); x.beginPath(); x.rect(T, T, W - 2 * T, H - 2 * T); x.clip(); x.fillStyle = '#FDFBF3'; x.fillRect(T, T, W - 2 * T, H - 2 * T); x.restore();
  try { const logo = await loadImg('icons/icon-180.png'); x.save(); x.beginPath(); x.arc(150, 150, 70, 0, 7); x.clip(); x.drawImage(logo, 80, 80, 140, 140); x.restore(); } catch (e) { /* no logo */ }
  const F = (w, px) => `${w} ${px}px Fredoka, "Trebuchet MS", sans-serif`;
  x.textBaseline = 'alphabetic';
  // wordmark: G o a n in logo colours
  let gx = 245; x.font = F(700, 64);
  [['G', '#1D4F91'], ['o', '#F3B72B'], ['a', '#E5572B'], ['n', '#3A8A3F']].forEach(([ch, col]) => { x.fillStyle = col; x.fillText(ch, gx, 150); gx += x.measureText(ch).width; });
  x.fillStyle = '#142B57'; x.fillText(' Kids Club', gx, 150);
  x.font = F(600, 26); x.fillStyle = '#5E6787'; x.fillText('Our family code for saved progress', 248, 192);
  // code box
  x.fillStyle = '#FFF6DA'; x.strokeStyle = '#F8C33A'; x.lineWidth = 6; x.setLineDash([16, 10]);
  x.beginPath(); x.roundRect ? x.roundRect(90, 255, W - 180, 140, 26) : x.rect(90, 255, W - 180, 140); x.fill(); x.stroke(); x.setLineDash([]);
  let px = 72; x.font = F(700, px); while (x.measureText(code).width > W - 240 && px > 30) { px -= 2; x.font = F(700, px); }
  x.fillStyle = '#1D4F91'; x.textAlign = 'center'; x.fillText(code, W / 2, 325 + px / 3);
  x.font = F(500, 26); x.fillStyle = '#142B57';
  x.fillText('On another device: goankidsclub.com/games → Grown-ups', W / 2, 450);
  x.fillText('→ Save progress online → type this code', W / 2, 488);
  x.font = F(500, 21); x.fillStyle = '#5E6787';
  x.fillText(`Keep it private, like a password · saved ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, W / 2, 536);
  x.textAlign = 'left';
  return new Promise(ok => c.toBlob(ok, 'image/png'));
}
async function savePicture(code, note) {
  note.textContent = 'Making your picture…';
  const blob = await codeCard(code), name = 'goan-kids-club-family-code.png';
  const file = typeof File === 'function' ? new File([blob], name, { type: 'image/png' }) : null;
  // iPad / iPhone / Android: the share sheet has "Save Image" (goes to Photos). Elsewhere: download the file.
  if (file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.maxTouchPoints > 0) {
    try { await navigator.share({ files: [file], title: 'Goan Kids Club family code' }); note.textContent = 'Saved ✓ Check your photos.'; return; }
    catch (e) { if (e && e.name === 'AbortError') { note.textContent = ''; return; } }
  }
  const url = URL.createObjectURL(blob), a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  note.textContent = 'Picture saved ✓ Check your downloads.';
}
/** The four ways to keep the code: copy, WhatsApp to yourself, picture, and the reminder text. */
function saveCodeTools(code) {
  const note = h('p', { class: 'savenote', role: 'status' });
  return h('div', { class: 'savecode' },
    h('p', { class: 'savemsg' }, '⚠️ ' + SAVE_MSG),
    h('div', { class: 'savebtns' },
      h('button', { class: 'btn sm', onclick: async () => { note.textContent = (await copyCode(code)) ? 'Copied ✓ Paste it into your Notes.' : 'Could not copy. Please write it down.'; } }, '📋 Copy code'),
      h('a', { class: 'btn sm wa', href: waLink(code), target: '_blank', rel: 'noopener', onclick: () => { note.textContent = 'In WhatsApp, pick "Message yourself" (or a grown-up you trust) and send.'; } }, '💬 Send to myself on WhatsApp'),
      h('button', { class: 'btn sm ghost', onclick: () => savePicture(code, note).catch(() => { note.textContent = 'Could not make the picture. Please take a screenshot instead.'; }) }, '🖼 Save as a picture')),
    note);
}
/** Shown once, straight after a grown-up turns on online saving. */
function saveCodeReminder(code) {
  const m = h('div', { class: 'modal', onclick: e => { if (e.target === m) m.remove(); } },
    h('div', { class: 'card center savemodal' }, h('h3', {}, '☁️ Online saving is on!'),
      h('p', {}, 'Your family code:'), h('div', { class: 'famcode' }, code),
      saveCodeTools(code),
      h('button', { class: 'btn', style: 'margin-top:10px', onclick: () => m.remove() }, "I've saved it")));
  document.body.append(m);
}

/* Grown-ups card for the optional family code. */
function cloudCard() {
  const box = h('section', { class: 'card cloud' }, h('h3', {}, '☁️ Save progress online (optional)'));
  const msg = h('p', { class: 'muted small' });
  const render = () => {
    box.querySelectorAll(':scope > :not(h3)').forEach(n => n.remove());
    if (!cloudReady()) { box.append(h('p', { class: 'muted' }, 'Coming soon.')); return; }
    if (!S.sync.code) {
      const inp = h('input', { class: 'codeinput', placeholder: 'e.g. MANGO-CRAB-PALM-4821', autocomplete: 'off', autocapitalize: 'characters' });
      box.append(
        h('p', {}, 'Children can play without this. Turn it on to keep progress safe if this device is lost or its browser data is cleared, and to share progress between your family\'s iPads, phones and computers. No email or password: you get a secret family code instead.'),
        h('div', { class: 'setrow' }, h('button', {
          class: 'btn sm', onclick: async () => {
            S.sync.code = newCode(); track('cloudon'); msg.textContent = 'Saving…'; render();
            const ok = await syncNow(); msg.textContent = ok ? 'Saved online.' : 'Could not reach the internet. It will try again later.'; render(); saveCodeReminder(S.sync.code);
          },
        }, 'Turn on online saving')),
        h('p', { class: 'small' }, 'Already have a family code from another device? Type it here:'),
        h('div', { class: 'setrow' }, inp, h('button', {
          class: 'btn ghost sm', onclick: async () => {
            const code = normCode(inp.value); if (code.split('-').length < 4) { msg.textContent = 'That code looks too short. It has four parts, like MANGO-CRAB-PALM-4821.'; return; }
            msg.textContent = 'Checking…';
            try {
              const r = await loadFamily(code);
              if (!r) { msg.textContent = 'No saved progress found for that code. Check the spelling.'; return; }
              S.sync.code = code; await syncNow(); msg.textContent = 'Linked! Your children\'s progress is on this device now.'; render();
              if (S.profiles.length) setTimeout(() => { if (box.isConnected) who(); }, 1500);
            } catch (e) { msg.textContent = 'Could not reach the internet. Please try again.'; }
          },
        }, 'Link this device')), msg);
      return;
    }
    const when = S.sync.last ? new Date(S.sync.last).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'not yet';
    box.append(
      h('p', {}, 'Your family code:'), h('div', { class: 'famcode' }, S.sync.code), saveCodeTools(S.sync.code),
      h('p', { class: 'small' }, 'Type it on another device (Grown-ups → Save progress online) to load the same progress. Anyone with this code can see your children\'s first names and progress, so keep it private.'),
      h('p', { class: 'muted small' }, `Last saved online: ${when}${S.sync.status === 'offline' ? ' (offline, will retry)' : ''}`),
      h('div', { class: 'setrow' },
        h('button', { class: 'btn sm', onclick: async () => { msg.textContent = 'Saving…'; const ok = await syncNow(); msg.textContent = ok ? 'Saved.' : 'Could not reach the internet.'; render(); } }, 'Save now'),
        h('button', { class: 'btn ghost sm', onclick: () => { if (confirm('Stop saving online on this device? Progress stays on this device and online copy is kept.')) { S.sync.code = null; save(false); render(); } } }, 'Stop on this device'),
        h('button', {
          class: 'btn ghost sm danger', onclick: async () => {
            if (!confirm('Delete the online copy for this family code? Progress on this device is kept. This cannot be undone.')) return;
            try { await deleteFamily(S.sync.code); S.sync.code = null; S.sync.last = 0; save(false); msg.textContent = 'Online copy deleted.'; render(); } catch (e) { msg.textContent = 'Could not reach the internet. Please try again.'; }
          },
        }, 'Delete online copy')), msg);
  };
  render();
  return box;
}

/* Grown-ups card: time played (today and the last 7 days), daily limit, timer from now, add more time. */
function timeCard() {
  const box = h('section', { class: 'card timecard' }, h('h3', {}, '⏳ Play time'));
  const btn = (label, fn, cls = 'btn ghost sm') => h('button', { class: cls, onclick: () => { fn(); render(); } }, label);
  const render = () => {
    box.querySelectorAll(':scope > :not(h3)').forEach(n => n.remove());
    box.append(h('p', { class: 'muted small' }, 'Time only counts while a child is playing with the screen open. When their time is up, Daisy has a nap and the games lock until a grown-up adds more time, or until tomorrow.'));
    if (!S.profiles.length) { box.append(h('p', { class: 'muted' }, 'Add a child first.')); return; }
    const days = range(0, 6).map(i => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
    for (const p of S.profiles) {
      const t = ptime(p), u = usedSecs(p), a = allowSecs(p), left = a - u, d = dayKey();
      const week = days.map(x => usedSecs(p, dayKey(x))), top7 = Math.max(600, ...week);
      const timerOn = t.timerDay === d && t.timerEnd != null && t.off !== d;
      const change = fn => () => { fn(); save(p); };
      const limitSel = h('select', { class: 'sel', 'aria-label': `Daily limit for ${p.name}`, onchange: e => { t.limit = +e.target.value; t.off = null; save(p); if (t.limit) track('limit', { s: t.limit, b: p.band }); render(); } },
        [0, 10, 15, 20, 30, 45, 60, 90, 120].map(m => h('option', { value: String(m), selected: (t.limit || 0) === m }, m ? `${m} minutes a day` : 'No daily limit')));
      box.append(h('div', { class: 'trow' },
        h('div', { class: 'thead' }, h('span', { class: 'av' }, p.avatar), h('b', {}, p.name),
          h('span', { class: 'tstat' }, `Today ${fmtMins(u)} · last 7 days ${fmtMins(week.reduce((x, y) => x + y, 0))}`)),
        h('div', { class: 'week', 'aria-hidden': 'true' }, days.map((x, i) => h('div', { class: 'wd' + (i === 6 ? ' today' : '') },
          h('i', { style: `height:${Math.max(3, week[i] / top7 * 100)}%`, title: fmtMins(week[i]) }), h('small', {}, i === 6 ? 'Today' : x.toLocaleDateString('en-GB', { weekday: 'short' }))))),
        h('div', { class: 'setrow' }, h('span', { class: 'lbl' }, 'Every day'), limitSel),
        h('div', { class: 'setrow' }, h('span', { class: 'lbl' }, 'Timer from now'),
          [10, 15, 20, 30].map(m => btn(`${m} min`, change(() => { setTimer(p, m); track('timer', { s: m, b: p.band }); }), 'btn ghost sm' + (timerOn && t.timerEnd - u > 0 && Math.round((t.timerEnd - u) / 60) === m ? ' on' : ''))),
          timerOn ? btn('Cancel timer', change(() => { t.timerEnd = null; })) : null),
        h('p', { class: 'tleft' + (a !== Infinity && left <= 0 ? ' up' : '') },
          a === Infinity ? (t.off === d ? 'No limit for the rest of today.' : 'No limit set.') : left <= 0 ? '🔒 Time is up. The games are locked.' : `${clockText(p)} left today${timerOn ? ' (timer)' : ''}.`),
        a !== Infinity || t.off === d ? h('div', { class: 'setrow' },
          a !== Infinity ? btn('+10 minutes', change(() => giveMore(p, 10)), 'btn sm') : null,
          a !== Infinity ? btn('+20 minutes', change(() => giveMore(p, 20))) : null,
          a !== Infinity ? btn('No limit for the rest of today', change(() => { t.off = d; })) : btn('Turn limits back on today', change(() => { t.off = null; }))) : null));
    }
  };
  render();
  return box;
}

/* Grown-ups card: opt-in sharing of each child's first name and progress with Goan Kids Club. */
function shareCard() {
  const box = h('section', { class: 'card sharecard' }, h('h3', {}, '📊 Share progress with Goan Kids Club (optional)'),
    h('p', {}, 'If you tick a child below, their first name, buddy picture, age group, stars, stickers, stages reached and play time are sent to Goan Kids Club. It helps us see how children are getting on and make the games better. Nothing else is sent, and it is never shared with anyone else.'),
    h('p', { class: 'muted small' }, 'Untick at any time and it is removed straight away.'));
  if (!S.profiles.length) box.append(h('p', { class: 'muted' }, 'Add a child first.'));
  for (const p of S.profiles) {
    const note = h('small', { class: 'muted' }, p.share ? ' Shared ✓' : '');
    box.append(h('label', { class: 'toggle' }, h('input', {
      type: 'checkbox', checked: !!p.share, onchange: async e => {
        const want = e.target.checked; note.textContent = ' Saving…';
        try {
          if (want) {
            p.shareKey = p.shareKey || newShareKey(); p.share = true; save(p);
            const ok = await shareChild(p.id, p.shareKey, shareData(p)); if (ok === false) throw new Error('key');
            track('share'); note.textContent = ' Shared ✓';
          } else { p.share = false; save(p); await unshareChild(p.id, p.shareKey); note.textContent = ' Removed'; }
        } catch (err) {
          if (want) note.textContent = ' Could not reach the internet. It will try again later.';
          else { note.textContent = ' Could not reach the internet. Please try again.'; p.share = true; e.target.checked = true; save(p); }
        }
      },
    }), h('span', {}, 'Share ' + p.name + "'s first name and progress"), note));
  }
  return box;
}

function parentArea(sel = S.current) {
  run++; stop(); kidMode(false);
  const st = S.settings;
  const kid = S.profiles.find(p => p.id === sel) || S.profiles[0];
  const toggle = (label, key) => h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: st[key] ? true : null, onchange: e => { st[key] = e.target.checked; save(); } }), label);
  const rate = h('input', { type: 'range', min: '0.6', max: '1.2', step: '0.05', value: String(st.rate), oninput: e => { st.rate = +e.target.value; save(); } });
  const card = (title, ...kids) => h('section', { class: 'card' }, h('h3', {}, title), ...kids);
  screen(
    top(iconBtn('⬅️', 'Back', () => (me() ? hub() : who())), '👪 Grown-ups'),
    h('div', { class: 'parent' },
      card('Children', h('div', { class: 'plist' }, S.profiles.map(p => h('div', { class: 'prow' + (p === kid ? ' on' : '') },
        h('button', { class: 'pname', onclick: () => parentArea(p.id) }, h('span', { class: 'av' }, p.avatar), h('span', {}, h('b', {}, p.name), h('small', {}, `Age ${BANDS[p.band - 1].age} · ${BANDS[p.band - 1].uk}`))),
        h('span', { class: 'pstat' }, `⭐ ${p.total} earned · 📒 ${p.stickers.length} · ⏱ today ${fmtMins(usedSecs(p))}${isLocked(p) ? ' · 🔒 break time' : ''}`),
        h('button', { class: 'btn ghost sm', onclick: () => editChild(p) }, 'Edit'),
        h('button', { class: 'btn ghost sm danger', onclick: () => { if (confirm(`Delete ${p.name} and all their progress? This cannot be undone.`)) { S.profiles = S.profiles.filter(x => x !== p); S.deleted.push(p.id); if (p.share && p.shareKey) unshareChild(p.id, p.shareKey).catch(() => {}); if (S.current === p.id) S.current = S.profiles[0]?.id || null; save(); parentArea(); } } }, 'Delete')))),
        h('button', { class: 'btn sm', onclick: () => editChild(null) }, '➕ Add a child')),
      timeCard(),
      kid ? card(`${kid.name}'s progress`, h('table', { class: 'prog' },
        h('tr', {}, h('th', {}, 'Game'), h('th', {}, 'Stages (best stars)'), h('th', {}, 'Plays')),
        GAMES.map(g => { const gs = kid.games[g.id] || { best: [], plays: 0 }; return h('tr', { class: g.minBand > kid.band ? 'dim' : '' },
          h('td', {}, g.icon + ' ' + g.title),
          h('td', { class: 'stagecells' }, g.stages.map((n, s) => h('span', { title: n, class: 'sc s' + (gs.best[s] || 0) }, String(gs.best[s] || '·')))),
          h('td', {}, String(gs.plays))); })),
        h('p', { class: 'muted small' }, 'Faded games are for older age groups and are hidden from this child. Change the age group with Edit.')) : null,
      card('Sound and voice', h('div', { class: 'setrow' }, toggle('Voice', 'voice'), toggle('Sound effects', 'sfx')),
        h('div', { class: 'setrow' }, 'Voice speed', rate, h('button', { class: 'btn ghost sm', onclick: () => say('Hello! This is how fast I talk.') }, 'Test')),
        h('p', { class: 'muted small' }, 'The voice uses your device\'s British English voice. For the best phonics and real Konkani, record your own clips (see audio/README.md).')),
      card('Install on iPad or phone', h('p', {}, 'iPad / iPhone: open this page in Safari, tap Share, then "Add to Home Screen". Android: tap the ⋮ menu, then "Install app". It then opens full screen like an app and works offline.')),
      cloudCard(),
      shareCard(),
      card('Privacy', h('p', {}, 'No ads, no sign-up, no tracking. Progress is saved on this device. It is only sent online if you turn on "Save progress online" or "Share progress" above. '),
        h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: st.stats !== false, onchange: e => { st.stats = e.target.checked; statsOn(st.stats); save(); } }),
          'Send anonymous counts (for example "Frog Hop was played") to help improve the games. No names, nothing that identifies you.'),
        h('br'),
        h('a', { href: '../privacy.html', target: '_blank', rel: 'noopener' }, 'Read the privacy notice')),
      h('section', { class: 'card supportcard' }, h('h3', {}, '☕ Support Goan Kids Club'),
        h('p', {}, 'These games run on code, love and coffee. Two are free. ', h('b', {}, 'Buy me the third'), ' and help keep Goan Kids Club free and ad-free!'),
        h('div', { class: 'treatrow' }, [['☕', '£5', 'a chai and a poi'], ['🍰', '£10', 'a slice of bebinca'], ['🍛', '£20', 'fish curry rice']].map(([e, p, t]) =>
          h('a', { class: 'treat', onclick: () => track('support', { g: 'paypal', s: 1 }), href: "https://www.paypal.com/donate/?hosted_button_id=V3QN84BYUBF6A", target: '_blank', rel: 'noopener' }, h('span', { class: 'e' }, e), h('b', {}, p), h('small', {}, t)))),
        h('p', { class: 'muted small' }, 'You choose the amount on PayPal. Dev borem korum!'),
        h('a', { class: 'btn sm wa', onclick: () => track('support', { g: 'whatsapp', s: 1 }), href: "https://wa.me/447743212345?text=Hi!%20I%20have%20a%20request%20for%20Goan%20Kids%20Club%3A%20", target: '_blank', rel: 'noopener' }, '💬 Requests or ideas? WhatsApp us')),
      card('What children learn', h('ul', { class: 'learn' },
        h('li', {}, '🔢 Numbers: counting to 20, comparing, number line, adding and taking away, number bonds to 10, UK coins (EYFS Number, Year 1).'),
        h('li', {}, '🔤 Letters: UK phonics in Letters and Sounds order (s a t p…), first sounds, blending words, tracing, ABC order and capitals.'),
        h('li', {}, '🎨 Shapes and colours: 2D shape names and sides, colours and mixing, repeating and number patterns.'),
        h('li', {}, '🧠 Thinking: memory, odd one out, size order, shadow matching.'),
        h('li', {}, '🦁 Animals: farm, wild, sea, birds, Goan wildlife, habitats, baby animals.'),
        h('li', {}, '🏡 Goan heritage: Indo-Portuguese houses (balcão, oyster-shell windows, Mangalore roof tiles), azulejo tile patterns, the poder\'s bread round, festivals (São João, Christmas, Carnival, Shigmo, Diwali, Chovoth) and Goan places.'),
        h('li', {}, '🌴 Konkani: numbers, colours and animals.')))));
}

/* ---------- boot ---------- */
loadClips();
document.documentElement.style.setProperty('--azulejo', tileURL('flower'));
document.documentElement.style.setProperty('--azulejo2', tileURL('diamond'));
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !/localhost|127\.0\.0\.1/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => {});
document.addEventListener('gesturestart', e => e.preventDefault());
if (me()) hub(true); else who();
queueSync(300);
once('dev', dayKey(), 'active', { g: deviceKind(), s: installed() });
window.__gkc = { S, GAMES, play, hub }; // handy for testing in the console
