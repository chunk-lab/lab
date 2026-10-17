// 判定エンジンの単体テスト:node tests/grammar.test.js
const { G, Dict, DICT_DATA } = require('./load.js')();
const AUTO = { auto: { art: true, prep: true, verb: true, ti: true, er: true } };
const MAN = { auto: { art: false, prep: false, verb: false, ti: false, er: false } };

// ---- 文字列 → トークン ----
const FW = {};
['a', 'the'].forEach(v => FW[v] = { k: 'det', v });
G.QUANTS.concat(['a lot of', 'a few', 'a cup of']).forEach(v => FW[v] = { k: 'q', v, e: DICT_DATA.idiom.find(x => x.w === v) });
[].concat(...G.PREP_G).forEach(v => FW[v] = { k: 'prep', v });
['can', 'could', 'will', 'would', 'may', 'might', 'must', 'should'].forEach(v => FW[v] = { k: 'modal', v });
G.DEGS.forEach(v => FW[v] = { k: 'deg', v });
G.CONJ_SUB.concat(G.CONJ_CO).forEach(v => FW[v] = { k: 'conj', v });
FW.not = { k: 'not' }; G.SEMIS.forEach(v => FW[v.replace(/ /g, '_')] = { k: 'sm', v }); FW['過去'] = { k: 'tp', v: 'past' }; FW['未来'] = { k: 'tp', v: 'fut' }; FW['進行'] = { k: 'tp', v: 'prog' }; FW.be = { k: 'be', v: 'pres' }; FW.was = { k: 'be', v: 'past' };
FW.to = { k: 'ti', v: 'to' }; FW['-ing'] = { k: 'ti', v: 'ing' }; FW['to/ing'] = { k: 'ti', v: null };
FW['-er'] = { k: 'er', v: 'er' }; FW['-est'] = { k: 'er', v: 'est' };
const PR = { I: 'i', you: 'you', he: 'he', she: 'she', it: 'it', we: 'we', they: 'they', my: 'i', his: 'he', her: 'she', your: 'you', our: 'we', their: 'they', me: 'i', him: 'he', them: 'they', us: 'we' };
const find = (pos, w) => DICT_DATA[pos].find(x => x.w === w);
const VF = {}; DICT_DATA.verb.forEach(v => { if (v.tail) return; VF[v.w] = VF[v.w] || [v, 'base']; const p = Dict.past(v), q = Dict.pp(v), i = Dict.ing(v); if (!VF[p]) VF[p] = [v, 'past']; if (!VF[q]) VF[q] = [v, 'pp']; if (!VF[i]) VF[i] = [v, 'ing']; });
function tok(s) {
  let [w, tag] = s.split(':'); w = w.replace(/_/g, ' ');
  if (tag === 'v') { const v = find('verb', w); if (v) return { k: 'v', e: v, f: 'base' }; const f = VF[w]; return { k: 'v', e: f[0], f: f[1] }; }
  if (tag === 'n' || tag === 'ns') { let e = find('noun', w); if (e) return { k: 'n', e }; e = DICT_DATA.noun.find(x => Dict.plural(x.w) === w); return { k: 'n', e, pl: true }; }
  if (tag === 'p') return { k: 'prep', v: w };
  if (tag === 'a') return { k: 'adj', e: find('adj', w) };
  if (tag === 'i') return { k: 'idm', e: find('idiom', w) };
  if (tag === 'x') return { k: 'adv', e: find('adv', w) };
  if ((FW[w] || FW[w.replace(/ /g, '_')]) && !tag) return Object.assign({}, FW[w] || FW[w.replace(/ /g, '_')]);
  if (PR[w] && !tag) return { k: 'pr', v: PR[w] };
  let e;
  if ((e = find('adj', w))) return { k: 'adj', e };
  if ((e = find('noun', w))) return { k: 'n', e };
  if ((e = DICT_DATA.noun.find(x => x.c !== 'u' && x.c !== 'n' && Dict.plural(x.w) === w))) return { k: 'n', e, pl: true };
  if ((e = find('verb', w))) return { k: 'v', e, f: 'base' };
  if (VF[w]) return { k: 'v', e: VF[w][0], f: VF[w][1] };
  if ((e = find('adv', w))) return { k: 'adv', e };
  if ((e = find('idiom', w))) return { k: 'idm', e };
  throw new Error('unknown word: ' + s);
}
function chunk(spec, cfg) {
  const ws = spec.trim().split(/\s+/).map(tok);
  const st = G.chainState(ws, cfg);
  if (!st.complete) throw new Error('chunk incomplete: ' + spec);
  if (st.err) return { err: st.err };
  return st.chunk;
}
function sent(spec, cfg) {
  const T = []; for (const p of spec.split('|')) { const c = chunk(p, cfg); if (c.err) return { ok: false, err: c.err, chunkErr: true }; T.push(c); }
  return G.parse(T, cfg);
}
let pass = 0, fail = 0; const fails = [];
const OKS = [];
function ok(spec, cfg, expect) { OKS.push([spec, cfg]); let r; try { r = sent(spec, cfg); } catch (e) { r = { ok: false, err: 'EXC ' + e.message }; } const good = r.ok && (!expect || r.text === expect); if (good) pass++; else { fail++; fails.push('OK expected: ' + spec + ' → ' + JSON.stringify(r.ok ? r.text : r.err) + (expect ? ' (want ' + expect + ')' : '')); } }
function ng(spec, cfg, code) { let r; try { r = sent(spec, cfg); } catch (e) { r = { ok: false, err: { code: 'EXC:' + e.message } }; } const good = !r.ok && (!code || (r.err && r.err.code === code)); if (good) pass++; else { fail++; fails.push('NG expected: ' + spec + ' → ' + JSON.stringify(r.ok ? r.text : r.err) + ' (want ' + code + ')'); } }
function chainOk(spec, cfg, type, text) { try { chainOk_(spec, cfg, type, text); } catch (e) { fail++; fails.push('EXC ' + spec + ': ' + e.message); } }
function chainOk_(spec, cfg, type, text) { const ws = spec.split(' ').map(tok); const st = G.chainState(ws, cfg); const good = st.complete && !st.err && (!type || st.chunk.t === type) && (!text || G.chunkText(st.chunk, cfg) === text); if (good) pass++; else { fail++; fails.push('chain OK: ' + spec + ' → ' + JSON.stringify({ c: st.complete, t: st.type, e: st.err, x: st.chunk && G.chunkText(st.chunk, cfg) })); } }
function chainNg(spec, cfg, code) { try { chainNg_(spec, cfg, code); } catch (e) { fail++; fails.push('EXC ' + spec + ': ' + e.message); } }
function chainNg_(spec, cfg, code) { const ws = spec.split(' ').map(tok); const st = G.chainState(ws, cfg); const good = !st.complete || (st.err && (!code || st.err.code === code)); if (good) pass++; else { fail++; fails.push('chain NG: ' + spec + ' → ' + JSON.stringify({ t: st.type, x: G.chunkText(st.chunk, cfg) })); } }
function pre(spec, want) { const ws = spec.split(' ').map(tok); const v = G.chainState(ws, AUTO).prefix; if (v === want) pass++; else { fail++; fails.push('prefix ' + spec + ' want ' + want); } }

