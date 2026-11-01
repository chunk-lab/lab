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
  panel.style.cssText = 'position:absolute;inset:0 0 auto;z-index:500;background:#fffaf2;padding:12px;border-bottom:2px solid #d7c8e0;color:#4b3e58;font:18px/1.65 sans-serif;box-sizing:border-box';
  const app = ENV.root;
  const holder = document.createElement('div'); holder.style.cssText = 'height:calc(100% - 150px);position:relative;top:150px';
  while (app.firstChild) holder.appendChild(app.firstChild);
  const heading = document.createElement('b'); heading.textContent = 'そら'; heading.style.cssText = 'display:block;font-size:16px;margin-bottom:4px;color:#66507d';
  const guide = document.createElement('div'); guide.innerHTML = 'まず、文の <b>I</b> を押してね。主役を替えてみよう。';
  const back = document.createElement('button'); back.type = 'button'; back.textContent = '物語のつづきへ'; back.hidden = true;
  back.style.cssText = 'font:inherit;min-height:44px;border:0;border-radius:10px;padding:8px 14px;background:#786184;color:#fff;margin-top:6px;cursor:pointer';
  const bubble = document.createElement('div'); bubble.className = 'ep-coach-bubble'; bubble.append(heading, guide, back);
  const portrait = document.createElement('img'); portrait.alt = 'そらくん'; portrait.className = 'ep-coach-sora'; portrait.src = new URL('../chunkchunk/img/chara/boy/idea.webp', ENV.ctx.base).href;
  panel.className = 'ep-coach'; panel.append(bubble, portrait); app.append(holder, panel);
  const resize = () => { const h = panel.offsetHeight; holder.style.top = h + 'px'; holder.style.height = 'calc(100% - ' + h + 'px)'; };
  const ro = new ResizeObserver(resize); ro.observe(panel); resize();
  const style = document.createElement('style');
  style.textContent = '.ep-coach{display:flex;align-items:center;gap:12px}.ep-coach-bubble{position:relative;flex:1;min-width:0;border:2px solid #d7c8e0;border-radius:18px;background:white;padding:12px 16px}.ep-coach-bubble:after{content:"";position:absolute;right:-9px;top:40px;width:14px;height:14px;background:white;border-right:2px solid #d7c8e0;border-top:2px solid #d7c8e0;transform:rotate(45deg)}.ep-coach-sora{width:100px;height:145px;object-fit:contain;transform:scaleX(-1);flex:none}@media(max-width:500px){.ep-coach{gap:8px}.ep-coach-sora{width:76px;height:130px}.ep-coach-bubble{padding:10px 12px}} .ct-eigo .ep-tutorial-target{outline:4px solid var(--noun);outline-offset:3px;box-shadow:0 0 0 7px #2d6be022}.ct-eigo .ep-guide-aux{color:var(--aux);font-weight:800}';
  panel.append(style);
  let completed = false, sawView = false, asked = false;
  // いま何をすればいいかを、3つの手順の印と、指のマークで見せる(通常の「完成」や主役の編集は制限しない)
  const steps = document.createElement('div'); steps.className = 'ep-steps';
  const demo = document.createElement('div'); demo.className = 'ep-demo'; demo.innerHTML = '<span>I</span> want to play. <i>→</i> <span class="to">She</span> wants to play.';
  const hand = document.createElement('div'); hand.className = 'ep-hand'; hand.textContent = '👆'; hand.hidden = true;
  const verbs = ['eat', 'sing', 'run', 'swim', 'dance', 'read', 'cook'], cheers = ['おおっ、絵が変わった！', 'ほら、動きも変わったよ！', 'すごい、そのまま絵になるね！', 'もう1回いってみよう！'];
  let vi = 0, ci = 0, past = false;
  const tryRow = document.createElement('div'); tryRow.hidden = true; tryRow.className = 'ep-try';
  const mkBtn = (t, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => { fn(b); APP.finished = true; render(); guide.textContent = cheers[ci++ % cheers.length]; resize(); }; return b; };
  tryRow.append(
    mkBtn('🎲 動きをかえる', () => pick('self', verbs[vi++ % verbs.length])),
    mkBtn('⏪ 昔のことにする', b => { past = !past; pick('tense', past ? 'past' : 'pres'); b.textContent = past ? '▶ 今のことにもどす' : '⏪ 昔のことにする'; }));
  const whereText = '英語脳は、勉強部屋のゲーム「英語脳」からいつでも開けるよ。勉強ノートの「✨ 使ってみる」や、町を歩いているときの ✨ ボタンに英語を入れると、その言葉を文にして絵にしてくれる。';
  bubble.insertBefore(tryRow, back);
  bubble.insertBefore(steps, guide); bubble.insertBefore(demo, back); document.body.appendChild(hand);
  const hintStyle = document.createElement('style');
  hintStyle.textContent = '.ep-steps[hidden],.ep-try[hidden],.ep-demo[hidden]{display:none}.ep-try{display:flex;gap:6px;margin-top:6px}.ep-try button{flex:1;font:inherit;font-size:13px;font-weight:800;min-height:40px;border:2px solid #d7c8e0;border-radius:10px;padding:4px 10px;background:#fff;color:#66507d;cursor:pointer}.ep-where{margin-top:8px;font-size:13px;line-height:1.5;color:#6b5a78}.ep-steps{display:flex;gap:5px;margin:0 0 6px;flex-wrap:wrap}.ep-steps span{font-size:12px;font-weight:800;padding:2px 9px;border-radius:99px;background:#efe8f4;color:#8a7898}.ep-steps span.on{background:#7b5cff;color:#fff}.ep-steps span.done{background:#d9f2e4;color:#2f8a5a}.ep-demo{margin-top:6px;font-size:15px;color:#4b3e58}.ep-demo span{font-weight:800;color:#2d6be0}.ep-demo .to{color:#e0457b}.ep-demo i{font-style:normal;color:#9a8aa8;margin:0 4px}.ep-hand{position:fixed;z-index:2147483000;font-size:34px;line-height:1;pointer-events:none;transform:translate(-50%,0);animation:epBob .7s ease-in-out infinite alternate}@keyframes epBob{to{transform:translate(-50%,9px)}}@keyframes epPulse{50%{box-shadow:0 0 0 12px #2d6be033}}.ct-eigo .ep-tutorial-target{animation:epPulse 1s ease-in-out infinite}';
  panel.append(hintStyle);
  const setSteps = n => { steps.innerHTML = ['① 「完成」を押す', '② 主役の I を押す', '③ she を選ぶ'].map((t, i) => `<span class="${i + 1 < n ? 'done' : i + 1 === n ? 'on' : ''}">${i + 1 < n ? '✓ ' : ''}${t}</span>`).join(''); };
  const point = el => { if (!el) { hand.hidden = true; return; } try { el.scrollIntoView({ block: 'nearest' }); } catch (e) { } const r = el.getBoundingClientRect(); hand.style.left = (r.left + r.width / 2) + 'px'; hand.style.top = (r.bottom - 6) + 'px'; hand.hidden = false; };
  function updateGuide() {
    if (!completed && APP.S.main.subj === 'p:she') {
      completed = true; APP.finished = true; render();
      point(null);
      guide.innerHTML = 'おおっ、絵が女の子に変わった！ 主役を替えるだけで、文も絵も一緒に変わるよ。ほかも触ってみて。';
      steps.hidden = true; demo.hidden = true; tryRow.hidden = false;
      back.hidden = false; back.focus({ preventScroll: true });
    }
    holder.querySelectorAll('.ep-tutorial-target').forEach(el => el.classList.remove('ep-tutorial-target'));
    if (!completed) {
      const she = [...holder.querySelectorAll('#slot .slbar .slm')].find(el => el.querySelector('b')?.textContent === 'she');
      if (APP.finished) sawView = true;
      const card = !APP.finished && sawView && !she ? holder.querySelector('.slsk .ck.subject') : null; // 文の画面から骨組みに戻った状態
      const next = she || (APP.finished ? holder.querySelector('#chunks [data-cat="subj"]') : card || holder.querySelector('#sldone'));
      setSteps(she || card ? 3 - (she ? 0 : 1) : APP.finished ? 2 : 1);
      guide.textContent = she ? '光っているところの she（彼女）を押してね。' : card ? '骨組みの画面に戻ったよ。光っている「I」のカードを押して、she に替えよう。' : APP.finished ? '光っているところの「主役」を押すと、骨組みの画面に戻るよ。' : '光っている「完成」を押して、文を見てみよう。';
      next?.classList.add('ep-tutorial-target'); point(next);
    }
    resize();
  }
  const changes = new MutationObserver(updateGuide);
  changes.observe(holder, { childList: true, subtree: true });
  updateGuide();
  window.addEventListener('resize', () => { if (!completed) point(holder.querySelector('.ep-tutorial-target')); });
  back.onclick = () => { if (!completed) return; if (!asked) { asked = true; tryRow.hidden = true; guide.textContent = whereText; back.textContent = 'わかった！つづきへ'; resize(); return; } changes.disconnect(); ro.disconnect(); hand.remove(); finish(); };
}
