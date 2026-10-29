// 英語の釣り堀の「標本」と「水槽」の保存。釣りのアプリと、家の家具(furniture.js)の両方が使う。
//   釣り堀 = 単語ストリームの単語練習と同じセット(初級20語・中級25語・上級30語ずつ。id も同じ w1-3 など)
//   標本   = セットの単語がぜんぶ「完璧」になったらもらえる(1セットに1つ。同じセットをくり返しても増えない)
//            抜き打ちテストで成績が悪いと「ひび」が入る。そのセットをもう一度ぜんぶ完璧にすると直る
//   魚の標本 = 水槽で育てきった魚から作る
//   数字(1セットの語数・完璧の条件・水槽の大きさ・えさの数など)は、ここと fishing/en.js の上にまとめる
import { createStorage } from '../core/core.js';
import { SW } from '../apps/gamebox/stream_words.js';
import { FISH } from '../apps/fishing/data.js';

export const WSET = { 1: 20, 2: 25, 3: 30 };   // ストリームと同じ
export const LV_NAME = { 1: '初級', 2: '中級', 3: '上級' }, LV_SUB = { 1: '高校受験', 2: '共通テスト', 3: '難関大' };
export const TANK_MAX = 6;          // 水槽に入る魚の数
export const GROW_NEED = 10;        // 育ちきるまでのえさの数
export const FEED_PER_DAY = 2;      // 1匹が1日に食べられる数(育つのに日にちがかかる)

// ---- 標本の見た目と名前 ----
const KINDS = {
  1: [['貝がら', 'Seashell', 'shell'], ['巻き貝', 'Spiral Shell', 'conch'], ['小石', 'Pebble', 'stone'], ['ビーチグラス', 'Sea Glass', 'glass'], ['ウニのから', 'Urchin Shell', 'urchin'], ['ヒトデ', 'Starfish', 'star'], ['サンゴ', 'Coral', 'coral'], ['タコノマクラ', 'Sand Dollar', 'disc']],
  2: [['水晶', 'Quartz', 'crystal'], ['アンモナイト', 'Ammonite', 'ammonite'], ['三葉虫', 'Trilobite', 'trilobite'], ['サメの歯', 'Shark Tooth', 'tooth'], ['琥珀', 'Amber', 'amber'], ['黄鉄鉱', 'Pyrite', 'cube'], ['孔雀石', 'Malachite', 'stone'], ['葉の化石', 'Leaf Fossil', 'leaf']],
  3: [['ルビー', 'Ruby', 'gem', 0xe0115f], ['サファイア', 'Sapphire', 'gem', 0x2a5bd7], ['エメラルド', 'Emerald', 'gem', 0x1fa463], ['オパール', 'Opal', 'opal', 0xbfe6ff], ['真珠', 'Pearl', 'pearl', 0xf6f0e6], ['翡翠', 'Jade', 'stone', 0x4fae7c], ['ダイヤの原石', 'Rough Diamond', 'crystal', 0xe8f4ff], ['隕石', 'Meteorite', 'meteor', 0x5b5560]],
};
const COLORS = [['白', 'White', 0xf4f1ea], ['桜色', 'Pink', 0xf6b6c8], ['空色', 'Sky Blue', 0x9fd3f5], ['青', 'Blue', 0x3f74c9], ['緑', 'Green', 0x58b36b], ['黄色', 'Yellow', 0xf2d14c], ['オレンジ', 'Orange', 0xf29a3a], ['赤', 'Red', 0xd9443f],
  ['紫', 'Purple', 0x9a6cd0], ['茶色', 'Brown', 0x9a6a42], ['黒', 'Black', 0x3a3638], ['金色', 'Golden', 0xe0b443], ['銀色', 'Silver', 0xc9ced6], ['虹色', 'Rainbow', 0xc0a8f0], ['水色', 'Aqua', 0x7fe0d8]];
const VARIANT3 = [['', ''], ['きらめく', 'Shining '], ['古代の', 'Ancient ']];
export function lookOf(lv, k) {
  const K = KINDS[lv], kind = K[k % K.length], v = Math.floor(k / K.length);
  if (lv === 3) { const va = VARIANT3[v % VARIANT3.length]; return { lv, k, shape: kind[2], col: kind[3], name: va[0] + kind[0], en: va[1] + kind[1] }; }
  const c = COLORS[(v + 2 * (k % K.length)) % COLORS.length];   // 同じ種類でも色がぜんぶちがう・となりのセットは色もちがう
  return { lv, k, shape: kind[2], col: c[2], rainbow: c[0] === '虹色', name: `${c[0]}の${kind[0]}`, en: `${c[1]} ${kind[1]}` };
}

