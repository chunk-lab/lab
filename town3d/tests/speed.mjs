import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 500, height: 400 } });
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(600); await p.click('.tw-start');
await p.evaluate(() => { town.teleport(0, 58, Math.PI); town.setHour(10); }); await p.waitForTimeout(800);
for (const [name, mod] of [['歩き', null], ['走り', 'ShiftLeft']]) {
  if (mod) await p.keyboard.down(mod);
  await p.keyboard.down('KeyW');
  const t0 = Date.now(), s0 = await p.evaluate(() => town.getState()); await p.waitForTimeout(1500); const sp = (await p.evaluate(() => town.getState())).speed; const s1 = await p.evaluate(() => town.getState()); const dt = (Date.now() - t0) / 1000;
  await p.keyboard.up('KeyW'); if (mod) await p.keyboard.up(mod);
  console.log(name, '速度設定値', sp, 'm/s;', (Math.hypot(s1.x - s0.x, s1.z - s0.z) / dt).toFixed(1), 'm/s 実時間', 'fps', s1.fps);
  await p.evaluate(() => town.teleport(0, 58, Math.PI)); await p.waitForTimeout(500);
}
await b.close();
