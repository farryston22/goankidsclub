// Christmas: Goan and UK Christmas games. Kuswar sweets shared with neighbours, the big paper star outside Goan homes,
// the tree, an advent calendar, presents and stockings, jingle-bell rhythm, Christmas sounds (phonics) and puzzles.
import { h, rnd, pick, shuffle, sample, sleep, em, numOpts, freshPicker, range } from '../util.js';
import { choice, drag, tapOrder, numNode } from '../engine.js';
import { sfx } from '../audio.js';
import { SOUND } from '../data.js';

const tag = (icon, text) => h('span', { class: 'gtag' }, h('span', { class: 'gi' }, icon), h('b', {}, text));

/* ================= 1. Kuswar Kitchen ================= */
const KUSWAR = [
  ['neureos', '🥟', 'Neureos are little pastries filled with coconut and sugar.'],
  ['kulkuls', '🐚', 'Kulkuls are curly sweets, rolled on a fork to make them curly like shells.'],
  ['bebinca', '🍰', 'Bebinca is a cake with lots and lots of layers.'],
  ['dodol', '🍫', 'Dodol is a soft, dark sweet made with jaggery and coconut milk.'],
  ['marzipan', '🍬', 'Goan marzipan is made with cashew nuts and shaped like flowers and fruit.'],
  ['nankatai', '🍪', 'Nankatai are crumbly round biscuits.'],
  ['rose cookies', '🌸', 'Rose cookies are crispy and shaped like flowers.'],
];
const kPick = freshPicker(KUSWAR);
export const kuswar = {
  id: 'kuswar', title: 'Kuswar Kitchen', icon: '🥟', cat: 'christmas', minBand: 1, color: '#D84315',
  desc: 'Make Goan Christmas sweets, fill the tin and share kuswar with the neighbours!',
  stages: ['Name the sweets', 'Fill the tin', 'Share with neighbours'],
  start: [0, 1, 1],
  roundsFor: s => (s === 2 ? 3 : 5),
  question(ctx) {
    const st = ctx.stage;
    if (st === 0) {
      const k = kPick(), opts = shuffle([k, ...sample(KUSWAR.filter(x => x !== k), 2)]);
      return choice(ctx, { prompt: `At Christmas, Goan families make kuswar. Which one is ${k[0]}?`, options: opts.map(o => ({ node: tag(o[1], o[0]), ok: o === k, label: o[0] })), cols: 3, after: k[2] });
    }
    if (st === 1) {
      const k = pick(KUSWAR), want = rnd(2, ctx.band >= 3 ? 10 : 6);
      return new Promise(res => {
        const b = ctx.board; b.innerHTML = '';
        const tin = h('div', { class: 'kustin' }, h('div', { class: 'in' }), h('b', {}, '🥫'));
        const tray = h('div', { class: 'basket' });
        const count = h('b', { class: 'bcount' }, '0');
        let done = false, wrongs = 0;
        const n = () => tin.querySelector('.in').children.length;
        for (let i = 0; i < want + 3; i++) {
          const s = h('button', { class: 'bread' }, k[1]);
          s.addEventListener('click', () => { if (done || !ctx.alive()) return; if (s.parentElement === tray) { tin.querySelector('.in').append(s); sfx.drop(); ctx.say(String(n())); } else { tray.append(s); sfx.tap(); } count.textContent = n(); });
          tray.append(s);
        }
        b.append(h('div', { class: 'kitchen' }, tin, h('div', {}, 'In the tin: ', count)), tray,
          h('button', { class: 'btn big sun', onclick: async () => {
            if (done || !ctx.alive()) return;
            if (n() === want) { done = true; await ctx.good(tin); await ctx.say(`Yum! ${want} ${k[0]} in the tin, ready for Christmas.`); res(wrongs === 0); }
            else { wrongs++; ctx.bad(tin); ctx.say(n() < want ? `That's ${n()}. Put in ${want - n()} more.` : `That's ${n()}. Too many! Take ${n() - want} out.`); }
          } }, 'Close the tin ✓'));
        ctx.say(`Fill the tin with ${want} ${k[0]}.`);
      });
    }
    // share kuswar plates with neighbours: equal sharing
    const plates = rnd(2, 3), each = rnd(1, ctx.band >= 3 ? 4 : 3), k = pick(KUSWAR), names = sample(["Aunty Maria", 'Mr Naik', 'Granny Rosa', 'Uncle Tony', 'Mrs Shetye'], plates);
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const pile = h('div', { class: 'basket' }); for (let i = 0; i < plates * each; i++) pile.append(h('span', { class: 'bread' }, k[1]));
      const ps = names.map(nm => h('button', { class: 'sharebasket plate', 'aria-label': nm }, h('div', { class: 'in' }), h('b', {}, '🍽️'), h('small', {}, nm)));
      let done = false, wrongs = 0;
      ps.forEach(p => p.addEventListener('click', () => { if (done) return; const s = pile.querySelector('.bread'); if (s) { p.querySelector('.in').append(s); sfx.drop(); } }));
      b.append(h('p', { class: 'muted' }, 'Tap a plate to put a sweet on it'), pile, h('div', { class: 'sharerow' }, ps),
        h('div', { class: 'row gap center' },
          h('button', { class: 'btn ghost', onclick: () => { if (!done) { ps.forEach(p => p.querySelectorAll('.bread').forEach(x => pile.append(x))); sfx.tap(); } } }, '↺ Start again'),
          h('button', { class: 'btn big sun', onclick: async () => {
            if (done) return;
            if (pile.children.length) { wrongs++; ctx.bad(pile); return ctx.say('Share all the sweets first!'); }
            if (ps.every(p => p.querySelector('.in').children.length === each)) { done = true; await ctx.good(b.querySelector('.sharerow')); await ctx.say(`Fair sharing! ${each} each. In Goa, families share kuswar plates with their neighbours at Christmas.`); res(wrongs === 0); }
            else { wrongs++; ctx.bad(b.querySelector('.sharerow')); ctx.say('Not fair yet! Every plate needs the same.'); }
          } }, 'Is it fair? ✓')));
      ctx.say(`Share ${plates * each} ${k[0]} fairly between ${plates} neighbours.`);
    });
  },
};

