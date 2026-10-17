/* チャンクチャンク（いまは元のページを枠の中で表示。進める順番4で、学校・図書館・ゲームセンターに分けて組み直す）
   opts.go = 'study' | 'game' で開く画面を指定 */
export default {
  id: 'chunkchunk', name: 'チャンクチャンク', right: 'game:chunkchunk',
  async mount(el, ctx) {
    const f = document.createElement('iframe');
    f.src = ctx.base + 'index.html' + (ctx.opts.go ? '?go=' + ctx.opts.go : ''); f.allow = 'fullscreen; autoplay';
    el.appendChild(f); ctx.showBack(true);
    return { unmount() { f.src = 'about:blank'; } };
  }
};
