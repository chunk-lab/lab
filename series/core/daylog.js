/* 1日の記録:何に何分つかったか(勉強 / 遊び=テレビゲーム・季節のスポーツ / 街でまったり)と、その日に出会った単語・文。
   端末の中だけに保存する。1日の区切りは午前4時。2分操作がなかった時間は数えない(放置・ほったらかし)。
   - 時間は「いま何をしているか」を層(layer)で持つ:chat(英語のおしゃべり)> sub(ゲーム機の中の1本)> app(開いているアプリ)> base(3Dの町を歩いている)
   - 単語・文は addWord で入れる。ふりかえり(review.js)がこの記録を読んで、一覧・フラッシュカードにする
   - 復習のキュー(queue):「覚えていない」ものが残る。20個たまるか、3日たつと強制復習 */
import { createStore } from './store.js';

export const DAY_START_H = 4, IDLE_SEC = 120, FORCE_N = 20, FORCE_DAYS = 3;
// 時間のカテゴリー(勉強・遊びの2つ+街でまったり。遊びの中がテレビゲームと季節のスポーツ)
export const CATS = {
  study: { n: '勉強', top: 'study', col: '#5aa8f0' },
  tv: { n: 'テレビゲーム', top: 'play', col: '#ff7aa2' },
  sport: { n: '季節のスポーツ', top: 'play', col: '#f5b83d' },
  relax: { n: '街でまったり', top: 'relax', col: '#8fe0b0' },
};
export const TOPS = { study: { n: '勉強', col: '#5aa8f0' }, play: { n: '遊び', col: '#ff7aa2' }, relax: { n: '街でまったり', col: '#8fe0b0' } };
// 3Dの町のアプリ → カテゴリーと名前(英語に関係あるものは「勉強」)
export const TOWN_APPS = {
  album: ['relax', '写真アルバム'], board: ['relax', '掲示板'], chunkcards: ['study', 'チャンク・カード'], fishing: ['sport', '釣り'], gamebox: ['tv', 'ゲーム機'], amuse: ['tv', 'アミューズメントセンター'],
  hana: ['relax', 'はなちゃん'], npc: ['relax', '住人と話す'], home: ['relax', 'おうち'], library: ['study', '図書館'], omikuji: ['relax', 'おみくじ'],
  punichunk: ['study', 'ぷにチャンク'], school: ['study', '学校'], shop: ['relax', 'ショップ'], snowfight: ['sport', '雪合戦'],
};
export const catOfApp = id => { const t = TOWN_APPS[id]; return t ? { cat: t[0], label: t[1] } : { cat: 'relax', label: String(id || '') }; };

