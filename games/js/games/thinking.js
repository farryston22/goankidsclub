// Thinking games: memory, sorting, comparing, visual matching (EYFS Characteristics of Effective Learning).
import { h, rnd, pick, shuffle, sample, sleep, em } from '../util.js';
import { choice, tapOrder } from '../engine.js';
import { sfx } from '../audio.js';
import { shapeEl } from '../data.js';

const DECKS = [
  ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵'],
  ['🍎', '🍌', '🍓', '🥭', '🍉', '🍇', '🍍', '🥥'],
  ['🚗', '🚌', '🚂', '✈️', '🚀', '⛵', '🚒', '🚜'],
  ['🦀', '🐢', '🐬', '🐙', '🐟', '🦐', '🐚', '🌴'],
];

export const memory = {
  id: 'memory', title: 'Memory Match', icon: '🃏', cat: 'thinking', minBand: 1, color: '#8D6E63',
  desc: 'Turn over cards and find the pairs.',
  stages: ['4 cards', '6 cards', '8 cards', '12 cards', '16 cards'],
  start: [0, 1, 2],
  stars: (m, st) => { const p = [2, 3, 4, 6, 8][st]; return m <= p ? 3 : m <= p * 2 ? 2 : 1; },
  board(ctx) {
    const pairs = [2, 3, 4, 6, 8][ctx.stage];
    const faces = sample(pick(DECKS), pairs);
    const cards = shuffle([...faces, ...faces]);
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const cols = pairs <= 2 ? 2 : pairs <= 4 ? (pairs === 3 ? 3 : 4) : 4;
      const grid = h('div', { class: 'memgrid', style: `--cols:${cols}` });
      let open = [], found = 0, lock = false;
      cards.forEach(f => {
        const c = h('button', { class: 'card' }, h('span', { class: 'back' }, '🌴'), h('span', { class: 'face' }, f));
        c.addEventListener('click', async () => {
          if (lock || c.classList.contains('flip') || !ctx.alive()) return;
          c.classList.add('flip'); sfx.tap(); open.push([c, f]);
          if (open.length === 2) {
            lock = true;
            const [[c1, f1], [c2, f2]] = open; open = [];
            if (f1 === f2) {
              await sleep(300); c1.classList.add('match'); c2.classList.add('match'); sfx.good(); ctx.sparkle(c2); found++;
              if (found === pairs) { await sleep(400); await ctx.good(); lock = false; res(); return; }
            } else { ctx.mistake(); await sleep(900); c1.classList.remove('flip'); c2.classList.remove('flip'); }
            lock = false;
          }
        });
        grid.append(c);
      });
      b.append(grid);
      ctx.say('Find the matching pairs!');
    });
  },
};

const CATS = {
  fruit: ['🍎', '🍌', '🍓', '🍇', '🍉', '🥭', '🍍', '🍐'],
  animals: ['🐶', '🐱', '🐄', '🐷', '🐑', '🐴', '🐔', '🐰'],
  vehicles: ['🚗', '🚌', '🚂', '🚜', '🚲', '🚒', '🚑', '🛵'],
  sky: ['✈️', '🚁', '🚀', '🎈', '🪁', '🦅'],
  sea: ['🐟', '🐙', '🦀', '🐬', '🐳', '🦈'],
  clothes: ['👕', '👖', '🧦', '🧢', '👗', '🧤'],
};
const BR = ['#E53935', '#1E88E5', '#FDD835', '#43A047', '#8E24AA', '#FB8C00'];
export const odd = {
  id: 'odd', title: 'Odd One Out', icon: '🔍', cat: 'thinking', minBand: 1, color: '#78909C',
  desc: 'Find the one that does not belong.',
  stages: ['Different colour', 'Different shape', 'Different group', 'Tricky groups'],
  start: [0, 1, 2],
  question(ctx) {
    const st = ctx.stage;
    let items, oddIdx = rnd(0, 3), why;
    if (st === 0) {
      const [a, b] = sample(BR, 2), s = pick(['circle', 'square', 'triangle', 'star', 'heart']);
      items = [0, 1, 2, 3].map(i => shapeEl(s, i === oddIdx ? b : a)); why = 'It is a different colour.';
    } else if (st === 1) {
      const [a, b] = sample(['circle', 'square', 'triangle', 'star', 'heart', 'oval'], 2), c = pick(BR);
      items = [0, 1, 2, 3].map(i => shapeEl(i === oddIdx ? b : a, c)); why = 'It is a different shape.';
    } else {
      const keys = st === 2 ? ['fruit', 'animals', 'vehicles', 'clothes'] : ['vehicles', 'sky', 'sea', 'animals'];
      const [main, other] = sample(keys, 2);
      const m = sample(CATS[main], 3), o = pick(CATS[other].filter(x => !CATS[main].includes(x)));
      const all = [...m]; all.splice(oddIdx, 0, o);
      items = all.map(e => em(e, 'xl')); why = `The others are all ${main === 'sky' ? 'things in the sky' : main === 'sea' ? 'sea animals' : main}.`;
    }
    return choice(ctx, { prompt: 'Which one is the odd one out?', options: items.map((n, i) => ({ node: n, ok: i === oddIdx })), cols: 2, after: why });
  },
};

