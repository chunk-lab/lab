import { $, ENV, POSJ, STAGES, SV, addEventListener, cap, chara, esc, onDoc, rec, rnd, save, setTimeout, shuf } from './base.js';
import { BK, bigK, bkBurst, bkShrink, comboPop, crowd, face, fireworks, hud, joinCrowd, penFx, segsOf } from './fx.js';
import { CUR, WANTF, canFull, closeOv, fromGap, goFull, isFull, openReading, overlay, plain, renderDetail, show } from './screens.js';
import { AC, SE, TTS, ac, bgmStart, bgmStop, hush, say, speak, speakAfter, voice } from './sound.js';
import { initWDB, renderWords, wja } from './words.js';
export const tutFace=(w,f)=>`${ENV.base}img/chara/${w==="b"?"boy":"girl"}/${f||"normal"}.webp`;
/* ================= ゲーム ================= */
export let RUN=null,G=null,PAUSED=false,RAF=0,LAST=0;
export const TRAV={1:9,2:12,3:12,4:15};     // 右端から左端まで流れる秒数（上級ほど少しゆっくり）
export const PAR={1:1.7,2:2.5,3:2.5,4:2.3};   // 1問あたりの目標秒数
export const MAXVIS={1:4,2:4,3:3};
export let W=700,H=200,XJ=140;

// 穴の位置と選択肢を1つ選ぶ（穴うめの候補から。作者が決めた誤答があればそれを優先して混ぜる）
export function gapPick(c){
  const auth=c.s3.filter(x=>Array.isArray(x[1]));const pick=(auth.length&&Math.random()<.45)?auth[rnd(auth.length)]:c.s3[rnd(c.s3.length)];
  const [ti,src]=pick;const ans=c.tk[ti][1];let ds;
  if(Array.isArray(src))ds=src.slice(0,3);else{const own=c.tk.map(t=>t[1].toLowerCase());ds=shuf(POOL[src].filter(w=>w!==ans.toLowerCase()&&!own.includes(w))).slice(0,3)}
  const up=/^[A-Z]/.test(ans)&&ans!=="I";ds=ds.map(d=>up?cap(d):d);
  return {gs:ti,ge:ti+1,ans,opts:shuf([ans,...ds])}}
export function buildItems(st,p){
  if(st===1)return shuf(p.words).map(w=>({kind:1,en:w[0],pos:w[1],ans:w[2]}));
  const n=Math.min(p.lv===1?14:16,p.chunks.length);
  if(st===2)return shuf(p.chunks.map((c,i)=>i)).slice(0,n).map(i=>({kind:2,ci:i,en:plain(p.chunks[i]),ans:p.chunks[i].ja}));
  if(st===3)return shuf(p.chunks.map((c,i)=>i).filter(i=>p.chunks[i].s3.length)).slice(0,n).map(i=>({kind:3,ci:i,...gapPick(p.chunks[i]),ja:p.chunks[i].ja}));
  // 長文：穴の位置は遊ぶたびにランダム（つなぎの穴か、穴うめの候補から）
  return p.chunks.map((c,i)=>{const gp=c.s3.length&&Math.random()<.6?gapPick(c):{gs:c.g[0],ge:c.g[1],ans:c.g[2][0],opts:shuf(c.g[2])};return {kind:4,ci:i,...gp,ja:c.ja,lane:i%2}});
}
export function chunkHTML(c,gs,ge,fill){
  const h=[];for(let j=0;j<c.tk.length;j++){const t=c.tk[j];
    if(j===gs){h.push(esc(c.tk[gs][0])+(fill==null?`<span class="blank">?</span>`:`<b>${esc(fill)}</b>`)+esc(c.tk[ge-1][2]));j=ge-1;continue}
    h.push(esc(t[0]+t[1]+t[2]))}
  return h.join(" ")}

