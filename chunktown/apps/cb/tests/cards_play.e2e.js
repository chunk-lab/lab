// チャンク・カード:実際にタップして遊ぶ(簡単なbot)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file:///home/claude/cb/out/chunkcards.html'); await p.waitForTimeout(400);
  await p.screenshot({ path: '/tmp/claude-0/cc_title.png' });
  await p.click('#go'); await p.waitForTimeout(400);
  const S = (n) => p.screenshot({ path: '/tmp/claude-0/cc_' + n + '.png' });
  const tsu = async (tab, label) => { const tabs = await p.$$('.tab'); for (const t of tabs) if ((await t.textContent()) === tab) await t.click(); await p.waitForTimeout(60); const cs = await p.$$('.tw .card'); for (const c of cs) if ((await c.$eval('.w', e => e.textContent)) === label) { await c.click(); break; } await p.waitForTimeout(60); };
  const handClick = async (pred) => { const R = await p.evaluate(() => window.ChunkCards._R().hand.map(c => ({ k: c.kind, w: c.w.e ? c.w.e.w : c.w.v, fr: c.w.e && c.w.e.fr, cat: c.w.e && c.w.e.cat, c: c.w.e && c.w.e.c }))); const i = R.findIndex(pred); if (i < 0) return null; await p.locator('#hand .card').nth(i).click(); await p.waitForTimeout(60); return R[i]; };
  const state = () => p.evaluate(() => ({ st: document.querySelector('.sent') && document.querySelector('.sent').className, txt: document.querySelector('#sent') && document.querySelector('#sent').textContent, msg: document.querySelector('#msg') && document.querySelector('#msg').textContent, dis: document.querySelector('#bp') && document.querySelector('#bp').disabled }));
  const log = [];
  for (let turn = 0; turn < 40; turn++) {
    const scr = await p.evaluate(() => document.querySelector('.shop') ? 'shop' : document.querySelector('.clear') ? 'clear' : document.querySelector('.end') ? 'end' : document.querySelector('#hand') ? 'game' : 'other');
    if (await p.locator('.modal #ok').count()) { log.push('REVEAL ' + (await p.locator('.modal .box').innerText()).replace(/\n+/g, ' / ')); await p.locator('.modal #ok').click(); await p.waitForTimeout(1500); continue; }
    if (scr === 'clear') { log.push('CLEAR ' + (await p.locator('.pay').innerText()).replace(/\n+/g, ' '));  await S('clear'); await p.click('#sh'); await p.waitForTimeout(300); continue; }
    if (scr === 'shop') { await S('shop'); const items = await p.$$('.item:not(.poor):not(.sold)'); if (items.length) { await items[0].click(); await p.waitForTimeout(300); const pk = await p.$('.pc'); if (pk) { await pk.click(); await p.waitForTimeout(200); } const bo = await p.$('#pk .card'); if (bo) { await bo.click(); await p.waitForTimeout(200); } } await p.click('#nx'); await p.waitForTimeout(400); continue; }
    if (scr === 'end') { await S('end'); log.push('END'); break; }
    // 主語 → 動詞 →(他動詞なら)a/the + 名詞 →(あれば)場所
    const hasPron = await p.evaluate(() => window.ChunkCards._R().hand.some(c => c.kind === 'pron')); if (hasPron) await handClick(c => c.k === 'pron'); else { await tsu('冠詞', 'the'); await handClick(c => c.k === 'n' && /person|animal/.test(c.cat)); }
    const v = await handClick(c => c.k === 'v');
    let st = await state();
    if (st.dis && v) { const o = await p.evaluate(() => window.ChunkCards._R().hand.findIndex(c => c.kind === 'n' && c.w.e.cat !== 'time' && c.w.e.cat !== 'place')); if (o >= 0) { await tsu('冠詞', 'the'); await p.locator('#hand .card').nth(o).click(); await p.waitForTimeout(80); st = await state(); if (st.dis) { const nrc = await p.locator('#row .card').count(); await p.locator('#row .card').nth(nrc - 2).click(); await p.waitForTimeout(80); st = await state(); } } }
    if (turn === 1) await S('build');
    if (st.dis) { // だめなら主語を名詞に冠詞付きで、それもだめなら捨てる
      log.push('NG ' + st.txt + ' / ' + st.msg);
      const canDisc = await p.evaluate(() => window.ChunkCards._R().discards > 0);
      if (canDisc) {
        while (await p.locator('#row .rm').count()) { await p.locator('#row .rm').first().click(); await p.waitForTimeout(30); }
        await p.locator('#bt .btn').first().click(); await p.waitForTimeout(100);
        await p.locator('#hand .card').nth(0).click(); await p.locator('#hand .card').nth(1).click(); await p.waitForTimeout(80);
        if (turn < 6) await S('discmode');
        await p.locator('#bt .btn').nth(1).click(); await p.waitForTimeout(150);
        if (turn < 6) await S('refill');
        const can = await p.locator('#fd .card.can').count(); if (can) { await p.locator('#fd .card.can').first().click(); await p.waitForTimeout(100); log.push('TOOK from field'); }
        while (await p.evaluate(() => window.ChunkCards._R().refill > 0)) { await p.locator('#bt .btn').first().click(); await p.waitForTimeout(80); }
        log.push('DISCARD pts=' + await p.evaluate(() => window.ChunkCards._R().pts));
        continue;
      }
      while (await p.locator('#row .rm').count()) { await p.locator('#row .rm').first().click(); await p.waitForTimeout(30); }
      await handClick(c => c.k === 'pron'); await handClick(c => c.k === 'v' && c.fr !== 'tr'); st = await state(); if (st.dis) { log.push('STUCK'); break; }
    }
    log.push('OK ' + st.txt);
    await p.locator('#bt .play').click(); await p.waitForTimeout(300); if (turn === 0) await S('scoring'); await p.waitForTimeout(4000);
  }
  console.log(log.join('\n'));
  console.log('state', JSON.stringify(await p.evaluate(() => { const R = window.ChunkCards._R(); return { stage: R.stage, score: R.score, total: R.total, money: R.money, jokers: R.jokers.map(j => j.name) }; })));
  console.log('errors', errs); await b.close();
})();
