// 単語しりとり爆弾:前の単語の最後の文字で始まる英単語を入れて、爆弾を相手にわたす。自分の番で爆発したら負け
import { surface, pointers, loop, txt, wrapTxt, banner, rr, clamp, btn, hit, COL, INK, halves, keyboard } from '../kit.js';
import { loadDict } from '../en_data.js';

const STARTS = ['apple', 'music', 'garden', 'river', 'pencil', 'ocean', 'window', 'dream', 'travel', 'school', 'animal', 'flower'];
export default {
  id: 'shiritori', en: 1, title: 'しりとり爆弾', icon: '💣', desc: '英単語しりとりで爆弾をわたす', rule: '前の単語の最後の文字で始まる英単語(3文字以上・まだ出ていない語)を入れると、爆弾が相手にわたる。爆弾がいつ爆発するかは、わからない。自分の番で爆発したら負け。',
  options: [{ key: 'to', label: '何本先取', choices: [[2, '2本'], [3, '3本'], [5, '5本']], def: 3 }, { key: 'fuse', label: '爆弾の長さ', choices: [[0, 'ふつう'], [1, '長め']], def: 0 }],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, TO = O.trial ? 1 : O.to || 3;
    let D = null, VOC = null, score = [0, 0], turn = 0, word = '', used = new Set(), typed = '', err = '', errT = 0, fuse = 0, fuseMax = 1, phase = 'load', phT = 0, over = false, boomSide = -1, cpuT = 0, cpuWord = null, history = [];
    loadDict(host.dictUrl).then(d => { D = d; VOC = new Set(d.list.filter(e => e.rank < 20000).map(e => e.w)); newRound(Math.random() < 0.5 ? 0 : 1); }).catch(() => { phase = 'err'; });
    function newRound(first) {
      if (over) return;
      word = STARTS[Math.floor(Math.random() * STARTS.length)]; used = new Set([word]); history = [word];
      turn = first; typed = ''; err = ''; fuseMax = fuse = (O.fuse ? 40 : 26) + Math.random() * 14; phase = 'play'; phT = 0; planCpu();
    }
    const need = () => word[word.length - 1];
    function planCpu() {
      cpuWord = null; if (two || turn !== 1 || !D) return;
      const maxRank = [0, 2500, 6000, 15000][lv], c = need();
      const cand = D.list.filter(e => e.rank < maxRank && e.w[0] === c && e.w.length >= 3 && e.w.length <= 9 && !used.has(e.w));
      cpuWord = cand.length && Math.random() > [0, 0.12, 0.06, 0.02][lv] ? cand[Math.floor(Math.random() * Math.min(cand.length, 60))].w : null;
      cpuT = [0, 4.5, 3.2, 2.2][lv] * (0.6 + Math.random() * 0.8) + (cpuWord ? cpuWord.length * 0.12 : 0);
      if (!cpuWord) cpuT += 6;
    }
    function submit(s, w) {
      w = w.toLowerCase().trim(); if (phase !== 'play' || s !== turn) return;
      const bad = w.length < 3 ? '3文字以上だよ' : w[0] !== need() ? `「${need()}」で始めてね` : used.has(w) ? 'もう出た単語だよ' : !VOC.has(w) ? '辞書にない単語みたい' : '';
      if (bad) { err = bad; errT = 1.6; sfx.play('ng'); return; }
      used.add(w); history.push(w); if (history.length > 6) history.shift(); word = w; typed = ''; err = ''; turn = 1 - turn; sfx.play('whoosh'); planCpu();
    }
    const kbd = (W, h) => keyboard(W, Math.max(206, h - 190));
    const pt = pointers(S.cv, {
      onDown: p => {
        const s = two ? p.side : 0; if (s === 1 && !two) return; if (phase !== 'play' || s !== turn) return; const l = H2.local(p, s);
        for (const b of kbd(S.W, S.H / 2)) if (hit(b, l)) { sfx.play('tap'); if (b.k === 'del') typed = typed.slice(0, -1); else if (b.k === 'ok') submit(s, (typed.startsWith(need()) ? '' : need()) + typed); else if (typed.length < 14) typed += b.k; return; }
      },
    });
    let tickT = 0;
    const stop = loop(dt => {
      phT += dt; errT = Math.max(0, errT - dt);
      if (phase === 'play') {
        fuse -= dt; tickT -= dt;
        const rate = fuse / fuseMax; if (tickT <= 0) { tickT = 0.12 + rate * 0.6; sfx.play('tick', 1 - rate); }
        if (!two && turn === 1 && cpu) { cpuT -= dt; if (cpuT <= 0) { if (cpuWord) submit(1, cpuWord); else planCpu(); } }
        if (fuse <= 0) { boomSide = turn; score[1 - turn]++; phase = 'boom'; phT = 0; sfx.play('boom'); if (score[1 - turn] >= TO) { over = true; setTimeout(() => host.end({ winner: 1 - turn, score }), 2400); } }
      } else if (phase === 'boom' && phT > 2.6 && !over) newRound(boomSide);
      draw(dt);
    });
    function draw(dt) {
      S.begin(); const W = S.W, H = S.H, h = H / 2;
      g.fillStyle = '#fff8ef'; g.fillRect(0, h, W, h); g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, h);
      if (!D) { banner(g, S, two, phase === 'err' ? '辞書が読めませんでした' : '辞書をよみこみ中…', { size: 20 }); return; }
      // 爆弾(番の人のほうへ)
      const bx = W / 2, by = h + (turn === 0 ? 1 : -1) * 40, shake = phase === 'play' ? Math.sin(phT * 40) * (1 - fuse / fuseMax) * 4 : 0;
      if (phase === 'boom') { const r = phT * 300; g.fillStyle = `rgba(255,160,60,${Math.max(0, 1 - phT / 1.2)})`; g.beginPath(); g.arc(W / 2, boomSide === 0 ? h + h * 0.4 : h - h * 0.4, r, 0, 7); g.fill(); }
      else { txt(g, '💣', bx + shake, by, { size: 42 }); g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(bx + 15 + shake, by - 21, 3 + Math.random() * 4, 0, 7); g.fill(); }
      [0, 1].forEach(s => H2.half(s, up => {
        const T = (...a) => H2.T(up, ...a), mine = turn === s, canSee = !up || two;
        T(`${host.players[s].name}  ${score[s]} / ${TO}`, 12, 20, { size: 14, align: 'left', color: s ? COL.p2d : COL.p1d });
        // いまの単語と、つぎの文字
        g.fillStyle = mine && phase === 'play' ? '#fff3c4' : '#fff'; rr(g, 12, 86, W - 24, 70, 14); g.fill(); g.strokeStyle = '#e6dcf2'; g.lineWidth = 2; g.stroke();
        if (errT > 0 && mine) T(err, W / 2, 72, { size: 13, color: '#ff5a5a' });
        else T(history.slice(0, -1).join(' → '), W / 2, 72, { size: 11, color: '#a08fb8', maxW: W - 120 });
        T(word, W / 2, 112, { size: 28, font: 'Georgia,serif' });
        T(`つぎは「 ${need()} 」で始まる単語`, W / 2, 142, { size: 12, color: '#ff5a5a', weight: 800 });
        if (phase === 'boom') { T(boomSide === s ? '💥 ドカーン!' : '⭕ セーフ!', W / 2, 190, { size: 26, color: boomSide === s ? '#ff5a5a' : '#3fbf6a' }); return; }
        if (!mine) { T('相手の番…(爆弾をわたした!)', W / 2, 200, { size: 15, color: '#8d7f9e' }); return; }
        if (!canSee) { T(`「${need()}」の単語を考え中…`, W / 2, 200, { size: 15, color: '#8d7f9e' }); return; }
        const shown = typed.startsWith(need()) ? typed : need() + typed;
        T(shown + '_', W / 2, 180, { size: 24, font: 'Georgia,serif', color: INK });
        kbd(W, h).forEach(b => btn(g, b, { fill: b.k === 'ok' ? '#ffd36b' : '#fff', size: b.k === 'ok' ? 14 : 18, flip: up, shadow: false, border: '#e6dcf2' }));
      }));
    }
    return { stop() { stop(); pt.off(); S.cv.remove(); } };
  },
};
