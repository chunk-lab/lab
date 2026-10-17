import { applyEmojiFix } from './emoji_fix.js';
import { CONJ_SUF, IDV, MLEX, MPAT, SPREP } from './idioms.js';
import { locAlive, locRegister } from './loc.js';
import { pairJa } from './objrank.js';
import { ofRegister } from './of.js';
import { LV } from './play.js';
import { UPVS } from './pv_user.js';
import { isVc, vcJa, vcOf } from './vcomp.js';
import { VX } from './vocab.js';
import { FREQADV, LINKV } from './vocab_a1.js';
// ================= LEXICON =================
export let OFFICIAL;

export let FRONTS;
export let LEADF;
export let FRT, FRP;
export let MODALS;
export let CONJS;
export let TENSES;
export let TENSE_ORDER;
export let PROGS;
export let TENSE_UI; // バーに並べる順（過去完了→…→未来進行）
export let TLVL; // レベルごとに出す時制（∞は全部）


// ================= PHRASAL VERBS / IDIOMS =================
export let PVBASE;
export let PARTICLE;
export function PV(base, part, o){ const b=PVBASE[base]||{}; const v=Object.assign({id:(base+'_'+part).replace(/[^a-z_]/g,''),en:base,past:b.past,pp:b.pp,s3:b.s3,dbl:b.dbl,pv:{base,p:o.p||part.split(' ')[0]},an:'bob',fq:2},o); if(o.prep===undefined && !o.idiom) v.tail=part; if(o.idiom && !o.prep) v.tail=part; if(o.prep===true) { v.prep=part; delete v.tail; } return v; }
export let PVS;
// verbs that make someone do something (make / let / have / help + do, want / ask / tell + to do)
export let CAUSV;
export function causForm(dict,jt){ const J=jconj(dict,jt); if(jt==='i') return dict.replace(/る$/,'')+'させる'; if(jt==='s') return dict.replace(/する$/,'')+'させる'; if(jt==='k') return dict.replace(/来る$|くる$/,'')+'来させる'; return J.na+'せる'; }
// plain verbs that the phrasal verbs can be swapped with
export let SYNV;

// ================= LEXICON ACCESS =================
export let LEX; // merged
export function buildLex(extraSets){
 const L = {}; for(const k in OFFICIAL) L[k]=OFFICIAL[k].slice();
 L.verbs=L.verbs.concat(SYNV.filter(v=>!L.verbs.find(x=>x.id===v.id)), PVS.filter(v=>!L.verbs.find(x=>x.id===v.id)), CAUSV.filter(v=>!L.verbs.find(x=>x.id===v.id)));
 if(typeof UPVS!=='undefined'){ const seen=new Set(L.verbs.map(v=>(v.en+' '+(v.tail||'')+' '+(v.prep||'')).trim().replace(/\s+/g,' '))); UPVS.forEach(v=>{ const k=(v.en+' '+(v.tail||'')+' '+(v.prep||'')).trim().replace(/\s+/g,' '); if(!seen.has(k)){ L.verbs.push(v); seen.add(k); } }); }
 if(typeof IDV!=='undefined'){ IDV.forEach(v=>{ if(!L.verbs.find(x=>x.id===v.id)) L.verbs.push(v); }); }
 if(typeof VX!=='undefined'){ for(const k in VX.lex){ if(!L[k]) continue; const seen=new Set(L[k].map(x=>(x.en+(x.tail?' '+x.tail:'')).toLowerCase())); VX.lex[k].forEach(x=>{ const key=(x.en+(x.tail?' '+x.tail:'')).toLowerCase(); if(!seen.has(key) && !L[k].find(y=>y.id===x.id)){ L[k].push(x); seen.add(key); } }); } }
 for(let i=FRONTS.length-1;i>=0;i--) if(FRONTS[i].custom) FRONTS.splice(i,1);
 (extraSets||[]).forEach(s=>{ (s.items||[]).forEach(it=>{ const k=it.kind; if(k==='leads'){ if(!FRONTS.find(x=>x.id===it.id)) FRONTS.push(Object.assign({g:'link',custom:s.id},it)); return; } if(L[k] && !L[k].find(x=>x.id===it.id)) L[k].push(Object.assign({custom:s.id},it)); }); });
 if(typeof LINKV!=='undefined') Object.entries(LINKV).forEach(([k,x])=>{ if(!L.verbs.find(v=>v.id==='__link_'+k)) L.verbs.push({id:'__link_'+k,en:x.en,past:x.past,pp:x.pp,ja:x.ja,jt:x.jt,fr:'intr',hidden:1}); });
 L.idx={}; ['people','things','verbs','states','manners','places','times'].forEach(k=>L[k].forEach(x=>L.idx[k+':'+x.id]=x));
 if(typeof locRegister==='function') locRegister(L);
 if(typeof ofRegister==='function') ofRegister(L);
 if(typeof applyEmojiFix==='function') applyEmojiFix(L); LEX=L; return L;
}
export let P, T, V, ST, MN, PL, TM;
export let MD, CJ;
// noun ref: 'p:ken' or 't:apple'
export function N(ref){ if(!ref) return null; const [k,id]=ref.split(':'); return k==='p'?P(id):T(id); }
export function nounSubj(ref){ const n=N(ref); return n? n.en : ''; }
export function nounObj(ref){ const n=N(ref); return n? (n.obj||n.en):''; }
export function agrOf(ref){ const n=N(ref); if(!n) return {p:3,pl:0}; return {p:n.p||3, pl:n.pl?1:0}; }
export function isPerson(ref){ const n=N(ref); return n && ref[0]==='p' && !n.animal && !n.thing; }
export let PRED_PERSON;
export function predHead(c){ try{ const s=predS(c); if(!s||!s.noun) return null; const w=String(s.en).replace(/^(a|an|the|my|your|his|her|our|their|this|that|these|those) /i,'').split(' ').pop(); const pp=P(w); const per=!!(pp&&!pp.animal&&!pp.thing)||PRED_PERSON.test(w)||/^r_/.test(String(s.id)); const id='pr_'+String(s.id).replace(/\W+/g,'_'); const o={id,en:s.en,ja:s.ja,p:3,pl:s.pl&&/s$/.test(String(s.en))&&!/^(a|an) /i.test(s.en)?1:0,hidden:1,pred:1}; if(!per) o.thing=1; LEX.idx[(per?'people:':'things:')+id]=o; return (per?'p:':'t:')+id; }catch(e){ return null; } }
export let ALLTAGS;
export function nounTags(ref){ const n=N(ref); if(!n) return []; if(n.typed) return ALLTAGS; if(ref[0]==='p') return n.animal?['animal','any']:(n.thing?['thing','any']:['person','any']); return (n.t||['thing']).concat(['any']); }

// ================= ENGLISH MORPHOLOGY =================
export let VOW;
export function s3(v){ if(v.s3) return v.s3; const b=v.en; if(/(s|sh|ch|x|z|o)$/.test(b)) return b+'es'; if(/[^aeiou]y$/.test(b)) return b.slice(0,-1)+'ies'; return b+'s'; }
// 1音節で「子音＋母音1つ＋子音」の語は語尾を重ねる（get→getting, stop→stopped）。dbl:0 と明示した語は重ねない
export function dblOf(v){ return v.dbl!=null ? !!v.dbl : /^[^aeiou]*[aeiou][bdgklmnprt]$/.test(String(v.en||'')); }
export function past(v){ if(v.past) return v.past; const b=v.en; if(/e$/.test(b)) return b+'d'; if(/[^aeiou]y$/.test(b)) return b.slice(0,-1)+'ied'; if(dblOf(v)) return b+b.slice(-1)+'ed'; return b+'ed'; }
export function pp(v){ return v.pp || past(v); }
export function ing(v){ if(v.ing) return v.ing; const b=v.en; if(/ie$/.test(b)) return b.slice(0,-2)+'ying'; if(/[^e]e$/.test(b) && b!=='be') return b.slice(0,-1)+'ing'; if(dblOf(v)) return b+b.slice(-1)+'ing'; return b+'ing'; }
export let BE, HAVE, DO;
export function vform(lem, form, agr){
 const sg3 = agr.p===3 && !agr.pl;
 if(lem==='be'){
  if(form==='pres') return agr.p===1&&!agr.pl?'am':(sg3?'is':'are');
  if(form==='past') return (agr.p===1&&!agr.pl)||sg3?'was':'were';
  return BE[form]||'be';
 }
 const v = typeof lem==='string' ? ({have:HAVE,do:DO,want:{en:'want'}})[lem] : lem;
 if(form==='pres') return sg3? s3(v): v.en;
 if(form==='past') return past(v);
 if(form==='pp') return pp(v);
 if(form==='ing') return ing(v);
 return v.en;
}
export let NEG;
export function cap(s){ return s? s.charAt(0).toUpperCase()+s.slice(1):s; }

// ================= CLAUSE MODEL =================
export function newClause(type){ return {type:type||'normal', sobj:null, link:null, freq:null, sepEnd:false, lead:null, mdeg:null, mthan:null, scope:null, iobj:null, dts:'oo', poss:null, subj:null, modal:null, pred:null, useObj:false, obj:null, degree:null, than:null, manner:null, with:null, place:null, time:null, tense:'pres', neg:false, q:null, passive:false, front:null, imp:'do', thing:null, subs:{}}; }
export function predV(c){ return c.pred && c.pred.k==='v' ? V(c.pred.id) : null; }
export let INTENS;
export function attrJa(a){ return a.jt==='na'? a.ja+'な' : adjJa(a,'plain'); }
export function withAdjEn(np, adj){ const m=np.match(/^(a|an)\s+(.*)$/i); if(m) return (/^[aeiou]/i.test(adj)?'an ':'a ')+adj+' '+m[2]; const d=np.match(/^(the|some|my|your|his|her|our|their|its)\s+(.*)$/i); if(d) return d[1]+' '+adj+' '+d[2]; return adj+' '+np; }
export function predS(c){ const s = c.pred && c.pred.k==='s' ? ST(c.pred.id) : null; if(!s) return s;
 if(s.loc){ const al=typeof locAlive==='function'&&locAlive(c); return Object.assign({},s,{ja:s.jn+'に'+(al?'いる':'ある'),al}); }
 if(s.noun && c.adj && ST(c.adj)){ const a=ST(c.adj); return Object.assign({},s,{en:withAdjEn(s.en,a.en), pl:s.pl? a.en+' '+s.pl : s.pl, ja:attrJa(a)+s.ja}); }
 if(!s.noun && c.intens && !c.degree && INTENS[c.intens]){ const w=INTENS[c.intens]; return Object.assign({},s,{en:w[0]+' '+s.en, ja:w[1]+s.ja}); }
 return s; }

// allowed tenses
export function allowedTenses(c, ctx){
 let all = TENSE_ORDER.slice();
 const v=predV(c), s=predS(c);
 if(c.type==='exist') all=['pres','past','perf','fut','pastperf'];
 if(s || (c.pred&&c.pred.k==='s') || (v && v.stative) || c.type==='exist') all = all.filter(t=>!PROGS.includes(t));
 const m=c.modal;
 const M={can:['pres','past','fut'],want:['pres','past'],will:['fut','past'],prob:['fut'],might:['pres','prog','past'],may:['pres','prog','past'],must:['pres','prog','past'],haveto:['pres','past','fut'],should:['pres','past'],could:['pres','prog','past']};
 if(m && M[m]) all = all.filter(t=>M[m].includes(t));
 if(m==='can' && s && !v && !s.loc) all = all.filter(t=>t!=='fut'); // 状態の未来＋can（will be able to be tired）は英文として不自然なので出さない
 if(m && typeof MPAT!=='undefined' && MPAT[m]) all = all.filter(t=>MPAT[m].t.includes(t));
 if(c.time && !c.qten){ const t=TM(c.time); if(t){ const f=all.filter(x=>t.ts.includes(x)); if(f.length) all=f; } }
 if(ctx && (ctx.kind==='purpose'||ctx.kind==='part'||(ctx.kind==='comp'&&c.vform))) all=['pres'];
 if(c.lead){ const L=LEADF(c.lead); if(L&&L.ts){ const f=all.filter(x=>L.ts.includes(x)); if(f.length) all=f; } }
 return all;
}
export function fixTense(c, ctx){ const a=allowedTenses(c,ctx); if(!a.includes(c.tense)) c.tense = a.includes('pres')?'pres':a[0]; }
export let REALMOD;
export function setModal(c,m){ const S=['want','haveto'];
 if(REALMOD.includes(m)){ if(S.includes(c.modal)) c.semi=c.modal; c.modal=m; return; }
 if(S.includes(m) && REALMOD.includes(c.modal)){ c.semi=m; return; }
 if(!m && c.semi){ c.modal=c.semi; c.semi=null; return; }
 c.modal=m; c.semi=null; }
export function allowedModals(c){
 const s=predS(c), v=predV(c);
 return MODALS.filter(m=>{
  if(c.q && m.id==='prob') return false;
  if(v && v.stative && ['want','haveto'].includes(m.id) && ['like','love','know','see','hope'].includes(v.id)) return false;
  return true;
 });
}
export function needsObj(c){ const v=predV(c); if(v && c.type==='imp' && c.imp==='letme' && !c.useObj && ['see','know','think'].includes(v.id)) return false; return !!(v && (v.fr==='tr' || v.fr==='cl' || (v.fr==='both' && c.useObj) || (c.useObj && typeof vcOf==='function' && vcOf(v)))); }

// ================= VERB GROUP =================
// returns tokens [{t,k}] k: 'mod','aux','main','lit','neg'
export function verbGroup(c, agr, o){
 o=o||{};
 const v=predV(c), s=predS(c);
 const EPI_PAST = !o.base && c.tense==='past' && ['may','might','must','will','should','could'].includes(c.modal);
 const tn = EPI_PAST? 'perf' : c.tense;
 const perf = ['perf','perfprog','pastperf','pastperfprog','futperf','futperfprog'].includes(tn), prog=['prog','pastprog','perfprog','futprog','pastperfprog','futperfprog'].includes(tn), pst=['past','pastprog','pastperf','pastperfprog'].includes(tn), fut=['fut','futprog','futperf','futperfprog'].includes(tn);
 const L=[];
 const mod=w=>L.push({lem:w,type:'mod'}), aux=(w,r)=>L.push({lem:w,type:'aux',role:r}), lit=w=>L.push({lem:w,type:'lit'});
 if(o.base){ /* purpose/imperative: no tense/modal */ }
 else {
  const m=c.modal;
  if(m && typeof MPAT!=='undefined' && MPAT[m] && !(c.semi&&REALMOD.includes(m))){ MPAT[m].parts.forEach(pt=>{ if(pt.mod) L.push({lem:(pst&&pt.past)?pt.past:pt.mod,type:'mod'}); else if(pt.aux) L.push({lem:pt.aux,type:'aux',role:pt.role||'mbe'}); else if(pt.lex) L.push({lem:(typeof MLEX!=='undefined'&&MLEX[pt.lex])||{en:pt.lex},type:'lex',role:'mlex',ing:pt.ing}); else if(pt.lit) L.push({lem:pt.lit,type:'lit',canNeg:pt.canNeg,base:!pt.ing,ing:pt.ing}); }); }
  else if(c.semi && REALMOD.includes(m)){ mod(m==='will'&&EPI_PAST?'would':m); L.push({lem:c.semi==='want'?'want':'have',type:'lex',role:c.semi}); lit('to'); }
  else if(m==='can'){ if(fut){mod('will');aux('be','able');lit('able to');} else mod(pst?'could':'can'); }
  else if(m==='want'){ L.push({lem:'want',type:'lex',role:'want'}); lit('to'); }
  else if(m==='haveto'){ if(fut) mod('will'); L.push({lem:'have',type:'lex',role:'haveto'}); lit('to'); }
  else if(m==='would'||m==='could'){ mod(m); }
  else if(m==='will'||m==='prob'){ mod(EPI_PAST&&m==='will'?'would':'will'); if(m==='prob') lit('probably'); }
  else if(m==='might'||m==='should'||m==='may'||m==='must'){ mod(m); }
  else if(fut) mod('will');
  if(perf) aux('have','perf');
  if(prog) aux('be','prog');
 }
 if(c.passive && v) aux('be','pass');
 if((s || (c.pred&&c.pred.k==='s')) && c.link && typeof LINKV!=='undefined' && LINKV[c.link]) L.push({lem:LINKV[c.link],type:'main',role:'link'});
 else if(s || (c.pred&&c.pred.k==='s') || (!v && c.type==='exist') || o.wantBe) L.push({lem:'be',type:'main',role:'mainbe'});
 else if(v) L.push({lem:o.doVerb?'do':v,type:'main',role:'main'});
 else L.push({lem:null,type:'main',role:'hole'});
 const isPast = !o.base && pst && !(c.modal==='can') ;
 let need = o.base ? 'base' : 'finite';
 L.forEach(el=>{
  if(el.type==='mod'){ el.t=el.lem; need='base'; return; }
  if(el.type==='lit'){ el.t=el.lem; if(el.ing) need='ing'; else if(/to$/.test(el.lem)||el.base) need='base'; return; }
  if(el.lem===null){ el.t=''; return; }
  const f = need==='finite' ? (isPast?'past':'pres') : need;
  el.form=f; el.t=vform(el.lem, f, agr);
  need = el.ing?'ing': el.role==='perf'?'pp': el.role==='prog'?'ing': el.role==='pass'?'pp': 'base';
 });
 return L;
}
export function auxable(el){ return el.type==='mod' || el.lem==='be' || (el.lem==='have' && (el.role==='perf'||el.role==='mhave')) || (el.type==='lit' && el.canNeg); }

