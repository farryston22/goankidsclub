// Content: phonics (UK Letters and Sounds, Phase 2 order), words, animals, colours, shapes, Konkani.

/* Phonics sets in the order UK schools teach them. */
export const PHONIC_SETS = [
  ['s', 'a', 't', 'p'],
  ['i', 'n', 'm', 'd'],
  ['g', 'o', 'c', 'k'],
  ['e', 'u', 'r', 'h'],
  ['b', 'f', 'l', 'j', 'v', 'w', 'y', 'z'],
];
/* How the robot voice says each pure sound (use recorded clips for best results: audio/phonics/s.mp3). */
export const SOUND = {
  s: 'sss', a: 'a', t: 'tuh', p: 'puh', i: 'ih', n: 'nnn', m: 'mmm', d: 'duh', g: 'guh', o: 'o', c: 'kuh', k: 'kuh',
  e: 'eh', u: 'uh', r: 'rrr', h: 'huh', b: 'buh', f: 'fff', l: 'lll', j: 'juh', v: 'vvv', w: 'wuh', y: 'yuh', z: 'zzz', x: 'ks', q: 'kwuh',
};
/* Words that start with each sound, with a picture. */
export const STARTS = {
  s: [['sun', '☀️'], ['snake', '🐍'], ['sock', '🧦'], ['star', '⭐']],
  a: [['apple', '🍎'], ['ant', '🐜'], ['astronaut', '🧑‍🚀']],
  t: [['tiger', '🐯'], ['tent', '⛺'], ['tomato', '🍅'], ['train', '🚂']],
  p: [['pig', '🐷'], ['penguin', '🐧'], ['pizza', '🍕'], ['parrot', '🦜']],
  i: [['insect', '🐞'], ['iguana', '🦎'], ['ink', '🖋️']],
  n: [['nose', '👃'], ['nest', '🪺'], ['nut', '🥜'], ['nine', '9️⃣']],
  m: [['monkey', '🐒'], ['moon', '🌙'], ['mouse', '🐭'], ['milk', '🥛']],
  d: [['dog', '🐶'], ['duck', '🦆'], ['drum', '🥁'], ['dolphin', '🐬']],
  g: [['goat', '🐐'], ['gift', '🎁'], ['guitar', '🎸'], ['grapes', '🍇']],
  o: [['octopus', '🐙'], ['orange', '🍊'], ['otter', '🦦']],
  c: [['cat', '🐱'], ['car', '🚗'], ['cake', '🎂'], ['cow', '🐮']],
  k: [['kite', '🪁'], ['king', '🤴'], ['kangaroo', '🦘'], ['key', '🔑']],
  e: [['egg', '🥚'], ['elephant', '🐘'], ['envelope', '✉️']],
  u: [['umbrella', '☂️'], ['up', '⬆️'], ['unicorn', '🦄']],
  r: [['rabbit', '🐰'], ['rainbow', '🌈'], ['robot', '🤖'], ['rocket', '🚀']],
  h: [['hat', '🎩'], ['horse', '🐴'], ['house', '🏠'], ['heart', '❤️']],
  b: [['ball', '⚽'], ['bus', '🚌'], ['banana', '🍌'], ['bee', '🐝']],
  f: [['fish', '🐟'], ['fox', '🦊'], ['frog', '🐸'], ['flower', '🌸']],
  l: [['lion', '🦁'], ['leaf', '🍃'], ['lemon', '🍋'], ['ladybird', '🐞']],
  j: [['jellyfish', '🪼'], ['jeans', '👖'], ['juice', '🧃']],
  v: [['van', '🚐'], ['violin', '🎻'], ['volcano', '🌋']],
  w: [['whale', '🐳'], ['watermelon', '🍉'], ['worm', '🪱'], ['watch', '⌚']],
  y: [['yo-yo', '🪀'], ['yacht', '⛵'], ['yawn', '🥱']],
  z: [['zebra', '🦓'], ['zip', '🤐'], ['zero', '0️⃣']],
};
export const lettersUpTo = stage => PHONIC_SETS.slice(0, stage + 1).flat();

