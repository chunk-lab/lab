// 釣り:魚・アイテム・道具のデータ。数字を変えるだけで調整できるように、ここにまとめる。
//
// 魚(kind:'fish')
//   r: レア度 1〜5 / size: [最小, 最大] cm / area: 好きな場所 / time: 'any'|'morning'|'day'|'evening'|'night'
//   season: 出る季節(なければ一年中) / rain: 雨で出やすい / bait: エサ・ルアーごとの好み(0〜1)
//   speed: ルアーの動かし方の好み 'still'(止める) 'slow'(ゆっくり巻く) 'fast'(速く巻く) 'twitch'(しゃくる)
//   str: 引く強さ / stam: 体力 / run: あばれやすさ / jump: 水面ではねる / win: アタリの長さ(秒) / wary: 何回かつついてから食う
//   art: 絵の形と色(art.js)
// 町の池だけど、なぜか海の魚もいる(あとで海の釣り場を作ってもそのまま使える)
export const AREAS = {
  weed: { name: '水草', x0: -0.86, x1: -0.38, d0: 0.12, d1: 0.44 },
  log: { name: 'しずんだ木', x0: 0.18, x1: 0.56, d0: 0.1, d1: 0.27 },
  lily: { name: 'ハスの葉', x0: 0.36, x1: 0.86, d0: 0.38, d1: 0.66 },
  rock: { name: '岩場', x0: -0.66, x1: -0.26, d0: 0.64, d1: 0.86 },
  deep: { name: 'ふかみ', x0: -0.24, x1: 0.28, d0: 0.62, d1: 1.0 },
};
export function areaAt(x, d) { for (const k in AREAS) { const a = AREAS[k]; if (x >= a.x0 && x <= a.x1 && d >= a.d0 && d <= a.d1) return k; } return 'open'; }

