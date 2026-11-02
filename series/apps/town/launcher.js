/* 🎮 ぜんぶの入口：3Dの町から、歩かずに何にでも1タップで飛べる一覧。
   大分類は「場所」（建物）。4つのアプリは色つき、町の暮らしはグレー。小分類ごとに見出しの帯で区切る。
   開き方 kind：play=遊びの属性表(core/plays.js)の id ／ game=ゲームを直接 ／ app=3Dの町のアプリ ／ study=勉強ノート */
import { playOf } from '../../core/plays.js';

const SECS = [
  { k: 'cc', tab: '今スラ！', icon: '🏫', title: '学校', app: '今スラ！', color: '#2d6be0', groups: [
    { h: '基礎', items: [{ t: 'レッスン', i: '📘', kind: 'game', game: 'chunkchunk', opts: { face: 'lesson' } }] },
    { h: 'スピード・力だめし', note: '同じ「ゲームセンター」画面から選びます', items: [
      { t: 'さらさら', i: '🌊', kind: 'game', game: 'chunkchunk', opts: { face: 'arcade' } },
      { t: 'よーいどん', i: '🏁', kind: 'game', game: 'chunkchunk', opts: { face: 'arcade' } },
      { t: 'チャレンジ', i: '⏱', kind: 'play', id: 'cc.game' }] },
    { h: '確かめる・復習', items: [
      { t: '実力テスト', i: '📝', kind: 'play', id: 'test' },
      { t: 'まちがえた言葉のやり直し', i: '🔁', kind: 'play', id: 'note.practice' }] },
    { h: '読む', items: [{ t: 'リーディング', i: '📖', kind: 'play', id: 'cc.read' }] },
  ] },
  { k: 'eigo', tab: '英ラボ', icon: '📚', title: '図書館', app: '英文組み立てラボ', color: '#0f9ea0', groups: [
    { h: '英文組み立てラボ', items: [
      { t: '文を組み立てる', i: '🧩', kind: 'play', id: 'eigo' },
      { t: '気になる言葉を調べる', i: '🔎', kind: 'play', id: 'eigo.dict' },
      { t: '熟語・句動詞', i: '🗝', kind: 'play', id: 'eigo.prac' }] },
    { h: '課題図書・登録', items: [
      { t: '課題図書', i: '📕', kind: 'play', id: 'lib.weekly' },
      { t: 'My Texts（短文の登録）', i: '✏️', kind: 'game', game: 'chunkchunk', opts: { face: 'library' } }] },
  ] },
  { k: 'story', tab: 'Storyミング！', icon: '🎬', title: '映画館', app: 'Storyミング！', color: '#df7a1a', groups: [
    { h: '作品・タイムアタック', items: [{ t: 'Storyミング！', i: '🎞', kind: 'game', game: 'stream' }] },
    { h: '単語・長文', items: [
      { t: '単語練習', i: '🔤', kind: 'play', id: 'stream.word' },
      { t: '長文を読む', i: '📜', kind: 'play', id: 'stream.read' }] },
  ] },
  { k: 'fish', tab: 'イングフィッシュ', icon: '🎣', title: '池', app: 'イングフィッシュ', color: '#1d8fe0', groups: [
    { h: '釣る', items: [
      { t: '普通の釣り', i: '🎣', kind: 'app', app: 'fishing', params: {} },
      { t: '英語の釣り', i: '🐟', kind: 'app', app: 'fishing', params: { tab: 'en' } }] },
    { h: '勝負・水槽', items: [
      { t: '砂吹さんと勝負', i: '⚔️', kind: 'app', app: 'fishing', params: { vs: 'easy' } },
      { t: '水槽', i: '🐠', kind: 'app', app: 'fishing', params: { tab: 'tank' } }] },
  ] },
  { k: 'etc', tab: 'ほか', icon: '🏘', title: 'ほかの場所', app: '', color: '#6b7488', groups: [
    { h: 'ゲーム', items: [
      { t: 'アミューズメントセンター', i: '🎮', kind: 'app', app: 'amuse', params: {} },
      { t: 'チャンク・カード', i: '🃏', kind: 'play', id: 'cards' },
      { t: 'ランダムチャンク（聞き取り）', i: '🎧', kind: 'play', id: 'listen' }] },
    { h: '買い物と家', items: [
      { t: 'ショップ', i: '🛒', kind: 'app', app: 'shop', params: {} },
      { t: '自宅', i: '🏠', kind: 'app', app: 'home', params: {} }] },
    { h: '占い・お参り', items: [
      { t: '占いの館', i: '🔮', kind: 'app', app: 'fortune', params: {} },
      { t: 'おみくじ', i: '⛩', kind: 'app', app: 'omikuji', params: {} }] },
    { h: 'お店・きろく', items: [
      { t: 'カフェ', i: '☕', kind: 'app', app: 'cafe', params: {} },
      { t: 'アルバム', i: '🖼', kind: 'app', app: 'album', params: {} },
      { t: '掲示板', i: '📌', kind: 'app', app: 'board', params: {} },
      { t: '勉強ノート', i: '📓', kind: 'study' }] },
    { h: '住人', note: '住人とのおしゃべり・大喜利・散歩は、町で住人に話しかけてね', items: [] },
  ] },
];

