// Bible Stories: picture stories read by Tara, plus games that teach them, Goan Catholic life and prayers.
// Stories are simple retellings for ages 3–6, told gently (nothing frightening). Short verses use common wording
// with references. Prayers are the traditional English texts. Konkani prayers play only if the owner records them
// (audio/konkani/prayer-*.mp3) — the owner will supply the Konkani text.
import { h, rnd, pick, shuffle, sample, sleep, em, numOpts, freshPicker, range } from '../util.js';
import { choice, drag, tapOrder, numNode } from '../engine.js';
import { sfx, hasClip } from '../audio.js';

const tag = (icon, text) => h('span', { class: 'gtag' }, h('span', { class: 'gi' }, icon), h('b', {}, text));
const opt = x => (typeof x === 'string' && x.length <= 6 ? em(x, 'xl') : tag(x[0], x[1]));
/** Wait for a tap on a button; resolves false if the child leaves the game. */
const waitTap = (ctx, btn) => new Promise(res => { btn.addEventListener('click', () => { sfx.tap(); res(true); }, { once: true }); const t = setInterval(() => { if (!ctx.alive()) { clearInterval(t); res(false); } }, 400); btn.addEventListener('click', () => clearInterval(t), { once: true }); });

/* ---------- picture scenes: [emoji, x%, y%, size(1–3), what Tara says when tapped] ---------- */
function scene(bg, items, extra = '') {
  const s = h('div', { class: 'bscene bg-' + bg, html: extra });
  for (const [e, x, y, z = 2, say] of items) {
    const it = h('button', { class: 'bitem z' + z, style: `left:${x}%;top:${y}%`, 'aria-label': say || 'picture' }, e);
    it.addEventListener('click', () => { it.classList.remove('boing'); void it.offsetWidth; it.classList.add('boing'); sfx.pop(); if (say && it.closest('.board')?.__ctx?.alive()) it.closest('.board').__ctx.say(say); });
    s.append(it);
  }
  return s;
}