/* Simple words to sound out and build (CVC = consonant-vowel-consonant). */
export const CVC = [
  ['cat', '🐱'], ['dog', '🐶'], ['pig', '🐷'], ['sun', '☀️'], ['bus', '🚌'], ['hat', '🎩'], ['bed', '🛏️'],
  ['map', '🗺️'], ['pen', '🖊️'], ['box', '📦'], ['fox', '🦊'], ['bat', '🦇'], ['hen', '🐔'], ['van', '🚐'],
  ['web', '🕸️'], ['bug', '🐛'], ['log', '🪵'], ['pot', '🍲'], ['tap', '🚰'], ['pin', '📌'], ['leg', '🦵'],
  ['rat', '🐀'], ['bag', '👜'], ['mug', '☕'], ['net', '🥅'], ['six', '6️⃣'], ['ten', '🔟'], ['jam', '🍯'],
];
export const CCVC = [
  ['frog', '🐸'], ['drum', '🥁'], ['crab', '🦀'], ['milk', '🥛'], ['tent', '⛺'], ['nest', '🪺'],
  ['hand', '✋'], ['flag', '🚩'], ['gift', '🎁'], ['star', '⭐'], ['swan', '🦢'], ['clap', '👏'],
];

/* Animals. fact = a short thing to say after a right answer. */
export const ANIMALS = {
  farm: [
    { n: 'cow', e: '🐄', s: 'moo', f: 'Cows give us milk.' },
    { n: 'pig', e: '🐖', s: 'oink', f: 'Pigs love rolling in mud to keep cool.' },
    { n: 'sheep', e: '🐑', s: 'baa', f: 'Sheep give us wool for jumpers.' },
    { n: 'horse', e: '🐎', s: 'neigh', f: 'Horses can sleep standing up.' },
    { n: 'hen', e: '🐔', s: 'cluck', f: 'Hens lay eggs.' },
    { n: 'duck', e: '🦆', s: 'quack', f: 'Ducks have waterproof feathers.' },
    { n: 'goat', e: '🐐', s: 'meh', f: 'Goats are brilliant climbers.' },
    { n: 'dog', e: '🐕', s: 'woof', f: 'Dogs can smell much better than us.' },
    { n: 'cat', e: '🐈', s: 'meow', f: 'Cats sleep for most of the day.' },
    { n: 'rooster', e: '🐓', s: 'cock-a-doodle-doo', f: 'Roosters crow in the morning.' },
  ],
  wild: [
    { n: 'lion', e: '🦁', s: 'roar', f: 'A lion\'s roar can be heard far away.' },
    { n: 'tiger', e: '🐅', f: 'Every tiger has different stripes.' },
    { n: 'elephant', e: '🐘', f: 'Elephants use their trunks like a hand.' },
    { n: 'giraffe', e: '🦒', f: 'Giraffes are the tallest animals.' },
    { n: 'zebra', e: '🦓', f: 'Zebras are black and white.' },
    { n: 'monkey', e: '🐒', f: 'Monkeys swing from tree to tree.' },
    { n: 'bear', e: '🐻', f: 'Bears sleep through the winter.' },
    { n: 'hippo', e: '🦛', f: 'Hippos love being in the water.' },
    { n: 'crocodile', e: '🐊', f: 'Crocodiles have very strong jaws.' },
    { n: 'kangaroo', e: '🦘', f: 'Baby kangaroos live in a pouch.' },
  ],
  sea: [
    { n: 'fish', e: '🐟', f: 'Fish breathe through gills.' },
    { n: 'whale', e: '🐋', f: 'Blue whales are the biggest animals ever.' },
    { n: 'dolphin', e: '🐬', f: 'You can see dolphins on a boat trip in Goa!' },
    { n: 'octopus', e: '🐙', f: 'An octopus has eight arms.' },
    { n: 'crab', e: '🦀', f: 'Crabs walk sideways.' },
    { n: 'shark', e: '🦈', f: 'Sharks have lots of teeth.' },
    { n: 'turtle', e: '🐢', f: 'Turtles lay their eggs on beaches, even in Goa!' },
    { n: 'jellyfish', e: '🪼', f: 'Jellyfish have no bones.' },
    { n: 'seal', e: '🦭', f: 'Seals can hold their breath for a long time.' },
    { n: 'prawn', e: '🦐', f: 'Prawns are used in Goan curry.' },
  ],
  birds: [
    { n: 'owl', e: '🦉', s: 'twit twoo', f: 'Owls hunt at night.' },
    { n: 'parrot', e: '🦜', f: 'Some parrots can copy words.' },
    { n: 'peacock', e: '🦚', f: 'The peacock is the national bird of India.' },
    { n: 'eagle', e: '🦅', f: 'Eagles can see very far.' },
    { n: 'penguin', e: '🐧', f: 'Penguins cannot fly, but they swim very fast.' },
    { n: 'butterfly', e: '🦋', f: 'A butterfly starts life as a caterpillar.' },
    { n: 'bee', e: '🐝', s: 'buzz', f: 'Bees make honey.' },
    { n: 'ladybird', e: '🐞', f: 'Ladybirds have spots.' },
    { n: 'snail', e: '🐌', f: 'Snails carry their house on their back.' },
    { n: 'spider', e: '🕷️', f: 'Spiders have eight legs.' },
  ],
  goa: [
    { n: 'buffalo', e: '🐃', f: 'Buffaloes help farmers in the Goan paddy fields.' },
    { n: 'crab', e: '🦀', f: 'Goan crab curry is yummy!' },
    { n: 'prawn', e: '🦐', f: 'Prawn balchão is a famous Goan dish.' },
    { n: 'peacock', e: '🦚', f: 'Peacocks dance when it rains.' },
    { n: 'monkey', e: '🐒', f: 'Monkeys live in the Goan forests.' },
    { n: 'turtle', e: '🐢', f: 'Olive ridley turtles nest on Morjim beach in Goa.' },
    { n: 'dolphin', e: '🐬', f: 'Dolphins swim near the Goan coast.' },
    { n: 'rooster', e: '🐓', f: 'Roosters wake up Goan villages.' },
    { n: 'snake', e: '🐍', f: 'Some snakes in Goa are very long.' },
    { n: 'fish', e: '🐟', f: 'Goans love fish curry and rice.' },
  ],
};
export const HOMES = {
  farm: { label: 'Farm', e: '🚜', bg: '#D9F2C4', animals: ['🐄', '🐖', '🐑', '🐔', '🐐', '🐎'] },
  sea: { label: 'Sea', e: '🌊', bg: '#C8E9FF', animals: ['🐟', '🐙', '🦀', '🐬', '🦈', '🐋'] },
  jungle: { label: 'Jungle', e: '🌴', bg: '#C9EBC0', animals: ['🦁', '🐒', '🐘', '🦒', '🐅', '🦜'] },
  sky: { label: 'Sky', e: '☁️', bg: '#E6EEFF', animals: ['🦅', '🦉', '🦋', '🐝', '🕊️'] },
  snow: { label: 'Snow', e: '❄️', bg: '#F0F7FF', animals: ['🐧', '🐻‍❄️', '🦭'] },
};
export const BABIES = [
  { baby: 'chick', mum: '🐔', mn: 'hen', st: 0 }, { baby: 'kitten', mum: '🐈', mn: 'cat', st: 0 },
  { baby: 'puppy', mum: '🐕', mn: 'dog', st: 0 }, { baby: 'lamb', mum: '🐑', mn: 'sheep', st: 0 },
  { baby: 'calf', mum: '🐄', mn: 'cow', st: 1 }, { baby: 'foal', mum: '🐎', mn: 'horse', st: 1 },
  { baby: 'piglet', mum: '🐖', mn: 'pig', st: 1 }, { baby: 'duckling', mum: '🦆', mn: 'duck', st: 1 },
  { baby: 'tadpole', mum: '🐸', mn: 'frog', st: 2 }, { baby: 'caterpillar', mum: '🦋', mn: 'butterfly', st: 2 },
  { baby: 'joey', mum: '🦘', mn: 'kangaroo', st: 2 }, { baby: 'cub', mum: '🦁', mn: 'lion', st: 2 },
];

