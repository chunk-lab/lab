// 家具のデータと、持ち物・家(部屋)・配置の保存。ショップと家のアプリで共有する。
// 家具を増やすときは ITEMS に1件足すだけ(build が見た目、w×d が床のマス数、cat がショップの分類)。
//   ふつうの家具 … 床に置く。どんな物の上にも置ける(重ねられる)
//   wall:true     … 壁にかける(ポスター・鏡・棚・窓・壁のあかり)。w は壁にそった幅。モデルは壁にふれる面が z=0、手前に出る
//   ceil:true     … 天井からつるす(ペンダントライト)
//   flat:true     … ラグ。いつも一番下に敷く
// 位置の単位は「半マス」(1マス=U=2)。真ん中にも置ける。
import * as THREE from 'three';
import { createStorage } from '../core/core.js';

export const U = 2;                 // 1マス = 2単位(半マス刻み)
export const WALL_H = 3.4;          // 壁・天井の高さ
export const MAX_OWN = 10;          // 同じ家具は10個まで(家が広がるので)
export const SIDE_MIN = 4, SIDE_MAX = 20;   // 部屋の一辺(マス)の下限・上限
export const ROOM = 8;              // はじめの部屋の広さ(8×8マス)
export const CATS = ['すべて', 'ねる・すわる', 'つくえ・しゅうのう', 'あかり', 'かべ', 'かざり'];

const mat = c => new THREE.MeshLambertMaterial({ color: c });
const glow = (m, c) => { m.material.emissive = new THREE.Color(c); return m; };
function box(g, w, h, d, c, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
  m.position.set(x, y + h / 2, z); g.add(m); return m;
}
function cyl(g, r, h, c, x, y, z, r2 = r) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, h, 20), mat(c));
  m.position.set(x, y + h / 2, z); g.add(m); return m;
}
function ball(g, r, c, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat(c));
  m.position.set(x, y, z); g.add(m); return m;
}
// 正面(+z)を向いた円ばん(時計・まるい鏡)。中心の高さ y
function disc(g, r, t, c, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, t, 28), mat(c));
  m.rotation.x = Math.PI / 2; m.position.set(x, y, z); g.add(m); return m;
}

