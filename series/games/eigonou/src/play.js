import { ENV } from './env.js';
import { addSpecFor, openAddWord } from './addword.js';
import { CEFR_LV } from './cefr_map.js';
import { DB, REG, SET, autoExtra, makeItem, refreshLex, renderReg, renderSets, renderSettings, save, say, toast } from './common.js';
import { CW_V } from './embed.js';
import { CJ, CONJS, FRONTS, FRP, FRT, INTENS, LEADF, LEX, MD, MN, N, P, PARTICLE, PL, POSS_EN, PVBASE, REALMOD, SCOPE, ST, SUBJ_PRON, T, TENSES, TENSE_ORDER, TENSE_UI, TLVL, TM, V, WH_JA, adjJa, agrOf, allowedModals, allowedTenses, cap, fixTense, indef, isPerson, isPersonVerb, isPronRef, modalChunkJa, needsObj, newClause, nounTags, objNP, pp, predHead, predS, predV, sentenceComplete, sentenceJa, sentenceParts, sentenceText, setModal, vform, withJa } from './engine.js';
import { fukuBar, fukuBtn } from './fuku.js';
import { I18N, applyI18n, tx } from './i18n.js';
import { MPAT, SPREP } from './idioms.js';
import { locInfo, locOpts, locScene, locStrip } from './loc.js';
import { emoFlip, modalBubbleHtml, motionBubble, motionObjCls, motionReplay, motionSubjCls } from './motion.js';
import { NOTO } from './noto_map.js';
import { objRanked } from './objrank.js';
import { PR, prNew, renderPrac } from './prac.js';
import { qspClObj } from './qsp.js';
import { FRAME_IDS, finStageGo, handArm, mbCenter, openFrameStart, reelBandHtml, reelChunksHtml, reelScrollBand } from './reel.js';
import { SB, sbDockHtml, sbFinHide, sbReflSync } from './slot.js';
import { isVc, vcForms, vcOf } from './vcomp.js';
import { FREQADV } from './vocab_a1.js';
// ================= PLAY: canvas-first =================
export let APP;
export let AC;
export let LV;
export let isFree;
export let $;
export let esc;
export function notoOf(e){ if(!e||typeof NOTO==='undefined') return null; return NOTO[e]||NOTO[e+'\uFE0F']||NOTO[String(e).replace(/\uFE0F/g,'')]||null; }
export function ico(e,cls){ if(e && /^data:image/.test(e)) return `<img class="${cls||'ic'}" src="${e}" alt="">`; const nu=notoOf(e); if(nu) return `<img class="${cls||'ic'} noto" src="${nu}" alt="">`; return `<span class="${cls||'ic'}">${e||'▫️'}</span>`; }
export function isEmptyMain(){ const c=APP.S.main; return c.type==='normal' && !c.subj && !c.pred && !c.time && !c.place && !c.q && !c.modal && !c.manner && !c.with && Object.keys(c.subs).length===0; }
export function isEmptyMainFront(){ const c=APP.S.main; return c.type==='normal' && !c.subj && !c.pred && !c.time && !c.place && !c.q && !c.modal && !c.manner && !c.with && Object.keys(c.subs).every(k=>k==='conj'&&c.subs.conj&&c.subs.conj.front&&c.subs.conj.c&&!!c.subs.conj.c.pred); }
export function objFits(v, ref){ if(window.SB_ANYOBJ) return true; if(typeof objRanked==='function'&&objRanked(v,ref)) return true; if(window.SB_ANYOBJ) return true; if(ref==='p:it'||ref==='p:they'){ return true; } { const n=N(ref); if(n && n.typed && n.thing) return true; } const tg=nounTags(ref); const vt=v.t||[]; return vt.includes('any') || vt.some(t=>tg.includes(t)); }

// ---------- stage ----------
export function relHead(){ const m=APP.S.main; const r=m.subs.rel; if(!r) return null; return r.head==='pred'?predHead(m):r.head==='subj'?(m.passive?m.obj:m.subj):m.obj; }
export function relGap(){ const r=APP.S.main.subs.rel; return r? (r.gap||'s') : 's'; }
// ================= FLOW CORE =================
// Every clause (main / rel / relw / conj / part / purpose / comp) walks its own word-order template.
// The screen always shows ONE slot of ONE clause: the "cursor". Nothing is decided by looking at another clause.
export let MAJOR_PRON;
export function relAble(ref){ if(!ref) return false; if(MAJOR_PRON.has(ref)) return false; const n=N(ref); return !!(n && !n.pron && !n.poss); }
export function clauseOf(kind){ return kind==='main'? APP.S.main : (APP.S.main.subs[kind]? APP.S.main.subs[kind].c : null); }
export function subOf(kind){ return kind==='main'? null : APP.S.main.subs[kind]; }
export function isRelO(kind){ const sb=subOf(kind); return kind==='rel' && sb && (sb.gap||'s')==='o'; }
export function passedSet(kind){ APP.pass=APP.pass||{}; return APP.pass[kind]=APP.pass[kind]||{}; }
export function markPassed(kind, slot){ passedSet(kind)[slot]=1; }
export function slotsOf(kind){
 const c=clauseOf(kind); if(!c) return [];
 const m=APP.S.main, v=predV(c), s=predS(c), q=(kind==='main'||(kind==='comp'&&(!c.vform||c.whTo)))?c.q:null, wh=q&&q.wh;
 const relo=isRelO(kind), isMain=kind==='main';
 const hasSubj = c.type==='normal' && !c.inf0 && (isMain || (['conj','relw','comp'].includes(kind) && !(kind==='comp' && c.vform)) || relo);
 const verbDone = !!(c.pred && !(c.pred.k==='s' && !predS(c))) || wh==='action' || (c.pred&&c.pred.k==='s'&&(wh==='state'||wh==='place'));
 const L=[];
 const S=(name,req,app,filled)=>L.push({name,req,app:!!app,filled:!!filled});
 if(c.type==='excl'||c.type==='hab'){ S('thing',1,1,c.thing); return L; }
 if(c.type==='exist'){ S('thing',1,1,c.thing); }
 S('subj',1,hasSubj,c.subj||wh==='subj');
 S('verb',1,c.type!=='exist',verbDone);
 const needO = !!(v && needsObj(c) && v.fr!=='cl' && !relo && !c.passive);
 S('obj',1,needO,c.obj||(wh==='obj'||wh==='action'));
 S('causv',1,isMain&&v&&v.caus&&c.obj,isMain&&m.subs.caus&&coreDone('caus'));
 S('than',1,s&&(c.degree==='more'||c.degree==='as'),c.than);
 S('toWhom',0,v&&v.dt&&c.obj&&!c.iobj&&!relo,c.iobj);
 S('relobj',0,isMain&&needO&&relAble(c.obj),m.subs.rel&&m.subs.rel.head==='obj');
 S('sobj',0,!!s&&typeof SPREP!=='undefined'&&!!SPREP[s.id],c.sobj);
 S('cmp',0,false,c.degree);
 S('manner',0,verbDone&&LEX.manners.some(mm=>mannerFits(c,mm)),c.manner||wh==='manner');
 S('mthan',1,c.manner&&(c.mdeg==='more'||c.mdeg==='as'),c.mthan);
 S('mcmp',0,false,c.mdeg);
 S('with',0,verbDone&&withFits(c),c.with);
 S('place',0,verbDone||c.type==='exist',c.place||wh==='place');
 S('relwP',0,isMain&&c.place&&!['here','there'].includes(c.place)&&!m.subs.relw,m.subs.relw&&m.subs.relw.slot==='place');
 S('time',0,verbDone||c.type==='exist',c.time||wh==='time');
 S('relwT',0,isMain&&c.time&&TM(c.time)&&TM(c.time).jn&&!m.subs.relw,m.subs.relw&&m.subs.relw.slot==='time');
 S('cmpw',0,isMain&&c.type==='normal'&&!c.cmpwF&&(!!(s&&!s.noun)||!!c.manner),c.cmpw);
 if(isMain){ const lv=LV(); const OK=lv<=1?[]:lv<=3?['place','time']:null; const ADVM=['place','time','manner','with','cmpw','relwP','relwT','relobj'];
  const usedM=L.filter(x=>ADVM.includes(x.name)&&x.filled&&!x.req).length;
  L.forEach(x=>{ if(!ADVM.includes(x.name)||x.req||x.filled) return; if(OK && !OK.includes(x.name)) x.app=false; if(lv<=3 && usedM>=1) x.app=false; if(lv<5 && ['relwP','relwT','relobj'].includes(x.name)) x.app=false; if(lv<4 && x.name==='cmpw') x.app=false; }); }
 if(!isMain){ const ADV=['place','time','manner','with','cmpw','relwP','relwT','relobj','mthan','mcmp','cmp','toWhom'];
  const sv = !!(v && c.pred && c.pred.k==='v' && !needsObj(c) && !v.caus);
  const used = L.some(x=>ADV.includes(x.name) && x.app && x.filled);
  L.forEach(x=>{ if(ADV.includes(x.name) && !x.req && !x.filled && (!sv || used)) x.app=false; }); }
 return L;
}
// the slot the clause is at now
export function cursorOf(kind){
 const L=slotsOf(kind).filter(s=>s.app);
 const req=L.find(s=>s.req && !s.filled); if(req) return req.name;
 return optionalLeft(kind)[0]||null;
}
// optional slots still ahead (never behind something already chosen / passed)
export function optionalLeft(kind){
 const L=slotsOf(kind); const ps=passedSet(kind); let last=-1;
 L.forEach((s,i)=>{ if(s.app && (s.filled || ps[s.name])) last=i; });
 return L.filter((s,i)=>i>last && s.app && !s.req && !s.filled && !ps[s.name]).map(s=>s.name);
}
export function coreDone(kind){ return !slotsOf(kind).some(s=>s.app && s.req && !s.filled); }
export function stageOf(){
 const kind=APP.active;
 if(kind==='main' && isFree() && isEmptyMain() && Object.keys(APP.S.main.subs).length===0) return 'entry';
 const cur=cursorOf(kind);
 if(cur==='subj') return 'subj'; if(cur==='verb') return 'split'; if(cur==='obj') return 'obj';
 if(cur==='thing'||cur==='than'||cur==='mthan') return cur;
 if(cur==='causv') return 'causv';
 return 'extras';
}
export function afterSlots(c, kind){ return optionalLeft(kind); }
// leaving a sub-clause is always the user's decision
export let EXIT_T;
export function exitLabel(kind){ const m=APP.S.main; if(kind==='caus') return 'もとの文へ'; if(kind==='conj'&&m.subs.conj) return m.subs.conj.front? (EXIT_T[m.subs.conj.conj]||'つぎは？') : '場面おわり'; if(kind==='part') return 'だれが？'; if(kind==='rel'||kind==='relw') return '説明おわり'; return 'もとの文へ'; }
export function exitSub(){ const kind=APP.active; if(kind==='main') return; if(!coreDone(kind)){ toast('先にこの部分を完成させてね'); return; } const m=APP.S.main; const lab=exitLabel(kind);
 APP.active='main'; APP.open=null; APP.lsub=null; APP.sideAuto=true; APP.rev={}; APP.finished=false;
 const cur=cursorOf('main'); APP.flash = cur==='subj'? lab+' だれが？' : cur==='verb'? '続き：どうする？' : cur==='obj'? '続き：何を？' : null;
 render(); }

// ---------- mutation ----------
export function snapshot(){ return JSON.stringify({S:APP.S,active:APP.active,lsub:APP.lsub,pass:APP.pass||{}}); }
export function mutate(fn, sp){ APP.addPick=false; APP.afterPick=null; APP.addMode=false; if(APP.search){ APP.search=null; const sb=document.getElementById('srch'); if(sb) sb.remove(); } APP.fixedOff={}; APP.rev={}; APP.grp={}; APP.others={}; APP.addPick=false; APP.basicMode=false; APP.flash=null; APP.hist.push(snapshot()); if(APP.hist.length>80) APP.hist.shift(); APP.finished=false;
 let _c0=null,_b0=[]; try{ _c0=AC(); _b0=['manner','with','place','time'].map(k=>_c0[k]); }catch(e){} fn(); try{ const c2=AC(); if(c2&&c2===_c0){ ['manner','with','place','time'].forEach((k,i)=>{ if(c2[k]&&c2[k]!==_b0[i]){ c2.aord=(c2.aord||[]).filter(x=>x!==k); c2.aord.push(k); } }); } }catch(e){} normalize(); startBeat(); render(); speakAfter(typeof sp==='function'?sp():sp); if(APP.afterPick){ const f=APP.afterPick; APP.afterPick=null; setTimeout(f,350); } }
export function undo(){ const h=APP.hist.pop(); if(!h) return; if(APP.search){ APP.search=null; const sb=document.getElementById('srch'); if(sb) sb.remove(); } const d=JSON.parse(h); APP.S=d.S; APP.active=d.active; APP.lsub=d.lsub; APP.pass=d.pass||{}; APP.open=null; APP.finished=false; normalize(); render(); }
export function normClause(c, kind, sb){ if(c.semi && !REALMOD.includes(c.modal)) c.semi=null; if(c.sadj && c.subj && (N(c.subj)||{}).pron) c.sadj=null;
 if(c.modal && typeof MPAT!=='undefined' && MPAT[c.modal]){ if(MPAT[c.modal].noneg) c.neg=false; if(MPAT[c.modal].neg) c.neg=true; if(MPAT[c.modal].noq && c.q) c.modal=null; }
 if(c.freq==='never'||c.freq==='hardly') c.neg=false;
 if(c.link && !(c.pred&&c.pred.k==='s')) c.link=null;
 if(c.link && c.link!=='become' && predS(c) && predS(c).noun) c.link=null;
 const v=predV(c), s=predS(c);
 if(!(v && v.dt)){ c.iobj=null; c.iobjSkip=false; }
 if(c.obj && (c.obj[0]==='p' || (N(c.obj)||{}).poss)) c.poss=null;
 if(v){ if(v.fr==='intr' && !vcOf(v)) c.useObj=false; if(v.fr==='tr'||v.fr==='cl') c.useObj=true; }
 if(!needsObj(c) || (v && v.fr==='cl')){ c.obj=null; c.oadj=null; }
 if(!(c.pred && c.pred.k==='s')){ c.intens=null; c.adj=null; }
 if(!s){ if(!(c.pred&&c.pred.k==='s')) c.degree=null; c.than=null; c.sobj=null; }
 if(s && !(typeof SPREP!=='undefined' && SPREP[s.id])) c.sobj=null;
 if(!c.manner){ c.mdeg=null; c.mthan=null; }
 if(c.degree!=='most' && c.mdeg!=='most') c.scope=null;
 if(c.mthan && c.mthan===c.subj) c.mthan=null;
 if(!v) c.useObj=false;
 if(c.passive && !(v && needsObj(c) && c.obj && v.fr!=='cl' && !v.nopass && !v.prep && !v.tail)) c.passive=false;
 if(c.q && c.q.wh){ const w=c.q.wh; if((w==='obj' && c.pred && !needsObj(c)) || (w==='action' && c.pred && !v) || (w==='state' && c.pred && c.pred.k!=='s') || (c.passive && (w==='subj'||w==='obj'))) c.q.wh=null; }
 if(c.q && c.modal==='prob') c.modal=null;
 { const ft=FRT(c)&&c.time, fp=FRP(c)&&c.place; c.front=ft&&fp?'both':ft?'time':fp?'place':null; }
 if(c.than && c.than===c.subj) c.than=null;
 if(c.with && c.with===c.subj) c.with=null;
 if(kind==='rel' && sb && sb.gap==='o'){ c.obj=null; }
 if(kind!=='main'){ if(!(kind==='comp'&&(!c.vform||c.whTo))) c.q=null; c.front=null; c.lead=null; if((kind==='rel'&&!(sb&&sb.gap==='o'))||kind==='purpose'||kind==='part'||kind==='caus') c.subj=null; if(kind==='purpose'||kind==='part'||kind==='caus'){ c.modal=null; c.passive=false; if(kind!=='caus') c.neg=false; c.freq=null; c.tense='pres'; } }
 if(c.type!=='normal'){ c.passive=false; c.modal=null; if(c.type==='imp') c.q=null; }
 if(kind==='comp' && c.vform){ c.subj=null; c.modal=null; c.neg=false; c.passive=false; c.freq=null; if(!c.whTo) c.q=null; }
 fixTense(c,{kind});
}
export function normalize(){
 const m=APP.S.main; normClause(m,'main');
 const v=predV(m);
 if(m.subs.comp && !(v && v.fr==='cl') && !(m.subs.comp.c.vform && vcOf(v) && !m.obj) && !(typeof CLADJ!=='undefined' && m.pred && m.pred.k==='s' && m.pred.id && ST(m.pred.id) && CLADJ.test(String(ST(m.pred.id).en).toLowerCase()))) delete m.subs.comp;
 if(m.subs.caus && !(v && v.caus && m.obj)) delete m.subs.caus;
 if(m.subs.rel){ const h=m.subs.rel.head; const ref = h==='thing'?(m.type==='exist'?m.thing:null):h==='pred'?predHead(m):h==='subj'?(m.passive?m.obj:m.subj):(m.passive?null:m.obj); if(!ref) delete m.subs.rel; }
 if(m.type!=='normal'){ if(!(m.type==='exist'&&m.subs.rel&&m.subs.rel.head==='thing')) delete m.subs.rel; delete m.subs.purpose; if(!(m.type==='imp'&&predV(m)&&(predV(m).fr==='cl'||(m.subs.comp&&m.subs.comp.c&&m.subs.comp.c.vform&&vcOf(predV(m)))))) delete m.subs.comp; }
 if(m.subs.relw && !m[m.subs.relw.slot]) delete m.subs.relw;
 for(const k in m.subs) normClause(m.subs[k].c,k,m.subs[k]);
 if(APP.active!=='main' && !m.subs[APP.active]) APP.active='main';
 for(const k in m.subs){ if(k!==APP.active && k!=='comp' && !coreDone(k)){ delete m.subs[k]; if(APP.pass) delete APP.pass[k]; } }
 const c=AC(); if(c.pred){ APP.lsub = c.pred.k==='s'?'be':(c.useObj||predV(c).fr!=='intr'&&predV(c).fr!=='both'?APP.lsub:'do'); }
}
export function speakAfter(sp){
 if(!sp) return;
 if(SET().speak==='sentence' || sp==='sentence'){ say(sentenceText(APP.S)); return; }
 const parts=sentenceParts(APP.S).filter(p=>p.en && !p.hole);
 const ck = APP.active==='main'?'m':APP.active;
 if(sp==='iobj'){ const t=parts.filter(p=>p.clause===ck && /\.(subj|qaux|aux|verb|iobj)$/.test(p.key)).map(p=>p.en).join(' '); say(t); return; }
 if(sp==='vg'){ const t=parts.filter(p=>p.clause===ck && /\.(subj|qaux|aux|verb|wh|there)$/.test(p.key)).map(p=>p.en).join(' '); say(t||sentenceText(APP.S)); return; }
 const p=parts.find(p=>p.key===ck+'.'+sp); if(p) say(p.en);
}

// ---------- actions ----------
export function pick(cat, val){ APP.lastPick=cat;
 const c=AC(); let sp=cat;
 mutate(()=>{
  const free=isFree();
  if(APP.active==='main' && c.q && ['state','manner'].includes(c.q.wh) && ['be','state','self','other','link'].includes(cat)) c.q.wh = (cat==='self'||cat==='other')?'manner':'state';
  switch(cat){
   case 'subj': if(APP.qbe && APP.active==='main'){ APP.qbe=false; APP.afterPick=()=>{ pick('be'); }; } c.subj=val; if(c.than===val) c.than=null; APP.sideAuto=true; break;
   case 'modal': setModal(c,val); sp='vg'; break;
   case 'sobj': c.sobj=val; sp='sobj'; break;
   case 'freq': c.freq=val; if(val==='never') c.neg=false; sp='vg'; break;
   case 'link': c.link=val; sp='vg'; break;
   case 'intens': c.intens=val; c.degree=null; sp='state'; break;
   case 'nadj': c.adj=val; sp='state'; break;
   case 'oadj': c.oadj=val; sp='obj'; break;
   case 'exadj': c.exadj=val; sp='state'; break;
   case 'be': c.pred={k:'s',id:null}; c.intens=null; c.adj=null; c.link=null; c.useObj=false; c.obj=null; APP.lsub='be'; APP.beKind='adj'; sp='vg'; break;
   case 'state': c.pred={k:'s',id:val}; c.useObj=false; c.obj=null; APP.lsub='be'; sp='state'; break;
   case 'self': c.pred={k:'v',id:val}; c.useObj=false; c.obj=null; APP.lsub='do'; sp='vg'; break;
   case 'other': { c.pred={k:'v',id:val}; c.useObj=!(c.type==='imp'&&c.imp==='letme'&&['see','know','think'].includes(val)); APP.lsub=null; sp='vg'; const v=V(val); if(c.obj && !objFits(v,c.obj)) c.obj=null;
     if(v.fr==='cl' && APP.active==='main'){ if(typeof CW_V!=='undefined' && CW_V.includes(v.id)){ APP.afterPick=()=>{ APP.open='cw'; renderScene(); }; } else { if(!APP.S.main.subs.comp) APP.S.main.subs.comp={c:newClause()}; APP.active='comp'; } } break; }
   case 'obj': c.obj=val; { const vv=predV(c); if(vv && vv.caus && APP.active==='main'){ APP.afterPick=()=>openSub('caus',{}); } } break;
   case 'iobj': c.iobj=val; if(c.obj) c.dts='pp'; if(!c.obj) c.dts='oo'; APP.iobjLate=false; sp='iobj'; break;
   case 'iobjSkip': c.iobjSkip=true; sp=null; break;
   case 'dts': c.dts = c.dts==='pp'?'oo':'pp'; sp='sentence'; break;
   case 'poss': c.poss=val; sp=null; if(val) setTimeout(()=>say(val),10); break;
   case 'thing': c.thing=val; sp='sentence'; break;
   case 'degree': c.degree=val; if(val) c.intens=null; if(val!=='more'&&val!=='as') c.than=null; if(!val) markPassed(APP.active,'cmp'); sp='state'; break;
   case 'than': c.than=val; break;
   case 'mdeg': c.mdeg=val; if(val!=='more'&&val!=='as') c.mthan=null; if(!val) markPassed(APP.active,'mcmp'); sp='manner'; break;
   case 'mthan': c.mthan=val; break;
   case 'scope': c.scope=val; sp=val?'scope':null; break;
   case 'manner': c.manner = c.manner===val?null:val; c.mdeg = c.manner? (APP.mdegPend||null) : null; if(c.mdeg!=='more'&&c.mdeg!=='as') c.mthan=null; APP.mdegPend=undefined; break;
   case 'sadj': c.sadj = c.sadj===val?null:val; break;
   case 'cmpw': c.cmpw = c.cmpw===val?null:val; c.cmpwF = !!(c.cmpw && APP.frontNext==='cmpw'); APP.frontNext=null; break;
   case 'with': c.with = c.with===val?null:val; break;
   case 'place': c.place = c.place===val?null:val; if(c.place && ((free && APP.active==='main' && !(c.passive?c.obj:c.subj) && !c.q && c.type==='normal') || APP.frontNext==='place')) c.front='place'; APP.frontNext=null; break;
   case 'time': c.time = c.time===val?null:val; if(c.time && ((free && APP.active==='main' && !(c.passive?c.obj:c.subj) && !c.q && c.type==='normal') || APP.frontNext==='time')) c.front='time'; APP.frontNext=null; break;
   case 'tense': c.tense=val; sp='vg'; break;
   case 'wh': { const m=APP.S.main; if(!m.q) m.q={wh:null}; m.q.wh=val; sp='sentence'; break; }
   case 'imp': c.imp=val; sp='sentence'; break;
  }
  APP.open=APP.openAfter||null; APP.openAfter=null;
 }, ()=>sp);
}
export function toggle(k){
 const c=AC();
 if(k==='neg') mutate(()=>{ c.neg=!c.neg; }, c.type!=='normal'?'sentence':'vg');
 if(k==='passive') mutate(()=>{ c.passive=!c.passive; }, 'sentence');
}
export function openCat(k){ APP.open = APP.open===k? null : k; APP.finished=false; render(); }
export function openSub(kind, opt){
 mutate(()=>{
  const m=APP.S.main;
  if(kind==='conj'){ const cj=CJ(opt.conj); const front = opt.front!=null? opt.front : (!m.subj && !m.pred); if(m.subs.conj){ m.subs.conj.conj=opt.conj; } else m.subs.conj={conj:opt.conj, front: front && !cj.back, c:newClause()}; if(cj.back) m.subs.conj.front=false; }
  if(kind==='rel'){ if(!(m.subs.rel && m.subs.rel.head===opt.head && (m.subs.rel.gap||'s')===(opt.gap||'s'))){ m.subs.rel={head:opt.head, gap:opt.gap||'s', c:newClause()}; APP.pass=APP.pass||{}; APP.pass.rel={}; } if(opt.head==='obj') markPassed('main','relobj'); }
  if(kind==='relw'){ if(!(m.subs.relw && m.subs.relw.slot===opt.slot)){ m.subs.relw={slot:opt.slot, c:newClause()}; APP.pass=APP.pass||{}; APP.pass.relw={}; } markPassed('main',opt.slot==='place'?'relwP':'relwT'); }
  if(kind==='purpose'){ if(!m.subs.purpose) m.subs.purpose={c:newClause()}; }
  if(kind==='part'){ if(!m.subs.part) m.subs.part={c:newClause()}; }
  if(kind==='caus'){ if(!m.subs.caus) m.subs.caus={c:newClause()}; APP.pass=APP.pass||{}; APP.pass.caus={}; }
  APP.active=kind; APP.open=null; APP.lsub=null; APP.sideAuto=true;
 }, null);
 if(kind==='conj') say(CJ(opt.conj).en); if(kind==='purpose') say('to');
 if(kind==='rel'){ const m=APP.S.main; const h=opt.head==='pred'?predHead(m):opt.head==='subj'?(m.passive?m.obj:m.subj):m.obj; say(isPerson(h)?'who':'that'); }
 if(kind==='relw') say(opt.slot==='place'?'where':'when');
}
export function removeSub(kind){ mutate(()=>{ delete APP.S.main.subs[kind]; if(APP.pass) delete APP.pass[kind]; APP.active='main'; APP.open=null; }, 'sentence'); }
export function setActive(k){ const from=APP.active; if(from!=='main' && from!==k && APP.S.main.subs[from] && !coreDone(from)){ toast('先にこの部分を完成させてね（いらなければ ◀ で取り消し）'); return; } APP.active=k; APP.open=null; APP.lsub=null; APP.finished=false; const c=AC(); if(c.pred) APP.lsub=c.pred.k==='s'?'be':(c.useObj?null:'do'); render(); }
export function entry(k){
 const m=APP.S.main;
 if(k==='subj'||k==='time'||k==='place'){ APP.open=k; render(); return; }
 if(k==='if'||k==='when'){ openSub('conj',{conj:k,front:true}); return; }
 if(k==='q'){ mutate(()=>{ m.q={wh:null}; APP.open='q'; }, null); return; }
 if(k==='imp'){ mutate(()=>{ m.type='imp'; }, null); return; }
 if(k==='exist'){ mutate(()=>{ m.type='exist'; m.tense='pres'; }, null); return; }
 if(k==='excl'){ mutate(()=>{ m.type='excl'; m.tense='pres'; }, null); APP.open='exadjL'; renderScene(); return; }
 if(k==='lets'||k==='please'||k==='impdo'||k==='letme'){ mutate(()=>{ m.type='imp'; m.imp=k==='impdo'?'do':k; if(k==='letme') m.neg=false; }, null); return; }
}
export function resetAll(){ APP.hlSnap=null; APP.hlMark=null; APP.sayDone=false; APP.askOpen=false; APP.qbe=false; if(APP.search){ APP.search=null; const sb=document.getElementById('srch'); if(sb) sb.remove(); } APP.pass={}; APP.skipped={}; APP.tenseSet=false; APP.rev={}; APP.grp={}; APP.hist=[]; APP.S={main:newClause()}; APP.active='main'; APP.open=null; APP.lsub=null; APP.sideAuto=true; APP.page={}; APP.finished=false; APP.subjTab='who'; normalize(); render(); }

// ---------- chunk tap -> reopen category ----------
export function chunkTap(cl, cat){
 { const to=cl==='m'?'main':cl, from=APP.active; if(from!=='main' && from!==to && APP.S.main.subs[from] && !coreDone(from)){ toast('先にこの部分を完成させてね（いらなければ ◀ で取り消し）'); return; } }
 APP.active = cl==='m'?'main':cl; APP.finished=false;
 APP.rev={}; APP.grp={}; APP.others={}; APP.addPick=false; APP.qGroup=null; APP.entrySide=null; APP.ePick=null; APP.preCat=null; APP.page={}; APP.sample={}; APP.basicMode=true; APP.keepDial=false;
 const map={subj:'subj',pred:'split',state:'split',obj:'obj',modal:'modal',tense:'tense',q:(APP.S.main.q?'q':'tense'),place:'place',time:'time',manner:'manner',with:'with',than:'than',thing:'thing',conj:'conj',rel:'rel',purpose:'purpose',comp:'obj',imp:'imp',exist:'thing'};
 let k=map[cat]||null;
 if(k==='tense'){ const tl=$('#tline'); tl.classList.add('flash'); setTimeout(()=>tl.classList.remove('flash'),900); toast('足元の時間の線を左右に動かすと、時制が変わります'); APP.open=null; render(); return; }
 if(k==='obj' && predV(AC()) && predV(AC()).fr==='cl'){ if(APP.S.main.subs.comp){ setActive('comp'); return; } }
 if(k==='split'){ const c=AC(); APP.lsub=null; if(c.pred){ APP.side = (c.pred.k==='v' && (c.useObj||predV(c).fr==='tr'))?'other':'self'; APP.sideAuto=false; } }
 if(k==='obj'){ APP.rev={}; }
 promptKey='';
 if(['conj','rel','purpose'].includes(k)) APP.active='main';
 APP.open = k; render();
}

