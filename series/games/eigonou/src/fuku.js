import { set_mutate, set_renderIdle } from './play.js';
import { N, T, needsObj, predS, predV, sentenceComplete } from './engine.js';
import { onDoc } from './env.js';
import { AC, APP, mutate, openFinish, render, renderIdle, renderScene } from './play.js';
// ================= 「副」ボタン：副詞・前置きをいつでも足す =================
// 時間の線の左端に「副」。押すと「文をかざって、はなやかにしてみよう！」と5つのタブ（語順どおり）。
// 前置き / どんな（人・もの）/ どう（する・いる）/ いつ / どこで。中身はいつもの候補リストをそのまま使う。
export let FUKU_TABS;
export function fukuSubs(tab){ const c=AC(), v=predV(c), O=[];
 if(tab==='adj'){ if(c.subj && !(N(c.subj)||{}).pron) O.push(['sadjL','主語を']); if(c.obj && needsObj(c) && !(N(c.obj)||{}).pron) O.push(['oadjL','目的語を']); }
 if(tab==='how'){ const s=predS(c); if(s && !s.noun && !v) O.push(['intens','とても・すごく']); if(v || s) O.push(['freq','どのくらい']); if(v) O.push(['manner','どうやって']); }
 if(tab==='pre') O.push(['pre','']); if(tab==='time') O.push(['time','']); if(tab==='place') O.push(['place','']);
 return O; }
// 開いた時は、今の文の形に合うものを最初に出す（I am … → very / so など）
export function fukuAuto(){ const c=AC(), v=predV(c), s=predS(c);
 if(c.type==='normal' && s && !s.noun && !v && !c.intens) return ['how','intens'];
 if(v && !c.freq) return ['how','freq'];
 if(v && !c.manner) return ['how','manner'];
 if((v||s) && !c.time) return ['time','time'];
 return ['pre','pre']; }
export function openFuku(tab){
 let key=null; if(!APP.fuku){ APP.fukuFin=!!APP.finished; APP.fukuStage=APP.finStage; if(!tab){ [tab,key]=fukuAuto(); } }
 APP.fuku=tab||APP.fukuTab||'pre'; APP.fukuTab=APP.fuku; if(key) APP.fukuKey=key;
 const subs=fukuSubs(APP.fuku); APP.fukuKey = subs.find(s=>s[0]===APP.fukuKey)? APP.fukuKey : (subs[0]&&subs[0][0]);
 APP.finished=false; APP.preCat=null; APP.grp={}; APP.open=APP.fukuKey||null; render();
}
export function closeFuku(back){ if(!APP.fuku) return; APP.fuku=null; APP.open=null; APP.preCat=null;
 if(back!==false && APP.fukuFin && sentenceComplete(APP.S)){ const st=APP.fukuStage; openFinish(); if(st){ APP.finStage=st; renderScene(); } } else render(); }
// 選んだら閉じて、完成画面から来ていたら完成画面へ戻る

export function fukuBar(){
 let el=document.getElementById('fukubar');
 if(!APP.fuku || APP.view!=='play'){ if(el) el.remove(); return; }
 const cv=document.getElementById('canvas'); if(!cv) return;
 if(!el){ el=document.createElement('div'); el.id='fukubar'; cv.appendChild(el); }
 const subs=fukuSubs(APP.fuku);
 el.innerHTML=`<div class="fkhead"><b>文をかざって、はなやかにしてみよう！</b><button class="fkx" data-fx="1">✕</button></div>
  <div class="fktabs">${FUKU_TABS.map(t=>`<button class="fktab pos-${t.pos} ${APP.fuku===t.id?'on':''} ${fukuSubs(t.id).length?'':'off'}" data-ft="${t.id}"><b>${t.label}</b>${t.sub?`<small>${t.sub}</small>`:''}</button>`).join('')}</div>
  ${subs.length>1?`<div class="fksubs">${subs.map(s=>`<button class="fksub ${APP.fukuKey===s[0]?'on':''}" data-fs="${s[0]}">${s[1]}</button>`).join('')}</div>`:''}
  ${!subs.length?`<div class="fknone">${APP.fuku==='adj'?'名詞（人・もの）を選ぶと使えます':'動詞や「〜だ」を選ぶと使えます'}</div>`:''}`;
 el.querySelector('[data-fx]').onclick=()=>closeFuku();
 el.querySelectorAll('[data-ft]').forEach(b=>b.onclick=()=>openFuku(b.dataset.ft));
 el.querySelectorAll('[data-fs]').forEach(b=>b.onclick=()=>{ APP.fukuKey=b.dataset.fs; APP.open=APP.fukuKey; APP.grp={}; render(); });
}
export function fukuBtn(){ const tl=document.getElementById('tline'); if(!tl || tl.querySelector('.tfuku')) return;
 const b=document.createElement('button'); b.className='tfuku'; b.textContent='副'; b.title='文をかざる（副詞・前置き）';
 b.addEventListener('pointerdown',e=>e.stopPropagation()); b.addEventListener('click',e=>{ e.stopPropagation(); APP.fuku? closeFuku() : openFuku(); }); tl.appendChild(b); }

