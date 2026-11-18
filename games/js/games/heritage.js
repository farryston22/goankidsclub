// Goan Heritage: Indo-Portuguese houses, the poder's bread round, azulejo tiles, Goan life and festivals.
import { h, rnd, pick, shuffle, sample, sleep, em, numOpts, freshPicker } from '../util.js';
import { choice, numNode } from '../engine.js';
import { sfx } from '../audio.js';
import { WALLS, houseSVG, tileSVG, TILE_KINDS } from '../art.js';

const houseNode = (o, cls = '') => h('span', { class: 'house ' + cls, html: houseSVG(o) });
const tileNode = (k, r = 0, alt = false) => h('span', { class: 'tile', html: tileSVG(k, r, alt) });

/* ---------- Build a Goan House ---------- */
const PAINTS = [['yellow', WALLS.yellow], ['blue', WALLS.blue], ['pink', WALLS.pink], ['green', WALLS.green], ['orange', WALLS.orange], ['sky blue', WALLS.skyblue]];
const DOORS = [['green', '#2F6B4F'], ['blue', '#2B4C8C'], ['brown', '#7B5A3A'], ['red', '#A83A2F']];
export const house = {
  id: 'house', title: 'Build a Goan House', icon: '🏡', cat: 'heritage', minBand: 1, color: '#E9B634',
  desc: 'Paint a Goan house, add oyster-shell windows and a balcão porch.',
  stages: ['Paint the walls', 'Count the windows', 'Colour and windows', 'Add a balcão', 'Design your own house'],
  start: [0, 1, 2], rounds: 3,
  roundsFor: s => (s === 4 ? 1 : 3),
  question(ctx) {
    const st = ctx.stage;
    const d = Object.assign({ wall: WALLS.yellow, windows: 2, balcao: false, door: '#2F6B4F' }, st === 4 ? ctx.profile.house || {} : {});
    if (st !== 4) { d.wall = '#EFE7D6'; d.windows = st === 0 ? 2 : 0; d.balcao = false; }
    const want = { paint: pick(PAINTS), windows: rnd(1, 4), balcao: Math.random() < 0.6 };
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const view = h('div', { class: 'houseview' });
      const draw = () => { view.innerHTML = houseSVG(d); };
      draw();
      let wrongs = 0, done = false;
      const panel = h('div', { class: 'builder' });
      const nameOf = c => (PAINTS.find(p => p[1] === c) || ['that colour'])[0];
      const finish = async (msg) => { done = true; ctx.sparkle(view); await ctx.good(view); if (msg) await ctx.say(msg); res(wrongs === 0); };

      // paint swatches
      const sw = h('div', { class: 'swatches' }, PAINTS.map(([n, c]) => h('button', {
        class: 'swatch', style: `--c:${c}`, 'aria-label': n, onclick: async () => {
          if (done || !ctx.alive()) return;
          d.wall = c; draw(); sfx.tap();
          if (st === 0) { if (n === want.paint[0]) finish(`A ${n} Goan house!`); else { wrongs++; ctx.bad(view); ctx.say(`That's ${n}. Paint the house ${want.paint[0]}!`); } }
        },
      })));
      // windows stepper
      const wn = h('b', { class: 'wcount' }, String(d.windows));
      const step = v => { if (done) return; d.windows = Math.max(0, Math.min(4, d.windows + v)); wn.textContent = d.windows; draw(); sfx.tap(); if (v > 0) ctx.say(String(d.windows)); };
      const win = h('div', { class: 'stepper' }, h('button', { class: 'btn ghost', onclick: () => step(-1), 'aria-label': 'Fewer windows' }, '−'), h('span', {}, '🪟 Windows: '), wn, h('button', { class: 'btn ghost', onclick: () => step(1), 'aria-label': 'More windows' }, '+'));
      // balcão toggle
      const bal = h('button', { class: 'btn ghost toggle', onclick: () => { if (done) return; d.balcao = !d.balcao; bal.classList.toggle('on', d.balcao); bal.textContent = d.balcao ? '✅ Balcão porch' : '➕ Balcão porch'; draw(); sfx.tap(); if (d.balcao) ctx.say('A balcão! A porch with seats to sit and chat.'); } }, d.balcao ? '✅ Balcão porch' : '➕ Balcão porch');
      bal.classList.toggle('on', d.balcao);
      const doors = h('div', { class: 'swatches small' }, h('span', { class: 'muted' }, 'Door:'), DOORS.map(([n, c]) => h('button', { class: 'swatch', style: `--c:${c}`, 'aria-label': n + ' door', onclick: () => { d.door = c; draw(); sfx.tap(); } })));

      const check = h('button', {
        class: 'btn big', onclick: async () => {
          if (done || !ctx.alive()) return;
          if (st === 4) { ctx.profile.house = { ...d }; return finish('What a beautiful Goan house! It is now in your village.'); }
          const errs = [];
          if (st >= 2 && d.wall !== want.paint[1]) errs.push(`paint it ${want.paint[0]}`);
          if (st >= 1 && d.windows !== want.windows) errs.push(`give it ${want.windows} window${want.windows > 1 ? 's' : ''}`);
          if (st === 3 && d.balcao !== want.balcao) errs.push(want.balcao ? 'add a balcão' : 'take away the balcão');
          if (!errs.length) finish('Perfect! Just like a real Goan house.');
          else { wrongs++; ctx.bad(view); ctx.say(`Nearly! Now ${errs.join(' and ')}.`); }
        },
      }, st === 4 ? 'Finished! 🏡' : 'Done ✓');

      if (st === 0) panel.append(sw);
      else if (st === 1) panel.append(win, check);
      else if (st === 2) panel.append(sw, win, check);
      else if (st === 3) panel.append(sw, win, bal, check);
      else panel.append(sw, win, bal, doors, check);
      b.append(view, panel);

      const wTxt = `${want.windows} window${want.windows > 1 ? 's' : ''}`;
      const prompt = [
        `Paint the house ${want.paint[0]}!`,
        `Give the house ${wTxt}. Tap plus to add a window.`,
        `Make a ${want.paint[0]} house with ${wTxt}.`,
        `Build a ${want.paint[0]} house with ${wTxt}, ${want.balcao ? 'and a balcão porch' : 'and no balcão'}.`,
        'Design your very own Goan house! Choose the colours, windows and a balcão.',
      ][st];
      ctx.say(prompt);
    });
  },
};

