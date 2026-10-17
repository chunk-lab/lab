import { set_sentenceParts, set_sentenceJa, set_sentenceComplete } from './engine.js';
import { BIGX } from './bigdict.js';
import { toast } from './common.js';
import { LEX, N, ST, T, cap, genClause, jaClause, newClause, past, predS, sentenceComplete, sentenceJa, sentenceParts, sentenceText } from './engine.js';
import { APP, isEmptyMain, mutate } from './play.js';
import { qbRes } from './qbar.js';
import { FWX, fwVerbJa } from './qfw.js';
import { fxBeOpts, fxImpOpt, fxImpPv } from './qfx.js';
import { QS, qspWords } from './qsp.js';
// ===== 型（フレーム）レイヤー：What I want is … / All you can do is … / It is true that … ほか =====
// 考え方：文の前半を「固めた断片」(APP.S.seg) にして、あとは新しい文(S.main)を続けて作る。
// 固めた断片＋いまの文＝全体。日本語は S.frm.k（型）ごとに組み立てる。作れない語は「そのまま入れる」。
export let FR_BASEPARTS, FR_BASEJA, FR_BASECOMP;
export let frClone;
export let frText;
export let frStrip;
export function frLiveEmpty(){ try{ return isEmptyMain()&&Object.keys(APP.S.main.subs).length===0; }catch(e){ return false; } }
// ---- 表示・判定のつなぎ ----



export function frLiveOK(c){ if(!c) return false; if(c.hideSubj) return !!c.pred; return !!(c.subj||c.q); }
export function frComplete(S){ const seg=S.seg, f=S.frm||{}, c=S.main; const empty=frLiveEmpty();
 const gi=seg.findIndex(x=>x.role==='G'); if(f.stage==='L') return false;
 const last=seg[seg.length-1];
 if(empty) return !!last && !(last.role==='lit' && !(typeof QS!=='undefined'&&QS.fin&&/^(not|so|either|neither|no)$/i.test(last.en)) && /^(that|to|for|of|who|which|whom|if|whether|and|or|but|so|because|when|where|why|how|as|than|not|both|either|neither|the|a|an)$/i.test(last.en)) && (gi<0 || gi<seg.length-1);
 try{ if(c.pred||c.q) { if(FR_BASECOMP({main:c})) return true; } }catch(e){}
 return frLiveOK(c); }
// ---- 固める（断片を取り出す）----
export function frCapLive(c,role){ const k=frClone(c); let en='', ja='';
 if(role==='pcL'){ const gap=(k.q&&k.q.wh==='subj')?'s':'o'; const ps=genClause(frClone(k),{kind:'comp',key:'comp'}); en=frText(ps); const k2=frClone(k); k2.q=null; ja=frStrip(jaClause(k2,{kind:'rel',gap})); return {en,ja,role:'L'}; }
 if(role==='relL'){ const ps=genClause(k,{kind:'rel',key:'rel',head:null,headAgr:{p:3,pl:0},gap:'o',pron:'that'}).filter(p=>p.cat!=='rel'); en=frText(ps); ja=frStrip(jaClause(k,{kind:'rel',gap:'o'})); return {en,ja,role:'L'}; }
 const ps=FR_BASEPARTS({main:k}); en=frText(k.hideSubj? ps.filter(p=>!/\.subj$/.test(String(p.key||''))) : ps); 
 if(k.subj && !k.pred && !k.q){ const n=N(k.subj); ja=n? frStrip(n.ja):''; }
 else { ja=frStrip(FR_BASEJA({main:k})); if(k.hideSubj) ja=ja.replace(/^(わたし|かれ|かのじょ|それ)(たち)?(は|が)/,''); }
 return {en,ja,role:k.hideSubj?'VP':(k.subj&&!k.pred?'N':'M')}; }
