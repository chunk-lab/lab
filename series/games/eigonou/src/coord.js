import { set_qbRes } from './qbar.js';
import { BIGX, bigAdd } from './bigdict.js';
import { CW_OPTS, cwStart } from './embed.js';
import { N, P, V, isPerson, past, predV } from './engine.js';
import { CAPW, GEO } from './geo.js';
import { AC, APP, mutate, openSub, pick, swapVerb } from './play.js';
import { QB, qbDetOpt, qbRes, qbRes0, qbRes1 } from './qbar.js';
import { fwAdjSt, fwNounJa, fwPP, qbWithDet } from './qfw.js';
import { QS } from './qsp.js';
// ===== 名前（Tom・Mary）と、名詞を並べる（A and B / A, B and C / A or B）=====
export let NAMEJA;
export function nmEnsure(raw){ const k=raw.toLowerCase(), id='nm_'+k; if(!P(id)) bigAdd('people',{id,en:raw,ja:NAMEJA[k]||raw,e:'🧑',p:3,pl:0,name:1,big:1}); return 'p:'+id; }
export let CO_BUSY;
export let CO_FIELDS;
export function fwName(q){ try{ const raw=String(q||'').trim(); if(!/^[A-Z][a-z]{1,}$/.test(raw)) return []; const k=raw.toLowerCase(); if(k==='ken'||k==='mika') return [];
 if(typeof CAPW!=='undefined'&&CAPW.has(k)) return []; if(typeof GEO!=='undefined'&&GEO[k]) return [];
 const known=NAMEJA[k]!==undefined; const prev=QS.st[QS.st.length-1]; const mid=!!prev&&!/[.?!]\s*$/.test(String(prev.pre||'')); if(!known&&!mid) return [];
 const base=qbRes1('ken').find(o=>o.act&&o.pos==='noun'&&/ken/.test(String(o.id)))||qbRes('Ken').find(o=>o.act&&o.pos==='noun'&&o.id==='ken'); if(!base) return [];
 return [{id:'fwnm_'+k,e:'🧑',en:raw,ja:NAMEJA[k]||raw,pos:'noun',fw:1,gram:1,act:()=>{ const c=AC(); const b={}; CO_FIELDS.concat(['thing','with']).forEach(f=>b[f]=c[f]); const ref=nmEnsure(raw); base.act(); const c2=AC(); for(const f of CO_FIELDS.concat(['thing','with'])){ if(c2[f]==='p:ken'&&b[f]!=='p:ken'){ const hl=APP.hist.length; mutate(()=>{ AC()[f]=ref; },null); if(APP.hist.length>hl) APP.hist.pop(); break; } } }}]; }catch(e){ return []; } }