/* ---------- The Poder's Bread Round ---------- */
const NAMES = ["Mrs D'Souza", 'Mr Naik', 'Granny Fernandes', 'Mr Pereira', 'Mrs Gaonkar', 'Uncle Rodrigues', 'Mrs Kamat', 'Aunty Colaço', 'Mr Dias', 'Mrs Sawant'];
const BREAD = '🫓';
const horn = () => { sfx.note(330); setTimeout(() => sfx.note(330), 180); };
export const poder = {
  id: 'poder', title: "Poder's Bread Round", icon: '🚲', cat: 'heritage', minBand: 1, color: '#C98A3E',
  desc: 'Help the poder deliver fresh poee bread to each house. Pom pom!',
  stages: ['Up to 3 poee', 'Up to 5 poee', 'Up to 10 poee', 'Two houses: how many?'],
  start: [0, 1, 2],
  question(ctx) {
    const st = ctx.stage, who = pick(NAMES), wall = pick(Object.values(WALLS));
    if (st === 3) {
      const [n1, n2] = sample(NAMES, 2), a = rnd(1, 5), c = rnd(1, 5);
      const show = h('div', { class: 'orders' },
        h('div', { class: 'order' }, houseNode({ wall: pick(Object.values(WALLS)), windows: 2, balcao: true }), h('b', {}, `${a} ${BREAD}`)),
        h('div', { class: 'order' }, houseNode({ wall: pick(Object.values(WALLS)), windows: 1, balcao: false }), h('b', {}, `${c} ${BREAD}`)));
      horn();
      return choice(ctx, { prompt: `${n1} wants ${a} poee. ${n2} wants ${c}. How many poee does the poder need?`, show, options: numOpts(a + c, 2, 12).map(v => ({ node: numNode(v), ok: v === a + c })), after: `${a} and ${c} make ${a + c}. Pom pom!` });
    }
    const max = [3, 5, 10][st], want = rnd(1, max);
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const bag = h('div', { class: 'breadbag' });
      const count = h('b', { class: 'bcount' }, '0');
      let wrongs = 0, done = false;
      const n = () => bag.children.length;
      const basket = h('div', { class: 'basket' });
      for (let i = 0; i < Math.max(want + 2, Math.min(max + 2, 10)); i++) {
        const br = h('button', { class: 'bread' }, BREAD);
        br.addEventListener('click', () => {
          if (done || !ctx.alive()) return;
          if (br.parentElement === basket) { bag.append(br); sfx.drop(); ctx.say(String(n())); }
          else { basket.append(br); sfx.tap(); }
          count.textContent = n();
        });
        basket.append(br);
      }
      b.append(
        h('div', { class: 'delivery' },
          h('div', { class: 'order' }, houseNode({ wall, windows: rnd(1, 2), balcao: true }), h('div', { class: 'sign' }, `${who}: ${want} ${BREAD} please!`)),
          h('div', { class: 'bagwrap' }, h('div', { class: 'muted small' }, 'Bag for the house'), bag, h('div', {}, 'In the bag: ', count))),
        h('div', { class: 'poder' }, h('span', { class: 'bike' }, '🚲'), h('div', { class: 'muted small' }, "Poder's basket: tap a poee to put it in the bag"), basket),
        h('button', {
          class: 'btn big sun', onclick: async () => {
            if (done || !ctx.alive()) return;
            if (n() === want) { done = true; horn(); await ctx.good(bag); await ctx.say(`Pom pom! ${who} has ${want} fresh poee.`); res(wrongs === 0); }
            else { wrongs++; ctx.bad(bag); ctx.say(n() < want ? `That's ${n()}. ${who} wants ${want}. Put in ${want - n()} more.` : `That's ${n()}. Too many! Take ${n() - want} back.`); }
          },
        }, 'Deliver! 🔔'));
      horn();
      ctx.say(`Pom pom! ${who} wants ${want} poee. Put ${want} in the bag.`);
    });
  },
};

