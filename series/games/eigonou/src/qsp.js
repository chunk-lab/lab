import { BIGX } from './bigdict.js';
import { SET } from './common.js';
import { fwCoordPair } from './coord.js';
import { FRONTS, LEX, N, T, TM, V, needsObj, predV, sentenceComplete, sentenceText } from './engine.js';
import { AC, APP, mutate, normalize, openFinish, render, snapshot, undo } from './play.js';
import { QB, QB_PREPS, qbCand, qbDetOpt, qbDraw, qbOn, qbPick, qbRes, qbSync, qbWithInt } from './qbar.js';
import { FR_THATN, frComma, frCopulaCtx, frGloss, frLiteral, frLiteralP, frLiveEmpty, qspFinalGuard } from './qfr.js';
import { DETS, FWX, fwLemmas, fwTenseFor, fwTimeOpt, qbWithDet } from './qfw.js';
import { fxHasPrefix, fxIsFixed, fxLook } from './qfx.js';
// ===== 文をそのまま打ち続ける（スペースで次へ）=====
export let QS;
export function qspOn(){ try{ return SET().qspace!==false && qbOn(); }catch(e){ return false; } }
export let qspN;
// 2語以上のことばの先頭語（look → look for … など）を集める
export function qspHeads(){ if(QS.heads) return QS.heads; const H=new Set(); const add=en=>{ const w=qspN(en).split(' '); if(w.length>1) H.add(w[0]); };
 try{ Object.keys(LEX).forEach(k=>{ if(Array.isArray(LEX[k])) LEX[k].forEach(x=>x&&x.en&&add(x.en)); }); if(typeof FWX!=='undefined') Object.keys(FWX.T).forEach(add); if(typeof FRONTS!=='undefined') FRONTS.forEach(x=>x&&x.en&&add(x.en)); }catch(e){}
 QS.heads=H; return H; }