// 直前に確定した語が入れた「名詞の場所」（主語・目的語など）
export function coField(){ try{ const le=QS.st[QS.st.length-1]; if(!le||!le.s0||!le.o||!['noun','pron'].includes(le.o.pos)) return null; const d=JSON.parse(le.s0); const act=d.active||'main'; if(act!==APP.active) return null; const m0=d.S.main; const c0=act==='main'?m0:(m0.subs&&m0.subs[act]&&m0.subs[act].c); if(!c0) return null; const c=AC(); for(const f of CO_FIELDS){ if(c[f]&&c[f]!==c0[f]) return f; } return null; }catch(e){ return null; } }
export function coParts(ref){ const n=N(ref); if(!n) return null; return n.coord? n.parts.slice() : [{en:n.en,obj:n.obj||n.en,ja:n.ja,r:ref}]; }
export function coordMake(r1,r2,w,bare,mode){ try{ const p1=coParts(r1), p2=coParts(r2); if(!p1||!p2) return null; if(bare&&p2.length===1&&/^(my|your|his|her|our|their) /i.test(String(p2[0].en))&&/^(my|your|his|her|our|their) /i.test(String(p1[0].en))){ p2[0]=Object.assign({},p2[0],{en:p2[0].en.replace(/^\w+ /,''),obj:String(p2[0].obj||p2[0].en).replace(/^\w+ /,'')}); } const parts=p1.concat(p2); const J=(a,f)=>{ const t=a.map(f); return t.length===1?t[0]:t.slice(0,-1).join(', ')+' '+w+' '+t[t.length-1]; };
 const jw=w==='or'?'か':'と'; const jl=parts.map(x=>x.ja); const ja=jl.length===1?jl[0]:jl.slice(0,-1).join('、')+jw+jl[jl.length-1];
 const per=parts.every(x=>String(x.r||'p:')[0]==='p'); const id='co_'+parts.map(x=>String(x.r||x.en).replace(/\W+/g,'_')).join('__')+'_'+w; const list=per?'people':'things';
 const o={id,en:J(parts,x=>x.en),obj:J(parts,x=>x.obj),ja,p:3,pl:1,coord:1,parts,e:'👥',big:1,dbaked:1}; if(!per) o.thing=1;
 if(mode&&parts.length===2){ const L=parts[parts.length-1], Ln=N(L.r||'')||{}; const e0=parts[0], e1=parts[1]; const K={both:['both ',' and '],either:['either ',' or '],neither:['neither ',' nor '],notonly:['not only ',' but also ']}[mode]; o.id=id+'_'+mode; o.en=K[0]+e0.en+K[1]+e1.en; o.obj=K[0]+(e0.obj||e0.en)+K[1]+(e1.obj||e1.en);
  if(mode==='both') { o.ja=e0.ja+'も'+e1.ja+'も'; o.pl=1; o.jtopic=1; } else if(mode==='either') { o.ja=e0.ja+'か'+e1.ja+'のどちらか'; o.pl=0; } else if(mode==='neither') { o.ja=e0.ja+'も'+e1.ja; o.pl=0; o.negq='も'; o.jtopic=1; } else { o.ja=e0.ja+'だけでなく'+e1.ja+'も'; o.pl=Ln.pl?1:0; o.jtopic=1; }
  if(mode!=='both'){ o.p=Ln.p||3; if(Ln.p===1||Ln.p===2) o.pl=0; } }
 bigAdd(list,o); return (per?'p:':'t:')+o.id; }catch(e){ return null; } }
export function fwCoordWord(q){ try{ const w=String(q||'').toLowerCase().trim(); if(w!=='and'&&w!=='or') return []; const c=AC(); if(c.coord){ return [{id:'fwcw_'+w,e:'🔗',en:w,ja:w==='and'?'〜と〜':'〜か〜',pos:'conj',fw:1,gram:1,lax:1,act:()=>{ mutate(()=>{ AC().coord.w=w; },null); }}]; }
 const f=coField(); if(!f) return []; return [{id:'fwcw_'+w,e:'🔗',en:w,ja:w==='and'?'〜と〜':'〜か〜',pos:'conj',fw:1,gram:1,lax:1,act:()=>{ mutate(()=>{ AC().coord={f,w}; },null); }}]; }catch(e){ return []; } }
// あとにくる名詞。cm：コンマ区切りの並べ（あとまわし）
export function coNounOpts(q,cm){ const c=AC(); let f,w; if(cm){ const pf=coField(); const le=QS.st[QS.st.length-1]; if(!pf||!le||!/,\s*$/.test(String(le.pre||''))) return []; f=pf; w='and'; } else { if(!c.coord) return []; f=c.coord.f; w=c.coord.w; if(!c[f]) return []; }
 const old=c[f]; let r=[]; CO_BUSY=true; try{ c[f]=null; r=qbRes(q).filter(o=>o.act&&['noun','pron'].includes(o.pos)); }catch(e){ r=[]; } finally{ c[f]=old; CO_BUSY=false; }
 return r.slice(0,4).map(o=>({id:'fwco_'+o.id,e:o.e,en:q,ja:o.ja,pos:'noun',fw:1,gram:1,lax:1,late:cm?1:0,act:()=>{ const cc=AC(); const ff=f; const old2=cc[ff]; const d=QB.det, pl=QB.pl; QB.det=null; const oo=d?qbWithDet(o,d,pl):o; let hl=APP.hist.length; mutate(()=>{ AC()[ff]=null; AC().coord=null; },null); if(APP.hist.length>hl) APP.hist.pop(); oo.act(); const nw=AC()[ff]; const comp=nw&&nw!==old2?coordMake(old2,nw,w,!d):null; if(comp){ hl=APP.hist.length; mutate(()=>{ AC()[ff]=comp; },null); if(APP.hist.length>hl) APP.hist.pop(); } }})); }
