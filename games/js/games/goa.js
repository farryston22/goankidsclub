// Discover Goa: map jigsaw, villages by district, picture jigsaws, quiz ferry, festivals, Konkani greetings,
// state symbols, wildlife safari, seasons, Goan kitchen, ghumot rhythm, Konkan Railway, monuments memory.
//
// Facts checked November 2026. Goa has THREE districts since 31 Dec 2025 (Kushavati, HQ Quepem):
//   https://en.wikipedia.org/wiki/Kushavati_district
//   https://navhindtimes.in/goanews/new-year-gift-govt-notifies-goas-third-district-kushavati/
// State symbols: https://en.wikipedia.org/wiki/List_of_Indian_state_symbols (state flower left out: sources disagree).
// KONKANI GREETINGS are drafts for the owner to check (the owner teaches Konkani) — see audio/VOICEOVERS.md.
import { h, rnd, pick, shuffle, sample, sleep, em, numOpts, freshPicker, range } from '../util.js';
import { choice, drag, tapOrder, numNode } from '../engine.js';
import { sfx, hasClip, slug } from '../audio.js';
import { villageSVG, churchSVG, houseSVG, WALLS } from '../art.js';

/* ---------- speech helpers: recorded clips for Goan names (audio/goa/<name>.mp3) ---------- */
const P = name => ({ t: name, clip: 'goa/' + slug(name) });
/** Build [text, parts] from strings and P(names). Parts are only used when a recording exists (avoids choppy robot speech). */
function line(...bits) {
  const text = bits.map(b => (typeof b === 'string' ? b : b.t)).join(' ').replace(/\s+([?!.,:])/g, '$1');
  return [text, bits.some(b => b && b.clip && hasClip(b.clip)) ? bits : undefined];
}
const ask = (ctx, ...bits) => { const [t, p] = line(...bits); return ctx.say(t, p); };
const tag = (icon, text, cls = '') => h('span', { class: 'gtag ' + cls }, h('span', { class: 'gi' }, icon), h('b', {}, text));