const CSS = `
.lc-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(30,24,50,.55);display:flex;align-items:flex-end;justify-content:center;font-family:inherit}
.lc-sh{background:#faf8ff;color:#3d3452;width:min(560px,100%);max-height:88vh;border-radius:22px 22px 0 0;display:flex;flex-direction:column;overflow:hidden}
.lc-hd{flex:none;display:flex;align-items:center;gap:8px;padding:12px 14px 4px;font-weight:900;font-size:17px}.lc-hd span{flex:1}
.lc-x{border:0;background:#ece7f6;border-radius:999px;width:34px;height:34px;font-size:16px;cursor:pointer}
.lc-tabs{flex:none;display:flex;gap:6px;overflow-x:auto;padding:6px 14px 8px;scrollbar-width:none}.lc-tabs::-webkit-scrollbar{display:none}
.lc-tab{flex:none;border:0;border-radius:999px;padding:7px 12px;font:inherit;font-size:13px;font-weight:800;color:#fff;cursor:pointer}
.lc-body{overflow-y:auto;overscroll-behavior:contain;padding:4px 14px 10px;scroll-behavior:smooth}
.lc-sec{margin:6px 0 14px}.lc-sh2{display:flex;align-items:center;gap:8px;border-radius:14px;padding:10px 12px;color:#fff;font-weight:900}
.lc-sh2 small{font-weight:700;opacity:.9;margin-left:auto;font-size:12px}
.lc-g{margin:8px 0 2px;padding-left:8px;font-size:12px;font-weight:900;color:var(--c);border-left:4px solid var(--c)}
.lc-n{font-size:11px;color:#8d7f9e;margin:2px 0 0 12px}
.lc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px;margin-top:6px}
.lc-it{border:2px solid var(--c);background:#fff;border-radius:14px;padding:10px 6px;font:inherit;font-size:13px;font-weight:800;color:#3d3452;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;min-height:74px;line-height:1.3}
.lc-it b{font-size:22px;font-weight:400}.lc-it:active{background:var(--c);color:#fff}
.lc-ft{flex:none;padding:8px 14px calc(10px + env(safe-area-inset-bottom));border-top:1px solid #e6e0f2;display:flex;gap:8px}
.lc-ft button{flex:1;border:0;border-radius:14px;padding:12px;font:inherit;font-weight:900;cursor:pointer;background:#ece7f6;color:#3d3452}
`;

export function createLauncher(core, { openApp, to2D, openStudy }) {
  let ov = null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const itemOk = it => it.kind === 'play' ? !!playOf(it.id) : true;
  function run(it) {
    close();
    if (it.kind === 'play') core.today.go(playOf(it.id));
    else if (it.kind === 'game') core.openGame(it.game, it.opts || {});
    else if (it.kind === 'app') openApp(it.app, it.params || {});
    else if (it.kind === 'study') openStudy();
  }
  function close() { if (ov) { ov.remove(); ov = null; } }
  function open() {
    if (ov) return;
    if (!document.getElementById('lc-css')) { const s = document.createElement('style'); s.id = 'lc-css'; s.textContent = CSS; document.head.appendChild(s); }
    const all = [];
    const body = SECS.map(s => `<section class="lc-sec" id="lc-${s.k}" style="--c:${s.color}">
      <div class="lc-sh2" style="background:${s.color}"><span>${s.icon} ${esc(s.title)}</span><small>${esc(s.app)}</small></div>
      ${s.groups.map(g => `<div class="lc-g">${esc(g.h)}</div>${g.note ? `<div class="lc-n">${esc(g.note)}</div>` : ''}${g.items.length ? `<div class="lc-grid">${g.items.filter(itemOk).map(it => { all.push(it); return `<button class="lc-it" data-i="${all.length - 1}"><b>${it.i}</b>${esc(it.t)}</button>`; }).join('')}</div>` : ''}`).join('')}
    </section>`).join('');
    ov = document.createElement('div'); ov.className = 'lc-ov';
    ov.innerHTML = `<div class="lc-sh" role="dialog"><div class="lc-hd"><span>🎮 どこへ行く？</span><button class="lc-x" aria-label="とじる">✕</button></div>
      <div class="lc-tabs">${SECS.map(s => `<button class="lc-tab" data-t="${s.k}" style="background:${s.color}">${esc(s.tab)}</button>`).join('')}</div>
      <div class="lc-body">${body}</div>
      <div class="lc-ft"><button data-2d>2Dの画面へ（勉強部屋）</button></div></div>`;
    document.body.appendChild(ov);
    ov.onclick = e => {
      if (e.target === ov || e.target.closest('.lc-x')) return close();
      const t = e.target.closest('[data-t]'); if (t) { const el = ov.querySelector('#lc-' + t.dataset.t), bd = ov.querySelector('.lc-body'); if (el) bd.scrollTop = el.offsetTop - bd.offsetTop - 4; return; }
      if (e.target.closest('[data-2d]')) { close(); to2D(); return; }
      const b = e.target.closest('[data-i]'); if (b) run(all[+b.dataset.i]);
    };
  }
  return { open, close };
}