// ================= CLAUSE -> CHUNKS =================
// chunk: {key, en, ja, cat, pos, active, hole}
// pos: noun, verb, aux, adj, adv, conj, wh
export let WH_JA;
export function whWord(c, slot){
 if(slot==='subj') return (c.subj && !isPerson(c.subj) && c.subj[0]==='t')?'what':'who';
 if(slot==='obj') return (c.obj && isPerson(c.obj))?'who':'what';
 return {place:'where',time:'when',manner:'how',with:'who',action:'what',state:'how',why:'why'}[slot];
}
export function genClause(c, ctx){ let agr=null;
 // ctx: {kind:'main'|'conj'|'rel'|'purpose'|'comp', key, head, headAgr, conj}
 ctx = ctx||{kind:'main',key:'m'};
 const K=ctx.key, out=[], v=predV(c), s=predS(c);
 const push=(key,en,ja,cat,pos,extra)=>{ out.push(Object.assign({key:K+'.'+key,en,ja,cat,pos,clause:K},extra||{})); };
 const q = (ctx.kind==='main' && c.type!=='imp') ? c.q : (ctx.kind==='comp' && (!c.vform||c.whTo) ? c.q : null);
 const wh = q && q.wh;
 const doVerb = wh==='action';
 const base = ctx.kind==='purpose'||!!ctx.inf;
 // effective tense for time/if clauses
 const cc = Object.assign({},c);
 if(ctx.kind==='main' && typeof isVc==='function' && isVc(c)){ const x=vcOf(v); const TT=x&&x[c.subs.comp.c.vform]; if(TT&&TT.v) cc._vja=TT.v; }
 if(ctx.kind==='conj' && ctx.conj==='ifx'){ cc.tense='past'; cc.modal=null; }
 if(ctx.kind==='main' && c.subs && c.subs.conj && c.subs.conj.conj==='ifx'){ cc.tense='pres'; cc.modal = c.modal==='can'?'could':'would'; }
 if(ctx.kind==='conj' && ctx.conj && ['time','if'].includes(CJ(ctx.conj).kind)){
  if(cc.tense==='fut'){ cc.tense='pres'; cc._futNote=1; }
  if(cc.modal==='will'||cc.modal==='prob'){ cc.modal=null; cc._futNote=1; }
 }
 // ----- EXIST -----
 if(c.type==='exist'){
  const th=c.thing?N(c.thing):null; const agr={p:3,pl:th&&th.pl?1:0};
  const tn=c.tense; let be;
  if(tn==='fut') be=['will','be']; else if(tn==='perf') be=[agr.pl?'have':'has','been']; else be=[vform('be',tn==='past'?'past':'pres',agr)];
  if(c.neg){ be[0]=NEG[be[0]]||be[0]+' not'; }
  const beCh={en:be.join(' '),ja:'ある・いる',cat:'pred',pos:'verb'};
  if(q){ push('qaux',be[0],'？','q','aux'); push('there','there','','exist','noun'); if(be.length>1) push('verb',be.slice(1).join(' '),beCh.ja,'pred','verb'); }
  else { push('there','there','','exist','noun'); push('verb',beCh.en,beCh.ja,'pred','verb'); }
  if(th) push('thing',indef(th),th.ja+'が','thing','noun'); else push('thing','','何が？','thing','noun',{hole:1});
  relAfter('thing'); adv(); return finish(q?'?':'.');
 }
 // ----- How/What about -----
 if(c.type==='hab'){
  const th=c.thing?N(c.thing):null;
  push('excl',c.habw==='what'?'What about':'How about','〜はどう？','lead','adv');
  if(th) push('thing',nounObj(c.thing),th.ja,'thing','noun'); else push('thing','','何？','thing','noun',{hole:1});
  return finish('?');
 }
 // ----- EXCLAMATION -----
 if(c.type==='excl'){
  const th=c.thing?N(c.thing):null, aj=c.exadj?ST(c.exadj):null;
  const nEn=th?String(th.en).replace(/^(a|an|the) /i,''):'';
  const first=aj?aj.en:nEn; const art=(th&&th.pl)?'':(/^[aeiou]/i.test(first||'a')?'an':'a');
  push('excl','What'+(art?' '+art:''),'なんて','lead','adv');
  if(aj) push('exadj',aj.en,aj.jt==='na'?aj.ja+'な':adjJa(aj,'plain'),'state','adj');
  if(th) push('thing',nEn,th.ja,'thing','noun'); else push('thing','','何？','thing','noun',{hole:1});
  return finish('!');
 }
 // ----- IMPERATIVE -----
 if(c.type==='imp'){
  const L=verbGroup(c,{p:2,pl:0},{base:1});
  let lead=[];
  if(c.imp==='lets') lead.push("Let's"); 
  if(c.imp==='letme') lead.push('Let me');
  if(c.neg && c.imp!=='letme') lead.push(c.imp==='lets'?'not':"Don't");
  if(c.imp==='please') lead.unshift('Please');
  if(lead.length) push('aux',lead.join(' '),c.imp==='letme'?'〜させて':c.imp==='lets'?(c.neg?'しないでおこう':'しよう'):(c.neg?'しないで':'して'),'imp','aux');
  mainChunks(L,{p:2,pl:0}); objEtc(); adv(); return finish(c.imp==='letme'?'.':'!');
 }
 // ----- NORMAL / REL / PURPOSE / COMP / CONJ -----
 const subjRef = (ctx.kind==='rel' && ctx.gap!=='o') ? null : (c.passive? c.obj : c.subj);
 agr = (ctx.kind==='rel' && ctx.gap!=='o') ? ctx.headAgr : agrOf(subjRef);
 if(wh==='subj') agr={p:3,pl:0};
 if(ctx.kind==='conj' && ctx.conj==='ifx') agr={p:2,pl:0};
 const vcf = ctx.kind==='comp' && c.vform;
 const L = verbGroup((ctx.kind==='caus'&&cc.neg)?Object.assign({},cc,{neg:false}):cc, agr, {base: base||ctx.kind==='part'||ctx.kind==='caus'||!!vcf, doVerb});
 if(ctx.kind==='part' || vcf==='ing' || (ctx.kind==='caus' && ctx.ing)){ const mi=L.findIndex(x=>x.type==='main'); if(mi>=0 && L[mi].lem) { L[mi].t=vform(L[mi].lem,'ing',agr); } }
 // do-support
 let invert = q && wh!=='subj' && ctx.kind==='main';
 const needDo = ((c.neg&&ctx.kind!=='caus') || invert) && !auxable(L[0]) && !base;
 if(needDo){ const f=L[0].form||((['past','pastprog'].includes(cc.tense))?'past':'pres'); L.unshift({lem:'do',type:'aux',role:'do',form:f,t:vform('do',f,agr)}); if(L[1].lem){ L[1].t=vform(L[1].lem,'base',agr); L[1].form='base'; } }
 if(c.neg && !base && ctx.kind!=='caus'){
  if(cc.modal==='prob' && L[0].t==='will' && L[1] && L[1].t==='probably'){ L[0].t='probably'; L[1].t="won't"; }
  else L[0].t = NEG[L[0].t] || (L[0].t+' not');
 }
 if(base && c.neg && ctx.kind!=='caus'){ L.unshift({type:'lit',t:'not'}); }
 // front adverbials
 if(ctx.kind==='main' && c.lead){ const L=LEADF(c.lead); if(L){ const X=c.leadX?(' '+c.leadX):(L.need?' …':''); push('lead',L.en+X+(L.nc?'':','),(c.leadXja||'')+L.ja+(L.nc?'':'、'),'lead','adv',{front:1}); } }
 if(ctx.kind==='main' && c.cmpw && c.cmpwF && N(c.cmpw)) push('cmpw','compared with '+nounObj(c.cmpw)+',',N(c.cmpw).ja+'とくらべると、','cmpw','adv',{front:1});
 if(ctx.kind==='main' && c.front && !q){ frontAdv(); }
 // wh
 if(wh){ let wj=(wh==='place'&&v&&v.motion)?'どこへ？':WH_JA[wh]; if(ctx.kind==='comp') wj=wj.replace('？',''); if(wh==='subj'&&q.w==='what') wj='何が？'; if(q.wj) wj=ctx.kind==='comp'?q.wj.replace('？',''):q.wj; push('wh',(q.w||whWord(c,wh))+(q.el?' else':''),wj,'q','wh',{hole:0}); }
 // conj/rel/purpose/comp markers
 if(ctx.kind==='rel'&&ctx.inf){ push('rel','to','〜するための','rel','conj'); }
 if(ctx.kind==='rel'&&!ctx.inf&&ctx.pron!=='∅'){ const hp=ctx.head && (isPerson(ctx.head)); push('rel', ctx.pron || (hp?'who':'that'), 'その'+((ctx.head&&N(ctx.head))?N(ctx.head).ja:'')+(ctx.gap==='o'?'を':'が'),'rel','conj'); }
 if(ctx.kind==='relw'){ push('relw', ctx.word, ctx.word==='where'?'そこで':'その時','relw','conj'); }
 if(ctx.kind==='purpose'){ push('to','to','ために','purpose','conj'); }
 if(ctx.kind==='caus' && ctx.to){ if(c.neg) push('not','not','〜ない','caus','adv'); push('to','to','','caus','conj'); }
 if(ctx.kind==='comp'){ if(c.vform==='to') push('to','to','（これから）','comp','conj'); else if(!c.vform){ if(q){} else if(c.cif) push('if',c.cif===2?'whether':'if','かどうか','comp','conj'); else if(c.that) push('that','that','ということ','comp','conj'); } }
 // q aux (inversion)
 let restL=L;
 if(invert){ const a=L[0]; const mt=/^(\w+) not$/.exec(a.t||''); if(mt){ push('qaux',mt[1],auxJa(cc,true),'q','aux'); restL=[{t:'not',type:'aux',role:'neg'}].concat(L.slice(1)); } else { push('qaux',a.t,auxJa(cc,true),'q','aux'); restL=L.slice(1); } } // 短縮できない否定（am not / might not）は主語の後に not
 // subject
 if((ctx.kind!=='rel' || ctx.gap==='o') && !ctx.inf && ctx.kind!=='purpose' && ctx.kind!=='part' && ctx.kind!=='caus' && !(ctx.kind==='comp' && c.vform) && !c.share){
  if(wh==='subj'){ /* wh already */ }
  else if(subjRef){ const n=N(subjRef); const sa=(!c.passive&&c.sadj&&!n.pron)?ST(c.sadj):null; let sen=(ctx.kind==='main' && c.subs.rel && c.subs.rel.head==='subj' && !c.subs.rel.inf)? n.en : n.en; if(sa) sen=withAdjEn(sen,sa.en); if(c.spm) sen+=' '+c.spm.en; push('subj', sen, (c.spm?c.spm.ja:'')+(sa?attrJa(sa):'')+n.ja+(ctx.kind==='main'?'は':'が'), c.passive?'obj':'subj','noun',{subject:1}); relAfter(c.passive?'obj':'subj'); }
  else push('subj','',c.passive?'何が？':'誰が？',c.passive?'obj':'subj','noun',{hole:1,subject:1});
 }
 mainChunks(restL, agr);
 objEtc();
 adv();
 return finish(q?'?':'.');

 function sepMove(){ return !!(v && v.sep && v.tail && c.obj && needsObj(c) && !c.passive && (isPronRef(c.obj) || c.sepEnd)); }
 function tailText(v){ return String(v.tail).replace('{poss}', possOf(c.subj||ctx.head)); }
 function auxJa(c,qq){ const a=[]; const mj=c.modal&&modalChunkJa(c); if(c.modal) a.push(mj||MD(c.modal).ja); if(c.tense!=='pres'&&!s&&!mj) a.push(TENSES[c.tense].ja); if(c.passive) a.push('される'); if(c.neg&&!mj) a.push('ない'); if(qq) a.push('？'); return a.join('・')||'する'; }
 function mainChunks(Ls, agr){
  const mainIdx = Ls.findIndex(e=>e.type==='main');
  const pre = Ls.slice(0, mainIdx<0?Ls.length:mainIdx).map(e=>e.t).filter(Boolean);
  const m = mainIdx>=0? Ls[mainIdx]:null;
  if(pre.length) push('aux', pre.join(' '), auxJa(cc,false), c.modal?'modal':'tense','aux');
  const FA = c.freq && typeof FREQADV!=='undefined' ? FREQADV.find(f=>f.id===c.freq) : null;
  if(FA && !(m && m.role==='mainbe' && !pre.length)) push('freq', FA.en, FA.ja, 'freq', 'adv');
  if(c.only && m && m.role!=='mainbe') push('freq','only','だけ','freq','adv');
  if(c.quant && m && m.role!=='mainbe') push('freq',c.quant,c.quant==='both'?'ふたりとも':'みんな','freq','adv');
  if(m && m.role==='mainbe' && ctx.kind==='caus' && !ctx.to){ }
  else if(m && m.role!=='hole' && !(c.share && m.role==='mainbe' && !pre.length)){
   let t=m.t; if(v && v.tail && !doVerb && !sepMove()) t+=' '+tailText(v);
   push('verb', t, m.role==='mainbe'? beJa(cc) : m.role==='link'? '〜'+LINKV[c.link].lab : jaPred(cc, ctx, {chunk:1, doVerb}), 'pred', 'verb');
  if(FA && m && m.role==='mainbe' && !pre.length) push('freq', FA.en, FA.ja, 'freq', 'adv');
  } else if(!s) push('verb','', ctx.kind==='purpose'?'何をする？':({prog:'何してる？',past:'どうした？',pastprog:'何してた？',perf:'もう何した？',perfprog:'ずっと何してる？',pastperf:'その時もう何してた？',futprog:'その時何してる？',fut:'これから何する？'}[cc.tense]||'どうする？'),'pred','verb',{hole:1});
  if(c.passive && c.subj){ push('by','by '+nounObj(c.subj), N(c.subj).ja+'に','subj','noun'); }
 }
 function objEtc(){
  if(!s && c.pred && c.pred.k==='s' && ((c.intens && INTENS[c.intens]) || (c.adj && ST(c.adj)))){ if(c.adj && ST(c.adj)) push('state',withAdjEn('a …',ST(c.adj).en),attrJa(ST(c.adj))+'…','state','adj'); else push('state',INTENS[c.intens][0]+' …',INTENS[c.intens][1]+'…','state','adv'); }
  if(s){
   let t=(s.noun && agr && agr.pl && s.pl)? s.pl : s.en, j=s.ja;
   if(wh==='state'){ /* dropped */ }
   else {
    if(c.degree==='very'){ t='very '+t; }
    else if(c.degree==='more'){ t = s.more? 'more '+s.en : (s.comp||s.en+'er'); }
    else if(c.degree==='most'){ t = 'the '+(s.more?'most '+s.en:(s.sup||s.en+'est')); }
    else if(c.degree==='as'){ t = 'as '+s.en+' as'; }
    if(c.nonly) t='not only '+t; push('state', t, adjJa(s,'plain')+ (c.degree==='very'?'（とても）':c.degree==='more'?'（もっと）':c.degree==='most'?'（いちばん）':''), 'state','adj'); if(s.noun) relAfter('pred');
    if(c.sobj && typeof SPREP!=='undefined' && SPREP[s.id] && N(c.sobj)) push('sobj', SPREP[s.id].p+' '+nounObj(c.sobj), N(c.sobj).ja+SPREP[s.id].jp, 'sobj','noun');
    if(c.subs.comp && !c.sobj) out.push({key:K+'.sub:comp',sub:'comp',cat:'sub',pos:'conj'});
    if((c.degree==='more'||c.degree==='as') && c.than) push('than',(c.degree==='as'?'':'than ')+(c.tAux!=null?N(c.than).en+(c.tAux?' '+c.tAux:''):nounObj(c.than)), N(c.than).ja+(c.degree==='as'?'と同じくらい':'より'),'than','noun');
    if(c.degree==='most' && c.scope) push('scope',SCOPE[c.scope].en,SCOPE[c.scope].ja,'scope','adv');
   }
  } else if(c.pred && c.pred.k==='s' && wh!=='state' && wh!=='place') push('state',c.nonly?'not only':'','どんな？','state','adj',{hole:1});
  if(v && needsObj(c) && !c.passive && wh!=='action' && ctx.gap==='o'){ if(v.prep) push('prep',v.prep,'','pred','adv'); if(v.dt && c.iobj) push('iobj', (c.dts==='pp'?v.dt+' ':'')+nounObj(c.iobj), N(c.iobj).ja+(c.dts==='pp'&&v.dt==='for'?'のために':'に'),'iobj','noun'); }
  else if(v && needsObj(c) && !c.passive && wh!=='action'){
   if(v.fr==='cl' || (ctx.kind==='main' && isVc(c))){
    if(v.dt && v.fr==='cl' && c.iobj) push('iobj', nounObj(c.iobj), N(c.iobj).ja+'に','iobj','noun');
    const sub=c.subs.comp; if(sub){ if(v.prep&&(c.subs.comp.c.vform==='ing'||(v.whOnly&&c.subs.comp.c.q))) push('prep',v.prep,'','pred','adv'); out.push({key:K+'.sub:comp',sub:'comp',cat:'sub',pos:'conj'}); }
    else push('obj','',`（〜ということ）`,'obj','noun',{hole:1});
   } else if(wh==='obj'){ /* moved */ if(v.prep) {} }
   else if(c.obj || c.iobj || (c.oadj && ST(c.oadj))){
    const io = v.dt && c.iobj ? {en:nounObj(c.iobj), ja:N(c.iobj).ja} : null;
    if(io && c.dts!=='pp') push('iobj', io.en, io.ja+'に','iobj','noun');
    if(c.obj){ let np=objNP(c); if(ctx.kind==='main' && c.subs.rel && c.subs.rel.head==='obj' && !c.subs.rel.inf) np=np; push('obj',(v.prep?v.prep+' ':'')+np, objJa(c)+(v.cl||v.part||'を'),'obj','noun'); if(sepMove()) push('tail',v.tail,'','pred','verb'); relAfter('obj'); if(ctx.kind==='main' && v.caus && c.subs.caus) out.push({key:K+'.sub:caus',sub:'caus',cat:'sub',pos:'conj'}); }
    else if(c.oadj && ST(c.oadj)) push('obj',(v.prep?v.prep+' ':'')+withAdjEn('a …',ST(c.oadj).en), attrJa(ST(c.oadj))+'…'+(v.part||'を'),'obj','noun');
    else push('obj','',(v.prep?v.prep+' … ':'')+'何を？','obj','noun',{hole:1});
    if(io && c.dts==='pp') push('iobj', v.dt+' '+io.en, io.ja+(v.dt==='for'?'のために':'に'),'iobj','noun');
   }
   else push('obj','',(v.prep?v.prep+' … ':'')+(isPersonVerb(v)?'誰を？':'何を？'),'obj','noun',{hole:1});
  }
 }
 function adv(){
 const AM=()=>{
  if(c.manner && wh!=='manner'){ const m=MN(c.manner); let t=c.mtxt&&c.manner==='a_lot'?c.mtxt:m.en; const MC={fast:['faster','fastest'],hard:['harder','hardest'],well:['better','best'],a_lot:['more','most'],slowly:['more slowly','most slowly']}[m.id]; if(c.mdeg==='more') t=(c.mtxt&&c.manner==='a_lot')?c.mtxt:MC?MC[0]:'more '+m.en; else if(c.mdeg==='most') t='the '+(MC?MC[1]:'most '+m.en); else if(c.mdeg==='as') t='as '+(m.id==='a_lot'?'much':m.en)+' as'; push('manner',t,m.ja+(c.mdeg==='more'?'（もっと）':c.mdeg==='most'?'（いちばん）':''),'manner','adv');
   if((c.mdeg==='more'||c.mdeg==='as') && c.mthan){ if(/^x:/.test(c.mthan)) push('mthan',mthanSpecial(c),'できるだけ','mthan','adv'); else push('mthan',(c.mdeg==='as'?'':'than ')+(c.tAux!=null?N(c.mthan).en+(c.tAux?' '+c.tAux:''):nounObj(c.mthan)),N(c.mthan).ja+(c.mdeg==='as'?'と同じくらい':'より'),'mthan','noun'); }
   if(c.mdeg==='most' && c.scope) push('scope',SCOPE[c.scope].en,SCOPE[c.scope].ja,'scope','adv'); }
 };
 const AW=()=>{
  if(c.with && wh!=='with'){ push('with', withEn(c.with), withJa(c.with),'with','adv'); }
 };
 const AP=()=>{
  if(c.place && wh!=='place' && !(FRP(c) && ctx.kind==='main' && !q)){ const p=PL(c.place); const mo=v&&v.motion; const bare=!mo&&c.pbare&&p.to; push('place', (mo||bare)?p.to:p.en, c.type==='exist'?p.jn+'に':(mo?p.jat:(bare?p.jn+'に':p.ja)),'place','adv'); if(ctx.kind==='main' && c.subs.relw && c.subs.relw.slot==='place') out.push({key:K+'.sub:relw',sub:'relw',cat:'sub',pos:'conj'}); }
 };
 const AT=()=>{
  if(c.time && wh!=='time' && !(FRT(c) && ctx.kind==='main' && !q)){ const t=TM(c.time); push('time',t.en,t.ja,'time','adv'); if(ctx.kind==='main' && c.subs.relw && c.subs.relw.slot==='time') out.push({key:K+'.sub:relw',sub:'relw',cat:'sub',pos:'conj'}); }
 };
 { const F={manner:AM,with:AW,place:AP,time:AT}; const ord=(c.aord||[]).filter(k=>F[k]); ['manner','with','place','time'].forEach(k=>{ if(!ord.includes(k)) ord.push(k); }); ord.forEach(k=>F[k]()); }
  if(c.cmpw && !(c.cmpwF && ctx.kind==='main') && N(c.cmpw)) push('cmpw','compared with '+nounObj(c.cmpw),N(c.cmpw).ja+'とくらべると','cmpw','adv');
  // stranded preps
  if(wh==='obj' && v && v.prep) push('prep',v.prep,'','obj','adv');
  if(wh==='with') push('prep','with','','with','adv');
  if(c.subs && c.subs.purpose && ctx.kind==='main') out.push({key:K+'.sub:purpose',sub:'purpose',cat:'sub',pos:'conj'});
 }
 function frontAdv(){
  if(FRT(c) && c.time){ const t=TM(c.time); push('time',t.en+',',t.ja,'time','adv',{front:1}); }
  if(FRP(c) && c.place){ const p=PL(c.place); push('place',p.en+',',p.ja,'place','adv',{front:1}); }
 }
 function relAfter(role){ if(ctx.kind==='main' && c.subs.rel && c.subs.rel.head===role) out.push({key:K+'.sub:rel',sub:'rel',cat:'sub',pos:'conj'}); }
 function finish(p){
  if(ctx.kind==='main'){
   if(c.subs.conj){ const cj=CJ(c.subs.conj.conj); const node={key:'m.sub:conj',sub:'conj',cat:'sub',pos:'conj'}; if(c.subs.conj.front && !cj.back) out.unshift(node); else out.push(node); }
   if(c.subs.part){ out.unshift({key:'m.sub:part',sub:'part',cat:'sub',pos:'conj'}); }
   if(c.tagText){ push('tag',', '+c.tagText,'ね','tag','adv'); out.punct='?'; } else out.punct=p||'.';
  }
  if(cc._futNote) out.futNote=1;
  return out;
 }
}
export function indef(n){ if(n.ind) return n.ind; const e=n.en; if(/^the /.test(e)){ const r=e.slice(4); return n.pl?'some '+r:(/^[aeiou]/.test(r)?'an ':'a ')+r; } return e; }
export function beJa(c){ let b='状態'; if(c.neg) b+='じゃない'; return ({past:b+'（だった）',perf:'ずっと'+b,fut:'これから'+b})[c.tense]||b; }
export let POSS_EN, POSS_JA;
export function objNP(c){ const r=objNP0(c)+(c.nm?' '+c.nm:'')+(c.opm?' '+c.opm.en:''); const a=c.oadj&&ST(c.oadj); return (a && r && !isPronRef(c.obj) && !(N(c.obj)||{}).bpart)? withAdjEn(r,a.en) : r; }
export function objNP0(c){ const n=N(c.obj); if(!n) return ''; if(n.bpart){ return possOf(c.subj)+' '+n.en.replace(/^my /,''); } if(c.poss && c.obj[0]==='t' && !n.poss){ return POSS_EN[c.poss]+' '+n.en.replace(/^(a|an|the|some|my|your)\s+/i,''); } return n.obj||n.en; }
export function objJa(c){ const r=(c.opm?c.opm.ja:'')+objJa0(c)+(c.nm?'を'+c.nm:''); const a=c.oadj&&ST(c.oadj); return (a && r && !isPronRef(c.obj))? attrJa(a)+r : r; }
export function objJa0(c){ const n=N(c.obj); if(!n) return ''; { const pv0=predV(c); if(pv0&&pv0.id==='listen'&&(isPerson(c.obj)||(n.pron&&!n.thing&&n.id!=='it'))) return n.ja+'の話'; } const my=(!c.poss && !n.bpart && c.subj!=='p:i' && /^my /i.test(String(n.en||'')) && !/^(mom|dad|grandma)$/.test(n.id) && !/^(わたし|自分)/.test(n.ja))?'わたしの':''; const pj=(typeof pairJa==='function'&&predV(c))?pairJa(predV(c).id,c.obj):null; return (c.poss && c.obj[0]==='t' && !n.poss? POSS_JA[c.poss]:'')+my+(pj?pj.n:n.ja); }
export let SCOPE;
export function isNameRef(r){ if(!r) return false; const n=N(r); return !!(n && r[0]==='p' && /^[A-Z]/.test(n.en) && !n.pron); }
export function isPronRef(r){ const n=N(r); return !!(n && (n.pron || r==='p:it') && r[0]==='p'); }
export let POSSOF;
export function possOf(r){ if(!r) return 'my'; return POSSOF[r.slice(2)]||'their'; }
export function isPersonVerb(v){ return v.t && (v.t.includes('person')) && !v.t.includes('thing'); }
export function withEn(w){ if(/^self_/.test(w)) return w.slice(5); if(w==='alone') return 'alone'; if(w==='together') return 'together'; return 'with '+nounObj(w); }
export function withJa(w){ if(/^self_/.test(w)) return /^self_by /.test(w)?'ひとりで':'自分で'; if(w==='alone') return 'ひとりで'; if(w==='together') return 'みんなで'; return N(w).ja+'といっしょに'; }

// full sentence text (expand subs)
export function sentenceParts(S){
 const main = genClause(S.main,{kind:'main',key:'m'});
 const parts=[]; // flattened with clause info
 main.forEach(ch=>{
  if(ch.sub){
   const sb=S.main.subs[ch.sub]; if(!sb) return;
   const sub=subChunks(S, ch.sub); if(sub.futNote) parts._fn=1;
   if(sub.nr) parts.push({en:',',key:'nr1',clause:'rel',pos:'conj',nrc:1});
   parts.push({subStart:ch.sub, front: (ch===main[0] && ch.sub==='conj')||ch.sub==='part'});
   sub.forEach(x=>parts.push(x));
   parts.push({subEnd:ch.sub, front: (ch===main[0] && ch.sub==='conj')||ch.sub==='part'});
   if(sub.nr && sb && S.main.subs.rel.head==='subj') parts.push({en:',',key:'nr2',clause:'rel',pos:'conj',nrc:1});
  } else parts.push(ch);
 });
 parts.punct=main.punct; parts.futNote = main.futNote||parts._fn;
 return parts;
}
export function subChunks(S, kind){
 const sb=S.main.subs[kind]; const c=S.main;
 if(kind==='conj'){ const cj=CJ(sb.conj); const r=genClause(sb.c,{kind:'conj',key:'conj',conj:sb.conj}); const cjc={key:'conj.cj',en:cj.en,ja:cj.ja,cat:'conj',pos:'conj',clause:'conj'}; if(cj.conc){ const si=r.findIndex(x=>/state$/.test(String(x.key))&&x.en); if(si>=0){ const st0=r.splice(si,1)[0]; r.unshift(cjc); r.unshift(st0); return r; } } r.unshift(cjc); return r; }
 if(kind==='rel'){ const head = sb.head==='pred'?predHead(c):sb.head==='thing'?c.thing:sb.head==='subj'?(c.passive?c.obj:c.subj):c.obj; const nr=isNameRef(head); const r=genClause(sb.c,{kind:'rel',key:'rel',head,headAgr:agrOf(head),gap:sb.gap||'s',inf:sb.inf,pron:sb.pron||(nr?(isPerson(head)?'who':'which'):null)}); if(nr){ r.nr=1; } return r; }
 if(kind==='relw') return genClause(sb.c,{kind:'relw',key:'relw',word:sb.slot==='place'?'where':'when'});
 if(kind==='purpose') return genClause(sb.c,{kind:'purpose',key:'purpose'});
 if(kind==='comp') return genClause(sb.c,{kind:'comp',key:'comp'});
 if(kind==='part') return genClause(sb.c,{kind:'part',key:'part'});
 if(kind==='caus'){ const mv=predV(c); return genClause(sb.c,{kind:'caus',key:'caus',to:!!(mv&&mv.caus==='to'),ing:!!(mv&&mv.caus==='ing')}); }
 return [];
}
export function sentenceText(S){
 const parts=sentenceParts(S); let words=[];
 let frontConj=false;
 parts.forEach((p,i)=>{
  if(p.subStart){ if(p.subStart==='conj' && !p.front){ const cj=CJ(S.main.subs.conj.conj); if(cj.back && !cj.idiom && !(S.main.subs.conj.c&&S.main.subs.conj.c.share)) words.push(','); } return; }
  if(p.subEnd){ if((p.subEnd==='conj' && p.front)||p.subEnd==='part') words.push(','); return; }
  if(p.en){ let w=p.en; if(p.front&&words.length&&/^[A-Z][a-z]/.test(w)&&!/^(I|I'm|I'll)\b/.test(w)) w=w[0].toLowerCase()+w.slice(1); words.push(w); }
 });
 let t=words.join(' ').replace(/ ,/g,',').replace(/,,/g,',').replace(/\s+/g,' ').trim();
 t=cap(t); t=t.replace(/,$/,'');
 return t + (parts.punct||'.');
}

