/* ===== art.js:絵(バブルのスプライト・チャンクくん・街並み・アイコン) ===== */
var Art = (function () {
  'use strict';
  var FONT_EN = '"Arial Rounded MT Bold","Avenir Next Rounded","Nunito","Varela Round","Hiragino Maru Gothic ProN","Rounded Mplus 1c",system-ui,-apple-system,"Segoe UI",sans-serif';
  var FONT_JA = '"Hiragino Maru Gothic ProN","BIZ UDPGothic","Rounded Mplus 1c","Kosugi Maru","Yu Gothic UI",Meiryo,system-ui,sans-serif';
  // 品詞色(5色まで)
  var COL = {
    noun: [92, 168, 240], verb: [242, 120, 128], aux: [255, 156, 64], mod: [96, 200, 140], prep: [244, 190, 72], link: [168, 136, 234], plain: [214, 206, 228], magic: [255, 160, 210]
  };
  function colorKeyOfWord(w) {
    switch (w.k) {
      case 'n': case 'pr': case 'det': case 'q': return 'noun';
      case 'v': case 'ti': return 'verb';
      case 'be': case 'hv': case 'modal': case 'not': case 'sm': case 'tp': return 'aux';
      case 'adj': case 'adv': case 'deg': case 'er': return 'mod';
      case 'prep': return 'prep'; case 'conj': case 'idm': return 'link'; case 'magic': return 'magic';
    }
    return 'plain';
  }
  function colorKeyOfChunk(c) {
    switch (c.t) {
      case 'NP': return 'noun'; case 'VP': case 'NF': return 'verb'; case 'PP': return 'prep'; case 'AP': case 'ADV': return 'mod';
      case 'CL': case 'CONJ': case 'FR': return 'link'; case 'ID': return c.ik === 'front' ? 'link' : c.ik === 'other' ? 'mod' : 'prep';
    }
    return 'plain';
  }
  function shapeOfChunk(c) { switch (c.t) { case 'NP': return 'round'; case 'VP': return 'egg'; case 'CL': case 'CONJ': case 'FR': return 'cloud'; case 'ID': return c.ik === 'front' ? 'cloud' : 'drop'; default: return 'drop'; } }
  function rgb(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; }
  function mix(c, d, t) { return [Math.round(c[0] + (d[0] - c[0]) * t), Math.round(c[1] + (d[1] - c[1]) * t), Math.round(c[2] + (d[2] - c[2]) * t)]; }
  var WHITE = [255, 255, 255], INK = [58, 44, 74];

  var measureCtx = null;
  function measure(text, size, weight) {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = (weight || 800) + ' ' + size + 'px ' + FONT_EN;
    return measureCtx.measureText(text).width;
  }
  // 形のパス(中心0,0・半径r)
  function shapePath(ctx, shape, r) {
    ctx.beginPath();
    if (shape === 'egg') { ctx.ellipse(0, 0, r * 1.08, r * .9, 0, 0, Math.PI * 2); }
    else if (shape === 'drop') {
      ctx.moveTo(0, -r * 1.05);
      ctx.bezierCurveTo(r * .55, -r * .7, r * 1.02, -r * .15, r * .98, r * .25);
      ctx.bezierCurveTo(r * .92, r * .78, r * .45, r * 1.0, 0, r * 1.0);
      ctx.bezierCurveTo(-r * .45, r * 1.0, -r * .92, r * .78, -r * .98, r * .25);
      ctx.bezierCurveTo(-r * 1.02, -r * .15, -r * .55, -r * .7, 0, -r * 1.05);
    } else if (shape === 'cloud') {
      var b = [[-.55, .12, .5], [-.18, -.28, .58], [.3, -.22, .55], [.6, .14, .46], [.05, .32, .6], [-.4, .38, .4]];
      b.forEach(function (q) { ctx.moveTo(q[0] * r + q[2] * r, q[1] * r); ctx.arc(q[0] * r, q[1] * r, q[2] * r, 0, Math.PI * 2); });
    } else ctx.arc(0, 0, r, 0, Math.PI * 2);
  }
  var cache = new Map();
  // バブルのスプライト。o: {text, col, r, kind:'word'|'chunk'|'slot', shape, star, blobs:[col...], dpr, small, cyc}
  function sprite(o) {
    var key = [o.text, o.col, o.r, o.kind, o.shape, o.star ? 1 : 0, (o.blobs || []).join('/'), o.dpr, o.fs || 0, o.face || '', o.cyc ? 1 : 0].join('|');
    var s = cache.get(key); if (s) return s;
    if (cache.size > 600) cache.clear();
    var r = o.r, pad = Math.ceil(r * .35 + 6), size = Math.ceil((r * 1.15 + pad) * 2), dpr = o.dpr || 1;
    var cv = document.createElement('canvas'); cv.width = Math.ceil(size * dpr); cv.height = Math.ceil(size * dpr);
    var c = cv.getContext('2d'); c.scale(dpr, dpr); c.translate(size / 2, size / 2);
    var base = COL[o.col] || COL.plain, shape = o.shape || 'round';
    // 影
    c.save(); c.shadowColor = 'rgba(70,40,110,.24)'; c.shadowBlur = Math.max(3, r * .28); c.shadowOffsetY = r * .14; shapePath(c, shape, r); c.fillStyle = rgb(mix(base, WHITE, .5)); c.fill(); c.restore();
    // 本体
    shapePath(c, shape, r);
    var g = c.createRadialGradient(-r * .3, -r * .38, r * .1, 0, 0, r * 1.15);
    if (o.kind === 'word') { g.addColorStop(0, rgb(mix(base, WHITE, .86))); g.addColorStop(.62, rgb(mix(base, WHITE, .5))); g.addColorStop(1, rgb(mix(base, WHITE, .12))); }
    else { g.addColorStop(0, rgb(mix(base, WHITE, .9))); g.addColorStop(.55, rgb(mix(base, WHITE, .62))); g.addColorStop(1, rgb(mix(base, [150, 150, 225], .45))); }
    c.fillStyle = g; c.fill();
    if (o.kind !== 'word') {
      c.save(); shapePath(c, shape, r); c.clip();
      (o.blobs || []).forEach(function (bk, i) {
        var bc = COL[bk] || base, a = (i * 2.4) + .7, rr = r * (.55 + (i % 2) * .15), bx = Math.cos(a) * r * .42, by = Math.sin(a) * r * .38 + r * .1;
        var bg = c.createRadialGradient(bx, by, 0, bx, by, rr); bg.addColorStop(0, rgb(bc, .42)); bg.addColorStop(1, rgb(bc, 0)); c.fillStyle = bg; c.fillRect(-r * 2, -r * 2, r * 4, r * 4);
      });
      var ig = c.createLinearGradient(0, r * .2, 0, r * 1.1); ig.addColorStop(0, 'rgba(120,110,210,0)'); ig.addColorStop(1, 'rgba(120,110,210,.28)'); c.fillStyle = ig; c.fillRect(-r * 2, -r * 2, r * 4, r * 4);
      c.restore();
    }
    // ふち
    shapePath(c, shape, r); c.lineWidth = o.kind === 'word' ? 1.4 : 2.2; c.strokeStyle = rgb(mix(base, INK, .35), o.kind === 'word' ? .45 : .6); c.stroke();
    // ハイライト
    c.save(); c.beginPath(); c.ellipse(-r * .34, -r * .5, r * .34, r * .17, -.5, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill();
    c.beginPath(); c.arc(-r * .62, -r * .2, r * .07, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill();
    c.beginPath(); c.ellipse(r * .42, r * .5, r * .16, r * .07, -.6, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(); c.restore();
    // 顔(代名詞)
    if (o.face) drawFace(c, o.face, r);
    // 文字
    var fs = o.kind === 'slot' ? (o.fs || 12) : (o.fs || 15), tw;
    c.font = '800 ' + fs + 'px ' + FONT_EN;
    var maxW = r * (o.shape === 'cloud' ? 1.7 : 1.68);
    while ((tw = c.measureText(o.text).width) > maxW && fs > 9) { fs -= .5; c.font = '800 ' + fs + 'px ' + FONT_EN; }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    var ty = o.face ? r * .42 : 1;
    c.lineWidth = 3.2; c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineJoin = 'round'; c.strokeText(o.text, 0, ty);
    c.fillStyle = rgb(mix(base, INK, .82)); c.fillText(o.text, 0, ty);
    if (o.cyc) { c.beginPath(); c.arc(r * .62, -r * .62, r * .16 + 1, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.9)'; c.fill(); c.strokeStyle = rgb(mix(base, INK, .5), .7); c.lineWidth = 1.4; c.stroke(); c.beginPath(); c.arc(r * .62, -r * .62, r * .08 + .5, -.3, 4.4); c.stroke(); }
    if (o.star) drawStar(c, r * .62, -r * .78, r * .26 + 2, '#ffcf4a', '#b7841b');
    s = { cv: cv, size: size };
    cache.set(key, s); return s;
  }
  function drawStar(c, x, y, R, fill, line) {
    c.save(); c.translate(x, y); c.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * .48 : R; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 1.5; c.strokeStyle = line; c.stroke(); c.restore();
  }
  // 代名詞の顔(小さな丸い顔。単数=1つ、複数=2つ)
  function drawFace(c, face, r) {
    var faces = face === 'pl' ? [-r * .28, r * .28] : [0], fr = face === 'pl' ? r * .3 : r * .38;
    faces.forEach(function (fx, i) {
      var fy = -r * .2;
      c.beginPath(); c.arc(fx, fy, fr, 0, Math.PI * 2); c.fillStyle = i ? '#ffe2c9' : '#ffeedd'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#7a5545'; c.stroke();
      c.fillStyle = '#3b2a2a'; c.beginPath(); c.ellipse(fx - fr * .33, fy - fr * .05, fr * .1, fr * .15, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(fx + fr * .33, fy - fr * .05, fr * .1, fr * .15, 0, 0, 7); c.fill();
      c.beginPath(); c.arc(fx, fy + fr * .18, fr * .25, .15, Math.PI - .15); c.lineWidth = 1.4; c.strokeStyle = '#a0484f'; c.stroke();
      c.fillStyle = 'rgba(255,140,150,.5)'; c.beginPath(); c.ellipse(fx - fr * .55, fy + fr * .2, fr * .16, fr * .1, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(fx + fr * .55, fy + fr * .2, fr * .16, fr * .1, 0, 0, 7); c.fill();
    });
  }

  // ---------- チャンクくん ----------
  var CK = { line: '#5a3a2e', top: '#fffaf3', bot: '#d7dbf6', leg: '#4b2f27', cheek: 'rgba(255,135,140,.55)', mouth: '#7a2a2e', tongue: '#ff8f97' };
  // o: {segs:体節の数(頭を除く), expr, t, blink, scale, wave, walk}
  function chunkKun(ctx, x, y, o) {
    var s = o.scale || 1, R = 34 * s, t = o.t || 0, n = Math.max(1, o.segs || 2), maxLen = o.maxLen || 9999;
    var segs = [], px = 0, pr = R;
    for (var i = 1; i <= n; i++) { var r = R * Math.max(.5, .86 * Math.pow(.93, i - 1)); px += (pr + r) * .62; segs.push({ x: px, r: r }); pr = r; }
    if (px + pr > maxLen && n > 1) { var k = (maxLen - pr) / px; segs.forEach(function (q) { q.x *= k; }); }
    ctx.save(); ctx.translate(x, y);
    var bob = Math.sin(t * 3) * 1.5 * s;
    // 影
    ctx.fillStyle = 'rgba(60,40,90,.15)'; ctx.beginPath(); ctx.ellipse((segs[segs.length - 1].x) / 2, R * .95, (segs[segs.length - 1].x) / 2 + R * 1.1, R * .16, 0, 0, 7); ctx.fill();
    // しっぽ
    var last = segs[segs.length - 1];
    blob(ctx, last.x + last.r * .95, Math.sin(t * 4 - n * .6) * 1.5 + bob * .5, last.r * .32, last.r * .3, s);
    for (var j = segs.length - 1; j >= 0; j--) {
      var q = segs[j], wy = Math.sin(t * 4 - (j + 1) * .6) * 1.6 * s + bob * .6;
      legs(ctx, q.x, wy + q.r * .82, q.r, t, j + 1, s, o.walk);
      blob(ctx, q.x, wy, q.r * 1.06, q.r * .92, s);
    }
    // 頭
    legs(ctx, 0, bob + R * .8, R * 1.1, t, 0, s, o.walk);
    var wave = o.wave ? Math.sin(t * 9) * .5 : Math.sin(t * 2) * .12;
    ctx.save(); ctx.translate(-R * 1.08, bob - R * .05); ctx.rotate(-.6 + wave); ctx.beginPath(); ctx.ellipse(0, -R * .2, R * .17, R * .26, 0, 0, 7); ctx.fillStyle = CK.leg; ctx.fill(); ctx.restore();
    blob(ctx, 0, bob, R * 1.18, R * .98, s);
    face(ctx, -R * .1, bob, R, o.expr || 'normal', o.blink, t);
    ctx.restore();
    return { head: { x: x, y: y + bob, r: R }, tail: x + last.x + last.r };
  }
  function blob(ctx, x, y, rx, ry, s) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7);
    var g = ctx.createLinearGradient(0, y - ry, 0, y + ry); g.addColorStop(0, CK.top); g.addColorStop(.55, '#fbf6f4'); g.addColorStop(1, CK.bot);
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.6 * s; ctx.strokeStyle = CK.line; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - rx * .35, y - ry * .5, rx * .28, ry * .14, -.3, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
  }
  function legs(ctx, x, y, r, t, i, s, walk) {
    ctx.fillStyle = CK.leg;
    var ph = walk ? Math.sin(t * 10 + i * 1.7) * 2.2 * s : 0;
    ctx.beginPath(); ctx.ellipse(x - r * .45, y + ph, r * .17, r * .13, 0, 0, 7); ctx.fill();
    if (i === 0) { ctx.beginPath(); ctx.ellipse(x + r * .35, y - ph, r * .17, r * .13, 0, 0, 7); ctx.fill(); }
  }
  function face(ctx, fx, fy, R, ex, blinkK, t) {
    var ey = fy - R * .08, dx = R * .3, k = blinkK == null ? 1 : blinkK;
    ctx.lineCap = 'round';
    // ほっぺ
    ctx.fillStyle = CK.cheek; ctx.beginPath(); ctx.ellipse(fx - R * .58, fy + R * .2, R * .17, R * .11, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(fx + R * .58, fy + R * .2, R * .17, R * .11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2b1b1b'; ctx.strokeStyle = '#2b1b1b'; ctx.lineWidth = R * .07;
    var eye = function (x, look) {
      if (ex === 'joy') { ctx.beginPath(); ctx.arc(x, ey + R * .04, R * .1, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); return; }
      if (ex === 'panic') { ctx.beginPath(); ctx.moveTo(x - R * .08, ey - R * .08); ctx.lineTo(x + R * .06, ey); ctx.lineTo(x - R * .08, ey + R * .08); ctx.stroke(); return; }
      var h = (ex === 'surprise' ? R * .13 : R * .12) * k, w = ex === 'surprise' ? R * .1 : R * .075;
      ctx.beginPath(); ctx.ellipse(x + (look || 0), ey, w, Math.max(1, h), 0, 0, 7); ctx.fill();
      if (k > .5) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + (look || 0) - w * .3, ey - h * .4, R * .03, 0, 7); ctx.fill(); ctx.fillStyle = '#2b1b1b'; }
      if (ex === 'sad') { ctx.beginPath(); ctx.moveTo(x - R * .1, ey - R * .2 + (x < fx ? R * .04 : 0)); ctx.lineTo(x + R * .1, ey - R * .2 + (x < fx ? 0 : R * .04)); ctx.lineWidth = R * .045; ctx.stroke(); ctx.lineWidth = R * .07; }
    };
    var look = ex === 'think' ? R * .05 : ex === 'idea' ? 0 : 0;
    if (ex === 'panic') { eye(fx - dx); ctx.save(); ctx.translate(2 * (fx + dx), 0); ctx.scale(-1, 1); eye(fx + dx); ctx.restore(); }
    else { eye(fx - dx, look); eye(fx + dx, look); }
    // 口
    var my = fy + R * .2;
    if (ex === 'surprise') { ctx.beginPath(); ctx.ellipse(fx, my + R * .04, R * .08, R * .11, 0, 0, 7); ctx.fillStyle = CK.mouth; ctx.fill(); }
    else if (ex === 'sad') { ctx.beginPath(); ctx.arc(fx, my + R * .14, R * .1, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = R * .05; ctx.strokeStyle = CK.mouth; ctx.stroke(); }
    else if (ex === 'think') { ctx.beginPath(); ctx.moveTo(fx - R * .07, my + R * .05); ctx.lineTo(fx + R * .08, my + R * .03); ctx.lineWidth = R * .05; ctx.strokeStyle = CK.mouth; ctx.stroke(); }
    else if (ex === 'panic') { ctx.beginPath(); ctx.moveTo(fx - R * .12, my + R * .06); for (var i = 1; i <= 4; i++) ctx.lineTo(fx - R * .12 + i * R * .06, my + R * .06 + (i % 2 ? -R * .04 : 0)); ctx.lineWidth = R * .045; ctx.strokeStyle = CK.mouth; ctx.stroke(); }
    else {
      var big = ex === 'joy' || ex === 'idea' ? 1.25 : 1;
      ctx.beginPath(); ctx.moveTo(fx - R * .13 * big, my); ctx.quadraticCurveTo(fx, my + R * .34 * big, fx + R * .13 * big, my); ctx.closePath(); ctx.fillStyle = CK.mouth; ctx.fill();
      ctx.save(); ctx.clip(); ctx.beginPath(); ctx.ellipse(fx, my + R * .2 * big, R * .1 * big, R * .08, 0, 0, 7); ctx.fillStyle = CK.tongue; ctx.fill(); ctx.restore();
    }
    if (ex === 'panic') { ctx.fillStyle = '#7cc6ff'; ctx.beginPath(); ctx.moveTo(fx + R * .95, fy - R * .5); ctx.quadraticCurveTo(fx + R * 1.08, fy - R * .25, fx + R * .95, fy - R * .2); ctx.quadraticCurveTo(fx + R * .82, fy - R * .25, fx + R * .95, fy - R * .5); ctx.fill(); }
    if (ex === 'idea') { drawStar(ctx, fx + R * .7, fy - R * 1.15 + Math.sin(t * 6) * 2, R * .2, '#ffd447', '#c99a1d'); }
    if (ex === 'think') { ctx.fillStyle = '#6b5a7a'; for (var d = 0; d < 3; d++) { ctx.beginPath(); ctx.arc(fx + R * (.55 + d * .2), fy - R * 1.1, R * (.04 + d * .015), 0, 7); ctx.fill(); } }
  }

  // ---------- 街並みの背景 ----------
  var SKY = [ // [上, 下] 朝・昼・夕・夜
    [[255, 214, 196], [255, 241, 222]], [[150, 205, 250], [226, 242, 255]], [[255, 150, 140], [255, 214, 160]], [[44, 52, 110], [118, 96, 168]]
  ];
  function skyAt(p) { // p:0朝 → 1夜
    var stops = [0, .35, .72, 1], i = 0; while (i < 2 && p > stops[i + 1]) i++;
    var t = U.clamp((p - stops[i]) / (stops[i + 1] - stops[i]), 0, 1);
    return [mix(SKY[i][0], SKY[i + 1][0], t), mix(SKY[i][1], SKY[i + 1][1], t)];
  }
  function City(seed) {
    var r = U.rng(seed || 7), far = [], near = [], clouds = [], stars = [];
    var pal = [[244, 200, 214], [204, 214, 246], [214, 236, 222], [252, 226, 190], [222, 206, 244], [190, 222, 240]];
    var x = -20; while (x < 1400) { var w = 34 + r() * 50; far.push({ x: x, w: w, h: .2 + r() * .26, c: pal[r.int(pal.length)], top: r.int(4) }); x += w + 2 + r() * 8; }
    x = -30; while (x < 1400) { var w2 = 40 + r() * 56; near.push({ x: x, w: w2, h: .1 + r() * .22, c: pal[r.int(pal.length)], top: r.int(5), seed: r.int(1e6) }); x += w2 + 6 + r() * 16; }
    for (var i = 0; i < 5; i++) clouds.push({ x: r() * 1, y: .06 + r() * .3, s: .6 + r() * .8, v: .004 + r() * .006 });
    for (i = 0; i < 70; i++) stars.push({ x: r(), y: r() * .55, s: .6 + r() * 1.2, ph: r() * 6 });
    var buf = null, bufKey = '';
    function render(w, h, p, lit, dpr) {
      var key = [w, h, Math.round(p * 60), Math.round(lit * 30), dpr].join('|');
      if (buf && key === bufKey) return buf;
      bufKey = key; buf = buf || document.createElement('canvas'); buf.width = Math.ceil(w * dpr); buf.height = Math.ceil(h * dpr);
      var c = buf.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      var sk = skyAt(p), g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rgb(sk[0])); g.addColorStop(1, rgb(sk[1])); c.fillStyle = g; c.fillRect(0, 0, w, h);
      // 太陽/月
      var sunY = h * (.18 + p * .5), night = U.clamp((p - .72) / .28, 0, 1);
      c.fillStyle = night > .5 ? 'rgba(255,250,220,.95)' : 'rgba(255,248,220,.9)';
      c.beginPath(); c.arc(w * .78, night > .5 ? h * .14 : sunY, night > .5 ? 18 : 30, 0, 7); c.fill();
      if (night > .5) { c.fillStyle = rgb(sk[0]); c.beginPath(); c.arc(w * .78 + 8, h * .14 - 5, 16, 0, 7); c.fill(); }
      var gy = h * .98, dark = night * .55 + U.clamp((p - .5) / .3, 0, 1) * .15;
      var drawB = function (list, scale, alpha, win) {
        list.forEach(function (b) {
          if (b.x > w + 40) return;
          var bh = b.h * h * scale, by = gy - bh, col = mix(mix(b.c, sk[1], .15), [40, 36, 80], dark);
          c.fillStyle = rgb(col, alpha);
          c.beginPath();
          if (b.top === 1) { c.moveTo(b.x, by); c.lineTo(b.x + b.w / 2, by - b.w * .35); c.lineTo(b.x + b.w, by); }
          else if (b.top === 2) { c.moveTo(b.x, by); c.arc(b.x + b.w / 2, by, b.w / 2, Math.PI, 0); }
          else { var rr = Math.min(10, b.w * .2); c.moveTo(b.x, by + rr); c.quadraticCurveTo(b.x, by, b.x + rr, by); c.lineTo(b.x + b.w - rr, by); c.quadraticCurveTo(b.x + b.w, by, b.x + b.w, by + rr); }
          c.lineTo(b.x + b.w, gy); c.lineTo(b.x, gy); c.closePath(); c.fill();
          if (win) {
            var wr = U.rng(b.seed);
            for (var yy = by + 10; yy < gy - 12; yy += 15) for (var xx = b.x + 8; xx < b.x + b.w - 10; xx += 13) {
              var on = wr() < lit; c.fillStyle = on ? 'rgba(255,214,110,' + (.55 + night * .45) + ')' : 'rgba(255,255,255,' + (.35 - night * .25) + ')';
              c.beginPath(); c.roundRect ? c.roundRect(xx, yy, 7, 9, 2) : c.rect(xx, yy, 7, 9); c.fill();
            }
          }
        });
      };
      drawB(far, 1, .55, false);
      drawB(near, 1, .9, true);
      var hg = c.createLinearGradient(0, gy - 6, 0, h); hg.addColorStop(0, rgb(mix([150, 214, 160], [40, 40, 80], dark))); hg.addColorStop(1, rgb(mix([120, 190, 140], [30, 30, 70], dark)));
      c.fillStyle = hg; c.fillRect(0, gy - 2, w, h - gy + 2);
      return buf;
    }
    return {
      draw: function (ctx, w, h, p, lit, t, dpr) {
        ctx.drawImage(render(w, h, p, lit, dpr), 0, 0, w, h);
        var night = U.clamp((p - .7) / .3, 0, 1);
        if (night > 0) { stars.forEach(function (s) { ctx.fillStyle = 'rgba(255,255,240,' + (night * (.5 + .5 * Math.sin(t * 2 + s.ph))) + ')'; ctx.fillRect(s.x * w, s.y * h, s.s, s.s); }); }
        clouds.forEach(function (cl) {
          var cx = ((cl.x + t * cl.v) % 1.3 - .15) * w, cy = cl.y * h, s = cl.s * 26;
          ctx.fillStyle = 'rgba(255,255,255,' + (.75 - night * .45) + ')';
          ctx.beginPath(); ctx.arc(cx, cy, s, 0, 7); ctx.arc(cx + s * 1.1, cy - s * .35, s * 1.15, 0, 7); ctx.arc(cx + s * 2.2, cy, s * .9, 0, 7); ctx.ellipse(cx + s * 1.1, cy + s * .25, s * 1.9, s * .6, 0, 0, 7); ctx.fill();
        });
      }
    };
  }
  // ---------- DOM用アイコン(SVG) ----------
  var I = function (p, vb) { return '<svg viewBox="' + (vb || '0 0 24 24') + '" aria-hidden="true">' + p + '</svg>'; };
  var ICON = {
    pause: I('<rect x="6" y="5" width="4.2" height="14" rx="1.6"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.6"/>'),
    play: I('<path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.2-6.5a1 1 0 0 0 0-1.7L9.5 4.6A1 1 0 0 0 8 5.5z"/>'),
    speaker: I('<path d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
    gear: I('<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.4 4.6-.1-2.2 2-1.6-2-3.5-2.4.9-1.9-1.1L15.6 3h-4l-.4 2.6-1.9 1.1-2.4-.9-2 3.5 2 1.6v2.2l-2 1.6 2 3.5 2.4-.9 1.9 1.1.4 2.6h4l.4-2.6 1.9-1.1 2.4.9 2-3.5z" fill-rule="evenodd"/>'),
    trophy: I('<path d="M7 3h10v3h3a3 3 0 0 1-3.6 4.2A5 5 0 0 1 13 13.9V17h3v3H8v-3h3v-3.1a5 5 0 0 1-3.4-3.7A3 3 0 0 1 4 6h3zm0 5H6a1 1 0 0 0 1 1zm10 0v1a1 1 0 0 0 1-1z"/>'),
    back: I('<path d="M14.5 5 7.5 12l7 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'),
    home: I('<path d="M3.5 11 12 4l8.5 7v8.5a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>'),
    retry: I('<path d="M5 12a7 7 0 1 0 2.1-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M4 3.5v5h5z"/>'),
    shop: I('<path d="M5 8h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3zM8.5 8V7a3.5 3.5 0 0 1 7 0v1" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>'),
    info: I('<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="10.8" y="10.5" width="2.4" height="7" rx="1.2"/><circle cx="12" cy="7.3" r="1.5"/>'),
    hint: I('<path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.6V17h6v-1.1c0-.6.3-1.2.8-1.6A6.5 6.5 0 0 0 12 2.5zM9.5 19h5v1.2a1.8 1.8 0 0 1-1.8 1.8h-1.4a1.8 1.8 0 0 1-1.8-1.8z"/>'),
    magic: I('<path d="m14.5 3 1.2 3.3L19 7.5l-3.3 1.2-1.2 3.3-1.2-3.3L10 7.5l3.3-1.2zM6.5 11l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9zm7.8 5.2.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>'),
    auto: I('<circle cx="7.5" cy="12" r="4.2"/><circle cx="16.5" cy="12" r="4.2" opacity=".55"/><path d="M10.5 12h3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'),
    lock: I('<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/>'),
    check: I('<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
    close: I('<path d="m6.5 6.5 11 11m0-11-11 11" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>'),
    star: I('<path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>')
  };
  return { FONT_EN: FONT_EN, FONT_JA: FONT_JA, COL: COL, rgb: rgb, mix: mix, colorKeyOfWord: colorKeyOfWord, colorKeyOfChunk: colorKeyOfChunk, shapeOfChunk: shapeOfChunk, sprite: sprite, measure: measure, chunkKun: chunkKun, City: City, skyAt: skyAt, ICON: ICON, drawStar: drawStar, shapePath: shapePath, clearCache: function () { cache.clear(); } };
})();
