"use strict";
const $=id=>document.getElementById(id);
const rnd=n=>Math.floor(Math.random()*n);
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const LV=[null,{name:"初級",sub:"高校受験",col:"var(--lv1)"},{name:"中級",sub:"共通テスト",col:"var(--lv2)"},{name:"上級",sub:"難関大",col:"var(--lv3)"}];
const STAGES=[
 {id:1,name:"単語ダッシュ",desc:"聞こえた単語の意味を選ぶ。上は上の4択、下は下の4択",note:"読み上げを聞いて、意味をタップ！ 上下どちらからでもOK"},
 {id:2,name:"チャンクキャッチ",desc:"聞こえたチャンク（意味のかたまり）の意味を選ぶ",note:"チャンクの意味をタップ！"},
 {id:3,name:"チャンクパズル",desc:"上の日本語に合うように、欠けた1語を埋める",note:"日本語に合う1語で穴を埋めよう"},
 {id:4,name:"ロングストリーム",desc:"チャンクを順番につないで長文を完成させる",note:"順番につないで長文を完成！ 光っている側の4択で答えよう"}];
const POSJ={n:"名",v:"動",a:"形",r:"副",ph:"熟",pp:"前",cj:"接",pn:"代",ij:"間"};
const SKEY="chunkstream.v1";
let SV={best:{},seen:{},set:{nav:"girl",voice:1,rate:1,se:1,bgm:1,jp4:1},mode:"ta",lv:1};
try{const s=JSON.parse(localStorage.getItem(SKEY)||"null");if(s){SV={...SV,...s,set:{...SV.set,...(s.set||{})}}}}catch(e){}
function save(){try{localStorage.setItem(SKEY,JSON.stringify(SV))}catch(e){}}
function rec(pid,st,mode){return ((SV.best[pid]||{})[st]||{})[mode]||null}
function starsOf(pid,st){const a=rec(pid,st,"ta"),b=rec(pid,st,"rh");return Math.max(a?a.stars:0,b?b.stars:0)}
function unlocked(pid,st){return st===1||starsOf(pid,st-1)>0}
const chara=f=>`img/chara/${SV.set.nav}/${f}.webp`;

/* ================= 音 ================= */
let AC=null,MG,SEG,BGG,VOG;
function ac(){
  if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();MG=AC.createGain();MG.connect(AC.destination);
    SEG=AC.createGain();SEG.gain.value=.9;SEG.connect(MG);BGG=AC.createGain();BGG.gain.value=.55;BGG.connect(MG);VOG=AC.createGain();VOG.gain.value=1;VOG.connect(MG);loadVoices()}catch(e){AC=null}}
  if(AC&&AC.state==="suspended"&&!PAUSED)AC.resume();
  return AC;
}
function tone(f,d,type,vol,when,f2,dest){if(!AC)return;const t=when||AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(dest||SEG);o.start(t);o.stop(t+d+.02)}
let NOISE=null;function noiseBuf(){if(!NOISE){NOISE=AC.createBuffer(1,AC.sampleRate*.5,AC.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}return NOISE}
function noise(d,vol,ff,ft,when,dest){if(!AC)return;const t=when||AC.currentTime,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf();f.type=ft||"highpass";f.frequency.value=ff;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f).connect(g).connect(dest||SEG);s.start(t);s.stop(t+d+.02)}
const SE={
 tap(){tone(880,.05,"triangle",.08)},
 ok(c){if(!SV.set.se)return;const b=660*Math.pow(2,Math.min(c,14)/24);tone(b,.09,"triangle",.16);tone(b*1.5,.16,"sine",.12,AC.currentTime+.05)},
 ng(){if(!SV.set.se)return;tone(170,.18,"square",.07,0,110);tone(120,.2,"sawtooth",.04)},
 miss(){if(!SV.set.se)return;tone(400,.25,"triangle",.1,0,180)},
 merge(){if(!SV.set.se)return;noise(.18,.08,2400,"bandpass");tone(1320,.18,"sine",.06,AC.currentTime+.03)},
 count(h){if(!SV.set.se)return;tone(h?1046:523,h?.35:.12,"triangle",.16)},
 clear(){if(!SV.set.se)return;[523,659,784,1046,1318].forEach((f,i)=>tone(f,.25,"triangle",.14,AC.currentTime+i*.08))},
 star(i){if(!SV.set.se)return;tone(988*Math.pow(1.19,i),.22,"sine",.14)},
};
const VO={},VOLIST=["nice","good","excellent","perfect","combo","stage_clear","try_again","wow","yes"];
function loadVoices(){VOLIST.forEach(n=>{fetch(`audio/voice/${n}.mp3`).then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b)).then(buf=>VO[n]=buf).catch(()=>{})})}
function voice(n){if(!AC||!SV.set.se||!VO[n])return;const s=AC.createBufferSource();s.buffer=VO[n];s.connect(VOG);s.start()}

/* ---- BGM（WebAudioで鳴らすループ。リズムモードはこの拍に合わせて出題） ---- */
const BGM={on:false,bpm:120,t0:0,step:0,next:0,timer:0,style:"game",bar:0};
const PROG=[[0,4,7],[7,11,14],[9,12,16],[5,9,12]];
const mtof=m=>440*Math.pow(2,(m-69)/12);
function bgmStart(bpm,style,at){if(!ac())return;bgmStop();BGM.on=true;BGM.bpm=bpm;BGM.style=style;BGM.t0=at||AC.currentTime+.05;BGM.next=BGM.t0;BGM.step=0;BGG.gain.cancelScheduledValues(AC.currentTime);BGG.gain.setValueAtTime(SV.set.bgm?(style==="menu"?.35:.5):0,AC.currentTime);BGM.timer=setInterval(bgmTick,25);bgmTick()}
function bgmStop(){BGM.on=false;clearInterval(BGM.timer)}
function bgmTick(){if(!BGM.on||!AC)return;const sd=60/BGM.bpm/4;while(BGM.next<AC.currentTime+.15){bgmStep(BGM.step,BGM.next);BGM.next+=sd;BGM.step++}}
function bgmStep(s,t){
  const st=s%16,bar=Math.floor(s/16)%4,ch=PROG[bar],root=48+ch[0],menu=BGM.style==="menu";
  if(menu){
    if(st===0)ch.forEach(n=>tone(mtof(60+n),3.2,"sine",.035,t,0,BGG));
    if(st%4===2)tone(mtof(72+ch[(st/4|0)%3]),.5,"triangle",.045,t,0,BGG);
    if(st===0)tone(mtof(root-12),1.4,"triangle",.07,t,0,BGG);
    return}
  if(st%4===0){tone(120,.16,"sine",.5,t,45,BGG)}
  if(st===4||st===12)noise(.13,.22,1600,"bandpass",t,BGG);
  if(st%2===1)noise(.03,st%4===3?.09:.05,7000,"highpass",t,BGG);
  if(st%2===0)tone(mtof(root+(st%8===6?12:0)),.16,"triangle",.17,t,0,BGG);
  const arp=[0,1,2,1][st%4];tone(mtof(72+ch[arp]+(st>=8&&bar%2?12:0)),.11,"square",.022,t,0,BGG);
  if(st===0)ch.forEach(n=>tone(mtof(60+n),1.6,"sawtooth",.012,t,0,BGG));
}
function bgmDuck(on){if(!AC||!BGM.on||!SV.set.bgm)return;BGG.gain.setTargetAtTime(on?.22:(BGM.style==="menu"?.35:.5),AC.currentTime,.08)}

/* ---- 読み上げ（スマホ版ではネイティブTTS／音声ファイルに差し替え予定） ---- */
const TTS={v:null,id:0,pend:null,busy:false,kind:"",wd:0};
function pickVoice(){if(!window.speechSynthesis)return;const vs=speechSynthesis.getVoices();const pref=["Samantha","Google US English","Microsoft Aria","Microsoft Jenny","Karen","Daniel"];
  TTS.v=pref.map(n=>vs.find(v=>v.name.indexOf(n)===0)).find(Boolean)||vs.find(v=>v.lang==="en-US")||vs.find(v=>/^en/.test(v.lang))||null}
