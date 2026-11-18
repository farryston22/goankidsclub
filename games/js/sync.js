// Optional online saving with a family code (no email, no password).
// The code is the key: anyone with it can load that family's progress, so it is long and random.
import { CLOUD } from './cloud-config.js';

const WORDS = ('MANGO CRAB PALM BEACH COCONUT TURTLE DOLPHIN PEACOCK PARROT MONKEY TIGER LION ZEBRA PANDA KOALA OTTER ' +
  'BUNNY KITTEN PUPPY PONY DUCK GOOSE OWL EAGLE ROBIN SWAN WHALE SHARK SEAL PRAWN SHELL PEARL STAR MOON SUN CLOUD ' +
  'RAIN RIVER LAKE HILL FIELD GARDEN TULIP DAISY LOTUS ROSE LILY HIBISCUS JASMINE BANANA CHERRY LEMON MELON GRAPE ' +
  'PEACH PLUM KIWI PAPAYA CASHEW HONEY BREAD CAKE BEBINCA KITE BOAT CANOE TRAIN TRAM BUS ROCKET DRUM GUITAR FLUTE ' +
  'BELL CANDLE LANTERN CHURCH TOWER BRIDGE CASTLE HOUSE WINDOW DOOR PORCH TILE BRUSH CRAYON PAINT BUBBLE BALLOON ' +
  'PUZZLE BLOCK TEDDY DRAGON UNICORN FAIRY GIANT PIRATE WIZARD BUTTON RIBBON PEBBLE SAND WAVE CORAL ANCHOR ISLAND ' +
  'MAPLE OAK CEDAR FERN MOSS BREEZE THUNDER RAINBOW COMET PLANET').split(' ');

export const cloudReady = () => !!(CLOUD.url && CLOUD.key);

export function newCode() {
  const r = new Uint32Array(4); crypto.getRandomValues(r);
  const w = i => WORDS[r[i] % WORDS.length];
  return `${w(0)}-${w(1)}-${w(2)}-${String(r[3] % 10000).padStart(4, '0')}`;
}
export const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function rpc(fn, args) {
  const r = await fetch(`${CLOUD.url}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CLOUD.key }, body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`${fn} failed (${r.status})`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
/** Returns {data, updated_at} or null when nothing is saved under this code. */
export const loadFamily = code => rpc('gkc_load', { p_code: code });
export const saveFamily = (code, data) => rpc('gkc_save', { p_code: code, p_data: data });
export const deleteFamily = code => rpc('gkc_delete', { p_code: code });

/** Merge two copies: keep every child, the most recently changed copy of each wins; deletions stick. */
export function merge(local, remote) {
  const deleted = new Set([...(local.deleted || []), ...((remote && remote.deleted) || [])]);
  const byId = new Map();
  for (const p of [...((remote && remote.profiles) || []), ...(local.profiles || [])]) {
    if (!p || deleted.has(p.id)) continue;
    const cur = byId.get(p.id);
    if (!cur || (p.updatedAt || 0) >= (cur.updatedAt || 0)) byId.set(p.id, p);
  }
  return { profiles: [...byId.values()], deleted: [...deleted] };
}
