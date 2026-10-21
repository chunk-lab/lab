import { $, ENV, LV, STAGES, SV, chara, esc, rec, save, setTimeout, shuf, starsOf } from './base.js';
import { startRun, tutFace } from './play.js';
import { runCoach } from '../../../core/coach.js';
import { TUT } from './tutorial.js';
import { SE, ac, bgmStart, bgmStop, hush, say } from './sound.js';
import { renderWords } from './words.js';
/* ================= 画面 ================= */
export const SCR=["sTitle","sHome","sWords","sDetail","sReader","sPlay","sResult"];
export function show(id){SCR.forEach(s=>$(s).hidden=s!==id);ENV.ctx.showBack(id!=="sPlay")}   // 「街へ」はタイトルとホームだけ
export let CUR=null;export const P=id=>PASSAGES.find(p=>p.id===id);
export function plain(c){return c.tk.map(t=>t[0]+t[1]+t[2]).join(" ")}
export function fromGap(c,gs){return c.tk.slice(gs).map(t=>t[0]+t[1]+t[2]).join(" ")}
export const reached=(pid,st)=>st===1||!!rec(pid,st-1,"ta");

export function applyFs(){if(SV.set.spd==null)SV.set.spd=.5;if(SV.set.fs==null)SV.set.fs=1.2;ENV.root.style.setProperty("--fs",SV.set.fs||1.2)}

export function renderHome(){
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
export function renderDetail(){
  const p=CUR;$("dTag").textContent=`${LV[p.lv].name}・${p.tag.split("・")[1]||""}`;$("dTitle").textContent=p.title;$("dJa").textContent=p.ja;
  const rb=(SV.best[p.id]||{}).run;$("dRun").innerHTML=rb?`通しのベスト <b>${rb.time.toFixed(1)}s</b>　ランク ${rb.rank}`:"4ステージを続けて遊びます。途中の段から始めることもできます";
  $("stages").innerHTML=STAGES.map(s=>{const lk=!reached(p.id,s.id),r=rec(p.id,s.id,"ta"),st=starsOf(p.id,s.id);
    return `<button class="st ${lk?"lock":""}" data-st="${s.id}"><span class="no">${lk?"🔒":s.id}</span><span><div class="nm">${s.name}</div><div class="ds">${lk?"ひとつ前のステージまで進むと、ここから始められます":s.desc}</div></span>
    <span class="rec">${r?`<b>${r.rank||"-"}</b>${r.time.toFixed(1)}s`:""}<span class="stars">${[0,1,2].map(i=>`<span class="${i<st?"on":""}">★</span>`).join("")}</span></span></button>`}).join("");
  $("stages").querySelectorAll(".st").forEach(b=>b.onclick=()=>{const s=+b.dataset.st;if(!reached(p.id,s)){SE.ng();toast("ひとつ前のステージまで進むと開きます");return}SE.tap();startRun(s)});
}
/* 全画面（ブラウザのバーを消す）＋横向き固定。押したときにだけ呼べる。iPhoneのブラウザは非対応（アプリ版で全画面） */
export const isFull=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
export const canFull=()=>{const d=document.documentElement;return !!(d.requestFullscreen||d.webkitRequestFullscreen)};
export let WANTF=false;   /* 全画面にしたい状態か。回転などで勝手に抜けても、次のタップで戻す */
export function goFull(){if(!canFull())return false;WANTF=true;if(isFull())return false;const d=document.documentElement;try{const p=(d.requestFullscreen||d.webkitRequestFullscreen).call(d,{navigationUI:"hide"});
  p&&p.catch&&p.catch(()=>{})}catch(e){}return true}
export function toggleFull(){if(isFull()){WANTF=false;(document.exitFullscreen||document.webkitExitFullscreen).call(document);return}if(!canFull()){toast("このブラウザは全画面に対応していません（アプリ版では全画面になります）");return}goFull()}

// 本文を読む：共通の「読む画面」（core.reader）を全画面で開く。閉じるとゲームに戻る。文章データは data/texts.js（tools/reading_texts.py が作る）
export function openReading(from){
  const t=typeof LS_TEXTS!=="undefined"?LS_TEXTS[CUR.id]:null;
  SE.tap();
  if(!t){renderReader();show("sReader");return}   // 文章データがない長文は、今までの読む画面で
  bgmStop();
  ENV.core.reader.open({title:t.title,list:t.list,level:t.level,questions:t.q||[]},
    {label:from==="post"?"振り返り":"予習",backLabel:from==="post"?"← 結果へ":"← もどる",onClose:()=>bgmStart(84,"menu")});
}

export function renderReader(){
  const p=CUR;$("rTitle").textContent=p.title;
  $("reader").innerHTML=p.chunks.map((c,i)=>{const [gs,ge]=c.g;const e=c.tk.map((t,j)=>esc(t[0])+(j>=gs&&j<ge?`<b>${esc(t[1])}</b>`:esc(t[1]))+esc(t[2])).join(" ");
    return `<button class="rc" data-i="${i}"><span class="e">${e}</span><span class="jj">${esc(c.ja)}</span></button>`}).join("");
  $("reader").querySelectorAll(".rc").forEach(b=>b.onclick=()=>{ac();$("reader").querySelectorAll(".rc").forEach(x=>x.classList.remove("on"));b.classList.add("on");say(plain(p.chunks[+b.dataset.i]))});
}

export function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;$("app").appendChild(d);setTimeout(()=>d.remove(),1700)}
export function overlay(html,bind){$("ovBody").innerHTML=html;$("ov").hidden=false;bind&&bind($("ovBody"))}
export function closeOv(){$("ov").hidden=true;$("ovBody").innerHTML=""}

