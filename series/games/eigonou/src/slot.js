import { set_renderScene, set_render } from './play.js';
import { DB, SET, save, say, toast } from './common.js';
import { CJ, FRONTS, FRP, FRT, LEADF, LEX, MD, MN, MODALS, N, P, PL, ST, T, TM, V, agrOf, allowedModals, cap, genClause, needsObj, newClause, nounTags, predS, predV, sentenceComplete, sentenceJa, sentenceParts, sentenceText, setModal } from './engine.js';
import { ENV, onDoc, onTick } from './env.js';
import { IRRPL, cntForm, objRankRefs } from './objrank.js';
import { APP, LV, finModal, finSubj, finToggle, go, normalize, objFits, openFinish, passOk, pick, render, renderScene, resetAll, snapshot, stateFitsSubj, verbFitsSubj } from './play.js';
import { qbPick, qbRes } from './qbar.js';
import { FRAME_IDS, reelCands, reelFits, reelFix, reelLabel, reelSet } from './reel.js';
import { FREQADV } from './vocab_a1.js';
// 試作7 表（形容詞の並び・限定詞など）
export let SL_DET;
export let SL_CATNAME;
export let SL_ADJ;
export let SL_ADJ_TAG;
export let SL_VPRE;
export let SL_VPOST;
export let SL_NPOST;
export let SL_LEAD;
export let SL_TAIL;
// ===== 試作7（作り直し）：骨組みタブ式の組み立て =====
// エンジンの状態(APP.S.main)が唯一の正解。タブは「見せ方」だけ。選んだものは reelSet などで直接エンジンに入れる。
// 完成（またはランダム）で、いつもの最終画面（絵＋英日カード＋最後のバー）へ。
 // 動詞を選んでも目的語・形容詞を勝手に入れない
export let SB;
export let SB_PRON;
export function sbEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
export function sbM(){ return APP.S.main; }
export function sbNP0(){ return {det:'auto',adj:[],noun:'',post:null}; }
export function sbRole(){ const m=sbM(); return m.pred&&m.pred.k==='s'?'C':'O'; }
export function sbNPd(r){ if(!SB.np[r]) SB.np[r]=sbNP0(); return SB.np[r]; }
export function sbBare(ref){ try{ return String(N(ref).en).replace(/^(a|an|the)\s+/i,''); }catch(e){ return ''; } }
export function sbIsPron(w){ return /^(i|me|you|he|him|she|her|we|us|they|them|it|someone|something|anyone|anything|everyone|everything|somebody|nobody)$/i.test(String(w||'')); }
export function sbIsName(w){ return /^[A-Z][a-z]+$/.test(w||'')&&w!=='I'; }
export function sbEntry(w){ w=String(w||'').toLowerCase().trim(); if(!w||typeof LEX==='undefined') return null; const key=x=>String(x.en||'').replace(/^(a|an|the)\s+/i,'').toLowerCase();
 let e=(LEX.people||[]).find(x=>key(x)===w); if(e) return {k:'p',e}; e=(LEX.things||[]).find(x=>key(x)===w); if(e) return {k:'t',e}; return null; }
export function sbTags(noun){ const x=sbEntry(noun); if(!x) return ['generic']; if(x.k==='p') return [x.e.animal?'animal':x.e.pron?'generic':'person']; const t=x.e.t||[]; const o=[]; ['food','drink','read','event'].forEach(k=>{ if(t.includes(k)) o.push(k); }); if(!o.length) o.push('thing'); return o; }
export function sbAdjFor(noun){ const set=[]; sbTags(noun).forEach(t=>(SL_ADJ_TAG[t]||[]).forEach(a=>{ if(!set.includes(a)) set.push(a); })); SL_ADJ_TAG.generic.forEach(a=>{ if(set.length<14&&!set.includes(a)) set.push(a); }); return set; }
export function sbAdjRank(a){ const r=SL_ADJ[String(a).toLowerCase()]; return r?r[1]:1; }
export function sbAdjSort(l){ return l.map((a,i)=>[a,i]).sort((x,y)=>sbAdjRank(x[0])-sbAdjRank(y[0])||x[1]-y[1]).map(x=>x[0]); }
export function sbPlural(n){ const w=String(n); if(typeof IRRPL!=='undefined'&&IRRPL[w.toLowerCase()]) return IRRPL[w.toLowerCase()]; if(/(s|x|z|ch|sh)$/i.test(w)) return w+'es'; if(/[^aeiou]y$/i.test(w)) return w.slice(0,-1)+'ies'; const irr={man:'men',woman:'women',child:'children',foot:'feet',tooth:'teeth',mouse:'mice',person:'people'}; return irr[w.toLowerCase()]||w+'s'; }
export function sbAutoDet(role,noun){ if(!noun||sbIsPron(noun)||sbIsName(noun)) return ''; const x=sbEntry(noun);
 if(!x){ if(/^(water|tea|milk|rice|bread|coffee|juice|money|time|music|soccer|baseball|tennis|english|japanese|[a-z]+s)$/i.test(noun)) return ''; return role==='S'?'the':'a'; }
 const en=String(x.e.en||''); const mm=en.match(/^(a|an|the)\s+/i); if(!mm) return ''; if(role==='S') return 'the'; if(role==='C') return 'a'; return mm[1].toLowerCase()==='an'?'a':mm[1].toLowerCase(); }
export function sbCount(noun){ if(!noun||sbIsPron(noun)||sbIsName(noun)) return ''; const x=sbEntry(noun);
 if(!x){ const w=String(noun); if(typeof cntForm==='function'){ const cf=cntForm(w.toLowerCase()); if(cf) return cf.cnt; } if(/^(water|tea|milk|rice|bread|coffee|juice|money|time|music|soccer|baseball|tennis|english|japanese|cake|sugar|salt|butter|meat|fish|snow|rain|homework|information|advice)$/i.test(w)) return 'u'; return /s$/i.test(w)?'p':'c'; }
 if(x.k==='p') return 'c'; if(x.e&&x.e.cnt) return x.e.cnt; if(x.e&&x.e.pl) return 'p'; const en=String(x.e.en||'').trim(); if(/^(a|an|the)\s+/i.test(en)) return 'c'; return /s$/i.test(en)?'p':'u'; }
export let SB_PLN;
export function sbDetOk(d,noun){ d=String(d||''); if(!d||d==='auto'||!noun) return true; const c=sbCount(noun); if(!c) return true;
 if(/^(many|a few|several|both)$/.test(d)) return c!=='u'; if(/^(much|a little)$/.test(d)) return c==='u'; if(/^(every|each)$/.test(d)) return c==='c'; return true; }
export function sbDetWhy(d,noun){ d=String(d||''); const c=sbCount(noun); if(/^(many|a few|several|both)$/.test(d)) return d+' は数えられる名詞だけ'+(noun?'（'+noun+' は数えられない）':''); if(/^(much|a little)$/.test(d)) return d+' は数えられない名詞だけ'+(noun?'（'+noun+' は数えられる）':''); if(/^(every|each)$/.test(d)) return d+' は数えられる名詞のひとつだけ'+(noun?'（'+noun+' には使えない）':''); return ''; }
export function sbDetEff(role,np){ return np.det==='auto'? sbAutoDet(role,np.noun) : np.det; }
export function sbText(role,np){ let n=np.noun; if(!n) return ''; if(sbIsPron(n)||sbIsName(n)) return n; let d=sbDetEff(role,np); if(role==='C'&&d==='a'){ let pl=false; try{ pl=!!agrOf(sbM().subj).pl; }catch(e){} if(pl){ d=''; if(!/s$/i.test(n)) n=sbPlural(n); } } if(SB_PLN.test(d)&&sbCount(n)==='c') n=sbPlural(n); return [d].concat(sbAdjSort(np.adj),[n]).filter(Boolean).join(' '); }
// 仮の空の文を作って、打鍵の道で「冠詞＋形容詞＋名詞」を読ませ、参照(ref)だけ取り出す
export function sbPickOpt(text){ const L=qbRes(text).filter(x=>!/^fr_/.test(x.id)); const t=String(text).toLowerCase().trim(); return L.find(x=>/^fwda_/.test(x.id)&&String(x.en).toLowerCase().trim()===t)||L.find(x=>String(x.en).toLowerCase().trim()===t)||L.find(x=>/^fwda_/.test(x.id))||L[0]; }
export function sbFeed(text){ const w=String(text).trim().split(/\s+/);
 if(w.length===2&&/^(these|those|this|that|my|your|his|her|our|their)$/i.test(w[0])){ const d=qbRes(w[0]).find(x=>/^fwdet_/.test(x.id)); if(d){ qbPick(d,true); const L=qbRes(w[1]).filter(x=>!/^fr_/.test(x.id)); if(L[0]){ qbPick(L[0],true); return true; } } }
 const o=sbPickOpt(text); if(o){ qbPick(o,true); return true; } return false; }
export function sbRef(role,text){ const old=APP.S.main; let ref=null; SB.busy=true; window.SB_ANYOBJ=true;
 try{ const tmp=newClause(); APP.S.main=tmp;
  if(role==='S'){ if(sbFeed(text)) ref=APP.S.main.subj; }
  else if(role==='O'){ const pv=(old.pred&&old.pred.k==='v')?old.pred.id:null; const vs=[pv,'see','eat','do','read','play'].filter((x,i,a)=>x&&a.indexOf(x)===i); for(const vid of vs){ try{ const t2=newClause(); APP.S.main=t2; reelSet('subj',t2,'p:i'); reelSet('verb',t2,vid); if(sbFeed(text)&&APP.S.main.obj){ ref=APP.S.main.obj; break; } }catch(e){} } }
  else { reelSet('subj',tmp,'p:he'); const bl=qbRes('is'); const b=bl.find(x=>x.en==='is'&&/^fw_is_/.test(x.id)&&!/ing/.test(x.id))||bl.find(x=>x.id==='qb_be'); if(b){ qbPick(b,true); if(sbFeed(text)){ const p=APP.S.main.pred; if(p&&p.k==='s') ref=p; } } }
 }catch(e){ ref=null; } finally{ APP.S.main=old; SB.busy=false; window.SB_ANYOBJ=false; }
 return ref; }
export function sbApply(role){ const np=sbNPd(role); const m=sbM(); if(!np.noun) return true; const txt=sbText(role,np); const ref=sbRef(role,txt);
 if(!ref){ toast('「'+txt+'」は読めませんでした（辞書にない語は「ことば登録」から）'); return false; }
 APP.hist.push(snapshot());
 if(role==='S') reelSet('subj',m,ref); else if(role==='O'){ m.obj=ref; m.useObj=true; m.freeObj=true; reelFix(m); } else { m.pred=ref; reelFix(m); }
 if(np.post){ const k=role==='S'?'spm':'opm'; if(role!=='C') m[k]={en:np.post.en,ja:np.post.ja}; }
 try{ sbSyncC(); normalize(); }catch(e){} return true; }
export function sbSyncC(){ const m=sbM(), np=SB.np.C; if(np&&np.noun&&m.pred&&m.pred.k==='s'&&(ST(m.pred.id)||{}).noun){ const ref=sbRef('C',sbText('C',np)); if(ref) m.pred=ref; } }
export let SB_REFL;
export function sbReflSync(m){ try{ const so=String(m.subj||'').replace(/^p:/,''); let ob=String(m.obj||''); if(!m.useObj||!/^p:/.test(ob)) return; ob=ob.slice(2);
 const inv=Object.keys(SB_REFL).find(k=>SB_REFL[k]===ob);
 if(inv){ if(so!==inv&&P(inv)) m.obj='p:'+inv; } else if(SB_REFL[ob]&&so===ob&&ob!=='you'&&P(SB_REFL[ob])) m.obj='p:'+SB_REFL[ob]; }catch(e){} }
export function sbOpen(hold){ window.SB_NOLOG=true; SB.hold=false; SB.logged=null; try{ openFinish(); }finally{ window.SB_NOLOG=false; } }
export function sbDo(fn){ APP.hist.push(snapshot()); try{ fn(); sbSyncC(); sbReflSync(sbM()); }catch(e){} try{ normalize(); }catch(e){} try{ render(); }catch(e){} sbDraw(); }
// ---- 骨組みの表示（エンジンの文の部品を役割ごとにまとめる） ----
export function sbGroups(){ let ps=[]; try{ ps=sentenceParts(APP.S).filter(p=>p.en&&!p.subStart&&!p.subEnd); }catch(e){} if(SB.beDef) ps=ps.filter(p=>!/\.state$/.test(String(p.key||'')));
 const g={L:[],S:[],V:[],O:[],T:[]};
 ps.forEach(p=>{ const k=String(p.key||''); let r;
  if(!/^m\./.test(k)&&k) r=/^part/.test(k)?'L':(/^conj/.test(k)&&APP.S.main.subs.conj&&APP.S.main.subs.conj.front)?'L':'T'; else if(/\.subj$/.test(k)) r='S'; else if(/\.(verb|aux|neg|freq|manner)$/.test(k)) r='V'; else if(/\.(iobj|obj|state)$/.test(k)) r='O'; else if(p.front||/\.lead$/.test(k)) r='L'; else r='T';
  if(r==='T'&&/\.(freq|manner)$/.test(k)) r='V'; g[r].push(p); });
 return g; }