export const sizes = {
  id: 'sizes', title: 'Big and Small', icon: '🐘', cat: 'thinking', minBand: 1, color: '#9CCC65',
  desc: 'Big, small, tall, short — and put them in order.',
  stages: ['Find the big one', 'Find the small one', 'Tallest and shortest', 'Smallest to biggest', 'Order five'],
  start: [0, 1, 2],
  question(ctx) {
    const st = ctx.stage, e = pick(['🐘', '🐻', '🍎', '⭐', '🐢', '🌻', '🥥', '🏠']);
    const sizeNode = (s, ch = e) => h('span', { class: 'em', style: `font-size:${s}px;line-height:1` }, ch);
    if (st <= 1) {
      const n = st === 0 ? 2 : 3, ss = shuffle([40, 72, 110].slice(3 - n)), want = st === 0 ? Math.max(...ss) : Math.min(...ss);
      return choice(ctx, { prompt: st === 0 ? 'Tap the BIG one!' : 'Tap the small one!', options: ss.map(s => ({ node: sizeNode(s), ok: s === want })), cols: n, size: 'tall', after: st === 0 ? 'That is the biggest!' : 'That is the smallest!' });
    }
    if (st === 2) {
      const hs = shuffle(sample([2, 3, 4, 5, 6, 7], 3)), tall = Math.random() < 0.5, want = tall ? Math.max(...hs) : Math.min(...hs), c = pick(BR);
      const tower = n => h('div', { class: 'tower' }, Array.from({ length: n }, () => h('i', { style: `background:${c}` })));
      return choice(ctx, { prompt: tall ? 'Which tower is the tallest?' : 'Which tower is the shortest?', options: hs.map(n => ({ node: tower(n), ok: n === want })), cols: 3, size: 'tall', after: tall ? 'Tallest!' : 'Shortest!' });
    }
    const n = st === 3 ? 3 : 5, ss = [34, 50, 68, 86, 104].slice(5 - n);
    return tapOrder(ctx, { prompt: 'Tap them from the smallest to the biggest.', items: ss.map((s, i) => ({ node: sizeNode(s * 0.8), order: i })) });
  },
};

const SIL = ['🐘', '🦒', '🐇', '🐢', '🦀', '🐌', '🦋', '🐧', '🚲', '✈️', '🎸', '☂️', '🍌', '🍐', '🦕', '🐓', '🐬', '🦔', '🏠', '⛵'];
export const shadows = {
  id: 'shadows', title: 'Shadow Match', icon: '👤', cat: 'thinking', minBand: 1, color: '#5D4037',
  desc: 'Whose shadow is this?',
  stages: ['3 choices', '4 choices', '5 tricky choices'],
  start: [0, 1, 2],
  question(ctx) {
    const n = [3, 4, 5][ctx.stage], set = sample(SIL, n), t = set[0];
    return choice(ctx, {
      prompt: 'Whose shadow is this?', show: h('div', { class: 'bigpic' }, em(t, 'xxl shadow')),
      options: shuffle(set).map(e => ({ node: em(e, 'xl'), ok: e === t })), cols: n === 4 ? 2 : n,
      after: 'You matched the shadow!',
    });
  },
};
