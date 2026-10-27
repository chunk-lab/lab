// 釣りの「巻き取り」:アミューズメントセンターの「文の並べ替え」(gamebox/games/chunksort.js)を、そのまま使う。
//   選び方(ドラッグ/タップ)・ヒント・音声は同じ。釣り画面の下にだけ出して、巻き取りはぜんぶこれで進める。
//   1チャンク入れるたびに魚が寄ってくる(onPlace)。ぜんぶ入ったら英文が流れて、終わったら onEnd。
import chunksort from '../gamebox/games/chunksort.js';
import { createSfx as createBoxSfx } from '../gamebox/kit.js';

// → {destroy()}。parent(釣り画面のUI)の下に重ねる。opt: {n:3|4|5, fishName, icon, volume, onPlace(ok,got,total), onLearn(d), onEnd()}
export function sortReel(parent, opt) {
  const panel = document.createElement('div'); panel.className = 'fz-sort';
  panel.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:min(46%,330px);z-index:3;background:rgba(255,248,239,.95);border-radius:18px 18px 0 0;box-shadow:0 -4px 16px #0003;touch-action:none;pointer-events:auto;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 6px);box-sizing:border-box';
  const inner = document.createElement('div'); inner.style.cssText = 'position:absolute;left:0;right:0;top:4px;bottom:calc(env(safe-area-inset-bottom,0px) + 6px)';
  panel.appendChild(inner); parent.appendChild(panel);
  const tag = document.createElement('div'); tag.style.cssText = 'position:absolute;left:12px;top:-12px;z-index:1;pointer-events:none;font-weight:900;font-size:12px;color:#fff;background:#e0556b;border-radius:999px;padding:3px 10px;box-shadow:0 1px 4px #0003;white-space:nowrap';
  tag.textContent = '🎣 巻き取れ! 英語の順にならべよう'; panel.appendChild(tag);
  let done = false, game = null;
  const host = {
    box: inner, sfx: createBoxSfx(opt.volume != null ? opt.volume : 0.6), two: false,
    players: [{ name: 'あなた', cpu: null, icon: '🙂' }, { name: opt.fishName || 'さかな', cpu: null, icon: opt.icon || '🐟' }],
    opts: { to: 1, lv: opt.n <= 3 ? 1 : opt.n === 4 ? 2 : 3, board: 'few', hint: 'btn', say: 1, inline: 1 },
    onPlace: (ok, got, total) => { try { opt.onPlace && opt.onPlace(ok, got, total); } catch (e) { } if (ok && got >= total) { tag.textContent = '⭕ 巻き取り成功!'; tag.style.background = '#3aa067'; } },
    learn: d => { try { opt.onLearn && opt.onLearn(d); } catch (e) { } },
    end: () => { if (done) return; try { opt.onEnd && opt.onEnd(); } catch (e) { } },
  };
  game = chunksort.start(host);
  if (window.__fzE) window.__srGame = game;   // 確認用(debug のときだけ)
  return { destroy() { if (done) return; done = true; try { game && game.stop(); } catch (e) { } try { speechSynthesis.cancel(); } catch (e) { } panel.remove(); } };
}
