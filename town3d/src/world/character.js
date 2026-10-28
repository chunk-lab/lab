// 人の形(4〜5頭身)をコードで組み立てる。見た目は look オブジェクトだけで決まるので、
// あとでアバター作成を作るときは look を編集する画面を作れば済む。
import * as THREE from 'three';
import { mat, sph, cyl, geo } from './kit.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const LOOKS = {
  hana: { name: 'はな', skin: 0xffe1cf, hair: 0x8a5a44, style: 'bob', top: 0xffb3c1, bottom: 0x93b5e1, shoes: 0xffffff, acc: 'ribbon', accColor: 0xff8fab },
  sora: { name: 'そら', skin: 0xf6d2bb, hair: 0x3f3a52, style: 'short', top: 0xa8e6cf, bottom: 0x6f7fa8, shoes: 0xee9a9a, acc: 'cap', accColor: 0x93b5e1 },
  mio: { name: 'みお', skin: 0xffe6d6, hair: 0xc9a28c, style: 'long', top: 0xc9b8ea, bottom: 0xfff4e0, shoes: 0xb79cd9, acc: null },
  ren: { name: 'れん', skin: 0xeec3a6, hair: 0x2e2a3d, style: 'spiky', top: 0xfdeeb0, bottom: 0x7d8fb3, shoes: 0x5a4a6b, acc: 'glasses', accColor: 0x5a4a6b },
};
const _hv = new THREE.Vector3();
export const LOOK_IDS = ['ren', 'mio'];   // 自分のキャラに選べるのは2人(はな・そらは住人)

// アニメ調のやわらかい3段の陰影と、ふちどり線(うらがえしの殻をふくらませる方式)
const ramp = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 185, 185, 185, 255, 235, 235, 235, 255, 255, 255, 255, 255]), 4, 1, THREE.RGBAFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
const toonCache = new Map();
function toon(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!toonCache.has(k)) toonCache.set(k, new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...o }));
  return toonCache.get(k);
}
const outlineMat = new THREE.MeshBasicMaterial({ color: 0x4d3a63, side: THREE.BackSide });
export const setCharOutline = on => { outlineMat.visible = on; };
outlineMat.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normalize(normal) * 0.011;'); };
const capsule = (r, l) => geo(`cap${r},${l}`, () => new THREE.CapsuleGeometry(r, l, 6, 16));

