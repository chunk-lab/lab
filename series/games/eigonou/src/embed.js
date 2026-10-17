import { set_optList, set_catDef, set_render, set_openFinish } from './play.js';
import { set_jaClause } from './engine.js';
import { say, toast } from './common.js';
import { N, cap, genClause, isPerson, jaClause, newClause, nounTags, past, predS, predV } from './engine.js';
import { APP, catDef, mutate, openFinish, optList, render } from './play.js';
// ================= 文の中に文（I think … / I don't know where …） =================
// think・guess・suppose・hope・believe・say：〜と（that は省く）→ すぐ中の文へ
// know・wonder：先頭の言葉（〜と／where・what・when・who・why・how・which・if）を選んでから中の文へ
export let CW_V;
export let CW_OPTS;
export function cwStart(id){ const o=CW_OPTS.find(x=>x.id===id); if(!o) return;
 mutate(()=>{ const m=APP.S.main; const ic=newClause(); if(o.q) ic.q=Object.assign({},o.q); if(o.cif) ic.cif=o.cif; m.subs.comp={c:ic}; APP.active='comp'; APP.open=null; APP.lsub=null; APP.sideAuto=true; },null);
 say(o.q?(o.q.w||({place:'where',time:'when',why:'why',manner:'how'})[o.q.wh]):(o.cif?(o.cif===2?'whether':'if'):''));
}


// 先頭の言葉がまだなら、一覧を開いたままにする

// 完成したら1回だけ：Where is he? → where he is
export function cwHint(){ const m=APP.S.main, sb=m.subs.comp, ic=sb&&sb.c; if(!ic||!ic.q||APP.cwHintDone) return;
 try{ const Q=genClause(Object.assign({},ic,{subs:{}}),{kind:'main',key:'h'}).filter(p=>p.en&&!p.hole).map(p=>p.en).join(' ');
  const E=genClause(Object.assign({},ic,{subs:{}}),{kind:'comp',key:'h'}).filter(p=>p.en&&!p.hole).map(p=>p.en).join(' ');
  if(Q && E && Q.toLowerCase()!==E.toLowerCase()){ APP.cwHintDone=true; setTimeout(()=>toast(cap(Q)+'? → … '+E+'（文の中では、ふつうの語順）'),900); } }catch(e){} }

// 日本語：be＋where は「どこにいる・ある」、know の否定は「知らない」


/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_embed(){
CW_V = ['know','wonder'];
CW_OPTS = [
 {id:'that',e:'💬',en:'（〜と）',ja:'〜ということ'},
 {id:'where',e:'📍',en:'where',ja:'どこに・どこで',q:{wh:'place'}},
 {id:'whatO',e:'🎯',en:'what',ja:'何を',q:{wh:'obj',w:'what'}},
 {id:'whatS',e:'❓',en:'what',ja:'何が',q:{wh:'subj',w:'what'}},
 {id:'when',e:'🕐',en:'when',ja:'いつ',q:{wh:'time'}},
 {id:'whoS',e:'👤',en:'who',ja:'だれが',q:{wh:'subj',w:'who'}},
 {id:'whoO',e:'👥',en:'who',ja:'だれを',q:{wh:'obj',w:'who'}},
 {id:'why',e:'🤷',en:'why',ja:'どうして',q:{wh:'why'}},
 {id:'how',e:'🛠️',en:'how',ja:'どうやって',q:{wh:'manner'}},
 {id:'which',e:'👉',en:'which one',ja:'どれが',q:{wh:'subj',w:'which one'}},
 {id:'if',e:'⚖️',en:'if',ja:'〜かどうか',cif:1},
 {id:'whether',e:'⚖️',en:'whether',ja:'〜かどうか',cif:2},
];
{ const _ol=optList; set_optList(function(k,c){ if(k==='cw'){ const v=predV(APP.S.main); const cur=APP.S.main.subs.comp&&APP.S.main.subs.comp.c;
   return CW_OPTS.filter(o=>!(v&&v.whOnly&&o.id==='that')).map(o=>({id:o.id,e:o.e,en:o.en,ja:o.ja,pos:'conj',sel:false,act:()=>cwStart(o.id)})); }
  return _ol(k,c); }); }
{ const _cd=catDef; set_catDef(function(k,c){ if(k==='cw') return ['What？','どんな文を続ける？','conj']; return _cd(k,c); }); }
{ const _r=render; set_render(function(){ try{ const m=APP.S&&APP.S.main, v=m&&predV(m);
   if(m && APP.view==='play' && APP.active==='main' && !APP.finished && !APP.open && v && CW_V.includes(v.id) && !m.subs.comp) APP.open='cw'; }catch(e){}
  return _r.apply(this,arguments); }); }
{ const _of=openFinish; set_openFinish(function(){ const r=_of.apply(this,arguments); cwHint(); return r; }); }
{ const _jc=jaClause; set_jaClause(function(c,ctx){ ctx=ctx||{kind:'main'};
  try{ const q=(ctx.kind==='main'||(ctx.kind==='comp'&&!c.vform))?c.q:null;
   if(q && q.wh==='place' && c.type==='normal' && c.pred && c.pred.k==='s' && !predS(c) && c.subj){ const n=N(c.subj); const live=isPerson(c.subj)||nounTags(c.subj).includes('animal');
    const past=['past','pastprog'].includes(c.tense); let vb=live?(c.neg?(past?'いなかった':'いない'):(past?'いた':'いる')):(c.neg?(past?'なかった':'ない'):(past?'あった':'ある'));
    return n.ja+(ctx.kind==='main'?'は':'が')+'どこに'+vb+(ctx.kind==='main'?'？':''); } }catch(e){}
  try{ const q2=(ctx.kind==='main'||(ctx.kind==='comp'&&!c.vform))?c.q:null; if(q2 && q2.wh==='manner' && c.type==='normal' && c.pred && c.pred.k==='s' && !predS(c) && c.subj){ const n2=N(c.subj); const past2=['past','pastprog'].includes(c.tense); return n2.ja+(ctx.kind==='main'?'は':'が')+'どんなようす'+(past2?'だった':(ctx.kind==='main'?'':''))+(ctx.kind==='main'?'？':''); } }catch(e){}
  return _jc(c,ctx).replace(/知っていない/g,'知らない').replace(/知っていなかった/g,'知らなかった'); }); }
}