// ================= JAPANESE =================
export let GD;
export function jconj(d, jt){
 // returns {d, te, ta, nai(stem for ない), ms, pot, pas}
 if(jt==='s'){ const st=d.replace(/する$/,''); return {d, te:st+'して', ta:st+'した', na:st+'し', ms:st+'し', pot:st+'できる', pas:st+'される'}; }
 if(jt==='k'){ const st=d.replace(/来る$|くる$/,''); return {d, te:st+'来て', ta:st+'来た', na:st+'来', ms:st+'来', pot:st+'来られる', pas:st+'来られる'}; }
 if(jt==='i'){ const st=d.slice(0,-1); return {d, te:st+'て', ta:st+'た', na:st, ms:st, pot:st+'られる', pas:st+'られる'}; }
 const last=d.slice(-1), st=d.slice(0,-1), g=GD[last]||GD['る'];
 let te=st+g[3], ta=st+g[4]; if(d==='行く'||/行く$/.test(d)||/いく$/.test(d)){ te=st+'って'; ta=st+'った'; }
 return {d, te, ta, na:st+g[0], ms:st+g[1], pot:st+g[2]+'る', pas:st+g[0]+'れる'};
}
export function adjBase(s){ // i-adj
 const a=s.ja; if(/いい$/.test(a)&&!/わいい$/.test(a)) return a.slice(0,-2)+'よ'; return a.slice(0,-1); // いい→よかった（かわいい は かわいかった）
}
export function adjJa(s, f){ // f: plain, past, neg, pastneg, ku
 if(s.jt==='raw'){ if(/ある$/.test(s.ja)){ const b=s.ja.replace(/ある$/,''); return {plain:s.ja,past:b+'あった',neg:b+'ない',pastneg:b+'なかった',ku:b+'あって'}[f]; } return {plain:s.ja,past:s.ja.replace(/いる$/,'いた'),neg:s.ja.replace(/いる$/,'いない'),pastneg:s.ja.replace(/いる$/,'いなかった'),ku:s.ja.replace(/ている$/,'て')}[f]; }
 if(s.jt==='v'){ const j=jconj(s.ja,s.vt); return {plain:j.te+'いる',past:j.te+'いた',neg:j.te+'いない',pastneg:j.te+'いなかった',ku:j.te}[f]; }
 if(s.jt==='na'){ const a=s.ja; return {plain:a+'だ',past:a+'だった',neg:a+'じゃない',pastneg:a+'じゃなかった',ku:a+'に',stem:a}[f]; }
 const b=adjBase(s); return {plain:s.ja,past:b+'かった',neg:b+'くない',pastneg:b+'くなかった',ku:b+'く',stem:s.ja}[f];
}
export function iconj(stem, f){ // conj i-adj like たい : stem 'たべた' + i
 return {plain:stem+'い',past:stem+'かった',neg:stem+'くない',pastneg:stem+'くなかった'}[f];
}
// 動詞の性質（日本語訳用）：VMOM=一瞬で終わる動作（進行形は「〜ところだ」。「〜ている」だと結果の状態になる）、VNV=自分の意思でしない（未来の予定は「〜だろう」）、VTEIRU=状態なので「〜ている」で訳す
export let VMOM, VNV, VTEIRU;
export function futTime(c){ try{ const t=c.time&&TM(c.time); return !!(t&&t.ts&&t.ts.includes('fut')&&!t.ts.includes('past')); }catch(e){ return false; } }
export function jaPred(c, ctx, o){
 o=o||{};
 const v=predV(c), s=(o.sOverride)||predS(c), tn=c.tense, n=c.neg, m=c.modal;
 const first = !c.q && !c.passive && ((ctx && ctx.kind==='main' && c.subj==='p:i') || (c.subj==='p:we'));
 if(['may','might','must'].includes(m) || ((m==='will'||m==='should') && tn==='past') || (m==='could' && (tn!=='pres'||(s&&!predV(c))))){
  let b=jaPred(Object.assign({},c,{modal:c.semi||null,semi:null}), ctx, o); if(s && !v && !c.link && tn!=='past') b=b.replace(/だ$/,'');
  if(m==='must' && mustDuty(c)){ const b2=jaPred(Object.assign({},c,{modal:c.semi||null,semi:null,tense:'pres',neg:false}), ctx, o); const J2=b2.replace(/る$/,''); return n? (v? jconjTe(c,ctx,o)+'はいけない' : b2+'べきではない') : (v? jconjNa(c,ctx,o)+'なければならない' : b2+'べきだ'); }
  if(m==='should' && s && !v && !c.link){ const st=(s.noun||s.jt==='na')? s.ja+'で' : adjJa(s,'ku'); return st+(n?'あるべきではなかった':'あるべきだった'); }
  if(m==='should'){ const b2=jaPred(Object.assign({},c,{modal:c.semi||null,semi:null,tense:'pres'}), ctx, o).replace(/だ$/,''); return n? b2.replace(/ない$/,'')+'なければよかった' : b2+'べきだった'; }
  return (m==='might'?'ひょっとしたら':m==='must'?'きっと':'')+b+({may:'かもしれない',might:'かもしれない',must:'にちがいない',will:'だろう',could:'かもしれない'})[m];
 }
 if(c.type==='exist'){ const th=c.thing?N(c.thing):null; const alive = th && c.thing[0]==='p'; const w=alive?'い':'あ';
  if(tn==='past') return n?(alive?'いなかった':'なかった'):(alive?'いた':'あった');
  if(tn==='fut') return (n?(alive?'いない':'ない'):(alive?'いる':'ある'))+'だろう';
  if(tn==='perf') return n?(alive?'ずっといない':'ずっとない'):(alive?'ずっといる':'ずっとある');
  return n?(alive?'いない':'ない'):(alive?'いる':'ある'); }
 if(s && !v && c.link && typeof LINKV!=='undefined' && LINKV[c.link] && !o.noLink){
  const L=LINKV[c.link]; let pre;
  if(c.link==='seem') pre = s.noun? s.ja+'のように' : (s.jt==='na'? s.ja+'な' : adjJa(s,'plain'))+'ように';
  else if(c.link==='look'||c.link==='sound') pre = s.noun? s.ja+'に' : (s.jt==='v'||s.jt==='raw')? adjJa(s,'plain')+'ように' : s.jt==='i'? (/いい$/.test(s.ja)?s.ja.slice(0,-2)+'よさ':adjBase(s))+'そうに' : s.jt==='na'? s.ja+'そうに' : adjJa(s,'ku');
  else if(c.link==='feel' && (s.jt==='v'||s.jt==='raw')) pre = adjJa(s,'plain')+'ように'; // つかれて感じる → つかれているように感じる
  else pre = s.noun||s.jt==='na'? s.ja+'に' : adjJa(s,'ku');
  const c2=Object.assign({},c,{pred:{k:'v',id:'__link_'+c.link},link:null});
  return pre + jaPred(c2, ctx, o);
 }
 if(s && !v && s.loc && m && ['can','want','haveto','should'].includes(m)){ const b=s.jn+'に'; const al=s.al;
  if(m==='can') return b+(al?(n?'いられない':'いられる'):(n?'あるはずがない':'ありうる'));
  if(m==='want') return b+(n?'いたくない':'いたい');
  if(m==='haveto') return b+(n?(al?'いなくてもいい':'なくてもいい'):(al?'いなきゃ':'なきゃ'));
  if(m==='should') return b+(n?(al?'いないほうがいい':'ないほうがいい'):(al?'いたほうがいい':'あったほうがいい')); }
 if(s && !v && s.loc && !m && tn==='perf'){ const n2=n||c.freq==='never'; return s.jn+'に'+(s.jn==='ここ'?'来た':'行った')+(n2?'ことがない':'ことがある'); }
 if(s && !v && m==='can' && !s.loc){ // 状態＋can は能力でなく「可能性」：〜こともある／〜はずがない（can't be → はずがない）
  const nn=s.noun||s.jt==='na'; const st=nn? s.ja+'である' : adjJa(s,'plain'); const pst=tn==='past';
  if(c.q && !c.q.wh) return (nn? s.ja+'で' : adjJa(s,'ku'))+'いられ'+(pst?(n?'なかった':'た'):(n?'ない':'る')); // Can he be healthy? → 健康でいられる？
  const r = n ? (nn? s.ja+'の' : st)+'はずが'+(pst?'なかった':'ない') : st+'こともあ'+(pst?'った':'る');
  return r+(tn==='fut'?'だろう':''); }
 if(s && !v && m && typeof MPAT!=='undefined' && MPAT[m]){ // 状態の語を「〜でいる／〜くいる／〜ている」という動詞にして型に差し込む（「〜になる」を土台にしない）
  const LKJ={become:'なる',get:'なる',turn:'なる',look:'見える',seem:'見える',feel:'感じる',sound:'聞こえる'};
  const nn=s.noun||s.jt==='na'; const base=(s.jt==='v'||s.jt==='raw')? adjJa(s,'ku') : nn? s.ja+(c.link&&LKJ[c.link]?'に':'で') : adjJa(s,'ku');
  const dict = c.link&&LKJ[c.link]&&!/^(become|get|turn)$/.test(c.link) ? base+LKJ[c.link] : (c.link==='become'||c.link==='get'||c.link==='turn') ? ((s.jt==='v'||s.jt==='raw')? base : (nn? s.ja+'に' : adjJa(s,'ku')))+'なる' : base+'いる';
  const JS=jconj(dict,'i'); JS.st=1; return MPAT[m].ja(JS,tn,n,first,c); }
 if(s && !v){
  const pst=tn==='past';
  const sBe=s=>(s.jt==='v'||s.jt==='raw')? adjJa(s,'ku') : (s.noun||s.jt==='na')? s.ja+'で' : adjJa(s,'ku'); // 「〜でいる／〜くいる／〜ている」の連用形
  const vlike=(s.jt==='v'||s.jt==='raw'); // 怒る・つかれる など動詞の形の状態語は「〜ていたい／〜ていなきゃ」にする
  if(m==='want'){ const me=['p:i','p:we','p:you'].includes(c.subj); if(vlike){ const J2=jconj(adjJa(s,'ku')+'いる','i'); if(!me && !(ctx&&ctx.kind==='rel')) return J2.ms+(n?(pst?'たがっていなかった':'たがっていない'):(pst?'たがっていた':'たがっている')); return J2.ms+(n?(pst?'たくなかった':'たくない'):(pst?'たかった':'たい')); } if(!me && !(ctx&&ctx.kind==='rel')) return adjJa(s,'ku')+(n?(pst?'なりたがっていなかった':'なりたがっていない'):(pst?'なりたがっていた':'なりたがっている')); return adjJa(s,'ku')+(n?(pst?'なりたくなかった':'なりたくない'):(pst?'なりたかった':'なりたい')); }
  if(m==='might') return adjJa(s,n?'neg':'plain').replace(/だ$/,'')+'かもしれない';
  if(m==='haveto') return n? sBe(s)+(pst?'いる必要はなかった':'いる必要はない') : sBe(s)+(pst?'いなきゃいけなかった':'いなきゃ');
  if(m==='should') return sBe(s)+(n?'いないほうがいい':'いたほうがいい');
  if(m==='will'||m==='prob'||tn==='fut') return (m==='prob'?'たぶん':'')+adjJa(s,n?'neg':'plain').replace(/だ$/,'')+'だろう';
  if(tn==='perf') return 'ずっと'+adjJa(s,n?'neg':'plain');
  if(tn==='pastperf') return 'その時まで'+adjJa(s,n?'pastneg':'past');
  if(tn==='futperf') return 'その時までには'+adjJa(s,n?'neg':'plain').replace(/だ$/,'')+'だろう';
  return adjJa(s, pst?(n?'pastneg':'past'):(n?'neg':'plain'));
 }
 if(!v) return '';
 let vd=v.ja, vt=v.jt;
 if(c._vja){ vd=c._vja[0]; vt=c._vja[1]; }
 if(v.id==='give'&&(c.iobj==='p:i'||c.iobj==='p:we')&&c.subj!=='p:i'&&c.subj!=='p:we'){ vd='くれる'; vt='i'; }
 if(!o.doVerb && c.place==='home' && (v.id==='go'||v.id==='come')){ vd = v.id==='go'?'帰る':'帰ってくる'; vt = v.id==='go'?'g':'k'; }
 if(o.doVerb){ vd='する'; vt='s'; }
 else if(!c._vja && c.obj && c.useObj!==false && typeof pairJa==='function' && pairJa(v.id,c.obj) && !(c.passive && pairJa(v.id,c.obj).p!=='を' && !/する$/.test(pairJa(v.id,c.obj).v))){ const pj=pairJa(v.id,c.obj); vd=pj.v; vt=pj.t; }
 else if(!c._vja && v.jaBy && c.obj){ const tg=nounTags(c.obj).find(t=>v.jaBy[t]); if(tg){ vd=v.jaBy[tg][0]; vt=v.jaBy[tg][1]; } }
 if(v.jaAdj && !o.doVerb && !c._vja){ // like/love/need/want
  const fake={ja:vd,jt:v.jaAdjT||'na'}; const pst=tn==='past'||tn==='pastprog';
  if(m==='would'&&/^(like|love|want)$/.test(v.id)) return (n?'ほしくないです':'ほしいです')+(c.q?'か':'');
  if(m==='might') return adjJa(fake,n?'neg':'plain').replace(/だ$/,'')+'かもしれない';
  if(tn==='fut'||m==='will'||m==='prob') return adjJa(fake,n?'neg':'plain').replace(/だ$/,'')+'だろう';
  if(tn==='perf') return 'ずっと'+adjJa(fake,n?'neg':'plain');
  return adjJa(fake, pst?(n?'pastneg':'past'):(n?'neg':'plain'));
 }
 const aru=vt==='aru'; let J=jconj(vd, aru?'g':vt); if(aru){ const pre=vd.replace(/ある$/,''); J.na=pre; J.d=vd; } // 「ある」の否定は「ない」
 if(c.passive){ J=jconj(J.pas,'i'); J.pot=J.d+'ことができる'; } // 受け身の可能：〜られることができる（受け身と可能の「られる」を混ぜない）
 const teiru = (v.teiru || VTEIRU.has(v.id)) && !aru && !/^(いる|ある)$/.test(vd); // いる・ある はそれだけで状態
 const vol = first && !aru && !v.stative && !VNV.has(v.id) && !/^(いる|ある)$/.test(vd); // 「つもり」は自分の意思でする動作だけ // know → 知っている / have → 持っている
 // modal
 if(m && typeof MPAT!=='undefined' && MPAT[m] && !(c.semi&&REALMOD.includes(m))) return MPAT[m].ja(J,tn,n,first,c);
 if(c.semi && REALMOD.includes(m)){ const me=['p:i','p:we','p:you'].includes(c.subj); const inn=c.semi==='want'?(me?J.ms+(n?'たくない':'たい'):J.ms+(n?'たがらない':'たがる')):(n?J.d+'必要はない':J.na+'なきゃいけない'); const sf={will:'だろう',would:'だろう',must:'にちがいない',should:'はずだ'}[m]||'かもしれない'; return inn+sf; }
 if(m==='can' && c.q && !c.q.wh && tn==='pres' && (c.subj==='p:i'||c.subj==='p:we') && !c.passive && !c._pcan && !aru && !/^(いる|ある)$/.test(vd)) return J.te+(n?'はだめ':'もいい'); // Can I ...? は許可：〜してもいい？
 if(m==='can' && /^(fall|fall_down|lose|forget|x_drop|c2_die)$/.test(v.id) && !aru && !c.passive){ const pst=tn==='past'; return (n?J.d+'はずが'+(pst?'なかった':'ない'):J.d+'こともあ'+(pst?'った':'る'))+(tn==='fut'?'だろう':''); } // 転ぶ・なくす＋can は能力でなく可能性
 if(m==='can' && vd==='いる' && !aru){ const pst=tn==='past'; return (n?'いるはずが'+(pst?'なかった':'ない'):'いることもあ'+(pst?'った':'る'))+(tn==='fut'?'だろう':''); } // 友人がいる＋can → いることもある
 if(m==='can' && aru){ const b=J.na; if(tn==='past') return b+(n?'ありえなかった':'ありえた'); return b+(n?'ありえない':'ありうる')+(tn==='fut'?'だろう':''); } // 問題がある＋can → ありうる（あれる は誤り）
 if(m==='can'){ const P=jconj(J.pot,'i'); if(tn==='past') return n?P.na+'なかった':P.ta; if(tn==='fut') return (n?P.na+'ない':P.d)+'だろう'; return n?P.na+'ない':P.d; }
 if(m==='want'){ const me=['p:i','p:we','p:you'].includes(c.subj); if(!me && ctx && ctx.kind!=='rel'){ const b=J.ms+'たがって'; return b+(tn==='past'?(n?'いなかった':'いた'):(n?'いない':'いる')); } const f= tn==='past'?(n?'pastneg':'past'):(n?'neg':'plain'); return iconj(J.ms+'た', f); }
 if(m==='haveto'){ if(n) return J.d+'必要はない'+(tn==='past'?'（なかった）':''); return J.na+'なきゃいけな'+(tn==='past'?'かった':'い')+(tn==='fut'?'だろう':''); }
 if(m==='could'){ const P=jconj(J.pot,'i'); return (n?P.na+'ない':P.d)+'かもしれない'; }
 if(m==='might'){ let b = tn==='prog'?(J.te+(n?'いない':'いる')): tn==='perf'?(n?J.na+'なかった':J.ta):(n?J.na+'ない':J.d); return b+'かもしれない'; }
 if(m==='should'){ if(tn==='perf') return (n?J.na+'なければよかった':J.ta+'ほうがよかった'); return n?J.na+'ないほうがいい':J.ta+'ほうがいい'; }
 if(m==='will'||m==='prob'){ const b=n?J.na+'ない':J.d; return (m==='prob'?'たぶん':'')+b+(vol&&m==='will'?'つもりだ':'だろう'); }
 if(teiru){ if(tn==='past'||tn==='pastprog') return J.te+(n?'いなかった':'いた'); if(tn==='fut') return J.te+(n?'いない':'いる')+'だろう'; return J.te+(n?'いない':'いる'); }
 if(c.passive && tn==='pres' && c.time==='now') return J.te+(n?'いない':'いる'); // is worn now → 着られている
 const mom=VMOM.has(v.id)&&!c.passive&&!n&&v.id!=='win'; // 否定・win は「〜ている」（見つけていない／勝っている）
 switch(tn){
  case 'prog': if(futTime(c)) return (n?J.na+'ない':J.d)+(VNV.has(v.id)||c.passive?'だろう':'予定だ'); if(mom) return J.d+'ところだ'; return J.te+(n?'いない':'いる');
  case 'past': return n?J.na+'なかった':J.ta;
  case 'pastprog': if(mom) return J.d+'ところだった'; return J.te+(n?'いなかった':'いた');
  case 'perf': if(c.freq==='ever'||c.freq==='never') return J.ta+(n?'ことがない':'ことがある'); if(c.time&&TM(c.time)&&/^(for|since) /.test(TM(c.time).en||'')) return J.te+(n?'いない':'いる'); return n?(c.freq==='still'?'':'まだ')+J.te+'いない':(c.freq==='already'||(c.time&&c.time!=='yet')?'':'もう')+J.ta;
  case 'perfprog': return 'ずっと'+J.te+(n?'いない':'いる');
  case 'pastperfprog': return 'それまでずっと'+J.te+(n?'いなかった':'いた');
  case 'futperf': return (n?'まだ'+J.te+'いない':'もう'+J.te+'いる')+'だろう';
  case 'futperfprog': return 'そのときまでずっと'+J.te+(n?'いない':'いる')+'だろう';
  case 'fut': return (n?J.na+'ない':J.d)+(vol?'つもりだ':'だろう');
  case 'pastperf': return n?'まだ'+J.te+'いなかった':'もう'+J.te+'いた';
  case 'futprog': return J.te+(n?'いないだろう':'いるだろう');
  default: return n?J.na+'ない':J.d;
 }
}
export function jaVerbOf(c){ const v=predV(c); if(!v) return null; if(v.id==='give'&&(c.iobj==='p:i'||c.iobj==='p:we')&&c.subj!=='p:i'&&c.subj!=='p:we') return ['くれる','i']; if(v.jaBy && c.obj){ const tg=nounTags(c.obj).find(t=>v.jaBy[t]); if(tg) return v.jaBy[tg]; } return [v.ja,v.jt]; }
export function jaClause(c, ctx){
 if(c && c.passive && c.modal==='can' && c.subj) c=Object.assign({},c,{passive:false,_pcan:1}); // 受け身＋can は「〜を〜できる」（使われることができる、は不自然）
 ctx=ctx||{kind:'main'};
 if(ctx.kind==='main'&&c.q&&!c.q.wh&&c.subj==='p:you'&&!c.neg&&typeof isVc==='function'&&isVc(c)&&predV(c)&&predV(c).id==='b_mind'&&c.subs.comp.c.vform==='ing'){ try{ const vc=vcJa(c); if(vc&&vc.te){ const w=(c.modal==='would'||c.modal==='could'); return vc.te+(w?'もらえませんか？':'もいいですか？'); } }catch(e){} }
 const v=predV(c), s=predS(c), q=(ctx.kind==='main'||(ctx.kind==='comp'&&!c.vform))?c.q:null, wh=q&&q.wh;
 const pieces=[];
 const topic = ctx.kind==='main'?'は':'が';
 const relwJa = ctx.relw||{};
 const cc=Object.assign({},c); if(c.freq==='never'||c.freq==='hardly') cc.neg=true; if(['subj','obj','thing'].some(f=>c[f]&&typeof (N(c[f])||{}).negq==='string')) cc.neg=true;
 if(ctx.kind==='conj' && ctx.conj==='ifx'){ cc.tense='past'; cc.modal=null; }
 if(ctx.kind==='main' && c.subs && c.subs.conj && c.subs.conj.conj==='ifx'){ cc.tense='pres'; cc.modal=null; }
 if(ctx.kind==='conj'){ const cj=CJ(ctx.conj); if(['time','if'].includes(cj.kind)){ if(cc.tense==='fut') cc.tense='pres'; if(cc.modal==='will'||cc.modal==='prob') cc.modal=null; } if(ctx.conj==='before'){ cc.tense='pres'; } if(ctx.conj==='after'&&cc.tense==='pres') cc.tense='past'; if(ctx.conj==='while'&&cc.tense==='pres'&&v) cc.tense='prog'; }
 if(c.type==='hab'){ const th=c.thing?N(c.thing):null; return (th?th.ja:'…')+'はどう？'; }
 if(c.type==='excl'){ const th=c.thing?N(c.thing):null, aj=c.exadj?ST(c.exadj):null; return 'なんて'+(aj?(aj.jt==='na'?aj.ja+'な':adjJa(aj,'plain')):'')+(th?th.ja:'…')+'なんだ！'; }
 if(c.type==='imp'){
  const vj=jaVerbOf(c); const J=vj?jconj(vj[0],vj[1]):null;
  if(c.time) pieces.push(TM(c.time).jas!=null?TM(c.time).jas:TM(c.time).ja); if(c.place) pieces.push(v&&v.motion?PL(c.place).jat:PL(c.place).ja); if(c.with) pieces.push(withJa(c.with)); if(v&&v.fr==='cl'){ if(v.dt&&c.iobj) pieces.push(N(c.iobj).ja+'に'); if(ctx.compJa){ const ic=c.subs.comp&&c.subs.comp.c; const qq=ic&&(ic.q||ic.cif); pieces.push(ctx.compJa+(qq?(ic.cif?(v.clq||'かどうか'):(v.clq||'か')):(v.clj||'と'))); } } else if(c.obj&&v&&needsObj(c)){ if(v.dt&&c.iobj) pieces.push(N(c.iobj).ja+'に'); pieces.push(objJa(c)+(v.part||'を')); } if(c.manner) pieces.push(MN(c.manner).ja);
  let p='';
  if(v && v.caus && c.subs && c.subs.caus && c.subs.caus.c && predV(c.subs.caus.c)){ // Let me know! / Let him go! / Make me laugh!
   const sc=c.subs.caus.c, sv=predV(sc), svj=jaVerbOf(sc); const me=c.obj==='p:i'||c.obj==='p:we'; const sub=[];
   if(sc.obj&&needsObj(sc)) sub.push(N(sc.obj).ja+(sv.part||'を'));
   const LJ={know:'知らせて',see:sc.obj&&needsObj(sc)?'見せて':'見させて',think:'考えさせて',x_try:'やらせて'};
   let cf = (me && v.id==='caus_let' && LJ[sv.id]) || (svj? causForm(svj[0],svj[1]).replace(/る$/,'て') : 'させて');
   if(!me) cf = cf + (v.id==='caus_let'?'あげて':'');
   const who = me? '' : (c.obj? N(c.obj).ja+((['caus_make','caus_let'].includes(v.id)&&sv&&!needsObj(sc))?'を':'に') : '');
   return [who].concat(pieces.filter(x=>x!==(c.obj?N(c.obj).ja+(v.part||'を'):'')),sub,[cf]).filter(Boolean).join('')+'！'; }
  if(c.imp==='letme' && v){ const hasO=!!(c.obj&&needsObj(c)); const LJ={see:hasO?'見せて':'ええと、そうだなあ',know:'知らせて',think:'考えさせて',x_try:'やらせて',x_guess:'当てさせて'};
   const base = LJ[v.id] || (J? causForm(vj[0],vj[1]).replace(/る$/,'て') : 'させて');
   return pieces.concat([base]).filter(Boolean).join('')+'。'; }
  if(v && c.imp!=='letme' && c.imp!=='lets' && typeof isVc==='function' && isVc(c)){ try{ const r=vcJa(c); const vj2=r.v||vj; const J2=vj2?jconj(vj2[0],vj2[1]):null; if(J2){ return pieces.concat([r.pre+(c.neg?J2.na+'ないで':J2.te+(c.imp==='please'?'ください':''))]).filter(Boolean).join('')+'！'; } }catch(e){} }
  if(v && v.jaAdj) p = v.ja+(c.neg?'にならないで':'になって');
  else if(J) p = c.imp==='lets' ? (c.neg?J.na+'ないでおこう':J.ms+'ましょう') : (c.neg?J.na+'ないで':J.te+(c.imp==='please'?'ください':''));
  else if(s) p = (s.jt==='na'?s.ja+'に':adjJa(s,'ku'))+(c.neg?'しないで':'して');
  return pieces.concat([p]).filter(Boolean).join('')+(c.imp==='lets'?'。':'！');
 }
 if(c.type==='exist'){
  if(c.time) pieces.push((TM(c.time).jas!=null?TM(c.time).jas:TM(c.time).ja));
  if(c.place) pieces.push(PL(c.place).jn+'に');
  pieces.push(c.thing?((ctx.rels||{}).thing||'')+N(c.thing).ja+'が':'何かが');
  pieces.push(jaPred(cc,ctx));
  return pieces.join('')+(q?'？':'');
 }
 const sref = c.passive? c.obj : c.subj;
 const rel = ctx.rels||{};
 const myJa=(ref,role)=>{ const n=N(ref); if(role==='subj'||n.bpart||c.subj==='p:i'||!/^my /i.test(String(n.en||''))||/^(mom|dad|grandma|p:i)$/.test(n.id)||/^(わたし|自分)/.test(n.ja)) return ''; return 'わたしの'; }; // my の所有者は話し手のまま（主語がわたし以外なら「わたしの」）
 const nounJa=(ref,role)=> (rel[role]? rel[role]:'')+myJa(ref,role)+((role==='obj'&&typeof pairJa==='function'&&predV(c)&&pairJa(predV(c).id,ref))?pairJa(predV(c).id,ref).n:N(ref).ja)+((role==='obj'&&predV(c)&&predV(c).id==='listen'&&(isPerson(ref)||(N(ref).pron&&!N(ref).thing&&N(ref).id!=='it')))?'の話':'');
 const pushEL=(t)=>pieces.push((q&&q.el?'他に':'')+t);
 if((ctx.kind!=='rel'||ctx.gap==='o') && ctx.kind!=='purpose' && ctx.kind!=='part' && !(ctx.kind==='comp' && c.vform)){
  if(wh==='subj') pushEL((q.wj&&/ /.test(q.w||''))? (()=>{ let t=q.wj.replace('？',''); if(/(を|が)いくつ$/.test(t)) return 'いくつの'+t.replace(/(を|が)いくつ$/,'')+'が'; return t.replace(/[をが]$/,'')+'が'; })() : (q.w==='what'||(c.subj&&c.subj[0]==='t'))?'何が':'誰が');
  else if(sref && c.modal==='shall' && c.q && ctx.kind==='main' && (sref==='p:i'||sref==='p:we')){ }
  else if(sref && !c.share && !(sref==='p:it' && ((s && s.weather)||(v && v.weather)))) pieces.push((c.spm?c.spm.ja:'')+(!c.passive&&c.sadj&&ST(c.sadj)&&!(N(sref)||{}).pron?attrJa(ST(c.sadj)):'')+((N(sref)||{}).negpre||'')+nounJa(sref, c.passive?'obj':'subj')+((N(sref)||{}).negsuf||'')+(typeof (N(sref)||{}).negq==='string'?N(sref).negq:((N(sref)||{}).jtopic&&topic==='は'?'':topic)));
 }
 if(c.freq==='also' && pieces.length){ pieces[pieces.length-1]=pieces[pieces.length-1].replace(/(は|が)$/,'も'); }
 const FAJ = (c.freq && c.freq!=='also' && typeof FREQADV!=='undefined')? (FREQADV.find(f=>f.id===c.freq)||{}).ja : null;
 if(wh==='why') pieces.push('どうして');
 if(c.time) pieces.push(wh==='time'?(q.wj?q.wj.replace('？',''):'いつ'):(relwJa.time? relwJa.time+(TM(c.time).jn||'とき')+'に' : (TM(c.time).jas!=null?TM(c.time).jas:TM(c.time).ja))); else if(wh==='time') pieces.push(q.wj?q.wj.replace('？',''):'いつ');
 if(c.place||wh==='place'){ const p=c.place?PL(c.place):null; const pjx=(v&&c.obj&&typeof pairJa==='function')?pairJa(v.id,c.obj):null; const arr=v&&(/^(arrive|get_arrive|c2_land)$/.test(v.id)||(pjx&&pjx.v==='いる')); // 着く・着陸する／家族がいる：場所は「〜に」
 pieces.push(wh==='place'?(arr?'どこに':v&&v.motion?'どこへ':'どこで'):(relwJa.place? relwJa.place+p.jn+(arr?'に':v&&v.motion?'へ':'で') : arr&&p.jn?(v&&/^(arrive|get_arrive|c2_land)$/.test(v.id)&&p.jto?p.jto:p.jn)+'に' : (v&&v.motion?(c.place==='home'?'家に':p.jat):((c.pbare||(v&&v.id==='x_stay'))&&p.jn?p.jn+'に':p.ja)))); }
 if(c.with||wh==='with') pieces.push(wh==='with'?'誰と':withJa(c.with));
 if(c.passive && c.subj) pieces.push(N(c.subj).ja+'に');
 if(ctx.purposeJa) pieces.push(ctx.purposeJa);
 if(FAJ) pieces.push(c.freq==='never'?'一度も':FAJ); if(c.only && !(c.obj&&v&&needsObj(c)&&!c.passive)) pieces.push('ただ'); if(c.quant) pieces.push(c.quant==='both'?'ふたりとも':'みんな');
 const SP = s && c.sobj && typeof SPREP!=='undefined' && SPREP[s.id] && N(c.sobj) ? SPREP[s.id] : null;
 if(SP) pieces.push(N(c.sobj).ja+SP.jp);
 if(s && c.degree==='more' && c.than) pieces.push(N(c.than).ja+'より');
 if(s && c.degree==='as' && c.than) pieces.push(N(c.than).ja+'と同じくらい');
 if(s && c.degree==='most' && c.scope) pieces.push(SCOPE[c.scope].ja);
 if(s && ctx.compJa && !v) { const ic=c.subs&&c.subs.comp&&c.subs.comp.c; const qq=ic&&(ic.q||ic.cif); pieces.push(ctx.compJa+(qq?(ic.cif?'かどうか':'か')+(/^(sure|certain|clear|true|obvious)$/.test(s.en)?'は':'が'):(/^(sure|certain|clear|true|obvious)$/.test(s.en)?'ということは':'ことが'))); }
 if(s && c.degree==='very') pieces.push('とても');
 if(s && c.degree==='most') pieces.push('いちばん');
 if(v && needsObj(c) && !c.passive && wh!=='action'){
  if(ctx.vcJa && isVc(c)){ pieces.push(ctx.vcJa.pre); if(ctx.vcJa.v) cc._vja=ctx.vcJa.v; }
  else if(v.fr==='cl'){ if(v.dt && c.iobj) pieces.push(N(c.iobj).ja+'に'); if(ctx.compJa){ const ic=c.subs&&c.subs.comp&&c.subs.comp.c; const qq=ic&&(ic.q||ic.cif); pieces.push(ctx.compJa+(qq?(ic.cif?(v.clq||'かどうか'):(v.clq||'か')):(v.clj||'と'))); } }
  else if(wh==='obj') pushEL(q.wj?q.wj.replace('？','').replace(/[をが]$/,'')+(/いくつ？?$/.test(q.wj)?'':(v.part||'を')):((c.obj&&isPerson(c.obj))||q.w==='who'?'誰':'何')+(v.part||'を'));
  else if(ctx.gap==='o'){ if(v.dt && c.iobj) pieces.push(N(c.iobj).ja+(v.dt==='for'?'のために':'に')); }
  else if(v.caus && ctx.causJa){ if(c.obj) pieces.push(N(c.obj).ja+(c.subs&&c.subs.caus&&((predS(c.subs.caus.c)&&v.id==='caus_make')||(['caus_make','caus_let'].includes(v.id)&&predV(c.subs.caus.c)&&!needsObj(c.subs.caus.c)))?'を':(v.cl||'に'))); if(ctx.causJa.pre) pieces.push(ctx.causJa.pre); }
  else if(c.obj){ if(v.dt && c.iobj) pieces.push(N(c.iobj).ja+(v.dt==='for'?'のために':'に')); { const pj=(typeof pairJa==='function')?pairJa(v.id,c.obj):null; pieces.push((rel.obj||'')+((rel.obj&&c.subs&&c.subs.rel&&c.subs.rel.inf)?objJa(c).replace(/^何か$/,'もの').replace(/^誰か$/,'人'):objJa(c))+(c.only?'だけ':'')+(pj?pj.p:(v.part||'を'))); } }
 }
 if(c.manner && c.mdeg){ if(c.mdeg==='more'&&c.mthan&&N(c.mthan)) pieces.push(N(c.mthan).ja+'より'); if(c.mdeg==='as'&&c.mthan) pieces.push(/^x:/.test(c.mthan)?'できるだけ':N(c.mthan).ja+'と同じくらい'); if(c.mdeg==='most'){ if(c.scope) pieces.push(SCOPE[c.scope].ja); pieces.push('いちばん'); } }
 if(c.manner||wh==='manner') pieces.push(wh==='manner'?(q.wj?q.wj.replace('？',''):'どんなふうに'):(c.manner==='a_lot'&&v&&v.stative?(c.mdeg==='more'?'もっと':'とても'):(c.mdeg==='more'&&c.mfree&&!c.mthan?'もっと':'')+MN(c.manner).ja));
 if(wh==='state'){ const sw=q&&q.w; const base=sw==='who'?'誰':sw==='what'?'何':null; pieces.push(base?(cc.tense==='past'?base+'だった':base):(cc.tense==='past'?'どうだった':'どう')); }
 else if(wh==='action'){ pieces.push('何を'); pieces.push(jaPred(cc,ctx,{doVerb:1})); }
 else if(v && v.caus && ctx.causJa) pieces.push(ctx.causJa.pred);
 else { const RP=(ctx.rels&&ctx.rels.pred&&s&&s.noun)?ctx.rels.pred:''; pieces.push(jaPred(cc,ctx, ((SP && SP.ja)||RP)? {sOverride:Object.assign({},s,{ja:RP+((SP&&SP.ja)||s.ja),jt:(SP&&SP.jt)||s.jt})} : undefined)); }
 let out=pieces.filter(Boolean).join('').replace(/を(でき(?:る|ない|た|なかった))(?!だけ)/,'が$1'); if(c.place&&c.subj!=='p:i'){ try{ if(/\bmy\b/i.test(PL(c.place).en)) out=out.replace('自分の','わたしの'); }catch(e){} } const cop=!!(predS(c) && !predV(c) && c.tense!=='past' && !c.modal);
 if(q && /だろう$/.test(out)) out = (q.wh? out.replace(/だろう$/,(s&&!v&&(s.noun||s.jt==='na')&&out.endsWith(s.ja+'だろう'))?'なのだろう':'のだろう') : out+'か'); // 静かなのだろう／遅刻なのだろう // 推量の疑問：だろうか？／どうして〜のだろう？
 if(q && /(予定|ところ|つもり)(ではない)?だ$/.test(out)) out=out.replace(/だ$/,'').replace(/ではない$/,'じゃない'); // 予定だ？→予定？
 return q? (cop? out.replace(/([^ん])だ$/,'$1') : out)+'？' : out;
}
export function sentenceJa(S){ let j=sentenceJa0(S); j=j.replace(/((?:も|だけでなく)[^もをがは、。]+)も(?:を|が(?=好き|ほし|でき|わか|いる|ある|見え|聞こえ))/g,'$1も'); try{ if(S.main.tagText) j=j.replace(/[。？！]$/,'')+'よね？'; }catch(e){} return j; }
export function sentenceJa0(S){
 const c=S.main, subs=c.subs; const ctx={kind:'main',rels:{}};
 if(subs.rel){ const rs=predS(subs.rel.c); ctx.rels[subs.rel.head]=jaClause(subs.rel.c,{kind:'rel',gap:subs.rel.gap,inf:subs.rel.inf}).replace(/[。？]$/,'').replace(/だ$/, rs&&rs.noun?'である':'な'); }
 if(subs.relw){ ctx.relw={[subs.relw.slot]: jaClause(subs.relw.c,{kind:'relw'}).replace(/[。？]$/,'').replace(/だ$/,'な')}; }
 if(subs.purpose){ const pv=predV(subs.purpose.c); const pc=subs.purpose.c; let pj=''; if(pv){ const J=jconj(pv.ja,pv.jt); pj=(pc.obj?N(pc.obj).ja+(pv.part||'を')+' ':'')+(pc.place?PL(pc.place).ja+' ':'')+(pc.neg?J.na+'ない':J.d)+'ために'; } else if(predS(pc)) pj=adjJa(predS(pc),'ku')+'なるために'; ctx.purposeJa=pj.replace(/ /g,''); }
 if(subs.comp){ if(subs.comp.c.vform && isVc(c)) ctx.vcJa=vcJa(c); else ctx.compJa=jaClause(subs.comp.c,{kind:'comp'}).replace(/[。？]$/,''); }
 if(subs.caus && predV(c) && predV(c).caus){ const mv=predV(c), sc=subs.caus.c, sv=predV(sc), ss=predS(sc); let pre=''; if(sc.obj && sv && needsObj(sc)) pre+=objJa(sc)+(sv.part||'を'); if(sc.place) pre+= sv&&sv.motion? (sc.place==='home'?'家に':PL(sc.place).jat) : PL(sc.place).ja; if(sc.manner) pre+=MN(sc.manner).ja;
  let helper=null, hjt='i', hadj=false;
  if(sv){ const vj=jaVerbOf(sc)||[sv.ja,sv.jt]; const J=jconj(vj[0],vj[1]);
   if(sc.neg){ const Jn=J.na+'ない'; helper = {caus_ask:Jn+'ように頼む', caus_tell:Jn+'ように言う', caus_want:J.na+'ないでほしい', caus_make:null}[mv.id]; if(helper==null) helper=undefined; }
   if(!sc.neg) helper = {caus_make:causForm(vj[0],vj[1]), caus_let:causForm(vj[0],vj[1]).replace(/る$/,'て')+(c.obj==='p:i'||c.obj==='p:we'?'くれる':'あげる'), caus_have:J.te+'もらう', caus_help:J.d+'のを手伝う', caus_want:J.te+'ほしい', caus_ask:J.d+'ように頼む', caus_tell:J.d+'ように言う', caus_see:J.te+'いるのを見る', caus_watch:J.te+'いるのを見る', caus_hear:J.te+'いるのを聞く', caus_notice:J.te+'いるのに気づく', caus_seeb:J.d+'のを見る', caus_watchb:J.d+'のを見る', caus_hearb:J.d+'のを聞く'}[mv.id];
   hjt={caus_have:'g',caus_help:'g',caus_ask:'g',caus_tell:'g',caus_hear:'g',caus_hearb:'g',caus_notice:'g'}[mv.id]||'i'; hadj = mv.id==='caus_want'; }
  else if(ss){ const ku = ss.noun||ss.jt==='na'? ss.ja+'に' : adjJa(ss,'ku'); helper = {caus_make:ku+'させる', caus_want:ku+'なってほしい', caus_ask:ku+'なるように頼む', caus_tell:ku+'なるように言う', caus_let:ku+'させてあげる', caus_have:ku+'なってもらう', caus_help:ku+'なるのを手伝う'}[mv.id]; hjt={caus_have:'g',caus_help:'g',caus_ask:'g',caus_tell:'g'}[mv.id]||'i'; hadj = mv.id==='caus_want'; }
  if(helper){ LEX.idx['verbs:__caus']={id:'__caus',en:'x',ja:helper,jt:hjt,fr:'intr',hidden:1,jaAdj:hadj?1:0,jaAdjT:'i'}; const pred=jaPred(Object.assign({},c,{pred:{k:'v',id:'__caus'},obj:null,useObj:false}),ctx); ctx.causJa={pre,pred}; } }
 let main=jaClause(c,ctx);
 if(c.cmpw && N(c.cmpw)) main=N(c.cmpw).ja+'とくらべると、'+main;
 if(c.lead){ const L=LEADF(c.lead); if(L) main=(c.leadXja||'')+L.ja+'、'+main; }
 if(subs.part){ const pc=subs.part.c, pv=predV(pc), ps=predS(pc); let pj=''; if(pv){ const vj=jaVerbOf(pc)||[pv.ja,pv.jt]; const J=jconj(vj[0],vj[1]); pj=(pc.obj?objJa(pc)+(pv.part||'を'):'')+(pc.place?PL(pc.place).ja.replace(/で$/,'を'):'')+(pc.manner?MN(pc.manner).ja:'')+J.ms+'ながら'; } else if(ps) pj=adjJa(ps,'ku').replace(/く$/,'くて').replace(/に$/,'で'); main=pj+'、'+main; }
 if(subs.conj){
  const cj=CJ(subs.conj.conj); let sj=jaClause(subs.conj.c,{kind:'conj',conj:subs.conj.conj});
  const suf={when:'とき',if:'なら',because:'から',before:'前に',after:'後で',until:'まで',while:'間',although:'けれど',i_asconc:'けれど'}[cj.id] || (typeof CONJ_SUF!=='undefined' && CONJ_SUF[cj.id]) || '';
  if(cj.back && typeof CONJ_SUF!=='undefined' && CONJ_SUF[cj.id]) return sj.replace(/[。？]$/,'')+CONJ_SUF[cj.id]+'、'+main.replace(/[。]$/,'')+(c.q?'':'。');
  if(cj.id==='butalso'){ const m0=main.replace(/[。？]$/,'').replace(/だ$/,'な'); let s0=sj.replace(/[。？]$/,'').replace(/(.+)が(いる|ある)$/,'$1だ'); if(/だ$/.test(s0)) s0=s0.replace(/だ$/,'でもある'); else if(/い$/.test(s0)) s0=s0.replace(/い$/,'くもある'); else if(/する$/.test(s0)) s0=s0.replace(/する$/,'しもする'); else if(/[えけせてねへめれげぜでべぺいきしちにひみりぎじぢびぴ]る$/.test(s0)) s0=s0.replace(/る$/,'もする'); else if(/る$/.test(s0)) s0=s0.replace(/る$/,'りもする'); else s0=s0.replace(/[うくぐすつぬぶむ]$/,x=>({'う':'い','く':'き','ぐ':'ぎ','す':'し','つ':'ち','ぬ':'に','ぶ':'び','む':'み'})[x])+'もする'; return m0+(c.nonly?'だけでなく、':'。しかも、')+s0+'。'; }
  if(cj.back){ const lk={but:'けど、',and:'。そして、',so:'。だから、',or:'。それとも、'}[cj.id]; return main.replace(/？$/,'')+lk+sj+(c.q?'？':'。'); }
  if(cj.id==='ifx'){ const mj=main.replace(/[。？]$/,'').replace(/だ$/,'な'); return sj.replace(/[。？]$/,'')+'ら、'+mj+'のになあ'+(c.q?'？':'。'); }
  if(cj.id==='while') sj=sj.replace(/いる$/,'いる');
  return sj+suf+'、'+main+(c.q?'':'。');
 }
 return main+(/[。！？]$/.test(main)?'':'。');
}

