// 使い方: 組み立てて /tmp/sm で町を出してから  node tools/gen_clips/run.mjs  → src/world/motion_clips.json
import fs from 'fs'; import { build } from 'esbuild';
const here = new URL('.', import.meta.url).pathname, root = here + '../../';
await build({ entryPoints: [here + 'entry.js'], bundle: true, format: 'iife', outfile: '/tmp/sm/genclips/b.js', loader: { '.json': 'json' } });
const src = fs.readFileSync(root + 'src/world/glbchar.js', 'utf8'), BODIES = [], seen = new Set();
for (const m of src.matchAll(/url: 'models\/([^']+)'([^}]*)\}/g)) { if (seen.has(m[1])) continue; seen.add(m[1]); BODIES.push([m[1], /sex: 'm'/.test(m[2]) ? 'm' : 'w']); }
fs.writeFileSync('/tmp/sm/genclips/index.html', `<script>window.__BODIES=${JSON.stringify(BODIES)};window.__BASE='/town/g/town3d/models/'</script><script src="b.js"></script>`);
const { chromium } = await import(process.env.PW || '/home/claude/.npm-global/lib/node_modules/@playwright/mcp/node_modules/playwright-core/index.mjs');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:8110/genclips/'); await p.waitForFunction(() => window.__OUT || window.__ERR, null, { timeout: 300000 });
const o = await p.evaluate(() => window.__OUT || { err: window.__ERR }); await b.close();
if (o.err) { console.log(o.err); process.exit(1); }
console.log('bodies', o.log.length, 'max diff between bodies', o.diff);
if (Object.values(o.diff).some(d => d > 1e-3)) { console.log('NG: 体ごとに回転がちがう'); process.exit(1); }
// 動かない骨(全部のコマで同じ値)は1コマだけにする(見た目は同じ・ファイルが小さくなる)
for (const tr of Object.values(o.rot)) for (const e of Object.values(tr)) { const v = e.v; if (v.every((x, i) => Math.abs(x - v[i % 4]) < 2e-5)) { e.t = [0]; e.v = v.slice(0, 4); } }
fs.writeFileSync(root + 'src/world/motion_clips.json', JSON.stringify({ rot: o.rot, dur: o.dur, hips: o.hips }));
console.log('written', fs.statSync(root + 'src/world/motion_clips.json').size);
