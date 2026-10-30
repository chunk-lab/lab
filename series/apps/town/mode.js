/* はじめの画面：「街であそぶ（3Dの町）」か「すぐに勉強・ゲーム（2Dの地図）」かを選ぶ。
   3Dの町は ../town3d で作り、g/town3d/town.js として読み込む（2Dを選んだ人は読み込まない）。
   3Dの建物・住人から開くゲームは、2Dと同じ共通部品（core.host）で開く。セーブ・設定・記録は2Dと共通。 */
import { loadScript } from '../../core/host.js';
import { createStore } from '../../core/store.js';
import { ECON } from '../../core/economy.js';
import { PLAYS, playOf } from '../../core/plays.js';
import { catOfApp } from '../../core/daylog.js';
import './mode.css';

const st = createStore('town');
// 3Dの町のアプリid → 2Dの施設（PLACES のキー）か、ゲームを直接
const ROUTE = {
  school: { place: 'school' },           // 学校
  library: { place: 'library' },         // 図書館
  chunkcards: { game: 'cards' },          // カフェ＝チャンク・カード
};

export function createMode(core, { GAMES, enter, start2D, openStudy }) {
  let town = null, box = null;

  function chooser() {
    const ov = document.createElement('div'); ov.className = 'md-ov';
    ov.innerHTML = `<div class="md-box"><h1>チャンクタウン</h1><p class="md-q">どっちで はじめる？</p>
      <button class="md-card md-3d" data-m="3d"><b>🏙 街であそぶ</b><span>3Dの町を歩いて、住人と話したり、お店に入ったり</span><small>少し重め・Wi-Fiがおすすめ</small></button>
      <button class="md-card md-2d" data-m="2d"><b>📚 すぐに勉強・ゲーム</b><span>地図からすぐ選べる。軽くてサクサク</span></button>
      <label class="md-keep"><input type="checkbox" id="mdKeep"> つぎからは聞かない</label>
      <p class="md-note">あとから、どちらの画面でも切りかえられます</p></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', e => {
      const b = e.target.closest('[data-m]'); if (!b) return;
      st.set('mode', { last: b.dataset.m, keep: ov.querySelector('#mdKeep').checked });
      ov.remove(); go(b.dataset.m);
    });
  }

  async function go(m) {
    const v = Object.assign({ keep: false }, st.get('mode') || {}); v.last = m; st.set('mode', v);
    if (m === '2d') { stop3D(); document.body.classList.remove('md-3d-on'); start2D(); return; }
    document.body.classList.add('md-3d-on');
    if (town) return;
    const wait = document.createElement('div'); wait.className = 'md-wait'; wait.textContent = '町を読みこんでいます…'; document.body.appendChild(wait);
    try { await loadScript(core.base + 'g/town3d/town.js'); }
    catch (e) { wait.remove(); core.ui.toast('3Dの町を読みこめませんでした'); go('2d'); return; }
    wait.remove(); core.daylog.act('base', { cat: 'relax', label: '街を歩く' });
    let entered = false;   // 前回のふりかえり・単語テストは、キャラをえらんで町に入ってから(タイトル画面のあいだは出さない)
    // テスト用: ?coins=10000 で3Dの町のコインを増やして始められる（この端末の保存だけが変わる）
    const qc = new URLSearchParams(location.search).get('coins');
    if (/^\d{1,6}$/.test(qc || '')) core.wallet.set(+qc, 'test');
    box = document.createElement('div'); box.className = 'md-town3d'; document.body.appendChild(box);
    town = window.town3d = window.Hoshimiya.mount(box, {
      wallet: core.wallet,   // コインは2Dと共通
      gems: { get: () => core.member.gems(), spend: n => core.member.spendGems(n, 'house'), onChange: f => core.member.onChange(f) },   // ダイヤも2Dと共通(自宅を広げる・部屋を増やす)
      house: ECON.house,
      member: { paid: () => core.member.isPaid() },   // チャンクボックス(有料会員はゲーム機が無料)
      dictUrl: core.base + 'core/dict/data.js',   // 英語対戦ゲームの辞書
      learn: core.learn,   // 単語ごとの学習の記録(英語の釣り堀とストリームで共通)
      openAdmin: core.admin && core.admin.on() ? () => core.admin.open() : null,   // 運営画面(?admin=1 のとき)
      photo: ECON.photo,   // 写真の枠(はじめ1枚・ダイヤで5枚まで)   // 自宅の広げ方の値段(core/economy.js)
      features: ['study'],
      exprPool: () => { try { if (!core.dict.loaded) { core.dict.ready().catch(() => { }); return null; } return core.dict.phrases(); } catch (e) { return null; } },   // 毎日の表現のもと(辞書の熟語)
      medals: () => core.record.medals(),   // 勉強を続けたメダル(家の壁にかざれる)
      studyInfo: () => PLAYS.filter(p => p.mood !== 'game' && p.go && p.go.to !== '3d' && p.go.to !== 'test').map(p => ({ id: p.id, n: p.n, days: core.record.daysSince(p.id) })),   // しばらくしていない勉強(そら君が勧める)   // あなたの家に「勉強部屋」ボタンを出す
      switchLabel: '2Dの地図にする',
      onSwitchMode: () => go('2d'),
      openExternal(id) {
        const r = ROUTE[id]; if (!r) return false;   // ショップ・家・掲示板などは3Dの町の中で開く
        if (r.place) enter(r.place); else core.host.open(GAMES[r.game]);
        return true;
      },
      onEvent(name, d) {   // 3Dの町でしたことも、共通の記録に残す（ステータス・あとで課題やコインに使える）
        if (name === 'start') { if (d?.name && !core.profile.name) core.profile.setName(d.name); core.events.report('town3d', 'open'); if (!entered) { entered = true; setTimeout(() => { try { core.review && core.review.enter(); } catch (e) { } }, 1500); } }
        else if (name === 'talk') core.events.report('town3d', 'talk', { id: d?.id });
        else if (name === 'app:open') { document.body.classList.add('md-app-open'); core.events.report('town3d', 'app', { id: d?.id }); core.daylog.act('app', catOfApp(d?.id)); if (d?.id === 'omikuji') core.review && core.review.mark('omikuji'); }   // 家・ショップなどを開いている間は「今日なにする?」を隠す
        else if (name === 'app:close') { document.body.classList.remove('md-app-open'); core.daylog.act('app', null); core.daylog.act('sub', null); core.daylog.act('chat', null); }
        else if (name === 'app:event' && d?.name === 'snap') { if (d.data) createStore('core').set('townInfo', d.data); }
        else if (name === 'app:event' && d?.name === 'study') { const x = d.data || {}; if (x.snap) createStore('core').set('townInfo', x.snap); openStudy(x.tab ? { tab: x.tab, sec: x.sec || 'words' } : {}); }   // 町のノートボタン→勉強ノート(町のひみつの記録もいっしょに渡す)
        else if (name === 'app:event' && d?.name === 'act') core.daylog.act(d.data?.layer || 'sub', d.data?.cat ? { cat: d.data.cat, label: d.data.label } : null);   // 1日の記録:いま何をしているか
        else if (name === 'app:event' && d?.name === 'learn' && d.data?.kind === 'expr') { try { core.notebook.add({ en: d.data.en, ja: d.data.ja, kind: 'phrase', src: d.data.src || '今日の表現' }); } catch (e) { console.error(e); } core.daylog.addWord(d.data); }   // ホールでもらった表現:勉強ノートにも入れる(ここから「使ってみる」→英語脳へ行ける)
        else if (name === 'app:event' && d?.name === 'learn') { if (d.data?.save) { try { core.notebook.add({ en: d.data.en, ja: d.data.ja, src: d.data.src || 'gamebox' }); core.ui.toast('ノートに入れました'); } catch (e) { } } else core.daylog.addWord(d.data); }   // 出会った単語・文
        else if (name === 'app:event' && d?.name === 'eigo') { try { core.eigo.send(d.data.items || []); core.ui.toast('英語脳を開いています…'); setTimeout(() => core.openGame('eigonou'), 300); } catch (e) { console.error(e); core.ui.toast('英語脳を開けませんでした:' + String(e && e.message || e).slice(0, 80)); } }   // ホールでもらった表現を英語脳で使う
        else if (name === 'app:event' && d?.name === 'bonus') { const n = Math.max(1, d.data?.n | 0), g = core.member.earn('once', 50 * n); if (g) { core.ui.toast(`メダルのごほうび +${g}コイン`); } }   // メダル(勉強を続けた日数)を新しくもらったら、1つにつき50コイン
        else if (name === 'app:event' && d?.name === 'daily') core.review && core.review.open({ mode: 'today' });   // 「今日はここまで」
        else if (name === 'app:event' && d?.name === 'done') core.events.report('gamebox', 'done', d.data || {});   // 家のゲーム機の英語ゲーム(メダルの日数に入る)
        else if (name === 'app:event' && d?.name === 'play') { const p = playOf(d.data?.id); if (p && core.today) core.today.go(p); }   // そら君が勧めた勉強を開く
        else if (name === 'note' && d?.text) core.events.report('town3d', 'word', { en: d.text, ja: d.meaning || '', kind: d.kind === 'quote' ? 'quote' : d.kind === 'sentence' ? 'short' : undefined });
      },
    });
  }
  function stop3D() { document.body.classList.remove('md-app-open'); core.daylog.act('base', null); if (!town) return; try { town.unmount(); } catch (e) { console.error(e); } box.remove(); town = null; box = null; }

  // ゲームを開いている間は3Dの町を止め、閉じたら再開する
  core.events.on((game, name) => { if (name === 'open' && game !== 'town3d' && town) town.pause(); });
  const resume = () => { if (town) town.resume(); };

  return {
    start() { const v = st.get('mode'); if (v && v.keep && v.last) go(v.last); else chooser(); },
    to3D: () => go('3d'),
    resume,
    get is3D() { return !!town; },
  };
}
