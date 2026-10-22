// 町の設計図。建物を足す・アプリを付け替えるときは、ここだけ直せばよい。
// 座標はメートル。x が東、z が南。道は歩行者専用(車は来ない町)。
// face: 入口が向く方角 'n' | 's' | 'e' | 'w'
// app : 入ったときに開くアプリの id(src/apps/registry.js)

export const STREETS = [
  // [向き, 固定座標, 始まり, 終わり, 名前]
  ['ns', 0, -62, -15, 'きた通り'],
  ['ns', 0, 15, 64, 'みなみ商店街'],
  ['ew', 0, 15, 64, 'ひがし通り'],
  ['ew', 0, -64, -15, 'にし通り'],
  ['ew', -36, -30, 30, 'ぶんか通り'],
  ['ew', 36, -30, 30, 'ほし通り'],
];
export const ROAD_HALF = 4;   // 車道にあたる石畳の半分の幅
export const WALK = 2;        // 歩道の幅
export const PLAZA_R = 15;

export const LANDMARKS = [
  { id: 'school', name: 'まちの学校', x: 0, z: -70, w: 32, d: 14, h: 11, face: 's', wall: 0xfff4e0, roof: 'flat', trim: 0xee9a9a, sign: 'まちの学校', app: 'school', kind: 'school' },
  { id: 'library', name: '図書館', x: 11.5, z: -25, w: 13, d: 11, h: 8, face: 'w', wall: 0xc9b8ea, roof: 'gable', roofColor: 0x93b5e1, sign: '図書館', app: 'library', kind: 'library' },
  { id: 'gamecenter', name: 'ゲームセンター', x: -11.5, z: 25, w: 13, d: 11, h: 9, face: 'e', wall: 0xffb3c1, roof: 'flat', trim: 0xb79cd9, sign: 'GAME', app: 'punichunk', kind: 'arcade' },
  { id: 'shop', name: 'ショップ', x: 11, z: 25, w: 13, d: 10, h: 7, face: 'w', wall: 0xa8e6cf, roof: 'flat', trim: 0xffc8a2, sign: 'ショップ', app: 'shop', kind: 'shop' },
  { id: 'cafe', name: 'カフェ', x: -10.5, z: 48, w: 11, d: 9, h: 6, face: 'e', wall: 0xffd3b6, roof: 'gable', roofColor: 0xc9a28c, sign: 'カフェ', app: 'chunkcards', kind: 'cafe' },
  { id: 'home', name: 'あなたの家', x: 30, z: -10.5, w: 9, d: 9, h: 5.5, face: 's', wall: 0xfdeeb0, roof: 'gable', roofColor: 0xee9a9a, sign: 'HOME', app: 'home', kind: 'house' },
];

// 広い場所(建物でなく、町の中の区画)
export const AREAS = {
  park: { name: 'こもれび公園', x0: 20, x1: 62, z0: 7, z1: 31 },
  shrine: { name: 'ほしみや神社', x0: -57, x1: -33, z0: -31, z1: -7 },
};

// 町の中の調べられる物(建物の入口以外)
export const SPOTS = [
  { id: 'board', name: '掲示板', x: -9.5, z: -9.5, face: 'se', app: 'board', label: '掲示板を見る' },
  { id: 'omikuji', name: 'おさいせん箱', x: -45, z: -21.5, app: 'omikuji', label: 'おまいりする' },
  { id: 'busstop', name: 'バス停', x: -58, z: 6.2, app: null, label: 'バスを待つ', msg: 'となり町行きのバスは、まだ走っていないみたい。' },
];

// 歩くための道すじ(NPC と仮のプレイヤーが使う)
const N = {};
function node(id, x, z) { N[id] = { id, x, z, links: [] }; }
function chain(...ids) { for (let i = 1; i < ids.length; i++) { N[ids[i - 1]].links.push(ids[i]); N[ids[i]].links.push(ids[i - 1]); } }
[-60, -48, -36, -25, -16].forEach(z => node('ns' + z, 0, z));
[16, 25, 36, 47, 60].forEach(z => node('ns' + z, 0, z));
[16, 24, 30, 40, 48, 60].forEach(x => node('ew' + x, x, 0));
[-16, -25, -36, -45, -58].forEach(x => node('ew' + x, x, 0));
[-30, -18, 18, 30].forEach(x => { node('nc' + x, x, -36); node('sc' + x, x, 36); });
for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; node('p' + i, Math.sin(a) * 9.5, -Math.cos(a) * 9.5); }
node('pk1', 40, 11); node('pk2', 30, 19); node('pk3', 41, 26); node('pk4', 53, 20); node('pk5', 53, 10); node('pd1', 46, 22.5);
node('sh1', -45, -9); node('sh2', -45, -18);
chain('ns-60', 'ns-48', 'ns-36', 'ns-25', 'ns-16', 'p0');
chain('p4', 'ns16', 'ns25', 'ns36', 'ns47', 'ns60');
chain('p2', 'ew16', 'ew24', 'ew30', 'ew40', 'ew48', 'ew60');
chain('p6', 'ew-16', 'ew-25', 'ew-36', 'ew-45', 'ew-58');
chain('nc-30', 'nc-18', 'ns-36', 'nc18', 'nc30');
chain('sc-30', 'sc-18', 'ns36', 'sc18', 'sc30');
chain('p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p0');
chain('ew40', 'pk1', 'pk2', 'pk3', 'pk4', 'pk5', 'pk1');
chain('pk3', 'pd1', 'pk4');
chain('ew-45', 'sh1', 'sh2');
export const GRAPH = { nodes: N };

// NPC の予定で使う場所の名前 → 道すじの点
export const PLACES = {
  school: 'ns-60', library: 'ns-25', gamecenter: 'ns25', shop: 'ns25', cafe: 'ns47', home: 'ew30',
  plaza: 'p3', plaza2: 'p7', park: 'pk3', park2: 'pk4', pond: 'pd1', shrine: 'sh2', busstop: 'ew-58', north: 'nc18', south: 'sc-18',
};