export function sbCurNP(role){ // いまのエンジンの文から名詞の組み立てを読む（自分で作った分があればそれを優先）
 const np=sbNPd(role); if(np.noun) return np; const m=sbM(); let ref=role==='S'?m.subj:role==='O'?m.obj:null; if(role==='C'&&m.pred&&m.pred.k==='s'&&(ST(m.pred.id)||{}).noun){ np.noun=sbBare('s:'+m.pred.id); }
 else if(ref){ const w=sbBare(ref).split(' '); if(w.length===1) np.noun=w[0]; }
 return np; }
export function sbChip(b,small,on,fn,cls){ SB.acts.push(fn); return '<span class="mbstop slm '+(on?'on ':'')+(cls||'')+'" data-a="'+(SB.acts.length-1)+'"><b>'+sbEsc(b)+'</b>'+(small?'<small>'+sbEsc(small)+'</small>':'')+'</span>'; }
// ---- 品詞の色づけ（文法ボタンで出す）・熟語 ----
export let SB_POSN;
export function sbWordsHtml(p,role,np,idm){ const k=String(p.key||''); const w=String(p.en).split(' ').filter(Boolean);
 const cls=(w1)=>{ const l=w1.toLowerCase().replace(/[,.]/g,'');
  if(idm) return 'idm';
  if(/\.(freq|manner)$/.test(k)) return 'adv'; if(/\.verb$/.test(k)) return 'verb'; if(/\.(aux|neg)$/.test(k)) return /\.neg$/.test(k)?'adv':'aux';
  if(/\.(time|place|lead)$/.test(k)||p.front) return 'adv';
  if(np&&np.noun){ if(sbIsPron(l)) return 'pron'; const d=sbDetEff(role,np)||''; if(d&&l===d.toLowerCase()) return 'det'; if(np.adj.map(a=>a.toLowerCase()).includes(l)) return 'adj'; if(np.post&&String(np.post.en).toLowerCase().split(' ').includes(l)&&l!==np.noun.toLowerCase()) return 'post'; return 'noun'; }
  if(/\.state$/.test(k)) return ((ST(sbM().pred&&sbM().pred.id)||{}).noun)?'noun':'adj';
  if(sbIsPron(l)) return 'pron'; return 'noun'; };
 return w.map(x=>{ const c=cls(x); return '<span class="gw g-'+(c==='pron'?'noun':c)+'">'+sbEsc(x)+'<small>'+SB_POSN[c]+'</small></span>'; }).join(' '); }
export function sbIdiom(r){ const m=sbM(); try{ if(r==='V'){ const v=predV(m); return !!(v&&(v.tail||v.prep)); } if(r==='L'){ const f=m.lead&&LEADF(m.lead); return !!(f&&/ /.test(f.en.trim())); } }catch(e){} return false; }
export function sbPosOf(t){ const m=sbM(); if(t==='V') return 'pos-verb'; if(t==='O') return (m.pred&&m.pred.k==='s'&&!(ST(m.pred.id)||{}).noun)?'pos-adj':'pos-noun'; if(t==='done') return 'pos-adv'; if(t==='S'||t==='L') return t==='S'?'pos-noun':'pos-adv'; return 'pos-adv'; }
export function sbSkelDone(){ try{ return sbNextTab()===null&&sentenceComplete(APP.S)&&!SB.beDef; }catch(e){ return false; } }
export function sbNextTab(){ const m=sbM(); if(!m.subj) return 'S'; if(!m.pred) return 'V'; if((predV(m)&&needsObj(m)&&!(m.useObj&&m.obj))||(m.pred.k==='s'&&SB.beDef)) return 'O'; return null; }
export function sbEars(r){ if(SB.lv<2||SB.earOff[r]) return false; const m=sbM(); if(r==='V') return !!m.pred; if(r!=='S'&&r!=='O') return false;
 const role=sbRoleOf(r); if(role==='C'){ if(!(m.pred&&m.pred.k==='s'&&(ST(m.pred.id)||{}).noun)) return false; } else if(!(r==='S'?m.subj:(m.useObj&&m.obj))) return false;
 const np=sbCurNP(role); return !!np.noun&&!sbIsPron(np.noun)&&!sbIsName(np.noun); }
export function sbPill(r,g){ const m=sbM(); const arr=g[r]; const on=SB.r===r; const hole={L:'＋前提',S:'誰が？',V:'どうする？',O:(m.pred&&m.pred.k==='s')?'どう？':'何を？',T:'＋文末'}[r];
 const cls=r==='V'?'pos-verb':(r==='L'||r==='T')?'pos-adv':(r==='O'&&m.pred&&m.pred.k==='s'&&!(ST(m.pred.id)||{}).noun)?'pos-adj':'pos-noun';
 const end=(r==='L'||r==='T')?' slend':''; const ntab=sbNextTab(); let nx=(ntab===r&&SB.r!==r)?' nxt':''; if(!nx&&(r==='L'||r==='T')&&SB.r!==r&&!arr.length&&sbSkelDone()&&!SB.earOff[r]) nx=' nxt altA';
 if(!arr.length) return '<button class="ck slp hole '+cls+(on?' cur':'')+nx+end+'" data-r="'+r+'"><span class="ja">'+hole+'</span></button>';
 const idm=sbIdiom(r); const role=r==='S'?'S':r==='O'?sbRole():null; const np=role?SB.np[role]:null;
 const en=SB.gram?arr.map(p=>sbWordsHtml(p,role,np,idm&&(r==='L'||/\.verb$/.test(String(p.key||''))))).join(' '):sbEsc(arr.map(p=>p.en).join(' ')); const ja=arr.map(p=>p.ja||'').join('');
 return '<button class="ck slp '+cls+(r==='S'?' subject':'')+(on?' cur':'')+nx+end+(SB.gram?' gram':'')+'" data-r="'+r+'">'+(idm?'<i class="idmb">熟語</i>':'')+(sbEars(r)?'<i class="ear l'+(SB.skDone?' altA':'')+'" data-e="'+r+':l">＋</i><i class="ear r'+(SB.skDone?' altA':'')+'" data-e="'+r+':r">＋</i>':'')+'<span class="en">'+en+'</span><span class="ja">'+sbEsc(ja||'　')+'</span></button>'; }
// ---- 候補（打った文字の頭が合うものを数個だけ） ----
export function sbFilt(list,q,n){ q=String(q||'').toLowerCase().trim(); if(!q) return []; return list.filter(x=>String(x[0]).toLowerCase().startsWith(q)).slice(0,n||5); }
export function sbNounAll(role,full){ const m=sbM(); let refs=[]; const cap=full?1e9:1;
 if(role==='S'){ const v=predV(m); LEX.people.filter(p=>!p.pron).forEach(p=>refs.push('p:'+p.id)); LEX.things.forEach(t=>{ const r='t:'+t.id; let ok=true; if(v){ try{ ok=verbFitsSubj(Object.assign({},m,{subj:r}),v); }catch(e){ ok=false; } } if(ok) refs.push(r); }); refs=refs.filter(r=>{ if(!v) return true; try{ return verbFitsSubj(Object.assign({},m,{subj:r}),v); }catch(e){ return false; } }); }
 else if(role==='O'){ const v=predV(m); const RK=(v&&typeof objRankRefs==='function'&&objRankRefs(v.id))||[]; RK.forEach(r=>{ if(r!==m.subj) refs.push(r); }); const rest=[]; LEX.things.forEach(t=>{ const r='t:'+t.id; if(['mine','yours','hisp','hers','ours','theirs'].includes(t.id)) return; rest.push(r); }); LEX.people.filter(p=>!p.thing&&!p.pron).forEach(p=>{ const r='p:'+p.id; if(r!==m.subj) rest.push(r); }); rest.filter(r=>v&&reelFits(()=>objFits(v,r))).forEach(r=>refs.push(r)); rest.forEach(r=>refs.push(r)); }
 else if(false){ const v=predV(m); LEX.things.forEach(t=>{ const r='t:'+t.id; if(['mine','yours','hisp','hers','ours','theirs'].includes(t.id)) return; if(!v||reelFits(()=>objFits(v,r))) refs.push(r); }); LEX.people.filter(p=>!p.thing&&!p.pron).forEach(p=>{ const r='p:'+p.id; if(r!==m.subj&&(!v||reelFits(()=>objFits(v,r)))) refs.push(r); }); }
 else refs=LEX.people.filter(p=>!p.pron&&!p.thing).map(p=>'p:'+p.id).concat(LEX.things.map(t=>'t:'+t.id));
 const seen=new Set(), out=[]; refs.forEach(r=>{ const b=sbBare(r); if(b&&!seen.has(b.toLowerCase())&&!/\s/.test(b.trim())){ seen.add(b.toLowerCase()); let ja=''; try{ ja=N(r).ja||''; }catch(e){} out.push([b,ja]); } }); return out; }
export function sbAdjAll(){ const seen=new Set(), out=[]; Object.keys(SL_ADJ).forEach(a=>{ seen.add(a); out.push([a,SL_ADJ[a][0]]); }); (LEX.states||[]).forEach(s=>{ const a=String(s.en).toLowerCase(); if(!s.noun&&!seen.has(a)&&!/\s/.test(a)){ seen.add(a); out.push([a,s.ja||'']); } }); return out; }
export function sbVerbList(m,q){ const seen=new Set(), out=[]; q=String(q||'').toLowerCase().trim();
 LEX.verbs.forEach(x=>{ if(x.hidden||x.caus||x.fr==='cl'||String(x.id).startsWith('__')) return; const key=x.en+(x.tail||'')+(x.prep||''); if(seen.has(key)) return; if(q&&!reelLabel('verb',x.id).toLowerCase().startsWith(q)) return; if(reelFits(()=>verbFitsSubj(m,x))){ seen.add(key); out.push([reelLabel('verb',x.id),x.ja||'',x.id]); } });
 return out; }
export function sbBeSetOld(){ SB.np.O=null; SB.np.C=null; sbDo(()=>{ const m=sbM(); const c=reelCands('state',Object.assign({},m,{subj:m.subj||'p:i',pred:{k:'s',id:(LEX.states.find(x=>!x.noun)||LEX.states[0]).id}})); reelSet('state',m,(c.find(x=>!(ST(x)||{}).noun))||c[0]); }); }
export let sbRnd;
// ---- 入力欄の仕様（部品ごと）：list(q)=候補, top()=入力前の定番, pick(entry), rand(), clr() ----
export let SB_FRAMES;
export let FRAME_SET;
export function sbSetFrame(id){ const m=sbM(); if(!m.pred){ SB.pend=id; SB.nxt=null; sbDraw(); return; } SB.pend=null; APP.hist.push(snapshot()); setModal(m,id); if(m.modal!==id) toast('この動きとは組めません'); try{ normalize(); render(); }catch(e){} SB.nxt=null; sbDraw(); }
export function sbAfterVerb(){ const m=sbM(); if(SB.pend){ const id=SB.pend; SB.pend=null; setModal(m,id); if(m.modal!==id) toast('この動きとは組めません'); } }
export function sbBeSet(){ SB.np.O=null; SB.np.C=null; SB.beDef=true; sbDo(()=>{ const m=sbM(); const c=reelCands('state',Object.assign({},m,{subj:m.subj||'p:i',pred:{k:'s',id:(LEX.states.find(x=>!x.noun)||LEX.states[0]).id}})); reelSet('state',m,(c.find(x=>!(ST(x)||{}).noun))||c[0]); sbAfterVerb(); }); SB.beDef=true; SB.nxt='O'; sbDraw(); }
export function sbPickVerb(e){ const kind=e[3]; if(kind==='f'){ sbSetFrame(e[2]); return; } if(kind==='b'){ sbBeSet(); return; }
 if(kind==='s'){ SB.beDef=false; SB.np.C=null; SB.nxt='T'; sbDo(()=>{ reelSet('state',sbM(),e[2]); sbAfterVerb(); }); return; }
 SB.nxt=null; sbDo(()=>{ reelSet('verb',sbM(),e[2]); sbAfterVerb(); const v=predV(sbM()); SB.nxt=(v&&needsObj(sbM()))?'O':(SB.lv>=3?'T':null); }); }
