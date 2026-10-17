import { CFG, DICT, G, LEVEL, rnd } from './base.js';
import { R, cur, first } from './play.js';
  // ---------------- 単語・カード ----------------
  export var E = {}; ['noun', 'verb', 'adj', 'adv'].forEach(function (p) { E[p] = {}; DICT.all(p).forEach(function (e) { E[p][e.w] = e; }); });
  export var KIND_JA = { pron: '代名詞', n: '名詞', v: '動詞', adj: '形容詞', adv: '副詞', t: 'つなぎ' };
  export var cid = 1;
  export function card(kind, w, extra) { var c = { id: cid++, kind: kind, w: w, bonus: 0 }; for (var k in extra || {}) c[k] = extra[k]; c.chips = baseChips(c); return c; }
  export function lvOf(c) { return (c.w.e && c.w.e.lv) || 1; }
  export function baseChips(c) { if (c.tsu) return 3; if (c.w.k === 'pr' && c.w.v === 'it') return 10; var b = { pron: 5, n: 10, v: 15, adj: 10, adv: 10 }[c.kind] || 5; return b + (lvOf(c) - 1) * 6; }
  export function mk(kind, word) {
    if (kind === 'pron') return card('pron', { k: 'pr', v: word });
    var pos = { n: 'noun', v: 'verb', adj: 'adj', adv: 'adv' }[kind], e = E[pos][word]; if (!e) return null;
    return card(kind, kind === 'n' ? { k: 'n', e: e, pl: false } : kind === 'v' ? { k: 'v', e: e, f: 'base' } : { k: kind, e: e });
  }
  export function starterDeck() {
    var L = [['pron', ['i', 'you', 'he', 'she', 'we', 'they']],
      ['n', ['apple', 'book', 'dog', 'cat', 'pizza', 'guitar', 'friend', 'teacher', 'sister', 'park', 'library', 'station', 'morning', 'Monday']],
      ['v', ['eat', 'read', 'play', 'like', 'buy', 'watch', 'go', 'run', 'make', 'see', 'write', 'swim', 'drink', 'study']],
      ['adj', ['big', 'small', 'new', 'happy', 'red', 'old']],
      ['adv', ['quickly', 'well', 'yesterday', 'today', 'here', 'slowly', 'tomorrow']]];
    var d = []; L.forEach(function (g) { g[1].forEach(function (w) { var c = mk(g[0], w); if (c) d.push(c); }); }); return d;
  }
  // つなぎの棚(何度でも使える)
  export var TSU = [
    ['冠詞', [['det', 'a'], ['det', 'the'], ['det', 'this'], ['det', 'that']]],
    ['所有', [['pos', 'i', 'my'], ['pos', 'you', 'your'], ['pos', 'he', 'his'], ['pos', 'she', 'her'], ['pos', 'we', 'our'], ['pos', 'they', 'their']]],
    ['前置詞', [['prep', 'in'], ['prep', 'at'], ['prep', 'on'], ['prep', 'to'], ['prep', 'with'], ['prep', 'for'], ['prep', 'from'], ['prep', 'by'], ['prep', 'up'], ['prep', 'down'], ['prep', 'out'], ['prep', 'off'], ['prep', 'away'], ['prep', 'back']]],
    ['助動詞', [['modal', 'can'], ['modal', 'will'], ['modal', 'must'], ['modal', 'should'], ['modal', 'may'], ['sm', 'want to'], ['sm', 'have to'], ['sm', 'need to'], ['sm', 'be going to']]],
    ['be/have/do', [['be', 'pres'], ['hv', 'pres'], ['do', 'pres'], ['not', ''], ['deg', 'very']]],
    ['つなぐ', [['conj', 'and'], ['conj', 'but'], ['conj', 'so'], ['conj', 'when'], ['conj', 'if'], ['conj', 'because'], ['rel', 'who', 'who'], ['rel', 'which', 'which'], ['rel', 'that', 'that']]]
  ];
  export var TSU_EASY = [
    ['前置詞', [['prep', 'to'], ['prep', 'with'], ['prep', 'for'], ['prep', 'from'], ['prep', 'up'], ['prep', 'out'], ['prep', 'off'], ['prep', 'back']]],
    TSU[1], TSU[3], TSU[4], TSU[5]
  ];
  export function curTSU() { return TSU; }
  export function tsuCard(spec) {
    var k = spec[0], w;
    if (k === 'pos') w = { k: 'pr', v: spec[1] }; else if (k === 'sm') w = { k: 'sm', v: spec[1], t: 'pres' }; else if (k === 'not') w = { k: 'not' }; else if (k === 'do') w = { k: 'do', v: 'pres', neg: false }; else w = { k: k, v: spec[1] };
    return card('t', w, { tsu: true, label: spec[2] || null });
  }
  export function cardText(c) {
    if (c.label) return c.label;
    if (c.w.k === 'do') return c.w.neg ? (c.w.v === 'past' ? "didn't" : "don't") : c.w.v === 'past' ? 'did' : 'do';
    var t = G.wordText(c.w, CFG); if (c.w.k === 'be') t = c.w.v === 'past' ? (c.w.neg ? 'be(過去・否定)' : 'be(過去)') : (c.w.neg ? 'be(否定)' : 'be'); if (c.w.k === 'hv') t = (c.w.v === 'past' ? 'had' : 'have') + (c.w.neg ? "n't" : ''); if (c.w.k === 'modal') t = c.w.neg ? ({ can: "can't", could: "couldn't", will: "won't", would: "wouldn't", must: "mustn't", should: "shouldn't", may: 'may not', might: 'might not' }[c.w.v] || c.w.v + ' not') : c.w.v;
    return t === 'i' ? 'I' : t;
  }
  export function colorOf(c) { var k = c.w.k; return k === 'n' || k === 'pr' || k === 'det' ? 'n' : k === 'v' ? 'v' : k === 'adj' || k === 'adv' || k === 'deg' ? 'm' : k === 'prep' ? 'p' : k === 'conj' || k === 'rel' ? 'c' : 'a'; }
  export function cyclable(c) { return !c.tsu && (c.kind === 'v' || (c.kind === 'n' && G.isCount(c.w.e) && !c.w.e.ind)) || (c.tsu && /^(be|hv|det|do|modal|sm)$/.test(c.w.k)); }
  export function cycle(c) {
    var w = c.w;
    if (w.k === 'v') { var F = ['base', 'past', 'pp', 'ing'], i = F.indexOf(w.f || 'base'); w.f = F[(i + 1) % 4]; }
    else if (w.k === 'n') w.pl = !w.pl;
    else if (w.k === 'be' || w.k === 'hv') { var st = (w.v === 'past' ? 1 : 0) + (w.neg ? 2 : 0); st = (st + 1) % 4; w.v = st & 1 ? 'past' : 'pres'; w.neg = !!(st & 2); } // 今 → 過去 → 否定 → 過去の否定
    else if (w.k === 'do') { var sd = (w.v === 'past' ? 1 : 0) + (w.neg ? 2 : 0); sd = (sd + 1) % 4; w.v = sd & 1 ? 'past' : 'pres'; w.neg = !!(sd & 2); } // do → did → don't → didn't
    else if (w.k === 'modal') { var FAM = { can: ['can', 'could'], could: ['can', 'could'], will: ['will', 'would'], would: ['will', 'would'], may: ['may', 'might'], might: ['may', 'might'], must: ['must'], should: ['should'] }[w.v] || [w.v], L = FAM.length * 2, si = FAM.indexOf(w.v) + (w.neg ? FAM.length : 0); si = (si + 1) % L; w.v = FAM[si % FAM.length]; w.neg = si >= FAM.length; } // can → could → can't → couldn't
    else if (w.k === 'sm') w.t = w.t === 'past' ? 'pres' : 'past'; // want to → wanted to
    else if (w.k === 'det') w.v = { a: 'the', the: 'a', 'this': 'that', that: 'this' }[w.v];
  }
  export var FORM_JA = { base: '原形・現在', past: '過去形', pp: '過去分詞', ing: '-ing形' };

  // ---------------- 判定:並びから文と「役」を出す ----------------
  export function isPlace(t) { return (t.t === 'PP' && (t.cat === 'place' || (t.np && t.np.noun && t.np.noun.cat === 'place'))) || (t.t === 'ADV' && t.ak === 'place') || (t.t === 'ID' && t.ik === 'place'); }
  export function isTime(t) { return (t.t === 'PP' && t.cat === 'time') || (t.t === 'ADV' && t.ak === 'time') || (t.t === 'ID' && t.ik === 'time'); }
  // ---- 後置修飾:名詞のうしろに -ing形/過去分詞/前置詞の句/関係代名詞の節 をつけて、ひとつの名詞のかたまりにする ----
  export function dummy(pr) { return G.chainState([{ k: 'pr', v: pr }], CFG).chunk; }
  export function chunkTx(t) { return t.t === 'NP' && t.pron ? G.PRON[t.pron].obj : G.chunkText(t, CFG); }
  export function isPerson(np) { return np.noun && /^(person|animal)$/.test(np.noun.cat); }
  export function mergeNP(np, extra, text, kind) { var m = {}; for (var k in np) m[k] = np[k]; m.words = np.words.concat([].concat.apply([], extra.map(function (t) { return t.words || []; }))); m.postText = (np.postText ? np.postText + ' ' : '') + text; m.postKind = kind; return m; }
  export function relClause(head, rel, R) { // 関係代名詞の節の文字列(だめなら null)
    if (rel === 'who' && !isPerson(head)) return null; if (rel === 'which' && head.noun && head.noun.cat === 'person') return null;
    if (R[0] && R[0].t === 'VP') { // 主語が抜けた形:who plays tennis
      var r = G.parse([dummy(head.num === 'pl' ? 'they' : 'he')].concat(R), CFG); if (r.ok && r.kind === 'S') return rel + ' ' + r.text.replace(/^\S+\s/, '').replace(/\.$/, '');
    }
    if (rel !== 'who' && R.length === 2 && R[0].t === 'NP' && R[1].t === 'VP' && R[1].verb && R[1].verb.fr !== 'intr') { // 目的語が抜けた形:that I bought
      var r2 = G.parse(R.concat([dummy('it')]), CFG); if (r2.ok && r2.kind === 'S') return rel + ' ' + r2.text.replace(/\s+it\.$/, '').replace(/^(\w)(\w*)/, function (m, a, b) { return m === 'I' ? m : a.toLowerCase() + b; });
    }
    return null;
  }
  export function postVariants(T) {
    var out = [];
    function gen(i, acc) {
      if (out.length > 40) return;
      if (i >= T.length) { out.push(acc); return; }
      var t = T[i]; gen(i + 1, acc.concat([t]));
      if (t.t !== 'NP' || t.pron || !t.noun) return;
      var nx = T[i + 1]; if (!nx) return;
      if (nx.t === 'PP') gen(i + 2, acc.concat([mergeNP(t, [nx], G.chunkText(nx, CFG), 'pp')]));
      var vp = nx;
      if (vp.t === 'PART') {
        for (var k = 1; k <= 2 && i + 2 + k <= T.length; k++) { // 分詞だけ(the cat watched)では名詞を説明できない。うしろに1つ以上必要
          var ab = T.slice(i + 2, i + 2 + k);
          if (ab.some(function (x) { return !/^(NP|PP|ADV)$/.test(x.t); })) break;
          if (ab.length && ab[0].t === 'NP' && (vp.vf === 'pp' || vp.verb.fr === 'intr')) break;
          gen(i + 2 + k, acc.concat([mergeNP(t, [vp].concat(ab), [G.wordText(vp.words[0], CFG)].concat(ab.map(chunkTx)).join(' '), vp.vf)]));
        }
      }
      if (nx.t === 'REL') for (var j = i + 3; j <= T.length; j++) { var tx = relClause(t, nx.v, T.slice(i + 2, j)); if (tx) gen(j, acc.concat([mergeNP(t, [nx].concat(T.slice(i + 2, j)), tx, 'rel')])); }
    }
    gen(0, []); return out;
  }
  // 並びをチャンクに区切る(長いチャンクから試す)→ 文として読めるかを調べる
  // ---- 並びの読みかえ:句動詞(end + up)、be/have のうしろの規則動詞は過去分詞、名詞の前の分詞=形容詞、-ing=動名詞 ----
  export var PARTICLE = ['up', 'down', 'out', 'off', 'away', 'back', 'on', 'in', 'over'];
  export function vtext(e, f) { return G.wordText({ k: 'v', e: e, f: f }, CFG); }
  export function regular(e) { return vtext(e, 'past') === vtext(e, 'pp'); }
  export function prevCore(ws, i) { for (var j = i - 1; j >= 0; j--) if (ws[j].k !== 'not' && ws[j].k !== 'deg' && ws[j].k !== 'adv') return ws[j]; return null; }
  export var MOTION_V = ['go', 'come', 'run', 'walk', 'move', 'fly', 'drive', 'travel', 'return', 'swim', 'jump', 'hurry', 'ride', 'climb', 'get', 'send', 'bring', 'take'];
  export function autoWord(k, v) { return { id: -1, kind: 't', tsu: true, auto: true, chips: 0, bonus: 0, w: { k: k, v: v } }; }
  export function autoInsert(ws, crow, skipAfterVerb) {
    var hasVerb = ws.some(function (w) { return /^(v|be|modal|sm|hv)$/.test(w.k); }), out = [], oc = [], changed = false, seenV = false, motion = false, past = ws.some(function (w) { return w.k === 'adv' && /yesterday|ago|last/.test(w.e.w); });
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i];
      if (!hasVerb && w.k === 'adj' && i > 0 && (ws[i - 1].k === 'n' || ws[i - 1].k === 'pr')) { var bw = autoWord('be', past ? 'past' : 'pres'); out.push(bw.w); oc.push(bw); changed = true; hasVerb = true; seenV = true; }
      if (w.k === 'n' && w.e && (w.e.cat === 'place' || w.e.cat === 'time') && seenV) {
        var j = i; while (j > 0 && (/^(det|adj)$/.test(ws[j - 1].k) || (ws[j - 1].k === 'pr' && crow[j - 1].tsu))) j--;
        var pw = ws[j - 1];
        if (pw && pw.k !== 'prep' && !(skipAfterVerb && pw.k === 'v')) {
          var pv = w.e.cat === 'time' ? (w.e.prep || 'on') : motion ? 'to' : (w.e.prep || 'in'), aw = autoWord('prep', pv), at = out.length - (i - j);
          out.splice(at, 0, aw.w); oc.splice(at, 0, aw); changed = true;
        }
      }
      if (w.k === 'v' || w.k === 'be') { seenV = true; if (w.k === 'v' && MOTION_V.indexOf(w.e.w.split(' ')[0]) >= 0) motion = true; }
      out.push(w); oc.push(crow[i]);
    }
    return changed ? { ws: out, crow: oc } : null;
  }
  export function fixEmph(r, emph) { if (!emph || r.state !== 'ok') return r; r.text = r.text.replace(/\b(do|does|did)(n't| not)\b/i, '$1'); r.f.neg = false; r.f.emph = true; if (r.ja) r.ja = r.ja.replace('(〜ない)', '(本当に)'); return r; }
  export function evaluate(row, quick) { try { return evaluateRaw(row, quick); } catch (e) { if (window.console) console.warn('evaluate', e); return { state: 'bad', msg: 'この並びは読めない。並べ直そう' }; } }
  export function evaluateRaw(row, quick) {
    if (!row.length) return { state: 'empty' };
    // 1) 句動詞をまとめる/be・have のうしろの規則動詞を過去分詞に(カード自体も切りかえる)
    var ws = [], crow = [], phr = false, doPast = false, emph = false;
    for (var i = 0; i < row.length; i++) {
      var w = row[i].w, nx = row[i + 1] && row[i + 1].w;
      if (w.k === 'do') { ws.push({ k: 'not' }); crow.push(row[i]); if (w.v === 'past') doPast = true; if (!w.neg) emph = true; continue; } // don't / didn't = 否定。do / did(強調)は not を付けて読んであとで外す
      if (w.neg && /^(be|hv|modal)$/.test(w.k)) { ws.push(w); crow.push(row[i]); ws.push({ k: 'not' }); crow.push(row[i]); continue; }
      if (LEVEL === 0 && w.k === 'v' && (w.f === 'base' || w.f === 'past') && w.e.fr !== 'intr') { // 初級:物が主語で be のあと・目的語なし → 受け身(The cake was eaten)
        var pvb = prevCore(row.map(function (c) { return c.w; }), i), sN = null; for (var si = i - 1; si >= 0; si--) { if (row[si].w.k === 'n') { sN = row[si].w; break; } if (row[si].w.k === 'pr' && !row[si].tsu) break; }
        var nxi = i + 1; while (row[nxi] && /^(det|adj)$/.test(row[nxi].w.k)) nxi++; var nxw = row[nxi] && row[nxi].w, objLike = nxw && (nxw.k === 'pr' && !row[nxi].tsu || (nxw.k === 'n' && !/^(place|time)$/.test(nxw.e.cat)));
        if (pvb && pvb.k === 'be' && sN && !/^(person|animal)$/.test(sN.e.cat) && !objLike) { var wp = {}; for (var kp in w) wp[kp] = w[kp]; wp.f = 'pp'; w = wp; }
      }
      if (doPast && w.k === 'v') { var wc = {}; for (var kk in w) wc[kk] = w[kk]; wc.f = 'past'; w = wc; doPast = false; }
      if (w.k === 'v' && w.f === 'past' && regular(w.e)) { var pv = prevCore(row.map(function (c) { return c.w; }), i); if (pv && (pv.k === 'be' || pv.k === 'hv')) { var wq = {}; for (var kq in w) wq[kq] = w[kq]; wq.f = 'pp'; w = wq; } } // カードは書きかえず、読むときだけ過去分詞に
      if (w.k === 'v' && nx && nx.k === 'prep' && PARTICLE.indexOf(nx.v) >= 0 && E.verb[w.e.w + ' ' + nx.v]) { ws.push({ k: 'v', e: E.verb[w.e.w + ' ' + nx.v], f: w.f }); crow.push(row[i]); i++; phr = true; continue; }
      ws.push(w); crow.push(row[i]);
    }
    var r = fixEmph(evalWords(crow, ws, row), emph);
    if (r.state === 'ok') { r.f.phrasal = phr; return r; }
    if (LEVEL === 0) { // 初級:場所・時の前置詞や be は、語順さえ合っていれば補う
      for (var vi = 0; vi < 2; vi++) { var ins = autoInsert(ws, crow, vi === 1); if (!ins) continue; var r3 = evalWords(ins.crow, ins.ws, row); if (r3.state === 'ok') { r3.f.phrasal = phr; return r3; } }
    }
    if (quick) return r;
    // 2) 読みかえを試す(分詞の形容詞・動名詞・規則動詞の過去⇄過去分詞)
    var opts = [];
    ws.forEach(function (w, k) {
      if (w.k !== 'v' || !(w.f === 'ing' || w.f === 'pp' || w.f === 'past')) return;
      var pv = prevCore(ws, k), nx = ws[k + 1], nx2 = ws[k + 2], alt = [];
      var nounNext = nx && (nx.k === 'n' || (nx.k === 'adj' && nx2 && nx2.k === 'n'));
      var txt = vtext(w.e, w.f === 'past' ? 'pp' : w.f);
      if ((w.f === 'ing' || w.f === 'pp' || (w.f === 'past' && regular(w.e))) && nounNext && w.e.w.indexOf(' ') < 0 && (!pv || /^(det|pr|adj|prep|v|conj)$/.test(pv.k)))
        alt.push({ w: { k: 'adj', e: { w: txt, lv: w.e.lv || 1, ja: w.e.ja, jt: 'i' } }, flag: 'padj' });
      if (w.f === 'ing' && w.e.w.indexOf(' ') < 0 && (!pv || /^(v|prep|conj)$/.test(pv.k)) && !(nx && /^(det|n|pr)$/.test(nx.k) && !pv)) {
        var ne = E.noun[txt] || { w: txt, c: 'u', ad: '', cat: 'act', tg: ['act'], lv: w.e.lv || 1, ja: (w.e.ja || '') + 'こと' };
        alt.push({ w: { k: 'n', e: ne, pl: false }, flag: 'gerund' });
      }
      if ((w.f === 'past' || w.f === 'pp') && regular(w.e)) alt.push({ w: { k: 'v', e: w.e, f: w.f === 'past' ? 'pp' : 'past' }, flag: null });
      if (alt.length) opts.push({ k: k, alt: alt });
    });
    var tries = 0, best = r;
    (function go(j, cur, flags) {
      if (best.state === 'ok' || tries > 12) return;
      if (j === opts.length) { if (!Object.keys(flags).length && cur === ws) return; tries++; var r2 = evalWords(crow, cur, row); if (r2.state === 'ok') { r2.f.phrasal = phr; for (var f in flags) r2.f[f] = true; best = r2; } return; }
      go(j + 1, cur, flags);
      opts[j].alt.forEach(function (a) { var c2 = cur.slice(); c2[opts[j].k] = a.w; var f2 = {}; for (var x in flags) f2[x] = 1; if (a.flag) f2[a.flag] = 1; go(j + 1, c2, f2); });
    })(0, ws, {});
    return best;
  }
  export function evalWords(row, words, fullRow) {
    var n = words.length;
    var memo = {}, segErr = null, far = 0, found = null, bestBad = null, tried = 0;
    function cs(i, j) { var k = i + ':' + j; if (!(k in memo)) memo[k] = words.slice(i, j).some(function (w) { return w.k === 'rel'; }) ? {} : G.chainState(words.slice(i, j), CFG); return memo[k]; }
    function dfs(i, T) {
      if (found || tried > 400) return;
      if (i === n) {
        tried++; var vars = postVariants(T), r = null;
        for (var vi = 0; vi < vars.length; vi++) { var r1 = G.parse(vars[vi], CFG); if (r1.ok && r1.kind === 'S') { found = { r: r1, T: vars[vi] }; return; } if (!r) r = r1; }
        var v = G.viable(T, true), cand = { r: r, wait: v && r.sev === 1 };
        if (!bestBad || (cand.wait && !bestBad.wait) || (cand.r.sev < bestBad.r.sev)) bestBad = cand;
        return;
      }
      if (i > far) far = i;
      if (words[i].k === 'rel') { T.push({ t: 'REL', v: words[i].v, words: [words[i]] }); dfs(i + 1, T); T.pop(); return; }
      var pw = words[i]; if (pw.k === 'v' && (pw.f === 'ing' || pw.f === 'pp') && i > 0) { T.push({ t: 'PART', verb: pw.e, vf: pw.f, words: [pw] }); dfs(i + 1, T); T.pop(); if (found) return; } // 分詞(後置修飾の材料)
      for (var j = n; j > i; j--) {
        var st = cs(i, j);
        if (st.complete && !st.err) { T.push(st.chunk); dfs(j, T); T.pop(); if (found) return; }
        else if (st.complete && st.err && !segErr) segErr = st.err;
      }
    }
    dfs(0, []);
    if (found) { var sm = semantic(found.r); if (sm) return { state: 'bad', msg: sm }; return { state: 'ok', text: found.r.text, f: features(found.r, fullRow), nps: nounPhrases(found.r), ja: jaOf(found.r), r: found.r }; }
    if (bestBad) return { state: bestBad.wait ? 'wait' : 'bad', msg: bestBad.r.err ? bestBad.r.err.msg : 'まだ文になっていない' };
    // 区切れない:どこで止まったか
    var tail = cs(far, n);
    if (segErr) return { state: 'bad', msg: segErr.msg };
    if (tail.prefix) return { state: 'wait', msg: '「' + cardText(row[n - 1]) + '」の後ろに続きが必要' };
    return { state: 'bad', at: far, atCard: row[far], msg: '「' + cardText(row[far]) + '」のところで つながらない' };
  }
  // 意味のチェック(英語脳の辞書の情報):動詞の目的語に合う名詞か/場所・時・食べ物が主語になっていないか
  export var THING_OK = ['go', 'come', 'run', 'move', 'stop', 'start', 'begin', 'change', 'open', 'close', 'break', 'fall', 'work', 'arrive', 'leave', 'turn', 'fly', 'grow', 'shine', 'happen', 'end', 'ring', 'burn', 'melt', 'float', 'sink', 'roll', 'shake', 'hurt', 'cost', 'smell', 'taste', 'sound', 'look'];
  export function headNoun(np) { if (!np || np.t !== 'NP' || np.pron) return null; if (np.noun) return np.noun; var w = (np.words || []).filter(function (x) { return x.k === 'n'; }).pop(); return w ? w.e : null; }
  export function semantic(r) {
    var bad = null;
    r.alt.cls.forEach(function (cl) {
      if (bad) return; var vp = cl.vp, v = vp.verb, sn = headNoun(cl.subj);
      if (sn && v && !vp.be && !/^(person|animal)$/.test(sn.cat) && THING_OK.indexOf(v.w) < 0) bad = '「' + sn.w + '」が ' + v.w + ' するのは意味が変(主語は人か動物に)';
      if (bad || !v || vp.be) return; var ot = (v.ot || []).filter(function (t) { return t !== 'any'; });
      if (!ot.length) return;
      cl.comps.forEach(function (t) { var e = headNoun(t); if (bad || !e) return; var tags = [e.cat].concat(e.tg || []); if (ot.some(function (x) { return tags.indexOf(x) >= 0; })) return; var foodOnly = ot.every(function (x) { return /^(food|drink)$/.test(x); }); if (foodOnly || /^(person|animal|place|time)$/.test(e.cat)) bad = '「' + v.w + '」の目的語に「' + e.w + '」は合わない'; }); // 物の名詞はゆるく通す
    });
    return bad;
  }
  // チャンクごとの日本語(直訳ふう)
  export function jaOf(r) {
    try {
      var past = !!r.info.past;
      function clJa(cl) {
        var o = [], vp = cl.vp, mods = cl.pre.concat(cl.posts);
        if (cl.subj) o.push(G.gloss(cl.subj) + 'は');
        mods.filter(isTime).forEach(function (t) { o.push(G.gloss(t)); });
        mods.filter(function (t) { return !isTime(t); }).forEach(function (t) { o.push(G.gloss(t)); });
        cl.comps.forEach(function (t) { o.push(G.gloss(t) + (t.t === 'NP' && !(vp.be && !vp.verb) ? 'を' : '')); });
        var v = G.gloss(vp).replace(/\(〜ない\)/, '');
        if (vp.be && vp.verb && vp.vf === 'pp') v += '(〜される)'; else if (vp.be && vp.verb && vp.vf === 'ing') v += '(〜している)'; else if (vp.have) v += '(〜したところ・したことがある)';
        if (vp.neg) v += '(〜ない)';
        o.push(v); return o.filter(Boolean).join(' / ');
      }
      var parts = [], a = r.alt;
      if (a.front && a.front.cl) parts.push('〈' + a.front.conj.v + '〉' + clJa(a.front.cl));
      a.cls.forEach(function (cl, i) { parts.push((i && a.co ? '〈' + a.co.v + '〉' : '') + clJa(cl)); });
      return parts.join('、') + (past ? '(過去)' : '');
    } catch (e) { return ''; }
  }
  // ざっくりしたエラーを、何をすればいいかの言葉にする
  export function advise(row) {
    var cs = row.filter(function (c) { return !c.tsu || /^(be|hv|modal|sm)$/.test(c.w.k); }), K = function (c) { return c.kind === 'pron' || c.kind === 'n' ? 'N' : c.kind === 'v' || /^(be|hv)$/.test(c.w.k) ? 'V' : c.kind === 'adj' ? 'A' : c.kind === 'adv' ? 'D' : /^(modal|sm)$/.test(c.w.k) ? 'M' : 'x'; };
    var seq = cs.map(K).join(''), hasConj = row.some(function (c) { return /^(conj|rel)$/.test(c.w.k); });
    if (seq.indexOf('V') < 0) return '動詞(v.)か be を置こう';
    if (seq.charAt(0) === 'V' && !hasConj) return '文の最初に主語(I / he / the dog など)を置こう';
    if (/V[^V]*V/.test(seq.replace(/MV/g, 'V')) && !hasConj && !row.some(function (c) { return c.w.k === 'v' && /ing|pp/.test(c.w.f); })) return '動詞が2つある。1つ外すか、and / when / because でつなごう';
    if (/^N+N/.test(seq) && seq.indexOf('NV') > 1) return '動詞の前に名詞が2つ。目的語は動詞のうしろへ';
    if (/VNN/.test(seq) && !row.some(function (c) { return c.w.k === 'prep'; })) return '名詞が2つ続いている。間に前置詞(in / with など)を入れよう';
    if (/NA/.test(seq) && !row.some(function (c) { return c.w.k === 'be'; })) return '形容詞は名詞の前か、be のうしろに置こう';
    if (/^AN|^DN/.test(seq)) return '主語の前に形容詞・副詞が来ている。順番を見直そう';
    return '';
  }
  export function nounPhrases(r) {
    var out = [], add = function (t) { if (!t) return; if (t.t === 'NP') out.push(t); if (t.t === 'PP' && t.np) out.push(t.np); };
    var cl = function (c) { if (!c) return; add(c.subj); (c.comps || []).forEach(add); (c.posts || []).forEach(add); (c.pre || []).forEach(add); };
    r.alt.cls.forEach(cl); if (r.alt.front) { cl(r.alt.front.cl); add(r.alt.front.tok); }
    return out.map(function (np) { return { pron: np.pron || null, w: np.noun ? np.noun.w : null, det: np.det, poss: np.poss, num: np.num, person: !!(np.noun && /^(person|animal)$/.test(np.noun.cat)) }; });
  }
  export function clWords(cl) { var w = []; if (!cl) return w; [cl.subj, cl.vp].concat(cl.comps || [], cl.posts || [], cl.pre || []).forEach(function (t) { if (t && t.words) w = w.concat(t.words); }); return w; }
  export var COMPAT = { write: ['read'], cook: ['food'], make: ['food', 'drink'], drink: [], open: ['read'] }; // 辞書のタグで足りない自然な組み合わせ
  export function features(r, row) {
    var a = r.alt, cls = a.cls, main = cls[0], vp = main.vp, f = { words: row.length, adj: 0, rare: 0 };
    row.forEach(function (c) { if (c.w.k === 'adj') f.adj++; if (!c.tsu && lvOf(c) >= 2) f.rare++; });
    f.cats = {}; row.forEach(function (c) { var k = c.w.k; if (k === 'n') { f.cats[c.w.e.cat] = 1; if (c.w.pl) f.plural = true; } if (k === 'det') f['det_' + c.w.v] = true; if (k === 'pr' && c.w.v === 'it' && !c.tsu) f.it = true; if (c.guest || c.by === 'guest') f.guest = true; });
    var nO = main.comps.filter(function (t) { return t.t === 'NP'; }).length;
    f.O = nO >= 1; f.O2 = nO >= 2; f.C = main.comps.some(function (t) { return t.t === 'AP'; }) || (!!vp.be && !vp.verb && nO >= 1);
    f.aux = !!(vp.modal || vp.semi); f.prog = !!(vp.be && vp.verb && vp.vf === 'ing'); f.passive = !!(vp.be && vp.verb && vp.vf === 'pp'); f.perfect = !!vp.have; f.neg = !!vp.neg;
    f.pronSubj = !!(main.subj && main.subj.pron);
    // 主節の飾り(場所・時・様子)は種類ごとに1つまで。2つ目からは点にしない
    var mods = main.pre.concat(main.comps, main.posts); if (a.front && a.front.tok) mods.push(a.front.tok);
    var seen = {}, dup = [];
    mods.forEach(function (t) { var k = isPlace(t) ? 'place' : isTime(t) ? 'time' : (t.t === 'ADV' && t.ak === 'manner') ? 'manner' : null; if (!k) return; if (seen[k]) dup = dup.concat(t.words || []); seen[k] = 1; });
    f.place = !!seen.place; f.time = !!seen.time; f.manner = seen.manner || (vp.advs || []).length ? 1 : 0;
    f.dupWords = dup;
    // 2つ目の文(and/but のうしろ、when/if の節)はカードの点が半分、要素も数えない
    var sub = []; cls.slice(1).forEach(function (c) { sub = sub.concat(clWords(c)); }); if (a.front && a.front.cl) sub = sub.concat(clWords(a.front.cl));
    f.halfWords = sub;
    f.post = cls.some(function (cl) { return [cl.subj].concat(cl.comps, cl.posts).some(function (t) { return t && t.postKind; }); });
    f.past = !!r.info.past; f.clause = !!r.info.clause; f.coord = !!r.info.coord;
    f.hasArt = row.some(function (c) { return c.w.k === 'det'; }); f.hasPP = mods.some(function (t) { return t.t === 'PP'; });
    // 動詞と目的語の相性
    var v = vp.verb; f.colloc = null; f.pair = null;
    if (v && !vp.be) {
      var ot = (v.ot || []).filter(function (x) { return x !== 'any'; }), on = main.comps.filter(function (t) { return t.t === 'NP' && !t.pron && t.noun; })[0];
      if (ot.length && on) { var e = on.noun, tags = [e.cat].concat(e.tg || [], COMPAT[v.w] && (e.tg || []).some(function (x) { return COMPAT[v.w].indexOf(x) >= 0; }) ? ot : []), m = ot.filter(function (x) { return tags.indexOf(x) >= 0; }); f.pair = v.w + ' + ' + e.w; f.colloc = m.some(function (x) { return x !== 'thing'; }) && ot.indexOf('thing') < 0 && ot.length <= 3 ? 'good' : m.length ? null : 'bad'; }
    }
    f.combo = f.colloc === 'good';
    // 進行形・受け身は、実際にできた文の形で決める(読みかえとずれないように)
    if (vp.verb && vp.be) {
      var txt = ' ' + r.text.toLowerCase().replace(/[.,!?]/g, '') + ' ', ing = first(vtext(vp.verb, 'ing')), pp = first(vtext(vp.verb, 'pp'));
      var beRe = '(am|is|are|was|were|be|been|isn\'t|aren\'t|wasn\'t|weren\'t)( not)?( \\w+ly)? ';
      var isIng = new RegExp(' ' + beRe + ing + ' ').test(txt), isPP = new RegExp(' ' + beRe + pp + ' ').test(txt);
      if (isIng || isPP) { f.prog = isIng; f.passive = !isIng && isPP; }
    }
    // 主節以外(when/if の節・and のうしろ)の文法も、お題の判定には数える
    var sub = {}; cls.slice(1).concat(a.front && a.front.cl ? [a.front.cl] : []).forEach(function (cl) {
      var v2 = cl.vp; if (!v2) return;
      if (v2.be && v2.verb) { var t2 = ' ' + r.text.toLowerCase().replace(/[.,!?]/g, '') + ' ', b2 = '(am|is|are|was|were|be|been|isn\'t|aren\'t|wasn\'t|weren\'t)( not)? '; if (new RegExp(' ' + b2 + first(vtext(v2.verb, 'ing')) + ' ').test(t2)) sub.prog = 1; else if (new RegExp(' ' + b2 + first(vtext(v2.verb, 'pp')) + ' ').test(t2)) sub.passive = 1; } if (v2.have) sub.perfect = 1; if (v2.modal || v2.semi) sub.aux = 1; if (v2.neg) sub.neg = 1;
      if (cl.comps.some(function (t) { return t.t === 'NP'; })) sub.O = 1; if (cl.comps.some(function (t) { return t.t === 'AP'; }) || (v2.be && !v2.verb)) sub.C = 1;
      var m2 = cl.pre.concat(cl.posts); if (m2.some(isPlace)) sub.place = 1; if (m2.some(isTime)) sub.time = 1;
    });
    f.sub = sub;
    return f;
  }
  // 話のつながり:前の文に出た名詞を the / this / that / 所有格 か代名詞で受ける
  export function storyOf(nps, prev) {
    if (!prev || !prev.length || !nps) return null; var res = null;
    nps.forEach(function (np) {
      if (np.pron === 'it' && prev.some(function (p) { return p.w && !p.person && p.num !== 'pl'; })) res = 'pron';
      else if ((np.pron === 'he' || np.pron === 'she') && prev.some(function (p) { return p.w && p.person && p.num !== 'pl'; })) res = 'pron';
      else if (np.pron === 'they' && prev.some(function (p) { return p.num === 'pl' && (p.w || (p.pron && p.pron !== 'i' && p.pron !== 'you')); })) res = 'pron';
      else if (!res && np.w && (np.det === 'the' || np.det === 'this' || np.det === 'that' || np.poss) && prev.some(function (p) { return p.w === np.w; })) res = 'def';
    });
    return res;
  }
  // 役とカードの点(ジョーカー・ボス・くり返しの前)
  export function baseScore(row, ev) {
    var f = ev.f, y = yaku(f), chips = y.chips, mult = y.mult, steps = [{ t: 'yaku', label: y.name, chips: chips, mult: mult }];
    var dup = f.dupWords || [], half = f.halfWords || [];
    row.forEach(function (c, i) {
      var v = c.chips + (c.bonus || 0), tag = '';
      if (dup.indexOf(c.w) >= 0) { v = 0; tag = '重複'; } else if (half.indexOf(c.w) >= 0) { v = Math.floor(v / 2); tag = '½'; }
      chips += v; steps.push({ t: 'card', i: i, add: v, tag: tag, chips: chips, mult: mult });
    });
    return { y: y, chips: chips, mult: mult, steps: steps };
  }
  // 役(文の型)の点。お店の「文型の本」でレベルが上がる
  export var PARTS = [
    ['SV', 'S+V', 10, 1], ['O', '+O', 10, 1], ['O2', '+O2', 15, 1], ['C', '+C', 10, 1], ['place', '+場所', 10, 1], ['time', '+時', 10, 1], ['manner', '+様子', 5, 1],
    ['aux', '助動詞', 5, 1], ['prog', '進行形', 10, 1], ['perfect', '完了形', 20, 2], ['passive', '受け身', 20, 2], ['neg', '否定', 5, 1], ['past', '過去', 5, 1], ['clause', '節', 15, 1], ['post', '後置修飾', 25, 2],
    ['phrasal', '句動詞', 15, 1], ['gerund', '動名詞', 20, 2], ['padj', '分詞の形容詞', 15, 1], ['combo', '名コンビ', 0, 2], ['story', 'つながり', 0, 2], ['storyP', '代名詞で受ける', 0, 3]
  ];
  export var PART_JA = {}; PARTS.forEach(function (p) { PART_JA[p[0]] = p[1]; });
  export function yaku(f) {
    var on = PARTS.filter(function (p) { return p[0] === 'SV' || f[p[0]]; }), chips = 0, mult = 0;
    on.forEach(function (p) { var lv = (R && R.lv && R.lv[p[0]]) || 0; chips += p[2] + lv * 10; mult += p[3] + lv; });
    var main = on.filter(function (p) { return /^(SV|O|O2|C|place|time|manner)$/.test(p[0]); }).map(function (p) { return p[1]; }).join('').replace(/^S\+V/, 'S+V');
    var extra = on.filter(function (p) { return !/^(SV|O|O2|C|place|time|manner)$/.test(p[0]); }).map(function (p) { return p[1]; });
    return { name: main + (extra.length ? '・' + extra.join('・') : ''), chips: chips, mult: mult, parts: on };
  }

  // ---------------- ジョーカー ----------------
  export var JOKERS = [
    { id: 'past', name: '過去マニア', desc: '過去の文は 倍率×2', price: 6, fx: function (f) { return f.past ? [['x', 2]] : []; } },
    { id: 'adj', name: 'かざり職人', desc: '形容詞1つごとに チップ+20', price: 4, fx: function (f) { return f.adj ? [['c', 20 * f.adj]] : []; } },
    { id: 'place', name: '旅人', desc: '場所の句があれば 倍率+4', price: 5, fx: function (f) { return f.place ? [['m', 4]] : []; } },
    { id: 'time', name: '時の番人', desc: '時の句があれば 倍率+4', price: 5, fx: function (f) { return f.time ? [['m', 4]] : []; } },
    { id: 'perf', name: '完了の達人', desc: '完了形(have+過去分詞)は 倍率×3', price: 7, fx: function (f) { return f.perfect ? [['x', 3]] : []; } },
    { id: 'long', name: '長文家', desc: '8語以上の文は 倍率×1.5、10語以上は×2', price: 6, fx: function (f) { return f.words >= 10 ? [['x', 2]] : f.words >= 8 ? [['x', 1.5]] : []; } },
    { id: 'aux', name: '助動詞ファン', desc: '助動詞・want to などがあれば 倍率+4', price: 4, fx: function (f) { return f.aux ? [['m', 4]] : []; } },
    { id: 'prog', name: '進行中', desc: '進行形(be+-ing)は 倍率+6', price: 5, fx: function (f) { return f.prog ? [['m', 6]] : []; } },
    { id: 'neg', name: 'あまのじゃく', desc: '否定(not)の文は チップ+60', price: 4, fx: function (f) { return f.neg ? [['c', 60]] : []; } },
    { id: 'noun', name: '主役は名詞', desc: '主語が代名詞でなければ 倍率+3', price: 4, fx: function (f) { return f.pronSubj ? [] : [['m', 3]]; } },
    { id: 'obj', name: '目的語ハンター', desc: '目的語があれば チップ+40', price: 4, fx: function (f) { return f.O ? [['c', 40]] : []; } },
    { id: 'link', name: 'つなぎ名人', desc: '節(when / if / because)の文は 倍率×2', price: 7, fx: function (f) { return f.clause ? [['x', 2]] : []; } },
    { id: 'mini', name: 'ミニマリスト', desc: '4語以下の文は 倍率+8', price: 5, fx: function (f) { return f.words <= 4 ? [['m', 8]] : []; } },
    { id: 'manner', name: '様子の名人', desc: '様子の副詞1つごとに 倍率+3', price: 4, fx: function (f) { return f.manner ? [['m', 3 * f.manner]] : []; } },
    { id: 'pass', name: '受け身の美学', desc: '受け身(be+過去分詞)は 倍率×2.5', price: 6, fx: function (f) { return f.passive ? [['x', 2.5]] : []; } },
    { id: 'rare', name: '語彙王', desc: 'むずかしい語のカード1枚ごとに チップ+25', price: 5, fx: function (f) { return f.rare ? [['c', 25 * f.rare]] : []; } },
    { id: 'first', name: '先手必勝', desc: 'ステージ最初の「出す」は 倍率+6', price: 4, fx: function (f, ctx) { return ctx.first ? [['m', 6]] : []; } },
    { id: 'last', name: 'ラストスパート', desc: 'ステージ最後の「出す」は 倍率×3', price: 6, fx: function (f, ctx) { return ctx.last ? [['x', 3]] : []; } },
    { id: 'lucky', name: '四つ葉', desc: '4回に1回 倍率×3', price: 5, fx: function () { return rnd() < .25 ? [['x', 3]] : []; } },
    { id: 'bank', name: '貯金箱', desc: '利子の上限が 5→10', price: 5, fx: function () { return []; } },
    { id: 'combo', name: '型のコレクター', desc: '役の要素1つごとに チップ+15', price: 5, fx: function (f, ctx) { return [['c', 15 * ctx.y.parts.length]]; } }
  ];
  // ---------------- ボス ----------------
  export var BOSSES = [
    { id: 'art', text: '冠詞(a / the)を使わない文は 0点', ok: function (f) { return f.hasArt; } },
    { id: 'past', text: '過去の文しか 点にならない', ok: function (f) { return f.past; } },
    { id: 'long', text: '6語以上の文しか 点にならない', ok: function (f) { return f.words >= 6; } },
    { id: 'npron', text: '代名詞が主語の文は 0点', ok: function (f) { return !f.pronSubj; } },
    { id: 'pp', text: '前置詞の句がない文は 0点', ok: function (f) { return f.hasPP; } },
    { id: 'obj', text: '目的語のない文は 0点', ok: function (f) { return f.O || f.C; } },
    { id: 'hands', text: '「出す」が3回しかない', hands: 3, ok: function () { return true; } }
  ];
  export var TARGETS = [300, 500, 800, 1200, 1800, 2700, 4000, 6000];
  export var BOSS_AT = { 2: 1, 5: 1, 7: 1 }; // 0始まり:3・6・8ステージ