export function fwCoordNoun(q){ try{ if(CO_BUSY) return []; return coNounOpts(q,false); }catch(e){ return []; } }
export function fwCoordList(q){ try{ if(CO_BUSY) return []; if(AC().coord) return []; return coNounOpts(q,true); }catch(e){ return []; } }
// Young as he is, he is wise.（形容詞 as 主語 be ＝ 〜だけれど）：4語を1つの前置き節にする
export function fwConcAs(q){ try{ const m=String(q||'').toLowerCase().trim().match(/^([a-z]+) as ([a-z]+) (is|am|are|was|were)$/); if(!m||APP.active!=='main') return []; const c=AC(); if(c.subj||c.pred||APP.S.main.subs.conj||(APP.S.seg&&APP.S.seg.length)) return [];
 const adj=m[1], sw=m[2], be=m[3]; if(/^(as|so|the|a|an|is|am|are|was|were)$/.test(adj)) return [];
 return [{id:'fwca_'+q,e:'🎓',en:q,ja:'〜だけれど（前置き）',pos:'conj',fw:1,gram:1,lax:1,act:()=>{ openSub('conj',{conj:'i_asconc',front:true}); const pick=(w,f)=>{ const r=qbRes(w).filter(o=>o.act&&f(o))[0]; if(r) r.act(); return !!r; };
   pick(sw,o=>['noun','pron'].includes(o.pos)); pick('be',o=>o.id==='qb_be'); pick(adj,o=>o.pos==='adj'||o.pos==='state'); const past=/^(was|were)$/.test(be); if(past){ const hl=APP.hist.length; mutate(()=>{ const cc=AC(); cc.tense='past'; },null); if(APP.hist.length>hl) APP.hist.pop(); } }}]; }catch(e){ return []; } }

// both A and B / either A or B / neither A nor B / not only A but also B
export function fwCoordPair(q){ try{ if(CO_BUSY) return []; const s=String(q||'').trim(); let m=s.match(/^(both|either|neither) ([A-Za-z]+) (and|or|nor) ([A-Za-z]+)$/i), mode, w1, w2; if(m){ mode=m[1].toLowerCase(); const cw=m[3].toLowerCase(); if(!((mode==='both'&&cw==='and')||(mode==='either'&&cw==='or')||(mode==='neither'&&cw==='nor'))) return []; w1=m[2]; w2=m[4]; } else { m=s.match(/^not only ([A-Za-z]+) but also ([A-Za-z]+)$/i); if(!m) return []; mode='notonly'; w1=m[1]; w2=m[2]; }
 const c=AC(); if(APP.active!=='main'&&!c) return []; let f; if(!c.subj) f='subj'; else if(mode!=='neither'&&c.pred&&c.pred.id&&!c.obj) f='obj'; else return []; if(f==='obj'&&mode==='neither') return [];
 const find=w=>{ const old=c[f]; let r=[]; CO_BUSY=true; try{ c[f]=null; r=qbRes(w).filter(o=>o.act&&['noun','pron'].includes(o.pos)&&!/^(fr_|fwdet_|fwpre)/.test(String(o.id))); }catch(e){ r=[]; } finally{ c[f]=old; CO_BUSY=false; } return r[0]; };
 const o1=find(w1), o2=find(w2); if(!o1||!o2) return [];
 return [{id:'fwcp_'+mode+'_'+w1.toLowerCase()+'_'+w2.toLowerCase(),e:'👥',en:s,ja:o1.ja+(mode==='neither'?'も':mode==='both'?'も':'と')+o2.ja,pos:'noun',fw:1,gram:1,act:()=>{ const cc=AC(); const clr=()=>{ const hl=APP.hist.length; mutate(()=>{ AC()[f]=null; AC().coord=null; },null); if(APP.hist.length>hl) APP.hist.pop(); }; clr(); o1.act(); const r1=AC()[f]; clr(); o2.act(); const r2=AC()[f]; clr(); const comp=(r1&&r2)?coordMake(r1,r2,mode==='either'?'or':mode==='neither'?'nor':'and',true,mode):null; if(comp){ const hl=APP.hist.length; mutate(()=>{ AC()[f]=comp; },null); if(APP.hist.length>hl) APP.hist.pop(); } }}]; }catch(e){ return []; } }

