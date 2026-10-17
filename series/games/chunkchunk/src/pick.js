import { LVO, QUESTIONS, STORIES } from './data.js';
import { $, LV, LVGROUP, LVSYS, back, closeSheet, esc, isRec, lvLabel, openSheet, opt, randLabel, saveSettings, settings, startPractice, tell, toast } from './engine.js';
import { builtinStory, startRead } from './reading.js';
import { shortPickItems } from './shorts.js';
import { DB, IS_ADMIN, SHARED, loadMy, loadShared, myToStory } from './texts.js';
/* スタディ：読む／練習する文章を選ぶ（難易度で並べ替え・絞り込み・おすすめ） */
export let pickTok=0;
export function pickText(kind,noFetch){
  const tok=++pickTok;
  if(DB&&!noFetch)loadShared().then(()=>{if(tok===pickTok&&!$("modal").hidden&&$("sheet").querySelector("#optMyLv"))pickText(kind,true)});
  const mine=loadMy().filter(t=>t.sents&&t.sents.length),shr=(SHARED||[]).filter(t=>t.sents&&t.sents.length);
  const lvOf=(key,base)=>key&&LVO[key]!=null?LVO[key]:(base||null);
  let items=kind==="read"
    ?[...STORIES.filter(s=>QUESTIONS[s.title]).map((s,i)=>({label:s.title,key:s.id,level:lvOf(s.id,s.level),sub:`内蔵・${QUESTIONS[s.title].length}問`,ord:1000+i,go:()=>startRead(builtinStory(s))})),
      ...shr.map((t,i)=>({label:t.title||"（無題）",key:"t-"+t.id,level:lvOf("t-"+t.id,t.level),sub:`みんなの長文・${t.sents.length}文・${(t.questions||[]).length}問${t.mode==="test"?"・テスト":""}`,ord:500+i,go:()=>startRead({...myToStory(t),level:lvOf("t-"+t.id,t.level)})})),
      ...mine.map((t,i)=>({label:t.title||"（無題）",level:t.level||null,sub:`My Text・${t.sents.length}文・${(t.questions||[]).length}問${t.mode==="test"?"・テスト":""}`,ord:i,go:()=>startRead(myToStory(t))}))]
    :[...shortPickItems(),
      ...shr.map((t,i)=>({label:t.title||"（無題）",key:"t-"+t.id,level:lvOf("t-"+t.id,t.level),sub:`みんなの長文・${t.sents.length}文`,ord:500+i,go:()=>startPractice(t)})),
      ...mine.map((t,i)=>({label:t.title||"（無題）",level:t.level||null,sub:`My Text・${t.sents.length}文`,ord:i,go:()=>startPractice(t)}))];
  const [,lo,hi]=LVGROUP[settings.lvFilter]||LVGROUP.all;
  const shown=items.filter(it=>settings.lvFilter==="rec"?isRec(it.level):settings.lvFilter==="all"||!it.level||(it.level>=lo&&it.level<=hi));
  const m=+settings.myLevel||0,dist=it=>it.level?Math.abs(it.level-m):0.5;
  shown.sort((x,y)=>settings.lvSort==="easy"?(x.level||0)-(y.level||0):settings.lvSort==="hard"?(y.level||0)-(x.level||0):settings.lvSort==="rec"&&m?dist(x)-dist(y):x.ord-y.ord);
  openSheet(`<h2>${kind==="read"?"Reading":"Chunk Practice"}</h2>
    <div class="row"><label for="optMyLv">自分のレベル</label>${opt("optMyLv",String(settings.myLevel||0),[["0","未設定"],...LV.slice(1).map((_,i)=>[String(i+1),lvLabel(i+1)])])}</div>
    <div class="row"><label for="optLvSys">レベルの表し方</label>${opt("optLvSys",settings.lvSys,Object.entries(LVSYS))}</div>
    <div class="row"><label for="optLvF">絞り込み</label>${opt("optLvF",settings.lvFilter,Object.entries(LVGROUP).map(([k,v])=>[k,v[0]]))}</div>
    <div class="row"><label for="optLvS">並べ方</label>${opt("optLvS",settings.lvSort,[["rec","おすすめ順"],["easy","やさしい順"],["hard","難しい順"],["new","登録順"]])}</div>
    <div class="row"><label for="optLvA">結果でおすすめを自動調整</label>${opt("optLvA",settings.lvAuto===false?"off":"on",[["on","オン"],["off","オフ"]])}</div>
    ${kind==="practice"?`<div class="row"><label for="optRole">役割も答える</label>${opt("optRole",settings.roleAns===false?"off":"on",[["on","オン"],["off","オフ"]])}</div>
      <button class="ghost pickRand" style="text-align:left;flex:none"><b style="color:var(--ink)">ランダム</b><br><small>内蔵の例文と短文から（${esc(randLabel())}）</small></button>`:""}
    ${shown.length?"":`<p class="note">この条件の文章はありません。</p>`}
    ${shown.map((it,i)=>`<div class="pickRow"><button class="ghost pickItem" data-i="${i}" style="text-align:left;flex:none"><b style="color:var(--ink)">${m&&isRec(it.level)?"★ ":""}${esc(it.label)}</b><br><small>${esc(lvLabel(it.level))}${it.key&&LVO[it.key]!=null?"（修正済み）":""}・${esc(it.sub)}</small></button>${it.key&&IS_ADMIN&&DB?`<button class="lvFix" data-i="${i}">難易度を直す</button>`:""}</div>`).join("")}
    <div class="btns"><button class="ghost" id="closeBtn">閉じる</button></div>`);
  const re=()=>pickText(kind,true);
  $("optMyLv").onchange=e=>{settings.myLevel=+e.target.value;settings.lvUp=settings.lvDown=0;saveSettings();re()};
  $("optLvSys").onchange=e=>{settings.lvSys=e.target.value;saveSettings();re()};
  $("optLvF").onchange=e=>{settings.lvFilter=e.target.value;saveSettings();re()};
  $("optLvS").onchange=e=>{settings.lvSort=e.target.value;saveSettings();re()};
  $("optLvA").onchange=e=>{settings.lvAuto=e.target.value==="on";saveSettings()};
  if(kind==="practice"){$("optRole").onchange=e=>{settings.roleAns=e.target.value==="on";saveSettings()};
    $("sheet").querySelector(".pickRand").onclick=()=>{closeSheet();$("title").hidden=true;startPractice(null)}}
  $("sheet").querySelectorAll(".pickItem").forEach(b=>b.onclick=()=>{closeSheet();$("title").hidden=true;shown[+b.dataset.i].go()});
  $("sheet").querySelectorAll(".lvFix").forEach(b=>b.onclick=()=>editLevel(shown[+b.dataset.i],re));
  $("closeBtn").onclick=closeSheet;
}
/* 難易度を直す（編集権限のある人だけ）。直した値は共有データベースに入り、みんなに反映される */
export function editLevel(it,back){
  const cur=it.level||3,has=LVO[it.key]!=null;
  openSheet(`<h2>難易度を直す</h2><p class="note"><b>${esc(it.label)}</b><br>直すと、この文章を開く全員の難易度が変わります。</p>
    <div class="row"><label for="optFixLv">難易度</label>${opt("optFixLv",String(cur),LV.slice(1).map((_,i)=>[String(i+1),lvLabel(i+1)]))}</div>
    <div class="btns"><button class="ghost" id="fixCancel">やめる</button>${has?`<button class="ghost" id="fixReset">元に戻す</button>`:""}<button class="primary" id="fixOk">直す</button></div>`);
  $("fixCancel").onclick=back;
  $("fixOk").onclick=async()=>{const n=+$("optFixLv").value;
    try{await DB.doc("levels/"+it.key).set({level:n});LVO[it.key]=n;toast("難易度を直しました（みんなに反映）")}catch(e){await tell("直せませんでした。編集の権限がないか、通信の問題かもしれません。");}
    back()};
  if(has)$("fixReset").onclick=async()=>{try{await DB.doc("levels/"+it.key).delete();delete LVO[it.key];toast("元に戻しました")}catch(e){await tell("元に戻せませんでした。")}back()};
}
