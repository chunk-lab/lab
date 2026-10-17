import { $, ENV, rnd, setInterval, setTimeout } from './base.js';
import { G, PAUSED, RUN } from './play.js';
import { SE, voice } from './sound.js';
/* ===== チャンク君の顔（ふつう・にっこり・目を回す・あせり・びっくり）。CSSの --fN 〜 --fO に入れて使う ===== */
export function faceSVG(k){const O="#4a3436",E=`<ellipse cx="27" cy="31" rx="3.2" ry="4.2" fill="${O}"/><ellipse cx="45" cy="31" rx="3.2" ry="4.2" fill="${O}"/>`;
  const eyes={N:E,S:E,O:`<ellipse cx="27" cy="30" rx="3.6" ry="4.8" fill="${O}"/><ellipse cx="45" cy="30" rx="3.6" ry="4.8" fill="${O}"/>`,
    J:`<path d="M23 32q4-5.5 8 0M41 32q4-5.5 8 0" fill="none" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/>`,
    D:`<path d="M24 27l6 7M30 27l-6 7M42 27l6 7M48 27l-6 7" stroke="${O}" stroke-width="2.4" stroke-linecap="round"/>`}[k];
  const wavy=`<path d="M30 41q3-3 6 0t6 0" fill="none" stroke="${O}" stroke-width="2" stroke-linecap="round"/>`;
  const mouth={N:`<path d="M31.5 37.5q4.5 8 9 0z" fill="#e8737a" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>`,
    J:`<path d="M30 36.5q6 10 12 0z" fill="#e8737a" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>`,D:wavy,S:wavy,
    O:`<ellipse cx="36" cy="41" rx="3.6" ry="4.4" fill="#e8737a" stroke="${O}" stroke-width="1.8"/>`}[k];
  const ex=k==="S"?`<path d="M57 10q4.5 6.5 0 10q-4.5-3.5 0-10z" fill="#9fd4ff" stroke="${O}" stroke-width="1.2"/>`:k==="J"?`<path d="M15 7l2 5M23 2v6M8 13l5 3" stroke="#ffd166" stroke-width="2.4" stroke-linecap="round"/>`:"";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 60"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".72" stop-color="#f5f6fc"/><stop offset="1" stop-color="#e3e8f8"/></linearGradient></defs><ellipse cx="7" cy="27" rx="5" ry="7" transform="rotate(-28 7 27)" fill="${O}"/><ellipse cx="27" cy="55.5" rx="6" ry="4" fill="${O}"/><rect x="9" y="8" width="52" height="46" rx="22" fill="url(#g)" stroke="${O}" stroke-width="2.6"/><ellipse cx="21" cy="40" rx="5.5" ry="3.6" fill="#f4aaa2" opacity=".85"/><ellipse cx="51" cy="40" rx="5.5" ry="3.6" fill="#f4aaa2" opacity=".85"/>${eyes}${mouth}${ex}</svg>`}

/* ===== 花火と、答えたチャンク君が集まる場所 ===== */
export const FWC=["#ffd166","#7cc4ff","#ff8fab","#8ef0c5","#ffb23e","#ffffff","#c3a6ff"];
export function fireworks(host,x,y,n,spread){const b=document.createElement("div");b.className="fw";b.style.left=x+"px";b.style.top=y+"px";let h="<b></b>";
  for(let k=0;k<n;k++){const a=k/n*6.283+Math.random()*.3,r=spread*(.55+Math.random()*.5),c=FWC[(k+rnd(3))%FWC.length];
    h+=`<i class="${k%3?"":"st"}" style="--dx:${(Math.cos(a)*r).toFixed(0)}px;--dy:${(Math.sin(a)*r).toFixed(0)}px;--c:${c};--t:${(.7+Math.random()*.35).toFixed(2)}s"></i>`}
  b.innerHTML=h;host.appendChild(b);setTimeout(()=>b.remove(),1250)}
export function crowd(){let c=$("crowd");if(!c){c=document.createElement("div");c.id="crowd";c.className="crowd";$("txt").appendChild(c)}return c}
export function mkMini(lane,segs,joy){const m=document.createElement("i");m.className="mk l"+lane+(joy?" j":"");m.style.setProperty("--d",(Math.random()*1.6).toFixed(2)+"s");
  m.innerHTML='<b class="h"></b>'+"<s></s>".repeat(Math.max(1,Math.min(4,segs)));return m}
export function segsOf(it){return it.kind===1?1:it.ci!=null&&G&&G.p.chunks[it.ci]?G.p.chunks[it.ci].tk.length:Math.max(1,String(it.en||"").split(/\s+/).length)}
/* 上の空きの、大きなチャンク君（1匹）。答えると大きくなり（速く続けるほど大きく）、時間がたつとしぼむ。育ちきると破裂する */
export const BK={S:1,last:0};
export function bigK(){const c=crowd();let k=c.querySelector(".mk.big");
  if(!k){k=document.createElement("i");k.className="mk big pop";k.innerHTML='<b class="h"></b>';c.appendChild(k);setTimeout(()=>k.classList.remove("pop"),420);bkApply(k)}return k}
export function bkApply(k){k=k||bigK();const c=crowd(),max=Math.max(2,Math.min(4.2,(c.clientHeight-10)/31));k.style.setProperty("--sc",(1.6+(max-1.6)*(BK.S-1)/2).toFixed(2))}
export function bkGrow(){const now=performance.now(),dt=(now-BK.last)/1000;BK.last=now;BK.S=Math.min(3,BK.S+(dt<1.6?.42:dt<3?.3:.18));
  const k=bigK();k.classList.remove("sad");k.classList.add("j");clearTimeout(BK.t);BK.t=setTimeout(()=>k.classList.remove("j"),700);bkApply(k);if(BK.S>=3)bkBurst(false)}
export function bkShrink(v){if(!$("crowd"))return;BK.S=Math.max(1,BK.S-v);const k=bigK();k.classList.add("sad");setTimeout(()=>k.classList.remove("sad"),800);bkApply(k)}
   // 1秒に約0.12しぼむ
export function joinCrowd(it,el,segs){
  const k=bigK(),f=mkMini(it.lane||0,0,true);f.innerHTML='<b class="h"></b>';f.classList.add("mkfly");ENV.root.appendChild(f);
  const a=el.getBoundingClientRect(),b=k.getBoundingClientRect();
  const sx=a.left-12,sy=a.top+a.height/2-16,tx=b.left+b.width/2-16,ty=b.top+b.height/2-15,mx=(sx+tx)/2,my=Math.min(sy,ty)-60;
  el.animate([{opacity:1},{opacity:0}],{duration:160,fill:"forwards"});setTimeout(()=>el.remove(),170);
  f.animate([{transform:`translate(${sx}px,${sy}px) scale(1.2)`},{transform:`translate(${mx}px,${my}px) scale(1)`,offset:.45},{transform:`translate(${tx}px,${ty}px) scale(.5)`,opacity:.5}],{duration:480,easing:"cubic-bezier(.3,.7,.4,1)"})
   .onfinish=()=>{f.remove();if(k.isConnected)bkGrow()};
}
/* 破裂：小さなチャンク君が花火のように散る。散り方は5種類（輪・二重の輪・らせん・噴水・ハート） */
export const BPAT=["ring","double","spiral","fountain","heart"];
export function fwLayer(){let l=document.querySelector(".fwl");if(!l){l=document.createElement("div");l.className="fwl";ENV.root.appendChild(l)}return l}
export function burstMinis(cx,cy,big){const pat=BPAT[rnd(BPAT.length)],n=pat==="double"?24:pat==="heart"?22:18,R=Math.min(innerWidth,innerHeight)*(big?.36:.28);
  for(let i=0;i<n;i++){let x,y,delay=0,fall=36;
    if(pat==="ring"){const a=i/n*6.283;x=Math.cos(a)*R;y=Math.sin(a)*R}
    else if(pat==="double"){const k=i%2,a=(i>>1)/(n/2)*6.283+(k?.13:0),r=R*(k?.55:1);x=Math.cos(a)*r;y=Math.sin(a)*r}
    else if(pat==="spiral"){const a=i*.7,r=R*(.25+i/n*.85);x=Math.cos(a)*r;y=Math.sin(a)*r;delay=i*32}
    else if(pat==="fountain"){const a=-Math.PI/2+(Math.random()-.5)*1.7,r=R*(.6+Math.random()*.6);x=Math.cos(a)*r;y=Math.sin(a)*r;fall=R*.9}
    else{const t=i/n*6.283;x=16*Math.pow(Math.sin(t),3)*R/17;y=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*R/17}
    const m=document.createElement("i");m.className="bm"+(i%3?"":" n");ENV.root.appendChild(m);
    const rot=(Math.random()-.5)*140,sc=.8+Math.random()*.5;
    m.animate([{transform:`translate(${cx-14}px,${cy-13}px) scale(.3)`,opacity:1},{transform:`translate(${cx-14+x}px,${cy-13+y}px) scale(${sc}) rotate(${rot}deg)`,opacity:1,offset:.55},
      {transform:`translate(${cx-14+x}px,${cy-13+y+fall}px) scale(${sc*.8}) rotate(${rot*1.4}deg)`,opacity:0}],{duration:1350,delay,easing:"cubic-bezier(.2,.75,.35,1)",fill:"both"}).onfinish=()=>m.remove()}
  const L=fwLayer();for(let k=0;k<(big?4:2);k++)setTimeout(()=>fireworks(L,cx+(Math.random()-.5)*R*1.2,cy+(Math.random()-.5)*R*.8,18,R*.45),120+k*160);
  return pat}
export function bkBurst(final){const c=$("crowd"),k=c&&c.querySelector(".mk.big");if(!k)return;const r=k.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  if(final&&BK.S<1.15){k.classList.add("j");return}
  k.classList.add("j");k.animate([{scale:"1"},{scale:"1.25"},{scale:"0",opacity:0}],{duration:260,easing:"ease-in",fill:"forwards",composite:"add"});
  try{SE.clear()}catch(e){}if(RUN&&!final)voice("wow");
  setTimeout(()=>{burstMinis(cx,cy,final||BK.S>=3);k.remove();BK.S=1;if(!final)setTimeout(()=>{if(RUN&&$("crowd"))bigK()},700)},240)}
export function crowdHop(wave){bkBurst(!!wave)}
export const CWORD={5:"Nice!",10:"Great!",15:"Excellent!!",20:"Amazing!!",25:"Fantastic!!",30:"Wonderful!!",40:"Incredible!!",50:"Perfect!!"};
export let popTurn=0;
export function comboPop(){
  const c=RUN.combo;if(c<5||c%5)return;
  $("arena").querySelectorAll(".cpop").forEach(e=>e.remove());
  const who=popTurn++%2?"boy":"girl";const d=document.createElement("div");d.className="cpop";
  d.innerHTML=`<div class="say"><b>${CWORD[c]||(c%20?"Excellent!!":"Unstoppable!!")}</b><span>${c} COMBO</span></div><img alt="" src="img/chara/${who}/joy.webp">`;
  $("arena").appendChild(d);if(innerHeight>innerWidth){const t=$("txt");d.style.top=Math.max(4,t.offsetTop+t.offsetHeight-d.offsetHeight+6)+"px"}setTimeout(()=>d.remove(),innerHeight>innerWidth?1700:1300);
  if(c%10===0)voice({10:"nice",20:"excellent",30:"wow",40:"excellent",50:"perfect"}[c]||"wow");
}
export function penFx(t){const d=document.createElement("div");d.className="pen";d.textContent=t;$("sPlay").appendChild(d);setTimeout(()=>d.remove(),900)}
export function face(){} // 表情はコンボ演出とリザルトで見せる
export function hud(){
  if(!G)return;$("hudCount").textContent=`${G.done}/${G.total}`;$("hudProg").style.width=(G.done/G.total*100)+"%";
  $("hudTime").textContent=(G.t+G.pen).toFixed(1);
  $("hudCombo").innerHTML=RUN&&RUN.combo>=3?`${RUN.combo}<small>COMBO</small>`:"";
}

/* 開くたびに動かすこと（画面のボタンをつなぐ など）。game.js が呼ぶ */
export function init_fx(){
  ["N","J","D","S","O"].forEach(k=>ENV.root.style.setProperty("--f"+k,`url("data:image/svg+xml,${encodeURIComponent(faceSVG(k))}")`));
  setInterval(()=>{if(RUN&&G&&G.started&&!G.over&&!PAUSED&&BK.S>1&&$("crowd")){BK.S=Math.max(1,BK.S-.018);bkApply()}},150);
}
