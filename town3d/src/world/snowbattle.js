// 3Dの雪合戦(町の中で 2×2 のチーム戦)。いつもの操作(スティックで移動・ドラッグで見まわし)のまま戦う。
//   ❄️を押す=雪玉をつくる(一瞬止まる。長おしほど大きい S/M/L)。3つまで持てる
//   画面タップ=持っている雪玉をそこへ投げる / ❄️から引っぱる=山なり(放物線が見える。その間も動ける)
//   ⛄=雪だるま(すぐできる・1人3つまで) / 🙌=近くの雪だるまを頭の上に持ち上げる(自分のも相手のも)→タップで投げつける
//     持っている間は遅い・むき出し。直撃で3ダメージ、くだけた玉は当たった数だけダメージ
//   🌀=向いている方へ転がってよける(当たらない。雪だるまにぶつかると つぶす)
import * as THREE from 'three';

const SIZE = t => t < 0.55 ? 1 : t < 1.3 ? 2 : 3;   // 押した秒 → 大きさ
const RAD = [0, 0.09, 0.14, 0.21], DMG = [0, 1, 2, 3], NAMES = ['', 'S', 'M', 'L'];
const G = 9.8, AR = 11, MAN_MAX = 3, STOCK = 3;

export function createSnowBattle({ scene, camera, root, me, residents, meshes, collide, audio, snowFx, onEnd, faceCam }) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
  const ballGeo = new THREE.SphereGeometry(1, 14, 10);
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  let B = null;

  // ---- 画面 ----
  const css = document.createElement('style');
  css.textContent = `.sb-on .tw-emotes,.sb-on .tw-snowb,.sb-on .tw-action{display:none!important}
.sb-hud{position:absolute;inset:0;pointer-events:none;font-family:inherit;color:#5a4a6b;z-index:6}
.sb-hud button{pointer-events:auto;border:0;font:inherit;font-weight:900;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.sb-top{position:absolute;left:8px;right:8px;top:calc(52px + env(safe-area-inset-top,0px));display:flex;justify-content:space-between;gap:6px}
.sb-team{display:flex;gap:4px;flex-wrap:wrap}.sb-p{background:#fffffff0;border-radius:12px;padding:3px 8px;font-size:11px;font-weight:800;box-shadow:0 2px 6px #0002}
.sb-p.down{opacity:.45;text-decoration:line-through}.sb-p b{letter-spacing:-1px}
.sb-mk{position:absolute;right:16px;bottom:calc(96px + env(safe-area-inset-bottom,0px));width:92px;height:92px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#d6ecff);box-shadow:0 5px 0 #8fb6dc,0 8px 16px #0004;font-size:28px;line-height:1}
.sb-mk small{display:block;font-size:10px;margin-top:2px}
.sb-man,.sb-roll,.sb-lift{position:absolute;width:62px;height:62px;border-radius:50%;background:#fff;box-shadow:0 4px 0 #c9bfd8,0 6px 12px #0003;font-size:24px;line-height:1}
.sb-man{right:118px;bottom:calc(150px + env(safe-area-inset-bottom,0px))}.sb-roll{right:118px;bottom:calc(76px + env(safe-area-inset-bottom,0px))}
.sb-lift{right:30px;bottom:calc(200px + env(safe-area-inset-bottom,0px));background:#fff3c4}
.sb-man[disabled],.sb-roll[disabled],.sb-mk[disabled]{opacity:.45}.sb-man small,.sb-lift small{display:block;font-size:10px}.sb-lift[hidden]{display:none}
.sb-setup{position:absolute;left:50%;top:28%;transform:translateX(-50%);background:#fffffff2;border-radius:20px;padding:14px 18px;text-align:center;pointer-events:auto;box-shadow:0 6px 20px #0003;min-width:230px}
.sb-setup b{font-size:17px}.sb-setup small{display:block;color:#8d7f9e;margin:4px 0 10px;line-height:1.5}
.sb-hp{display:flex;align-items:center;justify-content:center;gap:12px;margin:10px 0 2px;font-size:20px;font-weight:900}
.sb-hp button{width:44px;height:44px;border-radius:50%;background:#f3e9ff;font-size:18px}
.sb-go{background:linear-gradient(160deg,#ffd0dc,#ffb3c1);color:#fff;border-radius:999px;padding:10px 28px;font-size:16px}
.sb-tipx{position:absolute;left:0;right:0;top:46%;text-align:center;font-size:14px;font-weight:800;color:#fff;text-shadow:0 1px 4px #000c;pointer-events:none}
.sb-quit{position:absolute;left:10px;bottom:calc(20px + env(safe-area-inset-bottom,0px));background:#fffffff0;border-radius:999px;padding:8px 14px;font-size:12px;box-shadow:0 2px 6px #0002}
.sb-msg{position:absolute;left:0;right:0;top:34%;text-align:center;font-size:34px;font-weight:900;color:#fff;text-shadow:0 3px 0 #5a4a6b,0 0 12px #0006;pointer-events:none}
.sb-tip{position:absolute;left:0;right:0;bottom:calc(196px + env(safe-area-inset-bottom,0px));text-align:center;font-size:12px;font-weight:800;color:#fff;text-shadow:0 1px 3px #000a;pointer-events:none}`;
  document.head.appendChild(css);
  function hudEl() {
    const h = document.createElement('div'); h.className = 'sb-hud';
    h.innerHTML = `<div class="sb-top"><div class="sb-team t0"></div><div class="sb-team t1"></div></div><div class="sb-msg"></div><div class="sb-tip">❄️=雪玉をつくる(長おしで大きく) 画面タップ=投げる ❄️から引く=山なり</div>
      <button class="sb-mk">❄️<small>つくる</small></button><button class="sb-man">⛄</button><button class="sb-roll">🌀</button><button class="sb-lift" hidden>🙌<small>持つ</small></button><button class="sb-quit">✕ やめる</button>`;
    root.appendChild(h); return h;
  }
  // ---- 人 ----
  function fighter(kind, ch, team, name, r, lv) {
    return { kind, ch, team, name, r, lv, x: 0, z: 0, ry: 0, hp: 5, down: false, stock: [], makeT: -1, rollT: 0, rollCd: 0, rdx: 0, rdz: 0, throwT: 0, cd: 0, men: [], carry: null, ai: { t: 0.5, goal: null, want: 0, need: 2 }, ball: null };
  }
  const handPos = f => { if (!f.ch.rig || f.ch.rig.fake) return new THREE.Vector3(f.x + Math.sin(f.ry) * 0.45, 0.75, f.z + Math.cos(f.ry) * 0.45); f.ch.root.updateMatrixWorld(true); return f.ch.rig.arms[1].localToWorld(v1.set(0, -0.42, 0.06)).clone(); };
  const headTop = (f, r) => { if (!f.ch.rig || f.ch.rig.fake) return new THREE.Vector3(f.x, 1.2 + r, f.z); f.ch.root.updateMatrixWorld(true); return f.ch.rig.head.localToWorld(v1.set(0, 0.3 + r, 0)).clone(); };
  // ---- はじめる ----
  function start(opp, lvOpp = 2) {
    if (B) return;
    const vis = residents.list.filter(r => r !== opp && !r.hidden && r.ch.rig).sort((a, b) => Math.hypot(a.ch.root.position.x - me.x, a.ch.root.position.z - me.z) - Math.hypot(b.ch.root.position.x - me.x, b.ch.root.position.z - me.z));
    const pool = vis.length >= 2 ? vis : residents.list.filter(r => r !== opp && r.ch.rig);
    const ally = pool[0], partner = pool[1];
    let ox = opp.ch.root.position.x, oz = opp.ch.root.position.z; if (Math.hypot(ox - me.x, oz - me.z) < 3) { ox = me.x + Math.sin(me.ry) * 8; oz = me.z + Math.cos(me.ry) * 8; }
    const C = new THREE.Vector3((me.x + ox) / 2, 0, (me.z + oz) / 2);
    let ax = ox - me.x, az = oz - me.z; const L = Math.hypot(ax, az) || 1; ax /= L; az /= L;
    B = { C, ax, az, F: [], shots: [], men: [], mounds: [], wins: [0, 0], round: 1, phase: 'setup', t: 3, objs: [], hud: hudEl(), pull: null, preview: null };
    B.F = [fighter('me', me.ch, 0, 'あなた', null, 2), fighter('npc', ally.ch, 0, ally.def.name, ally, 2), fighter('npc', opp.ch, 1, opp.def.name, opp, lvOpp), fighter('npc', partner.ch, 1, partner.def.name, partner, Math.max(1, lvOpp - 1))];
    B.F.forEach(f => { if (f.r) { f.r.battle = true; f.r.talking = false; f.r.hidden = false; f.ch.root.visible = true; } });
    const ring = new THREE.Mesh(new THREE.RingGeometry(AR - 0.12, AR + 0.12, 64), new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(C.x, 0.05, C.z); scene.add(ring); B.objs.push(ring);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(AR * 2, 0.12), new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    line.rotation.x = -Math.PI / 2; line.rotation.z = -Math.atan2(az, ax) + Math.PI / 2; line.position.set(C.x, 0.05, C.z); scene.add(line); B.objs.push(line);
    [-1, 1].forEach(s => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.9, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat); m.scale.set(1.3, 0.75, 0.8); m.rotation.y = Math.atan2(ax, az); m.position.set(C.x - az * 3.2 * s, 0, C.z + ax * 3.2 * s); m.castShadow = true; scene.add(m); B.objs.push(m); B.mounds.push({ m, hp: 6, x: m.position.x, z: m.position.z, R: 1.0 }); });
    bindHud(); root.classList.add('sb-on'); audio?.play?.('open');
    let hp0 = 5; try { hp0 = Math.min(10, Math.max(1, +localStorage.getItem('town:sb:hp') || 5)); } catch (e) { }
    B.maxHp = hp0; spawn(); const f0 = B.F[0]; me.x = f0.x; me.z = f0.z; me.ry = f0.ry; faceCam?.(f0.x, f0.z, f0.ry);
    const pn = document.createElement('div'); pn.className = 'sb-setup';
    const drawP = () => { pn.innerHTML = `<b>⛄ 雪合戦 2対2</b><div class="sb-hp"><button data-d="-1">◀</button><span>ライフ ${B.maxHp}</span><button data-d="1">▶</button></div><small>雪玉 S=1・M=2・L=3 へる<br>雪だるまを投げつけると 直撃3+かけら1ずつ</small><button class="sb-go">はじめる!</button>`; };
    drawP(); B.hud.appendChild(pn);
    pn.addEventListener('pointerdown', e => e.stopPropagation());
    pn.addEventListener('click', e => {
      const d = e.target.closest('[data-d]'); if (d) { B.maxHp = Math.min(10, Math.max(1, B.maxHp + +d.dataset.d)); drawP(); return; }
      if (e.target.closest('.sb-go')) { try { localStorage.setItem('town:sb:hp', B.maxHp); } catch (_) { } pn.remove(); resetRound(); }
    });
  }
  function spawn() {
    const { C, ax, az } = B, px = -az, pz = ax;
    B.F.forEach(f => { const i = B.F.filter(o => o.team === f.team).indexOf(f), s = f.team ? 1 : -1, side = i ? 1.8 : -1.8; f.x = C.x + ax * 7 * s + px * side; f.z = C.z + az * 7 * s + pz * side; f.ry = Math.atan2(-ax * s, -az * s); });
  }
  function resetRound() {
    B.F.forEach(f => { f.hp = B.maxHp; f.down = false; f.stock = []; f.makeT = -1; f.rollT = 0; dropCarry(f, true); f.ch.pose = null; f.ch.rig && (f.ch.rig.body.rotation.x = 0); removeMan(f); f.ai = { t: 0.8 + Math.random(), goal: null, want: 0, need: 2 }; });
    B.men.slice().forEach(killMan);
    B.shots.forEach(s => scene.remove(s.m)); B.shots = [];
    spawn(); const f0 = B.F[0]; me.x = f0.x; me.z = f0.z; me.ry = f0.ry; faceCam?.(f0.x, f0.z, f0.ry);
    B.phase = 'count'; B.t = 2.6; showMsg(`ラウンド ${B.round}`);
  }
  function showTip(t) { if (!B) return; let el = B.hud.querySelector('.sb-tipx'); if (!el) { el = document.createElement('div'); el.className = 'sb-tipx'; B.hud.appendChild(el); } el.textContent = t; clearTimeout(el._t); el._t = setTimeout(() => (el.textContent = ''), 1800); }
  function showMsg(s) { const el = B?.hud.querySelector('.sb-msg'); if (el) el.textContent = s; }
  function end(quit) {
    const win = !quit && B.wins[0] > B.wins[1];
    B.F.forEach(f => { dropCarry(f, true); f.ch.pose = null; f.ch.rig && (f.ch.rig.body.rotation.x = 0); if (f.ball) { scene.remove(f.ball); f.ball = null; } if (f.r) { f.r.battle = false; f.r.goal = { place: null }; f.r.path = []; f.r.ch.root.position.set(f.x, 0, f.z); } });
    B.men.slice().forEach(killMan);
    B.shots.forEach(s => scene.remove(s.m)); B.objs.forEach(o => scene.remove(o)); B.hud.remove(); if (B.preview) scene.remove(B.preview.line, B.preview.ring);
    root.classList.remove('sb-on');
    const opp = B.F[2]; B = null; onEnd?.({ win, quit, opp: opp.r });
  }
  // ---- 操作 ----
  function bindHud() {
    const H = B.hud, mk = H.querySelector('.sb-mk'); let d0 = null;
    mk.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); try { mk.setPointerCapture(e.pointerId); } catch (_) { } d0 = { x: e.clientX, y: e.clientY };
      const f = B?.F[0]; if (!f || !canAct(f) || f.carry) return;
      if (f.stock.length >= STOCK) { d0.pullOnly = true; return; }   // もう3つ持っている:引っぱり専用
      f.makeT = 0;
    });
    mk.addEventListener('pointermove', e => {
      if (!d0 || !B) return; const f = B.F[0], dx = e.clientX - d0.x, dy = e.clientY - d0.y;
      if (!B.pull && Math.hypot(dx, dy) > 26 && (f.stock.length || f.carry)) { f.makeT = -1; B.pull = { dx, dy }; }
      if (B.pull) B.pull = { dx, dy };
    });
    const up = () => { if (!d0 || !B) return; d0 = null; const f = B.F[0]; if (B.pull) { const p = pullTarget(); B.pull = null; if (p && canAct(f)) { if (f.carry) throwMan(f, p); else lob(f, p); } return; } finishMake(f); };
    mk.addEventListener('pointerup', up); mk.addEventListener('pointercancel', up); mk.addEventListener('contextmenu', e => e.preventDefault());
    H.querySelector('.sb-man').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const f = B?.F[0]; if (f && canAct(f) && !f.carry) buildMan(f); });
    H.querySelector('.sb-roll').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const f = B?.F[0]; if (f && canAct(f)) { if (f.carry) { showTip('雪だるまを持っていると転がれない'); return; } roll(f); } });
    H.querySelector('.sb-lift').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const f = B?.F[0]; if (f && canAct(f)) lift(f); });
    H.querySelector('.sb-quit').addEventListener('click', () => end(true));
  }
  const canAct = f => B && B.phase === 'play' && !f.down && f.rollT <= 0;
  function finishMake(f) { if (f.makeT < 0) return; const s = SIZE(f.makeT); f.makeT = -1; if (f.stock.length < STOCK) { f.stock.push(s); audio?.play?.('open'); } }
  function camAxes() { camera.getWorldDirection(v2); const fx = v2.x, fz = v2.z, L = Math.hypot(fx, fz) || 1; return { fx: fx / L, fz: fz / L, rx: -fz / L, rz: fx / L }; }
  function pullTarget() {
    const f = B.F[0], { fx, fz, rx, rz } = camAxes(), k = 0.085, dx = B.pull.dx, dy = B.pull.dy;
    let tx = (fx * dy - rx * dx) * k, tz = (fz * dy - rz * dx) * k; const L = Math.hypot(tx, tz), M = 17; if (L > M) { tx *= M / L; tz *= M / L; }
    return new THREE.Vector3(f.x + tx, 0, f.z + tz);
  }
  // 画面タップ:持っている雪玉(または雪だるま)をそこへ
  function tap(cx, cy, rect) {
    if (!B) return false; const f = B.F[0]; if (!canAct(f) || f.cd > 0 || f.makeT >= 0) return true;
    if (!f.carry && !f.stock.length) { showTip('❄️で雪玉をつくってね'); return true; }
    ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1); ray.setFromCamera(ndc, camera); ray.far = 80;
    let best = null;
    for (const o of B.F) { if (o.team === 0 || o.down) continue; const h = ray.intersectObject(o.ch.root, true)[0]; if (h && (!best || h.distance < best.d)) best = { p: h.point, d: h.distance }; }
    if (!best) { const h = ray.intersectObjects(meshes, false)[0]; if (h) best = { p: h.point, d: h.distance }; }
    if (!best) { const p = ray.ray.intersectPlane(ground, new THREE.Vector3()); if (p) best = { p, d: 0 }; }
    if (!best) return true;
    if (f.carry) throwMan(f, best.p.clone()); else throwAt(f, best.p.clone());
    return true;
  }
  // ---- 投げる ----
  function launch(f, from, to, T, kind, lv, mesh) {
    const v = new THREE.Vector3((to.x - from.x) / T, (to.y - from.y) / T + G * T / 2, (to.z - from.z) / T);
    const m = mesh || new THREE.Mesh(ballGeo, mat); if (!mesh) { m.scale.setScalar(RAD[lv]); m.castShadow = true; scene.add(m); } m.position.copy(from);
    B.shots.push({ m, p: from.clone(), v, team: f.team, lv, kind, life: 4 });
    f.ry = Math.atan2(to.x - f.x, to.z - f.z); f.throwT = 0.3; f.cd = 0.35; audio?.play?.('wave');
  }
  function throwAt(f, to) {
    if (!f.stock.length) return; const lv = f.stock.shift(), from = handPos(f), d = Math.hypot(to.x - from.x, to.z - from.z);
    to.y = Math.max(to.y, 0.9); launch(f, from, to, Math.min(1.1, Math.max(0.22, d / (lv === 1 ? 17 : 14))), 'ball', lv);
  }
  function lob(f, to) { if (!f.stock.length) return; const lv = f.stock.shift(), from = handPos(f), d = Math.hypot(to.x - from.x, to.z - from.z); to.y = 0; launch(f, from, to, 0.9 + d / 16, 'ball', lv); }
  // ---- 雪だるま ----
  function manMesh() {
    const g = new THREE.Group(), s1 = new THREE.Mesh(ballGeo, mat), s2 = new THREE.Mesh(ballGeo, mat);
    s1.scale.setScalar(0.42); s1.position.y = 0.38; s2.scale.setScalar(0.28); s2.position.y = 0.98; g.add(s1, s2); s1.castShadow = true;
    const eye = new THREE.MeshBasicMaterial({ color: 0x2e2a3d }); [-1, 1].forEach(k => { const e = new THREE.Mesh(ballGeo, eye); e.scale.setScalar(0.03); e.position.set(k * 0.09, 1.04, 0.25); g.add(e); });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0xff9a4a })); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.98, 0.32); g.add(nose);
    return g;
  }
  function buildMan(f) {
    if (f.men.length >= MAN_MAX) { if (f.kind === 'me') showTip('雪だるまは3つまで。こわされたら、また作れるよ'); return false; }
    const g = manMesh(), x = f.x + Math.sin(f.ry) * 1.2, z = f.z + Math.cos(f.ry) * 1.2; g.position.set(x, 0, z); g.rotation.y = f.ry + Math.PI; g.scale.setScalar(0.01);
    scene.add(g); const m = { g, hp: 3, x, z, R: 0.45, t: 0, owner: f }; f.men.push(m); B.men.push(m); audio?.play?.('open'); return true;
  }
  function killMan(m) { scene.remove(m.g); B.men = B.men.filter(x => x !== m); m.owner.men = m.owner.men.filter(x => x !== m); }
  function removeMan(f) { f.men.slice().forEach(killMan); }
  const nearMan = f => B.men.filter(m => Math.hypot(m.x - f.x, m.z - f.z) < 1.5).sort((a, b) => Math.hypot(a.x - f.x, a.z - f.z) - Math.hypot(b.x - f.x, b.z - f.z))[0];
  function lift(f) {   // 頭の上に持ち上げる(持ち主はまた作れるようになる)
    const m = nearMan(f); if (!m || f.carry) return false;
    B.men = B.men.filter(x => x !== m); m.owner.men = m.owner.men.filter(x => x !== m);
    f.carry = m.g; f.carry.scale.setScalar(0.75); f.makeT = -1; audio?.play?.('open'); return true;
  }
  function dropCarry(f, remove) { if (!f.carry) return; if (remove) scene.remove(f.carry); f.carry = null; }
  function throwMan(f, to) {
    if (!f.carry) return; const g = f.carry; f.carry = null; const from = g.position.clone(), d = Math.hypot(to.x - from.x, to.z - from.z);
    to.y = Math.max(0, Math.min(to.y, 1.0)); launch(f, from, to, 0.55 + d / 18, 'man', 3, g); f.cd = 0.6;
  }
  function roll(f, dir) {
    if (f.rollCd > 0 || f.carry) return; let dx = dir ? dir.x : Math.sin(f.ry), dz = dir ? dir.z : Math.cos(f.ry); const L = Math.hypot(dx, dz) || 1;   // ふつうは向いている方へ
    f.rdx = dx / L; f.rdz = dz / L; f.rollT = 0.42; f.rollCd = 1.4; f.makeT = -1; audio?.play?.('wave');
  }
  function hitF(f, dmg) {
    if (f.down || f.rollT > 0) return false; f.hp -= dmg; f.makeT = -1; audio?.play?.('close');
    if (f.hp <= 0) { f.hp = 0; f.down = true; f.ch.pose = 'lie'; f.stock = []; if (f.carry) { const g = f.carry; f.carry = null; g.position.set(f.x + 0.6, 0, f.z); g.scale.setScalar(1); g.rotation.set(0, 0, 0); const m = { g, hp: 2, x: g.position.x, z: g.position.z, R: 0.45, t: 1, owner: f }; f.men.push(m); B.men.push(m); } }
    return true;
  }
  function splash(p, lv) { snowFx?.(p.clone(), new THREE.Vector3(0, 1, 0), Math.min(1, lv / 3)); }
  function shatter(s) {   // 雪だるまがくだけて、かけらが飛び散る
    const p = s.p.clone(); scene.remove(s.m); splash(p, 3); audio?.play?.('close');
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * Math.PI * 2 + Math.random() * 0.4, m = new THREE.Mesh(ballGeo, mat); m.scale.setScalar(0.11); const q = p.clone(); q.y = Math.max(0.3, q.y); m.position.copy(q); scene.add(m);
      B.shots.push({ m, p: q, v: new THREE.Vector3(Math.cos(a) * 6.5, 2.4, Math.sin(a) * 6.5), team: s.team, lv: 1, kind: 'frag', life: 0.7 });
    }
  }
  // ---- NPC ----
  function npc(f, dt) {
    const A = f.ai; A.t -= dt;
    const en = B.F.filter(o => o.team !== f.team && !o.down); if (!en.length) return null;
    if (f.rollCd <= 0 && !f.carry) for (const s of B.shots) if (s.team !== f.team) {
      const dx = f.x - s.p.x, dz = f.z - s.p.z, d = Math.hypot(dx, dz), vv = Math.hypot(s.v.x, s.v.z) || 1;
      if (d < 3.5 && (dx * s.v.x + dz * s.v.z) / (d * vv) > 0.85 && Math.random() < [0, 0.02, 0.05, 0.09][f.lv]) { roll(f, { x: -s.v.z, z: s.v.x }); return null; }
    }
    if (f.makeT >= 0) { if (f.makeT >= A.want) finishMake(f); return null; }
    const tgt = en.reduce((a, b) => Math.hypot(a.x - f.x, a.z - f.z) < Math.hypot(b.x - f.x, b.z - f.z) ? a : b), dT = Math.hypot(tgt.x - f.x, tgt.z - f.z);
    if (A.t > 0) return A.goal;
    A.t = [0, 0.85, 0.6, 0.42][f.lv] * (0.7 + Math.random() * 0.6);
    const err = [0, 1.3, 0.8, 0.4][f.lv];
    if (f.carry) {   // 持っていたら、近づいて投げつける
      if (dT < 9) { throwMan(f, new THREE.Vector3(tgt.x + (Math.random() - 0.5) * err, 0.6, tgt.z + (Math.random() - 0.5) * err)); return null; }
      A.goal = { x: f.x + (tgt.x - f.x) * 0.4, z: f.z + (tgt.z - f.z) * 0.4 }; return A.goal;
    }
    const r = Math.random(), nm = nearMan(f);
    if (nm && nm.owner.team !== f.team && r < 0.35) { lift(f); return null; }   // 相手の雪だるまを持ち上げる
    if (nm && nm.owner.team === f.team && r < 0.08 * f.lv) { lift(f); return null; }
    if (f.men.length < MAN_MAX && r < 0.1) { f.ry = Math.atan2(tgt.x - f.x, tgt.z - f.z); buildMan(f); return null; }
    if (f.stock.length < A.need && r < 0.6) { A.want = [0.2, 0.8, 1.5][Math.random() < 0.2 ? 2 : Math.random() < 0.5 ? 1 : 0]; f.makeT = 0; A.goal = null; return null; }
    if (f.stock.length && f.cd <= 0 && dT < 15 && r < 0.85) {
      const to = new THREE.Vector3(tgt.x + (tgt.vx || 0) * 0.5 + (Math.random() - 0.5) * err * 2, 1.0, tgt.z + (tgt.vz || 0) * 0.5 + (Math.random() - 0.5) * err * 2);
      const behind = B.men.some(m => Math.hypot(m.x - tgt.x, m.z - tgt.z) < 1.6);
      if (behind) lob(f, to); else throwAt(f, to); A.need = 1 + Math.floor(Math.random() * 3); return null;
    }
    // 雪だるまが近くにあれば取りに行く / 相手から6〜10m
    const far = B.men.find(m => m.owner.team !== f.team && Math.hypot(m.x - f.x, m.z - f.z) < 6);
    if (far && Math.random() < 0.4) { A.goal = { x: far.x, z: far.z }; return A.goal; }
    const want = 6 + Math.random() * 4, k = (dT - want) / (dT || 1), side = (Math.random() - 0.5) * 4;
    A.goal = { x: f.x + (tgt.x - f.x) * k * 0.6 + (-(tgt.z - f.z) / (dT || 1)) * side, z: f.z + (tgt.z - f.z) * k * 0.6 + ((tgt.x - f.x) / (dT || 1)) * side };
    return A.goal;
  }
  // ---- 毎フレーム ----
  function update(dt, moveDir) {
    if (!B) return;
    B.moveDir = moveDir; B.t -= dt;
    if (B.phase === 'count') { if (B.t <= 0) { B.phase = 'play'; showMsg(''); } else if (B.t < 1.6) showMsg(String(Math.ceil(B.t / 0.55))); }
    if (B.phase === 'roundEnd' && B.t <= 0) { if (Math.max(...B.wins) >= 2) return end(false); B.round++; resetRound(); }
    const { C } = B;
    for (const f of B.F) {
      const isMe = f.kind === 'me';
      if (isMe) { if (B.phase === 'count' || B.phase === 'setup') { me.x = f.x; me.z = f.z; me.ry = f.ry; } else { f.x = me.x; f.z = me.z; if (f.throwT <= 0) f.ry = me.ry; } }
      const ox = f.x, oz = f.z;
      f.cd = Math.max(0, f.cd - dt); f.rollCd = Math.max(0, f.rollCd - dt); f.throwT = Math.max(0, f.throwT - dt);
      if (f.makeT >= 0 && !f.down && B.phase === 'play') f.makeT += dt;
      let speed = 0;
      if (!f.down && B.phase === 'play') {
        if (f.rollT > 0) {
          f.rollT -= dt; f.x += f.rdx * 11 * dt; f.z += f.rdz * 11 * dt; f.ry = Math.atan2(f.rdx, f.rdz);
          for (const m of B.men.slice()) if (Math.hypot(m.x - f.x, m.z - f.z) < m.R + 0.5) { killMan(m); splash(new THREE.Vector3(m.x, 0.6, m.z), 3); audio?.play?.('close'); }   // 転がってぶつかると つぶす
        } else if (!isMe) {
          const goal = npc(f, dt);
          if (goal && f.makeT < 0) { const dx = goal.x - f.x, dz = goal.z - f.z, d = Math.hypot(dx, dz); if (d > 0.3) { const sp = 3.4 * (f.carry ? 0.5 : 1); f.x += dx / d * sp * dt; f.z += dz / d * sp * dt; speed = sp; f.ry = Math.atan2(dx, dz); } }
          const tg = B.F.find(o => o.team !== f.team && !o.down); if (tg && speed === 0) f.ry = Math.atan2(tg.x - f.x, tg.z - f.z);
        } else if (f.carry) { f.x = ox + (f.x - ox) * 0.5; f.z = oz + (f.z - oz) * 0.5; }   // 持っていると半分の速さ
        [f.x, f.z] = collide(f.x, f.z);
        const dx = f.x - C.x, dz = f.z - C.z, d = Math.hypot(dx, dz); if (d > AR - 0.4) { f.x = C.x + dx / d * (AR - 0.4); f.z = C.z + dz / d * (AR - 0.4); }
        for (const m of [...B.mounds, ...B.men]) { const ex = f.x - m.x, ez = f.z - m.z, ed = Math.hypot(ex, ez), mm = m.R + 0.35; if (m.hp > 0 && ed < mm && ed > 0.01) { f.x = m.x + ex / ed * mm; f.z = m.z + ez / ed * mm; } }
      }
      f.vx = (f.x - ox) / dt; f.vz = (f.z - oz) / dt;
      if (isMe) { me.x = f.x; me.z = f.z; if (f.throwT > 0) me.ry = f.ry; }
      else { f.ch.root.position.set(f.x, 0, f.z); f.ch.root.rotation.y = f.ry; f.ch.update(dt, speed); }
      pose(f, dt);
    }
    B.men.forEach(m => { m.t += dt; m.g.scale.setScalar(Math.min(1, m.t * 5) * (0.75 + 0.25 * m.hp / 3)); });
    // 飛んでいる物
    for (let i = B.shots.length - 1; i >= 0; i--) {
      const s = B.shots[i]; s.life -= dt; s.v.y -= G * dt; s.p.addScaledVector(s.v, dt); s.m.position.copy(s.p); s.m.rotation.x += dt * (s.kind === 'man' ? 4 : 9);
      const dmg = s.kind === 'man' ? 3 : s.kind === 'frag' ? 1 : DMG[s.lv], rad = s.kind === 'man' ? 0.4 : s.kind === 'frag' ? 0.11 : RAD[s.lv];
      let hit = false;
      for (const f of B.F) if (f.team !== s.team && !f.down && Math.hypot(f.x - s.p.x, f.z - s.p.z) < 0.38 + rad && s.p.y > -0.1 && s.p.y < 1.8) { if (hitF(f, dmg)) { hit = true; if (s.kind !== 'man') snowFx?.(s.p.clone(), v1.set(s.v.x, 0, s.v.z).normalize().negate().clone(), Math.min(1, s.lv / 3)); } break; }
      if (!hit) for (const m of [...B.men, ...B.mounds]) if (m.hp > 0 && Math.hypot(m.x - s.p.x, m.z - s.p.z) < m.R + rad && s.p.y < (m.g ? 1.2 : 0.75)) { m.hp -= s.kind === 'man' ? 3 : dmg; hit = true; if (s.kind !== 'man') splash(s.p, s.lv); audio?.play?.('close'); if (m.hp <= 0) { if (m.g) killMan(m); else m.m.visible = false; } break; }
      if (!hit && s.p.y <= 0.03) { hit = true; if (s.kind !== 'man') splash(s.p, s.lv); }
      if (hit || s.life <= 0) { if (s.kind === 'man') shatter(s); else scene.remove(s.m); B.shots.splice(i, 1); }
    }
    if (B.phase === 'play') for (const tm of [0, 1]) if (B.F.filter(f => f.team === tm && !f.down).length === 0) {
      const w = 1 - tm; B.wins[w]++; B.phase = 'roundEnd'; B.t = 2.8; showMsg(w === 0 ? '勝った!' : 'やられた…'); audio?.play?.(w === 0 ? 'coin' : 'close'); break;
    }
    if (B.pull) { const f = B.F[0], to = pullTarget(), from = f.carry ? f.carry.position : handPos(f); drawPreview(from, to, f.carry ? 0.55 : 0.9, f.carry ? 18 : 16); } else if (B.preview) { B.preview.line.visible = B.preview.ring.visible = false; }
    drawHud();
  }
  function drawPreview(from, to, t0, sp) {
    if (!B.preview) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(25 * 3), 3));
      const line = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0xff5a5a, dashSize: 0.3, gapSize: 0.2 }));
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 32), new THREE.MeshBasicMaterial({ color: 0xff5a5a, transparent: true, opacity: 0.8, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2;
      scene.add(line, ring); B.preview = { line, ring };
    }
    const { line, ring } = B.preview; line.visible = ring.visible = true;
    const d = Math.hypot(to.x - from.x, to.z - from.z), T = t0 + d / sp, vx = (to.x - from.x) / T, vz = (to.z - from.z) / T, vy = (0 - from.y) / T + G * T / 2, a = line.geometry.attributes.position;
    for (let i = 0; i < 25; i++) { const t = T * i / 24; a.setXYZ(i, from.x + vx * t, from.y + vy * t - G * t * t / 2, from.z + vz * t); }
    a.needsUpdate = true; line.computeLineDistances(); ring.position.set(to.x, 0.06, to.z);
  }
  // ---- ポーズ:手の雪玉・頭の上の雪だるま ----
  function pose(f, dt) {
    if (!f.ch.rig) f.ch.rig = { arms: [new THREE.Object3D(), new THREE.Object3D()], body: new THREE.Object3D(), head: new THREE.Object3D(), fake: true };   // 腕のない住人(チャンクくん)
    const { arms, body } = f.ch.rig;
    if (!f.ball) { f.ball = new THREE.Mesh(ballGeo, mat); f.ball.castShadow = true; scene.add(f.ball); }
    const b = f.ball;
    if (f.down) { b.visible = false; return; }
    if (f.rollT > 0) { body.rotation.x = (1 - f.rollT / 0.42) * Math.PI * 2; b.visible = false; return; }
    body.rotation.x = 0;
    if (f.carry) {   // 雪だるまを頭の上で両手で
      arms[0].rotation.x = arms[1].rotation.x = -2.95; arms[0].rotation.z = 0.35; arms[1].rotation.z = -0.35;
      f.carry.position.copy(headTop(f, 0.05)); f.carry.position.y -= 0.12; f.carry.rotation.set(0, f.ry, 0); b.visible = false; return;
    }
    if (f.makeT >= 0) {   // しゃがんで、足もとで にぎる
      body.rotation.x = 0.5; arms[0].rotation.x = arms[1].rotation.x = -1.1; arms[0].rotation.z = -0.1; arms[1].rotation.z = 0.1;
      const r = RAD[SIZE(f.makeT)] * (0.8 + 0.2 * Math.sin(f.makeT * 10)); b.visible = true; b.scale.setScalar(r); b.position.set(f.x + Math.sin(f.ry) * 0.5, r, f.z + Math.cos(f.ry) * 0.5);
      return;
    }
    if (!f.stock.length) { b.visible = false; if (f.throwT > 0) arms[1].rotation.x = -2.6 + (1 - f.throwT / 0.3) * 3.2; return; }
    b.visible = true; b.scale.setScalar(RAD[f.stock[0]]);   // つぎに投げる玉を片手で
    arms[1].rotation.x = f.throwT > 0 ? -2.6 + (1 - f.throwT / 0.3) * 3.2 : -0.55; arms[1].rotation.z = 0.15; b.position.copy(handPos(f));
  }
  function drawHud() {
    const H = B.hud, row = tm => B.F.filter(f => f.team === tm).map(f => `<span class="sb-p ${f.down ? 'down' : ''}" style="color:${tm ? '#3b7fc4' : '#d4517c'}">${f.name} <b>${'❤️'.repeat(f.hp)}${'🤍'.repeat(B.maxHp - f.hp)}</b></span>`).join('');
    const key = B.F.map(f => f.hp + (f.down ? 'd' : '')).join() + B.wins.join();
    if (H.dataset.k !== key) { H.dataset.k = key; H.querySelector('.t0').innerHTML = row(0) + `<span class="sb-p">${B.wins[0]}勝</span>`; H.querySelector('.t1').innerHTML = `<span class="sb-p">${B.wins[1]}勝</span>` + row(1); }
    const f = B.F[0], mk = H.querySelector('.sb-mk');
    const dots = [0, 1, 2].map(i => f.stock[i] ? NAMES[f.stock[i]] : '・').join(' ');
    const lab = f.carry ? '⛄ 引いて投げる' : f.makeT >= 0 ? `${NAMES[SIZE(f.makeT)]}…` : dots;
    if (mk.dataset.l !== lab) { mk.dataset.l = lab; mk.innerHTML = `❄️<small>${lab}</small>`; }
    H.querySelector('.sb-roll').disabled = f.rollCd > 0 || !!f.carry;
    const mb = H.querySelector('.sb-man'), ml = `⛄<small>${f.men.length}/${MAN_MAX}</small>`; if (mb.dataset.l !== ml) { mb.dataset.l = ml; mb.innerHTML = ml; } mb.disabled = f.men.length >= MAN_MAX || !!f.carry;
    const lb = H.querySelector('.sb-lift'), can = !f.carry && !f.down && B.phase === 'play' && !!nearMan(f); if (lb.hidden === can) lb.hidden = !can;
  }
  return {
    get state() { return B; },   // テスト用
    get active() { return !!B; },
    get making() { return !!B && B.F[0].makeT >= 0; },
    get rolling() { return !!B && B.F[0].rollT > 0; },
    start, update, tap, quit: () => B && end(true),
  };
}