export function sbVerbCands(base,q){ q=String(q||'').toLowerCase().trim(); if(!q) return []; const hit=(lab)=>{ const l=lab.toLowerCase(); if(l.startsWith(q)) return 0; return l.split(/\s+/).some(w=>w.startsWith(q))?1:-1; };
 const all=[]; if(hit('be')>=0||/^(is|am|are)/.test(q)) all.push(['be','です／いる','__be','b',0]);
 sbVerbList(base,'').forEach(x=>{ const r=hit(x[0]); if(r>=0) all.push([x[0],x[1],x[2],'v',r]); });
 SB_FRAMES.forEach(id=>{ const en=(MD(id)||{}).en; if(!en) return; const r=hit(en); if(r>=0) all.push([en,(MD(id)||{}).ja||'',id,'f',r]); });
 (LEX.states||[]).forEach(x=>{ if(x.noun||!/ /.test(String(x.en))) return; const lab='be '+x.en; const r=hit(lab); if(r>=0) all.push([lab,x.ja||'',x.id,'s',r]); });
 const a=all.filter(x=>x[4]===0).slice(0,5), b=all.filter(x=>x[4]===1).slice(0,4); return a.concat(b); }
export function sbRandVerb(mode){ const m=sbM(); const base=Object.assign({},m,{subj:m.subj||'p:i'}); const L=sbVerbList(base,'');
 const stat=L.filter(x=>(V(x[2])||{}).stative), act=L.filter(x=>!(V(x[2])||{}).stative);
 const beRand=()=>{ const c=reelCands('state',Object.assign({},base,{pred:{k:'s',id:(LEX.states.find(x=>!x.noun)||LEX.states[0]).id}})).filter(id=>!(ST(id)||{}).noun); if(!c.length){ sbBeSet(); return; } sbPickVerb(['','',sbRnd(c),'s']); };
 if(mode==='state'){ SB.bd='be'; beRand(); return; }
 if(mode==='act'){ sbPickVerb(sbRnd(act.slice(0,200)).concat(['v'])); return; }
 const x=Math.random(); if(x<.15){ SB.pend=sbRnd(SB_FRAMES); sbPickVerb(sbRnd(act.slice(0,150)).concat(['v'])); } else if(x<.3) beRand(); else sbPickVerb(sbRnd(L.slice(0,300)).concat(['v'])); }
export function sbDoSet(){ const m=sbM(); SB.bd='do'; if(m.pred&&m.pred.k==='s'){ APP.hist.push(snapshot()); m.pred=null; m.obj=null; m.useObj=false; SB.beDef=false; SB.np.C=null; SB.np.O=null; try{ normalize(); render(); }catch(e){} } SB.r='V'; SB.sub=null; SB.nxt=null; sbDraw(); setTimeout(()=>{ const i=document.getElementById('slin'); if(i) i.focus(); },60); }
export function sbBdChips(){ const m=sbM(); const isBe=!!(m.pred&&m.pred.k==='s'); const isDo=!isBe&&(!!predV(m)||SB.bd==='do');
 return sbChip('be','です／いる',isBe,()=>{ SB.bd='be'; sbBeSet(); },'pow')+sbChip('do','する',isDo,()=>sbDoSet(),'pow'); }
export function sbVerbTop(){ const m=sbM();
 let h='<div class="slvtop">'+sbBdChips()+sbChip('🎲','状態',false,()=>sbRandVerb('state'),'rdc')+sbChip('慣用句 '+(SB.idm?'▲':'▼'),'want to…',!!SB.idm||!!(m.modal&&FRAME_SET.has(m.modal)),()=>{ SB.idm=!SB.idm; sbDraw(); },'idmbtn')+'</div>';
 if(SB.idm) h+='<div class="slchips slidm">'+SB_FRAMES.map(id=>{ const d=MD(id)||{}; return sbChip(d.en||id,d.ja||'',m.modal===id||SB.pend===id,()=>sbSetFrame(id),'idmc'); }).join('')+'</div>';
 return h; }
export function sbRoleOf(r){ return r==='S'?'S':r==='O'?sbRole():null; }
export function sbLeadG(){ const m=sbM(); const f=m.lead&&LEADF(m.lead); return f?String(f.g||''):''; }
export function sbFr(k,on){ const m=sbM(); let t=FRT(m), p=FRP(m); if(k==='time') t=!!on; else p=!!on; m.front=t&&p?'both':t?'time':p?'place':null; }
export function sbTimeLead(){ return /^(scene|freq)$/.test(sbLeadG()); }
export function sbTimeOwner(){ const m=sbM(); return m.time?(FRT(m)?'ltime':'time'):null; }
export function sbField(r,k){ const m=sbM(); const role=sbRoleOf(r); const np=role?sbCurNP(role):null; const F={k,raw:false};
 const redo=()=>{ if(np&&np.noun) sbApply(role); try{ render(); }catch(e){} SB.nxt=null; sbDraw(); };
 const base=Object.assign({},m,{subj:m.subj||'p:i'});
 const idEn=(arr,get)=>arr.map(get);
 if(k==='noun'){ F.main=true; F.raw=true; F.label=r==='S'?'主役（名詞を入力）':role==='C'?'どんな／だれ（入力）':'なにを（入力）'; F.ph=role==='C'?'例：happy / teacher':'例：boy / apple';
  F.all0=()=>{ const L=sbNounAll(role); return role==='C'?sbAdjAll().concat(L):L; }; const dk=()=>np.det&&np.det!=='auto'?np.det:''; F.all=()=>F.all0().filter(x=>sbDetOk(dk(),x[0])); F.list=q=>sbFilt(F.all(),q); F.top=()=>[]; F.why=q=>{ q=String(q||'').toLowerCase().trim(); if(!q||!dk()) return ''; const bad=F.all0().find(x=>String(x[0]).toLowerCase().startsWith(q)&&!sbDetOk(dk(),x[0])); return bad?(bad[0]+' には '+dk()+' は使えません（'+sbDetWhy(dk(),'').replace(/（.*/,'')+'）'):''; };
  F.pick=e=>{ const w=String(e[0]).trim(); if(!w) return; if(role==='C') SB.beDef=false;
   if(role==='C'){ const st=(LEX.states||[]).find(x=>!x.noun&&String(x.en).toLowerCase()===w.toLowerCase()); if(st){ SB.np.C=null; SB.nxt='T'; sbDo(()=>reelSet('state',sbM(),st.id)); return; } }
   if(role==='S'&&/^(i|you|he|she|we|they|it)$/i.test(w)){ SB.np.S=null; SB.nxt='V'; sbDo(()=>reelSet('subj',sbM(),'p:'+w.toLowerCase())); return; }
   if(!sbDetOk(dk(),w)){ toast(w+' には '+dk()+' は使えません'); return; } np.noun=w; if(sbIsPron(w)||sbIsName(w)){ np.adj=[]; np.det=''; } else if(np.det==='') np.det='auto';
   if(sbApply(role)){ SB.nxt=role==='S'?'V':'T'; try{ render(); }catch(e){} } sbDraw(); };
  F.rand=()=>{ const L=F.all().slice(0,role==='C'?60:50); F.pick(sbRnd(L)); }; F.clr=null; }
 else if(k==='det'){ F.label='限定詞（a / the / this …）'; F.ph='例：the'; F.all0=()=>SL_DET.filter(x=>x[0]).map(x=>[x[0],x[1]]); F.all=()=>F.all0().filter(x=>sbDetOk(x[0],np.noun)); F.list=q=>sbFilt(F.all(),q,6); F.why=q=>{ q=String(q||'').toLowerCase().trim(); if(!q) return ''; const bad=F.all0().find(x=>x[0].startsWith(q)&&!sbDetOk(x[0],np.noun)); return bad?sbDetWhy(bad[0],np.noun):''; }; F.top=()=>['the','a','this','that','my'].map(w=>F.all().find(x=>x[0]===w));
  F.pick=e=>{ np.det=e[0]; redo(); }; F.rand=()=>F.pick(sbRnd(F.all())); F.clr=['自動',()=>{ np.det='auto'; redo(); }]; }
 else if(k==='adj'){ F.label='形容詞（ならびは自動）'; F.ph='例：big'; F.raw=true; F.all=()=>sbAdjAll(); F.list=q=>sbFilt(F.all(),q,6); F.top=()=>sbAdjFor(np.noun).filter(a=>!np.adj.includes(a)).slice(0,5).map(a=>[a,(SL_ADJ[a]||[''])[0]]);
  F.pick=e=>{ const a=String(e[0]).toLowerCase(); if(!np.adj.includes(a)&&np.adj.length>=2){ toast('形容詞は2つまで（✕で消してから）'); return; } if(!np.adj.includes(a)) np.adj.push(a); if(np.noun&&!sbApply(role)){ np.adj=np.adj.filter(x=>x!==a); } try{ render(); }catch(e2){} sbDraw(); };
  F.rand=()=>{ if(np.adj.length>=2) np.adj.shift(); const L=sbAdjFor(np.noun).filter(a=>!np.adj.includes(a)).sort(()=>Math.random()-.5); for(const a of L){ np.adj.push(a); if(!np.noun||sbRef(role,sbText(role,np))){ if(np.noun) sbApply(role); try{ render(); }catch(e2){} sbDraw(); return; } np.adj.pop(); } }; F.clr=['ぜんぶ消す',()=>{ np.adj=[]; redo(); }]; }
 else if(k==='post'){ F.label='後ろから説明'; F.ph='例：in the room'; F.all=()=>SL_NPOST.map(x=>[x[0],x[1]]); F.list=q=>sbFilt(F.all(),q,6); F.top=()=>F.all().slice(0,5);
  const setp=(e)=>{ np.post=e?{en:e[0],ja:e[1]}:null; const kk=role==='S'?'spm':'opm'; APP.hist.push(snapshot()); sbM()[kk]=np.post?{en:np.post.en,ja:np.post.ja}:null; try{ normalize(); }catch(e2){} try{ render(); }catch(e2){} sbDraw(); };
  F.pick=setp; F.rand=()=>setp(sbRnd(F.all())); F.clr=['なし',()=>setp(null)]; }
 else if(k==='verb'){ F.main=true; F.label='動き（頭文字でも候補が出ます）'; F.ph='例：eat / f / want'; F.list=q=>sbVerbCands(base,q); F.top=()=>[];
  F.pick=e=>sbPickVerb(e); F.rand=()=>sbRandVerb('all'); F.clr=null; }
 else if(k==='frame'){ F.label='慣用句（want to など）'; F.ph='例：want'; F.all=()=>SB_FRAMES.map(id=>[MD(id).en,MD(id).ja||'',id,'f']).filter(x=>x[0]); F.list=q=>sbFilt(F.all(),q,6); F.top=()=>F.all().slice(0,6);
  F.pick=e=>sbSetFrame(e[2]); F.rand=()=>sbSetFrame(sbRnd(SB_FRAMES)); F.clr=['なし',()=>{ SB.pend=null; sbDo(()=>{ sbM().modal=null; }); }]; }
 else if(k==='pre'){ F.label='動詞の前（どのくらい）'; F.ph='例：always'; F.all=()=>sbLeadG()==='freq'?[]:(FREQADV||[]).map(f=>[f.en,f.ja,f.id]); F.list=q=>sbFilt(F.all(),q,6); F.top=()=>F.all().slice(0,5); F.block=()=>{ if(sbLeadG()!=='freq') return ''; const f=LEADF(sbM().lead); return '「ひんど」は つなぎ「'+(f?f.en:'')+'」で入っています'; };
  F.pick=e=>sbDo(()=>reelSet('freq',sbM(),e[2])); F.rand=()=>F.pick(sbRnd(F.all())); F.clr=['なし',()=>sbDo(()=>reelSet('freq',sbM(),null))]; }
 else if(k==='vpost'){ F.label='動詞の後（どうやって）'; F.ph='例：fast'; F.all=()=>reelCands('manner',base).filter(Boolean).map(id=>{ const x=MN(id); return [x.en,x.ja,id]; }); F.list=q=>sbFilt(F.all(),q,6); F.top=()=>F.all().slice(0,5);
  F.pick=e=>sbDo(()=>reelSet('manner',sbM(),e[2])); F.rand=()=>F.pick(sbRnd(F.all())); F.clr=['なし',()=>sbDo(()=>reelSet('manner',sbM(),null))]; }
 else if(k==='iobj'){ F.main=true; F.label='だれに（名前を入力）'; F.ph='例：Ken / mom'; const L=()=>(LEX.people||[]).filter(p=>!p.thing&&'p:'+p.id!==m.subj).map(p=>[p.obj||p.en,p.ja||'','p:'+p.id]); F.all=L; F.list=q=>sbFilt(L(),q,6); F.top=()=>L().slice(0,5); F.pick=e=>{ SB.sub=null; sbSetIobj(e[2]); }; F.rand=()=>F.pick(sbRnd(L())); F.clr=['なし',()=>{ SB.sub=null; sbSetIobj(null); }]; }
 else if(k==='lead'){ F.label='つなぎ・ひとこと'; F.ph='例：Maybe / In fact'; F.all0=()=>(FRONTS||[]).map(f=>[f.en,f.ja||'',f.id,f.g]); const bad=x=>(x[3]==='scene'&&m.time)||(x[3]==='freq'&&(m.time||m.freq)); F.all=()=>{ const seen={}; return F.all0().filter(x=>!bad(x)&&!seen[x[0]]&&(seen[x[0]]=1)); }; F.list=q=>sbFilt(F.all(),q,6); F.top=()=>F.all().slice(0,5); F.block=()=>{ const n=F.all0().filter(bad).length; return n?'いつ・ひんどを表すつなぎ（'+F.all0().filter(bad).slice(0,2).map(x=>x[0]).join('／')+'…）は、すでに「いつ」「ひんど」が入っているので出ません':''; };
  F.pick=e=>sbDo(()=>{ sbM().lead=e[2]; }); F.rand=()=>F.pick(sbRnd(F.all())); F.clr=['なし',()=>sbDo(()=>{ sbM().lead=null; })]; }
 else if(k==='ltime'||k==='time'){ const fr=k==='ltime'; F.label=fr?'いつ（文のはじめに）':'いつ'; F.ph='例：yesterday'; F.all=()=>{ if(sbTimeLead()) return []; const ow=sbTimeOwner(); if(ow&&ow!==k) return []; return reelCands('time',m).filter(Boolean).map(id=>{ const t=TM(id); return [t.en,t.ja,id]; }); }; F.list=q=>sbFilt(F.all(),q,6); F.top=()=>F.all().slice(0,5); F.block=()=>{ if(sbTimeLead()){ const f=LEADF(m.lead); return '「いつ」は つなぎ「'+(f?f.en:'')+'」で入っています（ふたつは入れられません）'; } const ow=sbTimeOwner(); if(ow&&ow!==k){ const t=TM(m.time); return '「いつ」は '+(ow==='ltime'?'前提':'文末')+'に「'+(t?t.en:'')+'」が入っています'; } return ''; };
  F.pick=e=>sbDo(()=>{ reelSet('time',sbM(),e[2]); sbFr('time',fr); }); F.rand=()=>F.pick(sbRnd(F.all())); F.clr=['なし',()=>sbDo(()=>{ reelSet('time',sbM(),null); sbFr('time',false); })]; }
 else if(k==='place'){ F.label='どこで'; F.ph='例：at home'; F.all=()=>reelCands('place',m).filter(Boolean).map(id=>{ const p=PL(id); return [p.en,p.ja,id]; }); F.list=q=>sbFilt(F.all(),q,6); F.top=()=>F.all().slice(0,5);
  F.pick=e=>sbDo(()=>{ reelSet('place',sbM(),e[2]); sbFr('place',false); }); F.rand=()=>F.pick(sbRnd(F.all())); F.clr=['なし',()=>sbDo(()=>{ reelSet('place',sbM(),null); })]; }
 return F; }
