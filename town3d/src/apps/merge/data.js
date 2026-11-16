// マージゲームの設定表。数値・品物・レシピはここだけ直せばよい(試遊で調整する仮の値)。
// 絵はあとで差し替える: IMG に { 'cafeA1': 'merge/cafeA1.png' } のように足すと、絵文字の代わりにその画像を出す。
import { IMG_DATA } from './img.js';
export const IMG = IMG_DATA;
export const CFG = {
  cols: 7, rows: 9,
  enMax: 100, enStart: 100, regenSec: 90,      // エネルギー: 上限・はじめ・自然回復(1回復の秒数)
  quizGain: 1,                                  // 英語4択 正解1回の回復(学習の回復は上限なし)
  genMax: 5, partMax: 3,                        // 生成機の最大Lv / パーツ Lv3 同士で生成機 Lv1
  genCharge: lv => 12 + lv * 4, genRecharge: 150, // 生成機: 続けて出せる回数 / 使い切ったあとの休み(秒)
  spawnR: lv => 0.16 + lv * 0.06, spawnTop: lv => Math.min(5, 1 + lv),   // 上位品の出やすさ / 出る最高Lv
  sell: [1, 2, 4, 7, 12, 20, 32, 50, 80], partSell: 5,
  slots0: 3, slotsMax: 10, slotPrice: n => 100 * Math.pow(2, n - 3),      // 保管枠
  partChance: 0.25,                             // 住人にわたした時に、生成機パーツがもらえる確率
  affOf: lv => (lv <= 3 ? 1 : lv <= 5 ? 2 : 3), coinOf: lv => lv * 3,     // わたした時の 好感度 / コイン
  vis: 7, wants: 2,                              // 画面に出す住人の数 / 1人がほしがる品の数
  orderLv: cycle => 3 + Math.min(4, Math.floor(cycle * 0.6)),            // 住人のほしい品のLv(周回で上がる。±1ばらつく)
  genUnlock: { tool: 300, sea: 600, sew: 900 },   // 生成機のロックをはずす「ほかの勉強」の合計秒数(カード・学校・図書館・英語のおしゃべりなど。マージの中の4択はふくまない)
  cycleCoin: c => Math.min(300, 100 + c * 50), giftN: 8, giftMin: 2, giftMax: 4,   // 13人完了: コイン / チャンクくんが運ぶ品の数とLv
  comboSec: 2.6, comboEnergy: 5,                // 連続マージ: この秒数以内でコンボ / 5コンボごとに⚡+1
  newCoin: lv => lv * 2,                        // はじめて作った品のボーナス
};
const L = (name, color, items, mergeMax) => ({ name, color, items, mergeMax });
export const LINES = {
  cafeA: L('スイーツ', '#ff9db5', [['クッキー', '🍪', 'cookie'], ['カップケーキ', '🧁', 'cupcake'], ['ドーナツ', '🍩', 'donut'], ['プリン', '🍮', 'pudding'], ['ショートケーキ', '🍰', 'shortcake'], ['チョコケーキ', '🎂', 'chocolate cake'], ['いちごタルト', '🍓', 'strawberry tart'], ['パフェ', '🍨', 'parfait'], ['プリンアラモード', '🍧', 'pudding a la mode']], 8),
  cafeB: L('ドリンク・軽食', '#ffc266', [['コーヒー', '☕', 'coffee'], ['オレンジジュース', '🧃', 'orange juice'], ['ホットココア', '🥛', 'hot cocoa'], ['抹茶ラテ', '🍵', 'matcha latte'], ['クロワッサン', '🥐', 'croissant'], ['サンドイッチ', '🥪', 'sandwich'], ['おだんご', '🍡', 'dango'], ['ワイン', '🍷', 'wine'], ['豪華なカフェセット', '🫖', 'deluxe cafe set']], 8),
  toolA: L('家具', '#c99a6b', [['木材', '🪵', 'lumber'], ['小さなスツール', '🥁', 'small stool'], ['いす', '🪑', 'chair'], ['ひじかけいす', '💺', 'armchair'], ['ソファ', '🛋️', 'sofa'], ['ローテーブル', '🗄️', 'coffee table'], ['ダイニングテーブル', '🍽️', 'dining table'], ['ピアノ', '🎹', 'piano']]),
  toolB: L('照明', '#ffe14d', [['キャンドル', '🕯️', 'candle'], ['ランプ', '🪔', 'lamp'], ['フロアライト', '🔦', 'floor light'], ['ペンダントライト', '💡', 'pendant light'], ['ウォールライト', '🏮', 'wall light'], ['ネオンサイン', '🔆', 'neon sign'], ['イルミネーション', '🎇', 'illuminations'], ['豪華なシャンデリア', '🌟', 'grand chandelier']]),
  seaA: L('海の装飾', '#6fd0ea', [['渚の石だたみ', '🪨', 'seaside cobblestones'], ['貝殻の風鈴', '🐚', 'seashell wind chime'], ['硝子のしずく灯', '💧', 'glass drop lantern'], ['サンゴの小島', '🪸', 'coral islet'], ['星屑のランタン', '⭐', 'stardust lantern'], ['貝殻の城', '🏰', 'seashell castle'], ['星降る珊瑚礁', '🌠', 'starry coral reef'], ['海神の宝珠', '🔮', 'sea god\'s orb']]),
  seaB: L('化石・宝石', '#a99cf2', [['葉脈の化石壁', '🍃', 'leaf-vein fossil wall'], ['三葉虫の足あと', '🐾', 'trilobite tracks'], ['水晶の群晶', '💠', 'crystal cluster'], ['アンモナイトの噴水', '🐌', 'ammonite fountain'], ['古代の柱', '🏛️', 'ancient pillar'], ['結晶の洞窟', '⛰️', 'crystal cave'], ['虹の宝石箱', '🌈', 'rainbow jewel box'], ['星のかけらの王冠', '👑', 'star-fragment crown']]),
  sewA: L('男性ファッション', '#7fb2f5', [['靴下', '🧦', 'socks'], ['Tシャツ', '👕', 'T-shirt'], ['シャツ', '👔', 'shirt'], ['ジーンズ', '👖', 'jeans'], ['パーカー', '🧥', 'hoodie'], ['ジャケット', '🥼', 'jacket'], ['スーツ', '🕴️', 'suit'], ['タキシード', '🤵', 'tuxedo']]),
  sewB: L('女性ファッション', '#f59ae0', [['リボン', '🎀', 'ribbon'], ['ヘアゴム', '➰', 'hair tie'], ['ブラウス', '👚', 'blouse'], ['スカート', '🩳', 'skirt'], ['カーディガン', '🧶', 'cardigan'], ['ワンピース', '👗', 'one-piece dress'], ['ドレス', '💃', 'evening dress'], ['ウェディングドレス', '👰', 'wedding dress']]),
};
export const GENS = {
  cafe: { name: 'カフェ', icon: '🏪', lines: ['cafeA', 'cafeB'], color: '#ff8aa6', dark: '#c2335b' },
  tool: { name: '工具箱', icon: '🧰', lines: ['toolA', 'toolB'], color: '#e8a24a', dark: '#9a5a12' },
  sea: { name: '海の宝箱', icon: '💰', lines: ['seaA', 'seaB'], color: '#4cc3e3', dark: '#1a7a96' },
  sew: { name: '裁縫箱', icon: '🧵', lines: ['sewA', 'sewB'], color: '#b48af0', dark: '#6a3fb5' },
};
// 特別合成(仮): カフェ Lv9 は、同じもの2個ではなく、きまった2品を重ねて作る。[ライン, Lv]
export const RECIPES = [
  { a: ['cafeA', 8], b: ['cafeA', 4], out: ['cafeA', 9] },   // パフェ + プリン → プリンアラモード
  { a: ['cafeB', 8], b: ['cafeA', 7], out: ['cafeB', 9] },   // ワイン + いちごタルト → 豪華なカフェセット
];
export const NPCS = ['sora', 'hana', 'mii', 'baron', 'gon', 'koharu', 'shiori', 'maru', 'yuzu', 'choco', 'tetsu', 'suna', 'luna'];
// 4択が外から来ないとき(町だけで動かすとき)の予備
export const QUIZ_FB = [['coffee', 'コーヒー'], ['chair', 'いす'], ['shell', '貝がら'], ['dress', 'ドレス'], ['candle', 'ろうそく'], ['cake', 'ケーキ'], ['lamp', 'ランプ'], ['sock', 'くつ下'], ['crown', '王冠'], ['castle', '城'], ['juice', 'ジュース'], ['shirt', 'シャツ'], ['wood', '木材'], ['ribbon', 'リボン'], ['piano', 'ピアノ'], ['fossil', '化石']];

