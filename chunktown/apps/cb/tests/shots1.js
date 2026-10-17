const { open, tapText } = require('./e2e_lib');
(async () => {
  const { browser, page, errors } = await open(390, 844);
  const S = n => page.screenshot({ path: __dirname + '/shots/' + n + '.png' });
  await S('01_splash');
  await page.mouse.click(195, 500); await page.waitForTimeout(700); await S('02_title');
  await tapText(page, 'あそぶ'); await page.waitForTimeout(900); await S('03_tut0');
  console.log('errors:', errors);
  await browser.close();
})();
