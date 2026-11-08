/* 共通の設定：音量・読み上げ。全部のゲームが同じ設定を使う。変わったら知らせる（onChange）。 */
import { createStore } from './store.js';
const DEFAULTS = { bgm: 0.5, sfx: 0.8, voice: true, rate: 1 };
/* theme：'cute'（かわいい）／'chic'（シック）。アプリごとの標準は series.config.mjs の theme（街＝かわいい、単体＝シック）。選んだものは覚える */
export function createSettings(defaultTheme) {
  const st = createStore('core');
  const v = Object.assign({}, DEFAULTS, { theme: defaultTheme || 'chic' }, st.get('settings') || {});
  const apply = () => { try { document.documentElement.dataset.theme = v.theme; if (v.theme === 'cute' && !document.getElementById('cs-cutefont')) { const l = document.createElement('link'); l.id = 'cs-cutefont'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&family=Zen+Maru+Gothic:wght@500;700;900&display=swap'; document.head.appendChild(l); } } catch (e) { } };
  apply();
  const subs = new Set();
  return {
    get: (k) => v[k],
    all: () => Object.assign({}, v),
    set(k, val) { v[k] = val; st.set('settings', v); if (k === 'theme') apply(); subs.forEach(f => { try { f(k, val, v); } catch (e) { } }); },
    onChange(f) { subs.add(f); return () => subs.delete(f); }
  };
}
