/* 勉強部屋(ホーム)：アプリを開いたときの最初の画面。ここから「勉強する」か「街であそぶ(3D)」を選ぶ。
   2Dの地図のかわりに「行き先のリスト」（core/plays.js の表から作る）。3Dの町は、えらんだときだけ読み込む。 */
import { PLAYS } from '../../core/plays.js';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WANT_ICON = { word: '🔤', read: '📖', make: '✏️', talk: '🗣', chill: '☕' };
export function createHome(core, { st, go3D, openStudy, has }) {
  let el = null;
  const usable = p => p.go.to === '3d' ? true : p.go.to === 'note' ? !!core.study : p.go.to === 'test' ? !!core.level : !!core.openGame && has(p.go.game);
  const cont = () => st.get('cont') || null;
  const remember = (c) => st.set('cont', Object.assign({ at: Date.now() }, c));
  const start = p => { remember({ kind: 'play', id: p.id, label: p.n }); if (p.go.to === '3d') go3D(); else core.today.go(p); };
  function draw(msg) {
    const study = PLAYS.filter(p => p.mood !== 'game' && p.go.to !== '3d' && usable(p));
    const fun = PLAYS.filter(p => (p.mood === 'game') && usable(p));
    const c = cont(), cp = c && c.kind === 'play' ? PLAYS.find(p => p.id === c.id) : null;
    const row = p => `<button class="hm-row" data-p="${p.id}"><span>${WANT_ICON[p.want] || '・'}</span><b>${esc(p.n)}</b></button>`;
    el.innerHTML = `<div class="hm-box"><h1>勉強部屋</h1>
      ${msg ? `<div class="hm-err">${esc(msg.text)}<button class="hm-retry" data-retry>もう一度</button></div>` : ''}
      ${c ? `<button class="hm-cont" data-cont><small>つづきから</small><b>${c.kind === '3d' ? '🏙 街であそぶ' : esc(c.label || '')}</b></button>` : ''}
      <button class="hm-3d" data-3d><b>🏙 街であそぶ（3D）</b><span>歩いて、住人と話したり、お店に入ったり</span><small>少し重め・Wi-Fiがおすすめ</small></button>
      <h2>📚 勉強する</h2>
      <button class="hm-row hm-note" data-note><span>📒</span><b>勉強ノート・記録</b></button>
      ${study.map(row).join('')}
      <h2>🎮 ゲームであそぶ</h2>
      ${fun.map(row).join('')}
      </div>`;
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.p) start(PLAYS.find(p => p.id === b.dataset.p));
      else if ('cont' in b.dataset) { if (c.kind === '3d') { go3D(); } else if (cp) start(cp); }
      else if ('note' in b.dataset) { remember({ kind: 'study', label: '勉強ノート' }); openStudy(); }
      else if ('3d' in b.dataset || 'retry' in b.dataset) go3D();
    };
    if (c && c.kind === 'study') { const b = el.querySelector('[data-cont]'); if (b) b.onclick = () => openStudy(); }
  }
  return {
    show(msg) {
      if (!el) { el = document.createElement('div'); el.className = 'hm-ov'; document.body.appendChild(el); }
      el.hidden = false; document.body.classList.add('md-home-on'); draw(msg); el.scrollTop = 0;
    },
    hide() { if (el) el.hidden = true; document.body.classList.remove('md-home-on'); },
    remember,
  };
}
