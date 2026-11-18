// Animals and the world (EYFS Understanding the World) + Konkani corner.
import { h, rnd, pick, shuffle, sample, em, freshPicker } from '../util.js';
import { choice, drag, numNode } from '../engine.js';
import { ANIMALS, HOMES, BABIES, KONKANI, colour } from '../data.js';

export const animals = {
  id: 'animals', title: 'Animal Friends', icon: '🦁', cat: 'animals', minBand: 1, color: '#FFCA28',
  desc: 'Find animals and learn a fun fact about each one.',
  stages: ['Farm animals', 'Who says that?', 'Wild animals', 'Sea creatures', 'Birds and bugs', 'Animals of Goa'],
  start: [0, 1, 2],
  question(ctx) {
    const st = ctx.stage;
    const set = [ANIMALS.farm, ANIMALS.farm.filter(a => a.s), ANIMALS.wild, ANIMALS.sea, ANIMALS.birds, ANIMALS.goa][st];
    const n = ctx.band === 1 ? 3 : 4;
    const opts = sample(set, n), t = opts[0];
    return choice(ctx, {
      prompt: st === 1 ? `Who says ${t.s}?` : `Where is the ${t.n}?`,
      options: shuffle(opts).map(a => ({ node: em(a.e, 'xl'), ok: a === t, label: a.n })), cols: n === 4 ? 2 : 3,
      after: `${st === 1 ? `The ${t.n} says ${t.s}! ` : ''}${t.f}`,
    });
  },
};

export const homes = {
  id: 'homes', title: 'Animal Homes', icon: '🏡', cat: 'animals', minBand: 1, color: '#8BC34A',
  desc: 'Drag each animal to where it lives.',
  stages: ['Farm or sea?', 'Add the jungle', 'Add the sky', 'Add the snow'],
  start: [0, 1, 2], rounds: 3,
  question(ctx) {
    const keys = [['farm', 'sea'], ['farm', 'sea', 'jungle'], ['farm', 'sea', 'jungle', 'sky'], ['sea', 'jungle', 'sky', 'snow']][ctx.stage];
    const per = keys.length <= 2 ? 2 : keys.length === 3 ? 2 : 1;
    const items = keys.flatMap(k => sample(HOMES[k].animals, per).map(e => ({ key: k, node: em(e, 'lg'), hint: `Where does it live?` })));
    if (ctx.stage === 3) items.push(...sample(keys, 2).map(k => ({ key: k, node: em(pick(HOMES[k].animals.filter(a => !items.some(i => i.node.textContent === a))) || HOMES[k].animals[0], 'lg') })));
    const scene = h('div', { class: 'habitats', style: `--cols:${keys.length}` }, keys.map(k => h('div', { class: 'habitat', 'data-key': k, style: `background:${HOMES[k].bg}` }, h('div', { class: 'hlabel' }, HOMES[k].e + ' ' + HOMES[k].label), h('div', { class: 'slot' }))));
    return drag(ctx, { prompt: 'Help the animals go home! Drag each one to where it lives.', scene, items }).then(() => true);
  },
};

export const babies = {
  id: 'babies', title: 'Mummy and Baby', icon: '🐣', cat: 'animals', minBand: 2, color: '#F48FB1',
  desc: 'Match baby animal names to their mummies.',
  stages: ['Chick, kitten, puppy, lamb', 'Calf, foal, piglet, duckling', 'Tadpole, caterpillar, joey, cub'],
  start: [0, 0, 1],
  question(ctx) {
    const set = BABIES.filter(b => b.st <= ctx.stage), fresh = BABIES.filter(b => b.st === ctx.stage);
    const t = Math.random() < 0.75 ? pick(fresh) : pick(set);
    const opts = shuffle([t, ...sample(BABIES.filter(b => b !== t), 2)]);
    return choice(ctx, { prompt: `A ${t.baby} is a baby… which animal?`, options: opts.map(b => ({ node: em(b.mum, 'xl'), ok: b === t, label: b.mn })), cols: 3, after: `A baby ${t.mn} is called a ${t.baby}.` });
  },
};

/* Konkani words: robot voice reads the Romi spelling; record clips for real pronunciation. */
const kw = w => ({ t: w, clip: 'konkani/' + w });
export const konkani = {
  id: 'konkani', title: 'Konkani Corner', icon: '🌴', cat: 'konkani', minBand: 1, color: '#00897B',
  desc: 'Learn Konkani numbers, colours and animals.',
  stages: ['Numbers 1–5', 'Numbers 6–10', 'Colours', 'Animals', 'Mix it up'],
  start: [0, 0, 1],
  question(ctx) {
    let st = ctx.stage;
    if (st === 4) st = rnd(0, 3);
    if (st <= 1) {
      const set = KONKANI.numbers.slice(st * 5, st * 5 + 5), [w, n] = pick(set);
      const opts = shuffle([n, ...sample(set.filter(x => x[1] !== n).map(x => x[1]), 2)]);
      return choice(ctx, { prompt: `Which number is "${w}"?`, parts: ['Which number is', kw(w), '?'], options: opts.map(v => ({ node: h('div', { class: 'knum' }, numNode(v), h('div', { class: 'kdots' }, '●'.repeat(v))), ok: v === n })), cols: 3, after: `${w} is ${n}!`, afterParts: [kw(w), `is ${n}!`] });
    }
    if (st === 2) {
      const [w, c] = pick(KONKANI.colours), opts = shuffle([c, ...sample(KONKANI.colours.filter(x => x[1] !== c).map(x => x[1]), 2)]);
      return choice(ctx, { prompt: `Which colour is "${w}"?`, parts: ['Which colour is', kw(w), '?'], options: opts.map(x => ({ node: h('span', { class: 'blob', style: `--c:${colour(x).c}` }), ok: x === c, label: x })), cols: 3, after: `${w} is ${c}!`, afterParts: [kw(w), `is ${c}!`] });
    }
    const [w, e, en] = pick(KONKANI.animals), opts = shuffle([[w, e], ...sample(KONKANI.animals.filter(x => x[0] !== w), 2)]);
    return choice(ctx, { prompt: `Which one is "${w}"?`, parts: ['Which one is', kw(w), '?'], options: opts.map(x => ({ node: em(x[1], 'xl'), ok: x[0] === w })), cols: 3, after: `${w} means ${en}!`, afterParts: [kw(w), `means ${en}!`] });
  },
};
