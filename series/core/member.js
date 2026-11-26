/* 会員：無料/有料、ダイヤ、コインのもらい方の上限、共有の教材の枠、有料アバターの枠、AIの回数、実力テストの回数。
   数字は economy.js。いまは端末の中だけ（有料かどうか・ダイヤは運営画面で切りかえて試す）。
   Supabase（アカウント）と RevenueCat（課金）につなぐときは、この中の保存先と plan / gems の出どころだけを直す。 */
import { createStore } from './store.js';
import { ECON } from './economy.js';
const pad = n => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const weekKey = (d = new Date()) => { const t = new Date(d); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return dayKey(t); };   // 月曜はじまり
export function createMember(wallet, ui) {
  const st = createStore('core'), subs = new Set();
  const M = Object.assign({ plan: 'free', gems: ECON.start.gems, month: monthKey(), slots: [], swaps: [], avatar: { month: '', id: '' }, owned: [], ai: { month: '', n: 0 }, day: { k: '', task: 0, cm: 0, game: 0 }, tests: [], extraTests: 0 }, st.get('member') || {});
  const save = () => { st.set('member', M); subs.forEach(f => { try { f(); } catch (e) { } }); };
  const isPaid = () => M.plan === 'paid';
  const cap = () => ECON.coinCap[isPaid() ? 'paid' : 'free'];
  // 月が変わったら：上限を超えたコインだけ消す
  function tick() {
    const mk = monthKey();
    if (M.month !== mk) {
      const c = wallet.get(), lim = cap();
      if (c > lim) { wallet.set(lim, 'month'); ui && ui.toast && setTimeout(() => ui.toast(`月が変わったので、上限(${lim})を超えたコイン ${c - lim} 枚が消えました`), 800); }
      M.month = mk;
      if (!isPaid() && M.slots.length > ECON.slots.free) M.slots = M.slots.slice(0, ECON.slots.free);
      save();
    }
    if (M.day.k !== dayKey()) { M.day = { k: dayKey(), task: 0, cm: 0, game: 0, pt: {} }; save(); }
  }
  try { window.addEventListener('storage', e => { if (e.key !== 'cs:core:member' || !e.newValue) return; try { Object.assign(M, JSON.parse(e.newValue)); subs.forEach(f => { try { f(); } catch (x) { } }); } catch (x) { } }); } catch (e) { }   // 別のタブの変更に合わせる
  tick();
  wallet.setBoost && wallet.setBoost(() => (isPaid() ? ECON.paidCoinMult : 1));
  const api = {
    get plan() { return M.plan; },
    isPaid,
    coinPreview: n => Math.round(n * (isPaid() ? ECON.paidCoinMult : 1)),   // 「コイン +N」と予告するときは、これを通した数(会員の倍率のあと)を出す
    coinCap: cap,
    coinCapText: () => (isFinite(cap()) ? String(cap()) : 'なし'),
    setPlan(p) {   // 運営画面・課金から。やめたとき：枠は本人が選んだ1つ(選ばなければ最後に入れたもの)を残す
      if (!['free', 'paid'].includes(p) || p === M.plan) return;
      M.plan = p;
      if (p === 'free' && M.slots.length > ECON.slots.free) { const keep = M.slots.find(s => s.keep) || M.slots[M.slots.length - 1]; M.slots = [keep]; }
      save();
    },
    // ---- ダイヤ ----
    gems: () => M.gems,
    addGems(n, why) { n = Math.floor(+n); if (!(n > 0)) return false; M.gems += n; save(); return true; },
    spendGems(n, why) { n = Math.floor(+n); if (!(n > 0) || M.gems < n) return false; M.gems -= n; save(); return true; },
    // ---- コインのもらい方（1日の上限つき） ----
    // kind：'task'（今日の課題）/ 'cm'（CM）/ 'game'（ゲームの点数。n は希望の枚数）/ 'once'（レッスンの初回クリアなど一度きり）
    earn(kind, n) {
      tick(); let g = 0; const D = ECON.daily;
      if (kind === 'task') { if (!M.day.task) { g = D.task; M.day.task = 1; } }
      else if (D.pt[kind]) { M.day.pt = M.day.pt || {}; if (!M.day.pt[kind]) { g = D.pt[kind]; M.day.pt[kind] = 1; } }
      else if (kind === 'cm') { if (M.day.cm < D.cm.max) { g = D.cm.each; M.day.cm++; } }
      else if (kind === 'game') { g = Math.max(0, Math.min(Math.floor(+n || 0), D.game - M.day.game)); M.day.game += g; }
      else if (kind === 'once') g = Math.max(0, Math.floor(+n || 0));
      if (g > 0) { const before = wallet.get(); wallet.add(g, 'earn:' + kind); g = wallet.get() - before; save(); }
      return g;
    },
    today: () => ({ ...M.day, pt: { ...(M.day.pt || {}) }, gameLeft: ECON.daily.game - M.day.game, cmLeft: ECON.daily.cm.max - M.day.cm }),
    // ---- 共有の教材の枠 ----
    slots: () => M.slots.slice(),
    slotMax: () => ECON.slots[isPaid() ? 'paid' : 'free'],
    hasSlot: id => M.slots.some(s => s.id === id),
    // 枠に入れる。空きがなければ out（外すもの）を指定。無料会員の入れ替えはコインかダイヤ（pay:'coins'|'gems'）
    slotIn(item, { out, pay } = {}) {
      tick(); if (api.hasSlot(item.id)) return { ok: true };
      const max = api.slotMax(), full = M.slots.length >= max;
      if (full && !out) return { ok: false, why: 'full' };
      if (full && !isPaid()) {
        const price = ECON.swap.free;
        if (pay === 'gems') { if (!api.spendGems(price.gems)) return { ok: false, why: 'gems' }; }
        else { if (!wallet.spend(price.coins, 'buy:swap')) return { ok: false, why: 'coins' }; }
        M.swaps.push({ at: Date.now(), pay: pay || 'coins' });
      }
      if (full) M.slots = M.slots.filter(s => s.id !== out);
      M.slots.push({ id: item.id, title: item.title || '', kind: item.kind || 'long', at: Date.now() });
      save(); return { ok: true };
    },
    slotKeep(id) { M.slots.forEach(s => s.keep = s.id === id); save(); },
    slotOut(id) { M.slots = M.slots.filter(s => s.id !== id); save(); },   // 外すだけ(有料会員の入れ替え用)。無料会員は入れ替えでしか外さない
    // ---- ダイヤで買って、ずっと持つもの（ダイヤ教材・有料アバター） ----
    owns: id => M.owned.includes(id),
    buy(id, gems) { if (M.owned.includes(id)) return true; if (!api.spendGems(gems)) return false; M.owned.push(id); save(); return true; },
    // ---- 有料アバターの枠：有料会員は月に1回、その月のアバターに変えられる ----
    avatarSlot: () => ({ ...M.avatar, canChange: isPaid() && M.avatar.month !== monthKey() }),
    setMonthlyAvatar(id) { if (!isPaid() || M.avatar.month === monthKey()) return false; M.avatar = { month: monthKey(), id }; save(); return true; },
    // ---- AI（例文・長文を作る、AIでの登録） ----
    aiLeft: () => isPaid() ? Math.max(0, ECON.ai.paidPerMonth - (M.ai.month === monthKey() ? M.ai.n : 0)) : 0,
    useAI(pay) {   // 有料会員は月の回数から。超えたら（無料会員は最初から）ダイヤ
      if (api.aiLeft() > 0) { if (M.ai.month !== monthKey()) M.ai = { month: monthKey(), n: 0 }; M.ai.n++; save(); return true; }
      return pay === 'gems' && api.spendGems(ECON.ai.gems);
    },
    // ---- 実力テスト：無料は週1回、有料は1日1回。足りなければダイヤで追加 ----
    canTest() { const k = isPaid() ? dayKey() : weekKey(); return !M.tests.some(t => t.k === k) || M.extraTests > 0; },
    nextTest() { return isPaid() ? '明日' : '来週の月曜'; },
    useTest() { const k = isPaid() ? dayKey() : weekKey(); if (M.tests.some(t => t.k === k)) { if (M.extraTests > 0) M.extraTests--; else return false; } M.tests.push({ k, at: Date.now() }); if (M.tests.length > 400) M.tests = M.tests.slice(-400); save(); return true; },
    buyTest() { if (!api.spendGems(ECON.test.extraGems)) return false; M.extraTests++; save(); return true; },
    // 運営画面のテスト用：月替わりを試す
    _forceMonth(m) { M.month = m; save(); tick(); },
    onChange(f) { subs.add(f); return () => subs.delete(f); },
    keys: { dayKey, monthKey, weekKey },
  };
  return api;
}
