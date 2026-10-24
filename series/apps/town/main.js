/* 街アプリ：真ん中に自宅、周りに学校・図書館・ショップ・ゲームセンター。建物をタップして施設に入る。
   施設の中身は PLACES を書きかえる（game＝games/index.js の id、opts＝ゲームに渡す指定） */
import { createCore } from '../../core/index.js';
import '../../core/ui.css';
import './town.css';
import { GAMES } from '../../games/index.js';
import { createBooks } from '../../games/library/books.js';
import { PLAYS, WANTS } from '../../core/plays.js';
import { createTour } from './tour.js';
import './tour.css';
import { PHRASES } from './phrases.js';
import { createStore } from '../../core/store.js';
import { createMode } from './mode.js';

const core = createCore(window.__APP__);
core.openGame = (g, o) => { if (GAMES[g]) core.host.open(GAMES[g], o || {}); };
core.books = createBooks(core);
/* 施設：中身は遊びの属性表(core/plays.js)の place から作る（2Dも3Dも同じ）。extra は表にない入口 */
const PLACES = {
  school: { n: '学校', img: 'school', sub: '勉強する(身につける)', extra: [] },
  library: { n: '図書館', img: 'library', sub: '読む・調べる・登録する', extra: [{ t: 'My Texts・短文の登録と共有', game: 'chunkchunk', opts: { face: 'library' } }] },
  house: { n: '自宅', img: 'house', profile: true },
  shop: { n: 'ショップ', img: 'supermarket', sub: '買う', shop: true },
  game: { n: 'ゲームセンター', img: 'gamecenter', sub: 'ゲームで鍛える', extra: [{ t: 'チャンクストリーム(タイムアタック・単語練習)', game: 'stream' }] },
};
const BLD = [['school', 'bSchool', '学校'], ['library', 'bLibrary', '図書館'], ['house', 'bHouse', '自宅'], ['shop', 'bShop', 'ショップ'], ['game', 'bGame', 'ゲームセンター']];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

document.body.insertAdjacentHTML('afterbegin', `<div class="tw-view"><div class="tw-map" id="twMap">${BLD.map(([k, id, alt]) => `<button class="tw-bld" id="${id}" data-k="${k}"><img src="img/${PLACES[k].img}.webp" alt="${alt}"></button>`).join('')}<button class="tw-tree" id="twTree" aria-label="木"></button></div></div>
<div class="tw-top"><button class="tw-me" id="twMe"><img alt="" id="twMeImg"><span id="twMeName"></span></button><div class="tw-right"><span class="tw-coin" id="twCoin"></span><button class="tw-gear" id="twTo3d" aria-label="3Dの町へ">🏙</button><button class="tw-gear tw-help" id="twHelp" aria-label="街のツアー">？</button><button class="tw-gear" id="twGear" aria-label="設定">⚙</button></div></div>`);

const $ = id => document.getElementById(id);
const refreshMe = () => { $('twMeImg').src = core.profile.avatarURL(); $('twMeName').textContent = core.profile.name || 'なまえ未設定'; };
refreshMe();
const fmtN = n => { n = Math.floor(+n) || 0; return n >= 100000 ? '10万↑' : n >= 10000 ? (Math.floor(n / 1000) / 10) + '万' : String(n); };   // 1万以上は1.2万、10万以上は10万↑
const showCoin = () => { $('twCoin').textContent = '🪙 ' + fmtN(core.wallet.get()) + ' 💎 ' + fmtN(core.member.gems()); }; showCoin(); core.wallet.onChange(showCoin); core.member.onChange(showCoin);
$('twMe').onclick = () => openStudy();
// 勉強部屋：自宅とアバターから開く。中の「練習する」などは、街と同じしくみでゲームを開く
function openStudy() { core.study.open({ play: core.openGame, has: g => !!GAMES[g] }); }
$('twGear').onclick = () => core.ui.settings();
const tour = createTour(core);
$('twHelp').onclick = () => tour.menu();
document.addEventListener('change', e => { if (e.target && e.target.id === 'cs-name') setTimeout(refreshMe, 0); });

const fit = () => { const m = $('twMap'), vh = innerHeight, mh = m.offsetHeight; m.style.top = (mh <= vh ? vh - mh : Math.min(0, Math.max(vh - mh, vh / 2 - mh * .48))) + 'px'; };
addEventListener('resize', fit); fit();