export function openSettings(){
  const segs=(k,opts)=>`<div class="seg" data-k="${k}">${opts.map(([v,l])=>`<button data-v="${v}" class="${String(SV.set[k])===String(v)?"on":""}">${l}</button>`).join("")}</div>`;
  overlay(`<div class="sheet wide"><h3>設定</h3><div class="setgrid">
   <div class="set">ナビ${segs("nav",[["girl","モモ"],["boy","ソラ"]])}</div>
   <div class="set">文字の大きさ${segs("fs",[[1,"小"],[1.2,"中"],[1.4,"大"],[1.6,"特大"]])}</div>
   <div class="set">流れる速さ${segs("spd",[[.35,"超遅"],[.5,"遅い"],[.7,"普通"],[1,"速い"]])}</div>
   <div class="set">音・読み上げ<button class="sbtn" id="setSound">共通の設定を開く</button></div>
   <div class="set">長文完成の日本語${segs("jp4",[[1,"出す"],[0,"出さない"]])}</div>
   </div><div class="row2"><button class="sbtn" id="setReset">記録をリセット</button><button class="sbtn pri" id="setClose">とじる</button></div></div>`,b=>{
    b.querySelectorAll(".seg").forEach(sg=>sg.querySelectorAll("button").forEach(x=>x.onclick=()=>{const k=sg.dataset.k,v=x.dataset.v;SV.set[k]=k==="nav"?v:+v;save();SE.tap();applyFs();
      sg.querySelectorAll("button").forEach(y=>y.classList.toggle("on",y===x));$("heroChara").src=chara("joy")}));
    b.querySelector("#setSound").onclick=()=>{SE.tap();ENV.core.ui.settings()};
    b.querySelector("#setClose").onclick=()=>{SE.tap();closeOv();renderHome()};

    const r=b.querySelector("#setReset");r.onclick=()=>{if(r.dataset.c){SV.best={};save();toast("記録をリセットしました");closeOv();renderHome()}else{r.dataset.c=1;r.textContent="もう一度押すとリセット";r.style.color="var(--bad)"}};
  });
}

/* 開くたびに動かすこと（画面のボタンをつなぐ など）。game.js が呼ぶ */
export function init_screens(){
  (function(){const all=PASSAGES.flatMap(p=>p.chunks.map(plain));const pick=n=>shuf(all).slice(0,n).map((t,i)=>`<span class="${i%5===2?"h":""}">${esc(t)}</span>`).join("");
    ["rv1","rv2"].forEach(id=>{const h=pick(9);$(id).innerHTML=h+h})})();
  applyFs();
  $("heroChara").src=chara("joy");
  $("btnStart").onclick=()=>{goFull();ac();SE.tap();bgmStart(84,"menu");renderHome();show("sHome")};
  $("btnFull").onclick=()=>{SE.tap();toggleFull()};
  $("btnRun").onclick=()=>{SE.tap();startRun(1)};
  $("modeRh").onclick=()=>{SE.tap();toast("リズムモードは準備中です")};
  $("btnRead").onclick=()=>openReading("pre");
  const how=()=>{SE.tap();if(!SV.howSeen){SV.howSeen=1;save()}runCoach([...TUT.intro,...TUT[1],...TUT[2],...TUT[3],...TUT[4]],{face:tutFace})};
  $("btnHow").onclick=how;$("btnHowT").onclick=how;
  if(!SV.howSeen){const bs=$("btnStart");bs.parentNode.insertBefore($("btnHowT"),bs)}   // まだ見ていない間は、いちばん上
  document.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>{SE.tap();hush();if(b.dataset.back==="home"){renderHome();show("sHome")}else{renderDetail();show("sDetail")}});
  $("btnJp").onclick=()=>{$("btnJp").classList.toggle("on");$("reader").classList.toggle("nojp")};
  $("btnReadAll").onclick=()=>{ac();say(CUR.chunks.map(plain).join(" "))};
  $("btnSettings").onclick=()=>{SE.tap();openSettings()};
}
