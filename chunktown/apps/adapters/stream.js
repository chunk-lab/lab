/* チャンクストリーム（apps/stream/src → build.py で apps/stream.js に包む）。データは先に読む */
ChunkTown.register({
  id: 'stream', name: 'チャンクストリーム',
  scripts: ['apps/stream/data.js', 'apps/stream/pool.js', 'apps/stream/words.js', 'apps/stream.js'],
  mount: function (el, ctx) { return window.StreamApp(el, ctx); }
});