// ---------- category definitions ----------
// label: English question word + Japanese
export function catDef(k, c){
 const v=predV(c);
 const D={
  say:['Say','言う','verb'], ask:['Ask？','きく','wh'], qyn:['Yes/No？','はい・いいえ','aux'], qwh:['What？ Where？…','疑問詞','wh'],
  subj:['Who？','誰が？','noun'], who:['Who？','誰が？','noun'], what:['What？','何が？','noun'],
  how:['How？','どう？','verb'], other:['What？','何をする？','verb'], vc:['to / …ing','〜することを','verb'],
  obj:[v&&isPersonVerb(v)?'Who？':'What？', v&&v.prep==='to'?'何を？':(v&&isPersonVerb(v)?'誰に？誰を？':'何を？'),'noun'],
  thing:['What？',(APP.S&&APP.S.main.type==='excl')?'なんて〜な、何？':'何がある？','noun'], than:['Than？','誰より？','noun'], cmp:['Compare？','くらべる？','adj'], mcmp:['Compare？','くらべる？','adv'], scope:['In…？','どの中で？','adv'], mthan:['Than？','誰より？','noun'], pre:['Before…','前置き','conj'], relk:['who / that','説明する','conj'], freq:['Often？','いつも？','adv'], sobj:[(predS(c)&&SPREP[predS(c).id]?SPREP[predS(c).id].p:'')+'…','何に？','noun'], iobj:['Who？','誰に？','noun'], toWhom:[(v&&v.dt||'to')+'…','誰に？','noun'], objP:['Who？','誰を？','noun'], objT:['What？','何を？','noun'], relobj:['that…','どんな？','conj'], relwP:['where…','そこで？','conj'], relwT:['when…','その時？','conj'],
  place:['Where？', v&&v.motion?'どこへ？':'どこで？','adv'], time:['When？','いつ？','adv'], manner:['How？','どんなふうに？','adv'], with:['With？','誰と？','adv'],
  tense:['Time？','いつの話？','verb'], modal:['Can？','できる？したい？','aux'], neg:['Not','しない','aux'], q:['Ask？','きく？','wh'],
  degree:['More？','どのくらい？','adj'], bdeg:['How much？','どれくらい？','aux'], intens:['How much？','どれくらい？','aux'], cmpw:['Compared…','くらべると？','adv'], sadjL:['What kind？','どんな？','adj'], exadjL:['What a …!','なんて〜な？','adj'], oadjL:['What kind？','どんな？','adj'], bmain:['How？','どう？','adj'], oadj:['What kind？','どんな？','aux'], passive:['by…','される側から','aux'],
  purpose:['For？','なんのために？','conj'], rel:['Which？','どんな人・物？','conj'], conj:['+ 場面','場面をつなぐ','conj'], imp:['Say','言い方','aux'],
 };
 return D[k];
}
export function extrasFor(c, kind){
 const free=isFree(), L=[];
 if(c.type==='exist'){ L.push('place','time','tense','neg'); if(kind==='main') L.push('q'); return L; }
 if(c.type==='imp'){ L.push('imp','manner','with','place','time','neg'); return L; }
 if(kind!=='purpose' && (free || SET().kModal)) L.push('modal');
 if(kind!=='purpose' && (free || SET().kNeg)) L.push('neg');

 L.push('place','time','manner','with');
 const v=predV(c);
 if(free && v && needsObj(c) && c.obj && v.fr!=='cl' && !v.nopass && !v.prep && !v.tail && kind!=='purpose') L.push('passive');
 if(free && kind==='main'){ L.push('purpose'); const ok=r=>r && !(N(r)||{}).pron; if(ok(c.passive?c.obj:c.subj) || (needsObj(c)&&c.obj&&ok(c.obj)&&v.fr!=='cl')) L.push('rel'); L.push('conj'); }
 return L;
}
export function catValue(k,c){
 const m=APP.S.main;
 switch(k){
  case 'place': return c.place&&PL(c.place).ja; case 'time': return c.time&&TM(c.time).ja; case 'manner': return c.manner&&MN(c.manner).ja; case 'with': return c.with&&withJa(c.with);
  case 'tense': return (c.tense!=='pres') && TENSES[c.tense].lab; case 'modal': return c.modal&&MD(c.modal).ja; case 'neg': return c.neg; case 'q': return m.q?(m.q.wh?WH_JA[m.q.wh]:'はい/いいえ'):null;
  case 'degree': case 'cmp': return c.degree && {very:'とても',more:'もっと',most:'いちばん',as:'同じくらい'}[c.degree];
  case 'mcmp': return c.mdeg && {more:'もっと',most:'いちばん',as:'同じくらい'}[c.mdeg]; case 'passive': return c.passive;
  case 'purpose': return m.subs.purpose&&'つけた'; case 'rel': return m.subs.rel&&'つけた'; case 'conj': return m.subs.conj&&CJ(m.subs.conj.conj).ja; case 'imp': return {do:'して！',lets:'しよう！',please:'してください'}[c.imp];
 }
 return null;
}

// ---------- option lists ----------
export let PAGE_SIDE, PAGE_WIDE;
export function casualOn(){ return isFree() || SET().casual || APP.casual; }
export function optList(k, c){
 if(k==='toWhom') k='iobj';
 let O0=optList0(k,c);
 if(!O0.length && ['obj','other','self','state','who','what','thing','than','mthan'].includes(k)){ APP._relax=1; O0=optList0(k,c); if(!O0.length){ APP._relax=2; O0=optList0(k,c); } APP._relax=0; } if(casualOn()) return O0; const hid=O0.filter(o=>o.casual).length; const O=O0.filter(o=>!o.casual); O.hiddenCasual=hid; return O;
}
export function optList0(k, c){
 const v=predV(c), kind=APP.active, O=[];
 const P=(ref)=>{ const n=N(ref); return n; };
 if(k==='who'){ const FX={i:0,you:1,he:2,she:3,we:4,they:5}; LEX.people.filter(p=>!p.animal && !p.thing && p.id!=='it' && !p.typed).forEach(p=>O.push({fixed:FX[p.id],id:p.id,g:p.custom?'mine':(p.ofq?'ofq':(PGRP[p.id]||'around')),e:p.e,en:cap(p.en),ja:p.ja,pos:'noun',sel:c.subj==='p:'+p.id,act:()=>pick('subj','p:'+p.id)})); }
 if(k==='what'){ LEX.people.filter(p=>(p.animal||p.thing)&&!p.typed).forEach(p=>O.push({id:p.id,g:p.custom?'mine':(p.animal?'tanimal':'tthing'),e:p.e,en:cap(p.en),ja:p.ja,pos:'noun',sel:c.subj==='p:'+p.id,act:()=>pick('subj','p:'+p.id)})); }
 if(k==='state' && APP.beKind==='loc') return locOpts(c,true);
 if(k==='state'){ const wantNoun=APP.beKind==='noun'; LEX.states.filter(s=>!s.typed && (APP._relax||stateFitsSubj(c,s)) && (!!s.noun)===wantNoun).forEach(s=>O.push({casual:s.casual,id:s.id,g:s.custom?'mine':(s.ofn?'sof':(SGRP[s.id]||'slook')),e:s.e,en:s.en,ja:stateJaLabel(s),pos:'adj',sel:c.pred&&c.pred.k==='s'&&c.pred.id===s.id,act:()=>pick('state',s.id)})); }
 if(k==='self'){ LEX.verbs.filter(x=>!x.pv&&!x.hidden&&(x.fr==='intr'||x.fr==='both')&&!(x.stative&&PROG.includes(c.tense))&&(APP._relax||verbFitsSubj(c,x))).forEach(x=>O.push({casual:x.casual,id:x.id,g:x.custom?'mine':(x.pv&&!VGRP[x.id]?'phrasal':(VGRP[x.id]||'mine')),e:x.e,en:x.en+(x.tail?' '+x.tail.replace('{poss}','my'):''),ja:x.ja,pos:'verb',sel:c.pred&&c.pred.id===x.id&&!c.useObj,act:()=>pick('self',x.id)})); }
 if(k==='other'){ const relo=APP.active==='rel'&&APP.S.main.subs.rel&&APP.S.main.subs.rel.gap==='o'; const headR=relo?relHead():null; LEX.verbs.filter(x=>!x.pv&&!x.hidden&&!(x.caus&&kind!=='main')&&(x.fr==='tr'||x.fr==='both'||(x.fr==='cl'&&isFree()&&kind==='main')||(vcOf(x)&&kind==='main'&&LV()>=4&&!relo))&&(!relo||(x.fr!=='cl'&&x.t&&(APP._relax||objFits(x,headR))))&&!(x.stative&&PROG.includes(c.tense))&&(APP._relax||verbFitsSubj(c,x))).forEach(x=>O.push({casual:x.casual,id:x.id,g:x.custom?'mine':(x.caus?'person':(x.pv&&!VGRP[x.id]?'phrasal':(VGRP[x.id]||'mine'))),e:x.e,en:x.caus? x.en+' 人 '+(x.caus==='to'?'to …':'…') : x.en+(x.tail&&!x.sep?' '+x.tail:'')+(x.sep&&x.tail?' '+x.tail:'')+(x.prep?' '+x.prep:'')+(x.fr==='cl'?' that…':' …'),ja:x.caus?'人に〜'+x.ja.replace(/^して/,'し'):x.fr==='cl'?'〜と'+x.ja:(x.part&&x.part!=='を'?'〜'+x.part:'〜を')+(x.jaAdj&&x.jaAdjT!=='i'?x.ja+'だ':x.ja),pos:'verb',sel:c.pred&&c.pred.id===x.id&&(c.useObj||x.fr!=='both'),act:()=>pick('other',x.id)})); }
 if((k==='obj'||k==='objP'||k==='objT') && v){ const animalSubj=subjKind(c)==='animal' && !APP._relax; const pool=(k==='objT'?LEX.people.filter(p=>p.thing).map(p=>'p:'+p.id):LEX.people.filter(p=>k!=='objP'||!p.thing).map(p=>'p:'+p.id)).concat(k==='objP'?[]:LEX.things.map(t=>'t:'+t.id)).filter(r=>r!==c.subj && (APP._relax===2 || objFits(v,r)) && !(c.poss && !APP._relax && r[0]==='t' && (N(r).poss || !/^(a|an|the) /.test(N(r).en))) && !(animalSubj && r[0]==='t' && !(N(r).t||[]).some(x=>['ball','toy','food','drink'].includes(x)))); pool.forEach(r=>{ const n=N(r); const FX={i:0,you:1,he:2,she:3,we:4,they:5}; O.push({fixed:(k==='objP'&&r[0]==='p')?FX[r.slice(2)]:undefined,id:r.slice(2),g:n.poss?'possp':nounGrp(r),e:n.e,en:(v.prep?v.prep+' ':'')+(c.poss&&r[0]==='t'&&!n.poss? POSS_EN[c.poss]+' '+n.en.replace(/^(a|an|the|some|my|your)\s+/i,'') : (n.obj||n.en)),ja:n.ja,pos:'noun',sel:c.obj===r,act:()=>pick('obj',r)}); }); }
 if(k==='iobj'){ const FX={i:0,you:1,he:2,she:3,we:4,they:5}; LEX.people.filter(p=>!p.thing && 'p:'+p.id!==c.subj).forEach(p=>O.push({fixed:FX[p.id],id:p.id,g:p.custom?'mine':(p.animal?'tanimal':(PGRP[p.id]||'around')),e:p.e,en:(c.dts==='pp'||APP.iobjLate?(v&&v.dt||'to')+' ':'')+(p.obj||p.en),ja:p.ja+(v&&v.dt==='for'?'のために':'に'),pos:'noun',sel:c.iobj==='p:'+p.id,act:()=>pick('iobj','p:'+p.id)})); }
 if(k==='thing'){ LEX.people.filter(p=>!p.pron && !['ken','mika','mom','dad','grandma'].includes(p.id)).map(p=>'p:'+p.id).concat(LEX.things.filter(t=>!t.poss).map(t=>'t:'+t.id)).forEach(r=>{ const n=N(r); O.push({id:r.slice(2),g:nounGrp(r),e:n.e,en:indef(n),ja:n.ja,pos:'noun',sel:c.thing===r,act:()=>pick('thing',r)}); }); }
 if(k==='than'){ cmpPool(c).forEach(p=>O.push({id:p.id,g:p.custom?'mine':(PGRP[p.id]||'around'),e:p.e,en:(c.degree==='as'?'as ':'than ')+(p.obj||p.en),ja:p.ja+(c.degree==='as'?'と同じくらい':'より'),pos:'noun',sel:c.than==='p:'+p.id,act:()=>pick('than','p:'+p.id)})); }
 if(k==='place'){ const mo=v&&v.motion; locOpts(c,false).forEach(x=>O.push(x)); LEX.places.filter(p=>!p.loc&&!p.typed).forEach(p=>O.push({id:p.id,g:p.custom?'mine':(PLGRP[p.id]||'pnear'),e:p.e,en:mo?p.to:p.en,ja:c.type==='exist'?p.jn+'に':(mo?p.jat:p.ja),pos:'adv',sel:c.place===p.id,act:()=>pick('place',p.id)})); }
 if(k==='time'){ const al=allowedTenses(Object.assign({},c,{time:null}),{kind}); LEX.times.filter(t=>!t.typed&&t.ts.some(x=>al.includes(x))).forEach(t=>O.push({id:t.id,g:timeGrp(t),e:t.e,en:t.en,ja:t.ja,pos:'adv',sel:c.time===t.id,act:()=>pick('time',t.id)})); }
 if(k==='manner'){ LEX.manners.filter(m=>!m.typed&&mannerFits(c,m)).forEach(m=>O.push({e:m.e,en:m.en,ja:m.ja,pos:'adv',sel:c.manner===m.id,act:()=>pick('manner',m.id)})); }
 if(k==='with'){ O.push({top:1,e:'🚶',en:'alone',ja:'ひとりで',pos:'adv',sel:c.with==='alone',act:()=>pick('with','alone')},{top:1,e:'🫶',en:'together',ja:'みんなで',pos:'adv',sel:c.with==='together',act:()=>pick('with','together')}); LEX.people.filter(p=>!p.thing && 'p:'+p.id!==c.subj && p.id!=='i').forEach(p=>O.push({g:p.custom?'mine':(p.animal?'tanimal':(PGRP[p.id]||'around')),top:['you','he','she'].includes(p.id),e:p.e,en:'with '+(p.obj||p.en),ja:p.ja+'と',pos:'adv',sel:c.with==='p:'+p.id,act:()=>pick('with','p:'+p.id)})); }
 if(k==='sobj'){ const s=predS(c); const SP=s&&SPREP[s.id]; if(SP){ const anyT=SP.t.includes('any'); LEX.people.filter(p=>!p.thing&&'p:'+p.id!==c.subj).forEach(p=>{ if(anyT||SP.t.includes(p.animal?'animal':'person')) O.push({id:'sp'+p.id,e:p.e,en:SP.p+' '+(p.obj||p.en),ja:p.ja+SP.jp,pos:'noun',sel:c.sobj==='p:'+p.id,act:()=>pick('sobj','p:'+p.id)}); }); LEX.things.filter(t=>!t.poss && (anyT || (t.t||[]).some(x=>SP.t.includes(x)))).forEach(t=>O.push({id:'st'+t.id,e:t.e,en:SP.p+' '+t.en,ja:t.ja+SP.jp,pos:'noun',sel:c.sobj==='t:'+t.id,act:()=>pick('sobj','t:'+t.id)})); } }
 if(k==='freq'){ O.push({id:'fq0',e:'⭕',en:'—',ja:'なし',pos:'adv',sel:!c.freq,act:()=>pick('freq',null)}); (typeof FREQADV!=='undefined'?FREQADV:[]).forEach(f=>O.push({id:'fq'+f.id,e:{always:'🔁',usually:'🗓️',often:'♻️',sometimes:'🎲',never:'🚫',really:'💯',also:'➕',just:'🎯',ever:'🌏',still:'⏳',probably:'🤔',certainly:'👌',nearly:'🤏',hardly:'🙅',finally:'🏁',actually:'☝️',already:'✔️'}[f.id]||'✨',en:f.en,ja:f.ja+(f.id==='never'||f.id==='hardly'?'（〜ない）':f.id==='also'?'（〜も）':''),pos:'adv',sel:c.freq===f.id,act:()=>pick('freq',f.id)})); }
 if(k==='sadjL'||k==='oadjL'||k==='exadjL'){ const f=k==='sadjL'?'sadj':k==='exadjL'?'exadj':'oadj'; LEX.states.filter(x=>!x.noun).forEach(x=>O.push({casual:x.casual,id:'aj'+x.id,g:x.custom?'mine':(SGRP[x.id]||'slook'),e:x.e,en:x.en,ja:stateJaLabel(x),pos:'adj',sel:c[f]===x.id,act:()=>{ APP.open=null; pick(f,x.id); }})); }
 if(k==='cmpw'){ cmpPool(c).forEach(p=>O.push({id:'cw'+p.id,e:p.e,en:'compared with '+(p.obj||p.en),ja:p.ja+'とくらべると',pos:'adv',sel:c.cmpw==='p:'+p.id,act:()=>pick('cmpw','p:'+p.id)})); }
 if(k==='intens'){ O.push({id:'in_none',e:'⭕',en:'—',ja:'なし',pos:'adv',sel:!c.intens,act:()=>pick('intens',null)}); Object.keys(INTENS).forEach(kk=>O.push({id:'in_'+kk,e:INTENS[kk][2],en:INTENS[kk][0],ja:INTENS[kk][1],pos:'adv',sel:c.intens===kk,act:()=>pick('intens',kk)})); }
 if(k==='modal'){ O.push({e:'⭕',en:'—',ja:'ふつうに',pos:'aux',sel:!c.modal,act:()=>pick('modal',null)}); allowedModals(c).filter(m=>allowedTenses(Object.assign({},c,{modal:m.id}),{kind}).includes(c.tense) && !(c.q && MPAT[m.id] && MPAT[m.id].noq)).forEach(m=>O.push({id:m.id,e:m.e,en:m.en,ja:m.ja,pos:'aux',sel:c.modal===m.id,act:()=>pick('modal',m.id)})); }
 if(k==='degree'||k==='cmp'){ const s=predS(c); const w=s?s.en:'…'; const comp=s?(s.more?'more '+w:(s.comp||w+'er')):'-er', sup=s?(s.more?'most '+w:(s.sup||w+'est')):'-est'; [[null,'⭕','ふつう',w],['very','⬆️','とても','very '+w],['more','📶','もっと（〜より）',comp+' than …'],['most','👑','いちばん','the '+sup],['as','🟰','同じくらい','as '+w+' as …']].forEach(d=>O.push({id:'dg'+d[0],e:d[1],en:d[3],ja:d[2],pos:'adj',sel:c.degree===d[0],act:()=>{ pick('degree',d[0]); if(d[0]==='most'){ APP.open='scope'; renderScene(); } }})); }
 if(k==='mcmp'){ const mm=c.manner&&MN(c.manner); const w=mm?mm.en:'…'; const MC={fast:['faster','fastest'],hard:['harder','hardest'],well:['better','best'],a_lot:['more','most'],slowly:['more slowly','most slowly']}[mm&&mm.id]; [[null,'⭕','ふつう',w],['more','📶','もっと（〜より）',(MC?MC[0]:'more '+w)+' than …'],['most','👑','いちばん','the '+(MC?MC[1]:'most '+w)],['as','🟰','同じくらい','as '+w+' as …']].forEach(d=>O.push({id:'md'+d[0],e:d[1],en:d[3],ja:d[2],pos:'adv',sel:c.mdeg===d[0],act:()=>{ pick('mdeg',d[0]); if(d[0]==='most'){ APP.open='scope'; renderScene(); } }})); }
 if(k==='scope'){ O.push({id:'scnone',e:'⭕',en:'—',ja:'言わない',pos:'adv',sel:!c.scope,act:()=>pick('scope',null)}); Object.entries(SCOPE).forEach(([id,sc])=>O.push({id:'sc'+id,e:{class:'🏫',family:'👨‍👩‍👧',world:'🌍',all:'👥',three:'3️⃣'}[id],en:sc.en,ja:sc.ja,pos:'adv',sel:c.scope===id,act:()=>pick('scope',id)})); }
 if(k==='mthan'){ if(c.mdeg==='as'){ if(SUBJ_PRON[c.subj]) O.push({id:'x_can',fixed:-2,e:'💪',en:'as … as '+SUBJ_PRON[c.subj].replace(/^i$/,'I')+' can',ja:'できるだけ',pos:'adv',sel:c.mthan==='x:can',act:()=>pick('mthan','x:can')}); O.push({id:'x_pos',fixed:-1,e:'🔝',en:'as … as possible',ja:'できるだけ',pos:'adv',sel:c.mthan==='x:possible',act:()=>pick('mthan','x:possible')}); } cmpPool(c).forEach(p=>O.push({id:p.id,g:p.custom?'mine':(p.animal?'tanimal':(PGRP[p.id]||'around')),e:p.e,en:(c.mdeg==='as'?'as ':'than ')+(p.obj||p.en),ja:p.ja+(c.mdeg==='as'?'と同じくらい':'より'),pos:'noun',sel:c.mthan==='p:'+p.id,act:()=>pick('mthan','p:'+p.id)})); }
 if(k==='q'){ const m=APP.S.main, wh=m.q&&m.q.wh, mv=predV(m), ms=predS(m)||(m.pred&&m.pred.k==='s');
  const H=[[null,'🙆','はい・いいえ？','Do…? / Is…?']];
  if(m.type==='normal'){ if(!m.passive) if(LV()>=4) H.push(['subj','👤','誰が？','Who']); if((!m.pred || needsObj(m)) && !m.passive && !(mv&&mv.fr==='cl')) H.push(['obj','🎯','何を？','What']); if(!m.pred || mv) H.push(['action','🎬','何をする？','What … do?']); if(!m.pred) H.push(['state','🌡️','どう？（〜だ・する）','How …?']); else if(ms) H.push(['state','🌡️','どう？','How is…?']); H.push(['place','📍','どこ？','Where'],['time','🕒','いつ？','When'],...((m.pred&&mv)?[['manner','✨','どうやって？','How']]:[]),['with','🤝','誰と？','Who … with?'],['why','💡','どうして？','Why']); }
  H.forEach(x=>O.push({e:x[1],en:x[3],ja:x[2],pos:'wh',sel:m.q&&(wh||null)===x[0],act:()=>pick('wh',x[0])}));
  if(m.q) O.push({e:'↩️',en:'—',ja:'きかない',pos:'aux',act:()=>mutate(()=>{ APP.S.main.q=null; APP.open=null; },'sentence')}); }
 if(k==='imp'){ [['do','👉','して！','Do it!'],['lets','🙌','しよう！',"Let's"],['letme','🙋','〜させて','Let me'],['please','🙏','してください','Please']].forEach(x=>O.push({e:x[1],en:x[3],ja:x[2],pos:'aux',sel:c.imp===x[0],act:()=>pick('imp',x[0])})); }
 if(k==='conj'){ const cur=APP.S.main.subs.conj; CONJS.forEach(j=>O.push({e:j.e,en:j.en,ja:j.ja,pos:'conj',sel:cur&&cur.conj===j.id,act:()=>openSub('conj',{conj:j.id})})); if(cur){ O.push({e:'✏️',en:'edit',ja:'場面を編集',pos:'conj',act:()=>setActive('conj')},{e:'✂️',en:'—',ja:'はずす',pos:'conj',act:()=>removeSub('conj')}); } }
 if(k==='rel'){ const m=APP.S.main; const sref=m.passive?m.obj:m.subj; if(sref && !N(sref).pron) O.push({e:N(sref).e,en:N(sref).en+(isPerson(sref)?' who…':' that…'),ja:N(sref).ja+'って、どんな？',pos:'conj',sel:m.subs.rel&&m.subs.rel.head==='subj',act:()=>openSub('rel',{head:'subj'})}); if(!m.passive && m.obj && needsObj(m) && !N(m.obj).pron) O.push({e:N(m.obj).e,en:N(m.obj).en+(isPerson(m.obj)?' who…':' that…'),ja:N(m.obj).ja+'って、どんな？',pos:'conj',sel:m.subs.rel&&m.subs.rel.head==='obj',act:()=>openSub('rel',{head:'obj'})}); if(m.subs.rel) O.push({e:'✂️',en:'—',ja:'はずす',pos:'conj',act:()=>removeSub('rel')}); }
 if(k==='relk'){ const m=APP.S.main; const h=APP.relTarget||'obj'; const hr=h==='subj'?(m.passive?m.obj:m.subj):m.obj; if(!hr) return O; const n=N(hr); const per=isPerson(hr)||(n.pron&&hr!=='p:it');
  O.push({id:'rs',e:'🏃',en:per?'who':'that',ja:'その'+n.ja+'が（どうする？）',pos:'conj',act:()=>{ APP.open=null; openSub('rel',{head:h,gap:'s'}); }});
  O.push({id:'ro',e:'🎯',en:per?'who':'that',ja:'その'+n.ja+'を（だれが？どうした？）',pos:'conj',act:()=>{ APP.open=null; openSub('rel',{head:h,gap:'o'}); }}); }
 if(k==='pre'){
  const m=APP.S.main, pc=APP.preCat;
  const CATS=[['scene','🕒','場面の時','Yesterday, / One day,'],['place','📍','場面の場所','In the park,'],['freq','🔁','いつもの頻度','Usually,'],['stance','💭','気持ち・本音','In my opinion,'],['link','🔗','話のつなぎ','First, / However,'],['clause','☁️','条件・場面の文','If … , / When … ,'],['cmpw','⚖️','くらべると','Compared with …,'],['part','🏃','〜しながら','Walking home,']];
  if(!pc){ CATS.forEach(x=>O.push({id:'pc'+x[0],e:x[1],en:x[3],ja:x[2],pos:'conj',act:()=>{ APP.preCat=x[0]; renderScene(); }})); }
  else {
   const lead=(f)=>O.push({casual:f.casual,id:'lead'+f.id,e:f.e,en:f.en+',',ja:f.ja+'、',pos:'adv',sel:m.lead===f.id,act:()=>{ APP.preCat=null; mutate(()=>{ m.lead = m.lead===f.id?null:f.id; APP.open=null; },'lead'); }});
   if(pc==='scene'){ FRONTS.filter(f=>f.g==='scene').forEach(lead); LEX.times.forEach(t=>O.push({id:'t'+t.id,e:t.e,en:cap(t.en)+',',ja:t.ja+'、',pos:'adv',sel:m.time===t.id&&m.front==='time',act:()=>{ APP.preCat=null; APP.frontNext='time'; pick('time',t.id); }})); }
   if(pc==='place'){ LEX.places.forEach(pl=>O.push({id:'p'+pl.id,e:pl.e,en:cap(pl.en)+',',ja:pl.ja+'、',pos:'adv',sel:m.place===pl.id&&m.front==='place',act:()=>{ APP.preCat=null; APP.frontNext='place'; pick('place',pl.id); }})); }
   if(['freq','stance','link'].includes(pc)) FRONTS.filter(f=>f.g===pc).forEach(lead);
   if(pc==='clause') CONJS.filter(j=>!j.back).forEach(j=>O.push({id:'cj'+j.id,e:j.e,en:cap(j.en)+' … ,',ja:j.ja,pos:'conj',act:()=>{ APP.preCat=null; APP.open=null; openSub('conj',{conj:j.id,front:true}); }}));
   if(pc==='cmpw') cmpPool(m).forEach(p=>O.push({id:'fcw'+p.id,e:p.e,en:'Compared with '+(p.obj||p.en)+',',ja:p.ja+'とくらべると、',pos:'adv',sel:m.cmpw==='p:'+p.id&&m.cmpwF,act:()=>{ APP.preCat=null; APP.frontNext='cmpw'; pick('cmpw','p:'+p.id); }}));
   if(pc==='part') O.push({id:'mkpart',e:'🏃',en:'…ing ,',ja:'〜しながら（動詞を選ぶ）',pos:'conj',act:()=>{ APP.preCat=null; APP.open=null; openSub('part',{}); }});
  }
 }
 if(k==='purpose'){ const sp=APP.S.main.subs.purpose; O.push({e:'🎯',en:'to …',ja:sp?'編集する':'〜するために',pos:'conj',sel:!!sp,act:()=>sp?setActive('purpose'):openSub('purpose',{})}); if(sp) O.push({e:'✂️',en:'—',ja:'はずす',pos:'conj',act:()=>removeSub('purpose')}); }
 if(['than','mthan','cmpw'].includes(k)){ const FXP={i:0,you:1,he:2,she:3,we:4,they:5}; O.forEach(o=>{ const pid=String(o.id||'').replace(/^cw/,''); if(o.fixed==null && FXP[pid]!=null) o.fixed=FXP[pid]; }); }
 O.forEach(o=>{ if(!o.id) o.id=(o.ref||'')+o.en+'|'+o.ja; });
 return O;
}
export function stateJaLabel(s){ if(s.jt==='v') return adjJa(s,'plain'); if(s.jt==='raw') return s.ja; return s.ja; }
export let PROMPT;

// ================= RENDER =================
export function render(){
 document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on', b.dataset.v===(APP.view==='play'?'make':APP.view)));
 document.querySelectorAll('.view').forEach(v=>v.hidden = v.dataset.view!==APP.view);
 $('#lvl').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.l===String(LV())));
 $('#bUndo').disabled=!APP.hist.length && isEmptyMain() && APP.active==='main';
 if(APP.view!=='play') return;
 renderBar(); renderScene(); updateTimeline(); renderCanvasSentence();
}

// ---------- sentence bar ----------
export let prevTexts;
export function renderBar(){
 const bar=$('#chunks');
 const rects={}; bar.querySelectorAll('[data-key]').forEach(el=>rects[el.dataset.key]=el.getBoundingClientRect());
 const parts=sentenceParts(APP.S);
 const actKey = APP.active==='main'?'m':APP.active;
 let html='', fold=[], foldKey=null, firstEn=true; const texts={};
 const flush=()=>{ if(fold.length){ html+=`<button class="fold" data-key="fold-${foldKey}" data-act="${foldKey}">${esc(fold.join(' '))}</button>`; fold=[]; } };
 parts.forEach(p=>{
  if(p.subStart) return; if(p.subEnd){ if(foldKey===p.subEnd) flush(); return; }
  const ck=p.clause; let en=p.en||''; if(en && firstEn){ en=cap(en); firstEn=false; }
  texts[p.key]=p.hole?'':en;
  if(ck!==actKey){ if(foldKey!==ck) flush(); foldKey=ck; if(en) fold.push(en); return; }
  flush(); foldKey=null;
  const cls=['ck','pos-'+p.pos]; if(p.hole) cls.push('hole'); if(isNegChunk(p)) cls.push('negc'); if(p.subject) cls.push('subject');
  if(!p.hole && prevTexts[p.key]!==en) cls.push('pop');
  html+=`<button class="${cls.join(' ')}" data-key="${p.key}" data-cat="${p.cat}" data-cl="${ck}">${p.hole?'':`<span class="en">${esc(en)}</span>`}<span class="ja">${esc(p.ja||'')}</span></button>`;
 });
 flush();
 const complete=sentenceComplete(APP.S);
 if(parts.some(p=>p.en||p.hole)) html+=`<span class="punct ${complete?'ok':''}">${parts.punct||'.'}</span>`;
 else html=`<span class="barhint">ここに英語の文ができていきます</span>`;
 { const mc=APP.S.main; const cl=AC(); const tl = tlVisible()? (cl.tense==='pres'&&!APP.tenseSet?'いつ？':tlLabel(cl,cl.tense)) : null;
   let head='';
   if(LV()>=4 && APP.active==='main' && mc.type==='normal' && !mc.subs.conj && !mc.subs.part && !mc.front && !mc.lead && !APP.finished) head+=`<button class="headtab pre" id="htPre">＋前置き</button>`;
   html = head + html; }
 bar.innerHTML=html; prevTexts=texts;
 { const ht=$('#htTime'); if(ht) ht.onclick=()=>{ const tl=$('#tline'); tl.classList.add('flash'); setTimeout(()=>tl.classList.remove('flash'),900); };
   const hp=$('#htPre'); if(hp) hp.onclick=()=>{ APP.active='main'; APP.open = APP.open==='pre'?null:'pre'; APP.finished=false; render(); }; }
 bar.querySelectorAll('[data-key]').forEach(el=>{ const r0=rects[el.dataset.key]; if(!r0) return; const r1=el.getBoundingClientRect(); const dx=r0.left-r1.left, dy=r0.top-r1.top; if(Math.abs(dx)>2||Math.abs(dy)>2){ el.classList.remove('pop'); } });
 { const last=bar.querySelector('.ck:not(.hole):last-of-type')||bar.lastElementChild; const target=bar.querySelector('.ck.hole')||last; if(target) requestAnimationFrame(()=>{ bar.scrollLeft = Math.max(0, target.offsetLeft - bar.clientWidth*0.55); }); }
 bar.querySelectorAll('.ck').forEach(el=>el.onclick=()=>{ const t=el.querySelector('.en'); if(t) say(t.textContent); chunkTap(el.dataset.cl, el.dataset.cat); });
 bar.querySelectorAll('.fold').forEach(el=>el.onclick=()=>setActive(el.dataset.act==='m'?'main':el.dataset.act));
 const fin=$('#finish'); fin.disabled=!complete; fin.classList.toggle('ready',complete && !APP.finished);
 $('#barnote').textContent = parts.futNote? 'when / if の中では「これから」の話も現在形で言います' : '';
}