export function qspTok(rest){ const m=rest.match(/^(\S+)( ?)/); if(!m) return null; let t=m[1], p=''; const pm=t.match(/^(.*?[A-Za-z0-9'’)])([.?!,;]+)$/); if(pm){ t=pm[1]; p=pm[2]; } return {w:t,p,len:m[0].length,complete:!!m[2]||!!p}; }
export function qspUndo(r){ while(APP.hist.length>r.h) undo(); if(r.s0){ try{ if(snapshot()!==r.s0){ const d=JSON.parse(r.s0); APP.S=d.S; APP.active=d.active; APP.lsub=d.lsub; APP.pass=d.pass||{}; APP.open=null; APP.finished=false; normalize(); render(); } }catch(e){} } QB.pre=r.snap.pre; QB.det=r.snap.det; QB.mod=r.snap.mod; QB.pl=r.snap.pl; }
export function qspLastOff(){ return QS.st.length? QS.st[QS.st.length-1].pre.length : 0; }
export function qspWords(s,strict){ let t=String(s||'').toLowerCase().replace(/’/g,"'"); [["'d better"," had better"],["'d like"," would like"],["'s got"," has got"],["i'm","i am"],["it's","it is"],["that's","that is"],["he's","he is"],["she's","she is"],["what's","what is"],["let's","let us"],["won't","will not"],["can't","cannot"],["cannot","can not"],["n't"," not"],["'ll"," will"],["'ve"," have"],["'d"," would"],["'re"," are"],["'m"," am"]].forEach(([a,b])=>{ t=t.split(a).join(b); }); t=t.replace(/\b(there|here|who|where|how|when|why|everyone|everybody|nobody|something|nothing|somebody|everything|you|we|they)'s\b/g,function(m,w){ return w+(/^(you|we|they)$/.test(w)?'s':' is'); }).replace(/[^a-z0-9 ]/g,' ');
 return t.split(/\s+/).filter(w=>w).map(w=>/^(a|an|the)$/.test(w)?'a':(strict?w:w.length>3?w.replace(/ies$/,'y').replace(/(es|s)$/,''):w)); }
// am/is/are・was/were・do/does・have/has は、主語がまだ決まっていない間は同じ語として比べる（主語しだいで形が決まるため）
export let qspAg;
export function qspFaithful(inp,endOff){ let T,E; try{ E=qspWords(inp.value.slice(0,endOff)); T=qspWords(sentenceText(APP.S)); }catch(e){ return true; }
 try{ const ct=QS.st.find(e=>e.o&&e.o.id==='fr_c_that'&&/,\s*$/.test(e.pre)); if(ct){ T=T.filter(x=>x!=='that'); E=E.map(w=>w.replace(/,$/,'')); } }catch(e){}
 try{ const rl=APP.S.main.subs.rel; if(rl&&rl.red){ const ie=E.indexOf(rl.red); let it=T.indexOf('who'); if(it<0){ const i2=T.indexOf('that'); if(i2>=0&&T[i2+1]==='is'){ it=i2; } } if(ie>=0&&it>=0){ const dropN=(T[it]==='that')?3:2; E=E.filter((x,i)=>i!==ie); T=T.filter((x,i)=>i<it||i>=it+dropN); } } }catch(e){}
 try{ const tid=APP.S.main.time, tm=tid&&TM(tid); if(tm){ const tw=qspWords(tm.en).map(w=>w.replace(/,$/,'')); const strip=arr=>{ const a=arr.map(w=>w.replace(/,$/,'')); for(let i=0;i+tw.length<=a.length;i++){ if(tw.every((x,j)=>a[i+j]===x)) return a.slice(0,i).concat(a.slice(i+tw.length)); } return null; }; const t2=strip(T)||T.map(w=>w.replace(/,$/,'')), e2=strip(E); if(t2&&e2&&t2.map(qspAg).join(' ')===e2.map(qspAg).join(' ')) return true; const nb=a=>a.filter(w=>!/^(am|is|are|was|were|will|be)$/.test(w)).map(qspAg).join(' '); if(t2&&e2&&nb(t2)===nb(e2)&&e2.length<=t2.length) return true; } }catch(e){}
 if(T.map(qspAg).join(' ')===E.map(qspAg).join(' ')) return true;
 if(T.join(' ')===E.join(' ')) return true; { let hc=false; try{ hc=!!(APP.S.main.subs.comp); }catch(e){} if(hc){ const g=w=>w.filter(x=>x!=='that').map(qspAg).join(' '); if(g(T)===g(E)) return true; } } { const f=w=>w.filter(x=>!/^(do|does|did)$/.test(x)).join(' '); let cs=false; try{ const ic=APP.S.main.subs.comp&&APP.S.main.subs.comp.c; cs=!!(ic&&ic.subj&&!ic.pred&&/^(do|does|did)$/.test(E[E.length-1])); }catch(e){} if(!cs&&f(T)===f(E)) return true; } if((QB.pre||QB.det||QB.mod) && (E.join(' ').startsWith(T.join(' '))||E.map(qspAg).join(' ').startsWith(T.map(qspAg).join(' ')))) return true; return false; }
// 節をひらく語（who / which など）は、中身がまだ空なので、その語の手前までが一致していればよい
// まだ文に出ない語（being など）：その語の手前までが一致していればよい
export function qspPendOK(inp,endOff){ try{ const E=qspWords(inp.value.slice(0,endOff)).map(qspAg), T=qspWords(sentenceText(APP.S)).map(qspAg); return E.length===T.length+1&&E.slice(0,T.length).join(' ')===T.join(' '); }catch(e){ return false; } }
// もっと長い熟語（there is など、ふつうの語だけでできたもの）の先頭だけを打った段階の候補か
export function qspPfxOpt(o,w){ const e=qspN(o.en), k=qspN(w); return /^[a-z' ]+$/.test(e)&&e.startsWith(k+' '); }
// 「as tall as」のように、あとの語まで先に出る形：打った語が、できた文の先頭部分ならよい
export function qspAheadOK(inp,endOff){ try{ const E=qspWords(inp.value.slice(0,endOff)).map(qspAg), T=qspWords(sentenceText(APP.S)).map(qspAg); return T.length>E.length&&T.slice(0,E.length).join(' ')===E.join(' ')&&T.length-E.length<=1; }catch(e){ return false; } }
export function qspCommit(inp,o,text,endOff,single,fm){ if(!fm&&o&&o.pos==='verb'&&!o.f&&single){ try{ const w0=String(text).trim().toLowerCase(), b0=String(o.en||'').toLowerCase().replace(/^to /,''); if(w0!==b0&&/^[a-z]+$/.test(w0)){ const L0=fwLemmas(w0).filter(x=>x.l===b0&&x.f&&x.f!=='same'); if(L0.length) fm=L0[0].f; } }catch(e){} } const t00=AC().tense; const snap={pre:QB.pre,det:QB.det,mod:QB.mod,pl:QB.pl}; const h=APP.hist.length; const s0=snapshot(); const clean=!snap.pre&&!snap.det&&!snap.mod; QB.q=''; const wh0=AC().q&&AC().q.wh; qbPick(o,true);
 // What did you eat? ：目的語がたずねる語（what）になる疑問文で、目的語を持てる動詞（eat・read など）を選んだら、疑問が消えないよう目的語の穴を開けておく
 if(wh0==='obj'){ const c1=AC(); if(c1.q&&!c1.q.wh&&c1.pred&&c1.pred.k==='v'){ const hl=APP.hist.length; mutate(()=>{ const cc=AC(); cc.q.wh='obj'; cc.useObj=true; },null); if(APP.hist.length>hl) APP.hist.pop(); } }
 if(fm){ const hl=APP.hist.length; mutate(()=>{ const cc=AC(); cc.qfree=true; cc.tense=fwTenseFor(t00,fm); },null); if(APP.hist.length>hl) APP.hist.pop(); } QS.off=endOff; QS.st.push({pre:inp.value.slice(0,endOff),h,s0,n:APP.hist.length,snap,o,tok:text,single:!!(single&&clean)}); const bad=()=>!o.lax&&!(o.fw&&/^fr_/.test(String(o.id)))&&!(o.pend&&qspPendOK(inp,endOff))&&!(o.ahead&&qspAheadOK(inp,endOff))&&!qspFaithful(inp,endOff)&&!(/\s/.test(String(text).trim())&&qspPrefixOK(inp,endOff));
 // 時を表す語（tonight など）が、先に打った助動詞が決めた時制を勝手に変えたときは、打った側の時制を優先して戻す
 if(bad()&&AC().tense!==t00){ const hl=APP.hist.length; mutate(()=>{ const cc=AC(); cc.qten=true; cc.tense=t00; },null); if(APP.hist.length>hl) APP.hist.pop(); }
 { const ent=QS.st[QS.st.length-1]; if(ent) ent.alts=QS.curAlts||null; }
 if(!bad()&&/^fr_lit/.test(String(o.id))) QS.litN=(QS.litN||0)+1;
 if(bad()){ const r=QS.st.pop(); qspUndo(r); QS.off=r.pre.length-(inp.value.slice(0,endOff).length-inp.value.slice(0,endOff).length); QS.off=qspLastOff(); return false; } return true; }
// 目的の語（熟語）が、いまの状況で見つかるか。{exact, prefix}
export function qspFind(phrase){ const res=qbRes(phrase); const k=qspN(phrase); return {exact:res.find(o=>qspN(o.en)===k&&!/^(fwp_|fwt_|fwpd_|fwpre_|fwint_|fwdet_)/.test(String(o.id)))||null, prefix:res.some(o=>qspN(o.en).startsWith(k+' ')), res}; }
export function qspRun(inp){ let g=0; const H=qspHeads();
 while(g++<40){ let rest=inp.value.slice(QS.off); const lead=rest.match(/^\s+/); if(lead){ QS.off+=lead[0].length; rest=rest.slice(lead[0].length); } if(!rest) break;
  const toks=[]; let o=0; const t0=qspTok(rest); const LIM=(t0&&(/^(as|to)$/i.test(t0.w)||(/^not$/i.test(t0.w)&&/^\s*not\s+only\b/i.test(rest))))?6:4; while(toks.length<LIM){ const t=qspTok(rest.slice(o)); if(!t||!t.complete) break; toks.push(t); o+=t.len; if(t.p) break; }
  if(!toks.length) break;
  const clean=!QB.pre&&!QB.det&&!QB.mod; const prev=QS.st[QS.st.length-1];
  const ends=k=>{ let n=0; for(let i=0;i<k;i++) n+=toks[i].len; return n; };
  let handled=false, wait=false;
  if(toks.length>=2&&clean&&!QS.noLit&&!QS.st.length&&/^no$/i.test(toks[0].w)&&!toks[0].p&&/^one$/i.test(toks[1].w)){ const ph=toks[0].w+' '+toks[1].w; const ff=qspFind(ph); if(ff&&ff.exact&&/^fwng_/.test(String(ff.exact.id))&&qspCommit(inp,ff.exact,ph,QS.off+ends(2),false)){ QS.curAlts=null; continue; } }
  if(toks.length===1&&clean&&!QS.noLit&&!toks[0].p&&!QS.st.length&&/^no$/i.test(toks[0].w)) break;
  if(toks.length>=2&&clean&&!QS.noLit&&!QS.st.length&&/^no$/i.test(toks[0].w)&&!toks[0].p&&!AC().subj&&!(typeof fxLook==='function'&&(fxLook(toks[0].w+' '+toks[1].w)!=null||fxLook(toks[0].w+' '+toks[1].w+(toks[2]?' '+toks[2].w:''))!=null))&&!/^(way|problem|worries|doubt|idea|kidding|wonder|longer|more|matter|good|thanks|thank|sir|doubt|wonder)$/i.test(toks[1].w)){ const od=qbDetOpt('no')[0]; if(od&&qspCommit(inp,od,toks[0].w,QS.off+ends(1),true)){ QS.curAlts=null; continue; } }
  if(clean&&!QS.noLit&&QS.st.length&&AC().subj&&!AC().pred&&!toks[0].p&&typeof fwTimeOpt==='function'){ const mg=String(toks[0].w).match(/^([A-Za-z]+) (in|on|at)$/i); if(mg&&!/^(is|am|are|was|were|be|been|being)$/i.test(mg[1])&&!QB_PREPS.includes(qspN(mg[1]))&&!DETS[qspN(mg[1])]){ if(toks.length===1) break; if(toks.length===2&&/^the$/i.test(toks[1].w)&&!toks[1].p) break; let tp=false; for(const k of [2,1]){ if(toks.length<k+1) continue; const seg=toks.slice(1,k+1); if(seg.slice(0,-1).some(t=>t.p)) continue; const str=mg[2].toLowerCase()+' '+seg.map(t=>t.w.replace(/[.,!?]+$/,'')).join(' '); let ok=null; try{ ok=fwTimeOpt(str); }catch(e){} if(ok){ tp=true; break; } } if(tp){ const vo=qbRes(mg[1]).find(o=>o.act&&o.pos==='verb'&&!/^(fr_|fwdet_|fwpre)/.test(String(o.id))&&!/^(come_in|go_in|get_in)/.test(String(o.id))); const r0=inp.value.slice(QS.off); const m0=r0.match(/^\s*[A-Za-z]+/); if(vo&&m0&&qspCommit(inp,vo,mg[1],QS.off+m0[0].length,true)){ QS.curAlts=null; continue; } } } }
  if(toks.length===2&&clean&&!QS.noLit&&!toks[0].p&&!toks[1].p&&/^(in|on|at)$/i.test(toks[1].w)&&/^[a-z]+$/i.test(toks[0].w)&&!/^(is|am|are|was|were|be|been|being)$/i.test(toks[0].w)&&!QB_PREPS.includes(qspN(toks[0].w))&&!DETS[qspN(toks[0].w)]&&QS.st.length&&AC().subj&&!AC().pred) break;
  if(toks.length>=3&&clean&&!QS.noLit&&!toks[0].p&&!toks[1].p&&/^(in|on)$/i.test(toks[1].w)&&/^time$/i.test(toks[2].w)&&QS.st.length&&AC().subj&&!AC().pred){ const ph=toks.slice(0,3).map(t=>t.w).join(' '); const ff=qspFind(ph); if(ff&&ff.exact&&/^fwvt_/.test(String(ff.exact.id))&&qspCommit(inp,ff.exact,ph,QS.off+ends(3),false)){ QS.curAlts=null; const tl=toks[2]; if(tl&&tl.p&&/[.?!]/.test(tl.p)&&!inp.value.slice(QS.off).trim()) QS.fin=true; continue; } }
  { const lw=toks.map(t=>String(t.w).toLowerCase()); if(clean&&!QS.noLit&&!toks.slice(0,-1).some(t=>t.p)&&typeof fwCoordPair==='function'){ const CJ2={both:'and',either:'or',neither:'nor'}; const lastP=!!toks[toks.length-1].p; const wd=lw.join(' ').split(' ');
   if(!lastP&&CJ2[lw[0]]&&lw.length<4&&(lw.length<3||lw[2]===CJ2[lw[0]])&&(!QS.st.length||!AC().subj||(lw[0]!=='neither'&&AC().pred&&AC().pred.id&&!AC().obj))) break;
   if(!lastP&&wd[0]==='not'&&wd[1]==='only'&&wd.length<6&&(wd.length<4||(wd[3]==='but'&&(wd.length<5||wd[4]==='also')))) break;
   const full=(CJ2[lw[0]]&&lw.length===4&&lw[2]===CJ2[lw[0]])||(wd[0]==='not'&&wd[1]==='only'&&wd.length===6&&wd[3]==='but'&&wd[4]==='also'); if(full){ const ph=toks.map(t=>t.w).join(' '); const ff=qspFind(ph); if(ff&&ff.exact&&/^fwcp_/.test(String(ff.exact.id))&&qspCommit(inp,ff.exact,ph,QS.off+ends(toks.length),false)){ QS.curAlts=null; const tl=toks[toks.length-1]; if(tl&&tl.p&&/[.?!]/.test(tl.p)&&!inp.value.slice(QS.off).trim()) QS.fin=true; continue; } } } }
  if(toks.length===2&&clean&&!QS.noLit&&/^as$/i.test(toks[0].w)&&/^well$/i.test(toks[1].w)&&!toks[0].p&&!toks[1].p) break;
  // 複数語の限定詞（a lot of / a couple of / a bit of / plenty of / lots of / a few）：1語ずつ確定せず、まとめて限定詞にする
  if(!QS.noLit&&!toks[0].p&&!QB.det&&!QB.mod){ const MW=['a lot of','lots of','a couple of','a bit of','plenty of','a few']; let hd=false;
   for(let k=Math.min(toks.length,3);k>=2&&!hd;k--){ if(toks.slice(0,k-1).some(t=>t.p)) continue; const ph=toks.slice(0,k).map(t=>t.w).join(' ').toLowerCase(); if(!MW.includes(ph)) continue; const dd=qbRes(ph).find(o=>/^(fwdet_|fwpd_)/.test(String(o.id))&&qspN(o.en)===qspN(ph)||(QB.pre&&/^fwpd_/.test(String(o.id)))); if(dd&&qspCommit(inp,dd,toks.slice(0,k).map(t=>t.w).join(' '),QS.off+ends(k),false)){ hd=true; } }
   if(hd) continue;
   const lw=toks.map(t=>t.w.toLowerCase()); if(toks.length<=2&&!toks[toks.length-1].p&&((toks.length===1&&/^(a|lots|plenty)$/.test(lw[0]))||(toks.length===2&&/^(a lot|a couple|a bit|lots|plenty)$/.test(lw.join(' '))))) break; }
  // X) 定型表現・つなぎ語の表（good morning / so as to / of course not）
  if(typeof fxLook==='function'&&clean){ const first=!frLiveEmpty()===false&&!(APP.S.seg&&APP.S.seg.length);
   for(let k=toks.length;k>=1&&!handled&&!wait;k--){ const ph=toks.slice(0,k).map(t=>t.w).join(' '); const ja=fxLook(ph); if(ja==null) continue; if(!toks[k-1].p&&/^(i|you|he|she|we|they|it|that|this|there)('|\s)/i.test(ph)){ if(k<toks.length) continue; if(!QS.noLit){ wait=true; continue; } } if(ph.toLowerCase()==='as well'&&/^as$/i.test((toks[k]||{}).w||'')) continue; if(qspClPending()) continue; { const g0=qspFind(ph).exact; if(g0&&(g0.gram||g0.pos==='conj')) continue; } if(k===1&&!(first&&fxIsFixed(ph))) continue; if(k>=2&&fxIsFixed(ph)&&QS.st.length&&!/[,.!?;]\s*$/.test(inp.value.slice(0,QS.off))&&!(QS.st[QS.st.length-1]&&QS.st[QS.st.length-1].o&&/^fr_/.test(String(QS.st[QS.st.length-1].o.id)))) continue; if(k>=2&&toks.slice(0,k-1).some(t=>t.p)) continue;
    const lo=frLiteralP(ph,ja); if(qspCommit(inp,lo,ph,QS.off+ends(k),false)){ handled=true; const t=toks[k-1]; if(t.p){ if(/[.?!]/.test(t.p)) QS.fin=true; else if(t.p===','){ frComma(); } } } }
   if(!handled){ const ph=toks.map(t=>t.w).join(' '); if(!toks[toks.length-1].p&&!/^(a|an|the|my|your|his|her|our|their|this|that|some|any)$/i.test(toks[toks.length-1].w)&&fxHasPrefix(ph)&&!/^(i|you|he|she|we|they|it)$/i.test(toks[0].w)&&!QB_PREPS.includes(qspN(toks[0].w))&&!DETS[qspN(toks[0].w)]) wait=true; } }
  if(handled){ const tl=toks[toks.length-1]; if(tl&&tl.p&&/[.?!]/.test(tl.p)&&!inp.value.slice(QS.off).trim()) QS.fin=true; else if(tl&&(tl.p===','||tl.p===';')&&/[,;]\s*$/.test(inp.value.slice(0,QS.off))){ if(tl.p===','&&(qspCommaThat(inp)||qspWhenFix(inp))) continue; { const le=QS.st[QS.st.length-1]; if(le) le.single=false; } const cm=qbRes(','); if(cm[0]&&!(cm[0].fw&&/^fr_/.test(String(cm[0].id)))){ try{ qbPick(cm[0],true); }catch(e){} } } continue; } if(wait) break;
  if(prev&&prev.o&&/^fwdet_/.test(String(prev.o.id))&&toks.length>=1&&!QS.noLit&&clean===false&&!toks[toks.length-1].p&&toks.length<4&&qspAdjWord(toks[toks.length-1].w)&&qspAdjWord(toks[0].w)) break;
  if(toks.length===1&&clean&&!QS.noLit&&!toks[0].p&&prev&&/^(will|would|may|might|could|should|must|can)$/i.test(String(prev.tok).trim())&&/^has?$/i.test(toks[0].w)) break;
  const DSTOP=/^(is|are|was|were|am|and|or|but|to|in|on|at|for|with|of|from|by|will|can|would|could|should|must|may|might|do|does|did|has|have|had|if|when|because|that|who|which|as|than|too|so|then|here|there|now|today|tomorrow|yesterday|again|very|i|you|he|she|we|they|it|not|never|always|often)$/i;
  if(prev&&prev.o&&/^fwpre_/.test(String(prev.o.id))&&QB.pre&&!QB.det&&toks[0]&&!toks[0].p&&/^(this|that|these|those)$/i.test(toks[0].w)&&!QS.noLit){ if(toks.length===1) break; }
  let skipA=false; if(prev&&prev.o&&/^fwpre_/.test(String(prev.o.id))&&toks[0]&&!toks[0].p&&/^(this|that|these|those)$/i.test(toks[0].w)&&toks[1]&&!DSTOP.test(toks[1].w)) skipA=true; if(prev&&/^(will|would|may|might|could|should|must|can)$/i.test(String(prev.tok).trim())&&toks[0]&&/^has?$/i.test(toks[0].w)&&toks[1]&&/^(to|a|an|the|my|your|his|her|our|their|some|any|no|this|that|these|those|one|two|three)$/i.test(toks[1].w)) skipA=true;
  if(prev&&prev.o&&prev.o.pos==='verb'&&clean&&!QS.noLit&&!toks[0].p&&/^(in|on|at)$/i.test(toks[0].w)&&typeof fwTimeOpt==='function'&&!/^(is|am|are|was|were|be|been|being)$/i.test(String(prev.tok).trim())){ if(toks.length===1) break; if(toks.length===2&&/^the$/i.test(toks[1].w)&&!toks[1].p) break; for(const k of [2,1]){ if(toks.length<k+1) continue; const seg=toks.slice(1,k+1); if(seg.slice(0,-1).some(t=>t.p)) continue; const str=toks[0].w.toLowerCase()+' '+seg.map(t=>t.w.replace(/[.,!?]+$/,'')).join(' '); let ok=null; try{ ok=fwTimeOpt(str); }catch(e){} if(ok){ skipA=true; break; } } }
  // A) 直前に確定した1語とくっついて熟語になるか（look ＋ for）
  if(!skipA&&prev&&(prev.single||(prev.o&&/^fwdet_(this|that)$/.test(String(prev.o.id))&&toks[0]&&/^one$/i.test(toks[0].w))||(prev.o&&/^fwdet_the$/.test(String(prev.o.id))&&toks[0]&&/^(same|first|last|next|other|only|whole)$/i.test(toks[0].w)))&&prev.o&&!/^fr_(?!imp$)/.test(String(prev.o.id))&&(['verb','adv','adj','aux','wh'].includes(prev.o.pos)||(/^more$/i.test(prev.tok)&&toks[0]&&/ly$/i.test(toks[0].w))||(/^(this|that)$/i.test(prev.tok)&&toks[0]&&/^one$/i.test(toks[0].w))||(/^the$/i.test(prev.tok)&&toks[0]&&/^(same|first|last|next|other|only|whole)$/i.test(toks[0].w))||(/^fwdet_/.test(String(prev.o.id))&&toks.length>=2&&qspAdjWord(toks[0].w))||(/^(last|next|this)$/i.test(prev.tok)&&toks[0]&&/^(week|month|year|weekend|summer|winter|spring|autumn|fall|morning|afternoon|evening|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(toks[0].w)))&&!(prev.o.fw&&/^fwpre/.test(String(prev.o.id)))){ 
   for(let k=toks.length;k>=1&&!handled&&!wait;k--){ const words=[prev.tok.replace(/\s+$/,''),...toks.slice(0,k).map(t=>t.w)]; const phrase=words.join(' ');
    const r=QS.st.pop(); qspUndo(r); const start=qspLastOff(); let f=qspFind(phrase), fm=null; if(!f.exact&&/^[a-z]+$/i.test(words[0])){ for(const L of qspLem(words[0].toLowerCase())){ const f2=qspFind([L.l,...words.slice(1)].join(' ')); if(f2.exact){ f=f2; fm=L.f; break; } if(f2.prefix&&!f.prefix&&!f.exact){ f=f2; fm=L.f; } } }
    if(f.exact){ const seg=inp.value.slice(start); const ws=seg.match(/^\s*/)[0].length; const pieces=seg.slice(ws); let c=0; for(let i=0;i<words.length;i++){ const tt=qspTok(pieces.slice(c)); if(!tt) break; c+=tt.len; } if(/^fr_hd$/.test(String(f.exact.id))&&typeof FWX!=='undefined'){ const al=(FWX.T[qspN(phrase)]||[]).filter(o=>o.act); QS.curAlts=al.length?al:null; } const okc=qspCommit(inp,f.exact,phrase,start+ws+c,false,fm); QS.curAlts=null; if(!okc){ qspRedo(inp,r); } else { handled=true; } }
    else if(f.prefix && k===toks.length && !toks[k-1].p && !/^(a|an|the|my|your|his|her|our|their|this|that|some|any)$/i.test(toks[k-1].w)){ // もっと長い熟語になりそう：直前の語を戻して待つ
     qspRedo(inp,r); wait=true; }
    else qspRedo(inp,r); }
  }
  if(handled){ const tl=toks[toks.length-1]; if(tl&&tl.p&&/[.?!]/.test(tl.p)&&!inp.value.slice(QS.off).trim()) QS.fin=true; else if(tl&&(tl.p===','||tl.p===';')&&/[,;]\s*$/.test(inp.value.slice(0,QS.off))){ if(tl.p===','&&(qspCommaThat(inp)||qspWhenFix(inp))) continue; { const le=QS.st[QS.st.length-1]; if(le) le.single=false; } const cm=qbRes(','); if(cm[0]&&!(cm[0].fw&&/^fr_/.test(String(cm[0].id)))){ try{ qbPick(cm[0],true); }catch(e){} } } continue; } if(wait) break;
  // B) 新しい熟語（how many / as soon as）
  if((clean||(QB.pre&&!QB.det&&!QB.mod))&&!QS.noLit&&QS.st.length&&toks.length>=2&&!toks[0].p&&/^(these|those|this|that)$/i.test(toks[0].w)&&!/^(is|are|was|were|am|and|or|but|to|in|on|at|for|with|of|from|by|will|can|would|could|should|must|may|might|do|does|did|has|have|had|if|when|because|that|who|which|as|than|too|so|then|here|there|now|today|tomorrow|yesterday|again|very|i|you|he|she|we|they|it|not|never|always|often)$/i.test(toks[1].w)){ let dd=qbRes(toks[0].w).find(o=>new RegExp('^(fwdet_|fwpd_)'+toks[0].w.toLowerCase()+'$').test(String(o.id))); if(!dd&&QB.pre){ const pre0=QB.pre, w0=toks[0].w.toLowerCase(); dd={id:'fwpd_'+w0,e:'🔖',en:pre0+' '+w0,ja:'…つづけて打つ',pos:'aux',fw:1,act:()=>{ QB.pre=pre0+' '+w0; }}; } if(dd&&qspCommit(inp,dd,toks[0].w,QS.off+ends(1),true)){ QS.curAlts=null; continue; } }
  for(let k=toks.length;k>=2&&!handled&&!wait;k--){ QS.look=toks[k]&&toks[k].w; if(k===2&&toks[2]&&/^to$/i.test(toks[2].w)&&/^(will|would|may|might|could|should|must|can)$/i.test(toks[0].w)&&/^has?$/i.test(toks[1].w)) continue; if(!clean||QB_PREPS.includes(qspN(toks[0].w))||(DETS[qspN(toks[0].w)]&&!(toks.length>=3&&k===3&&qspAdjWord(toks[1].w))&&!(toks[1]&&/^(most|least|first|last|only|main|next|real|same|biggest|greatest|easiest|hardest|simplest)$/i.test(toks[1].w))&&!(/^more$/i.test(toks[0].w)&&toks[1]&&/^[a-z]+ly$/i.test(toks[1].w))&&!(/^(this|that)$/i.test(toks[0].w)&&toks[1]&&/^one$/i.test(toks[1].w))&&!(/^(last|next|this)$/i.test(toks[0].w)&&toks[1]&&/^(week|month|year|weekend|summer|winter|spring|autumn|fall|morning|afternoon|evening|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(toks[1].w)))) break; const phrase=toks.slice(0,k).map(t=>t.w).join(' '); const f=qspFind(phrase); if(f&&f.exact&&/^fr_/.test(String(f.exact.id))&&qspClPending()) continue;
   if(f.exact){ QS.curAlts=/^fwel_/.test(String(f.exact.id))?f.res.filter(o=>o!==f.exact&&/^fwel_/.test(String(o.id))):null; }
   if(f.exact&&qspCommit(inp,f.exact,phrase,QS.off+ends(k),false)){ handled=true; }
   else if(!f.exact&&f.prefix && k===toks.length && !toks[k-1].p && !/^(a|an|the|my|your|his|her|our|their|this|that|some|any)$/i.test(toks[k-1].w)){ wait=true; } QS.curAlts=null; }
  if(handled){ const tl=toks[toks.length-1]; if(tl&&tl.p&&/[.?!]/.test(tl.p)&&!inp.value.slice(QS.off).trim()) QS.fin=true; else if(tl&&(tl.p===','||tl.p===';')&&/[,;]\s*$/.test(inp.value.slice(0,QS.off))){ if(tl.p===','&&(qspCommaThat(inp)||qspWhenFix(inp))) continue; { const le=QS.st[QS.st.length-1]; if(le) le.single=false; } const cm=qbRes(','); if(cm[0]&&!(cm[0].fw&&/^fr_/.test(String(cm[0].id)))){ try{ qbPick(cm[0],true); }catch(e){} } } continue; } if(wait) break;
  // 限定詞＋形容詞は、3語目（名詞）を待つ
  if(toks.length===1&&!toks[0].p&&QB.det&&!QS.noLit&&qspAdjWord(toks[0].w)&&prev&&/^fwdet_/.test(String(prev.o.id))) break;
  if(toks.length===2&&clean&&!QS.noLit&&DETS[qspN(toks[0].w)]&&!toks[0].p&&(!toks[1].p||/^(best|worst)$/i.test(toks[1].w))&&qspAdjWord(toks[1].w)) break;
  if(toks.length===1&&!toks[0].p&&!QS.noLit&&/^(do|does|did|is|are|am|was|were|can|could|will|would|should|have|has|had|must|may|might|shall)(n't)?$/i.test(toks[0].w)&&/,\s*$/.test(inp.value.slice(0,QS.off))) break;
  if(toks.length===1&&clean&&!QS.noLit&&(!toks[0].p&&(qspMnHead(toks[0].w)||/^(who|what|someone|anyone|everyone|somebody|anybody|everybody|something|anything|everything)$/i.test(toks[0].w)))) break;
  // 文頭の形容詞は、次の語（Young as he is の as）を待つ
  if(toks.length===1&&clean&&!QS.noLit&&!toks[0].p&&!QS.st.length&&/^[A-Za-z]{3,}$/.test(toks[0].w)&&typeof qspAdjWord==='function'&&qspAdjWord(toks[0].w)&&!/^(first|last|next|this|that|more|most|some|any|many|much|other|every|each|all|both|no|few|little)$/i.test(toks[0].w)) break;
  if(toks.length>=2&&toks.length<4&&clean&&!QS.noLit&&!QS.st.length&&!toks[0].p&&!toks[1].p&&/^as$/i.test(toks[1].w)&&/^[A-Za-z]{3,}$/.test(toks[0].w)&&qspAdjWord(toks[0].w)&&(toks.length<3||/^(i|you|he|she|we|they|it|[a-z]+)$/i.test(toks[2].w))) break;
  if(toks.length===1&&clean&&!QS.noLit&&!toks[0].p&&!QS.st.length&&/^(today|tomorrow|tonight|yesterday)$/i.test(toks[0].w)) break;
  if(toks.length===1&&clean&&!QS.noLit&&!toks[0].p&&QS.st.length&&AC().subj&&AC().pred&&AC().pred.k==='v'&&AC().pred.id&&AC().pred.id!=='be'&&!AC().obj&&/^[A-Za-z]{3,}$/.test(toks[0].w)&&typeof qspAdjWord==='function'&&qspAdjWord(toks[0].w)&&!DETS[qspN(toks[0].w)]&&!QB_PREPS.includes(qspN(toks[0].w))&&!/^(first|last|next|this|that|more|most|some|any|many|much|other|every|each|all|both|no|few|little|very|too|so|really|quite|well|ever|never|just|even|also|still|already|always|often|sometimes|usually|soon|now|then|here|there|today|tomorrow|yesterday|tonight|home|away|back|up|down|out|off|fast|hard|late|early|long|far|near|straight|right|left|better|best|worse|worst)$/i.test(toks[0].w)&&!((LEX.verbs||[]).some(v=>v.en===toks[0].w.toLowerCase()))) break;
  // C) 1語
  const t=toks[0]; QS.look=toks[1]&&toks[1].w; if(toks.length===1&&!t.p&&/^(last|next|this|these|those|that)$/i.test(t.w)&&(clean||(QB.pre&&!QB.det&&!QB.mod))&&!QS.noLit){ break; } if(/^all$/i.test(t.w)&&toks.length===1&&!t.p&&frLiveEmpty()&&!(APP.S.seg&&APP.S.seg.length)) break; let res=qbRes(t.w); if(QB.det&&typeof QB.det==='string'&&QB.det.length>1){ const dk=qspN(QB.det)+' '; const r2=res.filter(o=>o.fw||!(o.en&&qspN(o.en).startsWith(dk))); if(r2.length) res=r2; } const plF=QB.pl; let top=res[0]; { const fro=res.find(o=>/^fr_/.test(String(o.id))&&o.id!=='fr_hd_'+qspN(t.w)); if(fro&&(fro.id!=='fr_all'||/^(i|you|he|she|we|they|it|my|your|his|her|our|their|people|one)$/i.test(String(QS.look||''))||toks.length<2&&false)) top=fro; } if(top&&qspPfxOpt(top,t.w)&&!/^fr_/.test(String(top.id))){ const t2=res.find(o=>o.act&&!qspPfxOpt(o,t.w)&&!/^fwp[a-z]*_/.test(String(o.id))); if(t2) top=t2; } if(top&&/^fwpre_/.test(String(top.id))){ const alt=res.find(o=>!o.fw&&!/^fwpre_/.test(String(o.id))&&qspN(o.en)===qspN(t.w)); if(alt) top=alt; }
  if(QS.hint&&!res.some(o=>/^fwdet_/.test(String(o.id))&&qspN(o.en)===qspN(t.w))){ const hh=res.find(o=>o.act&&o.id===QS.hint.id); if(hh){ top=hh; QS.hintUsed=true; } }
  if(/^to$/i.test(t.w)&&top&&/^fw_to_/.test(String(top.id))){ const pv=QS.st[QS.st.length-1]; const pw=pv?String(pv.tok).toLowerCase().split(' ')[0]:''; const lem=[pw].concat(qspLem(pw).map(x=>x.l)); const INFV=/^(want|need|like|love|hate|hope|plan|decide|try|begin|start|expect|promise|refuse|learn|forget|remember|agree|manage|afford|prefer|wish|ask|tell|order|allow|enable|help|get|have|ought|used|going|able|seem|appear|happen|tend|continue|offer|choose|fail|threaten|attempt|intend|deserve|dare|swear|pretend|cannot|can't|about|bound|likely|supposed|ready|glad|happy|sad|sorry|afraid|sure|certain|eager|willing|unable|due|how|what|where|which|who|whom|whether|in order|so as)$/i; const prevInf=!pv||lem.some(x=>INFV.test(x))||(pv.o&&['adj','wh'].includes(pv.o.pos)); if(!prevInf){ const pr=res.find(o=>/^fwpre_to$/.test(String(o.id))); if(pr) top=pr; } }
  { const pv=QS.st[QS.st.length-1]; if(top&&top.pos==='adv'&&pv&&pv.o&&pv.o.pos==='verb'&&/ /.test(pv.tok)){ const alt=res.find(o=>o.pos==='noun'); if(alt) top=alt; } }
  if(t.p===','&&/^(is|was|are|were)$/i.test(t.w)&&top&&top.id!=='qb_be'){ const be=res.find(o=>o.id==='qb_be'); if(be) top=be; }
  if(t.p&&/[.?!]/.test(t.p)&&QS.st.length&&/^(not|no|too|either|so)$/i.test(t.w)&&typeof frLiteral==='function'){ const lo=frLiteral(t.w,true); if(lo) top=lo; }
  if(!top&&!QS.noLit){ QS.failEnd=QS.off+t.len; if(qspRepair(inp)) continue; }
  if(!top&&!QS.noLit&&qspUnknown(t.w)){ res=qbRes(t.w); top=res[0]; }
  if(!top&&!QS.noLit&&typeof frLiteral==='function'){ const lo=frLiteral(t.w,true); if(lo) top=lo; }
  if(!top){ QS.stuck=t.w; break; } QS.stuck=null;
  if(top&&top.pos==='noun'&&!top.fw&&!QB.det&&!QB.pre&&!DETS[qspN(t.w)]&&/^[a-z]+$/i.test(t.w)) top=qbWithDet(top,'bare',plF);
  { const endOff=QS.off+t.len; const fixNoun=o=>(o&&o.pos==='noun'&&!o.fw&&!QB.det&&!QB.pre&&!DETS[qspN(t.w)]&&/^[a-z]+$/i.test(t.w))?qbWithDet(o,'bare',plF):o;
  const oth=res.filter(o=>o!==top&&o.act&&!/^fwp[a-z]*_/.test(String(o.id))&&!qspPfxOpt(o,t.w)); const dets=oth.filter(o=>/^fwdet_/.test(String(o.id))&&qspN(o.en)===qspN(t.w)); const same=oth.filter(o=>!dets.includes(o)&&qspN(o.en)===qspN(t.w)), rest0=oth.filter(o=>!dets.includes(o)&&!same.includes(o)); const cands=[top].concat(same.map(fixNoun),dets,rest0.slice(0,6).map(fixNoun)).concat(res.filter(o=>o.late&&o.act&&o!==top)); let ok=false;
  for(const cd of cands){ QS.curAlts=cands.filter(x=>x!==cd&&x!==top||x===top&&cd!==top); if(qspCommit(inp,cd,t.w,endOff,true)){ ok=true; break; } } QS.curAlts=null;
  if(!ok){ if(QS.noLit){ QS.stuck=t.w; break; } QS.failEnd=endOff; if(qspRepair(inp)) continue; const lo=frLiteral(t.w,true); if(lo) qspCommit(inp,lo,t.w,endOff,false); else { QS.stuck=t.w; break; } } }
  if(t.p){ if(/[.?!]/.test(t.p)){ QS.fin=true; } else if(t.p===','||t.p===';'){ if(t.p===','&&(qspCommaThat(inp)||qspWhenFix(inp))) continue; { const le=QS.st[QS.st.length-1]; if(le) le.single=false; } const c=qbRes(','); if(c[0]) { const sn={pre:QB.pre,det:QB.det,mod:QB.mod,pl:QB.pl}; /* , は文の区切り */ try{ qbPick(c[0],true); }catch(e){} } } }
 } }
export function qspRedo(inp,r){ qbPick2(inp,r); }
// 語が置けなかったとき：直前の数語を「ほかの読み」に取りかえて、リテラル（そのまま挿入）なしで最後まで置けるか試す（do＝動詞／Do…？ など）
export function qspRepair(inp){ if((QS.btN||0)>=30) return false; const n=QS.st.length; const target=QS.failEnd;
 for(let i=n-1;i>=Math.max(0,n-4);i--){ const e=QS.st[i]; if(!e||!e.alts||!e.alts.length) continue; const saved=QS.st.slice(i);
  for(const alt of e.alts){ if((QS.btN||0)>=30) break; QS.btN=(QS.btN||0)+1;
   while(QS.st.length>i){ const r=QS.st.pop(); qspUndo(r); } QS.off=qspLastOff();
   const l0=QS.litN||0; let ok=false;
   if(qspCommit(inp,alt,e.tok,e.pre.length,true)){ const nl=QS.noLit; QS.noLit=true; QS.stuck=null; try{ qspRun(inp); }finally{ QS.noLit=nl; } ok=(QS.litN||0)===l0 && !QS.stuck && QS.off>=target; }
   if(ok) return true;
   while(QS.st.length>i){ const r=QS.st.pop(); qspUndo(r); } QS.off=qspLastOff(); QS.litN=l0; }
  while(QS.st.length>i) { const r=QS.st.pop(); qspUndo(r); } QS.off=qspLastOff(); saved.forEach(r=>qspRedo(inp,r)); QS.off=qspLastOff(); QS.stuck=null; }
 return false; }
// 文が最後まで打たれたのに未完成のとき：直前の語の別の読み（is＝〜している／〜だ など）に取り替えて、完成する読みを探す
export function qspRepairDone(inp){ const n=QS.st.length; const endOff=QS.off; if(!n) return false; let tries=0;
 for(let i=n-1;i>=Math.max(0,n-5)&&tries<16;i--){ const e=QS.st[i]; if(!e||e.o&&/^fr_/.test(String(e.o.id))) continue; const saved=QS.st.slice(i);
  while(QS.st.length>i){ const r=QS.st.pop(); qspUndo(r); } QS.off=qspLastOff();
  let cands=[]; try{ cands=qbRes(String(e.tok).trim()).filter(o=>o.act&&o.id!==e.o.id&&!/^fwp[a-z]*_/.test(String(o.id))&&!qspPfxOpt(o,String(e.tok).trim())).slice(0,5); }catch(x){}
  for(const alt of cands){ if(++tries>16) break; const l0=QS.litN||0; let ok=false;
   if(qspCommit(inp,alt,e.tok,e.pre.length,true)){ const nl=QS.noLit; QS.noLit=true; QS.stuck=null; try{ qspRun(inp); }finally{ QS.noLit=nl; } let comp=false; try{ comp=sentenceComplete(APP.S); }catch(x){} ok=(QS.litN||0)===l0&&!QS.stuck&&QS.off>=endOff&&comp; }
   if(ok){ QS.fin=true; try{ qspClObj(); }catch(e){} return true; }
   while(QS.st.length>i){ const r=QS.st.pop(); qspUndo(r); } QS.off=qspLastOff(); QS.litN=l0; }
  while(QS.st.length>i){ const r=QS.st.pop(); qspUndo(r); } QS.off=qspLastOff(); saved.forEach(r=>qspRedo(inp,r)); QS.off=qspLastOff(); QS.stuck=null; }
 return false; }
export function qbPick2(inp,r){ QB.q=''; QB.pre=r.snap.pre; QB.det=r.snap.det; QB.mod=r.snap.mod; QB.pl=r.snap.pl; qbPick(r.o,true); QS.st.push({pre:r.pre,h:r.h,s0:r.s0,n:APP.hist.length,snap:r.snap,o:r.o,tok:r.tok,single:r.single,alts:r.alts}); }
export function qspInput(inp){ if(QS.busy) return; QS.busy=true; try{
  const v=inp.value; let g=0;
  while(QS.st.length && !v.startsWith(QS.st[QS.st.length-1].pre) && g++<60){ const r=QS.st.pop(); qspUndo(r); }
  QS.off=qspLastOff(); QS.fin=false; QS.stuck=null; QS.btN=0; QS.noLit=false;
  qspRun(inp);
  const rest=inp.value.slice(QS.off).trim(); QB.q=rest; QB.idx=0;
  { const rr0=inp.value.slice(QS.off).trim(); if(!QS.fin&&/^[.?!]$/.test(rr0)&&QS.st.length) QS.fin=true; }
  if(QS.fin){ try{ qspClObj(); }catch(e){} try{ if(!sentenceComplete(APP.S)) qspRepairDone(inp); }catch(e){} qspFinalGuard(inp); let done=false; try{ done=sentenceComplete(APP.S)&&!APP.finished; }catch(e){} if(done){ QS.st=[]; QS.off=0; inp.value=''; QB.q=''; QS.busy=false; QB.res=[]; qbDraw(); openFinish(); qbSync(); return; } }
  } finally { QS.busy=false; } qbSync(); const rest2=inp.value.slice(QS.off).trim(); QB.q=rest2; QB.idx=0; qbCand(); qspChunkCand(inp); }
// 打っている途中の語が、直前の語と熟語になる候補を先頭に足す（look f → look for）
export function qspChunkCand(inp){ const prev=QS.st[QS.st.length-1]; const q=QB.q; if(!q||!prev||!prev.single||/\s/.test(q)) return; if(!prev.o||!['verb','adv','adj','aux','wh'].includes(prev.o.pos)||/^fr_/.test(String(prev.o.id))) return;
 const keepRes=QB.res.slice(); const phrase=prev.tok+' '+q; QS.busy=true; const r=QS.st.pop(); qspUndo(r); let L=[]; try{ L=qbRes(phrase).filter(o=>qspN(o.en).startsWith(qspN(prev.tok)+' ')); }catch(e){} 
 qbPick2(inp,r); QS.busy=false; QS.st[QS.st.length-1].pre=r.pre; QB.q=q; QB.res=keepRes; QB.idx=0;
 if(!L.length){ qbDraw(); return; } const C=L.slice(0,3).map(o=>Object.assign({},o,{qsPre:()=>{ const rr=QS.st.pop(); qspUndo(rr); QS.off=qspLastOff(); },qsText:o.en})); QB.res=C.concat(QB.res.filter(x=>!C.some(c=>c.en===x.en))); QB.idx=0; qbDraw(); }
// タップ・Enterで選んだとき：入力欄の打ちかけを、選んだ語に置き換えて確定する
export function qspPick(o){ const inp=document.getElementById('qin'); if(!inp) return; QS.busy=true; try{
  if(o.qsPre) o.qsPre();
  const typed=inp.value.slice(QS.off).trim(); const head=inp.value.slice(0,QS.off);
  let text=o.qsText||qspShow(o,typed); const DW='(the|a|an|my|your|his|her|our|their|its|this|that|these|those|some|any|no|every|each)'; const preDet=!!QB.pre&&new RegExp(' '+DW+'$','i').test(String(QB.pre)); if((QB.det||preDet)&&!o.fw&&!o.qsText) text=text.replace(/^(the|a|an|my|your|his|her|our|their|its|this|that|these|those|some|any|no|every|each)\s+/i,''); const keepPre=o.id&&/^fwpre?d?_/.test(String(o.id)); if(typed&&o.pos==='noun'&&!o.fw&&!o.qsText&&!QB.det&&!QB.pre&&text.replace(new RegExp('^'+DW+' ','i'),'').toLowerCase()===typed.toLowerCase()) text=typed;
  if(!o.qsPre&&!o.qsText&&/^[A-Za-z'][A-Za-z' ]*$/.test(text)&&qspPickViaRun(inp,o,head,text)) return;
  const snap={pre:QB.pre,det:QB.det,mod:QB.mod,pl:QB.pl}; const h=APP.hist.length; const clean=!snap.pre&&!snap.det&&!snap.mod;
  let oo=o; if(!keepPre) QB.pre=null; if(QB.mod && !o.fw){ const m=QB.mod; QB.mod=null; if(m.intens && o.pos==='adj') oo=qbWithInt(o,m.intens); }
  if(QB.det && !o.fw){ const d=QB.det; QB.det=null; oo=qbWithDet(oo,d,QB.pl); }
  QB.q=''; QB.res=[]; QB.idx=0; qbDraw(); oo.act();
  inp.value=head+text+' '; QS.off=inp.value.length; QS.st.push({pre:inp.value,h,n:APP.hist.length,snap,o:oo,tok:text,single:clean&&!/\s/.test(text)&&!o.fw});
 } finally { QS.busy=false; } qbSync(); }

// タップ＝その語を打ったのと同じ：入力欄に語を書いて、打ったときと同じ解析（qspRun）に通す。通らなければ元の直接確定にもどす
export function qspPickViaRun(inp,o,head,text){ const n0=QS.st.length, l0=QS.litN||0, off0=QS.off, fin0=QS.fin, val0=inp.value;
 inp.value=head+text+' '; QS.off=off0; QS.hint=o; QS.hintUsed=false; QB.q=''; QB.res=[]; let ok=false;
 try{ qspRun(inp); ok=QS.st.length>n0&&(QS.litN||0)===l0&&!QS.stuck&&!inp.value.slice(QS.off).trim(); }catch(e){ ok=false; }
 QS.hint=null;
 if(ok) return true;
 QS.busy=true; try{ while(QS.st.length>n0){ const r=QS.st.pop(); qspUndo(r); } }finally{ QS.busy=false; }
 QS.litN=l0; QS.stuck=null; QS.fin=fin0; QS.off=off0; inp.value=val0; return false; }
// 画面側で「もどる」などが押されたら、入力欄の確定済みの語もそろえる
export function qspSyncStack(inp){ if(!inp||!QS.st.length) return; let ch=false; while(QS.st.length && APP.hist.length<QS.st[QS.st.length-1].n){ const r=QS.st.pop(); QB.pre=r.snap.pre; QB.det=r.snap.det; QB.mod=r.snap.mod; ch=true; } if(ch){ inp.value=qspLastOff()? QS.st[QS.st.length-1].pre : ''; QS.off=inp.value.length; QB.q=''; QB.res=[]; qbDraw(); } }

export function qspLem(w){ const L=[]; try{ fwLemmas(w).forEach(x=>L.push({l:x.l,f:x.f})); }catch(e){} if(/ies$/.test(w)) L.push({l:w.slice(0,-3)+'y',f:null}); if(/es$/.test(w)) L.push({l:w.slice(0,-2),f:null}); if(/s$/.test(w)) L.push({l:w.slice(0,-1),f:null}); return L; }

export function qspPrefixOK(inp,endOff){ try{ const E=qspWords(inp.value.slice(0,endOff)).map(qspAg).join(' '), T=qspWords(sentenceText(APP.S)).map(qspAg).join(' '); return E===T||E.startsWith(T+' '); }catch(e){ return true; } }

export function qspShow(o,typed){ let e=String(o.en||'').trim(); if(!e) return typed; if(/[:\/]/.test(e)&&!/\s\/\s*$/.test(e)&&typed) return typed; if(o.fw&&/^fwpre/.test(String(o.id))) return typed.length>=e.length?typed:e; return e; }



export function qspClPending(){ try{ if(APP.active!=='main') return false; const m=APP.S.main, v=predV(m); return !!(v&&v.fr==='cl'&&m.subj&&!m.subs.comp&&!m.obj&&m.type==='normal'); }catch(e){ return false; } }

// 辞書にない語：いま入る場所（名詞・形容詞）に合わせて仮登録し、文の流れを切らない
export function qspUnknown(w){ try{ const x=String(w).toLowerCase(); if(!/^[a-z]{2,}$/.test(x)||typeof BIGX==='undefined') return false; const c=AC(); let gl=null; try{ gl=frGloss(w); }catch(e){} const ja=gl||w;
 const nounCtx=!!QB.det||(!!QB.pre&&!/^(be|is|am|are|was|were)$/.test(String(QB.pre)))||(c.pred&&c.pred.k==='v'&&typeof needsObj==='function'&&needsObj(c)&&!c.obj);
 const adjCtx=c.pred&&c.pred.k==='s'&&!c.pred.id&&!QB.det&&!QB.pre;
 if(nounCtx){ BIGX.n=BIGX.n||[]; if(!BIGX.n.some(e=>e.w===x)) BIGX.n.push({w:x,ja,u:/s$/.test(x)&&x.length>3?2:1,ln:'thing'}); return true; }
 if(adjCtx){ BIGX.a=BIGX.a||[]; if(!BIGX.a.some(e=>e.w===x)) BIGX.a.push({w:x,ja,jt:'na'}); return true; }
 return false; }catch(e){ return false; } }
export function qspAdjWord(w){ try{ const x=String(w).toLowerCase(); if(!/^[a-z]+$/.test(x)) return false; if(/^(better|best|worse|worst|very|really|same|first|last|next|other|only|whole|main|own)$/.test(x)) return true; const st=LEX.states||[]; const ok=y=>st.some(s=>String(s.en).toLowerCase()===y&&!s.noun&&!s.loc&&!s.weather); if(ok(x)) return true; const c=[]; if(/est$/.test(x)){ c.push(x.slice(0,-3),x.slice(0,-2)); if(/(.)\1est$/.test(x)) c.push(x.slice(0,-4)); if(/iest$/.test(x)) c.push(x.slice(0,-4)+'y'); } if(/er$/.test(x)){ c.push(x.slice(0,-2),x.slice(0,-1)); if(/(.)\1er$/.test(x)) c.push(x.slice(0,-3)); if(/ier$/.test(x)) c.push(x.slice(0,-3)+'y'); } return c.some(ok); }catch(e){ return false; } }

// The problem is, I am tired.（that を省いてコンマ）：be のあとのコンマを that 文として扱う
export function qspCommaThat(inp){ try{ if(APP.active!=='main'||APP.S.frm) return false; const le=QS.st[QS.st.length-1]; if(!le||!le.o||le.o.id!=='qb_be'||!/^(is|was|are|were)$/i.test(String(le.tok).trim())) return false; if(typeof frCopulaCtx!=='function'||frCopulaCtx()!=='bare') return false; { const sn=N(AC().subj); if(!sn||!FR_THATN.test(String(sn.en).replace(/^(the|a|an|my|your|his|her|our|their) /i,'').split(' ').pop())) return false; } const o=qbRes('that').find(x=>x.id==='fr_c_that'); if(!o) return false; return qspCommit(inp,o,'that',QS.off,false); }catch(e){ return false; } }
export function qspWhenFix(inp){ return qspWhenFix0(inp)||qspTimeFix(inp); }
export function qspTimeFix(inp){ try{ const st0=QS.st[0]; if(!st0||!st0.o||!/^(the )?(first|last|next) time$/i.test(String(st0.tok).trim())||!(st0.o.id==='fr_hd'||(/^tm_(next|last)time$/.test(String(st0.o.id))&&QS.st.length>1))) return false; const endOff=st0.pre.length; const tk=String(st0.tok).trim(); while(QS.st.length){ const r=QS.st.pop(); qspUndo(r); } QS.off=qspLastOff(); QS.stuck=null; const alt=qbRes(tk).find(o=>!/^fr_/.test(String(o.id))&&o.act&&o.pos==='conj'); if(!alt) return false; return qspCommit(inp,alt,tk,endOff,false); }catch(e){ return false; } }
export function qspWhenFix0(inp){ try{ const st0=QS.st[0]; if(!st0||!st0.o||!/^when$/i.test(String(st0.tok).trim())||!/^fw_when_/.test(String(st0.o.id))||/〜とき/.test(String(st0.o.id))) return false; const m=APP.S.main; if(!(m.q&&m.q.wh==='time')) return false; const endOff=st0.pre.length; while(QS.st.length){ const r=QS.st.pop(); qspUndo(r); } QS.off=qspLastOff(); QS.stuck=null; const alt=qbRes('when').find(o=>/^fw_when_.*〜とき/.test(String(o.id))); if(!alt) return false; return qspCommit(inp,alt,'When',endOff,false); }catch(e){ return false; } }
export function qspClObj(){ const m=APP.S.main; const v=predV(m); const cc=m.subs.comp&&m.subs.comp.c; if(!v||v.fr!=='cl'||m.type!=='normal'||!cc||!cc.subj||cc.pred||cc.obj||Object.keys(cc.subs||{}).length||m.obj) return; const tw=V(v.id+'_o'); if(!tw) return; mutate(()=>{ delete m.subs.comp; m.pred={k:'v',id:tw.id}; m.useObj=true; m.obj=cc.subj; APP.active='main'; APP.open=null; },null); }
export let QSP_MNH;
export function qspMnHead(w){ try{ if(!QSP_MNH){ QSP_MNH=new Set(); (LEX.manners||[]).forEach(m=>{ const p=String(m.en).toLowerCase().split(' '); if(p.length>1&&!DETS[p[0]]&&!QB_PREPS.includes(p[0])) QSP_MNH.add(p[0]); }); (LEX.states||[]).forEach(m=>{ if(!m.sidiom) return; const p=String(m.en).toLowerCase().split(' '); if(p.length>1&&!DETS[p[0]]&&!QB_PREPS.includes(p[0])) QSP_MNH.add(p[0]); }); } return QSP_MNH.has(String(w).toLowerCase());  }catch(e){ return false; } }

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_qsp(){
QS = {st:[],off:0,busy:false,heads:null};
qspN = s=>String(s==null?'':s).toLowerCase().replace(/[.,?!]/g,'').replace(/\s+/g,' ').trim();
qspAg = w=>/^(learn|dream|burn|spell|spoil|smell|leap|kneel|lean|spill)(ed|t)$/.test(w)?w.replace(/(ed|t)$/,'~t'):/^(who|whom|which|that)$/.test(w)?'rl~':/^(would|had)$/.test(w)?'hd~':/^(am|is|are)$/.test(w)?'be~':/^(was|were)$/.test(w)?'bd~':/^(do|does)$/.test(w)?'do~':/^(have|has)$/.test(w)?'hv~':w;
QSP_MNH = null;
}
