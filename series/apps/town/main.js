/* 街アプリ：真ん中に自宅、周りに学校・図書館・ショップ・ゲームセンター。建物をタップして施設に入る。
   施設の中身は PLACES を書きかえる（game＝games/index.js の id、opts＝ゲームに渡す指定） */
import { createCore } from '../../core/index.js';
import '../../core/ui.css';
import './town.css';
import { GAMES } from '../../games/index.js';

const core = createCore(window.__APP__);
const PLACES = {
  school: { n: '学校', img: 'school', sub: 'チャンクを練習する', items: [{ t: 'チャンクレッスン', game: 'chunkchunk', opts: { face: 'lesson' } }] },
  library: { n: '図書館', img: 'library', sub: '読む・登録する', items: [{ t: 'チャンクリーディング', game: 'chunkchunk', opts: { face: 'library' } }] },
  house: { n: '自宅', img: 'house', profile: true },
  shop: { n: 'ショップ', img: 'supermarket', sub: '有料コンテンツ', items: [] },
  game: { n: 'ゲームセンター', img: 'gamecenter', sub: '遊んで鍛える', items: [
    { t: 'チャンクストリーム', game: 'stream' }, { t: 'ぷにチャンク', game: 'punichunk' },
    { t: 'チャンク・カード', game: 'cards' }, { t: 'チャンクチャンク', game: 'chunkchunk', opts: { face: 'arcade' } }] }
};
const BLD = [['school', 'bSchool', '学校'], ['library', 'bLibrary', '図書館'], ['house', 'bHouse', '自宅'], ['shop', 'bShop', 'ショップ'], ['game', 'bGame', 'ゲームセンター']];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

document.body.insertAdjacentHTML('afterbegin', `<div class="tw-view"><div class="tw-map" id="twMap">${BLD.map(([k, id, alt]) => `<button class="tw-bld" id="${id}" data-k="${k}"><img src="img/${PLACES[k].img}.webp" alt="${alt}"></button>`).join('')}</div></div>
<div class="tw-top"><button class="tw-me" id="twMe"><img alt="" id="twMeImg"><span id="twMeName"></span></button><button class="tw-gear" id="twGear" aria-label="設定">⚙</button></div>`);
const $ = id => document.getElementById(id);
const refreshMe = () => { $('twMeImg').src = core.profile.avatarURL(); $('twMeName').textContent = core.profile.name || 'なまえ未設定'; };
refreshMe();
$('twMe').onclick = () => { core.ui.profile(); };
$('twGear').onclick = () => core.ui.settings();
document.addEventListener('change', e => { if (e.target && e.target.id === 'cs-name') setTimeout(refreshMe, 0); });

const fit = () => { const m = $('twMap'), vh = innerHeight, mh = m.offsetHeight; m.style.top = (mh <= vh ? vh - mh : Math.min(0, Math.max(vh - mh, vh / 2 - mh * .48))) + 'px'; };
addEventListener('resize', fit); fit();

function enter(k) {
  const p = PLACES[k];
  if (p.profile) { core.ui.profile(); return; }
  if (p.items.length === 1) { core.host.open(GAMES[p.items[0].game], p.items[0].opts); return; }
  core.ui.sheet(`<header class="tw-head"><img src="img/${p.img}.webp" alt=""><div><h3>${esc(p.n)}</h3><p>${esc(p.sub)}</p></div></header>` +
    (p.items.length ? `<ul class="tw-list">${p.items.map((it, i) => `<li><button data-i="${i}">${esc(it.t)}<small>入る ›</small></button></li>`).join('')}</ul>` : '<p class="cs-note">売っているものは、まだありません。</p>'),
    (ov, close) => ov.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => { const it = p.items[+b.dataset.i]; close(); core.host.open(GAMES[it.game], it.opts); }));
}
document.querySelectorAll('.tw-bld').forEach(b => b.addEventListener('click', () => { b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); setTimeout(() => enter(b.dataset.k), 260); }));
core.onClose = () => refreshMe();