// 動詞 + in time / on time（came in time）
export function fwVerbTime(q){ try{ if(CO_BUSY) return []; const m=String(q||'').trim().match(/^([A-Za-z]+) (in|on) time$/i); if(!m||/^(is|am|are|was|were|be|been|being)$/i.test(m[1])) return []; const c=AC(); if(!c.subj||c.pred) return []; const man=m[2].toLowerCase()==='in'?'intime':'ontime'; const v=qbRes(m[1]).find(o=>o.act&&o.pos==='verb'&&!/^(fr_|fwdet_|fwpre)/.test(String(o.id))); if(!v) return [];
 return [{id:'fwvt_'+m[1].toLowerCase()+'_'+man,e:v.e,en:String(q).trim(),ja:v.ja,pos:'verb',fw:1,gram:1,act:()=>{ v.act(); pick('manner',man); }}]; }catch(e){ return []; } }

// 文頭の today / tomorrow / yesterday：あとに主語が続くなら、名詞ではなく時の副詞にする
export function fwTimeFirst(q){ try{ const w=String(q||'').toLowerCase().trim(); if(!/^(today|tomorrow|tonight|yesterday)$/.test(w)||QS.st.length||CO_BUSY) return []; const c=AC(); if(c.subj||c.time||c.pred) return []; const look=QS.look==null?'':String(QS.look).toLowerCase(); if(/^(is|are|was|were|isn't|wasn't|will|can|could|would|may|might|should|must|means|comes|seems|looks|has|had|always|never)$/.test(look)) return []; const o=qbRes1(w).find(x=>/^tm_/.test(String(x.id))&&x.act); return o?[o]:[]; }catch(e){ return []; } }
// 曜日・月の名前（Monday / January）を、辞書の名詞として使えるようにする


// nobody / no one / nothing（主語）：英語はふつうの動詞、日本語は「だれも〜ない」
export function fwNegPron(q){ try{ const w=String(q||'').toLowerCase().trim(); const M={nobody:['だれも',0],'no one':['だれも',0],nothing:['何も',1]}; if(!M[w]) return []; const c=AC(); if(c.subj||APP.active!=='main'&&!c) return []; const id='neg_'+w.replace(/\W+/g,'_');
 return [{id:'fwng_'+id,e:'🚫',en:w,ja:M[w][0],pos:'noun',fw:1,gram:1,act:()=>{ if(!P(id)) bigAdd('people',{id,en:w,ja:M[w][0],e:'🚫',p:3,pl:0,thing:M[w][1]?1:0,negq:'',jtopic:0,big:1,typed:1}); pick('subj','p:'+id); }}]; }catch(e){ return []; } }

