// 花火。打ち上げ(のぼる光のすじ)→ひらく → 光が落ちて消える。実際の花火の種類をもとにした型を用意している。
//   kiku=菊(尾を引いて放射) botan=牡丹(尾なしの丸い玉・芯入り) yanagi=しだれ柳(金色が長く垂れる) kamuro=冠菊(大輪・金の長い尾)
//   saturn=土星(玉+輪) heart=ハート(形物) star=星(形物) kobana=小花(小さな玉が散る) irokawari=色変化(開いたあと色が変わる)
// ショー: starmine=スターマイン(連発) finale=フィナーレ(一斉に) digest=ダイジェスト(約1分) full=フル(約3分)
// 描画は Points 1つ(加算合成)。粒は使いまわし(リング)なので、重くならない。
import * as THREE from 'three';

export const FW_TYPES = {
  kiku: '菊', botan: '牡丹', yanagi: 'しだれ柳', kamuro: '冠菊', saturn: '土星', heart: 'ハート', star: '星', kobana: '小花', irokawari: '色変化', niagara: 'ナイアガラ', dai: '特大の一発',
};
export const FW_SHOWS = { starmine: 'スターマイン', finale: 'フィナーレ', digest: 'ダイジェスト(約1分)', full: 'フル(約3分)' };
export const FW_CENTER = { x: 0, z: -105, y: 72 };   // 町の北の空(ここを見る)

const N = 16000;
const PAL = [[1, 0.25, 0.22], [1, 0.55, 0.15], [1, 0.82, 0.3], [0.35, 1, 0.45], [0.3, 0.9, 1], [0.35, 0.55, 1], [0.72, 0.4, 1], [1, 0.45, 0.78], [1, 1, 0.95]];
const GOLD = [1, 0.74, 0.28];
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];

