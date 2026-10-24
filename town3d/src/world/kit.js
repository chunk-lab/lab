// 描画の共通部品:色トークン、材質キャッシュ、静的メッシュのまとめ描き
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const C = {
  mint: 0xa8e6cf, peach: 0xffd3b6, pink: 0xffb3c1, lavender: 0xc9b8ea, cream: 0xfff4e0, sky: 0xbde0fe,
  butter: 0xfdeeb0, sage: 0xcde7be, coral: 0xff9aa2, lilac: 0xe2d4f7, aqua: 0xb5ead7, apricot: 0xffc8a2,
  roofRed: 0xee9a9a, roofBlue: 0x93b5e1, roofGreen: 0x8fcfae, roofPurple: 0xb79cd9, roofBrown: 0xc9a28c,
  road: 0xd9d2e3, roadLine: 0xfaf7ff, walk: 0xf5ebe4, curb: 0xe6dbe9, grass: 0xbfe3b0, grassDark: 0xa6d49a,
  trunk: 0xb08b72, leaf: 0x9fd8a4, leaf2: 0xb6e3a1, leafPink: 0xffc6d9, stone: 0xe4dde8, water: 0x9fd9f2,
  dark: 0x5a4a6b, white: 0xffffff, glass: 0xcfe8ff, metal: 0xc9c6d6,
};
export const WALLS = [C.peach, C.mint, C.lavender, C.cream, C.sky, C.butter, C.pink, C.sage, C.lilac, C.apricot, C.aqua];
export const ROOFS = [C.roofRed, C.roofBlue, C.roofGreen, C.roofPurple, C.roofBrown];

const mats = new Map();
export function mat(color, opts = {}) {
  const key = color + '|' + JSON.stringify(opts);
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...opts }));
  return mats.get(key);
}
// 夜に光る材質(窓・街灯・ネオン)。強さは env が時刻で変える
export const glow = { window: [], lamp: [], neon: [], vend: [] };
export function glowMat(kind, color, emissive = color, x = null) {
  const key = 'glow|' + kind + color + emissive + (x ? x.tag : '');
  if (!mats.has(key)) {
    const m = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0, roughness: 0.4 });
    if (x) { m.map = x.map; m.emissiveMap = x.map; if (x.uv) m.userData.worldUV = x.uv; }
    glow[kind].push(m);
    mats.set(key, m);
  }
  return mats.get(key);
}

