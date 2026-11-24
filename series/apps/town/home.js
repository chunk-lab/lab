/* タイトル(ホーム)：アプリを開いたときの最初の画面。ここから「勉強する」か「街であそぶ(3D)」を選ぶ。
   2Dの地図のかわりに「行き先のリスト」（core/plays.js の表から作る）。3Dの町は、えらんだときだけ読み込む。 */
import { PLAYS } from '../../core/plays.js';
import { LOGO } from '../../core/logos.js';
import { TITLE_VOICE } from '../../core/title_voice.js';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WANT_ICON = { word: '🔤', read: '📖', make: '✏️', talk: '🗣', chill: '☕' };
// 版:組み立てた日時(日本時間)。テスト版が最新かどうか、見分けるための印
export const verText = () => { const b = window.__APP__ && window.__APP__.build, t = b ? parseInt(b, 36) : NaN; if (!isFinite(t)) return 'ver dev'; const d = new Date(t + 9 * 36e5).toISOString(); return 'ver ' + d.slice(5, 10) + ' ' + d.slice(11, 16) + (window.__APP__.rev ? ' ・ ' + window.__APP__.rev : ''); };
export function createHome(core, { st, go3D, openFish, openStudy, has, openEpisode, episodeLabel, episodeSub, episodeList, openEpisodeAt }) {
  let el = null, voice = null, voiced = false;
  // タイトルの声:ページを開いて最初のタイトルで1回。音が出せない(まだ画面にさわっていない)ときは、最初にさわった瞬間に鳴らす
  const sayTitle = () => {
    voiced = true; try { if (!voice) voice = new Audio(TITLE_VOICE); voice.currentTime = 0; const p = voice.play();
      if (p && p.catch) p.catch(() => { const go = () => { if (el && !el.hidden) { try { voice.currentTime = 0; voice.play().catch(() => { }); } catch (e) { } } }; document.addEventListener('pointerdown', go, { once: true, capture: true }); }); } catch (e) { }
  };
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
      ${openEpisode ? `<button class="hm-pic hm-ep" data-episode><span class="hm-t"><b>${esc(episodeLabel ? episodeLabel() : '第1話をはじめる')}</b><small>${esc(episodeSub ? episodeSub() : 'はな・そら「ちょっと、外に出たい」')}</small></span></button>` : ''}
      ${core.admin && core.admin.on() && episodeList ? `<div class="hm-epl" style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">${episodeList().map(e => `<button class="hm-retry" data-epi="${e.i}">物語テスト ${e.label ? esc(e.label) : '第' + e.no + '話'}「${esc(e.title)}」</button>`).join('')}</div>` : ''}
      ${msg ? `<div class="hm-err">${esc(msg.text)}<button class="hm-retry" data-retry>もう一度</button></div>` : ''}
      ${c ? `<button class="hm-pic hm-cont2" data-main><span class="hm-t"><b>${c.kind === '3d' ? '街であそぶ' : esc(main ? main.n : '')}</b></span></button>` : ''}
      <button class="hm-pic hm-go" data-3d aria-label="街へ行く"></button>
      <div class="hm-apps">${APPS.map(a => `<button class="hm-pic hm-app hm-app-${a[0]}" data-app="${a[0]}" aria-label="${a[2]}"></button>`).join('')}</div>
      <button class="hm-pic hm-st" data-note aria-label="勉強する"></button>
      ${core.admin && core.admin.on() ? `<p class="hm-ver">${esc(verText())}</p>` : ''}
      </div>`;
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if ('epi' in b.dataset) openEpisodeAt(+b.dataset.epi);
      else if ('episode' in b.dataset) openEpisode();
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
      if (!voiced) setTimeout(() => { if (!voiced && el && !el.hidden) sayTitle(); }, 0);   // 導入のときは、ロゴが降りてくる瞬間(dropLogo)に鳴らす
    },
    // 導入のおわり: ロゴが上から降りてきて、はずんで光る。ほかの部分は、あとからふわっと出る
    dropLogo() {
      if (!el) return; sayTitle(); el.classList.remove('hm-intro'); void el.offsetWidth; el.classList.add('hm-intro');
      const hd = el.querySelector('.hm-head'), img = el.querySelector('.hm-logo');
      if (hd && img) {   // ロゴの形だけに、光の帯を走らせる
        const sh = document.createElement('div'); sh.className = 'hm-shine';   // 位置は offset で(降りてくる途中の動きに左右されない)
        sh.style.cssText += `left:${img.offsetLeft}px;top:${img.offsetTop}px;width:${img.offsetWidth}px;height:${img.offsetHeight}px;-webkit-mask:url("${img.src}") center/contain no-repeat;mask:url("${img.src}") center/contain no-repeat`;
        hd.appendChild(sh); setTimeout(() => sh.remove(), 4200);
      }
      setTimeout(() => el && el.classList.remove('hm-intro'), 4200);
    },
    hide() { if (el) el.hidden = true; document.body.classList.remove('md-home-on'); },
    remember,
  };
}
