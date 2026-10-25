// 単語つなぎ五目:自分の文の単語を英語の順に選んで、盤に置く。
//   単語の駒が、文の順にタテ・ヨコ・ナナメのとなり同士でつながったら勝ち(まっすぐでなくてよい・曲がってOK)。
//   同じ単語なら相手の駒も使える。文を置き終わっても、また1語目から作れる(駒はふえていく)ので、行きづまらない。
import { surface, pointers, loop, txt, wrapTxt, banner, rr, clamp, btn, hit, COL, INK, shuffle, halves } from '../kit.js';
import { pickSentence, words } from '../en_data.js';

const N = 7;
export default {
  id: 'gomoku', en: 1, title: '単語つなぎ五目', icon: '⚫', desc: '単語の駒を、文の順につなげたら勝ち', rule: '日本語の文に合う英単語を、英語の順に選んで盤に置こう(マスをタップ、またはドラッグ)。自分の文の単語が、順番どおりにタテ・ヨコ・ナナメのとなり同士でつながったら勝ち。曲がってもOK。同じ単語なら相手の駒も使える。相手の駒の単語を見て、先回りしてじゃましよう。',
  options: [
    { key: 'lv', label: '文のむずかしさ', choices: [[1, 'やさしい(4〜5語)'], [2, 'ふつう(5〜6語)'], [3, 'むずかしい(6〜7語)']], def: 1 },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, LV = O.trial ? 1 : O.lv || 1, [nMin, nMax] = [[0, 0], [4, 5], [5, 6], [6, 7]][LV];
    const board = Array.from({ length: N * N }, () => null);   // {p, w}
    let over = false, t = 0, count = 2, winLine = null;
    const msg = ['', ''], msgT = [0, 0], used = [];
    const low = x => x === 'I' ? x : x.toLowerCase();
    function pick() {
      for (let i = 0; i < 60; i++) { const s = pickSentence(LV, 0, used), w = words(s); if (w.length >= nMin && w.length <= nMax) { used.push(s); return { s, w: w.map(low) }; } }
      const s = pickSentence(LV, 0, used); used.push(s); return { s, w: words(s).slice(0, nMax).map(low) };
    }
    const P = [0, 1].map(() => ({ ...pick(), k: 0, hand: null, tray: [], stun: 0, cool: 0, drag: null, cpuT: 0, shake: 0 }));
    function deal(me) { me.tray = shuffle(me.w.map((w, i) => ({ w, i, ok: false }))); me.k = 0; }
    P.forEach(deal);
    // ---- つながりを調べる(となり8方向・同じマスは2回使わない) ----
    const NB = board.map((_, c) => { const x = c % N, y = (c / N) | 0, r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < N && Y < N) r.push(Y * N + X); } return r; });
    const usable = (c, w) => board[c] && board[c].w === w;
    function best(s) {   // 文の頭から、いちばん長くつながった並び
      const W = P[s].w; let bestPath = [];
      const dfs = (c, i, path) => {
        if (path.length > bestPath.length) bestPath = path.slice();
        if (i >= W.length || bestPath.length === W.length) return;
        for (const n of NB[c]) if (!path.includes(n) && usable(n, W[i])) { path.push(n); dfs(n, i + 1, path); path.pop(); }
      };
      for (let c = 0; c < N * N; c++) if (usable(c, W[0])) dfs(c, 1, [c]);
      return bestPath;
    }
    // ---- 操作 ----
    function pickWord(s, tile) {
      const me = P[s]; if (over || count > 0 || me.stun > 0 || me.hand || tile.ok) return;
      if (tile.w === me.w[me.k]) { tile.ok = true; me.hand = { w: tile.w, i: me.k }; sfx.play('pick'); }
      else { me.stun = 0.8; me.shake = 0.4; sfx.play('ng'); say(s, 'その単語は、まだ先'); }
    }
    function place(s, c) {
      const me = P[s]; if (!me.hand || board[c] || over || me.cool > 0) return false;
      board[c] = { p: s, w: me.hand.w, t: 0 }; me.hand = null; me.k++; me.cool = 0.35; sfx.play('pop');
      if (me.k >= me.w.length) { deal(me); say(s, '文を置ききった! また1語目から'); }
      check(); return true;
    }
    function say(s, m) { msg[s] = m; msgT[s] = 1.8; }
    const ratio = s => best(s).length / P[s].w.length;
    function check() {
      for (const s of [0, 1]) { const b = best(s); if (b.length >= P[s].w.length) { over = true; winLine = { s, cells: b }; sfx.play('win'); setTimeout(() => host.end({ winner: s, text: P[s].s.en }), 2600); return; } }
      if (board.every(Boolean)) { over = true; const a = ratio(0), b = ratio(1); setTimeout(() => host.end({ winner: a > b ? 0 : b > a ? 1 : -1, text: '盤がうまった' }), 1600); }
    }
    // ---- 画面の割りふり(盤はまん中。半分ずつに手元) ----
    const geo = () => { const W = S.W, H = S.H, B = Math.min(W - 20, H - 2 * 178), cs = B / N; return { bx: (W - B) / 2, by: (H - B) / 2, B, cs }; };
    const cellAt = (x, y) => { const G = geo(), cx = Math.floor((x - G.bx) / G.cs), cy = Math.floor((y - G.by) / G.cs); return cx >= 0 && cy >= 0 && cx < N && cy < N ? cy * N + cx : -1; };
    const trayRects = s => {
      const me = P[s], G = geo(), top = G.B / 2 + 50, n = me.tray.length, cols = n <= 4 ? n : Math.ceil(n / 2), bw = (S.W - 24 - (cols - 1) * 6) / cols, bh = 34;
      return me.tray.map((x, i) => ({ x: 12 + (i % cols) * (bw + 6), y: top + Math.floor(i / cols) * (bh + 6), w: bw, h: bh, label: x.w, tile: x }));
    };
    const handRect = () => { const G = geo(); return { x: S.W - 100, y: G.B / 2 + 8, w: 88, h: 34 }; };
    const pt = pointers(S.cv, {
      onDown: p => {
        const c = cellAt(p.x, p.y);
        if (c >= 0) { const s = two ? (P[p.side].hand ? p.side : P[1 - p.side].hand ? 1 - p.side : p.side) : 0; if (place(s, c)) return; }
        const s = two ? p.side : 0; if (s === 1 && !two) return; const l = H2.local(p, s), me = P[s];
        if (me.hand && hit(handRect(), l)) { me.drag = { id: p.id, x: p.x, y: p.y }; return; }
        for (const r of trayRects(s)) if (hit(r, l)) return pickWord(s, r.tile);
      },
      onMove: p => { for (const me of P) if (me.drag && me.drag.id === p.id) { me.drag.x = p.x; me.drag.y = p.y; } },
      onUp: p => { P.forEach((me, s) => { if (me.drag && me.drag.id === p.id) { const c = cellAt(p.x, p.y); me.drag = null; if (c >= 0) place(s, c); } }); },
    });
    // ---- CPU ----
    const cpuPick = () => [0, 3.6, 2.7, 1.9][lv] * (0.75 + Math.random() * 0.5);
    P[1].cpuT = cpuPick() + 1;
    function cpuPlace() {
      const me = P[1], i = me.hand.i, W = me.w, empty = board.map((b, c) => b ? -1 : c).filter(c => c >= 0);
      if (!empty.length) return;
      const ob = best(0), on = P[0].w.length;   // じゃま:相手があと少しなら、つながりの先をふさぐ
      if (ob.length >= on - 2 && ob.length > 0 && Math.random() < [0, 0.3, 0.55, 0.8][lv]) {
        const ends = NB[ob[ob.length - 1]].filter(c => !board[c]);
        if (ends.length && ends.length <= 3) { place(1, ends[Math.floor(Math.random() * ends.length)]); return; }
      }
      let bestC = [], bestV = -1;   // 自分:置いたら、いちばん長くつながるマス
      for (const c of empty) {
        board[c] = { p: 1, w: W[i] }; const v = best(1).length * 10 + NB[c].filter(n => !board[n]).length; board[c] = null;
        if (v > bestV) { bestV = v; bestC = [c]; } else if (v === bestV) bestC.push(c);
      }
      const miss = Math.random() < [0, 0.3, 0.15, 0.05][lv];
      place(1, miss ? empty[Math.floor(Math.random() * empty.length)] : bestC[Math.floor(Math.random() * bestC.length)]);
    }
    const stop = loop(dt => {
      t += dt; if (count > -1) { const c0 = Math.ceil(count); count -= dt; if (count > 0 && Math.ceil(count) !== c0) sfx.play('count'); if (count <= 0 && c0 === 1) sfx.play('go'); }
      P.forEach((me, s) => { me.stun = Math.max(0, me.stun - dt); me.cool = Math.max(0, me.cool - dt); me.shake = Math.max(0, me.shake - dt); msgT[s] = Math.max(0, msgT[s] - dt); });
      board.forEach(b => { if (b) b.t += dt; });
      if (!over && count <= 0 && !two && cpu) {
        const me = P[1]; me.cpuT -= dt;
        if (me.cpuT <= 0 && me.stun <= 0) {
          if (!me.hand) { const tile = me.tray.find(x => x.i === me.k); if (Math.random() < [0, 0.1, 0.06, 0.02][lv]) pickWord(1, me.tray.find(x => !x.ok && x !== tile) || tile); else pickWord(1, tile); me.cpuT = 0.5 + Math.random() * 0.6; }
          else { cpuPlace(); me.cpuT = cpuPick(); }
        }
      }
      if (!over && t > 300) { over = true; const a = ratio(0), b = ratio(1); host.end({ winner: a > b ? 0 : b > a ? 1 : -1, text: '時間切れ' }); }
      draw();
    });
    function draw() {
      S.begin(); const W = S.W, H = S.H, h = H / 2, G = geo();
      g.fillStyle = '#fff3f7'; g.fillRect(0, h, W, h); g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, h);
      g.fillStyle = '#f6e7c8'; rr(g, G.bx - 6, G.by - 6, G.B + 12, G.B + 12, 12); g.fill();
      g.strokeStyle = '#d9c39a'; g.lineWidth = 1;
      for (let i = 0; i <= N; i++) { g.beginPath(); g.moveTo(G.bx + i * G.cs, G.by); g.lineTo(G.bx + i * G.cs, G.by + G.B); g.moveTo(G.bx, G.by + i * G.cs); g.lineTo(G.bx + G.B, G.by + i * G.cs); g.stroke(); }
      const chains = [best(0), best(1)];
      [0, 1].forEach(s => { const c = winLine && winLine.s === s ? winLine.cells : chains[s]; if (c.length < 2) return; g.strokeStyle = s ? 'rgba(90,168,240,0.55)' : 'rgba(255,122,162,0.55)'; g.lineWidth = winLine && winLine.s === s ? 8 : 5; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); c.forEach((k, i) => { const x = G.bx + (k % N + 0.5) * G.cs, y = G.by + (((k / N) | 0) + 0.5) * G.cs; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); });
      board.forEach((b, c) => {
        if (!b) return; const x = G.bx + (c % N) * G.cs, y = G.by + ((c / N) | 0) * G.cs, k = Math.min(1, b.t * 6), m = G.cs * (0.5 - 0.44 * k);
        const inC = chains[0].includes(c) || chains[1].includes(c);
        g.fillStyle = b.p ? '#d6ebff' : '#ffe1ea'; rr(g, x + m, y + m, G.cs - 2 * m, G.cs - 2 * m, 7); g.fill();
        g.strokeStyle = b.p ? COL.p2 : COL.p1; g.lineWidth = inC ? 3 : 1.5; g.stroke();
        txt(g, b.w, x + G.cs / 2, y + G.cs / 2, { size: Math.min(13, G.cs * 0.3), color: b.p ? COL.p2d : COL.p1d, maxW: G.cs - 6, flip: two && b.p === 1, font: 'Georgia,serif', weight: 700 });
      });
      [0, 1].forEach(s => H2.half(s, up => {
        const me = P[s], T = (...a) => H2.T(up, ...a), canSee = !up || two, top = G.B / 2 + 8;
        T(`${host.players[s].name}  つながり ${chains[s].length} / ${me.w.length}`, 12, top + 17, { size: 13, align: 'left', color: s ? COL.p2d : COL.p1d });
        if (!canSee) { T(me.hand ? '置く場所を考え中…' : '単語を選んでいる…', W / 2, top + 64, { size: 15, color: '#8d7f9e' }); return; }
        if (me.hand) { btn(g, { ...handRect(), label: me.hand.w }, { fill: COL.gold, size: 15, flip: up, font: 'Georgia,serif' }); T('マスをタップ/ドラッグで置く', W - 106, top + 26, { size: 11, align: 'right', color: '#8d7f9e' }); }
        else T(msgT[s] > 0 ? msg[s] : 'つぎの単語を選ぶ ↓', W - 12, top + 17, { size: 12, align: 'right', color: msgT[s] > 0 ? '#ff5a5a' : '#8d7f9e' });
        const sx = me.shake > 0 ? Math.sin(t * 60) * 5 : 0, rs = trayRects(s);
        g.save(); g.translate(sx, 0);
        rs.forEach(r => btn(g, r, { size: 14, flip: up, fill: r.tile.ok ? '#eee8f4' : '#fff', color: r.tile.ok ? '#b8aec4' : INK, border: '#e6dcf2', shadow: !r.tile.ok, alpha: me.stun > 0 ? 0.45 : 1, font: 'Georgia,serif' }));
        g.restore();
        const yb = rs.length ? Math.max(...rs.map(r => r.y + r.h)) + 18 : top + 120;
        wrapTxt(g, me.s.ja, W / 2, Math.min(h - 14, yb), W - 30, { size: 13, color: '#6b5a80', weight: 800, flip: up });
      }));
      P.forEach((me, s) => { if (me.drag && me.hand) btn(g, { x: me.drag.x - 40, y: me.drag.y - 50, w: 80, h: 30, label: me.hand.w }, { fill: COL.gold, size: 14, flip: two && s === 1, font: 'Georgia,serif' }); });
      if (count > 0) banner(g, S, two, count > 0.4 ? String(Math.ceil(count)) : 'GO!', { size: 50 });
      if (winLine) banner(g, S, two, `${host.players[winLine.s].name} つながった!`, { size: 22, color: winLine.s ? COL.p2 : COL.p1 });
    }
    return { stop() { stop(); pt.off(); S.cv.remove(); } };
  },
};
