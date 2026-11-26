/* 単独で開いた最初の1回だけ、アプリの「遊び方」を自動で出す。物語・レッスンなど、行き先を指定して開いたときは出さない(そちらに案内がある)。
   使い方: firstRun('アプリのid', ctx.opts, () => 遊び方を出す処理) */
import { createStore } from './store.js';
const st = createStore('core');
export function firstRun(id, opts, fn, delay = 700) {
  const o = opts || {}, direct = Object.keys(o).some(k => k !== 'face' && o[k] != null && o[k] !== false);
  if (direct || st.get('tut:' + id)) return false;
  setTimeout(() => { try { if (st.get('tut:' + id)) return; st.set('tut:' + id, 1); fn(); } catch (e) { console.error(e); } }, delay);
  return true;
}
export const tutSeen = id => !!st.get('tut:' + id);

// 初めてなら true を返して「見た」印をつける(自動で出すものを、自分で動かしたいとき用)
export function claimFirstRun(id, opts) {
  const o = opts || {}, direct = Object.keys(o).some(k => k !== 'face' && o[k] != null && o[k] !== false);
  if (direct || st.get('tut:' + id)) return false;
  st.set('tut:' + id, 1); return true;
}
