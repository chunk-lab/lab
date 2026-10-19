import { COMMON, LVO, ONE_TIERS, STORIES } from './data.js';
import { timedEnd } from './rank.js';
import { shortsAll } from './shorts.js';
import { myToStory } from './texts.js';
import { showTitle, updateLvHint } from './title.js';
import { sfx, stopSfxVoice } from './sfx.js';
import { bgmTick, bgmMuteDraw } from './bgm.js';
/* チャンクチャンク：ゲームの本体（区切る・判定・振り返り・設定・タイトル・ランダム） */
export const PER_STAGE=6;
/* 速さ10段階（1語が進む間隔ms）。4＝前の「ふつう」、10＝その約10倍速 */
export const SPEED={1:1600,2:1300,3:1100,4:820,5:600,6:450,7:330,8:230,9:150,10:82};
export const SPEED_NAME={1:"のんびり",2:"ゆっくり",3:"やや遅い",4:"ふつう",5:"やや速い",6:"速い",7:"とても速い",8:"激速",9:"超速",10:"鬼"};
export const FONT={xl:28,l:23,m:20,s:17,xs:14};
export const FONT_NAME={xl:"特大",l:"大",m:"中",s:"小",xs:"極小（先まで見える）"};
export const PTS={excellent:100,great:80,good:40,cross:30,mini:30,miss:0,forgot:0},BONUS=50,PERFECT_BONUS=100;
export const RANK={excellent:["Excellent!","◎"],great:["Great!","◯"],good:["Good","△"],cross:["Nice","▽"],mini:["","・"],miss:["Miss…","×"],forgot:["区切り忘れ！","×"]};
/* 役割の名前 [かんたん, 文法] */
export const RN={S:["誰が・何が","主語"],V:["する","動詞"],O:["何を・誰を","目的語"],I:["誰に","間接目的語"],C:["どうだ","補語"],P:["どこで","場所"],T:["いつ","時"],M:["どうやって","様子・手段"],R:["なぜ","理由"],F:["もし","条件"],X:["説明","修飾語句"]};
export const RS={S:["誰が","主語"],V:["する","動詞"],O:["何を","目的語"],I:["誰に","間接目的語"],C:["どうだ","補語"],P:["どこで","場所"],T:["いつ","時"],M:["どうやって","様子"],R:["なぜ","理由"],F:["もし","条件"]};
export const PH={S:"名詞句",O:"名詞句",I:"名詞句",C:"補語",P:"副詞句",T:"副詞句",M:"副詞句",R:"副詞節",F:"副詞節"};
export const DET=new Set("a an the my your his her its our their this that these those some".split(" "));
export const PRON=new Set("i you he she it we they me him her us them".split(" "));
export const ADV="PTMRF";
export const AUX=new Set("can could will would shall should may might must do does did am is are was were be been being have has had".split(" "));