function enter(k) {
  const p = PLACES[k];
  if (p.profile) { openStudy(); return; }
  if (p.shop) { shop(); return; }
  const plays = PLAYS.filter(x => x.place === k && (x.go.to === 'test' || x.go.to === 'note' || (x.go.game && GAMES[x.go.game])));
  const groups = WANTS.map(w => [w, plays.filter(x => x.want === w.k)]).filter(g => g[1].length);
  const items = [...plays.map(x => ({ t: x.n, play: x })), ...p.extra.filter(x => GAMES[x.game])];
  core.ui.sheet(`<header class="tw-head"><img src="img/${p.img}.webp" alt=""><div><h3>${esc(p.n)}</h3><p>${esc(p.sub)}</p></div></header>` +
    groups.map(([w, l]) => `<p class="tw-grp">${esc(w.n)}</p><ul class="tw-list">${l.map(x => `<li><button data-i="${items.findIndex(it => it.play === x)}">${esc(x.n)}<small>${{ study: '勉強', both: '勉強・ゲーム', game: 'ゲーム', any: '' }[x.mood]} ›</small></button></li>`).join('')}</ul>`).join('') +
    (p.extra.length ? `<p class="tw-grp">ほかの入口</p><ul class="tw-list">${items.filter(it => !it.play).map(it => `<li><button data-i="${items.indexOf(it)}">${esc(it.t)}<small>入る ›</small></button></li>`).join('')}</ul>` : ''),
    (ov, close) => ov.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => {
      const it = items[+b.dataset.i]; close();
      if (it.play) { if (it.play.go.game) tour.entering(it.play.go.game, it.play.go.opts); core.today.go(it.play); }
      else { tour.entering(it.game, it.opts); core.openGame(it.game, it.opts); }
    }));
}
// ショップ：コインとダイヤ。家具は3Dの町のショップ、アバターは作り直し中
function shop() {
  const M = core.member;
  core.ui.sheet(`<header class="tw-head"><img src="img/supermarket.webp" alt=""><div><h3>ショップ</h3><p>買う</p></div></header>
    <ul class="cs-stat"><li><span>コイン</span><b>${core.wallet.get()}</b></li><li><span>ダイヤ</span><b>${M.gems()}</b></li><li><span>会員</span><b>${M.isPaid() ? '有料会員' : '無料会員'}</b></li></ul>
    <p class="cs-note">・ダイヤと有料会員は、アプリにしたときにストアの課金とつなぎます。<br>・家具は3Dの町のショップで買えます(コイン)。<br>・ダイヤ教材(出版社などの正式な教材)は図書館に並びます。<br>・有料アバターは、アバターの作り直しのあとに並びます。${M.isPaid() ? '有料会員は月に1回、その月のアバターを枠に入れられます。' : ''}</p>
    ${mode.has3D !== false ? '<button class="cs-btn" data-3d>3Dの町のショップへ</button>' : ''}`, (ov, close) => { const b = ov.querySelector('[data-3d]'); if (b) b.onclick = () => { close(); mode.to3D(); }; });
}
document.querySelectorAll('.tw-bld').forEach(b => b.addEventListener('click', () => { tour.tapped(b.dataset.k); b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); setTimeout(() => enter(b.dataset.k), 260); }));
core.onClose = () => { refreshMe(); if (mode.is3D) mode.resume(); else tour.afterClose(); };

/* ひみつ：街の真ん中の木。タップするとりんごが落ちて、「今日のフレーズ」が出る（1日ひとつ。集めたフレーズも見られる） */
const tstore = createStore('town');
function dayNo() { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5); }
$('twTree').onclick = () => {
  const m = $('twMap'), t = $('twTree');
  for (let i = 0; i < 9; i++) {
    const l = document.createElement('span'); l.className = 'tw-leaf'; l.textContent = '🍎';
    l.style.left = (44 + Math.random() * 12) + '%'; l.style.top = (58 + Math.random() * 4) + '%';
    l.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px'); l.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
    l.style.animationDelay = (i * 0.07) + 's'; m.appendChild(l); setTimeout(() => l.remove(), 2200);
  }
  const idx = dayNo() % PHRASES.length, [en, ja] = PHRASES[idx];
  const v = Object.assign({ seen: false, got: {} }, tstore.get('tree') || {});
  const first = !v.seen; v.seen = true; v.got[idx] = 1; tstore.set('tree', v);
  const n = Object.keys(v.got).length;
  setTimeout(() => core.ui.sheet(`<h3>🍎 今日のフレーズ</h3><div class="tw-phrase">${first ? '<div class="secret">ひみつを見つけた！ りんごが落ちてきたよ</div>' : ''}<div class="en">${esc(en)}</div><div class="ja">${esc(ja)}</div>
    <button class="cs-btn" id="twSay">🔊 聞く</button><div class="cnt">あつめたフレーズ ${n} / ${PHRASES.length}　（毎日ちがうフレーズが出るよ）</div>
    <button class="cs-btn" id="twGotBtn">あつめたフレーズを見る</button><ul class="tw-got" id="twGot" hidden>${Object.keys(v.got).map(Number).sort((a, b) => a - b).map(i => `<li><b>${esc(PHRASES[i][0])}</b>　${esc(PHRASES[i][1])}</li>`).join('')}</ul></div>`,
    (ov) => { ov.querySelector('#twSay').onclick = () => { try { core.speech.speak(en, { rate: .9 }); } catch (e) { } }; ov.querySelector('#twGotBtn').onclick = () => { ov.querySelector('#twGot').hidden = false; }; }), 500);
};
/* はじめに「3Dの町」か「2Dの地図」かを選ぶ（apps/town/mode.js） */
const mode = createMode(core, { GAMES, enter, openStudy, start2D: () => { fit(); tour.auto(); } });
$('twTo3d').onclick = () => mode.to3D();
core.to3D = () => mode.to3D();
// 今日なにする?（2Dでも3Dでも、画面の下のまん中）と、おしゃべり（住人がいる3Dの町へ）
document.body.insertAdjacentHTML('beforeend', '<div class="tw-dock"><button class="tw-today" id="twToday">今日なにする?</button><button class="tw-chat" id="twChat" aria-label="住人とおしゃべり">💬</button></div>');
$('twToday').onclick = () => core.today.open({ has: g => !!GAMES[g] });
$('twChat').onclick = () => { if (mode.is3D) core.ui.toast('住人に近づいて、話しかけてみよう'); else { core.ui.toast('3Dの町で、住人に話しかけてみよう'); mode.to3D(); } };
mode.start();
