// Letters and phonics (UK Letters and Sounds Phase 2–4, EYFS Comprehension/Word Reading/Writing).
import { h, rnd, pick, shuffle, sample, sleep, em, freshPicker } from '../util.js';
import { choice, tapOrder } from '../engine.js';
import { sfx } from '../audio.js';
import { PHONIC_SETS, SOUND, STARTS, CVC, CCVC, lettersUpTo } from '../data.js';

const letterNode = (l, cls = '') => h('span', { class: 'letter ' + cls }, l);
/* Say a pure sound: recorded clip if you have one, robot voice otherwise. */
const snd = l => ({ t: SOUND[l], clip: 'phonics/' + l });
const keyword = l => STARTS[l] ? STARTS[l][0] : null;

/* Pick target from this stage's new set most of the time, older sets sometimes (spaced review). */
function phonicTarget(stage) {
  const fresh = PHONIC_SETS[stage], old = lettersUpTo(stage - 1);
  return old.length && Math.random() < 0.3 ? pick(old) : pick(fresh);
}
function phonicOpts(stage, target, n) {
  const pool = lettersUpTo(stage).filter(l => l !== target);
  return shuffle([target, ...sample(pool, n - 1)]);
}

export const sounds = {
  id: 'sounds', title: 'Letter Sounds', icon: '🔤', cat: 'letters', minBand: 1, color: '#7E57C2',
  desc: 'Hear the sound, tap the letter (UK phonics).',
  stages: ['s a t p', 'i n m d', 'g o c k', 'e u r h', 'b f l j v w y z'],
  start: [0, 0, 1],
  question(ctx) {
    const t = phonicTarget(ctx.stage), [w, e] = keyword(t);
    return choice(ctx, {
      prompt: `Which letter says ${SOUND[t]}… like ${e} ${w}?`,
      parts: ['Which letter says', snd(t), `like ${w}?`],
      options: phonicOpts(ctx.stage, t, ctx.band === 1 ? 3 : 4).map(l => ({ node: letterNode(l), ok: l === t })),
      after: `${t} for ${w}!`, afterParts: [snd(t), `for ${w}!`],
    });
  },
};

export const firstsound = {
  id: 'firstsound', title: 'First Sounds', icon: '🐍', cat: 'letters', minBand: 2, color: '#AB47BC',
  desc: 'What sound does the picture start with?',
  stages: ['s a t p', 'i n m d', 'g o c k', 'e u r h', 'b f l j v w y z'],
  start: [0, 0, 1],
  question(ctx) {
    const t = phonicTarget(ctx.stage), [w, e] = pick(STARTS[t]);
    return choice(ctx, {
      prompt: `${w}… What sound does ${w} start with?`,
      show: h('div', { class: 'bigpic' }, em(e, 'xxl')),
      options: phonicOpts(ctx.stage, t, ctx.band === 1 ? 3 : 4).map(l => ({ node: letterNode(l), ok: l === t })),
      after: `${w} starts with ${SOUND[t]}.`, afterParts: [`${w} starts with`, snd(t)],
    });
  },
};

/* ---------- Trace It: finger tracing scored by how much of the letter is covered ---------- */
const TRACE_SETS = [
  ['|', '—', '○', '╱', 'ᴧ'],
  ['s', 'a', 't', 'p', 'i', 'n'],
  ['m', 'd', 'g', 'o', 'c', 'k'],
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['e', 'u', 'r', 'h', 'b', 'f', 'l', 'j', 'v', 'w', 'x', 'y', 'z', 'q'],
];
const PREWRITE = { '|': 'straight line down', '—': 'line across', '○': 'circle', '╱': 'slanted line', 'ᴧ': 'mountain' };

