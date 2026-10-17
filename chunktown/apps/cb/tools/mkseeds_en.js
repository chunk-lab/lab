#!/usr/bin/env node
// 英語脳(eigo_nou)の文生成エンジンで自然な文を作り → ぷにチャンクのタネ文(src/seed_data.js)
// 使い方: node tools/mkseeds_en.js <eigo_nou/src> [本数] [出力先]
'use strict';
const fs = require('fs'), path = require('path');
const SRC = process.argv[2] || '/tmp/claude-0/a/src', N = +(process.argv[3] || 2400);
const OUT = process.argv[4] || path.join(__dirname, '..', 'src', 'seed_data.js');
const { G, Dict, DICT_DATA } = require('../tests/load.js')();
const MAN = { auto: { art: false, prep: false, verb: false, ti: false, er: false } };
const EN = require('./loadEN.js')(SRC).__ev;
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
const MAXW = 4, SPV = {};
DICT_DATA.verb.forEach(v => { const b = Dict.base(v); [[b, 'base'], [Dict.s3(v), 'base'], [Dict.past(v), 'past'], [Dict.pp(v), 'pp'], [Dict.ing(v), 'ing']].forEach(([f, k]) => { if (!SPV[f.toLowerCase()]) SPV[f.toLowerCase()] = 'v:' + v.w + '|' + k; }); });
function words(text, verbPart) {
  const t = text.replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  const out = [];
  for (let i = 0; i < t.length;) {
    let hit = null;
    for (let k = Math.min(MAXW, t.length - i); k >= 1 && !hit; k--) { const key = t.slice(i, i + k).join(' ').toLowerCase(); const sp0 = verbPart && k === 1 && SPV[key] && !/^(be|modal|sm|not|pr|det)/.test(SP[key] || '') ? SPV[key] : SP[key]; if (sp0) hit = [sp0, k]; }
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

// ---- 英語脳で文を作る ----
EN(`var __SUBJ=['p:i','p:you','p:he','p:she','p:we','p:they','p:mom','p:dad','p:boy','p:girl','p:ken','p:mika','p:teacher','p:friends','p:dog','p:cat'];
var __pk=a=>a[Math.floor(Math.random()*a.length)];
function __gen(){
  const tense=__pk(['pres','pres','past','past','fut','prog']);
  const c=drGen({subj:__pk(__SUBJ),tense:tense}); if(!c) return null;
  const r=Math.random(), opt=x=>(reelCands(x,c)||[]).filter(Boolean);
  // 副詞句(場所・時・様子・頻度)を、ほとんどの文に1〜2個入れる
  const adv=[]; if(Math.random()<.55) adv.push('place'); if(Math.random()<.5) adv.push('time'); if(Math.random()<.22) adv.push('manner'); if(!adv.length && Math.random()<.8) adv.push(__pk(['place','time','manner']));
  if(Math.random()<.22){ const m=opt('aux'); if(m.length) c.modal=__pk(m); }
  else if(Math.random()<.12 && tense==='pres'){ const f=opt('freq'); if(f.length) c.freq=__pk(f); }
  adv.forEach(k=>{ const o=opt(k); if(o.length) c[k]=__pk(o.slice(0,25)); });
  try{ fixTense(c,{kind:'main'}); }catch(e){}
  try{ const P=sentenceParts({main:c}); if(P.some(p=>p.hole||p.subStart)) return null;
    return {parts:P.filter(p=>p.en).map(p=>({k:String(p.key||''),en:p.en})), text:sentenceText({main:c}), ja:sentenceJa({main:c})}; }catch(e){ return null; }
}`);
const seeds = [], why = {}, seen = new Set();
const norm = s => s.toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim();
for (let t = 0; t < N * 6 && seeds.length < N; t++) {
  const s = EN('__gen()'); if (!s) { why.gen = (why.gen || 0) + 1; continue; }
  if (seen.has(s.text)) continue; seen.add(s.text);
  let chunks = [], bad = false;
  // 助動詞・not・動詞は1つの単位にまとめる(can + swim → can swim)
  const parts = [];
  s.parts.forEach(p => { const vk = /\.(aux|neg|verb|freq|not)$/.test(p.k), last = parts[parts.length - 1]; if (vk && last && last.vk) { last.en += ' ' + p.en; last.k += '+' + p.k; } else parts.push({ k: p.k, en: p.en, vk }); });
  for (const p of parts) {
    const u = p.en.replace(/[.,!?]/g, '').trim(); if (!u) continue;
    const id = SP[u.toLowerCase()];
    if (id && id.startsWith('idm:')) { chunks.push([id]); continue; }
    const ws = words(u, /verb|aux/.test(p.k)); if (!ws) { why.word = (why.word || 0) + 1; (why.miss = why.miss || {})[u] = 1; bad = true; break; }
    const sp = split(ws); if (!sp) { why.chunk = (why.chunk || 0) + 1; (why.cex = why.cex || []).length < 12 && why.cex.push(p.k + ':' + u + ' = ' + ws.join(' ')); bad = true; break; }
    chunks = chunks.concat(sp);
  }
  if (bad) continue;
  const T = chunks.map(c => G.chainState(c.map(tok), MAN).chunk);
  const r = G.parse(T, MAN);
  if (!r.ok || r.kind !== 'S') { why.parse = (why.parse || 0) + 1; (why.pex = why.pex || []).length < 8 && why.pex.push(s.text); continue; }
  if (norm(r.text) !== norm(s.text)) { why.text = (why.text || 0) + 1; (why.tex = why.tex || []).length < 8 && why.tex.push(s.text + ' => ' + r.text); continue; }
  const nw = chunks.reduce((a, c) => a + c.length, 0), hasAux = chunks.some(c => c.some(x => /^(modal|sm|not|be)/.test(x)));
  const lv = nw <= 4 && !hasAux ? 1 : nw <= 7 ? 2 : 3;
  seeds.push({ c: chunks, lv, ja: s.ja });
}
// 小さく書き出す:「レベル^日本語^単位/単位」、単位の中は語をスペース区切り(語の中のスペースは _)
const packed = seeds.map(x => x.lv + '^' + x.ja + '^' + x.c.map(u => u.map(w => w.replace(/ /g, '_')).join(' ')).join('/'));
fs.writeFileSync(OUT, '// 自動生成:tools/mkseeds_en.js(英語脳の文生成エンジンで作った文)。手で直さない。\nvar SEED_DATA=' + JSON.stringify(packed).replace(/","/g, '",\n"') + ';\n');
const miss = Object.keys(why.miss || {}); delete why.miss;
console.log('seeds', seeds.length, 'skip', JSON.stringify(why).slice(0, 1500)); console.log('unknown units', miss.length, miss.slice(0, 60).join(' / '));
if (process.argv.includes('--show')) seeds.slice(0, 40).forEach(x => console.log(' ', x.lv, x.c.map(c => c.join(' ')).join(' | '), ' ', x.ja));
