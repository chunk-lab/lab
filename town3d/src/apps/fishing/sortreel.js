// 釣りの「巻き取り」:アミューズメントセンターの「文の並べ替え」(gamebox/games/chunksort.js)を、そのまま使う。
//   選び方(ドラッグ/タップ)・ヒント・音声は同じ。釣り画面の下にだけ出して、巻き取りはぜんぶこれで進める。
//   1文ならべ終えるたびに魚が少し寄ってくる(onSentence)。n文ならべたら onEnd。
import chunksort from '../gamebox/games/chunksort.js';
import { createSfx as createBoxSfx } from '../gamebox/kit.js';

// → {destroy()}。parent(釣り画面のUI)の下に重ねる。opt: {n:3|4|5, fishName, icon, volume, onSentence(k,N), onGap(k,N), onLearn(d), onEnd()}
export function sortReel(parent, opt) {
  const panel = document.createElement('div'); panel.className = 'fz-sort';
  panel.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:min(46%,330px);z-index:3;background:rgba(255,248,239,.95);border-radius:18px 18px 0 0;box-shadow:0 -4px 16px #0003;touch-action:none;pointer-events:auto;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 6px);box-sizing:border-box';
  const inner = document.createElement('div'); inner.style.cssText = 'position:absolute;left:0;right:0;top:4px;bottom:calc(env(safe-area-inset-bottom,0px) + 6px)';
  panel.appendChild(inner); parent.appendChild(panel);
  const tag = document.createElement('div'); tag.style.cssText = 'position:absolute;left:12px;top:-12px;z-index:1;pointer-events:none;font-weight:900;font-size:12px;color:#fff;background:#e0556b;border-radius:999px;padding:3px 10px;box-shadow:0 1px 4px #0003;white-space:nowrap';
  tag.textContent = `🎣 1文ならべるたびに巻ける (0 / ${opt.n})`; panel.appendChild(tag);
  let done = false, game = null, k = 0;
  const host = {
    box: inner, sfx: createBoxSfx(opt.volume != null ? opt.volume : 0.6), two: false,
    players: [{ name: 'あなた', cpu: null, icon: '🙂' }, { name: opt.fishName || 'さかな', cpu: null, icon: opt.icon || '🐟' }],
    opts: { to: opt.n, lv: opt.n <= 3 ? 1 : opt.n === 4 ? 2 : 3, board: 'few', hint: 'btn', say: 1, inline: 1, pre: opt.pre != null ? opt.pre : 1, mode: opt.mode || 'ja' },
    learn: d => { k++; try { opt.onLearn && opt.onLearn(d); } catch (e) { } try { opt.onSentence && opt.onSentence(k, opt.n); } catch (e) { } tag.textContent = k >= opt.n ? '⭕ 巻き取り成功!' : `🎣 ${k} / ${opt.n} 文 巻いた! つぎも!`; if (k >= opt.n) tag.style.background = '#3aa067'; },
    onRevealEnd: () => { if (k < opt.n) { try { opt.onGap && opt.onGap(k, opt.n); } catch (e) { } } },
    end: () => { if (done) return; try { opt.onEnd && opt.onEnd(); } catch (e) { } },
  };
  game = chunksort.start(host);
  if (window.__fzE) window.__srGame = game;   // 確認用(debug のときだけ)
  const show = v => { panel.style.transform = v ? 'none' : 'translateY(105%)'; panel.style.pointerEvents = v ? 'auto' : 'none'; }; panel.style.transition = 'transform .25s';
  return { show, destroy() { if (done) return; done = true; try { game && game.stop(); } catch (e) { } try { speechSynthesis.cancel(); } catch (e) { } panel.remove(); } };
}
