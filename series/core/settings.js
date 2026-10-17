/* 共通の設定：音量・読み上げ。全部のゲームが同じ設定を使う。変わったら知らせる（onChange）。 */
import { createStore } from './store.js';
const DEFAULTS = { bgm: 0.5, sfx: 0.8, voice: true, rate: 1 };
export function createSettings() {
  const st = createStore('core');
  const v = Object.assign({}, DEFAULTS, st.get('settings') || {});
  const subs = new Set();
  return {
    get: (k) => v[k],
    all: () => Object.assign({}, v),
    set(k, val) { v[k] = val; st.set('settings', v); subs.forEach(f => { try { f(k, val, v); } catch (e) { } }); },
    onChange(f) { subs.add(f); return () => subs.delete(f); }
  };
}
