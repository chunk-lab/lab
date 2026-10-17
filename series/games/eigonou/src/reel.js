import { set_pick } from './play.js';
import { say, toast } from './common.js';
import { LEX, MD, MN, MODALS, N, P, PL, ST, T, TM, V, allowedModals, allowedTenses, cap, needsObj, predS, predV, sentenceComplete, sentenceParts, sentenceText } from './engine.js';
import { ENV, onDoc } from './env.js';
import { MPAT } from './idioms.js';
import { objRankRefs } from './objrank.js';
import { APP, armFin, entry, esc, finModal, hlJaStr, hlTrack, isNegChunk, mannerFits, mutate, objFits, openFinish, passOk, pick, render, renderScene, resetAll, snapshot, stateFitsSubj, verbFitsSubj } from './play.js';
import { vcOf } from './vcomp.js';
import { FREQADV } from './vocab_a1.js';
// ================= ルーレット文（完成画面で、まとまりを回して入れ替える） =================
// 英文のまとまりを押す→カードの中（英文と訳の間）にそのまとまりの候補の帯。押す／◀▶で入れ替え。
// 変えるたびに読み上げ・訳・キャラが変わる。型は気持ちバー右端の「型…」から。
export let REEL_KINDS;
export let FRAME_IDS;
export function reelKindOf(key){ const k=String(key||''); if(!/^m\./.test(k)) return null; const t=k.split('.').pop(); return REEL_KINDS.includes(t)? t : null; }
export function reelKind(){ return APP.reelKey? reelKindOf(APP.reelKey) : null; }
export function reelFits(test){ try{ return !!test(); }catch(e){ return false; } }
// 候補（今の文に合うもの。よく使う順に上から）
export function reelCands(kind, m){
 const v=predV(m); const T=(o)=>Object.assign(JSON.parse(JSON.stringify(m)),o);
 if(kind==='subj'){ const ids=['i','you','he','she','we','they','mom','dad','boy','girl','ken','mika','teacher','friends','dog','cat','q_all_we','q_some_friends','q_none_they','q_one_friends','q_each_they','q_most_students'];
  return ids.filter(id=>P(id)).map(id=>'p:'+id).filter(r=>r!==m.obj && (v? reelFits(()=>verbFitsSubj(T({subj:r}),v)) : predS(m)? reelFits(()=>stateFitsSubj(T({subj:r}),predS(m))) : true)); }
 if(kind==='verb'){ const seen=new Set(), out=[];
  LEX.verbs.forEach(x=>{ if(out.length>=90||x.hidden||x.caus||x.fr==='cl'||(typeof vcOf==='function'&&vcOf(x))||x.id.startsWith('__')) return; const key=x.en+(x.tail||'')+(x.prep||''); if(seen.has(key)) return;
   if(reelFits(()=>verbFitsSubj(m,x))){ seen.add(key); out.push(x.id); } });
  const hasO=!!((m.useObj&&m.obj)||APP.reelObjMemo), rank=id=>{ const f=V(id).fr; return (f==='intr')===hasO?1:0; };
  out.sort((a,b)=>rank(a)-rank(b));
  if(v){ const i=out.indexOf(v.id); if(i>=0) out.splice(i,1); out.unshift(v.id); } return out; }
 if(kind==='obj' && v){ const out=[]; const RK=(typeof objRankRefs==='function'&&objRankRefs(v.id))||[]; RK.forEach(r=>{ if(r===m.subj) return; if(m.type==='imp'&&m.imp==='letme'&&(r==='p:i'||r==='p:we')) return; out.push(r); }); LEX.people.filter(p=>!p.thing).forEach(p=>{ const r='p:'+p.id; if(m.type==='imp'&&m.imp==='letme'&&(r==='p:i'||r==='p:we')) return; if(r!==m.subj && !out.includes(r) && reelFits(()=>objFits(v,r))) out.push(r); });
  LEX.things.forEach(t=>{ const r='t:'+t.id; if(['mine','yours','hisp','hers','ours','theirs'].includes(t.id)) return; if(out.length<40 && !out.includes(r) && reelFits(()=>objFits(v,r))) out.push(r); }); if(m.obj && !out.includes(m.obj)) out.unshift(m.obj); return out.slice(0,40); }
 if(kind==='state'){ const s=predS(m); const out=LEX.states.filter(x=>!!x.noun===!!(s&&s.noun) && reelFits(()=>stateFitsSubj(m,x))).slice(0,40).map(x=>x.id); if(s && !out.includes(m.pred.id)) out.unshift(m.pred.id); return out; }
 if(kind==='freq') return [null].concat((typeof FREQADV!=='undefined'?FREQADV:[]).map(f=>f.id));
 if(kind==='tail') return [];
 if(kind==='place') return [null].concat(LEX.places.filter(p=>!p.loc||p.id===m.place).slice(0,40).map(p=>p.id).concat(m.place&&!LEX.places.slice(0,40).find(p=>p.id===m.place)?[m.place]:[]));
 if(kind==='time'){ const al=allowedTenses(T({time:null}),{kind:'main'}); return [null].concat(LEX.times.filter(t=>t.ts.some(x=>al.includes(x))).slice(0,30).map(t=>t.id)); }
 if(kind==='manner') return [null].concat(LEX.manners.filter(x=>reelFits(()=>mannerFits(m,x))).slice(0,30).map(x=>x.id));
 if(kind==='aux'){ return [null].concat(reelModals(m)); }
 return [];
}
export function reelModals(m){ const a=allowedModals(m).map(x=>x.id); const all=(window.allowedModalsAll||allowedModals)(m).map(x=>x.id); FRAME_IDS.forEach(id=>{ if(all.includes(id)&&!a.includes(id)) a.push(id); }); return a; }
export function reelVal(kind,m){ return {subj:m.subj,verb:m.pred&&m.pred.k==='v'?m.pred.id:null,obj:m.useObj?m.obj:null,state:m.pred&&m.pred.k==='s'?m.pred.id:null,place:m.place,time:m.time,manner:m.manner,aux:m.modal||null,freq:m.freq||null}[kind]; }
export function reelLabel(kind,val){ if(val==null) return kind==='aux'?'—':'なし'; if(kind==='freq'){ const f=(FREQADV||[]).find(x=>x.id===val); return f?f.en:val; } try{
 if(kind==='subj'||kind==='obj') return N(val).en.replace(/^(a|an) /,'');
 if(kind==='verb'){ const x=V(val); return x.en+(x.tail?' '+x.tail:'')+(x.prep?' '+x.prep:''); }
 if(kind==='state') return ST(val).en; if(kind==='place') return PL(val).en; if(kind==='time') return TM(val).en; if(kind==='manner') return MN(val).en;
 if(kind==='aux'){ const md=(typeof MODALS!=='undefined'&&MODALS.find(x=>x.id===val))||MD(val); return md?md.en:val; } }catch(e){} return String(val); }