/* ================= The stories (13) ================= */
export const STORIES = [
  { k: 'creation', title: 'God Makes the World', icon: '🌍', ref: 'Genesis 1–2', pages: [
    { bg: 'night', c: 'Darkness, then light', t: 'In the beginning, everything was dark and empty. Then God said, "Let there be light!" And there was light.', i: [['✨', 50, 40, 3, 'Light!'], ['🌑', 20, 20, 1]] },
    { bg: 'sky', c: 'Sky, sea and land', t: 'God made the blue sky above and the seas below. Then dry land appeared, with grass, flowers and trees.', i: [['☁️', 25, 15, 2, 'The sky'], ['🌊', 30, 70, 3, 'The sea'], ['🌳', 70, 58, 3, 'A tree'], ['🌻', 85, 70, 2, 'A flower']] },
    { bg: 'sky', c: 'Sun, moon and stars', t: 'God made the sun to shine in the day, and the moon and stars for the night.', i: [['☀️', 25, 22, 3, 'The sun'], ['🌙', 72, 22, 3, 'The moon'], ['⭐', 55, 12, 1, 'A star'], ['⭐', 88, 40, 1, 'Another star']] },
    { bg: 'sea', c: 'Fish and birds', t: 'God filled the sea with fish and the sky with birds. Splash! Tweet tweet!', i: [['🐟', 30, 72, 2, 'Splash!'], ['🐋', 68, 75, 3, 'A whale!'], ['🐦', 35, 20, 2, 'Tweet tweet!'], ['🦜', 72, 26, 2, 'A parrot!']] },
    { bg: 'grass', c: 'Animals and people', t: 'God made the animals, and then God made people. God looked at everything and said, "It is very good!" On the seventh day, God rested.', i: [['🦁', 20, 55, 3, 'Roar!'], ['🐘', 50, 55, 3, 'An elephant'], ['🐇', 80, 68, 2, 'Hop hop'], ['👫', 50, 82, 2, 'People']] },
  ], q: [{ p: 'What did God make first?', ok: '✨', no: ['🐘', '🍕'] }, { p: 'What did God do on the seventh day?', ok: ['😴', 'Rested'], no: [['🏃', 'Ran a race'], ['🍳', 'Cooked']] }] },

  { k: 'noah', title: "Noah's Ark", icon: '🌈', ref: 'Genesis 6–9', pages: [
    { bg: 'grass', c: 'Noah builds a boat', t: 'Noah loved God. God told Noah to build a very big boat called an ark. Bang, bang, bang went the hammer!', i: [['👴', 30, 58, 3, 'Noah'], ['🔨', 55, 60, 2, 'Bang bang!'], ['🪵', 75, 72, 2, 'Wood for the ark']] },
    { bg: 'grass', c: 'Two by two', t: 'Then the animals came, two by two. Two giraffes, two elephants, two lions, and many more!', i: [['🦒', 15, 55, 3, 'Two giraffes'], ['🦒', 28, 55, 3], ['🐘', 52, 62, 3, 'Two elephants'], ['🐘', 68, 62, 3], ['🦁', 85, 74, 2, 'Two lions']] },
    { bg: 'rain', c: 'Rain, rain, rain', t: 'Then it rained and rained for forty days and forty nights. The ark floated safely on the water, with everyone cosy inside.', i: [['🌧️', 25, 15, 3, 'Pitter patter'], ['🌧️', 70, 12, 2], ['ark', 50, 62, 3, 'The ark is safe']] },
    { bg: 'sky', c: 'The dove', t: 'Noah sent out a dove. It came back with an olive leaf in its beak. The land was dry again!', i: [['🕊️', 45, 30, 3, 'Coo coo!'], ['🌿', 62, 40, 2, 'An olive leaf']] },
    { bg: 'rainbow', c: 'The rainbow', t: "God put a rainbow in the sky. It was God's promise to always care for the world.", i: [['🌈', 50, 32, 3, 'A rainbow promise'], ['👴', 30, 74, 2, 'Thank you, God!'], ['🦒', 70, 72, 2]] },
  ], q: [{ p: 'How did the animals go into the ark?', ok: ['🦒🦒', 'Two by two'], no: [['🦒', 'One by one'], ['🦒🦒🦒🦒🦒', 'Five by five']] }, { p: 'What did God put in the sky as a promise?', ok: '🌈', no: ['🚀', '🎈'] }] },

  { k: 'abraham', title: "Abraham's Stars", icon: '⭐', ref: 'Genesis 15, 21', pages: [
    { bg: 'desert', c: 'Living in tents', t: 'Abraham and Sarah lived in tents. They loved God, and they wished for a family.', i: [['👴', 30, 60, 3, 'Abraham'], ['👵', 50, 62, 3, 'Sarah'], ['⛺', 76, 58, 3, 'Their tent']] },
    { bg: 'night', c: 'Count the stars', t: 'One night God said, "Look up at the sky. Can you count the stars?" There were too many to count!', i: [['⭐', 15, 15, 1, 'One'], ['⭐', 35, 25, 2, 'Two'], ['⭐', 55, 10, 1, 'Three'], ['⭐', 75, 22, 2, 'Four'], ['⭐', 88, 40, 1, 'Five'], ['👴', 45, 75, 2, 'Abraham looks up']] },
    { bg: 'night', c: 'A big promise', t: 'God promised Abraham a family as big as all the stars in the sky. Abraham trusted God.', i: [['✨', 50, 25, 3, 'So many stars!'], ['🙏', 50, 72, 2, 'Abraham trusted God']] },
    { bg: 'desert', c: 'Baby Isaac', t: 'When they were old, Abraham and Sarah had a baby boy called Isaac. Sarah laughed with joy!', i: [['👶', 50, 55, 3, 'Baby Isaac'], ['😄', 70, 40, 2, 'Ha ha ha!']] },
  ], q: [{ p: 'What did Abraham look at in the sky?', ok: '⭐', no: ['🚁', '🦇'] }, { p: 'What was the baby called?', ok: ['👶', 'Isaac'], no: [['🧔', 'Goliath'], ['🐋', 'Jonah']] }] },

  { k: 'joseph', title: "Joseph's Colourful Coat", icon: '🧥', ref: 'Genesis 37–45', pages: [
    { bg: 'grass', c: 'A special coat', t: 'Jacob gave his son Joseph a beautiful coat of many colours.', i: [['👦', 40, 58, 3, 'Joseph'], ['🧥', 65, 58, 3, 'Red, blue, yellow, green!']] },
    { bg: 'desert', c: 'Jealous brothers', t: "Joseph's brothers were jealous. They sent him far away to Egypt.", i: [['👬', 30, 60, 3, 'The brothers'], ['🐫', 70, 62, 3, 'A long way to Egypt']] },
    { bg: 'desert', c: "The king's helper", t: 'In Egypt, God helped Joseph. He became a great helper to the king.', i: [['👑', 50, 30, 3, 'The king'], ['🏛️', 30, 60, 3, 'Egypt'], ['👦', 70, 65, 2, 'Joseph helps']] },
    { bg: 'grass', c: 'Food for everyone', t: 'Joseph saved lots of food. When there was no food in the land, he could feed everyone, even his brothers.', i: [['🌾', 25, 60, 3, 'Grain'], ['🍞', 55, 62, 3, 'Bread'], ['🌾', 80, 60, 2]] },
    { bg: 'grass', c: 'A big hug', t: 'Joseph forgave his brothers and gave them a big hug. The family was together again.', i: [['🤗', 50, 50, 3, 'I forgive you!'], ['❤️', 72, 30, 2]] },
  ], q: [{ p: 'What did Jacob give Joseph?', ok: '🧥', no: ['🚲', '🎮'] }, { p: 'What did Joseph do at the end?', ok: ['🤗', 'He forgave them'], no: [['😠', 'He shouted'], ['🏃', 'He ran away']] }] },

  { k: 'moses', title: 'Baby Moses', icon: '🧺', ref: 'Exodus 2', pages: [
    { bg: 'grass', c: 'A basket boat', t: "Baby Moses' mother wanted to keep him safe. She made a little basket that could float like a boat.", i: [['👩', 35, 58, 3, "Moses' mother"], ['👶', 55, 62, 2, 'Baby Moses'], ['🧺', 72, 66, 2, 'A basket boat']] },
    { bg: 'river', c: 'In the reeds', t: 'She put baby Moses in the basket among the tall reeds by the river. His big sister Miriam watched over him.', i: [['🧺', 50, 66, 3, 'Floating gently'], ['🌾', 25, 55, 3, 'Tall reeds'], ['👧', 82, 45, 2, 'Miriam is watching']] },
    { bg: 'river', c: 'The princess', t: 'A princess came down to the river. She saw the basket and heard the baby crying.', i: [['👸', 30, 42, 3, 'The princess'], ['🧺', 62, 68, 2, 'Waa waa!']] },
    { bg: 'grass', c: 'Safe and loved', t: 'The princess loved baby Moses and looked after him. God kept Moses safe.', i: [['👸', 40, 55, 3], ['👶', 58, 60, 2, 'Safe and happy'], ['💖', 70, 30, 2]] },
  ], q: [{ p: 'Where did baby Moses float on the river?', ok: '🧺', no: ['🛏️', '🚗'] }, { p: 'Who found baby Moses?', ok: '👸', no: ['🦖', '🤖'] }] },

  { k: 'david', title: 'David and Goliath', icon: '🪨', ref: '1 Samuel 17', pages: [
    { bg: 'grass', c: 'A shepherd boy', t: 'David was a shepherd boy who looked after his sheep. He loved God very much.', i: [['👦', 35, 58, 3, 'David'], ['🐑', 60, 66, 2, 'Baa!'], ['🐑', 78, 70, 2, 'Baa baa!']] },
    { bg: 'desert', c: 'A giant soldier', t: 'A giant soldier called Goliath frightened everyone. Nobody was brave enough to face him.', i: [['🛡️', 62, 50, 3, 'Goliath is very big'], ['⚔️', 80, 38, 2]] },
    { bg: 'river', c: 'Five smooth stones', t: 'David said, "God will help me." He picked five smooth stones from the stream.', i: [['🪨', 30, 70, 2, 'One'], ['🪨', 42, 74, 1, 'Two'], ['🪨', 54, 70, 2, 'Three'], ['🪨', 66, 74, 1, 'Four'], ['🪨', 78, 70, 2, 'Five']] },
    { bg: 'desert', c: 'The giant falls', t: 'David swung his sling, and the giant fell down with a bump! Everyone cheered.', i: [['👦', 30, 58, 3, 'Brave David'], ['🎉', 65, 35, 3, 'Hooray!']] },
    { bg: 'grass', c: 'King David', t: 'David grew up to be a king. He always remembered that God makes us brave.', i: [['👑', 50, 40, 3, 'King David'], ['🎶', 75, 28, 2, 'David loved to sing to God']] },
  ], q: [{ p: 'How many stones did David pick?', ok: ['5️⃣', 'Five'], no: [['2️⃣', 'Two'], ['🔟', 'Ten']] }, { p: 'Who helped David to be brave?', ok: ['❤️', 'God'], no: [['🦖', 'A dinosaur'], ['🤖', 'A robot']] }] },

  { k: 'daniel', title: 'Daniel and the Lions', icon: '🦁', ref: 'Daniel 6', pages: [
    { bg: 'sky', c: 'Daniel prays', t: 'Daniel prayed to God three times every day, by his window.', i: [['🙏', 45, 55, 3, 'Daniel prays'], ['🪟', 72, 40, 3, 'His window']] },
    { bg: 'desert', c: 'A bad rule', t: 'Some men tricked the king into making a rule: no praying to God! But Daniel kept on praying.', i: [['👑', 30, 45, 3, 'The king'], ['📜', 65, 55, 3, 'The new rule']] },
    { bg: 'night', c: 'In the lions’ den', t: "Daniel was put in a den of lions. But God sent an angel to shut the lions' mouths.", i: [['🦁', 25, 66, 3, 'Shh, quiet lion'], ['🦁', 75, 66, 3, 'Sleepy lion'], ['😇', 50, 30, 3, 'An angel']] },
    { bg: 'sunrise', c: 'Daniel is safe', t: 'In the morning, the king ran to the den. Daniel was safe! The king was so happy.', i: [['😊', 45, 55, 3, 'Daniel is safe!'], ['👑', 72, 45, 2, 'Hooray!']] },
  ], q: [{ p: 'Who kept Daniel safe from the lions?', ok: '😇', no: ['🐊', '👻'] }, { p: 'How many times a day did Daniel pray?', ok: ['3️⃣', 'Three'], no: [['🔟', 'Ten'], ['0️⃣', 'Never']] }] },

  { k: 'jonah', title: 'Jonah and the Big Fish', icon: '🐋', ref: 'Jonah 1–3', pages: [
    { bg: 'sea', c: 'Jonah runs away', t: 'God asked Jonah to go to the city of Nineveh. But Jonah ran away on a ship instead.', i: [['👨', 30, 45, 3, 'Jonah'], ['⛵', 65, 58, 3, 'Off he sails']] },
    { bg: 'storm', c: 'A big storm', t: 'A big storm came! The sailors were scared. Jonah said, "It is my fault. Put me into the sea."', i: [['⛈️', 30, 15, 3, 'Boom!'], ['🌊', 60, 70, 3, 'Big waves'], ['⛵', 50, 52, 2]] },
    { bg: 'sea', c: 'Inside the fish', t: 'God sent a huge fish to swallow Jonah. Jonah stayed inside for three days and prayed.', i: [['🐋', 50, 60, 3, 'A huge fish'], ['🙏', 50, 32, 2, 'Jonah prays']] },
    { bg: 'beach', c: 'On the beach', t: 'The fish put Jonah back on the beach. This time, Jonah went to Nineveh.', i: [['🏖️', 40, 62, 3, 'Dry land!'], ['🚶', 70, 55, 2, 'Off to Nineveh']] },
    { bg: 'sky', c: 'God forgives', t: 'The people of Nineveh said sorry to God, and God forgave them.', i: [['🏙️', 45, 55, 3, 'Nineveh'], ['❤️', 72, 28, 2, 'God forgives']] },
  ], q: [{ p: 'What swallowed Jonah?', ok: '🐋', no: ['🐈', '🦆'] }, { p: 'How many days was Jonah inside the fish?', ok: ['3️⃣', 'Three'], no: [['1️⃣', 'One'], ['🔟', 'Ten']] }] },

  { k: 'nativity', title: 'Jesus Is Born', icon: '⭐', ref: 'Luke 2, Matthew 2', pages: [
    { bg: 'desert', c: 'A long journey', t: 'Mary and Joseph went on a long journey to Bethlehem. Mary rode on a donkey.', i: [['👩', 40, 52, 3, 'Mary'], ['🫏', 40, 72, 3, 'Clip clop'], ['👨', 68, 58, 3, 'Joseph']] },
    { bg: 'night', c: 'No room at the inn', t: 'There was no room at the inn, so they stayed in a stable with the animals.', i: [['🏠', 30, 55, 3, 'The inn is full'], ['🐄', 62, 66, 2, 'Moo'], ['🐑', 80, 70, 2, 'Baa']] },
    { bg: 'stable', c: 'Baby Jesus', t: 'Baby Jesus was born! Mary wrapped him up warmly and laid him in a manger.', i: [['👶', 50, 62, 3, 'Baby Jesus'], ['⭐', 50, 14, 3, 'A bright star'], ['👩', 28, 55, 2], ['👨', 72, 55, 2]] },
    { bg: 'night', c: 'The shepherds', t: 'Angels told the shepherds the good news. The shepherds hurried to see the baby.', i: [['😇', 50, 25, 3, 'Good news!'], ['🧑‍🌾', 30, 66, 2, 'A shepherd'], ['🐑', 70, 70, 2]] },
    { bg: 'night', c: 'The wise men', t: 'Wise men followed a bright star. They brought gifts of gold, frankincense and myrrh.', i: [['⭐', 50, 14, 3, 'Follow the star'], ['👑', 25, 62, 2, 'A wise man'], ['👑', 50, 66, 2], ['👑', 75, 62, 2], ['🎁', 50, 84, 1, 'Gifts for Jesus']] },
  ], q: [{ p: 'Where did Mary lay baby Jesus?', ok: ['🌾', 'In a manger'], no: [['🏰', 'In a castle'], ['🚗', 'In a car']] }, { p: 'What did the wise men follow?', ok: '⭐', no: ['🚦', '🎈'] }] },

  { k: 'storm', title: 'Jesus Calms the Storm', icon: '⛵', ref: 'Mark 4', pages: [
    { bg: 'sea', c: 'A sleepy boat trip', t: 'Jesus and his friends got into a boat to cross the lake. Jesus was tired, and fell asleep.', i: [['⛵', 50, 55, 3, 'Across the lake'], ['😴', 50, 30, 2, 'Zzz']] },
    { bg: 'storm', c: 'Big waves', t: 'A big storm came! Waves splashed into the boat. His friends were scared.', i: [['⛈️', 30, 14, 3, 'Boom!'], ['🌊', 65, 70, 3, 'Splash!'], ['😨', 45, 45, 2, 'Help!']] },
    { bg: 'storm', c: '"Be still!"', t: 'They woke Jesus up. Jesus said to the wind and the waves, "Peace! Be still!"', i: [['🙌', 50, 45, 3, 'Peace! Be still!']] },
    { bg: 'sky', c: 'All calm', t: 'Everything became calm. His friends said, "Even the wind and waves do what he says!"', i: [['☀️', 30, 20, 3, 'Sunshine'], ['⛵', 60, 62, 3, 'A calm sea']] },
  ], q: [{ p: 'What was Jesus doing when the storm started?', ok: '😴', no: ['🏊', '🎤'] }, { p: 'What did the sea become when Jesus spoke?', ok: ['☀️', 'Calm'], no: [['⛈️', 'Stormier'], ['❄️', 'Frozen']] }] },

  { k: 'sheep', title: 'The Lost Sheep', icon: '🐑', ref: 'Luke 15', pages: [
    { bg: 'grass', c: 'One hundred sheep', t: 'A shepherd had one hundred sheep. He counted them every day.', i: [['🧑‍🌾', 25, 55, 3, 'The shepherd'], ['🐑', 55, 62, 2, 'Baa'], ['🐑', 70, 70, 2], ['🐑', 85, 62, 2]] },
    { bg: 'grass', c: 'One is missing', t: 'One day, one sheep was missing! Only ninety-nine were there.', i: [['🐑', 40, 62, 2], ['🐑', 60, 66, 2], ['❓', 80, 40, 3, 'Where is it?']] },
    { bg: 'hills', c: 'Searching everywhere', t: 'The shepherd searched everywhere, over the hills and behind the rocks.', i: [['🔎', 30, 45, 3, 'Looking, looking'], ['🪨', 60, 66, 3, 'Not here'], ['🌳', 80, 55, 3, 'Not here']] },
    { bg: 'hills', c: 'Found it!', t: 'He found the little lost sheep! He carried it home on his shoulders, so happy.', i: [['🐑', 50, 50, 3, 'Found you!'], ['❤️', 70, 28, 2]] },
    { bg: 'grass', c: 'God loves everyone', t: 'Jesus said God loves each one of us, just like that shepherd loves every single sheep.', i: [['🎉', 50, 40, 3, 'Hooray!'], ['🐑', 30, 70, 2], ['🐑', 70, 70, 2]] },
  ], q: [{ p: 'How many sheep did the shepherd have?', ok: ['💯', 'One hundred'], no: [['2️⃣', 'Two'], ['5️⃣', 'Five']] }, { p: 'How did the shepherd feel when he found the sheep?', ok: '😃', no: ['😡', '😴'] }] },

  { k: 'samaritan', title: 'The Good Samaritan', icon: '🩹', ref: 'Luke 10', pages: [
    { bg: 'desert', c: 'Hurt on the road', t: 'A man was walking on a long road. Robbers took his things and left him hurt by the road.', i: [['🚶', 45, 58, 3, 'A traveller'], ['🛣️', 70, 75, 2]] },
    { bg: 'desert', c: 'Nobody stops', t: 'Two people walked past, and did not stop to help him.', i: [['🚶‍♂️', 30, 55, 3, 'He walks by'], ['🚶‍♀️', 70, 55, 3, 'She walks by']] },
    { bg: 'desert', c: 'A kind man', t: 'Then a man from Samaria stopped. He cleaned the cuts and put on bandages.', i: [['🫏', 30, 62, 3, 'The Samaritan’s donkey'], ['🩹', 62, 50, 3, 'Bandages']] },
    { bg: 'sky', c: 'Rest at the inn', t: 'He took the man to an inn and paid for him to rest and get better.', i: [['🏠', 45, 55, 3, 'The inn'], ['🪙', 70, 65, 2, 'He paid for him']] },
    { bg: 'grass', c: 'Be kind', t: 'Jesus said: be like the kind Samaritan. Help anyone who needs you.', i: [['🤝', 50, 45, 3, 'Help each other'], ['❤️', 72, 25, 2]] },
  ], q: [{ p: 'Who stopped to help the hurt man?', ok: ['🫏', 'The Samaritan'], no: [['🚶‍♂️', 'Nobody'], ['🦈', 'A shark']] }, { p: 'What does Jesus want us to do?', ok: ['🤝', 'Help others'], no: [['🙈', 'Look away'], ['😠', 'Be grumpy']] }] },

  { k: 'easter', title: 'Easter: Jesus Is Alive!', icon: '🐣', ref: 'Luke 19–24', pages: [
    { bg: 'sky', c: 'Palm Sunday', t: 'Jesus rode into Jerusalem on a donkey. People waved palm branches and sang, "Hosanna!"', i: [['🫏', 45, 62, 3, 'Clip clop'], ['🌴', 20, 50, 3, 'Hosanna!'], ['🌴', 80, 50, 3, 'Hosanna!']] },
    { bg: 'night', c: 'A special meal', t: 'Jesus shared a special meal with his friends. He broke the bread and shared it with them.', i: [['🍞', 50, 55, 3, 'Sharing bread'], ['🕯️', 25, 45, 2], ['🕯️', 75, 45, 2]] },
    { bg: 'night', c: 'A sad day', t: 'Then Jesus died on a cross. His friends were very sad. They put him in a tomb in a garden.', i: [['✝️', 50, 40, 3, 'Jesus loves us'], ['🪨', 75, 70, 2, 'The tomb']] },
    { bg: 'sunrise', c: 'The stone is rolled away', t: 'On Sunday morning, his friends found the big stone rolled away. The tomb was empty!', i: [['🌅', 30, 25, 3, 'Sunrise'], ['🪨', 65, 66, 3, 'Rolled away!']] },
    { bg: 'rainbow', c: 'Jesus is alive', t: 'Jesus is alive! He rose again. That is why we celebrate Easter with joy.', i: [['😇', 50, 35, 3, 'Jesus is alive!'], ['🐣', 25, 72, 2, 'New life'], ['🌸', 75, 72, 2]] },
  ], q: [{ p: 'What did people wave when Jesus rode in?', ok: '🌴', no: ['🏳️', '🎈'] }, { p: 'What do we celebrate at Easter?', ok: ['🎉', 'Jesus is alive'], no: [['🎂', 'A birthday'], ['🎃', 'Halloween']] }] },
];