// 文頭の No dog barks / No dogs bark：あとに語が続くなら「いいえ」ではなく限定詞の no
export function fwNoDet(q){ try{ if(String(q||'').toLowerCase().trim()!=='no'||!QS.look||QS.st.length||AC().subj||CO_BUSY) return []; if(/^(one)$/i.test(String(QS.look))) return []; return qbDetOpt('no'); }catch(e){ return []; } }
// ===== どの動詞のあとでも wh 節（explain what he did / show where it is …）=====
// 「節をとれる動詞」の分類表。ここに入る動詞は、wh語を打つと自動で節タイプ（_c）に切りかわる。
export let CLV;
export let DITR;
export let CLV_IF;
export function clTwin(v){ const id=String(v.id).replace(/_c$/,'')+'_c'; if(V(id)) return id; const o=Object.assign({},v,{id,fr:'cl',clj:'と',clq:'か',whOnly:1,typed:1,hidden:1,nopass:1,big:1}); if(!DITR.has(String(v.en).toLowerCase())) delete o.dt; else o.dt=o.dt||'to'; delete o.t; delete o.prep; delete o.part; bigAdd('verbs',o); return id; }
export function fwVerbWh(q){ try{ const w=String(q||'').toLowerCase().trim(); if(!/^(where|what|who|when|why|how|which one|if|whether)$/.test(w)||APP.active!=='main') return []; const m=APP.S.main; const v=predV(m); if(!v||m.subs.comp||m.passive||m.sobj) return []; const lem=String(v.en||'').toLowerCase(); const po=m.iobj||m.obj; if(po&&(!DITR.has(lem)||(m.obj&&m.iobj)||!(/^p:(i|we|you|he|she|they)$/.test(String(po))||isPerson(po)))) return []; if(!CLV.has(lem)||v.fr==='cl'&&!/_c$/.test(String(v.id))&&!V(String(v.id)+'_c')&&v.hidden) return []; if(v.fr==='cl') return []; if((w==='if'||w==='whether')&&!CLV_IF.has(lem)) return [];
 const key=w; const out=[]; CW_OPTS.filter(o=>(o.q||o.cif)&&String(o.en).toLowerCase()===key).forEach(o=>out.push({id:'fwvw_'+o.id,e:o.e,en:q,ja:o.ja,pos:'conj',fw:1,gram:1,act:()=>{ swapVerb(clTwin(v)); if(po){ mutate(()=>{ const mm=APP.S.main; mm.iobj=po; mm.obj=null; mm.useObj=true; },null); APP.hist.pop(); } cwStart(o.id); }})); return out; }catch(e){ return []; } }
// how to do / what to do / where to go：wh語のあとの to＋動詞（主語なし）
export function fwWhTo(q){ try{ if(String(q||'').toLowerCase().trim()!=='to'||APP.active!=='comp') return []; const m=APP.S.main, ic=m.subs.comp&&m.subs.comp.c; if(!ic||!ic.q||ic.subj||ic.pred||ic.vform) return []; if(ic.q.wh==='why') return []; return [{id:'fwwt_to',e:'👉',en:'to',ja:'〜する',pos:'aux',fw:1,gram:1,lax:1,act:()=>{ mutate(()=>{ const c=APP.S.main.subs.comp.c; c.vform='to'; c.whTo=1; },null); }}]; }catch(e){ return []; } }
// 動詞の「いちばんふつうの続き方」：want と打ったら want to を1番目に。名詞が続くときは want_o に自動で切りかわる
export let DEF_TO;
export let LABELS;
export function fwDefaultFrame(q){ try{ const w=String(q||'').toLowerCase().trim(); if(!DEF_TO.has(w)||APP.active!=='main') return []; const c=AC(); if(!c.subj||c.pred||c.q) return []; const o=qbRes0(w+' to').find(x=>x.fw&&x.act&&String(x.en).toLowerCase()===w+' to'); if(!o) return []; return [Object.assign({},o,{ja:LABELS[o.id]||o.ja})]; }catch(e){ return []; } }
export function fwRelabel(r){ return r.map(o=>LABELS[o.id]?Object.assign({},o,{ja:LABELS[o.id]}):o); }