// 固めて、新しい文を始める
export function frFreeze(newSegs,after,live){ mutate(()=>{ const S=APP.S; S.seg=(S.seg||[]).concat(newSegs); S.main=newClause(); APP.active='main'; APP.lsub=null; APP.open=null; if(live){ Object.assign(S.main,live); } if(after) after(S); },null); }
export let FR_GLUE_JA;
export function frGloss(w){ const k=String(w).toLowerCase(); const FW={that:'という',and:'そして',or:'または',but:'しかし',so:'だから',because:'なぜなら',of:'の',for:'のために',to:'へ',with:'と',as:'として',than:'より',not:'ない',the:'',a:'',an:'',is:'だ',are:'だ',was:'だった',were:'だった',be:'である',it:'それ',who:'',which:'',when:'とき',where:'どこ',why:'なぜ',how:'どう',if:'もし',whether:'かどうか',him:'かれ',her:'かのじょ',them:'かれら',us:'わたしたち',me:'わたし',you:'あなた',i:'わたし',he:'かれ',she:'かのじょ',we:'わたしたち',they:'かれら',my:'わたしの',your:'あなたの',his:'かれの',their:'かれらの',our:'わたしたちの',just:'ちょうど',ever:'今までに',too:'も',either:'も',neither:'どちらも〜ない',already:'もう',yet:'まだ',still:'まだ',no:'いいえ',yes:'はい',oh:'おや'};
 if(k in FW) return FW[k]; try{ const v=(typeof fwVerbJa==='function')?fwVerbJa(k):null; if(v) return v; }catch(e){}
 for(const kk of ['n','p','an','a','r','v']){ const e=(BIGX[kk]||[]).find(x=>x.w===k); if(e) return e.ja; }
 const t=LEX.things.find(x=>String(x.en).toLowerCase().replace(/^(a|an|the) /,'')===k); if(t) return t.ja; if(!arguments[1]){ const m=k.match(/^(.*?)(ing|ed|er|est|s|es|ies)$/); if(m&&m[1].length>2){ const b=m[1]; for(const c of [b,b+'e',b.replace(/(.)\1$/,'$1'),m[2]==='ies'?b+'y':b]){ const g=frGloss(c,1); if(g) return g; } } } return null; }
// ---- 型の語（候補として出す）----
export let FR_HEADN;
export let FR_ORD;
export function frAdjJa(w){ const s=(LEX.states||[]).find(x=>String(x.en).toLowerCase()===w); let e=s; if(!e) e=(BIGX.a||[]).find(x=>x.w===w); if(!e) return FR_ORD[w]||null; const j=e.ja||''; if(e.jt==='na') return j+'な'; return String(j).replace(/だ$/,'').replace(/いる$/,'いる'); }
export function frHeadOpt(q){ const s=String(q).toLowerCase().trim().replace(/\s+/g,' '); if(!frLiveEmpty()||(APP.S.seg&&APP.S.seg.length)||APP.active!=='main') return []; if(/^the (first|last|next) time$/.test(s)){ try{ const ie=document.getElementById('qin'); const rest=ie?ie.value.slice(QS.off):''; if(/,/.test(rest)) return (FWX.T[s]||[]).filter(o=>o.act); }catch(e){} } let m=s.match(/^the (most|least) (\w+)(?: (\w+))?$/), ja=null, pend=false, n=null;
 if(m){ const adj=m[2]; if(m[3]){ n=m[3]; const aj=frAdjJa(adj); ja=(m[1]==='most'?'いちばん':'いちばん少なく')+(aj||adj); } else { if(FR_HEADN[adj]) { return [{id:'fr_hd_'+s,e:'🔖',en:s+' …',ja:'つづけて打つ',pos:'aux',fw:1,act:()=>{ toast('つづけて打ってね'); }}]; } pend=true; } }
 else { m=s.match(/^the (first|last|only|main|next|real|same|biggest|greatest|easiest|hardest|simplest) (\w+)$/); if(m){ n=m[2]; ja=FR_ORD[m[1]]; } else { m=s.match(/^the (most|least|first|last|only|best|worst|main|next|real|same|biggest|greatest|easiest|hardest|simplest)$/); if(m) return [{id:'fr_hd_'+s,e:'🔖',en:s+' …',ja:'つづけて打つ',pos:'aux',fw:1,act:()=>{ toast('つづけて打ってね'); }}]; } }
 if(pend) return [{id:'fr_hd_'+s,e:'🔖',en:s+' …',ja:'つづけて打つ',pos:'aux',fw:1,act:()=>{ toast('つづけて打ってね'); }}];
 if(!n||!FR_HEADN[n]) return []; const hj=(ja||'')+FR_HEADN[n];
 return [{id:'fr_hd',e:'🔖',en:s,ja:hj+'は…（is でつなぐ）',pos:'aux',fw:1,act:()=>{ frFreeze([{en:s,ja:hj,role:'H'}],S=>{ S.frm={k:'nh',stage:'L'}; }); }}]; }
