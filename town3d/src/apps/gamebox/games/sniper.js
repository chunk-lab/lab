// 穴埋めスナイパー:文の1チャンクが空いている。横切っていくチャンクの中から正しいものを先に撃ちぬく
import { surface, pointers, loop, txt, wrapTxt, banner, rr, clamp, btn, hit, COL, INK, shuffle, halves } from '../kit.js';
import { pickSentence, sentences } from '../en_data.js';

export default {
  id: 'sniper', en: 1, title: '穴埋めスナイパー', icon: '🎯', desc: '空いたチャンクを撃ちぬけ', rule: '文の中の1つのチャンクが空いています。横切っていくチャンクの中から、正しいものをタップして撃ちぬこう。先に当てた方が1点。まちがえると1秒うてなくなる。',
  options: [
    { key: 'lv', label: '文のむずかしさ', choices: [[1, 'やさしい'], [2, 'ふつう'], [3, 'むずかしい']], def: 1 },
    { key: 'to', label: '何本先取', choices: [[3, '3本'], [5, '5本'], [7, '7本']], def: 5 },
    { key: 'sp', label: '的の速さ', choices: [[0.7, 'ゆっくり'], [1, 'ふつう'], [1.4, 'はやい']], def: 1 },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, TO = O.trial ? 2 : O.to || 5, SP = O.sp || 1;
    const score = [0, 0], used = [], jam = [0, 0], shots = [];
    let Q = null, phase = 'wait', phT = 0, last = null, over = false, cpuAt = 0, cpuOk = true;
    function newRound() {
      if (over) return;
      const sen = pickSentence(O.lv || 1, 0, used); used.push(sen); if (used.length > 20) used.shift();
      const bi = 1 + Math.floor(Math.random() * (sen.chunks.length - 1)), ans = sen.chunks[bi];
      const pool = [];
      shuffle(sentences()).forEach(s => s.chunks.forEach(c => { if (pool.length < 4 && c.role === ans.role && c.en !== ans.en && !pool.some(p => p.en === c.en) && !sen.chunks.some(x => x.en === c.en)) pool.push(c); }));
      shuffle(sentences()).forEach(s => s.chunks.forEach(c => { if (pool.length < 4 && c.en !== ans.en && !pool.some(p => p.en === c.en)) pool.push(c); }));
      const items = shuffle([ans, ...pool]).map((c, i) => ({ c, ok: c === ans, lane: i, x0: Math.random(), v: (40 + Math.random() * 45) * SP * (i % 2 ? -1 : 1), hit: -1 }));
      Q = { sen, bi, ans, items, t: 0 }; jam[0] = jam[1] = 0; phase = 'play'; phT = 0;
      cpuOk = Math.random() < [0, 0.7, 0.84, 0.95][lv] - ((O.lv || 1) - 1) * 0.07;
      cpuAt = [0, 8.5, 6.2, 4.4][lv] * (0.7 + Math.random() * 0.6) * (1 + (sen.chunks.length - 3) * 0.12);
    }
    const field = h => ({ y0: 156, y1: h - 18 });
    function rects(W, h) {
      const f = field(h), n = Q.items.length, lh = (f.y1 - f.y0) / n;
      return Q.items.map(it => {
        const w = Math.max(70, it.c.en.length * 9.5 + 26), span = W + w, x = (((it.x0 * span + it.v * Q.t) % span) + span) % span - w;
        return { x, y: f.y0 + it.lane * lh + (lh - 40) / 2, w, h: 40, it };
      });
    }
    function shoot(s, it, l) {
      if (phase !== 'play' || jam[s] > 0 || it.hit >= 0) return;
      shots.push({ s, x: l.x, y: l.y, t: 0.5, ok: it.ok });
      if (it.ok) { it.hit = s; score[s]++; sfx.play('hit'); last = { s }; endRound(); }
      else { jam[s] = 1; sfx.play('ng'); }
    }
    function endRound() { phase = 'show'; phT = 0; if (score[0] >= TO || score[1] >= TO) { over = true; setTimeout(() => host.end({ winner: score[0] > score[1] ? 0 : 1, score }), 2600); } }
    const pt = pointers(S.cv, {
      onDown: p => {
        const s = two ? p.side : 0; if (s === 1 && !two) return; if (phase !== 'play') return; const l = H2.local(p, s);
        for (const r of rects(S.W, S.H / 2)) if (hit({ x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12 }, l)) return shoot(s, r.it, l);
        sfx.play('tap');
      },
    });
    setTimeout(newRound, 700);
    const stop = loop(dt => {
      phT += dt; jam[0] = Math.max(0, jam[0] - dt); jam[1] = Math.max(0, jam[1] - dt);
      shots.forEach(x => (x.t -= dt)); while (shots.length && shots[0].t <= 0) shots.shift();
      if (phase === 'play') {
        Q.t += dt;
        if (!two && cpu && phT >= cpuAt && jam[1] <= 0) {
          const rs = rects(S.W, S.H / 2).filter(r => r.x > 10 && r.x + r.w < S.W - 10), r = rs.find(r => r.it.ok === cpuOk) || null;
          if (r) { shoot(1, r.it, { x: r.x + r.w / 2, y: r.y + 20 }); if (!cpuOk) { cpuOk = Math.random() < 0.8; cpuAt = phT + 1.6 + Math.random() * 2; } }
        }
        if (phT > 30) { last = { s: -1 }; endRound(); }
      } else if (phase === 'show' && phT > 2.8 && !over) newRound();
      draw();
    });
    function draw() {
      S.begin(); const W = S.W, H = S.H, h = H / 2;
      g.fillStyle = '#f3fff6'; g.fillRect(0, h, W, h); g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, h);
      g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h); g.lineTo(W, h); g.stroke();
      if (!Q) return;
      const rs = rects(W, h);
      [0, 1].forEach(s => H2.half(s, up => {
        const T = (...a) => H2.T(up, ...a), canSee = !up || two;
        T(`${host.players[s].name}  ${score[s]} / ${TO}`, 12, 18, { size: 14, align: 'left', color: s ? COL.p2d : COL.p1d });
        // お題カード
        g.fillStyle = '#fff'; rr(g, 12, 32, W - 24, 112, 14); g.fill(); g.strokeStyle = '#e6dcf2'; g.lineWidth = 2; g.stroke();
        const shown = Q.sen.chunks.map((c, i) => i === Q.bi ? (phase === 'show' ? `[${c.en}]` : '＿＿＿') : c.en).join(' ');
        wrapTxt(g, shown, W / 2, 72, W - 44, { size: 17, font: 'Georgia,serif', flip: up, weight: 700 });
        wrapTxt(g, Q.sen.ja, W / 2, 122, W - 44, { size: 12, color: '#6b5a80', flip: up, weight: 700 });
        // 的
        g.save(); g.beginPath(); g.rect(0, field(h).y0 - 8, W, field(h).y1 - field(h).y0 + 16); g.clip();
        rs.forEach(r => {
          const done = phase === 'show', good = r.it.ok, fill = done ? (good ? '#d9f5e3' : '#f2eef6') : '#fff';
          if (done && !good) return;
          btn(g, { ...r, label: r.it.c.en }, { fill, size: 15, flip: up, border: done ? '#3fbf6a' : '#e6dcf2', alpha: jam[s] > 0 && canSee ? 0.45 : 1 });
        });
        g.restore();
        shots.filter(x => x.s === s).forEach(x => { const a = x.t / 0.5; g.strokeStyle = x.ok ? `rgba(63,191,106,${a})` : `rgba(255,90,90,${a})`; g.lineWidth = 3; g.beginPath(); g.arc(x.x, x.y, 26 - a * 12, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x.x - 30, x.y); g.lineTo(x.x + 30, x.y); g.moveTo(x.x, x.y - 30); g.lineTo(x.x, x.y + 30); g.stroke(); });
        if (jam[s] > 0 && phase === 'play') T('× ジャム!', W / 2, field(h).y0 - 4, { size: 14, color: '#ff5a5a' });
        if (phase === 'show') T(last && last.s === s ? '🎯 命中!' : last && last.s >= 0 ? '…先をこされた' : '時間切れ', W / 2, (field(h).y0 + field(h).y1) / 2 + 40, { size: 20, color: last && last.s === s ? '#3fbf6a' : '#8d7f9e' });
      }));
      if (phase === 'show' && last && last.s >= 0) banner(g, S, two, `${host.players[last.s].name} +1`, { size: 20, color: last.s ? COL.p2 : COL.p1 });
    }
    return { stop() { stop(); pt.off(); S.cv.remove(); } };
  },
};
