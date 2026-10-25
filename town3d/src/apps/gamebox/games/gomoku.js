// 語順5目並べ:手元で単語を並べかえてチャンクを作り、できたチャンクを盤に置く。
//   自分のお題の文のチャンク①②③…を、たて・よこ・ななめ一列に順番に並べたら勝ち。相手の列のあいだに置いて じゃまできる。
//   スピード制(同時に進む)。置いたあとは少し待ち時間。
import { surface, pointers, loop, txt, wrapTxt, banner, rr, clamp, btn, hit, COL, INK, shuffle, halves } from '../kit.js';
import { pickSentence, sentences } from '../en_data.js';

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1], [-1, 0], [0, -1], [-1, -1], [-1, 1]];
const NUM = ['①', '②', '③', '④', '⑤', '⑥'];
export default {
  id: 'gomoku', en: 1, title: '語順5目並べ', icon: '⚫', desc: 'チャンクを作って盤に並べる陣取り', rule: '手元で単語を正しい順に押してチャンクを作り、できた駒を盤に引っぱって置こう。お題の文のチャンク①②③…を、たて・よこ・ななめ一列に順番どおり並べたら勝ち。相手の列のあいだに置いて じゃまもできる。',
  options: [
    { key: 'n', label: 'お題のチャンクの数', choices: [[3, '3つ'], [4, '4つ'], [5, '5つ']], def: 3 },
    { key: 'lv', label: '文のむずかしさ', choices: [[1, 'やさしい'], [2, 'ふつう'], [3, 'むずかしい']], def: 1 },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const NCH = host.opts.n || 3, SLV = host.opts.lv || 1, N = NCH >= 5 ? 7 : 6;
    const board = Array.from({ length: N }, () => Array(N).fill(null));   // {s, k}
    const mk = (s, avoid) => {
      let sen = pickSentence(SLV, NCH, avoid); if (!sen || sen.chunks.length !== NCH) sen = sentences().find(x => x.chunks.length === NCH) || sen;
      return { sen, k: 0, built: [], tray: [], piece: null, cool: 0, shake: 0, drag: null };
    };
    const P = [mk(0, [])]; P.push(mk(1, [P[0].sen]));
    const words = c => c.en.replace(/[.,!?]$/, '').split(/\s+/);
    // 手元には「文の単語ぜんぶ」がばらばらに出る。英語の順に押していき、チャンクがひとつできるたびに駒になる
    function deal(s) { const p = P[s]; p.tray = shuffle(p.sen.chunks.flatMap(words).map((w, i) => ({ w, id: i }))); p.k = 0; p.built = []; p.need = words(p.sen.chunks[0]); }
    function nextChunk(s) { const p = P[s]; p.k++; if (p.k >= NCH) return deal(s); p.built = []; p.need = words(p.sen.chunks[p.k]); }
    deal(0); deal(1);
    let over = false, winLine = null, t = 0;
    // 盤の位置(画面のまん中)
    const BD = () => { const sz = Math.min(S.W - 20, S.H * 0.4), x = (S.W - sz) / 2, y = (S.H - sz) / 2; return { x, y, sz, c: sz / N }; };
    const cellAt = (x, y) => { const b = BD(); const i = Math.floor((x - b.x) / b.c), j = Math.floor((y - b.y) / b.c); return i >= 0 && j >= 0 && i < N && j < N ? [i, j] : null; };
    // 手元(半分の中、盤より手前)
    const trayRects = (s) => { const p = P[s], W = S.W, h = S.H / 2, b = BD(), top = b.sz / 2 + 54, cols = Math.min(4, p.tray.length), bw = (W - 24 - (cols - 1) * 6) / cols; return p.tray.map((x, i) => ({ x: 12 + (i % cols) * (bw + 6), y: top + 26 + Math.floor(i / cols) * 46, w: bw, h: 40, label: x.w, item: x })); };
    const pieceRect = s => { const b = BD(), h = S.H / 2; return { x: S.W - 96, y: b.sz / 2 + 8, w: 84, h: 40 }; };
    const pt = pointers(S.cv, {
      onDown: p => {
        const s = two ? p.side : 0; if (s === 1 && !two) return; if (over) return; const me = P[s], l = H2.local(p, s);
        if (me.piece && hit(pieceRect(s), l)) { me.drag = { id: p.id, x: p.x, y: p.y }; sfx.play('pick'); return; }
        if (me.cool > 0 || me.piece) return;
        for (const r of trayRects(s)) if (hit(r, l)) { tapWord(s, r.item); return; }
      },
      onMove: p => { for (const me of P) if (me.drag && me.drag.id === p.id) { me.drag.x = p.x; me.drag.y = p.y; } },
      onUp: p => { P.forEach((me, s) => { if (me.drag && me.drag.id === p.id) { const c = cellAt(p.x, p.y); me.drag = null; if (c && !board[c[1]][c[0]]) place(s, c); } }); },
    });
    function tapWord(s, item) {
      const me = P[s], want = me.need[me.built.length];
      if (item.w === want) { me.built.push(item.w); me.tray = me.tray.filter(x => x !== item); sfx.play('tap'); if (me.built.length === me.need.length) { me.piece = { k: me.k }; sfx.play('ok'); } }
      else { me.shake = 0.4; me.cool = 0.8; sfx.play('ng'); me.tray.push(...me.built.map((w, i) => ({ w, id: 100 + i + Math.random() }))); me.tray = shuffle(me.tray); me.built = []; }
    }
    function place(s, [i, j]) {
      const me = P[s]; board[j][i] = { s, k: me.piece.k }; me.piece = null; me.cool = 1.4; sfx.play('hit', 0.6);
      nextChunk(s);
      const L = lineOf(s); if (L) { winLine = L; over = true; sfx.play('goal'); setTimeout(() => host.end({ winner: s, text: P[s].sen.en }), 2200); }
      else if (board.every(r => r.every(Boolean))) { over = true; setTimeout(() => host.end({ winner: -1 }), 1200); }
    }
    // ①②③…が一列に順番どおり並んでいるか
    function lineOf(s) {
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const c = board[j][i]; if (!c || c.s !== s || c.k !== 0) continue;
        for (const [dx, dy] of DIRS) { const cells = [[i, j]]; let ok = true; for (let k = 1; k < NCH; k++) { const x = i + dx * k, y = j + dy * k, d = board[y] && board[y][x]; if (!d || d.s !== s || d.k !== k) { ok = false; break; } cells.push([x, y]); } if (ok) return cells; } }
      return null;
    }
    // その場所に k を置いたら、何個つながるか(前後の順番も見る)
    function runIf(s, i, j, k) {
      let best = 1;
      for (const [dx, dy] of DIRS.slice(0, 4)) {
        let n = 1; for (let m = 1; k - m >= 0; m++) { const d = board[j - dy * m] && board[j - dy * m][i - dx * m]; if (d && d.s === s && d.k === k - m) n++; else break; }
        for (let m = 1; k + m < NCH; m++) { const d = board[j + dy * m] && board[j + dy * m][i + dx * m]; if (d && d.s === s && d.k === k + m) n++; else break; }
        let n2 = 1; for (let m = 1; k - m >= 0; m++) { const d = board[j + dy * m] && board[j + dy * m][i + dx * m]; if (d && d.s === s && d.k === k - m) n2++; else break; }
        for (let m = 1; k + m < NCH; m++) { const d = board[j - dy * m] && board[j - dy * m][i - dx * m]; if (d && d.s === s && d.k === k + m) n2++; else break; }
        best = Math.max(best, n, n2);
      }
      return best;
    }
    // 列が最後まで入るか(はみ出さない・じゃまされていない)。入る向きのうち、もう置いてある自分の駒の数+1
    function fitIf(s, i, j, k) {
      let best = -1;
      for (const [dx, dy] of DIRS) { let n = 1, ok = true; for (let m = 0; m < NCH; m++) { if (m === k) continue; const x = i + dx * (m - k), y = j + dy * (m - k); if (x < 0 || y < 0 || x >= N || y >= N) { ok = false; break; } const d = board[y][x]; if (d) { if (d.s === s && d.k === m) n++; else { ok = false; break; } } } if (ok) best = Math.max(best, n); }
      return best;
    }
    // CPU
    let cpuT = 2;
    function cpuStep(dt) {
      const me = P[1]; cpuT -= dt; if (me.cool > 0 || cpuT > 0) return;
      if (!me.piece) { if (Math.random() < [0, 0.14, 0.08, 0.03][lv]) { me.cool = 0.8; cpuT = 1; return; } me.need.forEach(w => { const it = me.tray.find(x => x.w === w); if (it) me.tray = me.tray.filter(x => x !== it); }); me.piece = { k: me.k }; cpuT = 0.6 + Math.random() * 0.6; return; }
      // 置く場所:相手があと少しならふさぐ、そうでなければ自分の列をのばす
      const op = P[0]; let best = null, bv = -1;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        if (board[j][i]) continue;
        const mine = fitIf(1, i, j, me.piece.k), theirs = Math.max(runIf(0, i, j, op.k), op.piece ? runIf(0, i, j, op.piece.k) : 0);
        const v = mine * 10 + (theirs >= NCH - 1 ? 25 * (lv >= 2 ? 1 : 0.4) : theirs * 2) + Math.random() * 3 - (Math.abs(i - N / 2) + Math.abs(j - N / 2)) * 0.3;
        if (v > bv) { bv = v; best = [i, j]; }
      }
      if (best) place(1, best);
      cpuT = [0, 6.2, 4.6, 3.3][lv] * (0.8 + Math.random() * 0.4) * (0.7 + NCH * 0.1);
    }
    const stop = loop(dt => {
      t += dt; P.forEach(p => { p.cool = Math.max(0, p.cool - dt); p.shake = Math.max(0, p.shake - dt); });
      if (!over && !two && cpu) cpuStep(dt);
      if (t > 240 && !over) { over = true; host.end({ winner: -1 }); }
      draw();
    });
    function draw() {
      S.begin(); const W = S.W, H = S.H, h = H / 2, b = BD();
      g.fillStyle = '#fff8ef'; g.fillRect(0, h, W, h); g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, h);
      // 盤
      g.fillStyle = '#e8c88a'; rr(g, b.x - 6, b.y - 6, b.sz + 12, b.sz + 12, 10); g.fill();
      g.strokeStyle = '#a07a40'; g.lineWidth = 1.2; for (let k = 0; k <= N; k++) { g.beginPath(); g.moveTo(b.x + k * b.c, b.y); g.lineTo(b.x + k * b.c, b.y + b.sz); g.stroke(); g.beginPath(); g.moveTo(b.x, b.y + k * b.c); g.lineTo(b.x + b.sz, b.y + k * b.c); g.stroke(); }
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const c = board[j][i]; if (!c) continue; const x = b.x + i * b.c + b.c / 2, y = b.y + j * b.c + b.c / 2, win = winLine && winLine.some(([a, bb]) => a === i && bb === j);
        g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.arc(x + 2, y + 3, b.c * 0.42, 0, 7); g.fill();
        g.fillStyle = c.s ? COL.p2 : COL.p1; g.beginPath(); g.arc(x, y, b.c * 0.42, 0, 7); g.fill();
        if (win) { g.strokeStyle = '#ffd36b'; g.lineWidth = 4; g.stroke(); }
        txt(g, NUM[c.k], x, y, { size: b.c * 0.42, color: '#fff', flip: c.s === 1 && two });
      }
      // 手元
      [0, 1].forEach(s => H2.half(s, up => {
        const me = P[s], T = (...a) => H2.T(up, ...a), top = b.sz / 2 + 12, canSee = !up || two;
        T(`${host.players[s].name}`, 12, top + 8, { size: 13, align: 'left', color: s ? COL.p2d : COL.p1d });
        // お題(日本語)と、チャンクの並び
        const chs = me.sen.chunks;
        if (canSee) {
          g.save(); const sx = (me.shake > 0 ? Math.sin(me.shake * 60) * 6 : 0); g.translate(sx, 0);
          trayRects(s).forEach(r => btn(g, r, { size: 16, flip: up, border: '#e6dcf2' }));
          g.restore();
          T(`${NUM[me.k]}${SLV === 1 ? '「' + chs[me.k].ja + '」' : ''}:${me.built.join(' ')}${me.piece ? ' ✓' : ' _'}`, 12, top + 30, { size: 13, align: 'left', maxW: W - 120 });
          const rows = Math.ceil(me.tray.length / 4) || 1, y2 = top + 30 + 26 + rows * 46 + 4;
          wrapTxt(g, `お題:${me.sen.ja}`, W / 2, Math.min(h - 18, y2 + 8), W - 24, { size: 12, color: '#6b5a80', flip: up, weight: 700 });
        } else T(me.piece ? `${NUM[me.piece.k]} を置こうとしている…` : `${NUM[me.k]} を作っている…`, W / 2, top + 60, { size: 14, color: '#8d7f9e' });
        const pr = pieceRect(s);
        if (me.piece && !me.drag) { btn(g, { ...pr, label: `${NUM[me.piece.k]} 盤へ↑` }, { fill: s ? COL.p2 : COL.p1, color: '#fff', size: 15, flip: up }); }
        if (me.cool > 0 && !me.piece) { g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(0, top + 46, W, h); T('…', W / 2, top + 80, { size: 22 }); }
      }));
      P.forEach((me, s) => { if (me.drag) { g.fillStyle = s ? COL.p2 : COL.p1; g.globalAlpha = 0.9; g.beginPath(); g.arc(me.drag.x, me.drag.y - 30, b.c * 0.45, 0, 7); g.fill(); g.globalAlpha = 1; txt(g, NUM[me.piece.k], me.drag.x, me.drag.y - 30, { size: b.c * 0.42, color: '#fff' }); } });
      if (over && winLine) { const w = board[winLine[0][1]][winLine[0][0]].s; banner(g, S, two, '完成!', { size: 34, color: w ? COL.p2 : COL.p1 }); }
    }
    return { stop() { stop(); pt.off(); S.cv.remove(); } };
  },
};