const ARK = `<svg viewBox="0 0 200 110" class="arksvg"><path d="M10 60 h180 l-25 40 h-130 z" fill="#8D5A3B" stroke="#5D3A24" stroke-width="4"/><rect x="55" y="25" width="90" height="35" fill="#B07A52" stroke="#5D3A24" stroke-width="4"/><path d="M45 25 l55 -20 l55 20 z" fill="#B5442E"/><rect x="92" y="36" width="16" height="24" fill="#5D3A24"/><g fill="#FDFBF3"><rect x="65" y="34" width="14" height="10"/><rect x="121" y="34" width="14" height="10"/></g></svg>`;
function storyScene(pg) {
  const items = pg.i.filter(x => x[0] !== 'ark');
  const ark = pg.i.find(x => x[0] === 'ark');
  const s = scene(pg.bg, items);
  if (ark) s.append(h('div', { class: 'bitem z3 arkwrap', style: `left:${ark[1]}%;top:${ark[2]}%`, html: ARK }));
  return s;
}

export const stories = {
  id: 'stories', title: 'Bible Story Time', icon: '📖', cat: 'bible', minBand: 1, color: '#7E57C2',
  desc: 'Picture Bible stories read by Tara. Tap the pictures, then answer two questions!',
  stages: STORIES.map(s => s.title),
  start: [0, 1, 2],
  async board(ctx) {
    const st = STORIES[ctx.stage], b = ctx.board; b.__ctx = ctx;
    for (let i = 0; i < st.pages.length; i++) {
      if (!ctx.alive()) return;
      const pg = st.pages[i], last = i === st.pages.length - 1;
      b.innerHTML = '';
      const next = h('button', { class: 'btn big' + (last ? ' sun' : '') }, last ? 'Questions ⭐' : 'Next ▶');
      b.append(h('div', { class: 'bookhead' }, h('b', {}, `${st.icon} ${st.title}`), h('small', {}, `${st.ref} · page ${i + 1} of ${st.pages.length}`)),
        storyScene(pg), h('p', { class: 'storytext' }, pg.t),
        h('div', { class: 'row gap center' }, h('button', { class: 'btn ghost', onclick: () => ctx.say(pg.t) }, '🔊 Read again'), next));
      b.__ctx = ctx;
      ctx.say(pg.t);
      if (!(await waitTap(ctx, next))) return;
    }
    for (const q of st.q) {
      if (!ctx.alive()) return;
      await choice(ctx, { prompt: q.p, options: shuffle([{ node: opt(q.ok), ok: true }, ...q.no.map(n => ({ node: opt(n), ok: false }))]), cols: 3, after: pick(['Well remembered!', 'Yes, that is right!', 'You listened so well!']) });
    }
    if (ctx.alive()) await ctx.say(`Well done! You finished the story of ${st.title.replace(/:.*$/, '')}.`);
  },
};

