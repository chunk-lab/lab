/* ===== game.js:1回のプレイ(盤面・物理・入力・スロット・得点・モード) ===== */
var Game = (function () {
  'use strict';
  var ROLE = [
    { k: 'front', ja: '前置き' }, { k: 'S', ja: 'だれが' }, { k: 'V', ja: 'する' }, { k: 'O', ja: 'なにを' }, { k: 'P', ja: 'どこ・いつ' }, { k: 'P', ja: 'どこ・いつ' }
  ];
  var MODE = {
    ta: { time: 60, max: 90, target: 22 }, daily: { time: 75, max: 99, target: 22 }, free: { time: 0, target: 22 },
    over: { time: 0, target: 18, cap: 34 }, tutorial: { time: 0, target: 0 }, shot: { time: 0, target: 0 }
  };
  // 調整値(tests/balance.sim.js でシミュレーションして決めた値。README「バランス調整」参照)
  var TUNE = { chunkTime: .5, chunkBonus3: .5, sentMin: 1, sentMax: 8, slotMul: 1.3, comboAt: 5, comboTime: 1, failX: 2, failTri: 1, chunkErr: 1, comboWin: 6, multStep: .05, multCap: 30, overStart: 2.6, overStep: .035, overMin: .55, overTime: 240, decayStart: 50, decayEnd: 150, decayMin: .15 };
  function decay(t) { return t <= TUNE.decayStart ? 1 : Math.max(TUNE.decayMin, 1 - (1 - TUNE.decayMin) * (t - TUNE.decayStart) / (TUNE.decayEnd - TUNE.decayStart)); }
  function sentExt(words, viaSlot, combo, playT) { return (U.clamp(words - 1, TUNE.sentMin, TUNE.sentMax) * (typeof viaSlot === 'number' ? viaSlot : viaSlot ? TUNE.slotMul : 1) + (combo >= TUNE.comboAt ? TUNE.comboTime : 0)) * decay(playT); }
  // スロットで割るときの倍率(埋めた枠の数で決まる。貯めるほど得)
  var SLOT_MULT = [1, 1, 1, 1.3, 1.6, 2, 2.5];
  function slotMult(n) { return SLOT_MULT[Math.min(6, n)] || 1; }
  function overInterval(sent, t) { return Math.max(TUNE.overMin, TUNE.overStart - TUNE.overStep * sent - t / TUNE.overTime); }
  function accepts(role, c) {
    if (!c) return false;
    switch (role) {
      case 'front': return c.t === 'CL' || (c.t === 'ID' && c.ik === 'front');
      case 'S': return c.t === 'NP';
      case 'V': return c.t === 'VP';
      case 'O': return c.t === 'NP' || c.t === 'AP' || c.t === 'NF' || c.t === 'PP' || (c.t === 'ADV' && c.ak === 'place') || (c.t === 'ID' && c.ik === 'place');
      case 'P': return c.t === 'PP' || c.t === 'ADV' || c.t === 'NF' || (c.t === 'ID' && c.ik !== 'front');
      case 'free': return true;
    }
    return false;
  }

  function create(app, opt) {
    var M = MODE[opt.mode] || MODE.ta, cfg = { auto: opt.auto }, S = app.settings;
    var rnd = opt.seed ? U.rng(opt.seed) : Math.random;
    var seeds = opt.mode === 'tutorial' ? null : Seeds.create(app.dict, { rnd: rnd, cfg: { auto: opt.auto }, level: opt.level || 0, maxLevel: opt.maxLevel || 2 });
    var supply = Supply.create(app.dict, { rnd: rnd, maxLevel: opt.maxLevel || 2, cfg: { auto: opt.auto }, seeds: seeds, level: opt.level || 0 });
    var g = {
      mode: opt.mode, level: opt.level, items: [], slots: [], chain: null, sel: null, drag: null, fx: [], ghosts: [], marks: [],
      score: 0, combo: 0, comboT: 0, best: 0, t: 0, time: M.time, timeMax: M.max || 0, state: 'countdown', countT: 3.2,
      spawnQ: 0, spawnT: 0, overT: TUNE.overStart, overInt: TUNE.overStart, playT: 0, failStreak: 0, segs: 0, idleT: 0, expr: 'normal', exprT: 0, blinkT: 2,
      stats: { perfect: 0, eaten: 0, shock: 0, sentences: 0, chunks: 0, words: 0, longest: '', longestN: 0, maxCombo: 0, list: [], fails: 0, past: 0, front: 0, coord: 0, clause: 0, slotS: 0 },
      hintPath: null, hintPathT: 0, hunger: 3, cand: null, guide: null, listeners: {}, noInput: false, lastTick: 99, readyT: 0, ready: null, id: 1, L: null
    };
    var free = opt.freeSlot, SHOT = opt.mode === 'shot';
    ROLE.forEach(function (r) { g.slots.push({ role: r.k, ja: r.ja, item: null }); });
    if (free && !SHOT) g.slots.push({ role: 'free', ja: 'あき', item: null });
    function on(name, fn) { (g.listeners[name] = g.listeners[name] || []).push(fn); }
    function emit(name, d) { (g.listeners[name] || []).forEach(function (f) { f(d); }); app.emit(name, d); }
    g.on = on;
    var colorMode = SHOT ? 'pos' : (opt.colorMode || 'pos'), dpr = app.dpr; // ボブルは品詞の色が狙いの手がかりなので、どのレベルでも色を出す

    // ---------- レイアウト ----------
    g.layout = function () {
      var st = app.stage, W = st.w, H = st.h, top = st.top, bot = st.bottom;
      var hud = top + 58, prev = 30, barH = 70, laneH = SHOT ? 132 : 50;
      var bar = { x: 6, y: H - bot - barH - 6, w: W - 12, h: barH };
      var lane = { x: 0, y: bar.y - laneH, w: W, h: laneH };
      var field = { x: 6, y: hud + prev + 8, w: W - 12, h: lane.y - (hud + prev + 8) };
      var n = g.slots.length, gap = 5, sw = (bar.w - 12 - gap * (n - 1)) / n, sh = barH - 16;
      g.slots.forEach(function (s, i) { s.rect = { x: bar.x + 6 + i * (sw + gap), y: bar.y + 8, w: sw, h: sh }; });
      g.L = { W: W, H: H, field: field, lane: lane, bar: bar, hudY: top, prevY: hud };
      var area = field.w * field.h, k = U.clamp(Math.sqrt(area / (378 * 560)), .8, 1.06);
      if (Math.abs(k - (g.k || 1)) > .01) { g.k = k; g.items.forEach(sizeItem); }
      g.target = M.target ? Math.round(M.target * U.clamp(area / (378 * 560), .78, 1.05)) : 0;
      g.items.forEach(function (it) { keepIn(it); });
      g.slots.forEach(function (s) { if (s.item) placeInSlot(s.item, s, true); });
    };

    // ---------- アイテム ----------
    function wordCol(w) { return colorMode === 'pos' ? Art.colorKeyOfWord(w) : 'plain'; }
    function chunkCol(c) { return colorMode === 'none' ? 'plain' : Art.colorKeyOfChunk(c); }
    function blobsOf(c) { if (colorMode !== 'pos') return []; var s = []; (c.words || []).forEach(function (w) { var k = Art.colorKeyOfWord(w); if (s.indexOf(k) < 0) s.push(k); }); return s.slice(0, 3); }
    function sizeItem(it) {
      if (it.kind === 'word') {
        it.text = G.wordText(it.word, cfg);
        var face = it.word.k === 'pr';
        var k = g.k || 1; it.fs = Math.round(15 * Math.max(.9, k) * 2) / 2;
        it.r = (face ? 30 : U.clamp(Art.measure(it.text, it.fs) / 2 + 13, 23, 46)) * k;
        it.face = face ? (G.PRON[it.word.v].pl ? 'pl' : 'one') : '';
      } else {
        it.text = G.label(it.chunk, cfg); it.full = G.chunkText(it.chunk, cfg);
        var k2 = g.k || 1; it.fs = Math.round(15 * Math.max(.9, k2) * 2) / 2;
        it.r = U.clamp(Art.measure(it.text, it.fs) / 2 + 17, 31, 56) * k2;
      }
      it.spr = null;
    }
    function spriteOf(it, slotR) {
      if (slotR) {
        return Art.sprite({ text: it.text, col: it.kind === 'word' ? wordCol(it.word) : chunkCol(it.chunk), r: slotR, kind: 'slot', shape: it.kind === 'chunk' ? Art.shapeOfChunk(it.chunk) : 'round', star: it.star, blobs: it.kind === 'chunk' ? blobsOf(it.chunk) : [], dpr: dpr, fs: 12 });
      }
      if (it.spr) return it.spr;
      var o = it.kind === 'word'
        ? { text: it.text, col: wordCol(it.word), r: Math.round(it.r), kind: 'word', shape: 'round', star: it.star, dpr: dpr, face: it.face, cyc: G.cyclable(it.word, cfg) && it.word.k !== 'n', fs: it.fs }
        : { text: it.text, col: chunkCol(it.chunk), r: Math.round(it.r), kind: 'chunk', shape: Art.shapeOfChunk(it.chunk), star: it.star, blobs: blobsOf(it.chunk), dpr: dpr, fs: it.fs };
      it.spr = Art.sprite(o); return it.spr;
    }
    function newItem(kind, payload, x, y) {
      var it = { id: g.id++, kind: kind, x: x, y: y, vx: 0, vy: 0, sc: 0, scT: 0, sq: 0, sqv: 0, ph: Math.random() * 6, born: g.t, state: 'spawn', slot: null };
      if (kind === 'word') { it.word = payload; it.star = !!payload.star; } else { it.chunk = payload; it.star = payload.t === 'ID' || (payload.words || []).some(function (w) { return w.star; }); }
      sizeItem(it); return it;
    }
    function addItem(it) { g.items.push(it); return it; }
    function removeItem(it) { var i = g.items.indexOf(it); if (i >= 0) g.items.splice(i, 1); if (it.slot) { it.slot.item = null; it.slot = null; } }
    function keepIn(it) {
      var f = g.L.field, r = Math.min(it.r, f.w / 2 - 2, f.h / 2 - 2);
      var e = it.shot ? .9 : .5, hit = false; // ショット中は壁で跳ね返る
      if (it.x < f.x + r) { it.x = f.x + r; it.vx = Math.abs(it.vx) * e; hit = true; } if (it.x > f.x + f.w - r) { it.x = f.x + f.w - r; it.vx = -Math.abs(it.vx) * e; hit = true; }
      if (it.y < f.y + r) { it.y = f.y + r; it.vy = Math.abs(it.vy) * e; hit = true; } if (it.y > f.y + f.h - r && it.state !== 'spawn') { it.y = f.y + f.h - r; it.vy = -Math.abs(it.vy) * e; hit = true; }
      if (hit && it.shot) { squash(it, 5); if (g.t - (it.shot.wallT || 0) > .08) { it.shot.wallT = g.t; app.audio.sfx('tap', 2); } }
    }
    function spawnWord(spec, x, y, instant) {
      var f = g.L.field;
      var it = spec.chunk ? newItem('chunk', spec.chunk, 0, 0) : newItem('word', spec, 0, 0);
      it.x = x != null ? x : f.x + it.r + Math.random() * (f.w - it.r * 2);
      it.y = y != null ? y : f.y + f.h + it.r * .6;
      it.vy = y != null ? 0 : -(160 + Math.random() * 80); it.vx = (Math.random() - .5) * 40;
      it.ty = f.y + it.r + Math.random() * Math.max(10, f.h * .78 - it.r);
      if (instant) { it.sc = 1; it.state = 'idle'; } else { it.state = 'spawn'; it.scT = 0; }
      return addItem(it);
    }
    g.spawnWord = spawnWord;
    function specFromSupply() {
      var s = supply.next(fieldAndSlotItems(), M.target || 22, opt.mode === 'tutorial' ? 0 : .07);
      if (!s) return null;
      // 手動のとき、タネ文の語は原形で出す(形はプレイヤーが選ぶ)
      if (s.k === 'v') s.f = 'base'; if (s.k === 'sm') s.t = 'pres'; if (s.k === 'be') s.v = 'pres';
      if (s.k === 'idm') { var st = G.chainState([s], cfg); if (st.complete && st.chunk) { st.chunk.words[0].star = 1; return { chunk: st.chunk }; } }
      return s;
    }
    function fieldAndSlotItems() { return g.items.filter(function (i) { return i.state !== 'pop'; }).concat(g.slots.filter(function (s) { return s.item; }).map(function (s) { return s.item; })); }
    function liveCount() { return g.items.filter(function (i) { return i.state !== 'pop' && i.state !== 'merge'; }).length; }

    // ---------- 物理 ----------
    function physics(dt) {
      var its = g.items, f = g.L.field, hits = [];
      for (var i = 0; i < its.length; i++) {
        var a = its[i]; if (a.state === 'pop' || a.state === 'merge' || a.slot) continue;
        if (a.lift) continue;
        var still = a.inChain || a === (g.sel && g.sel.item) || (g.drag && a.state !== 'spawn');
        if (a.state === 'spawn') { a.scT += dt; a.sc = U.E.outBack(U.clamp(a.scT / .35, 0, 1)); if (a.y > (a.ty || 0)) a.vy -= 520 * dt; else a.vy *= .8; if (a.y > f.y + f.h + a.r) a.y = f.y + f.h + a.r; if ((a.scT > .35 && a.y <= (a.ty || f.y + f.h - a.r) + 4) || a.scT > 2.2) { a.state = 'idle'; keepIn(a); } }
        if (SHOT && aim && aim.it === a) { a.vx = a.vy = 0; continue; } // ねらっている間は止める
        if (a.shot) { // 動いているバブル(ビリヤードのように転がる)
          a.vx *= Math.pow(.983, dt * 60); a.vy *= Math.pow(.983, dt * 60); a.x += a.vx * dt; a.y += a.vy * dt;
          if (Math.hypot(a.vx, a.vy) < 55 || g.t - a.shot.t > 5) shotEnd(a);
          continue;
        }
        if (!still) { var dk = g.calm ? .12 : 1; a.vx += (Math.sin(g.t * .7 + a.ph) * 9 + (Math.random() - .5) * 18) * dt * dk; a.vy += (Math.cos(g.t * .6 + a.ph * 1.3) * 9 + (Math.random() - .5) * 18) * dt * dk; }
        var damp = still ? (g.drag ? .7 : .82) : a.state === 'spawn' ? .985 : .965; a.vx *= Math.pow(damp, dt * 60); a.vy *= Math.pow(damp, dt * 60);
        var sp = Math.hypot(a.vx, a.vy), mx = a.state === 'spawn' ? 400 : 60; if (sp > mx) { a.vx *= mx / sp; a.vy *= mx / sp; }
        a.x += a.vx * dt; a.y += a.vy * dt;
      }
      for (i = 0; i < its.length; i++) {
        var p = its[i]; if (p.state === 'pop' || p.state === 'merge' || p.slot || p.lift) continue;
        for (var j = i + 1; j < its.length; j++) {
          var q = its[j]; if (q.state === 'pop' || q.state === 'merge' || q.slot || q.lift) continue;
          var dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || .01, min = (p.r + q.r) * (p.sc * .5 + .5) * .96 + 3;
          var far = (p.r + q.r) * 1.9;
          if (d < far && !g.drag) { var fk = (1 - d / far) * 70 * dt, fx = dx / d * fk, fy = dy / d * fk; if (!p.inChain) { p.vx -= fx; p.vy -= fy; } if (!q.inChain) { q.vx += fx; q.vy += fy; } }
          if (d < min && SHOT && (p.shot || q.shot)) {
            var sh = p.shot && (!q.shot || p.shot.main) ? p : q, ot = sh === p ? q : p;
            if (sh.shot.main && !sh.shot.tried[ot.id]) { sh.shot.tried[ot.id] = 1; hits.push([sh, ot]); }
            var nx0 = dx / d, ny0 = dy / d;
            if (sh.shot.pierce && sh.shot.main) { // 貫通:止まらずに通り抜け、相手は横へはじく
              var sgn = sh === p ? 1 : -1; if (shotMerge(sh, ot)) { var o1 = (min - d) / 2; p.x -= nx0 * o1; p.y -= ny0 * o1; q.x += nx0 * o1; q.y += ny0 * o1; continue; } var px = -sh.vy, py = sh.vx, pl = Math.hypot(px, py) || 1, side = ((ot.x - sh.x) * px + (ot.y - sh.y) * py) > 0 ? 1 : -1;
              ot.vx += px / pl * side * 35; ot.vy += py / pl * side * 35; var o2 = (min - d) / 2; ot.x += (ot === q ? 1 : -1) * nx0 * o2 * 2; ot.y += (ot === q ? 1 : -1) * ny0 * o2 * 2; continue;
            }
            // 弾性衝突(重さは半径の2乗)。止まっていた相手も勢いよく転がり出す
            var mp = p.r * p.r, mq = q.r * q.r, rv = (q.vx - p.vx) * nx0 + (q.vy - p.vy) * ny0;
            if (rv < 0) { var jj = -(1 + .95) * rv / (1 / mp + 1 / mq); p.vx -= jj / mp * nx0; p.vy -= jj / mp * ny0; q.vx += jj / mq * nx0; q.vy += jj / mq * ny0; knock(ot, sh.shot); squash(ot, 6); if (Math.abs(rv) > 300) app.audio.sfx('tap', 1); }
            var o0 = (min - d) / 2; p.x -= nx0 * o0; p.y -= ny0 * o0; q.x += nx0 * o0; q.y += ny0 * o0;
            continue;
          }
          if (d < min) {
            var o = (min - d) / 2, nx = dx / d, ny = dy / d, pw = p.inChain ? .15 : 1, qw = q.inChain ? .15 : 1, s = pw + qw;
            p.x -= nx * o * pw * 2 / s; p.y -= ny * o * pw * 2 / s; q.x += nx * o * qw * 2 / s; q.y += ny * o * qw * 2 / s;
            p.vx -= nx * 12 * pw; p.vy -= ny * 12 * pw; q.vx += nx * 12 * qw; q.vy += ny * 12 * qw;
          }
        }
        keepIn(p);
      }
      its.forEach(function (it) { var k = 180, d = 12; it.sqv += (-k * it.sq - d * it.sqv) * dt; it.sq += it.sqv * dt; });
      hits.forEach(function (h) { if (h[0].shot && g.items.indexOf(h[0]) >= 0 && g.items.indexOf(h[1]) >= 0 && h[1].state !== 'pop' && h[1].state !== 'merge') shotHit(h[0], h[1]); });
    }
    function squash(it, v) { it.sqv += v || 6; }

    // ---------- 連鎖(単語 → チャンク) ----------
    function chainWords() { return g.chain ? g.chain.items.map(function (i) { return i.word; }) : []; }
    function updateChainState() { if (!g.chain) return; g.chain.st = G.chainState(chainWords(), cfg); g.chain.last = g.t; refreshCand(); previewChain(); }
    function previewChain() {
      if (!g.chain) return;
      var st = g.chain.st, txt = st.complete && st.chunk ? G.chunkText(st.chunk, cfg) : g.chain.items.map(function (i) { return i.text; }).join(' ');
      app.ui.preview(txt, st.complete ? (st.err ? 'bad' : 'ok') : 'wait', st.err ? st.err.msg : '');
    }
    function startChain(it) { g.chain = { items: [it], last: g.t, t0: g.t }; it.inChain = true; squash(it, 8); app.audio.sfx('tap', 0); updateChainState(); emit('chainStart', { item: it }); }
    // つないだ結果が形の誤りだけなら、動詞の形を合うものに自動で回す(be + arrive → be arriving)。あとからタップで変えられる
    function fitForms(items) {
      var ws = items.map(function (i) { return i.word; }), st = G.chainState(ws, cfg);
      if (!st.err) return st;
      for (var k = 0; k < items.length; k++) {
        var w = ws[k]; if (w.k !== 'v') continue;
        var f0 = w.f;
        for (var c = 0; c < 3; c++) { G.cycleWord(w, cfg); var s2 = G.chainState(ws, cfg); if (!s2.err && (s2.complete || s2.prefix)) { sizeItem(items[k]); items.formFixed = true; return s2; } }
        w.f = f0;
      }
      return st;
    }
    function addToChain(it) { g.chain.items.push(it); it.inChain = true; fitForms(g.chain.items); if (g.chain.items.formFixed) { g.chain.fixed = true; g.chain.items.formFixed = false; } squash(it, 8); app.audio.sfx('tap', g.chain.items.length - 1); updateChainState(); emit('chainAdd', { item: it }); }
    function clearChain() { if (!g.chain) return; g.chain.items.forEach(function (i) { i.inChain = false; }); g.chain = null; refreshCand(); app.ui.preview('', ''); }
    function scatterChain(msg) {
      var its = g.chain.items, st = g.chain.st;
      its.forEach(function (i) { i.vx += (Math.random() - .5) * 160; i.vy += (Math.random() - .5) * 160; squash(i, -6); });
      var text = its.map(function (i) { return i.text; }).join(' ');
      var m = msg || (st && st.err ? st.err.msg : G.MSG.chain({ t: text }));
      var c = centroid(its); toast(m, st && st.err ? 'x' : 'tri', c.x, c.y);
      app.audio.sfx('scatter'); clearChain(); breakCombo(); setExpr('sad', 1);
      if (st && st.err && !msg) { g.stats.fails++; emit('fail', { kind: 'chunk', code: st.err.code }); }
    }
    function confirmChain() {
      var ch = g.chain; if (!ch) return null;
      if (ch.items.length < 2) { var only = ch.items[0]; clearChain(); return only || null; } // 1語だけではチャンクにしない
      var st = ch.st; if (!st.complete) { scatterChain(); return null; }
      if (st.err) { scatterChain(); return null; }
      var its = ch.items, c = centroid(its), chunk = st.chunk;
      if (chunk.t === 'NP' && chunk.merged) {
        var mw = { k: 'pr', v: chunk.pron }; chunk = G.chainState([mw], cfg).chunk;
      }
      clearChain();
      // 1語の慣用句・接続詞などはチャンク化しても見た目が同じなので、そのまま確定
      its.forEach(function (i) { ghostTo(i, c.x, c.y); removeItem(i); });
      var ni = newItem('chunk', chunk, c.x, c.y); ni.state = 'grow'; ni.scT = -.12; addItem(ni);
      var n = its.length;
      g.chunksSince++; g.segs = Math.min(10, g.segs + 1);
      g.stats.chunks++;
      var fixed = ch.fixed;
      if (fixed) triMark('△ 正しい順番:' + G.chunkText(chunk, cfg), c.x, c.y - ni.r); else addCombo(1);
      var pts = Math.round(10 * Math.max(1, n) * mult() * (fixed ? .5 : 1)); addScore(pts, c.x, c.y - ni.r);
      if (M.time) addTime((TUNE.chunkTime + (n >= 3 ? TUNE.chunkBonus3 : 0)) * decay(g.playT));
      app.audio.sfx('chunk', n); if (n > 1 || chunk.t === 'VP' || chunk.t === 'NP') speak(ni.full);
      burst(c.x, c.y, Art.COL[chunkCol(chunk)], 10 + n * 3);
      if (S.gloss) { var gl = G.gloss(chunk); if (gl) g.marks.push({ item: ni, text: gl, t: 0, d: 1.8 }); }
      setExpr('joy', .7);
      emit('chunk', { item: ni, chunk: chunk, n: n }); g.lastMade = { item: ni, t: g.t };
      refill(); return ni;
    }
    function centroid(its) { var x = 0, y = 0; its.forEach(function (i) { x += i.x; y += i.y; }); return { x: x / its.length, y: y / its.length }; }

    // ---------- 選択・差し込み ----------
    function select(it) {
      if (g.sel && g.sel.item === it) {
        // もう一度タップ:切り替えられる部品を回す
        if (cycleChunk(it)) { g.sel.t = g.t; return; }
      }
      g.sel = { item: it, t: g.t }; squash(it, 5); app.audio.sfx('select');
      speak(it.full || it.text); showTip(it); refreshCand(); emit('select', { item: it });
      app.ui.preview(it.full || it.text, 'sel');
    }
    function deselect() { if (!g.sel) return; g.sel = null; app.ui.tip(null); refreshCand(); app.ui.preview('', ''); }
    function cycleChunk(it) {
      var c = it.chunk; if (!c || c.t === 'CL') return false;
      var order = ['ti', 'be', 'v', 'modal', 'prep', 'det', 'pr', 'n', 'er', 'conj'];
      for (var o = 0; o < order.length; o++) {
        var ws = c.words.filter(function (w) { return w.k === order[o]; });
        for (var k = 0; k < ws.length; k++) {
          var w = ws[k], save = JSON.stringify({ v: w.v, f: w.f, pl: w.pl });
          for (var tries = 0; tries < 6; tries++) {
            if (!G.cycleWord(w, cfg)) break;
            var r = G.rebuild(c, cfg);
            if (r.chunk && !r.err) { it.chunk = r.chunk; sizeItem(it); squash(it, 7); app.audio.sfx('cycle'); speak(it.full); showTip(it); return true; }
          }
          var sv = JSON.parse(save); w.v = sv.v; w.f = sv.f; w.pl = sv.pl;
        }
      }
      return false;
    }
    function showTip(it) { var gl = it.chunk ? G.gloss(it.chunk) : ''; app.ui.tip(it.full || it.text, S.gloss ? gl : '', it.x, it.y - it.r - 6); }
    function tryInsertInto(target, wi) {
      var nc = G.tryInsert(target.chunk, wi.word, cfg); if (!nc) return false;
      ghostTo(wi, target.x, target.y); removeItem(wi);
      target.chunk = nc; sizeItem(target); squash(target, 10);
      if (target.slot) { if (accepts(target.slot.role, nc)) placeInSlot(target, target.slot, true); else { var sl = target.slot; sl.item = null; target.slot = null; target.state = 'idle'; target.x = sl.rect.x + sl.rect.w / 2; target.y = g.L.field.y + g.L.field.h - 40; addItem(target); keepIn(target); slotsChanged(); } }
      app.audio.sfx('insert'); speak(target.full); burst(target.x, target.y, Art.COL[chunkCol(nc)], 8);
      addCombo(1); addScore(Math.round(8 * mult()), target.x, target.y - target.r);
      g.sel.t = g.t; showTip(target); emit('insert', { item: target }); refill(); return true;
    }

    // ---------- 一筆書き・ドラッグ ----------
    function tokenOf(it) {
      if (it.chunk) return it.chunk;
      var st = G.chainState([it.word], cfg); return st.complete && !st.err ? st.chunk : null;
    }
    function unitOf(it) { return it.chunk ? { chunk: it.chunk, words: it.chunk.words || [] } : { words: [it.word] }; }
    function strokeTokens() { return G.strokeTokens(g.drag.items.map(unitOf), cfg) || []; }
    function strokeOK() { return !!G.strokeTokens(g.drag.items.map(unitOf), cfg); }
    // なぞりの並びとしてつながる見込みがあるか(1語ではチャンクにならない can / want to / the なども含めて判定)
    var PEND_SAMPLES = null;
    function pendSamples() {
      if (PEND_SAMPLES) return PEND_SAMPLES;
      var n = app.dict.all('noun').filter(function (e) { return e.c === 'c' && !e.ind && e.cat !== 'time' && e.cat !== 'place'; })[0], v = app.dict.all('verb').filter(function (e) { return e.fr === 'both'; })[0];
      PEND_SAMPLES = [[{ k: 'n', e: n }], [{ k: 'det', v: 'the' }, { k: 'n', e: n }], [{ k: 'v', e: v, f: 'base' }]];
      return PEND_SAMPLES;
    }
    function okSeq(seq) {
      var T2 = G.strokeTokens(seq.map(unitOf), cfg, true), allW = [].concat.apply([], seq.map(function (i) { return unitOf(i).words; }));
      if (allW.length <= 6 && G.asChunk(allW, cfg).prefix && seq.length === 1) return true;
      if (!T2) return allW.length <= 6 && !!G.asChunk(allW, cfg).prefix;
      if (T2.pend) { var pc = G.completePend(T2.pend, cfg, pendSamples()); if (!pc) return false; T2 = T2.slice(); T2.push(pc); }
      // 副詞句などのあとに主語なしで動詞が来る並び(yesterday + run)は候補にしない
      var iv = -1, inp = -1; T2.forEach(function (t, k) { if (iv < 0 && t.t === 'VP') iv = k; if (inp < 0 && (t.t === 'NP' || t.t === 'CL')) inp = k; });
      if (iv > 0 && (inp < 0 || inp > iv)) return false;
      return G.viable(T2, true) || (allW.length <= 6 && !!G.asChunk(allW, cfg).chunk);
    }
    function strokeAdd(it) {
      var d = g.drag;
      if (d.items.indexOf(it) >= 0) {
        // 1つ前のバブルの上で0.3秒とどまったら、最後の1つを取り消す(通り過ぎただけでは取り消さない)
        if (d.items.length >= 2 && d.items[d.items.length - 2] === it) { if (d.backIt !== it) { d.backIt = it; d.backT = g.t; } else if (g.t - d.backT > .3) { d.items.pop(); d.backIt = null; app.audio.sfx('cycle'); strokePreview(); refreshCand(); } }
        return;
      }
      d.backIt = null;
      if (!tokenOf(it) && it.kind === 'word' && !G.chainState([it.word], cfg).prefix) { if (!it.noFlash || g.t - it.noFlash > .6) { it.noFlash = g.t; squash(it, -4); } return; }
      if (guideBlocks(it)) return;
      // 文として成り立たなくなるバブルは拾わない(赤く揺れるだけ)
      if (!okSeq(d.items.concat([it]))) {
        // 通りがかりに拾った直前のバブルが邪魔なら、それを外して今のバブルを拾う(指の行き先を優先)
        if (d.items.length >= 2 && okSeq(d.items.slice(0, -1).concat([it]))) { var dropped = d.items.pop(); squash(dropped, -3); d.items.push(it); squash(it, 8); app.audio.sfx('link', d.items.length - 1); strokePreview(); refreshCand(); return; }
        if (!it.badT || g.t - it.badT > .6) { it.badT = g.t; squash(it, -5); app.audio.sfx('reject'); } return; }
      if (d.items.length === 1 && d.lifted) { unlift(d.lifted); d.lifted = null; }
      d.items.push(it); squash(it, 8); app.audio.sfx('link', d.items.length - 1); strokePreview(); refreshCand();
    }
    function strokePreview() {
      var T = G.strokeTokens(g.drag.items.map(unitOf), cfg);
      var ac0 = g.drag.items.length > 1 ? G.asChunk([].concat.apply([], g.drag.items.map(function (i) { return unitOf(i).words; })), cfg) : null;
      if (!T || (ac0 && ac0.chunk && !(T && G.parse(T, cfg).ok))) { g.drag.ok = !!(ac0 && ac0.chunk); g.drag.viable = true; app.ui.preview(ac0 && ac0.chunk ? G.chunkText(ac0.chunk, cfg) : g.drag.items.map(function (i) { return i.text; }).join(' '), ac0 && ac0.chunk ? 'ok' : 'wait', ac0 && ac0.chunk ? 'はなすとチャンクになる' : ''); return; }
      var r = G.parse(T, cfg), v = G.viable(T);
      g.drag.ok = r.ok; g.drag.viable = v;
      app.ui.preview(r.ok ? r.text : T.map(function (t) { return G.chunkText(t, cfg); }).join(' '), r.ok ? 'ok' : v ? 'wait' : 'bad', '');
    }
    function lift(it) { it.lift = true; it.liftFrom = { x: it.x, y: it.y, slot: it.slot }; squash(it, 6); }
    function unlift(it) { it.lift = false; if (it.liftFrom && it.liftFrom.slot) placeInSlot(it, it.liftFrom.slot, true); else if (it.liftFrom) { it.x = it.liftFrom.x; it.y = it.liftFrom.y; } it.liftFrom = null; }
    function endDrag(x, y) {
      var d = g.drag; g.drag = null; refreshCand();
      if (!d) return;
      if (d.carry && d.items[0]) { var ci = d.items[0]; d.items.slice(1).forEach(function (i) { if (i.lift) unlift(i); }); if (inKun(x, y)) { eat(ci); return; } ci.lift = false; dropToSlot(ci, slotAt(x, y), d); return; }
      if (d.items.length >= 2) { unliftAll(d); evalStroke(d.items, x, y, inBar(x, y)); return; }
      var it = d.items[0]; if (!it) return;
      var si = slotAt(x, y);
      if (si != null || inBar(x, y)) { if (it.lift) it.lift = false; dropToSlot(it, si, d); return; }
      if (it.lift) {
        it.lift = false;
        if (it.slot) { var s = it.slot; s.item = null; it.slot = null; it.state = 'idle'; app.audio.sfx('slot'); slotsChanged(); }
        it.x = x; it.y = y; it.vx = it.vy = 0; keepIn(it); squash(it, 6);
        if (g.items.indexOf(it) < 0) addItem(it);
      }
      app.ui.preview('', '');
    }
    function unliftAll(d) { d.items.forEach(function (i) { if (i.lift) unlift(i); }); if (d.lifted && d.lifted.lift) unlift(d.lifted); }
    function evalStroke(its, x, y, toBar) {
      var T = G.strokeTokens(its.map(unitOf), cfg), r0 = T && G.parse(T, cfg); g.debug.lastStroke = its.map(function (i) { return i.text; }).join(' + ');
      if (!(r0 && r0.ok)) {
        // なぞった語がまとめて1つのチャンクになるなら、チャンクにする(順番が違っても並べ直す)
        var allW = [].concat.apply([], its.map(function (i) { return unitOf(i).words; })), ac = allW.length <= 6 ? G.asChunk(allW, cfg) : null;
        if (ac && ac.chunk) { makeChunkFrom(its, ac.chunk, x, y, ac.words !== allW); return; }
        if (T && G.viable(T, true)) { makeFrag(its, T, x, y, toBar); return; }
      }
      // うまくいかないときは、はじめと終わりを残して途中で拾ったものを外してみる
      if (!(r0 && r0.ok) && its.length >= 3 && !its.retry) {
        var mid = its.length - 2, bestS = null;
        for (var m = (1 << mid) - 2; m >= 0 && !bestS; m--) {
          var sub = [its[0]]; for (var b = 0; b < mid; b++) if (m & (1 << b)) sub.push(its[b + 1]); sub.push(its[its.length - 1]);
          var Ts = G.strokeTokens(sub.map(unitOf), cfg), rs = Ts && G.parse(Ts, cfg), aw = [].concat.apply([], sub.map(function (i) { return unitOf(i).words; }));
          if ((rs && rs.ok) || (aw.length <= 6 && G.asChunk(aw, cfg).chunk)) bestS = sub;
        }
        if (bestS) { bestS.retry = true; evalStroke(bestS, x, y, toBar); return; }
      }
      if (!T) { failMark({ sev: 2, err: G.err('chain', { t: its.map(function (i) { return i.text; }).join(' ') }) }, x, y); return; }
      var r = r0; g.debug.lastT = T.map(function (t) { return t.t + ':' + G.chunkText(t, cfg); }).join(' | ');
      // 下のバーで離したら、完成した文でもスロットに入れる(貯めて「わる!」)
      if (toBar && T.length >= 2) { makeFrag(its, T, x, y, true); return; }
      if (r.ok && r.kind === 'S') { sentence(its, T, r, false); return; }
      if (r.ok && r.kind === 'CL') {
        var fi = its.filter(function (i) { return !i.slot; }), c = fi.length ? centroid(fi) : { x: U.clamp(x, g.L.field.x + 40, g.L.field.x + g.L.field.w - 40), y: g.L.field.y + g.L.field.h - 60 };
        its.forEach(function (i) { ghostTo(i, c.x, c.y); removeItem(i); });
        var ni = addItem(newItem('chunk', G.makeClause(T, r), c.x, c.y)); ni.state = 'grow'; ni.scT = -.1;
        app.audio.sfx('chunk', 4); speak(r.text); addCombo(2); addScore(Math.round(40 * mult()), c.x, c.y - 30); burst(c.x, c.y, Art.COL.link, 18);
        setExpr('idea', 1); emit('clause', { item: ni }); refill(); slotsChanged(); app.ui.preview('', ''); return;
      }
      failMark(r, x, y);
    }
    // まだ文になっていない並びは「文のかけら」として残す。あとで他のチャンクやスロットとつなげられる
    function makeFrag(its, T, x, y, toBar) {
      var fi = its.filter(function (i) { return !i.slot; }), c = fi.length ? centroid(fi) : { x: U.clamp(x, g.L.field.x + 40, g.L.field.x + g.L.field.w - 40), y: g.L.field.y + g.L.field.h - 60 };
      its.forEach(function (i) { ghostTo(i, c.x, c.y); removeItem(i); });
      var ni = addItem(newItem('chunk', G.makeFrag(T), c.x, c.y)); ni.state = 'grow'; ni.scT = -.1;
      app.audio.sfx('chunk', 3); speak(ni.full); if (!toBar) toast('文のかけら。つづきをつなげよう', 'info', c.x, c.y - 40);
      emit('frag', { item: ni }); refill(); slotsChanged(); app.ui.preview('', '');
      if (toBar) dropToSlot(ni, null, {});
    }
    // かけら・複数のチャンクをスロットに分けて入れる(S V → だれが・する)
    function spreadToSlots(it) {
      var parts = it.chunk.parts, x = it.x, y = it.y, from = it.slot; removeItem(it); if (it.lift) it.lift = false;
      var placed = 0, left = [];
      parts.forEach(function (p) {
        var t = freeSlotFor(p);
        var ci = newItem('chunk', p, x, y); ci.sc = 1; ci.state = 'idle';
        if (t) { placeInSlot(ci, t); placed++; } else left.push(ci);
      });
      left.forEach(function (ci, k) { ci.x = U.clamp(x + k * 30, g.L.field.x + 40, g.L.field.x + g.L.field.w - 40); ci.y = g.L.field.y + g.L.field.h - 50; addItem(ci); keepIn(ci); });
      if (left.length) toast('入らない部分は上にもどした', 'tri', x, y - 30);
      emit('slot', { item: it, role: 'spread' }); slotsChanged(); app.ui.preview('', ''); refill();
    }
    function triMark(text, x, y) { toast(text, 'tri', x, y); app.audio.sfx('tri'); g.fx.push({ type: 'mark', x: x, y: y, tri: true, t: 0, d: .9 }); setExpr('think', 1); }
    function makeChunkFrom(its, chunk, x, y, fixed) {
      var fi = its.filter(function (i) { return !i.slot; }), c = fi.length ? centroid(fi) : { x: x, y: y }, n = chunk.words.length;
      its.forEach(function (i) { ghostTo(i, c.x, c.y); removeItem(i); });
      var ni = newItem('chunk', chunk, c.x, c.y); ni.state = 'grow'; ni.scT = -.12; addItem(ni);
      g.chunksSince++; g.segs = Math.min(10, g.segs + 1); g.stats.chunks++;
      if (fixed) triMark('△ 正しい順番:' + G.chunkText(chunk, cfg), c.x, c.y - ni.r); else addCombo(1);
      addScore(Math.round(10 * n * mult() * (fixed ? .5 : 1)), c.x, c.y - ni.r); if (M.time) addTime((TUNE.chunkTime + (n >= 3 ? TUNE.chunkBonus3 : 0)) * decay(g.playT));
      app.audio.sfx('chunk', n); speak(ni.full); burst(c.x, c.y, Art.COL[chunkCol(chunk)], 10 + n * 3);
      if (S.gloss) { var gl = G.gloss(chunk); if (gl) g.marks.push({ item: ni, text: gl, t: 0, d: 1.8 }); }
      setExpr('joy', .7); emit('chunk', { item: ni, chunk: chunk, n: n }); refill(); slotsChanged(); app.ui.preview('', '');
    }
    function failMark(r, x, y) {
      var tri = r.sev === 1;
      toast(r.err.msg, tri ? 'tri' : 'x', x, y); app.audio.sfx(tri ? 'tri' : 'fail');
      if (!tri) penalty(TUNE.failX); breakCombo(); setExpr(tri ? 'think' : 'sad', 1.2); g.stats.fails++; g.failStreak++;
      g.fx.push({ type: 'mark', x: x, y: y, tri: tri, t: 0, d: .9 });
      emit('fail', { kind: 'sentence', code: r.err.code }); app.ui.preview('', '');
    }

    // ---------- スロット ----------
    function slotAt(x, y) { for (var i = 0; i < g.slots.length; i++) { var r = g.slots[i].rect; if (x >= r.x - 2 && x <= r.x + r.w + 2 && y >= r.y - 10 && y <= r.y + r.h + 8) return i; } return null; }
    function kunPos() { var lane = g.L.lane; return { x: 46, y: lane.y + lane.h * .55 }; }
    function inKun(x, y) { var k = kunPos(); return Math.hypot(x - k.x, y - k.y) < 46; }
    function eat(it) {
      if (g.hunger <= 0) { bounceBack(it, 'おなかいっぱい…文を作ると、また食べられる'); setExpr('sad', .8); return; }
      g.hunger--; var k = kunPos(), fromSlot = !!it.slot;
      ghostTo(it, k.x - 10, k.y); removeItem(it); it.lift = false;
      app.audio.sfx('insert'); setTimeout(function () { if (!g.dead) app.audio.sfx('pop'); }, 160);
      setExpr('joy', .9); g.stats.eaten++; g.fx.push({ type: 'txt', x: k.x + 30, y: k.y - 34, text: 'もぐもぐ', t: 0, d: .9, ja: 1 });
      emit('eat', { item: it }); if (fromSlot) slotsChanged(); refill(); app.ui.preview('', '');
    }
    function inBar(x, y) { var b = g.L.bar; return x >= b.x && x <= b.x + b.w && y >= b.y - 6 && y <= b.y + b.h + 20; }
    function placeInSlot(it, s, quiet) {
      it.slot = s; s.item = it; it.state = 'slot'; it.lift = false;
      it.x = s.rect.x + s.rect.w / 2; it.y = s.rect.y + s.rect.h / 2; it.vx = it.vy = 0;
      var i = g.items.indexOf(it); if (i >= 0) g.items.splice(i, 1);
      if (!quiet) { squash(it, 8); app.audio.sfx('slot'); }
    }
    function dropToSlot(it, si, d) {
      var tok = tokenOf(it), from = it.liftFrom && it.liftFrom.slot;
      if (!tok) { bounceBack(it, 'このままではスロットに入らない'); return; }
      if (tok.t === 'FR') { spreadToSlots(it); return; }
      var target = si != null ? g.slots[si] : null;
      if (guideBlocks(it, target)) { bounceBack(it); return; }
      if (!target || !accepts(target.role, tok)) target = freeSlotFor(tok) || (target && accepts(target.role, tok) ? target : null);
      if (!target) { bounceBack(it, '入れられるスロットがない'); return; }
      // 単語は1語チャンクにして入れる
      if (it.kind === 'word') { var ci = newItem('chunk', tok, it.x, it.y); ci.sc = 1; ci.state = 'idle'; removeItem(it); it = ci; }
      if (target.item && target.item !== it) { var old = target.item; old.slot = null; target.item = null; if (from && accepts(from.role, tokenOf(old))) placeInSlot(old, from, true); else { old.state = 'idle'; old.x = target.rect.x + target.rect.w / 2; old.y = g.L.field.y + g.L.field.h - 30; addItem(old); keepIn(old); } }
      if (it.slot && it.slot !== target) { it.slot.item = null; it.slot = null; }
      placeInSlot(it, target); it.liftFrom = null;
      emit('slot', { item: it, role: target.role }); slotsChanged(); app.ui.preview('', '');
      refill();
    }
    // 空いているスロットを、チャンクの種類に合う順に選ぶ(前置詞句はまず「どこで・いつ」、名詞はまず「だれが」)
    function freeSlotFor(tok) {
      var pref = tok.t === 'NP' ? ['S', 'O', 'free'] : tok.t === 'VP' ? ['V', 'free'] : (tok.t === 'PP' || tok.t === 'ADV' || tok.t === 'ID') ? ['front', 'P', 'O', 'free'] : tok.t === 'CL' ? ['front', 'free'] : ['O', 'P', 'free'];
      for (var k = 0; k < pref.length; k++) { var sl = g.slots.filter(function (s) { return !s.item && s.role === pref[k] && accepts(s.role, tok); })[0]; if (sl) return sl; }
      return g.slots.filter(function (s) { return !s.item && accepts(s.role, tok); })[0] || null;
    }
    function bounceBack(it, msg) { if (it.lift) unlift(it); if (it.slot) placeInSlot(it, it.slot, true); squash(it, -8); app.audio.sfx('reject'); if (msg) toast(msg, 'tri', it.x, it.y - 30); }
    function slotTokens() { return g.slots.filter(function (s) { return s.role !== 'free' && s.item; }).map(function (s) { return s.item; }); }
    function slotsChanged() {
      var sItem = g.slots[1].item, vItem = g.slots[2].item; g.ready = null;
      if (!sItem || !vItem) { g.slotErr = null; return; }
      var its = slotTokens(), T = its.map(tokenOf), r = G.parse(T, cfg);
      if (r.ok && r.kind === 'S') { var sm0 = slotMult(its.length); g.ready = { its: its, T: T, r: r, t: g.t, mult: sm0 }; g.slotErr = null; app.audio.sfx('ready'); app.ui.preview(r.text, 'ok', '「わる!」で決定 ×' + sm0.toFixed(1) + '(貯めるほどアップ)'); }
      else { g.slotErr = r.err; app.ui.preview(T.map(function (t) { return G.chunkText(t, cfg); }).join(' '), 'bad', r.err ? r.err.msg : ''); }
    }
    function confirmSlots() { var rd = g.ready; if (!rd) return; g.ready = null; sentence(rd.its, rd.T, rd.r, rd.mult); }

    // ---------- 文の完成 ----------
    function sentence(its, T, r, viaSlot) {
      var words = G.wordCount(T), n = T.length;
      its.forEach(function (it, i) { it.state = 'pop'; it.popT = -i * .07; it.inChain = false; it.lift = false; if (it.slot) { var s = it.slot; s.item = null; it.slot = null; it.fromSlot = true; g.items.push(it); } else if (g.items.indexOf(it) < 0) g.items.push(it); });
      if (g.sel && its.indexOf(g.sel.item) >= 0) deselect();
      var base = 20 * words + 35 * (n - 1) + (r.info.front ? 80 : 0) + (r.info.clause ? 150 : 0) + (r.info.coord ? 150 : 0) + its.filter(function (i) { return i.star; }).length * 40;
      var sm = typeof viaSlot === 'number' ? viaSlot : 1, perfect = supply.matchSeed(r.text);
      if (perfect) { base = base * 1.5 + 200; g.stats.perfect++; }
      addCombo(2);
      var pts = Math.round(base * mult() * sm); var fi = its.filter(function (i) { return !i.fromSlot; }), c = fi.length ? centroid(fi) : { x: g.L.W / 2, y: g.L.bar.y - 60 }; addScore(pts, c.x, c.y - 20, true);
      g.hunger = Math.min(3, g.hunger + 1);
      var shock = aftershock(its, c, words, sm);
      if (M.time) addTime(sentExt(words, typeof viaSlot === 'number' ? 1 + (sm - 1) * .5 : viaSlot, g.combo, g.playT));
      g.stats.sentences++; g.stats.words += words; if (words > g.stats.longestN) { g.stats.longestN = words; g.stats.longest = r.text; }
      if (r.info.past) g.stats.past++; if (r.info.front) g.stats.front++; if (r.info.coord) g.stats.coord++; if (r.info.clause) g.stats.clause++; if (viaSlot) g.stats.slotS++;
      g.stats.list.push({ text: r.text, words: words, pts: pts });
      app.audio.sfx('sentence', Math.min(4, n)); if (perfect) setTimeout(function () { if (!g.dead) app.audio.sfx('best'); }, 350); speak(r.text, true);
      app.ui.banner(r.text, r.marks, pts, { slot: sm > 1 ? sm : 0, perfect: perfect, shock: shock });
      if (perfect) g.fx.push({ type: 'txt', x: g.L.W / 2, y: g.L.field.y + g.L.field.h * .3, text: 'PERFECT!', t: 0, d: 1.6, big: 2 });
      setExpr('joy', 1.8, true);
      popSegs(); g.failStreak = 0;
      if (opt.mode === 'over') g.overSent = (g.overSent || 0) + 1;
      emit('sentence', { text: r.text, words: words, points: pts, slot: sm > 1 ? sm : !!viaSlot, info: r.info, perfect: perfect, shock: shock });
      app.ui.preview('', ''); slotsChanged(); refill();
      app.audio.setIntensity(.35 + Math.min(.65, g.combo / 20));
    }
    // 余波:はじけた近くの「余り物の機能語」も割れる。長い文・大きな倍率ほど広い
    var FUNC = /^(det|q|prep|er|ti|conj|modal|not|deg|tp|sm)$/;
    function aftershock(its, c, words, sm) {
      var R = Math.min(280, (90 + 18 * words) * (sm > 1 ? 1 + (sm - 1) * .4 : 1)), n = 0;
      g.items.forEach(function (it) {
        if (its.indexOf(it) >= 0 || it.state !== 'idle' || it.inChain || it.kind !== 'word' || !FUNC.test(it.word.k) || (g.sel && g.sel.item === it)) return;
        var d = Math.hypot(it.x - c.x, it.y - c.y); if (d > R) return;
        it.state = 'pop'; it.popT = -(.18 + d / 700); n++;
      });
      g.fx.push({ type: 'ring', x: c.x, y: c.y, t: 0, d: .6, col: Art.COL.prep, big: R });
      if (n) { var p = Math.round(8 * n * mult()); addScore(p); g.stats.shock += n; g.fx.push({ type: 'txt', x: c.x, y: c.y + 30, text: '余波 ×' + n, t: 0, d: 1.2 }); }
      return n;
    }
    function popSegs() { var lane = g.L.lane; for (var i = 0; i < g.segs; i++) burst(70 + i * 22, lane.y + lane.h / 2, Art.COL.plain, 5); g.segs = 0; g.chunksSince = 0; }

    // ---------- 得点・時間・コンボ ----------
    function mult() { var m = 1 + Math.min(g.combo, TUNE.multCap) * TUNE.multStep; if (S.hint === 'always') m = Math.min(m, 1.8); return m; }
    function addCombo(n) { g.combo += n; g.comboT = TUNE.comboWin; g.stats.maxCombo = Math.max(g.stats.maxCombo, g.combo); if (g.combo >= 5 && g.combo % 5 < n) { app.audio.sfx('combo', Math.floor(g.combo / 5)); g.fx.push({ type: 'txt', x: g.L.W / 2, y: g.L.field.y + 40, text: g.combo + ' COMBO!', t: 0, d: 1.1, big: 1 }); } }
    function breakCombo() { if (g.combo >= 5) app.audio.sfx('warn'); g.combo = 0; g.comboT = 0; app.audio.setIntensity(.25); }
    function addScore(p, x, y, big) { g.score += p; if (x != null) g.fx.push({ type: 'txt', x: x, y: y, text: '+' + p, t: 0, d: big ? 1.3 : .9, big: big ? 1 : 0 }); }
    function addTime(s) { if (!M.time) return; var before = g.time; g.time = Math.min(M.max, g.time + s); if (g.time - before > .4) { g.fx.push({ type: 'time', text: '+' + (g.time - before).toFixed(1) + '秒', t: 0, d: 1 }); app.audio.sfx('extend'); } }
    function penalty(s) { if (!M.time) return; g.time = Math.max(0, g.time - s); g.fx.push({ type: 'time', text: '−' + s + '秒', t: 0, d: 1, bad: 1 }); }

    // ---------- 演出 ----------
    function burst(x, y, col, n) {
      var light = S.lite || app.reduced; n = light ? Math.ceil(n / 3) : n;
      for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 180; g.fx.push({ type: Math.random() < .3 ? 'star' : 'dot', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, t: 0, d: .5 + Math.random() * .5, col: col, s: 2 + Math.random() * 4 }); }
      g.fx.push({ type: 'ring', x: x, y: y, t: 0, d: .45, col: col });
    }
    function ghostTo(it, x, y) { g.ghosts.push({ spr: spriteOf(it), x0: it.x, y0: it.y, x1: x, y1: y, t: 0, d: .2 }); }
    function toast(msg, kind, x, y) { app.ui.toast(msg, kind); }
    function setExpr(e, d, wave) { g.expr = e; g.exprT = d; g.wave = wave ? d : 0; }
    function speak(text, full) { if (S.voice) app.audio.speak(text); }

    // ---------- ヒント(候補の強調) ----------
    function refreshCand() {
      g.cand = null;
      var mode = S.hint; if (mode === 'none') return;
      if (mode === 'press' && !g.pressHint && !g.drag) return;
      var set = new Set(), all = fieldAndSlotItems();
      if (g.chain) { var cw = chainWords(); all.forEach(function (i) { if (i.kind === 'word' && !i.inChain && G.canAppend(cw, i.word)) set.add(i); }); g.chain.items.forEach(function (i) { set.add(i); }); }
      else if (g.drag && g.drag.items.length) { all.forEach(function (i) { if (g.drag.items.indexOf(i) >= 0 || i.lift) { set.add(i); return; } if (okSeq(g.drag.items.concat([i]))) set.add(i); }); }
      else if (g.pressHint) { var it = g.pressHint; set.add(it); all.forEach(function (i) { if (i === it) return; if (it.kind === 'word' && i.kind === 'word' && G.canAppend([it.word], i.word)) set.add(i); else if (it.chunk && i.kind === 'word' && G.tryInsert(it.chunk, i.word, cfg)) set.add(i); else if (okSeq([it, i])) set.add(i); }); }
      else if (g.sel) { var sc = g.sel.item; set.add(sc); all.forEach(function (i) { if (i.kind === 'word' && G.tryInsert(sc.chunk, i.word, cfg)) set.add(i); }); }
      else return;
      g.cand = set;
    }

    // ---------- 入力 ----------
    var press = null;
    function hitItem(x, y, slack) {
      for (var i = g.items.length - 1; i >= 0; i--) { var it = g.items[i]; if (it.state === 'pop' || it.state === 'merge' || it.lift) continue; if (Math.hypot(it.x - x, it.y - y) <= it.r * (it.sc || 1) + (slack || 4)) return it; }
      var si = slotAt(x, y); if (si != null && g.slots[si].item) return g.slots[si].item;
      return null;
    }
    function hitStroke(x, y) { // 一筆書き中は中心付近を通ったときだけ拾う(端をかすっても拾わない)
      var best = null, bd = 1e9;
      fieldAndSlotItems().forEach(function (it) { if (it.lift || it.state === 'pop' || it.state === 'merge' || it.state === 'spawn') return; var d = Math.hypot(it.x - x, it.y - y), lim = it.slot ? Math.min(it.slot.rect.w, it.slot.rect.h) * .45 : Math.max(16, it.r * .58); if (d < lim && d < bd) { bd = d; best = it; } });
      return best;
    }
    function guideBlocks(it, slot) { return g.guide && g.guide.allow && !g.guide.allow(it, slot); }
    g.down = function (x, y) {
      if (g.state !== 'play' || g.noInput) return;
      g.idleT = 0;
      var it = g.ready && g.pill && x >= g.pill.x && x <= g.pill.x + g.pill.w && y >= g.pill.y && y <= g.pill.y + g.pill.h ? null : hitItem(x, y, 6);
      press = { x: x, y: y, t: g.t, it: it, moved: false, long: false, bar: inBar(x, y) && !it };
      if (it) press.longTimer = 0;
    };
    g.move = function (x, y) {
      if (!press) return;
      var nowMs = performance.now(); (press.s = press.s || []).push({ x: x, y: y, t: nowMs }); if (press.s.length > 10) press.s.shift();
      var dist = Math.hypot(x - press.x, y - press.y);
      if (!press.moved && dist > 10) {
        press.moved = true;
        if (press.bar && g.ready && y < press.y - 20) { confirmSlots(); press = null; return; }
        if (press.it && !guideBlocks(press.it, 'drag')) {
          var it = press.it;
          if (g.chain) { if (g.chain.items.indexOf(it) >= 0) { var nc = confirmChain(); it = nc; } else if (g.chain.st.complete && !g.chain.st.err) confirmChain(); else clearChain(); }
          deselect();
          if (it) { g.drag = { items: [it], pts: [{ x: x, y: y }], lifted: it }; lift(it); app.audio.sfx('select'); strokePreview(); refreshCand(); emit('dragStart', { item: it }); }
        }
      }
      if (g.drag) {
        g.drag.pts.push({ x: x, y: y }); if (g.drag.pts.length > 60) g.drag.pts.shift();
        var d = g.drag, si2 = slotAt(x, y), first = d.items[0];
        // スロットの帯の上では「運ぶ」(途中で拾ったバブルは外す)
        d.toKun = inKun(x, y);
        var carry = d.items.length === 1 && (inBar(x, y) || d.toKun) && !(si2 != null && g.slots[si2].item && d.items.indexOf(g.slots[si2].item) > 0) && !(first && first.slot && si2 != null && g.slots[si2] === first.slot && d.items.length > 1);
        if (carry !== !!d.carry) {
          d.carry = carry;
          if (carry) { if (!first.lift) lift(first); d.lifted = first; }
          else if (d.items.length >= 2 && first.lift) { unlift(first); d.lifted = null; }
          refreshCand(); if (carry) app.ui.preview(first.full || first.text, 'sel', d.toKun ? 'チャンクくんが食べる(のこり' + g.hunger + ')' : 'スロットへ運ぶ'); else strokePreview();
        }
        if (d.lifted && (d.items.length === 1 || d.carry)) { var l = d.lifted; l.x = x; l.y = y - 6; }
        if (!d.carry) {
          // 速く通り過ぎたバブルは拾わない。減速するか、0.07秒とどまったら拾う
          var h = hitStroke(x, y);
          if (h && h !== d.lifted && d.items.indexOf(h) < 0) { if (d.hov !== h) { d.hov = h; d.hovT = nowMs; } if (speedOf(press.s) < .35 || nowMs - d.hovT > 110) { strokeAdd(h); d.hov = null; } }
          else if (h && h !== d.lifted) strokeAdd(h);
          else if (!h) { d.backIt = null; d.hov = null; }
        }
      }
    };
    function speedOf(sm) { if (!sm || sm.length < 2) return 0; var a = sm[Math.max(0, sm.length - 4)], b = sm[sm.length - 1], dt = Math.max(1, b.t - a.t); return Math.hypot(b.x - a.x, b.y - a.y) / dt; }
    function flickOf(p) { // 下(または上)へのフリック
      var sm = p.s; if (!sm || sm.length < 2) return 0;
      var b = sm[sm.length - 1], a = sm[0]; for (var i = sm.length - 1; i >= 0; i--) { if (b.t - sm[i].t > 90) break; a = sm[i]; }
      var dt = Math.max(1, b.t - a.t), vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt, dy = b.y - p.y;
      if (Math.abs(vy) < .5 || Math.abs(vx) > Math.abs(vy) * .8 || Math.abs(dy) < 40 || b.t - sm[0].t > 500) return 0;
      return vy > 0 ? 1 : -1;
    }
    g.up = function (x, y) {
      var p = press; press = null;
      if (p && g.drag && g.state === 'play') {
        var lastS = p.s && p.s[p.s.length - 1], fl = g.drag.items.length === 1 && lastS && performance.now() - lastS.t < 70 ? flickOf(p) : 0, d0 = g.drag, f0 = d0.items[0];
        if (fl && f0 && !inKun(x, y) && !inBar(x, y)) {
          unliftAll(d0); g.drag = null; refreshCand();
          if (fl > 0 && !f0.slot) { dropToSlot(f0, null, {}); emit('flick', { item: f0 }); return; }
          if (fl < 0 && f0.slot) { var sl0 = f0.slot; sl0.item = null; f0.slot = null; f0.state = 'idle'; f0.x = sl0.rect.x + sl0.rect.w / 2; f0.y = g.L.field.y + g.L.field.h - 50; f0.vy = -260; addItem(f0); keepIn(f0); app.audio.sfx('slot'); slotsChanged(); return; }
        }
        if (g.drag && g.drag.hov) { var hh = hitStroke(x, y); if (hh === g.drag.hov) strokeAdd(hh); }
      } g.pressHint = null; if (S.hint === 'press') refreshCand();
      if (!p || g.state !== 'play') { if (g.drag) endDrag(x, y); return; }
      if (g.drag) { endDrag(x, y); return; }
      if (p.long) { app.ui.tip(null); return; }
      tap(p.it, x, y, p.bar);
    };
    g.cancel = function () { press = null; if (g.drag) { unliftAll(g.drag); g.drag = null; } };
    function longPress(it) {
      press.long = true; showTip(it); speak(it.full || it.text);
      if (S.hint === 'press' && !(g.guide && g.guide.noHint)) { g.pressHint = it; g.combo = Math.floor(g.combo * .7); refreshCand(); setExpr('idea', .8); }
    }
    function tap(it, x, y, onBar) {
      if (g.ready && g.pill && x >= g.pill.x && x <= g.pill.x + g.pill.w && y >= g.pill.y && y <= g.pill.y + g.pill.h) { if (!guideBlocks(null, 'confirm')) confirmSlots(); return; }
      if (onBar && g.ready && !it) { if (!guideBlocks(null, 'confirm')) confirmSlots(); return; }
      var si = slotAt(x, y);
      if (!it && si != null && g.sel && !g.slots[si].item) { var sel = g.sel.item; if (!guideBlocks(sel, g.slots[si])) { deselect(); dropToSlot(sel, si, {}); } return; }
      if (!it) { if (g.chain) { if (g.chain.items.length < 2) clearChain(); else if (g.chain.st.complete && !g.chain.st.err) confirmChain(); else { clearChain(); app.audio.sfx('scatter'); } } deselect(); return; }
      if (guideBlocks(it)) { squash(it, -4); return; }
      if (it.kind === 'word') {
        if (it.word.k === 'magic') resolveMagic(it);
        if (g.chain && it.inChain) {
          if (G.cycleWord(it.word, cfg)) { sizeItem(it); squash(it, 9); app.audio.sfx('cycle'); speak(it.text); updateChainState(); emit('cycle', { item: it }); }
          else { squash(it, -5); app.audio.sfx('reject'); }
          return;
        }
        if (g.chain) {
          if (G.canAppend(chainWords(), it.word)) { addToChain(it); return; }
          // 順番の外れた語も、連鎖の中に入れられる位置があれば差し込む(the dog に big → the big dog)
          var cw0 = chainWords();
          for (var pos0 = cw0.length - 1; pos0 >= 0; pos0--) {
            var its0 = g.chain.items.slice(0, pos0).concat([it], g.chain.items.slice(pos0)), fs0 = its0.map(function (i) { return i.word.f; });
            var st0 = fitForms(its0);
            if (!(st0.prefix && (!st0.complete || !st0.err || !g.chain.st.complete)) && !(st0.complete && (!st0.err || g.chain.st.err))) { its0.forEach(function (i, q) { if (i.word.k === 'v' && i.word.f !== fs0[q]) { i.word.f = fs0[q]; sizeItem(i); } }); continue; }
            { g.chain.items.splice(pos0, 0, it); it.inChain = true; g.chain.fixed = true; squash(it, 8); app.audio.sfx('insert'); updateChainState(); emit('chainAdd', { item: it }); return; }
          }
          if (g.chain.items.length < 2 || (g.chain.st.complete && !g.chain.st.err)) { confirmChain(); startChain(it); return; }
          squash(it, -9); it.vx += (Math.random() - .5) * 120; app.audio.sfx('reject'); g.chain.last = g.t; return;
        }
        if (g.sel && g.sel.item.chunk) { if (tryInsertInto(g.sel.item, it)) return; deselect(); }
        // 直前に確定したチャンク(3秒以内)につながるなら足す(can swim → quickly)
        if (g.lastMade && /^(adv|er)$/.test(it.word.k) && g.t - g.lastMade.t < 3 && g.items.indexOf(g.lastMade.item) >= 0 && G.tryInsert(g.lastMade.item.chunk, it.word, cfg)) { g.sel = { item: g.lastMade.item, t: g.t }; if (tryInsertInto(g.lastMade.item, it)) { g.lastMade.t = g.t; deselect(); return; } deselect(); }
        startChain(it); return;
      }
      // チャンク:途中の連鎖(at など)とつながるなら取り込む
      if (g.chain && !g.chain.st.complete || (g.chain && g.chain.st.err)) {
        var cw1 = chainWords().concat(it.chunk.words || []), st1 = it.chunk.t !== 'CL' && G.chainState(cw1, cfg);
        if (st1 && (st1.prefix || st1.complete)) { absorb(it); return; }
      }
      if (g.chain) { if (g.chain.st.complete && !g.chain.st.err) confirmChain(); else clearChain(); }
      select(it);
    }
    function absorb(ch) { // チャンクを単語に戻して連鎖の後ろにつなぐ
      var ws = ch.chunk.words.slice(), x = ch.x, y = ch.y; removeItem(ch);
      ws.forEach(function (w, k) { var wi = newItem('word', w, x + (k - (ws.length - 1) / 2) * 14, y); wi.sc = 1; wi.state = 'idle'; addItem(wi); g.chain.items.push(wi); wi.inChain = true; });
      app.audio.sfx('insert'); updateChainState(); emit('chainAdd', { item: ch });
    }
    function resolveMagic(it) {
      var cw = chainWords(), kinds = cw.length ? ['n', 'adj', 'v', 'adv', 'det', 'prep'] : ['n'], pick = null;
      U.shuffle(kinds);
      for (var i = 0; i < kinds.length && !pick; i++) {
        var k = kinds[i], cand = k === 'det' ? { k: 'det', v: 'the' } : k === 'prep' ? { k: 'prep', v: 'in' } : null;
        if (!cand) { var pos = { n: 'noun', adj: 'adj', v: 'verb', adv: 'adv' }[k], e = app.dict.getWords({ pos: pos, maxLevel: opt.maxLevel || 2, count: 1, tag: k === 'v' ? { simple: 1 } : k === 'adv' ? { k: 'manner' } : null })[0]; if (e) cand = { k: k, e: e }; }
        if (cand && (!cw.length || G.canAppend(cw, cand))) pick = cand;
      }
      pick = pick || { k: 'n', e: app.dict.getWords({ pos: 'noun', maxLevel: 2, count: 1 })[0] };
      it.word = pick; sizeItem(it); burst(it.x, it.y, Art.COL.magic, 12); app.audio.sfx('extend');
    }

    // ---------- アイテム ----------
    g.useItem = function (name) {
      if (g.state !== 'play') return false;
      if (name === 'hint') {
        var sol = Supply.solve(fieldAndSlotItems(), cfg, 5000);
        if (!sol) { toast('いまは文が見つからない…もう少し待ってみよう', 'info'); return false; }
        g.hintPath = sol.parts.map(function (p) { return p.src; }); g.hintPathT = 7; setExpr('idea', 1.5); app.audio.sfx('ready'); return true;
      }
      if (name === 'magic') { var m = spawnWord({ k: 'magic' }); m.star = true; app.audio.sfx('extend'); return true; }
      if (name === 'auto') {
        if (g.chain) clearChain();
        var cands = Supply.candidates(g.items.filter(function (i) { return i.state === 'idle'; }), cfg).filter(function (c) { return c.src.length >= 2 && c.src.every(function (i) { return i.kind === 'word'; }); });
        if (!cands.length) { toast('くっつけられる単語がない…', 'info'); return false; }
        cands.sort(function (a, b) { return b.src.length - a.src.length; });
        var pick = cands[0].src; g.chain = { items: [], last: g.t, t0: g.t };
        pick.forEach(function (i) { g.chain.items.push(i); i.inChain = true; });
        updateChainState(); app.audio.sfx('extend'); confirmChain(); return true;
      }
      return false;
    };

    // ---------- 補充 ----------
    function pickOldWord() { // 骨組みが作れないとき、古い機能語を1つ入れ替える
      var c = g.items.filter(function (i) { return i.kind === 'word' && i.state === 'idle' && !i.inChain && /^(det|q|prep|er|ti|conj|modal|not|deg)$/.test(i.word.k); });
      c = c.filter(function (i) { return !i.word.sid; }); // タネ文の部品は消さない
      c.sort(function (a, b) { return a.born - b.born; }); return c[0] || null;
    }
    function refill() {
      if (opt.mode === 'over' || opt.mode === 'tutorial' || !M.target) return;
      // ショット:弾く弾(単語)が常に10個前後あるように。チャンクが増えすぎたら止める
      var need = (g.target || M.target) - liveCount() - g.spawnQ; if (need > 0) g.spawnQ += need;
    }
    g.refill = refill;

    // ---------- 更新 ----------
    g.update = function (dt) {
      if (g.state === 'paused') return;
      g.t += dt;
      if (g.state === 'countdown') {
        var before = Math.ceil(g.countT); g.countT -= dt; var now = Math.ceil(g.countT);
        if (now !== before && now >= 0) { app.ui.count(now > 0 ? String(now) : 'スタート!'); app.audio.sfx('count', now); }
        if (g.countT <= 0) { g.state = 'play'; app.audio.music('play'); app.audio.setIntensity(.25); emit('start', { mode: g.mode }); }
      }
      // 出現
      if (SHOT) { g.spawnQ = 0; if (g.state === 'play' || g.state === 'countdown') bUpdate(dt); } else if (g.spawnQ > 0) { g.spawnT -= dt; if (g.spawnT <= 0) { var sp = specFromSupply(); if (sp) spawnWord(sp); g.spawnQ--; g.spawnT = g.state === 'countdown' ? .06 : .14; } }
      if (!SHOT) physics(dt);
      if (g.state === 'play') playUpdate(dt);
      if (g.drag && g.drag.hov && press && press.s) { var lp = press.s[press.s.length - 1]; if (performance.now() - g.drag.hovT > 110 && hitStroke(lp.x, lp.y) === g.drag.hov) { strokeAdd(g.drag.hov); if (g.drag) g.drag.hov = null; } }
      // 長押し
      if (press && !press.moved && !press.long && press.it && g.t - press.t > .45) longPress(press.it);
      // アニメ
      g.items.forEach(function (it) {
        if (it.state === 'grow') { it.scT += dt; it.sc = U.E.outBack(U.clamp(it.scT / .3, 0, 1)); if (it.scT >= .3) it.state = 'idle'; }
        if (it.state === 'pop') { it.popT += dt; if (it.popT >= 0 && !it.popped) { it.popped = true; burst(it.x, it.y, Art.COL[it.kind === 'chunk' ? chunkCol(it.chunk) : wordCol(it.word)], 14); app.audio.sfx('pop'); } }
      });
      for (var i = g.items.length - 1; i >= 0; i--) if (g.items[i].state === 'pop' && g.items[i].popT > .05) g.items.splice(i, 1);
      g.ghosts = g.ghosts.filter(function (gh) { gh.t += dt; return gh.t < gh.d; });
      g.fx = g.fx.filter(function (p) { p.t += dt; if (p.vx != null) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.vx *= .98; } return p.t < p.d; });
      g.marks = g.marks.filter(function (m) { m.t += dt; return m.t < m.d && g.items.indexOf(m.item) >= 0; });
      if (g.exprT > 0) { g.exprT -= dt; if (g.exprT <= 0) g.expr = 'normal'; }
      if (g.wave > 0) g.wave -= dt;
      g.blinkT -= dt; if (g.blinkT < -.12) g.blinkT = 2 + Math.random() * 3;
      if (g.hintPathT > 0) { g.hintPathT -= dt; if (g.hintPathT <= 0) g.hintPath = null; }
      hud();
    };
    function playUpdate(dt) {
      g.idleT += dt; g.playT += dt;
      // 連鎖のタイマー(2秒ルール)
      if (g.chain && !g.drag) {
        var el = g.t - g.chain.last, st = g.chain.st;
        // 1語だけなら次の操作まで待つ。2語以上つながったら確定(これ以上伸ばせないなら早めに)
        if (st.complete && !st.err && g.chain.items.length >= 2 && el > (st.closed ? .6 : 1)) confirmChain();
      }
      if (g.sel && g.t - g.sel.t > 2.5 && !press) deselect();
      if (g.comboT > 0) { g.comboT -= dt; if (g.comboT <= 0) breakCombo(); }
      if (M.time) {
        g.time -= dt;
        var sec = Math.ceil(g.time); if (sec <= 10 && sec !== g.lastTick && sec > 0) { g.lastTick = sec; app.audio.sfx('tick'); }
        if (g.time <= 10 && g.exprT <= 0) g.expr = 'panic';
        if (g.time <= 0) { g.time = 0; finish('おしまい!'); return; }
      }
      if (opt.mode === 'over') {
        g.overT -= dt * (g.failStreak >= 2 ? 1.6 : 1);
        g.overInt = overInterval(g.overSent || 0, g.playT); if (g.overT <= 0) { g.overT = g.overInt; g.spawnQ++; }
        if (!supply.feasible(fieldAndSlotItems()).ok && g.spawnQ < 1) g.spawnQ++;
        var cnt = liveCount(); if (cnt > M.cap) { finish('あふれた!'); return; }
      }
      if (g.idleT > 6 && g.exprT <= 0 && g.expr === 'normal') { setExpr('think', 1.5); }
      // 安全策:1秒ごとに数と「文の骨組み」を点検
      g.checkT = (g.checkT || 0) - dt;
      if (g.checkT <= 0) {
        g.checkT = 1; g.solveT = (g.solveT || 0) + 1;
        if (opt.mode !== 'tutorial' && !SHOT) {
          if (opt.mode !== 'over') refill();
          // 2秒ごとに探索し、文が1つも作れなければ詰みを解く1語を入れる(盤面がいっぱいなら古い機能語と入れ替え)
          if (g.solveT >= 2 && !g.chain && !g.drag && g.spawnQ < 1) {
            g.solveT = 0; var its = fieldAndSlotItems();
            if (!Supply.solve(its, cfg, 1500)) { var sp = supply.rescue(its); if (sp) { if (opt.mode !== 'over' && liveCount() >= (g.target || M.target)) { var old = pickOldWord(); if (old) { old.state = 'pop'; old.popT = 0; } } spawnWord(sp); g.rescued = (g.rescued || 0) + 1; } }
          }
        }
      }
    }
    function finish(text) {
      if (g.state === 'over') return; g.state = 'over'; g.cancel(); clearChain(); deselect();
      app.audio.sfx('end'); app.audio.music(null); setExpr(g.stats.sentences ? 'joy' : 'sad', 9);
      app.ui.count(text, true); emit('end', { mode: g.mode, score: g.score, stats: g.stats });
      setTimeout(function () { if (!g.dead) app.onGameEnd(g); }, 1500);
    }
    g.finish = finish;
    g.pause = function () { if (g.state === 'play' || g.state === 'countdown') { g.prevState = g.state; g.state = 'paused'; g.cancel(); } };
    g.resume = function () { if (g.state === 'paused') g.state = g.prevState || 'play'; };
    g.destroy = function () { g.dead = true; app.ui.tip(null); app.ui.preview('', ''); };

    function hud() {
      var fill = opt.mode === 'over' ? liveCount() / M.cap : null;
      app.ui.hud({ score: g.score, combo: g.combo, comboT: g.comboT / TUNE.comboWin, mult: mult(), time: M.time ? g.time : null, timeMax: M.max, fill: fill, warn: (M.time && g.time <= 10) || (fill != null && fill > .85) });
    }

    // ---------- 描画 ----------
    g.draw = function (ctx) {
      var L = g.L, t = g.t;
      drawLane(ctx, L.lane, t);
      drawBar(ctx, L.bar, t);
      var dimSet = g.cand;
      // 連鎖の線
      if (g.chain && g.chain.items.length > 1) {
        ctx.save(); ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 10; ctx.shadowColor = 'rgba(120,80,200,.5)'; ctx.shadowBlur = 10;
        ctx.beginPath(); g.chain.items.forEach(function (i, k) { k ? ctx.lineTo(i.x, i.y) : ctx.moveTo(i.x, i.y); }); ctx.stroke(); ctx.restore();
      }
      // 一筆書きの線
      if (g.drag && !g.drag.carry && (g.drag.items.length > 1 || !g.drag.lifted)) {
        ctx.save(); ctx.lineCap = ctx.lineJoin = 'round';
        var col = g.drag.ok ? 'rgba(255,200,60,.95)' : g.drag.viable === false ? 'rgba(160,150,180,.8)' : 'rgba(255,255,255,.95)';
        ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.shadowColor = g.drag.ok ? 'rgba(255,170,0,.8)' : 'rgba(100,80,180,.4)'; ctx.shadowBlur = 14;
        ctx.beginPath(); g.drag.items.forEach(function (i, k) { k ? ctx.lineTo(i.x, i.y) : ctx.moveTo(i.x, i.y); });
        var lp = g.drag.pts[g.drag.pts.length - 1]; if (lp) ctx.lineTo(lp.x, lp.y); ctx.stroke(); ctx.restore();
      }
      // アイテム(浮いているもの → 選択中・連鎖中を上に)
      var order = g.items.slice().sort(function (a, b) { return (a.inChain || a.lift ? 1 : 0) - (b.inChain || b.lift ? 1 : 0); });
      order.forEach(function (it) {
        if (it.state === 'pop' && it.popT >= 0) return;
        var a = dimSet && !dimSet.has(it) ? .28 : 1;
        drawItem(ctx, it, a, t);
        if (it.badT && g.t - it.badT < .4) ring(ctx, it.x, it.y, it.r + 4, '#ef4d63');
      });
      // スロットの中身
      g.slots.forEach(function (s) { if (s.item && !s.item.lift) drawSlotItem(ctx, s, t, dimSet); });
      // 持ち上げ中
      if (g.drag && g.drag.lifted && g.drag.lifted.lift) drawItem(ctx, g.drag.lifted, .92, t, 1.12);
      // 連鎖の番号とタイマー
      if (g.chain) {
        var st = g.chain.st, el = g.t - g.chain.last, lim = st.complete && !st.err && g.chain.items.length >= 2 ? (st.closed ? .6 : 1) : 0, k = lim ? U.clamp(1 - el / lim, 0, 1) : 1;
        g.chain.items.forEach(function (i, n) { badge(ctx, i.x - i.r * .7, i.y - i.r * .7, String(n + 1)); });
        var last = g.chain.items[g.chain.items.length - 1];
        ctx.save(); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = st.complete ? (st.err ? '#ff6b7a' : '#3cc98a') : '#f5a524';
        ctx.beginPath(); ctx.arc(last.x, last.y, last.r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke(); ctx.restore();
      }
      if (g.sel) { var si = g.sel.item; ring(ctx, si.x, si.y, si.r + 6 + Math.sin(t * 8) * 1.5, '#7b5cff'); }
      if (g.hintPath) g.hintPath.forEach(function (src, n) { src.forEach(function (i) { ring(ctx, i.x, i.y, i.r + 8 + Math.sin(t * 6) * 2, '#ffb800'); }); var a = src[0]; badge(ctx, a.x + a.r * .6, a.y - a.r * .8, String(n + 1), '#ffb800'); });
      g.ghosts.forEach(function (gh) { var k = U.E.inCubic(gh.t / gh.d), x = U.lerp(gh.x0, gh.x1, k), y = U.lerp(gh.y0, gh.y1, k), s = 1 - k * .7; ctx.globalAlpha = 1 - k * .5; ctx.drawImage(gh.spr.cv, x - gh.spr.size * s / 2, y - gh.spr.size * s / 2, gh.spr.size * s, gh.spr.size * s); ctx.globalAlpha = 1; });
      g.marks.forEach(function (m) { var it = m.item, a = Math.min(1, m.t * 5, (m.d - m.t) * 3); pill(ctx, it.x, it.y + it.r + 12, m.text, a); });
      if (SHOT) drawBob(ctx, t);
      drawFx(ctx);
      if (g.guide && g.guide.draw) g.guide.draw(ctx, t);
    };
    function drawItem(ctx, it, alpha, t, extra) {
      var sp = spriteOf(it), w = Math.sin(t * 2.2 + it.ph) * .03, s = (it.sc || 0) * (extra || 1) * (it.inChain ? 1.06 : 1);
      if (s <= .01) return;
      var sx = s * (1 + w + it.sq * .06), sy = s * (1 - w - it.sq * .05);
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(it.x, it.y);
      if (it.inChain) { ctx.beginPath(); ctx.arc(0, 0, it.r + 4, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill(); }
      ctx.scale(sx, sy); ctx.drawImage(sp.cv, -sp.size / 2, -sp.size / 2, sp.size, sp.size); ctx.restore();
      if (it.word && it.word.k === 'magic') { ctx.save(); ctx.globalAlpha = .6 + .4 * Math.sin(t * 5); ring(ctx, it.x, it.y, it.r + 3, 'hsl(' + (t * 120 % 360) + ',90%,65%)'); ctx.restore(); }
    }
    function drawSlotItem(ctx, s, t, dimSet) {
      var it = s.item, r = Math.min(s.rect.w, s.rect.h) / 2 - 2, sp = spriteOf(it, r), k = 1 + it.sq * .05;
      ctx.save(); ctx.globalAlpha = dimSet && !dimSet.has(it) ? .35 : 1; ctx.translate(s.rect.x + s.rect.w / 2, s.rect.y + s.rect.h / 2); ctx.scale(k * s.rect.w / (r * 2.25), k * s.rect.w / (r * 2.25));
      ctx.drawImage(sp.cv, -sp.size / 2, -sp.size / 2, sp.size, sp.size); ctx.restore();
      if (g.sel && g.sel.item === it) ring(ctx, it.x, it.y, r + 4, '#7b5cff');
    }
    function drawLane(ctx, lane, t) {
      if (SHOT) return;
      ctx.save();
      var y = lane.y + lane.h * .55, segs = SHOT ? 1 : 1 + g.segs, maxLen = lane.w - 140;
      var hov = g.drag && g.drag.toKun;
      Art.chunkKun(ctx, 46, y, { segs: segs, expr: hov ? (g.hunger ? 'surprise' : 'sad') : g.expr, t: t, blink: g.blinkT < 0 ? .1 : 1, scale: .6, wave: g.wave > 0, walk: g.chain || g.drag, maxLen: maxLen });
      for (var i = 0; i < 3; i++) { var cx = 22 + i * 15, cy = lane.y + 2, on = i < g.hunger; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fillStyle = on ? '#f2b468' : 'rgba(255,255,255,.6)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = on ? '#9c5a1e' : 'rgba(150,120,180,.6)'; ctx.stroke(); if (on) { ctx.fillStyle = '#6b3a12'; ctx.fillRect(cx - 2.5, cy - 2, 1.6, 1.6); ctx.fillRect(cx + 1, cy + .5, 1.6, 1.6); } }
      if (hov) { var k0 = kunPos(); ctx.beginPath(); ctx.arc(k0.x, k0.y, 44 + Math.sin(t * 8) * 2, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = g.hunger ? 'rgba(255,170,60,.9)' : 'rgba(239,77,99,.8)'; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]); }
      ctx.restore();
    }
    function drawBar(ctx, b, t) {
      ctx.save();
      roundRect(ctx, b.x, b.y, b.w, b.h, 18); ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.fill();
      ctx.lineWidth = g.ready ? 3 : 1.5; ctx.strokeStyle = g.ready ? 'hsl(' + (140 + Math.sin(t * 6) * 20) + ',70%,50%)' : 'rgba(140,120,190,.35)'; ctx.stroke();
      g.slots.forEach(function (s, i) {
        var r = s.rect; roundRect(ctx, r.x, r.y, r.w, r.h, 12);
        var acc = g.drag && (g.drag.items.length === 1 || g.drag.carry) && tokenOf(g.drag.items[0]) && accepts(s.role, tokenOf(g.drag.items[0]));
        ctx.fillStyle = acc ? 'rgba(255,236,170,.9)' : s.role === 'free' ? 'rgba(235,230,250,.8)' : 'rgba(238,234,248,.95)'; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = acc ? '#f3b630' : 'rgba(150,130,200,.3)'; ctx.stroke();
        if (!s.item) { ctx.fillStyle = 'rgba(110,95,150,.75)'; ctx.font = '700 ' + (r.w < 52 ? 9.5 : 10.5) + 'px ' + Art.FONT_JA; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.ja, r.x + r.w / 2, r.y + r.h / 2); }
      });
      g.pill = null;
      if (g.ready) {
        var lab = 'わる! ×' + g.ready.mult.toFixed(1), pw = 118, ph = 34, px = b.x + b.w / 2 - pw / 2, py = b.y - ph + 6, sc = 1 + Math.sin(t * 7) * .04;
        g.pill = { x: px - 6, y: py - 6, w: pw + 12, h: ph + 12 };
        ctx.save(); ctx.translate(px + pw / 2, py + ph / 2); ctx.scale(sc, sc);
        roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 17); var gr = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2); gr.addColorStop(0, '#ff9cc2'); gr.addColorStop(1, '#ff5f95'); ctx.fillStyle = gr; ctx.shadowColor = 'rgba(255,80,140,.6)'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = '900 16px ' + Art.FONT_JA; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, 0, 1); ctx.restore();
      }
      if (g.slotErr && g.slots[1].item && g.slots[2].item) { ctx.fillStyle = '#e8566a'; ctx.font = '800 11px ' + Art.FONT_JA; ctx.textAlign = 'right'; ctx.fillText(g.slotErr.code === 'needObj' || g.slotErr.code === 'needComp' ? '△' : '×', b.x + b.w - 8, b.y + 10); }
      ctx.restore();
    }
    function drawFx(ctx) {
      g.fx.forEach(function (p) {
        var k = p.t / p.d;
        if (p.type === 'dot') { ctx.globalAlpha = 1 - k; ctx.fillStyle = Art.rgb(p.col || Art.COL.plain); ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1 - k * .5), 0, 7); ctx.fill(); }
        else if (p.type === 'star') { ctx.globalAlpha = 1 - k; Art.drawStar(ctx, p.x, p.y, p.s * 1.6, '#fff4b0', Art.rgb(p.col || Art.COL.prep)); }
        else if (p.type === 'ring') { ctx.globalAlpha = (1 - k) * .8; ctx.strokeStyle = Art.rgb(p.col || Art.COL.plain); ctx.lineWidth = (p.big ? 6 : 4) * (1 - k) + 1; ctx.beginPath(); ctx.arc(p.x, p.y, 10 + k * (p.big || 50), 0, 7); ctx.stroke(); }
        else if (p.type === 'txt') { ctx.globalAlpha = Math.min(1, (1 - k) * 2); var fs = p.big === 2 ? 40 + U.E.outBack(Math.min(1, k * 5)) * 6 : p.big ? 26 : 15; ctx.font = '900 ' + fs + 'px ' + (p.ja ? Art.FONT_JA : Art.FONT_EN); ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(80,40,120,.85)'; ctx.lineJoin = 'round'; var yy = p.y - k * 40; ctx.strokeText(p.text, p.x, yy); ctx.fillStyle = p.big ? '#ffd23f' : '#fff'; ctx.fillText(p.text, p.x, yy); }
        else if (p.type === 'mark') { ctx.globalAlpha = Math.min(1, (1 - k) * 2.5); var s = 26 + U.E.outBack(Math.min(1, k * 4)) * 8; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = p.tri ? '#f5a524' : '#ef4d63'; ctx.beginPath(); if (p.tri) { ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + s, p.y + s * .7); ctx.lineTo(p.x - s, p.y + s * .7); ctx.closePath(); } else { ctx.moveTo(p.x - s * .7, p.y - s * .7); ctx.lineTo(p.x + s * .7, p.y + s * .7); ctx.moveTo(p.x + s * .7, p.y - s * .7); ctx.lineTo(p.x - s * .7, p.y + s * .7); } ctx.stroke(); }
        else if (p.type === 'time') { ctx.globalAlpha = 1 - k; ctx.font = '900 16px ' + Art.FONT_JA; ctx.textAlign = 'right'; ctx.fillStyle = p.bad ? '#ef4d63' : '#20a86b'; ctx.fillText(p.text, g.L.W - 14, g.L.hudY + 70 + k * 16); }
        ctx.globalAlpha = 1;
      });
    }
    function ring(ctx, x, y, r, col) { ctx.save(); ctx.lineWidth = 3.5; ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.restore(); }
    function badge(ctx, x, y, s, col) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = col || '#6c4bd6'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '900 11px ' + Art.FONT_EN; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y + .5); ctx.restore(); }
    function pill(ctx, x, y, text, a) { ctx.save(); ctx.globalAlpha = a; ctx.font = '700 12px ' + Art.FONT_JA; var w = ctx.measureText(text).width + 16; roundRect(ctx, x - w / 2, y - 10, w, 20, 10); ctx.fillStyle = 'rgba(70,50,110,.82)'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + .5); ctx.restore(); }
    function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    // ---------- 開始 ----------
    // ================= ボブル(パズルボブル型) =================
    // 上の盤面:名詞・動詞・形容詞・副詞だけ。下から撃つのは「つなぎの玉」(冠詞・前置詞・代名詞・助動詞系・be・have)。
    // 玉は当てた相手に合わせて自動で形が変わり、となりの形容詞・副詞も巻き込んで、正しい順のチャンクになる。
    // チャンクは下の役割スロットへ(ぶら下がっていた分は落ちてボーナス)。スロットで文がそろえば「わる!」で押し返す。
    function shotMerge() { return null; } function knock() { } function shotEnd(a) { a.shot = null; } function shotHit() { }
    var B = { cells: {}, par: 0, R: 24, D: 48, RH: 42, top: 0, queue: [], proj: null, aimP: null, shots: 0, falls: [], inv: { pierce: 1, warp: 1, bomb: 1 }, arm: null, nextRow: 20 };
    g.bob = B;
    var LV = opt.level || 0, MAXL = opt.maxLevel || 2;
    function bGeo() { var f = g.L.field; B.D = f.w / 8; B.R = B.D / 2; B.RH = B.D * .87; B.top = f.y + 2; }
    function bCols(r) { return (r + B.par) % 2 ? 7 : 8; }
    function bPos(r, c) { var f = g.L.field; return { x: f.x + B.R + c * B.D + ((r + B.par) % 2 ? B.R : 0), y: B.top + B.R + r * B.RH }; }
    function bKey(r, c) { return r * 16 + c; }
    function bGet(r, c) { return B.cells[bKey(r, c)] || null; }
    function bNb(r, c) {
      var sh = (r + B.par) % 2, out = [[r, c - 1], [r, c + 1]], d = sh ? [0, 1] : [-1, 0];
      [r - 1, r + 1].forEach(function (rr) { d.forEach(function (dc) { out.push([rr, c + dc]); }); });
      return out.filter(function (p) { return p[0] >= 0 && p[1] >= 0 && p[1] < bCols(p[0]); });
    }
    function bNbItems(it) { return bNb(it.gr.r, it.gr.c).map(function (p) { return bGet(p[0], p[1]); }).filter(Boolean); }
    function bFit(it) { if (it.label) it.text = it.label; it.r = B.R - 1; it.fs = Math.min(it.fs, 12); var w = Art.measure(it.text, it.fs), lim = B.D - 7; if (w > lim) it.fs = Math.max(7, it.fs * lim / w); it.face = ''; it.spr = null; }
    function bPlace(it, r, c) { var p = bPos(r, c); it.vx = it.vy = 0; it.gr = { r: r, c: c }; it.state = 'idle'; it.sc = 1; B.cells[bKey(r, c)] = it; if (g.items.indexOf(it) < 0) { it.x = p.x; it.y = p.y; g.items.push(it); } bFit(it); }
    function bRemove(it) { if (it.gr) { delete B.cells[bKey(it.gr.r, it.gr.c)]; it.gr = null; } }
    function bAll() { var o = []; for (var k in B.cells) o.push(B.cells[k]); return o; }
    function bRows() { return Math.max(6, Math.floor((bDanger() - B.top - B.D) / B.RH) + 1); }
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    // ---- 盤面の単語(名詞・動詞・形容詞・副詞) ----
    var POOL = null;
    function pool() {
      if (POOL) return POOL; var D = app.dict, lvOk = function (e) { return (e.lv || 1) <= MAXL; };
      POOL = {
        n: D.all('noun').filter(function (e) { return lvOk(e) && (e.cat !== 'time' || e.prep); }),
        v: D.all('verb').filter(function (e) { return lvOk(e) && !e.tail && e.fr !== 'cl' && !e.cv && !e.link; }),
        adj: D.all('adj').filter(lvOk),
        adv: D.all('adv').filter(function (e) { return e.k === 'manner'; })
      };
      return POOL;
    }
    // 盤面の品詞はかたよらないように、足りない品詞から出す(名詞4:動詞2.5:形容詞2:副詞1.5)
    function bContent() {
      var P = pool(), cnt = { n: 0, v: 0, adj: 0, adv: 0 }, tot = 0, TG = { n: .4, v: .25, adj: .2, adv: .15 };
      bAll().concat(B.newbies || []).forEach(function (it) { if (it.word && cnt[it.word.k] != null) { cnt[it.word.k]++; tot++; } });
      var ks = ['n', 'v', 'adj', 'adv'], w = ks.map(function (k) { return Math.max(.15, TG[k] * (tot + 4) - cnt[k]); }), sum = w.reduce(function (a, b) { return a + b; }, 0), x = Math.random() * sum, kk = 'n';
      for (var i = 0; i < ks.length; i++) { x -= w[i]; if (x <= 0) { kk = ks[i]; break; } }
      var r = kk === 'n' ? 0 : kk === 'v' ? .5 : kk === 'adj' ? .8 : .95;
      if (r < .4) { var pn = Math.random() < .4 ? P.n.filter(function (e) { return e.prep; }) : P.n, n = pick(pn.length ? pn : P.n), pl = (n.c === 'c') && Math.random() < .2; return { k: 'n', e: n, pl: pl }; }
      if (r < .66) { var v = pick(P.v), f = 'base'; if (LV >= 1) { var q = Math.random(); f = q < .5 ? 'base' : q < .75 ? 'ing' : 'pp'; if (f === 'pp' && v.fr === 'intr' && Math.random() < .5) f = 'base'; } return { k: 'v', e: v, f: f }; }
      if (r < .86) return { k: 'adj', e: pick(P.adj) };
      return { k: 'adv', e: pick(P.adv) };
    }
    function bNew(sp) { var it = sp.chunk ? newItem('chunk', sp.chunk, 0, 0) : newItem('word', sp, 0, 0); it.state = 'idle'; it.sc = 1; return it; }
    // ---- つなぎの玉 ----
    var AUX = [['modal', 'can'], ['modal', 'will'], ['modal', 'must'], ['modal', 'should'], ['modal', 'may'], ['sm', 'want to'], ['sm', 'have to'], ['sm', 'need to'], ['sm', 'be going to']];
    var PRONS = ['i', 'you', 'he', 'she', 'we', 'they'];
    // 発射台の上のボタンで、撃つ玉を自分で選ぶ
    var PAL = [['art', '冠詞', [null]], ['prep', '前置詞', ['in', 'at', 'on', 'to', 'with', 'for']], ['pron', '代名詞', ['i', 'you', 'he', 'she', 'we', 'they']], ['modal', '助動詞', ['can', 'will', 'must', 'should', 'may']], ['sm', 'want to等', ['want to', 'have to', 'need to', 'be going to']], ['be', 'be', [null]], ['have', 'have', [null]]];
    B.sel = { cat: 'art', v: null }; B.last = {}; B.open = null;
    function makeBall(sel) {
      var sp, label = null, kind = sel.cat;
      if (kind === 'art') { sp = { k: 'det', v: 'a' }; label = 'a/the'; }
      else if (kind === 'prep') sp = { k: 'prep', v: sel.v || 'in' };
      else if (kind === 'pron') sp = { k: 'pr', v: sel.v || 'i' };
      else if (kind === 'modal' || kind === 'sm') { sp = { k: kind, v: sel.v || (kind === 'modal' ? 'can' : 'want to'), t: 'pres' }; kind = 'aux'; }
      else if (kind === 'be') sp = { k: 'be', v: 'pres' };
      else sp = { k: 'hv', v: 'pres' };
      var it = bNew(sp); it.ball = kind; it.label = label; it.col = []; bFit(it); return it;
    }
    // 前置詞が名詞に合うか(場所・時の名詞は辞書の前置詞。場所は to も可。人・動物は with/for/to、物は with/for)
    function prepFits(p, e) { if (e.prep) return p === e.prep || (p === 'to' && e.cat === 'place'); if (e.cat === 'person' || e.cat === 'animal') return /^(with|for|to)$/.test(p); return /^(with|for)$/.test(p); }
    function prepHint(e) { return e.prep ? e.prep + (e.cat === 'place' ? ' / to' : '') : (e.cat === 'person' || e.cat === 'animal') ? 'with / for / to' : 'with / for'; }
    function nounOK(it) { return it && it.kind === 'word' && it.word.k === 'n'; }
    function verbOK(it, kind) {
      if (!it || it.kind !== 'word' || it.word.k !== 'v') return false; var f = it.word.f || 'base', v = it.word.e;
      if (LV === 0) return kind !== 'be' || v.fr !== 'cl';
      if (kind === 'aux') return f === 'base';
      if (kind === 'be') return f === 'ing' || (f === 'pp' && v.fr !== 'intr');
      if (kind === 'have') return f === 'pp';
      return false;
    }
    function targetOK(ball, t) { return ball === 'art' || ball === 'prep' || ball === 'pron' ? nounOK(t) : verbOK(t, ball); }
    // 玉 + 相手(+となりの形容詞・副詞)から、正しい順のチャンクを作る。できなければ null
    function cs(ws) { var st = G.chainState(ws, cfg); return st.complete && !st.err ? st.chunk : null; }
    function buildFor(ball, t, mods) {
      var res = null;
      if (ball.ball === 'art' || ball.ball === 'pron' || ball.ball === 'prep') {
        var n = t.word, adjs = n.e.cat === 'time' ? [] : mods.filter(function (m) { return m.word.k === 'adj'; }).slice(0, 2), sets = [adjs, adjs.slice(0, 1)];
        var heads = ball.ball === 'art' ? [[{ k: 'det', v: 'a' }], [{ k: 'det', v: 'the' }]]
          : ball.ball === 'pron' ? [[{ k: 'pr', v: ball.word.v }]]
          : [[], [{ k: 'det', v: 'the' }], [{ k: 'det', v: 'a' }]].map(function (d) { return [{ k: 'prep', v: ball.word.v }].concat(d); });
        for (var i = 0; i < sets.length && !res; i++) for (var h = 0; h < heads.length && !res; h++) {
          var ws = heads[h].concat(sets[i].map(function (m) { return m.word; }), [n]), c = cs(ws); if (c) res = { chunk: c, used: sets[i] };
        }
      } else {
        var v = JSON.parse(JSON.stringify({ k: 'v', f: t.word.f })); v.e = t.word.e;
        if (LV === 0) v.f = ball.ball === 'be' ? 'ing' : ball.ball === 'have' ? 'pp' : 'base';
        var advs = mods.filter(function (m) { return m.word.k === 'adv'; }).slice(0, 2), sets2 = [advs, advs.slice(0, 1)];
        for (var j = 0; j < sets2.length && !res; j++) { var c2 = cs([ball.word, v].concat(sets2[j].map(function (m) { return m.word; }))); if (c2) res = { chunk: c2, used: sets2[j] }; }
      }
      return res;
    }
    function bFrontier() { return bAll().filter(function (it) { return bNb(it.gr.r, it.gr.c).some(function (p) { return !bGet(p[0], p[1]); }); }); }
    function bFillQueue() { while (B.queue.length < 1) B.queue.push(makeBall(B.sel)); }
    g.bobSelect = function (c, v) { bSelect(c, v); };
    function bSelect(cat, v) { // パレットで選ぶ:いまの弾を置きかえる(スロットから乗せたチャンクは元へ戻す)
      B.sel = { cat: cat, v: v }; B.last[cat] = v; var cur = B.queue[0];
      if (cur && cur.ball === 'chunk') { var L = bLauncher(); toSlot(cur.chunk, L.x, L.y, cur.home); slotsChanged(); }
      B.queue = [makeBall(B.sel)]; app.audio.sfx('cycle');
    }
    // ---- 地形・おじゃま・天井 ----
    function bSlots(maxR) { var o = []; for (var r = 0; r < (maxR || 14); r++) for (var c = 0; c < bCols(r); c++) { if (bGet(r, c)) continue; if (r === 0 || bNb(r, c).some(function (p) { return bGet(p[0], p[1]); })) o.push([r, c]); } return o; }
    function bTerrain() { // 天井からぶら下がる、つららのような地形(上から4割まで)
      var lim = Math.max(3, Math.round(bRows() * .4));
      for (var c = 0; c < bCols(0); c++) if (Math.random() < .8) bPlace(bNew(bContent()), 0, c);
      for (var r = 1; r < lim; r++) for (var c2 = 0; c2 < bCols(r); c2++) {
        var up = bNb(r, c2).filter(function (p) { return p[0] === r - 1 && bGet(p[0], p[1]); }).length;
        if (up && Math.random() < .5 + up * .15 - r * .06) bPlace(bNew(bContent()), r, c2);
      }
      for (var t = 0; t < 40 && bAll().length < 20; t++) { var sl = bSlots(lim); if (!sl.length) break; var pk = pick(sl); bPlace(bNew(bContent()), pk[0], pk[1]); } // 少なすぎるときは足す
    }
    function bGarbage(n) { // おじゃまが上から降ってきて、地形のどこかにくっつく(場所はばらす。終わりの線の3段手前まで)
      var lim = bRows() - 3;
      for (var i = 0; i < n; i++) { var sl = bSlots(lim); if (!sl.length) break; var pk = pick(sl), it = bNew(bContent()), p = bPos(pk[0], pk[1]); it.x = p.x; it.y = g.L.field.y - 30 - i * 30; it.garb = 1; bPlace(it, pk[0], pk[1]); }
      app.audio.sfx('tick');
    }
    function bPushRow() { // 天井が1段下がる
      var old = B.cells; B.cells = {}; B.par ^= 1;
      for (var k in old) { var it = old[k]; it.gr.r++; B.cells[bKey(it.gr.r, it.gr.c)] = it; }
      for (var c = 0; c < bCols(0); c++) if (Math.random() < .75) { var n = bNew(bContent()), p = bPos(0, c); n.x = p.x; n.y = p.y - B.RH; bPlace(n, 0, c); }
      app.audio.sfx('warn'); g.fx.push({ type: 'txt', x: g.L.W / 2, y: g.L.field.y + 40, text: '天井が下がった!', t: 0, d: 1, ja: 1 });
    }
    var ITEM_JA = { pierce: '貫通', warp: 'ワープ', bomb: 'ボム' };
    function bPushBack() { // 文を割ったごほうび:いちばん下の段を消す+アイテム
      var all = bAll(); if (all.length) { var mr = Math.max.apply(null, all.map(function (i) { return i.gr.r; })); all.filter(function (i) { return i.gr.r === mr; }).forEach(function (i) { bRemove(i); i.state = 'pop'; i.popT = -.1; }); }
      g.fx.push({ type: 'txt', x: g.L.W / 2, y: g.L.field.y + 70, text: 'おしかえした!', t: 0, d: 1.2, ja: 1 }); bDrop();
      var k = pick(['pierce', 'warp', 'bomb']); B.inv[k]++; g.fx.push({ type: 'txt', x: 70, y: g.L.lane.y - 10, text: ITEM_JA[k] + ' +1', t: 0, d: 1.4, ja: 1 });
    }
    function bInit() { bGeo(); B.cells = {}; B.par = 0; bTerrain(); bAll().forEach(function (it, i) { it.sc = 0; it.state = 'grow'; it.scT = -i * .012; }); bFillQueue(); }
    function bLauncher() { var lane = g.L.lane; return { x: lane.x + lane.w / 2, y: lane.y + lane.h * .7 }; }
    function bItemPos(i) { var lane = g.L.lane; return { x: 28 + i * 40, y: lane.y + lane.h * .7, r: 17 }; }
    function palRect(i) { var lane = g.L.lane, w = (lane.w - 12) / PAL.length; return { x: lane.x + 6 + i * w + 2, y: lane.y + 26, w: w - 4, h: 28 }; }
    function optRect(j, n) { var lane = g.L.lane, w = Math.min(64, (lane.w - 12) / n); return { x: lane.x + (lane.w - w * n) / 2 + j * w + 2, y: lane.y - 30, w: w - 4, h: 28 }; }
    function inR(r, x, y) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
    function bDanger() { return g.L.lane.y - 4; }
    function bDir(x, y) { var L = bLauncher(), dx = x - L.x, dy = y - L.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len; if (uy > -.18) { uy = -.18; ux = (ux >= 0 ? 1 : -1) * Math.sqrt(1 - uy * uy); } return { ux: ux, uy: uy }; }
    function bAfterShot() {
      B.shots++;
      if (B.shots % 3 === 0) bGarbage(Math.min(6, 2 + Math.floor(B.shots / 25)));
      if (B.shots >= B.nextRow) { bPushRow(); B.nextRow = B.shots + Math.max(10, 16 - Math.floor(B.shots / 40) * 2); }
      if (bAll().length < 10) bGarbage(6);
      bCheckOver();
    }
    function bFire(dir, x, y) {
      if (B.proj) return;
      var L = bLauncher(), arm = B.arm; B.arm = null;
      if (arm === 'pierce' || arm === 'bomb') { B.inv[arm]--; B.proj = { special: arm, x: L.x, y: L.y, vx: dir.ux * 1250, vy: dir.uy * 1250 }; app.audio.sfx('link', 4); return; }
      if (!B.queue.length) return;
      var it = B.queue.shift(); bFillQueue(); it.col = it.col || [];
      if (arm === 'warp') { B.inv.warp--; bWarp(it, x, y); return; }
      it.x = L.x; it.y = L.y; it.sc = 1; it.state = 'idle'; g.items.push(it);
      B.proj = { it: it, vx: dir.ux * 1150, vy: dir.uy * 1150 }; app.audio.sfx('link', 3); emit('shot', { item: it });
    }
    function bWarp(it, x, y) { // ワープ:指の近くの本命へ直接(手前は無視)
      var kind = ballKind(it), best = null, bd = 1e9; bAll().forEach(function (o) { if (!isTarget(kind, o, it)) return; var d = Math.hypot(o.x - x, o.y - y); if (d < bd) { bd = d; best = o; } });
      it.x = best ? best.x : x; it.y = best ? best.y : y; burst(it.x, it.y, Art.COL.magic, 14); app.audio.sfx('extend'); g.items.push(it); bEnd(it, best, null);
    }
    // ---- 飛んでいる玉:飾り(形容詞/副詞)は拾って突き抜け、本命に当たったら止まってチャンクになる ----
    function ballKind(ball) { if (ball.ball !== 'chunk') return ball.ball; var t = ball.chunk.t; return t === 'NP' ? 'np' : t === 'PP' ? 'pp' : t === 'VP' ? 'vp' : 'other'; }
    function modOf(kind) { return /^(art|pron|prep|np|pp)$/.test(kind) ? 'adj' : /^(aux|be|have|vp)$/.test(kind) ? 'adv' : null; }
    function verbAlone(t) { if (!t || t.kind !== 'word' || t.word.k !== 'v') return null; var v = JSON.parse(JSON.stringify({ k: 'v', f: LV === 0 ? 'base' : t.word.f })); v.e = t.word.e; return cs([v]); }
    function isTarget(kind, t, ball) {
      if (!t || t.kind !== 'word') return false;
      if (kind === 'prep') return t.word.k === 'n' && (!ball || prepFits(ball.word.v, t.word.e));
      if (kind === 'pron') return t.word.k === 'n' && t.word.e.cat !== 'time' && !/^[A-Z]/.test(t.word.e.w); // 時の名詞・固有名詞に my などは付けない
      if (kind === 'art' || kind === 'vp') return t.word.k === 'n';
      if (kind === 'aux' || kind === 'have') return verbOK(t, kind);
      if (kind === 'be') return verbOK(t, 'be') || t.word.k === 'adj';
      if (kind === 'np' || kind === 'pp') return !!verbAlone(t);
      return false;
    }
    function targetOK(kind, t, ball) { return isTarget(kind, t, ball); }
    function growChunk(ch, cols) { // 拾った飾りをチャンクに入れる(名詞の前に形容詞、動詞のうしろに副詞)
      if (!cols.length) return ch; var ws = ch.words.slice();
      if (ch.t === 'VP') { var nv = ws.filter(function (w) { return w.k === 'adv'; }).length; ws = ws.concat(cols.map(function (c) { return c.word; }).slice(0, Math.max(0, 2 - nv))); } // 副詞も2つまで
      else { var ni = -1, na = ws.filter(function (w) { return w.k === 'adj'; }).length; ws.forEach(function (w, i) { if (w.k === 'n') ni = i; }); if (ni < 0) return ch; var add = cols.map(function (c) { return c.word; }).slice(0, Math.max(0, 2 - na)); if (!add.length) return ch; ws = ws.slice(0, ni).concat(add, ws.slice(ni)); } // 形容詞は合わせて2つまで
      return cs(ws) || ch;
    }
    function toSlot(ch, x, y, role) { // チャンクを下の役割スロットへ(埋まっていれば押し出す)
      var sl = (role && g.slots.filter(function (z) { return z.role === role && accepts(z.role, ch) && !z.item; })[0]) || (role && g.slots.filter(function (z) { return z.role === role && accepts(z.role, ch); })[0]) || freeSlotFor(ch) || g.slots.filter(function (z) { return accepts(z.role, ch); })[0];
      if (!sl) return; if (sl.item) { var old = sl.item; sl.item = null; old.slot = null; burst(sl.rect.x + sl.rect.w / 2, sl.rect.y + sl.rect.h / 2, [200, 190, 230], 8); }
      var ci = newItem('chunk', ch, x, y); ci.sc = 1; ci.state = 'idle'; placeInSlot(ci, sl);
    }
    function popBubble(o, pts) { bRemove(o); var i = g.items.indexOf(o); if (i >= 0) g.items.splice(i, 1); burst(o.x, o.y, Art.COL[wordCol(o.word)] || Art.COL.noun, 8); if (pts) addScore(Math.round(pts * mult()), o.x, o.y - 20); }
    function relabel(ball) { // 飛んでいる玉の表示:拾った飾りも見せる
      var base = ball.ball === 'chunk' ? G.chunkText(ball.chunk, cfg) : (ball.label || ball.text);
      ball.label = ball.col.length ? base + ' +' + ball.col.map(function (c) { return c.text; }).join(' ') : (ball.ball === 'chunk' ? null : ball.label); bFit(ball);
    }
    function bStep(dt) {
      var P = B.proj; if (!P) return; var f = g.L.field, it = P.it || P, n = Math.ceil(Math.hypot(P.vx, P.vy) * dt / 5);
      for (var i = 0; i < n; i++) {
        it.x += P.vx * dt / n; it.y += P.vy * dt / n;
        if (it.x < f.x + B.R) { it.x = f.x + B.R; P.vx = Math.abs(P.vx); app.audio.sfx('tap', 2); }
        if (it.x > f.x + f.w - B.R) { it.x = f.x + f.w - B.R; P.vx = -Math.abs(P.vx); app.audio.sfx('tap', 2); }
        var all = bAll(), touch = null; for (var j = 0; j < all.length; j++) if (Math.hypot(all[j].x - it.x, all[j].y - it.y) < B.D * .86) { touch = all[j]; break; }
        if (P.special === 'pierce') {
          if (touch) popBubble(touch, 5);
          if (it.y < B.top - B.R) { B.proj = null; bDrop(); bAfterShot(); return; }
          continue;
        }
        if (P.special === 'bomb') { if (touch || it.y <= B.top + B.R) { B.proj = null; bBomb(it.x, it.y); bAfterShot(); return; } continue; }
        if (it.y <= B.top + B.R) { bEnd(P.it, null); return; }
        if (!touch) continue;
        var kind = ballKind(P.it), mod = modOf(kind);
        if (touch.kind === 'word' && touch.word.k === mod && P.it.col.length < 2 && !isTarget(kind, touch, P.it)) {
          P.it.col.push(touch); popBubble(touch, 5); app.audio.sfx('link', P.it.col.length); relabel(P.it); continue; // 拾って突き抜ける
        }
        bEnd(P.it, isTarget(kind, touch, P.it) ? touch : null, touch); return;
      }
    }
    function bEnd(ball, t, hitWrong) {
      B.proj = null; var kind = ballKind(ball), x = ball.x, y = ball.y, gi = g.items.indexOf(ball); if (gi >= 0) g.items.splice(gi, 1);
      var made = []; // [chunk, role]
      if (t) {
        if (kind === 'np' || kind === 'pp') { var vp = verbAlone(t); if (vp) { made.push([growChunk(ball.chunk, ball.col), kind === 'np' ? 'S' : 'P'], [vp, 'V']); } }
        else if (kind === 'vp') { var np = null; [[{ k: 'det', v: 'a' }], [{ k: 'det', v: 'the' }], []].some(function (h) { np = cs(h.concat([t.word])); return !!np; }); if (np) made.push([growChunk(ball.chunk, ball.col), 'V'], [np, 'O']); }
        else if (kind === 'be' && t.word.k === 'adj') { var bv = cs([{ k: 'be', v: 'pres' }].concat(ball.col.map(function (c) { return c.word; }))) || cs([{ k: 'be', v: 'pres' }]), ap = cs([t.word]); if (bv && ap) made.push([bv, 'V'], [ap, 'O']); }
        else { var r = buildFor(ball, t, ball.col); if (r && kind === 'art' && !r.chunk.words.some(function (w) { return w.k === 'det'; })) r = null; if (r) made.push([r.chunk, null]); else hitWrong = t; }
      }
      if (made.length) {
        var jk = bNbItems(t).filter(function (o) { return o.junk; }); jk.forEach(function (o) { popBubble(o, 20); }); if (jk.length) g.fx.push({ type: 'txt', x: t.x, y: t.y + 24, text: 'じゃま玉も消えた!', t: 0, d: 1, ja: 1 });
        popBubble(t, 0); var words = 0, txt = [];
        made.forEach(function (m) { toSlot(m[0], x, y, m[1]); words += (m[0].words || []).length; txt.push(G.chunkText(m[0], cfg)); });
        g.stats.chunks++; addCombo(1); addScore(Math.round(10 * words * words * mult()), x, y - 30);
        var say = txt.join(' '); app.audio.sfx('chunk', Math.min(6, words)); speak(say); burst(x, y, Art.COL[chunkCol(made[0][0])], 14 + words * 3);
        g.fx.push({ type: 'txt', x: g.L.W / 2, y: y - 34, text: say, t: 0, d: 1.3 }); slotsChanged(); emit('chunk', { chunk: made[0][0], n: words });
      } else if (ball.ball === 'chunk') { // スロットのチャンク:育った分を持って元へ戻る
        var gc = growChunk(ball.chunk, ball.col); toSlot(gc, x, y, ball.home); slotsChanged();
        if (ball.col.length) { speak(G.chunkText(gc, cfg)); addScore(Math.round(10 * gc.words.length * mult()), x, y); } else { app.audio.sfx('reject'); g.fx.push({ type: 'txt', x: x, y: y - 20, text: 'もどった', t: 0, d: .8, ja: 1 }); }
      } else { // ミス:外した玉は、その場にくっついて「じゃま玉」になる(正しい答えを小さく出す)
        var best = null, bd = 1e9; bSlots().forEach(function (p) { var q = bPos(p[0], p[1]), d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = p; } });
        app.audio.sfx('reject'); breakCombo();
        var hint = missHint(kind, hitWrong, ball);
        if (best) { ball.x = x; ball.y = y; ball.junk = 1; ball.col = []; bPlace(ball, best[0], best[1]); squash(ball, -8); }
        g.fx.push({ type: 'txt', x: Math.min(g.L.W - 90, Math.max(90, x)), y: y + 34, text: hint, t: 0, d: 2.2, ja: 1 });
      }
      bDrop(); bAfterShot();
    }
    function missHint(kind, t, ball) {
      if (!t || t.kind !== 'word') return 'ミス:あたる相手がいない';
      var k = t.word.k, w = t.text;
      if (kind === 'prep' && k === 'n') return w + ' には ' + prepHint(t.word.e);
      if ((kind === 'art' || kind === 'pron') && k === 'n') return w + ' には ' + (kind === 'art' ? '冠詞' : 'my / his など') + 'はつけない';
      if ((kind === 'art' || kind === 'pron' || kind === 'prep') && k !== 'n') return 'この玉は名詞に当てよう';
      if (kind === 'aux' || kind === 'be' || kind === 'have') {
        if (k !== 'v') return kind === 'be' ? 'be は -ing形の動詞か形容詞に' : 'この玉は動詞に当てよう';
        var f = t.word.f || 'base'; return f === 'ing' ? w + ' には be' : f === 'pp' ? w + ' には have(be なら受け身)' : w + ' には can / want to など';
      }
      return 'ミス';
    }
    function bBomb(x, y) {
      var n = 0; bAll().forEach(function (o) { if (Math.hypot(o.x - x, o.y - y) < B.D * 2.1) { bRemove(o); o.state = 'pop'; o.popT = -Math.hypot(o.x - x, o.y - y) / 900; n++; } });
      g.fx.push({ type: 'ring', x: x, y: y, t: 0, d: .5, col: Art.COL.magic, big: B.D * 2.2 }); app.audio.sfx('sentence', 2); addScore(Math.round(8 * n * mult()), x, y); bDrop();
    }
    function bDrop() { // 天井とつながっていないバブルは落ちる(落とした数の2乗でボーナス)
      bAll().forEach(function (it) { if (it.state === 'pop') bRemove(it); });
      var ok = {}, st = [];
      for (var c = 0; c < bCols(0); c++) if (bGet(0, c)) { ok[bKey(0, c)] = 1; st.push([0, c]); }
      while (st.length) { var p = st.pop(); bNb(p[0], p[1]).forEach(function (q) { var k = bKey(q[0], q[1]); if (!ok[k] && B.cells[k]) { ok[k] = 1; st.push(q); } }); }
      var n = 0; bAll().forEach(function (it) { var k = bKey(it.gr.r, it.gr.c); if (!ok[k]) { bRemove(it); it.state = 'fall'; it.vy = -60 - Math.random() * 100; it.vx = (Math.random() - .5) * 100; B.falls.push(it); n++; } });
      if (n) { var pts = Math.round(20 * n * n * mult()); addScore(pts, g.L.W / 2, g.L.field.y + g.L.field.h * .5, true); g.fx.push({ type: 'txt', x: g.L.W / 2, y: g.L.field.y + g.L.field.h * .45, text: n + 'こ おとした!', t: 0, d: 1.2, ja: 1 }); app.audio.sfx('extend'); }
    }
    function bCheckOver() { var dy = bDanger(); if (bAll().some(function (it) { return bPos(it.gr.r, it.gr.c).y + B.R > dy; })) finish('あふれた!'); }
    function bUpdate(dt) {
      bStep(dt);
      bAll().forEach(function (it) { if (it.state === 'pop') { bRemove(it); return; } var p = bPos(it.gr.r, it.gr.c), k = it.garb ? Math.min(1, dt * 7) : Math.min(1, dt * 12); it.x += (p.x - it.x) * k; it.y += (p.y - it.y) * k; if (Math.abs(p.y - it.y) < 1) it.garb = 0; });
      B.falls = B.falls.filter(function (it) { it.vy += 1400 * dt; it.x += it.vx * dt; it.y += it.vy * dt; if (it.y > g.L.H + 60) { var i = g.items.indexOf(it); if (i >= 0) g.items.splice(i, 1); return false; } return true; });
    }
    function drawBob(ctx, t) {
      if (!g.L) return;
      var L = bLauncher(), f = g.L.field, dy = bDanger();
      ctx.save(); ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(239,77,99,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x, dy); ctx.lineTo(f.x + f.w, dy); ctx.stroke(); ctx.setLineDash([]);
      bAll().forEach(function (it) { if (it.junk) { ctx.beginPath(); ctx.arc(it.x, it.y, B.R - 1, 0, 7); ctx.fillStyle = 'rgba(80,70,100,.35)'; ctx.fill(); } });
      if (B.aimP && !B.proj && !B.aimP.flick) {
        ctx.fillStyle = B.arm ? 'rgba(255,95,143,.95)' : 'rgba(255,255,255,.95)';
        if (B.arm === 'warp') { ctx.beginPath(); ctx.arc(B.aimP.x, B.aimP.y, 14, 0, 7); ctx.strokeStyle = '#ff5f8f'; ctx.lineWidth = 3; ctx.stroke(); }
        else { var d = bDir(B.aimP.x, B.aimP.y), x = L.x, y = L.y, ux = d.ux, uy = d.uy, n = 0; while (y > B.top + B.R && n < 400) { x += ux * 6; y += uy * 6; n++; if (x < f.x + B.R || x > f.x + f.w - B.R) ux = -ux; if (n % 3 === 0) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); } } }
      }
      ctx.beginPath(); ctx.arc(L.x, L.y + 3, B.R + 9, 0, 7); ctx.fillStyle = B.arm ? 'rgba(255,95,143,.25)' : 'rgba(106,76,240,.16)'; ctx.fill();
      ['pierce', 'warp', 'bomb'].forEach(function (k, i) {
        var p = bItemPos(i), on = B.arm === k, cnt = B.inv[k];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fillStyle = on ? '#ff5f8f' : cnt ? '#6a4cf0' : 'rgba(150,140,180,.5)'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ITEM_JA[k], p.x, p.y);
        ctx.beginPath(); ctx.arc(p.x + 13, p.y - 13, 8, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.fillStyle = '#ff5f8f'; ctx.font = '900 10px sans-serif'; ctx.fillText(cnt, p.x + 13, p.y - 12);
      });
      var nr = B.nextRow - B.shots, ng = 3 - (B.shots % 3); ctx.fillStyle = 'rgba(90,70,140,.85)'; ctx.font = '800 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('おじゃま あと' + ng + '発 ・ 天井 あと' + nr + '発', L.x, g.L.lane.y + 12);
      ctx.restore();
      if (B.proj && B.proj.special) { ctx.save(); ctx.beginPath(); ctx.arc(B.proj.x, B.proj.y, B.R - 2, 0, 7); ctx.fillStyle = B.proj.special === 'bomb' ? '#3a2c4a' : '#ff5f8f'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ITEM_JA[B.proj.special], B.proj.x, B.proj.y); ctx.restore(); }
      var cur = B.queue[0];
      if (cur && !(B.proj && B.proj.it)) { if (B.arm === 'pierce' || B.arm === 'bomb') { ctx.save(); ctx.beginPath(); ctx.arc(L.x, L.y, B.R - 2, 0, 7); ctx.fillStyle = B.arm === 'bomb' ? '#3a2c4a' : '#ff5f8f'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ITEM_JA[B.arm], L.x, L.y); ctx.restore(); } else { cur.x = L.x; cur.y = L.y; drawItem(ctx, cur, 1, t); } }
      // パレット
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      PAL.forEach(function (p, i) { var r = palRect(i), on = B.sel.cat === p[0]; roundRect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fillStyle = on ? '#6a4cf0' : 'rgba(255,255,255,.88)'; ctx.fill(); ctx.fillStyle = on ? '#fff' : '#4a3a6a'; ctx.font = '800 ' + (p[1].length > 4 ? 9 : 11) + 'px sans-serif'; ctx.fillText(p[1], r.x + r.w / 2, r.y + r.h / 2 + 1); });
      if (B.open) { var po = PAL.filter(function (p) { return p[0] === B.open; })[0], opts = po[2]; opts.forEach(function (v, j) { var r = optRect(j, opts.length), on = B.sel.cat === po[0] && B.sel.v === v; roundRect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fillStyle = on ? '#ff5f8f' : '#fff'; ctx.fill(); ctx.strokeStyle = '#6a4cf0'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = on ? '#fff' : '#3a2c4a'; ctx.font = '800 ' + ((v || '').length > 7 ? 9 : 12) + 'px sans-serif'; ctx.fillText(v === 'i' ? 'I' : v, r.x + r.w / 2, r.y + r.h / 2 + 1); }); }
      if (B.aimP && !B.aimP.onL && Math.hypot(B.aimP.x - L.x, B.aimP.y - L.y) < B.R + 30) { ctx.fillStyle = '#ef4d63'; ctx.font = '900 12px sans-serif'; ctx.fillText('はなすと やめる', L.x, L.y - B.R - 16); }
      ctx.restore();
    }
    // スロットのチャンク:タップ=発射台へ/ドラッグ=入れ替え/長押し=捨てる
    function slotRelease(d, x, y) {
      var s0 = g.slots[d.si], it = s0.item; if (!it) return;
      if (d.moved) {
        var ti = slotAt(x, y); if (ti == null || ti === d.si) return; var s1 = g.slots[ti], other = s1.item;
        if (!accepts(s1.role, it.chunk) || (other && !accepts(s0.role, other.chunk))) { toast('その場所には入らない', 'tri'); app.audio.sfx('reject'); return; }
        s0.item = null; it.slot = null; if (other) { s1.item = null; other.slot = null; placeInSlot(other, s0); } placeInSlot(it, s1); slotsChanged(); return;
      }
      if (g.t - d.t >= .5) { s0.item = null; it.slot = null; burst(s0.rect.x + s0.rect.w / 2, s0.rect.y + s0.rect.h / 2, [200, 190, 230], 10); app.audio.sfx('pop'); toast('すてた', 'info'); slotsChanged(); return; }
      s0.item = null; it.slot = null; it.state = 'idle'; it.ball = 'chunk'; it.home = s0.role; it.col = []; it.label = null; bFit(it); B.queue.unshift(it); app.audio.sfx('slot'); slotsChanged();
    }
    if (SHOT) {
      g.down = function (x, y) {
        if (g.state !== 'play' || g.noInput) return; g.idleT = 0;
        if (g.ready && g.pill && x >= g.pill.x && x <= g.pill.x + g.pill.w && y >= g.pill.y && y <= g.pill.y + g.pill.h) { var wc = G.wordCount(g.ready.T); confirmSlots(); addScore(Math.round(15 * wc * wc * mult()), g.L.W / 2, g.L.field.y + g.L.field.h * .4, true); for (var pb = 0; pb < 1 + Math.floor(wc / 5); pb++) bPushBack(); return; }
        for (var k = 0; k < 3; k++) { var ip = bItemPos(k), key = ['pierce', 'warp', 'bomb'][k]; if (Math.hypot(x - ip.x, y - ip.y) < ip.r + 6) { if (B.arm === key) B.arm = null; else if (B.inv[key] > 0) B.arm = key; else toast('文を「わる!」ともらえる', 'tri'); app.audio.sfx('cycle'); return; } }
        var L = bLauncher();
        if (Math.hypot(x - L.x, y - L.y) < B.R + 10) { B.aimP = { x: x, y: y, sx: x, sy: y, onL: true }; return; }
        if (B.open) { var po = PAL.filter(function (p) { return p[0] === B.open; })[0]; for (var j = 0; j < po[2].length; j++) if (inR(optRect(j, po[2].length), x, y)) { bSelect(po[0], po[2][j]); B.open = null; return; } }
        for (var i = 0; i < PAL.length; i++) if (inR(palRect(i), x, y)) { var c = PAL[i]; if (c[2].length === 1) { bSelect(c[0], null); B.open = null; } else if (B.open === c[0]) B.open = null; else { B.open = c[0]; bSelect(c[0], B.last[c[0]] || c[2][0]); } return; }
        B.open = null;
        var si = slotAt(x, y); if (si != null && g.slots[si].item) { B.sd = { si: si, sx: x, sy: y, x: x, y: y, t: g.t, moved: false }; return; }
        if (y < g.L.lane.y) B.aimP = { x: x, y: y, sx: x, sy: y };
      };
      g.move = function (x, y) { if (B.sd) { B.sd.x = x; B.sd.y = y; if (Math.hypot(x - B.sd.sx, y - B.sd.sy) > 12) B.sd.moved = true; return; } if (B.aimP) { B.aimP.x = x; B.aimP.y = y; if (B.aimP.onL) B.aimP.flick = y - B.aimP.sy > 30; } };
      g.up = function (x, y) {
        if (B.sd) { var d0 = B.sd; B.sd = null; if (g.state === 'play') slotRelease(d0, x, y); return; }
        var a = B.aimP; B.aimP = null; if (!a || g.state !== 'play') return;
        if (a.onL) {
          if (y - a.sy > 30) { // 発射台の代名詞を下へ:主語としてスロットへ(1発ぶん)
            var cur = B.queue[0]; if (!cur || cur.ball !== 'pron') { toast('下に入れられるのは代名詞(I / he など)だけ', 'tri'); app.audio.sfx('reject'); return; }
            var tok = G.chainState([cur.word], cfg).chunk, sl = freeSlotFor(tok) || g.slots.filter(function (z) { return accepts(z.role, tok); })[0]; if (!sl) return;
            if (sl.item) { sl.item.slot = null; sl.item = null; }
            B.queue.shift(); bFillQueue(); var LL = bLauncher(), ci = newItem('chunk', tok, LL.x, LL.y); ci.sc = 1; ci.state = 'idle'; placeInSlot(ci, sl); slotsChanged(); bAfterShot(); return;
          }
          if (Math.hypot(x - a.sx, y - a.sy) < 12) { var c0 = B.queue[0]; if (c0) speak(c0.label || c0.text); return; }
        }
        var LC = bLauncher(); if (Math.hypot(x - LC.x, y - LC.y) < B.R + 30) { app.audio.sfx('cycle'); return; } // 発射台の近くで離したら、やめる
        bFire(bDir(x, y), x, y);
      };
      g.cancel = function () { B.aimP = null; B.sd = null; };
    }
    g.start = function () {
      g.layout(); g.chunksSince = 0;
      if (SHOT) { bInit(); app.ui.count('3'); app.audio.sfx('count', 3); return; }
      if (opt.mode === 'tutorial') { g.state = 'play'; return; }
      g.spawnQ = g.target || M.target; g.spawnT = 0;
      app.ui.count('3'); app.audio.sfx('count', 3);
    };
    // 自動テスト・連携用の窓口
    g.debug = { supply: supply, slotsChanged: function () { slotsChanged(); }, hit: function (x, y) { return hitStroke(x, y); }, items: function () { return g.items; }, slots: function () { return g.slots; }, chain: function () { return g.chain; }, cfg: cfg, tokenOf: tokenOf, solve: function () { return Supply.solve(fieldAndSlotItems(), cfg, 5000); } };
    return g;
  }
  return { create: create, ROLE: ROLE, MODE: MODE, accepts: accepts, TUNE: TUNE, sentExt: sentExt, decay: decay, overInterval: overInterval };
})();
