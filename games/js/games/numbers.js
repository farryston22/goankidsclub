// Number games (EYFS Number + Numerical Patterns; Year 1 addition, subtraction, money).
import { h, rnd, pick, shuffle, sample, range, sleep, numOpts, em, freshPicker } from '../util.js';
import { choice, numNode } from '../engine.js';
import { sfx } from '../audio.js';
import { COINS, coinEl } from '../data.js';

const THINGS = [['apples', '🍎'], ['ducks', '🦆'], ['stars', '⭐'], ['fish', '🐟'], ['balloons', '🎈'], ['cupcakes', '🧁'], ['crabs', '🦀'], ['mangoes', '🥭'], ['coconuts', '🥥'], ['cars', '🚗']];
const numChoice = (ans, lo, hi, n = 3) => numOpts(ans, lo, hi, n).map(v => ({ node: numNode(v), ok: v === ans, label: String(v) }));

/* A pile of things the child can tap to count (one-to-one counting). */
function countPile(n, e, ctx, { rows = false } = {}) {
  const box = h('div', { class: 'pile' + (rows ? ' rows' : '') });
  let c = 0;
  for (let i = 0; i < n; i++) {
    const it = h('button', { class: 'pileitem' }, e);
    it.addEventListener('click', () => {
      if (it.dataset.n) return;
      c++; it.dataset.n = c; it.classList.add('counted'); sfx.note(400 + c * 30); ctx.say(String(c));
    });
    box.append(it);
  }
  return box;
}

export const count = {
  id: 'count', title: 'Count with Me', icon: '🍎', cat: 'numbers', minBand: 1, color: '#FF8A65',
  desc: 'Tap each one to count it, then pick the number.',
  stages: ['Count to 3', 'Count to 5', 'Count to 10', 'Count to 15', 'Count to 20'],
  start: [0, 1, 2],
  question(ctx) {
    const max = [3, 5, 10, 15, 20][ctx.stage], min = [1, 2, 4, 8, 11][ctx.stage];
    const n = rnd(min, max), [w, e] = pick(THINGS);
    return choice(ctx, {
      prompt: `How many ${w}? Tap each one to count.`,
      show: countPile(n, e, ctx, { rows: n > 10 }),
      options: numChoice(n, 1, max + 2),
      after: `${n} ${w}!`,
    });
  },
};

export const bubbles = {
  id: 'bubbles', title: 'Number Bubbles', icon: '🫧', cat: 'numbers', minBand: 1, color: '#4FC3F7',
  desc: 'Pop the bubbles with the right number.',
  stages: ['Numbers 1–5', 'Numbers 1–10', 'Numbers 1–20', 'One more than…', 'One less than…'],
  start: [0, 1, 2],
  question(ctx) {
    const st = ctx.stage, max = [5, 10, 20, 19, 20][st];
    const target = st === 3 ? rnd(1, 18) + 1 : st === 4 ? rnd(1, 19) : rnd(1, max);
    const prompt = st === 3 ? `Pop the number that is one more than ${target - 1}.` : st === 4 ? `Pop the number that is one less than ${target + 1}.` : `Pop the number ${target}!`;
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const sea = h('div', { class: 'bubblesea' });
      b.append(sea);
      let need = 3, wrongs = 0, ended = false;
      const spawn = (val, i) => {
        const bub = h('button', { class: 'bubble', style: `left:${5 + (i * 37) % 82}%;animation-duration:${7 + Math.random() * 4}s;animation-delay:-${Math.random() * 6}s;--hue:${rnd(170, 260)}` }, String(val));
        bub.addEventListener('pointerdown', async e => {
          e.preventDefault();
          if (ended || bub.classList.contains('popped') || !ctx.alive()) return;
          if (val === target) {
            bub.classList.add('popped'); sfx.pop(); ctx.sparkle(bub); need--;
            setTimeout(() => { bub.remove(); if (!ended) spawn(rand(), i); }, 300);
            if (need === 0) { ended = true; await ctx.good(); res(wrongs === 0); }
          } else { wrongs++; bub.classList.add('wobble'); setTimeout(() => bub.classList.remove('wobble'), 500); ctx.bad(); if (wrongs === 2) ctx.say(prompt); }
        });
        sea.append(bub);
      };
      const others = range(1, max).filter(v => v !== target);
      const rand = () => Math.random() < 0.4 ? target : pick(others);
      const vals = shuffle([target, target, target, ...sample(others, 6)]);
      vals.forEach(spawn);
      ctx.say(prompt);
    });
  },
};

