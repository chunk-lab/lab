// 家具のデータと、持ち物・部屋の保存。ショップと家のアプリで共有する。
// 家具を増やすときは ITEMS に1件足すだけ(build が見た目、w×d が床のマス数)。
import * as THREE from 'three';
import { createStorage } from '../core/core.js';

export const ROOM = 8; // 部屋は ROOM × ROOM マス
export const MAX_OWN = 5; // 同じ家具は5個まで

const mat = c => new THREE.MeshLambertMaterial({ color: c });
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

// 原点が床の中心、正面は +z。大きさは w×d マス(1マス=1)。
export const ITEMS = [
  { id: 'bed', name: 'ベッド', price: 120, w: 2, d: 3, build(g) {
    box(g, 1.9, 0.35, 2.9, 0xf3d9b1, 0, 0, 0); box(g, 1.8, 0.28, 2.6, 0xffc2d1, 0, 0.35, 0.1);
    box(g, 1.8, 0.2, 0.12, 0xf3d9b1, 0, 0.35, -1.42); box(g, 1.2, 0.18, 0.55, 0xffffff, 0, 0.63, -0.95); } },
  { id: 'sofa', name: 'ソファ', price: 90, w: 3, d: 1, build(g) {
    box(g, 2.9, 0.4, 0.95, 0xb9a6e6, 0, 0, 0); box(g, 2.9, 0.55, 0.28, 0xa793d9, 0, 0.4, -0.36);
    box(g, 0.28, 0.35, 0.8, 0xa793d9, -1.31, 0.4, 0.05); box(g, 0.28, 0.35, 0.8, 0xa793d9, 1.31, 0.4, 0.05); } },
  { id: 'lowtable', name: 'ローテーブル', price: 50, w: 2, d: 1, build(g) {
    box(g, 1.8, 0.1, 0.85, 0xe8c9a0, 0, 0.35, 0);
    for (const sx of [-0.8, 0.8]) for (const sz of [-0.32, 0.32]) box(g, 0.1, 0.35, 0.1, 0xd0ae84, sx, 0, sz); } },
  { id: 'dining', name: 'ダイニングテーブル', price: 90, w: 2, d: 2, build(g) {
    box(g, 1.9, 0.12, 1.9, 0xefd3a8, 0, 0.62, 0);
    for (const sx of [-0.8, 0.8]) for (const sz of [-0.8, 0.8]) box(g, 0.12, 0.62, 0.12, 0xd6b588, sx, 0, sz); } },
  { id: 'chair', name: 'いす', price: 30, w: 1, d: 1, build(g) {
    box(g, 0.7, 0.1, 0.7, 0xffd6a5, 0, 0.35, 0); box(g, 0.7, 0.6, 0.1, 0xffd6a5, 0, 0.45, -0.3);
    for (const sx of [-0.28, 0.28]) for (const sz of [-0.28, 0.28]) box(g, 0.08, 0.35, 0.08, 0xe0b88a, sx, 0, sz); } },
  { id: 'shelf', name: '本だな', price: 70, w: 2, d: 1, build(g) {
    box(g, 1.9, 1.9, 0.8, 0xe3c39a, 0, 0, 0);
    const cs = [0xff9aa2, 0xa8e6cf, 0xb5b9ff, 0xffe29a, 0xc7ceea];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) box(g, 0.2, 0.42, 0.55, cs[(i + r) % 5], -0.75 + i * 0.3, 0.12 + r * 0.6, 0.15);
  } },
  { id: 'rug', name: 'まるいラグ', price: 45, w: 3, d: 3, flat: true, build(g) {
    cyl(g, 1.4, 0.04, 0xffd6e0, 0, 0, 0); cyl(g, 1.0, 0.05, 0xfff1f5, 0, 0, 0); } },
  { id: 'lamp', name: 'ランプ', price: 40, w: 1, d: 1, build(g) {
    cyl(g, 0.22, 0.06, 0xd8c3a5, 0, 0, 0); cyl(g, 0.04, 1.1, 0xd8c3a5, 0, 0.06, 0);
    const s = cyl(g, 0.32, 0.4, 0xfff0a8, 0, 1.1, 0, 0.18); s.material.emissive = new THREE.Color(0x665520); } },
  { id: 'plant', name: '植木ばち', price: 25, w: 1, d: 1, build(g) {
    cyl(g, 0.28, 0.4, 0xf1a894, 0, 0, 0, 0.34); ball(g, 0.38, 0x8fd19e, 0, 0.75, 0); ball(g, 0.26, 0xa8e6b7, 0.18, 1.0, 0.05); } },
  { id: 'tv', name: 'テレビ', price: 150, w: 2, d: 1, build(g) {
    box(g, 1.8, 0.5, 0.7, 0xf0e2cc, 0, 0, 0); box(g, 1.5, 0.9, 0.08, 0x3b3550, 0, 0.55, 0); box(g, 1.38, 0.78, 0.02, 0x9fd8ff, 0, 0.61, 0.05); } },
  { id: 'bear', name: 'くまのぬいぐるみ', price: 35, w: 1, d: 1, build(g) {
    ball(g, 0.3, 0xd9a577, 0, 0.3, 0); ball(g, 0.22, 0xd9a577, 0, 0.7, 0.03);
    ball(g, 0.09, 0xd9a577, -0.17, 0.88, 0.03); ball(g, 0.09, 0xd9a577, 0.17, 0.88, 0.03); ball(g, 0.07, 0x4a3b3b, 0, 0.7, 0.24); } },
  { id: 'chest', name: 'チェスト', price: 45, w: 1, d: 1, build(g) {
    box(g, 0.9, 0.8, 0.8, 0xe0b0ff, 0, 0, 0); box(g, 0.82, 0.02, 0.02, 0xffffff, 0, 0.4, 0.41); box(g, 0.12, 0.08, 0.04, 0xffe29a, 0, 0.55, 0.41); } },
  { id: 'kotatsu', name: 'こたつ', price: 110, w: 2, d: 2, build(g) {
    box(g, 1.9, 0.1, 1.9, 0xefd3a8, 0, 0.55, 0); box(g, 1.7, 0.45, 1.7, 0xff9f9f, 0, 0.1, 0);
    box(g, 1.9, 0.05, 1.9, 0xffe4e4, 0, 0.65, 0); } },
];
export const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));

