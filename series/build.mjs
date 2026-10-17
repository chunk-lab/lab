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
const want = process.argv.slice(2), apps = want.length ? want : Object.keys(APPS);
for (const p of PREBUILD) execFileSync('python3', [path.join(ROOT, p)], { stdio: 'inherit' });
for (const id of apps) {
  const app = APPS[id]; if (!app) { console.error('アプリがありません: ' + id); process.exit(1); }
  const out = path.join(ROOT, 'dist', id); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  await esbuild.build({ entryPoints: [path.join(ROOT, 'apps', app.shell, 'main.js')], bundle: true, format: 'iife', target: 'es2020', outfile: path.join(out, 'app.js'), loader: { '.webp': 'file' }, external: ['img/*'], logLevel: 'warning', legalComments: 'none' });
  copy('core/avatar', path.join(out, 'core', 'avatar'));
  copy('core/dict', path.join(out, 'core', 'dict'));   // 共通の辞書のデータ（読む画面を開いたときに読み込む）
  for (const [s, d] of app.assets || []) copy(s, path.join(out, d));
  for (const g of app.games) for (const [s, d] of GAMES[g]) copy(s, path.join(out, d));
  const cfg = JSON.stringify({ appId: id, title: app.title, games: app.games, grants: app.grants, backButton: !!app.backButton, backLabel: app.backLabel }).replace(/</g, '\\u003c');
  const head = `<title>${app.title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="app.css">`;
  const body = `<script>window.__APP__=${cfg}</script>\n<script src="app.js"></script>`;
  fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${head}\n</head><body>\n${body}\n</body></html>\n`);
  fs.writeFileSync(path.join(out, 'artifact.html'), `${head}\n${body}\n`);
  const size = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((a, e) => a + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
  console.log(`dist/${id}  ${(size(out) / 1048576).toFixed(1)}MB`);
}