// 原点が床の中心、正面は +z。大きさは w×d マス(1マス=1)。壁かけは「壁にふれる面が z=0」「幅の中心が x=0」。
export const ITEMS = [
  { id: 'bed', cat: 'ねる・すわる', name: 'ベッド', price: 700, w: 2, d: 3, build(g) {
    box(g, 1.9, 0.35, 2.9, 0xf3d9b1, 0, 0, 0); box(g, 1.8, 0.28, 2.6, 0xffc2d1, 0, 0.35, 0.1);
    box(g, 1.8, 0.2, 0.12, 0xf3d9b1, 0, 0.35, -1.42); box(g, 1.2, 0.18, 0.55, 0xffffff, 0, 0.63, -0.95); } },
  { id: 'sofa', cat: 'ねる・すわる', name: 'ソファ', price: 500, w: 3, d: 1, build(g) {
    box(g, 2.9, 0.4, 0.95, 0xb9a6e6, 0, 0, 0); box(g, 2.9, 0.55, 0.28, 0xa793d9, 0, 0.4, -0.36);
    box(g, 0.28, 0.35, 0.8, 0xa793d9, -1.31, 0.4, 0.05); box(g, 0.28, 0.35, 0.8, 0xa793d9, 1.31, 0.4, 0.05); } },
  { id: 'lowtable', cat: 'つくえ・しゅうのう', name: 'ローテーブル', price: 300, w: 2, d: 1, build(g) {
    box(g, 1.8, 0.1, 0.85, 0xe8c9a0, 0, 0.35, 0);
    for (const sx of [-0.8, 0.8]) for (const sz of [-0.32, 0.32]) box(g, 0.1, 0.35, 0.1, 0xd0ae84, sx, 0, sz); } },
  { id: 'dining', cat: 'つくえ・しゅうのう', name: 'ダイニングテーブル', price: 500, w: 2, d: 2, build(g) {
    box(g, 1.9, 0.12, 1.9, 0xefd3a8, 0, 0.62, 0);
    for (const sx of [-0.8, 0.8]) for (const sz of [-0.8, 0.8]) box(g, 0.12, 0.62, 0.12, 0xd6b588, sx, 0, sz); } },
  { id: 'chair', cat: 'ねる・すわる', name: 'いす', price: 150, w: 1, d: 1, build(g) {
    box(g, 0.7, 0.1, 0.7, 0xffd6a5, 0, 0.35, 0); box(g, 0.7, 0.6, 0.1, 0xffd6a5, 0, 0.45, -0.3);
    for (const sx of [-0.28, 0.28]) for (const sz of [-0.28, 0.28]) box(g, 0.08, 0.35, 0.08, 0xe0b88a, sx, 0, sz); } },
  { id: 'shelf', cat: 'つくえ・しゅうのう', name: '本だな', price: 400, w: 2, d: 1, build(g) {
    box(g, 1.9, 1.9, 0.8, 0xe3c39a, 0, 0, 0);
    const cs = [0xff9aa2, 0xa8e6cf, 0xb5b9ff, 0xffe29a, 0xc7ceea];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) box(g, 0.2, 0.42, 0.55, cs[(i + r) % 5], -0.75 + i * 0.3, 0.12 + r * 0.6, 0.15);
  } },
  { id: 'rug', cat: 'かざり', name: 'まるいラグ', price: 250, w: 3, d: 3, flat: true, build(g) {
    cyl(g, 1.4, 0.04, 0xffd6e0, 0, 0, 0); cyl(g, 1.0, 0.05, 0xfff1f5, 0, 0, 0); } },
  { id: 'lamp', cat: 'あかり', name: 'ランプ', price: 200, w: 1, d: 1, build(g) {
    cyl(g, 0.22, 0.06, 0xd8c3a5, 0, 0, 0); cyl(g, 0.04, 1.1, 0xd8c3a5, 0, 0.06, 0);
    const s = cyl(g, 0.32, 0.4, 0xfff0a8, 0, 1.1, 0, 0.18); s.material.emissive = new THREE.Color(0x665520); } },
  { id: 'plant', cat: 'かざり', name: '植木ばち', price: 150, w: 1, d: 1, build(g) {
    cyl(g, 0.28, 0.4, 0xf1a894, 0, 0, 0, 0.34); ball(g, 0.38, 0x8fd19e, 0, 0.75, 0); ball(g, 0.26, 0xa8e6b7, 0.18, 1.0, 0.05); } },
  { id: 'tv', cat: 'つくえ・しゅうのう', name: 'テレビ', price: 800, w: 2, d: 1, build(g) {
    box(g, 1.8, 0.5, 0.7, 0xf0e2cc, 0, 0, 0); box(g, 1.5, 0.9, 0.08, 0x3b3550, 0, 0.55, 0); box(g, 1.38, 0.78, 0.02, 0x9fd8ff, 0, 0.61, 0.05); } },
  { id: 'bear', cat: 'かざり', name: 'くまのぬいぐるみ', price: 200, w: 1, d: 1, build(g) {
    ball(g, 0.3, 0xd9a577, 0, 0.3, 0); ball(g, 0.22, 0xd9a577, 0, 0.7, 0.03);
    ball(g, 0.09, 0xd9a577, -0.17, 0.88, 0.03); ball(g, 0.09, 0xd9a577, 0.17, 0.88, 0.03); ball(g, 0.07, 0x4a3b3b, 0, 0.7, 0.24); } },
  { id: 'chest', cat: 'つくえ・しゅうのう', name: 'チェスト', price: 250, w: 1, d: 1, build(g) {
    box(g, 0.9, 0.8, 0.8, 0xe0b0ff, 0, 0, 0); box(g, 0.82, 0.02, 0.02, 0xffffff, 0, 0.4, 0.41); box(g, 0.12, 0.08, 0.04, 0xffe29a, 0, 0.55, 0.41); } },
  { id: 'kotatsu', cat: 'つくえ・しゅうのう', name: 'こたつ', price: 600, w: 2, d: 2, build(g) {
    box(g, 1.9, 0.1, 1.9, 0xefd3a8, 0, 0.55, 0); box(g, 1.7, 0.45, 1.7, 0xff9f9f, 0, 0.1, 0);
    box(g, 1.9, 0.05, 1.9, 0xffe4e4, 0, 0.65, 0); } },
  // ---- ここから追加 ----
  { id: 'armchair', cat: 'ねる・すわる', name: 'ひじかけいす', price: 350, w: 1, d: 1, build(g) {
    box(g, 0.95, 0.4, 0.9, 0xe7a977, 0, 0, 0); box(g, 0.95, 0.65, 0.25, 0xd6925f, 0, 0.4, -0.33);
    box(g, 0.2, 0.3, 0.7, 0xd6925f, -0.4, 0.4, 0.08); box(g, 0.2, 0.3, 0.7, 0xd6925f, 0.4, 0.4, 0.08); } },
  { id: 'desk', cat: 'つくえ・しゅうのう', name: 'つくえ', price: 450, w: 2, d: 1, build(g) {
    box(g, 1.9, 0.1, 0.9, 0xd9b98c, 0, 0.7, 0);
    for (const sx of [-0.85, 0.85]) box(g, 0.1, 0.7, 0.8, 0xc4a070, sx, 0, 0);
    box(g, 0.55, 0.5, 0.78, 0xc4a070, 0.55, 0.2, 0); box(g, 0.45, 0.1, 0.02, 0xffe29a, 0.55, 0.5, 0.4); } },
  { id: 'fridge', cat: 'つくえ・しゅうのう', name: 'れいぞうこ', price: 600, w: 1, d: 1, build(g) {
    box(g, 0.9, 1.75, 0.8, 0xf2f6f8, 0, 0, 0); box(g, 0.86, 0.03, 0.02, 0xb8c4cc, 0, 1.15, 0.41);
    box(g, 0.06, 0.4, 0.05, 0x9aa8b2, 0.33, 1.25, 0.43); box(g, 0.06, 0.5, 0.05, 0x9aa8b2, 0.33, 0.45, 0.43); } },
  { id: 'piano', cat: 'つくえ・しゅうのう', name: 'ピアノ', price: 1500, w: 2, d: 1, build(g) {
    box(g, 1.9, 0.95, 0.85, 0x2f2a3b, 0, 0, -0.05); box(g, 1.7, 0.06, 0.4, 0xffffff, 0, 0.78, 0.3);
    for (let i = 0; i < 9; i++) box(g, 0.05, 0.08, 0.22, 0x222222, -0.72 + i * 0.18, 0.84, 0.22);
    for (const sx of [-0.8, 0.8]) box(g, 0.1, 0.78, 0.1, 0x2f2a3b, sx, 0, 0.35); } },
  { id: 'fireplace', cat: 'つくえ・しゅうのう', name: 'だんろ', price: 1200, w: 3, d: 1, build(g) {
    box(g, 2.9, 1.6, 0.9, 0xc9785a, 0, 0, 0); box(g, 3.0, 0.12, 1.0, 0xe8d8c4, 0, 1.6, 0);
    box(g, 1.2, 0.95, 0.1, 0x2b2220, 0, 0.1, 0.42);
    glow(box(g, 0.7, 0.45, 0.06, 0xff8c3a, 0, 0.12, 0.46), 0x883a10); glow(box(g, 0.35, 0.3, 0.06, 0xffd06a, 0.05, 0.12, 0.49), 0x886a20); } },
  { id: 'bookstack', cat: 'かざり', name: '本のつみ木', price: 100, w: 1, d: 1, build(g) {
    box(g, 0.6, 0.12, 0.42, 0xff9aa2, 0, 0, 0); box(g, 0.55, 0.12, 0.4, 0xa8e6cf, 0.02, 0.12, 0.02); box(g, 0.5, 0.1, 0.36, 0xffe29a, -0.02, 0.24, -0.02); } },
  { id: 'vase', cat: 'かざり', name: '花びん', price: 120, w: 1, d: 1, build(g) {
    cyl(g, 0.16, 0.42, 0x9fd8ff, 0, 0, 0, 0.1); cyl(g, 0.08, 0.14, 0x9fd8ff, 0, 0.42, 0, 0.1);
    ball(g, 0.14, 0xff9aa2, -0.08, 0.72, 0); ball(g, 0.14, 0xffe29a, 0.08, 0.8, 0.02); ball(g, 0.12, 0xc7b8ff, 0.0, 0.88, -0.05); } },
  { id: 'standmirror', cat: 'かざり', name: 'すがた見', price: 500, w: 1, d: 1, build(g) {
    box(g, 0.75, 1.7, 0.08, 0xd8b38a, 0, 0.1, 0); box(g, 0.6, 1.5, 0.02, 0xcfeaff, 0, 0.2, 0.05);
    box(g, 0.1, 0.55, 0.06, 0xb8946a, -0.3, 0, -0.25).rotation.x = 0.3; box(g, 0.1, 0.55, 0.06, 0xb8946a, 0.3, 0, -0.25).rotation.x = 0.3; } },
  // あかり
  { id: 'floorlamp', cat: 'あかり', name: 'フロアライト', price: 350, w: 1, d: 1, build(g) {
    cyl(g, 0.25, 0.06, 0x6b5b7b, 0, 0, 0); cyl(g, 0.035, 1.55, 0x6b5b7b, 0, 0.06, 0);
    glow(cyl(g, 0.38, 0.5, 0xfff0a8, 0, 1.55, 0, 0.2), 0x776020); } },
  { id: 'candle', cat: 'あかり', name: 'キャンドル', price: 120, w: 1, d: 1, build(g) {
    cyl(g, 0.09, 0.28, 0xfff6e6, 0, 0, 0); glow(ball(g, 0.045, 0xffb347, 0, 0.34, 0), 0xaa6a10); } },
  { id: 'pendant', cat: 'あかり', ceil: true, name: 'ペンダントライト', price: 450, w: 1, d: 1, build(g) {
    cyl(g, 0.015, 0.8, 0x6b5b7b, 0, 0.5, 0); glow(cyl(g, 0.4, 0.34, 0xffd9a0, 0, 0.16, 0, 0.1), 0x886a30); glow(ball(g, 0.1, 0xfff6d0, 0, 0.14, 0), 0xaaa060); } },
  { id: 'walllight', cat: 'あかり', wall: true, name: 'ウォールライト', price: 300, w: 1, d: 1, y0: 1.9, build(g) {
    box(g, 0.14, 0.22, 0.08, 0x6b5b7b, 0, 0, 0.04); box(g, 0.05, 0.05, 0.22, 0x6b5b7b, 0, 0.09, 0.15);
    glow(cyl(g, 0.17, 0.3, 0xfff0a8, 0, 0.14, 0.27, 0.09), 0x776020); } },
  { id: 'stringlight', cat: 'あかり', wall: true, name: 'イルミネーション', price: 350, w: 3, d: 1, y0: 2.6, build(g) {
    const cs = [0xff9aa2, 0xffe29a, 0xa8e6cf, 0x9fd8ff, 0xc7b8ff];
    for (let i = 0; i < 13; i++) { const x = -1.4 + i * 0.2333, y = 0.25 - Math.sin(i / 12 * Math.PI) * 0.22; glow(ball(g, 0.065, cs[i % 5], x, y, 0.08), cs[i % 5] & 0x7f7f7f); }
    box(g, 2.9, 0.02, 0.02, 0x4a3b3b, 0, 0.26, 0.03); } },
  { id: 'neon', cat: 'あかり', wall: true, name: 'ネオンサイン', price: 650, w: 2, d: 1, y0: 1.7, build(g) {
    box(g, 1.5, 0.9, 0.04, 0x2b2538, 0, 0, 0.02);
    for (const [w, h, x, y] of [[1.3, 0.05, 0, 0.1], [1.3, 0.05, 0, 0.75], [0.05, 0.7, -0.65, 0.1], [0.05, 0.7, 0.65, 0.1]]) glow(box(g, w, h, 0.05, 0xff7fb0, x, y, 0.06), 0xaa3060);
    glow(ball(g, 0.14, 0x7fe0ff, -0.2, 0.45, 0.08), 0x2080aa); glow(ball(g, 0.14, 0xffe27f, 0.2, 0.45, 0.08), 0xaa8a20); } },
  // かべ
  { id: 'poster', cat: 'かべ', wall: true, name: 'ポスター', price: 150, w: 1, d: 1, y0: 1.5, build(g) {
    box(g, 0.7, 1.0, 0.03, 0xfff8ee, 0, 0, 0.015); box(g, 0.56, 0.4, 0.02, 0xff9aa2, 0, 0.5, 0.04); box(g, 0.56, 0.1, 0.02, 0x4a3b5b, 0, 0.3, 0.04); box(g, 0.4, 0.06, 0.02, 0x8d7f9e, 0, 0.16, 0.04); } },
  { id: 'poster2', cat: 'かべ', wall: true, name: '星空ポスター', price: 180, w: 1, d: 1, y0: 1.5, build(g) {
    box(g, 0.7, 1.0, 0.03, 0x2b3a67, 0, 0, 0.015);
    for (const [x, y] of [[-0.18, 0.8], [0.14, 0.62], [-0.05, 0.4], [0.2, 0.25], [-0.22, 0.2]]) glow(ball(g, 0.04, 0xffe27f, x, y, 0.04), 0x887a30);
    ball(g, 0.12, 0xfff3c4, 0.1, 0.84, 0.04); } },
  { id: 'frame', cat: 'かべ', wall: true, name: 'がくぶち', price: 250, w: 1, d: 1, y0: 1.5, build(g) {
    box(g, 0.9, 0.7, 0.06, 0xb8864a, 0, 0, 0.03); box(g, 0.76, 0.56, 0.02, 0xcfeaff, 0, 0.07, 0.07);
    box(g, 0.76, 0.2, 0.02, 0x8fd19e, 0, 0.07, 0.08); ball(g, 0.1, 0xffe27f, 0.2, 0.5, 0.09); } },
  { id: 'mirror', cat: 'かべ', wall: true, name: 'かべかけの鏡', price: 400, w: 1, d: 1, y0: 1.4, build(g) {
    box(g, 0.8, 1.2, 0.06, 0xe8c9a0, 0, 0, 0.03); box(g, 0.66, 1.06, 0.02, 0xd6efff, 0, 0.07, 0.07); } },
  { id: 'wallshelf', cat: 'かべ', wall: true, name: 'かべ棚', price: 300, w: 2, d: 1, y0: 1.8, build(g) {
    box(g, 1.8, 0.07, 0.3, 0xd9b98c, 0, 0, 0.15); for (const sx of [-0.7, 0.7]) box(g, 0.06, 0.2, 0.2, 0xb8946a, sx, -0.2, 0.1);
    box(g, 0.2, 0.28, 0.2, 0xff9aa2, -0.5, 0.07, 0.15); box(g, 0.16, 0.34, 0.2, 0xa8e6cf, -0.28, 0.07, 0.15); cyl(g, 0.1, 0.16, 0xf1a894, 0.4, 0.07, 0.15, 0.13); ball(g, 0.12, 0x8fd19e, 0.4, 0.34, 0.15); } },
  { id: 'clock', cat: 'かべ', wall: true, name: 'かけ時計', price: 200, w: 1, d: 1, y0: 2.2, build(g) {
    disc(g, 0.3, 0.06, 0xd8b38a, 0, 0.3, 0.03); disc(g, 0.25, 0.02, 0xffffff, 0, 0.3, 0.07);
    box(g, 0.025, 0.2, 0.01, 0x4a3b3b, 0, 0.3, 0.09); box(g, 0.14, 0.025, 0.01, 0x4a3b3b, 0.05, 0.3, 0.09); } },
  { id: 'window', cat: 'かべ', wall: true, name: 'まど', price: 500, w: 2, d: 1, y0: 1.0, build(g) {
    box(g, 1.7, 1.4, 0.08, 0xffffff, 0, 0, 0.04); glow(box(g, 1.5, 1.2, 0.02, 0xbfe6ff, 0, 0.1, 0.09), 0x4a7090);
    box(g, 0.06, 1.2, 0.04, 0xffffff, 0, 0.1, 0.11); box(g, 1.5, 0.06, 0.04, 0xffffff, 0, 0.7, 0.11); } },
];
export const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));

