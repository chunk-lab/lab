/* いまはまだ部品になっていないアプリ（ステップ2・3で、ほかと同じ組み込み口に作り直す）
   ・チャンクストリーム … /home/claude/game（長文ゲーム）のビルド結果を apps/stream/ に入れて表示
   ・チャンクチャンク …… apps/chunkchunk/（?go=study|game|avatar で開く画面を指定） */
['stream', 'chunkchunk'].forEach(function (id) {
  ChunkTown.register({
    id: id, name: id,
    mount: function (el, ctx) {
      var f = document.createElement('iframe'), go = ctx.opts.go;
      f.src = 'apps/' + id + '/index.html' + (go ? '?go=' + go : ''); f.allow = 'fullscreen; autoplay';
      el.appendChild(f); ctx.showBack(true);
      return { unmount: function () { f.src = 'about:blank'; } };
    }
  });
});
