// node build.mjs  → dist/index.html(これ1つで町が動く)と dist/town.js(組み込み用)
import { build } from 'esbuild';
import fs from 'fs';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
const sha = ((() => { try { return execSync('git rev-parse HEAD').toString(); } catch (e) { return ''; } })() || process.env.GITHUB_SHA || 'local').slice(0, 5);   // lab のコミット(lab-preview で組み立てても lab の番号になる)
const jst = new Date(Date.now() + 9 * 36e5).toISOString().slice(5, 16).replace('T', ' ');
const branch = (process.env.BUILD_BRANCH || (() => { try { return execSync('git rev-parse --abbrev-ref HEAD').toString().trim(); } catch (e) { return ''; } })() || '').replace(/^HEAD$/, '');
const BUILD = `${jst} ${sha}${branch && branch !== 'polish' ? ' ' + branch : ''}`;
const SPLIT = process.env.SPLIT_THREE === '1';   // シリーズ用：three.js を別ファイルにして、町の本体だけ更新されたら本体だけ読み直せるようにする
const shim = { name: 'three-shim', setup(b) { b.onResolve({ filter: /^three$/ }, () => ({ path: 'three', namespace: 'three-shim' })); b.onLoad({ filter: /.*/, namespace: 'three-shim' }, () => ({ contents: 'module.exports = window.__THREE;', loader: 'js' })); } };
const r = await build({ plugins: SPLIT ? [shim] : [], entryPoints: ['src/entry.js'], bundle: true, minify: true, format: 'iife', globalName: 'Hoshimiya', write: false, target: 'es2020', legalComments: 'none', loader: { '.webp': 'dataurl' }, define: { __BUILD__: JSON.stringify(BUILD) } });
const js = r.outputFiles[0].text;
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/town.js', js);
if (SPLIT) {
  const v = await build({ stdin: { contents: "import * as T from 'three'; window.__THREE = T;", resolveDir: process.cwd(), loader: 'js' }, bundle: true, minify: true, format: 'iife', write: false, target: 'es2020', legalComments: 'none' });
  fs.writeFileSync('dist/three.js', v.outputFiles[0].text);
}
const html = fs.readFileSync('src/shell.html', 'utf8').replace('/*APP*/', () => js.replace(/<\/script/g, '<\\/script'));
fs.writeFileSync('dist/index.html', html);
fs.cpSync('apps', 'dist/apps', { recursive: true });
fs.cpSync('sdk', 'dist/sdk', { recursive: true });
// assets/ の中のフォルダ(tarot・bgm・models など)は、全部そのまま dist/ に置く。
// 素材の種類を増やしても、ここ・統合アプリ・確認ページのどれも直さなくてよい(dist/ をまるごと使う決まり)。
for (const d of fs.readdirSync('assets', { withFileTypes: true })) if (d.isDirectory()) fs.cpSync('assets/' + d.name, 'dist/' + d.name, { recursive: true });
// 画質モード: dist/models は「形を詰めたもの」(高画質)、dist/models_lite は「絵も軽くしたもの」(軽量)。作り方は tools/gen_models.py
// 元(assets/models)と印がちがう=作り直し忘れのときは、元のファイルをそのまま使う(見た目が古くなったり、壊れたりしない)
if (fs.existsSync('dist/models')) {
  const man = fs.existsSync('assets_gen/src.json') ? JSON.parse(fs.readFileSync('assets_gen/src.json', 'utf8')) : {};
  fs.mkdirSync('dist/models_lite', { recursive: true }); const stale = [];
  for (const f of fs.readdirSync('assets/models')) {
    if (!f.endsWith('.glb')) continue;
    const h = createHash('sha1').update(fs.readFileSync('assets/models/' + f)).digest('hex').slice(0, 12);
    const ok = man[f] === h && fs.existsSync('assets_gen/hi/' + f) && fs.existsSync('assets_gen/lite/' + f);
    if (ok) { fs.copyFileSync('assets_gen/hi/' + f, 'dist/models/' + f); fs.copyFileSync('assets_gen/lite/' + f, 'dist/models_lite/' + f); }
    else { fs.copyFileSync('assets/models/' + f, 'dist/models_lite/' + f); stale.push(f); }
  }
  if (fs.existsSync('assets_gen/measure.json')) fs.copyFileSync('assets_gen/measure.json', 'dist/models/measure.json');   // 体ごとの測った値(tools/gen_measure.mjs)。古い値は、町の側で見分けて使わない
  if (stale.length) console.log('⚠ 画質モード用が古いので、元のまま使うモデル:', stale.join(' '), '(python3 tools/gen_models.py で作り直す)');
  const ver = {}; for (const f of fs.readdirSync('dist/models_lite')) ver[f] = createHash('sha1').update(fs.readFileSync('dist/models_lite/' + f)).digest('hex').slice(0, 8);
  fs.writeFileSync('dist/models_lite/versions.json', JSON.stringify(ver));
}
// 3Dモデルの版の印(中身が変わると変わる)。古いモデルがスマホに残らないよう、読むときに ?v= を付ける
if (fs.existsSync('dist/models')) {
  const ver = {};
  for (const f of fs.readdirSync('dist/models')) ver[f] = createHash('sha1').update(fs.readFileSync('dist/models/' + f)).digest('hex').slice(0, 8);
  fs.writeFileSync('dist/models/versions.json', JSON.stringify(ver));
}
// 有料モデル(運営の確認用)にも版の印。差し替えても、端末の古いデータが出つづけないように(models/ とは別の印の表。点検は models/ だけを見る)
if (fs.existsSync('dist/paid')) {
  const ver = {};
  for (const f of fs.readdirSync('dist/paid')) ver[f] = createHash('sha1').update(fs.readFileSync('dist/paid/' + f)).digest('hex').slice(0, 8);
  fs.writeFileSync('dist/paid/versions.json', JSON.stringify(ver));
}
// 公開用の town3d/index.html も毎回ここで上書きする(手でコピーし忘れて古いままになるのを防ぐ)
if (!SPLIT) fs.copyFileSync('dist/index.html', 'index.html');
console.log('dist/index.html', (html.length / 1024).toFixed(0) + 'KB');