// ---- セット(釣り堀) ----
export const SETS = [];
for (const lv of [1, 2, 3]) {
  const n = WSET[lv], all = SW[lv], m = Math.ceil(all.length / n);
  for (let k = 0; k < m; k++) {
    const words = all.slice(k * n, k * n + n);
    SETS.push({ id: `w${lv}-${k + 1}`, lv, k, no: k + 1, words, look: lookOf(lv, k), title: `${LV_NAME[lv]} セット${k + 1}`, range: `${words[0][0]} 〜 ${words[words.length - 1][0]}` });
  }
}
export const SET = Object.fromEntries(SETS.map(s => [s.id, s]));
export const condOf = s => `${LV_NAME[s.lv]}の単語 セット${s.no}(${s.range})の${s.words.length}語を、ぜんぶ完璧にする`;
export const FISH_SPEC = FISH.filter(f => f.kind === 'fish');

// ---- 水槽の飾り(標本を混ぜてできる) ----
export const MIX_N = 3;                         // 混ぜる数(標本も魚も。仮)
export const RAR = ['N', 'R', 'SR', 'SSR'], RAR_PT = [1, 2, 4, 8];   // レア度の名前・水槽ランクのポイント(仮)
export const FISH_MAX_RANK = 2, RANK_PRE = ['', 'りっぱな', '伝説の'], RANK_MUL = [1, 1.4, 1.9];   // 魚を混ぜた強さ(仮)
// 標本の形の名前(レシピの表示用)
const SHAPE_JP = { 1: { shell: '貝がら', conch: '巻き貝', stone: '小石', glass: 'ビーチグラス', urchin: 'ウニのから', star: 'ヒトデ', coral: 'サンゴ', disc: 'タコノマクラ' },
  2: { crystal: '水晶', ammonite: 'アンモナイト', trilobite: '三葉虫', tooth: 'サメの歯', amber: '琥珀', cube: '黄鉄鉱', stone: '孔雀石', leaf: '葉の化石' },
  3: { gem: '宝石', opal: 'オパール', pearl: '真珠', stone: '翡翠', crystal: 'ダイヤの原石', meteor: '隕石' } };
export const shapeName = (lv, sh) => (SHAPE_JP[lv] && SHAPE_JP[lv][sh]) || sh;
// 飾りのレシピ(標本の形3つ → 飾り。順番は関係なし)。レベルごとに、レア度N→SSRの順(仮)
export const RECIPES = {
  1: [['shell', 'stone', 'glass'], ['coral', 'stone', 'urchin'], ['shell', 'conch', 'disc'], ['star', 'coral', 'glass']],
  2: [['stone', 'leaf', 'trilobite'], ['crystal', 'stone', 'cube'], ['ammonite', 'tooth', 'trilobite'], ['amber', 'crystal', 'ammonite']],
  3: [['stone', 'opal', 'crystal'], ['gem', 'gem', 'gem'], ['pearl', 'gem', 'opal'], ['meteor', 'crystal', 'gem']],
};
export const recipeFor = (lv, shapes) => { const k = shapes.slice().sort().join(); return (RECIPES[lv] || []).findIndex(r => r.slice().sort().join() === k); };   // 合うレア度(0〜3)・なければ -1
export const DECOR = {   // レベルごと、レア度の順(N→SSR)に4つ。[名前, English, 形]
  1: [['海そう', 'Seaweed', 'weed'], ['サンゴの岩', 'Coral Rock', 'coralrock'], ['貝がらのお城', 'Shell Castle', 'castle'], ['光る真珠貝', 'Glowing Pearl Shell', 'pearlshell']],
  2: [['化石の岩', 'Fossil Rock', 'fossil'], ['水晶のかたまり', 'Crystal Cluster', 'cluster'], ['古代の柱', 'Ancient Pillar', 'pillar'], ['琥珀のあかり', 'Amber Lamp', 'lamp']],
  3: [['小さな宝箱', 'Small Chest', 'chest'], ['宝石の山', 'Gem Pile', 'gempile'], ['金の宝箱', 'Golden Chest', 'goldchest'], ['星のかけら', 'Star Fragment', 'star']],
};
export const DECOR_ICON = { weed: '🌿', coralrock: '🪸', castle: '🏰', pearlshell: '🦪', fossil: '🪨', cluster: '🔮', pillar: '🏛️', lamp: '🏮', chest: '🧰', gempile: '💎', goldchest: '👑', star: '🌠' };
export const TANK_RANKS = [[0, 'ふつうの水槽'], [3, '飾りつきの水槽'], [8, '豪華な水槽'], [16, '特別な水槽']];   // [必要ポイント, 名前]
export const decorOf = d => { const k = DECOR[d.lv][d.rar]; return { name: k[0], en: k[1], shape: k[2], icon: DECOR_ICON[k[2]] }; };

