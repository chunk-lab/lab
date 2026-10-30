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
  let boost = () => 1;   // もらえるコインの倍率(有料会員は member が差し込む)。運営・テスト・月替わりの増減には掛けない
  return {
    setBoost(f) { boost = f; },
    get: () => coins,
    // 増減。増やす量に上限はない。持っている分より減らすことはできない(0で止まる)。
    // ※会員の倍率が掛かるので、増えた量は give() の戻り値(または前後の差)で知ること
    add(n, reason = '') {
      n = Math.round(n); if (!Number.isFinite(n) || n === 0) return coins;
      if (n > 0 && !/^(admin|test|month|refund)/.test(reason)) n = Math.round(n * boost());
      n = Math.max(-coins, n); coins += n; st.set('coins', coins); fire(n, reason); return coins;
    },
    give(n, reason = '') { const b = coins; this.add(n, reason); return coins - b; },   // 増えた量(倍率のあと)を返す
    spend(n, reason = '') {   // 払う。足りなければ何も減らさず false(買い物はこれを使う)
      n = Math.round(n); if (!Number.isFinite(n) || n < 0 || coins < n) return false;
      if (n > 0) { coins -= n; st.set('coins', coins); fire(-n, reason); } return true;
    },
    set(n, reason = 'set') { n = Math.max(0, Math.min(999999, Math.round(+n) || 0)); const d = n - coins; coins = n; st.set('coins', coins); fire(d, reason); return coins; },   // テスト用
    onChange(f) { subs.add(f); return () => subs.delete(f); },
  };
}
