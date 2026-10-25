// 単語ダッシュ対戦:単語ストリームの「単語ダッシュ」と同じ操作。
//   上下2本のレーンに英単語が流れてくる(手前の単語が順に読み上げられる)。上のレーンは上の4択、下のレーンは下の4択で意味を選ぶ。
//   上下どちらからでも答えられる。正解するとランナーが進み、続けて正解(コンボ)するほど加速。先にゴールした方の勝ち
import { surface, pointers, loop, txt, banner, rr, btn, hit, COL, INK, shuffle, halves, speakCb } from '../kit.js';
import { SW } from '../stream_words.js';

const POSJ = { n: '名', v: '動', a: '形', r: '副', ph: '熟', pp: '前', cj: '接', pn: '代', ij: '間' };
const LANE_COL = ['#ff7aa2', '#5aa8f0'];
export default {
  id: 'wordrace', en: 1, title: '単語ダッシュ', icon: '🏃', desc: '流れてくる単語の意味を上下で選ぶ', rule: '上下2本のレーンに英単語が流れてきて、手前の単語が読み上げられる。上のレーンの単語は上の4択、下のレーンの単語は下の4択で意味を選ぶ(上下どちらからでもOK)。正解でランナーが進み、続けて正解するほど加速。左はしまで行くと時間切れ。先にゴールした方の勝ち。',
  options: [
    { key: 'lv', label: '単語のレベル', choices: [[1, 'レベル1(基本)'], [2, 'レベル2(標準)'], [3, 'レベル3(発展・熟語)']], def: 1 },
    { key: 'to', label: 'ゴールまで', choices: [[20, 'みじかい'], [30, 'ふつう'], [50, 'ながい']], def: 30 },
    { key: 'say', label: '読み上げ', choices: [[1, 'あり'], [0, 'なし']], def: 1 },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, N = O.trial ? 10 : O.to || 30, LIST = SW[String(O.lv || 1)] || SW['1'], LIMIT = 9 + (O.lv || 1) - 1, TOP = 64;
    const say = O.say !== 0;
    let over = false, count = 2.4, t = 0;
    const seq = shuffle(LIST.slice());
    const P = [0, 1].map(s => ({ s, dist: 0, combo: 0, maxc: 0, flash: 0, k: s * 7, lanes: [0, 1].map(i => ({ i, q: [], slots: null, lock: 0, prev: new Set(), cpuT: 0 })) }));
    const nextWord = me => { const w = seq[me.k % seq.length]; me.k++; return { en: w[0], pos: w[1], ans: w[2], x: 0, w: 0, age: 0, dead: 0 }; };
    function distract(f, ex, old) {
      const out = [], bad = t => ex.has(t) || old.has(t) || out.includes(t);
      for (const w of shuffle(LIST.filter(w => w[1] === f.pos && w[0] !== f.en)).slice(0, 30)) if (out.length < 2 && !bad(w[2])) out.push(w[2]);
      for (const w of shuffle(LIST.slice(0, 400))) if (out.length < 3 && !bad(w[2]) && w[2] !== f.ans) out.push(w[2]);
      return out;
    }
    function front(me, L) {   // 手前の単語が変わった:4択を作り直して、読み上げにならべる
      const f = L.q[0]; if (!f) { L.slots = null; return; }
      const other = me.lanes[1 - L.i].q[0], ex = new Set([f.ans, other && other.ans]);
      L.slots = shuffle([f.ans, ...distract(f, ex, L.prev)]).map(t => ({ text: t, dis: false })); L.prev = new Set(L.slots.map(x => x.text));
      f.age = 0; if (me.s === 1 && !two) L.cpuT = [0, 2.6, 1.9, 1.35][lv] * (0.7 + Math.random() * 0.6);
      if (say && (me.s === 0 || two)) enq(f);
    }
    // ---- 読み上げ(手前の上下を順に) ----
    const rq = []; let reading = null;
    function enq(f) { if (!rq.includes(f)) rq.push(f); pump(); }
    function pump() { if (reading || over) return; while (rq.length) { const f = rq.shift(); if (f.dead) continue; reading = f; speakCb(f.en, 0.95, () => { reading = null; setTimeout(pump, 120); }); return; } }
    // ---- レーン ----
    const fieldW = () => S.W;
    function stepLane(me, L, dt) {
      const W = fieldW(), v = (W - 24) / LIMIT * (1 + Math.min(0.6, me.combo * 0.04));   // コンボで流れも少し速く
      while (L.q.length < 3) { const last = L.q[L.q.length - 1]; if (last && last.x + last.w > W - 14) break; const it = nextWord(me); g.font = '700 16px Georgia,serif'; it.w = g.measureText(it.en).width + 40; it.x = last ? Math.max(W + 6, last.x + last.w + 18) : W + 6; L.q.push(it); if (L.q.length === 1) front(me, L); }
      L.q.forEach((it, k) => {
        if (k === 0) { it.x = Math.max(6, it.x - (it.x > W - it.w - 8 ? v * 4 : v) * dt); it.age += dt; if (it.x <= 6.5 && it.age > 1) miss(me, L); }
        else { const a = L.q[k - 1]; it.x = Math.max(a.x + a.w + 18, it.x - v * 2 * dt); }
      });
    }
    function miss(me, L) { const f = L.q.shift(); f.dead = 1; me.combo = 0; if (me.s === 0 || two) { sfx.play('ng'); me.missMsg = { t: 1.4, s: `${f.en} = ${f.ans}` }; } front(me, L); }
    function answer(me, li, si) {
      const L = me.lanes[li], f = L.q[0]; if (!f || !L.slots || L.lock > 0 || over || count > 0) return; const sl = L.slots[si]; if (!sl || sl.dis) return;
      if (sl.text === f.ans) {
        L.q.shift(); f.dead = 1; me.combo++; me.maxc = Math.max(me.maxc, me.combo); me.dist += 1 + Math.min(1, me.combo * 0.08); me.flash = 0.25; L.lock = 0.08;
        if (me.s === 0 || two) sfx.play(me.combo >= 10 ? 'item' : 'tap');
        if (reading === f) { try { speechSynthesis.cancel(); } catch (e) { } reading = null; }
        if (me.dist >= N) { over = true; sfx.play('win'); setTimeout(() => host.end({ winner: me.s, text: `ゴール!(最大コンボ ${me.maxc})` }), 1600); return; }
        front(me, L);
      } else { sl.dis = true; me.combo = 0; L.lock = 0.5; if (me.s === 0 || two) sfx.play('ng'); }
    }
    // ---- 画面の割りふり(エリアの中:上=レーン2本、下=上の4択・🔊・下の4択) ----
    const area = () => two ? { y0: 0, h: S.H / 2 } : { y0: TOP, h: S.H - TOP };
    const lay = h => { const head = 26, laneH = Math.min(60, h * 0.11), gh = Math.min(62, (h - head - laneH * 2 - 50) / 4 - 4), g1 = h - 12 - (gh + 4) * 2, g0 = g1 - 22 - (gh + 4) * 2; return { head, laneY: [head + 4, head + 8 + laneH], laneH, gy: [Math.max(head + 16 + laneH * 2, g0), g1], gh }; };   // 4択は手もと(下)に寄せる
    const grid = (W, h, li) => { const L0 = lay(h); return [0, 1, 2, 3].map(i => ({ x: 10 + (i % 2) * ((W - 20) / 2 + 2), y: L0.gy[li] + Math.floor(i / 2) * (L0.gh + 4), w: (W - 24) / 2, h: L0.gh, li, i })); };
    const repB = (W, h) => { const L0 = lay(h); return { x: W - 52, y: L0.gy[1] - 26, w: 44, h: 22, label: '🔊' }; };
    const pt = pointers(S.cv, {
      onDown: p => {
        const s = two ? p.side : 0; if (s === 1 && !two) return; const A = area(), l = two ? H2.local(p, s) : { x: p.x, y: p.y - A.y0 }, me = P[s];
        if (hit(repB(S.W, A.h), l)) { me.lanes.forEach(L => L.q[0] && enq(L.q[0])); return; }
        for (const li of [0, 1]) for (const b of grid(S.W, A.h, li)) if (hit(b, l)) return answer(me, li, b.i);
      },
    });
    const stop = loop(dt => {
      t += dt;
      if (count > -1) { const c0 = Math.ceil(count); count -= dt; if (count > 0 && Math.ceil(count) !== c0) sfx.play('count'); if (count <= 0 && c0 === 1) sfx.play('go'); }
      if (!over && count <= 0) P.forEach(me => {
        me.flash = Math.max(0, me.flash - dt); if (me.missMsg) { me.missMsg.t -= dt; if (me.missMsg.t <= 0) me.missMsg = null; }
        me.lanes.forEach(L => { L.lock = Math.max(0, L.lock - dt); stepLane(me, L, dt); });
        if (me.s === 1 && !two && cpu) me.lanes.forEach((L, li) => { const f = L.q[0]; if (!f || !L.slots || f.x > S.W - f.w) return; L.cpuT -= dt; if (L.cpuT <= 0) { const ok = Math.random() < [0, 0.8, 0.88, 0.95][lv] - ((O.lv || 1) - 1) * 0.05; const i = ok ? L.slots.findIndex(x => x.text === f.ans) : L.slots.findIndex(x => x.text !== f.ans && !x.dis); answer(me, li, Math.max(0, i)); L.cpuT = ok ? 99 : 1; if (ok) L.cpuT = [0, 2.6, 1.9, 1.35][lv] * (0.7 + Math.random() * 0.6); } });
      });
      draw();
    });
    function drawArea(me, W, h, flip) {
      const L0 = lay(h), canSee = !flip || two;
      if (me.flash > 0) { g.fillStyle = `rgba(63,191,106,${me.flash})`; g.fillRect(0, 0, W, h); }
      txt(g, `${host.players[me.s].name}  ${Math.min(N, Math.floor(me.dist))} / ${N}`, 10, 13, { size: 12, align: 'left', color: me.s ? COL.p2d : COL.p1d, flip: false });
      if (me.combo >= 2) txt(g, `${me.combo} コンボ${me.combo >= 10 ? '!!' : ''}`, W - 10, 13, { size: 12, align: 'right', color: me.combo >= 10 ? '#ffb400' : '#8d7f9e' });
      // レーン
      me.lanes.forEach((L, li) => {
        const y = L0.laneY[li], hh = L0.laneH; g.fillStyle = li ? 'rgba(90,168,240,0.12)' : 'rgba(255,122,162,0.12)'; g.fillRect(0, y, W, hh);
        g.fillStyle = 'rgba(255,90,90,0.35)'; g.fillRect(0, y, 4, hh);
        L.q.forEach((it, k) => {
          const x = it.x, front = k === 0, r = front ? Math.max(0, 1 - it.age / LIMIT) : 1;
          g.fillStyle = front ? '#fff' : 'rgba(255,255,255,0.75)'; rr(g, x, y + 5, it.w, hh - 10, 10); g.fill(); g.strokeStyle = front ? LANE_COL[li] : '#e6dcf2'; g.lineWidth = front ? 3 : 1.5; g.stroke();
          if (POSJ[it.pos]) { g.fillStyle = LANE_COL[li]; rr(g, x + 5, y + hh / 2 - 9, 18, 18, 5); g.fill(); txt(g, POSJ[it.pos], x + 14, y + hh / 2, { size: 11, color: '#fff' }); }
          if (canSee) txt(g, it.en, x + 26 + (it.w - 32) / 2, y + hh / 2, { size: 16, font: 'Georgia,serif', weight: 700, maxW: it.w - 32 });
          if (front) { g.fillStyle = r < 0.3 ? '#ff5a5a' : LANE_COL[li]; g.fillRect(x + 6, y + hh - 9, (it.w - 12) * r, 3); }
          if (front && reading === it) txt(g, '🔊', x + it.w - 6, y + 8, { size: 12 });
        });
      });
      if (me.missMsg) txt(g, `時間切れ:${me.missMsg.s}`, W / 2, L0.laneY[1] + L0.laneH + 6, { size: 12, color: '#ff5a5a', maxW: W - 20 });
      if (!canSee) return;
      // 4択(上=上のレーン、下=下のレーン)
      [0, 1].forEach(li => grid(W, h, li).forEach(b => { const L = me.lanes[li], sl = L.slots && L.slots[b.i]; btn(g, { ...b, label: sl ? sl.text : '' }, { size: 13, fill: sl && sl.dis ? '#eee8f4' : '#fff', color: sl && sl.dis ? '#b8aec4' : INK, border: LANE_COL[li], shadow: false, alpha: L.lock > 0.1 ? 0.6 : 1 }); }));
      txt(g, '▲上のレーン', 12, L0.gy[0] - 7, { size: 10, align: 'left', color: LANE_COL[0] }); txt(g, '▼下のレーン', 12, L0.gy[1] - 7, { size: 10, align: 'left', color: LANE_COL[1] });
      btn(g, repB(W, h), { size: 13, shadow: false, border: '#e6dcf2' });
    }
    function draw() {
      S.begin(); const W = S.W, H = S.H;
      g.fillStyle = '#f6fbff'; g.fillRect(0, 0, W, H);
      if (!two) {
        // 上:2人のランナー
        g.fillStyle = '#fff'; rr(g, 8, 8, W - 16, TOP - 14, 12); g.fill();
        g.fillStyle = '#e8dfc8'; g.fillRect(20, 30, W - 70, 10); txt(g, '🏁', W - 34, 34, { size: 18 });
        P.forEach((me, s) => { const x = 20 + (W - 80) * Math.min(1, me.dist / N); txt(g, '🏃', x, s ? 24 : 42, { size: 18 }); txt(g, s ? host.players[1].name : 'あなた', x, s ? 12 : 54, { size: 9, color: s ? COL.p2d : COL.p1d }); });
        g.save(); g.translate(0, TOP); drawArea(P[0], W, H - TOP, false); g.restore();
      } else {
        [0, 1].forEach(s => H2.half(s, () => drawArea(P[s], W, H / 2, false)));
        g.fillStyle = INK; g.fillRect(0, H / 2 - 1, W, 2);
        P.forEach((me, s) => { const x = 14 + (W - 40) * Math.min(1, me.dist / N); g.fillStyle = s ? COL.p2 : COL.p1; g.beginPath(); g.arc(x, H / 2 + (s ? -4 : 4), 5, 0, 7); g.fill(); });
      }
      if (count > 0) banner(g, S, two, count > 0.4 ? String(Math.ceil(count)) : 'GO!', { size: 50 });
    }
    return { stop() { stop(); pt.off(); S.cv.remove(); over = true; try { speechSynthesis.cancel(); } catch (e) { } } };
  },
};
