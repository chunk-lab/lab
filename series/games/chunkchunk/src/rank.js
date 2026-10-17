import { $, ENV, S, applyAdvanceUI, ask, closeSheet, esc, loadStage, nextRun, openSheet, primeSpeech, randomPool, saveSettings, setTotal, settings, shuffle, toast, unlockAudio, updateProg } from './engine.js';
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
  const c={excellent:0,great:0,good:0,mini:0,miss:0};
  all.forEach(x=>{const k=x.kind==="forgot"?"miss":x.kind;c[k]=(c[k]||0)+1});
  return {n:all.length,sent:S.results.filter(Boolean).length,c};
}
export function timedEnd(){
  if(!S||!S.timed||S.timedDone)return;
  S.timedDone=true;nextRun();clearTimeout(S.timer);S.phase="done";
  $("rolePick").hidden=true;ENV.core.speech.stop();
  const t=S.timed,score=S.gained,st=timedStats();
  // この端末の自己ベスト
  settings.bestTimed=settings.bestTimed||{};const lb=settings.bestTimed[t.band]=settings.bestTimed[t.band]||{};
  const localBest=lb[t.sec]||0,isBest=score>localBest;if(isBest){lb[t.sec]=score;saveSettings()}
  openSheet(`<h2>${esc(S.title)} おわり！</h2>
    <div class="big">${score} pt</div>
    <p class="note">${st.sent}文・◎${st.c.excellent} ◯${st.c.great} △${st.c.good} ・${st.c.mini} ×${st.c.miss}${isBest?"　この端末での自己ベスト！":`　この端末での自己ベスト ${localBest} pt`}</p>
    <p class="note" id="rkMsg" style="color:var(--ink);font-weight:700">ランキングに送っています…</p>
    <div id="rkName"></div>
    <div class="btns"><button class="ghost" id="rkTitle">タイトルへ</button><button class="ghost" id="rkAgain">もう一度</button><button class="primary" id="rkShow">ランキング</button></div>`,false);
  $("rkTitle").onclick=showTitle;
  $("rkAgain").onclick=()=>{closeSheet();startTimed(t.sec,t.band)};
  $("rkShow").onclick=()=>showRanking(t.sec,t.band);
  submitRank(t,score,st);
  document.dispatchEvent(new CustomEvent("cc:challenge",{detail:{score,sec:t.sec,best:isBest}}));
}
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
export async function submitRank(t,score,st){
  const msg=$("rkMsg");if(!msg)return;
  if(!DB||!MYID){msg.textContent="ランキングは、Claude にログインして開いたときだけ参加できます。";return}
  if(score>t.sec*RANK_MAX_PPS){msg.textContent="記録が正しく取れなかったため、ランキングには送りませんでした。";return}
  if(!settings.nick){msg.textContent="ランキングに出す名前を決めてください。";askNick($("rkName"),()=>{msg.textContent="ランキングに送っています…";submitRank(t,score,st)});return}
  try{
    const ref=DB.doc("ranks/"+MYID),snap=await ref.get(),d=snap.exists?snap.data():{};
    const best=JSON.parse(JSON.stringify(d.best||{}));best[t.band]=best[t.band]||{};
    const cur=best[t.band][t.sec],better=!cur||score>cur.score;
    if(better)best[t.band][t.sec]={score,at:Date.now(),sent:st.sent,chunks:st.n};
    await ref.set({v:1,nick:settings.nick,best,at:Date.now()});
    await loadRanks();
    const list=rankList(t.band,t.sec),pos=list.findIndex(r=>r.id===MYID)+1;
    if($("rkMsg"))$("rkMsg").textContent=(better?"ランキングの自己ベスト更新！ ":`ランキングの自己ベストは ${cur.score} pt。 `)+(pos?`全体 ${pos}位 / ${list.length}人`:"");
  }catch(e){if($("rkMsg"))$("rkMsg").textContent="ランキングに送れませんでした（通信の問題かもしれません）。"}
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
      ${DB&&MYID?`<div id="rkName"></div>`:""}
      <div class="btns">${DB&&MYID?`<button class="ghost" id="rkNickBtn">名前を変える</button>`:""}<button class="primary" id="closeBtn">閉じる</button></div>`);
    $("sheet").querySelectorAll("[data-rs]").forEach(b=>b.onclick=()=>{sec=+b.dataset.rs;draw()});
    $("sheet").querySelectorAll("[data-rb]").forEach(b=>b.onclick=()=>{band=b.dataset.rb;draw()});
    $("closeBtn").onclick=closeSheet;
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
