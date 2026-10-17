/* チャンクチャンク：短文をまとめて入れる */
/* ===== 短文をまとめて入れる =====
 1行＝1文： 役割:英語=チャンク訳 | 役割:英語=チャンク訳 … ## 全体訳 ## ランク(1〜10) ## 用途
 区切りは「 ## 」かタブ（Excel からのコピーはタブになる）。訳・ランク・用途は省略してもよい。「#」で始まる行はメモとして読み飛ばす */
const SHORTKEY="ccs-shorts",SHORT_DOC_MAX=250000;   // 1つのまとまりの上限（共有DBの1ドキュメントは256KiBまで。少し余裕を残す）
const shortToLine=x=>[x.s,x.ja||"",x.lv||"",x.cat||""].join("\t");
function lineToShort(l){const [s,ja,lv,cat]=String(l).split("\t");return {s,ja:ja||"",lv:+lv||null,cat:cat||""}}
const byteLen=s=>new TextEncoder().encode(s).length;
function shortDocSize(title,lines){return byteLen(JSON.stringify({title,lines,by:"u_0000000000000000000000",at:Date.now()}))}
function loadMyShorts(){try{return JSON.parse(localStorage.getItem(SHORTKEY)||"[]")}catch(e){return []}}
function saveMyShorts(l){try{localStorage.setItem(SHORTKEY,JSON.stringify(l));return true}catch(e){return false}}
function shortsShared(){return (SHORTS||[]).flatMap(d=>(d.lines?d.lines.map(lineToShort):(d.items||[])).map(x=>({...x,doc:d.id})))}
const shortDocCount=d=>(d.lines||d.items||[]).length;
function shortsAll(){const seen=new Set(),out=[];[...shortsShared(),...loadMyShorts()].forEach(x=>{if(x&&x.s&&!seen.has(x.s)){seen.add(x.s);out.push(x)}});return out}
async function loadShorts(){
  if(!DB)return SHORTS;
  try{const snap=await DB.collection("shorts").get();SHORTS=snap.docs.map(d=>({...d.data(),id:d.id}))}catch(e){SHORTS=SHORTS||[]}
  return SHORTS;
}
function parseShortLines(text){
  const ok=[],errs=[],seen=new Set();
  String(text).replace(/\r/g,"").split("\n").forEach((raw,li)=>{
    const line=raw.trim();if(!line||line.startsWith("#")||line.startsWith("```"))return;   // 空行・メモ・コードブロックの線は飛ばす
    const cols=line.split(/\t|\s##\s/).map(c=>c.trim());
    const units=cols[0].split(/\s*[|｜]\s*(?=[SVOICPTMRF]\s*[:：])/);
    const parts=[];let bad="";
    units.forEach(u=>{
      const m=u.match(/^([SVOICPTMRF])\s*[:：]\s*(.+)$/);if(!m){bad=bad||`役割の文字（S: V: など）がない：「${u}」`;return}
      let body=m[2].trim();const hi=body.indexOf("#");let head=hi>=0?body.slice(0,hi):body,note=hi>=0?body.slice(hi):"";
      if(!head.includes("=")&&head.includes("＝"))head=head.replace("＝","=");
      if(!head.includes("="))head+="=";
      const en=head.slice(0,head.indexOf("=")).trim();
      if(!/[A-Za-z0-9]/.test(en)){bad=bad||`英語がない：「${u}」`;return}
      parts.push(`${m[1]}:${en.replace(/\s+/g," ")}=${head.slice(head.indexOf("=")+1).trim()}${note}`);
    });
    if(!bad&&!parts.length)bad="チャンクがない";
    const s=parts.join(" | ");
    if(!bad){try{const sen=parseSentence(s,"");if(!sen.words.length||sen.words.some(w=>!w))bad="英語の区切りがおかしい"}catch(e){bad="形が読み取れない"}}
    if(bad){errs.push({no:li+1,line,why:bad});return}
    if(seen.has(s))return;seen.add(s);
    let lv=null,cat="";
    cols.slice(2).forEach(c=>{if(!c)return;const n=/^(?:Lv\.?|ランク)?\s*(\d{1,2})$/i.exec(c);if(n&&lv==null&&+n[1]>=1&&+n[1]<=10)lv=+n[1];else if(!cat)cat=c});
    ok.push({s,ja:cols[1]||"",lv,cat});
  });
  return {ok,errs};
}
function buildShortPrompt(asFile){
  return `英語の短文を、日本人学習者向けの「チャンク読み」ゲーム用に、1行1文の形式にしてください。
${asFile?`結果は、ファイル作成の機能を使って、ダウンロードできるテキストファイル（.txt、文字コードは UTF-8）として作ってください。チャットに中身を書き出すのではなく、ファイルそのものを渡してください。
・ファイル名は chunk_shorts.txt にする。
・1行ごとの区切りは、下の形式のとおり「 ## 」にする。
・ファイルの中身は1行1文だけにする。見出し・説明・空行・コードブロックの線（\`\`\`）は入れない。
・チャットには、ファイルと「何文作ったか」だけを返す。`:`結果はコードブロック（\`\`\`）の中に、1行1文で書いてください。コードブロックの外には何も書かないでください。`}

形式（1行＝1文）：
役割:英語=チャンクの訳 | 役割:英語=チャンクの訳 | … ## 文全体の訳 ## ランク ## 用途

例：
S:My sister=姉は | V:read=読んだ | O:an old book=古い本を | T:after lunch.=昼食のあと ## 姉は昼食のあと古い本を読んだ。 ## 3 ## 基本の順番
S:Emma=エマは | V:takes care of=世話をする | O:her little sister=妹の | T:after school.=放課後 ## エマは放課後、妹の世話をする。 ## 4 ## 熟語のまとまり
S:The man / by the window=窓のそばの男の人は{男の人/窓のそばの} | V:is=だ | C:my father.=私の父 ## 窓のそばの男の人は私の父だ。 ## 4 ## 長い主語・節

ルール：
・英語は元の単語・記号のまま、順番どおりに、もれなく入れる。
・役割は次のどれか1文字。
  S＝主語（後ろから説明がつく主語も、説明ごと S に含める）
  V＝動詞のまとまり（助動詞、否定、usually などの頻度の副詞、句動詞の up・out など、to不定詞の動詞、take care of・look forward to・be good at などの熟語も含める）
  O＝目的語　I＝「誰に」にあたる目的語　C＝補語
  P＝場所　T＝時（when… や after… などの時の節も含む）
  M＝様子・手段・誰と・目的・その他　R＝理由（because… など）　F＝条件（if… など）
・主語や目的語に後ろから説明がつくときは、英語を「中心 / 説明」と / で分け、訳の最後に {中心の訳/説明の訳} を付ける（3つ目の例）。
・動詞のまとまりが「熟語＋動詞」のとき（managed to finish、want to visit など）は、英語を「熟語 / 動詞」と / で分け、訳の最後に {熟語の訳/動詞の訳} を付ける。例：V:managed to / finish=なんとか終えた{なんとか〜した/終える}
・チャンクの訳は、つなげて読める形にする（主語は「〜は／〜が」、目的語は「〜を」など）。
・ランク：難易度を1〜10の数字で。1＝入門（小学校低〜中学年） 2＝小学校高学年 3＝中1・英検5級 4＝中2・英検4級 5＝中3・英検3級 6＝高1〜2・英検準2級 7＝高3・英検2級 8＝難関大・英検準1級 9＝大学・英検1級 10＝それ以上
・用途：次のどれか。当てはまらなければ、内容に合う短い名前を付ける。
  基本の順番／動詞のまとまり／熟語のまとまり／長い主語・節

文：
（この下に英文を貼り付けるか、「中1レベルで、熟語のまとまりの文を30文作って」のように書いてください）
`;
}
function renderShortEditor(){
  $("edHead").textContent="短文をまとめて入れる";
  const canShare=!!(DB&&IS_ADMIN),mine=loadMyShorts(),shared=SHORTS||[];
  const sum=list=>{const c={};list.forEach(x=>{const k=`${x.cat||"用途なし"}・${x.lv?"ランク"+x.lv:"ランクなし"}`;c[k]=(c[k]||0)+1});
    return Object.entries(c).sort().map(([k,n])=>`${esc(k)}：${n}文`).join("<br>")||"まだありません。"};
  $("edBody").innerHTML=`<h3>FORMAT</h3>
    <p class="edStatus">1行に1文。チャンクを「 | 」で区切り、「 ## 」（またはタブ）のあとに全体訳・ランク・用途を書きます。訳・ランク・用途は省略できます。</p>
    <textarea readonly style="min-height:64px;font-size:12px">S:My sister=姉は | V:read=読んだ | O:an old book=古い本を | T:after lunch.=昼食のあと ## 姉は昼食のあと古い本を読んだ。 ## 3 ## 基本の順番</textarea>
    <p class="edStatus">用途を「基本の順番」「動詞のまとまり」「熟語のまとまり」「長い主語・節」にすると、ゲームのランダムでその面に出ます。ほかの用途はミックス（面5〜）に出ます。STUDY の Chunk Practice では、ランク別・用途別に選べます。</p>
    <h3>FILE</h3>
    <ol class="edSteps"><li>下の「ファイル用の指示文をコピー」を押す</li><li>ファイルを作れるAI（Claude など）に貼り付け、続けて英文（または作ってほしい内容）を書いて送る</li><li>できた chunk_shorts.txt を、下の枠に入れる（ドロップ、またはタップして選ぶ）。それだけで入ります</li></ol>
    <div class="edRow"><button class="edBtn pri" id="shCopyFile">ファイル用の指示文をコピー</button></div>
    <div class="edRow edSet"><label>入れ先 <select id="shDest"><option value="mine">自分の短文（この端末だけ）</option>${canShare?`<option value="shared">みんなの短文（全員のゲームに出る）</option>`:""}</select></label>
      <label>名前（任意） <input type="text" id="shName" placeholder="例：熟語セット1" style="width:140px"></label></div>
    <button class="edBtn" id="shDrop" style="width:100%;min-height:96px;border-style:dashed;font-size:14px">ここにファイルをドロップ<br><small style="color:#9aa6b8">またはタップして選ぶ（.txt）</small></button>
    <input type="file" id="shFile" accept=".txt,.tsv,text/plain" hidden>
    <details class="edCopy"><summary>指示文の中身を見る</summary><textarea id="shPrompt" aria-label="AI用の指示文（ファイル用）" style="min-height:160px;font-size:12px"></textarea></details>
    <h3>PASTE</h3>
    <p class="edStatus">文を直接貼って入れることもできます。AIにチャットで返してもらうときは、こちらの指示文を使います。</p>
    <div class="edRow"><button class="edBtn" id="shCopyChat">チャット用の指示文をコピー</button></div>
    <textarea id="shIn" placeholder="ここに貼り付け（何行でもOK）" style="min-height:140px;font-size:13px"></textarea>
    <div class="edRow"><button class="edBtn pri" id="shCheck">確認する</button></div>
    <div class="edStatus" id="edStatus"></div>
    <div id="shPreview"></div>
    <h3>MY SHORTS（${mine.length}文）</h3><p class="edStatus">${sum(mine)}</p>
    ${mine.length?`<details class="edCopy" id="shMineBox"><summary>1文ずつ見る・直す・消す</summary><div id="shMineList" class="shList"></div></details>
      <div class="edRow"><button class="edBtn del" id="shClearMine">自分の短文を全部消す</button></div>`:""}
    ${DB?`<h3>みんなの短文（${shortsShared().length}文）</h3>
      ${shared.length?shared.map((d,i)=>`<div class="edItem"><b>${esc(d.title||"（名前なし）")}</b><small>${shortDocCount(d)}文・${d.at?new Date(d.at).toLocaleDateString():""}</small>${canShare?`<div class="edRow"><button class="edBtn" data-shedit="${i}">1文ずつ見る・直す</button><button class="edBtn del" data-shdrop="${i}">取り下げ</button></div><div class="shList" id="shDoc${i}" hidden></div>`:""}</div>`).join(""):`<p class="edStatus">まだありません。</p>`}`:""}
    <div class="edRow" style="margin-top:8px"><button class="edBtn" id="shBack">一覧へ戻る</button></div>`;
  $("shPrompt").value=buildShortPrompt(true);
  const copyP=async f=>{const t=buildShortPrompt(f);const ok=await copyText(t);
    if(!ok){const d=$("edBody").querySelector(".edCopy");d.open=true;$("shPrompt").value=t;const ta=$("shPrompt");ta.focus();ta.select()}
    edStatus(ok?"コピーしました。AIに貼り付けて送ってください。":"自動でコピーできませんでした。指示文を選択したので、そのままコピーしてください。")};
  $("shCopyFile").onclick=()=>copyP(true);
  $("shCopyChat").onclick=()=>copyP(false);
  const takeFile=async f=>{if(!f)return;
    let t;try{t=await f.text()}catch(err){edStatus("ファイルを読み込めませんでした。");return}
    $("shIn").value=t;shCheck(true,f.name)};
  $("shDrop").onclick=()=>$("shFile").click();
  $("shFile").onchange=e=>{const f=e.target.files[0];e.target.value="";takeFile(f)};
  const dz=$("shDrop");
  ["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor="var(--accent)"}));
  ["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor=""}));
  dz.addEventListener("drop",e=>{const f=e.dataTransfer&&e.dataTransfer.files[0];takeFile(f)});
  $("shBack").onclick=renderMyList;
  if($("shClearMine"))$("shClearMine").onclick=async()=>{
    if(!(await ask(`自分の短文 ${loadMyShorts().length}文を、全部消しますか？`,"消す")))return;
    if(!(await ask("消した短文は元に戻せません。本当に消しますか？","本当に消す")))return;
    saveMyShorts([]);toast("自分の短文を消しました");renderShortEditor()};
  $("edBody").querySelectorAll("[data-shdrop]").forEach(b=>b.onclick=async()=>{const d=shared[+b.dataset.shdrop];
    if(!(await ask(`「${d.title||"名前なし"}」（${shortDocCount(d)}文）を、みんなの短文から取り下げますか？\n全員のゲームから消えます。`,"取り下げる")))return;
    try{await DB.doc("shorts/"+d.id).delete();SHORTS=SHORTS.filter(x=>x.id!==d.id);toast("取り下げました")}catch(e){await tell("取り下げできませんでした。")}
    renderShortEditor()});
  $("shCheck").onclick=()=>shCheck(false);
  /* 1文ずつ直す：自分の短文 */
  if($("shMineBox"))$("shMineBox").addEventListener("toggle",()=>{if($("shMineBox").open&&!$("shMineList").innerHTML)
    shortItemsEditor($("shMineList"),loadMyShorts,async items=>saveMyShorts(items))},{once:false});
  /* 1文ずつ直す：みんなの短文（まとまりごとに保存し直す） */
  $("edBody").querySelectorAll("[data-shedit]").forEach(b=>b.onclick=()=>{const i=+b.dataset.shedit,box=$("shDoc"+i);
    box.hidden=!box.hidden;if(box.hidden||box.innerHTML)return;
    const cur=()=>{const d=(SHORTS||[]).find(x=>x.id===shared[i].id);return d?(d.lines?d.lines.map(lineToShort):(d.items||[])):[]};
    shortItemsEditor(box,cur,async items=>{const d=(SHORTS||[]).find(x=>x.id===shared[i].id);if(!d)return false;
      const lines=items.map(shortToLine);if(shortDocSize(d.title||"",lines)>SHORT_DOC_MAX){await tell("このまとまりに入る量を超えています。");return false}
      const doc={title:d.title||"",lines,by:d.by||MYID||null,at:Date.now()};
      try{await DB.doc("shorts/"+d.id).set(doc);SHORTS=SHORTS.map(x=>x.id===d.id?{...doc,id:d.id}:x);return true}catch(e){return false}})});
  /* auto＝ファイルを入れたとき：問題がなければ、そのまま入れる */
  function shCheck(auto,fileName){
    const {ok,errs}=parseShortLines($("shIn").value);
    const shared=$("shDest").value==="shared",name=$("shName").value.trim()||(fileName?fileName.replace(/\.[^.]+$/,""):new Date().toLocaleDateString()+" の短文");
    const have=new Set((shared?shortsShared():loadMyShorts()).map(x=>x.s));
    const fresh=ok.filter(x=>!have.has(x.s)),dup=ok.length-fresh.length;
    let fit=fresh.length,pct=0;
    if(shared&&fresh.length){const lines=fresh.map(shortToLine);
      if(shortDocSize(name,lines)>SHORT_DOC_MAX){let lo=0,hi=lines.length;while(lo<hi){const m=Math.ceil((lo+hi)/2);if(shortDocSize(name,lines.slice(0,m))<=SHORT_DOC_MAX)lo=m;else hi=m-1}fit=lo}
      pct=Math.round(shortDocSize(name,lines.slice(0,fit))/SHORT_DOC_MAX*100)}
    const over=fit<fresh.length;
    if(auto&&fresh.length&&!errs.length&&!over){addShorts(fresh,fit,name,shared,dup);return}
    const lvs=fresh.filter(x=>x.lv).length,cats=[...new Set(fresh.map(x=>x.cat).filter(Boolean))];
    $("shPreview").innerHTML=`<div class="edItem"><b>${!fresh.length?(dup?`${dup}文とも、すでに入っています`:"入れられる文がありません"):over?`1回に入れられる量を超えています（${fresh.length}文のうち、${fit}文まで入ります）`:`${fresh.length}文を入れられます`}</b>
      ${fileName?`<small>「${esc(fileName)}」の中身を確認しました${errs.length?"（読めない行があるので止めています）":over?"（多すぎるので止めています）":""}</small>`:""}
      ${shared&&fresh.length?`<small>このまとまりの大きさ：${pct}％${over?"（入れなかった行は、貼り付け欄に残ります）":""}</small>`:""}
      ${fresh.length?`<small>ランクあり ${lvs}文・用途：${cats.length?cats.map(esc).join("、"):"なし"}${dup?`・すでに入っている ${dup}文は飛ばします`:""}</small>`:""}
      ${fresh.slice(0,3).map(x=>`<small style="font-family:var(--en)">${esc(parseSentence(x.s,"").words.join(" "))}</small>`).join("")}
      ${errs.length?`<small style="color:#ff8f8f">読み込めない行が ${errs.length}行あります（この行は入れません）：</small>${errs.slice(0,10).map(e=>`<small style="color:#ff8f8f">${e.no}行目：${esc(e.why)}</small>`).join("")}${errs.length>10?`<small style="color:#ff8f8f">ほか ${errs.length-10}行</small>`:""}`:""}
      ${fit?`<div class="edRow"><button class="edBtn pri" id="shAdd">${over?`最初の${fit}文だけ入れる`:`${fresh.length}文を入れる`}</button></div>`:""}</div>`;
    edStatus(ok.length||errs.length||dup?"":"入れる行がありません。");
    if(fit)$("shAdd").onclick=()=>addShorts(fresh,fit,name,shared,dup);
  }
  async function addShorts(fresh,fit,name,shared,dup){
    const skip=dup?`（すでに入っていた${dup}文は飛ばしました）`:"";
    if(!shared){const l=loadMyShorts().concat(fresh);
      if(saveMyShorts(l)){renderShortEditor();edStatus(`自分の短文に ${fresh.length}文を入れました${skip}`);toast(`${fresh.length}文を入れました`)}
      else tell("保存できませんでした。この画面ではブラウザへの保存が使えないようです。");return}
    const b=$("shAdd");if(b)b.disabled=true;
    const part=fresh.slice(0,fit),rest=fresh.slice(fit),id="s"+Date.now();
    const doc={title:name,lines:part.map(shortToLine),by:MYID||null,at:Date.now()};
    try{await DB.doc("shorts/"+id).set(doc);SHORTS=(SHORTS||[]).concat([{...doc,id}]);
      renderShortEditor();$("shDest").value="shared";
      if(rest.length){$("shIn").value=rest.map(shortToLine).join("\n");edStatus(`みんなの短文に ${fit}文を入れました${skip}。残りの${rest.length}文は貼り付け欄に残してあります。続けて入れるときは「確認する」を押してください。`)}
      else edStatus(`みんなの短文に ${fit}文を入れました${skip}`);
      toast(`みんなの短文に ${fit}文を入れました`)}
    catch(e){await tell(e&&e.code==="quota_exceeded"?"共有の保存数がいっぱいです。不要な長文や短文を取り下げてください。":"入れられませんでした。編集の権限がないか、通信の問題かもしれません。");if(b)b.disabled=false}
  }
}
/* Chunk Practice の選択肢：ランク別・用途別の短文 */
function shortPickItems(){
  const all=shortsAll();if(!all.length)return [];
  const byLv={},byCat={};all.forEach(x=>{(byLv[x.lv||0]=byLv[x.lv||0]||[]).push(x);if(x.cat)(byCat[x.cat]=byCat[x.cat]||[]).push(x)});
  return [...Object.keys(byLv).sort((a,b)=>a-b).map((lv,i)=>({label:+lv?`短文 ランク${lv}`:"短文 ランクなし",level:+lv||null,sub:`ランク別・${byLv[lv].length}文`,ord:800+i,go:()=>startShortPractice(byLv[lv],+lv?`短文 ランク${lv}`:"短文")})),
    ...Object.keys(byCat).sort().map((c,i)=>({label:`短文：${c}`,level:null,sub:`用途別・${byCat[c].length}文`,ord:900+i,go:()=>startShortPractice(byCat[c],`短文：${c}`)}))];
}

/* 短文を1文ずつ見る・直す・消す（自分の短文も、みんなの短文のまとまりも同じ画面） */
const shLine=x=>[x.s,x.ja||"",x.lv||"",x.cat||""].join(" ## ").replace(/( ## )+$/,"");
function shortItemsEditor(box,getItems,save){
  let q="",openI=-1;
  const draw=()=>{
    const items=getItems(),key=x=>(x.s+" "+(x.ja||"")+" "+(x.cat||"")).toLowerCase();
    const hits=items.map((x,i)=>[x,i]).filter(([x])=>!q||key(x).includes(q.toLowerCase()));
    box.innerHTML=`<input type="text" class="shFind" placeholder="さがす（英語・訳・用途）" value="${esc(q)}">
      <small class="edStatus">${hits.length}文${hits.length>50?"（最初の50文を表示。さがすと絞れます）":""}</small>
      ${hits.slice(0,50).map(([x,i])=>`<div class="edItem shRow" data-i="${i}">${i===openI
        ?`<textarea class="shEd" style="min-height:76px;font-size:12px">${esc(shLine(x))}</textarea>
          <div class="edRow"><button class="edBtn pri" data-act="save">上書きする</button><button class="edBtn" data-act="cancel">やめる</button><button class="edBtn del" data-act="del">この文を消す</button></div>
          <small class="shErr" style="color:#ff8f8f"></small>`
        :`<small style="font-family:var(--en);color:#e8ecf2;font-size:13px">${esc(parseSentence(x.s,"").words.join(" "))}</small>
          <small>${esc(x.ja||"（訳なし）")}${x.lv?`・ランク${x.lv}`:""}${x.cat?`・${esc(x.cat)}`:""}</small>
          <div class="edRow"><button class="edBtn" data-act="edit">直す</button></div>`}</div>`).join("")}`;
    const f=box.querySelector(".shFind");
    f.oninput=()=>{q=f.value;const p=f.selectionStart;draw();const g=box.querySelector(".shFind");g.focus();g.setSelectionRange(p,p)};
    box.querySelectorAll(".shRow").forEach(row=>{const i=+row.dataset.i,err=t=>{const e=row.querySelector(".shErr");if(e)e.textContent=t};
      row.querySelectorAll("[data-act]").forEach(b=>b.onclick=async()=>{const act=b.dataset.act;
        if(act==="edit"){openI=i;draw();const t=box.querySelector(".shEd");if(t)t.focus();return}
        if(act==="cancel"){openI=-1;draw();return}
        const items=getItems().slice();
        if(act==="del"){if(!(await ask("この文を消しますか？","消す")))return;items.splice(i,1)}
        else{const {ok,errs}=parseShortLines(row.querySelector(".shEd").value);
          if(errs.length){err("読み込めません："+errs[0].why);return}
          if(ok.length!==1){err("1行に1文だけ書いてください");return}
          if(items.some((x,j)=>j!==i&&x.s===ok[0].s)){err("同じ文が、ほかにすでにあります");return}
          items[i]=ok[0]}
        b.disabled=true;
        if(await save(items)){openI=-1;toast(act==="del"?"消しました":"上書きしました");draw()}
        else{b.disabled=false;err("保存できませんでした")}
      })});
  };
  draw();
}
