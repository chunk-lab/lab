// 通常のアプリからは呼ばない。保存領域を持たない物語用フレームの中だけで使用。
import { APP, pick, render, setLevel } from './play.js';
import { sbDraw } from './slot.js';
import { ENV } from './env.js';

export function startEpisodePractice({ finish }) {
  // 文を用意するところだけ自動化し、その後は通常の文・絵・選択肢をそのまま操作する。
  setLevel('4'); // want to を維持できる設定。保存先はこのフレームのメモリだけ。
  pick('subj', 'p:i');
  pick('modal', 'want');
  pick('self', 'play');
  APP.finished = false;
  render();
  sbDraw();
  const panel = document.createElement('section'); panel.setAttribute('aria-label', 'そらの案内');
  panel.style.cssText = 'position:absolute;inset:0 0 auto;z-index:500;background:#fffaf2;padding:10px 14px;border-bottom:2px solid #d7c8e0;color:#4b3e58;font:14px/1.6 sans-serif;box-sizing:border-box';
  const app = ENV.root;
  const holder = document.createElement('div'); holder.style.cssText = 'height:calc(100% - 150px);position:relative;top:150px';
  while (app.firstChild) holder.appendChild(app.firstChild);
  const heading = document.createElement('b'); heading.textContent = '英語脳アプリで遊ぼう'; heading.style.cssText = 'display:block;padding-right:110px;min-height:34px';
  const guide = document.createElement('div'); guide.innerHTML = 'そら：まず、文の <b>I</b> を押してね。主役を替えてみよう。';
  const back = document.createElement('button'); back.type = 'button'; back.textContent = '物語のつづきへ'; back.hidden = true;
  back.style.cssText = 'font:inherit;min-height:44px;border:0;border-radius:10px;padding:8px 14px;background:#786184;color:#fff;margin-top:6px;cursor:pointer';
  panel.append(heading, guide, back); app.append(holder, panel);
  const resize = () => { const h = panel.offsetHeight; holder.style.top = h + 'px'; holder.style.height = 'calc(100% - ' + h + 'px)'; };
  const ro = new ResizeObserver(resize); ro.observe(panel); resize();
  const style = document.createElement('style');
  style.textContent = '.ct-eigo .ep-tutorial-target{outline:4px solid var(--noun);outline-offset:3px;box-shadow:0 0 0 7px #2d6be022}.ct-eigo .ep-guide-aux{color:var(--aux);font-weight:800}';
  panel.append(style);
  let step = 0;
  function target() {
    holder.querySelectorAll('.ep-tutorial-target').forEach(el => el.classList.remove('ep-tutorial-target'));
    const next = step === 0 ? holder.querySelector('#slot .slp[data-r="S"]') : step === 1 ? [...holder.querySelectorAll('#slot .slbar .slm')].find(el => el.querySelector('b')?.textContent === 'she') : null;
    holder.querySelectorAll('button,input,[data-a]').forEach(el => { el.tabIndex = el === next ? 0 : -1; });
    next?.classList.add('ep-tutorial-target');
    next?.focus({ preventScroll: true });
  }
  holder.addEventListener('click', e => {
    const subject = e.target.closest('#slot .slp[data-r="S"]');
    const choice = e.target.closest('#slot .slbar .slm');
    const allowed = step === 0 && subject || step === 1 && choice?.querySelector('b')?.textContent === 'she';
    if (!allowed) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    queueMicrotask(() => {
      if (step === 0) {
        step = 1; guide.textContent = 'そら：出てきた主役の中から she（彼女）を選んでね。';
      } else if (APP.S.main.subj === 'p:she') {
        step = 2; APP.finished = true; render();
        guide.innerHTML = 'そら：できたね！ She <span class="ep-guide-aux">wants to</span> play.「彼女は遊びたい」になったよ。ほかにも文の要素をいろいろ替えられるから、別の機会に試してみてね。';
        back.hidden = false; back.focus({ preventScroll: true });
      }
      target(); resize();
    });
  }, true);
  target();
  back.onclick = () => { if (step !== 2) return; ro.disconnect(); finish(); };
}