const geos = new Map();
export function geo(key, make) { if (!geos.has(key)) geos.set(key, make()); return geos.get(key); }
export const box = (w, h, d) => geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
export const rbox = (w, h, d, r = 0.2) => geo(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)));
export const cyl = (rt, rb, h, s = 14) => geo(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
export const sph = (r, s = 14) => geo(`s${r},${s}`, () => new THREE.SphereGeometry(r, s, Math.max(6, s * 0.7 | 0)));

const buildingOutline = new THREE.MeshBasicMaterial({ color: 0x6a5584, side: THREE.BackSide });
export const setBuildingOutline = on => { buildingOutline.visible = on; };
buildingOutline.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normalize(normal) * 0.045;'); };
// 動かない物は材質ごとに1つのメッシュへ合体させ、描画回数を減らす
export class Batcher {
  constructor() { this.items = new Map(); this.tmp = new THREE.Object3D(); }
  add(geometry, material, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, parent = null, rx = 0, rz = 0) {
    const o = this.tmp;
    o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); o.updateMatrix();
    const m = parent ? parent.clone().multiply(o.matrix) : o.matrix.clone();
    if (!this.items.has(material)) this.items.set(material, []);
    this.items.get(material).push([geometry, m]);
  }
  build(scene, { shadow = true } = {}) {
    const out = [];
    for (const [material, list] of this.items) {
      const gs = list.map(([g, m]) => {
        let c = g.index ? g.toNonIndexed() : g.clone();
        for (const k of Object.keys(c.attributes)) if (!['position', 'normal', 'uv'].includes(k)) c.deleteAttribute(k);
        if (!c.attributes.uv) c.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c.attributes.position.count * 2), 2));
        c.applyMatrix4(m);
        const vc = material.userData.vc;
        if (vc) {   // 地面に近いほど暗く(接地の影)、木は上ほど明るく:焼きこみの陰影で立体感を出す
          const P = c.attributes.position, N = c.attributes.normal, n = P.count, col = new Float32Array(n * 3), sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
          for (let i = 0; i < n; i++) {
            const y = P.getY(i), ny = N.getY(i); let f, w = 0;
            if (vc === 'wall') { f = ny > 0.7 ? 1 : 0.74 + 0.26 * sm(0, 1.8, y); f *= 1 - 0.05 * sm(7, 12, y) * 0; }
            else if (vc === 'foliage') { f = (0.74 + 0.26 * (ny * 0.5 + 0.5)) * (0.82 + 0.26 * sm(1.4, 5.2, y)); w = 0.07 * sm(2.5, 5, y) * (ny > 0 ? 1 : 0.3); }
            else f = 1;
            col[i * 3] = f * (1 + w); col[i * 3 + 1] = f * (1 + w * 0.5); col[i * 3 + 2] = f * (1 - w);
          }
          c.setAttribute('color', new THREE.BufferAttribute(col, 3));
        }
        const wu = material.userData.worldUV;
        if (wu) {   // 壁・屋根・歩道などは、面の大きさに関係なく同じ細かさで模様を貼る
          const P = c.attributes.position, N = c.attributes.normal, n = P.count, uv = new Float32Array(n * 2);
          for (let i = 0; i < n; i++) {
            const nx = Math.abs(N.getX(i)), ny = Math.abs(N.getY(i)), nz = Math.abs(N.getZ(i)), x = P.getX(i), y = P.getY(i), z = P.getZ(i);
            let u, v;
            if (ny >= nx && ny >= nz) { u = x; v = z; } else if (nx >= nz) { u = z; v = y; } else { u = x; v = y; }
            uv[i * 2] = u * wu; uv[i * 2 + 1] = v * wu;
          }
          c.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        }
        return c;
      });
      for (let i = 0; i < gs.length; i += 400) {
        const merged = mergeGeometries(gs.slice(i, i + 400), false);
        gs.slice(i, i + 400).forEach(g => g.dispose());
        const mesh = new THREE.Mesh(merged, material);
        mesh.castShadow = shadow && !material.transparent && !material.userData.noShadow;
        mesh.receiveShadow = true;
        mesh.matrixAutoUpdate = false;
        scene.add(mesh);
        out.push(mesh);
        if (material.userData.outline) {   // 建物のふちどり線(うらがえしの殻をふくらませる)
          const ol = new THREE.Mesh(merged, buildingOutline); ol.matrixAutoUpdate = false; ol.castShadow = false; ol.receiveShadow = false; scene.add(ol); out.push(ol);
        }
      }
    }
    this.items.clear();
    return out;
  }
}

// 看板などの文字テクスチャ
export function textTexture(text, { bg = '#fff', fg = '#5a4a6b', w = 512, h = 128, font = 'bold 64px sans-serif', border = null, vertical = false } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  g.fillStyle = bg;
  const r = Math.min(w, h) * 0.18;
  g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, r); g.fill();
  if (border) { g.strokeStyle = border; g.lineWidth = 8; g.stroke(); }
  g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (vertical) {
    const chars = [...text], step = (h - 30) / chars.length;
    chars.forEach((c, i) => g.fillText(c, w / 2, 15 + step * (i + 0.5)));
  } else g.fillText(text, w / 2, h / 2 + 4, w - 30);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export function signMat(text, opts) {
  const key = 'sign|' + text + JSON.stringify(opts || {});
  if (!mats.has(key)) {
    const m = new THREE.MeshStandardMaterial({ map: textTexture(text, opts), roughness: 0.6, emissive: 0xffffff, emissiveIntensity: 0 });
    m.emissiveMap = m.map;
    glow.neon.push(m);
    m.userData.noShadow = true;
    m.userData.max = 0.35;
    mats.set(key, m);
  }
  return mats.get(key);
}


