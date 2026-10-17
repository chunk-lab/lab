/* チャンク・カード（apps/cb/cards）。判定・辞書はぷにチャンクの部品を使うので、punichunk.js を先に読む。
   見た目（CSS）は build.py が .ct-cards の中だけに効くように直して cards.js に入れる */
ChunkTown.register({
  id: 'cards', name: 'チャンク・カード', scripts: ['apps/punichunk.js', 'apps/cards.js'],
  mount: function (el, ctx) {
    el.classList.add('ct-cards');
    var root = document.createElement('div'); root.className = 'cc-app'; el.appendChild(root);
    window.ChunkCards.mount(root);
    // タイトル画面（「はじめる」ボタンがある画面）のときだけ「街へ」を出す
    var mo = new MutationObserver(function () { ctx.showBack(!!root.querySelector('#go')); });
    mo.observe(root, { childList: true, subtree: true }); ctx.showBack(true);
    return { unmount: function () { mo.disconnect(); root.remove(); } };
  }
});
