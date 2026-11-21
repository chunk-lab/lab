// 体ごとの「測った値」の表(assets_gen/measure.json)を作る。モデルや動きを差し替えたら、組み立て → これ を1回
//   node tools/gen_measure.mjs [町のURL(既定 http://localhost:8110/town/)]
// 町を開いて、全員をその場で測り(高画質=models/ の版で)、版の印といっしょに書き出す。町の側は、印が合うときだけこの値を使う
import fs from 'fs';
const PW = process.env.PW || '/home/claude/.npm-global/lib/node_modules/@playwright/mcp/node_modules/playwright-core/index.mjs';
const { chromium } = await import(PW);
const url = process.argv[2] || 'http://localhost:8110/town/';
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 700 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { try { localStorage.setItem('hoshimiya:chartex', 'hi'); } catch (e) { } });
await p.goto(url); await p.waitForFunction(() => window.__glbMeasureAll, null, { timeout: 200000 });
const ids = await p.evaluate(() => window.__glbMeasureAll());
await p.waitForFunction(n => Object.values(window.__glbMeasured).filter(m => !m.pre).length >= n, ids.length, { timeout: 600000 });
const out = await p.evaluate(async ids => {
  const base = new URL('g/town3d/models/', location.href).href, v = await fetch(base + 'versions.json', { cache: 'no-cache' }).then(r => r.json());
  return { v, m: Object.fromEntries(ids.map(id => [id, window.__glbMeasured[id]])) };
}, ids);
const models = fs.readFileSync(new URL('../src/world/glbchar.js', import.meta.url), 'utf8');
const res = {};
for (const [id, m] of Object.entries(out.m)) {
  const re = new RegExp(`['"]?${id.replace(/[:]/g, '\\:')}['"]?: (\\{[^}]*\\})`), mm = models.match(re); if (!mm) { console.log('?', id); continue; }
  const file = mm[1].match(/url: 'models\/([^']+)'/)[1], af = (mm[1].match(/animFrom: '([^']+)'/) || [])[1], afFile = af ? models.match(new RegExp(`\\b${af}: \\{ url: 'models/([^']+)'`))[1] : null;
  const { pre, ...data } = m; res[id] = { ...data, mv: out.v[file], ...(afFile ? { av: out.v[afFile] } : {}) };
}
fs.writeFileSync(new URL('../assets_gen/measure.json', import.meta.url), JSON.stringify(res));
console.log('measured', Object.keys(res).length, 'errs', errs.slice(0, 2)); await b.close();
