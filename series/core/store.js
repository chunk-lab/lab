/* セーブ：アプリ（ゲーム）ごとに保存場所を分ける。いまは端末の中だけ。
   あとでサーバー（Supabase）と同期するときは、この中だけを直す（ゲーム側はそのまま）。
   キーは "cs:<場所>:<キー>"。値はJSONにできるもの。 */
const PREFIX = 'cs:';
export function createStore(space) {
  const p = PREFIX + space + ':';
  return {
    get(k) { try { const v = localStorage.getItem(p + k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(p + k, JSON.stringify(v)); } catch (e) { } },
    remove(k) { try { localStorage.removeItem(p + k); } catch (e) { } },
    keys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(p)) out.push(k.slice(p.length)); } } catch (e) { } return out; }
  };
}
