// Goan Kids Club admin dashboard. Reads everything through one locked function (gkc_admin) with the admin password.
// Anonymous counts for everyone; first names only for children whose grown-up ticked "Share progress".
import { CLOUD } from '../games/js/cloud-config.js';
import * as HG from '../games/js/games/heritage.js';
import * as N from '../games/js/games/numbers.js';
import * as L from '../games/js/games/letters.js';
import * as SH from '../games/js/games/shapes.js';
import * as T from '../games/js/games/thinking.js';
import * as W from '../games/js/games/world.js';
import * as G from '../games/js/games/goa.js';
import * as TT from '../games/js/games/times.js';
import * as BB from '../games/js/games/bible.js';
import * as XM from '../games/js/games/christmas.js';

const GAMES = [HG.house, HG.poder, HG.tiles, HG.goalife,
  G.mapgame, G.villages, G.jigsaw, G.quizferry, G.festivals, G.konkanitalk, G.symbols, G.safari, G.seasons, G.kitchen, G.rhythm, G.railway, G.monuments,
  BB.stories, BB.noah, BB.creation, BB.lostsheep, BB.loaves, BB.coat, BB.storyorder, BB.banimals, BB.bpuzzles, BB.verses, BB.crib, BB.churchyear, BB.saints, BB.prayers,
  XM.kuswar, XM.xstar, XM.tree, XM.advent, XM.presents, XM.jingle, XM.xsounds, XM.xpuzzles,
  N.count, N.bubbles, N.more, N.frog, N.add, N.shop, TT.times,
  L.sounds, L.trace, L.firstsound, L.words, L.abc, SH.sorter, SH.colours, SH.patterns,
  T.memory, T.shadows, T.odd, T.sizes, W.animals, W.homes, W.babies, W.konkani];
const GAME = Object.fromEntries(GAMES.map(g => [g.id, g]));
const CATS = { heritage: '🏡 Goan Heritage', goa: '🗺️ Discover Goa', bible: '✝️ Bible Stories', christmas: '🎄 Christmas', numbers: '🔢 Numbers', letters: '🔤 Letters', shapes: '🎨 Shapes & Colours', thinking: '🧠 Thinking', animals: '🦁 Animals', konkani: '🌴 Konkani' };
const BANDS = ['', '3–4 Little Stars', '4–5 Busy Bees', '5–6 Super Explorers'];
const PK = 'gkc-admin-pass';

const $ = s => document.querySelector(s);
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
const fmt = n => Math.round(n).toLocaleString('en-GB');
const mins = s => { const m = Math.round(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };
const ago = t => { if (!t) return '–'; const d = (Date.now() - new Date(t).getTime()) / 864e5; return d < 1 / 24 ? 'just now' : d < 1 ? `${Math.round(d * 24)} h ago` : d < 2 ? 'yesterday' : `${Math.floor(d)} days ago`; };
const store = { get: () => { try { return localStorage.getItem(PK) || sessionStorage.getItem(PK); } catch (e) { return null; } },
  set: (p, remember) => { try { (remember ? localStorage : sessionStorage).setItem(PK, p); } catch (e) { /* private mode */ } },
  clear: () => { try { localStorage.removeItem(PK); sessionStorage.removeItem(PK); } catch (e) { /* ignore */ } } };

async function fetchAll(pass) {
  const r = await fetch(`${CLOUD.url}/rest/v1/rpc/gkc_admin`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CLOUD.key }, body: JSON.stringify({ p_pass: pass }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(/wrong password/.test(e.message || '') ? 'wrong' : 'net'); }
  return r.json();
}

/* ---------- tooltip ---------- */
const tip = $('#tip');
document.addEventListener('pointermove', e => {
  const t = e.target.closest('[data-tip]');
  if (!t) { tip.style.opacity = 0; return; }
  tip.textContent = t.dataset.tip; tip.style.opacity = 1;
  const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8), y = Math.max(8, e.clientY - tip.offsetHeight - 12);
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
});

