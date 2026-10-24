/* レベルと実力テストと総合の点数。
   - 最初のレベル：自己申告にしない。12問の単語テストで決め、その前後のレベルの中でだけ選べる
   - 実力テスト：無料会員は週1回、有料会員は1日1回(member.canTest)。いまのレベルと1つ上の単語＋チャンクの意味。
     1つ上の問題を8割できたら、次のレベルが開く。まちがえた言葉は勉強ノートへ
   - 総合の点数：「どのアプリの何を解放したか」で付ける(ストリームの星・レッスンのクリア・読み終えた本・テストの合格)。
     ダイヤで先に開けたものは、クリアするまで点数に入らない(星やクリアの記録だけを数えるので、自然にそうなる)
   問題の材料はストリームの単語データ(g/stream/words.js)と長文(g/stream/data.js)。ストリームが入っていないアプリでは使えない */
import { createStore } from './store.js';
import { loadScript } from './host.js';
export const LV_NAME = { 1: '初級', 2: '中級', 3: '上級' };
const RANKS = [[0, 'ルーキー'], [300, 'ブロンズ'], [800, 'シルバー'], [1600, 'ゴールド'], [3000, 'プラチナ'], [5000, 'ダイヤモンド'], [8000, 'マスター']];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const json = v => { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch (e) { return null; } };
export function createLevel(core) {
  const st = createStore('core'), subs = new Set();
  const L = Object.assign({ lv: 0, max: 0, allowed: [], passed: [], weak: '', tests: 0 }, st.get('level') || {});
  const save = () => { st.set('level', L); subs.forEach(f => { try { f(); } catch (e) { } }); };
  let ready = null;
  const load = () => ready || (ready = Promise.all(['words.js', 'data.js'].map(f => loadScript(core.base + 'g/stream/' + f))).then(() => true).catch(() => false));
  const W = () => { try { return typeof WORDS !== 'undefined' ? WORDS : null; } catch (e) { return null; } };
  const PS = () => { try { return typeof PASSAGES !== 'undefined' ? PASSAGES : []; } catch (e) { return []; } };
  // 単語の4択：英語を見て意味を選ぶ
  function wordQs(lv, n) {
    const src = (W() || {})[lv] || []; if (src.length < 8) return [];
    const pool = shuf(src.slice(0, 600)).slice(0, n);
    return pool.map(w => { const others = shuf(src.filter(x => x[1] === w[1] && x[2] !== w[2])).slice(0, 3).map(x => x[2]); return { lv, kind: 'word', q: w[0], a: w[2], opts: shuf([w[2], ...others]) }; }).filter(x => x.opts.length === 4);
  }
  // チャンクの意味の4択：長文のまとまりを見て意味を選ぶ
  function chunkQs(lv, n) {
    const cs = PS().filter(p => p.lv === lv).flatMap(p => p.chunks.map(c => ({ en: (c.tk || []).map(t => t[1]).join(' '), ja: c.ja }))).filter(c => c.en && c.ja);
    return shuf(cs).slice(0, n).map(c => ({ lv, kind: 'chunk', q: c.en, a: c.ja, opts: shuf([c.ja, ...shuf(cs.filter(x => x.ja !== c.ja)).slice(0, 3).map(x => x.ja)]) })).filter(x => x.opts.length === 4);
  }
  // 問題を1問ずつ出すシート
  function run(title, qs, done) {
    let i = 0; const res = [];
    const show = () => core.ui.sheet(`<h3>${esc(title)}</h3><p class="cs-note">${i + 1} / ${qs.length}${qs[i].kind === 'chunk' ? ' ・ まとまりの意味' : ' ・ 単語の意味'}</p>
      <p class="cs-q">${esc(qs[i].q)}</p>${qs[i].opts.map((o, k) => `<button class="cs-btn" data-k="${k}">${esc(o)}</button>`).join('')}<button class="cs-btn" data-k="-1">わからない</button>`, (ov, close) => {
      ov.querySelector('.cs-close').hidden = true;
      ov.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = +b.dataset.k; res.push({ ...qs[i], ok: k >= 0 && qs[i].opts[k] === qs[i].a }); close(); i++; if (i < qs.length) show(); else done(res); });
    });
    show();
  }
  const rate = (res, lv) => { const r = res.filter(x => x.lv === lv); return r.length ? r.filter(x => x.ok).length / r.length : 0; };
  async function placement() {
    if (!(await load()) || !W()) return core.ui.toast('このアプリでは、レベル判定がまだ使えません');
    const qs = [1, 2, 3].flatMap(lv => wordQs(lv, 4));
    run('レベル判定(12問)', qs, res => {
      let lv = 1; if (rate(res, 2) >= .75) lv = 2; if (lv === 2 && rate(res, 3) >= .75) lv = 3;
      L.lv = lv; L.max = Math.max(L.max, lv); L.allowed = [lv - 1, lv, lv + 1].filter(x => x >= 1 && x <= 3 && x <= L.max + 1); L.at = Date.now(); save();
      miss(res);
      core.ui.sheet(`<h3>あなたのレベル:${LV_NAME[lv]}</h3><p class="cs-note">各アプリは、このレベルから始まります。選べるのは ${L.allowed.map(x => LV_NAME[x]).join('・')} です。上のレベルは実力テストで開きます。</p>`);
    });
  }
  async function test() {
    if (!(await load()) || !W()) return core.ui.toast('このアプリでは、実力テストがまだ使えません');
    if (!L.lv) return placement();
    const M = core.member;
    if (!M.canTest()) {
      return core.ui.sheet(`<h3>実力テスト</h3><p class="cs-note">次に受けられるのは${M.nextTest()}です(${M.isPaid() ? '有料会員は1日1回' : '無料会員は週1回'})。ダイヤ ${core.econ.test.extraGems} でもう1回受けられます(持っている:${M.gems()})。</p><button class="cs-btn" data-buy>ダイヤで受ける</button>`, (ov, close) =>
        ov.querySelector('[data-buy]').onclick = () => { close(); if (M.buyTest()) test(); else core.ui.toast('ダイヤが足りません'); });
    }
    M.useTest();
    const up = Math.min(3, L.lv + 1), qs = shuf([...wordQs(L.lv, 6), ...chunkQs(L.lv, 3), ...(up > L.lv ? [...wordQs(up, 8), ...chunkQs(up, 3)] : wordQs(L.lv, 8))]);
    run('実力テスト', qs, res => {
      L.tests++; const ok = res.filter(x => x.ok).length;
      const wr = res.filter(x => x.kind === 'word'), cr = res.filter(x => x.kind === 'chunk');
      L.weak = (cr.length && cr.filter(x => x.ok).length / cr.length < (wr.filter(x => x.ok).length / Math.max(1, wr.length))) ? 'read' : 'word';
      let msg = '';
      if (up > L.lv && rate(res, up) >= .8) { L.passed.push({ lv: up, at: Date.now() }); L.lv = up; L.max = Math.max(L.max, up); L.allowed = [up - 1, up].filter(x => x >= 1); msg = `合格! ${LV_NAME[up]}が開きました。`; }
      save(); miss(res);
      core.events.report('level', 'done', { play: 'test', min: Math.round(qs.length * .2 * 10) / 10, score: Math.round(ok / qs.length * 100), finished: true });
      core.ui.sheet(`<h3>実力テストの結果</h3><p class="cs-q">${ok} / ${qs.length}</p><p class="cs-note">${msg || (up > L.lv ? `${LV_NAME[up]}の問題が8割できると、次のレベルが開きます。` : 'いちばん上のレベルです。')}<br>まちがえた言葉は勉強ノートに入りました。</p>`);
    });
  }
  const miss = res => core.notebook.addMany(res.filter(x => !x.ok).map(x => ({ en: x.q, ja: x.a, src: 'test', marks: ['miss'] })));
  // 総合の点数(解放したもの)
  function score() {
    const sv = json(createStore('stream').get('chunkstream.v1')) || {}, mk = createStore('chunkchunk').get('make') || {};
    let stars = 0; Object.values(sv.best || {}).forEach(b => Object.values(b).forEach(s => { if (s && typeof s === 'object') stars += Math.max(s.ta ? s.ta.stars || 0 : 0, s.rh ? s.rh.stars || 0 : 0); }));
    const lessons = Object.keys(mk.done || {}).length, books = core.record.total('cc.read');
    const parts = [{ n: 'ストリームの星', v: stars, p: stars * 10 }, { n: 'レッスンのクリア', v: lessons, p: lessons * 20 }, { n: '読み終えた本', v: books, p: books * 15 }, { n: '実力テストの合格', v: L.passed.length, p: L.passed.length * 300 }];
    const total = parts.reduce((a, x) => a + x.p, 0), ri = RANKS.reduce((a, r, i) => total >= r[0] ? i : a, 0);
    return { total, parts, rank: RANKS[ri][1], next: RANKS[ri + 1] ? { name: RANKS[ri + 1][1], need: RANKS[ri + 1][0] - total, at: RANKS[ri + 1][0], from: RANKS[ri][0] } : null };
  }
  return {
    get lv() { return L.lv; }, allowed: () => L.allowed.slice(), name: () => LV_NAME[L.lv] || '', weak: () => L.weak,
    placement, test, score, load,
    onChange(f) { subs.add(f); return () => subs.delete(f); },
  };
}
