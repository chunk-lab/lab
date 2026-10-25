// ぷにホッケー(エアホッケー)。下=自分、上=相手。指でマレットを動かして打ち合う
import { surface, pointers, loop, txt, banner, rr, clamp, COL, INK } from '../kit.js';

export default {
  id: 'hockey', title: 'ぷにホッケー', icon: '🏒', desc: '指でマレットを動かしてパックを打ち合う', rule: '自分のマレットを指で動かして、パックを相手のゴールに入れよう。',
  options: [{ key: 'pts', label: '何点先取', choices: [[5, '5点'], [7, '7点'], [10, '10点']], def: 7 },
    { key: 'spd', label: 'あなたの希望スピード(1おそい〜10はやい)', choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => [n, String(n)]), def: 4 },
    { key: 'spd2', label: 'プレイヤー2の希望スピード', choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => [n, String(n)]), def: 4, only: (o, opp) => opp === '2p' }],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx;
    const goalTo = host.opts.trial ? 3 : host.opts.pts || 7;
    let W, H, R, M, GW, top, bot;
    const layout = () => { S.resize(); W = S.W; H = S.H; R = W * 0.045; M = W * 0.078; GW = W * 0.38; top = 46; bot = H - 46; };
    layout(); const ro = new ResizeObserver(layout); ro.observe(host.box);
    const puck = { x: W / 2, y: H / 2, vx: 0, vy: 0, trail: [] };
    const mal = [{ x: W / 2, y: bot - 70, tx: W / 2, ty: bot - 70, vx: 0, vy: 0 }, { x: W / 2, y: top + 70, tx: W / 2, ty: top + 70, vx: 0, vy: 0 }];
    const score = [0, 0]; let pause = 1.2, flash = null, over = false, sparks = [], stuckT = 0, popT = 0, msg = null;
    const fingers = [null, null];
    const pt = pointers(S.cv, {
      onDown: p => { const s = two ? p.side : 0; if (!fingers[s]) fingers[s] = p.id; move(p, s); },
      onMove: p => { const s = two ? p.side : 0; if (fingers[s] === p.id) move(p, s); },
      onUp: p => { for (const s of [0, 1]) if (fingers[s] === p.id) fingers[s] = null; },
    });
    function move(p, s) { const m = mal[s]; m.tx = p.x; m.ty = p.y - (s === 0 ? 40 : -40); }   // 指より少し先にマレット(指でかくれないように)
    function resetPuck(toward) { puck.x = W / 2; puck.y = toward === 0 ? H / 2 + H * 0.12 : H / 2 - H * 0.12; puck.vx = puck.vy = 0; puck.trail = []; }
    resetPuck(Math.random() < 0.5 ? 0 : 1);
    // CPU
    const lv = cpu ? cpu.lv : 2;
    // スピード:2人の希望の まん中(たして2でわる)。8が もとの速さ
    const want2 = two ? (host.opts.spd2 || 4) : [0, 3, 4, 5][lv], SPD = ((host.opts.spd || 4) + want2) / 2, KS = SPD / 8;
    const cpuSpd = [0, 900, 1300, 1750][lv] * (0.55 + 0.45 * KS);
    let think = 0;
    function cpuMove(dt) {
      const m = mal[1]; think -= dt;
      if (think > 0) return; think = [0, 0.12, 0.07, 0.03][lv];
      const home = { x: W / 2, y: top + 60 };
      if (puck.y < H / 2 && (puck.vy < 120 || Math.hypot(puck.vx, puck.vy) < 250)) {   // 自陣にあって遅い → 打ちに行く(パックの上側から)
        const aim = (Math.random() - 0.5) * W * 0.3; m.tx = puck.x + aim * 0.15; m.ty = puck.y - M * 0.6;
      } else if (puck.vy < 0) {   // こちらへ来る → ゴール前で受ける
        const t = (puck.y - (top + 80)) / -puck.vy; let px = puck.x + puck.vx * t;
        for (let k = 0; k < 3; k++) { if (px < R) px = 2 * R - px; if (px > W - R) px = 2 * (W - R) - px; }
        m.tx = clamp(px + (Math.random() - 0.5) * [0, 90, 50, 20][lv], W / 2 - GW * 0.7, W / 2 + GW * 0.7); m.ty = top + 70;
      } else { m.tx = home.x + (puck.x - W / 2) * 0.4; m.ty = home.y; }
    }
    const stop = loop(dt => {
      if (!over) {
        if (pause > 0) pause -= dt;
        if (!two && cpu) cpuMove(dt);
        // マレット(自陣だけ)
        mal.forEach((m, s) => {
          const minY = s === 0 ? H / 2 + M : top + M * 0.6, maxY = s === 0 ? bot - M * 0.6 : H / 2 - M;
          const tx = clamp(m.tx, M, W - M), ty = clamp(m.ty, minY, maxY), sp = s === 1 && !two ? cpuSpd : 2600;
          const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), k = d > 0 ? Math.min(1, sp * dt / d) : 0;
          const nx = m.x + dx * k, ny = m.y + dy * k; m.vx = (nx - m.x) / Math.max(dt, 1e-3); m.vy = (ny - m.y) / Math.max(dt, 1e-3); m.x = nx; m.y = ny;
        });
        if (pause <= 0) {
          // パック(細かく分けて動かす:すりぬけ防止)
          const steps = 4;
          for (let i = 0; i < steps; i++) {
            const h = dt / steps;
            puck.x += puck.vx * h * KS; puck.y += puck.vy * h * KS;
            const f = Math.pow(0.992, h * 60 * KS); puck.vx *= f; puck.vy *= f;
            if (puck.x < R) { puck.x = R; puck.vx = Math.abs(puck.vx) * 0.9; sfx.play('wall'); }
            if (puck.x > W - R) { puck.x = W - R; puck.vx = -Math.abs(puck.vx) * 0.9; sfx.play('wall'); }
            const inGoal = Math.abs(puck.x - W / 2) < GW / 2 - R * 0.3;
            if (puck.y < top + R && !inGoal) { puck.y = top + R; puck.vy = Math.abs(puck.vy) * 0.9; sfx.play('wall'); }
            if (puck.y > bot - R && !inGoal) { puck.y = bot - R; puck.vy = -Math.abs(puck.vy) * 0.9; sfx.play('wall'); }
            if (puck.y < top - R) return goal(0);
            if (puck.y > bot + R) return goal(1);
            for (const m of mal) {
              const dx = puck.x - m.x, dy = puck.y - m.y, d = Math.hypot(dx, dy);
              if (d < R + M && d > 0) {
                const nx = dx / d, ny = dy / d; puck.x = m.x + nx * (R + M); puck.y = m.y + ny * (R + M);
                const rv = (puck.vx - m.vx) * nx + (puck.vy - m.vy) * ny;
                if (rv < 0) { puck.vx -= 1.85 * rv * nx; puck.vy -= 1.85 * rv * ny; const sp = Math.hypot(puck.vx, puck.vy); sfx.play('hit', Math.min(1, sp / 1600)); for (let k = 0; k < 6; k++) sparks.push({ x: puck.x - nx * R, y: puck.y - ny * R, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, t: 0.3 }); }
              }
            }
            const sp = Math.hypot(puck.vx, puck.vy), MAX = 2000; if (sp > MAX) { puck.vx *= MAX / sp; puck.vy *= MAX / sp; }
          }
          puck.trail.push([puck.x, puck.y]); if (puck.trail.length > 10) puck.trail.shift();
          // はしで挟まって止まったら:まずはじき出す → それでもまた挟まったら仕切り直し(挟まった側の相手からスタート)
          const edge = puck.x < R * 1.9 || puck.x > W - R * 1.9 || puck.y < top + R * 1.9 || puck.y > bot - R * 1.9, slow = Math.hypot(puck.vx, puck.vy) * KS < 420;
          const pinned = edge && mal.some(m => Math.hypot(m.x - puck.x, m.y - puck.y) < (R + M) * 1.25);
          stuckT = (edge && (slow || pinned)) ? stuckT + dt : Math.max(0, stuckT - dt * 2); popT = Math.max(0, popT - dt);
          if (stuckT > 0.9) {
            stuckT = 0; const side = puck.y > H / 2 ? 0 : 1;
            if (popT > 0) { resetPuck(1 - side); pause = 0.9; msg = { t: 1.4, s: '仕切り直し!' }; popT = 0; }
            else { const a = Math.atan2(H / 2 - puck.y, W / 2 - puck.x) + (Math.random() - 0.5) * 1.2, sp = 900; puck.x += Math.cos(a) * R; puck.y += Math.sin(a) * R; puck.vx = Math.cos(a) * sp; puck.vy = Math.sin(a) * sp;
              mal.forEach(m => { const dx = m.x - puck.x, dy = m.y - puck.y, d = Math.hypot(dx, dy) || 1; if (d < (R + M) * 2) { m.x += dx / d * M; m.y += dy / d * M; } }); popT = 4; msg = { t: 0.9, s: 'ポン!' }; sfx.play('pop'); }
          }
        }
      }
      draw(dt);
    });
    function goal(s) {
      score[s]++; sfx.play('goal'); flash = { s, t: 1.2 }; pause = 1.3;
      if (score[s] >= goalTo) { over = true; setTimeout(() => host.end({ winner: s, score }), 1200); }
      resetPuck(1 - s);
    }
    function draw(dt) {
      S.begin();
      // 台
      g.fillStyle = '#e9f6ff'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#d6eeff'; for (let y = top; y < bot; y += 18) for (let x = 9; x < W; x += 18) { g.beginPath(); g.arc(x, y, 1.2, 0, 7); g.fill(); }
      g.strokeStyle = '#ff9ab6'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
      g.beginPath(); g.arc(W / 2, H / 2, W * 0.16, 0, 7); g.stroke();
      g.strokeStyle = '#8ec5ff'; g.beginPath(); g.arc(W / 2, top, GW * 0.6, 0, Math.PI); g.stroke(); g.beginPath(); g.arc(W / 2, bot, GW * 0.6, Math.PI, 0); g.stroke();
      // ゴールとふち
      g.fillStyle = '#7a6aa0'; g.fillRect(0, 0, W, top); g.fillRect(0, bot, W, H - bot);
      g.fillStyle = '#2b2140'; rr(g, W / 2 - GW / 2, top - 14, GW, 16, 6); g.fill(); rr(g, W / 2 - GW / 2, bot - 2, GW, 16, 6); g.fill();
      // 点数
      txt(g, `${score[0]}`, W - 26, H / 2 + 26, { size: 30, color: COL.p1d });
      txt(g, `${score[1]}`, W - 26, H / 2 - 26, { size: 30, color: COL.p2d, flip: two });
      txt(g, host.players[0].name, 10, bot + 23, { size: 13, color: '#fff', align: 'left' });
      txt(g, host.players[1].name, two ? W - 10 : 10, top - 23, { size: 13, color: '#fff', align: two ? 'left' : 'left', flip: two });
      txt(g, `${goalTo}点先取`, W - 10, bot + 23, { size: 12, color: '#e8e0ff', align: 'right' });
      // パック
      puck.trail.forEach(([x, y], i) => { g.fillStyle = `rgba(60,40,90,${i / puck.trail.length * 0.18})`; g.beginPath(); g.arc(x, y, R * (0.5 + i / 20), 0, 7); g.fill(); });
      g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.arc(puck.x + 3, puck.y + 4, R, 0, 7); g.fill();
      g.fillStyle = '#2b2140'; g.beginPath(); g.arc(puck.x, puck.y, R, 0, 7); g.fill(); g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(puck.x, puck.y, R * 0.45, 0, 7); g.fill();
      // マレット
      mal.forEach((m, s) => {
        const c = s === 0 ? COL.p1 : COL.p2, cd = s === 0 ? COL.p1d : COL.p2d;
        g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.arc(m.x + 4, m.y + 5, M, 0, 7); g.fill();
        g.fillStyle = cd; g.beginPath(); g.arc(m.x, m.y, M, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(m.x, m.y - 2, M * 0.86, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.globalAlpha = 0.6; g.beginPath(); g.arc(m.x - M * 0.3, m.y - M * 0.35, M * 0.25, 0, 7); g.fill(); g.globalAlpha = 1;
        g.fillStyle = cd; g.beginPath(); g.arc(m.x, m.y - 2, M * 0.38, 0, 7); g.fill();
      });
      for (let i = sparks.length - 1; i >= 0; i--) { const p = sparks[i]; p.t -= dt; if (p.t <= 0) { sparks.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; g.fillStyle = `rgba(255,211,107,${p.t / 0.3})`; g.beginPath(); g.arc(p.x, p.y, 3, 0, 7); g.fill(); }
      if (flash) { flash.t -= dt; if (flash.t <= 0) flash = null; else { g.fillStyle = `rgba(255,255,255,${flash.t * 0.3})`; g.fillRect(0, 0, W, H); banner(g, S, two, 'GOAL!!', { color: flash.s === 0 ? COL.p1 : COL.p2 }); } }
      if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; else banner(g, S, two, msg.s, { size: 26, color: '#ffb400' }); }
      if (pause > 0 && !flash && !over && score[0] + score[1] === 0) banner(g, S, two, `READY…  スピード ${SPD}`, { size: 24 });
    }
    return { stop() { stop(); pt.off(); ro.disconnect(); S.cv.remove(); } };
  },
};