/* ---- 通しプレイ ---- */
export function startRun(from){
  goFull();hush();closeOv();RUN={p:CUR,from,res:[],combo:0,maxc:0,review:[],flow:true,t0:Date.now(),missed:[]};
  show("sPlay");ac();bgmStart(118,"game");crowd().innerHTML="";BK.S=1;setTimeout(()=>{try{bigK()}catch(e){}},300);
  buildGrids();cancelAnimationFrame(RAF);LAST=performance.now();RAF=requestAnimationFrame(loop);
  const beat=60/118*1000;
  [3,2,1].forEach((n,i)=>setTimeout(()=>{if(!RUN)return;inter(`<div class="cd">${n}</div>`,0);SE.count(false)},i*beat));
  setTimeout(()=>{if(RUN)beginStage(from)},3*beat);
}
export function inter(html,ms){const f=$("arena");f.querySelectorAll(".inter").forEach(e=>e.remove());if(!html)return;const d=document.createElement("div");d.className="inter";d.innerHTML=html;f.appendChild(d);if(ms)setTimeout(()=>d.remove(),ms);return d}
export function beginStage(st){
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
export let LY=[60,140];
export function layout(){const r=$("field").getBoundingClientRect();W=r.width;H=r.height;XJ=Math.round(Math.min(W*.18,150));$("zone").style.left=XJ+"px";
  // 縦画面：選択肢は帯の下にあるので、レーンは帯の真ん中
  LY=innerHeight>innerWidth?[H/2,H/2]:[0,1].map(l=>{const g=$("g"+l).getBoundingClientRect();return g.top+g.height/2-r.top});$("seam").style.top=((LY[0]+LY[1])/2)+"px"}
// レーンの高さ＝それぞれの4択（2×2）の真ん中
// レーンは真ん中に寄せる（上下の間は日本訳が入るぶんだけ）
export function laneY(l){const mid=(LY[0]+LY[1])/2;if(!G||G.st===2||G.st===3)return mid;const fs=+(SV.set.fs||1.2),ch=fs*15*1.25+12,off=ch/2+(G.st===4?fs*9:7);const o=innerHeight>innerWidth&&G.st===4?fs*15*1.25+10:off;return mid+(l?o:-o)}

   // 縦でも横でも遊べる

export function mkCard(it){
  const e=document.createElement("div");e.className="card l"+it.lane;const p=G.p;
  if(it.kind===1)e.innerHTML=`${POSJ[it.pos]?`<span class="pos ${it.pos}">${POSJ[it.pos]}</span>`:""}${esc(it.en)}`;
  else if(it.kind===2){e.textContent=it.en}
  else{e.innerHTML=chunkHTML(p.chunks[it.ci],it.gs,it.ge)}
  e.insertAdjacentHTML("beforeend",'<span class="ft"></span>');
  $("layer").appendChild(e);const mw=innerHeight>innerWidth?Math.round(W*.6):W-24;if(e.offsetWidth>mw){e.style.whiteSpace="normal";e.style.width=mw+"px"}/* 縦画面は幅を6割までにして、右から動いて見えるように */it.el=e;it.w=e.offsetWidth;it.h=e.offsetHeight;it.y=laneY(it.lane);it.ready=0;place(it);return e}
export function place(it){it.el.style.transform=`translate3d(${it.x.toFixed(1)}px,${(it.y-it.h/2).toFixed(1)}px,0)`}
export function setJa(it,txt){let j=it.el.querySelector(".jp");if(!txt){j&&j.remove();return}if(!j){j=document.createElement("span");j.className="jp";it.el.appendChild(j)}j.textContent=txt}

/* ---- ループ ---- */
export function loop(){
  RAF=requestAnimationFrame(loop);if(PAUSED)return;
  const tn=performance.now(),dt=Math.min(.05,(tn-LAST)/1000);LAST=tn;
  if(!G||!G.started||G.over){if(G)stepRibbon(dt);return}
  G.t+=dt;G.lanes.forEach(L=>L.lock=Math.max(0,L.lock-dt));G.lock4=Math.max(0,(G.lock4||0)-dt);
  G.st<=3?stepLanes(dt):stepLong(dt);heal();
  stepRibbon(dt);hud();
  if(G.done>=G.total)stageEnd();
}
export function speedOf(){return (W+40)/(TRAV[G.st]+(G.p.lv-1))*(SV.set.spd||.5)}
// 右端から全体が見えるところまでは一気に出てきて、そこからゆっくり
export const ENTER=1100;export const inView=it=>W-it.w-12;
// 制限時間：先頭になって全部見えてから一定時間。その時間でちょうど左端に着く速さで動かす（長い文でも同じ時間）
export const LIMIT={1:9,2:13,3:13,4:16};export function limitOf(){return (LIMIT[G.st]+(G.p.lv-1))*(.5/(SV.set.spd||.5))*(innerHeight>innerWidth?1.25:1)}/* 縦画面は読み取りにくいので1.25倍 */
export function moveFront(it,v,dt){const ex=inView(it);if(it.x>ex){it.x=Math.max(ex,it.x-ENTER*dt);return v*2}if(it.v==null)it.v=Math.max(3,(it.x-38)/limitOf());it.age=(it.age||0)+dt;let sp=it.v;if(false){const over=it.x-W*.5;if(over>0)sp+=over*2.4*(SV.set.spd||.5);else it.boost=false}it.x=Math.max(6,it.x-sp*dt);return sp}
export function stepLanes(dt){
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
export function stepLong(dt){
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
export function heal(){const ok=(S,f)=>S&&S.some(x=>x&&x.text===f.ans);
  if(G.st===4){const f=G.cq[0];if(f&&!ok(G.s4,f))front4()}
  else if(G.st>=2){const f=G.lanes[0].q[0];if(f&&!ok(G.s4,f))laneFront(G.lanes[0])}
  else G.lanes.forEach(L=>{const f=L.q[0];if(f&&!ok(L.slots,f))laneFront(L)})}
// 残り時間のバー（長文：読み上げヒントまでの時間）
export function tbar(it,r){if(!it.el)return;if(!it.tb){it.tb=document.createElement("span");it.tb.className="tb";it.tb.innerHTML="<i></i>";it.el.appendChild(it.tb)}it.tb.firstChild.style.transform=`scaleX(${Math.max(0,r)})`;it.tb.classList.toggle("low",r<.3);it.el.classList.toggle("sweat",r<.3)}
export function hint4(it){it.hintT=G.t;it.el.classList.add("spk");speak(plain(G.p.chunks[it.ci]),()=>{it.el&&it.el.classList.remove("spk")},"hint");face("think")}

/* ---- 先に読み上げ（単語・チャンク）：手前の上下を順に読む。答えたら次の語へ ---- */
export function isFront(it){return G.lanes[it.lane].q[0]===it}
export function readEnq(it,first){if(!it||G.rq.includes(it))return;first?G.rq.unshift(it):G.rq.push(it);readPump()}
export function readPump(){
  if(!G||G.rqCur||!G.started)return;
  while(G.rq.length){const it=G.rq.shift();if(!isFront(it))continue;G.rqCur=it;it.el.classList.add("spk");const g=G;
    speak(it.en,()=>{it.el&&it.el.classList.remove("spk");if(G!==g)return;it.heard=G.t;if(G.rqCur===it)G.rqCur=null;G.rqLast=G.t;readPump()},"read");return}
}
export function readTick(){
  if(G.rqCur&&!isFront(G.rqCur)){G.rqCur.el.classList.remove("spk");G.rqCur=null}
  if(G.st===1){ // 単語：持ち時間の半分でもう一度、残りわずかになったら何回か読み直す
    readPump();return}   /* 読み直しは🔊ボタンを押したときだけ */
  if(!G.rqCur&&!G.rq.length){const fr=G.lanes.map(L=>L.q[0]).filter(f=>f&&f.x<W-20);
    if(fr.length&&G.t-G.rqLast>2.2){fr.sort((a,b)=>(a.heard??-1)-(b.heard??-1));readEnq(fr[0])}}
  else readPump();
}

/* ---- 4択（上＝上レーン、下＝下レーン） ---- */
export function buildGrids(){[0,1].forEach(l=>{const g=$("g"+l);g.innerHTML=[0,1,2,3].map(i=>`<button class="ch" data-i="${i}"><span class="tx"></span></button>`).join("");
  g.querySelectorAll(".ch").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();press(l,+b.dataset.i)}))})}