// ===== チャンク(自動) =====
chainOk('the big dog', AUTO, 'NP', 'the big dog');
chainOk('dog', AUTO, 'NP', 'the dog');
chainOk('apple', AUTO, 'NP', 'an apple');
chainOk('big apple', AUTO, 'NP', 'a big apple');
chainOk('old umbrella', AUTO, 'NP', 'an old umbrella');
chainOk('water', AUTO, 'NP', 'water');
chainOk('a water', AUTO, 'NP', 'the water');
chainOk('two dog', AUTO, 'NP', 'two dogs');
chainOk('many cat', AUTO, 'NP', 'many cats');
chainOk('every boy', AUTO, 'NP', 'every boy');
chainOk('a_lot_of apple', AUTO, 'NP', 'a lot of apples');
chainOk('my dog', AUTO, 'NP', 'my dog');
chainOk('her cat', AUTO, 'NP', 'her cat');
chainOk('very big dog', AUTO, 'NP', 'the very big dog');
chainOk('big -er dog', AUTO, 'NP', 'the bigger dog');
chainOk('big -est dog', AUTO, 'NP', 'the biggest dog');
chainOk('a big -est dog', AUTO, 'NP', 'the biggest dog');
chainOk('beautiful -er picture', AUTO, 'NP', 'a more beautiful picture');
chainOk('I', AUTO, 'NP', 'I');
chainOk('he she', AUTO, 'NP', 'they');
chainOk('I he', AUTO, 'NP', 'we');
chainOk('mom', AUTO, 'NP', 'my mom');
chainOk('Ken', AUTO, 'NP', 'Ken');
chainOk('the Ken', AUTO, 'NP', 'Ken');
chainOk('in the park', AUTO, 'PP', 'in the park');
chainOk('at park', AUTO, 'PP', 'at the park');
chainOk('on park', AUTO, 'PP', 'in the park');
chainOk('at Monday', AUTO, 'PP', 'on Monday');
chainOk('in Monday', AUTO, 'PP', 'on Monday');
chainOk('on morning', AUTO, 'PP', 'in the morning');
chainOk('at night', AUTO, 'PP', 'at night');
chainOk('with him', AUTO, 'PP', 'with him');
chainOk('with my friend', AUTO, 'PP', 'with my friend');
chainOk('flowers', AUTO, 'NP', 'flowers');
chainOk('to:p the zoo', AUTO, 'PP', 'to the zoo');
chainOk('run', AUTO, 'VP', 'run');
chainOk('can run', AUTO, 'VP', 'can run');
chainOk('can not run', AUTO, 'VP', "can't run");
chainOk('be run', AUTO, 'VP', 'be running');
chainOk('run quickly', AUTO, 'VP', 'run quickly');
chainOk('run very quickly', AUTO, 'VP', 'run very quickly');
chainOk('always run', AUTO, 'VP', 'always run');
chainOk('not run', AUTO, 'VP', 'not run');
chainOk('be', AUTO, 'VP', 'be');
chainOk('will be', AUTO, 'VP', 'will be');
chainOk('to swim', AUTO, 'NF', 'to swim');
chainOk('swim to/ing', AUTO, 'NF', 'swimming');
chainOk('to/ing swim', AUTO, 'NF', 'to swim');
chainOk('happy', AUTO, 'AP', 'happy');
chainOk('very happy', AUTO, 'AP', 'very happy');
chainOk('happy -er', AUTO, 'AP', 'happier');
chainOk('quickly', AUTO, 'ADV', 'quickly');
chainOk('yesterday', AUTO, 'ADV', 'yesterday');
chainOk('In_my_opinion', AUTO, 'ID');
chainOk('when', AUTO, 'CONJ');
chainNg('the', AUTO); chainNg('the big', AUTO); chainNg('can', AUTO); chainNg('in', AUTO); chainNg('in the', AUTO); chainNg('very', AUTO); chainNg('always', AUTO); chainNg('not', AUTO);
chainNg('dog the', AUTO); chainNg('run dog', AUTO); chainNg('big run', AUTO); chainNg('can can run', AUTO); chainNg('run be', AUTO);
pre('the', true); pre('the big', true); pre('in the big', true); pre('can', true); pre('the run', false); pre('dog big', false); pre('quickly run', false); pre('to/ing', true);
// ===== チャンク(手動) =====
chainOk('a dog', MAN, 'NP', 'a dog'); chainOk('the water', MAN, 'NP'); chainOk('water', MAN, 'NP'); chainOk('dogs', MAN, 'NP', 'dogs');
chainOk('the big -est dog', MAN, 'NP', 'the biggest dog');
chainNg('dog', MAN, 'needDet'); chainNg('a water', MAN, 'aBad'); chainNg('a dogs', MAN, 'aBad'); chainNg('the Ken', MAN, 'properDet');
chainNg('a big -est dog', MAN, 'supThe'); chainNg('many water', MAN, 'qBad'); chainNg('a_cup_of dog', MAN, 'qBad');
chainNg('at Monday', MAN, 'prepTime'); chainNg('in morning', MAN, 'needThe'); chainNg('on the park', MAN, 'prepPlace');
chainOk('on Monday', MAN, 'PP'); chainOk('in the morning', MAN, 'PP'); chainOk('at the park', MAN, 'PP'); chainOk('at night', MAN, 'PP');
chainOk('can run', MAN, 'VP'); chainNg('can ran', MAN, 'modalBase'); chainOk('be running', MAN, 'VP'); chainNg('be run', MAN, 'beForm');
chainNg('running', MAN, 'needBe'); chainOk('ran', MAN, 'VP', 'ran'); chainNg('be slept', MAN); chainOk('be eaten', MAN, 'VP');
chainNg('ideal -er', AUTO, 'noCmp');

