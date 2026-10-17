#!/usr/bin/env node
// chunk-chunk の例文(役割ラベル付き)→ ぷにチャンクのタネ文(src/seed_data.js)
// 使い方: node tools/mkseeds.js <chunk-chunk/js/data.js> [出力先]
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const SRC = process.argv[2] || '/tmp/claude-0/b/js/data.js';
const OUT = process.argv[3] || path.join(__dirname, '..', 'src', 'seed_data.js');
const { G, Dict, DICT_DATA } = require('../tests/load.js')();
const MAN = { auto: { art: false, prep: false, verb: false, ti: false, er: false } };

const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(SRC, 'utf8') + ';this.T=ONE_TIERS;this.S=STORIES;', ctx);
const sents = [];
ctx.T.forEach((t, i) => t.list.forEach(x => sents.push({ s: x[0], lv: i < 1 ? 1 : i < 3 ? 2 : 3 })));
ctx.S.forEach(st => st.list.forEach(x => sents.push({ s: x[0], lv: Math.min(3, st.lv || 2) })));

// ---- 語 → スペック ----
const SP = {};
const put = (k, spec) => { if (!SP[k]) SP[k] = spec; };
['a', 'an', 'the'].forEach(v => put(v, 'det:' + (v === 'an' ? 'a' : v)));
G.QUANTS.forEach(v => put(v, 'q:' + v));
DICT_DATA.idiom.filter(x => x.k === 'quant').forEach(x => put(x.w.toLowerCase(), 'q:' + x.w));
[].concat(...G.PREP_G).forEach(v => put(v, 'prep:' + v));
['can', 'could', 'will', 'would', 'may', 'might', 'must', 'should'].forEach(v => put(v, 'modal:' + v));
G.SEMIS.forEach(v => put(v, 'sm:' + v)); put('wants to', 'sm:want to'); put('has to', 'sm:have to'); put('needs to', 'sm:need to');
put('wanted to', 'sm:want to|past'); put('had to', 'sm:have to|past'); put('needed to', 'sm:need to|past');
G.DEGS.forEach(v => put(v, 'deg:' + v));
G.CONJ_SUB.concat(G.CONJ_CO).forEach(v => put(v, 'conj:' + v));
put('not', 'not'); ['am', 'is', 'are', 'be'].forEach(v => put(v, 'be:pres')); ['was', 'were'].forEach(v => put(v, 'be:past'));
const PR = { i: 'i', me: 'i', my: 'i', you: 'you', your: 'you', he: 'he', him: 'he', his: 'he', she: 'she', her: 'she', it: 'it', its: 'it', we: 'we', us: 'we', our: 'we', they: 'they', them: 'they', their: 'they' };
Object.entries(PR).forEach(([k, v]) => put(k, 'pr:' + v));
DICT_DATA.idiom.filter(x => x.k !== 'quant').forEach(x => put(x.w.toLowerCase(), 'idm:' + x.w));
DICT_DATA.noun.forEach(n => { put(n.w.toLowerCase(), 'n:' + n.w); if (n.c === 'c' || n.c === 't') put(Dict.plural(n.w).toLowerCase(), 'n:' + n.w + '|pl'); });
DICT_DATA.verb.forEach(v => { const b = Dict.base(v), forms = [[b, 'base'], [Dict.s3(v), 'base'], [Dict.past(v), 'past'], [Dict.pp(v), 'pp'], [Dict.ing(v), 'ing']]; forms.forEach(([f, k]) => put(f.toLowerCase(), 'v:' + v.w + '|' + k)); });
DICT_DATA.adj.forEach(a => { put(a.w, 'adj:' + a.w); if (a.cmp) { put(a.cmp, 'adj:' + a.w + '|er'); put(a.sup, 'adj:' + a.w + '|est'); } });
DICT_DATA.adv.forEach(a => put(a.w.toLowerCase(), 'adv:' + a.w));
const MAXW = 4;
function words(text) {
  const t = text.replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  const out = [];
  for (let i = 0; i < t.length;) {
    let hit = null;
    for (let k = Math.min(MAXW, t.length - i); k >= 1 && !hit; k--) { const key = t.slice(i, i + k).join(' ').toLowerCase(); if (SP[key]) hit = [SP[key], k]; }
    if (!hit) return null;
    // 形容詞の比較(bigger)は adj + er に分ける
    const sp = hit[0];
    if (/^adj:.*\|(er|est)$/.test(sp)) { const [w, e] = sp.slice(4).split('|'); out.push('adj:' + w, 'er:' + e); }
    else out.push(sp);
    i += hit[1];
  }
  return out;
}
// スペック → トークン(ランタイムと同じ規則。src/seeds.js の resolve と合わせる)
const IDX = {}; ['noun', 'verb', 'adj', 'adv', 'idiom'].forEach(p => { IDX[p] = {}; DICT_DATA[p].forEach(e => IDX[p][e.w] = e); });
function tok(sp) {
  const [k, rest] = [sp.split(':')[0], sp.slice(sp.indexOf(':') + 1)];
  const [w, x] = rest.split('|');
  switch (k) {
    case 'n': return IDX.noun[w] && { k: 'n', e: IDX.noun[w], pl: x === 'pl' };
    case 'v': return IDX.verb[w] && { k: 'v', e: IDX.verb[w], f: x || 'base' };
    case 'adj': return IDX.adj[w] && { k: 'adj', e: IDX.adj[w] };
    case 'adv': return IDX.adv[w] && { k: 'adv', e: IDX.adv[w] };
    case 'idm': return IDX.idiom[w] && { k: 'idm', e: IDX.idiom[w] };
    case 'q': return { k: 'q', v: w, e: IDX.idiom[w] };
    case 'sm': return { k: 'sm', v: w, t: x || 'pres' };
    case 'be': return { k: 'be', v: w };
    case 'not': return { k: 'not' };
    case 'er': return { k: 'er', v: w };
    default: return { k, v: w };
  }
}
// 単位(S/V/O…)の語を、連鎖で作れるチャンクに切り分ける
function split(specs) {
  const out = []; let cur = [];
  for (const sp of specs) {
    const t = tok(sp); if (!t) return null;
    const cw = cur.map(tok);
    if (cur.length && G.canAppend(cw, t)) { cur.push(sp); continue; }
    if (cur.length) { const st = G.chainState(cw, MAN); if (!st.complete || st.err) return null; out.push(cur); }
    cur = [sp];
  }
  if (cur.length) { const st = G.chainState(cur.map(tok), MAN); if (!st.complete || st.err) return null; out.push(cur); }
  return out;
}
const seeds = [], why = {};
const norm = s => s.toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim();
sents.forEach(({ s, lv }) => {
  const units = s.split(' | ').map(u => u.trim().replace(/^[A-Z]:/, '').split('=')[0].replace(/ \/ /g, ' ').trim());
  const eng = units.join(' ');
  let chunks = [];
  for (const u of units) {
    const id = SP[u.replace(/[.,!?]/g, '').toLowerCase()];
    if (id && id.startsWith('idm:')) { chunks.push([id]); continue; }
    const ws = words(u); if (!ws) { why.word = (why.word || 0) + 1; return; }
    const sp = split(ws); if (!sp) { why.chunk = (why.chunk || 0) + 1; return; }
    chunks = chunks.concat(sp);
  }
  const T = chunks.map(c => G.chainState(c.map(tok), MAN).chunk);
  const r = G.parse(T, MAN);
  if (!r.ok || r.kind !== 'S') { why.parse = (why.parse || 0) + 1; return; }
  if (norm(r.text) !== norm(eng)) { why.text = (why.text || 0) + 1; return; }
  seeds.push({ c: chunks, lv });
});
fs.writeFileSync(OUT, '// 自動生成:tools/mkseeds.js(元データ:chunk-chunk の例文)。手で直さない。\nvar SEED_DATA=' + JSON.stringify(seeds) + ';\n');
console.log('seeds', seeds.length, '/', sents.length, 'skip', JSON.stringify(why));
if (process.argv.includes('--show')) seeds.forEach(x => console.log(' ', x.lv, x.c.map(c => c.join(' ')).join(' | ')));
