// 雪合戦(冬だけ・ゲーム機なしでも遊べる)。2×2のチーム戦。
//   自分にさわって長おし=雪玉をつくる(長いほど大きい S→M→L→MAX。つくる間は動けない)
//   雪玉を持って、自分からフリック=その向きへ投げる。MAX は引っぱって放す(放物線で飛んで、地面で8方向に飛び散る)
//   ⛄ボタン=持っている雪玉で雪だるまの盾(近くの雪だるまに足すと大きくなる)。はなれた所をドラッグ=移動
import { surface, pointers, loop, txt, banner, rr, clamp, btn, hit, COL, INK, CPUS, shuffle } from '../kit.js';

const MAKE = [0.4, 0.95, 1.6, 2.5];   // S・M・L・MAX になるまでの秒
const SZ = [null, { r: 5, dmg: 1, sp: 540, n: 'S' }, { r: 7, dmg: 2, sp: 480, n: 'M' }, { r: 10, dmg: 3, sp: 420, n: 'L' }, { r: 14, dmg: 3, n: 'MAX' }];
const HP = 8;
export default {
  id: 'snow', free: 1, title: '雪合戦', icon: '⛄', desc: '冬だけ!2対2の雪合戦',
  rule: '自分にさわって長おしで雪玉(長いほど大きい。つくる間は動けない)。持ったら自分からフリックで投げる。いちばん大きい雪玉(MAX)は、引っぱって放すと放物線で飛んで、地面で8方向に飛び散る。⛄ボタンで雪だるまの盾。はなれた所をドラッグで移動。相手チームを2人ともダウンさせたらラウンドの勝ち。',
  options: [
    { key: 'to', label: '何ラウンド先取', choices: [[1, '1本'], [2, '2本'], [3, '3本']], def: 2 },
    { key: 'team', label: '2人で遊ぶとき', choices: [['vs', '対戦(それぞれに助っ人NPC)'], ['coop', '2人で協力 vs NPCチーム']], def: 'vs', only: (o, opp) => opp === '2p' },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, sfx = host.sfx, O = host.opts;
    const TO = O.trial ? 1 : O.to || 2, COOP = two && O.team === 'coop';
    let W = S.W, H = S.H, u = 1;
    const layout = () => { S.resize(); W = S.W; H = S.H; u = Math.min(W, H * 0.62) / 400; };
    layout(); const ro = new ResizeObserver(layout); ro.observe(host.box);
    const FR = () => 15 * u;
    // ---- チーム ----
    const enemyLead = host.players[1], elv = enemyLead.cpu ? enemyLead.cpu.lv : 2;
    const pool = shuffle(CPUS.filter(c => !enemyLead.cpu || c.id !== enemyLead.cpu.id));
    const mk = (team, name, human, lv) => ({ team, name, human, lv, x: 0, y: 0, hp: HP, down: false, hold: 0, make: -1, flash: 0, ctrl: null, kx: 0, ky: 0, ai: { t: 0, goal: null, want: 1 }, pull: null, label: 0 });
    const F = COOP
      ? [mk(0, 'プレイヤー1', 0, 2), mk(0, 'プレイヤー2', 1, 2), mk(1, pool[0].name, -1, 2), mk(1, pool[1].name, -1, 2)]
      : two ? [mk(0, 'プレイヤー1', 0, 2), mk(0, pool[0].name + '(助っ人)', -1, 2), mk(1, 'プレイヤー2', 1, 2), mk(1, pool[1].name + '(助っ人)', -1, 2)]
        : [mk(0, host.players[0].name, 0, 2), mk(0, pool[0].name + '(助っ人)', -1, 2), mk(1, enemyLead.name, -1, elv), mk(1, pool[1].name, -1, Math.max(1, elv - 1))];
    const humans = F.filter(f => f.human >= 0).sort((a, b) => a.human - b.human);
    const wins = [0, 0];
    let walls = [], men = [], shots = [], lobs = [], frags = [], splats = [], puffs = [], floats = [];
    let round = 1, count = 2.6, over = false, endT = -1, roundWin = -1, t = 0;
    const flakes = Array.from({ length: 36 }, () => ({ x: Math.random(), y: Math.random(), v: 0.3 + Math.random() * 0.7 }));
    function reset() {
      const xs = [0.3, 0.7];
      F.forEach(f => { const i = F.filter(o => o.team === f.team).indexOf(f); f.x = W * xs[i]; f.y = f.team === 0 ? H * 0.86 : H * 0.14; f.hp = HP; f.down = false; f.hold = 0; f.make = -1; f.ctrl = null; f.pull = null; f.ai = { t: Math.random(), goal: null, want: 1 }; });
      walls = [[0.2, 0.66], [0.5, 0.6], [0.8, 0.68], [0.2, 0.34], [0.5, 0.4], [0.8, 0.32]].map(([x, y]) => ({ x: x * W, y: y * H, hp: 5, max: 5 }));
      men = []; shots = []; lobs = []; frags = []; splats = []; count = 2.4; roundWin = -1; endT = -1;
    }
    reset();
    const half = f => f.team === 0 ? [H / 2 + FR() + 4, H - FR() - 4] : [FR() + 4, H / 2 - FR() - 4];
    const wallR = () => 24 * u, manR = m => (9 + Math.min(9, m.hp) * 1.6) * u;
    const sizeOf = tm => MAKE.filter(x => tm >= x).length;
    // ---- 動作 ----
    function startMake(f) { if (f.down || f.hold || f.make >= 0) return; f.make = 0; f.ctrl = null; }
    function endMake(f) { if (f.make < 0) return; const s = sizeOf(f.make); f.make = -1; if (s > 0) { f.hold = s; sfx.play('pop'); } }
    function throwDir(f, dx, dy) {
      const L = Math.hypot(dx, dy); if (!f.hold || f.hold >= 4 || L < 1) return; const z = SZ[f.hold];
      shots.push({ x: f.x, y: f.y, vx: dx / L * z.sp * u, vy: dy / L * z.sp * u, s: f.hold, team: f.team, life: 1.5 }); f.hold = 0; sfx.play('throw');
    }
    function lob(f, tx, ty) {
      if (f.hold !== 4) return; const d = Math.hypot(tx - f.x, ty - f.y);
      lobs.push({ x0: f.x, y0: f.y, x1: clamp(tx, 10, W - 10), y1: clamp(ty, 10, H - 10), u: 0, T: 0.7 + d / (900 * u), team: f.team }); f.hold = 0; sfx.play('whoosh');
    }
    function buildMan(f) {
      if (f.hold < 2 || f.down) return false;
      const dy = f.team === 0 ? -1 : 1, [y0, y1] = half(f), x = f.x, y = clamp(f.y + dy * FR() * 2, y0, y1);
      const near = men.find(m => m.team === f.team && Math.hypot(m.x - x, m.y - y) < 34 * u);
      if (near) near.hp = Math.min(9, near.hp + f.hold); else men.push({ x, y, hp: f.hold + 1, team: f.team, t: 0 });
      f.hold = 0; sfx.play('pop'); return true;
    }
    function damage(f, dmg, from) {
      if (f.down) return; f.hp -= dmg; f.flash = 0.4; f.make = -1; sfx.play('splat'); floats.push({ x: f.x, y: f.y - FR() * 2, s: `-${dmg}`, t: 0.9 });
      if (from) { const L = Math.hypot(from.vx || 0, from.vy || 0) || 1; f.kx += (from.vx || 0) / L * 90 * u; f.ky += (from.vy || 0) / L * 90 * u; }
      if (f.hp <= 0) { f.hp = 0; f.down = true; f.hold = 0; f.ctrl = null; sfx.play('boom'); }
    }
    function splash(x, y, r, n = 8) { splats.push({ x, y, r: r * (1.4 + Math.random() * 0.6), t: 4, rot: Math.random() * 6 }); for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = (60 + Math.random() * 140) * u; puffs.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0.35 + Math.random() * 0.3, r: (1.5 + Math.random() * 2.5) * u }); } }
    // ---- 入力 ----
    const btnRect = h => { const w = 86, hh = 46; if (two && !COOP && h === 1) return { x: 10, y: 10, w, h: hh, flip: true }; if (COOP) return h === 0 ? { x: 10, y: H - hh - 10, w, h: hh } : { x: W - w - 10, y: H - hh - 10, w, h: hh }; return { x: W - w - 10, y: H - hh - 10, w, h: hh }; };
    const zone = p => !two ? 0 : COOP ? (p.x < W / 2 ? 0 : 1) : p.side;
    const ptr = new Map();
    const pt = pointers(S.cv, {
      onDown: p => {
        if (over || count > 0) return; const h = zone(p), f = humans[h]; if (!f || f.down) return;
        if (hit(btnRect(h), p)) { buildMan(f); return; }
        const near = Math.hypot(p.x - f.x, p.y - f.y) < FR() * 2.8;
        if (near) { ptr.set(p.id, { h, kind: 'char', sx: p.x, sy: p.y, t0: t }); if (!f.hold) startMake(f); else if (f.hold === 4) f.pull = { dx: 0, dy: 0 }; }
        else { ptr.set(p.id, { h, kind: 'move', sx: p.x, sy: p.y }); if (f.make < 0) f.ctrl = { x: 0, y: 0 }; }
      },
      onMove: p => {
        const q = ptr.get(p.id); if (!q) return; const f = humans[q.h], dx = p.x - q.sx, dy = p.y - q.sy;
        if (q.kind === 'move') { if (f.make >= 0) return; const L = Math.hypot(dx, dy), k = Math.min(1, L / (46 * u)); f.ctrl = L > 4 ? { x: dx / L * k, y: dy / L * k } : { x: 0, y: 0 }; }
        else if (f.hold === 4 && f.pull) f.pull = { dx, dy };
        else if (f.hold) f.aim = { dx, dy };
      },
      onUp: p => {
        const q = ptr.get(p.id); if (!q) return; ptr.delete(p.id); const f = humans[q.h], dx = p.x - q.sx, dy = p.y - q.sy, L = Math.hypot(dx, dy);
        if (q.kind === 'move') { f.ctrl = null; return; }
        if (f.make >= 0) { endMake(f); return; }
        f.aim = null;
        if (f.hold === 4 && f.pull) { f.pull = null; if (L > 26 * u) { const k = 2.6; lob(f, f.x - dx * k, f.y - dy * k); } return; }
        if (f.hold && L > 24 * u) throwDir(f, dx, dy);
      },
    });
    // ---- NPC ----
    const alive = team => F.filter(f => f.team === team && !f.down);
    function coverSpot(f) {
      const en = alive(1 - f.team); if (!en.length) return null; const e = en[Math.floor(Math.random() * en.length)];
      const [y0, y1] = half(f), cand = [...walls.filter(w => w.hp > 0).map(w => ({ x: w.x, y: w.y, r: wallR() })), ...men.filter(m => m.team === f.team && m.hp > 0).map(m => ({ x: m.x, y: m.y, r: manR(m) }))]
        .map(c => { const dx = c.x - e.x, dy = c.y - e.y, L = Math.hypot(dx, dy) || 1; return { x: c.x + dx / L * (c.r + FR() + 4 * u), y: c.y + dy / L * (c.r + FR() + 4 * u) }; })
        .filter(s => s.y > y0 && s.y < y1 && s.x > FR() && s.x < W - FR())
        .filter(s => !F.some(o => o !== f && o.team === f.team && o.ai.goal && Math.hypot(o.ai.goal.x - s.x, o.ai.goal.y - s.y) < 30 * u));
      if (!cand.length) return { x: clamp(f.x + (Math.random() - 0.5) * 120 * u, FR(), W - FR()), y: clamp(f.y + (Math.random() - 0.5) * 80 * u, y0, y1) };
      cand.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
      return cand[Math.random() < 0.7 ? 0 : Math.floor(Math.random() * cand.length)];
    }
    function npc(f, dt) {
      const A = f.ai, lv = f.lv; A.t -= dt;
      if (f.make >= 0) { if (f.make >= MAKE[A.want - 1] + 0.05) endMake(f); return; }
      if (A.t > 0) return; A.t = [0, 0.55, 0.38, 0.24][lv] * (0.7 + Math.random() * 0.6);
      // よける
      const inc = shots.find(s => s.team !== f.team && Math.hypot(s.x - f.x, s.y - f.y) < 140 * u && ((f.x - s.x) * s.vx + (f.y - s.y) * s.vy) > 0);
      if (inc && Math.random() < [0, 0.25, 0.45, 0.7][lv]) { const side = Math.sign(f.x - inc.x) || 1; A.goal = { x: clamp(f.x + side * 50 * u, FR(), W - FR()), y: f.y }; return; }
      const en = alive(1 - f.team); if (!en.length) return;
      if (!f.hold) {
        if (!A.goal || Math.hypot(A.goal.x - f.x, A.goal.y - f.y) < 8 * u) {
          if (A.goal && !A.peek) { const r = Math.random(); A.want = r < [0, 0.08, 0.13, 0.18][lv] ? 4 : r < 0.4 ? 3 : r < 0.72 ? 2 : 1; f.ctrl = null; startMake(f); A.goal = null; return; }
          A.peek = false; A.goal = coverSpot(f);
        }
        return;
      }
      // 雪だるまの盾をつくる
      if (f.hold >= 2 && f.hold < 4 && men.filter(m => m.team === f.team).length < 3 && Math.random() < 0.12) { buildMan(f); A.goal = null; return; }
      // ねらって投げる(少し横に出てから)
      const e = en.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))[0];
      if (!A.peek) { A.peek = true; A.goal = { x: clamp(f.x + (Math.random() < 0.5 ? -1 : 1) * 34 * u, FR(), W - FR()), y: f.y }; A.t = 0.35; return; }
      const err = [0, 0.2, 0.12, 0.06][lv];
      if (f.hold === 4) { lob(f, e.x + (Math.random() - 0.5) * 60 * u * err * 5, e.y + (Math.random() - 0.5) * 40 * u * err * 5); }
      else {
        const sp = SZ[f.hold].sp * u, d = Math.hypot(e.x - f.x, e.y - f.y), lead = d / sp, ex = e.x + (e.vx || 0) * lead * 0.8, ey = e.y + (e.vy || 0) * lead * 0.8;
        const a = Math.atan2(ey - f.y, ex - f.x) + (Math.random() - 0.5) * err * 2; throwDir(f, Math.cos(a), Math.sin(a));
      }
      A.peek = false; A.goal = coverSpot(f);
    }
    // ---- 進める ----
    function collideCircle(f) {
      for (const c of [...walls.filter(w => w.hp > 0).map(w => [w.x, w.y, wallR()]), ...men.filter(m => m.hp > 0).map(m => [m.x, m.y, manR(m)])]) {
        const dx = f.x - c[0], dy = f.y - c[1], d = Math.hypot(dx, dy), m = c[2] + FR() * 0.8; if (d < m && d > 0.01) { f.x = c[0] + dx / d * m; f.y = c[1] + dy / d * m; }
      }
    }
    function step(dt) {
      F.forEach(f => {
        f.flash = Math.max(0, f.flash - dt); const ox = f.x, oy = f.y;
        if (f.down) return;
        if (f.make >= 0) f.make += dt;
        if (f.human < 0) npc(f, dt);
        let vx = 0, vy = 0; const base = 150 * u * (f.hold === 4 ? 0.5 : 1);
        if (f.make < 0) {
          if (f.human >= 0 && f.ctrl) { vx = f.ctrl.x * base; vy = f.ctrl.y * base; }
          else if (f.human < 0 && f.ai.goal) { const dx = f.ai.goal.x - f.x, dy = f.ai.goal.y - f.y, d = Math.hypot(dx, dy); if (d > 3) { const sp = Math.min(base * [0, 0.75, 0.9, 1][f.lv], d / dt); vx = dx / d * sp; vy = dy / d * sp; } }
        }
        f.x += (vx + f.kx) * dt; f.y += (vy + f.ky) * dt; f.kx *= Math.pow(0.02, dt); f.ky *= Math.pow(0.02, dt);
        const [y0, y1] = half(f); f.x = clamp(f.x, FR(), W - FR()); f.y = clamp(f.y, y0, y1); collideCircle(f);
        f.vx = (f.x - ox) / dt; f.vy = (f.y - oy) / dt;
      });
      // まっすぐの雪玉・かけら
      const hitStuff = (b, r, dmg) => {
        for (const f of F) if (f.team !== b.team && !f.down && Math.hypot(f.x - b.x, f.y - b.y) < FR() + r) { damage(f, dmg, b); splash(b.x, b.y, r); return true; }
        for (const w of walls) if (w.hp > 0 && Math.hypot(w.x - b.x, w.y - b.y) < wallR() + r * 0.6) { w.hp -= dmg * 0.5; splash(b.x, b.y, r, 5); sfx.play('wall'); return true; }
        for (const m of men) if (m.hp > 0 && Math.hypot(m.x - b.x, m.y - b.y) < manR(m) + r * 0.6) { m.hp -= dmg; splash(b.x, b.y, r, 5); sfx.play('wall'); return true; }
        return false;
      };
      for (let i = shots.length - 1; i >= 0; i--) { const b = shots[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (hitStuff(b, SZ[b.s].r * u, SZ[b.s].dmg) || b.life <= 0 || b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) { if (b.life <= 0) splash(b.x, b.y, SZ[b.s].r * u, 4); shots.splice(i, 1); } }
      for (let i = frags.length - 1; i >= 0; i--) { const b = frags[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (hitStuff(b, 4 * u, 1) || b.life <= 0) frags.splice(i, 1); }
      // MAX(放物線)
      for (let i = lobs.length - 1; i >= 0; i--) {
        const L = lobs[i]; L.u += dt / L.T; if (L.u < 1) continue; lobs.splice(i, 1);
        const x = L.x1, y = L.y1, R = 30 * u; sfx.play('boom'); splash(x, y, 16 * u, 16);
        for (const f of F) if (f.team !== L.team && !f.down && Math.hypot(f.x - x, f.y - y) < R + FR() * 0.6) damage(f, 3, { vx: f.x - x, vy: f.y - y });
        for (const w of walls) if (w.hp > 0 && Math.hypot(w.x - x, w.y - y) < R + wallR()) w.hp -= 1.5;
        for (const m of men) if (m.hp > 0 && Math.hypot(m.x - x, m.y - y) < R + manR(m)) m.hp -= 2;
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; frags.push({ x, y, vx: Math.cos(a) * 300 * u, vy: Math.sin(a) * 300 * u, life: 0.3, team: L.team }); }   // 8方向に飛び散る
      }
      men = men.filter(m => m.hp > 0); men.forEach(m => (m.t += dt));
      splats.forEach(s => (s.t -= dt)); splats = splats.filter(s => s.t > 0);
      puffs.forEach(p => { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; }); puffs = puffs.filter(p => p.t > 0);
      floats.forEach(p => { p.t -= dt; p.y -= 30 * dt; }); floats = floats.filter(p => p.t > 0);
      // ラウンドの決着
      if (roundWin < 0) for (const tm of [0, 1]) if (!alive(tm).length) {
        roundWin = 1 - tm; wins[roundWin]++; endT = 2.6; sfx.play(roundWin === 0 ? 'win' : 'lose');
        if (wins[roundWin] >= TO) { over = true; const hw = COOP ? (roundWin === 0 ? 0 : 1) : roundWin; setTimeout(() => host.end({ winner: hw, score: wins, text: COOP ? (roundWin === 0 ? '2人の協力で勝利!' : 'NPCチームの勝ち') : null }), 2400); }
        break;
      }
    }
    const stop = loop(dt => {
      t += dt;
      if (count > -1) { const c0 = Math.ceil(count); count -= dt; if (count > 0 && Math.ceil(count) !== c0) sfx.play('count'); if (count <= 0 && c0 === 1) sfx.play('go'); }
      if (count <= 0 && !(roundWin >= 0 && over)) step(dt);
      if (endT > 0) { endT -= dt; if (endT <= 0 && !over) { round++; reset(); } }
      draw();
    });
    // ---- 描く ----
    function person(f) {
      const r = FR(), col = f.team ? COL.p2 : COL.p1;
      g.fillStyle = 'rgba(60,80,120,0.18)'; g.beginPath(); g.ellipse(f.x, f.y + r * 0.8, r * 1.1, r * 0.45, 0, 0, 7); g.fill();
      if (f.down) { g.fillStyle = '#b9b3c6'; g.beginPath(); g.ellipse(f.x, f.y + r * 0.3, r * 1.3, r * 0.6, 0, 0, 7); g.fill(); txt(g, '😵', f.x, f.y, { size: r * 1.2 }); txt(g, 'ダウン', f.x, f.y + r * 1.5, { size: 10, color: '#8d7f9e' }); return; }
      const bob = f.make >= 0 ? 2 : 0;
      g.fillStyle = f.flash > 0 ? '#ffffff' : col; g.beginPath(); g.arc(f.x, f.y + bob, r, 0, 7); g.fill();
      g.strokeStyle = f.human >= 0 ? '#ffd36b' : 'rgba(0,0,0,0.12)'; g.lineWidth = f.human >= 0 ? 3 : 1.5; g.stroke();
      g.fillStyle = '#ffe0c8'; g.beginPath(); g.arc(f.x, f.y - r * 0.15 + bob, r * 0.55, 0, 7); g.fill();
      g.fillStyle = f.team ? '#3b7fc4' : '#d4517c'; g.beginPath(); g.arc(f.x, f.y - r * 0.35 + bob, r * 0.58, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(f.x, f.y - r * 0.95 + bob, r * 0.18, 0, 7); g.fill();
      if (f.flash > 0) { g.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(f.x + Math.cos(i * 1.3) * r * 0.6, f.y + Math.sin(i * 1.3) * r * 0.5, r * 0.3, 0, 7); g.fill(); } }
      // HP
      for (let i = 0; i < HP; i++) { g.fillStyle = i < f.hp ? (f.team ? COL.p2 : COL.p1) : '#e6e0ee'; g.fillRect(f.x - HP * 4 + i * 8, f.y - r * 1.75, 6, 4); }
      txt(g, f.name, f.x, f.y + r * 1.55, { size: 9.5, color: f.team ? COL.p2d : COL.p1d, flip: two && !COOP && f.team === 1 && f.human >= 0 });
      // 手の雪玉・つくっている雪玉
      const dir = f.team === 0 ? -1 : 1;
      if (f.make >= 0) {
        const s = sizeOf(f.make), nxt = MAKE[s] ?? MAKE[3], prev = s ? MAKE[s - 1] : 0, k = s >= 4 ? 1 : (f.make - prev) / (nxt - prev);
        const br = (3 + s * 3 + k * 3) * u; g.fillStyle = '#fff'; g.strokeStyle = '#c9d6ea'; g.lineWidth = 1.5; g.beginPath(); g.arc(f.x + r * 0.9, f.y + r * 0.6, br, 0, 7); g.fill(); g.stroke();
        g.strokeStyle = s >= 4 ? '#ff7aa2' : '#5aa8f0'; g.lineWidth = 3; g.beginPath(); g.arc(f.x, f.y, r * 1.45, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, k)); g.stroke();
        if (s) txt(g, SZ[s].n, f.x + r * 1.9, f.y - r * 0.6, { size: 11, color: s >= 4 ? '#ff5a5a' : INK, stroke: '#fff', sw: 3 });
      } else if (f.hold) {
        const br = SZ[f.hold].r * u; g.fillStyle = '#fff'; g.strokeStyle = '#c9d6ea'; g.lineWidth = 1.5; g.beginPath(); g.arc(f.x + r * 0.85, f.y + dir * r * 0.5, br, 0, 7); g.fill(); g.stroke();
      }
      // ねらい
      if (f.pull) { const k = 2.6, tx = f.x - f.pull.dx * k, ty = f.y - f.pull.dy * k; g.setLineDash([4, 5]); g.strokeStyle = 'rgba(255,90,90,0.8)'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 16; i++) { const q = i / 16, x = f.x + (tx - f.x) * q, y = f.y + (ty - f.y) * q - Math.sin(q * Math.PI) * 60 * u; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]); g.beginPath(); g.arc(tx, ty, 30 * u, 0, 7); g.stroke(); g.strokeStyle = 'rgba(90,90,90,0.5)'; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x + f.pull.dx, f.y + f.pull.dy); g.stroke(); }
      else if (f.aim && Math.hypot(f.aim.dx, f.aim.dy) > 10) { const L = Math.hypot(f.aim.dx, f.aim.dy); g.strokeStyle = 'rgba(90,168,240,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x + f.aim.dx / L * 70 * u, f.y + f.aim.dy / L * 70 * u); g.stroke(); }
    }
    function draw() {
      S.begin();
      let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#eaf3ff'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#f2f7ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(90,168,240,0.06)'; g.fillRect(0, 0, W, H / 2); g.fillStyle = 'rgba(255,122,162,0.06)'; g.fillRect(0, H / 2, W, H / 2);
      g.setLineDash([8, 8]); g.strokeStyle = 'rgba(120,140,180,0.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke(); g.setLineDash([]);
      splats.forEach(s => { g.save(); g.globalAlpha = Math.min(1, s.t / 1.5) * 0.9; g.translate(s.x, s.y); g.rotate(s.rot); g.fillStyle = '#ffffff'; g.strokeStyle = '#dde7f5'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, rr0 = s.r * (0.7 + ((i * 7) % 5) * 0.12); i ? g.lineTo(Math.cos(a) * rr0, Math.sin(a) * rr0) : g.moveTo(Math.cos(a) * rr0, Math.sin(a) * rr0); } g.closePath(); g.fill(); g.stroke(); g.restore(); });
      walls.forEach(w => { if (w.hp <= 0) return; const r = wallR() * (0.7 + 0.3 * w.hp / w.max); g.fillStyle = 'rgba(80,100,140,0.15)'; g.beginPath(); g.ellipse(w.x, w.y + r * 0.5, r * 1.2, r * 0.5, 0, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.strokeStyle = '#c9d6ea'; g.lineWidth = 2; g.beginPath(); g.ellipse(w.x, w.y, r * 1.15, r * 0.85, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = 'rgba(200,215,240,0.6)'; g.beginPath(); g.ellipse(w.x - r * 0.2, w.y + r * 0.2, r * 0.7, r * 0.4, 0, 0, 7); g.fill(); });
      men.forEach(m => { const r = manR(m), k = Math.min(1, m.t * 5); g.save(); g.translate(m.x, m.y); g.scale(k, k); g.fillStyle = 'rgba(80,100,140,0.15)'; g.beginPath(); g.ellipse(0, r * 0.7, r * 1.1, r * 0.4, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.strokeStyle = m.team ? COL.p2 : COL.p1; g.lineWidth = 2; g.beginPath(); g.arc(0, r * 0.15, r, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -r * 0.85, r * 0.62, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(-r * 0.2, -r * 0.92, 1.6, 0, 7); g.arc(r * 0.2, -r * 0.92, 1.6, 0, 7); g.fill(); g.fillStyle = '#ff9a4a'; g.beginPath(); g.moveTo(0, -r * 0.8); g.lineTo(r * 0.35, -r * 0.72); g.lineTo(0, -r * 0.68); g.fill(); g.restore(); txt(g, String(Math.ceil(m.hp)), m.x + r, m.y - r, { size: 9, color: '#8d7f9e' }); });
      F.slice().sort((a, b) => a.y - b.y).forEach(person);
      shots.forEach(b => { const r = SZ[b.s].r * u; g.fillStyle = 'rgba(80,100,140,0.2)'; g.beginPath(); g.ellipse(b.x, b.y + 8 * u, r, r * 0.4, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.strokeStyle = '#b8c8e0'; g.lineWidth = 1.5; g.beginPath(); g.arc(b.x, b.y, r, 0, 7); g.fill(); g.stroke(); });
      frags.forEach(b => { g.fillStyle = '#fff'; g.strokeStyle = '#b8c8e0'; g.beginPath(); g.arc(b.x, b.y, 4 * u, 0, 7); g.fill(); g.stroke(); });
      lobs.forEach(L => { const q = Math.min(1, L.u), x = L.x0 + (L.x1 - L.x0) * q, y = L.y0 + (L.y1 - L.y0) * q, z = Math.sin(q * Math.PI) * 120 * u, r = 14 * u * (1 + z / (240 * u)); g.fillStyle = 'rgba(80,100,140,0.22)'; g.beginPath(); g.ellipse(x, y, r, r * 0.45, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,90,90,0.5)'; g.lineWidth = 2; g.beginPath(); g.arc(L.x1, L.y1, 30 * u, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.strokeStyle = '#b8c8e0'; g.beginPath(); g.arc(x, y - z, r, 0, 7); g.fill(); g.stroke(); });
      puffs.forEach(p => { g.globalAlpha = Math.min(1, p.t * 3); g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); g.globalAlpha = 1; });
      floats.forEach(p => txt(g, p.s, p.x, p.y, { size: 14, color: '#ff5a5a', stroke: '#fff', sw: 3 }));
      g.fillStyle = 'rgba(255,255,255,0.8)'; flakes.forEach(f => { f.y += 0.0016 * f.v; if (f.y > 1) { f.y = 0; f.x = Math.random(); } g.beginPath(); g.arc(f.x * W + Math.sin(t + f.v * 9) * 6, f.y * H, 1.2 + f.v, 0, 7); g.fill(); });
      // ボタン・スコア
      humans.forEach((f, h) => { const b = btnRect(h), ok = f.hold >= 2 && f.hold < 5 && !f.down; btn(g, { ...b, label: '⛄ 盾にする' }, { size: 13, flip: !!b.flip, fill: ok ? '#fff' : '#f0f0f6', color: ok ? INK : '#b8aec4', border: ok ? (f.team ? COL.p2 : COL.p1) : null, alpha: ok ? 1 : 0.7 }); });
      const sc = `${wins[0]} - ${wins[1]}`;
      txt(g, `R${round}  ${sc}`, two && !COOP ? W - 14 : W / 2, two && !COOP ? H / 2 + 14 : 16, { size: 12, align: two && !COOP ? 'right' : 'center', color: '#8d7f9e' });
      if (count > 0) { banner(g, S, two && !COOP, count > 0.4 ? (count > 1.6 ? `ラウンド ${round}` : String(Math.ceil(count))) : 'GO!', { size: count > 1.6 ? 30 : 50 }); if (round === 1 && count > 0.4) txt(g, '自分を長おし=雪玉  フリック=投げる  MAXは引っぱる', W / 2, H * 0.62, { size: 12, color: INK, stroke: '#fff', sw: 4 }); }
      if (roundWin >= 0 && endT > 0) banner(g, S, two && !COOP, `${roundWin === 0 ? (COOP || !two ? 'あなたのチーム' : 'プレイヤー1チーム') : (two && !COOP ? 'プレイヤー2チーム' : '相手チーム')} の勝ち!`, { size: 22, color: roundWin ? COL.p2 : COL.p1 });
    }
    return { stop() { stop(); pt.off(); ro.disconnect(); S.cv.remove(); } };
  },
};