/* Colours (UK spelling in UI). */
export const COLOURS = [
  { n: 'red', c: '#E53935' }, { n: 'blue', c: '#1E88E5' }, { n: 'yellow', c: '#FDD835' }, { n: 'green', c: '#43A047' },
  { n: 'orange', c: '#FB8C00' }, { n: 'purple', c: '#8E24AA' }, { n: 'pink', c: '#F06292' }, { n: 'brown', c: '#8D6E63' },
  { n: 'black', c: '#263238' }, { n: 'white', c: '#FFFFFF' }, { n: 'grey', c: '#9E9E9E' },
];
export const colour = n => COLOURS.find(c => c.n === n);
export const COLOUR_THINGS = [
  ['banana', '🍌', 'yellow'], ['strawberry', '🍓', 'red'], ['frog', '🐸', 'green'], ['orange', '🍊', 'orange'],
  ['aubergine', '🍆', 'purple'], ['pig', '🐷', 'pink'], ['bear', '🐻', 'brown'], ['whale', '🐳', 'blue'],
  ['sweetcorn', '🌽', 'yellow'], ['broccoli', '🥦', 'green'], ['tomato', '🍅', 'red'], ['grapes', '🍇', 'purple'],
];
export const MIXES = [['red', 'yellow', 'orange'], ['blue', 'yellow', 'green'], ['red', 'blue', 'purple'], ['red', 'white', 'pink'], ['black', 'white', 'grey']];

