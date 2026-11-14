#!/usr/bin/env node
/* 名前の衝突チェック: 3Dの町(town3d)と、外側の画面(series/apps・core)で、同じ tw- の名前を使っていないか。
   外側のCSSが決めた見た目(とくに「隠す」)が、町の中の部品に効いてしまう事故を、公開前に止める。
   わざと共有している名前だけ、下の OK に書く。 */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OK = new Set(['tw-top', 'tw-app-layer', 'tw-talking', 'tw-dialog', 'tw-canvas']);   // tw-top は外側が body> 直下だけに限定。ほかは町の状態を外側が見るための共有
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.name === 'dist' || e.name === 'node_modules' ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : /\.(js|css|html)$/.test(e.name) ? [path.join(d, e.name)] : []) : [];
const names = (files, re) => { const m = new Map(); for (const f of files) for (const x of fs.readFileSync(f, 'utf8').matchAll(re)) { if (!m.has(x[1])) m.set(x[1], path.relative(ROOT, f)); } return m; };
const SEL = /\.(tw-[a-zA-Z0-9_-]+)\s*[{,:.\s>+~\[)]/g, ANY = /\b(tw-[a-zA-Z0-9_-]+)\b/g;
const town = walk(path.join(ROOT, '..', 'town3d', 'src')), outer = [...walk(path.join(ROOT, 'apps')), ...walk(path.join(ROOT, 'core'))];
const oSel = names(outer.filter(f => f.endsWith('.css')), SEL), tAny = names(town, ANY), tSel = names(town, SEL), oAny = names(outer, ANY);
const bad = [...new Set([...[...oSel.keys()].filter(k => tAny.has(k)), ...[...tSel.keys()].filter(k => oAny.has(k))])].filter(k => !OK.has(k));
if (bad.length) { console.error('✗ 名前の衝突: 町と外側の画面で同じ名前を使っています → ' + bad.map(k => `${k} (${oSel.get(k) || oAny.get(k)} / ${tAny.get(k)})`).join(', ') + '\n  どちらかの名前を変えてください(わざと共有するなら tools_check_names.mjs の OK に足す)'); process.exit(1); }
console.log('名前の衝突なし');
