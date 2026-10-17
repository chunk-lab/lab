// Playwright の共通処理
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.join(__dirname, '../dist/index.html');
async function open(w, h, opts) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] }).catch(() => chromium.launch());
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, ...(opts || {}) });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(URL);
  await page.waitForTimeout(600);
  return { browser, page, errors };
}
async function tapText(page, text) { await page.getByText(text, { exact: true }).first().click(); await page.waitForTimeout(450); }
module.exports = { open, tapText, URL };