// ================= COMPLETENESS =================
export function clauseComplete(c, kind){
 if(c.type==='exist'||c.type==='excl'||c.type==='hab') return !!c.thing;
 if(c.type==='imp') return !!c.pred && (!needsObj(c) || !!c.obj || (predV(c)&&predV(c).fr==='cl'&&!!c.subs.comp) || (isVc(c) && clauseComplete(c.subs.comp.c,'comp')));
 if(kind!=='rel' && kind!=='purpose' && kind!=='part' && kind!=='caus' && !(kind==='comp' && c.vform) && !(kind==='relo' && c.inf0) && !c.subj && !(c.passive&&c.obj) && !(c.q&&c.q.wh==='subj')) return false;
 if(!c.pred && !(c.q&&c.q.wh==='action')) return false;
 if(c.pred && c.pred.k==='s' && !predS(c) && !(c.q&&(c.q.wh==='state'||c.q.wh==='place'||c.q.wh==='manner'))) return false;
 if(predS(c) && c.q && c.q.wh==='state') return true;
 if(kind==='relo'){ return (!!c.subj||(c.inf0)) && !!predV(c) && (needsObj(c)||!!c.inf0); }
 if(kind==='main' && predV(c) && predV(c).caus && !(c.subs.caus && clauseComplete(c.subs.caus.c,'caus'))) return false;
 if(needsObj(c) && !(c.q&&(c.q.wh==='obj'||c.q.wh==='action'))){
  const v=predV(c); if(/^pm_about_/.test(String(c.manner||'')) && !(c.subs&&c.subs.comp) && (v.fr==='cl'||/^(know|ask|tell|hear|learn|read|write|see|forget|remember|teach|show|find|discuss)(_[a-z]+)?$/.test(String(v.id)))) return true; if(v.fr==='cl' || (c.subs && c.subs.comp && c.subs.comp.c.vform)) return !!(c.subs.comp && clauseComplete(c.subs.comp.c,'comp'));
  if(!c.obj) return false;
 }
 if((c.degree==='more'||c.degree==='as') && !c.than) return false;
 if(c.manner && (c.mdeg==='more'||c.mdeg==='as') && !c.mthan && !(c.mdeg==='more'&&c.mfree)) return false;
 return true;
}
export function sentenceComplete(S){
 const c=S.main; if(!clauseComplete(c,'main')) return false;
 for(const k in c.subs){ if(k==='comp') continue; const kk = (k==='rel' && c.subs.rel.gap==='o')?'relo':k; if(!clauseComplete(c.subs[k].c,kk)) return false; }
 return true;
}



// 助動詞×時制で感じる意味（チャンクの訳）
export function mustDuty(c){ const v=predV(c); return c.tense==='pres' && !!v && !v.stative && !(c.pred&&c.pred.k==='s') && !c.link; }
export function jconjTe(c,ctx,o){ const r=jaPred(Object.assign({},c,{modal:null,tense:'prog',neg:false}),ctx,o); return r.replace(/いる$/,''); }
export function jconjNa(c,ctx,o){ const r=jaPred(Object.assign({},c,{modal:null,tense:'pres',neg:true}),ctx,o); return r.replace(/ない$/,''); }
export function modalChunkJa(c){ const m=c.modal, t=c.tense, pst=t==='past', n=!!c.neg, first=c.subj==='p:i'||c.subj==='p:we';
 const T={
  might: (pst?(n?'ひょっとしたら〜しなかったかも':'ひょっとしたら〜したかも'):(n?'ひょっとしたら〜しないかも':'ひょっとしたら〜かも')),
  may:   (pst?(n?'〜しなかったかもしれない':'〜したかもしれない'):(n?'〜しないかもしれない':'〜かもしれない')),
  will:  (pst?(n?'〜しなかっただろう':'〜しただろう'):(first?(n?'〜しないつもり':'〜するつもり'):(n?'きっと〜しないだろう':'きっと〜だろう'))),
  must:  mustDuty(c)? (n?'〜してはいけない':'〜しなければならない') : (pst?(n?'〜しなかったにちがいない':'〜したにちがいない'):(n?'〜しないにちがいない':'きっと〜にちがいない')),
  can:   (pst?(n?'〜できなかった':'〜できた'):t==='fut'?(n?'〜できないだろう':'〜できるだろう'):(n?'〜できない':'〜できる')),
  could: (pst?(n?'〜できなかったかも':'〜できたかも'):(n?'〜できないかも':'〜できるかも')),
  should:(pst?(n?'〜しなければよかった':'〜すべきだった'):(n?'〜しないほうがいい':'〜したほうがいい'))};
 return T[m]||null; }

// as … as I can / as … as possible
export let SUBJ_PRON;
export function mthanSpecial(c){ if(c.mthan==='x:can'){ const pr=SUBJ_PRON[c.subj]||'they'; return pr+' '+(['past','pastprog','pastperf'].includes(c.tense)?'could':'can'); } return 'possible'; }

// 文のレベルで時制・助動詞をしぼる