/* ---------- the map of Goa (stylised, north at the top) ---------- */
const DIST = {
  north: { name: 'North Goa', col: '#1D4F91', soft: '#CFE0F7', cx: 160, cy: 85,
    pts: [[95, 10], [80, 40], [70, 80], [62, 120], [58, 150], [110, 150], [150, 140], [190, 136], [200, 135], [262, 140], [255, 120], [230, 90], [200, 60], [160, 35], [130, 15]] },
  south: { name: 'South Goa', col: '#E5572B', soft: '#FBD9CD', cx: 100, cy: 205,
    pts: [[58, 150], [40, 175], [20, 195], [35, 205], [60, 200], [62, 230], [70, 270], [110, 265], [135, 228], [170, 212], [180, 170], [190, 136], [150, 140], [110, 150]] },
  kush: { name: 'Kushavati', col: '#3A8A3F', soft: '#D3EBD2', cx: 195, cy: 280,
    pts: [[190, 136], [200, 135], [262, 140], [270, 160], [280, 200], [270, 250], [250, 300], [215, 330], [185, 370], [165, 405], [145, 412], [125, 385], [105, 350], [85, 310], [70, 270], [110, 265], [135, 228], [170, 212], [180, 170]] },
};
const DKEYS = ['north', 'south', 'kush'];
const VB = [-60, -40, 400, 500];
const ptsStr = p => p.map(q => q.join(',')).join(' ');
const COAST = [[95, 10], [80, 40], [70, 80], [62, 120], [58, 150], [40, 175], [20, 195], [35, 205], [60, 200], [62, 230], [70, 270], [85, 310], [105, 350], [125, 385], [145, 412]];
const SEA = [[-60, -40], [85, -40], ...COAST, [160, 460], [-60, 460]];
const MAHA = [[85, -40], [340, -40], [340, 95], [255, 120], [230, 90], [200, 60], [160, 35], [130, 15], [95, 10]];
const KARN = [[340, 95], [340, 460], [160, 460], [145, 412], [165, 405], [185, 370], [215, 330], [250, 300], [270, 250], [280, 200], [270, 160], [262, 140], [255, 120]];
const TOWNS = {
  Panaji: [78, 136, 'north'], Mapusa: [88, 100, 'north'], Pernem: [112, 42, 'north'], Bicholim: [150, 95, 'north'], Valpoi: [210, 105, 'north'],
  'Old Goa': [112, 140, 'north'], Margao: [78, 238, 'south'], 'Vasco da Gama': [36, 196, 'south'], Ponda: [150, 178, 'south'],
  Quepem: [122, 292, 'kush'], Sanguem: [190, 270, 'kush'], Canacona: [135, 375, 'kush'], Dharbandora: [215, 185, 'kush'],
};
const TALUKAS = [
  ['Pernem', 'north', 108, 40], ['Bardez', 'north', 86, 100], ['Bicholim', 'north', 150, 95], ['Sattari', 'north', 215, 102], ['Tiswadi', 'north', 96, 140],
  ['Ponda', 'south', 150, 178], ['Mormugao', 'south', 38, 196], ['Salcete', 'south', 78, 236],
  ['Dharbandora', 'kush', 215, 185], ['Sanguem', 'kush', 205, 268], ['Quepem', 'kush', 125, 292], ['Canacona', 'kush', 140, 372],
];
function mapSVG({ filled = true, labels = true, towns = [], dot = null, neighbours = false, tapDistricts = false } = {}) {
  const t = (x, y, s, size = 13, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" ${extra}>${s}</text>`;
  let s = `<svg viewBox="${VB.join(' ')}" class="goamap" role="img" aria-label="Map of Goa">`;
  s += `<rect x="-60" y="-40" width="400" height="500" fill="#F3E9CF"/>`;
  s += `<polygon points="${ptsStr(SEA)}" fill="#9FD3F0" ${neighbours ? 'data-n="sea" class="nb"' : ''}/>`;
  s += `<polygon points="${ptsStr(MAHA)}" fill="#EADFC0" ${neighbours ? 'data-n="maha" class="nb"' : ''}/>`;
  s += `<polygon points="${ptsStr(KARN)}" fill="#E4D6B2" ${neighbours ? 'data-n="karn" class="nb"' : ''}/>`;
  // waves in the sea
  for (let y = 40; y < 440; y += 60) s += `<path d="M-40 ${y} q10 -6 20 0 t20 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`;
  for (const k of DKEYS) {
    const d = DIST[k];
    s += `<polygon points="${ptsStr(d.pts)}" data-d="${k}" class="dist${tapDistricts ? ' tap' : ''}" fill="${filled ? d.col : '#FFFDF6'}" stroke="${filled ? '#fff' : '#A99C76'}" stroke-width="3" ${filled ? '' : 'stroke-dasharray="7 5"'} stroke-linejoin="round"/>`;
  }
  s += `<polyline points="${ptsStr(COAST)}" fill="none" stroke="#142B57" stroke-width="2.5" stroke-linejoin="round" opacity=".55"/>`;
  // rivers: Mandovi and Zuari
  s += `<path d="M72 138 Q120 128 160 122 T232 104" stroke="#4EA6DC" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M58 199 Q110 206 150 201 T205 228" stroke="#4EA6DC" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if (labels) for (const k of DKEYS) { const d = DIST[k]; s += t(d.cx, d.cy, d.name, 17, 'class="dlabel" fill="#fff" font-weight="700"'); }
  if (neighbours) {
    s += t(-20, 250, 'Arabian Sea', 17, 'transform="rotate(-80 -20 250)" fill="#1D4F91" font-weight="700"');
    s += t(250, 20, 'Maharashtra', 17, 'fill="#6B5A2E" font-weight="700"');
    s += t(305, 330, 'Karnataka', 17, 'transform="rotate(-75 305 330)" fill="#6B5A2E" font-weight="700"');
  }
  for (const name of towns) {
    const [x, y] = TOWNS[name], cap = name === 'Panaji';
    s += `<g class="town" data-t="${name}"><circle cx="${x}" cy="${y}" r="16" fill="transparent"/>` +
      (cap ? `<text x="${x}" y="${y + 6}" font-size="20" text-anchor="middle">⭐</text>` : `<circle cx="${x}" cy="${y}" r="6" fill="#F3B72B" stroke="#142B57" stroke-width="2"/>`) +
      `<text x="${x + 10}" y="${y - 9}" font-size="12" font-weight="700" fill="#142B57" paint-order="stroke" stroke="#fff" stroke-width="3">${name}</text></g>`;
  }
  if (dot) s += `<circle cx="${dot[0]}" cy="${dot[1]}" r="9" class="pulse" fill="#F3B72B" stroke="#142B57" stroke-width="3"/><text x="${dot[0]}" y="${dot[1] - 15}" font-size="15" font-weight="700" text-anchor="middle" fill="#142B57" paint-order="stroke" stroke="#fff" stroke-width="4">${dot[2]}</text>`;
  return s + '</svg>';
}
const bbox = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; };
const pieceSVG = k => { const d = DIST[k], [x, y, w, hh] = bbox(d.pts); return `<svg viewBox="${x - 4} ${y - 4} ${w + 8} ${hh + 8}" class="mappiece"><polygon points="${ptsStr(d.pts)}" fill="${d.col}" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></svg>`; };
const pct = (x, y) => `left:${(x - VB[0]) / VB[2] * 100}%;top:${(y - VB[1]) / VB[3] * 100}%`;

/** Tap on the map. targets: CSS selector → key attribute. Resolves true if right first time. */
function tapMap(ctx, { svg, sel, attr, want, prompt, after, hintEl }) {
  return new Promise(res => {
    const b = ctx.board; b.innerHTML = '';
    const wrap = h('div', { class: 'mapwrap', html: svg }); b.append(wrap);
    let wrong = 0, done = false;
    wrap.querySelectorAll(sel).forEach(el => el.addEventListener('click', async () => {
      if (done || !ctx.alive()) return;
      if (el.getAttribute(attr) === want) {
        done = true; el.classList.add('right'); await ctx.good(wrap);
        if (after) await ask(ctx, ...[].concat(after));
        res(wrong === 0);
      } else {
        wrong++; ctx.bad(wrap); el.classList.add('nope'); setTimeout(() => el.classList.remove('nope'), 500);
        if (wrong >= 2) wrap.querySelector(`${sel}[${attr}="${CSS.escape(want)}"]`)?.classList.add('hintme');
        ask(ctx, 'Try again!', ...[].concat(prompt));
      }
    }));
    ask(ctx, ...[].concat(prompt));
  });
}

/* ================= 1. Goa Map Jigsaw ================= */
export const mapgame = {
  id: 'mapgame', title: 'Goa Map Puzzle', icon: '🗺️', cat: 'goa', minBand: 2, color: '#1D4F91',
  desc: 'Goa has 3 districts. Find them, build the map and spot Panaji, the capital!',
  stages: ['Find the districts', 'Map jigsaw', 'Sea and neighbours', 'Panaji and towns', 'Which district?'],
  start: [0, 0, 1],
  roundsFor: s => (s === 1 ? 1 : s === 4 ? 6 : 4),
  question(ctx) {
    const st = ctx.stage;
    if (st === 0) {
      const k = pick(DKEYS), d = DIST[k];
      const intro = ctx.round === 0 ? ['Goa has three districts: North Goa, South Goa and Kushavati.'] : [];
      return tapMap(ctx, { svg: mapSVG({ tapDistricts: true }), sel: '.dist', attr: 'data-d', want: k, prompt: [...intro, 'Tap', P(d.name), '!'],
        after: k === 'kush' ? ['Kushavati is the newest district. It is named after the Kushavati river.'] : k === 'north' ? ['North Goa! Panaji, the capital, is here.'] : ['South Goa! Margao is the big town here.'] });
    }
    if (st === 1) {
      return new Promise(res => {
        const wrap = h('div', { class: 'mapwrap', html: mapSVG({ filled: false, labels: false }) });
        const scene = h('div', { class: 'mapscene' }, wrap);
        for (const k of DKEYS) {
          const d = DIST[k], slot = h('div', { class: 'slot' });
          wrap.append(h('div', { class: 'maptarget', 'data-key': k, style: pct(d.cx, d.cy) }, slot));
          new MutationObserver(() => { const poly = wrap.querySelector(`[data-d="${k}"]`); poly.setAttribute('fill', d.col); poly.setAttribute('stroke', '#fff'); poly.removeAttribute('stroke-dasharray'); poly.classList.add('pop'); }).observe(slot, { childList: true });
        }
        drag(ctx, {
          prompt: 'Build the map of Goa! Drag each piece to where it fits.', scene,
          items: DKEYS.map(k => ({ key: k, node: h('span', { class: 'piece', html: pieceSVG(k) }), say: `${DIST[k].name}!`, hint: 'Look at the shape. Where does it fit?' })),
        }).then(async () => { await ask(ctx, 'Brilliant! You built Goa: North Goa, South Goa and Kushavati.'); res(true); });
      });
    }
    if (st === 2) {
      const q = pick([['sea', 'Arabian Sea', 'Tap the sea! It is called the Arabian Sea.', 'Goa has lots of beaches along the Arabian Sea.'],
        ['maha', 'Maharashtra', 'Tap Maharashtra. It is next to Goa in the north.', 'Maharashtra is north of Goa.'],
        ['karn', 'Karnataka', 'Tap Karnataka. It is next to Goa in the east and south.', 'Karnataka is east and south of Goa.']]);
      return tapMap(ctx, { svg: mapSVG({ neighbours: true, labels: false }), sel: '.nb', attr: 'data-n', want: q[0], prompt: [q[2]], after: [q[3]] });
    }
    if (st === 3) {
      const towns = ['Panaji', 'Margao', 'Mapusa', 'Vasco da Gama', 'Ponda', 'Quepem', 'Canacona'];
      const want = ctx.round === 0 ? 'Panaji' : pick(towns.slice(1));
      const facts = { Panaji: 'Panaji, also called Panjim, is the capital of Goa. It is on the Mandovi river.', Margao: 'Margao is the main town of South Goa.', Mapusa: 'Mapusa has a big Friday market!', 'Vasco da Gama': 'Vasco is near the port and Dabolim airport.', Ponda: 'Ponda has many old temples.', Quepem: 'Quepem is the main town of Kushavati district.', Canacona: 'Canacona is in the far south, near Palolem beach.' };
      return tapMap(ctx, { svg: mapSVG({ towns, labels: false, filled: true }), sel: '.town', attr: 'data-t', want,
        prompt: want === 'Panaji' ? ['The capital of Goa has a star. Tap', P('Panaji'), '!'] : ['Find', P(want), 'on the map!'], after: [facts[want]] });
    }
    const [name, k, x, y] = pick(TALUKAS);
    return choice(ctx, {
      ...(() => { const [t, p] = line(P(name), 'is a taluka. Which district is it in?'); return { prompt: t, parts: p }; })(),
      show: h('div', { class: 'mapwrap small', html: mapSVG({ labels: false, dot: [x, y, name] }) }),
      options: DKEYS.map(d => ({ node: tag('🗺️', DIST[d].name, 'd-' + d), ok: d === k, label: DIST[d].name })), cols: 3,
      after: `${name} is in ${DIST[k].name}.`,
    });
  },
};

/* ================= 2. Where Is My Village? ================= */
const PLACES = {
  north: [['Panaji', '⭐'], ['Mapusa', '🛍️'], ['Calangute', '🏖️'], ['Anjuna', '🏖️'], ['Arambol', '🏄'], ['Morjim', '🐢'], ['Old Goa', '⛪'], ['Aldona', '🌾'], ['Siolim', '🎉'], ['Valpoi', '🌳'], ['Bicholim', '🏡'], ['Divar', '🚩'], ['Pernem', '🏡'], ['Candolim', '🏖️']],
  south: [['Margao', '🛒'], ['Colva', '🏖️'], ['Benaulim', '🏖️'], ['Chandor', '🏛️'], ['Loutolim', '🏡'], ['Vasco da Gama', '✈️'], ['Ponda', '🛕'], ['Curtorim', '🌾'], ['Majorda', '🏖️'], ['Bogmalo', '🏖️'], ['Navelim', '🏡']],
  kush: [['Palolem', '🏝️'], ['Agonda', '🐢'], ['Quepem', '🏡'], ['Sanguem', '🌳'], ['Netravali', '💧'], ['Mollem', '🐅'], ['Canacona', '🌴'], ['Curchorem', '🚉'], ['Cotigao', '🌳'], ['Galgibag', '🐢'], ['Rivona', '🪨']],
};
export const villages = {
  id: 'villages', title: 'Where Is My Village?', icon: '🏘️', cat: 'goa', minBand: 2, color: '#E5572B',
  desc: 'Sort Goan villages and towns into North Goa, South Goa and Kushavati.',
  stages: ['North or South?', 'Three districts', 'Tricky ones'],
  start: [0, 0, 1],
  roundsFor: () => 3,
  question(ctx) {
    const st = ctx.stage, keys = st === 0 ? ['north', 'south'] : DKEYS, per = st === 0 ? 2 : st === 1 ? 2 : 3;
    const chosen = keys.flatMap(k => sample(PLACES[k], per).map(p => [k, ...p]));
    const scene = h('div', { class: 'bins n' + keys.length }, keys.map(k => h('div', { class: 'bin d-' + k, 'data-key': k },
      h('div', { class: 'bhead', html: pieceSVG(k) }), h('b', {}, DIST[k].name), h('div', { class: 'slot' }))));
    const items = chosen.map(([k, name, icon]) => {
      const node = h('span', { class: 'placecard' }, h('span', { class: 'gi' }, icon), h('b', {}, name));
      node.addEventListener('pointerup', () => ask(ctx, P(name)));
      return { key: k, node, say: `${name} is in ${DIST[k].name}!`, hint: `Not there! Where is ${name}?` };
    });
    const [t, p] = line(ctx.round === 0 ? 'Tap a place to hear its name, then drag it to its district.' : 'Where do these places go?');
    return drag(ctx, { prompt: t, parts: p, scene, items, trayClass: 'places' }).then(() => true);
  },
};

/* ================= 3. Goa Picture Jigsaws ================= */
const beachSVG = () => `<svg viewBox="0 0 300 200"><rect width="300" height="200" fill="#8FD3F5"/><circle cx="240" cy="45" r="26" fill="#F8C33A"/>
<rect y="95" width="300" height="55" fill="#2F8FCB"/><path d="M0 100 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0" stroke="#fff" stroke-width="4" fill="none"/>
<rect y="140" width="300" height="60" fill="#F2D9A0"/><path d="M60 150 l40 0 l-6 10 l-28 0 z" fill="#B5442E"/><path d="M80 150 l0 -30 l18 26 z" fill="#fff"/>
<path d="M235 200 q-4 -60 10 -95" stroke="#7B5A3A" stroke-width="7" fill="none"/><g fill="#3A8A3F"><path d="M245 105 q-30 -10 -48 10 q22 -4 48 -10z"/><path d="M245 105 q30 -12 46 8 q-24 -6 -46 -8z"/><path d="M245 105 q-6 -28 -30 -36 q18 14 30 36z"/><path d="M245 105 q14 -26 38 -28 q-22 10 -38 28z"/></g>
<text x="150" y="190" font-size="26" text-anchor="middle">🦀 🐚</text></svg>`;
const ferrySVG = () => `<svg viewBox="0 0 300 200"><rect width="300" height="200" fill="#BFE6F7"/><path d="M0 70 q60 -40 120 -10 t180 -15 v40 h-300z" fill="#3A8A3F"/>
<rect y="85" width="300" height="115" fill="#4EA6DC"/><path d="M0 120 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>
<path d="M60 150 h180 l-20 25 h-140 z" fill="#F3B72B"/><rect x="95" y="118" width="110" height="32" fill="#fff" stroke="#1D4F91" stroke-width="3"/><rect x="140" y="100" width="22" height="18" fill="#E5572B"/>
<text x="120" y="142" font-size="20">🛵</text><text x="160" y="142" font-size="20">🚲</text><circle cx="40" cy="40" r="20" fill="#F8C33A"/></svg>`;
const SCENES = [
  { k: 'village', name: 'a Goan village', svg: () => villageSVG() },
  { k: 'beach', name: 'a Goan beach', svg: beachSVG },
  { k: 'ferry', name: 'a ferry on the Mandovi river', svg: ferrySVG },
  { k: 'church', name: 'a white Goan church', svg: () => churchSVG() },
  { k: 'house', name: 'a Goan house with a balcão', svg: () => houseSVG({ wall: WALLS.yellow, windows: 3, balcao: true }) },
];
const svgURL = s => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(s.includes('xmlns') ? s : s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'))}")`;
export const jigsaw = {
  id: 'jigsaw', title: 'Goa Jigsaws', icon: '🧩', cat: 'goa', minBand: 1, color: '#F3B72B',
  desc: 'Put the pieces together to make pictures of Goa.',
  stages: ['4 pieces', '6 pieces', '9 pieces', '12 pieces'],
  start: [0, 1, 2],
  roundsFor: () => 2,
  question(ctx) {
    const [c, r] = [[2, 2], [3, 2], [3, 3], [4, 3]][ctx.stage];
    const sc = pick(SCENES), url = svgURL(sc.svg()), n = c * r;
    const grid = h('div', { class: 'jiggrid', style: `--c:${c};--r:${r};--img:${url}` });
    for (let i = 0; i < n; i++) grid.append(h('div', { class: 'jslot', 'data-key': 'p' + i }, h('div', { class: 'slot' })));
    const pos = i => `background-image:${url};background-size:${c * 100}% ${r * 100}%;background-position:${(i % c) / (c - 1) * 100}% ${Math.floor(i / c) / (r - 1) * 100}%`;
    const items = range(0, n - 1).map(i => ({ key: 'p' + i, node: h('span', { class: 'jpiece', style: `${pos(i)};--c:${c}` }) }));
    return drag(ctx, { prompt: ctx.round === 0 ? 'Make the picture! Drag each piece to its place.' : 'Another one! Make the picture.', scene: h('div', { class: 'jigwrap' }, grid), items, trayClass: 'jigtray' })
      .then(async () => { grid.classList.add('done'); sfx.win(); await ctx.say(`You made ${sc.name}!`); return true; });
  },
};

/* ================= 4. Captain Goa's Quiz Ferry ================= */
const QUIZ = [
  [ // Goa basics
    { q: 'What is the capital of Goa?', a: ['Panaji', '⭐'], w: [['Margao', '🛒'], ['Mapusa', '🛍️']], f: 'Panaji, also called Panjim, is the capital. It sits on the Mandovi river.' },
    { q: 'Goa is next to which sea?', a: ['Arabian Sea', '🌊'], w: [['North Sea', '❄️'], ['Red Sea', '🏜️']], f: 'Goa has more than 100 kilometres of coast on the Arabian Sea.' },
    { q: 'Goa is a state in which country?', a: ['India', '🇮🇳'], w: [['Portugal', '🇵🇹'], ['England', '🏴']], f: 'Goa is a state of India, on the west coast.' },
    { q: 'What is the language of Goa?', a: ['Konkani', '🗣️'], w: [['French', '🥖'], ['Japanese', '🍣']], f: 'Konkani is the official language of Goa.' },
    { q: 'How many districts does Goa have?', a: ['Three', '3️⃣'], w: [['Ten', '🔟'], ['One', '1️⃣']], f: 'North Goa, South Goa and Kushavati. Kushavati is the newest!' },
  ],
  [ // rivers and nature
    { q: 'Which big waterfall is in Goa?', a: ['Dudhsagar', '💧'], w: [['Niagara', '🇨🇦'], ['Victoria', '🦒']], f: 'Dudhsagar means sea of milk. The water looks white like milk!' },
    { q: 'Which river flows past Panaji?', a: ['Mandovi', '🏞️'], w: [['Thames', '🎡'], ['Nile', '🐫']], f: 'The Mandovi river flows into the sea at Panaji.' },
    { q: 'How do people cross Goa\'s rivers on a boat?', a: ['Ferry', '⛴️'], w: [['Rocket', '🚀'], ['Tractor', '🚜']], f: 'Ferry boats carry people, bikes and scooters across the rivers.' },
    { q: 'What is Goa\'s state animal?', a: ['Gaur', '🐃'], w: [['Lion', '🦁'], ['Kangaroo', '🦘']], f: 'The gaur is a big, strong wild cow that lives in the forests.' },
    { q: 'Which turtles lay eggs on Goa\'s beaches?', a: ['Olive ridley', '🐢'], w: [['Ninja turtles', '🥷'], ['Tortoise', '🪨']], f: 'Olive ridley turtles nest at Morjim, Agonda and Galgibag beaches.' },
  ],
  [ // history and special days
    { q: 'Goa Liberation Day is on 19th December. It became free from the rule of which country in 1961?', a: ['Portugal', '🇵🇹'], w: [['France', '🇫🇷'], ['Spain', '🇪🇸']], f: 'Portugal ruled Goa for about 450 years, until 19th December 1961.' },
    { q: 'Goa Statehood Day is on 30th May. What did Goa become in 1987?', a: ['A state', '🏛️'], w: [['A country', '🌍'], ['An island', '🏝️']], f: 'On 30th May 1987 Goa became a state of India.' },
    { q: 'Is Goa the biggest or the smallest state of India?', a: ['The smallest', '🐜'], w: [['The biggest', '🐘'], ['The coldest', '🥶']], f: 'Goa is the smallest state of India by size, but full of fun!' },
    { q: 'In Old Goa there is a famous church called the Basilica of…', a: ['Bom Jesus', '⛪'], w: [['Big Ben', '🕰️'], ['Bananas', '🍌']], f: 'The Basilica of Bom Jesus is more than 400 years old.' },
    { q: 'What do Goans fly on Liberation Day and Independence Day?', a: ['The flag of India', '🇮🇳'], w: [['A kite with a cat', '🪁'], ['A balloon', '🎈']], f: 'Everyone celebrates with the Indian flag.' },
  ],
  [ // districts, towns and travel
    { q: 'Which town is the main town of South Goa?', a: ['Margao', '🛒'], w: [['Pernem', '🏡'], ['Valpoi', '🌳']], f: 'Margao is a busy town with a big market.' },
    { q: 'Which town is the main town of Kushavati district?', a: ['Quepem', '🏡'], w: [['Mapusa', '🛍️'], ['Calangute', '🏖️']], f: 'Quepem is the headquarters of Kushavati, Goa\'s newest district.' },
    { q: 'Goa has two airports. One is at Dabolim. Where is the new one?', a: ['Mopa', '✈️'], w: [['London', '🎡'], ['Colva beach', '🏖️']], f: 'Mopa airport is in Pernem, in North Goa.' },
    { q: 'Which train line runs along Goa by the sea and hills?', a: ['Konkan Railway', '🚆'], w: [['Hogwarts Express', '🧙'], ['Polar Express', '🎅']], f: 'The Konkan Railway goes through tunnels and over big bridges.' },
    { q: 'Which famous Goan market happens every Friday?', a: ['Mapusa market', '🧺'], w: [['Moon market', '🌙'], ['Snow market', '⛄']], f: 'At the Mapusa Friday market you can buy fruit, spices and sweets.' },
  ],
];
const quizPick = QUIZ.map(l => freshPicker(l));
export const quizferry = {
  id: 'quizferry', title: "Captain Goa's Quiz Ferry", icon: '⛴️', cat: 'goa', minBand: 2, color: '#4EA6DC',
  desc: 'Answer questions about Goa to sail the ferry across the river!',
  stages: ['Goa basics', 'Rivers and nature', 'History and special days', 'Towns and travel'],
  start: [0, 0, 1],
  rounds: 5,
  async question(ctx) {
    const q = quizPick[ctx.stage](), opts = shuffle([{ x: q.a, ok: true }, ...q.w.map(x => ({ x, ok: false }))]);
    const river = h('div', { class: 'river' }, h('span', { class: 'bank l' }, '🌴'), h('span', { class: 'ferry', style: `--p:${ctx.round / 5}` }, '⛴️'), h('span', { class: 'bank r' }, '🏁'));
    const ok = await choice(ctx, {
      prompt: q.q, parts: [q.q, `Is it ${opts.map(o => o.x[0]).join(', or ')}?`], show: river,
      options: opts.map(o => ({ node: tag(o.x[1], o.x[0]), ok: o.ok, label: o.x[0] })), cols: 3, after: q.f,
    });
    if (ctx.alive()) { const f = river.querySelector('.ferry'); sfx.toot(); f.style.setProperty('--p', (ctx.round + 1) / 5); await sleep(900); }
    return ok;
  },
};

/* ================= 5. Festival Fun ================= */
const FEST = [
  { k: 'carnival', name: 'Carnival', icon: '🎭', month: 'February', clue: 'King Momo leads a big parade with music, floats and masks.', thing: '🤴', thingName: 'King Momo' },
  { k: 'shigmo', name: 'Shigmo', icon: '🥁', month: 'March', clue: 'Colourful parades with dancers, flags and big drums called dhol and ghumot.', thing: '🚩', thingName: 'Colourful flags' },
  { k: 'saojoao', name: 'São João', icon: '🌸', month: 'June', clue: 'People wear flower crowns called kopels and jump into wells and ponds. Splash!', thing: '💦', thingName: 'A big splash' },
  { k: 'chovoth', name: 'Chovoth', icon: '🍍', month: 'August or September', clue: 'Families welcome Lord Ganesh and hang a matoli of fruits and leaves.', thing: '🥥', thingName: 'Matoli fruits' },
  { k: 'diwali', name: 'Diwali', icon: '🪔', month: 'October or November', clue: 'Lamps everywhere, and giant Narkasur figures are made the night before.', thing: '👹', thingName: 'Narkasur' },
  { k: 'christmas', name: 'Christmas', icon: '⭐', month: 'December', clue: 'Big stars outside houses, a crib, carols and sweets called kuswar.', thing: '🍪', thingName: 'Kuswar sweets' },
  { k: 'bonderam', name: 'Bonderam', icon: '🏳️', month: 'August', clue: 'On Divar island, people parade with flags and play a fun flag game.', thing: '🏝️', thingName: 'Divar island' },
  { k: 'xavier', name: 'Feast of Saint Francis Xavier', icon: '⛪', month: 'December', clue: 'On 3rd December, people visit the Basilica of Bom Jesus in Old Goa.', thing: '🕯️', thingName: 'Candles' },
];
const festPick = freshPicker(FEST);
const YEAR = ['carnival', 'saojoao', 'chovoth', 'diwali', 'christmas']; // always in this order through the year
export const festivals = {
  id: 'festivals', title: 'Festival Fun', icon: '🎉', cat: 'goa', minBand: 1, color: '#F06A6A',
  desc: 'Carnival, Shigmo, São João, Chovoth, Diwali, Christmas: Goa loves to celebrate!',
  stages: ['Which festival?', 'Festival things', 'Through the year'],
  start: [0, 0, 1],
  roundsFor: s => (s === 2 ? 3 : 5),
  question(ctx) {
    const st = ctx.stage;
    if (st === 0) {
      const f = festPick(), others = sample(FEST.filter(x => x.k !== f.k), 2), opts = shuffle([f, ...others]);
      const [t, p] = line(f.clue, 'Which festival is it?', 'Is it', P(opts[0].name), ',', P(opts[1].name), 'or', P(opts[2].name), '?');
      return choice(ctx, { prompt: t, parts: p, show: h('div', { class: 'festshow' }, em(f.icon, 'xxl'), em(f.thing, 'xl')),
        options: opts.map(o => ({ node: tag(o.icon, o.name), ok: o.k === f.k, label: o.name })), cols: 3, after: `Yes! ${f.name} is in ${f.month}.` });
    }
    if (st === 1) {
      const set = sample(FEST.slice(0, 7), 3);
      const scene = h('div', { class: 'bins n3' }, set.map(f => h('div', { class: 'bin fest', 'data-key': f.k }, em(f.icon, 'xl'), h('b', {}, f.name), h('div', { class: 'slot' }))));
      return drag(ctx, { prompt: 'Match each festival to its special thing!', scene,
        items: set.map(f => ({ key: f.k, node: h('span', { class: 'placecard' }, h('span', { class: 'gi' }, f.thing), h('b', {}, f.thingName)), say: `${f.thingName} for ${f.name}!`, hint: 'Hmm, not that festival. Try another!' })) }).then(() => true);
    }
    const ks = sample(YEAR, ctx.round === 0 ? 3 : 4).sort((a, b) => YEAR.indexOf(a) - YEAR.indexOf(b));
    const p = tapOrder(ctx, { prompt: 'Put the festivals in order through the year. Which comes first, after New Year?', lineClass: 'year',
      items: ks.map((k, i) => { const f = FEST.find(x => x.k === k); return { order: i, node: h('span', { class: 'gtag col' }, h('span', { class: 'gi' }, f.icon), h('b', {}, f.name), h('small', {}, f.month)) }; }) });
    return p.then(async () => { await ctx.say('Hooray! A whole year of Goan festivals.'); return true; });
  },
};

/* ================= 6. Say It in Konkani (DRAFT words: owner to check) ================= */
export const GREETINGS = [
  { k: 'dev-borem-korum', w: 'Dev borem korum', en: 'Thank you', pic: '🎁', when: 'Granny gives you a present. What do you say?' },
  { k: 'dev-boro-dis-dium', w: 'Dev boro dis dium', en: 'Good morning', pic: '🌅', when: 'You wake up and see your family. What do you say?' },
  { k: 'dev-bori-rat-dium', w: 'Dev bori rat dium', en: 'Good night', pic: '🌙', when: 'It is bedtime. What do you say?' },
  { k: 'kosso-asa', w: 'Kosso asa?', en: 'How are you? (to a boy or man)', pic: '🙋‍♂️', when: 'You meet your uncle. How do you ask how he is?' },
  { k: 'koxi-asa', w: 'Koxi asa?', en: 'How are you? (to a girl or woman)', pic: '🙋‍♀️', when: 'You meet your aunty. How do you ask how she is?' },
  { k: 'hanv-borem-asa', w: 'Hanv borem asa', en: "I'm fine", pic: '😊', when: 'Someone asks how you are. You feel great! What do you say?' },
  { k: 'tujem-nanv-kitem', w: 'Tujem nanv kitem?', en: "What's your name?", pic: '❓', when: 'You meet a new friend. How do you ask their name?' },
  { k: 'hoi', w: 'Hoi', en: 'Yes', pic: '👍', when: 'Would you like a mango? Say yes!' },
  { k: 'na', w: 'Na', en: 'No', pic: '🙅', when: 'Would you like a bath in cold water? Say no!' },
  { k: 'upkar-korun', w: 'Upkar korun', en: 'Please', pic: '🙏', when: 'You want some bebinca. What magic word do you say?' },
  { k: 'maf-kor', w: 'Maf kor', en: 'Sorry', pic: '😔', when: 'Oops, you bumped into your friend. What do you say?' },
];
const KG = g => ({ t: g.w, clip: 'konkani/' + g.k });
const greetPick = freshPicker(GREETINGS);
export const konkanitalk = {
  id: 'konkanitalk', title: 'Say It in Konkani', icon: '🗣️', cat: 'goa', minBand: 1, color: '#00897B',
  desc: 'Learn to say hello, thank you, please and more in Konkani.',
  stages: ['What does it mean?', 'What do you say?', 'Mix it up'],
  start: [0, 0, 0],
  question(ctx) {
    let st = ctx.stage; if (st === 2) st = rnd(0, 1);
    const g = greetPick(), others = sample(GREETINGS.filter(x => x.k !== g.k && x.en.slice(0, 6) !== g.en.slice(0, 6)), 2), opts = shuffle([g, ...others]);
    if (st === 0) {
      return choice(ctx, { prompt: `Listen: "${g.w}". What does it mean?`, parts: ['Listen:', KG(g), 'What does it mean?'],
        show: h('button', { class: 'bigsay', onclick: () => ctx.say(g.w, [KG(g)]) }, '🔊 ', h('b', {}, g.w)),
        options: opts.map(o => ({ node: tag(o.pic, o.en.replace(/ \(.*\)/, '')), ok: o.k === g.k, label: o.en })), cols: 3,
        after: `${g.w} means ${g.en.replace(/ \(.*\)/, '')}.`, afterParts: [KG(g), `means ${g.en.replace(/ \(.*\)/, '')}.`] });
    }
    return choice(ctx, { prompt: g.when, parts: [g.when],
      show: em(g.pic, 'xxl'),
      options: opts.map(o => ({ node: tag('🔊', o.w), ok: o.k === g.k, label: o.w })), cols: 3,
      after: `Yes! ${g.w}!`, afterParts: ['Yes!', KG(g)] });
  },
};

/* ================= 7. Goa's Special Symbols ================= */
const SYMBOLS = [
  { what: 'state animal', name: 'gaur', icon: '🐃', no: ['🦓', '🐪'], f: 'The gaur is a huge wild cow. It is also called the Indian bison.' },
  { what: 'state bird', name: 'flame-throated bulbul', icon: '🐤', no: ['🦉', '🐧'], f: 'The bulbul is a small yellow bird that sings in the forests.' },
  { what: 'state heritage tree', name: 'coconut palm', icon: '🌴', no: ['🌵', '🎄'], f: 'Coconut palms grow everywhere in Goa. Coconut is in Goan curries and sweets!' },
  { what: 'state fish', name: 'grey mullet, called shevtto', icon: '🐟', no: ['🦈', '🐙'], f: 'In Konkani the grey mullet is called shevtto.' },
  { what: 'state fruit', name: 'cashew', icon: '🥜', no: ['🍓', '🍍'], f: 'Cashews grow on trees, under a juicy cashew apple.' },
];
const symPick = freshPicker(SYMBOLS);
export const symbols = {
  id: 'symbols', title: "Goa's Special Symbols", icon: '🐃', cat: 'goa', minBand: 1, color: '#3A8A3F',
  desc: "Meet Goa's state animal, bird, tree, fish and fruit.",
  stages: ['Find the symbol', 'What is it?'],
  start: [0, 0, 1],
  question(ctx) {
    const s = symPick();
    if (ctx.stage === 0) return choice(ctx, { prompt: `Goa's ${s.what} is the ${s.name}. Which one is it?`, options: shuffle([{ node: em(s.icon, 'xl'), ok: true }, ...s.no.map(n => ({ node: em(n, 'xl'), ok: false }))]), cols: 3, after: s.f });
    const opts = shuffle([s, ...sample(SYMBOLS.filter(x => x !== s), 2)]);
    return choice(ctx, { prompt: `What is Goa's ${s.what}?`, parts: [`What is Goa's ${s.what}?`, `Is it the ${opts.map(o => o.name).join(', the ')}?`],
      options: opts.map(o => ({ node: tag(o.icon, o.name.replace(', called shevtto', '')), ok: o === s })), cols: 3, after: s.f });
  },
};

/* ================= 8. Goa Wildlife Safari ================= */
const HABITATS = [
  { k: 'beach', name: 'the beach', bg: 'linear-gradient(#8FD3F5 0 38%, #2F8FCB 38% 55%, #F2D9A0 55%)', animals: [['olive ridley turtle', '🐢', 'Olive ridley turtles lay their eggs in the sand at night.'], ['crab', '🦀', 'Little crabs run sideways into holes in the sand.'], ['dolphin', '🐬', 'Dolphins jump in the sea near Goa. Boat trips go to see them!'], ['seagull', '🕊️', 'Seagulls fly over the fishing boats.'], ['shell', '🐚', 'Shells wash up on the beach every day.']] },
  { k: 'forest', name: 'the forest', bg: 'linear-gradient(#BFE6B0 0 30%, #5FAE58 30% 75%, #3A8A3F 75%)', animals: [['gaur', '🐃', 'Gaurs live in forests like Mollem.'], ['peacock', '🦚', 'Peacocks dance with their beautiful tails.'], ['monkey', '🐒', 'Monkeys swing in the trees and love fruit.'], ['leopard', '🐆', 'Leopards hide in the forest. They are very shy.'], ['butterfly', '🦋', 'Goa has more than 200 kinds of butterflies!'], ['snake', '🐍', 'Snakes like the king cobra live in the forests of Goa.']] },
  { k: 'river', name: 'the river', bg: 'linear-gradient(#C9EDF7 0 35%, #3A8A3F 35% 45%, #4EA6DC 45%)', animals: [['crocodile', '🐊', 'Mugger crocodiles live in the Cumbarjua canal.'], ['frog', '🐸', 'Frogs croak loudly in the monsoon.'], ['fish', '🐟', 'Fishermen catch fish in the rivers too.'], ['heron', '🦩', 'Wading birds walk in the water at Chorao bird sanctuary.'], ['otter', '🦦', 'Otters swim and play in the rivers.']] },
];
export const safari = {
  id: 'safari', title: 'Goa Wildlife Safari', icon: '🐊', cat: 'goa', minBand: 1, color: '#5FAE58',
  desc: 'Spot turtles, gaurs, peacocks and crocodiles in Goa!',
  stages: ['Beach', 'Forest', 'River', 'Everywhere!'],
  start: [0, 0, 1],
  question(ctx) {
    const hab = ctx.stage === 3 ? pick(HABITATS) : HABITATS[ctx.stage];
    const shown = sample(hab.animals, Math.min(hab.animals.length, 3 + ctx.band)), want = pick(shown);
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const scene = h('div', { class: 'safari', style: `background:${hab.bg}` });
      const spots = shuffle([[12, 20], [70, 15], [40, 40], [15, 70], [78, 65], [48, 78], [28, 50], [62, 45]]);
      let wrong = 0, done = false;
      shown.forEach(([name, icon, fact], i) => {
        const [x, y] = spots[i];
        const a = h('button', { class: 'critter', style: `left:${x}%;top:${y}%;animation-delay:${i * 0.4}s`, 'aria-label': name }, icon);
        a.addEventListener('click', async () => {
          if (done || !ctx.alive()) return;
          if (name === want[0]) { done = true; a.classList.add('found'); await ctx.good(a); await ctx.say(fact); res(wrong === 0); }
          else { wrong++; ctx.bad(a); ctx.say(`That's ${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}. Find the ${want[0]}!`); if (wrong >= 2) scene.querySelector(`[aria-label="${want[0]}"]`)?.classList.add('hintme'); }
        });
        scene.append(a);
      });
      b.append(scene);
      ctx.say(`${ctx.round === 0 ? `Welcome to ${hab.name}! ` : ''}Can you find the ${want[0]}?`);
    });
  },
};

