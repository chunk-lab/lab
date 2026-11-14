// チャンク綱引き:日本語の文を見て、英語のチャンクを正しい順に押す。1文できるたびに綱を引く
import { surface, pointers, loop, txt, wrapTxt, banner, rr, clamp, btn, hit, COL, INK, shuffle, halves } from '../kit.js';
import { pickSentence } from '../en_data.js';

export default {
  id: 'tug', en: 1, title: 'チャンク綱引き', icon: '🪢', desc: 'チャンクを並べるたびに綱を引く', rule: '日本語の文を見て、英語のチャンクを正しい順に押そう。1文できるたびに綱を自分のほうへ引ける。まちがえると少し止まって、その文はやり直し。',
  options: [
    { key: 'lv', label: '文のむずかしさ', choices: [[1, 'やさしい'], [2, 'ふつう'], [3, 'むずかしい']], def: 1 },
    { key: 'to', label: '何回引いたら勝ち', choices: [[3, '3回差'], [4, '4回差'], [5, '5回差']], def: 3 },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, LIM = O.trial ? 2 : O.to || 3;
    let rope = 0, show = 0, over = false, t = 0, count = 2.2;
    const used = [];
    const P = [0, 1].map(s => ({ sen: null, tiles: [], done: 0, stun: 0, flash: 0, cpuT: 0 }));
    function deal(s) { const me = P[s]; me.sen = pickSentence(O.lv || 1, 0, used); used.push(me.sen); if (used.length > 16) used.shift(); me.tiles = shuffle(me.sen.chunks.map((c, i) => ({ c, i, ok: false }))); me.done = 0; me.cpuT = cpuTime(me.sen); }
    const cpuTime = sen => sen.chunks.length * [0, 2.3, 1.7, 1.2][lv] * (0.8 + Math.random() * 0.5);
    deal(0); deal(1);
    function tap(s, tile) {
      const me = P[s]; if (me.stun > 0 || tile.ok || over || count > 0) return;
      if (tile.i === me.done) { tile.ok = true; me.done++; sfx.play('tap'); rope += (s === 0 ? 1 : -1) * 0.12; if (me.done >= me.sen.chunks.length) pull(s); }
      else { me.stun = 0.9; sfx.play('ng'); me.tiles.forEach(x => (x.ok = false)); rope -= (s === 0 ? 1 : -1) * 0.12 * me.done; me.done = 0; }
    }
    function pull(s) {
      const me = P[s]; rope += (s === 0 ? 1 : -1) * (1 - 0.12 * me.sen.chunks.length); me.flash = 1; sfx.play('point');
      if (Math.abs(Math.round(rope * 100) / 100) >= LIM - 0.001) { over = true; setTimeout(() => host.end({ winner: rope > 0 ? 0 : 1, text: `綱 ${Math.abs(Math.round(rope))}回差` }), 1600); }
      else setTimeout(() => deal(s), 500);
    }
    const tileRects = (s, W, h) => { const n = P[s].tiles.length, cols = n <= 4 ? 2 : 2, rows = Math.ceil(n / cols), bw = (W - 30) / cols, bh = Math.min(48, (h * 0.69 - 110) / rows - 6); return P[s].tiles.map((x, k) => ({ x: 12 + (k % cols) * (bw + 6), y: h - 14 - rows * (bh + 6) + Math.floor(k / cols) * (bh + 6), w: bw, h: bh, label: x.c.en, tile: x })); };
    const pt = pointers(S.cv, { onDown: p => { const s = two ? p.side : 0; if (s === 1 && !two) return; const l = H2.local(p, s); for (const r of tileRects(s, S.W, S.H / 2)) if (hit(r, l)) return tap(s, r.tile); } });
    const stop = loop(dt => {
      t += dt; if (count > -1) { const c0 = Math.ceil(count); count -= dt; if (count > 0 && Math.ceil(count) !== c0) sfx.play('count'); }
      P.forEach(p => { p.stun = Math.max(0, p.stun - dt); p.flash = Math.max(0, p.flash - dt * 2); });
      if (!over && count <= 0 && !two && cpu) { const me = P[1]; if (me.done < me.sen.chunks.length && me.stun <= 0) { me.cpuT -= dt; const per = me.cpuT; if (per <= 0) { const nxt = me.tiles.find(x => x.i === me.done); if (Math.random() < [0, 0.08, 0.05, 0.02][lv]) tap(1, me.tiles.find(x => !x.ok && x !== nxt) || nxt); else tap(1, nxt); me.cpuT = [0, 2.3, 1.7, 1.2][lv] * (0.7 + Math.random() * 0.6); } } }
      if (!over && t > 150) { over = true; host.end({ winner: rope > 0.05 ? 0 : rope < -0.05 ? 1 : -1 }); }
      show += (rope - show) * Math.min(1, dt * 6);
      draw();
    });
    function draw() {
      S.begin(); const W = S.W, H = S.H, h = H / 2;
      g.fillStyle = '#fff3f7'; g.fillRect(0, h, W, h); g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, h);
      // 綱(よこ向き。まん中の印がどちらへ寄るか)
      const y = h, mx = W / 2 + 0, k = show / LIM, markY = h + k * h * 0.22;
      g.strokeStyle = '#c69c6d'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(W / 2, h - h * 0.27); g.lineTo(W / 2, h + h * 0.27); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 2; for (let yy = h - h * 0.27; yy < h + h * 0.27; yy += 10) { g.beginPath(); g.moveTo(W / 2 - 6, yy); g.lineTo(W / 2 + 6, yy + 6); g.stroke(); }
      g.fillStyle = '#ff5a5a'; rr(g, W / 2 - 26, markY - 8, 52, 16, 6); g.fill();
      g.strokeStyle = INK; g.lineWidth = 2; g.setLineDash([5, 5]); [h + h * 0.22, h - h * 0.22].forEach(yy => { g.beginPath(); g.moveTo(W / 2 - 50, yy); g.lineTo(W / 2 + 50, yy); g.stroke(); }); g.setLineDash([]);
      [0, 1].forEach(s => H2.half(s, up => {
        const me = P[s], T = (...a) => H2.T(up, ...a), canSee = !up || two;
        T(host.players[s].name, 12, 20, { size: 13, align: 'left', color: s ? COL.p2d : COL.p1d });
        if (me.flash > 0) { g.fillStyle = `rgba(255,211,107,${me.flash * 0.4})`; g.fillRect(0, 0, W, h); }
        g.fillStyle = '#fff'; rr(g, 12, h * 0.31, W - 24, 64, 12); g.fill(); g.strokeStyle = '#e6dcf2'; g.lineWidth = 2; g.stroke();
        wrapTxt(g, me.sen.ja, W / 2, h * 0.31 + 32, W - 44, { size: 15, flip: up, weight: 800 });
        const built = me.sen.chunks.slice(0, me.done).map(c => c.en).join(' ');
        if (canSee) {
          wrapTxt(g, built || '…', W / 2, h * 0.31 + 84, W - 40, { size: 13, color: '#3fbf6a', flip: up, font: 'Georgia,serif', weight: 700 });
          tileRects(s, W, h).forEach(r => btn(g, r, { size: 14, flip: up, fill: r.tile.ok ? '#d9f5e3' : '#fff', color: r.tile.ok ? '#8fb8a0' : INK, border: '#e6dcf2', alpha: me.stun > 0 ? 0.4 : 1 }));
        } else T(`${me.done} / ${me.sen.chunks.length} …`, W / 2, h - 80, { size: 18, color: '#8d7f9e' });
      }));
      if (count > 0) banner(g, S, two, count > 0.4 ? String(Math.ceil(count)) : 'GO!', { size: 50 });
    }
    return { stop() { stop(); pt.off(); S.cv.remove(); } };
  },
};
