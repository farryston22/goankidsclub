// Anonymous usage counts for the Goan Kids Club dashboard, plus opt-in sharing of a child's first name and progress.
// Counts carry no id, name or device fingerprint: just "what happened" (e.g. Frog Hop, stage 2, 3 stars, age group 4–5).
// Grown-ups can switch counts off (Grown-ups → Privacy). Sharing a child's name only happens if a grown-up ticks the box.
import { CLOUD } from './cloud-config.js';

const QK = 'gkc-stats-q', SK = 'gkc-stats-seen';
let on = true, q = [], seen = {}, timer = null, busy = false;
try { q = JSON.parse(localStorage.getItem(QK)) || []; seen = JSON.parse(localStorage.getItem(SK)) || {}; } catch (e) { /* private mode */ }
const keep = () => { try { localStorage.setItem(QK, JSON.stringify(q.slice(-300))); localStorage.setItem(SK, JSON.stringify(seen)); } catch (e) { /* private mode */ } };
// Local testing (localhost) never sends counts, so it cannot skew the real numbers. Add ?stats=1 to test sending.
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !/[?&]stats=1/.test(location.search);
const ready = () => !!(CLOUD.url && CLOUD.key) && !LOCAL;

async function rpc(fn, args, keepalive = false) {
  const r = await fetch(`${CLOUD.url}/rest/v1/rpc/${fn}`, {
    method: 'POST', keepalive, headers: { 'Content-Type': 'application/json', apikey: CLOUD.key }, body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`${fn} ${r.status}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}

/** Turn anonymous counts on or off (grown-ups setting). Turning off also drops anything not yet sent. */
export function statsOn(v) { on = v !== false; if (!on) { q = []; keep(); } }

/** Count one event. k = kind; g = game id; s = stage/number; b = age group 1–3; st = stars; secs = seconds. */
export function track(k, f = {}) {
  if (!on || !ready()) return;
  q.push({ k, ...f }); keep();
  clearTimeout(timer); timer = setTimeout(flush, 8000);
}
/** Count something only once per day (per key) on this device, e.g. "this device was used today". */
export function once(key, day, k, f) {
  if (!on || seen[key] === day) return;
  for (const x of Object.keys(seen)) if (seen[x] !== day) delete seen[x];
  seen[key] = day;
  track(k, f);
}
export async function flush(leaving = false) {
  if (!on || busy || !q.length || !ready() || navigator.onLine === false) return;
  busy = true; const batch = q.slice(0, 50);
  try {
    await rpc('gkc_track', { p_events: batch }, leaving);
    q = q.slice(batch.length); keep();
    if (q.length) { clearTimeout(timer); timer = setTimeout(flush, 1500); }
  } catch (e) { /* offline: try later */ } finally { busy = false; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true); });

export const deviceKind = () => {
  const s = Math.min(screen.width, screen.height), touch = navigator.maxTouchPoints > 0;
  return s < 600 ? 'phone' : touch && s < 1100 ? 'tablet' : 'computer';
};
export const installed = () => (matchMedia('(display-mode: standalone)').matches || navigator.standalone ? 1 : 0);

/* ---------- opt-in sharing of one child's first name and progress ---------- */
export function newShareKey() { const r = new Uint8Array(18); crypto.getRandomValues(r); return Array.from(r, b => b.toString(16).padStart(2, '0')).join(''); }
export const shareChild = (id, key, data) => (ready() ? rpc('gkc_share', { p_id: id, p_key: key, p_data: data }) : Promise.resolve(false));
export const unshareChild = (id, key) => (ready() ? rpc('gkc_unshare', { p_id: id, p_key: key }) : Promise.resolve(false));