/* ---------- Azulejo Tiles (patterns and symmetry) ---------- */
export const tiles = {
  id: 'tiles', title: 'Azulejo Tiles', icon: '🔷', cat: 'heritage', minBand: 1, color: '#1F4E9E',
  desc: 'Finish the blue and white tile walls of Panjim.',
  stages: ['Same tiles', 'Checkerboard', 'Stripes', 'Turn the tile'],
  start: [0, 1, 2],
  question(ctx) {
    const st = ctx.stage, size = st === 3 ? 4 : 3;
    const [A, B, C] = sample(TILE_KINDS.filter(k => k !== 'arc'), 3);
    const at = (i, j) => {
      if (st === 0) return [A, 0];
      if (st === 1) return [(i + j) % 2 ? A : B, 0];
      if (st === 2) return [i % 2 ? A : B, 0];
      return ['arc', [[180, 270], [90, 0]][i % 2][j % 2]];
    };
    const gi = rnd(0, size - 1), gj = rnd(0, size - 1), [ak, ar] = at(gi, gj);
    const wall = h('div', { class: 'tilewall', style: `--n:${size}` });
    for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) {
      if (i === gi && j === gj) wall.append(h('span', { class: 'tile q' }, '?'));
      else { const [k, r] = at(i, j); wall.append(tileNode(k, r)); }
    }
    let opts;
    if (st === 3) opts = shuffle([ar, ...sample([0, 90, 180, 270].filter(r => r !== ar), 2)]).map(r => ({ node: tileNode('arc', r), ok: r === ar }));
    else opts = shuffle([ak, ...[A, B, C].filter(k => k !== ak).slice(0, 2)]).map(k => ({ node: tileNode(k), ok: k === ak }));
    return choice(ctx, {
      prompt: st === 3 ? 'Turn the tile! Which way makes the circles?' : 'Which tile finishes the wall?', show: wall,
      options: opts, cols: 3, after: ctx.round === 0 ? 'Azulejos are painted tiles from Portugal. You can see them on old houses in Panjim.' : 'Lovely tiles!',
    });
  },
};

