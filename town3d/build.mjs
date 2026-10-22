// node build.mjs  → dist/index.html(これ1つで町が動く)と dist/town.js(組み込み用)
import { build } from 'esbuild';
import fs from 'fs';
const r = await build({ entryPoints: ['src/entry.js'], bundle: true, minify: true, format: 'iife', globalName: 'Hoshimiya', write: false, target: 'es2020', legalComments: 'none' });
const js = r.outputFiles[0].text;
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/town.js', js);
const html = fs.readFileSync('src/shell.html', 'utf8').replace('/*APP*/', () => js.replace(/<\/script/g, '<\\/script'));
fs.writeFileSync('dist/index.html', html);
fs.cpSync('apps', 'dist/apps', { recursive: true });
fs.cpSync('sdk', 'dist/sdk', { recursive: true });
console.log('dist/index.html', (html.length / 1024).toFixed(0) + 'KB');
