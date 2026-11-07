/* 勉強ノート：全部のアプリの「登録した言葉」「まちがえた言葉」を1か所に集める。
   アプリ側は ctx.report('word', {kind, en, ja, src}) か、まちがえた語を done の missed で渡すだけ。
   kind：word（単語）/ phrase（熟語・表現）/ short（短文）/ quote（格言・会話）
   印 marks：miss（まちがえた）/ fav（お気に入り）/ test（テスト範囲）
   いまは端末の中だけ。サーバー（Supabase）とつなぐときは、この中だけを直す。 */
import { createStore } from './store.js';
export const KINDS = [
  { k: 'word', n: '単語' }, { k: 'phrase', n: '熟語・表現' }, { k: 'short', n: '短文' }, { k: 'quote', n: '格言・会話' },
];
export const MARKS = [{ k: 'miss', n: 'まちがえた' }, { k: 'fav', n: 'お気に入り' }, { k: 'test', n: 'テスト範囲' }];
const MAX = 10000;   // 端末の中だけ。多すぎると保存領域があふれるので1万まで
// 英語の形から種類を決める（指定がないとき）：1語＝単語、2〜4語＝熟語・表現、それより長い＝短文
export function guessKind(en) {
  const n = String(en).trim().split(/\s+/).filter(Boolean).length;
  return n <= 1 ? 'word' : n <= 4 ? 'phrase' : 'short';
}
export function createNotebook() {
  const st = createStore('core'), subs = new Set();
  let list = st.get('notebook') || [];
  const save = () => { st.set('notebook', list); subs.forEach(f => { try { f(); } catch (e) { } }); };
  const keyOf = (kind, en) => kind + '|' + String(en).trim().toLowerCase().replace(/\s+/g, ' ');
  return {
    // 足す。同じ英語がもうあれば、訳が空なら埋めて印を足すだけ（重ならない）
    add(it, quiet) {
      const en = String(it.en || '').trim().replace(/\s+/g, ' '); if (!en || !/[a-zA-Z]/.test(en)) return null;
      const kind = KINDS.some(x => x.k === it.kind) ? it.kind : guessKind(en), k = keyOf(kind, en);
      let cur = list.find(x => keyOf(x.kind, x.en) === k);
      if (cur) {
        if (!cur.ja && it.ja) cur.ja = String(it.ja).trim();
        (it.marks || []).forEach(m => { if (!cur.marks.includes(m)) cur.marks.push(m); });
        cur.n = (cur.n || 1) + 1; cur.at = Date.now();
      } else {
        cur = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kind, en, ja: String(it.ja || '').trim(), src: it.src || '', note: it.note || '', marks: (it.marks || []).slice(), n: 1, at: Date.now() };
        list.unshift(cur); if (list.length > MAX) list.length = MAX;
      }
      if (!quiet) save(); return cur;
    },
    addMany(items) { const out = items.map(it => this.add(it, true)).filter(Boolean); save(); return out; },
    list({ kind, mark } = {}) { return list.filter(x => (!kind || x.kind === kind) && (!mark || x.marks.includes(mark))); },
    count(kind) { return kind ? list.filter(x => x.kind === kind).length : list.length; },
    mark(id, m, on) { const x = list.find(y => y.id === id); if (!x) return; const has = x.marks.includes(m); if (on == null) on = !has; if (on && !has) x.marks.push(m); if (!on && has) x.marks = x.marks.filter(y => y !== m); save(); },
    edit(id, patch) { const x = list.find(y => y.id === id); if (!x) return; ['en', 'ja', 'note', 'kind'].forEach(k => { if (patch[k] != null) x[k] = String(patch[k]).trim(); }); save(); },
    remove(id) { list = list.filter(x => x.id !== id); save(); },
    // 書き出し・読み込み(機種変更など。サーバーは使わない)
    exportText() { return JSON.stringify({ app: 'chunk-notebook', v: 1, at: Date.now(), list }); },
    importText(txt) {
      let d; try { d = JSON.parse(txt); } catch (e) { return -1; }
      const arr = Array.isArray(d) ? d : d && Array.isArray(d.list) ? d.list : null; if (!arr) return -1;
      const before = list.length; arr.forEach(it => it && this.add({ en: it.en, ja: it.ja, kind: it.kind, src: it.src, note: it.note, marks: Array.isArray(it.marks) ? it.marks : [] }, true)); save();
      return list.length - before;
    },
    onChange(f) { subs.add(f); return () => subs.delete(f); },
  };
}
