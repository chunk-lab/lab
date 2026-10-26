// ぐるぐるボックス(動体視力)。立体のボックスが輪になって、ルーレットのようにくるくる回る。
//   はじめに「当たり」のボックスが光る → ふたを閉じて、傾きながら回る(奥へ行ったり手前に来たりする) → 止まったら、当たりだと思うボックスをタップ。
//   2人のときは、1台を上下で向かい合わせて、同じボックスを見て、それぞれ自分の側でえらぶ。
import { surface, pointers, loop, txt, banner, rr, clamp, halves, COL, INK } from '../kit.js';

const N = 12, N2 = 8;   // 外の輪12こ、二重のときは内の輪が8こ
const LVN = ['', 'とてもゆっくり', 'ゆっくり', '', '', 'ふつう', '', '', '', '', 'ひとはじゅう'];
const PAL = [[58, 28, 110], [128, 22, 48], [24, 36, 92]];   // マジシャンの箱:紫・ワインレッド・濃紺
export default {
  id: 'boxes', title: 'ぐるぐるボックス', icon: '🎩', desc: '回るマジックボックスの「当たり」を目で追う',
  rule: 'はじめに光った「当たり」のボックスを、目で追いかけよう。ふたが閉じて、傾きながらぐるぐる回ります。止まったら、当たりだと思うボックスをタップ! 先に点をとった方のかち。',
  options: [
    { key: 'lv', label: '回る速さ(1〜10)', choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => [n, n === 5 ? '5 ふつう' : n === 10 ? '10 超はやい' : n === 1 ? '1 ゆっくり' : String(n)]), def: 5 },
    { key: 'ring', label: '輪のかたち', choices: [[1, 'ひとつ'], [2, '二重の輪(逆回り)']], def: 1 },
    { key: 'to', label: '何点先取', choices: [[3, '3点'], [5, '5点']], def: 3 },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, H2 = halves(S, two);
    const O = host.opts, LV = clamp(O.lv || 5, 1, 10), TO = O.trial ? 2 : O.to || 3, DBL = O.ring === 2;
    const M = DBL ? N + N2 : N;
    const cl = cpu ? cpu.lv : 2;
    let flipped = false, t = 0, phase = 'count', phT = 0, count = 2.5, target = 0, theta = 0, theta2 = 0, omega = 0, dir = 1, over = false, round = 0, tilt = { x: 0.8, z: 0 }, tilt2 = { x: 0.8, z: 0 }, tp = 0;
    const score = [0, 0], pick = [-1, -1], P = [{ rects: [] }, { rects: [] }];
    const SPD = 3.4 * (0.3 + 0.14 * LV), SPIN = Math.min(7, 4.2 + LV * 0.25);   // 回る速さ(rad/秒)・回す時間(秒)。5が従来の「ふつう」
    function newRound() {
      round++; target = Math.floor(Math.random() * M); pick[0] = pick[1] = -1; phase = 'show'; phT = 0; theta = Math.random() * 6.28; theta2 = Math.random() * 6.28; omega = 0.5; dir = Math.random() < 0.5 ? -1 : 1; tp = Math.random() * 6; flipped = false;
      sfx.play('whoosh');
    }
    // 輪(傾いた円)に並べる。傾きはゆらゆら変わるので、奥に行ったり手前に来たりする
    function ring(cx, cy, size, n, rf, th, tl, sf, id0) {
      const R = size * rf, tx = tl.x, tz = tl.z, out = [];
      for (let i = 0; i < n; i++) {
        const a = th + (i / n) * Math.PI * 2;
        const x = Math.cos(a) * R, y = 0, z = Math.sin(a) * R;
        const y1 = y * Math.cos(tx) - z * Math.sin(tx), z1 = y * Math.sin(tx) + z * Math.cos(tx);
        const x2 = x * Math.cos(tz) - y1 * Math.sin(tz), y2 = x * Math.sin(tz) + y1 * Math.cos(tz);
        const D = size * 1.5, sc = D / (D - z1);
        out.push({ i: id0 + i, x: cx + x2 * sc, y: cy + y2 * sc * 0.9, sc, z: z1, s: size * sf * sc });
      }
      return out;
    }
    function layout(cx, cy, size) {
      const o = ring(cx, cy, size, N, DBL ? 0.42 : 0.39, theta, tilt, DBL ? 0.066 : 0.08, 0);
      return DBL ? o.concat(ring(cx, cy, size, N2, 0.2, theta2, tilt2, 0.056, N)) : o;
    }
    const rgb = (c, k) => `rgb(${Math.min(255, Math.round(c[0] * k))},${Math.min(255, Math.round(c[1] * k))},${Math.min(255, Math.round(c[2] * k))})`;
    function drawBox(b, open, mark, col) {   // マジシャンの箱:ツヤのある濃い色、金のふち、星のしるし
      const sh = clamp(0.62 + (b.z / (S.W * 0.4)) * 0.4, 0.5, 1.1), s2 = b.s, pal = PAL[0];
      const x0 = -s2, x1 = s2, yT = -s2 * 0.55, yB = s2 * 0.95, gold = rgb([255, 205, 80], Math.min(1.05, sh + 0.2));
      g.save(); g.translate(b.x, b.y);
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(s2 * 0.1, s2 * 1.05, s2 * 0.95, s2 * 0.26, 0, 0, 7); g.fill();
      if (open) {   // 当たり:ふたが開いて光が出る
        const gr = g.createRadialGradient(0, -s2 * 0.6, s2 * 0.1, 0, -s2 * 0.6, s2 * 2.4); gr.addColorStop(0, 'rgba(255,240,150,.95)'); gr.addColorStop(1, 'rgba(255,240,150,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, -s2 * 0.6, s2 * 2.4, 0, 7); g.fill();
      }
      const fg = g.createLinearGradient(0, yT, 0, yB); fg.addColorStop(0, rgb(pal, sh * 1.35)); fg.addColorStop(0.5, rgb(pal, sh * 0.95)); fg.addColorStop(1, rgb(pal, sh * 0.55));
      g.fillStyle = fg; rr(g, x0, yT, s2 * 2, yB - yT, s2 * 0.12); g.fill();                                  // 正面
      g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x0 + s2 * 0.1, yT + s2 * 0.5, s2 * 0.18, yB - yT - s2 * 0.7);   // ツヤ
      g.fillStyle = gold; g.fillRect(x0, yT + s2 * 0.42, s2 * 2, s2 * 0.12); g.fillRect(x0, yB - s2 * 0.3, s2 * 2, s2 * 0.1);   // 金のおび
      [[x0 + s2 * 0.12, yT + s2 * 0.12], [x1 - s2 * 0.12, yT + s2 * 0.12], [x0 + s2 * 0.12, yB - s2 * 0.12], [x1 - s2 * 0.12, yB - s2 * 0.12]].forEach(p => { g.fillStyle = gold; g.beginPath(); g.arc(p[0], p[1], s2 * 0.07, 0, 7); g.fill(); });   // びょう
      if (!open) txt(g, '★', 0, s2 * 0.2, { size: s2 * 0.95, color: gold });
      const lift = open ? s2 * 0.75 : 0;   // ふた(上の面)。開くと持ち上がって かたむく
      g.save(); g.translate(0, -lift); if (open) g.rotate(-0.22);
      g.fillStyle = rgb(pal, sh * 1.55); g.beginPath(); g.moveTo(x0, yT); g.lineTo(x1, yT); g.lineTo(x1 * 0.78, yT - s2 * 0.5); g.lineTo(x0 * 0.78, yT - s2 * 0.5); g.closePath(); g.fill();
      g.strokeStyle = gold; g.lineWidth = Math.max(1.2, s2 * 0.07); g.stroke();
      g.restore();
      g.strokeStyle = col || 'rgba(255,205,80,.55)'; g.lineWidth = col ? Math.max(4, s2 * 0.2) : 1.2; rr(g, x0, yT, s2 * 2, yB - yT, s2 * 0.12); g.stroke();
      if (open) txt(g, '⭐', 0, -s2 * 1.5, { size: s2 * 1.3 });
      if (mark) txt(g, mark, 0, -s2 * 1.7, { size: Math.max(11, s2 * 0.7), color: INK, stroke: '#fff', sw: 4 });
      g.restore();
    }
    function drawRing(s, W, h) {   // 半分(または全体)の中に輪を描く。いちばん奥から順に
      const cx = W / 2, cy = h * 0.5, size = Math.min(W, h * 1.15), L = layout(cx, cy, size);
      P[s].rects = L.map(b => ({ i: b.i, x: b.x, y: b.y, r: b.s * 1.1, z: b.z }));
      L.slice().sort((a, b) => a.z - b.z).forEach(b => {
        const open = (phase === 'show' || phase === 'reveal') && b.i === target;
        const mine = pick[s] === b.i, theirs = pick[1 - s] === b.i && (phase === 'reveal' || two === false);
        const mark = phase === 'reveal' ? (mine && theirs ? (two ? '2人' : 'あなた/相手') : mine ? (s ? host.players[1].name : 'あなた') : theirs ? (two ? '相手' : host.players[1].name) : '') : mine ? '✔' : '';
        drawBox(b, open, mark, mine ? (s ? COL.p2 : COL.p1) : null);
      });
    }
    const pt = pointers(S.cv, {
      onDown: p => {
        if (phase !== 'pick' || over) return; const s = two ? p.side : 0; if (s === 1 && !two) return; if (pick[s] >= 0) return;
        const l = two ? H2.local(p, s) : { x: p.x, y: p.y }, rs = P[s].rects.slice().sort((a, b) => b.z - a.z);   // 手前のものを優先
        const hitB = rs.find(r => Math.hypot(p.x - r.x, p.y - r.y) <= r.r * 1.15 && !two) || (two && rs.find(r => Math.hypot(l.x - r.x, l.y - r.y) <= r.r * 1.15));
        if (hitB) { pick[s] = hitB.i; sfx.play('tap'); }
      },
    });
    function judge() {
      phase = 'reveal'; phT = 0;
      [0, 1].forEach(s => { if (pick[s] === target) score[s]++; });
      sfx.play(pick[0] === target ? 'win' : 'ng');
    }
    const stop = loop(dt => {
      t += dt; phT += dt;
      if (phase === 'count') { count -= dt; if (count <= 0) newRound(); }
      else if (phase === 'show') { theta += 0.45 * dt; theta2 -= 0.6 * dt; tilt.x = 0.8; tilt.z = 0; tilt2.x = 0.8; tilt2.z = 0; if (phT > 2.4) { phase = 'spin'; phT = 0; } }
      else if (phase === 'spin') {
        tp += dt; const k = clamp(phT / 0.8, 0, 1), end = clamp((SPIN - phT) / 1.4, 0, 1);
        omega = SPD * k * (0.55 + 0.45 * end) * (1 + 0.25 * Math.sin(tp * 1.7));
        if (LV >= 3 && !flipped && phT > SPIN * 0.5) { dir = -dir; flipped = true; }   // 途中で向きが変わる
        theta += dir * omega * dt; theta2 -= dir * omega * dt * 1.35;
        tilt2.x = 0.8 + 0.4 * Math.sin(tp * 1.1 + 2) * k; tilt2.z = -0.5 * Math.sin(tp * 0.7) * k;
        tilt.x = 0.8 + 0.4 * Math.sin(tp * 0.9) * k; tilt.z = 0.45 * Math.sin(tp * 0.6 + 1) * k;
        if (phT > SPIN) { phase = 'pick'; phT = 0; omega = 0; }
      }
      else if (phase === 'pick') {
        tilt2.x += (0.8 - tilt2.x) * Math.min(1, dt * 3); tilt2.z += (0 - tilt2.z) * Math.min(1, dt * 3);
        tilt.x += (0.8 - tilt.x) * Math.min(1, dt * 3); tilt.z += (0 - tilt.z) * Math.min(1, dt * 3);
        if (!two && cpu && pick[1] < 0 && phT > 1.2 + (4 - cl) * 0.6) pick[1] = Math.random() < [0, 0.4, 0.55, 0.7][cl] ? target : Math.floor(Math.random() * M);
        if (pick[0] !== -1 && pick[1] !== -1) judge();
        else if (phT > 9) { if (pick[0] < 0) pick[0] = -2; if (pick[1] < 0) pick[1] = -2; judge(); }
      }
      else if (phase === 'reveal') {
        if (phT > 2.6 && !over) {
          const lead = score[0] === score[1] ? -1 : score[0] > score[1] ? 0 : 1;
          if ((score[0] >= TO || score[1] >= TO) && lead >= 0) { over = true; sfx.play('goal'); setTimeout(() => host.end({ winner: lead, score: [...score], text: `${round}ラウンド` }), 400); } else newRound();
        }
      }
      draw();
    });
    function head(s, W) {
      txt(g, `${host.players[s].name}  ${score[s]} / ${TO}`, W / 2, 20, { size: 15, color: s ? '#9fc0ff' : '#ffb0b0' });
      const msg = phase === 'show' ? '⭐ 当たりを よく見て!' : phase === 'spin' ? '目で追いかけて…' : phase === 'pick' ? (pick[s] >= 0 ? 'ほかの人を待っているよ' : '当たりはどれ? タップ!') : phase === 'reveal' ? (pick[s] === target ? '⭐ 当たり! +1' : 'ざんねん…') : '';
      txt(g, msg, W / 2, 44, { size: 14, color: '#ffe9a8' });
    }
    function draw() {
      S.begin(); const W = S.W, H = S.H;
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a1a4a'); bg.addColorStop(1, '#4a2a5e'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      if (!two) {
        head(0, W); g.save(); g.translate(0, 40); drawRing(0, W, H - 40); g.restore();
        P[0].rects.forEach(r => { r.y += 40; });
        if (phase === 'pick' && pick[1] >= 0 && pick[0] < 0) txt(g, `${host.players[1].name}は えらんだ!`, W / 2, H - 24, { size: 14, color: COL.p2d });
      } else {
        g.fillStyle = 'rgba(80,120,255,.12)'; g.fillRect(0, 0, W, H / 2);
        [0, 1].forEach(s => H2.half(s, () => { head(s, W); g.save(); g.translate(0, 40); drawRing(s, W, H / 2 - 40); g.restore(); P[s].rects.forEach(r => { r.y += 40; }); }));
        g.fillStyle = '#ffd24d'; g.fillRect(0, H / 2 - 1, W, 2);
      }
      if (phase === 'count') banner(g, S, two, count > 0.4 ? String(Math.ceil(count)) : 'GO!', { size: 50 });
    }
    return { _dbg: () => ({ phase, target, pick, score, P }), stop() { stop(); pt.off(); S.cv.remove(); over = true; } };
  },
};