export const trace = {
  id: 'trace', title: 'Trace It', icon: '✏️', cat: 'letters', minBand: 1, color: '#EC407A',
  desc: 'Trace lines, letters and numbers with your finger.',
  stages: ['Lines and circles', 's a t p i n', 'm d g o c k', 'Numbers 0–9', 'More letters'],
  start: [0, 1, 1], rounds: 4,
  question(ctx) {
    const ch = pick(TRACE_SETS[ctx.stage]);
    const name = PREWRITE[ch] ? 'a ' + PREWRITE[ch] : /\d/.test(ch) ? 'the number ' + ch : 'the letter ' + ch;
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const size = Math.min(340, b.clientWidth - 24, (b.clientHeight || 420) - 90);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cv = h('canvas', { class: 'tracecv', width: size * dpr, height: size * dpr, style: `width:${size}px;height:${size}px` });
      const g = cv.getContext('2d'); g.scale(dpr, dpr);
      const font = `${Math.round(size * 0.82)}px Andika, "Comic Sans MS", sans-serif`;
      // mask of the guide (thick glyph) for scoring
      const mk = document.createElement('canvas'); mk.width = mk.height = size; const m = mk.getContext('2d');
      const drawGuide = (c, col, lw) => {
        c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = font;
        c.lineJoin = 'round'; c.lineCap = 'round';
        if (ch === '○') { c.beginPath(); c.arc(size / 2, size / 2, size * 0.32, 0, 7); c.lineWidth = lw; c.strokeStyle = col; c.stroke(); }
        else if (ch === '|' || ch === '—' || ch === '╱' || ch === 'ᴧ') {
          c.beginPath(); const s = size;
          if (ch === '|') { c.moveTo(s / 2, s * .15); c.lineTo(s / 2, s * .85); }
          if (ch === '—') { c.moveTo(s * .15, s / 2); c.lineTo(s * .85, s / 2); }
          if (ch === '╱') { c.moveTo(s * .25, s * .85); c.lineTo(s * .75, s * .15); }
          if (ch === 'ᴧ') { c.moveTo(s * .15, s * .8); c.lineTo(s / 2, s * .2); c.lineTo(s * .85, s * .8); }
          c.lineWidth = lw; c.strokeStyle = col; c.stroke();
        } else { c.lineWidth = lw; c.strokeStyle = col; c.strokeText(ch, size / 2, size * 0.53); c.fillStyle = col; c.fillText(ch, size / 2, size * 0.53); }
        c.restore();
      };
      const paintBg = () => { g.clearRect(0, 0, size, size); drawGuide(g, '#E9E3FF', size * 0.11); drawGuide(g, '#C9BCFF', 3); };
      document.fonts?.load(font).finally(() => { paintBg(); drawGuide(m, '#000', size * 0.05); });
      paintBg();
      const ink = document.createElement('canvas'); ink.width = ink.height = size; const k = ink.getContext('2d');
      let drawing = false, last = null, hue = rnd(0, 360), done = false, tries = 0;
      const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * size / r.width, (e.clientY - r.top) * size / r.height]; };
      const line = (a, c) => {
        for (const ctx2 of [g, k]) { ctx2.lineCap = 'round'; ctx2.lineJoin = 'round'; ctx2.lineWidth = size * 0.1; ctx2.strokeStyle = `hsl(${hue},85%,58%)`; ctx2.beginPath(); ctx2.moveTo(...a); ctx2.lineTo(...c); ctx2.stroke(); }
        hue = (hue + 2) % 360;
      };
      cv.addEventListener('pointerdown', e => { if (done) return; e.preventDefault(); cv.setPointerCapture(e.pointerId); drawing = true; last = pos(e); line(last, last); });
      cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); line(last, p); last = p; if (Math.random() < 0.15) sfx.note(500 + rnd(0, 300)); });
      const end = () => { drawing = false; };
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
      const score = () => {
        const md = m.getImageData(0, 0, size, size).data, id = k.getImageData(0, 0, size, size).data;
        let guide = 0, hit = 0, ink2 = 0, out = 0;
        for (let i = 3; i < md.length; i += 16) {
          const inG = md[i] > 0, inI = id[i] > 0;
          if (inG) { guide++; if (inI) hit++; }
          if (inI) { ink2++; if (!inG) out++; }
        }
        return { cover: guide ? hit / guide : 0, mess: ink2 ? out / ink2 : 1 };
      };
      const check = async () => {
        if (done || !ctx.alive()) return;
        const { cover, mess } = score();
        // Gentle for little hands: about half the letter covered, mostly on the line.
        if (cover > 0.5 && mess < 0.65) { done = true; await ctx.good(cv); res(tries === 0); }
        else {
          tries++; ctx.bad();
          ctx.say(cover <= 0.5 ? `Nearly! Trace over all of ${name}.` : 'Try to stay on the purple line.');
          if (tries >= 2 && cover > 0.35) { done = true; await sleep(800); await ctx.good(cv); res(false); }
        }
      };
      b.append(cv, h('div', { class: 'row gap' },
        h('button', { class: 'btn ghost', onclick: () => { k.clearRect(0, 0, size, size); paintBg(); sfx.tap(); } }, '↺ Clear'),
        h('button', { class: 'btn', onclick: check }, 'Done ✓')));
      ctx.say(`Trace ${name} with your finger.`);
    });
  },
};

