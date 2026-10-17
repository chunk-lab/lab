/* ぷにチャンク（apps/cb/src → apps/cb/build.py → punichunk.js）。組み込み口 PuniChunk.mount をそのまま使う */
ChunkTown.register({
  id: 'punichunk', name: 'ぷにチャンク', scripts: ['apps/punichunk.js'],
  mount: function (el, ctx) {
    var s = ctx.settings;
    var g = PuniChunk.mount(el, {
      startScreen: 'title', storage: ctx.storage,
      audio: { bgm: s.bgm, sfx: s.sfx, voice: s.voice, rate: s.rate },
      onEvent: function (n, d) { if (n === 'screen') ctx.showBack(d.name === 'title' || d.name === 'modes' || d.name === 'splash'); }
    });
    ctx.showBack(true);
    return { unmount: function () { g.unmount(); } };
  }
});