// 前置詞＋wh節（talk about what he did / think about who she is / care about how to do it）
export let PW_JA;
export function prepTwin(v,pre){ const id=String(v.id).replace(/(_[a-z]+)?_c$/,'')+'_'+pre+'_c'; if(V(id)) return id; const o=Object.assign({},v,{id,fr:'cl',prep:pre,clj:'ということ'+PW_JA[pre],clq:'か'+PW_JA[pre],whOnly:1,typed:1,hidden:1,nopass:1,big:1}); if(!DITR.has(String(v.en).toLowerCase())) delete o.dt; delete o.t; delete o.part; bigAdd('verbs',o); return id; }
export function fwPrepWh(pre,w){ try{ pre=String(pre||'').toLowerCase(); w=String(w||'').toLowerCase().trim(); if(!PW_JA[pre]||!/^(where|what|who|when|why|how|which one)$/.test(w)||APP.active!=='main') return []; const m=APP.S.main; const v=predV(m); if(!v||v.id==='be'||m.pred.k!=='v'||m.subs.comp||m.passive||m.sobj||m.obj||m.iobj) return []; const out=[]; CW_OPTS.filter(o=>o.q&&String(o.en).toLowerCase()===w).forEach(o=>out.push({id:'fwxw_'+pre+'_'+o.id,e:o.e,en:pre+' '+w,ja:o.ja+'…'+PW_JA[pre],pos:'conj',fw:1,gram:1,act:()=>{ swapVerb(prepTwin(v,pre)); cwStart(o.id); }})); return out; }catch(e){ return []; } }
// 前置詞のあとの「定番の相手」（about this / about it / about him / of everyone …）を、the＋名詞より先に出す
export let PO_PREP;

export let PO_W;
export function fwPrepObj(pre,q){ try{ pre=String(pre||'').toLowerCase().trim(); q=String(q||'').toLowerCase().trim(); if(!PO_PREP.has(pre)||!/^[a-z ]*$/.test(q)) return []; const ws=PO_W.filter(w=>w.startsWith(q)); const WHW=['what','who','where','how','when','why'].filter(w=>w.startsWith(q)&&q.length>0||(!q&&w!=='when'&&w!=='why')); const whs=[]; WHW.forEach(w=>fwPrepWh(pre,w).forEach(o=>whs.push(o))); ws.sort((a,b)=>(b===q)-(a===q)); const out=[]; const seen={}; for(const w of ws){ let o=null; try{ o=fwPP(pre+' '+w,qbRes0).find(x=>x&&x.act); }catch(e){} if(!o){ try{ o=qbRes0(pre+' '+w).find(x=>x&&x.act&&String(x.en).toLowerCase()===pre+' '+w); }catch(e){} } if(!o&&pre==='with'){ const nj=fwNounJa(w); if(nj){ const en=pre+' '+w, id='pm_'+en.replace(/\W+/g,'_'); o={id:'fwxo_'+id,e:'💬',en,ja:nj+'と',pos:'adv',fw:1,act:()=>{ bigAdd('manners',{id,en,ja:nj+'と',e:'💬',typed:1,big:1}); pick('manner',id); }}; } } if(o&&!seen[o.en]){ seen[o.en]=1; out.push(Object.assign({},o,{pri:1})); } if(out.length>=8) break; } return out.concat(whs); }catch(e){ return []; } }



