import { $, LS, LV, SV, esc, rec, save, starsOf } from './base.js';
import { startRun } from './play.js';
import { closeOv, overlay, toast } from './screens.js';
import { SE } from './sound.js';
/* ===== 単語練習：単語（直した訳）・熟語・単語集（自分で作る／みんなの） ===== */
export let WJA=null;export function wja(pos){if(!WJA){WJA={};[1,2,3].forEach(l=>{WORDS[l].forEach(w=>(WJA[w[1]]=WJA[w[1]]||[]).push(w[2]));IDIOMS[l].forEach(w=>(WJA.ph=WJA.ph||[]).push(w[2]))})}return pos==="x"?WJA.n.concat(WJA.v):(WJA[pos]||WJA.n)}
export function wordSet(lv,k,kind){const src=kind==="i"?IDIOMS:WORDS,n=WSET[lv],ws=src[lv].slice(k*n,k*n+n),nm=kind==="i"?"熟語":"単語";
  return {id:`${kind==="i"?"i":"w"}${lv}-${k+1}`,lv,word:true,title:`${LV[lv].name}の${nm} セット${k+1}`,ja:`${ws[0][0]} 〜 ${ws[ws.length-1][0]}`,tag:`${LV[lv].name}・${nm}練習`,words:ws,chunks:[]}}
export const ULKEY="cs-wordlists",USET=20,UL_DOC_MAX=250000;
export function myLists(){try{return JSON.parse(LS.getItem(ULKEY)||"[]")}catch(e){return []}}
export function saveLists(l){try{LS.setItem(ULKEY,JSON.stringify(l));return true}catch(e){return false}}
export const lineToW=l=>{const c=String(l).split("\t");return [c[0],c[2]||"x",c[1]||""]};
export let WDB=null,WME=null,WADMIN=false,SHL=null,UCAT="";
/* 共有：チャンクチャンクの「みんなの短文」と同じしくみ（共有データベースの wordlists に 1単語集＝1ドキュメント）。使えない環境では出ない */
export async function initWDB(){try{if(!window.claude||!claude.use)return;WDB=await claude.use("db");if(!WDB)return;
  const u=await claude.use("user");if(u){try{WADMIN=!!(await u.canEdit())}catch(e){}try{WME=await u.id()}catch(e){}}
  await loadSharedLists();if(!$("sWords").hidden&&SV.wtab==="u")renderWords()}catch(e){WDB=null}}
export async function loadSharedLists(){if(!WDB)return;try{const sn=await WDB.collection("wordlists").get();SHL=sn.docs.map(d=>({...d.data(),id:d.id}))}catch(e){SHL=SHL||[]}}
export function allLists(){const mine=myLists(),sid=new Set(mine.map(l=>l.sid).filter(Boolean));
  return mine.map(l=>({...l,mine:true})).concat((SHL||[]).filter(d=>!sid.has(d.id)).map(d=>({...d,shared:true,sid:d.id})))}