// ===== 最初の大きいエリア：ボタンのすきまを押しても、左右の位置でエリアを選ぶ =====

// ===== タブの左右フリック（候補の一覧の上だけ。時間の線・帯・バー・上の英文・完成画面のキャラの所は対象外）=====

export function flickTab(dir){
 if(APP.fuku){ const T=FUKU_TABS.map(t=>t.id).filter(id=>fukuSubs(id).length||id===APP.fuku); const i=T.indexOf(APP.fuku); const j=i+dir; if(j<0||j>=T.length) return false; openFuku(T[j]); return true; }
 const idle=document.getElementById('idle');
 if(idle && idle.classList.contains('show')){ return false; }
 const tabs=[...document.querySelectorAll('#scene .nd.fb')].filter(n=>{ const c=n.firstElementChild; return c && c.classList.contains('cat') && !c.classList.contains('front') && !c.classList.contains('sm') && n.offsetParent; })
  .map(n=>({n,r:n.getBoundingClientRect(),on:n.firstElementChild.classList.contains('on')||n.firstElementChild.classList.contains('picked')}));
 if(tabs.length<2) return false;
 const top=Math.min(...tabs.map(t=>t.r.top)); const row=tabs.filter(t=>t.r.top-top<30).sort((a,b)=>a.r.left-b.r.left);
 if(row.length<2) return false; let i=row.findIndex(t=>t.on); const j = i<0? (dir>0?0:row.length-1) : i+dir; if(j<0||j>=row.length) return false;
 row[j].n.click(); return true;
}

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_fuku(){
FUKU_TABS = [
 {id:'pre',label:'前置き',pos:'conj'},
 {id:'adj',label:'どんな',sub:'人・もの',pos:'noun'},
 {id:'how',label:'どう',sub:'する・いる',pos:'verb'},
 {id:'time',label:'いつ',pos:'adv'},
 {id:'place',label:'どこで',pos:'adv'},
];
{ const _mut=mutate; set_mutate(function(fn,sp){ const f=APP.fuku; _mut(fn,sp); if(f && APP.fuku) closeFuku(); }); }
{ const _ri=renderIdle; set_renderIdle(function(){ _ri(); const el=document.getElementById('idle'); if(!el) return;
  el.onclick=e=>{ if(e.target.closest('[data-z],[data-nt]')) return; const zs=[...el.querySelectorAll('[data-z]')]; if(!zs.length) return;
   let best=null,bd=1e9; zs.forEach(b=>{ const r=b.getBoundingClientRect(); const d=e.clientX<r.left? r.left-e.clientX : e.clientX>r.right? e.clientX-r.right : 0; if(d<bd){bd=d;best=b;} }); if(best) best.click(); }; }); }
(function(){
 let st=null;
 const EXC='#tline,.rbscroll,.mbscroll,.fwspace,.finwrap,#chunks,input,textarea,.lstrip,#fukubar .fksubs';
 onDoc('pointerdown',e=>{ st=null; const sc=e.target.closest&&e.target.closest('#scene,#fukubar,#idle'); if(!sc||e.target.closest(EXC)||APP.finished) return; st={x:e.clientX,y:e.clientY,t:Date.now()}; },true);
 onDoc('pointerup',e=>{ if(!st) return; const s=st; st=null; const dx=e.clientX-s.x, dy=e.clientY-s.y;
  if(Math.abs(dx)<50 || Math.abs(dx)<Math.abs(dy)*1.5 || Date.now()-s.t>700) return;
  const dir = dx<0? 1 : -1; if(flickTab(dir)){ APP.flickAt=Date.now(); } },true);
 onDoc('click',e=>{ if(Date.now()-(APP.flickAt||0)<400){ e.stopPropagation(); e.preventDefault(); } },true);
})();
}