export function frGlueOpt(q){ const w=String(q).toLowerCase().trim(); if(!/^(is|was|are|were)$/.test(w)||APP.active!=='main') return []; const S=APP.S, c=S.main, past=/^(was|were)$/.test(w);
 const glue=(role)=>{ const cap=frCapLive(c,role); const items=[]; const f=S.frm; const k=f?f.k:(role==='pcL'?'pc':'all'); const had=(S.seg||[]).length; frFreeze(frLiveEmpty()?[{en:w,ja:'',role:'G',past}]:[cap,{en:w,ja:'',role:'G',past}],S2=>{ S2.frm={k:(f&&f.k)||'pc',stage:'R',past}; }); };
 if(S.frm && S.frm.stage==='L'){ const rel=!frLiveEmpty()?'relL':null; return [{id:'fr_glue',e:'🔗',en:w,ja:'〜のは…だ（つなぐ）',pos:'aux',fw:1,act:()=>{ const S=APP.S; const f=S.frm; const items=[]; if(!frLiveEmpty()) items.push(frCapLive(S.main,'relL')); items.push({en:w,ja:'',role:'G',past}); frFreeze(items,S2=>{ S2.frm={k:f.k,stage:'R',past}; }); }}]; }
 if(!S.frm && !(S.seg&&S.seg.length) && c.q && String(c.q.w||'').toLowerCase()==='what' && (c.q.wh==='obj'||c.q.wh==='subj') && (c.pred||c.subj)){ return [{id:'fr_glue',e:'🔗',en:w,ja:'What 〜 is … （〜のは…だ）',pos:'aux',fw:1,act:()=>{ const cap=frCapLive(APP.S.main,'pcL'); frFreeze([cap,{en:w,ja:'',role:'G',past}],S2=>{ S2.frm={k:'pc',stage:'R',past}; }); }}]; }
 return []; }
export function frAllOpt(q){ if(String(q).toLowerCase().trim()!=='all'||!frLiveEmpty()||(APP.S.seg&&APP.S.seg.length)||APP.active!=='main') return []; const look=String(QS.look||'').toLowerCase(); const subjy=/^(i|you|he|she|we|they|it|my|your|his|her|our|their|people|one|ken|mary)$/.test(look);
 const o={id:'fr_all',e:'🔖',en:'All',ja:'〜できるのは…だけ（All you can do is …）',pos:'aux',fw:1,act:()=>{ frFreeze([{en:'all',ja:'',role:'H'}],S=>{ S.frm={k:'all',stage:'L'}; }); }}; return [o]; }