export function parseWordLines(text){const ok=[],errs=[],long=[],seen=new Set();
  String(text).replace(/\r/g,"").split("\n").forEach((raw,i)=>{const l=raw.trim();if(!l||l.startsWith("#"))return;
    let m=null;for(const re of[/\t/,/\s##\s/,/\s*[=＝]\s*/,/\s*,\s*/,/[ 　]+(?=[^\x00-\x7f])/]){if(re.test(l)){const k=l.search(re),mm=l.match(re)[0];m=[l.slice(0,k),l.slice(k+mm.length).split(/\t|\s##\s/)[0]];break}}
    const cl=t=>(t||"").trim().replace(/^"(.*)"$/,"$1").trim();const en=m?cl(m[0]):"",ja=m?cl(m[1]):"";
    if(!en||!ja||!/[a-zA-Z]/.test(en)||/[^\x00-\x7f’‘“”–—]/.test(en)){errs.push(`${i+1}行目「${l.slice(0,24)}」`);return}
    const k=en.toLowerCase();if(seen.has(k))return;seen.add(k);if(ja.length>12)long.push(en);ok.push(en.replace(/\s+/g," ")+"\t"+ja)});
  return {ok,errs,long}}
export function ulPlay(L,k){const ws=L.lines.map(lineToW),a=k*USET,part=ws.slice(a,a+USET);
  return {id:`u-${L.sid||L.lid}-${k+1}`,lv:+L.lv||1,word:true,title:`${L.title}（${a+1}〜${a+part.length}）`,ja:`${part[0][0]} 〜 ${part[part.length-1][0]}`,tag:`${L.cat||"単語集"}・単語練習`,words:part,chunks:[]}}
export function renderWords(){const t=SV.wtab||"w",lv=SV.lv;
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
export function renderUL(){const all=allLists(),cats=[...new Set(all.map(l=>l.cat).filter(Boolean))];if(UCAT&&!cats.includes(UCAT))UCAT="";
  $("wTitle").textContent="単語集";
  $("wNote").textContent=WDB?"自分で作った単語集と、みんなが共有した単語集（🌐）。カテゴリーで絞り込めます。":"自分で作った単語集。英語と訳を1行ずつ貼り付けるか、ファイルから読み込めます。";
  $("wtools").innerHTML=[["","すべて"],...cats.map(c=>[c,c])].map(([c,n])=>`<button class="chip ${c===UCAT?"on":""}" data-c="${esc(c)}">${esc(n)}</button>`).join("")+`<button class="chip add" id="ulAdd">＋ 作る・読み込む</button>`;
  $("wtools").querySelectorAll(".chip[data-c]").forEach(b=>b.onclick=()=>{UCAT=b.dataset.c;renderUL()});$("ulAdd").onclick=()=>ulEdit();
  const ls=all.filter(l=>!UCAT||l.cat===UCAT);
  $("wsets").innerHTML=ls.length?ls.map((l,i)=>`<button class="ulc" data-i="${i}"><span class="t"><b>${l.shared?"🌐 ":""}${esc(l.title||"無題")}</b><small>${l.lines.length}語${l.lv?"・"+LV[l.lv].name:""}${l.mine&&l.sid?"・共有中":""}</small></span>${l.cat?`<span class="cat">${esc(l.cat)}</span>`:""}</button>`).join("")
    :`<div class="ulempty">まだ単語集がありません。<br>「＋ 作る・読み込む」から、学校の単語テストの範囲や、市販の単語帳のページなどを入れてみよう。</div>`;
  $("wsets").querySelectorAll(".ulc").forEach(b=>b.onclick=()=>{SE.tap();ulOpen(ls[+b.dataset.i])})}
export function ulOpen(L){const n=Math.ceil(L.lines.length/USET),own=L.mine,canDrop=L.sid&&WDB&&(own||(L.by&&L.by===WME)||WADMIN);
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
export async function ulShare(L){if(!WDB)return;const doc={title:L.title,cat:L.cat||"",lv:+L.lv||0,lines:L.lines,by:WME||"",at:Date.now()};
  if(new TextEncoder().encode(JSON.stringify(doc)).length>UL_DOC_MAX){toast("大きすぎて共有できません。単語集を分けてください");return}
  const id=L.sid||("w"+Date.now().toString(36)+Math.random().toString(36).slice(2,6));
  try{await WDB.doc("wordlists/"+id).set(doc);const l=myLists(),m=l.find(z=>z.lid===L.lid);if(m){m.sid=id;saveLists(l)}
    SHL=(SHL||[]).filter(d=>d.id!==id).concat([{...doc,id}]);toast("みんなの単語集に送りました");closeOv();renderUL()}
  catch(e){toast(e&&e.code==="quota_exceeded"?"共有の保存数がいっぱいです。不要な単語集を取り下げてください":"送れませんでした（共有の権限がないか、通信の問題）")}}
export const UCATS=["学校の単語テスト","英検","受験","TOEIC","熟語","会話","その他"];
export function ulEdit(L){const cats=[...new Set(UCATS.concat(allLists().map(l=>l.cat).filter(Boolean)))];
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