if(window.speechSynthesis){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
// 割り込みで読む。読み終わり（または見張りタイマー）で cb
function speak(text,cb,kind){
  const id=++TTS.id;clearTimeout(TTS.wd);TTS.pend=null;TTS.busy=true;TTS.kind=kind||"";
  const rate=[.8,1,1.2][SV.set.rate|0]||1,est=(500+text.split(/\s+/).length*380)/rate;
  let fin=false;const t0=performance.now();const done=(late)=>{if(fin)return;const el=performance.now()-t0;if(!late&&el<est*.55){fin=true;setTimeout(()=>{fin=false;done(true)},est*.55-el);return}fin=true;if(id!==TTS.id)return;clearTimeout(TTS.wd);TTS.busy=false;bgmDuck(false);cb&&cb();
    if(TTS.pend&&id===TTS.id){const p=TTS.pend;TTS.pend=null;speak(p,null,"post")}};
  if(!SV.set.voice||!window.speechSynthesis){TTS.wd=setTimeout(()=>done(true),SV.set.voice?est:200);return}
  try{speechSynthesis.cancel()}catch(e){}
  const u=new SpeechSynthesisUtterance(text);u.lang="en-US";if(TTS.v)u.voice=TTS.v;u.rate=rate;u.onend=u.onerror=()=>done();
  bgmDuck(true);speechSynthesis.speak(u);TTS.wd=setTimeout(()=>done(true),est*1.8+1500);
}
// 答えたあとの読み上げ：読み上げ中なら1つだけ予約（溜めない）
function speakAfter(text){if(TTS.busy&&TTS.kind==="post"){TTS.pend=text;return}speak(text,null,"post")}
function hush(){TTS.id++;TTS.pend=null;clearTimeout(TTS.wd);TTS.busy=false;if(window.speechSynthesis)try{speechSynthesis.cancel()}catch(e){}bgmDuck(false)}
function say(t){speak(t,null,"ui")}

/* ================= 画面 ================= */
const SCR=["sTitle","sHome","sWords","sDetail","sReader","sPlay","sResult"];
function show(id){SCR.forEach(s=>$(s).hidden=s!==id)}
let CUR=null;const P=id=>PASSAGES.find(p=>p.id===id);
function plain(c){return c.tk.map(t=>t[0]+t[1]+t[2]).join(" ")}
function fromGap(c,gs){return c.tk.slice(gs).map(t=>t[0]+t[1]+t[2]).join(" ")}
const reached=(pid,st)=>st===1||!!rec(pid,st-1,"ta");

(function(){const all=PASSAGES.flatMap(p=>p.chunks.map(plain));const pick=n=>shuf(all).slice(0,n).map((t,i)=>`<span class="${i%5===2?"h":""}">${esc(t)}</span>`).join("");
  ["rv1","rv2"].forEach(id=>{const h=pick(9);$(id).innerHTML=h+h})})();
function applyFs(){if(SV.set.spd==null)SV.set.spd=.5;if(SV.set.fs==null)SV.set.fs=1.2;document.documentElement.style.setProperty("--fs",SV.set.fs||1.2)}applyFs();
$("heroChara").src=chara("joy");
$("btnStart").onclick=()=>{goFull();ac();SE.tap();bgmStart(84,"menu");renderHome();show("sHome")};

function renderHome(){
  $("tabs").innerHTML=[1,2,3].map(l=>`<button class="tab ${SV.lv===l?"on":""}" style="--lc:${LV[l].col}" data-lv="${l}"><b>${LV[l].name}</b><small>${LV[l].sub}</small></button>`).join("");
  $("tabs").querySelectorAll(".tab").forEach(b=>b.onclick=()=>{SE.tap();SV.lv=+b.dataset.lv;save();renderHome()});
  $("plist").innerHTML=PASSAGES.filter(p=>p.lv===SV.lv).map(p=>{const wc=p.chunks.reduce((a,c)=>a+c.tk.length,0);
    return `<button class="pcard" style="--lc:${LV[p.lv].col}" data-id="${p.id}"><span class="tg">${esc(p.tag)}</span><span class="t">${esc(p.title)}</span><span class="j">${esc(p.ja)}</span>
    <span class="meta"><span class="en">${wc} words</span><span>${p.chunks.length}チャンク</span><span class="sp"></span><span class="steps4">${[1,2,3,4].map(s=>`<i class="s${starsOf(p.id,s)}"></i>`).join("")}</span></span></button>`}).join("");
  const wn=WORDS[SV.lv].length,ws=WSET[SV.lv];
  $("plist").insertAdjacentHTML("afterbegin",`<button class="pcard wcard" style="--lc:${LV[SV.lv].col}" id="btnWords"><span class="tg">単語・熟語・単語集</span><span class="t">${LV[SV.lv].name}の単語 ${wn}語</span><span class="j">${ws}語ずつ・${Math.ceil(wn/ws)}セット　聞いて、意味を選ぶ</span></button>`);
  $("btnWords").onclick=()=>{SE.tap();renderWords();show("sWords")};
  
  $("plist").querySelectorAll(".pcard[data-id]").forEach(b=>b.onclick=()=>{SE.tap();CUR=P(b.dataset.id);renderDetail();show("sDetail")});
}
function wordSet(lv,k){const n=WSET[lv],ws=WORDS[lv].slice(k*n,k*n+n);return {id:`w${lv}-${k+1}`,lv,word:true,title:`${LV[lv].name}の単語 セット${k+1}`,ja:`${ws[0][0]} 〜 ${ws[ws.length-1][0]}`,tag:`${LV[lv].name}・単語練習`,words:ws,chunks:[]}}
/* ===== 単語練習：単語（直した訳）・熟語・単語集（自分で作る／みんなの） ===== */
let WJA=null;function wja(pos){if(!WJA){WJA={};[1,2,3].forEach(l=>{WORDS[l].forEach(w=>(WJA[w[1]]=WJA[w[1]]||[]).push(w[2]));IDIOMS[l].forEach(w=>(WJA.ph=WJA.ph||[]).push(w[2]))})}return pos==="x"?WJA.n.concat(WJA.v):(WJA[pos]||WJA.n)}
function wordSet(lv,k,kind){const src=kind==="i"?IDIOMS:WORDS,n=WSET[lv],ws=src[lv].slice(k*n,k*n+n),nm=kind==="i"?"熟語":"単語";
  return {id:`${kind==="i"?"i":"w"}${lv}-${k+1}`,lv,word:true,title:`${LV[lv].name}の${nm} セット${k+1}`,ja:`${ws[0][0]} 〜 ${ws[ws.length-1][0]}`,tag:`${LV[lv].name}・${nm}練習`,words:ws,chunks:[]}}
const ULKEY="cs-wordlists",USET=20,UL_DOC_MAX=250000;
function myLists(){try{return JSON.parse(localStorage.getItem(ULKEY)||"[]")}catch(e){return []}}
function saveLists(l){try{localStorage.setItem(ULKEY,JSON.stringify(l));return true}catch(e){return false}}
const lineToW=l=>{const c=String(l).split("\t");return [c[0],c[2]||"x",c[1]||""]};
let WDB=null,WME=null,WADMIN=false,SHL=null,UCAT="";
/* 共有：チャンクチャンクの「みんなの短文」と同じしくみ（共有データベースの wordlists に 1単語集＝1ドキュメント）。使えない環境では出ない */
async function initWDB(){try{if(!window.claude||!claude.use)return;WDB=await claude.use("db");if(!WDB)return;
  const u=await claude.use("user");if(u){try{WADMIN=!!(await u.canEdit())}catch(e){}try{WME=await u.id()}catch(e){}}
  await loadSharedLists();if(!$("sWords").hidden&&SV.wtab==="u")renderWords()}catch(e){WDB=null}}
async function loadSharedLists(){if(!WDB)return;try{const sn=await WDB.collection("wordlists").get();SHL=sn.docs.map(d=>({...d.data(),id:d.id}))}catch(e){SHL=SHL||[]}}
function allLists(){const mine=myLists(),sid=new Set(mine.map(l=>l.sid).filter(Boolean));
  return mine.map(l=>({...l,mine:true})).concat((SHL||[]).filter(d=>!sid.has(d.id)).map(d=>({...d,shared:true,sid:d.id})))}
function parseWordLines(text){const ok=[],errs=[],long=[],seen=new Set();
  String(text).replace(/\r/g,"").split("\n").forEach((raw,i)=>{const l=raw.trim();if(!l||l.startsWith("#"))return;
    let m=null;for(const re of[/\t/,/\s##\s/,/\s*[=＝]\s*/,/\s*,\s*/,/[ 　]+(?=[^\x00-\x7f])/]){if(re.test(l)){const k=l.search(re),mm=l.match(re)[0];m=[l.slice(0,k),l.slice(k+mm.length).split(/\t|\s##\s/)[0]];break}}
    const cl=t=>(t||"").trim().replace(/^"(.*)"$/,"$1").trim();const en=m?cl(m[0]):"",ja=m?cl(m[1]):"";
    if(!en||!ja||!/[a-zA-Z]/.test(en)||/[^\x00-\x7f’‘“”–—]/.test(en)){errs.push(`${i+1}行目「${l.slice(0,24)}」`);return}
    const k=en.toLowerCase();if(seen.has(k))return;seen.add(k);if(ja.length>12)long.push(en);ok.push(en.replace(/\s+/g," ")+"\t"+ja)});
  return {ok,errs,long}}
function ulPlay(L,k){const ws=L.lines.map(lineToW),a=k*USET,part=ws.slice(a,a+USET);
  return {id:`u-${L.sid||L.lid}-${k+1}`,lv:+L.lv||1,word:true,title:`${L.title}（${a+1}〜${a+part.length}）`,ja:`${part[0][0]} 〜 ${part[part.length-1][0]}`,tag:`${L.cat||"単語集"}・単語練習`,words:part,chunks:[]}}
function renderWords(){const t=SV.wtab||"w",lv=SV.lv;
  $("wtabs").innerHTML=[["w","単語"],["i","熟語"],["u","単語集"]].map(([k,n])=>`<button data-t="${k}" class="${k===t?"on":""}">${n}</button>`).join("");
  $("wtabs").querySelectorAll("button").forEach(b=>b.onclick=()=>{SE.tap();SV.wtab=b.dataset.t;save();renderWords()});
  $("wtools").innerHTML="";$("wsets").classList.toggle("ul",t==="u");
  if(t==="u"){renderUL();return}
  const src=t==="i"?IDIOMS:WORDS,n=WSET[lv],m=Math.ceil(src[lv].length/n),nm=t==="i"?"熟語":"単語";
  $("wTitle").textContent=`${LV[lv].name}の${nm}練習`;
  $("wNote").textContent=t==="i"?`${LV[lv].name}によく出る熟語を${n}個ずつ。読み上げを聞いて、意味を選ぶ。`:`よく使われる順に${n}語ずつ。読み上げを聞いて、意味を選ぶ（単語ダッシュ）。`;
  $("wsets").innerHTML=Array.from({length:m},(_,k)=>{const id=`${t==="i"?"i":"w"}${lv}-${k+1}`,st=starsOf(id,1),b=rec(id,1,"ta");
    return `<button class="wset" data-k="${k}"><b>${k+1}</b><span class="ws">${esc(src[lv][k*n][0])}…</span><span class="st">${"★".repeat(st)}<i>${"★".repeat(3-st)}</i></span>${b?`<small>${b.time.toFixed(1)}s</small>`:""}</button>`}).join("");
  $("wsets").querySelectorAll(".wset").forEach(b=>b.onclick=()=>{SE.tap();CUR=wordSet(lv,+b.dataset.k,t);startRun(1)});}
function renderUL(){const all=allLists(),cats=[...new Set(all.map(l=>l.cat).filter(Boolean))];if(UCAT&&!cats.includes(UCAT))UCAT="";
  $("wTitle").textContent="単語集";
  $("wNote").textContent=WDB?"自分で作った単語集と、みんなが共有した単語集（🌐）。カテゴリーで絞り込めます。":"自分で作った単語集。英語と訳を1行ずつ貼り付けるか、ファイルから読み込めます。";
  $("wtools").innerHTML=[["","すべて"],...cats.map(c=>[c,c])].map(([c,n])=>`<button class="chip ${c===UCAT?"on":""}" data-c="${esc(c)}">${esc(n)}</button>`).join("")+`<button class="chip add" id="ulAdd">＋ 作る・読み込む</button>`;
  $("wtools").querySelectorAll(".chip[data-c]").forEach(b=>b.onclick=()=>{UCAT=b.dataset.c;renderUL()});$("ulAdd").onclick=()=>ulEdit();
  const ls=all.filter(l=>!UCAT||l.cat===UCAT);
  $("wsets").innerHTML=ls.length?ls.map((l,i)=>`<button class="ulc" data-i="${i}"><span class="t"><b>${l.shared?"🌐 ":""}${esc(l.title||"無題")}</b><small>${l.lines.length}語${l.lv?"・"+LV[l.lv].name:""}${l.mine&&l.sid?"・共有中":""}</small></span>${l.cat?`<span class="cat">${esc(l.cat)}</span>`:""}</button>`).join("")
    :`<div class="ulempty">まだ単語集がありません。<br>「＋ 作る・読み込む」から、学校の単語テストの範囲や、市販の単語帳のページなどを入れてみよう。</div>`;
  $("wsets").querySelectorAll(".ulc").forEach(b=>b.onclick=()=>{SE.tap();ulOpen(ls[+b.dataset.i])})}
function ulOpen(L){const n=Math.ceil(L.lines.length/USET),own=L.mine,canDrop=L.sid&&WDB&&(own||(L.by&&L.by===WME)||WADMIN);
  overlay(`<div class="sheet"><h3>${esc(L.title||"無題")}</h3><p class="hint">${L.lines.length}語${L.cat?"・"+esc(L.cat):""}${L.lv?"・"+LV[L.lv].name:""}${L.shared?"・みんなの単語集":""}</p>
    <div class="usets">${Array.from({length:n},(_,k)=>{const id=`u-${L.sid||L.lid}-${k+1}`,st=starsOf(id,1);return `<button class="wset" data-k="${k}"><b>${k+1}</b><span class="ws">${esc(L.lines[k*USET].split("\t")[0])}…</span><span class="st">${"★".repeat(st)}<i>${"★".repeat(3-st)}</i></span></button>`}).join("")}</div>
    ${own?`<button class="sbtn" id="uEd">編集する</button>`:""}${own&&WDB?`<button class="sbtn" id="uSh">${L.sid?"共有を今の内容で上書きする":"🌐 みんなに共有する"}</button>`:""}
    ${canDrop?`<button class="sbtn" id="uDr">共有を取り下げる</button>`:""}${!own?`<button class="sbtn" id="uCp">自分の単語集にコピー</button>`:""}
    ${own?`<button class="sbtn" id="uDel" style="color:var(--bad)">この単語集を消す</button>`:""}<button class="sbtn" id="uX">閉じる</button></div>`,b=>{
    b.querySelectorAll(".wset").forEach(x=>x.onclick=()=>{SE.tap();closeOv();CUR=ulPlay(L,+x.dataset.k);startRun(1)});
    b.querySelector("#uX").onclick=closeOv;
    const q=id=>b.querySelector(id);
    q("#uEd")&&(q("#uEd").onclick=()=>ulEdit(L));
    q("#uSh")&&(q("#uSh").onclick=()=>ulShare(L));
    q("#uDr")&&(q("#uDr").onclick=async()=>{const x=q("#uDr");if(!x.dataset.c){x.dataset.c=1;x.textContent="もう一度押すと取り下げ（みんなの画面から消えます）";return}
      try{await WDB.doc("wordlists/"+L.sid).delete();SHL=(SHL||[]).filter(d=>d.id!==L.sid);if(own){const l=myLists();const m=l.find(z=>z.lid===L.lid);if(m){delete m.sid;saveLists(l)}}toast("取り下げました");closeOv();renderUL()}catch(e){toast("取り下げられませんでした（権限か通信の問題）")}});
    q("#uCp")&&(q("#uCp").onclick=()=>{const l=myLists();l.unshift({lid:"l"+Date.now().toString(36),title:L.title,cat:L.cat||"",lv:L.lv||0,lines:L.lines.slice(),at:Date.now()});saveLists(l)?toast("自分の単語集にコピーしました"):toast("保存できませんでした");closeOv();renderUL()});
    q("#uDel")&&(q("#uDel").onclick=()=>{const x=q("#uDel");if(!x.dataset.c){x.dataset.c=1;x.textContent=L.sid?"もう一度押すと消す（共有はそのまま残ります）":"もう一度押すと消す";return}
      saveLists(myLists().filter(z=>z.lid!==L.lid));toast("消しました");closeOv();renderUL()})})}
async function ulShare(L){if(!WDB)return;const doc={title:L.title,cat:L.cat||"",lv:+L.lv||0,lines:L.lines,by:WME||"",at:Date.now()};
  if(new TextEncoder().encode(JSON.stringify(doc)).length>UL_DOC_MAX){toast("大きすぎて共有できません。単語集を分けてください");return}
  const id=L.sid||("w"+Date.now().toString(36)+Math.random().toString(36).slice(2,6));
  try{await WDB.doc("wordlists/"+id).set(doc);const l=myLists(),m=l.find(z=>z.lid===L.lid);if(m){m.sid=id;saveLists(l)}
    SHL=(SHL||[]).filter(d=>d.id!==id).concat([{...doc,id}]);toast("みんなの単語集に送りました");closeOv();renderUL()}
  catch(e){toast(e&&e.code==="quota_exceeded"?"共有の保存数がいっぱいです。不要な単語集を取り下げてください":"送れませんでした（共有の権限がないか、通信の問題）")}}
const UCATS=["学校の単語テスト","英検","受験","TOEIC","熟語","会話","その他"];
function ulEdit(L){const cats=[...new Set(UCATS.concat(allLists().map(l=>l.cat).filter(Boolean)))];
  overlay(`<div class="sheet wide"><h3>${L?"単語集を編集":"単語集を作る・読み込む"}</h3>
    <label>名前<input id="uT" maxlength="40" placeholder="例：中2 2学期 単語テスト" value="${esc(L?L.title:"")}"></label>
    <div class="row2"><label>カテゴリー<input id="uC" list="ucats" maxlength="20" placeholder="例：英検" value="${esc(L?L.cat||"":"")}"><datalist id="ucats">${cats.map(c=>`<option value="${esc(c)}">`).join("")}</datalist></label>
    <label>レベル<select id="uL"><option value="0">なし</option>${[1,2,3].map(l=>`<option value="${l}" ${L&&+L.lv===l?"selected":""}>${LV[l].name}</option>`).join("")}</select></label></div>
    <label>英語と訳（1行に1つ）<textarea id="uX" spellcheck="false" placeholder="apple = りんご&#10;look forward to = 〜を楽しみに待つ&#10;improve	向上させる">${L?esc(L.lines.map(x=>x.replace("\t"," = ")).join("\n")):""}</textarea></label>
    <p class="hint">区切りは <code>=</code>・タブ・カンマ・<code> ## </code> のどれでもOK（Excelやスプレッドシートからのコピー、CSVファイルもそのまま）。熟語もそのまま書けます。訳は12字までがおすすめ（長いと文字が小さくなります）。「#」で始まる行はメモ。</p>
    <label>ファイルから読み込む（.txt / .csv / .tsv）<input type="file" id="uF" accept=".txt,.csv,.tsv,text/plain,text/csv"></label>
    <p class="msg" id="uM"></p><button class="sbtn pri" id="uS">保存する</button><button class="sbtn" id="uN">やめる</button></div>`,b=>{
    const q=id=>b.querySelector(id),chk=()=>{const r=parseWordLines(q("#uX").value),m=q("#uM");
      m.className="msg"+(r.errs.length?" ng":"");m.innerHTML=`${r.ok.length}語${r.ok.length<4?"（4語以上必要）":""}${r.long.length?`・訳が長い：${esc(r.long.slice(0,5).join(", "))}${r.long.length>5?" ほか":""}`:""}${r.errs.length?`<br>読めない行（飛ばします）：${esc(r.errs.slice(0,3).join("、"))}${r.errs.length>3?` ほか${r.errs.length-3}行`:""}`:""}`;return r};
    q("#uX").oninput=chk;if(L)chk();
    q("#uF").onchange=async e=>{const f=e.target.files[0];if(!f)return;const t=await f.text();q("#uX").value=(q("#uX").value.trim()?q("#uX").value.trim()+"\n":"")+t;if(!q("#uT").value)q("#uT").value=f.name.replace(/\.[^.]+$/,"").slice(0,40);chk()};
    q("#uN").onclick=closeOv;
    q("#uS").onclick=()=>{const r=chk();if(r.ok.length<4){SE.ng();toast("4語以上入れてください");return}
      const l=myLists(),o={lid:L?L.lid:"l"+Date.now().toString(36),title:q("#uT").value.trim()||"無題の単語集",cat:q("#uC").value.trim(),lv:+q("#uL").value,lines:r.ok,at:Date.now()};
      if(L&&L.sid)o.sid=L.sid;const i=l.findIndex(z=>z.lid===o.lid);i>=0?l.splice(i,1,o):l.unshift(o);
      if(!saveLists(l)){toast("保存できませんでした（端末の容量）");return}SE.tap();toast(L&&L.sid?"保存しました（共有は「上書き」で反映）":"保存しました");closeOv();UCAT="";renderUL()}})}
function renderDetail(){
  const p=CUR;$("dTag").textContent=`${LV[p.lv].name}・${p.tag.split("・")[1]||""}`;$("dTitle").textContent=p.title;$("dJa").textContent=p.ja;
  const rb=(SV.best[p.id]||{}).run;$("dRun").innerHTML=rb?`通しのベスト <b>${rb.time.toFixed(1)}s</b>　ランク ${rb.rank}`:"4段階を続けて遊びます。途中の段から始めることもできます";
  $("stages").innerHTML=STAGES.map(s=>{const lk=!reached(p.id,s.id),r=rec(p.id,s.id,"ta"),st=starsOf(p.id,s.id);
    return `<button class="st ${lk?"lock":""}" data-st="${s.id}"><span class="no">${lk?"🔒":s.id}</span><span><div class="nm">${s.name}</div><div class="ds">${lk?"ひとつ前の段まで進むと、ここから始められます":s.desc}</div></span>
    <span class="rec">${r?`<b>${r.rank||"-"}</b>${r.time.toFixed(1)}s`:""}<span class="stars">${[0,1,2].map(i=>`<span class="${i<st?"on":""}">★</span>`).join("")}</span></span></button>`}).join("");
  $("stages").querySelectorAll(".st").forEach(b=>b.onclick=()=>{const s=+b.dataset.st;if(!reached(p.id,s)){SE.ng();toast("ひとつ前の段まで進むと開きます");return}SE.tap();startRun(s)});
}
/* 全画面（ブラウザのバーを消す）＋横向き固定。押したときにだけ呼べる。iPhoneのブラウザは非対応（アプリ版で全画面） */
const isFull=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
const canFull=()=>{const d=document.documentElement;return !!(d.requestFullscreen||d.webkitRequestFullscreen)};
let WANTF=false;   /* 全画面にしたい状態か。回転などで勝手に抜けても、次のタップで戻す */
function goFull(){if(!canFull())return false;WANTF=true;if(isFull())return false;const d=document.documentElement;try{const p=(d.requestFullscreen||d.webkitRequestFullscreen).call(d,{navigationUI:"hide"});
  p&&p.catch&&p.catch(()=>{})}catch(e){}return true}
function toggleFull(){if(isFull()){WANTF=false;(document.exitFullscreen||document.webkitExitFullscreen).call(document);return}if(!canFull()){toast("このブラウザは全画面に対応していません（アプリ版では全画面になります）");return}goFull()}
$("btnFull").onclick=()=>{SE.tap();toggleFull()};
$("btnRun").onclick=()=>{SE.tap();startRun(1)};
$("modeRh").onclick=()=>{SE.tap();toast("リズムモードは準備中です")};
// 本文を読む：共通の「読む画面」（core.reader）を全画面で開く。閉じるとゲームに戻る。文章データは data/texts.js（tools/reading_texts.py が作る）
function openReading(from){
  const t=typeof LS_TEXTS!=="undefined"?LS_TEXTS[CUR.id]:null;
  SE.tap();
  if(!t){renderReader();show("sReader");return}   // 文章データがない長文は、今までの読む画面で
  bgmStop();
  ctx.core.reader.open({title:t.title,list:t.list,level:t.level,questions:t.q||[]},
    {label:from==="post"?"振り返り":"予習",backLabel:from==="post"?"← 結果へ":"← もどる",onClose:()=>bgmStart(84,"menu")});
}
$("btnRead").onclick=()=>openReading("pre");
document.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>{SE.tap();hush();if(b.dataset.back==="home"){renderHome();show("sHome")}else{renderDetail();show("sDetail")}});
function renderReader(){
  const p=CUR;$("rTitle").textContent=p.title;
  $("reader").innerHTML=p.chunks.map((c,i)=>{const [gs,ge]=c.g;const e=c.tk.map((t,j)=>esc(t[0])+(j>=gs&&j<ge?`<b>${esc(t[1])}</b>`:esc(t[1]))+esc(t[2])).join(" ");
    return `<button class="rc" data-i="${i}"><span class="e">${e}</span><span class="jj">${esc(c.ja)}</span></button>`}).join("");
  $("reader").querySelectorAll(".rc").forEach(b=>b.onclick=()=>{ac();$("reader").querySelectorAll(".rc").forEach(x=>x.classList.remove("on"));b.classList.add("on");say(plain(p.chunks[+b.dataset.i]))});
}
$("btnJp").onclick=()=>{$("btnJp").classList.toggle("on");$("reader").classList.toggle("nojp")};
$("btnReadAll").onclick=()=>{ac();say(CUR.chunks.map(plain).join(" "))};
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;$("app").appendChild(d);setTimeout(()=>d.remove(),1700)}
function overlay(html,bind){$("ovBody").innerHTML=html;$("ov").hidden=false;bind&&bind($("ovBody"))}
function closeOv(){$("ov").hidden=true;$("ovBody").innerHTML=""}

$("btnSettings").onclick=()=>{SE.tap();openSettings()};
function openSettings(){
  const segs=(k,opts)=>`<div class="seg" data-k="${k}">${opts.map(([v,l])=>`<button data-v="${v}" class="${String(SV.set[k])===String(v)?"on":""}">${l}</button>`).join("")}</div>`;
  overlay(`<div class="sheet wide"><h3>設定</h3><div class="setgrid">
   <div class="set">ナビ${segs("nav",[["girl","モモ"],["boy","ソラ"]])}</div>
   <div class="set">文字の大きさ${segs("fs",[[1,"小"],[1.2,"中"],[1.4,"大"],[1.6,"特大"]])}</div>
   <div class="set">流れる速さ${segs("spd",[[.35,"超遅"],[.5,"遅い"],[.7,"普通"],[1,"速い"]])}</div>
   <div class="set">英語の読み上げ${segs("voice",[[1,"ON"],[0,"OFF"]])}</div>
   <div class="set">読み上げ速度${segs("rate",[[0,"ゆっくり"],[1,"ふつう"],[2,"はやい"]])}</div>
   <div class="set">効果音・ボイス${segs("se",[[1,"ON"],[0,"OFF"]])}</div>
   <div class="set">BGM${segs("bgm",[[1,"ON"],[0,"OFF"]])}</div>
   <div class="set">長文完成の日本語${segs("jp4",[[1,"出す"],[0,"出さない"]])}</div>
   </div><div class="row2"><button class="sbtn" id="setReset">記録をリセット</button><button class="sbtn pri" id="setClose">とじる</button></div></div>`,b=>{
    b.querySelectorAll(".seg").forEach(sg=>sg.querySelectorAll("button").forEach(x=>x.onclick=()=>{const k=sg.dataset.k,v=x.dataset.v;SV.set[k]=k==="nav"?v:+v;save();SE.tap();applyFs();
      sg.querySelectorAll("button").forEach(y=>y.classList.toggle("on",y===x));if(k==="bgm"&&AC)BGG.gain.setValueAtTime(SV.set.bgm?.35:0,AC.currentTime);$("heroChara").src=chara("joy")}));
    b.querySelector("#setClose").onclick=()=>{SE.tap();closeOv();renderHome()};

    const r=b.querySelector("#setReset");r.onclick=()=>{if(r.dataset.c){SV.best={};save();toast("記録をリセットしました");closeOv();renderHome()}else{r.dataset.c=1;r.textContent="もう一度押すとリセット";r.style.color="var(--bad)"}};
  });
}

/* ================= ゲーム ================= */
let RUN=null,G=null,PAUSED=false,RAF=0,LAST=0;
const TRAV={1:9,2:12,3:12,4:15};     // 右端から左端まで流れる秒数（上級ほど少しゆっくり）
const PAR={1:1.7,2:2.5,3:2.5,4:2.3};   // 1問あたりの目標秒数
const MAXVIS={1:4,2:4,3:3};
let W=700,H=200,XJ=140;

// 穴の位置と選択肢を1つ選ぶ（穴うめの候補から。作者が決めた誤答があればそれを優先して混ぜる）
function gapPick(c){
  const auth=c.s3.filter(x=>Array.isArray(x[1]));const pick=(auth.length&&Math.random()<.45)?auth[rnd(auth.length)]:c.s3[rnd(c.s3.length)];
  const [ti,src]=pick;const ans=c.tk[ti][1];let ds;
  if(Array.isArray(src))ds=src.slice(0,3);else{const own=c.tk.map(t=>t[1].toLowerCase());ds=shuf(POOL[src].filter(w=>w!==ans.toLowerCase()&&!own.includes(w))).slice(0,3)}
  const up=/^[A-Z]/.test(ans)&&ans!=="I";ds=ds.map(d=>up?cap(d):d);
  return {gs:ti,ge:ti+1,ans,opts:shuf([ans,...ds])}}
function buildItems(st,p){
  if(st===1)return shuf(p.words).map(w=>({kind:1,en:w[0],pos:w[1],ans:w[2]}));
  const n=Math.min(p.lv===1?14:16,p.chunks.length);
  if(st===2)return shuf(p.chunks.map((c,i)=>i)).slice(0,n).map(i=>({kind:2,ci:i,en:plain(p.chunks[i]),ans:p.chunks[i].ja}));
  if(st===3)return shuf(p.chunks.map((c,i)=>i).filter(i=>p.chunks[i].s3.length)).slice(0,n).map(i=>({kind:3,ci:i,...gapPick(p.chunks[i]),ja:p.chunks[i].ja}));
  // 長文：穴の位置は遊ぶたびにランダム（つなぎの穴か、穴うめの候補から）
  return p.chunks.map((c,i)=>{const gp=c.s3.length&&Math.random()<.6?gapPick(c):{gs:c.g[0],ge:c.g[1],ans:c.g[2][0],opts:shuf(c.g[2])};return {kind:4,ci:i,...gp,ja:c.ja,lane:i%2}});
}
function chunkHTML(c,gs,ge,fill){
  const h=[];for(let j=0;j<c.tk.length;j++){const t=c.tk[j];
    if(j===gs){h.push(esc(c.tk[gs][0])+(fill==null?`<span class="blank">?</span>`:`<b>${esc(fill)}</b>`)+esc(c.tk[ge-1][2]));j=ge-1;continue}
    h.push(esc(t[0]+t[1]+t[2]))}
  return h.join(" ")}

/* ---- 通しプレイ ---- */
function startRun(from){
  goFull();hush();closeOv();RUN={p:CUR,from,res:[],combo:0,maxc:0,review:[],flow:true};
  show("sPlay");ac();bgmStart(118,"game");crowd().innerHTML="";BK.S=1;setTimeout(()=>{try{bigK()}catch(e){}},300);
  buildGrids();cancelAnimationFrame(RAF);LAST=performance.now();RAF=requestAnimationFrame(loop);
  const beat=60/118*1000;
  [3,2,1].forEach((n,i)=>setTimeout(()=>{if(!RUN)return;inter(`<div class="cd">${n}</div>`,0);SE.count(false)},i*beat));
  setTimeout(()=>{if(RUN)beginStage(from)},3*beat);
}
function inter(html,ms){const f=$("arena");f.querySelectorAll(".inter").forEach(e=>e.remove());if(!html)return;const d=document.createElement("div");d.className="inter";d.innerHTML=html;f.appendChild(d);if(ms)setTimeout(()=>d.remove(),ms);return d}
function beginStage(st){
  const p=RUN.p;$("layer").innerHTML="";$("fx").innerHTML="";
  G={st,p,done:0,first:0,wrong:0,miss:0,t:0,pen:0,started:false,ribbon:[],lanes:[{i:0,q:[],list:[],slots:null,lock:0},{i:1,q:[],list:[],slots:null,lock:0}],
     cq:[],list:[],rq:[],rqCur:null,rqLast:0};
  const items=buildItems(st,p);G.total=items.length;$("para").innerHTML="";$("para").className="para"+(st===4?"":" log");$("para").style.transform="";
  if(st===1)items.forEach((it,i)=>G.lanes[i%2].list.push(it));else if(st<=3)items.forEach(it=>G.lanes[0].list.push(it));else G.list=items;G.prev=new Set();
  layout();hud();
  $("hudNo").textContent=st;$("hudName").textContent=STAGES[st-1].name;
  G.lanes.forEach(L=>{L.slots=null;renderGrid(L.i)});
  SE.count(true);
  inter(`<div class="sub" style="color:var(--accent)">STAGE ${st}</div><div class="big" style="font-size:clamp(28px,9vh,44px)">${STAGES[st-1].name}</div><div class="note">${STAGES[st-1].note}</div>`,1350);
  setTimeout(()=>{if(G&&G.st===st){G.started=true}},1350);
}
let LY=[60,140];
function layout(){const r=$("field").getBoundingClientRect();W=r.width;H=r.height;XJ=Math.round(Math.min(W*.18,150));$("zone").style.left=XJ+"px";
  // 縦画面：選択肢は帯の下にあるので、レーンは帯の真ん中
  LY=innerHeight>innerWidth?[H/2,H/2]:[0,1].map(l=>{const g=$("g"+l).getBoundingClientRect();return g.top+g.height/2-r.top});$("seam").style.top=((LY[0]+LY[1])/2)+"px"}
// レーンの高さ＝それぞれの4択（2×2）の真ん中
// レーンは真ん中に寄せる（上下の間は日本訳が入るぶんだけ）
function laneY(l){const mid=(LY[0]+LY[1])/2;if(!G||G.st===2||G.st===3)return mid;const fs=+(SV.set.fs||1.2),ch=fs*15*1.25+12,off=ch/2+(G.st===4?fs*9:7);const o=innerHeight>innerWidth&&G.st===4?fs*15*1.25+10:off;return mid+(l?o:-o)}
addEventListener("resize",()=>{if(G&&!$("sPlay").hidden)layout()});
document.addEventListener("pointerdown",()=>{if(WANTF&&!isFull())goFull()},true);
document.addEventListener("fullscreenchange",()=>{document.documentElement.classList.toggle("fsb",!!document.fullscreenElement);if(G&&!$("sPlay").hidden)setTimeout(layout,50)});   // 縦でも横でも遊べる

function mkCard(it){
  const e=document.createElement("div");e.className="card l"+it.lane;const p=G.p;
  if(it.kind===1)e.innerHTML=`${POSJ[it.pos]?`<span class="pos ${it.pos}">${POSJ[it.pos]}</span>`:""}${esc(it.en)}`;
  else if(it.kind===2){e.textContent=it.en}
  else{e.innerHTML=chunkHTML(p.chunks[it.ci],it.gs,it.ge)}
  e.insertAdjacentHTML("beforeend",'<span class="ft"></span>');
  $("layer").appendChild(e);const mw=innerHeight>innerWidth?Math.round(W*.6):W-24;if(e.offsetWidth>mw){e.style.whiteSpace="normal";e.style.width=mw+"px"}/* 縦画面は幅を6割までにして、右から動いて見えるように */it.el=e;it.w=e.offsetWidth;it.h=e.offsetHeight;it.y=laneY(it.lane);it.ready=0;place(it);return e}
function place(it){it.el.style.transform=`translate3d(${it.x.toFixed(1)}px,${(it.y-it.h/2).toFixed(1)}px,0)`}
function setJa(it,txt){let j=it.el.querySelector(".jp");if(!txt){j&&j.remove();return}if(!j){j=document.createElement("span");j.className="jp";it.el.appendChild(j)}j.textContent=txt}

/* ---- ループ ---- */
function loop(){
  RAF=requestAnimationFrame(loop);if(PAUSED)return;
  const tn=performance.now(),dt=Math.min(.05,(tn-LAST)/1000);LAST=tn;
  if(!G||!G.started||G.over){if(G)stepRibbon(dt);return}
  G.t+=dt;G.lanes.forEach(L=>L.lock=Math.max(0,L.lock-dt));G.lock4=Math.max(0,(G.lock4||0)-dt);
  G.st<=3?stepLanes(dt):stepLong(dt);heal();
  stepRibbon(dt);hud();
  if(G.done>=G.total)stageEnd();
}
function speedOf(){return (W+40)/(TRAV[G.st]+(G.p.lv-1))*(SV.set.spd||.5)}
// 右端から全体が見えるところまでは一気に出てきて、そこからゆっくり
const ENTER=1100;const inView=it=>W-it.w-12;
// 制限時間：先頭になって全部見えてから一定時間。その時間でちょうど左端に着く速さで動かす（長い文でも同じ時間）
const LIMIT={1:9,2:13,3:13,4:16};function limitOf(){return (LIMIT[G.st]+(G.p.lv-1))*(.5/(SV.set.spd||.5))*(innerHeight>innerWidth?1.25:1)}/* 縦画面は読み取りにくいので1.25倍 */
function moveFront(it,v,dt){const ex=inView(it);if(it.x>ex){it.x=Math.max(ex,it.x-ENTER*dt);return v*2}if(it.v==null)it.v=Math.max(3,(it.x-38)/limitOf());it.age=(it.age||0)+dt;let sp=it.v;if(false){const over=it.x-W*.5;if(over>0)sp+=over*2.4*(SV.set.spd||.5);else it.boost=false}it.x=Math.max(6,it.x-sp*dt);return sp}
function stepLanes(dt){
  const v=speedOf();let fast=false;
  G.lanes.forEach(L=>{
    // 補充：前のカードが右端から出きったら次を出す（単語は4つまで、チャンクは長さしだい）
    while(L.q.length<MAXVIS[G.st]&&L.list.length){const last=L.q[L.q.length-1];if(last&&last.x+last.w>W-12)break;
      const it=L.list.shift();it.lane=L.i;it.x=Math.max(W+8,last?last.x+last.w+30:0);mkCard(it);L.q.push(it);if(L.q.length===1)laneFront(L)}
    L.q.forEach((it,k)=>{
      if(k===0){if(moveFront(it,v,dt)>v*1.6)fast=true;if(it.x+it.w<W)it.ready+=dt;
        if(!it.el.classList.contains("front")){it.el.classList.add("front");it.el.classList.remove("next")}
        if(it.v!=null){const r=Math.max(0,1-it.age/limitOf());if(!it.tb){it.tb=document.createElement("span");it.tb.className="tb";it.tb.innerHTML="<i></i>";it.el.appendChild(it.tb)}it.tb.firstChild.style.transform=`scaleX(${r})`;it.tb.classList.toggle("low",r<.3);
          if(r<=0){place(it);missIt(L,it);return}}}
      else{const a=L.q[k-1];it.x=Math.max(a.x+a.w+30,it.x>inView(it)?Math.max(inView(it),it.x-ENTER*dt):it.x-(L.q[0].v||v)*dt);it.el.classList.add("next")}
      place(it)});
  });
  if(G.st<=2)readTick();
  $("field").classList.toggle("fast",fast||RUN.combo>=10);
}
function stepLong(dt){
  const v=speedOf();let fast=false;const Q=G.cq;
  while(Q.length<14&&G.list.length){const last=Q[Q.length-1];if(last&&last.x>W-30)break;
    const it=G.list.shift();const pp=Q[Q.length-2];it.x=Math.max(W+8,last?last.x+last.w*.5+18:0,pp?pp.x+pp.w+16:0);mkCard(it);Q.push(it);if(Q.length===1)front4()}
  Q.forEach((it,k)=>{
    if(k===0){if(it.x>40){if(moveFront(it,v,dt)>v*1.6)fast=true;it.x=Math.max(40,it.x)}if(it.x+it.w<W)it.ready+=dt;  // 左端で止まって待つ
      const r=it.ready/limitOf();if(SV.set.jp4&&r>=.5&&!it.jaOn){it.jaOn=1;setJa(it,it.ja)}if(r>=.85&&!TTS.busy&&G.t-(it.hintT||-99)>5)hint4(it);tbar(it,1-Math.min(1,r/.85))}
    else{const a=Q[k-1],b=Q[k-2];const tx=Math.max(a.x+a.w*.5+18,b?b.x+b.w+16:0);it.x=Math.max(tx,it.x>inView(it)?Math.max(inView(it),it.x-ENTER*dt):it.x-(Q[0].v||v)*dt)}
    place(it)});
  $("field").classList.toggle("fast",fast||RUN.combo>=10);
}
// 安全装置：先頭の答えが4択に無い（進めない）状態になったら、すぐに4択を出し直す
function heal(){const ok=(S,f)=>S&&S.some(x=>x&&x.text===f.ans);
  if(G.st===4){const f=G.cq[0];if(f&&!ok(G.s4,f))front4()}
  else if(G.st>=2){const f=G.lanes[0].q[0];if(f&&!ok(G.s4,f))laneFront(G.lanes[0])}
  else G.lanes.forEach(L=>{const f=L.q[0];if(f&&!ok(L.slots,f))laneFront(L)})}
// 残り時間のバー（長文：読み上げヒントまでの時間）
function tbar(it,r){if(!it.el)return;if(!it.tb){it.tb=document.createElement("span");it.tb.className="tb";it.tb.innerHTML="<i></i>";it.el.appendChild(it.tb)}it.tb.firstChild.style.transform=`scaleX(${Math.max(0,r)})`;it.tb.classList.toggle("low",r<.3);it.el.classList.toggle("sweat",r<.3)}
function hint4(it){it.hintT=G.t;it.el.classList.add("spk");speak(plain(G.p.chunks[it.ci]),()=>{it.el&&it.el.classList.remove("spk")},"hint");face("think")}

/* ---- 先に読み上げ（単語・チャンク）：手前の上下を順に読む。答えたら次の語へ ---- */
function isFront(it){return G.lanes[it.lane].q[0]===it}
function readEnq(it,first){if(!it||G.rq.includes(it))return;first?G.rq.unshift(it):G.rq.push(it);readPump()}
function readPump(){
  if(!G||G.rqCur||!G.started)return;
  while(G.rq.length){const it=G.rq.shift();if(!isFront(it))continue;G.rqCur=it;it.el.classList.add("spk");const g=G;
    speak(it.en,()=>{it.el&&it.el.classList.remove("spk");if(G!==g)return;it.heard=G.t;if(G.rqCur===it)G.rqCur=null;G.rqLast=G.t;readPump()},"read");return}
}
function readTick(){
  if(G.rqCur&&!isFront(G.rqCur)){G.rqCur.el.classList.remove("spk");G.rqCur=null}
  if(G.st===1){ // 単語：持ち時間の半分でもう一度、残りわずかになったら何回か読み直す
    readPump();return}   /* 読み直しは🔊ボタンを押したときだけ */
  if(!G.rqCur&&!G.rq.length){const fr=G.lanes.map(L=>L.q[0]).filter(f=>f&&f.x<W-20);
    if(fr.length&&G.t-G.rqLast>2.2){fr.sort((a,b)=>(a.heard??-1)-(b.heard??-1));readEnq(fr[0])}}
  else readPump();
}

/* ---- 4択（上＝上レーン、下＝下レーン） ---- */
function buildGrids(){[0,1].forEach(l=>{const g=$("g"+l);g.innerHTML=[0,1,2,3].map(i=>`<button class="ch" data-i="${i}"><span class="tx"></span></button>`).join("");
  g.querySelectorAll(".ch").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();press(l,+b.dataset.i)}))})}
