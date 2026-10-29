// 金券・ダイヤ・かけら(共通の財布の仲間)。数字はぜんぶ「仮」。ここだけ直せば全体に効く。
//   金券   = コインから換金して貯める(無課金の貯金)。1枚ごとに期限(3か月)がある。古いものから使う。
//   ダイヤ = 課金通貨。期限なし。(購入の入口は未実装。dev で add できる)
//   かけら = 学習(単語を完璧にする)でもらえる。1日の上限あり。
import { createStorage } from '../core/core.js';
const st = createStorage('town:vch:');
export const VCH = {
  RATE: 1,            // コイン1枚 → 金券 1(仮)
  DAY_CAP: 100,       // 1日に換金できる金券(仮)→ 90日で最大 9000
  EXPIRE_DAYS: 90,    // 金券の期限(仮)
  FRAG_DAY: 30,       // かけらを1日にもらえる上限(仮)
  // 同じ飾りをふやす値段(レア度 N/R/SR/SSR の順)(仮)
  PRICE_V: [300, 1000, 9500, null],   // 金券。SR は 9000 を超える=無課金だけでは足りない / SSR は金券では買えない
  PRICE_F: [10, 30, 100, null],       // かけら
  PRICE_D: [5, 15, 50, 150],          // ダイヤ(どのレア度でも可。SSR はこれだけ)
};
let gems = null;
const dayN = () => Math.floor(Date.now() / 864e5);
function list() { const now = Date.now(), l = (st.get('v') || []).filter(x => x.exp > now && x.n > 0); return l; }
export const vch = {
  list,
  total() { return list().reduce((a, x) => a + x.n, 0); },
  nextExpire() { const l = list(); return l.length ? Math.min(...l.map(x => x.exp)) : 0; },
  todayLeft() { const t = st.get('xd') || { d: 0, n: 0 }; return t.d === dayN() ? Math.max(0, VCH.DAY_CAP - t.n) : VCH.DAY_CAP; },
  // コイン → 金券。wallet は共通の財布。換金できた金券の数を返す
  exchange(wallet, coins) {
    coins = Math.floor(coins); const left = this.todayLeft(), n = Math.min(coins, Math.floor(left / VCH.RATE), wallet.get());
    if (n <= 0) return 0; wallet.add(-n, 'voucher'); const g = Math.round(n * VCH.RATE);
    const t = st.get('xd') || { d: 0, n: 0 }; st.set('xd', { d: dayN(), n: (t.d === dayN() ? t.n : 0) + g });
    const l = list(); l.push({ n: g, exp: Date.now() + VCH.EXPIRE_DAYS * 864e5 }); st.set('v', l); return g;
  },
  spend(n) { if (this.total() < n) return false; const l = list().sort((a, b) => a.exp - b.exp); let r = n; for (const x of l) { const u = Math.min(x.n, r); x.n -= u; r -= u; if (!r) break; } st.set('v', l.filter(x => x.n > 0)); return true; },
  // ダイヤは組み込み先の財布(ctx.gems)があればそれを使う。なければこの端末の仮のダイヤ
  bindGems(g) { gems = g && typeof g.get === 'function' ? g : null; },
  dia() { return gems ? (gems.get() || 0) : (st.get('dia') || 0); },
  addDia(n) { if (gems) return; st.set('dia', Math.max(0, this.dia() + Math.round(n))); },
  spendDia(n) { if (this.dia() < n) return false; if (gems) return !!gems.spend(n); st.set('dia', this.dia() - n); return true; },
  frag() { return st.get('frag') || 0; },
  addFrag(n = 1) { const t = st.get('fd') || { d: 0, n: 0 }, used = t.d === dayN() ? t.n : 0, g = Math.max(0, Math.min(n, VCH.FRAG_DAY - used)); if (!g) return 0; st.set('fd', { d: dayN(), n: used + g }); st.set('frag', this.frag() + g); return g; },
  spendFrag(n) { if (this.frag() < n) return false; st.set('frag', this.frag() - n); return true; },
};