export const more = {
  id: 'more', title: 'Crab Feast', icon: '🦀', cat: 'numbers', minBand: 1, color: '#EF5350',
  desc: 'Which plate has more? Which has fewer?',
  stages: ['More (easy)', 'More (close)', 'Fewer', 'The most', 'Bigger number'],
  start: [0, 1, 2],
  question(ctx) {
    const st = ctx.stage, e = pick(['🐟', '🦐', '🥥', '🥭', '🍪']);
    if (st === 4) {
      const [a, c] = sample(range(1, 20), 2);
      const big = Math.max(a, c);
      return choice(ctx, { prompt: 'Which number is bigger?', options: shuffle([a, c]).map(v => ({ node: numNode(v), ok: v === big })), size: 'xl', after: `${big} is bigger than ${Math.min(a, c)}.` });
    }
    const plates = st === 3 ? 3 : 2;
    let ns;
    do {
      ns = st === 0 ? [rnd(1, 2), rnd(4, 6)] : Array.from({ length: plates }, () => rnd(1, 9));
    } while (new Set(ns).size !== ns.length);
    ns = shuffle(ns);
    const want = st === 2 ? Math.min(...ns) : Math.max(...ns);
    const word = st === 2 ? 'fewer' : st === 3 ? 'the most' : 'more';
    return choice(ctx, {
      prompt: st === 3 ? 'Which plate has the most for Kurli the crab?' : `Which plate has ${word}?`,
      cols: plates,
      options: ns.map(n => ({ node: h('div', { class: 'plate' }, Array.from({ length: n }, () => h('span', {}, e))), ok: n === want })),
      after: `That plate has ${want}.`,
    });
  },
};

/* Ten-frame picture for number bonds. */
function tenFrame(filled, e = '🔴') {
  return h('div', { class: 'tenframe' }, Array.from({ length: 10 }, (_, i) => h('div', { class: 'tf' }, i < filled ? e : '')));
}

export const add = {
  id: 'add', title: 'Fishy Sums', icon: '➕', cat: 'numbers', minBand: 2, color: '#26A69A',
  desc: 'Adding and taking away with fish.',
  stages: ['Add to 5', 'Add to 10', 'Make 10', 'Take away', 'Doubles'],
  start: [0, 0, 1],
  question(ctx) {
    const st = ctx.stage, e = '🐟';
    const group = (n, cls = '') => h('div', { class: 'fishgroup ' + cls }, Array.from({ length: n }, () => h('span', {}, e)));
    if (st === 2) {
      const k = rnd(1, 9);
      return choice(ctx, { prompt: `There ${k === 1 ? 'is 1' : 'are ' + k}. How many more to make 10?`, show: tenFrame(k), options: numChoice(10 - k, 0, 10), after: `${k} and ${10 - k} make 10!` });
    }
    if (st === 3) {
      const a = rnd(3, 10), c = rnd(1, a - 1);
      const g = group(a); [...g.children].slice(a - c).forEach(x => x.classList.add('gone'));
      return choice(ctx, { prompt: `${a} fish. ${c} swim away. How many are left?`, show: h('div', { class: 'sum' }, g), options: numChoice(a - c, 0, 10), after: `${a} take away ${c} is ${a - c}.` });
    }
    if (st === 4) {
      const a = rnd(1, 5);
      return choice(ctx, { prompt: `Double ${a}. What is ${a} add ${a}?`, show: h('div', { class: 'sum' }, group(a), h('b', {}, '+'), group(a)), options: numChoice(a * 2, 1, 12), after: `Double ${a} is ${a * 2}.` });
    }
    const max = st === 0 ? 5 : 10, a = rnd(1, max - 1), c = rnd(1, max - a);
    return choice(ctx, {
      prompt: `${a} fish and ${c} more fish. How many altogether?`,
      show: h('div', { class: 'sum' }, group(a), h('b', {}, '+'), group(c, 'b2')),
      options: numChoice(a + c, 1, max + 2), after: `${a} add ${c} makes ${a + c}.`,
    });
  },
};