// ---------- characters ----------
export let PROF;
export let GROUP;
export function profOf(ref){ if(!ref||ref[0]!=='p') return null; const id=ref.slice(2); if(GROUP[id]) return {group:GROUP[id]}; if(PROF[id]) return PROF[id]; const n=N(ref); if(!n||n.animal||n.thing||n.custom) return null; return null; }
export function charSVG(p){
 const sk='#f6d2b1', st='#2b2f45', hc=p.hc||'#333', sh=p.shirt||'#888';
 const H={short:`<path d="M31 31 Q31 11 50 11 Q69 11 69 31 Q61 20 50 21 Q39 20 31 31Z" fill="${hc}"/>`,
  long:`<path d="M29 36 Q27 10 50 10 Q73 10 71 36 L73 62 Q65 56 67 33 Q59 21 50 21 Q41 21 33 33 Q35 56 27 62Z" fill="${hc}"/>`,
  spiky:`<path d="M31 30 L33 13 L41 19 L46 8 L52 17 L58 8 L62 18 L68 13 L69 30 Q60 20 50 21 Q40 20 31 30Z" fill="${hc}"/>`,
  bun:`<circle cx="50" cy="9" r="8" fill="${hc}"/><path d="M31 31 Q31 12 50 12 Q69 12 69 31 Q61 21 50 22 Q39 21 31 31Z" fill="${hc}"/>`, none:`<path d="M47 15 q3 -5 6 0" stroke="${st}" stroke-width="1.5" fill="none"/>`};
 const acc = p.acc==='glasses'?`<g fill="none" stroke="${st}" stroke-width="1.6"><circle cx="44" cy="32" r="4.5"/><circle cx="56" cy="32" r="4.5"/><path d="M48.5 32h3"/></g>`: p.acc==='mus'?`<path d="M44 38 q6 -3 12 0 q-6 3 -12 0z" fill="${hc}"/>`:'';
 const limb=(cls,x1,y1,y2,col,w)=>`<g class="${cls}"><line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/></g>`;
 return `<svg class="chsvg" viewBox="0 0 100 160" style="--sc:${p.scale||1}"><g class="whole">
  ${limb('legL',45,100,146,'#3a3f5c',8)}${limb('legR',55,100,146,'#3a3f5c',8)}
  <rect x="35" y="51" width="30" height="54" rx="11" fill="${sh}"/>
  <g class="head"><circle cx="50" cy="32" r="18" fill="${sk}"/>${H[p.hair]||H.short}
   <g class="eo" fill="${st}"><circle cx="44" cy="32" r="2.4"/><circle cx="56" cy="32" r="2.4"/></g>
   <g class="ec" stroke="${st}" stroke-width="1.8" fill="none" stroke-linecap="round"><path d="M41 32 q3 2.5 6 0"/><path d="M53 32 q3 2.5 6 0"/></g>
   <g class="ex" fill="#ffd400" stroke="${st}" stroke-width=".8"><path d="M44 28 l1.2 2.8 3 .2 -2.3 2 .8 3 -2.7 -1.6 -2.7 1.6 .8 -3 -2.3 -2 3 -.2z"/><path d="M56 28 l1.2 2.8 3 .2 -2.3 2 .8 3 -2.7 -1.6 -2.7 1.6 .8 -3 -2.3 -2 3 -.2z"/></g>
   <path class="brow" d="M40 25 L47 28 M60 25 L53 28" stroke="${st}" stroke-width="2" stroke-linecap="round"/>
   <path class="m m-smile" d="M44 39 Q50 43.5 56 39" stroke="${st}" stroke-width="2" fill="none" stroke-linecap="round"/>
   <path class="m m-grin" d="M43 38 Q50 38 57 38 Q55.5 46 50 46 Q44.5 46 43 38Z" fill="#b83a3a" stroke="${st}" stroke-width="1.5"/>
   <path class="m m-frown" d="M44 43 Q50 38 56 43" stroke="${st}" stroke-width="2" fill="none" stroke-linecap="round"/>
   <ellipse class="m m-open" cx="50" cy="41" rx="3.6" ry="4.2" fill="#b83a3a" stroke="${st}" stroke-width="1.4"/>
   <path class="m m-flat" d="M45 41 H55" stroke="${st}" stroke-width="2" stroke-linecap="round"/>
   <g class="blush" fill="#ff8fa3" opacity=".6"><ellipse cx="39" cy="38" rx="3.5" ry="2"/><ellipse cx="61" cy="38" rx="3.5" ry="2"/></g>
   <path class="tear" d="M40 36 q-2.5 5 0 7 q2.5 -2 0 -7z" fill="#5ab4ff"/>
   <path class="sweat" d="M66 22 q-3 5 0 7 q3 -2 0 -7z" fill="#7cc8ff"/>
   <g class="shades"><rect x="38" y="28" width="11" height="7" rx="2.5" fill="#1c2242"/><rect x="51" y="28" width="11" height="7" rx="2.5" fill="#1c2242"/><path d="M49 31 h2" stroke="#1c2242" stroke-width="2"/></g>
   ${acc}
  </g>
  <g class="armL"><line x1="38" y1="58" x2="38" y2="92" stroke="${sk}" stroke-width="6.5" stroke-linecap="round"/><line x1="38" y1="58" x2="38" y2="70" stroke="${sh}" stroke-width="8" stroke-linecap="round"/></g>
  <g class="armR"><line x1="62" y1="58" x2="62" y2="92" stroke="${sk}" stroke-width="6.5" stroke-linecap="round"/><line x1="62" y1="58" x2="62" y2="70" stroke="${sh}" stroke-width="8" stroke-linecap="round"/></g>
  </g></svg>`;
}
export let FACE_OF_STATE;
export let POSE_OF_VERB;
export function poseFace(c){
 const v=predV(c), s=predS(c); let pose='stand', face='neutral';
 if(v){ pose = POSE_OF_VERB[v.id] || ({run:'run',walk:'walk',sleep:'sleep',swim:'swim',dance:'dance',shake:'laugh',jump:'jump',sit:'sit',fly:'fly',bob:(needsObj(c)?'reach':'stand')})[v.an] || 'stand';
  face = ({laugh:'laugh',cry:'sad',sleep:'sleepy',talk:'talk',mouth:'talk',dance:'happy',jump:'happy',run:'happy'})[pose] || 'neutral'; if(v.id==='smile') face='happy'; if(v.id==='sing'||v.id==='laugh') face=v.id==='laugh'?'laugh':'talk'; }
 if(s){ face=FACE_OF_STATE[s.id]||'neutral'; pose = s.id==='strong'?'flex':s.id==='excited'?'up':s.id==='angry'?'fists':s.id==='sleepy'||s.id==='tired'?'slump':s.id==='cold'?'shiver':'stand'; }
 if(c.neg){ face = s? 'neutral' : face; }
 return {pose,face};
}
// ---------- scene ----------
export let BGS;
export let SKY;
export let TOFF;
export let sceneNodes;
export function subjRefForScene(c, kind){
 const m=APP.S.main;
 if(c.type==='imp') return 'p:you';
 if(kind==='rel'){ if(relGap()==='o') return c.passive?c.obj:c.subj; const h=m.subs.rel.head; return h==='pred'?predHead(m):h==='subj'?(m.passive?m.obj:m.subj):m.obj; }
 if(kind==='purpose'||kind==='part') return m.passive?m.obj:m.subj;
 if(kind==='caus') return m.obj;
 return c.passive? c.obj : c.subj;
}
export function figureHtml(ref, big){
 const pr=profOf(ref); const n=N(ref);
 if(pr && pr.group) return `<div class="grp">${pr.group.map(g=>charSVG(PROF[g])).join('')}</div>`;
 if(pr) return charSVG(pr);
 return `<div class="emo">${ico(n?n.e:'❔')}</div>`;
}
export function renderScene(){
 const sc=$('#scene'), c=AC(), kind=APP.active, st=stageOf(), m=APP.S.main;
 const nodes=[]; const add=(k,html,x,y,o)=>nodes.push(Object.assign({k,html,x,y},o||{}));
 const v=predV(c), s=predS(c), wh=kind==='main'&&c.q?c.q.wh:null;
 const place = c.place || (kind!=='main'?m.place:null), time = c.time || (kind!=='main'?m.time:null);
 const bg = place && BGS[PL(place).bg]; $('#bg').style.background = bg? bg.bg:''; $('#bg').classList.toggle('on',!!bg);
 const sky = time && TM(time).sky; $('#sky').style.background = sky? SKY[sky]:'transparent'; $('#canvas').classList.toggle('night',sky==='night');
 if(bg){ const FG=APP.finished?(()=>{ const SHn=(document.getElementById('scene')||{}).clientHeight||592; return {SHn,top:SHn-70-.253*SHn+10}; })():null; bg.props.forEach((p,i)=>{ let py=p[2]; if(FG){ const bot=FG.SHn-48, sz=p[3]||40; if(p[2]<60){ py=FG.top-18-sz*.5; } else { py=FG.top+(p[2]/100)*(bot-FG.top); py=Math.min(Math.max(py,FG.top+sz*.5),bot-sz*.5); } py=py/FG.SHn*100; } add('prop-'+PL(place).bg+i,p[0],p[1],py,{size:p[3],cls:'prop'}); }); }
 const sRef = subjRefForScene(c, kind);
 const split = !!(sRef || c.type==='imp') && c.type!=='exist';
 $('#canvas').classList.toggle('split', split); $('#canvas').classList.toggle('splitting', st==='split' && !APP.open);
 $('#canvas').classList.toggle('dimbg', !!APP.open || st==='subj' || st==='entry' || APP.finished); if(!APP.finished) $('#canvas').classList.remove('finsm');
 $('#canvas').dataset.side = APP.side;
 const tOff = 0; // 時制でキャラの位置はずらさない
 const tCls = ['past','pastprog'].includes(c.tense)?' t-past':c.tense==='fut'?' t-fut':'';
 const objFig = !!(v && needsObj(c) && v.fr!=='cl' && c.type!=='exist'); const cmpFig = !!(((s && ['more','as'].includes(c.degree)) || (c.manner && ['more','as'].includes(c.mdeg))) && (s? c.than : c.mthan));
 let sx=32+tOff, sy=APP.finished?65:72, ox=v&&v.dt&&c.iobj?66:76, oy=APP.finished?60:74;
 if(c.passive){ ox=32; sx=76; }
 let BYp=null, BY2=null, fgY=null, VYp=null, oxA=null; const BR=()=>BYp!=null?' byrow':''; if(APP.finished){ const SHn=(document.getElementById('scene')||{}).clientHeight||592, pc=px=>px/SHn*100; const feet=SHn-70, hS=.253*SHn, hO=.23*SHn; const oR=String((c.passive?c.subj:c.obj)||''); const oPerson=/^p:/.test(oR)&&!/^p:(it|this|that|these|those)$/.test(oR); sy=pc(feet-hS/2); oy=oPerson?pc(feet-hO/2):pc(feet-hS/2-(hO/2-.056*SHn)); const by=feet-hS-26; BYp=pc(by); BY2=pc(by-34); fgY=pc(feet-hS/2+12); VYp=pc(feet-hS/2+12-24); if(!c.passive&&/^p:(they|we)$/.test(oR)){ ox=98; oxA=72; } }
 if(st==='split' && !APP.open && sRef && !bePending(c) && !revealed('other') && (APP.side==='self' || revealed('how') || APP.lsub)) add('selfring','<div class="selfring"></div>',sx,sy-4,{cls:'lbl ringw'});
 
 if(c.type==='exist'){
  if(c.thing){ add('thing', figureHtml(c.thing), 50, 78, {cls:'fig chn'+(c.neg?' ghost':'')+tCls}); if(c.neg) add('negx','✕',50,56,{cls:'nx'}); }
  add('there','<span class="tag">There …</span>',50,60,{cls:'lbl'});
 }
 if(sRef){
  const {pose,face}=poseFace(c);
  const sN=N(sRef); const tall = s&&s.id==='tall';
  const raised = (s && (c.degree==='more'||c.degree==='most')) || (c.manner && (c.mdeg==='more'||c.mdeg==='most'));
  const onPod = (s && ['more','most','as'].includes(c.degree)) || (c.manner && ['more','most','as'].includes(c.mdeg));
  add('subj', wh==='subj'? '<div class="emo">❓</div>' : figureHtml(sRef), sx, sy-(onPod?(raised?9:6):0), {cls:`fig chn p-${pose} f-${face}${typeof emoFlip==='function'&&emoFlip(sRef,sx,c,'subj')?' eflip':''}${tCls}${typeof motionSubjCls==='function'?motionSubjCls(c):''}${c.neg?' negd':''}${tall?' tall':''}${c.manner&&MN(c.manner).an?' m-'+MN(c.manner).an:''}${c.passive?' spot':''}${!profOf(sRef)&&v&&!c.neg&&v.an&&v.an!=='bob'?' a-'+v.an:''}`});
  if(pose==='sleep') add('zzz','<span class="zzz">z z Z</span>',sx+12,sy-14,{cls:'lbl'});
  if(pose==='swim') add('wave','🌊🌊',sx,sy+18,{size:26,cls:'bub'});
  if(face==='cold') add('snow','❄️',sx+14,sy-20,{size:18,cls:'bub'});
  if(face==='hot') add('sun2','🔥',sx+14,sy-20,{size:18,cls:'bub'});
  if(face==='hungry') add('hungry','🍽️',sx+14,sy-20,{size:18,cls:'bub'});
 } else if(c.type==='imp'){ }
 else if(c.type==='normal' && (c.pred||wh)){ add('subj','<div class="ghostq">誰？</div>',sx,sy,{cls:'fig'}); }
 if(c.type==='imp'){ add('subj', charSVG(PROF.you), sx, sy, {cls:`fig chn p-${poseFace(c).pose} f-${poseFace(c).face}${c.neg?' negd':''}`});  add('point','👉',6,sy,{size:34,cls:'bub'}); }
 // verb badge (for self verbs) / action mark
 if(false) add('dialhint',`<div class="dialhint">🎡 ${esc(pvBase(v))}＋？</div>`, 55, 63, {cls:'ui fb', tap:()=>{ APP.open='dial'; renderScene(); }});
 if(v && !needsObj(c)) add('act', `<span class="${c.neg?'crossed':''}">${ico(wh==='action'?'❓':v.e)}</span>`, sx+(BYp!=null?18:15), BYp!=null?BYp:sy-16, {size:26,cls:'bub'+BR()});
 if((s&&!s.loc) || (c.pred&&c.pred.k==='s'&&!s)) add('state', `<span class="stb ${c.neg?'crossed':''}">${wh==='state'?'❓':(s?ico(s.e)+'<b>'+esc(s.en)+'</b>':'<b>…?</b>')}</span>`, sx+17, BYp!=null?BYp:sy-15, {cls:'lbl'+BR()});
 if(s && c.degree==='very') add('very','‼️',sx-13,sy-15,{size:20,cls:'bub'});
 { const dg = s? c.degree : (c.manner? c.mdeg : null); const other = s? c.than : c.mthan;
   if(dg==='more'||dg==='as'||dg==='most'){
    add('pod-s',`<div class="step ${dg==='as'?'same':'high'}">${dg==='most'?'1':''}</div>`,sx,sy+11,{cls:'lbl podw'});
    if(dg==='most'){ add('crown','👑',sx,sy-26,{size:28,cls:'bub'}); add('pod-2','<div class="step low">2</div>',sx+20,sy+12,{cls:'lbl podw'}); add('pod-3','<div class="step lower">3</div>',sx-18,sy+13,{cls:'lbl podw'}); add('ghost2','<div class="emo">👤</div>',sx+20,sy+3,{cls:'fig chn small ghostp'}); add('ghost3','<div class="emo">👤</div>',sx-18,sy+5,{cls:'fig chn small ghostp'}); }
    else if(other){ add('than', figureHtml(other), sx+22, sy+(dg==='as'?-2:3), {cls:'fig chn small'}); add('pod-o',`<div class="step ${dg==='as'?'same':'low'}"></div>`,sx+22,sy+(dg==='as'?11:12),{cls:'lbl podw'}); if(dg==='as') add('eq','<span class="eqs">＝</span>',sx+11,sy-4,{cls:'lbl'}); else add('upar','<span class="upar">⬆</span>',sx-12,sy-2,{cls:'lbl'}); }
   } }
 if(c.neg && (v||s)) add('negx','✕',sx,sy-6,{cls:'nx'});
 // object
 if(v && needsObj(c) && v.fr!=='cl' && c.type!=='exist'){
  const oRef = (kind==='rel'&&relGap()==='o')? relHead() : (c.passive? c.subj : c.obj);
  if(wh==='obj') add('obj','<div class="emo">❓</div>',ox,oy,{cls:'fig chn obj'});
  else if(oRef) add('obj', figureHtml(oRef), ox, oy, {cls:'fig chn obj'+(typeof emoFlip==='function'&&emoFlip(oRef,ox,c,'obj')?' eflip':'')+(c.neg?' ghost':'')+(c.passive?'':' target')+(typeof motionObjCls==='function'&&!c.passive?motionObjCls(c):'')});
  else add('obj','<div class="ghostq">何？</div>',ox,oy,{cls:'fig'});
  add('verbic', `<span class="${c.neg?'crossed':''}">${ico(wh==='action'?'❓':v.e)}</span>`, 50, VYp!=null?VYp:oy-12, {size:26,cls:'bub'});
  const a1={x:c.passive?ox:sx,y:sy-6}, a2={x:c.passive?sx:ox,y:oy-6};
  if(sRef||c.type==='imp') add('arrow', arrowSvg(c.passive?{x:(oxA!=null?oxA:ox),y:(fgY!=null?fgY:oy-4)}:{x:sx,y:(fgY!=null?fgY:sy-4)}, c.passive?{x:sx,y:(fgY!=null?fgY:sy-4)}:{x:(oxA!=null?oxA:ox),y:(fgY!=null?fgY:oy-4)}, c.neg), 50,50,{cls:'full'});
  if(v.dt && c.iobj && !c.passive){ add('iobjf', figureHtml(c.iobj), 88, 64, {cls:'fig chn small'}); if(c.obj) add('arrow2', arrowSvg({x:ox,y:oy-4},{x:88,y:62},false), 50,50,{cls:'full'}); }
  if(c.passive && c.subj) add('byl','<span class="tag">by</span>',ox,97.5,{cls:'lbl'});
 }
 if(c.modal){ const md=MD(c.modal); add('modal', typeof modalBubbleHtml==='function'? modalBubbleHtml(c) : `<div class="think">${md.e}</div>`, BYp!=null?Math.max(10,sx-18):Math.max(19,sx-17), BYp!=null?BYp:sy-12, {cls:'lbl'+BR()}); }
 if(typeof motionBubble==='function') motionBubble(add,c,sx,sy);
 if(kind==='main' && c.q) add('qb', `<div class="qbub">？</div>`, (c.modal&&BYp!=null)?sx:sx-15, BYp!=null?BYp:sy-20, {cls:'lbl'+BR()});
 if(wh==='why') add('why','<span class="tag">Why?</span>',sx-14,BYp!=null?BYp:sy-20,{cls:'lbl'+BR()});
 if(c.manner||wh==='manner') add('manner', `<span class="tag">${wh==='manner'?'❓':MN(c.manner).e+' '+esc(MN(c.manner).en)}</span>`, sx+18, sy+10, {cls:'lbl'});
 if(c.with||wh==='with'){ const w=c.with; const html = wh==='with'?'<div class="emo">❓</div>': (w==='alone'||/^self_/.test(w||'')?'<div class="emo">🚶</div>':w==='together'?'<div class="emo">🫶</div>':figureHtml(w)); add('with', html, sx-15, sy+6, {cls:'fig chn small'+tCls+(c.pred&&w&&w.startsWith('p:')&&profOf(w)?' p-'+poseFace(c).pose:'')}); }
 if(wh==='place') add('ring','<div class="ring q">❓</div>',sx,sy+14,{cls:'ringw'});
 if(time||wh==='time'){ const t=time&&TM(time); add('tchip', `<span class="tag tchip">${wh==='time'?'❓ When?':t.e+' '+esc(t.en)}</span>`, 84, BYp!=null?BYp:58, {cls:'lbl'+BR()}); }
 const lcI = place && locInfo(place), lsI = s && s.loc && locInfo(c.pred.id);
 if(lcI || lsI) locScene(add, lcI||lsI, c.type==='exist'?50:sx, c.type==='exist'?78:sy);
 else if(place && !bg) add('pchip', `<span class="tag">${PL(place).e} ${esc(PL(place).en)}</span>`, 50, BY2!=null?BY2:60, {cls:'lbl'+(BY2!=null?' byrow2':'')});
 // other clauses as mini panels
 const panels=[];
 if(kind!=='main') panels.push(['m','もとの文',m,'main']);
 ['conj','rel','purpose','comp','part','relw','caus'].forEach(k=>{ if(m.subs[k] && k!==kind) panels.push([k, k==='conj'?CJ(m.subs[k].conj).en:({caus:'do',rel:'who/that',purpose:'to',comp:(m.subs.comp&&m.subs.comp.c.vform==='to'?'to':m.subs.comp&&m.subs.comp.c.vform==='ing'?'…ing':'that'),part:'…ing',relw:m.subs.relw&&m.subs.relw.slot==='place'?'where':'when'})[k], m.subs[k].c, k]); });
 panels.forEach((p,i)=>add('pan-'+p[0], panelHtml(p[2], p[1], p[3]), 90, 66+i*11, {cls:'lbl panelw', tap:()=>setActive(p[3])}));
 if(kind!=='main'){ const lb={caus:'【'+(m.obj&&N(m.obj)?(N(m.obj).obj||N(m.obj).en):'')+' が何をする？】',relw:'【'+(m.subs.relw&&m.subs.relw.slot==='place'?'where そこで？':'when その時？')+'】',conj:'【'+(m.subs.conj?CJ(m.subs.conj.conj).en:'')+' の場面】',rel:'【それが？ それを？】',purpose:'【なんのために】',comp:(m.subs.comp&&m.subs.comp.c.vform==='to'?'【➡ to 〜 これから】':m.subs.comp&&m.subs.comp.c.vform==='ing'?'【📷 〜ing ひとコマ】':'【〜ということ】'),part:'【〜しながら】'}[kind]; add('frame', `<span class="tag frm">${esc(lb)}</span>`, 84, 56, {cls:'lbl'}); }
 APP.nounTags=[];
 if(kind==='main' && !APP.finished && !APP.open && !APP.search){
  const mm=APP.S.main;
  APP.nounTags=[];
  if(LV()>=5 && st==='split' && !c.pred && sRef && c.type==='normal' && !(N(sRef)||{}).pron){
   const two = relAble(sRef) && !mm.subs.rel;
   APP.nounTags.push({x:two?sx-13:sx,y:sy-27,cls:'pre',label:'＋ どんな？',act:()=>{ APP.open='sadjL'; renderScene(); }});
   if(two) APP.nounTags.push({x:sx+13,y:sy-27,cls:'post',label:'＋ '+(isPerson(sRef)?'who':'that')+'…',act:()=>{ APP.relTarget='subj'; APP.open='relk'; renderScene(); }}); }
  APP.nounTags.forEach((T,i)=>add('ntag'+i,`<div class="ntag ${T.cls}">${esc(T.label)}</div>`,T.x,T.y,{cls:'ui fb keep',tap:T.act}));
 }
 uiNodes(add, c, kind, st);
 $('#canvas').classList.toggle('choosing', nodes.some(n=>/\bfo\b/.test(n.cls||'')));
 manageSideTimer(st);
 $('#canvas').classList.toggle('subframe', kind!=='main');
 { const nSteps=sentenceParts(APP.S).filter(q=>q.en&&!q.hole).length; const cvEl=$('#canvas'); cvEl.style.backgroundPosition=`${-nSteps*54}px 0`; }
 $('#canvas').dataset.stage = APP.finished?'done':(APP.open||st);
 $('#canvas').classList.toggle('done', APP.finished); $('#canvas').classList.toggle('beat', !!APP.beat);
 reconcile(sc, nodes);
 checkPrompt();
}
export function panelHtml(c, label, kind){ const v=predV(c), s=predS(c); const p=[]; const sr = kind==='rel'||kind==='purpose'? null : (c.passive?c.obj:c.subj); if(sr) p.push(ico(N(sr).e)); if(v) p.push(ico(v.e)); if(s) p.push(ico(s.e)); if(c.obj&&!c.passive) p.push(ico(N(c.obj).e)); if(c.neg) p.push('✕'); if(!p.length) p.push('…'); return `<div class="panel k-${kind}"><b>${esc(label)}</b><div>${p.join('')}</div></div>`; }
export function arrowSvg(a,b,neg){ const dx=b.x-a.x, dy=b.y-a.y, L=Math.hypot(dx,dy)||1; const x1=a.x+dx/L*11, y1=a.y+dy/L*11, x2=b.x-dx/L*11, y2=b.y-dy/L*11; return `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="#df3f35"/></marker></defs><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#df3f35" stroke-width="3" vector-effect="non-scaling-stroke" stroke-dasharray="${neg?'5 5':'0'}" marker-end="url(#ah)" class="arr"/></svg>`; }
export function timelineSvg(c){
 const t=c.tense; const W=300,Y=12; let g=''; const col='#df3f35';
 if(t==='pres'){ for(let i=0;i<9;i++) g+=`<circle cx="${30+i*30}" cy="${Y}" r="3" fill="${col}"/>`; }
 if(t==='prog') g=`<rect x="122" y="${Y-5}" width="56" height="10" rx="5" fill="${col}"/>`;
 if(t==='past') g=`<circle cx="70" cy="${Y}" r="6" fill="${col}"/>`;
 if(t==='pastprog') g=`<rect x="45" y="${Y-5}" width="55" height="10" rx="5" fill="${col}"/>`;
 if(t==='perf') g=`<circle cx="70" cy="${Y}" r="5" fill="${col}"/><path d="M76 ${Y} H144" stroke="${col}" stroke-width="2.5" stroke-dasharray="3 3"/><path d="M140 ${Y-5} L148 ${Y} L140 ${Y+5}" fill="none" stroke="${col}" stroke-width="2.5"/>`;
 if(t==='perfprog') g=`<rect x="60" y="${Y-5}" width="90" height="10" rx="5" fill="${col}"/>`;
 if(t==='fut') g=`<circle cx="230" cy="${Y}" r="6" fill="none" stroke="${col}" stroke-width="2.5" stroke-dasharray="3 2"/>`;
 return `<svg class="tl" viewBox="0 0 ${W} 30"><line x1="8" y1="${Y}" x2="${W-8}" y2="${Y}" stroke="#b9bfd6" stroke-width="2"/><path d="M${W-14} ${Y-4} L${W-8} ${Y} L${W-14} ${Y+4}" fill="none" stroke="#b9bfd6" stroke-width="2"/><line x1="150" y1="2" x2="150" y2="22" stroke="#1c2242" stroke-width="1.5"/><text x="150" y="29" font-size="9" text-anchor="middle" fill="#1c2242">今</text>${g}</svg>`;
}
export function reconcile(root, nodes){
 const keep=new Set();
 nodes.forEach(n=>{
  keep.add(n.k); let el=sceneNodes[n.k]; const fresh=!el;
  if(fresh){ el=document.createElement('div'); root.appendChild(el); sceneNodes[n.k]=el; }
  if(el._html!==n.html){ el.innerHTML=n.html; el._html=n.html; if(!fresh && !/^(prop|tl|arrow|subj|obj|with|than|thing)/.test(n.k)) el.animate([{opacity:.4},{opacity:1}],{duration:250,easing:'linear'}); }
  el.className='nd '+(n.cls||'')+(fresh?' enter':'');
  el.style.left=n.x+'%'; el.style.top=n.y+'%'; if(n.size) el.style.fontSize=n.size+'px';
  el.onclick = n.tap||null;
  if(fresh) requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove('enter')));
 });
 if(typeof motionReplay==='function') motionReplay();
 if(typeof fukuBar==='function'){ fukuBar(); fukuBtn(); }
 Object.keys(sceneNodes).forEach(k=>{ if(!keep.has(k)){ const el=sceneNodes[k]; delete sceneNodes[k]; el.onclick=null; el.classList.add('leave'); setTimeout(()=>el.remove(),300); } });
}


// ---------- categories with pictures (so long lists never become 30 pages) ----------
export let GDEF;
export let VGRP;
export let SGRP;
export let PGRP;
export let PLGRP;
export function timeGrp(t){ if(t.custom) return 'mine'; const s=t.ts; if(['twohours','since','already','allday'].includes(t.id)) return 'tilen'; if(s.includes('fut')&&!s.includes('past')) return 'tifut'; if(s.includes('past')&&!s.includes('pres')&&!s.includes('fut')) return 'tipast'; if(['everyday','everymorning','sundays','sometimes','morning','night','seven'].includes(t.id)) return 'tihab'; return 'tinow'; }
export function nounGrp(ref){ const n=N(ref); if(!n) return 'tthing'; if(n.custom) return 'mine'; if(n.ofn) return 'tof'; if(ref[0]==='p') return n.animal?'tanimal':'tpeople'; const t=n.t||[]; if(t.includes('food')) return 'tfood'; if(t.includes('drink')) return 'tdrink'; if(t.some(x=>['sport','game','ball','ride'].includes(x))) return 'tplay'; if(t.some(x=>['instr','music','song'].includes(x))) return 'tmusic'; if(t.some(x=>['lang','homework'].includes(x))) return 'tstudy'; if(t.some(x=>['read','write'].includes(x))) return 'tread'; return 'tthing'; }
export function listView(key, list, per, revKey){
 const needG = list.length>per+2 && list.some(o=>o.g);
 if(!needG){ const pg=paged(list,key,per); return {items:pg.items,pg,chips:[]}; }
 const sel=(APP.grp||{})[key];
 if(sel){ const L=list.filter(o=>o.g===sel); const pg=paged(L,key+'@'+sel,per); return {items:pg.items,pg,chips:[{e:'◀',label:'種類へ',back:1,act:()=>{ delete APP.grp[key]; renderScene(); }}]}; }
 const top=list.filter(o=>o.top); const gs=[...new Set(list.filter(o=>!o.top).map(o=>o.g))];
 return {items:top.slice(0,per), pg:{more:false}, chips:gs.map(g=>{ const d=GDEF[g]||['📦',g]; return {e:d[0],label:d[1],act:()=>{ APP.grp=APP.grp||{}; APP.grp[key]=g; if(revKey) APP.rev[revKey]=true; renderScene(); }}; })};
}