/* Shapes as SVG. */
const poly = (n, rot = -90, r = 44) => Array.from({ length: n }, (_, i) => {
  const a = (rot + i * 360 / n) * Math.PI / 180; return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
}).join(' ');
const starPts = () => Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 ? 19 : 46, a = (-90 + i * 36) * Math.PI / 180; return `${(50 + r * Math.cos(a)).toFixed(1)},${(52 + r * Math.sin(a)).toFixed(1)}`;
}).join(' ');
export const SHAPES = {
  circle: { sides: 0, svg: '<circle cx="50" cy="50" r="44"/>' },
  square: { sides: 4, svg: '<rect x="8" y="8" width="84" height="84" rx="3"/>' },
  triangle: { sides: 3, svg: '<polygon points="50,6 95,90 5,90"/>' },
  rectangle: { sides: 4, svg: '<rect x="3" y="24" width="94" height="52" rx="3"/>' },
  star: { sides: 0, svg: `<polygon points="${starPts()}"/>` },
  heart: { sides: 0, svg: '<path d="M50 90 C10 62 4 40 14 24 C26 6 46 12 50 28 C54 12 74 6 86 24 C96 40 90 62 50 90Z"/>' },
  oval: { sides: 0, svg: '<ellipse cx="50" cy="50" rx="46" ry="30"/>' },
  diamond: { sides: 4, svg: '<polygon points="50,4 88,50 50,96 12,50"/>' },
  pentagon: { sides: 5, svg: `<polygon points="${poly(5)}"/>` },
  hexagon: { sides: 6, svg: `<polygon points="${poly(6, 0)}"/>` },
  octagon: { sides: 8, svg: `<polygon points="${poly(8, 22.5)}"/>` },
  semicircle: { sides: 0, svg: '<path d="M4 70 A46 46 0 0 1 96 70 Z"/>' },
};
export function shapeEl(name, fill = '#6C4CF5', cls = '') {
  const s = document.createElement('span');
  s.className = 'shape ' + cls;
  s.innerHTML = `<svg viewBox="0 0 100 100" fill="${fill}" stroke="rgba(0,0,0,.15)" stroke-width="3">${SHAPES[name].svg}</svg>`;
  return s;
}