/* ================= 9. Goa Weather and Seasons ================= */
const SEASONS = {
  summer: { name: 'Summer', icon: '☀️', when: 'March to May', things: [['Mangoes', '🥭'], ['Cashew apples', '🍎'], ['Hot sunshine', '🌞'], ['Ice cream', '🍦']] },
  monsoon: { name: 'Monsoon', icon: '🌧️', when: 'June to September', things: [['Umbrella', '☂️'], ['Planting rice', '🌾'], ['Croaking frogs', '🐸'], ['Big waterfalls', '💧'], ['Gumboots', '🥾']] },
  winter: { name: 'Winter', icon: '🏖️', when: 'October to February', things: [['Christmas stars', '⭐'], ['Cool mornings', '🧣'], ['Beach days', '🏖️'], ['Kites', '🪁']] },
};
const RAIN = [
  { p: 'It is monsoon in Goa! Lots of rain. What do you need?', ok: '☂️', no: ['🕶️', '🧤'], f: 'An umbrella! The monsoon brings heavy rain from June to September.' },
  { p: 'In the monsoon, farmers plant something in the wet fields. What is it?', ok: '🌾', no: ['🍕', '🎄'], f: 'Rice! Goan farmers plant paddy in the monsoon.' },
  { p: 'Which fruit do Goans love in hot summer, in April and May?', ok: '🥭', no: ['🎃', '🥥'], f: 'Mangoes! The mancurad mango is a Goan favourite.' },
  { p: 'Who sings croak croak in the monsoon puddles?', ok: '🐸', no: ['🐄', '🐓'], f: 'Frogs! Goa is green and full of frogs in the rain.' },
  { p: 'In the monsoon the waterfalls are full. Which one is a waterfall?', ok: '💧', no: ['🔥', '🏜️'], f: 'Dudhsagar waterfall is huge and white in the monsoon.' },
  { p: 'In winter, the weather is cool and sunny. Where do families go?', ok: '🏖️', no: ['⛷️', '🌋'], f: 'To the beach! Winter is the best time for the beach in Goa.' },
];
const rainPick = freshPicker(RAIN);
export const seasons = {
  id: 'seasons', title: 'Goa Weather', icon: '🌧️', cat: 'goa', minBand: 1, color: '#4EA6DC',
  desc: 'Sunny summer, rainy monsoon and cool winter in Goa.',
  stages: ['Rain or shine?', 'Sort the seasons'],
  start: [0, 0, 0],
  roundsFor: s => (s === 1 ? 3 : 5),
  question(ctx) {
    if (ctx.stage === 0) { const q = rainPick(); return choice(ctx, { prompt: q.p, options: shuffle([{ node: em(q.ok, 'xl'), ok: true }, ...q.no.map(n => ({ node: em(n, 'xl'), ok: false }))]), cols: 3, after: q.f }); }
    const keys = ['summer', 'monsoon', 'winter'];
    const scene = h('div', { class: 'bins n3' }, keys.map(k => h('div', { class: 'bin season s-' + k, 'data-key': k }, em(SEASONS[k].icon, 'xl'), h('b', {}, SEASONS[k].name), h('small', {}, SEASONS[k].when), h('div', { class: 'slot' }))));
    const items = keys.flatMap(k => sample(SEASONS[k].things, ctx.band >= 2 ? 2 : 1).map(([n, i]) => ({ key: k, node: h('span', { class: 'placecard' }, h('span', { class: 'gi' }, i), h('b', {}, n)), say: `${n} in the ${SEASONS[k].name.toLowerCase()}!`, hint: 'Hmm, not in that season!' })));
    return drag(ctx, { prompt: 'Summer, monsoon or winter? Drag each one to its season.', scene, items }).then(() => true);
  },
};

