/* 運営画面：URL に ?admin=1 を付けて開くと、設定の下に「運営」ボタンが出る（いまは端末ごと。Supabase につないだら運営のアカウントだけにする）。
   - 会員とお金を試す（有料/無料の切りかえ、ダイヤ・コインを足す、月替わりを試す）
   - 共有の教材の管理（新着→棚へ・見送り・全員から消す、見直しの候補、通報）
   - 課題図書・話題の本の確認（変えるときは data/library.js、数字は core/economy.js） */
import { createStore } from './store.js';
import { ECON, PLAN_NAME } from './economy.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 町のイベント予約(3D側が localStorage の town:events を読む)
const evLoad = () => { try { const v = JSON.parse(localStorage.getItem('town:events')); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
const evSave = v => { try { localStorage.setItem('town:events', JSON.stringify(v)); } catch (e) { } };
const pad = n => String(n).padStart(2, '0');
const localIso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const T3 = () => window.town3d && window.town3d.event;
const ST = { new: '新着(投票中)', shelf: '共有の棚', passed: '見送り' };
export function createAdmin(core) {
  const st = createStore('core');
  try { const q = new URLSearchParams(location.search).get('admin'); if (q === '1') st.set('admin', true); if (q === '0') st.remove('admin'); } catch (e) { }
  const on = () => !!st.get('admin');
  function evSection() {
    const T = T3(), list = evLoad();
    if (!T) return '<section class="cs-adm"><h4>イベント(花火・日食・月食)</h4><p class="cs-note">3Dの町を開いてから、ここを開いてください。</p></section>';
    const opts = Object.entries(T.kinds).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    const fwb = Object.keys(T.fwTypes).map(k => `<button data-ev="fw:${k}">${esc(T.fwTypes[k])}</button>`).join('');
    const now = new Date(Date.now() + 60000);
    return `<section class="cs-adm"><h4>イベント(花火・日食・月食)</h4>
      <p class="cs-note">押すと運営画面が閉じて、町ですぐ始まります(夜に切りかわります)。</p>
      <div class="cs-adm-row"><button data-ev="fw:digest">花火ダイジェスト</button><button data-ev="fw:full">花火フル</button><button data-ev="fw:starmine">スターマイン</button><button data-ev="fw:finale">フィナーレ</button><button data-ev="solar">🌑日食</button><button data-ev="lunar">🌕月食</button></div>
      <p class="cs-note">花火1種類ずつ:</p><div class="cs-adm-row">${fwb}</div>
      <p class="cs-note">予約(この端末の時計で。誕生日は町に登録された誕生日の夜に1回):</p>
      <div class="cs-adm-row"><select id="evK" style="font:inherit;padding:6px">${opts}</select></div>
      <div class="cs-adm-row" style="align-items:center"><input id="evAt" type="datetime-local" value="${localIso(now)}" style="font:inherit;padding:6px"><button data-evadd="date">この日時に予約</button></div>
      <div class="cs-adm-row"><button data-evadd="birthday">みんなの誕生日の夜(20時〜)に予約</button><button data-evadd="soon">30秒後に始める</button></div>
      <ul class="cs-adm-list">${list.map(e => `<li><b>${esc(T.kinds[e.kind] || e.kind)}</b><small>${e.when === 'birthday' ? '誕生日の夜' : esc((e.at || '').replace('T', ' '))}</small><div class="cs-adm-row"><button data-evdel="${esc(e.id)}">消す</button></div></li>`).join('') || '<li class="cs-note">予約はありません</li>'}</ul></section>`;
  }
  function open() {
    const M = core.member, C = core.cloud, B = core.books;
    const items = C.all(), rev = C.reviewList(), reps = C.reports();
    const week = B ? B.weekly().map(b => esc(b.title)).join('、') : '';
    core.ui.sheet(`<h3>運営</h3>
      <section class="cs-adm"><h4>会員とお金(この端末で試す)</h4>
        <p class="cs-note">${PLAN_NAME[M.plan]} ・ コイン ${core.wallet.get()}(月替わりに残せる上限 ${M.coinCapText()}) ・ ダイヤ ${M.gems()} ・ 共有の枠 ${M.slots().length}/${M.slotMax()}</p>
        <div class="cs-adm-row"><button class="cs-btn" data-a="plan">${M.isPaid() ? '無料会員にする' : '有料会員にする'}</button><button class="cs-btn" data-a="month">月替わりを試す</button></div>
        <div class="cs-adm-row" style="align-items:center"><span>💎</span><input id="adG" type="number" inputmode="numeric" value="100" style="width:90px;padding:6px;border-radius:8px;border:2px solid #cbb;font:inherit"><button class="cs-btn" data-a="gems">ダイヤを増やす</button></div>
        <div class="cs-adm-row" style="align-items:center"><span>🪙</span><input id="adC" type="number" inputmode="numeric" value="1000" style="width:90px;padding:6px;border-radius:8px;border:2px solid #cbb;font:inherit"><button class="cs-btn" data-a="coins">コインを増やす</button></div>
        <p class="cs-note">数字を入れて押すと、その数だけ増えます(マイナスで減らせます)。</p></section>
      ${evSection()}
      <section class="cs-adm"><h4>共有の教材(${items.length})</h4>
        ${reps.length ? `<p class="cs-note">通報 ${reps.length}件:${reps.map(r => esc((C.get(r.id) || {}).title || r.id) + '「' + esc(r.why) + '」').join(' / ')}</p>` : ''}
        ${rev.length ? `<p class="cs-note">見直しの候補:${rev.map(x => esc(x.title) + '(' + esc(x.why) + ')').join(' / ')}</p>` : ''}
        <ul class="cs-adm-list">${items.map(x => `<li><b>${esc(x.title)}</b><small>${ST[x.state] || x.state} ・ ${esc(x.author)} ・ 票${x.votes} ・ よかった${x.good}/いまいち${x.bad} ・ 使用${x.uses} ・ id sh:${x.id}</small>
          <div class="cs-adm-row">${x.state !== 'shelf' ? `<button data-s="shelf" data-id="${x.id}">棚へ</button>` : `<button data-s="passed" data-id="${x.id}">棚から外す</button>`}<button data-del="${x.id}">全員から消す</button></div></li>`).join('') || '<li class="cs-note">まだありません</li>'}</ul>
        <p class="cs-note">棚の本を課題図書にするときは、data/library.js の weekly に id(sh:…)を書きます。選ばれた作者へのお礼はダイヤ ${C.RULES.THANKS_GEMS}(課金とつないだら自動)。</p></section>
      <section class="cs-adm"><h4>図書館</h4><p class="cs-note">今週の課題図書:${week || 'なし'}<br>変えるときは data/library.js(週ごとの課題図書・話題の本・出さない本)。</p></section>
      <section class="cs-adm"><h4>数字(core/economy.js)</h4><p class="cs-note">1日:課題 ${ECON.daily.task} ・ CM ${ECON.daily.cm.each}×${ECON.daily.cm.max} ・ ゲーム ${ECON.daily.game}<br>上限:無料 ${ECON.coinCap.free} ・ 有料 なし(もらえる数は無料の${ECON.paidCoinMult}倍) / 枠:無料 ${ECON.slots.free} ・ 有料 ${ECON.slots.paid} / 入れ替え:コイン ${ECON.swap.free.coins} かダイヤ ${ECON.swap.free.gems}<br>AI:有料は月 ${ECON.ai.paidPerMonth} 回、超えたらダイヤ ${ECON.ai.gems} / 実力テスト:無料は週1・有料は1日1、追加ダイヤ ${ECON.test.extraGems}</p></section>`,
      (ov, close) => {
        const re = () => { close(); open(); };
        ov.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
          const a = b.dataset.a;
          if (a === 'plan') M.setPlan(M.isPaid() ? 'free' : 'paid');
          const num = id => Math.trunc(+(ov.querySelector(id) || {}).value) || 0;
          if (a === 'gems') { const n = num('#adG'); if (n > 0) M.addGems(n, 'admin'); else if (n < 0) M.spendGems(Math.min(-n, M.gems()), 'admin'); }
          if (a === 'coins') core.wallet.set(core.wallet.get() + num('#adC'), 'admin');
          if (a === 'month') { const d = new Date(); d.setMonth(d.getMonth() - 1); M._forceMonth(M.keys.monthKey(d)); }
          re();
        });
        ov.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => { const k = b.dataset.ev; close(); setTimeout(() => T3() && T3().run(k), 150); });
        ov.querySelectorAll('[data-evadd]').forEach(b => b.onclick = () => {
          const kind = (ov.querySelector('#evK') || {}).value || 'fw:digest', t = b.dataset.evadd, l = evLoad(), id = 'e' + Date.now().toString(36);
          if (t === 'birthday') l.push({ id, kind, when: 'birthday', hour: 20 });
          else if (t === 'soon') l.push({ id, kind, when: 'date', at: 'soon' + id, _s: Date.now() + 30000 });
          else { const v = (ov.querySelector('#evAt') || {}).value; if (!v) return; l.push({ id, kind, when: 'date', at: v }); }
          evSave(l); re();
        });
        ov.querySelectorAll('[data-evdel]').forEach(b => b.onclick = () => { evSave(evLoad().filter(e => e.id !== b.dataset.evdel)); re(); });
        ov.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { C.setState(b.dataset.id, b.dataset.s); re(); });
        ov.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirmDel(b)) { C.remove(b.dataset.del); re(); } });
      });
  }
  // 2回押しで消す(確認のダイアログは使わない)
  function confirmDel(b) { if (b.dataset.sure) return true; b.dataset.sure = 1; b.textContent = 'もう一度押すと消えます'; return false; }
  return { on, open };
}