// 長文の段：上の4択の下段＋下の4択の上段＝真ん中の4つ
function slotAt(l,i){if(G.st>=2){const k=l===0?(i>=2?i-2:-1):(i<2?i+2:-1);return k<0?undefined:(G.s4?G.s4[k]:null)}const L=G.lanes[l];return L.slots?L.slots[i]:null}
function fitCh(b,t){t.style.fontSize="";let f=parseFloat(getComputedStyle(t).fontSize),n=0;while(n++<12&&b.scrollHeight>b.clientHeight+1&&f>8.5){f-=.6;t.style.fontSize=f+"px"}}   
/* 🔊：単語のステージだけ。押すと、時間の残りが少ない順に先頭の単語を読み直す。答えた直後0.3秒は反応しない（指が流れて押すのを防ぐ） */
let LASTCH=0;
function posRep(){const r=$("rep"),sd=$("side");if(!r)return;const on=!!(G&&G.st===1);r.hidden=!on;sd.classList.toggle("wd",on);if(!on)return;const g=$("g0"),g1=$("g1");r.style.top=((g.offsetTop+g.offsetHeight+g1.offsetTop)/2)+"px"}
function repTap(e){e.preventDefault();e.stopPropagation();if(!G||G.st!==1||!G.started||G.over||PAUSED)return;if(performance.now()-LASTCH<300)return;
  const lim=limitOf(),fr=G.lanes.map(L=>L.q[0]).filter(f=>f&&f.v!=null).sort((a,b)=>b.age-a.age);if(!fr.length)return;
  fr.slice().reverse().forEach(f=>{G.rq=G.rq.filter(x=>x!==f);readEnq(f,true)});const r=$("rep");r.classList.add("on");setTimeout(()=>r.classList.remove("on"),400)}