/* ================= 10. Goan Kitchen ================= */
const DISHES = [
  { name: 'fish curry rice', icon: '🍛', need: [['fish', '🐟'], ['coconut', '🥥'], ['chilli', '🌶️']], fact: 'Fish curry rice is the favourite Goan lunch!' },
  { name: 'prawn curry', icon: '🦐', need: [['prawns', '🦐'], ['coconut', '🥥'], ['onion', '🧅']], fact: 'Goan prawn curry is orange, creamy and yummy.' },
  { name: 'bebinca', icon: '🍰', need: [['eggs', '🥚'], ['coconut', '🥥'], ['sugar', '🍬']], fact: 'Bebinca is a layered cake, made one layer at a time. It is a Christmas favourite.' },
  { name: 'mango juice', icon: '🧃', need: [['mangoes', '🥭'], ['ice', '🧊']], fact: 'Goan mangoes are so sweet!' },
];
const FOODS = [
  ['bebinca', '🍰', 'Bebinca is a cake with lots of layers.'], ['poee bread', '🫓', 'Poee is soft bread from the poder.'], ['sannas', '🍥', 'Sannas are fluffy steamed rice cakes.'],
  ['fish curry rice', '🍛', 'Fish curry rice is eaten almost every day in Goa.'], ['solkadi', '🥤', 'Solkadi is a pink drink made with kokum and coconut milk.'], ['mancurad mango', '🥭', 'Mancurad mangoes come in summer.'],
  ['cashew nuts', '🥜', 'Cashews grow on Goan cashew trees.'], ['patoleo', '🍃', 'Patoleo are sweets steamed in turmeric leaves, made in August.'],
];
const foodPick = freshPicker(FOODS);
const EXTRA = [['banana', '🍌'], ['cheese', '🧀'], ['carrot', '🥕'], ['grapes', '🍇'], ['broccoli', '🥦'], ['strawberry', '🍓']];
export const kitchen = {
  id: 'kitchen', title: 'Goan Kitchen', icon: '🍛', cat: 'goa', minBand: 1, color: '#E9B634',
  desc: 'Cook fish curry rice and bebinca, and learn Goan foods!',
  stages: ['What goes in?', 'Cook and count', 'Name the food'],
  start: [0, 1, 1],
  question(ctx) {
    const st = ctx.stage;
    if (st === 0) {
      const d = pick(DISHES), [n, i] = pick(d.need), opts = shuffle([[n, i], ...sample(EXTRA, 2)]);
      return choice(ctx, { prompt: `Let's make ${d.name}! Which one goes in?`, show: em(d.icon, 'xxl'), options: opts.map(([nn, ii]) => ({ node: em(ii, 'xl'), ok: nn === n, label: nn })), cols: 3, after: `Yes, ${n}! ${d.fact}` });
    }
    if (st === 1) {
      const d = pick(DISHES.slice(0, 3)), [n, i] = pick(d.need), want = rnd(2, ctx.band >= 3 ? 8 : 5);
      return new Promise(res => {
        const b = ctx.board; b.innerHTML = '';
        const pot = h('div', { class: 'pot' }, h('div', { class: 'potin' }), h('div', { class: 'potbody' }, '🍲'));
        const count = h('b', { class: 'bcount' }, '0');
        const shelf = h('div', { class: 'basket' });
        let done = false, wrongs = 0;
        const inPot = () => pot.querySelector('.potin').children.length;
        for (let k = 0; k < want + 3; k++) {
          const it = h('button', { class: 'bread' }, i);
          it.addEventListener('click', () => {
            if (done || !ctx.alive()) return;
            if (it.parentElement === shelf) { pot.querySelector('.potin').append(it); sfx.splash(); ctx.say(String(inPot())); }
            else { shelf.append(it); sfx.tap(); }
            count.textContent = inPot();
          });
          shelf.append(it);
        }
        b.append(h('div', { class: 'kitchen' }, pot, h('div', {}, `In the pot: `, count)), shelf,
          h('button', { class: 'btn big sun', onclick: async () => {
            if (done || !ctx.alive()) return;
            if (inPot() === want) { done = true; pot.classList.add('cooking'); await ctx.good(pot); await ctx.say(`Yum! ${want} ${n} in the ${d.name}.`); res(wrongs === 0); }
            else { wrongs++; ctx.bad(pot); ctx.say(inPot() < want ? `That's ${inPot()}. We need ${want}. Put in ${want - inPot()} more.` : `That's ${inPot()}. Too many! Take ${inPot() - want} out.`); }
          } }, 'Cook it! 🔥'));
        ctx.say(`We're making ${d.name}! Put ${want} ${n} in the pot.`);
      });
    }
    const f = foodPick(), opts = shuffle([f, ...sample(FOODS.filter(x => x !== f), 2)]);
    return choice(ctx, { prompt: `Which one is ${f[0]}?`, options: opts.map(o => ({ node: tag(o[1], o[0]), ok: o === f, label: o[0] })), cols: 3, after: f[2] });
  },
};