/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_coord(){
NAMEJA = {tom:'トム',mary:'メアリー',john:'ジョン',mike:'マイク',lisa:'リサ',emma:'エマ',anna:'アンナ',james:'ジェームズ',bob:'ボブ',tim:'ティム',sam:'サム',alex:'アレックス',kate:'ケイト',jane:'ジェーン',david:'デイビッド',paul:'ポール',peter:'ピーター',lucy:'ルーシー',amy:'エイミー',jack:'ジャック',anne:'アン',ben:'ベン',nick:'ニック',sara:'サラ',sarah:'サラ',linda:'リンダ',emily:'エミリー',tony:'トニー',jim:'ジム',joe:'ジョー',george:'ジョージ',henry:'ヘンリー',kevin:'ケビン',chris:'クリス',daniel:'ダニエル',jenny:'ジェニー',lily:'リリー',ryan:'ライアン',mark:'マーク',susan:'スーザン',bill:'ビル',nancy:'ナンシー',taro:'タロウ',hanako:'ハナコ',yuki:'ユキ',sakura:'サクラ',akira:'アキラ',yuta:'ユウタ',haruka:'ハルカ',hiroshi:'ヒロシ',takeshi:'タケシ',yoko:'ヨウコ',kenji:'ケンジ',aya:'アヤ',rina:'リナ',mei:'メイ',sota:'ソウタ',ken:'ケン',mika:'ミカ'};
CO_BUSY = false;
CO_FIELDS = ['subj','obj','iobj','sobj','than'];
(function(){ try{ const D={Monday:'月曜日',Tuesday:'火曜日',Wednesday:'水曜日',Thursday:'木曜日',Friday:'金曜日',Saturday:'土曜日',Sunday:'日曜日',January:'1月',February:'2月',April:'4月',June:'6月',July:'7月',August:'8月',September:'9月',October:'10月',November:'11月',December:'12月'}; if(typeof BIGX!=='undefined') Object.keys(D).forEach(w=>{ if(!BIGX.n.some(x=>x.w===w.toLowerCase())) BIGX.n.push({w:w.toLowerCase(),pn:w,ja:D[w],sc:90,ln:'time',u:1}); }); }catch(e){} })();
CLV = new Set('explain show remember forget understand learn decide discover realize notice see hear check imagine describe discuss teach guess mean find predict figure prove wonder know ask tell'.split(' '));
DITR = new Set('teach show tell ask'.split(' '));
CLV_IF = new Set('check see ask wonder know decide find learn remember forget'.split(' '));
DEF_TO = new Set('want need hope plan decide try wish expect promise'.split(' '));
LABELS = {want_o:'何かが…ほしい',caus_want:'誰に…してほしい','fw_want to_したい':'…したい'};
PW_JA = {about:'について',of:'について',on:'について'};
PO_PREP = new Set('about for of with without like to at in on from by near under over behind inside outside across into around through between toward towards after before during until since against among along beyond despite except than via per upon off out of next to in front of because of instead of'.replace(/out of/,'out_of').split(' ').map(x=>x==='out_of'?'out of':x));
['out of','next to','in front of','because of','instead of'].forEach(x=>PO_PREP.add(x));
PO_W = ['it','this','that','him','her','them','you','me','us','these','those','everything','everyone','everybody','something','someone','nothing','anything','anyone','myself','himself','herself','themselves','yourself','each other'];
{ const _qr=qbRes; set_qbRes(function(q){ const r=_qr.apply(this,arguments); try{ if(typeof fwAdjSt==='function'&&fwAdjSt()&&QB.pre) return r; let pp0=QB.pre, qq0=q; if(!pp0||!PO_PREP.has(String(pp0))){ const mm=String(q||'').toLowerCase().match(/^([a-z]+(?: of| to)?) ([a-z]*)$/); pp0=mm&&PO_PREP.has(mm[1])?mm[1]:null; qq0=mm?mm[2]:''; } if(pp0&&PO_PREP.has(String(pp0))&&!/^(the|a|an|my|your|his|her|our|their)$/.test(qq0)){ const po=fwPrepObj(pp0,qq0); if(po.length){ const have=new Set(po.map(o=>String(o.en).toLowerCase())); const rest=r.filter(o=>!have.has(String(o.en).toLowerCase())); if(qq0&&/^(to|at|in|on|from|into|near|by|under|over|behind|inside|outside|across|around|through|between|toward|towards|in front of|next to)$/.test(pp0)&&!po.some(o=>String(o.en).toLowerCase()===pp0+' '+qq0)) return rest.slice(0,3).concat(po,rest.slice(3)); return po.concat(rest); } } }catch(e){} return r; }); }
}