// that / to / who など（つづきを「そのまま」入れる）
export function frCopulaCtx(){ const c=APP.S.main; if(APP.active!=='main'||!c) return null; const p=c.pred; if(c.subj && p && p.k==='s' && !p.id) return 'bare'; if(c.subj && p && p.k==='s' && p.id){ const st=ST(p.id); return st&&!st.noun?'adj':'noun'; } return null; }
export let FR_THATN;
export function frThatNoun(){ try{ const p=APP.S.main.pred; const st=p&&p.id&&ST(p.id); if(!st) return true; return FR_THATN.test(String(st.en).split(' ').pop()); }catch(e){ return true; } }
export function frContOpt(q){ const w=String(q).toLowerCase().trim(); if(!/^(that|to|who|which|whom)$/.test(w)) return []; const S=APP.S, c=S.main; const out=[]; const f=S.frm;
 const gl=(en,ja)=>({id:'fr_c_'+en,e:'🧩',en,ja,pos:'aux',fw:1});
 // R の最初：that 文 / to 動詞
 if(f && f.stage==='R' && frLiveEmpty() && ['that','to'].includes(w)){ const sc=(S.seg||[]).filter(x=>x.role==='lit').length; if(!sc){ out.push(Object.assign(gl(w,w==='that'?'という（that＋文）':'〜すること（to＋動詞）'),{act:()=>{ frFreeze([{en:w,ja:'',role:'lit'}],null,w==='to'?{subj:'p:i',hideSubj:true}:null); }})); } }
 // 名詞＋is / 形容詞のあとの that・to
 const cc=frCopulaCtx();
 if(!f && cc && ['that','to'].includes(w) && !(cc==='adj'&&w==='to') && !(w==='that'&&cc==='noun'&&!frThatNoun()) && !(w==='that'&&typeof stCl==='function'&&stCl())){ const it=c.subj==='p:it';
  out.push(Object.assign(gl(w,w==='that'?'という（つづけて文）':'〜すること（つづけて動詞）'),{act:()=>{ const c=APP.S.main; const cap=frCapLive(c,'M'); cap.adj=cc==='adj'? (predS(c)||{}).ja:''; frFreeze([cap,{en:w,ja:'',role:'lit'}],S2=>{ S2.frm={k:it&&cc==='adj'?'itx':'be',stage:'X',cc,it,w}; },w==='to'?{subj:'p:i',hideSubj:true}:null); }})); }
 // 強調構文  It was Ken who/that …
 if(!f && c.subj==='p:it' && ['who','that','which','whom'].includes(w) && (cc==='noun'||(c.pred&&c.pred.k==='s')||c.time||c.place||c.manner)){ const sj=(w==='who'||w==='which')||(!/^(i|you|he|she|we|they|it|my|your|his|her|our|their|the|a|an|this|that|these|those)$/.test(String(QS.look||'').toLowerCase()) && QS.look); out.push(Object.assign(gl(w,'〜なのは…（It was … that）'),{act:()=>{ const cap=frCapLive(APP.S.main,'M'); frFreeze([cap,{en:w,ja:'',role:'lit'}],S2=>{ S2.frm={k:'cleft',stage:'X',w,sj}; },sj?{subj:'p:he',hideSubj:true}:null); }})); }
 return out; }
export function frVerbOpt(q){ const w=String(q).toLowerCase().trim(); const S=APP.S, f=S.frm; if(!f||f.stage!=='R'||!(f.k==='all'||(S.seg||[]).some(x=>x.role==='L'&&/\b(do|does|did)$/.test(x.en)))||!frLiveEmpty()||APP.active!=='main'||(S.seg||[]).some(x=>x.role==='lit')||!/^[a-z]+$/.test(w)||!frIsVerb(w)) return [];
 return [{id:'fr_vb',e:'🧩',en:w,ja:'（〜すること）',pos:'verb',fw:1,act:()=>{ frFreeze([],null,{subj:'p:i',hideSubj:true}); const r=qbRes(w).filter(o=>o.pos==='verb'&&!/^fr_/.test(String(o.id))); if(r[0]) r[0].act(); if(APP.hist.length>1) APP.hist.splice(APP.hist.length-1,1); }}]; }
export function qfrOptions(q){ try{ if(!qfrOn()) return []; return frGlueOpt(q).concat(frAllOpt(q),frHeadOpt(q),frContOpt(q),frVerbOpt(q),(typeof fxImpOpt==="function"?fxImpOpt(q):[]),(typeof fxImpPv==="function"?fxImpPv(q):[]),(typeof fxBeOpts==="function"?fxBeOpts(q):[])); }catch(e){ return []; } }
export let qfrOn;
// 辞書のことば（作れなかった語を、そのまま入れる）
export function frLiteral(w,force){ let gl=frGloss(w); if(gl==null){ if(!force) return null; gl=w; } const S=APP.S; return {id:'fr_lit_'+w,e:'🧩',en:w,ja:(gl||'（そのまま）'),pos:'aux',fw:1,act:()=>{ const S=APP.S; const items=[]; if(!frLiveEmpty()) items.push(frCapLive(S.main,'M')); items.push({en:w,ja:gl,role:'lit'}); frFreeze(items,S2=>{ S2.frm=S2.frm||{k:'lit',stage:'X'}; }); }}; }
// ---- 日本語の組み立て ----
export function frAll(S){ const A=(S.seg||[]).slice(); if(!frLiveEmpty()) A.push(frCapLive(S.main,'M')); return A; }
export function frVp(items){ if(!items.length) return ''; const a=items[0]; if(a.role==='VP') return items.map(x=>x.ja).join(''); if(a.role==='lit'){ const objs=items.slice(1).map(x=>x.ja).join(''); return (objs?objs+'を':'')+a.ja; } return items.map(x=>x.ja).join(''); }
export function frRja(R){ if(!R.length) return ''; const r0=R[0], rest=R.slice(1); const j=a=>a.map(x=>x.ja).join('');
 if(r0.role==='lit'&&r0.en==='that') return j(rest).replace(/^([^、を]*?)は/,'$1が')+'ということ'; if(r0.role==='lit'&&r0.en==='to') return frVp(rest)+'こと';
 if(r0.role==='VP') return frVp(R)+'こと'; if(r0.role==='lit'&&R.length>=1&&/^[a-z]+$/i.test(r0.en)&&frIsVerb(r0.en)) return frVp(R)+'こと'; return j(R); }