// ---- 水槽の「元気」と「汚れ」(要素だけ。いまは何も起きない。あとで弱る・そうじを入れるときの置き場) ----
//   enabled を true にして、ここの数字を使う処理を足すだけで動かせるようにしてある(魚ごとの元気 vigor は 0〜1、水槽の汚れ dirt は 0〜1)
export const CARE = { enabled: false, weakAfterDays: 3, dirtPerDay: 0.2, cleanCost: 0 };
export const vigorOf = f => (f && f.vigor != null ? f.vigor : 1);

// ---- 保存 ----
const st = createStorage('town:spec:');
export const spec = {
  own: () => st.get('own') || {},                 // {セットid: {at, crack}}
  has(id) { return !!this.own()[id]; },
  cracked(id) { const o = this.own()[id]; return !!(o && o.crack); },
  give(id) { const o = this.own(); if (o[id]) return false; o[id] = { at: Date.now(), crack: 0 }; st.set('own', o); return true; },
  setCrack(id, v) { const o = this.own(); if (!o[id]) return; o[id].crack = v ? 1 : 0; st.set('own', o); },
  // 完璧の印(セットの何番目の語か)
  perf(id) { return st.get('perf:' + id) || []; },
  setPerf(id, i, v) { const p = this.perf(id).slice(); p[i] = v ? 1 : 0; st.set('perf:' + id, p); return p; },
  perfCount(id) { const s = SET[id]; if (!s) return 0; const p = this.perf(id); return s.words.reduce((a, _, i) => a + (p[i] ? 1 : 0), 0); },
  // 混ぜて使った標本(持ち物からは消えるが、アルバムには残る)
  use(id) { const o = this.own(); if (o[id]) { o[id].used = 1; st.set('own', o); } },
  drop(id) { const o = this.own(); if (o[id]) { delete o[id]; st.set('own', o); } st.set('perf:' + id, []); },   // 運営テスト用:標本をなかったことにする
  isUsed(id) { const o = this.own()[id]; return !!(o && o.used); },
  recipes: () => st.get('recipes') || [],         // 見つけたレシピ 'lv:rar'
  addRecipe(k) { const r = this.recipes(); if (!r.includes(k)) { r.push(k); st.set('recipes', r); } },
  decor: () => st.get('decor') || [],             // [{uid, lv, rar, at}] できた飾り
  addDecor(d) { const l = this.decor(); l.push(d); st.set('decor', l); },
  grown: () => st.get('grown') || [],             // 水槽で育てきった魚の種類(アルバム)
  markGrown(id, rk = 0) { const g = this.grown(); if (!g.includes(id)) { g.push(id); st.set('grown', g); } if (rk > 0) { const b = this.fishBest(); if ((b[id] || 0) < rk) { b[id] = rk; st.set('fishBest', b); } } },
  fishBest: () => st.get('fishBest') || {},      // 魚の種類ごとの、いちばん強くした段階
  pts() { return this.decor().reduce((a, d) => a + RAR_PT[d.rar], 0); },
  rank() { const p = this.pts(); let r = 0; TANK_RANKS.forEach((x, i) => { if (p >= x[0]) r = i; }); return r; },
  played: () => st.get('played') || [],          // 釣ったことのあるセット(新しい順)
  markPlayed(id) { const p = this.played().filter(x => x !== id); p.unshift(id); st.set('played', p.slice(0, 40)); },
  test: () => st.get('test') || { last: 0 },
  setTest(v) { st.set('test', v); },
  // 水槽
  tank: () => st.get('tank') || [],
  saveTank: v => st.set('tank', v),
  tankState: () => st.get('tankState') || { dirt: 0, cleanedAt: null },   // 水槽のよごれ(要素だけ)
  saveTankState: v => st.set('tankState', v),
  food: () => st.get('food') || 0,
  setFood: n => st.set('food', Math.max(0, n | 0)),
  // 図鑑の枠(持ち魚)。最初は1枠。ふやすのはコイン2回・ダイヤ1回
  box: () => st.get('box') || [],
  saveBox: v => st.set('box', v),
  boxSlots: () => 1 + Math.min(3, st.get('boxX') | 0),
  addBoxSlot() { st.set('boxX', Math.min(3, (st.get('boxX') | 0) + 1)); },
  full: () => st.get('full') || {},          // 満腹コインをもらった魚の種類
  saveFull: v => st.set('full', v),
  hasTank: () => !!st.get('tankGot'),
  gotTank: () => st.set('tankGot', 1),
};