// ---- メイン単語の左右に展開（語順どおり） ----
export function sbCells(r){ const R=sbCells0(r); if(r!=='O'||!sbIsDt()) return R; const m=sbM(); let il=''; try{ il=m.iobj?String(N(m.iobj).en).replace(/^(a|an|the) /,''):''; }catch(e){}
 const base=R.cells.length?R.cells:[{k:'noun',t:'なにを',v:m.obj?sbBare(m.obj):'',cl:'main'}];
 return {cells:[{k:'iobj',t:'だれに',v:il,cl:''}].concat(base),main:(!m.iobj&&!m.obj)?'iobj':R.main}; }
export function sbCells0(r){ const m=sbM(), role=sbRoleOf(r); const out=[];
 if(role){ const np=sbCurNP(role); const common=np.noun&&!sbIsPron(np.noun)&&!sbIsName(np.noun);
  if(SB.lv<2||!common) return {cells:[],main:'noun'};
  const d=sbDetEff(role,np); const cell=(k,t,v,cl)=>({k,t,v:v||'',cl:cl||''});
  out.push(cell('det','限定詞',np.det==='auto'?d:np.det,np.det==='auto'?'auto':''),cell('adj','形容詞',sbAdjSort(np.adj).join(' ')),cell('noun','名詞',np.noun,'main'));
  if(role!=='C') out.push(cell('post','後置',np.post?np.post.en:'')); return {cells:out,main:'noun'}; }
 if(r==='V'){ if(SB.lv<2) return {cells:[],main:'verb'}; const fq=(FREQADV||[]).find(x=>x.id===m.freq), mn=m.manner&&MN(m.manner); let vv=''; try{ vv=m.pred?(m.pred.k==='v'?reelLabel('verb',m.pred.id):'be'):''; }catch(e){}
  const fid=m.modal&&FRAME_SET.has(m.modal)?m.modal:SB.pend; const fl=fid?((typeof MD==='function'&&MD(fid))||{}).en:'';
  const cs=[{k:'pre',t:'前',v:fq?fq.en:'',cl:''}]; if(fl) cs.push({k:'frame',t:'表現',v:fl,cl:'idmc'}); cs.push({k:'verb',t:'動詞',v:vv,cl:'main'},{k:'vpost',t:'後',v:mn?mn.en:'',cl:''}); return {cells:cs,main:'verb'}; }
 if(r==='L'){ const f=m.lead&&LEADF(m.lead), t=m.time&&FRT(m)&&TM(m.time); return {cells:[{k:'lead',t:'つなぎ',v:f?f.en:'',cl:''},{k:'ltime',t:'いつ',v:t?t.en:'',cl:''}],main:'lead'}; }
 if(r==='T'){ const p=m.place&&PL(m.place), t=m.time&&!FRT(m)&&TM(m.time); return {cells:[{k:'place',t:'どこで',v:p?p.en:'',cl:''},{k:'time',t:'いつ',v:t?t.en:'',cl:''}],main:'place'}; }
 return {cells:[],main:null}; }
export function sbSetIobj(ref){ SB.np.O=SB.np.O; sbDo(()=>{ const mm=sbM(); mm.iobj=ref||null; if(ref) mm.dts=mm.obj?'pp':'oo'; }); }
export function sbIsDt(){ const m=sbM(), v=predV(m); return !!(v&&v.dt&&sbRole()==='O'); }
export function sbIobjBar(){ const m=sbM(); const OBJ={i:'me',he:'him',she:'her',we:'us',they:'them'}; const cur=String(m.iobj||'').replace(/^p:/,'');
 let h='<div class="slbar"><div class="auxcap'+(m.iobj?'':' nudge')+'">だれに</div>';
 ['i','you','he','she','we','they'].forEach(id=>{ const ref='p:'+id; const ok=ref!==m.subj; h+=sbChip(OBJ[id]||N(ref).en,'',cur===id,ok?()=>{ SB.sub=null; sbSetIobj(cur===id?null:ref); }:()=>toast('主語と同じ人には使えません'),ok?'':'off'); });
 return h+'</div>'; }
export function sbPersonBar(r){ const m=sbM(); const objm=(r==='O'); const OBJ={i:'me',he:'him',she:'her',we:'us',they:'them'};
 let g,cur,lab; const v=predV(m), st=predS(m);
 if(objm){ g=['i','you','he','she','we','they','it']; cur=String(m.useObj&&m.obj||'').replace(/^p:/,''); { const inv=Object.keys(SB_REFL).find(k=>SB_REFL[k]===cur); if(inv) cur=inv; } lab='だれを'; }
 else { cur=String(m.subj||'').replace(/^p:/,''); if(!SB.bar) SB.bar=SB_PRON[1].includes(cur)?'t':'p'; g=SB.bar==='t'?SB_PRON[1]:SB_PRON[0]; lab='だれが'; }
 let h='<div class="slbar"><div class="auxcap'+((objm?!(m.useObj&&m.obj):!m.subj)?' nudge':'')+'">'+lab+'</div>';
 g.forEach(id=>{ const ref='p:'+id; let ok=true;
  try{ ok= objm? (v?objFits(v,ref):true) : (v? verbFitsSubj(Object.assign({},m,{subj:ref}),v) : st? stateFitsSubj(Object.assign({},m,{subj:ref}),st) : true); }catch(e){ ok=false; }
  if(cur===id) ok=true;
  const label=objm?(OBJ[id]||N(ref).en):N(ref).en;
  const fn=ok?()=>{ if(objm){ SB.np.O=null; SB.nxt=SB.lv>=3?'T':null; sbDo(()=>{ const mm=sbM(); mm.obj=ref; mm.useObj=true; reelFix(mm); }); } else { SB.np.S=null; SB.nxt='V'; sbDo(()=>reelSet('subj',sbM(),ref)); } }:()=>toast('この文では使えません');
  h+=sbChip(label,'',cur===id,fn,ok?'':'off'); });
 if(!objm) h+=sbChip(SB.bar==='t'?'⇄ひと':'⇄もの','',false,()=>{ SB.bar=SB.bar==='t'?'p':'t'; sbDraw(); },'swb');
 return h+'</div>'; }
export function sbSet(r){ const m=sbM(); if(r==='S') return !!m.subj; if(r==='V') return !!m.pred; if(r==='O') return !!(m.useObj&&m.obj)||(m.pred&&m.pred.k==='s'); return false; }
export let SB_NEXT;
export function sbPanel(){ const m=sbM(); const r=SB.r; if(!r) return null; const T={S:'① 主役（だれが・なにが）',V:'② 動き（どうする・どうだ）',O:(m.pred&&m.pred.k==='s')?'③ つづき（どう？・だれ？）':'③ つづき（なにを）',L:'前提（文のはじめ）',T:'文末（どこで・いつ）'}[r];
 const pos=r==='V'?'pos-verb':(r==='L'||r==='T')?'pos-adv':(r==='O'&&m.pred&&m.pred.k==='s'&&!(ST(m.pred.id)||{}).noun)?'pos-adj':'pos-noun';
 let h='';
 if(r==='L') return sbLPanel(T,pos);
 if(r==='O'&&!m.pred) return {title:T,pos,h:'<div class="slnote">先に ②動き を えらんでね</div>'};
 if(r==='O'&&predV(m)&&!needsObj(m)&&predV(m).fr==='intr') return {title:T,pos,h:'<div class="slnote">この動きは「つづき」なしで言えます</div>'};
 if(r==='S'){ h+=sbPersonBar('S'); h+='<div class="slbd"><span class="slbdl">このあとは？</span><div class="slvtop">'+sbBdChips()+'</div></div>'; } else if(r==='O'&&sbIsDt()){ const C0=sbCells('O'); const k0=(SB.sub&&(C0.cells.some(c=>c.k===SB.sub)||SB.sub===C0.main))?SB.sub:C0.main; if(k0==='iobj') h+=sbIobjBar(); } else if(r==='O'&&sbRole()==='O'&&predV(m)) h+=sbPersonBar('O'); else if(r==='V') h+=sbVerbTop();
 const C=sbCells(r); const key=(SB.sub&&(C.cells.some(c=>c.k===SB.sub)||SB.sub===C.main))?SB.sub:C.main; SB.key=key;
 if(C.cells.length){ h+='<div class="slinner">'+C.cells.map((c,i)=>(i?'<i class="sla">▸</i>':'')+'<button class="ck slp slin pos-'+(r==='V'?'verb':(r==='L'||r==='T')?'adv':'noun')+(key===c.k?' cur':'')+(c.v?'':' hole')+(c.cl?' '+c.cl:'')+((!c.v&&!SB.earOff[r]&&(c.cl==='main'?!sbSet(r):(sbSet(r)||r==='L'||r==='T')))?' nudge':'')+'" data-b="'+c.k+'"><span class="en">'+sbEsc(c.v||'')+'</span><span class="ja">'+c.t+'</span></button>').join('')+'</div>'; }
 const F=sbField(r,key); SB.F=F;
 h+='<div class="sled"><div class="slgl'+((F.main&&!sbSet(r)&&r!=='S'&&!(r==='O'&&sbRole()==='O'&&predV(m)))?' nudge':'')+'">'+sbEsc(F.label)+'</div><div class="slrow"><input id="slin" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="'+sbEsc(F.ph)+'"><button id="slrnd" aria-label="ランダム">🎲</button>'+(F.clr?'<button id="slclr2">'+F.clr[0]+'</button>':'')+(key==='verb'?'<button id="slrnd2">🎲動作</button>':'')+'</div><div id="slsug" class="slchips"></div></div>';
 if(key==='adj'){ const np=sbNPd(sbRoleOf(r)); if(np.adj.length) h+='<div class="slcur">'+sbAdjSort(np.adj).map(a=>'<button class="slx" data-x="'+sbEsc(a)+'">'+sbEsc(a)+' ✕</button>').join('')+'</div>'; }
 { const tgt=r==='S'?((m.pred&&m.pred.k==='s'&&SB.beDef)?'O':'V'):r==='V'?((predV(m)&&needsObj(m))||(m.pred&&m.pred.k==='s'&&SB.beDef)?'O':null):r==='L'?(m.subj?null:'S'):null; const ok=(r==='S'&&m.subj)||(r==='V'&&m.pred)||r==='L'; if(tgt&&ok){ const lab={V:'②動き',O:'③つづき',S:'①主役'}[tgt]; h+='<button class="slnext '+sbPosOf(tgt)+'" data-go="'+tgt+'">つぎは '+lab+' ▶</button>'; } }
 return {title:T,pos,h}; }