/* ================= 2. Make a Christmas Star ================= */
const STARCOLS = [['red', '#E53935'], ['yellow', '#FDD835'], ['blue', '#1E88E5'], ['green', '#43A047'], ['pink', '#EC407A'], ['orange', '#FB8C00'], ['purple', '#8E24AA']];
const starSVG = (cols, now = -1) => {
  const cx = 120, cy = 125, R = 105, r = 44, pts = i => { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r : R; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; };
  let s = `<svg viewBox="0 0 240 270" class="xstar">`;
  for (let k = 0; k < 5; k++) { const [a, b2, c] = [pts(2 * k - 1 < 0 ? 9 : 2 * k - 1), pts(2 * k), pts(2 * k + 1)]; s += `<path class="ray${k === now ? ' now' : ''}" data-i="${k}" d="M${cx} ${cy} L${a.join(' ')} L${b2.join(' ')} L${c.join(' ')} Z" fill="${cols[k] || '#FFFDF6'}" stroke="#8A5A2B" stroke-width="3" stroke-linejoin="round"/>`; }
  s += `<circle cx="${cx}" cy="${cy}" r="16" fill="#FDD835" stroke="#8A5A2B" stroke-width="3"/>`;
  for (let k = 0; k < 4; k++) s += `<path d="M${cx - 30 + k * 20} 200 q-6 30 4 60" stroke="${cols[k] || '#E0D6B8'}" stroke-width="5" fill="none"/>`; // paper tails
  return s + '</svg>';
};
export const xstar = {
  id: 'xstar', title: 'Make a Christmas Star', icon: '🌟', cat: 'christmas', minBand: 1, color: '#FDD835',
  desc: 'Goan homes hang a big paper star at Christmas. Colour yours, point by point!',
  stages: ['Colour the points', 'How many points?', 'Design your own star'],
  start: [0, 0, 1],
  roundsFor: s => (s === 1 ? 4 : s === 2 ? 1 : 2),
  question(ctx) {
    const st = ctx.stage;
    if (st === 1) {
      const n = pick([4, 5, 6, 8]), sh = { 4: '✦', 5: '⭐', 6: '✡️', 8: '✴️' }[n];
      return choice(ctx, { prompt: ctx.round === 0 ? 'A Christmas star has points. How many points does a star like this have?' : 'Count the points on this star!', show: em(sh, 'xxl'), options: numOpts(n, 3, 9).map(v => ({ node: numNode(v), ok: v === n })), cols: 3, after: `${n} points!` });
    }
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const cols = Array(5).fill(null), want = range(1, 5).map(() => pick(STARCOLS));
      let sel = null, step = 0, wrong = 0, done = false;
      const view = h('div', { class: 'starview' });
      const draw = () => { view.innerHTML = starSVG(cols, st === 0 ? step : -1); view.querySelectorAll('.ray').forEach(r => r.addEventListener('click', () => paint(+r.dataset.i))); };
      const sw = h('div', { class: 'swatches' }, STARCOLS.map(([nm, c]) => h('button', { class: 'swatch', style: `--c:${c}`, 'aria-label': nm, onclick: e => { sel = [nm, c]; sw.querySelectorAll('.swatch').forEach(x => x.classList.toggle('on', x === e.currentTarget)); sfx.tap(); ctx.say(nm); } })));
      const ask = () => ctx.say(`Colour the shiny point ${want[step][0]}!`);
      const paint = async i => {
        if (done || !ctx.alive()) return;
        if (!sel) return ctx.say('First tap a colour!');
        if (st === 0) {
          if (i !== step) { wrong++; ctx.mistake(); return ctx.say('Colour the shiny point!'); }
          if (sel[0] !== want[step][0]) { wrong++; ctx.bad(view); return ctx.say(`That is ${sel[0]}. We need ${want[step][0]}!`); }
          cols[i] = sel[1]; sfx.drop(); step++; draw();
          if (step === 5) { done = true; await ctx.good(view); await ctx.say('What a bright Christmas star! Hang it outside for everyone to see.'); res(wrong === 0); } else ask();
        } else { cols[i] = sel[1]; sfx.drop(); draw(); }
      };
      draw();
      b.append(view, sw);
      if (st === 2) {
        b.append(h('button', { class: 'btn big sun', onclick: async () => {
          if (done) return; if (cols.some(c => !c)) return ctx.say('Colour every point first!');
          done = true; ctx.profile.xstar = [...cols]; await ctx.good(view); await ctx.say('Beautiful! Your own Goan Christmas star.'); res(true);
        } }, 'Finished! 🌟'));
        ctx.say('Design your own Christmas star! Pick a colour and tap each point.');
      } else ask();
    });
  },
};

