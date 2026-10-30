// 「調べる」:町のあちこちに隠れているもの(単語・表現・格言・短い英文・町のたからもの)と、宝探し大会。
//   毎日かわる場所(きょうのかくれもの)+ ずっと同じ場所(町のたからもの・1回だけ)+ 運営が置く宝探し(apps/hunt.json と、運営テストで置いたもの)
//   近く(1.6m)まで行くと「🔍 調べる」が出る。目印は出さない(占い師・哲学者が手がかりをくれる)
import { createStorage } from '../core/core.js';
import { GRAPH } from '../world/town_data.js';
import { HUNTS } from './hunt_data.js';
const st = createStorage('town:find:');
export const dayKey = () => { const d = new Date(Date.now() - 4 * 36e5); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const hash = n => { let x = (n * 2654435761) >>> 0; x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d) >>> 0; x ^= x >>> 12; x = Math.imul(x, 0x297a2d39) >>> 0; x ^= x >>> 15; return (x >>> 0) / 4294967296; };
const dayNum = () => { const d = new Date(Date.now() - 4 * 36e5); return d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); };

// ---- 中身 ----
export const WORDS = [['serendipity', '思いがけない幸運'], ['cozy', '居心地のいい'], ['whisper', 'ささやく'], ['glimpse', 'ちらっと見ること'], ['treasure', '宝物'], ['curious', '好奇心の強い'], ['breeze', 'そよ風'], ['sparkle', 'きらめく'], ['wander', 'ぶらぶら歩く'], ['hidden', '隠れた'], ['lantern', 'ちょうちん・ランタン'], ['puddle', '水たまり'], ['footprint', '足あと'], ['shortcut', '近道'], ['souvenir', 'おみやげ'], ['ancient', '大昔の'], ['delight', '大喜び'], ['mysterious', 'なぞめいた'], ['shelter', '雨やどりの場所'], ['nostalgic', 'なつかしい']];
export const PHRASES = [['Keep your eyes peeled.', 'よく目をこらしてね'], ['It\'s on the tip of my tongue.', 'のどまで出かかってる'], ['Long time no see!', 'ひさしぶり!'], ['Take your time.', 'ゆっくりでいいよ'], ['What a small world!', '世間はせまいね!'], ['I\'m all ears.', 'しっかり聞いてるよ'], ['That rings a bell.', 'それ、聞き覚えがある'], ['Fingers crossed!', 'うまくいきますように!'], ['Better safe than sorry.', '用心するに越したことはない'], ['You made my day!', 'あなたのおかげで最高の日になった!'], ['Speak of the devil.', 'うわさをすれば'], ['Count me in!', 'わたしも入れて!']];
export const PROVERBS = [['Little by little, one travels far.', '少しずつでも、遠くまで行ける', 'ことわざ(スペイン)'], ['Every cloud has a silver lining.', 'どんな雲にも銀のふちどりがある(悪いことにも良い面がある)', 'ことわざ'], ['Where there\'s a will, there\'s a way.', '意志あるところに道は開ける', 'ことわざ'], ['Practice makes perfect.', '練習で完璧になる', 'ことわざ'], ['Actions speak louder than words.', '行動はことばより雄弁だ', 'ことわざ'], ['The early bird catches the worm.', '早起きの鳥は虫をつかまえる', 'ことわざ'], ['Rome wasn\'t built in a day.', 'ローマは1日にしてならず', 'ことわざ'], ['Knowledge is power.', '知は力なり', 'フランシス・ベーコン'], ['Two heads are better than one.', '三人寄れば文殊の知恵(ふたりの頭はひとりにまさる)', 'ことわざ'], ['A journey of a thousand miles begins with a single step.', '千里の道も一歩から', '老子'], ['When in Rome, do as the Romans do.', '郷に入っては郷に従え', 'ことわざ'], ['Don\'t judge a book by its cover.', '見かけで判断するな', 'ことわざ']];
export const PASSAGES = [
  ['The old bench in the park has seen many seasons. Children sit on it after school, and old friends talk there at sunset. If benches could speak, this one would have a thousand stories.', '公園の古いベンチは、たくさんの季節を見てきた。放課後には子どもたちがすわり、夕暮れには古い友だちが語り合う。もしベンチが話せたら、このベンチには千の物語があるだろう。'],
  ['Every morning, the baker opens the window and lets the smell of fresh bread fill the street. People say the whole town wakes up because of that smell.', '毎朝、パン屋さんは窓を開けて、焼きたてのパンのにおいを通りいっぱいに広げる。町じゅうがそのにおいで目を覚ますのだと、みんなは言う。'],
  ['A small paper boat floated down the river after the rain. Nobody knew who had made it, but everyone who saw it smiled and waved goodbye.', '雨のあと、小さな紙の舟が川を流れていった。だれが作ったのかはだれも知らなかったが、見た人はみんな笑って手をふった。'],
  ['The shrine cat sleeps on the stone steps all afternoon. When the bell rings in the evening, it stretches, yawns, and walks home as if it had worked hard all day.', '神社のねこは、午後のあいだずっと石段で眠っている。夕方に鐘が鳴ると、のびをして、あくびをして、まるで一日じゅう働いたかのように家へ帰っていく。'],
  ['Learning a language is like planting a garden. You will not see flowers on the first day, but if you water it every day, one morning the garden will be full of color.', '言葉を学ぶのは、庭に種をまくようなもの。最初の日には花は見えないけれど、毎日水をやれば、ある朝、庭は色であふれている。'],
  ['On the last bus of the night, the driver always says, "Sleep well." Only a few people are on the bus, but those two words make everyone feel warm.', '夜の最終バスで、運転手さんはいつも「おやすみなさい」と言う。乗っているのは数人だけだが、そのひとことで みんなの心があたたかくなる。'],
];
export const TREASURES = [
  ['🪙', '古いコイン', '町ができた年の記念コイン'], ['🔮', 'ビー玉', '中に小さな星が見える'], ['🍀', '四つ葉のクローバー', '見つけた人に小さな幸運'], ['✉️', '古い手紙', '「いつかまた、この町で」と書いてある'],
  ['🗝️', '小さなかぎ', 'どこの扉のかぎだろう?'], ['📮', '古い切手', 'となり町の消印つき'], ['🧭', 'こわれたコンパス', 'なぜかいつも神社の方を向く'], ['🎐', '風鈴', 'ふると、すずしい音がする'],
  ['🪶', '青い羽根', 'めずらしい鳥のもの'], ['🐚', '虹色の貝ボタン', 'だれかの服から落ちたもの'], ['🗺️', '古地図の切れはし', '町の昔の形がかいてある'], ['⭐', '星形の小石', '流れ星のかけら…かも?'],
];
// ずっと同じ場所のたからもの(1回だけ)。場所 = 道すじの点 + ずらし
const FIXED = [['pk2', 1.2, 1.0], ['sh1', 2.4, -1.5], ['ew-58', 0.5, -1.8], ['nc30', -1.5, 1.2], ['sc-30', 1.4, -1.2], ['ns-60', 2.0, 2.5], ['ew60', -1.0, 1.6], ['ns60', -1.6, -1.0], ['p1', 1.0, 1.0], ['pd1', -1.8, 1.4], ['nc-30', 1.2, -1.5], ['ew-25', 0.8, 1.8]];