// 家具の高さ(上に重ねるときに使う)。見た目から測って覚えておく
const hCache = {};
export function heightOf(id) {
  if (hCache[id] == null) { const g = new THREE.Group(); ITEM[id].build(g); const b = new THREE.Box3().setFromObject(g); hCache[id] = Math.max(0.04, b.max.y); }
  return hCache[id];
}
export const kindOf = id => (ITEM[id].wall ? 'wall' : ITEM[id].ceil ? 'ceil' : ITEM[id].flat ? 'flat' : 'floor');

// ---- 家(部屋)：コインで1列・1行ずつ広げる/ダイヤで広げる・部屋ごと増やす ----
// 部屋 {id, name, cols, rows, sx, sy(間取り図の上の場所), from(つながっている部屋)}
const ROOM_NAMES = ['リビング', 'ベッドルーム', '書斎', 'ダイニング', 'ゲストルーム', 'サンルーム', 'ギャラリー', 'ホール', 'シアタールーム', 'ライブラリー', 'ガレージ', 'テラス'];
const DEF_COST = { coinsPerLine: 3000, gemsPerLine: 60, gemsPerRoom: 250 };
const st = createStorage('town:furn:');
export const houseData = {
  get() {
    const h = st.get('house');
    if (h && h.rooms && h.rooms.length) return h;
    return { rooms: [{ id: 'r1', name: ROOM_NAMES[0], cols: ROOM, rows: ROOM, sx: 0, sy: 0, from: null }] };
  },
  save: v => st.set('house', v),
  room(id) { const h = this.get(); return h.rooms.find(r => r.id === id) || h.rooms[0]; },
  cost(c) { return Object.assign({}, DEF_COST, c || {}); },
  // 1列(axis 'cols')・1行('rows')広げる。via 'coins'|'gems'。広げるのは壁と反対側(家具は動かない)
  expand(roomId, axis, via, ctx) {
    const h = this.get(), r = h.rooms.find(x => x.id === roomId); if (!r) return 'へやが見つからないよ';
    if (r[axis] >= SIDE_MAX) return `これ以上は広げられないよ(${SIDE_MAX}マスまで)`;
    const c = this.cost(ctx.house);
    if (via === 'gems') { if (!ctx.gems) return 'ダイヤが使えない場所だよ'; if (ctx.gems.get() < c.gemsPerLine) return `ダイヤが足りないよ(あと ${c.gemsPerLine - ctx.gems.get()})`; if (!ctx.gems.spend(c.gemsPerLine)) return 'ダイヤが足りないよ'; }
    else { if (ctx.wallet.get() < c.coinsPerLine) return `コインが足りないよ(あと ${c.coinsPerLine - ctx.wallet.get()})`; ctx.wallet.add(-c.coinsPerLine, 'house'); }
    r[axis]++; this.save(h); return '';
  },
  // 部屋を増やす(ダイヤだけ)。つながる部屋 parentId の空いている側(間取り図で)にくっつける
  addRoom(parentId, ctx) {
    const h = this.get(), c = this.cost(ctx.house);
    if (!ctx.gems) return { err: 'ダイヤが使えない場所だよ' };
    const p = h.rooms.find(x => x.id === parentId) || h.rooms[0];
    const used = new Set(h.rooms.map(r => r.sx + ',' + r.sy));
    const sides = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const cand = [];
    for (const r of [p, ...h.rooms]) for (const [dx, dy] of sides) if (!used.has((r.sx + dx) + ',' + (r.sy + dy))) cand.push({ r, sx: r.sx + dx, sy: r.sy + dy });
    if (!cand.length) return { err: 'これ以上は つながらないよ' };
    if (ctx.gems.get() < c.gemsPerRoom) return { err: `ダイヤが足りないよ(あと ${c.gemsPerRoom - ctx.gems.get()})` };
    if (!ctx.gems.spend(c.gemsPerRoom)) return { err: 'ダイヤが足りないよ' };
    const at = cand[0], n = h.rooms.length;
    const room = { id: 'r' + (Date.now().toString(36)), name: ROOM_NAMES[n] || `へや ${n + 1}`, cols: 6, rows: 6, sx: at.sx, sy: at.sy, from: at.r.id };
    h.rooms.push(room); this.save(h); return { room };
  },
  rename(roomId, name) { const h = this.get(), r = h.rooms.find(x => x.id === roomId); if (r) { r.name = String(name).slice(0, 10) || r.name; this.save(h); } },
};

