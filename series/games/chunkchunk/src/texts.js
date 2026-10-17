import { LVO } from './data.js';
import { $, LS, LV, ask, closeSheet, esc, estimateLevel, lvLabel, openSheet, saveSettings, settings, startPractice, tell, toast } from './engine.js';
import { startRead } from './reading.js';
import { SHORTS, loadMyShorts, loadShorts, renderShortEditor, shortsShared } from './shorts.js';
import { showTitle } from './title.js';
/* ===== My Texts：長文の登録・チャンク分け・問題作成（この端末のブラウザに保存） ===== */
/* ===== みんなの長文・難易度の共有（共有データベース）。使えない環境では何も出ない ===== */
export let DB=null,DLC=null,IS_ADMIN=false,CAN_WRITE=null,MYID=null,SHARED=null;
export async function loadShared(){
  if(!DB)return SHARED;
  try{const snap=await DB.collection("texts").get();SHARED=snap.docs.map(d=>({...d.data(),id:d.id}));}catch(e){SHARED=SHARED||[]}
  return SHARED;
}
export async function initShared(){
  try{
    if(!window.claude||!claude.use)return;
    try{DLC=await claude.use("downloads")}catch(e){DLC=null}
    DB=await claude.use("db");if(!DB)return;
    const u=await claude.use("user");
    if(u){try{IS_ADMIN=!!(await u.canEdit())}catch(e){}try{CAN_WRITE=await u.can("data.write")}catch(e){}try{MYID=await u.id()}catch(e){}}
    try{const snap=await DB.collection("levels").get();snap.docs.forEach(d=>{const v=d.data();if(v&&v.level>=1&&v.level<=10)LVO[d.id]=v.level})}catch(e){}
    loadShared();loadShorts();
  }catch(e){DB=null}
}
export const MYKEY="ccs-mytexts",ROLES="SVOICPTMRF".split("");
export function loadMy(){try{return JSON.parse(LS.getItem(MYKEY)||"[]")}catch(e){return []}}
export function saveMy(list){try{LS.setItem(MYKEY,JSON.stringify(list));return true}catch(e){return false}}
export const TRASHKEY="ccs-trash",TRASH_DAYS=30;
export function loadTrash(){try{const now=Date.now();return JSON.parse(LS.getItem(TRASHKEY)||"[]").filter(t=>now-t.deletedAt<TRASH_DAYS*864e5)}catch(e){return []}}
export function saveTrash(l){try{LS.setItem(TRASHKEY,JSON.stringify(l));return true}catch(e){return false}}
export const SUBKEY="ccs-submits";
export function loadSubs(){try{return JSON.parse(LS.getItem(SUBKEY)||"[]")}catch(e){return []}}
export function saveSubs(l){try{LS.setItem(SUBKEY,JSON.stringify(l));return true}catch(e){return false}}
export function unitEnds(s){const n=s.words.length;return [...new Set([...(s.ends||[]),n-1])].filter(x=>x>=0&&x<n).sort((a,b)=>a-b)}
export function unitStarts(s){return [0,...unitEnds(s).slice(0,-1).map(e=>e+1)]}
export function myToStory(t){
  const clean=x=>x.replace(/[|=#{}]/g,"");
  const list=t.sents.map(s=>{let st=0;const soft=new Set(s.soft||[]),xs=new Set(s.xs||[]);
    const parts=unitEnds(s).map(e=>{const role=(s.roleAt||{})[st]||"M";
      const seg=[];let cur=[];   // 小さなまとまり（/）で分ける
      for(let k=st;k<=e;k++){const c=clean(s.words[k]);if(c&&c!=="/")cur.push(xs.has(k)&&!cur.length&&seg.length?"X:"+c:c);if(k<e&&soft.has(k)&&cur.length){seg.push(cur.join(" "));cur=[]}}
      if(cur.length)seg.push(cur.join(" "));
      const w=seg.join(" / ")||"…";
      let jp=((s.ujp||{})[st]||"").replace(/[|#{}]/g,"");
      const sj=(s.sjp||{})[st];if(seg.length>1&&Array.isArray(sj)&&sj.length===seg.length)jp+=`{${sj.map(x=>String(x).replace(/[|#{}\/]/g,"")).join("/")}}`;
      st=e+1;return `${role}:${w}=${jp}`});
    return [parts.join(" | "),s.ja||""]});
  const questions=(t.questions||[]).map(q0=>{const q=normQ(q0,t.sents);
    if(q.type==="choice"){const opts=[];let corr=-1;(q.options||[]).forEach((o,i)=>{if(o&&o.trim()){if(i===q.correct)corr=opts.length;opts.push(o)}});
      return opts.length?{type:"choice",q:q.q||"",options:opts,correct:corr,...(+q0.pts>0?{pts:+q0.pts}:{})}:null}
    return t.sents[q.si]?cleanQ({type:"range",q:q.q||"",si:q.si,a:q.a,b:q.b,alts:q.alts||[],partials:q.partials||[],...(+q0.pts>0?{pts:+q0.pts}:{})}):null;
  }).filter(Boolean);
  return {title:t.title||"無題",list,questions,my:true,id:t.id,mode:t.mode||"learn",level:t.level||null,hint:t.hint||"none",hintCost:t.hintCost==null?20:+t.hintCost};
}
/* お手軽自動：単語リストの規則で分ける（あとで手直しする前提） */
export const WS=str=>new Set(str.split(" "));
export const AW={
 det:WS("a an the my your his her its our their this that these those some any every each many much few several no two three four five"),
 subj:WS("i you he she it we they there"),
 obj:WS("me you him her it us them"),
 aux:WS("am is are was were be been being do does did don't doesn't didn't have has had will would can could shall should may might must won't can't isn't aren't wasn't weren't haven't hasn't not never"),
 prep:WS("in on at to for with from by about of into near under over after before during without through across behind between around like than along"),
 sub:WS("when because if while although though since until unless"),
 freq:WS("always usually often sometimes never also just really already still even"),
 part:WS("up out off away back down"),
 timeN:WS("yesterday today tomorrow tonight now morning mornings afternoon evening night nights week weekend month year years summer winter spring autumn fall monday tuesday wednesday thursday friday saturday sunday sundays ago o'clock time day days hour hours minute minutes lunch breakfast dinner school first end"),
 verb:WS("go goes went come comes came see sees saw make makes made take takes took get gets got give gives gave know knows knew think thinks thought want wants wanted like likes liked love loves play plays played read reads eat eats ate drink drinks drank run runs ran walk walks swim swims swam study studies live lives lived work works help helps tell tells told say says said find finds found buy buys bought bring brings brought leave leaves left meet meets met speak speaks spoke write writes wrote sing sings sang sit sits sat stand stands stood teach teaches taught feel feels felt keep keeps kept begin begins began become becomes became grow grows grew wait waits watch watches listen listens look looks use uses call calls try tries need needs start starts show shows open opens close closes visit visits stay stays talk talks learn learns cook cooks clean cleans carry carries catch catches build builds send sends sleep sleeps win wins won lose loses lost hear hears heard belong belongs seem seems taste tastes tasted sound sounds smell smells borrow borrows join joins thank thanks pick picks forget forgets forgot enjoy enjoys decide decides")
};
export const lw_=w=>w.toLowerCase().replace(/[^a-z']/g,"");
export function chunkSentence(words){
  const lw=words.map(lw_),n=words.length,units=[];let i=0;
  const isVerb=k=>k<n&&(AW.aux.has(lw[k])||AW.verb.has(lw[k])||(/ed$/.test(lw[k])&&lw[k].length>3));
  const isTimeStart=k=>k<n&&(AW.timeN.has(lw[k])&&!["school","lunch","dinner","breakfast","time","first","end"].includes(lw[k])||(["every","last","next","this","that"].includes(lw[k])&&AW.timeN.has(lw[k+1]||""))||lw[k]==="ago");
  const comma=j=>{for(let k=j;k<n;k++)if(/,$/.test(words[k]))return k;return -1};
  const push=(role,end)=>{if(end<i)return;units.push({role,s:i,e:end});i=end+1};
  // 文頭の「〜,」（時・理由・条件・場所）
  const c0=comma(0);
  if(c0>=0&&c0<n-1&&(AW.sub.has(lw[0])||AW.prep.has(lw[0])||isTimeStart(0))){
    const r=["because","since"].includes(lw[0])?"R":["if","unless"].includes(lw[0])?"F":lw.slice(0,c0+1).some(x=>AW.timeN.has(x))||AW.sub.has(lw[0])?"T":"P";push(r,c0)}
  // There is/are
  if(lw[i]==="there"&&AW.aux.has(lw[i+1]||"")){push("V",i+1)}
  else{ // 主語：最初の動詞の手前まで
    let v=-1;for(let k=i+1;k<n;k++)if(isVerb(k)){v=k;break}
    while(v>i+1&&AW.freq.has(lw[v-1]))v--;   // I usually go → usually は動詞側
    if(v>i)push("S",v-1);
  }
  // 動詞のまとまり
  if(i<n&&(isVerb(i)||units.length&&units[units.length-1].role==="S")){
    let e=i;while(e+1<n&&AW.freq.has(lw[e])&&!isVerb(e))e++;
    while(e+1<n){const x=lw[e+1];
      if(AW.aux.has(x)||AW.freq.has(x)){e++;continue}
      if(isVerb(e+1)&&(AW.aux.has(lw[e])||AW.freq.has(lw[e])||lw[e]==="to")){e++;continue}
      if(x==="to"&&isVerb(e+2)){e++;continue}
      if(AW.part.has(x)&&!/[,.]$/.test(words[e])){e++;continue}
      if(/ing$/.test(x)&&AW.aux.has(lw[e])){e++;continue}
      if(["good","interested","afraid","proud","fond"].includes(x)&&AW.aux.has(lw[e])&&["at","in","of"].includes(lw[e+2]||"")){e+=2;continue}
      break}
    push("V",e);
  }
  const vUnit=units.find(u=>u.role==="V"),beOnly=vUnit&&words.slice(vUnit.s,vUnit.e+1).every(w=>AW.aux.has(lw_(w))||lw_(w)==="there");
  let objDone=false;
  // 残り：前置詞のまとまり・時のまとまり・名詞のまとまりに分ける
  while(i<n){
    const st=i;let e=i;
    const stopAt=k=>AW.prep.has(lw[k])&&lw[k]!=="of"||AW.sub.has(lw[k])||isTimeStart(k);
    if(AW.sub.has(lw[i])){e=comma(i);if(e<0)e=n-1;push(["because","since"].includes(lw[i])?"R":["if","unless"].includes(lw[i])?"F":"T",e);continue}
    if(isTimeStart(i)){while(e+1<n&&!/[,.!?]$/.test(words[e])&&(AW.timeN.has(lw[e+1])||AW.det.has(lw[e+1])||lw[e+1]==="ago"))e++;push("T",e);continue}
    if(AW.prep.has(lw[i])){while(e+1<n&&!/[,.!?]$/.test(words[e])&&!stopAt(e+1))e++;
      const ws=lw.slice(st,e+1),r=ws.some(x=>AW.timeN.has(x))&&!ws.includes("school")?"T":["with","by","for","about","like","without","than"].includes(lw[st])?"M":"P";push(r,e);continue}
    while(e+1<n&&!/[,.!?]$/.test(words[e])&&!stopAt(e+1)){ // 名詞のまとまり（me a present のような2つ目の目的語も分ける）
      if(!objDone&&AW.obj.has(lw[e])&&e===st&&!AW.prep.has(lw[e+1]))break;
      e++}
    const role=beOnly&&!objDone?"C":(!objDone&&AW.obj.has(lw[st])&&e===st&&e+1<n&&!stopAt(e+1)?"I":"O");
    push(role,e);if(role!=="I")objDone=true;
  }
  const roleAt={};units.forEach(u=>roleAt[u.s]=u.role);
  return {words,ends:units.map(u=>u.e),roleAt,ujp:{},ja:""};
}
export function splitSentences(text){return text.replace(/\s+/g," ").trim().split(/(?<=[.!?]["']?)\s+(?=["']?[A-Z])/).filter(Boolean)}
export function autoChunk(text){return splitSentences(text).map(t=>chunkSentence(t.split(" ").filter(Boolean)))}
/* AIへの指示文（ページから頼む時も、コピペ方式でも同じもの） */
export function buildAIPrompt(text){
  const R=+settings.qRange||0,C=+settings.qChoice||0,lang=settings.qLang==="en"?"英語":"日本語";
  const qPart=R+C>0?`
また、長文の内容について問題を作り、"questions" に入れてください。
・範囲で答える問題：${R}問（本文の中から答えの部分を選ばせる問題）
・5択問題：${C}問（選択肢は5つ、正解は1つ）
・問題文と選択肢は${lang}で書く。
・accept（◯にする別の答え）と partial（△にする答え）は、本当にある時だけ入れる。無ければ空の配列 [] にする。answer と同じものは入れない。
・下の「問題：」に問題が貼り付けてあれば、新しく作らずにそれを使う（問題文はそのまま。答えの場所・選択肢・正解を読み取って、下の形に合わせる）。
範囲の問題の形：{"type":"range","q":"問題文","sentence":答えがある文の番号（1から）,"answer":"答えの部分（本文の英語そのまま）","accept":["◯にしてよい別の答え（本文の英語そのまま）"],"partial":["△にする答え（本文の英語そのまま）"]}
5択の問題の形：{"type":"choice","q":"問題文","options":["選択肢1","選択肢2","選択肢3","選択肢4","選択肢5"],"correct":正解の番号（0から）}`:"";
  return `英語の長文を、日本人学習者向けの「チャンク読み」アプリ用に、意味のまとまり（チャンク）に分けてください。
説明やコードブロック（\`\`\`）は付けず、次の形のJSONだけを返してください。
{"title":"タイトル","level":難易度の番号,"sentences":[{"ja":"文全体の自然な日本語訳","units":[{"role":"S","text":"元の英語そのまま（中を小さく分けるときは / を入れる）","ja":"この役割のかたまりの日本語","subja":["小さなまとまりの日本語","…"]}]}]${R+C>0?',"questions":[ ... ]':""}}

ルール：
・title：英文にタイトルがあれば、それをそのまま入れる（タイトルは本文の文としては入れない）。なければ、内容に合う短いタイトルを付ける。
・level：長文の難易度を1〜10の番号で。1＝入門（小学校低〜中学年） 2＝小学校高学年 3＝中1・英検5級 4＝中2・英検4級 5＝中3・英検3級（CEFR A1） 6＝高1〜2・英検準2級（A2） 7＝高3・英検2級（B1） 8＝難関大・英検準1級（B2） 9＝大学・英検1級（C1） 10＝それ以上（C2）
・長文を1文ずつに分ける。各文の units には、その文の単語を順番どおりに、元の単語・記号のまま、もれなく入れる。
・role（役割）は次のどれか1つ。
  S＝主語（後ろから説明がつく主語も、説明ごと S に含める）
  V＝動詞のまとまり（助動詞、否定、usually などの頻度の副詞、句動詞の up・out など、to不定詞の動詞、take care of・look forward to・be good at などの熟語も含める）
  O＝目的語　I＝「誰に」にあたる目的語　C＝補語
  P＝場所　T＝時（when… や after… などの時の節も含む）
  M＝様子・手段・誰と・目的・その他　R＝理由（because… など）　F＝条件（if… など）
・役割のかたまりの中は、意味のまとまり（チャンク）ごとに「 / 」で小さく分ける。ゲームでは、役割のかたまり全体で切っても、「 / 」で分けた小さなまとまりで切っても正解になる。
  ・原則：意味の分かれ目があれば、補助の区切り「 / 」を入れる。迷ったら入れる。ただし、単語ごとに細かく切ることはしない。下に挙げるのは例で、これに限らない。
  ・主語・目的語・補語に、後ろから説明（関係詞・形容詞句・前置詞句・分詞など）がつくときは、説明も同じ役割に入れたまま「中心 / 説明」と分ける。例：The man / who lives next door
  ・動詞は、助動詞（can・will・must・should など）を先に分ける。また be going to・decided to・want to・used to・have to などの「熟語＋動詞」は「熟語 / 動詞」と分ける。例：can / have an influence on　will / be able to / speak　decided to / visit
  ・場所・時・様子・理由・条件が長いときは、意味の切れ目で分ける。直前の名詞や語句を後ろから説明する部分は、その小さなまとまりの先頭に「X:」を付ける（「つけ足し」の印）。例：in the small town / X:by the sea（text の中でも「 / X:by the sea」のように書く）。主語・目的語・補語の「中心 / 説明」には付けない。
  ・対になる言い方や、意味が分かれる言い方も分ける。例：not only English / but also French　both A / and B　either A / or B　so that / you can find it　in order to / catch the train　more difficult / than I thought　It is important / for you / to get enough sleep（for 〜 / to 〜 は M の中で分ける）
  ・取り残さない：冠詞＋名詞、前置詞＋名詞、to＋動詞のように、1つでは意味にならない語は、前後の語から切り離さない。not only・so that・in order to のように、それだけで1つの意味になる語句は、1つのまとまりにしてよい。
  ・「 / 」で分けたかたまりだけ、units に "subja" を付け、分けた数と同じ数の日本語を順番どおりに入れる。分けないかたまりには "subja" を付けない。
  　例：{"role":"S","text":"The man / who lives next door","ja":"隣に住む男の人は","subja":["男の人は","隣に住む"]}
・チャンクの ja は、つなげて読める形にする（主語は「〜は／〜が」、目的語は「〜を」など）。${qPart}

長文：
${text?`"""${text}"""`:"（この下に英文を貼り付けてください）\n"}${R+C>0?`
問題：
（用意した問題があれば、この下に貼り付け。なければ空のまま）
`:""}`;
}
export function aiResultToSents(out){
  const arr=v=>Array.isArray(v)?v:v==null?[]:[v];
  return arr(out&&out.sentences).map(x=>{const words=[],ends=[],roleAt={},ujp={},sjp={},soft=new Set(),xs=new Set();
    arr(x&&x.units).forEach(u=>{if(!u)return;
      const st=words.length,r=String(u.role||"").trim().toUpperCase()[0];let n=0;
      let xNext=false;
      String(u.text||"").trim().split(/\s+/).filter(Boolean).forEach(t=>{   // 「/」だけの語は、小さなまとまりの区切り。「/ X:」は「つけ足し」
        if(t==="/"){if(n>0)soft.add(words.length-1);xNext=false}
        else if(/^X:$/i.test(t)&&n>0&&soft.has(words.length-1))xNext=true;
        else if(/^X:./i.test(t)&&n>0&&soft.has(words.length-1)){xs.add(words.length);words.push(t.slice(2));n++;xNext=false}
        else{if(xNext){xs.add(words.length);xNext=false}words.push(t);n++}});
      if(!n)return;
      soft.delete(words.length-1);   // かたまりの最後の「/」は区切りにしない
      roleAt[st]=ROLES.includes(r)?r:"M";ujp[st]=String(u.ja||"");ends.push(words.length-1);
      const sj=arr(u.subja).map(String).filter(Boolean);if(sj.length>1)sjp[st]=sj});
    return {words,ends,roleAt,ujp,sjp,xs:[...xs],soft:[...soft].sort((a,b)=>a-b),ja:String((x&&x.ja)||"")}}).filter(x=>x.words.length);
}
/* 指示文の枠を、今の英文に合わせる */
export let lastPromptSrc=null;
export function syncPrompt(force){
  const tx=$("edText"),pr=$("edPrompt");if(!tx||!pr)return;
  const t=tx.value.trim();if(!force&&t===lastPromptSrc)return;lastPromptSrc=t;
  pr.value=buildAIPrompt(t);
}
/* 本文の英語から、何文目の何語目〜何語目かを探す */
export const normW=w=>String(w).toLowerCase().replace(/[^a-z0-9']/g,"");
export function findSpan(sents,siHint,text){
  const tw=String(text||"").trim().split(/\s+/).map(normW).filter(Boolean);if(!tw.length)return null;
  const order=[siHint,...sents.map((_,i)=>i).filter(i=>i!==siHint)].filter(i=>i>=0&&i<sents.length);
  for(const si of order){const ws=sents[si].words.map(normW);
    for(let a=0;a+tw.length<=ws.length;a++){let ok=true;for(let k=0;k<tw.length;k++)if(ws[a+k]!==tw[k]){ok=false;break}
      if(ok)return {si,a,b:a+tw.length-1}}}
  return null;
}
/* 別解・△の答えから、未設定のもの・正解と同じもの・重複を取り除く */
export function cleanQ(q){
  if(q.type!=="range")return q;
  const key=x=>`${x.si}:${x.a}:${x.b}`,valid=x=>x&&x.a>=0&&x.b>=0,seen=new Set([key(q)]);
  const alts=(q.alts||[]).filter(x=>valid(x)&&!seen.has(key(x))&&seen.add(key(x)));
  const partials=(q.partials||[]).filter(x=>valid(x)&&!seen.has(key(x))&&seen.add(key(x)));
  return {...q,alts,partials};
}
export function aiResultToQuestions(out,sents){
  const arr=v=>Array.isArray(v)?v:v==null||v===""?[]:[v];
  return arr(out&&out.questions).map(q=>{try{
    if(!q||typeof q!=="object")return null;
    const type=String(q.type||"").toLowerCase();
    if(type==="choice"||Array.isArray(q.options)){const o=arr(q.options).map(String).slice(0,5);while(o.length<5)o.push("");
      let c=parseInt(q.correct,10);if(isNaN(c))c=Math.max(0,o.indexOf(String(q.correct)));
      return {type:"choice",q:String(q.q||q.question||""),options:o,correct:Math.max(0,Math.min(4,c))}}
    const hint=(parseInt(q.sentence,10)||1)-1,m=findSpan(sents,hint,q.answer);if(!m)return null;
    const alts=arr(q.accept).map(t=>findSpan(sents,m.si,t)).filter(Boolean);
    const partials=arr(q.partial).map(t=>findSpan(sents,m.si,t)).filter(Boolean);
    return cleanQ({type:"range",q:String(q.q||q.question||""),si:m.si,a:m.a,b:m.b,alts,partials});
  }catch(e){return null}}).filter(Boolean);
}
/* 古い形（チャンクの始まりだけ）の範囲問題を、何語目〜何語目の形にそろえる */
export function normQ(q,sents){
  if(q.type!=="range"||q.a!=null)return q;
  const s=sents[q.si];if(!s)return q;const st=unitStarts(s),en=unitEnds(s);
  const k=Math.max(0,en.findIndex((e,i)=>q.w>=st[i]&&q.w<=e));
  return {...q,a:st[k],b:en[k],alts:q.alts||[],partials:q.partials||[]};
}
/* コピペ方式：AIの返事（前後に説明文や ``` が付いていてもよい）からJSONを取り出す */
export function parsePastedAI(t){
  // 最初の「{」から、対応する「}」までを取り出す（文字列の中の { } は数えない）
  t=String(t).replace(/^﻿/,"");
  const a=t.indexOf("{");if(a<0)throw new Error("「{」で始まるデータが見つかりません");
  let depth=0,inStr=false,esc2=false,b=-1;
  for(let i=a;i<t.length;i++){const c=t[i];
    if(inStr){if(esc2)esc2=false;else if(c==="\\")esc2=true;else if(c==='"'||c==="”"||c==="“")inStr=false;continue}
    if(c==='"'||c==="“"||c==="”"){inStr=true;continue}
    if(c==="{")depth++;else if(c==="}"){depth--;if(depth===0){b=i;break}}}
  if(b<0)throw new Error("データの終わり「}」が見つかりません（返事の最後まで貼り付けたか確認）");
  const raw=t.slice(a,b+1);
  const tries=[raw,
    raw.replace(/,\s*([}\]])/g,"$1"),                                   // 最後の要素のあとのカンマ
    raw.replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/,\s*([}\]])/g,"$1"),  // 全角の引用符
    raw.replace(/[“”]/g,'"').replace(/,\s*([}\]])/g,"$1").replace(/\/\/[^\n"]*$/gm,"")]; // コメント
  let last;for(const x of tries){try{return JSON.parse(x)}catch(e){last=e}}
  throw new Error("データの形が崩れています（"+(last&&last.message||"")+"）");
}
export async function copyText(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  try{const ta=document.createElement("textarea");ta.value=t;ta.style.position="fixed";ta.style.opacity="0";document.body.append(ta);ta.select();const ok=document.execCommand("copy");ta.remove();return ok}catch(e){return false}
}
/* AIで分ける：ページからClaudeに頼む（使う人のアカウントの利用量を使う。初回は確認が出る） */
export async function aiChunk(text){
  const sample=window.claude?await window.claude.use("sample"):null;
  if(!sample){edStatus("この画面ではAIが使えません。「お手軽自動」を使ってください。");return}
  edStatus("AIで分けています…（10〜60秒ほど）");$("edAI").disabled=true;
  const prompt=buildAIPrompt(text);
  try{
    const out=await sample.json(prompt,{modelTier:"default"});
    const sents=aiResultToSents(out),qs=aiResultToQuestions(out,sents);
    if(!sents.length)throw {message:"結果が空でした"};
    edCollect();ED.sents=sents;if(qs.length)ED.questions=qs;
    if(out&&out.title&&!String(ED.title||"").trim())ED.title=String(out.title).trim();
    if(!ED.level){const l=parseInt(out&&out.level,10);ED.level=l>=1&&l<=10?l:estimateLevel(sents)}
    renderEditor();edStatus(`AIで分けました（役割・訳つき${qs.length?`・問題${qs.length}問`:""}）。気になる所は直してください。`);
  }catch(e){edStatus(e&&e.code==="not_granted"?"AIの利用が許可されませんでした。":`AIで分けられませんでした（${esc((e&&(e.code||e.message))||"エラー")}）。「お手軽自動」を使ってください。`)}
  finally{const b=$("edAI");if(b)b.disabled=false}
}
export let ED=null;
export const edStatus=t=>{const el=$("edStatus");if(el)el.innerHTML=t};
export function openMyTexts(){$("edView").hidden=false;ED=null;renderMyList()}
export function showSubs(t){
  const subs=loadSubs().filter(x=>x.textId===t.id),MK={o:"◯",t:"△",x:"×"};
  openSheet(`<h2>提出結果：${esc(t.title||"無題")}</h2>
    ${subs.map((s,k)=>{const sc=s.answers.filter(a=>a.mark==="o").length;
      return `<div class="rvw"><span class="lab">${new Date(s.at).toLocaleString()}　◯${sc}／${s.answers.length}${s.score!=null?`　${s.score}／${s.max}点`:""}</span>
        ${s.answers.map((a,i)=>`<div class="en" style="font-size:13px">Q${i+1} ${MK[a.mark]}${a.hint?"💡":""} ${esc(a.mine||"（未回答）")}${a.why?` <small class="why">${esc(a.why)}</small>`:""}</div>`).join("")}</div>`}).reverse().join("")}
    <p class="note">いまは、この端末で提出された答えだけが見えます（共有はサイトへ引っ越してから）。</p>
    <div class="btns"><button class="ghost" id="subsClear">提出結果を消す</button><button class="primary" id="closeBtn">閉じる</button></div>`);
  $("closeBtn").onclick=closeSheet;
  $("subsClear").onclick=async()=>{if(await ask("この長文の提出結果を全部消しますか？","消す")){saveSubs(loadSubs().filter(x=>x.textId!==t.id));closeSheet();renderMyList()}};
}
export function showTrash(){
  const tr=loadTrash();
  openSheet(`<h2>ゴミ箱</h2><p class="note">削除した長文は${TRASH_DAYS}日間ここに残ります。</p>
    ${tr.length?"":`<p class="note">ゴミ箱は空です。</p>`}
    ${tr.map((t,i)=>`<div class="rvw"><b>${esc(t.title||"（無題）")}</b><span class="lab">${(t.sents||[]).length}文・${(t.questions||[]).length}問・削除：${new Date(t.deletedAt).toLocaleDateString()}（あと${Math.max(0,Math.ceil(TRASH_DAYS-(Date.now()-t.deletedAt)/864e5))}日）</span>
      <div class="btns"><button class="primary" data-restore="${i}">元に戻す</button><button class="ghost" data-purge="${i}" style="color:var(--bad)">完全に削除</button></div></div>`).join("")}
    <div class="btns"><button class="ghost" id="closeBtn">閉じる</button></div>`);
  $("closeBtn").onclick=()=>{closeSheet();renderMyList()};
  $("sheet").querySelectorAll("[data-restore]").forEach(b=>b.onclick=()=>{const tr=loadTrash(),t=tr.splice(+b.dataset.restore,1)[0];delete t.deletedAt;
    const list=loadMy();list.unshift(t);saveMy(list);saveTrash(tr);toast("元に戻しました");showTrash()});
  $("sheet").querySelectorAll("[data-purge]").forEach(b=>b.onclick=async()=>{const tr=loadTrash(),t=tr[+b.dataset.purge];
    if(!(await ask(`「${t.title||"無題"}」を完全に削除しますか？`,"完全に削除")))return;
    if(!(await ask("完全に削除すると、もう元に戻せません。提出結果も一緒に消えます。\n本当に削除しますか？","本当に削除する")))return;
    tr.splice(+b.dataset.purge,1);saveTrash(tr);saveSubs(loadSubs().filter(x=>x.textId!==t.id));toast("完全に削除しました");showTrash()});
}
/* バックアップ：My Texts・みんなの長文・難易度の修正を1つのファイルに書き出す／My Texts に戻す */
export async function exportBackup(){
  if(DB)await loadShared();
  const data=JSON.stringify({app:"chunkchunk",v:1,at:new Date().toISOString(),myTexts:loadMy(),shared:(SHARED||[]).map(({by,at,...t})=>t),levels:LVO},null,1);
  const fn=`chunkchunk-backup-${new Date().toISOString().slice(0,10)}.json`;
  if(DLC){try{await DLC.save({filename:fn,data:new Blob([data],{type:"application/json"})});toast("書き出しました");return}
    catch(e){if(e&&(e.code==="declined"||e.code==="rate_limited"))return}}
  openSheet(`<h2>バックアップ</h2><p class="note">ファイルとして保存できなかったので、下の文字を全部コピーして、メモなどに貼って保管してください。</p>
    <textarea id="bkText" readonly rows="8" style="width:100%;font-size:12px;background:var(--surface2);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px"></textarea>
    <div class="btns"><button class="ghost" id="closeBtn">閉じる</button><button class="primary" id="bkSel">全部選択</button></div>`);
  $("bkText").value=data;$("bkSel").onclick=()=>{$("bkText").focus();$("bkText").select()};$("closeBtn").onclick=closeSheet;
}
export async function importBackup(text){
  let d;try{d=JSON.parse(text)}catch(e){await tell("読み込めませんでした。バックアップのファイルか確認してください。");return}
  if(!d||d.app!=="chunkchunk"){await tell("このアプリのバックアップではないようです。");return}
  const mine=loadMy(),ids=new Set(mine.map(t=>t.id));let n=0;
  [...(d.myTexts||[]),...(d.shared||[])].forEach(t=>{if(t&&t.id&&!ids.has(t.id)&&Array.isArray(t.sents)){ids.add(t.id);mine.push(t);n++}});
  saveMy(mine);
  let lv=0;
  if(DB&&IS_ADMIN&&d.levels)for(const [k,v] of Object.entries(d.levels)){if(v>=1&&v<=10&&LVO[k]==null){try{await DB.doc("levels/"+k).set({level:v});LVO[k]=v;lv++}catch(e){}}}
  toast(`戻しました：長文${n}本${lv?`・難易度の修正${lv}件`:""}`);renderMyList();
}
export async function renderShared(){
  const box=$("edShared");if(!box)return;
  const list=await loadShared();if(!$("edShared"))return;
  if(!list.length){box.innerHTML=`<p class="edStatus">まだ共有された長文はありません。自分の長文の「共有に送る」で追加できます。</p>`;return}
  box.innerHTML=list.map((t,i)=>{const lv=LVO["t-"+t.id]!=null?LVO["t-"+t.id]:t.level,mine=MYID&&t.by===MYID;
    return `<div class="edItem"><b>${esc(t.title||"（無題）")}${mine?" （自分が送信）":""}</b><small>${esc(lvLabel(lv))}・${(t.sents||[]).length}文・${(t.questions||[]).length}問・${t.mode==="test"?"テスト用":"学習用"}</small>
      <div class="edRow"><button class="edBtn" data-s="read" data-i="${i}">${t.mode==="test"?"テストを受ける":"Reading"}</button><button class="edBtn" data-s="prac" data-i="${i}">Practice</button><button class="edBtn" data-s="copy" data-i="${i}">自分用にコピー</button>${mine||IS_ADMIN?`<button class="edBtn del" data-s="drop" data-i="${i}">取り下げ</button>`:""}</div></div>`}).join("");
  box.querySelectorAll("[data-s]").forEach(b=>b.onclick=async()=>{const t=list[+b.dataset.i],a=b.dataset.s;
    if(a==="copy"){const mine=loadMy(),c=JSON.parse(JSON.stringify(t));delete c.by;delete c.at;c.id="t"+Date.now();mine.unshift(c);saveMy(mine);toast("自分用にコピーしました（編集できます）");renderMyList();return}
    if(a==="drop"){if(!(await ask(`「${t.title||"無題"}」を、みんなの長文から取り下げますか？\n共有相手の画面から消えます。`,"取り下げる")))return;
      try{await DB.doc("texts/"+t.id).delete();SHARED=SHARED.filter(x=>x.id!==t.id);toast("取り下げました")}catch(e){await tell("取り下げできませんでした。")}
      renderShared();return}
    $("edView").hidden=true;const st={...myToStory(t),level:LVO["t-"+t.id]!=null?LVO["t-"+t.id]:t.level};
    if(a==="read")startRead(st);else startPractice(t)});
}
export async function shareText(t){
  if(!DB)return;
  await loadShared();const exists=(SHARED||[]).some(x=>x.id===t.id);
  const msg=exists?`「${t.title||"無題"}」はすでに共有されています。今の内容で上書きしますか？`:`「${t.title||"無題"}」を「みんなの長文」に送りますか？\n共有相手の全員が読めるようになります。`;
  if(!(await ask(msg,exists?"上書きする":"送る")))return;
  const doc={id:t.id,title:t.title||"",text:t.text||"",sents:t.sents||[],questions:t.questions||[],level:t.level||null,mode:t.mode||"learn",by:MYID||null,at:Date.now()};
  try{await DB.doc("texts/"+t.id).set(doc);SHARED=(SHARED||[]).filter(x=>x.id!==t.id).concat([doc]);toast("みんなの長文に送りました");renderMyList()}
  catch(e){await tell(e&&e.code==="quota_exceeded"?"共有の保存数がいっぱいです。不要な長文を取り下げてください。":"送れませんでした。共有への書き込み権限がないか、通信の問題かもしれません。")}
}
export function renderMyList(){
  const list=loadMy();$("edHead").textContent="My Texts";
  $("edBody").innerHTML=`<p class="edStatus">登録した長文は、この端末のブラウザに保存されます（共有は今後対応）。</p>
    <button class="edBtn pri" id="edNew">＋ 長文を登録する</button>
    <button class="edBtn" id="edShort">＋ 短文をまとめて入れる（自分の短文 ${loadMyShorts().length}文${DB&&SHORTS?`・みんなの短文 ${shortsShared().length}文`:""}）</button>
    ${list.length?"":`<p class="edStatus">まだ登録がありません。</p>`}
    ${list.map((t,i)=>{const subs=loadSubs().filter(x=>x.textId===t.id).length;
      return `<div class="edItem"><b>${esc(t.title||"（無題）")}</b><small>${esc(lvLabel(t.level))}・${(t.sents||[]).length}文・${(t.questions||[]).length}問・${t.mode==="test"?"テスト用":"学習用"}${subs?`・提出${subs}件`:""}</small>
      <div class="edRow"><button class="edBtn" data-a="read" data-i="${i}">${t.mode==="test"?"テストを受ける":"Reading"}</button><button class="edBtn" data-a="prac" data-i="${i}">Practice</button><button class="edBtn" data-a="edit" data-i="${i}">編集</button>${DB&&CAN_WRITE!==false&&(t.sents||[]).length?`<button class="edBtn" data-a="share" data-i="${i}">共有に送る</button>`:""}${subs?`<button class="edBtn" data-a="subs" data-i="${i}">提出結果</button>`:""}<button class="edBtn del" data-a="del" data-i="${i}">削除</button></div></div>`}).join("")}`;
  const tr=loadTrash();
  if(DB){$("edBody").insertAdjacentHTML("beforeend",`<h3 class="edSharedH">みんなの長文</h3><div id="edShared"><p class="edStatus">読み込み中…</p></div>`);renderShared()}
  $("edBody").insertAdjacentHTML("beforeend",`<button class="edBtn" id="edTrash" style="margin-top:12px">🗑 ゴミ箱（${tr.length}）</button>
    <div class="edRow" style="margin-top:8px"><button class="edBtn" id="edBackup">💾 バックアップを書き出す</button><button class="edBtn" id="edRestore">📥 バックアップから戻す</button><input type="file" id="edRestoreFile" accept=".json,application/json" hidden></div>`);
  $("edTrash").onclick=showTrash;
  $("edBackup").onclick=exportBackup;
  $("edRestore").onclick=()=>$("edRestoreFile").click();
  $("edRestoreFile").onchange=async e=>{const f=e.target.files[0];if(f)importBackup(await f.text());e.target.value=""};
  $("edNew").onclick=()=>{ED={id:"t"+Date.now(),title:"",text:"",sents:[],questions:[]};renderEditor()};
  $("edShort").onclick=()=>renderShortEditor();
  $("edBody").querySelectorAll("[data-a]").forEach(b=>b.onclick=async()=>{
    const t=list[+b.dataset.i],a=b.dataset.a;
    if(a==="edit"){ED=JSON.parse(JSON.stringify(t));ED.questions=(ED.questions||[]).map(q=>cleanQ(normQ(q,ED.sents||[])));renderEditor()}
    else if(a==="subs")showSubs(t);
    else if(a==="share")shareText(t);
    else if(a==="del"){
      if(!(await ask(`「${t.title||"無題"}」を削除しますか？`,"削除する")))return;
      if(!(await ask(`本文・チャンク分け・問題など、この長文の内容がすべて一覧から消えます。\n（ゴミ箱に${TRASH_DAYS}日間残るので、その間は元に戻せます）\n本当に削除しますか？`,"本当に削除する")))return;
      list.splice(+b.dataset.i,1);saveMy(list);const tr=loadTrash();tr.unshift({...t,deletedAt:Date.now()});saveTrash(tr);
      renderMyList();toast("ゴミ箱に移しました")}
    else if(!t.sents||!t.sents.length)tell("まだチャンク分けされていません。「編集」から分けてください。");
    else{$("edView").hidden=true;if(a==="read")startRead(myToStory(t));else startPractice(t)}
  });
}
export function edCollect(){
  if(!ED||!$("edTitle"))return;
  ED.title=$("edTitle").value;ED.text=$("edText").value;
  if($("edMode"))ED.mode=$("edMode").value;
  if($("edLevel"))ED.level=+$("edLevel").value||null;
  if($("edHint")){ED.hint=$("edHint").value;ED.hintCost=+$("edHintCost").value}
  document.querySelectorAll(".qPts").forEach(x=>{const q=ED.questions[+x.dataset.q];if(q)q.pts=+x.value>0?+x.value:100});
  document.querySelectorAll(".spanPick").forEach(x=>{const q=ED.questions[+x.dataset.q];if(!q)return;
    const v={si:+x.querySelector(".spS").value,a:+x.querySelector(".spA").value,b:+x.querySelector(".spB").value};
    if(v.a>=0&&v.b<0)v.b=v.a;if(v.b>=0&&v.a<0)v.a=v.b;if(v.b<v.a)[v.a,v.b]=[v.b,v.a];
    if(x.dataset.kind==="main")Object.assign(q,v);else (q[x.dataset.kind]=q[x.dataset.kind]||[])[+x.dataset.k]=v});
  document.querySelectorAll(".edJa").forEach(x=>{const s=ED.sents[+x.dataset.si];if(s)s.ja=x.value});
  document.querySelectorAll(".qText").forEach(x=>{ED.questions[+x.dataset.q].q=x.value});
  document.querySelectorAll(".qOpt").forEach(x=>{ED.questions[+x.dataset.q].options[+x.dataset.i]=x.value});
  document.querySelectorAll(".qCorrect").forEach(x=>{if(x.checked)ED.questions[+x.dataset.q].correct=+x.dataset.i});
}
export function spanPicker(qi,kind,k,v){   // 文・最初の語・最後の語を選ぶ。チャンクからまとめて選ぶこともできる
  const s=ED.sents[v.si]||ED.sents[0];if(!s)return "";
  const wopt=(sel)=>`<option value="-1" ${sel<0?"selected":""}>（選ぶ）</option>`+s.words.map((w,i)=>`<option value="${i}" ${i===sel?"selected":""}>${i+1}. ${esc(w)}</option>`).join("");
  const chunkOpts=ED.sents.map((ss,si)=>{const st=unitStarts(ss),en=unitEnds(ss);
    return st.map((a,j)=>`<option value="${si}:${a}:${en[j]}">文${si+1}: ${esc(ss.words.slice(a,en[j]+1).join(" "))}</option>`).join("")}).join("");
  return `<div class="spanPick" data-q="${qi}" data-kind="${kind}" data-k="${k}">
    <select class="spS">${ED.sents.map((_,si)=>`<option value="${si}" ${si===v.si?"selected":""}>文${si+1}</option>`).join("")}</select>
    <select class="spA">${wopt(v.a)}</select><span>〜</span><select class="spB">${wopt(v.b)}</select>
    <select class="spChunk"><option value="">チャンクから選ぶ</option>${chunkOpts}</select>
    ${kind!=="main"?`<button class="edBtn del spDel">✕</button>`:""}
    <div class="spPrev">${v.a>=0&&v.b>=0?esc(s.words.slice(Math.min(v.a,v.b),Math.max(v.a,v.b)+1).join(" ")):`<span style="color:#6b7686">まだ選んでいません（選ばないままなら保存時に消えます）</span>`}</div></div>`;
}
export function renderEditor(){
  $("edHead").textContent=ED.title?`編集：${ED.title}`:"新しい長文";
  const sentHTML=ED.sents.map((s,si)=>{const en=new Set(unitEnds(s)),starts=new Set(unitStarts(s));
    return `<div class="edSent"><div class="edWords">${s.words.map((w,j)=>
      (starts.has(j)?`<button class="roleChip r${(s.roleAt||{})[j]||"M"}" data-si="${si}" data-u="${j}">${(s.roleAt||{})[j]||"M"}</button>`:"")+
      `<span class="edW">${esc(w)}</span>`+(j<s.words.length-1?`<button class="edGap ${en.has(j)?"on":""}" data-si="${si}" data-g="${j}">｜</button>`:"")).join("")}</div>
      <input type="text" class="edJa" data-si="${si}" placeholder="訳（任意）" value="${esc(s.ja||"")}"></div>`}).join("");
  const qHTML=ED.questions.map((q,qi)=>q.type==="choice"
    ?`<div class="edQ"><small>5択問題</small><input type="text" class="qText" data-q="${qi}" value="${esc(q.q||"")}" placeholder="問題文">
       ${[0,1,2,3,4].map(i=>`<div class="choiceRow"><input type="radio" name="qc${qi}" class="qCorrect" data-q="${qi}" data-i="${i}" ${q.correct===i?"checked":""} aria-label="正解"><input type="text" class="qOpt" data-q="${qi}" data-i="${i}" value="${esc((q.options||[])[i]||"")}" placeholder="選択肢 ${String.fromCharCode(65+i)}"></div>`).join("")}
       <small>左の丸で正解を選ぶ</small><label class="ptsRow">配点 <input type="number" class="qPts" data-q="${qi}" min="0" max="1000" value="${q.pts||100}" style="width:72px"> 点</label> <button class="edBtn del" data-delq="${qi}">この問題を削除</button></div>`
    :`<div class="edQ"><small>範囲で答える問題</small><input type="text" class="qText" data-q="${qi}" value="${esc(q.q||"")}" placeholder="問題文（例：〜したのは誰？）">
       <small>想定した答え（◯）</small>${spanPicker(qi,"main",0,q)}
       <small>◯にする別解：${(q.alts||[]).length?"":"なし"}</small>${(q.alts||[]).map((v,k)=>spanPicker(qi,"alts",k,v)).join("")}
       <small>△にする答え：${(q.partials||[]).length?"":"なし（自動で判定）"}</small>${(q.partials||[]).map((v,k)=>spanPicker(qi,"partials",k,v)).join("")}
       <div class="edRow"><button class="edBtn" data-addalt="${qi}">＋ ◯別解</button><button class="edBtn" data-addpart="${qi}">＋ △の答え</button></div>
       <small>登録がない時は自動で判定：中心が合っていて説明が足りないだけ／同じ役割の分だけ長い → △、ほかの役割まで入る → ×</small>
       <label class="ptsRow">配点 <input type="number" class="qPts" data-q="${qi}" min="0" max="1000" value="${q.pts||100}" style="width:72px"> 点</label> <button class="edBtn del" data-delq="${qi}">この問題を削除</button></div>`).join("");
  $("edBody").innerHTML=`<h3>TITLE</h3><input type="text" id="edTitle" value="${esc(ED.title||"")}" placeholder="タイトル">
    <h3>ENGLISH TEXT</h3><textarea id="edText" placeholder="英文を貼り付け">${esc(ED.text||"")}</textarea>
    <h3>SETTINGS</h3>
    <div class="edRow edSet"><label>難易度 <select id="edLevel"><option value="0" ${!ED.level?"selected":""}>未設定（全レベル対象）</option>${LV.slice(1).map((_,i)=>`<option value="${i+1}" ${ED.level===i+1?"selected":""}>${esc(lvLabel(i+1))}</option>`).join("")}</select></label>
      <button class="edBtn" id="edEstLv">自動で見積もる</button></div>
    <div class="edRow edSet"><label>使い方 <select id="edMode"><option value="learn" ${ED.mode!=="test"?"selected":""}>学習用（すぐ答え合わせ）</option><option value="test" ${ED.mode==="test"?"selected":""}>テスト用（答えるだけ）</option></select></label></div>
    <div class="edRow edSet"><label>テスト用：ヒント <select id="edHint"><option value="none" ${(ED.hint||"none")==="none"?"selected":""}>なし（標準）</option><option value="sentence" ${ED.hint==="sentence"?"selected":""}>何文目にあるかだけ</option><option value="grammar" ${ED.hint==="grammar"?"selected":""}>区切りと色まで</option></select></label>
      <label>減点 <select id="edHintCost">${[0,5,10,20,30,50].map(n=>`<option ${n===(ED.hintCost==null?20:+ED.hintCost)?"selected":""}>${n}</option>`).join("")}</select>点／問</label></div>
    <small class="edStatus">ヒントと減点は、テスト用のときだけ使われます。問題ごとの配点は、各問題の下で決めます。</small>
    <div class="edRow edSet"><label>AIに作らせる問題：範囲 <select id="edRangeN">${[0,1,2,3,4,5,6,8,10].map(n=>`<option ${n===+settings.qRange?"selected":""}>${n}</option>`).join("")}</select>問</label>
      <label>5択 <select id="edChoiceN">${[0,1,2,3,4,5,6,8,10].map(n=>`<option ${n===+settings.qChoice?"selected":""}>${n}</option>`).join("")}</select>問</label>
      <label>言語 <select id="edQLang"><option value="ja" ${settings.qLang!=="en"?"selected":""}>日本語</option><option value="en" ${settings.qLang==="en"?"selected":""}>英語</option></select></label></div>
    <div class="edRow"><button class="edBtn" id="edAuto">お手軽自動で分ける</button><button class="edBtn" id="edAI">AIで分ける（役割・訳つき）</button></div>
    <details class="edCopy" ${ED.copyOpen?"open":""}><summary>自分のAIで分ける（コピペ方式・無料）</summary>
      <ol class="edSteps"><li>「指示文をコピー」を押す</li><li>Claude や ChatGPT に貼り付け、続けて英文も貼り付けて送る（上の欄に英文を入れておけば、指示文に最初から入る）</li><li>返ってきた返事を全部コピーして、下に貼り付けて「読み込む」</li></ol>
      <div class="edRow"><button class="edBtn" id="edCopyPrompt">① 指示文をコピー</button><button class="edBtn" id="edSelPrompt">全部選択</button></div>
      <small class="edSteps">コピーできない時は、下の指示文を長押し →「すべてを選択」→「コピー」。</small>
      <textarea id="edPrompt" aria-label="AI用の指示文">${esc(buildAIPrompt((ED.text||"").trim()))}</textarea>
      <textarea id="edPaste" placeholder="③ AIの返事をここに貼り付け"></textarea>
      <div class="edRow"><button class="edBtn pri" id="edLoadPaste">読み込む</button></div>
    </details>
    <div class="edStatus" id="edStatus">お手軽自動：すぐ分けられるが一部は手直しが必要。コピペ方式：自分のAIで正確に・訳つきで分けられる（無料版のAIでも可）。</div>
    ${ED.sents.length?`<h3>CHUNKS</h3><p class="edStatus">「｜」をタップで区切りの追加・削除。役割の札（S・V・O…）をタップで役割を変える。</p>${sentHTML}
    <h3>QUESTIONS</h3>${qHTML}<div class="edRow"><button class="edBtn" id="edAddRange">＋ 範囲で答える問題</button><button class="edBtn" id="edAddChoice">＋ 5択問題</button></div>`:""}
    <div class="edRow" style="margin-top:8px"><button class="edBtn pri" id="edSave">保存</button><button class="edBtn" id="edCancel">一覧へ戻る</button></div>`;
  $("edAuto").onclick=async()=>{edCollect();if(!ED.text.trim()){edStatus("英文を入れてください。");return}
    if(ED.sents.length&&!(await ask("今のチャンク分けを作り直しますか？","作り直す")))return;
    ED.sents=autoChunk(ED.text);if(!ED.level)ED.level=estimateLevel(ED.sents);ED.questions=ED.questions.filter(q=>q.type==="choice"||(ED.sents[q.si]&&q.b<ED.sents[q.si].words.length));renderEditor();edStatus("お手軽自動で分けました。区切りと役割を確認して、必要なら直してください。")};
  $("edBody").querySelector(".edCopy").ontoggle=e=>{ED.copyOpen=e.target.open};
  $("edEstLv").onclick=()=>{edCollect();const src=ED.sents.length?ED.sents:autoChunk(ED.text||"");const lv=estimateLevel(src);
    if(!lv){edStatus("英文を入れてから見積もってください。");return}ED.level=lv;renderEditor();edStatus(`難易度を ${lvLabel(lv)} と見積もりました（AIなしの目安）。違えば選び直してください。`)};
  [["edRangeN","qRange"],["edChoiceN","qChoice"],["edQLang","qLang"]].forEach(([id,k])=>$(id).onchange=e=>{settings[k]=id==="edQLang"?e.target.value:+e.target.value;saveSettings();syncPrompt(true)});
  // 範囲の選び方
  $("edBody").querySelectorAll(".spanPick").forEach(x=>{
    x.querySelector(".spS").onchange=e=>{edCollect();const q=ED.questions[+x.dataset.q],v={si:+e.target.value,a:0,b:0};
      if(x.dataset.kind==="main")Object.assign(q,v);else q[x.dataset.kind][+x.dataset.k]=v;renderEditor()};
    x.querySelector(".spChunk").onchange=e=>{if(!e.target.value)return;edCollect();const [si,a,b]=e.target.value.split(":").map(Number),q=ED.questions[+x.dataset.q];
      if(x.dataset.kind==="main")Object.assign(q,{si,a,b});else q[x.dataset.kind][+x.dataset.k]={si,a,b};renderEditor()};
    [".spA",".spB"].forEach(c=>x.querySelector(c).onchange=()=>{edCollect();renderEditor()});
    const d=x.querySelector(".spDel");if(d)d.onclick=()=>{edCollect();ED.questions[+x.dataset.q][x.dataset.kind].splice(+x.dataset.k,1);renderEditor()};
  });
  $("edBody").querySelectorAll("[data-addalt],[data-addpart]").forEach(b=>b.onclick=()=>{edCollect();const q=ED.questions[+(b.dataset.addalt||b.dataset.addpart)],k=b.dataset.addalt!=null?"alts":"partials";
    (q[k]=q[k]||[]).push({si:q.si,a:-1,b:-1});renderEditor()});
  const selPrompt=()=>{syncPrompt(true);const ta=$("edPrompt");ta.focus();ta.select();try{ta.setSelectionRange(0,ta.value.length)}catch(e){}};
  // 英文が変わったら指示文を作り直す（入力・貼り付け・変換確定など、どの方法でも拾えるよう複数の合図＋定期確認）
  ["input","change","keyup","paste","compositionend","blur"].forEach(ev=>$("edText").addEventListener(ev,()=>setTimeout(()=>syncPrompt(),0)));
  $("edPrompt").addEventListener("focus",()=>syncPrompt());
  $("edBody").querySelector(".edCopy").addEventListener("toggle",()=>syncPrompt(true));
  clearInterval(window.__promptTimer);window.__promptTimer=setInterval(()=>{if($("edView").hidden||!$("edText")){clearInterval(window.__promptTimer);return}syncPrompt()},600);
  syncPrompt(true);
  $("edSelPrompt").onclick=selPrompt;
  $("edCopyPrompt").onclick=async()=>{edCollect();syncPrompt(true);
    const pr=$("edPrompt").value;
    let ok=false;try{await navigator.clipboard.writeText(pr);ok=true}catch(e){}
    selPrompt();if(!ok){try{ok=document.execCommand("copy")}catch(e){}}
    edStatus(ok?"コピーしました。AIに貼り付けて送ってください。（貼り付けられなかったら、選択された指示文をそのままコピーしてください）"
             :"この画面では自動でコピーできませんでした。指示文を選択したので、そのまま「コピー」してください。")};
  $("edLoadPaste").onclick=async()=>{const t=$("edPaste").value.trim();if(!t){edStatus("AIの返事を貼り付けてください。");return}
    let sents,qs,out;try{out=parsePastedAI(t);sents=aiResultToSents(out);qs=aiResultToQuestions(out,sents)}
    catch(e){edStatus(`読み込めませんでした：${esc(e.message||"")}`);tell("読み込めませんでした。\n"+(e.message||"")+"\n\nAIの返事を最初から最後まで全部貼り付けたか確認してください。");return}
    if(!sents.length){edStatus("文が見つかりませんでした（sentences が空です）。");tell("データは読めましたが、文（sentences）が入っていませんでした。");return}
    if((ED.sents.length||ED.questions.length)&&!(await ask("今のチャンク分けと問題を置き換えますか？","置き換える")))return;
    edCollect();ED.sents=sents;ED.questions=qs.length?qs:[];ED.copyOpen=false;
    const aiTitle=String(out.title||"").trim();
    if(aiTitle&&!String(ED.title||"").trim())ED.title=aiTitle;   // 自分で入れたタイトルは上書きしない
    const aiLv=parseInt(out.level,10)||0;
    if(!ED.level)ED.level=aiLv>=1&&aiLv<=10?aiLv:estimateLevel(sents);
    if(!ED.text.trim())ED.text=sents.map(x=>x.words.join(" ")).join(" ");   // 英文を向こうに直接貼った場合は、結果から英文欄を埋める
    renderEditor();
    edStatus(`読み込みました（${sents.length}文・役割と訳つき${qs.length?`・問題${qs.length}問`:""}）。気になる所は直してから保存してください。`)};
  $("edAI").onclick=async()=>{edCollect();if(!ED.text.trim()){edStatus("英文を入れてください。");return}
    if(ED.sents.length&&!(await ask("今のチャンク分けを作り直しますか？","作り直す")))return;aiChunk(ED.text)};
  $("edBody").querySelectorAll(".edGap").forEach(b=>b.onclick=()=>{edCollect();const s=ED.sents[+b.dataset.si],g=+b.dataset.g;s.roleAt=s.roleAt||{};s.ujp=s.ujp||{};
    const en=unitEnds(s);
    if(en.includes(g)){s.ends=en.filter(x=>x!==g);delete s.roleAt[g+1];delete s.ujp[g+1]}
    else{const st=unitStarts(s).filter(x=>x<=g).pop();s.ends=[...en,g].sort((a,b)=>a-b);s.roleAt[g+1]=s.roleAt[st]||"M"}
    renderEditor()});
  $("edBody").querySelectorAll(".roleChip").forEach(b=>b.onclick=()=>{edCollect();const s=ED.sents[+b.dataset.si],u=+b.dataset.u;s.roleAt=s.roleAt||{};
    s.roleAt[u]=ROLES[(ROLES.indexOf(s.roleAt[u]||"M")+1)%ROLES.length];renderEditor()});
  if($("edAddRange"))$("edAddRange").onclick=()=>{edCollect();ED.questions.push({type:"range",q:"",si:0,a:0,b:0,alts:[],partials:[]});renderEditor()};
  if($("edAddChoice"))$("edAddChoice").onclick=()=>{edCollect();ED.questions.push({type:"choice",q:"",options:["","","","",""],correct:0});renderEditor()};
  $("edBody").querySelectorAll("[data-delq]").forEach(b=>b.onclick=()=>{edCollect();ED.questions.splice(+b.dataset.delq,1);renderEditor()});
  $("edSave").onclick=()=>{edCollect();const list=loadMy(),i=list.findIndex(t=>t.id===ED.id);
    ED.questions=ED.questions.map(cleanQ);
    const data=JSON.parse(JSON.stringify(ED));if(i>=0)list[i]=data;else list.unshift(data);
    const ok=saveMy(list);
    edStatus(ok?"保存しました。":"保存できませんでした（ブラウザの保存が使えない環境です）。");$("edHead").textContent=`編集：${ED.title||"無題"}`;
    if(ok){toast("✓ 保存しました");const b=$("edSave");b.textContent="✓ 保存しました";b.classList.add("saved");
      setTimeout(()=>{if($("edSave")===b){b.textContent="保存";b.classList.remove("saved")}},1800)}
    else tell("保存できませんでした。この画面ではブラウザへの保存が使えないようです。")};
  $("edCancel").onclick=()=>{ED=null;renderMyList()};
}

/* 開くたびに動かすこと（画面のボタンをつなぐ など）。game.js が呼ぶ */
export function init_texts(){
  $("edBack").onclick=()=>{if(ED){ED=null;renderMyList()}else showTitle()};
}
