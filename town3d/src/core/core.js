// 町全体で共有する小さな部品:イベント・保存・お財布・乱数
export function createBus() {
  const map = new Map();
  return {
    on(name, fn) {
      if (!map.has(name)) map.set(name, new Set());
      map.get(name).add(fn);
      return () => map.get(name).delete(fn);
    },
    emit(name, data) {
      for (const key of [name, '*']) {
        const set = map.get(key);
        if (!set) continue;
        for (const fn of set) {
          try { key === '*' ? fn(name, data) : fn(data); } catch (e) { console.error(e); }
        }
      }
    },
    clear() { map.clear(); },
  };
}

// 保存アダプタ(既定は localStorage)。scope() でアプリごとに名前空間を分ける
// コイン・ダイヤの表示用:1万以上は「1.2万」、10万以上は「10万↑」
export function fmtN(n) { return (Math.floor(+n) || 0).toLocaleString('ja-JP'); }   // 丸めずに、全部の桁を出す(内部の数と表示をずらさない)

export function createStorage(prefix = 'town:', backend = null) {
  const ls = backend || {
    getItem: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    setItem: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
    removeItem: k => { try { localStorage.removeItem(k); } catch (e) {} },
  };
  return {
    get(k) { const v = ls.getItem(prefix + k); if (v == null) return null; try { return JSON.parse(v); } catch (e) { return null; } },
    set(k, v) { ls.setItem(prefix + k, JSON.stringify(v)); },
    remove(k) { ls.removeItem(prefix + k); },
    scope(sub) { return createStorage(prefix + sub + ':', ls); },
  };
}

// 町の共通通貨。どのアプリからも ctx.wallet で増減できる
export function createWallet(storage, bus) {
  let coins = storage.get('coins') ?? 50;
  return {
    get: () => coins,
    add(n, reason = '') {   // 増やす量に上限はない。持っている分より減らすことはできない
      n = Math.round(n);
      if (!Number.isFinite(n) || n === 0) return coins;
      n = Math.max(-coins, n);
      coins += n;
      storage.set('coins', coins);
      bus.emit('wallet', { coins, delta: n, reason });
      return coins;
    },
    give(n, reason = '') { const b = coins; this.add(n, reason); return coins - b; },
    spend(n, reason = '') {   // 足りなければ何も減らさず false
      n = Math.round(n); if (!Number.isFinite(n) || n < 0 || coins < n) return false;
      if (n > 0) { coins -= n; storage.set('coins', coins); bus.emit('wallet', { coins, delta: -n, reason }); } return true;
    },
  };
}

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function angleLerp(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