// お題(章): 上に出す目標。keys のうち n 種類を作ると達成 → コイン
export const GOALS = [
  { t: 'カフェの人気メニュー(Lv5以上)を2しゅるい作ろう', keys: ['cafeA5', 'cafeA6', 'cafeA7', 'cafeA8', 'cafeB5', 'cafeB6', 'cafeB7', 'cafeB8'], n: 2, coin: 60 },
  { t: 'ソファ(Lv5)を作って、お店に家具を並べよう', keys: ['toolA5'], n: 1, coin: 80 },
  { t: '貝殻の城(Lv6)を作って、海のお屋敷をかざろう', keys: ['seaA6'], n: 1, coin: 100 },
  { t: 'ドレス(Lv7)を作って、おしゃれな町にしよう', keys: ['sewB7', 'sewA7'], n: 1, coin: 120 },
  { t: 'ワインを作って、カフェの大人メニューをふやそう', keys: ['cafeB8'], n: 1, coin: 150 },
  { t: 'ピアノ(Lv8)を作って、町に音楽をとどけよう', keys: ['toolA8'], n: 1, coin: 200 },
  { t: 'プリンアラモード(Lv9)で、スペシャルな一皿を作ろう', keys: ['cafeA9'], n: 1, coin: 250 },
  { t: 'ウェディングドレスと王冠を作って、町いちばんの結婚式を!', keys: ['sewB8', 'seaB8'], n: 2, coin: 400 },
];