export const frog = {
  id: 'frog', title: 'Frog Hop', icon: '🐸', cat: 'numbers', minBand: 1, color: '#66BB6A',
  desc: 'Hop along the number line.',
  stages: ['Hop to the number', 'Hop on (to 10)', 'Hop on (to 20)', 'Hop back (to 10)', 'Hop back (to 20)'],
  start: [0, 1, 2],
  question(ctx) {
    const st = ctx.stage;
    const back = st >= 3, top = st === 2 || st === 4 ? 20 : 10;
    let a, n, target;
    if (st === 0) { a = 0; target = rnd(2, 10); }
    else { n = rnd(1, 4); a = back ? rnd(n, top) : rnd(0, top - n); target = back ? a - n : a + n; }
    const lo = Math.max(0, Math.min(top - 10, Math.min(a, target) - rnd(0, 3)));
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const line = h('div', { class: 'pond' });
      const pads = [];
      for (let v = lo; v <= lo + 10; v++) { const p = h('button', { class: 'pad' }, h('span', {}, String(v))); p.dataset.v = v; pads.push(p); line.append(p); }
      const fr = h('div', { class: 'frog' }, '🐸');
      b.append(line);
      let pos = a, wrongs = 0, done = false;
      const place = () => { const p = pads[pos - lo]; p.append(fr); };
      place();
      const hop = async to => { pos = to; sfx.hop(); fr.classList.remove('jump'); void fr.offsetWidth; fr.classList.add('jump'); place(); };
      if (st === 0) {
        b.append(h('button', { class: 'btn big', onclick: async () => { if (done || !ctx.alive()) return; if (pos < target) { await hop(pos + 1); ctx.say(String(pos)); if (pos === target) { done = true; await sleep(300); await ctx.good(); res(true); } } } }, 'Hop! 🐸'));
        ctx.say(`Help Frog hop to number ${target}! Tap Hop.`);
        return;
      }
      line.addEventListener('click', async e => {
        const p = e.target.closest('.pad'); if (!p || done || !ctx.alive()) return;
        const v = +p.dataset.v;
        if (v === target) {
          done = true;
          for (let i = 1; i <= n; i++) { await hop(back ? a - i : a + i); await sleep(280); }
          await ctx.good(p); res(wrongs === 0);
        } else {
          wrongs++; ctx.bad(p);
          if (wrongs === 2) { // show the hops, then go back
            await ctx.say('Watch Frog hop!');
            for (let i = 1; i <= n; i++) { await hop(back ? a - i : a + i); await ctx.say(String(pos)); }
            await sleep(300); pos = a; place(); ctx.say('Now you tap where Frog lands.');
          }
        }
      });
      ctx.say(back ? `Frog is on ${a}. He hops back ${n}. Where does he land?` : `Frog is on ${a}. He hops on ${n}. Where does he land?`);
    });
  },
};

const SHOP = [['ice lolly', '🍭'], ['banana', '🍌'], ['cupcake', '🧁'], ['mango', '🥭'], ['juice', '🧃'], ['biscuit', '🍪'], ['apple', '🍎'], ['toy car', '🚗'], ['ball', '⚽'], ['teddy', '🧸'], ['bebinca', '🍰']];
export const shop = {
  id: 'shop', title: 'Goa Shop', icon: '🪙', cat: 'numbers', minBand: 2, color: '#FFB300',
  desc: 'Learn UK coins and pay for treats.',
  stages: ['Know your coins', 'Pay with 1p', 'Pay with 1p and 2p', 'Use 5p too', 'Up to 20p'],
  start: [0, 0, 1],
  question(ctx) {
    const st = ctx.stage;
    if (st === 0) {
      const set = [1, 2, 5, 10, 20, 50, 100, 200];
      const v = pick(set.slice(0, ctx.round < 3 ? 4 : 8));
      const opts = shuffle([v, ...sample(set.filter(x => x !== v), 2)]);
      return choice(ctx, { prompt: `Find the ${COINS[v].label === '£1' ? 'one pound' : COINS[v].label === '£2' ? 'two pound' : COINS[v].label.replace('p', ' p')} coin.`, options: opts.map(x => ({ node: coinEl(x, 1.6), ok: x === v })) });
    }
    const coins = [[1], [1, 2], [1, 2, 5], [1, 2, 5, 10]][st - 1];
    const price = rnd(st === 1 ? 2 : 3, [5, 6, 10, 20][st - 1]);
    const [item, e] = pick(SHOP);
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const tray = h('div', { class: 'cointray' });
      const total = h('div', { class: 'total' }, '0p');
      let sum = 0, wrongs = 0, done = false;
      const upd = () => { sum = [...tray.children].reduce((t, c) => t + +c.dataset.v, 0); total.textContent = sum + 'p'; };
      const purse = h('div', { class: 'purse' }, coins.map(v => {
        const c = h('button', { class: 'coinbtn' }, coinEl(v));
        c.addEventListener('click', () => {
          if (done) return; sfx.coin();
          const t = h('button', { class: 'coinbtn small' }, coinEl(v, 1.1)); t.dataset.v = v;
          t.addEventListener('click', () => { if (!done) { t.remove(); upd(); sfx.tap(); } });
          tray.append(t); upd();
        });
        return c;
      }));
      b.append(
        h('div', { class: 'shopitem' }, em(e, 'xl'), h('div', { class: 'tag' }, price + 'p')),
        h('div', { class: 'payrow' }, h('span', { class: 'muted' }, 'You are paying:'), total),
        tray, h('div', { class: 'muted small' }, 'Tap a coin to pay. Tap it again in the tray to take it back.'), purse,
        h('button', {
          class: 'btn big', onclick: async () => {
            if (done || !ctx.alive()) return;
            if (sum === price) { done = true; await ctx.good(); await ctx.say(`Here is your ${item}!`); res(wrongs === 0); }
            else { wrongs++; ctx.bad(); ctx.say(sum < price ? `That's ${sum}p. You need ${price - sum}p more.` : `That's ${sum}p. Too much! Take ${sum - price}p back.`); }
          },
        }, 'Pay 🛒'));
      ctx.say(`The ${item} costs ${price}p. Tap the coins to pay ${price}p.`);
    });
  },
};