export function frIsVerb(w){ return !!((LEX.verbs||[]).find(v=>v.en===w) || (BIGX.v||[]).find(x=>x.w===w)); }
export function frCompose(S){ const f=S.frm||{}, A=frAll(S); const gi=A.findIndex(x=>x.role==='G'); const past=!!f.past; const j=a=>a.map(x=>x.ja).join('');
 if(['pc','all','nh'].includes(f.k) && gi>=0){ const left=A.slice(0,gi); const heads=left.filter(x=>x.role==='H'), cl=left.filter(x=>x.role!=='H'); let L;
  if(f.k==='nh') L=j(cl)+j(heads); else L=j(cl)+(cl.length?'の':'もの'); let R=frRja(A.slice(gi+1)); if(f.k==='all'&&R) R+='だけ'; return L+'は、'+R+(past?'だった':'だ')+'。'; }
 if(f.k==='be'){ const m=A[0], rest=A.slice(2); const mj=m.ja.replace(/だ$/,''); if(f.w==='that') return m.ja.replace(/(は|が).*$/,'$1')+'、'+j(rest).replace(/^([^、を]*?)は/,'$1が')+'ということだ。'; return (m.ja.replace(/(は|が).*$/,'$1'))+'、'+frVp(rest)+'ことだ。'; }
 if(f.k==='itx'){ const rest=A.slice(2); const adj=A[0].adj||''; const body=f.w==='to'? frVp(rest) : j(rest); return body+'のは、'+adj.replace(/(だ|である)$/,'')+'だ。'; }
 if(f.k==='cleft'){ const m=A[0], rest=A.slice(2); const focus=(predS(S.main)&&0)||''; let fj=m.ja.replace(/^それは/,'').replace(/(だ|だった)$/,''); return j(rest)+'のは、'+fj+(m.ja.endsWith('だった')?'だった':'だ')+'。'; }
 { const t=A.map(x=>x.ja).filter(Boolean).join('、'); return t+(/[。！？]$/.test(t)?'':'。'); } }
// ---- 指示文 ----
export function frHint(){ const S=APP.S; if(!S||!S.frm||APP.finished) return ''; const f=S.frm; if(f.stage==='L') return '👉 つづけて文を打つ（そのあと is / was でつなぐ）'; if(f.stage==='R'&&frLiveEmpty()) return '👉 つぎは？（名詞／to＋動詞／that＋文）'; return ''; }

export function frLiteralP(ph,ja){ return {id:'fr_lit_'+ph.replace(/\W+/g,'_'),e:'🧩',en:ph,ja:ja,pos:'aux',fw:1,act:()=>{ const S=APP.S; const items=[]; if(!frLiveEmpty()) items.push(frCapLive(S.main,'M')); items.push({en:ph,ja:ja,role:'lit'}); frFreeze(items,S2=>{ S2.frm=S2.frm||{k:'lit',stage:'X'}; }); }}; }
export function frComma(){ const S=APP.S; if(S.seg&&S.seg.length&&frLiveEmpty()){ mutate(()=>{ const l=APP.S.seg[APP.S.seg.length-1]; if(!/,$/.test(l.en)){ APP.S.seg=APP.S.seg.slice(0,-1).concat([Object.assign({},l,{en:l.en+',',ja:l.ja+'、'})]); } },null); } }

