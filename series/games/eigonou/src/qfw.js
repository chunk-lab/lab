import { set_sentenceComplete } from './engine.js';
import { BIGX, bigAdd } from './bigdict.js';
import { toast } from './common.js';
import { CW_V, cwStart } from './embed.js';
import { CONJS, FRONTS, LEADF, LEX, MODALS, N, P, PL, PROGS, ST, T, allowedTenses, attrJa, isPerson, needsObj, pp, predHead, predV, sentenceComplete, setModal } from './engine.js';
import { geoCap, geoLook } from './geo.js';
import { AC, APP, FREQ, entry, mutate, openSub, openVc, pick, relAble, setActive, swapVerb } from './play.js';
import { QB, QB_PREPS, qbCtx, qbCwSubj, qbRes, qbRes1 } from './qbar.js';
import { frLiveEmpty } from './qfr.js';
import { QS, qspAdjWord, qspClPending, qspN } from './qsp.js';
import { vcForms, vcOf } from './vcomp.js';
// ================= 機能語（not / don't / can / was / have / do / what / if …）を打って使う =================
// 打った語を、エンジンのボタン（否定・助動詞・時制・疑問・つなぎ）の操作に置きかえる。
export let FWX;
export function fwOptions(q){ const w=String(q||'').toLowerCase().trim().replace(/’/g,"'"); const L=FWX.T[w]||[]; let out=L.filter(o=>o.act&&(!o.when||o.when()));
 if(/^[a-z' ]+$/.test(w)) Object.keys(FWX.T).filter(k=>k.startsWith(w+' ')&&!/^(have been|has been|will be|going to|want to|has to|have to|had to|need to)$/.test(k)||(k.startsWith(w+' ')&&['going','want','have','has','will'].includes(w)===false&&false)).forEach(k=>FWX.T[k].filter(o=>o.act&&(!o.when||o.when())).forEach(o=>out.push(o)));
 if(L.dyn){ try{ L.dyn().forEach(d=>{ const oo=FWX.O(w+(d.gap==='o'?' (we …)':' (…)'),d.ja,'🔗',()=>openSub('rel',{head:d.head,gap:d.gap}),'conj'); oo.opens=1; out.push(oo); }); }catch(e){} }
 try{ if((!out.length||/^(in|at|on) /.test(w))&&typeof LEX!=='undefined'&&APP.active&&w.length>2&&!qbRes1(w).some(o=>o.act&&String(o.en).toLowerCase()===w&&o.pos!=='noun')){ const c=AC(); const al=allowedTenses(Object.assign({},c,{time:null}),{kind:APP.active==='main'?'main':APP.active}); LEX.times.filter(t=>!t.typed&&String(t.en).toLowerCase()===w&&t.ts.some(x=>al.includes(x))).forEach(t=>{ const o=FWX.O(t.en,t.ja,t.e||'🕒',()=>{ pick('time',t.id); },'adv'); o.id='fwtl_'+t.id; if(out.length) out.unshift(o); else out.push(o); }); } }catch(e){}
 return out; }
// ---- 限定詞（the / my / this / some / any / two / a little more …）：打った名詞に重ねる ----
export let DETS;
export let DETKEYS;
export let IRR_PL;
export function plurOf(w){ const m=w.match(/^(.*?)(\w+)$/); if(!m) return w; const b=m[2]; if(IRR_PL[b]) return m[1]+IRR_PL[b]; if(/(s|x|z|ch|sh)$/.test(b)) return w+'es'; if(/[^aeiou]y$/.test(b)) return w.slice(0,-1)+'ies'; if(/[^aeiou]o$/.test(b)&&/^(potato|tomato|hero|echo)$/.test(b)) return w+'es'; return w+'s'; }
export let DETRE_STRIP;
export function fwBakeEntry(ref,det,plural){ const n=N(ref); if(!n||n.pron||n.poss||n.bpart||ref==='p:it') return null; if(ref[0]==='p' && !n.thing && !n.big && /^[A-Z]/.test(n.en) && !/^(The|A|An)\b/.test(n.en)) return null;
 const D=DETS[det]; if(!D) return null; const nb=n.en.replace(DETRE_STRIP,'');
 const wasPl=!!n.pl; let pl=wasPl; if(D.pl) pl=true; else if(D.sg||D.unc) pl=false; else if(plural) pl=true;
 let word=nb; if(pl && !wasPl && !D.unc) word=plurOf(nb); const aj=QB.adjP; const w1=aj?aj.en:word;
 const art= det==='bare'?'' : det==='a'||det==='an'? (/^[aeiou]/i.test(w1)&&!/^(uni|use|euro|one)/i.test(w1)?'an ':'a ') : det+' ';
 const en=art+(aj?aj.en+' ':'')+word, ja=((/^[2-5]つの$/.test(D.ja)&&ref[0]==='p'&&!n.thing)?D.ja[0]+(n.animal?(/鳥/.test(n.ja)?'羽':'ひき'):'人')+'の':D.ja)+(aj?aj.attr:'')+n.ja; const id='d_'+det.replace(/\W+/g,'')+'_'+(aj?aj.id.replace(/\W+/g,'_')+'_':'')+nb.replace(/\W+/g,'_')+(pl?'_p':'');
 const o=Object.assign({},n,{id,en,ja:D.negq?(aj?aj.attr:'')+n.ja:ja,pl:pl?1:0,big:1,dbaked:1}); if(D.negq){ o.negq=''; o.negpre=D.ja; o.negsuf='も'; } delete o.ind; delete o.obj; const list=ref[0]==='p'?'people':'things';
 bigAdd(list,o); return (ref[0]==='p'?'p:':'t:')+id; }
export function fwBakeState(st,det,plural){ if(!st||!st.noun) return null; const D=DETS[det]; if(!D) return null; const nb=String(st.en).replace(DETRE_STRIP,''); const pb=String(st.pl||plurOf(nb)).replace(DETRE_STRIP,'');
 const aj=QB.adjP; const w1=aj?aj.en:nb; const art=det==='bare'?'':det==='a'||det==='an'? (/^[aeiou]/i.test(w1)?'an ':'a ') : det+' '; const id='ds_'+det.replace(/\W+/g,'')+'_'+(aj?aj.id.replace(/\W+/g,'_')+'_':'')+nb.replace(/\W+/g,'_');
 const o=Object.assign({},st,{id,en:art+(aj?aj.en+' ':'')+(D.pl?pb:nb),pl:art+(aj?aj.en+' ':'')+pb,ja:D.ja+(aj?aj.attr:'')+st.ja,typed:1,big:1}); bigAdd('states',o); return id; }
export function qbWithDet(o,det,plural){ return Object.assign({},o,{act:()=>{ const c0=AC(); const F=['subj','obj','iobj','thing','than','with']; const bf={}; F.forEach(f=>bf[f]=c0[f]); const bp=c0.pred&&c0.pred.id; const h=APP.hist.length; o.act();
  const c=AC(); let ref=null,fld=null; for(const f of F){ if(c[f] && c[f]!==bf[f]){ fld=f; ref=c[f]; break; } }
  if(!ref && c.pred && c.pred.k==='s' && c.pred.id && c.pred.id!==bp){ const nid=fwBakeState(ST(c.pred.id),det,plural); if(nid){ const hl=APP.hist.length; mutate(()=>{ AC().pred={k:'s',id:nid}; },null); if(APP.hist.length>hl) APP.hist.pop(); } return; }
  if(!ref) return; const nr=fwBakeEntry(ref,det,plural); if(!nr) return; const hl=APP.hist.length; mutate(()=>{ AC()[fld]=nr; },null); if(APP.hist.length>hl) APP.hist.pop(); } }); }
export function fwSplitDet(q){ const s=String(q||'').toLowerCase().trim(); if(!s) return null; for(const k of DETKEYS){ if(s===k) return {det:k,rest:''}; if(s.startsWith(k+' ')) return {det:k,rest:s.slice(k.length+1).trim()}; } return null; }
// 「to」：want to / have to / decide to …



// ---- 動詞の変化形（said / went / eaten / liked / going …）を打つと、もとの動詞＋時制にする ----
export let FW_IRR;
export let FW_IRRL;

export let FW_SAME;
export function fwIrr(){ if(FW_IRR) return FW_IRR; const M={}; const put=(w,l,f)=>{ if(!w||w===l) return; (M[w]=M[w]||[]).push({l,f}); };
 LEX.verbs.forEach(v=>{ if(v.past) put(v.past,v.en,'past'); if(v.pp) put(v.pp,v.en,'pp'); });
 BIGX.v.forEach(e=>{ if(e.past) put(e.past,e.w,'past'); if(e.pp) put(e.pp,e.w,'pp'); });
 FW_IRRL.forEach(r=>{ const [b,pa,pp]=r; if(pa!==b&&!(M[pa]||[]).some(x=>x.l===b)) put(pa,b,'past'); if(pp!==b&&pp!==pa&&!(M[pp]||[]).some(x=>x.l===b)) put(pp,b,'pp'); });
 // 過去形と過去分詞が同じものは両方の役を持たせる
 Object.keys(M).forEach(w=>{ const f=new Set(M[w].map(x=>x.l+'|'+x.f)); M[w]=[...f].map(k=>{ const [l,fm]=k.split('|'); return {l,f:fm}; }); });
 FW_IRR=M; return M; }
export function fwLemmas(w){ const out=[]; const I=fwIrr()[w]; if(I) I.forEach(x=>out.push({l:x.l,f:x.f}));
 const und=b=>/(.)\1$/.test(b)? [b, b.slice(0,-1)] : [b];
 if(FW_SAME.has(w)) out.push({l:w,f:'same'});
 if(/ing$/.test(w) && w.length>4){ const b=w.slice(0,-3); und(b).forEach(x=>{ out.push({l:x,f:'ing'}); out.push({l:x+'e',f:'ing'}); }); }
 // 三人称単数（works / lives / remembers / watches / tries）：時制はそのまま、もとの動詞にもどす
 if(/s$/.test(w) && !/(ss|us|is)$/.test(w) && w.length>3){ if(/ies$/.test(w)) out.push({l:w.slice(0,-3)+'y',f:'s3'}); if(/(ches|shes|xes|sses|zes|oes)$/.test(w)) out.push({l:w.slice(0,-2),f:'s3'}); out.push({l:w.slice(0,-1),f:'s3'}); }
 if(w==='has') out.push({l:'have',f:'s3'}); if(w==='does') out.push({l:'do',f:'s3'}); if(w==='goes') out.push({l:'go',f:'s3'});
 if(/ied$/.test(w)) out.push({l:w.slice(0,-3)+'y',f:'past'});
 if(/ed$/.test(w) && w.length>3){ const b=w.slice(0,-2); und(b).forEach(x=>out.push({l:x,f:'past'})); out.push({l:w.slice(0,-1),f:'past'}); }
 return out; }
export function fwInflPh(w,resFn){ const ws=w.trim().split(/\s+/); if(ws.length<2||ws.length>4||!/^[a-z]{3,}$/.test(ws[0])||!ws.every(x=>/^[a-z']+$/.test(x))) return []; const L=fwLemmas(ws[0]).filter(x=>x.f!=='same'); if(!L.length) return []; const out=[], seen=new Set();
 L.forEach(({l,f})=>{ const ph=[l].concat(ws.slice(1)).join(' '), pn=qspN(ph); resFn(ph).forEach(o=>{ if(o.pos!=='verb'||!o.act||seen.has(o.id)) return; const full=qspN(o.en), parts=full.split(' '); if(parts[0]!==l||parts.length<2) return; if(!(full===pn||full.startsWith(pn+' '))) return; seen.add(o.id);
  out.push(Object.assign({},o,{en:[ws[0]].concat(parts.slice(1)).join(' '),ja:(o.ja||'')+({past:'（した）',pp:'（〜した）',ing:'（〜している）',s3:''})[f],f,act0:o.act,act:()=>{ o.act(); }})); }); });
 return out; }
export function fwInfl(q,resFn){ const w=String(q||'').toLowerCase(); if(/\s/.test(w.trim())) return fwInflPh(w,resFn); if(!/^[a-z]{3,}$/.test(w)) return []; const L=fwLemmas(w); if(!L.length) return []; const out=[], seen=new Set();
 L.forEach(({l,f})=>{ resFn(l).forEach(o=>{ if(o.pos!=='verb'||!o.act) return; const en=String(o.en).toLowerCase().replace(/^to /,''); if(en!==l) return; const key=o.id; if(seen.has(key)) return; seen.add(key);
  out.push(Object.assign({},o,{en:w,ja:(o.ja||'')+({past:'（した）',pp:'（〜した）',ing:'（〜している）',s3:''})[f],f,act0:o.act,act:()=>{ o.act(); }})); }); });
 return out; }

export function fwTenseFor(t,f){ if(f==='ing') return PROGS.includes(t)?t:(t==='past'?'pastprog':t==='perf'?'perfprog':t==='fut'?'futprog':'prog'); if(f==='past') return ['perf','pastperf'].includes(t)?t:'past'; if(f==='pp') return ['perf','pastperf'].includes(t)?t:'perf'; return t; }
// ---- 短縮形（I'm / it's / that's / we're / I'll / I've / I'd / there's）：主語＋be・助動詞を一度に ----
export function fwContr(q,resFn){ let qq=String(q||'').toLowerCase().replace(/’/g,"'"); const bt=/^([a-z]+'d) better$/.exec(qq); if(bt) qq=bt[1]; const m=qq.match(/^([a-z]+)'(s|re|m|ll|ve|d)$/); if(!m) return []; if(qbCtx().st!=='subj'&&qbCtx().st!=='entry'&&!(typeof qspClPending==='function'&&qspClPending())) return [];
 const [_,w,suf]=m; const word=w==='i'?'I':w; const ja={s:'〜だ・〜している',re:'〜だ',m:'〜だ',ll:'〜する（つもり）',ve:'もう〜した',d:'〜だろう'}[suf];
 if(w==='there'){ return [{id:'fwc_'+q,e:'☝️',en:q,ja:'〜がある・いる',pos:'aux',fw:1,act:()=>{ FWX.M(c=>{ c.type='exist'; c.tense=suf==='d'?'past':'pres'; }); }}]; }
 let subs=resFn(w).filter(o=>o.act&&String(o.en).toLowerCase().replace(/^the /,'')===w&&['noun'].includes(o.pos)); if(!subs.length&&APP.open==='cw'&&typeof qbCwSubj==='function'){ try{ subs=qbCwSubj(w).filter(o=>o.act&&String(o.en).toLowerCase().replace(/^the /,'')===w); }catch(e){} } if(!subs.length) return [];
 const sj=subs[0];
 return (suf==='d'?(bt?['better']:['would','better','had']):['']).map(dmode=>({id:'fwc_'+q+(dmode&&dmode!=='would'?'_'+dmode:''),e:sj.e||'🔧',en:word+"'"+suf+(bt?' better':''),ja:(sj.ja||'')+' '+ja,pos:'aux',fw:1,ahead:dmode==='better'&&!bt?1:0,act:()=>{ const t=APP.hist.length; sj.act();
   const hl=APP.hist.length; mutate(()=>{ const c=AC(); c.qfree=true;
     if(suf==='s'||suf==='re'||suf==='m'){ c.pred={k:'s',id:null}; c.intens=null; c.adj=null; c.link=null; c.useObj=false; c.obj=null; APP.lsub='be'; APP.beKind='adj'; c.tense='pres'; }
     else if(suf==='ll'){ c.modal='will'; c.tense='fut'; } else if(suf==='ve'){ c.tense='perf'; } else if(suf==='d'){ if(dmode==='had'){ c.tense='pastperf'; } else if(dmode==='better'){ c.modal='hadbetter'; c.tense='pres'; } else { c.modal='would'; c.tense='pres'; } } },null);
   if(APP.hist.length>hl) APP.hist.pop(); }})); }
// ---- 前置詞つきの場所・時間（to work / at the mall / from Tokyo / at ten / for two hours / 3 days ago …）----
export let PP_JA;
export let NUMW;
export let UNITJA;
export function fwNum(w){ if(/^\d+$/.test(w)) return +w; return NUMW[w]!=null? NUMW[w]: null; }
export let TS_ALL;
export function fwTimeOpt(q){ const s=String(q||'').toLowerCase().trim(); let m, en, ja, ts=TS_ALL;
 if((m=s.match(/^at (\d{1,2})(?::(\d\d))?\s?(am|pm|o'clock)?$/)) || (m=s.match(/^at (one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)()\s?(am|pm|o'clock)?$/))){ const h=fwNum(m[1]); if(h==null||h>24) return null; en=s; ja=h+'時'+(m[2]&&m[2]!=='00'?(+m[2])+'分':'')+'に'; }
 else if((m=s.match(/^(for|in|within|after) (\w+) (second|minute|hour|day|week|month|year)s?$/))){ const n=fwNum(m[2]); if(n==null) return null; const u=UNITJA[m[3]]; const nn=n===0.5?'30分':n+u; en=s; ja= m[1]==='for'? n+u+'の間' : m[1]==='after'? n+u+'後に' : n+u+'後に'; if(m[1]==='for'&&n===0.5&&m[3]==='hour') ja='30分の間'; }
 else if((m=s.match(/^(\w+) (second|minute|hour|day|week|month|year)s? ago$/))){ const n=fwNum(m[1]); if(n==null) return null; en=s; ja=n+UNITJA[m[2]]+'前に'; ts=['past','pastprog','perf','pastperf']; }
 else if((m=s.match(/^(last|next|this) (week|month|year|weekend|summer|winter|spring|autumn|fall|morning|afternoon|evening|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/))){ const W={last:'先',next:'来',this:'今'}; const T={week:'週',month:'月',year:'年',weekend:'週末',summer:'夏',winter:'冬',spring:'春',autumn:'秋',fall:'秋',morning:'朝',afternoon:'午後',evening:'晩',night:'夜',monday:'月曜日',tuesday:'火曜日',wednesday:'水曜日',thursday:'木曜日',friday:'金曜日',saturday:'土曜日',sunday:'日曜日'}; en=s; ja=(m[1]==='last'?'この前の':m[1]==='next'?'次の':'今')+T[m[2]]; if(['week','month','year'].includes(m[2])) ja=({last:'先',next:'来',this:'今'})[m[1]]+T[m[2]]; ts= m[1]==='last'?['past','pastprog','perf','pastperf']: m[1]==='next'?['fut','futprog','pres']:TS_ALL; }
 else if((m=s.match(/^(on )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekday|weekend)s$/))){ const T={monday:'月曜日',tuesday:'火曜日',wednesday:'水曜日',thursday:'木曜日',friday:'金曜日',saturday:'土曜日',sunday:'日曜日',weekday:'平日',weekend:'週末'}; en='on '+m[2][0].toUpperCase()+m[2].slice(1)+'s'; ja='毎'+(/day$/.test(m[2])&&m[2]!=='weekday'?'週':'')+T[m[2]]+'に'; if(m[2]==='weekday') ja='平日は'; if(m[2]==='weekend') ja='毎週末'; ts=['pres','past','fut']; }
 else if((m=s.match(/^since (\d{4})$/))){ en=s; ja=m[1]+'年から'; ts=['perf','perfprog']; }
 else if((m=s.match(/^(in|by) (1[0-9]{3}|20[0-9]{2})$/))){ en=s; ja=m[2]+'年'+(m[1]==='by'?'までに':'に'); ts=m[1]==='by'?['pres','past','perf','fut']:['past','pres','fut']; }
  else if((m=s.match(/^since (yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/))){ const T={yesterday:'昨日',monday:'月曜日',tuesday:'火曜日',wednesday:'水曜日',thursday:'木曜日',friday:'金曜日',saturday:'土曜日',sunday:'日曜日'}; en=s; ja=T[m[1]]+'から'; ts=['perf','perfprog']; }
  else if((m=s.match(/^(in|at|on) (the )?(morning|afternoon|evening|night|noon|midnight|dawn|summer|winter|spring|autumn|fall|january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/)) && ((m[1]==='in'&&/^(morning|afternoon|evening|summer|winter|spring|autumn|fall|january|february|march|april|may|june|july|august|september|october|november|december)$/.test(m[3])&&(m[2]||!/^(morning|afternoon|evening)$/.test(m[3])))||(m[1]==='at'&&!m[2]&&/^(night|noon|midnight|dawn)$/.test(m[3]))||(m[1]==='on'&&!m[2]&&/day$/.test(m[3])))){ const T={morning:'朝',afternoon:'午後',evening:'夕方',night:'夜',noon:'正午',midnight:'真夜中',dawn:'夜明け',summer:'夏',winter:'冬',spring:'春',autumn:'秋',fall:'秋',january:'1月',february:'2月',march:'3月',april:'4月',may:'5月',june:'6月',july:'7月',august:'8月',september:'9月',october:'10月',november:'11月',december:'12月',monday:'月曜日',tuesday:'火曜日',wednesday:'水曜日',thursday:'木曜日',friday:'金曜日',saturday:'土曜日',sunday:'日曜日'}; en=s; ja=T[m[3]]+'に'; }
  else return null;
 en=en.replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g,x=>x[0].toUpperCase()+x.slice(1)); const id='tt_'+en.toLowerCase().replace(/\W+/g,'_'); return {en,ja,id,ts}; }
export let DETJA;
export function fwDetJa(txt){ const m=String(txt).match(/^(my|your|his|her|our|their|this|that|these|those) (?!one$)/); return m?DETJA[m[1]]:''; }
export function fwPP(q,resFn){ const s=String(q||'').toLowerCase().trim(); const out=[]; if((LEX.manners||[]).some(m=>String(m.en).toLowerCase()===s&&!m.typed)&&(()=>{ try{ const c=AC(); return !!(c&&c.pred&&c.pred.id&&c.pred.id!=='be'); }catch(e){ return false; } })()) return out;
 try{ const mm0=s.match(/^to ([a-z]+)$/); if(mm0&&APP.active==='main'&&fwOptions('to').some(o=>(/〜するための/.test(String(o.id))&&!o.late)||o.causTo)&&(LEX.verbs.some(v=>v.en===mm0[1])||resFn(mm0[1]).some(o=>o.pos==='verb'&&String(o.en).toLowerCase()===mm0[1]))) return out; }catch(e){}
 const tm=fwTimeOpt(s); if(tm){ out.push({id:'fwt_'+tm.id,e:'🕒',en:tm.en,ja:tm.ja,pos:'adv',fw:1,act:()=>{ bigAdd('times',{id:tm.id,en:tm.en,ja:tm.ja,jn:tm.ja.replace(/に$/,''),e:'🕒',ts:tm.ts,sky:null,typed:1,big:1}); pick('time',tm.id); }}); return out; }
 const mm=s.match(/^(with|about|for|of|without|like|during|after|before|until|since|against|among|along|beyond|despite|except|than|via|per|upon|off|out of) (.+)$/);
 if(mm){ const np=mm[2].replace(/^(the|a|an|my|your|his|her|our|their|this|that) (?!one$)/,''); const POSJ={mine:'わたし',yours:'あなた',his:'かれ',hers:'かのじょ',ours:'わたしたち',theirs:'かれら'}; let nja=(mm[1]==='of'&&POSJ[np])||fwNounJa(np)||(DETS[np]?null:null); if(nja&&!POSJ[np]) nja=fwDetJa(mm[2])+nja; if(nja){ const JA={with:'と',about:'について',for:'のために',of:'の',without:'なしで',like:'のように',during:'の間に',after:'のあとで',before:'の前に',until:'まで',since:'から',against:'に反対して',among:'の中で',along:'に沿って',beyond:'の向こうに',despite:'にもかかわらず',except:'以外',than:'より',via:'経由で',per:'あたり',upon:'の上に',off:'から離れて','out of':'の外へ'}[mm[1]]; const id='pm_'+s.replace(/\W+/g,'_'); out.push({id:'fwp_'+id,e:'💬',en:s,ja:nja+JA,pos:'adv',fw:1,act:()=>{ if(mm[1]==='of'){ const c0=AC(); if(c0&&!c0.manner&&((c0.obj&&!c0.opm&&c0.pred&&c0.pred.k==='v')||(c0.subj&&!c0.pred&&!c0.spm&&!c0.obj))){ mutate(()=>{ const c1=AC(); if(c1.obj&&c1.pred) c1.opm={en:s,ja:nja+'の'}; else c1.spm={en:s,ja:nja+'の'}; },null); return; } } bigAdd('manners',{id,en:s,ja:nja+JA,e:'💬',typed:1,big:1}); pick('manner',id); }}); return out; } }
 const m=s.match(/^(in front of|to|at|in|on|near|by|under|over|behind|inside|outside|across|from|into|around|through|between|toward|towards) (.+)$/); if(!m) return out;
 const pr=m[1], np=m[2].replace(/^(the|a|an|my|your|his|her|our|their|this|that) (?!one$)/,''); if(!np) return out;
 const g=geoLook(np); let nja=g?g.ja:fwNounJa(np); if(!nja) return out; if(!g) nja=fwDetJa(m[2])+nja; let J=PP_JA[pr]; if(!g&&/^(me|you|him|her|us|them|it|this|that|these|those)$/.test(np)){ const per=/^(me|you|him|her|us|them)$/.test(np); const PJ2={to:['に','に'],at:per?['に','に']:['で','で'],in:['の中で','の中へ'],on:['の上で','の上へ'],from:['から','から'],by:['のそばで','のそばへ'],near:['の近くで','の近くへ'],under:['の下で','の下へ'],over:['の上で','の上へ'],behind:['のうしろで','のうしろへ'],inside:['の中で','の中へ'],outside:['の外で','の外へ'],across:['の向こう側で','の向こう側へ'],into:['の中で','の中へ'],around:['のまわりで','のまわりへ'],through:['をとおして','をとおって'],between:['の間で','の間へ'],toward:['のほうで','のほうへ'],towards:['のほうで','のほうへ']}; if(PJ2[pr]) J=PJ2[pr]; } const sx=g?pr+' '+g.en:s;
 const id='pp_'+sx.replace(/\W+/g,'_');
 { const cc=AC(); if(pr==='in'&&np==='charge'&&cc&&cc.pred&&cc.pred.k==='s'&&!cc.pred.id&&LEX.idx['states:x_incharge']){ out.push({id:'fwp_incharge',e:'🧑‍💼',en:'in charge',ja:'担当',pos:'adj',fw:1,act:()=>{ pick('state','x_incharge'); }}); return out; } }
 { const cc=AC(); if(pr==='from'&&cc&&cc.pred&&cc.pred.k==='s'&&!cc.pred.id&&APP.active==='main'){ out.push({id:'fwp_'+id,e:'🌏',en:sx,ja:nja+'出身',pos:'adj',fw:1,act:()=>{ bigAdd('states',{id:'as_'+id,en:sx,ja:nja+'出身',jt:'na',e:'🌏',typed:1,big:1}); pick('state','as_'+id); }}); return out; } }
 { const cc=AC(); if(cc&&cc.pred&&cc.pred.k==='s'&&!cc.pred.id&&APP.active==='main'&&(/^(in front of|next to|in|at|on|near|by|under|behind|inside|outside|across|around)$/.test(pr)||(pr==='to'&&/^perf/.test(String(cc.tense))))){ const PJ={'in front of':'の前','next to':'の横',on:'の上',under:'の下',behind:'の後ろ',near:'の近く',by:'のそば',inside:'の中',outside:'の外',across:'の向かい',around:'のまわり'}[pr]||''; out.push({id:'fwp_'+id,e:'📍',en:sx,ja:nja+PJ+'に',pos:'adj',fw:1,act:()=>{ bigAdd('states',{id:'ls_'+id,en:sx,ja:nja+PJ+'に',jn:nja+PJ,loc:1,jt:'raw',e:'📍',typed:1,big:1}); APP.beKind='loc'; pick('state','ls_'+id); }}); return out; } }
 const jnNew=nja+(/^(で|へ|を)$|^(の[^で]+)[でへを]$/.test(J[0])?J[0].replace(/[でへを]$/,''):'');
 out.push({id:'fwp_'+id,e:'📍',en:sx,ja:nja+J[0],pos:'adv',fw:1,act:()=>{ const c0=AC(); if(c0&&c0.place&&APP.active!=='comp'){ try{ const old=PL(c0.place); if(old&&old.en){ const en2=old.en+' '+sx, id2=id+'__on__'+String(c0.place).replace(/\W+/g,'_'); bigAdd('places',{id:id2,en:en2,to:en2,ja:jnNew+'の'+old.ja,jat:jnNew+'の'+(old.jat||old.ja),jn:jnNew+'の'+(old.jn||''),e:'📍',typed:1,big:1}); pick('place',id2); return; } }catch(e){} } bigAdd('places',{id,en:sx,to:sx,ja:nja+J[0],jat:nja+J[1],jn:jnNew,e:'📍',typed:1,big:1}); pick('place',id); }});
 return out; }

export function fwNounJa(w){ const k=String(w).toLowerCase().trim(); if(k==='this one') return 'これ'; if(k==='that one') return 'あれ'; { const g=geoLook(k); if(g) return g.ja; } if(/^[a-z]+( [a-z]+)+$/.test(k)&&!window.__fnj){ window.__fnj=1; try{ const ws=k.split(' '); const nj=fwNounJa(ws[ws.length-1]); let pre=''; let ok=!!nj; for(const x of ws.slice(0,-1)){ if(x==='very'){ pre+='とても'; continue; } if(x==='own'){ pre+='自分自身の'; continue; } const st=(LEX.states||[]).find(y=>!y.noun&&!y.loc&&!y.weather&&String(y.en).toLowerCase()===x); if(!st){ ok=false; break; } pre+=attrJa(st); } if(ok) return pre+nj; }finally{ window.__fnj=0; } } const strip=x=>String(x||'').toLowerCase().replace(/^(a|an|the|my|your|his|her|our|their|some) /,'');
 let n=LEX.people.find(x=>x.pron&&(x.en===k||x.obj===k)); if(n) return n.ja; n=LEX.things.find(x=>strip(x.en)===k)||LEX.people.find(x=>strip(x.en)===k&&!x.pron); if(n) return n.ja;
 { const pp=LEX.people.find(x=>!x.pron&&x.pl&&strip(x.en)===k+'s'); if(pp) return String(pp.ja).replace(/たち$/,''); }
 const pl=LEX.places.find(x=>strip(x.en.replace(/^(at|in|on|near|by) /,''))===k); if(pl) return pl.jn;
 for(const kk of ['n','p','an']){ const e=(BIGX[kk]||[]).find(x=>x.w===k); if(e) return e.ja; } 
 for(const sing of [k.replace(/ies$/,'y'),k.replace(/s$/,''),k.replace(/es$/,''),k.replace(/ves$/,'f'),k.replace(/ves$/,'fe')]){ if(sing!==k){ for(const kk of ['n','p','an']){ const e=(BIGX[kk]||[]).find(x=>x.w===sing); if(e) return e.ja; } } }
 return null; }
// ---- 区切り（，）：いまの部分（if … / that … の中）をおえて、もとの文にもどる ----

// ---- 説明の文（the guy that works upstairs / the book that I read）----

// ---- つなぎ言葉・あいづち（Well, / Maybe / Of course …）を、文のはじめに足す ----
export function fwLeads(){ return FRONTS.filter(f=>f.g!=='scene'||f.typed).map(f=>({id:'lead'+f.id,e:f.e,en:f.en+(f.nc?'':','),ja:f.ja+(f.nc?'':'、'),pos:'adv',fw:1,act:()=>mutate(()=>{ const c=AC(); if(APP.active==='main'){ const pv=c.lead&&LEADF(c.lead); if(pv){ const id=pv.id+'+'+f.id; if(!LEADF(id)) FRONTS.push({id,en:pv.en+(pv.nc?'':',')+' '+f.en.toLowerCase().replace(/^i /,'I '),ja:pv.ja+(pv.nc?'':'、')+f.ja,e:f.e,g:'link',typed:1,nc:f.nc}); c.lead=id; } else c.lead=f.id; c.qfree=true; } APP.open=null; },'lead')})); }
// ---- 付け足しの聞き返し（, right? / , don't you?）----
export let TAGRE;
export function fwTag(q){ const s=String(q||'').toLowerCase().trim().replace(/\?$/,''); if(!(TAGRE.test(s)||['right','okay','ok','you know','huh','eh','yeah','isn\'t it','aren\'t you'].includes(s))) return []; if(APP.active!=='main') return []; const m=APP.S.main; if(!m.subj&&!m.pred) return [];
 { const inp=document.getElementById('qin'); if(inp){ const v=inp.value.toLowerCase(); const i=v.lastIndexOf(s); if(i>=0&&!/,\s*$/.test(v.slice(0,i))) return []; if(i<0){ const nw=s.split(/\s+/).length; const ws=v.replace(/[?.!\s]+$/,'').split(/\s+/); const pre=ws.slice(0,Math.max(0,ws.length-nw)).join(' '); if(!/,$/.test(pre)) return []; } } }
 return [{id:'fwtag_'+s,e:'🔚',en:', '+s+'?',ja:'〜ね？（聞き返し）',pos:'aux',fw:1,act:()=>mutate(()=>{ APP.S.main.tagText=s; },null)}]; }
// ---- there is / there are ----



// ---- 文の完成：つなぎ言葉・場所・時間・様子だけの短い返事（Maybe later. / At home.）----


// ---- 形容詞のあとの to不定詞／前置詞（ready to go / good at English / afraid of dogs）----
export let ADJP;
export let ADJP_JA;
export function fwAdjSt(){ try{ const c=AC(); if(!c||!c.pred||c.pred.k!=='s') return null; const st=ST(c.pred.id); return (st&&!st.noun)? st : null; }catch(e){ return null; } }
export function fwVerbJa(w){ const v=LEX.verbs.find(x=>x.en===w); if(v&&v.ja) return String(v.ja).replace(/[。]$/,''); const b=(BIGX.v||[]).find(x=>x.w===w); return b&&b.ja? String(b.ja).replace(/[。]$/,''):null; }
export function fwAdjBake(st,pre,rest,ja,jt){ const id='as_'+(st.en+'_'+pre+'_'+rest).replace(/\W+/g,'_'); const o=Object.assign({},st,jt?{jt}:{},{id,en:geoCap(st.en+' '+pre+' '+rest),ja,typed:1,big:1,noun:0,baseId:st.baseId||st.id}); bigAdd('states',o); return {id:'fwas_'+id,e:st.e||'🔖',en:o.en,ja:o.ja,pos:'adj',fw:1,act:()=>{ mutate(()=>{ AC().pred={k:'s',id}; },null); }}; }
export let AP2;
export function fwAdjPP(pre,q){ const preF=String(pre||''); pre=preF.split(' ')[0]; const st=fwAdjSt(); if(!st) return []; const w=String(q||'').toLowerCase().trim(); if(!w) return [];
 { const np1=w.replace(/^(the|a|an|my|your|his|her|our|their|this|that) (?!one$)/,''); const nja=fwNounJa(np1); const np=np1; if(nja&&String(st.en).toLowerCase()==='next'&&pre==='to'){ const lid='ls_nt_'+np.replace(/\W+/g,'_'); const len='next '+preF+' '+w; return [{id:'fwas_'+lid,e:'📍',en:len,ja:nja+'の横に',pos:'adj',fw:1,gram:1,act:()=>{ bigAdd('states',{id:lid,en:len,ja:nja+'の横に',jn:nja+'の横',loc:1,jt:'raw',e:'📍',typed:1,big:1}); APP.beKind='loc'; pick('state',lid); }}]; } }
 if(pre==='to'&&/ /.test(w)){ const [v0,...r0]=w.split(' '); const vj0=fwVerbJa(v0), np0=r0.join(' ').replace(/^(the|a|an|my|your|his|her|our|their|this|that) (?!one$)/,''), nj0=fwNounJa(np0)||({you:'あなた',him:'かれ',her:'かのじょ',me:'わたし',them:'かれら',us:'わたしたち',it:'それ'})[np0]; if(vj0&&nj0){ const aj=String(st.ja||'').replace(/だ$/,''); const vv0=(LEX.verbs||[]).find(x=>!x.pv&&x.en===v0); const vp=nj0+((vv0&&vv0.part)||'を')+vj0; return [fwAdjBake(st,'to',w,/準備ができ|できる|できない/.test(aj)? vp+aj : vp+'のが'+aj)]; } }
 if(pre==='to'){ const vj=fwVerbJa(w); if(vj){ const aj=String(st.ja||'').replace(/だ$/,''); const j=/準備ができ|できる|できない/.test(aj)? vj+aj : vj+'のが'+aj; return [fwAdjBake(st,'to',w,j)]; } }
 const np=w.replace(/^(the|a|an|my|your|his|her|our|their|this|that) (?!one$)/,''); const nja=fwNounJa(np);  if(nja){ const aj=String(st.ja||'').replace(/だ$/,''); const k=String(st.en).toLowerCase().split(' ')[0]; if(String(st.en).toLowerCase()==='in charge'&&pre==='of') return [fwAdjBake(st,preF,w,nja+'の担当')]; if(k==='ready'&&pre==='for') return [fwAdjBake(st,preF,w,nja+'の'+aj)]; if(k==='good'&&pre==='at') return [fwAdjBake(st,preF,w,nja+'が得意だ')]; if(k==='bad'&&pre==='at') return [fwAdjBake(st,preF,w,nja+'が苦手だ')]; { const ap=AP2[k+' '+pre]; if(ap){ const [pj,aj2]=ap.split(' '); let jt2='raw',j2=aj2; if(/だ$/.test(aj2)){ jt2='na'; j2=aj2.replace(/だ$/,''); } else if(/[いし]$/.test(aj2)&&!/いる$/.test(aj2)&&!/思っている$/.test(aj2)){ jt2='i'; } return [fwAdjBake(st,preF,w,nja+pj+j2,jt2)]; } } return [fwAdjBake(st,preF,w,nja+(ADJP_JA[pre]||'に')+aj)]; }
 return []; }
export function fwAdjHints(){ const st=fwAdjSt(); if(!st) return []; const k=String(st.en).toLowerCase().split(' ')[0]; const L=ADJP[k]; if(!L||!L.length) return []; return L.map(p=>({id:'fwpre_h'+p,e:'📍',en:p,ja:'＋つづけて打つ（'+k+' '+p+' …）',pos:'aux',fw:1,act:()=>{ QB.pre=p; toast(k+' '+p+' …つぎに言葉を打ってね'); }})); }


// ---- 関係詞（who / that / which / whom）：直前の名詞（主語 or 目的語）にくっつく節を開く。穴が主語か目的語かは、候補を2つ出して打った文に合うほうを選ぶ ----
export function fwRel(q){ const w=String(q||'').toLowerCase(); if(!/^(who|that|which|whom)$/.test(w)) return []; if(typeof APP==='undefined'||APP.active!=='main') return [];
 const m=APP.S.main; if(!m||m.type==='exist'&&false) return []; const out=[]; const cand=[];
 if(m.obj && !m.passive && relAble(m.obj) && needsObj(m)) cand.push('obj'); const sref=m.passive?m.obj:m.subj; if(sref && relAble(sref)) cand.push('subj'); if(!m.passive && m.pred && m.pred.k==='s' && !m.subs.comp && predHead(m)) cand.push('pred'); if(m.type==='exist' && m.thing && relAble(m.thing)) cand.push('thing');
 cand.forEach(h=>{ const hr=h==='pred'?predHead(m):h==='thing'?m.thing:h==='subj'?sref:m.obj; const per=isPerson(hr); if(/^(who|whom)$/.test(w)&&!per) return; if(w==='which'&&per) return;
  ['s','o'].forEach(g=>{ if(w==='whom'&&g==='s') return; out.push({id:'fwrel_'+h+g+'_'+w,e:g==='s'?'🏃':'🎯',en:w,ja:'その'+N(hr).ja+(g==='s'?'が':'を'),pos:'conj',fw:1,gram:1,opens:1,act:()=>{ APP.open=null; openSub('rel',{head:h,gap:g}); }}); }); });
 return out; }

// ---- 受け身の「by 〜」：by のあとの名詞・人称代名詞を、受け身の「した人」（主語の穴）に入れる ----
export function fwBy(q,resFn){ if(typeof APP==='undefined'||APP.active!=='main'||typeof QB==='undefined'||!/^by( |$)/.test(QB.pre)) return []; const c=AC(); if(!c.passive||c.subj) return [];
 const OBJP={her:'she',him:'he',them:'they',me:'i',us:'we',you:'you',it:'it'}; const rest=String(QB.pre).slice(2).trim(); const w=String(q||'').toLowerCase(); const key=rest?(rest+' '+q):(OBJP[w]||q);
 const sv={pred:c.pred,obj:c.obj,use:c.useObj,pas:c.passive,q:c.q,tense:c.tense,lsub:APP.lsub}; let res=[];
 const kpre=QB.pre,kdet=QB.det,kmod=QB.mod; try{ QB.pre='';  c.pred=null; c.obj=null; c.useObj=false; c.passive=false; c.q=null; APP.lsub=null; res=resFn(key).filter(o=>o.act&&['noun','pron'].includes(o.pos)); }catch(e){ res=[]; } finally{ c.pred=sv.pred; c.obj=sv.obj; c.useObj=sv.use; c.passive=sv.pas; c.q=sv.q; c.tense=sv.tense; APP.lsub=sv.lsub; QB.pre=kpre; QB.det=kdet; QB.mod=kmod; }
 return res.slice(0,6).map(o=>Object.assign({},o,{id:'fwby_'+o.id,en:q,fw:1,gram:1,act:()=>{ const cc=AC(); const s2={pred:cc.pred,obj:cc.obj,use:cc.useObj,q:cc.q,tense:cc.tense}; mutate(()=>{ cc.pred=null; cc.obj=null; cc.useObj=false; cc.passive=false; cc.q=null; },null); APP.hist.pop(); QB.pre=''; o.act(); const sj=cc.subj; mutate(()=>{ cc.pred=s2.pred; cc.obj=s2.obj; cc.useObj=s2.use; cc.passive=true; cc.q=s2.q; cc.tense=s2.tense; cc.subj=sj; },null); APP.hist.pop(); }})); }

// ---- be のあとの場所ことば（He is here. / She is upstairs.）：前置詞なしの場所副詞を「いる場所」の状態にする ----
export let FW_BELOC;
export function fwBeLoc(q){ const w=String(q||'').toLowerCase(); const nj=FW_BELOC[w]; if(!nj||typeof APP==='undefined') return []; const c=AC(); if(!(c.pred&&c.pred.k==='s'&&!c.pred.id)&&!(APP.lsub==='be'&&!c.pred)) return [];
 return [{id:'fwbl_'+w,e:'📍',en:w,ja:nj+'にいる',pos:'adj',fw:1,gram:1,act:()=>{ bigAdd('states',{id:'ls_'+w,en:w,ja:nj+'に',jn:nj,loc:1,jt:'raw',e:'📍',typed:1,big:1}); APP.beKind='loc'; pick('state','ls_'+w); }}]; }

// ---- which / how many / how much / what ＋ 名詞（Which book do you read? / How many books do you read?）：たずねる語（q.w）のあとに名詞が来たら、その名詞を「たずねる語」にくっつける ----
export function fwWhNoun(q){ if(typeof APP==='undefined'||APP.active!=='main') return []; const c=AC(); if(!c.q||c.subj||c.pred) return []; const w0=String(c.q.w||''); if(!/^(which|how many|how much|what)$/.test(w0)) return []; if(c.q.wh!=='obj'&&c.q.wh!=='subj') return [];
 const np=String(q||'').trim().toLowerCase(); if(!/^[a-z]+$/.test(np)||/^(time|kind|for|about|else|if|do|does|did|is|are|was|were|can|will|would|should|have|has|had|you|we|they|he|she|it|i|to|a|an|the|my|your|many|much|of)$/.test(np)) return [];
 let nja=null; try{ nja=fwNounJa(np.replace(/s$/,''))||fwNounJa(np); }catch(e){} if(!nja) return []; const en=w0+' '+np; const slot=c.q.wh;
 const wj=slot==='obj'?(w0==='which'?'どの'+nja+'を？':w0==='what'?'何の'+nja+'を？':nja+'をいくつ？'):(w0==='which'?'どの'+nja+'が？':w0==='what'?'何の'+nja+'が？':nja+'がいくつ？');
 return [FWX.O(en,wj,'❓',()=>{ const hl=APP.hist.length; mutate(()=>{ const mm=AC(); if(mm.q){ mm.q.w=en; mm.q.wj=wj; } },null); if(APP.hist.length>hl) APP.hist.pop(); },'wh')]; }

// ---- 比較：taller / the tallest / more expensive / as tall as … than ～ ----
export let FW_CMP_IRR;
export function fwCmpBases(w){ const out=[]; const I=FW_CMP_IRR[w]; if(I) out.push({b:I[0],deg:I[1]});
 const sfx=[['est','most'],['er','more']]; sfx.forEach(([x,deg])=>{ if(w.length>x.length+2&&w.endsWith(x)){ const b=w.slice(0,-x.length); out.push({b,deg}); out.push({b:b+'e',deg}); if(/ier$|iest$/.test(w)||/i$/.test(b)) out.push({b:b.replace(/i$/,'y'),deg}); if(/(.)\1$/.test(b)) out.push({b:b.slice(0,-1),deg}); } }); return out; }
export function fwCmp(q){ if(typeof APP==='undefined'||APP.active!=='main') return []; const c=AC(); const be=(c.pred&&c.pred.k==='s'&&!c.pred.id)||(APP.lsub==='be'&&!c.pred); if(!be) return [];
 const w=String(q||'').toLowerCase(); if(!/^[a-z]{3,}$/.test(w)) return []; const cands=[]; const P=c.cmpP;
 if(P){ cands.push({b:w,deg:P==='as'?'as':P==='most'?'most':'more',typed:0}); } else fwCmpBases(w).forEach(x=>cands.push(Object.assign({typed:1},x)));
 const out=[], seen=new Set(); cands.forEach(cd=>{ let r=[]; try{ r=qbRes1(cd.b); }catch(e){} r.filter(o=>o.act&&o.pos==='adj'&&String(o.en).toLowerCase().replace(/^(a|an|be) /,'')===cd.b&&!seen.has(o.id)).slice(0,2).forEach(o=>{ seen.add(o.id);
  out.push(Object.assign({},o,{id:'fwcmp_'+o.id,en:w,fw:1,gram:1,ahead:cd.deg==='as'?1:0,act:()=>{ o.act(); const hl=APP.hist.length; mutate(()=>{ const cc=AC(); cc.degree=cd.deg; cc.cmpP=null; const sj=cc.pred&&cc.pred.k==='s'?ST(cc.pred.id):null; if(sj&&cd.typed){ if(cd.deg==='more'&&!sj.more) sj.comp=sj.comp||w; if(cd.deg==='most'&&!sj.more) sj.sup=sj.sup||w; } },null); if(APP.hist.length>hl) APP.hist.pop(); }})); }); });
 return out; }


// ---- 命令文の出だし：Don't go. / Please go.（文の頭で、まだ何も打っていないとき）----

// ---- 国・都市の名前を、ふつうの名詞（I like Japan. / Japan is big.）としても使えるようにする ----
export function fwGeoNoun(q){ try{ { const lt=LEX.things.find(t=>String(t.en).toLowerCase()===String(q).toLowerCase()&&(t.t||[]).includes('lang')); if(lt){ const lid='lg_'+lt.id; if(!LEX.idx['people:'+lid]) bigAdd('people',{id:lid,en:lt.en,ja:lt.ja,e:lt.e,p:3,pl:0,thing:1,typed:1,big:1}); return qbRes1(lt.en).filter(o=>o.act&&String(o.id).indexOf(lid)>=0).slice(0,1).map(o=>Object.assign({},o,{fw:1,gram:1})); } } const g=geoLook(q); if(!g||/^the /i.test(q)) return []; const id='geo_'+g.en.toLowerCase().replace(/\W+/g,'_'); if(!LEX.idx['things:'+id]) bigAdd('things',{id,en:g.en,ja:g.ja,e:'🗺️',t:['thing','lang','place'],typed:1,big:1}); if(!LEX.idx['people:'+id]) bigAdd('people',{id,en:g.en,ja:g.ja,e:'🗺️',p:3,pl:0,thing:1,typed:1,big:1}); return qbRes1(g.en).filter(o=>o.act&&String(o.id).indexOf(id)>=0).slice(0,1).map(o=>Object.assign({},o,{fw:1,gram:1})); }catch(e){ return []; } }

// 限定詞＋形容詞＋名詞（a tall girl / the big dog / my new bike）：形容詞ごと焼きこんだ名詞として置く




/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_qfw(){
FWX = (()=>{
 const M=fn=>mutate(()=>{ const c=AC(); c.qfree=true; fn(c); },null);
 const empty=()=>{ const c=AC(); return APP.active==='main' && !c.subj && !c.pred; };
 const beOn=c=>{ c.pred={k:'s',id:null}; c.intens=null; c.adj=null; c.link=null; c.useObj=false; c.obj=null; APP.lsub='be'; APP.beKind='adj'; };
 const unbe=c=>{ if(c.pred&&c.pred.k==='s'&&!c.pred.id){ c.pred=null; APP.lsub=null; } };
 const asQ=c=>{ unbe(c); if(APP.active==='main' && !c.subj && !c.pred && c.type==='normal' && !c.q) c.q={wh:null}; };
 const O=(en,ja,e,act,pos)=>({id:'fw_'+en+'_'+ja,e:e||'🔧',en,ja,pos:pos||'aux',fw:1,act});
 const T={}; const add=(w,o)=>{ (T[w]=T[w]||[]).push(o); };
 // 否定
 add('not',O('not','〜ない','🚫',()=>M(c=>{ c.neg=true; })));
 [["don't",'pres'],["doesn't",'pres'],["didn't",'past']].forEach(([w,t])=>add(w,O(w,t==='past'?'〜しなかった':'〜しない','🚫',()=>M(c=>{ asQ(c); c.neg=true; c.tense=t; }))));
 [["can't",'can',null],['cannot','can',null],["couldn't",'could',null],["won't",'will','fut'],["wouldn't",'would',null],["shouldn't",'should',null],["mustn't",'must',null],["mightn't",'might',null]]
  .forEach(([w,m,t])=>add(w,O(w,'〜できない・〜しない','🚫',()=>M(c=>{ asQ(c); c.modal=m; c.neg=true; if(t) c.tense=t; }))));
 [["haven't",'perf'],["hasn't",'perf'],["hadn't",'pastperf']].forEach(([w,t])=>add(w,O(w,'まだ〜していない','🚫',()=>M(c=>{ asQ(c); c.neg=true; c.tense=t; }))));
 [["isn't",'pres'],["aren't",'pres'],["wasn't",'past'],["weren't",'past']].forEach(([w,t])=>add(w,O(w,'〜ではない','🚫',()=>M(c=>{ asQ(c); beOn(c); c.neg=true; c.tense=t; }))));
 add("ain't",O("ain't",'〜ではない','🚫',()=>M(c=>{ beOn(c); c.neg=true; })));
 // 助動詞
 [['can','can'],['could','could'],['will','will'],['should','should'],['must','must'],['might','might'],['may','may'],["'ll",'will']].forEach(([w,m])=>add(w,O(w,(MODALS.find(x=>x.id===m)||{}).ja||'','🧭',()=>M(c=>{ asQ(c); setModal(c,m); c.tense=m==='will'?'fut':(['past','pastprog','pastperf'].includes(c.tense)&&m!=='will'?c.tense:'pres'); }))));
 [['should','shouldhave','〜しとけばよかった'],['will','willhave','もう〜しているだろう'],['could','couldhave','〜できたかも'],['would','wouldhave','〜しただろう'],['might','mighthave','〜したかも'],['may','mighthave','〜したかも'],['must','musthave','〜したにちがいない']].forEach(([w,m,ja])=>{ const o=O(w+' have',ja,'🕰️',()=>M(c=>{ asQ(c); c.modal=m; c.tense='pres'; })); o.when=()=>!(typeof QS!=='undefined'&&QS.look&&/^to$/i.test(QS.look)); add(w+' have',o); });
 [['shall','shall','〜しましょうか'],['used to','usedto','よく〜したものだ'],['had better','hadbetter','〜したほうがいい'],["'d better",'hadbetter','〜したほうがいい'],['about to','aboutto','まさに〜するところ'],['supposed to','supposedto','〜することになっている'],['would like to','wouldlike','〜したいです'],["'d like to",'wouldlike','〜したいです'],['might as well','mightaswell','〜したほうがまし'],['got to','havegotto','〜しなきゃ'],['happen to','happento','たまたま〜する'],['happens to','happento','たまたま〜する'],['tend to','tendto','〜しがち'],['need to','needto','〜する必要がある'],['needs to','needto','〜する必要がある'],['tends to','tendto','〜しがち'],['managed to','managedto','なんとか〜できた'],['manage to','managedto','なんとか〜できた']].forEach(([w,m,ja])=>{ const o=O(w,ja,'🧩',()=>M(c=>{ asQ(c); c.modal=m; })); o.gram=1; add(w,o); });
 add('would',O('would','〜だろう・〜してくれる？','🧭',()=>M(c=>{ asQ(c); setModal(c,'would'); c.tense='pres'; })));
 [['have to','haveto'],['has to','haveto']].forEach(([w,m])=>add(w,O(w,'しなきゃ','⚠️',()=>M(c=>{ asQ(c); c.modal=m; }))));
 ['can','could','will','would','should','must','might','may'].forEach(m0=>[['have to','haveto','しなきゃ'],['want to','want','したい']].forEach(([w1,id1,ja1])=>{ const w=m0+' '+w1; if(T[w]) return; add(w,O(w,ja1,'🧭',()=>M(c=>{ asQ(c); setModal(c,id1); setModal(c,m0); c.tense=m0==='will'?'fut':(['past','pastprog','pastperf'].includes(c.tense)?c.tense:'pres'); }))); }));
add('had to',O('had to','しなきゃいけなかった','⚠️',()=>M(c=>{ c.modal='haveto'; c.tense='past'; })));
 ['going to','gonna'].forEach(w=>add(w,O(w,'〜するつもり','➡️',()=>M(c=>{ asQ(c); c.modal='goingto'; }))));
 ['want to','wanna'].forEach(w=>add(w,O(w,'したい','💭',()=>M(c=>{ asQ(c); setModal(c,'want'); }))));
 // 時制（do / did / was / have …）
 add('do',O('do','（Do …?／ふつう）','🙋',()=>M(c=>{ asQ(c); c.tense='pres'; })));
 add('does',O('does','（Does …?／ふつう）','🙋',()=>M(c=>{ asQ(c); c.tense='pres'; })));
 add('did',O('did','（Did …?／した）','🙋',()=>M(c=>{ asQ(c); c.tense='past'; })));
 ['was','were'].forEach(w=>{ add(w,O(w,'〜だった・〜にいた','🟰',()=>M(c=>{ asQ(c); beOn(c); c.tense='past'; })));
  add(w,O(w+' …ing','〜していた','⏪',()=>M(c=>{ asQ(c); c.tense='pastprog'; }))); });
 ['is','am','are',"i'm","'m","'re","'s"].forEach(w=>{ if(['is','am','are'].includes(w)) add(w,O(w+' …ing','〜している','▶️',()=>M(c=>{ asQ(c); c.tense='prog'; }))); });
 ['is','am','are','was','were'].forEach(w=>{ const o=O(w,'〜だ・〜にいる','🟰',()=>M(c=>{ asQ(c); beOn(c); c.tense=/^(was|were)$/.test(w)?'past':'pres'; if(c.q&&(c.q.wh==='subj'||c.q.wh==='obj')&&c.q.w) c.q.wh='state'; })); o.beq=1; add(w,o); });
 ['have','has'].forEach(w=>add(w,O(w+' …ed','もう〜した（今につながる）','✅',()=>M(c=>{ asQ(c); c.tense='perf'; }))));
 add('had',O('had …ed','その時もう〜していた','⏮️',()=>M(c=>{ asQ(c); c.tense='pastperf'; })));
 ['have been to','has been to'].forEach(w=>{ const o=O(w,'〜へ行ったことがある','✈️',()=>{ M(c=>{ asQ(c); beOn(c); c.tense='perf'; }); QB.pre='to'; },'aux'); o.gram=1; o.pend=1; add(w,o); });
 ['have been','has been'].forEach(w=>{ add(w,O(w+' …ing','ずっと〜している','🔁',()=>M(c=>{ asQ(c); c.tense='perfprog'; }))); add(w,O(w,'ずっと〜だ','🟰',()=>M(c=>{ asQ(c); beOn(c); c.tense='perf'; }))); });
 add('will be',O('will be …ing','〜しているだろう','⏩',()=>M(c=>{ asQ(c); c.tense='futprog'; })));
 // be / been：あとに〜ing・過去分詞・形容詞・場所がつづく「be の穴」を開く（will be there / have been waiting / must have been tired）
 add('had been',O('had been','ずっと〜だった','🟰',()=>M(c=>{ asQ(c); beOn(c); c.tense='pastperf'; })));
 { const ob=O('being','〜されている（最中）','🟰',()=>M(c=>{ beOn(c); c.beingP=true; })); ob.pend=1; add('being',ob); }
 add('be',O('be','〜である・〜になる','🟰',()=>M(c=>{ beOn(c); })));
 add('been',O('been','（ずっと）〜だった','🟰',()=>M(c=>{ beOn(c); if(!['perf','pastperf','perfprog'].includes(c.tense)) c.tense='perf'; })));
 // 疑問詞
 const wh=(w,k,ja)=>add(w,O(w,ja,'❓',()=>{ if(APP.active!=='main') return; pick('wh',k); if(w==='what'||w==='who'){ const hl=APP.hist.length; mutate(()=>{ const m=APP.S.main; if(m.q) m.q.w=w; },null); if(APP.hist.length>hl) APP.hist.pop(); } },'wh'));
 wh('what','obj','何を？'); wh('what','subj','何が？'); wh('what','action','何をする？'); wh('who','subj','だれが？'); wh('who','obj','だれを？');
 wh('where','place','どこ？'); wh('when','time','いつ？'); wh('why','why','どうして？'); wh('how','manner','どうやって？'); wh('how','state','どう？'); wh('with whom','with','だれと？');
 // how many / what time / how long …
 const whx=(w,k,wj)=>add(w,O(w,wj,'❓',()=>{ if(APP.active!=='main') return; pick('wh',k); const hl=APP.hist.length; mutate(()=>{ const m=APP.S.main; if(m.q){ m.q.w=w; m.q.wj=wj; } },null); if(APP.hist.length>hl) APP.hist.pop(); },'wh'));
 whx('how many','obj','いくつ？'); whx('how much','obj','いくら？'); whx('what time','time','何時に？'); whx('how long','time','どのくらい？'); whx('how often','manner','どのくらいよく？'); whx('how old','state','何歳？'); whx('what kind of','obj','どんな？'); whx('which','obj','どれを？'); whx('what for','why','何のために？');
 // つなぎ（if / when / because …）
 CONJS.forEach(j=>{ const w=j.en; add(w,O(w,j.ja,j.e,()=>{ const m=APP.S.main; openSub('conj',{conj:j.id,front:!m.subj&&!m.pred&&!m.subs.conj}); },'conj')); });
 return {T,O,M,empty};
})();
DETS = {
 'bare':{ja:''},'the':{ja:''},'a':{ja:'',sg:1},'an':{ja:'',sg:1},'my':{ja:'わたしの'},'your':{ja:'あなたの'},'his':{ja:'かれの'},'her':{ja:'かのじょの'},'our':{ja:'わたしたちの'},'their':{ja:'かれらの'},
 'this':{ja:'この',sg:1},'that':{ja:'その',sg:1},'these':{ja:'これらの',pl:1},'those':{ja:'それらの',pl:1},
 'some':{ja:'いくつかの'},'any':{ja:'なにかの'},'every':{ja:'すべての',sg:1},'each':{ja:'それぞれの',sg:1},'another':{ja:'もうひとつの',sg:1},'other':{ja:'ほかの'},
 'two':{ja:'2つの',pl:1},'three':{ja:'3つの',pl:1},'four':{ja:'4つの',pl:1},'five':{ja:'5つの',pl:1},'six':{ja:'6つの',pl:1},'seven':{ja:'7つの',pl:1},'eight':{ja:'8つの',pl:1},'nine':{ja:'9つの',pl:1},'ten':{ja:'10の',pl:1},'eleven':{ja:'11の',pl:1},'twelve':{ja:'12の',pl:1},'thirteen':{ja:'13の',pl:1},'fourteen':{ja:'14の',pl:1},'fifteen':{ja:'15の',pl:1},'sixteen':{ja:'16の',pl:1},'seventeen':{ja:'17の',pl:1},'eighteen':{ja:'18の',pl:1},'nineteen':{ja:'19の',pl:1},'twenty':{ja:'20の',pl:1},'thirty':{ja:'30の',pl:1},'forty':{ja:'40の',pl:1},'fifty':{ja:'50の',pl:1},'hundred':{ja:'100の',pl:1},'many':{ja:'たくさんの',pl:1},'few':{ja:'少しの',pl:1},'several':{ja:'いくつもの',pl:1},'both':{ja:'両方の',pl:1},
 'a few':{ja:'少しの',pl:1},'a couple of':{ja:'2、3の',pl:1},'a lot of':{ja:'たくさんの'},'lots of':{ja:'たくさんの'},'a bit of':{ja:'少しの',unc:1},'plenty of':{ja:'たくさんの'},
 'much':{ja:'たくさんの',unc:1},'a little':{ja:'少しの',unc:1},'little':{ja:'ほとんどない',unc:1},'a little more':{ja:'もう少しの',unc:1},'more':{ja:'もっと'},'enough':{ja:'十分な'},'all':{ja:'すべての'},'most':{ja:'ほとんどの'},'no':{ja:'どの',negq:1},'neither':{ja:'どちらの',sg:1,negq:1},
 'the same':{ja:'同じ'},'the other':{ja:'もう一方の'},'the whole':{ja:'まるごとの'},'the first':{ja:'最初の'},'the last':{ja:'最後の'},'the next':{ja:'次の'},'the only':{ja:'ただ一つの'},
};
DETKEYS = Object.keys(DETS).sort((a,b)=>b.split(' ').length-a.split(' ').length||b.length-a.length);
IRR_PL = {man:'men',woman:'women',child:'children',person:'people',foot:'feet',tooth:'teeth',mouse:'mice',fish:'fish',sheep:'sheep',wife:'wives',knife:'knives',leaf:'leaves',life:'lives',shelf:'shelves',half:'halves'};
DETRE_STRIP = /^(a|an|the|some|any|my|your|his|her|our|their|this|that|these|those)\s+/i;
FWX.T['to']=[FWX.O('to','（〜する）to＋動詞','➡️',()=>{ let c=AC(), v=predV(c); if(!v&&APP.active==='comp'){ const mm=APP.S.main, ic=mm.subs.comp&&mm.subs.comp.c; if(ic&&!ic.subj&&!ic.pred&&!ic.q&&!ic.vform&&predV(mm)&&vcOf(predV(mm))){ c=mm; v=predV(mm); } }
 if(v && vcOf(v) && !c.obj){ const f=vcForms(v); openVc(f.includes('to')?'to':f[0]); return; }
 if(v && ['want_o','caus_want','want'].includes(v.id)){ FWX.M(c=>{ c.pred=null; c.useObj=false; c.obj=null; c.modal='want'; APP.lsub=null; }); return; }
 if((c.modal && ['want','haveto','goingto'].includes(c.modal)) || c.semi) { toast('to は入っています。つぎの動詞を打ってね'); return; }
 toast('to ＋ 場所は、場所のことばをそのまま打ってね（school など）'); }) ];
if(typeof FREQ!=='undefined'){ FREQ.want_o=Math.max(FREQ.caus_want||0,FREQ.want||0,96); FREQ.know_o=Math.max(FREQ.know||0,60); }
FW_IRR = null;
FW_IRRL = ('be was been|beat beat beaten|become became become|begin began begun|bend bent bent|bite bit bitten|blow blew blown|break broke broken|bring brought brought|build built built|buy bought bought|catch caught caught|choose chose chosen|come came come|cost cost cost|cut cut cut|do did done|draw drew drawn|drink drank drunk|drive drove driven|eat ate eaten|fall fell fallen|feel felt felt|fight fought fought|find found found|fly flew flown|forget forgot forgotten|forgive forgave forgiven|get got gotten|give gave given|go went gone|grow grew grown|hang hung hung|have had had|hear heard heard|hide hid hidden|hit hit hit|hold held held|hurt hurt hurt|keep kept kept|know knew known|lay laid laid|lead led led|leave left left|lend lent lent|let let let|lie lay lain|lose lost lost|make made made|mean meant meant|meet met met|pay paid paid|put put put|read read read|ride rode ridden|ring rang rung|rise rose risen|run ran run|say said said|see saw seen|sell sold sold|send sent sent|set set set|shake shook shaken|shoot shot shot|show showed shown|shut shut shut|sing sang sung|sink sank sunk|sit sat sat|sleep slept slept|speak spoke spoken|spend spent spent|stand stood stood|steal stole stolen|swim swam swum|take took taken|teach taught taught|tell told told|think thought thought|throw threw thrown|understand understood understood|wake woke woken|wear wore worn|win won won|write wrote written|dream dreamt dreamt|burn burnt burnt|learn learnt learnt|lean leant leant|spell spelt spelt|spill spilt spilt|sweep swept swept|weep wept wept|creep crept crept|deal dealt dealt|dig dug dug|feed fed fed|bleed bled bled|breed bred bred|flee fled fled|forbid forbade forbidden|freeze froze frozen|hang hung hung|light lit lit|quit quit quit|seek sought sought|shine shone shone|slide slid slid|spin spun spun|split split split|spread spread spread|stick stuck stuck|sting stung stung|strike struck struck|swear swore sworn|tear tore torn|wind wound wound').split('|').map(r=>r.split(' '));
(function(){ const m={}; FW_IRRL.forEach(r=>{ m[r[0]]=r; }); try{ (BIGX.v||[]).forEach(e=>{ const r=m[e.w]; if(r&&!e.past){ e.past=r[1]; e.pp=r[2]; } }); (LEX.verbs||[]).forEach(v=>{ const r=m[v.en]; if(r&&!v.past&&r[1]!==r[0]){ v.past=r[1]; v.pp=r[2]; } }); }catch(e){} })();
FW_SAME = new Set(FW_IRRL.filter(r=>r[0]===r[1]&&r[0]===r[2]).map(r=>r[0]));
PP_JA = {'in front of':['の前で','の前へ'],'next to':['の横で','の横へ'],to:['へ','へ'],at:['で','へ'],in:['で','へ'],on:['の上で','の上へ'],near:['の近くで','の近くへ'],by:['のそばで','のそばへ'],under:['の下で','の下へ'],over:['の上を','の上を'],behind:['の後ろで','の後ろへ'],inside:['の中で','の中へ'],outside:['の外で','の外へ'],across:['を渡って','を渡って'],from:['から','から'],into:['の中へ','の中へ'],around:['のまわりで','のまわりへ'],through:['を通って','を通って'],between:['の間で','の間へ'],toward:['のほうへ','のほうへ'],towards:['のほうへ','のほうへ']};
NUMW = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,a:1,an:1,half:0.5};
UNITJA = {second:'秒',minute:'分',hour:'時間',day:'日',week:'週間',month:'か月',year:'年'};
TS_ALL = ['pres','prog','past','pastprog','perf','perfprog','fut','futprog','pastperf','pastperfprog','futperf','futperfprog'];
DETJA = {my:'わたしの',your:'あなたの',his:'かれの',her:'かのじょの',our:'わたしたちの',their:'かれらの',this:'この',that:'その',these:'これらの',those:'それらの'};
[',',';','then'].forEach(w=>{ (FWX.T[w]=FWX.T[w]||[]).push(FWX.O(w==='then'?'then':',','（この部分をおえて、もとの文へ）','↩️',()=>{ if(APP.active!=='main') setActive('main'); else toast('もとの文です'); },'conj')); });
['that','who','which','whom'].forEach(w=>{ const add=(en,ja,head,gap)=>(FWX.T[w]=FWX.T[w]||[]).push(FWX.O(en,ja,'🔗',()=>{ openSub('rel',{head,gap}); },'conj'));
 const can=()=>{ const m=APP.S.main; const o=[]; if(APP.active!=='main') return o; const sref=m.passive?m.obj:m.subj; const oref=m.passive?null:m.obj; const ok=r=>r&&N(r)&&!N(r).pron&&!N(r).poss;
  if(ok(oref)&&needsObj(m)){ o.push({head:'obj',gap:'s',ja:N(oref).ja+'が〜する（'+w+' …works）'}); o.push({head:'obj',gap:'o',ja:N(oref).ja+'を〜する（'+w+' we …）'}); }
  if(ok(sref)&&!m.pred){ o.push({head:'subj',gap:'s',ja:N(sref).ja+'が〜する（'+w+' …works）'}); }
  return o; };
 FWX.T[w]=FWX.T[w]||[]; FWX.T[w].dyn=can; });
TAGRE = /^(do|does|did|is|are|am|was|were|can|could|will|would|should|have|has|had|must|may|might|shall)(n't| not)? (you|i|he|she|it|we|they|there)$/i;
[['there is','pres'],['there are','pres'],['there was','past'],['there were','past']].forEach(([w,t])=>(FWX.T[w]=FWX.T[w]||[]).push((()=>{ const o=FWX.O(w,'〜がある・いる','☝️',()=>{ try{ const c0=AC(), v0=predV(c0); if(v0&&v0.fr==='cl'&&APP.active==='main'&&!c0.subs.comp) cwStart('that'); }catch(e){} FWX.M(c=>{ if(!c.subj&&!c.pred){ c.type='exist'; c.tense=t; } }); }); o.lax=1; o.when=()=>{ try{ const c=AC(), v=predV(c); return !(c.pred&&c.pred.k==='v')||!!(v&&v.fr==='cl'&&APP.active==='main'&&!c.subs.comp); }catch(e){ return true; } }; return o; })()));
[["there isn't",'pres'],["there aren't",'pres'],["there wasn't",'past'],["there weren't",'past'],['there will be','fut'],["there won't be",'fut']].forEach(([w,t])=>{ const o=FWX.O(w,'〜がない・いない','☝️',()=>FWX.M(c=>{ if(!c.subj&&!c.pred){ c.type='exist'; c.tense=t; c.neg=/n't/.test(w); } })); o.when=()=>{ const c=APP.S.main; return !c.subj&&!c.pred; }; (FWX.T[w]=FWX.T[w]||[]).push(o); });
[['is there','pres',0],['are there','pres',0],['was there','past',0],['were there','past',0],["isn't there",'pres',1],["aren't there",'pres',1],["wasn't there",'past',1],["weren't there",'past',1],['will there be','fut',0]].forEach(([w,t,n])=>{ const o=FWX.O(w,'〜はある？','☝️',()=>FWX.M(c=>{ if(!c.subj&&!c.pred){ c.type='exist'; c.tense=t; c.neg=!!n; c.q={wh:null}; } })); o.when=()=>{ const c=APP.S.main; return !c.subj&&!c.pred; }; (FWX.T[w]=FWX.T[w]||[]).push(o); });
{ const _sc=sentenceComplete; set_sentenceComplete(function(S){ let r=_sc.apply(this,arguments); if(r) return r; try{ const m=S&&S.main; if(m && m.type==='normal' && !m.subj && !m.pred && !m.q && !Object.keys(m.subs||{}).length && (m.lead||m.time||m.place||m.manner||m.with)) return true; }catch(e){} return r; }); }
ADJP = {in:['of'],ready:['to','for'],able:['to'],unable:['to'],happy:['to','about','with'],glad:['to'],sad:['to','about'],sure:['of','about'],afraid:['of','to'],scared:['of','to'],good:['at','for','to'],bad:['at','for'],great:['at','for'],proud:['of'],tired:['of','from'],interested:['in'],excited:['about','to'],worried:['about'],angry:['at','with','about'],busy:['with'],free:['to','for'],hard:['to','for'],easy:['to','for'],difficult:['to','for'],nice:['to','for'],kind:['to'],late:['for'],famous:['for'],full:['of'],ready2:[],sorry:['to','for','about'],lucky:['to'],likely:['to'],willing:['to'],eager:['to'],thankful:['for'],thirsty:['for'],responsible:['for'],different:['from','to'],similar:['to'],close:['to'],new:['to'],afraid2:[]};
ADJP_JA = {to:'に',for:'に',at:'が',of:'を',about:'について',with:'と',in:'に',from:'から',on:'に',by:'に',into:'に',over:'に'};
AP2 = {'afraid of':'が こわい','scared of':'が こわい','proud of':'が 誇らしい','famous for':'で 有名だ','full of':'で いっぱいだ','tired of':'に うんざりしている','tired from':'で つかれている','happy with':'に 満足している','happy about':'が うれしい','glad about':'が うれしい','sad about':'が かなしい','sorry for':'に すまないと思っている','sorry about':'が 残念だ','sure of':'を 確信している','sure about':'に 自信がある','angry at':'に おこっている','angry with':'に おこっている','angry about':'に おこっている','excited about':'に わくわくしている','worried about':'が 心配だ','busy with':'で いそがしい','kind to':'に 親切だ','nice to':'に やさしい','late for':'に おくれている','ready for':'の 準備ができている','different from':'と ちがう','similar to':'に 似ている','close to':'に 近い','responsible for':'に 責任がある','thankful for':'に 感謝している','thirsty for':'に 飢えている','surprised at':'に おどろいている','surprised by':'に おどろいている','shocked at':'に ショックを受けている','disappointed with':'に がっかりしている','disappointed in':'に がっかりしている','jealous of':'に しっとしている','crazy about':'に 夢中だ','keen on':'に 熱心だ','fond of':'が 好きだ','good for':'に いい','bad for':'に よくない','great at':'が とくいだ','married to':'と 結婚している','satisfied with':'に 満足している','pleased with':'に 満足している','bored with':'に あきている','bored of':'に あきている','used to':'に 慣れている','careful with':'に 気をつけている','afraid about':'が 心配だ','nervous about':'が ふあんだ','confused about':'が わからない'};
FW_BELOC = {here:'ここ',there:'あそこ',home:'家',upstairs:'2階',downstairs:'1階',outside:'外',inside:'中',abroad:'海外',nearby:'近く'};
FW_CMP_IRR = {better:['good','more'],best:['good','most'],worse:['bad','more'],worst:['bad','most'],farther:['far','more'],further:['far','more'],elder:['old','more'],older:['old','more'],oldest:['old','most'],eldest:['old','most']};
(function(){ const be=()=>{ const c=AC(); return (c.pred&&c.pred.k==='s'&&!c.pred.id)||(APP.lsub==='be'&&!c.pred); };
 [['more','more'],['most','most'],['as','as']].forEach(([w,deg])=>{ const o=FWX.O(w,'比べる','⚖️',()=>FWX.M(c=>{ c.cmpP=deg; })); o.pend=1; o.when=()=>be()&&!AC().cmpP&&!AC().degree; (FWX.T[w]=FWX.T[w]||[]).push(o); });
 [['fast','fast'],['hard','hard'],['well','well'],['slowly','slowly'],['quietly','quietly'],['loudly','loudly'],['happily','happily'],['carefully','carefully'],['quickly','quickly']].forEach(([w,id])=>{ if(!LEX.idx['manners:'+id]) return; const k='as '+w+' as'; const o=FWX.O(k,'同じくらい','⚖️',()=>{ pick('manner',id); pick('mdeg','as'); APP.hist.pop(); },'adv'); o.gram=1; o.pend=1; o.when=()=>{ const c=AC(), v=predV(c); return APP.active!=='x'&&!!v&&!c.manner&&c.pred&&c.pred.k==='v'&&(!needsObj(c)||!!c.obj||v.fr==='both'); }; (FWX.T[k]=FWX.T[k]||[]).push(o); });
 ['am','is','are','was','were','do','does','did','can','will','could','would','have','has'].forEach(w=>{ const o=FWX.O(w,'','⚖️',()=>{ mutate(()=>{ AC().tAux=w; },null); APP.hist.pop(); },'aux'); o.gram=1; o.eat=1; o.when=()=>{ const c=AC(); if(c.tAux!=='') return false; const ref=(c.degree==='more'||c.degree==='as')&&c.than?c.than:((c.mdeg==='more'||c.mdeg==='as')&&c.mthan&&!/^x:/.test(c.mthan)?c.mthan:null); if(!ref||!N(ref)) return false; return true; }; (FWX.T[w]=FWX.T[w]||[]).unshift(o); });
 { const o=FWX.O('than','より','⚖️',()=>FWX.M(c=>{ })); o.pend=1; o.when=()=>{ const c=AC(); return (c.degree==='more'&&!c.than)||(c.mdeg==='more'&&c.manner&&!c.mthan); }; (FWX.T['than']=FWX.T['than']||[]).push(o); }
 (FWX.T['home']=FWX.T['home']||[]).push((()=>{ const o=FWX.O('home','家に','🏠',()=>{ pick('place','home'); mutate(()=>{ AC().pbare=1; },null); APP.hist.pop(); },'adv'); o.gram=1; o.when=()=>{ const c=AC(), v=predV(c); return !!v&&!v.motion&&v.fr==='intr'&&!c.place&&['stay','x_stay'].includes(v.id); }; return o; })());
 ['myself','yourself','himself','herself','itself','ourselves','themselves','by myself','by yourself','by himself','by herself','by ourselves','by themselves'].forEach(w=>{ const o=FWX.O(w,'自分で','🚶',()=>{ pick('with','self_'+w); },'adv'); o.gram=1; o.when=()=>{ const c=AC(), v=predV(c); if(!v||c.with||!c.subj||c.type!=='normal') return false; if(needsObj(c)&&!c.obj) return false; const subj=N(c.subj); const rf={i:'myself',you:'yourself',he:'himself',she:'herself',it:'itself',we:'ourselves',they:'themselves'}[String(c.subj).replace(/^p:/,'')]; return !!rf&&w.replace(/^by /,'')===rf; }; (FWX.T[w]=FWX.T[w]||[]).push(o); });
{ const o=FWX.O('not only','〜だけでなく','➕',()=>{ mutate(()=>{ AC().nonly=1; },null); APP.hist.pop(); },'adv'); o.gram=1; o.pend=1; o.when=()=>{ const c=APP.S.main; return APP.active==='main'&&!!c.pred&&c.pred.k==='s'&&!c.pred.id&&!c.nonly; }; (FWX.T['not only']=FWX.T['not only']||[]).push(o); }
[['how about','how'],['what about','what']].forEach(([w,hw])=>{ const o=FWX.O(w,'〜はどう？','💡',()=>FWX.M(c=>{ if(!c.subj&&!c.pred){ c.type='hab'; c.habw=hw; c.tense='pres'; } })); o.gram=1; o.when=()=>{ const c=APP.S.main; return APP.active==='main'&&!c.subj&&!c.pred&&c.type==='normal'; }; (FWX.T[w]=FWX.T[w]||[]).push(o); });
 ['a lot','very much','so much'].forEach(w=>{ const o=FWX.O(w,'とても','➕',()=>{ pick('manner','a_lot'); mutate(()=>{ AC().mtxt=w; },null); APP.hist.pop(); },'adv'); o.gram=1; o.when=()=>{ const c=AC(), v=predV(c); return !!v&&!!v.stative&&!c.manner&&(!needsObj(c)||!!c.obj); }; (FWX.T[w]=FWX.T[w]||[]).push(o); });
 { const o=FWX.O('only','だけ','☝️',()=>{ mutate(()=>{ AC().only=1; },null); APP.hist.pop(); },'adv'); o.gram=1; o.when=()=>{ const c=AC(); return !!c.subj&&!c.only&&!(c.pred&&c.pred.k==='s')&&!c.neg; }; (FWX.T['only']=FWX.T['only']||[]).push(o); }
 ['both','all'].forEach(w=>{ const o=FWX.O(w,w==='both'?'ふたりとも':'みんな','👥',()=>{ mutate(()=>{ AC().quant=w; },null); APP.hist.pop(); },'adv'); o.gram=1; o.when=()=>{ const c=AC(); const sj=c.passive?c.obj:c.subj; return !!sj&&!c.quant&&!c.pred&&['p:we','p:you','p:they'].includes(sj); }; (FWX.T[w]=FWX.T[w]||[]).push(o); });
 [['faster','fast'],['harder','hard'],['better','well'],['more slowly','slowly'],['more quietly','quietly'],['more loudly','loudly'],['more happily','happily'],['more carefully','carefully'],['more','a_lot']].forEach(([w,id])=>{ const o=FWX.O(w,'もっと','📶',()=>{ const st=w==='better'&&predV(AC())&&predV(AC()).stative; pick('manner',st?'a_lot':id); pick('mdeg','more'); mutate(()=>{ AC().mfree=1; if(st) AC().mtxt='better'; },null); APP.hist.pop(); },'adv'); o.gram=1; o.when=()=>{ const c=AC(), v=predV(c); return !!v&&!c.manner&&(!needsObj(c)||!!c.obj||v.fr==="both")&&!(v.stative&&id==='a_lot')&&!(w==='better'&&c.pred&&c.pred.k==='s'); }; (FWX.T[w]=FWX.T[w]||[]).push(o); });
 { const o=FWX.O('to','〜するために','🎯',()=>{ openSub('purpose',{}); },'conj'); o.late=1; o.opens=1; o.gram=0; o.when=()=>{ if(APP.active!=='main') return false; const m=APP.S.main; if(m.subs.purpose||m.subs.comp) return false; let ok=false; try{ ok=sentenceComplete(APP.S); }catch(e){} return ok&&!!predV(m)&&m.type==='normal'; }; (FWX.T['to']=FWX.T['to']||[]).push(o); }
 [0,1].forEach(late=>{ const o=FWX.O('to','〜するための','🔗',()=>{ openSub('rel',{head:'obj',gap:'o'}); mutate(()=>{ const r=APP.S.main.subs.rel; if(r){ r.inf=1; r.c.inf0=1; r.c.tense='pres'; } },null); APP.hist.pop(); },'conj'); o.opens=1; if(late) o.late=1; o.when=()=>{ if(APP.active!=='main') return false; const m=APP.S.main; if(m.subs.rel||m.subs.purpose||m.subs.comp||!m.obj||m.passive||!predV(m)||!needsObj(m)) return false; const nn=N(m.obj); const ind=!!(nn&&/^(some|any|no)(thing|one|body)$/.test(String(nn.en))); if(!ind&&!relAble(m.obj)) return false; if(late) return true; return ind||['have','need','want_o','x_get','get'].includes(predV(m).id); }; o.pend=1; (FWX.T['to']=FWX.T['to']||[]).push(o); });
 { const CT={want:'caus_want',want_o:'caus_want',ask:'caus_ask',tell:'caus_tell',caus_want:'caus_want',caus_ask:'caus_ask',caus_tell:'caus_tell'}; const o=FWX.O('to','〜してほしい','👉',()=>{ const m=APP.S.main, v=predV(m), tw=CT[v.id]; const po0=m.obj||m.iobj; if(v.id!==tw) swapVerb(tw); if(APP.S.main.obj!==po0){ mutate(()=>{ const mm=APP.S.main; mm.obj=po0; mm.iobj=null; mm.useObj=true; },null); APP.hist.pop(); } openSub('caus',{}); },'conj'); o.opens=1; o.pend=1; o.gram=1; o.causTo=1; o.when=()=>{ if(APP.active!=='main') return false; const m=APP.S.main, v=predV(m); if(!v||!CT[v.id]||m.subs.caus||m.passive) return false; const po=m.obj||m.iobj; if(!po) return false; return /^p:(i|we|you|he|she|they)$/.test(String(po))||isPerson(po); }; (FWX.T['to']=FWX.T['to']||[]).unshift(o); }
 { const base=(FWX.T['to']||[]).find(o=>o.causTo); if(base){ const mk=()=>{ const o=FWX.O('not to','〜しないで','👉',()=>{ base.act(); const hl=APP.hist.length; mutate(()=>{ const sc=APP.S.main.subs.caus&&APP.S.main.subs.caus.c; if(sc) sc.neg=true; },null); if(APP.hist.length>hl) APP.hist.pop(); },'conj'); o.opens=1; o.pend=1; o.lax=1; o.gram=1; o.when=base.when; return o; }; FWX.T['not to']=[mk()]; FWX.T['not']=(FWX.T['not']||[]).concat([mk()]); } }
 window.CLADJ=/^(sure|certain|glad|sorry|afraid|proud|surprised|aware|worried|pleased|relieved|disappointed|happy|sad|angry|excited|thrilled|lucky)$/;
window.stCl=function(){ const m=APP.S.main; const s=m.pred&&m.pred.k==='s'&&m.pred.id?ST(m.pred.id):null; return !!(s&&CLADJ.test(String(s.en).toLowerCase())&&!m.subs.comp&&!m.sobj&&m.type==='normal'&&APP.active==='main'); }
{ const o=FWX.O('that','〜と','💬',()=>FWX.M(c=>{ })); o.gram=1; o.when=stCl; o.act=()=>{ cwStart('that'); mutate(()=>{ const ic=APP.S.main.subs.comp&&APP.S.main.subs.comp.c; if(ic) ic.that=1; },null); APP.hist.pop(); }; (FWX.T['that']=FWX.T['that']||[]).unshift(o); }
{ const o=FWX.O('that','〜と','💬',()=>FWX.M(c=>{ })); o.gram=1; o.when=()=>{ const m=APP.S.main, v=predV(m); if(!v||v.fr!=='cl'||v.whOnly) return false; if(APP.active==='comp') { const ic=m.subs.comp&&m.subs.comp.c; return !!ic&&!ic.subj&&!ic.pred&&!ic.q&&!ic.cif; } return false; }; const a0=o.act; o.act=()=>{ const m=APP.S.main, v=predV(m); if(APP.active==='main'&&v&&CW_V.includes(v.id)&&!m.subs.comp) cwStart('that'); mutate(()=>{ const ic=APP.S.main.subs.comp&&APP.S.main.subs.comp.c; if(ic) ic.that=1; },null); APP.hist.pop(); }; (FWX.T['that']=FWX.T['that']||[]).unshift(o); }
 { const o=FWX.O('that','〜と','💬',()=>FWX.M(c=>{ })); o.pend=1; o.gram=1; o.when=()=>{ if(CW_V.includes((predV(APP.S.main)||{}).id)===false) return false; const m=APP.S.main, v=predV(m); if(!v||v.fr!=='cl'||v.whOnly) return false; if(APP.active==='comp') return false; return APP.active==='main'&&!m.subs.comp&&CW_V.includes(v.id); }; const a0=o.act; o.act=()=>{ const m=APP.S.main, v=predV(m); if(APP.active==='main'&&v&&CW_V.includes(v.id)&&!m.subs.comp) cwStart('that'); mutate(()=>{ const ic=APP.S.main.subs.comp&&APP.S.main.subs.comp.c; if(ic) ic.that=1; },null); APP.hist.pop(); }; (FWX.T['that']=FWX.T['that']||[]).push(o); }
 { const o=FWX.O('better','','☝️',()=>FWX.M(c=>{ })); o.eat=1; o.when=()=>{ const c=AC(); return c.modal==='hadbetter'; }; (FWX.T['better']=FWX.T['better']||[]).unshift(o); }
 { const o=FWX.O('as','と同じくらい','⚖️',()=>FWX.M(c=>{ })); o.eat=1; o.when=()=>{ const c=AC(); return c.degree==='as'&&!c.than; }; (FWX.T['as']=FWX.T['as']||[]).push(o); } })();
(function(){ const empty=()=>{ try{ const c=AC(); return APP.active==='main'&&frLiveEmpty()&&!(APP.S.seg&&APP.S.seg.length)&&!c.subj&&!c.pred&&c.type==='normal'; }catch(e){ return false; } };
 const imp=(neg,pl,lt)=>()=>{ entry('impdo'); const hl=APP.hist.length; mutate(()=>{ const c=AC(); if(neg) c.neg=true; if(pl) c.imp='please'; if(lt) c.imp='lets'; },null); if(APP.hist.length>hl) APP.hist.pop(); };
 [["don't",1,0,0],['do not',1,0,0],['please',0,1,0],["let's",0,0,1],['let us',0,0,1]].forEach(([w,n,pl,lt])=>{ const o=FWX.O(w,lt?'〜しよう':n?'〜しないで':'〜してください','📢',imp(n,pl,lt)); o.pend=1; o.imp=1; o.gram=1; o.when=()=>empty()&&(!(AC().q)); (FWX.T[w]=FWX.T[w]||[]).push(o); }); })();
window.fwDetAdj=function(q,bare){ try{ let sp=fwSplitDet(String(q||'').toLowerCase().trim()); if(!sp&&bare) sp={det:'bare',rest:String(q||'').toLowerCase().trim()}; if(sp&&sp.det&&/\s(best|worst|same|first|last|next|other|only|whole)$/.test(sp.det)){ const m=String(q).toLowerCase().trim().split(/\s+/); sp={det:m[0],rest:m.slice(1).join(' ')}; } if(!sp||!sp.rest) return []; const ws=sp.rest.split(/\s+/); if(ws.length<2||ws.length>3||ws.some(w=>!/^[a-z]+$/.test(w))) return [];
  const nw=ws[ws.length-1]; if(/^(at|of|for|in|on|to|with|about|from|by|into|over|than|as|and|or|but|that|who|which|when|where|while|if|because|so|too|not|also|up|down|out|off|away|than|after|before|until|since|like|him|her|them|it|us|me|you|then|there|here|now)$/.test(nw)) return []; const adjs=ws.slice(0,-1); const parts=[]; let very=false;
  const ORDJ={own:'自分自身の',same:'同じ',first:'最初の',last:'最後の',next:'次の',other:'ほかの',only:'ただ一つの',whole:'まるごとの',main:'おもな'}; for(const a of adjs){ if(ORDJ[a]){ parts.push({id:'ord_'+a,en:a,attr:ORDJ[a],isDeg:1}); continue; } if(a==='very'||a==='really'){ if(very||parts.length) return []; very=a; continue; } const IRRC={better:['good',0],best:['good',1],worse:['bad',0],worst:['bad',1]}; const ir=IRRC[a]; if(ir){ const g0=(LEX.states||[]).find(x=>!x.noun&&String(x.en).toLowerCase()===ir[0]); if(g0){ parts.push({id:g0.id+(ir[1]?'_sup':'_cmp'),en:a,attr:(ir[1]?'いちばん':'もっと')+attrJa(g0),isDeg:1}); continue; } }
  const gd=(LEX.states||[]).find(x=>!x.noun&&!x.weather&&!x.loc&&(String(x.sup||x.en+'est').toLowerCase()===a||String(x.comp||x.en+'er').toLowerCase()===a)&&String(x.en).toLowerCase()!==a); if(gd){ const isSup=String(gd.sup||gd.en+'est').toLowerCase()===a; parts.push({id:gd.id+(isSup?'_sup':'_cmp'),en:a,attr:(isSup?'いちばん':'もっと')+attrJa(gd),isDeg:1}); continue; } let aj=(LEX.states||[]).find(x=>String(x.en).toLowerCase()===a&&!x.noun&&!x.weather&&!x.loc); if(!aj){ const r0=qbRes1(a).find(o=>o.pos==='adj'&&!/^big:n:/.test(String(o.id))&&String(o.en).toLowerCase()===a); if(r0) aj=ST(String(r0.id).replace(/^.*?:/,''))||null; } if(!aj||!aj.id||!ST(aj.id)) return []; parts.push(aj); }
  if(!parts.length||(very&&parts.length>1)) return [];
  const comp={id:parts.map(x=>x.id).join('_'),en:(very?very+' ':'')+parts.map(x=>x.en).join(' '),attr:(very?(very==='very'?'とても':'本当に'):'')+parts.map(x=>x.isDeg?x.attr:attrJa(x)).join('')};
  if(nw==='one'&&!/^(this|that)$/.test(sp.det)){ if(!LEX.idx['people:one_n']) bigAdd('people',{id:'one_n',en:'one',ja:'の',e:'👉',p:3,pl:0,thing:1,typed:1,big:1}); } const kd=QB.det; let r=[]; try{ r=qbRes(sp.det+' '+nw); }catch(e){ r=[]; } finally{ QB.det=kd; }
  return r.filter(o=>o.act&&(o.pos==='noun'||o.pos==='adj')&&!/^(fr_|fwdet_|fwpre)/.test(String(o.id))).slice(0,3).map(o=>Object.assign({},o,{id:'fwda_'+o.id,en:String(q).trim(),fw:1,gram:1,act:()=>{ let cp=comp; try{ const pid=String(o.id).replace(/^[a-z0-9]+:(?=[a-z])/i,''); if(/古い/.test(comp.attr)&&(P(pid)||P(String(o.id).replace(/^.*?:/,''))||/^big:(p|an):/.test(String(o.id))&&!/^big:an:/.test(String(o.id)))) cp=Object.assign({},comp,{attr:comp.attr.replace('古い','年配の')}); }catch(e){} QB.adjP=cp; try{ o.act(); }finally{ QB.adjP=null; } }})); }catch(e){ QB.adjP=null; return []; } };
window.fwBareAdj=function(q){ try{ if(QB.det||QB.pre||QB.mod) return []; const t=String(q||'').toLowerCase().trim().split(/\s+/); if(t.length<2||t.length>3||t.some(w=>!/^[a-z]+$/.test(w))) return []; if(DETS[t[0]]||QB_PREPS.includes(t[0])||fwSplitDet(t.join(' '))||!qspAdjWord(t[0])) return []; if(/^(it|him|her|them|me|us|you|he|she|we|they|i|who|what|there|this|that|these|those|one|ones|himself|herself|themselves|myself)$/.test(t[t.length-1])) return []; if(/(ed|ing)$/.test(t[0])&&(AC().subj||QS.st.length)) return []; if(QS.st.length&&((LEX.verbs||[]).some(v=>v.en===t[0])||(typeof BIGX!=='undefined'&&BIGX.v.some(x=>x.w===t[0])))) return []; return fwDetAdj(t.join(' '),1); }catch(e){ return []; } };
}