/* ================= 3. Decorate the Tree ================= */
const BAUBLES = [['red', '#E53935'], ['gold', '#F9A825'], ['blue', '#1E88E5'], ['purple', '#8E24AA']];
const SPOTS = [[50, 30], [40, 45], [60, 45], [32, 60], [50, 58], [68, 60], [26, 76], [42, 74], [58, 74], [74, 76]];
const treeSVG = () => `<svg viewBox="0 0 200 240" class="xtree"><rect x="88" y="200" width="24" height="30" fill="#7B5A3A"/><path d="M100 10 L30 120 h25 L20 195 h160 L145 120 h25 Z" fill="#2E7D32" stroke="#1B5E20" stroke-width="4" stroke-linejoin="round"/><path d="M60 95 q40 18 80 0 M45 150 q55 22 110 0" stroke="#FDD835" stroke-width="3" fill="none" stroke-dasharray="6 5"/></svg>`;
export const tree = {
  id: 'tree', title: 'Decorate the Tree', icon: '🎄', cat: 'christmas', minBand: 1, color: '#2E7D32',
  desc: 'Count the baubles onto the Christmas tree and put the star on top!',
  stages: ['Count the baubles', 'Colours and counting', 'Two colours'],
  start: [0, 1, 1],
  roundsFor: () => 3,
  question(ctx) {
    const st = ctx.stage;
    const a = pick(BAUBLES), bcol = pick(BAUBLES.filter(x => x !== a));
    const na = rnd(2, st === 0 ? 5 : ctx.band >= 3 ? 6 : 4), nb = st === 2 ? rnd(1, 3) : 0;
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const wrap = h('div', { class: 'treewrap', html: treeSVG() });
      const topStar = h('button', { class: 'treetop', 'aria-label': 'Star' }, '⭐');
      let placed = [], done = false, wrongs = 0;
      const free = () => SPOTS.find((_, i) => !placed.some(p => p.i === i));
      const tray = h('div', { class: 'swatches' }, (st === 0 ? [a] : BAUBLES).map(([nm, c]) => h('button', { class: 'bauble', style: `--c:${c}`, 'aria-label': nm + ' bauble', onclick: () => {
        if (done || !ctx.alive()) return;
        const i = SPOTS.indexOf(free()); if (i < 0) return;
        const el = h('button', { class: 'onbauble', style: `--c:${c};left:${SPOTS[i][0]}%;top:${SPOTS[i][1]}%`, 'aria-label': 'Take off' });
        const rec = { i, nm, el }; placed.push(rec); sfx.ting(); wrap.append(el);
        el.addEventListener('click', () => { if (done) return; placed = placed.filter(p => p !== rec); el.remove(); sfx.tap(); });
        ctx.say(String(placed.filter(p => p.nm === nm).length) + ' ' + nm);
      } })));
      wrap.append(topStar);
      const prompt = st === 0 ? `Put ${na} baubles on the tree.` : st === 1 ? `Put ${na} ${a[0]} baubles on the tree.` : `Put ${na} ${a[0]} baubles and ${nb} ${bcol[0]} baubles on the tree.`;
      b.append(wrap, tray, h('button', { class: 'btn big sun', onclick: async () => {
        if (done || !ctx.alive()) return;
        const ca = placed.filter(p => p.nm === a[0]).length, cb = placed.filter(p => p.nm === bcol[0]).length, other = placed.length - ca - (st === 2 ? cb : 0);
        if (ca === na && (st < 2 || cb === nb) && other === 0) {
          done = true; topStar.classList.add('lit'); sfx.win(); await ctx.good(wrap); await ctx.say('The star goes on top. Happy Christmas!'); res(wrongs === 0);
        } else { wrongs++; ctx.bad(wrap); ctx.say(`Not quite. ${prompt} Tap a bauble on the tree to take it off.`); }
      } }, 'Light it up ✨'));
      ctx.say(prompt);
    });
  },
};