export function slEnsure(){ let el=document.getElementById('slot'); if(el) return el; const host=document.querySelector('[data-view="play"]'); if(!host) return null;
 el=document.createElement('div'); el.id='slot'; const cv=document.getElementById('canvas'); host.insertBefore(el,cv); return el; }
export function sbShown(r){ return (r==='L'||r==='T')?SB.lv>=3:true; }
export function sbSugDraw(F,q){ const box=document.getElementById('slsug'); if(!box) return; const L=(q&&q.trim())?F.list(q):(F.top?F.top().filter(Boolean):[]); box.innerHTML=''; 
 L.forEach(e=>{ const b=document.createElement('span'); b.className='mbstop slm'; b.innerHTML='<b>'+sbEsc(e[0])+'</b>'+(e[1]?'<small>'+sbEsc(e[1])+'</small>':''); b.onclick=()=>F.pick(e); box.appendChild(b); });
 { const wy=(F.block&&F.block())||((q&&q.trim()&&F.why)?F.why(q):''); if(wy){ const n=document.createElement('div'); n.className='slnote small'; n.textContent='ℹ️ '+wy; box.appendChild(n); } }
 if(q&&q.trim()&&!L.length&&F.raw){ const n=document.createElement('div'); n.className='slnote'; n.textContent='Enterで そのまま入れる（辞書にない語は「ことば登録」へ）'; box.appendChild(n); } }
export function sbGo(t){ SB.sub=null; SB.q=''; if(t==='done'){ try{ if(sentenceComplete(APP.S)) sbOpen(); else toast('まだ たりないところが あります'); }catch(e){} sbDraw(); return; } SB.r=t; SB.nxt=null; sbDraw(); }
export function sbAltA(){ return !!document.querySelector('.slsk .ck.altA')||(SB.skDone&&['S','V','O'].some(x=>sbEars(x))); }
export function sbGuideCls(){ const t=sbNextTab(); return t?sbPosOf(t):(sbSkelDone()?'pos-adv':''); }
export function sbGuide(){ const t=sbNextTab(); const m=sbM();
 if(t==='S') return SB.r==='S'?'主役を選ぼう！<small>I・you などのバーを押すか、名前を入力</small>':'👆 まず ①主役（だれが）を選ぼう！';
 if(t==='V') return SB.r==='V'?'動きを選ぼう！<small>be・慣用句・入力のどれか</small>':'次は ②動き（どうする）を選ぼう！';
 if(t==='O'){ const st=m.pred&&m.pred.k==='s'; return SB.r==='O'?'つづきを選ぼう！<small>'+(st?'どんな？ または だれ／なに？':'だれを／なにを')+'</small>':(st?'次は ③つづき（どう？）を選ぼう！':'次は ③つづき（なにを）を選ぼう！'); }
 if(sbSkelDone()) return '骨組みができた！<small>前提・文末や ＋ で足したり、「完成」で絵を見よう</small>'; return ''; }
export function sbDraw(){ if(SB.busy) return; const el=slEnsure(); if(!el) return; const fin=APP.finished; ENV.root.classList.toggle('slbuild',!fin); el.hidden=!!fin;
 let bk=document.getElementById('slback');
 if(fin){ if(!bk){ bk=document.createElement('div'); bk.id='slback'; bk.innerHTML='<button id="slbb">◀ 骨組みに戻る</button><button id="slbr">🔄 ランダム</button><button id="slbd">✅ 決定</button>'; el.parentNode.appendChild(bk);
   bk.querySelector('#slbr').onclick=()=>sbRandom(true);
   bk.querySelector('#slbb').onclick=()=>{ SB.blinkBack=false; APP.finished=false; try{ render(); }catch(e){} sbDraw(); el.scrollTop=0; };
   bk.querySelector('#slbd').onclick=()=>{ const t=sentenceText(APP.S); if(SB.logged!==t){ SB.logged=t; try{ DB.log.unshift({en:t,ja:sentenceJa(APP.S),at:Date.now()}); DB.log=DB.log.slice(0,50); save(); }catch(e){} }
    if(APP.finStage==='ja'){ APP.finStage=(typeof LV==='function'&&LV()>=3)?'bar':'word'; try{ render(); }catch(e){} sbDraw(); return; }
    sbReset(); }; }
  bk.querySelector('#slbb').classList.toggle('blink',!!SB.blinkBack); bk.querySelector('#slbd').textContent=(APP.finStage==='ja')?'✅ 決定':'↺ 最初から'; sbLabel(); return; } if(bk) bk.hidden=true; sbCtl(false);
 SB.acts=[]; if(SB.r&&!sbShown(SB.r)) SB.r=null;
 let can=false; try{ can=sentenceComplete(APP.S)&&!SB.beDef; }catch(e){}
 SB.anyEars=['S','V','O'].some(x=>sbEars(x)); SB.skDone=sbSkelDone(); const g=sbGroups(); let ja=''; try{ if(can) ja=sentenceJa(APP.S); }catch(e){}
 const lvH=[1,2,3].map(n=>'<button data-l="'+n+'" class="'+(SB.lv===n?'on':'')+'">'+n+'</button>').join('');
 const skel='<div class="slskel"><div class="slsk'+(SB.r?' hascur':'')+'">'+(SB.lv>=3?sbPill('L',g):'')+sbPill('S',g)+sbPill('V',g)+sbPill('O',g)+(SB.lv>=3?sbPill('T',g):'')+'</div><div class="sl-ja">'+(ja?sbEsc(ja):'')+'</div></div>';
 let pick=''; const pn=sbPanel(); if(pn) pick='<div class="slpick '+pn.pos+'"><button class="slclose" id="slclose" aria-label="とじる">✕</button><div class="slpt">'+sbEsc(pn.title)+'</div>'+pn.h+'</div>';
 el.innerHTML='<div class="sltop"><div class="seg lvseg"><span class="lvlab">Lv</span>'+lvH+'</div><div class="slact"><button id="slgram" class="'+(SB.gram?'on':'')+'">文法</button><button id="slrand" aria-label="ランダム">🎲</button><button id="slmode" class="'+(sbFun()?'fun':'')+'">'+(sbFun()?'おもしろ':'ふつう')+'</button><button id="slclr" aria-label="最初から">⟲</button></div></div>'+skel+pick+'<button id="sldone" class="'+(can?'rdy':'')+((can&&SB.skDone&&sbAltA())?' altB':'')+'" '+(can?'':'disabled')+'>完成 ✓</button><div id="slguide" class="'+sbGuideCls()+'">'+sbGuide()+'</div>';
 const sc=el.scrollTop;
 el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ const f=SB.acts[+b.dataset.a]; if(f) f(); });
 el.querySelectorAll('.slp[data-r]').forEach(b=>b.onclick=()=>{ const r=b.dataset.r; SB.r=SB.r===r?null:r; SB.sub=null; SB.nxt=null; SB.idm=false; SB.earOff[r]=true; sbDraw(); });
 el.querySelectorAll('.slin').forEach(b=>b.onclick=()=>{ SB.sub=b.dataset.b; SB.earOff[SB.r]=true; sbDraw(); });
 el.querySelectorAll('.ear').forEach(b=>b.onclick=ev=>{ ev.stopPropagation(); const a=b.dataset.e.split(':'); const r=a[0], left=a[1]==='l'; SB.earOff[r]=true; SB.r=r; SB.sub=r==='V'?(left?'pre':'vpost'):(left?'adj':'post'); sbDraw(); });
 el.querySelectorAll('.lvseg button').forEach(b=>b.onclick=()=>{ SB.lv=+b.dataset.l; SB.sub=null; sbDraw(); });
 el.querySelector('#slgram').onclick=()=>{ SB.gram=!SB.gram; sbDraw(); };
 const cl=el.querySelector('#slclose'); if(cl) cl.onclick=()=>{ SB.r=null; SB.sub=null; sbDraw(); };
 const nx=el.querySelector('.slnext'); if(nx&&SB.anyEars) nx.classList.add('alt'); if(nx) nx.onclick=()=>sbGo(nx.dataset.go);
 const F=pn&&SB.F, inp=el.querySelector('#slin');
 if(F&&inp){ sbSugDraw(F,''); inp.addEventListener('input',()=>sbSugDraw(F,inp.value)); inp.addEventListener('keydown',e=>{ if(e.isComposing||e.keyCode===229) return; if(e.key==='Enter'){ e.preventDefault(); const t=inp.value.trim(); if(!t) return; const L=F.list(t); const hit=L.find(x=>String(x[0]).toLowerCase()===t.toLowerCase())||L[0]; if(hit) F.pick(hit); else if(F.raw) F.pick([t,'']); else toast('候補にありません'); } });
  const rb=el.querySelector('#slrnd'); if(rb) rb.onclick=()=>F.rand(); const r2=el.querySelector('#slrnd2'); if(r2) r2.onclick=()=>sbRandVerb('act'); const c2=el.querySelector('#slclr2'); if(c2) c2.onclick=F.clr[1]; }
 el.querySelectorAll('.slx').forEach(b=>b.onclick=()=>{ const role=sbRoleOf(SB.r); const np=sbNPd(role); np.adj=np.adj.filter(a=>a!==b.dataset.x); if(np.noun) sbApply(role); try{ render(); }catch(e){} sbDraw(); });
 el.querySelector('#slrand').onclick=sbRandom; el.querySelector('#slmode').onclick=()=>{ SET().rmode=sbFun()?'normal':'fun'; try{ save(); }catch(e){} sbDraw(); toast(sbFun()?'おもしろモード：なんでも組み合わせ':'ふつうモード：自然な文だけ'); }; el.querySelector('#slclr').onclick=sbClear;
 el.querySelector('#sldone').onclick=()=>{ try{ if(sentenceComplete(APP.S)) sbOpen(); }catch(e){} sbDraw(); };
 el.scrollTop=sc; }
export function sbReset(){ const snap=JSON.stringify(APP.S), np=JSON.stringify(SB.np); APP.finished=false; sbClear(); try{ render(); }catch(e){}
 let u=document.getElementById('slundo'); if(u) u.remove(); u=document.createElement('div'); u.id='slundo'; u.innerHTML='消しました <button>↩ もどす</button>'; ENV.root.appendChild(u);
 u.querySelector('button').onclick=()=>{ u.remove(); try{ Object.keys(APP.S).forEach(k=>delete APP.S[k]); Object.assign(APP.S,JSON.parse(snap)); SB.np=JSON.parse(np); }catch(e){} try{ sbOpen(); }catch(e){} try{ render(); }catch(e){} sbDraw(); };
 setTimeout(()=>{ if(u.parentNode) u.remove(); },8000); }
