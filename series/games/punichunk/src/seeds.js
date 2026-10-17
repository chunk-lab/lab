import { G } from './grammar.js';
import { SEED_DATA } from './seed_data.js';
/* ===== seeds.js:タネ文(内部で想定する理想の文)を作り、単語に分解する =====
 盤面の6〜7割はタネ文の部品から出す。プレイヤーには見せない。判定は「型」だけなので、タネ文どおりでなくても通る。
 タネ文どおりに完成させると PERFECT! */
export var Seeds = (function () {
  'use strict';
  function create(dict, o) {
    var rnd = o.rnd || Math.random, cfg = o.cfg, lv = o.level || 0, maxLv = o.maxLevel || 2;
    var pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
    var idx = {}; ['noun', 'verb', 'adj', 'adv', 'idiom'].forEach(function (p) { idx[p] = {}; dict.all(p).forEach(function (e) { idx[p][e.w] = e; }); });
    var nouns = dict.all('noun').filter(function (e) { return (e.lv || 1) <= maxLv; });
    var verbs = dict.all('verb').filter(function (e) { return (e.lv || 1) <= maxLv && !e.tail && e.fr !== 'cl'; });
    var adjs = dict.all('adj').filter(function (e) { return (e.lv || 1) <= maxLv; });
    var advs = dict.all('adv'), idioms = dict.all('idiom');
    function resolve(sp) {
      var k = sp.split(':')[0], rest = sp.slice(sp.indexOf(':') + 1), parts = rest.split('|'), w = parts[0], x = parts[1];
      switch (k) {
        case 'n': return idx.noun[w] && { k: 'n', e: idx.noun[w], pl: x === 'pl' };
        case 'v': return idx.verb[w] && { k: 'v', e: idx.verb[w], f: x || 'base' };
        case 'adj': return idx.adj[w] && { k: 'adj', e: idx.adj[w] };
        case 'adv': return idx.adv[w] && { k: 'adv', e: idx.adv[w] };
        case 'idm': return idx.idiom[w] && { k: 'idm', e: idx.idiom[w] };
        case 'q': return { k: 'q', v: w, e: idx.idiom[w] };
        case 'sm': return { k: 'sm', v: w, t: x || 'pres' };
        case 'be': return { k: 'be', v: w };
        case 'not': return { k: 'not' };
        default: return { k: k, v: w };
      }
    }
    // ---------- 部品 ----------
    var M = !cfg.auto.art;
    function npFor(e, role) {
      var ws = [], c = e.c;
      if (lv >= 1 && rnd() < .3 && (c === 'c' || c === 'u' || c === 'p')) { var a = pick(adjs); if (a) ws.push({ k: 'adj', e: a }); }
      var pl = false;
      if ((c === 'c') && rnd() < .2 && role !== 'subj1') { pl = true; }
      var lead = null;
      if (c === 'c' || c === 't') {
        if (pl) lead = rnd() < .5 ? { k: 'q', v: pick(['two', 'three', 'many', 'some']) } : (M ? { k: 'det', v: 'the' } : null);
        else if (e.ad === 'my') lead = { k: 'pr', v: pick(['i', 'you', 'he', 'she', 'we']) };
        else if (M || rnd() < .3) lead = { k: 'det', v: e.ad === 'the' || c === 't' ? 'the' : rnd() < .5 ? 'a' : 'the' };
      } else if (c === 'u' && rnd() < .25) {
        var q = (e.tg || []).indexOf('drink') >= 0 ? pick(['a cup of', 'a glass of']) : 'a lot of'; lead = { k: 'q', v: q, e: idx.idiom[q] };
      } else if (c === 'p' && M && rnd() < .5) lead = { k: 'det', v: 'the' };
      var n = { k: 'n', e: e, pl: pl };
      return (lead ? [lead] : []).concat(ws, [n]);
    }
    function subject() {
      if (rnd() < .42) return [{ k: 'pr', v: pick(['i', 'you', 'he', 'she', 'we', 'they', 'he', 'she']) }];
      var e = pick(nouns.filter(function (n) { return n.cat === 'person' || n.cat === 'animal'; })); return npFor(e, 'subj');
    }
    function objectFor(v) {
      if (rnd() < .15) return [{ k: 'pr', v: pick(['i', 'you', 'he', 'she', 'it', 'they']) }];
      var ot = (v.ot || []).filter(function (t) { return t !== 'any'; }), cand = [];
      if (ot.length) cand = nouns.filter(function (n) { return ot.indexOf(n.cat) >= 0 || (n.tg || []).some(function (t) { return ot.indexOf(t) >= 0; }); });
      if (!cand.length) cand = nouns.filter(function (n) { return n.cat !== 'time' && n.cat !== 'place'; });
      return npFor(pick(cand), 'obj');
    }
    function tsKey(tense) { return tense === 'fut' ? 'fut' : tense === 'past' ? 'past' : 'pres'; }
    function timeFor(tense) {
      var key = tsKey(tense), r = rnd();
      var ok = function (e) { return (e.ts || []).indexOf(key) >= 0; };
      if (r < .45) { var a = advs.filter(function (e) { return e.k === 'time' && ok(e); }); if (a.length) return [[{ k: 'adv', e: pick(a) }]]; }
      if (r < .75) { var i = idioms.filter(function (e) { return e.k === 'time' && ok(e) && (e.lv || 1) <= Math.max(2, maxLv); }); if (i.length) return [[{ k: 'idm', e: pick(i) }]]; }
      var tn = nouns.filter(function (e) { return e.cat === 'time' && ok(e) && e.prep; });
      if (!tn.length) return null;
      var n = pick(tn), ws = [{ k: 'prep', v: n.prep }]; if (n.c === 't') ws.push({ k: 'det', v: 'the' }); ws.push({ k: 'n', e: n });
      return [ws];
    }
    function placeFor() {
      var r = rnd();
      if (r < .2) { var a = advs.filter(function (e) { return e.k === 'place'; }); return [[{ k: 'adv', e: pick(a) }]]; }
      if (r < .32) { var i = idioms.filter(function (e) { return e.k === 'place'; }); if (i.length) return [[{ k: 'idm', e: pick(i) }]]; }
      var n = pick(nouns.filter(function (e) { return e.cat === 'place' && e.prep; })), ws = [{ k: 'prep', v: n.prep }];
      if (n.c === 'c' || n.c === 't' || (n.c === 'p' && n.ad === 'the')) ws.push(n.ad === 'my' ? { k: 'pr', v: pick(['i', 'he', 'she']) } : { k: 'det', v: 'the' });
      ws.push({ k: 'n', e: n }); return [ws];
    }
    // 動詞句。tense: 'pres' | 'past' | 'fut'。timeWord があれば時制はその語に任せる
    function verbPhrase(v, tense, hasTime) {
      var ws = [], r = rnd(), tp = null;
      if (r < (lv ? .14 : .1)) ws.push({ k: 'modal', v: tense === 'past' ? pick(['could', 'would']) : tense === 'fut' ? 'will' : pick(['can', 'must', 'should', 'may']) });
      else if (r < (lv ? .34 : .26)) {
        var sm = tense === 'past' ? pick(['want to', 'have to', 'used to', 'need to']) : tense === 'fut' ? 'be going to' : pick(['want to', 'have to', 'need to', 'would like to']);
        ws.push({ k: 'sm', v: sm, t: tense === 'past' && sm !== 'used to' ? 'past' : 'pres' });
      } else if (lv >= 1 && !hasTime && tense !== 'pres' && rnd() < .7) tp = tense === 'past' ? 'past' : 'fut';
      else if (lv >= 1 && tense === 'pres' && rnd() < .12) tp = 'prog';
      if (lv >= 1 && rnd() < .1) ws.splice(ws.length ? 1 : 0, 0, { k: 'not' });
      if (lv >= 1 && !ws.some(function (w) { return w.k === 'not'; }) && tense === 'pres' && !tp && rnd() < .12) ws.push({ k: 'adv', e: idx.adv[pick(['always', 'usually', 'often', 'sometimes'])] });
      var f = 'base';
      if (!cfg.auto.verb && !tp && !ws.some(function (w) { return w.k === 'modal' || w.k === 'sm'; })) f = tense === 'past' ? 'past' : 'base';
      ws.push({ k: 'v', e: v, f: f });
      if (tp) ws.push({ k: 'tp', v: tp });
      if (lv >= 1 && rnd() < .15) { var m = advs.filter(function (e) { return e.k === 'manner'; }); ws.push({ k: 'adv', e: pick(m) }); }
      return ws;
    }
    function clause(tense, opt) {
      opt = opt || {};
      var chunks = [subject()], v = pick(opt.intr ? verbs.filter(function (x) { return x.fr !== 'tr'; }) : verbs);
      var time = null; if ((tense !== 'pres' && rnd() < .55) || rnd() < .25) time = timeFor(tense);
      chunks.push(verbPhrase(v, tense, !!time));
      if (v.link && rnd() < .7) chunks.push([{ k: 'adj', e: pick(adjs) }]);
      else if (v.cv && rnd() < .55) {
        var v2 = pick(verbs.filter(function (x) { return !x.cv && !x.link; }));
        chunks.push(v.cv === 'ing' ? [{ k: 'v', e: v2 }, { k: 'ti', v: 'ing' }] : [{ k: 'ti', v: 'to' }, { k: 'v', e: v2 }]);
        if (v2.fr === 'tr') chunks.push(objectFor(v2));
      } else if (v.fr === 'tr' || (v.fr === 'both' && rnd() < .55)) {
        chunks.push(objectFor(v));
        if (v.dt && lv >= 3 && rnd() < .3) chunks.splice(chunks.length - 1, 0, [{ k: 'pr', v: pick(['i', 'you', 'him', 'her'].map(function (p) { return p === 'him' ? 'he' : p === 'her' ? 'she' : p; })) }]);
      }
      if (!opt.short && rnd() < (lv ? .5 : .35)) chunks = chunks.concat(placeFor());
      if (time) { if (lv >= 2 && rnd() < .2) chunks = time.concat(chunks); else chunks = chunks.concat(time); }
      return chunks;
    }
    function template() {
      var r = rnd(), tense = lv === 0 ? (r < .65 ? 'pres' : 'past') : (r < .5 ? 'pres' : r < .82 ? 'past' : 'fut');
      var chunks = [];
      if (lv >= 2 && rnd() < .22) {
        var f = idioms.filter(function (e) { return e.k === 'front' && (e.lv || 1) <= maxLv; }); if (f.length) chunks.push([{ k: 'idm', e: pick(f) }]);
      } else if (lv >= 2 && rnd() < .15) {
        chunks.push([{ k: 'conj', v: pick(['when', 'if', 'because', 'before', 'after']) }]); chunks = chunks.concat(clause(tense === 'fut' ? 'pres' : tense, { short: 1, intr: 1 }));
      }
      chunks = chunks.concat(clause(tense));
      if (lv >= 2 && rnd() < .1 && !chunks.some(function (c) { return c[0].k === 'conj'; })) { chunks.push([{ k: 'conj', v: pick(['and', 'but', 'so']) }]); chunks = chunks.concat(clause(tense, { short: 1, intr: 1 })); }
      return chunks;
    }
    // 英語脳の文生成エンジンで作った文(tools/mkseeds_en.js)。「レベル^日本語^単位/単位」
    var DATA = null;
    function data() {
      if (DATA) return DATA;
      DATA = (typeof SEED_DATA === 'undefined' ? [] : SEED_DATA).map(function (s) { var a = s.split('^'); return { lv: +a[0], ja: a[1], c: a[2].split('/').map(function (u) { return u.split(' ').map(function (w) { return w.replace(/_/g, ' '); }); }) }; })
        .filter(function (x) { return x.lv <= lv + 1; });
      return DATA;
    }
    var lastJa = '';
    function fromData() {
      var D = data(); if (!D.length) return null;
      var s = pick(D); lastJa = s.ja;
      var ch = s.c.map(function (c) { return c.map(resolve); });
      return ch.some(function (c) { return c.some(function (w) { return !w; }); }) ? null : ch;
    }
    function validate(chunks) {
      var T = [];
      for (var i = 0; i < chunks.length; i++) { var st = G.chainState(chunks[i], cfg); if (!st.complete || st.err) return null; T.push(st.chunk); }
      var r = G.parse(T, cfg); return r.ok && r.kind === 'S' ? r.text : null;
    }
    function next() {
      for (var t = 0; t < 40; t++) {
        lastJa = '';
        var ch = fromData(); ch = ch || (data().length ? null : template()); if (!ch) continue;
        var text = validate(ch);
        if (text && text.split(' ').length <= 12) return { chunks: ch, text: text, ja: lastJa, words: [].concat.apply([], ch) };
      }
      return null;
    }
    return { next: next, resolve: resolve };
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  return { create: create, norm: norm };
})();
