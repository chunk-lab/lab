// 文の並べ替え(旧:辞書早押し):日本語として自然な順に浮かんでいるチャンクを、英語の順番の枠へ入れていく。
//   できると、英文が音声つきで流れる。先に全部入れた方が1点。ヒント=文型の名前 → 色 → 役割の名前(ボタンで少しずつ / 最初から / なし)
//   枠と文型は「チャンクチャンクの呼び方」と「文法用語」の両方で表示。文のデータは series/data/chunk_sentences.js(ほかのゲームでも使える)
import { surface, pointers, loop, txt, wrapTxt, banner, rr, clamp, btn, hit, COL, INK, shuffle, halves, speakCb } from '../kit.js';
import { chunkSentences, ROLES, ORDER, buildEn } from '../../../../../series/data/chunk_sentences.js';

export default {
  id: 'chunksort', en: 1, title: '文の並べ替え', icon: '🧩', desc: '日本語のチャンクを、英語の順番の枠へ!', rule: '日本語の順に浮かんでいるチャンクを、英語の順番の枠に入れていきます(タップで選んで枠をタップ / ドラッグでもOK)。全部正しく入れると、英文が音声つきで流れます。先に入れ終わった方が1点。ヒントは 💡 で、文型の名前 → 色 → 役割の名前の順に少しずつ見られます。',
  options: [
    { key: 'lv', label: '文の長さ', choices: [[1, 'かんたん(3つ)'], [2, 'ふつう(4つ)'], [3, 'むずかしい(5つ以上)']], def: 1 },
    { key: 'to', label: '何本先取', choices: [[3, '3本'], [5, '5本'], [7, '7本']], def: 5 },
    { key: 'board', label: '枠', choices: [['few', '必要な枠だけ'], ['all', '8つの枠から自分で選ぶ']], def: 'few' },
    { key: 'hint', label: 'ヒント(文型の名前・色・役割)', choices: [['btn', 'ボタンで少しずつ'], ['full', '最初から全部'], ['off', 'なし']], def: 'btn' },
    { key: 'say', label: '読み上げ', choices: [[1, 'あり'], [0, 'なし']], def: 1 },
  ],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2, H2 = halves(S, two);
    const O = host.opts, TO = O.trial ? 2 : O.to || 5, LVL = O.lv || 1, ALL = O.board === 'all', HINT = O.hint || 'btn', SAY = O.say !== 0, TOP = 64;
    const SLOTS_ALL = ORDER.slice();
    const pool = chunkSentences().filter(s => LVL === 1 ? s.n <= 3 : LVL === 2 ? s.n === 4 : s.n >= 5);
    let queue = [];
    const nextSent = () => { if (!queue.length) queue = shuffle(pool.length ? pool : chunkSentences()); return queue.pop(); };
    let sent = null, phase = 'count', phT = 0, count = 2.2, t = 0, score = [0, 0], over = false, win = -1, readDone = false, ended = false, cpuT = 99, reveal = null, revDur = 2;
    const P = [0, 1].map(s => ({ s, placed: {}, sel: -1, drag: null, lock: 0, hint: 0, flash: {}, rects: [], srects: [], hintBtn: null }));
    const slotsOf = () => ALL ? SLOTS_ALL : sent.roles;
    const isPlaced = (me, i) => Object.values(me.placed).includes(i);

    function newRound(first) {
      sent = nextSent(); phase = 'count'; phT = 0; count = first ? 2.2 : 0.7; win = -1; readDone = false; reveal = null;
      P.forEach(me => { me.placed = {}; me.sel = -1; me.drag = null; me.lock = 0; me.flash = {}; me.hint = HINT === 'full' ? 3 : 0; });
      cpuT = !two && cpu ? 2 + sent.n * [0, 3.6, 2.8, 2.1][lv] * (0.8 + Math.random() * 0.4) : 99;
    }
    newRound(true);

    function tryPlace(me, ci, slot) {
      if (phase !== 'play' || me.lock > 0 || isPlaced(me, ci)) return;
      const c = sent.chunks[ci];
      const ok = me.placed[slot] == null && (c.role === slot || (ALL && c.role === 'T' && slot === 'F' && !sent.roles.includes('F')));
      me.sel = -1;
      if (ok) { me.placed[slot] = ci; me.flash[slot] = { t: 0.5, ok: true }; sfx.play('tap'); if (Object.keys(me.placed).length === sent.n) finish(me.s, me.placed); }
      else { me.lock = 0.9; me.flash[slot] = { t: 0.7, ok: false }; sfx.play('ng'); }
    }
    function finish(s, placed) {
      phase = 'reveal'; phT = 0; win = s; score[s]++; sfx.play('point'); readDone = false;
      const map = placed && Object.keys(placed).length === sent.n ? { ...placed } : {};
      if (!Object.keys(map).length) sent.chunks.forEach((c, i) => { map[c.role] = i; });   // CPU が先に: 正しい並びを見せる
      const by = {}; for (const [r, i] of Object.entries(map)) by[r] = sent.chunks[i];
      const en = buildEn(by); reveal = { map, en, front: map.F != null && sent.chunks[map.F].role === 'T' };
      revDur = Math.max(1.4, en.split(' ').length * 0.42 + 0.5);
      if (score[s] >= TO) over = true;
      if (SAY) speakCb(en, 0.9, () => { readDone = true; }); else setTimeout(() => { readDone = true; }, 1200);
      setTimeout(() => { readDone = true; }, 6500);   // 声が出ない端末でも、先へ進む
    }
    function skipReveal() {
      if (phase !== 'reveal' || phT < 1 || ended) return;
      try { speechSynthesis.cancel(); } catch (e) { }
      if (over) { ended = true; host.end({ winner: score[0] > score[1] ? 0 : 1, score }); } else newRound(false);
    }

    // ---- 入力 ----
    const loc = (p, s) => two ? H2.local(p, s) : { x: p.x, y: p.y - TOP };
    const pt = pointers(S.cv, {
      onDown: p => {
        const s = two ? p.side : 0, me = P[s], l = loc(p, s);
        if (phase === 'reveal') { skipReveal(); return; }
        if (phase !== 'play' || me.lock > 0) return;
        if (me.hintBtn && hit(me.hintBtn, l)) { me.hint = Math.min(3, me.hint + 1); sfx.play('tap'); return; }
        const c = me.rects.find(r => hit(r, l));
        if (c) { me.drag = { id: p.id, i: c.i, x: l.x, y: l.y, sx: l.x, sy: l.y, moved: false, was: me.sel === c.i }; me.sel = c.i; return; }
        const sl = me.srects.find(r => hit(r, l));
        if (sl && me.sel >= 0) tryPlace(me, me.sel, sl.r);
      },
      onMove: p => {
        const s = two ? p.side : 0, me = P[s]; if (!me.drag || me.drag.id !== p.id) return;
        const l = loc(p, s); me.drag.x = l.x; me.drag.y = l.y; if (Math.hypot(l.x - me.drag.sx, l.y - me.drag.sy) > 9) me.drag.moved = true;
      },
      onUp: p => {
        const s = two ? p.side : 0, me = P[s], d = me.drag; if (!d || d.id !== p.id) return; me.drag = null;
        if (d.moved) {
          const px = d.x, py = d.y - 26;   // 指より少し上に浮かせて持つ
          const sl = me.srects.find(r => hit(r, { x: px, y: py })) || me.srects.find(r => hit(r, { x: d.x, y: d.y }));
          if (sl) tryPlace(me, d.i, sl.r); else me.sel = -1;
        } else if (d.was) me.sel = -1;   // 選んでいたチャンクをもういちどタップ → 解除
      },
    });

    const stop = loop(dt => {
      t += dt; phT += dt;
      P.forEach(me => { me.lock = Math.max(0, me.lock - dt); for (const k in me.flash) { me.flash[k].t -= dt; if (me.flash[k].t <= 0) delete me.flash[k]; } });
      if (phase === 'count') { const c0 = Math.ceil(count); count -= dt; if (count > 0 && Math.ceil(count) !== c0 && count > 0.8) sfx.play('count'); if (count <= 0) { phase = 'play'; phT = 0; sfx.play('go'); } }
      else if (phase === 'play') { if (!two && cpu && phT >= cpuT && win < 0) finish(1, null); }
      else if (phase === 'reveal' && readDone && phT > Math.max(2.2, revDur + 0.6) && !ended) skipReveal();
      draw();
    });

    // ---- 描く ----
    let K = 1;   // 画面の大きさに合わせた拡大率
    const words = (str, w, size) => { g.font = `800 ${size}px sans-serif`; const out = []; let cur = ''; for (const wd of str.split(' ')) { const t2 = cur ? cur + ' ' + wd : wd; if (cur && g.measureText(t2).width > w) { out.push(cur); cur = wd; } else cur = t2; } if (cur) out.push(cur); return out; };   // 英語は単語で折り返す
    function chunkLayout(W) {
      g.font = `800 ${Math.round(15 * K)}px sans-serif`;
      const items = sent.chunks.map((c, i) => ({ i, c, w: Math.ceil(g.measureText(c.ja).width) + 26 * K, h: Math.round(38 * K) }));
      const rows = []; let cur = [], cw = 0;
      for (const it of items) { if (cur.length && cw + it.w + 8 > W - 20) { rows.push(cur); cur = []; cw = 0; } cur.push(it); cw += it.w + (cur.length > 1 ? 8 : 0); }
      if (cur.length) rows.push(cur);
      return rows;
    }
    function pill(x, y, w, h, c, o) {
      const col = ROLES[c.role].col;
      g.save(); g.translate(x + w / 2, y + h / 2); if (o.sc) g.scale(o.sc, o.sc);
      g.fillStyle = 'rgba(0,0,0,0.12)'; rr(g, -w / 2 + 1, -h / 2 + 3, w, h, 14); g.fill();
      g.fillStyle = o.color ? col : '#fff'; rr(g, -w / 2, -h / 2, w, h, 14); g.fill();
      g.strokeStyle = o.sel ? INK : o.color ? 'rgba(0,0,0,0.12)' : '#d9cdea'; g.lineWidth = o.sel ? 3 : 2; g.stroke();
      if (o.label) { txt(g, ROLES[c.role].name, 0, -h / 2 + 8 * K, { size: 9 * K, color: '#5a4a6b', weight: 800 }); txt(g, c.ja, 0, 5 * K, { size: 15 * K, maxW: w - 14 }); }
      else txt(g, c.ja, 0, 1, { size: 15 * K, maxW: w - 14 });
      g.restore();
    }
    function drawArea(me, W, h) {
      const s = me.s, slots = slotsOf(), ty = sent.type, dim = me.lock > 0; K = clamp((h - 90) / 430, 0.85, 1.3);
      if (two) txt(g, `${host.players[s].name}  ${score[s]} / ${TO}`, 10, 13, { size: 12, align: 'left', color: s ? COL.p2d : COL.p1d });
      me.hintBtn = null;
      if (HINT === 'btn' && phase === 'play') { const b = { x: W - 98, y: 2, w: 90, h: 24, label: me.hint >= 3 ? '💡 ぜんぶ表示' : '💡 ヒント' }; me.hintBtn = b; btn(g, b, { size: 12, shadow: false, border: '#e6dcf2', alpha: me.hint >= 3 ? 0.5 : 1 }); }
      // 文型のヒント / ふだんの案内
      if (phase !== 'count' && phase !== 'reveal' && me.hint >= 1) wrapTxt(g, `${ty.name}(${ty.sub})・${ty.gram}\n英語の順:${sent.roles.map(r => ROLES[r].name).join(' → ')}`, W / 2, 42, W - 16, { size: 11, color: '#6b4a9a', lh: 14 });
      else if (phase !== 'reveal') txt(g, '日本語を、英語の順番の枠にならべよう', W / 2, 40, { size: 11, color: '#8d7f9e' });
      const zoneTop = 62;
      const rows = chunkLayout(W), rowH = Math.round(44 * K), zoneH = Math.max(rows.length * rowH + 4, Math.round(104 * K));
      // 日本語のチャンク(日本語の順にふわふわ浮かぶ)
      me.rects = [];
      if (phase !== 'count' && phase !== 'reveal') {
        rows.forEach((row, ri) => {
          const tw = row.reduce((a, it) => a + it.w, 0) + (row.length - 1) * 8; let x = (W - tw) / 2;
          row.forEach(it => {
            const y = zoneTop + ri * rowH; const bob = Math.sin(t * 1.7 + it.i * 1.3) * 2.2;
            if (isPlaced(me, it.i)) { g.save(); g.setLineDash([4, 4]); g.strokeStyle = '#d9cdea'; g.lineWidth = 1.5; rr(g, x, y, it.w, it.h, 14); g.stroke(); g.restore(); }
            else if (!(me.drag && me.drag.i === it.i && me.drag.moved)) { pill(x, y + bob, it.w, it.h, it.c, { color: me.hint >= 2, label: me.hint >= 3, sel: me.sel === it.i, sc: me.sel === it.i ? 1.06 : 1 }); me.rects.push({ x, y, w: it.w, h: it.h, i: it.i }); }
            x += it.w + 8;
          });
        });
      }
      if (phase === 'reveal') {
        const mine = win === s;
        txt(g, win >= 0 && two ? (mine ? '⭕ 先にできた!' : '…先をこされた') : (mine ? '⭕ 正解!' : `${host.players[win].name} が先に完成`), W / 2, zoneTop + 8, { size: 14, color: mine ? '#3fbf6a' : '#8d7f9e' });
        const n = wrapTxt(g, reveal.en, W / 2, zoneTop + 42, W - 24, { size: 19 * Math.min(K, 1.15), color: INK, lh: 24 * Math.min(K, 1.15), weight: 900 });
        wrapTxt(g, sent.ja, W / 2, zoneTop + 42 + n * 12 * Math.min(K, 1.15) + 30, W - 24, { size: 12, color: '#8d7f9e', lh: 15 });
        txt(g, '🔊', W - 16, zoneTop + 8, { size: 14 });
      }
      // 英語の順番の枠
      const sTop = zoneTop + zoneH + 20;
      txt(g, '英語の順番 →', 12, sTop - 9, { size: 10, align: 'left', color: '#8d7f9e' });
      const nS = slots.length, gap = 4, maxPer = Math.max(1, Math.floor((W - 24 + gap) / (66 + gap))), nRows = Math.ceil(nS / maxPer), per = Math.ceil(nS / nRows);
      const sw = (W - 24 - (per - 1) * gap) / per, sh = clamp((h - sTop - 8) / nRows - 5, 50, 72 * K);   // 横ならび(文のように左から右へ)。入りきらないときだけ折り返す
      me.srects = [];
      const filled = reveal ? ORDER.filter(r => reveal.map[r] != null) : [];
      const prog = reveal ? clamp(phT / revDur, 0, 1) * (filled.length + 0.6) : 0;
      slots.forEach((r, k) => {
        const row = Math.floor(k / per), x = 12 + (k % per) * (sw + gap), y = sTop + row * (sh + 5), R = ROLES[r], w = sw;   // 同じ幅で、左からならぶ
        me.srects.push({ x, y, w, h: sh, r });
        const ci = reveal ? reveal.map[r] : me.placed[r], c = ci != null ? sent.chunks[ci] : null, fl = me.flash[r];
        const rank = filled.indexOf(r), lit = !reveal || rank < prog;
        g.fillStyle = c ? ROLES[c.role].col : 'rgba(255,255,255,0.75)'; g.globalAlpha = c && !lit ? 0.35 : 1; rr(g, x, y, w, sh, 12); g.fill(); g.globalAlpha = 1;
        g.save(); if (!c) g.setLineDash([5, 4]); g.strokeStyle = fl ? (fl.ok ? '#3fbf6a' : '#ff5a5a') : c ? 'rgba(0,0,0,0.12)' : R.col; g.lineWidth = fl ? 3.5 : 2.5; rr(g, x, y, w, sh, 12); g.stroke(); g.restore();
        txt(g, R.name, x + w / 2, y + 10, { size: 10.5 * Math.min(K, 1.15), color: '#5a4a6b', maxW: w - 8 });
        txt(g, R.gram, x + w / 2, y + 21 * Math.min(K, 1.15), { size: 8.5 * Math.min(K, 1.15), color: '#7a6a8b', weight: 700, maxW: w - 8 });
        if (c) { const fs = 13 * Math.min(K, 1.2), ls = reveal ? words(reveal ? c.en : c.ja, w - 10, fs) : null; if (ls) ls.forEach((l, li) => txt(g, l, x + w / 2, y + sh * 0.7 + (li - (ls.length - 1) / 2) * fs * 1.1, { size: fs, color: INK, weight: rank >= prog - 1 && rank < prog ? 900 : 800 })); else wrapTxt(g, c.ja, x + w / 2, y + sh * 0.7, w - 10, { size: fs, color: INK, lh: fs * 1.1 }); }
      });
      if (dim) txt(g, '× そこじゃないよ', W / 2, sTop - 9, { size: 12, color: '#ff5a5a' });
      // ドラッグ中のチャンク
      if (me.drag && me.drag.moved && phase === 'play') { const c = sent.chunks[me.drag.i], it = rows.flat().find(q => q.i === me.drag.i); pill(me.drag.x - it.w / 2, me.drag.y - 26 - it.h / 2, it.w, it.h, c, { color: me.hint >= 2, label: me.hint >= 3, sel: true, sc: 1.08 }); }
    }
    function draw() {
      S.begin(); const W = S.W, H = S.H;
      g.fillStyle = '#fff8ef'; g.fillRect(0, 0, W, H);
      if (!two) {
        g.fillStyle = '#fff'; rr(g, 8, 8, W - 16, TOP - 14, 12); g.fill();
        const me = P[0], got = Object.keys(me.placed).length, cp = phase === 'play' ? clamp(phT / cpuT, 0, 1) : phase === 'reveal' && win === 1 ? 1 : 0;
        txt(g, `あなた ${score[0]} / ${TO}`, 18, 22, { size: 12, align: 'left', color: COL.p1d }); txt(g, `${host.players[1].icon || ''} ${host.players[1].name} ${score[1]} / ${TO}`, W - 18, 22, { size: 12, align: 'right', color: COL.p2d });
        g.fillStyle = '#eee8f4'; rr(g, 18, 34, W / 2 - 28, 8, 4); g.fill(); rr(g, W / 2 + 10, 34, W / 2 - 28, 8, 4); g.fill();
        g.fillStyle = COL.p1; rr(g, 18, 34, Math.max(0, (W / 2 - 28) * (sent ? got / sent.n : 0)), 8, 4); g.fill();
        g.fillStyle = COL.p2; rr(g, W / 2 + 10, 34, Math.max(0, (W / 2 - 28) * cp), 8, 4); g.fill();
        g.save(); g.translate(0, TOP); drawArea(P[0], W, H - TOP); g.restore();
      } else {
        g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, H / 2);
        [0, 1].forEach(s => H2.half(s, () => drawArea(P[s], W, H / 2)));
        g.fillStyle = INK; g.fillRect(0, H / 2 - 1, W, 2);
      }
      if (phase === 'count') banner(g, S, two, count > 1 ? String(Math.ceil(count - 0.2)) : 'READY', { size: 48 });
      if (phase === 'reveal' && phT < 1.2 && win >= 0) banner(g, S, two, `${host.players[win].name} +1`, { size: 22, color: win ? COL.p2 : COL.p1 });
    }
    return { _dbg: () => ({ P, sent, phase, win, reveal, score }), stop() { stop(); pt.off(); S.cv.remove(); over = true; ended = true; try { speechSynthesis.cancel(); } catch (e) { } } };
  },
};
