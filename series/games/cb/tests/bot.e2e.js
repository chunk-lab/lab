// 自動プレイ:探索で見つけた文を、実際のタップと一筆書きで作る
// 使い方: node tests/bot.e2e.js [mode] [秒数] [level] [w] [h]
const { open } = require('./e2e_lib');
const MODE = process.argv[2] || 'ta', SECS = +(process.argv[3] || 70), LEVEL = +(process.argv[4] || 0), W = +(process.argv[5] || 390), H = +(process.argv[6] || 844);
(async () => {
  const { browser, page, errors } = await open(W, H); const W0 = W, H0 = H;
  await page.evaluate(([m, l]) => { const a = window.game._app; a.state.tutorialDone = true; a.state.level = l; a.saveState(); window.game.show('game', m); }, [MODE, LEVEL]);
  await page.evaluate(() => { const a = window.game._app, o = a.emit; window.__ev = []; a.emit = (n, d) => { if (/fail|sentence|chunk|clause/.test(n)) window.__ev.push(n + ':' + (d && (d.code || d.text || (d.chunk && d.chunk.t)) || '')); o(n, d); }; });
  await page.waitForTimeout(3600);
  const pos = id => page.evaluate(id => { const g = window.game._app.game; if (!g) return null; const all = g.items.concat(g.slots.filter(s => s.item).map(s => s.item)); const i = all.find(x => x.id === id); return i && i.state !== 'pop' ? { x: i.x, y: i.y } : null; }, id);
  const plan = () => page.evaluate(() => { const g = window.game._app.game; if (!g || g.state !== 'play') return null; const s = g.debug.solve(); return s && s.parts.map(p => p.src.map(i => i.id)); });
  const t0 = Date.now(); let strokes = 0, chains = 0, mem = [], nulls = 0;
  while (Date.now() - t0 < SECS * 1000) {
    const st = await page.evaluate(() => { const g = window.game._app.game; return g ? g.state : 'none'; });
    if (st !== 'play') { if (st === 'none') break; await page.waitForTimeout(300); continue; }
    const tp = Date.now(); const p = await plan(); if (process.env.V) console.log('iter', ((Date.now() - t0) / 1000).toFixed(1), 'plan ms', Date.now() - tp, p && p.length);
    if (!p) { nulls++; if (nulls === 8 || nulls === 60) console.log('NOPLAN board', await page.evaluate(() => { const g = window.game._app.game; return JSON.stringify({ items: g.items.map(i => i.text + ':' + (i.chunk ? i.chunk.t : i.word.k) + ':' + i.state), slots: g.slots.map(s => s.item && s.item.text), chain: g.chain && g.chain.items.map(i => i.text), drag: !!g.drag, sel: g.sel && g.sel.item.text }); })); await page.waitForTimeout(400); continue; }
    const multi = p.find(x => x.length > 1);
    if (multi) { for (const id of multi) { const q = await pos(id); if (q) { await page.mouse.click(q.x, q.y); await page.waitForTimeout(120); } } chains++; await page.waitForTimeout(800); continue; }
    const ids = p.map(x => x[0]); if (process.env.V) console.log('plan', JSON.stringify(await page.evaluate(ids => { const g = window.game._app.game; const all = g.items.concat(g.slots.filter(s => s.item).map(s => s.item)); return ids.map(id => { const i = all.find(x => x.id === id); return i && i.text; }); }, ids))); let q = await pos(ids[0]); if (!q) continue;
    await page.mouse.move(q.x, q.y); await page.mouse.down();
    for (let k = 1; k < ids.length; k++) {
      const a = q, b = await pos(ids[k]); if (!b) break;
      // 途中のバブルの中心をよける迂回点
      const obs = await page.evaluate(([ex]) => { const g = window.game._app.game; return g.items.filter(i => ex.indexOf(i.id) < 0 && i.state !== 'pop').map(i => ({ x: i.x, y: i.y, r: i.r })); }, [[ids[k - 1], ids[k]]]);
      const block = (A, B) => { let best = null; for (const o of obs) { const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, t = ((o.x - A.x) * dx + (o.y - A.y) * dy) / (L * L); if (t <= 0 || t >= 1) continue; const px = A.x + dx * t, py = A.y + dy * t, d = Math.hypot(o.x - px, o.y - py); if (d < o.r * .62 + 8 && (!best || t < best.t)) best = { o, t, px, py, nx: -dy / L, ny: dx / L }; } return best; };
      const route = (A, B, depth) => { const bl = block(A, B); if (!bl || depth > 3) return [B]; const side = ((bl.o.x - bl.px) * bl.nx + (bl.o.y - bl.py) * bl.ny) > 0 ? -1 : 1, m = bl.o.r * .62 + 16; let W = { x: bl.o.x + bl.nx * side * m, y: bl.o.y + bl.ny * side * m }; if (W.x < 8 || W.x > W0 - 8) W = { x: bl.o.x - bl.nx * side * m, y: bl.o.y - bl.ny * side * m }; W.x = Math.max(8, Math.min(W0 - 8, W.x)); W.y = Math.max(100, Math.min(H0 - 120, W.y)); return route(A, W, depth + 1).concat(route(W, B, depth + 1)); };
      let way = route(a, b, 0);
      let c = a; for (const w of way) { for (let s = 1; s <= 6; s++) { await page.mouse.move(c.x + (w.x - c.x) * s / 6, c.y + (w.y - c.y) * s / 6); await page.waitForTimeout(12); } c = w; } await page.waitForTimeout(90);
      q = b; }
    if (process.env.V) console.log('state', JSON.stringify(await page.evaluate(ids => { const g = window.game._app.game; return ids.map(id => { const i = g.items.find(x => x.id === id); return i ? [i.text, i.state, Math.round(i.x), Math.round(i.y), Math.round(i.r), i.sc.toFixed(2), !!i.lift] : 'gone'; }); }, ids)));
    if (process.env.V) console.log('drag', await page.evaluate(() => { const d = window.game._app.game.drag; return d && JSON.stringify({ items: d.items.map(i => i.text), carry: d.carry }); }));
    await page.mouse.up(); strokes++; await page.waitForTimeout(500);
    if (process.env.V) console.log('ev', await page.evaluate(() => window.__ev.slice(-2).join(' / ')), await page.evaluate(() => window.game._app.game && window.game._app.game.debug.lastT));
    if (strokes % 5 === 0) mem.push(await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : 0));
  }
  await page.waitForTimeout(2500);
  const res = await page.evaluate(() => { const a = window.game._app; return { scene: a.scene, game: a.game ? { score: a.game.score, stats: a.game.stats, time: a.game.time } : null }; });
  await page.screenshot({ path: __dirname + '/shots/bot_' + MODE + '_' + W + '.png' });
  console.log(JSON.stringify({ mode: MODE, strokes, chains, res: res.game ? { score: res.game.score, sentences: res.game.stats.sentences, fails: res.game.stats.fails, time: res.game.time } : res.scene, memMB: mem, errors }));
  console.log((await page.evaluate(() => window.__ev)).join(' | '));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