/* ---------- Word Builder: put letters in the right boxes to spell a word ---------- */
export const words = {
  id: 'words', title: 'Word Builder', icon: '🧩', cat: 'letters', minBand: 2, color: '#5C6BC0',
  desc: 'Sound out and build words like c-a-t.',
  stages: ['Build 3-letter words', 'With extra letters', 'Listen and build', '4-letter words'],
  start: [0, 0, 1],
  question(ctx) {
    const st = ctx.stage, [w, e] = pick(st === 3 ? CCVC : CVC);
    const letters = w.split('');
    const extras = st >= 1 ? sample('abcdefghijklmnoprstuvw'.split('').filter(l => !letters.includes(l)), 2) : [];
    const items = [...letters.map((l, i) => ({ l, i })), ...extras.map(l => ({ l, i: -1 }))];
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const boxes = h('div', { class: 'wordboxes' }, letters.map(() => h('div', { class: 'wbox' })));
      const pool = h('div', { class: 'opts' });
      let idx = 0, wrongs = 0;
      b.append(st === 2 ? h('button', { class: 'bigpic listen', onclick: () => ctx.say(w) }, em('🔊', 'xxl')) : h('div', { class: 'bigpic' }, em(e, 'xxl')), boxes, pool);
      for (const it of shuffle(items)) {
        const btn = h('button', { class: 'opt' }, letterNode(it.l));
        btn.addEventListener('click', async () => {
          if (!ctx.alive() || btn.disabled) return;
          if (it.l === letters[idx]) {
            btn.disabled = true; btn.classList.add('used'); sfx.drop();
            boxes.children[idx].textContent = it.l; boxes.children[idx].classList.add('filled');
            ctx.say(SOUND[it.l], [{ t: SOUND[it.l], clip: 'phonics/' + it.l }]);
            idx++;
            if (idx === letters.length) {
              await sleep(500);
              await ctx.say(letters.map(l => SOUND[l]).join('… ') + '… ' + w + '!', [...letters.map(l => ({ t: SOUND[l], clip: 'phonics/' + l })), w + '!']);
              if (st === 2) boxes.after(h('div', { class: 'bigpic' }, em(e, 'xl')));
              await ctx.good(); res(wrongs === 0);
            }
          } else {
            wrongs++; ctx.bad(btn);
            if (wrongs >= 2) [...pool.children].forEach(c => c.classList.toggle('hintme', !c.disabled && c.textContent === letters[idx]));
            ctx.say(`Listen: ${w}. What sound comes next?`);
          }
        });
        pool.append(btn);
      }
      ctx.say(st === 2 ? `Listen… ${w}. Can you build ${w}?` : `Let's build ${w}. ${letters.map(l => SOUND[l]).join(', ')}.`,
        st === 2 ? ['Listen…', w, `Can you build ${w}?`] : [`Let's build ${w}.`, ...letters.map(l => ({ t: SOUND[l], clip: 'phonics/' + l }))]);
    });
  },
};

/* ---------- ABC Train: alphabet order and capital letters ---------- */
const AZ = 'abcdefghijklmnopqrstuvwxyz'.split('');
export const abc = {
  id: 'abc', title: 'ABC Train', icon: '🚂', cat: 'letters', minBand: 2, color: '#42A5F5',
  desc: 'Alphabet order and matching capital letters.',
  stages: ['What comes next? (a–j)', 'What comes next? (a–z)', 'Missing letter', 'Capital letters', 'Put them in order'],
  start: [0, 0, 1],
  question(ctx) {
    const st = ctx.stage;
    if (st === 3) {
      const l = pick(AZ);
      return choice(ctx, {
        prompt: `Find the capital letter for ${l}.`, show: h('div', { class: 'traincar big' }, letterNode(l)),
        options: shuffle([l, ...sample(AZ.filter(x => x !== l), 2)]).map(x => ({ node: letterNode(x.toUpperCase()), ok: x === l })),
        after: `Big ${l.toUpperCase()}, little ${l}.`,
      });
    }
    if (st === 4) {
      const s = rnd(0, 21), seq = AZ.slice(s, s + (ctx.band === 3 ? 5 : 4));
      return tapOrder(ctx, { prompt: 'Put the letters on the train in ABC order.', items: seq.map((l, i) => ({ node: letterNode(l), order: i })), lineClass: 'train' });
    }
    const max = st === 0 ? 9 : 25;
    const s = rnd(0, max - 3), seq = AZ.slice(s, s + 4);
    const gap = st === 2 ? rnd(1, 2) : 3, ans = seq[gap];
    const train = h('div', { class: 'train' }, h('span', { class: 'engine' }, '🚂'), seq.map((l, i) => h('div', { class: 'traincar' + (i === gap ? ' q' : '') }, i === gap ? '?' : l)));
    return choice(ctx, {
      prompt: st === 2 ? 'Which letter is missing?' : `What comes after ${seq[2]}?`, show: train,
      options: shuffle([ans, ...sample(AZ.slice(Math.max(0, s - 3), s + 7).filter(x => x !== ans), 2)]).map(x => ({ node: letterNode(x), ok: x === ans })),
      after: seq.join(', ') + '!',
    });
  },
};
