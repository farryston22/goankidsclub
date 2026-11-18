// Times Tables (1 to 10). Original design: see it (groups) → say it (skip count) → know it (flash card + keypad).
// Order follows the UK curriculum: 10s, 2s, 5s (Year 2), then 3s, 4s, 8s (Year 3), then 6s, 9s, 7s (Year 4).
// Facts a child gets wrong come back more often; each fact has a level 0–3 stored on the child (p.tt), shown as a
// coloured bar: grey = new, orange = learning, green = learnt. "Learnt" = right first time, quickly, 3 times.
import { h, rnd, pick, shuffle, sleep, numOpts, range } from '../util.js';
import { choice, tapOrder, numNode } from '../engine.js';
import { sfx } from '../audio.js';

const TABLES = [[1, 10], [2], [5], [3], [4], [8], [6], [9], [7]];
const STAGE_NAMES = ['1s and 10s', '2 times table', '5 times table', '3 times table', '4 times table', '8 times table', '6 times table', '9 times table', '7 times table', 'All mixed up', 'Speed star ⚡'];
const THINGS = ['🥭', '🐟', '🥥', '🌸', '⭐', '🦀', '🍪', '🐚'];
const key = (t, b) => `${t}x${b}`;
const lv = (p, t, b) => ((p.tt = p.tt || {})[key(t, b)] || 0);
const setLv = (p, t, b, v) => { (p.tt = p.tt || {})[key(t, b)] = Math.max(0, Math.min(3, v)); };

/** Pick a fact, favouring ones the child does not know yet, and avoiding the last one. */
let last = '', redo = [];
function nextFact(p, tables) {
  if (redo.length && Math.random() < 0.6) { const f = redo.shift(); if (key(...f) !== last) return f; redo.push(f); }
  const all = tables.flatMap(t => range(1, 10).map(b => [t, b]));
  const weighted = all.flatMap(f => Array(4 - lv(p, ...f) * 1 + (lv(p, ...f) === 3 ? 0 : 1)).fill(f)).filter(f => key(...f) !== last);
  const f = pick(weighted.length ? weighted : all); last = key(...f); return f;
}
function bar(p, tables) {
  const facts = tables.flatMap(t => range(1, 10).map(b => [t, b]));
  const learnt = facts.filter(f => lv(p, ...f) === 3).length;
  const learning = facts.filter(f => lv(p, ...f) === 1 || lv(p, ...f) === 2).length, pc = n => (n / facts.length * 100).toFixed(1) + '%';
  return h('div', { class: 'ttbar', title: `${learnt} of ${facts.length} learnt` },
    facts.length > 30
      ? h('div', { class: 'ttfill' }, h('i', { class: 'l3', style: `width:${pc(learnt)}` }), h('i', { class: 'l1', style: `width:${pc(learning)}` }))
      : h('div', { class: 'ttseg' }, facts.map(f => h('i', { class: 'l' + lv(p, ...f), title: `${f[0]} × ${f[1]}` }))),
    h('small', {}, `${learnt}/${facts.length} learnt`));
}
/** a groups of b things (pictures help children see what multiplying means). */
const groups = (a, b) => h('div', { class: 'ttgroups' }, range(1, a).map(() => { const t = pick(THINGS); return h('div', { class: 'ttg' }, range(1, b).map(() => h('span', {}, t))); }));

