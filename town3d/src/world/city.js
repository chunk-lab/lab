// 町を組み立てる。town_data.js の設計図から、道・建物・小物を作り、当たり判定と調べられる場所を返す
import * as THREE from 'three';
import { C, WALLS, ROOFS, mat, glowMat, wallMat, roofMat, foliageMat, paveMat, texPane, texShop, box, rbox, cyl, sph, geo, Batcher, textTexture, signMat } from './kit.js';
import { STREETS, ROAD_HALF, WALK, PLAZA_R, LANDMARKS, AREAS, SPOTS, GRAPH } from './town_data.js';
import { rng } from '../core/core.js';

const FACE = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], se: [0.707, 0.707] };
const SHOP_NAMES = ['パン', '花屋', '文房具', 'やおや', '本屋', '古着', 'たい焼き', 'くすり', '雑貨', '写真館', 'ケーキ', 'ラーメン', '喫茶', 'とこや', 'おもちゃ', 'とうふ', 'お茶', '手芸'];

export function buildCity(scene, { quality = 'high', blossom = false } = {}) {
  const r = rng(20261021);
  const B = new Batcher();
  const colliders = [];
  const trees = [];         // 木の位置(秋の落ち葉が落ちてくる所)     // { x0,x1,z0,z1 } か { cx,cz,r }
  const interact = [];      // 入口・調べる場所
  const buildings = [];     // 建物の外形(マップのダブルタップで、入口の前へ案内するため)
  const animated = [];      // 毎フレーム動かすもの
  const reserved = [];      // 建物を置いてはいけない範囲
  const lampSpots = [];

  const addRect = (x0, x1, z0, z1, col = true) => { reserved.push({ x0, x1, z0, z1 }); if (col) colliders.push({ x0, x1, z0, z1 }); };
  const overlaps = (a, m = 0.6) => reserved.some(b => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m)
    || rectCircleDist(a, 0, 0) < PLAZA_R + 1.5 || Math.max(Math.abs(a.x0), Math.abs(a.x1), Math.abs(a.z0), Math.abs(a.z1)) > 66;
  const M4 = (x, z, ry) => new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(1, 1, 1));

  // ---------- 地面と道 ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: C.grass, roughness: 1, map: grassTex() }));
  ground.material.map.repeat.set(150, 150);
  const grassPatch = sh => {   // 広い範囲のゆるい色むら(同じ模様のくり返しを目立たなくする)
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <map_fragment>', '#include <map_fragment>\n float n = sin(vWp.x * 0.11 + sin(vWp.z * 0.07) * 2.0) * sin(vWp.z * 0.09 + sin(vWp.x * 0.05) * 2.0) + 0.5 * sin(vWp.x * 0.31 + vWp.z * 0.23);\n diffuseColor.rgb *= vec3(0.96 + n * 0.045, 1.0 + n * 0.03, 0.95 + n * 0.02);');
  };
  ground.material.onBeforeCompile = grassPatch;
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  const paveM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, map: paveTex() });
  const walkM = paveMat(C.walk), curbM = mat(C.curb), lineM = mat(C.roadLine);
  for (const [dir, f, a, b] of STREETS) {
    reserved.push(dir === 'ns' ? { x0: f - ROAD_HALF - WALK, x1: f + ROAD_HALF + WALK, z0: a, z1: b } : { x0: a, x1: b, z0: f - ROAD_HALF - WALK, z1: f + ROAD_HALF + WALK });
    const len = b - a, mid = (a + b) / 2;
    const g = new THREE.PlaneGeometry(dir === 'ns' ? ROAD_HALF * 2 : len, dir === 'ns' ? len : ROAD_HALF * 2);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (dir === 'ns' ? 2 : len / 4), uv.getY(i) * (dir === 'ns' ? len / 4 : 2));
    const road = new THREE.Mesh(g, paveM);
    road.rotation.x = -Math.PI / 2; road.position.set(dir === 'ns' ? f : mid, 0.02, dir === 'ns' ? mid : f); road.receiveShadow = true;
    scene.add(road);
    for (const s of [-1, 1]) {
      const off = s * (ROAD_HALF + WALK / 2);
      if (dir === 'ns') { B.add(box(WALK, 0.06, len), walkM, f + off, 0.03, mid); B.add(box(0.18, 0.12, len), curbM, f + s * ROAD_HALF, 0.06, mid); }
      else { B.add(box(len, 0.06, WALK), walkM, mid, 0.03, f + off); B.add(box(len, 0.12, 0.18), curbM, mid, 0.06, f + s * ROAD_HALF); }
    }
    // 街灯と並木を歩道に
    for (let t = a + 5; t < b - 3; t += 11) {
      const s = (Math.round(t / 11) % 2) ? 1 : -1;
      const off = s * (ROAD_HALF + 0.5);
      const [x, z] = dir === 'ns' ? [f + off, t] : [t, f + off];
      if (Math.hypot(x, z) > PLAZA_R + 2) lampSpots.push([x, z, dir === 'ns' ? (s > 0 ? -Math.PI / 2 : Math.PI / 2) : (s > 0 ? Math.PI : 0)]);
    }
  }
  // 横断歩道(交差点の手前)
  const zebra = (x, z, alongX) => { for (let i = -3; i <= 3; i++) B.add(box(alongX ? 0.5 : 2.4, 0.02, alongX ? 2.4 : 0.5), lineM, x + (alongX ? i * 1.05 : 0), 0.04, z + (alongX ? 0 : i * 1.05)); };
  zebra(0, -33, true); zebra(0, -39, true); zebra(0, 33, true); zebra(0, 39, true);

  // ---------- 広場 ----------
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(PLAZA_R, 48), new THREE.MeshStandardMaterial({ map: plazaTex(), roughness: 0.9 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.045; plaza.receiveShadow = true;
  scene.add(plaza);
  B.add(geo('ring', () => new THREE.TorusGeometry(PLAZA_R, 0.14, 6, 64)), curbM, 0, 0.05, 0, 0, 1, 1, 1, null, Math.PI / 2);
  fountain(0, 0);
  interact.push({ kind: 'snowfight', id: 'snowfight', app: 'snowfight', season: 'winter', x: 0, z: 6.5, r: 2.4, label: '☃️ 雪合戦をする' });   // 冬だけ(ゲーム機なしで遊べる)
  for (let i = 0; i < 8; i++) {
    const a = (i + 0.5) / 8 * Math.PI * 2;
    if (i % 2) bench(Math.sin(a) * 13, -Math.cos(a) * 13, -a + Math.PI);
    else { flowerBed(Math.sin(a) * 13.2, -Math.cos(a) * 13.2, -a); tree(Math.sin(a) * 13.2, -Math.cos(a) * 13.2, 'pink', 0.8); }
  }
  clockPole(9.5, -9.5);

  // ---------- 目印の建物 ----------
  for (const L of LANDMARKS) building({ ...L, landmark: true });

  // 学校の校庭と門
  const sch = LANDMARKS.find(l => l.id === 'school');
  fence(sch.x - 26, sch.z - 7, sch.x - 18, sch.z + 9);
  fence(sch.x + 18, sch.z - 7, sch.x + 26, sch.z + 9);
  for (const s of [-1, 1]) { B.add(rbox(0.8, 2.2, 0.8, 0.15), mat(C.stone), sch.x + s * 5, 1.1, sch.z + 9.5); colliders.push({ cx: sch.x + s * 5, cz: sch.z + 9.5, r: 0.6 }); }
  B.add(signPlate('まちの学校', 2.8, 0.7, { bg: '#fffaf0', fg: '#7a6a8b' }), signMat('まちの学校', { bg: '#fffaf0', fg: '#7a6a8b' }), sch.x - 5, 1.7, sch.z + 9.92);

  // ---------- 公園 ----------
  const P = AREAS.park;
  reserved.push({ x0: P.x0, x1: P.x1, z0: P.z0, z1: P.z1 });
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(P.x1 - P.x0, P.z1 - P.z0), (() => { const lt = ground.material.map.clone(); lt.needsUpdate = true; lt.repeat.set((P.x1 - P.x0) / 4, (P.z1 - P.z0) / 4); const m = new THREE.MeshStandardMaterial({ color: 0xa9dc9a, roughness: 1, map: lt }); m.onBeforeCompile = grassPatch; return m; })());
  lawn.rotation.x = -Math.PI / 2; lawn.position.set((P.x0 + P.x1) / 2, 0.015, (P.z0 + P.z1) / 2); lawn.receiveShadow = true; scene.add(lawn);
  path([[40, 4], [40, 11], [30, 19], [41, 26], [53, 20], [53, 10], [40, 11]], 2.2);
  pond(46, 18, 3.8);
  [[24, 10], [24, 28], [34, 29], [58, 9], [58, 29], [47, 29], [33, 11], [28, 24]].forEach(([x, z], i) => tree(x, z, i % 3 ? 'green' : 'pink', 0.9 + r() * 0.5));
  bench(36, 21, Math.PI * 0.75); bench(50, 25, -Math.PI * 0.6); bench(44, 10.5, Math.PI);
  hedge(P.x0, P.x1, P.z1 + 0.5, true);

  // ---------- 神社 ----------
  const S = AREAS.shrine;
  reserved.push({ x0: S.x0, x1: S.x1, z0: S.z0, z1: S.z1 });
  path([[-45, -4], [-45, -24]], 2.4, 0xe9e1ee);
  torii(-45, -8);
  shrineHall(-45, -26);
  [[-50, -12], [-40, -12]].forEach(([x, z]) => lantern(x, z));
  [[-53, -16], [-37, -16], [-53, -27], [-37, -27], [-55, -9], [-35, -9]].forEach(([x, z], i) => tree(x, z, i < 2 ? 'pink' : 'deep', 1.1 + r() * 0.3));
  hedge(S.x0, S.x1, S.z0 - 0.5, true);

  // バス停
  busStop(-58, 6.4);

  // ---------- 通り沿いの建物 ----------
  for (const [dir, f, a, b] of STREETS) {
    for (const side of [-1, 1]) {
      let t = a + 1;
      while (t < b - 4) {
        const w = 6 + Math.floor(r() * 5), d = 7 + Math.floor(r() * 4);
        const along = t + w / 2, perp = f + side * (ROAD_HALF + WALK + 0.3 + d / 2);
        const [cx, cz] = dir === 'ns' ? [perp, along] : [along, perp];
        const [hw, hd] = dir === 'ns' ? [d / 2, w / 2] : [w / 2, d / 2];
        const rect = { x0: cx - hw, x1: cx + hw, z0: cz - hd, z1: cz + hd };
        if (overlaps(rect)) { t += 2; continue; }
        const face = dir === 'ns' ? (side > 0 ? 'w' : 'e') : (side > 0 ? 'n' : 's');
        const kindRoll = r();
        const kind = kindRoll < 0.45 ? 'shop' : kindRoll < 0.75 ? 'apt' : 'house';
        const h = kind === 'apt' ? 9 + Math.floor(r() * 5) : kind === 'shop' ? 5.5 + Math.floor(r() * 3) : 5 + r();
        building({ x: cx, z: cz, w, d, h, face, kind, wall: WALLS[Math.floor(r() * WALLS.length)], roof: kind === 'house' ? 'gable' : 'flat', roofColor: ROOFS[Math.floor(r() * ROOFS.length)], trim: ROOFS[Math.floor(r() * ROOFS.length)], sign: kind === 'shop' ? SHOP_NAMES[Math.floor(r() * SHOP_NAMES.length)] : null });
        t += w + 0.4 + r() * 1.2;
      }
    }
  }

  // ---------- 奥の空き地:小さな家と木 ----------
  for (let i = 0; i < 420; i++) {
    const x = (r() * 2 - 1) * 62, z = (r() * 2 - 1) * 62;
    const house = r() < 0.45;
    const w = house ? 6 + r() * 2 : 2.4, d = house ? 6 + r() * 2 : 2.4;
    const rect = { x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 };
    if (overlaps(rect, house ? 1.2 : 0.4)) continue;
    if (house) building({ x, z, w, d, h: 4.6 + r() * 1.2, face: ['n', 's', 'e', 'w'][Math.floor(r() * 4)], kind: 'house', wall: WALLS[Math.floor(r() * WALLS.length)], roof: 'gable', roofColor: ROOFS[Math.floor(r() * ROOFS.length)] });
    else { tree(x, z, r() < 0.15 ? 'pink' : 'green', 0.8 + r() * 0.6); reserved.push(rect); }
  }

  // 街灯・自販機・電柱
  for (const [x, z, ry] of lampSpots) lamp(x, z, ry);
  [[-6.6, 33.5, Math.PI / 2], [6.6, 18.2, -Math.PI / 2], [6.6, -33, -Math.PI / 2], [-33, -6.6, 0], [22, 6.6, Math.PI]].forEach(([x, z, ry]) => vending(x, z, ry));

  // 遠くの山なみと町並み(霧に溶けて広さを感じさせる)
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2, rr = 150 + r() * 40, s = 30 + r() * 30;
    B.add(sph(1, 12), mat([0xc8e6c0, 0xd4c8ee, 0xbfdccf][i % 3], { roughness: 1 }), Math.cos(a) * rr, -s * 0.25, Math.sin(a) * rr, 0, s * 1.6, s * 0.55, s);
  }
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, rr = 85 + r() * 30, h = 8 + r() * 22;
    B.add(rbox(8, 1, 8, 0.3), mat(WALLS[i % WALLS.length]), Math.cos(a) * rr, h / 2, Math.sin(a) * rr, a, 1 + r(), h, 1 + r());
  }

  for (const sp of SPOTS) interact.push({ kind: 'spot', ...sp, r: 2.2 });

  const meshes = B.build(scene, { shadow: quality !== 'low' });
  for (const m of meshes) { const sn = m.material.userData.season; if (sn === 'blossom') m.visible = blossom; else if (sn === 'nonblossom') m.visible = !blossom; }

  return {
    colliders, interact, buildings, animated, graph: GRAPH, groundMats: [ground.material, lawn.material], trees,
    setLite(on) { animated.fountainLite?.(on); },
    areaName(x, z) {
      if (Math.hypot(x, z) < PLAZA_R + 1) return 'ほし広場';
      for (const k in AREAS) { const a = AREAS[k]; if (x > a.x0 - 1 && x < a.x1 + 1 && z > a.z0 - 1 && z < a.z1 + 1) return a.name; }
      for (const L of LANDMARKS) if (Math.hypot(x - L.x, z - L.z) < Math.max(L.w, L.d) * 0.6 + 3) return L.name;
      let best = null, bd = 1e9;
      for (const [dir, f, a, b, name] of STREETS) {
        const d = dir === 'ns' ? Math.abs(x - f) + Math.max(0, a - z, z - b) : Math.abs(z - f) + Math.max(0, a - x, x - b);
        if (d < bd) { bd = d; best = name; }
      }
      return bd < 14 ? best : 'まちはずれ';
    },
    update(t, hour) {
      for (const f of animated) f(t);
      const hh = animated.hourHands;
      if (hh) { const a = [(hour % 1) * Math.PI * 2, (hour % 12) / 12 * Math.PI * 2]; hh.forEach(([f, b], i) => { f.rotation.z = -a[i]; b.rotation.z = a[i]; }); }
    },
    meshes,
    setBlossom(on) { for (const m of meshes) { const sn = m.material.userData.season; if (sn === 'blossom') m.visible = on; else if (sn === 'nonblossom') m.visible = !on; } },
  };

  // ================= 部品 =================
  function building(o) {
    const [nx, nz] = FACE[o.face];
    const ry = Math.atan2(nx, nz);
    const P4 = M4(o.x, o.z, ry);
    const { w, d, h } = o;
    const rot = Math.abs(nx) > 0.5;
    const hw = rot ? d / 2 : w / 2, hd = rot ? w / 2 : d / 2;
    addRect(o.x - hw, o.x + hw, o.z - hd, o.z + hd);
    const bld = { x0: o.x - hw, x1: o.x + hw, z0: o.z - hd, z1: o.z + hd, door: null }; buildings.push(bld);
    const wallM = wallMat(o.wall), trimM = mat(o.trim || 0xffffff), whiteM = mat(0xfffdf8);
    const winM = glowMat('window', C.glass, 0xffd99a, { tag: 'pane', map: texPane() });
    const shopM = glowMat('window', C.glass, 0xffd99a, { tag: 'shop', map: texShop(), uv: 1 / 1.6 });
    // 本体と土台
    B.add(rbox(w, h, d, 0.35), wallM, 0, h / 2, 0, 0, 1, 1, 1, P4);
    B.add(rbox(w + 0.2, 0.5, d + 0.2, 0.15), mat(0xe8dfe9), 0, 0.25, 0, 0, 1, 1, 1, P4);
    // 屋根
    if (o.roof === 'gable') {
      const rh = Math.min(w, d) * 0.38;
      B.add(prism(w + 0.8, rh, d + 0.8), roofMat(o.roofColor), 0, h, 0, 0, 1, 1, 1, P4);
      B.add(rbox(w + 0.3, 0.22, d + 0.3, 0.05), whiteM, 0, h - 0.08, 0, 0, 1, 1, 1, P4);
      B.add(rbox(0.7, 1.4, 0.7, 0.1), mat(0xe6d6cf), w * 0.25, h + rh * 0.55, -d * 0.15, 0, 1, 1, 1, P4); // えんとつ
    } else {
      B.add(rbox(w + 0.3, 0.45, d + 0.3, 0.15), trimM, 0, h + 0.15, 0, 0, 1, 1, 1, P4);
      if (r() < 0.6 && w > 7) { B.add(cyl(0.9, 0.9, 1.5, 12), mat(0xdfe6f2), -w * 0.25, h + 1.1, -d * 0.2, 0, 1, 1, 1, P4); B.add(cyl(0.06, 0.06, 0.8, 6), mat(C.metal), -w * 0.25, h + 0.4, -d * 0.2, 0, 1, 1, 1, P4); }
      if (r() < 0.7) B.add(rbox(1.2, 0.7, 0.8, 0.1), mat(0xf2f0f7), w * 0.22, h + 0.7, d * 0.15, 0, 1, 1, 1, P4);
    }
    const front = d / 2 + 0.02;
    const floors = Math.max(1, Math.floor((h - 0.6) / 3.1));
    const storefront = o.kind === 'shop' || o.kind === 'cafe' || o.kind === 'arcade' || (o.landmark && o.kind !== 'house');
    const dW = o.landmark ? 2.2 : 1.3;
    const doorLX = storefront && w > 6 && o.kind !== 'school' ? w / 2 - dW / 2 - 1.2 : 0;
    // 1階の正面
    if (storefront) {
      const l = -w / 2 + 0.7, rr = o.kind === 'school' ? w / 2 - 0.7 : doorLX - dW / 2 - 0.5;
      const segs = o.kind === 'school' ? [[l, -dW / 2 - 0.6], [dW / 2 + 0.6, rr]] : [[l, rr]];
      for (const [a0, a1] of segs) if (a1 - a0 > 0.8) {
        B.add(box(a1 - a0, 2.0, 0.08), shopM, (a0 + a1) / 2, 1.6, front, 0, 1, 1, 1, P4);
        B.add(box(a1 - a0 + 0.3, 0.18, 0.14), whiteM, (a0 + a1) / 2, 2.68, front + 0.03, 0, 1, 1, 1, P4);
      }
      // ひさし(しま模様の半円筒)
      const aw = Math.min(w - 0.6, 9);
      B.add(geo('awn', () => new THREE.CylinderGeometry(0.75, 0.75, 1, 12, 1, true, 0, Math.PI)), mat(o.trim || C.coral, { side: THREE.DoubleSide }), 0, 3.05, front + 0.35, 0, 1, aw, 1, P4, 0, Math.PI / 2);
      for (let i = 0; i < 6; i++) B.add(box(0.12, 0.12, 0.12), whiteM, -aw / 2 + (i + 0.5) * aw / 6, 2.32, front + 0.95, 0, 1, 1, 1, P4);
    }
    for (const sx of [-1, 1]) B.add(rbox(0.32, h, 0.32, 0.06), whiteM, sx * (w / 2 - 0.02), h / 2, d / 2 - 0.02, 0, 1, 1, 1, P4);   // かどの柱
    // 入口
    B.add(rbox(dW + 0.35, 2.6, 0.2, 0.08), whiteM, doorLX, 1.3, front, 0, 1, 1, 1, P4);
    B.add(box(dW, 2.3, 0.12), o.landmark ? glowMat('window', 0xfff1c9, 0xffcf7a) : mat(0xb99a8e), doorLX, 1.15, front + 0.06, 0, 1, 1, 1, P4);
    B.add(sph(0.06, 8), mat(0xd9c7a0), doorLX + dW * 0.32, 1.1, front + 0.16, 0, 1, 1, 1, P4);   // とって
    B.add(box(dW + 0.9, 0.12, 1.1), mat(0xeee6f1), doorLX, 0.06, front + 0.55, 0, 1, 1, 1, P4);
    // 窓(上の階)
    const cols = Math.max(1, Math.floor((w - 1.2) / 2.2));
    for (let f = (o.kind === 'house' ? 0 : 1); f < floors; f++) {
      const y = 1.7 + f * 3.1;
      if (y > h - 1) break;
      for (let c = 0; c < cols; c++) {
        const x = -w / 2 + (c + 0.5) * (w / cols);
        if (f === 0 && Math.abs(x - doorLX) < 1.6) continue;
        B.add(box(1.15, 1.35, 0.06), whiteM, x, y, front, 0, 1, 1, 1, P4);
        B.add(box(0.95, 1.15, 0.08), winM, x, y, front + 0.02, 0, 1, 1, 1, P4);
        B.add(box(1.4, 0.09, 0.3), whiteM, x, y - 0.72, front + 0.12, 0, 1, 1, 1, P4);   // まど台
        B.add(box(1.3, 0.1, 0.16), whiteM, x, y + 0.72, front + 0.06, 0, 1, 1, 1, P4);   // ひさし
        if (o.kind === 'apt' && f > 0) {
          B.add(box(1.9, 0.12, 0.9), whiteM, x, y - 0.95, front + 0.45, 0, 1, 1, 1, P4);
          B.add(box(1.9, 0.7, 0.06), mat(o.trim || 0xffffff), x, y - 0.55, front + 0.88, 0, 1, 1, 1, P4);
          if (r() < 0.45) for (let k = 0; k < 3; k++) B.add(box(0.35, 0.45, 0.03), mat(WALLS[Math.floor(r() * WALLS.length)]), x - 0.5 + k * 0.5, y - 0.05, front + 0.8, 0, 1, 1, 1, P4);
        } else if (o.kind === 'house' && r() < 0.6) B.add(box(1.3, 0.25, 0.35), mat(C.leafPink), x, y - 0.75, front + 0.2, 0, 1, 1, 1, P4);
      }
    }
    // 側面の窓と室外機
    for (const s of [-1, 1]) {
      for (let f = 1; f < floors; f++) { const y = 1.7 + f * 3.1; if (y > h - 1) break; B.add(box(0.06, 1.1, 0.9), winM, s * (w / 2 + 0.02), y, 0, 0, 1, 1, 1, P4); }
      if (r() < 0.5) B.add(rbox(0.5, 0.6, 0.8, 0.06), mat(0xf4f2f8), s * (w / 2 + 0.25), 0.8, -d * 0.2, 0, 1, 1, 1, P4);
    }
    // 看板
    if (o.sign) {
      const big = !!o.landmark;
      const sw = big ? Math.min(w - 2, 6.5) : Math.min(w - 1.5, 3.4), sh = big ? 1.4 : 0.9;
      const style = o.kind === 'arcade'
        ? { bg: '#3d2c5e', fg: '#ffd1f0', border: '#ff8fd8', font: 'bold 80px sans-serif' }
        : { bg: '#fffaf2', fg: '#6b5a7e', border: big ? '#' + (o.trim || 0xee9a9a).toString(16).padStart(6, '0') : null, font: 'bold 66px sans-serif' };
      const sy = o.kind === 'house' ? h - 0.9 : Math.min(h - 0.9, big ? 4.6 : 3.9);
      B.add(rbox(sw + 0.22, sh + 0.22, 0.12, 0.05), mat(0xfffdf8), 0, sy, front + 0.16, 0, 1, 1, 1, P4);   // 看板の下板(窓とかさならないよう前に出す)
      B.add(signPlate(o.sign, sw, sh), signMat(o.sign, style), 0, sy, front + 0.235, 0, 1, 1, 1, P4);
      if (!big && r() < 0.6) {
        // 縦の袖看板
        const vt = o.sign.slice(0, 4);
        B.add(signPlate('v' + vt, 0.8, 2.2), signMat(vt, { bg: '#ffffff', fg: '#7c5d8f', w: 128, h: 352, vertical: true, font: 'bold 72px sans-serif', border: '#f7b8c8' }), w / 2 - 0.4, Math.min(h - 1.6, 4.8), front + 0.7, Math.PI / 2, 1, 1, 1, P4);
      }
    }
    // ゲームセンターのネオン
    if (o.kind === 'arcade') {
      const n1 = glowMat('neon', 0xffb3e6, 0xff6fd0), n2 = glowMat('neon', 0xb3f0ff, 0x5ee0ff);
      B.add(box(w - 0.4, 0.12, 0.12), n1, 0, h - 0.25, front + 0.1, 0, 1, 1, 1, P4);
      B.add(box(w - 0.4, 0.12, 0.12), n2, 0, 3.55, front + 0.1, 0, 1, 1, 1, P4);
      for (const s of [-1, 1]) B.add(box(0.12, h - 3.8, 0.12), s < 0 ? n1 : n2, s * (w / 2 - 0.2), 3.55 + (h - 3.8) / 2, front + 0.1, 0, 1, 1, 1, P4);
      for (let i = 0; i < 5; i++) B.add(sph(0.18, 8), i % 2 ? n1 : n2, -w / 2 + 1.5 + i * (w - 3) / 4, 5.6, front + 0.2, 0, 1, 1, 1, P4);
    }
    if (o.kind === 'cafe') {
      for (const s of [-1, 1]) { B.add(cyl(0.45, 0.45, 0.06, 14), whiteM, s * 2.2 + 0.5, 0.75, front + 2.4, 0, 1, 1, 1, P4); B.add(cyl(0.05, 0.05, 0.75, 6), mat(C.metal), s * 2.2 + 0.5, 0.37, front + 2.4, 0, 1, 1, 1, P4); B.add(geo('para', () => new THREE.ConeGeometry(1.3, 0.6, 10)), mat(s < 0 ? C.coral : C.mint), s * 2.2 + 0.5, 2.3, front + 2.4, 0, 1, 1, 1, P4); B.add(cyl(0.03, 0.03, 2, 6), whiteM, s * 2.2 + 0.5, 1.2, front + 2.4, 0, 1, 1, 1, P4); }
    }
    if (o.kind === 'house') {
      B.add(box(0.5, 0.5, 0.5), mat(C.coral), doorLX + 1.3, 0.25, front + 0.6, 0, 1, 1, 1, P4);
      B.add(sph(0.35, 8), mat(C.leaf), doorLX + 1.3, 0.7, front + 0.6, 0, 1, 1, 1, P4);
    }
    // 店先のプランター
    if (o.kind === 'shop' && r() < 0.6) flowerBox(P4, -w / 2 + 1, front + 0.5);
    if (o.landmark || o.app) {
      const dp = new THREE.Vector3(doorLX, 0, d / 2 + 1.1).applyMatrix4(P4);
      const wx = dp.x, wz = dp.z;
      const door = { kind: 'door', id: o.id, name: o.name, app: o.app, x: wx, z: wz, fx: nx, fz: nz, r: 2.4, label: o.name + 'に入る' };
      interact.push(door); bld.door = door;
      // 入口の目印(ゆっくり光る輪)
      const ring = new THREE.Mesh(geo('dring', () => new THREE.RingGeometry(0.75, 0.95, 32)), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(wx, 0.07, wz);
      scene.add(ring);
      animated.push(t => { const k = 0.5 + Math.sin(t * 2.5) * 0.5; ring.material.opacity = 0.35 + k * 0.45; ring.scale.setScalar(1 + k * 0.12); });
    }
  }

  function signPlate(key, w, h) { return geo('sp' + key + w + h, () => new THREE.PlaneGeometry(w, h)); }
  function prism(w, h, d) {
    return geo(`pr${w},${h},${d}`, () => {
      const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g;
    });
  }
  function tree(x, z, kind = 'green', s = 1) {
    trees.push({ x, z, s });
    colliders.push({ cx: x, cz: z, r: 0.35 * s });
    const pinkTree = kind === 'pink';   // 桜は春だけ(ピンクと緑の葉を両方つくり、季節で切りかえる)
    const leaf = foliageMat(pinkTree ? C.leafPink : kind === 'deep' ? 0x8cc89a : r() < 0.5 ? C.leaf : C.leaf2, pinkTree ? 'blossom' : '');
    const leafAlt = pinkTree ? foliageMat(0x8cc89a, 'nonblossom') : null;
    const tm = mat(C.trunk);
    B.add(cyl(0.13 * s, 0.24 * s, 2.4 * s, 10), tm, x, 1.2 * s, z);
    B.add(cyl(0.07 * s, 0.11 * s, 1.1 * s, 7), tm, x + 0.3 * s, 2.3 * s, z + 0.05 * s, 0, 1, 1, 1, null, 0, -0.6);
    B.add(cyl(0.06 * s, 0.1 * s, 1.0 * s, 7), tm, x - 0.28 * s, 2.35 * s, z - 0.1 * s, 0, 1, 1, 1, null, 0, 0.6);
    B.add(cyl(0.3 * s, 0.18 * s, 0.2 * s, 10), tm, x, 0.08 * s, z);   // 根もとのふくらみ
    const a = r() * 6;
    const blobs = [[0, 3.0, 0, 1.3], [0.85, 2.55, 0.3, 0.95], [-0.8, 2.65, -0.4, 0.9], [0.1, 3.9, -0.2, 0.8], [-0.35, 3.3, 0.8, 0.75], [0.5, 3.35, -0.8, 0.7], [-1.0, 3.0, 0.5, 0.6], [1.05, 3.1, -0.5, 0.62]];
    for (const [bx, by, bz, br] of blobs) { const px = x + (bx * Math.cos(a) - bz * Math.sin(a)) * s, pz = z + (bx * Math.sin(a) + bz * Math.cos(a)) * s, ry = r() * 6; B.add(sph(br * s, 14), leaf, px, by * s, pz, ry); if (leafAlt) B.add(sph(br * s, 14), leafAlt, px, by * s, pz, ry); }
  }
  function lamp(x, z, ry) {
    colliders.push({ cx: x, cz: z, r: 0.2 });
    const P4 = M4(x, z, ry);
    B.add(cyl(0.07, 0.1, 4.2, 8), mat(0xa99bc0), 0, 2.1, 0, 0, 1, 1, 1, P4);
    B.add(box(0.08, 0.08, 0.9), mat(0xa99bc0), 0, 4.1, 0.4, 0, 1, 1, 1, P4);
    B.add(sph(0.3, 12), glowMat('lamp', 0xfff6dc, 0xffd88a), 0, 3.85, 0.85, 0, 1, 0.8, 1, P4);
    B.add(cyl(0.34, 0.2, 0.15, 10), mat(0xa99bc0), 0, 4.05, 0.85, 0, 1, 1, 1, P4);
  }
  function bench(x, z, ry) {
    const P4 = M4(x, z, ry);
    colliders.push({ cx: x, cz: z, r: 0.8 });
    interact.push({ kind: 'bench', id: 'bench' + interact.length, x, z, ry, r: 1.8, label: '🪑 座る' });
    B.add(rbox(1.8, 0.12, 0.5, 0.04), mat(0xe8c9a8), 0, 0.48, 0, 0, 1, 1, 1, P4);
    for (const s of [-1, 1]) B.add(box(0.1, 0.48, 0.45), mat(0xa99bc0), s * 0.75, 0.24, 0, 0, 1, 1, 1, P4);
  }
  function flowerBed(x, z, ry) {
    const P4 = M4(x, z, ry);
    B.add(rbox(2.6, 0.45, 1.3, 0.15), mat(C.stone), 0, 0.22, 0, 0, 1, 1, 1, P4);
    for (let i = 0; i < 9; i++) B.add(sph(0.18, 6), mat([C.coral, C.butter, C.lavender, 0xffffff][i % 4]), -1 + (i % 5) * 0.5, 0.55, (i < 5 ? -0.25 : 0.25), 0, 1, 1, 1, P4);
  }
  function flowerBox(P4, lx, lz) {
    B.add(rbox(1.2, 0.4, 0.45, 0.06), mat(0xe2c5b0), lx, 0.2, lz, 0, 1, 1, 1, P4);
    for (let i = 0; i < 4; i++) B.add(sph(0.15, 6), mat([C.coral, C.butter, C.lavender][i % 3]), lx - 0.42 + i * 0.28, 0.48, lz, 0, 1, 1, 1, P4);
  }
  function fountain(x, z) {
    colliders.push({ cx: x, cz: z, r: 4.2 });
    const stone = mat(C.stone), stone2 = mat(0xd9d0e2);
    // 水ぞこと、ふちのある水槽(上ぶたがないので、水が見える)
    B.add(cyl(4.15, 4.2, 0.34, 40), stone2, x, 0.17, z);
    B.add(geo('fwall', () => new THREE.CylinderGeometry(4.2, 4.2, 0.62, 40, 1, true)), mat(C.stone, { side: THREE.DoubleSide }), x, 0.31, z);
    B.add(geo('frim', () => new THREE.TorusGeometry(4.12, 0.16, 8, 48)), stone, x, 0.64, z, 0, 1, 1, 1, null, Math.PI / 2);
    B.add(geo('frim2', () => new THREE.TorusGeometry(3.7, 0.05, 6, 48)), stone2, x, 0.36, z, 0, 1, 1, 1, null, Math.PI / 2);
    // 台座・2段目の皿
    B.add(cyl(1.0, 1.25, 1.5, 24), stone, x, 0.95, z);
    B.add(cyl(1.15, 1.0, 0.18, 24), stone2, x, 1.62, z);
    B.add(cyl(2.0, 1.55, 0.32, 32), stone, x, 1.78, z);
    B.add(geo('frim3', () => new THREE.TorusGeometry(1.97, 0.09, 8, 36)), stone, x, 1.95, z, 0, 1, 1, 1, null, Math.PI / 2);
    B.add(cyl(0.34, 0.46, 1.0, 16), stone, x, 2.4, z);
    B.add(cyl(0.6, 0.4, 0.14, 16), stone2, x, 2.9, z);
    B.add(sph(0.3, 16), mat(C.pink), x, 3.12, z);
    // 水面(水位は一定。さざなみの模様だけが流れる)
    const ripple = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(150,200,230,${0.1 + Math.random() * 0.15})`; g.lineWidth = 1 + Math.random() * 2; const px = Math.random() * 256, py = Math.random() * 256, l = 14 + Math.random() * 26; for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) { g.beginPath(); g.moveTo(px + dx, py + dy); g.quadraticCurveTo(px + dx + l / 2, py + dy - 4, px + dx + l, py + dy); g.stroke(); } } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const wm = new THREE.MeshStandardMaterial({ color: 0x9ad8f0, map: ripple, transparent: true, opacity: 0.86, roughness: 0.12, metalness: 0.05 });
    const water = new THREE.Mesh(new THREE.CircleGeometry(3.95, 48), wm); water.rotation.x = -Math.PI / 2; water.position.set(x, 0.5, z); scene.add(water);
    const bowl = new THREE.Mesh(new THREE.CircleGeometry(1.8, 32), wm); bowl.rotation.x = -Math.PI / 2; bowl.position.set(x, 1.965, z); scene.add(bowl);
    // 皿からこぼれ落ちる水のカーテン
    const sheetTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'); g.clearRect(0, 0, 64, 128); for (let i = 0; i < 18; i++) { const px = Math.random() * 64; g.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.4})`; g.fillRect(px, 0, 1 + Math.random() * 2, 128); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 1); return t; })();
    const sheet = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.05, 1.46, 40, 1, true), new THREE.MeshBasicMaterial({ map: sheetTex, color: 0xdff4ff, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
    sheet.position.set(x, 1.22, z); scene.add(sheet);
    // 噴き上がる水のしぶき(ひとつの描画でまとめて動かす)
    const N = 96, drops = new THREE.InstancedMesh(sph(0.075, 6), new THREE.MeshStandardMaterial({ color: 0xeaf9ff, transparent: true, opacity: 0.85, roughness: 0.1 }), N);
    drops.frustumCulled = false; scene.add(drops);
    const dd = []; for (let i = 0; i < N; i++) { const arm = i % 12; dd.push({ a: arm / 12 * Math.PI * 2 + (Math.random() - 0.5) * 0.15, vr: 0.9 + Math.random() * 1.5, vy: 3.1 + Math.random() * 1.2, ph: Math.random() }); }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    const rings = []; for (let i = 0; i < 6; i++) { const rg = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); rg.rotation.x = -Math.PI / 2; rg.position.set(x, 0.52, z); scene.add(rg); rings.push(rg); }
    animated.fountainLite = on => { drops.count = on ? 10 : N; sheet.visible = !on; rings.forEach(rg => { rg.visible = !on; }); };
    animated.push(t => {
      ripple.offset.set(t * 0.012, t * 0.007);
      sheetTex.offset.y = -t * 0.9;
      for (let i = 0; i < N; i++) {
        const d = dd[i], tl = 1.15 + d.vy * 0.02, u = ((t * 0.7 + d.ph) % 1) * tl, y = 3.3 + d.vy * u - 4.5 * u * u;
        const r = 0.15 + d.vr * u; if (y < 0.5) { sc.set(0, 0, 0); } else sc.set(1, 1, 1);
        ps.set(x + Math.cos(d.a) * r, y, z + Math.sin(d.a) * r); m4.compose(ps, q, sc); drops.setMatrixAt(i, m4);
      }
      drops.instanceMatrix.needsUpdate = true;
      rings.forEach((rg, i) => { const u = (t * 0.45 + i / 6) % 1, a = i / 6 * Math.PI * 2; rg.position.set(x + Math.cos(a) * (1.9 + (i % 3) * 0.35), 0.52, z + Math.sin(a) * (1.9 + (i % 3) * 0.35)); rg.scale.setScalar(0.2 + u * 1.4); rg.material.opacity = (1 - u) * 0.45; });
    });
  }
  function clockPole(x, z) {
    colliders.push({ cx: x, cz: z, r: 0.35 });
    B.add(cyl(0.12, 0.16, 4, 8), mat(0xb7a8cf), x, 2, z);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.2, 24), mat(0xfffaf0));
    face.rotation.x = Math.PI / 2; face.position.set(x, 4.2, z); scene.add(face);
    B.add(geo('ctor', () => new THREE.TorusGeometry(0.58, 0.07, 6, 24)), mat(C.coral), x, 4.2, z);
    const hands = [0.38, 0.26].map((l, i) => { const h = new THREE.Mesh(box(0.05, l, 0.03), mat(C.dark)); h.geometry = h.geometry.clone().translate(0, l / 2, 0); h.position.set(x, 4.2, z + 0.12); scene.add(h); const h2 = h.clone(); h2.position.z = z - 0.12; scene.add(h2); return [h, h2]; });
    animated.hourHands = hands;
  }
  function pond(x, z, rr) {
    colliders.push({ cx: x, cz: z, r: rr + 0.2 });
    interact.push({ kind: 'pond', id: 'pond', app: 'fishing', x: x + 3.2, z: z + 3.3, r: 2.2, label: '🎣 釣りをする' });
    B.add(cyl(rr + 0.4, rr + 0.5, 0.25, 28), mat(C.stone), x, 0.08, z);
    const w = new THREE.Mesh(new THREE.CircleGeometry(rr, 28), new THREE.MeshStandardMaterial({ color: C.water, roughness: 0.1 }));
    w.rotation.x = -Math.PI / 2; w.position.set(x, 0.22, z); scene.add(w);
    for (let i = 0; i < 4; i++) B.add(cyl(0.45, 0.45, 0.03, 10), mat(0x9ed69b), x + Math.cos(i * 1.7) * rr * 0.6, 0.24, z + Math.sin(i * 1.7) * rr * 0.6);
    const duck = new THREE.Group();
    const dm = mat(0xfff3c4); const b = new THREE.Mesh(sph(0.3, 10), dm); b.scale.set(1.2, 0.8, 1); duck.add(b);
    const hd = new THREE.Mesh(sph(0.18, 10), dm); hd.position.set(0.28, 0.25, 0); duck.add(hd);
    const bk = new THREE.Mesh(sph(0.07, 6), mat(0xffb38a)); bk.position.set(0.45, 0.22, 0); bk.scale.set(1.6, 0.6, 1); duck.add(bk);
    scene.add(duck);
    animated.push(t => { const a = t * 0.25; duck.position.set(x + Math.cos(a) * rr * 0.55, 0.3 + Math.sin(t * 2) * 0.02, z + Math.sin(a) * rr * 0.55); duck.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); });
    // こがもを2羽(反対まわり・小さめ)
    [[-0.18, 2.1, 0.55, 0.6], [0.31, 4.0, 0.35, 0.5]].forEach(([w, ph, rf, sc]) => {
      const d = duck.clone(); d.scale.setScalar(sc); scene.add(d);
      animated.push(t => { const a = t * w + ph; d.position.set(x + Math.cos(a) * rr * rf, 0.22 + Math.sin(t * 2 + ph) * 0.02, z + Math.sin(a) * rr * rf); d.rotation.y = Math.atan2(-Math.cos(a) * Math.sign(w), -Math.sin(a) * Math.sign(w)); });
    });
  }
  function slide(x, z) {
    colliders.push({ x0: x - 1.2, x1: x + 1.2, z0: z - 2.2, z1: z + 2.2 });
    B.add(rbox(1.6, 2.4, 1.6, 0.2), mat(C.coral), x, 1.2, z - 1.2);
    B.add(box(1.2, 0.12, 3.2), mat(C.butter), x, 1.3, z + 0.9, 0, 1, 1, 1, null, -0.65);
  }
  function hedge(x0, x1, zc) { for (let x = x0; x < x1; x += 1.6) B.add(rbox(1.7, 0.9, 0.9, 0.35), mat(0xa6d6a0), x + 0.8, 0.45, zc); }
  function path(pts, wdt, color = 0xf1e6dc) {
    const m = mat(color);
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
      const len = Math.hypot(bx - ax, bz - az);
      B.add(box(wdt, 0.04, len + wdt * 0.6), m, (ax + bx) / 2, 0.035, (az + bz) / 2, Math.atan2(bx - ax, bz - az));
    }
  }
  function torii(x, z) {
    const red = mat(0xf59a8c);
    for (const s of [-1, 1]) { B.add(cyl(0.22, 0.26, 4.4, 10), red, x + s * 2, 2.2, z); colliders.push({ cx: x + s * 2, cz: z, r: 0.35 }); B.add(cyl(0.32, 0.32, 0.35, 10), mat(0x6b5a7e), x + s * 2, 0.17, z); }
    B.add(rbox(6, 0.38, 0.5, 0.1), red, x, 4.5, z);
    B.add(rbox(5.2, 0.22, 0.35, 0.05), red, x, 3.7, z);
    B.add(rbox(0.3, 0.9, 0.25, 0.04), mat(0x6b5a7e), x, 4.05, z);
  }
  function shrineHall(x, z) {
    const P4 = M4(x, z, 0);
    addRect(x - 4, x + 4, z - 3.5, z + 3);
    B.add(rbox(8, 1, 6.5, 0.2), mat(C.stone), 0, 0.5, -0.25, 0, 1, 1, 1, P4);
    B.add(rbox(6, 3, 4.5, 0.15), mat(0xfff4e0), 0, 2.5, -0.5, 0, 1, 1, 1, P4);
    for (const s of [-1, 1]) B.add(cyl(0.2, 0.2, 3, 8), mat(0xf59a8c), s * 2.8, 2.5, 1.8, 0, 1, 1, 1, P4);
    B.add(prism(8.5, 2.4, 7), mat(0x8fa6d9), 0, 4, -0.3, 0, 1, 1, 1, P4);
    B.add(rbox(1.6, 0.8, 0.8, 0.08), mat(0xc9a28c), 0, 1.4, 2.6, 0, 1, 1, 1, P4); // おさいせん箱
    B.add(sph(0.35, 10), mat(0xffd98a), 0, 3.4, 2.1, 0, 1, 1, 1, P4); // 鈴
  }
  function lantern(x, z) {
    colliders.push({ cx: x, cz: z, r: 0.45 });
    B.add(cyl(0.45, 0.55, 0.3, 8), mat(C.stone), x, 0.15, z);
    B.add(cyl(0.18, 0.22, 1.1, 8), mat(C.stone), x, 0.85, z);
    B.add(rbox(0.75, 0.6, 0.75, 0.08), glowMat('lamp', 0xfff1d6, 0xffc46b), x, 1.7, z);
    B.add(geo('lcone', () => new THREE.ConeGeometry(0.7, 0.5, 4)), mat(C.stone), x, 2.25, z, Math.PI / 4);
  }
  function busStop(x, z) {
    addRect(x - 1.8, x + 1.8, z - 0.2, z + 1.4);
    B.add(rbox(3.6, 0.12, 1.6, 0.05), mat(C.sky), x, 2.5, z + 0.6);
    for (const s of [-1, 1]) B.add(cyl(0.06, 0.06, 2.5, 6), mat(C.metal), x + s * 1.6, 1.25, z + 0.1);
    B.add(box(3.4, 1.6, 0.06), new THREE.MeshStandardMaterial({ color: 0xdff1ff, transparent: true, opacity: 0.55 }), x, 1.5, z + 1.3);
    B.add(rbox(2.6, 0.1, 0.45, 0.04), mat(0xe8c9a8), x, 0.5, z + 0.9);
    B.add(cyl(0.05, 0.05, 2.3, 6), mat(C.metal), x + 2.3, 1.15, z);
    B.add(cyl(0.38, 0.38, 0.08, 16), mat(0xfffaf0), x + 2.3, 2.4, z, 0, 1, 1, 1, null, Math.PI / 2);
  }
  function fence(x0, z0, x1, z1) {
    addRect(x0, x1, z0, z1, false);
    const m = mat(0xffffff);
    for (let x = x0; x <= x1; x += 1.2) B.add(box(0.1, 1, 0.1), m, x, 0.5, z1);
    B.add(box(x1 - x0, 0.08, 0.06), m, (x0 + x1) / 2, 0.85, z1);
    colliders.push({ x0, x1, z0: z1 - 0.15, z1: z1 + 0.15 });
  }
  function vending(x, z, ry) {
    colliders.push({ cx: x, cz: z, r: 0.6 });
    const P4 = M4(x, z, ry);
    B.add(rbox(1, 1.9, 0.75, 0.08), mat(r() < 0.5 ? C.sky : C.coral), 0, 0.95, 0, 0, 1, 1, 1, P4);
    B.add(box(0.8, 0.9, 0.04), glowMat('vend', 0xdfe9f2, 0xcfe0f0), 0, 1.3, 0.38, 0, 1, 1, 1, P4);
    for (let i = 0; i < 4; i++) B.add(cyl(0.06, 0.06, 0.22, 6), mat([C.coral, C.mint, C.butter, C.lavender][i]), -0.27 + i * 0.18, 1.45, 0.42, 0, 1, 1, 1, P4);
  }
  function poles() {
    const pts = [];
    for (let x = -60; x <= 62; x += 13) if (Math.abs(x) > 18) pts.push([x, -(ROAD_HALF + WALK + 0.1)]);
    const lm = new THREE.LineBasicMaterial({ color: 0x8a7aa0, transparent: true, opacity: 0.6 });
    for (const [x, z] of pts) {
      colliders.push({ cx: x, cz: z, r: 0.25 });
      B.add(cyl(0.12, 0.15, 7.5, 8), mat(0xd7cfe0), x, 3.75, z);
      B.add(box(1.4, 0.1, 0.1), mat(0xd7cfe0), x, 7, z);
      B.add(cyl(0.18, 0.18, 0.5, 8), mat(0xb8b0c8), x + 0.3, 6.3, z);
    }
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
      if (bx - ax > 14) continue;
      for (const off of [-0.6, 0.6]) {
        const curve = [];
        for (let k = 0; k <= 10; k++) { const t = k / 10; curve.push(new THREE.Vector3(ax + (bx - ax) * t + off, 7.02 - Math.sin(t * Math.PI) * 0.5, az)); }
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve), lm));
      }
    }
  }
}