export function sbClear(){ SB.bd=null; SB.earOff={}; SB.beDef=false; SB.blinkBack=false; SB.np={S:null,O:null,C:null}; SB.r=null; SB.sub=null; SB.q=''; SB.nxt=null; try{ resetAll(); }catch(e){} sbDraw(); }
// ---- ランダムの「ふつう／おもしろ」 ----
export let SB_NEEDPL;
export function sbFun(){ try{ return SET().rmode==='fun'; }catch(e){ return false; } }
export let SB_VIOLENT;
export let SB_PERSONV;
export let SB_LEADS_OK;
export function sbRandom(fin){ APP.hlSnap=null; APP.hlMark=null; SB.bd=null; fin=(fin===true); const keepSt=fin&&APP.finished?APP.finStage:null; SB.np={S:null,O:null,C:null}; SB.r=null; SB.sub=null; SB.nxt=null; SB.earOff={}; SB.beDef=false; SB.blinkBack=!fin;
 const pick=a=>a[Math.floor(Math.random()*a.length)]; const ok=(r,m)=>!/^p:(some|any|every|no)(one|body|thing)|(self|selves)$|^p:(everyone|everybody|anyone|someone|nobody|others?|else)|^p:q_/.test(String(r))&&r!==m.subj;
 for(let t=0;t<60;t++){ try{ resetAll(); const m=sbM(); const sc=reelCands('subj',m).slice(0,8); reelSet('subj',m,pick(sc));
  const x=Math.random();
  if(x<.12){ const c=reelCands('state',Object.assign({},m,{pred:{k:'s',id:LEX.states[0].id}})).filter(id=>!(ST(id)||{}).noun); if(c.length) reelSet('state',m,pick(c)); }
  else { let vs=reelCands('verb',m).filter(id=>{ const en=((V(id)||{}).en)||''; return !/^(kill|hit|shoot|hurt|punch|stab|slap|attack|steal|rob|arrest|bite)$/i.test(en); }); if(!sbFun()){ const v2=vs.filter(id=>!SB_VIOLENT.test(((V(id)||{}).en)||'')); if(v2.length>5) vs=v2; } const want=x<.8; // 約7割は目的語をとる動詞
   let done=false; for(let k=0;k<25&&!done;k++){ reelSet('verb',m,pick(vs)); const tr=!!(m.pred&&predV(m)&&needsObj(m)); if(tr===want||k>20) done=true; }
   if(m.useObj||needsObj(m)){ const os=reelCands('obj',m).filter(r=>ok(r,m)); const ppl=os.filter(r=>/^p:/.test(r)), thg=os.filter(r=>!/^p:/.test(r)); const pvv=predV(m)||{}; const vEn=pvv.en||''; const vt=pvv.t||[]; const GEN=['thing','any','abstract']; const spec=r=>{ try{ const tg=nounTags(r); return vt.some(t=>!GEN.includes(t)&&tg.includes(t)); }catch(e){ return false; } }; const personOk=sbFun()||(vt.includes('person')&&!SB_VIOLENT.test(vEn)); let thg2=sbFun()?thg:thg.filter(spec); const usePerson=ppl.length&&personOk&&(Math.random()<.4||!thg2.length); const RKp=(!sbFun()&&typeof objRankRefs==='function'&&objRankRefs(pvv.id||''))||null; const RKo=RKp?RKp.filter(r=>r!==m.subj&&ok(r,m)):[]; const pool=RKo.length?RKo:(usePerson?ppl:(sbFun()?(thg.length?thg:os):thg2)); if(pool.length){ m.obj=pick(pool); m.useObj=true; } else if(!sbFun()) throw 0; } }
  reelFix(m);
  // 文末（どこで／いつ）：約5割、前提（つなぎ・いつ）：約3割。「いつ」は1か所だけ
  let hasTime=false;
  if(Math.random()<.5){ if(Math.random()<.55){ const c=reelCands('place',m).filter(Boolean); if(c.length) reelSet('place',m,pick(c)); } else { const c=reelCands('time',m).filter(Boolean); if(c.length){ reelSet('time',m,pick(c)); hasTime=true; } } }
  if(Math.random()<.3){ if(!hasTime&&!m.time&&Math.random()<.5){ const c=reelCands('time',m).filter(Boolean); if(c.length){ reelSet('time',m,pick(c)); m.front='time'; hasTime=true; } } else { let L=(FRONTS||[]).filter(f=>f.g==='link'||f.g==='stance'); if(!sbFun()) L=L.filter(f=>SB_LEADS_OK.test(f.en)); if(L.length) m.lead=pick(L).id; } }
  if(Math.random()<.2){ try{ const al=allowedModals(m).filter(y=>y&&y.id); if(al.length) setModal(m,pick(al).id); }catch(e){} }
  reelFix(m); normalize(); { const pv=predV(m); if(pv&&SB_NEEDPL.test(pv.id)&&!m.place) throw 0; } // 行き先・置き場所がないと文にならない動詞
  if(sentenceComplete(APP.S)){ sbOpen(); if(keepSt){ APP.finStage='ja'; APP.finBar=false; try{ render(); }catch(e){} } sbDraw(); return; } }catch(e){} }
 sbDraw(); }
export function sbLabel(){ const b=document.getElementById('slbd'); if(b) b.textContent=(APP.finStage==='ja')?'✅ 決定':'↺ 最初から';
 const bk=document.getElementById('slback'); if(bk) bk.hidden=!APP.finished; sbCtl(false); }
// バーを操作しているあいだは下のボタン行をたたみ、右上に小さな「最初から」「✓とじる」だけ出す
export function sbCtl(on){ let c=document.getElementById('slbarctl'); if(!c){ const cv=document.getElementById('canvas'); if(!cv) return; c=document.createElement('div'); c.id='slbarctl'; c.innerHTML='<button id="slcr" aria-label="最初から">↺</button><button id="slcok" aria-label="とじる">✓</button>'; cv.appendChild(c); c.querySelector('#slcr').onclick=e=>{ e.stopPropagation(); sbReset(); }; c.querySelector('#slcok').onclick=e=>{ e.stopPropagation(); sbFinHide(); }; c.addEventListener('pointerdown',e=>e.stopPropagation()); } c.hidden=!on; }
export function sbFinHide(){ if(!APP.finished) return; APP.finStage='ja'; APP.finBar=false; APP.reelKey=null; try{ renderScene(); }catch(e){} sbLabel(); }
// バーをさわって指をはなしたら、しばらくして自動でたたむ（戻したいときは SB_AUTOHIDE=false）
 
export function sbInit(){ if(!document.querySelector('[data-view="play"]')) return; { const _rs=renderScene; set_renderScene(function(){ const x=_rs.apply(this,arguments); try{ sbLabel(); }catch(e){} return x; }); } slEnsure(); sbDraw(); const bu=document.getElementById('bUndo'); if(bu) bu.onclick=()=>{ sbClear(); }; const _r=render; set_render(function(){ const x=_r.apply(this,arguments); try{ if(!SB.busy) sbDraw(); }catch(e){} return x; }); }


// ---- バーはタップだけでなく、指をすべらせても選べる（骨組み側・終わった後の主語バー） ----

// ---- 促しの脈打ち：選ぶまでずっと（JSで 0.6秒ごとに切り替え） ----

export function sbCompact(){ document.querySelectorAll('.slsk .ck.slend:not(.hole)').forEach(p=>{ p.classList.remove('slcmp'); p.setAttribute('data-lab',p.dataset.r==='L'?'前提':'文末'); const sp=[...p.querySelectorAll('.en,.ja')]; let w=0; sp.forEach(x=>{ const o=x.style.cssText; x.style.cssText='display:inline-block;white-space:nowrap;position:absolute;visibility:hidden'; w=Math.max(w,x.offsetWidth); x.style.cssText=o; }); if(w>p.clientWidth-8) p.classList.add('slcmp'); }); }

// 骨組みから「完成」した直後は絵だけ見せて、画面をタップしたらバーを出す（ランダムのときは「決定」まで出さない）


// ---- 完成後の操作帯（ドック）：英文の語をえらぶ → その語の操作だけ出す。片手（下側）で届く。戻したいときは SB_DOCK=false ----
 
export let DK_MB;
export function dkAct(fn){ SB.dk.push(fn); return SB.dk.length-1; }
export function dkLab(ps){ const t=ps.map(p=>p.en).join(' '); return t.length>16?t.slice(0,15)+'…':t; }
export function dkWordMatch(lab,q){ const l=String(lab).toLowerCase(); return l.split(/\s+/).some(w=>w.startsWith(q)); }
export function dkApply(kind,ref){ const m=sbM(); APP.hist.push(snapshot()); if(kind==='subj'){ m.subj=ref; try{ sbReflSync(m); }catch(e){} } else if(kind==='state'){ reelSet('state',m,ref); } else { m.obj=ref; m.useObj=true; try{ sbReflSync(m); }catch(e){} }
 try{ reelFix(m); normalize(); }catch(e){} APP.finished=true; APP.finTried=true; APP.finBar=true; APP.finIdle=false; try{ render(); }catch(e){} try{ say(sentenceText(APP.S)); }catch(e){} }
export function dkKind(sel){ const m=sbM(); if(sel==='S') return 'subj'; return (m.pred&&m.pred.k==='s')?'state':'obj'; }
export function dkCands(kind){ const m=sbM(); const cur=kind==='subj'?m.subj:kind==='state'?(m.pred&&m.pred.id):m.obj; let L=[]; try{ L=reelCands(kind,m)||[]; }catch(e){} return L.filter(x=>x&&x!==cur); }
export function dkSugHtml(kind,q){ q=String(q||'').toLowerCase().trim(); let L=dkCands(kind); if(q) L=L.filter(r=>dkWordMatch(reelLabel(kind,r),q)); else L=L.filter(r=>/^t:/.test(r)).concat(L.filter(r=>!/^t:/.test(r))).slice(0,3);
 return L.slice(0,3).map(r=>'<span class="mbstop dksg1" data-ref="'+sbEsc(r)+'"><b>'+sbEsc(reelLabel(kind,r))+'</b></span>').join(''); }
export function sbDockHtml(m){ SB.dk=[]; const mb=(id)=>id?MD(id).en:'ー';
 const cur=String(m.subj||'').replace(/^p:/,''); const SG=[['i','you','he','she','we','they'],['it','this','that','these','those']].find(x=>x.includes(cur))||['i','you','he','she','we','they']; const pv=predV(m), ps=predS(m);
 const al=allowedModals(m).map(x=>x.id); const mc=m.modal||null; const ci=Math.max(0,DK_MB.findIndex(x=>x[0]===mc));
 let h='<div class="dk2'+(APP.dkDrag?' drag':'')+'"><div class="dkbub"><b>'+sbEsc(mb(mc))+'</b><small>'+sbEsc(DK_MB[ci][1])+'</small></div>';
 // 1) 主語バー
 h+='<div class="dkr"><span class="dklab n">だれが</span><div class="subjbar dkpills">'+SG.map(id=>{ let ok=true; try{ ok=pv?verbFitsSubj(Object.assign({},m,{subj:'p:'+id}),pv):ps?stateFitsSubj(Object.assign({},m,{subj:'p:'+id}),ps):true; }catch(e){} if(cur===id) ok=true; return '<span class="mbstop '+(cur===id?'on ':'')+(ok?'':'off')+'" data-dk="'+dkAct(()=>{ if(ok) finSubj('p:'+id); else toast('この文では使えません'); })+'"><b>'+sbEsc(N('p:'+id).en)+'</b></span>'; }).join('')+'</div></div>';
 // 2) 助動詞バー（なぞると変わる）＋ 否定・疑問・受身
 const tg=(k,lab,on,ok)=>'<span class="dkt '+(on?'on ':'')+(ok?'':'off')+'" data-dk="'+dkAct(()=>{ if(ok) finToggle(k); else toast('この文では使えません'); })+'">'+lab+'</span>';
 h+='<div class="dkr">'+tg('neg','否定',!!m.neg,true)+tg('q','疑問',!!m.q,true)+tg('pass','受身',!!m.passive,passOk(m))+'<div class="dkmb"><i class="dkln"></i>'+DK_MB.map((x,i)=>'<span class="dkd '+(i===ci?'on ':'')+((x[0]===null||al.includes(x[0]))?'':'off')+'" data-i="'+i+'">'+(x[0]||'ー')+'</span>').join('')+'</div></div>';
 return h+'</div>'; }



// 助動詞バー：なぞるたびに変わる。なぞっている間は、上の主語バーのところに吹き出しで今の助動詞を出す


// ---- 完成後：「＋文を変化させてあそぶ」の1行 ⇄ 下からバー3本が出るパネル（開くと下のボタン行・ナビは覆う。絵の大きさは変えない）----
export function dkSync(){ const cv=document.getElementById('canvas'), app=document.getElementById('app'); if(!cv||!app) return;
 const fin=!!APP.finished, open=fin&&APP.finStage&&APP.finStage!=='ja'&&!!document.querySelector('.finbar .dk2');
 cv.classList.toggle('dkx',open); cv.classList.toggle('dkc',fin&&!open);
 let pn=document.getElementById('dkpanel'); if(!pn){ pn=document.createElement('div'); pn.id='dkpanel'; pn.hidden=true; pn.innerHTML='<div id="dkbars"></div><div id="dkmenu">＋ メニューを開く</div>'; app.appendChild(pn); pn.querySelector('#dkmenu').onclick=e=>{ e.stopPropagation(); sbFinHide(); }; }
 let st=document.getElementById('dkstrip'); if(!st){ st=document.createElement('div'); st.id='dkstrip'; st.textContent='＋ 文を変化させてあそぶ'; cv.appendChild(st); st.onclick=e=>{ e.stopPropagation(); const f=APP.reelFA&&APP.reelFA.jaok; if(f) f(); }; st.addEventListener('pointerdown',e=>e.stopPropagation()); }
 const tl=document.getElementById('tline'), bars=pn.querySelector('#dkbars');
 if(open){ pn.hidden=false; const fb=document.querySelector('#scene .finbar'); if(fb) bars.replaceChildren(fb); if(tl&&tl.parentNode!==pn) pn.insertBefore(tl,pn.querySelector('#dkmenu')); }
 else { pn.hidden=true; bars.replaceChildren(); if(tl&&tl.parentNode!==cv) cv.appendChild(tl); } }


