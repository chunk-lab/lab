import { $, ENV, LS, S, applyAdvanceUI, ask, closeSheet, esc, loadStage, nextRun, openSheet, primeSpeech, randomPool, saveSettings, setTotal, settings, shuffle, toast, unlockAudio, updateProg } from './engine.js';
import { sfx } from './sfx.js';
import { DB, MYID } from './texts.js';
import { showTitle } from './title.js';
/* ===== チャレンジ（30秒・1分）とランキング =====
 ・全レベルの文から出る（レベル帯別は RANK_BANDS に足すだけで増やせる）
 ・自分で送るモード固定。「1語もどる」は使えない。途中で設定を開くと中止
 ・記録は共有データベース ranks/<自分のID> に1人1つ（自分の分だけ書ける）
 */
export const RANK_BANDS=[{key:"all",label:"全レベル"}];   // 例：{key:"lv1-3",label:"小学生〜中1",lv:[1,3]}
export const RANK_MAX_PPS=150;   // 1秒あたりの点数がこれを超える記録は、ありえないのではじく
export const RANK_SHOW=50;
export let RANKS=null;

export function bandPool(bandKey){
  const band=RANK_BANDS.find(b=>b.key===bandKey)||RANK_BANDS[0],pool=randomPool();
  if(!band.lv)return pool;
  const f=pool.filter(x=>!x.lv||(x.lv>=band.lv[0]&&x.lv<=band.lv[1]));
  return f.length?f:pool;
}
export function timedList(bandKey,n){
  const pool=bandPool(bandKey);let out=[];
  while(out.length<n)out=out.concat(shuffle(pool));
  return out.slice(0,n).map(x=>[x.s,x.ja]);
}
export function startTimed(sec,bandKey){
  bandKey=bandKey||RANK_BANDS[0].key;
  primeSpeech();unlockAudio();$("title").hidden=true;
  settings.advance="manual";
  loadStage("one",0,timedList(bandKey,120),true);
  S.timed={limit:sec*1000,sec,band:bandKey};
  setTotal(0);$("score").textContent=0;   // 上の点数表示は、この回の点数だけにする
  S.title=`チャレンジ ${sec===30?"30秒":"1分"}`;S.short="チャレンジ";$("stageText").textContent=S.short;
  updateProg();applyAdvanceUI();$("timeText").textContent=`残り ${sec}.0`;
}
export function timedStats(){
  const all=[...S.results.filter(Boolean).flatMap(r=>r.chunks),...(S.results[S.si]?[]:(S.chunks[0]||[]))];
  const c={excellent:0,great:0,good:0,cross:0,mini:0,miss:0};
  all.forEach(x=>{const k=x.kind==="forgot"?"miss":x.kind;c[k]=(c[k]||0)+1});
  return {n:all.length,sent:S.results.filter(Boolean).length,c};
}
export function timedEnd(){
  if(!S||!S.timed||S.timedDone)return;
  S.timedDone=true;sfx("se/timeup");nextRun();clearTimeout(S.timer);S.phase="done";
  $("rolePick").hidden=true;ENV.core.speech.stop();
  const t=S.timed,score=S.gained,st=timedStats();
  // この端末の自己ベスト
  settings.bestTimed=settings.bestTimed||{};const lb=settings.bestTimed[t.band]=settings.bestTimed[t.band]||{};
  const localBest=lb[t.sec]||0,isBest=score>localBest;if(isBest){lb[t.sec]=score;saveSettings()}
  const diff=score-localBest;
  openSheet(`<h2>${esc(S.title)} おわり！</h2>
    <div class="rkScore"><div class="big">${score} pt</div>${isBest&&score>0?`<div class="rkNew">NEW BEST!</div>`:""}</div>
    <p class="note">${st.sent}文・◎${st.c.excellent} ◯${st.c.great} △${st.c.good} ▽${st.c.cross} ・${st.c.mini} ×${st.c.miss}</p>
    <p class="note">この端末の自己ベスト：${isBest?"更新！":`${localBest} pt（${diff<0?"あと "+(-diff):"同じ"} pt）`}</p>
    <div id="rkName"></div>
    <div id="rkMsg" class="rkMsg">ランキングと比べています…</div>
    <div id="rkCmp"></div>
    <div class="btns" style="flex-direction:column"><button class="primary" id="rkRetry" hidden>登録にもどる（記録を送る）</button><button class="primary" id="rkShow">ランキングを見る</button>
      <div style="display:flex;gap:8px"><button class="ghost" id="rkAgain" style="flex:1">もう一度</button><button class="ghost" id="rkTitle" style="flex:none;font-size:12px;padding:8px 14px">タイトルへ</button></div></div>`,false);
  const rec={id:"c"+Date.now(),sec:t.sec,band:t.band,score,sent:st.sent,n:st.n,at:Date.now()};
  if(score>0)addPending(rec);   // 送れるまで残しておく
  $("rkTitle").onclick=showTitle;
  $("rkAgain").onclick=()=>{closeSheet();startTimed(t.sec,t.band)};
  $("rkShow").onclick=()=>showRanking(t.sec,t.band);
  $("rkRetry").onclick=()=>{$("rkRetry").hidden=true;submitRank(t,score,st,rec.id)};
  // 連打の続きで押してしまわないように、出てから少しの間は押せなくする
  const lockBtns=["rkTitle","rkAgain","rkShow","rkRetry"].map($);lockBtns.forEach(b=>{if(b){b.disabled=true;b.style.opacity=".4"}});
  setTimeout(()=>lockBtns.forEach(b=>{if(b){b.disabled=false;b.style.opacity=""}}),1500);
  if(isBest&&score>0)setTimeout(()=>sfx("se/newbest"),900);
  else if(score<=0)setTimeout(()=>sfx("voice/try_again"),600);
  submitRank(t,score,st,rec.id);
  document.dispatchEvent(new CustomEvent("cc:challenge",{detail:{score,sec:t.sec,best:isBest}}));
}
/* 送れなかった記録を、この端末に残しておく（あとから「送る」で登録できる） */
export function loadPending(){try{return JSON.parse(LS.getItem("ccs-pending-rank")||"[]").filter(x=>x&&x.id&&x.score>=0)}catch(e){return []}}
export function savePending(a){try{LS.setItem("ccs-pending-rank",JSON.stringify(a.slice(-8)))}catch(e){}}
export function addPending(rec){savePending(loadPending().filter(x=>x.id!==rec.id).concat([rec]))}
export function dropPending(id){savePending(loadPending().filter(x=>x.id!==id))}
export function cleanNick(s){return String(s||"").replace(/[<>&"'`]/g,"").replace(/\s+/g," ").trim().slice(0,12)}
export function askNick(box,onDone,cur){
  box.innerHTML=`<div class="rkName"><input type="text" id="rkNick" maxlength="12" placeholder="ランキングに出す名前（12文字まで）" value="${esc(cur||"")}"><button class="primary" id="rkNickOk" style="flex:none">決める</button></div>
    <p class="note">本名ではなく、ニックネームにしてください。あとから変えられます。</p>`;
  $("rkNickOk").onclick=()=>{const n=cleanNick($("rkNick").value);if(!n){$("rkNick").focus();return}
    settings.nick=n;saveSettings();box.innerHTML="";onDone(n)};
}
export async function loadRanks(){
  if(!DB)return RANKS;
  try{const snap=await DB.collection("ranks").get();RANKS=snap.docs.map(d=>({...d.data(),id:d.id}))}catch(e){RANKS=RANKS||[]}
  return RANKS;
}
export function rankList(band,sec){
  return (RANKS||[]).map(d=>{const r=d.best&&d.best[band]&&d.best[band][sec];return r&&r.score>=0&&r.score<=sec*RANK_MAX_PPS?{id:d.id,nick:cleanNick(d.nick)||"（名前なし）",avatar:d.avatar||null,score:r.score,at:r.at||0}:null})
    .filter(Boolean).sort((a,b)=>b.score-a.score||a.at-b.at);
}
/* 今回の点を、ほかの人の記録と並べて見せる */
export function renderCompare(t,score){
  const box=$("rkCmp");if(!box)return;
  const list=rankList(t.band,t.sec),others=list.filter(r=>r.id!==MYID);
  const all=[...others.map(r=>({...r,me:false})),{id:MYID,nick:cleanNick(settings.nick)||"あなた",avatar:null,score,me:true}].sort((a,b)=>b.score-a.score||(a.me?1:-1));
  const pos=all.findIndex(r=>r.me)+1,total=all.length;
  const above=others.filter(r=>r.score>score).sort((a,b)=>a.score-b.score)[0];
  const top=others[0];
  const lines=[`<b>今回の点は <span class="rkPos">${pos}位</span> / ${total}人</b>`];
  if(pos===1&&total>1)lines.push("今のところ 1位です！");
  else if(total===1)lines.push("まだほかの記録がありません。あなたが一番乗りです！");
  else{if(above)lines.push(`1つ上の ${esc(above.nick)} さんまで、あと ${above.score-score} pt`);
    if(top&&pos>1)lines.push(`1位の ${esc(top.nick)} さんとは ${top.score-score} pt 差`)}
  const show=new Set([0,1,2,pos-2,pos-1,pos]);
  const row=(r,i)=>`<div class="rkRow${r.me?" me":""}"><b>${i+1}</b><span>${esc(r.nick)}${r.me?"（今回）":""}</span><i>${r.score} pt</i></div>`;
  let rows="",prev=-1;all.forEach((r,i)=>{if(!show.has(i))return;if(prev>=0&&i-prev>1)rows+=`<p class="note" style="text-align:center;margin:2px">…</p>`;rows+=row(r,i);prev=i});
  box.innerHTML=`<div class="rkCmpBox"><p class="note" style="color:var(--ink);margin:0 0 4px">${lines.join("<br>")}</p>${rows}</div>`;
}
export async function doSubmit(t,score,st){   // 記録を保存する（1人1つの自己ベスト）
  await loadRanks();
  const ref=DB.doc("ranks/"+MYID),snap=await ref.get(),d=snap.exists?snap.data():{};
  const best=JSON.parse(JSON.stringify(d.best||{}));best[t.band]=best[t.band]||{};
  const cur=best[t.band][t.sec],better=!cur||score>cur.score;
  if(better)best[t.band][t.sec]={score,at:Date.now(),sent:st.sent,chunks:st.n!=null?st.n:st.chunks};
  await ref.set({v:1,nick:settings.nick,best,at:Date.now()});
  await loadRanks();return {better,cur};
}
export async function submitRank(t,score,st,pid){
  const msg=$("rkMsg");if(!msg)return;
  const say=(h,warn)=>{const m=$("rkMsg");if(m){m.innerHTML=h;m.style.color=warn?"var(--bad)":"var(--ink)"}};
  const retry=()=>{const b=$("rkRetry");if(b)b.hidden=false};
  const kept=" この記録は残してあるので、あとで「登録にもどる」や、ランキング画面の「送る」から登録できます。";
  if(!DB){say("ランキングに接続できませんでした。Claude にログインして、公開のURL（claude.ai/artifact/…）から開いたときだけ、ランキングに参加できます。"+kept,true);retry();return}
  if(!MYID){say("あなたのアカウントを確認できなかったため、送れませんでした。Claude にログインして、公開のURLから開き直してください。"+kept,true);retry();return}
  if(score>t.sec*RANK_MAX_PPS){say("記録が正しく取れなかったため、ランキングには送りませんでした。",true);if(pid)dropPending(pid);return}
  if(!settings.nick){say("ランキングに出す名前を決めると、順位が出ます。");askNick($("rkName"),()=>{say("ランキングに送っています…");submitRank(t,score,st,pid)});retry();return}
  try{
    say("ランキングに送っています…");
    const {better,cur}=await doSubmit(t,score,st);
    if(pid)dropPending(pid);
    say(better?"ランキングの自己ベストを更新しました！":`ランキング上の自己ベストは ${cur.score} pt のままです。`);
    renderCompare(t,score);
  }catch(e){say("ランキングに送れませんでした。"+(e&&e.code==="permission_denied"?"書き込みの権限がありません。":"通信の問題かもしれません。")+kept,true);retry()}
}
export async function showRanking(sec,band){
  sec=sec||30;band=band||RANK_BANDS[0].key;
  const draw=()=>{
    const list=rankList(band,sec),mi=list.findIndex(r=>r.id===MYID);
    const row=(r,i)=>`<div class="rkRow${r.id===MYID?" me":""}"><b>${i+1}</b><span>${esc(r.nick)}</span><i>${r.score} pt</i></div>`;
    openSheet(`<h2>ランキング</h2>
      <div class="modes">${[30,60].map(s=>`<button data-rs="${s}" aria-pressed="${s===sec}">${s===30?"30秒":"1分"}</button>`).join("")}</div>
      ${RANK_BANDS.length>1?`<div class="modes">${RANK_BANDS.map(b=>`<button data-rb="${b.key}" aria-pressed="${b.key===band}">${esc(b.label)}</button>`).join("")}</div>`:""}
      ${!DB?`<p class="note">ランキングは、Claude にログインして開いたときだけ見られます。</p>`
        :RANKS==null?`<p class="note">読み込み中…</p>`
        :list.length?`<div>${list.slice(0,RANK_SHOW).map(row).join("")}${mi>=RANK_SHOW?`<p class="note" style="text-align:center">…</p>${row(list[mi],mi)}`:""}</div>`
        :`<p class="note">まだ記録がありません。チャレンジで一番乗りしよう！</p>`}
      ${loadPending().length?`<div class="rkCmpBox"><p class="note" style="color:var(--ink);margin:6px 0 2px"><b>まだ送っていない記録があります</b></p>${loadPending().map(p=>`<div class="rkRow"><b>${p.sec===30?"30秒":"1分"}</b><span>${new Date(p.at).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span><i>${p.score} pt</i><button class="ghost" data-pend="${p.id}" style="flex:none;padding:6px 12px">送る</button></div>`).join("")}</div>`:""}
      ${DB&&MYID?`<div id="rkName"></div>`:""}
      <div class="btns">${DB&&MYID?`<button class="ghost" id="rkNickBtn">名前を変える</button>`:""}<button class="primary" id="closeBtn">閉じる</button></div>`);
    $("sheet").querySelectorAll("[data-rs]").forEach(b=>b.onclick=()=>{sec=+b.dataset.rs;draw()});
    $("sheet").querySelectorAll("[data-rb]").forEach(b=>b.onclick=()=>{band=b.dataset.rb;draw()});
    $("closeBtn").onclick=closeSheet;
    $("sheet").querySelectorAll("[data-pend]").forEach(bt=>bt.onclick=async()=>{
      const rec=loadPending().find(x=>x.id===bt.dataset.pend);if(!rec)return;
      if(!DB||!MYID){toast("Claude にログインして、公開のURLから開くと送れます");return}
      if(!settings.nick){askNick($("rkName"),()=>bt.click());return}
      try{bt.disabled=true;const r=await doSubmit({sec:rec.sec,band:rec.band},rec.score,{sent:rec.sent,n:rec.n});dropPending(rec.id);
        toast(r.better?"記録を送りました（自己ベスト更新）":"記録を送りました");sec=rec.sec;draw()}
      catch(e){bt.disabled=false;toast("送れませんでした。もう一度試してください")}});
    if($("rkNickBtn"))$("rkNickBtn").onclick=()=>askNick($("rkName"),async n=>{
      try{const ref=DB.doc("ranks/"+MYID),snap=await ref.get();
        if(snap.exists){await ref.set({...snap.data(),nick:n,at:Date.now()});await loadRanks()}
        toast("名前を変えました")}catch(e){toast("名前を変えられませんでした")}
      draw()},settings.nick);
  };
  draw();
  if(DB){await loadRanks();if(!$("modal").hidden&&$("sheet").querySelector("[data-rs]"))draw()}
}
/* 入口：タイトルのチャレンジ・ランキング。チャレンジ中に設定を開いたら中止 */
/* 開くたびに動かすこと（画面のボタンをつなぐ など）。game.js が呼ぶ */
export function init_rank(){
  {const g=$("gear").onclick;$("gear").onclick=async()=>{
    if(S&&S.timed&&S.phase==="play"){if(await ask("チャレンジをやめますか？（この回の記録は残りません）","やめる","つづける"))showTitle();return}
    g()}}
}
