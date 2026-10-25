// 聞き取り早押し:英語の文が読み上げられる。合う日本語を先に選んだ方が1点(まちがえると、その問題は終わり)
import { surface, pointers, loop, txt, wrapTxt, banner, rr, btn, hit, COL, INK, shuffle, halves, speak } from '../kit.js';
import { pickSentence, sentences } from '../en_data.js';

export default {
  id: 'listen', en: 1, title: '聞き取り早押し', icon: '🎧', desc: '英語を聞いて意味を早押し', rule: '英語の文が読み上げられます。合う日本語を先に選んだ方が1点。まちがえると、その問題はもう答えられません。音が出ないときは、英語が少しずつ表示されます。',
  options: [
    { key: 'lv', label: '文のむずかしさ', choices: [[1, 'やさしい'], [2, 'ふつう'], [3, 'むずかしい']], def: 1 },
    { key: 'to', label: '何本先取', choices: [[3, '3本'], [5, '5本'], [7, '7本']], def: 5 },
    { key: 'sp', label: '読む速さ', choices: [[0.75, 'ゆっくり'], [0.95, 'ふつう'], [1.15, 'はやい']], def: 0.95 },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, TO = O.trial ? 2 : O.to || 5, RATE = O.sp || 0.95;
    const score = [0, 0], used = [];
    let Q = null, phase = 'wait', phT = 0, lock = [false, false], last = null, over = false, cpuAt = 0, cpuOk = false, hasVoice = !!window.speechSynthesis, showText = 0;
    function newRound() {
      if (over) return;
      const sen = pickSentence(O.lv || 1, 0, used); used.push(sen); if (used.length > 20) used.shift();
      const wrong = shuffle(sentences().filter(s => s !== sen)).slice(0, 3).map(s => s.ja);
      Q = { sen, choices: shuffle([sen.ja, ...wrong]), dur: sen.en.split(' ').length * 0.42 / RATE + 0.6 };
      lock = [false, false]; phase = 'play'; phT = 0; showText = 0;
      hasVoice = speak(sen.en, RATE) && hasVoice; sfx.play('whoosh');
      cpuOk = Math.random() < [0, 0.68, 0.82, 0.94][lv] - (O.lv - 1) * 0.08;
      cpuAt = Q.dur * ([0, 1.0, 0.8, 0.6][lv] + Math.random() * 0.4) + 0.6;
    }
    function answer(s, ja) {
      if (phase !== 'play' || lock[s]) return;
      if (ja === Q.sen.ja) { score[s]++; sfx.play('point'); last = { s, ok: true }; end(); }
      else { lock[s] = true; sfx.play('ng'); if (lock[0] && lock[1]) { last = { s: -1 }; end(); } }
    }
    function end() { phase = 'show'; phT = 0; if (score[0] >= TO || score[1] >= TO) { over = true; setTimeout(() => host.end({ winner: score[0] > score[1] ? 0 : 1, score }), 2800); } }
    const opts = (W, h) => Q.choices.map((ja, i) => ({ x: 12, y: h - 236 + i * 56, w: W - 24, h: 50, label: ja, ja }));
    const replay = W => ({ x: W - 110, y: 34, w: 98, h: 34, label: '🔁 もう一回' });
    const pt = pointers(S.cv, {
      onDown: p => {
        const s = two ? p.side : 0; if (s === 1 && !two) return; if (phase !== 'play') return; const l = H2.local(p, s);
        if (hit(replay(S.W), l) && phT > Q.dur) { speak(Q.sen.en, RATE); phT = Math.max(0, phT - 1); sfx.play('tap'); return; }
        for (const b of opts(S.W, S.H / 2)) if (hit(b, l)) { answer(s, b.ja); return; }
      },
    });
    setTimeout(newRound, 600);
    const stop = loop(dt => {
      phT += dt;
      if (phase === 'play') {
        showText += dt;
        if (!two && cpu && !lock[1] && phT >= cpuAt) answer(1, cpuOk ? Q.sen.ja : Q.choices.find(c => c !== Q.sen.ja));
        if (phT > Q.dur + 14) { last = { s: -1 }; end(); }
      } else if (phase === 'show' && phT > 3 && !over) newRound();
      draw();
    });
    function draw() {
      S.begin(); const W = S.W, H = S.H, h = H / 2;
      g.fillStyle = '#fff8ef'; g.fillRect(0, h, W, h); g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, h);
      g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h); g.lineTo(W, h); g.stroke();
      // まん中:音のマーク
      const speaking = Q && phase === 'play' && phT < Q.dur;
      g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, h, 30, 0, 7); g.fill(); g.strokeStyle = '#e6dcf2'; g.lineWidth = 3; g.stroke();
      txt(g, '🎧', W / 2, h, { size: 28 });
      if (speaking) for (let k = 1; k <= 3; k++) { g.strokeStyle = `rgba(90,168,240,${0.6 - k * 0.15})`; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, h, 30 + k * 10 + Math.sin(phT * 8 + k) * 3, 0, 7); g.stroke(); }
      if (!Q) return;
      [0, 1].forEach(s => H2.half(s, up => {
        const T = (...a) => H2.T(up, ...a), canSee = !up || two;
        T(`${host.players[s].name}  ${score[s]} / ${TO}`, 12, 50, { size: 14, align: 'left', color: s ? COL.p2d : COL.p1d });
        if (phase === 'show') {
          T(last && last.s === s ? '⭕ 正解!' : last && last.s >= 0 ? '' : '答え', W / 2, 92, { size: 15, color: '#3fbf6a' });
          wrapTxt(g, Q.sen.en, W / 2, 132, W - 40, { size: 18, font: 'Georgia,serif', flip: up });
          wrapTxt(g, Q.sen.ja, W / 2, 176, W - 40, { size: 13, color: '#6b5a80', flip: up, weight: 700 });
          return;
        }
        if (!hasVoice) { const n = Math.floor(showText * 9); wrapTxt(g, Q.sen.en.slice(0, n), W / 2, 100, W - 40, { size: 16, font: 'Georgia,serif', flip: up }); }
        if (canSee) {
          if (hasVoice) btn(g, replay(W), { size: 12, flip: up, alpha: phT > Q.dur ? 1 : 0.4 });
          opts(W, h).forEach(b => btn(g, b, { size: 14, flip: up, border: '#e6dcf2', alpha: lock[s] ? 0.4 : 1 }));
          if (lock[s]) T('× まちがい… 相手を待ってね', W / 2, h - 260, { size: 14, color: '#ff5a5a' });
        } else T(lock[s] ? '× まちがえた' : '聞いている…', W / 2, h - 120, { size: 16, color: '#8d7f9e' });
      }));
      if (phase === 'show' && last && last.s >= 0) banner(g, S, two, `${host.players[last.s].name} +1`, { size: 20, color: last.s ? COL.p2 : COL.p1, y: S.H / 2 + 60 });
    }
    return { stop() { stop(); pt.off(); S.cv.remove(); try { speechSynthesis.cancel(); } catch (e) { } } };
  },
};