// ---- 前提タブ：条件／慣用句／口語／どこで／いつ（各🎲）＋ 入力バー（語の途中でも探せる・続きを書ける） ----
export let SB_CATS;
export let SB_XL;
export function sbCond(){ const s=sbM().subs&&sbM().subs.conj; return (s&&s.front&&/^(when|if)$/.test(s.conj))?s:null; }
export function sbCondText(s){ try{ const r=genClause(s.c,{kind:'conj',key:'conj',conj:s.conj}); return CJ(s.conj).en+' '+r.filter(p=>p&&p.en&&!p.hole&&!/\.cj$/.test(String(p.key))).map(p=>p.en).join(' '); }catch(e){ return CJ(s.conj).en+' …'; } }
export function sbLeadCat(f){ if(!f) return ''; if(f.g==='scene'||f.g==='freq') return 'tm'; if(f.g==='link'||f.casual) return 'col'; return 'idm'; }
export function sbCatVal(k){ const m=sbM(); const f=m.lead&&LEADF(m.lead);
 if(k==='cond'){ const s=sbCond(); return s?sbCondText(s):''; }
 if(k==='idm'||k==='col'){ if(sbLeadCat(f)!==k) return ''; return f.en+(m.leadX?' '+m.leadX:(f.need?' …':'')); }
 if(k==='plc') return (m.place&&FRP(m))?PL(m.place).en:'';
 if(k==='tm'){ if(sbLeadCat(f)==='tm') return f.en; return (m.time&&FRT(m))?TM(m.time).en:''; } return ''; }
export function sbCatClr(k){ const m=sbM(); const f=m.lead&&LEADF(m.lead);
 if(k==='cond'){ if(sbCond()) delete m.subs.conj; }
 else if(k==='plc'){ if(FRP(m)){ reelSet('place',m,null); sbFr('place',false); } }
 else { if(sbLeadCat(f)===k){ m.lead=null; m.leadX=null; m.leadXja=null; } else if(k==='tm'&&m.time&&FRT(m)){ reelSet('time',m,null); sbFr('time',false); } } }
export function sbSetLead(id,x,xja){ const m=sbM(); m.lead=id; m.leadX=x||null; m.leadXja=xja||null; }
export function sbLeadPool(k){ const m=sbM(), seen={}; return (FRONTS||[]).filter(f=>{ if(sbLeadCat(f)!==k||seen[f.en]) return false; if(f.g==='scene'&&m.time) return false; if(f.g==='freq'&&(m.time||m.freq)) return false; seen[f.en]=1; return true; }); }
export function sbRandCond(cj){ const m=sbM(); cj=cj||sbRnd(['when','if']); let best=null;
 for(let t=0;t<80&&!best;t++){ try{ const c=newClause(); reelSet('subj',c,sbRnd(['p:i','p:you','p:he','p:she','p:we','p:they'])); const vs=(reelCands('verb',c)||[]).filter(Boolean); if(!vs.length) continue; reelSet('verb',c,sbRnd(vs)); const v=predV(c); if(!v||SB_VIOLENT.test(v.en||'')||v.tail||v.prep||needsObj(c)||v.fr!=='intr'||/^(get|become|seem|turn|keep|remain|grow|stay)$/i.test(v.en||'')) continue; c.tense=/past/.test(m.tense||'')?'past':'pres'; try{ reelFix(c); }catch(e){} const r=genClause(c,{kind:'conj',key:'conj',conj:cj}); if(r.some(p=>p.hole||/…/.test(p.en||''))) continue; best=c; }catch(e){} }
 if(!best){ toast('条件をうまく作れませんでした。もう一度どうぞ'); return; }
 sbDo(()=>{ sbM().subs.conj={conj:cj,front:true,c:best}; }); }
export function sbPutPlace(id){ if(sbM().place&&!FRP(sbM())){ toast('「どこで」は 文末に入っています'); return; } sbDo(()=>{ reelSet('place',sbM(),id); sbFr('place',true); }); }
export function sbPutTime(id){ if(sbTimeOwner()==='time'){ toast('「いつ」は 文末に入っています'); return; } sbDo(()=>{ const mm=sbM(); if(sbTimeLead()){ mm.lead=null; mm.leadX=null; mm.leadXja=null; } reelSet('time',mm,id); sbFr('time',true); }); }
export function sbPutLead(id){ const f=LEADF(id), m=sbM(); if(!f) return; if(f.g==='scene'&&m.time&&!(sbTimeLead())){ toast('「いつ」がすでに入っています'); return; } if(f.g==='freq'&&((m.time&&!sbTimeLead())||m.freq)){ toast('「ひんど」がすでに入っています'); return; }
 sbDo(()=>{ const mm=sbM(); if(f.g==='scene'||f.g==='freq'){ if(mm.time&&FRT(mm)){ reelSet('time',mm,null); sbFr('time',false); } } let x=null,xj=null; if(f.need&&!SB.lxAuto){ } sbSetLead(id,x,xj); }); }
export function sbCatRand(k){ const m=sbM();
 if(k==='cond') return sbRandCond();
 if(k==='plc'){ const c=(reelCands('place',m)||[]).filter(Boolean).filter(id=>!(FRP(m)&&id===m.place)); if(c.length) sbPutPlace(sbRnd(c)); return; }
 if(k==='tm'){ const pool=(reelCands('time',m)||[]).filter(Boolean).filter(id=>!(FRT(m)&&id===m.time)).map(id=>['t',id]).concat(sbLeadPool('tm').filter(f=>f.id!==m.lead).map(f=>['l',f.id])); if(!pool.length) return; const it=sbRnd(pool); return it[0]==='t'?sbPutTime(it[1]):sbPutLead(it[1]); }
 const pool=sbLeadPool(k).filter(f=>f.id!==m.lead); if(!pool.length) return; const f=sbRnd(pool);
 if(f.need){ const x=sbRnd(SB_XL); sbDo(()=>{ sbSetLead(f.id,x[0],x[1]); }); } else sbDo(()=>{ sbSetLead(f.id); }); }
export function sbLAll(){ const m=sbM(), o=[['When …','もし〜とき','c:when','cond'],['If …','もし〜なら','c:if','cond']];
 ['idm','col','tm'].forEach(k=>sbLeadPool(k).forEach(f=>o.push([f.en,f.ja||'','l:'+f.id,k])));
 (reelCands('place',m)||[]).filter(Boolean).forEach(id=>{ const p=PL(id); if(p) o.push([p.en,p.ja||'','p:'+id,'plc']); });
 (reelCands('time',m)||[]).filter(Boolean).forEach(id=>{ const t=TM(id); if(t) o.push([t.en,t.ja||'','t:'+id,'tm']); }); return o; }
export function sbLFilt(L,q,n){ q=String(q||'').toLowerCase().trim(); if(!q) return []; const w=x=>String(x[0]).toLowerCase().replace(/[…?,]/g,'').trim(); const a=L.filter(x=>w(x).startsWith(q)), b=L.filter(x=>!w(x).startsWith(q)&&w(x).split(/\s+/).some(t=>t.startsWith(q))); const seen={}; return a.concat(b).filter(x=>!seen[x[2]]&&(seen[x[2]]=1)).slice(0,n||3); }
export function sbLPick(e){ const key=e[2], t=key.slice(0,2), id=key.slice(2);
 if(t==='c:') return sbRandCond(id); if(t==='p:') return sbPutPlace(id); if(t==='t:') return sbPutTime(id);
 const f=LEADF(id); if(f&&f.need){ if(f.g==='scene'||f.g==='freq') return; sbDo(()=>{ sbSetLead(id); }); return; } sbPutLead(id); }
export function sbLPanel(T,pos){ const m=sbM(); const f=m.lead&&LEADF(m.lead); const need=!!(f&&f.need&&!m.leadX);
 let h='<div class="slcats">'+SB_CATS.map(([k,lab])=>{ const v=sbCatVal(k); return '<div class="slcat'+(v?' on':'')+' pos-'+(k==='tm'||k==='plc'?'adv':k==='cond'?'verb':'noun')+'"><button class="slcb" data-cat="'+k+'"><span class="en">'+sbEsc(v)+'</span><span class="ja">'+lab+'</span><i>🎲</i></button>'+(v?'<button class="slcx" data-cx="'+k+'" aria-label="とる">✕</button>':'')+'</div>'; }).join('')+'</div>';
 const F={}; F.raw=false;
 if(need){ F.label='「'+f.en+'」のあとに入れる'; F.ph='例：him / the weather'; F.all=()=>SB_XL.map(x=>[x[0],x[1]]); F.list=q=>{ q=String(q||'').toLowerCase().trim(); const L=SB_XL.filter(x=>x[0].startsWith(q)||x[0].split(' ').some(t=>t.startsWith(q))).map(x=>[x[0],x[1]]); return L.length?L.slice(0,5):[[String(q).trim(),'']]; }; F.top=()=>SB_XL.slice(0,5).map(x=>[x[0],x[1]]);
  F.pick=e=>sbDo(()=>{ const mm=sbM(); mm.leadX=e[0]; mm.leadXja=e[1]||e[0]; }); }
 else { F.label='ことばを入力（語の途中でもOK　例：opinion）'; F.ph='例：opinion / yesterday / at home'; F.all=sbLAll; F.list=q=>sbLFilt(sbLAll(),q,3); F.top=()=>[]; F.pick=sbLPick; }
 F.rand=()=>{}; SB.F=F;
 h+='<div class="sled"><div class="slgl'+(need?' nudge':'')+'">'+sbEsc(F.label)+'</div><div class="slrow"><input id="slin" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="'+sbEsc(F.ph)+'"></div><div id="slsug" class="slchips"></div></div>';
 if(!m.subj) h+='<button class="slnext pos-noun" data-go="S">つぎは ①主役 ▶</button>';
 return {title:T,pos,h}; }



