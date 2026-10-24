/* レベル診断・実力テスト・総合の点数。
   - 単語は「よく使う順」の約3万語(ストリームの単語 約4,900＋単語バンク 約27,000)を10段に分け、
     正解なら上の段・まちがい/わからないなら下の段から出す（20問）。結果は推定語彙(語数)で出す
   - 当てずっぽう対策：「わからない」ボタン。答えるのに20秒以上かかった問題は「保留」にして結果に入れない(調べるのを防ぐ)
   - まちがいの選択肢は、同じ品詞で近い難しさの語から選ぶ
   - レベル診断は最初に1回。実力テストは、前のテストのあとミッションを10個クリアすると受けられる(さらに 無料は週1・有料は1日1)
     ミッションや課題には入れない
   - 総合の点数は「どのアプリの何を解放したか」(ストリームの星・レッスン・読み終えた本・レベルの上がり) */
import { createStore } from './store.js';
import { loadScript } from './host.js';
export const LV_NAME = { 1: '初級', 2: '中級', 3: '上級' };
const EDGES = [0, 500, 1000, 2000, 3000, 4500, 6500, 9000, 13000, 19000, 32000];
const BAND_NOTE = ['英語をはじめたところ', '中1くらい', '中学卒業・高校入試くらい', '高校1年くらい', '共通テストくらい', '難関大くらい', '英検準1級くらい', '英検1級くらい', 'ネイティブの大人くらい', 'ネイティブの大人以上'];
const NEED = 10, HOLD_MS = 20000, QN = 20;
const RANKS = [[0, 'ルーキー'], [300, 'ブロンズ'], [800, 'シルバー'], [1600, 'ゴールド'], [3000, 'プラチナ'], [5000, 'ダイヤモンド'], [8000, 'マスター']];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const json = v => { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch (e) { return null; } };
export const vocabNote = n => BAND_NOTE[Math.max(0, EDGES.findIndex(e => e > n) - 1)] || BAND_NOTE[BAND_NOTE.length - 1];
export const lvOfVocab = n => n < 2000 ? 1 : n < 4500 ? 2 : 3;
export function createLevel(core) {
  const st = createStore('core'), subs = new Set();
  const L = Object.assign({ lv: 0, max: 0, allowed: [], vocab: 0, passed: [], weak: '', tests: 0, lastCleared: 0 }, st.get('level') || {});
  const save = () => { st.set('level', L); subs.forEach(f => { try { f(); } catch (e) { } }); };
  // ---- 材料：よく使う順の単語 ----
  let G = null, ready = null;
  const load = () => ready || (ready = Promise.all(['words.js', 'data.js', 'bank.js'].map(f => loadScript(core.base + 'g/stream/' + f))).then(() => true).catch(() => false));
  function list() {
    if (G) return G;
    let W = null, B = ''; try { W = WORDS; } catch (e) { } try { B = BANK_SRC; } catch (e) { }
    if (!W) return null;
    const seen = new Set(); G = [];
    const add = (en, pos, ja) => { const k = en + '|' + pos; if (!en || !ja || seen.has(k)) return; seen.add(k); G.push([en, pos, ja]); };
    [1, 2, 3].forEach(l => (W[l] || []).forEach(w => add(w[0], w[1], w[2])));
    String(B).split('\n').forEach(l => { const c = l.split('\t'); add(c[0], c[1], c[2]); });
    return G;
  }
  const bandOf = i => Math.max(0, EDGES.findIndex(e => e > i) - 1);
  function wordQ(band, used) {
    const g = list(), lo = EDGES[band], hi = Math.min(EDGES[band + 1], g.length); if (hi - lo < 10) return null;
    for (let t = 0; t < 40; t++) {
      const i = lo + Math.floor(Math.random() * (hi - lo)), w = g[i]; if (used.has(w[0])) continue;
      // まちがいの選択肢：同じ品詞で、近い難しさ(前後 600 語以内)から
      const near = []; for (let j = Math.max(0, i - 600); j < Math.min(g.length, i + 600) && near.length < 60; j += 1 + Math.floor(Math.random() * 8)) { const x = g[j]; if (x[1] === w[1] && x[2] !== w[2] && x[0] !== w[0]) near.push(x[2]); }
      const opts = shuf([...new Set(near)]).slice(0, 3); if (opts.length < 3) continue;
      used.add(w[0]); return { kind: 'word', band, q: w[0], a: w[2], opts: shuf([w[2], ...opts]) };
    }
    return null;
  }
  // チャンクの意味：同じ長文の中のまとまりを選択肢にする(見分けにくい)
  function chunkQs(lv, n) {
    let PS = []; try { PS = PASSAGES; } catch (e) { }
    const out = [];
    shuf(PS.filter(p => p.lv === lv)).forEach(p => {
      const cs = p.chunks.map(c => ({ en: (c.tk || []).map(t => t[1]).join(' ').replace(/\s+([,.!?;:])/g, '$1'), ja: c.ja })).filter(c => c.en.split(' ').length >= 3 && c.ja);
      shuf(cs).slice(0, 2).forEach(c => { const o = shuf(cs.filter(x => x.ja !== c.ja)).slice(0, 3).map(x => x.ja); if (o.length === 3) out.push({ kind: 'chunk', q: c.en, a: c.ja, opts: shuf([c.ja, ...o]) }); });
    });
    return out.slice(0, n);
  }
  // ---- 出題：1問ずつ。20秒以上かかったものは保留 ----
  function run(title, startBand, extra, done) {
    const used = new Set(), res = []; let band = startBand, asked = 0, counted = 0, hold = 0;
    const queue = extra.slice();   // チャンクの問題は単語のあとに
    const next = () => {
      if (counted >= QN && !queue.length) return done(res, hold);
      if (asked > QN + 12 && !queue.length) return done(res, hold);   // 保留が多すぎるときも終わる
      const q = counted >= QN ? queue.shift() : wordQ(band, used); if (!q) return done(res, hold);
      asked++; const t0 = Date.now();
      core.ui.sheet(`<h3>${esc(title)}</h3><p class="cs-note">${Math.min(asked, QN + extra.length)} 問目 ・ ${q.kind === 'chunk' ? 'まとまりの意味' : '単語の意味'}を選んでください</p>
        <p class="cs-q">${esc(q.q)}</p>${q.opts.map((o, k) => `<button class="cs-btn" data-k="${k}">${esc(o)}</button>`).join('')}<button class="cs-btn cs-dk" data-k="-1">わからない</button>`, (ov, close) => {
        ov.querySelector('.cs-close').hidden = true;
        ov.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
          const k = +b.dataset.k, ok = k >= 0 && q.opts[k] === q.a, slow = Date.now() - t0 > HOLD_MS; close();
          if (slow) { hold++; if (q.kind === 'chunk') { } return next(); }   // 保留：結果にも段の上下にも入れない
          res.push({ ...q, ok }); if (q.kind === 'word') { counted++; band = ok ? Math.min(EDGES.length - 2, band + 1) : Math.max(0, band - 1); }
          next();
        });
      });
    };
    next();
  }
  // 段ごとの正答率から推定語彙：聞いていない段は、下は全部できる・上はできない、間は近い段と同じとみなす
  function estimate(res) {
    const nb = EDGES.length - 1, acc = Array(nb).fill(null), g = list().length;
    for (let b = 0; b < nb; b++) { const r = res.filter(x => x.kind === 'word' && x.band === b); if (r.length) acc[b] = r.filter(x => x.ok).length / r.length; }
    const asked = acc.map((a, b) => a == null ? -1 : b).filter(b => b >= 0); if (!asked.length) return 0;
    const lo = Math.min(...asked), hi = Math.max(...asked);
    let n = 0; for (let b = 0; b < nb; b++) {
      let a = acc[b]; if (a == null) a = b < lo ? 1 : b > hi ? 0 : (acc[b - 1] != null ? acc[b - 1] : 0.5);
      n += a * (Math.min(EDGES[b + 1], g) - EDGES[b]);
    }
    return Math.round(n / 50) * 50;
  }
  const miss = res => core.notebook.addMany(res.filter(x => !x.ok).map(x => ({ en: x.q, ja: x.a, src: 'test', marks: ['miss'] })));
  const intro = (title, n, cb) => core.ui.sheet(`<h3>${title}</h3><p class="cs-note">約${n}問。正確な診断のため、当てずっぽうで選ばないようにしてください。わからないときは「わからない」を押してください。<br>答えるまでに20秒以上かかった問題は、結果に入れません。</p><button class="cs-btn cs-go" data-go>はじめる</button>`, (ov, close) => ov.querySelector('[data-go]').onclick = () => { close(); cb(); });
  async function placement() {
    if (!(await load()) || !list()) return core.ui.toast('このアプリでは、レベル診断がまだ使えません');
    intro('レベル診断', QN, () => run('レベル診断', 3, [], (res, hold) => {
      const v = estimate(res), lv = lvOfVocab(v);
      L.vocab = v; L.lv = lv; L.max = Math.max(L.max, lv); L.allowed = [lv - 1, lv, lv + 1].filter(x => x >= 1 && x <= 3); L.at = Date.now(); L.lastCleared = core.mission ? core.mission.cleared() : 0; save(); miss(res);
      core.ui.sheet(`<h3>推定語彙 約${v.toLocaleString()}語</h3><p class="cs-note">${vocabNote(v)}。アプリのレベルは「${LV_NAME[lv]}」から始まります(選べるのは ${L.allowed.map(x => LV_NAME[x]).join('・')})。${hold ? `<br>20秒以上かかった ${hold} 問は、結果に入れていません。` : ''}<br>まちがえた単語は勉強ノートに入りました。</p>`);
    }));
  }
  // 実力テスト：ミッションを NEED 個クリアするごとに受けられる
  const progress = () => Math.max(0, (core.mission ? core.mission.cleared() : 0) - (L.lastCleared || 0));
  const canTest = () => !!L.lv && progress() >= NEED && core.member.canTest();
  async function test() {
    if (!L.lv) return placement();
    if (progress() < NEED) return core.ui.sheet(`<h3>実力テスト</h3><p class="cs-note">ミッションをあと ${NEED - progress()} 個クリアすると受けられます。</p>`);
    const M = core.member;
    if (!M.canTest()) return core.ui.sheet(`<h3>実力テスト</h3><p class="cs-note">次に受けられるのは${M.nextTest()}です(${M.isPaid() ? '有料会員は1日1回' : '無料会員は週1回'})。ダイヤ ${core.econ.test.extraGems} でもう1回受けられます(持っている:${M.gems()})。</p><button class="cs-btn" data-buy>ダイヤで受ける</button>`, (ov, close) =>
      ov.querySelector('[data-buy]').onclick = () => { close(); if (M.buyTest()) test(); else core.ui.toast('ダイヤが足りません'); });
    if (!(await load()) || !list()) return core.ui.toast('このアプリでは、実力テストがまだ使えません');
    intro('実力テスト', QN + 6, () => {
      M.useTest();
      run('実力テスト', Math.max(1, bandOf(L.vocab || 1500)), chunkQs(L.lv, 6), (res, hold) => {
        const v = estimate(res), before = L.vocab || 0, nl = lvOfVocab(v), cr = res.filter(x => x.kind === 'chunk'), cacc = cr.length ? cr.filter(x => x.ok).length / cr.length : 1;
        L.tests++; L.vocab = v; L.lastCleared = core.mission ? core.mission.cleared() : 0; L.weak = cacc < .7 ? 'read' : 'word';
        let msg = '';
        if (nl > L.lv && cacc >= .6) { L.passed.push({ lv: nl, at: Date.now(), vocab: v }); L.lv = nl; L.max = Math.max(L.max, nl); msg = `合格! ${LV_NAME[nl]}が開きました。`; }
        L.allowed = [L.lv - 1, L.lv, L.lv + 1].filter(x => x >= 1 && x <= Math.min(3, L.max + 1)); save(); miss(res);
        core.events.report('level', 'done', { play: 'test', min: Math.round(res.length * .25 * 10) / 10, score: Math.round(res.filter(x => x.ok).length / Math.max(1, res.length) * 100), finished: true });
        core.ui.sheet(`<h3>推定語彙 約${v.toLocaleString()}語</h3><p class="cs-note">${vocabNote(v)}(前回 ${before.toLocaleString()}語)。チャンクの意味 ${Math.round(cacc * 100)}%。<br>${msg || (L.lv < 3 ? `次のレベルは 推定語彙 ${nl < 2 ? '2,000' : '4,500'}語 と、チャンクの意味6割 で開きます。` : 'いちばん上のレベルです。')}${hold ? `<br>20秒以上かかった ${hold} 問は、結果に入れていません。` : ''}<br>まちがえた言葉は勉強ノートに入りました。</p>`);
      });
    });
  }
  function score() {
    const sv = json(createStore('stream').get('chunkstream.v1')) || {}, mk = createStore('chunkchunk').get('make') || {};
    let stars = 0; Object.values(sv.best || {}).forEach(b => Object.values(b).forEach(s => { if (s && typeof s === 'object') stars += Math.max(s.ta ? s.ta.stars || 0 : 0, s.rh ? s.rh.stars || 0 : 0); }));
    const lessons = Object.keys(mk.done || {}).length, books = core.record.total('cc.read');
    const parts = [{ n: 'ストリームの星', v: stars, p: stars * 10 }, { n: 'レッスンのクリア', v: lessons, p: lessons * 20 }, { n: '読み終えた本', v: books, p: books * 15 }, { n: 'レベルの合格', v: L.passed.length, p: L.passed.length * 300 }];
    const total = parts.reduce((a, x) => a + x.p, 0), ri = RANKS.reduce((a, r, i) => total >= r[0] ? i : a, 0);
    return { total, parts, rank: RANKS[ri][1], next: RANKS[ri + 1] ? { name: RANKS[ri + 1][1], need: RANKS[ri + 1][0] - total, at: RANKS[ri + 1][0], from: RANKS[ri][0] } : null };
  }
  return {
    get lv() { return L.lv; }, allowed: () => L.allowed.slice(), name: () => LV_NAME[L.lv] || '', weak: () => L.weak, vocab: () => L.vocab,
    canTest, testLeft: () => Math.max(0, NEED - progress()),
    placement, test, score, load,
    onChange(f) { subs.add(f); return () => subs.delete(f); },
  };
}
