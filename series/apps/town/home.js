/* タイトル(ホーム)：アプリを開いたときの最初の画面。ここから「勉強する」か「街であそぶ(3D)」を選ぶ。
   2Dの地図のかわりに「行き先のリスト」（core/plays.js の表から作る）。3Dの町は、えらんだときだけ読み込む。 */
import { PLAYS } from '../../core/plays.js';
import { LOGO } from '../../core/logos.js';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WANT_ICON = { word: '🔤', read: '📖', make: '✏️', talk: '🗣', chill: '☕' };
// 版:組み立てた日時(日本時間)。テスト版が最新かどうか、見分けるための印
const verText = () => { const b = window.__APP__ && window.__APP__.build, t = b ? parseInt(b, 36) : NaN; if (!isFinite(t)) return 'ver dev'; const d = new Date(t + 9 * 36e5).toISOString(); return 'ver ' + d.slice(5, 10) + ' ' + d.slice(11, 16); };
export function createHome(core, { st, go3D, openStudy, has, openEpisode, episodeLabel }) {
  let el = null;
  const usable = p => p.go.to === '3d' ? true : p.go.to === 'note' ? !!core.study : p.go.to === 'test' ? !!core.level : p.go.to === 'role' ? !!core.roletest && !!core.books : !!core.openGame && has(p.go.game);
  const cont = () => st.get('cont') || null;
  const remember = (c) => st.set('cont', Object.assign({ at: Date.now() }, c));
  const start = p => { remember({ kind: 'play', id: p.id, label: p.n }); if (p.go.to === '3d') go3D(); else core.today.go(p); };
  function draw(msg) {
    const study = PLAYS.filter(p => p.mood !== 'game' && p.go.to !== '3d' && usable(p));
    const fun = PLAYS.filter(p => (p.mood === 'game') && usable(p));
    const c = cont(), cp = c && c.kind === 'play' ? PLAYS.find(p => p.id === c.id) : null, main = c ? (c.kind === 'play' ? cp : { n: c.label || '勉強ノート' }) : study[0];
    const row = p => `<button class="hm-row" data-p="${p.id}"><span>${WANT_ICON[p.want] || '・'}</span><b>${esc(p.n)}</b></button>`;
    el.innerHTML = `<div class="hm-box"><img class="hm-logo" src="${LOGO.town}" alt="かまってチャンクTOWN">
      ${openEpisode ? `<button class="hm-row" data-episode><span>📖</span><b>${esc(episodeLabel ? episodeLabel() : '第1話をはじめる')}<small style="display:block;font-weight:400;margin-top:3px">はな・そら「ちょっと、外に出たい」</small></b></button>` : ''}
      ${msg ? `<div class="hm-err">${esc(msg.text)}<button class="hm-retry" data-retry>もう一度</button></div>` : ''}
      ${main ? `<button class="hm-cont" data-main><small>${c ? 'つづきから' : 'はじめる'}</small><b>${c && c.kind === '3d' ? '🏙 街であそぶ' : esc(main.n)}</b></button>` : ''}
      <button class="hm-3d" data-3d><b>🏙 街であそぶ（3D）</b><small>少し重め・Wi-Fiがおすすめ</small></button>
      <button class="hm-row hm-note" data-note><span>📒</span><b>勉強ノート・記録・設定</b></button>
      <details class="hm-more"><summary>ほかの練習・ゲーム</summary>
      <h2>📚 勉強する</h2>${study.map(row).join('')}
      <h2>🎮 ゲームであそぶ</h2>${fun.map(row).join('')}</details>
      <p class="hm-ver">${esc(verText())}</p>
      </div>`;
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if ('episode' in b.dataset) openEpisode();
      else if (b.dataset.p) start(PLAYS.find(p => p.id === b.dataset.p));
      else if ('main' in b.dataset) { if (c && c.kind === '3d') go3D(); else if (c && c.kind === 'study') openStudy(); else if (cp) start(cp); else if (main) start(main); }
      else if ('note' in b.dataset) { remember({ kind: 'study', label: '勉強ノート' }); openStudy(); }
      else if ('3d' in b.dataset || 'retry' in b.dataset) go3D();
    };
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
