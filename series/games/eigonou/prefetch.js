/* 英語脳アプリ(英ラボ)の先読み。町で遊んでいる間に、重いファイルをこっそり読んでおく。
   ・eigo.js / eigo.css を読むだけ（動かさない）。あとで開いたときは、端末に残っている分をすぐ使える。
   ・物語の体験は鍵つきの別枠(iframe)で動き、通常の保存場所を共有しないため、読んだ中身をそのまま渡せるよう文字で持っておく。 */
import { versioned } from '../../core/host.js';
let P = null;
export const prefetched = () => P;
export function prefetchEigo(base) {
  if (P) return P;
  try {
    fetch(base + 'eigo.css').catch(() => { });
    P = fetch(versioned(base + 'eigo.js')).then(r => r.ok ? r.text() : null).catch(() => null).then(t => { if (!t) P = null; return t; });
  } catch (e) { P = null; }
  return P;
}