/* ================= 4. Advent Calendar ================= */
const TREATS = ['🍪', '⭐', '🔔', '🎁', '⛄', '🧦', '🕯️', '🦌', '🍬', '🎄', '🥟', '🌟'];
export const advent = {
  id: 'advent', title: 'Advent Calendar', icon: '📅', cat: 'christmas', minBand: 1, color: '#C62828',
  desc: 'Find the right door and open it for a surprise. Count down to Christmas!',
  stages: ['Doors 1 to 10', 'Doors 1 to 24', 'Open them in order', 'Days to Christmas'],
  start: [0, 1, 1],
  roundsFor: s => (s === 2 ? 1 : 5),
  question(ctx) {
    const st = ctx.stage;
    if (st === 3) {
      const d = rnd(15, 24), left = 25 - d;
      return choice(ctx, { prompt: `Today is the ${d}th of December. Christmas Day is the 25th. How many more sleeps until Christmas?`, show: h('div', { class: 'cal' }, h('b', {}, String(d)), h('span', {}, '➡️'), h('b', { class: 'xmas' }, '25 🎄')),
        options: numOpts(left, 1, 10).map(v => ({ node: numNode(v), ok: v === left })), cols: 3, after: `${left} more sleep${left > 1 ? 's' : ''} until Christmas!` });
    }
    const n = st === 0 ? 10 : 24, order = shuffle(range(1, n));
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const grid = h('div', { class: 'advent', style: `--cols:${n === 10 ? 5 : 6}` });
      let want = st === 2 ? 1 : rnd(1, n), wrong = 0, done = false;
      for (const num of order) {
        const d = h('button', { class: 'door', 'aria-label': 'Door ' + num }, h('span', { class: 'num' }, String(num)), h('span', { class: 'treat' }, pick(TREATS)));
        d.addEventListener('click', async () => {
          if (done || !ctx.alive() || d.classList.contains('open')) return;
          if (num === want) {
            d.classList.add('open'); sfx.ting();
            if (st === 2) { want++; if (want > n) { done = true; await ctx.good(grid); await ctx.say('You opened every door! Happy Christmas!'); res(wrong === 0); } else ctx.say(String(want)); return; }
            done = true; await ctx.good(d); await ctx.say(`Door ${num}! A surprise!`); res(wrong === 0);
          } else { wrong++; ctx.bad(d); ctx.say(`That is door ${num}. Find door ${want}!`); if (wrong >= 2 && st < 2) grid.querySelector(`[aria-label="Door ${want}"]`)?.classList.add('hintme'); }
        });
        grid.append(d);
      }
      b.append(grid);
      ctx.say(st === 2 ? 'Open the doors in order, starting with door 1!' : `Open door number ${want}!`);
    });
  },
};

