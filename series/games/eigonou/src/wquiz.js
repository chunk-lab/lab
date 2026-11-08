import { DB, SET, save, say, sayJa, toast, refreshLex } from './common.js';
import { prModeSeg } from './drill.js';
import { LEX } from './engine.js';
import { levelOf } from './play.js';
import { mySet } from './addword.js';
import { esc } from './play.js';
import { PR, pracStore, prNew } from './prac.js';
// ================= れんしゅう：単語の一問一答 =================
// 英→日 / 日→英 を切りかえ。10問単位。級は設定の「単語のレベル」と同じもの。
// 終わったら、まちがえた語にチェックを付けてマイセットへ。まちがえたままの語だけ、もう一度もできる。
const KINDS = ['things', 'verbs', 'states', 'manners'];
const KIND_JA = { things: '名詞', verbs: '動詞', states: '形容詞', manners: '副詞' };
const LV_OPTS = [[1, '3級まで'], [2, '準2級まで'], [3, '2級まで'], [4, 'それ以上も']];
export let WQ = { dir: 'ej', n: 10, phase: 'menu', list: [], i: 0, pick: -1, res: [], chk: {} };

function store() { const s = pracStore(); s.word = s.word || {}; return s.word; }
const bare = en => String(en || '').replace(/^(a|an|the) /i, '').trim();
// 意味の重なり(同じ語・片方が片方を含む)があれば、選択肢にしない
const jaParts = ja => String(ja || '').replace(/[（(][^）)]*[）)]/g, '').split(/[、,・／/；;]\s*/).map(s => s.replace(/[〜~…]/g, '').trim()).filter(Boolean);
function overlap(a, b) {
  const A = jaParts(a), B = jaParts(b);
  return A.some(x => B.some(y => x === y || (x.length >= 2 && y.length >= 2 && (x.includes(y) || y.includes(x)))));
}