// ===== 文(自動) =====
ok('I | run', AUTO, 'I run.');
ok('he | run', AUTO, 'He runs.');
ok('the dog | run', AUTO, 'The dog runs.');
ok('dog | run | in the park', AUTO, 'The dog runs in the park.');
ok('dog | run | yesterday', AUTO, 'The dog ran yesterday.');
ok('yesterday | dog | run', AUTO, 'Yesterday, the dog ran.');
ok('dog | run | tomorrow', AUTO, 'The dog will run tomorrow.');
ok('she | eat | apple', AUTO, 'She eats an apple.');
ok('she | eat | apple | at the park', AUTO);
ok('I | eat | it', AUTO, 'I eat it.');
ok('he | see | I', AUTO, 'He sees me.');
ok('they | like | she', AUTO, 'They like her.');
ok('I | be | happy', AUTO, 'I am happy.');
ok('he | be | happy', AUTO, 'He is happy.');
ok('we | be | happy', AUTO, 'We are happy.');
ok('he | be | happy | yesterday', AUTO, 'He was happy yesterday.');
ok('they | be | happy | yesterday', AUTO, 'They were happy yesterday.');
ok('I | be | teacher', AUTO, 'I am the teacher.');
ok('she | be | in the park', AUTO, 'She is in the park.');
ok('she | be | here', AUTO, 'She is here.');
ok('he | be run', AUTO, 'He is running.');
ok('he | not run', AUTO, "He doesn't run.");
ok('I | not run | yesterday', AUTO, "I didn't run yesterday.");
ok('he | can run', AUTO, 'He can run.');
ok('he | can run | yesterday', AUTO, 'He could run yesterday.');
ok('he | can not run', AUTO, "He can't run.");
ok('he | always run', AUTO, 'He always runs.');
ok('he | be always | happy', AUTO, 'He is always happy.');
ok('I | want | to swim', AUTO, 'I want to swim.');
ok('I | want | swim to/ing', AUTO, 'I want to swim.');
ok('I | enjoy | to swim', AUTO, 'I enjoy swimming.');
ok('I | like | swim to/ing', AUTO, 'I like swimming.');
ok('I | want | to eat | apple', AUTO, 'I want to eat an apple.');
ok('I | go | to:p the park | to play:v', AUTO, 'I go to the park to play.');
ok('he | give | I | book', AUTO, 'He gives me a book.');
ok('she | look | happy', AUTO, 'She looks happy.');
ok('he | become | teacher', AUTO, 'He becomes the teacher.');
ok('two dog | run', AUTO, 'Two dogs run.');
ok('dogs | run', AUTO, 'Dogs run.');
ok('my dog | run | quickly', AUTO, 'My dog runs quickly.');
ok('I | listen_to | music', AUTO, 'I listen to music.');
ok('I | pick_up | book', AUTO, 'I pick up a book.');
ok('In_my_opinion | the dog | be | happy', AUTO, 'In my opinion, the dog is happy.');
ok('Guess_what? | I | run', AUTO, 'Guess what? I run.');
ok('when | I | be | young | I | run', AUTO, 'When I am young, I run.');
ok('when | I | run | yesterday | he | sleep', AUTO, 'When I ran yesterday, he sleeps.');
ok('I | run | and | he | sleep', AUTO, 'I run and he sleeps.');
ok('I | run | but | he | sleep', AUTO, 'I run, but he sleeps.');
ok('I | run | in the park | in the morning', AUTO, 'I run in the park in the morning.');
ok('in the morning | I | run | in the park', AUTO, 'In the morning, I run in the park.');
ok('I | run | every_day', AUTO, 'I run every day.');
ok('I | run | last_week', AUTO, 'I ran last week.');
ok('I | run | with my friend', AUTO, 'I run with my friend.');
ok('I | eat:v | cake:n | at_home:i', AUTO, 'I eat a cake at home.');
ok('the big -est dog | run', AUTO, 'The biggest dog runs.');
ok('he | be | big -est', AUTO, 'He is the biggest.');
ok('he | be | big -er', AUTO, 'He is bigger.');
ok('someone | run', AUTO, 'Someone runs.');
ok('it | be | very big', AUTO, 'It is very big.');
ok('he she | run', AUTO, 'They run.');
ok('the cat | sleep | on Sunday', AUTO, 'The cat sleeps on Sunday.');
ok('I | study | English | at night', AUTO, 'I study English at night.');
ok('my mom | cook:v | dinner:n', AUTO, 'My mom cooks dinner.');
ok('the children | play:v | outside', AUTO, 'The children play outside.');
ok('I | will run', AUTO, 'I will run.');
ok('the dog | be eat | apple', AUTO, 'The dog is eating an apple.');
ok('he | be eat | apple | now', AUTO, 'He is eating an apple now.');
ok('we | go | to:p the zoo | on Saturday', AUTO, 'We go to the zoo on Saturday.');
ok('Wow | I | win:v', AUTO);
// ----- 助動詞の仲間・時制パーツ・短縮形 -----
ok('he | want_to swim', AUTO, 'He wants to swim.');
ok('I | want_to eat:v | apple', AUTO, 'I want to eat an apple.');
ok('she | have_to study | English', AUTO, 'She has to study English.');
ok('he | have_to go | yesterday', AUTO, 'He had to go yesterday.');
ok('they | be_going_to play:v | tomorrow', AUTO, 'They are going to play tomorrow.');
ok('he | be_going_to sleep', AUTO, 'He is going to sleep.');
ok('I | used_to swim', AUTO, 'I used to swim.');
ok('I | would_like_to eat:v | cake:n', AUTO, 'I would like to eat a cake.');
ok('he | not want_to sleep', AUTO, "He doesn't want to sleep.");
ok('she | not be_going_to swim', AUTO, "She isn't going to swim.");
ok('I | want_to be | happy', AUTO, 'I want to be happy.');
ok('he | run 過去', AUTO, 'He ran.');
ok('he | 過去 run', AUTO, 'He ran.');
ok('he | run 未来', AUTO, 'He will run.');
ok('he | run 進行', AUTO, 'He is running.');
ok('she | not run 過去', AUTO, "She didn't run.");
ok('they | not run 進行', AUTO, "They aren't running.");
ok('he | run 過去 | yesterday', AUTO, 'He ran yesterday.');
ok('we | not be | happy', AUTO, "We aren't happy.");
ok('he | will not run', AUTO, "He won't run.");
ng('he | run 過去 | tomorrow', AUTO, 'tense');
ng('he | run 未来 | yesterday', AUTO, 'tense');
ng('I | used_to swim | tomorrow', AUTO, 'tense');
chainNg('can run 過去', AUTO); chainNg('be run 過去', AUTO); chainNg('過去 過去 run', AUTO); chainNg('run quickly 過去', AUTO);
pre('過去', true); pre('want_to', true);
ok('I | want_to swim', MAN, 'I want to swim.');
ng('I | want_to swam', MAN, 'modalBase');
// ===== 文(手動) =====
ok('I | ran | yesterday', MAN, 'I ran yesterday.');
ok('he | run | every_day', MAN, 'He runs every day.');
ok('he | was | happy | yesterday', MAN, 'He was happy yesterday.');
ok('he | will run | tomorrow', MAN, 'He will run tomorrow.');
ok('I | enjoy | -ing swim', MAN, 'I enjoy swimming.');
ok('I | want | to swim', MAN, 'I want to swim.');
ok('the dog | be eaten', MAN, 'The dog is eaten.');
ok('a dog | was running | in the park', MAN, 'A dog was running in the park.');
ok('I | could run | yesterday', MAN);
ok('in the morning | I | run', MAN);
ok('the big -est dog | ran', MAN);
ok('I | go | to:p the park | to play:v', MAN);

