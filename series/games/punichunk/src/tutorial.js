import { U } from './util.js';
/* ===== tutorial.js:体験型チュートリアル(実際に1文作って覚える) ===== */
export var Tutorial = (function () {
  'use strict';
  function run(app, g, done) {
    var ui = app.ui, F = g.L.field, step = -1, hand = null, finished = false, tm = [];
    var W = F.w, X = function (k) { return F.x + W * k; }, Y = function (k) { return F.y + F.h * k; };
    var D = app.dict, find = function (pos, w) { return D.all(pos).filter(function (e) { return e.w === w; })[0]; };
    var E = {
      small: find('adj', 'small') || D.getWords({ pos: 'adj', maxLevel: 1 })[0], cat: find('noun', 'cat') || D.getWords({ pos: 'noun', maxLevel: 1 })[0],
      sleep: find('verb', 'sleep') || D.getWords({ pos: 'verb', maxLevel: 1, tag: { fr: ['intr'] } })[0], dog: find('noun', 'dog') || D.getWords({ pos: 'noun', maxLevel: 1 })[0],
      run: find('verb', 'run') || D.getWords({ pos: 'verb', maxLevel: 1, tag: { fr: ['intr'] } })[0]
    };
    var it = {};
    g.calm = true;
    g.guide = { allow: function () { return false; }, draw: drawHand, noHint: true };
    var bottomSay = function () { return app.stage.h - g.L.lane.y + 8; };
    function say(html, next, label) { ui.say(html, { next: next, nextLabel: label, bottom: bottomSay() }); }
    function clearHand() { hand = null; }
    function drawHand(ctx, t) {
      if (!hand) return;
      var p;
      if (hand.tap) { var a = hand.tap(); if (!a) return; p = { x: a.x, y: a.y }; }
      else { var A = hand.from(), B = hand.to(); if (!A || !B) return; var k = (t * .6) % 1, e = U.E.inOut(Math.min(1, k * 1.3)); p = { x: U.lerp(A.x, B.x, e), y: U.lerp(A.y, B.y, e) };
        ctx.save(); ctx.setLineDash([6, 8]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,111,159,.7)'; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.restore(); }
      var pr = (t * 1.6) % 1;
      ctx.save();
      ctx.globalAlpha = 1 - pr; ctx.strokeStyle = '#ff6f9f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, 16 + pr * 26, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.translate(p.x + 20, p.y + 26); ctx.rotate(-.35);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#6a4cf0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-7, -22, 14, 30, 7) : ctx.rect(-7, -22, 14, 30); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-14, 0, 28, 26, 10) : ctx.rect(-14, 0, 28, 26); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    function at(item) { return function () { if (!item) return null; if (item.slot) return { x: item.slot.rect.x + item.slot.rect.w / 2, y: item.slot.rect.y + item.slot.rect.h / 2 }; return g.items.indexOf(item) >= 0 ? item : null; }; }
    function slotPos(i) { return function () { var r = g.slots[i].rect; return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }; }
    function spawn(spec, kx, ky) { var i = g.spawnWord(spec, X(kx), Y(ky), true); i.vx = i.vy = 0; return i; }
    function later(fn, ms) { tm.push(setTimeout(function () { if (!finished) fn(); }, ms)); }
    var handlers = {};
    function onG(name, fn) { handlers[name] = fn; }
    ['chunk', 'sentence', 'fail', 'cycle', 'slot', 'chainAdd', 'chainStart', 'eat'].forEach(function (n) { g.on(n, function (d) { if (handlers[n]) handlers[n](d); }); });
    function go(n) { step = n; handlers = {}; STEPS[n](); }
    var STEPS = [
      function () {
        say('やあ、ぼくは<b>チャンクくん</b>!<br>英語のバブルをつなげて、<b>文</b>を作るゲームだよ。', function () { go(1); });
        g.guide.allow = function () { return false; };
      },
      function () {
        it.the = spawn({ k: 'det', v: 'the' }, .18, .2); it.small = spawn({ k: 'adj', e: E.small }, .5, .12); it.cat = spawn({ k: 'n', e: E.cat }, .82, .22);
        it.sleep = spawn({ k: 'v', e: E.sleep }, .55, .42);
        var seq = [it.the, it.small, it.cat], idx = 0;
        say('単語を<b>英語の順番</b>にタップすると「チャンク」になるよ。<br><span class="pc-en">the → small → cat</span> の順にタップしてみて!');
        hand = { tap: function () { return at(seq[Math.min(idx, 2)])(); } };
        g.guide.allow = function (item, slot) { return !slot && item === seq[idx]; };
        onG('chainStart', function (d) { if (d.item === seq[0]) idx = 1; });
        onG('chainAdd', function (d) { idx = seq.indexOf(d.item) + 1; });
        onG('fail', function () { idx = 0; });
        onG('chunk', function (d) { it.np = d.item; it.vp = it.sleep; clearHand(); later(function () { go(3); }, 700); });
      },
      function () {
        say('できた!これが<b>名詞のチャンク</b>。<br>次は動詞 <span class="pc-en">sleep</span> をタップ。少し待つとチャンクになるよ。');
        hand = { tap: at(it.sleep) };
        g.guide.allow = function (item, slot) { return !slot && item === it.sleep; };
        onG('chunk', function (d) { it.vp = d.item; clearHand(); later(function () { go(3); }, 700); });
      },
      function () {
        say('できた!これが<b>名詞のチャンク</b>。<br>今度は<b>指でなぞって</b>つなげよう。<span class="pc-en">the … cat</span> から <span class="pc-en">sleep</span> へ、なぞってみて!');
        hand = { from: at(it.np), to: at(it.vp) };
        g.guide.allow = function (item, slot) { return (slot === undefined || slot === 'drag') && (item === it.np || item === it.vp); };
        onG('sentence', function () { clearHand(); later(function () { go(4); }, 1600); });
        onG('fail', function () { say('おしい!<span class="pc-en">the … cat</span> を押したまま、<span class="pc-en">sleep</span> まで指をすべらせてね。'); });
      },
      function () {
        say('すごい!<span class="pc-en">The small cat sleeps.</span><br>主語に合わせて <b>sleep<u>s</u></b> の s も自動で付くよ。', function () { go(5); });
        g.guide.allow = function () { return false; };
      },
      function () {
        it.a = spawn({ k: 'det', v: 'a' }, .22, .18); it.dog = spawn({ k: 'n', e: E.dog }, .6, .14); it.run = spawn({ k: 'v', e: E.run }, .78, .4);
        var cycled = false;
        say('連鎖中の単語を<b>もう一度タップ</b>すると形が変わるよ。<br><span class="pc-en">a</span> をタップ → もう一度タップで <span class="pc-en">the</span> に。それから <span class="pc-en">dog</span> をタップ!');
        hand = { tap: function () { return cycled ? at(it.dog)() : at(it.a)(); } };
        g.guide.allow = function (item, slot) { return !slot && (item === it.a || (cycled && item === it.dog)); };
        onG('cycle', function () { cycled = true; });
        onG('fail', function () { cycled = false; });
        onG('chunk', function (d) { it.np2 = d.item; clearHand(); later(function () { go(6); }, 700); });
      },
      function () {
        say('下の<b>スロット</b>に置いても文が作れるよ。<br><span class="pc-en">the dog</span> を「だれが」へ、<span class="pc-en">run</span> を「する」へドラッグ!<br>(下にピッとはじくと、合うスロットへ自動で入るよ)');
        var stage = 0;
        hand = { from: function () { return stage ? at(it.run)() : at(it.np2)(); }, to: function () { return stage ? slotPos(2)() : slotPos(1)(); } };
        g.guide.allow = function (item, slot) { if (slot === 'confirm') return true; if (item === it.np2 || item === it.run) return true; return !!(item && item.slot); };
        onG('slot', function (d) { if (d.role === 'S') stage = 1; if (g.slots[1].item && g.slots[2].item) { stage = 2; hand = { tap: function () { return g.pill ? { x: g.pill.x + g.pill.w / 2, y: g.pill.y + g.pill.h / 2 } : null; } }; say('いいね!そろったら「<b>わる!</b>」をタップ。<br>スロットを<b>たくさん埋めるほど倍率アップ</b>。貯めて一気に割ろう!'); } });
        onG('sentence', function () { clearHand(); later(function () { go(7); }, 1600); });
      },
      function () {
        it.junk = spawn({ k: 'prep', v: 'into' }, .5, .3);
        say('いらないバブルは、<b>チャンクくんにドラッグ</b>すると食べてくれるよ。<br><span class="pc-en">into</span> を食べさせてみて!(3回まで。文を作ると回復)');
        hand = { from: at(it.junk), to: function () { return { x: 46, y: g.L.lane.y + g.L.lane.h * .55 }; } };
        g.guide.allow = function (item, slot) { return item === it.junk && (slot === undefined || slot === 'drag'); };
        onG('eat', function () { clearHand(); later(function () { go(8); }, 900); });
      },
      function () {
        say('ばっちり!あとは時間内に、どんどん文を作ろう。<br><b>長い文ほど時間がのびる</b>よ。<b>△や×</b>が出たら理由を見てね!', finish, 'はじめる!');
        g.guide.allow = function () { return false; };
      }
    ];
    function finish() { if (finished) return; finished = true; tm.forEach(clearTimeout); ui.unsay(); ui.unskip(); g.guide = null; done(); }
    ui.skip(finish);
    go(0);
    return { stop: function () { finished = true; tm.forEach(clearTimeout); ui.unsay(); ui.unskip(); } };
  }
  return { run: run };
})();
