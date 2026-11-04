import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 420, height: 800 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
await p.addInitScript(() => localStorage.setItem('town:coins', '2000'));
await p.goto('file:///home/claude/town/dist/index.html'); await p.waitForTimeout(500);
await p.click('.tw-start'); await p.waitForTimeout(800);
await p.evaluate(() => town.openApp('shop')); await p.waitForTimeout(800);
await p.screenshot({ path: '/tmp/claude-0/shop.png' });
for (const id of ['bed','sofa','rug','lamp','plant','tv','chest','bear']) await p.click(`[data-b="${id}"]`);
console.log('coins', await p.evaluate(() => town.getState().coins), 'inv', await p.evaluate(() => localStorage.getItem('town:furn:inv')));
await p.evaluate(() => town.openApp('home')); await p.waitForTimeout(800);
for (const id of ['rug','bed','sofa','tv','lamp','plant','chest','bear']) { await p.click(`[data-i="${id}"]`); await p.waitForTimeout(60); }
await p.waitForTimeout(300);
await p.screenshot({ path: '/tmp/claude-0/home.png' });
// ドラッグで動かす
const box = await p.locator('.cv').boundingBox();
await p.mouse.move(box.x + box.width * .5, box.y + box.height * .6); await p.mouse.down(); await p.mouse.move(box.x + box.width * .3, box.y + box.height * .5, { steps: 6 }); await p.mouse.up();
await p.click('[data-a="rot"]').catch(() => {});
await p.waitForTimeout(300);
console.log('room', await p.evaluate(() => localStorage.getItem('town:furn:room')));
console.log('errors', errs);
await b.close();
