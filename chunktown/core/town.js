/* ===== チャンクタウン：街の画面（一枚絵・建物・施設のメニュー） =====
 施設の中身は PLACES を書きかえる。app はアダプタ（apps/adapters）で登録した id */
(function () {
  'use strict';
  var PLACES = {
    school: { n: '学校', img: 'school', sub: 'チャンクチャンクで学ぶ', items: [{ t: 'チャンクチャンク（スタディ）', app: 'chunkchunk', opts: { go: 'study' } }] },
    library: { n: '図書館', img: 'library', sub: '読む・調べる', items: [{ t: 'リーディング（チャンクチャンク）', app: 'chunkchunk', opts: { go: 'study' } }] },
    house: { n: '自宅', img: 'house', sub: 'アバター・マイページ', items: [{ t: 'アバター・マイページ', app: 'chunkchunk', opts: { go: 'avatar' } }] },
    shop: { n: 'ショップ', img: 'supermarket', sub: '有料コンテンツ', items: [] },
    game: { n: 'ゲームセンター', img: 'gamecenter', sub: '遊んで鍛える', items: [
      { t: 'チャンクストリーム', app: 'stream' },
      { t: 'ぷにチャンク', app: 'punichunk' },
      { t: 'チャンク・カード', app: 'cards' },
      { t: 'チャンクチャンク（ゲーム）', app: 'chunkchunk', opts: { go: 'game' } }] }
  };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function fit() { var m = $('ctMap'), vh = innerHeight, mh = m.offsetHeight; m.style.top = (mh <= vh ? vh - mh : Math.min(0, Math.max(vh - mh, vh / 2 - mh * .48))) + 'px'; }
  function sheet(k) {
    var p = PLACES[k], ov = $('ctOv');
    if (p.items.length === 1) { ChunkTown.open(p.items[0].app, p.items[0].opts); return; }
    ov.innerHTML = '<div class="ct-sheet" role="dialog" aria-label="' + esc(p.n) + '"><header><img src="img/' + p.img + '.webp" alt=""><div><h2>' + esc(p.n) + '</h2><p>' + esc(p.sub) + '</p></div></header>' +
      (p.items.length ? '<ul>' + p.items.map(function (it, i) { return '<li><button data-i="' + i + '">' + esc(it.t) + '<small>入る ›</small></button></li>'; }).join('') + '</ul>' : '<p class="ct-note">売っているものは、まだありません。</p>') +
      '<button class="ct-close" id="ctCl">街にもどる</button></div>';
    ov.hidden = false;
    $('ctCl').onclick = close;
    ov.querySelectorAll('button[data-i]').forEach(function (b) { b.onclick = function () { var it = p.items[+b.dataset.i]; close(); ChunkTown.open(it.app, it.opts); }; });
  }
  function close() { var ov = $('ctOv'); ov.hidden = true; ov.innerHTML = ''; }
  document.addEventListener('DOMContentLoaded', function () {
    addEventListener('resize', fit); fit();
    $('ctOv').addEventListener('click', function (e) { if (e.target === $('ctOv')) close(); });
    document.querySelectorAll('.ct-bld').forEach(function (b) {
      b.addEventListener('click', function () { b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); setTimeout(function () { sheet(b.dataset.k); }, 260); });
    });
  });
})();
