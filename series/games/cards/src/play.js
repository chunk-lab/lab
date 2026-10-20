import { $, CFG, DICT, G, LEVEL, LV_JA, LV_MULT, el, pick, rnd, setLevel, shuffle, store } from './base.js';
import { BOSSES, BOSS_AT, FORM_JA, JOKERS, KIND_JA, PART_JA, TARGETS, TSU, advise, baseChips, baseScore, card, cardText, colorOf, curTSU, cyclable, cycle, evaluate, isPlace, isTime, lvOf, mk, prevCore, starterDeck, storyOf, tsuCard, vtext, yaku } from './rules.js';
import { SFX, ac, speak, unlock } from './sound.js';
import { runCoach } from '../../../core/coach.js';
import { TUT } from './tutorial.js';
  export var VSref = null; export function registerVS(v) { VSref = v; }
  // ---------------- ゲームの状態 ----------------
  export var R = null;
  export function newRun() {
    R = { stage: 0, money: 4, deck: starterDeck(), jokers: [], lv: {}, best: { text: '', pts: 0 }, total: 0, played: 0, rerollCost: 2 };
    if (LEVEL === 2) for (var i = 0; i < 8; i++) { var g = guestCard(); if (g) { g.guest = false; g.chips = baseChips(g); R.deck.push(g); } }
    startStage();
  }
  export function startStage() {
    var bi = BOSS_AT[R.stage] ? pick(BOSSES.filter(function (b) { return !R.lastBoss || b.id !== R.lastBoss; })) : null; if (bi) R.lastBoss = bi.id;
    R.boss = bi; R.target = TARGETS[R.stage]; R.score = 0; R.hands = bi && bi.hands ? bi.hands : 4; R.handsMax = R.hands; R.discards = 3; R.first = true;
    R.deck.forEach(function (c) { if (c.w.k === 'v') c.w.f = 'base'; if (c.w.k === 'n') c.w.pl = false; });
    R.deck.forEach(function (c) { if (c.scout) { c.scout = false; c.chips = baseChips(c); } });
    R.draw = shuffle(R.deck.slice()); R.disc = []; R.hand = []; R.row = []; R.field = []; R.pts = 0; R.refill = 0; R.log = []; deal();
    R.yakuCnt = {}; R.prev = null; R.stageF = []; R.questDone = false; R.quest = pickQuest(R.usedQ = R.usedQ || []); R.missions = pickMissions(R.usedM = R.usedM || [], 3);
    var g = guestCard(); if (g) { var j = R.hand.findIndex(function (c) { return cat(c) === cat(g); }); if (j < 0) j = 0; R.draw.unshift(R.hand[j]); R.hand[j] = g; }
    showGame();
  }
  export function drawOne() { if (!R.draw.length) { R.draw = shuffle(R.disc); R.disc = []; } return R.draw.pop() || null; }
  export function verbFits(v, n) { var ot = v.w.e.ot || []; if (!ot.length || ot.indexOf('any') >= 0) return true; var tags = [n.w.e.cat].concat(n.w.e.tg || []); return ot.some(function (t) { return tags.indexOf(t) >= 0; }); }
  // 手札を配る:品詞がかたよらないように(主語2・動詞2〜3・名詞2・飾り1 くらい)。動詞の目的語になれる名詞もできるだけ入れる
  export function cat(c) { return c.kind === 'pron' || (c.kind === 'n' && /^(person|animal)$/.test(c.w.e.cat)) ? 'subj' : c.kind === 'v' ? 'verb' : c.kind === 'n' ? 'noun' : 'mod'; }
  export var WANT = { subj: [2, 3], verb: [2, 3], noun: [2, 3], mod: [1, 2] };
  export function deal() { fillTo(8); }
  export function fillTo(N) {
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
  export var FIELD_MAX = 8;
  export var Core = {
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
  export function notes(f, rep) {
    var o = [];
    if (f.colloc === 'good') o.push('<span class="gd">✨ 名コンビ(' + f.pair + ')</span>');
    if (f.storyP) o.push('<span class="gd">🔗 前の文を代名詞で受けた</span>'); else if (f.story) o.push('<span class="gd">🔗 前の文とつながった</span>');
    if ((f.dupWords || []).length) o.push('同じ種類の句の2つ目は 0点');
    if ((f.halfWords || []).length) o.push('2つ目の文は カード点が半分');
    if (rep) o.push('同じ役 ' + (rep + 1) + '回目 → 倍率 ' + (rep === 1 ? '½' : '¼'));
    return o.join('<br>');
  }
  export function applyStory(ev) { var st = storyOf(ev.nps, R && R.prev); ev.f.story = st === 'def'; ev.f.storyP = st === 'pron'; }
  export function scoreOf(ev, ctx) {
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
    if (LEVEL !== 1) { mult = Math.round(mult * LV_MULT[LEVEL] * 10) / 10; steps.push({ t: 'note', txt: LV_JA[LEVEL] + ' ×' + LV_MULT[LEVEL], chips: chips, mult: mult }); }
    var bossOk = !R.boss || R.boss.ok(f);
    return { y: y, steps: steps, chips: chips, mult: mult, total: bossOk ? Math.floor(chips * mult) : 0, bossFail: !bossOk, rep: rep };
  }

  // ---------------- 画面 ----------------
  export var root = null;
  export function mount(r) { root = r; var lv = store.get('level'); setLevel(lv == null ? 1 : lv); showTitle(); document.addEventListener('pointerdown', unlock, { once: false, passive: true }); return function () { document.removeEventListener('pointerdown', unlock); }; }
  export function screen(html) { root.innerHTML = ''; var s = el('div', 'scr', html); root.appendChild(s); return s; }
  export function showTitle() {
    var b = store.get('best') || {};
    var s = screen('<div class="title"><div class="logo"><span>CHUNK</span><span>CARDS</span></div><div class="sub">英文で「役」をつくる カードゲーム</div><div class="lvsel" id="lvsel"></div><div class="lvdesc" id="lvd"></div>' +
      '<div class="fan"><div class="card n big" style="--r:-12deg">The</div><div class="card v big" style="--r:-4deg">dog</div><div class="card v big" style="--r:4deg">ate</div><div class="card m big" style="--r:12deg">quickly</div></div>' +
      '<button class="btn go" id="go">ひとりで練習</button><button class="btn vs" id="vs">CPUと対戦</button><button class="btn ghost" id="how">あそびかた</button><button class="btn ghost small" id="tut">🎓 チュートリアル</button><button class="btn ghost small" id="cb">📖 名コンビ図鑑</button>' +
      (b.stage ? '<div class="rec">最高:ステージ ' + b.stage + ' ・ ' + (b.total || 0).toLocaleString() + '点' + (b.text ? '<br><i>' + b.text + '</i>' : '') + '</div>' : '') + '</div>');
    var LVD = ['a / the・前置詞・be・動詞の形を忘れても、自動で補って文にしてくれる。出したあとに1語ずつ解説(点 ×1)', 'a / the・前置詞・動詞の形も自分で選ぶ(点 ×1)', 'むずかしい語が山札に入り、候補の光もなし(点 ×1.3)'];
    function lvUI() { var box = $('#lvsel', s); box.innerHTML = ''; LV_JA.forEach(function (n, i) { var b = el('button', 'lvb' + (i === LEVEL ? ' on' : ''), n); b.onclick = function () { setLevel(i); store.set('level', i); SFX.tap(); lvUI(); }; box.appendChild(b); }); $('#lvd', s).textContent = LVD[LEVEL]; }
    lvUI();
    $('#go', s).onclick = function () { unlock(); SFX.put(); newRun(); };
    $('#how', s).onclick = function () { unlock(); showHow(); };
    $('#tut', s).onclick = function () { unlock(); SFX.put(); store.set('tut', 0); newRun(); };
    $('#cb', s).onclick = function () { var l = store.get('combos') || [], o = el('div', 'modal', '<div class="box"><h2>📖 名コンビ図鑑(' + l.length + ')</h2><p style="font-size:12px;opacity:.8;margin:0">動詞とぴったりの目的語の組み合わせ。文で使うと倍率+2</p><div class="combos">' + (l.length ? l.map(function (x) { return '<span>' + x + '</span>'; }).join('') : '<i>まだない</i>') + '</div><button class="btn go" id="ok">とじる</button></div>'); root.appendChild(o); $('#ok', o).onclick = function () { o.remove(); }; };
    $('#vs', s).onclick = function () { unlock(); SFX.put(); VSref && VSref.start(); };
  }
  export function showHow() {
    var o = el('div', 'modal', '<div class="box"><h2>あそびかた</h2><ol>' +
      '<li>手札のカードを<b>タップ</b>すると「文の台」に並ぶ。<b>つなぎの棚</b>(a / the / in / can など)は何回でも使える。</li>' +
      '<li>手札は<b>タップ</b>か<b>上へフリック</b>で台の最後へ。<b>ドラッグ</b>すると金の線の位置に1枚ずつ差し込める。台のカードは<b>ドラッグで並べかえ</b>、<b>下へフリック</b>か×で手札へ戻す。<b>タップで形が変わる</b>(eat → ate → eaten → eating、単数⇄複数)。be・have は「今 → 過去 → 否定 → 過去の否定」(is → was → isn’t → wasn’t)、do は do → did → don’t → didn’t、can は can → could → can’t → couldn’t(will・may も同じ。must・should は否定と切りかえ)、want to → wanted to。</li>' +
      '<li>正しい英文になると<b>役</b>(S+V+O+場所 など)と点が出る。「<b>出す!</b>」で点が入る。間違っていると理由が出て、出せない。</li>' +
      '<li>点 = <b>チップ × 倍率</b>。長い文・むずかしい形(過去・完了・進行・節…)ほど高い。</li>' +
      '<li>「出す」の回数のうちに<b>目標点</b>に届けばクリア。お店で<b>ジョーカー</b>(点が化ける効果)や<b>文型の本</b>を買って強くなろう。3・6・8ステージは<b>ボス</b>(条件つき)。</li>' +
      '<li>「<b>捨てる</b>」→ 手札から捨てるカードをえらぶ。捨てたカードは<b>場</b>に表向きで並び、その点数が<b>捨て札pt</b>になる。補充は1枚ずつ「山から引く(タダ)」か「場から取る(点数ぶんのpt)」をえらべる。強いカードをわざと捨てて、あとで拾い直すのもアリ。</li><li><b>レベル</b>(タイトルで選ぶ):初級は冠詞・前置詞(「つなぎ」カード)・時制がおまかせ。上級はむずかしい語が増え、点も高い。</li><li>台の文がうまくいかないときは、止まったカードが<b>赤く</b>光り、次に置けるカードに<b>金の点</b>が付く(初級・中級)。初級・中級は、台の下に「次に置くもの」(主語 → 動詞 → 目的語 → 場所 → 時)がいつも出る。答えは出ないので、並べるのは自分で。上級は💡ヒント(💰1)で、使えるカードが光るだけ。</li></ol><button class="btn go" id="ok">わかった</button></div>');
    root.appendChild(o); $('#ok', o).onclick = function () { o.remove(); };
  }

  export var G_ = {}; // ゲーム画面の要素
  export function showGame() {
    var s = screen(
      '<div class="top"><div class="stg' + (R.boss ? ' boss' : '') + '">' + (R.boss ? '👹 ボス ' : 'ステージ ') + (R.stage + 1) + '<small>/8</small></div>' +
      '<div class="goal"><div class="gl">目標 <b id="tgt">' + R.target.toLocaleString() + '</b></div><div class="bar"><i id="barf"></i></div><div class="gl">いま <b id="sc">0</b></div></div>' +
      '<div class="res"><span>出す<b id="hd"></b></span><span>捨てる<b id="ds"></b></span><span class="money">💰<b id="mn"></b></span></div></div>' +
      '<div class="jokers" id="jk"></div>' +
      (R.boss ? '<div class="bossbar">👹 ' + R.boss.text + '</div>' : '') + '<div class="qbar" id="qb"></div>' +
      '<div class="board"><div class="row" id="row"><div class="ph">手札をタップして ここに並べる</div></div>' +
      '<div class="pv"><div class="sent" id="sent"></div><div class="jt" id="jt"></div><div class="yk" id="yk"></div><div class="cm"><span class="chips" id="ch">0</span><span class="x">×</span><span class="mult" id="ml">0</span></div><div class="msg" id="msg"></div><div class="hp" id="hp"></div></div><button class="hintb" id="hb">💡 ヒント</button></div>' +
      '<div class="field"><div class="flbl"><span>場(捨てたカード)</span><span class="pts">捨て札pt <b id="pt">0</b></span></div><div class="frow" id="fd"></div><div class="fhint" id="fh"></div></div>' +
      '<div class="tsu"><div class="tabs" id="tabs"></div><div class="tw" id="tw"></div></div>' +
      '<div class="hand" id="hand"></div>' +
      '<div class="btns" id="bt"></div>');
    ['jk', 'row', 'sent', 'yk', 'ch', 'ml', 'msg', 'tabs', 'tw', 'hand', 'bt', 'hd', 'ds', 'mn', 'sc', 'barf', 'fd', 'fh', 'pt', 'qb', 'jt', 'hp', 'hb'].forEach(function (k) { G_[k] = $('#' + k, s); });
    G_.hb.onclick = doHint;
    G_.tab = G_.tab == null ? 0 : G_.tab;
    G_.vs = null; G_.mode = 'play'; G_.mark = []; renderAll();
    if (R.stage === 0 && !store.get('tut')) setTimeout(function () { if (G_.row && G_.row.isConnected) runCoach(TUT, { onDone: function () { store.set('tut', 1); } }); }, 500);
  }
  // 台の上の見た目:文の中での実際の形(is / plays / him / an …)にそろえる
  export var BE = /^(am|is|are|was|were|be|been|being)$/, HV = /^(have|has|had|having)$/;
  export function first(w) { return String(w).toLowerCase().split(' ')[0]; }
  export function plaus(c, tok) {
    var k = c.w.k;
    if (k === 'prep' && c.label) return /^(in|on|at)$/.test(tok);
    if (k === 'be') return BE.test(tok);
    if (k === 'modal') return tok === c.w.v;
    if (k === 'do') return /^(do|does|did)$/.test(tok); if (k === 'hv') return HV.test(tok); if (k === 'det') return /^(a|an|the|this|that|these|those)$/.test(tok);
    if (k === 'pr' && !c.label && G.PRON[c.w.v]) { var P = G.PRON[c.w.v]; return tok === first(P.sub) || tok === first(P.obj); }
    if (k === 'sm') return /^be/.test(c.w.v) ? BE.test(tok) : /^have/.test(c.w.v) ? HV.test(tok) : tok.indexOf(first(c.w.v).slice(0, 3)) === 0;
    if (k === 'v') { var fs = ['base', 'past', 'pp', 'ing'].map(function (f) { return first(G.wordText({ k: 'v', e: c.w.e, f: f }, CFG)); }), b0 = fs[0]; return fs.indexOf(tok) >= 0 || tok === b0 + 's' || tok === b0 + 'es' || tok === b0.replace(/y$/, 'ies') || tok === 'has' && b0 === 'have'; }
    var b = first(cardText(c)); return tok === b || (b.length > 2 && tok.indexOf(b.slice(0, b.length - 1)) === 0) || (k === 'n' && first(G.wordText({ k: 'n', e: c.w.e, pl: true }, CFG)) === tok);
  }
  export function surfaceOf(row, ev) {
    if (!ev || ev.state !== 'ok') return null;
    var toks = [], orig = {}, p = 0, out = [], seq = [];
    ev.text.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean).forEach(function (w) { var m = /^(\w+)n't$/i.exec(w); if (m) { var b = { ca: 'can', wo: 'will', sha: 'shall' }[m[1].toLowerCase()] || m[1]; orig[toks.length] = w; toks.push(b, 'not'); } else toks.push(w); });
    for (var i = 0; i < row.length; i++) {
      var c = row[i], n = cardText(c).split(' ').length;
      var neg2 = c.w.neg && /^(be|hv|modal|do)$/.test(c.w.k);
      if (neg2) { if (!/^not$/i.test(toks[p + 1] || '') || (c.w.k === 'do' ? !/^(do|does|did)$/i.test(toks[p] || '') : !plaus(c, (toks[p] || '').toLowerCase()))) return null; n = 2; }
      else if (c.w.k === 'not' && /^(do|does|did)$/i.test(toks[p] || '') && /^not$/i.test(toks[p + 1] || '')) n = 2;
      else if (c.w.k === 'not') { if (!/^not$/i.test(toks[p] || '')) return null; }
      else if (!plaus(c, (toks[p] || '').toLowerCase())) {
        var sk = 0; // 初級:おまかせで足された語(冠詞・前置詞・be など)は飛ばして、あとで解説する
        while (LEVEL === 0 && sk < 3 && toks[p] && !plaus(c, toks[p].toLowerCase())) { seq.push({ t: toks[p], auto: true }); p++; sk++; }
        if (!plaus(c, (toks[p] || '').toLowerCase())) return null;
      }
      var t = orig[p] && n === 2 && (c.w.k === 'not' || neg2) ? orig[p] : toks.slice(p, p + n).join(' '); p += n;
      if (i === 0 && t !== 'I' && !/^[A-Z]/.test(cardText(c))) t = t.charAt(0).toLowerCase() + t.slice(1);
      out.push(t); seq.push({ t: t, card: i });
    }
    while (LEVEL === 0 && p < toks.length) { seq.push({ t: toks[p], auto: true }); p++; }
    if (p !== toks.length) return null;
    out.seq = seq; return out;
  }
  // 文になっていないときの目安:主語に合わせて be / have、動詞・前置詞のうしろの代名詞は目的語の形
  export function guessForm(c, prev) {
    var k = c.w.k;
    if (k === 'pr' && !c.label && prev && (prev.w.k === 'v' || prev.w.k === 'prep') && G.PRON[c.w.v]) return G.PRON[c.w.v].obj;
    if ((k === 'be' || k === 'hv') && prev && (prev.w.k === 'pr' || prev.w.k === 'n')) {
      var v = prev.w.k === 'pr' ? prev.w.v : prev.w.pl ? 'they' : 'he', past = c.w.v === 'past';
      if (k === 'be') return past ? (v === 'i' || v === 'he' || v === 'she' || v === 'it' ? 'was' : 'were') : v === 'i' ? 'am' : /^(he|she|it)$/.test(v) ? 'is' : 'are';
      return past ? 'had' : /^(he|she|it)$/.test(v) ? 'has' : 'have';
    }
    return null;
  }
  export function rowText(row) { return row.map(function (c, i) { return guessForm(c, row[i - 1]) || cardText(c); }).join(' '); }
  export function formTag(c, tok, row, i) {
    if (!tok || c.w.k !== 'v') return null; var t = first(tok), e = c.w.e, b = first(vtext(e, 'base')), pa = first(vtext(e, 'past')), pp = first(vtext(e, 'pp')), ing = first(vtext(e, 'ing')), pv = prevCore(row.map(function (x) { return x.w; }), i);
    if (t === ing) return '-ing形'; if (t === pp && pv && (pv.k === 'be' || pv.k === 'hv')) return '過去分詞'; if (t === pa) return '過去形'; if (t === pp) return '過去分詞';
    if (t === b) return pv && (pv.k === 'modal' || pv.k === 'sm' || pv.k === 'not') ? '原形' : '現在形'; if (t === b + 's' || t === b + 'es' || t === b.replace(/y$/, 'ies') || t === 'has') return '現在(三単現)'; return null;
  }
  export function cardEl(c, where, i, disp, ftag) {
    var e = el('div', 'card ' + colorOf(c) + (c.tsu ? ' tsu' : '') + (lvOf(c) >= 2 && !c.tsu ? ' rare' : '') + (c.guest ? ' guest' : '') + (c.w.k === 'pr' && c.w.v === 'it' && !c.tsu ? ' wild' : ''));
    var t = disp || cardText(c); e.dataset.pos = { pron: 'pron.', n: 'n.', v: 'v.', adj: 'adj.', adv: 'adv.' }[c.kind] || '';
 e.innerHTML = '<span class="w"' + (t.length > 5 ? ' style="font-size:' + Math.max(8.5, (where === 'hand' ? 14.5 : where === 'field' ? 10.5 : 13.5) - (t.length - 5) * (where === 'field' ? .8 : 1.05)) + 'px"' : '') + '>' + t + '</span><i>' + (c.chips + c.bonus) + '</i>' + (c.bonus ? '<u>+' + c.bonus + '</u>' : '') +
      (c.w.k === 'v' && where === 'row' ? '<em>' + (ftag || FORM_JA[c.w.f || 'base']) + '</em>' : '') + (where === 'row' ? '<b class="rm">×</b>' : '');
    e.dataset.i = i; return e;
  }
  export function renderAll() { if (G_.vs) return G_.vs.renderAll(); renderTop(); renderJokers(); renderRow(); renderTsu(); renderHand(); renderField(); renderBtns(); }
  export function renderTop() { G_.hd.textContent = R.hands; G_.ds.textContent = R.discards; G_.mn.textContent = R.money; G_.sc.textContent = R.score.toLocaleString(); if (G_.pt) G_.pt.textContent = R.pts; G_.barf.style.width = Math.min(100, R.score / R.target * 100) + '%'; if (G_.qb && R.quest) G_.qb.innerHTML = missionBar(R.missions) + questBar(R.quest, R.stageF); }
  export function missionBar(ms) { return '<div class="mbar">🎯 お題:' + ms.map(function (x) { return '<span class="mc t' + x.m.tier + (x.done ? ' hit' : '') + '">' + (x.done ? '✔ ' : '') + x.m.label + ' <b>💰' + (x.m.tier + 1) + '</b></span>'; }).join('') + '</div>'; }
  export function renderJokers() {
    G_.jk.innerHTML = '';
    for (var i = 0; i < 5; i++) { var j = R.jokers[i]; var e = el('div', 'joker' + (j ? '' : ' empty'), j ? '<b>' + j.name + '</b><span>' + j.desc + '</span>' : '<span>空き</span>'); e.dataset.i = i; G_.jk.appendChild(e); }
  }
  export function renderHand() {
    G_.hand.innerHTML = '';
    R.hand.forEach(function (c, i) {
      var e = cardEl(c, 'hand', i); if (G_.mode === 'disc' && G_.mark.indexOf(c) >= 0) e.classList.add('marked');
      if (G_.nxH && G_.nxH[c.id]) e.classList.add('nx'); if (G_.hintIds && G_.hintIds[c.id]) e.classList.add('hintc');
      e.onpointerdown = function (ev) { cardPress(ev, c, e, 'hand'); };
      G_.hand.appendChild(e);
    });
  }
  export function renderTsu() {
    var TS = curTSU(); if (G_.tab >= TS.length) G_.tab = 0;
    G_.tabs.innerHTML = ''; TS.forEach(function (t, i) { var b = el('button', 'tab' + (i === G_.tab ? ' on' : ''), t[0]); b.onclick = function () { G_.tab = i; SFX.tap(); renderTsu(); }; G_.tabs.appendChild(b); });
    G_.tw.innerHTML = ''; TS[G_.tab][1].forEach(function (spec) { var c = tsuCard(spec), e = cardEl(c, 'tsu', 0); if (G_.nxT && G_.nxT[spec.join('|')]) e.classList.add('nx'); e.dataset.spec = spec.join('|'); e.onpointerdown = function (ev) { cardPress(ev, c, e, 'tsu', spec); }; G_.tw.appendChild(e); });
  }
  // 文の台:タップ=形を変える/×=戻す/ドラッグ=並べかえ
  export function renderRow() {
    G_.row.innerHTML = '';
    if (!R.row.length) G_.row.appendChild(el('div', 'ph', '手札をタップして ここに並べる'));
    var ev0 = evaluate(R.row), sf = surfaceOf(R.row, ev0), errI = ev0.state === 'bad' && ev0.atCard ? R.row.indexOf(ev0.atCard) : -1;
    calcNext();
    R.row.forEach(function (c, i) {
      var e = cardEl(c, 'row', i, sf ? sf[i] : guessForm(c, R.row[i - 1]), sf ? formTag(c, sf[i], R.row, i) : null); G_.row.appendChild(e);
      if (i === errI) e.classList.add('errc'); if (G_.hintIds && G_.hintIds[c.id] && !c.tsu) e.classList.add('hintc');
      $('.rm', e).onpointerdown = function (ev) { ev.stopPropagation(); };
      $('.rm', e).onclick = function (ev) { ev.stopPropagation(); if (G_.busy) return; SFX.tap(); R.row.splice(R.row.indexOf(c), 1); if (!c.tsu) R.hand.push(c); renderRow(); renderHand(); };
      e.onpointerdown = function (ev) { cardPress(ev, c, e, 'row'); };
    });
    updatePreview(); if (G_.bt) renderBtns();
    applyNext(); armIdle();
  }
  // 次に置けるカード(初級・中級):今の並びに足しても「まちがい」にならないもの
  export function calcNext() {
    G_.nxH = {}; G_.nxT = {};
    if (LEVEL >= 2 || !R.row.length || G_.mode !== 'play' || G_.busy) return;
    var cur0 = evaluate(R.row, true); if (cur0.state === 'ok') return;
    R.hand.forEach(function (c) { if (evaluate(R.row.concat([c]), true).state !== 'bad') G_.nxH[c.id] = 1; });
    var TS = curTSU(); (TS[G_.tab] || TS[0])[1].forEach(function (spec) { if (evaluate(R.row.concat([tsuCard(spec)]), true).state !== 'bad') G_.nxT[spec.join('|')] = 1; });
  }
  export function applyNext() {
    if (G_.hand) Array.prototype.forEach.call(G_.hand.children, function (e) { var c = R.hand[+e.dataset.i]; e.classList.toggle('nx', !!(c && G_.nxH && G_.nxH[c.id])); e.classList.toggle('hintc', !!(c && G_.hintIds && G_.hintIds[c.id])); });
    if (G_.tw) Array.prototype.forEach.call(G_.tw.children, function (e) { e.classList.toggle('nx', !!(G_.nxT && G_.nxT[e.dataset.spec])); });
  }
  // ---- 💡 ヒント(3段階)。使うほど次の文の点が下がる ----
  export var HINT_MULT = [1, 1, 1, 1], HINT_COST = [0, 1, 0, 0]; // 上級のヒント:練習は💰1、対戦は捨て札pt5
  export function hintCostTxt(n) { return G_.vs ? '捨て札pt ' + HINT_COST[n] * 5 : '💰' + HINT_COST[n]; }
  export function payHint(n) { var c = HINT_COST[n]; if (!c) return true; if (G_.vs) { if (R.pts < c * 5) return false; R.pts -= c * 5; return true; } if (R.money < c) return false; R.money -= c; return true; }
  export function roleOf(row, i) {
    var c = row[i], k = c.w.k, seenV = row.slice(0, i).some(function (x) { return x.w.k === 'v' || x.w.k === 'be'; });
    if (k === 'pr' && !c.tsu || k === 'n') { var prv = row.slice(0, i).filter(function (x) { return x.w.k !== 'det' && x.w.k !== 'adj'; }).pop(); if (prv && prv.w.k === 'prep') return k === 'n' && c.w.e.cat === 'time' ? '時' : '場所など'; return seenV ? '目的語' : '主語'; }
    if (k === 'modal' || k === 'sm') return '助動詞'; if (k === 'be') return 'be'; if (k === 'hv') return 'have'; if (k === 'not') return '否定';
    if (k === 'adj') return '形容詞:名詞の前に置く'; if (k === 'det') return '冠詞';
    if (k === 'v') return '動詞'; if (k === 'adv') return c.w.e.k === 'time' ? '時' : c.w.e.k === 'place' ? '場所' : '様子';
    return null;
  }
  export function diagnose(cards) {
    var subj = cards.some(function (c) { return c.kind === 'pron' || (c.kind === 'n' && /^(person|animal)$/.test(c.w.e.cat)); }), verb = cards.some(function (c) { return c.kind === 'v'; });
    return !subj ? '主語になれるカード(I / he / 人・動物の名詞)がない。捨てて交換しよう' : !verb ? '動詞のカードがない。捨てて交換しよう' : 'この手札だと文が作りにくい。捨てて交換しよう';
  }
  // ---- ヒント:答えは見せない。初級・中級は「次に何を置くか」をいつも出す。上級はボタンで使えるカードを光らせるだけ(💰1) ----
  export function doHint() {
    if (G_.busy || G_.mode !== 'play') { flash('いまはヒントを使えない'); return; }
    if (LEVEL < 2) { flash('次に置けるカードには金の点が付いている'); return; }
    var cards = R.hand.concat(R.row.filter(function (c) { return !c.tsu; }));
    var best = VSref && VSref._search ? VSref._search(cards, null, 1, 220) : null;
    if (!best) { G_.hp.innerHTML = '<div class="hrow">💡 ' + diagnose(cards) + '</div>'; SFX.bad(); return; }
    if (R.hintLv) return;
    if (!payHint(1)) { flash('ヒントには ' + hintCostTxt(1) + ' が必要'); SFX.bad(); return; }
    R.hintLv = 1; G_.hintBest = best; SFX.joker(); if (!G_.vs && G_.mn) renderTop(); renderRow(); renderHand();
  }
  export function stepGuide(row, ev) {
    var k = function (c) { return c.w.k; }, cs = row.map(k), iV = cs.findIndex(function (x) { return x === 'v' || x === 'be'; });
    var subj = row.slice(0, iV < 0 ? row.length : iV).some(function (c) { return c.w.k === 'pr' && !c.tsu || c.w.k === 'n'; });
    var after = iV < 0 ? [] : row.slice(iV + 1), obj = after.some(function (c) { return (c.w.k === 'n' || c.w.k === 'pr' || c.w.k === 'adj') && !(c.tsu && c.w.k !== 'pr'); });
    var vC = row.filter(function (c) { return c.w.k === 'v'; })[0], noObj = vC && ((c0 = prevCore(row.map(function (z) { return z.w; }), row.indexOf(vC))) && c0.k === 'be' && /pp|past/.test(vC.w.f) || vC.w.e.fr === 'intr'); var c0;
    if (noObj && ev.state === 'ok') obj = true; // 受け身や自動詞は目的語なしでOK
    var place = row.some(function (c, i) { return c.w.k === 'prep' || (c.w.k === 'adv' && c.w.e.k === 'place') || (LEVEL === 0 && iV >= 0 && i > iV && c.w.k === 'n' && c.w.e.cat === 'place'); }), time = row.some(function (c) { return (c.w.k === 'adv' && c.w.e.k === 'time') || (c.w.k === 'n' && c.w.e.cat === 'time'); });
    var steps = [['主語', subj], ['動詞', iV >= 0], ['目的語・補語', obj], ['場所', place], ['時', time]], nextI = steps.findIndex(function (x) { return !x[1]; });
    var line = steps.map(function (x, i) { return x[1] ? '<span class="sd1">✔ ' + x[0] + '</span>' : i === nextI ? '<b class="sd2">' + x[0] + '</b>' : '<span class="sd0">' + x[0] + '</span>'; }).join(' → ');
    var tip = !row.length ? '主語から置こう(I / he / a・the + 人や動物の名詞)'
      : !subj ? '主語を作ろう(名詞まで置く)'
      : iV < 0 ? '次は動詞(v.)。can や be をはさんでもOK'
      : ev.state === 'ok' ? '文になった! のばすなら 場所(前置詞 + 名詞)・時・様子を足そう'
      : ev.state === 'wait' ? 'もう少し:' + (ev.msg || '続きを置こう')
      : 'まちがいを直そう(赤いカード)';
    return '<div class="hrow">💡 ' + tip + '</div><div class="hrow guide">' + line + '</div>';
  }
  export function hintPanel() {
    if (!G_.hp) return; G_.hintIds = {};
    if (G_.mode !== 'play') { G_.hp.innerHTML = ''; return; }
    if (LEVEL < 2) { G_.hp.innerHTML = stepGuide(R.row, cur || { state: 'empty' }); if (G_.hb) G_.hb.style.display = 'none'; return; }
    if (G_.hb) { G_.hb.style.display = ''; G_.hb.textContent = R.hintLv ? '💡' : '💡 ヒント(' + hintCostTxt(1) + ')'; }
    var b = G_.hintBest;
    if (!R.hintLv || !b) { G_.hp.innerHTML = ''; return; }
    b.row.forEach(function (c) { if (!c.tsu) G_.hintIds[c.id] = 1; });
    G_.hp.innerHTML = '<div class="hrow">💡 光っているカードで文が作れる。並べ方は自分で考えよう</div>';
  }
  export function placeBest(b) {
    var orig = R.hand.concat(R.row.filter(function (c) { return !c.tsu; })), used = {};
    var nr = b.row.map(function (c) { if (c.tsu) return c; var o = orig.filter(function (x) { return x.id === c.id; })[0]; o.w.f = c.w.f; o.w.pl = c.w.pl; used[o.id] = 1; return o; });
    R.hand = orig.filter(function (c) { return !used[c.id]; }); R.row = nr; SFX.put(); renderRow(); renderHand();
  }
  // ---- 初級:出したあとの解説(チュートリアル式)。文をチャンク(意味のかたまり)に分けて、順番と1語ずつの理由を説明する ----
  export var ROLE = {
    subj: { n: '主語', m: 'だれが・何が', c: 'r1', d: '文の主人公。英語の文は、かならず主語から始まる。主語になれるのは「名詞のかたまり」(the dog など)か「代名詞」(she など)。' },
    verb: { n: '動詞', m: 'どうする', c: 'r2', d: '動きや状態を表すかたまり。英語では主語のすぐうしろに置く。動詞の形は「いつのことか(今・過去)」と「主語がだれか」で変わる。' },
    be: { n: '動詞(be動詞)', m: '〜である', c: 'r2', d: 'be動詞は「主語 = 〜」とイコールでつなぐ動詞。うしろに様子(形容詞)や名詞を置いて「主語がどんなものか」を言う。' },
    obj: { n: '目的語', m: '何を・だれを', c: 'r3', d: '動詞の動作を受ける相手。動詞のすぐうしろに置き、前置詞は付けない(× eat in an apple)。' },
    comp: { n: '補語', m: 'どんな・何', c: 'r3', d: 'be動詞のうしろで、主語の様子や正体を説明する言葉。He is happy. の happy は he の様子。' },
    place: { n: '場所', m: 'どこで・どこへ', c: 'r4', d: '場所は「前置詞 + 名詞」のかたまりで表すことが多い。目的語のうしろに置く。' },
    time: { n: '時', m: 'いつ', c: 'r5', d: '時は1語の副詞(yesterday など)か「前置詞 + 名詞」(on Monday など)で表す。文の最後に置くのが基本。' },
    manner: { n: '様子', m: 'どんなふうに', c: 'r4', d: '動詞をくわしくする副詞。ふつうは動詞(と目的語)のうしろに置く。' },
    other: { n: '修飾', m: '', c: 'r4', d: '' },
    front: { n: '前おき', m: '', c: 'r5', d: '文の前に置く「〜するとき」などのかたまり。前に置いたときは、うしろにカンマ(,)を付ける。' },
    conj: { n: '接続詞', m: 'つなぎ', c: 'r5', d: '接続詞は文と文をつなぐ言葉。when / if / because のうしろには「主語 + 動詞」の文が続く。' }
  };
  export function tokRole(t, cl) {
    if (!t) return 'other'; if (t === cl.subj) return 'subj'; if (t === cl.vp) return cl.vp.be && !cl.vp.verb ? 'be' : 'verb';
    if (cl.comps.indexOf(t) >= 0) return cl.vp.be && !cl.vp.verb ? 'comp' : t.t === 'AP' ? 'comp' : 'obj';
    if (isTime(t)) return 'time'; if (isPlace(t) || (t.t === 'PP' && t.cat === 'dir')) return 'place'; if (t.t === 'ADV') return 'manner'; return 'other';
  }
  export function chunksOf(row, ev) {
    var sf = surfaceOf(row, ev); if (!sf || !sf.seq || !ev.r) return null;
    var a = ev.r.alt, owners = [];
    function addCl(cl, tag) { if (!cl) return; [cl.subj, cl.vp].concat(cl.pre, cl.comps, cl.posts).forEach(function (t) { if (t) owners.push({ t: t, role: tokRole(t, cl), cl: tag }); }); }
    if (a.front) { if (a.front.cl) addCl(a.front.cl, 'front'); else if (a.front.tok) owners.push({ t: a.front.tok, role: isTime(a.front.tok) ? 'time' : 'front', cl: 'main' }); }
    a.cls.forEach(function (cl, i) { addCl(cl, i ? 'second' : 'main'); });
    function ownerOfCard(c) { for (var i = 0; i < owners.length; i++) if ((owners[i].t.words || []).indexOf(c.w) >= 0) return i; return -1; }
    var seq = sf.seq, own = seq.map(function (x) { return x.auto ? null : ownerOfCard(row[x.card]); });
    seq.forEach(function (x, k) { if (x.auto && /^(am|is|are|was|were|be|been|do|does|did)$/i.test(x.t)) { var vi = owners.findIndex(function (o) { return o.role === 'verb' || o.role === 'be'; }); own[k] = vi; } });
    for (var k = seq.length - 1; k >= 0; k--) if (own[k] == null || own[k] < 0) { var c = !seq[k].auto && row[seq[k].card]; if (c && /^(conj)$/.test(c.w.k)) { own[k] = 'conj' + k; continue; } own[k] = k + 1 < seq.length ? own[k + 1] : own[k - 1]; }
    for (var k2 = 0; k2 < seq.length; k2++) if (own[k2] == null || own[k2] < 0) own[k2] = k2 ? own[k2 - 1] : 0;
    // 動詞のかたまりに入った副詞(quickly など)は、別のチャンクとして見せる
    seq.forEach(function (x, k) { var c = !x.auto && row[x.card], ow = owners[own[k]]; if (c && c.w.k === 'adv' && ow && (ow.role === 'verb' || ow.role === 'be')) own[k] = 'adv' + k; });
    var chunks = [];
    seq.forEach(function (x, k) {
      var o = own[k], last = chunks[chunks.length - 1];
      if (last && last.o === o) { last.ks.push(k); return; }
      var isC = typeof o === 'string', ow = isC ? null : owners[o], ac = isC && /^adv/.test(o) ? row[x.card] : null;
      chunks.push({ o: o, ks: [k], role: ac ? (ac.w.e.k === 'time' ? 'time' : ac.w.e.k === 'place' ? 'place' : 'manner') : isC ? 'conj' : ow ? ow.role : 'other', tok: ow ? ow.t : null, cl: ow ? ow.cl : 'main', adv: ac });
    });
    chunks.forEach(function (ch) { ch.text = ch.ks.map(function (k) { return seq[k].t; }).join(' '); ch.ja = ch.adv ? (ch.adv.w.e.ja || '') : ch.tok ? jaChunk(ch, ev) : ''; });
    return { seq: seq, chunks: chunks, ev: ev, row: row };
  }
  export function jaChunk(ch, ev) {
    var g = ''; try { g = G.gloss(ch.tok) || ''; } catch (e) { }
    if (ch.role === 'subj') return g + 'は'; if (ch.role === 'obj') return g + 'を';
    if (ch.role === 'verb' || ch.role === 'be') { var vp = ch.tok; g = g.replace(/\(.*?\)/g, ''); if (vp.be && !vp.verb) g = ''; return g; }
    return g;
  }
  // 1語ずつの説明:品詞名つき。おまかせで補った語には印を付ける
  export function posOf(x, c) {
    if (x.auto) { var t = x.t.toLowerCase(); return /^(a|an|the)$/.test(t) ? '冠詞' : /^(am|is|are|was|were|be|been)$/.test(t) ? 'be動詞' : /^(do|does|did|will|would|shall|have|has|had)$/.test(t) ? '助動詞' : /^(to|in|on|at|for|with|from|by|of|into)$/.test(t) ? '前置詞' : 'つなぎの語'; }
    var k = c.w.k; if (k === 'pr') return c.label ? '所有格' : '代名詞';
    return { n: '名詞', v: '動詞', adj: '形容詞', adv: '副詞', det: c.w.v === 'this' || c.w.v === 'that' ? '指示語' : '冠詞', prep: '前置詞', modal: '助動詞', sm: '助動詞', do: '助動詞', be: 'be動詞', hv: '助動詞(have)', not: '否定', conj: '接続詞', rel: '関係代名詞', deg: '副詞' }[k] || '';
  }
  export function wordNotes(ch, R0) {
    var out = [], seq = R0.seq, row = R0.row;
    ch.ks.forEach(function (k) {
      var x = seq[k], t = x.t.toLowerCase(), c = x.auto ? null : row[x.card], pos = posOf(x, c), nk = null, txt = '';
      for (var j = k + 1; j < seq.length; j++) if (!seq[j].auto) { nk = row[seq[j].card]; if (nk && nk.w.k !== 'adj') break; }
      var nw = nk && nk.w.e ? nk.w.e.w : '', ncat = nk && nk.w.e ? nk.w.e.cat : '';
      if (pos === '冠詞') {
        if (t === 'a') txt = '名詞の前に付けて「1つの」を表す。数えられる名詞(' + (nw || 'book') + ' など)が1つで、まだ話に出ていないものに付ける。';
        else if (t === 'an') txt = 'a と同じ働き。ただし ' + (nw || 'apple') + ' のように母音(ア・イ・ウ・エ・オの音)で始まる語の前では an にする。';
        else txt = '名詞の前に付けて「その」を表す。聞き手にもどれのことか分かるもの、1つに決まるものに付ける' + (/^(place|time)$/.test(ncat) ? '(the park、the morning のように場所や時間帯にはよく付く)' : '') + '。';
        txt += ' 冠詞は「冠詞 →(形容詞)→ 名詞」の順で、名詞の前に置く。';
      } else if (pos === '指示語') txt = '「この(this)・あの(that)」。冠詞のかわりに名詞の前に置く。名詞が複数なら these / those に変わる。';
      else if (pos === '前置詞') {
        var m = { 'in': ncat === 'time' ? '朝・午後・月・年など「幅のある時間」に使う(in the morning)。' : '「〜の中で」。建物や町など広がりのある場所に使う(in the park)。', on: ncat === 'time' ? '曜日や日付に使う(on Monday)。' : '「〜の上に・接して」。', at: ncat === 'time' ? '時刻やお昼など「時間の1点」に使う(at noon)。' : '駅や家など「場所を1点」として考えるときに使う(at the station)。', to: '「〜へ」。go・come など移動の動詞のあとで行き先を表す。', 'with': '「〜と一緒に・〜を使って」。', 'for': '「〜のために」。', from: '「〜から」。', by: '「〜のそばで・〜によって」。' }[t] || '';
        txt = '前置詞は名詞の前に置いて、場所・時・方向などを表す言葉。「前置詞 + 名詞」でひとつのかたまりになる。' + m;
      } else if (pos === 'be動詞') txt = (/n't|not/.test(t) ? 'not が付いた否定の形(〜ではない)。be動詞は、うしろに not を付けるだけで否定になる。' : '') + '主語とうしろの言葉をイコールでつなぐ動詞。主語と時で形が変わる:I am / he・she・it is / you・we・they are(過去は was / were)。' + (t === 'been' ? 'have のうしろでは been になる(完了形)。' : '');
      else if (c && c.w.k === 'do' && !c.w.neg) txt = '強調の do:「本当に〜する」と気持ちを強める。主語が he / she なら does、過去なら did。うしろの動詞は原形(元の形)。';
      else if (c && c.w.k === 'do') txt = '「〜しない」の否定。ふつうの動詞(like・play など)を打ち消すときは、動詞の前に do not(don\'t)を置く。主語が he / she / 1つなら doesn\'t、過去なら didn\'t。うしろの動詞は原形(元の形)にする。';
      else if (pos === '助動詞' && /^(do|does|did)$/.test(t)) txt = 'not で打ち消すときに動詞の前に置く助動詞。主語が he / she なら does、過去なら did。うしろの動詞は原形(元の形)にする。';
      else if (pos === '助動詞(have)') txt = 'have + 過去分詞 で完了形(〜したところ・〜したことがある)。主語が he / she なら has、過去なら had。';
      else if (pos === '助動詞') txt = '動詞の前に置いて「できる(can)・するつもり(will)」などの意味を足す。うしろの動詞は原形(元の形)のまま。';
      else if (pos === '代名詞') { var P = G.PRON[c.w.v], base = cardText(c).toLowerCase(); txt = '名詞のかわりに使う言葉(' + P.ja + ')。' + (t === P.obj.toLowerCase() && t !== base ? '動詞や前置詞のうしろ(目的語)では形が変わる:' + base + ' → ' + t + '。I → me、he → him、she → her、we → us、they → them。' : '主語のときは I / you / he / she / it / we / they の形。'); }
      else if (pos === '所有格') txt = '「〜の」を表す(my = わたしの)。冠詞のかわりに名詞の前に置く。';
      else if (pos === '名詞') { var e = c.w.e; txt = 'ものや人の名前を表す言葉(' + (e.ja || '') + ')。' + (c.w.pl ? '2つ以上なので -s を付けた複数形。' : G.isCount(e) && !e.ind ? '数えられる名詞なので、1つなら a / the などが前に必要。' : '数えられない名詞なので a は付けない。'); }
      else if (pos === '動詞') {
        var e3 = c.w.e, b = first(vtext(e3, 'base')), w0 = first(t), pv = prevCore(row.map(function (z) { return z.w; }), x.card), pa = first(vtext(e3, 'past')), irr = pa !== b + 'ed' && pa !== b + 'd' && pa !== b.replace(/y$/, 'ied');
        txt = '動きを表す言葉(' + (e3.ja || '') + ')。';
        if (w0 === first(vtext(e3, 'ing'))) txt += 'be動詞 + 〜ing 形で進行形「〜しているところ」。';
        else if (pv && pv.k === 'hv' && w0 === first(vtext(e3, 'pp'))) txt += 'have + 過去分詞で完了形。' + b + ' の過去分詞は ' + w0 + '。';
        else if (pv && pv.k === 'be' && w0 === first(vtext(e3, 'pp'))) txt += 'be動詞 + 過去分詞で受け身「〜される」。';
        else if (w0 === pa && w0 !== b) txt += '過去のことなので過去形:' + b + ' → ' + w0 + '。' + (irr ? 'これは形が不規則に変わる動詞(不規則動詞)。' : 'ふつうの動詞は -ed を付ける。');
        else if (w0 !== b) txt += '主語が he / she / it や1人・1つで、今のこと(いつもすること)のときは -s を付ける(三人称単数現在):' + b + ' → ' + w0 + '。';
        else txt += pv && (pv.k === 'modal' || pv.k === 'sm' || pv.k === 'not') ? '助動詞のうしろなので原形(元の形)のまま。' : '主語が I / you / 複数で今のことなので、元の形のまま。';
      }
      else if (pos === '形容詞') txt = '様子を表す言葉(' + (c.w.e.ja || '') + ')。名詞の前に置いて名詞をくわしくするか、be動詞のうしろで主語の様子を言う。';
      else if (pos === '副詞') txt = c.w.k === 'deg' ? '「とても」。形容詞の前に置いて強める。' : '動詞や文をくわしくする言葉(' + (c.w.e.ja || '') + ')。' + (c.w.e.k === 'time' ? '時を表す副詞は文の最後に置くのが基本。' : c.w.e.k === 'place' ? '場所を表す副詞。前置詞はいらない。' : '様子を表す副詞は動詞(と目的語)のうしろに置くのが基本。');
      else if (pos === '否定') txt = '「〜ない」。be動詞・助動詞のうしろに置く。ふつうの動詞のときは do / does / did + not にする。';
      else if (pos === '接続詞') txt = { and: '「そして」。', but: '「でも」。', so: '「だから」。', when: '「〜するとき」。', 'if': '「もし〜なら」。', because: '「〜だから」。' }[c.w.v] + 'うしろに「主語 + 動詞」の文が続く。';
      else if (pos === '関係代名詞') txt = '前の名詞を、うしろの文で説明するときのつなぎ(who は人、which はもの、that はどちらにも使える)。';
      var fixed = R0.fixK && R0.fixK[k];
      out.push({ w: x.t, pos: pos, auto: fixed ? (x.auto ? true : 'form') : (x.auto || (c && cardText(c).toLowerCase() !== t)) ? 'rule' : false, txt: txt });
    });
    return out;
  }
  export function reviewItems(row, ev) { var R0 = chunksOf(row, ev); return R0 && R0.chunks.length ? R0 : null; }
  export function showReview(R0) {
    return new Promise(function (done) {
      var o = el('div', 'modal'); root.appendChild(o); var idx = -1, chs = R0.chunks; R0.fixK = {}; improvements(R0).forEach(function (m) { R0.fixK[m.k] = 1; });
      function line(hi) { return chs.map(function (ch, i) { var r = ROLE[ch.role] || ROLE.other; return '<span class="ck ' + r.c + (i === hi ? ' hi' : '') + (hi >= 0 && i !== hi ? ' dim' : '') + '"><b>' + (i === 0 ? ch.text.charAt(0).toUpperCase() + ch.text.slice(1) : ch.text) + '</b><small>' + r.n + '</small></span>'; }).join('') + '<span class="ck dot">.</span>'; }
      function close() { o.remove(); done(); }
      function page() {
        var body, btn;
        if (idx < 0) {
          body = '<h2>📖 この文を分解しよう</h2><div class="cks">' + line(-1) + '</div>' +
            '<p class="lead">英語の文は、意味のかたまり(<b>チャンク</b>)を決まった順番に並べて作る。<br>基本の順番:<b>主語 → 動詞 → 目的語・補語 → 場所 → 時</b></p>' +
            '<p class="lead">この文の型:<b>' + yaku(R0.ev.f).name + '</b></p><p class="sm">チャンクごとに、中の1語1語の品詞と、なぜその形なのかを見ていこう。「置き忘れ」「選びなおし」はあなたが直す所。「自動で変わる形」は主語などに合わせて決まるルール(まちがいではない)。</p>';
          btn = 'くわしく見る';
        } else if (idx < chs.length) {
          var ch = chs[idx], r = ROLE[ch.role] || ROLE.other, notes = wordNotes(ch, R0);
          body = '<h2>' + (idx + 1) + '. ' + r.n + (r.m ? '<small>' + r.m + '</small>' : '') + '</h2><div class="cks">' + line(idx) + '</div>' +
            '<div class="big"><b>' + ch.text + '</b>' + (ch.ja ? '<span>' + ch.ja + '</span>' : '') + '</div>' +
            (r.d ? '<p class="lead">' + (ch.cl === 'second' ? '(2つ目の文)' : ch.cl === 'front' ? '(前おきの文の中)' : '') + r.d + '</p>' : '') +
            (notes.length ? '<ul class="wn">' + notes.map(function (n) { return '<li><div class="wh"><b>' + n.w + '</b><i>' + n.pos + '</i>' + (n.auto === true ? '<u>置き忘れ</u>' : n.auto === 'form' ? '<u>選びなおし</u>' : n.auto === 'rule' ? '<u class="ru">自動で変わる形</u>' : '') + '</div>' + n.txt + '</li>'; }).join('') + '</ul>' : '');
          btn = idx + 1 < chs.length ? 'つぎのチャンクへ' : 'まとめへ';
        } else {
          var pts = []; chs.forEach(function (ch) { wordNotes(ch, R0).forEach(function (n) { if (n.auto === true || n.auto === 'form') pts.push('<li><b>' + n.w + '</b>(' + n.pos + ')</li>'); }); });
          body = '<h2>まとめ</h2><div class="cks">' + line(-1) + '</div><p class="lead">' + chs.map(function (c) { return '<b>' + (ROLE[c.role] || ROLE.other).n + '</b>'; }).join(' → ') + '</p>' +
            (pts.length ? '<p class="sm">今回の置き忘れ・選びなおし:</p><ul class="pts">' + pts.join('') + '</ul><p class="sm">次は、この部品も自分でカードを置いてみよう。</p>' : '<p class="sm">補った語はなし。完ぺき!</p>');
          btn = 'おわり';
        }
        o.innerHTML = '<div class="box rv">' + body + '<div class="rvb"><button class="btn ghost small" id="cl">解説をやめる</button><button class="btn go" id="nx">' + btn + '</button></div><div class="pg">' + (idx + 2) + ' / ' + (chs.length + 2) + '</div></div>';
        $('#nx', o).onclick = function () { SFX.tap(); idx++; if (idx > chs.length) close(); else page(); };
        $('#cl', o).onclick = close;
        if (idx >= 0 && idx < chs.length) speak(chs[idx].text);
      }
      page();
    });
  }
  // ---- 初級:10秒止まったら、次に必要なカードを光らせる ----
  export function armIdle() {
    clearTimeout(G_.idleT); G_.needId = null; if (G_.hand) Array.prototype.forEach.call(G_.hand.querySelectorAll('.need'), function (e) { e.classList.remove('need'); });
    if (LEVEL !== 0 || !G_.hand) return;
    G_.idleT = setTimeout(idleHint, 10000);
  }
  export function idleHint() {
    if (LEVEL !== 0 || G_.busy || G_.mode !== 'play' || !G_.hand || !document.body.contains(G_.hand)) return;
    var cards = R.hand.concat(R.row.filter(function (c) { return !c.tsu; }));
    var best = VSref && VSref._search ? VSref._search(cards, null, 1, 220) : null;
    if (!best) { if (G_.hp) G_.hp.innerHTML = '<div class="hrow">💡 ' + diagnose(cards) + '</div>'; return; }
    var inRow = {}; R.row.forEach(function (c) { inRow[c.id] = 1; });
    var miss = best.row.filter(function (c) { return !c.tsu && !inRow[c.id]; });
    var noAdj = function (c) { return c.w.k !== 'adj' && c.w.k !== 'adv'; }, pick0 = miss.filter(function (c) { return G_.nxH && G_.nxH[c.id] && noAdj(c); })[0] || miss.filter(noAdj)[0] || miss[0];
    if (!pick0) { if (G_.hp && cur && cur.state !== 'ok') G_.hp.innerHTML = '<div class="hrow">💡 カードはそろっている。並べる順番を見直そう(主語 → 動詞 → 目的語 → 場所 → 時)</div>'; return; }
    var idx = best.row.indexOf(pick0), role = roleOf(best.row, idx) || '';
    G_.needId = pick0.id;
    Array.prototype.forEach.call(G_.hand.children, function (e) { var c = R.hand[+e.dataset.i]; if (c && c.id === pick0.id) e.classList.add('need'); });
    if (G_.hp) G_.hp.innerHTML = '<div class="hrow need">💡 次はこのカード:<b>' + cardText(pick0) + '</b>' + (role ? '(' + role + ')' : '') + '</div>' + G_.hp.innerHTML;
    SFX.joker();
  }
  // ---- 初級:置き忘れた語・直した形を、まず必ず解説する ----
  // 「直した」に出すのは、本人が選べたのに置き忘れた・選びまちがえた所だけ。
  // 三単現の -s・him/her・is/are・do-support のような「カードの仕組みで自動に決まる形」は出さない(全体の解説でルールとして説明)
  export function vCat(c, tok, row, i) {
    var e = c.w.e, t = first(tok), pv = prevCore(row.map(function (z) { return z.w; }), i);
    if (t === first(vtext(e, 'ing'))) return 'ing';
    if (t === first(vtext(e, 'pp')) && pv && (pv.k === 'be' || pv.k === 'hv')) return 'pp';
    if (t === first(vtext(e, 'past')) && t !== first(vtext(e, 'base'))) return 'past';
    return 'base';
  }
  export function improvements(R0) {
    var out = [], seq = R0.seq, row = R0.row;
    seq.forEach(function (x, k) {
      var c = x.auto ? null : row[x.card], t = x.t.toLowerCase();
      if (x.auto) { if (/^(do|does|did)$/.test(t)) return; out.push({ k: k, kind: 'miss', w: x.t, pos: posOf(x, null), why: needWhy(x, k, R0) }); return; }
      if (!c || c.w.k !== 'v') return;
      var want = vCat(c, x.t, row, x.card), have = c.w.f || 'base';
      if (want === 'base' || want === have) return;
      if (vtext(c.w.e, have) === x.t) return; // 見た目が同じ形(filled の過去形と過去分詞など)は取りちがえにしない
      out.push({ k: k, kind: 'form', w: x.t, from: cardText(c), pos: posOf(x, c), why: formWhy(c, x, R0) });
    });
    return out;
  }
  export function nextNoun(seq, k, row) { for (var j = k + 1; j < seq.length; j++) if (!seq[j].auto) { var c = row[seq[j].card]; if (c && c.w.k === 'n') return c; if (c && !/^(adj|det)$/.test(c.w.k)) return null; } return null; }
  export function needWhy(x, k, R0) {
    var t = x.t.toLowerCase(), n = nextNoun(R0.seq, k, R0.row), nw = n ? n.w.e.w : '', cat = n ? n.w.e.cat : '';
    if (t === 'a' || t === 'an') return '「' + nw + '」は数えられる名詞。英語では、数えられる名詞を1つだけ言うとき、前に a / an / the などがかならず必要(名詞だけをポンと置くことはできない)。ここでは「ある1つの」なので ' + t + (t === 'an' ? '(母音で始まるので a ではなく an)' : '') + '。';
    if (t === 'the') return '「' + nw + '」の前に冠詞が必要。' + (/^(place|time)$/.test(cat) ? nw + ' のような場所・時間帯は「いつもの・その」と決まったものなので the を付ける。' : '話の中で「どれのことか」決まっているものには the を付ける。');
    if (/^(in|on|at|to)$/.test(t)) return '「' + nw + '」を' + (cat === 'time' ? '「いつ」' : '「どこで・どこへ」') + 'として使うには、前に前置詞が必要。前置詞がないと、' + nw + ' が動詞の「何を」(目的語)のように読まれてしまう。' + (t === 'on' ? '曜日・日付は on。' : t === 'at' ? (cat === 'time' ? '時刻など「時の1点」は at。' : '駅など「地点」は at。') : t === 'to' ? '移動の動詞(go など)の行き先は to。' : cat === 'time' ? '朝・午後・月など「幅のある時間」は in。' : '公園・町など「広がりのある場所の中」は in。');
    if (/^(am|is|are|was|were)$/.test(t)) return '英語の文には動詞がかならず1つ必要。形容詞(happy など)は動詞ではないので、主語とつなぐ be動詞を入れる。主語に合わせて ' + t + '(I → am、he・she → is、you・複数 → are、過去は was / were)。';
    if (t === 'will') return 'tomorrow など「これから先」の時の言葉があるので、未来を表す助動詞 will(〜するだろう・〜するつもり)を動詞の前に補った。will のうしろの動詞は原形(元の形)。';
    if (/^(do|does|did)$/.test(t)) return 'ふつうの動詞を not で打ち消すときは、動詞の前に do / does / did が必要。主語が he・she なら does、過去なら did。';
    return '文をつなぐために「' + x.t + '」が必要。';
  }
  export function formWhy(c, x, R0) {
    var k = c.w.k, t = x.t.toLowerCase(), base = cardText(c).toLowerCase(), row = R0.row;
    if (k === 'v') {
      var e = c.w.e, b = first(vtext(e, 'base')), w0 = first(t), pa = first(vtext(e, 'past'));
      var timeW = row.filter(function (z) { return z.w.k === 'adv' && z.w.e.k === 'time'; }).map(function (z) { return z.w.e.w; })[0];
      if (w0 === pa && w0 !== b) return (timeW ? '「' + timeW + '」があるので過去のこと。' : '過去のことなので、') + '動詞を過去形にする:' + b + ' → ' + w0 + '。英語は「〜した」を動詞の形で表す。';
      if (w0 === first(vtext(e, 'ing'))) return 'be動詞のあとは -ing 形で「〜しているところ」(進行形)。';
      if (w0 === first(vtext(e, 'pp'))) return 'have / be のあとは過去分詞(完了形・受け身)。';
      var subj = row.filter(function (z) { return z.w.k === 'pr' || z.w.k === 'n'; })[0];
      return '主語「' + (subj ? cardText(subj) : '') + '」は自分・相手以外の1人(1つ)で、今のこと。このとき動詞に -s を付ける(三人称単数現在):' + b + ' → ' + w0 + '。';
    }
    if (k === 'pr') return '「' + base + '」は動詞(または前置詞)のうしろにあるので、「〜を・〜に」の形にする:' + base + ' → ' + t + '。';
    if (k === 'be') return 'be動詞は主語と時に合わせて形が決まる:I am / he・she is / you・複数 are / 過去は was・were。ここでは ' + t + '。';
    if (k === 'hv') return '主語が he / she / 1つなら has、過去なら had にする。';
    return '形を直した。';
  }
  export function showImprove(R0, imps) {
    return new Promise(function (done) {
      var o = el('div', 'modal'); root.appendChild(o); var i = 0, seq = R0.seq;
      var mine = R0.row.map(cardText).join(' ');
      function sent(hk) { return seq.map(function (x, k) { var t = k === 0 ? x.t.charAt(0).toUpperCase() + x.t.slice(1) : x.t, im = imps.some(function (m) { return m.k === k; }); return '<span class="st' + (im ? ' im' : '') + (k === hk ? ' hi' : '') + '">' + t + '</span>'; }).join(' ') + '.'; }
      function page() {
        var m = imps[i];
        o.innerHTML = '<div class="box rv imp"><h2>✏️ ここを直したよ ' + (i + 1) + ' / ' + imps.length + '</h2>' +
          '<div class="cmp"><div><small>あなたの並べ方</small><p>' + mine + '</p></div><div><small>正しい文</small><p>' + sent(m.k) + '</p></div></div>' +
          '<div class="big"><b>' + (m.kind === 'form' ? m.from + ' → ' + m.w : '+ ' + m.w) + '</b><span>' + m.pos + (m.kind === 'miss' ? '・置き忘れ' : '・形の直し') + '</span></div>' +
          '<p class="lead">' + m.why + '</p><div class="rvb"><button class="btn ghost small" id="sk">とばす</button><button class="btn go" id="nx">' + (i + 1 < imps.length ? 'つぎへ' : 'わかった') + '</button></div></div>';
        $('#nx', o).onclick = function () { SFX.tap(); i++; if (i >= imps.length) { o.remove(); done(); } else page(); };
        $('#sk', o).onclick = function () { o.remove(); done(); };
      }
      page();
    });
  }
  export function askFull() {
    return new Promise(function (done) {
      var o = el('div', 'modal', '<div class="box rv"><h2>📖 文全体の解説</h2><p class="lead">この文をチャンクに分けて、1語ずつ品詞と働きを見ていく?</p><div class="rvb"><button class="btn ghost small" id="n">今回は見ない</button><button class="btn go" id="y">見る</button></div></div>');
      root.appendChild(o); $('#y', o).onclick = function () { o.remove(); done(true); }; $('#n', o).onclick = function () { o.remove(); done(false); };
    });
  }
  export async function reviewFlow(R0, noAsk) { var imps = improvements(R0); if (imps.length) await showImprove(R0, imps); if (noAsk || await askFull()) await showReview(R0); }
  // 出したあと:初級・中級は「直した所」をすぐ見せて全体の解説を聞く。上級は見たい人だけ
  export async function reviewAfter(R0) {
    if (LEVEL < 2) return reviewFlow(R0);
    var imps = improvements(R0);
    var yes = await new Promise(function (done) { var o = el('div', 'modal', '<div class="box rv"><h2>📖 この文の解説</h2><p class="lead">' + (imps.length ? '直した所が ' + imps.length + ' か所ある。' : '') + '解説を見る?</p><div class="rvb"><button class="btn ghost small" id="n">見ない</button><button class="btn go" id="y">見る</button></div></div>'); root.appendChild(o); $('#y', o).onclick = function () { o.remove(); done(true); }; $('#n', o).onclick = function () { o.remove(); done(false); }; });
    if (yes) { if (imps.length) await showImprove(R0, imps); await showReview(R0); }
  }
  // 今回出した文の記録(あとでふりかえる)
  export function snap(row) { return row.map(function (c) { var n = {}; for (var k in c) n[k] = c[k]; n.w = {}; for (var j in c.w) n.w[j] = c.w[j]; return n; }); }
  export function recordHist(list, row, ev, score) { if (ev && ev.state === 'ok') list.push({ row: snap(row), text: ev.text, score: score, lv: LEVEL }); }
  export function histModal(list) {
    var o = el('div', 'modal', '<div class="box rv"><h2>📚 今回の文をふりかえる</h2><p class="sm">タップすると、その文の「直した所」と全体の解説が見られる。</p><div class="hist" id="hl"></div><button class="btn go" id="ok">とじる</button></div>');
    root.appendChild(o);
    list.forEach(function (h, i) {
      var e = el('div', 'hi1', '<span>' + (i + 1) + '</span><b>' + h.text + '</b><i>' + (h.score != null ? h.score.toLocaleString() + '点' : '') + '</i>');
      e.onclick = async function () { var keep = LEVEL; setLevel(h.lv); var ev = evaluate(h.row), R0 = reviewItems(h.row, ev); if (R0) { o.style.display = 'none'; await reviewFlow(R0, true); o.style.display = ''; } else flash('この文は解説できない'); setLevel(keep); };
      $('#hl', o).appendChild(e);
    });
    $('#ok', o).onclick = function () { o.remove(); };
  }
  export function errMsg(ev, row) { var m = ev.msg || '', a = /語順|つながらない|まだ文/.test(m) ? advise(row) : ''; return (ev.state === 'bad' ? '✕ ' : '… ') + m + (a ? ' → ' + a : ''); }
  // ---- 指の操作:タップ/ドラッグで好きな場所へ差し込む/上フリックで台へ/下フリックで手札へ ----
  export var drag = null;
  export function gapAt(x, y, self) {
    var els = Array.prototype.filter.call(G_.row.querySelectorAll('.card'), function (n) { return n !== self; });
    if (!els.length) return { i: 0, el: null, after: false };
    var rs = els.map(function (n) { return n.getBoundingClientRect(); });
    var line = rs.filter(function (r) { return y >= r.top - 10 && y <= r.bottom + 10; });
    if (!line.length) { if (y < rs[0].top) return { i: +els[0].dataset.i, el: els[0], after: false }; var lk = els.length - 1; return { i: R.row.length, el: els[lk], after: true }; }
    for (var k = 0; k < els.length; k++) { var r = rs[k]; if (y >= r.top - 10 && y <= r.bottom + 10 && x < r.left + r.width / 2) return { i: +els[k].dataset.i, el: els[k], after: false }; }
    var lastIn = els[rs.indexOf(line[line.length - 1])]; return { i: +lastIn.dataset.i + 1, el: lastIn, after: true };
  }
  export function overRow(x, y) { var b = G_.row.getBoundingClientRect(); return x >= b.left - 6 && x <= b.right + 6 && y >= b.top - 14 && y <= b.bottom + 14; }
  export function caret(g) {
    var c = G_.caret; if (!g) { if (c) c.style.display = 'none'; return; }
    if (!c) { c = G_.caret = el('div', 'caret'); }
    if (c.parentNode !== G_.row) G_.row.appendChild(c);
    var rb = G_.row.getBoundingClientRect(); c.style.display = 'block';
    if (!g.el) { c.style.left = '4px'; c.style.top = '2px'; c.style.height = '70px'; return; }
    var r = g.el.getBoundingClientRect(); c.style.left = ((g.after ? r.right + 1 : r.left - 4) - rb.left) + 'px'; c.style.top = (r.top - rb.top) + 'px'; c.style.height = r.height + 'px';
  }
  export function cardPress(ev, c, e, from, spec) {
    if (G_.busy) return;
    var d = drag = { c: c, e: e, from: from, spec: spec, x: ev.clientX, y: ev.clientY, t: Date.now(), moved: false, ghost: null };
    e.setPointerCapture && e.setPointerCapture(ev.pointerId);
    e.onpointermove = function (m) {
      if (drag !== d) return; var dx = m.clientX - d.x, dy = m.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) > 8) { d.moved = true; if (from === 'row') e.classList.add('drag'); else { d.ghost = e.cloneNode(true); d.ghost.classList.add('ghost'); var r = e.getBoundingClientRect(), rr = root.getBoundingClientRect(); d.ghost.style.left = (r.left - rr.left) + 'px'; d.ghost.style.top = (r.top - rr.top) + 'px'; root.appendChild(d.ghost); e.style.opacity = .35; } }
      if (!d.moved) return;
      var tf = 'translate(' + dx + 'px,' + (dy - 46) + 'px) scale(1.08)'; if (from === 'row') e.style.transform = tf; else d.ghost.style.transform = tf; // 指で隠れないよう少し上に
      if (G_.mode === 'play' && overRow(m.clientX, m.clientY)) caret(gapAt(m.clientX, m.clientY, from === 'row' ? e : null)); else caret(null);
    };
    e.onpointerup = e.onpointercancel = function (u) {
      if (drag !== d) return; drag = null; e.onpointermove = e.onpointerup = e.onpointercancel = null; caret(null);
      if (d.ghost) d.ghost.remove(); e.style.opacity = ''; e.style.transform = ''; e.classList.remove('drag');
      var dx = u.clientX - d.x, dy = u.clientY - d.y, dt = Date.now() - d.t, flickUp = dy < -35 && Math.abs(dy) > Math.abs(dx) * 1.2 && dt < 350, flickDown = dy > 35 && Math.abs(dy) > Math.abs(dx) * 1.2 && dt < 350;
      if (!d.moved) return tapCard(c, from, spec);
      if (G_.mode !== 'play') { if (from === 'hand') tapCard(c, from, spec); return; }
      var into = overRow(u.clientX, u.clientY);
      if (from === 'row') {
        if (into) { var g = gapAt(u.clientX, u.clientY, e), fi = R.row.indexOf(c), to = g.i; R.row.splice(fi, 1); if (to > fi) to--; R.row.splice(Math.max(0, Math.min(R.row.length, to)), 0, c); SFX.put(); renderRow(); return; }
        if (flickDown || u.clientY > G_.row.getBoundingClientRect().bottom + 20) { R.row.splice(R.row.indexOf(c), 1); if (!c.tsu) R.hand.push(c); SFX.tap(); renderRow(); renderHand(); return; }
        renderRow(); return;
      }
      var nc = from === 'tsu' ? tsuCard(spec) : c;
      if (into) { var g2 = gapAt(u.clientX, u.clientY, null); if (from === 'hand') R.hand.splice(R.hand.indexOf(c), 1); R.row.splice(Math.max(0, Math.min(R.row.length, g2.i)), 0, nc); SFX.put(); renderRow(); renderHand(); return; }
      if (flickUp) { if (from === 'hand') R.hand.splice(R.hand.indexOf(c), 1); R.row.push(nc); SFX.put(); renderRow(); renderHand(); return; }
    };
  }
  export function tapCard(c, from, spec) {
    if (G_.busy) return;
    if (from === 'row') { if (cyclable(c)) { cycle(c); SFX.tap(); renderRow(); renderHand(); } return; }
    if (from === 'tsu') { SFX.put(); R.row.push(tsuCard(spec)); renderRow(); return; }
    if (G_.mode === 'disc') { var k = G_.mark.indexOf(c); if (k >= 0) G_.mark.splice(k, 1); else G_.mark.push(c); SFX.tap(); renderHand(); renderBtns(); return; }
    if (G_.mode === 'refill') { flash('先に補充しよう(山から引く/場から取る)'); return; }
    SFX.put(); R.hand.splice(R.hand.indexOf(c), 1); R.row.push(c); renderRow(); renderHand();
  }

  export var cur = null;
  export function updatePreview() {
    var ev = cur = evaluate(R.row);
    hintPanel(); if (G_.jt) G_.jt.textContent = ev.state === 'ok' && ev.ja ? ev.ja : '';
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
      G_.msg.textContent = errMsg(ev, R.row); if (G_.bp) G_.bp.disabled = true;
    }
  }
  // 場:捨て札は表向き。補充のときは、点数ぶんの捨て札ptで取れる
  export function renderField() {
    G_.fd.innerHTML = ''; G_.pt.textContent = R.pts;
    if (!R.field.length) G_.fd.appendChild(el('div', 'ph', 'まだ何も捨てていない'));
    R.field.forEach(function (c) {
      var e = cardEl(c, 'field', 0), cost = c.chips + c.bonus, can = G_.mode === 'refill' && R.pts >= cost; e.classList.add('mini'); if (G_.mode === 'refill') e.classList.add(can ? 'can' : 'cant');
      e.onclick = function () { if (G_.mode !== 'refill') { flash('捨てたあとの補充で、' + cost + 'pt 払うと取れる'); return; } if (!Core.take(c)) { SFX.bad(); flash('捨て札ptが足りない(' + cost + 'pt 必要)'); return; } SFX.coin(); afterRefill(); };
      G_.fd.appendChild(e);
    });
    G_.fh.textContent = G_.mode === 'refill' ? 'あと ' + R.refill + ' 枚:山から引く か、場のカードをタップして取る' : '';
  }
  export function renderBtns() {
    if (G_.vs) return G_.vs.btns();
    G_.bt.innerHTML = ''; var b = function (cls, txt, fn, dis) { var x = el('button', 'btn ' + cls, txt); x.onclick = fn; x.disabled = !!dis; G_.bt.appendChild(x); return x; };
    if (G_.mode === 'disc') { b('ghost', 'やめる', function () { G_.mode = 'play'; G_.mark = []; SFX.tap(); renderAll(); }); b('disc', G_.mark.length ? G_.mark.length + '枚 捨てる' : '捨てるカードをえらぶ', doDiscard, !G_.mark.length); return; }
    if (G_.mode === 'refill') { b('ghost', '山から引く(あと' + R.refill + ')', function () { Core.drawOne(); SFX.put(); afterRefill(); }); b('go', 'ぜんぶ山から', function () { while (R.refill > 0) Core.drawOne(); SFX.put(); afterRefill(); }); return; }
    G_.bd = b('disc', '捨てる', function () { if (!R.discards) { flash('このステージではもう捨てられない'); return; } G_.mode = 'disc'; G_.mark = []; SFX.tap(); renderAll(); }, !R.discards || G_.busy);
    G_.bp = b('play', '出す!', play, !cur || cur.state !== 'ok' || G_.busy); G_.bp.id = 'bp'; G_.bd.id = 'bd';
  }
  export function doDiscard() { if (!G_.mark.length) return; Core.discard(G_.mark.slice()); G_.mark = []; G_.mode = 'refill'; SFX.tap(); renderAll(); }
  export function afterRefill() { if (R.refill <= 0) G_.mode = 'play'; renderAll(); }
  export function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  export function bump(n) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
  export async function play() {
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
    clearTimeout(G_.idleT); recordHist(R.hist = R.hist || [], R.row, cur, total);
    var rv = reviewItems(R.row, cur); if (rv) await reviewAfter(rv);
    if (total > R.best.pts) R.best = { text: text, pts: total };
    R.total += total; afterPlay(cur, sc); R.hintLv = 0; G_.hintBest = null; G_.hintIds = {};
    R.disc = R.disc.concat(R.row.filter(function (c) { return !c.tsu; })); R.row = [];
    await wait(350); deal(); G_.busy = false;
    if (R.score >= R.target) { stageClear(); return; }
    if (R.hands <= 0) { finalReveal(); return; }
    renderAll();
  }
  // 出したあと:役のくり返し・話のつながり・お題・名コンビ図鑑・ゲストのスカウト
  export function afterPlay(ev, sc) {
    R.yakuCnt[sc.y.name] = (R.yakuCnt[sc.y.name] || 0) + 1; R.prev = ev.nps; R.stageF.push(ev.f);
    var got = [];
    R.missions.forEach(function (x) { if (!x.done && missionHit(x.m, ev.f)) { x.done = true; var g = x.m.tier + 1; R.money += g; got.push('🎯「' + x.m.label + '」達成 💰+' + g); } });
    if (got.length && R.missions.every(function (x) { return x.done; })) { R.money += 3; got.push('🎯 お題ぜんぶ達成! 💰+3'); }
    got.forEach(function (t, i) { setTimeout(function () { flash(t); SFX.coin(); renderTop(); }, 300 + i * 1900); });
    if (ev.f.colloc === 'good' && addCombo(ev.f.pair)) { R.money++; flash('📖 名コンビ図鑑に登録!「' + ev.f.pair + '」💰+1'); }
    R.row.forEach(function (c) { if (c.guest) { c.guest = false; c.scout = true; R.deck.push(c); setTimeout(function () { flash('⭐ スカウト!「' + cardText(c) + '」が山札に入った'); }, 900); } });
  }
  export function addCombo(pair) { var l = store.get('combos') || []; if (l.indexOf(pair) >= 0) return false; l.push(pair); store.set('combos', l); return true; }
  // ---- シークレットお題 ----
  export var QUESTS = [
    ['past', '過去形', 0], ['neg', '否定(not)', 0], ['place', '場所の句', 0], ['time', '時の句', 0], ['adj', '形容詞', 0], ['O', '目的語', 0],
    ['prog', '進行形', 1], ['aux', '助動詞', 1], ['clause', 'because / when / if', 1], ['C', '補語(be + 形容詞など)', 1], ['story', '話のつながり', 1], ['combo', '名コンビ', 1],
    ['perfect', '完了形', 2], ['passive', '受け身', 2], ['post', '後置修飾', 2], ['phrasal', '句動詞', 2], ['gerund', '動名詞', 2], ['padj', '分詞の形容詞', 2]
  ].map(function (q) { return { k: q[0], label: q[1], tier: q[2] }; });
  // 普通のお題(中身が見える)
  export var MISSIONS = [
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
  export function pickMissions(used, n) {
    var tiers = n === 1 ? [Math.floor(rnd() * 3)] : [0, 1, 2];
    return tiers.map(function (t) { var pool = MISSIONS.filter(function (m) { return m.tier === t && used.indexOf(m.k) < 0; }); if (!pool.length) { pool = MISSIONS.filter(function (m) { return m.tier === t; }); } var m = pick(pool); used.push(m.k); return { m: m, done: false }; });
  }
  export function missionHit(m, f) { try { if (m.t(f)) return true; if (!f.sub) return false; var g = {}; for (var k in f) g[k] = f[k]; for (var j in f.sub) g[j] = true; return !!m.t(g); } catch (e) { return false; } }
  export var Q_PCT = [10, 20, 30], TIER_JA = ['やさしい', 'ふつう', 'むずかしい'];
  export function questHit(q, f) { return q.k === 'story' ? !!(f.story || f.storyP) : q.k === 'adj' ? f.adj > 0 : !!(f[q.k] || (f.sub && f.sub[q.k])); }
  export function pickQuest(used) {
    var cands = [0, 1, 2].map(function (t) { var pool = QUESTS.filter(function (q) { return q.tier === t && used.indexOf(q.k) < 0; }); if (!pool.length) pool = QUESTS.filter(function (q) { return q.tier === t; }); return pick(pool); });
    var secret = pick(cands); used.push(secret.k); return { cands: cands, secret: secret };
  }
  export function questBar(Q, fs) {
    return '🔒 シークレットお題(このうちどれか1つ):' + Q.cands.map(function (q) { var hit = fs.some(function (f) { return questHit(q, f); }); return '<span class="qc t' + q.tier + (hit ? ' hit' : '') + '">' + (hit ? '✔ ' : '') + q.label + '</span>'; }).join('');
  }
  export async function finalReveal() {
    var Q = R.quest, hit = R.stageF.some(function (f) { return questHit(Q.secret, f); }), bonus = hit ? Math.round(R.target * Q_PCT[Q.secret.tier] / 100) : 0;
    var o = el('div', 'modal', '<div class="box"><h2>🔒 シークレットお題は…</h2><div class="qrev t' + Q.secret.tier + '">' + Q.secret.label + '</div><p class="res ' + (hit ? 'w' : 'l') + '">' + (hit ? '達成! 目標の' + Q_PCT[Q.secret.tier] + '% = +' + bonus + '点' : '出していなかった…') + '</p><button class="btn go" id="ok">つづける</button></div>');
    root.appendChild(o); if (hit) SFX.win(); else SFX.bad();
    await new Promise(function (r) { $('#ok', o).onclick = r; }); o.remove();
    R.questDone = true;
    if (hit) { await countUp(bonus); R.total += bonus; }
    if (R.score >= R.target) { flash('🎉 逆転クリア!'); stageClear(); } else gameOver();
  }
  export function floatTxt(target, txt, kind) { var r = target.getBoundingClientRect(), rr = root.getBoundingClientRect(), f = el('div', 'float ' + kind, txt); f.style.left = (r.left - rr.left + r.width / 2) + 'px'; f.style.top = (r.top - rr.top) + 'px'; root.appendChild(f); setTimeout(function () { f.remove(); }, 900); }
  export async function countUp(total) {
    var from = R.score, to = R.score + total, big = el('div', 'bigscore', '0'); root.appendChild(big);
    var steps = 18; for (var i = 1; i <= steps; i++) { big.textContent = Math.round(total * i / steps).toLocaleString(); R.score = Math.round(from + (to - from) * i / steps); renderTop(); if (i % 3 === 0) SFX.coin(); await wait(28); }
    R.score = to; renderTop(); await wait(500); big.remove();
  }
  export function interestCap() { return R.jokers.some(function (j) { return j.id === 'bank'; }) ? 10 : 5; }
  export function stageClear() {
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
  export function saveBest(stage) { var b = store.get('best') || {}; if (!b.stage || stage > b.stage || (stage === b.stage && R.total > (b.total || 0))) store.set('best', { stage: stage, total: R.total, text: R.best.text }); }
  // ---------------- お店 ----------------
  export var shopItems = null;
  export function rollShop() {
    var owned = R.jokers.map(function (j) { return j.id; }), pool = shuffle(JOKERS.filter(function (j) { return owned.indexOf(j.id) < 0; }));
    shopItems = [];
    pool.slice(0, 2).forEach(function (j) { shopItems.push({ t: 'joker', j: j, price: j.price }); });
    shopItems.push({ t: 'pack', price: 4 });
    var keys = ['O', 'place', 'time', 'past', 'aux', 'prog', 'perfect', 'manner', 'C', 'neg', 'clause', 'passive', 'post', 'phrasal', 'gerund', 'padj'], k = pick(keys);
    shopItems.push({ t: 'book', key: k, price: 3 });
    shopItems.push(rnd() < .4 ? { t: 'it', price: 5 } : { t: 'boost', price: 3 });
  }
  export function showShop(fresh) {
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
  export function confirmSell(j) {
    var o = el('div', 'modal', '<div class="box"><h2>' + j.name + '</h2><p>' + j.desc + '</p><p>売ると 💰' + Math.floor(j.price / 2) + '</p><button class="btn disc" id="ys">売る</button><button class="btn ghost" id="no">やめる</button></div>');
    root.appendChild(o); $('#no', o).onclick = function () { o.remove(); };
    $('#ys', o).onclick = function () { R.jokers.splice(R.jokers.indexOf(j), 1); R.money += Math.floor(j.price / 2); SFX.coin(); o.remove(); showShop(false); };
  }
  export function buy(i) {
    var it = shopItems[i]; if (!it) return; if (R.money < it.price) { SFX.bad(); return; }
    if (it.t === 'joker') { if (R.jokers.length >= 5) { flash('ジョーカーは5枚まで(売ってから買おう)'); SFX.bad(); return; } R.money -= it.price; R.jokers.push(it.j); shopItems[i] = null; SFX.joker(); showShop(false); return; }
    if (it.t === 'book') { R.money -= it.price; R.lv[it.key] = (R.lv[it.key] || 0) + 1; shopItems[i] = null; SFX.joker(); showShop(false); return; }
    if (it.t === 'pack') { R.money -= it.price; shopItems[i] = null; SFX.coin(); openPack(); return; }
    if (it.t === 'it') { R.money -= it.price; shopItems[i] = null; R.deck.push(mk('pron', 'it')); SFX.joker(); showShop(false); return; }
    if (it.t === 'boost') { R.money -= it.price; shopItems[i] = null; SFX.coin(); openBoost(); return; }
  }
  // ゲストカード:山札にない上級の語(金色・点2倍)。文に使えばスカウトして山札へ
  export function guestCard() {
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
  export function randomCard() {
    if (rnd() < .04) return mk('pron', 'it');
    var r = rnd(), lv = Math.min(3, 1 + Math.floor(((R && R.stage) || 0) / 3)), ok = function (e) { return (e.lv || 1) <= lv + 1 && (e.lv || 1) >= 1; };
    if (r < .3) { var vs = DICT.all('verb').filter(function (e) { return ok(e) && !e.tail && e.fr !== 'cl' && !e.cv && !e.link; }); return mk('v', pick(vs).w); }
    if (r < .65) { var ns = DICT.all('noun').filter(function (e) { return ok(e) && (e.cat !== 'time' || e.prep); }); return mk('n', pick(ns).w); }
    if (r < .82) return mk('adj', pick(DICT.all('adj').filter(ok)).w);
    if (r < .95) return mk('adv', pick(DICT.all('adv').filter(function (e) { return e.k === 'manner' || e.k === 'time' || e.k === 'place'; })).w);
    return mk('pron', pick(['i', 'you', 'he', 'she', 'we', 'they']));
  }
  export function openPack() {
    var cs = [randomCard(), randomCard(), randomCard()].filter(Boolean);
    var o = el('div', 'modal', '<div class="box"><h2>1枚えらんで山札へ</h2><div class="pick" id="pk"></div><button class="btn ghost" id="sk">いらない</button></div>'); root.appendChild(o);
    cs.forEach(function (c) { var e = cardEl(c, 'hand', 0); e.classList.add('big'); var w = el('div', 'pc'); w.appendChild(e); w.appendChild(el('div', 'ja', (c.w.e ? c.w.e.ja : '') + '<br><small>' + KIND_JA[c.kind] + '</small>')); w.onclick = function () { R.deck.push(c); SFX.put(); o.remove(); showShop(false); }; $('#pk', o).appendChild(w); });
    $('#sk', o).onclick = function () { o.remove(); showShop(false); };
  }
  export function openBoost() {
    var o = el('div', 'modal', '<div class="box"><h2>強化するカードをえらぶ(+15)</h2><div class="pick scroll" id="pk"></div></div>'); root.appendChild(o);
    R.deck.forEach(function (c) { var e = cardEl(c, 'hand', 0); e.onclick = function () { c.bonus += 15; SFX.joker(); o.remove(); showShop(false); }; $('#pk', o).appendChild(e); });
  }
  export function flash(t) { var f = el('div', 'toast', t); root.appendChild(f); setTimeout(function () { f.remove(); }, 1800); }
  export function gameOver() { SFX.lose(); saveBest(R.stage + 1); showEnd(false); }
  export function showEnd(win) {
    var s = screen('<div class="end"><h1>' + (win ? '🏆 全ステージ クリア!' : 'ゲームオーバー') + '</h1><div class="st">ステージ ' + (R.stage + 1) + (win ? '' : ' で目標に届かず(' + R.score.toLocaleString() + ' / ' + R.target.toLocaleString() + ')') + '</div>' +
      '<div class="tot">合計 ' + R.total.toLocaleString() + '点 ・ 文 ' + R.played + '本</div>' +
      (R.best.text ? '<div class="bestS"><div class="lbl">いちばん高かった文(' + R.best.pts.toLocaleString() + '点)</div><div class="t">' + R.best.text + '</div><button class="btn ghost small" id="sp">🔊 聞く</button></div>' : '') +
      ((R.hist || []).length ? '<button class="btn ghost" id="hs">📚 今回の文をふりかえる(' + R.hist.length + ')</button>' : '') +
      '<button class="btn go" id="re">もう一回</button><button class="btn ghost" id="tt">タイトルへ</button></div>');
    if ($('#hs', s)) $('#hs', s).onclick = function () { histModal(R.hist); };
    if ($('#sp', s)) $('#sp', s).onclick = function () { speak(R.best.text); };
    $('#re', s).onclick = function () { SFX.put(); newRun(); }; $('#tt', s).onclick = function () { showTitle(); };
  }

  export var Kit = { G: G, CFG: CFG, $: $, el: el, rnd: rnd, pick: pick, shuffle: shuffle, store: store, SFX: SFX, speak: speak, unlock: unlock,
    mk: mk, card: card, starterDeck: starterDeck, randomCard: randomCard, TSU: TSU, tsuCard: tsuCard, cardText: cardText, cardEl: cardEl, colorOf: colorOf, lvOf: lvOf, cat: cat, verbFits: verbFits,
    evaluate: evaluate, yaku: yaku, JOKERS: JOKERS, PART_JA: PART_JA, KIND_JA: KIND_JA, Core: Core, fillTo: fillTo,
    G_: G_, getR: function () { return R; }, setR: function (x) { R = x; }, screen: screen, showTitle: showTitle, flash: flash, wait: wait, bump: bump, floatTxt: floatTxt,
    renderRow: renderRow, _cycle: cycle, _wordNotes: wordNotes, _formTag: formTag, _improvements: improvements, surfaceOf: surfaceOf, reviewItems: reviewItems, showReview: showReview, reviewFlow: reviewFlow, reviewAfter: reviewAfter, recordHist: recordHist, histModal: histModal, errMsg: errMsg, hintPanel: hintPanel, doHint: doHint, level: function () { return LEVEL; }, LV_MULT: LV_MULT, LV_JA: LV_JA, HINT_MULT: HINT_MULT, calcNext: calcNext, baseScore: baseScore, QUESTS: QUESTS, MISSIONS: MISSIONS, pickMissions: pickMissions, missionHit: missionHit, Q_PCT: Q_PCT, TIER_JA: TIER_JA, questHit: questHit, pickQuest: pickQuest, addCombo: addCombo, guestCard: guestCard, notes: notes, baseChips: baseChips, rowText: rowText, renderHand: renderHand, renderTsu: renderTsu, cur: function () { return cur; }, root: function () { return root; } };