// ---------- phrasal verbs: families (get / get up / get over …) and "言いかえ" ----------
export function pvBase(v){ return v? (v.pv? v.pv.base : v.en) : null; }
export function familyOf(v){ if(!v || v.caus) return []; const b=pvBase(v); if(!PVBASE[b] && !(v.pv)) return []; const fam=LEX.verbs.filter(x=>(x.pv && x.pv.base===b) || (!x.pv && x.en===b && !x.custom && x.fr!=='cl' && !x.caus && !x.hidden && !x.id.startsWith('x_'))); return fam.length>1? fam : []; }
export function pvPart(x){ return x.pv? x.pv.p : (x.prep||x.tail||null); }
export function altsOf(v){ if(!v) return []; const out=[]; if(v.syn && V(v.syn)) out.push(V(v.syn)); LEX.verbs.filter(x=>x.syn===v.id).forEach(x=>out.push(x)); return out.filter(x=>x.id!==v.id); }
export function verbLabel(v){ return v.en+(v.tail?' '+String(v.tail).replace('{poss}','my'):'')+(v.prep?' '+v.prep:''); }
export function swapVerb(id){ APP.dialPage=APP.dialPage||0; const c=AC(); const nv=V(id); const kd=APP.keepDial; APP.keepDial=false; mutate(()=>{ c.pred={k:'v',id}; c.useObj = nv.fr==='tr'||nv.fr==='cl' || (nv.fr==='both' && !!c.obj); if(c.obj && nv.t && !objFits(nv,c.obj)) c.obj=null; APP.open=null; }, 'vg'); }
// ---- to 〜 / 〜ing のとびら ----
export function openVc(form){ const m=APP.S.main; mutate(()=>{ m.obj=null; m.oadj=null; m.useObj=true; const old=m.subs.comp&&m.subs.comp.c&&m.subs.comp.c.vform? m.subs.comp.c : null; m.subs.comp={c: old? Object.assign(old,{vform:form}) : Object.assign(newClause(),{vform:form})}; APP.active='comp'; APP.rev={}; APP.lsub=null; },null); if(form==='to') say('to'); }
export function swapVc(){ const m=APP.S.main; if(!isVc(m)) return; const f=vcForms(predV(m)); if(f.length<2) return; mutate(()=>{ m.subs.comp.c.vform = m.subs.comp.c.vform==='to'?'ing':'to'; },'sentence'); }
export function vcDoors(add,c,y0,px){
 const v=predV(c); const x=vcOf(v); const f=vcForms(v);
 f.forEach((fm,i)=>{ const ex=fm==='to'? v.en+' to …' : v.en+' …ing';
  add('vcd-'+fm,`<div class="vcdoor ${fm}"><div class="vcpic">${fm==='to'?'<i class="vcwalk">🚶</i><i class="vcarr">➡</i>':'<i class="vcframe">📷</i>'}</div><b class="en">${esc(ex)}</b><small>${tx(fm==='to'?'vc.to':'vc.ing')}</small><em>${tx(fm==='to'?'vc.toLong':'vc.ingLong')}</em></div>`,f.length>1?[28,72][i]:50,y0+px(70),{cls:'ui fb',tap:()=>openVc(fm)}); });
 if(x && x.diff) add('vcd-note','<span class="auxcap">⚠️ この動詞は to と ing で意味が変わるよ</span>',50,y0+px(160),{cls:'lbl ui'});
}
// ∞：動詞を選んだあと、手前に「＋up ＋out …」の札を出して句動詞にすぐ変えられるように
export function pvStrip(add, c, px){
 if(!isFree() || APP.active!=='main' || APP.finished) return;
 const v=predV(c); const fam=familyOf(v); if(!fam.length) return;
 const base=pvBase(v); const plain=fam.find(x=>!x.pv && !x.prep && !x.tail);
 const items=fam.filter(x=>x!==plain).sort((a,b)=>(b.star||0)-(a.star||0)||(a.en+(a.tail||'')).length-(b.en+(b.tail||'')).length).slice(0,4);
 const FY=100-px(114);
 add('pvs-cap',`<div class="pvchip cap"><b>🎡 ${esc(base)} ＋</b><small>もっと見る</small></div>`,11,FY,{cls:'ui fb',tap:()=>{ APP.open='dial'; renderScene(); }});
 const xs=[31,69,90];
 items.slice(0,3).forEach((x,i)=>{ const pp=pvPart(x); const P=PARTICLE[pp]||PARTICLE.idiom; const lab=[x.tail,x.prep].filter(Boolean).join(' ').replace('{poss}','my')||pp||'';
  add('pvs-'+x.id,`<div class="pvchip ${v.id===x.id?'on':''}"><b class="en">${P.e} ${esc(lab)}</b><small>${esc(x.ja)}</small></div>`,xs[i],FY,{cls:'ui fb',tap:()=>{ if(v.id===x.id){ if(plain) swapVerb(plain.id); } else swapVerb(x.id); }}); });
}
export function dialNodes(add, c){
 const v=predV(c); const fam=familyOf(v); if(!fam.length){ APP.open=null; return; }
 const base=pvBase(v); const plain=fam.find(x=>!x.pv && !x.prep && !x.tail); const items=fam.filter(x=>x!==plain);
 add('ui-prompt',`<div class="guide"><span class="gp">🎡</span>${esc(base)} ＋ ？ つける言葉で意味が変わる</div>`,46,4.2,{cls:'lbl ui'});
 add('b-dialx',`<div class="dialx">×</div>`,93,4.2,{cls:'ui fb',tap:()=>{ APP.open=null; APP.keepDial=false; renderScene(); }});
 const cx=50, cy=31, rx=36, ry=15.5;
 add('dial-ring','<div class="dialring"></div>',cx,cy,{cls:'lbl ui'});
 add('dial-c',`<div class="dialc ${plain&&v.id===plain.id?'on':''}"><b class="en">${esc(base)}</b><small>${esc(plain?plain.ja:'')}</small></div>`,cx,cy,{cls:'ui fb',tap:()=>{ if(plain) swapVerb(plain.id); else { APP.open=null; renderScene(); } }});
 const PER=10; const pages=Math.ceil(items.length/PER); const pg=(APP.dialPage||0)%Math.max(1,pages); const shown=items.slice(pg*PER,pg*PER+PER);
 if(pages>1) add('dial-more',`<div class="morec">↻<small>${pg+1}/${pages}</small></div>`,9,cy-ry+1,{cls:'ui fb',tap:()=>{ APP.dialPage=pg+1; renderScene(); }});
 shown.forEach((x,i)=>{ const a=(i/shown.length)*Math.PI*2-Math.PI/2; const pp=pvPart(x); const P=PARTICLE[pp]||PARTICLE.idiom; const lab=[x.tail,x.prep].filter(Boolean).join(' ').replace('{poss}','my');
  add('dial-'+x.id,`<div class="dialp ${v.id===x.id?'on':''}"><span>${P.e}</span><b class="en">${esc(lab)}</b></div>`,cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,{cls:'ui fb',tap:()=>swapVerb(x.id)}); });
 // info card: core image of the particle + meaning + same-meaning verb
 if(v.pv || (v!==plain && pvPart(v))){ const vp=pvPart(v); const P=PARTICLE[vp]||PARTICLE.idiom; const al=altsOf(v);
  add('dial-info',`<div class="dinfo"><div class="dimg a-${P.a}"><span>${P.e}</span></div><div class="dtx"><b class="en">${esc(verbLabel(v))}</b> ＝ ${esc(v.ja)}<small>${esc(vp==='idiom'?'':'「'+vp+'」のイメージ：'+P.core)}</small><small class="mean">${esc(v.mean||'')}</small></div></div>`,50,56,{cls:'lbl ui dinfow'});
  const sx=[]; al.forEach(a=>sx.push({t:'⇄ '+verbLabel(a)+'（'+a.ja+'）',id:a.id})); if(v.synText) sx.push({t:'＝ '+v.synText,id:null});
  sx.slice(0,2).forEach((s,i)=>add('dial-syn'+i,`<div class="pill syn ${s.id?'':'ro'}">${esc(s.t)}</div>`,i?72:28,66,{cls:'ui fb',tap:s.id?()=>swapVerb(s.id):null}));
 } else if(plain){ add('dial-info',`<div class="dinfo"><div class="dimg"><span>${esc(v.e)}</span></div><div class="dtx"><b class="en">${esc(base)}</b> ＝ ${esc(v.ja)}<small>まわりの言葉をつけると、意味が変わります</small></div></div>`,50,56,{cls:'lbl ui dinfow'}); }
}

// ---------- keep sentences sensible: who can do what, which "how" fits which verb ----------
export let ANIMAL_V;
export let IT_V;
export let IT_S;
export let NOSELF_LK;
export function selfSubj(c){ const r=subjRefForScene(c,APP.active); return r==='p:i'||r==='p:we'; }
export function subjKind(c){ const r=subjRefForScene(c,APP.active); if(!r) return 'person'; if(r==='p:it') return 'it'; const n=N(r); if(!n) return 'person'; if(n.animal) return 'animal'; return 'person'; }
export function verbFitsSubj(c,v){ const k=subjKind(c); if(v.custom) return true; if(v.weather) return k==='it'; if(k==='animal') return ANIMAL_V.has(v.id) && !(v.id==='fly' && subjRefForScene(c,APP.active)!=='p:bird'); if(k==='it') return IT_V.has(v.id)||!!v.weather; if(v.id==='fly') return false; return true; }
export let IT_WEATHER;
export function stateFitsSubj(c,s){ const k=subjKind(c); if(s.custom||s.typed) return true; if(s.weather) return k==='it'; if(s.noun && k!=='person') return false; if(k==='it') return IT_S.has(s.id)||!!s.weather; if(k==='animal') return !['busy','late','smart','proud','bored'].includes(s.id); return true; }
export let MANNER_OK;
export function mannerFits(c,m){ const v=predV(c); if(!v || c.pred.k!=='v' || (v.stative&&!m.neg)) return false; if(v.custom||m.custom) return true; const L=MANNER_OK[m.id]; return L===null || !L || L.includes(v.id); }
export let WITH_NO;
export function withFits(c){ const v=predV(c); if(c.type==='exist') return false; if(!v) return false; if(subjKind(c)==='it') return false; if(v.stative || WITH_NO.has(v.id)) return false; return true; }

// ---------- how often a word is used: 1 よく / 2 まあまあ / 3 たまに ----------

// estimated everyday frequency (100 = very common … 10 = rare) and learner level (1 入門 … 4 上級)
export let FREQ_LIST;
export let FREQ; 

export function baseId(o){ const id=o.id||''; return id.includes(':')?id.split(':').pop():id; }
export function freqOf(o){ const id=baseId(o); if(FREQ[id]!=null) return FREQ[id]; { const vv=LEX.idx['verbs:'+id]; if(vv && vv.star) return ({3:60,2:35,1:20})[vv.star]||35; } const lv=levelOfRaw(o); return o.casual?20:({1:60,2:35,3:20,4:10})[lv]||20; }
export function levelOfRaw(o){ const id=baseId(o); const x=(LEX.idx['verbs:'+id]||LEX.idx['things:'+id]||LEX.idx['people:'+id]||LEX.idx['states:'+id]||LEX.idx['manners:'+id]||LEX.idx['places:'+id]||LEX.idx['times:'+id]); if(x && x.cefr) return x.cefr; if(typeof CEFR_LV!=='undefined' && CEFR_LV[id]) return CEFR_LV[id]; return 3; }
export function levelOf(o){ const id=baseId(o); const x=(LEX.idx['verbs:'+id]||LEX.idx['things:'+id]||LEX.idx['people:'+id]||LEX.idx['states:'+id]||LEX.idx['manners:'+id]||LEX.idx['places:'+id]||LEX.idx['times:'+id]); if(x && x.cefr) return x.cefr; if(typeof CEFR_LV!=='undefined' && CEFR_LV[id]) return CEFR_LV[id]; const f=freqOf(o); return f>=100?1:f>=60?2:f>=35?3:4; }
export function weightOf(o){ const lv=levelOf(o), my=SET().level||2; const lf = lv<=my? 1 : lv===my+1? 0.08 : 0.01; const f=freqOf(o)/10; return f*f*f*lf; }
export let T3;
export function tierOf(o){ const f=freqOf(o); return f>=100?1:f>=35?2:3; }
export function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
export function pickMix(list, n, avoid){
 avoid=new Set(avoid||[]); let pool=list.filter(o=>!avoid.has(o.id)); if(pool.length<n) pool=list.slice();
 const out=[]; const bag=pool.map(o=>({o,w:weightOf(o)}));
 while(out.length<n && bag.length){ const tot=bag.reduce((s,x)=>s+x.w,0); let r=Math.random()*tot; let i=0; for(;i<bag.length;i++){ r-=bag[i].w; if(r<=0) break; } i=Math.min(i,bag.length-1); out.push(bag[i].o); bag.splice(i,1); }
 const sel=list.find(o=>o.sel); if(sel && !out.includes(sel)){ out.pop(); out.unshift(sel); }
 return shuffle(out).map(o=>o.id);
}
export function hasFamily(o){ const v=o&&LEX.idx['verbs:'+o.id]; return !!(v && !v.pv && PVBASE[v.en] && familyOf(v).length); }
export function ensureFamily(ids, list, n){ if(!list.some(o=>LEX.idx['verbs:'+o.id])) return ids; const byId=new Map(list.map(o=>[o.id,o])); let have=ids.filter(id=>hasFamily(byId.get(id))).length; if(have>=2) return ids; const pool=shuffle(list.filter(o=>hasFamily(o)&&!ids.includes(o.id))); const out=ids.slice(); for(let i=out.length-1;i>=0 && have<2 && pool.length;i--){ const o=byId.get(out[i]); if(!hasFamily(o) && !(o&&o.sel)){ out[i]=pool.shift().id; have++; } } return out; }
export function sampled(key, list, n){
 APP.sample=APP.sample||{};
 if(list.length<=n) return list;
 if(APP.basicMode && !APP.sample[key]){ const b=list.slice().sort((a,b)=>weightOf(b)-weightOf(a)); APP.sample[key]=b.slice(0,n).map(o=>o.id); }
 const byId=new Map(list.map(o=>[o.id,o]));
 let ids=APP.sample[key];
 if(!ids || ids.some(i=>!byId.has(i))){ ids=ensureFamily(pickMix(list,n),list,n); APP.sample[key]=ids; }
 return ids.map(i=>byId.get(i)).filter(Boolean);
}
export function reshuffle(key, list, n){ APP.sample=APP.sample||{}; APP.sample[key]=ensureFamily(pickMix(list,n,APP.sample[key]),list,n); renderScene(); }
// options for one category: 6 random at once, then ↻ and その他 (categories only when asked)
export function optionsView(key, list, n, revKey){
 n=n||6; APP.grp=APP.grp||{}; APP.others=APP.others||{};
 const ch=[];
 const g=APP.grp[key];
 if(g){ const L=list.filter(o=>o.g===g); const pg=paged(L,key+'@'+g,n); if(pg.more) ch.push({e:'＋',label:'その他',act:pg.next}); ch.push({e:'◀',label:'種類へ',back:1,act:()=>{ delete APP.grp[key]; renderScene(); }}); return {items:pg.items,chips:ch}; }
 if(APP.others[key]){ const gs=[...new Set(list.map(o=>o.g||'mine'))]; gs.forEach(x=>{ const d=GDEF[x]||['📦',x]; ch.push({e:d[0],label:d[1],act:()=>{ APP.grp[key]=x; if(revKey) APP.rev[revKey]=true; renderScene(); }}); }); ch.push({e:'◀',label:'もどる',back:1,act:()=>{ delete APP.others[key]; renderScene(); }}); return {items:[],chips:ch}; }
 const fx=list.filter(o=>o.fixed!=null).sort((a,b)=>a.fixed-b.fixed); let items;
 if(fx.length && !(APP.fixedOff||{})[key]){ items=fx.slice(0,n); }
 else items=sampled(key,list.filter(o=>o.fixed==null||(APP.fixedOff||{})[key]),n);
 const ic=[{e:'🔍',label:'さがす',act:openSearch}];
 if(list.length>n){ ch.push({e:'🔄',label:'ほかの言葉',more:1,act:()=>{ if(revKey) APP.rev[revKey]=true; APP.fixedOff=APP.fixedOff||{}; if(list.some(o=>o.fixed!=null)&&!APP.fixedOff[key]){ APP.fixedOff[key]=true; APP.sample=APP.sample||{}; delete APP.sample[key]; renderScene(); return; } reshuffle(key,list.filter(o=>o.fixed==null),n); }}); }
 if(list.some(o=>o.g)) ic.push({e:'🗂️',label:'種類から',act:()=>{ APP.others[key]=true; if(revKey) APP.rev[revKey]=true; renderScene(); }});
 if(typeof addSpecFor==='function' && addSpecFor(key)) ic.push({e:'➕',label:'ことばを足す',act:()=>openAddWord(key)});
 return {items,chips:ch,icons:ic};
}

// ---------- floating choices: drawn on the same canvas as the picture ----------
export let sideTimer;
export function optCardHtml(o){ const L=SET().lang; const t = L==='ja'?`<b class="jb">${esc(o.ja)}</b>`: L==='en'?`<b class="en">${esc(o.en)}</b>`:`<b class="en">${esc(o.en)}</b><small>${esc(o.ja)}</small>`; return `<div class="op pos-${o.pos} ${o.sel?'sel':''} ${o.big?'big':''}"><span class="oe">${ico(o.e)}</span><span class="ot">${t}</span></div>`; }
export function bubbleHtml(k,c,o){ const d=catDef(k,c); if(!d) return ''; o=o||{}; const val=o.val; return `<div class="cat pos-${d[2]} ${o.on?'on':''} ${val?'filled':''} ${o.tgl?'tgl':''} ${o.big?'bigp':''} ${o.sm?'sm':''} ${o.main?'mainp':''}"><b class="en">${o.en||d[0]}</b><span>${esc(o.ja||d[1])}</span>${val&&val!==true?`<i>${esc(val)}</i>`:(val===true?'<i>✓</i>':'')}${o.x?'<em>×</em>':''}</div>`; }
export function paged(list,key,per){ const n=Math.max(1,Math.ceil(list.length/per)); const p=(APP.page[key]||0)%n; return {items:list.slice(p*per,p*per+per), more:n>1, label:(p+1)+'/'+n, next:()=>{ APP.page[key]=p+1; renderScene(); }}; }
export let PROG;
export function revealed(k){ return !!APP.rev[k]; }
export function reveal(k, group){ const on=!APP.rev[k]; (group||[]).forEach(g=>delete APP.rev[g]); if(on) APP.rev[k]=true; else delete APP.rev[k]; renderScene(); }
export function auxCats(c, kind){
 if(kind==='purpose'||kind==='part'||kind==='caus'||(kind==='comp'&&c.vform)) return [];
 if(c.type==='imp') return ['imp','neg'];
 if(c.type==='exist') return ['neg'];
 const L=[]; if(kind==='main' && c.type==='normal' && relAble(c.passive?c.obj:c.subj) && !c.subs.rel && !c.pred) L.push('relsubj'); if(c.type==='normal' && kind!=='rel') L.push('freq'); if(isFree()||SET().kModal) L.push('modal'); if(isFree()||SET().kNeg) L.push('neg'); return L;
}
export function chunkPic(p){
 const key=p.key.split('.').pop(); const cl=p.clause==='m'?APP.S.main:(APP.S.main.subs[p.clause]||{}).c||APP.S.main; const v=predV(cl), s=predS(cl);
 if(key==='subj'){ const r=cl.passive?cl.obj:cl.subj; return r&&N(r)?N(r).e:'❓'; }
 if(key==='obj'){ const r=cl.passive?cl.subj:cl.obj; return r&&N(r)?N(r).e:'❓'; }
 if(key==='verb') return v? v.e : '🟰'; if(key==='state') return s? s.e:'❔';
 if(key==='aux'||key==='qaux') return cl.modal? MD(cl.modal).e : cl.neg?'✕':(key==='qaux'?'❓':'⏱️');
 if(key==='place') return cl.place?PL(cl.place).e:'📍'; if(key==='time') return cl.time?TM(cl.time).e:'🕒'; if(key==='manner') return cl.manner?MN(cl.manner).e:'✨';
 if(key==='with') return cl.with==='alone'||/^self_/.test(cl.with||'')?'🚶':cl.with==='together'?'🫶':(cl.with?N(cl.with).e:'🤝'); if(key==='wh') return '❓'; if(key==='thing') return cl.thing?N(cl.thing).e:'📦';
 if(key==='by') return cl.subj?N(cl.subj).e:'👤'; if(key==='than') return cl.than?N(cl.than).e:'⚖️';
 return '🔗';
}
export function trailNodes(add, c, kind){ return;
 if(APP.finished) return;
 const ck=kind==='main'?'m':kind;
 const parts=sentenceParts(APP.S).filter(p=>p.clause===ck && p.en && !p.hole);
 if(parts.length){ const p=parts[parts.length-1]; add('trail-'+p.key+'-'+p.en,`<div class="trail pos-${p.pos}"><em>${ico(chunkPic(p))}</em><b>${esc(p.en)}</b></div>`,8,72,{cls:'lbl trailw'}); }

}
// areas: each stage splits the canvas into regions (left→right = English order)
export function areasOf(c, kind, st){
 if(APP.finished || APP.open) return [];
 if(st==='subj' && !(askStage()&&APP.askOpen) && startStage()) return startAreas();
 if(st==='subj' && askStage()) return APP.askOpen? [{x0:0,x1:.5,k:'qyn',label:'Do…？ Can…？',ja:'はい・いいえできく',pos:'aux'},{x0:.5,x1:1,k:'qwh',label:'What？ Where？',ja:'疑問詞できく',pos:'wh'}] : startAreas();
 if(st==='subj') return [{x0:0,x1:.5,k:'who',label:'Who？',ja:'誰が？（人）',pos:'noun'},{x0:.5,x1:1,k:'what',label:'What？',ja:'何が？（物・動物）',pos:'noun'}];
 if(st==='split' && APP.active==='rel' && relGap()==='o') return [{x0:0,x1:1,k:'other',label:'What？',ja:'（その人・物に）何をした？',pos:'verb'}];
 if(st==='split' && bePending(c) && LV()<3) return [{x0:0,x1:1,k:'bmain',label:'How？',ja:'どう？',pos:'adj',main:1}];
 if(st==='split' && bePending(c)){ const nn=APP.beKind==='noun'; return [{x0:0,x1:.3,k:'bdeg',label:nn?'What kind？':'How much？',ja:nn?'どんな？':'どれくらい？',pos:'aux'},{x0:.3,x1:1,k:'bmain',label:nn?'Who？':'How？',ja:nn?'何者？':'どう？',pos:'adj',main:1}]; }
 if(st==='split' && LV()<2) return [{x0:0,x1:1,k:'how',label:'How？',ja:'どんな感じ？ 何してる？',pos:'verb'}];
 if(st==='split') return [{x0:0,x1:.5,k:'how',label:'How？',ja:'どんな感じ？',pos:'verb'},{x0:.5,x1:1,k:'other',label:'What？',ja:'何かにすること',pos:'verb'}];
 if(st==='iobj') return [{x0:.5,x1:1,k:'iobj',label:'Who？',ja:'誰に？（人が先）',pos:'noun'}];
 if(st==='obj') return objZones(c);
 if(st==='thing'||st==='than'||st==='mthan') return [{x0:0,x1:1,k:st,label:catDef(st,c)[0],ja:catDef(st,c)[1],pos:'noun'}];
 if(st==='extras' && cardMode()) return [];
 if(st==='extras'){ const sl=afterSlots(c,kind); return sl.map((s,i)=>{ const d=catDef(s,c); return {x0:i/sl.length,x1:(i+1)/sl.length,k:s,label:d[0],ja:d[1],pos:d[2],slot:1}; }); }
 return [];
}
export function bePending(c){ return APP.lsub==='be' && c.pred && c.pred.k==='s' && !c.pred.id; }
export function objZones(c){ const v=predV(c); const dt=!!(v&&v.dt), caus=!!(v&&v.caus);
 if(caus) return [{x0:0,x1:1,k:'objR',label:'Who？',ja:'誰を？',pos:'noun',main:1}];
 if(dt) return [{x0:0,x1:.5,k:'objL',label:'Who？',ja:'誰に？（なくてもOK）',pos:'noun'},{x0:.5,x1:1,k:'objR',label:'What？',ja:'何を？',pos:'noun',main:1}];
 const hasP=optList('objP',c).length>0, hasT=optList('objT',c).length>0;
 if(APP.active==='main' && LV()>=4 && vcForms(v).length){
  const zs=[]; if(hasP) zs.push({k:'objP',label:'Who？',ja:hasT?'誰を？（人）':'誰を？',pos:'noun'}); if(hasT) zs.push({k:'objR',label:'What？',ja:hasP?'何を？（物）':'何を？',pos:'noun'});
  const f=vcForms(v); zs.push({k:'vc',label:f.length>1?'to / …ing':(f[0]==='to'?'to …':'…ing'),ja:'〜することを',pos:'verb',main:1});
  return zs.map((z,i)=>Object.assign(z,{x0:i/zs.length,x1:(i+1)/zs.length})); }
 if(hasP && !hasT) return [{x0:0,x1:1,k:'objP',label:'Who？',ja:'誰を？',pos:'noun',main:1}];
 if(!hasP) return [{x0:0,x1:1,k:'objR',label:'What？',ja:'何を？',pos:'noun',main:1}];
 return [{x0:0,x1:.5,k:'objP',label:'Who？',ja:'誰を？（人）',pos:'noun'},{x0:.5,x1:1,k:'objR',label:'What？',ja:'何を？（物）',pos:'noun',main:1}]; }
export function adjOpts(c, cat, after){ return LEX.states.filter(s=>!s.noun).map(s=>({casual:s.casual,id:s.id,g:s.custom?'mine':(SGRP[s.id]||'slook'),e:s.e,en:s.en,ja:stateJaLabel(s),pos:'adj',sel:c[cat==='nadj'?'adj':cat]===s.id,act:()=>{ pick(cat,s.id); APP.rev=after; APP.lastArea=Object.keys(after)[0]; renderScene(); }})); }
export function intensOpts(c){ return [['more','📶','もっと（〜より）','-er …'],['most','👑','いちばん','the -est'],['as','🟰','同じくらい','as … as']].filter(()=>LV()>=4).map(d=>({id:'dg_'+d[0],e:d[1],en:d[3],ja:d[2],pos:'adv',sel:c.degree===d[0],act:()=>{ pick('degree',d[0]); APP.rev={bmain:true}; APP.lastArea='bmain'; renderScene(); }})).concat(Object.keys(INTENS).map(k=>({id:'in_'+k,e:INTENS[k][2],en:INTENS[k][0],ja:INTENS[k][1],pos:'adv',sel:c.intens===k,act:()=>{ pick('intens',k); APP.rev={bmain:true}; APP.lastArea='bmain'; renderScene(); }}))); }
export function objDual(c){ const v=predV(c); if(!v) return false; const L=optList('obj',c); return L.some(o=>{ const pp=LEX.idx['people:'+o.id]; return pp && !pp.thing; }) && L.some(o=>LEX.idx['things:'+o.id]); }
export function openSlot(s,c){ const kind=APP.active; const L=optionalLeft(kind); L.slice(0,L.indexOf(s)).forEach(x=>markPassed(kind,x));
 if(s==='relobj'){ APP.relTarget='obj'; APP.open='relk'; renderScene(); return; }
 if(s==='relwP'||s==='relwT'){ markPassed('main',s); openSub('relw',{slot:s==='relwP'?'place':'time'}); return; }
 if(s==='toWhom') APP.iobjLate=true; APP.open=s; renderScene(); }
