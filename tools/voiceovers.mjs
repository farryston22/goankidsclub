// Builds games/audio/VOICEOVERS.md: every recording the games can use, with the exact file name.
// Run: node tools/voiceovers.mjs   (re-run after adding games or words)
import { readFileSync, writeFileSync } from 'node:fs';

const slug = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
const src = readFileSync(new URL('../games/js/games/goa.js', import.meta.url), 'utf8');
const data = readFileSync(new URL('../games/js/data.js', import.meta.url), 'utf8');
const grab = (re, s = src) => [...s.matchAll(re)].map(m => m[1]);
const uniq = a => [...new Set(a)];

// Konkani greetings: { k: 'dev-borem-korum', w: 'Dev borem korum', en: 'Thank you'
const greet = [...src.matchAll(/\{ k: '([a-z-]+)', w: '([^']+)', en: (?:'([^']+)'|"([^"]+)")/g)].map(m => [m[1], m[2], m[3] || m[4]]);
const kon = data.match(/export const KONKANI = \{([\s\S]*?)\n\};/)[1];
const konNums = [...kon.matchAll(/\['([a-z]+)', (\d+)\]/g)].map(m => [m[1], m[2]]);
const konCols = [...kon.matchAll(/\['([a-z]+)', '([a-z]+)'\]/g)].map(m => [m[1], m[2]]);
const konAnimals = [...kon.matchAll(/\['([a-z]+)', '[^']+', '([a-z]+)'\]/g)].map(m => [m[1], m[2]]);

// Goan names spoken with P(): districts, towns, talukas, villages, festivals, stations
const districts = ['North Goa', 'South Goa', 'Kushavati'];
const towns = grab(/^\s+'?([A-Z][A-Za-z ]+?)'?: \[\d+, \d+, '(?:north|south|kush)'\]/gm);
const talukas = grab(/\['([A-Z][a-z]+)', '(?:north|south|kush)', \d+, \d+\]/g);
const placesBlock = src.match(/const PLACES = \{([\s\S]*?)\n\};/)[1];
const places = grab(/\['([A-Z][A-Za-z ]+)', '[^']+'\]/g, placesBlock);
const fests = grab(/name: '([^']+)', icon: '[^']+', month:/g);
const stations = grab(/\['([A-Z][a-z]+)', \d+, \d+\]/g);
const names = uniq([...districts, ...towns, ...talukas, ...places, ...fests, ...stations]).sort();

const sentences = [
  'Goa has three districts: North Goa, South Goa and Kushavati.',
  'Build the map of Goa! Drag each piece to where it fits.',
  'Brilliant! You built Goa: North Goa, South Goa and Kushavati.',
  'Kushavati is the newest district. It is named after the Kushavati river.',
  'Panaji, also called Panjim, is the capital of Goa. It is on the Mandovi river.',
  'Tap a place to hear its name, then drag it to its district.',
  'Make the picture! Drag each piece to its place.',
  'Match each festival to its special thing!',
  'Put the festivals in order through the year. Which comes first, after New Year?',
  'Hooray! A whole year of Goan festivals.',
  'The ghumot is a Goan drum made of clay. Listen to the beat, then play it back!',
  'Listen!', 'Your turn!', 'Oops! Listen again.',
  'Choo choo! How many carriages does the train have?',
  'Drive the train from north to south! Tap the stations in order, starting at the top of the map.',
  'Find the matching pairs of famous Goan places!',
  'Summer, monsoon or winter? Drag each one to its season.',
  ...grab(/f: '([^']+)' \}/g),
];

const row = (file, say, note = '') => `| \`${file}\` | ${say} | ${note} |`;
let md = `# Voiceover list for Goan Kids Club

The games speak with the device's British English voice. It cannot say **Konkani** properly and often gets
**Goan names** wrong (it says "Pan-ah-jee" for Panaji). Record these and the games use your voice automatically.

## How to record
1. Use your phone's voice-memo app, somewhere quiet, about 20 cm from the mic. Say it clearly and happily, like on your channel.
2. One recording per file. Trim the silence at the start and end. MP3 or M4A are both fine.
3. Name the file exactly as in the table (lower case, dashes). Put it in the folder shown, e.g. \`games/audio/konkani/dev-borem-korum.mp3\`.
4. Send them to Claude (or put them in the folder) and ask to "add my recordings". Claude lists them in \`audio/manifest.json\` and publishes.

**Priority:** 1 → 2 → 3. Part 1 matters most: without it, children hear the robot try to read Konkani.

## Part 1: Konkani (must record) — folder \`games/audio/konkani/\`

### Greetings (new "Say It in Konkani" game) — please check my spelling and meaning first
| File | Say this | Meaning |
|---|---|---|
${greet.map(([k, w, en]) => row(k + '.mp3', `**${w}**`, en)).join('\n')}

If a phrase is wrong, tell Claude the right Romi Konkani spelling. The file name follows the spelling.

### Numbers, colours and animals (Konkani Corner game)
| File | Say this | Meaning |
|---|---|---|
${konNums.map(([w, n]) => row(w + '.mp3', `**${w}**`, n)).join('\n')}
${konCols.map(([w, c]) => row(w + '.mp3', `**${w}**`, c)).join('\n')}
${konAnimals.map(([w, a]) => row(w + '.mp3', `**${w}**`, a)).join('\n')}

## Part 2: Goan names (strongly recommended) — folder \`games/audio/goa/\`
Just the name, said the Goan way. Used in the map, villages, festivals and railway games.

| File | Say this |
|---|---|
${names.map(n => `| \`${slug(n)}.mp3\` | ${n} |`).join('\n')}

## Part 3: Whole sentences (optional, makes it feel like your channel) — folder \`games/audio/say/\`
Any sentence the games say can be replaced by your recording. The file name is the sentence in lower case
with dashes, cut to 70 letters. Here are the Discover Goa sentences, with their file names:

| File | Say this |
|---|---|
${uniq(sentences).map(s => `| \`${slug(s)}.mp3\` | ${s} |`).join('\n')}

Total: ${greet.length + konNums.length + konCols.length + konAnimals.length} Konkani, ${names.length} names, ${uniq(sentences).length} sentences.
`;
writeFileSync(new URL('../games/audio/VOICEOVERS.md', import.meta.url), md);
console.log(`Konkani ${greet.length + konNums.length + konCols.length + konAnimals.length}, names ${names.length}, sentences ${uniq(sentences).length}`);