// ===== 文の失敗 =====
ng('I | run | yesterday', MAN, 'tense');
ng('I | ran | tomorrow', MAN, 'tense');
ng('he | was | happy | tomorrow', MAN, 'tense');
ng('I | enjoy | to swim', MAN, 'cv');
ng('I | want | -ing swim', MAN, 'cv');
ng('I | go | to:p the park | -ing play:v', MAN, 'purposeTo');
ng('I | sleep | the dog', AUTO, 'intrObj');
ok('I | eat:v', AUTO, 'I eat.');
ng('I | like', AUTO, 'needObj');
ng('run | the dog', AUTO, null);
ng('run', AUTO, 'needSubj');
ng('I | the dog', AUTO, 'needVerb');
ng('the dog | big', AUTO, 'needVerb');
ng('I | be', AUTO, 'needComp');
ng('I | run | yesterday | last_week', AUTO, 'dupTime');
ng('yesterday | I | run | last_week', AUTO, 'dupTime');
ng('I | run | in the park | at the zoo', AUTO, 'dupPlace');
ng('I | run | here | in the park', AUTO, 'dupPlace');
ng('run | I', AUTO);
ng('the dog | the cat | run', AUTO, 'order');
ng('in the park | run', AUTO);
ng('I | run | In_my_opinion', AUTO, 'order');
ng('I | run | when', AUTO, 'order');
ng('and | I | run', AUTO, 'order');
ng('quickly | I | run', AUTO, 'order');
ng('I | happy', AUTO, 'needVerb');
ng('I | run | happy', AUTO, 'order');
ng('he | give | I | book | apple', AUTO, 'order');
ng('dog | run', MAN, 'needDet');
ng('a water | be | cold', MAN, 'aBad');
ng('I | sing:v | at Monday', MAN, 'prepTime');
ng('I | can ran', MAN, 'modalBase');
ng('I | running', MAN, 'needBe');
ng('I | run | the cat', AUTO, 'intrObj');
ng('he | be | happy | the dog', AUTO, 'order');
ng('I | want | to sleep | the cat', AUTO, 'order');
ng('when | I | run | yesterday | he | sleep | last_week', AUTO, 'dupTime');
ng('I | run | yesterday | tomorrow', AUTO, 'dupTime');
ng('I | be | in the park | at the zoo', AUTO, 'dupPlace');
ng('Ken | swim | the water', AUTO, 'intrObj');
ng('I | ran | yesterday | and | he | sleep | last_week', MAN, 'tense');
ng('the dog | run | to', AUTO);

