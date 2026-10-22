/* 街アプリ：真ん中に自宅、周りに学校・図書館・ショップ・ゲームセンター。建物をタップして施設に入る。
   施設の中身は PLACES を書きかえる（game＝games/index.js の id、opts＝ゲームに渡す指定） */
import { createCore } from '../../core/index.js';
import '../../core/ui.css';
import './town.css';
import { GAMES } from '../../games/index.js';
import { createTour } from './tour.js';
import './tour.css';
import { PHRASES } from './phrases.js';
import { createStore } from '../../core/store.js';
import { createMode } from './mode.js';

const core = createCore(window.__APP__);
const PLACES = {
  school: { n: '学校', img: 'school', sub: 'チャンクを練習する', items: [{ t: 'チャンクレッスン', game: 'chunkchunk', opts: { face: 'lesson' } }] },
  library: { n: '図書館', img: 'library', sub: '読む・登録する', items: [{ t: 'チャンクリーディング', game: 'chunkchunk', opts: { face: 'library' } }, { t: '英語脳アプリ', game: 'eigonou' }] },
  house: { n: '自宅', img: 'house', profile: true },
  shop: { n: 'ショップ', img: 'supermarket', sub: '有料コンテンツ', items: [] },
  game: { n: 'ゲームセンター', img: 'gamecenter', sub: '遊んで鍛える', items: [
    { t: 'チャンクストリーム', game: 'stream' }, { t: 'ぷにチャンク', game: 'punichunk' },
    { t: 'チャンク・カード', game: 'cards' }, { t: 'チャンクチャンク', game: 'chunkchunk', opts: { face: 'arcade' } }] }
};
const BLD = [['school', 'bSchool', '学校'], ['library', 'bLibrary', '図書館'], ['house', 'bHouse', '自宅'], ['shop', 'bShop', 'ショップ'], ['game', 'bGame', 'ゲームセンター']];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

document.body.insertAdjacentHTML('afterbegin', `<div class="tw-view"><div class="tw-map" id="twMap">${BLD.map(([k, id, alt]) => `<button class="tw-bld" id="${id}" data-k="${k}"><img src="img/${PLACES[k].img}.webp" alt="${alt}"></button>`).join('')}<button class="tw-tree" id="twTree" aria-label="木"></button></div></div>
<div class="tw-top"><button class="tw-me" id="twMe"><img alt="" id="twMeImg"><span id="twMeName"></span></button><div class="tw-right"><span class="tw-coin" id="twCoin"></span><button class="tw-gear" id="twTo3d" aria-label="3Dの町へ">🏙</button><button class="tw-gear tw-help" id="twHelp" aria-label="街のツアー">？</button><button class="tw-gear" id="twGear" aria-label="設定">⚙</button></div></div>`);

const $ = id => document.getElementById(id);
const refreshMe = () => { $('twMeImg').src = core.profile.avatarURL(); $('twMeName').textContent = core.profile.name || 'なまえ未設定'; };
refreshMe();
const showCoin = () => { $('twCoin').textContent = '🪙 ' + core.wallet.get(); }; showCoin(); core.wallet.onChange(showCoin);
$('twMe').onclick = () => { core.ui.profile(); };
$('twGear').onclick = () => core.ui.settings();
const tour = createTour(core);
$('twHelp').onclick = () => tour.menu();
document.addEventListener('change', e => { if (e.target && e.target.id === 'cs-name') setTimeout(refreshMe, 0); });

const fit = () => { const m = $('twMap'), vh = innerHeight, mh = m.offsetHeight; m.style.top = (mh <= vh ? vh - mh : Math.min(0, Math.max(vh - mh, vh / 2 - mh * .48))) + 'px'; };
addEventListener('resize', fit); fit();

function enter(k) {
  const p = PLACES[k];
  if (p.profile) { core.ui.profile(); return; }
  if (p.items.length === 1) { tour.entering(p.items[0].game, p.items[0].opts); core.host.open(GAMES[p.items[0].game], p.items[0].opts); return; }
  core.ui.sheet(`<header class="tw-head"><img src="img/${p.img}.webp" alt=""><div><h3>${esc(p.n)}</h3><p>${esc(p.sub)}</p></div></header>` +
    (p.items.length ? `<ul class="tw-list">${p.items.map((it, i) => `<li><button data-i="${i}">${esc(it.t)}<small>入る ›</small></button></li>`).join('')}</ul>` : '<p class="cs-note">売っているものは、まだありません。<br>家具は、3Dの町のショップで買えます。</p>'),
    (ov, close) => ov.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => { const it = p.items[+b.dataset.i]; close(); tour.entering(it.game, it.opts); core.host.open(GAMES[it.game], it.opts); }));
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
const mode = createMode(core, { GAMES, enter, start2D: () => { fit(); tour.auto(); } });
$('twTo3d').onclick = () => mode.to3D();
mode.start();