/* UK coins. */
export const COINS = {
  1: { label: '1p', r: 20, fill: '#D08A4E', edge: '#9A5B2A' },
  2: { label: '2p', r: 26, fill: '#D08A4E', edge: '#9A5B2A' },
  5: { label: '5p', r: 18, fill: '#D9DDE2', edge: '#8F98A3' },
  10: { label: '10p', r: 25, fill: '#D9DDE2', edge: '#8F98A3' },
  20: { label: '20p', r: 22, fill: '#D9DDE2', edge: '#8F98A3', hept: true },
  50: { label: '50p', r: 27, fill: '#D9DDE2', edge: '#8F98A3', hept: true },
  100: { label: '£1', r: 24, fill: '#E7C45B', edge: '#B08E2B' },
  200: { label: '£2', r: 28, fill: '#E7C45B', edge: '#B08E2B', ring: '#D9DDE2' },
};
export function coinEl(v, scale = 1.5) {
  const c = COINS[v], R = c.r * scale, d = R * 2 + 6;
  const hept = Array.from({ length: 7 }, (_, i) => { const a = (-90 + i * 360 / 7) * Math.PI / 180; return `${(d / 2 + R * Math.cos(a)).toFixed(1)},${(d / 2 + R * Math.sin(a)).toFixed(1)}`; }).join(' ');
  const body = c.hept ? `<polygon points="${hept}" fill="${c.fill}" stroke="${c.edge}" stroke-width="3" stroke-linejoin="round"/>`
    : c.ring ? `<circle cx="${d / 2}" cy="${d / 2}" r="${R}" fill="${c.fill}" stroke="${c.edge}" stroke-width="3"/><circle cx="${d / 2}" cy="${d / 2}" r="${R * 0.68}" fill="${c.ring}"/>`
      : `<circle cx="${d / 2}" cy="${d / 2}" r="${R}" fill="${c.fill}" stroke="${c.edge}" stroke-width="3"/><circle cx="${d / 2}" cy="${d / 2}" r="${R - 5}" fill="none" stroke="${c.edge}" stroke-opacity=".35" stroke-width="1.5"/>`;
  const s = document.createElement('span');
  s.className = 'coin';
  s.innerHTML = `<svg width="${d}" height="${d}" viewBox="0 0 ${d} ${d}">${body}<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="${Math.max(12, R * 0.62)}" fill="#3b2a12">${c.label}</text></svg>`;
  return s;
}

/* Konkani (Romi script). PLEASE CHECK spellings with your own teaching, and record clips:
   audio/konkani/ek.mp3 etc. — the robot voice cannot say Konkani properly. */
export const KONKANI = {
  numbers: [['ek', 1], ['don', 2], ['tin', 3], ['char', 4], ['panch', 5], ['sou', 6], ['sat', 7], ['att', 8], ['nov', 9], ['dha', 10]],
  colours: [['tambdo', 'red'], ['pivllo', 'yellow'], ['hirvo', 'green'], ['nillo', 'blue'], ['kallo', 'black'], ['dhovo', 'white']],
  animals: [['gai', '🐄', 'cow'], ['mazor', '🐈', 'cat'], ['sunnem', '🐕', 'dog'], ['nustem', '🐟', 'fish'], ['hatti', '🐘', 'elephant'], ['makodd', '🐒', 'monkey'], ['kombo', '🐓', 'rooster'], ['dukor', '🐖', 'pig']],
};