/* ================= 2. Noah's Ark, 2 by 2 ================= */
const PAIRS = [['🦒', 'giraffes'], ['🐘', 'elephants'], ['🦁', 'lions'], ['🐒', 'monkeys'], ['🐧', 'penguins'], ['🦓', 'zebras'], ['🐢', 'turtles'], ['🐄', 'cows'], ['🐑', 'sheep'], ['🦘', 'kangaroos']];
const RAINBOW = [['red', '#E53935'], ['orange', '#FB8C00'], ['yellow', '#FDD835'], ['green', '#43A047'], ['blue', '#1E88E5'], ['indigo', '#3949AB'], ['violet', '#8E24AA']];
export const noah = {
  id: 'noah', title: "Noah's Ark", icon: '🌈', cat: 'bible', minBand: 1, color: '#43A047',
  desc: 'Lead the animals into the ark two by two, count in twos and build the rainbow!',
  stages: ['Two by two', 'How many animals?', 'Count in twos', 'Rainbow promise'],
  start: [0, 0, 1],
  roundsFor: s => (s === 3 ? 2 : 3),
  question(ctx) {
    const st = ctx.stage;
    if (st === 0) {
      const set = sample(PAIRS, ctx.band + 1);
      const scenes = h('div', { class: 'arkscene' }, h('div', { class: 'arkpic', html: ARK }),
        h('div', { class: 'arkrooms' }, set.map(([e, n]) => h('div', { class: 'arkroom', 'data-key': n }, h('span', { class: 'ghost' }, e), h('div', { class: 'slot' })))));
      return drag(ctx, { prompt: 'Two by two! Lead each animal into its room in the ark.', scene: scenes,
        items: set.flatMap(([e, n]) => [0, 1].map(() => ({ key: n, node: h('span', { class: 'animal' }, e), say: n, hint: `That room is for other animals. Find the ${n} room!` }))) }).then(async () => { await ctx.say('Everyone is safe in the ark!'); return true; });
    }
    if (st === 1) {
      const k = rnd(2, ctx.band >= 3 ? 6 : 4), set = sample(PAIRS, k);
      return choice(ctx, { prompt: `${k} pairs of animals. Count in twos: how many animals are there?`, show: h('div', { class: 'pairrow' }, set.map(([e]) => h('span', { class: 'pair' }, e, e))),
        options: numOpts(k * 2, 2, 14).map(v => ({ node: numNode(v), ok: v === k * 2 })), cols: 3, after: `${range(1, k).map(i => i * 2).join(', ')}. ${k * 2} animals!` });
    }
    if (st === 2) {
      const n = ctx.band >= 3 ? 6 : 5;
      return tapOrder(ctx, { prompt: "Count in twos, like Noah's animals! Tap 2, 4, 6…", lineClass: 'tt', items: range(1, n).map(i => ({ order: i, node: numNode(i * 2) })) })
        .then(async () => { await ctx.say(`${range(1, n).map(i => i * 2).join(', ')}! Brilliant counting in twos.`); return true; });
    }
    return tapOrder(ctx, { prompt: "Build God's rainbow! Tap the colours in order: red first, then orange…",
      items: RAINBOW.map(([n, c], i) => ({ order: i, node: h('span', { class: 'rbw' }, h('i', { style: `background:${c}` }), h('b', {}, n)) })) })
      .then(async () => { await ctx.say('Red, orange, yellow, green, blue, indigo, violet. A rainbow promise!'); return true; });
  },
};

/* ================= 3. Seven Days of Creation ================= */
const DAYS = [['✨', 'Light'], ['☁️', 'Sky and sea'], ['🌳', 'Land and plants'], ['☀️', 'Sun, moon and stars'], ['🐟', 'Fish and birds'], ['🦁', 'Animals and people'], ['😴', 'God rested']];
const dayCard = (i, label = true) => h('span', { class: 'gtag col' }, h('span', { class: 'gi' }, DAYS[i][0]), h('b', {}, DAYS[i][1]), label ? h('small', {}, `Day ${i + 1}`) : null);
export const creation = {
  id: 'creation', title: 'Seven Days of Creation', icon: '🌍', cat: 'bible', minBand: 1, color: '#1E88E5',
  desc: 'Put the days of creation in order: light, sky, land, sun, fish, animals, rest.',
  stages: ['Days 1 to 3', 'Days 4 to 7', 'All 7 days', 'What was made?'],
  start: [0, 0, 1],
  roundsFor: s => (s === 3 ? 5 : 2),
  question(ctx) {
    const st = ctx.stage;
    if (st < 3) {
      const idx = st === 0 ? [0, 1, 2] : st === 1 ? [3, 4, 5, 6] : range(0, 6);
      return tapOrder(ctx, { prompt: st === 2 ? 'Put all seven days in order, starting with light!' : `What did God make first? Tap the days in order.`, items: idx.map(i => ({ order: i, node: dayCard(i, false) })) })
        .then(async () => { await ctx.say(idx.map(i => `Day ${i + 1}, ${DAYS[i][1].toLowerCase()}`).join('. ') + '.'); return true; });
    }
    const d = rnd(0, 6), opts = shuffle([d, ...sample(range(0, 6).filter(x => x !== d), 2)]);
    return choice(ctx, { prompt: d === 6 ? 'What did God do on day 7?' : `What did God make on day ${d + 1}?`, options: opts.map(i => ({ node: dayCard(i, false), ok: i === d })), cols: 3, after: `Day ${d + 1}: ${DAYS[d][1]}.` });
  },
};

