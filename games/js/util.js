// Small helpers shared by the app and every game.
export const $ = (s, r = document) => r.querySelector(s);

export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}

export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = a => a[Math.floor(Math.random() * a.length)];
export function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const sample = (a, n) => shuffle(a).slice(0, n);
export const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
export const sleep = ms => new Promise(r => setTimeout(r, ms));

/** n distinct number options including ans, all inside [lo, hi]. */
export function numOpts(ans, lo, hi, n = 3) {
  const s = new Set([ans]);
  for (let g = 0; s.size < n && g < 300; g++) { const d = ans + rnd(-3, 3); if (d >= lo && d <= hi) s.add(d); }
  for (let d = lo; s.size < n && d <= hi; d++) s.add(d);
  return shuffle([...s]);
}

/** Big emoji glyph. */
export const em = (e, cls = '') => h('span', { class: 'em ' + cls }, e);

/** Pick a different item from the last one used (avoids repeats in a round). */
export function freshPicker(list) {
  let bag = [];
  return () => { if (!bag.length) bag = shuffle(list); return bag.pop(); };
}
