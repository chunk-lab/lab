// 聞き取り早押し:英語の文がチャンクごとに読み上げられる。チャンクの訳を選ぶと、すぐ次のチャンクが流れる。
//   全部選んで文の訳を先に完成させた方が1点(まちがえると少し止まって、同じチャンクをもう一度)
import { surface, pointers, loop, txt, wrapTxt, banner, rr, btn, hit, COL, INK, shuffle, halves, speak } from '../kit.js';
import { pickSentence, sentences } from '../en_data.js';

export default {
  id: 'listen', en: 1, title: '聞き取り早押し', icon: '🎧', desc: 'チャンクを聞いて訳をつなぐ', rule: '英語がチャンクごとに読み上げられます。そのチャンクの意味を選ぶと、すぐ次のチャンクが流れます。文の訳を先に完成させた方が1点。まちがえると1秒止まって、同じチャンクをもう一度。',
  options: [
    { key: 'lv', label: '文のむずかしさ', choices: [[1, 'やさしい'], [2, 'ふつう'], [3, 'むずかしい']], def: 1 },
    { key: 'to', label: '何本先取', choices: [[3, '3本'], [5, '5本'], [7, '7本']], def: 3 },
    { key: 'sp', label: '読む速さ', choices: [[0.75, 'ゆっくり'], [0.95, 'ふつう'], [1.15, 'はやい']], def: 0.95 },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, TO = O.trial ? 2 : O.to || 3, RATE = O.sp || 0.95;
    const score = [0, 0], used = [];
    let sen = null, phase = 'wait', phT = 0, last = -1, over = false, voice = !!window.speechSynthesis;
    const P = [0, 1].map(() => ({ k: 0, opts: [], lock: 0, heardT: 0, cpuT: 0, flash: 0 }));
    function others(c) {   // まちがいの訳:同じ役わりのチャンクから
      const pool = []; for (const s of shuffle(sentences())) { for (const x of s.chunks) if (x.ja !== c.ja && !pool.includes(x.ja) && (x.role === c.role || pool.length > 6)) pool.push(x.ja); if (pool.length >= 12) break; }
      return shuffle(pool).slice(0, 3);
    }
    function ask(s) {
      const me = P[s], c = sen.chunks[me.k]; if (!c) return;
      me.opts = shuffle([c.ja, ...others(c)]); me.heardT = 0;
      if (s === 0 || two) voice = speak(c.en, RATE) && voice;
      if (s === 1 && !two) me.cpuT = 0.6 + c.en.split(' ').length * 0.4 / RATE + [0, 3.4, 2.6, 2.0][lv] * (0.75 + Math.random() * 0.5);   // 音が出るまで+聞く時間+選択肢を読んで押す時間(人と同じだけかかる)
    }
    function newRound() {
      if (over) return;
      sen = pickSentence(O.lv || 1, 0, used); used.push(sen); if (used.length > 20) used.shift();
      P.forEach((me, s) => { me.k = 0; me.lock = 0; ask(s); }); phase = 'play'; phT = 0; last = -1; sfx.play('whoosh');
    }
    function answer(s, ja) {
      const me = P[s]; if (phase !== 'play' || me.lock > 0) return; const c = sen.chunks[me.k];
      if (ja === c.ja) {
        me.k++; me.flash = 0.4; sfx.play('ok');
        if (me.k >= sen.chunks.length) { score[s]++; last = s; phase = 'show'; phT = 0; sfx.play('point'); if (score[s] >= TO) { over = true; setTimeout(() => host.end({ winner: s, score }), 3000); } setTimeout(() => speak(sen.en, RATE), 300); return; }
        ask(s);
      } else { me.lock = 1; sfx.play('ng'); setTimeout(() => { if (phase === 'play' && sen.chunks[me.k] === c) { if (s === 0 || two) speak(c.en, RATE); } }, 1000); }
    }
    const opts = (W, h) => P[0].opts.map((ja, i) => ({ x: 12, y: h - 214 + i * 52, w: W - 24, h: 46, i }));
    const replay = W => ({ x: W - 108, y: 30, w: 96, h: 32, label: '🔁 もう一回' });
    const pt = pointers(S.cv, {
      onDown: p => {
        const s = two ? p.side : 0; if (s === 1 && !two) return; if (phase !== 'play') return; const l = H2.local(p, s), me = P[s];
        if (hit(replay(S.W), l)) { const c = sen.chunks[me.k]; if (c) speak(c.en, RATE); sfx.play('tap'); return; }
        for (const b of opts(S.W, S.H / 2)) if (hit(b, l)) return answer(s, me.opts[b.i]);
      },
    });
    setTimeout(newRound, 700);
    const stop = loop(dt => {
      phT += dt;
      P.forEach(me => { me.lock = Math.max(0, me.lock - dt); me.flash = Math.max(0, me.flash - dt); me.heardT += dt; });
      if (phase === 'play') {
        if (!two && cpu) { const me = P[1]; if (me.lock <= 0 && phT > 0.8) { me.cpuT -= dt; if (me.cpuT <= 0) { const c = sen.chunks[me.k], k0 = me.k; answer(1, Math.random() < [0, 0.78, 0.87, 0.95][lv] ? c.ja : me.opts.find(x => x !== c.ja)); if (me.k === k0) me.cpuT = 2.0; } } }
        if (phT > 60) { phase = 'show'; phT = 0; last = -1; }
      } else if (phase === 'show' && phT > 3.4 && !over) newRound();
      draw();
    });
    function draw() {
      S.begin(); const W = S.W, H = S.H, h = H / 2;
      g.fillStyle = '#fff8ef'; g.fillRect(0, h, W, h); g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, h);
      g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h); g.lineTo(W, h); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, h, 24, 0, 7); g.fill(); g.strokeStyle = '#e6dcf2'; g.lineWidth = 3; g.stroke(); txt(g, '🎧', W / 2, h, { size: 22 });
      if (!sen) return;
      [0, 1].forEach(s => H2.half(s, up => {
        const me = P[s], T = (...a) => H2.T(up, ...a), canSee = !up || two;
        T(`${host.players[s].name}  ${score[s]} / ${TO}`, 12, 46, { size: 14, align: 'left', color: s ? COL.p2d : COL.p1d });
        // できた訳(チャンクごと)
        const n = sen.chunks.length;
        for (let i = 0; i < n; i++) { g.fillStyle = i < me.k ? '#3fbf6a' : i === me.k ? '#ffd36b' : '#e6e0ee'; rr(g, W / 2 - n * 14 + i * 28 + 4, 72, 20, 8, 4); g.fill(); }
        if (phase === 'show') {
          T(last === s ? '⭕ 先に完成!' : last >= 0 ? '…先をこされた' : '時間切れ', W / 2, 104, { size: 15, color: last === s ? '#3fbf6a' : '#8d7f9e' });
          wrapTxt(g, sen.en, W / 2, 140, W - 40, { size: 18, font: 'Georgia,serif', flip: up });
          wrapTxt(g, sen.ja, W / 2, 182, W - 40, { size: 13, color: '#6b5a80', flip: up, weight: 700 });
          return;
        }
        const built = sen.chunks.slice(0, me.k).map(c => c.ja).join(' / ');
        if (canSee) wrapTxt(g, built || '(ここに訳がつながっていく)', W / 2, 104, W - 40, { size: 13, color: built ? '#3fbf6a' : '#b8aec4', flip: up, weight: 800 });
        if (!voice && canSee && sen.chunks[me.k]) T(sen.chunks[me.k].en, W / 2, 130, { size: 18, font: 'Georgia,serif' });
        if (!canSee) { T(`${me.k} / ${n} チャンク`, W / 2, h - 110, { size: 18, color: '#8d7f9e' }); return; }
        btn(g, replay(W), { size: 12, flip: up });
        if (me.flash > 0) { g.fillStyle = `rgba(63,191,106,${me.flash * 0.4})`; g.fillRect(0, h - 220, W, 220); }
        opts(W, h).forEach(b => btn(g, { ...b, label: me.opts[b.i] }, { size: 14, flip: up, border: '#e6dcf2', alpha: me.lock > 0 ? 0.35 : 1 }));
        if (me.lock > 0) T('× ちがう… もう一回聞いてね', W / 2, h - 226, { size: 13, color: '#ff5a5a' });
      }));
      if (phase === 'show' && last >= 0) banner(g, S, two, `${host.players[last].name} +1`, { size: 20, color: last ? COL.p2 : COL.p1 });
    }
    return { stop() { stop(); pt.off(); S.cv.remove(); try { speechSynthesis.cancel(); } catch (e) { } } };
  },
};