const F = (o) => ({ kind: 'fish', area: ['open'], time: 'any', bait: {}, speed: 'still', str: 0.5, stam: 1, run: 0.5, win: 0.8, wary: 0, ...o });
export const FISH = [
  // ---- よく釣れる ----
  F({ id: 'motsugo', name: 'モツゴ', en: 'Topmouth gudgeon', r: 1, size: [4, 9], area: ['open', 'weed', 'log'], bait: { worm: 1, bread: 0.7, glow: 0.4 }, str: 0.18, stam: 0.4, win: 0.6, wary: 1, art: { body: ['#8d8a6e', '#e9e3c8'], fin: '#a7a07a', pat: 'line', pc: '#4b4a3a', h: 0.26, tail: 'round' }, hint: 'どこにでもいる小さな魚', say: 'Small but lively.' }),
  F({ id: 'funa', name: 'フナ', en: 'Crucian carp', r: 1, size: [10, 30], area: ['weed', 'open', 'log'], bait: { worm: 1, bread: 0.9, glow: 0.4 }, str: 0.45, stam: 0.8, win: 0.9, wary: 1, art: { body: ['#8a7a4e', '#e8dcae'], fin: '#7d6b40', h: 0.42, tail: 'fork' }, hint: '水草のあたりが好き', say: 'A classic pond fish.' }),
  F({ id: 'oikawa', name: 'オイカワ', en: 'Pale chub', r: 1, size: [8, 16], area: ['open'], time: 'day', bait: { worm: 0.8, spoon: 0.5, bread: 0.3 }, speed: 'slow', str: 0.32, stam: 0.6, win: 0.6, art: { body: ['#6f8ea8', '#f3eef0'], fin: '#e98b8b', pat: 'bands', pc: '#4f9fd0', h: 0.3, tail: 'fork' }, hint: '明るいうちに、ひらけた所で', say: 'Look at those colors!' }),
  F({ id: 'bluegill', name: 'ブルーギル', en: 'Bluegill', r: 1, size: [8, 22], area: ['weed', 'log', 'lily'], bait: { worm: 1, bread: 0.5, spoon: 0.5, minnow: 0.4, shrimp: 0.6 }, speed: 'slow', str: 0.42, stam: 0.7, win: 0.7, art: { body: ['#5f7a6a', '#e8d8a0'], fin: '#4a5d52', pat: 'bands', pc: '#3b4d44', h: 0.55, tail: 'round', spot: '#1f2a3d' }, hint: 'しずんだ木のかげに多い', say: 'It fights hard for its size.' }),
  F({ id: 'haze', name: 'ハゼ', en: 'Goby', r: 1, size: [6, 15], area: ['rock', 'log'], bait: { worm: 1, shrimp: 0.8 }, str: 0.3, stam: 0.5, win: 0.7, art: { body: ['#a59473', '#efe6cf'], fin: '#9a8a68', pat: 'spots', pc: '#6d5f45', h: 0.28, tail: 'round', bigHead: 1 }, hint: '岩のすきまにひそむ', say: 'A goby! They like the bottom.' }),
  F({ id: 'zarigani', name: 'アメリカザリガニ', en: 'Crayfish', r: 1, size: [6, 13], area: ['rock', 'log', 'weed'], bait: { worm: 0.8, shrimp: 1 }, str: 0.25, stam: 0.5, run: 0.1, win: 1.2, art: { shape: 'crab', body: ['#d9483b', '#f28b6b'] }, hint: '魚じゃないけど、よく掛かる', say: 'Watch out for the claws!' }),
  // ---- ときどき ----
  F({ id: 'medaka', name: 'メダカ', en: 'Japanese rice fish', r: 2, size: [2, 4], area: ['weed'], time: 'day', bait: { bread: 1, worm: 0.4 }, str: 0.08, stam: 0.2, win: 0.45, wary: 2, art: { body: ['#c9b98e', '#f6efd9'], fin: '#c9b98e', h: 0.24, tail: 'square', eyeBig: 1 }, hint: '小さすぎて、アタリがわかりにくい', say: 'So tiny! Can you even see it?' }),
  F({ id: 'kingyo', name: '金魚', en: 'Goldfish', r: 2, size: [5, 15], area: ['weed', 'lily'], season: ['summer'], bait: { bread: 1, worm: 0.6 }, str: 0.2, stam: 0.4, win: 0.8, art: { body: ['#f2552c', '#ffb46b'], fin: '#ff8a5c', h: 0.5, tail: 'fan' }, hint: '夏祭りから逃げてきたらしい', say: 'Someone must have let it go.' }),
  F({ id: 'koi', name: 'コイ', en: 'Carp', r: 2, size: [30, 85], area: ['open', 'deep'], bait: { bread: 1, worm: 0.6, glow: 0.3 }, str: 1.05, stam: 1.4, run: 0.6, win: 1.0, wary: 1, art: { body: ['#6c6a4a', '#d8cc9a'], fin: '#5a573c', h: 0.36, tail: 'fork', whisker: 1, scale: 1 }, hint: 'パンが大好物。重い引き', say: 'What a heavy pull!' }),
  F({ id: 'herabuna', name: 'ヘラブナ', en: 'Gengoro carp', r: 2, size: [20, 45], area: ['deep', 'open'], bait: { bread: 1, worm: 0.3 }, str: 0.7, stam: 1.0, win: 0.45, wary: 3, art: { body: ['#9a9a86', '#eeeedd'], fin: '#7d7d6a', h: 0.5, tail: 'fork' }, hint: 'アタリは一瞬。見のがすな', say: 'Quick reflexes!' }),
  F({ id: 'bass', name: 'ブラックバス', en: 'Largemouth bass', r: 2, size: [20, 58], area: ['weed', 'log', 'lily'], bait: { minnow: 1, frog: 0.8, spoon: 0.7, worm: 0.3 }, speed: 'twitch', str: 0.95, stam: 1.0, run: 0.8, jump: 1, win: 0.7, art: { body: ['#5d7a3e', '#e3e2b0'], fin: '#4c6332', pat: 'line', pc: '#2f4422', h: 0.34, tail: 'round', bigMouth: 1 }, hint: 'ルアーをしゃくると食いつく。はねたらゆるめろ', say: 'A bass! Nice fight!' }),
  F({ id: 'aji', name: 'アジ', en: 'Horse mackerel', r: 2, size: [15, 32], area: ['open', 'deep'], bait: { shrimp: 1, spoon: 0.6 }, speed: 'slow', str: 0.55, stam: 0.8, win: 0.7, art: { body: ['#7f9db0', '#f0f2f2'], fin: '#c3c78a', pat: 'line', pc: '#d9c46a', h: 0.3, tail: 'fork' }, hint: 'なぜか池にいる海の魚', say: 'Wait, this is a sea fish!' }),
  F({ id: 'nijimasu', name: 'ニジマス', en: 'Rainbow trout', r: 2, size: [25, 55], area: ['open'], time: 'morning', bait: { spoon: 1, minnow: 0.7, worm: 0.5 }, speed: 'slow', str: 0.85, stam: 1.0, run: 0.7, jump: 1, win: 0.7, art: { body: ['#6e8b6a', '#f2e6e0'], fin: '#8d9f7f', pat: 'rainbow', pc: '#ef8fa8', h: 0.3, tail: 'square', dots: 1 }, hint: '朝、スプーンをゆっくり巻くと', say: 'Beautiful rainbow stripe!' }),
  F({ id: 'saba', name: 'サバ', en: 'Mackerel', r: 2, size: [25, 42], area: ['open', 'deep'], time: 'day', bait: { spoon: 1, minnow: 0.6 }, speed: 'fast', str: 0.8, stam: 0.9, run: 0.8, win: 0.55, art: { body: ['#3f7d8f', '#eef3f2'], fin: '#5d8b90', pat: 'wave', pc: '#1f4655', h: 0.26, tail: 'fork' }, hint: 'スプーンを速く巻く', say: 'Fast swimmer!' }),
  // ---- めずらしい ----
  F({ id: 'namazu', name: 'ナマズ', en: 'Catfish', r: 3, size: [40, 75], area: ['deep', 'log'], time: 'night', rain: 1, bait: { worm: 1, frog: 0.8, glow: 0.8 }, str: 1.0, stam: 1.4, run: 0.5, win: 1.1, art: { shape: 'cat', body: ['#4e4a3e', '#bdb49a'], fin: '#3e3a30', h: 0.24, tail: 'round', whisker: 2 }, hint: '夜。しずんだ木のあたり', say: 'A catfish. Look at the whiskers!' }),
  F({ id: 'unagi', name: 'ウナギ', en: 'Eel', r: 3, size: [40, 85], area: ['rock', 'log'], time: 'night', rain: 1, bait: { worm: 1, shrimp: 0.8, glow: 0.6 }, str: 0.9, stam: 1.2, run: 0.9, win: 1.0, art: { shape: 'eel', body: ['#3d4a3a', '#c9c7a3'] }, hint: '雨の夜、岩のすきまから', say: 'Slippery! Hold on tight!' }),
  F({ id: 'raigyo', name: 'ライギョ', en: 'Snakehead', r: 3, size: [50, 85], area: ['lily'], time: 'day', season: ['spring', 'summer'], bait: { frog: 1 }, speed: 'twitch', str: 1.3, stam: 1.3, run: 0.8, win: 0.6, art: { body: ['#4a5236', '#c9c39a'], fin: '#3f462d', pat: 'blotch', pc: '#262a1c', h: 0.26, tail: 'round', bigMouth: 1 }, hint: 'ハスの葉の上でカエルをおどらせる', say: 'The king of the lily pads!' }),
  F({ id: 'hirame', name: 'ヒラメ', en: 'Flounder', r: 3, size: [30, 65], area: ['deep'], bait: { minnow: 0.9, shrimp: 0.7 }, speed: 'slow', str: 1.0, stam: 1.2, run: 0.4, win: 0.8, art: { shape: 'flat', body: ['#8a7658', '#f2ece0'] }, hint: 'ふかみの底でじっとしている', say: 'Flat as a pancake!' }),
  F({ id: 'fugu', name: 'クサフグ', en: 'Pufferfish', r: 3, size: [10, 25], area: ['open', 'rock'], bait: { shrimp: 1, worm: 0.5 }, str: 0.4, stam: 0.6, win: 0.9, wary: 2, art: { shape: 'puffer', body: ['#7e8a52', '#f6f2df'], pc: '#3e4426' }, hint: 'エサだけ取るのがうまい', say: 'It puffed up! So round!' }),
  F({ id: 'tako', name: 'マダコ', en: 'Octopus', r: 3, size: [30, 65], area: ['rock'], bait: { shrimp: 1 }, str: 1.1, stam: 1.6, run: 0.05, heavy: 1, win: 1.3, art: { shape: 'octo', body: ['#c86a5a', '#efb7a0'] }, hint: '岩場。重くて張りつく', say: 'Eight arms! It is stuck to the rock!' }),
  F({ id: 'kumanomi', name: 'カクレクマノミ', en: 'Clownfish', r: 3, size: [6, 11], area: ['lily', 'weed'], time: 'day', bait: { shrimp: 1, bread: 0.4 }, str: 0.15, stam: 0.4, win: 0.6, art: { body: ['#ff7a2e', '#ffb37a'], fin: '#ff8f45', pat: 'clown', pc: '#ffffff', h: 0.45, tail: 'round' }, hint: 'ハスのかげに、なぜか南の魚', say: 'Found you, little clownfish!' }),
  F({ id: 'kurage', name: 'ミズクラゲ', en: 'Moon jellyfish', r: 3, size: [15, 32], area: ['open', 'deep'], time: 'night', bait: { glow: 1, worm: 0.2, shrimp: 0.2 }, str: 0.2, stam: 0.5, run: 0.05, heavy: 1, win: 1.4, art: { shape: 'jelly', body: ['#cfe6ff', '#ffffff'] }, hint: '夜、光るエサにふわっと寄ってくる', say: 'It is glowing in the dark...' }),
  // ---- とてもめずらしい ----
  F({ id: 'tai', name: 'マダイ', en: 'Red sea bream', r: 4, size: [35, 75], area: ['deep'], time: 'morning', bait: { shrimp: 1, minnow: 0.4 }, speed: 'slow', str: 1.25, stam: 2.0, run: 0.7, win: 0.8, art: { body: ['#e8708a', '#fbd7d5'], fin: '#e87d8d', h: 0.44, tail: 'fork', dots: 2 }, hint: '朝のふかみ。エビで', say: 'A red sea bream! That is lucky!' }),
  F({ id: 'tatsu', name: 'タツノオトシゴ', en: 'Seahorse', r: 4, size: [8, 16], area: ['weed'], bait: { shrimp: 1 }, str: 0.1, stam: 0.3, run: 0.1, win: 0.4, wary: 2, art: { shape: 'seahorse', body: ['#e3a63c', '#f6d58a'] }, hint: '水草にしっぽをまいている', say: 'A seahorse! I can not believe it!' }),
  F({ id: 'sake', name: 'シロザケ', en: 'Chum salmon', r: 4, size: [50, 85], area: ['open', 'deep'], season: ['autumn'], bait: { spoon: 1, minnow: 0.6 }, speed: 'slow', str: 1.4, stam: 2.1, run: 0.8, jump: 1, win: 0.7, art: { body: ['#6b7a7e', '#f0dccf'], fin: '#5e6a6d', pat: 'bands', pc: '#a65a6a', h: 0.32, tail: 'square', hook: 1 }, hint: '秋だけ。スプーンで', say: 'Salmon season!' }),
  // ---- 伝説 ----
  F({ id: 'kingoi', name: '黄金のコイ', en: 'Golden carp', r: 5, size: [60, 110], area: ['deep', 'open'], bait: { bread: 1, worm: 0.5 }, str: 1.5, stam: 2.8, run: 0.6, win: 0.9, wary: 1, art: { body: ['#f2c14e', '#fff2b3'], fin: '#f0a93a', h: 0.36, tail: 'fork', whisker: 1, scale: 1, glow: '#ffe27a' }, hint: '朝日のころ、ふかみで見たという人がいる', say: 'Is it... made of gold?!' }),
  F({ id: 'nushi', name: '池のヌシ', en: 'The Pond Master', r: 5, size: [120, 190], area: ['deep'], time: 'night', rain: 1, bait: { worm: 0.8, frog: 1, glow: 1 }, str: 2.4, stam: 3.8, run: 0.7, win: 1.0, art: { shape: 'cat', body: ['#2e2b28', '#8f8775'], fin: '#22201d', h: 0.24, tail: 'round', whisker: 2, scar: 1 }, hint: '雨の夜。ほんとうにいるらしい', say: 'The legend is real!!' }),
  F({ id: 'maguro', name: 'クロマグロ', en: 'Pacific bluefin tuna', r: 5, size: [120, 260], area: ['deep'], time: 'day', bait: { minnow: 1, spoon: 0.4 }, speed: 'fast', str: 2.8, stam: 4.2, run: 0.9, win: 0.6, art: { shape: 'tuna', body: ['#1f3550', '#dde6ea'], fin: '#e6c34a', h: 0.32, tail: 'lunate' }, hint: 'まさか。でも、ふかみで大きな影を見た', say: 'A TUNA?! In a pond?!' }),
  F({ id: 'ryugu', name: 'リュウグウノツカイ', en: 'Oarfish', r: 5, size: [300, 520], area: ['deep'], bait: { shrimp: 0.6, glow: 0.8, minnow: 0.5 }, str: 1.6, stam: 2.6, run: 0.3, win: 1.2, art: { shape: 'oar', body: ['#c9d3dc', '#ffffff'], fin: '#ff5a6a' }, hint: 'だれも信じてくれない', say: 'Nobody will believe this...' }),
];