/* ================= 4. The Lost Sheep ================= */
const HIDES = ['🌳', '🪨', '🌿', '🌲', '🪵', '🌾', '🏞️'];
export const lostsheep = {
  id: 'lostsheep', title: 'The Lost Sheep', icon: '🐑', cat: 'bible', minBand: 1, color: '#8BC34A',
  desc: 'Help the shepherd find the lost sheep, then count the flock!',
  stages: ['3 hiding places', '5 hiding places', '7 hiding places', 'Count the sheep'],
  start: [0, 1, 1],
  roundsFor: s => (s === 3 ? 5 : 3),
  question(ctx) {
    const st = ctx.stage;
    if (st === 3) {
      const n = rnd(3, ctx.band >= 3 ? 12 : 8);
      return choice(ctx, { prompt: 'The shepherd counts his sheep. How many sheep are there?', show: h('div', { class: 'flock' }, range(1, n).map(() => h('span', {}, '🐑'))),
        options: numOpts(n, 1, 14).map(v => ({ node: numNode(v), ok: v === n })), cols: 3, after: `${n} sheep, all safe!` });
    }
    const n = [3, 5, 7][st], at = rnd(0, n - 1), spots = shuffle([[12, 30], [45, 22], [78, 30], [20, 65], [55, 58], [85, 66], [35, 45]]).slice(0, n);
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const s = h('div', { class: 'bscene bg-hills tall' });
      let wrong = 0, done = false;
      spots.forEach(([x, y], i) => {
        const hide = h('button', { class: 'hide', style: `left:${x}%;top:${y}%`, 'aria-label': 'hiding place' }, pick(HIDES));
        hide.addEventListener('click', async () => {
          if (done || !ctx.alive()) return;
          if (i === at) { done = true; hide.classList.add('found'); hide.textContent = '🐑'; sfx.good(); await ctx.good(hide); await ctx.say(pick(['Found you, little sheep!', 'There you are! Baa!', 'The lost sheep is found!'])); res(wrong === 0); }
          else { wrong++; ctx.mistake(); hide.classList.add('nothere'); sfx.bad(); ctx.say(pick(['Not here!', 'Keep looking!', 'Nothing here. Try another place!'])); }
        });
        s.append(hide);
      });
      s.append(h('span', { class: 'bitem z3', style: 'left:8%;top:78%' }, '🧑‍🌾'));
      b.append(s);
      ctx.say(ctx.round === 0 ? 'Oh no, a sheep is lost! Tap the hiding places to find it.' : 'Another sheep is hiding! Can you find it?');
    });
  },
};

/* ================= 5. Five Loaves and Two Fish ================= */
export const loaves = {
  id: 'loaves', title: 'Five Loaves and Two Fish', icon: '🍞', cat: 'bible', minBand: 2, color: '#E9A23B',
  desc: 'Jesus fed a huge crowd with five loaves and two fish. Count, add and share the food!',
  stages: ['Count the food', 'Add it up', 'Share it out', 'Twelve baskets left'],
  start: [0, 0, 1],
  roundsFor: s => (s === 3 ? 3 : 4),
  question(ctx) {
    const st = ctx.stage;
    if (st === 0) {
      const what = pick([['🍞', 'loaves of bread'], ['🐟', 'fish']]), n = rnd(2, ctx.band >= 3 ? 9 : 6);
      return choice(ctx, { prompt: `How many ${what[1]}?`, show: h('div', { class: 'flock' }, range(1, n).map(() => h('span', {}, what[0]))), options: numOpts(n, 1, 10).map(v => ({ node: numNode(v), ok: v === n })), cols: 3, after: `${n} ${what[1]}!` });
    }
    if (st === 1) {
      const a = ctx.round === 0 ? 5 : rnd(2, 6), c = ctx.round === 0 ? 2 : rnd(1, 4);
      return choice(ctx, { prompt: `${a} loaves and ${c} fish. How many altogether?`, show: h('div', { class: 'flock' }, range(1, a).map(() => h('span', {}, '🍞')), h('b', { class: 'plus' }, '+'), range(1, c).map(() => h('span', {}, '🐟'))),
        options: numOpts(a + c, 2, 12).map(v => ({ node: numNode(v), ok: v === a + c })), cols: 3, after: `${a} and ${c} make ${a + c}.` });
    }
    if (st === 2) {
      const k = rnd(2, 3), each = rnd(1, ctx.band >= 3 ? 4 : 3), n = k * each;
      return new Promise(res => {
        const b = ctx.board; b.innerHTML = '';
        const pile = h('div', { class: 'basket' });
        const baskets = range(1, k).map(i => h('button', { class: 'sharebasket', 'aria-label': `Basket ${i}` }, h('div', { class: 'in' }), h('b', {}, '🧺')));
        let done = false, wrongs = 0;
        for (let i = 0; i < n; i++) pile.append(h('span', { class: 'bread' }, '🍞'));
        baskets.forEach(bk => bk.addEventListener('click', () => {
          if (done || !ctx.alive()) return;
          const l = pile.querySelector('.bread'); if (!l) return;
          bk.querySelector('.in').append(l); sfx.drop(); ctx.say(String(bk.querySelector('.in').children.length));
        }));
        b.append(h('p', { class: 'muted' }, 'Tap a basket to put a loaf in it'), pile, h('div', { class: 'sharerow' }, baskets),
          h('div', { class: 'row gap center' },
            h('button', { class: 'btn ghost', onclick: () => { if (done) return; baskets.forEach(bk => bk.querySelectorAll('.bread').forEach(x => pile.append(x))); sfx.tap(); } }, '↺ Start again'),
            h('button', { class: 'btn big sun', onclick: async () => {
              if (done || !ctx.alive()) return;
              const counts = baskets.map(bk => bk.querySelector('.in').children.length);
              if (pile.children.length) { wrongs++; ctx.bad(pile); return ctx.say('Share all the bread first!'); }
              if (counts.every(c => c === each)) { done = true; await ctx.good(b.querySelector('.sharerow')); await ctx.say(`Fair sharing! ${n} loaves, ${each} in each basket.`); res(wrongs === 0); }
              else { wrongs++; ctx.bad(b.querySelector('.sharerow')); ctx.say('Not fair yet! Every basket needs the same. Move some bread.'); }
            } }, 'Is it fair? ✓')));
        ctx.say(`Share ${n} loaves fairly into ${k} baskets. Every basket gets the same!`);
      });
    }
    const n = ctx.round === 0 ? 12 : rnd(6, 12);
    return choice(ctx, { prompt: ctx.round === 0 ? 'Everyone ate until they were full! Then the friends picked up the leftovers. How many baskets?' : 'How many baskets of leftovers now?',
      show: h('div', { class: 'flock' }, range(1, n).map(() => h('span', {}, '🧺'))), options: numOpts(n, 4, 14).map(v => ({ node: numNode(v), ok: v === n })), cols: 3,
      after: n === 12 ? 'Twelve baskets! Jesus gave more than enough.' : `${n} baskets!` });
  },
};

/* ================= 6. Joseph's Colourful Coat ================= */
const PAINT = [['red', '#E53935'], ['blue', '#1E88E5'], ['yellow', '#FDD835'], ['green', '#43A047'], ['orange', '#FB8C00'], ['purple', '#8E24AA']];
const coatSVG = (cols) => {
  const n = cols.length, top = 40, hgt = 190 / n;
  let s = `<svg viewBox="0 0 240 260" class="coat"><defs><clipPath id="coatclip"><path d="M80 20 L120 40 L160 20 L215 70 L190 105 L170 92 L175 245 L65 245 L70 92 L50 105 L25 70 Z"/></clipPath></defs><g clip-path="url(#coatclip)">`;
  cols.forEach((c, i) => { s += `<rect class="stripe" data-i="${i}" x="0" y="${top + i * hgt - (i === 0 ? 30 : 0)}" width="240" height="${hgt + (i === 0 ? 30 : 0) + 1}" fill="${c || '#FFFDF6'}"/>`; });
  return s + `</g><path d="M80 20 L120 40 L160 20 L215 70 L190 105 L170 92 L175 245 L65 245 L70 92 L50 105 L25 70 Z" fill="none" stroke="#5D3A24" stroke-width="5" stroke-linejoin="round"/></svg>`;
};
const POS = (i, n) => (i === 0 ? 'the top stripe' : i === n - 1 ? 'the bottom stripe' : n === 3 ? 'the middle stripe' : `stripe number ${i + 1}`);
export const coat = {
  id: 'coat', title: "Joseph's Colourful Coat", icon: '🧥', cat: 'bible', minBand: 1, color: '#E53935',
  desc: 'Colour Joseph’s coat of many colours. Listen carefully to each colour!',
  stages: ['3 stripes', '5 stripes', 'Copy the pattern'],
  start: [0, 0, 1],
  roundsFor: () => 2,
  question(ctx) {
    const st = ctx.stage, n = st === 0 ? 3 : 5, want = range(1, n).map(() => pick(PAINT));
    return new Promise(res => {
      const b = ctx.board; b.innerHTML = '';
      const cols = Array(n).fill(null); let sel = null, step = 0, wrong = 0, done = false;
      const view = h('div', { class: 'coatview' });
      const draw = () => { view.innerHTML = coatSVG(cols); view.querySelectorAll('.stripe').forEach(r => { if (st < 2 && +r.dataset.i === step) r.classList.add('now'); r.addEventListener('click', () => paint(+r.dataset.i)); }); };
      const swatches = h('div', { class: 'swatches' }, PAINT.map(([nm, c]) => h('button', { class: 'swatch', style: `--c:${c}`, 'aria-label': nm, onclick: e => { sel = [nm, c]; swatches.querySelectorAll('.swatch').forEach(x => x.classList.toggle('on', x === e.currentTarget)); sfx.tap(); ctx.say(nm); } })));
      const ask = () => ctx.say(st < 2 ? `Colour ${POS(step, n)} ${want[step][0]}!` : 'Make the coat look just like the little one!');
      const paint = async i => {
        if (done || !ctx.alive()) return;
        if (!sel) return ctx.say('First tap a paint colour!');
        cols[i] = sel[1]; sfx.drop(); draw();
        if (st < 2) {
          if (i !== step) { cols[i] = null; draw(); wrong++; ctx.mistake(); return ctx.say(`Oops, that is not ${POS(step, n)}. Look for the shiny stripe!`); }
          if (sel[0] !== want[step][0]) { cols[i] = null; draw(); wrong++; ctx.bad(view); return ctx.say(`That is ${sel[0]}. We need ${want[step][0]}!`); }
          step++; draw();
          if (step === n) { done = true; await ctx.good(view); await ctx.say('What a beautiful coat of many colours!'); res(wrong === 0); } else ask();
        } else if (cols.every((c, k) => c === want[k][1])) { done = true; await ctx.good(view); await ctx.say('A perfect copy! Joseph would love it.'); res(wrong === 0); }
      };
      draw();
      b.append(st === 2 ? h('div', { class: 'coatpair' }, h('div', { class: 'coatmini', html: coatSVG(want.map(w => w[1])) }), view) : view, swatches);
      ask();
    });
  },
};