function renderGrid(l){
  const g=$("g"+l),en=G.st>=3,st4=G.st>=2,cl=G.st===1?l:G.st===4?(G.cq[0]?G.cq[0].lane:0):0;g.classList.toggle("c0",cl===0);g.classList.toggle("c1",cl===1);g.classList.toggle("off",st4?!G.s4:!G.lanes[l].slots);g.classList.toggle("m4",st4);
  [...g.children].forEach((b,i)=>{const s=slotAt(l,i),tx=s?s.text:"";b.classList.toggle("hide",s===undefined);const el=b.querySelector(".tx");
    if(el.textContent!==tx){el.textContent=tx;b.classList.remove("swap");void b.offsetWidth;b.classList.add("swap");fitCh(b,el)}
    b.classList.toggle("en",en);b.classList.toggle("long",tx.length>(en?22:16));b.classList.remove("ng","ok");b.classList.toggle("dis",!!(s&&s.dis))})}
function laneFront(L){
  const f=L.q[0];
  if(G.st>=2){G.s4=f?(G.st===3?f.opts:shuf([f.ans,...distract(f,new Set([f.ans]))])).map(t=>({text:t})):null;if(f){G.s4.forEach(x=>G.prev.add(x.text));if(G.st===3)setJa(f,f.ja)}
    renderGrid(0);renderGrid(1);if(f&&G.st===2&&G.started)readEnq(f,false);return}
  if(!f){L.slots=null;renderGrid(L.i);return}
  const other=G.lanes[1-L.i].q[0],ex=new Set([f.ans,other&&other.ans]);
  // 前に出した選択肢は使わない（残った語で答えがばれないように）
  const old=L.prevOpts||new Set();(L.slots||[]).forEach(x=>old.add(x.text));
  L.slots=shuf([f.ans,...distract(f,ex,old)]).map(t=>({text:t}));L.prevOpts=new Set(L.slots.map(x=>x.text));renderGrid(L.i);
  if(G.started)readEnq(f,false);
}
// 誤答：同じ長文の同じ品詞から最大2つ、足りない分は辞書（英語脳アプリ）の同じ品詞からランダム
function distract(f,ex,old){
  const p=G.p,bad=t=>ex.has(t)||(old&&old.has(t))||(G.prev&&G.st===2&&G.prev.has(t));const out=[];
  if(G.st===1){
    const own=f.pos==="x"?3:2;shuf(p.words.filter(w=>w[0]!==f.en&&(w[1]===f.pos||f.pos==="x")).map(w=>w[2])).forEach(t=>{if(out.length<own&&!bad(t)&&!out.includes(t))out.push(t)});
    shuf(wja(f.pos)).forEach(t=>{if(out.length<3&&!bad(t)&&!out.includes(t))out.push(t)});
    shuf(p.words.map(w=>w[2])).forEach(t=>{if(out.length<3&&t!==f.ans&&!ex.has(t)&&!out.includes(t))out.push(t)});
  }else{
    const pool=shuf(p.chunks.map(c=>c.ja)).concat(shuf(PASSAGES.filter(q=>q!==p&&q.lv===p.lv).flatMap(q=>q.chunks.map(c=>c.ja))));
    pool.forEach(t=>{if(out.length<3&&!bad(t)&&!out.includes(t))out.push(t)});
    if(out.length<3)pool.forEach(t=>{if(out.length<3&&!ex.has(t)&&!out.includes(t))out.push(t)});
  }
  return out}