export function reelSet(kind,m,val){
 if(kind==='subj') m.subj=val;
 if(kind==='verb'){ if(m.useObj&&m.obj) APP.reelObjMemo=m.obj; m.pred={k:'v',id:val}; const x=V(val);
  if(x.fr==='intr'){ m.useObj=false; m.obj=null; }
  else if(x.fr==='tr'||(x.fr==='both'&&(m.obj||APP.reelObjMemo))){ m.useObj=true; if(!m.obj||!reelFits(()=>objFits(x,m.obj))){ const mm=APP.reelObjMemo; m.obj = mm&&reelFits(()=>objFits(x,mm))? mm : null; } } }
 if(kind==='obj') m.obj=val;
 if(kind==='state') m.pred={k:'s',id:val};
 if(kind==='place') m.place=val; if(kind==='time') m.time=val; if(kind==='manner') m.manner=val;
 if(kind==='aux') m.modal=val;
 if(kind==='freq'){ m.freq=val; if(val==='never') m.neg=false; }
 reelFix(m);
}
export function reelFix(m){
 if(m.passive && typeof passOk==='function'){ m.passive=false; if(passOk(m)) m.passive=true; }
 const v=predV(m);
 if(v && needsObj(m) && (!m.obj || !(m.freeObj&&m.obj) && !reelFits(()=>objFits(v,m.obj)))){ if(window.SB_NOFILL){ if(m.obj) m.obj=null; } else { const c=reelCands('obj',Object.assign({},m,{obj:null})); if(c.length) m.obj=c[0]; else m.useObj=false; } }
 if(m.modal && !reelModals(m).includes(m.modal)) m.modal=null;
 if(m.modal && typeof MPAT!=='undefined' && MPAT[m.modal]){ const P_=MPAT[m.modal]; if(P_.neg) m.neg=true; if(P_.noneg) m.neg=false; if(P_.noq) m.q=null; }
 let al=allowedTenses(m,{kind:'main'}); if(m.time && TM(m.time)){ const tt=al.filter(t=>TM(m.time).ts.includes(t)); if(!tt.length) m.time=null; else if(!tt.includes(m.tense)) m.tense=tt[0]; }
 al=allowedTenses(m,{kind:'main'}); if(!al.includes(m.tense)) m.tense=al[0];
}
export function reelStep(key, dir){
 const kind=reelKindOf(key); if(!kind) return; const m=APP.S.main; const L=reelCands(kind,m); if(L.length<2) return;
 const cur=reelVal(kind,m); let i=L.indexOf(cur); i=(i+dir+L.length)%L.length;
 APP.hist.push(snapshot()); reelSet(kind,m,L[i]); APP.reelKey=key; reelAfter();
}
// 完成カードのまとまり（押すと選ぶだけ。入れ替えはカードの中の帯で）
export let REEL_NAME;
export function reelChunksHtml(parts, FA){
 const pulse=APP.hand && !APP.reelKey; const m=APP.S.main;
 const insOk = false; // 英文の中の＋はやめて「副」ボタンに（v40）
 const plus=(key,i)=>{ FA['ins'+i]=()=>{ APP.bandTap=false; APP.reelKey = APP.reelKey===key? null : key; renderScene(); }; return `<span class="rins ${APP.reelKey===key?'on':''}" data-fa="ins${i}">＋</span>`; };
 // 前回の文と「役割ごと」に比べて、バーで変わったかたまりを黄色で塗る（次の変化まで残す）
 try{ hlTrack(parts.map(p=>({k:String(p.key),t:String(p.en||'')})), hlJaStr()); }catch(e){}
 const HM=APP.hlMark&&APP.hlMark.en;
 const out=[]; parts.forEach((p,i)=>{ out.push(chunk(p,i));
  if(insOk && String(p.key)==='m.subj' && !m.freq && predV(m)) out.push(plus('m.freq',i));
  if(insOk && i===parts.length-1 && (!m.manner||!m.place||!m.time)) out.push(plus('m.tail',i+100)); });
 return out.join('');
 function chunk(p,i){ const key=String(p.key), kind=reelKindOf(key), on=APP.reelKey===key && kind;
  if(kind && FA){ FA['ck'+i]=()=>{ APP.bandTap=false; if(APP.reelKey===key){ APP.reelKey=null; } else { APP.reelKey=key; APP.reelPop=key; clearTimeout(reelPopT); reelPopT=setTimeout(()=>{ APP.reelPop=null; const e=document.querySelector('.rpop'); if(e) e.remove(); },1100); } APP.finIdle=false; armFin(); renderScene(); }; }
  const en=(i===0?cap(p.en):p.en)+(i===parts.length-1?(sentenceParts(APP.S).punct||'.'):'');
  const pop=on&&APP.reelPop===key?`<i class="rpop">${REEL_NAME[kind]}</i>`:'';
  const hand=APP.hand&&['bar','word'].includes(APP.finStage)&&!APP.reelKey&&kind&&key===reelHandKey(parts)?'<i class="rhand">👆</i>':'';
  const hit=!!(HM&&HM.has(i));
  return `<span class="fc2 pos-${p.pos} ${hit?'hlc':''} ${kind?'rk':''} ${on?'ron':''} ${pulse&&kind?'rpulse':''} ${APP.reelFlash===key?'rflash':''} ${isNegChunk(p)?'negc':''}" ${kind&&FA?`data-fa="ck${i}"`:''} style="--d:${i*.25}s">${pop}${hand}<b>${esc(en)}</b></span>`; }
}
export let reelPopT;
// カードの中の帯：選んだまとまりの候補だけ
export function reelBandHtml(FA){
 const m=APP.S.main, k=reelKind(); if(!k) return '';
 if(k==='aux') return reelFramesHtml(FA);
 if(k==='tail'){ const T=[['m.manner','🎯 どうやって'],['m.place','📍 どこで'],['m.time','🕒 いつ']]; return '<div class="rband"><div class="rbscroll">'+T.map(([key,l],i)=>{ FA['rt'+i]=()=>{ APP.bandTap=false; APP.reelKey=key; renderScene(); }; return `<span class="rcand" data-fa="rt${i}">${l}</span>`; }).join('')+'</div></div>'; }
 const L=reelCands(k,m), cur=reelVal(k,m); if(L.length<2) return '<div class="rband none">ほかの候補はありません</div>';
 FA.rprev=()=>{ APP.bandTap=false; reelStep(APP.reelKey,-1); }; FA.rnext=()=>{ APP.bandTap=false; reelStep(APP.reelKey,1); };
 const band=L.map((v,i)=>{ FA['rc'+i]=()=>{ APP.bandTap=true; reelPick(k,v); }; return `<span class="rcand ${v===cur?'on':''}" data-fa="rc${i}">${esc(reelLabel(k,v))}</span>`; }).join('');
 return `<div class="rband"><span class="rarr" data-fa="rprev">◀</span><div class="rbscroll">${band}</div><span class="rarr" data-fa="rnext">▶</span></div>`;
}
// 完成後の段階：ja（訳の確認）→ bar（時制・助動詞）→ word（ことば入れ替え）→ free
export function finStageGo(from,to){ if(APP.finStage!==from) return; APP.finStage=to;
 if(to==='word') APP.hand=true; }