// 長文の段：上の4択の下段＋下の4択の上段＝真ん中の4つ
export function slotAt(l,i){if(G.st>=2){const k=l===0?(i>=2?i-2:-1):(i<2?i+2:-1);return k<0?undefined:(G.s4?G.s4[k]:null)}const L=G.lanes[l];return L.slots?L.slots[i]:null}
export function fitCh(b,t){t.style.fontSize="";let f=parseFloat(getComputedStyle(t).fontSize),n=0;while(n++<12&&b.scrollHeight>b.clientHeight+1&&f>8.5){f-=.6;t.style.fontSize=f+"px"}}   
/* 🔊：単語のステージだけ。押すと、時間の残りが少ない順に先頭の単語を読み直す。答えた直後0.3秒は反応しない（指が流れて押すのを防ぐ） */
export let LASTCH=0;
export function posRep(){const r=$("rep"),sd=$("side");if(!r)return;const on=!!(G&&G.st===1);r.hidden=!on;sd.classList.toggle("wd",on);if(!on)return;const g=$("g0"),g1=$("g1");r.style.top=((g.offsetTop+g.offsetHeight+g1.offsetTop)/2)+"px"}
export function repTap(e){e.preventDefault();e.stopPropagation();if(!G||G.st!==1||!G.started||G.over||PAUSED)return;if(performance.now()-LASTCH<300)return;
  const lim=limitOf(),fr=G.lanes.map(L=>L.q[0]).filter(f=>f&&f.v!=null).sort((a,b)=>b.age-a.age);if(!fr.length)return;
  fr.slice().reverse().forEach(f=>{G.rq=G.rq.filter(x=>x!==f);readEnq(f,true)});const r=$("rep");r.classList.add("on");setTimeout(()=>r.classList.remove("on"),400)}
