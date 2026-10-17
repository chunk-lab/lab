// タネ文(ゲームが内部で想定した文)を、盤面にある単語だけで実際の操作で組めるか確かめる
// node tests/seedplay.e2e.js <level> <boards> [out.json]
const { open } = require('./e2e_lib');
const LEVEL = +(process.argv[2] || 0), BOARDS = +(process.argv[3] || 4), OUT = process.argv[4];
(async () => {
  const { browser, page, errors } = await open(390, 844);
  const res = [];
  await page.evaluate(([l]) => { const a = window.game._app; a.state.tutorialDone = true; a.state.level = l; a.saveState(); }, [LEVEL]);
  for (let b = 0; b < BOARDS; b++) {
    await page.evaluate(() => window.game.show('game', 'free')); await page.waitForTimeout(9000);
    await page.evaluate(() => { const g = window.game._app.game; g.calm = true; window.__ev = []; const a = window.game._app; if (!a.__w) { const o = a.emit; a.emit = (n, d) => { window.__ev.push({ n, text: d && (d.text || (d.chunk && PuniChunk._internal.G.chunkText(d.chunk, window.game._app.game.debug.cfg))) || '', perfect: d && d.perfect, code: d && d.code, id: d && d.item && d.item.id }); o(n, d); }; a.__w = 1; } });
    const seeds = await page.evaluate(() => window.game._app.game.debug.supply.seedInfo());
    for (const sd of seeds) {
      const has = await page.evaluate(sd => { const g = window.game._app.game; const out = []; g.items.forEach(i => { if (i.state === 'pop' || i.slot) return; (i.word ? [i.word] : (i.chunk && i.chunk.words) || []).forEach(w => { if (w.sid === sd.sid) out.push({ si: w.si, id: i.id }); }); }); return out; }, sd);
      const all = sd.units.flat(), present = all.filter(si => has.some(h => h.si === si)).length;
      const r = { level: LEVEL, board: b, seed: sd.text, parts: all.length, present, ok: false, perfect: false, note: '' };
      res.push(r);
      if (present < all.length) { r.note = 'missing ' + all.filter(si => !has.some(h => h.si === si)).join(','); r.q = await page.evaluate(sd => { const g = window.game._app.game; return { live: g.items.filter(i => i.state !== 'pop').length, spawnQ: g.spawnQ, target: g.target }; }, sd); continue; }
      const P = id => page.evaluate(id => { const i = window.game._app.game.items.find(x => x.id === id && x.state !== 'pop'); return i && { x: i.x, y: i.y }; }, id);
      const unitIds = [];
      for (const u of sd.units) {
        const ids = u.map(si => has.find(h => h.si === si).id);
        if (new Set(ids).size === 1) { unitIds.push(ids[0]); continue; }
        await page.evaluate(() => { window.__ev = []; });
        for (const id of ids) { const p = await P(id); if (!p) break; await page.mouse.click(p.x, p.y); await page.waitForTimeout(200); }
        await page.waitForTimeout(2200);
        const ev = await page.evaluate(() => window.__ev);
        const ch = ev.find(e => e.n === 'chunk');
        if (!ch) { const cs = await page.evaluate(() => { const g = window.game._app.game, c = g.chain; return c ? JSON.stringify({ items: c.items.map(i => i.text), complete: c.st.complete, err: c.st.err && c.st.err.code, prefix: c.st.prefix, last: +(g.t - c.last).toFixed(2), state: g.state }) : 'nochain'; }); r.note = 'unit failed: ' + ids.length + 'w ' + ev.map(e => e.n + ':' + (e.code || e.text)).join(',') + ' ' + cs; break; }
        unitIds.push(ch.id);
      }
      if (r.note) continue;
      await page.evaluate(() => { window.__ev = []; });
      const pts = []; for (const id of unitIds) { const p = await P(id); if (p) pts.push(p); }
      if (pts.length !== unitIds.length) { r.note = 'unit vanished'; continue; }
      await page.mouse.move(pts[0].x, pts[0].y); await page.mouse.down();
      for (let k = 1; k < pts.length; k++) { for (let s = 1; s <= 8; s++) { await page.mouse.move(pts[k - 1].x + (pts[k].x - pts[k - 1].x) * s / 8, pts[k - 1].y + (pts[k].y - pts[k - 1].y) * s / 8); await page.waitForTimeout(6); } await page.waitForTimeout(160); }
      await page.mouse.up(); await page.waitForTimeout(900);
      const ev = await page.evaluate(() => window.__ev), sent = ev.find(e => e.n === 'sentence');
      r.ok = !!sent; r.perfect = !!(sent && sent.perfect); r.note = sent ? sent.text : 'drag: ' + ev.map(e => e.n + ':' + (e.code || e.text)).join(',') + ' | ' + (await page.evaluate(() => window.game._app.game.debug.lastStroke || ''));
    }
  }
  if (OUT) require('fs').writeFileSync(OUT, JSON.stringify({ res, errors }, null, 1));
  const full = res.filter(r => !r.note.startsWith('missing'));
  console.log('level', LEVEL, 'seeds', res.length, 'all parts on board', full.length, 'built', full.filter(r => r.ok).length, 'perfect', full.filter(r => r.perfect).length, 'errors', errors.length);
  await browser.close();
})();
