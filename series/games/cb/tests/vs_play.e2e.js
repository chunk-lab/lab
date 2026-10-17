// CPU対戦をボットで最後まで遊ぶ
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///home/claude/cb/out/chunkcards.html'); await p.waitForTimeout(500);
  await p.click('#vs'); await p.waitForTimeout(300);
  await p.locator('.oppc').nth(+(process.argv[2] || 1)).click(); await p.waitForTimeout(800);
  const log = []; let shots = 0;
  for (let step = 0; step < 400; step++) {
    if (await p.locator('.end').count()) { log.push('END ' + await p.locator('.end').innerText()); break; }
    const nx = p.locator('#nx'); if (await nx.count() && await nx.isVisible()) { log.push('SD ' + (await p.locator('.modal .box').innerText()).replace(/\n+/g, ' / ')); if (shots++ === 0) await p.screenshot({ path: process.env.SP + '/sd.png' }); await nx.click(); await p.waitForTimeout(400); continue; }
    const txt = await p.locator('#bt').innerText().catch(() => '');
    if (/捨てて交換/.test(txt)) {
      if (shots === 0 && step < 3) await p.screenshot({ path: process.env.SP + '/turn.png', fullPage: true });
      if (Math.random() < .6) { await p.getByRole('button', { name: '捨てて交換' }).click(); await p.locator('#hand .card').nth(0).click(); await p.locator('#hand .card').nth(1).click(); await p.locator('#bt button').nth(1).click(); await p.waitForTimeout(200); await p.getByRole('button', { name: 'ぜんぶ山から' }).click(); }
      else await p.getByRole('button', { name: '交換しない' }).click();
      // 文を作っておく
      await p.evaluate(() => { const K = window.ChunkKit, VS = window.ChunkVS, me = VS._me(); me.hand = me.hand.concat(me.row.filter(c => !c.tsu)); me.row = []; const r = VS._search(me.hand, VS._V().rule, 1); if (r) { const used = {}; r.row.forEach(c => { if (!c.tsu) used[c.id] = 1; }); me.hand = me.hand.filter(c => !used[c.id]); me.row = r.row; } K.G_.vs.renderAll(); });
      await p.waitForTimeout(300); continue;
    }
    if (/チェック/.test(txt)) { await p.getByRole('button', { name: Math.random() < .3 ? /ベット/ : 'チェック' }).click(); continue; }
    if (/コール/.test(txt)) { await p.getByRole('button', { name: /コール/ }).click(); continue; }
    await p.waitForTimeout(400);
    const tt = await p.locator('#vturn').innerText().catch(() => ''), bb = await p.locator('#obb').innerText().catch(() => '');
    if (log[log.length - 1] !== 'T ' + tt + ' | ' + bb) log.push('T ' + tt + ' | ' + bb);
  }
  console.log(log.filter(l => !/^T /.test(l) || /捨て|取った|ベット|レイズ|降り|コール/.test(l)).join('\n'));
  console.log('errors', errs); await b.close();
})();
