#!/usr/bin/env node
/* シリーズの組み立て：node build.mjs [アプリ名…]  （なしなら全部）
   → dist/<アプリ>/index.html（Web版・スマホ版の元）と dist/<アプリ>/artifact.html（Claudeの公開ページ用）
   アプリとゲームの組み合わせは series.config.mjs */
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { createRequire } from 'node:module';
import { PREBUILD, GAMES, APPS } from './series.config.mjs';
const ROOT = path.dirname(new URL(import.meta.url).pathname), require = createRequire(import.meta.url);
let esbuild; try { esbuild = require('esbuild'); } catch (e) { esbuild = require('/opt/npm-tools/node_modules/esbuild'); }
const copy = (src, dest) => {
  const s = path.join(ROOT, src), d = dest;
  if (fs.statSync(s).isDirectory()) { fs.mkdirSync(d, { recursive: true }); for (const f of fs.readdirSync(s)) { if (f === 'game.js') continue; copy(path.join(src, f), path.join(d, f)); } }
  else { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); }
};
const BUILD = Date.now().toString(36);   // 組み立てのたびに変わる印。ブラウザが古いファイルを使い続けないよう、読み込むファイル名の後ろにつける
const want = process.argv.slice(2), apps = want.length ? want : Object.keys(APPS);
for (const p of PREBUILD) execFileSync('python3', [path.join(ROOT, p)], { stdio: 'inherit' });
for (const id of apps) {
  const app = APPS[id]; if (!app) { console.error('アプリがありません: ' + id); process.exit(1); }
  const out = path.join(ROOT, 'dist', id); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  // games/index.js は、このアプリに入れるゲームだけを読む形にして組み立てる（単体アプリにほかのゲームが入らないように）
  const gamesIdx = path.join(ROOT, 'games', 'index.js'), src = fs.readFileSync(gamesIdx, 'utf8');
  const only = { name: 'only-games', setup(b) { b.onLoad({ filter: /games[\\/]index\.js$/ }, () => {
    const lines = [...src.matchAll(/^import (\w+) from '([^']+)';/gm)].filter(m => app.games.includes(m[1]));
    return { contents: lines.map(m => m[0]).join('\n') + `\nexport const GAMES = { ${lines.map(m => m[1]).join(', ')} };\n`, resolveDir: path.dirname(gamesIdx), loader: 'js' };
  }); } };
  await esbuild.build({ plugins: [only], entryPoints: [path.join(ROOT, 'apps', app.shell, 'main.js')], bundle: true, format: 'iife', target: 'es2020', outfile: path.join(out, 'app.js'), loader: { '.webp': 'file', '.html': 'text' }, external: ['img/*'], logLevel: 'warning', legalComments: 'none' });
  copy('core/avatar', path.join(out, 'core', 'avatar'));
  copy('core/dict', path.join(out, 'core', 'dict'));   // 共通の辞書のデータ（読む画面を開いたときに読み込む）
  for (const [s, d] of app.assets || []) copy(s, path.join(out, d));
  if (app.town3d) {   // 3Dの町：../town3d を組み立てて、開いたときに読み込むファイルとして置く（2Dだけの人は読み込まない）
    const t3 = path.join(ROOT, '..', 'town3d');
    execFileSync('node', ['build.mjs'], { cwd: t3, stdio: 'inherit' });
    fs.mkdirSync(path.join(out, 'g', 'town3d'), { recursive: true });
    fs.copyFileSync(path.join(t3, 'dist', 'town.js'), path.join(out, 'g', 'town3d', 'town.js'));
    fs.cpSync(path.join(t3, 'dist', 'tarot'), path.join(out, 'g', 'town3d', 'tarot'), { recursive: true });   // タロットの絵
  }
  for (const g of app.games) for (const f of GAMES[g]) {
    if (Array.isArray(f)) { copy(f[0], path.join(out, f[1])); continue; }
    // { bundle: 入口, out: 公開先 } … 開いたときに読み込む別ファイル（大きいゲームを app.js に入れないため）。見た目は同じ名前の .css に出る
    await esbuild.build({ entryPoints: [path.join(ROOT, f.bundle)], bundle: true, format: 'iife', target: 'es2020', outfile: path.join(out, f.out), loader: { '.html': 'text' }, logLevel: 'warning', logOverride: { 'duplicate-object-key': 'silent' }, legalComments: 'none', minify: true });
  }
  const cfg = JSON.stringify({ build: BUILD, appId: id, title: app.title, games: app.games, grants: app.grants, backButton: !!app.backButton, backLabel: app.backLabel, theme: app.theme, opts: app.opts || undefined }).replace(/</g, '\\u003c');
  const head = `<title>${app.title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="app.css?v=${BUILD}">`;
  const body = `<script>window.__APP__=${cfg}</script>\n<script src="app.js?v=${BUILD}"></script>`;
  fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${head}\n</head><body>\n${body}\n</body></html>\n`);
  fs.writeFileSync(path.join(out, 'artifact.html'), `${head}\n${body}\n`);
  const size = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((a, e) => a + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
  console.log(`dist/${id}  ${(size(out) / 1048576).toFixed(1)}MB`);
}