// 魚じゃないもの(底をひきずったり、じっと待つと引っかかる)。junk=はずれ / item=アイテム
const I = o => ({ kind: 'item', size: [0, 0], str: 0.35, stam: 0.3, run: 0, heavy: 1, win: 1.2, bait: {}, area: ['open'], time: 'any', ...o });
export const ITEMS = [
  I({ id: 'boot', kind: 'junk', name: 'ながぐつ', en: 'Old boot', r: 1, area: ['open', 'weed', 'log'], emoji: '🥾', hint: 'はずれ…', say: 'Just an old boot.' }),
  I({ id: 'can', kind: 'junk', name: 'あきかん', en: 'Empty can', r: 1, area: ['open', 'rock'], emoji: '🥫', hint: 'はずれ…でも池がきれいになる', say: 'Let us keep the pond clean.' }),
  I({ id: 'branch', kind: 'junk', name: '木のえだ', en: 'Stick', r: 1, area: ['log', 'weed'], emoji: '🪵', hint: 'はずれ…', say: 'Just a stick.' }),
  I({ id: 'leaf', kind: 'junk', name: 'おちば', en: 'Fallen leaf', r: 1, season: ['autumn'], emoji: '🍂', hint: '秋のはずれ', say: 'Autumn is here.' }),
  I({ id: 'mitten', kind: 'junk', name: 'かたほうの手ぶくろ', en: 'Lost mitten', r: 2, season: ['winter'], emoji: '🧤', hint: 'だれかが落とした', say: 'Someone must be cold.' }),
  I({ id: 'oldcoin', name: '古いコイン', en: 'Old coin', r: 2, area: ['rock', 'deep'], emoji: '🪙', coins: 40, hint: '底に何か光っている', say: 'An old coin. How old is it?' }),
  I({ id: 'bottle', name: 'ビンの手紙', en: 'Message in a bottle', r: 3, area: ['open', 'deep'], emoji: '📜', letter: 1, hint: '英語の手紙が入っている', say: 'There is a letter inside!' }),
  I({ id: 'lure', name: 'だれかのルアー', en: 'Lost lure', r: 3, area: ['log', 'weed', 'lily'], emoji: '🎣', gift: 1, hint: '木に引っかかっていた', say: 'Lucky! A free lure!' }),
  I({ id: 'pearl', name: '真珠', en: 'Pearl', r: 4, area: ['rock', 'deep'], emoji: '🦪', coins: 300, hint: '貝の中に', say: 'A real pearl!' }),
  I({ id: 'chest', name: '小さな宝箱', en: 'Treasure chest', r: 4, area: ['deep', 'rock'], emoji: '🧰', coins: 'chest', str: 0.7, hint: 'ふかみの底に', say: 'Treasure!!' }),
  I({ id: 'star', name: '星のかけら', en: 'Star fragment', r: 5, area: ['open', 'deep'], time: 'night', emoji: '🌟', coins: 500, hint: '星のきれいな夜に', say: 'It fell from the sky...' }),
];
export const ALL = [...FISH, ...ITEMS];
export const BYID = Object.fromEntries(ALL.map(x => [x.id, x]));

