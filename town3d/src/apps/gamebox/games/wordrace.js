// 単語ダッシュ対戦:単語ストリームの「単語ダッシュ」と同じ並び。
//   左に4択(上のレーン用・下のレーン用の2組)、右にそれぞれと同じ高さで単語が出る(今の単語と、次の単語)。
//   上の単語は上の4択、下の単語は下の4択で意味を選ぶ(上下どちらからでも答えられる)。手前の単語が順に読み上げられる。
//   流れて消えたり、時間切れはなし。正解すると次の単語になり、ランナーが1つ進む。先にゴールした方の勝ち
import { surface, pointers, loop, txt, wrapTxt, banner, rr, btn, hit, clamp, COL, INK, shuffle, halves, speakCb } from '../kit.js';
import { SW } from '../stream_words.js';

const POSJ = { n: '名', v: '動', a: '形', r: '副', ph: '熟', pp: '前', cj: '接', pn: '代', ij: '間' };
const LANE_COL = ['#ff7aa2', '#5aa8f0'], LANE_BG = ['rgba(255,122,162,0.13)', 'rgba(90,168,240,0.15)'];
export default {
  id: 'wordrace', en: 1, title: '単語ダッシュ', icon: '🏃', desc: '出てくる単語の意味を上下で選ぶ', rule: '左に4択(上のレーン用と下のレーン用)、右にそれぞれと同じ高さで単語が出ます。上の単語は上の4択、下の単語は下の4択で意味を選びます(上下どちらからでもOK)。手前の単語が読み上げられます。正解すると次の単語になってランナーが進み、先にゴールした方の勝ち。まちがえると、その答えは押せなくなり、少しの間おせません。',
  options: [
    { key: 'lv', label: '単語のレベル', choices: [[1, 'レベル1(基本)'], [2, 'レベル2(標準)'], [3, 'レベル3(発展・熟語)']], def: 1 },
    { key: 'to', label: 'ゴールまで', choices: [[20, 'みじかい'], [30, 'ふつう'], [50, 'ながい']], def: 30 },
    { key: 'say', label: '読み上げ', choices: [[1, 'あり'], [0, 'なし']], def: 1 },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, N = O.trial ? 10 : O.to || 30, LIST = SW[String(O.lv || 1)] || SW['1'], TOP = 64;
    const say = O.say !== 0, CPU_T = [0, 3.9, 3.0, 2.3], CPU_OK = [0, 0.62, 0.72, 0.84];
    let over = false, count = 2.4, t = 0, started = false;
    const seq = shuffle(LIST.slice());
    const P = [0, 1].map(s => ({ s, dist: 0, flash: 0, k: s * 7, lanes: [0, 1].map(i => ({ i, now: null, next: null, slots: null, lock: 0, prev: new Set(), cpuT: 0, anim: 0 })) }));
    const nextWord = me => { const w = seq[me.k % seq.length]; me.k++; return { en: w[0], pos: w[1], ans: w[2], dead: 0 }; };
    P.forEach(me => me.lanes.forEach(L => { L.now = nextWord(me); L.next = nextWord(me); }));
    function distract(f, ex, old) {
      const out = [], bad = x => ex.has(x) || old.has(x) || out.includes(x);
      for (const w of shuffle(LIST.filter(w => w[1] === f.pos && w[0] !== f.en)).slice(0, 30)) if (out.length < 2 && !bad(w[2])) out.push(w[2]);
      for (const w of shuffle(LIST.slice(0, 400))) if (out.length < 3 && !bad(w[2]) && w[2] !== f.ans) out.push(w[2]);
      return out;
    }
    function front(me, L) {   // 手前の単語が変わった:4択を作り直して、読み上げにならべる
      const f = L.now, other = me.lanes[1 - L.i].now, ex = new Set([f.ans, other && other.ans]);
      L.slots = shuffle([f.ans, ...distract(f, ex, L.prev)]).map(x => ({ text: x, dis: false })); L.prev = new Set(L.slots.map(x => x.text));
      if (me.s === 1 && !two) L.cpuT = CPU_T[lv] * (0.7 + Math.random() * 0.6);
      if (say && (me.s === 0 || two)) enq(f);
    }
    // ---- 読み上げ(手前の上下を順に) ----
    const rq = []; let reading = null;
    function enq(f) { if (!rq.includes(f)) rq.push(f); pump(); }
    function pump() { if (reading || over) return; while (rq.length) { const f = rq.shift(); if (f.dead) continue; reading = f; speakCb(f.en, 0.95, () => { reading = null; setTimeout(pump, 120); }); return; } }
    function answer(me, li, si) {
      const L = me.lanes[li], f = L.now; if (!f || !L.slots || L.lock > 0 || over || count > 0) return; const sl = L.slots[si]; if (!sl || sl.dis) return;
      if (sl.text === f.ans) {
        f.dead = 1; me.dist += 1; me.flash = 0.25; if (me.s === 0 || two) sfx.play('tap');
        if (reading === f) { try { speechSynthesis.cancel(); } catch (e) { } reading = null; }
        if (me.dist >= N) { over = true; sfx.play('win'); setTimeout(() => host.end({ winner: me.s, text: 'ゴール!' }), 1600); return; }
        L.now = L.next; L.next = nextWord(me); L.anim = 1; front(me, L);
      } else { sl.dis = true; L.lock = 0.5; if (me.s === 0 || two) sfx.play('ng'); }
    }
    // ---- 画面の割りふり(エリアの中) ----
    const area = () => two ? { y0: 0, h: S.H / 2 } : { y0: TOP, h: S.H - TOP };
    function lay(W, h) {
      const head = 28, gw = Math.min(W * 0.46, 210), gh = Math.min((h - head - 22) / 2, 230), blockH = gh * 2 + 10, top = head + Math.max(4, (h - head - blockH) / 2);
      const bx = 8 + gw + 8, bw = W - bx - 8;
      return { head, gw, gh, gy: [top, top + gh + 10], bx, bw, cw: (gw - 4) / 2, ch: (gh - 4) / 2 };
    }
    const cells = (W, h, li) => { const L0 = lay(W, h); return [0, 1, 2, 3].map(i => ({ x: 8 + (i % 2) * (L0.cw + 4), y: L0.gy[li] + Math.floor(i / 2) * (L0.ch + 4), w: L0.cw, h: L0.ch, li, i })); };
    const repB = W => ({ x: W - 48, y: 3, w: 40, h: 22, label: '🔊' });
    const pt = pointers(S.cv, {
      onDown: p => {
        const s = two ? p.side : 0; const A = area(), l = two ? H2.local(p, s) : { x: p.x, y: p.y - A.y0 }, me = P[s];
        if (hit(repB(S.W), l)) { me.lanes.forEach(L => L.now && enq(L.now)); return; }
        for (const li of [0, 1]) for (const b of cells(S.W, A.h, li)) if (hit(b, l)) return answer(me, li, b.i);
      },
    });
    const stop = loop(dt => {
      t += dt;
      if (count > -1) { const c0 = Math.ceil(count); count -= dt; if (count > 0 && Math.ceil(count) !== c0) sfx.play('count'); if (count <= 0 && c0 === 1) sfx.play('go'); }
      if (!started && count <= 0) { started = true; P.forEach(me => me.lanes.forEach(L => front(me, L))); }
      if (!over && count <= 0) P.forEach(me => {
        me.flash = Math.max(0, me.flash - dt);
        me.lanes.forEach(L => { L.lock = Math.max(0, L.lock - dt); L.anim = Math.max(0, L.anim - dt * 4); });
        if (me.s === 1 && !two && cpu) me.lanes.forEach((L, li) => { if (!L.now || !L.slots) return; L.cpuT -= dt; if (L.cpuT <= 0) { const ok = Math.random() < CPU_OK[lv] - ((O.lv || 1) - 1) * 0.05; const i = ok ? L.slots.findIndex(x => x.text === L.now.ans) : L.slots.findIndex(x => x.text !== L.now.ans && !x.dis); answer(me, li, Math.max(0, i)); L.cpuT = ok ? CPU_T[lv] * (0.7 + Math.random() * 0.6) : 1; } });
      });
      draw();
    });
    function wordCard(li, x, y, w, h, o) {
      const f = o.f; if (!f) return;
      g.save(); g.globalAlpha = o.alpha;
      g.fillStyle = '#fff'; rr(g, x, y, w, h, 12); g.fill(); g.strokeStyle = o.now ? LANE_COL[li] : '#e6dcf2'; g.lineWidth = o.now ? 3 : 1.5; g.stroke();
      const tag = POSJ[f.pos], tw = tag ? 22 : 0;
      if (tag) { g.fillStyle = LANE_COL[li]; rr(g, x + 6, y + h / 2 - 9, 18, 18, 5); g.fill(); txt(g, tag, x + 15, y + h / 2, { size: 11, color: '#fff' }); }
      let size = o.size; g.font = `700 ${size}px Georgia,serif`; while (size > 11 && g.measureText(f.en).width > w - tw - 18) { size -= 1; g.font = `700 ${size}px Georgia,serif`; }
      if (o.show) txt(g, f.en, x + tw + (w - tw) / 2, y + h / 2 + 1, { size, font: 'Georgia,serif', weight: 700 });
      if (o.now && reading === f) txt(g, '🔊', x + w - 8, y + 9, { size: 11 });
      g.restore();
    }
    function drawArea(me, W, h) {
      const L0 = lay(W, h), show = count <= 0;
      txt(g, `${host.players[me.s].name}  ${Math.min(N, Math.floor(me.dist))} / ${N}`, 10, 14, { size: 12, align: 'left', color: me.s ? COL.p2d : COL.p1d });
      btn(g, repB(W), { size: 13, shadow: false, border: '#e6dcf2' });
      if (me.flash > 0) { g.fillStyle = `rgba(63,191,106,${me.flash * 0.6})`; g.fillRect(0, 0, W, h); }
      me.lanes.forEach((L, li) => {
        const y = L0.gy[li], gh = L0.gh;
        // 右:単語の帯(左の4択と同じ高さ)
        g.fillStyle = LANE_BG[li]; rr(g, L0.bx, y, L0.bw, gh, 14); g.fill(); g.strokeStyle = LANE_COL[li]; g.lineWidth = 2.5; rr(g, L0.bx, y, L0.bw, gh, 14); g.stroke();
        txt(g, '◀', L0.bx + 9, y + gh / 2, { size: 11, color: LANE_COL[li] });
        const wide = L0.bw > 300, ph = clamp(gh * 0.4, 44, 76);
        if (wide) {
          const cw = (L0.bw - 34) * 0.6, nw = (L0.bw - 34) * 0.4, cy = y + (gh - ph) / 2;
          wordCard(li, L0.bx + 18, cy, cw, ph, { f: L.now, now: true, alpha: 1, size: 22, show });
          wordCard(li, L0.bx + 18 + cw + 8 + L.anim * 14, cy + ph * 0.15, nw, ph * 0.7, { f: L.next, now: false, alpha: 0.6 * (1 - L.anim * 0.5), size: 15, show });
        } else {
          const cy = y + gh * 0.12 + L.anim * 8;
          wordCard(li, L0.bx + 18, cy, L0.bw - 26, ph, { f: L.now, now: true, alpha: 1 - L.anim * 0.3, size: 21, show });
          wordCard(li, L0.bx + 18, cy + ph + 14, L0.bw - 26, 30, { f: L.next, now: false, alpha: 0.6, size: 14, show });
          if (show) txt(g, 'つぎ', L0.bx + 20, cy + ph + 8, { size: 9, align: 'left', color: '#8d7f9e' });
        }
        // 左:4択(2×2)
        cells(W, h, li).forEach(b => {
          const sl = L.slots && L.slots[b.i], dis = sl && sl.dis;
          btn(g, { ...b, label: '' }, { fill: dis ? '#eee8f4' : '#fff', border: LANE_COL[li], shadow: false, alpha: L.lock > 0.1 ? 0.6 : 1 });
          if (sl) { const fs = clamp(b.w / 7.5, 11, 15); wrapTxt(g, sl.text, b.x + b.w / 2, b.y + b.h / 2, b.w - 8, { size: fs, color: dis ? '#b8aec4' : INK, weight: 700, lh: fs * 1.2 }); }
        });
      });
    }
    function draw() {
      S.begin(); const W = S.W, H = S.H;
      g.fillStyle = '#f6fbff'; g.fillRect(0, 0, W, H);
      if (!two) {
        // 上:2人のランナー
        g.fillStyle = '#fff'; rr(g, 8, 8, W - 16, TOP - 14, 12); g.fill();
        g.fillStyle = '#e8dfc8'; g.fillRect(20, 30, W - 70, 10); txt(g, '🏁', W - 34, 34, { size: 18 });
        P.forEach((me, s) => { const x = 20 + (W - 80) * Math.min(1, me.dist / N); txt(g, '🏃', x, s ? 24 : 42, { size: 18 }); txt(g, s ? host.players[1].name : 'あなた', x, s ? 12 : 54, { size: 9, color: s ? COL.p2d : COL.p1d }); });
        g.save(); g.translate(0, TOP); drawArea(P[0], W, H - TOP); g.restore();
      } else {
        [0, 1].forEach(s => H2.half(s, () => drawArea(P[s], W, H / 2)));
        g.fillStyle = INK; g.fillRect(0, H / 2 - 1, W, 2);
        P.forEach((me, s) => { const x = 14 + (W - 40) * Math.min(1, me.dist / N); g.fillStyle = s ? COL.p2 : COL.p1; g.beginPath(); g.arc(x, H / 2 + (s ? -4 : 4), 5, 0, 7); g.fill(); });
      }
      if (count > 0) banner(g, S, two, count > 0.4 ? String(Math.ceil(count)) : 'GO!', { size: 50 });
    }
    return { _dbg: () => ({ P, cells, lay, area }), stop() { stop(); pt.off(); S.cv.remove(); over = true; try { speechSynthesis.cancel(); } catch (e) { } } };
  },
};
