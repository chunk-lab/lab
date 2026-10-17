import { Dict } from './dict.js';
/* ===== grammar.js:判定エンジン(DOMに依存しない純粋関数) =====
 単語トークン: {k, e?, v?, f?, pl?}
   k: n 名詞 / pr 顔(代名詞) / det 冠詞 / q 数量 / adj / deg 程度 / er -er,-est / prep / modal / not / be / v 動詞 / adv / ti to,ing / idm 慣用句 / conj
 チャンク: {t:'NP'|'VP'|'AP'|'PP'|'NF'|'ADV'|'ID'|'CONJ'|'CL', words:[...], ...}
 cfg.auto: {art, prep, verb, ti, er} … true=自動(間違いを自動で直す)/false=手動(判定する) */
export var G = (function () {
  'use strict';
  var PRON = {
    i: { sub: 'I', obj: 'me', pos: 'my', p: 1, pl: 0, ja: 'わたし' }, you: { sub: 'you', obj: 'you', pos: 'your', p: 2, pl: 0, ja: 'あなた' },
    he: { sub: 'he', obj: 'him', pos: 'his', p: 3, pl: 0, ja: 'かれ' }, she: { sub: 'she', obj: 'her', pos: 'her', p: 3, pl: 0, ja: 'かのじょ' },
    it: { sub: 'it', obj: 'it', pos: 'its', p: 3, pl: 0, ja: 'それ' }, we: { sub: 'we', obj: 'us', pos: 'our', p: 1, pl: 1, ja: 'わたしたち' },
    they: { sub: 'they', obj: 'them', pos: 'their', p: 3, pl: 1, ja: 'かれら' }, youpl: { sub: 'you', obj: 'you', pos: 'your', p: 2, pl: 1, ja: 'あなたたち' }
  };
  var PRON_C1 = ['i', 'you', 'he', 'she', 'it'], PRON_C2 = ['we', 'they', 'youpl'];
  var PREP_G = [['at', 'on', 'in'], ['to', 'from', 'into'], ['with', 'for', 'about', 'by'], ['under', 'near', 'behind']];
  var PREP_GROUP = {}; PREP_G.forEach(function (g, i) { g.forEach(function (p) { PREP_GROUP[p] = i; }); });
  var MODAL_CYCLE = { can: 'could', could: 'can', will: 'would', would: 'will', may: 'might', might: 'may', must: 'must', should: 'should' };
  var MODAL_PAST = { could: 1, would: 1, might: 1 };
  var MODAL_TO_PAST = { can: 'could', will: 'would', may: 'might' };
  var MODALS = ['can', 'will', 'may', 'must', 'should'];
  // 助動詞の仲間(1つのバブル)。主語・時制で形が変わる
  var SEMI = { 'want to': { b: 'want', past: 'wanted', ja: '〜したい' }, 'have to': { b: 'have', past: 'had', s3: 'has', ja: '〜しなければ' }, 'need to': { b: 'need', past: 'needed', ja: '〜する必要がある' }, 'be going to': { be: 1, ja: '〜するつもり' }, 'used to': { only: 'past', ja: 'よく〜した' }, 'would like to': { fixed: 1, ja: '〜したい' } };
  var SEMIS = Object.keys(SEMI);
  var NEG = { can: "can't", could: "couldn't", will: "won't", would: "wouldn't", should: "shouldn't", must: "mustn't", may: 'may not', might: 'might not', do: "don't", does: "doesn't", did: "didn't", is: "isn't", are: "aren't", was: "wasn't", were: "weren't", am: 'am not', have: "haven't", has: "hasn't", had: "hadn't" };
  function negOf(x) { return NEG[x] || x + ' not'; }
  var TP_LABEL = { past: '過去', fut: '未来', prog: '進行' }, TP_CYCLE = ['past', 'fut', 'prog'];
  var DEGS = ['very', 'really', 'so', 'too'];
  var CONJ_SUB = ['when', 'if', 'because', 'before', 'after', 'while'], CONJ_CO = ['and', 'but', 'so'];
  var QUANTS = ['some', 'many', 'two', 'three', 'every'];
  var QINFO = { some: { pl: 1, u: 1 }, many: { pl: 1 }, two: { pl: 1 }, three: { pl: 1 }, every: { sg: 1 }, 'a few': { pl: 1 }, 'a lot of': { pl: 1, u: 1 }, 'lots of': { pl: 1, u: 1 } };
  var JA_P = { at: 'で', in: 'で', on: 'の上で', to: 'へ', from: 'から', into: 'の中へ', with: 'と', for: 'のために', about: 'について', by: 'のそばで', under: 'の下で', near: 'の近くで', behind: 'の後ろで' };

  function qinfo(w) { if (w.k !== 'q') return null; if (QINFO[w.v]) return QINFO[w.v]; if (w.e && w.e.q === 'u') return { u: 1, uonly: 1 }; return { pl: 1, u: 1 }; }
  function codeOf(w) {
    switch (w.k) {
      case 'det': return 'D'; case 'q': return 'Q'; case 'pr': return 'P'; case 'adj': return 'A'; case 'deg': return 'G'; case 'er': return 'E';
      case 'n': return 'N'; case 'prep': return 'R'; case 'modal': case 'sm': return 'M'; case 'tp': return 'K'; case 'not': return 'T'; case 'be': return 'B'; case 'hv': return 'H'; case 'v': return 'V';
      case 'ti': return 'I'; case 'adv': return w.e.k === 'freq' ? 'F' : w.e.k === 'manner' ? 'Y' : 'S';
      case 'idm': return 'O'; case 'conj': return 'C';
    }
    return '?';
  }

  // ---------- 連鎖のパターン ----------
  function modsCheck(c) { // G/A/E の並び:{ok:途中としてOK, full:完結}
    var i = 0, n = c.length;
    while (i < n) {
      var g = 0; while (i < n && c[i] === 'G') { g++; i++; }
      if (i === n) return { ok: true, full: g === 0 };
      if (c[i] === 'E') { i++; if (i === n) return { ok: true, full: false }; if (c[i] !== 'A') return { ok: false }; i++; continue; }
      if (c[i] === 'A') { i++; if (i < n && c[i] === 'E') i++; continue; }
      return { ok: false };
    }
    return { ok: true, full: true };
  }
  function only(c, set) { for (var i = 0; i < c.length; i++) if (set.indexOf(c[i]) < 0) return false; return true; }
  function mNP(c) {
    var lead = c.length && 'DQP'.indexOf(c[0]) >= 0 ? 1 : 0, r = c.slice(lead);
    var ni = r.indexOf('N');
    if (ni < 0) { if (!only(r, 'GAE')) return { full: false, pre: false }; var m = modsCheck(r); return { full: false, pre: m.ok }; }
    if (ni !== r.length - 1) return { full: false, pre: false };
    var mods = r.slice(0, -1); if (!only(mods, 'GAE')) return { full: false, pre: false };
    var mm = modsCheck(mods); return { full: mm.full, pre: mm.full };
  }
  function mNPP(c) { if (!c.length || c.length > 2 || !only(c, 'P')) return { full: false, pre: false }; return { full: true, pre: c.length === 1 }; }
  function mPP(c) {
    if (c[0] !== 'R') return { full: false, pre: false }; if (c.length === 1) return { full: false, pre: true };
    var r = c.slice(1), a = mNP(r), b = r.length === 1 && r[0] === 'P' ? { full: true, pre: false } : { full: false, pre: false };
    return { full: a.full || b.full, pre: a.pre || b.pre };
  }
  function advRun(c) { // (G* Y)* のチェック
    var i = 0; while (i < c.length) { while (i < c.length && c[i] === 'G') i++; if (i === c.length) return { ok: true, full: false }; if (c[i] !== 'Y') return { ok: false }; i++; }
    return { ok: true, full: true };
  }
  var VP_ST = 'TMTHTBTFV'; // not は助動詞の前でも後でもよい(表示は自動で並べ直す)
  function mVP(c) { // 時制パーツ K は動詞の直前か直後に1つだけ。助動詞・be とは一緒に使えない
    var ki = c.indexOf('K');
    if (ki < 0) return mVPcore(c);
    if (c.lastIndexOf('K') !== ki) return { full: false, pre: false };
    var rest = c.slice(0, ki).concat(c.slice(ki + 1));
    if (rest.indexOf('M') >= 0 || rest.indexOf('B') >= 0) return { full: false, pre: false };
    var vi = c.indexOf('V'), r = mVPcore(rest);
    if (vi < 0) return { full: false, pre: r.pre && ki === c.length - 1 };
    if (Math.abs(vi - ki) !== 1) return { full: false, pre: false };
    return r;
  }
  function mVPcore(c) {
    var st = 0, hasT = 0, h = {}, i;
    for (i = 0; i < c.length; i++) {
      var x = c[i];
      if (x === 'Y' || x === 'G') break;
      var s = -1; for (var k = st; k < VP_ST.length; k++) if (VP_ST[k] === x) { s = k; break; }
      if (s < 0) return { full: false, pre: false };
      if (x === 'T') { if (hasT) return { full: false, pre: false }; hasT = 1; }
      h[x] = 1; st = s + 1;
    }
    var tail = c.slice(i), adv = tail.length ? advRun(tail) : { ok: true, full: true };
    if (!adv.ok) return { full: false, pre: false };
    if (tail.length && !h.V) return { full: false, pre: false };
    var core = h.V || h.B;
    return { full: !!core && adv.full, pre: true };
  }
  function mNF(c) {
    if (c[0] === 'I') {
      if (c.length === 1) return { full: false, pre: true }; if (c[1] !== 'V') return { full: false, pre: false };
      var t = c.slice(2); if (!t.length) return { full: true, pre: true }; var a = advRun(t); return { full: a.ok && a.full, pre: a.ok };
    }
    if (c[0] === 'V') { if (c.length === 1) return { full: false, pre: true }; if (c.length === 2 && c[1] === 'I') return { full: true, pre: false }; }
    return { full: false, pre: false };
  }
  function mAP(c) {
    if (!c.length || !only(c, 'GAE')) return { full: false, pre: false };
    var na = c.filter(function (x) { return x === 'A'; }).length, ne = c.filter(function (x) { return x === 'E'; }).length;
    if (na > 1 || ne > 1) return { full: false, pre: false };
    var m = modsCheck(c); return { full: m.full && na === 1, pre: m.ok };
  }
  function mADV(c) { if (c.length === 1 && c[0] === 'S') return { full: true, pre: false }; if (!only(c, 'GY')) return { full: false, pre: false }; var y = c.indexOf('Y'); if (y >= 0 && y !== c.length - 1) return { full: false, pre: false }; return { full: y === c.length - 1 && c.length > 0, pre: true }; }
  function mOne(code) { return function (c) { return { full: c.length === 1 && c[0] === code, pre: false }; }; }
  var TYPES = [['PP', mPP], ['NP', mNP], ['NPP', mNPP], ['NF', mNF], ['VP', mVP], ['AP', mAP], ['ADV', mADV], ['ID', mOne('O')], ['CONJ', mOne('C')]];
  var ALLCODES = 'DQPAGENRMTBFVYISOCKH';
  function scan(codes) { var full = null, pre = false; for (var i = 0; i < TYPES.length; i++) { var r = TYPES[i][1](codes); if (r.full && !full) full = TYPES[i][0]; if (r.pre) pre = true; } return { full: full, pre: pre }; }

  // ---------- 連鎖の状態 ----------
  function chainState(words, cfg) {
    var codes = words.map(codeOf), s = scan(codes);
    var res = { complete: !!s.full, prefix: s.pre || !!s.full, closed: false, type: s.full, chunk: null, err: null };
    if (s.full) {
      var closed = true;
      for (var i = 0; i < ALLCODES.length && closed; i++) { var x = scan(codes.concat([ALLCODES[i]])); if (x.pre || x.full) closed = false; }
      res.closed = closed;
      var b = build(s.full, words, cfg); res.chunk = b.chunk; res.err = b.err;
    }
    return res;
  }
  function canAppend(words, w) { var s = scan(words.concat([w]).map(codeOf)); return s.pre || !!s.full; }

  // ---------- チャンクの組み立て(自動補正と手動判定) ----------
  function E_(code, a) { return { code: code, msg: MSG[code](a || {}) }; }
  var MSG = {
    needDet: function (a) { return '「' + a.n + '」の前に a か the を付けよう'; },
    aBad: function (a) { return '「' + a.n + '」に a は付かない(数えない名詞・複数形)'; },
    properDet: function (a) { return '「' + a.n + '」には冠詞が付かない'; },
    needThe: function (a) { return '「' + a.n + '」には the を付けよう'; },
    qBad: function (a) { return '「' + a.q + '」と「' + a.n + '」は合わない'; },
    supThe: function () { return '最上級(-est)には the を付けよう'; },
    noCmp: function (a) { return '「' + a.a + '」は -er / -est にできない'; },
    prepTime: function (a) { return '「' + a.n + '」には ' + a.p + ' を使おう'; },
    prepPlace: function (a) { return '「' + a.n + '」には ' + a.p + ' が自然'; },
    modalBase: function (a) { return a.m + ' の後ろは動詞の原形'; },
    havePP: function () { return 'have の後ろは過去分詞(eaten など)'; },
    beForm: function () { return 'be の後ろは -ing か過去分詞'; },
    needBe: function () { return '-ing や過去分詞だけでは動詞にならない(be が必要)'; },
    passiveIntr: function (a) { return '「' + a.v + '」は受け身(be+過去分詞)にできない'; },
    tense: function (a) { return '「' + a.t + '」は' + a.w + 'のこと。時制を合わせよう'; },
    cv: function (a) { return '「' + a.v + '」の後ろは ' + a.f + ' の形'; },
    purposeTo: function () { return '「〜するために」は to + 動詞'; },
    intrObj: function (a) { return '「' + a.v + '」は目的語(何を)をとらない'; },
    needObj: function (a) { return '「' + a.v + '」の後ろに「何を」が足りない'; },
    needSubj: function () { return '主語(だれが・何が)が足りない'; },
    needVerb: function () { return '動詞(する)が足りない'; },
    needComp: function () { return 'be の後ろに「どんな・何」が足りない'; },
    dupTime: function () { return '時を表す言葉が2つある'; },
    dupPlace: function () { return '場所を表す言葉が2つある'; },
    order: function () { return '語順か役割がちがう'; },
    chain: function (a) { return '「' + a.t + '」だけではチャンクにならない'; }
  };
  function nounOf(w) { return w.e; }
  function isCount(e) { return e.c === 'c' || e.c === 't'; }
  function buildMods(ws, cfg, errs) {
    var mods = [], degs = [], pendingE = null, last = null;
    ws.forEach(function (w) {
      if (w.k === 'deg') { degs.push(w.v); last = null; }
      else if (w.k === 'er') { if (last && !last.er) last.er = w.v || 'er'; else pendingE = w.v || 'er'; last = null; }
      else if (w.k === 'adj') { last = { deg: degs, adj: w.e, er: pendingE }; mods.push(last); degs = []; pendingE = null; }
    });
    mods.forEach(function (m) { if (m.er && m.adj.no) errs.push(E_('noCmp', { a: m.adj.w })); });
    return mods;
  }
  function buildNP(ws, cfg, errs, inPP) {
    if (ws.every(function (w) { return w.k === 'pr'; })) {
      var pr = ws[0].v; if (ws.length === 2) pr = mergePron(ws[0].v, ws[1].v);
      return { t: 'NP', pron: pr, merged: ws.length === 2, words: ws };
    }
    var lead = 'DQP'.indexOf(codeOf(ws[0])) >= 0 ? ws[0] : null, nw = ws[ws.length - 1], e = nounOf(nw);
    var mods = buildMods(ws.slice(lead ? 1 : 0, -1), cfg, errs);
    var np = { t: 'NP', words: ws, noun: e, mods: mods, det: null, quant: null, poss: null, num: 'sg' };
    if (e.c === 'p') np.num = 'pl'; else if (isCount(e) && !e.ind && nw.pl) np.num = 'pl';
    var auto = cfg.auto.art, nm = e.w;
    if (lead && lead.k === 'q') {
      var qi = qinfo(lead); np.quant = lead.v;
      if (isCount(e)) { if (qi.uonly) errs.push(E_('qBad', { q: lead.v, n: nm })); else np.num = qi.sg ? 'sg' : 'pl'; }
      else if (e.c === 'u') { if (!qi.u) errs.push(E_('qBad', { q: lead.v, n: nm })); }
      else if (e.c === 'p') { if (!qi.pl) errs.push(E_('qBad', { q: lead.v, n: nm })); }
      else errs.push(E_('qBad', { q: lead.v, n: nm }));
    } else if (lead && lead.k === 'pr') np.poss = lead.v;
    else if (lead && lead.k === 'det') np.det = lead.v;
    var hasSup = mods.some(function (m) { return m.er === 'est'; });
    // 冠詞
    if (np.det === 'a' && (np.num === 'pl' || e.c === 'u' || e.c === 'p')) { if (auto) np.det = 'the'; else errs.push(E_('aBad', { n: nm })); }
    if (np.det && (e.c === 'n')) { if (auto) np.det = null; else errs.push(E_('properDet', { n: nm })); }
    if (!np.det && !np.quant && !np.poss && isCount(e) && np.num === 'sg' && !e.ind) {
      if (auto) { if (e.ad === 'my') np.poss = 'i'; else np.det = (e.ad === 'the' || e.c === 't' || hasSup) ? 'the' : 'a'; np.autoDet = 1; }
      else errs.push(E_(e.c === 't' ? 'needThe' : 'needDet', { n: nm }));
    }
    if (hasSup && np.det !== 'the' && !np.poss) { if (auto) { if (!np.quant) np.det = 'the'; } else errs.push(E_('supThe')); }
    return np;
  }
  function mergePron(a, b) { if (a === 'i' || b === 'i' || a === 'we' || b === 'we') return 'we'; if ((a === 'you' || a === 'youpl') && (b === 'you' || b === 'youpl')) return 'youpl'; return 'they'; }
  function buildPP(ws, cfg, errs) {
    var pw = ws[0], np = buildNP(ws.slice(1), cfg, errs, true), prep = pw.v, g = PREP_GROUP[prep], cat = 'other';
    var e = np.noun;
    if (e && e.cat === 'time') {
      if (g === 0) {
        cat = 'time';
        if (e.prep && prep !== e.prep) { if (cfg.auto.prep) prep = e.prep; else errs.push(E_('prepTime', { n: e.w, p: e.prep })); }
        if (e.c === 't' && np.det !== 'the') { if (cfg.auto.art) { np.det = 'the'; np.poss = null; } else if (!errs.some(function (x) { return x.code === 'needThe'; })) errs.push(E_('needThe', { n: e.w })); }
      }
    } else if (e && e.cat === 'place') {
      cat = g === 1 ? 'dir' : g === 2 ? 'other' : 'place';
      if (g === 0 && e.prep) {
        var ok = e.prep === 'at' || e.prep === 'in' ? ['at', 'in'] : [e.prep];
        if (ok.indexOf(prep) < 0) { if (cfg.auto.prep) prep = e.prep; else errs.push(E_('prepPlace', { n: e.w, p: e.prep })); }
      }
    } else cat = g === 1 ? 'dir' : g === 2 ? 'other' : (np.pron ? 'other' : 'place');
    return { t: 'PP', words: ws, prep: prep, np: np, cat: cat };
  }
  function buildVP(ws, cfg, errs) {
    var vp = { t: 'VP', words: ws, modal: null, neg: false, be: null, freq: null, verb: null, vf: 'base', advs: [], beW: null };
    var degs = [];
    ws.forEach(function (w) {
      switch (w.k) {
        case 'modal': vp.modal = w.v; break; case 'sm': vp.semi = w.v; vp.semiW = w; break; case 'tp': vp.tp = w.v || 'past'; break; case 'not': vp.neg = true; break;
        case 'be': vp.be = w.v || 'pres'; vp.beW = w; break; case 'hv': vp.have = w.v || 'pres'; vp.hvW = w; break; case 'v': vp.verb = w.e; vp.vf = w.f || 'base'; vp.vw = w; break;
        case 'deg': degs.push(w.v); break;
        case 'adv': if (w.e.k === 'freq') vp.freq = w.e; else { vp.advs.push({ deg: degs, e: w.e }); degs = []; } break;
      }
    });
    if (vp.tp) { vp.vf = vp.be && vp.verb ? 'ing' : 'base'; }
    else if (cfg.auto.verb) { // 自動:選んだ形を尊重し、合わない形だけ直す
      if (vp.verb) {
        if (vp.have && !vp.be) vp.vf = 'pp'; // 完了形:have + 過去分詞
        else if (vp.be) { if (vp.vf !== 'ing' && vp.vf !== 'pp') vp.vf = 'ing'; if (vp.vf === 'pp' && vp.verb.fr === 'intr') vp.vf = 'ing'; }
        else if (vp.modal || vp.semi) vp.vf = 'base';
        else if (vp.vf !== 'base' && vp.vf !== 'past') vp.vf = vp.vf === 'pp' ? 'past' : 'base';
      }
    }
    else if (vp.verb) {
      if (vp.have && !vp.be) { if (vp.vf !== 'pp') errs.push(E_('havePP')); }
      else if (vp.be) { if (vp.vf !== 'ing' && vp.vf !== 'pp') errs.push(E_('beForm')); else if (vp.vf === 'pp' && vp.verb.fr === 'intr') errs.push(E_('passiveIntr', { v: vp.verb.w })); }
      else if (vp.modal || vp.semi) { if (vp.vf !== 'base') errs.push(E_('modalBase', { m: vp.modal || vp.semi })); }
      else if (vp.vf !== 'base' && vp.vf !== 'past') errs.push(E_('needBe'));
    }
    return vp;
  }
  function buildNF(ws) {
    var iw = ws.filter(function (w) { return w.k === 'ti'; })[0], vw = ws.filter(function (w) { return w.k === 'v'; })[0];
    var advs = [], degs = [];
    ws.forEach(function (w) { if (w.k === 'deg') degs.push(w.v); if (w.k === 'adv') { advs.push({ deg: degs, e: w.e }); degs = []; } });
    var ti = iw.v || (ws.indexOf(iw) < ws.indexOf(vw) ? 'to' : 'ing');
    return { t: 'NF', words: ws, ti: ti, verb: vw.e, advs: advs };
  }
  function build(type, ws, cfg) {
    var errs = [], c;
    switch (type) {
      case 'NP': case 'NPP': c = buildNP(ws, cfg, errs); break;
      case 'PP': c = buildPP(ws, cfg, errs); break;
      case 'VP': c = buildVP(ws, cfg, errs); break;
      case 'NF': c = buildNF(ws); break;
      case 'AP': c = { t: 'AP', words: ws, mods: buildMods(ws, cfg, errs) }; break;
      case 'ADV': var a = ws[ws.length - 1]; c = { t: 'ADV', words: ws, e: a.e, ak: a.e.k, deg: ws.slice(0, -1).map(function (w) { return w.v; }) }; break;
      case 'ID': c = { t: 'ID', words: ws, e: ws[0].e, ik: ws[0].e.k }; break;
      case 'CONJ': c = { t: 'CONJ', words: ws, v: ws[0].v, sub: CONJ_SUB.indexOf(ws[0].v) >= 0 }; break;
    }
    return { chunk: c, err: errs[0] || null };
  }
  function rebuild(ch, cfg) { if (ch.t === 'CL') return { chunk: ch, err: null }; var s = chainState(ch.words, cfg); return { chunk: s.complete ? s.chunk : null, err: s.err }; }

  // 完成済みチャンクへの差し込み:入れられる位置を後ろから探す
  function tryInsert(ch, w, cfg) {
    if (!ch || ch.t === 'CL' || ch.t === 'ID' || ch.t === 'CONJ') return null;
    for (var pos = ch.words.length; pos >= 0; pos--) {
      var nw = ch.words.slice(0, pos).concat([w], ch.words.slice(pos));
      var s = chainState(nw, cfg);
      if (s.complete && sameKind(s.type, ch.t) && !s.err) return s.chunk;
    }
    // 種類が変わってもよい(the airport + at → at the airport、big + dog → big dog など)。前か後ろに付けるときだけ
    var ends = [0, ch.words.length];
    for (var e = 0; e < ends.length; e++) {
      var nw2 = ch.words.slice(0, ends[e]).concat([w], ch.words.slice(ends[e]));
      var s2 = chainState(nw2, cfg);
      if (s2.complete && !s2.err && s2.type !== 'CONJ' && s2.type !== 'ID') return s2.chunk;
    }
    return null;
  }
  function sameKind(type, t) { return type === t || (type === 'NPP' && t === 'NP'); }

  // ---------- 形の切替 ----------
  function cycleWord(w, cfg) {
    var i;
    switch (w.k) {
      case 'det': w.v = w.v === 'a' ? 'the' : 'a'; return true;
      case 'pr': var cyc = PRON_C1.indexOf(w.v) >= 0 ? PRON_C1 : PRON_C2; i = cyc.indexOf(w.v); w.v = cyc[(i + 1) % cyc.length]; return true;
      case 'prep': var g = PREP_G[PREP_GROUP[w.v]]; i = g.indexOf(w.v); w.v = g[(i + 1) % g.length]; return true;
      case 'modal': if (MODAL_CYCLE[w.v] === w.v) return false; w.v = MODAL_CYCLE[w.v]; return true;
      case 'sm': if (cfg.auto.verb || SEMI[w.v].only || SEMI[w.v].fixed) return false; w.t = w.t === 'past' ? 'pres' : 'past'; return true;
      case 'tp': i = TP_CYCLE.indexOf(w.v || 'past'); w.v = TP_CYCLE[(i + 1) % 3]; return true;
      case 'be': case 'hv': w.v = w.v === 'past' ? 'pres' : 'past'; return true;
      case 'v': var F = ['base', 'past', 'pp', 'ing']; i = F.indexOf(w.f || 'base'); w.f = F[(i + 1) % 4]; return true;
      case 'n': if (!isCount(w.e) || w.e.ind) return false; w.pl = !w.pl; return true;
      case 'ti': w.v = (w.v || 'to') === 'to' ? 'ing' : 'to'; return true;
      case 'er': w.v = (w.v || 'er') === 'er' ? 'est' : 'er'; return true;
      case 'conj': var cg = CONJ_SUB.indexOf(w.v) >= 0 ? CONJ_SUB : CONJ_CO; i = cg.indexOf(w.v); w.v = cg[(i + 1) % cg.length]; return true;
    }
    return false;
  }
  function cyclable(w, cfg) { var c = JSON.parse(JSON.stringify({ k: w.k, v: w.v, f: w.f, pl: w.pl })); c.e = w.e; return cycleWord(c, cfg); }

  // ---------- 文字列化 ----------
  function adjText(m) { var a = m.adj, s = m.er === 'er' ? Dict.comp(a) : m.er === 'est' ? Dict.sup(a) : a.w; return (m.deg.length ? m.deg.join(' ') + ' ' : '') + s; }
  function nounText(np) { return np.num === 'pl' && isCount(np.noun) ? Dict.plural(np.noun.w) : np.noun.w; }
  function npText(np, cas) {
    if (np.pron) return cas === 'obj' ? PRON[np.pron].obj : PRON[np.pron].sub;
    var rest = np.mods.map(adjText).concat([nounText(np)]).join(' '), lead = '';
    if (np.quant) lead = np.quant; else if (np.poss) lead = PRON[np.poss].pos; else if (np.det === 'a') lead = Dict.an(rest); else if (np.det) lead = np.num === 'pl' && np.det === 'this' ? 'these' : np.num === 'pl' && np.det === 'that' ? 'those' : np.det;
    return (lead ? lead + ' ' : '') + rest + (np.postText ? ' ' + np.postText : ''); // 後置修飾(reading the book / on the desk / who plays tennis)
  }
  function advText(a) { return (a.deg && a.deg.length ? a.deg.join(' ') + ' ' : '') + a.e.w; }
  function verbForm(v, f) { return f === 'past' ? Dict.past(v) : f === 'pp' ? Dict.pp(v) : f === 'ing' ? Dict.ing(v) : f === 's3' ? Dict.s3(v) : Dict.base(v); }
  function nfText(nf, ti) { ti = ti || nf.ti; var s = ti === 'to' ? 'to ' + Dict.base(nf.verb) : Dict.ing(nf.verb); return s + nf.advs.map(function (a) { return ' ' + advText(a); }).join(''); }
  function apText(ap, comp) { var m = ap.mods[0]; return (comp && m.er === 'est' ? 'the ' : '') + adjText(m); }
  function ppText(pp) { return pp.prep + ' ' + npText(pp.np, 'obj'); }
  function vpDisplay(vp, cfg) { // 文になる前の見た目
    var p = [];
    if (vp.modal) p.push(vp.neg ? negOf(vp.modal) : vp.modal);
    if (vp.semi) p.push(semiShow(vp.semiW, cfg));
    if (vp.have) p.push(vp.modal || vp.semi ? 'have' : (vp.have === 'past' ? 'had' : 'have'));
    if (vp.be) p.push(vp.have ? 'been' : vp.modal || vp.semi ? 'be' : (vp.be === 'past' ? 'was' : 'be'));
    if (!vp.modal && vp.neg) p.push('not');
    if (vp.freq) p.push(vp.freq.w);
    if (vp.verb && vp.tp) p.push(vp.tp === 'past' ? Dict.past(vp.verb) : vp.tp === 'fut' ? 'will ' + Dict.base(vp.verb) : 'be ' + Dict.ing(vp.verb));
    else if (vp.verb) p.push(verbForm(vp.verb, vp.vf));
    vp.advs.forEach(function (a) { p.push(advText(a)); });
    return p.join(' ');
  }
  function semiShow(w, cfg) { var sm = SEMI[w.v]; return w.t === 'past' && !cfg.auto.verb && sm.past ? sm.past + ' to' : w.t === 'past' && sm.be && !cfg.auto.verb ? 'was going to' : w.v; }
  function chunkText(c, cfg) {
    switch (c.t) {
      case 'NP': return npText(c, 'sub'); case 'PP': return ppText(c); case 'VP': return vpDisplay(c, cfg); case 'NF': return nfText(c);
      case 'AP': return apText(c); case 'ADV': return advText(c); case 'ID': return c.e.w; case 'CONJ': return c.v; case 'CL': return c.text;
      case 'FR': return c.parts.map(function (p) { return chunkText(p, cfg); }).join(' ');
    }
    return '';
  }
  function label(c, cfg) { var ws = chunkText(c, cfg).split(' '); return ws.length > 2 ? ws[0] + ' … ' + ws[ws.length - 1] : ws.join(' '); }
  function wordText(w, cfg) {
    switch (w.k) {
      case 'n': return w.pl && isCount(w.e) ? Dict.plural(w.e.w) : w.e.w;
      case 'pr': return PRON[w.v].sub; case 'det': case 'q': case 'deg': case 'prep': case 'modal': case 'conj': return w.v;
      case 'sm': return semiShow(w, cfg); case 'tp': return TP_LABEL[w.v || 'past'];
      case 'not': return 'not'; case 'be': return w.v === 'past' ? 'was' : 'be'; case 'hv': return w.v === 'past' ? 'had' : 'have';
      case 'v': return verbForm(w.e, w.f || 'base');
      case 'ti': return w.v ? (w.v === 'to' ? 'to' : '-ing') : 'to/ing'; case 'er': return w.v === 'est' ? '-est' : '-er';
      case 'adj': case 'adv': case 'idm': return w.e.w; case 'magic': return '?';
    }
    return '';
  }
  function jaAdj(a) { var j = a.ja || a.w; return a.jt === 'na' ? j + 'な' : j; }
  function gloss(c) {
    try {
      switch (c.t) {
        case 'NP': if (c.pron) return PRON[c.pron].ja; return (c.poss ? PRON[c.poss].ja + 'の' : '') + c.mods.map(function (m) { return jaAdj(m.adj); }).join('') + (c.noun.ja || '');
        case 'PP': var n = gloss(c.np); return n + (c.cat === 'time' ? 'に' : (JA_P[c.prep] || ''));
        case 'VP': return (c.freq && c.freq.ja ? c.freq.ja + ' ' : '') + (c.verb ? c.verb.ja : (c.be ? '〜である' : '')) + (c.semi ? '(' + SEMI[c.semi].ja + ')' : '') + (c.tp ? '(' + TP_LABEL[c.tp] + ')' : '') + (c.neg ? '(〜ない)' : '');
        case 'NF': return c.verb.ja + (c.ti === 'to' ? '(こと・ために)' : '(こと)');
        case 'AP': return c.mods[0].adj.ja; case 'ADV': case 'ID': return c.e.ja || '';
      }
    } catch (e) { }
    return '';
  }

  // ---------- 文の解析 ----------
  function isTP(t) { return (t.t === 'ADV' && (t.ak === 'time' || t.ak === 'place')) || (t.t === 'PP' && (t.cat === 'time' || t.cat === 'place')) || (t.t === 'ID' && (t.ik === 'time' || t.ik === 'place')); }
  function isPost(t) { return isTP(t) || t.t === 'PP' || t.t === 'ADV' || (t.t === 'ID' && t.ik === 'other') || t.t === 'NF'; }
  function compOptions(vp) {
    var o = [], v = vp.verb;
    if (!v || (vp.be && vp.vf === 'pp' && v)) {
      if (!v) { o.push({ p: ['AP'] }, { p: ['NP'] }, { p: ['PPplace'] }, { p: [], f: 'needComp' }); return o; }
      o.push({ p: [] }); return o;
    }
    if (v.link && !vp.be) { o.push({ p: ['AP'] }, { p: ['NP'] }); if (v.fr !== 'tr') o.push({ p: [] }); else o.push({ p: [], f: 'needObj' }); }
    else if (v.fr === 'tr') { o.push({ p: ['NP'] }); if (v.dt) o.push({ p: ['NP', 'NP'] }); o.push({ p: [], f: 'needObj' }); }
    else if (v.fr === 'both') { o.push({ p: [] }, { p: ['NP'] }); if (v.dt) o.push({ p: ['NP', 'NP'] }); }
    else { o.push({ p: [] }, { p: ['NP'], f: 'intrObj' }); }
    if (v.cv) { o.push({ p: ['NF'] }, { p: ['NF', 'NPobj'] }); }
    return o;
  }
  function fits(tok, pat, prev) {
    if (!tok) return false;
    if (pat === 'NP') return tok.t === 'NP';
    if (pat === 'NPobj') return tok.t === 'NP' && prev && prev.verb && prev.verb.fr !== 'intr';
    if (pat === 'AP') return tok.t === 'AP';
    if (pat === 'NF') return tok.t === 'NF';
    if (pat === 'PPplace') return tok.t === 'PP' && (tok.cat === 'place' || tok.cat === 'dir') || (tok.t === 'ADV' && tok.ak === 'place') || (tok.t === 'ID' && tok.ik === 'place');
    return false;
  }
  function pClause(T, i, allowPre, prefix, out) {
    var n = T.length;
    for (var k = 0; k <= 2; k++) {
      if (k > 0 && !(i + k - 1 < n && allowPre && isTP(T[i + k - 1]))) break;
      var j = i + k, pre = T.slice(i, j);
      if (prefix && j === n) { out.push({ i: n, partial: true }); continue; }
      var subj = null, flags = [];
      if (T[j] && T[j].t === 'NP') { subj = T[j]; j++; } else if (T[j] && T[j].t === 'VP') flags.push('needSubj'); else continue;
      if (prefix && j === n) { out.push({ i: n, partial: true }); continue; }
      var vp = T[j]; if (!vp || vp.t !== 'VP') continue; j++;
      compOptions(vp).forEach(function (op) {
        var jj = j, ok = true;
        for (var q = 0; q < op.p.length; q++) {
          if (prefix && jj === n) { out.push({ i: n, partial: true }); ok = false; break; }
          if (!fits(T[jj], op.p[q], T[jj - 1])) { ok = false; break; } jj++;
        }
        if (!ok) return;
        if (vp.verb && vp.verb.cv && op.p.indexOf('NF') < 0 && T[jj] && T[jj].t === 'NF') return;
        var fl = flags.slice(); if (op.f) fl.push(op.f);
        for (var m = 0; m <= 3; m++) {
          if (m > 0 && !(jj + m - 1 < n && isPost(T[jj + m - 1]))) break;
          out.push({ i: jj + m, cl: { pre: pre, subj: subj, vp: vp, comps: T.slice(j, jj), compPat: op.p, posts: T.slice(jj, jj + m), flags: fl } });
        }
        if (prefix && jj + 3 < n) { /* 後置は最大3 */ }
      });
    }
    return out;
  }
  function parseAll(T, prefix) {
    var n = T.length, res = [], fronts = [{ i: 0, front: null }];
    if (T[0] && (T[0].t === 'CL' || (T[0].t === 'ID' && T[0].ik === 'front'))) fronts.push({ i: 1, front: { tok: T[0] } });
    if (T[0] && T[0].t === 'CONJ' && T[0].sub) {
      if (prefix && n === 1) res.push({ partial: true });
      pClause(T, 1, true, prefix, []).forEach(function (c) {
        if (c.partial) { res.push({ partial: true }); return; }
        if (c.i === n) res.push({ kind: 'CL', conj: T[0], cl: c.cl });
        fronts.push({ i: c.i, front: { conj: T[0], cl: c.cl } });
      });
    }
    fronts.forEach(function (f) {
      if (prefix && f.i === n && f.front) { res.push({ partial: true }); return; }
      pClause(T, f.i, true, prefix, []).forEach(function (c1) {
        if (c1.partial) { res.push({ partial: true }); return; }
        if (c1.i === n) { res.push({ kind: 'S', front: f.front, cls: [c1.cl] }); return; }
        var co = T[c1.i];
        if (co && co.t === 'CONJ') {
          if (prefix && c1.i + 1 === n) { res.push({ partial: true }); return; }
          pClause(T, c1.i + 1, true, prefix, []).forEach(function (c2) {
            if (c2.partial) { res.push({ partial: true }); return; }
            if (c2.i === n) res.push({ kind: 'S', front: f.front, cls: [c1.cl, c2.cl], co: co });
          });
        }
      });
    });
    return res;
  }

  // ---------- 時制 ----------
  function timeTokens(cl) {
    var out = [];
    cl.pre.concat(cl.posts).forEach(function (t) {
      if (t.t === 'ADV' && t.ak === 'time') out.push({ ts: t.e.ts, w: t.e.w });
      else if (t.t === 'ID' && t.ik === 'time') out.push({ ts: t.e.ts, w: t.e.w });
      else if (t.t === 'PP' && t.cat === 'time') out.push({ ts: t.np.noun && t.np.noun.ts, w: ppText(t) });
    });
    return out;
  }
  function allowedOf(times) {
    var a = null;
    times.forEach(function (t) { var s = {}; (t.ts || ['pres', 'past', 'fut', 'prog']).forEach(function (k) { s[k] = 1; }); if (!a) a = s; else { var b = {}; for (var k in a) if (s[k]) b[k] = 1; a = b; } });
    return a;
  }
  function decideTense(vp, allowed, cfg) {
    var asp = vp.verb ? (vp.be ? (vp.vf === 'pp' ? 'pass' : 'prog') : 'simple') : 'cop';
    var r = { asp: asp, tense: 'pres', modal: vp.modal, ok: true, perf: !!vp.have };
    if (vp.have && !vp.semi) { // 完了形:現在完了は「今」とつながる語だけ、過去完了は過去の語と
      r.tense = cfg.auto.verb ? (allowed && !allowed.pres && !allowed.prog && allowed.past ? 'past' : 'pres') : (vp.have === 'past' ? 'past' : 'pres');
      if (vp.modal) r.tense = 'pres';
      if (allowed) r.ok = !!(r.tense === 'past' ? allowed.past : (allowed.pres || allowed.prog || (vp.modal && allowed.fut)));
      return r;
    }
    if (vp.tp) {
      r.modal = null;
      if (vp.tp === 'past') r.tense = 'past'; else if (vp.tp === 'fut') r.modal = 'will'; else { r.asp = 'prog'; r.progBe = true; }
      if (allowed) r.ok = !!(vp.tp === 'past' ? allowed.past : vp.tp === 'fut' ? (allowed.fut || allowed.pres || allowed.prog) : (allowed.prog || allowed.pres || allowed.fut));
      return r;
    }
    if (vp.semi) {
      var sm = SEMI[vp.semi]; r.semi = vp.semi;
      if (sm.only) r.tense = 'past';
      else if (sm.fixed) r.tense = 'pres';
      else if (cfg.auto.verb) { if (allowed && !allowed.pres && !allowed.prog && !allowed.fut && allowed.past) r.tense = 'past'; }
      else r.tense = vp.semiW && vp.semiW.t === 'past' ? 'past' : 'pres';
      if (allowed && !sm.fixed) r.ok = !!(r.tense === 'past' ? allowed.past : (allowed.pres || allowed.fut || allowed.prog));
      return r;
    }
    if (cfg.auto.verb) {
      var wantPast = vp.be ? vp.be === 'past' : vp.vf === 'past';
      if (vp.modal) { if (allowed && !allowed.pres && !allowed.prog && !allowed.fut && allowed.past) r.modal = MODAL_TO_PAST[vp.modal] || vp.modal; }
      else if (wantPast && (!allowed || allowed.past)) r.tense = 'past';
      else if (allowed) {
        if (allowed.pres || (allowed.prog && asp === 'prog')) r.tense = 'pres';
        else if (allowed.past) r.tense = 'past';
        else if (allowed.fut) r.modal = 'will';
        else if (allowed.prog) r.tense = 'pres';
      }
      return r;
    }
    r.tense = vp.be ? vp.be : (vp.vf === 'past' ? 'past' : 'pres');
    if (!allowed) return r;
    var key = r.modal ? (MODAL_PAST[r.modal] ? 'mpast' : 'mpres') : r.tense + (asp === 'prog' ? 'prog' : '');
    var ok = key === 'pres' ? (allowed.pres || (asp !== 'simple' && allowed.prog)) : key === 'presprog' ? (allowed.prog || allowed.pres || allowed.fut) : (key === 'past' || key === 'pastprog') ? allowed.past : key === 'mpres' ? (allowed.fut || allowed.pres || allowed.prog) : true;
    r.ok = !!ok; return r;
  }
  function beForm(tense, s) { var sg3 = !s.pl && (s.p === 3 || s.p === 1); if (tense === 'past') return sg3 ? 'was' : 'were'; if (!s.pl && s.p === 1) return 'am'; return !s.pl && s.p === 3 ? 'is' : 'are'; }
  function subjInfo(np) { if (!np) return { p: 2, pl: 0 }; if (np.pron) return { p: PRON[np.pron].p, pl: PRON[np.pron].pl }; return { p: 3, pl: np.num === 'pl' ? 1 : 0 }; }
  function vpRealize(vp, s, td, marks) {
    var p = [], v = vp.verb, modal = td.modal, sg3 = s.p === 3 && !s.pl;
    var freq = vp.freq ? vp.freq.w : null;
    var rest = function () { if (td.asp === 'cop') p.push('be'); else if (td.asp === 'prog') p.push('be', Dict.ing(v)); else if (td.asp === 'pass') p.push('be', Dict.pp(v)); else p.push(Dict.base(v)); };
    var perfTail = function () { if (!v) { p.push('been'); return; } if (vp.be || td.asp === 'prog' || td.asp === 'pass') { p.push('been', td.asp === 'pass' ? Dict.pp(v) : Dict.ing(v)); } else p.push(Dict.pp(v)); };
    if (td.perf && !td.semi) {
      if (modal) { p.push(vp.neg ? negOf(modal) : modal); if (freq) p.push(freq); p.push('have'); }
      else { var hf0 = td.tense === 'past' ? 'had' : sg3 ? 'has' : 'have'; p.push(vp.neg ? negOf(hf0) : hf0); if (marks && hf0 === 'has' && !vp.neg) marks.push('has'); if (freq) p.push(freq); }
      perfTail();
    } else if (modal) {
      p.push(vp.neg ? negOf(modal) : modal); if (freq) p.push(freq); rest();
    } else if (td.semi) {
      var sm = SEMI[td.semi];
      if (sm.be) { var bf0 = beForm(td.tense, s); p.push(vp.neg ? negOf(bf0) : bf0); if (marks && bf0 === 'is' && !vp.neg) marks.push('is'); if (freq) p.push(freq); p.push('going to'); }
      else if (sm.only) { if (freq) p.push(freq); p.push(vp.neg ? "didn't use to" : 'used to'); }
      else if (sm.fixed) { p.push(vp.neg ? "wouldn't like to" : 'would like to'); }
      else if (vp.neg) { p.push(negOf(td.tense === 'past' ? 'did' : sg3 ? 'does' : 'do')); if (freq) p.push(freq); p.push(sm.b + ' to'); }
      else { if (freq) p.push(freq); var hf = td.tense === 'past' ? sm.past : sg3 ? (sm.s3 || sm.b + 's') : sm.b; if (sg3 && td.tense !== 'past' && marks) marks.push(hf); p.push(hf + ' to'); }
      rest();
    } else if (vp.be || td.progBe) {
      var bf = beForm(td.tense, s); p.push(vp.neg ? negOf(bf) : bf); if (marks && bf === 'is' && !vp.neg) marks.push('is'); if (freq) p.push(freq);
      if (td.asp === 'prog') p.push(Dict.ing(v)); else if (td.asp === 'pass') p.push(Dict.pp(v));
    } else {
      if (vp.neg) { p.push(negOf(td.tense === 'past' ? 'did' : sg3 ? 'does' : 'do')); if (freq) p.push(freq); p.push(Dict.base(v)); }
      else { if (freq) p.push(freq); var vf = td.tense === 'past' ? Dict.past(v) : sg3 ? Dict.s3(v) : Dict.base(v); if (sg3 && td.tense !== 'past' && marks) marks.push(vf.split(' ')[0]); p.push(vf); }
    }
    vp.advs.forEach(function (a) { p.push(advText(a)); });
    return p.join(' ');
  }
  function tokText(t, role) {
    switch (t.t) { case 'NP': return npText(t, role === 'obj' ? 'obj' : 'sub'); case 'AP': return apText(t, true); default: return chunkText(t); }
  }
  // 1つの節を評価・文字列化
  function evalClause(cl, cfg, sv) {
    var errs = [], s = subjInfo(cl.subj), vp = cl.vp;
    cl.flags.forEach(function (f) { errs.push(E_(f, { v: vp.verb ? vp.verb.w : 'be' })); });
    var times = timeTokens(cl), places = cl.pre.concat(cl.posts, cl.comps).filter(function (t) { return (t.t === 'ADV' && t.ak === 'place') || (t.t === 'PP' && t.cat === 'place') || (t.t === 'ID' && t.ik === 'place'); });
    // 時の語は、時制がかみ合えば2つまでOK(yesterday + in the morning)。矛盾する組み合わせ(yesterday + tomorrow)はダメ
    // 「日」+「時刻・時間帯」の組み合わせ(yesterday + in the morning)だけは2つでもOK
    var TOD = function (t) { var x = String(t.w || ""); return /\b(morning|afternoon|evening|noon|midnight|o'clock|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/.test(x) && !/\b(every|last|next|this|tomorrow|yesterday)\b/.test(x); };
    var ao = times.length === 2 && allowedOf(times), okPair = ao && Object.keys(ao).length && (TOD(times[0]) !== TOD(times[1]));
    if ((times.length > 1 && !okPair) || (sv && sv.frontTime && times.length)) errs.push(E_('dupTime'));
    if (places.length > 1) errs.push(E_('dupPlace'));
    var allowed = allowedOf(times), td = decideTense(vp, allowed, cfg);
    if (!td.ok) { var t0 = times[0], a = allowed || {}; errs.push(E_('tense', { t: t0.w, w: a.past && !a.pres && !a.fut ? '過去' : a.fut && !a.pres && !a.past ? '未来' : a.pres && !a.past ? 'いま・ふだん' : 'その時' })); }
    var nfTi = {};
    cl.comps.forEach(function (c, ci) {
      if (c.t === 'NF' && vp.verb && vp.verb.cv) {
        var need = vp.verb.cv; if (need !== 'both' && c.ti !== need) { if (cfg.auto.ti) nfTi[ci] = need; else errs.push(E_('cv', { v: vp.verb.w, f: need === 'to' ? 'to + 動詞' : '動詞の -ing' })); }
      }
    });
    var postTi = {};
    cl.posts.forEach(function (c, ci) { if (c.t === 'NF' && c.ti !== 'to') { if (cfg.auto.ti) postTi[ci] = 'to'; else errs.push(E_('purposeTo')); } });
    var parts = [], marks = [];
    var preTxt = cl.pre.map(function (t) { return tokText(t); }).join(' ');
    if (preTxt) parts.push(preTxt + ',');
    if (cl.subj) parts.push(tokText(cl.subj, 'sub'));
    parts.push(vpRealize(vp, s, td, marks));
    cl.comps.forEach(function (c, ci) { parts.push(c.t === 'NF' ? nfText(c, nfTi[ci]) : tokText(c, 'obj')); });
    cl.posts.forEach(function (c, ci) { parts.push(c.t === 'NF' ? nfText(c, postTi[ci] || c.ti) : tokText(c, 'obj')); });
    return { errs: errs, text: parts.join(' '), times: times.length, past: td.tense === 'past' || MODAL_PAST[td.modal], marks: marks };
  }
  var SEV = { needSubj: 1, needObj: 1, needComp: 1, needVerb: 1 };
  function sevOf(errs) { var s = 0; errs.forEach(function (e) { s = Math.max(s, SEV[e.code] ? 1 : 2); }); return s; }
  function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function finishText(s) { s = s.replace(/\s+/g, ' ').replace(/ ,/g, ',').trim(); s = capFirst(s); s = s.replace(/([?!]) ([a-z])/g, function (m, a, b) { return a + ' ' + b.toUpperCase(); }); return s.replace(/\bi\b/g, 'I'); }

  function parse(T, cfg) {
    if (!T.length) return { ok: false, sev: 2, err: E_('order') };
    var alts = parseAll(T, false), best = null;
    alts.forEach(function (a) {
      if (a.partial) return;
      var errs = [], texts = [], frontText = '', frontTime = 0, past = false, marks = [];
      if (a.kind === 'CL') {
        var r0 = evalClause(a.cl, cfg); errs = r0.errs;
        var cand = { ok: false, kind: 'CL', errs: errs, text: a.conj.v + ' ' + r0.text, times: r0.times, alt: a };
        cand.sev = sevOf(errs); cand.rank = cand.sev * 100 + 50; if (!best || cand.rank < best.rank) best = cand; return;
      }
      if (a.front) {
        if (a.front.tok) { var ft = a.front.tok; frontText = ft.t === 'CL' ? ft.text + ',' : (/[?!]$/.test(ft.e.w) ? ft.e.w : ft.e.w + ','); frontTime = ft.t === 'CL' ? ft.times : 0; }
        else { var rf = evalClause(a.front.cl, cfg); errs = errs.concat(rf.errs); marks = marks.concat(rf.marks); frontText = a.front.conj.v + ' ' + rf.text + ','; frontTime = rf.times; }
      }
      a.cls.forEach(function (cl, ci) { var r = evalClause(cl, cfg, { frontTime: ci === 0 ? frontTime : 0 }); errs = errs.concat(r.errs); texts.push(r.text); past = past || r.past; marks = marks.concat(r.marks); });
      var body = texts[0] + (a.co ? (a.co.v === 'and' || a.co.sub ? ' ' + a.co.v + ' ' : ', ' + a.co.v + ' ') + texts[1] : '');
      var cand2 = { kind: 'S', errs: errs, text: finishText((frontText ? frontText + ' ' : '') + body + '.'), alt: a, past: past, marks: marks };
      cand2.sev = sevOf(errs); cand2.rank = cand2.sev * 100 + a.cls[0].pre.length + (a.front && a.front.cl ? -a.front.cl.posts.length * 0.1 : 0);
      if (!best || cand2.rank < best.rank || (cand2.sev === best.sev && best.kind === 'CL')) best = cand2;
    });
    if (!best) {
      if (!T.some(function (t) { return t.t === 'VP'; })) return { ok: false, sev: 1, err: E_('needVerb') };
      return { ok: false, sev: 2, err: E_('order') };
    }
    if (best.sev === 0) {
      var a = best.alt, info = { front: !!(a.front), clause: !!(a.front && (a.front.cl || (a.front.tok && a.front.tok.t === 'CL'))) || best.kind === 'CL' || !!(a.co && a.co.sub), coord: !!(a.co && !a.co.sub), past: !!best.past };
      if (best.kind === 'CL') return { ok: true, kind: 'CL', text: best.text, times: best.times, info: info };
      return { ok: true, kind: 'S', text: best.text, info: info, marks: best.marks || [], alt: a };
    }
    return { ok: false, sev: best.sev, err: best.errs.filter(function (e) { return (SEV[e.code] ? 1 : 2) === best.sev; })[0] || best.errs[0], text: best.text };
  }
  // 単語の集まりが1つのチャンクになるか(並び順が違っていても、正しい順に並べ直せればOK)
  function perms(a) { if (a.length <= 1) return [a]; var out = []; a.forEach(function (x, i) { perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(function (p) { out.push([x].concat(p)); }); }); return out; }
  function asChunk(words, cfg) {
    // 形の誤り(be + arrive など)だけなら、動詞の形を合わせて通す
    function fit(ws) {
      var q = chainState(ws, cfg); if (q.complete && !q.err) return { q: q, ws: ws };
      if (q.complete) for (var i = 0; i < ws.length; i++) if (ws[i].k === 'v') {
        var F = ['base', 'past', 'pp', 'ing'];
        for (var j = 0; j < 4; j++) { if (F[j] === (ws[i].f || 'base')) continue; var c = {}; for (var key in ws[i]) c[key] = ws[i][key]; c.f = F[j]; var w2 = ws.slice(); w2[i] = c; var q2 = chainState(w2, cfg); if (q2.complete && !q2.err) return { q: q2, ws: w2 }; }
      }
      return { q: q, ws: null };
    }
    var f0 = fit(words), s = f0.q;
    if (f0.ws) return { chunk: s.chunk, prefix: true, words: f0.ws };
    var pre = s.prefix, best = null;
    if (words.length <= 5) perms(words).forEach(function (p) { if (best) return; var fq = fit(p), q = fq.q; if (fq.ws) best = { chunk: q.chunk, prefix: true, words: fq.ws }; else if (q.prefix) pre = true; });
    return best || { chunk: null, prefix: pre };
  }
  // 一筆書きで拾った並びをチャンクにまとめる。1語ではチャンクにならない語(at・the など)は、次のバブルとくっつける
  function strokeTokens(units, cfg, partial) {
    var out = [], pend = [];
    for (var i = 0; i < units.length; i++) {
      var u = units[i];
      if (pend.length) {
        var s = chainState(pend.concat(u.words), cfg);
        if (s.complete && !s.err) { out.push(s.chunk); pend = []; continue; }
        if (s.prefix) { pend = pend.concat(u.words); continue; }
        return null;
      }
      if (u.chunk) { if (u.chunk.t === 'FR') out = out.concat(u.chunk.parts); else out.push(u.chunk); continue; }
      var s1 = chainState(u.words, cfg);
      if (s1.complete && !s1.err) out.push(s1.chunk); else if (s1.prefix) pend = u.words.slice(); else return null;
    }
    if (pend.length && partial) { out.pend = pend; return out; }
    return pend.length ? null : out;
  }
  // 途中の語(the / at / can など)が、ふつうに続けたら何のチャンクになるかを仮に作る(候補の判定用)
  function completePend(pend, cfg, samples) {
    for (var i = 0; i < samples.length; i++) {
      var ws = pend.concat(samples[i]);
      for (var k = 1; k <= samples[i].length; k++) { var st = chainState(pend.concat(samples[i].slice(0, k)), cfg); if (st.complete && !st.err) return st.chunk; }
    }
    return null;
  }
  function viable(T, strict) { // strict:確実に×になる並び(自動詞+目的語など)は「続けられない」とみなす
    if (!T.length) return true; var alts = parseAll(T, true);
    if (!strict) return alts.length > 0;
    return alts.some(function (a) {
      if (a.partial) return true;
      var cls = (a.cls || (a.cl ? [a.cl] : [])).concat(a.front && a.front.cl ? [a.front.cl] : []);
      return !cls.some(function (c) { return c.flags.some(function (f) { return !SEV[f]; }); });
    });
  }
  // 節チャンク(When I ran など)を作る
  // 文のかけら(S V など、まだ文になっていない並び)。あとで他とつなげられる
  function makeFrag(T) { var words = []; T.forEach(function (t) { words = words.concat(t.words || []); }); return { t: 'FR', words: words, parts: T.slice() }; }
  function makeClause(T, res) { var words = []; T.forEach(function (t) { words = words.concat(t.words || []); }); return { t: 'CL', words: words, parts: T.slice(), text: res.text, times: res.times || 0 }; }
  function wordCount(T) { var n = 0; T.forEach(function (t) { if (t.t === 'CL') n += wordCount(t.parts); else (t.words || []).forEach(function (w) { n += w.k === 'idm' ? w.e.w.split(' ').length : 1; }); }); return n; }

  return {
    PRON: PRON, PREP_G: PREP_G, MODALS: MODALS, SEMIS: SEMIS, SEMI: SEMI, TP_CYCLE: TP_CYCLE, DEGS: DEGS, CONJ_SUB: CONJ_SUB, CONJ_CO: CONJ_CO, QUANTS: QUANTS, MSG: MSG,
    codeOf: codeOf, chainState: chainState, strokeTokens: strokeTokens, asChunk: asChunk, canAppend: canAppend, tryInsert: tryInsert, rebuild: rebuild, cycleWord: cycleWord, cyclable: cyclable,
    chunkText: chunkText, label: label, wordText: wordText, gloss: gloss, parse: parse, viable: viable, makeClause: makeClause, makeFrag: makeFrag, completePend: completePend, wordCount: wordCount,
    err: E_, mergePron: mergePron, isCount: isCount
  };
})();
