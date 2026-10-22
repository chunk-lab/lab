import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 500, height: 400 } }); const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(600); await p.click('.tw-start');
await p.evaluate(() => town.setHour(13));
const get = () => p.evaluate(() => town.getState().npcs.chunkkun);
await p.waitForTimeout(500);
const a = await get(); await p.evaluate(([x, z]) => town.teleport(x, z + 2.5, Math.PI), a);
await p.waitForTimeout(300); const b1 = await get(); await p.waitForTimeout(1500); const b2 = await get();
console.log('近づいたら止まる', b1[0] === b2[0] && b1[1] === b2[1] ? 'OK' : 'NG', b1, b2);
await p.evaluate(() => town.teleport(0, 12, Math.PI)); await p.waitForTimeout(500);
// 速度:Wを押して1秒の移動距離
await p.keyboard.down('KeyW'); const s0 = await p.evaluate(() => town.getState()); await p.waitForTimeout(1000); const s1 = await p.evaluate(() => town.getState()); await p.keyboard.up('KeyW');
console.log('歩き 1秒で', Math.hypot(s1.x - s0.x, s1.z - s0.z).toFixed(1), 'm(以前は約3m)');
console.log(errs.length ? errs : 'no errors'); await b.close();