// 👆の出る場所：目的語→動詞→ほかの順
export function reelHandKey(parts){ const ks=parts.map(p=>String(p.key)).filter(k=>reelKindOf(k)&&!/\.aux$/.test(k)); return ks.find(k=>/\.obj$/.test(k))||ks.find(k=>/\.verb$/.test(k))||ks[0]; }
// 3秒さわらなければ👆
export let handT;
export function handArm(){ clearTimeout(handT); if(APP.hand||!APP.finished||!['bar','word'].includes(APP.finStage)||APP.reelKey) return; handT=setTimeout(()=>{ if(APP.finished&&['bar','word'].includes(APP.finStage)&&!APP.reelKey){ APP.hand=true; renderScene(); } },3000); }

// 気持ちバー：横スクロール。はなすと真ん中のものに決定（直接タップも可）
export function mbCenter(){ const sc=document.querySelector('.mbscroll'), on=sc&&sc.querySelector('.mbstop.on'); if(sc&&on) sc.scrollLeft=on.offsetLeft-sc.clientWidth/2+on.offsetWidth/2; }

// キャラのところを左右にスワイプ → 帯が流れる、はなすと決定

export function reelPick(kind,val){ const m=APP.S.main; if(reelVal(kind,m)===val) return; APP.hist.push(snapshot()); reelSet(kind,m,val); reelAfter(); }
export function reelAfter(){ finStageGo('bar','word'); finStageGo('word','free'); APP.finTried=true; APP.finBar=true; APP.finIdle=false; APP.reelFlash=APP.reelKey; armFin(); render(); say(sentenceText(APP.S)); setTimeout(()=>{ APP.reelFlash=null; },700); }
// 候補の帯：今の言葉が見える位置へ
export function reelScrollBand(){ const sc=document.querySelector('.fincard2 .rbscroll'); if(!sc) return; sc.onscroll=()=>{ APP.bandSL=sc.scrollLeft; };
 if(APP.bandTap){ sc.scrollLeft=APP.bandSL||0; return; } // 帯から直接選んだ時は帯を動かさない
 const on=sc.querySelector('.rcand.on,.frchip.on'); if(on){ sc.scrollLeft=on.offsetLeft-sc.clientWidth/2+on.offsetWidth/2; APP.bandSL=sc.scrollLeft; } }
