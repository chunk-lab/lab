// 3Dボウリング。ボールを左右にドラッグして位置を決め、上へフリックで投げる(速さ=フリックの速さ、曲がり=最後の横の動き)。
//   交代で投げる(2人のときは1台を手わたし)。フレーム数は設定で
import * as THREE from 'three';
import { loop, txt, COL, INK, clamp } from '../kit.js';

const LW = 1.05, LL = 18, BR = 0.11, PR = 0.06, PH = 0.38;   // レーンの幅・長さ、ボールと ピンの半径、ピンの高さ
const PINS = (() => { const p = [], d = 0.305; for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) p.push([(i - r / 2) * d, LL - 1.0 + r * d * 0.866]); return p; })();

export default {
  id: 'bowling', title: 'ボウリング', icon: '🎳', desc: '3Dでストライクをねらえ', pass: 1,
  rule: 'ボールを左右にドラッグして立つ位置を決め、上へフリックして投げる。速くフリックすると速いボール、はなす直前に横へ動かすとカーブ。交代で投げて、合計点が高い方の勝ち。',
  options: [{ key: 'fr', label: '何フレーム', choices: [[3, '3'], [5, '5'], [10, '10(本番)']], def: 5 }],
  start(host) {
    const box = host.box, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2;
    const FR = host.opts.trial ? 2 : host.opts.fr || 5;
    // ---- 3D ----
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.shadowMap.enabled = true;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block'; box.appendChild(renderer.domElement);
    const ov = document.createElement('canvas'); ov.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; box.appendChild(ov); const g = ov.getContext('2d');
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x2a2340); scene.fog = new THREE.Fog(0x2a2340, 18, 40);
    const cam = new THREE.PerspectiveCamera(50, 1, 0.05, 80);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x554466, 1.6)); const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(2, 8, 4); sun.castShadow = true; scene.add(sun);
    const spot = new THREE.PointLight(0xfff0d0, 6, 8); spot.position.set(0, 2.2, LL - 0.6); scene.add(spot);
    const wood = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 512; const x = c.getContext('2d'); for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#e8c38f' : '#dcb47e'; x.fillRect(i * 4, 0, 4, 512); } x.fillStyle = '#c0392b'; for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(8 + k * 8, 180); x.lineTo(4 + k * 8, 196); x.lineTo(12 + k * 8, 196); x.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const lane = new THREE.Mesh(new THREE.BoxGeometry(LW, 0.06, LL + 1), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.35 })); lane.position.set(0, -0.03, LL / 2 - 0.5); lane.receiveShadow = true; scene.add(lane);
    [-1, 1].forEach(s => { const gt = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, LL + 1, 12, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x8c8aa0, side: THREE.DoubleSide })); gt.rotation.x = Math.PI / 2; gt.rotation.z = Math.PI; gt.position.set(s * (LW / 2 + 0.12), 0, LL / 2 - 0.5); scene.add(gt); });
    const back = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 0.2), new THREE.MeshStandardMaterial({ color: 0x1a1530 })); back.position.set(0, 1, LL + 0.6); scene.add(back);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 30), new THREE.MeshStandardMaterial({ color: 0x3b3158 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.08, LL / 2); scene.add(floor);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(BR, 24, 16), new THREE.MeshStandardMaterial({ color: 0xff7aa2, roughness: 0.2, metalness: 0.1 })); ball.castShadow = true; scene.add(ball);
    const pinGeo = new THREE.LatheGeometry([[0, 0], [0.05, 0], [0.06, 0.08], [0.058, 0.17], [0.03, 0.25], [0.028, 0.28], [0.036, 0.33], [0.03, 0.37], [0, 0.38]].map(([x, y]) => new THREE.Vector2(x, y)), 16);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }), band = new THREE.MeshStandardMaterial({ color: 0xff5a5a });
    const pins = PINS.map(([x, z]) => { const m = new THREE.Group(), b = new THREE.Mesh(pinGeo, pinMat); b.castShadow = true; m.add(b); const r = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.006, 6, 16), band); r.rotation.x = Math.PI / 2; r.position.y = 0.27; m.add(r); scene.add(m); return { m, x0: x, z0: z, x, z, vx: 0, vz: 0, tilt: 0, td: 0, down: false, gone: false }; });
    function resize() { const W = box.clientWidth || 300, H = box.clientHeight || 300; renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); ov.width = W * 2; ov.height = H * 2; }
    resize(); const ro = new ResizeObserver(resize); ro.observe(box);
    // ---- 試合 ----
    const S = [0, 1].map(() => ({ rolls: [] }));
    let turn = 0, frame = 0, rollInFrame = 0, phase = 'aim', bx = 0, B = null, t = 0, msg = '', msgT = 0, over = false, cpuT = 0;
    function standPins(all) { pins.forEach(p => { if (all || !p.gone) { if (all) { p.gone = false; } p.x = p.x0; p.z = p.z0; p.vx = p.vz = 0; p.tilt = 0; p.down = false; p.m.visible = !p.gone; } }); }
    function frameDone() { const r = S[turn].rolls, fr = framesOf(r); return fr; }
    // 点数(ふつうのボウリングの計算)
    function framesOf(rolls) { const out = []; let i = 0; for (let f = 0; f < 10 && i < rolls.length; f++) { const a = rolls[i], b = rolls[i + 1], c = rolls[i + 2]; if (a === 10) { out.push({ r: ['X'], s: b != null && c != null ? 10 + b + c : null }); i += 1; } else if (b != null && a + b === 10) { out.push({ r: [a, '/'], s: c != null ? 10 + c : null }); i += 2; } else { out.push({ r: b != null ? [a, b] : [a], s: b != null ? a + b : null }); i += 2; } } return out; }
    function total(rolls, final) { const fr = framesOf(rolls).slice(0, FR); let s = 0; for (let k = 0; k < fr.length; k++) { const f = fr[k]; if (f.s != null) s += f.s; else if (final) s += f.r.filter(x => typeof x === 'number').reduce((a, b) => a + b, 0) + (f.r[0] === 'X' ? 10 : 0) + (f.r[1] === '/' ? 10 - (f.r[0] || 0) : 0); } return s; }
    const isLast = () => frame === FR - 1;
    function throwBall(x, speed, angle, spin) { B = { x, z: 0, vx: Math.sin(angle) * speed, vz: Math.cos(angle) * speed, spin, gutter: false }; phase = 'roll'; t = 0; sfx.play('throw'); }
    function settle() {
      const knocked = pins.filter(p => !p.gone && p.down).length;
      pins.forEach(p => { if (p.down) p.gone = true; });
      S[turn].rolls.push(knocked);
      const left = pins.filter(p => !p.gone).length;
      let next = false;
      if (rollInFrame === 0 && knocked === 10) { msg = 'ストライク!!'; sfx.play('win'); next = !isLast(); }
      else if (rollInFrame === 1 && left === 0) { msg = 'スペア!'; sfx.play('point'); next = !isLast(); }
      else { msg = knocked ? `${knocked}本` : 'ガター…'; sfx.play(knocked ? 'ok' : 'ng'); next = rollInFrame === 1 && !isLast(); }
      msgT = 1.6;
      if (isLast()) {   // 最終フレーム:ストライクかスペアなら3投目
        const r = framesOf(S[turn].rolls)[frame]; const rollsHere = S[turn].rolls.length - sumRollsBefore(turn, frame);
        const bonus = r && (r.r[0] === 'X' || r.r[1] === '/');
        if (rollsHere >= 3 || (rollsHere >= 2 && !bonus)) next = true;
        else if (left === 0) { standPins(true); rollInFrame++; phase = 'aim'; B = null; return; }
      }
      if (next) { rollInFrame = 0; standPins(true); if (turn === 1) frame++; turn = 1 - turn; if (frame >= FR) return finish(); }
      else { rollInFrame++; standPins(false); }
      phase = 'aim'; B = null; bx = 0; cpuT = 1.2;
    }
    function sumRollsBefore(s, f) { let i = 0; const r = S[s].rolls; for (let k = 0; k < f; k++) { if (r[i] === 10) i += 1; else i += 2; } return i; }
    function finish() { over = true; phase = 'end'; const a = total(S[0].rolls, true), b = total(S[1].rolls, true); setTimeout(() => host.end({ winner: a > b ? 0 : b > a ? 1 : -1, score: [a, b] }), 1800); }
    // ---- 操作 ----
    let drag = null;
    const cv = renderer.domElement;
    const myTurn = () => phase === 'aim' && !over && (two || turn === 0);
    cv.addEventListener('pointerdown', e => { if (!myTurn()) return; drag = { x0: e.clientX, y0: e.clientY, bx0: bx, pts: [[e.clientX, e.clientY, performance.now()]] }; try { cv.setPointerCapture(e.pointerId); } catch (_) { } });
    cv.addEventListener('pointermove', e => {
      if (!drag) return; drag.pts.push([e.clientX, e.clientY, performance.now()]); if (drag.pts.length > 12) drag.pts.shift();
      const dy = e.clientY - drag.y0; if (Math.abs(dy) < 18) bx = clamp(drag.bx0 + (e.clientX - drag.x0) * 0.004, -LW / 2 + BR, LW / 2 - BR);   // 横:立つ位置
    });
    const upH = e => {
      if (!drag) return; const d = drag; drag = null; const P = d.pts, a = P[0], z = P[P.length - 1], dt = Math.max(16, z[2] - a[2]), dy = a[1] - z[1];
      if (dy < 40) return;   // 上へのフリックで投げる
      const sp = clamp(dy / dt * 9, 3, 11), ang = clamp(Math.atan2(z[0] - a[0], dy) * 0.35, -0.1, 0.1), q = P[Math.max(0, P.length - 3)], spin = clamp((z[0] - q[0]) / 40, -1, 1);
      throwBall(bx, sp, ang, spin);
    };
    cv.addEventListener('pointerup', upH); cv.addEventListener('pointercancel', () => (drag = null));
    function cpuThrow() {
      const err = [0, 0.05, 0.03, 0.016][lv], spin = (Math.random() - 0.5) * 0.6 + (rollInFrame ? 0 : 0.35);
      const left = pins.filter(p => !p.gone), tx = left.length ? left.reduce((s, p) => s + p.x, 0) / left.length : 0;
      bx = clamp(tx * 0.6 - spin * 0.12 + (Math.random() - 0.5) * err * 4, -0.4, 0.4); throwBall(bx, 7 + Math.random() * 2.5, clamp((tx - bx) / LL + (Math.random() - 0.5) * err, -0.1, 0.1), spin);
    }
    // ---- 物理(上から見た2D) ----
    function step(dt) {
      if (!B) return;
      const n = 6, h = dt / n;
      for (let k = 0; k < n; k++) {
        if (!B.gutter) { B.vx += B.spin * 0.9 * h * Math.min(1, B.z / 8); }
        B.x += B.vx * h; B.z += B.vz * h;
        if (!B.gutter && Math.abs(B.x) > LW / 2 - BR * 0.4) { B.gutter = true; B.x = Math.sign(B.x) * (LW / 2 + 0.1); B.vx = 0; sfx.play('wall'); }
        if (!B.gutter) for (const p of pins) { if (p.gone) continue; const dx = p.x - B.x, dz = p.z - B.z, d = Math.hypot(dx, dz); if (d < BR + PR && d > 0) { const nx = dx / d, nz = dz / d, rv = (B.vx - p.vx) * nx + (B.vz - p.vz) * nz; if (rv > 0) { p.vx += nx * rv * 1.7; p.vz += nz * rv * 1.7; B.vx -= nx * rv * 0.25; B.vz -= nz * rv * 0.25; if (!p.down) { p.down = true; p.td = Math.atan2(nx, nz); sfx.play('hit', 0.6); } } } }
        for (const p of pins) { if (p.gone || (!p.down && !p.vx && !p.vz)) continue; p.x += p.vx * h; p.z += p.vz * h; p.vx *= 0.995; p.vz *= 0.995;
          for (const o of pins) { if (o === p || o.gone) continue; const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz), m = PR * 2 + (p.down ? 0.12 : 0); if (d < m && d > 0) { const nx = dx / d, nz = dz / d, rv = (p.vx - o.vx) * nx + (p.vz - o.vz) * nz; if (rv > 0.05) { o.vx += nx * rv * 0.9; o.vz += nz * rv * 0.9; p.vx -= nx * rv * 0.5; p.vz -= nz * rv * 0.5; if (!o.down) { o.down = true; o.td = Math.atan2(nx, nz); sfx.play('hit', 0.3); } } } }
          if (Math.abs(p.x) > LW / 2 + 0.1 || p.z > LL + 0.4) p.down = true; }
      }
    }
    box.__dbg = () => ({ B, phase, bx, pins: pins.map(p => [+p.x.toFixed(2), +p.z.toFixed(2), p.down, p.gone]), rolls: S.map(x => x.rolls) });   // テスト用
    // ---- 描く ----
    const stop = loop(dt => {
      t += dt; msgT = Math.max(0, msgT - dt);
      if (phase === 'aim' && !two && turn === 1 && !over) { cpuT -= dt; if (cpuT <= 0) cpuThrow(); }
      if (phase === 'roll') { step(dt); if ((B.z > LL + 0.6 || B.vz < 0.2) ) { phase = 'wait'; t = 0; } }
      if (phase === 'wait') { step(dt); if (t > 1.6) settle(); }
      pins.forEach(p => { if (p.down && p.tilt < Math.PI / 2) p.tilt = Math.min(Math.PI / 2, p.tilt + dt * 7); p.m.visible = !p.gone || phase === 'wait'; p.m.position.set(p.x, 0, p.z); p.m.rotation.set(0, 0, 0); p.m.rotateOnWorldAxis(new THREE.Vector3(Math.cos(p.td), 0, -Math.sin(p.td)), p.tilt); });
      if (B) { ball.position.set(B.x, BR, B.z); ball.rotation.x += B.vz * dt / BR; } else ball.position.set(bx, BR, 0);
      // カメラ:投げる前は手前から、ころがっている間は追いかける
      const fz = B ? Math.min(B.z, LL - 4) : 0; cam.position.set(B ? B.x * 0.3 : bx * 0.5, B ? 1.0 : 0.9, fz - 2.2); cam.lookAt(0, 0.1, fz + 6);
      renderer.render(scene, cam); hud();
    });
    function hud() {
      const W = ov.width / 2, H = ov.height / 2; g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, W, H);
      // スコア表
      [0, 1].forEach(s => {
        const y = 10 + s * 40, fr = framesOf(S[s].rolls), cw = Math.min(30, (W - 110) / FR);
        g.fillStyle = turn === s && !over ? 'rgba(255,240,200,0.95)' : 'rgba(255,255,255,0.88)'; g.beginPath(); g.roundRect ? g.roundRect(6, y, W - 12, 34, 8) : g.rect(6, y, W - 12, 34); g.fill();
        txt(g, host.players[s].name, 12, y + 17, { size: 11, align: 'left', color: s ? COL.p2d : COL.p1d, maxW: 52 });
        for (let k = 0; k < FR; k++) { const f = fr[k], x = 68 + k * cw; g.strokeStyle = '#d8cfe6'; g.strokeRect(x, y + 3, cw - 2, 28); if (f) { txt(g, f.r.join(' '), x + cw / 2 - 1, y + 11, { size: 9 }); let ss = 0; for (let j = 0; j <= k; j++) ss += fr[j].s ?? 0; if (f.s != null) txt(g, String(ss), x + cw / 2 - 1, y + 24, { size: 10, color: INK }); } }
        txt(g, String(total(S[s].rolls, true)), W - 14, y + 17, { size: 15, align: 'right', color: s ? COL.p2d : COL.p1d });
      });
      if (msgT > 0) txt(g, msg, W / 2, H * 0.42, { size: 34, color: '#ffd36b', stroke: '#5a4a6b', sw: 6 });
      if (phase === 'aim' && !over) txt(g, (two || turn === 0) ? `${host.players[turn].name}の番  ←→で位置 / 上へフリックで投げる` : `${host.players[1].name}の番…`, W / 2, H - 30, { size: 13, color: '#fff', stroke: '#2a2340', sw: 4 });
      txt(g, `フレーム ${Math.min(FR, frame + 1)} / ${FR}`, W - 14, 96, { size: 11, align: 'right', color: '#e8e0ff' });
    }
    return { stop() { stop(); ro.disconnect(); renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove(); ov.remove(); } };
  },
};