// ---- 場所 ----
const nodeIds = Object.keys(GRAPH.nodes).sort();
function dailySpots(n = 6) {
  const out = [], used = new Set(), d = dayNum();
  for (let i = 0; out.length < n && i < 60; i++) {
    const id = nodeIds[Math.floor(hash(d * 31 + i * 7 + 1) * nodeIds.length)]; if (used.has(id)) continue; used.add(id);
    const nd = GRAPH.nodes[id], a = hash(d * 13 + i) * 6.283, r = 1 + hash(d * 17 + i) * 1.8;
    const kind = ['word', 'word', 'phrase', 'phrase', 'proverb', 'passage'][out.length % 6];
    const pool = { word: WORDS, phrase: PHRASES, proverb: PROVERBS, passage: PASSAGES }[kind], c = pool[Math.floor(hash(d * 7 + i * 3 + 5) * pool.length)];
    out.push({ key: `d:${dayKey()}:${out.length}`, x: nd.x + Math.cos(a) * r, z: nd.z + Math.sin(a) * r, kind, c, node: id });
  }
  return out;
}
const fixedSpots = () => FIXED.map(([id, dx, dz], i) => { const nd = GRAPH.nodes[id]; return nd ? { key: 'f:' + i, x: nd.x + dx, z: nd.z + dz, kind: 'treasure', c: TREASURES[i % TREASURES.length], node: id } : null; }).filter(Boolean);