/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_engine(){
OFFICIAL = {
people: [
 {id:'i',en:'I',obj:'me',ja:'わたし',e:'🙋',p:1,pl:0,pron:1},
 {id:'you',en:'you',obj:'you',ja:'あなた',e:'🧑',p:2,pl:0,pron:1},
 {id:'he',en:'he',obj:'him',ja:'かれ',e:'👱‍♂️',p:3,pl:0,pron:1},
 {id:'she',en:'she',obj:'her',ja:'かのじょ',e:'👱‍♀️',p:3,pl:0,pron:1},
 {id:'we',en:'we',obj:'us',ja:'わたしたち',e:'👫',p:1,pl:1,pron:1},
 {id:'it',en:'it',obj:'it',ja:'それ',e:'📦',p:3,pl:0,pron:1,thing:1},
 {id:'this',en:'this',obj:'this',ja:'これ',e:'👉',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'that',en:'that',obj:'that',ja:'それ',e:'👉',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'these',en:'these',obj:'these',ja:'これら',e:'👉',p:3,pl:1,pron:1,thing:1,typed:1},
 {id:'those',en:'those',obj:'those',ja:'それら',e:'👉',p:3,pl:1,pron:1,thing:1,typed:1},
 {id:'something',en:'something',obj:'something',ja:'何か',e:'❔',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'anything',en:'anything',obj:'anything',ja:'何か',e:'❔',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'everything',en:'everything',obj:'everything',ja:'ぜんぶ',e:'🌐',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'someone',en:'someone',obj:'someone',ja:'だれか',e:'🧑',p:3,pl:0,pron:1,typed:1},
 {id:'somebody',en:'somebody',obj:'somebody',ja:'だれか',e:'🧑',p:3,pl:0,pron:1,typed:1},
 {id:'anyone',en:'anyone',obj:'anyone',ja:'だれか',e:'🧑',p:3,pl:0,pron:1,typed:1},
 {id:'anybody',en:'anybody',obj:'anybody',ja:'だれか',e:'🧑',p:3,pl:0,pron:1,typed:1},
 {id:'everyone',en:'everyone',obj:'everyone',ja:'みんな',e:'👥',p:3,pl:0,pron:1,typed:1},
 {id:'everybody',en:'everybody',obj:'everybody',ja:'みんな',e:'👥',p:3,pl:0,pron:1,typed:1},
 {id:'someone_else',en:'someone else',obj:'someone else',ja:'だれか他の人',e:'🧑',p:3,pl:0,pron:1,typed:1},
 {id:'somebody_else',en:'somebody else',obj:'somebody else',ja:'だれか他の人',e:'🧑',p:3,pl:0,pron:1,typed:1},
 {id:'anyone_else',en:'anyone else',obj:'anyone else',ja:'ほかのだれか',e:'🧑',p:3,pl:0,pron:1,typed:1},
 {id:'anybody_else',en:'anybody else',obj:'anybody else',ja:'ほかのだれか',e:'🧑',p:3,pl:0,pron:1,typed:1},
 {id:'everyone_else',en:'everyone else',obj:'everyone else',ja:'ほかのみんな',e:'👥',p:3,pl:0,pron:1,typed:1},
 {id:'everybody_else',en:'everybody else',obj:'everybody else',ja:'ほかのみんな',e:'👥',p:3,pl:0,pron:1,typed:1},
 {id:'something_else',en:'something else',obj:'something else',ja:'ほかの何か',e:'❔',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'anything_else',en:'anything else',obj:'anything else',ja:'ほかの何か',e:'❔',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'everything_else',en:'everything else',obj:'everything else',ja:'ほかのぜんぶ',e:'🌐',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'nothing_else',en:'nothing else',obj:'nothing else',ja:'ほかの何も',e:'❔',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'they',en:'they',obj:'them',ja:'かれら',e:'👨‍👩‍👧',p:3,pl:1,pron:1},
 {id:'this_one',en:'this one',obj:'this one',ja:'これ',e:'👉',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'that_one',en:'that one',obj:'that one',ja:'あれ',e:'👉',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'tomorrow',en:'tomorrow',obj:'tomorrow',ja:'明日',e:'📅',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'today',en:'today',obj:'today',ja:'今日',e:'📅',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'tonight',en:'tonight',obj:'tonight',ja:'今夜',e:'🌙',p:3,pl:0,pron:1,thing:1,typed:1},
 {id:'myself',en:'myself',obj:'myself',ja:'自分自身',e:'🪞',p:3,pl:0,pron:1,refl:1,typed:1},
 {id:'yourself',en:'yourself',obj:'yourself',ja:'自分自身',e:'🪞',p:3,pl:0,pron:1,refl:1,typed:1},
 {id:'himself',en:'himself',obj:'himself',ja:'自分自身',e:'🪞',p:3,pl:0,pron:1,refl:1,typed:1},
 {id:'herself',en:'herself',obj:'herself',ja:'自分自身',e:'🪞',p:3,pl:0,pron:1,refl:1,typed:1},
 {id:'itself',en:'itself',obj:'itself',ja:'自分自身',e:'🪞',p:3,pl:0,pron:1,refl:1,typed:1},
 {id:'ourselves',en:'ourselves',obj:'ourselves',ja:'自分自身',e:'🪞',p:3,pl:0,pron:1,refl:1,typed:1},
 {id:'themselves',en:'themselves',obj:'themselves',ja:'自分自身',e:'🪞',p:3,pl:0,pron:1,refl:1,typed:1},
 {id:'ken',en:'Ken',ja:'ケン',e:'🧒',p:3,pl:0},
 {id:'mika',en:'Mika',ja:'ミカ',e:'👧',p:3,pl:0},
 {id:'mom',en:'my mom',ja:'お母さん',e:'👩',p:3,pl:0},
 {id:'dad',en:'my dad',ja:'お父さん',e:'👨',p:3,pl:0},
 {id:'grandma',en:'my grandma',ja:'おばあちゃん',e:'👵',p:3,pl:0},
 {id:'teacher',en:'the teacher',ja:'先生',e:'🧑‍🏫',p:3,pl:0},
 {id:'boy',en:'the boy',ja:'男の子',e:'👦',p:3,pl:0},
 {id:'girl',en:'the girl',ja:'女の子',e:'👧🏻',p:3,pl:0},
 {id:'baby',en:'the baby',ja:'赤ちゃん',e:'👶',p:3,pl:0},
 {id:'friends',en:'my friends',ja:'友だち',e:'👭',p:3,pl:1},
 {id:'students',en:'the students',ja:'生徒たち',e:'🧑‍🎓',p:3,pl:1},
 {id:'dog',en:'the dog',ja:'犬',e:'🐕',p:3,pl:0,animal:1},
 {id:'cat',en:'the cat',ja:'ねこ',e:'🐈',p:3,pl:0,animal:1},
 {id:'bird',en:'the bird',ja:'鳥',e:'🐦',p:3,pl:0,animal:1},
 {id:'rabbit',en:'the rabbit',ja:'うさぎ',e:'🐇',p:3,pl:0,animal:1},
 {id:'horse',en:'the horse',ja:'馬',e:'🐴',p:3,pl:0,animal:1},
 {id:'robot',en:'the robot',ja:'ロボット',e:'🤖',p:3,pl:0,thing:1},
],
things: [
 {id:'apple',en:'an apple',ja:'りんご',e:'🍎',t:['food']},
 {id:'banana',en:'a banana',ja:'バナナ',e:'🍌',t:['food']},
 {id:'bread',en:'bread',ja:'パン',e:'🍞',t:['food']},
 {id:'cake',en:'a cake',ja:'ケーキ',e:'🎂',t:['food','make']},
 {id:'onigiri',en:'rice balls',ja:'おにぎり',e:'🍙',t:['food','make'],pl:1},
 {id:'ramen',en:'ramen',ja:'ラーメン',e:'🍜',t:['food']},
 {id:'curry',en:'curry',ja:'カレー',e:'🍛',t:['food','make']},
 {id:'sandwich',en:'a sandwich',ja:'サンドイッチ',e:'🥪',t:['food','make']},
 {id:'pizza',en:'pizza',ja:'ピザ',e:'🍕',t:['food','make']},
 {id:'water',en:'water',ja:'水',e:'💧',t:['drink']},
 {id:'milk',en:'milk',ja:'牛乳',e:'🥛',t:['drink']},
 {id:'coffee',en:'coffee',ja:'コーヒー',e:'☕',t:['drink','make']},
 {id:'juice',en:'orange juice',ja:'オレンジジュース',e:'🧃',t:['drink']},
 {id:'tea',en:'tea',ja:'お茶',e:'🍵',t:['drink','make']},
 {id:'book',en:'a book',ja:'本',e:'📖',t:['read','thing']},
 {id:'comic',en:'a comic',ja:'まんが',e:'📚',t:['read','thing']},
 {id:'news',en:'the newspaper',ja:'新聞',e:'📰',t:['read','thing']},
 {id:'letter',en:'a letter',ja:'手紙',e:'✉️',t:['read','write','thing']},
 {id:'email',en:'an email',ja:'メール',e:'📧',t:['read','write']},
 {id:'story',en:'a story',ja:'お話',e:'📝',t:['read','write','tell']},
 {id:'lunch',en:'lunch',ja:'ランチ',e:'🍱',t:['food']},
 {id:'cold',en:'a cold',ja:'風邪',e:'🤧',t:['over']},
 {id:'shock',en:'the shock',ja:'ショック',e:'😵',t:['over']},
 {id:'party',en:'the party',ja:'パーティー',e:'🎉',t:['event']},
 {id:'trip',en:'the trip',ja:'旅行',e:'🧳',t:['event']},
 {id:'meeting',en:'the meeting',ja:'会議',e:'📅',t:['event']},
 {id:'light',en:'the light',ja:'電気',e:'💡',t:['device']},
 {id:'offer',en:'the offer',ja:'申し出',e:'📨',t:['offer']},
 {id:'invitation',en:'the invitation',ja:'招待',e:'💌',t:['offer','event']},
 {id:'word',en:'the word',ja:'その単語',e:'🔤',t:['word']},
 {id:'fire',en:'the fire',ja:'火',e:'🔥',t:['fire']},
 {id:'noise',en:'the noise',ja:'騒音',e:'📢',t:['bear']},
 {id:'butterfly',en:'a butterfly',ja:'チョウ',e:'🦋',t:['change','see']},
 {id:'frog',en:'a frog',ja:'カエル',e:'🐸',t:['change','see']},
 {id:'secret',en:'a secret',ja:'ひみつ',e:'🤫',t:['tell']},
 {id:'joke',en:'a joke',ja:'じょうだん',e:'😆',t:['tell']},
 {id:'truth',en:'the truth',ja:'本当のこと',e:'💯',t:['tell']},
 {id:'name',en:'my name',ja:'名前',e:'✍️',t:['write']},
 {id:'tv',en:'the TV',ja:'テレビ',e:'📺',t:['watch','device']},
 {id:'movie',en:'a movie',ja:'映画',e:'🎬',t:['watch']},
 {id:'stars',en:'the stars',ja:'星',e:'✨',t:['see'],pl:1},
 {id:'soccer',en:'soccer',ja:'サッカー',e:'⚽',t:['sport','watch']},
 {id:'tennis',en:'tennis',ja:'テニス',e:'🎾',t:['sport']},
 {id:'baseball',en:'baseball',ja:'野球',e:'⚾',t:['sport','watch']},
 {id:'basketball',en:'basketball',ja:'バスケ',e:'🏀',t:['sport']},
 {id:'piano',en:'the piano',ja:'ピアノ',e:'🎹',t:['instr']},
 {id:'guitar',en:'the guitar',ja:'ギター',e:'🎸',t:['instr']},
 {id:'games',en:'video games',ja:'ゲーム',e:'🎮',t:['game'],pl:1},
 {id:'cards',en:'cards',ja:'トランプ',e:'🃏',t:['game'],pl:1},
 {id:'music',en:'music',ja:'音楽',e:'🎵',t:['music']},
 {id:'song',en:'a song',ja:'歌',e:'🎤',t:['song','music','write']},
 {id:'radio',en:'the radio',ja:'ラジオ',e:'📻',t:['music','thing','device']},
 {id:'english',en:'English',ja:'英語',e:'🔤',t:['lang']},
 {id:'math',en:'math',ja:'数学',e:'➗',t:['lang']},
 {id:'homework',en:'homework',ja:'宿題',e:'📓',t:['homework']},
 {id:'ball',en:'a ball',ja:'ボール',e:'🏐',t:['ball','thing']},
 {id:'bike',en:'a bike',ja:'自転車',e:'🚲',t:['ride','thing']},
 {id:'bag',en:'a bag',ja:'かばん',e:'👜',t:['thing']},
 {id:'umbrella',en:'an umbrella',ja:'かさ',e:'☂️',t:['thing']},
 {id:'phone',en:'my phone',ja:'スマホ',e:'📱',t:['thing']},
 {id:'key',en:'the key',ja:'かぎ',e:'🔑',t:['thing']},
 {id:'camera',en:'a camera',ja:'カメラ',e:'📷',t:['thing']},
 {id:'picture',en:'a picture',ja:'絵',e:'🖼️',t:['draw','thing']},
 {id:'photo',en:'a photo',ja:'写真',e:'📸',t:['photo']},
 {id:'door',en:'the door',ja:'ドア',e:'🚪',t:['door']},
 {id:'window',en:'the window',ja:'窓',e:'🪟',t:['door']},
 {id:'box',en:'the box',ja:'箱',e:'📦',t:['door','thing']},
 {id:'house',en:'the house',ja:'家',e:'🏠',t:['thing','door']},
 {id:'room',en:'my room',ja:'部屋',e:'🛏️',t:['clean']},
 {id:'dishes',en:'the dishes',ja:'お皿',e:'🍽️',t:['wash'],pl:1},
 {id:'car',en:'the car',ja:'車',e:'🚗',t:['wash','thing','car']},
 {id:'flowers',en:'flowers',ja:'花',e:'💐',t:['thing','draw','see','plant'],pl:1},
 {id:'present',en:'a present',ja:'プレゼント',e:'🎁',t:['thing','present']},
 {id:'mine',en:'mine',ja:'わたしのもの',e:'👆',t:['thing','food','drink','read','ride','wear','draw','present'],poss:1},
 {id:'yours',en:'yours',ja:'あなたのもの',e:'👉',t:['thing','food','drink','read','ride','wear','draw','present'],poss:1},
 {id:'hisp',en:'his',ja:'かれのもの',e:'👦',t:['thing','food','drink','read','ride','wear','draw','present'],poss:1},
 {id:'hers',en:'hers',ja:'かのじょのもの',e:'👧',t:['thing','food','drink','read','ride','wear','draw','present'],poss:1},
 {id:'ours',en:'ours',ja:'わたしたちのもの',e:'👫',t:['thing','food','drink','read','ride','wear','draw','present'],poss:1},
 {id:'theirs',en:'theirs',ja:'かれらのもの',e:'👥',t:['thing','food','drink','read','ride','wear','draw','present'],poss:1},
 {id:'hat',en:'a hat',ja:'ぼうし',e:'👒',t:['thing','wear','whead']},
 {id:'cookie',en:'a cookie',ja:'クッキー',e:'🍪',t:['food','make']},
 {id:'egg',en:'an egg',ja:'たまご',e:'🥚',t:['food','cut']},
 {id:'soup',en:'soup',ja:'スープ',e:'🍲',t:['food','make']},
 {id:'pen',en:'a pen',ja:'ペン',e:'🖊️',t:['thing']},
 {id:'notebook',en:'a notebook',ja:'ノート',e:'📓',t:['thing','write']},
 {id:'computer',en:'the computer',ja:'パソコン',e:'💻',t:['thing','device']},
 {id:'toy',en:'a toy',ja:'おもちゃ',e:'🧸',t:['thing','game','toy']},
 {id:'map',en:'a map',ja:'地図',e:'🗺️',t:['read','thing','draw']},
 {id:'shirt',en:'a shirt',ja:'シャツ',e:'👕',t:['wear','thing','wash']},
 {id:'jacket',en:'a jacket',ja:'ジャケット',e:'🧥',t:['wear','thing']},
 {id:'shoes',en:'shoes',ja:'くつ',e:'👟',t:['wear','wfoot','thing','wash'],pl:1},
 {id:'tree',en:'a tree',ja:'木',e:'🌳',t:['climb','plant','see','draw']},
 {id:'mountain',en:'the mountain',ja:'山',e:'⛰️',t:['climb','see','draw']},
 {id:'sandcastle',en:'a sandcastle',ja:'砂のお城',e:'🏰',t:['build','make']},
 {id:'snowman',en:'a snowman',ja:'雪だるま',e:'⛄',t:['build','make']},
 {id:'house',en:'a house',ja:'家',e:'🏠',t:['build','see','draw','clean']},
 {id:'bus',en:'the bus',ja:'バス',e:'🚌',t:['ride','car']},
 {id:'train',en:'the train',ja:'電車',e:'🚆',t:['ride','see']},

],
verbs: [
 // self (intransitive)
 {id:'run',en:'run',past:'ran',pp:'run',dbl:1,ja:'走る',jt:'g',fr:'intr',e:'🏃',an:'run'},
 {id:'walk',en:'walk',ja:'歩く',jt:'g',fr:'intr',e:'🚶',an:'walk'},
 {id:'sleep',en:'sleep',past:'slept',pp:'slept',ja:'寝る',jt:'i',fr:'intr',e:'😴',an:'sleep'},
 {id:'swim',en:'swim',past:'swam',pp:'swum',dbl:1,ja:'泳ぐ',jt:'g',fr:'intr',e:'🏊',an:'swim'},
 {id:'dance',en:'dance',ja:'踊る',jt:'g',fr:'intr',e:'💃',an:'dance'},
 {id:'laugh',en:'laugh',ja:'笑う',jt:'g',fr:'intr',e:'😂',an:'shake'},
 {id:'cry',en:'cry',ja:'泣く',jt:'g',fr:'intr',e:'😭',an:'shake'},
 {id:'jump',en:'jump',ja:'ジャンプする',jt:'s',fr:'intr',e:'🦘',an:'jump'},
 {id:'sit',pv:{base:'sit',p:'down'},en:'sit',tail:'down',past:'sat',pp:'sat',dbl:1,ja:'座る',jt:'g',fr:'intr',e:'🪑',an:'sit'},
 {id:'stand',pv:{base:'stand',p:'up'},en:'stand',tail:'up',past:'stood',pp:'stood',ja:'立つ',jt:'g',fr:'intr',e:'🧍',an:'jump'},
 {id:'wake',pv:{base:'wake',p:'up'},en:'wake',tail:'up',past:'woke',pp:'woken',ja:'起きる',jt:'i',fr:'intr',e:'⏰',an:'jump'},
 {id:'smile',en:'smile',ja:'ほほえむ',jt:'g',fr:'intr',e:'🙂',an:'bob'},
 {id:'rest',en:'rest',ja:'休む',jt:'g',fr:'intr',e:'🛋️',an:'sit'},
 {id:'work',en:'work',ja:'働く',jt:'g',fr:'intr',e:'💼',an:'bob'},
 {id:'fly',en:'fly',past:'flew',pp:'flown',ja:'飛ぶ',jt:'g',fr:'intr',e:'🪽',an:'fly'},
 {id:'go',en:'go',past:'went',pp:'gone',s3:'goes',ja:'行く',jt:'g',fr:'intr',e:'➡️',an:'walk',motion:1},
 {id:'come',en:'come',past:'came',pp:'come',ja:'来る',jt:'k',fr:'intr',e:'⬅️',an:'walk',motion:1},
 {id:'talk',en:'talk',ja:'話す',jt:'g',fr:'intr',e:'💬',an:'bob'},
 {id:'shout',en:'shout',ja:'叫ぶ',jt:'g',fr:'intr',e:'📢',an:'shake'},
 {id:'fall',pv:{base:'fall',p:'down'},en:'fall',tail:'down',past:'fell',pp:'fallen',ja:'転ぶ',jt:'g',fr:'intr',e:'🤕',an:'sit'},
 {id:'hide',en:'hide',past:'hid',pp:'hidden',ja:'隠れる',jt:'i',fr:'intr',e:'🙈',an:'sit'},
 {id:'arrive',en:'arrive',ja:'着く',jt:'g',fr:'intr',e:'🏁',an:'walk'},
 {id:'get_arrive',en:'get',past:'got',pp:'gotten',ja:'着く',jt:'g',fr:'intr',motion:1,e:'🏁',an:'walk',typed:1},
 {id:'grow',pv:{base:'grow',p:'up'},en:'grow',tail:'up',past:'grew',pp:'grown',ja:'大きくなる',jt:'g',fr:'intr',e:'🌱',an:'jump'},
 {id:'win',en:'win',past:'won',pp:'won',dbl:1,ja:'勝つ',jt:'g',fr:'intr',e:'🏆',an:'jump'},
 {id:'relax',en:'relax',ja:'のんびりする',jt:'s',fr:'intr',e:'😌',an:'sit'},
 {id:'hurry',en:'hurry',ja:'急ぐ',jt:'g',fr:'intr',e:'⏩',an:'run'},
 {id:'travel',en:'travel',ja:'旅行する',jt:'s',fr:'intr',e:'🧳',an:'walk',motion:1},
 {id:'shop',en:'shop',dbl:1,ja:'買い物する',jt:'s',fr:'intr',e:'🛍️',an:'walk'},
 {id:'climb',en:'climb',ja:'登る',jt:'g',fr:'both',t:['climb'],e:'🧗',an:'jump'},
 {id:'practice',en:'practice',ja:'練習する',jt:'s',fr:'both',t:['sport','instr'],e:'🏋️',an:'jump'},
 {id:'hangout',pv:{base:'hang',p:'out'},en:'hang',tail:'out',past:'hung',pp:'hung',ja:'つるむ',jt:'g',fr:'intr',e:'🛹',an:'dance',casual:1},
 {id:'chill',en:'chill',ja:'まったりする',jt:'s',fr:'intr',e:'🧃',an:'sit',casual:1},
 // both
 {id:'eat',en:'eat',past:'ate',pp:'eaten',ja:'食べる',jt:'i',fr:'both',t:['food'],e:'🍴',an:'bob'},
 {id:'drink',en:'drink',past:'drank',pp:'drunk',ja:'飲む',jt:'g',fr:'both',t:['drink'],e:'🥤',an:'bob'},
 {id:'read',en:'read',past:'read',pp:'read',ja:'読む',jt:'g',fr:'both',t:['read'],e:'📖',an:'bob'},
 {id:'write',en:'write',dt:'to',past:'wrote',pp:'written',ja:'書く',jt:'g',fr:'both',t:['write'],e:'✏️',an:'bob'},
 {id:'sing',en:'sing',dt:'for',past:'sang',pp:'sung',ja:'歌う',jt:'g',fr:'both',t:['song'],e:'🎤',an:'dance'},
 {id:'draw',en:'draw',past:'drew',pp:'drawn',ja:'描く',jt:'g',fr:'both',t:['draw'],e:'🖍️',an:'bob'},
 {id:'cook',en:'cook',dt:'for',ja:'料理する',jt:'s',fr:'both',t:['food'],e:'🍳',an:'bob',jaBy:{make:['作る','g']}},
 {id:'study',en:'study',ja:'勉強する',jt:'s',fr:'both',t:['lang'],e:'📚',an:'bob'},
 {id:'play',en:'play',ja:'遊ぶ',jt:'g',fr:'both',t:['sport','instr','game'],e:'🤸',an:'dance',jaBy:{sport:['する','s'],game:['する','s'],instr:['ひく','g']}},
 {id:'clean',en:'clean',ja:'そうじする',jt:'s',fr:'both',t:['clean'],e:'🧹',an:'bob'},
 {id:'listen',en:'listen',prep:'to',ja:'聞く',jt:'g',fr:'both',t:['music','person','animal'],e:'👂',an:'bob'},
 {id:'look',en:'look',prep:'at',ja:'見る',jt:'i',fr:'both',t:['any'],e:'👀',an:'bob'},
 {id:'wait',en:'wait',prep:'for',ja:'待つ',jt:'g',fr:'both',t:['person'],e:'⏳',an:'bob'},
 // other (transitive)
 {id:'like',en:'like',ja:'好き',jt:'na',jaAdj:1,part:'が',fr:'tr',t:['any'],e:'❤️',an:'bob',stative:1,nopass:1},
 {id:'love',en:'love',ja:'大好き',jt:'na',jaAdj:1,part:'が',fr:'tr',t:['any'],e:'😍',an:'bob',stative:1},
 {id:'have',en:'have',past:'had',pp:'had',s3:'has',ja:'持つ',jt:'g',fr:'tr',t:['thing','food'],e:'🫴',an:'bob',stative:1,nopass:1},
 {id:'need',en:'need',ja:'必要',jt:'na',jaAdj:1,part:'が',fr:'tr',t:['thing','food','drink','person'],e:'🙏',an:'bob',stative:1,nopass:1},
 {id:'buy',en:'buy',dt:'for',past:'bought',pp:'bought',ja:'買う',jt:'g',fr:'tr',t:['food','drink','thing','read'],e:'🛒',an:'bob'},
 {id:'make',en:'make',dt:'for',past:'made',pp:'made',ja:'作る',jt:'g',fr:'tr',t:['make'],e:'🔨',an:'bob'},
 {id:'watch',en:'watch',ja:'見る',jt:'i',fr:'tr',t:['watch','person','animal'],e:'📺',an:'bob'},
 {id:'see',en:'see',past:'saw',pp:'seen',ja:'見る',jt:'i',fr:'tr',t:['any'],e:'👁️',an:'bob',stative:1},
 {id:'open',en:'open',ja:'開ける',jt:'i',fr:'tr',t:['door'],e:'🔓',an:'bob'},
 {id:'close',en:'close',ja:'閉める',jt:'i',fr:'tr',t:['door'],e:'🔒',an:'bob'},
 {id:'wash',en:'wash',ja:'洗う',jt:'g',fr:'both',t:['wash'],e:'🧽',an:'shake'},
 {id:'use',en:'use',ja:'使う',jt:'g',fr:'tr',t:['thing'],e:'🔧',an:'bob'},
 {id:'find',en:'find',past:'found',pp:'found',ja:'見つける',jt:'i',fr:'tr',t:['thing','person'],e:'🔍',an:'jump'},
 {id:'lose',en:'lose',past:'lost',pp:'lost',ja:'なくす',jt:'g',fr:'tr',t:['thing'],e:'😱',an:'shake'},
 {id:'carry',en:'carry',ja:'運ぶ',jt:'g',fr:'tr',t:['thing'],e:'📦',an:'walk'},
 {id:'take',en:'take',past:'took',pp:'taken',ja:'撮る',jt:'g',fr:'tr',t:['photo'],e:'📸',an:'bob'},
 {id:'kick',en:'kick',ja:'ける',jt:'g',fr:'tr',t:['ball'],e:'🦵',an:'jump'},
 {id:'throw',en:'throw',past:'threw',pp:'thrown',ja:'投げる',jt:'i',fr:'tr',t:['ball'],e:'🤾',an:'jump'},
 {id:'catch',en:'catch',past:'caught',pp:'caught',ja:'つかまえる',jt:'i',fr:'tr',t:['ball','animal'],e:'🧤',an:'jump'},
 {id:'ride',en:'ride',past:'rode',pp:'ridden',ja:'乗る',jt:'g',part:'に',fr:'tr',t:['ride'],e:'🚲',an:'walk',nopass:1},
 {id:'help',en:'help',ja:'手伝う',jt:'g',fr:'both',t:['person'],e:'🤝',an:'bob'},
 {id:'call',en:'call',ja:'電話する',jt:'s',part:'に',fr:'tr',t:['person'],e:'📞',an:'bob'},
 {id:'meet',en:'meet',past:'met',pp:'met',ja:'会う',jt:'g',part:'に',fr:'both',t:['person'],e:'👋',an:'bob',nopass:1},
 {id:'hug',en:'hug',dbl:1,ja:'だきしめる',jt:'i',fr:'tr',t:['person','animal'],e:'🤗',an:'bob'},
 {id:'chase',en:'chase',ja:'追いかける',jt:'i',fr:'tr',t:['person','animal','ball'],e:'💨',an:'run'},
 {id:'teach',en:'teach',dt:'to',past:'taught',pp:'taught',ja:'教える',jt:'i',fr:'both',t:['lang','sport'],e:'🧑‍🏫',an:'bob'},
 {id:'visit',en:'visit',ja:'たずねる',jt:'i',fr:'tr',t:['person'],e:'🏠',an:'walk'},
 {id:'do',en:'do',past:'did',pp:'done',s3:'does',ja:'やる',jt:'g',fr:'tr',t:['homework'],e:'✅',an:'bob'},
 {id:'bring',en:'bring',dt:'to',past:'brought',pp:'brought',ja:'持ってくる',jt:'k',fr:'tr',t:['thing','food','drink'],jaBy:{person:['連れてくる','k'],animal:['連れてくる','k']},e:'🎁',an:'walk'},
 {id:'send',en:'send',dt:'to',past:'sent',pp:'sent',ja:'送る',jt:'g',fr:'tr',t:['write','photo'],e:'📨',an:'bob'},
 {id:'fix',en:'fix',ja:'直す',jt:'g',fr:'tr',t:['ride','thing','car'],e:'🔧',an:'bob'},
 {id:'drive',en:'drive',past:'drove',pp:'driven',ja:'運転する',jt:'s',fr:'both',t:['car'],e:'🚘',an:'bob'},
 {id:'forget',en:'forget',past:'forgot',pp:'forgotten',dbl:1,ja:'忘れる',jt:'i',fr:'tr',t:['thing','homework'],e:'🤦',an:'shake'},
 {id:'remember',en:'remember',ja:'覚えている',jt:'i',fr:'tr',t:['any'],e:'🧠',an:'bob',stative:1},
 {id:'enjoy',en:'enjoy',ja:'楽しむ',jt:'g',fr:'tr',t:['sport','game','music','watch','food'],e:'🥳',an:'dance'},
 {id:'answer',en:'answer',ja:'答える',jt:'i',part:'に',fr:'tr',t:['person'],e:'🙋',an:'bob'},
 {id:'ask',en:'ask',ja:'たずねる',jt:'i',part:'に',fr:'tr',t:['person'],e:'🙋‍♀️',an:'bob'},
 {id:'invite',en:'invite',ja:'招待する',jt:'s',fr:'tr',t:['person'],e:'💌',an:'bob'},
 {id:'cut',en:'cut',past:'cut',pp:'cut',dbl:1,ja:'切る',jt:'g',fr:'tr',t:['food','cut'],e:'✂️',an:'bob'},
 {id:'feed',en:'feed',past:'fed',pp:'fed',ja:'えさをあげる',jt:'i',part:'に',fr:'tr',t:['animal'],jaBy:{person:['ご飯をあげる','i']},e:'🦴',an:'bob'},
 {id:'wear',en:'wear',past:'wore',pp:'worn',ja:'着る',jt:'i',fr:'tr',t:['wear'],e:'👔',an:'bob',stative:1,jaBy:{whead:['かぶる','g'],wfoot:['はく','g']}},
 {id:'plant',en:'plant',ja:'植える',jt:'i',fr:'tr',t:['plant'],e:'🌷',an:'bob'},
 {id:'paint',en:'paint',ja:'ぬる',jt:'g',fr:'both',t:['draw','door','car'],e:'🎨',an:'bob',jaBy:{draw:['描く','g']}},
 {id:'build',en:'build',past:'built',pp:'built',ja:'作る',jt:'g',fr:'tr',t:['build'],e:'🏗️',an:'bob'},
 {id:'sell',en:'sell',past:'sold',pp:'sold',ja:'売る',jt:'g',fr:'tr',t:['thing','food'],e:'💰',an:'bob'},
 {id:'borrow',en:'borrow',ja:'借りる',jt:'i',fr:'tr',t:['thing','read'],e:'🤲',an:'bob'},
 {id:'push',en:'push',ja:'押す',jt:'g',fr:'tr',t:['door','thing','person'],e:'👐',an:'bob'},
 {id:'pull',en:'pull',ja:'引く',jt:'g',fr:'tr',t:['door','thing'],e:'🪢',an:'bob'},
 {id:'protect',en:'protect',ja:'守る',jt:'g',fr:'tr',t:['person','animal'],e:'🛡️',an:'bob'},
 {id:'follow',en:'follow',ja:'ついていく',jt:'g',part:'に',fr:'tr',t:['person','animal'],e:'👣',an:'walk'},
 {id:'check',en:'check',ja:'確認する',jt:'s',fr:'tr',t:['thing','homework','write'],e:'☑️',an:'bob'},
 {id:'give',en:'give',past:'gave',pp:'given',ja:'あげる',jt:'i',fr:'tr',dt:'to',t:['thing','food','drink','read','present'],e:'🎁',an:'reach',nopass:1},
 {id:'show',en:'show',past:'showed',pp:'shown',ja:'見せる',jt:'i',fr:'tr',dt:'to',t:['thing','read','photo','draw'],e:'🖐️',an:'reach',nopass:1},
 {id:'tell',en:'tell',past:'told',pp:'told',ja:'話す',jt:'g',fr:'tr',dt:'to',t:['tell'],e:'🗨️',an:'talk',nopass:1},
 {id:'lend',en:'lend',past:'lent',pp:'lent',ja:'貸す',jt:'g',fr:'tr',dt:'to',t:['thing','read','ride'],e:'🤝',an:'reach',nopass:1},
 {id:'pass',en:'pass',ja:'渡す',jt:'g',fr:'tr',dt:'to',t:['thing','food','drink','read'],e:'🫴',an:'reach',nopass:1},
 {id:'grab',en:'grab',dbl:1,ja:'さっと食べる',jt:'i',fr:'tr',t:['food','drink'],e:'🥡',an:'hold',casual:1},
 {id:'text',en:'text',ja:'メッセージを送る',jt:'g',part:'に',fr:'tr',t:['person'],e:'📲',an:'hold',casual:1},
 // clause verbs
 {id:'think',en:'think',past:'thought',pp:'thought',ja:'思う',jt:'g',fr:'cl',e:'💭',an:'bob',stative:1,clj:'と'},
 {id:'guess',en:'guess',ja:'思う',jt:'g',fr:'cl',e:'🤔',an:'bob',stative:1,clj:'かなと'},
 {id:'suppose',en:'suppose',ja:'思う',jt:'g',fr:'cl',e:'🤔',an:'bob',stative:1,clj:'と'},
 {id:'believe_c',en:'believe',ja:'信じる',jt:'i',fr:'cl',e:'🙏',an:'bob',stative:1,clj:'と'},
 {id:'wonder',en:'wonder',ja:'思う',jt:'g',fr:'cl',e:'🤔',an:'think',stative:1,clj:'と',clq:'のかなと',whOnly:1},
 {id:'know',en:'know',past:'knew',pp:'known',ja:'知る',jt:'g',fr:'cl',e:'💡',an:'bob',stative:1,teiru:1,clj:'と'},
 {id:'hope',en:'hope',ja:'願う',jt:'g',fr:'cl',e:'🙏',an:'bob',stative:1,clj:'と'},
 {id:'wish',en:'wish',ja:'願う',jt:'g',fr:'cl',e:'🌠',an:'bob',stative:1,clj:'と'},
 {id:'tell_c',en:'tell',past:'told',pp:'told',dt:'to',ja:'言う',jt:'g',fr:'cl',clj:'と',e:'🗨️',an:'talk',nopass:1,typed:1,hidden:1},
 {id:'ask_c',en:'ask',dt:'to',ja:'たずねる',jt:'i',fr:'cl',whOnly:1,clq:'か',e:'🙋',an:'bob',nopass:1,typed:1,hidden:1},
 {id:'say',en:'say',past:'said',pp:'said',ja:'言う',jt:'g',fr:'cl',e:'🗣️',an:'bob',clj:'と'},
 {id:'want_o',en:'want',ja:'ほしい',jt:'i',jaAdj:1,jaAdjT:'i',part:'が',fr:'tr',t:['any'],e:'💭',an:'bob',stative:1,nopass:1},
 {id:'know_o',en:'know',past:'knew',pp:'known',ja:'知る',jt:'g',fr:'tr',t:['any'],e:'💡',an:'bob',stative:1,teiru:1,hidden:1},
 {id:'say_o',en:'say',past:'said',pp:'said',ja:'言う',jt:'g',fr:'tr',t:['any'],e:'🗣️',an:'bob',hidden:1},
 {id:'believe_o',en:'believe',ja:'信じる',jt:'i',fr:'tr',t:['any'],e:'🙏',an:'bob',stative:1,hidden:1},
 {id:'guess_o',en:'guess',ja:'言い当てる',jt:'i',fr:'tr',t:['any'],e:'🤔',an:'bob',hidden:1},
 {id:'realize_o',en:'realize',ja:'気づく',jt:'g',fr:'tr',t:['any'],e:'💡',an:'bob',hidden:1},
],
states: [
 {id:'happy',en:'happy',ja:'うれしい',jt:'i',e:'😊',comp:'happier',sup:'happiest'},
 {id:'sad',en:'sad',ja:'かなしい',jt:'i',e:'😢',comp:'sadder',sup:'saddest'},
 {id:'sleepy',en:'sleepy',ja:'ねむい',jt:'i',e:'🥱',comp:'sleepier',sup:'sleepiest'},
 {id:'hungry',en:'hungry',ja:'はらぺこ',jt:'na',e:'🤤',comp:'hungrier',sup:'hungriest'},
 {id:'tired',en:'tired',ja:'つかれる',jt:'v',vt:'i',e:'😩',more:1},
 {id:'angry',en:'angry',ja:'怒る',jt:'v',vt:'g',e:'😠',comp:'angrier',sup:'angriest'},
 {id:'excited',en:'excited',ja:'わくわくする',jt:'v',vt:'s',e:'🤩',more:1},
 {id:'busy',en:'busy',ja:'いそがしい',jt:'i',e:'🌀',comp:'busier',sup:'busiest'},
 {id:'fine',en:'fine',ja:'元気',jt:'na',e:'💪',comp:'better',sup:'best'},
 {id:'okay',en:'okay',ja:'大丈夫',jt:'na',e:'👌'},
 {id:'alright',en:'alright',ja:'大丈夫',jt:'na',e:'👌'},
 {id:'sick',en:'sick',ja:'具合が悪い',jt:'i',e:'🤒',more:1},
 {id:'cold',en:'cold',ja:'寒い',jt:'i',e:'🥶'},
 {id:'hot',en:'hot',ja:'暑い',jt:'i',e:'🥵',comp:'hotter',sup:'hottest'},
 {id:'quiet',en:'quiet',ja:'静か',jt:'na',e:'🤫'},
 {id:'kind',en:'kind',ja:'やさしい',jt:'i',e:'🥰'},
 {id:'strong',en:'strong',ja:'強い',jt:'i',e:'🏋️'},
 {id:'tall',en:'tall',ja:'背が高い',jt:'i',e:'📏'},
 {id:'cute',en:'cute',ja:'かわいい',jt:'i',e:'🌸',comp:'cuter',sup:'cutest'},
 {id:'cool',en:'cool',ja:'かっこいい',jt:'i',e:'😎'},
 {id:'late',en:'late',ja:'遅刻',jt:'na',e:'⌛',comp:'later',sup:'latest'},
 {id:'shy',en:'shy',ja:'はずかしい',jt:'i',e:'😳',comp:'shyer',sup:'shyest'},
 {id:'brave',en:'brave',ja:'勇敢',jt:'na',e:'🦸',comp:'braver',sup:'bravest'},
 {id:'lonely',en:'lonely',ja:'さびしい',jt:'i',e:'🥺',comp:'lonelier',sup:'loneliest'},
 {id:'proud',en:'proud',ja:'誇らしい',jt:'i',e:'😤',comp:'prouder',sup:'proudest'},
 {id:'surprised',en:'surprised',ja:'びっくりする',jt:'v',vt:'s',e:'😲',more:1},
 {id:'scared',en:'scared',ja:'こわがる',jt:'v',vt:'g',e:'😨',more:1},
 {id:'bored',en:'bored',ja:'たいくつ',jt:'na',e:'😑',more:1},
 {id:'full',en:'full',ja:'おなかいっぱい',jt:'na',e:'😋',comp:'fuller',sup:'fullest'},
 {id:'thirsty',en:'thirsty',ja:'のどがかわく',jt:'v',vt:'g',e:'🫗',comp:'thirstier',sup:'thirstiest'},
 {id:'free',en:'free',ja:'ひま',jt:'na',e:'🆓',comp:'freer',sup:'freest'},
 {id:'smart',en:'smart',ja:'かしこい',jt:'i',e:'🤓',comp:'smarter',sup:'smartest'},
 {id:'funny',en:'funny',ja:'おもしろい',jt:'i',e:'🤡',comp:'funnier',sup:'funniest'},
 {id:'r_teacher',en:'a teacher',pl:'teachers',ja:'先生',jt:'na',e:'🧑‍🏫',noun:1},
 {id:'r_student',en:'a student',pl:'students',ja:'学生',jt:'na',e:'🎒',noun:1},
 {id:'r_doctor',en:'a doctor',pl:'doctors',ja:'医者',jt:'na',e:'🩺',noun:1},
 {id:'r_friend',en:'a friend',pl:'friends',ja:'友だち',jt:'na',e:'🤝',noun:1},
 {id:'r_nurse',en:'a nurse',pl:'nurses',ja:'看護師',jt:'na',e:'👩‍⚕️',noun:1},
 {id:'r_singer',en:'a singer',pl:'singers',ja:'歌手',jt:'na',e:'🎤',noun:1},
 {id:'r_player',en:'a soccer player',pl:'soccer players',ja:'サッカー選手',jt:'na',e:'⚽',noun:1},
 {id:'r_cook',en:'a cook',pl:'cooks',ja:'料理人',jt:'na',e:'👨‍🍳',noun:1},
 {id:'r_artist',en:'an artist',pl:'artists',ja:'画家',jt:'na',e:'🎨',noun:1},
 {id:'r_police',en:'a police officer',pl:'police officers',ja:'警察官',jt:'na',e:'👮',noun:1},
 {id:'r_pilot',en:'a pilot',pl:'pilots',ja:'パイロット',jt:'na',e:'👨‍✈️',noun:1},
 {id:'r_scientist',en:'a scientist',pl:'scientists',ja:'科学者',jt:'na',e:'🔬',noun:1},
 {id:'r_farmer',en:'a farmer',pl:'farmers',ja:'農家',jt:'na',e:'🧑‍🌾',noun:1},
 {id:'r_dancer',en:'a dancer',pl:'dancers',ja:'ダンサー',jt:'na',e:'💃',noun:1},
 {id:'r_hero',en:'a hero',pl:'heroes',ja:'ヒーロー',jt:'na',e:'🦸',noun:1},
 {id:'r_genius',en:'a genius',pl:'geniuses',ja:'天才',jt:'na',e:'🧠',noun:1},
 {id:'r_youtuber',en:'a YouTuber',pl:'YouTubers',ja:'ユーチューバー',jt:'na',e:'📹',noun:1,casual:1},
 {id:'r_pirateking',en:'the king of pirates',pl:'the kings of pirates',ja:'海賊王',jt:'na',e:'🏴‍☠️',noun:1,casual:1},
 {id:'rich',en:'rich',ja:'お金持ち',jt:'na',e:'💰',comp:'richer',sup:'richest'},
 {id:'famous',en:'famous',ja:'有名',jt:'na',e:'🌟',more:1},
 {id:'beautiful',en:'beautiful',ja:'きれい',jt:'na',e:'🌷',more:1},
 {id:'young',en:'young',ja:'若い',jt:'i',e:'🐣',comp:'younger',sup:'youngest'},
 {id:'popular',en:'popular',ja:'人気',jt:'na',e:'🎉',more:1},
 {id:'healthy',en:'healthy',ja:'健康',jt:'na',e:'🥗',comp:'healthier',sup:'healthiest'},
 {id:'awesome',en:'awesome',ja:'最高',jt:'na',e:'🤘',more:1,casual:1},
 {id:'chillA',en:'chill',ja:'落ち着いている',jt:'raw',e:'😎',comp:'chiller',sup:'chillest',casual:1},
 {id:'ready',en:'ready',ja:'準備ができている',jt:'raw',e:'👌',comp:'readier',sup:'readiest'},
],
manners: [
 {id:'intime',en:'in time',ja:'間に合うように',e:'⏰'},
 {id:'ontime',en:'on time',ja:'時間どおりに',e:'🕐'},
 {id:'fast',en:'fast',ja:'速く',e:'💨',an:'fast'},
 {id:'slowly',en:'slowly',ja:'ゆっくり',e:'🐢',an:'slow'},
 {id:'quietly',en:'quietly',ja:'静かに',e:'🤫'},
 {id:'loudly',en:'loudly',ja:'大きな声で',e:'📢'},
 {id:'happily',en:'happily',ja:'楽しそうに',e:'🎶'},
 {id:'carefully',en:'carefully',ja:'ていねいに',e:'🧐'},
 {id:'well',en:'well',ja:'じょうずに',e:'🌟'},
 {id:'hard',en:'hard',ja:'いっしょうけんめい',e:'🔥'},
 {id:'a_lot',en:'a lot',ja:'たくさん',e:'➕'},
 {id:'again',en:'again',ja:'もう一度',e:'🔁'},
 {id:'late_m',en:'late',ja:'おそく',e:'🌙'},
 {id:'early',en:'early',ja:'早く',e:'🌅'},
 {id:'anymore',en:'anymore',ja:'もう',e:'🚫',neg:1},
 {id:'nearby',en:'nearby',ja:'近くで',e:'📍'},
 {id:'closeby',en:'close by',ja:'近くで',e:'📍'},
 {id:'in_dark',en:'in the dark',ja:'くらやみで',e:'🌑'},
],
places: [
 {id:'here',en:'here',to:'here',ja:'ここで',jat:'ここへ',jn:'ここ',e:'📍',ring:'near'},
 {id:'there',en:'there',to:'there',ja:'あそこで',jat:'あそこへ',jn:'あそこ',e:'👉',ring:'far'},
 {id:'home',en:'at home',to:'home',ja:'家で',jat:'家へ',jn:'家',e:'🏠',bg:'home'},
 {id:'school',en:'at school',to:'to school',ja:'学校で',jat:'学校へ',jn:'学校',e:'🏫',bg:'school'},
 {id:'park',en:'in the park',to:'to the park',ja:'公園で',jat:'公園へ',jn:'公園',e:'🌳',bg:'park'},
 {id:'kitchen',en:'in the kitchen',to:'to the kitchen',ja:'台所で',jat:'台所へ',jn:'台所',e:'🍳',bg:'kitchen'},
 {id:'myroom',en:'in my room',to:'to my room',ja:'自分の部屋で',jat:'自分の部屋へ',jn:'自分の部屋',e:'🛏️',bg:'room'},
 {id:'station',en:'at the station',to:'to the station',ja:'駅で',jat:'駅へ',jn:'駅',e:'🚉',bg:'station'},
 {id:'library',en:'in the library',to:'to the library',ja:'図書館で',jat:'図書館へ',jn:'図書館',e:'📚',bg:'library'},
 {id:'beach',en:'on the beach',to:'to the beach',ja:'海辺で',jat:'海へ',jn:'海辺',e:'🏖️',bg:'beach'},
 {id:'forest',en:'in the forest',to:'to the forest',ja:'森で',jat:'森へ',jn:'森',e:'🌲',bg:'forest'},
 {id:'river',en:'by the river',to:'to the river',ja:'川のそばで',jat:'川へ',jn:'川のそば',e:'🏞️',bg:'river'},
 {id:'zoo',en:'at the zoo',to:'to the zoo',ja:'動物園で',jat:'動物園へ',jn:'動物園',e:'🦁',bg:'zoo'},
 {id:'cafe',en:'at the cafe',to:'to the cafe',ja:'カフェで',jat:'カフェへ',jn:'カフェ',e:'☕',bg:'cafe'},
 {id:'tokyo',en:'in Tokyo',to:'to Tokyo',ja:'東京で',jat:'東京へ',jn:'東京',e:'🗼',bg:'city'},
],
times: [
 {id:'theday',en:'on the day',ja:'その日に',jn:'日',e:'📅',ts:['past','pastprog','pastperf','fut'],sky:null},
 {id:'now',en:'now',ja:'今',e:'🔴',ts:['prog','pres'],sky:'day'},
 {id:'today',en:'today',ja:'今日',e:'📅',ts:['pres','prog','past','perf','fut'],sky:'day'},
 {id:'thismorning',en:'this morning',ja:'今朝',e:'🌅',ts:['past','pastprog'],sky:'morning'},
 {id:'yesterday',en:'yesterday',ja:'昨日',e:'⏪',ts:['past','pastprog'],sky:'day'},
 {id:'nexttime',en:'next time',ja:'次は',e:'⏭️',ts:['fut','pres','prog','futprog'],sky:null},
 {id:'lasttime',en:'last time',ja:'前回は',e:'⏮️',ts:['past','pastprog','pastperf'],sky:null},
 {id:'lastnight',en:'last night',ja:'昨夜',jn:'夜',e:'🌙',ts:['past','pastprog','pastperf'],sky:'night'},
 {id:'lastweek',en:'last week',ja:'先週',jn:'週',e:'🗓️',ts:['past','pastprog'],sky:'day'},
 {id:'ago',en:'two days ago',ja:'2日前',e:'⏮️',ts:['past','pastprog'],sky:'day'},
 {id:'justnow',en:'just now',ja:'さっき',e:'↩️',ts:['past'],sky:'day'},
 {id:'tonight',en:'tonight',ja:'今夜',e:'🌃',ts:['fut','prog','futprog'],sky:'night'},
 {id:'tomorrow',en:'tomorrow',ja:'明日',e:'⏩',ts:['fut','prog','futprog'],sky:'day'},
 {id:'nextweek',en:'next week',ja:'来週',e:'📆',ts:['fut','prog','futprog'],sky:'day'},
 {id:'soon',en:'soon',ja:'もうすぐ',e:'⏱️',ts:['fut','pres'],sky:null},
 {id:'everyday',en:'every day',ja:'毎日',e:'🔁',ts:['pres','past'],sky:null},
 {id:'everymorning',en:'every morning',ja:'毎朝',e:'☀️',ts:['pres','past'],sky:'morning'},
 {id:'sundays',en:'on Sundays',ja:'日曜日に',e:'🎈',ts:['pres','past'],sky:null},
 {id:'sometimes',en:'sometimes',ja:'ときどき',e:'🎲',ts:['pres','past'],sky:null},
 {id:'morning',en:'in the morning',ja:'朝に',e:'🌄',ts:['pres','past','fut'],sky:'morning'},
 {id:'night',en:'at night',ja:'夜に',e:'🌌',ts:['pres','past','fut'],sky:'night'},
 {id:'seven',en:'at seven',ja:'7時に',e:'🕖',ts:['pres','past','pastprog','fut','futprog','pastperf'],sky:null},
 {id:'twohours',en:'for two hours',ja:'2時間',e:'⌛',ts:['perfprog','pastperfprog','futperfprog','perf','past','fut'],sky:null},
 {id:'since',en:'since this morning',ja:'今朝から',e:'⏳',ts:['perfprog','perf'],sky:null},
 {id:'already',en:'already',ja:'もう',e:'✔️',ts:['perf'],sky:null},
 {id:'yet',en:'yet',ja:'まだ',jas:'',e:'⏳',ts:['perf'],sky:null},
 {id:'allday',en:'all day',ja:'一日じゅう',e:'🕰️',ts:['pastprog','past','perfprog','pastperfprog','futperfprog','fut'],sky:null},
],
};
FRONTS = [
 {id:'d_well',en:'Well',ja:'ええと',e:'💬',g:'link',typed:1},
 {id:'d_oh',en:'Oh',ja:'あっ',e:'😮',g:'link',typed:1},
 {id:'d_okay',en:'Okay',ja:'オーケー',e:'👌',g:'link',typed:1},
 {id:'d_so',en:'So',ja:'それで',e:'➡️',g:'link',typed:1},
 {id:'d_anyway',en:'Anyway',ja:'とにかく',e:'🙆',g:'link',typed:1},
 {id:'d_honestly',en:'Honestly',ja:'正直',e:'🤫',g:'stance',typed:1},
 {id:'d_basically',en:'Basically',ja:'要するに',e:'📝',g:'stance',typed:1},
 {id:'d_look',en:'Look',ja:'ねえ',e:'👀',g:'link',typed:1},
 {id:'d_listen',en:'Listen',ja:'聞いて',e:'👂',g:'link',typed:1},
 {id:'d_hey',en:'Hey',ja:'ねえ',e:'👋',g:'link',typed:1},
 {id:'d_yeah',en:'Yeah',ja:'うん',e:'👍',g:'link',typed:1},
 {id:'d_yes',en:'Yes',ja:'はい',e:'🙆',g:'link',typed:1},
 {id:'d_no',en:'No',ja:'いいえ',e:'🙅',g:'link',typed:1},
 {id:'d_alright',en:'Alright',ja:'よし',e:'👌',g:'link',typed:1},
 {id:'d_oops',en:'Oops',ja:'おっと',e:'😅',g:'link',typed:1},
 {id:'d_huh',en:'Huh',ja:'えっ',e:'🤨',g:'link',typed:1},
 {id:'d_ugh',en:'Ugh',ja:'うわあ',e:'😖',g:'link',typed:1},
 {id:'d_whoa',en:'Whoa',ja:'おおっ',e:'😲',g:'link',typed:1},
 {id:'d_ow',en:'Ow',ja:'いたっ',e:'😣',g:'link',typed:1},
 {id:'d_wow',en:'Wow',ja:'わあ',e:'🤩',g:'link',typed:1},
 {id:'d_really',en:'Really',ja:'本当に',e:'😮',g:'link',typed:1},
 {id:'d_sure',en:'Sure',ja:'もちろん',e:'👍',g:'link',typed:1},
 {id:'d_hmm',en:'Hmm',ja:'うーん',e:'🤔',g:'link',typed:1},
 {id:'d_please',en:'Please',ja:'お願い',e:'🙏',g:'link',typed:1},
 {id:'d_sorry',en:'Sorry',ja:'ごめん',e:'🙇',g:'link',typed:1},
 {id:'d_thanks',en:'Thanks',ja:'ありがとう',e:'🙏',g:'link',typed:1},
 {id:'d_hi',en:'Hi',ja:'やあ',e:'👋',g:'link',typed:1},
 {id:'d_yeah',en:'Yeah',ja:'うん',e:'👍',g:'link',typed:1},
 {id:'d_yes',en:'Yes',ja:'はい',e:'⭕',g:'link',typed:1},
 {id:'d_no',en:'No',ja:'いいえ',e:'❌',g:'link',typed:1},
 {id:'d_sure',en:'Sure',ja:'もちろん',e:'👍',g:'link',typed:1},
 {id:'d_right',en:'Right',ja:'そうだね',e:'☑️',g:'link',typed:1},
 {id:'d_thanks',en:'Thanks',ja:'ありがとう',e:'🙏',g:'link',typed:1},
 {id:'d_sorry',en:'Sorry',ja:'ごめん',e:'🙇',g:'link',typed:1},
 {id:'d_please',en:'Please',ja:'どうか',e:'🙏',g:'link',typed:1},
 {id:'d_maybe',en:'Maybe',ja:'たぶん',e:'🤔',g:'stance',typed:1,nc:1},
 {id:'d_perhaps',en:'Perhaps',ja:'もしかすると',e:'🤔',g:'stance',typed:1,nc:1},
 {id:'d_probably',en:'Probably',ja:'おそらく',e:'🤔',g:'stance',typed:1,nc:1},
 {id:'d_definitely',en:'Definitely',ja:'絶対',e:'💯',g:'stance',typed:1,nc:1},
 {id:'d_ofcourse',en:'Of course',ja:'もちろん',e:'👍',g:'stance',typed:1},
 {id:'d_bytheway',en:'By the way',ja:'ところで',e:'↪️',g:'link',typed:1},
 {id:'d_youknow',en:'You know',ja:'ほら',e:'💬',g:'link',typed:1},
 {id:'d_imean',en:'I mean',ja:'つまり',e:'💬',g:'link',typed:1},
 {id:'d_actually2',en:'Actually',ja:'実は',e:'💡',g:'stance',typed:1},
 {id:'d_still',en:'Still',ja:'それでも',e:'↔️',g:'link',typed:1},
 {id:'d_just',en:'Just',ja:'ただ',e:'☝️',g:'stance',typed:1,nc:1},
 {id:'d_not',en:'Not',ja:'ちがう',e:'🚫',g:'stance',typed:1,nc:1},
 {id:'d_goodluck',en:'Good luck',ja:'がんばって',e:'🍀',g:'link',typed:1},
 {id:'d_nice',en:'Nice',ja:'いいね',e:'👍',g:'link',typed:1},
 {id:'d_great',en:'Great',ja:'すごい',e:'🎉',g:'link',typed:1},
 {id:'oneday',en:'One day',ja:'ある日',e:'📖',g:'scene',ts:['past','pastprog']},
 {id:'suddenly',en:'Suddenly',ja:'突然',e:'⚡',g:'scene',ts:['past','pastprog','pastperf']},
 {id:'thatnight',en:'That night',ja:'その夜',e:'🌙',g:'scene',ts:['past','pastprog','pastperf']},
 {id:'afterschool',en:'After school',ja:'放課後',e:'🎒',g:'scene'},
 {id:'thismorning2',en:'This morning',ja:'今朝',e:'🌅',g:'scene',ts:['past','pastprog','perf']},
 {id:'usually',en:'Usually',ja:'ふだんは',e:'🔁',g:'freq',ts:['pres','past']},
 {id:'sometimes2',en:'Sometimes',ja:'ときどき',e:'🎲',g:'freq',ts:['pres','past']},
 {id:'often',en:'Often',ja:'よく',e:'♻️',g:'freq',ts:['pres','past']},
 {id:'weekends',en:'On weekends',ja:'週末は',e:'🗓️',g:'freq',ts:['pres','past','fut']},
 {id:'onceaweek',en:'Once a week',ja:'週に一度',e:'1️⃣',g:'freq',ts:['pres','past']},
 {id:'opinion',en:'In my opinion',ja:'わたしの考えでは',e:'💭',g:'stance'},
 {id:'truth',en:'To tell the truth',ja:'実を言うと',e:'🤫',g:'stance'},
 {id:'luckily',en:'Luckily',ja:'運よく',e:'🍀',g:'stance'},
 {id:'sadly',en:'Sadly',ja:'残念ながら',e:'😢',g:'stance'},
 {id:'ofcourse',en:'Of course',ja:'もちろん',e:'👌',g:'stance'},
 {id:'actually',en:'Actually',ja:'実は',e:'☝️',g:'stance'},
 {id:'maybe',en:'Maybe',ja:'たぶん',e:'🤔',g:'stance'},
 {id:'rx_oh',en:'Oh',ja:'ああ',e:'😮',g:'stance',casual:1},
 {id:'rx_wow',en:'Wow',ja:'わあ',e:'🤩',g:'stance',casual:1},
 {id:'rx_thanks',en:'Thanks',ja:'ありがとう',e:'🙏',g:'stance',casual:1},
 {id:'rx_anyway',en:'Anyway',ja:'とにかく',e:'↪️',g:'stance',casual:1},
 {id:'rx_imean',en:'I mean',ja:'つまり',e:'💬',g:'stance',casual:1},
 {id:'surprisingly',en:'Surprisingly',ja:'おどろいたことに',e:'😲',g:'stance'},
 {id:'hopefully',en:'Hopefully',ja:'うまくいけば',e:'🤞',g:'stance'},
 {id:'honestly',en:'Honestly',ja:'正直',e:'😅',g:'stance',casual:1},
 {id:'seriously',en:'Seriously',ja:'マジで',e:'😳',g:'stance',casual:1},
 {id:'guesswhat',en:'Guess what',ja:'ねえ聞いて',e:'🗣️',g:'stance',casual:1},
 {id:'believe',en:'Believe it or not',ja:'信じられないかもだけど',e:'🙃',g:'stance',casual:1},
 {id:'tobehonest',en:'To be honest',ja:'正直に言うと',e:'🫣',g:'stance',casual:1},
 {id:'first',en:'First',ja:'まず',e:'1️⃣',g:'link'},
 {id:'then',en:'Then',ja:'それから',e:'➡️',g:'link'},
 {id:'afterthat',en:'After that',ja:'そのあと',e:'⏭️',g:'link'},
 {id:'finally',en:'Finally',ja:'最後に',e:'🏁',g:'link'},
 {id:'however',en:'However',ja:'しかし',e:'↩️',g:'link'},
 {id:'bytheway',en:'By the way',ja:'ところで',e:'🔀',g:'link'},
 {id:'also',en:'Also',ja:'それに',e:'➕',g:'link'},
 {id:'anyway',en:'Anyway',ja:'とにかく',e:'🤷',g:'link',casual:1},
 {id:'d_ykw',en:'You know what?',ja:'ねえ聞いて',e:'🗣️',g:'link',nc:1},
 {id:'nl_acc',en:'According to',ja:'によると',e:'📰',g:'stance',need:1},
 {id:'nl_thx',en:'Thanks to',ja:'のおかげで',e:'🙏',g:'stance',need:1},
 {id:'nl_bec',en:'Because of',ja:'のせいで',e:'💥',g:'stance',need:1},
 {id:'nl_ins',en:'Instead of',ja:'の代わりに',e:'🔄',g:'stance',need:1},
 {id:'nl_dsp',en:'Despite',ja:'にもかかわらず',e:'💪',g:'stance',need:1},
 {id:'so2',en:'So',ja:'で',e:'👉',g:'link',casual:1},
];
LEADF = id=>FRONTS.find(f=>f.id===id);
FRT = c=>c.front==='time'||c.front==='both';
FRP = c=>c.front==='place'||c.front==='both';
MODALS = [
 {id:'can',ja:'できる！',en:'can',e:'💪'},
 {id:'want',ja:'したい！',en:'want to',e:'💭'},
 {id:'will',ja:'する！',en:'will',e:'❗'},
 {id:'might',ja:'ひょっとしたら',en:'might',e:'❔'},
 {id:'may',ja:'かもしれない',en:'may',e:'🌤️'},
 {id:'must',ja:'にちがいない',en:'must',e:'💯'},
 {id:'prob',ja:'たぶん',en:'will probably',e:'🤔'},
 {id:'haveto',ja:'しなきゃ',en:'have to',e:'⚠️'},
 {id:'should',ja:'したほうがいい',en:'should',e:'👍'},
 {id:'could',ja:'〜かも（できるかも）',en:'could',e:'🌈'},
];
CONJS = [
 {id:'when',en:'when',ja:'〜とき',e:'⏰',kind:'time'},
 {id:'if',en:'if',ja:'もし〜なら',e:'☁️',kind:'if'},
 {id:'because',en:'because',ja:'〜だから',e:'➡️',kind:'reason'},
 {id:'ifx',en:'if',ja:'もし〜だったら（想像）',e:'🦄',kind:'ifx'},
 {id:'before',en:'before',ja:'〜する前に',e:'⏮️',kind:'time'},
 {id:'after',en:'after',ja:'〜した後で',e:'⏭️',kind:'time'},
 {id:'until',en:'until',ja:'〜するまで',e:'🏁',kind:'time'},
 {id:'while',en:'while',ja:'〜している間',e:'↔️',kind:'time'},
 {id:'although',en:'although',ja:'〜けれど',e:'🌗',kind:'reason'},
 {id:'but',en:'but',ja:'でも',e:'🔀',kind:'co',back:1},
 {id:'butalso',en:'but also',ja:'しかも',e:'➕',kind:'co',back:1},
 {id:'and',en:'and',ja:'そして',e:'➕',kind:'co',back:1},
 {id:'so',en:'so',ja:'だから（その結果）',e:'⤵️',kind:'co',back:1},
 {id:'or',en:'or',ja:'それとも・または',e:'🔀',kind:'co',back:1},
];
TENSES = {
 pres:{ja:'いつも',lab:'習慣',st:'いまの状態'}, prog:{ja:'今している',lab:'今している'},
 past:{ja:'した',lab:'した',st:'だった'}, pastprog:{ja:'していた',lab:'していた'},
 perf:{ja:'もうした',lab:'今につながる',st:'ずっと'}, perfprog:{ja:'ずっとしている',lab:'ずっとしている'},
 fut:{ja:'これから',lab:'これから',st:'これから'},
 pastperf:{ja:'その時もう',lab:'その時もう',st:'その時まで'}, futprog:{ja:'その時している',lab:'その時してる'},
 pastperfprog:{ja:'その時までしていた',lab:'その時まで'}, futperf:{ja:'その時には終わっている',lab:'終わってる'}, futperfprog:{ja:'その時もし続けている',lab:'やり続けてる'},
};
TENSE_ORDER = ['pastperf','past','pastperfprog','pastprog','perf','perfprog','pres','prog','futperf','futperfprog','fut','futprog'];
PROGS = ['prog','pastprog','perfprog','futprog','pastperfprog','futperfprog'];
TENSE_UI = ['pastperf','past','pastperfprog','pastprog','perf','perfprog','pres','prog','futperf','futperfprog','fut','futprog'];
TLVL = {1:['pres'],2:['past','pres','fut'],3:['past','perf','pres','prog','fut'],4:['past','pastprog','perf','perfprog','pres','prog','fut'],5:['pastperf','past','pastprog','perf','perfprog','pres','prog','fut','futprog']};
PVBASE = {get:{past:'got',pp:'gotten',dbl:1},go:{past:'went',pp:'gone',s3:'goes'},come:{past:'came',pp:'come'},take:{past:'took',pp:'taken'},put:{past:'put',pp:'put',dbl:1},look:{},turn:{},give:{past:'gave',pp:'given'},run:{past:'ran',pp:'run',dbl:1},pick:{},bring:{past:'brought',pp:'brought'},break:{past:'broke',pp:'broken'},find:{past:'found',pp:'found'},work:{},hang:{past:'hung',pp:'hung'},show:{past:'showed',pp:'shown'},have:{past:'had',pp:'had',s3:'has'},make:{past:'made',pp:'made'},do:{past:'did',pp:'done',s3:'does'},catch:{past:'caught',pp:'caught'},wake:{past:'woke',pp:'woken'},sit:{past:'sat',pp:'sat',dbl:1},stand:{past:'stood',pp:'stood'},lie:{past:'lay',pp:'lain'},hurry:{},slow:{},calm:{},cheer:{},grow:{past:'grew',pp:'grown'},clean:{},hold:{past:'held',pp:'held'},speak:{past:'spoke',pp:'spoken'},watch:{},stay:{},fall:{past:'fell',pp:'fallen'},write:{past:'wrote',pp:'written'},throw:{past:'threw',pp:'thrown'},fill:{},check:{},walk:{},call:{},sign:{},log:{dbl:1},set:{past:'set',pp:'set',dbl:1},wait:{}};
PARTICLE = {up:{e:'⬆️',core:'上へ／すっかり',a:'up'},down:{e:'⬇️',core:'下へ／しずまる',a:'down'},out:{e:'📤',core:'外へ／最後まで',a:'out'},in:{e:'📥',core:'中へ',a:'in'},on:{e:'🔛',core:'くっついて・続いて',a:'on'},off:{e:'✂️',core:'はなれる',a:'off'},over:{e:'🌈',core:'上をこえて',a:'over'},away:{e:'💨',core:'はなれていく',a:'away'},back:{e:'↩️',core:'元へもどる',a:'back'},through:{e:'🚇',core:'通りぬけて',a:'through'},around:{e:'🔄',core:'ぐるっと・あちこち',a:'around'},along:{e:'🤝',core:'そって・いっしょに',a:'along'},into:{e:'🎯',core:'中へ入りこむ',a:'into'},for:{e:'🔍',core:'〜を求めて',a:'for'},after:{e:'👣',core:'あとを追って',a:'after'},across:{e:'↔️',core:'横切って（出くわす）',a:'across'},at:{e:'👉',core:'一点をねらって',a:'for'},to:{e:'➡️',core:'〜のほうへ',a:'through'},with:{e:'🤝',core:'〜といっしょに',a:'along'},idiom:{e:'🧩',core:'決まった言い方',a:'idiom'}};
PVS = [
 PV('get','up',{fr:'intr',ja:'起きる',jt:'i',e:'🛏️',an:'jump',mean:'上へ体を起こす → 起きる',synText:'rise'}),
 PV('get','on',{prep:true,fr:'tr',ja:'乗る',jt:'g',part:'に',e:'🚌',an:'walk',t:['ride'],mean:'乗り物にくっつく → 乗る',synText:'board'}),
 PV('get','off',{prep:true,fr:'tr',ja:'降りる',jt:'i',e:'🚏',an:'walk',t:['ride'],mean:'乗り物からはなれる → 降りる'}),
 PV('get','over',{prep:true,fr:'tr',ja:'乗りこえる',jt:'i',e:'💪',an:'up',t:['over'],mean:'上をこえる → 立ち直る',syn:'recover'}),
 PV('get','along',{fr:'both',prep:'with',tail:'along',ja:'仲良くする',jt:'s',part:'と',e:'🤝',an:'dance',t:['person'],mean:'そっていっしょに進む → うまくやる'}),
 PV('get','back',{fr:'intr',ja:'戻る',jt:'g',e:'↩️',an:'walk',motion:1,mean:'元へ → 戻る',syn:'return'}),
 PV('get','out',{fr:'intr',ja:'出る',jt:'i',e:'🚪',an:'walk',mean:'外へ → 出る',syn:'leave'}),
 PV('go','on',{fr:'intr',ja:'続く',jt:'g',e:'▶️',an:'walk',mean:'くっついて進む → 続ける',syn:'continue'}),
 PV('go','out',{fr:'intr',ja:'出かける',jt:'i',e:'🚶',an:'walk',motion:1,mean:'外へ行く → 出かける'}),
 PV('go','back',{fr:'intr',ja:'戻る',jt:'g',e:'↩️',an:'walk',motion:1,mean:'元へ行く → 戻る',syn:'return'}),
 PV('go','away',{fr:'intr',ja:'立ち去る',jt:'g',e:'💨',an:'run',mean:'はなれていく → 去る',syn:'leave'}),
 PV('go','over',{prep:true,fr:'tr',ja:'見直す',jt:'g',e:'📝',an:'hold',t:['homework','read','write'],mean:'上をざっと通る → 見直す',synText:'review'}),
 PV('go','through',{prep:true,fr:'tr',ja:'経験する',jt:'s',e:'🌧️',an:'walk',t:['over'],mean:'通りぬける → 乗り切る・経験する'}),
 PV('come','back',{fr:'intr',ja:'戻ってくる',jt:'k',e:'↩️',an:'walk',motion:1,mean:'元へ来る → 帰ってくる',syn:'return'}),
 PV('come','in',{fr:'intr',ja:'入ってくる',jt:'k',e:'🚪',an:'walk',mean:'中へ来る → 入る',syn:'enter'}),
 PV('come','out',{fr:'intr',ja:'出てくる',jt:'k',e:'🌟',an:'jump',mean:'外へ来る → 出てくる・現れる',syn:'appear'}),
 PV('come','over',{fr:'intr',ja:'遊びに来る',jt:'k',e:'🏠',an:'wave',mean:'間をこえて来る → うちに来る'}),
 PV('come','across',{prep:true,fr:'tr',ja:'偶然見つける',jt:'i',e:'🔎',an:'reach',t:['thing','read','person'],mean:'横切って出くわす → 偶然見つける',syn:'find'}),
 PV('come','along',{fr:'intr',ja:'ついてくる',jt:'k',e:'👣',an:'walk',mean:'そっていっしょに来る → ついてくる'}),
 PV('take','off',{fr:'tr',sep:1,ja:'脱ぐ',jt:'g',e:'👟',an:'hold',t:['wear'],mean:'体からはなす → 脱ぐ',synText:'remove'}),
 PV('take','out',{fr:'tr',sep:1,ja:'取り出す',jt:'g',e:'📤',an:'hold',t:['thing','food'],mean:'外へ取る → 取り出す'}),
 PV('take','away',{fr:'tr',sep:1,ja:'持ち去る',jt:'g',e:'🫳',an:'walk',t:['thing','toy'],mean:'はなれた所へ取る → 持っていく'}),
 PV('take','back',{fr:'tr',sep:1,ja:'返品する',jt:'s',e:'🔙',an:'hold',t:['thing','wear'],mean:'元へ取る → 返す・取り消す',syn:'return'}),
 PV('take','up',{fr:'tr',sep:1,ja:'始める',jt:'i',e:'🆕',an:'hold',t:['sport','instr','lang'],mean:'持ち上げる → （趣味を）始める',syn:'start'}),
 PV('take','care of',{prep:'care of',idiom:1,p:'idiom',fr:'tr',ja:'世話をする',jt:'s',part:'の',e:'🍼',an:'hug',t:['person','animal'],mean:'決まった言い方：面倒をみる'}),
 PV('take','a break',{idiom:1,p:'idiom',fr:'intr',ja:'休憩する',jt:'s',e:'☕',an:'sit',mean:'決まった言い方：ひと休みする',syn:'rest'}),
 PV('take','a walk',{idiom:1,p:'idiom',fr:'intr',ja:'散歩する',jt:'s',e:'🚶',an:'walk',mean:'決まった言い方：散歩する',syn:'walk'}),
 PV('take','a shower',{idiom:1,p:'idiom',fr:'intr',ja:'シャワーを浴びる',jt:'i',e:'🚿',an:'shake',mean:'決まった言い方：シャワーを浴びる'}),
 PV('put','on',{fr:'tr',sep:1,ja:'着る',jt:'i',e:'👕',an:'hold',t:['wear'],jaBy:{whead:['かぶる','g'],wfoot:['はく','g']},mean:'体にくっつける → 身につける',syn:'wear'}),
 PV('put','off',{fr:'tr',sep:1,ja:'延期する',jt:'s',e:'⏸️',an:'hold',t:['event'],mean:'予定からはなす → 先のばしにする',syn:'postpone'}),
 PV('put','away',{fr:'tr',sep:1,ja:'片付ける',jt:'i',e:'🧺',an:'hold',t:['thing','toy'],mean:'はなれた所に置く → 片付ける'}),
 PV('put','down',{fr:'tr',sep:1,ja:'下に置く',jt:'g',e:'⬇️',an:'hold',t:['thing'],mean:'下へ置く'}),
 PV('put','out',{fr:'tr',sep:1,ja:'消す',jt:'g',e:'🧯',an:'reach',t:['fire'],mean:'（火を）外へ出して終わらせる → 消す'}),
 PV('put','up with',{prep:'up with',p:'up',fr:'tr',ja:'がまんする',jt:'s',part:'を',e:'😤',an:'fists',t:['bear','person'],mean:'下からささえ上げたまま → がまんする'}),
 PV('look','up',{fr:'tr',sep:1,ja:'調べる',jt:'i',e:'🔎',an:'hold',t:['word'],mean:'（辞書で）目を上げてさがす → 調べる',syn:'check'}),
 PV('look','for',{prep:true,fr:'tr',ja:'探す',jt:'g',e:'🔍',an:'reach',t:['thing','person','animal'],mean:'〜を求めて見る → 探す',synText:'search for'}),
 PV('look','after',{prep:true,fr:'tr',ja:'世話をする',jt:'s',part:'の',e:'🍼',an:'hug',t:['person','animal'],mean:'あとを追って見守る → 世話をする'}),
 PV('look','out',{fr:'intr',ja:'気をつける',jt:'i',e:'⚠️',an:'bob',mean:'外へ目を向ける → 気をつける'}),
 PV('wake','up',{fr:'intr',ja:'起きる',jt:'i',e:'⏰',an:'bob',mean:'目をさまして上に起きる → 起きる'}),
 PV('sit','down',{fr:'intr',ja:'座る',jt:'g',e:'🪑',an:'bob',mean:'下へ腰をおろす → 座る'}),
 PV('stand','up',{fr:'intr',ja:'立ち上がる',jt:'g',e:'🧍',an:'bob',mean:'上へ立つ → 立ち上がる'}),
 PV('lie','down',{fr:'intr',ja:'横になる',jt:'g',e:'🛏️',an:'bob',mean:'下へ体を倒す → 横になる'}),
 PV('hurry','up',{fr:'intr',ja:'急ぐ',jt:'g',e:'🏃',an:'bob',mean:'いきおいをつけて急ぐ'}),
 PV('slow','down',{fr:'intr',ja:'ペースを落とす',jt:'g',e:'🐢',an:'bob',mean:'下へ速さを落とす → ペースを落とす'}),
 PV('calm','down',{fr:'intr',ja:'落ち着く',jt:'g',e:'😌',an:'bob',mean:'気持ちを下げる → 落ち着く'}),
 PV('cheer','up',{fr:'intr',ja:'元気を出す',jt:'s',e:'🎉',an:'bob',mean:'気分を上げる → 元気を出す'}),
 PV('grow','up',{fr:'intr',ja:'大人になる',jt:'g',e:'🌱',an:'bob',mean:'上へ育つ → 大人になる'}),
 PV('speak','up',{fr:'intr',ja:'大きな声で話す',jt:'s',e:'🗣️',an:'bob',mean:'声を上げる → 大きな声で話す'}),
 PV('hold','on',{fr:'intr',ja:'ちょっと待つ',jt:'g',e:'✋',an:'bob',mean:'つかまえたまま → ちょっと待つ'}),
 PV('watch','out',{fr:'intr',ja:'気をつける',jt:'i',e:'⚠️',an:'bob',mean:'外へ注意を向ける → 気をつける'}),
 PV('fall','down',{fr:'intr',ja:'転ぶ',jt:'g',e:'🤕',an:'bob',mean:'下へ落ちる → 転ぶ'}),
 PV('walk','in',{fr:'intr',ja:'歩いて入る',jt:'g',e:'🚪',an:'bob',mean:'中へ歩く → 歩いて入る'}),
 PV('walk','out',{fr:'intr',ja:'歩いて出る',jt:'g',e:'🚶',an:'bob',mean:'外へ歩く → 歩いて出る'}),
 PV('walk','away',{fr:'intr',ja:'立ち去る',jt:'g',e:'🚶',an:'bob',mean:'離れて歩く → 立ち去る'}),
 PV('walk','around',{fr:'intr',ja:'歩き回る',jt:'g',e:'🚶',an:'bob',mean:'まわりを歩く → 歩き回る'}),
 PV('sign','up',{fr:'intr',ja:'申し込む',jt:'g',e:'✍️',an:'bob',mean:'名前を書いて上に出す → 申し込む'}),
 PV('clean','up',{fr:'tr',sep:1,ja:'片づける',jt:'i',e:'🧹',an:'bob',mean:'きれいに上げる → 片づける'}),
 PV('write','down',{fr:'tr',sep:1,ja:'書き留める',jt:'i',e:'📝',an:'bob',mean:'下へ書く → 書き留める'}),
 PV('throw','away',{fr:'tr',sep:1,ja:'捨てる',jt:'i',e:'🗑️',an:'bob',mean:'遠くへ投げる → 捨てる'}),
 PV('fill','out',{fr:'tr',sep:1,ja:'記入する',jt:'s',e:'📋',an:'bob',mean:'いっぱいにして出す → 記入する'}),
 PV('check','out',{fr:'tr',sep:1,ja:'チェックする',jt:'s',e:'🔎',an:'bob',mean:'出して見る → チェックする'}),
 PV('call','back',{fr:'tr',sep:1,ja:'折り返し電話する',jt:'s',e:'📞',an:'bob',mean:'もどして電話する → 折り返す'}),
 PV('look','around',{fr:'intr',ja:'見回す',jt:'g',e:'👀',an:'bob',mean:'ぐるっと見る → 見回す'}),
 PV('look','into',{prep:true,fr:'tr',ja:'調べる',jt:'i',e:'🕵️',an:'hold',t:['event','thing'],mean:'中へ入りこんで見る → くわしく調べる'}),
 PV('look','forward to',{prep:'forward to',p:'idiom',fr:'tr',ja:'楽しみにする',jt:'s',part:'を',e:'🤩',an:'dance',t:['event','thing','person'],mean:'前のほうへ目を向ける → 楽しみにする'}),
 PV('turn','on',{fr:'tr',sep:1,ja:'つける',jt:'i',e:'💡',an:'reach',t:['device'],mean:'回して接続する → つける'}),
 PV('turn','off',{fr:'tr',sep:1,ja:'消す',jt:'g',e:'🔌',an:'reach',t:['device'],mean:'回して切りはなす → 消す'}),
 PV('turn','up',{fr:'tr',sep:1,ja:'大きくする',jt:'s',e:'🔊',an:'reach',t:['device'],mean:'回して上げる → 音を大きくする'}),
 PV('turn','down',{fr:'tr',sep:1,ja:'断る',jt:'g',e:'🙅',an:'reach',t:['offer','device'],jaBy:{device:['小さくする','s']},mean:'下へ回す → 小さくする・断る',syn:'refuse'}),
 PV('turn','around',{fr:'intr',ja:'振り向く',jt:'g',e:'🔄',an:'bob',mean:'ぐるっと回る → 振り向く'}),
 PV('turn','into',{prep:true,fr:'tr',ja:'変わる',jt:'g',part:'に',e:'🦋',an:'up',t:['change'],mean:'回って中へ入りこむ → 〜に変わる'}),
 PV('give','up',{fr:'both',sep:1,ja:'あきらめる',jt:'i',e:'🏳️',an:'slump',t:['sport','instr','game','lang'],mean:'すっかり手ばなす → あきらめる・やめる',syn:'quit'}),
 PV('give','back',{fr:'tr',sep:1,ja:'返す',jt:'g',e:'🔙',an:'reach',t:['thing','read'],mean:'元へあげる → 返す',syn:'return'}),
 PV('give','away',{fr:'tr',sep:1,ja:'あげてしまう',jt:'i',e:'🎁',an:'reach',t:['thing','toy'],mean:'はなれた所へあげる → ただであげる'}),
 PV('give','in',{fr:'intr',ja:'降参する',jt:'s',e:'🙌',an:'up',mean:'（相手の）中へ身をあずける → 降参する'}),
 PV('run','away',{fr:'intr',ja:'逃げる',jt:'i',e:'🏃',an:'run',mean:'走ってはなれる → 逃げる',syn:'escape'}),
 PV('run','out of',{prep:'out of',p:'out',fr:'tr',ja:'切らす',jt:'g',e:'🫙',an:'shake',t:['food','drink','thing'],mean:'外へ出つくす → 使い切る'}),
 PV('run','into',{prep:true,fr:'tr',ja:'ばったり会う',jt:'g',part:'に',e:'😮',an:'bob',t:['person'],mean:'走って入りこむ → ばったり会う',syn:'meet'}),
 PV('run','after',{prep:true,fr:'tr',ja:'追いかける',jt:'i',e:'💨',an:'run',t:['person','animal','ball'],mean:'あとを追って走る → 追いかける',syn:'chase'}),
 PV('pick','up',{fr:'tr',sep:1,ja:'拾う',jt:'g',e:'🫳',an:'reach',t:['thing','person','toy'],jaBy:{person:['迎えに行く','g']},mean:'持ち上げる → 拾う・迎えに行く'}),
 PV('pick','out',{fr:'tr',sep:1,ja:'選ぶ',jt:'g',e:'☝️',an:'reach',t:['thing','wear','read'],mean:'外へ取り出す → えらび出す',syn:'choose'}),
 PV('bring','back',{fr:'tr',sep:1,ja:'持って帰る',jt:'g',e:'🎒',an:'walk',t:['thing','food'],mean:'元へ持ってくる → 持ち帰る'}),
 PV('break','down',{fr:'intr',ja:'故障する',jt:'s',e:'🛠️',an:'shake',mean:'下へくずれる → こわれて止まる'}),
 PV('break','up',{fr:'intr',ja:'別れる',jt:'i',e:'💔',an:'slump',mean:'すっかりこわれる → 別れる'}),
 PV('find','out',{fr:'tr',sep:1,ja:'つきとめる',jt:'i',e:'💡',an:'jump',t:['tell','thing'],mean:'見つけて外へ出す → 知る・わかる',syn:'discover'}),
 PV('work','out',{fr:'intr',ja:'運動する',jt:'s',e:'🏋️',an:'jump',mean:'最後まで動かす → 運動する・うまくいく',syn:'exercise'}),
 PV('hang','on',{fr:'intr',ja:'ちょっと待つ',jt:'g',e:'✋',an:'bob',mean:'くっついたまま → 待つ・がんばる',syn:'wait'}),
 PV('hang','up',{fr:'intr',ja:'電話を切る',jt:'g',e:'📵',an:'reach',mean:'（受話器を）上に掛ける → 電話を切る'}),
 PV('show','up',{fr:'intr',ja:'現れる',jt:'i',e:'🎉',an:'wave',mean:'上に姿を見せる → 現れる',syn:'appear'}),
 PV('have','fun',{idiom:1,p:'idiom',fr:'intr',ja:'楽しむ',jt:'g',e:'🥳',an:'dance',mean:'決まった言い方：楽しく過ごす',syn:'enjoy'}),
 PV('have','lunch',{idiom:1,p:'idiom',fr:'intr',ja:'昼ごはんを食べる',jt:'i',e:'🍱',an:'mouth',mean:'決まった言い方：昼ごはんを食べる',syn:'eat'}),
 PV('make','a mistake',{idiom:1,p:'idiom',fr:'intr',ja:'まちがえる',jt:'i',e:'❌',an:'shake',mean:'決まった言い方：まちがえる'}),
 PV('make','friends',{idiom:1,p:'idiom',fr:'intr',ja:'友だちになる',jt:'g',e:'🧑‍🤝‍🧑',an:'dance',mean:'決まった言い方：友だちをつくる'}),
 PV('do','{poss} best',{idiom:1,p:'idiom',fr:'intr',ja:'がんばる',jt:'g',e:'🔥',an:'fists',mean:'決まった言い方：全力をつくす'}),
 PV('catch','a cold',{idiom:1,p:'idiom',fr:'intr',ja:'風邪をひく',jt:'g',e:'🤧',an:'shake',mean:'決まった言い方：風邪をひく'}),
];
CAUSV = [
 {id:'caus_make',en:'make',past:'made',pp:'made',caus:'bare',ja:'させる',jt:'i',fr:'tr',t:['person','animal'],e:'👉',an:'reach',nopass:1,cl:'に'},
 {id:'caus_let',en:'let',past:'let',pp:'let',dbl:1,caus:'bare',ja:'させてあげる',jt:'i',fr:'tr',t:['person','animal'],e:'🙆',an:'wave',nopass:1,cl:'に'},
 {id:'caus_have',en:'have',past:'had',pp:'had',s3:'has',caus:'bare',ja:'してもらう',jt:'g',fr:'tr',t:['person'],e:'🙏',an:'talk',nopass:1,cl:'に'},
 {id:'caus_help',en:'help',caus:'bare',ja:'手伝う',jt:'g',fr:'tr',t:['person','animal'],e:'🤝',an:'reach',nopass:1,cl:'が'},
 {id:'caus_see',en:'see',past:'saw',pp:'seen',caus:'ing',ja:'見る',jt:'i',fr:'tr',t:['person','animal'],e:'👀',an:'reach',nopass:1,cl:'が',hidden:1,typed:1},
 {id:'caus_watch',en:'watch',caus:'ing',ja:'見る',jt:'i',fr:'tr',t:['person','animal'],e:'📺',an:'reach',nopass:1,cl:'が',hidden:1,typed:1},
 {id:'caus_hear',en:'hear',past:'heard',pp:'heard',caus:'ing',ja:'聞く',jt:'g',fr:'tr',t:['person','animal'],e:'👂',an:'reach',nopass:1,cl:'が',hidden:1,typed:1},
 {id:'caus_notice',en:'notice',caus:'ing',ja:'気づく',jt:'g',fr:'tr',t:['person','animal'],e:'💡',an:'reach',nopass:1,cl:'が',hidden:1,typed:1},
 {id:'call_n',en:'call',past:'called',pp:'called',ja:'呼ぶ',jt:'g',fr:'tr',part:'と',t:['person','animal'],e:'📣',an:'reach',nopass:1,hidden:1,typed:1},
 {id:'name_n',en:'name',ja:'名付ける',jt:'i',fr:'tr',part:'と',t:['person','animal'],e:'🏷️',an:'reach',nopass:1,hidden:1,typed:1},
 {id:'caus_seeb',en:'see',past:'saw',pp:'seen',caus:'bare',ja:'見る',jt:'i',fr:'tr',t:['person','animal'],e:'👀',an:'reach',nopass:1,cl:'が',hidden:1,typed:1},
 {id:'caus_watchb',en:'watch',caus:'bare',ja:'見る',jt:'i',fr:'tr',t:['person','animal'],e:'📺',an:'reach',nopass:1,cl:'が',hidden:1,typed:1},
 {id:'caus_hearb',en:'hear',past:'heard',pp:'heard',caus:'bare',ja:'聞く',jt:'g',fr:'tr',t:['person','animal'],e:'👂',an:'reach',nopass:1,cl:'が',hidden:1,typed:1},
 {id:'caus_want',en:'want',caus:'to',ja:'してほしい',jt:'i',fr:'tr',t:['person','animal'],e:'🥺',an:'bob',nopass:1,stative:1,cl:'に'},
 {id:'caus_ask',en:'ask',caus:'to',ja:'頼む',jt:'g',fr:'tr',t:['person'],e:'🙋',an:'talk',nopass:1,cl:'に'},
 {id:'caus_tell',en:'tell',past:'told',pp:'told',caus:'to',ja:'言う',jt:'g',fr:'tr',t:['person'],e:'🗣️',an:'talk',nopass:1,cl:'に'},
];
SYNV = [
 {id:'get',en:'get',past:'got',pp:'gotten',dbl:1,ja:'手に入れる',jt:'i',fr:'tr',t:['thing','food','drink','present'],e:'🤲',an:'reach'},
 {id:'put',en:'put',past:'put',pp:'put',dbl:1,ja:'置く',jt:'g',fr:'tr',t:['thing'],e:'📥',an:'hold'},
 {id:'turn',en:'turn',ja:'曲がる',jt:'g',fr:'intr',e:'↪️',an:'walk'},
 {id:'pick',en:'pick',ja:'摘む',jt:'g',fr:'tr',t:['plant'],e:'🌸',an:'reach'},
 {id:'break',en:'break',past:'broke',pp:'broken',ja:'こわす',jt:'g',fr:'tr',t:['thing','toy','device'],e:'💥',an:'shake'},
 {id:'hang',en:'hang',past:'hung',pp:'hung',ja:'掛ける',jt:'i',fr:'tr',t:['wear','draw'],e:'🪝',an:'reach'},
 {id:'return',en:'return',ja:'戻る',jt:'g',fr:'both',motion:1,t:['thing','read'],jaBy:{thing:['返す','g'],read:['返す','g']},e:'↩️',an:'walk'},
 {id:'continue',en:'continue',ja:'続ける',jt:'i',fr:'both',t:['sport','instr','lang','homework'],e:'▶️',an:'bob'},
 {id:'discover',en:'discover',ja:'発見する',jt:'s',fr:'tr',t:['thing','tell'],e:'🧭',an:'jump'},
 {id:'quit',en:'quit',past:'quit',pp:'quit',dbl:1,ja:'やめる',jt:'i',fr:'both',t:['sport','instr','game','lang'],e:'🛑',an:'slump'},
 {id:'postpone',en:'postpone',ja:'延期する',jt:'s',fr:'tr',t:['event'],e:'📆',an:'bob'},
 {id:'recover',en:'recover',ja:'回復する',jt:'s',fr:'intr',e:'💪',an:'up'},
 {id:'leave',en:'leave',past:'left',pp:'left',ja:'出発する',jt:'s',fr:'intr',e:'🧳',an:'walk'},
 {id:'enter',en:'enter',ja:'入る',jt:'g',fr:'intr',e:'🚪',an:'walk'},
 {id:'escape',en:'escape',ja:'逃げる',jt:'i',fr:'intr',e:'🏃',an:'run'},
 {id:'choose',en:'choose',past:'chose',pp:'chosen',ja:'選ぶ',jt:'g',fr:'tr',t:['thing','wear','read'],e:'☝️',an:'reach'},
 {id:'start',en:'start',ja:'始める',jt:'i',fr:'both',t:['sport','instr','lang','homework'],e:'🆕',an:'bob'},
 {id:'refuse',en:'refuse',ja:'断る',jt:'g',fr:'tr',t:['offer'],e:'🙅',an:'bob'},
 {id:'appear',en:'appear',ja:'現れる',jt:'i',fr:'intr',e:'🎉',an:'wave'},
 {id:'exercise',en:'exercise',ja:'運動する',jt:'s',fr:'intr',e:'🏋️',an:'jump'},
];
LEX = null;
P = id=>LEX.idx['people:'+id];
T = id=>LEX.idx['things:'+id];
V = id=>LEX.idx['verbs:'+id];
ST = id=>LEX.idx['states:'+id];
MN = id=>LEX.idx['manners:'+id];
PL = id=>LEX.idx['places:'+id];
TM = id=>LEX.idx['times:'+id];
MD = id=>MODALS.find(m=>m.id===id)||({would:{id:'would',ja:'〜のになあ',en:'would',e:'🦄'},could:{id:'could',ja:'できるのになあ',en:'could',e:'🦄'}})[id];
CJ = id=>CONJS.find(c=>c.id===id)||(id==='i_asconc'?{id:'i_asconc',en:'as',ja:'〜だけれど',e:'🎓',kind:'co',conc:1}:undefined);
PRED_PERSON = /^(boy|girl|man|woman|person|child|baby|kid|teacher|student|doctor|nurse|friend|player|singer|driver|worker|writer|artist|king|queen|boss|neighbor|neighbour|farmer|dancer|cook|chef|pilot|police officer|lawyer|manager|leader|pupil|member|guest|stranger|customer|clerk|engineer|scientist|actor|actress|poet|author|president|captain|coach|fan|hero|lady|gentleman|guy|men|women|children)$/i;
ALLTAGS = ['any','thing','person','animal','food','drink','read','write','present','event','ride','wear','draw','sport','game','music','lang','word','tell','watch','abstract','offer'];
VOW = 'aeiou';
BE = {base:'be',pp:'been',ing:'being'};
HAVE = {en:'have',past:'had',pp:'had',s3:'has'};
DO = {en:'do',past:'did',pp:'done',s3:'does'};
NEG = {is:"isn't",are:"aren't",was:"wasn't",were:"weren't",do:"don't",does:"doesn't",did:"didn't",have:"haven't",has:"hasn't",had:"hadn't",will:"won't",can:"can't",could:"couldn't",should:"shouldn't",might:'might not',am:'am not'};
INTENS = {very:['very','とても','‼️'],so:['so','すごく','💥'],really:['really','本当に','💯'],quite:['quite','かなり','➕'],pretty:['pretty','けっこう','👍'],little:['a little','少し','🤏'],too:['too','〜すぎるくらい','🔥'],extremely:['extremely','めちゃくちゃ','🚀'],totally:['totally','完全に','💯'],completely:['completely','すっかり','✅'],absolutely:['absolutely','まったく','✅'],fairly:['fairly','わりと','👍'],rather:['rather','ずいぶん','➕']};
REALMOD = ['can','could','will','would','should','must','might','may'];
WH_JA = {subj:'誰が？',obj:'何を？',place:'どこで？',time:'いつ？',manner:'どんなふうに？',with:'誰と？',action:'何をする？',state:'どう？',why:'どうして？'};
POSS_EN = {my:'my',your:'your',his:'his',her:'her',our:'our',their:'their'};
POSS_JA = {my:'わたしの',your:'あなたの',his:'かれの',her:'かのじょの',our:'わたしたちの',their:'かれらの'};
SCOPE = {class:{en:'in my class',ja:'クラスで'},family:{en:'in my family',ja:'家族で'},world:{en:'in the world',ja:'世界で'},all:{en:'of all',ja:'みんなの中で'},three:{en:'of the three',ja:'3人の中で'}};
POSSOF = {i:'my',you:'your',he:'his',she:'her',we:'our',they:'their',it:'its',ken:'his',dad:'his',boy:'his',mika:'her',mom:'her',grandma:'her',girl:'her',friends:'their',students:'their'};
GD = {'う':['わ','い','え','って','った'],'く':['か','き','け','いて','いた'],'ぐ':['が','ぎ','げ','いで','いだ'],'す':['さ','し','せ','して','した'],'つ':['た','ち','て','って','った'],'ぬ':['な','に','ね','んで','んだ'],'ぶ':['ば','び','べ','んで','んだ'],'む':['ま','み','め','んで','んだ'],'る':['ら','り','れ','って','った']};
VMOM = new Set(["arrive", "get_arrive", "wake", "wake_up", "get_up", "sit", "sit_down", "stand_up", "fall", "fall_down", "win", "find", "lose", "c2_die", "leave", "enter", "appear", "start", "x_begin", "x_stop", "x_finish", "quit", "come", "go", "return", "get_back", "go_back", "come_back", "come_in", "come_out", "go_out", "get_on", "get_off", "get_out", "forget", "discover", "catch", "x_marry", "u_get_married", "c2_graduate", "c2_retire", "c2_land", "x_drop", "c2_disappear", "c2_end", "c2_fail", "c2_succeed", "u_pass_away", "u_pass_out", "u_fall_asleep", "give_up", "break_up", "u_move_in", "u_move_out", "u_set_off", "show_up", "u_head_out", "go_away", "walk_away", "turn_on", "turn_off", "put_on", "take_off", "c2_receive", "grow_up", "x_change", "turn_into", "catch_acold", "make_friends", "u_come_true", "u_sell_out", "u_end_up", "u_run_out", "find_out", "x_decide", "i_makeupmind", "u_make_it", "u_check_in", "u_log_in", "u_log_out", "c2_park", "hang_up", "u_sign_in", "u_drop_off", "c1_hurt", "c2_injure", "x_miss_the_bus", "come_across", "run_into", "u_get_in", "u_get_into", "x_leave_the_room", "x_let_go"]);
VNV = new Set(["find", "lose", "win", "fall", "fall_down", "forget", "c2_die", "appear", "c2_disappear", "catch_acold", "u_get_lost", "c2_fail", "c2_succeed", "u_pass_away", "u_pass_out", "u_fall_asleep", "c1_happen", "x_change", "u_come_true", "u_sell_out", "u_run_out", "u_end_up", "grow", "grow_up", "c2_increase", "c1_hurt", "c2_injure", "u_break_out", "break_down", "x_melt", "x_freeze", "x_burn", "x_ring", "x_sink", "x_float", "x_shine", "c2_rain", "c2_snow", "x_sneeze", "x_cough", "x_yawn", "x_shiver", "come_across", "run_into", "discover", "recover", "u_get_better", "u_turn_out", "u_come_up", "u_go_off", "u_fall_apart", "c2_exist", "x_understand", "c2_sweat", "u_throw_up", "u_wear_out", "x_miss_the_bus", "x_drop", "u_get_lost"]);
VTEIRU = new Set(['have','x_live']);
if(false) module.exports={FRONTS,PVS,PARTICLE,OFFICIAL,MODALS,CONJS,TENSES,buildLex,newClause,genClause,sentenceText,sentenceJa,sentenceParts,allowedTenses,fixTense,sentenceComplete,jconj};
SUBJ_PRON = {'p:i':'I','p:you':'you','p:he':'he','p:she':'she','p:we':'we','p:they':'they'};
{ const _at=allowedTenses, _am=allowedModals; window.allowedModalsAll=_am;
  const TL=TLVL;
  allowedTenses=function(c,ctx){ const a=_at(c,ctx); if(c&&c.qfree) return a; const lv=typeof LV==='function'?LV():6; const ok=TL[lv]; if(!ok) return a; const f=a.filter(x=>ok.includes(x)); return f.length?f:a; };
  allowedModals=function(c){ const a=_am(c); if(c&&c.qfree) return a; const lv=typeof LV==='function'?LV():6; if(lv<=3) return a.filter(x=>['can','will'].includes(x.id)); return a; }; }
}

/* ほかのファイルが中身を差しかえるとき用 */
export function set_buildLex(v) { return buildLex = v; }
export function set_jaClause(v) { return jaClause = v; }
export function set_jaPred(v) { return jaPred = v; }
export function set_sentenceParts(v) { return sentenceParts = v; }
export function set_sentenceJa(v) { return sentenceJa = v; }
export function set_sentenceComplete(v) { return sentenceComplete = v; }