// 節チャンク
{ const T = ['when', 'I', 'run'].map(s => chunk(s, AUTO)); const r = G.parse(T, AUTO); if (r.ok && r.kind === 'CL' && r.text === 'when I run') pass++; else { fail++; fails.push('CL: ' + JSON.stringify(r)); }
  const cl = G.makeClause(T, r); const r2 = G.parse([cl, chunk('he', AUTO), chunk('sleep', AUTO)], AUTO); if (r2.ok && r2.text === 'When I run, he sleeps.') pass++; else { fail++; fails.push('CL front: ' + JSON.stringify(r2)); } }
// 差し込み
{ const c = chunk('the dog', AUTO); const n = G.tryInsert(c, tok('big'), AUTO); if (n && G.chunkText(n, AUTO) === 'the big dog') pass++; else { fail++; fails.push('insert adj'); }
  const n2 = G.tryInsert(n, tok('very'), AUTO); if (n2 && G.chunkText(n2, AUTO) === 'the very big dog') pass++; else { fail++; fails.push('insert deg ' + (n2 && G.chunkText(n2, AUTO))); }
  const v = chunk('run', AUTO); const v2 = G.tryInsert(v, tok('quickly'), AUTO); if (v2 && G.chunkText(v2, AUTO) === 'run quickly') pass++; else { fail++; fails.push('insert adv'); }
  const v3 = G.tryInsert(v2, tok('always'), AUTO); if (v3 && G.chunkText(v3, AUTO) === 'always run quickly') pass++; else { fail++; fails.push('insert freq ' + (v3 && G.chunkText(v3, AUTO))); }
  const v4 = G.tryInsert(v, tok('yesterday'), AUTO); if (!v4) pass++; else { fail++; fails.push('insert time adv should fail'); }
  const p = chunk('in the park', AUTO); const p2 = G.tryInsert(p, tok('big'), AUTO); if (p2 && G.chunkText(p2, AUTO) === 'in the big park') pass++; else { fail++; fails.push('insert into PP'); } }