export function renderGrid(l){
  const g=$("g"+l),en=G.st>=3,st4=G.st>=2,cl=G.st===1?l:G.st===4?(G.cq[0]?G.cq[0].lane:0):0;g.classList.toggle("c0",cl===0);g.classList.toggle("c1",cl===1);g.classList.toggle("off",st4?!G.s4:!G.lanes[l].slots);g.classList.toggle("m4",st4);
  [...g.children].forEach((b,i)=>{const s=slotAt(l,i),tx=s?s.text:"";b.classList.toggle("hide",s===undefined);const el=b.querySelector(".tx");
    if(el.textContent!==tx){el.textContent=tx;b.classList.remove("swap");void b.offsetWidth;b.classList.add("swap");fitCh(b,el)}
    b.classList.toggle("en",en);b.classList.toggle("long",tx.length>(en?22:16));b.classList.remove("ng","ok");b.classList.toggle("dis",!!(s&&s.dis))})}
export function laneFront(L){
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
export function distract(f,ex,old){
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
export function front4(){
  const f=G.cq[0];G.lanes.forEach(L=>L.slots=null);
  G.cq.forEach((it,k)=>{if(k)setJa(it,null);it.el.classList.toggle("front",k===0);it.el.classList.toggle("next",k>0)});
  G.s4=f?f.opts.map(t=>({text:t})):null;
  renderGrid(0);renderGrid(1);
}

export function press(l,i){
  if(!G||!G.started||G.over||PAUSED)return;
  if(G.st>=2){const s=slotAt(l,i),f=G.st===4?G.cq[0]:G.lanes[0].q[0];if(!s||s.dis||!f||G.lock4>0)return;const btn=$("g"+l).children[i],LL=G.st===4?G.lanes[f.lane]:G.lanes[0];if(s.text===f.ans)correct(LL,f,btn);else wrong(LL,f,s,btn);return}
  const L=G.lanes[l];if(L.lock>0||!L.slots)return;
  const f=G.st<=3?L.q[0]:G.cq[0];if(!f||f.lane!==l)return;
  const s=L.slots[i];if(!s||s.dis)return;const btn=$("g"+l).children[i];
  if(s.text===f.ans)correct(L,f,btn);else wrong(L,f,s,btn);
}
export function resolve(it){G.done++;if(it.flawed)RUN.review.push({st:G.st,it,p:G.p});else G.first++}
export function correct(L,it,btn){
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
export function wrong(L,it,s,btn){
  G.wrong++;RUN.combo=0;SE.ng();face("surprise");it.flawed=true;s.dis=true;
  noteMiss(it);
  try{bkShrink(.5)}catch(e){}
  if(it.el){const e=it.el;e.classList.remove("oops");void e.offsetWidth;e.classList.add("oops");setTimeout(()=>e.classList.remove("oops"),460)}
  btn.classList.remove("ng");void btn.offsetWidth;btn.classList.add("ng","dis");
  G.pen+=2;penFx("+2.0");
  if(navigator.vibrate)try{navigator.vibrate(30)}catch(e){}
}
export function missIt(L,it){
  try{bkShrink(.6)}catch(e){}
  noteMiss(it);
  L.q.shift();it.flawed=true;resolve(it);G.miss++;RUN.combo=0;SE.miss();face("sad");G.pen+=3;penFx("+3.0");
  if(G.rqCur===it)G.rqCur=null;
  it.el.classList.add("miss");it.el.classList.remove("spk");setJa(it,null);const a=document.createElement("div");a.className="ans";a.textContent=it.ans;it.el.appendChild(a);
  const g=G,c=it.ci!=null?G.p.chunks[it.ci]:null;setTimeout(()=>{if(G===g&&it.el.isConnected)flyTo(it,c&&G.st===3?chunkHTML(c,it.gs,it.ge,it.ans)+`<i>${esc(c.ja)}</i>`:`${esc(it.en)}<i>${esc(it.ans)}</i>`,"bad")},650);
  laneFront(L);
}

/* ---- 答えたものは下の文章エリアへ飛んでいく（長文の段は1つの段落になっていく） ---- */
export function flyTo(it,html,cls){
  const el=it.el,g=G;if(!el||!el.isConnected)return;const segs=segsOf(it);
  if(cls==="bad"){el.classList.add("dizzy");el.animate([{opacity:1,translate:"0 0",rotate:"0deg"},{opacity:0,translate:"-10px 44px",rotate:"-18deg"}],{duration:650,easing:"ease-in",fill:"forwards"});setTimeout(()=>el.remove(),660);return}
  el.classList.remove("front","next","sweat","spk","oops");el.classList.add("joy");
  const go=()=>{if(!el.isConnected)return;el.style.animation="st-ccJump .26s ease-out forwards";const r=el.getBoundingClientRect(),fr=$("fx").getBoundingClientRect(),big=RUN&&RUN.combo>=10;
    fireworks($("fx"),r.left-fr.left+r.width/2,r.top-fr.top+r.height/2,big?18:12,big?64:48);setTimeout(()=>joinCrowd(it,el,segs),220)};
  const bl=el.querySelector(".blank"),btn=g&&g.lastBtn;
  if(bl&&btn&&it.ci!=null){   // 穴うめ：答えの体節が飛んできて、カチッとくっつく
    const pc=document.createElement("div");pc.className="piece";pc.textContent=it.ans;ENV.root.appendChild(pc);
    const a=btn.getBoundingClientRect(),b=bl.getBoundingClientRect();
    pc.animate([{transform:`translate(${a.left+a.width/2-24}px,${a.top}px) scale(.9)`},{transform:`translate(${b.left}px,${b.top-2}px) scale(1)`}],{duration:200,easing:"ease-in"}).onfinish=()=>{pc.remove();
      const c=g.p.chunks[it.ci];if(c){el.innerHTML=chunkHTML(c,it.gs,it.ge,it.ans)+'<span class="ft"></span>'}el.classList.add("snap");try{SE.merge()}catch(e){}setTimeout(go,130)};
  }else go();
}
export function toRibbon(it,bad){
  const c=G.p.chunks[it.ci],e=it.el;e.className="card rib"+(bad?" bad":"");e.style.maxWidth="none";
  e.innerHTML=chunkHTML(c,it.gs,it.ge,it.ans);it.w=e.offsetWidth;it.h=e.offsetHeight;it.ty=laneY(2);it.end=/[.?!;]["”]?$/.test(plain(c));
  G.ribbon.push(it);SE.merge();setTimeout(()=>e.classList.add("old"),900);
  const r=document.createElement("div");r.className="ring";r.style.cssText=`left:${it.x-6}px;top:${laneY(2)-it.h/2-6}px;width:${it.w+12}px;height:${it.h+12}px`;$("fx").appendChild(r);setTimeout(()=>r.remove(),420);
}
export function stepRibbon(dt){
  if(!G)return;const R=G.ribbon;if(!R.length)return;
  R[R.length-1].x-=30*dt;
  for(let i=R.length-2;i>=0;i--){const a=R[i],b=R[i+1];a.x+=(b.x-(a.end?14:7)-a.w-a.x)*Math.min(1,dt*18)}
  R.forEach(it=>{it.y+=(it.ty-it.y)*Math.min(1,dt*14);place(it)});
  while(R.length&&R[0].x+R[0].w<-20)R.shift().el.remove();
}

/* ---- 演出 ---- */
export function fxCorrect(it){return;
  const cx=it.x+it.w/2,cy=it.y,b=document.createElement("div");b.className="burst";b.style.left=cx+"px";b.style.top=cy+"px";
  const col=RUN.combo>=20?"var(--gold)":it.lane?"var(--dn)":"var(--up)";
  b.innerHTML=Array.from({length:10},(_,k)=>{const a=k/10*6.283,r=34+rnd(24);return `<i style="--dx:${(Math.cos(a)*r).toFixed(0)}px;--dy:${(Math.sin(a)*r).toFixed(0)}px;background:${col}"></i>`}).join("");
  $("fx").appendChild(b);setTimeout(()=>b.remove(),520);
}

/* 並べ直したあと、答えたチャンク君の場所も直す */

/* 開くたびに動かすこと（画面のボタンをつなぐ など）。game.js が呼ぶ */
export function init_play(){
  $("btnPause").onclick=()=>pause();
  $("rep").addEventListener("pointerdown",repTap);
  $("side").addEventListener("pointerdown",e=>{if(e.target.closest(".ch"))LASTCH=performance.now()},true);
  initWDB();
  window.__G=()=>G;
  addEventListener("resize",()=>{if(G&&!$("sPlay").hidden)layout()});
  onDoc("pointerdown",()=>{if(WANTF&&!isFull())goFull()},true);
  onDoc("fullscreenchange",()=>{ENV.root.classList.toggle("fsb",!!document.fullscreenElement);if(G&&!$("sPlay").hidden)setTimeout(layout,50)});
  addEventListener("keydown",e=>{if($("sPlay").hidden||!G)return;const m={"1":[0,0],"2":[0,1],"q":[0,2],"w":[0,3],"9":[1,0],"0":[1,1],"o":[1,2],"p":[1,3]}[e.key];
    if(m)press(m[0],m[1]);if(e.key==="Escape"||e.key===" ")pause()});
  if(!layout.__rep){const L0=layout;layout=function(){L0.apply(this,arguments);try{posRep()}catch(e){}};layout.__rep=1;const R0=renderGrid;renderGrid=function(l){R0.apply(this,arguments);if(l===1)try{posRep()}catch(e){}}}   // 1回だけ
}

/* ===== 一時停止・段の終わり・結果 ===== */
/* ---- 一時停止 ---- */

export function pause(){if(!RUN||PAUSED||$("sPlay").hidden)return;PAUSED=true;hush();if(AC)AC.suspend();
  overlay(`<div class="sheet"><h3>一時停止</h3><button class="sbtn pri" id="pRes">つづける</button>${!isFull()&&canFull()?'<button class="sbtn" id="pFull">全画面にする</button>':''}<div class="row2"><button class="sbtn" id="pRe">最初からやり直す</button><button class="sbtn" id="pQuit">やめる</button></div></div>`,b=>{
    const go=()=>{closeOv();PAUSED=false;if(AC)AC.resume();LAST=performance.now()};
    b.querySelector("#pRes").onclick=go;const pf=b.querySelector("#pFull");if(pf)pf.onclick=()=>{goFull();go()};
    b.querySelector("#pRe").onclick=()=>{go();const f=RUN.from;endRun();startRun(f)};
    b.querySelector("#pQuit").onclick=()=>{go();endRun();bgmStart(84,"menu");if(CUR&&CUR.word){renderWords();show("sWords")}else{renderDetail();show("sDetail")}}})}
/* まちがえた単語は、終わったときに勉強ノートへ（単語の段だけ。長いチャンクは入れない） */
function noteMiss(it){try{if(RUN&&it&&it.kind===1&&it.en&&it.ans&&!RUN.missed.some(x=>x.en===it.en))RUN.missed.push({en:it.en,ja:it.ans})}catch(e){}}
function reportDone(r,T,acc,rank){try{const p=r.p,wc=p.word?0:(p.chunks||[]).reduce((a,c)=>a+String(plain(c)).split(/\s+/).filter(Boolean).length,0);
  ENV.ctx&&ENV.ctx.report("done",{play:p.word?"stream.word":"stream.read",passage:p.word?undefined:p.id,set:p.word?p.id:undefined,whole:r.from===1,title:p.title,min:Math.round((Date.now()-r.t0)/6e3)/10,words:r.from===1?wc:0,score:Math.round(acc*100),rank,missed:r.missed,wl:p.word&&r.from===1?(p.words||[]).map(w=>[w[0],w[2]]):undefined,finished:true})}catch(e){}}
export function endRun(){cancelAnimationFrame(RAF);hush();bgmStop();if(G)G.over=true;G=null;RUN=null;$("arena").querySelectorAll(".inter,.cpop").forEach(e=>e.remove())}

/* ---- 段の終わり：ランクと星をちらっと見せて、そのまま次の段へ ---- */
export function rankOf(acc,time,par){const rank=acc>=.95&&time<=par?"S":acc>=.85&&time<=par*1.35?"A":acc>=.7?"B":"C";return {rank,stars:acc<.6?0:rank==="S"?3:acc>=.8?2:1}}
export function stageEnd(){
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
export function finalResult(){
  const r=RUN,p=r.p;const T=r.res.reduce((a,x)=>a+x.time,0),par=r.res.reduce((a,x)=>a+x.par,0),tot=r.res.reduce((a,x)=>a+x.total,0),fst=r.res.reduce((a,x)=>a+x.first,0),acc=fst/tot;
  const {rank}=rankOf(acc,T,par);let isNew=false;
  reportDone(r,T,acc,rank);
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
