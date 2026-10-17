/* チャンクチャンク：ゲームの本体（区切る・判定・振り返り・設定・タイトル・ランダム） */
const PER_STAGE=6;
/* 速さ10段階（1語が進む間隔ms）。4＝前の「ふつう」、10＝その約10倍速 */
const SPEED={1:1600,2:1300,3:1100,4:820,5:600,6:450,7:330,8:230,9:150,10:82};
const SPEED_NAME={1:"のんびり",2:"ゆっくり",3:"やや遅い",4:"ふつう",5:"やや速い",6:"速い",7:"とても速い",8:"激速",9:"超速",10:"鬼"};
const FONT={xl:28,l:23,m:20,s:17,xs:14};
const FONT_NAME={xl:"特大",l:"大",m:"中",s:"小",xs:"極小（先まで見える）"};
const PTS={excellent:100,great:80,good:40,mini:30,miss:0,forgot:0},BONUS=50,PERFECT_BONUS=100;
const RANK={excellent:["Excellent!","◎"],great:["Great!","◯"],good:["Good","△"],mini:["","・"],miss:["Miss…","×"],forgot:["区切り忘れ！","×"]};
/* 役割の名前 [かんたん, 文法] */
const RN={S:["誰が・何が","主語"],V:["する","動詞"],O:["何を・誰を","目的語"],I:["誰に","間接目的語"],C:["どうだ","補語"],P:["どこで","場所"],T:["いつ","時"],M:["どうやって","様子・手段"],R:["なぜ","理由"],F:["もし","条件"],X:["説明","修飾語句"]};
const RS={S:["誰が","主語"],V:["する","動詞"],O:["何を","目的語"],I:["誰に","間接目的語"],C:["どうだ","補語"],P:["どこで","場所"],T:["いつ","時"],M:["どうやって","様子"],R:["なぜ","理由"],F:["もし","条件"]};
const PH={S:"名詞句",O:"名詞句",I:"名詞句",C:"補語",P:"副詞句",T:"副詞句",M:"副詞句",R:"副詞節",F:"副詞節"};
const DET=new Set("a an the my your his her its our their this that these those some".split(" "));
const PRON=new Set("i you he she it we they me him her us them".split(" "));
const ADV="PTMRF";