// 下のバー：型の一覧
export function reelFramesHtml(FA){
 const m=APP.S.main; if(!predV(m)) return '<div class="rband none">型は「〜する」の文で使えます</div>'; const al=reelModals(m);
 const chips=FRAME_IDS.filter(id=>MODALS.find(x=>x.id===id)).map((id,i)=>{ const md=MODALS.find(x=>x.id===id); const ok=al.includes(id); FA['fr'+i]=ok?()=>{ APP.bandTap=true; finModal(m.modal===id?null:id); say(sentenceText(APP.S)); }:()=>toast('この文では使えません');
  return `<span class="frchip ${m.modal===id?'on':''} ${ok?'':'off'}" data-fa="fr${i}"><b>${esc(md.en)}</b><small>${esc(md.ja)}</small></span>`; }).join('');
 return `<div class="rband"><div class="frrow rbscroll">${chips}</div></div>`;
}
// ---- 型から始める ----
// 型：主語を選んだあとに型の一覧 → 選んだ型で動詞を選ぶ
export function openFrameStart(){
 const w=document.createElement('div'); w.className='modalw';
 w.innerHTML=`<div class="modal"><h3>🎰 型を選ぼう</h3><div class="note">選んだら、だれ・動詞を選んで文を作ろう</div><div class="frlist"><button class="frpick" data-id="let"><b class="en">🙋 Let …</b><small>〜させて</small></button>${FRAME_IDS.map(id=>{ const md=MODALS.find(x=>x.id===id); return md?`<button class="frpick" data-id="${id}"><b class="en">${esc(md.en)}</b><small>${esc(md.ja)}</small></button>`:''; }).join('')}</div><div class="rowb"><button class="chip" data-x="close">型を使わない</button></div></div>`;
 ENV.root.appendChild(w); const close=()=>{ w.remove(); APP.frameMode=null; APP.framePend=null; renderScene(); };
 w.querySelector('[data-x="close"]').onclick=close; w.onclick=e=>{ if(e.target===w) close(); };
 w.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{ w.remove(); const id=b.dataset.id;
  if(id==='let'){ openLetWho(); return; }
  APP.framePend=id; APP.frameMode='pick'; renderScene(); });
}
// Let … → だれに？（me はいちばん左。大きさはほかと同じ）
export let LET_WHO;
export function openLetWho(){
 const w=document.createElement('div'); w.className='modalw';
 w.innerHTML=`<div class="modal"><h3>🙋 Let … だれに？</h3><div class="note">選んだら、動詞を選ぼう</div><div class="frlist">${LET_WHO.map(id=>{ const p=N('p:'+id); return p?`<button class="frpick" data-w="${id}"><b class="en">Let ${esc(p.obj||p.en)}</b><small>${esc(p.ja)}に〜させて</small></button>`:''; }).join('')}</div><div class="rowb"><button class="chip" data-x="close">もどる</button></div></div>`;
 ENV.root.appendChild(w);
 w.querySelector('[data-x="close"]').onclick=()=>{ w.remove(); openFrameStart(); }; w.onclick=e=>{ if(e.target===w){ w.remove(); APP.frameMode=null; renderScene(); } };
 w.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{ w.remove(); APP.frameMode=null; const id=b.dataset.w;
  if(id==='i'){ entry('letme'); return; }
  const m=APP.S.main; mutate(()=>{ m.type='imp'; m.imp='do'; m.neg=false; m.pred={k:'v',id:'caus_let'}; m.useObj=true; },null);
  pick('obj','p:'+id); });
}
export function frameApply(id){ const m=APP.S.main; APP.frameMode=null; APP.framePend=null; APP.frameId=id;
 mutate(()=>{ m.modal=id; const P_=typeof MPAT!=='undefined'&&MPAT[id]; if(P_){ m.tense=P_.t[0]; if(P_.neg) m.neg=true; } APP.lsub='do'; },null);
 const md=MODALS.find(x=>x.id===id); if(md) say(md.en.replace(/…ing|…ed/g,'').trim());
}
// 型を選んだあと主語を選んだら、その型を入れる