export const $=id=>document.getElementById(id);
/* このゲームを開いている間の環境（game.js が開くときに入れる）：root＝箱、ctx＝共通部品とのつなぎ、core＝共通部品 */
export const ENV={root:null,ctx:null,core:null,offs:[]};
export const onDoc=(t,f,o)=>{document.addEventListener(t,f,o);ENV.offs.push(()=>document.removeEventListener(t,f,o))};
/* セーブ：共通のセーブ（このゲーム専用の場所）。中身は前と同じ形（文字列） */
export const LS={getItem:k=>{const v=ENV.ctx.store.get(k);return v==null?null:v},setItem:(k,v)=>ENV.ctx.store.set(k,v),removeItem:k=>ENV.ctx.store.remove(k)};
export function setTotal(v){total=v}
export function stopVoice(){speakTok++;ENV.core.speech.stop()}
export function clearPop(){if(popEl){popEl.remove();popEl=null}}
export function nextRun(){return ++runId}
export const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
export const wait=ms=>new Promise(r=>setTimeout(r,ms));   // ゲームの時間は、動きを減らす設定でも縮めない
export const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const bare=w=>w.toLowerCase().replace(/[^a-z']/g,"");

export const settings={lvSys:"grade",myLevel:0,lvAuto:true,lvSort:"rec",lvFilter:"all",qRange:3,qChoice:3,qLang:"ja",advance:"auto",speed:4,font:"m",rdLines:1,tts:true,sound:"both",disp:"easy",mode:"one"};
export function loadSettings(){try{Object.assign(settings,JSON.parse(LS.getItem("ccs3-settings")||"{}"))}catch(e){}
settings.speed={slow:3,normal:4,fast:5}[settings.speed]||+settings.speed||4;if(!FONT[settings.font])settings.font="m";
  document.body.classList.toggle("nogram",settings.gram===false);ENV.offs.push(()=>document.body.classList.remove("nogram"))}
export function applyVisual(){
  const r=document.documentElement.style,ms=SPEED[settings.speed];
  r.setProperty("--laneFont",FONT[settings.font]+"px");
  r.setProperty("--stepDur",Math.min(170,Math.round(ms*.7))+"ms");
}

export function saveSettings(){try{LS.setItem("ccs3-settings",JSON.stringify(settings))}catch(e){}}

/* 読み上げ：共通の読み上げ（core.speech）を使う。声・速さ・ON/OFF は共通の設定（街の⚙） */
export const canSpeak="speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;
export function speakChunks(chunks){   // 区切りごとに続けて読む
  if(!canSpeak||!settings.tts)return;
  const sp=ENV.core.speech,tok=++speakTok;let i=0;
  const next=()=>{if(tok!==speakTok||i>=chunks.length)return;sp.speak(chunks[i++],{rate:.9,onend:next})};next();
}
export let speakTok=0;
/* 区切った時の音：both＝小さい効果音＋チャンクの読み上げ／voice＝読み上げだけ／sfx＝効果音だけ（テンポ重視）／off */
export let actx=null;   // 効果音は共通の音（core.sound）の「効果音」の音量でまとめて鳴らす
export function unlockAudio(){try{actx=ENV.core.sound.ctx()}catch(e){}}
export function tone(freq,dur,type,vol,slide){
  if(settings.mute||!actx)return;
  try{const t=actx.currentTime,o=actx.createOscillator(),g=actx.createGain();o.type=type||"sine";o.frequency.setValueAtTime(freq,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(freq*slide,t+dur);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g).connect(ENV.core.sound.sfxBus);o.start(t);o.stop(t+dur+.03)}catch(e){}
}
/* 音をぜんぶ消す／入れる（BGM・声・効果音・自動の読み上げ）。ほかの音の設定は、そのまま残す */
export function setMute(on){settings.mute=!!on;saveSettings();
  if(on){stopSfxVoice();try{ENV.core.speech.stop()}catch(e){}}
  else{try{unlockAudio()}catch(e){}}
  bgmTick();bgmMuteDraw();const sel=document.getElementById("optMute");if(sel)sel.value=on?"on":"off"}
export function hitSound(kind){
  const m=settings.sound;if(m==="off"||settings.mute)return;
  const miss=kind==="miss"||kind==="forgot";
  if(m==="voice"&&!miss)return;
  if(!miss){const vf={excellent:"voice/excellent",good:"voice/good",cross:"voice/nice"}[kind];if(vf){sfx(vf);return}}
  if(kind==="forgot"&&m!=="voice"){sfx("se/forgot");return}
  const v=m==="both"?.55:1;
  if(kind==="excellent"){tone(880,.07,"sine",.14*v);setTimeout(()=>tone(1320,.09,"sine",.12*v),55)}
  else if(kind==="great")tone(988,.09,"sine",.13*v);
  else if(kind==="good"||kind==="cross")tone(660,.09,"triangle",.11*v);
  else if(kind==="mini")tone(1250,.04,"triangle",.07*v);
  else tone(160,.18,"sawtooth",.06,.7);
}
export function speakChunk(text){
  if(settings.mute||!canSpeak||settings.sound==="sfx"||settings.sound==="off")return;
  speakTok++;ENV.core.speech.speak(text,{rate:1.2});
}
export function tick(){if(!settings.mute&&settings.sound==="sfx")tone(1900,.025,"square",.012)}
export function primeSpeech(){}   // 共通の読み上げが受け持つ

/* ===== 文を読み込む ===== */
export function parseSentence(str,ja){
  const units=[],words=[],unitOf=[];let who=null;
  if(str[0]==="@"){who=str[1];str=str.slice(3)}   // 「@b 」男の子／「@g 」女の子／「@o 」その他 で主語のキャラを指定できる
  str.split(" | ").forEach(us=>{
    const role=us[0];let rest=us.slice(2),note=null;
    const hi=rest.indexOf("#");if(hi>=0){note=rest.slice(hi+1).split("|");rest=rest.slice(0,hi)}
    const ei=rest.indexOf("=");const en=rest.slice(0,ei);let jp=rest.slice(ei+1),subJp=null;
    const m=jp.match(/^(.*)\{(.*)\}$/);if(m){jp=m[1];subJp=m[2].split("/")}
    const u={role,jp,note,s:words.length,subs:null};
    const parts=en.split(" / ");if(parts.length>1)u.subs=[];
    parts.forEach((p,pi)=>{let x=false;if(u.subs&&pi>0&&/^X:/i.test(p)){x=true;p=p.slice(2)}   // 「X:」で、その小さなまとまりを「つけ足し」にする
      const s=words.length;p.split(" ").forEach(w=>{words.push(w);unitOf.push(units.length)});if(u.subs)u.subs.push({s,e:words.length-1,jp:subJp?subJp[pi]||"":"",x})});
    u.e=words.length-1;u.text=words.slice(u.s,u.e+1).join(" ");units.push(u);
  });
  const sen={units,words,unitOf,ja,en:words.join(" ")};sen.who=who||guessWho(sen);return sen;
}
export const SHARE={2:[60,40],3:[40,30,30]};
export function subPts(u,pi,kind){const n=u.subs.length,sh=(SHARE[n]||[])[pi]??Math.round(100/n);return kind==="mini"?Math.min(sh,PTS.mini):sh}
export function subIsX(u,pi){return pi>0&&!!u.subs&&u.role!=="V"&&(u.subs[pi].x||"SOIC".includes(u.role))}
export function wordRole(sen,i){const u=sen.units[sen.unitOf[i]];if(u.subs){const pi=u.subs.findIndex(p=>i>=p.s&&i<=p.e);if(subIsX(u,pi))return "X"}return u.role}
/* 理想の切り方ではないが、意味のあるまとまり（▽）。1つでは意味にならない語で終わるものは×。 */
const PREPS=new Set("in on at by for with of from into onto over under about after before during through between among against around across along behind beside beyond despite except inside near off out outside past since than toward towards until up upon within without as like per via".split(" "));
const CONJS=new Set("and but or nor so yet because if when while although though unless whether that than until once".split(" "));
function lenient(sen,a,b,roles,miss){
  const ws=sen.words.slice(a,b+1),last=bare(ws[ws.length-1]);
  if(!last)return miss;
  if(DET.has(last)||PREPS.has(last)||CONJS.has(last)||last==="to")return miss;   // the / in / and / to で終わる
  if(AUX.has(last)&&b<sen.words.length-1)return miss;   // can / will で終わる
  if(ws.length===1&&DET.has(bare(ws[0])))return miss;
  if(ENV.core&&ENV.core.dict&&b<sen.words.length-1){const e=ENV.core.dict.lookup(last);   // 形容詞だけで終わり、名詞が続く（the small / town）
    if(e&&e.pos&&e.pos.length&&e.pos.every(p=>p[0]==="adj")&&/[a-z]$/i.test(sen.words[b])&&!/^[A-Z]/.test(sen.words[b+1]||""))return miss}
  return {kind:"cross",easy:"意味のまとまり",gram:"意味のまとまり（役割をまたぐ）",jp:"",roles};
}
export function isMini(role,ws){
  if(ws.length===1)return true;
  return ws.length===2&&"SOIC".includes(role)&&DET.has(bare(ws[0]));
}
/* 小さいまとまり（1語・冠詞＋名詞）：かんたん表示は役割の言葉、文法表示は品詞の名前 */
export function miniLabel(role,ws){
  const easy=RN[role][0];
  if(role==="V")return [easy,"動詞！"];
  if("SOI".includes(role))return ws.length===1&&PRON.has(bare(ws[0]))?[easy,"代名詞！"]:[easy,"名詞！"];
  if(role==="C")return [easy,"補語！"];
  return [easy,"副詞！"];
}
/* 区切ったまとまり（a〜b番目の単語）を判定する */
export function classify(sen,a,b){
  const U=sen.units,ua=sen.unitOf[a],ub=sen.unitOf[b],ws=sen.words.slice(a,b+1);
  const roles=ws.map((_,i)=>wordRole(sen,a+i));
  const miss={kind:"miss",easy:"",gram:"",jp:"",roles:null};
  if(ua===ub){
    const u=U[ua];
    if(a===u.s&&b===u.e){
      const note=u.note;
      if(isMini(u.role,ws)){const [e,g]=miniLabel(u.role,ws);return {kind:"mini",easy:e,gram:g,note,jp:u.jp,roles}}
      let easy=RN[u.role][0],gram=u.role==="V"?"動詞のまとまり":`${RN[u.role][1]}・${PH[u.role]}`;
      if(u.subs){if(u.role==="V"){easy+="（熟語＋動詞）";gram+="（熟語＋動詞）"}else if("SOIC".includes(u.role)){easy+="（ひと・もの＋説明）";gram+="（名詞＋修飾語句）"}else{easy+="（いくつかのまとまり）";gram+="（いくつかのまとまり）"}}
      return {kind:"excellent",easy,gram,note,jp:u.jp,roles};
    }
    if(u.subs&&u.role==="V"){const pi=u.subs.findIndex(p=>p.s===a&&p.e===b);   // 熟語＋動詞（managed to / finish）：熟語だけ・動詞だけで区切っても正解
      if(pi===0&&ws.length===1&&AUX.has(bare(ws[0])))return {kind:"mini",easy:"助動詞",gram:"助動詞！",jp:u.subs[0].jp,roles,pts:subPts(u,pi,"mini")};
      if(pi===0||(pi>0&&pi<u.subs.length-1))return {kind:"excellent",easy:"熟語",gram:"熟語のまとまり",jp:u.subs[pi].jp,roles,pts:subPts(u,pi)};
      if(pi>0){const k1=ws.length===1?"mini":"excellent";return {kind:k1,easy:"する",gram:ws.length===1?"動詞！":"動詞",jp:u.subs[pi].jp,roles,pts:subPts(u,pi,k1)}}}
    if(u.subs&&!"SOIC".includes(u.role)){const pi=u.subs.findIndex(p=>p.s===a&&p.e===b);   // 場所・時・理由などの中の小さなまとまり
      if(pi>=0&&subIsX(u,pi)){if(ws.length===1)return {kind:"mini",easy:"つけ足し",gram:"修飾語！",jp:u.subs[pi].jp,roles,pts:subPts(u,pi,"mini")};
        return {kind:"excellent",easy:"つけ足し（"+RN[u.role][0]+"の説明）",gram:"修飾語句（後ろから説明）",jp:u.subs[pi].jp,roles,pts:subPts(u,pi)}}
      if(pi>=0){if(ws.length===1){const [e,g]=miniLabel(u.role,ws);return {kind:"mini",easy:e,gram:g,jp:u.subs[pi].jp,roles,pts:subPts(u,pi,"mini")}}
        return {kind:"excellent",easy:RN[u.role][0]+"（まとまりの一部）",gram:(PH[u.role]||"副詞句")+"の一部",jp:u.subs[pi].jp,roles,pts:subPts(u,pi)}}}
    if(u.subs){const pi=u.subs.findIndex(p=>p.s===a&&p.e===b);
      if(pi===0){if(isMini(u.role,ws))return {kind:"mini",easy:"ひと・もの（中心）",gram:"名詞！",jp:u.subs[0].jp,roles:roles.map(()=>u.role),pts:subPts(u,0,"mini")};
        return {kind:"excellent",easy:"ひと・もの（中心）",gram:"名詞句（中心の名詞）",jp:u.subs[0].jp,roles,pts:subPts(u,0)}}
      if(pi>0)return {kind:"excellent",easy:"どんな（説明）",gram:"修飾語句（後ろから説明）",jp:u.subs[pi].jp,roles,pts:subPts(u,pi)}}
    return lenient(sen,a,b,roles,miss);
  }
  if(a!==U[ua].s||b!==U[ub].e)return lenient(sen,a,b,roles,miss);
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
export function labelText(c){
  if(settings.disp==="none")return "";
  return settings.disp==="gram"?c.gram:settings.disp==="both"&&c.gram!==c.easy?`${c.easy}／${c.gram}`:c.easy;
}
export function noteText(c){
  if(!c.note||settings.disp==="none")return "";
  const [e,g]=c.note;return settings.disp==="gram"?g:settings.disp==="both"?`${e}／${g}`:e;
}

/* ===== 文の絵（ステージ） =====
 絵はここだけで決めている。あとで画像にする時は "img/boy_face.png" のようにファイル名を書けば <img> で出る */
export const ART={
  face:{b:"👦",g:"👧",o:"🟧"}, act:{b:"🙋‍♂️",g:"🙋‍♀️",o:"🟧"}, state:{b:"🧍",g:"🧍‍♀️",o:"🟧"},
  q:"❓", sun:"☀️", moon:"🌙", place:{out:"🌳",home:"🏠",school:"🏫",town:"🏙️"}
};
export const artHTML=v=>/\.(png|jpe?g|gif|svg|webp)$/i.test(v)?`<img src="${esc(v)}" alt="">`:esc(v);
export const BOYW=new Set("he him his boy boys brother father dad uncle grandfather man ken tom leo i".split(" "));
export const GIRLW=new Set("she her girl sister mother mom aunt grandmother woman emma yuki".split(" "));
export function guessWho(sen){
  const u=sen.units.find(u=>u.role==="S");if(!u)return "o";
  const ws=sen.words.slice(u.s,u.e+1).map(bare);
  const b=ws.some(w=>BOYW.has(w)),g=ws.some(w=>GIRLW.has(w));
  return b&&!g?"b":g&&!b?"g":"o";
}
export const STATEV=new Set("is am are was were be like likes liked love loves know knows knew want wants wanted have has had belong belongs seem seems tasted tastes need needs".split(" "));
export function verbKind(sen,u){
  const ws=sen.words.slice(u.s,u.e+1).map(bare);
  if(ws.some(w=>w.endsWith("ing"))||ws.includes("to"))return "act";
  return ws.some(w=>STATEV.has(w))?"state":"act";
}
export const PLACEW={out:"park garden river beach field zoo corner gate countryside",home:"kitchen room home house car sofa",school:"school classroom library museum class",town:"station town shop mall city hospital way there front"};
export function placeKind(sen,u){
  const ws=sen.words.slice(u.s,u.e+1).map(bare);
  for(const k in PLACEW)if(PLACEW[k].split(" ").some(w=>ws.includes(w)))return k;
  return "town";
}
export let SG={k:-1};
export function stageReset(k){
  SG={k,face:false,body:null,cap:[]};
  const st=$("stage");st.className="stage";
  ["sgPlace","sgSign","sgTime","sgArt","sgCap","sgObj","sgFace"].forEach(id=>$(id).innerHTML="");
  $("sgArt").className="sgArt";$("sgHint").hidden=false;
}
export function popIn(el,big){el.animate(reduce?[{opacity:0},{opacity:1}]:[{transform:`scale(${big?.3:.6})`,opacity:0},{transform:"scale(1.12)",opacity:1,offset:.6},{transform:"scale(1)",opacity:1}],{duration:380,easing:"ease-out"})}
/* 何を・いつ・どこで などは、まず真ん中に大きく出してから定位置へ */
export function fly(text,cls){
  const el=document.createElement("div");el.className="sgFly "+cls;el.textContent=text;$("stage").append(el);
  el.animate(reduce?[{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.7},{opacity:0}]:[{transform:"translate(-50%,-50%) scale(.4)",opacity:0},{transform:"translate(-50%,-50%) scale(1.15)",opacity:1,offset:.2},{transform:"translate(-50%,-50%) scale(1)",opacity:1,offset:.65},{transform:"translate(-50%,-90%) scale(.8)",opacity:0}],{duration:900,easing:"ease-out"}).onfinish=()=>el.remove();
}
export function stageOnChunk(k,sen,c){
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
export function drawChar(anim){
  const who=S.sens[S.seq[SG.k]].who,a=$("sgArt");
  if(SG.body){a.innerHTML=artHTML(ART[SG.body][who]);a.className="sgArt body";$("sgFace").innerHTML=SG.face?artHTML(ART.face[who]):""}
  else if(SG.face){a.innerHTML=artHTML(ART.face[who]);a.className="sgArt"}
  $("sgCap").textContent=SG.cap.filter(Boolean).join(" ");
  if(anim)popIn(a,true);
}
export function stageDone(){const d=$("sgDone");d.animate(reduce?[{opacity:0},{opacity:1},{opacity:1},{opacity:0}]:[{opacity:0,transform:"translate(-50%,-50%) scale(.5)"},{opacity:1,transform:"translate(-50%,-50%) scale(1.15)",offset:.2},{opacity:1,transform:"translate(-50%,-50%) scale(1)",offset:.8},{opacity:0}],{duration:1400})}

/* 確認・お知らせの小窓（claude.ai の画面ではブラウザ標準の confirm/alert が出ないので、ページ内に出す） */
export function ask(msg,yes="OK",no="やめる"){
  return new Promise(res=>{const box=$("askBox");$("askMsg").textContent=msg;$("askYes").textContent=yes;
    $("askNo").textContent=no||"";$("askNo").hidden=!no;box.hidden=false;
    const done=v=>{box.hidden=true;$("askYes").onclick=$("askNo").onclick=null;res(v)};
    $("askYes").onclick=()=>done(true);$("askNo").onclick=()=>done(false);});
}
export const tell=msg=>ask(msg,"OK",null);
export function toast(msg){const el=document.createElement("div");el.className="toast";el.textContent=msg;ENV.root.append(el);
  el.animate([{opacity:0,transform:"translate(-50%,-10px)"},{opacity:1,transform:"translate(-50%,0)",offset:.12},{opacity:1,offset:.8},{opacity:0}],{duration:2000,easing:"ease-out"}).onfinish=()=>el.remove()}

/* ===== 難易度（10段階）。表示は 学年／英検／TOEIC／CEFR から選ぶ。未設定＝全レベル対象 =====
 対応は目安：英検 1級C1・準1級B2・2級B1・準2級A2・3級A1、TOEIC L&R A1 120〜・A2 225〜・B1 500〜・B2 785〜・C1 945〜 */
export const LV=[null,
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
export const LVSYS={grade:"学年",eiken:"英検",toeic:"TOEIC",cefr:"CEFR"};
export function lvLabel(n,sys){
  if(!n)return "未設定（全レベル）";const L=LV[n];sys=sys||settings.lvSys||"grade";
  const v=sys==="eiken"?`英検${L.e}`:sys==="toeic"?(L.t?`TOEIC ${L.t}`:`TOEIC対象外（${L.g}）`):sys==="cefr"?`CEFR ${L.c}`:L.g;
  return `Lv${n} ${v}`;
}
export const LVGROUP={all:["すべて",1,10],rec:["おすすめだけ",0,0],ele:["小学生",1,2],jh:["中学",3,5],hs:["高校",6,7],univ:["大学以上",8,10]};
export function isRec(lv){const m=+settings.myLevel||0;return !lv||!m||Math.abs(lv-m)<=1}
export function baseForm(w){w=w.toLowerCase().replace(/[^a-z']/g,"").replace(/'s$/,"");
  if(COMMON.has(w))return w;
  for(const [a,b] of [["ies","y"],["ied","y"],["es",""],["s",""],["ed",""],["ed","e"],["ing",""],["ing","e"],["er",""],["est",""],["ly",""]])
    if(w.endsWith(a)&&COMMON.has(w.slice(0,-a.length)+b))return w.slice(0,-a.length)+b;
  return w;
}
export function estimateLevel(sents){
  const all=sents.flatMap(s=>s.words);if(!all.length)return null;
  const avg=all.length/sents.length;
  const cont=all.filter(w=>/^[a-z]/.test(w)&&/[a-z]/.test(w));   // 大文字で始まる語（名前・文頭）は数えない
  const rare=cont.filter(w=>{const b=baseForm(w);return b.length>2&&!COMMON.has(b)}).length/Math.max(1,cont.length);
  const sc=0.8+Math.max(0,avg-3)*0.32+rare*10;
  return Math.max(1,Math.min(10,Math.round(sc)));
}
/* 答え合わせの結果で、おすすめのレベルを自動で上下させる（2回続けて9割以上→上、5割未満→下） */
export function adaptLevel(ratio,lv){
  if(settings.lvAuto===false||!settings.myLevel)return "";
  const m=+settings.myLevel;settings.lvUp=settings.lvUp||0;settings.lvDown=settings.lvDown||0;
  if(ratio>=.9&&(!lv||lv>=m)){settings.lvUp++;settings.lvDown=0}else if(ratio<.5){settings.lvDown++;settings.lvUp=0}else{settings.lvUp=0;settings.lvDown=0}
  let msg="";
  if(settings.lvUp>=2&&m<10){settings.myLevel=m+1;settings.lvUp=0;msg=`レベルアップ！おすすめを ${lvLabel(m+1)} にしました`}
  if(settings.lvDown>=2&&m>1){settings.myLevel=m-1;settings.lvDown=0;msg=`おすすめを ${lvLabel(m-1)} にしました`}
  saveSettings();return msg;
}

/* ===== 状態 ===== */
export let S=null,total=0,runId=0;
export const stageN={one:0,cont:0};
export function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/* ===== ランダム：レベルで絞って、最近出た文はなるべく避ける =====
 内蔵の文はランクがないので、分類で決める（すべて中学レベル） */
export const TIER_LV={"基本の順番":3,"動詞のまとまり":4,"熟語のまとまり":4,"長い主語・節":5};
export const RECENTKEY="ccs-recent",RECENT_MAX=80;
export function loadRecent(){try{return JSON.parse(LS.getItem(RECENTKEY)||"[]")}catch(e){return []}}
export function addRecent(keys){try{const r=loadRecent().filter(k=>!keys.includes(k)).concat(keys).slice(-RECENT_MAX);LS.setItem(RECENTKEY,JSON.stringify(r))}catch(e){}}
/* いま出す文のレベル：{target, near}。target なし＝全部 */
export function randTarget(){
  const p=settings.randLv||"auto";
  if(p==="all")return {target:0};
  if(p==="auto")return +settings.myLevel?{target:+settings.myLevel,near:true}:{target:0};
  return {target:+p};
}
export function randLabel(){
  const {target,near}=randTarget();
  if(!target)return "すべてのレベル";
  return near?`${lvLabel(target)} の前後`:lvLabel(target);
}
/* レベルで絞る。ぴったりが無ければ前後1つ、それも無ければ全部 */
export function byLevel(items,lvOf){
  const {target,near}=randTarget();if(!target)return items;
  const within=d=>items.filter(it=>{const l=lvOf(it);return !l||Math.abs(l-target)<=d});
  const a=within(near?1:0);if(a.some(it=>lvOf(it)))return a;
  const b=within(1);if(b.some(it=>lvOf(it)))return b;
  return items;
}
export function randomPool(){
  const seen=new Set(),out=[];
  const push=(s,ja,lv)=>{if(!seen.has(s)){seen.add(s);out.push({s,ja,lv})}};
  ONE_TIERS.forEach(t=>t.list.forEach(([s,ja])=>push(s,ja,TIER_LV[t.name]||null)));
  shortsAll().forEach(x=>push(x.s,x.ja,x.lv));
  return out;
}
export function pickRandom(n){
  const pool=byLevel(randomPool(),x=>x.lv),recent=new Set(loadRecent());
  const fresh=shuffle(pool.filter(x=>!recent.has(x.s))),old=shuffle(pool.filter(x=>recent.has(x.s)));
  const pick=fresh.concat(old).slice(0,n);addRecent(pick.map(x=>x.s));
  return pick.map(x=>[x.s,x.ja]);
}
export function buildStage(mode,n,same){
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
export function loadStage(mode,n,same,autoStart){
  const info=buildStage(mode,n,same);
  S={...info,sens:info.list.map(([en,ja])=>parseSentence(en,ja)),si:0,results:[],phase:"ready",gained:0,paused:false,timer:null,elapsed:0,sentStart:0};
  $("stageText").textContent=info.short;$("hist").innerHTML="";$("line").innerHTML="";
  setupSeq();updateProg();renderPreview();renderLane(true);applyAdvanceUI();
  if(autoStart)countdown(++runId);else showStart(++runId);
}
/* レーンに流す文の並び（一文モード＝1文、連続モード＝お話全部） */
export function setupSeq(){
  const seq=S.mode==="one"?[S.si]:S.sens.map((_,i)=>i);
  S.seq=seq;S.flat=[];S.starts=[];
  seq.forEach((si,k)=>{S.starts.push(S.flat.length);S.sens[si].words.forEach((t,li)=>S.flat.push({t,k,li,si}))});
  S.passed=0;S.combo=0;S.cuts=new Map();S.lastCut=-1;S.finishing=false;S.queuedCut=false;S.lastStepAt=0;S.nextStepAt=0;S.chunks=seq.map(()=>[]);S.closed=seq.map(()=>false);S.openK=0;
  stageReset(0);
}
export const endOf=k=>k+1<S.starts.length?S.starts[k+1]-1:S.flat.length-1;
export function updateProg(){
  const n=S.sens.length,i=S.mode==="one"?S.si:S.openK;
  $("progText").textContent=S.timed?`${i+1}文目`:`${Math.min(i+1,n)}/${n}`;
}
export function addScore(n){S.gained+=n;total+=n;$("score").textContent=total}
export function renderPreview(){
  const pv=$("preview");
  const nx=S.mode==="one"&&S.phase!=="ready"?S.sens[S.si+1]:null;
  pv.innerHTML=nx?`<div class="pvStrip" style="left:${lineX()+2}px">${nx.words.map(w=>`<span class="w">${esc(w)}</span>`).join("")}</div>`:"";
}

export function showStart(run){
  $("startTitle").textContent=S.mode==="one"?`${S.title}（${S.sens.length}文）`:S.title;
  $("startNote").innerHTML=S.mode==="one"
    ?"英文が右から1語ずつ流れてくる。<br>意味のまとまりだと思ったら「チャンク！」。<br>文の終わり（■の手前）もチャンク！"
    :`${S.sens.length}文のお話が止まらずに流れてくる。<br>文の終わり（■の手前）も必ず区切る。`;
  $("startNote").innerHTML+=`<br><small>${manual()?"自分で送る（▶で進む）":`速さ ${settings.speed}「${SPEED_NAME[settings.speed]}」`}・文字 ${FONT_NAME[settings.font]}（右上の設定で変更）</small>`;
  $("startBox").hidden=false;
  $("startBtn").onclick=()=>{$("startBox").hidden=true;primeSpeech();unlockAudio();countdown(run)};
}
export async function runCount(run,seq,quick){
  const c=$("count");c.classList.toggle("quick",!!quick);c.hidden=false;
  for(const [t,cls,ms] of seq){
    if(run!==runId){c.hidden=true;return false}
    c.innerHTML=`<span class="${cls}" style="animation-duration:${ms}ms">${t}</span>`;await wait(ms);
  }
  c.hidden=true;return run===runId;
}
export async function countdown(run){
  if(!await runCount(run,[["Ready...","small",1200],["3","",850],["2","",850],["1","",850],["GO!","go",650]]))return;
  sfx("voice/chunk");
  S.phase="play";renderPreview();step();
}

/* ===== レーン ===== */
export const KEEP_LEFT=2;
export function lineX(){return Math.round($("laneWrap").clientWidth*0.34)}
export function chunkAt(g){const f=S.flat[g];if(!f)return null;return S.chunks[f.k].find(c=>f.li>=c.a&&f.li<=c.b)||null}
export function renderLane(noAnim){
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
export const canBack=()=>!!(S&&S.phase==="play"&&!S.paused&&manual()&&settings.backBtn&&!S.timed&&S.passed>S.lastCut+1);
export function back(n){
  if(!canBack())return;
  const to=Math.max(S.lastCut+1,S.passed-n);if(to===S.passed)return;
  S.passed=to;renderLane(true);renderLine();
}
export function updateBackBtn(){
  const b=$("backBtn");if(!b)return;const on=!!(settings.backBtn&&!(S&&S.timed));
  b.disabled=!(on&&canBack());
  b.setAttribute("aria-label",on?"1語もどる（区切った所より前には戻れない）":"戻る（設定で「使う」にすると使えます）");
}
/* 上の行：今の文の判定済みチャンク＋流れ出た単語 */
export function blockHTML(sen,c){
  const words=sen.words.slice(c.a,c.b+1).map((w,i)=>`<span class="w${c.roles?" r"+c.roles[i]:""}">${esc(w)}</span>`).join(" ");
  const lab=labelText(c),nt=noteText(c);
  return `<span class="blk k-${c.kind}"><span class="bw"><span class="mk k-${c.kind}">${RANK[c.kind][1]}</span>${words}</span>`
    +(lab?`<span class="bl">${esc(lab)}${nt?`<br>${esc(nt)}`:""}</span>`:"")
    +(c.jp&&c.kind!=="miss"&&c.kind!=="forgot"?`<span class="bj">${esc(c.jp)}</span>`:"")+`</span>`;
}
export function renderLine(){
  const k=S.openK;if(k>=S.seq.length){$("line").innerHTML="";return}
  const sen=S.sens[S.seq[k]],outEnd=S.passed-KEEP_LEFT-1;
  let html=S.chunks[k].map(c=>blockHTML(sen,c)).join("");
  const from=S.lastCut+1,to=Math.min(outEnd,endOf(k));
  if(to>=from)html+=`<span class="pend">${S.flat.slice(from,to+1).map(f=>esc(f.t)).join(" ")}</span>`;
  $("line").innerHTML=html;
}
/* タイミングの猶予：少し遅れて押したら1つ前のすき間、少し早く押したら次のすき間で切ったことにする */
export const late=()=>Math.min(260,SPEED[settings.speed]*.35),early=()=>Math.min(160,SPEED[settings.speed]*.2);
export const RANKV={miss:0,forgot:0,cross:1,good:1,mini:2,great:3,excellent:3};
export function gapRank(gb){
  const ga=S.lastCut+1;if(gb<ga||gb>=S.flat.length)return -1;
  const fa=S.flat[ga],fb=S.flat[gb];if(fa.k!==fb.k)return -1;
  return RANKV[classify(S.sens[S.seq[fa.k]],fa.li,fb.li).kind];
}
export const manual=()=>settings.advance==="manual";
/* 1語進める（自動でも手動でも共通） */
export function advance(){
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
export function step(){
  clearTimeout(S.timer);if(S.phase!=="play"||S.paused||manual())return;
  if(advance()){
    renderLane();renderLine();tick();
    if(S.queuedCut){S.queuedCut=false;cut()}
    S.timer=setTimeout(step,SPEED[settings.speed]);
  }else finishSeq();
}
/* 自分で送る：▶ で1語、バーのドラッグで一気に（戻れない） */
export function fwd(n){
  if(!S||S.phase!=="play"||S.paused||!manual())return;
  $("rolePick").hidden=true;
  if(S.passed>=S.flat.length){finishSeq();return}
  let moved=false;for(let i=0;i<n&&S.passed<S.flat.length;i++)moved=advance()||moved;
  if(moved){renderLane(n>1);renderLine();tick()}
}
export function syncScrub(){const sc=$("scrub");if(!S)return;sc.max=S.flat.length;sc.value=S.passed}
export function setCutLabel(){
  const game=!(S&&S.studyMode);const b=$("cutBtn");if(b&&b.childNodes[0])b.childNodes[0].nodeValue=game?"チャンク！":"区切る";
  $("cutline").dataset.lbl=game?"ここでチャンク":"ここで区切る";
}
export function applyAdvanceUI(){
  setCutLabel();
  const m=manual();$("navBtns").hidden=!m;$("scrub").hidden=!m;$("timeText").hidden=!m;
  const g=!(S&&S.studyMode);
  $("cutHint").textContent=m?(g?"▶で進む。ここから下のどこをタップしてもチャンク！":"▶で進む。ここから下のどこでも区切れる"):(g?"ここから下なら、どこをタップしてもチャンク！":"ここから下なら、どこをタップしても区切れる");
}
/* ===== 区切る：区切った瞬間にそのまとまりを判定 ===== */
export function cut(){
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
export function judgeChunk(ga,gb,forced){
  const f=S.flat[ga],k=f.k,sen=S.sens[S.seq[k]];
  let c=classify(sen,f.li,S.flat[gb].li);
  if(forced)c={...c,kind:"forgot",roles:null};
  c={...c,a:f.li,b:S.flat[gb].li};
  S.chunks[k].push(c);S.lastCut=gb;
  const base=c.pts??PTS[c.kind];
  if(c.kind==="excellent"||c.kind==="great")S.combo=(S.combo||0)+1;else if(c.kind==="miss"||c.kind==="forgot")S.combo=0;
  const mult=(c.kind==="excellent"||c.kind==="great")?Math.min(1.5,1+.1*Math.floor((S.combo||0)/3)):1;
  c.base=base;c.gain=Math.round(base*mult);c.combo=S.combo||0;c.mult=mult;
  if((c.kind==="excellent"||c.kind==="great")&&c.combo>0&&c.combo%3===0)setTimeout(()=>sfx(c.combo>=9?"voice/wow":"voice/combo"),90);
  S.chunks[k][S.chunks[k].length-1]=c;addScore(c.gain);
  hitSound(c.kind);if(c.kind==="mini"){const pv={"動詞！":"voice/verb","名詞！":"voice/noun","副詞！":"voice/adverb"}[c.gram];sfx(pv||"voice/yes")}stageOnChunk(k,sen,c);
  if(c.kind==="excellent"||c.kind==="great")speakChunk(sen.words.slice(c.a,c.b+1).join(" "));
  showPop(c);burst(c);
  document.dispatchEvent(new CustomEvent("cc:judge",{detail:{kind:c.kind,roles:c.roles}}));   // アバターなどが反応できるように
  if(S.roleMode&&!forced)askRole(c);
  return c;
}
export function forceClose(k){
  const e=endOf(k);
  if(S.lastCut<e){judgeChunk(S.lastCut+1,e,true);S.cuts.set(e,"forced")}
  closeSentence(k);
}
/* 区切った瞬間：線から輪っかと色の粒がはじける */
export const KIND_COLOR={excellent:"#5fd49a",great:"#7cc4ff",good:"#ffd166",cross:"#e0b3ff",mini:"#c3cfdf",miss:"#ff6b6b",forgot:"#ff6b6b"};
export const ROLE_COLOR={S:"#7cc4ff",V:"#ff8f8f",O:"#8ee6a8",I:"#6fe0d8",C:"#ffb870",P:"#d6a8ff",T:"#ffd166",M:"#e6ecf5",R:"#e6ecf5",F:"#e6ecf5",X:"#9fb0c6"};
export function burst(c){
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
export let popEl=null;
export function showPop(c){
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
    +(c.title?"":`<span class="pc">+${c.gain!=null?c.gain:(c.pts??PTS[c.kind])}${c.mult>1?` ×${c.mult.toFixed(1)}`:""}</span>`)+(c.combo>=3&&(c.kind==="excellent"||c.kind==="great")?`<span class="pl2">COMBO ${c.combo}</span>`:"");
  const x=Math.min(Math.max(r.left+lineX(),r.left+110),r.right-110);
  el.style.left=x+"px";el.style.bottom=(innerHeight-r.top+8)+"px";
  ENV.root.append(el);popEl=el;setTimeout(()=>{el.remove();if(popEl===el)popEl=null},1500);
}

/* ===== 文が終わったとき：主語・動詞・目的語ボーナス ===== */
export function closeSentence(k){
  if(S.closed[k])return;S.closed[k]=true;
  const sen=S.sens[S.seq[k]],chunks=S.chunks[k],bonus=[];
  sen.units.forEach(u=>{
    if(!"SVO".includes(u.role))return;
    if(chunks.some(c=>c.a===u.s&&c.b===u.e&&c.kind!=="forgot"))bonus.push({role:u.role,name:{S:"主語",V:"動詞",O:"目的語"}[u.role]+"ボーナス"});
  });
  const perfect=chunks.every(c=>c.kind!=="miss"&&c.kind!=="forgot"&&c.kind!=="good"&&c.kind!=="cross");
  let time=null,tb=0;
  if(manual()&&!S.timed){time=(S.elapsed-S.sentStart)/1000;S.sentStart=S.elapsed;tb=Math.max(0,Math.round((sen.words.length*1.2-time)*20))}
  const extra=bonus.length*BONUS+(perfect?chunks.reduce((a,c)=>a+(c.base!=null?c.base:(c.pts??PTS[c.kind])),0):0)+tb;if(extra)addScore(extra);
  const pts=chunks.reduce((a,c)=>a+(c.gain!=null?c.gain:(c.pts??PTS[c.kind])),0)+extra;
  const r={chunks:[...chunks],bonus,pts,perfect,time,tb};S.results[S.seq[k]]=r;
  {setTimeout(()=>sfx(perfect?"voice/perfect":"se/sentence_clear"),260);if(perfect)setTimeout(()=>sfx("voice/wow"),1250);if(bonus.length)setTimeout(()=>sfx("se/bonus"),560)}
  if(perfect)stageDone();
  document.dispatchEvent(new CustomEvent("cc:sentence",{detail:{perfect,pts}}));
  const html=judgedHTML(sen,r);
  if(S.mode==="cont"){pushHist(html);S.openK=k+1;updateProg()}
  return html;
}
export function judgedHTML(sen,r){
  return r.chunks.map(c=>`<span class="mk k-${c.kind}">${RANK[c.kind][1]}</span>`+sen.words.slice(c.a,c.b+1).map((w,i)=>`<span class="w${c.roles?" r"+c.roles[i]:""}">${esc(w)}</span>`).join(" ")).join('<span class="cutmark">｜</span>')
    +`<span class="pts">+${r.pts}${r.perfect?" PERFECT":""}</span>`
    +(r.bonus.length||r.time!=null?"<br>":"")+r.bonus.map(b=>`<span class="bonus r${b.role}">${b.name} +${BONUS}</span>`).join("")
    +(r.time!=null?`<span class="tBonus">⏱ ${r.time.toFixed(1)}秒${r.tb?` タイムボーナス +${r.tb}`:""}</span>`:"");
}
export function pushHist(html){
  const h=document.createElement("div");h.className="hist newest";h.innerHTML=html;
  [...$("hist").children].forEach(c=>c.classList.remove("newest"));$("hist").append(h);
  h.animate(reduce?[{opacity:0},{opacity:.85}]:[{transform:"translateY(30px)",opacity:0},{transform:"none",opacity:.85}],{duration:400,easing:"ease-out"});
  while($("hist").children.length>2)$("hist").firstChild.remove();
}
/* レーンの最後の単語まで流れた：最後のまとまりは自動で判定 */
export async function finishSeq(){
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
export function legendHTML(){return `<div class="legend">${"SVOICPTM".split("").map(r=>`<span class="r${r}">■${RN[r][0]}</span>`).join("")}<span class="rX">■説明</span></div>`}
export function review(){
  sfx("voice/stage_clear");
  const all=S.results.flatMap(r=>r?r.chunks:[]),cnt=k=>all.filter(c=>c.kind===k||(k==="miss"&&c.kind==="forgot")).length;
  const refHTML=sen=>`<div class="roles">${sen.units.map(u=>`<span class="rcell"><span class="rtx">${u.subs?u.subs.map((p,pi)=>`<span class="r${subIsX(u,pi)?"X":u.role}">${esc(sen.words.slice(p.s,p.e+1).join(" "))}</span>`).join(" "):`<span class="r${u.role}">${esc(u.text)}</span>`}</span><span class="rl r${u.role}">${RN[u.role][settings.disp==="gram"?1:0]}</span></span>`).join('<span class="cutmark">｜</span>')}</div>`;
  openSheet(`<h2>${esc(S.title)} クリア！</h2>
    ${S.roleMode&&S.roleN?`<div class="note">役割：${S.roleOk} / ${S.roleN} 正解</div>`:""}
    <div class="big">${S.gained} pt${manual()?`<span style="font-size:16px;color:var(--muted);margin-left:10px">⏱ ${(S.elapsed/1000).toFixed(1)}秒</span>`:""}</div>
    <div class="stats">${[["excellent","◎"],["great","◯"],["good","△"],["cross","▽"],["mini","・"],["miss","×"]].map(([k,m])=>`<div class="stat"><span class="mk k-${k}">${m}</span><b>${cnt(k)}</b></div>`).join("")}</div>
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

export let sheetClosable=true;
export function openSheet(html,closable=true){if($("modal").hidden)sfx("se/open");sheetClosable=closable;if(S){S.paused=true;clearTimeout(S.timer)}$("sheet").innerHTML=html;$("modal").hidden=false}
export function closeSheet(){if(!$("modal").hidden)sfx("se/close");$("modal").hidden=true;if(S){S.paused=false;if(S.phase==="play")S.timer=setTimeout(step,SPEED[settings.speed])}}

export const opt=(id,cur,list)=>`<select id="${id}">${list.map(([v,l])=>`<option value="${v}" ${v===cur?"selected":""}>${l}</option>`).join("")}</select>`;
export function settingRows(){return `
    <div class="row"><label for="optSpeed">単語が入ってくる速さ（自動の時）</label>${opt("optSpeed",String(settings.speed),Object.keys(SPEED).map(k=>[k,`${k}　${SPEED_NAME[k]}`]))}</div>
    <div class="row"><label for="optFont">流れる文字の大きさ</label>${opt("optFont",settings.font,Object.keys(FONT).map(k=>[k,FONT_NAME[k]]))}</div>
    <div class="row"><label for="optDisp">チャンクの説明</label>${opt("optDisp",settings.disp,[["easy","かんたん（する＋何を）"],["gram","文法（動詞＋目的語）"],["both","両方"],["none","色だけ"]])}</div>
    <div class="row"><label for="optVoice">声・読み上げ</label>${opt("optVoice",(settings.sound==="both"||settings.sound==="voice")?"on":"off",[["on","オン"],["off","オフ"]])}</div>
    <div class="row"><label for="optSe">効果音</label>${opt("optSe",(settings.sound==="both"||settings.sound==="sfx")?"on":"off",[["on","オン"],["off","オフ"]])}</div>
    <div class="row"><label for="optBgm">BGM</label>${opt("optBgm",settings.bgm||"low",[["low","小さめ"],["mid","ふつう"],["off","なし"]])}</div>
    <div class="row"><label for="optMute">音をぜんぶ消す（左はしの 🎵 と同じ）</label>${opt("optMute",settings.mute?"on":"off",[["off","消さない"],["on","消す"]])}</div>
    <div class="row"><label for="optGram">チュートリアルの文法用語（カードに小さく併記）</label>${opt("optGram",settings.gram===false?"off":"on",[["on","出す"],["off","出さない"]])}</div>
    <div class="row"><label for="optMyRank">自分のランク</label>${opt("optMyRank",String(settings.myLevel||0),[["0","未登録"],...LV.slice(1).map((_,i)=>[String(i+1),lvLabel(i+1)])])}</div>
    <div class="row"><label for="optRandLv">ランダムで出す文</label>${opt("optRandLv",settings.randLv||"auto",[["auto","おまかせ（自分のランクの前後）"],["all","すべてのレベル"],...LV.slice(1).map((_,i)=>[String(i+1),lvLabel(i+1)+" だけ"])])}</div>
    <div class="row"><label for="optBack">1語もどるボタン（自分で送るとき）</label>${opt("optBack",settings.backBtn?"on":"off",[["off","使わない"],["on","使う"]])}</div>
    <div class="row"><label for="optTts">振り返りの読み上げ</label>${opt("optTts",settings.tts?"on":"off",[["on","オン"],["off","オフ"]])}</div>`}
export function bindSettingRows(){
  $("optBack").onchange=e=>{settings.backBtn=e.target.value==="on";saveSettings();updateBackBtn()};
  $("optMyRank").onchange=e=>{settings.myLevel=+e.target.value;settings.lvUp=settings.lvDown=0;saveSettings();updateLvHint()};
  $("optRandLv").onchange=e=>{settings.randLv=e.target.value;saveSettings();updateLvHint()};
  $("optSpeed").onchange=e=>{settings.speed=+e.target.value;saveSettings();applyVisual()};
  $("optFont").onchange=e=>{settings.font=e.target.value;saveSettings();applyVisual();if(S){renderLane(true);renderPreview()}};
  $("optDisp").onchange=e=>{settings.disp=e.target.value;saveSettings();if(S)renderLine()};
  $("optTts").onchange=e=>{settings.tts=e.target.value==="on";saveSettings()};
  $("optBgm").onchange=e=>{settings.bgm=e.target.value;saveSettings();unlockAudio();bgmTick()};
  const sndSet=()=>{const v=$("optVoice").value==="on",e=$("optSe").value==="on";settings.sound=v&&e?"both":v?"voice":e?"sfx":"off";saveSettings();unlockAudio()};
  $("optVoice").onchange=()=>{sndSet();hitSound("excellent")};
  $("optSe").onchange=()=>{sndSet();sfx("se/sentence_clear")};
  $("optMute").onchange=e=>{setMute(e.target.value==="on")};
  $("optGram").onchange=e=>{settings.gram=e.target.value==="on";saveSettings();document.body.classList.toggle("nogram",settings.gram===false)};
}

export function startPractice(t){
  settings.advance="manual";saveSettings();
  const list=t?myToStory(t).list:pickRandom(PER_STAGE);
  loadStage("one",4,list.length>PER_STAGE?shuffle(list).slice(0,PER_STAGE):list,true);
  S.title=t?`Chunk Practice「${t.title||"無題"}」`:"Chunk Practice";S.short="Practice";$("stageText").textContent="Practice";
  S.roleMode=settings.roleAns!==false;S.studyMode=true;applyAdvanceUI();
}
export function startShortPractice(items,title){
  settings.advance="manual";saveSettings();
  const list=shuffle(items).slice(0,PER_STAGE).map(x=>[x.s,x.ja]);
  loadStage("one",4,list,true);
  S.title=`Chunk Practice「${title}」`;S.short="Practice";$("stageText").textContent="Practice";
  S.roleMode=settings.roleAns!==false;S.studyMode=true;applyAdvanceUI();
}
/* 自分で送るモードの操作 */

/* タイム（自分で送るモード）：遊んでいる間だけ進む */
export let lastTick=performance.now(),tickTimer=null;

/* ===== Chunk Practice：切ったチャンクの役割を答える ===== */
export const RG={S:"S",V:"V",O:"O",I:"O",C:"C",P:"P",T:"T",M:"M",R:"M",F:"M",X:"M"};
export const RGN={S:"Subject",V:"Verb",O:"Object",C:"Complement",P:"Place",T:"Time",M:"Other"};
export function expectedRoles(c){
  if(!c.roles)return null;
  if(c.kind==="good")return new Set(["S","V"]);
  if(c.roles[0]==="V")return new Set(["V"]);
  if(c.roles.every(r=>"PTMRF".includes(r)))return new Set(c.roles.map(r=>RG[r]));
  return new Set([RG[c.roles[0]]]);
}
export function askRole(c){
  const exp=expectedRoles(c);if(!exp)return;
  const el=$("rolePick"),r=$("laneWrap").getBoundingClientRect();
  el.innerHTML=Object.keys(RGN).map(k=>`<button data-r="${k}" class="r${k}">${RGN[k]}</button>`).join("");
  el.style.left=(r.left+r.width/2)+"px";el.style.top=(r.bottom+6)+"px";el.hidden=false;
  el.querySelectorAll("button").forEach(b=>{
    b.addEventListener("pointerdown",e=>e.stopPropagation());
    b.onclick=()=>{
      const ok=exp.has(b.dataset.r);S.roleN=(S.roleN||0)+1;if(ok){S.roleOk=(S.roleOk||0)+1;addScore(50)}
      hitSound(ok?"great":"miss");el.hidden=true;
      showPop({kind:ok?"excellent":"miss",easy:ok?"役割も正解 +50":`正解：${[...exp].map(x=>RGN[x]).join(" / ")}`,gram:"",jp:"",roles:null,title:`${RGN[b.dataset.r]} ${ok?"✓":"✗"}`});
    };
  });
}

/* 開くたびに動かすこと（画面のボタンをつなぐ など）。game.js が呼ぶ */
export function init_engine(){
  applyVisual();
  $("tapZone").addEventListener("pointerdown",e=>{e.preventDefault();unlockAudio();cut()});
  onDoc("keydown",e=>{
    const tg=e.target&&e.target.tagName;if(tg==="INPUT"||tg==="TEXTAREA"||tg==="SELECT"||e.target.isContentEditable)return;   // 入力欄では文字入力を優先
    if(!$("edView").hidden)return;
    if(!$("modal").hidden||!$("startBox").hidden||!$("title").hidden)return;
    if(e.key===" "||e.key==="Enter"){e.preventDefault();cut()}
    else if(e.key==="ArrowRight"){e.preventDefault();fwd(1)}
    else if(e.key==="ArrowLeft"){e.preventDefault();back(1)}
  });
  $("modal").addEventListener("click",e=>{if(e.target.id==="modal"&&sheetClosable)closeSheet()});
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
  tickTimer=setInterval(()=>{const now=performance.now(),dt=now-lastTick;lastTick=now;
    if(S&&manual()&&S.phase==="play"&&!S.paused){S.elapsed+=dt;
      if(S.timed){$("timeText").textContent="残り "+Math.max(0,(S.timed.limit-S.elapsed)/1000).toFixed(1);{const rs=Math.ceil((S.timed.limit-S.elapsed)/1000);if(rs<=5&&rs>=1&&S.lastCount!==rs){S.lastCount=rs;sfx("se/count5")}}if(S.elapsed>=S.timed.limit)timedEnd()}
      else $("timeText").textContent="⏱ "+(S.elapsed/1000).toFixed(1)}},100);
  ENV.offs.push(()=>clearInterval(tickTimer));
}