export function createFireworks(scene, { onBoom } = {}) {
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), alp = new Float32Array(N);
  const vel = new Float32Array(N * 3), age = new Float32Array(N).fill(1e9), life = new Float32Array(N).fill(1), drag = new Float32Array(N), grav = new Float32Array(N);
  const c1 = new Float32Array(N * 3), c2 = new Float32Array(N * 3), base = new Float32Array(N), flag = new Uint8Array(N), tr = new Float32Array(N);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alp, 1).setUsage(THREE.DynamicDrawUsage));
  const U = { uScale: { value: 600 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false,
    vertexShader: 'attribute vec3 aColor; attribute float aSize; attribute float aAlpha; varying vec3 vC; varying float vA; uniform float uScale; void main(){ vC = aColor; vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(aSize * uScale / max(1.0, -mv.z), 0.0, 64.0); }',
    fragmentShader: 'varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard; float a = pow(1.0 - d, 1.6); gl_FragColor = vec4(vC * a * vA, 1.0); }',
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 5; scene.add(pts);

  let next = 0, quiet = 99;
  function emit(x, y, z, vx, vy, vz, c, cB, s, lf, o = {}) {
    quiet = 0; const i = next; next = (next + 1) % N;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
    c1[i * 3] = c[0]; c1[i * 3 + 1] = c[1]; c1[i * 3 + 2] = c[2];
    const d = cB || c; c2[i * 3] = d[0]; c2[i * 3 + 1] = d[1]; c2[i * 3 + 2] = d[2];
    size[i] = s; base[i] = s; life[i] = lf; age[i] = 0; drag[i] = o.drag ?? 1.2; grav[i] = o.grav ?? -3; flag[i] = o.trail ? 1 : 0; tr[i] = 0;
  }
  function sphereDir() { const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); return [r * Math.cos(t), u, r * Math.sin(t)]; }
  const shells = [], timers = [], nia = [];
  // ナイアガラ:よこ一列の仕掛けから、金の火の粉が滝のようにたれる
  function niagara(o = {}) { nia.push({ t: 0, dur: o.dur || 10, x0: o.x0 ?? -30, x1: o.x1 ?? 30, y: o.y ?? FW_CENTER.y - 6, z: FW_CENTER.z + (o.z ?? 8), n: 44, ramp: 1.2 }); onBoomSafe('mini', 1); }
  const onBoomSafe = (a, b) => onBoom && onBoom(a, b);
  let showT = -1, showList = [], showI = 0, curShow = '';

  // ひらく。right=見る人から見て横の向き(形物を見る人のほうに向ける)
  function burst(type, x, y, z, cA, cB, right, scale = 1) {
    const A = cA || pick(PAL), B = cB || pick(PAL);
    const sp = s => s * scale;
    const ball = (n, speed, c, c2, s, lf, o) => { for (let k = 0; k < n; k++) { const d = sphereDir(), v = sp(speed) * rnd(0.82, 1.08); emit(x, y, z, d[0] * v, d[1] * v, d[2] * v, c, c2, s, lf * rnd(0.85, 1.15), o); } };
    const planar = (pt, speed, c, s, lf, o) => { const v = sp(speed); emit(x, y, z, right[0] * pt[0] * v, pt[1] * v, right[2] * pt[0] * v, c, null, s, lf, o); };
    onBoom && onBoom(type, scale);
    switch (type) {
      case 'kiku': ball(210, 23, A, [A[0] * 0.7, A[1] * 0.45, A[2] * 0.3], 1.5, 2.7, { drag: 1.15, grav: -3.2, trail: 1 }); break;
      case 'botan': ball(250, 21, A, null, 1.6, 1.9, { drag: 1.7, grav: -2.2 }); ball(90, 9, B, null, 1.4, 1.7, { drag: 1.7, grav: -2.2 }); break;   // 芯入り
      case 'yanagi': ball(150, 16, GOLD, [1, 0.5, 0.15], 1.5, 4.3, { drag: 1.8, grav: -6, trail: 1 }); break;
      case 'kamuro': ball(180, 22, GOLD, [1, 0.55, 0.2], 1.8, 5, { drag: 1.3, grav: -4.2, trail: 1 }); break;
      case 'saturn': { ball(150, 15, A, null, 1.5, 2.3, { drag: 1.4, grav: -2 }); const tilt = 0.45; for (let k = 0; k < 110; k++) { const t = k / 110 * Math.PI * 2, v = sp(25); emit(x, y, z, (Math.cos(t) * right[0]) * v, Math.sin(t) * tilt * v * 0.9, (Math.cos(t) * right[2]) * v, B, null, 1.6, 2.3, { drag: 1.5, grav: -2 }); } break; }
      case 'heart': for (let k = 0; k < 120; k++) { const t = k / 120 * Math.PI * 2, hx = 16 * Math.pow(Math.sin(t), 3) / 17, hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.05; planar([hx, hy], 25, A[0] > 0.9 && A[1] < 0.5 ? A : [1, 0.4, 0.62], 1.7, 2.5, { drag: 2.1, grav: -2 }); } ball(40, 6, [1, 0.85, 0.9], null, 1.2, 1.6, { drag: 2, grav: -2 }); break;
      case 'star': { const pt = k => { const a = k * Math.PI / 5 + Math.PI / 2, r = k % 2 ? 0.45 : 1; return [Math.cos(a) * r, Math.sin(a) * r]; }; for (let seg = 0; seg < 10; seg++) { const p0 = pt(seg), p1 = pt(seg + 1); for (let k = 0; k < 11; k++) { const f = k / 11; planar([p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f], 22, [1, 0.9, 0.4], 1.8, 2.4, { drag: 2.1, grav: -1.8 }); } } break; }
      case 'kobana': for (let m = 0; m < 9; m++) { const d = sphereDir(), r = 12 * scale, cx = x + d[0] * r, cy = y + d[1] * r * 0.8, cz = z + d[2] * r, c = pick(PAL); timers.push({ t: rnd(0, 0.9), fn: () => { onBoom && onBoom('mini', scale * 0.4); for (let k = 0; k < 48; k++) { const q = sphereDir(), v = sp(7.5) * rnd(0.8, 1.1); emit(cx, cy, cz, q[0] * v, q[1] * v, q[2] * v, c, null, 1.3, 1.3, { drag: 1.6, grav: -2.2 }); } } }); } break;
      case 'dai': {   // 特大:町じゅうの空をおおう、金と赤のしだれ
        ball(900, 26, GOLD, [1, 0.5, 0.14], 2.4, 7.5, { drag: 1.05, grav: -3.4 });
        ball(120, 24, [1, 0.95, 0.8], [1, 0.45, 0.12], 2.8, 8.5, { drag: 1.0, grav: -4.2, trail: 1 });
        ball(420, 14, [1, 0.3, 0.3], [1, 0.75, 0.4], 2.2, 6, { drag: 1.3, grav: -3 });
        ball(160, 6, [1, 1, 1], [1, 0.7, 0.4], 3.2, 3.2, { drag: 1.6, grav: -1.5 });
        break;
      }
      case 'irokawari': ball(220, 21, A, B, 1.6, 2.6, { drag: 1.3, grav: -2.6 }); break;   // 開いたあと A→B に色が変わる
      default: ball(160, 20, A, null, 1.5, 2, {});
    }
  }

  // 1発(打ち上げ→ひらく)。from/to は世界の座標
  function shell(type, o = {}) {
    const bx = (o.x ?? rnd(-34, 34)) + FW_CENTER.x, bz = (o.z ?? rnd(-14, 14)) + FW_CENTER.z, by = o.y ?? rnd(FW_CENTER.y - 14, FW_CENTER.y + 18);
    const sx = bx + rnd(-4, 4), sz = FW_CENTER.z - 28 + rnd(-6, 6), t = rnd(1.3, 1.9);
    shells.push({ type, sx, sz, bx, by, bz, t: 0, T: o.T || (o.fast ? 0.55 : t), c: o.c, c2: o.c2, scale: o.scale || 1, wait: o.delay || 0, done: false });
  }
  function riseTrail(s, u, dt) {
    const x = s.sx + (s.bx - s.sx) * u, z = s.sz + (s.bz - s.sz) * u, y = 0.5 + (s.by - 0.5) * (1 - Math.pow(1 - u, 2));
    s.px = x; s.py = y; s.pz = z;
    for (let k = 0; k < 2; k++) emit(x, y, z, rnd(-1, 1), rnd(-3, -1), rnd(-1, 1), [1, 0.78, 0.4], [1, 0.4, 0.1], 1.1, rnd(0.4, 0.8), { drag: 2, grav: -4 });
  }

  const sizes = { show: 0 };
  const api = {
    types: FW_TYPES, shows: FW_SHOWS,
    get active() { return shells.length > 0 || showT >= 0 || timers.length > 0 || age.some(a => a < 6); },
    get showing() { return showT >= 0; },
    get busy() { return nia.length > 0 || shells.length > 0 || showT >= 0 || timers.length > 0 || quiet < 8; },
    launch(type) { shell(type, { x: rnd(-14, 14), z: 0 }); },
    stop() { showT = -1; showList = []; shells.length = 0; timers.length = 0; nia.length = 0; },
    // ショー(starmine / finale / digest / full)
    show(name, targetSec) {
      const L = []; let t = 0.5;
      const add = (type, dt, o) => { t += dt; L.push({ t, type, o }); };
      const mine = (n, gap, tp) => { for (let k = 0; k < n; k++) { const u = n > 1 ? k / (n - 1) : 0.5; L.push({ t: t + k * gap, type: pick(tp || ['botan', 'kiku', 'irokawari']), o: { x: -34 + u * 68 + rnd(-4, 4), z: rnd(-10, 10), y: rnd(FW_CENTER.y - 18, FW_CENTER.y + 4), scale: 0.78, fast: Math.random() < 0.5 } }); } t += n * gap; };
      const fin = (n, gap) => { for (let k = 0; k < n; k++) L.push({ t: t + k * gap, type: pick(['kiku', 'botan', 'kamuro', 'irokawari', 'saturn', 'kobana']), o: { x: rnd(-40, 40), z: rnd(-16, 12), y: rnd(FW_CENTER.y - 20, FW_CENTER.y + 22), scale: rnd(0.9, 1.25), fast: Math.random() < 0.6 } }); for (let k = 0; k < 5; k++) L.push({ t: t + n * gap + k * 0.5, type: 'kamuro', o: { x: -30 + k * 15, z: 0, y: FW_CENTER.y + 8, scale: 1.3 } }); t += n * gap + 4; L.push({ t: t + 1.2, type: 'dai', o: { T: 3.2, scale: 3.4, y: FW_CENTER.y + 26, x: 0, z: 0 } }); t += 11; };
  const nia_ = (d) => { L.push({ t, type: 'niagara', o: { dur: d } }); t += d + 2; };
      if (name === 'niagara') { nia_(12); }
      else if (name === 'dai') { L.push({ t: 0.5, type: 'dai', o: { T: 3.2, scale: 3.4, y: FW_CENTER.y + 26, x: 0, z: 0 } }); t = 12; }
      else if (name === 'starmine') mine(26, 0.32);
      else if (name === 'finale') fin(34, 0.28);
      else if (name === 'digest' || name === 'full') {
        const seq = ['kiku', 'botan', 'yanagi', 'saturn', 'heart', 'star', 'kobana', 'kamuro', 'irokawari'];
        const rounds = name === 'full' ? 4 : 1;
        for (let r = 0; r < rounds; r++) {
          for (const tp of seq) add(tp, name === 'full' ? 3.2 : 3.6, { x: rnd(-20, 20), z: 0 });
          if (name === 'full') { add('botan', 1.5, { x: -25 }); add('botan', 0.7, { x: 25 }); add('kiku', 0.7, { x: 0 }); }
          mine(name === 'full' ? 22 : 16, 0.34); t += 3;
          if (r === rounds - 1 || name === 'full') nia_(name === 'full' ? 10 : 8);
        }
        fin(name === 'full' ? 40 : 28, 0.28);
      } else if (FW_TYPES[name]) { for (let k = 0; k < 3; k++) L.push({ t: 0.5 + k * 1.8, type: name, o: { x: -14 + k * 14, z: 0 } }); t = 6; }
      else return;
      if (targetSec > 5) { const k = targetSec / (t + 3); if (Math.abs(k - 1) > 0.02) { for (const e of L) { e.t *= k; if (e.type === 'niagara') e.o.dur *= Math.max(0.6, Math.min(2, k)); } t *= k; } }
      showList = L.sort((a, b) => a.t - b.t); showI = 0; showT = 0; curShow = name; api.showLength = t + 3;
    },
    // 毎フレーム。camera=カメラ、h=画面の高さ(px)
    update(dt, camera, h) {
      quiet += dt;
      U.uScale.value = h / (2 * Math.tan(camera.fov * Math.PI / 360));
      if (showT >= 0) {
        showT += dt;
        while (showI < showList.length && showList[showI].t <= showT) { const e = showList[showI++]; if (e.type === 'niagara') niagara(e.o); else shell(e.type, e.o); }
        if (showT > (api.showLength || 0)) showT = -1;
      }
      // 見る人の右がわ(形物の向き)
      const d = new THREE.Vector3(); camera.getWorldDirection(d);
      const right = [-d.z, 0, d.x]; const rl = Math.hypot(right[0], right[2]) || 1; right[0] /= rl; right[2] /= rl;
      for (let i = timers.length - 1; i >= 0; i--) { timers[i].t -= dt; if (timers[i].t <= 0) { timers[i].fn(); timers.splice(i, 1); } }
      for (let i = shells.length - 1; i >= 0; i--) {
        const s = shells[i];
        if (s.wait > 0) { s.wait -= dt; continue; }
        s.t += dt; const u = Math.min(1, s.t / s.T); riseTrail(s, u, dt);
        if (u >= 1) { burst(s.type, s.bx, s.by, s.bz, s.c, s.c2, s.type === 'heart' || s.type === 'star' || s.type === 'saturn' ? rightToward(s, camera) : right, s.scale); shells.splice(i, 1); }
      }
      for (let i = nia.length - 1; i >= 0; i--) {
        const n = nia[i]; n.t += dt; if (n.t > n.dur) { nia.splice(i, 1); continue; }
        const k = Math.min(1, n.t / n.ramp) * Math.min(1, (n.dur - n.t) / 1.5 + 0.0);
        for (let j = 0; j < n.n; j++) {
          if (Math.random() > 14 * dt * k) continue;
          const x = n.x0 + (n.x1 - n.x0) * (j / (n.n - 1)) + rnd(-0.3, 0.3);
          emit(x, n.y, n.z + rnd(-0.3, 0.3), rnd(-0.6, 0.6), -rnd(1, 4), rnd(-0.3, 0.3), [1, 0.82, 0.4], [1, 0.4, 0.1], rnd(1.2, 1.9), rnd(2.2, 3.6), { drag: 0.7, grav: -5.5 });
        }
      }
      // 粒のうごき
      for (let i = 0; i < N; i++) {
        const a = age[i]; if (a > 100) { alp[i] = 0; continue; }
        const L = life[i];
        if (a >= L) { alp[i] = 0; age[i] = 1e9; continue; }
        age[i] = a + dt; const k = Math.exp(-drag[i] * dt);
        vel[i * 3] *= k; vel[i * 3 + 1] = vel[i * 3 + 1] * k + grav[i] * dt; vel[i * 3 + 2] *= k;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        const f = (a + dt) / L, ff = f * f;
        const cx = c1[i * 3] + (c2[i * 3] - c1[i * 3]) * Math.min(1, f * 1.4), cy = c1[i * 3 + 1] + (c2[i * 3 + 1] - c1[i * 3 + 1]) * Math.min(1, f * 1.4), cz = c1[i * 3 + 2] + (c2[i * 3 + 2] - c1[i * 3 + 2]) * Math.min(1, f * 1.4);
        const tw = 0.75 + 0.25 * Math.sin((a + i) * 38);
        const fade = f < 0.12 ? 1 + (0.12 - f) * 6 : 1 - ff * ff;   // はじめ一瞬まぶしい→だんだん消える
        col[i * 3] = cx; col[i * 3 + 1] = cy; col[i * 3 + 2] = cz; alp[i] = Math.max(0, fade) * tw * 1.15; size[i] = base[i] * (1 - 0.35 * f);
        if (flag[i]) { tr[i] -= dt; if (tr[i] <= 0) { tr[i] = 0.075; emit(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], 0, 0, 0, [cx, cy, cz], [cx * 0.6, cy * 0.35, cz * 0.2], base[i] * 0.55, 0.5 + 0.3 * (1 - f), { drag: 3, grav: -1.2 }); } }
      }
      geo.attributes.position.needsUpdate = geo.attributes.aColor.needsUpdate = geo.attributes.aSize.needsUpdate = geo.attributes.aAlpha.needsUpdate = true;
    },
    dispose() { scene.remove(pts); geo.dispose(); mat.dispose(); },
  };
  // 形物は、花火が開く場所から見て、いまのカメラのほうに面を向ける(横向きに見えないように)
  function rightToward(s, camera) {
    const dx = camera.position.x - s.bx, dz = camera.position.z - s.bz, l = Math.hypot(dx, dz) || 1;
    return [-dz / l, 0, dx / l];
  }
  return api;
}
