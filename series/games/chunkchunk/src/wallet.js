/* コインとダイヤ（内部の仕組み）。保存は共通のセーブ。数字（いくらもらえる・いくら使う）はここでは決めない */
export function createWallet(store){
  const KEY="ccs-wallet",KINDS=["coins","gems"],MAXLOG=60;
  const REASONS={   // 理由のコード（履歴に残す名前）。増やすときは earn:*、使うときは buy:* で始める
    "earn:login":"ログインボーナス","earn:minigame":"ミニゲーム","earn:ad":"広告を見た","earn:play":"遊んだごほうび",
    "buy:avatar":"アバター","buy:material":"教材","buy:ai":"AI登録（1回）","buy:limited":"限定アバター"};
  const listeners=[];
  let d=load();
  function load(){try{const x=(store.get("wallet")||JSON.parse(localStorage.getItem(KEY)||"{}"));return {coins:Math.max(0,Math.floor(+x.coins||0)),gems:Math.max(0,Math.floor(+x.gems||0)),log:Array.isArray(x.log)?x.log.slice(-MAXLOG):[],daily:String(x.daily||"")}}catch(e){return {coins:0,gems:0,log:[],daily:""}}}
  function save(){try{store.set("wallet",d)}catch(e){}listeners.forEach(f=>{try{f(api)}catch(e){}})}
  function rec(kind,n,reason){d.log.push({at:Date.now(),kind,n,reason:String(reason||""),bal:d[kind]});if(d.log.length>MAXLOG)d.log=d.log.slice(-MAXLOG)}
  const api={
    REASONS,
    coins:()=>d.coins,gems:()=>d.gems,balance:k=>d[k]||0,
    history:()=>d.log.slice().reverse(),
    add(kind,n,reason){n=Math.floor(+n);if(!KINDS.includes(kind)||!(n>0))return false;d[kind]+=n;rec(kind,n,reason);save();return true},
    can(kind,n){return KINDS.includes(kind)&&n>0&&d[kind]>=n},
    spend(kind,n,reason){n=Math.floor(+n);if(!this.can(kind,n))return false;d[kind]-=n;rec(kind,-n,reason);save();return true},
    /* 1日1回のログインボーナス。いまは、どこからも呼んでいない（使うときに呼ぶ） */
    daily(coins=10){const t=new Date().toISOString().slice(0,10);if(d.daily===t)return false;d.daily=t;d.coins+=coins;rec("coins",coins,"earn:login");save();return true},
    onChange(f){listeners.push(f)},
    fmt:n=>Number(n).toLocaleString("en-US")
  };
  return api;
}
