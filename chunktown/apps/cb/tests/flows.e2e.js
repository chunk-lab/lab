// 個別の流れの検証:節・前置きスロット・and・アイテム・一時停止の設定・フリーの終了・あふれの終了
const { open } = require('./e2e_lib');
(async () => {
  const { browser, page, errors } = await open(390, 844);
  const out = {};
  const setup = async (mode, level) => { await page.evaluate(([m, l]) => { const a = window.game._app; a.state.tutorialDone = true; a.state.level = l; a.saveState(); window.game.show('game', m); }, [mode, level]); await page.waitForTimeout(3700); };
  const place = (specs) => page.evaluate((specs) => { const g = window.game._app.game, D = window.game._app.dict; g.calm = true;
      g.items.slice().forEach(i => { i.state = 'pop'; i.popT = 1; }); g.items.length = 0; g.spawnQ = 0;
      const F = g.L.field, ids = [];
      specs.forEach((sp, k) => { const w = Object.assign({}, sp); if (sp.e) w.e = D.all(sp.pos).find(x => x.w === sp.e); const it = g.spawnWord(w, F.x + 50 + (k % 4) * 90, F.y + 60 + Math.floor(k / 4) * 110, true); it.vx = it.vy = 0; ids.push(it.id); });
      g.target = 0; return ids; }, specs);
  const pos = id => page.evaluate(id => { const g = window.game._app.game; const all = g.items.concat(g.slots.filter(s => s.item).map(s => s.item)); const i = all.find(x => x.id === id); return i && { x: i.x, y: i.y }; }, id);
  const stroke = async (pts) => { await page.mouse.move(pts[0].x, pts[0].y); await page.mouse.down(); for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], b = pts[k]; for (let s = 1; s <= 8; s++) { await page.mouse.move(a.x + (b.x - a.x) * s / 8, a.y + (b.y - a.y) * s / 8); await page.waitForTimeout(10); } await page.waitForTimeout(90); } await page.mouse.up(); await page.waitForTimeout(400); };
  const chunks = () => page.evaluate(() => window.game._app.game.items.filter(i => i.chunk && i.state !== 'pop').map(i => ({ id: i.id, t: i.chunk.t, text: i.full })));
  const slot = i => page.evaluate(i => { const r = window.game._app.game.slots[i].rect; return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }, i);
  // a) 節 → 前置きスロット
  await setup('free', 0);
  let ids = await place([{ k: 'conj', v: 'when' }, { k: 'pr', v: 'i' }, { k: 'v', pos: 'verb', e: 'run' }, { k: 'pr', v: 'he' }, { k: 'v', pos: 'verb', e: 'sleep' }]);
  await stroke([await pos(ids[0]), await pos(ids[1]), await pos(ids[2])]);
  let cs = await chunks(); out.clause = cs.find(c => c.t === 'CL');
  if (out.clause) {
    await stroke([await pos(out.clause.id), await slot(0)]);
    await stroke([await pos(ids[3]), await slot(1)]); await stroke([await pos(ids[4]), await slot(2)]);
    await page.waitForTimeout(300); const pl = await page.evaluate(() => { const p = window.game._app.game.pill; return p && { x: p.x + p.w / 2, y: p.y + p.h / 2, mult: window.game._app.game.ready.mult }; }); out.pillMult = pl && pl.mult; if (pl) await page.mouse.click(pl.x, pl.y); await page.waitForTimeout(600);
    out.clauseSentence = await page.evaluate(() => window.game._app.game.stats.list.map(s => s.text));
  }
  // b) and でつなぐ
  ids = await place([{ k: 'pr', v: 'i' }, { k: 'v', pos: 'verb', e: 'run' }, { k: 'conj', v: 'and' }, { k: 'pr', v: 'she' }, { k: 'v', pos: 'verb', e: 'sleep' }]);
  await stroke(await Promise.all(ids.map(pos)));
  out.coord = await page.evaluate(() => window.game._app.game.stats.list.slice(-1)[0]);
  // c) アイテム
  ids = await place([{ k: 'det', v: 'the' }, { k: 'adj', pos: 'adj', e: 'big' }, { k: 'n', pos: 'noun', e: 'dog' }, { k: 'v', pos: 'verb', e: 'run' }]);
  out.items = await page.evaluate(() => { const g = window.game._app.game; const h = g.useItem('hint'); const hp = !!g.hintPath; const a = g.useItem('auto'); const m = g.useItem('magic'); return { hint: h && hp, auto: a, magic: m, chunks: g.items.filter(i => i.chunk).map(i => i.full) }; });
  const mg = await page.evaluate(() => { const g = window.game._app.game; const i = g.items.find(x => x.word && x.word.k === 'magic'); return i && { id: i.id }; });
  await page.waitForTimeout(1200);
  if (mg) { const p = await pos(mg.id); await page.mouse.click(p.x, p.y); await page.waitForTimeout(200); out.magicBecame = await page.evaluate(id => { const i = window.game._app.game.items.find(x => x.id === id); return i && i.text; }, mg.id); }
  // 食べる・余波
  ids = await place([{ k: 'det', v: 'the' }, { k: 'prep', v: 'at' }, { k: 'pr', v: 'he' }, { k: 'v', pos: 'verb', e: 'run' }, { k: 'conj', v: 'so' }]);
  out.hungerBefore = await page.evaluate(() => window.game._app.game.hunger);
  await stroke([await pos(ids[0]), await page.evaluate(() => { const g = window.game._app.game; return { x: 46, y: g.L.lane.y + g.L.lane.h * .55 }; })]);
  out.eat = await page.evaluate(id => ({ hunger: window.game._app.game.hunger, gone: !window.game._app.game.items.some(i => i.id === id && i.state !== 'pop') }), ids[0]);
  await page.evaluate(ids => { const g = window.game._app.game, he = g.items.find(i => i.id === ids[2]); [ids[1], ids[4]].forEach((id, k) => { const i = g.items.find(x => x.id === id); i.x = he.x + 40 + k * 30; i.y = he.y + 80; }); }, ids); await page.waitForTimeout(100);
  await stroke([await pos(ids[2]), await pos(ids[3])]); await page.waitForTimeout(900);
  out.shock = await page.evaluate(() => window.game._app.game.stats.shock);
  // d) 一時停止 → 設定 → もどる → つづける
  await page.getByLabel('一時停止').click(); await page.waitForTimeout(300); await page.getByText('設定', { exact: true }).last().click(); await page.waitForTimeout(400);
  out.pauseSettings = await page.getByText('自動 / 手動', { exact: true }).count();
  await page.getByLabel('もどる').last().click(); await page.waitForTimeout(400);
  // e) フリー → おわる → 結果
  await page.getByText('おわる(結果へ)', { exact: true }).click(); await page.waitForTimeout(2500);
  out.freeResult = await page.evaluate(() => window.game._app.scene) + ' / ' + (await page.getByText('作った文', { exact: true }).count());
  await page.screenshot({ path: __dirname + '/shots/flow_result.png' });
  // f) あふれ → 終了
  await setup('over', 0);
  await page.evaluate(() => { const g = window.game._app.game; for (let i = 0; i < 20; i++) g.spawnWord({ k: 'det', v: 'the' }); });
  await page.waitForTimeout(3500);
  out.overEnd = await page.evaluate(() => window.game._app.scene);
  console.log(JSON.stringify(out, null, 1)); console.log('errors', errors);
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
