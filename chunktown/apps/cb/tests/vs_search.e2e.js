const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/cb/out/chunkcards.html'); await p.waitForTimeout(500);
  const out = await p.evaluate((N) => {
    const K = window.ChunkKit, S = window.ChunkVS._search, res = [];
    for (let i = 0; i < N; i++) {
      const deck = K.starterDeck(); for (let j = 0; j < 25; j++) { const c = K.randomCard(); if (c) deck.push(c); }
      const R = { lv: {}, hand: [], row: [], draw: K.shuffle(deck), disc: [] }; K.setR(R); K.fillTo(8);
      const lv = i % 3; const t0 = performance.now(); const r = S(R.hand, null, lv); const ms = performance.now() - t0;
      res.push({ lv, ms: Math.round(ms), n: r && r.n, score: r ? r.score : 0, text: r ? r.ev.text : '-', hand: R.hand.map(K.cardText).join(' ') });
    }
    return res;
  }, +(process.argv[2] || 12));
  out.forEach(r => console.log(r.lv, r.ms + 'ms', r.n, r.score, '|', r.text, '|', r.hand));
  for (const lv of [0, 1, 2]) { const a = out.filter(r => r.lv === lv).map(r => r.score).sort((x, y) => x - y); console.log('lv', lv, 'scores', a.join(',')); }
  console.log('errors', errs); await b.close();
})();
