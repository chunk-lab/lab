/* タイトル(ホーム)：アプリを開いたときの最初の画面。ここから「勉強する」か「街であそぶ(3D)」を選ぶ。
   2Dの地図のかわりに「行き先のリスト」（core/plays.js の表から作る）。3Dの町は、えらんだときだけ読み込む。 */
import { PLAYS } from '../../core/plays.js';
import { LOGO } from '../../core/logos.js';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WANT_ICON = { word: '🔤', read: '📖', make: '✏️', talk: '🗣', chill: '☕' };
// 版:組み立てた日時(日本時間)。テスト版が最新かどうか、見分けるための印
export const verText = () => { const b = window.__APP__ && window.__APP__.build, t = b ? parseInt(b, 36) : NaN; if (!isFinite(t)) return 'ver dev'; const d = new Date(t + 9 * 36e5).toISOString(); return 'ver ' + d.slice(5, 10) + ' ' + d.slice(11, 16); };
export function createHome(core, { st, go3D, openFish, openStudy, has, openEpisode, episodeLabel }) {
  let el = null;
  const usable = p => p.go.to === '3d' ? true : p.go.to === 'note' ? !!core.study : p.go.to === 'test' ? !!core.level : p.go.to === 'role' ? !!core.roletest && !!core.books : !!core.openGame && has(p.go.game);
  const cont = () => st.get('cont') || null;
  const remember = (c) => st.set('cont', Object.assign({ at: Date.now() }, c));
  const start = p => { remember({ kind: 'play', id: p.id, label: p.n }); if (p.go.to === '3d') go3D(); else core.today.go(p); };
  function draw(msg) {
    const study = PLAYS.filter(p => p.mood !== 'game' && p.go.to !== '3d' && usable(p));
    const fun = PLAYS.filter(p => (p.mood === 'game') && usable(p));
    const c = cont(), cp = c && c.kind === 'play' ? PLAYS.find(p => p.id === c.id) : null, main = c ? (c.kind === 'play' ? cp : { n: c.label || '勉強ノート' }) : null;
    const APPS = [['chunkchunk', 'cc', '今スラ！'], ['stream', 'story', 'Storyミング！'], ['eigonou', 'eigo', '英文組み立てラボ'], ['fish', 'fish', 'イングフィッシュ']].filter(a => a[0] === 'fish' || has(a[0]));
    const row = p => `<button class="hm-row" data-p="${p.id}"><span>${WANT_ICON[p.want] || '・'}</span><b>${esc(p.n)}</b></button>`;
    el.innerHTML = `<div class="hm-box"><div class="hm-head"><img class="hm-logo" src="${LOGO.town}" alt="かまってチャンクTOWN"></div>
      ${openEpisode ? `<button class="hm-pic hm-ep" data-episode><span class="hm-t"><b>${esc(episodeLabel ? episodeLabel() : '第1話をはじめる')}</b><small>はな・そら「ちょっと、外に出たい」</small></span></button>` : ''}
      ${msg ? `<div class="hm-err">${esc(msg.text)}<button class="hm-retry" data-retry>もう一度</button></div>` : ''}
      ${c ? `<button class="hm-pic hm-cont2" data-main><span class="hm-t"><b>${c.kind === '3d' ? '街であそぶ' : esc(main ? main.n : '')}</b></span></button>` : ''}
      <button class="hm-pic hm-go" data-3d aria-label="街へ行く"></button>
      <div class="hm-apps">${APPS.map(a => `<button class="hm-pic hm-app hm-app-${a[0]}" data-app="${a[0]}" aria-label="${a[2]}"></button>`).join('')}</div>
      <button class="hm-pic hm-st" data-note aria-label="勉強する"></button>
      ${core.admin && core.admin.on() ? `<p class="hm-ver">${esc(verText())}</p>` : ''}
      </div>`;
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if ('episode' in b.dataset) openEpisode();
      else if (b.dataset.p) start(PLAYS.find(p => p.id === b.dataset.p));
      else if (b.dataset.app) { if (b.dataset.app === 'fish') openFish(); else { remember({ kind: 'app', id: b.dataset.app, label: b.getAttribute('aria-label') }); core.openGame(b.dataset.app); } }
      else if ('main' in b.dataset) { if (!c) go3D(); else if (c.kind === 'app') core.openGame(c.id); else if (c && c.kind === '3d') go3D(); else if (c && c.kind === 'study') openStudy(); else if (cp) start(cp); else if (main) start(main); }
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
