// 家具のデータと、持ち物・家(部屋)・配置の保存。ショップと家のアプリで共有する。
// 家具を増やすときは ITEMS に1件足すだけ(build が見た目、w×d が床のマス数、cat がショップの分類)。
//   ふつうの家具 … 床に置く。どんな物の上にも置ける(重ねられる)
//   wall:true     … 壁にかける(ポスター・鏡・棚・窓・壁のあかり)。w は壁にそった幅。モデルは壁にふれる面が z=0、手前に出る
//   ceil:true     … 天井からつるす(ペンダントライト)
//   flat:true     … ラグ。いつも一番下に敷く
// 位置の単位は「半マス」(1マス=U=2)。真ん中にも置ける。
import * as THREE from 'three';
import { createStorage } from '../core/core.js';
import { SETS, FISH_SPEC, spec, decorOf } from './specimen.js';

export const U = 2;                 // 1マス = 2単位(半マス刻み)
export const WALL_H = 3.4;          // 壁・天井の高さ
export const MAX_OWN = 50;          // 同じ家具は50個まで
export const SIDE_MIN = 4, SIDE_MAX = 20;   // 部屋の一辺(マス)の下限・上限
export const ROOM = 8;              // はじめの部屋の広さ(8×8マス)
export const CATS = ['すべて', 'ねる・すわる', 'つくえ・しゅうのう', 'キッチン・おふろ', 'あかり', 'かべ', 'かざり'];

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

