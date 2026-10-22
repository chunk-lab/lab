// 町の「住んでる感じ」:小物・路面の飾り・舞う花びら・鳥・ねこ・ほたる・ちょうちょ
import * as THREE from 'three';
import { Batcher, C, mat, box, cyl, sph, rbox, geo } from './kit.js';
import { STREETS, AREAS } from './town_data.js';

function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const dotTex = (draw) => { const c = document.createElement('canvas'); c.width = c.height = 32; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };

export function buildAmbient(scene, city, { quality = 'mid', blossom = false } = {}) {
  const R = rng(20261022), B = new Batcher();
  const low = quality === 'low';
  const blocked = (x, z, m = 1.1) => city.colliders.some(c => c.x0 !== undefined ? (x > c.x0 - m && x < c.x1 + m && z > c.z0 - m && z < c.z1 + m) : Math.hypot(x - c.cx, z - c.cz) < c.r + m);
  const pick = a => a[Math.floor(R() * a.length)];
  const COL = [C.pink, C.mint, C.butter, C.sky, C.lavender, C.apricot];

  // ---- 小物(合体メッシュ) ----
  const planter = (x, z) => {
    const pc = pick(COL);
    B.add(rbox(0.7, 0.5, 0.7, 0.15), mat(pc), x, 0.25, z);
    B.add(sph(0.38, 10), mat(C.leaf), x, 0.62, z, 0, 1, 0.8, 1);
    for (let i = 0; i < 4; i++) B.add(sph(0.1, 8), mat(pick([C.pink, 0xffffff, C.butter, C.coral])), x + (R() - .5) * .5, 0.85 + R() * .12, z + (R() - .5) * .5);
  };
  const aframe = (x, z, ry) => {
    const tilt = 0.22;
    for (const s of [-1, 1]) B.add(box(0.7, 0.9, 0.05), mat(s > 0 ? 0xf3e7d6 : 0xe9dcc8), x, 0.45, z, ry, 1, 1, 1, new THREE.Matrix4().makeTranslation(0, 0, 0), s * tilt);
    B.add(box(0.5, 0.35, 0.02), mat(0x5a4a6b), x, 0.55, z + 0.001, ry);   // 黒板
  };
  const bike = (x, z, ry) => {
    const wg = geo('wheel', () => new THREE.TorusGeometry(0.3, 0.035, 6, 16)), body = mat(pick(COL)), dk = mat(C.dark);
    for (const s of [-1, 1]) { const px = Math.cos(ry) * 0.45 * s, pz = -Math.sin(ry) * 0.45 * s; B.add(wg, dk, x + px, 0.32, z + pz, ry); }
    B.add(box(0.9, 0.05, 0.05), body, x, 0.55, z, ry, 1, 1, 1, null, 0, 0.0);
    B.add(box(0.05, 0.3, 0.05), body, x, 0.7, z, ry);
    B.add(rbox(0.22, 0.05, 0.1, 0.02), dk, x, 0.86, z, ry);
    B.add(box(0.05, 0.3, 0.3), dk, x + Math.cos(ry) * 0.45, 0.72, z - Math.sin(ry) * 0.45, ry);
  };
  const mailbox = (x, z) => { B.add(cyl(0.05, 0.05, 1.0, 6), mat(C.metal), x, 0.5, z); B.add(rbox(0.4, 0.3, 0.3, 0.12), mat(C.coral), x, 1.12, z); B.add(box(0.12, 0.02, 0.02), mat(0xffffff), x, 1.12, z + 0.16); };
  const bin = (x, z) => { B.add(cyl(0.26, 0.22, 0.7, 10), mat(C.sage), x, 0.35, z); B.add(cyl(0.29, 0.29, 0.07, 10), mat(0x8fbf94), x, 0.72, z); };
  const crates = (x, z, ry) => { for (let i = 0; i < 3; i++) B.add(rbox(0.6, 0.4, 0.6, 0.06), mat([0xd9b38c, 0xe6c9a3, 0xcfa57a][i]), x + (i === 2 ? 0.1 : i * 0.65 - 0.3), i === 2 ? 0.6 : 0.2, z, ry + (i === 2 ? 0.4 : 0)); };
  const bollards = (x, z, alongX) => { for (let i = -1; i <= 1; i++) { const bx = x + (alongX ? i * 0.9 : 0), bz = z + (alongX ? 0 : i * 0.9); B.add(cyl(0.1, 0.12, 0.6, 8), mat(C.stone), bx, 0.3, bz); B.add(cyl(0.1, 0.1, 0.08, 8), mat(C.pink), bx, 0.63, bz); } };
  const kinds = [planter, planter, planter, crates, bollards];   // ポスト・ごみ箱は置かない   // 自転車・立て看板は置かない

  const spots = [];
  for (const [dir, f, a, b] of STREETS) {
    for (let t = a + 5; t < b - 3; t += 4.5 + R() * 3.5) {
      const side = R() < 0.5 ? -1 : 1, off = side * (4.7 + R() * 0.8);
      const x = dir === 'ns' ? f + off : t, z = dir === 'ns' ? t : f + off;
      if (dir === 'ns' && (Math.abs(z - 36) < 7 || Math.abs(z + 36) < 7) && Math.abs(x) < 31) continue;
      if (dir === 'ew' && f !== 0 && Math.abs(x) < 7) continue;
      if (dir === 'ew' && f === 0 && Math.abs(x) < 16) continue;
      if (blocked(x, z)) continue;
      spots.push({ x, z, dir, side });
    }
  }
  const nearMargin = (s) => !spots.some(o => o !== s && o.placed && Math.hypot(o.x - s.x, o.z - s.z) < 2.4);
  for (const s of spots) {
    if (!nearMargin(s)) continue; s.placed = true;
    const k = pick(kinds), ry = s.dir === 'ns' ? Math.PI / 2 : 0;
    if (k === aframe) k(s.x, s.z, s.dir === 'ns' ? s.side > 0 ? -Math.PI / 2 : Math.PI / 2 : s.side > 0 ? Math.PI : 0);
    else if (k === bollards) k(s.x, s.z, s.dir === 'ew');
    else k(s.x, s.z, ry);
  }

  // ---- 路面の飾り:マンホール・落ち葉・花びら ----
  for (const [dir, f, a, b] of STREETS) {
    for (let t = a + 10; t < b - 6; t += 16 + R() * 10) {
      const x = dir === 'ns' ? f + (R() - .5) * 3 : t, z = dir === 'ns' ? t : f + (R() - .5) * 3;
      if (blocked(x, z, 0.5) || Math.hypot(x, z) < 17) continue;
      B.add(cyl(0.42, 0.42, 0.015, 14), mat(0xcbc3d6), x, 0.017, z); B.add(cyl(0.3, 0.3, 0.02, 14), mat(0xbfb6cc), x, 0.02, z);
    }
  }
  const petalCols = [C.leafPink, 0xffe0a8, 0xf5b8a8, 0xd9ecb0];
  const nPet = low ? 60 : 160, Bp = new Batcher();
  for (let i = 0; i < nPet; i++) {
    const st = pick(STREETS), [dir, f, a, b] = st, t = a + R() * (b - a), off = (R() - .5) * 11;
    const x = dir === 'ns' ? f + off : t, z = dir === 'ns' ? t : f + off;
    if (Math.hypot(x, z) < 16 || blocked(x, z, 0.3)) continue;
    Bp.add(sph(0.12 + R() * 0.07, 6), mat(pick(petalCols)), x, 0.02, z, R() * 6, 1, 0.08, 0.7);
  }
  const pk = AREAS.park;
  // ガーランド(旗)をわたす
  const flagC = [C.pink, C.butter, C.mint, C.sky, C.lavender, C.apricot];
  const flagG = geo('flag', () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.2, 0, 0, 0.2, 0, 0, 0, -0.38, 0, -0.2, 0, 0, 0, -0.38, 0, 0.2, 0, 0], 3)); g.computeVertexNormals(); return g; });
  const flagMats = flagC.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, side: THREE.DoubleSide }));
  const swayers = [];
  const bunting = (x0, z0, x1, z1) => {
    const n = 14, grp = new THREE.Group();
    for (let i = 1; i < n; i++) { const t = i / n, sag = Math.sin(t * Math.PI) * 0.7; const m = new THREE.Mesh(flagG, pick(flagMats)); m.position.set(x0 + (x1 - x0) * t, 5.1 - sag, z0 + (z1 - z0) * t); m.rotation.y = Math.atan2(x1 - x0, z1 - z0) - Math.PI / 2; m.userData.p = R() * 6; grp.add(m); swayers.push(m); }
    const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, 5.12 - Math.sin(t * Math.PI) * 0.7, z0 + (z1 - z0) * t)); }
    grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xb8a9c9 })));
    scene.add(grp);
    for (const [px, pz] of [[x0, z0], [x1, z1]]) B.add(cyl(0.07, 0.09, 5.2, 6), mat(C.metal), px, 2.6, pz);
  };
  for (const z of [-29, -45, 29, 56]) if (![[-5.6, z], [5.6, z]].some(([x, zz]) => blocked(x, zz, 0.8))) bunting(-5.6, z, 5.6, z);
  for (const x of [-26, 26]) if (![[x, 29.6], [x, 42.4]].some(([xx, zz]) => blocked(xx, zz, 0.8))) { /* 交差点の旗は省略 */ }
  B.build(scene, { shadow: !low });
  const petalMeshes = Bp.build(scene, { shadow: false }); petalMeshes.forEach(m => { m.visible = blossom; });

  // ---- 舞う花びら(プレイヤーのまわり) ----
  const petalTex = dotTex(g => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(16, 16, 9, 5, 0.6, 0, 7); g.fill(); });
  const NP = low ? 40 : 110, pp = new Float32Array(NP * 3), pv = [];
  for (let i = 0; i < NP; i++) { pp[i * 3] = (R() - .5) * 60; pp[i * 3 + 1] = R() * 12; pp[i * 3 + 2] = (R() - .5) * 60; pv.push({ s: 0.35 + R() * 0.5, p: R() * 6, w: 0.5 + R() }); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pm = new THREE.PointsMaterial({ color: 0xffc6d9, size: 0.3, map: petalTex, transparent: true, opacity: 0.85, depthWrite: false, alphaTest: 0.05 });
  const petals = new THREE.Points(pg, pm); petals.frustumCulled = false; petals.visible = blossom; scene.add(petals);

  // ---- ほたる(夜の公園)と ちょうちょ(昼の公園) ----
  const glowTex = dotTex(g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,200,1)'); gr.addColorStop(1, 'rgba(255,255,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  const NF = low ? 16 : 40, fp = new Float32Array(NF * 3), fd = [];
  for (let i = 0; i < NF; i++) fd.push({ x: pk.x0 + R() * (pk.x1 - pk.x0), z: pk.z0 + R() * (pk.z1 - pk.z0), y: 0.6 + R() * 1.8, p: R() * 6, r: 0.5 + R() * 1.2 });
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const fm = new THREE.PointsMaterial({ color: 0xfff6a8, size: 0.7, map: glowTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const flies = new THREE.Points(fg, fm); flies.frustumCulled = false; scene.add(flies);

  const wingG = geo('wing', () => new THREE.PlaneGeometry(0.16, 0.22));
  const butter = [];
  for (let i = 0; i < (low ? 3 : 7); i++) {
    const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: pick([0xffd6e8, 0xfff0a8, 0xcfe6ff, 0xe3d1ff]), side: THREE.DoubleSide, roughness: 1 });
    const wl = new THREE.Mesh(wingG, m), wr = new THREE.Mesh(wingG, m); wl.position.x = -0.09; wr.position.x = 0.09; wl.rotation.x = wr.rotation.x = -Math.PI / 2;
    const pl = new THREE.Group(), pr = new THREE.Group(); pl.add(wl); pr.add(wr); g.add(pl, pr);
    butter.push({ g, pl, pr, c: { x: pk.x0 + 4 + R() * (pk.x1 - pk.x0 - 8), z: pk.z0 + 3 + R() * (pk.z1 - pk.z0 - 6) }, p: R() * 6, r: 1.5 + R() * 3 });
    scene.add(g);
  }

  // ---- 鳥(空)・はと(広場) ----
  const bird = () => { const g = new THREE.Group(), body = new THREE.Mesh(sph(0.13, 8), mat(0xffffff)); body.scale.set(1.4, 0.8, 0.8); g.add(body); const wl = new THREE.Group(), wr = new THREE.Group(); const w = new THREE.Mesh(box(0.3, 0.015, 0.14), mat(0xf4eefa)); w.position.x = 0.15; wl.add(w); const w2 = w.clone(); w2.position.x = -0.15; wr.add(w2); g.add(wl, wr); return { g, wl, wr }; };
  const skyBirds = []; for (let i = 0; i < (low ? 3 : 6); i++) { const b = bird(); b.r = 22 + R() * 20; b.h = 22 + R() * 12; b.a = R() * 6.28; b.sp = 0.12 + R() * 0.08; b.p = R() * 6; b.g.scale.setScalar(2.2); scene.add(b.g); skyBirds.push(b); }
  const pigeons = [];
  const pgBody = mat(0xcfc8dc), pgHead = mat(0x9d93b5), pgWing = mat(0xb9b0cc), pgLeg = mat(0xffb48a);
  for (let i = 0; i < (low ? 3 : 7); i++) {
    const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
    const b = new THREE.Mesh(sph(0.14, 8), pgBody); b.scale.set(1.3, 0.9, 0.9); b.position.y = 0.2;
    const h = new THREE.Mesh(sph(0.075, 8), pgHead); h.position.set(0.15, 0.31, 0);
    const bk = new THREE.Mesh(box(0.05, 0.02, 0.02), pgLeg); bk.position.set(0.23, 0.3, 0); h.userData.bk = bk;
    const t = new THREE.Mesh(box(0.14, 0.02, 0.07), pgWing); t.position.set(-0.22, 0.22, 0); t.rotation.z = 0.25;
    const head = new THREE.Group(); head.position.set(0, 0, 0); head.add(h, bk);
    const wings = [1, -1].map(sd => { const w = new THREE.Group(), m = new THREE.Mesh(box(0.2, 0.012, 0.2), pgWing); m.position.set(-0.02, 0, sd * 0.1); w.add(m); w.position.set(0, 0.27, sd * 0.1); w.userData.sd = sd; return w; });
    const legs = [-1, 1].map(sd => { const l = new THREE.Mesh(box(0.015, 0.1, 0.015), pgLeg); l.position.set(0, 0.05, sd * 0.05); return l; });
    inner.add(b, head, t, ...wings, ...legs);
    const a = R() * 6.28, r = 8 + R() * 5; g.position.set(Math.sin(a) * r, 0, -Math.cos(a) * r); g.rotation.y = R() * 6;
    scene.add(g);
    pigeons.push({ g, inner, head, wings, legs, home: { x: g.position.x, z: g.position.z }, tx: g.position.x, tz: g.position.z, st: 'idle', t: R() * 3, fly: 0, flyT: 0, fx: 0, fz: 0, h0: 0, hMax: 0, p: R() * 6, calm: 0 });
  }
  const food = { t: 0, spots: [] };   // えさ

  // ---- ねこ ----
  const cat = new THREE.Group(); const fur = mat(0xf2b27a), cream = mat(0xfff0dc);
  const cb = new THREE.Mesh(rbox(0.5, 0.26, 0.24, 0.1), fur); cb.position.y = 0.26; const ch = new THREE.Mesh(sph(0.15, 10), fur); ch.position.set(0.3, 0.38, 0);
  const tail = new THREE.Mesh(cyl(0.03, 0.04, 0.4, 6), fur); tail.position.set(-0.3, 0.38, 0); tail.rotation.z = 0.7;
  cat.add(cb, ch, tail, ...[-1, 1].map(s => { const e = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), fur); e.position.set(0.3, 0.53, s * 0.09); return e; }));
  const legs = [[0.17, 0.08], [0.17, -0.08], [-0.17, 0.08], [-0.17, -0.08]].map(([x, z]) => { const l = new THREE.Mesh(box(0.06, 0.16, 0.06), cream); l.position.set(x, 0.08, z); cat.add(l); return l; });
  for (const s of [-1, 1]) { const eye = new THREE.Mesh(sph(0.018, 6), mat(C.dark)); eye.position.set(0.44, 0.4, s * 0.06); cat.add(eye); }
  const nodes = Object.values(city.graph.nodes).filter(n => !blocked(n.x, n.z, 0.4));
  const home = nodes.find(n => n.id === 'ew48') || nodes[0];
  cat.position.set(home.x, 0, home.z + 3); scene.add(cat);
  const cs = { tx: cat.position.x, tz: cat.position.z, wait: 3, moving: false };

  const tmp = new THREE.Vector3();
  return {
    setBlossom(on) { petals.visible = on; petalMeshes.forEach(m => { m.visible = on; }); },
    feed(pos, ry) {
      if (food.t > 0) return false;
      food.spots.length = 0;
      for (let i = 0; i < 4; i++) { const r = 1.6 + Math.random() * 1.2, a2 = (Math.random() - 0.5) * 1.2, x = pos.x + Math.sin(ry + a2) * r, z = pos.z + Math.cos(ry + a2) * r; if (!blocked(x, z, 0.3)) food.spots.push({ x, z }); }
      if (!food.spots.length) food.spots.push({ x: pos.x + Math.sin(ry) * 1.8, z: pos.z + Math.cos(ry) * 1.8 });
      food.t = 14; return true;
    },
    pigeonsNear(pos, r) { return food.t <= 0 && pigeons.some(p => p.g.visible && Math.hypot(p.g.position.x - pos.x, p.g.position.z - pos.z) < r); },
    update(dt, t, focus, night) {
      const day = 1 - night;
      // 花びら
      if (petals.visible) {
      const a = pg.attributes.position;
      for (let i = 0; i < NP; i++) {
        const v = pv[i]; let x = a.array[i * 3], y = a.array[i * 3 + 1], z = a.array[i * 3 + 2];
        y -= v.s * dt; x += Math.sin(t * v.w + v.p) * 0.5 * dt + 0.25 * dt; z += Math.cos(t * v.w * 0.8 + v.p) * 0.4 * dt;
        const rx = x - focus.x, rz = z - focus.z;
        if (y < 0.05) { y = 9 + Math.random() * 4; x = focus.x + (Math.random() - .5) * 60; z = focus.z + (Math.random() - .5) * 60; }
        if (rx > 30) x -= 60; else if (rx < -30) x += 60; if (rz > 30) z -= 60; else if (rz < -30) z += 60;
        a.array[i * 3] = x; a.array[i * 3 + 1] = y; a.array[i * 3 + 2] = z;
      }
      a.needsUpdate = true; pm.opacity = 0.15 + day * 0.7;
      }
      // ほたる・ちょうちょ
      fm.opacity = Math.max(0, night - 0.25) * 1.2;
      if (fm.opacity > 0.01) { const fa = fg.attributes.position; fd.forEach((f, i) => { fa.array[i * 3] = f.x + Math.sin(t * 0.4 + f.p) * f.r; fa.array[i * 3 + 1] = f.y + Math.sin(t * 0.9 + f.p * 2) * 0.35; fa.array[i * 3 + 2] = f.z + Math.cos(t * 0.35 + f.p) * f.r; }); fa.needsUpdate = true; }
      for (const b of butter) {
        b.g.visible = day > 0.55; if (!b.g.visible) continue;
        const k = t * 0.5 + b.p; b.g.position.set(b.c.x + Math.sin(k) * b.r, 1.1 + Math.sin(k * 2.3) * 0.4, b.c.z + Math.cos(k * 0.8) * b.r);
        b.g.rotation.y = -k + Math.PI; const f = Math.sin(t * 22 + b.p) * 0.9; b.pl.rotation.z = f; b.pr.rotation.z = -f;
      }
      // 空の鳥
      for (const b of skyBirds) {
        b.g.visible = day > 0.4; if (!b.g.visible) continue;
        b.a += b.sp * dt; b.g.position.set(focus.x + Math.cos(b.a) * b.r, b.h + Math.sin(t + b.p) * 1.5, focus.z + Math.sin(b.a) * b.r);
        b.g.rotation.y = -b.a - Math.PI / 2 + Math.PI; const f = Math.sin(t * 7 + b.p) * 0.6; b.wl.rotation.z = f; b.wr.rotation.z = -f;
      }
      // はと(歩く・つつく・見まわす・ちいさく飛ぶ・おどろいて飛びたつ・えさに寄る・もとの場所へ飛んでもどる)
      if (food.t > 0) { food.t -= dt; if (food.t <= 0) food.spots.length = 0; }
      for (const p of pigeons) {
        p.g.visible = day > 0.3 && p.st !== 'gone'; if (p.st !== 'gone' && !p.g.visible) continue;
        const pos = p.g.position;
        const dx = focus.x - pos.x, dz = focus.z - pos.z, d = Math.hypot(dx, dz);
        const eating = food.t > 0;
        const wingSet = (open, flap) => { for (const w of p.wings) { w.visible = true; w.scale.z = open; w.rotation.x = -w.userData.sd * (flap ? 0.2 + Math.sin(t * 34 + p.p) * 0.95 : 0.05); } };
        const takeoff = (x, z, hMax, spd, then) => {   // しゃがんで、ふわっと
          p.fx = pos.x; p.fz = pos.z; p.tx = x; p.tz = z; p.hMax = hMax;
          const dist = Math.hypot(x - pos.x, z - pos.z); p.flyT = 0; p.fly = Math.max(0.5, dist / spd); p.st = 'crouch'; p.t = 0.16; p.then = then || 'idle';
          p.g.rotation.y = Math.atan2(-(z - pos.z), x - pos.x);
        };
        const startOrbit = (w) => {   // しゃがんで飛びたち、広場の上をぐるっと旋回してから、おりてくる
          const r = 4 + Math.random() * 5, dir = Math.random() < 0.5 ? -1 : 1, a0 = w - dir * Math.PI / 2;   // 最初は、人から遠ざかる向きに飛び出す
          p.oc = { x: pos.x - Math.cos(a0) * r, z: pos.z - Math.sin(a0) * r }; p.or = r; p.od = dir; p.oa = a0; p.ot = 0; p.odur = 6 + Math.random() * 5; p.oh = 3.5 + Math.random() * 3.5; p.ow = (3.2 + Math.random() * 1.2) / r;
          p.st = 'crouch'; p.t = 0.16; p.then = 'orbit'; p.fly = 0.01; p.tx = pos.x; p.tz = pos.z; p.fx = pos.x; p.fz = pos.z; p.hMax = 0; p.calm = 12;
          p.g.rotation.y = Math.atan2(-Math.sin(w), Math.cos(w));
        };
        const startLeave = (ang) => {   // 空たかく飛んで、遠くへ行く(しばらくしてから、べつの方向から戻ってくる)
          p.la = ang + (Math.random() - 0.5) * 1.0; p.lt = 0; p.ldur = 3.2 + Math.random() * 1.5; p.fx = pos.x; p.fz = pos.z;
          p.st = 'crouch'; p.t = 0.16; p.then = 'leave'; p.fly = 0.01; p.tx = pos.x; p.tz = pos.z; p.hMax = 0; p.calm = 20;
          p.g.rotation.y = Math.atan2(-Math.sin(p.la), Math.cos(p.la));
        };
        const pickSpot = (cx, cz, minR, maxR, tries = 10) => {
          for (let k = 0; k < tries; k++) {
            const a2 = Math.random() * 6.28, r = minR + Math.random() * (maxR - minR), x = cx + Math.cos(a2) * r, z = cz + Math.sin(a2) * r;
            if (Math.hypot(x, z) < 16 && !blocked(x, z, 0.8)) return [x, z];
          }
          return null;
        };
        // おどろく(人が近づくと、そのたびに逃げる。えさがあるときは、もう少し近くまで平気)
        const scareR = eating && p.st !== 'fly' ? 1.3 : 3.0;
        if (d < scareR && (p.st === 'idle' || p.st === 'walk' || p.st === 'peck' || p.st === 'look' || p.st === 'eat')) {
          const away = Math.atan2(-dz, -dx) + (Math.random() - 0.5) * 1.2, r = 6 + Math.random() * 6;
          let spot = null; for (let k = 0; k < 8 && !spot; k++) { const a3 = away + (Math.random() - 0.5) * 2.4 * (k / 8 + 0.3), x = pos.x + Math.cos(a3) * r, z = pos.z + Math.sin(a3) * r; if (Math.hypot(x, z) < 17 && !blocked(x, z, 0.8)) spot = [x, z]; }
          spot = spot || [pos.x + Math.cos(away) * 5, pos.z + Math.sin(away) * 5];   // 逃げ道がなくても、人と反対の向きへ
          const kind = Math.random();
          if (kind < 0.07) startOrbit(away); else if (kind < 0.11) startLeave(away);
          else if (spot) { takeoff(spot[0], spot[1], 1.5 + Math.random() * 2, 5.5 + Math.random() * 2, 'idle'); p.calm = 6 + Math.random() * 5; p.away = true; }
        }
        // えさに気づく
        if (eating && (p.st === 'idle' || p.st === 'walk' || p.st === 'look' || p.st === 'peck') && !p.eatId && d > 1.6) {
          const sp = food.spots[(Math.random() * food.spots.length) | 0], dd = Math.hypot(sp.x - pos.x, sp.z - pos.z);
          if (dd < 16) { p.tx = sp.x + (Math.random() - 0.5) * 0.4; p.tz = sp.z + (Math.random() - 0.5) * 0.4; p.eatId = 1; p.st = dd > 5 ? 'fastwalk' : 'walk'; }
        }
        if (!eating) p.eatId = 0;
        p.calm = Math.max(0, p.calm - dt);
        // ---- 状態ごとの動き ----
        p.inner.position.y = 0; p.inner.rotation.z = 0; p.inner.rotation.x = 0; p.inner.scale.y = 1; p.head.position.x = 0; p.head.position.y = 0; p.head.rotation.y = 0;
        wingSet(0.4, false);
        if (p.st === 'crouch') {            // しゃがむ → 羽をひらく
          p.t -= dt; p.inner.scale.y = 0.82; p.inner.position.y = -0.02; wingSet(1, true);
          if (p.t <= 0) { p.flyT = 0; p.st = p.then === 'orbit' ? 'orbit' : p.then === 'leave' ? 'leave' : 'fly'; p.then = 'idle'; }
        } else if (p.st === 'fly') {        // 羽ばたいて、ゆるい弧で飛ぶ(行きは上がり、おりるときは羽を広げて減速)
          p.flyT += dt; const k = Math.min(1, p.flyT / p.fly), e = k * k * (3 - 2 * k);
          const x = p.fx + (p.tx - p.fx) * e, z = p.fz + (p.tz - p.fz) * e;
          p.g.rotation.y = Math.atan2(-(p.tz - p.fz), p.tx - p.fx);
          pos.x = x; pos.z = z; pos.y = Math.sin(Math.PI * Math.pow(k, 0.8)) * p.hMax + (p.h0 || 0) * (1 - e);
          p.inner.rotation.z = -Math.cos(Math.PI * k) * 0.35;      // 上がるときは首を上げ、おりるときは下げる
          wingSet(1, k < 0.85 || Math.sin(t * 8) > 0);
          if (k >= 1) { pos.y = 0; p.h0 = 0; p.st = 'land'; p.t = 0.28; }
        } else if (p.st === 'orbit') {      // 旋回:傾きながら円をえがき、すこし高度をかえる
          p.ot += dt; p.oa += p.od * p.ow * dt;
          const rise = Math.min(1, p.ot / 1.6), r = p.or * (1 + 0.12 * Math.sin(p.ot * 0.9));
          pos.x = p.oc.x + Math.cos(p.oa) * r; pos.z = p.oc.z + Math.sin(p.oa) * r;
          pos.y = p.oh * rise * rise * (3 - 2 * rise) + Math.sin(p.ot * 1.7 + p.p) * 0.4 * rise;
          const vx = -Math.sin(p.oa) * p.od, vz = Math.cos(p.oa) * p.od; p.g.rotation.y = Math.atan2(-vz, vx);
          p.inner.rotation.x = -p.od * 0.55; wingSet(1, Math.sin(p.ot * 2.6 + p.p) > -0.2);   // ときどき羽をひろげて滑空
          if (p.ot > p.odur) { const spot = pickSpot(p.home.x, p.home.z, 0, 3) || [p.home.x, p.home.z]; p.fx = pos.x; p.fz = pos.z; p.tx = spot[0]; p.tz = spot[1]; p.hMax = pos.y * 0.5; p.flyT = 0; p.fly = Math.max(1.6, Math.hypot(p.tx - pos.x, p.tz - pos.z) / 4.5); p.st = 'fly'; p.h0 = pos.y; }
        } else if (p.st === 'leave') {      // 飛び去る:高度をあげながら、まっすぐ遠くへ
          p.lt += dt; const k = Math.min(1, p.lt / p.ldur), sp = 4 + 11 * k;
          pos.x += Math.cos(p.la) * sp * dt; pos.z += Math.sin(p.la) * sp * dt; pos.y = 2 + 16 * k * k + 1.5 * k;
          p.g.rotation.y = Math.atan2(-Math.sin(p.la), Math.cos(p.la)); p.inner.rotation.z = -0.35; wingSet(1, true);
          if (p.lt >= p.ldur) { p.st = 'gone'; p.t = 8 + Math.random() * 12; p.g.visible = false; }
        } else if (p.st === 'gone') {       // 見えないあいだ。もどってくる向きは、そのつど変える
          p.g.visible = false; p.t -= dt;
          if (p.t <= 0) {
            const a = Math.random() * 6.28, spot = pickSpot(p.home.x, p.home.z, 0, 3) || [p.home.x, p.home.z];
            p.fx = Math.cos(a) * 55 + p.home.x; p.fz = Math.sin(a) * 55 + p.home.z; p.h0 = 16; pos.set(p.fx, 16, p.fz);
            p.tx = spot[0]; p.tz = spot[1]; p.flyT = 0; p.fly = 6.5; p.st = 'back'; p.g.visible = day > 0.3;
          }
        } else if (p.st === 'back') {       // もどってくる:ゆるくおりながら、ばさっと着地
          p.flyT += dt; const k = Math.min(1, p.flyT / p.fly), e = 1 - (1 - k) * (1 - k);
          pos.x = p.fx + (p.tx - p.fx) * e; pos.z = p.fz + (p.tz - p.fz) * e; pos.y = p.h0 * (1 - e) * (1 - e * 0.2) * (k < 1 ? 1 : 0) + 0.0;
          p.g.rotation.y = Math.atan2(-(p.tz - p.fz), p.tx - p.fx); p.inner.rotation.z = 0.2 * (1 - k); wingSet(1, k < 0.8 || Math.sin(t * 9) > 0);
          if (k >= 1) { pos.y = 0; p.st = 'land'; p.t = 0.3; }
        } else if (p.st === 'land') {       // ばさっと、着地
          p.t -= dt; pos.y = 0; wingSet(1, p.t > 0.12); p.inner.scale.y = 0.9;
          if (p.t <= 0) { p.st = 'idle'; p.t = 0.8 + Math.random() * 1.5; }
        } else if (p.st === 'walk' || p.st === 'fastwalk') {
          const ex = p.tx - pos.x, ez = p.tz - pos.z, ed = Math.hypot(ex, ez), sp = p.st === 'fastwalk' ? 2.6 : 0.95;
          if (ed > 0.15) {
            pos.x += ex / ed * sp * dt; pos.z += ez / ed * sp * dt;
            let ry = Math.atan2(-ez, ex), df = ry - p.g.rotation.y; df = Math.atan2(Math.sin(df), Math.cos(df)); p.g.rotation.y += df * Math.min(1, dt * 10);
            const ph = t * (p.st === 'fastwalk' ? 14 : 9) + p.p; p.head.position.x = Math.sin(ph) * 0.03; p.inner.position.y = Math.abs(Math.sin(ph)) * 0.015;
          } else if (p.eatId) { p.st = 'eat'; p.t = 2 + Math.random() * 3; }
          else { p.st = 'idle'; p.t = 1 + Math.random() * 3; }
        } else if (p.st === 'eat') {        // えさをつつく
          p.t -= dt; const ph = Math.max(0, Math.sin(t * 12 + p.p)); p.head.position.y = -0.1 * ph; p.head.position.x = 0.05 * ph; p.inner.rotation.z = 0.25 * ph;
          if (p.t <= 0) { if (eating) { const sp = food.spots[(Math.random() * food.spots.length) | 0]; p.tx = sp.x + (Math.random() - 0.5) * 0.6; p.tz = sp.z + (Math.random() - 0.5) * 0.6; p.st = 'walk'; } else { p.st = 'idle'; p.t = 1; } }
        } else if (p.st === 'peck') {       // 地面をつつく
          p.t -= dt; const ph = Math.max(0, Math.sin(t * 10 + p.p)); p.head.position.y = -0.1 * ph; p.head.position.x = 0.04 * ph; p.inner.rotation.z = 0.2 * ph;
          if (p.t <= 0) { p.st = 'idle'; p.t = 0.5 + Math.random() * 1.5; }
        } else if (p.st === 'look') {       // きょろきょろ
          p.t -= dt; p.head.rotation.y = Math.sin(t * 3 + p.p) * 0.9; p.g.rotation.y += Math.sin(t * 1.3 + p.p) * 0.01;
          if (p.t <= 0) { p.st = 'idle'; p.t = 0.5 + Math.random() * 1.5; }
        } else if (p.st === 'preen') {      // 羽づくろい
          p.t -= dt; p.head.position.y = -0.04; p.head.rotation.y = Math.sin(t * 7 + p.p) * 0.6; p.inner.rotation.z = 0.15;
          if (p.t <= 0) { p.st = 'idle'; p.t = 1; }
        } else {                            // idle: つぎの動きをえらぶ
          p.t -= dt;
          if (p.t <= 0) {
            const hd = Math.hypot(p.home.x - pos.x, p.home.z - pos.z), roll = Math.random();
            if (p.calm <= 0 && hd > 5) { const spot = pickSpot(p.home.x, p.home.z, 0, 2.5); if (spot) takeoff(spot[0], spot[1], 0.8 + Math.random() * 1.4, 4, 'idle'); else p.t = 2; }   // もといた場所へ、飛んでもどる
            else if (roll < 0.28) { p.st = 'peck'; p.t = 1.5 + Math.random() * 2.5; }
            else if (roll < 0.48) { p.st = 'look'; p.t = 1.2 + Math.random() * 1.6; }
            else if (roll < 0.58) { p.st = 'preen'; p.t = 1.2 + Math.random() * 1.5; }
            else if (roll < 0.78) { const spot = pickSpot(pos.x, pos.z, 1, 2.5); if (spot) { p.tx = spot[0]; p.tz = spot[1]; p.st = 'walk'; } else p.t = 1; }
            else if (roll < 0.84) { const spot = pickSpot(pos.x, pos.z, 3, 6); if (spot) takeoff(spot[0], spot[1], 0.7 + Math.random() * 1.3, 4, 'idle'); else p.t = 1; }   // ふらっと、ちいさく飛ぶ
            else p.t = 2 + Math.random() * 3;
          }
        }
      }
      // 旗
      for (const m of swayers) m.rotation.x = Math.sin(t * 2 + m.userData.p) * 0.18;
      // ねこ
      const cdx = focus.x - cat.position.x, cdz = focus.z - cat.position.z, cd = Math.hypot(cdx, cdz);
      if (cs.moving) {
        const ex = cs.tx - cat.position.x, ez = cs.tz - cat.position.z, ed = Math.hypot(ex, ez), sp = cd < 3 ? 0 : 1.6;
        if (cd < 3) cs.moving = false;
        else if (ed < 0.15) { cs.moving = false; cs.wait = 4 + Math.random() * 8; }
        else { cat.position.x += ex / ed * sp * dt; cat.position.z += ez / ed * sp * dt; cat.rotation.y = Math.atan2(-ez, ex); }
      } else {
        cs.wait -= dt;
        if (cd < 6) cat.rotation.y = Math.atan2(-cdz, cdx);
        if (cs.wait <= 0 && cd > 3.5) { const n = nodes[Math.floor(Math.random() * nodes.length)]; if (Math.hypot(n.x - cat.position.x, n.z - cat.position.z) < 18) { cs.tx = n.x + (Math.random() - .5) * 2; cs.tz = n.z + 2.2; cs.moving = true; } else cs.wait = 1; }
      }
      const walk = cs.moving ? Math.sin(t * 12) * 0.5 : 0; legs.forEach((l, i) => { l.rotation.z = (i % 2 ? -1 : 1) * walk; });
      tail.rotation.x = Math.sin(t * 2.2) * 0.35; cb.scale.y = cs.moving ? 1 : 1 + Math.sin(t * 1.6) * 0.03;
      cat.visible = night < 0.85;
    },
  };
}
