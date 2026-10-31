// 通常のアプリからは呼ばない。保存領域を持たない物語用フレームの中だけで使用。
import { APP, pick, render } from './play.js';
import { ENV } from './env.js';

export function startEpisodePractice({ finish }) {
  // 文を用意するところだけ自動化し、その後は通常の文・絵・選択肢をそのまま操作する。
  pick('subj', 'p:i');
  pick('modal', 'want');
  pick('self', 'play');
  APP.finished = true;
  render();
  const panel = document.createElement('section'); panel.setAttribute('aria-label', 'そらの案内');
  panel.style.cssText = 'position:absolute;inset:0 0 auto;z-index:500;background:#fffaf2;padding:10px 14px;border-bottom:2px solid #d7c8e0;color:#4b3e58;font:14px/1.6 sans-serif;box-sizing:border-box';
  const app = ENV.root;
  const holder = document.createElement('div'); holder.style.cssText = 'height:calc(100% - 150px);position:relative;top:150px';
  while (app.firstChild) holder.appendChild(app.firstChild);
  const heading = document.createElement('b'); heading.textContent = '英語脳アプリで遊ぼう'; heading.style.cssText = 'display:block;padding-right:110px;min-height:34px';
  const guide = document.createElement('div'); guide.textContent = '文の I を押すと主役を、play を押すと「したいこと」を替えられるよ。いつもと同じ操作で、文と絵の変化を試そう。';
  const back = document.createElement('button'); back.type = 'button'; back.textContent = '物語にもどる';
  back.style.cssText = 'font:inherit;min-height:44px;border:0;border-radius:10px;padding:8px 14px;background:#786184;color:#fff;margin-top:6px;cursor:pointer';
  panel.append(heading, guide, back); app.append(holder, panel);
  const resize = () => { const h = panel.offsetHeight; holder.style.top = h + 'px'; holder.style.height = 'calc(100% - ' + h + 'px)'; };
  const ro = new ResizeObserver(resize); ro.observe(panel); resize();
  back.onclick = () => { ro.disconnect(); finish(); };
}
