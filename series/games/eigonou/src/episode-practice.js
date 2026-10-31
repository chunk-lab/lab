// 通常のアプリからは呼ばない。保存領域を持たない物語用フレームの中だけで使用。
import { APP, pick, render } from './play.js';
import { say } from './common.js';
import { ENV } from './env.js';

export function startEpisodePractice({ finish, exit }) {
  const panel = document.createElement('section'); panel.setAttribute('aria-label', 'そらの案内');
  panel.style.cssText = 'position:absolute;inset:0 0 auto;z-index:500;background:#fffaf2;padding:10px 14px;border-bottom:2px solid #d7c8e0;color:#4b3e58;font:700 14px/1.6 sans-serif;box-sizing:border-box';
  const app = ENV.root;
  const holder = document.createElement('div'); holder.style.cssText = 'height:calc(100% - 155px);position:relative;top:155px';
  while (app.firstChild) holder.appendChild(app.firstChild);
  app.append(holder, panel);
  const ro = new ResizeObserver(() => { const h = panel.offsetHeight; holder.style.top = h + 'px'; holder.style.height = 'calc(100% - ' + h + 'px)'; }); ro.observe(panel);
  let step = 0;
  const steps = [
    ['そら：まず「私」の I を選ぼう。', 'I（私は）', () => pick('subj', 'p:i')],
    ['そら：「〜したい」の want to を続けよう。', 'want to（〜したい）', () => pick('modal', 'want')],
    ['そら：したいことは rest。「休みたい」を作ろう。', 'rest（休む）', () => { pick('self', 'rest'); APP.finished = true; render(); say('I want to rest.'); }],
    ['はな：今度は「遊びたい」！　rest を play に替えてみよう。', 'play（遊ぶ）', () => { pick('self', 'play'); APP.finished = true; render(); say('I want to play.'); }],
  ];
  const mk = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.style.cssText = 'font:inherit;min-height:44px;border:0;border-radius:10px;padding:8px 14px;background:#786184;color:#fff;margin:5px 7px 0 0;cursor:pointer'; b.onclick = fn; return b; };
  function draw() {
    panel.replaceChildren(); const h = document.createElement('b'); h.textContent = '英語脳アプリで「〜したい」'; panel.appendChild(h);
    const p = document.createElement('div'); p.textContent = steps[step]?.[0] || 'I want to play.　遊びたい。言葉を替えて、文と絵が変わるのを確かめよう。'; panel.appendChild(p);
    if (step < steps.length) {
      // 案内中の選択は通常の pick を使う。画面の他の操作は完了後に自由に試せる。
      holder.inert = true;
      panel.appendChild(mk(steps[step][1], () => { steps[step][2](); step++; draw(); }));
    } else {
      holder.inert = false;
      panel.appendChild(mk('もう一度聞く', () => say('I want to play.')));
      panel.appendChild(mk('物語にもどる', () => { ro.disconnect(); finish(); }));
    }
    panel.appendChild(mk('体験を中断', () => { ro.disconnect(); exit(); }));
  }
  draw();
}