function front4(){
  const f=G.cq[0];G.lanes.forEach(L=>L.slots=null);
  G.cq.forEach((it,k)=>{if(k)setJa(it,null);it.el.classList.toggle("front",k===0);it.el.classList.toggle("next",k>0)});
  G.s4=f?f.opts.map(t=>({text:t})):null;
  renderGrid(0);renderGrid(1);
}
addEventListener("keydown",e=>{if($("sPlay").hidden||!G)return;const m={"1":[0,0],"2":[0,1],"q":[0,2],"w":[0,3],"9":[1,0],"0":[1,1],"o":[1,2],"p":[1,3]}[e.key];
  if(m)press(m[0],m[1]);if(e.key==="Escape"||e.key===" ")pause()});

function press(l,i){
  if(!G||!G.started||G.over||PAUSED)return;
  if(G.st>=2){const s=slotAt(l,i),f=G.st===4?G.cq[0]:G.lanes[0].q[0];if(!s||s.dis||!f||G.lock4>0)return;const btn=$("g"+l).children[i],LL=G.st===4?G.lanes[f.lane]:G.lanes[0];if(s.text===f.ans)correct(LL,f,btn);else wrong(LL,f,s,btn);return}
  const L=G.lanes[l];if(L.lock>0||!L.slots)return;
  const f=G.st<=3?L.q[0]:G.cq[0];if(!f||f.lane!==l)return;
  const s=L.slots[i];if(!s||s.dis)return;const btn=$("g"+l).children[i];
  if(s.text===f.ans)correct(L,f,btn);else wrong(L,f,s,btn);
}
function resolve(it){G.done++;if(it.flawed)RUN.review.push({st:G.st,it,p:G.p});else G.first++}
function correct(L,it,btn){
  G.lastBtn=btn;
  if(G.st<=3){L.q.shift();if(L.q[0])L.q[0].boost=true}else{G.cq.shift();if(G.cq[0])G.cq[0].boost=true}if(G.st>=2)G.lock4=.08;
  resolve(it);RUN.combo++;RUN.maxc=Math.max(RUN.maxc,RUN.combo);L.lock=.08;
  btn.classList.remove("ok");void btn.offsetWidth;btn.classList.add("ok");setTimeout(()=>btn.classList.remove("ok"),170);
  try{SE.ok(RUN.combo);fxCorrect(it);comboPop()}catch(e){}
  const c=it.ci!=null?G.p.chunks[it.ci]:null;
  if(G.st<=2){if(G.rqCur===it){G.rqCur=null;it.el.classList.remove("spk")}
    flyTo(it,`${esc(it.en)}<i>${esc(it.ans)}</i>`);
    laneFront(L);if(G.rqCur==null){const nf=L.q[0];if(nf){G.rq=G.rq.filter(x=>x!==nf);readEnq(nf,true)}}}
  else if(G.st===3){speakAfter(fromGap(c,it.gs));flyTo(it,chunkHTML(c,it.gs,it.ge,it.ans)+`<i>${esc(c.ja)}</i>`);laneFront(L)}
  else{G.lock4=.08;front4();try{speakAfter(fromGap(c,it.gs));SE.merge();flyTo(it,chunkHTML(c,it.gs,it.ge,it.ans))}catch(e){it.el&&it.el.remove()}}
}
function wrong(L,it,s,btn){
  G.wrong++;RUN.combo=0;SE.ng();face("surprise");it.flawed=true;s.dis=true;
  try{bkShrink(.5)}catch(e){}
  if(it.el){const e=it.el;e.classList.remove("oops");void e.offsetWidth;e.classList.add("oops");setTimeout(()=>e.classList.remove("oops"),460)}
  btn.classList.remove("ng");void btn.offsetWidth;btn.classList.add("ng","dis");
  G.pen+=2;penFx("+2.0");
  if(navigator.vibrate)try{navigator.vibrate(30)}catch(e){}
}
function missIt(L,it){
  try{bkShrink(.6)}catch(e){}
  L.q.shift();it.flawed=true;resolve(it);G.miss++;RUN.combo=0;SE.miss();face("sad");G.pen+=3;penFx("+3.0");
  if(G.rqCur===it)G.rqCur=null;
  it.el.classList.add("miss");it.el.classList.remove("spk");setJa(it,null);const a=document.createElement("div");a.className="ans";a.textContent=it.ans;it.el.appendChild(a);
  const g=G,c=it.ci!=null?G.p.chunks[it.ci]:null;setTimeout(()=>{if(G===g&&it.el.isConnected)flyTo(it,c&&G.st===3?chunkHTML(c,it.gs,it.ge,it.ans)+`<i>${esc(c.ja)}</i>`:`${esc(it.en)}<i>${esc(it.ans)}</i>`,"bad")},650);
  laneFront(L);
}

