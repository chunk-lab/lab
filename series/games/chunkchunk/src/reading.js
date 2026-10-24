import { LVO, QUESTIONS, STORIES } from './data.js';
import { $, ENV, adaptLevel, parseSentence } from './engine.js';
import { loadSubs, openMyTexts, saveSubs } from './texts.js';
import { showTitle } from './title.js';
/* 図書館：リーディング。長文は共通の「読む画面」（core.reader）で開く。
   問題：[文の番号, 答えのユニットの番号, 問題文]。ユニットの番号は、その文を「 | 」で分けた何番目か（0から） */
export let readN=0;
export function builtinStory(s){const sens=s.list.map(([en,ja])=>parseSentence(en,ja));
  return {title:s.title,list:s.list,level:(LVO[s.id]??s.level),questions:(QUESTIONS[s.title]||[]).map(([si,ui,q])=>{const u=sens[si].units[ui];return {type:"range",si,a:u.s,b:u.e,alts:[],partials:[],q}})}}
/* 読み終えて閉じたら、記録に「リーディング」として知らせる（30秒未満は数えない） */
function reportRead(story,t0,g,ended){try{const min=Math.round((Date.now()-t0)/6e3)/10;if(min<0.5)return;
  const words=(story.list||[]).reduce((a,x)=>a+String(Array.isArray(x)?x[0]:(x&&x.en)||"").split(/\s+/).filter(Boolean).length,0);
  ENV.ctx.report("done",{play:"cc.read",book:story.my?undefined:"cc:"+story.title,title:story.title,min,words,score:g&&g.n?Math.round(g.res.reduce((a,x)=>a+({o:1,t:.5,x:0})[x],0)/g.n*100):undefined,finished:!!g||!!ended})}catch(e){}}
export function startRead(story){
  if(!story){const pool=STORIES.filter(s=>QUESTIONS[s.title]);story=builtinStory(pool[readN++%pool.length])}
  $("title").hidden=true;$("edView").hidden=true;
  const t0=Date.now();let graded=null,ended=false;
  ENV.core.reader.open(story,{
    backLabel:"← もどる",
    onClose:()=>{reportRead(story,t0,graded,ended);story.my?openMyTexts():showTitle()},
    onEnd:()=>{ended=true},
    onGrade:r=>(graded=r,r.n?adaptLevel(r.res.reduce((a,x)=>a+({o:1,t:.5,x:0})[x],0)/r.n,story.level):""),   // 結果でおすすめのレベルを調整
    onSubmit:sm=>{const list=loadSubs();list.push({textId:story.id,title:story.title,at:Date.now(),...sm});saveSubs(list)},   // テスト：この端末に保存（先生が My Texts の「提出結果」で見る）
    next:story.my?{label:"My Texts へ",fn:()=>{reportRead(story,t0,graded,ended);openMyTexts()}}:{label:"次のお話",fn:()=>{reportRead(story,t0,graded,ended);startRead()}}
  });
}