export function chooseArea(ar, c){
 if(!ar) return; dismissPrompt(); APP.lastArea=ar.k;
 if(ar.k==='vc'){ const f=vcForms(predV(c)); if(f.length===1){ openVc(f[0]); return; } }
 if(ar.slot){ openSlot(ar.k,c); return; }
 if(ar.k==='sti'||ar.k==='stit'){ APP.sayDone=true; APP.rev={}; promptKey=''; pick('subj',ar.k==='sti'?'p:i':'p:it'); return; }
 if(ar.k==='toWhom') APP.iobjLate=true;
 if(ar.k==='who'||ar.k==='what'){ APP.subjTab=ar.k; APP.rev={[ar.k]:true}; }
 else if(ar.k==='how'){ APP.side='self'; APP.sideAuto=false; APP.rev={how:true}; }
 else if(ar.k==='other'){ APP.side='other'; APP.sideAuto=false; APP.rev={other:true}; }
 else if(ar.k==='say'){ APP.sayDone=true; APP.rev={}; promptKey=''; }
 else if(ar.k==='ask'){ APP.askOpen=true; APP.rev={}; promptKey=''; }
 else if(ar.k==='objL'){ APP.rev={objL:true}; }
 else if(ar.k==='objR'){ APP.rev={objR:true}; }
 else if(ar.slot){ APP.open=ar.k; }
 else APP.rev={[ar.k]:true};
 renderScene();
}
export function nextInfo(){
 const c=AC(), kind=APP.active, st=stageOf();
 if(APP.finished) return {label:'新しく',act:resetAll};
 if(APP.open) return {label:'閉じる',act:()=>{ APP.open=null; APP.preCat=null; renderScene(); }};
 if(kind==='main' && isFree() && isEmptyMain()) return {label:'誰が？',act:()=>{ APP.open='subj'; renderScene(); }};
 const cur=cursorOf(kind);
 if(cur==='obj' && APP.active==='main' && LV()>=4 && vcForms(predV(c)).length && !optList('objT',c).length && !optList('objP',c).length){ return {label:'〜することを',act:()=>{ APP.rev={vc:true}; renderScene(); }}; }
 if(cur==='obj'){ const v=predV(c); const hasT=!(v&&v.caus) && optList('objT',c).length>0; return {label:'何を？',act:()=>{ if(hasT){ APP.rev={objR:true}; renderScene(); toast('右の「何を？」から選んでね'); } else { APP.rev={objR:true}; renderScene(); toast('この動詞は人を選んでね'); } }}; }
 if(cur && slotsOf(kind).find(s=>s.name===cur).req){ return {label:'選んでね',act:()=>{ const ar=areasOf(c,kind,st); if(ar.length) chooseArea(ar[ar.length>1&&APP.side==='other'?1:0],c); toast('ここは文に必要なので、ひとつ選んでね'); }}; }
 if(kind!=='main') return {label:exitLabel(kind),act:exitSub,strong:true};
 if(cur) return {label:'とばす',act:()=>{ markPassed(kind,cur); renderScene(); }};
 if(sentenceComplete(APP.S)) return {label:'完成',act:openFinish,strong:true};
 return null;
}
export function goNext(){ const n=nextInfo(); if(n) n.act(); }
export function uiNodes(add, c, kind, st){
 const m=APP.S.main; const pv=false;
 const k = APP.finished? 'done' : (APP.open || st);
 trailNodes(add,c,kind);
 if(APP.search && !APP.finished){ searchNodes(add); return; }
 if(!APP.finished && APP.active==='main' && !APP.open && isEmptyMain()){
  if(APP.frameMode==='pick') add('frm-start','<div class="pill frst on">🎰 型：つぎは「だれが」を選んでね <b class="frx">✕</b></div>',50,79,{cls:'ui fb frstw keep',tap:()=>{ APP.frameMode=null; APP.framePend=null; renderScene(); }});
  else add('frm-start','<div class="pill frst">🎰 型から始める</div>',50,79,{cls:'ui fb frstw keep',tap:()=>{ APP.frameMode='frame'; openFrameStart(); }}); }
 if(APP.hist.length && !APP.finished) add('edge-back','<div class="edgebtn">◀</div>',3.5,46,{cls:'ui fb edge',tap:undo});
 { const nx=APP.finished?null:nextInfo(); if(nx) add('edge-next',`<div class="edgebtn nx ${nx.strong?'strong':''}"><b>▶</b><small>${esc(nx.label)}</small></div>`,96.5,46,{cls:'ui fb edge',tap:nx.act}); }
 const prompt=(t,ic)=>add('ui-prompt',`<div class="guide ${APP.flash?'flash':''}">${APP.flash?'<span class="gp">➡️</span>':(ic?`<span class="gp">${ic}</span>`:'')}${esc(APP.flash||t)}</div>`,50,4.2,{cls:'lbl ui'});
 const tile=(id,o,x,y,o2)=>{ o2=o2||{}; const L=SET().lang; const t = L==='ja'?`<b class="jb">${esc(o.ja)}</b>`: L==='en'?`<b class="en">${esc(o.en)}</b>`:`<b class="en">${esc(o.en)}</b><small>${esc(o.ja)}</small>`; add('o-'+id,`<div class="tile pos-${o.pos} ${o.sel?'sel':''} ${o.bold?'bold':''} ${L!=='ja'&&String(o.en||'').length>11?'long':''}"><span class="te">${ico(o.e)}</span>${t}</div>`,x,y,{cls:'ui fo'+(o2.dim?' dim':'')+(o2.faint?' faint':''),tap:o.act}); };
 const card=(id,o,x,y,o2)=>{ o2=o2||{}; add('o-'+id,optCardHtml(o),x,y,{cls:'ui fo'+(o2.dim?' dim':'')+(o2.faint?' faint':''),tap:o.act}); };
 const bub=(id,k2,x,y,o,tap)=>add('b-'+id,bubbleHtml(k2,c,o),x,y,{cls:'ui fb'+(o&&o.dim?' dim':'')+(o&&o.pulse?' pulse':''),tap});
 const chipRow=(key,cs,xs,y,o2,dy)=>{ o2=o2||{}; cs.forEach((ch,i)=>add('g-'+key+'-'+ch.label,`<div class="gchip ${ch.back?'back':''}"><span>${ch.e}</span><small>${esc(ch.label)}</small></div>`,xs[i%xs.length],y+Math.floor(i/xs.length)*(dy||9),{cls:'ui fb'+(o2.faint?' faint':'')+(o2.dim?' dim':''),tap:ch.act})); return Math.ceil(cs.length/xs.length); };
 const icons=(key,ic)=>{ (ic||[]).forEach((x,i)=>add('ic-'+key+'-'+i,`<div class="sicon" title="${esc(x.label)}">${x.e}</div>`,93-i*10,4.2,{cls:'ui fb',tap:x.act})); };
 // block of 6 tiles (2 columns × 3 rows) + chips under it
 const SH=Math.max(300,($('#scene')&&$('#scene').clientHeight)||500), px=v=>v/SH*100; const NOPT = SH<470? 4 : 6;
 const block=(key,list,xs,y0,o2,revKey)=>{ const v=optionsView(key,list,NOPT,revKey); const st=px(66); const X=[18,50,82]; v.items.forEach((o,i)=>tile(key+'-'+o.id,o,X[i%3],y0+Math.floor(i/3)*st,o2)); const rows=Math.ceil(v.items.length/3); const k3=v.items.length; icons(key,v.icons); if(v.chips.length===1&&v.chips[0].more){ chipRow(key,v.chips,[X[k3%3]],y0+Math.floor(k3/3)*st,o2); return; } if(v.chips.length) chipRow(key,v.chips,[20,40,60,80],y0+rows*st+(rows?px(2):0),o2,px(54)); };
 const blockWide=(key,list,y0,o2,revKey,nn)=>{ const v=optionsView(key,list,nn||NOPT,revKey); const st=px(52); v.items.forEach((o,i)=>card(key+'-'+o.id,o,[28,72][i%2],y0+Math.floor(i/2)*st,o2)); const rows=Math.ceil(v.items.length/2); const k2=v.items.length; icons(key,v.icons); if(v.chips.length===1&&v.chips[0].more){ chipRow(key,v.chips,[[28,72][k2%2]],y0+Math.floor(k2/2)*st,o2); return; } if(v.chips.length) chipRow(key,v.chips,[20,40,60,80],y0+rows*st+(rows?px(4):0),o2,px(54)); };
 // ---- opened overlay ----
 if(!APP.finished && APP.open==='dial'){ dialNodes(add,c); if(APP.open==='dial') return; }
 const LISTCATS=['cw','sadjL','oadjL','exadjL','cmpw','intens','sobj','freq','relk','modal','q','imp','place','time','manner','with','degree','purpose','rel','conj','pre','toWhom','cmp','mcmp','scope'];
 if(!APP.finished && APP.open && LISTCATS.includes(APP.open)){
  const o=APP.open;
  prompt(o==='relk'?relkPrompt():(PROMPT[o]||''), o==='q'?'❓':'👇');
  bub('x-'+o,o,50,12.5,{on:true,val:catValue(o,c),x:true},()=>{ APP.open=null; APP.preCat=null; renderScene(); });
  if(o==='pre' && APP.preCat) add('pc-back','<div class="gchip back"><span>◀</span><small>種類へ</small></div>',12,12.5,{cls:'ui fb',tap:()=>{ APP.preCat=null; renderScene(); }});
  if(o==='manner' && LV()>=4){ const D=[[null,'ふつう'],['more','もっと'],['most','いちばん'],['as','同じくらい']]; if(APP.mdegPend===undefined) APP.mdegPend=c.mdeg||null; D.forEach((d,i)=>add('md-'+(d[0]||'n'),`<div class="ltab ${APP.mdegPend===d[0]?'on':''}"><small>${d[1]}</small></div>`,20+i*20,19.5,{cls:'ui fb',tap:()=>{ APP.mdegPend=d[0]; renderScene(); }})); }
  blockWide('x'+o+(o==='pre'?(APP.preCat||''):''),optList(o,c),o==='manner'?27:24,null,null,(o==='pre'&&!APP.preCat)?8:6);
  return;
 }
 if(k==='entry'){
  const side=APP.entrySide||'say';
  if(false){
   prompt(tx('head.sayOrAsk'),'✨');
   bub('esay','say',31,30,{big:1,main:1,en:'Say',ja:'💬 '+tx('head.say'),pulse:1},()=>{ APP.entrySide='say'; renderScene(); });
   bub('eask','ask',75,30,{big:1,en:'Ask',ja:'❓ '+tx('head.ask')},()=>{ APP.entrySide='ask'; renderScene(); });
   return;
  }
  const hy=11; const other=side==='say'?'ask':'say'; const LB={say:'💬 '+tx('head.say'),ask:'❓ '+tx('head.ask')};
  add('lh-e'+side,`<div class="lhead ${side==='say'?'be':'do'}">${LB[side]}</div>`,side==='say'?27:72,hy,{cls:'lbl ui'});
  add('ls-e'+other,`<div class="lswitch">⇄ ${tx('head.'+other)}</div>`,side==='say'?76:22,hy,{cls:'ui fb',tap:()=>{ APP.entrySide=other; APP.qGroup=null; APP.ePick=null; renderScene(); }});
  const ring=(items,cy)=>items.forEach((e,i)=>{ const a=(i/items.length)*Math.PI*2-Math.PI/2; add('b-e'+e.id,`<div class="cat big ering pos-${e.pos} ${e.on?'picked':''}"><b class="en">${esc(e.en)}</b><span>${esc(e.ja)}</span></div>`,50+Math.cos(a)*30,cy+Math.sin(a)*27,{cls:'ui fb',tap:e.act}); });
  const center=(opts)=>opts.forEach((o,i)=>add('ec-'+i,`<div class="pill sm">${esc(o[0])}</div>`,50,48+(i-(opts.length-1)/2)*9,{cls:'ui fb',tap:o[1]}));
  if(side==='say'){
   const E=[['tp','Yesterday, …','いつから・どこで','adv',[['Yesterday, …','いつから',()=>entry('time')],['In the park, …','どこで',()=>entry('place')]]],
            ['wi','When / If …,','〜した時に・もし','conj',[['When I …,','〜した時に',()=>entry('when')],['If …, ☁️','もし（ありそう）',()=>openSub('conj',{conj:'if',front:true})],['If …, 🦄','もし（ありえない・想像）',()=>openSub('conj',{conj:'ifx',front:true})]]],
            ['pt','Walking …,','〜しながら','conj',null,()=>openSub('part',{})],
            ['ex','What a …!','なんて〜！','adj',null,()=>entry('excl')],
            ['im',"Do it! / Let's",'して！・しよう','verb',[['Do it!','して！',()=>entry('impdo')],["Let's …",'しよう！',()=>entry('lets')],['Let me …','〜させて',()=>entry('letme')],['Please …','してください',()=>entry('please')]]],
            ['th','There is …','ある・いる','noun',null,()=>entry('exist')]];
   const P=[[28,24],[72,24],[80,47],[72,70],[28,70],[20,47]];
   E.forEach((e,i)=>add('b-e'+e[0],`<div class="cat big ering pos-${e[3]} ${APP.ePick===e[0]?'picked':''}"><b class="en">${esc(e[1])}</b><span>${esc(e[2])}</span></div>`,P[i][0],P[i][1],{cls:'ui fb',tap:()=>{ if(e[4]){ APP.ePick=APP.ePick===e[0]?null:e[0]; renderScene(); } else e[5](); }}));
   const G=E.find(e=>e[0]===APP.ePick);
   if(G) G[4].forEach((o,i)=>add('ec-'+i,`<div class="subch"><b>${esc(o[0])}</b><small>${esc(o[1])}</small></div>`,50,47+(i-(G[4].length-1)/2)*px(52),{cls:'ui fb',tap:()=>{ APP.ePick=null; o[2](); }}));
   else { add('b-esubj','<div class="cat big main ecenter pos-noun"><i>🙋</i><b class="en">I …</b><span>人が</span></div>',37,47,{cls:'ui fb',tap:()=>{ APP.sayDone=true; pick('subj','p:i'); }}); add('b-esubj2','<div class="cat big main ecenter pos-adj"><i>📦</i><b class="en">It …</b><span>物が</span></div>',63,47,{cls:'ui fb',tap:()=>{ APP.sayDone=true; pick('subj','p:it'); }}); }
  } else {
   const YN=[['be','Are you …? / Is she …?','〜なの？（状態）'],['do','Do you …? / Does he …?','〜する？（動作）'],['have','Have you ever …?','〜したことある？']];
   const QG=[['yn','Yes / No？','はい・いいえ',null],['what','What？','何を・何をする',[['obj','What … ?','何を？'],['action','What … do?','何をする？']]],['who','Who？','誰が・誰と',[['subj','Who …?','誰が？'],['with','Who … with?','誰と？']]],['where','Where？','どこ？',[['place']]],['when','When？','いつ？',[['time']]],['why','Why？','どうして？',[['why']]],['how','How？','どう？（〜だ・する）',[['state']]]];
   const goQ=id=>{ APP.qGroup=null; mutate(()=>{ APP.S.main.q={wh:null}; },null); pick('wh',id); };
   const P=[[50,18],[80,30],[82,60],[65,78],[35,78],[18,60],[20,30]];
   QG.forEach((g,i)=>add('b-eq'+g[0],`<div class="cat big ering pos-wh ${APP.qGroup===g[0]?'picked':''}"><b class="en">${esc(g[1])}</b><span>${esc(g[2])}</span></div>`,P[i][0],P[i][1],{cls:'ui fb',tap:()=>{ if(g[3]&&g[3].length===1){ goQ(g[3][0][0]); return; } APP.qGroup=APP.qGroup===g[0]?null:g[0]; renderScene(); }}));
   const sub = APP.qGroup==='yn'? YN.map(y=>[y[1],y[2],()=>{ APP.qGroup=null; const it=askYN().find(o=>o.id==='qy_'+y[0]); if(it) it.act(); }]) : ((QG.find(g=>g[0]===APP.qGroup)||[])[3]||[]).map(o=>[o[1],o[2],()=>goQ(o[0])]);
   if(sub.length) sub.forEach((o,i)=>add('ec-'+i,`<div class="subch"><b>${esc(o[0])}</b><small>${esc(o[1])}</small></div>`,50,50+(i-(sub.length-1)/2)*px(52),{cls:'ui fb',tap:o[2]}));
   else add('ui-brain','<div class="brainhint">❓</div>',50,50,{cls:'hintw'});
  }
  return;
 }
 if(k==='subj' && (askStage()||startStage())){
  if(!APP.askOpen){
   prompt('どっちから始める？','👇');
   bub('sti','say',16,24,{big:1,main:1,en:'I …',ja:'🙋 人が',pulse:1},()=>chooseArea({k:'sti'},c));
   bub('stit','say',48,24,{big:1,main:1,en:'It …',ja:'📦 物が'},()=>chooseArea({k:'stit'},c));
   bub('say','say',73,24,{sm:1,en:'ほか',ja:'人・物を選ぶ'},()=>chooseArea({k:'say'},c));
   if(LV()>=3) bub('ask','ask',91,24,{sm:1,en:'？',ja:'疑問詞'},()=>chooseArea({k:'ask'},c));
  } else {
   prompt('どうきく？','❓');
   const rY=revealed('qyn'), rW=revealed('qwh');
   bub('qyn','qyn',27,20,{on:rY,dim:rW,en:'Yes/No？',ja:'はい・いいえ'},()=>chooseArea({k:'qyn'},c));
   bub('qwh','qwh',73,20,{on:rW,dim:rY,en:'Wh-？',ja:'疑問詞（何・どこ…）'},()=>chooseArea({k:'qwh'},c));
   if(rY) block('qyn', askYN(), null, 32, {}, 'qyn');
   if(rW) block('qwh', optList('q',c).filter(o=>o.en!=='Do…? / Is…?' && o.en!=='—'), null, 32, {}, 'qwh');
   add('ask-back','<div class="gchip back"><span>◀</span><small>言うにする</small></div>',12,11,{cls:'ui fb',tap:()=>{ APP.askOpen=false; APP.sayDone=true; APP.rev={}; promptKey=''; renderScene(); }});
  }
  return;
 }
 if(k==='subj'){
  const canQ = kind==='main' && c.type==='normal' && LV()>=3;
  prompt(m.q&&kind==='main'?'だれのことを聞く？':PROMPT.subj,'👇');
  if(false && canQ){ add('b-say',`<div class="pill ${!m.q?'on':''}">💬 言う</div>`,38,11,{cls:'ui fb',tap:()=>{ if(m.q) mutate(()=>{ m.q=null; },'sentence'); }}); add('b-ask',`<div class="pill ${m.q?'on':''}">❓ きく</div>`,62,11,{cls:'ui fb',tap:()=>mutate(()=>{ if(!m.q) m.q={wh:null}; APP.open='q'; },null)}); }
  const anyR = revealed('who')||revealed('what');
  [['who',25,[14,36]],['what',75,[64,86]]].forEach(([t,x,xs])=>{
   const r=revealed(t);
   bub(t,t,x,21,{on:r||(!anyR&&pv),big:1,pulse:!anyR&&!pv},()=>chooseArea({k:t},c));
   if(r||(pv&&!anyR)) block('s'+t,optList(t,c),xs,33,{faint:!r},t);
  });
  return;
 }
 if(k==='split'){
  const relo = kind==='rel' && relGap()==='o'; if(relo){ APP.side='other'; APP.sideAuto=false; }
  const lit=APP.side; const dl=lit!=='self', dr=lit!=='other';
  const noPred=!c.pred;
  const rr = revealed('other'), rl = !rr && (revealed('how') || !!APP.lsub), anyR = rl||rr;
  const bp = bePending(c);
  if(!anyR||bp) prompt(bp?'どれくらい？ どう？':(LV()<2?'どんな感じ？ 何してる？':PROMPT.split), bp?'👇':'↔️');
  const axAll = auxCats(c,kind); const canModal = LV()>=3 && noPred && axAll.includes('modal'), canNeg = LV()>=3 && axAll.includes('neg');
  const ax = noPred? axAll.filter(x=>x!=='modal'&&x!=='neg'&&x!=='freq'&&(x!=='relsubj'||LV()>=5)) : [];
  if(!anyR && ax.length){ const xs = ax.length===2?[37,63]:[50]; ax.forEach((x,i)=>{ if(x==='relsubj') bub('a-rels','relk',xs[i],11,{sm:1,en:'who…',ja:'どんな'+N(c.passive?c.obj:c.subj).ja+'？'},()=>{ APP.relTarget='subj'; APP.open='relk'; renderScene(); }); else bub('a-'+x,x,xs[i],11,{sm:1,val:catValue(x,c)},()=>{ APP.open=x; renderScene(); }); }); }
  if(!anyR){ add('ui-sl','<span class="sidelab"><b class="en">self</b> 自</span>',8,11,{cls:'lbl ui'+(dl?' dim':'')}); add('ui-sr','<span class="sidelab"><b class="en">other</b> 他</span>',92,11,{cls:'lbl ui'+(dr?' dim':'')}); }
  // 手前（こちら側）に小さく：かも？・ない？
  { const FY=100-px(88); const FB=[];
    if(canModal&&!anyR) FB.push(['fr-modal',`<div class="front ${c.modal?'on':''}">💭 ${c.modal?esc(MD(c.modal).en):'かも？'}</div>`,()=>{ APP.open='modal'; renderScene(); }]);
    if(noPred && LV()>=3 && axAll.includes('freq')) FB.push(['fr-freq',`<div class="front ${c.freq?'on':''}">🔁 ${c.freq&&typeof FREQADV!=='undefined'&&FREQADV.find(f=>f.id===c.freq)?esc(FREQADV.find(f=>f.id===c.freq).en):'どのくらい？'}</div>`,()=>{ APP.open='freq'; renderScene(); }]);
    if(canNeg) FB.push(['fr-neg',`<div class="front neg ${c.neg?'on':''}">🚫 ${c.neg?'ない（not）':'ない？'}</div>`,()=>toggle('neg')]);
    const FX=FB.length===3?[20,50,80]:FB.length===2?[36,64]:[50];
    FB.forEach((f,i)=>add(f[0],f[1],FX[i],FY,{cls:'ui fb keep',tap:f[2]})); }
  if(!relo && !bp && !anyR) bub('how','how',25,20,{on:rl,en:APP.lsub==='be'&&c.link?c.link:(APP.lsub||'How？'),ja:APP.lsub==='be'?(APP.beKind==='noun'?'何者？':'どんな感じ？'):APP.lsub==='do'?'何してる？':'どんな感じ？',x:!!APP.lsub,dim:rr||(!anyR&&dl),pulse:!anyR&&lit==='self'},()=>{ if(rl && APP.lsub){ APP.lsub=null; } chooseArea({k:'how'},c); });
  if(!bp && !anyR && LV()>=2) bub('oth','other',75,20,{on:rr,dim:rl||(!anyR&&dr),pulse:!anyR&&lit==='other'},()=>chooseArea({k:'other'},c));
  const top=32; const hy=11, t0=hy+px(80);
  if(anyR && !bp && !relo){
   const mvH=predV(APP.S.main); const beH=!PROG.includes(c.tense) && !(kind==='caus' && mvH && ['caus_let','caus_have','caus_help'].includes(mvH.id));
   const act = rr? 'other' : ((!beH || APP.lsub==='do')? 'do' : 'be');
   const H={be:['🌡️',tx('head.be'),()=>{ APP.lsub=null; APP.rev={how:true}; renderScene(); }], do:['🏃',tx('head.do'),()=>{ APP.lsub='do'; APP.side='self'; APP.sideAuto=false; APP.rev={how:true}; renderScene(); }], other:['🎯',tx('head.other'),()=>{ APP.lsub=null; chooseArea({k:'other'},c); }]};
   const keys=['be','do','other'].filter(k=>(k!=='be'||beH)&&(k!=='other'||LV()>=2));
   const others=keys.filter(k=>k!==act); const hx = act==='other'? 72 : 27;
   add('lh-'+act,`<div class="lhead ${act}">${H[act][0]} ${H[act][1]}</div>`,hx,hy,{cls:'lbl ui'});
   const sx = act==='other'? (others.length>1?[14,37]:[22]) : (others.length>1?[64,87]:[74]);
   others.forEach((k,i)=>add('ls-'+k,`<div class="lswitch">⇄ ${H[k][1]}</div>`,sx[i],hy,{cls:'ui fb',tap:H[k][2]}));
  }
  if(!relo && rl){ const f={};
   const mvC=predV(APP.S.main); const beOk=!PROG.includes(c.tense) && !(kind==='caus' && mvC && ['caus_let','caus_have','caus_help'].includes(mvC.id)); const person=subjKind(c)==='person';
   if(APP.lsub!=='be'){
    const tab = (!beOk || APP.lsub==='do')? 'do' : 'be';
    if(tab==='be'){
     const pickBe=()=>{ pick('be'); APP.rev={how:true}; renderScene(); };
     const bF = (()=>{ const ag=agrOf(c.subj); try{ return c.tense==='fut'?'will be':vform('be',['past'].includes(c.tense)?'past':'pres',ag)||'be'; }catch(e){ return 'be'; } })();
     tile('be',{e:'🌡️',en:bF,ja:'〜だ（状態）',pos:'verb',bold:1,act:pickBe},50,t0,f);
     const cx=50+(TOFF[c.tense]||0);
     add('behit','<div class="behit"></div>',cx,70,{cls:'ui fb',tap:pickBe});
     add('betag',`<div class="betag">${esc(bF)}</div>`,cx,70,{cls:'ui fb',tap:pickBe});
     const LK=[['look','見える','👀'],['seem','ようだ','🤔'],['become','なる','🦋'],['feel','感じる','💭'],['sound','聞こえる','👂'],['get','なる','➡️']].filter(x=>kind!=='caus').filter(x=>person||x[0]!=='feel').filter(x=>!selfSubj(c)||!NOSELF_LK.includes(x[0]));
     const SL=[0,2,3,4,5,6,7,8]; LK.forEach((x,k)=>{ const i=SL[k]; tile('lk0-'+x[0],{e:x[2],en:x[0],ja:x[1],pos:'verb',act:()=>{ pick('be'); pick('link',x[0]); APP.rev={how:true}; renderScene(); }},[18,50,82][i%3],t0+Math.floor(i/3)*px(66),f); });
    } else {
     block('Ldo',optList('self',c),null,t0,f,'how');
    }
   } else {
    // after "be": only どれくらい？｜どう？ (the be-verb itself was chosen already)
    const LK=[];
    const bk=APP.beKind||'adj', nn=bk==='noun';
    if(revealed('bmain')||revealed('bdeg')||bk==='loc'){ const TB=[['adj','😊','どんな感じ']].concat(person?[['noun','👔','何者']]:[]).concat([['loc','📍','どこ']]); const XS=TB.length===3?[48,68,88]:[64,86];
     TB.forEach((t,i)=>add('bk-'+t[0],`<div class="ltab ${bk===t[0]?'on':''}"><b>${t[1]}</b><small>${t[2]}</small></div>`,XS[i],27.5,{cls:'ui fb',tap:()=>{ APP.beKind=t[0]; c.adj=null; c.intens=null; c.link=null; if(c.pred&&c.pred.k==='s'&&c.pred.id&&(t[0]==='loc')!==!!locInfo(c.pred.id)) c.pred={k:'s',id:null}; APP.rev.bmain=true; renderScene(); }})); }
    const yb=18, yt=top+5;
    if(bePending(c)){
     const rL=revealed('bdeg'), rM=revealed('bmain');
     const lv = nn? (c.adj&&ST(c.adj)?ST(c.adj).en:null) : (c.intens&&INTENS[c.intens]?INTENS[c.intens][0]:null);
     if(LV()>=3 && bk!=='loc') bub('bdeg','bdeg',27,yb,{on:rL,sm:1,en:nn?'What kind？':'How much？',ja:nn?'どんな？':'どれくらい？',val:lv,dim:!rL&&(rM||!!lv)},()=>chooseArea({k:'bdeg'},c));
     bub('bmain','bmain',64,yb,{on:rM,main:1,en:bk==='loc'?'Where？':nn?'Who？':'How？',ja:bk==='loc'?'どこにいる？':nn?'何者？':'どう？',pulse:!rM&&!!lv},()=>chooseArea({k:'bmain'},c));
     if(rL) block(nn?'nadj':'intens', nn? adjOpts(c,'nadj',{bmain:true}) : intensOpts(c), null, yt, f, 'bdeg');
     else if(rM) block('Lbe'+bk, optList('state',c), null, yt, f, 'bmain');
    } else block('Lbe'+bk, optList('state',c), null, yt, f, 'how');
   }
  }
  if(rr) block('R',optList('other',c),null,relo?top:t0,{},'other');
  return;
 }
 if(k==='iobj'){
  prompt(PROMPT.iobj,'👉'); const r=revealed('iobj');
  add('ui-dtcap',`<span class="auxcap">${esc(predV(c).en)} + 人 + 物 の順（前置詞いらない）</span>`,50,11,{cls:'lbl ui'});
  bub('iob','iobj',75,19,{on:r||pv,pulse:!r&&!pv},()=>chooseArea({k:'iobj'},c));
  if(r||pv) block('io',optList('iobj',c),[64,86],29,{faint:!r},'iobj');
  add('a-skip','<div class="pill sm">人は言わない →</div>',30,40,{cls:'ui fb',tap:()=>pick('iobjSkip')});
  return;
 }
 if(k==='obj'){
  pvStrip(add,c,px);
  const v=predV(c); const dt=!!(v&&v.dt), caus=!!(v&&v.caus);
  let peopleL = optList('objP',c);
  let thingsL = caus? [] : optList('objT',c);
  if(!thingsL.length && !caus && !peopleL.length){ APP._relax=1; thingsL=optList('objT',c); if(!thingsL.length){ APP._relax=2; thingsL=optList('objT',c); } APP._relax=0; }
  const Z=objZones(c);
  const anyO = Z.some(z=>revealed(z.k)); const hyO=11, possO = thingsL.length && !caus && revealed('objR');
  if(!anyO && Z.length===1 && Z[0].k==='vc') prompt(tx('prompt.vc'),'👉');
  else if(!anyO) prompt(dt? (c.iobj? (N(c.iobj).obj||N(c.iobj).en)+' に 何を？' : '誰に？ 何を？') : (caus? '誰を？' : '誰を？ 何を？'),'👉');
  if(thingsL.length && !caus && revealed('objR')){ const py=hyO+px(44); add('ui-posscap','<span class="auxcap">だれの？</span>',12,py,{cls:'lbl ui'}); [[null,'a/the'],['my','my'],['your','your'],['his','his'],['her','her']].forEach((q,i)=>add('pp-'+(q[0]||'none'),`<div class="pill xs ${c.poss===q[0]?'on':''}">${q[1]}</div>`,32+i*15,py,{cls:'ui fb',tap:()=>pick('poss',q[0])})); }
  const any = Z.some(z=>revealed(z.k));
  if(anyO){ const za=Z.find(z=>revealed(z.k)); const zo=Z.filter(z=>z!==za); const ax=za.x1<=.5?27:(za.x0>=.5?72:50);
   add('lh-'+za.k,`<div class="lhead ${za.k==='objT'?'other':'do'}">${esc(za.ja||za.label)}</div>`,ax,hyO,{cls:'lbl ui'});
   const sx = ax<50? [64,87] : [14,37]; zo.forEach((z,i)=>add('ls-'+z.k,`<div class="lswitch">⇄ ${esc(z.ja||z.label)}</div>`,zo.length===1?(ax<50?76:22):sx[i],hyO,{cls:'ui fb',tap:()=>chooseArea(z,c)}));
  }
  if(!anyO) Z.forEach(z=>{ const r=revealed(z.k); const cx=Math.max(19,(z.x0+z.x1)/2*100);
   const val = z.k==='oadj'? (c.oadj&&ST(c.oadj)?ST(c.oadj).en:null) : z.k==='objL'? (c.iobj?(N(c.iobj).obj||N(c.iobj).en):null) : null;
   bub('z'+z.k, z.k==='objL'?'iobj':z.k==='objP'?'objP':z.k==='vc'?'vc':'objT', cx, 22, {on:r, dim:any&&!r, sm:!z.main, big:z.main?1:0, main:z.main, en:z.label, ja:z.ja, val, pulse:!any&&z.main}, ()=>chooseArea(z,c)); });
  const y0= anyO? hyO+px(possO?112:80) : 31;
  if(revealed('objL')) block('io', optList('iobj',c), null, y0, {}, 'objL');
  else if(revealed('objP')) block('oP', peopleL, null, y0, {}, 'objP');
  else if(revealed('objR')){
   block('oT', caus? peopleL : thingsL, null, y0, {}, 'objR');
  }
  else if(revealed('vc')) vcDoors(add,c,y0,px);
  return;
 }
 if(k==='thing'||k==='than'||k==='mthan'){
  prompt(PROMPT[k],'👇');
  if(k==='thing' && !c.thing && c.type!=='excl'){ bub('a-neg','neg',50,11,{tgl:1,on:!!c.neg,en:'not',ja:'ない'},()=>toggle('neg')); }
  const r=revealed(k); bub(k+'b',k,50,21,{on:r||pv,pulse:!r&&!pv},()=>chooseArea({k},c));
  if(r||pv) blockWide(k,optList(k,c),31,{faint:!r},k);
  return;
 }
 if(k==='done'){
  // 完成画面：全部を1つの縦スクロールの中に並べる（重ならない）
  let parts=sentenceParts(APP.S).filter(p=>p.en&&!p.hole);
  const FA={}; if(SAMPLE) FA.nat=nativeCheck; let h='';
  const chunks=reelChunksHtml(parts, FA);
  const barOk = m.type==='normal' && LV()>=3;
  if(!APP.finStage) APP.finStage='ja';
  if(APP.finStage==='bar' && !barOk) APP.finStage='word';
  FA.tr=openTrModal; FA.jaok=()=>{ if(SB&&SB.hold) return; APP.finStage=barOk?'bar':'word'; renderScene(); };
  h+=`<div class="fincard2 reel ${parts.length>6?'long':''} ${APP.finStage==='word'?'wordst':''}"><div class="fcrow">${chunks}</div>${reelBandHtml(FA)}<div class="finJa2">${hlJa(hlJaStr())}</div><div class="trrow"><span class="pill xs" data-fa="tr">✏️ 訳をなおす</span></div></div>`;

  { const nat=APP.native&&APP.native.key===sentenceText(APP.S)?APP.native:null;
   if(nat){ const sc=Math.max(1,Math.min(5,+nat.score||3)); h+='<div class="natcard native">'+(nat.loading?'<div class="nt">🤖 ネイティブ判定中…</div>' : nat.error? `<div class="nt">🤖 ${esc(nat.error)}</div>` : `<div class="nt">🤖 ${'★'.repeat(sc)}${'☆'.repeat(5-sc)} <b>${esc(nat.label||'')}</b></div><div class="nc">${esc(nat.comment||'')}</div>`)+'</div>'; }
   else if(APP.finIdle && SAMPLE && APP.finStage==='free') h+='<div class="finrow"><span class="pill xs" data-fa="nat">🤖 判定</span></div>'; }
  let hb='';
  if(APP.finStage!=='ja' && barOk){
   const al=allowedModals(m).map(x=>x.id);
   const MB=[[null,'ふつう'],['might','ひょっと'],['may','かも'],['will','きっと'],['must','ちがいない'],['could','できるかも'],['can','できる'],['should','ほうが']];
   FA.frm=()=>{ APP.bandTap=false; APP.reelKey = APP.reelKey==='m.aux'? null : 'm.aux'; renderScene(); };
   hb+=`<div class="fwrow capsw"><span class="negsw ${m.neg?'on':''}" data-fa="neg"><b>✕</b><small>ない</small></span><div class="auxcap">${tx('fin.bar')}</div><span class="negsw qsw ${m.q?'on':''}" data-fa="q"><b>？</b><small>きく</small></span>${passOk(m)?`<span class="negsw psw ${m.passive?'on':''}" data-fa="pass"><b>⇄</b><small>される</small></span>`:''}</div>`; hb+='<div class="mbrow mbscroll"><div class="mbtrack"><div class="mbline"></div>';
   MB.forEach(([id,ja],i)=>{ const ok=id===null||al.includes(id); const on=(m.modal||null)===id; FA['mb'+i]=ok?()=>finModal(id):()=>toast('この文では使えません');
    hb+=`<span class="mbstop ${on?'on':''} ${ok?'':'off'} ${i>=6?'pow':''}" data-fa="mb${i}"><b>${id?esc(MD(id).en):'ー'}</b><small>${esc(ja)}</small></span>`; });
   { const SG=[['i','you','he','she','we','they'],['it','this','that','these','those']].find(g=>g.includes(String(m.subj||'').replace(/^p:/,''))); if(SG && m.subj){ const cur=String(m.subj).replace(/^p:/,''); const pv=predV(m), ps=predS(m); let sb='<div class="fwrow capsw subjbar"><div class="auxcap">だれが</div>'; SG.forEach((id,i)=>{ let ok=true; try{ ok= pv? verbFitsSubj(Object.assign({},m,{subj:'p:'+id}),pv) : ps? stateFitsSubj(Object.assign({},m,{subj:'p:'+id}),ps) : true; }catch(e){} if(cur===id) ok=true;  FA['sb'+i]=ok?()=>finSubj('p:'+id):()=>toast('この文では使えません'); sb+=`<span class="mbstop ${cur===id?'on':''} ${ok?'':'off'}" data-fa="sb${i}"><b>${esc(N('p:'+id).en)}</b></span>`; }); hb=sb+'</div></div>'+hb; } }
   if(predV(m)) hb+=`<span class="mbstop frmbtn ${APP.reelKey==='m.aux'||FRAME_IDS.includes(m.modal)?'on':''}" data-fa="frm"><b>型…</b><small>かたち</small></span>`;
   FA.neg=()=>finToggle('neg'); FA.q=()=>finToggle('q'); FA.pass=()=>finToggle('pass'); hb+=`</div></div>`;
  }
  if(APP.finStage!=='ja' && barOk && window.SB_DOCK!==false && sbDockHtml){ try{ hb=sbDockHtml(m); }catch(e){} }
  if(APP.finStage!=='ja' && APP.finBar && isVc(m) && vcForms(predV(m)).length>1){ const vf=m.subs.comp.c.vform; FA.vc=()=>finToggle('vc'); hb=`<div class="vcswap" data-fa="vc"><span class="${vf==='to'?'on':''}">➡ to</span><span class="${vf==='ing'?'on':''}">📷 ing</span></div>`+hb;
  }
  APP.reelFA=FA; handArm();
  const scH=(document.getElementById('scene')||{}).clientHeight||SH; let H=scH-10-64; H=Math.max(200,H);
  add('fin-all',`<div class="finwrap split2" style="height:${H}px"><div class="finscroll">${h}</div><div class="fwspace ${APP.reelKey?'swp':''}">${APP.reelKey&&APP.reelKey!=='m.tail'&&!APP.swiped?'<div class="swguide">👈 キャラのところを左右にスワイプ 👉<small>はなすと決定</small></div>':''}</div>${hb?`<div class="finbar">${hb}</div>`:''}</div>`,50,0,{cls:'ui fb fin topa finall',tap:e=>{ const b=e&&e.target&&e.target.closest('[data-fa]'); if(Date.now()-(APP.swipeAt||0)<400) return; if(b&&FA[b.dataset.fa]) FA[b.dataset.fa](); else if(APP.finStage==='ja') FA.jaok(); else if(APP.reelKey){ APP.reelKey=null; renderScene(); } else if(e&&e.target&&e.target.closest&&e.target.closest('.finbar')){} else if(sbFinHide){ sbFinHide(); } else if(!APP.finBar){ APP.finBar=true; renderScene(); } }});
  { const fitC=()=>{ const cd=document.querySelector('.fincard2'), cv=$('#canvas'), sc=document.getElementById('scene'); if(cd&&cv&&sc){ APP.finSm = APP.finSm || cd.getBoundingClientRect().height > sc.clientHeight*0.3; cv.classList.toggle('finsm', !!APP.finSm); } try{ finBubbles(); }catch(e){} }; fitC(); requestAnimationFrame(fitC); }
  reelScrollBand(); requestAnimationFrame(reelScrollBand); mbCenter(); requestAnimationFrame(mbCenter);
  { const keep=APP.finScroll||0; const fx=()=>{ const sc=document.querySelector('.finscroll'); if(sc){ if(keep && sc.scrollTop!==keep) sc.scrollTop=keep; sc.onscroll=()=>{ APP.finScroll=sc.scrollTop; }; } }; fx(); requestAnimationFrame(fx); setTimeout(fx,60); }
  return;
 }
 // ---- 文ができた：まずカードで知らせて、足すか終わるかを聞く ----
 if(kind==='main' && cardMode() && !APP.addPick){ pvStrip(add,c,px); locStrip(add,c,15.5); }
 if(kind==='main' && cardMode()){
  const L=lenInfo(); const free=isFree(); const sb=m.subs;
  let relAct=null;
  const lastP=sentenceParts(APP.S).filter(p=>p.clause==='m'&&p.en&&!p.hole).map(p=>String(p.key)).pop()||'';
  if(LV()>=5){
   if(/place/.test(lastP) && m.place && !['here','there'].includes(m.place) && !locInfo(m.place) && !sb.relw) relAct=()=>{ APP.addPick=false; markPassed('main','relwP'); openSub('relw',{slot:'place'}); };
   else if(/time/.test(lastP) && m.time && TM(m.time) && TM(m.time).jn && !sb.relw) relAct=()=>{ APP.addPick=false; markPassed('main','relwT'); openSub('relw',{slot:'time'}); };
   else if(m.obj && needsObj(m) && relAble(m.obj) && !sb.rel && /obj/.test(lastP)) relAct=()=>{ APP.addPick=false; APP.relTarget='obj'; APP.open='relk'; renderScene(); };
  }
  const midOk = optionalLeft('main').some(x=>!['relobj','relwP','relwT'].includes(x)) || (LV()>=4 && !sb.purpose);
  const cjOk = LV()>=5 && !sb.conj;
  const A=[]; if(relAct) A.push([tx('card.rel'),tx('card.relSub'),'🔍',relAct]);
  if(midOk) A.push([tx('card.mid'),tx('card.midSub'),'📍',()=>{ APP.addPick=false; APP.addMode=true; renderScene(); }]);
  if(cjOk) A.push([tx('card.conj'),tx('card.conjSub'),'🔗',()=>{ APP.addPick=false; APP.open='conj'; renderScene(); }]);
  if(!APP.addPick || !A.length){
   let sub=''; if(!free && L.B>=3) sub=tx('card.long');
   add('lc-card',`<div class="lencard"><b>${tx('card.done')}</b>${sub?`<small>${esc(sub)}</small>`:''}</div>`,50,30,{cls:'ui fin'});
   if(A.length) add('lc-add','<div class="pill">'+tx('card.add')+'</div>',30,44,{cls:'ui fb',tap:()=>{ if(A.length===1){ A[0][3](); return; } APP.addPick=true; renderScene(); }});
   add('lc-fin','<div class="pill go">'+tx('card.finish')+'</div>',A.length?70:50,44,{cls:'ui fb',tap:()=>{ APP.addPick=false; openFinish(); }});
  } else {
   let sub=''; if(!free){ if(L.B>=3) sub=tx('card.tooLong'); else if(L.F+L.B>=2) sub=tx('card.goodLen'); }
   add('lc-card',`<div class="lencard"><b>${tx('card.how')}</b>${sub?`<small>${esc(sub)}</small>`:''}</div>`,50,24,{cls:'ui fin'});
   const X=A.length===3?[18,50,82]:A.length===2?[30,70]:[50];
   A.forEach((x,i)=>add('lc-a'+i,`<div class="addch"><span>${x[2]}</span><b>${esc(x[0])}</b><small>${esc(x[1])}</small></div>`,X[i],40,{cls:'ui fb',tap:x[3]}));
   add('lc-bk','<div class="gchip back"><span>◀</span><small>もどる</small></div>',50,40+px(78),{cls:'ui fb',tap:()=>{ APP.addPick=false; renderScene(); }});
  }
  return;
 }
 // ---- after the verb/object: slots in English order, laid out left → right ----
 const complete = kind==='main'? sentenceComplete(APP.S) : coreDone(kind);
 const slots=afterSlots(c,kind).filter(x=>kind!=='main'||!['relobj','relwP','relwT'].includes(x));
 prompt(kind!=='main'?(complete?'この部分はできた！ 足すか、✓で先へ':'この部分を作ろう'):(slots.length?PROMPT.extras:'できた！ 完成させよう'), complete?'🎉':'👇');
 if(slots.length){
  const n=slots.length;
  const perRow = n>4? Math.ceil(n/2) : n;
  slots.forEach((s,i)=>{ const row=Math.floor(i/perRow), col=i%perRow, cnt=Math.min(perRow, n-row*perRow); const x=(col+.5)/cnt*100, yb=13+row*8.5; bub('x-'+s,s,x,yb,{sm:1,pulse:i===0,ja:s==='relobj'&&c.obj?'どんな'+N(c.obj).ja+'？':undefined},()=>openSlot(s,c)); if(col<cnt-1) add('ar-'+i,'<span class="arrowr">›</span>',(col+1)/cnt*100,yb,{cls:'lbl ui'}); });
  const handoff = kind!=='main' && complete;
  const pvFirst = slots.find(s=>!['relobj','relwP','relwT','toWhom','cmp','mcmp'].includes(s)); const yOff = n>4? 8.5:0;
  if(pv && !handoff && pvFirst){ add('ui-pvcap',`<span class="auxcap">${esc(catDef(pvFirst,c)[1])} の例</span>`,50,21+yOff,{cls:'lbl ui'}); blockWide('pv'+pvFirst,optList(pvFirst,c),28+yOff,{faint:1}); }
 }
 let y = slots.length? (pv?58:22) : 14;
 { const vv=predV(c); if(vv && vv.dt && c.iobj && c.obj){ const io=N(c.iobj).obj||N(c.iobj).en, ob=N(c.obj).en; add('a-dts',`<div class="swapb">⇄ <b>${esc(c.dts==='pp'? io+' + '+ob.replace(/^(a|an|the) /,'')+'…' : ob.replace(/^(a|an|the) /,'')+' '+vv.dt+' '+io)}</b><small>${c.dts==='pp'?'人を先にする形へ':'前置詞 '+vv.dt+' を使う形へ'}</small></div>`,50,y+ (slots.length?0:4),{cls:'ui fb',tap:()=>pick('dts')}); y+=10; } }
 if(LV()>=4 && kind==='main' && c.type==='normal'){
  const ex=(isFree()?extrasFor(c,kind).filter(x=>['purpose','passive'].includes(x)):(c.subs.purpose?[]:['purpose']));
  if(ex.length){ add('ui-add','<span class="auxcap">何のため？</span>',50,y,{cls:'lbl ui'}); ex.forEach((x,i)=>{ const xx=(i+.5)/ex.length*100; if(x==='passive') bub('x-'+x,x,xx,y+6,{tgl:1,on:!!c.passive,en:'by…',ja:'される側'},()=>toggle(x)); else bub('x-'+x,x,xx,y+6,{sm:1,val:catValue(x,c)},()=>{ APP.open=x; renderScene(); }); }); y+=12; }
 }
 const fy=Math.min(y+4,58), fx=(y+4>58)?76:(predV(c)&&predV(c).dt&&c.iobj&&c.obj?80:50);
 const handoffT = null;
 if(kind!=='main' && complete) add('a-exit',`<div class="pill go">✓ ${esc(exitLabel(kind))}</div>`,fx,fy,{cls:'ui fb',tap:exitSub});
 if(kind==='main' && complete) add('a-fin','<div class="pill go">✓ 完成</div>',fx,fy,{cls:'ui fb',tap:openFinish});
}
export function tenseNodes(add,c,kind){
 const al=allowedTenses(c,{kind}); const st=!!(c.pred&&c.pred.k==='s') || c.type==='exist' || (predV(c)&&predV(c).stative);
 const list = st? ['past','perf','pres','fut'] : TENSE_ORDER;
 const X={past:12,pastprog:24,perf:36,perfprog:47,pres:62,prog:74,fut:88}, Y={past:25,pastprog:38,perf:25,perfprog:38,pres:25,prog:38,fut:25};
 add('t-line',`<svg class="tlbig" viewBox="0 0 100 10" preserveAspectRatio="none"><line x1="2" y1="5" x2="97" y2="5" stroke="#b9bfd6" stroke-width="1.2" vector-effect="non-scaling-stroke"/><path d="M95 3 L98 5 L95 7" fill="none" stroke="#b9bfd6" stroke-width="1.2" vector-effect="non-scaling-stroke"/><line x1="52" y1="0" x2="52" y2="10" stroke="#1c2242" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg><span class="tnow">今</span><span class="tpast">前</span><span class="tfut">先</span>`,50,31.5,{cls:'ui tlwrap'});
 list.forEach(t=>{ const ok=al.includes(t); const lab=st?(TENSES[t].st||TENSES[t].lab):TENSES[t].lab; add('t-'+t,`<div class="tn ${c.tense===t?'on':''} ${ok?'':'off'}">${esc(lab)}</div>`, st?{past:14,perf:34,pres:58,fut:86}[t]:X[t], st?26:Y[t], {cls:'ui fb', tap: ok?()=>pick('tense',t):()=>toast(c.time?'「'+TM(c.time).ja+'」とは合わない形です':'この文では使えない形です')}); });
}
export function manageSideTimer(st){
 const want = st==='split' && !APP.open && APP.sideAuto && !AC().pred;
 if(want && !sideTimer){ sideTimer=setInterval(()=>{ if(!(APP.sideAuto && stageOf()==='split' && !APP.open)){ clearInterval(sideTimer); sideTimer=null; return; } APP.side = APP.side==='self'?'other':'self'; renderScene(); },2400); }
 if(!want && sideTimer){ clearInterval(sideTimer); sideTimer=null; }
}
export function finSubj(id){ finStageGo('bar','word'); APP.finTried=true; APP.finBar=true; APP.finIdle=false; armFin(); const m=APP.S.main; if(m.subj===id) return; APP.hist.push(snapshot()); m.subj=id; try{ if(typeof sbReflSync==='function') sbReflSync(m); }catch(e){} normalize(); APP.finished=true; render(); say(sentenceText(APP.S)); }
export function finModal(id,quiet){ finStageGo('bar','word'); APP.finTried=true; APP.finBar=true; APP.finIdle=false; armFin(); const m=APP.S.main; if((m.modal||null)===id) return; APP.hist.push(snapshot()); setModal(m,id); { const al=allowedTenses(m,{kind:'main'}); if(!al.includes(m.tense)) m.tense = al.includes('pres')?'pres' : al.includes('fut')?'fut' : al[0]; } normalize(); APP.finished=true; render(); say(sentenceText(APP.S)); if(id&&!quiet){ const mj=modalChunkJa(m); if(mj) toast(MD(id).en+'：'+mj); } }
export function passOk(m){ const v=predV(m); return !!(m.passive || (v && needsObj(m) && m.obj && v.fr!=='cl' && !v.nopass && !v.prep && !v.tail && m.type==='normal')); }
export function finToggle(k){ finStageGo('bar','word'); APP.finTried=true; APP.finBar=true; APP.finIdle=false; armFin(); const m=APP.S.main; APP.hist.push(snapshot()); if(k==='neg') m.neg=!m.neg; else if(k==='pass') m.passive=!m.passive; else if(k==='vc'){ if(isVc(m)) m.subs.comp.c.vform = m.subs.comp.c.vform==='to'?'ing':'to'; } else m.q = m.q? null : {wh:null}; normalize(); APP.finished=true; render(); say(sentenceText(APP.S)); }
export function openFinish(){ try{ if(typeof qspClObj==='function') qspClObj(); }catch(e){} if(!sentenceComplete(APP.S)) return; if(!APP.finished){ APP.hlSnap=null; APP.hlMark=null; } APP.reelKey=null; APP.finSm=false; APP.finStage='ja'; APP.finScroll=0; APP.finBar=false; clearTimeout(beatTimer); APP.beat=false; APP.finIdle=false; APP.finTried=false; APP.finished=true; APP.open=null; APP.finIdle=false; render(); armFin(); loadProps(); say(sentenceText(APP.S)); if(!window.SB_NOLOG){ DB.log.unshift({en:sentenceText(APP.S),ja:sentenceJa(APP.S),at:Date.now()}); DB.log=DB.log.slice(0,50); save(); } }
export function renderZone(){ renderScene(); }


