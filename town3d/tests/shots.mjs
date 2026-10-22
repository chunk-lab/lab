// node tests/shots.mjs → tests/shots/*.png とエラーの一覧
import { chromium } from 'playwright';
import fs from 'fs';
fs.mkdirSync('tests/shots', { recursive: true });
const url = 'file://' + process.cwd() + '/dist/index.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
for (const [name, w, h, touch] of [['phone', 390, 844, true], ['pc', 1280, 720, false]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch });
  page.on('console', m => m.type() === 'error' && errors.push(name + ': ' + m.text()));
  page.on('pageerror', e => errors.push(name + ': ' + e.message));
  await page.goto(url); await page.waitForTimeout(1500);
  await page.screenshot({ path: `tests/shots/${name}-title.png` });
  await page.click('.tw-start'); await page.waitForTimeout(800);
  const shots = process.argv[2] ? JSON.parse(process.argv[2]) : [['plaza', 0, 12, Math.PI, 11], ['street', 0, 28, Math.PI, 15], ['night', 0, 12, Math.PI, 20.5], ['school', 0, -50, Math.PI, 9], ['arcade', -3, 25, -Math.PI / 2, 19.5]];
  for (const [s, x, z, ry, hr] of shots) {
    await page.evaluate(([x, z, ry, hr]) => { town.teleport(x, z, ry); town.setHour(hr); }, [x, z, ry, hr]);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `tests/shots/${name}-${s}.png` });
  }
  console.log(name, JSON.stringify(await page.evaluate(() => town.getState())));
  await page.close();
}
await browser.close();
console.log(errors.length ? 'ERRORS\n' + errors.join('\n') : 'no errors');