/** Flash card + keypad. Resolves {ok, fast}. */
function keypad(ctx, { a, b, timed }) {
  return new Promise(res => {
    const ans = a * b, B = ctx.board; B.innerHTML = '';
    const shown = h('div', { class: 'ttdisplay' }, ' ');
    const card = h('div', { class: 'ttcard' }, h('span', { class: 'ttq' }, `${a} × ${b}`));
    const timer = timed ? h('div', { class: 'tttimer' }, h('i')) : null;
    let typed = '', done = false, tries = 0; const t0 = Date.now();
    const show = () => { shown.textContent = typed || ' '; };
    const submit = async () => {
      if (done || !typed) return;
      if (+typed === ans) {
        done = true; card.classList.add('right'); shown.classList.add('right');
        await ctx.good(card); res({ ok: tries === 0, fast: Date.now() - t0 < 6000 });
      } else {
        tries++; ctx.bad(card); shown.classList.add('wrong'); setTimeout(() => shown.classList.remove('wrong'), 400);
        typed = ''; show();
        if (tries >= 2) {
          done = true; card.append(h('div', { class: 'ttreveal' }, `${a} × ${b} = ${ans}`));
          const sc = range(1, a).map(i => i * b).join(', ');
          await ctx.say(`${a} times ${b} is ${ans}. Count: ${sc}.`); await sleep(400); res({ ok: false, fast: false });
        } else ctx.say(`Not quite. ${a} times ${b}?`);
      }
    };
    const press = k => {
      if (done || !ctx.alive()) return;
      sfx.tap();
      if (k === 'del') typed = typed.slice(0, -1);
      else if (k === 'ok') return submit();
      else if (typed.length < 3) typed += k;
      show();
      if (typed.length === String(ans).length && +typed === ans) submit(); // quick children don't need to press ✓
      else if (typed.length === 3) submit();
    };
    const keys = h('div', { class: 'keypad' }, ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map(k =>
      h('button', { class: 'key' + (k === 'del' ? ' del' : k === 'ok' ? ' ok' : ''), 'aria-label': k === 'del' ? 'Delete' : k === 'ok' ? 'Check' : k, onclick: () => press(k) }, k === 'del' ? '⌫' : k === 'ok' ? '✓' : k)));
    const onKey = e => { if (!ctx.alive()) { removeEventListener('keydown', onKey); return; } if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); else if (e.key === 'Enter') press('ok'); };
    addEventListener('keydown', onKey);
    const hint = h('button', { class: 'btn ghost sm tthint', onclick: () => { if (!B.querySelector('.ttgroups') && a <= 6) { card.after(groups(a, b)); ctx.say(`${a} groups of ${b}.`); } else ctx.say(`Count in ${b}s, ${a} times.`); } }, '💡 Help');
    B.append(h('div', { class: 'ttplay' }, h('div', { class: 'ttleft' }, card, timer, hint), h('div', { class: 'ttright' }, shown, keys)));
    if (timer) requestAnimationFrame(() => timer.firstChild.classList.add('go'));
    ctx.say(`${a} times ${b}?`);
  });
}

export const times = {
  id: 'times', title: 'Times Tables', icon: '✖️', cat: 'numbers', minBand: 3, color: '#7E57C2',
  desc: 'Learn the 1 to 10 times tables: see the groups, count in steps, then answer fast on the keypad!',
  stages: STAGE_NAMES,
  start: [0, 0, 0],
  roundsFor: s => (s >= 9 ? 10 : 8),
  stars: (m, st) => (m <= 1 ? 3 : m <= 4 ? 2 : 1),
  async question(ctx) {
    const st = ctx.stage, p = ctx.profile;
    if (ctx.round === 0) { redo = []; last = ''; }
    const tables = st < 9 ? TABLES[st] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const t = pick(tables);
    const top = () => ctx.board.prepend(bar(p, tables));
    // 1. Say it: skip count (first question of a single-table stage)
    if (st < 9 && ctx.round === 0) {
      const n = t === 1 ? 10 : t;
      const pr = tapOrder(ctx, { prompt: `Let's count in ${n}s! Tap the numbers in order: ${n}, ${n * 2}, ${n * 3}…`, lineClass: 'tt',
        items: range(1, 5).map(i => ({ order: i, node: numNode(n * i) })) });
      top();
      await pr; if (ctx.alive()) await ctx.say(`${range(1, 5).map(i => n * i).join(', ')}. Super counting!`);
      return true;
    }
    // 2. See it: groups of things, choose the answer (2 questions)
    if (st < 9 && ctx.round <= 2) {
      const a = rnd(2, 5), b = t === 1 && Math.random() < 0.5 ? 10 : t === 1 ? 1 : t;
      const pr = choice(ctx, { prompt: `${a} groups of ${b}. How many altogether? ${a} times ${b} is…`, show: h('div', { class: 'ttsee' }, groups(a, b), h('div', { class: 'ttcard sm' }, `${a} × ${b} = ?`)),
        options: numOpts(a * b, 1, 100).map(v => ({ node: numNode(v), ok: v === a * b })), cols: 3, after: `${a} times ${b} is ${a * b}!` });
      top(); return pr;
    }
    // 3. Know it: flash card + keypad
    const [tt, b] = nextFact(p, tables);
    const swap = Math.random() < 0.35;
    const [x, y] = swap ? [tt, b] : [b, tt];
    const pr = keypad(ctx, { a: x, b: y, timed: st === 10 });
    top();
    const r = await pr;
    const cur = lv(p, tt, b);
    if (r.ok && (r.fast || st < 10)) setLv(p, tt, b, cur + 1);
    else if (!r.ok) { setLv(p, tt, b, cur - 1); redo.push([tt, b]); }
    if (ctx.alive()) { const old = ctx.board.querySelector('.ttbar'); if (old) old.replaceWith(bar(p, tables)); await sleep(350); }
    return r.ok;
  },
};