const $=id=>document.getElementById(id);
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait=ms=>new Promise(r=>setTimeout(r,ms));   // ゲームの時間は、動きを減らす設定でも縮めない
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const bare=w=>w.toLowerCase().replace(/[^a-z']/g,"");

let settings={lvSys:"grade",myLevel:0,lvAuto:true,lvSort:"rec",lvFilter:"all",qRange:3,qChoice:3,qLang:"ja",advance:"auto",speed:4,font:"m",rdLines:1,tts:true,sound:"both",disp:"easy",mode:"one"};
try{Object.assign(settings,JSON.parse(localStorage.getItem("ccs3-settings")||"{}"))}catch(e){}
settings.speed={slow:3,normal:4,fast:5}[settings.speed]||+settings.speed||4;if(!FONT[settings.font])settings.font="m";
function applyVisual(){
  const r=document.documentElement.style,ms=SPEED[settings.speed];
  r.setProperty("--laneFont",FONT[settings.font]+"px");
  r.setProperty("--stepDur",Math.min(170,Math.round(ms*.7))+"ms");
}
applyVisual();
function saveSettings(){try{localStorage.setItem("ccs3-settings",JSON.stringify(settings))}catch(e){}}

/* 読み上げ */
const canSpeak="speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;
let voices=[];function loadVoices(){try{voices=speechSynthesis.getVoices()||[]}catch(e){}}
if(canSpeak){loadVoices();try{speechSynthesis.onvoiceschanged=loadVoices}catch(e){}}
function enVoice(){const vs=voices.filter(v=>(v.lang||"").toLowerCase().startsWith("en-us"));return vs.find(v=>/Samantha|Ava|Allison|Google US/.test(v.name))||vs[0]}
function speakChunks(chunks){
  if(!canSpeak||!settings.tts)return;
  try{speechSynthesis.cancel();const v=enVoice();chunks.forEach(t=>{const u=new SpeechSynthesisUtterance(t);u.lang="en-US";if(v)u.voice=v;u.rate=.9;speechSynthesis.speak(u)})}catch(e){}
}
/* 区切った時の音：both＝小さい効果音＋チャンクの読み上げ／voice＝読み上げだけ／sfx＝効果音だけ（テンポ重視）／off */
let actx=null;
function unlockAudio(){try{if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();if(actx.state==="suspended")actx.resume()}catch(e){}}
function tone(freq,dur,type,vol,slide){
  if(!actx)return;
  try{const t=actx.currentTime,o=actx.createOscillator(),g=actx.createGain();o.type=type||"sine";o.frequency.setValueAtTime(freq,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(freq*slide,t+dur);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g).connect(actx.destination);o.start(t);o.stop(t+dur+.03)}catch(e){}
}
function hitSound(kind){
  const m=settings.sound;if(m==="off")return;
  const miss=kind==="miss"||kind==="forgot";
  if(m==="voice"&&!miss)return;
  const v=m==="both"?.55:1;
  if(kind==="excellent"){tone(880,.07,"sine",.14*v);setTimeout(()=>tone(1320,.09,"sine",.12*v),55)}
  else if(kind==="great")tone(988,.09,"sine",.13*v);
  else if(kind==="good")tone(660,.09,"triangle",.11*v);
  else if(kind==="mini")tone(1250,.04,"triangle",.07*v);
  else tone(160,.18,"sawtooth",.06,.7);
}
function speakChunk(text){
  if(!canSpeak||settings.sound==="sfx"||settings.sound==="off")return;
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";const v=enVoice();if(v)u.voice=v;u.rate=1.2;speechSynthesis.speak(u)}catch(e){}
}
function tick(){if(settings.sound==="sfx")tone(1900,.025,"square",.012)}
function primeSpeech(){if(!canSpeak)return;try{const u=new SpeechSynthesisUtterance(" ");u.volume=0;speechSynthesis.speak(u)}catch(e){}}

/* ===== 文を読み込む ===== */
function parseSentence(str,ja){
  const units=[],words=[],unitOf=[];let who=null;
  if(str[0]==="@"){who=str[1];str=str.slice(3)}   // 「@b 」男の子／「@g 」女の子／「@o 」その他 で主語のキャラを指定できる
  str.split(" | ").forEach(us=>{
    const role=us[0];let rest=us.slice(2),note=null;
    const hi=rest.indexOf("#");if(hi>=0){note=rest.slice(hi+1).split("|");rest=rest.slice(0,hi)}
    const ei=rest.indexOf("=");const en=rest.slice(0,ei);let jp=rest.slice(ei+1),subJp=null;
    const m=jp.match(/^(.*)\{(.*)\}$/);if(m){jp=m[1];subJp=m[2].split("/")}
    const u={role,jp,note,s:words.length,subs:null};
    const parts=en.split(" / ");if(parts.length>1)u.subs=[];
    parts.forEach((p,pi)=>{const s=words.length;p.split(" ").forEach(w=>{words.push(w);unitOf.push(units.length)});if(u.subs)u.subs.push({s,e:words.length-1,jp:subJp?subJp[pi]||"":""})});
    u.e=words.length-1;u.text=words.slice(u.s,u.e+1).join(" ");units.push(u);
  });
  const sen={units,words,unitOf,ja,en:words.join(" ")};sen.who=who||guessWho(sen);return sen;
}
function wordRole(sen,i){const u=sen.units[sen.unitOf[i]];if(u.subs&&u.role!=="V"){const pi=u.subs.findIndex(p=>i>=p.s&&i<=p.e);if(pi>0)return "X"}return u.role}
function isMini(role,ws){
  if(ws.length===1)return true;
  return ws.length===2&&"SOIC".includes(role)&&DET.has(bare(ws[0]));
}
/* 小さいまとまり（1語・冠詞＋名詞）：かんたん表示は役割の言葉、文法表示は品詞の名前 */
function miniLabel(role,ws){
  const easy=RN[role][0];
  if(role==="V")return [easy,"動詞！"];
  if("SOI".includes(role))return ws.length===1&&PRON.has(bare(ws[0]))?[easy,"代名詞！"]:[easy,"名詞！"];
  if(role==="C")return [easy,"補語！"];
  return [easy,"副詞！"];
}
/* 区切ったまとまり（a〜b番目の単語）を判定する */
function classify(sen,a,b){
  const U=sen.units,ua=sen.unitOf[a],ub=sen.unitOf[b],ws=sen.words.slice(a,b+1);
  const roles=ws.map((_,i)=>wordRole(sen,a+i));
  const miss={kind:"miss",easy:"",gram:"",jp:"",roles:null};
  if(ua===ub){
    const u=U[ua];
    if(a===u.s&&b===u.e){
      const note=u.note;
      if(isMini(u.role,ws)){const [e,g]=miniLabel(u.role,ws);return {kind:"mini",easy:e,gram:g,note,jp:u.jp,roles}}
      let easy=RN[u.role][0],gram=u.role==="V"?"動詞のまとまり":`${RN[u.role][1]}・${PH[u.role]}`;
      if(u.subs){if(u.role==="V"){easy+="（熟語＋動詞）";gram+="（熟語＋動詞）"}else{easy+="（ひと・もの＋説明）";gram+="（名詞＋修飾語句）"}}
      return {kind:"excellent",easy,gram,note,jp:u.jp,roles};
    }
    if(u.subs&&u.role==="V"){const pi=u.subs.findIndex(p=>p.s===a&&p.e===b);   // 熟語＋動詞（managed to / finish）：熟語だけ・動詞だけで区切っても正解
      if(pi===0)return {kind:"excellent",easy:"熟語",gram:"熟語のまとまり",jp:u.subs[0].jp,roles};
      if(pi>0)return {kind:ws.length===1?"mini":"excellent",easy:"する",gram:ws.length===1?"動詞！":"動詞",jp:u.subs[pi].jp,roles}}
    if(u.subs){const pi=u.subs.findIndex(p=>p.s===a&&p.e===b);
      if(pi===0){if(isMini(u.role,ws))return {kind:"mini",easy:"ひと・もの（中心）",gram:"名詞！",jp:u.subs[0].jp,roles:roles.map(()=>u.role)};
        return {kind:"excellent",easy:"ひと・もの（中心）",gram:"名詞句（中心の名詞）",jp:u.subs[0].jp,roles}}
      if(pi>0)return {kind:"excellent",easy:"どんな（説明）",gram:"修飾語句（後ろから説明）",jp:u.subs[pi].jp,roles}}
    return miss;
  }
  if(a!==U[ua].s||b!==U[ub].e)return miss;
  const list=U.slice(ua,ub+1);
  for(let i=1;i<list.length;i++)if(list[i].role==="S"&&list[i-1].role!=="V")return miss;
  const compE=list.map(u=>RS[u.role][0]).join("＋"),compG=list.map(u=>RS[u.role][1]).join("＋");
  const jp=(list[0].role==="S"?[list[0],...list.slice(1).reverse()]:[...list].reverse()).map(u=>u.jp).join("");
  const vNote=list.find(u=>u.role==="V"&&u.note);
  const base={roles,jp,note:vNote?vNote.note:null};
  if(list[0].role==="S")return {...base,kind:"good",easy:"SVチャンク："+compE,gram:"SVチャンク："+compG};
  if(list[0].role==="V")return {...base,kind:"great",easy:"すること："+compE,gram:"動詞句："+compG};
  if(list.every(u=>ADV.includes(u.role)))return {...base,kind:"great",easy:"いつ・どこ・どう："+compE,gram:"副詞句："+compG};
  return {...base,kind:"great",easy:"まとまり："+compE,gram:"語句のまとまり："+compG};
}
function labelText(c){
  if(settings.disp==="none")return "";
  return settings.disp==="gram"?c.gram:settings.disp==="both"&&c.gram!==c.easy?`${c.easy}／${c.gram}`:c.easy;
}
function noteText(c){
  if(!c.note||settings.disp==="none")return "";
  const [e,g]=c.note;return settings.disp==="gram"?g:settings.disp==="both"?`${e}／${g}`:e;
}

/* ===== 文の絵（ステージ） =====
 絵はここだけで決めている。あとで画像にする時は "img/boy_face.png" のようにファイル名を書けば <img> で出る */
const ART={
  face:{b:"👦",g:"👧",o:"🟧"}, act:{b:"🙋‍♂️",g:"🙋‍♀️",o:"🟧"}, state:{b:"🧍",g:"🧍‍♀️",o:"🟧"},
  q:"❓", sun:"☀️", moon:"🌙", place:{out:"🌳",home:"🏠",school:"🏫",town:"🏙️"}
};
const artHTML=v=>/\.(png|jpe?g|gif|svg|webp)$/i.test(v)?`<img src="${esc(v)}" alt="">`:esc(v);
const BOYW=new Set("he him his boy boys brother father dad uncle grandfather man ken tom leo i".split(" "));
const GIRLW=new Set("she her girl sister mother mom aunt grandmother woman emma yuki".split(" "));
function guessWho(sen){
  const u=sen.units.find(u=>u.role==="S");if(!u)return "o";
  const ws=sen.words.slice(u.s,u.e+1).map(bare);
  const b=ws.some(w=>BOYW.has(w)),g=ws.some(w=>GIRLW.has(w));
  return b&&!g?"b":g&&!b?"g":"o";
}
const STATEV=new Set("is am are was were be like likes liked love loves know knows knew want wants wanted have has had belong belongs seem seems tasted tastes need needs".split(" "));
function verbKind(sen,u){
  const ws=sen.words.slice(u.s,u.e+1).map(bare);
  if(ws.some(w=>w.endsWith("ing"))||ws.includes("to"))return "act";
  return ws.some(w=>STATEV.has(w))?"state":"act";
}
const PLACEW={out:"park garden river beach field zoo corner gate countryside",home:"kitchen room home house car sofa",school:"school classroom library museum class",town:"station town shop mall city hospital way there front"};
function placeKind(sen,u){
  const ws=sen.words.slice(u.s,u.e+1).map(bare);
  for(const k in PLACEW)if(PLACEW[k].split(" ").some(w=>ws.includes(w)))return k;
  return "town";
}
let SG={k:-1};
function stageReset(k){
  SG={k,face:false,body:null,cap:[]};
  const st=$("stage");st.className="stage";
  ["sgPlace","sgSign","sgTime","sgArt","sgCap","sgObj","sgFace"].forEach(id=>$(id).innerHTML="");
  $("sgArt").className="sgArt";$("sgHint").hidden=false;
}
function popIn(el,big){el.animate(reduce?[{opacity:0},{opacity:1}]:[{transform:`scale(${big?.3:.6})`,opacity:0},{transform:"scale(1.12)",opacity:1,offset:.6},{transform:"scale(1)",opacity:1}],{duration:380,easing:"ease-out"})}
/* 何を・いつ・どこで などは、まず真ん中に大きく出してから定位置へ */
function fly(text,cls){
  const el=document.createElement("div");el.className="sgFly "+cls;el.textContent=text;$("stage").append(el);
  el.animate(reduce?[{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.7},{opacity:0}]:[{transform:"translate(-50%,-50%) scale(.4)",opacity:0},{transform:"translate(-50%,-50%) scale(1.15)",opacity:1,offset:.2},{transform:"translate(-50%,-50%) scale(1)",opacity:1,offset:.65},{transform:"translate(-50%,-90%) scale(.8)",opacity:0}],{duration:900,easing:"ease-out"}).onfinish=()=>el.remove();
}
function stageOnChunk(k,sen,c){
  if(SG.k!==k)stageReset(k);
  if(c.kind==="miss"||c.kind==="forgot"){
    const q=$("sgQ");q.innerHTML=artHTML(ART.q);
    q.animate(reduce?[{opacity:1},{opacity:1},{opacity:0}]:[{opacity:0,transform:"translateY(6px) scale(.6)"},{opacity:1,transform:"none",offset:.15},{opacity:1,offset:.75},{opacity:0}],{duration:1300});
    return;
  }
  $("sgHint").hidden=true;
  const units=sen.units.filter(u=>u.s>=c.a&&u.e<=c.b);
  if(!units.length){const u=sen.units[sen.unitOf[c.a]];if(u.role==="S"&&u.subs&&c.a===u.subs[0].s)units.push({...u,partial:true})}
  const who=sen.who;
  units.forEach(u=>{
    const r=u.role;
    if(r==="S"){SG.face=true;SG.cap[0]=u.partial?u.subs[0].jp:u.jp;drawChar(!SG.body)}
    else if(r==="V"){SG.body=verbKind(sen,u);SG.cap[1]=u.jp;drawChar(true)}
    else if(r==="P"){const pk=placeKind(sen,u);$("stage").className="stage bg-"+pk;$("sgPlace").innerHTML=artHTML(ART.place[pk]);$("sgSign").textContent="📍"+u.jp;fly("📍"+u.jp,"rP");popIn($("sgPlace"),true);popIn($("sgSign"))}
    else if(r==="T"){const night=sen.words.slice(u.s,u.e+1).map(bare).some(w=>/night|evening|dinner/.test(w));
      $("sgTime").innerHTML=`<span class="ic">${artHTML(night?ART.moon:ART.sun)}</span>${esc(u.jp)}`;fly((night?"🌙":"☀️")+u.jp,"rT");popIn($("sgTime"))}
    else{const sp=document.createElement("span");sp.className="r"+r;sp.textContent=`${RN[r][0]}：${u.jp||u.text}`;$("sgObj").append(sp);fly(sp.textContent,"r"+r);popIn(sp)}
  });
}
function drawChar(anim){
  const who=S.sens[S.seq[SG.k]].who,a=$("sgArt");
  if(SG.body){a.innerHTML=artHTML(ART[SG.body][who]);a.className="sgArt body";$("sgFace").innerHTML=SG.face?artHTML(ART.face[who]):""}
  else if(SG.face){a.innerHTML=artHTML(ART.face[who]);a.className="sgArt"}
  $("sgCap").textContent=SG.cap.filter(Boolean).join(" ");
  if(anim)popIn(a,true);
}
function stageDone(){const d=$("sgDone");d.animate(reduce?[{opacity:0},{opacity:1},{opacity:1},{opacity:0}]:[{opacity:0,transform:"translate(-50%,-50%) scale(.5)"},{opacity:1,transform:"translate(-50%,-50%) scale(1.15)",offset:.2},{opacity:1,transform:"translate(-50%,-50%) scale(1)",offset:.8},{opacity:0}],{duration:1400})}

/* 確認・お知らせの小窓（claude.ai の画面ではブラウザ標準の confirm/alert が出ないので、ページ内に出す） */
function ask(msg,yes="OK",no="やめる"){
  return new Promise(res=>{const box=$("askBox");$("askMsg").textContent=msg;$("askYes").textContent=yes;
    $("askNo").textContent=no||"";$("askNo").hidden=!no;box.hidden=false;
    const done=v=>{box.hidden=true;$("askYes").onclick=$("askNo").onclick=null;res(v)};
    $("askYes").onclick=()=>done(true);$("askNo").onclick=()=>done(false);});
}
const tell=msg=>ask(msg,"OK",null);
function toast(msg){const el=document.createElement("div");el.className="toast";el.textContent=msg;document.body.append(el);
  el.animate([{opacity:0,transform:"translate(-50%,-10px)"},{opacity:1,transform:"translate(-50%,0)",offset:.12},{opacity:1,offset:.8},{opacity:0}],{duration:2000,easing:"ease-out"}).onfinish=()=>el.remove()}

/* ===== 難易度（10段階）。表示は 学年／英検／TOEIC／CEFR から選ぶ。未設定＝全レベル対象 =====
 対応は目安：英検 1級C1・準1級B2・2級B1・準2級A2・3級A1、TOEIC L&R A1 120〜・A2 225〜・B1 500〜・B2 785〜・C1 945〜 */
const LV=[null,
 {g:"入門（小学校低〜中学年）",e:"入門",t:"",c:"Pre-A1"},
 {g:"小学校高学年",e:"5級の手前",t:"",c:"Pre-A1"},
 {g:"中1",e:"5級",t:"",c:"Pre-A1"},
 {g:"中2",e:"4級",t:"",c:"A1"},
 {g:"中3",e:"3級",t:"120〜220",c:"A1"},
 {g:"高1〜2",e:"準2級",t:"225〜495",c:"A2"},
 {g:"高3・共通テスト",e:"2級",t:"500〜780",c:"B1"},
 {g:"難関大",e:"準1級",t:"785〜940",c:"B2"},
 {g:"大学・上級",e:"1級",t:"945〜",c:"C1"},
 {g:"それ以上（ネイティブ並み）",e:"1級以上",t:"満点域",c:"C2"}];
const LVSYS={grade:"学年",eiken:"英検",toeic:"TOEIC",cefr:"CEFR"};
function lvLabel(n,sys){
  if(!n)return "未設定（全レベル）";const L=LV[n];sys=sys||settings.lvSys||"grade";
  const v=sys==="eiken"?`英検${L.e}`:sys==="toeic"?(L.t?`TOEIC ${L.t}`:`TOEIC対象外（${L.g}）`):sys==="cefr"?`CEFR ${L.c}`:L.g;
  return `Lv${n} ${v}`;
}
const LVGROUP={all:["すべて",1,10],rec:["おすすめだけ",0,0],ele:["小学生",1,2],jh:["中学",3,5],hs:["高校",6,7],univ:["大学以上",8,10]};
function isRec(lv){const m=+settings.myLevel||0;return !lv||!m||Math.abs(lv-m)<=1}
function baseForm(w){w=w.toLowerCase().replace(/[^a-z']/g,"").replace(/'s$/,"");
  if(COMMON.has(w))return w;
  for(const [a,b] of [["ies","y"],["ied","y"],["es",""],["s",""],["ed",""],["ed","e"],["ing",""],["ing","e"],["er",""],["est",""],["ly",""]])
    if(w.endsWith(a)&&COMMON.has(w.slice(0,-a.length)+b))return w.slice(0,-a.length)+b;
  return w;
}
function estimateLevel(sents){
  const all=sents.flatMap(s=>s.words);if(!all.length)return null;
  const avg=all.length/sents.length;
  const cont=all.filter(w=>/^[a-z]/.test(w)&&/[a-z]/.test(w));   // 大文字で始まる語（名前・文頭）は数えない
  const rare=cont.filter(w=>{const b=baseForm(w);return b.length>2&&!COMMON.has(b)}).length/Math.max(1,cont.length);
  const sc=0.8+Math.max(0,avg-3)*0.32+rare*10;
  return Math.max(1,Math.min(10,Math.round(sc)));
}
/* 答え合わせの結果で、おすすめのレベルを自動で上下させる（2回続けて9割以上→上、5割未満→下） */
function adaptLevel(ratio,lv){
  if(settings.lvAuto===false||!settings.myLevel)return "";
  const m=+settings.myLevel;settings.lvUp=settings.lvUp||0;settings.lvDown=settings.lvDown||0;
  if(ratio>=.9&&(!lv||lv>=m)){settings.lvUp++;settings.lvDown=0}else if(ratio<.5){settings.lvDown++;settings.lvUp=0}else{settings.lvUp=0;settings.lvDown=0}
  let msg="";
  if(settings.lvUp>=2&&m<10){settings.myLevel=m+1;settings.lvUp=0;msg=`レベルアップ！おすすめを ${lvLabel(m+1)} にしました`}
  if(settings.lvDown>=2&&m>1){settings.myLevel=m-1;settings.lvDown=0;msg=`おすすめを ${lvLabel(m-1)} にしました`}
  saveSettings();return msg;
}

/* ===== 状態 ===== */
let S=null,total=0,runId=0;
const stageN={one:0,cont:0};
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/* ===== ランダム：レベルで絞って、最近出た文はなるべく避ける =====
 内蔵の文はランクがないので、分類で決める（すべて中学レベル） */
const TIER_LV={"基本の順番":3,"動詞のまとまり":4,"熟語のまとまり":4,"長い主語・節":5};
const RECENTKEY="ccs-recent",RECENT_MAX=80;
function loadRecent(){try{return JSON.parse(localStorage.getItem(RECENTKEY)||"[]")}catch(e){return []}}
function addRecent(keys){try{const r=loadRecent().filter(k=>!keys.includes(k)).concat(keys).slice(-RECENT_MAX);localStorage.setItem(RECENTKEY,JSON.stringify(r))}catch(e){}}
/* いま出す文のレベル：{target, near}。target なし＝全部 */
function randTarget(){
  const p=settings.randLv||"auto";
  if(p==="all")return {target:0};
  if(p==="auto")return +settings.myLevel?{target:+settings.myLevel,near:true}:{target:0};
  return {target:+p};
}
function randLabel(){
  const {target,near}=randTarget();
  if(!target)return "すべてのレベル";
  return near?`${lvLabel(target)} の前後`:lvLabel(target);
}
/* レベルで絞る。ぴったりが無ければ前後1つ、それも無ければ全部 */
function byLevel(items,lvOf){
  const {target,near}=randTarget();if(!target)return items;
  const within=d=>items.filter(it=>{const l=lvOf(it);return !l||Math.abs(l-target)<=d});
  const a=within(near?1:0);if(a.some(it=>lvOf(it)))return a;
  const b=within(1);if(b.some(it=>lvOf(it)))return b;
  return items;
}
function randomPool(){
  const seen=new Set(),out=[];
  const push=(s,ja,lv)=>{if(!seen.has(s)){seen.add(s);out.push({s,ja,lv})}};
  ONE_TIERS.forEach(t=>t.list.forEach(([s,ja])=>push(s,ja,TIER_LV[t.name]||null)));
  shortsAll().forEach(x=>push(x.s,x.ja,x.lv));
  return out;
}
function pickRandom(n){
  const pool=byLevel(randomPool(),x=>x.lv),recent=new Set(loadRecent());
  const fresh=shuffle(pool.filter(x=>!recent.has(x.s))),old=shuffle(pool.filter(x=>recent.has(x.s)));
  const pick=fresh.concat(old).slice(0,n);addRecent(pick.map(x=>x.s));
  return pick.map(x=>[x.s,x.ja]);
}
function buildStage(mode,n,same){
  if(mode==="one"){
    const pick=same?shuffle(same):pickRandom(PER_STAGE);
    return {mode,n,title:`ランダム${n+1}（${randLabel()}）`,short:`ランダム${n+1}`,list:pick};
  }
  let st;
  if(same)st=STORIES.find(s=>s.list===same);
  else{const pool=byLevel(STORIES,s=>LVO[s.id]??s.level),cand=pool.filter(s=>s.id!==settings.lastStory);
    st=(cand.length?cand:pool)[Math.floor(Math.random()*(cand.length?cand:pool).length)];settings.lastStory=st.id;saveSettings()}
  return {mode,n,title:`お話「${st.title}」`,short:`お話${n+1}`,list:st.list};
}
function loadStage(mode,n,same,autoStart){
  const info=buildStage(mode,n,same);
  S={...info,sens:info.list.map(([en,ja])=>parseSentence(en,ja)),si:0,results:[],phase:"ready",gained:0,paused:false,timer:null,elapsed:0,sentStart:0};
  $("stageText").textContent=info.short;$("hist").innerHTML="";$("line").innerHTML="";
  setupSeq();updateProg();renderPreview();renderLane(true);applyAdvanceUI();
  if(autoStart)countdown(++runId);else showStart(++runId);
}
/* レーンに流す文の並び（一文モード＝1文、連続モード＝お話全部） */
function setupSeq(){
  const seq=S.mode==="one"?[S.si]:S.sens.map((_,i)=>i);
  S.seq=seq;S.flat=[];S.starts=[];
  seq.forEach((si,k)=>{S.starts.push(S.flat.length);S.sens[si].words.forEach((t,li)=>S.flat.push({t,k,li,si}))});
  S.passed=0;S.cuts=new Map();S.lastCut=-1;S.finishing=false;S.queuedCut=false;S.lastStepAt=0;S.nextStepAt=0;S.chunks=seq.map(()=>[]);S.closed=seq.map(()=>false);S.openK=0;
  stageReset(0);
}
const endOf=k=>k+1<S.starts.length?S.starts[k+1]-1:S.flat.length-1;
function updateProg(){
  const n=S.sens.length,i=S.mode==="one"?S.si:S.openK;
  $("progText").textContent=S.timed?`${i+1}文目`:`${Math.min(i+1,n)}/${n}`;
}
function addScore(n){S.gained+=n;total+=n;$("score").textContent=total}
function renderPreview(){
  const pv=$("preview");
  const nx=S.mode==="one"&&S.phase!=="ready"?S.sens[S.si+1]:null;
  pv.innerHTML=nx?`<div class="pvStrip" style="left:${lineX()+2}px">${nx.words.map(w=>`<span class="w">${esc(w)}</span>`).join("")}</div>`:"";
}

function showStart(run){
  $("startTitle").textContent=S.mode==="one"?`${S.title}（${S.sens.length}文）`:S.title;
  $("startNote").innerHTML=S.mode==="one"
    ?"英文が右から1語ずつ流れてくる。<br>意味のまとまりだと思ったら「チャンク！」。<br>文の終わり（■の手前）もチャンク！"
    :`${S.sens.length}文のお話が止まらずに流れてくる。<br>文の終わり（■の手前）も必ず区切る。`;
  $("startNote").innerHTML+=`<br><small>${manual()?"自分で送る（▶で進む）":`速さ ${settings.speed}「${SPEED_NAME[settings.speed]}」`}・文字 ${FONT_NAME[settings.font]}（右上の設定で変更）</small>`;
  $("startBox").hidden=false;
  $("startBtn").onclick=()=>{$("startBox").hidden=true;primeSpeech();unlockAudio();countdown(run)};
}
async function runCount(run,seq,quick){
  const c=$("count");c.classList.toggle("quick",!!quick);c.hidden=false;
  for(const [t,cls,ms] of seq){
    if(run!==runId){c.hidden=true;return false}
    c.innerHTML=`<span class="${cls}" style="animation-duration:${ms}ms">${t}</span>`;await wait(ms);
  }
  c.hidden=true;return run===runId;
}
async function countdown(run){
  if(!await runCount(run,[["Ready...","small",1200],["3","",850],["2","",850],["1","",850],["GO!","go",650]]))return;
  S.phase="play";renderPreview();step();
}

/* ===== レーン ===== */
const KEEP_LEFT=2;
function lineX(){return Math.round($("laneWrap").clientWidth*0.34)}
function chunkAt(g){const f=S.flat[g];if(!f)return null;return S.chunks[f.k].find(c=>f.li>=c.a&&f.li<=c.b)||null}
function renderLane(noAnim){
  const st=$("strip");if(!S.flat.length){st.innerHTML="";return}
  st.innerHTML=S.flat.map((f,i)=>{
    const ch=chunkAt(i);
    let cls=i<S.passed-KEEP_LEFT?" gone":i<S.passed?" past":i===S.passed?" next":"";
    if(ch&&ch.roles&&i<S.passed)cls+=" r"+ch.roles[f.li-ch.a]+" done";
    if(S.mode==="cont"&&f.li===S.sens[f.si].words.length-1&&i<S.flat.length-1)cls+=" eos";
    const cm=S.cuts.get(i);
    const endMk=f.li===S.sens[f.si].words.length-1?`<span class="endmk">■</span>`:"";
    return `<span class="w${cls}">${esc(f.t)}</span>${cm?`<span class="cutmark${cm==="forced"?" forced":""}">｜</span>`:""}${endMk}`;
  }).join("");
  const ws=st.querySelectorAll(".w");let gx;
  if(S.passed<=0)gx=ws[0].offsetLeft-4;
  else{const a=ws[Math.min(S.passed,ws.length)-1],nx=a.nextElementSibling;const r=a.offsetLeft+a.offsetWidth;gx=nx?(nx.classList.contains("cutmark")?nx.offsetLeft+nx.offsetWidth/2:(r+nx.offsetLeft)/2):r+6}
  st.classList.toggle("step",!noAnim);
  st.style.transform=`translate(${lineX()-gx}px,-50%)`;
  $("cutline").style.left=lineX()+"px";
  if(manual())syncScrub();
  updateBackBtn();
}
/* 1語もどる（設定で「使う」のときだけ）。区切った所より前には戻れない。チャレンジ中は使えない */
const canBack=()=>!!(S&&S.phase==="play"&&!S.paused&&manual()&&settings.backBtn&&!S.timed&&S.passed>S.lastCut+1);
function back(n){
  if(!canBack())return;
  const to=Math.max(S.lastCut+1,S.passed-n);if(to===S.passed)return;
  S.passed=to;renderLane(true);renderLine();
}
function updateBackBtn(){
  const b=$("backBtn");if(!b)return;const on=!!(settings.backBtn&&!(S&&S.timed));
  b.disabled=!(on&&canBack());
  b.setAttribute("aria-label",on?"1語もどる（区切った所より前には戻れない）":"戻る（設定で「使う」にすると使えます）");
}
/* 上の行：今の文の判定済みチャンク＋流れ出た単語 */
function blockHTML(sen,c){
  const words=sen.words.slice(c.a,c.b+1).map((w,i)=>`<span class="w${c.roles?" r"+c.roles[i]:""}">${esc(w)}</span>`).join(" ");
  const lab=labelText(c),nt=noteText(c);
  return `<span class="blk k-${c.kind}"><span class="bw"><span class="mk k-${c.kind}">${RANK[c.kind][1]}</span>${words}</span>`
    +(lab?`<span class="bl">${esc(lab)}${nt?`<br>${esc(nt)}`:""}</span>`:"")
    +(c.jp&&c.kind!=="miss"&&c.kind!=="forgot"?`<span class="bj">${esc(c.jp)}</span>`:"")+`</span>`;
}
function renderLine(){
  const k=S.openK;if(k>=S.seq.length){$("line").innerHTML="";return}
  const sen=S.sens[S.seq[k]],outEnd=S.passed-KEEP_LEFT-1;
  let html=S.chunks[k].map(c=>blockHTML(sen,c)).join("");
  const from=S.lastCut+1,to=Math.min(outEnd,endOf(k));
  if(to>=from)html+=`<span class="pend">${S.flat.slice(from,to+1).map(f=>esc(f.t)).join(" ")}</span>`;
  $("line").innerHTML=html;
}
/* タイミングの猶予：少し遅れて押したら1つ前のすき間、少し早く押したら次のすき間で切ったことにする */
const late=()=>Math.min(260,SPEED[settings.speed]*.35),early=()=>Math.min(160,SPEED[settings.speed]*.2);
const RANKV={miss:0,forgot:0,good:1,mini:2,great:3,excellent:3};
function gapRank(gb){
  const ga=S.lastCut+1;if(gb<ga||gb>=S.flat.length)return -1;
  const fa=S.flat[ga],fb=S.flat[gb];if(fa.k!==fb.k)return -1;
  return RANKV[classify(S.sens[S.seq[fa.k]],fa.li,fb.li).kind];
}
const manual=()=>settings.advance==="manual";
/* 1語進める（自動でも手動でも共通） */
function advance(){
  if(S.passed>=S.flat.length)return false;
  S.passed++;
  if(manual()){S.lastStepAt=-1e9;S.nextStepAt=1e12}   // 自分で送る時はタイミングの猶予なし
  else{S.lastStepAt=performance.now();S.nextStepAt=S.lastStepAt+SPEED[settings.speed]}
  const f=S.flat[S.passed-1];
  // 連続モード：前の文の終わりで区切らずに次の文へ入ったら「区切り忘れ」（自動の時は少しだけ猶予）
  if(S.mode==="cont"&&f.k>0&&f.li===0&&!S.closed[f.k-1]){
    const kk=f.k-1,s0=S;
    if(manual())forceClose(kk);
    else setTimeout(()=>{if(S===s0&&!S.closed[kk]){forceClose(kk);renderLane();renderLine()}},late());
  }
  return true;
}
function step(){
  clearTimeout(S.timer);if(S.phase!=="play"||S.paused||manual())return;
  if(advance()){
    renderLane();renderLine();tick();
    if(S.queuedCut){S.queuedCut=false;cut()}
    S.timer=setTimeout(step,SPEED[settings.speed]);
  }else finishSeq();
}
/* 自分で送る：▶ で1語、バーのドラッグで一気に（戻れない） */
function fwd(n){
  if(!S||S.phase!=="play"||S.paused||!manual())return;
  $("rolePick").hidden=true;
  if(S.passed>=S.flat.length){finishSeq();return}
  let moved=false;for(let i=0;i<n&&S.passed<S.flat.length;i++)moved=advance()||moved;
  if(moved){renderLane(n>1);renderLine();tick()}
}
function syncScrub(){const sc=$("scrub");if(!S)return;sc.max=S.flat.length;sc.value=S.passed}
function setCutLabel(){
  const game=!(S&&S.studyMode);const b=$("cutBtn");if(b&&b.childNodes[0])b.childNodes[0].nodeValue=game?"チャンク！":"区切る";
  $("cutline").dataset.lbl=game?"ここでチャンク":"ここで区切る";
}
function applyAdvanceUI(){
  setCutLabel();
  const m=manual();$("navBtns").hidden=!m;$("scrub").hidden=!m;$("timeText").hidden=!m;
  const g=!(S&&S.studyMode);
  $("cutHint").textContent=m?(g?"▶で進む。ここから下のどこをタップしてもチャンク！":"▶で進む。ここから下のどこでも区切れる"):(g?"ここから下なら、どこをタップしてもチャンク！":"ここから下なら、どこをタップしても区切れる");
}
/* ===== 区切る：区切った瞬間にそのまとまりを判定 ===== */
function cut(){
  if(!S||S.phase!=="play"||S.paused)return;
  $("rolePick").hidden=true;
  let w=S.passed-1;const now=performance.now();
  if(w<0)return;
  const done=S.cuts.has(w)||w<=S.lastCut,rw=done?-1:gapRank(w);
  if(S.nextStepAt-now<early()&&S.passed<S.flat.length&&gapRank(w+1)>rw){S.queuedCut=true;return}  // 早すぎた
  if(done)return;
  if(now-S.lastStepAt<late()&&w-1>S.lastCut&&gapRank(w-1)>rw)w--;            // 遅れた
  S.cuts.set(w,"cut");
  const lw=$("laneWrap");lw.classList.remove("flash");void lw.offsetWidth;lw.classList.add("flash");
  judgeChunk(S.lastCut+1,w);
  const f=S.flat[w];if(w===endOf(f.k))closeSentence(f.k);
  renderLane();renderLine();
  if(w===S.flat.length-1){clearTimeout(S.timer);finishSeq()}
}
function judgeChunk(ga,gb,forced){
  const f=S.flat[ga],k=f.k,sen=S.sens[S.seq[k]];
  let c=classify(sen,f.li,S.flat[gb].li);
  if(forced)c={...c,kind:"forgot",roles:null};
  c={...c,a:f.li,b:S.flat[gb].li};
  S.chunks[k].push(c);S.lastCut=gb;addScore(PTS[c.kind]);
  hitSound(c.kind);stageOnChunk(k,sen,c);
  if(c.kind==="excellent"||c.kind==="great")speakChunk(sen.words.slice(c.a,c.b+1).join(" "));
  showPop(c);burst(c);
  document.dispatchEvent(new CustomEvent("cc:judge",{detail:{kind:c.kind,roles:c.roles}}));   // アバターなどが反応できるように
  if(S.roleMode&&!forced)askRole(c);
  return c;
}
function forceClose(k){
  const e=endOf(k);
  if(S.lastCut<e){judgeChunk(S.lastCut+1,e,true);S.cuts.set(e,"forced")}
  closeSentence(k);
}
/* 区切った瞬間：線から輪っかと色の粒がはじける */
const KIND_COLOR={excellent:"#5fd49a",great:"#7cc4ff",good:"#ffd166",mini:"#c3cfdf",miss:"#ff6b6b",forgot:"#ff6b6b"};
const ROLE_COLOR={S:"#7cc4ff",V:"#ff8f8f",O:"#8ee6a8",I:"#6fe0d8",C:"#ffb870",P:"#d6a8ff",T:"#ffd166",M:"#e6ecf5",R:"#e6ecf5",F:"#e6ecf5",X:"#9fb0c6"};
function burst(c){
  const wrap=$("laneWrap"),x=lineX(),col=KIND_COLOR[c.kind];
  const ring=document.createElement("span");ring.className="ring";ring.style.left=x+"px";ring.style.borderColor=col;wrap.append(ring);
  ring.animate(reduce?[{opacity:.9},{opacity:0}]:[{transform:"translate(-50%,-50%) scale(.2)",opacity:.95},{transform:"translate(-50%,-50%) scale(1)",opacity:0}],{duration:reduce?300:450,easing:"cubic-bezier(.2,.8,.3,1)"}).onfinish=()=>ring.remove();
  if(reduce||c.kind==="miss"||c.kind==="forgot")return;
  const cols=c.roles?[...new Set(c.roles)].map(r=>ROLE_COLOR[r]):[col];
  const n=c.kind==="mini"?4:c.kind==="excellent"?10:7;
  for(let i=0;i<n;i++){
    const d=document.createElement("span");d.className="spark";d.style.left=x+"px";d.style.background=cols[i%cols.length];wrap.append(d);
    const ang=Math.PI*2*i/n+Math.random()*.5,dist=30+Math.random()*26;
    d.animate([{transform:"translate(-50%,-50%) scale(1)",opacity:1},{transform:`translate(calc(-50% + ${Math.cos(ang)*dist}px),calc(-50% + ${Math.sin(ang)*dist}px)) scale(.3)`,opacity:0}],{duration:480+Math.random()*120,easing:"cubic-bezier(.1,.7,.3,1)"}).onfinish=()=>d.remove();
  }
}
let popEl=null;
function showPop(c){
  if(popEl)popEl.remove();
  const r=$("laneWrap").getBoundingClientRect();
  const el=document.createElement("div");el.className=`pop k-${c.kind}`;
  const lab=labelText(c),nt=noteText(c);
  const title=c.title||(c.kind==="mini"?(settings.disp==="gram"?c.gram:"ちいさいチャンク"):RANK[c.kind][0]);
  const showJp=c.kind!=="miss"&&c.kind!=="forgot";
  el.innerHTML=`<b>${esc(title)}</b>`
    +((c.kind!=="mini"||settings.disp!=="gram")&&c.kind!=="forgot"&&lab?`<span class="pl">${esc(lab)}</span>`:"")
    +(nt?`<span class="pl2">${esc(nt)}</span>`:"")
    +(showJp&&c.jp?`<span class="pj">${esc(c.jp)}</span>`:"")
    +(c.title?"":`<span class="pc">+${PTS[c.kind]}</span>`);
  const x=Math.min(Math.max(r.left+lineX(),r.left+110),r.right-110);
  el.style.left=x+"px";el.style.bottom=(innerHeight-r.top+8)+"px";
  document.body.append(el);popEl=el;setTimeout(()=>{el.remove();if(popEl===el)popEl=null},1500);
}

/* ===== 文が終わったとき：主語・動詞・目的語ボーナス ===== */
function closeSentence(k){
  if(S.closed[k])return;S.closed[k]=true;
  const sen=S.sens[S.seq[k]],chunks=S.chunks[k],bonus=[];
  sen.units.forEach(u=>{
    if(!"SVO".includes(u.role))return;
    if(chunks.some(c=>c.a===u.s&&c.b===u.e&&c.kind!=="forgot"))bonus.push({role:u.role,name:{S:"主語",V:"動詞",O:"目的語"}[u.role]+"ボーナス"});
  });
  const perfect=chunks.every(c=>c.kind!=="miss"&&c.kind!=="forgot"&&c.kind!=="good");
  let time=null,tb=0;
  if(manual()&&!S.timed){time=(S.elapsed-S.sentStart)/1000;S.sentStart=S.elapsed;tb=Math.max(0,Math.round((sen.words.length*1.2-time)*20))}
  const extra=bonus.length*BONUS+(perfect?PERFECT_BONUS:0)+tb;if(extra)addScore(extra);
  const pts=chunks.reduce((a,c)=>a+PTS[c.kind],0)+extra;
  const r={chunks:[...chunks],bonus,pts,perfect,time,tb};S.results[S.seq[k]]=r;
  if(perfect)stageDone();
  document.dispatchEvent(new CustomEvent("cc:sentence",{detail:{perfect,pts}}));
  const html=judgedHTML(sen,r);
  if(S.mode==="cont"){pushHist(html);S.openK=k+1;updateProg()}
  return html;
}
function judgedHTML(sen,r){
  return r.chunks.map(c=>`<span class="mk k-${c.kind}">${RANK[c.kind][1]}</span>`+sen.words.slice(c.a,c.b+1).map((w,i)=>`<span class="w${c.roles?" r"+c.roles[i]:""}">${esc(w)}</span>`).join(" ")).join('<span class="cutmark">｜</span>')
    +`<span class="pts">+${r.pts}${r.perfect?" PERFECT":""}</span>`
    +(r.bonus.length||r.time!=null?"<br>":"")+r.bonus.map(b=>`<span class="bonus r${b.role}">${b.name} +${BONUS}</span>`).join("")
    +(r.time!=null?`<span class="tBonus">⏱ ${r.time.toFixed(1)}秒${r.tb?` タイムボーナス +${r.tb}`:""}</span>`:"");
}
function pushHist(html){
  const h=document.createElement("div");h.className="hist newest";h.innerHTML=html;
  [...$("hist").children].forEach(c=>c.classList.remove("newest"));$("hist").append(h);
  h.animate(reduce?[{opacity:0},{opacity:.85}]:[{transform:"translateY(30px)",opacity:0},{transform:"none",opacity:.85}],{duration:400,easing:"ease-out"});
  while($("hist").children.length>2)$("hist").firstChild.remove();
}
/* レーンの最後の単語まで流れた：最後のまとまりは自動で判定 */
async function finishSeq(){
  if(S.finishing)return;S.finishing=true;const run=runId,s0=S;
  const last=S.flat.length-1,k=S.flat[last].k;
  if(S.lastCut<last&&!manual()){await wait(late());if(run!==runId||S!==s0)return}   // 最後の区切りにも少し猶予
  S.phase="judge";
  // 最後も区切るのが必須。区切っていなければ「区切り忘れ」
  if(S.lastCut<last){judgeChunk(S.lastCut+1,last,true);S.cuts.set(last,"forced");renderLane()}
  closeSentence(k);
  if(!manual()){await wait(500);if(run!==runId)return}
  if(S.mode==="cont"){
    $("strip").innerHTML="";$("line").innerHTML="";
    await wait(1300);if(run!==runId)return;
    S.phase="done";review();return;
  }
  const html=judgedHTML(S.sens[S.seq[k]],S.results[S.seq[k]]);
  if(manual()){   // よーいどん：待ち時間ゼロで次の文へ
    pushHist(html);$("line").innerHTML="";S.si++;
    if(S.si>=S.sens.length){S.phase="done";if(S.timed)timedEnd();else setTimeout(review,300);return}
    setupSeq();updateProg();renderPreview();renderLane(true);S.phase="play";return;
  }
  $("strip").innerHTML="";
  $("line").innerHTML=`<div class="judgedLine">${html}</div>`;
  await wait(2000);if(run!==runId)return;
  pushHist(html);$("line").innerHTML="";
  S.si++;
  if(S.si>=S.sens.length){S.phase="done";setTimeout(review,400);return}
  setupSeq();updateProg();renderPreview();renderLane(true);
  // 次の文はレーンに見えている状態で、3・2・1・GO!
  if(!await runCount(run,[["3","",620],["2","",620],["1","",620],["GO!","go",480]],true))return;
  S.phase="play";renderPreview();step();
}

/* ===== 振り返り ===== */
function legendHTML(){return `<div class="legend">${"SVOICPTM".split("").map(r=>`<span class="r${r}">■${RN[r][0]}</span>`).join("")}<span class="rX">■説明</span></div>`}
function review(){
  const all=S.results.flatMap(r=>r?r.chunks:[]),cnt=k=>all.filter(c=>c.kind===k||(k==="miss"&&c.kind==="forgot")).length;
  const refHTML=sen=>`<div class="roles">${sen.units.map(u=>`<span class="rcell"><span class="rtx">${u.subs?u.subs.map((p,pi)=>`<span class="r${pi&&u.role!=="V"?"X":u.role}">${esc(sen.words.slice(p.s,p.e+1).join(" "))}</span>`).join(" "):`<span class="r${u.role}">${esc(u.text)}</span>`}</span><span class="rl r${u.role}">${RN[u.role][settings.disp==="gram"?1:0]}</span></span>`).join('<span class="cutmark">｜</span>')}</div>`;
  openSheet(`<h2>${esc(S.title)} クリア！</h2>
    ${S.roleMode&&S.roleN?`<div class="note">役割：${S.roleOk} / ${S.roleN} 正解</div>`:""}
    <div class="big">${S.gained} pt${manual()?`<span style="font-size:16px;color:var(--muted);margin-left:10px">⏱ ${(S.elapsed/1000).toFixed(1)}秒</span>`:""}</div>
    <div class="stats">${[["excellent","◎"],["great","◯"],["good","△"],["mini","・"],["miss","×"]].map(([k,m])=>`<div class="stat"><span class="mk k-${k}">${m}</span><b>${cnt(k)}</b></div>`).join("")}</div>
    ${legendHTML()}
    ${S.sens.map((sen,i)=>{const r=S.results[i];if(!r)return "";
      return `<div class="rvw"><span class="lab">あなたの区切り</span><div class="en">${judgedHTML(sen,r)}</div>
        <span class="lab">参考の区切り</span>${refHTML(sen)}
        <div class="ja">${esc(sen.ja)}</div>${canSpeak&&settings.tts?`<button class="say" data-i="${i}">区切りごとに聞く</button>`:""}</div>`}).join("")}
    <div class="btns"><button class="ghost" id="toTitle2">タイトルへ</button><button class="ghost" id="againBtn">もう一度</button><button class="primary" id="nextBtn">${S.mode==="one"?"次の6文へ":"次のお話へ"}</button></div>`,false);
  $("sheet").querySelectorAll(".say").forEach(b=>b.onclick=()=>speakChunks(S.sens[+b.dataset.i].units.map(u=>u.text)));
  $("againBtn").onclick=()=>{closeSheet();total-=S.gained;$("score").textContent=total;loadStage(S.mode,S.n,S.list)};
  $("toTitle2").onclick=showTitle;
  $("nextBtn").onclick=()=>{closeSheet();stageN[S.mode]=S.n+1;loadStage(S.mode,S.n+1)};
}

/* ===== 操作 ===== */
$("tapZone").addEventListener("pointerdown",e=>{e.preventDefault();unlockAudio();cut()});
document.addEventListener("keydown",e=>{
  const tg=e.target&&e.target.tagName;if(tg==="INPUT"||tg==="TEXTAREA"||tg==="SELECT"||e.target.isContentEditable)return;   // 入力欄では文字入力を優先
  if(!$("edView").hidden)return;
  if(!$("modal").hidden||!$("startBox").hidden||!$("title").hidden)return;
  if(!$("readView").hidden){
    const k={ArrowLeft:()=>rdMove(RD.p-1),ArrowRight:()=>rdMove(RD.p+1),ArrowUp:()=>rdSentence(-1),ArrowDown:()=>rdSentence(1)," ":()=>RD.sel?null:rdCut(),Enter:()=>RD.sel?rdDecide():rdCut()}[e.key];
    if(k){e.preventDefault();k()}return;
  }
  if(e.key===" "||e.key==="Enter"){e.preventDefault();cut()}
  else if(e.key==="ArrowRight"){e.preventDefault();fwd(1)}
  else if(e.key==="ArrowLeft"){e.preventDefault();back(1)}
});

let sheetClosable=true;
function openSheet(html,closable=true){sheetClosable=closable;if(S){S.paused=true;clearTimeout(S.timer)}$("sheet").innerHTML=html;$("modal").hidden=false}
function closeSheet(){if(typeof rvStop==="function")rvStop();$("modal").hidden=true;if(S){S.paused=false;if(S.phase==="play")S.timer=setTimeout(step,SPEED[settings.speed])}}
$("modal").addEventListener("click",e=>{if(e.target.id==="modal"&&sheetClosable)closeSheet()});
const opt=(id,cur,list)=>`<select id="${id}">${list.map(([v,l])=>`<option value="${v}" ${v===cur?"selected":""}>${l}</option>`).join("")}</select>`;
function settingRows(){return `
    <div class="row"><label for="optSpeed">単語が入ってくる速さ（自動の時）</label>${opt("optSpeed",String(settings.speed),Object.keys(SPEED).map(k=>[k,`${k}　${SPEED_NAME[k]}`]))}</div>
    <div class="row"><label for="optFont">流れる文字の大きさ</label>${opt("optFont",settings.font,Object.keys(FONT).map(k=>[k,FONT_NAME[k]]))}</div>
    <div class="row"><label for="optDisp">チャンクの説明</label>${opt("optDisp",settings.disp,[["easy","かんたん（する＋何を）"],["gram","文法（動詞＋目的語）"],["both","両方"],["none","色だけ"]])}</div>
    <div class="row"><label for="optSnd">区切ったときの音</label>${opt("optSnd",settings.sound,[["both","効果音（小）＋読み上げ"],["voice","読み上げだけ"],["sfx","効果音だけ（テンポ重視）"],["off","なし"]])}</div>
    <div class="row"><label for="optMyRank">自分のランク</label>${opt("optMyRank",String(settings.myLevel||0),[["0","未登録"],...LV.slice(1).map((_,i)=>[String(i+1),lvLabel(i+1)])])}</div>
    <div class="row"><label for="optRandLv">ランダムで出す文</label>${opt("optRandLv",settings.randLv||"auto",[["auto","おまかせ（自分のランクの前後）"],["all","すべてのレベル"],...LV.slice(1).map((_,i)=>[String(i+1),lvLabel(i+1)+" だけ"])])}</div>
    <div class="row"><label for="optBack">1語もどるボタン（自分で送るとき）</label>${opt("optBack",settings.backBtn?"on":"off",[["off","使わない"],["on","使う"]])}</div>
    <div class="row"><label for="optTts">振り返りの読み上げ</label>${opt("optTts",settings.tts?"on":"off",[["on","オン"],["off","オフ"]])}</div>`}
function bindSettingRows(){
  $("optBack").onchange=e=>{settings.backBtn=e.target.value==="on";saveSettings();updateBackBtn()};
  $("optMyRank").onchange=e=>{settings.myLevel=+e.target.value;settings.lvUp=settings.lvDown=0;saveSettings();updateLvHint()};
  $("optRandLv").onchange=e=>{settings.randLv=e.target.value;saveSettings();updateLvHint()};
  $("optSpeed").onchange=e=>{settings.speed=+e.target.value;saveSettings();applyVisual()};
  $("optFont").onchange=e=>{settings.font=e.target.value;saveSettings();applyVisual();if(S){renderLane(true);renderPreview()}};
  $("optDisp").onchange=e=>{settings.disp=e.target.value;saveSettings();if(S)renderLine()};
  $("optTts").onchange=e=>{settings.tts=e.target.value==="on";saveSettings()};
  $("optSnd").onchange=e=>{settings.sound=e.target.value;saveSettings();unlockAudio();hitSound("excellent");speakChunk("was cooking dinner")};
}
$("gear").onclick=()=>{
  openSheet(`<h2>設定</h2>${settingRows()}
    ${legendHTML()}
    <p class="note">成功したチャンク（◎◯）は区切った瞬間に英語で読み上げる。次を区切ると前の読み上げは止まる。<br>◎ Excellent＝役割のまとまりをぴったり／◯ Great＝大きい句（する＋何を など）／△ Good＝主語＋動詞のSVチャンク／・ちいさいチャンク＝1語や「冠詞＋名詞」だけの小さいまとまり（かんたん表示では役割、文法表示では品詞を表示）／×＝まとまりの途中で切った<br>文が終わると、主語・動詞・目的語をぴったり切り出せていればボーナス。</p>
    <div class="btns"><button class="ghost" id="toTitle">タイトルへ</button><button class="ghost" id="restartBtn">最初から</button><button class="primary" id="closeBtn">閉じる</button></div>`);
  bindSettingRows();
  $("toTitle").onclick=showTitle;
  $("closeBtn").onclick=closeSheet;
  $("restartBtn").onclick=()=>{$("modal").hidden=true;total-=S.gained;$("score").textContent=total;clearTimeout(S.timer);loadStage(S.mode,S.n,S.list)};
};

/* ===== タイトル画面（GAME ⇔ STUDY）：左へドラッグ＝ゲーム、右へドラッグ＝スタディ ===== */
function setFace(f){settings.face=f;saveSettings();$("title").dataset.face=f}
function updateLvHint(){const el=$("lvHint");if(el)el.textContent=`出る文：${randLabel()}（設定で変えられます）`}
function showTitle(){
  runId++;if(S){clearTimeout(S.timer);S.phase="ready";S.paused=false;S.roleMode=false}
  try{speechSynthesis.cancel()}catch(e){}
  ["count","modal","startBox","readView","edView","rolePick"].forEach(id=>$(id).hidden=true);
  if(popEl){popEl.remove();popEl=null}
  $("title").dataset.face=settings.face||"none";updateLvHint();
  $("title").hidden=false;
}
(()=>{
  // 横ドラッグをブラウザのスクロールに取られないよう、指が50px動いた時点で切り替える（指を離すのを待たない）
  const t=$("title");let d=null;
  const start=(x,y)=>{d={x,y,done:false}};
  const move=(x,y)=>{if(!d||d.done)return;const dx=x-d.x,dy=y-d.y;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.2){d.done=true;setFace(dx<0?"game":"study")}};
  t.addEventListener("pointerdown",e=>start(e.clientX,e.clientY));
  t.addEventListener("pointermove",e=>move(e.clientX,e.clientY));
  t.addEventListener("touchstart",e=>{const p=e.touches[0];start(p.clientX,p.clientY)},{passive:true});
  t.addEventListener("touchmove",e=>{const p=e.touches[0];move(p.clientX,p.clientY)},{passive:true});
  ["pointerup","pointercancel","touchend","touchcancel"].forEach(ev=>t.addEventListener(ev,()=>{d=null}));
  t.querySelectorAll("[data-face-go]").forEach(b=>b.onclick=()=>setFace(b.dataset.faceGo));
})();
document.querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>{
  primeSpeech();unlockAudio();$("title").hidden=true;
  const [adv,mode]=b.dataset.play.split("-");settings.advance=adv;settings.mode=mode;saveSettings();
  loadStage(mode,stageN[mode],null,true);
});
document.querySelectorAll("[data-open-set]").forEach(b=>b.onclick=()=>{
  openSheet(`<h2>設定</h2>${settingRows()}${legendHTML()}<div class="btns"><button class="primary" id="closeBtn">閉じる</button></div>`);
  bindSettingRows();$("closeBtn").onclick=closeSheet;
});
document.querySelectorAll("[data-study]").forEach(b=>b.onclick=()=>{
  primeSpeech();unlockAudio();const v=b.dataset.study;
  if(v==="texts"){$("title").hidden=true;openMyTexts();return}
  pickText(v);
});
/* スタディ：読む／練習する文章を選ぶ（難易度で並べ替え・絞り込み・おすすめ） */
let pickTok=0;
function pickText(kind,noFetch){
  const tok=++pickTok;
  if(DB&&!noFetch)loadShared().then(()=>{if(tok===pickTok&&!$("modal").hidden&&$("sheet").querySelector("#optMyLv"))pickText(kind,true)});
  const mine=loadMy().filter(t=>t.sents&&t.sents.length),shr=(SHARED||[]).filter(t=>t.sents&&t.sents.length);
  const lvOf=(key,base)=>key&&LVO[key]!=null?LVO[key]:(base||null);
  let items=kind==="read"
    ?[...STORIES.filter(s=>QUESTIONS[s.title]).map((s,i)=>({label:s.title,key:s.id,level:lvOf(s.id,s.level),sub:`内蔵・${QUESTIONS[s.title].length}問`,ord:1000+i,go:()=>startRead(builtinStory(s))})),
      ...shr.map((t,i)=>({label:t.title||"（無題）",key:"t-"+t.id,level:lvOf("t-"+t.id,t.level),sub:`みんなの長文・${t.sents.length}文・${(t.questions||[]).length}問${t.mode==="test"?"・テスト":""}`,ord:500+i,go:()=>startRead({...myToStory(t),level:lvOf("t-"+t.id,t.level)})})),
      ...mine.map((t,i)=>({label:t.title||"（無題）",level:t.level||null,sub:`My Text・${t.sents.length}文・${(t.questions||[]).length}問${t.mode==="test"?"・テスト":""}`,ord:i,go:()=>startRead(myToStory(t))}))]
    :[...shortPickItems(),
      ...shr.map((t,i)=>({label:t.title||"（無題）",key:"t-"+t.id,level:lvOf("t-"+t.id,t.level),sub:`みんなの長文・${t.sents.length}文`,ord:500+i,go:()=>startPractice(t)})),
      ...mine.map((t,i)=>({label:t.title||"（無題）",level:t.level||null,sub:`My Text・${t.sents.length}文`,ord:i,go:()=>startPractice(t)}))];
  const [,lo,hi]=LVGROUP[settings.lvFilter]||LVGROUP.all;
  const shown=items.filter(it=>settings.lvFilter==="rec"?isRec(it.level):settings.lvFilter==="all"||!it.level||(it.level>=lo&&it.level<=hi));
  const m=+settings.myLevel||0,dist=it=>it.level?Math.abs(it.level-m):0.5;
  shown.sort((x,y)=>settings.lvSort==="easy"?(x.level||0)-(y.level||0):settings.lvSort==="hard"?(y.level||0)-(x.level||0):settings.lvSort==="rec"&&m?dist(x)-dist(y):x.ord-y.ord);
  openSheet(`<h2>${kind==="read"?"Reading":"Chunk Practice"}</h2>
    <div class="row"><label for="optMyLv">自分のレベル</label>${opt("optMyLv",String(settings.myLevel||0),[["0","未設定"],...LV.slice(1).map((_,i)=>[String(i+1),lvLabel(i+1)])])}</div>
    <div class="row"><label for="optLvSys">レベルの表し方</label>${opt("optLvSys",settings.lvSys,Object.entries(LVSYS))}</div>
    <div class="row"><label for="optLvF">絞り込み</label>${opt("optLvF",settings.lvFilter,Object.entries(LVGROUP).map(([k,v])=>[k,v[0]]))}</div>
    <div class="row"><label for="optLvS">並べ方</label>${opt("optLvS",settings.lvSort,[["rec","おすすめ順"],["easy","やさしい順"],["hard","難しい順"],["new","登録順"]])}</div>
    <div class="row"><label for="optLvA">結果でおすすめを自動調整</label>${opt("optLvA",settings.lvAuto===false?"off":"on",[["on","オン"],["off","オフ"]])}</div>
    ${kind==="practice"?`<div class="row"><label for="optRole">役割も答える</label>${opt("optRole",settings.roleAns===false?"off":"on",[["on","オン"],["off","オフ"]])}</div>
      <button class="ghost pickRand" style="text-align:left;flex:none"><b style="color:var(--ink)">ランダム</b><br><small>内蔵の例文と短文から（${esc(randLabel())}）</small></button>`:""}
    ${shown.length?"":`<p class="note">この条件の文章はありません。</p>`}
    ${shown.map((it,i)=>`<div class="pickRow"><button class="ghost pickItem" data-i="${i}" style="text-align:left;flex:none"><b style="color:var(--ink)">${m&&isRec(it.level)?"★ ":""}${esc(it.label)}</b><br><small>${esc(lvLabel(it.level))}${it.key&&LVO[it.key]!=null?"（修正済み）":""}・${esc(it.sub)}</small></button>${it.key&&IS_ADMIN&&DB?`<button class="lvFix" data-i="${i}">難易度を直す</button>`:""}</div>`).join("")}
    <div class="btns"><button class="ghost" id="closeBtn">閉じる</button></div>`);
  const re=()=>pickText(kind,true);
  $("optMyLv").onchange=e=>{settings.myLevel=+e.target.value;settings.lvUp=settings.lvDown=0;saveSettings();re()};
  $("optLvSys").onchange=e=>{settings.lvSys=e.target.value;saveSettings();re()};
  $("optLvF").onchange=e=>{settings.lvFilter=e.target.value;saveSettings();re()};
  $("optLvS").onchange=e=>{settings.lvSort=e.target.value;saveSettings();re()};
  $("optLvA").onchange=e=>{settings.lvAuto=e.target.value==="on";saveSettings()};
  if(kind==="practice"){$("optRole").onchange=e=>{settings.roleAns=e.target.value==="on";saveSettings()};
    $("sheet").querySelector(".pickRand").onclick=()=>{closeSheet();$("title").hidden=true;startPractice(null)}}
  $("sheet").querySelectorAll(".pickItem").forEach(b=>b.onclick=()=>{closeSheet();$("title").hidden=true;shown[+b.dataset.i].go()});
  $("sheet").querySelectorAll(".lvFix").forEach(b=>b.onclick=()=>editLevel(shown[+b.dataset.i],re));
  $("closeBtn").onclick=closeSheet;
}
/* 難易度を直す（編集権限のある人だけ）。直した値は共有データベースに入り、みんなに反映される */
function editLevel(it,back){
  const cur=it.level||3,has=LVO[it.key]!=null;
  openSheet(`<h2>難易度を直す</h2><p class="note"><b>${esc(it.label)}</b><br>直すと、この文章を開く全員の難易度が変わります。</p>
    <div class="row"><label for="optFixLv">難易度</label>${opt("optFixLv",String(cur),LV.slice(1).map((_,i)=>[String(i+1),lvLabel(i+1)]))}</div>
    <div class="btns"><button class="ghost" id="fixCancel">やめる</button>${has?`<button class="ghost" id="fixReset">元に戻す</button>`:""}<button class="primary" id="fixOk">直す</button></div>`);
  $("fixCancel").onclick=back;
  $("fixOk").onclick=async()=>{const n=+$("optFixLv").value;
    try{await DB.doc("levels/"+it.key).set({level:n});LVO[it.key]=n;toast("難易度を直しました（みんなに反映）")}catch(e){await tell("直せませんでした。編集の権限がないか、通信の問題かもしれません。");}
    back()};
  if(has)$("fixReset").onclick=async()=>{try{await DB.doc("levels/"+it.key).delete();delete LVO[it.key];toast("元に戻しました")}catch(e){await tell("元に戻せませんでした。")}back()};
}
function startPractice(t){
  settings.advance="manual";saveSettings();
  const list=t?myToStory(t).list:pickRandom(PER_STAGE);
  loadStage("one",4,list.length>PER_STAGE?shuffle(list).slice(0,PER_STAGE):list,true);
  S.title=t?`Chunk Practice「${t.title||"無題"}」`:"Chunk Practice";S.short="Practice";$("stageText").textContent="Practice";
  S.roleMode=settings.roleAns!==false;S.studyMode=true;applyAdvanceUI();
}
function startShortPractice(items,title){
  settings.advance="manual";saveSettings();
  const list=shuffle(items).slice(0,PER_STAGE).map(x=>[x.s,x.ja]);
  loadStage("one",4,list,true);
  S.title=`Chunk Practice「${title}」`;S.short="Practice";$("stageText").textContent="Practice";
  S.roleMode=settings.roleAns!==false;S.studyMode=true;applyAdvanceUI();
}
/* 自分で送るモードの操作 */
["navBtns","scrub"].forEach(id=>$(id).addEventListener("pointerdown",e=>e.stopPropagation()));
$("fwdBtn").addEventListener("pointerdown",e=>{e.preventDefault();fwd(1)});
$("backBtn").addEventListener("pointerdown",e=>{e.preventDefault();back(1)});
$("scrub").addEventListener("input",e=>{
  if(!S||S.phase!=="play"||!manual()){syncScrub();return}
  const v=+e.target.value;
  if(v<S.passed&&canBack()){back(S.passed-v);e.target.value=S.passed;return}   // 「1語もどる」を使うときだけ、区切った所まで戻れる
  if(v<=S.passed){e.target.value=S.passed;return}   // 戻れない
  fwd(v-S.passed);
});
/* タイム（自分で送るモード）：遊んでいる間だけ進む */
let lastTick=performance.now();
setInterval(()=>{const now=performance.now(),dt=now-lastTick;lastTick=now;
  if(S&&manual()&&S.phase==="play"&&!S.paused){S.elapsed+=dt;
    if(S.timed){$("timeText").textContent="残り "+Math.max(0,(S.timed.limit-S.elapsed)/1000).toFixed(1);if(S.elapsed>=S.timed.limit)timedEnd()}
    else $("timeText").textContent="⏱ "+(S.elapsed/1000).toFixed(1)}},100);