// 住人ごとの、よく頼む系統(fav)と、頼む段階のかたより(lv: -1ひくめ / 0ふつう / 1たかめ)
export const TEND = {
  sora: { fav: ['cafeA', 'toolB'], lv: 0 }, hana: { fav: ['cafeA', 'sewB'], lv: 0 }, mii: { fav: ['cafeB', 'cafeA'], lv: 0 },
  baron: { fav: ['cafeB', 'toolA'], lv: 1 }, gon: { fav: ['toolA', 'toolB'], lv: -1 }, koharu: { fav: ['cafeB', 'sewA'], lv: 0 },
  shiori: { fav: ['toolB', 'sewB'], lv: 0 }, maru: { fav: ['seaA', 'toolA'], lv: 0 }, yuzu: { fav: ['sewB', 'seaB'], lv: 0 },
  choco: { fav: ['cafeA', 'sewA'], lv: -1 }, tetsu: { fav: ['toolA', 'seaB'], lv: 1 }, suna: { fav: ['seaA', 'seaB'], lv: 0 }, luna: { fav: ['seaB', 'sewB'], lv: 1 },
};
// 2つの注文の組み合わせ(やさしい=e / ふつう=m / むずかしい=h)
export const PATTERNS = [['e', 'h', 20], ['m', 'm', 16], ['e', 'e', 12], ['x', 'm', 16], ['x', 'e', 10], ['h', 'h', 4], ['m', 'h', 14], ['x', 'h', 8]];
export const LVR = { x: [1, 2], e: [2, 3, 4], m: [4, 5], h: [6, 7] };