// ---- 持ち物 {家具id: 個数} と、配置 [{uid, id, room, gx, gz, r}] (壁かけは {wall:'n'|'w', gx(壁にそった位置), y}) ----
export const furn = {
  inv: () => st.get('inv') || {},
  // 配置。むかしの保存(8×8・1マス単位)があれば、半マス単位に直して引き継ぐ
  placed() {
    let v = st.get('put');
    if (!v) {
      const old = st.get('room');
      v = Array.isArray(old) ? old.filter(p => p.id && !p.room).map(p => ({ uid: p.uid, id: p.id, room: 'r1', gx: p.gx * U, gz: p.gz * U, r: p.r || 0 })) : [];
      st.set('put', v);
    }
    return v.filter(p => ITEM[p.id]);
  },
  savePlaced: v => st.set('put', v),
  saveInv: v => st.set('inv', v),
  owned(id) { return this.inv()[id] || 0; },
  placedCount(id) { return this.placed().filter(p => p.id === id).length; },
  // カゴ {家具id: 個数}。お店を出ても残る。お金が減るのは「まとめて買う」を押したときだけ
  cart: () => { const c = st.get('cart') || {}, o = {}; for (const id in c) if (ITEM[id] && c[id] > 0) o[id] = c[id]; return o; },
  saveCart: v => st.set('cart', v),
  total(cart) { return Object.entries(cart).reduce((a, [id, n]) => a + ITEM[id].price * n, 0); },
  // カゴの数を変える(持っている数＋カゴの数が MAX_OWN を超えないように)。変えたあとの個数を返す
  setQty(id, n) {
    const cart = this.cart(); n = Math.max(0, Math.min(MAX_OWN - this.owned(id), n | 0));
    if (n) cart[id] = n; else delete cart[id]; this.saveCart(cart); return n;
  },
  // まとめて払う。足りなければ何も買わずに理由を返す(空文字なら成功)
  buyCart(wallet) {
    const cart = this.cart(), ids = Object.keys(cart);
    if (!ids.length) return 'カゴが空だよ';
    for (const id of ids) if (this.owned(id) + cart[id] > MAX_OWN) return `${ITEM[id].name}は${MAX_OWN}個までだよ`;
    const total = this.total(cart);
    if (wallet.get() < total) return `コインが足りないよ(あと ${total - wallet.get()})`;
    wallet.add(-total, 'furniture');
    const inv = this.inv(); for (const id of ids) inv[id] = (inv[id] || 0) + cart[id];
    this.saveInv(inv); this.saveCart({}); return '';
  },
};