/* ================= 11. Ghumot Rhythm ================= */
const PADS = [
  { k: 'ghumot', name: 'Ghumot', icon: '🥁', play: () => sfx.drum(95), col: '#B5442E' },
  { k: 'cymbal', name: 'Cymbals', icon: '🔔', play: () => sfx.ting(), col: '#F3B72B' },
  { k: 'clap', name: 'Clap', icon: '👏', play: () => sfx.clap(), col: '#4EA6DC' },
  { k: 'drum2', name: 'Big drum', icon: '🪘', play: () => sfx.drum(60), col: '#3A8A3F' },
];
export const rhythm = {
  id: 'rhythm', title: 'Ghumot Rhythm', icon: '🥁', cat: 'goa', minBand: 1, color: '#B5442E',
  desc: 'Listen to the Goan drum beat and play it back!',
  stages: ['2 beats', '3 beats', '4 beats', '5 beats, faster!'],
  start: [0, 1, 1],
  rounds: 4,
  question(ctx) {
    const st = ctx.stage, len = st + 2, pads = PADS.slice(0, st === 0 ? 2 : st < 3 ? 3 : 4), gap = st === 3 ? 420 : 620;
    const seq = range(1, len).map(() => pick(pads));
    return new Promise(async res => {
      const b = ctx.board; b.innerHTML = '';
      const stageEl = h('div', { class: 'rhythm' });
      const btns = pads.map(p => h('button', { class: 'pad', style: `--c:${p.col}`, 'aria-label': p.name }, h('span', { class: 'em xl' }, p.icon), h('b', {}, p.name)));
      stageEl.append(...btns);
      const dots = h('div', { class: 'beats' }, seq.map(() => h('i')));
      b.append(h('div', { class: 'dancer' }, '💃🕺'), stageEl, dots);
      let pos = 0, wrong = 0, listening = false;
      const flash = (i) => { const el = btns[i]; el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 220); };
      const demo = async () => {
        listening = false; pos = 0; [...dots.children].forEach(d => (d.className = ''));
        await ctx.say(ctx.round === 0 && st === 0 ? 'The ghumot is a Goan drum made of clay. Listen to the beat, then play it back!' : 'Listen!');
        await sleep(300);
        for (const p of seq) { if (!ctx.alive()) return; const i = pads.indexOf(p); flash(i); p.play(); await sleep(gap); }
        listening = true; ctx.say('Your turn!');
      };
      btns.forEach((el, i) => el.addEventListener('click', async () => {
        if (!ctx.alive()) return;
        flash(i); pads[i].play();
        if (!listening) return;
        if (pads[i] === seq[pos]) {
          dots.children[pos].className = 'on'; pos++;
          if (pos === seq.length) { listening = false; b.querySelector('.dancer').classList.add('party'); await ctx.good(stageEl); res(wrong === 0); }
        } else { wrong++; ctx.mistake(); listening = false; ctx.bad(stageEl); await ctx.say('Oops! Listen again.'); await sleep(200); demo(); }
      }));
      demo();
    });
  },
};

