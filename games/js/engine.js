// Reusable game mechanics: tap-the-answer, drag-and-drop (with tap-tap fallback), tap-in-order.
import { h, sleep, shuffle } from './util.js';
import { sfx } from './audio.js';

/**
 * Tap the right answer.
 * options: [{node, ok, label}]. Resolves true if right first time.
 * After 2 wrong taps the right answer glows (errorless learning for little ones).
 */
export function choice(ctx, { prompt, parts, show, options, cols, size = '', after, afterParts, hint, keep }) {
  return new Promise(res => {
    const b = ctx.board;
    if (!keep) b.innerHTML = '';
    if (show) b.append(h('div', { class: 'show' }, show));
    const grid = h('div', { class: 'opts ' + size, style: cols ? `--cols:${cols}` : null });
    let wrong = 0, done = false;
    for (const o of options) {
      const btn = h('button', { class: 'opt' + (o.ok ? ' is-ok' : '') + (o.cls ? ' ' + o.cls : ''), 'aria-label': o.label || null }, o.node);
      btn.addEventListener('click', async () => {
        if (done || btn.classList.contains('wrong') || !ctx.alive()) return;
        if (o.ok) {
          done = true; btn.classList.add('right');
          await ctx.good(btn);
          if (after && ctx.alive()) await ctx.say(after, afterParts);
          res(wrong === 0);
        } else {
          wrong++; btn.classList.add('wrong'); ctx.bad(btn);
          if (wrong >= 2) grid.querySelector('.is-ok')?.classList.add('hintme');
          if (hint) ctx.say(hint);
          else ctx.say('Try again! ' + prompt, ['Try again!', ...[].concat(parts || prompt)]);
        }
      });
      grid.append(btn);
    }
    b.append(grid);
    ctx.say(prompt, parts);
  });
}

/**
 * Drag items onto targets. scene contains elements with data-key; each item has a key.
 * Children can also tap an item, then tap where it goes.
 */
export function drag(ctx, { prompt, parts, scene, items, trayClass = '' }) {
  return new Promise(res => {
    const b = ctx.board; b.innerHTML = '';
    const tray = h('div', { class: 'tray ' + trayClass });
    b.append(scene, tray);
    let left = items.length, sel = null, busy = false;

    const tryDrop = async (it, target) => {
      if (!target || busy) return false;
      if (target.dataset.key === it.key) {
        it.el.classList.remove('sel'); it.el.classList.add('placed');
        (target.querySelector('.slot') || target).append(it.el);
        sfx.drop(); ctx.sparkle(target); left--;
        if (it.say) ctx.say(it.say);
        if (left === 0) { busy = true; await sleep(350); await ctx.good(); res(); }
        return true;
      }
      ctx.bad(target);
      if (it.hint) ctx.say(it.hint);
      return false;
    };

    scene.addEventListener('click', e => {
      const t = e.target.closest('[data-key]');
      if (t && sel && !sel.el.classList.contains('placed')) { const s = sel; sel = null; s.el.classList.remove('sel'); tryDrop(s, t); }
    });

    for (const it of shuffle(items)) {
      const el = it.node; it.el = el; el.classList.add('dragme'); el.dataset.item = it.key;
      tray.append(el);
      el.addEventListener('pointerdown', e => {
        if (el.classList.contains('placed') || !ctx.alive()) return;
        e.preventDefault();
        const r = el.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, home = el.parentElement, next = el.nextSibling;
        let moved = false;
        const move = ev => {
          const dx = ev.clientX - sx, dy = ev.clientY - sy;
          if (!moved && Math.hypot(dx, dy) > 8) {
            moved = true; el.classList.add('dragging');
            el.style.width = r.width + 'px'; el.style.height = r.height + 'px';
            el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; document.body.append(el);
          }
          if (moved) { el.style.left = (r.left + dx) + 'px'; el.style.top = (r.top + dy) + 'px'; }
        };
        const up = async ev => {
          removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
          if (!moved) { // tap to select
            if (sel && sel !== it) sel.el.classList.remove('sel');
            sel = sel === it ? null : it; el.classList.toggle('sel', sel === it); sfx.tap();
            return;
          }
          const under = document.elementFromPoint(ev.clientX, ev.clientY);
          const target = under && under.closest('[data-key]');
          el.classList.remove('dragging'); el.style.left = el.style.top = el.style.width = el.style.height = '';
          home.insertBefore(el, next && next.parentElement === home ? next : null);
          if (target && scene.contains(target)) await tryDrop(it, target);
        };
        addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
      });
    }
    ctx.say(prompt, parts);
  });
}

/**
 * Tap things in the right order (smallest to biggest, a b c d...).
 * items: [{node, order}] — lowest order first. Placed items move onto the line.
 */
export function tapOrder(ctx, { prompt, parts, items, lineClass = '' }) {
  return new Promise(res => {
    const b = ctx.board; b.innerHTML = '';
    const line = h('div', { class: 'orderline ' + lineClass });
    const pool = h('div', { class: 'opts' });
    const sorted = [...items].sort((a, c) => a.order - c.order);
    for (let i = 0; i < items.length; i++) line.append(h('div', { class: 'orderslot' }));
    b.append(line, pool);
    let idx = 0, wrongs = 0;
    for (const it of shuffle(items)) {
      const btn = h('button', { class: 'opt' }, it.node);
      btn.addEventListener('click', async () => {
        if (!ctx.alive() || btn.disabled) return;
        if (it === sorted[idx]) {
          btn.disabled = true; sfx.drop();
          line.children[idx].append(it.node); line.children[idx].classList.add('filled');
          btn.remove(); idx++; wrongs = 0;
          if (idx === items.length) { await sleep(250); await ctx.good(); res(); }
        } else {
          ctx.bad(btn); wrongs++;
          if (wrongs >= 2) [...pool.children].forEach(c => c.classList.toggle('hintme', c.contains(sorted[idx].node)));
        }
      });
      pool.append(btn);
    }
    ctx.say(prompt, parts);
  });
}

/** Number button content. */
export const numNode = n => h('span', { class: 'num' }, String(n));
