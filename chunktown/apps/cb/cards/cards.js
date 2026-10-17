/* ===== チャンク・カード:英文で「役」を作るローグライク(Balatro 風) =====
   判定・辞書はぷにチャンクの部品(PuniChunk._internal)を使う。 */
(function () {
  'use strict';
  var PC = window.PuniChunk, G = PC._internal.G, DICT = PC.adapters.dict();
  var CFG = { auto: { art: false, prep: false, verb: false, ti: false, er: false } };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  var rnd = Math.random, pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
  var shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem('chunkcards:' + k)); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem('chunkcards:' + k, JSON.stringify(v)); } catch (e) { } } };

  // ---------------- 音 ----------------
  var AC = null;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  function beep(f, d, type, v, when) { var c = ac(); if (!c) return; var t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v || .12, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .02); }
  var SFX = {
    tap: function () { beep(660, .08, 'triangle', .08); }, put: function () { beep(520, .07, 'square', .05); beep(780, .07, 'triangle', .06, .04); },
    chip: function (i) { beep(500 + i * 40, .09, 'square', .06); }, mult: function (i) { beep(300 + i * 30, .14, 'sawtooth', .07); }, joker: function () { beep(880, .1, 'triangle', .1); beep(1320, .14, 'triangle', .09, .06); },
    bad: function () { beep(180, .2, 'sawtooth', .07); }, win: function () { [523, 659, 784, 1046].forEach(function (f, i) { beep(f, .25, 'triangle', .12, i * .1); }); }, coin: function () { beep(1200, .06, 'square', .06); beep(1600, .1, 'square', .05, .05); },
    lose: function () { [392, 330, 262].forEach(function (f, i) { beep(f, .35, 'triangle', .1, i * .18); }); }
  };
  var voice = null, warned = false;
  function pickVoice() { try { var vs = speechSynthesis.getVoices() || []; var en = vs.filter(function (v) { return /^en([-_]|$)/i.test(v.lang || '') || /english/i.test(v.name || ''); }); var us = en.filter(function (v) { return /US/i.test(v.lang) || /Samantha|Google US|Alex|Aaron|Ava|Allison/i.test(v.name); }); voice = us.filter(function (v) { return v.localService; })[0] || us[0] || en.filter(function (v) { return v.localService; })[0] || en[0] || null; } catch (e) { } return voice; }
  try { pickVoice(); speechSynthesis.addEventListener('voiceschanged', pickVoice); setTimeout(pickVoice, 300); setTimeout(pickVoice, 1500); } catch (e) { }
  var primed = false;
  function unlock() { ac(); if (!primed) { primed = true; try { pickVoice(); var u = new SpeechSynthesisUtterance(' '); u.lang = 'en-US'; if (voice) u.voice = voice; u.volume = 0; speechSynthesis.speak(u); } catch (e) { } } }
  function noVoiceMsg() { if (warned) return; warned = true; try { var d = document.createElement('div'); d.textContent = '英語の音声が見つかりません。端末の設定で英語(米国)の読み上げ音声を追加するか、SafariやChromeで直接開いてください。'; d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:16px;z-index:9999;background:#222c;color:#fff;font-size:13px;padding:10px 12px;border-radius:12px;text-align:center'; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 5000); } catch (e) { } }
  function speak(t) { try { if (!voice) pickVoice(); if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t); if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-US'; if ((speechSynthesis.getVoices() || []).length) noVoiceMsg(); } u.rate = .95; speechSynthesis.speak(u); } catch (e) { } }

  // ---------------- 単語・カード ----------------
  var E = {}; ['noun', 'verb', 'adj', 'adv'].forEach(function (p) { E[p] = {}; DICT.all(p).forEach(function (e) { E[p][e.w] = e; }); });
  var KIND_JA = { pron: '代名詞', n: '名詞', v: '動詞', adj: '形容詞', adv: '副詞', t: 'つなぎ' };
  var cid = 1;
  function card(kind, w, extra) { var c = { id: cid++, kind: kind, w: w, bonus: 0 }; for (var k in extra || {}) c[k] = extra[k]; c.chips = baseChips(c); return c; }
  function lvOf(c) { return (c.w.e && c.w.e.lv) || 1; }
  function baseChips(c) { if (c.tsu) return 3; if (c.w.k === 'pr' && c.w.v === 'it') return 10; var b = { pron: 5, n: 10, v: 15, adj: 10, adv: 10 }[c.kind] || 5; return b + (lvOf(c) - 1) * 6; }
  function mk(kind, word) {
    if (kind === 'pron') return card('pron', { k: 'pr', v: word });
    var pos = { n: 'noun', v: 'verb', adj: 'adj', adv: 'adv' }[kind], e = E[pos][word]; if (!e) return null;
    return card(kind, kind === 'n' ? { k: 'n', e: e, pl: false } : kind === 'v' ? { k: 'v', e: e, f: 'base' } : { k: kind, e: e });
  }
  function starterDeck() {
    var L = [['pron', ['i', 'you', 'he', 'she', 'we', 'they']],
      ['n', ['apple', 'book', 'dog', 'cat', 'pizza', 'guitar', 'friend', 'teacher', 'sister', 'park', 'library', 'station', 'morning', 'Monday']],
      ['v', ['eat', 'read', 'play', 'like', 'buy', 'watch', 'go', 'run', 'make', 'see', 'write', 'swim', 'drink', 'study']],
      ['adj', ['big', 'small', 'new', 'happy', 'red', 'old']],
      ['adv', ['quickly', 'well', 'yesterday', 'today', 'here', 'slowly', 'tomorrow']]];
    var d = []; L.forEach(function (g) { g[1].forEach(function (w) { var c = mk(g[0], w); if (c) d.push(c); }); }); return d;
  }
  // つなぎの棚(何度でも使える)
  var TSU = [
    ['冠詞', [['det', 'a'], ['det', 'the'], ['det', 'this'], ['det', 'that']]],
    ['所有', [['pos', 'i', 'my'], ['pos', 'you', 'your'], ['pos', 'he', 'his'], ['pos', 'she', 'her'], ['pos', 'we', 'our'], ['pos', 'they', 'their']]],
    ['前置詞', [['prep', 'in'], ['prep', 'at'], ['prep', 'on'], ['prep', 'to'], ['prep', 'with'], ['prep', 'for'], ['prep', 'from'], ['prep', 'by'], ['prep', 'up'], ['prep', 'down'], ['prep', 'out'], ['prep', 'off'], ['prep', 'away'], ['prep', 'back']]],
    ['助動詞', [['modal', 'can'], ['modal', 'will'], ['modal', 'must'], ['modal', 'should'], ['modal', 'may'], ['sm', 'want to'], ['sm', 'have to'], ['sm', 'need to'], ['sm', 'be going to']]],
    ['be/have', [['be', 'pres'], ['hv', 'pres'], ['not', ''], ['deg', 'very']]],
    ['つなぐ', [['conj', 'and'], ['conj', 'but'], ['conj', 'so'], ['conj', 'when'], ['conj', 'if'], ['conj', 'because'], ['rel', 'who', 'who'], ['rel', 'which', 'which'], ['rel', 'that', 'that']]]
  ];
  function tsuCard(spec) {
    var k = spec[0], w;
    if (k === 'pos') w = { k: 'pr', v: spec[1] }; else if (k === 'sm') w = { k: 'sm', v: spec[1], t: 'pres' }; else if (k === 'not') w = { k: 'not' }; else w = { k: k, v: spec[1] };
    return card('t', w, { tsu: true, label: spec[2] || null });
  }
  function cardText(c) {
    if (c.label) return c.label;
    var t = G.wordText(c.w, CFG); if (c.w.k === 'be') t = c.w.v === 'past' ? 'be(過去)' : 'be'; if (c.w.k === 'hv') t = c.w.v === 'past' ? 'had' : 'have';
    return t === 'i' ? 'I' : t;
  }
  function colorOf(c) { var k = c.w.k; return k === 'n' || k === 'pr' || k === 'det' ? 'n' : k === 'v' ? 'v' : k === 'adj' || k === 'adv' || k === 'deg' ? 'm' : k === 'prep' ? 'p' : k === 'conj' || k === 'rel' ? 'c' : 'a'; }
  function cyclable(c) { return !c.tsu && (c.kind === 'v' || (c.kind === 'n' && G.isCount(c.w.e) && !c.w.e.ind)) || (c.tsu && (c.w.k === 'be' || c.w.k === 'hv' || c.w.k === 'det')); }
  function cycle(c) {
    var w = c.w;
    if (w.k === 'v') { var F = ['base', 'past', 'pp', 'ing'], i = F.indexOf(w.f || 'base'); w.f = F[(i + 1) % 4]; }
    else if (w.k === 'n') w.pl = !w.pl;
    else if (w.k === 'be' || w.k === 'hv') w.v = w.v === 'past' ? 'pres' : 'past';
    else if (w.k === 'det') w.v = { a: 'the', the: 'a', 'this': 'that', that: 'this' }[w.v];
  }
  var FORM_JA = { base: '原形・現在', past: '過去形', pp: '過去分詞', ing: '-ing形' };

  // ---------------- 判定:並びから文と「役」を出す ----------------
  function isPlace(t) { return (t.t === 'PP' && (t.cat === 'place' || (t.np && t.np.noun && t.np.noun.cat === 'place'))) || (t.t === 'ADV' && t.ak === 'place') || (t.t === 'ID' && t.ik === 'place'); }
  function isTime(t) { return (t.t === 'PP' && t.cat === 'time') || (t.t === 'ADV' && t.ak === 'time') || (t.t === 'ID' && t.ik === 'time'); }
  // ---- 後置修飾:名詞のうしろに -ing形/過去分詞/前置詞の句/関係代名詞の節 をつけて、ひとつの名詞のかたまりにする ----
  function dummy(pr) { return G.chainState([{ k: 'pr', v: pr }], CFG).chunk; }
  function chunkTx(t) { return t.t === 'NP' && t.pron ? G.PRON[t.pron].obj : G.chunkText(t, CFG); }
  function isPerson(np) { return np.noun && /^(person|animal)$/.test(np.noun.cat); }
  function mergeNP(np, extra, text, kind) { var m = {}; for (var k in np) m[k] = np[k]; m.words = np.words.concat([].concat.apply([], extra.map(function (t) { return t.words || []; }))); m.postText = (np.postText ? np.postText + ' ' : '') + text; m.postKind = kind; return m; }
  function relClause(head, rel, R) { // 関係代名詞の節の文字列(だめなら null)
    if (rel === 'who' && !isPerson(head)) return null; if (rel === 'which' && head.noun && head.noun.cat === 'person') return null;
    if (R[0] && R[0].t === 'VP') { // 主語が抜けた形:who plays tennis
      var r = G.parse([dummy(head.num === 'pl' ? 'they' : 'he')].concat(R), CFG); if (r.ok && r.kind === 'S') return rel + ' ' + r.text.replace(/^\S+\s/, '').replace(/\.$/, '');
    }
    if (rel !== 'who' && R.length === 2 && R[0].t === 'NP' && R[1].t === 'VP' && R[1].verb && R[1].verb.fr !== 'intr') { // 目的語が抜けた形:that I bought
      var r2 = G.parse(R.concat([dummy('it')]), CFG); if (r2.ok && r2.kind === 'S') return rel + ' ' + r2.text.replace(/\s+it\.$/, '').replace(/^(\w)(\w*)/, function (m, a, b) { return m === 'I' ? m : a.toLowerCase() + b; });
    }
    return null;
  }
  function postVariants(T) {
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
        for (var k = 0; k <= 2 && i + 2 + k <= T.length; k++) {
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
  var PARTICLE = ['up', 'down', 'out', 'off', 'away', 'back', 'on', 'in', 'over'];
  function vtext(e, f) { return G.wordText({ k: 'v', e: e, f: f }, CFG); }
  function regular(e) { return vtext(e, 'past') === vtext(e, 'pp'); }
  function prevCore(ws, i) { for (var j = i - 1; j >= 0; j--) if (ws[j].k !== 'not' && ws[j].k !== 'deg' && ws[j].k !== 'adv') return ws[j]; return null; }
  function evaluate(row) {
    if (!row.length) return { state: 'empty' };
    // 1) 句動詞をまとめる/be・have のうしろの規則動詞を過去分詞に(カード自体も切りかえる)
    var ws = [], crow = [], phr = false;
    for (var i = 0; i < row.length; i++) {
      var w = row[i].w, nx = row[i + 1] && row[i + 1].w;
      if (w.k === 'v' && w.f === 'past' && regular(w.e)) { var pv = prevCore(row.map(function (c) { return c.w; }), i); if (pv && (pv.k === 'be' || pv.k === 'hv')) w.f = 'pp'; }
      if (w.k === 'v' && nx && nx.k === 'prep' && PARTICLE.indexOf(nx.v) >= 0 && E.verb[w.e.w + ' ' + nx.v]) { ws.push({ k: 'v', e: E.verb[w.e.w + ' ' + nx.v], f: w.f }); crow.push(row[i]); i++; phr = true; continue; }
      ws.push(w); crow.push(row[i]);
    }
    var r = evalWords(crow, ws, row);
    if (r.state === 'ok') { r.f.phrasal = phr; return r; }
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
  function evalWords(row, words, fullRow) {
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
    if (found) { var sm = semantic(found.r); if (sm) return { state: 'bad', msg: sm }; return { state: 'ok', text: found.r.text, f: features(found.r, fullRow), nps: nounPhrases(found.r) }; }
    if (bestBad) return { state: bestBad.wait ? 'wait' : 'bad', msg: bestBad.r.err ? bestBad.r.err.msg : 'まだ文になっていない' };
    // 区切れない:どこで止まったか
    var tail = cs(far, n);
    if (segErr) return { state: 'bad', msg: segErr.msg };
    if (tail.prefix) return { state: 'wait', msg: '「' + cardText(row[n - 1]) + '」の後ろに続きが必要' };
    return { state: 'bad', at: far, msg: '「' + cardText(row[far]) + '」のところで つながらない' };
  }
  // 意味のチェック(英語脳の辞書の情報):動詞の目的語に合う名詞か/場所・時・食べ物が主語になっていないか
  var THING_OK = ['go', 'come', 'run', 'move', 'stop', 'start', 'begin', 'change', 'open', 'close', 'break', 'fall', 'work', 'arrive', 'leave', 'turn', 'fly', 'grow', 'shine', 'happen', 'end', 'ring', 'burn', 'melt', 'float', 'sink', 'roll', 'shake', 'hurt', 'cost', 'smell', 'taste', 'sound', 'look'];
  function headNoun(np) { if (!np || np.t !== 'NP' || np.pron) return null; if (np.noun) return np.noun; var w = (np.words || []).filter(function (x) { return x.k === 'n'; }).pop(); return w ? w.e : null; }
  function semantic(r) {
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
  function nounPhrases(r) {
    var out = [], add = function (t) { if (!t) return; if (t.t === 'NP') out.push(t); if (t.t === 'PP' && t.np) out.push(t.np); };
    var cl = function (c) { if (!c) return; add(c.subj); (c.comps || []).forEach(add); (c.posts || []).forEach(add); (c.pre || []).forEach(add); };
    r.alt.cls.forEach(cl); if (r.alt.front) { cl(r.alt.front.cl); add(r.alt.front.tok); }
    return out.map(function (np) { return { pron: np.pron || null, w: np.noun ? np.noun.w : null, det: np.det, poss: np.poss, num: np.num, person: !!(np.noun && /^(person|animal)$/.test(np.noun.cat)) }; });
  }
  function clWords(cl) { var w = []; if (!cl) return w; [cl.subj, cl.vp].concat(cl.comps || [], cl.posts || [], cl.pre || []).forEach(function (t) { if (t && t.words) w = w.concat(t.words); }); return w; }
  function features(r, row) {
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
      if (ot.length && on) { var e = on.noun, tags = [e.cat].concat(e.tg || []), m = ot.filter(function (x) { return tags.indexOf(x) >= 0; }); f.pair = v.w + ' + ' + e.w; f.colloc = m.some(function (x) { return x !== 'thing'; }) && ot.indexOf('thing') < 0 && ot.length <= 3 ? 'good' : m.length ? null : 'bad'; }
    }
    f.combo = f.colloc === 'good';
    return f;
  }
  // 話のつながり:前の文に出た名詞を the / this / that / 所有格 か代名詞で受ける
  function storyOf(nps, prev) {
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
  function baseScore(row, ev) {
    var f = ev.f, y = yaku(f), chips = y.chips, mult = y.mult, steps = [{ t: 'yaku', label: y.name, chips: chips, mult: mult }];
    var dup = f.dupWords || [], half = f.halfWords || [];
    row.forEach(function (c, i) {
      var v = c.chips + (c.bonus || 0), tag = '';
      if (dup.indexOf(c.w) >= 0) { v = 0; tag = '重複'; } else if (half.indexOf(c.w) >= 0) { v = Math.floor(v / 2); tag = '½'; }
      chips += v; steps.push({ t: 'card', i: i, add: v, tag: tag, chips: chips, mult: mult });
    });
    if (f.colloc === 'bad') { chips = Math.floor(chips / 2); steps.push({ t: 'note', txt: 'ちぐはぐ ×½', chips: chips, mult: mult }); }
    return { y: y, chips: chips, mult: mult, steps: steps };
  }
  // 役(文の型)の点。お店の「文型の本」でレベルが上がる
  var PARTS = [
    ['SV', 'S+V', 10, 1], ['O', '+O', 10, 1], ['O2', '+O2', 15, 1], ['C', '+C', 10, 1], ['place', '+場所', 10, 1], ['time', '+時', 10, 1], ['manner', '+様子', 5, 1],
    ['aux', '助動詞', 5, 1], ['prog', '進行形', 10, 1], ['perfect', '完了形', 20, 2], ['passive', '受け身', 20, 2], ['neg', '否定', 5, 1], ['past', '過去', 5, 1], ['clause', '節', 15, 1], ['post', '後置修飾', 25, 2],
    ['phrasal', '句動詞', 15, 1], ['gerund', '動名詞', 20, 2], ['padj', '分詞の形容詞', 15, 1], ['combo', '名コンビ', 0, 2], ['story', 'つながり', 0, 2], ['storyP', '代名詞で受ける', 0, 3]
  ];
  var PART_JA = {}; PARTS.forEach(function (p) { PART_JA[p[0]] = p[1]; });
  function yaku(f) {
    var on = PARTS.filter(function (p) { return p[0] === 'SV' || f[p[0]]; }), chips = 0, mult = 0;
    on.forEach(function (p) { var lv = (R && R.lv && R.lv[p[0]]) || 0; chips += p[2] + lv * 10; mult += p[3] + lv; });
    var main = on.filter(function (p) { return /^(SV|O|O2|C|place|time|manner)$/.test(p[0]); }).map(function (p) { return p[1]; }).join('').replace(/^S\+V/, 'S+V');
    var extra = on.filter(function (p) { return !/^(SV|O|O2|C|place|time|manner)$/.test(p[0]); }).map(function (p) { return p[1]; });
    return { name: main + (extra.length ? '・' + extra.join('・') : ''), chips: chips, mult: mult, parts: on };
  }

  // ---------------- ジョーカー ----------------
  var JOKERS = [
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
  var BOSSES = [
    { id: 'art', text: '冠詞(a / the)を使わない文は 0点', ok: function (f) { return f.hasArt; } },
    { id: 'past', text: '過去の文しか 点にならない', ok: function (f) { return f.past; } },
    { id: 'long', text: '6語以上の文しか 点にならない', ok: function (f) { return f.words >= 6; } },
    { id: 'npron', text: '代名詞が主語の文は 0点', ok: function (f) { return !f.pronSubj; } },
    { id: 'pp', text: '前置詞の句がない文は 0点', ok: function (f) { return f.hasPP; } },
    { id: 'obj', text: '目的語のない文は 0点', ok: function (f) { return f.O || f.C; } },
    { id: 'hands', text: '「出す」が3回しかない', hands: 3, ok: function () { return true; } }
  ];
  var TARGETS = [300, 500, 800, 1200, 1800, 2700, 4000, 6000];
  var BOSS_AT = { 2: 1, 5: 1, 7: 1 }; // 0始まり:3・6・8ステージ

  // ---------------- ゲームの状態 ----------------
  var R = null;
  function newRun() {
    R = { stage: 0, money: 4, deck: starterDeck(), jokers: [], lv: {}, best: { text: '', pts: 0 }, total: 0, played: 0, rerollCost: 2 };
    startStage();
  }
  function startStage() {
    var bi = BOSS_AT[R.stage] ? pick(BOSSES.filter(function (b) { return !R.lastBoss || b.id !== R.lastBoss; })) : null; if (bi) R.lastBoss = bi.id;
    R.boss = bi; R.target = TARGETS[R.stage]; R.score = 0; R.hands = bi && bi.hands ? bi.hands : 4; R.handsMax = R.hands; R.discards = 3; R.first = true;
    R.deck.forEach(function (c) { if (c.w.k === 'v') c.w.f = 'base'; if (c.w.k === 'n') c.w.pl = false; });
    R.deck.forEach(function (c) { if (c.scout) { c.scout = false; c.chips = baseChips(c); } });
    R.draw = shuffle(R.deck.slice()); R.disc = []; R.hand = []; R.row = []; R.field = []; R.pts = 0; R.refill = 0; R.log = []; deal();
    R.yakuCnt = {}; R.prev = null; R.stageF = []; R.questDone = false; R.quest = pickQuest(R.usedQ = R.usedQ || []); R.missions = pickMissions(R.usedM = R.usedM || [], 3);
    var g = guestCard(); if (g) { var j = R.hand.findIndex(function (c) { return cat(c) === cat(g); }); if (j < 0) j = 0; R.draw.unshift(R.hand[j]); R.hand[j] = g; }
    showGame();
  }
  function drawOne() { if (!R.draw.length) { R.draw = shuffle(R.disc); R.disc = []; } return R.draw.pop() || null; }
  function verbFits(v, n) { var ot = v.w.e.ot || []; if (!ot.length || ot.indexOf('any') >= 0) return true; var tags = [n.w.e.cat].concat(n.w.e.tg || []); return ot.some(function (t) { return tags.indexOf(t) >= 0; }); }
  // 手札を配る:品詞がかたよらないように(主語2・動詞2〜3・名詞2・飾り1 くらい)。動詞の目的語になれる名詞もできるだけ入れる
  function cat(c) { return c.kind === 'pron' || (c.kind === 'n' && /^(person|animal)$/.test(c.w.e.cat)) ? 'subj' : c.kind === 'v' ? 'verb' : c.kind === 'n' ? 'noun' : 'mod'; }
  var WANT = { subj: [2, 3], verb: [2, 3], noun: [2, 3], mod: [1, 2] };
  function deal() { fillTo(8); }
  function fillTo(N) {
    if (!R.draw.length) { R.draw = shuffle(R.disc); R.disc = []; }
    while (R.hand.length + R.row.filter(function (c) { return !c.tsu; }).length < N) {
      if (!R.draw.length) { if (!R.disc.length) break; R.draw = shuffle(R.disc); R.disc = []; }
      var cnt = { subj: 0, verb: 0, noun: 0, mod: 0 }; R.hand.concat(R.row.filter(function (c) { return !c.tsu; })).forEach(function (c) { cnt[cat(c)]++; });
      var short = Object.keys(WANT).filter(function (k) { return cnt[k] < WANT[k][0]; }), full = Object.keys(WANT).filter(function (k) { return cnt[k] >= WANT[k][1]; });
      var idx = -1;
      if (short.length) { var k0 = pick(short); for (var i = R.draw.length - 1; i >= 0; i--) if (cat(R.draw[i]) === k0) { idx = i; break; } }
      if (idx < 0) for (var j = R.draw.length - 1; j >= 0; j--) if (full.indexOf(cat(R.draw[j])) < 0) { idx = j; break; }
      if (idx < 0) idx = R.draw.length - 1;
      R.hand.push(R.draw.splice(idx, 1)[0]);
    }
    // 他動詞があるのに目的語になれる名詞がないときは、山札から合う名詞と入れかえる
    var vs = R.hand.filter(function (c) { return c.kind === 'v' && c.w.e.fr !== 'intr'; }), ns = R.hand.filter(function (c) { return c.kind === 'n'; });
    if (vs.length && !vs.some(function (v) { return ns.some(function (n) { return verbFits(v, n); }); })) {
      var i2 = R.draw.findIndex(function (c) { return c.kind === 'n' && vs.some(function (v) { return verbFits(v, c); }); }), j2 = R.hand.findIndex(function (c) { return cat(c) === 'noun' || cat(c) === 'mod'; });
      if (i2 >= 0 && j2 >= 0) { var t = R.hand[j2]; R.hand[j2] = R.draw[i2]; R.draw[i2] = t; }
    }
  }
  // ---------------- 中身の操作(画面とは分けておく。対戦にするときはここをサーバーと共有する) ----------------
  var FIELD_MAX = 8;
  var Core = {
    // 手札から捨てる:場に表向きで並び、捨てたカードの点が「捨て札ポイント」になる。捨てた枚数ぶん補充待ち
    discard: function (cards) {
      cards.forEach(function (c) { var i = R.hand.indexOf(c); if (i >= 0) R.hand.splice(i, 1); R.field.unshift(c); R.pts += c.chips + c.bonus; });
      while (R.field.length > FIELD_MAX) R.disc.push(R.field.pop());
      R.discards--; R.refill += cards.length; R.log.push({ a: 'discard', cards: cards.map(cardText) });
    },
    // 補充1枚:山から引く(タダ)
    drawOne: function () { if (R.refill <= 0) return null; var before = R.hand.length; fillTo(R.hand.length + R.row.filter(function (c) { return !c.tsu; }).length + 1); R.refill--; var c = R.hand[R.hand.length - 1]; R.log.push({ a: 'draw' }); return R.hand.length > before ? c : null; },
    // 補充1枚:場から取る(そのカードの点ぶんポイントを払う)
    take: function (c) { var cost = c.chips + c.bonus, i = R.field.indexOf(c); if (R.refill <= 0 || i < 0 || R.pts < cost) return false; R.pts -= cost; R.field.splice(i, 1); R.hand.push(c); R.refill--; R.log.push({ a: 'take', card: cardText(c), cost: cost }); return true; }
  };
  // 点数の計算(内訳つき)
  function notes(f, rep) {
    var o = [];
    if (f.colloc === 'good') o.push('<span class="gd">✨ 名コンビ(' + f.pair + ')</span>');
    if (f.colloc === 'bad') o.push('ちぐはぐ(' + f.pair + ')→ チップ半分');
    if (f.storyP) o.push('<span class="gd">🔗 前の文を代名詞で受けた</span>'); else if (f.story) o.push('<span class="gd">🔗 前の文とつながった</span>');
    if ((f.dupWords || []).length) o.push('同じ種類の句の2つ目は 0点');
    if ((f.halfWords || []).length) o.push('2つ目の文は カード点が半分');
    if (rep) o.push('同じ役 ' + (rep + 1) + '回目 → 倍率 ' + (rep === 1 ? '½' : '¼'));
    return o.join('<br>');
  }
  function applyStory(ev) { var st = storyOf(ev.nps, R && R.prev); ev.f.story = st === 'def'; ev.f.storyP = st === 'pron'; }
  function scoreOf(ev, ctx) {
    var f = ev.f; applyStory(ev);
    var b = baseScore(R.row, ev), y = b.y, steps = b.steps, chips = b.chips, mult = b.mult;
    ctx.y = y;
    R.jokers.forEach(function (j, ji) {
      j.fx(f, ctx).forEach(function (e) {
        if (e[0] === 'c') chips += e[1]; else if (e[0] === 'm') mult += e[1]; else mult = Math.round(mult * e[1] * 10) / 10;
        steps.push({ t: 'joker', ji: ji, txt: e[0] === 'c' ? '+' + e[1] : e[0] === 'm' ? '+' + e[1] + ' 倍' : '×' + e[1], chips: chips, mult: mult });
      });
    });
    var rep = (R.yakuCnt && R.yakuCnt[y.name]) || 0;
    if (rep) { mult = Math.round(mult * (rep === 1 ? .5 : .25) * 10) / 10; steps.push({ t: 'note', txt: '同じ役 ' + (rep + 1) + '回目 ×' + (rep === 1 ? '½' : '¼'), chips: chips, mult: mult }); }
    var bossOk = !R.boss || R.boss.ok(f);
    return { y: y, steps: steps, chips: chips, mult: mult, total: bossOk ? Math.floor(chips * mult) : 0, bossFail: !bossOk, rep: rep };
  }

  // ---------------- 画面 ----------------
  var root = null;
  function mount(r) { root = r; showTitle(); document.addEventListener('pointerdown', unlock, { once: false, passive: true }); }
  function screen(html) { root.innerHTML = ''; var s = el('div', 'scr', html); root.appendChild(s); return s; }
  function showTitle() {
    var b = store.get('best') || {};
    var s = screen('<div class="title"><div class="logo"><span>CHUNK</span><span>CARDS</span></div><div class="sub">英文で「役」をつくる カードゲーム</div>' +
      '<div class="fan"><div class="card n big" style="--r:-12deg">The</div><div class="card v big" style="--r:-4deg">dog</div><div class="card v big" style="--r:4deg">ate</div><div class="card m big" style="--r:12deg">quickly</div></div>' +
      '<button class="btn go" id="go">ひとりで練習</button><button class="btn vs" id="vs">⚔️ CPUと対戦</button><button class="btn ghost" id="how">あそびかた</button><button class="btn ghost small" id="cb">📖 名コンビ図鑑</button>' +
      (b.stage ? '<div class="rec">最高:ステージ ' + b.stage + ' ・ ' + (b.total || 0).toLocaleString() + '点' + (b.text ? '<br><i>' + b.text + '</i>' : '') + '</div>' : '') + '</div>');
    $('#go', s).onclick = function () { unlock(); SFX.put(); newRun(); };
    $('#how', s).onclick = function () { unlock(); showHow(); };
    $('#cb', s).onclick = function () { var l = store.get('combos') || [], o = el('div', 'modal', '<div class="box"><h2>📖 名コンビ図鑑(' + l.length + ')</h2><p style="font-size:12px;opacity:.8;margin:0">動詞とぴったりの目的語の組み合わせ。文で使うと倍率+2</p><div class="combos">' + (l.length ? l.map(function (x) { return '<span>' + x + '</span>'; }).join('') : '<i>まだない</i>') + '</div><button class="btn go" id="ok">とじる</button></div>'); root.appendChild(o); $('#ok', o).onclick = function () { o.remove(); }; };
    $('#vs', s).onclick = function () { unlock(); SFX.put(); window.ChunkVS && window.ChunkVS.start(); };
  }
  function showHow() {
    var o = el('div', 'modal', '<div class="box"><h2>あそびかた</h2><ol>' +
      '<li>手札のカードを<b>タップ</b>すると「文の台」に並ぶ。<b>つなぎの棚</b>(a / the / in / can など)は何回でも使える。</li>' +
      '<li>台のカードは<b>ドラッグで並べかえ</b>、<b>タップで形が変わる</b>(eat → ate → eaten → eating、単数⇄複数)。×で手札へ戻す。</li>' +
      '<li>正しい英文になると<b>役</b>(S+V+O+場所 など)と点が出る。「<b>出す!</b>」で点が入る。間違っていると理由が出て、出せない。</li>' +
      '<li>点 = <b>チップ × 倍率</b>。長い文・むずかしい形(過去・完了・進行・節…)ほど高い。</li>' +
      '<li>「出す」の回数のうちに<b>目標点</b>に届けばクリア。お店で<b>ジョーカー</b>(点が化ける効果)や<b>文型の本</b>を買って強くなろう。3・6・8ステージは<b>ボス</b>(条件つき)。</li>' +
      '<li>「<b>捨てる</b>」→ 手札から捨てるカードをえらぶ。捨てたカードは<b>場</b>に表向きで並び、その点数が<b>捨て札pt</b>になる。補充は1枚ずつ「山から引く(タダ)」か「場から取る(点数ぶんのpt)」をえらべる。強いカードをわざと捨てて、あとで拾い直すのもアリ。</li></ol><button class="btn go" id="ok">わかった</button></div>');
    root.appendChild(o); $('#ok', o).onclick = function () { o.remove(); };
  }

  var G_ = {}; // ゲーム画面の要素
  function showGame() {
    var s = screen(
      '<div class="top"><div class="stg' + (R.boss ? ' boss' : '') + '">' + (R.boss ? '👹 ボス ' : 'ステージ ') + (R.stage + 1) + '<small>/8</small></div>' +
      '<div class="goal"><div class="gl">目標 <b id="tgt">' + R.target.toLocaleString() + '</b></div><div class="bar"><i id="barf"></i></div><div class="gl">いま <b id="sc">0</b></div></div>' +
      '<div class="res"><span>出す<b id="hd"></b></span><span>捨てる<b id="ds"></b></span><span class="money">💰<b id="mn"></b></span></div></div>' +
      '<div class="jokers" id="jk"></div>' +
      (R.boss ? '<div class="bossbar">👹 ' + R.boss.text + '</div>' : '') + '<div class="qbar" id="qb"></div>' +
      '<div class="board"><div class="row" id="row"><div class="ph">手札をタップして ここに並べる</div></div>' +
      '<div class="pv"><div class="sent" id="sent"></div><div class="yk" id="yk"></div><div class="cm"><span class="chips" id="ch">0</span><span class="x">×</span><span class="mult" id="ml">0</span></div><div class="msg" id="msg"></div></div></div>' +
      '<div class="field"><div class="flbl"><span>場(捨てたカード)</span><span class="pts">捨て札pt <b id="pt">0</b></span></div><div class="frow" id="fd"></div><div class="fhint" id="fh"></div></div>' +
      '<div class="tsu"><div class="tabs" id="tabs"></div><div class="tw" id="tw"></div></div>' +
      '<div class="hand" id="hand"></div>' +
      '<div class="btns" id="bt"></div>');
    ['jk', 'row', 'sent', 'yk', 'ch', 'ml', 'msg', 'tabs', 'tw', 'hand', 'bt', 'hd', 'ds', 'mn', 'sc', 'barf', 'fd', 'fh', 'pt', 'qb'].forEach(function (k) { G_[k] = $('#' + k, s); });
    G_.tab = G_.tab == null ? 0 : G_.tab;
    G_.vs = null; G_.mode = 'play'; G_.mark = []; renderAll();
  }
  // 台の上の見た目:文の中での実際の形(is / plays / him / an …)にそろえる
  var BE = /^(am|is|are|was|were|be|been|being)$/, HV = /^(have|has|had|having)$/;
  function first(w) { return String(w).toLowerCase().split(' ')[0]; }
  function plaus(c, tok) {
    var k = c.w.k;
    if (k === 'be') return BE.test(tok); if (k === 'hv') return HV.test(tok); if (k === 'det') return /^(a|an|the|this|that|these|those)$/.test(tok);
    if (k === 'pr' && !c.label && G.PRON[c.w.v]) { var P = G.PRON[c.w.v]; return tok === first(P.sub) || tok === first(P.obj); }
    if (k === 'sm') return /^be/.test(c.w.v) ? BE.test(tok) : /^have/.test(c.w.v) ? HV.test(tok) : tok.indexOf(first(c.w.v).slice(0, 3)) === 0;
    if (k === 'v') { var fs = ['base', 'past', 'pp', 'ing'].map(function (f) { return first(G.wordText({ k: 'v', e: c.w.e, f: f }, CFG)); }), b0 = fs[0]; return fs.indexOf(tok) >= 0 || tok === b0 + 's' || tok === b0 + 'es' || tok === b0.replace(/y$/, 'ies') || tok === 'has' && b0 === 'have'; }
    var b = first(cardText(c)); return tok === b || (b.length > 2 && tok.indexOf(b.slice(0, b.length - 1)) === 0) || (k === 'n' && first(G.wordText({ k: 'n', e: c.w.e, pl: true }, CFG)) === tok);
  }
  function surfaceOf(row, ev) {
    if (!ev || ev.state !== 'ok') return null;
    var toks = [], orig = {}, p = 0, out = [];
    ev.text.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean).forEach(function (w) { var m = /^(\w+)n't$/i.exec(w); if (m) { var b = { ca: 'can', wo: 'will', sha: 'shall' }[m[1].toLowerCase()] || m[1]; if (/^(do|does|did)$/i.test(b)) orig[toks.length] = w; toks.push(b, 'not'); } else toks.push(w); });
    for (var i = 0; i < row.length; i++) {
      var c = row[i], n = cardText(c).split(' ').length;
      if (c.w.k === 'not' && /^(do|does|did)$/i.test(toks[p] || '') && /^not$/i.test(toks[p + 1] || '')) n = 2;
      else if (c.w.k === 'not') { if (!/^not$/i.test(toks[p] || '')) return null; }
      else if (!plaus(c, (toks[p] || '').toLowerCase())) return null;
      var t = orig[p] && n === 2 && c.w.k === 'not' ? orig[p] : toks.slice(p, p + n).join(' '); p += n;
      if (i === 0 && t !== 'I' && !/^[A-Z]/.test(cardText(c))) t = t.charAt(0).toLowerCase() + t.slice(1);
      out.push(t);
    }
    return p === toks.length ? out : null;
  }
  // 文になっていないときの目安:主語に合わせて be / have、動詞・前置詞のうしろの代名詞は目的語の形
  function guessForm(c, prev) {
    var k = c.w.k;
    if (k === 'pr' && !c.label && prev && (prev.w.k === 'v' || prev.w.k === 'prep') && G.PRON[c.w.v]) return G.PRON[c.w.v].obj;
    if ((k === 'be' || k === 'hv') && prev && (prev.w.k === 'pr' || prev.w.k === 'n')) {
      var v = prev.w.k === 'pr' ? prev.w.v : prev.w.pl ? 'they' : 'he', past = c.w.v === 'past';
      if (k === 'be') return past ? (v === 'i' || v === 'he' || v === 'she' || v === 'it' ? 'was' : 'were') : v === 'i' ? 'am' : /^(he|she|it)$/.test(v) ? 'is' : 'are';
      return past ? 'had' : /^(he|she|it)$/.test(v) ? 'has' : 'have';
    }
    return null;
  }
  function rowText(row) { return row.map(function (c, i) { return guessForm(c, row[i - 1]) || cardText(c); }).join(' '); }
  function cardEl(c, where, i, disp) {
    var e = el('div', 'card ' + colorOf(c) + (c.tsu ? ' tsu' : '') + (lvOf(c) >= 2 && !c.tsu ? ' rare' : '') + (c.guest ? ' guest' : '') + (c.w.k === 'pr' && c.w.v === 'it' && !c.tsu ? ' wild' : ''));
    var t = disp || cardText(c);
 e.innerHTML = '<span class="w"' + (t.length > 8 ? ' style="font-size:' + Math.max(9, 13 - (t.length - 8) * .7) + 'px"' : '') + '>' + t + '</span><i>' + (c.chips + c.bonus) + '</i>' + (c.bonus ? '<u>+' + c.bonus + '</u>' : '') +
      (c.w.k === 'v' && where === 'row' ? '<em>' + FORM_JA[c.w.f || 'base'] + '</em>' : '') + (where === 'row' ? '<b class="rm">×</b>' : '');
    e.dataset.i = i; return e;
  }
  function renderAll() { if (G_.vs) return G_.vs.renderAll(); renderTop(); renderJokers(); renderRow(); renderTsu(); renderHand(); renderField(); renderBtns(); }
  function renderTop() { G_.hd.textContent = R.hands; G_.ds.textContent = R.discards; G_.mn.textContent = R.money; G_.sc.textContent = R.score.toLocaleString(); if (G_.pt) G_.pt.textContent = R.pts; G_.barf.style.width = Math.min(100, R.score / R.target * 100) + '%'; if (G_.qb && R.quest) G_.qb.innerHTML = missionBar(R.missions) + questBar(R.quest, R.stageF); }
  function missionBar(ms) { return '<div class="mbar">🎯 お題:' + ms.map(function (x) { return '<span class="mc t' + x.m.tier + (x.done ? ' hit' : '') + '">' + (x.done ? '✔ ' : '') + x.m.label + ' <b>💰' + (x.m.tier + 1) + '</b></span>'; }).join('') + '</div>'; }
  function renderJokers() {
    G_.jk.innerHTML = '';
    for (var i = 0; i < 5; i++) { var j = R.jokers[i]; var e = el('div', 'joker' + (j ? '' : ' empty'), j ? '<b>' + j.name + '</b><span>' + j.desc + '</span>' : '<span>空き</span>'); e.dataset.i = i; G_.jk.appendChild(e); }
  }
  function renderHand() {
    G_.hand.innerHTML = '';
    R.hand.forEach(function (c, i) {
      var e = cardEl(c, 'hand', i); if (G_.mode === 'disc' && G_.mark.indexOf(c) >= 0) e.classList.add('marked');
      e.onclick = function () {
        if (G_.busy) return;
        if (G_.mode === 'disc') { var k = G_.mark.indexOf(c); if (k >= 0) G_.mark.splice(k, 1); else G_.mark.push(c); SFX.tap(); renderHand(); renderBtns(); return; }
        if (G_.mode === 'refill') { flash('先に補充しよう(山から引く/場から取る)'); return; }
        SFX.put(); R.hand.splice(R.hand.indexOf(c), 1); R.row.push(c); renderRow(); renderHand();
      };
      G_.hand.appendChild(e);
    });
  }
  function renderTsu() {
    G_.tabs.innerHTML = ''; TSU.forEach(function (t, i) { var b = el('button', 'tab' + (i === G_.tab ? ' on' : ''), t[0]); b.onclick = function () { G_.tab = i; SFX.tap(); renderTsu(); }; G_.tabs.appendChild(b); });
    G_.tw.innerHTML = ''; TSU[G_.tab][1].forEach(function (spec) { var c = tsuCard(spec), e = cardEl(c, 'tsu', 0); e.onclick = function () { if (G_.busy) return; SFX.put(); R.row.push(tsuCard(spec)); renderRow(); }; G_.tw.appendChild(e); });
  }
  // 文の台:タップ=形を変える/×=戻す/ドラッグ=並べかえ
  function renderRow() {
    G_.row.innerHTML = '';
    if (!R.row.length) G_.row.appendChild(el('div', 'ph', '手札をタップして ここに並べる'));
    var sf = surfaceOf(R.row, evaluate(R.row));
    R.row.forEach(function (c, i) {
      var e = cardEl(c, 'row', i, sf ? sf[i] : guessForm(c, R.row[i - 1])); G_.row.appendChild(e);
      $('.rm', e).onpointerdown = function (ev) { ev.stopPropagation(); };
      $('.rm', e).onclick = function (ev) { ev.stopPropagation(); if (G_.busy) return; SFX.tap(); R.row.splice(R.row.indexOf(c), 1); if (!c.tsu) R.hand.push(c); renderRow(); renderHand(); };
      e.onpointerdown = function (ev) { if (G_.busy) return; dragStart(ev, c, e); };
    });
    updatePreview(); if (G_.bt) renderBtns();
  }
  var drag = null;
  function dragStart(ev, c, e) {
    drag = { c: c, e: e, x: ev.clientX, y: ev.clientY, moved: false };
    e.setPointerCapture && e.setPointerCapture(ev.pointerId);
    e.onpointermove = function (m) {
      if (!drag) return; var dx = m.clientX - drag.x, dy = m.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 8) { drag.moved = true; e.classList.add('drag'); }
      if (drag.moved) { e.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.08)'; var to = slotIndex(m.clientX, m.clientY, e); markInsert(to); }
    };
    e.onpointerup = function (u) {
      var d = drag; drag = null; e.onpointermove = e.onpointerup = null; if (!d) return;
      if (!d.moved) { if (cyclable(c)) { cycle(c); SFX.tap(); renderRow(); renderHand(); } return; }
      var to = slotIndex(u.clientX, u.clientY, e), from = R.row.indexOf(c);
      R.row.splice(from, 1); if (to > from) to--; R.row.splice(Math.max(0, Math.min(R.row.length, to)), 0, c); SFX.put(); renderRow();
    };
  }
  function slotIndex(x, y, self) {
    var els = Array.prototype.filter.call(G_.row.querySelectorAll('.card'), function (n) { return n !== self; }), idx = els.length;
    for (var i = 0; i < els.length; i++) { var r = els[i].getBoundingClientRect(); if (y < r.top - 6) { idx = i; break; } if (y <= r.bottom + 6 && x < r.left + r.width / 2) { idx = i; break; } }
    var real = idx < els.length ? +els[idx].dataset.i : R.row.length; return real;
  }
  function markInsert(i) { Array.prototype.forEach.call(G_.row.querySelectorAll('.card'), function (n) { n.classList.toggle('ins', +n.dataset.i === i); }); }

  var cur = null;
  function updatePreview() {
    var ev = cur = evaluate(R.row);
    if (G_.vs) return G_.vs.preview(ev);
    G_.sent.className = 'sent ' + ev.state; G_.msg.textContent = '';
    if (ev.state === 'empty') { G_.sent.textContent = ''; G_.yk.textContent = ''; G_.ch.textContent = '0'; G_.ml.textContent = '0'; if (G_.bp) G_.bp.disabled = true; return; }
    if (ev.state === 'ok') {
      var ctx = { first: R.first, last: R.hands === 1 }, sc = scoreOf(ev, ctx), y = sc.y;
      G_.sent.textContent = ev.text; G_.yk.textContent = '役:' + y.name + '(' + ev.f.words + '語)';
      G_.ch.textContent = sc.chips; G_.ml.textContent = sc.mult;
      G_.msg.innerHTML = notes(ev.f, sc.rep);
      if (sc.bossFail) G_.msg.textContent = '👹 ' + R.boss.text;
      if (G_.bp) G_.bp.disabled = G_.mode !== 'play';
    } else {
      G_.sent.textContent = rowText(R.row); G_.yk.textContent = ''; G_.ch.textContent = '–'; G_.ml.textContent = '–';
      G_.msg.textContent = (ev.state === 'bad' ? '✕ ' : '… ') + (ev.msg || ''); if (G_.bp) G_.bp.disabled = true;
    }
  }
  // 場:捨て札は表向き。補充のときは、点数ぶんの捨て札ptで取れる
  function renderField() {
    G_.fd.innerHTML = ''; G_.pt.textContent = R.pts;
    if (!R.field.length) G_.fd.appendChild(el('div', 'ph', 'まだ何も捨てていない'));
    R.field.forEach(function (c) {
      var e = cardEl(c, 'field', 0), cost = c.chips + c.bonus, can = G_.mode === 'refill' && R.pts >= cost; e.classList.add('mini'); if (G_.mode === 'refill') e.classList.add(can ? 'can' : 'cant');
      e.onclick = function () { if (G_.mode !== 'refill') { flash('捨てたあとの補充で、' + cost + 'pt 払うと取れる'); return; } if (!Core.take(c)) { SFX.bad(); flash('捨て札ptが足りない(' + cost + 'pt 必要)'); return; } SFX.coin(); afterRefill(); };
      G_.fd.appendChild(e);
    });
    G_.fh.textContent = G_.mode === 'refill' ? 'あと ' + R.refill + ' 枚:山から引く か、場のカードをタップして取る' : '';
  }
  function renderBtns() {
    if (G_.vs) return G_.vs.btns();
    G_.bt.innerHTML = ''; var b = function (cls, txt, fn, dis) { var x = el('button', 'btn ' + cls, txt); x.onclick = fn; x.disabled = !!dis; G_.bt.appendChild(x); return x; };
    if (G_.mode === 'disc') { b('ghost', 'やめる', function () { G_.mode = 'play'; G_.mark = []; SFX.tap(); renderAll(); }); b('disc', G_.mark.length ? G_.mark.length + '枚 捨てる' : '捨てるカードをえらぶ', doDiscard, !G_.mark.length); return; }
    if (G_.mode === 'refill') { b('ghost', '山から引く(あと' + R.refill + ')', function () { Core.drawOne(); SFX.put(); afterRefill(); }); b('go', 'ぜんぶ山から', function () { while (R.refill > 0) Core.drawOne(); SFX.put(); afterRefill(); }); return; }
    G_.bd = b('disc', '捨てる', function () { if (!R.discards) { flash('このステージではもう捨てられない'); return; } G_.mode = 'disc'; G_.mark = []; SFX.tap(); renderAll(); }, !R.discards || G_.busy);
    G_.bp = b('play', '出す!', play, !cur || cur.state !== 'ok' || G_.busy); G_.bp.id = 'bp'; G_.bd.id = 'bd';
  }
  function doDiscard() { if (!G_.mark.length) return; Core.discard(G_.mark.slice()); G_.mark = []; G_.mode = 'refill'; SFX.tap(); renderAll(); }
  function afterRefill() { if (R.refill <= 0) G_.mode = 'play'; renderAll(); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function bump(n) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
  async function play() {
    if (G_.busy || !cur || cur.state !== 'ok' || G_.mode !== 'play') return; G_.busy = true; renderBtns();
    var ctx = { first: R.first, last: R.hands === 1 }, sc = scoreOf(cur, ctx), text = cur.text;
    speak(text); R.first = false; R.hands--; R.played++; renderTop();
    // 役 → カード1枚ずつ → ジョーカー の順に数字が上がっていく
    var cards = G_.row.querySelectorAll('.card'), jks = G_.jk.querySelectorAll('.joker');
    for (var k = 0; k < sc.steps.length; k++) {
      var st = sc.steps[k];
      if (st.t === 'yaku') { G_.yk.textContent = '役:' + st.label; bump(G_.yk); SFX.mult(0); await wait(380); }
      if (st.t === 'card') { var ce = cards[st.i]; if (ce) { ce.classList.add('hit'); floatTxt(ce, '+' + st.add + (st.tag ? ' ' + st.tag : ''), 'c'); } SFX.chip(k); await wait(150); }
      if (st.t === 'note') { floatTxt(G_.yk, st.txt, 'x'); SFX.bad(); await wait(500); }
      if (st.t === 'joker') { var je = jks[st.ji]; if (je) { bump(je); floatTxt(je, st.txt, /×/.test(st.txt) ? 'x' : /倍/.test(st.txt) ? 'm' : 'c'); } SFX.joker(); await wait(420); }
      G_.ch.textContent = st.chips; G_.ml.textContent = st.mult; bump(G_.ch); bump(G_.ml);
    }
    if (sc.bossFail) { G_.msg.textContent = '👹 ボスの条件を満たしていない… 0点'; SFX.bad(); await wait(900); }
    var total = sc.total; await countUp(total);
    if (total > R.best.pts) R.best = { text: text, pts: total };
    R.total += total; afterPlay(cur, sc);
    R.disc = R.disc.concat(R.row.filter(function (c) { return !c.tsu; })); R.row = [];
    await wait(350); deal(); G_.busy = false;
    if (R.score >= R.target) { stageClear(); return; }
    if (R.hands <= 0) { finalReveal(); return; }
    renderAll();
  }
  // 出したあと:役のくり返し・話のつながり・お題・名コンビ図鑑・ゲストのスカウト
  function afterPlay(ev, sc) {
    R.yakuCnt[sc.y.name] = (R.yakuCnt[sc.y.name] || 0) + 1; R.prev = ev.nps; R.stageF.push(ev.f);
    var got = [];
    R.missions.forEach(function (x) { if (!x.done && missionHit(x.m, ev.f)) { x.done = true; var g = x.m.tier + 1; R.money += g; got.push('🎯「' + x.m.label + '」達成 💰+' + g); } });
    if (got.length && R.missions.every(function (x) { return x.done; })) { R.money += 3; got.push('🎯 お題ぜんぶ達成! 💰+3'); }
    got.forEach(function (t, i) { setTimeout(function () { flash(t); SFX.coin(); renderTop(); }, 300 + i * 1900); });
    if (ev.f.colloc === 'good' && addCombo(ev.f.pair)) { R.money++; flash('📖 名コンビ図鑑に登録!「' + ev.f.pair + '」💰+1'); }
    R.row.forEach(function (c) { if (c.guest) { c.guest = false; c.scout = true; R.deck.push(c); setTimeout(function () { flash('⭐ スカウト!「' + cardText(c) + '」が山札に入った'); }, 900); } });
  }
  function addCombo(pair) { var l = store.get('combos') || []; if (l.indexOf(pair) >= 0) return false; l.push(pair); store.set('combos', l); return true; }
  // ---- シークレットお題 ----
  var QUESTS = [
    ['past', '過去形', 0], ['neg', '否定(not)', 0], ['place', '場所の句', 0], ['time', '時の句', 0], ['adj', '形容詞', 0], ['O', '目的語', 0],
    ['prog', '進行形', 1], ['aux', '助動詞', 1], ['clause', 'because / when / if', 1], ['C', '補語(be + 形容詞など)', 1], ['story', '話のつながり', 1], ['combo', '名コンビ', 1],
    ['perfect', '完了形', 2], ['passive', '受け身', 2], ['post', '後置修飾', 2], ['phrasal', '句動詞', 2], ['gerund', '動名詞', 2], ['padj', '分詞の形容詞', 2]
  ].map(function (q) { return { k: q[0], label: q[1], tier: q[2] }; });
  // 普通のお題(中身が見える)
  var MISSIONS = [
    ['food', '食べ物か飲み物の名詞を使う', 0, function (f) { return f.cats.food || f.cats.drink; }],
    ['animal', '動物の名詞を使う', 0, function (f) { return f.cats.animal; }],
    ['placeN', '場所の名詞を使う', 0, function (f) { return f.cats.place; }],
    ['art2', 'a と the を両方使う', 0, function (f) { return f.det_a && f.det_the; }],
    ['len6', '6語以上の文', 0, function (f) { return f.words >= 6; }],
    ['len4', 'ちょうど4語の文', 1, function (f) { return f.words === 4; }],
    ['nounSubj', '主語を代名詞以外にする', 1, function (f) { return !f.pronSubj; }],
    ['pastProg', '過去進行形(was/were + -ing)', 1, function (f) { return f.past && f.prog; }],
    ['this', 'this / that を使う', 1, function (f) { return f.det_this || f.det_that; }],
    ['adj2', '形容詞を2つ使う', 1, function (f) { return f.adj >= 2; }],
    ['plural', '名詞の複数形を使う', 1, function (f) { return f.plural; }],
    ['rare2', 'むずかしい語を2枚使う', 2, function (f) { return f.rare >= 2; }],
    ['guest', '金枠のゲストカードを使う', 2, function (f) { return f.guest; }],
    ['len8', '8語以上の文', 2, function (f) { return f.words >= 8; }],
    ['it', 'it を使う', 2, function (f) { return f.it; }],
    ['opt', '目的語+場所+時 を1文に', 2, function (f) { return f.O && f.place && f.time; }]
  ].map(function (m) { return { k: m[0], label: m[1], tier: m[2], t: m[3] }; });
  function pickMissions(used, n) {
    var tiers = n === 1 ? [Math.floor(rnd() * 3)] : [0, 1, 2];
    return tiers.map(function (t) { var pool = MISSIONS.filter(function (m) { return m.tier === t && used.indexOf(m.k) < 0; }); if (!pool.length) { pool = MISSIONS.filter(function (m) { return m.tier === t; }); } var m = pick(pool); used.push(m.k); return { m: m, done: false }; });
  }
  function missionHit(m, f) { try { return !!m.t(f); } catch (e) { return false; } }
  var Q_PCT = [10, 20, 30], TIER_JA = ['やさしい', 'ふつう', 'むずかしい'];
  function questHit(q, f) { return q.k === 'story' ? !!(f.story || f.storyP) : q.k === 'adj' ? f.adj > 0 : !!f[q.k]; }
  function pickQuest(used) {
    var cands = [0, 1, 2].map(function (t) { var pool = QUESTS.filter(function (q) { return q.tier === t && used.indexOf(q.k) < 0; }); if (!pool.length) pool = QUESTS.filter(function (q) { return q.tier === t; }); return pick(pool); });
    var secret = pick(cands); used.push(secret.k); return { cands: cands, secret: secret };
  }
  function questBar(Q, fs) {
    return '🔒 シークレットお題(このうちどれか1つ):' + Q.cands.map(function (q) { var hit = fs.some(function (f) { return questHit(q, f); }); return '<span class="qc t' + q.tier + (hit ? ' hit' : '') + '">' + (hit ? '✔ ' : '') + q.label + '</span>'; }).join('');
  }
  async function finalReveal() {
    var Q = R.quest, hit = R.stageF.some(function (f) { return questHit(Q.secret, f); }), bonus = hit ? Math.round(R.target * Q_PCT[Q.secret.tier] / 100) : 0;
    var o = el('div', 'modal', '<div class="box"><h2>🔒 シークレットお題は…</h2><div class="qrev t' + Q.secret.tier + '">' + Q.secret.label + '</div><p class="res ' + (hit ? 'w' : 'l') + '">' + (hit ? '達成! 目標の' + Q_PCT[Q.secret.tier] + '% = +' + bonus + '点' : '出していなかった…') + '</p><button class="btn go" id="ok">つづける</button></div>');
    root.appendChild(o); if (hit) SFX.win(); else SFX.bad();
    await new Promise(function (r) { $('#ok', o).onclick = r; }); o.remove();
    R.questDone = true;
    if (hit) { await countUp(bonus); R.total += bonus; }
    if (R.score >= R.target) { flash('🎉 逆転クリア!'); stageClear(); } else gameOver();
  }
  function floatTxt(target, txt, kind) { var r = target.getBoundingClientRect(), rr = root.getBoundingClientRect(), f = el('div', 'float ' + kind, txt); f.style.left = (r.left - rr.left + r.width / 2) + 'px'; f.style.top = (r.top - rr.top) + 'px'; root.appendChild(f); setTimeout(function () { f.remove(); }, 900); }
  async function countUp(total) {
    var from = R.score, to = R.score + total, big = el('div', 'bigscore', '0'); root.appendChild(big);
    var steps = 18; for (var i = 1; i <= steps; i++) { big.textContent = Math.round(total * i / steps).toLocaleString(); R.score = Math.round(from + (to - from) * i / steps); renderTop(); if (i % 3 === 0) SFX.coin(); await wait(28); }
    R.score = to; renderTop(); await wait(500); big.remove();
  }
  function interestCap() { return R.jokers.some(function (j) { return j.id === 'bank'; }) ? 10 : 5; }
  function stageClear() {
    SFX.win();
    var base = R.boss ? 5 : 3, left = R.hands, interest = Math.min(interestCap(), Math.floor(R.money / 5)), one = R.handsMax - R.hands === 1 ? 5 : 0, dl = R.discards;
    var Q = R.quest, qhit = !R.questDone && R.stageF.some(function (f) { return questHit(Q.secret, f); }), qm = qhit ? [2, 3, 4][Q.secret.tier] : 0;
    var gain = base + left + interest + one + dl + qm; R.money += gain;
    saveBest(R.stage + 1);
    if (R.stage >= 7) { showEnd(true); return; }
    var s = screen('<div class="clear"><h1>ステージ ' + (R.stage + 1) + ' クリア!</h1><div class="pay"><div>クリア報酬<b>+' + base + '</b></div><div>残りの「出す」×' + left + '<b>+' + left + '</b></div>' + (one ? '<div>⚡ 一発クリア<b>+5</b></div>' : '') + (dl ? '<div>使わなかった「捨てる」×' + dl + '<b>+' + dl + '</b></div>' : '') +
      (R.questDone ? '' : '<div>🔒 シークレット「' + Q.secret.label + '」' + (qhit ? '達成' : 'ならず') + '<b>+' + qm + '</b></div>') + '<div>利子(5ごとに1)<b>+' + interest + '</b></div></div><div class="money big">💰 ' + R.money + '</div><button class="btn go" id="sh">お店へ</button></div>');
    $('#sh', s).onclick = function () { SFX.tap(); R.stage++; R.rerollCost = 2; showShop(true); };
  }
  function saveBest(stage) { var b = store.get('best') || {}; if (!b.stage || stage > b.stage || (stage === b.stage && R.total > (b.total || 0))) store.set('best', { stage: stage, total: R.total, text: R.best.text }); }
  // ---------------- お店 ----------------
  var shopItems = null;
  function rollShop() {
    var owned = R.jokers.map(function (j) { return j.id; }), pool = shuffle(JOKERS.filter(function (j) { return owned.indexOf(j.id) < 0; }));
    shopItems = [];
    pool.slice(0, 2).forEach(function (j) { shopItems.push({ t: 'joker', j: j, price: j.price }); });
    shopItems.push({ t: 'pack', price: 4 });
    var keys = ['O', 'place', 'time', 'past', 'aux', 'prog', 'perfect', 'manner', 'C', 'neg', 'clause', 'passive', 'post', 'phrasal', 'gerund', 'padj'], k = pick(keys);
    shopItems.push({ t: 'book', key: k, price: 3 });
    shopItems.push(rnd() < .4 ? { t: 'it', price: 5 } : { t: 'boost', price: 3 });
  }
  function showShop(fresh) {
    if (fresh) rollShop();
    var s = screen('<div class="shop"><div class="shead"><h1>お店</h1><div class="money">💰 <b>' + R.money + '</b></div></div><div class="next">つぎ:' + (BOSS_AT[R.stage] ? '👹 ボス ' : 'ステージ ') + (R.stage + 1) + '(目標 ' + TARGETS[R.stage].toLocaleString() + ')</div>' +
      '<div class="items" id="items"></div><div class="myj"><div class="lbl">持っているジョーカー(タップで売る)</div><div class="jokers" id="mj"></div></div>' +
      '<div class="sbtns"><button class="btn ghost" id="rr">入れかえ 💰' + R.rerollCost + '</button><button class="btn go" id="nx">つぎへ</button></div></div>');
    var box = $('#items', s);
    shopItems.forEach(function (it, i) {
      if (!it) { box.appendChild(el('div', 'item sold', '<span>売り切れ</span>')); return; }
      var face = it.t === 'joker' ? '<div class="joker"><b>' + it.j.name + '</b><span>' + it.j.desc + '</span></div>'
        : it.t === 'pack' ? '<div class="pack">単語<br>パック</div>' : it.t === 'book' ? '<div class="pack book">文型の本<br><small>' + PART_JA[it.key] + '</small></div>' : it.t === 'it' ? '<div class="pack itp">it<br><small>万能</small></div>' : '<div class="pack boost">カード<br>強化</div>';
      var desc = it.t === 'joker' ? 'ジョーカー(最大5枚)' : it.t === 'pack' ? '3枚の中から1枚えらんで山札へ' : it.t === 'book' ? '「' + PART_JA[it.key] + '」の入った役が チップ+10・倍率+1(いまLv' + (R.lv[it.key] || 0) + ')' : it.t === 'it' ? '万能カード「it」を山札へ。どの動詞の目的語にも入り、主語にもなれる' : '山札のカード1枚の点を+15';
      var e = el('div', 'item' + (R.money < it.price ? ' poor' : ''), face + '<div class="desc">' + desc + '</div><div class="price">💰' + it.price + '</div>');
      e.onclick = function () { buy(i); }; box.appendChild(e);
    });
    var mj = $('#mj', s); for (var j = 0; j < 5; j++) { var jj = R.jokers[j], e2 = el('div', 'joker' + (jj ? '' : ' empty'), jj ? '<b>' + jj.name + '</b><span>' + jj.desc + '</span>' : '<span>空き</span>'); if (jj) (function (jj) { e2.onclick = function () { if (confirmSell(jj)) { } }; })(jj); mj.appendChild(e2); }
    $('#rr', s).onclick = function () { if (R.money < R.rerollCost) { SFX.bad(); return; } R.money -= R.rerollCost; R.rerollCost++; SFX.coin(); showShop(true); };
    $('#nx', s).onclick = function () { SFX.put(); startStage(); };
  }
  function confirmSell(j) {
    var o = el('div', 'modal', '<div class="box"><h2>' + j.name + '</h2><p>' + j.desc + '</p><p>売ると 💰' + Math.floor(j.price / 2) + '</p><button class="btn disc" id="ys">売る</button><button class="btn ghost" id="no">やめる</button></div>');
    root.appendChild(o); $('#no', o).onclick = function () { o.remove(); };
    $('#ys', o).onclick = function () { R.jokers.splice(R.jokers.indexOf(j), 1); R.money += Math.floor(j.price / 2); SFX.coin(); o.remove(); showShop(false); };
  }
  function buy(i) {
    var it = shopItems[i]; if (!it) return; if (R.money < it.price) { SFX.bad(); return; }
    if (it.t === 'joker') { if (R.jokers.length >= 5) { flash('ジョーカーは5枚まで(売ってから買おう)'); SFX.bad(); return; } R.money -= it.price; R.jokers.push(it.j); shopItems[i] = null; SFX.joker(); showShop(false); return; }
    if (it.t === 'book') { R.money -= it.price; R.lv[it.key] = (R.lv[it.key] || 0) + 1; shopItems[i] = null; SFX.joker(); showShop(false); return; }
    if (it.t === 'pack') { R.money -= it.price; shopItems[i] = null; SFX.coin(); openPack(); return; }
    if (it.t === 'it') { R.money -= it.price; shopItems[i] = null; R.deck.push(mk('pron', 'it')); SFX.joker(); showShop(false); return; }
    if (it.t === 'boost') { R.money -= it.price; shopItems[i] = null; SFX.coin(); openBoost(); return; }
  }
  // ゲストカード:山札にない上級の語(金色・点2倍)。文に使えばスカウトして山札へ
  function guestCard() {
    var lv = Math.min(4, 2 + Math.floor((((R && R.stage) || 0)) / 3)), ok = function (e) { return (e.lv || 1) >= 2 && (e.lv || 1) <= lv; }, r = rnd(), c = null;
    for (var t = 0; t < 6 && !c; t++) {
      if (r < .35) { var vs = DICT.all('verb').filter(function (e) { return ok(e) && !e.tail && e.fr !== 'cl' && !e.cv && !e.link && e.w.indexOf(' ') < 0; }); if (vs.length) c = mk('v', pick(vs).w); }
      else if (r < .75) { var ns = DICT.all('noun').filter(function (e) { return ok(e) && e.cat !== 'time'; }); if (ns.length) c = mk('n', pick(ns).w); }
      else { var as = DICT.all('adj').filter(ok); if (as.length) c = mk('adj', pick(as).w); }
      r = rnd();
    }
    if (c) { c.guest = true; c.chips = baseChips(c) * 2; }
    return c;
  }
  function randomCard() {
    if (rnd() < .04) return mk('pron', 'it');
    var r = rnd(), lv = Math.min(3, 1 + Math.floor(((R && R.stage) || 0) / 3)), ok = function (e) { return (e.lv || 1) <= lv + 1 && (e.lv || 1) >= 1; };
    if (r < .3) { var vs = DICT.all('verb').filter(function (e) { return ok(e) && !e.tail && e.fr !== 'cl' && !e.cv && !e.link; }); return mk('v', pick(vs).w); }
    if (r < .65) { var ns = DICT.all('noun').filter(function (e) { return ok(e) && (e.cat !== 'time' || e.prep); }); return mk('n', pick(ns).w); }
    if (r < .82) return mk('adj', pick(DICT.all('adj').filter(ok)).w);
    if (r < .95) return mk('adv', pick(DICT.all('adv').filter(function (e) { return e.k === 'manner' || e.k === 'time' || e.k === 'place'; })).w);
    return mk('pron', pick(['i', 'you', 'he', 'she', 'we', 'they']));
  }
  function openPack() {
    var cs = [randomCard(), randomCard(), randomCard()].filter(Boolean);
    var o = el('div', 'modal', '<div class="box"><h2>1枚えらんで山札へ</h2><div class="pick" id="pk"></div><button class="btn ghost" id="sk">いらない</button></div>'); root.appendChild(o);
    cs.forEach(function (c) { var e = cardEl(c, 'hand', 0); e.classList.add('big'); var w = el('div', 'pc'); w.appendChild(e); w.appendChild(el('div', 'ja', (c.w.e ? c.w.e.ja : '') + '<br><small>' + KIND_JA[c.kind] + '</small>')); w.onclick = function () { R.deck.push(c); SFX.put(); o.remove(); showShop(false); }; $('#pk', o).appendChild(w); });
    $('#sk', o).onclick = function () { o.remove(); showShop(false); };
  }
  function openBoost() {
    var o = el('div', 'modal', '<div class="box"><h2>強化するカードをえらぶ(+15)</h2><div class="pick scroll" id="pk"></div></div>'); root.appendChild(o);
    R.deck.forEach(function (c) { var e = cardEl(c, 'hand', 0); e.onclick = function () { c.bonus += 15; SFX.joker(); o.remove(); showShop(false); }; $('#pk', o).appendChild(e); });
  }
  function flash(t) { var f = el('div', 'toast', t); root.appendChild(f); setTimeout(function () { f.remove(); }, 1800); }
  function gameOver() { SFX.lose(); saveBest(R.stage + 1); showEnd(false); }
  function showEnd(win) {
    var s = screen('<div class="end"><h1>' + (win ? '🏆 全ステージ クリア!' : 'ゲームオーバー') + '</h1><div class="st">ステージ ' + (R.stage + 1) + (win ? '' : ' で目標に届かず(' + R.score.toLocaleString() + ' / ' + R.target.toLocaleString() + ')') + '</div>' +
      '<div class="tot">合計 ' + R.total.toLocaleString() + '点 ・ 文 ' + R.played + '本</div>' +
      (R.best.text ? '<div class="bestS"><div class="lbl">いちばん高かった文(' + R.best.pts.toLocaleString() + '点)</div><div class="t">' + R.best.text + '</div><button class="btn ghost small" id="sp">🔊 聞く</button></div>' : '') +
      '<button class="btn go" id="re">もう一回</button><button class="btn ghost" id="tt">タイトルへ</button></div>');
    if ($('#sp', s)) $('#sp', s).onclick = function () { speak(R.best.text); };
    $('#re', s).onclick = function () { SFX.put(); newRun(); }; $('#tt', s).onclick = function () { showTitle(); };
  }
  // 対戦モード(cards/vs.js)に中の部品を渡す
  window.ChunkKit = { G: G, CFG: CFG, $: $, el: el, rnd: rnd, pick: pick, shuffle: shuffle, store: store, SFX: SFX, speak: speak, unlock: unlock,
    mk: mk, card: card, starterDeck: starterDeck, randomCard: randomCard, TSU: TSU, tsuCard: tsuCard, cardText: cardText, cardEl: cardEl, colorOf: colorOf, lvOf: lvOf, cat: cat, verbFits: verbFits,
    evaluate: evaluate, yaku: yaku, JOKERS: JOKERS, PART_JA: PART_JA, KIND_JA: KIND_JA, Core: Core, fillTo: fillTo,
    G_: G_, getR: function () { return R; }, setR: function (x) { R = x; }, screen: screen, showTitle: showTitle, flash: flash, wait: wait, bump: bump, floatTxt: floatTxt,
    renderRow: renderRow, surfaceOf: surfaceOf, baseScore: baseScore, QUESTS: QUESTS, MISSIONS: MISSIONS, pickMissions: pickMissions, missionHit: missionHit, Q_PCT: Q_PCT, TIER_JA: TIER_JA, questHit: questHit, pickQuest: pickQuest, addCombo: addCombo, guestCard: guestCard, notes: notes, baseChips: baseChips, rowText: rowText, renderHand: renderHand, renderTsu: renderTsu, cur: function () { return cur; }, root: function () { return root; } };
  // テスト用
  window.ChunkCards = { mount: mount, _R: function () { return R; }, _eval: evaluate, _scoreOf: scoreOf, _mk: mk, _tsu: tsuCard, _yaku: yaku, _features: features, JOKERS: JOKERS };
  document.addEventListener('DOMContentLoaded', function () { var r = document.getElementById('app'); if (r) mount(r); });
})();