/* ================= 12. Konkan Railway ================= */
const STATIONS = [['Pernem', 112, 42], ['Thivim', 105, 82], ['Karmali', 118, 142], ['Madgaon', 82, 236], ['Canacona', 135, 372]]; // north to south
export const railway = {
  id: 'railway', title: 'Konkan Railway', icon: '🚆', cat: 'goa', minBand: 2, color: '#6A4C93',
  desc: 'All aboard! Count the carriages and put the Goa stations in order.',
  stages: ['Count the carriages', '3 stations', '4 stations', 'All 5 stations'],
  start: [0, 0, 1],
  roundsFor: s => (s === 0 ? 5 : 3),
  question(ctx) {
    const st = ctx.stage;
    if (st === 0) {
      const n = rnd(2, ctx.band >= 3 ? 9 : 6);
      const train = h('div', { class: 'train' }, h('span', {}, '🚂'), range(1, n).map(() => h('span', {}, '🚃')));
      sfx.toot();
      return choice(ctx, { prompt: 'Choo choo! How many carriages does the train have?', show: train, options: numOpts(n, 1, 10).map(v => ({ node: numNode(v), ok: v === n })), cols: 3, after: `${n} carriages. All aboard the Konkan Railway!` });
    }
    const k = st + 2, set = STATIONS;
    const chosen = sample(range(0, 4), k).sort((a, b) => a - b).map(i => set[i]);
    const p = tapOrder(ctx, { prompt: 'Drive the train from north to south! Tap the stations in order, starting at the top of the map.', lineClass: 'rail',
      items: chosen.map((s, i) => ({ order: i, node: h('span', { class: 'gtag station' }, h('span', { class: 'gi' }, '🚉'), h('b', {}, s[0])) })) });
    const towns = chosen.map(s => s[0]);
    const svg = mapSVG({ labels: false }).replace('</svg>', chosen.map(s => `<circle cx="${s[1]}" cy="${s[2]}" r="7" fill="#6A4C93" stroke="#fff" stroke-width="3"/><text x="${s[1] + 11}" y="${s[2] + 5}" font-size="13" font-weight="700" fill="#142B57" paint-order="stroke" stroke="#fff" stroke-width="3">${s[0]}</text>`).join('') + '</svg>');
    ctx.board.prepend(h('div', { class: 'mapwrap mini' + (st === 3 ? ' faint' : ''), html: svg }));
    return p.then(async () => { sfx.toot(); await ask(ctx, 'Choo choo! We went from', P(towns[0]), 'to', P(towns[towns.length - 1]), '!'); return true; });
  },
};