// ---------- how natural is it to actually say this? (instant rough check) ----------
export function natCheck(){
 const c=APP.S.main; const v=predV(c), s=predS(c); let sc=100; const R=[];
 const ids=[c.subj,c.obj,c.iobj].filter(Boolean).map(r=>r.slice(2)); if(v) ids.push(v.id); if(s) ids.push(s.id); if(c.place) ids.push(c.place); if(c.time) ids.push(c.time);
 if(ids.filter(id=>T3.has(id)).length>=2){ sc-=10; R.push('あまり使わない言葉が重なっています'); }
 if(v && !v.stative && c.tense==='pres' && !c.time && !c.lead && !c.modal && c.type==='normal' && !c.q && !c.subs.conj && !c.front){ sc-=15; R.push('今のことなら「今してる」、習慣なら「毎日」などを足すと自然です'); }
 const adv=[c.manner,c.with,c.place,c.time,c.lead,c.subs.conj,c.subs.part].filter(Boolean).length; if(adv>=4){ sc-=15; R.push('情報をつめこみすぎかも。会話では2文に分けることが多いです'); }
 const lead=c.lead&&LEADF(c.lead); const casual=(lead&&lead.casual)||(v&&v.casual)||(s&&s.casual); const formal=lead&&['opinion','however','truth'].includes(lead.id); if(casual&&formal){ sc-=20; R.push('くだけた言葉とかしこまった言葉が混ざっています'); }
 if(v && v.dt && c.iobj && c.obj && c.dts!=='pp' && (c.obj==='p:it'||(N(c.obj)||{}).poss)){ sc-=35; R.push('物が代名詞のときは「'+v.en+' it to …」の形が自然です'); }
 if(c.passive && c.subj && isPronRef(c.subj)){ sc-=15; R.push('「by me / by him」はあまり言いません。ふつうの文のほうが自然です'); }
 if(v && !v.pv){ const pa=altsOf(v).find(a=>a.pv); if(pa && ['return','continue','discover','quit','postpone','escape','enter','appear','exercise','choose','refuse'].includes(v.id)){ sc-=5; R.push('会話では「'+verbLabel(pa)+'」のほうがよく使われます'); } }
 if(c.lead && (c.front||c.subs.part)){ sc-=10; R.push('文の頭の言葉が2つ続いています'); }
 if(c.subs.rel){ const hr=relHead(); if(hr && isPronRef(hr)){ sc-=20; R.push('I / him などに who … を付けるのはめずらしい言い方です'); } }
 if(c.q && c.lead){ sc-=10; R.push('質問の前に前置きをつけるのは少しめずらしいです'); }
 const level=sc>=80?'good':sc>=55?'ok':'bad';
 return {sc,level,R:R.slice(0,2)};
}
export let SAMPLE;
export function initSample(){ try{ if(window.claude && typeof window.claude.use==='function'){ window.claude.use('sample').then(s=>{ SAMPLE=s||null; if(APP.finished) renderScene(); }).catch(()=>{}); } }catch(e){} }
export async function nativeCheck(){
 if(!SAMPLE || (APP.native&&APP.native.loading)) return;
 const en=sentenceText(APP.S), ja=sentenceJa(APP.S); const key=en;
 APP.native={loading:true,key}; renderScene();
 const prompt=`You are a friendly native English teacher for Japanese learners. Judge how natural this English sentence is as something people would actually say or write in real life (not only whether the grammar is correct).
Sentence: "${en}"
Intended meaning (Japanese): ${ja}
Reply ONLY with JSON, no markdown fences:
{"score": 1-5 (5 = very natural), "label": "短い日本語（例：よく言う／場面による／ふつう言わない）", "scene": "日本語で、どんな場面でこう言うか（1文）", "comment": "日本語で、自然さの理由や注意点（2文以内）", "better": ["more natural English alternatives, 0-2 items"]}`;
 try{ const r=await SAMPLE.json(prompt,{modelTier:'default'}); APP.native=Object.assign({key},r||{}); }
 catch(e){ const code=e&&e.code; APP.native={key,error: code==='not_granted'?'許可されなかったので判定できませんでした': code==='rate_limited'?'混み合っています。少し待ってからもう一度':'判定できませんでした'}; if(code==='not_granted') SAMPLE=null; }
 if(APP.finished) renderScene();
}


// ---------- translation: your own fix + proposals shared with everyone who opens this page ----------
export function trKey(){ return sentenceText(APP.S); }
export function hashStr(s){ let h=2166136261; for(const ch of s){ h^=ch.codePointAt(0); h=Math.imul(h,16777619); } return (h>>>0).toString(36); }
export let TR_NEED; // likes needed before a proposal becomes everyone's translation
export function jaFull(){ const gen=sentenceJa(APP.S); if(!sentenceComplete(APP.S)) return gen; const k=trKey(); const own=(DB.trOwn||{})[k]; if(own) return own; const pub=(APP.trPublic||{})[k]; if(pub) return pub; return gen; }
export function trSource(){ if(!sentenceComplete(APP.S)) return 'gen'; const k=trKey(); if((DB.trOwn||{})[k]) return 'own'; if((APP.trPublic||{})[k]) return 'pub'; return 'gen'; }
export let DBX, UID;
export function initShare(){ try{ if(window.claude && typeof window.claude.use==='function'){ window.claude.use('db').then(d=>{ DBX=d||null; }).catch(()=>{}); window.claude.use('user').then(u=>{ if(u && typeof u.id==='function') u.id().then(id=>{ UID=id||null; }).catch(()=>{}); }).catch(()=>{}); } }catch(e){} }
export async function loadProps(){
 if(!DBX) return; const k=trKey(), sid=hashStr(k);
 try{ const qs=await DBX.collection('tr/'+sid+'/props').get(); const L=[];
  for(const d of qs.docs){ const x=d.data()||{}; if(x.en!==k) continue; let likes=0, mine=false; try{ const ls=await DBX.collection('tr/'+sid+'/props/'+d.id+'/likes').get(); likes=ls.size; mine=!!UID && ls.docs.some(z=>z.id===UID); }catch(e){} L.push({id:d.id,ja:String(x.ja||'').slice(0,200),likes,mine,byMe:!!UID&&x.by===UID}); }
  L.sort((a,b)=>b.likes-a.likes); APP.props={key:k,list:L};
  const best=L.find(q=>q.likes>=TR_NEED); APP.trPublic=APP.trPublic||{}; if(best) APP.trPublic[k]=best.ja; else delete APP.trPublic[k];
 }catch(e){ APP.props={key:k,list:[],err:1}; }
 if(APP.finished){ renderScene(); renderCanvasSentence(); } if(APP.trModal) renderTrModal();
}
export async function proposeTr(ja){ if(!DBX||!UID){ toast('この画面では共有できません（自分用には保存されています）'); return; } const k=trKey(), sid=hashStr(k), pid=hashStr(ja+'|'+UID); try{ await DBX.doc('tr/'+sid+'/props/'+pid).set({en:k,ja,by:UID,at:Date.now()}); toast('みんなに提案しました。'+TR_NEED+'人が「いいね」すると、みんなの訳になります'); await loadProps(); }catch(e){ toast('提案できませんでした'); } }
export async function likeProp(pid, on){ if(!DBX||!UID) return; const sid=hashStr(trKey()); const ref=DBX.doc('tr/'+sid+'/props/'+pid+'/likes/'+UID); try{ if(on) await ref.set({at:Date.now()}); else await ref.delete(); await loadProps(); }catch(e){ toast('いいねできませんでした'); } }
export function openTrModal(){ APP.trModal=true; renderTrModal(); loadProps(); }
export function closeTrModal(){ APP.trModal=false; const el=document.getElementById('trModal'); if(el) el.remove(); }
export function renderTrModal(){
 let el=document.getElementById('trModal'); if(!el){ el=document.createElement('div'); el.id='trModal'; ENV.root.appendChild(el); }
 const k=trKey(), own=(DB.trOwn||{})[k]; const pr=(APP.props&&APP.props.key===k)?APP.props.list:[];
 el.innerHTML=`<div class="trm"><h3>訳を直す</h3><div class="tren">${esc(k)}</div>
  <textarea id="trTa" rows="3">${esc(jaFull())}</textarea>
  <div class="trbtns"><button class="action" id="trSave">自分用に保存</button>${DBX?'<button class="action go" id="trShare">保存してみんなに提案</button>':''}${own?'<button class="action plain" id="trReset">元の訳にもどす</button>':''}</div>
  <p class="note">提案した訳は、すぐにみんなの画面には出ません。${TR_NEED}人が「いいね」すると「みんなの訳」になります。気に入った訳は「自分の訳にする」で自分だけに登録できます。</p>
  ${DBX?`<h4>みんなの提案 ${pr.length?'('+pr.length+')':''}</h4>${pr.length?pr.map(q=>`<div class="trp ${q.likes>=TR_NEED?'ok':''}"><div class="trpj">${esc(q.ja)}${q.likes>=TR_NEED?'<span class="badge">みんなの訳</span>':''}${q.byMe?'<span class="badge me">自分の提案</span>':''}</div><div class="trpb"><button class="chip ${q.mine?'on':''}" data-like="${q.id}">👍 ${q.likes}</button><button class="chip" data-adopt="${esc(q.ja)}">自分の訳にする</button></div></div>`).join(''):'<p class="note">まだ提案はありません</p>'}`:'<p class="note">この画面ではみんなの提案は使えません（Claudeの中で開くと使えます）</p>'}
  <button class="action plain" id="trClose">閉じる</button></div>`;
 el.querySelector('#trClose').onclick=closeTrModal;
 el.onclick=(e)=>{ if(e.target===el) closeTrModal(); };
 el.querySelector('#trSave').onclick=()=>{ const v=el.querySelector('#trTa').value.trim(); if(!v) return; DB.trOwn=DB.trOwn||{}; DB.trOwn[k]=v; save(); toast('自分用の訳として保存しました'); renderCanvasSentence(); renderScene(); renderTrModal(); };
 const sh=el.querySelector('#trShare'); if(sh) sh.onclick=()=>{ const v=el.querySelector('#trTa').value.trim(); if(!v) return; DB.trOwn=DB.trOwn||{}; DB.trOwn[k]=v; save(); renderCanvasSentence(); proposeTr(v); };
 const rs=el.querySelector('#trReset'); if(rs) rs.onclick=()=>{ delete DB.trOwn[k]; save(); renderCanvasSentence(); renderScene(); renderTrModal(); };
 el.querySelectorAll('[data-like]').forEach(b=>b.onclick=()=>{ const q=pr.find(x=>x.id===b.dataset.like); likeProp(b.dataset.like, !(q&&q.mine)); });
 el.querySelectorAll('[data-adopt]').forEach(b=>b.onclick=()=>{ DB.trOwn=DB.trOwn||{}; DB.trOwn[k]=b.dataset.adopt; save(); toast('自分の訳に登録しました'); renderCanvasSentence(); renderScene(); renderTrModal(); });
}