export function frameStart(id){
 if(id==='letme'){ resetAll(); const m=APP.S.main; const L=['see','think','check','x_try','x_explain','help','go']; const vid=L[Math.floor(Math.random()*L.length)];
  m.type='imp'; m.imp='letme'; m.neg=false; m.pred={k:'v',id:vid}; const x=V(vid); m.useObj = x.fr==='tr' && vid!=='see'; m.obj=null;
  if(m.useObj){ const c=reelCands('obj',m); m.obj = vid==='help'&&c.includes('p:you')? 'p:you' : c[0]; if(!m.obj) m.useObj=false; }
  openFinish(); APP.reelKey=null; APP.finBar=true; render(); return; }
 resetAll(); const m=APP.S.main; m.subj='p:i';
 const vs=LEX.verbs.slice(0,160).filter(x=>!x.hidden&&!x.caus&&!x.pv&&x.fr!=='cl'&&!(typeof vcOf==='function'&&vcOf(x))&&!x.id.startsWith('__')&&!x.stative);
 for(let tries=0;tries<30;tries++){ const x=vs[Math.floor(Math.random()*vs.length)]; m.pred={k:'v',id:x.id}; m.useObj=x.fr==='tr'||x.fr==='both'; m.obj=null; m.modal=id; m.tense=(MPAT[id]&&MPAT[id].t[0])||'pres';
  if(m.useObj){ const c=reelCands('obj',m); if(!c.length){ if(x.fr==='tr') continue; m.useObj=false; } else m.obj=c[Math.floor(Math.random()*Math.min(c.length,15))]; }
  reelFix(m); m.modal=id; if(sentenceComplete(APP.S)) break; }
 openFinish(); APP.reelKey='m.aux'; APP.finBar=true; render();
}

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_reel(){
REEL_KINDS = ['subj','verb','obj','state','place','time','manner','aux','freq','tail'];
FRAME_IDS = ['meaningto','supposedto','aboutto','endedup','tendto','feellike','thinkingof','usedto','goingto','shouldhave','mightwant','dontmind','managedto','getto'];
REEL_NAME = {subj:'だれが',verb:'する',obj:'なにを',state:'どんな',place:'どこで',time:'いつ',manner:'どうやって',aux:'型',freq:'どのくらい',tail:'つけたす'};
reelPopT = null;
handT = null;
onDoc('pointerdown',()=>{ if(APP.hand){ APP.hand=false; document.querySelectorAll('.rhand,.rhint').forEach(e=>e.remove()); document.querySelectorAll('.rpulse').forEach(e=>e.classList.remove('rpulse')); } handArm(); },true);
(function(){
 let st=null; const stops=()=>[...document.querySelectorAll('.mbscroll .mbstop:not(.frmbtn)')];
 const hot=sc=>{ const r=sc.getBoundingClientRect(), cx=r.left+r.width/2; let b=null,bd=1e9; stops().forEach(e=>{ const q=e.getBoundingClientRect(), d=Math.abs(q.left+q.width/2-cx); if(d<bd){bd=d;b=e;} }); return b; };
 onDoc('pointerdown',e=>{ const sc=e.target.closest&&e.target.closest('.mbscroll'); if(!sc) return; st={x:e.clientX,sl:sc.scrollLeft,sc,moved:false}; },true);
 onDoc('pointermove',e=>{ if(!st) return; const dx=e.clientX-st.x; if(Math.abs(dx)>8) st.moved=true; if(!st.moved) return; st.sc.scrollLeft=st.sl-dx; const h=hot(st.sc); stops().forEach(x=>x.classList.toggle('hot',x===h)); e.preventDefault(); },true);
 const end=()=>{ if(!st) return; const s=st; st=null; if(!s.moved) return; APP.swipeAt=Date.now(); const h=hot(s.sc); if(h&&!h.classList.contains('on')&&APP.reelFA&&APP.reelFA[h.dataset.fa]) APP.reelFA[h.dataset.fa](); else renderScene(); };
 onDoc('pointerup',end,true); onDoc('pointercancel',end,true);
})();
(function(){
 let st=null;
 const cands=()=>[...document.querySelectorAll('.fincard2 .rbscroll .rcand, .fincard2 .rbscroll .frchip')];
 const hotOf=sc=>{ const r=sc.getBoundingClientRect(), cx=r.left+r.width/2; let best=null,bd=1e9; cands().forEach(e=>{ const q=e.getBoundingClientRect(), d=Math.abs(q.left+q.width/2-cx); if(d<bd){bd=d;best=e;} }); return best; };
 onDoc('pointerdown',e=>{ if(!APP.finished||!APP.reelKey) return; const t=e.target; if(!t.closest||!(t.closest('.fwspace')||(t.classList&&t.classList.contains('finwrap')))) return;
  const sc=document.querySelector('.fincard2 .rbscroll'); if(!sc) return; st={x:e.clientX,sl:sc.scrollLeft,sc,moved:false}; sc.style.scrollBehavior='auto'; },true);
 onDoc('pointermove',e=>{ if(!st) return; const dx=e.clientX-st.x; if(Math.abs(dx)>8) st.moved=true; if(!st.moved) return;
  st.sc.scrollLeft=st.sl-dx*1.4; const h=hotOf(st.sc); cands().forEach(c=>c.classList.toggle('hot',c===h)); e.preventDefault(); },true);
 const end=e=>{ if(!st) return; const s=st; st=null; s.sc.style.scrollBehavior=''; if(!s.moved) return;
  APP.swipeAt=Date.now(); APP.swiped=true; const h=hotOf(s.sc); if(h&&!h.classList.contains('on')&&APP.reelFA&&APP.reelFA[h.dataset.fa]) APP.reelFA[h.dataset.fa](); else renderScene(); };
 onDoc('pointerup',end,true); onDoc('pointercancel',end,true);
})();
LET_WHO = ['i','he','she','we','they'];
{ const _pk=pick; set_pick(function(cat,val){ const fm=APP.frameMode, fp=APP.framePend; _pk(cat,val); if(cat==='subj' && fm==='pick' && fp){ setTimeout(()=>frameApply(fp),200); } }); }
}
