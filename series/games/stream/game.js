/* チャンクストリーム：tools/build_module.py が src/ から out/stream.js（開け閉めできる部品）を作る。
   データ（長文・単語）を先に読む。進める順番5で、共通部品（読む画面・辞書・設定）を使う形に組み直す */
export default {
  id: 'stream', name: 'チャンクストリーム', right: 'game:stream',
  async mount(el, ctx) {
    for (const f of ['data.js', 'pool.js', 'words.js', 'stream.js']) await ctx.loadScript(ctx.base + f);
    return window.StreamApp(el, ctx);
  }
};
