// 物語のカメラの表(assets_gen/storycams.json)を作る。物語やカメラの指定を変えたら、組み立て → これ を1回
//   node tools/gen_storycams.mjs [町のURL(既定 http://localhost:8110/town/)]
// 町を開いて、物語を1本ずつ早回し(アプリは開かない・選択肢は1番目/2番目/3番目で3回)し、場面ごとのカメラ位置を書き出す。町では表の位置に置くだけ(計算しない)
import fs from 'fs';
const PW = process.env.PW || '/home/claude/.npm-global/lib/node_modules/@playwright/mcp/node_modules/playwright-core/index.mjs';
const { chromium } = await import(PW);
const url = process.argv[2] || 'http://localhost:8110/town/';
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const ids = process.env.IDS ? process.env.IDS.split(',') : [...main.match(/const STORIES = \{([^}]*)\}/)[1].matchAll(/(\w+):/g)].map(m => m[1]);   // IDS=intro1,intro2 で一部だけ作り直し(前の表に足す)
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 393, height: 722 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(url); await p.waitForSelector('.md-preload', { state: 'detached', timeout: 250000 }); await p.waitForTimeout(1500);
await p.click('[data-3d]').catch(() => { }); await p.waitForTimeout(4000); await p.evaluate(() => { try { window.town3d.quickStart && window.town3d.quickStart(); } catch (e) { } }); await p.waitForTimeout(2000);   // 町に入って、絵が動いている状態にする
const tf = await (async () => { for (;;) { for (const f of p.frames()) if (await f.evaluate(() => !!window.__glbMeasured).catch(() => false)) return f; await p.waitForTimeout(500); } })();   // 町の本体が動いている枠
await tf.evaluate(() => { window.__storyRec = 1; window.__storyCamsRec = {}; });
for (const id of ids) for (const k of [0, 1, 2]) {
  await tf.evaluate(k => { window.__storyRecK = k; }, k);
  const ok = await p.evaluate(id => Promise.race([window.town3d.playStory(id), new Promise(r => setTimeout(() => r('timeout'), 120000))]), id);
  console.log(id, k, ok, await tf.evaluate(() => Object.keys(window.__storyCamsRec).length));
}
const cams = await tf.evaluate(() => window.__storyCamsRec);
const out = new URL('../assets_gen/storycams.json', import.meta.url), old = process.env.IDS && fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {};
fs.writeFileSync(out, JSON.stringify(Object.assign(old, cams)));
console.log('cams', Object.keys(cams).length, 'errs', errs.slice(0, 3)); await b.close();
