// 3サイズで全画面のスクリーンショット: node tests/screens.e2e.js
const { open, tapText } = require('./e2e_lib');
const SIZES = [[375, 667], [390, 844], [430, 932]];
(async () => {
  const allErr = [];
  for (const [w, h] of SIZES) {
    const { browser, page, errors } = await open(w, h);
    const S = n => page.screenshot({ path: `${__dirname}/shots/${w}_${n}.png` });
    await S('a_splash');
    await page.mouse.click(w / 2, h * .6); await page.waitForTimeout(600); await S('b_title');
    await page.getByLabel('設定').first().click(); await page.waitForTimeout(500); await S('c_settings');
    await page.evaluate(() => document.querySelector('.pc-scr').scrollTo(0, 2000)); await page.waitForTimeout(200); await S('c_settings2');
    await page.getByLabel('もどる').first().click(); await page.waitForTimeout(450);
    await page.getByLabel('記録').first().click(); await page.waitForTimeout(500); await S('d_records');
    await page.getByLabel('もどる').first().click(); await page.waitForTimeout(450);
    await page.getByLabel('ショップ').first().click(); await page.waitForTimeout(500); await S('e_shop');
    await page.getByLabel('もどる').first().click(); await page.waitForTimeout(450);
    await page.getByLabel('クレジット').first().click(); await page.waitForTimeout(500); await S('f_credits');
    await page.getByLabel('もどる').first().click(); await page.waitForTimeout(450);
    await page.evaluate(() => { const a = window.game._app; a.state.tutorialDone = true; a.state.level = 1; a.saveState(); });
    await tapText(page, 'あそぶ'); await page.waitForTimeout(300); await S('g_modes');
    await tapText(page, 'タイムアタック'); await page.waitForTimeout(1200); await S('h_count');
    await page.waitForTimeout(2600);
    // 連鎖の途中
    const it = await page.evaluate(() => { const g = window.game._app.game; const d = g.items.find(i => i.word && i.word.k === 'det' && i.state === 'idle'); return d && { x: d.x, y: d.y }; });
    if (it) { await page.mouse.click(it.x, it.y); await page.waitForTimeout(200); }
    await S('i_play');
    await page.waitForTimeout(2500);
    await page.getByLabel('一時停止').first().click(); await page.waitForTimeout(400); await S('j_pause');
    await tapText(page, 'つづける'); await page.waitForTimeout(300);
    await page.evaluate(() => { const g = window.game._app.game; g.time = 0.2; });
    await page.waitForTimeout(3200); await S('k_result');
    allErr.push(...errors.map(e => w + ': ' + e));
    await browser.close();
  }
  console.log('errors:', allErr);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
