// 単語ダッシュ対戦:単語ストリームの「単語練習」の単語で、意味を4択でどんどん答えて駆けぬける。先に○個正解した方の勝ち
import { surface, pointers, loop, txt, wrapTxt, banner, rr, btn, hit, COL, INK, shuffle, halves, speak } from '../kit.js';
import { SW } from '../stream_words.js';

const POSJ = { n: '名', v: '動', a: '形', r: '副', ph: '熟', pp: '前', cj: '接', pn: '代', ij: '間' };
export default {
  id: 'wordrace', en: 1, title: '単語ダッシュ', icon: '🏃', desc: '単語の意味を4択で駆けぬける', rule: '英単語の意味を4つから選ぼう。正解すると前に進む。先にゴール(○個正解)した方の勝ち。まちがえると1秒止まって、同じ単語をもう一度。',
  options: [
    { key: 'lv', label: '単語のレベル', choices: [[1, 'レベル1(基本)'], [2, 'レベル2(標準)'], [3, 'レベル3(発展・熟語)']], def: 1 },
    { key: 'to', label: '何個でゴール', choices: [[20, '20個'], [30, '30個'], [50, '50個']], def: 30 },
    { key: 'say', label: '読み上げ', choices: [[1, 'あり'], [0, 'なし']], def: 1 },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, N = O.trial ? 10 : O.to || 30, LIST = SW[String(O.lv || 1)] || SW['1'];
    const seq = shuffle(LIST.slice()).slice(0, N + 40);   // 2人とも同じ順番
    let over = false, count = 2.4, t = 0;
    const P = [0, 1].map(() => ({ i: 0, opts: [], lock: 0, wrong: null, cpuT: 0, flash: 0 }));
    function deal(s) {
      const me = P[s], w = seq[me.i % seq.length], same = LIST.filter(x => x[1] === w[1] && x[2] !== w[2]);
      const pool = shuffle(same.length >= 3 ? same : LIST.filter(x => x[2] !== w[2])).slice(0, 3).map(x => x[2]);
      me.opts = shuffle([w[2], ...pool]);
      if (O.say !== 0 && (s === 0 || two)) speak(w[0], 1);
      if (s === 1 && !two) me.cpuT = [0, 2.6, 1.9, 1.3][lv] * (0.65 + Math.random() * 0.7);
    }
    function answer(s, ja) {
      const me = P[s], w = seq[me.i % seq.length]; if (over || count > 0 || me.lock > 0) return;
      if (ja === w[2]) { me.i++; me.flash = 0.3; if (s === 0 || two) sfx.play(me.i % 10 === 0 ? 'item' : 'tap'); /* 相手の正解の音は鳴らさない(読み上げのじゃまになる) */ if (me.i >= N) { over = true; sfx.play('win'); setTimeout(() => host.end({ winner: s, text: `${N}個 ゴール!` }), 1600); return; } deal(s); }
      else { me.lock = 1; me.wrong = w[2]; if (s === 0 || two) sfx.play('ng'); setTimeout(() => { if (!over && seq[me.i % seq.length] === w) { me.opts = shuffle(me.opts); if (O.say !== 0 && (s === 0 || two)) speak(w[0], 1); } }, 1000); }
    }
    const opts = (W, h) => [0, 1, 2, 3].map(i => ({ x: 12 + (i % 2) * ((W - 24) / 2 + 6), y: h - 150 + Math.floor(i / 2) * 66, w: (W - 36) / 2, h: 58, i }));
    const pt = pointers(S.cv, {
      onDown: p => {
        const s = two ? p.side : 0; if (s === 1 && !two) return; const l = H2.local(p, s), me = P[s];
        for (const b of opts(S.W, S.H / 2)) if (hit(b, l)) return answer(s, me.opts[b.i]);
      },
    });
    const stop = loop(dt => {
      t += dt;
      if (count > -1) { const c0 = Math.ceil(count); count -= dt; if (count > 0 && Math.ceil(count) !== c0) sfx.play('count'); if (count <= 0 && c0 === 1) { sfx.play('go'); setTimeout(() => { deal(0); deal(1); }, 450); } /* GOの音と重ならないように */ }
      P.forEach(me => { me.lock = Math.max(0, me.lock - dt); me.flash = Math.max(0, me.flash - dt); });
      if (!over && count <= 0 && !two && cpu) { const me = P[1]; if (me.lock <= 0) { me.cpuT -= dt; if (me.cpuT <= 0) { const w = seq[me.i % seq.length]; answer(1, Math.random() < [0, 0.8, 0.88, 0.95][lv] - ((O.lv || 1) - 1) * 0.05 ? w[2] : me.opts.find(x => x !== w[2])); me.cpuT = 0.8; } } }
      draw();
    });
    function draw() {
      S.begin(); const W = S.W, H = S.H, h = H / 2;
      g.fillStyle = '#f2fff6'; g.fillRect(0, h, W, h); g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, h);
      // まん中:コース
      g.fillStyle = '#e8dfc8'; g.fillRect(0, h - 14, W, 28); g.strokeStyle = '#fff'; g.setLineDash([10, 8]); g.lineWidth = 2; g.beginPath(); g.moveTo(0, h); g.lineTo(W, h); g.stroke(); g.setLineDash([]);
      txt(g, '🏁', W - 16, h, { size: 20 });
      P.forEach((me, s) => { const x = 18 + (W - 52) * Math.min(1, me.i / N); txt(g, '🏃', x, h + (s ? -6 : 6), { size: 22, flip: two && s === 1 }); g.fillStyle = s ? COL.p2 : COL.p1; g.beginPath(); g.arc(x, h + (s ? -16 : 16), 3, 0, 7); g.fill(); });
      [0, 1].forEach(s => H2.half(s, up => {
        const me = P[s], T = (...a) => H2.T(up, ...a), canSee = !up || two, w = seq[me.i % seq.length];
        T(`${host.players[s].name}  ${me.i} / ${N}`, 12, 30, { size: 14, align: 'left', color: s ? COL.p2d : COL.p1d });
        if (count > 0) return;
        if (me.flash > 0) { g.fillStyle = `rgba(63,191,106,${me.flash * 0.5})`; g.fillRect(0, 14, W, h); }
        if (!canSee) { T('…', W / 2, h * 0.45, { size: 22, color: '#8d7f9e' }); return; }
        T(`(${POSJ[w[1]] || ''})`, W / 2, 64, { size: 13, color: '#8d7f9e' });
        T(w[0], W / 2, 100, { size: w[0].length > 14 ? 24 : 34, font: 'Georgia,serif', maxW: W - 30 });
        if (me.lock > 0) T(`× 正しくは「${me.wrong}」`, W / 2, 138, { size: 13, color: '#ff5a5a', maxW: W - 20 });
        opts(W, h).forEach(b => btn(g, { ...b, label: me.opts[b.i] }, { size: 14, flip: up, border: '#e6dcf2', alpha: me.lock > 0 ? 0.35 : 1 }));
      }));
      if (count > 0) banner(g, S, two, count > 0.4 ? String(Math.ceil(count)) : 'GO!', { size: 50 });
    }
    return { stop() { stop(); pt.off(); S.cv.remove(); try { speechSynthesis.cancel(); } catch (e) { } } };
  },
};