// 種類が変わる差し込み・一筆書きのまとめ
{ const np = chunk('the zoo', MAN); const pp = G.tryInsert(np, tok('at'), MAN); if (pp && pp.t === 'PP' && G.chunkText(pp, MAN) === 'at the zoo') pass++; else { fail++; fails.push('NP+prep→PP ' + (pp && G.chunkText(pp, MAN))); }
  const ap = chunk('big', AUTO); const np2 = G.tryInsert(ap, tok('dog'), AUTO); if (np2 && np2.t === 'NP') pass++; else { fail++; fails.push('AP+noun→NP'); }
  const U2 = [{ chunk: chunk('I', AUTO) }, { chunk: chunk('run', AUTO) }, { words: [tok('at')] }, { chunk: chunk('the zoo', AUTO) }].map(u => u.chunk ? { chunk: u.chunk, words: u.chunk.words } : u);
  const T2 = G.strokeTokens(U2, AUTO); const r2 = T2 && G.parse(T2, AUTO); if (r2 && r2.ok && r2.text === 'I run at the zoo.') pass++; else { fail++; fails.push('stroke merge ' + JSON.stringify(r2)); }
  const U3 = [{ words: [tok('at')] }, { words: [tok('the')] }, { words: [tok('zoo')] }]; const T3 = G.strokeTokens(U3, AUTO); if (T3 && T3.length === 1 && T3[0].t === 'PP') pass++; else { fail++; fails.push('stroke merge words'); }
  if (!G.strokeTokens([{ words: [tok('at')] }], AUTO)) pass++; else { fail++; fails.push('dangling prep'); } }