// ---- 置き場所の計算(単位は半マス) ----
// 床の家具の大きさ(半マス単位、まわした向き込み)
export function size(p) { const it = ITEM[p.id]; const w = it.w * U, d = it.d * U; return p.r % 2 ? [d, w] : [w, d]; }
// 壁かけの壁にそった幅(半マス単位)
export const wallLen = p => ITEM[p.id].w * U;
// 部屋の中におさまっているか(重なりは自由なので、はみ出しだけを見る)
export function inside(rm, p) {
  const k = kindOf(p.id);
  if (k === 'wall') { const len = p.wall === 'n' ? rm.cols * U : rm.rows * U; return p.gx >= 0 && p.gx + wallLen(p) <= len; }
  const [w, d] = size(p);
  return p.gx >= 0 && p.gz >= 0 && p.gx + w <= rm.cols * U && p.gz + d <= rm.rows * U;
}
// 各家具の置き高さ。ラグ→ほかの床の家具の順に、下にある物の上に重ねていく(何の上にも置ける)。
// list の後ろにある物ほど上にのる。{uid: y} を返す
export function stackY(list) {
  const out = {}, floor = list.filter(p => { const k = kindOf(p.id); return k === 'flat' || k === 'floor'; })
    .sort((a, b) => (kindOf(a.id) === 'flat' ? 0 : 1) - (kindOf(b.id) === 'flat' ? 0 : 1));
  const done = [];
  for (const p of floor) {
    const [w, d] = size(p); let y = 0;
    for (const o of done) {
      const [ow, od] = size(o.p);
      if (p.gx < o.p.gx + ow && o.p.gx < p.gx + w && p.gz < o.p.gz + od && o.p.gz < p.gz + d) y = Math.max(y, o.y + heightOf(o.p.id));
    }
    out[p.uid] = y; done.push({ p, y });
  }
  for (const p of list) { const k = kindOf(p.id); if (k === 'wall') out[p.uid] = p.y ?? ITEM[p.id].y0; else if (k === 'ceil') out[p.uid] = WALL_H - heightOf(p.id); }
  return out;
}
// 買った家具を置く場所をさがす(あいている所を優先。なければ重ねる)
export function findSpot(rm, list, p) {
  const k = kindOf(p.id);
  if (k === 'wall') {
    const it = ITEM[p.id], len = wallLen(p);
    for (const side of ['n', 'w']) {
      const total = (side === 'n' ? rm.cols : rm.rows) * U;
      for (let gx = 0; gx + len <= total; gx += 1) {
        const q = { ...p, wall: side, gx, y: it.y0 };
        const clash = list.some(o => kindOf(o.id) === 'wall' && o.wall === side && o.uid !== p.uid && gx < o.gx + wallLen(o) && o.gx < gx + len && Math.abs((o.y ?? ITEM[o.id].y0) - it.y0) < 1.0);
        if (!clash) return q;
      }
    }
    return { ...p, wall: 'n', gx: 0, y: it.y0 };
  }
  if (k === 'ceil') { return { ...p, gx: Math.floor((rm.cols * U - U) / 2), gz: Math.floor((rm.rows * U - U) / 2), r: 0 }; }
  for (let r = 0; r < 2; r++) for (let gz = 0; gz <= rm.rows * U; gz += U) for (let gx = 0; gx <= rm.cols * U; gx += U) {
    const q = { ...p, gx, gz, r }; if (!inside(rm, q)) continue;
    const [w, d] = size(q);
    const clash = list.some(o => { if (o.uid === p.uid || (kindOf(o.id) !== 'floor' && kindOf(o.id) !== 'flat')) return false; const [ow, od] = size(o); return q.gx < o.gx + ow && o.gx < q.gx + w && q.gz < o.gz + od && o.gz < q.gz + d; });
    if (!clash || kindOf(p.id) === 'flat') return q;
  }
  return { ...p, gx: 0, gz: 0, r: 0 };   // あいている所がなければ、すみに重ねる
}