/* ================= 7. Story Order ================= */
export const storyorder = {
  id: 'storyorder', title: 'Story Order', icon: '🔢', cat: 'bible', minBand: 2, color: '#5C6BC0',
  desc: 'What happened first? Put the Bible story pictures in order.',
  stages: ['3 pictures', '4 pictures', '5 pictures'],
  start: [0, 0, 1],
  roundsFor: () => 3,
  question(ctx) {
    const k = ctx.stage + 3, st = pick(STORIES.filter(s => s.pages.length >= k));
    const idx = sample(range(0, st.pages.length - 1), k).sort((a, b) => a - b);
    const card = i => { const pg = st.pages[i]; const main = pg.i.find(x => x[0] !== 'ark') || ['⛵']; return h('span', { class: 'gtag col storycard' }, h('span', { class: 'gi' }, main[0]), h('b', {}, pg.c)); };
    return tapOrder(ctx, { prompt: `${st.title}. What happened first? Tap the pictures in order.`, items: idx.map((i, o) => ({ order: o, node: card(i) })) })
      .then(async () => { await ctx.say(idx.map(i => st.pages[i].c).join('. Then, ') + '.'); return true; });
  },
};

/* ================= 8. Bible Animals: Who Am I? ================= */
const BANIMALS = [
  { p: 'I came to the ark two by two, with my very long neck. Who am I?', ok: '🦒', no: ['🐙', '🦈'], f: 'A giraffe! Noah took every kind of animal into the ark.' },
  { p: 'God shut my mouth so I could not hurt Daniel. Who am I?', ok: '🦁', no: ['🐰', '🐤'], f: 'A lion! God kept Daniel safe.' },
  { p: 'I swallowed Jonah and kept him safe for three days. Who am I?', ok: '🐋', no: ['🐌', '🐝'], f: 'A huge fish!' },
  { p: 'I brought Noah an olive leaf in my beak. Who am I?', ok: '🕊️', no: ['🦉', '🐧'], f: 'A dove! It showed the land was dry again.' },
  { p: 'Mary rode on me all the way to Bethlehem. Who am I?', ok: '🫏', no: ['🐊', '🦩'], f: 'A donkey! Clip clop.' },
  { p: 'I was lost, and the shepherd looked everywhere for me. Who am I?', ok: '🐑', no: ['🐸', '🐍'], f: 'A sheep! Jesus is the good shepherd.' },
  { p: 'Jesus fed lots of people with five loaves and two of me. Who am I?', ok: '🐟', no: ['🐔', '🦀'], f: 'A fish!' },
  { p: 'I lived in the stable when baby Jesus was born. Moo! Who am I?', ok: '🐄', no: ['🦖', '🐬'], f: 'A cow, or an ox! The animals kept baby Jesus warm.' },
  { p: 'Jesus rode on me into Jerusalem, and people waved palm branches. Who am I?', ok: '🫏', no: ['🦘', '🐘'], f: 'A donkey!' },
  { p: 'Long ago, I helped carry the wise men across the desert. Who am I?', ok: '🐫', no: ['🐧', '🦭'], f: 'A camel! Camels walk across hot deserts.' },
];
const banimalPick = freshPicker(BANIMALS);
export const banimals = {
  id: 'banimals', title: 'Bible Animals: Who Am I?', icon: '🦁', cat: 'bible', minBand: 1, color: '#FB8C00',
  desc: 'Listen to the clue and find the animal from the Bible story.',
  stages: ['Who am I?'], start: [0, 0, 0], rounds: 6,
  question(ctx) { const q = banimalPick(); return choice(ctx, { prompt: q.p, options: shuffle([{ node: em(q.ok, 'xl'), ok: true }, ...q.no.map(n => ({ node: em(n, 'xl'), ok: false }))]), cols: 3, after: q.f }); },
};

/* ================= 9. Bible Puzzles: memory and jigsaws ================= */
const BFACES = [['🌈', 'Rainbow'], ['🕊️', 'Dove'], ['⭐', 'Star'], ['🐑', 'Sheep'], ['🐋', 'Big fish'], ['🦁', 'Lion'], ['🧥', 'Coat'], ['🧺', 'Basket'], ['👑', 'Crown'], ['🍞', 'Bread'], ['🫏', 'Donkey'], ['🪨', 'Stone']];
const stableSVG = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="#1D2F5E"/><circle cx="150" cy="28" r="10" fill="#FDD835"/><path d="M150 10 v36 M132 28 h36" stroke="#FDD835" stroke-width="4"/><rect y="160" width="300" height="40" fill="#5D7A3A"/><path d="M70 90 l80 -40 l80 40 z" fill="#8D5A3B"/><rect x="85" y="90" width="130" height="75" fill="#B07A52"/><rect x="110" y="110" width="80" height="55" fill="#3E2A1A"/><text x="150" y="155" font-size="28" text-anchor="middle">👶</text><text x="122" y="150" font-size="22">👩</text><text x="162" y="150" font-size="22">👨</text><text x="40" y="180" font-size="26">🐑</text><text x="240" y="180" font-size="26">🐄</text></svg>`;
const arkRainbowSVG = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="#BFE6F7"/>${RAINBOW.map(([, c], i) => `<path d="M30 140 a120 110 0 0 1 240 0" fill="none" stroke="${c}" stroke-width="9" transform="translate(0 ${i * 9}) scale(1 ${1 - i * 0.04})" transform-origin="150 140"/>`).join('')}<rect y="150" width="300" height="50" fill="#4EA6DC"/><g transform="translate(75 105) scale(.75)">${ARK.replace('<svg viewBox="0 0 200 110" class="arksvg">', '').replace('</svg>', '')}</g><text x="240" y="60" font-size="26">🕊️</text></svg>`;
const hillSVG = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="#CDEBF7"/><circle cx="250" cy="40" r="22" fill="#FDD835"/><path d="M0 120 q75 -60 150 0 t150 0 v80 h-300z" fill="#7CB342"/><path d="M0 150 q90 -40 180 0 t120 0 v50 h-300z" fill="#558B2F"/><text x="60" y="140" font-size="26">🐑</text><text x="140" y="165" font-size="26">🐑</text><text x="210" y="150" font-size="26">🐑</text><text x="100" y="185" font-size="30">🧑‍🌾</text></svg>`;
const BSCENES = [['the stable in Bethlehem', stableSVG], ["Noah's ark and the rainbow", arkRainbowSVG], ['the shepherd and his sheep', hillSVG]];
export const bpuzzles = {
  id: 'bpuzzles', title: 'Bible Puzzles', icon: '🧩', cat: 'bible', minBand: 1, color: '#26A69A',
  desc: 'Memory pairs and picture jigsaws from Bible stories.',
  stages: ['Memory: 4 cards', 'Memory: 8 cards', 'Jigsaw: 4 pieces', 'Jigsaw: 6 pieces', 'Memory: 12 cards'],
  start: [0, 1, 2],
  stars: (m, st) => (st >= 2 && st <= 3 ? (m <= 1 ? 3 : m <= 4 ? 2 : 1) : (m <= [2, 4, 0, 0, 6][st] ? 3 : m <= [2, 4, 0, 0, 6][st] * 2 ? 2 : 1)),
  async board(ctx) {
    const st = ctx.stage, b = ctx.board;
    if (st === 2 || st === 3) {
      const [c, r] = st === 2 ? [2, 2] : [3, 2];
      for (const [name, svg] of sample(BSCENES, 2)) {
        if (!ctx.alive()) return;
        const url = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg())}")`, n = c * r;
        const grid = h('div', { class: 'jiggrid', style: `--c:${c};--r:${r};--img:${url}` });
        for (let i = 0; i < n; i++) grid.append(h('div', { class: 'jslot', 'data-key': 'p' + i }, h('div', { class: 'slot' })));
        const pos = i => `background-image:${url};background-size:${c * 100}% ${r * 100}%;background-position:${(i % c) / (c - 1) * 100}% ${Math.floor(i / c) / (r - 1) * 100}%`;
        await drag(ctx, { prompt: 'Make the picture! Drag each piece to its place.', scene: h('div', { class: 'jigwrap' }, grid), items: range(0, n - 1).map(i => ({ key: 'p' + i, node: h('span', { class: 'jpiece', style: `${pos(i)};--c:${c}` }) })), trayClass: 'jigtray' });
        grid.classList.add('done'); sfx.win(); if (ctx.alive()) await ctx.say(`You made ${name}!`);
      }
      return;
    }
    const pairs = [2, 4, 0, 0, 6][st], faces = sample(BFACES, pairs), cards = shuffle([...faces, ...faces]);
    return new Promise(res => {
      b.innerHTML = '';
      const grid = h('div', { class: 'memgrid', style: `--cols:${pairs <= 2 ? 2 : 4}` });
      let open = [], found = 0, lock = false;
      cards.forEach(f => {
        const cd = h('button', { class: 'card' }, h('span', { class: 'back' }, '✝️'), h('span', { class: 'face mono' }, h('span', {}, f[0]), h('small', {}, f[1])));
        cd.addEventListener('click', async () => {
          if (lock || cd.classList.contains('flip') || !ctx.alive()) return;
          cd.classList.add('flip'); sfx.tap(); open.push([cd, f]);
          if (open.length === 2) {
            lock = true; const [[c1, f1], [c2, f2]] = open; open = [];
            if (f1 === f2) { await sleep(300); c1.classList.add('match'); c2.classList.add('match'); sfx.good(); ctx.sparkle(c2); found++; if (found === pairs) { await ctx.good(); lock = false; res(); return; } }
            else { ctx.mistake(); await sleep(900); c1.classList.remove('flip'); c2.classList.remove('flip'); }
            lock = false;
          }
        });
        grid.append(cd);
      });
      b.append(grid);
      ctx.say('Find the matching pairs from the Bible stories!');
    });
  },
};