// ビンの手紙(英語のことわざ・ひとこと)
export const LETTERS = [
  ['Every cloud has a silver lining.', 'どんな雲にも銀のふちがある(悪いことにも良い面がある)'],
  ['Slow and steady wins the race.', 'ゆっくり着実なほうが勝つ'],
  ['There are plenty of fish in the sea.', '海には魚がたくさんいる(チャンスはまだある)'],
  ['Practice makes perfect.', '練習が完ぺきを作る'],
  ['The early bird catches the worm.', '早起きの鳥は虫をつかまえる'],
  ['Good things come to those who wait.', '待つ人に良いことがやってくる'],
  ['Hello from far away! I hope you are smiling today.', '遠くからこんにちは。今日あなたが笑顔でありますように'],
  ['Whoever finds this, you are my new friend.', 'これを見つけた人は、わたしの新しい友だち'],
  ['Don’t count your chickens before they hatch.', 'ひなが生まれる前に数えるな(とらぬ狸の皮算用)'],
  ['Keep calm and fish on.', 'おちついて釣りを続けよう'],
];

export const RARITY = ['', 'ふつう', 'ときどき', 'めずらしい', 'とてもめずらしい', '伝説'];
export const RARITY_PTS = [1, 10, 25, 60, 160, 450];
export const RARITY_COL = ['#a8a0b4', '#8bbf8f', '#6fa8dc', '#b07cd8', '#f09a3e', '#f2c14e'];

