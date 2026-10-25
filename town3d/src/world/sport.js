// 季節のスポーツ(町がコース):春=ミニゴルフ、秋=フリスビー(ディスクゴルフ)。
//   毎日かわるコース(日付でスタートとゴールを決める・5ホール)。ゲーム機からは季節に関係なく遊べる。
//   向き=カメラの向き(ドラッグか ◀▶)。大きいボタンを押している間ゲージが動く → はなすと打つ/投げる
import * as THREE from 'three';

const HOLES = 5, G = 9.8;
const CLUBS = [   // ゴルフのクラブ:飛ぶ距離(m)・打ち出し角
  { id: 'dr', name: 'ドライバー', d: 70, loft: 13 }, { id: 'ir', name: 'アイアン', d: 45, loft: 24 },
  { id: 'wd', name: 'ウェッジ', d: 22, loft: 50 }, { id: 'pt', name: 'パター', d: 16, loft: 0 },
];
const HGTS = [['低め', 0], ['ふつう', 1], ['高め', 2]];   // フリスビーの高さ
function rng(seed) { let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function createSport({ scene, camera, root, me, city, collide, audio, wallet, getYaw, setYaw, onEnd, toast }) {
  const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
  let S = null;
  const css = document.createElement('style');
  css.textContent = `.sp-on .tw-emotes,.sp-on .tw-snowb,.sp-on .tw-action{display:none!important}
.sp-hud{position:absolute;inset:0;pointer-events:none;font-family:inherit;color:#5a4a6b;z-index:6}
.sp-hud button{pointer-events:auto;border:0;font:inherit;font-weight:900;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.sp-top{position:absolute;left:8px;right:8px;top:calc(52px + env(safe-area-inset-top,0px));background:#fffffff0;border-radius:14px;padding:6px 10px;font-size:12px;font-weight:800;box-shadow:0 2px 8px #0002;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
.sp-top b{font-size:14px}
.sp-clubs{position:absolute;left:8px;right:8px;bottom:calc(196px + env(safe-area-inset-bottom,0px));display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.sp-clubs button{background:#fff;border-radius:999px;padding:7px 11px;font-size:12px;box-shadow:0 2px 6px #0002}.sp-clubs button.on{background:#ffd36b}
.sp-shot{position:absolute;right:16px;bottom:calc(84px + env(safe-area-inset-bottom,0px));width:96px;height:96px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#ffe1ea);box-shadow:0 5px 0 #e0a0b4,0 8px 16px #0004;font-size:30px;line-height:1}
.sp-shot small{display:block;font-size:11px}
.sp-aim{position:absolute;bottom:calc(100px + env(safe-area-inset-bottom,0px));width:56px;height:56px;border-radius:50%;background:#fff;box-shadow:0 3px 0 #c9bfd8,0 5px 10px #0003;font-size:20px}
.sp-l{left:16px}.sp-r{left:80px}
.sp-gauge{position:absolute;right:122px;bottom:calc(84px + env(safe-area-inset-bottom,0px));width:18px;height:120px;border-radius:9px;background:#fffffff0;box-shadow:0 2px 6px #0003;overflow:hidden}
.sp-tim{position:absolute;right:16px;bottom:calc(240px + env(safe-area-inset-bottom,0px));width:150px;height:16px;border-radius:8px;background:linear-gradient(90deg,#9fc8ff,#fff 42%,#8fe0b0 44%,#8fe0b0 56%,#fff 58%,#ffb3c1);box-shadow:0 2px 6px #0003}
.sp-tim i{position:absolute;top:-4px;width:4px;height:24px;border-radius:2px;background:#5a4a6b;left:50%}.sp-tim[hidden]{display:none}
.sp-wind{display:inline-block;transition:transform .2s}
.sp-swing{position:absolute;left:16px;right:16px;bottom:calc(252px + env(safe-area-inset-bottom,0px));height:30px;border-radius:15px;background:linear-gradient(90deg,#fff 0 7%,#ffe08a 7% 13%,#fff 13%);box-shadow:0 2px 8px #0004;border:2px solid #fff}
.sp-swing .pw{position:absolute;top:0;bottom:0;left:0;border-radius:11px;background:linear-gradient(90deg,#ffd36b,#ff7aa2);opacity:.55}
.sp-swing .mk{position:absolute;top:-6px;width:5px;height:38px;border-radius:3px;background:#5a4a6b}
.sp-swing .set{position:absolute;top:-8px;width:3px;height:42px;background:#ff5a5a}
.sp-swing span{position:absolute;left:10%;top:-20px;transform:translateX(-50%);font-size:10px;font-weight:900;color:#fff;text-shadow:0 1px 3px #000c;white-space:nowrap}
.sp-swing[hidden]{display:none}
.sp-gauge i{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(#ff5a5a,#ffd36b,#8fe0b0)}
.sp-quit{position:absolute;left:10px;bottom:calc(20px + env(safe-area-inset-bottom,0px));background:#fffffff0;border-radius:999px;padding:8px 14px;font-size:12px;box-shadow:0 2px 6px #0002}
.sp-msg{position:absolute;left:0;right:0;top:32%;text-align:center;font-size:30px;font-weight:900;color:#fff;text-shadow:0 3px 0 #5a4a6b,0 0 12px #0006;pointer-events:none}
.sp-card{position:absolute;left:50%;top:22%;transform:translateX(-50%);background:#fffffff5;border-radius:18px;padding:14px 16px;pointer-events:auto;box-shadow:0 6px 20px #0003;min-width:260px;text-align:center;font-size:13px}
.sp-card table{margin:8px auto;border-collapse:collapse}.sp-card td{padding:3px 8px;border-bottom:1px solid #eee}
.sp-card .go{background:linear-gradient(160deg,#ffd0dc,#ffb3c1);color:#fff;border-radius:999px;padding:10px 26px;font-size:15px;margin-top:6px}`;
  document.head.appendChild(css);

  // ---- コース(毎日かわる) ----
  function course(kind) {
    const d = new Date(), key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}:${kind}`, r = rng(key);
    const nodes = Object.values(city.graph.nodes).filter(n => !/^pd|^p\d/.test(n.id));
    const [lo, hi] = kind === 'golf' ? [28, 75] : [22, 55], holes = [];
    for (let k = 0; k < HOLES; k++) {
      for (let tries = 0; tries < 200; tries++) {
        const a = nodes[Math.floor(r() * nodes.length)], b = nodes[Math.floor(r() * nodes.length)], L = Math.hypot(a.x - b.x, a.z - b.z);
        if (a === b || L < lo || L > hi) continue;
        let [gx, gz] = collide(b.x + (r() - 0.5) * 6, b.z + (r() - 0.5) * 6, 0.8);
        const dist = Math.hypot(a.x - gx, a.z - gz);
        const wa = r() * Math.PI * 2, ws = Math.round(r() * 40) / 10;   // 風の向きと強さ(0〜4m/s)
        holes.push({ wind: [Math.sin(wa) * ws, Math.cos(wa) * ws, ws], tee: [a.x, a.z], goal: [gx, gz], dist, par: kind === 'golf' ? (dist < 40 ? 3 : dist < 62 ? 4 : 5) : (dist < 35 ? 3 : 4) });
        break;
      }
    }
    return { key, holes };
  }
  // ---- 目印 ----
  function flagMesh(kind) {
    const g = new THREE.Group();
    if (kind === 'golf') {
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshBasicMaterial({ color: 0x1a1a1a })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.03; g.add(hole);
      const green = new THREE.Mesh(new THREE.CircleGeometry(2.6, 32), new THREE.MeshStandardMaterial({ color: 0x7fd36b, transparent: true, opacity: 0.85 })); green.rotation.x = -Math.PI / 2; green.position.y = 0.02; g.add(green);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 8), mat(0xffffff)); pole.position.y = 1.2; g.add(pole);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.7, -0.22); sh.lineTo(0, -0.45);
      const fl = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: 0xff5a5a, side: THREE.DoubleSide })); fl.position.set(0.01, 2.4, 0); g.add(fl); g.userData.flag = fl;
    } else {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), mat(0xc0c0c8)); pole.position.y = 0.75; g.add(pole);
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.22, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xffcf3a, side: THREE.DoubleSide, metalness: 0.4 })); basket.position.y = 0.62; g.add(basket);
      const top = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 6, 24), mat(0xffcf3a)); top.rotation.x = Math.PI / 2; top.position.y = 1.42; g.add(top);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, ch = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.7, 4), mat(0xb8b8c0)); ch.position.set(Math.cos(a) * 0.3, 1.05, Math.sin(a) * 0.3); ch.rotation.z = Math.cos(a) * 0.15; ch.rotation.x = -Math.sin(a) * 0.15; g.add(ch); }
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.8, 32), new THREE.MeshBasicMaterial({ color: 0xffcf3a, transparent: true, opacity: 0.6, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; g.add(ring);
    }
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 30, 12, 1, true), new THREE.MeshBasicMaterial({ color: kind === 'golf' ? 0xff7aa2 : 0xffcf3a, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 15; g.add(beam);   // 遠くからでも見える光の柱
    return g;
  }
  // ---- はじめる ----
  function start(kind, opt = {}) {
    if (S) return;
    const C = course(kind);
    S = { kind, C, i: 0, strokes: [], n: 0, club: 0, curve: 0, hgt: 1, phase: 'aim', obj: null, power: 0, charging: false, cT: 0, last: null, objs: [], hud: hudEl(kind), flag: null, aimLine: null, msgT: 0 };
    root.classList.add('sp-on'); toast?.(kind === 'golf' ? `⛳ きょうのゴルフコース(${HOLES}ホール)` : `🥏 きょうのフリスビーコース(${HOLES}ホール)`);
    const pm = kind === 'golf' ? new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), mat(0xffffff)) : (() => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.025, 24), mat(0xff7aa2)); return d; })();
    pm.castShadow = true; scene.add(pm); S.objs.push(pm); S.mesh = pm;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(40 * 3), 3));
    S.aimLine = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.4, gapSize: 0.3, transparent: true, opacity: 0.9 })); scene.add(S.aimLine); S.objs.push(S.aimLine);
    S.land = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide })); S.land.rotation.x = -Math.PI / 2; scene.add(S.land); S.objs.push(S.land);
    hole(0);
  }
  function hole(i) {
    S.i = i; S.n = 0; const H = S.C.holes[i];
    if (S.flag) scene.remove(S.flag);
    S.flag = flagMesh(S.kind); S.flag.position.set(H.goal[0], 0, H.goal[1]); scene.add(S.flag);
    S.pos = new THREE.Vector3(H.tee[0], S.kind === 'golf' ? 0.06 : 1.2, H.tee[1]); S.phase = 'aim'; S.club = S.kind === 'golf' ? (H.dist > 55 ? 0 : 1) : 0;
    standAt(S.pos); msg(`ホール ${i + 1}  PAR ${H.par}`); drawHud();
  }
  function standAt(p) {   // ボールのうしろに立って、ゴールの方を向く
    const H = S.C.holes[S.i], a = Math.atan2(H.goal[0] - p.x, H.goal[1] - p.z);
    me.x = p.x - Math.sin(a) * 0.7 + Math.cos(a) * 0.3; me.z = p.z - Math.cos(a) * 0.7 - Math.sin(a) * 0.3; me.ry = a; setYaw(a + Math.PI);
  }
  function end(quit) {
    const total = S.strokes.reduce((a, b) => a + b, 0), par = S.C.holes.slice(0, S.strokes.length).reduce((a, h) => a + h.par, 0), kind = S.kind;
    S.objs.forEach(o => scene.remove(o)); if (S.flag) scene.remove(S.flag); S.hud.remove(); root.classList.remove('sp-on');
    S = null; onEnd?.({ kind, quit, total, par });
  }
  function msg(t) { if (!S) return; const el = S.hud.querySelector('.sp-msg'); el.textContent = t; S.msgT = 1.8; }
  // ---- 画面 ----
  function hudEl(kind) {
    const h = document.createElement('div'); h.className = 'sp-hud';
    h.innerHTML = `<div class="sp-top"></div><div class="sp-msg"></div><div class="sp-clubs"></div>
      <button class="sp-aim sp-l">◀</button><button class="sp-aim sp-r">▶</button>${kind === 'golf' ? '' : '<div class="sp-gauge"><i style="height:0"></i></div>'}
      <div class="sp-tim" hidden><i></i></div>${kind === 'golf' ? '<div class="sp-swing"><div class="pw"></div><div class="set" hidden></div><div class="mk"></div><span>▼ここで3回目</span></div>' : ''}<button class="sp-shot">${kind === 'golf' ? '⛳<small>タップ×3</small>' : '🥏<small>引いて はなす</small>'}</button><button class="sp-quit">✕ やめる</button>`;
    root.appendChild(h);
    const shot = h.querySelector('.sp-shot');
    let y0 = 0;
    shot.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (!S || S.phase !== 'aim') return;
      if (S.kind === 'golf') { if (S.sw && S.sw.ph === 'shot') return; swingTap(); return; }   // ゴルフ:タップ3回(スタート → 強さ → 左右)
      S.charging = true; S.cT = 0; S.power = 0; y0 = e.clientY; try { shot.setPointerCapture(e.pointerId); } catch (_) { } });
    shot.addEventListener('pointermove', e => { if (!S || !S.charging || S.kind !== 'frisbee') return; S.power = Math.max(0, Math.min(1, (e.clientY - y0) / 150)); });   // 下へ引くほど強い
    const rel = () => {
      if (!S || !S.charging) return; S.charging = false;
      if (S.kind === 'frisbee') { if (S.power < 0.08) return; const nd = S.needle; S.curve = Math.abs(nd) < 0.14 ? 0 : nd; }

      fire();
    };
    shot.addEventListener('pointerup', rel); shot.addEventListener('pointercancel', rel); shot.addEventListener('contextmenu', e => e.preventDefault());
    let held = null;
    const aimBtn = (el, d) => { el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); held = d; }); ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => el.addEventListener(t, () => (held = null))); };
    aimBtn(h.querySelector('.sp-l'), 1); aimBtn(h.querySelector('.sp-r'), -1);
    h._held = () => held;
    h.querySelector('.sp-clubs').addEventListener('pointerdown', e => { const b = e.target.closest('[data-c]'); if (!b || !S || S.phase !== 'aim') return; e.stopPropagation(); if (S.kind === 'golf') S.club = +b.dataset.c; else S.hgt = +b.dataset.c; drawHud(); audio?.play?.('wave'); });
    h.querySelector('.sp-quit').addEventListener('click', () => S && end(true));
    return h;
  }
  function drawHud() {
    const H = S.C.holes[S.i], dist = Math.hypot(H.goal[0] - S.pos.x, H.goal[1] - S.pos.z), tot = S.strokes.reduce((a, b) => a + b, 0);
    S.hud.querySelector('.sp-top').innerHTML = `<span><b>${S.kind === 'golf' ? '⛳' : '🥏'} ホール ${S.i + 1}/${HOLES}</b> PAR ${H.par}</span><span>${S.n + 1}${S.kind === 'golf' ? '打' : '投'}目 ・ のこり ${Math.round(dist)}m</span><span>風 <span class="sp-wind">⬆</span> ${H.wind[2]}m/s</span><span>合計 ${tot}</span>`;
    S.hud.querySelector('.sp-clubs').innerHTML = S.kind === 'golf'
      ? CLUBS.map((c, i) => `<button data-c="${i}" class="${S.club === i ? 'on' : ''}">${c.name}<br><small>〜${c.d}m</small></button>`).join('')
      : `<span style="pointer-events:none;background:#fffffff0;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:800">高さ</span>` + HGTS.map(([l, v]) => `<button data-c="${v}" class="${S.hgt === v ? 'on' : ''}">${l}</button>`).join('');
  }
  // ---- 打つ・投げる ----
  function aimDir() { const y = getYaw() + Math.PI; return [Math.sin(y), Math.cos(y)]; }   // カメラの向き=ねらう向き
  function fire() {
    const p = Math.max(0.05, S.power); let [dx, dz] = aimDir(); S.n++; S.last = S.pos.clone(); S.phase = 'fly'; S.t = 0; audio?.play?.('wave');
    me.ry = Math.atan2(dx, dz);
    if (S.kind === 'golf') {
      const c = CLUBS[S.club], dv = -(S.dev || 0) * (c.loft === 0 ? 0.08 : 0.06 + c.d / 70 * 0.1), cs = Math.cos(dv), sn = Math.sin(dv);   // 左右のずれ(長いクラブほど大きい)
      [dx, dz] = [dx * cs + dz * sn, -dx * sn + dz * cs]; msg(S.dev ? (S.dev > 0 ? 'ちょっと右へ…' : 'ちょっと左へ…') : 'ナイスショット!');
      if (c.loft === 0) { const v = Math.sqrt(2 * 1.6 * c.d * p); S.v = new THREE.Vector3(dx * v, 0, dz * v); S.pos.y = 0.06; }
      else { const th = c.loft * Math.PI / 180, v = Math.sqrt(c.d * p * G / Math.sin(2 * th)); S.v = new THREE.Vector3(dx * v * Math.cos(th), v * Math.sin(th), dz * v * Math.cos(th)); }
    } else { const v = 6 + 18 * p; S.v = new THREE.Vector3(dx * v, [0.6, 2.0, 3.6][S.hgt] + p * 1.2, dz * v); S.pos.y = 1.2; S.curveNow = S.curve; S.lastCurve = S.curve; }
    drawHud();
  }
  function hitWalls(p, v, keep) {   // 建物・木などに当たったら はね返る
    if (p.y > 7) return;
    for (const c of city.colliders) {
      if (c.r !== undefined) { const dx = p.x - c.cx, dz = p.z - c.cz, d = Math.hypot(dx, dz), m = c.r + 0.06; if (d < m && d > 1e-4) { const nx = dx / d, nz = dz / d, vn = v.x * nx + v.z * nz; p.x = c.cx + nx * m; p.z = c.cz + nz * m; if (vn < 0) { v.x -= (1 + keep) * vn * nx; v.z -= (1 + keep) * vn * nz; audio?.play?.('close'); } } }
      else if (p.x > c.x0 && p.x < c.x1 && p.z > c.z0 && p.z < c.z1) {
        const l = p.x - c.x0, r = c.x1 - p.x, t = p.z - c.z0, b = c.z1 - p.z, m = Math.min(l, r, t, b);
        if (m === l) { p.x = c.x0; v.x = -Math.abs(v.x) * keep; } else if (m === r) { p.x = c.x1; v.x = Math.abs(v.x) * keep; } else if (m === t) { p.z = c.z0; v.z = -Math.abs(v.z) * keep; } else { p.z = c.z1; v.z = Math.abs(v.z) * keep; }
        audio?.play?.('close');
      }
    }
  }
  function stepFly(dt) {
    const H = S.C.holes[S.i], p = S.pos, v = S.v, n = 4, h = dt / n;
    for (let k = 0; k < n; k++) {
      if (S.kind === 'golf') {
        if (p.y > 0.06 || v.y > 0) { v.y -= G * h; v.multiplyScalar(Math.exp(-0.05 * h)); v.x += H.wind[0] * 0.07 * h; v.z += H.wind[1] * 0.07 * h; }   // 風(ゴルフは少し)
        else { p.y = 0.06; if (v.y < -1.5) { v.y = -v.y * 0.35; v.x *= 0.7; v.z *= 0.7; audio?.play?.('close'); } else { v.y = 0; const sp = Math.hypot(v.x, v.z), dec = 1.6 * h; if (sp <= dec) { v.x = v.z = 0; } else { v.x *= (sp - dec) / sp; v.z *= (sp - dec) / sp; } } }
        p.addScaledVector(v, h); hitWalls(p, v, 0.45);
        const dh = Math.hypot(p.x - H.goal[0], p.z - H.goal[1]), sp = Math.hypot(v.x, v.z);
        if (dh < 0.3 && p.y < 0.4 && sp < 6) return holed();   // カップイン
      } else {
        const sp = Math.hypot(v.x, v.z);
        if (p.y > 0.03) {
          const lift = Math.min(0.85, sp / 20); v.y -= G * (1 - lift) * h; v.y *= Math.exp(-0.6 * h);
          const ux = v.x / (sp || 1), uz = v.z / (sp || 1), slow = 1 - Math.min(1, sp / 24), side = (S.curveNow * 3.4 - 0.4) * slow * h;   // 曲がり(おそくなるほど強い。少しだけ左へ流れる)
          v.x += -uz * side; v.z += ux * side;   // (-uz, ux) = 進む向きの右
          v.x *= Math.exp(-0.22 * h); v.z *= Math.exp(-0.22 * h); v.x += H.wind[0] * 0.32 * h; v.z += H.wind[1] * 0.32 * h;   // 風
        } else { p.y = 0.03; v.y = 0; const dec = 7 * h; if (sp <= dec) { v.x = v.z = 0; } else { v.x *= (sp - dec) / sp; v.z *= (sp - dec) / sp; } }
        p.addScaledVector(v, h); hitWalls(p, v, 0.3);
        const dh = Math.hypot(p.x - H.goal[0], p.z - H.goal[1]);
        if (dh < 0.8 && p.y > 0.05 && p.y < 2.0) return holed();   // バスケットに入った
      }
      if (Math.abs(p.x) > 72 || p.z < -80 || p.z > 72) { msg('OB! もとの場所から(+1)'); S.n++; S.pos.copy(S.last); S.phase = 'aim'; standAt(S.pos); drawHud(); return; }
    }
    if (Math.hypot(v.x, v.z) < 0.08 && (S.kind === 'golf' ? p.y <= 0.07 : p.y <= 0.04)) {   // 止まった
      S.phase = 'aim'; if (S.kind === 'frisbee') p.y = 1.2; standAt(p); drawHud();
      if (S.n >= 12) { msg('ギブアップ… つぎのホールへ'); S.strokes.push(S.n + 1); next(); }
    }
  }
  function holed() {
    const H = S.C.holes[S.i], d = S.n - H.par;
    const nm = S.n === 1 ? 'ホールインワン!!' : d <= -2 ? 'イーグル!' : d === -1 ? 'バーディー!' : d === 0 ? 'パー!' : d === 1 ? 'ボギー' : `${S.n}${S.kind === 'golf' ? '打' : '投'}`;
    msg(nm); audio?.play?.(d <= 0 ? 'coin' : 'open'); S.strokes.push(S.n); S.phase = 'holed'; S.t = 0;
  }
  function next() {
    if (S.i + 1 >= HOLES) { S.phase = 'done'; showCard(); return; }
    hole(S.i + 1);
  }
  function showCard() {
    const tot = S.strokes.reduce((a, b) => a + b, 0), par = S.C.holes.reduce((a, h) => a + h.par, 0), coins = Math.max(10, 60 - Math.max(0, tot - par) * 5);
    wallet?.add?.(coins, S.kind);
    const c = document.createElement('div'); c.className = 'sp-card';
    c.innerHTML = `<b style="font-size:17px">${S.kind === 'golf' ? '⛳ きょうのゴルフ' : '🥏 きょうのフリスビー'} おわり!</b><table>${S.C.holes.map((h, i) => `<tr><td>ホール${i + 1}</td><td>PAR ${h.par}</td><td><b>${S.strokes[i] ?? '-'}</b></td></tr>`).join('')}<tr><td>合計</td><td>${par}</td><td><b>${tot}</b> (${tot - par >= 0 ? '+' : ''}${tot - par})</td></tr></table>🪙 +${coins}<br><button class="go">おわる</button>`;
    c.addEventListener('pointerdown', e => e.stopPropagation()); c.querySelector('.go').addEventListener('click', () => end(false));
    S.hud.appendChild(c);
  }
  // ---- ゴルフのスイング(みんゴル式):1回目でスタート → 2回目で強さ → もどってくる印を「インパクト」で3回目 ----
  const IMPACT = 0.1;
  // パター:タップ2回(スタート → 強さ)で打つ。左右のメーターはなし
  // ほかのクラブ:1回目スタート → 2回目で強さ → もどってくる印を「インパクト」で3回目
  //   いちばん上(MAX)で少し止まる。そこで押すとMAXの強さ(3回目あつかいにはしない)。強さを決めた直後のタップは数えない
  function swingTap() {
    const sw = S.sw, putt = CLUBS[S.club].loft === 0;
    if (!sw) { S.sw = { ph: 1, pos: 0, hold: 0, since: 0 }; audio?.play?.('wave'); return; }
    if (sw.ph === 1 || sw.ph === 'top') { S.power = Math.max(0.05, sw.pos); sw.ph = 2; sw.since = 0; audio?.play?.('open'); if (putt) { S.dev = 0; S.sw = null; fire(); } return; }
    if (sw.ph === 2) { if (sw.since < 0.22) return; const d = (sw.pos - IMPACT) / 0.13; S.dev = Math.abs(d) < 0.22 ? 0 : Math.max(-1, Math.min(1, d)); sw.ph = 'shot'; sw.shotT = 0; sw.hitAt = sw.pos; fire(); }
  }
  function swingStep(dt) {
    const sw = S.sw, el = S.hud.querySelector('.sp-swing'); if (!el) return;
    const putt = CLUBS[S.club].loft === 0;
    el.querySelector('span').style.display = putt ? 'none' : '';
    if (sw) {
      sw.since += dt;
      if (sw.ph === 1) { sw.pos += dt * 0.75; if (sw.pos >= 1) { sw.pos = 1; sw.ph = 'top'; sw.hold = 0; } }
      else if (sw.ph === 'top') { sw.hold += dt; if (sw.hold > 0.3) { S.power = 1; if (putt) { S.dev = 0; S.sw = null; fire(); return; } sw.ph = 2; sw.since = 0.3; } }   // MAXで少し止まってから もどる
      else if (sw.ph === 2) { sw.pos -= dt * 0.8; if (sw.pos < -0.06) { S.dev = -1; sw.ph = 'shot'; sw.shotT = 0; sw.hitAt = sw.pos; msg('タイミングが合わなかった…'); fire(); } }
      else if (sw.ph === 'shot') { sw.shotT += dt; if (sw.shotT > 0.9) S.sw = null; }   // 打ったあとも少しだけ結果を見せる
    }
    const cur = S.sw, pos = cur ? (cur.ph === 'shot' ? cur.hitAt : cur.pos) : 0;
    el.querySelector('.mk').style.left = `calc(${Math.max(0, pos) * 100}% - 2px)`;
    el.querySelector('.pw').style.width = `${(cur && (cur.ph === 1 || cur.ph === 'top') ? pos : cur ? S.power : 0) * 100}%`;
    const st = el.querySelector('.set'), showSet = !!(cur && cur.ph !== 1 && cur.ph !== 'top'); st.hidden = !showSet; if (showSet) st.style.left = `calc(${S.power * 100}% - 1px)`;
  }
  // ---- 毎フレーム ----
  const tmp = new THREE.Vector3();
  function update(dt) {
    if (!S) return;
    S.msgT = Math.max(0, S.msgT - dt); if (S.msgT <= 0) S.hud.querySelector('.sp-msg').textContent = '';
    const held = S.hud._held(); if (held && S.phase === 'aim') setYaw(getYaw() + held * dt * 0.9);
    if (S.charging) S.cT += dt;
    if (S.kind === 'golf') swingStep(dt);
    if (S.kind === 'frisbee') { const tm = S.hud.querySelector('.sp-tim'), on = !!S.charging; if (tm.hidden === on) tm.hidden = !on; if (on) { S.needle = Math.sin(S.cT * 2.8); tm.firstChild.style.left = `calc(${50 + S.needle * 48}% - 2px)`; } }
    { const H = S.C.holes[S.i], w = S.hud.querySelector('.sp-wind'); if (w) { const y = getYaw() + Math.PI, fx = Math.sin(y), fz = Math.cos(y), up = H.wind[0] * fx + H.wind[1] * fz, rt = H.wind[0] * -fz + H.wind[1] * fx; w.style.transform = `rotate(${Math.atan2(rt, up) * 180 / Math.PI}deg)`; } }
    const gq = S.hud.querySelector('.sp-gauge i'); if (gq) gq.style.height = `${Math.round((S.charging ? S.power : 0) * 100)}%`;
    if (S.phase === 'fly') { S.t += dt; stepFly(dt); }
    if (S.phase === 'holed') { S.t += dt; if (S.t > 2.2) next(); }
    if (S.phase === 'aim') { me.ry = Math.atan2(...aimDir()); }
    // ボール/ディスク
    if (S.kind === 'frisbee' && S.phase !== 'fly') S.mesh.position.set(me.x + Math.sin(me.ry) * 0.35, 1.1, me.z + Math.cos(me.ry) * 0.35); else S.mesh.position.copy(S.pos);
    if (S.kind === 'frisbee') S.mesh.rotation.y += dt * (S.phase === 'fly' ? 20 : 0);
    if (S.flag?.userData.flag) S.flag.userData.flag.rotation.y = Math.sin(performance.now() / 300) * 0.3;
    // ねらいの線と、だいたいの落ちる場所
    const show = S.phase === 'aim'; S.aimLine.visible = S.land.visible = show;
    if (show) {
      const [dx, dz] = aimDir(); let L;
      if (S.kind === 'golf') { const c = CLUBS[S.club]; L = c.d * (S.sw ? Math.max(0.05, S.sw.ph === 1 ? S.sw.pos : S.power) : 1); } else L = 26 * (S.charging ? Math.max(0.05, S.power) : 1);
      const a = S.aimLine.geometry.attributes.position, y0 = S.kind === 'golf' ? 0.08 : 1.1;
      for (let i = 0; i < 40; i++) { const q = i / 39, h = S.kind === 'golf' && CLUBS[S.club].loft ? Math.sin(q * Math.PI) * L * 0.18 : 0; a.setXYZ(i, S.pos.x + dx * L * q, y0 + h, S.pos.z + dz * L * q); }
      a.needsUpdate = true; S.aimLine.computeLineDistances(); S.land.position.set(S.pos.x + dx * L, 0.05, S.pos.z + dz * L);
    }
  }
  // カメラが追う所(飛んでいる間はボール)
  function focus() { if (!S || S.phase !== 'fly') return null; return { x: S.pos.x, z: S.pos.z }; }
  return { get active() { return !!S; }, get busy() { return !!S; }, start, update, focus, quit: () => S && end(true) };
}