/* ================= 10. Verse Builder (ages 5–6) ================= */
const VERSES = [
  ['God is love', '1 John 4:8'], ['Love one another', 'John 13:34'], ['Be kind to one another', 'Ephesians 4:32'],
  ['The Lord is my shepherd', 'Psalm 23:1'], ['Let the children come to me', 'Mark 10:14'], ['Give thanks to the Lord, for he is good', 'Psalm 136:1'],
  ['I am the light of the world', 'John 8:12'], ['This is the day the Lord has made', 'Psalm 118:24'], ['Do not be afraid', 'Isaiah 41:10'],
];
export const verses = {
  id: 'verses', title: 'Verse Builder', icon: '📜', cat: 'bible', minBand: 3, color: '#8D6E63',
  desc: 'Build short Bible verses word by word. Great for early readers!',
  stages: ['Short verses', 'Longer verses'],
  start: [0, 0, 0],
  rounds: 4,
  question(ctx) {
    const pool = VERSES.filter(([v]) => (ctx.stage === 0 ? v.split(' ').length <= 4 : v.split(' ').length > 4));
    const [v, ref] = pick(pool), words = v.split(' ');
    const p = tapOrder(ctx, { prompt: `Listen: "${v}". Now tap the words in order.`, lineClass: 'verse', items: words.map((w, i) => ({ order: i, node: h('span', { class: 'word' }, w) })) });
    ctx.board.prepend(h('div', { class: 'versehint' }, h('button', { class: 'btn ghost sm', onclick: () => ctx.say(v) }, '🔊 Hear it'), h('small', {}, ref)));
    return p.then(async () => { await ctx.say(`${v}. ${ref.replace(':', ', verse ')}.`); return true; });
  },
};

/* ================= 11. Build the Christmas Crib ================= */
const CRIB = [
  ['jesus', '👶', 'Baby Jesus', 50, 80], ['mary', '👩', 'Mary', 34, 64], ['joseph', '🧔', 'Joseph', 66, 64],
  ['star', '⭐', 'The star', 50, 10], ['ox', '🐂', 'The ox', 30, 40], ['donkey', '🫏', 'The donkey', 70, 40],
  ['shepherd', '🧑‍🌾', 'A shepherd', 12, 72], ['sheep', '🐑', 'A sheep', 12, 90], ['kings', '👑', 'The three kings', 88, 74],
];
export const crib = {
  id: 'crib', title: 'Build the Christmas Crib', icon: '🎄', cat: 'bible', minBand: 1, color: '#C62828',
  desc: 'Make a Christmas crib like Goan families do: Mary, Joseph, baby Jesus and the star!',
  stages: ['The Holy Family', 'Add the star and animals', 'The whole crib'],
  start: [0, 0, 1],
  roundsFor: () => 1,
  question(ctx) {
    const n = [3, 6, 9][ctx.stage], set = CRIB.slice(0, n);
    const stage = h('div', { class: 'cribscene', html: `<svg viewBox="0 0 300 200" class="stable"><path d="M40 70 L150 12 L260 70 Z" fill="#8D5A3B" stroke="#5D3A24" stroke-width="4"/><rect x="55" y="70" width="190" height="120" fill="#C79A6B" stroke="#5D3A24" stroke-width="4"/><rect x="80" y="95" width="140" height="95" fill="#6D4C33"/><path d="M110 168 h80 l-10 18 h-60 z" fill="#E0B865"/><rect y="186" width="300" height="14" fill="#7CB342"/></svg>` });
    for (const [k, e, name, x, y] of set) stage.append(h('div', { class: 'cribspot', 'data-key': k, style: `left:${x}%;top:${y}%`, title: name }, h('span', { class: 'ghost' }, e), h('div', { class: 'slot' })));
    return drag(ctx, { prompt: ctx.stage === 0 ? 'Build the crib! Put baby Jesus in the manger, with Mary and Joseph.' : 'Put everyone in their place in the crib!', scene: stage,
      items: set.map(([k, e, name]) => ({ key: k, node: h('span', { class: 'cribfig' }, h('span', { class: 'gi' }, e), h('small', {}, name)), say: name + '!', hint: `That is not the place for ${name.toLowerCase()}. Try another spot!` })) })
      .then(async () => { await ctx.say('What a beautiful Christmas crib! In Goa, families make cribs just like this at Christmas.'); return true; });
  },
};

/* ================= 12. The Church Year ================= */
const SEASONS = [
  ['advent', '🕯️', 'Advent', 'We light candles and get ready for Jesus.'], ['christmas', '⭐', 'Christmas', 'We celebrate that Jesus is born.'],
  ['lent', '💜', 'Lent', 'Forty days of saying sorry, praying and being kind.'], ['easter', '🐣', 'Easter', 'We celebrate that Jesus is alive!'],
  ['pentecost', '🕊️', 'Pentecost', 'The Holy Spirit came to Jesus’ friends, like wind and flames.'],
];
export const churchyear = {
  id: 'churchyear', title: 'The Church Year', icon: '🕯️', cat: 'bible', minBand: 2, color: '#6A1B9A',
  desc: 'Advent, Christmas, Lent, Easter and Pentecost: learn the seasons of the church year.',
  stages: ['What happens when?', 'Put them in order'],
  start: [0, 0, 0],
  roundsFor: s => (s === 0 ? 5 : 2),
  question(ctx) {
    if (ctx.stage === 0) {
      const s = SEASONS[ctx.round % 5], opts = shuffle([s, ...sample(SEASONS.filter(x => x !== s), 2)]);
      return choice(ctx, { prompt: `${s[3]} Which season is it?`, options: opts.map(o => ({ node: h('span', { class: 'gtag col' }, h('span', { class: 'gi' }, o[1]), h('b', {}, o[2])), ok: o === s, label: o[2] })), cols: 3, after: `Yes, ${s[2]}!` });
    }
    const set = ctx.round === 0 ? [0, 1, 3] : [0, 1, 2, 3, 4];
    return tapOrder(ctx, { prompt: 'The church year starts with Advent. Tap the seasons in order!', items: set.map((i, o) => ({ order: o, node: h('span', { class: 'gtag col' }, h('span', { class: 'gi' }, SEASONS[i][1]), h('b', {}, SEASONS[i][2])) })) })
      .then(async () => { await ctx.say(set.map(i => SEASONS[i][2]).join(', ') + '. A whole church year!'); return true; });
  },
};