// 持ち物 {家具id: 個数} と、部屋の配置 [{uid, id, gx, gz, r}]
const st = createStorage('town:furn:');
export const furn = {
  inv: () => st.get('inv') || {},
  room: () => (st.get('room') || []).filter(p => ITEM[p.id]),
  saveInv: v => st.set('inv', v),
  saveRoom: v => st.set('room', v),
  owned(id) { return this.inv()[id] || 0; },
  placedCount(id) { return this.room().filter(p => p.id === id).length; },
  buy(id, wallet) {
    const it = ITEM[id]; if (!it) return 'なし';
    if (this.owned(id) >= MAX_OWN) return `${MAX_OWN}個までだよ`;
    if (wallet.get() < it.price) return 'コインが足りないよ';
    wallet.add(-it.price, 'furniture:' + id);
    const inv = this.inv(); inv[id] = (inv[id] || 0) + 1; this.saveInv(inv);
    return '';
  },
};

// 置けるか(はみ出し・重なり)。flat(ラグ)と、ふつうの家具は別の層なので重ねられる
export function size(p) { const it = ITEM[p.id]; return p.r % 2 ? [it.d, it.w] : [it.w, it.d]; }
export function fits(room, p, ignoreUid) {
  const [w, d] = size(p);
  if (p.gx < 0 || p.gz < 0 || p.gx + w > ROOM || p.gz + d > ROOM) return false;
  const flat = !!ITEM[p.id].flat;
  for (const o of room) {
    if (o.uid === ignoreUid || !!ITEM[o.id].flat !== flat) continue;
    const [ow, od] = size(o);
    if (p.gx < o.gx + ow && o.gx < p.gx + w && p.gz < o.gz + od && o.gz < p.gz + d) return false;
  }
  return true;
}
// 空いている場所をさがす(買った家具を置くとき)
export function findSpot(room, p) {
  for (let r = 0; r < 4; r++) for (let gz = 0; gz < ROOM; gz++) for (let gx = 0; gx < ROOM; gx++) {
    const q = { ...p, gx, gz, r }; if (fits(room, q)) return q;
  }
  return null;
}
