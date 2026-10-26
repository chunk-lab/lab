// チャンクレース(自分の後ろから見るカート)。左・まん中・右の3レーンに、単語かチャンクが1つずつ。
//   左右フリックでレーンを変えて、文の順に正しいものを通る。正解で加速(連続でどんどん速く)、まちがいで1段階減速。
//   ★の文を完成させると特殊効果(ターボ・相手スリップ・ジャンプ)。文をたくさん作ってゴールへ。
import { surface, pointers, loop, txt, wrapTxt, banner, rr, clamp, btn, hit, COL, INK, shuffle, halves, lerp, speak } from '../kit.js';
import { pickSentence, sentences, words } from '../en_data.js';

const GAP = 90, FOV = 15, LMAX = 7;   // 次の看板は、いちばん奥から近づいてくる
const vOf = L => 12 + L * 5;
const FX = { turbo: ['🚀 ターボ!', 'しばらく超スピード'], slip: ['🍌 相手スリップ!', '相手が2段階ダウン'], jump: ['🦘 ジャンプ!', '60m ワープ'] };
export default {
  id: 'race', title: 'チャンクレース', icon: '🏎️', desc: 'フリックでレーンを選んで文をつくる', rule: '左・まん中・右のレーンに、単語(またはチャンク)が置いてあります。上の3つのボタンか、道の看板をタップすると、そのレーンへ移って取りに行く(加速!)。レーンをタップ・フリックでも移れる。文の順に正しいものを通ろう。正解でさらに加速、まちがえると大きく減速。いちばん速いときにまちがえるとクラッシュ! ★の文を完成させると特殊効果。先にゴールした方の勝ち。',
  options: [
    { key: 'unit', label: '置いてあるもの', choices: [['chunk', 'チャンク'], ['word', '単語']], def: 'chunk' },
    { key: 'lv', label: '文のむずかしさ', choices: [[1, 'やさしい'], [2, 'ふつう'], [3, 'むずかしい']], def: 1 },
    { key: 'len', label: 'コースの長さ', choices: [[1000, 'みじかい'], [1800, 'ふつう'], [2700, 'ながい']], def: 1800 },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, GOAL = O.trial ? 800 : O.len || 1800, WORD = O.unit === 'word', LV = O.lv || 1;
    let t = 0, count = 3, over = false, nSen = 0;
    const used = [];
    const unitsOf = s => WORD ? words(s) : s.chunks.map(c => c.en);
    function newSen(R) {
      const s = pickSentence(LV, 0, used); used.push(s); if (used.length > 24) used.shift();
      R.sen = s; R.units = unitsOf(s); R.k = 0; R.star = (R.done + 1) % 3 === 0;
    }
    const ORD = 'FSVIOCPT', rk = r => { const i = ORD.indexOf(r); return i < 0 ? 9 : i; };
    function makeRow(R, z) {
      const need = R.units[R.k], wrong = [], role = {}; role[need] = R.sen.chunks[R.k] ? R.sen.chunks[R.k].role : '';
      R.units.slice(R.k + 1).forEach((u, i) => { if (wrong.length < 1 && u !== need) { wrong.push(u); role[u] = R.sen.chunks[R.k + 1 + i] ? R.sen.chunks[R.k + 1 + i].role : ''; } });
      for (const s of shuffle(sentences())) { if (wrong.length >= 2) break; const us = unitsOf(s); for (const i of shuffle(us.map((_, i) => i))) { const u = us[i]; if (u !== need && !wrong.includes(u) && !R.units.slice(0, R.k).includes(u)) { wrong.push(u); role[u] = s.chunks[i] ? s.chunks[i].role : ''; break; } } }
      let lanes = shuffle([need, ...wrong.slice(0, 2)]);
      // チャンクは、英語の語順(主役→どうしてる→何を…)で、いつも同じ並びに置く。毎回ばらばらにならないので、読んで順に取っていける
      if (!WORD) lanes = lanes.map((u, i) => ({ u, i })).sort((x, y) => rk(role[x.u]) - rk(role[y.u]) || x.i - y.i).map(x => x.u);
      // 新しい文の最初は、日本語を読む時間をとるため、すこし遠くから来る
      return { z: R.k === 0 ? z + GAP * 0.9 : z, lanes, ok: lanes.indexOf(need), born: t, hit: -1 };
    }
    const R = [0, 1].map(i => ({ i, z: 0, L: 1, lane: 1, lx: 1, combo: 0, done: 0, spin: 0, turbo: 0, fin: -1, pop: null, popT: 0, sen: null, units: [], k: 0, star: false, row: null, cpuLane: 1, log: [] }));
    R.forEach(r => { newSen(r); r.row = makeRow(r, GAP); });
    function pop(r, a, b, col) { r.pop = { a, b, col }; r.popT = 1.4; }
    function pass(r) {
      const row = r.row, ok = r.lane === row.ok; row.hit = r.lane;
      if (ok) {
        r.k++; r.combo++; r.L = Math.min(LMAX, r.L + 1 + (r.rush ? 1 : 0)); sfx.play(r.combo >= 3 ? 'item' : 'ok');
        if (r.k >= r.units.length) {
          r.done++; nSen++; if (r.i === 0 || two) speak(r.sen.en, 1);   // 文ができたら読み上げる
          if (r.star) {
            const k = ['turbo', 'slip', 'jump'][Math.floor(Math.random() * 3)], o = R[1 - r.i];
            if (k === 'turbo') r.turbo = 3.2; else if (k === 'slip') { o.L = Math.max(0, o.L - 2); o.spin = 1; o.combo = 0; } else r.z += 60;
            pop(r, FX[k][0], FX[k][1], '#ffb400'); sfx.play('win');
          } else pop(r, '文ができた!', r.sen.en, '#3fbf6a');
          newSen(r);
        } else if (r.combo >= 3) pop(r, `${r.combo}連続!`, 'スピードアップ', '#ff7aa2');
      } else if (r.L >= LMAX) { r.combo = 0; r.L = 0; r.spin = 1.8; sfx.play('boom'); pop(r, '💥 クラッシュ!', `「${r.units[r.k]}」だった`, '#ff5a5a'); }   // いちばん速いときにまちがえると
      else { r.combo = 0; r.L = Math.max(0, r.L - 3); r.spin = 0.8; sfx.play('ng'); pop(r, '× ちがう 大きく減速', `「${r.units[r.k]}」だった`, '#ff5a5a'); }
      r.rush = false;
      r.row = makeRow(r, row.z + GAP);
    }
    // ---- 操作(左右フリック。左右のはしをタップでもOK) ----
    const downs = new Map();
    const loc = (p, s) => two ? H2.local(p, s) : { x: p.x, y: p.y };
    const pt = pointers(S.cv, {
      onDown: p => { const s = two ? p.side : 0; if (s === 1 && !two) return; downs.set(p.id, { s, l: loc(p, s) }); },
      onUp: p => {
        const d = downs.get(p.id); downs.delete(p.id); if (!d || count > 0) return; const r = R[d.s]; if (r.fin >= 0) return;
        const l = loc(p, d.s), dx = l.x - d.l.x;
        if (Math.abs(dx) > 22) { go(r, clamp(r.lane + Math.sign(dx), 0, 2), false); return; }   // フリック
        const H = r.hits || {};
        for (const [i, b] of (H.btn || []).entries()) if (hit(b, l)) return go(r, i, true);    // 上のボタン → 取りに行く
        for (const [i, b] of (H.sign || []).entries()) if (hit(b, l)) return go(r, i, true);   // 道の看板 → 取りに行く
        if (l.y > (H.road || 0)) go(r, l.x < S.W / 3 ? 0 : l.x < S.W * 2 / 3 ? 1 : 2, false);   // レーンをタップ → すぐそのレーン
      },
    });
    function go(r, lane, rush) { if (lane !== r.lane) sfx.play('whoosh'); r.lane = lane; if (rush && !r.rush) { r.rush = true; sfx.play('item'); } }
    const stop = loop(dt => {
      t += dt;
      if (count > -1) { const c0 = Math.ceil(count); count -= dt; if (count > 0 && Math.ceil(count) !== c0) sfx.play('count'); if (count <= 0 && c0 === 1) sfx.play('go'); }
      R.forEach(r => {
        r.lx += (r.lane - r.lx) * Math.min(1, dt * 12); r.popT = Math.max(0, r.popT - dt); r.spin = Math.max(0, r.spin - dt); r.turbo = Math.max(0, r.turbo - dt);
        if (count > 0 || r.fin >= 0 || over) return;
        // CPU:レーンを選ぶ(正しい方へ。たまにまちがえる)
        if (!two && r.i === 1 && cpu) {
          const row = r.row; if (row.cpu == null) { const ok = Math.random() < [0, 0.88, 0.95, 0.99][lv] - (LV - 1) * 0.03; row.cpu = ok ? row.ok : [0, 1, 2].filter(x => x !== row.ok)[Math.floor(Math.random() * 2)]; row.cpuAt = row.z - GAP * (0.25 + Math.random() * 0.4); if (ok && Math.random() < [0, 0.35, 0.6, 0.85][lv]) r.rush = true; }
          if (r.z > row.cpuAt) r.lane = row.cpu;
        }
        const v = vOf(r.L) * (r.turbo > 0 ? 1.5 : 1) * (r.rush ? 1.7 : 1) * (r.spin > 0 ? (r.spin > 0.9 ? 0.05 : 0.45) : 1);
        r.z += v * dt;
        if (r.z >= r.row.z) pass(r);
        if (r.z >= GOAL && r.fin < 0) { r.fin = t; sfx.play('goal'); if (!over) { over = true; setTimeout(() => host.end({ winner: r.i, text: `${host.players[r.i].name} ゴール! (文 ${r.done}こ)` }), 2200); } }
      });
      draw();
    });
    // ---- 描く ----
    function kart(x, y, sc, col, spin, me) {
      g.save(); g.translate(x, y); g.scale(sc, sc); if (spin > 0) g.rotate(Math.sin(spin * 20) * 0.35);
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(0, 18, 46, 10, 0, 0, 7); g.fill();
      g.fillStyle = '#333'; rr(g, -46, -2, 20, 24, 6); g.fill(); rr(g, 26, -2, 20, 24, 6); g.fill();
      g.fillStyle = col; rr(g, -34, -16, 68, 30, 12); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)'; rr(g, -26, -12, 52, 8, 4); g.fill();
      g.fillStyle = '#ffd36b'; g.fillRect(-22, 10, 10, 5); g.fillRect(12, 10, 10, 5);
      g.fillStyle = me ? '#ffe0c8' : '#ffe0c8'; g.beginPath(); g.arc(0, -26, 14, 0, 7); g.fill();
      g.fillStyle = col; g.beginPath(); g.arc(0, -29, 15, Math.PI, 0); g.fill(); g.fillRect(-15, -30, 30, 5);
      g.restore();
    }
    function view(r, W, h) {
      const o = R[1 - r.i], hor = Math.max(h * 0.36, 158), BW = W * 1.25; r.hits = { btn: [], sign: [], road: hor + (h - hor) * 0.25 };
      const yOf = d => hor + (h - hor) * FOV / (Math.max(-FOV * 0.9, d) + FOV), sOf = d => FOV / (Math.max(-FOV * 0.9, d) + FOV);
      const laneX = (ln, d) => W / 2 + (ln - 1) * (BW / 3) * sOf(d);
      // 空と山
      let gr = g.createLinearGradient(0, 0, 0, hor); gr.addColorStop(0, '#9fd3ff'); gr.addColorStop(1, '#e6f6ff'); g.fillStyle = gr; g.fillRect(0, 0, W, hor);
      g.fillStyle = '#b7dca0'; g.beginPath(); g.moveTo(0, hor); for (let x = 0; x <= W; x += 20) g.lineTo(x, hor - 18 - Math.sin(x * 0.02 + r.z * 0.002) * 12 - Math.sin(x * 0.05) * 6); g.lineTo(W, hor); g.fill();
      g.fillStyle = '#9ccf7f'; g.fillRect(0, hor, W, h - hor);
      // 道
      const dFar = 400, dNear = -6;
      g.fillStyle = '#7d7a8c'; g.beginPath(); g.moveTo(W / 2 - BW / 2 * sOf(dFar), yOf(dFar)); g.lineTo(W / 2 + BW / 2 * sOf(dFar), yOf(dFar)); g.lineTo(W / 2 + BW / 2 * sOf(dNear), yOf(dNear)); g.lineTo(W / 2 - BW / 2 * sOf(dNear), yOf(dNear)); g.fill();
      // しま(スピード感)
      for (let k = 0; k < 40; k++) {
        const z0 = Math.floor(r.z / 8) * 8 + k * 8 - 8, d0 = z0 - r.z, d1 = d0 + 4; if (d0 < dNear || d0 > dFar) continue;
        const col = (z0 / 8) % 2 ? '#ffffff' : '#ff6b6b';
        for (const sd of [-1, 1]) { g.fillStyle = col; g.beginPath(); g.moveTo(W / 2 + sd * BW / 2 * sOf(d0), yOf(d0)); g.lineTo(W / 2 + sd * (BW / 2 + 10) * sOf(d0), yOf(d0)); g.lineTo(W / 2 + sd * (BW / 2 + 10) * sOf(d1), yOf(d1)); g.lineTo(W / 2 + sd * BW / 2 * sOf(d1), yOf(d1)); g.fill(); }
        if ((z0 / 8) % 2 === 0) for (const ln of [0.5, 1.5]) { g.fillStyle = 'rgba(255,255,255,0.7)'; const x0 = W / 2 + (ln - 1) * (BW / 3) * sOf(d0), x1 = W / 2 + (ln - 1) * (BW / 3) * sOf(d1); g.beginPath(); g.moveTo(x0 - 2 * sOf(d0), yOf(d0)); g.lineTo(x0 + 2 * sOf(d0), yOf(d0)); g.lineTo(x1 + 2 * sOf(d1), yOf(d1)); g.lineTo(x1 - 2 * sOf(d1), yOf(d1)); g.fill(); }
      }
      // ゴール
      const dg = GOAL - r.z; if (dg < dFar && dg > dNear) { const y = yOf(dg), s = sOf(dg); for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#222' : '#fff'; g.fillRect(W / 2 - BW / 2 * s + i * BW * s / 12, y - 6 * s, BW * s / 12, 12 * s); } }
      // 看板(いまの行 + 通りすぎた行)
      const row = r.row, d = row.z - r.z, s = sOf(d), y = yOf(d), appear = Math.min(1, (t - row.born) * 4);
      g.globalAlpha = appear;
      row.lanes.forEach((u, ln) => {
        const x = laneX(ln, d), bw = BW / 3 * 0.9 * s, bh = Math.max(16, 46 * s);
        g.fillStyle = 'rgba(0,0,0,0.18)'; rr(g, x - bw / 2, y - bh - 4 * s, bw, bh, 8 * s); g.fill();
        g.fillStyle = r.star ? '#fff4c2' : '#fff'; rr(g, x - bw / 2, y - bh - 8 * s, bw, bh, 8 * s); g.fill();
        g.strokeStyle = r.star ? '#ffb400' : '#d8cfe6'; g.lineWidth = 2; g.stroke();
        txt(g, u, x, y - bh / 2 - 8 * s, { size: Math.max(9, 20 * s), font: 'Georgia,serif', weight: 700, maxW: bw - 6 });
        r.hits.sign[ln] = { x: x - Math.max(bw, 60) / 2, y: y - bh - 20, w: Math.max(bw, 60), h: bh + 26 };
        if (ln === r.lane && r.rush) { g.strokeStyle = '#ffb400'; g.lineWidth = 3; rr(g, x - bw / 2 - 3, y - bh - 8 * s - 3, bw + 6, bh + 6, 8 * s); g.stroke(); }
      });
      g.globalAlpha = 1;
      // 相手のカート(近くにいたら)
      const od = o.z - r.z; if (od > -5 && od < dFar) kart(laneX(o.lx, od + 3), yOf(od + 3), sOf(od + 3) * 0.9, o.i ? COL.p2 : COL.p1, o.spin, false);
      // 自分
      kart(laneX(r.lx, 3), yOf(3), sOf(3) * 0.95 * Math.min(1.2, W / 360), r.i ? COL.p2 : COL.p1, r.spin, true);
      // 日本語の文と、できたところも、キャラの目の前(選択肢のすぐ上)に出す
      { const ky0 = yOf(3), bh0 = clamp(h * 0.14, 40, 54), by0 = Math.max(hor + 8, ky0 - 66 - bh0), parts = r.units.map((u, i) => i < r.k ? u : '＿'.repeat(Math.min(3, Math.max(1, Math.round(u.length / 4))))).join(' ');
        g.fillStyle = 'rgba(255,255,255,0.92)'; rr(g, 8, by0 - 64, W - 16, 58, 12); g.fill();
        txt(g, (r.star ? '★ ' : '') + r.sen.ja, W / 2, by0 - 50, { size: 14, color: r.star ? '#c98a00' : '#6b5a80', maxW: W - 30 });
        wrapTxt(g, parts, W / 2, by0 - 26, W - 32, { size: 15, font: 'Georgia,serif', weight: 700 }); }
      // いまの3つの選択肢を、キャラの目の前(せまってくる看板より手前)に出しっぱなしにする。タップで取りに行く/フリックでレーンを変える
      { const ky = yOf(3), bh = clamp(h * 0.14, 40, 54), by = Math.max(hor + 8, ky - 66 - bh), bw = (W - 28) / 3;
        row.lanes.forEach((u, ln) => { const b = { x: 8 + ln * (bw + 6), y: by, w: bw, h: bh }; r.hits.btn[ln] = b; btn(g, { ...b, label: u }, { size: clamp(bw / 7, 13, 18), font: 'Georgia,serif', fill: ln === r.lane ? (r.rush ? '#ffe08a' : '#fff4c2') : '#fff', border: ln === r.lane ? '#ffb400' : '#e6dcf2', shadow: false, maxW: bw - 8 }); }); }
      if (r.turbo > 0) { g.fillStyle = 'rgba(255,180,0,0.25)'; g.fillRect(0, 0, W, h); for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28, rr0 = W * 0.3; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * rr0, hor + Math.sin(a) * rr0); g.lineTo(W / 2 + Math.cos(a) * rr0 * 2, hor + Math.sin(a) * rr0 * 2); g.stroke(); } }
      // ---- 上のメーター ----
      g.fillStyle = 'rgba(255,255,255,0.92)'; rr(g, 8, 8, W - 16, 40, 12); g.fill();
      // スピードと位置
      // つぎの3つ(遠くにあっても、ここで見える。タップで取りに行く)

      for (let i = 0; i < LMAX; i++) { g.fillStyle = i < r.L ? (i < 3 ? '#8fe0b0' : i < 5 ? '#ffd36b' : '#ff7aa2') : '#e6e0ee'; rr(g, 16 + i * 14, 20, 11, 16, 3); g.fill(); }
      txt(g, r.L >= LMAX ? 'MAX!注意' : r.combo >= 2 ? `${r.combo}連続` : 'スピード', 16 + LMAX * 14 + 4, 28, { size: 11, align: 'left', color: r.L >= LMAX ? '#ff5a5a' : '#8d7f9e' });
      const bx = W * 0.52, bw = W * 0.42; g.fillStyle = '#e6e0ee'; rr(g, bx, 24, bw, 8, 4); g.fill();
      [o, r].forEach(q => { const x = bx + clamp(q.z / GOAL, 0, 1) * bw; g.fillStyle = q.i ? COL.p2 : COL.p1; g.beginPath(); g.arc(x, 28, q === r ? 7 : 5, 0, 7); g.fill(); });
      txt(g, '🏁', bx + bw + 2, 28, { size: 12, align: 'left' });
      // ポップ
      if (r.popT > 0) { const a = Math.min(1, r.popT * 2), y0 = hor + 30 - (1.4 - r.popT) * 20; g.globalAlpha = a; txt(g, r.pop.a, W / 2, y0, { size: 26, color: r.pop.col, stroke: '#fff', sw: 6 }); txt(g, r.pop.b, W / 2, y0 + 28, { size: 13, color: INK, stroke: '#fff', sw: 4, maxW: W - 30, font: r.pop.b === r.sen?.en ? 'Georgia,serif' : 'sans-serif' }); g.globalAlpha = 1; }
      if (r.fin >= 0) { g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(0, 0, W, h); txt(g, 'ゴール!', W / 2, h / 2, { size: 40, color: r.i ? COL.p2d : COL.p1d, stroke: '#fff', sw: 8 }); }
      if (count > 0 || t < 3.3) { const c = count > 0.3 ? String(Math.ceil(count)) : 'GO!'; txt(g, c, W / 2, hor + 60, { size: 54, color: '#ff7aa2', stroke: '#fff', sw: 8 }); if (count > 0) txt(g, '上のボタン・看板・レーンをタップ / フリック', W / 2, h - 30, { size: 14, color: '#fff', stroke: INK, sw: 4 }); }
    }
    function draw() {
      S.begin(); const W = S.W, H = S.H;
      if (!two) { view(R[0], W, H); return; }
      [0, 1].forEach(s => H2.half(s, () => viewHalf(s, W, H / 2)));   // 半分の中は y=0 がまん中(遠く)・端が手元(近く)
      g.fillStyle = INK; g.fillRect(0, H / 2 - 1.5, W, 3);
    }
    function viewHalf(s, W, h) { g.save(); g.beginPath(); g.rect(0, 0, W, h); g.clip(); view(R[s], W, h); g.restore(); }
    return { stop() { stop(); pt.off(); S.cv.remove(); } };
  },
};