/* ================= 5. Presents and Stockings ================= */
const PEOPLE = [['Sam', 's'], ['Tom', 't'], ['Pia', 'p'], ['Nina', 'n'], ['Mia', 'm'], ['Dan', 'd'], ['Gita', 'g'], ['Ben', 'b'], ['Rosa', 'r'], ['Lucas', 'l']];
export const presents = {
  id: 'presents', title: 'Presents and Stockings', icon: '🎁', cat: 'christmas', minBand: 1, color: '#AD1457',
  desc: 'Line up presents by size, find the name tags and fill the stockings.',
  stages: ['Biggest to smallest', 'Fill the stockings', 'Name tags'],
  start: [0, 0, 1],
  roundsFor: s => (s === 0 ? 3 : 4),
  question(ctx) {
    const st = ctx.stage;
    if (st === 0) {
      const k = ctx.band >= 2 ? 4 : 3, sizes = [34, 48, 62, 78].slice(4 - k);
      return tapOrder(ctx, { prompt: 'Tap the presents from the biggest to the smallest!', items: sizes.slice().reverse().map((s, i) => ({ order: i, node: h('span', { class: 'present', style: `font-size:${s}px` }, '🎁') })) })
        .then(async () => { await ctx.say('Biggest to smallest. Well done!'); return true; });
    }
    if (st === 1) {
      const want = rnd(1, ctx.band >= 3 ? 8 : 5), what = pick([['🍬', 'sweets'], ['🍊', 'oranges'], ['🪀', 'yo-yos'], ['🍫', 'chocolates']]);
      return new Promise(res => {
        const b = ctx.board; b.innerHTML = '';
        const sock = h('div', { class: 'kustin stocking' }, h('div', { class: 'in' }), h('b', {}, '🧦'));
        const tray = h('div', { class: 'basket' }), count = h('b', { class: 'bcount' }, '0');
        let done = false, wrongs = 0; const n = () => sock.querySelector('.in').children.length;
        for (let i = 0; i < want + 3; i++) { const s = h('button', { class: 'bread' }, what[0]); s.addEventListener('click', () => { if (done) return; if (s.parentElement === tray) { sock.querySelector('.in').append(s); sfx.drop(); ctx.say(String(n())); } else { tray.append(s); sfx.tap(); } count.textContent = n(); }); tray.append(s); }
        b.append(h('div', { class: 'kitchen' }, sock, h('div', {}, 'In the stocking: ', count)), tray, h('button', { class: 'btn big sun', onclick: async () => {
          if (done) return; if (n() === want) { done = true; await ctx.good(sock); await ctx.say(`${want} ${what[1]} in the stocking!`); res(wrongs === 0); }
          else { wrongs++; ctx.bad(sock); ctx.say(n() < want ? `That's ${n()}. Put in ${want - n()} more.` : `That's ${n()}. Too many!`); }
        } }, 'Done ✓'));
        ctx.say(`Put ${want} ${what[1]} in the stocking.`);
      });
    }
    const [name, l] = pick(PEOPLE), others = sample(PEOPLE.filter(p => p[1] !== l), 2), opts = shuffle([[name, l], ...others]);
    const s = { t: SOUND[l], clip: 'phonics/' + l };
    return choice(ctx, { prompt: `This present is for someone whose name starts with ${SOUND[l]}. Which tag?`, parts: ['This present is for someone whose name starts with', s, '. Which tag?'],
      show: em('🎁', 'xxl'), options: opts.map(([nm]) => ({ node: tag('🏷️', nm), ok: nm === name, label: nm })), cols: 3, after: `${name}! ${name} starts with ${SOUND[l]}.`, afterParts: [`${name}!`, `${name} starts with`, s] });
  },
};

