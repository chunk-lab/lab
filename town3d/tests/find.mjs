import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const ok = (c, m) => { console.log((c ? 'OK  ' : 'NG  ') + m); if (!c) process.exitCode = 1; };
const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + process.cwd() + '/dist/index.html'); await p.waitForTimeout(700); await p.click('.tw-start'); await p.waitForTimeout(300);
await p.evaluate(() => town.setHour(13)); await p.waitForTimeout(500);
await p.click('.tw-find'); await p.waitForSelector('.tw-map');
const rows = await p.$$eval('.tw-frow b', e => e.map(x => x.textContent));
ok(rows.length >= 8, '一覧に住人とプレイヤー: ' + rows.join(','));
await p.waitForTimeout(700); await p.screenshot({ path: 'tests/shots/find.png' });
await p.fill('.tw-fq', '男爵');
ok((await p.$$('.tw-frow')).length === 1, '名前で検索できる');
await p.fill('.tw-fq', 'カフェ'); const byRole = (await p.$$('.tw-frow')).length; ok(byRole >= 1, '役割・場所でも検索できる (' + byRole + ')');
await p.fill('.tw-fq', '');
// とぶ(ミイ)
const target = await p.evaluate(() => town.getState().npcs.mii);
await p.fill('.tw-fq', 'ミイ');
const away = await p.$eval('.tw-frow .tw-btn', b => b.disabled);
if (!away) {
  await p.click('.tw-frow .tw-btn'); await p.waitForTimeout(400);
  const st = await p.evaluate(() => town.getState());
  const d = Math.hypot(st.x - st.npcs.mii[0], st.z - st.npcs.mii[1]);
  ok(d < 4 && !(await p.isVisible('.tw-panel')), `ミイのそばへ移動 (距離 ${d.toFixed(1)}m)`);
} else console.log('   ミイはおやすみ中(時間帯)');
// ばしょ → 学校
await p.keyboard.press('KeyM'); await p.waitForSelector('.tw-map'); await p.click('[data-t="places"]'); await p.fill('.tw-fq', '学校');
await p.click('.tw-frow .tw-btn'); await p.waitForTimeout(400);
const s2 = await p.evaluate(() => town.getState());
ok(s2.z < -55 && /学校/.test(s2.area + (s2.focus || '')), 'ばしょ「学校」へ移動: ' + s2.area);
// M で閉じる
await p.keyboard.press('KeyM'); await p.waitForSelector('.tw-map'); await p.keyboard.press('KeyM'); await p.waitForTimeout(200);
ok(!(await p.isVisible('.tw-panel')), 'M で開閉');
ok(errs.length === 0, 'JSエラーなし ' + errs.join('|'));
await b.close();
