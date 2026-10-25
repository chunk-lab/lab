// 雪合戦(冬だけ。ゲーム機なしで町から)。指でうごく、止まると雪玉ができる、⛄ボタンで投げる
import { surface, pointers, loop, txt, banner, rr, clamp, btn, hit, COL, INK } from '../kit.js';

export default {
  id: 'snow', title: '雪合戦', icon: '⛄', desc: '冬だけ!雪玉をぶつけ合う', rule: '指でうごく(止まっていると雪玉ができる・3こまで)。⛄ボタンで相手に投げる。雪山にかくれよう。先に5回当てた方の勝ち。', free: 1,
  options: [{ key: 'pts', label: '何回当てたら勝ち', choices: [[3, '3回'], [5, '5回'], [7, '7回']], def: 5 }],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2;
    const goal = host.opts.trial ? 3 : host.opts.pts || 5;
    let W = S.W, H = S.H; const layout = () => { S.resize(); W = S.W; H = S.H; }; const ro = new ResizeObserver(layout); ro.observe(host.box);
    const PR = () => Math.min(W, H) * 0.045;
    const P = [0, 1].map(s => ({ x: W / 2, y: s === 0 ? H * 0.82 : H * 0.18, tx: W / 2, ty: s === 0 ? H * 0.82 : H * 0.18, balls: 2, make: 0, stun: 0, hits: 0, charge: -1, still: 0 }));
    const walls = [];
    [[0.22, 0.66], [0.5, 0.6], [0.78, 0.68], [0.22, 0.34], [0.5, 0.4], [0.78, 0.32]].forEach(([x, y]) => walls.push({ x, y, hp: 3 }));
    const balls = [], splats = [], flakes = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), v: 0.3 + Math.random() * 0.7 }));
    let over = false, count = 2.2;
    const TB = s => { const w = 96, h = 72; return s === 0 ? { x: W - w - 12, y: H - h - 14, w, h } : { x: 12, y: 14, w, h }; };
    const fingers = [null, null];
    const pt = pointers(S.cv, {
      onDown: p => { const s = two ? p.side : 0; if (s === 1 && !two) return; if (hit(TB(s), p)) { if (P[s].balls > 0 && P[s].stun <= 0) P[s].charge = 0; return; } fingers[s] = p.id; setT(s, p); },
      onMove: p => { const s = two ? p.side : 0; if (fingers[s] === p.id) setT(s, p); },
      onUp: p => { for (const s of [0, 1]) { if (fingers[s] === p.id) fingers[s] = null; } const s = two ? p.side : 0; if (P[s].charge >= 0 && hit(TB(s), { ...p, x: p.x, y: p.y }) || P[s].charge >= 0) throwBall(s); },
    });
    function setT(s, p) { P[s].tx = p.x; P[s].ty = p.y - (s === 0 ? 50 : -50); }
    function throwBall(s) {
      const me = P[s], op = P[1 - s]; if (me.charge < 0 || me.balls <= 0 || over) { me.charge = -1; return; }
      const pw = clamp(me.charge / 0.8, 0.35, 1), sp = H * (0.75 + pw * 0.55);
      const d = Math.hypot(op.x - me.x, op.y - me.y), lead = d / sp;   // 動いている相手の少し先をねらう
      let ax = op.x + (op.vx || 0) * lead * 0.8, ay = op.y + (op.vy || 0) * lead * 0.8;
      const err = s === 1 && !two ? [0, 0.16, 0.1, 0.05][lv] : 0.05; ax += (Math.random() - 0.5) * W * err; ay += (Math.random() - 0.5) * H * err * 0.4;
      const a = Math.atan2(ay - me.y, ax - me.x);
      balls.push({ x: me.x, y: me.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, s, life: 1.6 });
      me.balls--; me.charge = -1; sfx.play('throw');
    }
    // CPU
    let cpuT = 0, cpuGoal = null;
    function cpuThink(dt) {
      const me = P[1], op = P[0]; cpuT -= dt;
      if (cpuT <= 0) {
        cpuT = 0.9 + Math.random() * 1.2;
        const ws = walls.filter(w => w.y < 0.5 && w.hp > 0);
        if (me.balls === 0 && ws.length) { const w = ws[Math.floor(Math.random() * ws.length)]; cpuGoal = [w.x * W + (Math.random() - 0.5) * 20, w.y * H - PR() * 2.2]; }
        else cpuGoal = [W * (0.2 + Math.random() * 0.6), H * (0.12 + Math.random() * 0.24)];
      }
      if (cpuGoal) { me.tx = cpuGoal[0]; me.ty = cpuGoal[1]; }
      // よける
      if (lv >= 2) for (const b of balls) if (b.s === 0 && b.vy < 0 && Math.abs(b.x - me.x) < PR() * 2 && b.y - me.y < H * 0.25 && Math.random() < dt * (lv === 3 ? 6 : 3)) { me.tx = me.x + (b.x < me.x ? 1 : -1) * W * 0.18; }
      if (me.balls > 0 && me.charge < 0 && me.stun <= 0 && Math.random() < dt * [0, 0.7, 1.1, 1.6][lv]) { me.charge = 0.3 + Math.random() * 0.5; setTimeout(() => throwBall(1), 200); }
    }
    const stop = loop(dt => {
      if (count > -1) count -= dt;
      if (count <= 0 && !over) {
        if (!two && cpu) cpuThink(dt);
        P.forEach((me, s) => {
          if (me.charge >= 0) me.charge += dt;
          if (me.stun > 0) { me.stun -= dt; me.vx = me.vy = 0; return; }
          const minY = s === 0 ? H * 0.54 : H * 0.06, maxY = s === 0 ? H * 0.94 : H * 0.46;
          const tx = clamp(me.tx, PR(), W - PR()), ty = clamp(me.ty, minY, maxY), dx = tx - me.x, dy = ty - me.y, d = Math.hypot(dx, dy), sp = H * 0.42, k = d > 0 ? Math.min(1, sp * dt / d) : 0;
          let nx = me.x + dx * k, ny = me.y + dy * k;
          for (const w of walls) if (w.hp > 0) { const wx = w.x * W, wy = w.y * H, rr2 = wallR(w) + PR() * 0.8, ddx = nx - wx, ddy = ny - wy, dd = Math.hypot(ddx, ddy); if (dd < rr2 && dd > 0) { nx = wx + ddx / dd * rr2; ny = wy + ddy / dd * rr2; } }
          me.vx = (nx - me.x) / dt; me.vy = (ny - me.y) / dt; me.x = nx; me.y = ny;
          const moving = d > 4; me.still = moving ? 0 : me.still + dt;
          if (!moving && me.balls < 3) { me.make += dt; if (me.make >= 0.7) { me.make = 0; me.balls++; if (s === 0 || two) sfx.play('pick'); } } else if (moving) me.make = 0;
        });
        for (let i = balls.length - 1; i >= 0; i--) {
          const b = balls[i]; b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt;
          let gone = b.t > b.life || b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20;
          for (const w of walls) if (!gone && w.hp > 0 && Math.hypot(b.x - w.x * W, b.y - w.y * H) < wallR(w)) { w.hp--; gone = true; splats.push({ x: b.x, y: b.y, t: 0.5 }); sfx.play('splat'); }
          const op = P[1 - b.s];
          if (!gone && Math.hypot(b.x - op.x, b.y - op.y) < PR() * 1.1 && op.stun <= 0) {
            gone = true; P[b.s].hits++; op.stun = 0.6; splats.push({ x: op.x, y: op.y, t: 0.8, big: 1 }); sfx.play('goal');
            if (P[b.s].hits >= goal) { over = true; setTimeout(() => host.end({ winner: b.s, score: [P[0].hits, P[1].hits] }), 1200); }
          }
          if (gone) balls.splice(i, 1);
        }
      }
      draw(dt);
    });
    const wallR = w => Math.min(W, H) * (0.05 + w.hp * 0.022);
    function draw(dt) {
      S.begin();
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#eef6ff'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#f2f7ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#cfe0f5'; g.lineWidth = 3; g.setLineDash([10, 10]); g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke(); g.setLineDash([]);
      walls.forEach(w => { if (w.hp <= 0) return; const x = w.x * W, y = w.y * H, r = wallR(w); g.fillStyle = 'rgba(120,150,200,0.25)'; g.beginPath(); g.ellipse(x + 4, y + r * 0.5, r * 1.1, r * 0.4, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, r * 1.1, r * 0.8, 0, Math.PI, 0); g.lineTo(x + r * 1.1, y + r * 0.3); g.lineTo(x - r * 1.1, y + r * 0.3); g.fill(); g.strokeStyle = '#bcd3ee'; g.lineWidth = 2; g.stroke(); });
      P.forEach((me, s) => {
        const r = PR(), c = s === 0 ? COL.p1 : COL.p2;
        g.fillStyle = 'rgba(120,150,200,0.3)'; g.beginPath(); g.ellipse(me.x, me.y + r * 0.9, r * 0.9, r * 0.35, 0, 0, 7); g.fill();
        g.fillStyle = c; g.beginPath(); g.arc(me.x, me.y, r, 0, 7); g.fill();
        txt(g, me.stun > 0 ? '😵' : s === 0 ? '😆' : (host.players[1].icon || '😎'), me.x, me.y, { size: r * 1.3 });
        g.fillStyle = s === 0 ? COL.p1d : COL.p2d; g.beginPath(); g.ellipse(me.x, me.y - r * 0.8, r * 0.8, r * 0.35, 0, Math.PI, 0); g.fill();
        if (me.make > 0) { g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(me.x, me.y, r + 6, -Math.PI / 2, -Math.PI / 2 + me.make / 0.7 * Math.PI * 2); g.stroke(); }
      });
      balls.forEach(b => { const h = Math.sin(Math.min(1, b.t / 0.6) * Math.PI) * 14; g.fillStyle = 'rgba(120,150,200,0.3)'; g.beginPath(); g.arc(b.x, b.y + 6, 5, 0, 7); g.fill(); g.fillStyle = '#fff'; g.strokeStyle = '#bcd3ee'; g.lineWidth = 1.5; g.beginPath(); g.arc(b.x, b.y - h, 7, 0, 7); g.fill(); g.stroke(); });
      for (let i = splats.length - 1; i >= 0; i--) { const sp = splats[i]; sp.t -= dt; if (sp.t <= 0) { splats.splice(i, 1); continue; } g.fillStyle = `rgba(255,255,255,${sp.t})`; for (let k = 0; k < 7; k++) { const a = k * 0.9; g.beginPath(); g.arc(sp.x + Math.cos(a) * (sp.big ? 20 : 10) * (1.2 - sp.t), sp.y + Math.sin(a) * (sp.big ? 20 : 10) * (1.2 - sp.t), sp.big ? 7 : 4, 0, 7); g.fill(); } }
      flakes.forEach(f => { f.y += f.v * dt * 0.06; if (f.y > 1) f.y = 0; g.fillStyle = 'rgba(200,220,255,0.7)'; g.beginPath(); g.arc(f.x * W, f.y * H, 2, 0, 7); g.fill(); });
      // 雪玉の数・投げるボタン・点数
      [0, 1].forEach(s => {
        const me = P[s], flip = s === 1 && two, b = TB(s);
        if (s === 0 || two) btn(g, { ...b, label: me.charge >= 0 ? '⛄ はなす!' : `⛄ 投げる` }, { fill: me.balls > 0 ? (me.charge >= 0 ? '#ffe58a' : '#fff') : '#e6e6ee', size: 15, flip, border: s ? COL.p2 : COL.p1 });
        const y = s === 0 ? H - 30 : 30, x = s === 0 ? 20 : two ? W - 20 : 20;
        txt(g, '●'.repeat(me.balls) + '○'.repeat(3 - me.balls), x, y, { size: 16, color: '#8fb3e0', align: s === 0 || !two ? 'left' : 'right', flip });
        txt(g, `${me.hits} / ${goal}`, s === 0 ? 20 : two ? W - 20 : 20, s === 0 ? H - 56 : 56, { size: 20, color: s ? COL.p2d : COL.p1d, align: s === 0 || !two ? 'left' : 'right', flip });
      });
      if (count > 0) banner(g, S, two, count > 0.5 ? 'READY' : 'GO!', { size: 44 });
    }
    return { stop() { stop(); pt.off(); ro.disconnect(); S.cv.remove(); } };
  },
};