/* ================= 6. Jingle Bells Rhythm ================= */
const BPADS = [
  { name: 'Bells', icon: '🔔', play: () => sfx.ting(), col: '#F9A825' },
  { name: 'Drum', icon: '🥁', play: () => sfx.drum(110), col: '#C62828' },
  { name: 'Clap', icon: '👏', play: () => sfx.clap(), col: '#1E88E5' },
  { name: 'Sleigh', icon: '🛷', play: () => sfx.note(880), col: '#2E7D32' },
];
export const jingle = {
  id: 'jingle', title: 'Jingle Bells Rhythm', icon: '🔔', cat: 'christmas', minBand: 1, color: '#F9A825',
  desc: 'Listen to the Christmas beat, then play it back on the bells and drum!',
  stages: ['2 beats', '3 beats', '4 beats', '5 beats'],
  start: [0, 1, 1], rounds: 4,
  question(ctx) {
    const st = ctx.stage, pads = BPADS.slice(0, st === 0 ? 2 : st < 3 ? 3 : 4), seq = range(1, st + 2).map(() => pick(pads));
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const btns = pads.map(p => h('button', { class: 'pad', style: `--c:${p.col}`, 'aria-label': p.name }, h('span', { class: 'em xl' }, p.icon), h('b', {}, p.name)));
      const dots = h('div', { class: 'beats' }, seq.map(() => h('i')));
      b.append(h('div', { class: 'dancer' }, '🎅🦌'), h('div', { class: 'rhythm' }, btns), dots);
      let pos = 0, wrong = 0, listening = false;
      const flash = i => { btns[i].classList.add('hit'); setTimeout(() => btns[i].classList.remove('hit'), 220); };
      const demo = async () => {
        listening = false; pos = 0; [...dots.children].forEach(d => (d.className = ''));
        await ctx.say(ctx.round === 0 ? 'Jingle bells! Listen to the beat, then play it back.' : 'Listen!'); await sleep(300);
        for (const p of seq) { if (!ctx.alive()) return; flash(pads.indexOf(p)); p.play(); await sleep(560); }
        listening = true; ctx.say('Your turn!');
      };
      btns.forEach((el, i) => el.addEventListener('click', async () => {
        if (!ctx.alive()) return; flash(i); pads[i].play(); if (!listening) return;
        if (pads[i] === seq[pos]) { dots.children[pos].className = 'on'; pos++; if (pos === seq.length) { listening = false; b.querySelector('.dancer').classList.add('party'); await ctx.good(b.querySelector('.rhythm')); res(wrong === 0); } }
        else { wrong++; ctx.mistake(); listening = false; await ctx.say('Oops! Listen again.'); demo(); }
      }));
      demo();
    });
  },
};

