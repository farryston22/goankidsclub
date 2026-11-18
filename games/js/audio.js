// Voice (British English text-to-speech, or your own recorded clips) and sound effects.
import { sleep } from './util.js';

let settings = { rate: 0.9, voice: true, sfx: true };
export const bindSettings = s => { settings = s; };

/* ---------- recorded clips ----------
   Put MP3s in /audio (e.g. audio/konkani/tin.mp3) and list their keys in audio/manifest.json:
   ["konkani/tin", "phonics/s"]. A listed clip is played instead of the robot voice. */
// Entries may include an extension ("konkani/tin.m4a"); without one, .mp3 is assumed.
let clips = new Map();
export async function loadClips() {
  try {
    const r = await fetch('audio/manifest.json', { cache: 'no-cache' });
    if (r.ok) for (const f of await r.json()) { const base = f.replace(/\.(mp3|m4a|aac|wav|ogg)$/i, ''); clips.set(base, base === f ? f + '.mp3' : f); }
  } catch (e) { /* no clips */ }
}
export const hasClip = k => clips.has(k);
/** File name for a recorded sentence: lower case, words joined by dashes (see audio/VOICEOVERS.md). */
export const slug = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);

/* ---------- voice ---------- */
const canTTS = 'speechSynthesis' in window;
let voice = null;
const PREFER = /(libby|sonia|maisie|mia|serena|martha|kate|stephanie|hazel|susan|google uk english female)/i;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice = vs.find(v => /en[-_]GB/i.test(v.lang) && PREFER.test(v.name))
    || vs.find(v => /en[-_]GB/i.test(v.lang))
    || vs.find(v => /^en/i.test(v.lang)) || null;
}
if (canTTS) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

let talkCb = () => {};
export const onTalk = cb => { talkCb = cb; };
let current = null, token = 0;

export function stop() {
  token++;
  if (canTTS) speechSynthesis.cancel();
  if (current) { current.pause(); current = null; }
  talkCb(false);
}

function ttsOnce(text, my) {
  return new Promise(res => {
    if (!canTTS || !text) return res();
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    const u = new SpeechSynthesisUtterance(text);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-GB';
    u.rate = settings.rate; u.pitch = 1.1;
    u.onend = fin; u.onerror = fin;
    speechSynthesis.speak(u);
    setTimeout(fin, 1800 + text.length * 110 / settings.rate);
    if (my !== token) fin();
  });
}
function clipOnce(key, my) {
  return new Promise(res => {
    const a = new Audio('audio/' + clips.get(key)); current = a;
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    a.onended = fin; a.onerror = fin; a.play().catch(fin);
    setTimeout(fin, 15000);
    if (my !== token) fin();
  });
}

/** Speak a list of parts in order. A part is a string, or {t: 'text to say', clip: 'key'}. */
export async function speak(parts, fallbackText = '') {
  stop(); const my = token;
  if (!settings.voice) { await sleep(700 + String(fallbackText).length * 40); return; }
  talkCb(true);
  for (const p of [].concat(parts)) {
    if (my !== token) return;
    const part = typeof p === 'string' ? { t: p } : p;
    const auto = part.t && clips.size ? 'say/' + slug(part.t) : null;
    if (part.clip && clips.has(part.clip)) await clipOnce(part.clip, my);
    else if (auto && clips.has(auto)) await clipOnce(auto, my);
    else await ttsOnce(part.t, my);
  }
  if (my === token) talkCb(false);
}

/* ---------- sound effects (no files needed) ---------- */
let ctx = null;
function tone(freqs, dur = 0.12, type = 'sine', vol = 0.12, gap = 0.8) {
  if (!settings.sfx) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    let t = ctx.currentTime;
    for (const f of freqs) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur); t += dur * gap;
    }
  } catch (e) { /* audio blocked */ }
}
export const sfx = {
  tap: () => tone([520], 0.05, 'triangle', 0.08),
  good: () => tone([660, 880, 1320], 0.12),
  bad: () => tone([280, 210], 0.15, 'triangle', 0.1),
  pop: () => tone([900, 1400], 0.05, 'sine', 0.1),
  hop: () => tone([400, 700], 0.07, 'square', 0.04),
  drop: () => tone([330, 500], 0.07, 'triangle', 0.09),
  win: () => tone([523, 659, 784, 1047, 1319], 0.16, 'sine', 0.13),
  coin: () => tone([1200, 1800], 0.06, 'square', 0.04),
  note: f => tone([f], 0.08, 'sine', 0.08),
  drum: (f = 95) => tone([f, f * 0.72], 0.2, 'sine', 0.3, 0.35),
  ting: () => tone([1568, 2349], 0.09, 'triangle', 0.07, 0.5),
  clap: () => tone([1900, 1200, 700], 0.03, 'square', 0.05, 0.6),
  toot: () => tone([392, 392, 523], 0.14, 'square', 0.04, 1.1),
  splash: () => tone([800, 500, 300, 200], 0.06, 'triangle', 0.08, 0.9),
};
