// 釣りの「巻き取り」:アミューズメントセンターの「文の並べ替え」と同じデータ・同じルールで、
//   日本語の順に浮かぶチャンクを、英語の順の枠に入れていく。ぜんぶ入れば巻き取り成功(魚が上がる)。時間切れで逃げられる。
//   文のデータは series/data/chunk_sentences.js(並べ替えゲームと共通)
import { chunkSentences, ROLES, ORDER, buildEn } from '../../../../series/data/chunk_sentences.js';

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let bag = [];
export function pickSentence(nMin, nMax) {
  let pool = chunkSentences().filter(s => s.n >= nMin && s.n <= nMax); if (!pool.length) pool = chunkSentences();
  bag = bag.filter(s => pool.includes(s)); if (!bag.length) bag = shuffle(pool.slice());
  return bag.pop();
}
export const SORT_CSS = `
.fz .enq .sr-sl{display:flex;flex-direction:column;gap:6px;margin:6px 0 10px}
.fz .enq .sr-sl button{display:flex;align-items:center;gap:8px;border:2px dashed #d8cde6;border-radius:12px;background:#faf7ff;padding:8px 10px;min-height:42px;font:inherit;color:#5a4a6b;text-align:left}
.fz .enq .sr-sl button small{font-size:10px;font-weight:800;color:#8d7f9e;min-width:76px}
.fz .enq .sr-sl button b{font-size:15px}
.fz .enq .sr-sl button.in{border-style:solid;border-color:#7fcf9f;background:#effaf2}
.fz .enq .sr-sl button.ng{border-color:#e0556b;background:#ffe8ec;animation:srNg .3s}
@keyframes srNg{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.fz .enq .sr-ch{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;min-height:46px}
.fz .enq .sr-ch button{border:2px solid #d8cde6;border-radius:14px;background:#fff;padding:9px 12px;font:inherit;font-weight:800;font-size:15px;color:#5a4a6b;box-shadow:0 3px 0 #d8cde6}
.fz .enq .sr-ch button.sel{border-color:#5a4a6b;transform:translateY(-3px)}
.fz .enq .sr-ch button.used{visibility:hidden}
.fz .enq .sr-ch.lock button{opacity:.45}
`;

// → Promise<boolean>。host に画面をのせる。opt: {n:[最小,最大], sfx, say(en), onDone(en,ja)}
export function sortReel(host, opt) {
  return new Promise(res => {
    const s = pickSentence(opt.n[0], opt.n[1]), roles = ORDER.filter(r => s.roles.includes(r));   // 英語の順の枠
    if (window.__fzE) window.__srS = s;   // 確認用(debug のときだけ)
    const order = shuffle(s.chunks.map((_, i) => i)), placed = {}; let sel = -1, lock = 0, hint = false, done = false, mistakes = 0;
    const total = 9 + s.n * 5;   // 秒
    const ov = document.createElement('div'); ov.className = 'enq';
    ov.innerHTML = `<div class="qb"><div class="ql"><span>🎣 巻き取れ! 英語の順に並べよう</span><button class="sp" data-h>💡 ヒント</button></div><div class="qt"><i></i></div>
      <div class="qs" style="margin-bottom:2px">日本語のかたまりを、英語の順の枠へ(かたまり → 枠 の順にタップ)</div>
      <div class="sr-sl">${roles.map(r => `<button data-r="${r}"><small>${ROLES[r].name}<br>${ROLES[r].gram}</small><b></b></button>`).join('')}</div>
      <div class="sr-ch">${order.map(i => `<button data-c="${i}">${esc(s.chunks[i].ja)}</button>`).join('')}</div><div class="res"></div></div>`;
    ov.addEventListener('pointerdown', e => e.stopPropagation()); ov.addEventListener('pointerup', e => e.stopPropagation());
    host.appendChild(ov);
    const bar = ov.querySelector('.qt i'), chs = ov.querySelector('.sr-ch'), msg = ov.querySelector('.res');
    requestAnimationFrame(() => { bar.style.transition = `width ${total}s linear`; bar.style.width = '0%'; });
    const paintHint = () => ov.querySelectorAll('[data-c]').forEach(b => { b.style.background = hint ? ROLES[s.chunks[+b.dataset.c].role].col : ''; });
    const end = ok => {
      if (done) return; done = true; clearTimeout(tm); bar.style.transition = 'none';
      const en = buildEn(Object.fromEntries(roles.map(r => [r, s.chunks[placed[r] != null ? placed[r] : s.chunks.findIndex(c => c.role === r)]])));
      msg.innerHTML = ok ? `<span style="color:#3aa067">⭕ 巻き取り成功!</span><br><span style="font-size:15px">${esc(en)}</span>` : `<span style="color:#e0556b">⏰ 間に合わなかった…</span><br><span style="font-size:14px">${esc(en)}</span>`;
      if (!ok) roles.forEach(r => { const b = ov.querySelector(`[data-r="${r}"]`); b.classList.add('in'); b.querySelector('b').textContent = s.chunks.find(c => c.role === r).ja; });
      opt.sfx.play(ok ? 'catch' : 'lost');
      if (ok) opt.say && opt.say(en);
      opt.onDone && opt.onDone(en, s.chunks.map(c => c.ja).join(' / '), ok);
      setTimeout(() => { ov.remove(); res(ok); }, ok ? 1900 : 2200);
    };
    const tm = setTimeout(() => end(false), total * 1000);
    ov.onclick = e => {
      if (done) return;
      if (e.target.closest('[data-h]')) { hint = !hint; paintHint(); return; }
      if (lock > 0) return;
      const c = e.target.closest('[data-c]');
      if (c && !c.classList.contains('used')) { sel = +c.dataset.c; chs.querySelectorAll('button').forEach(b => b.classList.toggle('sel', +b.dataset.c === sel)); opt.sfx.play('tap'); return; }
      const sl = e.target.closest('[data-r]');
      if (sl && sel >= 0 && placed[sl.dataset.r] == null) {
        const r = sl.dataset.r, ch = s.chunks[sel];
        if (ch.role === r) {
          placed[r] = sel; sl.classList.add('in'); sl.querySelector('b').textContent = ch.ja; chs.querySelector(`[data-c="${sel}"]`).classList.add('used'); sel = -1; opt.sfx.play('coin');
          if (Object.keys(placed).length === roles.length) end(true);
        } else {
          mistakes++; lock = 1; sl.classList.add('ng'); setTimeout(() => sl.classList.remove('ng'), 320); chs.classList.add('lock'); sel = -1; chs.querySelectorAll('button').forEach(b => b.classList.remove('sel')); opt.sfx.play('early');
          setTimeout(() => { lock = 0; chs.classList.remove('lock'); }, 900);
        }
      }
    };
  });
}