/* ---------- Goa Life: village, festivals, places ---------- */
const kopel = () => h('span', { class: 'kopel' }, '🌼🌺🌸🌼🌺');
const Q = [
  [ // village life
    { p: 'Who brings fresh bread every morning, honking a horn? Pom pom!', ok: () => h('span', { class: 'em xl' }, '🚲🧺'), no: ['🚒', '🚀'], f: 'The poder! He rides his bicycle with a basket of fresh poee and pão.' },
    { p: 'Goans love fish curry and rice! Which one is a fish?', ok: '🐟', no: ['🐄', '🐔'], f: 'Fish curry and rice is a favourite Goan meal.' },
    { p: 'Which tree gives us coconuts?', ok: '🌴', no: ['🌲', '🌵'], f: 'Goa has lots of coconut palms. Coconut goes in Goan curries and sweets.' },
    { p: 'Mancurad is a famous Goan fruit. Which one is a mango?', ok: '🥭', no: ['🍎', '🍌'], f: 'Mancurad mangoes from Goa are super sweet!' },
    { p: 'How do Goan fishermen go out to sea?', ok: '🚣', no: ['🚗', '🚂'], f: 'Fishermen go out in boats very early and bring fresh fish to the market.' },
    { p: 'Lots of cashews grow in Goa. Which one is a nut?', ok: '🥜', no: ['🍬', '🍇'], f: 'Cashew nuts grow on cashew trees, below a juicy cashew apple.' },
  ],
  [ // festivals
    { p: 'On São João, children wear a flower crown called a kopel. Which one is the kopel?', ok: kopel, no: ['🎩', '🧢'], f: 'São João is in June. People wear kopels and jump into wells and ponds. Splash!' },
    { p: 'At Christmas, Goans hang a big star outside the house. Which one?', ok: '⭐', no: ['🎃', '🪁'], f: 'Goans also make Christmas sweets called kuswar.' },
    { p: 'Bebinca is a Goan cake with lots of layers. Which one is the cake?', ok: '🍰', no: ['🍦', '🍕'], f: 'Bebinca is made with coconut milk, eggs and sugar, one layer at a time.' },
    { p: 'At Carnival there are parades with music. What do people wear?', ok: '🎭', no: ['🧤', '🥽'], f: 'King Momo leads the Carnival parade!' },
    { p: 'At Shigmo, Goans play a clay drum called the ghumot. Which one is a drum?', ok: '🥁', no: ['🎸', '🎹'], f: 'Shigmo is a spring festival with colourful floats and dancing.' },
    { p: 'At Diwali, homes are lit with little lamps. Which one is a lamp?', ok: '🪔', no: ['🔦', '🚦'], f: 'Diwali is the festival of lights.' },
    { p: 'At Chovoth, families hang a matoli with fruits from the forest. Which one is a fruit?', ok: '🍍', no: ['🚗', '🧸'], f: 'Chovoth, or Ganesh Chaturthi, is a big family festival in Goa.' },
  ],
  [ // places and houses
    { p: 'Goa has beautiful white churches. Which one is a church?', ok: '⛪', no: ['🏰', '🏭'], f: 'The Basilica of Bom Jesus in Old Goa is very old and famous.' },
    { p: 'Which one is a Goan beach?', ok: '🏖️', no: ['🏔️', '🏜️'], f: 'Goa has lots of beaches, like Calangute, Colva and Palolem.' },
    { p: 'Old Goan houses have windows made from shells! Which one is a shell?', ok: '🦪', no: ['🧊', '🍬'], f: 'Shell windows are called carepas. They let soft light into the house.' },
    { p: 'Old houses in Panjim have painted tiles called azulejos. Which one is an azulejo?', ok: () => tileNode('flower'), no: ['🧱', '🪟'], f: 'You can see azulejos in Fontainhas, the old Latin Quarter of Panjim.' },
    { p: 'A Goan house has a front porch with seats, called a balcão. Which house has a balcão?', ok: () => houseNode({ wall: WALLS.pink, windows: 2, balcao: true }), no: [() => houseNode({ wall: WALLS.blue, windows: 2, balcao: false }), () => houseNode({ wall: WALLS.green, windows: 1, balcao: false })], f: 'Families sit on the balcão in the evening to chat with neighbours.' },
    { p: 'Goan houses are painted bright colours. Which one is a Goan house?', ok: () => houseNode({ wall: WALLS.yellow, windows: 2, balcao: true }), no: ['🏢', '⛺'], f: 'Goan houses have red roofs made of Mangalore tiles.' },
  ],
];
const pickers = Q.map(list => freshPicker(list));
const opt = x => (typeof x === 'function' ? x() : em(x, 'xl'));
export const goalife = {
  id: 'goalife', title: 'Goa Life', icon: '⛪', cat: 'heritage', minBand: 2, color: '#3D6FB6',
  desc: 'Learn about Goan village life, festivals and places.',
  stages: ['Village life', 'Festivals', 'Goan places'],
  start: [0, 0, 0],
  question(ctx) {
    const q = pickers[ctx.stage]();
    return choice(ctx, { prompt: q.p, options: shuffle([{ node: opt(q.ok), ok: true }, ...q.no.map(n => ({ node: opt(n), ok: false }))]), cols: 3, after: q.f });
  },
};