/* ================= 7. Christmas Sounds (phonics) ================= */
const XWORDS = [['s', '⭐', 'star'], ['s', '⛄', 'snowman'], ['b', '🔔', 'bell'], ['t', '🎄', 'tree'], ['c', '🕯️', 'candle'], ['p', '🎁', 'present'], ['r', '🦌', 'reindeer'], ['g', '🎁', 'gift'], ['c', '🍪', 'cookie'], ['s', '🧦', 'sock'], ['h', '🍫', 'hot chocolate'], ['a', '👼', 'angel'], ['m', '🧤', 'mittens'], ['k', '🥟', 'kuswar']];
const xPick = freshPicker(XWORDS);
export const xsounds = {
  id: 'xsounds', title: 'Christmas Sounds', icon: '⛄', cat: 'christmas', minBand: 2, color: '#0277BD',
  desc: 'Which Christmas thing starts with this sound? Star, bell, tree, candle…',
  stages: ['First sounds'], start: [0, 0, 0], rounds: 6,
  question(ctx) {
    const w = xPick(), others = sample(XWORDS.filter(x => SOUND[x[0]] !== SOUND[w[0]] && x[1] !== w[1]), 2), s = { t: SOUND[w[0]], clip: 'phonics/' + w[0] };
    return choice(ctx, { prompt: `Which one starts with ${SOUND[w[0]]}?`, parts: ['Which one starts with', s, '?'], options: shuffle([w, ...others]).map(o => ({ node: h('span', { class: 'gtag col' }, h('span', { class: 'gi' }, o[1]), h('b', {}, o[2])), ok: o === w, label: o[2] })), cols: 3,
      after: `${w[2]} starts with ${SOUND[w[0]]}!`, afterParts: [`${w[2]} starts with`, s, '!'] });
  },
};

