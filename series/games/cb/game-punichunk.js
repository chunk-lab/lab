/* ぷにチャンク：もとのビルド（lib/punichunk.js）の組み込み口 PuniChunk.mount を使う。
   セーブ・音量・読み上げは共通部品から渡す。結果は report で共通のしくみに知らせる。 */
export default {
  id: 'punichunk', name: 'ぷにチャンク', right: 'game:punichunk',
  async mount(el, ctx) {
    await ctx.loadScript(ctx.core.base + 'lib/punichunk.js');
    const s = ctx.settings, audio = () => ({ bgm: s.get('bgm'), sfx: s.get('sfx'), voice: s.get('voice'), rate: s.get('rate') });
    const g = window.PuniChunk.mount(el, {
      startScreen: 'title', storage: ctx.store, audio: audio(),
      onEvent: (n, d) => {
        if (n === 'screen') ctx.showBack(['title', 'modes', 'splash'].includes(d.name));
        if (n === 'result') ctx.report('result', { mode: d.mode, score: d.score });
      }
    });
    const off = s.onChange(() => { try { g.setAudio(audio()); } catch (e) { } });
    ctx.showBack(true);
    return { unmount() { off(); g.unmount(); } };
  }
};
