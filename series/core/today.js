/* 「今日なにする?」と、終わったときの「結果の帯」。どちらも遊びの属性表(plays.js)だけを見る。
   開き方 go.game は core.openGame、go.to:'3d' は core.to3D、go.to:'note' は勉強部屋の勉強ノート。
   アプリ側で使えない遊び(単体版にないゲーム・3Dがない)は出さない。 */
import { createStore } from './store.js';
import { PLAYS, WANTS, MOODS, TIMES, playOf } from './plays.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function createToday(core) {
  const st = createStore('core');
  const pref = () => Object.assign({ want: 'read', time: 15, mood: 'any' }, st.get('todayPref') || {});
  let hasGame = () => true;
  const usable = p => p.go.to === '3d' ? !!core.to3D : p.go.to === 'note' ? !!core.study : p.go.to === 'test' ? !!core.level && hasGame('stream') : !!core.openGame && hasGame(p.go.game);
  function go(p) {
    if (!p) return;
    if (p.go.to === '3d') core.to3D();
    else if (p.go.to === 'test') core.level.test();
    else if (p.go.to === 'note') core.study.open({ play: core.openGame, has: hasGame, tab: 'note', kind: p.go.kind || 'word', mark: p.go.kind ? '' : 'miss' });
    else core.openGame(p.go.game, p.go.opts || {});
  }
  // おすすめ：したいこと×時間×気分。弱いところ(実力テストの苦手)と、今日まだやっていないものを少し上に
  function pick({ want, time, mood }) {
    const done = core.record.today().plays || {}, weak = (core.level && core.level.weak && core.level.weak()) || '';
    let list = PLAYS.filter(p => usable(p) && p.want === want && p.time.includes(time));
    if (!list.length) list = PLAYS.filter(p => usable(p) && p.want === want);
    const score = p => (mood === 'any' ? Math.random() * 2 : (p.mood === mood ? 3 : p.mood === 'both' || p.mood === 'any' ? 2 : 0)) + (done[p.id] ? -1 : 0) + (weak === p.want ? .5 : 0) + Math.random() * .3;
    return list.map(p => [score(p), p]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  }
  function open(o = {}) {
    if (o.has) hasGame = o.has;
    const P = pref(), last = core.record.last(), wk = core.books ? core.books.weekly() : [], taskDone = core.member.today().task;
    const sel = (k, list, cur) => `<nav class="cs-chips" data-k="${k}">${list.map(x => `<button data-v="${x.k}" class="${String(x.k) === String(cur) ? 'on' : ''}">${x.n}</button>`).join('')}</nav>`;
    const rec = pick(P), main = rec[0], more = rec.slice(1, 3);
    core.ui.sheet(`<h3>今日なにする?</h3>
      ${last && core.openGame && hasGame(last.game) ? `<button class="cs-btn cs-resume" data-resume>つづきから:${esc(last.label || (playOf(last.play) || {}).n || '')}</button>` : ''}
      ${wk.length ? `<button class="cs-btn ${taskDone ? '' : 'cs-go'}" data-task>今日の課題:課題図書を1冊${taskDone ? '(今日はクリア済み)' : `(コイン +${core.member.coinPreview(core.econ.daily.task)})`}<small>${wk.map(b => esc(b.title)).join(' ・ ')}</small></button>` : ''}
      <p class="cs-note">したいこと</p>${sel('want', WANTS, P.want)}
      <p class="cs-note">時間と気分</p>${sel('time', TIMES, P.time)}${sel('mood', MOODS, P.mood)}
      ${main ? `<button class="cs-btn cs-go cs-big" data-p="${main.id}">${esc(main.n)}<small>おすすめ</small></button>` : '<p class="cs-note">この組み合わせの遊びは、このアプリにはありません。</p>'}
      ${more.map(p => `<button class="cs-btn" data-p="${p.id}">${esc(p.n)}</button>`).join('')}`, (ov, close) => {
      ov.querySelectorAll('[data-k] button').forEach(b => b.onclick = () => { const k = b.parentNode.dataset.k, v = b.dataset.v; const n = pref(); n[k] = k === 'time' ? +v : v; st.set('todayPref', n); close(); open(o); });
      ov.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { close(); go(playOf(b.dataset.p)); });
      const r = ov.querySelector('[data-resume]'); if (r) r.onclick = () => { close(); core.openGame(last.game, last.opts); };
      const t = ov.querySelector('[data-task]'); if (t) t.onclick = () => { close(); core.openGame('library', { tab: 'weekly' }); };
    });
  }
  // ---- 結果の帯：done の報告が来たら、画面の下に数秒だけ出す ----
  let band = null, hideT = 0;
  core.events.on((game, name, d = {}) => {
    if (name !== 'done') return;
    const p = playOf(d.play), coins0 = core.wallet.get();
    setTimeout(() => {   // コインが入ったあとに出す
      const got = core.wallet.get() - coins0, next = p ? pick({ want: p.want, time: 15, mood: 'any' }).find(x => x.id !== p.id) : null;
      if (band) band.remove(); clearTimeout(hideT);
      band = document.createElement('div'); band.className = 'cs-band';
      band.innerHTML = `<span>記録に足しました${d.min ? `(${Math.max(1, Math.round(d.min))}分)` : ''}${got > 0 ? ` ・ コイン +${got}` : ''}</span>
        <div><button data-n>今日なにする?</button><button data-x aria-label="とじる">✕</button></div>`;
      core.ui.root.appendChild(band);
      band.querySelector('[data-x]').onclick = () => band.remove();
      const nb = band.querySelector('[data-n]'); if (nb) nb.onclick = () => { band.remove(); core.host.close(); core.mission.open(); };
      hideT = setTimeout(() => band && band.remove(), 9000);
    }, 300);
  });
  // 「今日なにする?」はミッション(mission.js)。ここの open は古い選び方なので使わない
  return { open: o => core.mission.open(o), go, pick };
}
