import { Kit as K } from './play.js';
/* ===== チャンク・カード:CPU対戦(ポーカー型) =====
   ・2人で山札と「場」を共有。手札8枚。交換を3回ずつ(捨てたカードは表向きで場へ)。
   ・1回目の交換のあとと、最後に「賭け」。最後に文を見せ合って、点が高いほうがポットを取る。 */
  var G = K.G, $ = K.$, el = K.el, rnd = K.rnd, pick = K.pick, shuffle = K.shuffle, SFX = K.SFX, G_ = K.G_;

  // ---------------- CPU:手札からいちばん点の高い文をさがす ----------------
  function T(spec) { return K.tsuCard(spec); }
  function form(c, patch) { var n = {}; for (var k in c) n[k] = c[k]; n.w = {}; for (var j in c.w) n.w[j] = c.w[j]; for (var p in patch) n.w[p] = patch[p]; return n; }
  var QCTX = null; // CPU が探すときに、お題の当たりやすさも点に入れる
  function scoreRow(row, ev, rule) {
    var b = K.baseScore(row, ev), y = b.y, chips = b.chips, mult = b.mult;
    if (rule) rule.fx(ev.f, { y: y }).forEach(function (e) { if (e[0] === 'c') chips += e[1]; else if (e[0] === 'm') mult += e[1]; else mult = Math.round(mult * e[1] * 10) / 10; });
    return { y: y, chips: chips, mult: mult, total: Math.floor(chips * mult) };
  }
  function isSubj(c) { return (c.kind === 'pron' && c.w.v !== 'it') || (c.kind === 'n' && /^(person|animal)$/.test(c.w.e.cat)); }
  function count(c) { return G.isCount(c.w.e) && !c.w.e.ind; }
  // 名詞のかたまりの候補(使うカードの id つき)
  function npOpts(n, adjs, asSubj) {
    var o = [], det = function (d) { return T(['det', d]); };
    if (n.kind === 'pron') { o.push([n]); return o; }
    var e = n.w.e, cnt = count(n);
    if (e.ind || e.cat === 'time' || e.cat === 'place' && !cnt) { o.push([n]); }
    else {
      o.push([det('the'), n]);
      if (cnt && !asSubj) o.push([det('a'), n]);
      if (cnt) o.push([form(n, { pl: true })]);
      if (asSubj && e.cat === 'person') o.push([T(['pos', 'i', 'my']), n]);
      adjs.slice(0, 2).forEach(function (a) { o.push([det(cnt && !asSubj ? 'a' : 'the'), a, n]); });
    }
    return o;
  }
  function vpOpts(v, lvl) {
    var o = [[form(v, { f: 'base' })], [form(v, { f: 'past' })]];
    if (lvl >= 1) { o.push([T(['be', 'pres']), form(v, { f: 'ing' })]); o.push([T(['modal', 'can']), form(v, { f: 'base' })]); }
    if (lvl >= 2) { o.push([T(['hv', 'pres']), form(v, { f: 'pp' })]); o.push([T(['modal', 'will']), form(v, { f: 'base' })]); o.push([T(['be', 'past']), form(v, { f: 'ing' })]); }
    return o;
  }
  var MOTION = ['go', 'come', 'run', 'walk', 'move', 'fly', 'drive', 'travel', 'return', 'swim', 'jump', 'hurry', 'ride', 'climb'];
  function motion(row) { var v = row.filter(function (c) { return c.kind === 'v'; })[0]; return v && MOTION.indexOf(v.w.e.w) >= 0; }
  function ids(row) { var s = {}; row.forEach(function (c) { if (!c.tsu) s[c.id] = 1; }); return s; }
  function overlap(a, b) { var s = ids(a); return b.some(function (c) { return !c.tsu && s[c.id]; }); }
  // lvl 0:やさしい 1:ふつう 2:つよい
  function search(hand, rule, lvl, budget) {
    var memo = {}, n = 0, max = budget || 260;
    function key(row) { return row.map(function (c) { return (c.tsu ? 't' : c.id) + ':' + K.cardText(c) + (c.w.f || '') + (c.w.pl ? 'p' : ''); }).join('|'); }
    function ev(row) {
      var k = key(row); if (k in memo) return memo[k];
      if (n >= max) return null; n++;
      var e = K.evaluate(row), r = null;
      if (e.state === 'ok') { var sc = scoreRow(row, e, rule), q = 0; if (QCTX) { QCTX.cands.forEach(function (c) { if (K.questHit(c, e.f)) q += K.Q_PCT[c.tier] / 300; }); if (V && V.mission && K.missionHit(V.mission, e.f)) q += .1; } r = { row: row, ev: e, score: Math.round(sc.total * (1 + q)), sc: sc }; }
      memo[k] = r; return r;
    }
    var subs = hand.filter(isSubj), verbs = hand.filter(function (c) { return c.kind === 'v'; }), nouns = hand.filter(function (c) { return c.kind === 'n' || c.kind === 'pron'; }), adjs = hand.filter(function (c) { return c.kind === 'adj'; }), advs = hand.filter(function (c) { return c.kind === 'adv'; });
    var cores = [];
    // 1) 主語+動詞(+目的語)を現在形で
    subs.forEach(function (s) {
      npOpts(s, adjs, true).slice(0, 3).forEach(function (S) {
        verbs.forEach(function (v) {
          var V = [form(v, { f: 'base' })];
          if (v.w.e.fr !== 'tr') { var r = ev(S.concat(V)); if (r) cores.push({ S: S, v: v, O: null, r: r }); }
          if (v.w.e.fr === 'intr') return;
          nouns.forEach(function (o) {
            if (o === s || (o.kind === 'n' && !K.verbFits(v, o)) || (o.kind === 'pron' && o.w.v !== 'it' && (v.w.e.ot || []).indexOf('person') < 0) || /^(time|place)$/.test(o.kind === 'n' && o.w.e.cat)) return;
            npOpts(o, [], false).slice(0, 2).forEach(function (O) { if (overlap(S, O)) return; var r2 = ev(S.concat(V, O)); if (r2) cores.push({ S: S, v: v, O: O, r: r2 }); });
          });
        });
      });
    });
    if (!cores.length) return null;
    cores.sort(function (a, b) { return b.r.score - a.r.score; });
    // 2) 上位の形で時制を変えてみる
    var best = [];
    cores.slice(0, lvl ? 4 : 2).forEach(function (c) {
      vpOpts(c.v, lvl).forEach(function (V) { var row = c.S.concat(V, c.O || []), r = ev(row); if (r) best.push(r); });
    });
    best.sort(function (a, b) { return b.score - a.score; });
    // 3) うしろに場所・時・様子をつけ足す(良くなるかぎり)
    var exts = [];
    hand.forEach(function (c) {
      if (c.kind === 'adv') { var ax = [c]; ax.kind = c.w.e.k === 'time' ? 'time' : c.w.e.k === 'place' ? 'place' : 'adv'; exts.push(ax); }
      if (c.kind === 'n' && c.w.e.cat === 'place') { ['in', 'at', 'to'].forEach(function (p) { var x = [T(['prep', p])].concat(count(c) ? [T(['det', 'the']), c] : [c]); if (p === 'to') x.to = 1; x.kind = 'place'; exts.push(x); }); }
      if (c.kind === 'n' && c.w.e.cat === 'time') { ['in', 'on', 'at'].forEach(function (p) { var x = [T(['prep', p])].concat(count(c) && !c.w.e.ind ? [T(['det', 'the']), c] : [c]); x.kind = 'time'; exts.push(x); }); }
    });
    var top = null, steps = lvl === 0 ? 1 : lvl === 1 ? 2 : 4;
    best.slice(0, lvl ? 3 : 1).forEach(function (b0) {
      var curB = b0, kinds = {};
      for (var s = 0; s < steps; s++) {
        var nb = null, nk = null;
        exts.forEach(function (x) { if (overlap(curB.row, x) || (x.to && !motion(curB.row)) || (x.kind !== 'adv' && kinds[x.kind])) return; var r = ev(curB.row.concat(x)); if (r && r.score > (nb ? nb.score : curB.score)) { nb = r; nk = x.kind; } });
        if (!nb) break; curB = nb; kinds[nk] = 1;
      }
      if (!top || curB.score > top.score) top = curB;
    });
    // 4) つよい CPU:残りのカードでもう一つ文を作って and / because でつなぐ
    if (lvl >= 2 && top && rnd() < .4) {
      var rest = hand.filter(function (c) { return !ids(top.row)[c.id]; });
      if (rest.some(isSubj) && rest.some(function (c) { return c.kind === 'v'; })) {
        var sub = search(rest, rule, 1, 80);
        if (sub) ['and', 'because', 'but'].forEach(function (cj) { var r = ev(top.row.concat([T(['conj', cj])], sub.row)); if (r && r.score > top.score) top = r; });
      }
    }
    if (top) { top.n = n; var seen = {}; seen[top.ev.text] = 1; top.alts = Object.keys(memo).map(function (k) { return memo[k]; }).filter(function (r) { if (!r || seen[r.ev.text]) return false; seen[r.ev.text] = 1; return true; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 2); }
    return top;
  }

  // ---------------- 対戦の進行 ----------------
  var OPPS = [
    { id: 'mii', name: 'ミイ', face: '🐱', lv: 0, style: 'careful', tag: 'やさしい', desc: '慎重派。いい文ができたときしか賭けない。賭けてきたら本物かも。' },
    { id: 'baron', name: 'ハッタリ男爵', face: '🎩', lv: 1, style: 'bluff', tag: 'ふつう', desc: '弱い手でも平気で賭けてくる。わざと強いカードを捨てることも。' },
    { id: 'gon', name: 'ひろい屋ゴン', face: '🦝', lv: 2, style: 'collector', tag: 'つよい', desc: 'あなたの捨てたカードを拾っていく。and や because で長い文も作る。' }
  ];
  var QS = [[290, 360, 540], [390, 530, 640], [500, 680, 880]]; // CPU がふだん作れる点(25%・50%・75%)
  var HANDS = 6, ANTE = 5, BETS = { 1: 10, 3: 20 }, START = 100;
  var V = null, ME = null, CPU = null;
  function player() { return { lv: {}, stage: 2, hand: [], row: [], field: [], draw: [], disc: [], pts: 0, refill: 0, discards: 99, log: [] }; }
  // CPU の手番で共有の山・場を使う
  function withP(p, fn) { p.draw = ME.draw; p.disc = ME.disc; p.field = ME.field; K.setR(p); try { return fn(); } finally { ME.draw = p.draw; ME.disc = p.disc; ME.field = p.field; K.setR(ME); } }
  function start(opp) {
    if (!opp) { pickOpp(); return; }
    ME = player(); CPU = player(); K.setR(ME);
    var all = K.starterDeck(); for (var i = 0; i < 25; i++) { var c = K.randomCard(); if (c) all.push(c); } all.push(K.mk('pron', 'it'));
    V = { opp: opp, all: all, n: 0, med: { me: START, cpu: START }, first: rnd() < .5 ? 'me' : 'cpu', stats: { win: 0, lose: 0 } };
    showVS(); nextHand();
  }
  function pickOpp() {
    var rec = K.store.get('vs') || {};
    var o = el('div', 'modal', '<div class="box"><h2>対戦相手をえらぶ</h2><div class="opps" id="ops"></div>' +
      '<details class="vrules"><summary>対戦のルール</summary><ol><li>🪙100枚ずつ持って、6ハンド勝負。毎ハンド 参加費🪙5。</li><li>手札8枚。交換を<b>3回ずつ</b>交互に(1〜3枚捨てて補充、またはそのまま)。捨てたカードは<b>場に表向き</b>で並ぶので、相手が何を狙っているか読める。場のカードは捨て札ptで取れる(相手の欲しいカードを先に取るのもアリ)。</li><li>1回目の交換のあとと最後に<b>賭け</b>。チェック/ベット、相手が賭けたらコール/レイズ/降りる。</li><li>最後に台の文を見せ合い、点の高いほうがポットを総取り。台の文が間違っていると0点。</li><li>毎ハンド「ルール」が1つ付く(例:過去の文は倍率×2)。</li><li><b>リーチ</b>:役の要素が3つ以上ある文ができたら、自分の交換の番で「🀄 リーチ」(🪙5)。以後は台の文が固定で交換なし。点が+30%(1回目)/+20%(2回目)/+10%(3回目)。相手にも「リーチ中」と見える。</li><li><b>お題</b>:🎯 見えるお題を満たすと点+10%。🔒 シークレット(候補3つのうち1つが本命)が当たると+10/20/30%。ボーナスは合計+50%まで。</li><li><b>ゲストカード</b>:場の金枠のカードは、捨て札ptで取り合い。</li></ol></details>' +
      '<button class="btn ghost" id="cx">もどる</button></div>');
    K.root().appendChild(o);
    OPPS.forEach(function (op) {
      var r = rec[op.id] || { w: 0, l: 0 };
      var e = el('div', 'oppc', '<div class="face">' + op.face + '</div><div><b>' + op.name + '</b> <span class="lvtag l' + op.lv + '">' + op.tag + '</span><p>' + op.desc + '</p><small>戦績 ' + r.w + '勝 ' + r.l + '敗</small></div>');
      e.onclick = function () { SFX.put(); o.remove(); start(op); }; $('#ops', o).appendChild(e);
    });
    $('#cx', o).onclick = function () { o.remove(); };
  }
  function showVS() {
    var op = V.opp;
    var s = K.screen(
      '<div class="vtop"><div class="vh">ハンド <b id="vhn"></b>/' + HANDS + '</div><div class="pot">🪙 <b id="vpot">0</b><small>ポット</small></div><div class="vmed"><span>あなた<b id="vme"></b></span><span>' + op.face + '<b id="vcpu"></b></span></div><button class="vq" id="vq">✕</button></div>' +
      '<div class="opp"><div class="face">' + op.face + '</div><div class="oinfo"><div class="oname">' + op.name + '<small>捨て札pt <b id="opt">0</b></small></div><div class="backs" id="obk"></div></div><div class="bubble" id="obb"></div></div>' +
      '<div class="rule" id="vrule"></div><div class="vturn" id="vturn"></div>' +
      '<div class="board"><div class="row" id="row"></div>' +
      '<div class="pv"><div class="sent" id="sent"></div><div class="jt" id="jt"></div><div class="yk" id="yk"></div><div class="cm"><span class="chips" id="ch">0</span><span class="x">×</span><span class="mult" id="ml">0</span><span class="eq" id="eq"></span></div><div class="msg" id="msg"></div><div class="hp" id="hp"></div></div><button class="hintb" id="hb">💡 ヒント</button></div>' +
      '<div class="field"><div class="flbl"><span>場(<i class="me">あなた</i>/<i class="cp">' + op.name + '</i>の捨てたカード)</span><span class="pts">捨て札pt <b id="pt">0</b></span></div><div class="frow" id="fd"></div><div class="fhint" id="fh"></div></div>' +
      '<div class="tsu"><div class="tabs" id="tabs"></div><div class="tw" id="tw"></div></div>' +
      '<div class="hand" id="hand"></div><div class="btns" id="bt"></div>');
    ['row', 'sent', 'yk', 'ch', 'ml', 'msg', 'tabs', 'tw', 'hand', 'bt', 'fd', 'fh', 'pt'].forEach(function (k) { G_[k] = $('#' + k, s); });
    ['vhn', 'vpot', 'vme', 'vcpu', 'opt', 'obk', 'obb', 'vrule', 'vturn', 'eq', 'jt', 'hp', 'hb'].forEach(function (k) { G_[k] = $('#' + k, s); });
    G_.tab = G_.tab || 0; G_.mode = 'play'; G_.mark = []; G_.busy = false;
    G_.vs = { renderAll: renderAll, preview: preview, btns: btns }; G_.hb.onclick = K.doHint;
    $('#vq', s).onclick = function () { var o = el('div', 'modal', '<div class="box"><h2>対戦をやめる?</h2><p>ここでやめると負けになる。</p><button class="btn disc" id="y">やめる</button><button class="btn ghost" id="n">つづける</button></div>'); K.root().appendChild(o); $('#n', o).onclick = function () { o.remove(); }; $('#y', o).onclick = function () { o.remove(); V.quit = true; endMatch(true); }; };
  }
  function renderAll() { top(); K.renderRow(); K.renderTsu(); K.renderHand(); field(); btns(); }
  function top() {
    if (!G_.vhn) return;
    G_.vhn.textContent = V.n; G_.vpot.textContent = V.pot; G_.vme.textContent = V.med.me; G_.vcpu.textContent = V.med.cpu; G_.opt.textContent = CPU.pts;
    G_.obk.innerHTML = ''; CPU.hand.forEach(function () { G_.obk.appendChild(el('div', 'cback')); });
    G_.vrule.innerHTML = (V.rule ? '🎲 このハンドのルール:<b>' + V.rule.name + '</b> ' + V.rule.desc : '') + (V.mission ? '<div class="mbar">🎯 お題(達成で点+10%):<span class="mc t' + V.mission.tier + (cur && cur.state === 'ok' && K.missionHit(V.mission, cur.f) ? ' hit' : '') + '">' + (cur && cur.state === 'ok' && K.missionHit(V.mission, cur.f) ? '✔ ' : '') + V.mission.label + '</span></div>' : '') + (V.quest ? '<div class="qbar">🔒 シークレット(どれか1つ・当たると+10/20/30%):' + V.quest.cands.map(function (q) { var hit = cur && cur.state === 'ok' && K.questHit(q, cur.f); return '<span class="qc t' + q.tier + (hit ? ' hit' : '') + '">' + (hit ? '✔ ' : '') + q.label + '</span>'; }).join('') + '</div>' : '') +
      (V.ri && (V.ri.me || V.ri.cpu) ? '<div class="ribar">' + (V.ri.me ? '🀄 あなた リーチ中(+' + riPct(V.ri.me) + '%) ' : '') + (V.ri.cpu ? '🀄 ' + V.opp.name + ' リーチ中!' : '') + '</div>' : '');
    G_.vturn.innerHTML = V.turnTxt || '';
  }
  function say(t, cls) { if (!G_.obb) return; G_.obb.className = 'bubble on ' + (cls || ''); G_.obb.innerHTML = t; K.bump(G_.obb); }
  var cur = null;
  function myMul(t) { return Math.floor(t * K.LV_MULT[K.level()] * K.HINT_MULT[ME.hintLv || 0]); }
  function mulNote() { var o = []; if (K.level() !== 1) o.push(K.LV_JA[K.level()] + ' ×' + K.LV_MULT[K.level()]); return o.length ? '<br>' + o.join('・') : ''; }
  function preview(ev) {
    cur = ev; G_.sent.className = 'sent ' + ev.state; G_.msg.textContent = ''; G_.eq.textContent = '';
    if (ev.state === 'empty') { G_.sent.textContent = ''; G_.yk.textContent = '最後に台の文で勝負。手札をタップして並べよう'; G_.ch.textContent = '0'; G_.ml.textContent = '0'; return; }
    if (ev.state === 'ok') { var sc = scoreRow(ME.row, ev, V.rule); G_.sent.textContent = ev.text; G_.yk.textContent = '役:' + sc.y.name + '(' + ev.f.words + '語)'; G_.ch.textContent = sc.chips; G_.ml.textContent = sc.mult; G_.eq.textContent = '= ' + myMul(sc.total).toLocaleString(); G_.msg.innerHTML = K.notes(ev.f, 0) + mulNote(); top(); return; }
    G_.sent.textContent = K.rowText(ME.row); G_.yk.textContent = ''; G_.ch.textContent = '–'; G_.ml.textContent = '–'; G_.msg.textContent = K.errMsg(ev, ME.row);
  }
  function field() {
    G_.fd.innerHTML = ''; G_.pt.textContent = ME.pts;
    if (!ME.field.length) G_.fd.appendChild(el('div', 'ph', 'まだ誰も捨てていない'));
    ME.field.forEach(function (c) {
      var e = K.cardEl(c, 'field', 0), cost = c.chips + (c.bonus || 0), can = G_.mode === 'refill' && ME.pts >= cost; e.classList.add('mini', c.by === 'cpu' ? 'bycpu' : c.by === 'guest' ? 'byguest' : 'byme'); if (G_.mode === 'refill') e.classList.add(can ? 'can' : 'cant');
      e.onclick = function () { if (G_.mode !== 'refill') { K.flash('捨てたあとの補充で、' + cost + 'pt 払うと取れる'); return; } if (!K.Core.take(c)) { SFX.bad(); K.flash('捨て札ptが足りない(' + cost + 'pt 必要)'); return; } SFX.coin(); afterRefill(); };
      G_.fd.appendChild(e);
    });
    G_.fh.textContent = G_.mode === 'refill' ? 'あと ' + ME.refill + ' 枚:山から引く か、場のカードをタップして取る' : '';
  }
  var wait = K.wait, resolve = null;
  function act(v) { var r = resolve; resolve = null; if (r) r(v); }
  function ask(phase) { V.phase = phase; renderAll(); return new Promise(function (r) { resolve = r; }); }
  function btns() {
    var bt = G_.bt; if (!bt) return; bt.innerHTML = '';
    var b = function (cls, txt, fn, dis) { var x = el('button', 'btn ' + cls, txt); x.onclick = function () { if (!x.disabled) fn(); }; x.disabled = !!dis; bt.appendChild(x); return x; };
    if (G_.mode === 'disc') { b('ghost', 'やめる', function () { G_.mode = 'play'; G_.mark = []; SFX.tap(); renderAll(); }); b('disc', G_.mark.length ? G_.mark.length + '枚 捨てる' : '捨てるカードをえらぶ(3枚まで)', doDiscard, !G_.mark.length || G_.mark.length > 3); return; }
    if (G_.mode === 'refill') { b('ghost', '山から引く(あと' + ME.refill + ')', function () { K.Core.drawOne(); SFX.put(); afterRefill(); }); b('go', 'ぜんぶ山から', function () { while (ME.refill > 0) K.Core.drawOne(); SFX.put(); afterRefill(); }); return; }
    if (V.phase === 'turn') {
      b('disc', '捨てて交換', function () { G_.mode = 'disc'; G_.mark = []; SFX.tap(); renderAll(); }); b('ghost', '交換しない', function () { SFX.tap(); act('pass'); });
      var ok = canRiichi(); b('go small ri', '🀄 リーチ<br><small>' + (ok ? '🪙5・点+' + riPct(V.t) + '%' : '役3つ以上で') + '</small>', function () { act('riichi'); }, !ok); return;
    }
    if (V.phase === 'bet') {
      var q = V.betQ, amt = BETS[V.t];
      if (!q.face) { b('ghost', 'チェック', function () { act({ a: 'check' }); }); b('go', 'ベット ' + amt, function () { act({ a: 'bet' }); }, V.med.me <= 0); }
      else { b('disc', '降りる', function () { act({ a: 'fold' }); }); b('play', 'コール ' + Math.min(q.face, V.med.me), function () { act({ a: 'call' }); }); if (!q.raised && V.med.me > q.face) b('go', 'レイズ +' + amt, function () { act({ a: 'raise' }); }); }
      return;
    }
    b('ghost', V.phase === 'cpu' ? V.opp.name + 'の番…' : '…', function () { }, true);
  }
  function doDiscard() {
    if (!G_.mark.length || G_.mark.length > 3) return;
    G_.mark.forEach(function (c) { c.by = 'me'; }); K.Core.discard(G_.mark.slice()); G_.mark = []; G_.mode = 'refill'; SFX.tap(); renderAll();
  }
  function afterRefill() { if (ME.refill <= 0) { G_.mode = 'play'; act('done'); } renderAll(); }

  function riPct(t) { return (4 - t) * 10; }
  function parts(ev) { return ev && ev.state === 'ok' ? K.yaku(ev.f).parts.filter(function (p) { return /^(SV|O|O2|C|place|time|manner)$/.test(p[0]); }).length : 0; }
  function canRiichi() { return !V.ri.me && cur && cur.state === 'ok' && parts(cur) >= 3 && V.med.me >= 5; }
  function riichiPay(who) { var a = Math.min(5, V.med[who]); V.med[who] -= a; V.pot += a; }
  function pay(who, amt) { var a = Math.max(0, Math.min(amt, V.med[who])); V.med[who] -= a; V.pot += a; V.c[who] += a; return a; }
  async function nextHand() {
    V.n++;
    if (V.n > HANDS || V.med.me < ANTE || V.med.cpu < ANTE) { endMatch(); return; }
    V.first = V.first === 'me' ? 'cpu' : 'me';
    V.all.forEach(function (c) { c.by = null; if (c.w.k === 'v') c.w.f = 'base'; if (c.w.k === 'n') c.w.pl = false; });
    ME.hand = []; ME.row = []; ME.field = []; ME.disc = []; ME.draw = shuffle(V.all.slice()); ME.pts = 0; ME.refill = 0;
    CPU.hand = []; CPU.row = []; CPU.pts = 0; CPU.refill = 0; V.cpuBest = null; V.cpuLocked = null; ME.hintLv = 0; G_.hintBest = null; G_.hintIds = {}; V.ri = { me: 0, cpu: 0 }; V.bluffed = false; G_.busy = false;
    V.quest = K.pickQuest(V.usedQ = V.usedQ || []); QCTX = V.quest; V.mission = K.pickMissions(V.usedM = V.usedM || [], 1)[0].m;
    V.rule = pick(K.JOKERS.filter(function (j) { return !/^(bank|lucky|first|last)$/.test(j.id); }));
    V.pot = 0; V.c = { me: 0, cpu: 0 }; pay('me', ANTE); pay('cpu', ANTE);
    withP(CPU, function () { K.fillTo(8); }); K.fillTo(8);
    var g = K.guestCard(); if (g) { g.by = 'guest'; ME.field.unshift(g); }
    G_.mode = 'play'; G_.mark = []; say(pick(['よろしく!', 'いくよ〜', 'ふふふ…', 'さあ勝負!']));
    renderAll(); SFX.put();
    var order = V.first === 'me' ? ['me', 'cpu'] : ['cpu', 'me'];
    for (var t = 1; t <= 3; t++) {
      for (var k = 0; k < 2; k++) {
        if (V.quit) return;
        V.turnTxt = '交換 <b>' + t + '/3</b> ・ ' + (order[k] === 'me' ? '<span class="you">あなたの番</span>:1〜3枚 捨てて交換 か、そのまま' : V.opp.name + 'の番');
        V.t = t;
        if (order[k] === 'me') {
          if (V.ri.me) { V.turnTxt = '交換 <b>' + t + '/3</b> ・ あなたはリーチ中(交換なし)'; renderAll(); await wait(500); continue; }
          var a = await ask('turn');
          if (a === 'riichi') { V.ri.me = t; riichiPay('me'); G_.busy = true; SFX.joker(); K.flash('🀄 リーチ! この文で勝負(点+' + riPct(t) + '%)'); say(pick(['む…リーチか', 'ほう…', 'こわいね'])); renderAll(); await wait(600); }
        } else await cpuTurn(t);
      }
      if (t === 1 || t === 3) { var r = await betting(t, order); if (V.quit) return; if (r) { await foldEnd(r); return; } }
    }
    await showdown();
  }
  // ---- CPU の手番 ----
  function best() {
    if (V.cpuLocked) return V.cpuLocked;
    var r = search(CPU.hand, V.rule, V.opp.lv), miss = [.3, .2, .1][V.opp.lv];
    if (r && r.alts && r.alts.length && rnd() < miss) r = r.alts[Math.floor(rnd() * r.alts.length)]; // 読みちがえ
    return r;
  }
  async function cpuTurn(t) {
    V.phase = 'cpu'; renderAll(); say('考え中…', 'think'); await wait(650);
    if (V.ri.cpu) { say('リーチ中…'); await wait(700); return; }
    var bst = best(), used = bst ? ids(bst.row) : {}, unused = CPU.hand.filter(function (c) { return !used[c.id]; });
    if (t <= 2 && bst && parts(bst.ev) >= 3 && V.med.cpu >= 5 && ((quant(bst.score) >= .7 && rnd() < .35) || (V.opp.style === 'bluff' && rnd() < .15))) {
      V.ri.cpu = t; riichiPay('cpu'); V.cpuBest = V.cpuLocked = bst; say('リーチ!!', 'hot'); SFX.joker(); renderAll(); await wait(1000); return;
    }
    unused.sort(function (a, b) { return (a.chips - b.chips) + (rnd() - .5) * 8; });
    var dc = unused.slice(0, 3);
    if (V.opp.style === 'bluff' && rnd() < .3 && bst) { var u2 = CPU.hand.filter(function (c) { return used[c.id]; }).sort(function (a, b) { return b.chips - a.chips; })[0]; if (u2 && dc.indexOf(u2) < 0) { dc = dc.slice(0, 2).concat([u2]); V.bluffed = true; } }
    if (!dc.length || (t === 3 && bst && quant(bst.score) >= .9 && rnd() < .7)) { say('交換しない'); V.cpuBest = bst; await wait(800); return; }
    dc.forEach(function (c) { c.by = 'cpu'; });
    withP(CPU, function () { K.Core.discard(dc); }); say(dc.length + '枚 捨てた'); SFX.tap(); renderAll(); await wait(800);
    var took = [], drew = 0, base = bst ? bst.score : 0;
    while (CPU.refill > 0) {
      var cands = ME.field.filter(function (c) { return (c.by === 'me' || c.by === 'guest') && c.chips + (c.bonus || 0) <= CPU.pts; }).sort(function (a, b) { return b.chips - a.chips; }).slice(0, V.opp.style === 'collector' ? 3 : 1), pickC = null, gain = 0;
      cands.forEach(function (c) { var r = search(CPU.hand.concat([c]), V.rule, V.opp.lv, 160), g = (r ? r.score : 0) - base; if (g > gain) { gain = g; pickC = c; } });
      if (!pickC && V.opp.style === 'collector' && cands.length && rnd() < .5) pickC = cands[0]; // じゃま
      if (pickC && gain >= 0) { withP(CPU, function () { K.Core.take(pickC); }); took.push(K.cardText(pickC)); base = Math.max(base, base + gain); }
      else { withP(CPU, function () { K.Core.drawOne(); }); drew++; }
    }
    say((took.length ? '場から「' + took.join('」「') + '」を取った' : '') + (took.length && drew ? '、' : '') + (drew ? '山から' + drew + '枚 引いた' : ''));
    V.cpuBest = best(); renderAll(); await wait(900);
  }
  function quant(s) { var q = QS[V.opp.lv]; return s < q[0] * .8 ? .1 : s < q[0] ? .25 : s < q[1] ? .45 : s < q[2] ? .7 : s < q[2] * 1.3 ? .85 : .95; }
  function cpuBet(face, raised, t) {
    var sc = V.cpuBest ? V.cpuBest.score : 0, q = quant(sc), st = V.opp.style, early = t === 1 ? .1 : 0, r = rnd();
    if (V.bluffed) q = Math.max(q, .6);
    if (!face) {
      var th = st === 'careful' ? .65 : st === 'bluff' ? .45 : .55, bl = st === 'bluff' ? .35 : st === 'careful' ? .03 : .1;
      return q >= th || r < bl ? 'bet' : 'check';
    }
    var fold = (st === 'careful' ? .4 : st === 'bluff' ? .2 : .3) - early, rz = st === 'bluff' ? .75 : st === 'careful' ? .9 : .85;
    if (V.med.me === 0) rz = 2;
    if (q < fold && !(st === 'bluff' && r < .4)) return 'fold';
    if (!raised && (q >= rz || (st === 'bluff' && r < .15)) && V.med.cpu > face) return 'raise';
    return 'call';
  }
  // ---- 賭け:先手から。チェック/ベット → コール/レイズ/降りる(レイズは1回まで) ----
  async function betting(t, order) {
    var amt = BETS[t], c0 = { me: V.c.me, cpu: V.c.cpu }, raised = false, acted = {}, i = 0, guard = 0;
    while (guard++ < 8) {
      var who = order[i % 2], oth = order[(i + 1) % 2], face = (V.c[oth] - c0[oth]) - (V.c[who] - c0[who]);
      if (face > 0 && V.med[who] === 0) face = 0;
      if (who !== 'me' && V.med.me === 0 && face === 0) { acted[who] = 1; }
      else {
        var a;
        if (who === 'me') { V.betQ = { face: face, raised: raised }; V.turnTxt = '<span class="you">賭け</span>:' + (face ? V.opp.name + 'が ' + face + ' 賭けた。受ける?' : 'ベットする?(1回目は' + BETS[1] + '・最後は' + BETS[3] + ')'); a = (await ask('bet')).a; if (V.quit) return null; }
        else { V.phase = 'cpu'; V.turnTxt = V.opp.name + 'が考えている…'; renderAll(); await wait(700); a = cpuBet(face, raised, t); }
        if (a === 'fold') { say(who === 'cpu' ? '降りる…' : 'やった!', who === 'cpu' ? 'sad' : 'happy'); return who === 'me' ? 'cpu' : 'me'; }
        if (a === 'check') { if (who === 'cpu') say('チェック'); acted[who] = 1; }
        if (a === 'call') { pay(who, face); if (who === 'cpu') say('コール'); SFX.coin(); acted[who] = 1; }
        if (a === 'bet' || a === 'raise') { pay(who, face + amt); if (a === 'raise') raised = true; acted = {}; acted[who] = 1; if (who === 'cpu') say(a === 'bet' ? 'ベット ' + amt + '!' : 'レイズ!! +' + amt, 'hot'); SFX.coin(); }
        renderAll();
      }
      var me2 = V.c.me - c0.me, cp2 = V.c.cpu - c0.cpu;
      if (acted.me && acted.cpu && (me2 === cp2 || V.med.me === 0 || V.med.cpu === 0)) return null;
      i++;
    }
    return null;
  }
  function settle(winner) {
    var p = V.pot;
    if (winner === 'draw') { V.med.me += Math.floor(p / 2); V.med.cpu += p - Math.floor(p / 2); }
    else V.med[winner] += p;
    V.pot = 0; if (winner === 'me') V.stats.win++; else if (winner === 'cpu') V.stats.lose++;
    return p;
  }
  async function foldEnd(winner) {
    var p = settle(winner); G_.busy = false; renderAll(); if (winner === 'me') SFX.win(); else SFX.lose();
    var o = el('div', 'modal', '<div class="box sd"><h2>' + (winner === 'me' ? V.opp.name + 'が降りた!' : '降りた') + '</h2><p class="res' + (winner === 'me' ? ' w' : ' l') + '">' + (winner === 'me' ? '🪙 +' + p : '🪙 ' + p + ' は ' + V.opp.name + 'へ') + '</p><button class="btn go" id="nx">つぎのハンドへ</button></div>');
    K.root().appendChild(o); $('#nx', o).onclick = function () { o.remove(); nextHand(); };
  }
  function miniRow(row, ev) { var w = el('div', 'srow'), sf = K.surfaceOf(row, ev); row.forEach(function (c, i) { var e = K.cardEl(c, 'field', 0, sf ? sf[i] : null); e.classList.add('mini'); w.appendChild(e); }); return w; }
  async function showdown() {
    V.phase = 'show'; V.turnTxt = '勝負!'; G_.busy = true; renderAll();
    var ev = K.evaluate(ME.row), my = ev.state === 'ok' ? scoreRow(ME.row, ev, V.rule) : null, cb = V.cpuBest = best(), cs = cb ? cb.sc : null, Q = V.quest.secret;
    var bon = function (f, who) { var o = []; if (V.ri[who]) o.push(['🀄 リーチ', riPct(V.ri[who])]); if (f && K.missionHit(V.mission, f)) o.push(['🎯 お題', 10]); if (f && K.questHit(Q, f)) o.push(['🔒 シークレット', K.Q_PCT[Q.tier]]); return o; };
    var mb = my ? bon(ev.f, 'me') : [], cbn = cs ? bon(cb.ev.f, 'cpu') : [], pc = function (l) { return Math.min(50, l.reduce(function (a, x) { return a + x[1]; }, 0)); };
    var mt = my ? Math.floor(myMul(my.total) * (1 + pc(mb) / 100)) : 0, ct = cs ? Math.floor(cs.total * (1 + pc(cbn) / 100)) : 0, win = mt > ct ? 'me' : mt < ct ? 'cpu' : 'draw';
    var bl = function (l) { return l.length ? '<div class="bon">' + l.map(function (x) { return x[0] + ' +' + x[1] + '%'; }).join(' ・ ') + (pc(l) < l.reduce(function (a, x) { return a + x[1]; }, 0) ? '(上限 +50%)' : '') + '</div>' : ''; };
    if (my && ev.f.colloc === 'good' && K.addCombo(ev.f.pair)) K.flash('📖 名コンビ図鑑に登録!「' + ev.f.pair + '」');
    var o = el('div', 'modal', '<div class="box sd"><h2>勝負!</h2>' +
      '<div class="side me"><div class="who">あなた' + (my ? '<button class="spk" id="spm">🔊</button>' : '') + '</div><div class="tx">' + (my ? ev.text : '(文になっていない → 0点)') + '</div>' + (my ? '<div class="yk2">' + my.y.name + '</div>' : '') + '<div class="cm2"><b class="chips">' + (my ? my.chips : 0) + '</b>×<b class="mult">' + (my ? my.mult : 0) + '</b>= <b class="tot" id="mt">0</b></div>' + bl(mb) + (mulNote() ? '<div class="bon">' + mulNote().replace('<br>', '') + '</div>' : '') + '</div>' +
      '<div class="side cp"><div class="who">' + V.opp.face + ' ' + V.opp.name + (cb ? '<button class="spk" id="spc">🔊 聞く</button>' : '') + '</div><div id="crow"></div><div class="tx">' + (cb ? cb.ev.text : '(文が作れなかった)') + '</div>' + (cs ? '<div class="yk2">' + cs.y.name + '</div>' : '') + '<div class="cm2"><b class="chips">' + (cs ? cs.chips : 0) + '</b>×<b class="mult">' + (cs ? cs.mult : 0) + '</b>= <b class="tot" id="ct">0</b></div>' + bl(cbn) + '</div>' +
      '<div class="qrev2">🔒 シークレットは「<b>' + Q.label + '</b>」(' + K.TIER_JA[Q.tier] + ' +' + K.Q_PCT[Q.tier] + '%)</div><p class="res" id="rs"></p><button class="btn go" id="nx" style="visibility:hidden">つぎのハンドへ</button></div>');
    K.root().appendChild(o); if (cb) $('#crow', o).appendChild(miniRow(cb.row, cb.ev));
    var rv = my ? K.reviewItems(ME.row, ev) : null; if (my) K.recordHist(V.hist = V.hist || [], ME.row, ev, mt);
    if (rv) { var rb = el('button', 'btn ghost small', '📖 この文の解説'); rb.onclick = function () { K.reviewFlow(rv); }; $('.side.me', o).appendChild(rb); }
    if ($('#spm', o)) $('#spm', o).onclick = function () { K.speak(ev.text); }; if ($('#spc', o)) $('#spc', o).onclick = function () { K.speak(cb.ev.text); };
    if (my) { K.speak(ev.text); } await wait(400); // 自分の文だけ自動で読む。相手の文は🔊で
    for (var i = 1; i <= 15; i++) { $('#mt', o).textContent = Math.round(mt * i / 15).toLocaleString(); $('#ct', o).textContent = Math.round(ct * i / 15).toLocaleString(); if (i % 3 === 0) SFX.chip(i); await wait(45); }
    await wait(my ? 1200 : 300);
    var p = settle(win);
    $('#rs', o).className = 'res ' + (win === 'me' ? 'w' : win === 'cpu' ? 'l' : '');
    $('#rs', o).textContent = win === 'me' ? '勝ち! 🪙 +' + p : win === 'cpu' ? '負け… 🪙 ' + p + ' は ' + V.opp.name + 'へ' : '引き分け(半分ずつ)';
    if (win === 'me') { SFX.win(); say(pick(['くっ…', 'やるね', 'まいった'])); } else if (win === 'cpu') { SFX.lose(); say(pick(['いただき!', 'ふふん', 'まだまだ'])); }
    if (rv) { await wait(900); await K.reviewAfter(rv); } // 直した所は勝負のあとすぐ(上級は見たい人だけ)
    $('#nx', o).style.visibility = 'visible'; G_.busy = false; renderAll();
    $('#nx', o).onclick = function () { o.remove(); nextHand(); };
  }
  function endMatch(quit) {
    var won = !quit && V.med.me > V.med.cpu, draw = !quit && V.med.me === V.med.cpu;
    var rec = K.store.get('vs') || {}, r = rec[V.opp.id] || { w: 0, l: 0 }; if (won) r.w++; else if (!draw) r.l++; rec[V.opp.id] = r; K.store.set('vs', rec);
    G_.vs = null; if (won) SFX.win(); else SFX.lose();
    var s = K.screen('<div class="end"><h1>' + (won ? '🏆 勝ち!' : draw ? '引き分け' : '負け…') + '</h1><div class="st">' + V.opp.face + ' ' + V.opp.name + ' との対戦</div>' +
      '<div class="tot">あなた 🪙' + V.med.me + ' ・ ' + V.opp.name + ' 🪙' + V.med.cpu + '</div><div class="st">ハンド ' + V.stats.win + '勝 ' + V.stats.lose + '敗 ・ 通算 ' + r.w + '勝 ' + r.l + '敗</div>' +
      ((V.hist || []).length ? '<button class="btn ghost" id="hs">📚 今回の文をふりかえる(' + V.hist.length + ')</button>' : '') + '<button class="btn go" id="re">もう一回</button><button class="btn vs" id="ot">相手をかえる</button><button class="btn ghost" id="tt">タイトルへ</button></div>');
    if ($('#hs', s)) { var hl = V.hist; $('#hs', s).onclick = function () { K.histModal(hl); }; }
    $('#re', s).onclick = function () { start(V.opp); }; $('#ot', s).onclick = function () { K.showTitle(); pickOpp(); }; $('#tt', s).onclick = function () { K.showTitle(); };
  }

  export var VS = { start: start, _search: search, _score: scoreRow, _V: function () { return V; }, _me: function () { return ME; }, _cpu: function () { return CPU; }, OPPS: OPPS };