export const dayKey = (d = new Date()) => { const z = new Date(d.getTime() - DAY_START_H * 36e5); return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, '0')}-${String(z.getDate()).padStart(2, '0')}`; };
const dayNum = k => Math.round(Date.parse(k + 'T00:00:00Z') / 864e5);

// ただのチャンク(チャンクのゲームで出会った2語以上の言い回し)は、フラッシュカード・テストには出さない。表現(kind:'expr')・単語・文は別
export const isChunk = w => !!w && (w.kind === 'chunk' || (w.kind === 'word' && /\s/.test(String(w.en).trim()) && /chunk|チャンク/i.test(String(w.src || ''))));
export function createDayLog(core) {
  const st = createStore('core');
  const S = Object.assign({ days: {}, total: {}, queue: [], known: {}, graceAt: null, lastEnter: null, lastTest: null }, st.get('daylog') || {});
  const L = { chat: null, sub: null, app: null, base: null };
  let lastTouch = Date.now(), tickN = 0, dirty = false;
  const subs = new Set();
  const dayOf = (k = dayKey()) => (S.days[k] = S.days[k] || { t: {}, words: {}, rev: null, pts: {} });
  function save() { dirty = false; const ks = Object.keys(S.days).sort(); while (ks.length > 120) delete S.days[ks.shift()]; st.set('daylog', S); subs.forEach(f => { try { f(); } catch (e) { } }); }
  const cur = () => L.chat || L.sub || L.app || L.base;

  ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'].forEach(ev => document.addEventListener(ev, () => { lastTouch = Date.now(); }, { passive: true, capture: true }));
  const timer = setInterval(() => {
    const c = cur(); if (!c || document.visibilityState !== 'visible' || Date.now() - lastTouch > IDLE_SEC * 1000) return;
    const k = c.cat + '/' + c.label, d = dayOf(); d.t[k] = (d.t[k] || 0) + 1; S.total[k] = (S.total[k] || 0) + 1; dirty = true;
    if (++tickN % 10 === 0) save();
  }, 1000);
  const flush = () => { if (dirty) save(); };
  window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  // いま何をしているか。layer='app'|'sub'|'chat'|'base'、v={cat,label} か null
  const api = {
    act(layer, v) { if (layer in L) L[layer] = v && v.cat ? { cat: v.cat, label: String(v.label || v.cat) } : null; },
    current: () => cur(),
    // ---- 時間のまとめ ----
    summary(k = dayKey()) {
      const d = S.days[k] || { t: {} }, items = [], by = { study: 0, tv: 0, sport: 0, relax: 0 };
      for (const [key, s] of Object.entries(d.t)) { const i = key.indexOf('/'), cat = key.slice(0, i); if (!(cat in by)) continue; by[cat] += s; items.push({ cat, label: key.slice(i + 1), sec: s }); }
      items.sort((a, b) => b.sec - a.sec);
      return { day: k, by, study: by.study, play: by.tv + by.sport, relax: by.relax, total: by.study + by.tv + by.sport + by.relax, items };
    },
    totalSummary() { const items = [], by = { study: 0, tv: 0, sport: 0, relax: 0 }; for (const [key, s] of Object.entries(S.total)) { const i = key.indexOf('/'), cat = key.slice(0, i); if (!(cat in by)) continue; by[cat] += s; items.push({ cat, label: key.slice(i + 1), sec: s }); } items.sort((a, b) => b.sec - a.sec); return { by, items, days: Object.keys(S.days).length }; },
    // ---- 単語・文(その日に出会ったもの) ----
    // d: {en, ja(すべての意味), pos, kind:'word'|'sentence', src, miss:true/false, multi:意味の数, slow:true}
    addWord(d) {
      if (!d || !d.en) return; const day = dayOf(), key = String(d.en).toLowerCase().trim(), w = day.words[key] || (day.words[key] = { en: d.en, ja: '', pos: '', kind: d.kind || 'word', src: '', miss: false, multi: 0, slow: false, n: 0 });
      w.n++; if (d.ja) w.ja = d.ja; if (d.pos) w.pos = d.pos; if (d.src) w.src = d.src; if (d.miss) w.miss = true; if (d.slow) w.slow = true; w.multi = Math.max(w.multi || 0, d.multi || 0); dirty = true;
      if (d.slow && !S.queue.some(q => q.en.toLowerCase() === key)) S.queue.push({ ...w, added: dayKey(), unk: 1, slow: true });   // 10秒以上なやんだ言葉は、あとの復習に入れる
    },
    words(k = dayKey()) { return Object.values((S.days[k] || { words: {} }).words); },
    wordCount: (k = dayKey()) => Object.keys((S.days[k] || { words: {} }).words).length,
    // ---- ふりかえり(復習) ----
    // 前回までに残っているもの:覚えていないキュー+ふりかえりをしなかった日の単語。新しい順
    pending() {
      const today = dayKey(), out = new Map();
      S.queue.forEach(w => out.set(w.en.toLowerCase(), w));
      for (const k of Object.keys(S.days).sort()) { if (k >= today) continue; const d = S.days[k]; if (d.rev || d.carried) continue; Object.values(d.words).forEach(w => { const key = w.en.toLowerCase(); if (!out.has(key)) out.set(key, { ...w, day: k, unk: 0 }); }); }
      return [...out.values()].filter(w => w.kind !== 'sentence' && !isChunk(w));
    },
    // 前回(きのう)のふりかえりを忘れていたか(単語があったのに「今日はここまで」を押していない)
    forgotten() {
      const today = dayKey(); const ks = Object.keys(S.days).filter(k => k < today).sort(); const last = ks[ks.length - 1]; if (!last) return null;
      const d = S.days[last]; return !d.rev && Object.keys(d.words).length ? last : null;
    },
    forced() { const q = api.pending(); if (!q.length) return false; if (q.length >= FORCE_N) return true; const old = q.reduce((m, w) => Math.min(m, dayNum(w.added || w.day || dayKey())), 1e9); return dayNum(dayKey()) - old >= FORCE_DAYS; },
    // 復習の結果をしまう:known=覚えている → キューから外す / 覚えていない → キューに残す
    finishReview(k, results) {
      const d = dayOf(k); const q = new Map(S.queue.map(w => [w.en.toLowerCase(), w]));
      S.known = S.known || {};
      for (const r of results) { const key = r.en.toLowerCase(); if (r.known) { q.delete(key); S.known[key] = 1; } else { delete S.known[key]; const o = q.get(key) || { ...r.item, added: k, unk: 0 }; o.unk = (o.unk || 0) + 1; delete o.known; q.set(key, o); } }
      S.queue = [...q.values()].slice(-300);
      Object.keys(S.days).forEach(x => { if (x < dayKey()) S.days[x].carried = true; });   // 前の日の分は、いまのキューに入ったので二重に出さない
      d.rev = { at: Date.now(), n: results.length, known: results.filter(r => r.known).length }; save();
    },
    reviewed: (k = dayKey()) => !!(S.days[k] && S.days[k].rev),
    // ---- ポイント・「1日のいろいろ」のしるし(日ごと) ----
    flag(name, v = true, k = dayKey()) { const d = dayOf(k); if (d.pts[name] === v) return; d.pts[name] = v; save(); },
    flagged: (name, k = dayKey()) => !!(S.days[k] && S.days[k].pts[name]),
    flags: (k = dayKey()) => ({ ...((S.days[k] || {}).pts || {}) }),
    enqueue(list) { const q = new Map(S.queue.map(w => [w.en.toLowerCase(), w])); S.known = S.known || {}; list.forEach(w => { const k = w.en.toLowerCase(); delete S.known[k]; const o = q.get(k) || { ...w, added: dayKey(), unk: 0 }; o.unk = (o.unk || 0) + 1; q.set(k, o); }); S.queue = [...q.values()].slice(-300); save(); },
    lastTest: () => S.lastTest, setTest(k) { S.lastTest = k; save(); },
    // 今までに出会った言葉(意味つき)すべて。定期の単語テストの出題もと
    knownKeys: () => Object.keys(S.known || {}),   // フラッシュカードで「覚えてる」にした言葉(テストには出さない)
    pool() { const m = new Map(); Object.values(S.days).forEach(d => Object.values(d.words).forEach(w => { if (w.ja && w.kind !== 'sentence' && !isChunk(w)) m.set(w.en.toLowerCase(), w); })); S.queue.forEach(w => { if (w.ja && w.kind !== 'sentence' && !isChunk(w)) m.set(w.en.toLowerCase(), w); }); return [...m.values()].filter(w => !(S.known || {})[w.en.toLowerCase()]); },
    graceAt: () => S.graceAt, setGrace(k) { S.graceAt = k; save(); },
    lastEnter: () => S.lastEnter, setEnter(k) { S.lastEnter = k; save(); },
    prevDay() { const ks = Object.keys(S.days).filter(k => k < dayKey()).sort(); return ks[ks.length - 1] || null; },
    onChange(f) { subs.add(f); return () => subs.delete(f); },
    save, dayKey, destroy() { clearInterval(timer); },
  };
  // 2Dの勉強ゲームの「まちがえた言葉」「登録した言葉」も、その日の記録に入れる
  core.events.on((game, name, d = {}) => {
    if (name === 'done' && Array.isArray(d.missed)) d.missed.slice(0, 50).forEach(x => api.addWord({ en: x.en, ja: x.ja, src: x.src || game, miss: true }));
    else if (name === 'word' && d.en) api.addWord({ en: d.en, ja: d.ja || '', src: d.src || game, kind: d.kind === 'quote' || d.kind === 'sentence' || d.kind === 'short' ? 'sentence' : d.kind === 'expr' ? 'expr' : 'word' });
  });
  return api;
}