// 一筆書きの途中
{ const T = ['I', 'run'].map(s => chunk(s, AUTO)); if (G.viable(T) && G.viable(T.slice(0, 1)) && !G.viable([chunk('run', AUTO), chunk('run', AUTO), chunk('run', AUTO)])) pass++; else { fail++; fails.push('viable'); } }

// 自動生成の負例:主語と動詞を入れ替えた文は通らない
let genNeg = 0;
OKS.forEach(([spec, cfg]) => {
  const parts = spec.split('|').map(x => x.trim()); if (parts.length < 2) return;
  let T; try { T = parts.map(p => chunk(p, cfg)); } catch (e) { return; }
  const si = T.findIndex(t => t.t === 'NP'); if (si < 0 || !T[si + 1] || T[si + 1].t !== 'VP' || T[0].t === 'CONJ') return;
  const S = T.slice(); S[si] = T[si + 1]; S[si + 1] = T[si];
  const r = G.parse(S, cfg); genNeg++; if (!r.ok) pass++; else { fail++; fails.push('swap should fail: ' + spec + ' → ' + r.text); }
});
// ファズ:ランダムなチャンク列で例外が出ない
const R = (() => { let a = 7; return () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; }; })();
const pool = []; ['the dog', 'I', 'run', 'eat:v', 'in the park', 'yesterday', 'happy', 'to swim', 'when', 'and', 'In_my_opinion', 'very big cat', 'can run', 'be', 'apple', 'every_day', 'she he', 'with him', 'tomorrow', 'not run'].forEach(sp => { try { pool.push(chunk(sp, AUTO)); } catch (e) { } });
let fuzzOk = 0, fuzzErr = 0;
for (let i = 0; i < 3000; i++) { const n = 1 + Math.floor(R() * 7), T = []; for (let j = 0; j < n; j++) T.push(pool[Math.floor(R() * pool.length)]); try { const r = G.parse(T, i % 2 ? AUTO : MAN); G.viable(T); if (r.ok) fuzzOk++; } catch (e) { fuzzErr++; if (fuzzErr < 3) fails.push('fuzz exception: ' + e.message); } }
if (fuzzErr) fail++; else pass++;
console.log('generated negatives: ' + genNeg + ', fuzz valid sentences: ' + fuzzOk + '/3000, exceptions: ' + fuzzErr);
console.log('grammar tests: pass ' + pass + ' / fail ' + fail);
fails.forEach(f => console.log('  ✗ ' + f));
process.exitCode = fail ? 1 : 0;
