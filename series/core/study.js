/* 勉強部屋：自宅と、上のバーのアバターから開く同じ画面。
   タブ：今日（目標・続けた日数・つづきから）／記録（7日分・したいこと別）／勉強ノート／プロフィール
   開くとき open({ play(gameId, opts) }) でゲームを開く手段を渡す（単体版で使えない遊びのボタンは出さない） */
import { WANTS, playOf } from './plays.js';
import { createStore } from './store.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function createStudy(core) {
  let ov = null, tab = 'today', opt = {};
  const tst = createStore('core');   // 3Dの町が置いていく「町のひみつ」(占い・調べる・住人から聞いたこと・たからもの)
  const rec = core.record, nb = core.notebook;
  const canPlay = g => typeof opt.play === 'function' && (!opt.has || opt.has(g));
  const close = () => { if (!ov) return; ov.remove(); ov = null; offs.forEach(f => f()); offs = []; };
  let offs = [];
  function open(o = {}) {
    if (o.tab === 'note' && o.sec !== 'secret' && core.drill) return core.drill.open(o);   // 勉強ノートは、ドリルだけの別画面
    opt = o; if (ov) close();
    if (o.tab) tab = o.tab === 'note' ? 'log' : o.tab;
    ov = document.createElement('div'); ov.className = 'cs-ov cs-study-ov';
    ov.innerHTML = `<div class="cs-study" role="dialog" aria-label="勉強部屋"><header><b>勉強部屋</b><button class="cs-x" aria-label="とじる">✕</button></header>
      <nav class="cs-tabs">${[['today', '今日'], ['log', '記録'], ['me', 'プロフィール']].map(([k, n]) => `<button data-t="${k}">${n}</button>`).join('')}</nav><main></main></div>`;
    core.ui.root.appendChild(ov); core.ui.scrollHint && core.ui.scrollHint(ov.querySelector('main'));
    ov.querySelector('.cs-x').onclick = close;
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.querySelectorAll('.cs-tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    offs.push(rec.onChange(() => draw()), core.member.onChange(() => draw()), core.level.onChange(() => tab === 'today' && draw()));
    draw();
  }
  const go = (g, o) => { close(); opt.play(g, o); };
  function draw(keep) {   // keep=true:ノートの言葉を捨てた・印をつけたときなど。いまの位置のまま描き直す(上に飛ばさない)
    if (!ov) return;
    ov.querySelectorAll('.cs-tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const m = ov.querySelector('main'), top = keep ? m.scrollTop : 0;
    m.innerHTML = tab === 'today' ? today() : tab === 'log' ? log() : me();
    bind(m); m.scrollTop = top;
  }
  function today() {
    const t = rec.today(), mins = rec.sumMin(t), goal = rec.goal().min, pct = Math.min(100, Math.round(mins / goal * 100)), last = rec.last();
    const plays = Object.entries(t.plays).map(([id, n]) => `<li><span>${esc((playOf(id) || {}).n || id)}</span><b>${n}回</b></li>`).join('');
    return `<section class="cs-panel"><div class="cs-goal"><span>今日 <b>${Math.round(mins)}</b>分 / 目標 ${goal}分</span>
        <select data-goal>${[5, 10, 15, 20, 30, 45, 60].map(v => `<option value="${v}" ${v === goal ? 'selected' : ''}>目標 ${v}分</option>`).join('')}</select></div>
        <div class="cs-bar"><i style="width:${pct}%"></i></div>
        <p class="cs-sub">続けた日数 <b>${rec.streak()}</b>日 ・ コイン <b>${core.wallet.get()}</b></p></section>
      ${(() => { const m = core.mission.current(); return m && m.date === core.member.keys.dayKey() ? `<section class="cs-panel"><h4>${m.done ? 'クリアしたミッション' : 'いまのミッション'}</h4><div class="cs-mis"><b>${esc(m.title)}</b><small>${m.done ? 'クリア!' : esc(m.how)}</small></div></section>` : ''; })()}
      <button class="cs-btn cs-go cs-big" data-today>今日なにする?</button>
      <button class="cs-btn cs-big" data-drill>📒 勉強ノート(ドリル)</button>
      ${lvCard()}
      ${last && canPlay(last.game) ? `<button class="cs-btn cs-resume" data-resume>つづきから:${esc(last.label || (playOf(last.play) || {}).n || '')}</button>` : ''}
      <section class="cs-panel"><h4>今日やったこと</h4>${plays ? `<ul class="cs-stat">${plays}</ul>` : '<p class="cs-sub">まだありません。終わった遊びがここに入ります。</p>'}</section>`;
  }
  function lvCard() {
    const L = core.level; if (!L) return '';
    const sc = L.score(), nx = sc.next, pct = nx ? Math.round((sc.total - nx.from) / (nx.at - nx.from) * 100) : 100;
    return `<section class="cs-panel"><div class="cs-goal"><span>${L.lv ? 'レベル ' + L.name() : 'レベル まだ'} ・ ${sc.rank}</span><b>${sc.total}点</b></div>
      <div class="cs-bar"><i style="width:${pct}%"></i></div><p class="cs-sub">${nx ? `${nx.name}まで あと${nx.need}点` : '最高ランク'} ・ ${sc.parts.map(p => `${p.n} ${p.v}`).join(' ・ ')}</p>
      ${L.lv ? `<p class="cs-sub">推定語彙 約${(L.vocab() || 0).toLocaleString()}語</p>` : ''}
      <div class="cs-adm-row">${!L.lv ? '<button class="cs-btn cs-go" data-place>レベル診断(約20問)</button>' : L.testLeft() > 0 ? `<span class="cs-sub">単語力テストまで ミッションあと${L.testLeft()}個</span>` : '<button class="cs-btn cs-go" data-test>単語力テストを受ける</button>'}</div></section>`;
  }
  function log() {
    const ds = rec.days(7), max = Math.max(10, ...ds.map(d => rec.sumMin(d)));
    const cols = ds.map(d => `<div class="cs-col7"><div class="cs-stack">${WANTS.map(w => { const v = d.min[w.k] || 0; return v ? `<i class="w-${w.k}" style="height:${v / max * 100}%" title="${w.n} ${Math.round(v)}分"></i>` : ''; }).join('')}</div><small>${+d.day.slice(8)}日</small></div>`).join('');
    const wk = {}; ds.forEach(d => WANTS.forEach(w => wk[w.k] = (wk[w.k] || 0) + (d.min[w.k] || 0)));
    const words = ds.reduce((a, d) => a + (d.words || 0), 0);
    return `<section class="cs-panel"><h4>この7日間(分)</h4><div class="cs-week">${cols}</div>
        <div class="cs-key">${WANTS.map(w => `<span><i class="w-${w.k}"></i>${w.n} ${Math.round(wk[w.k])}分</span>`).join('')}</div></section>
      <section class="cs-panel"><ul class="cs-stat"><li><span>読んだ語数(7日)</span><b>${words}語</b></li><li><span>勉強ノートの言葉</span><b>${nb.count()}個</b></li><li><span>まちがえた言葉</span><b>${nb.list({ mark: 'miss' }).length}個</b></li></ul></section>
      <section class="cs-panel"><h4>🔮 町のひみつ</h4></section>${secret()}`;
  }
  function secret() {   // 町のひみつ:占い・調べる・住人から聞いたこと(3Dの町が記録したもの)
    const d = tst.get('townInfo'), L = d && d.info ? d.info.slice().reverse() : [], cats = [...new Set(L.map(x => x.cat))], T = d && d.tre;
    if (!d) return '<p class="cs-sub">まだ何もありません。3Dの町で、占いの館で聞いたこと・住人のプレゼントの好み・町で調べて見つけたものが、ここに記録されます。</p>';
    return (T && T.length ? `<section class="cs-panel"><h4>たからもの ${T.filter(x => x.g).length} / ${T.length}</h4><p>${T.map(x => x.g ? esc(x.i) : '❔').join(' ')}</p></section>` : '')
      + (L.length ? cats.map(c => `<section class="cs-panel"><h4>${esc(c)}</h4>${L.filter(x => x.cat === c).map(x => `<p class="cs-sub" style="margin:4px 0">${esc(x.text)}</p>`).join('')}</section>`).join('')
        : '<p class="cs-sub">占いの館で聞いたこと、住人のプレゼントの好み、町で調べて見つけたものが、ここに記録されます。</p>');
  }
  function me() {
    const p = core.profile;
    return `<section class="cs-panel"><div class="cs-prof"><img src="${p.avatarURL()}" alt="アバター"><div><label class="cs-row cs-col"><span>なまえ</span><input data-name maxlength="12" placeholder="なまえを入れてね" value="${esc(p.name)}"></label></div></div>
      <p class="cs-note">アバターは作り直し中(いまは仮の絵)。</p></section>
      <section class="cs-panel"><ul class="cs-stat"><li><span>会員</span><b>${core.member.isPaid() ? '有料会員' : '無料会員'}</b></li><li><span>コイン</span><b>${core.wallet.get()}(月替わりに残せる上限 ${core.member.coinCapText()})</b></li><li><span>ダイヤ</span><b>${core.member.gems()}</b></li><li><span>共有の教材の枠</span><b>${core.member.slots().length} / ${core.member.slotMax()}</b></li>${core.member.isPaid() ? `<li><span>今月のAIの回数</span><b>あと${core.member.aiLeft()}回</b></li>` : ''}</ul>
      ${core.member.today().cmLeft > 0 ? `<button class="cs-btn" data-cm>CMを見てコイン +${core.member.coinPreview(core.econ.daily.cm.each)}(今日あと${core.member.today().cmLeft}回)</button>` : ''}</section>
      <button class="cs-btn" data-settings>設定</button>`;
  }
  function bind(m) {
    const q = s => m.querySelector(s);
    if (q('[data-goal]')) q('[data-goal]').onchange = e => rec.setGoal(e.target.value);
    if (q('[data-today]')) q('[data-today]').onclick = () => { close(); core.today.open({ has: opt.has }); };
    if (q('[data-drill]')) q('[data-drill]').onclick = () => { close(); core.drill.open({}); };
    if (q('[data-test]')) q('[data-test]').onclick = () => core.level.test();
    if (q('[data-place]')) q('[data-place]').onclick = () => core.level.placement();
    if (q('[data-resume]')) q('[data-resume]').onclick = () => { const l = rec.last(); go(l.game, l.opts); };
    if (q('[data-name]')) q('[data-name]').onchange = e => core.profile.setName(e.target.value);
    if (q('[data-settings]')) q('[data-settings]').onclick = () => core.ui.settings();
    if (q('[data-cm]')) q('[data-cm]').onclick = () => { const g = core.member.earn('cm'); core.ui.toast(g ? `コイン +${g}(CMはアプリにしたときに本物を入れます)` : '今日はもう見られません'); draw(); };
  }
  return { open, close, get isOpen() { return !!ov; } };
}
