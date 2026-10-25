// 3Dの雪合戦(町の中で、その場で 2×2 のチーム戦)。いつもの操作(スティックで移動・ドラッグで見まわし)のまま戦う。
//   画面タップ=そこへ投げる(雪玉がなくても小さい玉をすぐ投げられる)
//   ❄️長おし=雪玉を大きく(その間は動けない。はなしても大きさはそのまま。何度でも足せる)
//   ❄️から引っぱる=山なり(放物線が見える。その間も移動できる)。雪だるまをこえて当てられる
//   ⛄=雪だるまの盾(すぐできる・1人1つまで) / 🌀=転がってよける(大きさはそのまま)
//   HP3(小さい玉なら3発たえる)。大きい玉ほど痛い。MAXは着地で8方向に飛び散る
import * as THREE from 'three';

const LV = g => g < 1 ? 1 : g < 2.2 ? 2 : g < 3.6 ? 3 : 4;   // つくった秒 → 大きさ
const RAD = [0, 0.09, 0.14, 0.22, 0.32], DMG = [0, 1, 2, 3, 3], NAMES = ['', 'S', 'M', 'L', 'MAX'];
const G = 9.8, HP = 3, AR = 11;

export function createSnowBattle({ scene, camera, root, me, residents, meshes, collide, audio, snowFx, onEnd, faceCam }) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
  const ballGeo = new THREE.SphereGeometry(1, 14, 10);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  let B = null;   // いまの試合

  // ---- 画面(ボタンとHP) ----
  const css = document.createElement('style');
  css.textContent = `.sb-on .tw-emotes,.sb-on .tw-snowb,.sb-on .tw-action{display:none!important}
.sb-hud{position:absolute;inset:0;pointer-events:none;font-family:inherit;color:#5a4a6b;z-index:6}
.sb-hud button{pointer-events:auto;border:0;font:inherit;font-weight:900;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.sb-top{position:absolute;left:8px;right:8px;top:calc(52px + env(safe-area-inset-top,0px));display:flex;justify-content:space-between;gap:6px}
.sb-team{display:flex;gap:4px;flex-wrap:wrap}.sb-p{background:#fffffff0;border-radius:12px;padding:3px 8px;font-size:11px;font-weight:800;box-shadow:0 2px 6px #0002}
.sb-p.down{opacity:.45;text-decoration:line-through}.sb-p b{letter-spacing:-1px}
.sb-mk{position:absolute;right:16px;bottom:calc(96px + env(safe-area-inset-bottom,0px));width:92px;height:92px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#d6ecff);box-shadow:0 5px 0 #8fb6dc,0 8px 16px #0004;font-size:30px;line-height:1}
.sb-mk small{display:block;font-size:10px;margin-top:2px}
.sb-man,.sb-roll{position:absolute;width:62px;height:62px;border-radius:50%;background:#fff;box-shadow:0 4px 0 #c9bfd8,0 6px 12px #0003;font-size:26px}
.sb-man{right:118px;bottom:calc(150px + env(safe-area-inset-bottom,0px))}.sb-roll{right:118px;bottom:calc(76px + env(safe-area-inset-bottom,0px))}
.sb-man[disabled],.sb-roll[disabled]{opacity:.45}
.sb-quit{position:absolute;left:10px;bottom:calc(20px + env(safe-area-inset-bottom,0px));background:#fffffff0;border-radius:999px;padding:8px 14px;font-size:12px;box-shadow:0 2px 6px #0002}
.sb-msg{position:absolute;left:0;right:0;top:34%;text-align:center;font-size:34px;font-weight:900;color:#fff;text-shadow:0 3px 0 #5a4a6b,0 0 12px #0006;pointer-events:none}
.sb-tip{position:absolute;left:0;right:0;bottom:calc(196px + env(safe-area-inset-bottom,0px));text-align:center;font-size:12px;font-weight:800;color:#fff;text-shadow:0 1px 3px #000a;pointer-events:none}`;
  document.head.appendChild(css);
  function hudEl() {
    const h = document.createElement('div'); h.className = 'sb-hud';
    h.innerHTML = `<div class="sb-top"><div class="sb-team t0"></div><div class="sb-team t1"></div></div><div class="sb-msg"></div><div class="sb-tip">画面タップ=投げる ❄️長おし=大きく ❄️から引っぱる=山なり</div>
      <button class="sb-mk">❄️<small>長おし/引く</small></button><button class="sb-man">⛄</button><button class="sb-roll">🌀</button><button class="sb-quit">✕ やめる</button>`;
    root.appendChild(h); return h;
  }
  // ---- 人 ----
  function fighter(kind, ch, team, name, r, lv) {
    return { kind, ch, team, name, r, lv, x: 0, z: 0, ry: 0, hp: HP, down: false, grow: 0, making: false, rollT: 0, rollCd: 0, rdx: 0, rdz: 0, throwT: 0, cd: 0, man: null, ai: { t: 0.5, mode: 'move', goal: null, want: 0 }, ball: null };
  }
  const handPos = f => { if (!f.ch.rig || f.ch.rig.fake) return new THREE.Vector3(f.x + Math.sin(f.ry) * 0.45, 0.75, f.z + Math.cos(f.ry) * 0.45); f.ch.root.updateMatrixWorld(true); return f.ch.rig.arms[1].localToWorld(v1.set(0, -0.42, 0.06)).clone(); };
  const headTop = (f, r) => { if (!f.ch.rig || f.ch.rig.fake) return new THREE.Vector3(f.x, 1.2 + r, f.z); f.ch.root.updateMatrixWorld(true); return f.ch.rig.head.localToWorld(v1.set(0, 0.3 + r, 0)).clone(); };
  // ---- はじめる ----
  function start(opp, lvOpp = 2) {
    if (B) return;
    const vis = residents.list.filter(r => r !== opp && !r.hidden && r.ch.rig).sort((a, b) => Math.hypot(a.ch.root.position.x - me.x, a.ch.root.position.z - me.z) - Math.hypot(b.ch.root.position.x - me.x, b.ch.root.position.z - me.z));
    const pool = vis.length >= 2 ? vis : residents.list.filter(r => r !== opp && r.ch.rig);
    const ally = pool[0], partner = pool[1];
    const C = new THREE.Vector3((me.x + opp.ch.root.position.x) / 2, 0, (me.z + opp.ch.root.position.z) / 2);
    let ax = opp.ch.root.position.x - me.x, az = opp.ch.root.position.z - me.z; const L = Math.hypot(ax, az) || 1; ax /= L; az /= L;
    B = { C, ax, az, F: [], shots: [], men: [], mounds: [], wins: [0, 0], round: 1, phase: 'count', t: 3, objs: [], hud: hudEl(), pull: null, preview: null };
    B.F = [fighter('me', me.ch, 0, 'あなた', null, 2), fighter('npc', ally.ch, 0, ally.def.name, ally, 2), fighter('npc', opp.ch, 1, opp.def.name, opp, lvOpp), fighter('npc', partner.ch, 1, partner.def.name, partner, Math.max(1, lvOpp - 1))];
    B.F.forEach(f => { if (f.r) { f.r.battle = true; f.r.talking = false; f.r.hidden = false; f.ch.root.visible = true; } });
    // 場所:輪と雪の山(盾)
    const ring = new THREE.Mesh(new THREE.RingGeometry(AR - 0.12, AR + 0.12, 64), new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(C.x, 0.05, C.z); scene.add(ring); B.objs.push(ring);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(AR * 2, 0.12), new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    line.rotation.x = -Math.PI / 2; line.rotation.z = -Math.atan2(az, ax) + Math.PI / 2; line.position.set(C.x, 0.05, C.z); scene.add(line); B.objs.push(line);
    [-1, 1].forEach(s => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.9, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat); m.scale.set(1.3, 0.75, 0.8); m.rotation.y = Math.atan2(ax, az); m.position.set(C.x - az * 3.2 * s, 0, C.z + ax * 3.2 * s); m.castShadow = true; scene.add(m); B.objs.push(m); B.mounds.push({ m, hp: 6, x: m.position.x, z: m.position.z, R: 1.0 }); });
    bindHud(); resetRound(); root.classList.add('sb-on'); audio?.play?.('open');
  }
  function spawn() {
    const { C, ax, az } = B, px = -az, pz = ax;
    B.F.forEach(f => { const i = B.F.filter(o => o.team === f.team).indexOf(f), s = f.team ? 1 : -1, side = i ? 1.8 : -1.8; f.x = C.x + ax * 7 * s + px * side; f.z = C.z + az * 7 * s + pz * side; f.ry = Math.atan2(-ax * s, -az * s); });
  }
  function resetRound() {
    B.F.forEach(f => { f.hp = HP; f.down = false; f.grow = 0; f.making = false; f.rollT = 0; f.ch.pose = null; f.ch.rig && (f.ch.rig.body.rotation.x = 0); removeMan(f); f.ai = { t: 0.8 + Math.random(), mode: 'move', goal: null, want: 0 }; });
    B.shots.forEach(s => scene.remove(s.m)); B.shots = [];
    spawn(); const f0 = B.F[0]; me.x = f0.x; me.z = f0.z; me.ry = f0.ry; faceCam?.(f0.x, f0.z, f0.ry);   // カメラも相手の方へ
    B.phase = 'count'; B.t = 2.6; showMsg(`ラウンド ${B.round}`);
  }
  function showMsg(s) { const el = B?.hud.querySelector('.sb-msg'); if (el) el.textContent = s; }
  function end(quit) {
    const win = !quit && B.wins[0] > B.wins[1];
    B.F.forEach(f => { removeMan(f); f.ch.pose = null; f.ch.rig && (f.ch.rig.body.rotation.x = 0); if (f.ball) { scene.remove(f.ball); f.ball = null; } if (f.r) { f.r.battle = false; f.r.goal = { place: null }; f.r.path = []; f.r.ch.root.position.set(f.x, 0, f.z); } });
    B.shots.forEach(s => scene.remove(s.m)); B.objs.forEach(o => scene.remove(o)); B.hud.remove(); if (B.preview) scene.remove(B.preview.line, B.preview.ring);
    root.classList.remove('sb-on');
    const opp = B.F[2]; B = null; onEnd?.({ win, quit, opp: opp.r });
  }
  // ---- 操作 ----
  function bindHud() {
    const H = B.hud, mk = H.querySelector('.sb-mk'); let d0 = null;
    mk.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); try { mk.setPointerCapture(e.pointerId); } catch (_) { } d0 = { x: e.clientX, y: e.clientY }; const f = B?.F[0]; if (f && canAct(f)) f.making = true; });
    mk.addEventListener('pointermove', e => {
      if (!d0 || !B) return; const f = B.F[0], dx = e.clientX - d0.x, dy = e.clientY - d0.y;
      if (!B.pull && Math.hypot(dx, dy) > 26 && LV(f.grow) >= 2) { f.making = false; B.pull = { dx, dy }; }
      if (B.pull) B.pull = { dx, dy };
    });
    const up = () => { if (!d0 || !B) return; d0 = null; const f = B.F[0]; f.making = false; if (B.pull) { const p = pullTarget(); B.pull = null; if (p && canAct(f)) lob(f, p); } };
    mk.addEventListener('pointerup', up); mk.addEventListener('pointercancel', up); mk.addEventListener('contextmenu', e => e.preventDefault());
    H.querySelector('.sb-man').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const f = B?.F[0]; if (f && canAct(f)) buildMan(f); });
    H.querySelector('.sb-roll').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const f = B?.F[0]; if (f && canAct(f)) roll(f, B.moveDir); });
    H.querySelector('.sb-quit').addEventListener('click', () => end(true));
  }
  const canAct = f => B && B.phase === 'play' && !f.down && f.rollT <= 0;
  function camAxes() { camera.getWorldDirection(v2); const fx = v2.x, fz = v2.z, L = Math.hypot(fx, fz) || 1; return { fx: fx / L, fz: fz / L, rx: -fz / L, rz: fx / L }; }
  function pullTarget() {
    const f = B.F[0], { fx, fz, rx, rz } = camAxes(), k = 0.085, dx = B.pull.dx, dy = B.pull.dy;
    let tx = (fx * dy - rx * dx) * k, tz = (fz * dy - rz * dx) * k; const L = Math.hypot(tx, tz), M = 17; if (L > M) { tx *= M / L; tz *= M / L; }
    return new THREE.Vector3(f.x + tx, 0, f.z + tz);
  }
  // 画面タップで投げる(main から呼ぶ)
  function tap(cx, cy, rect) {
    if (!B) return false; const f = B.F[0]; if (!canAct(f) || f.cd > 0 || f.making) return true;
    ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1); ray.setFromCamera(ndc, camera); ray.far = 80;
    let best = null;
    for (const o of B.F) { if (o.team === 0 || o.down) continue; const h = ray.intersectObject(o.ch.root, true)[0]; if (h && (!best || h.distance < best.d)) best = { p: h.point, d: h.distance }; }
    if (!best) { const h = ray.intersectObjects(meshes, false)[0]; if (h) best = { p: h.point, d: h.distance }; }
    if (!best) { const p = ray.ray.intersectPlane(ground, new THREE.Vector3()); if (p) best = { p, d: 0 }; }
    if (!best) return true;
    throwAt(f, best.p.clone(), false); return true;
  }
  // ---- 投げる ----
  function launch(f, from, to, T, lv) {
    const v = new THREE.Vector3((to.x - from.x) / T, (to.y - from.y) / T + G * T / 2, (to.z - from.z) / T);
    const m = new THREE.Mesh(ballGeo, mat); m.scale.setScalar(RAD[lv]); m.position.copy(from); m.castShadow = true; scene.add(m);
    B.shots.push({ m, p: from.clone(), v, team: f.team, lv, life: 4 });
    f.ry = Math.atan2(to.x - f.x, to.z - f.z); f.throwT = 0.3; f.cd = lv === 1 ? 0.45 : 0.6; f.grow = 0; audio?.play?.('wave');
  }
  function throwAt(f, to, lobbed) {
    const lv = f.grow > 0 ? LV(f.grow) : 1, from = f.ball && f.ball.visible ? f.ball.position.clone() : handPos(f), d = Math.hypot(to.x - from.x, to.z - from.z);
    if (lv === 4 || lobbed) return lob(f, to);
    to.y = Math.max(to.y, 0.9); launch(f, from, to, Math.min(1.1, Math.max(0.22, d / (lv === 1 ? 17 : 14))), lv);
  }
  function lob(f, to) { const lv = Math.max(2, LV(f.grow)), from = f.ball && f.ball.visible ? f.ball.position.clone() : handPos(f), d = Math.hypot(to.x - from.x, to.z - from.z); to.y = 0; launch(f, from, to, 0.9 + d / 16, lv); }
  function buildMan(f) {
    removeMan(f);
    const g = new THREE.Group(), s1 = new THREE.Mesh(ballGeo, mat), s2 = new THREE.Mesh(ballGeo, mat);
    s1.scale.setScalar(0.42); s1.position.y = 0.38; s2.scale.setScalar(0.28); s2.position.y = 0.98; g.add(s1, s2);
    const eye = new THREE.MeshBasicMaterial({ color: 0x2e2a3d }); [-1, 1].forEach(k => { const e = new THREE.Mesh(ballGeo, eye); e.scale.setScalar(0.03); e.position.set(k * 0.09, 1.04, 0.25); g.add(e); });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0xff9a4a })); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.98, 0.32); g.add(nose);
    const x = f.x + Math.sin(f.ry) * 1.2, z = f.z + Math.cos(f.ry) * 1.2; g.position.set(x, 0, z); g.rotation.y = f.ry + Math.PI; g.scale.setScalar(0.01);
    scene.add(g); f.man = { g, hp: 3, x, z, R: 0.45, t: 0 }; B.men.push(f.man); audio?.play?.('open');
  }
  function removeMan(f) { if (!f.man) return; scene.remove(f.man.g); if (B) B.men = B.men.filter(m => m !== f.man); f.man = null; }
  function roll(f, dir) {
    if (f.rollCd > 0) return; let dx = dir ? dir.x : -Math.sin(f.ry), dz = dir ? dir.z : -Math.cos(f.ry); const L = Math.hypot(dx, dz) || 1;
    f.rdx = dx / L; f.rdz = dz / L; f.rollT = 0.42; f.rollCd = 1.4; f.making = false; audio?.play?.('wave');
  }
  function hitF(f, lv) {
    if (f.down || f.rollT > 0) return false; f.hp -= DMG[lv]; f.making = false; audio?.play?.('close');
    if (f.hp <= 0) { f.hp = 0; f.down = true; f.ch.pose = 'lie'; f.grow = 0; }
    return true;
  }
  function splash(p, lv) { snowFx?.(p.clone(), new THREE.Vector3(0, 1, 0), Math.min(1, lv / 3)); }
  // ---- NPC ----
  function npc(f, dt) {
    const A = f.ai; A.t -= dt;
    const en = B.F.filter(o => o.team !== f.team && !o.down); if (!en.length) return null;
    // よける
    if (f.rollCd <= 0) for (const s of B.shots) if (s.team !== f.team) {
      const dx = f.x - s.p.x, dz = f.z - s.p.z, d = Math.hypot(dx, dz), vv = Math.hypot(s.v.x, s.v.z) || 1;
      if (d < 3.5 && (dx * s.v.x + dz * s.v.z) / (d * vv) > 0.85 && Math.random() < [0, 0.02, 0.05, 0.09][f.lv]) { roll(f, { x: -s.v.z, z: s.v.x }); return null; }
    }
    if (f.making) { if (f.grow >= A.want) f.making = false; return null; }
    const tgt = en.reduce((a, b) => Math.hypot(a.x - f.x, a.z - f.z) < Math.hypot(b.x - f.x, b.z - f.z) ? a : b);
    if (A.t > 0) return A.goal;
    A.t = [0, 0.9, 0.65, 0.45][f.lv] * (0.7 + Math.random() * 0.6);
    const r = Math.random();
    if (!f.man && r < 0.12) { f.ry = Math.atan2(tgt.x - f.x, tgt.z - f.z); buildMan(f); return null; }
    if (f.grow === 0 && r < 0.45) { A.want = [1.05, 2.3, 3.7][Math.random() < 0.15 ? 2 : Math.random() < 0.5 ? 1 : 0]; f.making = true; A.goal = null; return null; }
    if (f.cd <= 0 && Math.hypot(tgt.x - f.x, tgt.z - f.z) < 15 && r < 0.85) {
      const err = [0, 1.3, 0.8, 0.4][f.lv], lead = 0.5, to = new THREE.Vector3(tgt.x + (tgt.vx || 0) * lead + (Math.random() - 0.5) * err * 2, 1.0, tgt.z + (tgt.vz || 0) * lead + (Math.random() - 0.5) * err * 2);
      const behind = B.men.some(m => m !== f.man && Math.hypot(m.x - tgt.x, m.z - tgt.z) < 1.6);
      throwAt(f, to, behind && f.grow >= 1); return null;
    }
    // うろうろ:相手から6〜10m
    const d = Math.hypot(tgt.x - f.x, tgt.z - f.z), want = 6 + Math.random() * 4, k = (d - want) / (d || 1);
    const side = (Math.random() - 0.5) * 4;
    A.goal = { x: f.x + (tgt.x - f.x) * k * 0.6 + (-(tgt.z - f.z) / (d || 1)) * side, z: f.z + (tgt.z - f.z) * k * 0.6 + ((tgt.x - f.x) / (d || 1)) * side };
    return A.goal;
  }
  // ---- 毎フレーム ----
  function update(dt, moveDir) {
    if (!B) return;
    B.moveDir = moveDir;
    B.t -= dt;
    if (B.phase === 'count') { if (B.t <= 0) { B.phase = 'play'; showMsg(''); } else if (B.t < 1.6) showMsg(String(Math.ceil(B.t / 0.55))); }
    if (B.phase === 'roundEnd' && B.t <= 0) { if (Math.max(...B.wins) >= 2) return end(false); B.round++; resetRound(); }
    const { C } = B;
    for (const f of B.F) {
      const isMe = f.kind === 'me';
      if (isMe) { if (B.phase === 'count') { me.x = f.x; me.z = f.z; me.ry = f.ry; } else { f.x = me.x; f.z = me.z; if (f.throwT <= 0) f.ry = me.ry; } }
      const ox = f.x, oz = f.z;
      f.cd = Math.max(0, f.cd - dt); f.rollCd = Math.max(0, f.rollCd - dt); f.throwT = Math.max(0, f.throwT - dt);
      if (f.making && !f.down && B.phase === 'play') f.grow = Math.min(4.2, f.grow + dt);
      let speed = 0;
      if (!f.down && B.phase === 'play') {
        if (f.rollT > 0) { f.rollT -= dt; f.x += f.rdx * 11 * dt; f.z += f.rdz * 11 * dt; }
        else if (!isMe) {
          const goal = npc(f, dt);
          if (goal && !f.making) { const dx = goal.x - f.x, dz = goal.z - f.z, d = Math.hypot(dx, dz); if (d > 0.3) { const sp = 3.4 * (LV(f.grow) >= 3 && f.grow > 0 ? 0.7 : 1); f.x += dx / d * sp * dt; f.z += dz / d * sp * dt; speed = sp; f.ry = Math.atan2(dx, dz); } }
          const tg = B.F.find(o => o.team !== f.team && !o.down); if (tg && speed === 0) f.ry = Math.atan2(tg.x - f.x, tg.z - f.z);
        }
        [f.x, f.z] = collide(f.x, f.z);
        // 輪の中に
        const dx = f.x - C.x, dz = f.z - C.z, d = Math.hypot(dx, dz); if (d > AR - 0.4) { f.x = C.x + dx / d * (AR - 0.4); f.z = C.z + dz / d * (AR - 0.4); }
        for (const m of [...B.mounds, ...B.men]) { const ex = f.x - m.x, ez = f.z - m.z, ed = Math.hypot(ex, ez), mm = m.R + 0.35; if (m.hp > 0 && ed < mm && ed > 0.01) { f.x = m.x + ex / ed * mm; f.z = m.z + ez / ed * mm; } }
      }
      f.vx = (f.x - ox) / dt; f.vz = (f.z - oz) / dt;
      if (isMe) { me.x = f.x; me.z = f.z; if (f.throwT > 0) me.ry = f.ry; }
      else { f.ch.root.position.set(f.x, 0, f.z); f.ch.root.rotation.y = f.ry; f.ch.update(dt, speed); }
      pose(f, dt);
    }
    // 雪だるまが ぽん と出る
    B.men.forEach(m => { m.t += dt; m.g.scale.setScalar(Math.min(1, m.t * 5) * (0.75 + 0.25 * m.hp / 3)); });
    // 雪玉
    for (let i = B.shots.length - 1; i >= 0; i--) {
      const s = B.shots[i]; s.life -= dt; s.v.y -= G * dt; s.p.addScaledVector(s.v, dt); s.m.position.copy(s.p); s.m.rotation.x += dt * 9;
      let hit = false;
      for (const f of B.F) if (f.team !== s.team && !f.down && Math.hypot(f.x - s.p.x, f.z - s.p.z) < 0.38 + RAD[s.lv] && s.p.y > 0 && s.p.y < 1.75) { if (hitF(f, s.lv)) { hit = true; snowFx?.(s.p.clone(), v1.set(s.v.x, 0, s.v.z).normalize().negate().clone(), Math.min(1, s.lv / 3)); } break; }
      if (!hit) for (const m of [...B.men, ...B.mounds]) if (m.hp > 0 && Math.hypot(m.x - s.p.x, m.z - s.p.z) < m.R + RAD[s.lv] && s.p.y < (m.g ? 1.2 : 0.75)) { m.hp -= DMG[s.lv]; hit = true; splash(s.p, s.lv); audio?.play?.('close'); if (m.hp <= 0) { if (m.g) { scene.remove(m.g); B.men = B.men.filter(x => x !== m); B.F.forEach(f => { if (f.man === m) f.man = null; }); } else m.m.visible = false; } break; }
      if (!hit && s.p.y <= 0.03) { hit = true; splash(s.p, s.lv); if (s.lv === 4) burst(s); }
      if (hit || s.life <= 0) { scene.remove(s.m); B.shots.splice(i, 1); }
    }
    // 決着
    if (B.phase === 'play') for (const tm of [0, 1]) if (B.F.filter(f => f.team === tm && !f.down).length === 0) {
      const w = 1 - tm; B.wins[w]++; B.phase = 'roundEnd'; B.t = 2.8; showMsg(w === 0 ? '勝った!' : 'やられた…'); audio?.play?.(w === 0 ? 'coin' : 'close'); break;
    }
    // 山なりの見本
    if (B.pull) { const f = B.F[0], to = pullTarget(), from = f.ball && f.ball.visible ? f.ball.position : handPos(f); drawPreview(from, to); } else if (B.preview) { B.preview.line.visible = B.preview.ring.visible = false; }
    drawHud();
  }
  function burst(s) {   // MAX:着地で8方向に飛び散る
    for (const f of B.F) if (f.team !== s.team && !f.down && Math.hypot(f.x - s.p.x, f.z - s.p.z) < 1.8) hitF(f, 3);
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, m = new THREE.Mesh(ballGeo, mat); m.scale.setScalar(0.08); const p = s.p.clone(); p.y = 0.25; m.position.copy(p); scene.add(m);
      B.shots.push({ m, p, v: new THREE.Vector3(Math.cos(a) * 7, 2.2, Math.sin(a) * 7), team: s.team, lv: 1, life: 0.6 });
    }
    audio?.play?.('close');
  }
  function drawPreview(from, to) {
    if (!B.preview) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(25 * 3), 3));
      const line = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0xff5a5a, dashSize: 0.3, gapSize: 0.2 }));
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.75, 40), new THREE.MeshBasicMaterial({ color: 0xff5a5a, transparent: true, opacity: 0.8, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2;
      scene.add(line, ring); B.preview = { line, ring };
    }
    const { line, ring } = B.preview; line.visible = ring.visible = true;
    const d = Math.hypot(to.x - from.x, to.z - from.z), T = 0.9 + d / 16, vx = (to.x - from.x) / T, vz = (to.z - from.z) / T, vy = (0 - from.y) / T + G * T / 2, a = line.geometry.attributes.position;
    for (let i = 0; i < 25; i++) { const t = T * i / 24; a.setXYZ(i, from.x + vx * t, from.y + vy * t - G * t * t / 2, from.z + vz * t); }
    a.needsUpdate = true; line.computeLineDistances(); ring.position.set(to.x, 0.06, to.z);
  }
  // ---- ポーズと手の雪玉 ----
  function pose(f, dt) {
    if (!f.ch.rig) { f.ch.rig = { arms: [new THREE.Object3D(), new THREE.Object3D()], body: new THREE.Object3D(), head: new THREE.Object3D(), fake: true }; }   // 腕のない住人(チャンクくん)
    const { arms, body } = f.ch.rig, lv = f.grow > 0 ? LV(f.grow) : 0, R = RAD[lv] * (f.making ? 0.6 + 0.4 * ((f.grow % 1)) : 1);
    if (f.down) { if (f.ball) f.ball.visible = false; return; }
    if (f.rollT > 0) { body.rotation.x = (1 - f.rollT / 0.42) * Math.PI * 2; if (f.ball) f.ball.visible = false; return; }
    body.rotation.x = 0;
    if (!f.ball) { f.ball = new THREE.Mesh(ballGeo, mat); f.ball.castShadow = true; scene.add(f.ball); }
    const b = f.ball;
    if (f.making) {   // しゃがんで、足もとで転がす
      body.rotation.x = 0.5; arms[0].rotation.x = arms[1].rotation.x = -1.1; arms[0].rotation.z = -0.1; arms[1].rotation.z = 0.1;
      const r = Math.max(0.06, RAD[Math.max(1, LV(f.grow))] * (0.75 + 0.25 * Math.min(1, f.grow % 1.2))); b.visible = true; b.scale.setScalar(r); b.position.set(f.x + Math.sin(f.ry) * 0.55, r, f.z + Math.cos(f.ry) * 0.55); b.rotation.x += dt * 5;
      return;
    }
    if (!lv) { b.visible = false; if (f.throwT > 0) arms[1].rotation.x = -2.6 + (1 - f.throwT / 0.3) * 3.2; return; }
    b.visible = true; b.scale.setScalar(R);
    if (lv <= 2) { arms[1].rotation.x = f.throwT > 0 ? -2.6 + (1 - f.throwT / 0.3) * 3.2 : -0.55; arms[1].rotation.z = 0.15; b.position.copy(handPos(f)); }   // 中くらいまでは片手
    else { arms[0].rotation.x = arms[1].rotation.x = -2.95; arms[0].rotation.z = 0.32; arms[1].rotation.z = -0.32; b.position.copy(headTop(f, R)); }   // 大きいのは頭の上で両手
  }
  function drawHud() {
    const H = B.hud, row = tm => B.F.filter(f => f.team === tm).map(f => `<span class="sb-p ${f.down ? 'down' : ''}" style="color:${tm ? '#3b7fc4' : '#d4517c'}">${f.name} <b>${'❤️'.repeat(f.hp)}${'🤍'.repeat(HP - f.hp)}</b></span>`).join('');
    const key = B.F.map(f => f.hp + (f.down ? 'd' : '')).join() + B.wins.join();
    if (H.dataset.k !== key) { H.dataset.k = key; H.querySelector('.t0').innerHTML = row(0) + `<span class="sb-p">${B.wins[0]}勝</span>`; H.querySelector('.t1').innerHTML = `<span class="sb-p">${B.wins[1]}勝</span>` + row(1); }
    const f = B.F[0], lv = f.grow > 0 ? LV(f.grow) : 0, mk = H.querySelector('.sb-mk');
    const lab = f.making ? `${NAMES[Math.max(1, LV(f.grow))]}…` : lv ? `${NAMES[lv]} 持ってる` : '長おし/引く';
    if (mk.dataset.l !== lab) { mk.dataset.l = lab; mk.innerHTML = `❄️<small>${lab}</small>`; }
    H.querySelector('.sb-roll').disabled = f.rollCd > 0;
  }
  return {
    get active() { return !!B; },
    get making() { return !!B && B.F[0].making; },
    get rolling() { return !!B && B.F[0].rollT > 0; },
    start, update, tap, quit: () => B && end(true),
  };
}
