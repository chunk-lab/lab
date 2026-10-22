/* 共通のコイン：2Dの地図でも3Dの町でも、同じ財布を使う。
   ゲーム側は ctx.core.wallet.add(n, '理由') で増減するだけ（もらえる数・値段は、2人で決めてから入れる）。
   いまは端末の中だけ。あとでサーバー（Supabase）とつなぐときは、この中だけを直す。 */
import { createStore } from './store.js';
export function createWallet() {
  const st = createStore('core'), subs = new Set();
  let coins = st.get('coins');
  if (coins == null) {   // 3Dの町で先に貯めた分があれば引き継ぐ
    let old = null; try { old = JSON.parse(localStorage.getItem('town:coins')); } catch (e) { }
    coins = Number.isFinite(old) ? old : 50; st.set('coins', coins);
  }
  const fire = (delta, reason) => subs.forEach(f => { try { f({ coins, delta, reason }); } catch (e) { } });
  return {
    get: () => coins,
    add(n, reason = '') {   // 1回で増やせるのは500まで。持っている分より減らすことはできない
      n = Math.round(n); if (!Number.isFinite(n) || n === 0) return coins;
      n = Math.max(-coins, Math.min(500, n)); coins += n; st.set('coins', coins); fire(n, reason); return coins;
    },
    set(n, reason = 'set') { n = Math.max(0, Math.min(999999, Math.round(+n) || 0)); const d = n - coins; coins = n; st.set('coins', coins); fire(d, reason); return coins; },   // テスト用
    onChange(f) { subs.add(f); return () => subs.delete(f); },
  };
}