/* ================= 13. Goa Monuments Memory ================= */
const MONUMENTS = [
  ['⛪', 'Bom Jesus', 'The Basilica of Bom Jesus in Old Goa is over 400 years old.'],
  ['🏰', 'Aguada Fort', 'Aguada Fort has a lighthouse and looks out over the sea.'],
  ['🛕', 'Mangueshi Temple', 'The Mangueshi temple in Ponda has a tall lamp tower.'],
  ['🕌', 'Safa Masjid', 'Safa Masjid in Ponda is a very old mosque with a water tank.'],
  ['💧', 'Dudhsagar Falls', 'Dudhsagar falls look like a sea of milk.'],
  ['🏘️', 'Fontainhas', 'Fontainhas in Panaji has colourful old houses.'],
  ['⛴️', 'Mandovi ferry', 'Ferries have crossed the Mandovi river for many years.'],
  ['🌉', 'Atal Setu bridge', 'Atal Setu is a big bridge over the Mandovi river in Panaji.'],
];
export const monuments = {
  id: 'monuments', title: 'Goa Memory Match', icon: '🏰', cat: 'goa', minBand: 1, color: '#1D4F91',
  desc: 'Find matching pairs of famous Goan places.',
  stages: ['4 cards', '6 cards', '8 cards', '12 cards'],
  start: [0, 1, 2],
  stars: (m, st) => { const p = [2, 3, 4, 6][st]; return m <= p ? 3 : m <= p * 2 ? 2 : 1; },
  board(ctx) {
    const pairs = [2, 3, 4, 6][ctx.stage], faces = sample(MONUMENTS, pairs), cards = shuffle([...faces, ...faces]);
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const grid = h('div', { class: 'memgrid', style: `--cols:${pairs <= 2 ? 2 : pairs === 3 ? 3 : 4}` });
      let open = [], found = 0, lock = false;
      cards.forEach(m => {
        const c = h('button', { class: 'card' }, h('span', { class: 'back' }, '🌴'), h('span', { class: 'face mono' }, h('span', {}, m[0]), h('small', {}, m[1])));
        c.addEventListener('click', async () => {
          if (lock || c.classList.contains('flip') || !ctx.alive()) return;
          c.classList.add('flip'); sfx.tap(); open.push([c, m]);
          if (open.length === 2) {
            lock = true; const [[c1, m1], [c2, m2]] = open; open = [];
            if (m1 === m2) {
              await sleep(300); c1.classList.add('match'); c2.classList.add('match'); sfx.good(); ctx.sparkle(c2); found++;
              await ctx.say(m1[2]);
              if (found === pairs) { await ctx.good(); lock = false; res(); return; }
            } else { ctx.mistake(); await sleep(900); c1.classList.remove('flip'); c2.classList.remove('flip'); }
            lock = false;
          }
        });
        grid.append(c);
      });
      b.append(grid);
      ctx.say('Find the matching pairs of famous Goan places!');
    });
  },
};

/** Everything the voice says with Goan words, for the voiceover list (used by tools/voiceovers.mjs). */
export const VOICE = { DIST, TOWNS, TALUKAS, PLACES, FEST, GREETINGS, STATIONS, MONUMENTS };