/* ================= 8. Christmas Puzzles (memory + jigsaw) ================= */
const XFACES = [['🎄', 'Tree'], ['⭐', 'Star'], ['🎁', 'Present'], ['🔔', 'Bell'], ['⛄', 'Snowman'], ['🦌', 'Reindeer'], ['🕯️', 'Candle'], ['🧦', 'Stocking'], ['🎅', 'Santa'], ['🥟', 'Neureo'], ['🍰', 'Bebinca'], ['👼', 'Angel']];
const goanXmasSVG = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="#1D2F5E"/><circle cx="40" cy="30" r="2" fill="#fff"/><circle cx="260" cy="45" r="2" fill="#fff"/><circle cx="200" cy="20" r="2" fill="#fff"/><rect y="165" width="300" height="35" fill="#4E7A2E"/><path d="M60 90 L150 50 L240 90 Z" fill="#B5442E"/><rect x="70" y="90" width="160" height="80" fill="#F3D35B"/><rect x="135" y="120" width="30" height="50" fill="#2F6B4F"/><rect x="90" y="105" width="28" height="30" fill="#fff"/><rect x="182" y="105" width="28" height="30" fill="#fff"/><path d="M150 10 l8 20 h21 l-17 12 l7 21 l-19 -13 l-19 13 l7 -21 l-17 -12 h21 z" fill="#E53935" stroke="#FDD835" stroke-width="2"/><path d="M146 63 q-4 14 2 26 M154 63 q4 14 -2 26" stroke="#FDD835" stroke-width="2" fill="none"/><text x="240" y="185" font-size="34">🎄</text><text x="20" y="190" font-size="26">🎁</text></svg>`;
const snowSVG = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="#BBDEFB"/><rect y="140" width="300" height="60" fill="#fff"/><circle cx="150" cy="140" r="38" fill="#fff" stroke="#90A4AE" stroke-width="3"/><circle cx="150" cy="88" r="26" fill="#fff" stroke="#90A4AE" stroke-width="3"/><circle cx="142" cy="84" r="3"/><circle cx="158" cy="84" r="3"/><path d="M150 90 l14 4 l-14 3z" fill="#FB8C00"/><rect x="132" y="56" width="36" height="8" fill="#263238"/><rect x="138" y="36" width="24" height="22" fill="#263238"/><path d="M126 108 h48" stroke="#E53935" stroke-width="7"/><text x="30" y="150" font-size="40">🎄</text><text x="230" y="150" font-size="40">🎄</text></svg>`;
const XSCENES = [['a Goan house with its Christmas star', goanXmasSVG], ['a snowman', snowSVG]];
export const xpuzzles = {
  id: 'xpuzzles', title: 'Christmas Puzzles', icon: '🧩', cat: 'christmas', minBand: 1, color: '#6A1B9A',
  desc: 'Christmas memory pairs and picture jigsaws.',
  stages: ['Memory: 4 cards', 'Memory: 8 cards', 'Jigsaw: 4 pieces', 'Jigsaw: 6 pieces', 'Memory: 12 cards'],
  start: [0, 1, 2],
  async board(ctx) {
    const st = ctx.stage, b = ctx.board;
    if (st === 2 || st === 3) {
      const [c, r] = st === 2 ? [2, 2] : [3, 2];
      for (const [name, svg] of XSCENES) {
        if (!ctx.alive()) return;
        const url = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg())}")`, n = c * r;
        const grid = h('div', { class: 'jiggrid', style: `--c:${c};--r:${r};--img:${url}` });
        for (let i = 0; i < n; i++) grid.append(h('div', { class: 'jslot', 'data-key': 'p' + i }, h('div', { class: 'slot' })));
        const pos = i => `background-image:${url};background-size:${c * 100}% ${r * 100}%;background-position:${(i % c) / (c - 1) * 100}% ${Math.floor(i / c) / (r - 1) * 100}%`;
        await drag(ctx, { prompt: 'Make the Christmas picture!', scene: h('div', { class: 'jigwrap' }, grid), items: range(0, n - 1).map(i => ({ key: 'p' + i, node: h('span', { class: 'jpiece', style: `${pos(i)};--c:${c}` }) })), trayClass: 'jigtray' });
        grid.classList.add('done'); sfx.win(); if (ctx.alive()) await ctx.say(`You made ${name}!`);
      }
      return;
    }
    const pairs = [2, 4, 0, 0, 6][st], faces = sample(XFACES, pairs), cards = shuffle([...faces, ...faces]);
    return new Promise(res => {
      b.innerHTML = '';
      const grid = h('div', { class: 'memgrid', style: `--cols:${pairs <= 2 ? 2 : 4}` });
      let open = [], found = 0, lock = false;
      cards.forEach(f => {
        const cd = h('button', { class: 'card' }, h('span', { class: 'back' }, '🎄'), h('span', { class: 'face mono' }, h('span', {}, f[0]), h('small', {}, f[1])));
        cd.addEventListener('click', async () => {
          if (lock || cd.classList.contains('flip') || !ctx.alive()) return;
          cd.classList.add('flip'); sfx.tap(); open.push([cd, f]);
          if (open.length === 2) {
            lock = true; const [[c1, f1], [c2, f2]] = open; open = [];
            if (f1 === f2) { await sleep(300); c1.classList.add('match'); c2.classList.add('match'); sfx.ting(); ctx.sparkle(c2); found++; if (found === pairs) { await ctx.good(); lock = false; res(); return; } }
            else { ctx.mistake(); await sleep(900); c1.classList.remove('flip'); c2.classList.remove('flip'); }
            lock = false;
          }
        });
        grid.append(cd);
      });
      b.append(grid);
      ctx.say('Find the matching Christmas pairs!');
    });
  },
};