/* ================= 13. Goan Saints ================= */
const SAINTS = [
  [ // St Francis Xavier
    { p: 'Saint Francis Xavier sailed to Goa long ago to tell people about Jesus. In which church in Old Goa is he remembered?', ok: ['⛪', 'Bom Jesus'], no: [['🏰', 'Aguada Fort'], ['🏟️', 'A stadium']], f: 'The Basilica of Bom Jesus in Old Goa. People visit him there.' },
    { p: 'The feast of Saint Francis Xavier is on the 3rd of December. Which month is that?', ok: ['🎄', 'December'], no: [['☀️', 'July'], ['🌸', 'April']], f: 'December, just before Christmas!' },
    { p: 'Saint Francis Xavier travelled to many lands. How did he travel across the sea long ago?', ok: ['⛵', 'By ship'], no: [['✈️', 'By plane'], ['🚀', 'By rocket']], f: 'By sailing ship! There were no planes then.' },
    { p: 'Saint Francis Xavier helped sick people and taught children. What kind of person was he?', ok: ['🤲', 'Kind and caring'], no: [['😠', 'Grumpy'], ['🙈', 'Lazy']], f: 'Saints show us how to love God and help others.' },
  ],
  [ // St Joseph Vaz
    { p: 'Saint Joseph Vaz was born in Goa. In which village?', ok: ['🏖️', 'Benaulim'], no: [['🏔️', 'London'], ['🗽', 'New York']], f: 'Benaulim, in South Goa, in the year 1651.' },
    { p: 'Saint Joseph Vaz sailed to an island to help people there. Which island?', ok: ['🏝️', 'Sri Lanka'], no: [['🧊', 'Iceland'], ['🐨', 'Australia']], f: 'Sri Lanka. Long ago it was called Ceylon. He is loved there too.' },
    { p: 'Saint Joseph Vaz was made a saint in 2015. Who made him a saint?', ok: ['👴', 'Pope Francis'], no: [['🤴', 'A king'], ['🧙', 'A wizard']], f: 'Pope Francis, at a big outdoor Mass in Sri Lanka.' },
    { p: 'When people were sick, what did Saint Joseph Vaz do?', ok: ['🤲', 'He cared for them'], no: [['🏃', 'He ran away'], ['😴', 'He slept']], f: 'He looked after sick people, even when it was hard.' },
    { p: 'Saint Joseph Vaz walked a very long way to visit people. How did he travel on land?', ok: ['🚶', 'He walked'], no: [['🚗', 'By car'], ['🚁', 'By helicopter']], f: 'He walked barefoot from village to village!' },
  ],
];
const saintPick = SAINTS.map(l => freshPicker(l));
export const saints = {
  id: 'saints', title: 'Goan Saints', icon: '😇', cat: 'bible', minBand: 2, color: '#F9A825',
  desc: 'Meet Saint Francis Xavier and Saint Joseph Vaz, who was born in Goa!',
  stages: ['Saint Francis Xavier', 'Saint Joseph Vaz'],
  start: [0, 0, 0], rounds: 4,
  question(ctx) {
    const q = saintPick[ctx.stage](), opts = shuffle([{ x: q.ok, ok: true }, ...q.no.map(x => ({ x, ok: false }))]);
    return choice(ctx, { prompt: q.p, parts: [q.p, `Is it ${opts.map(o => o.x[1]).join(', or ')}?`], options: opts.map(o => ({ node: tag(o.x[0], o.x[1]), ok: o.ok, label: o.x[1] })), cols: 3, after: q.f });
  },
};

/* ================= 14. Prayers (English; Konkani when recorded) ================= */
const PRAYERS = {
  cross: { title: 'The Sign of the Cross', clip: 'prayer-sign-of-the-cross', lines: ['In the name of the Father,', 'and of the Son,', 'and of the Holy Spirit.', 'Amen.'] },
  grace: { title: 'Grace before meals', clip: 'prayer-grace', lines: ['Bless us, O Lord,', 'and these thy gifts,', 'which we are about to receive', 'from thy bounty,', 'through Christ our Lord.', 'Amen.'] },
  father: { title: 'Our Father', clip: 'prayer-our-father', lines: ['Our Father, who art in heaven,', 'hallowed be thy name;', 'thy kingdom come,', 'thy will be done', 'on earth as it is in heaven.', 'Give us this day our daily bread,', 'and forgive us our trespasses,', 'as we forgive those who trespass against us;', 'and lead us not into temptation,', 'but deliver us from evil.', 'Amen.'] },
  mary: { title: 'Hail Mary', clip: 'prayer-hail-mary', lines: ['Hail Mary, full of grace,', 'the Lord is with thee.', 'Blessed art thou among women,', 'and blessed is the fruit of thy womb, Jesus.', 'Holy Mary, Mother of God,', 'pray for us sinners,', 'now and at the hour of our death.', 'Amen.'] },
  glory: { title: 'Glory Be', clip: 'prayer-glory-be', lines: ['Glory be to the Father,', 'and to the Son,', 'and to the Holy Spirit.', 'As it was in the beginning,', 'is now, and ever shall be,', 'world without end.', 'Amen.'] },
};
export const PRAYER_LIST = PRAYERS;
const CROSS_STEPS = [['🙂', 'Forehead', 'In the name of the Father'], ['❤️', 'Chest', 'and of the Son'], ['👈', 'Left shoulder', 'and of the Holy'], ['👉', 'Right shoulder', 'Spirit. Amen.']];
const BLANKS = { grace: [['gifts', 'toys'], ['Lord', 'car']], father: [['heaven', 'garden'], ['bread', 'cake'], ['evil', 'rain']], mary: [['grace', 'grapes'], ['Jesus', 'Jonah'], ['God', 'Goa']], glory: [['Father', 'farmer'], ['end', 'bend']] };
async function readAlong(ctx, pr) {
  const b = ctx.board; b.innerHTML = '';
  const lines = pr.lines.map(l => h('p', { class: 'pline' }, l));
  const kclip = 'konkani/' + pr.clip;
  const next = h('button', { class: 'btn big' }, 'Next line ▶');
  b.append(h('div', { class: 'prayercard' }, h('h3', {}, '🙏 ' + pr.title), lines),
    h('div', { class: 'row gap center' }, hasClip(kclip) ? h('button', { class: 'btn ghost', onclick: () => ctx.say(pr.title, [{ t: pr.title, clip: kclip }]) }, '🔊 Hear it in Konkani') : null, next));
  await ctx.say(`Let's say the ${pr.title} together. Listen, then say each line with me.`);
  for (let i = 0; i < lines.length; i++) {
    if (!ctx.alive()) return false;
    lines.forEach((l, k) => l.classList.toggle('now', k === i));
    await ctx.say(pr.lines[i]);
    if (i < lines.length - 1) { next.textContent = 'Next line ▶'; if (!(await waitTap(ctx, next))) return false; }
  }
  lines.forEach(l => l.classList.add('done'));
  sfx.win(); await ctx.say('Amen! Well done.');
  return true;
}
export const prayers = {
  id: 'prayers', title: 'Let Us Pray', icon: '🙏', cat: 'bible', minBand: 1, color: '#3949AB',
  desc: 'Learn the Sign of the Cross, grace before meals, the Our Father, the Hail Mary and the Glory Be.',
  stages: ['The Sign of the Cross', 'Grace before meals', 'Our Father', 'Hail Mary', 'Glory Be'],
  start: [0, 1, 2],
  async board(ctx) {
    const key = ['cross', 'grace', 'father', 'mary', 'glory'][ctx.stage], pr = PRAYERS[key];
    if (key === 'cross') {
      for (let r = 0; r < 2 && ctx.alive(); r++) {
        await tapOrder(ctx, { prompt: r === 0 ? 'Make the Sign of the Cross! Touch your forehead, then your chest, then your left shoulder, then your right shoulder. Tap them in order.' : 'One more time, all by yourself!',
          items: CROSS_STEPS.map(([e, n], i) => ({ order: i, node: h('span', { class: 'gtag col' }, h('span', { class: 'gi' }, e), h('b', {}, n)) })) });
        if (ctx.alive()) await ctx.say('In the name of the Father, and of the Son, and of the Holy Spirit. Amen.');
      }
      return;
    }
    if (!(await readAlong(ctx, pr))) return;
    for (const [w, wrong] of sample(BLANKS[key], 2)) {
      if (!ctx.alive()) return;
      const line = pr.lines.find(l => l.includes(w)), shown = line.replace(w, '_____');
      await choice(ctx, { prompt: `Which word is missing? "${shown}"`, parts: ['Which word is missing?', line.replace(w, 'hmm')], show: h('p', { class: 'pline now big' }, shown),
        options: shuffle([w, wrong]).map(x => ({ node: h('b', { class: 'word big' }, x), ok: x === w, label: x })), cols: 2, after: line });
    }
  },
};
