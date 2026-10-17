import { G } from './grammar.js';
import { Seeds } from './seeds.js';
/* ===== supply.js:単語の供給と、文が作れるかの探索 ===== */
export var Supply = (function () {
  'use strict';
  // 盤面24個あたりの目標数(仕様書 9章)。設定で差し替え可能。
  var RATIO = { noun: 5, verb: 3, adj: 3, adv: 2, det: 3, prep: 3, pron: 1, aux: 1, conj: 1, part: 2 };
  var MIN = { det: 2, prep: 2 };
  function catOf(w) {
    switch (w.k) {
      case 'n': return 'noun'; case 'v': return 'verb'; case 'adj': return 'adj'; case 'adv': return 'adv';
      case 'det': case 'q': return 'det'; case 'prep': return 'prep'; case 'pr': return 'pron';
      case 'be': case 'modal': case 'not': case 'sm': return 'aux'; case 'conj': return 'conj'; case 'ti': case 'er': case 'tp': return 'part';
      case 'deg': return 'adv'; case 'idm': return 'idiom';
    }
    return 'other';
  }
  function create(dict, o) {
    o = o || {};
    var rnd = o.rnd || Math.random, ratio = o.ratio || RATIO, maxLv = o.maxLevel || 2;
    function onBoard(items) { var s = new Set(); items.forEach(function (it) { (it.words || [it.word]).forEach(function (w) { if (w && w.e) s.add(w.e.w); }); }); return s; }
    function pickWord(cat, items) {
      var ex = onBoard(items), r = rnd(), e;
      var get = function (pos, tag, lvl) { return dict.getWords({ pos: pos, tag: tag, maxLevel: lvl || maxLv, count: 1, rnd: rnd, exclude: ex })[0]; };
      switch (cat) {
        case 'noun':
          if (r < .22) e = get('noun', { cat: 'place' }); else if (r < .32) e = get('noun', { cat: 'time' }); else if (r < .55) e = get('noun', { cat: 'person' }) || get('noun', { cat: 'animal' });
          e = e || get('noun', { notCat: ['time', 'place'] }); return e && { k: 'n', e: e };
        case 'verb':
          if (r < .18 && maxLv >= 2) e = get('verb', { cv: 1, simple: 1 }); else if (r < .3 && maxLv >= 2) e = get('verb'); else if (r < .38) e = get('verb', { link: 1 });
          e = e || get('verb', { simple: 1 }); return e && { k: 'v', e: e };
        case 'adj': e = get('adj'); return e && { k: 'adj', e: e };
        case 'adv':
          if (r < .12) return { k: 'deg', v: pick(G.DEGS) };
          e = r < .5 ? get('adv', { k: 'manner' }) : r < .72 ? get('adv', { k: 'time' }) : r < .86 ? get('adv', { k: 'place' }) : get('adv', { k: 'freq' }, 4);
          e = e || get('adv'); return e && { k: 'adv', e: e };
        case 'det':
          if (r < .7) return { k: 'det', v: rnd() < .5 ? 'a' : 'the' };
          if (r < .85) return { k: 'q', v: pick(G.QUANTS) };
          e = get('idiom', { k: 'quant' }, 4); return e ? { k: 'q', v: e.w, e: e } : { k: 'det', v: 'the' };
        case 'prep': var g = r < .5 ? 0 : r < .7 ? 1 : r < .9 ? 2 : 3; return { k: 'prep', v: pick(G.PREP_G[g]) };
        case 'pron': return { k: 'pr', v: pick(['i', 'you', 'he', 'she', 'he', 'she', 'it']) };
        case 'aux': return r < .3 ? { k: 'be', v: 'pres' } : r < .6 ? { k: 'modal', v: pick(G.MODALS) } : r < .88 ? { k: 'sm', v: pick(G.SEMIS), t: 'pres' } : { k: 'not' };
        case 'conj': return r < .65 ? { k: 'conj', v: pick(G.CONJ_SUB) } : { k: 'conj', v: pick(G.CONJ_CO) };
        case 'part': return r < .42 ? { k: 'ti', v: null } : r < .75 || !(o.level >= 1) ? { k: 'er', v: 'er' } : { k: 'tp', v: pick(G.TP_CYCLE) };
        case 'idiom':
          var ik = o.seeds ? 'front' : r < .35 ? 'front' : r < .65 ? 'time' : r < .8 ? 'place' : r < .9 ? 'other' : 'quant';
          e = get('idiom', { k: ik }, Math.max(maxLv, 2));
          if (!e) return null; return ik === 'quant' ? { k: 'q', v: e.w, e: e, star: 1 } : { k: 'idm', e: e, star: 1 };
      }
      return null;
    }
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    function counts(items) {
      var c = {}; for (var k in ratio) c[k] = 0;
      items.forEach(function (it) {
        if (it.word) { var k2 = catOf(it.word); if (c[k2] != null) c[k2]++; }
        else if (it.chunk) { var t = it.chunk.t; if (t === 'NP') c.noun += .8; else if (t === 'VP') c.verb += .8; else if (t === 'PP') c.prep += .5; else if (t === 'AP') c.adj += .6; }
      });
      return c;
    }
    function chooseCat(items, target) {
      var c = counts(items), scale = target / 24, loose = items.filter(function (i) { return i.word; }).length;
      if (loose >= 10) for (var m in MIN) if (c[m] < MIN[m]) return m;
      var tot = 0, ws = [];
      for (var k in ratio) { var d = ratio[k] * scale - c[k]; var w = Math.pow(Math.max(.12, d + .7), 2); ws.push([k, w]); tot += w; }
      var r = rnd() * tot; for (var i = 0; i < ws.length; i++) { r -= ws[i][1]; if (r <= 0) return ws[i][0]; }
      return 'noun';
    }
    // 文の骨組み(主語・目的語になれるもの2つ・動詞1つ)があるか。冠詞が手動なら、冠詞の数も数える
    var manualArt = o.cfg && o.cfg.auto && !o.cfg.auto.art;
    // ---------- 品詞の最低数と上限 ----------
    var KIND_OF = { n: 'noun', pr: 'pron', v: 'verb', modal: 'aux', sm: 'aux', be: 'be', not: 'not', det: 'det', q: 'det', prep: 'prep', adj: 'adj', adv: 'adv', deg: 'adv', ti: 'ti', er: 'part', tp: 'part', conj: 'conj', idm: 'idiom' };
    var MINS = { noun: 4, verb: 3, aux: 2, be: 1, det: 2, prep: 2, adj: 2, adv: 1, ti: 1, part: 1, pron: 1, conj: 1, not: (o.level >= 1 ? 1 : 0) };
    var CAPS = { det: 4, prep: 3, pron: 3, idiom: 2, conj: 2, not: 1, be: 2, aux: 3 };
    function kindCounts(items) {
      var c = {};
      items.forEach(function (it) { (it.word ? [it.word] : (it.chunk && it.chunk.words) || []).forEach(function (w) { var k = KIND_OF[w.k]; if (k) c[k] = (c[k] || 0) + 1; }); if (it.chunk && it.chunk.t === 'ID') c.idiom = (c.idiom || 0) + 1; });
      return c;
    }
    function deficit(items, target) {
      var c = kindCounts(items), sc = Math.max(.6, target / 22), best = null, bd = 0;
      for (var k in MINS) { var d = Math.round(MINS[k] * sc) - (c[k] || 0); if (d > bd) { bd = d; best = k; } }
      return best;
    }
    function overCap(items, w) { var k = w && KIND_OF[w.k]; if (!k || !CAPS[k]) return false; return (kindCounts(items)[k] || 0) >= CAPS[k]; }
    function pickKind(k, items) {
      switch (k) {
        case 'aux': return rnd() < .5 ? { k: 'modal', v: pick(G.MODALS) } : { k: 'sm', v: pick(G.SEMIS), t: 'pres' };
        case 'be': return { k: 'be', v: 'pres' };
        case 'not': return { k: 'not' };
        case 'ti': return { k: 'ti', v: null };
        case 'part': return o.level >= 1 && rnd() < .5 ? { k: 'tp', v: pick(G.TP_CYCLE) } : { k: 'er', v: 'er' };
        case 'conj': return { k: 'conj', v: rnd() < .6 ? pick(G.CONJ_SUB) : pick(G.CONJ_CO) };
        case 'pron': return { k: 'pr', v: pick(['i', 'you', 'he', 'she', 'we', 'they']) };
        case 'det': return { k: 'det', v: rnd() < .5 ? 'a' : 'the' };
        case 'prep': return { k: 'prep', v: pick(G.PREP_G[rnd() < .6 ? 0 : rnd() < .5 ? 1 : 2]) };
        case 'noun': return pickWord('noun', items);
        case 'verb': return pickWord('verb', items);
        case 'adj': return pickWord('adj', items);
        case 'adv': return pickWord('adv', items);
      }
      return null;
    }
    // タネ文の部品の待ち行列(2〜3本ぶんを混ぜる)
    var queue = [], recent = [], sidN = 0;
    function fillQueue() {
      var sd = o.seeds.next(); if (!sd) return;
      var sid = ++sidN, wi = 0;
      recent.push({ text: sd.text, n: Seeds.norm(sd.text), sid: sid, units: sd.chunks.map(function (c) { return c.map(function () { return wi++; }); }) }); if (recent.length > 8) recent.shift();
      // 1本ぶんの部品をまとめて出す(順番だけ混ぜる)。他のタネ文とは混ぜない
      var ws = sd.words.map(function (w, k) { var c = JSON.parse(JSON.stringify({ k: w.k, v: w.v, f: w.f, pl: w.pl, t: w.t })); c.e = w.e; c.sid = sid; c.si = k; if (w.k === 'idm' || (w.k === 'q' && w.e)) c.star = 1; return c; });
      for (var i = ws.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = ws[i]; ws[i] = ws[j]; ws[j] = t; }
      queue = queue.concat(ws);
    }
    // 盤面に部品が(ほぼ)そろっているタネ文の数
    function liveSeeds(items) {
      var have = {};
      items.forEach(function (it) { (it.word ? [it.word] : (it.chunk && it.chunk.words) || []).forEach(function (w) { if (w && w.sid) have[w.sid] = (have[w.sid] || 0) + 1; }); });
      var n = 0; recent.forEach(function (r) { var tot = r.units.reduce(function (a, u) { return a + u.length; }, 0); if ((have[r.sid] || 0) >= tot * .75) n++; });
      return n;
    }
    function feasible(items) {
      var np = 0, vp = 0, cnt = 0, dets = 0;
      items.forEach(function (it) {
        var w = it.word, t = it.chunk && it.chunk.t;
        if (t === 'NP' || (w && w.k === 'pr')) np++;
        else if (w && w.k === 'n') { if (manualArt && (w.e.c === 'c' || w.e.c === 't') && !w.e.ind) cnt++; else np++; }
        if (w && (w.k === 'det' || w.k === 'q')) dets++;
        if (t === 'VP' || (w && (w.k === 'v' || w.k === 'be'))) vp++;
      });
      np += Math.min(cnt, dets);
      return { np: np, vp: vp, cnt: cnt, dets: dets, ok: np >= 2 && vp >= 1 };
    }
    // 詰みを解く1語
    function rescue(items) {
      var f = feasible(items);
      if (f.vp < 1) return dict.getWords({ pos: 'verb', tag: { fr: ['intr', 'both'], simple: 1 }, maxLevel: maxLv, count: 1, rnd: rnd })[0] ? { k: 'v', e: dict.getWords({ pos: 'verb', tag: { fr: ['intr', 'both'], simple: 1 }, maxLevel: maxLv, count: 1, rnd: rnd })[0] } : pickWord('verb', items);
      if (manualArt && f.cnt > f.dets) return rnd() < .6 ? { k: 'det', v: 'the' } : { k: 'pr', v: pick(['he', 'she', 'i', 'you']) };
      if (f.np < 2) return { k: 'pr', v: pick(['he', 'she', 'i', 'you', 'it']) };
      var e = dict.getWords({ pos: 'verb', tag: { fr: ['intr', 'both'], simple: 1 }, maxLevel: maxLv, count: 1, rnd: rnd })[0];
      return rnd() < .5 || !e ? { k: 'pr', v: pick(['he', 'she', 'i', 'you', 'it']) } : { k: 'v', e: e };
    }
    return {
      next: function (items, target, idiomRate) {
        var f = feasible(items);
        if (!f.ok) return rescue(items);
        // 最低数(盤面22個あたり)。足りない品詞を優先して出す
        // タネ文:盤面に組める文が常に2本以上あるように、1本ずつ丸ごと出す
        if (o.seeds) {
          if (!queue.length && liveSeeds(items) < 2) fillQueue();
          if (queue.length) return queue.shift();
          idiomRate = idiomRate == null ? .03 : idiomRate * .5;
        }
        var need = deficit(items, target || 22);
        if (need && rnd() < .8) { var nw = pickKind(need, items); if (nw) return nw; }
        if (rnd() < (idiomRate == null ? .06 : idiomRate)) { var idm = pickWord('idiom', items); if (idm) return idm; }
        for (var t = 0; t < 6; t++) { var w = pickWord(chooseCat(items, target || 22), items); if (w && !overCap(items, w)) return w; }
        return pickWord('noun', items);
      },
      pickWord: pickWord, feasible: feasible, counts: counts, rescue: rescue,
      // タネ文と同じ文か(PERFECT!)。当たったタネ文は一覧から外す
      matchSeed: function (text) { var n = Seeds.norm(text); for (var i = 0; i < recent.length; i++) if (recent[i].n === n) { recent.splice(i, 1); return true; } return false; },
      recentSeeds: function () { return recent.map(function (r) { return r.text; }); },
      seedInfo: function () { return recent.slice(); }
    };
  }

  // ---------- 探索:盤面から作れる文を1つ探す(ヒント・オート・詰みチェック用) ----------
  function candidates(items, cfg) {
    var out = [], words = [];
    items.forEach(function (it) {
      if (it.chunk) out.push({ c: it.chunk, src: [it] });
      else if (it.word) {
        words.push(it); var s = G.chainState([it.word], cfg);
        if (s.complete && !s.err) out.push({ c: s.chunk, src: [it] });
        else if (it.word.k === 'v' && !cfg.auto.verb) { // 形はタップで変えられるので、原形・過去形でも試す
          ['base', 'past'].forEach(function (f) { var w2 = { k: 'v', e: it.word.e, f: f }, s2 = G.chainState([w2], cfg); if (s2.complete && !s2.err) out.push({ c: s2.chunk, src: [it] }); });
        }
      }
    });
    var dets = words.filter(function (i) { return /^(det|q|pr)$/.test(i.word.k); }), nouns = words.filter(function (i) { return i.word.k === 'n'; });
    var preps = words.filter(function (i) { return i.word.k === 'prep'; }), aux = words.filter(function (i) { return i.word.k === 'modal' || i.word.k === 'be'; });
    var verbs = words.filter(function (i) { return i.word.k === 'v'; });
    function tryChain(list) { var s = G.chainState(list.map(function (i) { return i.word; }), cfg); if (s.complete && !s.err) out.push({ c: s.chunk, src: list }); }
    nouns.forEach(function (n) { dets.slice(0, 4).forEach(function (d) { tryChain([d, n]); }); preps.slice(0, 3).forEach(function (p) { tryChain([p, n]); dets.slice(0, 2).forEach(function (d) { tryChain([p, d, n]); }); }); });
    verbs.forEach(function (v) { aux.slice(0, 2).forEach(function (a) { tryChain([a, v]); }); });
    return out;
  }
  function solve(items, cfg, limit) {
    var cand = candidates(items, cfg), NP = [], VP = [], POST = [], COMP = [];
    cand.forEach(function (x) { var t = x.c.t; if (t === 'NP') { NP.push(x); COMP.push(x); } else if (t === 'VP') VP.push(x); else if (t === 'AP' || t === 'NF') COMP.push(x); if (t === 'PP' || t === 'ADV' || (t === 'ID' && x.c.ik !== 'front')) POST.push(x); });
    var tries = 0, best = null; limit = limit || 4000;
    function disjoint(arr) { var s = new Set(); for (var i = 0; i < arr.length; i++) for (var j = 0; j < arr[i].src.length; j++) { if (s.has(arr[i].src[j])) return false; s.add(arr[i].src[j]); } return true; }
    function test(arr) { tries++; if (!disjoint(arr)) return false; var r = G.parse(arr.map(function (x) { return x.c; }), cfg); if (r.ok && r.kind === 'S') { if (!best || arr.length > best.parts.length) best = { parts: arr, text: r.text }; return true; } return false; }
    for (var a = 0; a < NP.length && tries < limit; a++) for (var b = 0; b < VP.length && tries < limit; b++) {
      test([NP[a], VP[b]]);
      for (var c = 0; c < COMP.length && tries < limit; c++) { if (test([NP[a], VP[b], COMP[c]])) for (var d = 0; d < POST.length && tries < limit; d++) test([NP[a], VP[b], COMP[c], POST[d]]); }
      for (var e = 0; e < POST.length && tries < limit; e++) test([NP[a], VP[b], POST[e]]);
      if (best && best.parts.length >= 4) return best;
    }
    return best;
  }
  return { create: create, RATIO: RATIO, catOf: catOf, solve: solve, candidates: candidates };
})();