// ---- 宝探し大会(運営が決める) ----
//   形: { id, x, z, day:'2026-10-30'(空ならいつでも), title, text, ja, coins }
let huntFile = HUNTS.slice(), areaFn = (x, z) => `(${Math.round(x)}, ${Math.round(z)})のあたり`;
export const setAreaName = fn => { areaFn = fn; };
export function loadHuntFile(url = 'apps/hunt.json') { try { fetch(url, { cache: 'no-store' }).then(r => r.ok ? r.json() : []).then(j => { const L = Array.isArray(j) ? j : j && Array.isArray(j.items) ? j.items : []; const ids = new Set(huntFile.map(h => h.id)); huntFile = huntFile.concat(L.filter(h => h && !ids.has(h.id))); }).catch(() => { }); } catch (e) { } }   // 置いてあれば足す(なくてもいい)
const dayIso = () => { const d = new Date(Date.now() - 4 * 36e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export const finds = {
  got() { return st.get('got') || {}; },
  has(key) { return !!this.got()[key]; },
  hunts() { return [...huntFile, ...(st.get('hunt') || [])]; },
  huntsToday() { const t = dayIso(); return this.hunts().filter(h => !h.day || h.day === t); },
  spots() {
    const g = this.got();
    return [...dailySpots(), ...fixedSpots(), ...this.huntsToday().map(h => ({ key: 'h:' + h.id, x: h.x, z: h.z, kind: 'hunt', c: h }))].filter(s => !g[s.key]);
  },
  near(x, z, r = 1.6) { let best = null, bd = r; for (const s of this.spots()) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; best = s; } } return best; },
  take(s) { const g = this.got(); if (g[s.key]) return false; g[s.key] = Date.now(); st.set('got', g); if (s.kind === 'treasure') { const T = st.get('tre') || []; if (!T.includes(s.c[1])) { T.push(s.c[1]); st.set('tre', T); } } return true; },
  treasures() { return st.get('tre') || []; },
  addTreasure(name) { const T = this.treasures(); if (!T.includes(name)) { T.push(name); st.set('tre', T); } },
  // 手がかり(占い・哲学者):まだ見つけていない、きょうのかくれものの近くの場所の名前
  hint(areaName = areaFn) {
    const s = this.spots().filter(x => x.kind !== 'treasure'); const f = s.length ? s[Math.floor(Math.random() * s.length)] : this.spots()[0];
    if (f) { const H = st.get('hinted'), d = dayKey(), cur = H && H.day === d ? H.keys : []; if (!cur.includes(f.key)) cur.push(f.key); st.set('hinted', { day: d, keys: cur }); }   // 地図に印を出す(きょうの分だけ)
    return f ? areaName(f.x, f.z) : null;
  },
  // 占い・ヒントでありかを教えてもらった、まだ見つけていない場所(地図の印とキラッに使う)
  hinted() { const H = st.get('hinted'); if (!H || H.day !== dayKey()) return []; return this.spots().filter(s => H.keys.includes(s.key)); },
  // 運営テスト:ここに隠す / けす
  addHunt(h) { const L = st.get('hunt') || []; L.push({ id: 'h' + Date.now().toString(36), ...h }); st.set('hunt', L); },
  removeHunt(id) { st.set('hunt', (st.get('hunt') || []).filter(h => h.id !== id)); const g = this.got(); delete g['h:' + id]; st.set('got', g); },
  localHunts() { return st.get('hunt') || []; },
  resetHuntFound() { const g = this.got(); Object.keys(g).filter(k => k.startsWith('h:')).forEach(k => delete g[k]); st.set('got', g); },
};
