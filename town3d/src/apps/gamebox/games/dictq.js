// 辞書早押し:ヒント(品詞とカテゴリー → ほかの意味 → いちばんの意味)が順に出る。4つの英単語から、先に正しいものを押した方が1点
//   ふつう=同じお題 / ハンデ戦=それぞれ別の難しさのお題
import { surface, pointers, loop, txt, wrapTxt, banner, rr, clamp, btn, hit, COL, INK, shuffle, halves } from '../kit.js';
import { loadDict, quizWords, mainPos, catOf, posName } from '../en_data.js';

const LV = [[1, 'かんたん'], [2, 'ふつう'], [3, 'むずかしい']];
export default {
  id: 'dictq', en: 1, title: '辞書早押し', icon: '📖', desc: 'ヒントが出る途中で4択早押し!', rule: 'ヒントが「品詞とカテゴリー → ほかの意味 → いちばんの意味」の順に出てきます。4つの英単語から、先に正しいものを押した方が1点。まちがえると、その問題はもう押せません。',
  options: [
    { key: 'lv', label: 'むずかしさ', choices: LV, def: 1 },
    { key: 'to', label: '何本先取', choices: [[3, '3本'], [5, '5本'], [7, '7本']], def: 5 },
    { key: 'hand', label: 'ルール', choices: [['same', '同じお題で早押し'], ['hc', 'ハンデ戦(別のお題)']], def: 'same' },
    { key: 'lv2', label: 'ハンデ戦:相手のむずかしさ', choices: LV, def: 2, only: o => o.hand === 'hc' },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, TO = O.trial ? 2 : O.to || 5, HC = O.hand === 'hc';
    const levels = [O.lv || 1, HC ? (O.lv2 || 2) : (O.lv || 1)];
    let D = null, pools = [null, null], score = [0, 0], over = false, loadErr = false;
    loadDict(host.dictUrl).then(d => { D = d; pools = levels.map(l => quizWords(D, l).filter(e => catOf(e.w))); newRound(); }).catch(() => { loadErr = true; });
    let Q = null, phase = 'load', phT = 0, lock = [false, false], last = null, cpuPlan = null, flash = [0, 0];
    const RATE = 9, GAP = 1.1;   // 1秒の文字数・ヒントの間
    function makeQ(s) {
      const pool = pools[s], e = pool[Math.floor(Math.random() * pool.length)], pos = mainPos(e), cat = catOf(e.w);
      const first = e.ps.find(p => p[0] === pos) || e.ps[0], items = first[1].split('、'), main = items[0];
      const sub = [...items.slice(1), ...e.ps.filter(p => p !== first && posName(p[0])).map(p => `(${posName(p[0])})${p[1]}`)].join('、');
      const hints = [`${posName(pos)} ・ ${cat}`, sub ? `ほかの意味:${sub}` : `${e.w.length}文字の単語`, `いちばんの意味:${main}`];
      // まちがいの3つ:同じ品詞で、なるべく同じカテゴリー・近い難しさ
      const same = pool.filter(x => x !== e && mainPos(x) === pos && catOf(x.w) === cat && Math.abs(x.rank - e.rank) < 3000);
      const near = pool.filter(x => x !== e && mainPos(x) === pos && Math.abs(x.rank - e.rank) < 1500 && !same.includes(x));
      const anyPos = pool.filter(x => x !== e && mainPos(x) === pos);
      const others = [...shuffle(same).slice(0, 2), ...shuffle(near), ...shuffle(anyPos)].filter((x, i, a) => a.findIndex(y => y.w === x.w) === i && x.w !== e.w).slice(0, 3);
      const lines = []; let at = 0; hints.forEach(h => { lines.push({ text: h, at }); at += h.length / RATE + GAP; });
      return { e, lines, end: at, choices: shuffle([e, ...others]), done: false };
    }
    function newRound() {
      if (over) return;
      Q = HC ? [makeQ(0), makeQ(1)] : (q => [q, q])(makeQ(0));
      lock = [false, false]; phase = 'show'; phT = 0; Q.wait = 0;
      // CPU:わかるか・どのヒントで答えるか
      if (!two) {
        const diff = levels[1], know = Math.random() < clamp([0, 0.6, 0.76, 0.9][lv] - (diff - 1) * 0.1, 0.25, 0.97);
        const q = Q[1], li = know ? (Math.random() < [0, 0.1, 0.3, 0.55][lv] ? 0 : Math.random() < 0.5 ? 1 : 2) : 2;
        cpuPlan = { know, t: q.lines[li].at + q.lines[li].text.length / RATE * (0.5 + Math.random() * 0.6) + 0.8 + Math.random() * (4 - lv) * 0.6 };
      }
    }
    function answer(s, w) {
      const q = Q[s]; if (q.done || lock[s] || phase !== 'show') return;
      if (w === q.e.w) { score[s]++; q.done = true; sfx.play('point'); last = { s, ok: true }; flash[s] = 1; endRound(); }
      else { sfx.play('ng'); lock[s] = true; if (lock[0] && lock[1]) { last = { s: -1 }; endRound(); } }
    }
    function endRound() {
      phase = 'reveal'; phT = 0;
      if (score[0] >= TO || score[1] >= TO) { over = true; setTimeout(() => host.end({ winner: score[0] > score[1] ? 0 : 1, score }), 2600); }
    }
    const choiceRects = (s, h) => Q[s].choices.map((e, i) => ({ x: 12 + (i % 2) * ((S.W - 24) / 2 + 6), y: h - 160 + Math.floor(i / 2) * 66, w: (S.W - 36) / 2, h: 58, label: e.w, e }));
    const pt = pointers(S.cv, {
      onDown: p => {
        const s = two ? p.side : 0; if (s === 1 && !two) return; if (!Q || phase !== 'show') return;
        const l = H2.local(p, s); for (const b of choiceRects(s, S.H / 2)) if (hit(b, l)) { sfx.play('tap'); return answer(s, b.e.w); }
      },
    });
    const stop = loop(dt => {
      phT += dt; flash[0] = Math.max(0, flash[0] - dt * 2); flash[1] = Math.max(0, flash[1] - dt * 2);
      if (phase === 'show') {
        if (cpuPlan && !lock[1] && phT >= cpuPlan.t) { const q = Q[1]; answer(1, cpuPlan.know ? q.e.w : (q.choices.find(x => x !== q.e) || q.e).w); cpuPlan = null; }
        if (phT > Math.max(Q[0].end, Q[1].end) + 6) { last = { s: -1 }; endRound(); }
      } else if (phase === 'reveal' && phT > 2.8 && !over) newRound();
      draw();
    });
    function draw() {
      S.begin(); const W = S.W, H = S.H, h = H / 2;
      g.fillStyle = '#fff8ef'; g.fillRect(0, 0, W, H); g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, h);
      g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h); g.lineTo(W, h); g.stroke();
      if (!D || !Q) { banner(g, S, two, loadErr ? '辞書が読めませんでした' : '辞書をよみこみ中…', { size: 20 }); return; }
      [0, 1].forEach(s => H2.half(s, up => {
        const q = Q[s], T = (...a) => H2.T(up, ...a), canSee = !up || two;
        if (flash[s] > 0) { g.fillStyle = `rgba(255,211,107,${flash[s] * 0.35})`; g.fillRect(0, 0, W, h); }
        T(`${host.players[s].name}  ${score[s]} / ${TO}`, 12, 18, { size: 14, align: 'left', color: s ? COL.p2d : COL.p1d });
        T(LV[levels[s] - 1][1], W - 12, 18, { size: 12, align: 'right', color: '#8d7f9e' });
        // ヒントのカード(3行。上から順に出る)
        const cardH = Math.min(150, h - 190);
        g.fillStyle = '#fff'; rr(g, 12, 32, W - 24, cardH, 14); g.fill(); g.strokeStyle = '#e6dcf2'; g.lineWidth = 2; g.stroke();
        const t = phase === 'show' ? phT : 99;
        let y = 52;
        q.lines.forEach((L, i) => {
          if (t < L.at) return;
          const n = Math.min(L.text.length, Math.floor((t - L.at) * RATE)), typing = n < L.text.length;
          const o = { size: i === 0 ? 15 : 13, color: i === 0 ? '#6b4a9a' : i === 2 ? INK : '#6b5a80', weight: i === 1 ? 600 : 800, flip: up };
          const lines = Math.min(3, Math.ceil((L.text.length * (o.size + 1)) / (W - 48)));
          const cy = y + (lines - 1) * (o.size + 3) / 2;
          wrapTxt(g, L.text.slice(0, n) + (typing && phase === 'show' ? '▍' : ''), W / 2, up ? 64 + cardH - cy : cy, W - 48, o);   // 上向きの人は、上から読めるように並びを逆に
          y += lines * (o.size + 4) + 8;
        });
        if (phase === 'reveal') {
          const L = last, mine = L && L.s === s;
          T(L && L.s >= 0 ? (mine ? '⭕ 正解!' : '…先をこされた') : '答え', W / 2, h - 176, { size: 15, color: mine ? '#3fbf6a' : '#8d7f9e' });
          T(q.e.w, W / 2, h - 120, { size: 36, color: mine ? '#3fbf6a' : INK, font: 'Georgia,serif' });
          return;
        }
        if (!canSee) { T(lock[s] ? '× まちがえた' : '…考え中', W / 2, h - 90, { size: 18, color: '#8d7f9e' }); return; }
        choiceRects(s, h).forEach(b => btn(g, b, { size: 20, flip: up, border: '#e6dcf2', alpha: lock[s] ? 0.35 : 1, font: 'Georgia,serif' }));
        if (lock[s]) T('× まちがい… この問題はおしまい', W / 2, h - 176, { size: 14, color: '#ff5a5a' });
      }));
      if (phase === 'reveal' && last && last.s >= 0) banner(g, S, two, `${host.players[last.s].name} +1`, { size: 22, color: last.s ? COL.p2 : COL.p1 });
    }
    return { stop() { stop(); pt.off(); S.cv.remove(); } };
  },
};
