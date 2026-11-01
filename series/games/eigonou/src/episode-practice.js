// 通常のアプリからは呼ばない。保存領域を持たない物語用フレームの中だけで使用。
// そらくんの説明パネルは置かない。操作する場所を「暗い背景のくり抜き＋指マーク＋ひとこと」で重ねて示し、
// 操作したら消えて、次の場所でまた出る。できあがった絵は画面いっぱいに見せる。
import { APP, pick, render, setLevel } from './play.js';
import { sbDraw } from './slot.js';
import { ENV } from './env.js';

export function startEpisodePractice({ finish }) {
  setLevel('4'); // want to を維持できる設定。保存先はこのフレームのメモリだけ。
  pick('subj', 'p:i'); pick('modal', 'want'); pick('self', 'rest');   // 文は、できあがった状態から始める(「文を変化させて遊ぶ」が基本の流れ)
  APP.finished = true; APP.diceKey = null; render(); sbDraw();

  const app = ENV.root; if (getComputedStyle(app).position === 'static') app.style.position = 'relative';
  const q = s => app.querySelector(s);
  const sora = new URL('../chunkchunk/img/chara/boy/idea.webp', ENV.ctx.base).href;
  const css = document.createElement('style');
  css.textContent = `
.ct-eigo .ep-tutorial-target{animation:epPulse 1s ease-in-out infinite}@keyframes epPulse{50%{box-shadow:0 0 0 10px #ffd36b55}}
.ep-spot{position:absolute;z-index:2000;pointer-events:none;border-radius:16px;box-shadow:0 0 0 200vmax rgba(8,12,30,.5),0 0 0 3px #ffd36b;transition:opacity .25s}
.ep-hand{position:absolute;z-index:2001;pointer-events:none;font-size:42px;line-height:1;transform:translateX(-50%);transition:opacity .25s;animation:epBob .7s ease-in-out infinite alternate}
@keyframes epBob{to{margin-top:10px}}
.ep-cap{position:absolute;z-index:2001;pointer-events:none;left:5%;right:5%;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:#fffaf0;color:#4b3e58;font:700 16px/1.5 sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.35);transition:opacity .25s}
.ep-cap img{width:54px;height:54px;object-fit:contain;flex:none;transform:scaleX(-1)}
.ep-off{opacity:0!important}
.ep-spot.nodim{box-shadow:0 0 0 3px #ffd36b,0 0 14px 2px #ffd36b88}
.ep-cap .epgo{pointer-events:auto;flex:none;font:inherit;font-weight:800;min-height:42px;border:0;border-radius:12px;padding:4px 14px;background:#786184;color:#fff;cursor:pointer}
.ep-flash{position:absolute;inset:0;z-index:1500;pointer-events:none;background:radial-gradient(circle at 50% 35%,#fff9,#ffd36b55 40%,transparent 70%);animation:epFlash .7s ease-out forwards}@keyframes epFlash{from{opacity:1}to{opacity:0}}
.ep-done{position:absolute;z-index:2002;left:0;right:0;bottom:0;box-sizing:border-box;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));background:#fffaf0;border-top:2px solid #d7c8e0;border-radius:16px 16px 0 0;color:#4b3e58;font:700 clamp(12px,3.7vw,15px)/1.5 sans-serif;box-shadow:0 -6px 18px rgba(0,0,0,.25)}
.ep-done .row{display:flex;gap:6px;margin-top:8px}.ep-done button{flex:1;min-width:0;font:inherit;font-weight:800;min-height:42px;border:2px solid #d7c8e0;border-radius:12px;padding:4px 6px;background:#fff;color:#66507d;cursor:pointer}
.ep-done button.go{background:#786184;border-color:#786184;color:#fff}`;
  document.head.appendChild(css);
  const spot = document.createElement('div'), hand = document.createElement('div'), cap = document.createElement('div');
  spot.className = 'ep-spot'; hand.className = 'ep-hand'; cap.className = 'ep-cap';
  cap.innerHTML = `<img alt="そら" src="${sora}"><span style="flex:1"></span><button type="button" class="epgo" hidden>つづきへ</button>`;
  app.append(spot, hand, cap);
  const capText = cap.querySelector('span'), goB = cap.querySelector('.epgo');
  const hideAll = on => [spot, hand, cap].forEach(e => e.classList.toggle('ep-off', on));
  hideAll(true);

  let playing = false, sig = null, changes = 0, key = '', completed = false, vi = 0, ci = 0, past = false, timer = 0, offT = 0;
  const verbs = ['eat', 'sing', 'run', 'swim', 'dance', 'read', 'cook'], cheers = ['おおっ、絵が変わった！', 'ほら、動きも変わったよ！', 'すごい、そのまま絵になるね！', 'もう1回いってみよう！'];

  const chip = c => q(`#chunks .ck[data-cat="${c}"]`);
  const subjDone = () => APP.S.main.subj !== 'p:i';
  const predDone = () => { const c = chip('pred'); return !!c && !/^rest$/i.test(c.querySelector('.en')?.textContent || 'rest'); };
  const find = () => {
    if (!APP.finished) { APP.finished = true; render(); }   // 組み立てに戻らない。完成した文のまま、タブを押して遊ぶ
    const t = !subjDone() ? 'subj' : 'pred', c = chip(t);
    if (!c) return null;
    const dice = APP.diceKey === c.dataset.key;
    const word = t === 'subj' ? '主役（I）' : '動き（rest）';
    return { k: t + (dice ? '1' : '0'), el: c, t: dice ? `サイコロが出たよ！ もう一度押すと、${t === 'subj' ? '主役' : '動き'}がランダムに入れかわるよ。` : `上の「${t === 'subj' ? 'I' : 'rest'}」のタブを押してみよう。（${word}のタブ）` };
  };
  const place = (el, text) => {
    const ar = app.getBoundingClientRect(), r = el.getBoundingClientRect(), pad = 6;
    spot.style.cssText = `left:${r.left - ar.left - pad}px;top:${r.top - ar.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
    capText.textContent = text;
    const upper = r.top - ar.top < ar.height * 0.5, ch = cap.offsetHeight || 80;
    hand.textContent = upper ? '👆' : '👇';
    hand.style.cssText = `left:${r.left - ar.left + r.width / 2}px;top:${upper ? r.bottom - ar.top + 4 : r.top - ar.top - 54}px`;
    const capTop = upper ? r.bottom - ar.top + 58 : r.top - ar.top - 54 - ch - 6;
    cap.style.top = Math.max(6, Math.min(ar.height - ch - 6, capTop)) + 'px';
  };
  const tick = () => {
    if (completed) return;
    if (!playing && subjDone() && predDone()) { playing = true; flash(); key = ''; hideAll(true); }
    app.querySelectorAll('.ep-tutorial-target').forEach(e => e.classList.remove('ep-tutorial-target'));
    const f = playing ? findPlay() : find();
    if (!f) { hideAll(true); return; }
    if (!f.noPulse) f.el.classList.add('ep-tutorial-target');
    spot.classList.toggle('nodim', !!f.nodim); goB.hidden = !f.go;
    if (f.k !== key) {   // 操作が済んで次の場所へ:いったん消して、少し待ってからまた重ねる
      key = f.k; hideAll(true); clearTimeout(offT);
      offT = setTimeout(() => { if (!completed) { place(f.el, f.t); hideAll(false); } }, 450);
    } else if (!spot.classList.contains('ep-off')) place(f.el, f.t);
  };
  timer = setInterval(tick, 150);

  // 絵がそろったら:「＋ 文を変化させてあそぶ」を押させ、開いたバーを動かして、いろいろ変わるのを体験させる(説明カードは出さず、画面全体を見せる)
  const findPlay = () => {
    const pn = q('#dkpanel'), open = !!(pn && !pn.hidden && q('#dkbars .finbar'));
    if (!open) { sig = null; const st = q('#dkstrip'); return st ? { k: 'strip', el: st, nodim: true, t: '下の「＋ 文を変化させてあそぶ」を押してみよう！' } : null; }
    let now = ''; try { now = JSON.stringify(APP.S.main); } catch (e) { }
    if (sig === null) { sig = now; changes = 0; } else if (now !== sig) { sig = now; changes++; flash(); }
    const bars = q('#dkbars');
    return { k: 'bars' + Math.min(changes, 3), el: bars, nodim: true, noPulse: true, go: changes >= 3,
      t: changes === 0 ? 'バーを指でなぞってみて！ 時や言い方がいろいろ変わるよ。' : changes < 3 ? 'おっ、変わった！ ほかのバーも動かしてみよう。' : 'いいね！ 気がすむまで遊んだら「つづきへ」。' };
  };
  goB.onclick = () => { completed = true; clearInterval(timer); clearTimeout(offT); app.querySelectorAll('.ep-tutorial-target').forEach(e => e.classList.remove('ep-tutorial-target')); css.remove(); [spot, hand, cap].forEach(e => e.remove()); finish(); };
  function flash() { const fl = document.createElement('div'); fl.className = 'ep-flash'; app.appendChild(fl); setTimeout(() => fl.remove(), 800); }
  tick();
}
