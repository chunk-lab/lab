export const $=id=>document.getElementById(id);
/* 開いている間の環境（game.js が入れる）：root＝このゲームの箱、ctx＝共通部品とのつなぎ、core＝共通部品、base＝画像・声の場所 */
export const ENV={root:null,ctx:null,core:null,base:"",offs:[]};
/* 閉じたときに止められるように、タイマーとイベントを記録する */
export const TIMERS={to:new Set(),iv:new Set()};
export const setTimeout=(f,t)=>{const i=window.setTimeout(()=>{TIMERS.to.delete(i);f()},t);TIMERS.to.add(i);return i};
export const setInterval=(f,t)=>{const i=window.setInterval(f,t);TIMERS.iv.add(i);return i};
export const addEventListener=(t,f,o)=>{window.addEventListener(t,f,o);ENV.offs.push(()=>window.removeEventListener(t,f,o))};
export const onDoc=(t,f,o)=>{document.addEventListener(t,f,o);ENV.offs.push(()=>document.removeEventListener(t,f,o))};
export function stopAll(){TIMERS.to.forEach(i=>window.clearTimeout(i));TIMERS.iv.forEach(i=>window.clearInterval(i));TIMERS.to.clear();TIMERS.iv.clear();ENV.offs.forEach(f=>f());ENV.offs=[]}
/* セーブは共通のセーブ（このゲーム専用の場所）。音量・読み上げは共通の設定（街の⚙） */
export const LS={getItem:k=>{const v=ENV.ctx.store.get(k);return v==null?null:v},setItem:(k,v)=>ENV.ctx.store.set(k,v)};
export const sfxOn=()=>ENV.core.settings.get("sfx")>0,bgmOn=()=>ENV.core.settings.get("bgm")>0;
export const rnd=n=>Math.floor(Math.random()*n);
export const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
export const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
export const LV=[null,{name:"初級",sub:"高校受験",col:"var(--lv1)"},{name:"中級",sub:"共通テスト",col:"var(--lv2)"},{name:"上級",sub:"難関大",col:"var(--lv3)"}];
export const STAGES=[
 {id:1,name:"単語ダッシュ",desc:"聞こえた単語の意味を選ぶ。上は上の4択、下は下の4択",note:"読み上げを聞いて、意味をタップ！ 上下どちらからでもOK"},
 {id:2,name:"チャンクキャッチ",desc:"聞こえたチャンク（意味のかたまり）の意味を選ぶ",note:"チャンクの意味をタップ！"},
 {id:3,name:"チャンクパズル",desc:"上の日本語に合うように、欠けた1語を埋める",note:"日本語に合う1語で穴を埋めよう"},
 {id:4,name:"ロングストリーム",desc:"チャンクを順番につないで長文を完成させる",note:"順番につないで長文を完成！ 光っている側の4択で答えよう"}];
export const POSJ={n:"名",v:"動",a:"形",r:"副",ph:"熟",pp:"前",cj:"接",pn:"代",ij:"間"};
export const SKEY="chunkstream.v1";
export let SV={best:{},seen:{},set:{nav:"girl",voice:1,rate:1,se:1,bgm:1,jp4:1},mode:"ta",lv:1};
export function loadSave(){try{const s=JSON.parse(LS.getItem(SKEY)||"null");if(s){SV={...SV,...s,set:{...SV.set,...(s.set||{})}}}}catch(e){}}
export function save(){try{LS.setItem(SKEY,JSON.stringify(SV))}catch(e){}}
export function rec(pid,st,mode){return ((SV.best[pid]||{})[st]||{})[mode]||null}
export function starsOf(pid,st){const a=rec(pid,st,"ta"),b=rec(pid,st,"rh");return Math.max(a?a.stars:0,b?b.stars:0)}
export function unlocked(pid,st){return st===1||starsOf(pid,st-1)>0}
export const chara=f=>`${ENV.base}img/chara/${SV.set.nav}/${f}.webp`;