// 道具。price:コイン / gems:ダイヤ。はじめから持っているものは price:0
export const GEAR = {
  rod: [
    { id: 'bamboo', name: '竹の竿', price: 0, dist: 0.58, power: 1.0, acc: 0.55, desc: 'はじめの竿。軽くてやさしい' },
    { id: 'carbon', name: 'カーボン竿', price: 1200, dist: 0.78, power: 1.3, acc: 0.8, desc: '遠くへ、ねらった所へ' },
    { id: 'meijin', name: '名人の竿', gems: 40, dist: 0.97, power: 1.75, acc: 0.95, desc: '大物でも折れない。池のどこへでも' },
  ],
  reel: [
    { id: 'basic', name: 'はじめのリール', price: 0, speed: 1.0, drag: 0.45, desc: 'ふつうのリール' },
    { id: 'smooth', name: 'なめらかリール', price: 900, speed: 1.3, drag: 0.7, desc: '巻くのが速く、ドラグ(糸を出す仕組み)がよく効く' },
    { id: 'gold', name: 'ゴールドリール', gems: 30, speed: 1.65, drag: 0.9, desc: 'とても速い。強い引きでも糸を守る' },
  ],
  line: [
    { id: 'nylon', name: 'ナイロン糸', price: 0, str: 1.0, desc: 'ふつうの糸' },
    { id: 'fluoro', name: 'フロロ糸', price: 700, str: 1.45, desc: '切れにくい' },
    { id: 'pe', name: 'PE糸', gems: 25, str: 2.2, desc: 'とても強い。マグロもこわくない' },
  ],
  bait: [
    { id: 'worm', name: 'ミミズ', price: 0, type: 'bait', icon: '🪱', desc: 'たいていの魚が好き。ウキで待つ' },
    { id: 'bread', name: 'ねりパン', price: 120, type: 'bait', icon: '🍞', desc: 'コイ・フナ・ヘラブナに' },
    { id: 'shrimp', name: 'エビ', price: 350, type: 'bait', icon: '🦐', desc: '海の魚がよく食う' },
    { id: 'spoon', name: 'スプーン', price: 450, type: 'lure', icon: '🥄', desc: 'ルアー。ゆっくり〜速く巻く' },
    { id: 'minnow', name: 'ミノー', price: 800, type: 'lure', icon: '🐟', desc: 'ルアー。しゃくると強い魚が' },
    { id: 'frog', name: 'カエル', price: 700, type: 'lure', icon: '🐸', desc: 'ルアー。ハスの上でしゃくる' },
    { id: 'glow', name: '夜光ワーム', price: 1000, type: 'bait', icon: '✨', desc: '夜にとても強い' },
  ],
};
export const gearById = (slot, id) => GEAR[slot].find(g => g.id === id) || GEAR[slot][0];

// 図鑑のごほうび(見つけた割合)
export const DEX_REWARDS = [[0.1, 100], [0.25, 300], [0.5, 600], [0.75, 1200], [1, 3000]];
// 1日にもらえるコイン(釣りの分)。図鑑のごほうびは別
export const DAILY_COIN_CAP = 500;

// 対戦のルール
export const RULES = {
  count: { name: '数釣り', desc: '釣った魚の数', unit: '匹' },
  big: { name: '大物', desc: 'いちばん大きい1匹の長さ', unit: 'cm' },
  point: { name: 'ポイント', desc: '魚の種類・大きさ・レア度の合計', unit: 'pt' },
};
export const DURATIONS = [60, 120, 180];