export function makeCharacter(look, { scale = 1 } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const M = (c, o = {}) => toon(c, o);
  const skin = M(look.skin), hair = M(look.hair), top = M(look.top), bottom = M(look.bottom), shoes = M(look.shoes);
  const add = (g, m, x, y, z, parent = body) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };

  // 脚(付け根で回す)
  const legs = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * 0.1, 0.62, 0); body.add(p);
    add(capsule(0.075, 0.34), bottom, 0, -0.27, 0, p);
    const sh = add(sph(0.095, 10), shoes, 0, -0.56, 0.035, p); sh.scale.set(1, 0.7, 1.35);
    return p;
  });
  // 胴
  const torso = add(capsule(0.19, 0.24), top, 0, 0.92, 0); torso.scale.set(1, 1, 0.82);
  add(cyl(0.2, 0.22, 0.14, 14), bottom, 0, 0.68, 0).scale.z = 0.85;
  add(geo('collar', () => new THREE.TorusGeometry(0.115, 0.032, 8, 20)), top, 0, 1.2, 0.0).rotation.x = Math.PI / 2;   // えり
  add(cyl(0.215, 0.215, 0.03, 16), mat(0xffffff, { roughness: 0.6 }), 0, 0.745, 0).scale.z = 0.85;   // ベルトのふち
  // 腕(肩で回す)
  const arms = [-1, 1].map(s => {
    const p = new THREE.Group(); p.position.set(s * 0.25, 1.1, 0); body.add(p);
    add(capsule(0.058, 0.26), top, 0, -0.17, 0, p);
    add(sph(0.065, 8), skin, 0, -0.38, 0, p);
    p.rotation.z = s * 0.12;
    return p;
  });
  // 頭
  const head = new THREE.Group(); head.position.set(0, 1.38, 0); body.add(head);
  add(sph(0.06, 8), skin, 0, -0.18, 0, head); // 首
  const face = add(sph(0.215, 24), skin, 0, 0, 0, head);
  face.scale.set(1, 0.96, 0.94);
  const browM = toon(new THREE.Color(look.hair).lerp(new THREE.Color(look.skin), 0.45).getHex());   // まゆは髪より少しうすく(こわく見えない)
  const eyes = [-1, 1].map(s => {
    const e = add(sph(0.036, 14), M(0x5b4467), s * 0.078, -0.012, 0.188, head); e.scale.set(0.95, 1.2, 0.55);
    const hl = add(sph(0.014, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 }), s * 0.078 + 0.011, 0.012, 0.2, head); hl.castShadow = false;
    const hl2 = add(sph(0.006, 6), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 }), s * 0.078 - 0.008, -0.018, 0.201, head); hl2.castShadow = false;
    const br = add(geo('brow', () => new THREE.CapsuleGeometry(0.005, 0.036, 3, 6)), browM, s * 0.08, 0.062, 0.19, head); br.rotation.z = Math.PI / 2 - s * 0.14; br.castShadow = false;
    return e;
  });
  [-1, 1].forEach(s => { const ear = add(sph(0.038, 8), skin, s * 0.212, -0.01, 0.0, head); ear.scale.set(0.5, 1, 0.8); });
  [-1, 1].forEach(s => { const c = add(sph(0.035, 8), mat(0xffb3c1, { transparent: true, opacity: 0.75 }), s * 0.12, -0.06, 0.17, head); c.scale.set(1.2, 0.6, 0.5); c.castShadow = false; });
  const mouth = add(sph(0.022, 8), M(0xe8738a), 0, -0.085, 0.198, head); mouth.scale.set(1.3, 0.6, 0.5);
  // 髪型(顔にかぶらないよう、あたまの上半分だけのおわん型 + うしろ・横のボリューム + 前髪は生えぎわの上だけ)
  const hairD = toon(look.hair, { side: THREE.DoubleSide });
  const capG = (r, th) => geo(`hcap${r},${th}`, () => new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, th));
  const cap = add(capG(0.236, 1.4), hairD, 0, 0.03, -0.015, head); cap.scale.set(1.03, 1, 1);
  const back = add(sph(0.2, 20), hair, 0, -0.03, -0.085, head); back.scale.set(1.02, 0.95, 0.9);
  if (look.style === 'bob') { const b = add(sph(0.236, 20), hair, 0, -0.1, -0.085, head); b.scale.set(1.0, 0.82, 0.92); }
  if (look.style === 'long') { const b = add(capsule(0.2, 0.3), hair, 0, -0.24, -0.1, head); b.scale.set(1.0, 1, 0.55); }
  if (look.style === 'spiky') for (let i = 0; i < 5; i++) { const sp = add(geo('spk', () => new THREE.ConeGeometry(0.07, 0.16, 8)), hair, -0.13 + i * 0.065, 0.22, -0.02 + (i % 2) * 0.03, head); sp.rotation.z = (i - 2) * -0.25; }
  // 前髪(おでこの上だけ。目・まゆには届かない)
  for (const [bx, bw] of [[-0.12, 0.07], [-0.04, 0.075], [0.05, 0.075], [0.125, 0.065]]) { const bg = add(sph(bw, 12), hair, bx, 0.16 - Math.abs(bx) * 0.1, 0.135, head); bg.scale.set(1.1, 0.85, 0.75); bg.rotation.z = bx * 1.4; }
  if (look.acc === 'ribbon') { [-1, 1].forEach(s => { const r = add(geo('rib', () => new THREE.ConeGeometry(0.07, 0.14, 4)), M(look.accColor), 0.14 + s * 0.07, 0.2, 0.02, head); r.rotation.z = s * Math.PI / 2; }); add(sph(0.035, 8), M(look.accColor), 0.14, 0.2, 0.02, head); }
  if (look.acc === 'cap') { const c = add(geo('hat', () => new THREE.SphereGeometry(0.25, 24, 12, 0, Math.PI * 2, 0, 1.3)), toon(look.accColor, { side: THREE.DoubleSide }), 0, 0.06, -0.01, head); const v = add(cyl(0.16, 0.16, 0.025, 14), M(look.accColor), 0, 0.12, 0.2, head); v.scale.z = 0.7; }
  if (look.acc === 'tophat') { add(cyl(0.15, 0.15, 0.22, 14), M(look.accColor), 0, 0.3, 0, head); add(cyl(0.24, 0.24, 0.025, 16), M(look.accColor), 0, 0.2, 0, head); add(cyl(0.152, 0.152, 0.04, 14), M(0xff9aa2), 0, 0.23, 0, head); }
  // 砂吹さんの帽子:つばの広い、くたっとした帽子に羽
  if (look.acc === 'snuf') {
    const hm = toon(look.accColor, { side: THREE.DoubleSide });
    add(cyl(0.31, 0.31, 0.02, 20), hm, 0, 0.17, 0, head);
    const dome = add(geo('snufdome', () => new THREE.SphereGeometry(0.23, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)), hm, 0, 0.17, 0, head); dome.scale.y = 1.15;
    add(cyl(0.235, 0.235, 0.045, 20), M(0x6b4a3a), 0, 0.2, 0, head);
    const fe = add(geo('snuff', () => new THREE.ConeGeometry(0.03, 0.2, 6)), M(0xf0e6c8), 0.22, 0.3, 0.02, head); fe.rotation.z = -0.9;
  }
  // 本(ノート)は、片手に下げて持つ(うでは、ふつうに振る)
  if (look.acc === 'apron') {
    add(geo('bookc', () => new THREE.BoxGeometry(0.05, 0.24, 0.18)), M(look.accColor), 0, -0.45, 0.01, arms[0]);
    add(geo('bookp', () => new THREE.BoxGeometry(0.036, 0.22, 0.165)), M(0xfff6e6), 0.022, -0.45, 0.015, arms[0]);
  }

  // 描画回数を減らすため、動かない部品は材質ごとに1つへ合体させる(スマホを軽くする)。ふちどりも1つにまとめる
  const keep = new Set([...eyes, torso]);
  const bakeGroup = grp => {
    const meshes = grp.children.filter(o => o.isMesh && !keep.has(o));
    const byMat = new Map(), outG = [];
    for (const o of meshes) {
      o.updateMatrix();
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      g.applyMatrix4(o.matrix);
      const key = o.material.uuid + (o.castShadow ? 's' : 'n');
      if (!byMat.has(key)) byMat.set(key, { m: o.material, cast: o.castShadow, gs: [] });
      byMat.get(key).gs.push(g);
      if (o.castShadow && o !== mouth && !o.material.transparent) outG.push(g);
      grp.remove(o);
    }
    for (const { m, cast, gs } of byMat.values()) { const mm = new THREE.Mesh(mergeGeometries(gs, false), m); mm.castShadow = cast; grp.add(mm); }
    if (outG.length) { const ol = new THREE.Mesh(mergeGeometries(outG.map(g => g.clone()), false), outlineMat); grp.add(ol); }
  };
  [body, head, ...legs, ...arms].forEach(bakeGroup);
  // 砂吹さんの持ち物:釣り竿とハーモニカ(動かすので、合体させずにあとから付ける)
  const snuf = look.acc === 'snuf';
  let fishG = null, harp = null;
  if (snuf) {
    fishG = new THREE.Group(); fishG.visible = false; arms[1].add(fishG);
    const rodG = new THREE.Group(); rodG.position.set(0, -0.45, 0.05); rodG.rotation.x = 1.78; fishG.add(rodG);
    add(cyl(0.012, 0.025, 1.9, 6), M(0x8a6b4a), 0, 0.95, 0, rodG);
    const lineG = new THREE.Group(); lineG.position.set(0, -1.24, 1.4); lineG.rotation.x = -2.24; fishG.add(lineG);
    add(cyl(0.004, 0.004, 1.3, 4), M(0xf5f5f5), 0, 0, 0, lineG);
    add(sph(0.04, 8), M(0xff6b6b), 0, -1.64, 0.89, fishG);
    harp = add(geo('harp', () => new THREE.BoxGeometry(0.2, 0.045, 0.05)), M(0xc8ccd4), 0, -0.1, 0.235, head); harp.visible = false;
  }
  { const ol = new THREE.Mesh(torso.geometry, outlineMat); ol.position.copy(torso.position); ol.scale.copy(torso.scale); torso.userData.ol = ol; body.add(ol); }
  for (const e of eyes) { /* 目はまばたきするので別メッシュのまま */ }

  // 足もとの丸い影(影を切っている低画質でも接地感を出す)
  const blob = new THREE.Mesh(geo('blob', () => new THREE.CircleGeometry(0.32, 16)), new THREE.MeshBasicMaterial({ color: 0x6b5a9a, transparent: true, opacity: 0.18, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.06; root.add(blob);

  root.scale.setScalar(scale);
  let phase = 0, blinkT = 2 + Math.random() * 3, wave = 0, idleT = Math.random() * 10;
  const self = {
    root, head,
    rig: { arms, legs, body, head, torso },   // ポーズを外から付けるとき(釣りの見せる画面など)
    height: 1.62 * scale,
    wave() { wave = 1.6; },
    update(dt, speed) {
      idleT += dt;
      const moving = speed > 0.05;
      phase += dt * (moving ? 3.2 + speed * 1.9 : 0);
      const amp = moving ? Math.min(1, speed / 3) : 0;
      const sw = Math.sin(phase) * (0.35 + amp * 0.45) * (moving ? 1 : 0);
      legs[0].rotation.x = sw; legs[1].rotation.x = -sw;
      arms[0].rotation.x = -sw * 0.9; arms[1].rotation.x = sw * 0.9;
      body.position.y = moving ? Math.abs(Math.sin(phase)) * 0.045 * (0.6 + amp) : Math.sin(idleT * 2.2) * 0.008;
      torso.scale.y = 1 + (moving ? 0 : Math.sin(idleT * 2.2) * 0.015); torso.userData.ol.scale.copy(torso.scale);
      body.rotation.x = moving ? amp * 0.08 : 0;
      head.rotation.y = moving ? 0 : Math.sin(idleT * 0.4) * 0.25;
      if (wave > 0) {
        wave -= dt;
        arms[1].rotation.z = Math.PI * 0.85 + Math.sin(wave * 14) * 0.25;
        arms[1].rotation.x = 0;
      } else arms[1].rotation.z = 0.12;
      if (snuf) {
        const ps = self.pose;
        fishG.visible = ps === 'fish'; harp.visible = ps === 'harp';
        if (ps === 'fish') { arms[1].rotation.x = -0.9 + Math.sin(idleT * 1.3) * 0.03; arms[1].rotation.z = 0.12; arms[0].rotation.x = 0; head.rotation.y = 0; }
        else if (ps === 'harp') { arms[0].rotation.x = arms[1].rotation.x = -2.1; arms[1].rotation.z = 0; head.rotation.y = 0; }
      }
      // すわる・ねころぶ(家の中で使う)
      if (self.pose === 'sit') { legs[0].rotation.x = legs[1].rotation.x = -1.45; arms[0].rotation.x = arms[1].rotation.x = -0.4; body.position.y = 0; body.rotation.x = 0; head.rotation.y = Math.sin(idleT * 0.4) * 0.25; }
      else if (self.pose === 'piano') { legs[0].rotation.x = legs[1].rotation.x = -1.45; arms[0].rotation.set(-1.15 + Math.sin(idleT * 11) * 0.07, 0, 0.18); arms[1].rotation.set(-1.15 + Math.sin(idleT * 11 + 2) * 0.07, 0, -0.18); body.position.y = 0; body.rotation.x = 0.05; head.rotation.y = Math.sin(idleT * 1.2) * 0.12; }   // ピアノを弾く
      else if (self.pose === 'kneel') { legs[0].rotation.x = -1.2; legs[1].rotation.x = 1.25; body.position.y = -0.3; head.rotation.y = 0; }   // 片ひざをついて雪玉をにぎる(腕・上体は外から)
      else if (self.pose === 'lie') { legs[0].rotation.x = legs[1].rotation.x = 0; arms[0].rotation.x = arms[1].rotation.x = 0; arms[0].rotation.z = 0.08; arms[1].rotation.z = -0.08; body.position.y = 0; body.rotation.x = -Math.PI / 2; head.rotation.y = 0; }
      // 手をつなぐ:holdTo(手を合わせる点・世界の座標)へ、holdArm の腕を向ける(0=右腕 1=左腕)
      if (self.holdTo) {
        const a = arms[self.holdArm ?? 1]; self.root.updateMatrixWorld(true);
        const L = body.worldToLocal(_hv.copy(self.holdTo)).sub(a.position), n = L.length() || 1; L.divideScalar(n);
        a.rotation.set(Math.atan2(-L.z, -L.y), 0, Math.asin(Math.max(-1, Math.min(1, L.x))));
      }
      blinkT -= dt;
      const b = blinkT < 0.12 ? 0.15 : 1;
      eyes.forEach(e => (e.scale.y = 1.25 * b));
      if (blinkT < 0) blinkT = 2 + Math.random() * 4;
    },
  };
  return self;
}

// 町のマスコット「チャンクくん」:雲。角のとれたクッションのサイコロが3つ、つながったような体
const cushionGeo = new Map();
function cushion(w, h, d, r) {
  const k = [w, h, d, r].join();
  if (!cushionGeo.has(k)) cushionGeo.set(k, new RoundedBoxGeometry(w, h, d, 5, r));   // 分割を多めにして、ふっくらなめらかに
  return cushionGeo.get(k);
}
export function makeChunkkun() {
  const root = new THREE.Group();
  const white = mat(0xfffdfa, { roughness: 0.7 }), shade = mat(0xe6e0f7, { roughness: 0.75 }), brown = mat(0x6b4a3a, { roughness: 0.8 }), pink = mat(0xff9fb4, { roughness: 0.6 });
  const half = [0.42, 0.35, 0.28];          // 3つのクッションの半分の大きさ(頭→しっぽ)
  const segs = [], xs = [];
  let x = 0;
  half.forEach((h, i) => {
    if (i) x -= (half[i - 1] + h) * 0.93;   // すこし重ねて、つながっているように
    xs.push(x);
    const g = new THREE.Group();
    const body = new THREE.Mesh(cushion(h * 2, h * 1.9, h * 2, h * 0.66), white); body.castShadow = true; g.add(body);
    const btn = new THREE.Mesh(sph(0.05, 8), shade); btn.scale.set(1, 0.45, 1); btn.position.y = h * 0.95; g.add(btn);   // クッションのボタン
    [-1, 1].forEach(sd => { const f = new THREE.Mesh(cushion(0.2, 0.12, 0.2, 0.05), brown); f.position.set(h * 0.1, -h * 0.92, sd * h * 0.5); g.add(f); });
    g.position.set(x, h * 0.95, 0);
    root.add(g); segs.push(g);
    if (i) {   // つなぎ目のふくらみ
      const j = new THREE.Mesh(cushion(0.3, 0.3, 0.3, 0.1), shade); j.position.set(x + (h + half[i - 1]) * 0.5 * 0.93 * 0.5, h * 0.7, 0); root.add(j);
    }
  });
  const head = segs[0], h0 = half[0];
  [-1, 1].forEach(sd => { const e = new THREE.Mesh(sph(0.045, 8), mat(0x2b2230)); e.scale.set(0.6, 1.5, 0.6); e.position.set(h0 + 0.005, 0.06, sd * 0.16); head.add(e); });
  const mouth = new THREE.Mesh(sph(0.055, 10), pink); mouth.scale.set(0.35, 0.6, 1); mouth.position.set(h0 + 0.005, -0.1, 0); head.add(mouth);
  [-1, 1].forEach(sd => { const c = new THREE.Mesh(sph(0.06, 8), mat(0xffb8c6, { transparent: true, opacity: 0.8 })); c.scale.set(0.3, 0.6, 1); c.position.set(h0 + 0.003, -0.03, sd * 0.29); head.add(c); });
  const hand = new THREE.Mesh(cushion(0.14, 0.14, 0.14, 0.05), brown); hand.position.set(h0 * 0.5, 0.0, h0 * 1.02); head.add(hand);
  const tail = new THREE.Mesh(geo('tail', () => new THREE.ConeGeometry(0.06, 0.16, 8)), brown); tail.rotation.z = Math.PI / 2; tail.position.set(-half[2] - 0.05, 0, 0); segs[2].add(tail);
  root.rotation.y = -Math.PI / 2; // 頭が +z を向くように
  const wrap = new THREE.Group(); wrap.add(root); wrap.scale.setScalar(0.92);
  let t = 0;
  return {
    root: wrap, height: 1.0,
    wave() {},
    update(dt, speed) {
      t += dt * (speed > 0.05 ? 7 : 2.4);
      segs.forEach((g, i) => {
        const k = Math.sin(t - i * 0.9), h = half[i];
        g.scale.set(1 + k * 0.04, 1 - k * 0.06, 1 + k * 0.03);
        g.position.y = h * 0.95 * (1 - k * 0.06) + (speed > 0.05 ? Math.max(0, k) * 0.06 : 0);
        g.rotation.z = Math.sin(t * 0.5 - i * 0.8) * 0.035;      // クッションがゆらゆら
        g.rotation.y = speed > 0.05 ? Math.sin(t * 0.5 - i) * 0.07 : 0;
      });
      hand.position.y = Math.sin(t * 2.2) * 0.05;
    },
  };
}

// 前まわりのでんぐり返し(よける)。u=0〜1。体の真ん中を軸に、ひざをかかえて丸まって1回転する
export function rollPose(rig, u) {
  const { body, legs, arms, head } = rig; if (!body || !legs) { if (body) body.rotation.x = u * Math.PI * 2; return; }
  const c = 0.72, e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, th = e * Math.PI * 2, k = Math.min(1, Math.sin(Math.PI * Math.min(1, u * 1.1)) * 1.8);
  body.rotation.x = th; body.position.set(0, c - c * Math.cos(th) + 0.3 * k, -c * Math.sin(th));
  legs[0].rotation.x = legs[1].rotation.x = -1.75 * k; arms[0].rotation.x = arms[1].rotation.x = -2.0 * k; arms[0].rotation.z = 0.25 * k; arms[1].rotation.z = -0.25 * k; head.rotation.x = 0.7 * k;
}
export function rollReset(rig) { if (!rig || !rig.body) return; rig.body.rotation.x = 0; rig.body.position.z = 0; if (rig.head) rig.head.rotation.x = 0; }
