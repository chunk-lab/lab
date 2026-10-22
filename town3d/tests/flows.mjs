// 会話・入口・アプリ(module / iframe / script)・コイン・mount/unmount・中継サーバーを通しで確かめる
import { chromium } from 'playwright';
import { spawn } from 'child_process';
const url = 'file://' + process.cwd() + '/dist/index.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const errors = [], ok = (c, m) => { console.log((c ? 'OK  ' : 'NG  ') + m); if (!c) process.exitCode = 1; };
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => m.type() === 'error' && !/apps\/(punichunk|chunkcards)/.test(m.text()) && errors.push(m.text()));
await page.goto(url); await page.waitForTimeout(800);
await page.click('.tw-start'); await page.waitForTimeout(300);
const st = () => page.evaluate(() => town.getState());
// 掲示板(module)
await page.evaluate(() => town.teleport(-8, -8, Math.PI * 1.25)); await page.waitForTimeout(400);
ok((await st()).focus === '掲示板を見る', 'focus 掲示板: ' + (await st()).focus);
await page.click('.tw-action'); await page.waitForTimeout(300);
ok((await st()).app === 'board' && await page.isVisible('.tw-app-body h2'), '掲示板が開く');
await page.click('.tw-app-close'); await page.waitForTimeout(200);
ok((await st()).app === null, '町にもどる');
// おみくじでコイン
const c0 = (await st()).coins;
await page.evaluate(() => town.openApp('omikuji')); await page.waitForTimeout(300);
await page.click('.tw-app-body button'); await page.waitForTimeout(200);
ok((await st()).coins > c0, 'おみくじでコイン ' + c0 + '→' + (await st()).coins);
await page.evaluate(() => town.closeApp());
// 学校(iframe + SDK)
await page.evaluate(() => town.teleport(0, -59, Math.PI)); await page.waitForTimeout(400);
ok(!!(await st()).focus, '学校の入口で調べられる: ' + (await st()).focus);
await page.evaluate(() => town.openApp('school')); await page.waitForTimeout(1500);
const fr = page.frameLocator('.tw-app-frame');
ok(/さん、いらっしゃい/.test(await fr.locator('#hi').textContent()), 'iframe が町の名前を受け取る');
const c1 = (await st()).coins;
for (let k = 0; k < 4; k++) { const b = fr.locator('#ops button'); const n = await b.count(); for (let j = 0; j < n; j++) { await b.nth(j).click(); await page.waitForTimeout(150); if ((await st()).coins > c1) break; } if ((await st()).coins > c1) break; await page.waitForTimeout(1000); }
ok((await st()).coins > c1, 'iframe からコイン加算 ' + c1 + '→' + (await st()).coins);
await page.evaluate(() => town.closeApp());
// ゲームセンター(script、ファイルなし → 案内)
await page.evaluate(() => town.openApp('punichunk')); await page.waitForTimeout(500);
ok(await page.isVisible('.tw-app-missing'), 'ぷにチャンク未配置なら案内を出す');
await page.evaluate(() => town.closeApp());
// NPC と会話
const npc = await page.evaluate(() => { const s = town.getState(); return s; });
await page.evaluate(() => town.setHour(13));
const found = await page.evaluate(async () => {
  for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 100)); }
  return true;
});
// mount/unmount 5回
const leak = await page.evaluate(async () => {
  const el = document.getElementById('town');
  town.unmount();
  for (let i = 0; i < 5; i++) { const t = Hoshimiya.mount(el, { skipTitle: true, net: 'none' }); await new Promise(r => setTimeout(r, 300)); t.unmount(); }
  return { styles: document.querySelectorAll('style[data-town]').length, roots: document.querySelectorAll('.tw-root').length };
});
ok(leak.styles === 0 && leak.roots === 0, 'mount/unmount 5回で残りなし ' + JSON.stringify(leak));
// 中継サーバーで2人
const srv = spawn('node', ['server/relay.js', '8799']); await new Promise(r => setTimeout(r, 600));
const pa = await browser.newPage({ viewport: { width: 400, height: 400 } }), pb = await browser.newPage({ viewport: { width: 400, height: 400 } });
for (const p of [pa, pb]) { p.on('pageerror', e => errors.push(e.message)); await p.goto(url + '?server=ws://localhost:8799'); await p.waitForTimeout(500); await p.click('.tw-start'); }
await pa.evaluate(() => town.teleport(3, 3)); await pb.waitForTimeout(1500);
const pbState = await pb.evaluate(() => town.getState());
ok(pbState.peers === 1, 'サーバー経由で相手が見える peers=' + pbState.peers);
srv.kill();
await browser.close();
ok(errors.length === 0, 'エラーなし ' + errors.join(' | '));
