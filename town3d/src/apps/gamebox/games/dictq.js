// 辞書早押し:日本語の意味が頭から1文字ずつ出てくる。わかったら早押しして、英単語を答える
//   ふつう=同じお題を早押し / ハンデ戦=それぞれ別の難しさのお題を、早く正解した方が1点
import { surface, pointers, loop, txt, wrapTxt, banner, rr, clamp, btn, hit, COL, INK, shuffle, halves, keyboard } from '../kit.js';
import { loadDict, quizWords, meaningText, mainPos } from '../en_data.js';

const LV = [[1, 'かんたん'], [2, 'ふつう'], [3, 'むずかしい']];
export default {
  id: 'dictq', en: 1, title: '辞書早押し', icon: '📖', desc: '意味が出てくる途中で早押し!', rule: '日本語の意味が頭から少しずつ出てきます。わかったら早押しして、英単語を答えよう。まちがえると、その問題はもう押せません。',
  options: [
    { key: 'lv', label: 'むずかしさ', choices: LV, def: 1 },
    { key: 'to', label: '何本先取', choices: [[3, '3本'], [5, '5本'], [7, '7本']], def: 5 },
    { key: 'ans', label: '答え方', choices: [['choice', '4つから選ぶ'], ['type', '入力する']], def: 'choice' },
    { key: 'hand', label: 'ルール', choices: [['same', '同じお題で早押し'], ['hc', 'ハンデ戦(別のお題)']], def: 'same' },
    { key: 'lv2', label: 'ハンデ戦:相手のむずかしさ', choices: LV, def: 2, only: o => o.hand === 'hc' },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, TO = O.trial ? 2 : O.to || 5, HC = O.hand === 'hc', TYPE = O.ans === 'type';
    const levels = [O.lv || 1, HC ? (O.lv2 || 2) : (O.lv || 1)];
    let D = null, pools = [null, null], score = [0, 0], over = false, loadErr = false;
    loadDict(host.dictUrl).then(d => { D = d; pools = levels.map(l => quizWords(D, l)); newRound(); }).catch(() => { loadErr = true; });
    // 1問ぶんの状態(ハンデ戦は人ごと、ふつうは共通)
    let Q = null, phase = 'load', phT = 0, buzzer = -1, ansT = 0, typed = ['', ''], lock = [false, false], last = null, cpuPlan = [null, null];
    const pickWord = s => { const p = pools[s]; return p[Math.floor(Math.random() * p.length)]; };
    function makeQ(s) {
      const e = pickWord(s), pos = mainPos(e), text = meaningText(e);
      const others = shuffle(pools[s].filter(x => x !== e && mainPos(x) === pos && Math.abs(x.rank - e.rank) < 1500)).slice(0, 3);
      const head = Math.max(0, text.indexOf('】') + 1);   // 品詞のラベルはすぐ出す
      return { e, text, head, shown: head, choices: shuffle([e, ...others]), done: false, wrong: false };
    }
    function newRound() {
      if (over) return;
      Q = HC ? [makeQ(0), makeQ(1)] : (q => [q, q])(makeQ(0));
      buzzer = -1; lock = [false, false]; typed = ['', '']; phase = 'show'; phT = 0;
      for (const s of [0, 1]) planCpu(s);
    }
    // CPU の作戦:わかるか・いつ押すか
    function planCpu(s) {
      if (s !== 1 || two) return;
      const q = Q[1], diff = levels[1], know = Math.random() < clamp([0, 0.62, 0.78, 0.92][lv] - (diff - 1) * 0.12, 0.25, 0.97);
      const body = q.text.length - q.head, at = q.head + Math.max(2, Math.floor(body * (know ? (0.3 + Math.random() * 0.4) * (1.3 - lv * 0.15) : 0.9 + Math.random() * 0.3)));
      cpuPlan[1] = { know, at, think: 0.6 + Math.random() * (4 - lv) * 0.5 };
    }
    const RATE = 7.5;   // 1秒に出る文字数
    function buzz(s) { if (HC || buzzer >= 0 || lock[s] || phase !== 'show') return; buzzer = s; ansT = 0; sfx.play('buzz'); typed[s] = ''; }
    function answer(s, w) {
      const q = Q[s]; if (q.done) return;
      if (w === q.e.w) { score[s]++; q.done = true; sfx.play('point'); last = { s, ok: true, e: q.e }; endRound(); }
      else { sfx.play('ng'); lock[s] = true; if (!HC) buzzer = -1; last = { s, ok: false, e: q.e, guess: w }; if (lock[0] && lock[1]) endRound(true); }
    }
    function endRound(nobody) {
      phase = 'reveal'; phT = 0; if (nobody) last = { s: -1, e: Q[0].e };
      if (score[0] >= TO || score[1] >= TO) { over = true; setTimeout(() => host.end({ winner: score[0] > score[1] ? 0 : 1, score }), 2600); }
    }
    // 入力
    const answerArea = (s, h) => {   // 半分の中のボタン
      const W = S.W;
      if (!TYPE) return Q[s].choices.map((e, i) => ({ x: 12 + (i % 2) * (W - 24) / 2, y: h - 150 + Math.floor(i / 2) * 64, w: (W - 36) / 2, h: 56, label: e.w, e }));
      return keyboard(W, h - 196);
    };
    const buzzBtn = h => ({ x: S.W / 2 - 100, y: h - 120, w: 200, h: 92, label: '早押し!' });
    const pt = pointers(S.cv, {
      onDown: p => {
        const s = two ? p.side : 0; if (s === 1 && !two) return; if (!Q || phase !== 'show') return;
        const l = H2.local(p, s), h = S.H / 2;
        if (!HC && buzzer !== s) { if (hit(buzzBtn(h), l)) buzz(s); return; }
        if (lock[s]) return;
        for (const b of answerArea(s, h)) if (hit(b, l)) {
          sfx.play('tap');
          if (!TYPE) return answer(s, b.e.w);
          if (b.k === 'del') typed[s] = typed[s].slice(0, -1); else if (b.k === 'ok') { if (typed[s]) answer(s, typed[s]); } else if (typed[s].length < 16) typed[s] += b.k;
          return;
        }
      },
    });
    const stop = loop(dt => {
      phT += dt;
      if (phase === 'show') {
        for (const s of HC ? [0, 1] : [0]) { const q = Q[s]; if (!(buzzer >= 0) || HC) q.shown = Math.min(q.text.length, q.shown + dt * RATE); }
        if (!HC && buzzer >= 0) { ansT += dt; if (ansT > (TYPE ? 9 : 5)) answer(buzzer, '…'); }
        // CPU
        const c = cpuPlan[1];
        if (c && !lock[1] && !Q[1].done) {
          const q = Q[1];
          if (!HC && buzzer < 0 && q.shown >= c.at) buzz(1);
          if ((HC && q.shown >= c.at) || (!HC && buzzer === 1)) { c.think -= dt; if (c.think <= 0) { const ok = c.know && Math.random() < 0.95; answer(1, ok ? q.e.w : (q.choices.find(x => x !== q.e) || { w: 'xxx' }).w); c.think = 99; } }
        }
        // 全部出てから少したっても誰も答えない
        const all = HC ? Q.every(q => q.shown >= q.text.length) : Q[0].shown >= Q[0].text.length;
        if (all && buzzer < 0) { Q.wait = (Q.wait || 0) + dt; if (Q.wait > 5) endRound(true); }
      } else if (phase === 'reveal' && phT > 2.6 && !over) newRound();
      draw();
    });
    function draw() {
      S.begin(); const W = S.W, H = S.H, h = H / 2;
      g.fillStyle = '#fff8ef'; g.fillRect(0, 0, W, H); g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, h);
      g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h); g.lineTo(W, h); g.stroke();
      if (!D) { banner(g, S, two, loadErr ? '辞書が読めませんでした' : '辞書をよみこみ中…', { size: 20 }); return; }
      [0, 1].forEach(s => H2.half(s, up => {
        const q = Q[s], T = (...a) => H2.T(up, ...a);
        T(`${host.players[s].name}  ${score[s]} / ${TO}`, 12, 20, { size: 14, align: 'left', color: s ? COL.p2d : COL.p1d });
        T(`${LV[levels[s] - 1][1]}`, W - 12, 20, { size: 12, align: 'right', color: '#8d7f9e' });
        // 意味のカード
        g.fillStyle = '#fff'; rr(g, 12, 36, W - 24, 108, 14); g.fill(); g.strokeStyle = '#e6dcf2'; g.lineWidth = 2; g.stroke();
        const shown = q.text.slice(0, Math.floor(q.shown));
        if (up) { wrapTxt(g, shown + (phase === 'show' && q.shown < q.text.length ? '▍' : ''), W / 2, 90, W - 48, { size: 16, flip: true, weight: 700 }); }
        else wrapTxt(g, shown + (phase === 'show' && q.shown < q.text.length ? '▍' : ''), W / 2, 90, W - 48, { size: 16, weight: 700 });
        if (phase === 'reveal') {
          const L = last; T(L && L.s >= 0 && L.ok ? (L.s === s ? '⭕ 正解!' : '…') : '答え', W / 2, 168, { size: 15, color: '#8d7f9e' });
          T(q.e.w, W / 2, 200, { size: 34, color: L && L.ok && L.s === s ? '#3fbf6a' : INK, font: 'Georgia,serif' });
          return;
        }
        const mine = HC || buzzer === s, canSee = !up || two;
        if (!HC && buzzer < 0) { if (canSee) btn(g, { ...buzzBtn(h), label: lock[s] ? '× もう押せない' : '早押し!' }, { fill: lock[s] ? '#e6e6ee' : s ? COL.p2 : COL.p1, color: '#fff', size: 26, flip: up }); else T(lock[s] ? '×' : '…考え中', W / 2, h - 70, { size: 18 }); return; }
        if (!mine) { T(`${host.players[buzzer].name} が答えている…`, W / 2, h - 80, { size: 16, color: '#8d7f9e' }); return; }
        if (!canSee) { T('答えを考え中…', W / 2, h - 80, { size: 16, color: '#8d7f9e' }); return; }
        if (lock[s]) { T('× まちがい… 待ってね', W / 2, h - 80, { size: 16, color: '#ff5a5a' }); return; }
        if (TYPE) {
          T((typed[s] || '') + '_', W / 2, h - 214, { size: 26, font: 'Georgia,serif' });
          T(`${q.e.w[0]}… (${q.e.w.length}文字)`, W - 14, h - 214, { size: 11, align: 'right', color: '#8d7f9e' });
          answerArea(s, h).forEach(b => btn(g, b, { fill: b.k === 'ok' ? '#ffd36b' : '#fff', size: b.k === 'ok' ? 14 : 18, flip: up, shadow: false, border: '#e6dcf2' }));
        } else answerArea(s, h).forEach(b => btn(g, b, { size: 19, flip: up, border: '#e6dcf2' }));
        if (!HC) { const left = Math.max(0, (TYPE ? 9 : 5) - ansT); g.fillStyle = '#ffd36b'; g.fillRect(12, 150, (W - 24) * left / (TYPE ? 9 : 5), 4); }
      }));
      if (phase === 'reveal' && last && last.s >= 0 && last.ok) banner(g, S, two, `${host.players[last.s].name} +1`, { size: 22, color: last.s ? COL.p2 : COL.p1 });
    }
    return { stop() { stop(); pt.off(); S.cv.remove(); } };
  },
};