// ---------- 🔍 search by typing, and register a missing word on the spot ----------
export function openSearch(){ const st=stageOf(); APP.search={q:'',ctx:{st,open:APP.open,lsub:APP.lsub,beKind:APP.beKind,side:APP.side,subjTab:APP.subjTab,active:APP.active}}; renderSearchBar(); renderScene(); setTimeout(()=>{ const i=document.getElementById('srchIn'); if(i) i.focus(); },50); }
export function closeSearch(){ APP.search=null; const el=document.getElementById('srch'); if(el) el.remove(); renderScene(); }
export function renderSearchBar(){ let el=document.getElementById('srch'); if(!APP.search){ if(el) el.remove(); return; } if(!el){ el=document.createElement('div'); el.id='srch'; el.innerHTML=`<span>🔍</span><input id="srchIn" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="英語か日本語で（例：te / 先生）"><button id="srchX">×</button>`; $('#canvas').appendChild(el); el.querySelector('#srchIn').addEventListener('input',e=>{ APP.search.q=e.target.value; renderScene(); }); el.querySelector('#srchX').onclick=closeSearch; } }
export function searchPool(){
 const x=APP.search.ctx, c=AC(), L=[];
 const add=(k)=>optList0(k,c).forEach(o=>L.push(o));
 if(x.open && ['modal','q','imp','place','time','manner','with','cmp','mcmp','scope','toWhom','relk','pre'].includes(x.open)) add(x.open);
 else if(x.st==='subj'){ add('who'); add('what'); }
 else if(x.st==='split'){
  if(x.lsub==='be'){ LEX.states.forEach(s=>L.push({id:s.id,e:s.e,en:s.en,ja:stateJaLabel(s),pos:'adj',act:()=>pick('state',s.id)})); }
  else LEX.verbs.filter(v=>v.fr!=='cl'&&!v.hidden).forEach(v=>{ const other = v.fr==='tr' || (v.fr==='both' && x.side==='other'); L.push({id:v.id,e:v.e,en:v.en+(v.tail?' '+String(v.tail).replace('{poss}','my'):'')+(v.prep?' '+v.prep:''),ja:v.jaAdj&&v.jaAdjT!=='i'?v.ja+'だ':v.ja,pos:'verb',act:()=>pick(other?'other':'self',v.id)}); });
 }
 else if(x.st==='obj'){ const v=predV(c); if(v&&v.dt) add('iobj'); else add('objP'); add('objT'); }
 else if(['thing','than','mthan'].includes(x.st)) add(x.st);
 else { add('manner'); add('with'); add('place'); add('time'); }
 const seen=new Set(); return L.filter(o=>{ const k=o.en+'|'+o.ja; if(seen.has(k)) return false; seen.add(k); return true; });
}
export function searchResults(){ const q=(APP.search.q||'').trim().toLowerCase().replace(/^(a|an|the|my|to|with|than|as) +/,''); if(!q) return []; const pool=searchPool(); const sc=o=>{ const en=String(o.en).toLowerCase().replace(/^(a|an|the|my|to|with|than|as) /,''); const ja=String(o.ja||''); if(en.startsWith(q)) return 3; if(en.split(/[\s…]+/).some(w=>w.startsWith(q))) return 2; if(ja.includes(q)||en.includes(q)) return 1; return 0; }; return pool.map(o=>({o,s:sc(o)})).filter(x=>x.s>(q.length<3&&/^[a-z]+$/.test(q)?1:0)).sort((a,b)=>b.s-a.s||weightOf(b.o)-weightOf(a.o)).map(x=>x.o); }
export function guessKind(){ const x=APP.search.ctx; if(x.open==='place') return 'places'; if(x.open==='time') return 'times'; if(x.open==='manner') return 'manners'; if(x.open==='with') return 'people'; if(x.st==='subj') return x.subjTab==='what'?'things':'people'; if(x.st==='split') return x.lsub==='be'?'states':'verbs'; if(x.st==='obj') return 'things'; return 'things'; }
export function searchNodes(add){
 const res=searchResults(); const q=(APP.search.q||'').trim();
 add('ui-prompt',`<div class="guide"><span class="gp">🔍</span>${esc(q?'「'+q+'」で探しています':'文字を打つと、ここに候補が出ます')}</div>`,50,12,{cls:'lbl ui'});
 res.slice(0,8).forEach((o,i)=>{ add('sr-'+(o.id||o.en),optCardHtml(o),[28,72][i%2],21+Math.floor(i/2)*9.5,{cls:'ui fo',tap:()=>{ const a=o.act; closeSearch(); a(); }}); });
 const exact=res.some(o=>String(o.en).toLowerCase().replace(/^(a|an|the|to) /,'')===q.toLowerCase());
 if(q.length>=2 && !exact && /[a-z]/i.test(q)) add('sr-reg',`<div class="pill go">＋「${esc(q)}」を登録して使う</div>`,50,21+Math.ceil(Math.min(8,res.length)/2)*9.5+2,{cls:'ui fb',tap:()=>openQuickReg(q,guessKind())});
 if(q && !res.length && !/[a-z]/i.test(q)) add('sr-none','<span class="auxcap">英語で打つと、新しく登録もできます</span>',50,24,{cls:'lbl ui'});
}
export let QR_KINDS;
export let QR_TAGS;
export function openQuickReg(q, kind){ APP.qr={en:q.trim(),ja:'',kind,fr:'both',tags:['thing'],busy:false}; renderQuickReg(); }
export function closeQuickReg(){ APP.qr=null; const el=document.getElementById('qrModal'); if(el) el.remove(); }
export function renderQuickReg(){
 let el=document.getElementById('qrModal'); if(!el){ el=document.createElement('div'); el.id='qrModal'; ENV.root.appendChild(el); }
 const r=APP.qr;
 el.innerHTML=`<div class="trm"><h3>新しい言葉を登録</h3>
  <label class="qrl">英語<input id="qrEn" value="${esc(r.en)}" autocomplete="off" autocapitalize="off"></label>
  <label class="qrl">日本語<input id="qrJa" value="${esc(r.ja)}" placeholder="例：先生／走る／すばやく"></label>
  ${SAMPLE?`<button class="action nat" id="qrAI" ${r.busy?'disabled':''}>${r.busy?'🤖 調べています…':'🤖 意味と使い方を自動で調べる'}</button>`:''}
  <div class="qrk">${QR_KINDS.map(([k,l])=>`<button class="chip ${r.kind===k?'on':''}" data-qk="${k}">${l}</button>`).join('')}</div>
  ${r.kind==='verbs'?`<div class="qrk"><span class="note">どう使う？</span>${[['intr','自分だけでする'],['tr','何かにする'],['both','両方']].map(([k,l])=>`<button class="chip ${r.fr===k?'on':''}" data-qf="${k}">${l}</button>`).join('')}</div>`:''}
  ${(r.kind==='things'||(r.kind==='verbs'&&r.fr!=='intr'))?`<div class="qrk"><span class="note">${r.kind==='verbs'?'何に対してする？':'どんな物？'}</span>${QR_TAGS.map(([k,l])=>`<button class="chip ${r.tags.includes(k)?'on':''}" data-qt="${k}">${l}</button>`).join('')}</div>`:''}
  <p class="note">登録した言葉は「⭐ マイことば」に入り、このあともずっと使えます（この端末に保存）。</p>
  <div class="trbtns"><button class="action go" id="qrSave">登録してすぐ使う</button><button class="action plain" id="qrClose">閉じる</button></div></div>`;
 const g=id=>el.querySelector(id);
 g('#qrEn').oninput=e=>{ r.en=e.target.value; }; g('#qrJa').oninput=e=>{ r.ja=e.target.value; };
 g('#qrClose').onclick=closeQuickReg; el.onclick=e=>{ if(e.target===el) closeQuickReg(); };
 el.querySelectorAll('[data-qk]').forEach(b=>b.onclick=()=>{ r.kind=b.dataset.qk; renderQuickReg(); });
 el.querySelectorAll('[data-qf]').forEach(b=>b.onclick=()=>{ r.fr=b.dataset.qf; renderQuickReg(); });
 el.querySelectorAll('[data-qt]').forEach(b=>b.onclick=()=>{ const t=b.dataset.qt; const i=r.tags.indexOf(t); i>=0? r.tags.splice(i,1) : r.tags.push(t); if(!r.tags.length) r.tags=['thing']; renderQuickReg(); });
 const ai=g('#qrAI'); if(ai) ai.onclick=aiFill;
 g('#qrSave').onclick=saveQuickReg;
}
export async function aiFill(){
 const r=APP.qr; if(!SAMPLE||!r||!r.en.trim()) return; r.busy=true; renderQuickReg();
 const prompt=`You help a Japanese learner add an English word to a sentence-building game. Word or phrase: "${r.en.trim()}". The learner wants to use it as: ${QR_KINDS.find(k=>k[0]===r.kind)[1]}.
Reply ONLY with JSON (no markdown):
{"kind":"people|things|verbs|states|manners|places|times","en":"how it appears in a sentence (nouns WITH a/an/the, places like 'at the gym', verbs as the base form only)","ja":"natural Japanese (verbs in dictionary form like 走る, adjectives like 高い or 静か, places ending in で)","fr":"intr|tr|both (verbs only)","jt":"g|i|s (verbs: godan / ichidan / suru)","past":"past tense (verbs)","pp":"past participle (verbs)","tags":["for nouns, and for what a verb acts on, choose from: food, drink, read, thing, sport, game, music, lang, watch, ride, event, person, animal"],"plural":false,"animal":false}`;
 try{ const j=await SAMPLE.json(prompt,{modelTier:'quick'}); if(j){ if(j.kind&&QR_KINDS.some(k=>k[0]===j.kind)) r.kind=j.kind; if(j.en) r.en=String(j.en); if(j.ja) r.ja=String(j.ja); if(j.fr) r.fr=j.fr; if(Array.isArray(j.tags)&&j.tags.length) r.tags=j.tags.filter(t=>typeof t==='string'); r.ai=j; } }
 catch(e){ toast(e&&e.code==='not_granted'?'許可されなかったので自動では調べられません':'自動で調べられませんでした。自分で入力してください'); }
 r.busy=false; renderQuickReg();
}
export function saveQuickReg(){
 const r=APP.qr; if(!r) return; const en=r.en.trim(), ja=r.ja.trim(); if(!en||!ja){ toast('英語と日本語を入れてください'); return; }
 REG.en=en; REG.ja=ja; REG.e=''; REG.x=Object.assign(autoExtra(r.kind,en,ja), r.kind==='verbs'?{fr:r.fr,t:r.tags.slice()}:{}, r.kind==='things'?{t:r.tags.slice(),pl:r.ai&&r.ai.plural?1:0}:{}, r.kind==='people'?{animal:r.ai&&r.ai.animal?1:0,pl:r.ai&&r.ai.plural?1:0}:{});
 if(r.kind==='verbs' && r.ai){ if(r.ai.jt&&['g','i','s'].includes(r.ai.jt)) REG.x.jt=r.ai.jt; if(r.ai.past) REG.x.past=r.ai.past; if(r.ai.pp) REG.x.pp=r.ai.pp; }
 const item=makeItem(r.kind); const set=DB.sets[0]; set.items.push(item); save(); refreshLex();
 closeQuickReg(); const x=APP.search? APP.search.ctx : (APP.qrCtx||{}); APP.qrCtx=null; APP.search=null; const sb=document.getElementById('srch'); if(sb) sb.remove();
 toast(`「${en}」を登録しました`);
 const id=item.id, k=r.kind;
 if(k==='verbs'){ const other=(item.fr==='tr')||(item.fr==='both'&&x.side==='other'); pick(other?'other':'self',id); }
 else if(k==='states') pick('state',id);
 else if(k==='places') pick('place',id); else if(k==='times') pick('time',id); else if(k==='manners') pick('manner',id);
 else if(k==='people'){ if(x.st==='subj') pick('subj','p:'+id); else if(x.open==='with') pick('with','p:'+id); else if(x.st==='obj') pick('obj','p:'+id); else render(); }
 else if(k==='things'){ if(x.st==='obj') pick('obj','t:'+id); else if(x.st==='subj') { refreshLex(); render(); } else render(); }
 else render();
}

// ---------- バーで変えた部分のハイライト（次の変化まで残す） ----------
export function hlLcs(a,b){ const n=a.length,m=b.length; const d=Array.from({length:n+1},()=>new Int16Array(m+1));
 for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--) d[i][j]=a[i]===b[j]?d[i+1][j+1]+1:Math.max(d[i+1][j],d[i][j+1]);
 const keep=new Set(), pr=new Map(); let i=0,j=0; while(i<n&&j<m){ if(a[i]===b[j]){ keep.add(j); pr.set(i,j); i++; j++; } else if(d[i+1][j]>=d[i][j+1]) i++; else j++; }
 const out=new Set(); for(let k=0;k<m;k++) if(!keep.has(k)) out.add(k);
 for(let k=0;k<n;k++) if(!pr.has(k) && out.size && [...out].some(x=>b[x]===a[k])){ [k-1,k+1].forEach(q=>{ if(pr.has(q)) out.add(pr.get(q)); }); } // 語が動いた（Don't I …?）時は、動いた語のとなりの語も塗る
 return out; }
export function hlRo(a,b){ // 日本語：いちばん長い共通部分から順に合わせる（細切れにならない）。合わなかった側(b)の文字を返す
 const keep=new Set(); (function rec(a0,a1,b0,b1){ if(a0>=a1||b0>=b1) return; let best=0,bi=0,bj=0;
  for(let i=a0;i<a1;i++) for(let j=b0;j<b1;j++){ let k=0; while(i+k<a1&&j+k<b1&&a[i+k]===b[j+k]) k++; if(k>best){ best=k; bi=i; bj=j; } }
  if(!best) return; for(let k=0;k<best;k++) keep.add(bj+k); rec(a0,bi,b0,bj); rec(bi+best,a1,bj+best,b1); })(0,a.length,0,b.length);
 const out=new Set(); for(let k=0;k<b.length;k++) if(!keep.has(k)) out.add(k); return out; }
export function hlTrack(pk, ja){ let sig=''; try{ const m=Object.assign({},APP.S.main); delete m.subj; sig=JSON.stringify(m); }catch(e){} // pk=[{k:役割のkey, t:その語のかたまり}]。前回の文と「役割ごと」に比べる（同じ語が2回出る文でも主語に間違って色がつかない）
 const cur={pk:pk, ja:ja, sig:sig, key:pk.map(x=>x.k+'='+x.t).join(' ')+'|'+ja};
 const prev=APP.hlSnap; APP.hlSnap=cur;
 if(!prev){ APP.hlMark=null; return; }
 if(prev.key===cur.key) return;
 const cnt={}, old={}; prev.pk.forEach(x=>{ const n=cnt[x.k]=(cnt[x.k]||0)+1; old[x.k+'#'+n]=x.t; });
 const seen={}; const en=new Set(); cur.pk.forEach((x,i)=>{ const n=seen[x.k]=(seen[x.k]||0)+1; const o=old[x.k+'#'+n]; if(o===undefined||o.toLowerCase()!==x.t.toLowerCase()) en.add(i); });
 if(sig&&prev.sig===sig){ [...en].forEach(i=>{ if(!/^m\.(subj|by)$/.test(cur.pk[i].k)) en.delete(i); }); } // 主語だけ変えたとき：be動詞・動詞の一致変化は塗らず、主語だけ塗る
 const mj=hlRo([...prev.ja],[...cur.ja]);
 for(let k=1;k<cur.ja.length-1;k++) if(!mj.has(k)&&mj.has(k-1)&&mj.has(k+1)) mj.add(k); // 変わった文字にはさまれた1文字も塗って、細切れを防ぐ
 { const A=[...cur.ja]; let e=A.length; while(e>0&&/[。？！]/.test(A[e-1])) e--; let q=e; while(q>0&&!mj.has(q-1)&&e-q<2) q--; if(q>0&&mj.has(q-1)) for(let k=q;k<e;k++) mj.add(k); } // 文末の1〜2文字だけ取り残されたら、一緒に塗る（なかっ|た → なかった）
 APP.hlMark={en:en,ja:mj}; }
export function hlJaStr(){ try{ return jaFull(); }catch(e){ return ''; } }
export function hlJa(ja){ const mk=APP.hlMark&&APP.hlMark.ja; if(!mk||!mk.size) return esc(ja); let out='',open=false; [...ja].forEach((ch,k)=>{ const on=mk.has(k); if(on&&!open){ out+='<mark class="hlw">'; open=true; } if(!on&&open){ out+='</mark>'; open=false; } out+=esc(ch); }); if(open) out+='</mark>'; return out; }
export function renderCanvasSentence(){
 const el=$('#csent'); if(!el) return;
 const raw=sentenceParts(APP.S); const parts=[]; 
 raw.forEach(q=>{ if(q.subEnd && q.front && parts.length){ parts[parts.length-1].comma=1; } if(q.en && !q.hole) parts.push(Object.assign({},q)); });
 const done=sentenceComplete(APP.S);
 if(!parts.length||!done){ el.classList.remove('show'); el.innerHTML=''; return; }
 const spot = null; const spotKey = spot==='intens'?'state':'verb';
 const words=parts.map((q,i)=>{ let t=q.en; if(i===0) t=cap(t); const g = spot && q.clause==='m' && String(q.key).split('.').pop()===spotKey ? `<span class="plusg" data-spot="${spot}">＋<i class="plusarr">⬆<b>ここに足せる</b></i></span>` : ''; return `${g}<span class="pos-${q.pos} ${isNegChunk(q)?'negc':''}">${esc(t)}</span>${q.comma?'<span class="p">,</span>':''}`; }).join(' ');
 parts.punct=raw.punct;
 let ja=''; try{ ja = jaFull().replace(/\s+/g,' ').replace(/ ([、。？！])/g,'$1'); }catch(e){ ja=''; }
 const src=trSource();
 if(!done) ja=ja.replace(/[。？！]$/,'')+' …';
 el.innerHTML=`<div class="cse" id="cseLine">${words}${done?`<span class="p">${parts.punct||sentenceParts(APP.S).punct||'.'}</span>`:'<span class="dots">…</span>'}</div>${SET().canvasJa && ja.trim()&&ja.trim()!=='…'?`<div class="csj">${esc(ja)}${src==='own'?' <span class="trtag">自分の訳</span>':src==='pub'?' <span class="trtag pub">みんなの訳</span>':''}</div>`:''}`;
 el.querySelectorAll('.plusg').forEach(b=>b.onclick=e=>{ e.stopPropagation(); APP.open=b.dataset.spot; render(); });
 { const c=AC(); const v=predV(c); const tools=[];
   if(v && familyOf(v).length && !APP.finished && !cardMode()) tools.push(`<button class="ctool dial" data-t="dial">🎡 ${esc(pvBase(v))} ＋？</button>`);
   if(v) altsOf(v).slice(0,2).forEach(a=>tools.push(`<button class="ctool alt" data-t="alt:${a.id}">⇄ ${esc(verbLabel(a))}</button>`));
   const m=APP.S.main;
   if(APP.active==='main' && !APP.finished && m.type==='normal'){
    const okN=r=>r && N(r) && !(N(r).pron) && !(N(r).poss);
    if(false) tools.push(`<button class="ctool cont" data-t="rel:obj">＋ ${esc(N(m.obj).en.replace(/^(a|an|the|my) /,''))} どんな？</button>`);
    if(false) tools.push(`<button class="ctool cont" data-t="rel:subj">＋ ${esc(N(m.passive?m.obj:m.subj).en.replace(/^(a|an|the|my) /,''))} どんな？</button>`);
    if(false) tools.push(`<button class="ctool cont" data-t="relw:place">＋ where …</button>`);
    if(false) tools.push(`<button class="ctool cont" data-t="relw:time">＋ when …</button>`);
    if(m.subs.rel){ const hr=relHead(); const per=hr&&isPerson(hr); const cur=m.subs.rel.pron||(per?'who':'that'); const opts=per?(m.subs.rel.gap==='o'?['who','whom','that']:['who','that']):['that','which']; const nx=opts[(opts.indexOf(cur)+1)%opts.length]; tools.push(`<button class="ctool alt" data-t="pron:${nx}">⇄ ${cur} → ${nx}</button>`); }
   }
   if(predS(c) && !predS(c).loc && !APP.finished){ const s=predS(c); const opts=s.noun? [null,'become','seem'] : [null,'become','look','feel','get','seem','sound']; opts.filter(x=>x!==c.link).forEach(x=>tools.push(`<button class="ctool alt" data-t="link:${x||'be'}">⇄ ${x?({become:'become（なる）',look:'look（見える）',feel:'feel（感じる）',get:'get（なる）',seem:'seem（ようだ）',sound:'sound（聞こえる）'})[x]:'be（状態）'}</button>`)); }
   if(v && v.sep && v.tail && c.obj && !isPronRef(c.obj)) tools.push(`<button class="ctool sep" data-t="sep">⇄ ${esc(c.sepEnd? v.en+' '+v.tail+' '+(N(c.obj)?objNP(c):'…') : v.en+' '+(N(c.obj)?objNP(c):'…')+' '+v.tail)}</button>`);
   if(tools.length){ el.insertAdjacentHTML('beforeend',`<div class="ctools">${tools.join('')}</div>`); el.querySelectorAll('.ctool').forEach(b=>b.onclick=()=>{ const t=b.dataset.t; if(t==='dial'){ APP.open = APP.open==='dial'?null:'dial'; APP.finished=false; render(); } else if(t==='sep'){ mutate(()=>{ AC().sepEnd=!AC().sepEnd; },'sentence'); } else if(t.startsWith('alt:')){ swapVerb(t.slice(4)); } else if(t.startsWith('rel:')){ APP.relTarget=t.slice(4); APP.open='relk'; APP.finished=false; render(); } else if(t.startsWith('relw:')){ openSub('relw',{slot:t.slice(5)}); } else if(t.startsWith('link:')){ const x=t.slice(5); pick('link', x==='be'?null:x); } else if(t.startsWith('pron:')){ mutate(()=>{ APP.S.main.subs.rel.pron=t.slice(5); },'sentence'); } }); }
 }
 el.classList.add('show');
}
// ---------- gestures on the canvas ----------
export function areaAt(fx){ const c=AC(); const ars=areasOf(c,APP.active,stageOf()); return ars.find(a=>fx>=a.x0&&fx<a.x1)||null; }
export function initGestures(){
 const sc=$('#scene'), cv=$('#canvas'); let s=null;
 sc.addEventListener('pointerdown',e=>{ const r=sc.getBoundingClientRect(); s={x:e.clientX-r.left,y:e.clientY-r.top,ui:!!e.target.closest('.nd.fb,.nd.fo'),w:r.width}; });
 sc.addEventListener('pointercancel',()=>{ s=null; });
 sc.addEventListener('pointerup',e=>{
  if(!s) return; const r=sc.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top, dx=x-s.x, dy=y-s.y, W=s.w, st=s; s=null;
  if(st.x>W-30 && dx<-60 && Math.abs(dy)<90){ goNext(); return; }
  if(st.x<30 && dx>60 && Math.abs(dy)<90){ if(APP.hist.length){ cv.classList.add('backflash'); setTimeout(()=>cv.classList.remove('backflash'),350); undo(); } return; }
  if(APP.finished || APP.open) return;
  const c=AC(); const ars=areasOf(c,APP.active,stageOf()); if(!ars.length) return;
  let ar=null;
  if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)){ ar = ars.length===2? (dx<0?ars[0]:ars[1]) : ars.find(a=>x/W>=a.x0&&x/W<a.x1); }
  else if(!st.ui && Math.abs(dx)<12 && Math.abs(dy)<12){ ar = ars.find(a=>x/W>=a.x0&&x/W<a.x1); }
  if(ar) chooseArea(ar,c);
 });
 initTimeline();
 cv.addEventListener('pointerdown',e=>{ if(APP.beat){ e.stopPropagation(); e.preventDefault(); endBeat(); return; } if(e.target.closest('#idle')) return; resetIdle(); },true);
}
// ---------- idle hint: after 10 s, the areas + what to think about next ----------
export let idleTimer, promptKey;
// the prompt always comes first: at every new decision point show it; 10 s with no choice → open the options; 10 s idle → prompt again
export function promptAreas(){ if(APP.view!=='play' || APP.search || APP.finished || APP.open || APP.beat) return []; return areasOf(AC(),APP.active,stageOf()); }
export function dismissPrompt(){ clearTimeout(idleTimer); idleTimer=null; if(APP.idle){ APP.idle=false; renderIdle(); } }
export function showPrompt(){ clearTimeout(idleTimer); APP.idle=true; renderIdle(); idleTimer=setTimeout(autoOpen,10000); }
export function armIdle(){ clearTimeout(idleTimer); idleTimer=setTimeout(()=>{ idleTimer=null; if(APP.tlBusy){ armIdle(); return; } if(promptAreas().length) showPrompt(); },10000); }
export function autoOpen(){ idleTimer=null; if(APP.tlBusy){ idleTimer=setTimeout(autoOpen,3000); return; } const ars=promptAreas(); const st=stageOf(); if(!ars.length || st==='extras'){ dismissPrompt(); if(ars.length) armIdle(); return; }
 const last=APP.lastArea && ars.find(a=>a.k===APP.lastArea); chooseArea(last || ars.find(a=>a.main) || ars[0], AC()); }
export function checkPrompt(){
 const ars=promptAreas(); const key=APP.active+'|'+stageOf()+'|'+(cursorOf(APP.active)||'')+(bePending(AC())?'|be':'')+'|'+(askStage()?(APP.askOpen?'ao':'as'):'');
 if(!ars.length){ promptKey=APP.open? promptKey : ''; dismissPrompt(); return; }
 if(key!==promptKey){ promptKey=key; APP.lastArea=null; showPrompt(); return; }
 renderIdle(); if(!APP.idle && !idleTimer) armIdle();
}
export let finTimer;
export function armFin(){ clearTimeout(finTimer); if(APP.finIdle) return; if(APP.finished) finTimer=setTimeout(()=>{ if(APP.finished){ APP.finIdle=true; renderScene(); } },10000); }
export function resetIdle(){ armFin(); const was=APP.idle; dismissPrompt(); if(promptAreas().length) armIdle(); }
export function renderIdle(){
 const el=$('#idle'); const c=AC(), st=stageOf(); const ars=APP.idle? promptAreas():[];
 $('#canvas').classList.toggle('prompting', !!ars.length);
 if(!ars.length){ el.classList.remove('show'); el.innerHTML=''; return; }
 const msg={subj:askStage()?(APP.askOpen?'どうきく？':'どっちから？'):'だれの話？ 何の話？',split:bePending(c)?(APP.beKind==='loc'?'どこにいる？ どこにある？':APP.beKind==='noun'?'どんな？ 何者？':'どれくらい？ どう？'):(LV()<2?'どんな感じ？ 何してる？':'どんな感じ？ 何かにする？'),obj:'どんな？ 何を？',iobj:'誰を？ 何を？',extras:'次に続けるなら、左から順番に',thing:(APP.S&&APP.S.main.type==='excl')?'なんて〜な、何？':'何がある？',than:'誰とくらべる？',mthan:'何とくらべる？'}[st]||'どれにする？';
 el.innerHTML=`<div class="idmsg">👆 ${esc(msg)}</div>`+ars.map((a,i)=>`<button class="zone pos-${a.pos} ${a.main?'main':''} ${ars.length>2||(a.x1-a.x0)<.35?'narrow':''}" style="left:${a.x0*100}%;width:${(a.x1-a.x0)*100}%" data-z="${i}"><b class="en">${esc(a.label)}</b><span>${esc(a.ja)}</span></button>`).join('');
 (APP.nounTags||[]).forEach((T,i)=>{ const sc=$('#scene').getBoundingClientRect(), ir=el.getBoundingClientRect(); el.insertAdjacentHTML('beforeend',`<button class="ntag inidle ${T.cls}" data-nt="${i}" style="left:${sc.left+sc.width*T.x/100-ir.left}px;top:${sc.top+sc.height*T.y/100-ir.top}px">${esc(T.label)}</button>`); el.querySelector('[data-nt="'+i+'"]').onclick=e=>{ e.stopPropagation(); dismissPrompt(); T.act(); }; });
 el.classList.add('show');
 el.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{ const a=ars[+b.dataset.z]; dismissPrompt(); chooseArea(a,AC()); });
}
// ---------- the time line under the character: drag to change tense ----------
export let TLX; // 過去・現在・未来の起点（バーの内側に寄せる）
export function tlStops(c){ const L=TLVL[LV()]; return TENSE_UI.filter(t=>TENSE_ORDER.includes(t)&&(!L||L.includes(t))); }
// ラベルの位置と段：単純形は起点の真下、進行形はその下の段、完了系は起点の間
export let TLPOS; // 順番どおりにほぼ均等（左6刻み・右7.5刻み）。単純形3つは起点の真上
export let TLROWS;
export function tlAssign(c,stops,W){ TLROWS={}; const occ=[[],[],[],[]]; const pri=['past','pres','fut','pastprog','prog','futprog','pastperf','perf','futperf','pastperfprog','perfprog','futperfprog']; const w=t=>{ const n=[...tlLabel(c,t)].length; return (n*11+14)/W*100; };
 pri.filter(t=>stops.includes(t)).forEach(t=>{ const x=tlPos(c,t), a=x-w(t)/2, b=x+w(t)/2; for(let r=1;r<=4;r++){ if(!occ[r-1].some(o=>a<o[1]+0.5&&b>o[0]-0.5)){ occ[r-1].push([a,b]); TLROWS[t]=r; break; } } }); }
export function tlRow(t){ return TLROWS[t]||1; }
export function tlPos(c,t){ return (TLPOS[t]||[50,1])[0]; }
export function tlLabel(c,t){ const st=!!(c.pred&&c.pred.k==='s')||c.type==='exist'; if(st) return ({pastperf:'その前',past:'だった',perf:'ずっと',pres:'今・いつも',fut:'これから'})[t]; return ({pastperf:'その時もう',pastperfprog:'その時まで',past:'した',pastprog:'していた',perf:'今まで',prog:'今してる',perfprog:'ずっと',pres:'いつも',futperf:'終わってる',futperfprog:'やり続けてる',fut:'これから',futprog:'その時してる'})[t]; }
export function tlVisible(){ const c=AC(), kind=APP.active; if(APP.view!=='play'||kind==='purpose'||kind==='part'||kind==='caus'||(kind==='comp'&&c.vform)||c.type==='imp'||c.type==='excl') return false; return true; }
export function tlDraw(c){
 const t=c.tense, sr=c.subj; const e = c.type==='exist'&&c.thing? N(c.thing).e : (sr&&N(sr)? N(sr).e : '🙂'); const P=TLX.p, C=TLX.c, F=TLX.f;
 const face=(x,g)=>`<i class="fc${g?' g':''}" style="left:${x}%">${ico(e)}</i>`;
 const ln=(a,b,d)=>`<i class="ln${d?' ds':''}" style="left:${a}%;width:${b-a}%"></i>`;
 const hd=(x)=>`<i class="ah ar" style="left:${x}%"></i>`;
 const dt=(x,k)=>`<i class="dt ${k}" style="left:${x}%"></i>`;
 const bd=(a,b)=>`<i class="bd" style="left:${a}%;width:${b-a}%"></i>`;
 const arrow=(a,b,d)=>ln(a,b,d)+hd(b);
 const base={past:P,pastprog:P,pastperf:P,pastperfprog:P,perf:C,perfprog:C,pres:C,prog:C,futperf:F,futperfprog:F,fut:F,futprog:F}[t]; // 基準の起点
 const isProg=/prog$/.test(t)&&!/perfprog$/.test(t); const isPerf=/perf/.test(t);
 let h='';
 // 起点の点（過去・現在・未来）。基準になる点はハッキリ／進行形は点なしで範囲
 h+=[P,C,F].map(x=>dt(x,(x===base&&!isProg&&!isPerf)?'s':(x===base&&isProg?'hid':'o'))).join('');
 if(t==='pres') h+=ln(10,90)+[10,30,50,70,90].map(x=>face(x)).join('');
 else if(t==='past'||t==='fut') h+=face(base);
 else if(isProg){ h+=bd(base-11,base+11)+face(base); }
 else if(t==='perf'){ const g=C-14; h+=dt(g,'f')+dt(C,'s')+arrow(g+3.5,C-3.5)+face(g,1)+face(C); }
 else if(t==='perfprog'){ h+=dt(26,'f')+bd(26,C)+dt(C,'s')+ln(29.5,34.5)+ln(41.5,C-3.5)+hd(C-3.5)+ln(C+3.5,C+16,1)+hd(C+16)+face(26,1)+face(38,1)+face(C); }
 else if(t==='pastperf'){ const g=P-14; h+=dt(g,'f')+dt(P,'s')+arrow(g+3.5,P-3.5)+face(g,1)+face(P); }
 else if(t==='pastperfprog'){ h+=dt(5,'f')+bd(5,P)+dt(P,'s')+ln(9,P-3.5)+hd(P-3.5)+ln(P+3.5,P+16,1)+hd(P+16)+face(5,1)+face(P); }
 else if(t==='futperf'){ const g=C+4; h+=dt(g,'f')+dt(F,'s')+arrow(g+3.5,F-3.5)+face(g,1)+face(F); }
 else if(t==='futperfprog'){ h+=dt(52,'f')+bd(52,F)+dt(F,'s')+ln(55.5,60.5)+ln(67.5,F-3.5)+hd(F-3.5)+ln(F+3.5,F+14,1)+hd(F+14)+face(52,1)+face(65,1)+face(F); }
 return h;
}
export function updateTimeline(){
 const el=$('#tline'); if(!tlVisible()){ el.classList.remove('show'); return; } el.classList.add('show');
 const c=AC(), kind=APP.active; const al=allowedTenses(c,{kind}); const stops=isFree()?tlStops(c):tlStops(c).filter(t=>al.includes(t)||c.tense===t); const moreAv=false;
 el.querySelector('.tvis').innerHTML=tlDraw(c);
 el.style.height='90px'; el.querySelector('.tstops').style.height='46px';
 const NMJ={pastperf:'過去完了形',past:'過去形',pastperfprog:'過去完了進行形',pastprog:'過去進行形',perf:'現在完了形',perfprog:'現在完了進行形',pres:'現在形',prog:'現在進行形',futperf:'未来完了形',futperfprog:'未来完了進行形',fut:'未来形',futprog:'未来進行形'};
 el.querySelector('.tstops').innerHTML='<i class="rail"></i>'+tlStops(c).map(t=>`<i class="rs ${['past','pres','fut'].includes(t)?'base':''} ${al.includes(t)?'':'off'}" style="left:${tlPos(c,t)}%"></i>`).join('')+`<i class="rh" style="left:${tlPos(c,c.tense)}%"></i><span class="tnm"><b>${esc(tlLabel(c,c.tense)||'')}</b><small>${NMJ[c.tense]||''}</small></span>`;
 const mb=el.querySelector('.tmore'); mb.textContent = '＋ ほかの時制'; mb.style.display = 'none';
 { let an=el.querySelector('.tanc'); if(!an){ an=document.createElement('div'); an.className='tanc'; el.querySelector('.track').appendChild(an); } an.innerHTML=[[TLX.p,'過去','past'],[TLX.c,'現在','pres'],[TLX.f,'未来','fut']].map(a=>`<span data-t="${a[2]}" class="${c.tense===a[2]?'on':''} ${tlStops(c).includes(a[2])&&al.includes(a[2])?'':'off'}" style="left:${a[0]}%">${a[1]}</span>`).join(''); }
 const sr=c.subj; const e = c.type==='exist'&&c.thing? N(c.thing).e : (sr&&N(sr)? N(sr).e : '⏱️');
 
 el.querySelector('.tlock').textContent = c.time&&al.length<stops.length ? '「'+TM(c.time).ja+'」に合う所だけ動かせます' : '';
}
export function initTimeline(){
 const el=$('#tline'); let drag=false, startT=null;
 const snap=(clientX,clientY,tg)=>{ const r=el.querySelector('.track').getBoundingClientRect(); const x=(clientX-r.left)/r.width*100; const c=AC(); const al=allowedTenses(c,{kind:APP.active}); let best=null,bd=1e9; const ok=tlStops(c).filter(t=>al.includes(t)); const an=tg&&tg.closest?tg.closest('.tanc span'):null; if(an&&ok.includes(an.dataset.t)) best=an.dataset.t; if(!best) ok.forEach(t=>{ const d=Math.abs(tlPos(c,t)-x); if(d<bd){bd=d;best=t;} }); if(best && best!==c.tense){ c.tense=best; APP.tenseSet=true; normalize(); renderBar(); renderScene(); updateTimeline(); renderCanvasSentence(); if(APP.finished) say(sentenceText(APP.S)); if(navigator.vibrate) navigator.vibrate(8); } };
 el.querySelector('.tmore').addEventListener('pointerdown',e=>e.stopPropagation());
 el.querySelector('.tmore').addEventListener('click',e=>{ e.stopPropagation(); APP.tlMore=true; updateTimeline(); renderBar(); });
 el.addEventListener('pointerdown',e=>{ resetIdle(); APP.tlBusy=true; if(e.target.closest('.tmore')) return; e.stopPropagation(); drag=true; startT=AC().tense; APP.hist.push(snapshot()); el.setPointerCapture(e.pointerId); el.classList.add('drag'); snap(e.clientX,e.clientY,e.target); });
 el.addEventListener('pointermove',e=>{ if(drag) snap(e.clientX,e.clientY); });
 const end=e=>{ APP.tlBusy=false; resetIdle(); if(!drag) return; drag=false; el.classList.remove('drag'); if(AC().tense===startT){ APP.hist.pop(); return; } if(APP.finished){ APP.finTried=true; APP.finIdle=false; armFin(); renderScene(); say(sentenceText(APP.S)); } else speakAfter('vg'); };
 el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end);
}
// ---------- nav ----------
export function go(v){ APP.view = v==='make'?'play':v; if(v==='prac'){ if(!PR.cur) prNew(); else renderPrac(); } if(v==='sets') renderSets(); if(v==='settings') renderSettings(); if(v==='reg') renderReg(); render(); }
export function setLevel(l){ if(String(LV())===String(l)) return; SET().slv=String(l); if(typeof save==='function') save(); APP.level=String(l); resetAll(); }
export function init(){
 I18N.lang=(DB.settings.ui && I18N.tables[DB.settings.ui])?DB.settings.ui:'ja'; applyI18n();
 document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
 $('#lvl').querySelectorAll('button').forEach(b=>b.onclick=()=>setLevel(b.dataset.l));
 $('#finish').onclick=openFinish; $('#sayall').onclick=()=>say(sentenceText(APP.S));
 $('#bUndo').onclick=resetAll;
 initGestures(); initSample(); initShare();
 normalize(); render();
}


