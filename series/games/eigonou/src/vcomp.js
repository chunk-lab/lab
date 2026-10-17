import { P, T, jaClause, jaVerbOf, jconj, predV } from './engine.js';
// ================= to 〜 と 〜ing（動詞のあとに「〜すること」を続ける） =================
// ➡ to  ：気持ちがそっちへ向かう（まだ先のこと）   decide to go / want to go
// 📷 ing ：その動作を1枚の写真として切り取る（事実）  enjoy going / remember going
// f: 'to' | 'ing' | 'both'。ja は日本語の組み立て：pre(P,J,S) → 動詞の前に入る部分、v → 動詞の日本語を置きかえ
//   P：「〜を・〜で」など動詞より前の部分　J：jconj の活用　S：jvol（〜しよう）
export let VC;
export function vcOf(v){ return v? VC[v.id]||null : null; }
export function vcForms(v){ const x=vcOf(v); if(!x) return []; return x.f==='both'? ['to','ing'] : [x.f]; }
export function isVc(c){ return !!(c && c.subs && c.subs.comp && c.subs.comp.c && c.subs.comp.c.vform); }
// 〜しよう（意向形）
export function jvol(d, jt){
 if(jt==='s') return d.replace(/する$/,'')+'しよう'; if(jt==='k') return d.replace(/来る$|くる$/,'')+'来よう'; if(jt==='i') return d.slice(0,-1)+'よう';
 const O={う:'お',く:'こ',ぐ:'ご',す:'そ',つ:'と',ぬ:'の',ぶ:'ぼ',む:'も',る:'ろ'}; const l=d.slice(-1); return d.slice(0,-1)+(O[l]||'ろ')+'う';
}
// メインの文の「〜すること」部分の日本語 {pre, v}
export function vcJa(main){
 const sb=main.subs.comp, sc=sb.c, form=sc.vform, x=vcOf(predV(main)); const T=(x&&x[form])||{pre:(P,J)=>P+J.d+(form==='ing'?'のを':'ことを')};
 const base=jaClause(sc,{kind:'comp'}).replace(/[。？]$/,'');
 const sv=predV(sc);
 if(!sv){ let sfx=(form==='ing'?'のを':'ことを'); try{ if(!T.v&&T.pre){ const Z='\u0001'; const s2=T.pre('',{d:Z,ms:Z,pot:Z},Z); const k=s2.indexOf(Z); if(k===0&&s2.length>1&&!/練習|^\u0001$/.test(s2)) sfx=s2.slice(1); } }catch(e){}
  const bb=base.replace(/だ$/,''); const was=bb!==base; if(was) return {pre: bb+'でいる'+sfx, v:null};
  if(/(ある|いる)$/.test(base)) return {pre: base.replace(/ある$/,'いる')+sfx, v:null};
  if(/い$/.test(base)&&!/(ない|きれい|ゆうめい)$/.test(base)||/い$/.test(base)) return {pre: base+sfx, v:null};
  return {pre: base+'でいる'+sfx, v:null}; }
 const vj=jaVerbOf(sc)||[sv.ja,sv.jt]; const J=jconj(vj[0],vj[1]);
 const P= base.endsWith(J.d)? base.slice(0,-J.d.length) : base.replace(/[^をにでへとがは、]*$/,'');
 const r={pre:T.pre(P,J,jvol(vj[0],vj[1])),te:P+J.te};
 if(sc.whTo&&sc.q){ const wq=sc.q, WJ=wq.wh==='manner'?'どうやって':wq.wh==='place'?(sv.motion?'どこへ':'どこで'):wq.wh==='time'?'いつ':wq.wh==='obj'?(wq.w==='who'?'だれを':'何を'):wq.wh==='subj'?'だれが':''; r.pre=WJ+P+J.d+'か'; return r; }
 if(T.v) r.v=T.v;
 return r;
}

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_vcomp(){
VC = {
 x_decide:{f:'to', to:{pre:(P,J)=>P+J.d+'ことに'}},
 x_plan:{f:'to', to:{pre:(P,J)=>P+J.d+'つもりで', v:['いる','i']}},
 x_promise:{f:'to', to:{pre:(P,J)=>P+J.d+'と'}},
 x_learn:{f:'to', to:{pre:(P,J)=>P+J.pot.replace(/る$/,'るように'), v:['なる','g']}},
 x_agree:{f:'to', to:{pre:(P,J)=>P+J.d+'ことに'}},
 refuse:{f:'to', to:{pre:(P,J)=>P+J.d+'のを'}},
 c2_expect:{f:'to', to:{pre:(P,J)=>P+J.d+'つもりで', v:['いる','i']}},
 hope:{f:'to', to:{pre:(P,J)=>P+J.d+'ことを'}},
 choose:{f:'to', to:{pre:(P,J)=>P+J.d+'ことを'}},
 c2_offer:{f:'to', to:{pre:(P,J,S)=>P+S+'と'}},
 need:{f:'to', to:{pre:(P,J)=>P+J.d+'必要が', v:['ある','g']}},
 enjoy:{f:'ing', ing:{pre:(P,J)=>P+J.d+'のを'}},
 x_finish:{f:'ing', ing:{pre:(P,J)=>P+J.ms, v:['終える','i']}},
 x_keep:{f:'ing', ing:{pre:(P,J)=>P+J.ms, v:['続ける','i']}},
 practice:{f:'ing', ing:{pre:(P,J)=>P+J.d+'練習を'}},
 c2_avoid:{f:'ing', ing:{pre:(P,J)=>P+J.d+'のを'}},
 x_imagine:{f:'ing', ing:{pre:(P,J)=>P+J.d+'のを'}},
 c2_suggest:{f:'ing', ing:{pre:(P,J,S)=>P+S+'と'}},
 x_miss:{f:'ing', ing:{pre:(P,J)=>P+J.d+'のを'}},
 b_mind:{f:'ing', ing:{pre:(P,J)=>P+J.d+'のを', v:['気にする','s']}},
 look_forwardto:{f:'ing', ing:{pre:(P,J)=>P+J.d+'のを'}},
 give_up:{f:'ing', ing:{pre:(P,J)=>P+J.d+'のを'}},
 quit:{f:'ing', ing:{pre:(P,J)=>P+J.d+'のを', v:['やめる','i']}},
 x_try:{f:'both', to:{pre:(P,J,S)=>P+S+'と', v:['する','s']}, ing:{pre:(P,J)=>P+J.te, v:['みる','i']}},
 start:{f:'both', to:{pre:(P,J)=>P+J.ms, v:['始める','i']}, ing:{pre:(P,J)=>P+J.ms, v:['始める','i']}},
 x_begin:{f:'both', to:{pre:(P,J)=>P+J.ms, v:['始める','i']}, ing:{pre:(P,J)=>P+J.ms, v:['始める','i']}},
 continue:{f:'both', to:{pre:(P,J)=>P+J.ms, v:['続ける','i']}, ing:{pre:(P,J)=>P+J.ms, v:['続ける','i']}},
 like:{f:'both', to:{pre:(P,J)=>P+J.d+'のが'}, ing:{pre:(P,J)=>P+J.d+'のが'}},
 love:{f:'both', to:{pre:(P,J)=>P+J.d+'のが'}, ing:{pre:(P,J)=>P+J.d+'のが'}},
 x_hate:{f:'both', to:{pre:(P,J)=>P+J.d+'のが'}, ing:{pre:(P,J)=>P+J.d+'のが'}},
 x_prefer:{f:'both', to:{pre:(P,J)=>P+J.d+'ほうが'}, ing:{pre:(P,J)=>P+J.d+'ほうが'}},
 // 意味が変わるもの
 x_stop:{f:'both', diff:1, to:{pre:(P,J)=>P+J.d+'ために', v:['立ち止まる','g']}, ing:{pre:(P,J)=>P+J.d+'のを', v:['やめる','i']}},
 remember:{f:'both', diff:1, to:{pre:(P,J)=>'忘れずに'+P+J.d+'つもりで', v:['いる','i']}, ing:{pre:(P,J)=>P+J.ta+'ことを', v:['覚えている','i']}},
 forget:{f:'both', diff:1, to:{pre:(P,J)=>P+J.d+'のを'}, ing:{pre:(P,J)=>P+J.ta+'ことを'}},
};
}