/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_slot(){
SL_DET = [['','（なし）',''],['a','ひとつの'],['the','その'],['this','この'],['that','あの'],['these','これらの'],['those','あれらの'],['my','わたしの'],['your','あなたの'],['his','かれの'],['her','かのじょの'],['our','わたしたちの'],['their','かれらの'],['some','いくつかの'],['any','どれか'],['no','ひとつも〜ない'],['many','たくさんの（数）'],['much','たくさんの（量）'],['a lot of','たくさんの'],['a few','少しの（数）'],['a little','少しの（量）'],['several','いくつもの'],['enough','じゅうぶんな'],['all','すべての'],['both','両方の'],['every','どの〜も'],['each','それぞれの']];
SL_CATNAME = ['','感想・気もち','大きさ','性質','古い・新しい','形','色','出身','素材'];
SL_ADJ = {good:['よい',1],nice:['すてきな',1],beautiful:['美しい',1],kind:['やさしい',1],funny:['おもしろい',1],interesting:['興味深い',1],delicious:['おいしい',1],famous:['有名な',1],popular:['人気の',1],smart:['かしこい',1],lovely:['すばらしい',1],cute:['かわいい',1],shy:['はずかしがりの',1],happy:['うれしい',1],busy:['いそがしい',1],tired:['つかれた',1],great:['すごい',1],bad:['悪い',1],lucky:['運のいい',1],strange:['へんな',1],special:['特別な',1],important:['大事な',1],difficult:['むずかしい',1],easy:['かんたんな',1],
 big:['大きい',2],small:['小さい',2],tall:['背の高い',2],long:['長い',2],short:['短い',2],little:['ちいさな',2],fat:['太った',2],thin:['細い',2],heavy:['重い',2],light:['軽い',2],
 hot:['熱い',3],cold:['冷たい',3],sweet:['甘い',3],spicy:['からい',3],fresh:['新鮮な',3],fast:['速い',3],slow:['遅い',3],clean:['きれいな',3],dirty:['汚い',3],quiet:['静かな',3],loud:['うるさい',3],soft:['やわらかい',3],hard:['かたい',3],strong:['強い',3],weak:['弱い',3],
 new:['新しい',4],old:['古い',4],young:['若い',4],
 red:['赤い',6],blue:['青い',6],black:['黒い',6],white:['白い',6],yellow:['黄色い',6],green:['緑の',6],brown:['茶色の',6],pink:['ピンクの',6],orange:['オレンジ色の',6],gray:['灰色の',6],
 wooden:['木の',8],golden:['金の',8]};
SL_ADJ_TAG = {
 person:['kind','nice','tall','young','old','happy','tired','smart','funny','famous','busy','shy','good','new'],
 animal:['big','small','cute','old','young','black','white','brown','fat','fast','lovely','strong'],
 food:['delicious','hot','cold','sweet','fresh','spicy','good','big','small','red','yellow','green'],
 drink:['hot','cold','sweet','fresh','good','big','small','clean'],
 read:['interesting','new','old','good','long','short','famous','popular','difficult','easy','red','blue'],
 event:['great','special','important','good','long','short','new','big','small','nice'],
 thing:['new','old','big','small','good','nice','beautiful','long','short','heavy','light','red','blue','black','white'],
 generic:['good','new','big','small','old','nice','beautiful','long','short','red','blue','white','black','hot','cold']
};
SL_VPRE = [['always','いつも'],['usually','ふだん'],['often','よく'],['sometimes','ときどき'],['never','ぜったい〜ない'],['really','本当に'],['just','ちょうど'],['also','〜も'],['almost','ほとんど'],['be going to','〜するつもりで'],['used to','昔は〜していた']];
SL_VPOST = [['well','じょうずに'],['fast','速く'],['hard','一生懸命'],['slowly','ゆっくり'],['quietly','静かに'],['together','いっしょに'],['again','もう一度'],['here','ここで'],['there','そこで']];
SL_NPOST = [['of mine','わたしの'],['in the room','部屋の中の'],['on the table','机の上の'],['at home','家にいる'],['from Japan','日本から来た'],['for you','あなたへの'],['with a hat','ぼうしをかぶった']];
SL_LEAD = [['Today','きょう'],['Yesterday','きのう'],['Tomorrow','あした'],['Maybe','たぶん'],['Actually','じつは'],['Well','ええと'],['First','まず'],['Then','それから']];
SL_TAIL = [['every day','毎日'],['today','きょう'],['now','いま'],['at home','家で'],['in the morning','朝に'],['at night','夜に'],['with you','あなたと'],['with my friend','友だちと'],['in Tokyo','東京で'],['again','もう一度'],['too','〜も'],['very much','とても']];
window.SB_NOFILL=true;
SB = {earOff:{},beDef:false,blinkBack:false,lv:3,r:null,sub:null,np:{S:null,O:null,C:null},acts:[],q:'',busy:false};
SB_PRON = [['i','you','he','she','we','they'],['it','this','that','these','those']];
SB_PLN = /^(many|a few|several|both|some|any|no|a lot of|all|enough|these|those)$/;
SB_REFL = {i:'myself',you:'yourself',he:'himself',she:'herself',we:'ourselves',they:'themselves',it:'itself'};
SB_POSN = {noun:'名詞',pron:'代名詞',verb:'動詞',adj:'形容詞',adv:'副詞',aux:'助動詞',det:'限定詞',conj:'つなぎ',idm:'熟語',post:'後置'};
sbRnd = a=>a[Math.floor(Math.random()*a.length)];
SB_FRAMES = ['want','needto','haveto','goingto','wouldlike','usedto','supposedto','aboutto','tendto','feellike','managedto','getto'].filter(id=>typeof MODALS!=='undefined'&&MODALS.some(x=>x.id===id));
FRAME_SET = new Set(SB_FRAMES.concat(typeof FRAME_IDS!=='undefined'?FRAME_IDS:[]));
SB_NEXT = {S:['V','②動き'],V:['O','③つづき'],O:['done','完成'],T:['done','完成'],L:['S','①主役']};
SB_NEEDPL = /^(get_arrive|put)$/;
SB_VIOLENT = /^(kill|hit|shoot|hurt|punch|stab|slap|attack|steal|rob|arrest|bite|beat|fight|kick|burn|destroy|break|cut|catch|chase|push|throw|drop)$/i;
SB_PERSONV = /^(see|meet|help|call|ask|teach|love|like|know|visit|thank|invite|hug|follow|welcome|miss|need|want|find|remember|understand|trust|hear|watch|join|lead|kiss|wait|tell|give|show|send|lend|bring|make|buy|cook|write|sing)$/i;
SB_LEADS_OK = /^(Well|So|Actually|Maybe|Probably|Honestly|Anyway|Then|Also|However|Perhaps|Definitely|Finally|First|Sure|Okay|Right)$/;
window.SB_AUTOHIDE=false;
(function(){ let tm=null; const arm=ms=>{ clearTimeout(tm); tm=setTimeout(()=>{ if(window.SB_AUTOHIDE&&APP.finished&&APP.finStage!=='ja'&&!APP.reelKey&&!APP.tlBusy) sbFinHide(); },ms); };
 onDoc('pointerdown',()=>clearTimeout(tm),true);
 onDoc('pointerup',e=>{ if(!window.SB_AUTOHIDE||!APP.finished||APP.finStage==='ja') return; const t=e.target&&e.target.closest?e.target:null; if(!t) return; if(t.closest('#tline')) arm(300); else if(t.closest('.finbar,.subjbar')) arm(3000); },true); })();
if(document.readyState!=='loading') setTimeout(sbInit,0); else onDoc('DOMContentLoaded',()=>setTimeout(sbInit,0));
(function(){ let st=null, sup=false; const BARS='.slbar,.subjbar,.mbrow';
 const pill=(el)=>el&&el.closest?el.closest('.mbstop'):null; const barOf=(el)=>el&&el.closest?el.closest(BARS):null;
 const live=(b)=>!!(b&&APP.finished&&b.matches('.subjbar,.mbrow')); const kind=(b)=>b.matches('.mbrow')?'m':b.matches('.subjbar')?'s':'k';
 const key=(q)=>q.dataset.fa||q.dataset.a||q.textContent;
 onDoc('pointerdown',e=>{ const p=pill(e.target); const b=p&&barOf(p); if(!b) return; st={b,k:kind(b),p,cur:p,ck:key(p),moved:false,x:e.clientX,sl:b.scrollLeft}; if(live(b)) b.style.touchAction='none'; },true);
 onDoc('pointermove',e=>{ if(!st) return; if(Math.abs(e.clientX-st.x)>8) st.moved=true; if(!st.moved) return;
  if(!st.cap&&live(document.querySelector(st.k==='m'?'.mbrow':st.k==='s'?'.subjbar':'.slbar'))){ st.cap=true; try{ document.getElementById('scene').setPointerCapture(e.pointerId); }catch(x){} }
  const el=document.elementFromPoint(e.clientX,e.clientY); const q=pill(el); const bar=document.querySelector(st.k==='m'?'.mbrow':st.k==='s'?'.subjbar':'.slbar');
  if(st.k==='m'&&bar){ const r=bar.getBoundingClientRect(); if(e.clientX>r.right-28) bar.scrollLeft+=10; else if(e.clientX<r.left+28) bar.scrollLeft-=10; st.sl=bar.scrollLeft; }
  if(!q||!bar||barOf(q)!==bar||q.classList.contains('swb')||q.classList.contains('frmbtn')) return; const k=key(q); if(k===st.ck) return;
  if(live(bar)){ if(q.classList.contains('off')) return; st.ck=k; sup=false; q.click(); const nb=document.querySelector(st.k==='m'?'.mbrow':'.subjbar'); if(nb&&st.k==='m'){ nb.scrollLeft=st.sl; nb.style.touchAction='none'; } st.cur=null; sup=true; return; }
  if(q!==st.cur){ st.cur.classList.remove('dragon'); st.cur=q; } st.cur.classList.add('dragon'); },true);
 const end=(e)=>{ if(!st) return; const s=st; st=null; if(s.cur) s.cur.classList.remove('dragon');
  if(s.moved&&live(s.b)){ sup=true; setTimeout(()=>{ sup=false; },450); if(window.SB_AUTOHIDE!==false) setTimeout(()=>{ try{ sbFinHide(); }catch(e){} },350); return; }
  if(s.moved&&s.cur&&s.cur!==s.p){ s.cur.click(); sup=true; setTimeout(()=>{ sup=false; },450); } };
 onDoc('pointerup',end,true); onDoc('pointercancel',()=>{ if(st){ if(st.cur) st.cur.classList.remove('dragon'); st=null; } },true);
 onDoc('click',e=>{ if(sup&&barOf(e.target)){ sup=false; e.stopPropagation(); e.preventDefault(); } },true);
})();
(function(){ const SEL='.slsk .ck.nxt,.slsk .ck .ear,.slinner .ck.nudge,.slbar .auxcap.nudge,.sled .slgl.nudge,.slnext,#sldone.rdy,#slback button.blink'; SB.ph=false;
 window.sbPulseApply=function(){ try{ document.querySelectorAll(SEL).forEach(e=>e.classList.toggle('pon',e.classList.contains('altB')?!SB.ph:!!SB.ph)); }catch(e){} };
 const _d=sbDraw; sbDraw=function(){ const r=_d.apply(this,arguments); sbPulseApply(); return r; };
 onTick(()=>{ SB.ph=!SB.ph; sbPulseApply(); },900);
 const _d2=sbDraw; sbDraw=function(){ const r=_d2.apply(this,arguments); try{ sbCompact(); }catch(e){} return r; }; })();
onTick(()=>{ SB.pf=!SB.pf; document.querySelectorAll('.slsk .ck.nxt.faint').forEach(e=>e.classList.toggle('pof',SB.pf)); },1500);
window.SB_DOCK=true;
SB.dk=[];
DK_MB = [[null,'ふつう'],['might','ひょっと'],['may','かも'],['will','きっと'],['must','ちがいない'],['could','できるかも'],['can','できる'],['should','ほうが']];
onDoc('click',e=>{ const t=e.target.closest&&e.target.closest('[data-dk]'); if(t&&SB.dk[+t.dataset.dk]){ e.stopPropagation(); SB.dk[+t.dataset.dk](); return; } const s=e.target.closest&&e.target.closest('.dksg1'); if(s){ const k=s.parentNode&&s.parentNode.dataset.sg; if(k) dkApply(k,s.dataset.ref); } },true);
onDoc('input',e=>{ if(e.target&&e.target.classList&&e.target.classList.contains('dkinp')){ const b=e.target.parentNode.querySelector('.dksg'); if(b) b.innerHTML=dkSugHtml(e.target.dataset.k,e.target.value); } });
onDoc('keydown',e=>{ if(e.target&&e.target.classList&&e.target.classList.contains('dkinp')&&e.key==='Enter'){ const k=e.target.dataset.k, q=e.target.value.trim(); if(!q) return; const f=e.target.parentNode.querySelector('.dksg1'); if(f){ dkApply(k,f.dataset.ref); return; } if(k==='obj'){ const ref=sbRef('O',sbText('O',{noun:q,det:'auto',adj:[]})); if(ref){ dkApply('obj',ref); return; } } toast('「'+q+'」は読めませんでした（ことば登録へ）'); } });
(function(){ let on=false, cap=false; const pick=(x)=>{ const ps=[...document.querySelectorAll('.dkmb .dkd')]; if(!ps.length) return -1; let best=-1,bd=1e9; ps.forEach((p,i)=>{ const r=p.getBoundingClientRect(); const c=(r.left+r.right)/2; const d=(x>=r.left&&x<=r.right)?0:Math.abs(x-c); if(d<bd){ bd=d; best=i; } }); return best; };
 const go=(x)=>{ const i=pick(x); if(i<0) return; const m=sbM(); const al=allowedModals(m).map(y=>y.id); const id=DK_MB[i][0]; if(id!==null&&!al.includes(id)) return; if((m.modal||null)===id) return; finModal(id,true); };
 onDoc('pointerdown',e=>{ if(e.target.closest&&e.target.closest('.dkmb')){ on=true; APP.dkDrag=true; const d=document.querySelector('.dk2'); if(d) d.classList.add('drag'); go(e.clientX); } },true);
 onDoc('pointermove',e=>{ if(!on) return; if(!cap){ cap=true; try{ document.getElementById('scene').setPointerCapture(e.pointerId); }catch(x){} } go(e.clientX); },true);
 const up=()=>{ if(!on) return; on=false; cap=false; APP.dkDrag=false; const d=document.querySelector('.dk2'); if(d) d.classList.remove('drag'); }; onDoc('pointerup',up,true); onDoc('pointercancel',up,true); })();
(function(){ const o=renderScene; set_renderScene(function(){ const r=o.apply(this,arguments); try{ dkSync(); }catch(e){} return r; }); })();
SB_CATS = [['cond','条件'],['idm','慣用句'],['col','口語'],['plc','どこで'],['tm','いつ']];
SB_XL = [['me','わたし'],['you','あなた'],['him','彼'],['her','彼女'],['us','わたしたち'],['them','彼ら'],['the weather','天気'],['the news','ニュース'],['the teacher','先生'],['my mom','母'],['the map','地図']];
(function(){ const o=sbDraw; sbDraw=function(){ o.apply(this,arguments); const el=document.getElementById('slot'); if(!el) return;
 el.querySelectorAll('.slcb').forEach(b=>b.onclick=()=>{ const k=b.dataset.cat, m=sbM(), f=m.lead&&LEADF(m.lead); if((k==='idm'||k==='col')&&f&&f.need&&m.leadX&&sbLeadCat(f)===k){ sbDo(()=>{ m.leadX=null; m.leadXja=null; }); return; } sbCatRand(k); });
 el.querySelectorAll('.slcx').forEach(b=>b.onclick=()=>{ const k=b.dataset.cx; sbDo(()=>sbCatClr(k)); }); }; })();
}