// ---------- 文の長さ：前・中・後ろ ----------
export function cardMode(){ const m=APP.S.main; return APP.active==='main' && !APP.finished && !APP.open && !APP.addMode && stageOf()==='extras' && sentenceComplete(APP.S); }
export function lenInfo(){ const m=APP.S.main, sb=m.subs; let F=0,B=0,I=0;
 if(m.lead) F++; if(m.front) F++; if(m.cmpw){ if(m.cmpwF) F++; else B++; } if(sb.conj&&sb.conj.front) F++; if(sb.part) F++;
 ['place','time','manner','with'].forEach(k=>{ if(m[k] && !(k==='place'?FRP(m):k==='time'?FRT(m):m.front===k)) B++; });
 if(sb.conj&&!sb.conj.front) B+=2; if(sb.rel) B+=2; if(sb.purpose) B+=2; if(sb.relw) B+=2;
 if(m.freq||m.intens||m.degree||m.mdeg||m.adj||m.oadj||m.sadj) I++;
 return {F,B,I}; }
export function innerSpot(){ const m=APP.S.main; if(m.type!=='normal') return null; if(m.pred&&m.pred.k==='s'&&predS(m)&&!predS(m).noun) return 'intens'; if(predV(m)) return 'freq'; return null; }

// 助動詞・時制で変わった部分を色分け（助動詞＝紫、時制＝オレンジ）
export function lcsMap(a,b){ const n=a.length,k=b.length; const d=Array.from({length:n+1},()=>new Int16Array(k+1));
 for(let i=n-1;i>=0;i--) for(let j=k-1;j>=0;j--) d[i][j]= a[i]===b[j]? d[i+1][j+1]+1 : Math.max(d[i+1][j],d[i][j+1]);
 const map=new Array(n).fill(-1); let i=0,j=0; while(i<n&&j<k){ if(a[i]===b[j]){ map[i]=j; i++; j++; } else if(d[i][j+1]>=d[i+1][j]) j++; else i++; } return map; }
export function modalCls(ja){ const m=APP.S.main; const mo=m.modal, tn=m.tense, ng=m.neg; let noM, base, plain; try{ m.modal=null; noM=sentenceJa(APP.S); m.tense='pres'; base=sentenceJa(APP.S); m.neg=false; plain=sentenceJa(APP.S); } finally { m.modal=mo; m.tense=tn; m.neg=ng; }
 const m1=lcsMap(ja,noM), m2=lcsMap(noM,base), m3=lcsMap(base,plain);
 const cls=[...ja].map((_,i)=>{ const a=m1[i]; if(a<0) return 'mhl'; const b=m2[a]; if(b<0) return 'thl'; return m3[b]<0? 'nhl' : ''; });
 { const ln=cls.lastIndexOf('nhl'); if(ln>=0){ let e=ja.length; while(e>0 && /[。．.!！?？]/.test(ja[e-1])) e--; if(e-ln-1<=2) for(let k=ln+1;k<e;k++) if(!cls[k]) cls[k]='nhl'; } }
 return cls; }
// 直した訳（自分の訳・みんなの訳）にも色を引き継ぐ：自動訳と照らして、同じ文字は同じ色、書きかえた所は元の隙間の色
export function modalClsOwn(own,gen){ const gc=modalCls(gen); const A=[...own], G=[...gen]; const map=lcsMap(A,G); const cls=new Array(A.length).fill('');
 let pi=-1, pj=-1; const flush=(i1,j1)=>{ const seen=gc.slice(pj+1,j1).filter(x=>x); const c=seen.length? seen[0] : ''; for(let i=pi+1;i<i1;i++) cls[i]=c; };
 for(let i=0;i<A.length;i++){ if(map[i]>=0){ flush(i,map[i]); cls[i]=gc[map[i]]; pi=i; pj=map[i]; } }
 flush(A.length,G.length); return cls; }
export function modalDiffHtml(){ const m=APP.S.main; const ja=jaFull(); const qs=h=>m.q? h.replace(/？$/,'<span class="qhl">？</span>') : h; if(!m.modal && m.tense==='pres' && !m.neg) return qs(esc(ja));
 const src=trSource(); let cls; if(src==='gen') cls=modalCls(ja); else { let gen=''; try{ gen=sentenceJa(APP.S); }catch(e){} cls=modalClsOwn(ja,gen); }
 let out='', cur=''; [...ja].forEach((ch,i)=>{ if(cls[i]!==cur){ if(cur) out+='</span>'; if(cls[i]) out+=`<span class="${cls[i]}">`; cur=cls[i]; } out+=esc(ch); }); if(cur) out+='</span>'; return qs(out); }

export function cmpPool(c){ const sn=N(c.subj)||{}; const kd=sn.animal?'animal':sn.thing?'thing':'person';
 const L=LEX.people.filter(p=>'p:'+p.id!==c.subj && (kd==='animal'? p.animal : kd==='thing'? p.thing : (!p.animal&&!p.thing)));
 return L.length? L : LEX.people.filter(p=>'p:'+p.id!==c.subj); }

export function isNegChunk(p){ return /\bnot\b|n't\b|\bnever\b/i.test(String(p.en||'')); }

export function relkPrompt(){ const m=APP.S.main; const h=APP.relTarget||'obj'; const hr=h==='subj'?(m.passive?m.obj:m.subj):m.obj; const n=hr&&N(hr); return n? 'その'+n.ja+'が？ その'+n.ja+'を？' : PROMPT.relk; }

// ---------- 選んだ直後：選択肢を消して、キャラの動きを見せる ----------
export let beatTimer;
export function beatMs(){ return {long:1500,mid:700,off:0}[SET().beat||'mid']||0; }
export function startBeat(){ const ms=beatMs(); clearTimeout(beatTimer); if(!ms || APP.finished || APP.view!=='play'){ APP.beat=false; return; } APP.beat=true; beatTimer=setTimeout(endBeat, ms); }
export function endBeat(){ clearTimeout(beatTimer); beatTimer=null; if(!APP.beat) return; APP.beat=false; $('#canvas').classList.remove('beat'); renderScene(); }

// ---------- 最初に「言う・きく」を分ける ----------
export function startAreas(){ const L=[{x0:0,x1:.32,k:'sti',label:'I …',ja:'🙋 人が',pos:'noun',main:1},{x0:.32,x1:.64,k:'stit',label:'It …',ja:'📦 物が',pos:'adj',main:1},{x0:.64,x1:LV()>=3?.82:1,k:'say',label:'ほか',ja:'人・物を選ぶ',pos:'verb'}]; if(LV()>=3) L.push({x0:.82,x1:1,k:'ask',label:'？',ja:'疑問詞',pos:'wh'}); return L; }
export function startStage(){ const m=APP.S.main; return APP.active==='main' && !APP.sayDone && !(isFree() && APP.entrySide) && !m.q && !m.subj && !m.pred && m.type==='normal' && !APP.finished; }
export function askStage(){ const m=APP.S.main; return LV()>=3 && APP.active==='main' && !APP.sayDone && !(isFree() && APP.entrySide) && !m.q && !m.subj && !m.pred && m.type==='normal' && !APP.finished; }
export function askYN(){ const m=APP.S.main; const go=(fn)=>{ APP.sayDone=true; APP.askOpen=false; mutate(()=>{ m.q={wh:null}; fn(); APP.tenseSet=true; },'sentence'); };
 const L=[['do','🙆','Do / Does …？','〜する？',()=>{ m.tense='pres'; m.modal=null; }],['did','⏪','Did …？','〜した？',()=>{ m.tense='past'; m.modal=null; }],['can','💪','Can …？','〜できる？',()=>{ m.tense='pres'; m.modal='can'; }],['will','⏩','Will …？','〜する？（これから）',()=>{ m.tense='fut'; m.modal=null; }]];
 if(LV()>=5) L.push(['have','🌏','Have … ever …？','〜したことある？',()=>{ m.tense='perf'; m.modal=null; m.freq='ever'; }]);
 L.push(['be','🌡️','Is / Are …？','〜なの？',()=>{ m.tense='pres'; m.modal=null; APP.qbe=true; }]);
 return L.map(x=>({id:'qy_'+x[0],e:x[1],en:x[2],ja:x[3],pos:'aux',act:()=>go(x[4])})); }
// 完成画面：吹き出し・時の表示の段を「文章カードの下」かつ「キャラの頭の少し上」に置く（重ならず、離れすぎず）
export function finBubbles(){ const sc=document.getElementById('scene'); if(!sc||!APP.finished) return; const els=sc.querySelectorAll('.byrow,.byrow2'); if(!els.length) return;
 const sr=sc.getBoundingClientRect(), cd=sc.querySelector('.fincard2'); const cb=cd?cd.getBoundingClientRect().bottom-sr.top:0; let ht=1e9;
 sc.querySelectorAll('.nd.fig.chn:not(.small)').forEach(f=>{ const r=f.getBoundingClientRect(); if(r.height>30) ht=Math.min(ht,r.top-sr.top+10); }); if(ht>1e8) return;
 const Y=Math.max(ht-26,cb+24); els.forEach(e=>{ e.style.top=(e.classList.contains('byrow2')?Math.max(Y-34,cb+8):Y)+'px'; }); }


/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_play(){
APP = {rev:{},grp:{},view:'play',level:'3',S:{main:newClause()},active:'main',open:null,subjTab:'who',lsub:null,side:'self',sideAuto:true,page:{},hist:[],finished:false};
AC = ()=> APP.active==='main'? APP.S.main : (APP.S.main.subs[APP.active]? APP.S.main.subs[APP.active].c : APP.S.main);
LV = ()=>Math.max(1,Math.min(6,+(SET().slv||3)));
isFree = ()=>LV()>=6;
$ = s=>document.querySelector(s);
esc = s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
MAJOR_PRON = new Set(['p:i','p:you','p:he','p:she','p:we','p:they','p:it']);
EXIT_T = {when:'じゃあ、そのとき？',if:'じゃあ、そうしたら？',because:'それで、どうなった？',before:'その前に、何を？',after:'そのあとで、何を？',until:'それまで、どうする？',while:'その間に？',although:'それでも？'};
PAGE_SIDE = 5;
PAGE_WIDE = 8;
PROMPT = new Proxy({},{get:(_,k)=>typeof k==='string'?tx('prompt.'+k):undefined});
prevTexts = {};
PROF = {
 i:{hair:'short',hc:'#3b2a20',shirt:'#2d6be0'}, you:{hair:'spiky',hc:'#22243a',shirt:'#11936a'}, he:{hair:'short',hc:'#6b4a2e',shirt:'#e2870a'}, she:{hair:'long',hc:'#7a3b1c',shirt:'#d23a8c'},
 ken:{hair:'spiky',hc:'#1d1d1d',shirt:'#df3f35'}, mika:{hair:'long',hc:'#1d1d1d',shirt:'#7a4ad9'}, mom:{hair:'bun',hc:'#4a2c1a',shirt:'#c0569b'}, dad:{hair:'short',hc:'#333',shirt:'#3d5a80',acc:'mus'},
 grandma:{hair:'bun',hc:'#c9c9c9',shirt:'#8e7cc3',acc:'glasses'}, teacher:{hair:'short',hc:'#554433',shirt:'#566079',acc:'glasses'},
 boy:{hair:'short',hc:'#3b2a20',shirt:'#f2a23a',scale:.86}, girl:{hair:'long',hc:'#3b2a20',shirt:'#ec5ea9',scale:.86}, baby:{hair:'none',shirt:'#9fd3ff',scale:.62},
};
GROUP = {we:['i','you'],they:['he','she','boy'],friends:['mika','ken'],students:['boy','girl','boy']};
FACE_OF_STATE = {shy:'cute',brave:'strong',lonely:'sad',proud:'happy',surprised:'talk',scared:'sad',bored:'quiet',full:'happy',thirsty:'talk',free:'happy',smart:'cool',funny:'laugh',happy:'happy',sad:'sad',sleepy:'sleepy',hungry:'hungry',tired:'tired',angry:'angry',excited:'excited',busy:'busy',fine:'happy',sick:'sick',cold:'cold',hot:'hot',quiet:'quiet',kind:'kind',strong:'strong',tall:'tall',cute:'cute',cool:'cool',late:'late',ready:'happy'};
POSE_OF_VERB = {shout:'talk',climb:'up',fall:'sit',hide:'sit',arrive:'wave',grow:'up',win:'up',relax:'sit',hurry:'run',travel:'walk',shop:'walk',practice:'jump',bring:'hold',send:'reach',fix:'hold',drive:'hold',forget:'think',remember:'think',enjoy:'dance',answer:'talk',ask:'talk',invite:'wave',cut:'hold',feed:'reach',wear:'hold',plant:'hold',paint:'hold',build:'hold',sell:'reach',borrow:'reach',push:'reach',pull:'hold',protect:'hug',follow:'walk',check:'hold',eat:'mouth',drink:'mouth',read:'hold',write:'hold',draw:'hold',study:'hold',use:'hold',have:'hold',carry:'hold',cook:'hold',clean:'hold',wash:'hold',play:'dance',kick:'kick',throw:'throw',catch:'up',hug:'hug',talk:'talk',sing:'talk',call:'talk',say:'talk',meet:'wave',smile:'stand',laugh:'laugh',cry:'cry',wait:'stand',help:'reach',buy:'reach',make:'hold',open:'reach',close:'reach',find:'reach',take:'hold',ride:'walk',chase:'run',teach:'talk',visit:'walk',think:'think',know:'think',hope:'think',like:'stand',love:'hug',need:'reach',see:'stand',watch:'stand',look:'reach',listen:'stand',do:'hold',lose:'up',jump:'jump',stand:'up',wake:'up',work:'hold',rest:'sit'};
BGS = {
 park:{bg:'linear-gradient(#e4f4ff 0 60%,#c6e8b0 60%)',props:[['🌳',7,42,58],['🌳',93,46,48],['🌷',50,92,18]]},
 home:{bg:'linear-gradient(#fff3e3 0 64%,#e8cfa9 64%)',props:[['🛋️',50,72,44],['🖼️',50,18,28],['🪴',94,62,34]]},
 school:{bg:'linear-gradient(#e8f0ff 0 62%,#d6d8e0 62%)',props:[['🏫',50,32,58],['🎒',94,86,24]]},
 kitchen:{bg:'linear-gradient(#f4f7fb 0 62%,#dfe3ea 62%)',props:[['🍳',50,48,30],['🧊',94,46,46]]},
 room:{bg:'linear-gradient(#f3eefe 0 64%,#dcd2f0 64%)',props:[['🛏️',92,70,50],['🪟',50,22,34],['🧸',6,86,24]]},
 station:{bg:'linear-gradient(#eef1f6 0 62%,#c9ced8 62%)',props:[['🚉',50,30,50],['🚆',94,54,44]]},
 library:{bg:'linear-gradient(#fbf5ea 0 64%,#dcc9a8 64%)',props:[['📚',6,50,40],['📚',94,50,40],['🕯️',50,18,20]]},
 beach:{bg:'linear-gradient(#dff4ff 0 46%,#7cc6e8 46% 62%,#f6e2b3 62%)',props:[['🏖️',94,76,40],['🐚',50,90,18],['☀️',50,12,30]]},
 forest:{bg:'linear-gradient(#e6f5e8 0 62%,#9fcf93 62%)',props:[['🌲',6,42,58],['🌲',94,42,58],['🍄',50,88,18],['🌲',50,26,34]]},
 river:{bg:'linear-gradient(#e6f5ff 0 56%,#8fd0ee 56% 72%,#bfe3a6 72%)',props:[['🏞️',50,28,40],['🐟',50,64,18]]},
 zoo:{bg:'linear-gradient(#fff8e0 0 62%,#d8e9a0 62%)',props:[['🦁',94,58,40],['🦒',50,36,50]]},
 cafe:{bg:'linear-gradient(#fbf1e6 0 64%,#caa98a 64%)',props:[['☕',50,62,28],['🪴',94,40,30]]},
 city:{bg:'linear-gradient(#eaf0ff 0 64%,#c7ccd8 64%)',props:[['🗼',50,30,58],['🏙️',94,40,44]]},
};
SKY = {morning:'rgba(255,186,120,.24)',evening:'rgba(255,120,80,.24)',night:'rgba(22,30,86,.38)',day:'rgba(0,0,0,0)'};
TOFF = {past:-9,pastprog:-9,perf:-4,perfprog:-4,pres:0,prog:0,fut:9};
sceneNodes = {};
GDEF = {
 all:['👥','みんな'], possp:['🫵','〜のもの'], phrasal:['🎡','＋ことばで意味が変わる'], fam:['👨‍👩‍👧','家族・名前'], around:['🏫','まわりの人'], mine:['⭐','マイことば'],
 move:['🏃','体を動かす'], life:['🛋️','休む・生活'], feel:['😂','気持ち・声'], go:['➡️','行く・来る'], food:['🍴','食べる・作る'], learn:['📚','読む・書く・学ぶ'], play:['⚽','遊ぶ・スポーツ'], person:['🤝','人にする'], thing:['✋','物をあつかう'], sense:['👀','見る・聞く'], mind:['💭','好き・思う'],
 sfeel:['😊','気持ち'], sbody:['🥱','体の感じ'], slook:['🌟','ようす'],
 tfood:['🍎','食べ物'], tdrink:['🥤','飲み物'], tread:['📚','本・書く物'], tplay:['⚽','スポーツ・遊び'], tmusic:['🎵','音楽'], tstudy:['✏️','勉強'], tthing:['🎒','身の回りの物'], tpeople:['🧑','人'], tanimal:['🐾','動物'], ofq:['🔢','〜のうち（of）'], tof:['🔗','〜の（of）'], sof:['🔗','〜の（of）'],
 pnear:['🏠','身近な所'], pout:['🌳','外・自然'], ptown:['🏙️','街'], ploc:['📍','〜の上・下・横'],
 tipast:['⏪','前のこと'], tinow:['🔴','今・今日'], tifut:['⏩','これから'], tihab:['🔁','いつも'], tilen:['⏳','長さ・ずっと'],
};
VGRP = {shout:'feel',fall:'move',hide:'move',arrive:'go',grow:'life',win:'play',relax:'life',hurry:'move',travel:'go',shop:'go',climb:'move',practice:'play',bring:'thing',send:'person',fix:'thing',drive:'play',forget:'mind',remember:'mind',enjoy:'mind',answer:'person',ask:'person',invite:'person',cut:'food',feed:'person',wear:'thing',plant:'thing',paint:'learn',build:'thing',sell:'thing',borrow:'thing',push:'thing',pull:'thing',protect:'person',follow:'person',check:'learn',run:'move',walk:'move',swim:'move',dance:'move',jump:'move',fly:'move',sleep:'life',sit:'life',stand:'life',wake:'life',rest:'life',work:'life',laugh:'feel',cry:'feel',smile:'feel',talk:'feel',sing:'feel',go:'go',come:'go',eat:'food',drink:'food',cook:'food',make:'food',read:'learn',write:'learn',draw:'learn',study:'learn',teach:'learn',do:'learn',play:'play',kick:'play',throw:'play',catch:'play',ride:'play',chase:'play',help:'person',call:'person',meet:'person',hug:'person',visit:'person',wait:'person',open:'thing',close:'thing',wash:'thing',use:'thing',find:'thing',lose:'thing',carry:'thing',take:'thing',have:'thing',need:'thing',clean:'thing',buy:'thing',look:'sense',watch:'sense',see:'sense',listen:'sense',like:'mind',love:'mind',think:'mind',know:'mind',hope:'mind',say:'mind'};
SGRP = {shy:'sfeel',lonely:'sfeel',proud:'sfeel',surprised:'sfeel',scared:'sfeel',bored:'sfeel',full:'sbody',thirsty:'sbody',happy:'sfeel',sad:'sfeel',angry:'sfeel',excited:'sfeel',sleepy:'sbody',hungry:'sbody',tired:'sbody',sick:'sbody',cold:'sbody',hot:'sbody',fine:'sbody'};
PGRP = {ken:'fam',mika:'fam',mom:'fam',dad:'fam',grandma:'fam',we:'all',they:'all',friends:'all',students:'all',teacher:'around',boy:'around',girl:'around',baby:'around'};
PLGRP = {park:'pout',beach:'pout',forest:'pout',river:'pout',zoo:'pout',station:'ptown',library:'ptown',cafe:'ptown',tokyo:'ptown'};
ANIMAL_V = new Set(['run','walk','sleep','swim','jump','sit','stand','wake','rest','fly','go','come','eat','drink','play','chase','catch','hide','fall','follow','look','watch','see','listen','like','love','wait','climb','grow','win','relax','hurry','find','lose','carry','bring','need','have','protect','dance','sing','cry','hug']);
IT_V = new Set(['fall','fly','work','grow','come','go','arrive','win','lose']);
IT_S = new Set(['hot','cold','cute','cool','funny','ready','late','quiet','strong','free','full','busy','fine']);
NOSELF_LK = ['look','seem','sound'];
IT_WEATHER = true;
MANNER_OK = {
 fast:['run','walk','swim','go','come','drive','ride','hurry','dance','eat','talk','write','read','fly','climb','chase','carry','cook','clean','kick','throw'],
 slowly:['run','walk','swim','go','come','drive','ride','dance','eat','drink','talk','read','write','climb','carry','sing','move','wake','stand','sit'],
 quietly:['walk','sleep','read','write','draw','study','eat','drink','talk','sing','sit','listen','cry','laugh','work','cook','open','close','wait','come','go','play','rest','hide'],
 loudly:['sing','talk','laugh','cry','shout','call','say','play','answer','ask'],
 happily:['play','dance','sing','walk','run','talk','eat','drink','swim','cook','draw','read','smile','laugh','work','study','practice','travel','shop','relax','listen','watch','meet','help'],
 carefully:['write','draw','read','cut','cook','drive','clean','wash','open','close','carry','fix','check','paint','build','listen','look','watch','climb','walk','ride','plant','feed','use','answer'],
 well:['sing','dance','swim','play','draw','cook','write','read','study','practice','teach','sleep','run','ride','drive','paint','build','kick','throw','catch','answer','fix'],
 hard:['work','study','practice','run','cry','laugh','try','train','push','pull','kick','throw'],
 a_lot:['eat','drink','talk','study','laugh','cry','sleep','read','walk','play','practice','travel','shop','sing','work','help','buy','cook','run','swim'],
 again:null,
};
WITH_NO = new Set(['like','love','have','need','see','know','think','hope','remember','wear','forget','lose','grow','fall','win']);
FREQ_LIST = {
 100:'go come get make take see know think look give eat like have say tell play do find work help run walk love need use buy read write watch talk sleep call meet start sit stand wake listen study put turn bring leave drink swim cook sing wait show ask '+
  'water milk book tv phone apple bread cake music english ball bag homework car room door name letter movie games coffee tea lunch pizza soccer picture photo flowers key hat shoes shirt house bus train computer bike story song email tree '+
  'happy sad tired hungry busy fine hot cold sleepy kind cute cool late ready r_teacher r_student r_doctor r_friend '+
  'home school park here there now today yesterday tomorrow everyday lastnight tonight morning nextweek lastweek fast slowly well a_lot again hard',
 60:'dance laugh cry jump rest fly smile draw clean wash close carry catch throw kick ride teach visit send lose forget remember enjoy answer cut wear break pick return continue hope win fall hurry travel shop arrive choose fix sell build drive practice '+
  'banana juice sandwich ramen curry onigiri cookie egg soup comic news tennis baseball basketball piano guitar cards radio math umbrella camera window box dishes present pen notebook toy map jacket party trip light secret truth joke word stars meeting invitation '+
  'angry excited sick quiet strong tall scared bored full thirsty free smart funny lonely surprised shy beautiful young popular healthy rich famous r_nurse r_singer r_player r_cook r_artist r_police r_pilot r_scientist r_hero r_dancer r_farmer '+
  'mom dad friends teacher ken mika kitchen myroom station library beach cafe thismorning soon sometimes night everymorning sundays already justnow quietly loudly happily carefully',
 35:'hug chase climb hide grow relax plant paint borrow push pull protect follow check invite feed lend pass shout exercise enter appear discover quit hang escape '+
  'sandcastle snowman mountain butterfly frog fire noise offer cold shock brave proud boy girl baby students grandma dog cat forest river zoo tokyo seven twohours since allday ago theday r_genius',
 20:'postpone refuse recover bird robot rabbit horse r_youtuber r_pirateking awesome chillA hangout chill grab text',
 10:'mine yours hisp hers ours theirs'
};
FREQ = {can:100,want:100,will:100,haveto:100,goingto:100,should:100,might:60,prob:60,wouldlike:60,usedto:60,hadbetter:60,supposedto:35,aboutto:35,havegotto:35,happento:35,getto:35,affordto:35,mightaswell:20,caus_make:60,caus_let:60,caus_have:35,caus_help:60,caus_want:60,caus_ask:60,caus_tell:60};
Object.entries(FREQ_LIST).forEach(([w,s])=>s.split(' ').filter(Boolean).forEach(id=>{ if(FREQ[id]==null) FREQ[id]=+w; }));
T3 = new Set(Object.keys(FREQ).filter(k=>FREQ[k]<=20));
sideTimer = null;
PROG = ['prog','pastprog','perfprog'];
SAMPLE = null;
TR_NEED = 3;
DBX = null;
UID = null;
QR_KINDS = [['people','人・動物'],['things','物・こと'],['verbs','動き（〜する）'],['states','様子（形容詞・職業）'],['manners','どんなふうに'],['places','場所'],['times','いつ']];
QR_TAGS = [['food','食べ物'],['drink','飲み物'],['read','読む物'],['thing','持ち物・道具'],['sport','スポーツ'],['game','ゲーム'],['music','音楽'],['lang','教科・言語'],['watch','見る物'],['ride','乗り物'],['event','行事・予定']];
idleTimer = null;
promptKey = '';
finTimer = null;
TLX = {p:20,c:50,f:80};
TLPOS = {pastperf:[14,1],past:[20,1],pastperfprog:[26,1],pastprog:[32,1],perf:[38,1],perfprog:[44,1],pres:[50,1],prog:[57.5,1],futperf:[65,1],futperfprog:[72.5,1],fut:[80,1],futprog:[87.5,1]};
TLROWS = {};
beatTimer = null;
}

/* ほかのファイルが中身を差しかえるとき用 */
export function set_searchResults(v) { return searchResults = v; }
export function set_optList(v) { return optList = v; }
export function set_catDef(v) { return catDef = v; }
export function set_render(v) { return render = v; }
export function set_openFinish(v) { return openFinish = v; }
export function set_mutate(v) { return mutate = v; }
export function set_renderIdle(v) { return renderIdle = v; }
export function set_poseFace(v) { return poseFace = v; }
export function set_go(v) { return go = v; }
export function set_openSearch(v) { return openSearch = v; }
export function set_searchPool(v) { return searchPool = v; }
export function set_pick(v) { return pick = v; }
export function set_renderScene(v) { return renderScene = v; }
