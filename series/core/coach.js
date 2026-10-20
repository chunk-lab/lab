/* 案内（コーチ）：runCoach(steps, { onDone, face })
   steps: [{ w:'g'|'b'（女の子／男の子）, f:'normal'などの表情, t:'せりふ', sel:'光らせる場所のセレクタ', wait:()=>true になるまで待つ（やってみよう） }]
   終わる／とばすと onDone(true|false)。戻り値の stop() で途中でやめられる。 */
import './coach.css';
const NAME = { g: '女の子', b: '男の子' };
const defFace = (w, f) => `g/chunkchunk/img/chara/${w === 'b' ? 'boy' : 'girl'}/${f || 'normal'}.webp`;
export function runCoach(steps, opt = {}) {
  if (!steps || !steps.length) { opt.onDone && opt.onDone(true); return { stop() { } }; }
  const faceOf = opt.face || defFace;
  let i = 0, done = false, timer = 0;
  const ov = document.createElement('div'); ov.className = 'cc-coach';
  ov.innerHTML = '<div class="cc-dim"></div><div class="cc-hole" hidden></div><div class="cc-box"><img class="cf" alt=""><div class="cn"></div><div class="ct"></div><button class="cskip">とばす</button><button class="cnx">つぎへ ▶</button><div class="cwt" hidden>やってみよう</div></div>';
  document.body.appendChild(ov);
  const q = s => ov.querySelector(s), hole = q('.cc-hole'), box = q('.cc-box'), img = q('.cf');
  img.onerror = () => { img.hidden = true; box.classList.add('nofc'); };
  const finish = ok => { if (done) return; done = true; clearInterval(timer); removeEventListener('resize', place); ov.remove(); opt.onDone && opt.onDone(ok); };
  const target = () => { const s = steps[i]; if (!s || !s.sel) return null; try { return document.querySelector(s.sel); } catch (e) { return null; } };
  function place() {
    const el = target();
    if (el) { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) { const p = 6; hole.hidden = false; hole.style.cssText = `left:${r.left - p}px;top:${r.top - p}px;width:${r.width + p * 2}px;height:${r.height + p * 2}px`; ov.classList.add('has'); box.classList.toggle('top', r.top + r.height / 2 > innerHeight * .55); return; } }
    hole.hidden = true; ov.classList.remove('has'); box.classList.remove('top');
  }
  function show() {
    const s = steps[i];
    const u = faceOf(s.w, s.f); if (u) { img.hidden = false; box.classList.remove('nofc'); img.src = u; } else { img.hidden = true; box.classList.add('nofc'); }
    const nm = q('.cn'); nm.textContent = NAME[s.w] || NAME.g; nm.className = 'cn ' + (s.w || 'g');
    q('.ct').textContent = s.t;
    ov.classList.toggle('pass', !!s.wait); q('.cnx').hidden = !!s.wait; q('.cwt').hidden = !s.wait;
    q('.cnx').textContent = i === steps.length - 1 ? 'おわり ✓' : 'つぎへ ▶';
    place(); box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
  }
  function next() { if (done) return; i++; if (i >= steps.length) return finish(true); show(); }
  q('.cnx').onclick = e => { e.stopPropagation(); next(); };
  q('.cskip').onclick = e => { e.stopPropagation(); finish(false); };
  box.onclick = e => { if (e.target.closest('button')) return; if (!steps[i].wait) next(); };
  addEventListener('resize', place);
  timer = setInterval(() => { place(); const s = steps[i]; if (s && s.wait && !s._ok) { try { if (s.wait()) { s._ok = 1; setTimeout(next, 600); } } catch (e) { } } }, 250);
  show();
  return { stop() { finish(false); } };
}
