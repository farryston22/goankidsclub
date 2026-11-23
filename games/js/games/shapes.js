// Shapes, colours and patterns (EYFS Shape, Space & Measure; Numerical Patterns; Expressive Arts).
import { h, rnd, pick, shuffle, sample, em, numOpts } from '../util.js';
import { choice, drag, numNode } from '../engine.js';
import { SHAPES, shapeEl, COLOURS, colour, COLOUR_THINGS, MIXES } from '../data.js';

const BRIGHT = ['#E53935', '#1E88E5', '#FDD835', '#43A047', '#FB8C00', '#8E24AA', '#F06292', '#00ACC1'];

export const sorter = {
  id: 'sorter', title: 'Shape Sorter', icon: '🔺', cat: 'shapes', minBand: 1, color: '#FFA726',
  desc: 'Drag each shape into its hole. Learn shape names.',
  stages: ['Circle, square, triangle', 'Add rectangle and star', 'Heart, oval, diamond', 'Name the shape', 'Count the sides'],
  start: [0, 1, 2],
  rounds: 4,
  question(ctx) {
    const st = ctx.stage;
    if (st === 3) {
      const pool = ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart', 'oval', 'diamond', 'pentagon', 'hexagon', 'octagon', 'semicircle'];
      const t = pick(pool);
      return choice(ctx, { prompt: `Tap the ${t}.`, options: shuffle([t, ...sample(pool.filter(x => x !== t), 3)]).map(x => ({ node: shapeEl(x, pick(BRIGHT)), ok: x === t })), cols: 2, after: `That's ${/^[aeiou]/i.test(t) ? 'an' : 'a'} ${t}!` });
    }
    if (st === 4) {
      const t = pick(['triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'octagon']), n = SHAPES[t].sides;
      return choice(ctx, { prompt: `How many sides does a ${t} have?`, show: shapeEl(t, pick(BRIGHT), 'xl'), options: numOpts(n, 3, 8).map(v => ({ node: numNode(v), ok: v === n })), after: `A ${t} has ${n} sides.` });
    }
    const sets = [['circle', 'square', 'triangle'], ['circle', 'square', 'triangle', 'rectangle', 'star'], ['heart', 'oval', 'diamond', 'star', 'rectangle', 'triangle']];
    const names = sample(sets[st], st === 0 ? 3 : 4);
    const scene = h('div', { class: 'holes' }, names.map(n => h('div', { class: 'hole', 'data-key': n }, shapeEl(n, '#3d2f73', 'ghost'), h('div', { class: 'slot' }))));
    return drag(ctx, {
      prompt: 'Drag each shape into the hole that fits.',
      scene, items: names.map(n => ({ key: n, node: shapeEl(n, pick(BRIGHT)), say: `${n}!`, hint: `That doesn't fit. Find the ${n} hole.` })),
    }).then(() => true);
  },
};

const blob = c => h('span', { class: 'blob', style: `--c:${c.c}` });
export const colours = {
  id: 'colours', title: 'Colour Splash', icon: '🎨', cat: 'shapes', minBand: 1, color: '#EC407A',
  desc: 'Find colours and mix paints.',
  stages: ['Red, blue, yellow, green', 'More colours', 'What colour is it?', 'Mix the paints'],
  start: [0, 1, 2],
  question(ctx) {
    const st = ctx.stage;
    if (st === 2) {
      const [w, e, c] = pick(COLOUR_THINGS);
      return choice(ctx, { prompt: `What colour is the ${w}?`, show: h('div', { class: 'bigpic' }, em(e, 'xxl')), options: shuffle([c, ...sample(['red', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown', 'blue'].filter(x => x !== c), 2)]).map(x => ({ node: blob(colour(x)), ok: x === c, label: x })), after: `The ${w} is ${c}.` });
    }
    if (st === 3) {
      const [a, b, r] = pick(MIXES);
      const show = h('div', { class: 'mix' }, blob(colour(a)), h('b', {}, '+'), blob(colour(b)), h('b', {}, '='), h('span', { class: 'blob q' }, '?'));
      return choice(ctx, { prompt: `What colour do ${a} and ${b} make?`, show, options: shuffle([r, ...sample(['orange', 'green', 'purple', 'pink', 'grey', 'brown'].filter(x => x !== r), 2)]).map(x => ({ node: blob(colour(x)), ok: x === r, label: x })), after: `${a} and ${b} make ${r}!` });
    }
    const pool = st === 0 ? COLOURS.slice(0, 4) : COLOURS.slice(0, 11);
    const t = pick(pool);
    return choice(ctx, { prompt: `Tap ${t.n}!`, options: shuffle([t, ...sample(pool.filter(x => x !== t), st === 0 ? 2 : 3)]).map(x => ({ node: blob(x), ok: x === t, label: x.n })), cols: st === 0 ? 3 : 2, after: `That's ${t.n}!` });
  },
};

export const patterns = {
  id: 'patterns', title: 'Pattern Parade', icon: '🔁', cat: 'shapes', minBand: 1, color: '#26C6DA',
  desc: 'What comes next in the pattern?',
  stages: ['Two colours (AB)', 'Two pictures (AB)', 'AAB and ABB', 'Three in a row (ABC)', 'Number patterns'],
  start: [0, 1, 2],
  question(ctx) {
    const st = ctx.stage;
    if (st === 4) {
      const step = pick([1, 2, 5, 10]), s = step === 1 ? rnd(1, 10) : step * rnd(0, 3), seq = [0, 1, 2, 3].map(i => s + i * step), ans = s + 4 * step;
      return choice(ctx, { prompt: `Count in ${step}s. What comes next?`, show: h('div', { class: 'beads' }, seq.map(v => h('span', { class: 'bead num' }, String(v))), h('span', { class: 'bead q' }, '?')), options: shuffle([ans, ans + step, ans - 1 === seq[3] ? ans + 1 : ans - 1]).map(v => ({ node: numNode(v), ok: v === ans })), after: `${seq.join(', ')}, ${ans}!` });
    }
    const unit = st === 2 ? pick([[0, 0, 1], [0, 1, 1]]) : st === 3 ? [0, 1, 2] : [0, 1];
    const kinds = st === 0 ? sample(BRIGHT, 3).map(c => () => h('span', { class: 'bead', style: `background:${c}` }))
      : sample(['🍎', '🍌', '⭐', '🐟', '🌸', '🚗', '🥥', '🦀', '❤️', '🎈'], 3).map(e => () => h('span', { class: 'bead pic' }, e));
    const len = unit.length * 2 + (unit.length === 2 ? 1 : 0);
    const seq = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
    const ans = unit[len % unit.length];
    const opts = shuffle([...new Set([ans, ...unit, 2])].slice(0, 3));
    return choice(ctx, {
      prompt: 'What comes next?',
      show: h('div', { class: 'beads' }, seq.map(k => kinds[k]()), h('span', { class: 'bead q' }, '?')),
      options: opts.map(k => ({ node: kinds[k](), ok: k === ans })), after: 'You found the pattern!',
    });
  },
};
