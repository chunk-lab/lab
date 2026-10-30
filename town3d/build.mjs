// node build.mjs  → dist/index.html(これ1つで町が動く)と dist/town.js(組み込み用)
import { build } from 'esbuild';
import fs from 'fs';
import { execSync } from 'child_process';
const sha = ((() => { try { return execSync('git rev-parse HEAD').toString(); } catch (e) { return ''; } })() || process.env.GITHUB_SHA || 'local').slice(0, 5);   // lab のコミット(lab-preview で組み立てても lab の番号になる)
const jst = new Date(Date.now() + 9 * 36e5).toISOString().slice(5, 16).replace('T', ' ');
const BUILD = `${jst} ${sha}`;
const r = await build({ entryPoints: ['src/entry.js'], bundle: true, minify: true, format: 'iife', globalName: 'Hoshimiya', write: false, target: 'es2020', legalComments: 'none', loader: { '.webp': 'dataurl' }, define: { __BUILD__: JSON.stringify(BUILD) } });
const js = r.outputFiles[0].text;
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/town.js', js);
const html = fs.readFileSync('src/shell.html', 'utf8').replace('/*APP*/', () => js.replace(/<\/script/g, '<\\/script'));
fs.writeFileSync('dist/index.html', html);
fs.cpSync('apps', 'dist/apps', { recursive: true });
fs.cpSync('sdk', 'dist/sdk', { recursive: true });
fs.cpSync('assets/tarot', 'dist/tarot', { recursive: true });   // タロットの絵(開いたときに読む)
console.log('dist/index.html', (html.length / 1024).toFixed(0) + 'KB');
