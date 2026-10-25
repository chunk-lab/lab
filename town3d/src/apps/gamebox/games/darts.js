// 3Dダーツ(クリケット)。ボードを長おしすると ねらいの円がゆれる → はなすとそこへ投げる(長くおさえるほど ゆれが小さく、おさえすぎると また大きく)。
//   15〜20とブルを3回ずつ当てると「クローズ」。自分だけクローズした数字に当てると点が入る。全部クローズして点が上なら勝ち
import * as THREE from 'three';
import { loop, txt, COL, INK, clamp } from '../kit.js';

const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const RR = { bi: 6.35, bo: 15.9, ti: 99, to: 107, di: 162, do: 170, edge: 225 };   // mm
const TARGETS = [20, 19, 18, 17, 16, 15, 25];
function score(xmm, ymm) {   // ボードの中心からの位置(mm、上が+) → {n, m}(数字・倍)
  const r = Math.hypot(xmm, ymm); if (r <= RR.bi) return { n: 25, m: 2 }; if (r <= RR.bo) return { n: 25, m: 1 }; if (r > RR.do) return { n: 0, m: 0 };
  let a = Math.atan2(xmm, ymm) * 180 / Math.PI; a = (a + 360 + 9) % 360; const n = ORDER[Math.floor(a / 18)];
  return { n, m: r >= RR.ti && r <= RR.to ? 3 : r >= RR.di ? 2 : 1 };
}
function aimPoint(n, m) {   // その数字・倍の まん中(mm)
  if (n === 25) return [0, 0];
  const i = ORDER.indexOf(n), a = i * 18 * Math.PI / 180, r = m === 3 ? 103 : m === 2 ? 166 : 135; return [Math.sin(a) * r, Math.cos(a) * r];
}
export default {
  id: 'darts', title: 'ダーツ(クリケット)', icon: '🎯', desc: '3Dダーツでクリケット勝負', pass: 1,
  rule: '画面をおさえて、ゆっくり動かすと ねらいが動く(指より少し上)。そこから上へサッとはじくと投げる。はじくのが速すぎると上へ、おそすぎると下へ、ななめだと横へずれる。1ターン3本。15〜20とブルを3回ずつ当てるとクローズ。自分だけクローズした数字に当てると点。全部クローズして点が上(か同じ)なら勝ち。',
  options: [{ key: 'rd', label: 'ラウンド数(上限)', choices: [[8, '8'], [15, '15'], [20, '20']], def: 15 }],
  start(host) {
    const box = host.box, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2;
    const RD = host.opts.trial ? 4 : host.opts.rd || 15;
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block'; box.appendChild(renderer.domElement);
    const ov = document.createElement('canvas'); ov.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; box.appendChild(ov); const g = ov.getContext('2d');
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x2b2438);
    const cam = new THREE.PerspectiveCamera(24, 1, 0.05, 30);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x443355, 1.4)); const sp = new THREE.SpotLight(0xfff2dd, 30, 8, 0.6, 0.5); sp.position.set(0, 2.6, 1.4); sp.target.position.set(0, 1.73, 0); scene.add(sp, sp.target);
    // ボード(キャンバスで描く)
    const tex = (() => {
      const c = document.createElement('canvas'), N = 1024; c.width = c.height = N; const x = c.getContext('2d'), k = N / 2 / RR.edge, cx = N / 2;
      x.fillStyle = '#1b1b1b'; x.beginPath(); x.arc(cx, cx, N / 2, 0, 7); x.fill();
      const ring = (r0, r1, cols) => { for (let i = 0; i < 20; i++) { const a0 = (i * 18 - 9 - 90) * Math.PI / 180, a1 = a0 + 18 * Math.PI / 180; x.fillStyle = cols[i % 2]; x.beginPath(); x.arc(cx, cx, r1 * k, a0, a1); x.arc(cx, cx, r0 * k, a1, a0, true); x.fill(); } };
      ring(RR.bo, RR.ti, ['#1c1c1c', '#f2e6c8']); ring(RR.ti, RR.to, ['#d23a3a', '#2f9a52']); ring(RR.to, RR.di, ['#1c1c1c', '#f2e6c8']); ring(RR.di, RR.do, ['#d23a3a', '#2f9a52']);
      x.fillStyle = '#2f9a52'; x.beginPath(); x.arc(cx, cx, RR.bo * k, 0, 7); x.fill(); x.fillStyle = '#d23a3a'; x.beginPath(); x.arc(cx, cx, RR.bi * k, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.font = `bold ${N * 0.05}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
      ORDER.forEach((n, i) => { const a = (i * 18 - 90) * Math.PI / 180, r = 196 * k; x.fillStyle = TARGETS.includes(n) ? '#ffe08a' : '#fff'; x.fillText(String(n), cx + Math.cos(a) * r, cx + Math.sin(a) * r); });
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
    })();
    const BOARD_Y = 1.73, SC = 0.001;   // mm → m
    const board = new THREE.Mesh(new THREE.CircleGeometry(RR.edge * SC, 64), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })); board.position.set(0, BOARD_Y, 0); scene.add(board);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshStandardMaterial({ color: 0x4a3d66 })); wall.position.set(0, 1.6, -0.02); scene.add(wall);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(RR.edge * SC, 0.012, 8, 64), new THREE.MeshStandardMaterial({ color: 0x8a8aa0, metalness: 0.6 })); rim.position.copy(board.position); scene.add(rim);
    const dartGeo = (() => { const gr = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7 })); b.rotation.x = Math.PI / 2; gr.add(b); return gr; })();
    const darts = [];
    function newDart(col) { const d = dartGeo.clone(); const f = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.04, 4), new THREE.MeshStandardMaterial({ color: col })); f.rotation.x = -Math.PI / 2; f.position.z = 0.07; d.add(f); scene.add(d); darts.push(d); return d; }
    function resize() { const W = box.clientWidth || 300, H = box.clientHeight || 300; renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); ov.width = W * 2; ov.height = H * 2; }
    resize(); const ro = new ResizeObserver(resize); ro.observe(box);
    cam.position.set(0, BOARD_Y + 0.07, 2.37); cam.lookAt(0, BOARD_Y + 0.07, 0);   // 上の表にかくれないよう、ボードを画面の少し下に   // 表にかくれないよう、ボードを少し上に
    // ---- 試合 ----
    const P = [0, 1].map(() => ({ marks: { 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 25: 0 }, pts: 0 }));
    let turn = 0, dartN = 0, round = 1, phase = 'aim', aim = null, fly = null, msg = '', msgT = 0, over = false, cpuT = 1.2, t = 0;
    const closedAll = s => TARGETS.every(n => P[s].marks[n] >= 3);
    function apply(s, hitR) {
      const { n, m } = hitR; if (!TARGETS.includes(n) || !m) { msg = n ? `${n}(関係なし)` : 'はずれ'; return; }
      const me = P[s], op = P[1 - s]; let add = 0, mk = m;
      for (let i = 0; i < mk; i++) { if (me.marks[n] < 3) me.marks[n]++; else if (op.marks[n] < 3) add += n; }
      me.pts += add; msg = `${m === 3 ? 'トリプル ' : m === 2 ? (n === 25 ? 'インブル ' : 'ダブル ') : ''}${n === 25 ? 'ブル' : n}${add ? `  +${add}点` : ''}`;
      sfx.play(m >= 2 ? 'item' : 'ok');
    }
    function nextDart() {
      dartN++;
      if (closedAll(turn) && P[turn].pts >= P[1 - turn].pts) return finish(turn);
      if (dartN >= 3) { dartN = 0; turn = 1 - turn; if (turn === 0) round++; darts.splice(0).forEach(d => scene.remove(d)); msg = `${host.players[turn].name}の番`; msgT = 1.2; cpuT = 1.4; if (round > RD) { const a = P[0].pts, b = P[1].pts, ma = Object.values(P[0].marks).reduce((x, y) => x + y, 0), mb = Object.values(P[1].marks).reduce((x, y) => x + y, 0); return finish(a > b ? 0 : b > a ? 1 : ma > mb ? 0 : mb > ma ? 1 : -1); } }
      phase = 'aim';
    }
    function finish(w) { over = true; phase = 'end'; sfx.play('win'); setTimeout(() => host.end({ winner: w, score: [P[0].pts, P[1].pts] }), 1600); }
    function throwAt(mm) { fly = { to: mm, t: 0, d: newDart(turn ? '#5aa8f0' : '#ff7aa2') }; phase = 'fly'; sfx.play('whoosh'); }
    // 画面 → ボードの mm
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), pl = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), v = new THREE.Vector3();
    function toMM(cx, cy) { const r = renderer.domElement.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); if (!ray.ray.intersectPlane(pl, v)) return null; return [v.x / SC, (v.y - BOARD_Y) / SC]; }
    const OFF = 110;   // ねらいは指より上
    const cv = renderer.domElement;
    const mine = () => phase === 'aim' && !over && (two || turn === 0);
    window.__darts = () => ({ phase, turn, dartN, msg, aim: !!aim, P });   // テスト用
    cv.addEventListener('pointerdown', e => { if (!mine()) return; aim = { pts: [[e.clientX, e.clientY, performance.now()]], cur: toMM(e.clientX, e.clientY - OFF) }; try { cv.setPointerCapture(e.pointerId); } catch (_) { } });
    cv.addEventListener('pointermove', e => { if (!aim) return; aim.pts.push([e.clientX, e.clientY, performance.now()]); if (aim.pts.length > 40) aim.pts.shift(); const p = toMM(e.clientX, e.clientY - OFF); if (p) aim.cur = p; });   // ゆっくり動かす=ねらう(指より上をねらう)
    cv.addEventListener('pointerup', e => {   // 上へサッとはじく=投げる。はじく速さで上下、向きで左右がずれる
      if (!aim) return; const a = aim; aim = null; const Pt = a.pts, end = [e.clientX, e.clientY, performance.now()];
      let st = end; for (let k = Pt.length - 1; k >= 0; k--) { const q = Pt[k], sv = (q[1] - st[1]) / Math.max(1, st[2] - q[2]); if (sv < 0.25) break; st = q; }   // はじき始め(すばやく上へ動き出した所)
      const dt = Math.max(16, end[2] - st[2]), up = st[1] - end[1], v = up / dt; if (up < 40 || v < 0.35) { msg = '上へサッとはじいて投げよう'; msgT = 1.2; return; }
      const base = toMM(st[0], st[1] - OFF) || a.cur; if (!base) return;
      const ey = (v - 1.5) * 38, ex = clamp((end[0] - st[0]) / Math.max(20, up), -1, 1) * 120, wob = () => (Math.random() - 0.5) * 8;
      throwAt([base[0] + ex + wob(), base[1] + ey + wob()]);
    });
    function cpuThrow() {
      const me = P[1], op = P[0];
      let n = TARGETS.find(x => me.marks[x] < 3 && x !== 25) ?? 25;
      const scoring = TARGETS.find(x => me.marks[x] >= 3 && op.marks[x] < 3 && x !== 25);
      if (scoring && me.pts <= op.pts && Math.random() < 0.5) n = scoring;
      const [ax, ay] = aimPoint(n, n === 25 ? 1 : 3), err = [0, 38, 24, 14][lv], gx = () => (Math.random() + Math.random() + Math.random() - 1.5) * err;
      throwAt([ax + gx(), ay + gx()]);
    }
    const stop = loop(dt => {
      t += dt; msgT = Math.max(0, msgT - dt);

      if (phase === 'aim' && !two && turn === 1 && !over) { cpuT -= dt; if (cpuT <= 0) { cpuThrow(); cpuT = 0.9; } }
      if (phase === 'fly' && fly) {
        fly.t += dt / 0.32; const k = Math.min(1, fly.t), x = fly.to[0] * SC, y = BOARD_Y + fly.to[1] * SC;
        fly.d.position.set(x * k + 0.05 * (1 - k), y * k + (BOARD_Y - 0.25) * (1 - k) + Math.sin(k * Math.PI) * 0.12, 2.1 * (1 - k) + 0.05); fly.d.rotation.set(-0.15 * (1 - k), 0, 0);
        if (k >= 1) { sfx.play('hit'); apply(turn, score(fly.to[0], fly.to[1])); msgT = 1.3; fly = null; phase = 'wait'; t = 0; }
      }
      if (phase === 'wait' && t > 0.7) nextDart();
      renderer.render(scene, cam); hud();
    });
    function hud() {
      const W = ov.width / 2, H = ov.height / 2; g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, W, H);
      // クリケットの表
      const x0 = 8, y0 = 8, cw = (W - 16) / 3, rh = 17;
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(x0, y0, W - 16, rh * 9 + 4);
      txt(g, host.players[0].name, x0 + cw / 2, y0 + 10, { size: 11, color: COL.p1d, maxW: cw - 4 }); txt(g, `R${Math.min(round, RD)}/${RD}`, x0 + cw * 1.5, y0 + 10, { size: 10, color: '#8d7f9e' }); txt(g, host.players[1].name, x0 + cw * 2.5, y0 + 10, { size: 11, color: COL.p2d, maxW: cw - 4 });
      const mk = n => ['', '/', '✕', '⊗'][Math.min(3, n)];
      TARGETS.forEach((n, i) => { const y = y0 + 10 + (i + 1) * rh; txt(g, mk(P[0].marks[n]), x0 + cw / 2, y, { size: 14, color: P[0].marks[n] >= 3 ? '#3fbf6a' : INK }); txt(g, n === 25 ? 'BULL' : String(n), x0 + cw * 1.5, y, { size: 12, color: INK }); txt(g, mk(P[1].marks[n]), x0 + cw * 2.5, y, { size: 14, color: P[1].marks[n] >= 3 ? '#3fbf6a' : INK }); });
      const yp = y0 + 10 + 8 * rh; txt(g, String(P[0].pts), x0 + cw / 2, yp, { size: 14, color: COL.p1d }); txt(g, '点', x0 + cw * 1.5, yp, { size: 11 }); txt(g, String(P[1].pts), x0 + cw * 2.5, yp, { size: 14, color: COL.p2d });
      // ねらい
      if (aim && aim.cur) { const p = new THREE.Vector3(aim.cur[0] * SC, BOARD_Y + aim.cur[1] * SC, 0).project(cam), sx = (p.x + 1) / 2 * W, sy = (1 - p.y) / 2 * H; g.strokeStyle = '#ffd36b'; g.lineWidth = 2.5; g.beginPath(); g.arc(sx, sy, 10, 0, 7); g.stroke(); g.beginPath(); g.moveTo(sx - 16, sy); g.lineTo(sx + 16, sy); g.moveTo(sx, sy - 16); g.lineTo(sx, sy + 16); g.stroke();
        const r = renderer.domElement.getBoundingClientRect(), f = aim.pts[aim.pts.length - 1]; txt(g, '🎯', f[0] - r.left, f[1] - r.top, { size: 30 }); }
      txt(g, `${'🎯'.repeat(3 - dartN)}`, W - 14, H - 26, { size: 16, align: 'right' });
      if (msgT > 0) txt(g, msg, W / 2, H * 0.78, { size: 22, color: '#ffd36b', stroke: '#2b2438', sw: 5 });
      if (phase === 'aim' && !over) txt(g, (two || turn === 0) ? `${host.players[turn].name}の番:ゆっくり動かして ねらう → 上へサッとはじいて投げる` : `${host.players[1].name}が ねらっている…`, W / 2, H - 26, { size: 12, color: '#fff', stroke: '#2b2438', sw: 4 });
    }
    return { stop() { stop(); ro.disconnect(); renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove(); ov.remove(); } };
  },
};