// ---------- こまかい模様(白に近い灰色の濃淡を、材質の色にかけて使う) ----------
function mk(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
const speckle = (g, w, h, n, a) => { for (let i = 0; i < n; i++) { const v = Math.random() < 0.5 ? 90 : 255; g.fillStyle = `rgba(${v},${v - 10},${v + 10},${a * Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };
const TX = {};
export const texWall = () => TX.wall ||= mk(256, 256, (g, w, h) => {   // 細い板ばりのかべ(1枚 2.4m)
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 10; i++) { const y = i * h / 10; g.fillStyle = 'rgba(80,60,100,.13)'; g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, y + 2, w, 2); const gr = g.createLinearGradient(0, y, 0, y + h / 10); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(70,50,90,.06)'); g.fillStyle = gr; g.fillRect(0, y, w, h / 10); }
  speckle(g, w, h, 1800, 0.07);
});
export const texRoof = () => TX.roof ||= mk(256, 256, (g, w, h) => {   // うろこ状の屋根がわら
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = -1; c < 8; c++) {
    const x = c * 32 + (r % 2) * 16, y = r * 32;
    const gr = g.createLinearGradient(0, y, 0, y + 32); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(60,40,80,.22)');
    g.fillStyle = gr; g.beginPath(); g.arc(x + 16, y, 16, 0, Math.PI); g.lineTo(x, y); g.fill();
    g.strokeStyle = 'rgba(60,40,80,.28)'; g.lineWidth = 2; g.beginPath(); g.arc(x + 16, y, 15, 0.05, Math.PI - 0.05); g.stroke();
  }
  speckle(g, w, h, 600, 0.05);
});
export const texPave = () => TX.pave ||= mk(256, 256, (g, w, h) => {   // 歩道の四角いタイル(1枚 0.6m)
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 238 + Math.floor(Math.random() * 17); g.fillStyle = `rgb(${v},${v - 3},${v})`; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); }
  g.fillStyle = 'rgba(100,80,120,.28)'; for (let i = 0; i < 4; i++) { g.fillRect(i * 64, 0, 2, h); g.fillRect(0, i * 64, w, 2); }
  speckle(g, w, h, 1200, 0.08);
});
export const texPane = () => TX.pane ||= mk(128, 128, (g, w, h) => {   // 窓わく(十字)
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c4b9d2'; g.fillRect(0, 0, w, 7); g.fillRect(0, h - 7, w, 7); g.fillRect(0, 0, 7, h); g.fillRect(w - 7, 0, 7, h); g.fillRect(w / 2 - 3, 0, 6, h); g.fillRect(0, h / 2 - 3, w, 6);
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,.0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(8, 8, w - 16, h - 16);
});
export const texShop = () => TX.shop ||= mk(128, 128, (g, w, h) => {   // 店先の大きなガラス(1枚 1.6m)
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#cfc5dc'; g.fillRect(0, 0, 4, h); g.fillRect(0, h * 0.78, w, 4);
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.45, 'rgba(255,255,255,.4)'); gr.addColorStop(0.6, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
export function texMat(color, tex, uv, key) {
  const k = 'tex|' + key + color;
  if (!mats.has(k)) { const m = new THREE.MeshToonMaterial({ color, gradientMap: rampSoft(), map: tex() }); m.userData.worldUV = uv; if (key === 'wall') { m.vertexColors = true; m.userData.vc = 'wall'; m.userData.outline = true; } mats.set(k, m); }
  return mats.get(k);
}
export const wallMat = c => texMat(c, texWall, 1 / 2.4, 'wall');
export const roofMat = c => texMat(c, texRoof, 1 / 1.6, 'roof');
export const paveMat = c => texMat(c, texPave, 1 / 2.4, 'pave');

export function eachFoliage(fn) { for (const m of mats.values()) if (m.userData && m.userData.vc === 'foliage') fn(m); }
export function foliageMat(color, season = '') {   // 木の葉(上ほど明るく、下ほど暗い陰影を焼きこむ専用の材質)。season は桜の切りかえ用
  const k = 'foliage|' + color + season;
  if (!mats.has(k)) { const m = new THREE.MeshToonMaterial({ color, gradientMap: rampSoft(), vertexColors: true }); m.userData.vc = 'foliage'; if (season) m.userData.season = season; mats.set(k, m); }
  return mats.get(k);
}

let _rs;
function rampSoft() {   // 町の建物・木用のやわらかい陰影(キャラより段が細かい)
  if (!_rs) { _rs = new THREE.DataTexture(new Uint8Array([150, 150, 150, 255, 196, 196, 196, 255, 232, 232, 232, 255, 255, 255, 255, 255]), 4, 1, THREE.RGBAFormat); _rs.minFilter = _rs.magFilter = THREE.NearestFilter; _rs.needsUpdate = true; }
  return _rs;
}
