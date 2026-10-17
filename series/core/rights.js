/* 権利（何が使えるか）。ゲームは has('game:stream') のように聞くだけ。値段や売り方は知らない。
   いまは端末の中だけ。アプリの設定で最初から持っている権利（grants）を決める。
   あとで RevenueCat（課金）とつなぐときは、この中だけを直す。
   権利の名前：game:<ゲーム>（ゲームを使える）・sub:all（サブスク）・stage:<ゲーム>:<番号>（ステージ解放）など */
import { createStore } from './store.js';
export function createRights(grants = []) {
  const st = createStore('core');
  const owned = new Set([...(st.get('rights') || []), ...grants]);
  const subs = new Set();
  const has = (id) => owned.has(id) || (id.startsWith('game:') && owned.has('sub:all'));
  return {
    has,
    list: () => [...owned],
    grant(id) { if (owned.has(id)) return; owned.add(id); st.set('rights', [...owned].filter(x => !grants.includes(x))); subs.forEach(f => f(id)); },
    onChange(f) { subs.add(f); return () => subs.delete(f); }
  };
}
