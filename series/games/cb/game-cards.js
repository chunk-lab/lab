/* チャンク・カード：判定・辞書はぷにチャンクの部品（lib/punichunk.js）を使う。
   見た目は tools/series_build.py が .ct-cards の中だけに効くように直して cards.js に入れてある。 */
export default {
  id: 'cards', name: 'チャンク・カード', right: 'game:cards',
  async mount(el, ctx) {
    await ctx.loadScript(ctx.core.base + 'lib/punichunk.js');
    await ctx.loadScript(ctx.base + 'cards.js');
    el.classList.add('ct-cards');
    const root = document.createElement('div'); root.className = 'cc-app'; el.appendChild(root);
    window.ChunkCards.mount(root);
    const mo = new MutationObserver(() => ctx.showBack(!!root.querySelector('#go')));   /* タイトル画面のときだけ「戻る」 */
    mo.observe(root, { childList: true, subtree: true }); ctx.showBack(true);
    return { unmount() { mo.disconnect(); root.remove(); } };
  }
};
