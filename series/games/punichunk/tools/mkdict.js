#!/usr/bin/env node
// eigo_nou の手作り辞書 → ぷにチャンク用辞書(src/dict_data.js)
// 使い方: node tools/mkdict.js <eigo_nou/src> [出力先]
'use strict';
const fs = require('fs'), path = require('path');
const loadA = require('./loadA.js');
const SRC = process.argv[2] || '/tmp/claude-0/a/src';
const OUT = process.argv[3] || path.join(__dirname, '..', 'src', 'dict_data.js');
const { L, X } = loadA(SRC);

// ---- 不適切語フィルタ(一般向け・子どもも遊ぶ) ----
const BLOCK = new Set(('kill killed murder shoot shot gun guns bomb weapon sword blood bloody die died dead death suicide ' +
  'beer wine sake alcohol drunk whisky vodka cigarette cigarettes smoke smoking tobacco drug drugs ' +
  'sexy sex naked nude kiss kissed stupid idiot fool dumb ugly fat hate shit damn hell god jesus ' +
  'fight punch hit kick steal stole rob crash war enemy prison jail police gamble').split(/\s+/));
const BLOCKP = /\b(shut up|throw up|beat up|pee|poop|fart|butt|toilet paper)\b/i;
const bad = s => BLOCKP.test(s) || String(s).toLowerCase().split(/[^a-z']+/).some(t => BLOCK.has(t));

const CEFR = X.CEFR_LV || {};
const lvOf = (x, def) => Math.max(1, Math.min(4, x.cefr || CEFR[x.id] || (x.upv ? 3 : x.vx ? 2 : def || 1)));
const out = { noun: [], verb: [], adj: [], adv: [], idiom: [] };
const seen = {}; const once = (cat, key) => { const k = cat + ':' + key.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; };
const cap = s => /^[A-Z]/.test(s);

// ---- 名詞 ----
const PLONLY = /^(scissors|glasses|sunglasses|headphones|chopsticks|pants|jeans|clothes|stairs|shorts|pajamas|paints|instructions|the dishes|dishes|vegetables|mushrooms|noodles|french fries|cards|comics|video games|rice balls|crayons)$/;
function singular(w) { const sp = w.lastIndexOf(' '); if (sp > 0) return w.slice(0, sp + 1) + singular(w.slice(sp + 1)); if (/(shoe|toe|canoe|horse|house|nurse|purse|case|vase|rose|nose|cheese|course|blouse)s$/.test(w)) return w.slice(0, -1); if (/ies$/.test(w)) return w.slice(0, -3) + 'y'; if (/(ss|x|ch|sh)es$/.test(w)) return w.slice(0, -2); if (/oes$/.test(w)) return w.slice(0, -2); return w.replace(/s$/, ''); }
function addNoun(o) {
  if (o.c === 'p' && !PLONLY.test(o.w) && /[^s]s$/.test(o.w) && !/(us|is|ss)$/.test(o.w) && o.cat !== 'place') { o.w = singular(o.w); o.c = 'c'; if (!o.ad) o.ad = 'a'; }
  if (!o.w || bad(o.w) || /[^A-Za-z '\-]/.test(o.w)) return;
  if (!once('n', o.w)) return;
  out.noun.push(o);
}
const PL1 = /s$/;
L.things.forEach(x => {
  if (x.poss || x.hidden) return;
  let m = x.en.match(/^(a|an|the|my|some)\s+(.+)$/), w, c, ad;
  if (m) { w = m[2]; ad = m[1] === 'an' ? 'a' : m[1]; c = x.pl === 1 || (m[1] === 'the' && PL1.test(w) && x.pl !== 0) ? 'p' : m[1] === 'the' ? 't' : m[1] === 'some' ? 'u' : 'c'; }
  else { w = x.en; c = x.pl === 1 ? 'p' : cap(w) ? 'n' : 'u'; ad = ''; }
  if (c === 'p') ad = ad === 'a' ? '' : ad;
  addNoun({ w, c, ad, cat: (x.t || ['thing'])[0], tg: (x.t || []).filter(t => t !== 'any'), lv: lvOf(x, 1), ja: x.ja });
});
const IND = { something: 1, everything: 1, someone: 1, everyone: 1 };
L.people.forEach(x => {
  if (x.pron) { if (IND[x.en]) addNoun({ w: x.en, c: 'n', ad: '', cat: 'person', ind: 1, lv: 1, ja: x.ja }); return; }
  let m = x.en.match(/^(a|an|the|my)\s+(.+)$/), w, ad = '', c;
  if (m) { w = m[2]; ad = m[1] === 'an' ? 'a' : m[1]; c = x.pl ? 'p' : 'c'; } else { w = x.en; c = cap(w) ? 'n' : (x.pl ? 'p' : 'c'); }
  if (c === 'p' && ad === 'a') ad = '';
  addNoun({ w, c, ad, cat: x.animal ? 'animal' : 'person', lv: lvOf(x, 1), ja: x.ja });
});
// 場所
const PLACE_PREP = /^(at|in|on|by|under|near)\s+(.+)$/;
L.places.forEach(x => {
  const en = x.en; if (bad(en)) return;
  const lv = lvOf(x, 1);
  if (en === 'in the rain') return;
  if (!/\s/.test(en)) { if (once('adv', en)) out.adv.push({ w: en, k: 'place', lv, ja: x.ja }); return; }
  const m = en.match(PLACE_PREP);
  if (m && !/'s\b/.test(en)) {
    const rest = m[2]; const mm = rest.match(/^(the|my|a)\s+([a-z][a-z ]*)$/);
    if (mm && !/\s(and|of)\s/.test(mm[2])) { addNoun({ w: mm[2], c: /[^s]s$/.test(mm[2]) ? 'p' : 'c', ad: mm[1], cat: 'place', prep: m[1], lv, ja: x.jn || x.ja }); return; }
    if (/^[A-Z][a-z]+$/.test(rest)) { addNoun({ w: rest, c: 'n', ad: '', cat: 'place', prep: m[1], lv, ja: x.jn || x.ja }); return; }
  }
  if (en === 'in the rain') return;
  if (once('idiom', en)) out.idiom.push({ w: en, k: 'place', lv: Math.max(lv, 2), ja: x.ja });
});
// 時
const tsKeys = ts => { const s = new Set(); (ts || []).forEach(t => { if (t === 'past' || t === 'pastprog') s.add('past'); if (t === 'pres') s.add('pres'); if (t === 'prog') s.add('prog'); if (t === 'fut' || t === 'futprog') s.add('fut'); }); return [...s]; };
const TIME_NOUN = { morning: ['in', 't'], afternoon: ['in', 't'], evening: ['in', 't'], night: ['at', 'n'], noon: ['at', 'n'], midnight: ['at', 'n'], lunchtime: ['at', 'n'], weekend: ['on', 't'], birthday: ['on', 'c'] };
L.times.forEach(x => {
  const en = x.en; const ts = tsKeys(x.ts); if (!ts.length || bad(en)) return;
  const lv = lvOf(x, 1);
  const m = en.match(/^(in|on|at)\s+(the\s+|my\s+)?([A-Za-z]+)$/);
  if (m) {
    const w = m[3];
    if (/^[A-Z][a-z]*s$/.test(w)) return;
    if (/^[A-Z]/.test(w)) { addNoun({ w, c: 'n', ad: '', cat: 'time', prep: m[1], ts, lv, ja: x.ja.replace(/に$/, '') }); return; }
    if (/^(spring|summer|autumn|winter)$/.test(w)) { addNoun({ w, c: 'n', ad: '', cat: 'time', prep: 'in', ts, lv, ja: x.ja.replace(/に$/, '') }); return; }
    const tn = TIME_NOUN[w]; if (tn) { addNoun({ w, c: tn[1], ad: m[2] ? m[2].trim() : '', cat: 'time', prep: tn[0], ts, lv, ja: x.ja.replace(/に$/, '') }); return; }
  }
  if (/^(never|already|yet|before|once|twice|forever|sometimes)$/.test(en)) return;
  if (/^(since|on the day)/.test(en)) return;
  if (!/\s/.test(en)) { if (once('adv', en)) out.adv.push({ w: en, k: 'time', ts, lv, ja: x.ja }); }
  else if (once('idiom', en)) out.idiom.push({ w: en, k: 'time', ts, lv: Math.max(lv, 1), ja: x.ja });
});
// ---- 動詞 ----
const CATV = { want: 'to', hope: 'to', decide: 'to', plan: 'to', need: 'to', learn: 'to', forget: 'to', promise: 'to', agree: 'to', refuse: 'to', expect: 'to', try: 'both', like: 'both', love: 'both', hate: 'both', start: 'both', begin: 'both', continue: 'both', prefer: 'both', enjoy: 'ing', finish: 'ing', stop: 'ing', keep: 'ing', practice: 'ing', mind: 'ing', avoid: 'ing', imagine: 'ing', miss: 'ing', quit: 'ing', remember: 'ing' };
const LINK = { become: 1, look: 1, feel: 1, seem: 1, sound: 1, get: 1, stay: 1, turn: 1 };
const linkAdded = {};
L.verbs.forEach(x => {
  if (x.hidden || x.caus || x.cl || x.clj || x.clq || x.whOnly || x.synText || x.weather || x.typed) return;
  if (x.tail && /[{}…]/.test(x.tail)) return;
  if (x.prep && /[{}…]/.test(x.prep)) return;
  const tail = [x.tail, x.prep].filter(Boolean).join(' ');
  const w = (x.en + (tail ? ' ' + tail : '')).trim();
  if (bad(w) || /[^a-z '\-]/.test(w) || x.en.includes(' ')) return;
  if (!once('v', w)) return;
  let fr = x.fr === 'cl' ? 'tr' : x.fr; if (x.prep) fr = 'tr';
  const o = { w, b: x.en, past: x.past || '', pp: x.pp || '', s3: x.s3 || '', dbl: x.dbl ? 1 : 0, fr, lv: lvOf(x, 1), ja: x.ja };
  if (tail) o.tail = tail;
  if (x.t && x.t.length) o.ot = x.t;
  if (x.dt && !tail) o.dt = 1;
  if (!tail && CATV[x.en]) o.cv = CATV[x.en];
  if (!tail && LINK[x.en]) { o.link = 1; linkAdded[x.en] = 1; }
  out.verb.push(o);
});
if (X.LINKV) Object.entries(X.LINKV).forEach(([k, x]) => { if (!linkAdded[k] && once('v', x.en)) out.verb.push({ w: x.en, b: x.en, past: x.past || '', pp: x.pp || '', s3: '', dbl: x.dbl ? 1 : 0, fr: 'intr', link: 1, lv: 2, ja: x.ja }); });
// ---- 形容詞 ----
L.states.forEach(x => {
  if (x.idiom || x.sidiom || x.noun || x.hidden) return;
  const w = x.en; if (/[^a-z\-]/.test(w) || bad(w)) return;
  if (!once('a', w)) return;
  const o = { w, lv: lvOf(x, 1), ja: x.ja, jt: x.jt };
  if (x.comp) { o.cmp = x.comp; o.sup = x.sup; } else if (x.nocmp) o.no = 1; else o.more = 1;
  out.adj.push(o);
});
// ---- 副詞・慣用句 ----
L.manners.forEach(x => {
  const en = x.en; if (bad(en) || x.neg || /^(anymore|by far|slowly and carefully)$/.test(en)) return;
  const lv = lvOf(x, 1);
  if (!/\s/.test(en)) { if (once('adv', en)) out.adv.push({ w: en, k: 'manner', lv, ja: x.ja }); }
  else if (once('idiom', en)) out.idiom.push({ w: en, k: 'other', lv: Math.max(lv, 2), ja: x.ja });
});
if (once('adv', 'home')) out.adv.push({ w: 'home', k: 'place', lv: 1, ja: '家へ' });
(X.FREQADV || []).forEach(x => { if (/^(always|usually|often|sometimes|never)$/.test(x.en) && once('adv', x.en)) out.adv.push({ w: x.en, k: 'freq', lv: 1, ja: x.ja }); });
const FRONT_SKIP = /^(Not|Just|Still|Please|Thanks|Sorry|Hi|Ow|Ugh|Huh|No|Yes|Yeah|Alright|Oops|Hey|Look|Listen|Then|First|Finally|Also|Suddenly|Usually|Sometimes|Often|Right|Nice|Great|Good luck|Thanks to you|To me)$/;
X.FRONTS.forEach(x => {
  let en = x.en; if (x.need || x.ts || x.nc || FRONT_SKIP.test(en) || bad(en)) return;
  if (/^(One day|That night|After school|This morning|On weekends|Once a week|These days|Right now|At the moment|So far|In the end|At first|At last|From time to time|In the meantime|At this point|Once again|After that|In the first place)$/.test(en)) return;
  if (/^Guess what$/.test(en)) en = 'Guess what?';
  if (!once('front', en)) return;
  out.idiom.push({ w: en, k: 'front', lv: x.idiom ? 3 : (x.casual ? 2 : 1), ja: x.ja });
});
// 数量の慣用句(名詞の前に付く)
[['a lot of', 'たくさんの', 1], ['lots of', 'たくさんの', 2], ['a few', 'いくつかの', 2], ['a cup of', '1杯の', 2], ['a glass of', 'グラス1杯の', 2], ['a piece of', '1切れの', 3], ['a bottle of', '1本の', 3]]
  .forEach(([w, ja, lv]) => out.idiom.push({ w, k: 'quant', lv, ja, q: /cup|glass|bottle|piece/.test(w) ? 'u' : 'p' }));

// ---- 書き出し ----
const stat = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length]));
const banner = '// 自動生成:tools/mkdict.js(元データ:eigo_nou の手作り辞書)。手で直さない。\n';
fs.writeFileSync(OUT, banner + 'var DICT_DATA=' + JSON.stringify(out) + ';\n');
console.log('wrote', OUT, JSON.stringify(stat), (fs.statSync(OUT).size / 1024).toFixed(1) + 'KB');
if (process.argv.includes('--sample')) for (const k in out) console.log(k, out[k].filter((x, i) => i % Math.ceil(out[k].length / 8) === 0).map(x => JSON.stringify(x)).join('\n  '));
