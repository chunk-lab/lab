// きせつ:春(桜)・夏・秋(紅葉)・冬(雪・雪だるま)。木の色・地面の色・ふってくるもの・雪だるま。
import * as THREE from 'three';

export const SEASONS = { auto: 'いまの季節', spring: '🌸 春', summer: '🌻 夏', autumn: '🍁 秋', winter: '⛄ 冬' };
export const seasonOf = (d = new Date()) => { const m = d.getMonth() + 1; return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter'; };

const AUTUMN = [0xe8803a, 0xd9503a, 0xf0b53c, 0xc96a2e];
const MAX_MEN = 8;
const rnd = (a, b) => a + Math.random() * (b - a);

function dotTex() {
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c);
}

// opts: foliage(fn)=葉の材質を順にわたす / groundMats=地面の材質 / colliders=町の当たり判定 / storage
export function createSeasons(scene, { eachFoliage, eachTex = () => {}, trees = [], groundMats = [], colliders = [], storage }) {
  const base = new Map();   // 材質→もとの色
  const baseOf = m => { if (!base.has(m)) base.set(m, m.color.clone()); return base.get(m); };
  let season = 'summer';

  // ---- ふってくるもの ----
  const N = 1100, BOX = 56, H = 26;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), seed = Array.from({ length: N }, () => ({ x: rnd(-BOX / 2, BOX / 2), y: rnd(0, H), z: rnd(-BOX / 2, BOX / 2), p: rnd(0, 6.28), v: rnd(0.6, 1.4) }));
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.3, map: dotTex(), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true, alphaTest: 0.02 });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.visible = false; pts.renderOrder = 4; scene.add(pts);
  let kind = null, count = 0, t = 0;
  function setFall(k) {
    kind = k; pts.visible = !!k; if (!k) return;
    count = k === 'snow' ? 1000 : k === 'sakura' ? 420 : 300;
    mat.size = k === 'snow' ? 0.26 : k === 'sakura' ? 0.42 : 0.55;
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      if (k === 'snow') c.setRGB(1, 1, 1);
      else if (k === 'sakura') c.set([0xffc6d9, 0xffd9e6, 0xffb3cc][i % 3]);
      else c.set(AUTUMN[i % 4]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.attributes.color.needsUpdate = true; geo.setDrawRange(0, count);
  }

  // ---- 秋:木から落ちる葉(イチョウ・モミジ)。ペラペラの板がひらひら落ちて、地面にしばらく残る ----
  const leaves = (() => {
    const N = 150;
    // 形そのものを板にする(テクスチャを使わない):イチョウ=扇形、モミジ=5つにさけた形
    const ginkgoS = new THREE.Shape(); ginkgoS.moveTo(0, -0.17); ginkgoS.lineTo(-0.012, -0.05);
    for (let k = 0; k <= 12; k++) { const a = Math.PI * (0.86 - k * 0.72 / 12) , r = k === 6 ? 0.13 : 0.17; ginkgoS.lineTo(Math.cos(a) * r, -0.05 + Math.sin(a) * r); }
    ginkgoS.lineTo(0.012, -0.05); ginkgoS.lineTo(0, -0.17);
    const mapleS = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.07 : 0.17; const x = Math.cos(a) * r, y = Math.sin(a) * r; k ? mapleS.lineTo(x, y) : mapleS.moveTo(x, y); } mapleS.closePath();
    const sets = [[new THREE.ShapeGeometry(ginkgoS), [0xf2c94c, 0xf5d65e, 0xe9b23a, 0xffe08a]], [new THREE.ShapeGeometry(mapleS), [0xe8603a, 0xd9433a, 0xf0803c, 0xc9382e]]].map(([geo, cols]) => {
      const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), N / 2);   // 色をはっきり(夜は暗くする)
      m.frustumCulled = false; m.visible = false; const c = new THREE.Color();
      for (let i = 0; i < N / 2; i++) { c.setHex(cols[i % cols.length]); m.setColorAt(i, c); }
      scene.add(m); return m;
    });
    const st = Array.from({ length: N }, () => ({ t: 0, wait: Math.random() * 6, x: 0, y: -9, z: 0, p: Math.random() * 6, ry: Math.random() * 6, ground: 0 }));
    const dummy = new THREE.Object3D(); let on = false, near = [], nearT = 0;
    function spawn(l, cam) {
      if (!near.length) { l.y = -9; l.wait = 1; return; }
      const tr = near[Math.floor(Math.random() * near.length)], a = Math.random() * 6.28, r = (1.0 + Math.random() * 0.6) * tr.s;   // 葉のかたまりのふちから
      Object.assign(l, { x: tr.x + Math.cos(a) * r, z: tr.z + Math.sin(a) * r, y: (2.0 + Math.random() * 1.4) * tr.s, t: 0, ground: 0, p: Math.random() * 6, ry: Math.random() * 6, v: 0.45 + Math.random() * 0.35 });
    }
    return {
      on(v) { on = v; sets.forEach(m => { m.visible = v; }); },
      update(dt, cam, night = 0) {
        if (!on) return;
        const k0 = 1 - 0.6 * night; sets.forEach(m => m.material.color.setScalar(k0));
        if ((nearT -= dt) <= 0) { nearT = 1; near = trees.filter(t => Math.hypot(t.x - cam.x, t.z - cam.z) < 38); }
        for (let i = 0; i < N; i++) {
          const l = st[i];
          if (l.wait > 0) { l.wait -= dt; if (l.wait <= 0) spawn(l, cam); }
          else if (!l.ground) {
            l.t += dt; l.y -= l.v * dt * (0.8 + 0.4 * Math.sin(l.t * 2.3 + l.p)); l.x += Math.sin(l.t * 1.6 + l.p) * 0.5 * dt + 0.12 * dt; l.z += Math.cos(l.t * 1.2 + l.p) * 0.35 * dt;
            if (l.y <= 0.03) { l.y = 0.03; l.ground = 0.001; }
          } else { l.ground += dt; if (l.ground > 6 + (i % 5)) { l.wait = Math.random() * 3; l.y = -9; } }
          dummy.position.set(l.x, l.y, l.z);
          if (l.ground) dummy.rotation.set(-Math.PI / 2, 0, l.ry);
          else dummy.rotation.set(Math.sin(l.t * 2.6 + l.p) * 1.1, l.ry + l.t * 0.8, Math.cos(l.t * 3.1 + l.p) * 0.9);   // ひらひら回る
          const k = l.ground > 5 ? Math.max(0.001, 1 - (l.ground - 5)) : l.y < -5 ? 0.001 : 1;
          dummy.scale.setScalar(k); dummy.updateMatrix();
          sets[i & 1].setMatrixAt(i >> 1, dummy.matrix);
        }
        sets.forEach(m => { m.instanceMatrix.needsUpdate = true; });
      },
      dispose() { sets.forEach(m => scene.remove(m)); },
    };
  })();

  // ---- 雪だるま ----
  const men = [];   // {g, x, z, born, built}
  const snowM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  const coalM = new THREE.MeshStandardMaterial({ color: 0x2a2630, roughness: 0.8 });
  const noseM = new THREE.MeshStandardMaterial({ color: 0xff8a3c, roughness: 0.7 });
  const scarfM = new THREE.MeshStandardMaterial({ color: 0xe86a8a, roughness: 0.9 });
  function makeMan() {
    const g = new THREE.Group(), s = (r, y, m = snowM) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m); o.position.y = y; o.castShadow = true; g.add(o); return o; };
    const b = s(0.5, 0.45), mid = s(0.36, 1.1), head = s(0.27, 1.62);
    const eye = x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), coalM); e.position.set(x, 1.68, 0.24); head.parent.add(e); return e; };
    eye(-0.09); eye(0.09);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 10), noseM); nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.62, 0.34); g.add(nose);
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 20), scarfM); scarf.rotation.x = Math.PI / 2; scarf.position.y = 1.39; g.add(scarf);
    for (const dy of [0.95, 1.2]) { const bt = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), coalM); bt.position.set(0, dy, 0.35 - (dy - 0.95) * 0.1); g.add(bt); }
    g.userData.parts = [b, mid, head, nose, scarf];
    return g;
  }
  let held = null;   // 町で持っている雪だるま
  const fragGeo = new THREE.SphereGeometry(1, 8, 6), fragMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
  const flyers = [];   // 投げた雪だるま
  const save = () => storage && storage.set('snowmen', men.map(m => ({ x: +m.x.toFixed(2), z: +m.z.toFixed(2) })));
  function addMan(x, z, instant) {
    if (men.length >= MAX_MEN) removeMan(0, true);
    const g = makeMan(); g.position.set(x, 0, z); g.rotation.y = rnd(0, 6.28); g.visible = season === 'winter'; scene.add(g);
    const col = { cx: x, cz: z, r: 0.55 }; if (season === 'winter') colliders.push(col);
    if (!instant) g.userData.parts.forEach(p => p.scale.setScalar(0.001));
    g.children.forEach(ch => { if (!instant && ch.material === coalM) ch.scale.setScalar(0.001); });
    men.push({ g, x, z, born: instant ? -9 : 0, col });
    save(); return men[men.length - 1];
  }
  function removeMan(i, quiet) {
    const m = men[i]; if (!m) return; scene.remove(m.g); const k = colliders.indexOf(m.col); if (k >= 0) colliders.splice(k, 1); men.splice(i, 1); if (!quiet) save(); else save();
  }
  try { const l = storage && storage.get('snowmen'); if (Array.isArray(l)) l.slice(-MAX_MEN).forEach(o => addMan(o.x, o.z, true)); } catch (e) { }

  const api = {
    get season() { return season; },
    men,
    // 季節を変える
    set(s) {
      season = s;
      eachFoliage(m => {
        const b = baseOf(m);
        const tint = s === 'autumn' ? new THREE.Color(AUTUMN[Math.abs(b.getHex()) % 4]) : s === 'winter' ? new THREE.Color(0xeaf2f0) : null;
        m.color.copy(b); if (tint) m.color.lerp(tint, s === 'autumn' ? 0.8 : 0.82); else if (s === 'summer') m.color.lerp(new THREE.Color(0x78cf86), 0.22);
      });
      for (const [pre, k] of [['pave', 0.6], ['roof', 0.62]]) eachTex(pre, m => { const b = baseOf(m); m.color.copy(b); if (s === 'winter') m.color.lerp(new THREE.Color(0xffffff), k); });
      for (const g of groundMats) { const b = baseOf(g); g.color.copy(b); if (s === 'winter') g.color.lerp(new THREE.Color(0xf6f9ff), 0.88); else if (s === 'autumn') g.color.lerp(new THREE.Color(0xd8c98a), 0.35); else if (s === 'spring') g.color.lerp(new THREE.Color(0xd5eca8), 0.25); }
      setFall(s === 'winter' ? 'snow' : null);   // 春の桜は既存の「桜」(木と花びら)、秋の落ち葉は木から(leaves)
      leaves.on(s === 'autumn');
      if (s !== 'winter' && held) { scene.remove(held); held = null; }
      for (const m of men) { m.g.visible = s === 'winter'; const k = colliders.indexOf(m.col); if (s === 'winter' && k < 0) colliders.push(m.col); if (s !== 'winter' && k >= 0) colliders.splice(k, 1); }
    },
    // 雪だるまを作る(x,z に)。ほかの雪だるまとかさならないよう少しずらす
    build(x, z) {
      if (season !== 'winter') return null;
      for (let k = 0; k < 6; k++) { if (!men.some(m => Math.hypot(m.x - x, m.z - z) < 1.1)) break; x += 0.9; z += 0.4; }
      return addMan(x, z, false);
    },
    // 雪だるまを持つ(町)。持っている間は、頭の上にちいさく見える。もう一度で置く
    lift(i) { const m = men[i]; if (!m || held) return false; scene.remove(m.g); const k = colliders.indexOf(m.col); if (k >= 0) colliders.splice(k, 1); men.splice(i, 1); held = makeMan(); held.scale.setScalar(0.5); scene.add(held); return true; },
    carrying: () => !!held,
    holdAt(x, z, ry) { if (held) { held.position.set(x, 1.85, z); held.rotation.y = ry; } },
    // 持っている雪だるまを (to) へ投げる。着いたら onLand(x,z) のあと、そこに立つ
    building: () => men.some(m => m.born >= 0),   // つくっている最中(完成するまで持てない)
    launch(from, to, onLand, check) {   // 雪合戦と同じ放物線(T=0.55+距離/18, 重力9.8)。回りながら飛んで、着いたらくだける
      if (!held) return false; const g = held; held = null; const d = Math.hypot(to.x - from.x, to.z - from.z), T = 0.55 + d / 18, G = 9.8;
      const v = new THREE.Vector3((to.x - from.x) / T, (to.y - from.y) / T + G * T / 2, (to.z - from.z) / T);
      flyers.push({ g, p: from.clone(), v, life: 4, onLand, check }); return true; },
    put(x, z) { if (!held) return null; scene.remove(held); held = null; return api.build(x, z); },
    nearest(x, z, r = 1.6) { let b = null, bd = r; men.forEach((m, i) => { if (m.born >= 0) return; const d = Math.hypot(m.x - x, m.z - z); if (d < bd) { bd = d; b = { i, m }; } }); return b; },
    remove: i => removeMan(i),
    // 毎フレーム。c=カメラの位置
    update(dt, c, night = 0) {
      for (let i = flyers.length - 1; i >= 0; i--) {
        const f = flyers[i]; f.life -= dt; f.v.y -= 9.8 * dt; const pv = f.p.clone(); f.p.addScaledVector(f.v, dt); const hit = !f.frag && f.check ? f.check(pv, f.p) : null; if (hit) f.p.copy(hit.p); f.g.position.copy(f.p); f.g.rotation.x += dt * 4;
        if (hit || (f.frag ? (f.p.y <= 0.05 || f.life <= 0) : (f.p.y <= 0.03 || f.life <= 0))) {
          scene.remove(f.g); flyers.splice(i, 1);
          if (!f.frag) { f.onLand?.(f.p.x, f.p.z, hit);
            for (let k = 0; k < 7; k++) { const an = k / 7 * Math.PI * 2 + Math.random() * 0.4, m = new THREE.Mesh(fragGeo, fragMat); m.scale.setScalar(0.11); m.position.set(f.p.x, 0.3, f.p.z); scene.add(m);
              flyers.push({ g: m, p: m.position.clone(), v: new THREE.Vector3(Math.cos(an) * 5, 2.4, Math.sin(an) * 5), life: 0.7, frag: true }); } }
        }
      }
      leaves.update(dt, c, night);
      t += dt;
      if (kind) {
        const cx = c.x, cz = c.z, cy = Math.max(0, c.y - 6);
        for (let i = 0; i < count; i++) {
          const s = seed[i];
          if (kind === 'snow') { s.y -= (1.3 + s.v * 0.9) * dt; s.x += Math.sin(t * 0.7 + s.p) * 0.35 * dt; s.z += Math.cos(t * 0.5 + s.p) * 0.25 * dt; }
          else if (kind === 'sakura') { s.y -= (0.7 + s.v * 0.5) * dt; s.x += (0.9 + Math.sin(t * 1.3 + s.p) * 0.6) * dt; s.z += Math.cos(t * 0.9 + s.p) * 0.4 * dt; }
          else { s.y -= (1.2 + s.v * 0.8) * dt; s.x += Math.sin(t * 1.6 + s.p) * 1.1 * dt; s.z += Math.cos(t * 1.1 + s.p) * 0.6 * dt; }
          if (s.y < 0) { s.y += H; }
          if (s.x > BOX / 2) s.x -= BOX; else if (s.x < -BOX / 2) s.x += BOX;
          if (s.z > BOX / 2) s.z -= BOX; else if (s.z < -BOX / 2) s.z += BOX;
          // カメラのまわりの箱でくり返す
          const wx = cx + ((s.x - cx + BOX * 1000 + BOX / 2) % BOX) - BOX / 2, wz = cz + ((s.z - cz + BOX * 1000 + BOX / 2) % BOX) - BOX / 2;
          pos[i * 3] = wx; pos[i * 3 + 1] = s.y + cy * 0 + 0.05; pos[i * 3 + 2] = wz;
        }
        geo.attributes.position.needsUpdate = true;
      }
      for (const m of men) {   // 作るところ:下から順にふくらむ
        if (m.born >= 0 || m.born === undefined) { m.born += dt; const a = m.born; const [b, mid, head, nose, scarf] = m.g.userData.parts, e = x => Math.min(1, Math.max(0, x)), o = x => { const k = e(x); return 1 - Math.pow(1 - k, 3) * (1 + 0.3 * Math.sin(k * 9)); };
          b.scale.setScalar(Math.max(0.001, o(a / 0.7))); mid.scale.setScalar(Math.max(0.001, o((a - 0.7) / 0.7))); head.scale.setScalar(Math.max(0.001, o((a - 1.4) / 0.7)));
          const f = Math.max(0.001, o((a - 2.0) / 0.5)); nose.scale.setScalar(f); scarf.scale.setScalar(f);
          m.g.children.forEach(ch => { if (ch.geometry && ch.geometry.type === 'SphereGeometry' && ch.material === coalM) ch.scale.setScalar(f); });
          if (a > 2.7) m.born = -9; }
      }
    },
    dispose() { leaves.dispose(); scene.remove(pts); geo.dispose(); mat.dispose(); for (const m of men) scene.remove(m.g); },
  };
  return api;
}