function rectCircleDist(a, cx, cz) {
  const dx = Math.max(a.x0 - cx, 0, cx - a.x1), dz = Math.max(a.z0 - cz, 0, cz - a.z1);
  return Math.hypot(dx, dz);
}

// ---------- 手描き風のテクスチャ ----------
function canvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
function grassTex() {
  return canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    const wrap = (x, y, f) => { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) f(x + dx, y + dy); };
    for (let i = 0; i < 40; i++) { const x = Math.random() * w, y = Math.random() * h, r = 10 + Math.random() * 22, v = Math.random() < 0.5 ? '120,170,110' : '255,255,200'; wrap(x, y, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, `rgba(${v},.22)`); gr.addColorStop(1, `rgba(${v},0)`); g.fillStyle = gr; g.fillRect(X - r, Y - r, r * 2, r * 2); }); }
    for (let i = 0; i < 900; i++) {   // 草の葉(短い線)
      const x = Math.random() * w, y = Math.random() * h, l = 4 + Math.random() * 7, a = (Math.random() - 0.5) * 0.7, dark = Math.random() < 0.55;
      g.strokeStyle = dark ? `rgba(70,130,80,${0.12 + Math.random() * 0.14})` : `rgba(255,255,220,${0.2 + Math.random() * 0.2})`; g.lineWidth = 1 + Math.random();
      wrap(x, y, (X, Y) => { g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.sin(a) * l, Y - Math.cos(a) * l); g.stroke(); });
    }
  });
}
function paveTex() {
  return canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#e8e1ee'; g.fillRect(0, 0, w, h);
    const n = 4, s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const off = (y % 2) * s / 2;
      const c = 228 + Math.floor(Math.random() * 16);
      g.fillStyle = `rgb(${c - 6},${c - 10},${c})`;
      g.beginPath(); g.roundRect(x * s + off + 3, y * s + 3, s - 6, s - 6, 10); g.fill();
      if (x === n - 1 && off) { g.beginPath(); g.roundRect(off - s + 3, y * s + 3, s - 6, s - 6, 10); g.fill(); }
    }
  });
}
function plazaTex() {
  const t = canvas(1024, 1024, (g, w, h) => {
    g.fillStyle = '#efe5ee'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const cols = ['#ffe3ea', '#e6ddff', '#fff0d6', '#dff5ea'];
    for (let ring = 0; ring < 14; ring++) {
      const r0 = 60 + ring * 32, segs = 12 + ring * 6;
      for (let s = 0; s < segs; s++) {
        g.fillStyle = cols[(ring + s) % 4];
        g.beginPath(); g.arc(cx, cy, r0 + 30, s / segs * Math.PI * 2, (s + 0.92) / segs * Math.PI * 2); g.arc(cx, cy, r0 + 2, (s + 0.92) / segs * Math.PI * 2, s / segs * Math.PI * 2, true); g.fill();
      }
    }
    g.strokeStyle = '#f2b8c6'; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, 300, 0, 7); g.stroke();
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