/* ---- 答えたものは下の文章エリアへ飛んでいく（長文の段は1つの段落になっていく） ---- */
function flyTo(it,html,cls){
  const el=it.el,g=G;if(!el||!el.isConnected)return;const segs=segsOf(it);
  if(cls==="bad"){el.classList.add("dizzy");el.animate([{opacity:1,translate:"0 0",rotate:"0deg"},{opacity:0,translate:"-10px 44px",rotate:"-18deg"}],{duration:650,easing:"ease-in",fill:"forwards"});setTimeout(()=>el.remove(),660);return}
  el.classList.remove("front","next","sweat","spk","oops");el.classList.add("joy");
  const go=()=>{if(!el.isConnected)return;el.style.animation="ccJump .26s ease-out forwards";const r=el.getBoundingClientRect(),fr=$("fx").getBoundingClientRect(),big=RUN&&RUN.combo>=10;
    fireworks($("fx"),r.left-fr.left+r.width/2,r.top-fr.top+r.height/2,big?18:12,big?64:48);setTimeout(()=>joinCrowd(it,el,segs),220)};
  const bl=el.querySelector(".blank"),btn=g&&g.lastBtn;
  if(bl&&btn&&it.ci!=null){   // 穴うめ：答えの体節が飛んできて、カチッとくっつく
    const pc=document.createElement("div");pc.className="piece";pc.textContent=it.ans;document.body.appendChild(pc);
    const a=btn.getBoundingClientRect(),b=bl.getBoundingClientRect();
    pc.animate([{transform:`translate(${a.left+a.width/2-24}px,${a.top}px) scale(.9)`},{transform:`translate(${b.left}px,${b.top-2}px) scale(1)`}],{duration:200,easing:"ease-in"}).onfinish=()=>{pc.remove();
      const c=g.p.chunks[it.ci];if(c){el.innerHTML=chunkHTML(c,it.gs,it.ge,it.ans)+'<span class="ft"></span>'}el.classList.add("snap");try{SE.merge()}catch(e){}setTimeout(go,130)};
  }else go();
}
function toRibbon(it,bad){
  const c=G.p.chunks[it.ci],e=it.el;e.className="card rib"+(bad?" bad":"");e.style.maxWidth="none";
  e.innerHTML=chunkHTML(c,it.gs,it.ge,it.ans);it.w=e.offsetWidth;it.h=e.offsetHeight;it.ty=laneY(2);it.end=/[.?!;]["”]?$/.test(plain(c));
  G.ribbon.push(it);SE.merge();setTimeout(()=>e.classList.add("old"),900);
  const r=document.createElement("div");r.className="ring";r.style.cssText=`left:${it.x-6}px;top:${laneY(2)-it.h/2-6}px;width:${it.w+12}px;height:${it.h+12}px`;$("fx").appendChild(r);setTimeout(()=>r.remove(),420);
}
function stepRibbon(dt){
  if(!G)return;const R=G.ribbon;if(!R.length)return;
  R[R.length-1].x-=30*dt;
  for(let i=R.length-2;i>=0;i--){const a=R[i],b=R[i+1];a.x+=(b.x-(a.end?14:7)-a.w-a.x)*Math.min(1,dt*18)}
  R.forEach(it=>{it.y+=(it.ty-it.y)*Math.min(1,dt*14);place(it)});
  while(R.length&&R[0].x+R[0].w<-20)R.shift().el.remove();
}

/* ---- 演出 ---- */
function fxCorrect(it){return;
  const cx=it.x+it.w/2,cy=it.y,b=document.createElement("div");b.className="burst";b.style.left=cx+"px";b.style.top=cy+"px";
  const col=RUN.combo>=20?"var(--gold)":it.lane?"var(--dn)":"var(--up)";
  b.innerHTML=Array.from({length:10},(_,k)=>{const a=k/10*6.283,r=34+rnd(24);return `<i style="--dx:${(Math.cos(a)*r).toFixed(0)}px;--dy:${(Math.sin(a)*r).toFixed(0)}px;background:${col}"></i>`}).join("");
  $("fx").appendChild(b);setTimeout(()=>b.remove(),520);
}

/* ===== チャンク君の顔（ふつう・にっこり・目を回す・あせり・びっくり）。CSSの --fN 〜 --fO に入れて使う ===== */
function faceSVG(k){const O="#4a3436",E=`<ellipse cx="27" cy="31" rx="3.2" ry="4.2" fill="${O}"/><ellipse cx="45" cy="31" rx="3.2" ry="4.2" fill="${O}"/>`;
  const eyes={N:E,S:E,O:`<ellipse cx="27" cy="30" rx="3.6" ry="4.8" fill="${O}"/><ellipse cx="45" cy="30" rx="3.6" ry="4.8" fill="${O}"/>`,
    J:`<path d="M23 32q4-5.5 8 0M41 32q4-5.5 8 0" fill="none" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/>`,
    D:`<path d="M24 27l6 7M30 27l-6 7M42 27l6 7M48 27l-6 7" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>`}[k];
  const wavy=`<path d="M30 41q3-3 6 0t6 0" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`;
  const mouth={N:`<path d="M31.5 37.5q4.5 8 9 0z" fill="#e8737a" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>`,
    J:`<path d="M30 36.5q6 10 12 0z" fill="#e8737a" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>`,D:wavy,S:wavy,
    O:`<ellipse cx="36" cy="41" rx="3.6" ry="4.4" fill="#e8737a" stroke="${O}" stroke-width="1.8"/>`}[k];
  const ex=k==="S"?`<path d="M57 10q4.5 6.5 0 10q-4.5-3.5 0-10z" fill="#9fd4ff" stroke="${O}" stroke-width="1.2"/>`:k==="J"?`<path d="M15 7l2 5M23 2v6M8 13l5 3" stroke="#ffd166" stroke-width="2.4" stroke-linecap="round"/>`:"";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 60"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".72" stop-color="#f5f6fc"/><stop offset="1" stop-color="#e3e8f8"/></linearGradient></defs><ellipse cx="7" cy="27" rx="5" ry="7" transform="rotate(-28 7 27)" fill="${O}"/><ellipse cx="27" cy="55.5" rx="6" ry="4" fill="${O}"/><rect x="9" y="8" width="52" height="46" rx="22" fill="url(#g)" stroke="${O}" stroke-width="2.6"/><ellipse cx="21" cy="40" rx="5.5" ry="3.6" fill="#f4aaa2" opacity=".85"/><ellipse cx="51" cy="40" rx="5.5" ry="3.6" fill="#f4aaa2" opacity=".85"/>${eyes}${mouth}${ex}</svg>`}
["N","J","D","S","O"].forEach(k=>document.documentElement.style.setProperty("--f"+k,`url("data:image/svg+xml,${encodeURIComponent(faceSVG(k))}")`));
/* ===== 花火と、答えたチャンク君が集まる場所 ===== */
const FWC=["#ffd166","#7cc4ff","#ff8fab","#8ef0c5","#ffb23e","#ffffff","#c3a6ff"];
function fireworks(host,x,y,n,spread){const b=document.createElement("div");b.className="fw";b.style.left=x+"px";b.style.top=y+"px";let h="<b></b>";
  for(let k=0;k<n;k++){const a=k/n*6.283+Math.random()*.3,r=spread*(.55+Math.random()*.5),c=FWC[(k+rnd(3))%FWC.length];
    h+=`<i class="${k%3?"":"st"}" style="--dx:${(Math.cos(a)*r).toFixed(0)}px;--dy:${(Math.sin(a)*r).toFixed(0)}px;--c:${c};--t:${(.7+Math.random()*.35).toFixed(2)}s"></i>`}
  b.innerHTML=h;host.appendChild(b);setTimeout(()=>b.remove(),1250)}
function crowd(){let c=$("crowd");if(!c){c=document.createElement("div");c.id="crowd";c.className="crowd";$("txt").appendChild(c)}return c}
function mkMini(lane,segs,joy){const m=document.createElement("i");m.className="mk l"+lane+(joy?" j":"");m.style.setProperty("--d",(Math.random()*1.6).toFixed(2)+"s");
  m.innerHTML='<b class="h"></b>'+"<s></s>".repeat(Math.max(1,Math.min(4,segs)));return m}
function segsOf(it){return it.kind===1?1:it.ci!=null&&G&&G.p.chunks[it.ci]?G.p.chunks[it.ci].tk.length:Math.max(1,String(it.en||"").split(/\s+/).length)}
/* 上の空きの、大きなチャンク君（1匹）。答えると大きくなり（速く続けるほど大きく）、時間がたつとしぼむ。育ちきると破裂する */
const BK={S:1,last:0};
function bigK(){const c=crowd();let k=c.querySelector(".mk.big");
  if(!k){k=document.createElement("i");k.className="mk big pop";k.innerHTML='<b class="h"></b>';c.appendChild(k);setTimeout(()=>k.classList.remove("pop"),420);bkApply(k)}return k}
function bkApply(k){k=k||bigK();const c=crowd(),max=Math.max(2,Math.min(4.2,(c.clientHeight-10)/31));k.style.setProperty("--sc",(1.6+(max-1.6)*(BK.S-1)/2).toFixed(2))}
function bkGrow(){const now=performance.now(),dt=(now-BK.last)/1000;BK.last=now;BK.S=Math.min(3,BK.S+(dt<1.6?.42:dt<3?.3:.18));
  const k=bigK();k.classList.remove("sad");k.classList.add("j");clearTimeout(BK.t);BK.t=setTimeout(()=>k.classList.remove("j"),700);bkApply(k);if(BK.S>=3)bkBurst(false)}
function bkShrink(v){if(!$("crowd"))return;BK.S=Math.max(1,BK.S-v);const k=bigK();k.classList.add("sad");setTimeout(()=>k.classList.remove("sad"),800);bkApply(k)}
setInterval(()=>{if(RUN&&G&&G.started&&!G.over&&!PAUSED&&BK.S>1&&$("crowd")){BK.S=Math.max(1,BK.S-.018);bkApply()}},150);   // 1秒に約0.12しぼむ
function joinCrowd(it,el,segs){
  const k=bigK(),f=mkMini(it.lane||0,0,true);f.innerHTML='<b class="h"></b>';f.classList.add("mkfly");document.body.appendChild(f);
  const a=el.getBoundingClientRect(),b=k.getBoundingClientRect();
  const sx=a.left-12,sy=a.top+a.height/2-16,tx=b.left+b.width/2-16,ty=b.top+b.height/2-15,mx=(sx+tx)/2,my=Math.min(sy,ty)-60;
  el.animate([{opacity:1},{opacity:0}],{duration:160,fill:"forwards"});setTimeout(()=>el.remove(),170);
  f.animate([{transform:`translate(${sx}px,${sy}px) scale(1.2)`},{transform:`translate(${mx}px,${my}px) scale(1)`,offset:.45},{transform:`translate(${tx}px,${ty}px) scale(.5)`,opacity:.5}],{duration:480,easing:"cubic-bezier(.3,.7,.4,1)"})
   .onfinish=()=>{f.remove();if(k.isConnected)bkGrow()};
}
/* 破裂：小さなチャンク君が花火のように散る。散り方は5種類（輪・二重の輪・らせん・噴水・ハート） */
const BPAT=["ring","double","spiral","fountain","heart"];
function fwLayer(){let l=document.querySelector(".fwl");if(!l){l=document.createElement("div");l.className="fwl";document.body.appendChild(l)}return l}
function burstMinis(cx,cy,big){const pat=BPAT[rnd(BPAT.length)],n=pat==="double"?24:pat==="heart"?22:18,R=Math.min(innerWidth,innerHeight)*(big?.36:.28);
  for(let i=0;i<n;i++){let x,y,delay=0,fall=36;
    if(pat==="ring"){const a=i/n*6.283;x=Math.cos(a)*R;y=Math.sin(a)*R}
    else if(pat==="double"){const k=i%2,a=(i>>1)/(n/2)*6.283+(k?.13:0),r=R*(k?.55:1);x=Math.cos(a)*r;y=Math.sin(a)*r}
    else if(pat==="spiral"){const a=i*.7,r=R*(.25+i/n*.85);x=Math.cos(a)*r;y=Math.sin(a)*r;delay=i*32}
    else if(pat==="fountain"){const a=-Math.PI/2+(Math.random()-.5)*1.7,r=R*(.6+Math.random()*.6);x=Math.cos(a)*r;y=Math.sin(a)*r;fall=R*.9}
    else{const t=i/n*6.283;x=16*Math.pow(Math.sin(t),3)*R/17;y=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*R/17}
    const m=document.createElement("i");m.className="bm"+(i%3?"":" n");document.body.appendChild(m);
    const rot=(Math.random()-.5)*140,sc=.8+Math.random()*.5;
    m.animate([{transform:`translate(${cx-14}px,${cy-13}px) scale(.3)`,opacity:1},{transform:`translate(${cx-14+x}px,${cy-13+y}px) scale(${sc}) rotate(${rot}deg)`,opacity:1,offset:.55},
      {transform:`translate(${cx-14+x}px,${cy-13+y+fall}px) scale(${sc*.8}) rotate(${rot*1.4}deg)`,opacity:0}],{duration:1350,delay,easing:"cubic-bezier(.2,.75,.35,1)",fill:"both"}).onfinish=()=>m.remove()}
  const L=fwLayer();for(let k=0;k<(big?4:2);k++)setTimeout(()=>fireworks(L,cx+(Math.random()-.5)*R*1.2,cy+(Math.random()-.5)*R*.8,18,R*.45),120+k*160);
  return pat}
function bkBurst(final){const c=$("crowd"),k=c&&c.querySelector(".mk.big");if(!k)return;const r=k.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  if(final&&BK.S<1.15){k.classList.add("j");return}
  k.classList.add("j");k.animate([{scale:"1"},{scale:"1.25"},{scale:"0",opacity:0}],{duration:260,easing:"ease-in",fill:"forwards",composite:"add"});
  try{SE.clear()}catch(e){}if(RUN&&!final)voice("wow");
  setTimeout(()=>{burstMinis(cx,cy,final||BK.S>=3);k.remove();BK.S=1;if(!final)setTimeout(()=>{if(RUN&&$("crowd"))bigK()},700)},240)}
function crowdHop(wave){bkBurst(!!wave)}
const CWORD={5:"Nice!",10:"Great!",15:"Excellent!!",20:"Amazing!!",25:"Fantastic!!",30:"Wonderful!!",40:"Incredible!!",50:"Perfect!!"};
let popTurn=0;
function comboPop(){
  const c=RUN.combo;if(c<5||c%5)return;
  $("arena").querySelectorAll(".cpop").forEach(e=>e.remove());
  const who=popTurn++%2?"boy":"girl";const d=document.createElement("div");d.className="cpop";
  d.innerHTML=`<div class="say"><b>${CWORD[c]||(c%20?"Excellent!!":"Unstoppable!!")}</b><span>${c} COMBO</span></div><img alt="" src="img/chara/${who}/joy.webp">`;
  $("arena").appendChild(d);if(innerHeight>innerWidth){const t=$("txt");d.style.top=Math.max(4,t.offsetTop+t.offsetHeight-d.offsetHeight+6)+"px"}setTimeout(()=>d.remove(),innerHeight>innerWidth?1700:1300);
  if(c%10===0)voice({10:"nice",20:"excellent",30:"wow",40:"excellent",50:"perfect"}[c]||"wow");
}
function penFx(t){const d=document.createElement("div");d.className="pen";d.textContent=t;$("sPlay").appendChild(d);setTimeout(()=>d.remove(),900)}
function face(){} // 表情はコンボ演出とリザルトで見せる
function hud(){
  if(!G)return;$("hudCount").textContent=`${G.done}/${G.total}`;$("hudProg").style.width=(G.done/G.total*100)+"%";
  $("hudTime").textContent=(G.t+G.pen).toFixed(1);
  $("hudCombo").innerHTML=RUN&&RUN.combo>=3?`${RUN.combo}<small>COMBO</small>`:"";
}

/* ---- 一時停止 ---- */
$("btnPause").onclick=()=>pause();
function pause(){if(!RUN||PAUSED||$("sPlay").hidden)return;PAUSED=true;hush();if(AC)AC.suspend();
  overlay(`<div class="sheet"><h3>一時停止</h3><button class="sbtn pri" id="pRes">つづける</button>${!isFull()&&canFull()?'<button class="sbtn" id="pFull">全画面にする</button>':''}<div class="row2"><button class="sbtn" id="pRe">最初からやり直す</button><button class="sbtn" id="pQuit">やめる</button></div></div>`,b=>{
    const go=()=>{closeOv();PAUSED=false;if(AC)AC.resume();LAST=performance.now()};
    b.querySelector("#pRes").onclick=go;const pf=b.querySelector("#pFull");if(pf)pf.onclick=()=>{goFull();go()};
    b.querySelector("#pRe").onclick=()=>{go();const f=RUN.from;endRun();startRun(f)};
    b.querySelector("#pQuit").onclick=()=>{go();endRun();bgmStart(84,"menu");if(CUR&&CUR.word){renderWords();show("sWords")}else{renderDetail();show("sDetail")}}})}
function endRun(){cancelAnimationFrame(RAF);hush();bgmStop();if(G)G.over=true;G=null;RUN=null;$("arena").querySelectorAll(".inter,.cpop").forEach(e=>e.remove())}

/* ---- 段の終わり：ランクと星をちらっと見せて、そのまま次の段へ ---- */
function rankOf(acc,time,par){const rank=acc>=.95&&time<=par?"S":acc>=.85&&time<=par*1.35?"A":acc>=.7?"B":"C";return {rank,stars:acc<.6?0:rank==="S"?3:acc>=.8?2:1}}
function stageEnd(){
  const g=G;g.over=true;g.started=false;hush();try{bkBurst(true)}catch(e){}
  const acc=g.first/g.total,time=g.t+g.pen,par=g.total*PAR[g.st]*(1+(g.p.lv-1)*.15),{rank,stars}=rankOf(acc,time,par);
  RUN.res.push({st:g.st,acc,time,par,rank,stars,total:g.total,first:g.first});
  const prev=rec(g.p.id,g.st,"ta");
  if(!prev||stars>prev.stars||(stars===prev.stars&&time<prev.time)){const b=SV.best[g.p.id]=SV.best[g.p.id]||{};b[g.st]=b[g.st]||{};b[g.st].ta={time:+time.toFixed(2),acc,stars:Math.max(stars,prev?prev.stars:0),rank}}save();
  const rc={S:"var(--gold)",A:"var(--accent)",B:"var(--great)",C:"var(--muted)"}[rank];
  setTimeout(()=>{if(RUN&&G===g){
    $("layer").querySelectorAll(".card:not(.rib)").forEach(e=>e.remove());
    inter(`<div class="sub">STAGE ${g.st} CLEAR</div><div class="big" style="color:${rc}">${rank}</div><div class="stars2">${[0,1,2].map(i=>`<span class="${i<stars?"on":""}">★</span>`).join("")}</div><div class="note">${time.toFixed(1)}秒 ・ 一発正解 ${Math.round(acc*100)}%</div>`,1300);
    SE.clear();for(let i=0;i<stars;i++)setTimeout(()=>SE.star(i),250+i*150);
    setTimeout(()=>{if(!RUN||G!==g)return;if(g.st<4&&!g.p.word)beginStage(g.st+1);else finalResult()},1300)}},200);
}
function finalResult(){
  const r=RUN,p=r.p;const T=r.res.reduce((a,x)=>a+x.time,0),par=r.res.reduce((a,x)=>a+x.par,0),tot=r.res.reduce((a,x)=>a+x.total,0),fst=r.res.reduce((a,x)=>a+x.first,0),acc=fst/tot;
  const {rank}=rankOf(acc,T,par);let isNew=false;
  if(r.from===1){const b=SV.best[p.id]=SV.best[p.id]||{};if(!b.run||T<b.run.time){isNew=!!b.run;b.run={time:+T.toFixed(2),rank}}save()}
  bgmStop();voice(rank==="S"?"perfect":"stage_clear");
  const rc={S:"var(--gold)",A:"var(--accent)",B:"var(--great)",C:"var(--muted)"}[rank];
  $("resRank").textContent=rank;$("resRank").style.setProperty("--rc",rc);
  $("resLab").textContent=p.word?"単語練習":r.from===1?"通しクリア":`STAGE ${r.from} から`;$("resTitle").textContent=p.title;
  $("resTot").innerHTML=`${T.toFixed(1)}<small style="font-size:13px">s</small>${isNew?'<span class="newrec">NEW RECORD</span>':""}<div class="sub2">一発正解 ${Math.round(acc*100)}%・最大 ${r.maxc}コンボ</div>`;
  $("resChara").src=chara(rank==="S"||rank==="A"?"joy":rank==="B"?"normal":"think");
  $("resStages").innerHTML=r.res.map(x=>`<div><span>${x.st}. ${STAGES[x.st-1].name}</span><b style="color:${{S:"var(--gold)",A:"var(--accent)",B:"var(--great)",C:"var(--muted)"}[x.rank]}">${x.rank}</b><span class="s">${"★".repeat(x.stars)}<span style="color:var(--line)">${"★".repeat(3-x.stars)}</span></span><span class="n">${x.time.toFixed(1)}s</span></div>`).join("");
  const rv=r.review;
  $("review").innerHTML=(rv.length?`<h4>まちがえた・時間切れ（${rv.length}）</h4>`+rv.map((x,k)=>{const it=x.it,c=it.ci!=null?p.chunks[it.ci]:null;
    const e=it.kind===1?`<b>${esc(it.en)}</b>`:it.kind===2?esc(it.en):chunkHTML(c,it.gs,it.ge,it.ans);const j=it.kind===1?it.ans:c.ja;
    return `<div class="rv"><div><div class="e">${e}</div><div class="j">${esc(j)}</div></div><button data-k="${k}" aria-label="聞く">🔊</button></div>`}).join("")
    :`<h4>ミスなし！ 次はタイムを縮めよう</h4>`);
  $("review").querySelectorAll("button").forEach(b=>b.onclick=()=>{const it=rv[+b.dataset.k].it;say(it.kind===1?it.en:plain(p.chunks[it.ci]))});
  $("resBtns").innerHTML=`<button class="sbtn pri" id="rRe">もう一度</button><button class="sbtn" id="rRead">📖 振り返り：本文を読む</button><button class="sbtn" id="rBack">もどる</button>`;
  $("rRe").onclick=()=>{SE.tap();startRun(1)};
  $("rRead").onclick=()=>openReading("post");
  $("rBack").onclick=()=>{SE.tap();bgmStart(84,"menu");renderDetail();show("sDetail")};
  if(p.word){$("rRead").remove();$("rBack").onclick=()=>{SE.tap();bgmStart(84,"menu");renderWords();show("sWords")}}
  cancelAnimationFrame(RAF);G=null;RUN=null;show("sResult");
}
{const L0=layout;layout=function(){L0.apply(this,arguments);try{posRep()}catch(e){}};const R0=renderGrid;renderGrid=function(l){R0.apply(this,arguments);if(l===1)try{posRep()}catch(e){}}}
$("rep").addEventListener("pointerdown",repTap);$("side").addEventListener("pointerdown",e=>{if(e.target.closest(".ch"))LASTCH=performance.now()},true);
initWDB();
window.__G=()=>G;