/* ---------- login ---------- */
function login(msg = '') {
  const inp = h('input', { type: 'password', placeholder: 'Admin password', autocomplete: 'current-password' });
  const rem = h('input', { type: 'checkbox', checked: true });
  const err = h('div', { class: 'err' }, msg);
  const go = async () => {
    const p = inp.value.trim(); if (!p) return;
    err.textContent = 'Checking…';
    try { const d = await fetchAll(p); store.set(p, rem.checked); show(d); }
    catch (e) { err.textContent = e.message === 'wrong' ? 'That password is not right.' : 'Could not reach the database. Check your internet.'; }
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  $('#root').replaceChildren(h('div', { class: 'login' },
    h('img', { src: '../games/icons/icon-180.png', alt: '' }), h('h1', {}, 'Admin dashboard'),
    h('p', { class: 'privacy' }, 'Goan Kids Club. For the site owner only.'),
    inp, h('label', {}, rem, 'Remember on this device'), h('button', { class: 'btn primary', onclick: go }, 'Open dashboard'), err));
  inp.focus();
}

/* ---------- data helpers ---------- */
let DATA = null, RANGE = 30;
function rows(days) {
  const today = new Date(DATA.today + 'T12:00:00');
  const from = new Date(today); from.setDate(from.getDate() - (days - 1));
  const f = from.toISOString().slice(0, 10);
  return DATA.usage.map(([day, kind, game, stage, band, n, stars, secs]) => ({ day, kind, game, stage, band, n: +n, stars: +stars, secs: +secs })).filter(r => r.day >= f);
}
function dayList(days) {
  const out = [], t = new Date(DATA.today + 'T12:00:00');
  for (let i = days - 1; i >= 0; i--) { const d = new Date(t); d.setDate(d.getDate() - i); out.push(d.toISOString().slice(0, 10)); }
  return out;
}
const sum = (rs, f = r => r.n) => rs.reduce((a, r) => a + f(r), 0);
const by = (rs, key) => { const m = new Map(); for (const r of rs) { const k = typeof key === 'function' ? key(r) : r[key]; if (!m.has(k)) m.set(k, []); m.get(k).push(r); } return m; };
const dayLabel = d => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/* ---------- chart pieces ---------- */
function columns(values, labels, tipFn) {
  const max = Math.max(1, ...values), step = niceStep(max), top = Math.ceil(max / step) * step;
  return h('div', {},
    h('div', { class: 'cols', role: 'img', 'aria-label': labels.map((l, i) => `${l}: ${values[i]}`).join(', ') },
      [...new Set([top / 2, top])].map(g => h('div', { class: 'gl', style: `bottom:${g / top * 100}%` }, h('span', {}, fmt(g)))),
      values.map((v, i) => h('div', { class: 'c', 'data-tip': tipFn(v, labels[i]) }, h('i', { style: `height:${v / top * 100}%` })))),
    h('div', { class: 'xl' }, h('span', {}, labels[0]), labels.length > 2 ? h('span', {}, labels[Math.floor(labels.length / 2)]) : null, h('span', {}, labels[labels.length - 1])));
}
function niceStep(max) { const p = Math.pow(10, Math.floor(Math.log10(max))); const m = max / p; return (m <= 2 ? 0.5 : m <= 5 ? 1 : 2) * p || 1; }
function hbars(items, unit = '') {
  if (!items.length || !items.some(x => x.v)) return h('p', { class: 'empty' }, 'No data yet for this period.');
  const max = Math.max(1, ...items.map(x => x.v));
  return h('div', { class: 'hb' }, items.map(x => [
    h('div', { class: 'n', title: x.label }, x.label),
    h('div', { class: 't', 'data-tip': x.tip || `${x.label}: ${fmt(x.v)}${unit}` }, h('i', { style: `width:${x.v / max * 100}%` })),
    h('div', { class: 'v' }, x.text != null ? x.text : fmt(x.v) + unit)]));
}
const card = (title, sub, ...kids) => h('section', { class: 'card' }, h('h2', {}, title), sub ? h('p', { class: 'sub' }, sub) : null, ...kids);
const tile = (v, l, s) => h('div', { class: 'tile' }, h('div', { class: 'v' }, v), h('div', { class: 'l' }, l), s ? h('div', { class: 's' }, s) : null);
function heat(avg, plays) {
  if (!plays) return h('span', { class: 'cell none', 'data-tip': 'Not played yet' }, '·');
  const t = Math.max(0, Math.min(1, (avg - 1) / 2)); // 1 star → light, 3 stars → dark
  const bg = `color-mix(in oklab, var(--heat0), var(--heat3) ${Math.round(t * 100)}%)`;
  const fg = t > 0.55 ? 'var(--surface)' : 'var(--ink)';
  return h('span', { class: 'cell' + (avg < 1.8 && plays >= 3 ? ' hard' : ''), style: `background:${bg};color:${fg}`, 'data-tip': `${plays} play${plays > 1 ? 's' : ''}, average ${avg.toFixed(1)} stars${avg < 1.8 && plays >= 3 ? ' — looks too hard' : ''}` }, avg.toFixed(1));
}

/* ---------- dashboard ---------- */
function show(d) { DATA = d; render(); }
function render() {
  const R = rows(RANGE), days = dayList(RANGE), today = DATA.today;
  const k = kind => R.filter(r => r.kind === kind);
  const act = k('active'), plays = k('play'), quits = k('quit'), childday = k('childday');
  const byDay = (rs, f) => { const m = by(rs, 'day'); return days.map(d => (m.has(d) ? sum(m.get(d), f) : 0)); };
  const actDays = byDay(act), playDays = byDay(plays), minDays = byDay(plays, r => r.secs).map(s => Math.round(s / 60));
  const todayAct = sum(act.filter(r => r.day === today)), todayKids = sum(childday.filter(r => r.day === today));
  const activeDays = actDays.filter(Boolean).length || 1;

  const rangeBtn = n => h('button', { class: 'btn' + (RANGE === n ? ' on' : ''), onclick: () => { RANGE = n; render(); } }, n === 1 ? 'Today' : `${n} days`);
  const header = h('header', { class: 'bar' }, h('img', { src: '../games/icons/icon-180.png', alt: '' }), h('h1', {}, h('span', { class: 'long' }, 'Goan Kids Club · '), 'Admin'),
    h('button', { class: 'btn', onclick: refresh }, '↻ Refresh'), h('button', { class: 'btn', onclick: () => { store.clear(); login(); } }, 'Sign out'));

  // Popular games
  const pg = by(plays, 'game'), qg = by(quits, 'game');
  const gameRows = GAMES.map(g => {
    const p = pg.get(g.id) || [], q = qg.get(g.id) || [], n = sum(p), qn = sum(q);
    return { g, n, stars: n ? sum(p, r => r.stars) / n : 0, secs: n ? sum(p, r => r.secs) / n : 0, quit: n + qn ? qn / (n + qn) : 0, qn };
  }).sort((a, b) => b.n - a.n);

  // Categories
  const catPlays = Object.entries(CATS).map(([c, label]) => ({ label, v: gameRows.filter(x => x.g.cat === c).reduce((a, x) => a + x.n, 0) })).sort((a, b) => b.v - a.v);

  // Stage difficulty
  const stageMap = by(plays, r => r.game + ':' + r.stage);
  const stageRows = GAMES.filter(g => (pg.get(g.id) || []).length).map(g => h('tr', {},
    h('td', {}, `${g.icon} ${g.title}`),
    h('td', {}, h('div', { class: 'cells' }, g.stages.map((name, s) => {
      const rs = stageMap.get(g.id + ':' + s) || [], n = sum(rs);
      const c = heat(n ? sum(rs, r => r.stars) / n : 0, n); c.dataset.tip = `Stage ${s + 1} (${name}): ` + c.dataset.tip; return c;
    })))));

  // Age groups, devices, hours
  const bandKids = [1, 2, 3].map(b => ({ label: BANDS[b], v: sum(childday.filter(r => r.band === b)) }));
  const bandNew = [1, 2, 3].map(b => ({ label: BANDS[b], v: sum(k('newchild').filter(r => r.band === b)) }));
  const dev = ['tablet', 'phone', 'computer'].map(x => ({ label: { tablet: '📱 iPad / tablet', phone: '📞 Phone', computer: '💻 Computer' }[x], v: sum(act.filter(r => r.game === x)) }));
  const inst = sum(act.filter(r => r.stage === 1)), instPct = sum(act) ? Math.round(inst / sum(act) * 100) : 0;
  const hours = Array.from({ length: 24 }, (_, i) => sum(k('hour').filter(r => r.stage === i)));

  // Features
  const feat = [
    ['⏳ Break screens shown (time up)', sum(k('lock'))], ['🕒 Daily limits set', sum(k('limit'))], ['⏱ Timers started', sum(k('timer'))],
    ['☁️ Online saving turned on', sum(k('cloudon'))], ['📊 Children shared with you', sum(k('share'))], ['📒 Stickers collected', sum(k('sticker'))],
    ['☕ Support (PayPal) taps', sum(k('support').filter(r => r.game === 'paypal'))], ['💬 WhatsApp taps', sum(k('support').filter(r => r.game === 'whatsapp'))],
  ].map(([label, v]) => ({ label, v }));

  // Named children
  const kids = DATA.children || [];
  const kidRows = kids.flatMap(c => {
    const gs = c.games || {}, stagesDone = Object.values(gs).reduce((a, g) => a + (g.b || []).filter(x => x > 0).length, 0);
    const playsN = Object.values(gs).reduce((a, g) => a + (g.p || 0), 0);
    const fav = Object.entries(gs).sort((a, b) => (b[1].p || 0) - (a[1].p || 0)).slice(0, 2).map(([id]) => GAME[id] ? GAME[id].icon + ' ' + GAME[id].title : id).join(', ');
    const detail = h('tr', { class: 'detail', hidden: true }, h('td', { colspan: 9 }, h('div', { class: 'gl2' },
      GAMES.filter(g => gs[g.id]).map(g => h('div', {}, h('span', {}, `${g.icon} ${g.title} · ${gs[g.id].p} plays`),
        h('span', { class: 'cells' }, g.stages.map((nm, s) => { const b = (gs[g.id].b || [])[s] || 0; return h('span', { class: 'cell' + (b ? '' : ' none'), 'data-tip': `Stage ${s + 1} (${nm}): ${b ? b + ' best stars' : 'not done yet'}`, style: b ? `background:color-mix(in oklab, var(--heat0), var(--heat3) ${b * 33}%);color:${b > 1 ? 'var(--surface)' : 'var(--ink)'}` : '' }, b ? '★' + b : '·'); }))))),
      Object.keys(gs).length ? null : h('p', { class: 'empty' }, 'No games played yet.')));
    const row = h('tr', { class: 'kid', onclick: () => { detail.hidden = !detail.hidden; } },
      h('td', {}, h('span', { class: 'av' }, c.avatar || '🙂'), ' ', h('b', {}, c.name)),
      h('td', {}, BANDS[c.band] || '–'), h('td', { class: 'num' }, fmt(c.total || 0)), h('td', { class: 'num' }, fmt(c.stickers || 0)),
      h('td', { class: 'num' }, `${stagesDone}`), h('td', { class: 'num' }, fmt(playsN)), h('td', { class: 'num' }, mins(c.today || 0)), h('td', { class: 'num' }, mins(c.week || 0)),
      h('td', {}, ago(c.last || c.updated), c.limit ? h('span', { class: 'tag', style: 'margin-left:6px' }, `limit ${c.limit} min`) : null));
    row.title = fav ? `Favourites: ${fav}` : '';
    return [row, detail];
  });

  $('#root').replaceChildren(header, h('main', {},
    h('div', { class: 'filters' }, rangeBtn(1), rangeBtn(7), rangeBtn(30), rangeBtn(90),
      h('span', { class: 'note' }, `Updated ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · UK dates`)),
    h('div', { class: 'tiles' },
      tile(fmt(todayAct), 'Families playing today', 'devices used today'),
      tile(fmt(sum(act) / (RANGE === 1 ? 1 : activeDays)), RANGE === 1 ? 'Families today' : 'Families a day', RANGE === 1 ? '' : `average over days with play`),
      tile(fmt(todayKids), 'Children playing today', `${fmt(sum(childday))} child-days in period`),
      tile(fmt(sum(k('newchild'))), 'New children added', 'in this period'),
      tile(fmt(sum(plays)), 'Games finished', `${fmt(sum(quits))} left early`),
      tile(mins(sum(plays, r => r.secs)), 'Time playing', sum(plays) ? `about ${mins(sum(plays, r => r.secs) / sum(plays))} a game` : ''),
      tile(fmt(kids.length), 'Children shared with you', 'names below'),
      tile(fmt(DATA.families || 0), 'Families saving online', `${fmt(DATA.family_children || 0)} children in them`)),
    RANGE > 1 ? h('div', { class: 'grid2' },
      card('Families playing each day', 'Devices that opened the games that day', columns(actDays, days.map(dayLabel), (v, l) => `${l}: ${fmt(v)} famil${v === 1 ? 'y' : 'ies'}`)),
      card('Games finished each day', 'Every finished stage counts once', columns(playDays, days.map(dayLabel), (v, l) => `${l}: ${fmt(v)} game${v === 1 ? '' : 's'}`)),
      card('Minutes played each day', 'Time spent in finished games', columns(minDays, days.map(dayLabel), (v, l) => `${l}: ${fmt(v)} min`))) : null,
    h('div', { class: 'grid2' },
      card('Most played games', 'Finished games in this period', hbars(gameRows.filter(x => x.n).slice(0, 12).map(x => ({ label: `${x.g.icon} ${x.g.title}`, v: x.n, tip: `${x.g.title}: ${fmt(x.n)} plays, avg ${x.stars.toFixed(1)} stars, ${mins(x.secs)} a game` })))),
      card('Subjects', 'Finished games by subject', hbars(catPlays))),
    card('All games', 'Plays, average stars and how often children leave before the end. Many leaving early or low stars can mean a game is too hard or not fun.',
      h('div', { class: 'tw' }, h('table', {},
        h('tr', {}, h('th', {}, 'Game'), h('th', {}, 'Subject'), h('th', { class: 'num' }, 'Plays'), h('th', { class: 'num' }, 'Avg stars'), h('th', { class: 'num' }, 'Time a game'), h('th', { class: 'num' }, 'Left early'), h('th', {}, '')),
        gameRows.map(x => h('tr', {}, h('td', {}, `${x.g.icon} ${x.g.title}`), h('td', {}, CATS[x.g.cat] || x.g.cat), h('td', { class: 'num' }, fmt(x.n)),
          h('td', { class: 'num' }, x.n ? x.stars.toFixed(1) : '–'), h('td', { class: 'num' }, x.n ? mins(x.secs) : '–'), h('td', { class: 'num' }, x.n + x.qn ? Math.round(x.quit * 100) + '%' : '–'),
          h('td', {}, x.n >= 5 && x.stars < 1.8 ? h('span', { class: 'tag warn' }, 'too hard?') : x.n >= 5 && x.quit > 0.4 ? h('span', { class: 'tag warn' }, 'many leave') : x.n >= 5 && x.stars > 2.8 ? h('span', { class: 'tag good' }, 'easy') : null)))))),
    card('Stage difficulty', 'Average stars for each stage. Darker = easier (more stars). Hover a square for details.',
      stageRows.length ? h('div', { class: 'tw' }, h('table', {}, h('tr', {}, h('th', {}, 'Game'), h('th', {}, 'Stages 1, 2, 3 …')), stageRows))
        : h('p', { class: 'empty' }, 'No games finished in this period yet.'),
      h('div', { class: 'legend' }, 'Average stars:', heat(1, 1), heat(2, 1), heat(3, 1), h('span', { class: 'cell none' }, '·'), 'not played', h('span', { class: 'cell hard' }, ''), 'orange outline = looks too hard')),
    h('div', { class: 'grid2' },
      card('Age groups', 'Children playing (one count per child per day)', hbars(bandKids)),
      card('New children by age group', 'Profiles added in this period', hbars(bandNew)),
      card('Devices', `How families play. ${instPct}% use it installed as an app.`, hbars(dev)),
      card('Busiest times of day', 'Finished games by hour (UK time on the device)', columns(hours, hours.map((_, i) => `${String(i).padStart(2, '0')}:00`), (v, l) => `${l}: ${fmt(v)} game${v === 1 ? '' : 's'}`))),
    card('Features used', 'How often grown-ups and children used these in this period', hbars(feat)),
    card('Children shared with you', `${kids.length} child${kids.length === 1 ? '' : 'ren'} whose grown-up ticked "Share progress". Tap a row to see every game and stage.`,
      kids.length ? h('div', { class: 'tw' }, h('table', {},
        h('tr', {}, h('th', {}, 'Child'), h('th', {}, 'Age group'), h('th', { class: 'num' }, 'Stars earned'), h('th', { class: 'num' }, 'Stickers'), h('th', { class: 'num' }, 'Stages done'), h('th', { class: 'num' }, 'Games played'), h('th', { class: 'num' }, 'Today'), h('th', { class: 'num' }, 'Last 7 days'), h('th', {}, 'Last played')),
        kidRows)) : h('p', { class: 'empty' }, 'No children shared yet. Grown-ups can tick "Share progress with Goan Kids Club" in the Grown-ups area.')),
    h('p', { class: 'privacy' }, 'Counts are anonymous: no names, IP addresses or device ids. Names appear only where a grown-up chose to share, and disappear when they untick it. Keep this page and its password private.')));
}

async function refresh() {
  const p = store.get(); if (!p) return login();
  try { show(await fetchAll(p)); } catch (e) { if (e.message === 'wrong') { store.clear(); login('Please sign in again.'); } else login('Could not reach the database. Check your internet.'); }
}
if (!CLOUD.url) login('The database is not set up.'); else if (store.get()) refresh(); else login();