// 文の最後の保証：打った英文とできた英文がちがうときは、文まるごとを「そのまま」の1かたまりにする
export function qspFinalGuard(inp){ try{ const typed=inp.value.replace(/\s+$/,''); const m=typed.match(/[.?!]+$/); const body=typed.replace(/[.?!]+$/,'').trim(); if(!body) return;
 const strict=x=>qspWords(x,1); const E=strict(body), T=strict(String(sentenceText(APP.S)).replace(/[.?!]+$/,'')); const nz=x=>String(x).toLowerCase().replace(/’/g,"'").replace(/[.?!]+$/,'').replace(/\s+,/g,',').replace(/\s+/g,' ').trim(); if(E.join(' ')===T.join(' ')&&(nz(body)===nz(sentenceText(APP.S))||!/,/.test(body))){ if(m&&APP.S.seg&&APP.S.seg.length){ APP.S.fp=m[0][0]; const l=APP.S.seg[APP.S.seg.length-1]; if(/[.?!]$/.test(l.en)) mutate(()=>{ const g=APP.S.seg; g[g.length-1]=Object.assign({},l,{en:l.en.replace(/[.?!]+$/,'')}); },null); } return; }
 let ja=''; try{ ja=String(sentenceJa(APP.S)).replace(/[。？！?]+$/,''); }catch(e){}
 const en=body.charAt(0).toLowerCase()===body.charAt(0)?body:body; const fp=m?m[0][0]:'.';
 mutate(()=>{ const S=APP.S; S.seg=[{en:en,ja:ja||body,role:'lit'}]; S.main=newClause(); S.frm={k:'lit',stage:'X'}; S.fp=fp; APP.active='main'; APP.lsub=null; APP.open=null; },null); }catch(e){} }

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_qfr(){
FR_BASEPARTS = sentenceParts;
FR_BASEJA = sentenceJa;
FR_BASECOMP = sentenceComplete;
frClone = o=>JSON.parse(JSON.stringify(o));
frText = ps=>ps.filter(p=>p&&p.en).map(p=>p.en).join(' ').replace(/ ,/g,',').replace(/\s+/g,' ').trim();
frStrip = s=>String(s||'').replace(/[。？！]$/,'');
set_sentenceParts(function(S){ const base=FR_BASEPARTS(S); const seg=S.seg||[]; let b=base;
 if(S.main && S.main.hideSubj) b=Object.assign(base.filter(p=>!/\.subj$/.test(String(p.key||''))),{punct:base.punct,futNote:base.futNote});
 if(!seg.length) return b; const out=seg.map((x,i)=>({key:'fz.'+i,en:x.en,ja:x.ja||'',cat:'conj',pos:x.pos||'conj',clause:'frame',frozen:1})).concat(b); out.punct=S.fp||b.punct; out.futNote=b.futNote; return out; });
set_sentenceJa(function(S){ let r; if(!(S.seg&&S.seg.length)) r=FR_BASEJA(S); else { try{ r=frCompose(S); }catch(e){ r=FR_BASEJA(S); } } return typeof r==='string'? r.replace(/([！？])。$/,'$1').replace(/、、+/g,'、') : r; });
set_sentenceComplete(function(S){ if(!(S.seg&&S.seg.length)) return FR_BASECOMP(S); return frComplete(S); });
FR_GLUE_JA = {that:'',who:'',which:'',whom:'',to:'',for:'',of:''};
FR_HEADN = {thing:'こと',part:'部分',way:'方法',reason:'理由',problem:'問題',point:'点',truth:'真実',fact:'事実',difference:'ちがい',key:'カギ',idea:'考え',goal:'目標',rule:'ルール',trouble:'こまったこと',question:'質問',answer:'答え',secret:'ひみつ',matter:'問題',issue:'問題',place:'場所',time:'時間',person:'人',one:'もの',step:'段階',job:'仕事',lesson:'教訓',news:'ニュース',mistake:'まちがい'};
FR_ORD = {first:'最初の',last:'最後の',only:'唯一の',best:'いちばんよい',worst:'いちばん悪い',main:'主な',next:'次の',real:'本当の',same:'同じ',biggest:'いちばん大きい',greatest:'いちばんすばらしい',easiest:'いちばんかんたんな',hardest:'いちばんむずかしい',simplest:'いちばんシンプルな',important:'大切な'};
FR_THATN = /^(problem|truth|fact|news|idea|point|trouble|reason|rule|hope|belief|feeling|answer|question|danger|risk|chance|possibility|thing|secret|story|rumor|rumour|plan|goal|aim|worry|fear|result|conclusion|opinion|view|claim|promise|dream|wish|mistake|sign|proof|evidence|message|advice|law|principle|theory)$/i;
qfrOn = ()=>true;
}
