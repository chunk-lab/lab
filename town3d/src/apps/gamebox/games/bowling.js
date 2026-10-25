// 3Dボウリング(本格版)。
//   投げる前:ボールを左右にドラッグ=立つ位置(ドット)/ ◀▶=ねらう向き(スパットの矢印)
//   🎳を下へ引く=助走スタート(引くほど強い)。針が左右にゆれる → はなした時の針で回転(まん中なら まっすぐ)。ファウルラインの近くで はなすほど力が伝わる
//   ボールは手前でオイルにすべり、奥で回転が効いて曲がる。ピンは重さと はね返りで倒れ、横の壁(キックバック)でも はね返る
import * as THREE from 'three';
import { loop, txt, COL, INK, clamp } from '../kit.js';

const LW = 1.066, HEAD = 18.29, BR = 0.108, MB = 7, PR = 0.06, MP = 1.5, KICK = LW / 2 + 0.24, PIT = 19.4;
const PINS = (() => { const p = [], d = 0.3048; for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) p.push([(i - r / 2) * d, HEAD + r * d * 0.866]); return p; })();

export default {
  id: 'bowling', title: 'ボウリング', icon: '🎳', desc: '本格3Dボウリング', pass: 1,
  rule: 'ボールを左右にドラッグして立つ位置、◀▶でねらう向き。🎳を下へ引くと助走が始まり、引くほど強い。はなした時の針の位置で回転が決まる(まん中ならまっすぐ、左右によるほど大きく曲がる)。ファウルラインの近くで はなすほど力が伝わる。',
  options: [{ key: 'fr', label: '何フレーム', choices: [[3, '3'], [5, '5'], [10, '10(本番)']], def: 5 }],
  start(host) {
    const box = host.box, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2;
    const FR = host.opts.trial ? 2 : host.opts.fr || 5;
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.shadowMap.enabled = true;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block'; box.appendChild(renderer.domElement);
    const ov = document.createElement('canvas'); ov.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; box.appendChild(ov); const g = ov.getContext('2d');
    const ui = document.createElement('div'); ui.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-family:inherit'; box.appendChild(ui);
    ui.innerHTML = `<style>.bw b{pointer-events:auto;position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;user-select:none;-webkit-user-select:none;touch-action:none;box-shadow:0 4px 0 #0003}
      .bw .l,.bw .r{width:54px;height:54px;bottom:96px;background:#fff;color:#5a4a6b;font-size:20px}.bw .l{left:14px}.bw .r{left:76px}
      .bw .go{right:16px;bottom:84px;width:96px;height:96px;background:radial-gradient(circle at 35% 30%,#fff,#ffe1ea);font-size:34px;flex-direction:column}.bw .go small{font-size:11px;color:#5a4a6b}
      .bw .tim{position:absolute;right:12px;bottom:196px;width:150px;height:16px;border-radius:8px;background:linear-gradient(90deg,#9fc8ff,#fff 42%,#8fe0b0 44%,#8fe0b0 56%,#fff 58%,#ffb3c1);box-shadow:0 2px 6px #0003}
      .bw .tim i{position:absolute;top:-4px;width:4px;height:24px;border-radius:2px;background:#5a4a6b;left:50%}.bw [hidden]{display:none!important}</style>
      <div class="bw"><b class="l">◀</b><b class="r">▶</b><div class="tim" hidden><i></i></div><b class="go">🎳<small>下へ引く</small></b></div>`;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x231d38); scene.fog = new THREE.Fog(0x231d38, 22, 45);
    const cam = new THREE.PerspectiveCamera(48, 1, 0.05, 80);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x554466, 1.5)); const sun = new THREE.DirectionalLight(0xffffff, 1.3); sun.position.set(2, 9, 6); sun.castShadow = true; sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -6; sun.shadow.camera.left = -3; sun.shadow.camera.right = 3; sun.shadow.mapSize.set(1024, 2048); scene.add(sun); sun.target.position.set(0, 0, 10); scene.add(sun.target);
    const spot = new THREE.PointLight(0xfff0d0, 8, 9); spot.position.set(0, 2.4, HEAD + 0.5); scene.add(spot);
    // レーン(板目・スパットの矢印・ドット)
    const wood = (() => { const c = document.createElement('canvas'); c.width = 156; c.height = 1024; const x = c.getContext('2d'); for (let i = 0; i < 39; i++) { x.fillStyle = ['#e8c38f', '#dfb782', '#e3be89'][i % 3]; x.fillRect(i * 4, 0, 4, 1024); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 6); return t; })();
    const laneM = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.18, metalness: 0.05 });
    const lane = new THREE.Mesh(new THREE.BoxGeometry(LW, 0.06, PIT + 0.2), laneM); lane.position.set(0, -0.03, (PIT + 0.2) / 2); lane.receiveShadow = true; scene.add(lane);
    const appr = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 4.6), new THREE.MeshStandardMaterial({ color: 0xd9b07a, roughness: 0.5 })); appr.position.set(0, -0.031, -2.3); appr.receiveShadow = true; scene.add(appr);
    const foul = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.03), new THREE.MeshBasicMaterial({ color: 0x222222 })); foul.rotation.x = -Math.PI / 2; foul.position.set(0, 0.002, 0); scene.add(foul);
    const markM = new THREE.MeshBasicMaterial({ color: 0x7a3b2a });
    for (let i = -3; i <= 3; i++) { const tri = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.2, 3), markM); tri.rotation.x = Math.PI / 2; tri.position.set(i * 0.137, 0.003, 4.6 + Math.abs(i) * 0.12); tri.scale.y = 0.3; scene.add(tri); }
    for (let i = -5; i <= 5; i++) { const dot = new THREE.Mesh(new THREE.CircleGeometry(0.018, 10), markM); dot.rotation.x = -Math.PI / 2; dot.position.set(i * 0.1, 0.003, -3.6); scene.add(dot); }
    [-1, 1].forEach(s => { const gt = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, PIT, 14, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x8c8aa0, side: THREE.DoubleSide, metalness: 0.4 })); gt.rotation.x = Math.PI / 2; gt.rotation.z = Math.PI; gt.position.set(s * (LW / 2 + 0.12), 0, PIT / 2); scene.add(gt);
      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 2.2), new THREE.MeshStandardMaterial({ color: 0x3a3358 })); kb.position.set(s * KICK, 0.3, HEAD + 0.6); scene.add(kb); });
    const back = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x15112a })); back.position.set(0, 1, PIT + 0.4); scene.add(back);
    const mask = new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 0.1), new THREE.MeshStandardMaterial({ color: 0xff7aa2 })); mask.position.set(0, 1.5, HEAD - 0.5); scene.add(mask);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 40), new THREE.MeshStandardMaterial({ color: 0x3b3158 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.07, 12); scene.add(floor);
    const ballM = new THREE.Mesh(new THREE.SphereGeometry(BR, 28, 18), new THREE.MeshStandardMaterial({ color: 0xff7aa2, roughness: 0.15, metalness: 0.15 })); ballM.castShadow = true; scene.add(ballM);
    [[0.03, 0.06], [-0.03, 0.06], [0, 0.02]].forEach(([a, b]) => { const h = new THREE.Mesh(new THREE.CircleGeometry(0.012, 10), new THREE.MeshBasicMaterial({ color: 0x331122 })); h.position.set(a, b + 0.04, BR * 0.97); h.lookAt(a * 3, (b + 0.04) * 3, BR * 3); ballM.add(h); });
    const pinGeo = new THREE.LatheGeometry([[0, 0], [0.026, 0], [0.04, 0.03], [0.06, 0.11], [0.057, 0.17], [0.032, 0.25], [0.028, 0.27], [0.034, 0.32], [0.03, 0.37], [0, 0.381]].map(([x, y]) => new THREE.Vector2(x, y)), 18);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 }), band = new THREE.MeshStandardMaterial({ color: 0xe23b3b });
    const pins = PINS.map(([x, z]) => { const m = new THREE.Group(), b = new THREE.Mesh(pinGeo, pinMat); b.castShadow = true; m.add(b); [0.255, 0.285].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.029, 0.004, 6, 16), band); r.rotation.x = Math.PI / 2; r.position.y = y; m.add(r); }); scene.add(m); return { m, x0: x, z0: z, x, z, vx: 0, vz: 0, tilt: 0, td: 0, fall: false, gone: false, wob: 0, spin: 0 }; });
    function resize() { const W = box.clientWidth || 300, H = box.clientHeight || 300; renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); ov.width = W * 2; ov.height = H * 2; }
    resize(); const ro = new ResizeObserver(resize); ro.observe(box);
    // ---- 試合 ----
    const S = [0, 1].map(() => ({ rolls: [] }));
    let turn = 0, frame = 0, rollInFrame = 0, phase = 'aim', sx = 0, aimA = 0, B = null, t = 0, msg = '', msgT = 0, over = false, cpuT = 0;
    let run = null;   // 助走 {t, power, needle}
    function standPins(all) { pins.forEach(p => { if (all) p.gone = false; if (!p.gone) { p.x = p.x0; p.z = p.z0; p.vx = p.vz = 0; p.tilt = 0; p.fall = false; p.wob = 0; } p.m.visible = !p.gone; }); }
    function framesOf(rolls) { const out = []; let i = 0; for (let f = 0; f < 10 && i < rolls.length; f++) { const a = rolls[i], b = rolls[i + 1], c = rolls[i + 2]; if (a === 10) { out.push({ r: ['X'], s: b != null && c != null ? 10 + b + c : null }); i += 1; } else if (b != null && a + b === 10) { out.push({ r: [a, '/'], s: c != null ? 10 + c : null }); i += 2; } else { out.push({ r: b != null ? [a, b] : [a], s: b != null ? a + b : null }); i += 2; } } return out; }
    function total(rolls) { const fr = framesOf(rolls).slice(0, FR); let s = 0; for (const f of fr) { if (f.s != null) s += f.s; else s += f.r.filter(x => typeof x === 'number').reduce((a, b) => a + b, 0) + (f.r[0] === 'X' ? 10 : 0) + (f.r[1] === '/' ? 10 - (f.r[0] || 0) : 0); } return s; }
    const isLast = () => frame === FR - 1;
    function sumRollsBefore(s, f) { let i = 0; const r = S[s].rolls; for (let k = 0; k < f; k++) { if (r[i] === 10) i += 1; else i += 2; } return i; }
    const knockedNow = () => pins.filter(p => !p.gone && (p.fall || Math.abs(p.x) > LW / 2 + 0.03 || p.z > PIT - 0.1)).length;
    function settle() {
      const knocked = knockedNow();
      pins.forEach(p => { if (!p.gone && (p.fall || Math.abs(p.x) > LW / 2 + 0.03 || p.z > PIT - 0.1)) p.gone = true; });
      S[turn].rolls.push(knocked);
      const left = pins.filter(p => !p.gone).length;
      let next = false;
      if (rollInFrame === 0 && knocked === 10) { msg = 'ストライク!!'; sfx.play('win'); next = !isLast(); }
      else if (rollInFrame === 1 && left === 0) { msg = 'スペア!'; sfx.play('point'); next = !isLast(); }
      else { msg = knocked ? `${knocked}本` : B && B.gutter ? 'ガター…' : 'ミス…'; sfx.play(knocked ? 'ok' : 'ng'); next = rollInFrame === 1 && !isLast(); }
      msgT = 1.6;
      if (isLast()) {
        const r = framesOf(S[turn].rolls)[frame], rollsHere = S[turn].rolls.length - sumRollsBefore(turn, frame), bonus = r && (r.r[0] === 'X' || r.r[1] === '/');
        if (rollsHere >= 3 || (rollsHere >= 2 && !bonus)) next = true;
        else if (left === 0) { standPins(true); rollInFrame++; phase = 'aim'; B = null; return; }
      }
      if (next) { rollInFrame = 0; standPins(true); if (turn === 1) frame++; turn = 1 - turn; if (frame >= FR) return finish(); }
      else { rollInFrame++; standPins(false); }
      phase = 'aim'; B = null; cpuT = 1.4;
    }
    function finish() { over = true; phase = 'end'; const a = total(S[0].rolls), b = total(S[1].rolls); setTimeout(() => host.end({ winner: a > b ? 0 : b > a ? 1 : -1, score: [a, b] }), 1800); }
    // ---- 操作 ----
    const mine = () => !over && (two || turn === 0);
    const cv = renderer.domElement; let drag = null;
    cv.addEventListener('pointerdown', e => { if (phase !== 'aim' || !mine()) return; drag = { x0: e.clientX, s0: sx }; });
    cv.addEventListener('pointermove', e => { if (!drag) return; sx = clamp(drag.s0 - (e.clientX - drag.x0) * 0.004, -LW / 2 + BR, LW / 2 - BR); });   // 画面の右 = 世界の -x
    cv.addEventListener('pointerup', () => (drag = null));
    let held = 0; const L = ui.querySelector('.l'), R = ui.querySelector('.r'), GO = ui.querySelector('.go'), TIM = ui.querySelector('.tim');
    [[L, 1], [R, -1]].forEach(([el, d]) => { el.addEventListener('pointerdown', e => { e.preventDefault(); held = d; }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(k => el.addEventListener(k, () => (held = 0))); });
    let y0 = 0;
    GO.addEventListener('pointerdown', e => { e.preventDefault(); if (phase !== 'aim' || !mine()) return; y0 = e.clientY; run = { t: 0, power: 0, needle: 0, started: false }; try { GO.setPointerCapture(e.pointerId); } catch (_) { } });
    GO.addEventListener('pointermove', e => { if (!run) return; run.power = clamp((e.clientY - y0) / 150, 0, 1); if (run.power > 0.1 && !run.started) { run.started = true; phase = 'run'; sfx.play('whoosh'); } });
    const rel = () => { if (!run) return; if (!run.started) { run = null; return; } release(); };
    GO.addEventListener('pointerup', rel); GO.addEventListener('pointercancel', rel);
    function release() {
      const r = run; run = null; const k = 0.55 + 0.45 * Math.min(1, r.t / 1.25);   // ラインの近くで はなすほど力が伝わる
      const spin = Math.abs(r.needle) < 0.14 ? 0 : r.needle;
      throwBall(sx, (5.5 + r.power * 4.2) * k, aimA, spin);
    }
    function throwBall(x, speed, ang, spin) { B = { x, z: 0, vx: Math.sin(ang) * speed, vz: Math.cos(ang) * speed, spin, gutter: false, rot: 0 }; phase = 'roll'; t = 0; sfx.play('throw'); }
    function cpuThrow() {
      const err = [0, 0.06, 0.035, 0.018][lv], spin = rollInFrame === 0 ? 0.55 + (Math.random() - 0.5) * 0.3 : (Math.random() - 0.5) * 0.3;
      const left = pins.filter(p => !p.gone), tx = left.length ? left.reduce((s, p) => s + p.x, 0) / left.length : 0;
      const x0 = clamp(tx * 0.5 - spin * 0.28 + (Math.random() - 0.5) * err * 3, -0.4, 0.4); sx = x0;
      const needDx = tx + (spin ? spin * 0.32 : 0) * -1 - x0 + 0.06 * (rollInFrame === 0 ? 1 : 0);
      throwBall(x0, 7.5 + Math.random() * 1.4, Math.atan2(needDx, HEAD) + (Math.random() - 0.5) * err * 0.4, spin);
    }
    // ---- 物理(上から見た2D。重さ・はね返り・すべり→曲がり) ----
    function bump(a, ma, b, mb, rr, e) {   // 円どうし
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz); if (d >= rr || d < 1e-6) return 0;
      const nx = dx / d, nz = dz / d, ov = rr - d, wa = mb / (ma + mb), wb = ma / (ma + mb);
      a.x -= nx * ov * wa; a.z -= nz * ov * wa; b.x += nx * ov * wb; b.z += nz * ov * wb;
      const vr = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz; if (vr <= 0) return 0;
      const j = (1 + e) * vr / (1 / ma + 1 / mb); a.vx -= j / ma * nx; a.vz -= j / ma * nz; b.vx += j / mb * nx; b.vz += j / mb * nz; return j;
    }
    const pr = p => p.fall ? 0.085 : PR;
    function hitPin(p, j, ox, oz) { if (j / MP > 0.45 && !p.fall) { p.fall = true; p.td = Math.atan2(p.vx || ox, p.vz || oz); sfx.play('hit', Math.min(1, j / 6)); } else if (!p.fall) p.wob = Math.min(0.25, p.wob + j * 0.05); }
    function step(dt) {
      const n = 8, h = dt / n;
      for (let k = 0; k < n; k++) {
        if (B) {
          if (!B.gutter) { const hook = B.z > 10.5 ? 1 : B.z > 8 ? (B.z - 8) / 2.5 : 0; B.vx += B.spin * 0.62 * hook * h; }   // 手前はオイルですべる、奥で曲がる
          B.vx *= Math.exp(-0.02 * h); B.vz *= Math.exp(-0.035 * h);
          B.x += B.vx * h; B.z += B.vz * h; B.rot += Math.hypot(B.vx, B.vz) * h / BR;
          if (!B.gutter && Math.abs(B.x) > LW / 2 - BR * 0.25 && B.z < HEAD - 0.4) { B.gutter = true; B.x = Math.sign(B.x) * (LW / 2 + 0.12); B.vx = 0; sfx.play('wall'); }
          if (B.gutter && B.z > HEAD) B.x = Math.sign(B.x) * Math.min(KICK - BR, Math.abs(B.x));
          if (!B.gutter || B.z > HEAD - 0.2) for (const p of pins) if (!p.gone) { const ox = B.vx, oz = B.vz, j = bump(B, MB, p, MP, BR + pr(p), 0.72); if (j) hitPin(p, j, ox, oz); }
          if (!B.gutter && Math.abs(B.x) > KICK - BR) { B.x = Math.sign(B.x) * (KICK - BR); B.vx *= -0.4; }
        }
        for (const p of pins) {
          if (p.gone) continue;
          const sp = Math.hypot(p.vx, p.vz); if (sp > 0) { const dec = (p.fall ? 2.6 : 3.4) * h; const k2 = Math.max(0, sp - dec) / sp; p.vx *= k2; p.vz *= k2; }
          p.x += p.vx * h; p.z += p.vz * h;
          if (Math.abs(p.x) > KICK - 0.05 && p.z > HEAD - 0.8) { p.x = Math.sign(p.x) * (KICK - 0.05); p.vx = -p.vx * 0.5; p.fall = true; }   // キックバックで はね返る
          for (const o of pins) { if (o === p || o.gone) continue; const j = bump(p, MP, o, MP, pr(p) + pr(o), 0.55); if (j) { hitPin(o, j, p.vx, p.vz); if (j / MP > 0.6) hitPin(p, j, -p.vx, -p.vz); } }
          if (Math.abs(p.x) > LW / 2 + 0.03 && Math.abs(p.x) < KICK - 0.05) p.fall = true;
        }
      }
    }
    // ---- 毎フレーム ----
    const stop = loop(dt => {
      t += dt; msgT = Math.max(0, msgT - dt);
      if (held && phase === 'aim') aimA = clamp(aimA + held * dt * 0.06, -0.07, 0.07);
      if (phase === 'aim' && !two && turn === 1 && !over) { cpuT -= dt; if (cpuT <= 0) cpuThrow(); }
      if (phase === 'run' && run) { run.t += dt; run.needle = Math.sin(run.t * 3.1); if (run.t >= 1.35) release(); }
      if (phase === 'roll') { step(dt); if (B.z > PIT || (B.vz < 0.25)) { phase = 'wait'; t = 0; } }
      if (phase === 'wait') { step(dt); const moving = pins.some(p => !p.gone && Math.hypot(p.vx, p.vz) > 0.05); if ((t > 1.2 && !moving) || t > 4) settle(); }
      TIM.hidden = phase !== 'run'; if (phase === 'run' && run) TIM.firstChild.style.left = `calc(${50 + run.needle * 48}% - 2px)`;
      GO.style.opacity = L.style.opacity = R.style.opacity = phase === 'aim' && mine() ? 1 : 0.35;
      pins.forEach(p => { if (p.fall && p.tilt < Math.PI / 2) p.tilt = Math.min(Math.PI / 2, p.tilt + dt * 6); p.wob = Math.max(0, p.wob - dt * 0.5); p.m.visible = !p.gone || phase === 'wait' || phase === 'roll';
        const tl = p.fall ? p.tilt : Math.sin(t * 18) * p.wob; p.m.position.set(p.x, p.fall ? Math.sin(p.tilt) * 0.06 : 0, p.z); p.m.rotation.set(0, 0, 0); p.m.rotateOnWorldAxis(new THREE.Vector3(Math.cos(p.td), 0, -Math.sin(p.td)), tl); });
      // ボール・カメラ
      let bz = -0.3, bxx = sx;
      if (phase === 'run' && run) { const k = Math.min(1, run.t / 1.25); bz = -3.6 + k * 3.3; }
      else if (phase === 'aim') bz = -3.6;
      if (B) { ballM.position.set(B.x, BR, B.z); ballM.rotation.set(B.rot, B.spin * 0.6, 0); } else ballM.position.set(bxx, BR + (phase === 'run' ? 0.25 * Math.sin(Math.min(1, run ? run.t / 1.25 : 0) * Math.PI) : 0.6), bz);
      const fz = B ? Math.min(B.z - 2.6, HEAD - 5.2) : bz - 2.2;
      cam.position.set(B ? B.x * 0.25 : sx * 0.6, B ? 1.0 + Math.min(1, B.z / HEAD) * 0.6 : 1.55, fz); cam.lookAt(B ? B.x * 0.2 : 0, 0.1, fz + 9);
      renderer.render(scene, cam); hud();
    });
    function hud() {
      const W = ov.width / 2, H = ov.height / 2; g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, W, H);
      [0, 1].forEach(s => {
        const y = 8 + s * 38, fr = framesOf(S[s].rolls), cw = Math.min(30, (W - 110) / FR);
        g.fillStyle = turn === s && !over ? 'rgba(255,240,200,0.95)' : 'rgba(255,255,255,0.88)'; g.beginPath(); g.roundRect ? g.roundRect(6, y, W - 12, 32, 8) : g.rect(6, y, W - 12, 32); g.fill();
        txt(g, host.players[s].name, 12, y + 16, { size: 11, align: 'left', color: s ? COL.p2d : COL.p1d, maxW: 52 });
        for (let k = 0; k < FR; k++) { const f = fr[k], x = 68 + k * cw; g.strokeStyle = '#d8cfe6'; g.strokeRect(x, y + 3, cw - 2, 26); if (f) { txt(g, f.r.join(' '), x + cw / 2 - 1, y + 10, { size: 9 }); let ss = 0; for (let j = 0; j <= k; j++) ss += fr[j].s ?? 0; if (f.s != null) txt(g, String(ss), x + cw / 2 - 1, y + 22, { size: 10, color: INK }); } }
        txt(g, String(total(S[s].rolls)), W - 14, y + 16, { size: 15, align: 'right', color: s ? COL.p2d : COL.p1d });
      });
      txt(g, `フレーム ${Math.min(FR, frame + 1)}/${FR}  ${rollInFrame + 1}投目`, W - 12, 90, { size: 11, align: 'right', color: '#e8e0ff' });
      if (msgT > 0) txt(g, msg, W / 2, H * 0.4, { size: 34, color: '#ffd36b', stroke: '#5a4a6b', sw: 6 });
      if (phase === 'aim' && !over) txt(g, mine() ? `${host.players[turn].name}の番:ボールを左右に=位置 ◀▶=向き 🎳を下へ引く=助走` : `${host.players[1].name}の番…`, W / 2, H - 30, { size: 11, color: '#fff', stroke: '#231d38', sw: 4, maxW: W - 20 });
      if (phase === 'run') txt(g, 'はなすと投げる!(針がまん中=まっすぐ)', W / 2, H - 30, { size: 12, color: '#ffd36b', stroke: '#231d38', sw: 4 });
      // ねらいの線(スパットまで)
      if (phase === 'aim' && mine()) { const a = new THREE.Vector3(sx, 0.01, -3.6).project(cam), b = new THREE.Vector3(sx + Math.sin(aimA) * 8, 0.01, -3.6 + Math.cos(aimA) * 8).project(cam); g.strokeStyle = 'rgba(255,211,107,0.85)'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo((a.x + 1) / 2 * W, (1 - a.y) / 2 * H); g.lineTo((b.x + 1) / 2 * W, (1 - b.y) / 2 * H); g.stroke(); g.setLineDash([]); }
    }
    return { stop() { stop(); ro.disconnect(); renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove(); ov.remove(); ui.remove(); } };
  },
};