// 出せる単語(1語だけのもの)
let POOL = null, POOL_KEY = '';
function pool() {
  const lv = SET().level || 2, key = lv + '|' + (LEX && LEX.verbs ? LEX.verbs.length : 0);
  if (POOL && POOL_KEY === key) return POOL;
  const seen = new Set(), out = [];
  KINDS.forEach(k => (LEX[k] || []).forEach(x => {
    if (!x || x.hidden || x.pv || x.tail || x.prep || !x.ja) return;
    const en = bare(x.en); if (!/^[a-z][a-z'-]*$/i.test(en) || en.length < 2) return;
    const key2 = en.toLowerCase(); if (seen.has(key2)) return;
    let l = 3; try { l = levelOf(x); } catch (e) { }
    if (lv < 4 && l > lv) return;
    seen.add(key2); out.push({ k: k + ':' + x.id, kind: k, x, en, ja: String(x.ja).replace(/[（(][^）)]*[）)]$/, '').trim(), lv: l });
  }));
  POOL = out; POOL_KEY = key; return out;
}
// まちがえて、まだ直せていない語
function missed() { const st = store(); return pool().filter(w => { const r = st[w.k]; return r && r.miss > 0 && r.streak === 0; }); }

function weight(w) { const r = store()[w.k]; if (!r) return 1; if (r.streak === 0) return 3; return [1, 1, 0.4, 0.15][Math.min(3, r.streak)] || 0.1; }
function sample(arr, n) {
  const a = arr.map(w => ({ w, s: Math.pow(Math.random(), 1 / weight(w)) }));   // 重みつきで、重ならないように選ぶ
  a.sort((p, q) => q.s - p.s); return a.slice(0, n).map(o => o.w);
}
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function options(w) {
  const P = pool(), same = shuffle(P.filter(o => o.kind === w.kind && o.en.toLowerCase() !== w.en.toLowerCase()));
  const out = [w];
  for (const o of same.concat(shuffle(P))) {
    if (out.length >= 4) break;
    if (out.some(p => p.en.toLowerCase() === o.en.toLowerCase() || p.ja === o.ja || overlap(p.ja, o.ja))) continue;
    out.push(o);
  }
  return shuffle(out);
}

function start(only) {
  const src = only ? missed() : pool();
  if (!src.length) { toast(only ? 'まちがえた語はありません' : '出せる単語がありません'); return; }
  WQ.list = (only ? shuffle(src).slice(0, WQ.n) : sample(src, WQ.n)).map(w => ({ w, opts: options(w) }));
  WQ.i = 0; WQ.res = []; WQ.chk = {}; WQ.phase = 'q'; WQ.only = !!only; ask();
}
function ask() { WQ.pick = -1; render(); const q = WQ.list[WQ.i]; if (!q) return; if (WQ.dir === 'ej') say(q.w.en); else sayJa(q.w.ja); }   // 最初の1回は自動で読む
function answer(j) {
  if (WQ.pick >= 0) return; const q = WQ.list[WQ.i]; WQ.pick = j; const ok = q.opts[j] === q.w;
  const st = store(), r = st[q.w.k] || { ok: 0, miss: 0, streak: 0 };
  if (ok) { r.ok++; r.streak++; } else { r.miss++; r.streak = 0; }
  st[q.w.k] = r; save(); WQ.res.push({ w: q.w, ok });
  if (!ok) WQ.chk[q.w.k] = true;
  if (WQ.dir === 'je') say(q.w.en);   // 日→英は、答えたあとに英語を読む
  render();
}
function next() { WQ.i++; if (WQ.i >= WQ.list.length) { WQ.phase = 'end'; render(); } else ask(); }
function addChecked() {
  const set = mySet(); let n = 0;
  WQ.res.filter(r => !r.ok && WQ.chk[r.w.k]).forEach(r => {
    const w = r.w; if (set.items.some(i => i.kind === w.kind && i.id === w.x.id)) return;
    const it = Object.assign({}, w.x, { kind: w.kind, at: Date.now() }); set.items.push(it); n++;
  });
  save(); try { refreshLex(); } catch (e) { } toast(n ? `${n}語を${set.name}に入れました` : 'もう入っています');
}

function render() {
  const el = document.getElementById('prac'); if (!el) return; const S = SET();
  let h = `<h2>れんしゅう</h2>${prModeSeg()}`;
  if (WQ.phase === 'menu') {
    const P = pool(), M = missed().length, st = store(), learned = P.filter(w => st[w.k] && st[w.k].streak >= 2).length;
    h += `<section class="wq"><h3>単語テスト</h3>
    <div class="wq-row"><span>出し方</span><div class="seg">${[['ej', '英語 → 日本語'], ['je', '日本語 → 英語']].map(([v, l]) => `<button class="${WQ.dir === v ? 'on' : ''}" data-wd="${v}">${l}</button>`).join('')}</div></div>
    <div class="wq-row"><span>問題の数</span><div class="seg">${[10, 20, 30, 50].map(v => `<button class="${WQ.n === v ? 'on' : ''}" data-wn="${v}">${v}問</button>`).join('')}</div></div>
    <div class="wq-row"><span>単語のレベル</span><div class="seg">${LV_OPTS.map(([v, l]) => `<button class="${(S.level || 2) === v ? 'on' : ''}" data-wl="${v}">${l}</button>`).join('')}</div></div>
    <p class="note">このレベルの単語：${P.length}語（覚えた ${learned}語）。設定の「単語のレベル」と同じです。</p>
    <button class="wide" id="wqGo">スタート ▶</button>
    <button class="wide wq-sub" id="wqMiss" ${M ? '' : 'disabled'}>まちがえた語だけ（${M}語）</button></section>`;
  } else if (WQ.phase === 'q') {
    const q = WQ.list[WQ.i], w = q.w, done = WQ.pick >= 0, ej = WQ.dir === 'ej';
    h += `<section class="prq wq"><div class="wq-top"><span>${WQ.i + 1} / ${WQ.list.length}</span><small>${KIND_JA[w.kind] || ''}</small><button class="chip" id="wqQuit">やめる</button></div>
    <div class="wq-q ${ej ? 'en' : ''}">${esc(ej ? w.en : w.ja)}</div>
    <button class="chip" id="wqSay">🔊 もう一度きく</button>
    <div class="wq-opts">${q.opts.map((o, j) => { const cls = done ? (o === w ? 'ok' : j === WQ.pick ? 'ng' : '') : ''; return `<button class="wq-o ${ej ? '' : 'en'} ${cls}" data-wo="${j}">${esc(ej ? o.ja : o.en)}</button>`; }).join('')}</div>
    ${done ? `<div class="prres ${WQ.res[WQ.res.length - 1].ok ? 'ok' : 'ng'}">${WQ.res[WQ.res.length - 1].ok ? '⭕' : '❌'} <b class="en">${esc(w.en)}</b> ＝ ${esc(w.ja)}</div><button class="wide" id="wqNext">${WQ.i + 1 >= WQ.list.length ? '結果を見る ▶' : 'つぎへ ▶'}</button>` : ''}</section>`;
  } else {
    const ok = WQ.res.filter(r => r.ok).length, ng = WQ.res.filter(r => !r.ok);
    h += `<section class="wq"><h3>結果</h3><div class="wq-score">${ok} / ${WQ.res.length}</div>`;
    if (ng.length) {
      h += `<p class="note">まちがえた語：チェックした語をマイセットに入れられます。</p>
      <div class="wq-acts"><button class="chip" data-wa="1">全部チェック</button><button class="chip" data-wa="0">全部はずす</button></div>
      <div class="wq-list">${ng.map(r => `<label class="wq-it"><input type="checkbox" data-wc="${esc(r.w.k)}" ${WQ.chk[r.w.k] ? 'checked' : ''}><b class="en">${esc(r.w.en)}</b><span>${esc(r.w.ja)}</span><button class="chip" data-ws="${esc(r.w.en)}">🔊</button></label>`).join('')}</div>
      <button class="wide" id="wqAdd">チェックした語をマイセットに入れる</button>
      <button class="wide wq-sub" id="wqRetry">まちがえた語だけもう一度</button>`;
    } else h += `<p class="note">全問正解です。</p>`;
    h += `<button class="wide wq-sub" id="wqAgain">もう一度（同じ条件で）</button><button class="wide wq-sub" id="wqMenu">はじめの画面へ</button></section>`;
  }
  el.innerHTML = h; bind(el);
}
function bind(el) {
  const on = (s, f) => { const b = el.querySelector(s); if (b) b.onclick = f; };
  el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { PR.mode = b.dataset.m; PR.cur = null; prNew(); });
  el.querySelectorAll('[data-wd]').forEach(b => b.onclick = () => { WQ.dir = b.dataset.wd; render(); });
  el.querySelectorAll('[data-wn]').forEach(b => b.onclick = () => { WQ.n = +b.dataset.wn; render(); });
  el.querySelectorAll('[data-wl]').forEach(b => b.onclick = () => { SET().level = +b.dataset.wl; save(); POOL = null; render(); });
  el.querySelectorAll('[data-wo]').forEach(b => b.onclick = () => answer(+b.dataset.wo));
  el.querySelectorAll('[data-wc]').forEach(b => b.onchange = () => { WQ.chk[b.dataset.wc] = b.checked; });
  el.querySelectorAll('[data-wa]').forEach(b => b.onclick = () => { WQ.res.forEach(r => { if (!r.ok) WQ.chk[r.w.k] = b.dataset.wa === '1'; }); render(); });
  el.querySelectorAll('[data-ws]').forEach(b => b.onclick = e => { e.preventDefault(); say(b.dataset.ws); });
  on('#wqGo', () => start(false)); on('#wqMiss', () => start(true)); on('#wqRetry', () => start(true));
  on('#wqAgain', () => start(WQ.only)); on('#wqMenu', () => { WQ.phase = 'menu'; render(); });
  on('#wqNext', next); on('#wqAdd', addChecked);
  on('#wqQuit', () => { WQ.phase = WQ.res.length ? 'end' : 'menu'; render(); });
  on('#wqSay', () => { const q = WQ.list[WQ.i]; if (WQ.dir === 'ej' || WQ.pick >= 0) say(q.w.en); else sayJa(q.w.ja); });
}
export function wqRender() { render(); }