// メダル(勉強を続けた日数)。リボンと、数字の入った円
const medTex = {};
function medal(g, n, c) {
  box(g, 0.12, 0.35, 0.02, 0xff7a9a, -0.07, 0.25, 0.02).rotation.z = 0.25; box(g, 0.12, 0.35, 0.02, 0x7ab8ff, 0.07, 0.25, 0.02).rotation.z = -0.25;
  disc(g, 0.22, 0.05, c, 0, 0.12, 0.06);
  if (!medTex[n] && typeof document !== 'undefined') { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.font = `900 ${n >= 100 ? 46 : 60}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 64, 58); x.font = '700 20px sans-serif'; x.fillText('DAYS', 64, 100); medTex[n] = new THREE.CanvasTexture(cv); medTex[n].colorSpace = THREE.SRGBColorSpace; }
  if (medTex[n]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36), new THREE.MeshBasicMaterial({ map: medTex[n], transparent: true })); m.position.set(0, 0.12, 0.09); g.add(m); }
}

// ---- 英語の釣り堀の標本(ガラスびん)・魚の標本・水槽 ----
const glassMat = (c = 0xdff4ff, o = 0.28) => new THREE.MeshLambertMaterial({ color: c, transparent: true, opacity: o, depthWrite: false });
const hexOf = s => parseInt(String(s || '#888888').slice(1), 16);
function add(g, geo, c, x, y, z, o) { const m = new THREE.Mesh(geo, o ? glassMat(c, o) : mat(c)); m.position.set(x, y, z); g.add(m); return m; }
const CAP = { 1: 0xb88a5a, 2: 0xc9ced6, 3: 0xe0b443 };
function jar(g, lv, h, crack, liquid) {
  box(g, 0.62, 0.06, 0.62, 0x6b4a32, 0, 0, 0);                  // 木の台
  box(g, 0.34, 0.07, 0.012, 0xfff6dc, 0, 0.0, 0.312);            // 名札
  if (liquid) add(g, new THREE.CylinderGeometry(0.225, 0.225, h * 0.86, 24), liquid, 0, 0.06 + h * 0.43, 0, 0.18);
  add(g, new THREE.CylinderGeometry(0.24, 0.24, h, 24, 1, true), 0xf4fbff, 0, 0.06 + h / 2, 0, 0.13);   // ガラス(ふちだけ少し白く)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.008, 6, 32), glassMat(0xffffff, 0.6)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.08; g.add(rim);
  const cap = cyl(g, 0.25, 0.08, CAP[lv] || CAP[1], 0, 0.06 + h, 0); cyl(g, 0.12, 0.05, CAP[lv] || CAP[1], 0, 0.14 + h, 0);
  if (crack) {   // ひび:ガラスに黒い線、ふたがずれる
    cap.rotation.z = 0.18; cap.position.x = 0.04;
    [[0.05, 0.36, 0.5], [-0.07, 0.28, -0.7], [0.09, 0.22, 0.2], [-0.02, 0.44, 1.1]].forEach(([x, y, r]) => { const l = box(g, 0.012, 0.16, 0.006, 0x2a2a2a, x, y - 0.08, 0.243); l.rotation.z = r; });
  }
}
function content(g, L, y) {
  const c = L.col, S = L.shape;
  if (S === 'shell') { const m = add(g, new THREE.SphereGeometry(0.12, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), c, 0, y - 0.05, 0); m.scale.set(1, 0.6, 0.8); m.rotation.x = -0.9; }
  else if (S === 'conch') { const m = add(g, new THREE.ConeGeometry(0.09, 0.26, 12), c, 0, y, 0); m.rotation.z = 0.5; add(g, new THREE.SphereGeometry(0.075, 12, 8), c, -0.05, y - 0.08, 0); }
  else if (S === 'stone') { const m = add(g, new THREE.DodecahedronGeometry(0.11), c, 0, y - 0.04, 0); m.scale.set(1.2, 0.7, 1); }
  else if (S === 'glass') { const m = add(g, new THREE.DodecahedronGeometry(0.09), c, 0, y - 0.04, 0, 0.75); m.scale.set(1.3, 0.45, 1); }
  else if (S === 'urchin') { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), new THREE.MeshLambertMaterial({ color: c, flatShading: true })); m.position.set(0, y - 0.03, 0); m.scale.set(1, 0.7, 1); g.add(m); }
  else if (S === 'star') { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, m = box(g, 0.05, 0.13, 0.025, c, Math.sin(a) * 0.065, y - 0.06 + Math.cos(a) * 0.065, 0); m.rotation.z = -a; } }
  else if (S === 'coral') { [[0, 0, 0.2, 0], [-0.05, 0.08, 0.12, 0.5], [0.05, 0.06, 0.13, -0.5], [0.0, 0.14, 0.08, 0.2]].forEach(([x, yy, h, r]) => { const m = cyl(g, 0.018, h, c, x, y - 0.12 + yy, 0, 0.012); m.rotation.z = r; }); }
  else if (S === 'disc') { const m = cyl(g, 0.12, 0.02, c, 0, y - 0.02, 0); m.rotation.x = 1.25; }
  else if (S === 'crystal') { [[0, 0.24, 0], [-0.06, 0.16, 0.35], [0.06, 0.18, -0.3]].forEach(([x, h, r]) => { const m = add(g, new THREE.ConeGeometry(0.04, h, 6), c, x, y - 0.12 + h / 2, 0, 0.8); m.rotation.z = r; }); }
  else if (S === 'ammonite') { const t = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.035, 10, 24), mat(c)); t.position.set(0, y, 0); g.add(t); const t2 = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.02, 8, 16), mat(c)); t2.position.set(0, y, 0); g.add(t2); }
  else if (S === 'trilobite') { const m = add(g, new THREE.SphereGeometry(0.1, 14, 10), c, 0, y - 0.06, 0); m.scale.set(0.8, 0.3, 1.3); for (let i = -2; i <= 2; i++) box(g, 0.17, 0.012, 0.012, 0x3a3030, 0, y - 0.04, i * 0.035); }
  else if (S === 'tooth') add(g, new THREE.ConeGeometry(0.07, 0.2, 3), 0xf4efe2, 0, y - 0.02, 0);
  else if (S === 'amber') { const m = add(g, new THREE.DodecahedronGeometry(0.1), 0xe39a2a, 0, y - 0.03, 0, 0.85); m.material.emissive = new THREE.Color(0x5a3000); add(g, new THREE.SphereGeometry(0.02, 8, 6), 0x2a1a10, 0, y - 0.03, 0); }
  else if (S === 'cube') { box(g, 0.1, 0.1, 0.1, 0xd9b84a, -0.03, y - 0.12, 0); const m = box(g, 0.08, 0.08, 0.08, 0xe6c95a, 0.05, y - 0.1, 0.02); m.rotation.y = 0.6; }
  else if (S === 'leaf') { box(g, 0.24, 0.04, 0.18, 0x9a8f7e, 0, y - 0.13, 0); const m = add(g, new THREE.SphereGeometry(0.08, 12, 8), c, 0, y - 0.09, 0); m.scale.set(1, 0.08, 0.55); }
  else if (S === 'gem') { const m = add(g, new THREE.OctahedronGeometry(0.1), c, 0, y, 0, 0.9); m.material.emissive = new THREE.Color(c).multiplyScalar(0.35); m.scale.set(1, 1.3, 1); }
  else if (S === 'opal') { const m = add(g, new THREE.SphereGeometry(0.09, 16, 12), c, 0, y - 0.03, 0); m.scale.set(1.2, 0.6, 1); m.material.emissive = new THREE.Color(0x553366); }
  else if (S === 'pearl') { const sh = add(g, new THREE.SphereGeometry(0.12, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xd8cfc2, 0, y - 0.12, 0); sh.scale.set(1, 0.35, 1); sh.rotation.x = Math.PI; sh.position.y = y - 0.06; ball(g, 0.06, c, 0, y - 0.04, 0); }
  else if (S === 'meteor') { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11), new THREE.MeshLambertMaterial({ color: c, flatShading: true, emissive: 0x220a00 })); m.position.set(0, y - 0.03, 0); g.add(m); }
}
function specimenJar(g, s) { jar(g, s.lv, 0.5, spec.cracked(s.id)); const c = new THREE.Group(); content(c, s.look, 0); c.scale.setScalar(1.55); c.position.y = 0.33; g.add(c); }
function fishJar(g, f) {
  jar(g, 2, 0.62, false, 0xf6e7a8);
  const a = f.art || {}, b = a.body || ['#888888', '#cccccc'], c1 = hexOf(b[0]), c2 = hexOf(b[1]), eel = a.shape === 'eel', crab = a.shape === 'crab';
  const body = ball(g, 0.1, c1, 0, 0.38, 0); body.scale.set(eel ? 0.5 : 0.55, eel ? 2.4 : 1.5, eel ? 0.5 : 0.45);
  if (crab) { body.scale.set(1.2, 0.6, 0.9); ball(g, 0.04, c2, -0.12, 0.42, 0.04); ball(g, 0.04, c2, 0.12, 0.42, 0.04); return; }
  const belly = ball(g, 0.07, c2, 0, 0.36, 0.03); belly.scale.set(0.5, 1.4, 0.4);
  const t = add(g, new THREE.ConeGeometry(0.06, 0.1, 4), hexOf(a.fin || b[0]), 0, eel ? 0.1 : 0.2, 0); t.rotation.z = Math.PI;
  ball(g, 0.018, 0x111111, 0.035, eel ? 0.6 : 0.5, 0.04);
}
function tank(g) {
  box(g, 1.86, 0.5, 0.86, 0x4a3a30, 0, 0, 0);                       // 台
  box(g, 1.78, 0.06, 0.78, 0xe8dcc0, 0, 0.5, 0);                    // 砂
  add(g, new THREE.BoxGeometry(1.76, 0.66, 0.76), 0x4fb8e8, 0, 0.88, 0, 0.3);   // 水
  add(g, new THREE.BoxGeometry(1.8, 0.74, 0.8), 0xe8f8ff, 0, 0.93, 0, 0.12);    // ガラス
  for (const [w, d, x, z] of [[1.84, 0.04, 0, 0.4], [1.84, 0.04, 0, -0.4], [0.04, 0.84, 0.9, 0], [0.04, 0.84, -0.9, 0]]) box(g, w, 0.05, d, 0x2b2b30, x, 1.28, z);   // ふちの枠
  [[-0.7, 0.2], [-0.55, -0.15], [0.68, -0.2]].forEach(([x, z]) => { for (let i = 0; i < 3; i++) { const m = cyl(g, 0.02, 0.32 + i * 0.08, 0x3f9a5a, x + i * 0.04, 0.56, z, 0.008); m.rotation.z = (i - 1) * 0.25; } });
  ball(g, 0.09, 0x8a8a90, 0.4, 0.58, 0.18).scale.set(1.4, 0.7, 1);
  // 混ぜてできた飾り(レアなものほど手前・目立つ)
  const dmap = Object.fromEntries(spec.decor().map(d => [d.uid, d])), dc = spec.placed().filter(q => dmap[q.uid]).slice(0, 40);   // 水槽の画面で置いた位置(左右=x、下ほど手前)
  dc.forEach((q, i) => {
    const d = dmap[q.uid], sh = decorOf(d).shape, x = -0.78 + q.x * 1.56, z = -0.25 + q.y * 0.5, y = 0.56, e = new THREE.Group(); e.position.set(x, y, z); g.add(e);
    if (sh === 'weed') { for (let k = 0; k < 4; k++) { const m = cyl(e, 0.015, 0.3 + k * 0.06, 0x2f9a58, k * 0.04 - 0.06, 0, 0, 0.008); m.rotation.z = (k - 1.5) * 0.18; } }
    else if (sh === 'coralrock') { ball(e, 0.1, 0x8a8a92, 0, 0.04, 0).scale.set(1.3, 0.7, 1); [[-0.05, 0.1, 0xff7a9a], [0.04, 0.12, 0xff9ab0], [0.1, 0.07, 0xff6a8a]].forEach(([dx, h, c]) => cyl(e, 0.014, h + 0.08, c, dx, 0.1, 0, 0.01)); }
    else if (sh === 'castle') { box(e, 0.26, 0.14, 0.18, 0xf2dcc6, 0, 0.07, 0); [-0.12, 0.12].forEach(dx => { cyl(e, 0.05, 0.26, 0xf6e6d6, dx, 0.13, 0, 0.05); add(e, new THREE.ConeGeometry(0.06, 0.1, 8), 0xff8aa8, dx, 0.31, 0); }); box(e, 0.06, 0.1, 0.02, 0x6a4a3a, 0, 0.05, 0.1); }
    else if (sh === 'pearlshell') { const s2 = add(e, new THREE.SphereGeometry(0.12, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xf2dcd0, 0, 0.02, 0); s2.scale.set(1, 0.6, 0.9); const pb = ball(e, 0.05, 0xffffff, 0, 0.08, 0); pb.material.emissive = new THREE.Color(0xaaccff); }
    else if (sh === 'fossil') { ball(e, 0.11, 0x8c8478, 0, 0.05, 0).scale.set(1.2, 0.8, 1); const t = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 18), mat(0xd8cdb0)); t.position.set(0, 0.1, 0.1); e.add(t); }
    else if (sh === 'cluster') { [[0, 0.3, 0], [-0.07, 0.2, 0.35], [0.07, 0.22, -0.3], [0.02, 0.16, 0.6]].forEach(([dx, h, r]) => { const m = add(e, new THREE.ConeGeometry(0.04, h, 6), 0xb28cff, dx, h / 2, 0, 0.85); m.rotation.z = r; m.material.emissive = new THREE.Color(0x4a2a90); }); }
    else if (sh === 'pillar') { box(e, 0.16, 0.04, 0.16, 0xe8dcc0, 0, 0.02, 0); cyl(e, 0.05, 0.34, 0xf0e6d0, 0, 0.2, 0, 0.055); box(e, 0.14, 0.04, 0.14, 0xe8dcc0, 0, 0.39, 0); }
    else if (sh === 'lamp') { box(e, 0.14, 0.04, 0.14, 0x5a4a3a, 0, 0.02, 0); const b2 = ball(e, 0.08, 0xffb347, 0, 0.12, 0); b2.material.emissive = new THREE.Color(0xff8a00); b2.scale.set(1, 1.2, 1); }
    else if (sh === 'chest' || sh === 'goldchest') { const gold = sh === 'goldchest', c1 = gold ? 0xe0b030 : 0x8a5a30, c2 = gold ? 0xffd54a : 0xa87040; box(e, 0.24, 0.12, 0.16, c1, 0, 0.06, 0); const l = box(e, 0.24, 0.07, 0.16, c2, 0, 0.15, 0); box(e, 0.04, 0.06, 0.02, 0xfff2a0, 0, 0.11, 0.09); if (gold) { const gb = ball(e, 0.04, 0xfff2a0, 0, 0.24, 0); gb.material.emissive = new THREE.Color(0xffc800); } }
    else if (sh === 'gempile') { [[0, 0.06, 0xe0115f], [-0.07, 0.04, 0x2a5bd7], [0.07, 0.04, 0x1fa463], [0.02, 0.12, 0xbfe6ff]].forEach(([dx, dy, c]) => { const m = add(e, new THREE.OctahedronGeometry(0.06), c, dx, dy, 0, 0.9); m.material.emissive = new THREE.Color(c).multiplyScalar(0.4); }); }
    else if (sh === 'star') { const m = add(e, new THREE.OctahedronGeometry(0.11), 0xfff2a0, 0, 0.2, 0, 0.95); m.material.emissive = new THREE.Color(0xffd000); m.scale.set(1, 1.6, 1); }
  });
  const fish = spec.tank().slice(0, 6);
  fish.forEach((t, i) => {
    const f = FISH_SPEC.find(x => x.id === t.id); if (!f) return;
    const b = (f.art && f.art.body) || ['#888888'], s = (0.07 + 0.05 * Math.min(1, t.g || 0)) * (1 + 0.3 * (t.rk || 0));
    const x = -0.6 + (i % 3) * 0.6 + (i > 2 ? 0.25 : 0), y = 0.75 + (i > 2 ? 0.25 : 0) + (i % 2) * 0.05, z = (i % 2 ? -0.12 : 0.12);
    const m = ball(g, s, hexOf(b[0]), x, y, z); m.scale.set(1.8, 0.8, 0.55);
    const tl = add(g, new THREE.ConeGeometry(s * 0.6, s * 0.9, 4), hexOf((f.art && f.art.fin) || b[0]), x - s * 1.9, y, z); tl.rotation.z = Math.PI / 2;
  });
}
export const MEDALS = [3, 7, 14, 30, 60, 100, 200, 365];
// 原点が床の中心、正面は +z。大きさは w×d マス(1マス=1)。壁かけは「壁にふれる面が z=0」「幅の中心が x=0」。
export const ITEMS = [
  { id: 'bed', lie: 0.63, cat: 'ねる・すわる', name: 'ベッド', price: 700, w: 2, d: 3, build(g) {
    box(g, 1.9, 0.35, 2.9, 0xf3d9b1, 0, 0, 0); box(g, 1.8, 0.28, 2.6, 0xffc2d1, 0, 0.35, 0.1);
    box(g, 1.8, 0.2, 0.12, 0xf3d9b1, 0, 0.35, -1.42); box(g, 1.2, 0.18, 0.55, 0xffffff, 0, 0.63, -0.95); } },
  { id: 'sofa', sit: 0.4, cat: 'ねる・すわる', name: 'ソファ', price: 500, w: 3, d: 1, build(g) {
    box(g, 2.9, 0.4, 0.95, 0xb9a6e6, 0, 0, 0); box(g, 2.9, 0.55, 0.28, 0xa793d9, 0, 0.4, -0.36);
    box(g, 0.28, 0.35, 0.8, 0xa793d9, -1.31, 0.4, 0.05); box(g, 0.28, 0.35, 0.8, 0xa793d9, 1.31, 0.4, 0.05); } },
  { id: 'lowtable', cat: 'つくえ・しゅうのう', name: 'ローテーブル', price: 300, w: 2, d: 1, build(g) {
    box(g, 1.8, 0.1, 0.85, 0xe8c9a0, 0, 0.35, 0);
    for (const sx of [-0.8, 0.8]) for (const sz of [-0.32, 0.32]) box(g, 0.1, 0.35, 0.1, 0xd0ae84, sx, 0, sz); } },
  { id: 'dining', cat: 'つくえ・しゅうのう', name: 'ダイニングテーブル', price: 500, w: 2, d: 2, build(g) {
    box(g, 1.9, 0.12, 1.9, 0xefd3a8, 0, 0.62, 0);
    for (const sx of [-0.8, 0.8]) for (const sz of [-0.8, 0.8]) box(g, 0.12, 0.62, 0.12, 0xd6b588, sx, 0, sz); } },
  { id: 'chair', sit: 0.45, cat: 'ねる・すわる', name: 'いす', price: 150, w: 1, d: 1, build(g) {
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
  { id: 'armchair', sit: 0.42, cat: 'ねる・すわる', name: 'ひじかけいす', price: 350, w: 1, d: 1, build(g) {
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
  // ---- キッチン ----
  { id: 'stove', cat: 'キッチン・おふろ', name: 'コンロ', price: 450, w: 1, d: 1, build(g) {
    box(g, 0.9, 0.85, 0.8, 0xfafafa, 0, 0, 0); box(g, 0.9, 0.04, 0.8, 0x2b2b33, 0, 0.85, 0);
    for (const [x, z] of [[-0.2, -0.15], [0.2, 0.15]]) { cyl(g, 0.13, 0.02, 0x555560, x, 0.89, z); cyl(g, 0.07, 0.025, 0x777784, x, 0.9, z); }
    for (const x of [-0.25, 0, 0.25]) cyl(g, 0.035, 0.04, 0x9aa8b2, x, 0.7, 0.41); box(g, 0.7, 0.35, 0.02, 0x3a3a44, 0, 0.15, 0.41); } },
  { id: 'sink', cat: 'キッチン・おふろ', name: '流し台', price: 550, w: 2, d: 1, build(g) {
    box(g, 1.9, 0.85, 0.8, 0xe8d6bc, 0, 0, 0); box(g, 1.94, 0.05, 0.84, 0xeef1f4, 0, 0.85, 0); box(g, 0.7, 0.03, 0.45, 0x9aa8b2, -0.3, 0.88, 0.02);
    cyl(g, 0.025, 0.32, 0xc9d2d8, -0.3, 0.9, -0.3); box(g, 0.04, 0.03, 0.2, 0xc9d2d8, -0.3, 1.2, -0.2);
    for (const x of [-0.5, 0, 0.5]) box(g, 0.04, 0.1, 0.03, 0xb39c7c, x + 0.2, 0.55, 0.41); } },
  { id: 'counter', cat: 'キッチン・おふろ', name: 'キッチンカウンター', price: 400, w: 2, d: 1, build(g) {
    box(g, 1.9, 0.85, 0.8, 0xf4ece0, 0, 0, 0); box(g, 1.96, 0.05, 0.86, 0xc9a28c, 0, 0.85, 0);
    for (const x of [-0.5, 0.5]) box(g, 0.3, 0.03, 0.02, 0xb39c7c, x, 0.65, 0.41); } },
  { id: 'cupboard', cat: 'キッチン・おふろ', name: '食器だな', price: 500, w: 1, d: 1, build(g) {
    box(g, 0.9, 1.9, 0.5, 0xd9b99a, 0, 0, -0.15); box(g, 0.8, 0.9, 0.02, 0xcfe8f5, 0, 0.9, 0.11);
    for (const y of [1.05, 1.4]) { box(g, 0.8, 0.02, 0.4, 0xc9a28c, 0, y, -0.15); for (const x of [-0.25, 0, 0.25]) cyl(g, 0.09, 0.02, 0xffffff, x, y + 0.02, -0.15); } } },
  { id: 'microwave', cat: 'キッチン・おふろ', name: '電子レンジ', price: 300, w: 1, d: 1, build(g) {
    box(g, 0.55, 0.32, 0.38, 0xf2f2f2, 0, 0, 0); box(g, 0.36, 0.24, 0.02, 0x2b2b33, -0.06, 0.04, 0.19); box(g, 0.08, 0.2, 0.02, 0xc9d2d8, 0.2, 0.06, 0.19); } },
  { id: 'kettle', cat: 'キッチン・おふろ', name: 'ケトル', price: 120, w: 1, d: 1, build(g) {
    cyl(g, 0.12, 0.2, 0xff9fb4, 0, 0, 0, 0.09); cyl(g, 0.03, 0.04, 0x5a4a6b, 0, 0.2, 0); box(g, 0.03, 0.12, 0.03, 0x5a4a6b, 0.13, 0.06, 0); } },
  // ---- おふろ ----
  { id: 'bathtub', sit: 0.12, cat: 'キッチン・おふろ', name: 'バスタブ', price: 900, w: 2, d: 1, build(g) {
    box(g, 1.9, 0.55, 0.9, 0xffffff, 0, 0, 0); box(g, 1.7, 0.02, 0.7, 0x9fd8f0, 0, 0.45, 0);
    for (const x of [-0.85, 0.85]) cyl(g, 0.05, 0.08, 0xd8b04a, x, 0, 0.35); cyl(g, 0.025, 0.3, 0xc9d2d8, -0.85, 0.55, -0.35); } },
  { id: 'shower', cat: 'キッチン・おふろ', name: 'シャワー', price: 800, w: 1, d: 1, build(g) {
    box(g, 0.95, 0.08, 0.95, 0xf4f8fa, 0, 0, 0); cyl(g, 0.025, 2.0, 0xc9d2d8, -0.35, 0.08, -0.4);
    const hd = cyl(g, 0.12, 0.04, 0xc9d2d8, -0.2, 2.0, -0.3); hd.rotation.x = 0.3; box(g, 0.2, 0.03, 0.03, 0xc9d2d8, -0.3, 2.0, -0.38);
    const gl = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.9, 0.02), new THREE.MeshLambertMaterial({ color: 0xcfeefa, transparent: true, opacity: 0.35 })); gl.position.set(0, 1.03, 0.46); g.add(gl);
    const gl2 = gl.clone(); gl2.rotation.y = Math.PI / 2; gl2.position.set(0.46, 1.03, 0); g.add(gl2); } },
  { id: 'washbasin', cat: 'キッチン・おふろ', name: '洗面台', price: 500, w: 1, d: 1, build(g) {
    box(g, 0.8, 0.8, 0.5, 0xf4ece0, 0, 0, -0.15); box(g, 0.84, 0.05, 0.56, 0xffffff, 0, 0.8, -0.15); cyl(g, 0.17, 0.06, 0xe8eef2, 0, 0.83, -0.1);
    cyl(g, 0.02, 0.2, 0xc9d2d8, 0, 0.85, -0.35); box(g, 0.6, 0.6, 0.03, 0xcfe8f5, 0, 1.15, -0.4); } },
  { id: 'bathmat', cat: 'キッチン・おふろ', name: 'バスマット', price: 100, w: 1, d: 1, flat: true, build(g) { box(g, 0.8, 0.02, 0.55, 0xa8d8e8, 0, 0, 0); } },
  { id: 'towelrack', cat: 'キッチン・おふろ', wall: true, name: 'タオルかけ', price: 150, w: 1, d: 1, y0: 1.1, build(g) {
    box(g, 0.7, 0.03, 0.08, 0xc9d2d8, 0, 0.3, 0.06); box(g, 0.5, 0.45, 0.04, 0xffb3c1, 0, -0.12, 0.1); } },
  { id: 'bouquet', cat: 'かざり', noshop: true, name: 'そら君の花束', price: 0, w: 1, d: 1, build(g) {
    cyl(g, 0.16, 0.42, 0xbfe6ff, 0, 0, 0, 0.12); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = i ? 0.12 : 0; cyl(g, 0.012, 0.3, 0x6fae6a, Math.cos(a) * r * 0.5, 0.42, Math.sin(a) * r * 0.5); ball(g, 0.08, [0xff9fb4, 0xffd36b, 0xffffff, 0xff7a9a, 0xc9b8ea][i % 5], Math.cos(a) * r, 0.75 + (i ? 0 : 0.06), Math.sin(a) * r); } } },
  // ---- ドア(となりの部屋へ) ----
  { id: 'door', cat: 'かべ', wall: true, door: true, name: 'ドア', price: 300, w: 1, d: 1, y0: 0, build(g) {
    box(g, 1.0, 2.15, 0.06, 0xb39c7c, 0, 0, 0.03); box(g, 0.86, 2.05, 0.05, 0xd9b99a, 0, 0, 0.07); ball(g, 0.045, 0xd8b04a, 0.32, 1.0, 0.12); } },
  { id: 'medal3', cat: 'かべ', wall: true, noshop: true, medal: 3, name: '3日連続メダル', price: 0, w: 1, d: 1, y0: 1.5, build(g) { medal(g, 3, 0xc98a5a); } },
  { id: 'medal7', cat: 'かべ', wall: true, noshop: true, medal: 7, name: '7日連続メダル', price: 0, w: 1, d: 1, y0: 1.5, build(g) { medal(g, 7, 0xc98a5a); } },
  { id: 'medal14', cat: 'かべ', wall: true, noshop: true, medal: 14, name: '14日連続メダル', price: 0, w: 1, d: 1, y0: 1.5, build(g) { medal(g, 14, 0xc9d2d8); } },
  { id: 'medal30', cat: 'かべ', wall: true, noshop: true, medal: 30, name: '30日連続メダル', price: 0, w: 1, d: 1, y0: 1.5, build(g) { medal(g, 30, 0xc9d2d8); } },
  { id: 'medal60', cat: 'かべ', wall: true, noshop: true, medal: 60, name: '60日連続メダル', price: 0, w: 1, d: 1, y0: 1.5, build(g) { medal(g, 60, 0xf2c94c); } },
  { id: 'medal100', cat: 'かべ', wall: true, noshop: true, medal: 100, name: '100日連続メダル', price: 0, w: 1, d: 1, y0: 1.5, build(g) { medal(g, 100, 0xf2c94c); } },
  { id: 'medal200', cat: 'かべ', wall: true, noshop: true, medal: 200, name: '200日連続メダル', price: 0, w: 1, d: 1, y0: 1.5, build(g) { medal(g, 200, 0xb8a8ff); } },
  { id: 'medal365', cat: 'かべ', wall: true, noshop: true, medal: 365, name: '365日連続メダル', price: 0, w: 1, d: 1, y0: 1.5, build(g) { medal(g, 365, 0xff9fd0); } },
  { id: 'window', cat: 'かべ', wall: true, name: 'まど', price: 500, w: 2, d: 1, y0: 1.0, build(g) {
    box(g, 1.7, 1.4, 0.08, 0xffffff, 0, 0, 0.04); glow(box(g, 1.5, 1.2, 0.02, 0xbfe6ff, 0, 0.1, 0.09), 0x4a7090);
    box(g, 0.06, 1.2, 0.04, 0xffffff, 0, 0.1, 0.11); box(g, 1.5, 0.06, 0.04, 0xffffff, 0, 0.7, 0.11); } },
];
// 英語の釣り堀でもらうもの(お店では売らない)。標本はセットの数だけ、魚の標本は魚の数だけ
ITEMS.push({ id: 'tank', cat: 'かざり', noshop: true, name: '砂吹さんの水槽', price: 0, w: 2, d: 1, build(g) { tank(g); } });
for (const s of SETS) ITEMS.push({ id: 'sp_' + s.id, cat: 'かざり', noshop: true, spec: s.id, name: `${s.look.name}の標本`, price: 0, w: 1, d: 1, build(g) { specimenJar(g, s); } });
for (const f of FISH_SPEC) ITEMS.push({ id: 'fs_' + f.id, cat: 'かざり', noshop: true, name: `${f.name}の標本`, price: 0, w: 1, d: 1, build(g) { fishJar(g, f); } });
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
export const ROOM_TYPES = [['', 'ふつう'], ['kitchen', 'キッチン'], ['bath', 'バスルーム']];
const ROOM_TYPE_NAME = { kitchen: 'キッチン', bath: 'バスルーム' };
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
    else { if (ctx.wallet.get() < c.coinsPerLine) return `コインが足りないよ(あと ${c.coinsPerLine - ctx.wallet.get()})`; if (!ctx.wallet.spend(c.coinsPerLine, 'house')) return 'コインが足りないよ'; }
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
  setType(roomId, type) { const h = this.get(), r = h.rooms.find(x => x.id === roomId); if (!r) return; const was = r.type || ''; r.type = type || ''; if (!r.name || ROOM_NAMES.includes(r.name) || r.name === ROOM_TYPE_NAME[was]) r.name = ROOM_TYPE_NAME[r.type] || r.name; this.save(h); },
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
      if (!Array.isArray(old) && !st.get('inv')) {   // はじめての人だけ、最初の部屋に机といすを置いておく(持ち物にも1つずつ入れる)
        v = [{ uid: 'init-desk', id: 'desk', room: 'r1', gx: 6, gz: 2, r: 0 }, { uid: 'init-chair', id: 'chair', room: 'r1', gx: 7, gz: 4, r: 2 }];
        st.set('inv', { desk: 1, chair: 1 });
      }
      st.set('put', v);
    }
    if (!st.get('chairFix')) { st.set('chairFix', 1); const c = v.find(p => p.uid === 'init-chair' && !p.r); if (c) { c.r = 2; st.set('put', v); } }   // 最初のいすの向きを180度反対に(1回だけ)
    return v.filter(p => ITEM[p.id]);
  },
  savePlaced: v => st.set('put', v),
  saveInv: v => st.set('inv', v),
  owned(id) { return this.inv()[id] || 0; },
  // 勉強を続けたメダル(もらった日数のリスト)を、持ち物に入れる。新しく入ったものを返す
  take(id) { const inv = this.inv(); if (inv[id] > 0) { inv[id]--; if (!inv[id]) delete inv[id]; this.saveInv(inv); return true; } const put = this.placed(), i = put.findIndex(p => p.id === id); if (i >= 0) { put.splice(i, 1); this.savePlaced(put); return true; } return false; },   // 混ぜて使った標本を消す(持ち物 → なければ置いてあるもの)
  give(id, n = 1) { const inv = this.inv(); inv[id] = (inv[id] || 0) + n; this.saveInv(inv); },
  grantMedals(days) { const inv = this.inv(), out = []; for (const n of days || []) { const id = 'medal' + n; if (ITEM[id] && !inv[id]) { inv[id] = 1; out.push(ITEM[id]); } } if (out.length) this.saveInv(inv); return out; },
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
    if (!wallet.spend(total, 'furniture')) return 'コインが足りないよ';
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
export function findSpot(rm, list, p, near = null) {   // near:{x,z}(マス×U)があれば、そこにいちばん近い空き(=カメラの手前)
  const k = kindOf(p.id);
  if (k === 'wall') {
    const it = ITEM[p.id], len = wallLen(p);
    for (const side of ['n', 'w']) {
      const total = (side === 'n' ? rm.cols : rm.rows) * U;
      const cand = [];
      for (let gx = 0; gx + len <= total; gx += 1) {
        const q = { ...p, wall: side, gx, y: it.y0 };
        const clash = list.some(o => kindOf(o.id) === 'wall' && o.wall === side && o.uid !== p.uid && gx < o.gx + wallLen(o) && o.gx < gx + len && Math.abs((o.y ?? ITEM[o.id].y0) - it.y0) < 1.0);
        if (!clash) { if (!near) return q; cand.push(q); }
      }
      if (cand.length) { const c = side === 'n' ? near.x : near.z; cand.sort((a, b) => Math.abs(a.gx + len / 2 - c) - Math.abs(b.gx + len / 2 - c)); return cand[0]; }
    }
    return { ...p, wall: 'n', gx: 0, y: it.y0 };
  }
  if (k === 'ceil') { return { ...p, gx: Math.floor((rm.cols * U - U) / 2), gz: Math.floor((rm.rows * U - U) / 2), r: 0 }; }
  let best = null, bd = 1e9;
  for (let r = 0; r < 2; r++) for (let gz = 0; gz <= rm.rows * U; gz += U) for (let gx = 0; gx <= rm.cols * U; gx += U) {
    const q = { ...p, gx, gz, r }; if (!inside(rm, q)) continue;
    const [w, d] = size(q);
    const clash = list.some(o => { if (o.uid === p.uid || (kindOf(o.id) !== 'floor' && kindOf(o.id) !== 'flat')) return false; const [ow, od] = size(o); return q.gx < o.gx + ow && o.gx < q.gx + w && q.gz < o.gz + od && o.gz < q.gz + d; });
    if (!clash || kindOf(p.id) === 'flat') { if (!near) return q; const dd = Math.hypot(gx + w / 2 - near.x, gz + d / 2 - near.z) + r * 0.01; if (dd < bd) { bd = dd; best = q; } }
  }
  if (best) return best;
  return { ...p, gx: 0, gz: 0, r: 0 };   // あいている所がなければ、すみに重ねる
}
