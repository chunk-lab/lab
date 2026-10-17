/* チャンクチャンク：STUDY（Reading・Chunk Practice の役割・My Texts・共有の長文） */
/* ===== みっけ！チャンク（読解モード） =====
 問題：[文の番号, 答えのユニットの番号, 問題文]。ユニットの番号は、その文を「 | 」で分けた何番目か（0から） */
let RD=null,readN=0;
function builtinStory(s){const sens=s.list.map(([en,ja])=>parseSentence(en,ja));
  return {title:s.title,list:s.list,level:(LVO[s.id]??s.level),questions:(QUESTIONS[s.title]||[]).map(([si,ui,q])=>{const u=sens[si].units[ui];return {type:"range",si,a:u.s,b:u.e,alts:[],partials:[],q}})}}
function startRead(story){
  loadDictX(()=>{if(RD&&!$("readView").hidden)rdInfoUI()});   // 追加の辞書（約1万語）
  try{speechSynthesis.cancel()}catch(e){}
  if(!story){const pool=STORIES.filter(s=>QUESTIONS[s.title]);story=builtinStory(pool[readN++%pool.length])}
  RD={st:story,sens:story.list.map(([en,ja])=>parseSentence(en,ja)),qs:story.questions.map(q=>({...q,ans:null})),
      qi:0,si:0,p:0,start:null,sel:null,hints:0,hintOn:false,hintQ:new Set(),gpos:[],view:settings.rdView||"read",gramOn:!!settings.rdAlways,showJa:false,info:null,
      hintPolicy:story.mode==="test"?(story.hint||"none"):"grammar",hintCost:story.mode==="test"?(story.hintCost==null?20:+story.hintCost):0};
  $("rdTitle").textContent=`${story.mode==="test"?"TEST":"Reading"}｜${story.title}${story.level?`（Lv${story.level}）`:""}`;
  $("readView").hidden=false;rdRender(true);
}
const rdSen=()=>RD.sens[RD.si];
function rdView(){return RD.st.mode==="test"?"solve":(RD.qs.length?RD.view:"read")}
function rdModeUI(view){
  const test=RD.st.mode==="test",hasQ=RD.qs.length>0;
  $("rdSeg").hidden=test||!hasQ;
  $("rdSeg").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.v===view));
  $("rdGram").hidden=view!=="read";$("rdGram").classList.toggle("on",!!RD.gramOn);
  $("rdJaBtn").hidden=view!=="read"||test||settings.rdJa===false;$("rdJaBtn").classList.toggle("on",!!RD.showJa);
  $("rdHint").hidden=view!=="solve"||RD.hintPolicy==="none";$("rdHint").classList.toggle("on",!!RD.hintOn);
  $("rdHint").textContent="💡ヒント"+(RD.hintCost?`（−${RD.hintCost}点）`:"");
  $("rdModeRow").hidden=[...$("rdModeRow").children].every(c=>c.hidden);
}
/* 読むモードのタップ：「チャンク」オフ＝単語（品詞／＋意味）、オン＝チャンク（役割＋説明／＋意味）。意味は「訳」オンのときだけ */
const POSPREF={S:["n","pr","art","det","adj","num"],O:["n","pr","art","det","adj","num"],I:["pr","n"],C:["adj","n","pr"],
  P:["prep","n","art","det","adj","adv"],T:["prep","conj","n","adv","det","art"],M:["prep","adv","n","art","det","adj"],R:["conj","prep"],F:["conj"]};
function wordInfoHTML(sen,wi,ja){
  const raw=sen.words[wi],clean=raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9'’]+$/g,""),e=lookupWord(raw);
  const ph=phraseAt(sen.words,wi),phH=ph?`<div class="riNote">熟語・複合語：<b>${esc(ph.ws.join(" "))}</b>${ja?` ＝ ${esc(ph.m)}`:""}</div>`:"";
  if(!e)return `<div><span class="posTag">${dictXState===1?"辞書を読み込み中…":/^[A-Z]/.test(clean)&&wi>0?"名前など":"辞書にない単語"}</span> <b>${esc(clean)}</b>${phH}</div>`;
  const u=sen.units[sen.unitOf[wi]];
  let pref=POSPREF[u.role]||[];
  if(u.role==="V")pref=wi<u.e&&e.pos.some(p=>p[0]==="aux")?["aux","v"]:["v","aux"];   // 後ろに動詞が続くなら助動詞
  const rk=t=>{const i=pref.indexOf(t);return i<0?99:i};
  const [main,...rest]=[...e.pos].sort((x,y)=>rk(x[0])-rk(y[0]));
  const base=e.w.toLowerCase()!==clean.toLowerCase()?`<small class="riBase">（元の形 ${esc(e.w)}${e.neg?"＋not":""}）</small>`:"";
  return `<div><span class="posTag">${POSN[main[0]]||main[0]}</span> <b>${esc(clean)}</b>${base}${ja?` ＝ ${esc(main[1])}`:""}`
    +(rest.length?`<div class="riNote">ほかに：${rest.map(([t,m])=>(POSN[t]||t)+(ja?`（${esc(m)}）`:"")).join("、")}</div>`:"")+phH+`</div>`;
}
function rdInfoUI(){
  const el=$("rdInfo");if(rdView()!=="read"){el.innerHTML="";el.hidden=true;return}
  const sen=rdSen(),d=settings.disp||"easy",ja=RD.showJa,roleOn=RD.gramOn&&settings.rdRole!==false;let h="";
  const inf=RD.info&&RD.info.si===RD.si&&RD.info.chunk===!!RD.gramOn?RD.info:null;
  if(inf&&inf.chunk){const u=sen.units[inf.u],rn=RN[u.role]||["",u.role],note=u.note||[];
    const tag=d==="gram"?rn[1]:d==="both"?`${rn[0]}／${rn[1]}`:d==="none"?"":rn[0];
    const nt=d==="none"?"":d==="gram"?(note[1]||""):d==="both"?[note[0],note[1]].filter(Boolean).join("／"):(note[0]||"");
    h+=`<div><span class="roleTag r${u.role}">${esc(tag)||"　"}</span> <b>${esc(u.text)}</b>${ja&&u.jp?` ＝ ${esc(u.jp)}`:""}${nt?`<div class="riNote">${esc(nt)}</div>`:""}</div>`}
  if(inf&&!inf.chunk)h+=wordInfoHTML(sen,inf.wi,ja);
  if(ja){h+=`<button class="riFull" id="rdFull">全文の訳 ${RD.fullOpen?"▲":"▼"}</button>`;
    if(RD.fullOpen){   // チャンクごとの英語と意味を並べて、最後に全体の訳
      if(sen.units.some(u=>u.jp))h+=`<div class="il">${sen.units.map(u=>`<span class="ilItem"${roleOn?` style="--c:var(--c${u.role})"`:""}><span class="ilEn">${esc(u.text)}</span>${u.jp?`<span class="ilJp">${esc(u.jp)}</span>`:""}</span>`).join("")}</div>`;
      if(sen.ja)h+=`<div class="riJa">${esc(sen.ja)}</div>`}}
  el.innerHTML=h;el.hidden=!h;
  if($("rdFull"))$("rdFull").onclick=()=>{RD.fullOpen=!RD.fullOpen;rdInfoUI()};
}
function rdInfoTap(wi){
  if(wi<0){RD.info=null;rdRender(true);return}
  const sn=rdSen(),ui=sn.unitOf[wi],u=sn.units[ui],chunk=!!RD.gramOn;
  if(RD.st.mode!=="test"){rdStopSay();speakOne(chunk?u.text:sn.words[wi].replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9'’]+$/g,""))}   // チャンク／単語だけ発音
  const same=RD.info&&RD.info.si===RD.si&&RD.info.chunk===chunk&&(chunk?RD.info.u===ui:RD.info.wi===wi);
  RD.info=same?null:chunk?{si:RD.si,chunk:true,u:ui,s:u.s,e:u.e}:{si:RD.si,chunk:false,wi,s:wi,e:wi};
  rdRender(true);
}
function showRdSettings(){
  const test=RD.st.mode==="test",onoff=(id,v)=>opt(id,v?"on":"off",[["on","オン"],["off","オフ"]]);
  openSheet(`<h2>表示の設定</h2>
    ${test?"":`<p class="note">「読む」で「チャンク」を押したときの見え方を選べます。</p>
    <div class="row"><label for="sSeg">区切り</label>${onoff("sSeg",settings.rdSeg!==false)}</div>
    <div class="row"><label for="sRole">役割の色</label>${onoff("sRole",settings.rdRole!==false)}</div>
    <div class="row"><label for="sJa">日本語の「訳」ボタン</label>${onoff("sJa",settings.rdJa!==false)}</div>
    <div class="row"><label for="sAlways">最初からチャンクで見る</label>${onoff("sAlways",!!settings.rdAlways)}</div>`}
    <div class="row"><label for="sLines">表示する文の数</label>${opt("sLines",String(settings.rdLines),[["1","1文（今の文だけ）"],["2","2文（次の文も）"],["3","3文（前後の文も）"]])}</div>
    <p class="note" style="font-size:10px">単語の辞書：EJDict（CC0）／品詞：WordNet 3.1（Princeton University）／語の選び方：FrequencyWords（CC BY-SA 4.0）</p>
    <div class="btns"><button class="primary" id="closeBtn">閉じる</button></div>`);
  const bind=(id,fn)=>{if($(id))$(id).onchange=e=>{fn(e.target.value==="on");saveSettings()}};
  bind("sSeg",v=>settings.rdSeg=v);bind("sRole",v=>settings.rdRole=v);bind("sJa",v=>settings.rdJa=v);
  bind("sAlways",v=>{settings.rdAlways=v;RD.gramOn=v});
  $("sLines").onchange=e=>{settings.rdLines=+e.target.value;saveSettings()};
  $("closeBtn").onclick=()=>{closeSheet();rdRender(true)};
}
function rdRange(){ // 今の選択（確定済み or 選択中）
  if(RD.sel&&RD.sel.si===RD.si)return [RD.sel.a,RD.sel.b];
  if(RD.start&&RD.start.si===RD.si){const g1=Math.min(RD.start.g,RD.p),g2=Math.max(RD.start.g,RD.p);return [g1,g2-1]}
  return [-1,-2];
}
function rdRender(noAnim){
  const sen=rdSen(),n=sen.words.length,[ra,rb]=rdRange(),q=RD.qs[RD.qi];
  const unitEnds=new Set(sen.units.map(u=>u.e));
  const view=rdView(),gOn=view==="read"?RD.gramOn:(RD.hintOn&&RD.hintPolicy==="grammar");
  const segOn=gOn&&(view!=="read"||settings.rdSeg!==false),roleOn=gOn&&(view!=="read"||settings.rdRole!==false);
  const st=$("rdStrip");
  st.innerHTML=sen.words.map((w,i)=>{
    let cls="w";if(i>=ra&&i<=rb)cls+=" sel";else if(roleOn)cls+=" r"+wordRole(sen,i);
    if(RD.info&&RD.info.si===RD.si&&i>=RD.info.s&&i<=RD.info.e)cls+=" hl";
    // 範囲は［ ］で囲んで見せる
    const selOn=RD.sel&&RD.sel.si===RD.si,startOn=RD.start&&RD.start.si===RD.si;
    const pre=(selOn&&i===ra)||(startOn&&i===RD.start.g)?`<span class="cutmark brk">［</span>`:"";
    let post=selOn&&i===rb?`<span class="cutmark brk">］</span>`:"";
    if(!post&&segOn&&unitEnds.has(i)&&i<n-1)post=`<span class="cutmark hint">｜</span>`;
    return `${pre}<span class="${cls}">${esc(w)}</span>${post}`;
  }).join("");
  // すき間の位置（0＝最初の単語の前、n＝最後の単語の後ろ）
  const ws=[...st.querySelectorAll(".w")];RD.gpos=[];
  for(let g=0;g<=n;g++){
    if(g===0)RD.gpos.push(ws[0].offsetLeft-4);
    else if(g===n)RD.gpos.push(ws[n-1].offsetLeft+ws[n-1].offsetWidth+6);
    else RD.gpos.push((ws[g-1].offsetLeft+ws[g-1].offsetWidth+ws[g].offsetLeft)/2);
  }
  st.classList.toggle("step",!noAnim);
  st.style.transform=`translate(${lineX2()-RD.gpos[RD.p]}px,-50%)`;
  $("rdCutline").style.left=lineX2()+"px";
  const bar=$("rdBar");bar.max=n;bar.value=RD.p;
  {const k=settings.rdLines===3?2:settings.rdLines===2?1:0,ctx=(from,step,mark)=>{let h="";for(let j=1;j<=k;j++){const t=RD.sens[RD.si+step*j];if(t)h+=`<div class="rdCtx${j>1?" far":""}">${mark} ${esc(t.en)}</div>`}return h};
    $("rdPrevLine").innerHTML=ctx(0,-1,"▲").split("</div>").filter(Boolean).reverse().map(x=>x+"</div>").join("");
    $("rdNextLine").innerHTML=ctx(0,1,"▼");
    $("rdLines").textContent="表示 "+settings.rdLines;
    $("rdSay").hidden=RD.st.mode==="test"}
  $("rdSenNum").textContent=`${RD.si+1} / ${RD.sens.length} 文目`;
  $("rdUp").disabled=RD.si===0;$("rdDown").disabled=RD.si===RD.sens.length-1;
  $("readView").classList.toggle("vRead",view==="read");
  rdModeUI(view);rdInfoUI();
  if(view==="read"){$("rdHelp").textContent=RD.gramOn?`チャンクをタップすると、発音して役割${RD.showJa?"と意味":""}が出ます`:`単語をタップすると、発音して品詞${RD.showJa?"と意味":""}が出ます。「チャンク」でチャンクごとに見られます`;return}
  // 問題
  if(!q){$("rdQNum").textContent="";$("rdQ").textContent="（問題なし：読むだけ）";$("rdAns").textContent="";$("rdChoices").innerHTML="";$("rdBtns").innerHTML="";$("rdHelp").textContent="左右・上下にドラッグして読めます";$("rdCheck").hidden=true;return}
  $("rdCheck").hidden=false;
  $("rdQNum").textContent=`Q${RD.qi+1} / ${RD.qs.length}`;$("rdQ").textContent=q.q;
  $("rdQPrev").disabled=RD.qi===0;$("rdQNext").disabled=RD.qi===RD.qs.length-1;
  const answered=RD.qs.filter(q=>q.ans).length;
  const test=RD.st.mode==="test";
  $("rdCheck").textContent=test?`提出する（${answered}/${RD.qs.length}問）`:`答え合わせ（${answered}/${RD.qs.length}問）`;
  if(q.type==="choice"){   // 5択：選択肢から選ぶ
    $("rdAns").textContent=q.ans?"あなたの答え："+q.options[q.ans.choice]:"";
    $("rdChoices").innerHTML=q.options.map((o,i)=>`<button data-c="${i}" class="${q.ans&&q.ans.choice===i?"on":""}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join("");
    $("rdChoices").querySelectorAll("button").forEach(b=>b.onclick=()=>{q.ans={choice:+b.dataset.c};hitSound("mini");rdRender(true);
      const qi=RD.qi;setTimeout(()=>{if(RD&&RD.qi===qi)rdNextUnanswered()},350)});
    $("rdBtns").innerHTML="";$("rdHelp").textContent="英文を読んで、選択肢から答えを選ぼう";return;
  }
  $("rdChoices").innerHTML="";
  $("rdAns").textContent=q.ans?"あなたの答え："+RD.sens[q.ans.si].words.slice(q.ans.a,q.ans.b+1).join(" "):"";
  // 説明とボタン
  const startOn=RD.start&&RD.start.si===RD.si;
  const help=RD.sel?"この範囲でいい？":startOn?"答えの終わりを線に合わせて「ここまで ］」":"答えの始まりを線に合わせて「［ ここから」（レーンを左右にドラッグして動かす）";
  $("rdHelp").textContent=(RD.hintQ.has(RD.qi)&&q.si!=null?`💡 答えは ${q.si+1} 文目にあるよ。 `:"")+help;
  $("rdBtns").innerHTML=RD.sel?`<button id="rdRedo">選びなおし</button><button id="rdOk" class="ok">決定</button>`
    :`${startOn?`<button id="rdRedo">やめる</button>`:""}<button id="rdCutBtn" class="cutMain">${startOn?"ここまで ］":"［ ここから"}</button>`;
  if(!RD.sel&&startOn)$("rdRedo").onclick=()=>{RD.start=null;rdRender(true)};
  if(RD.sel){$("rdRedo").onclick=()=>{RD.sel=null;RD.start=null;rdRender(true)};$("rdOk").onclick=rdDecide}
  else $("rdCutBtn").onclick=rdCut;
}
function lineX2(){return Math.round($("rdLane").clientWidth*0.34)}
function rdCut(){
  if(RD.sel)return;
  if(!RD.start||RD.start.si!==RD.si){RD.start={si:RD.si,g:RD.p}}
  else{if(RD.p===RD.start.g)return;
    RD.sel={si:RD.si,a:Math.min(RD.start.g,RD.p),b:Math.max(RD.start.g,RD.p)-1};RD.start=null}
  unlockAudio();hitSound("mini");
  const lw=$("rdLane");lw.classList.remove("flash");void lw.offsetWidth;lw.classList.add("flash");
  rdRender(true);
}
function rdNextUnanswered(){   // 答えたら、まだ答えていない問題へ自動で移る
  const next=RD.qs.findIndex((x,i)=>i>RD.qi&&!x.ans),first=RD.qs.findIndex(x=>!x.ans);
  const to=next>=0?next:first;
  if(to>=0&&to!==RD.qi){RD.qi=to;rdRender(true);qFlash(1)}
  else{rdRender(true);if(to<0)rdToast(RD.st.mode==="test"?"全部答えました。下の「提出する」へ":"全部答えました。下の「答え合わせ」へ")}
}
function rdDecide(){
  const q=RD.qs[RD.qi];q.ans=RD.sel;RD.sel=null;RD.start=null;
  hitSound("great");rdNextUnanswered();
}
function qFlash(d){const el=$("rdQ");el.animate(reduce?[{opacity:.4},{opacity:1}]:[{transform:`translateX(${d*30}px)`,opacity:.3},{transform:"none",opacity:1}],{duration:220,easing:"ease-out"})}
function rdToast(t){const el=$("rdHelp");el.textContent=t;el.animate([{color:"var(--accent)"},{color:"var(--muted)"}],{duration:1600})}
function rdGoQ(i,d){if(i<0||i>=RD.qs.length||i===RD.qi)return;RD.qi=i;RD.hintOn=false;RD.sel=null;RD.start=null;rdRender(true);qFlash(d)}
function rdMove(p,noAnim){const n=rdSen().words.length;p=Math.max(0,Math.min(n,p));if(p===RD.p)return;RD.p=p;rdRender(noAnim)}
function rdStopSay(){try{speechSynthesis.cancel()}catch(e){}RD&&(RD.saying=false);const b=$("rdSay");if(b)b.textContent="🔊 聞く"}
let noSpeechTold=false;
function speakOne(text){   // 短い語句をすぐ発音（チャンクをタップしたとき）
  if(!canSpeak){if(!noSpeechTold){noSpeechTold=true;toast("この画面では音声が使えません。ブラウザ（Chrome など）で開くと聞けます")}return}
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";const v=enVoice();if(v)u.voice=v;u.rate=.9;speechSynthesis.speak(u)}catch(e){}
}
function rdSay(){   // いま表示している文を読み上げ（もう一度押すと止まる）。テストモードではオフ
  if(RD.st.mode==="test")return;
  if(!canSpeak){tell("この画面では、音声が使えません。\nブラウザ（Chrome など）でこのページを開くと、聞けます。");return}
  if(RD.saying){rdStopSay();return}
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(rdSen().en);u.lang="en-US";const v=enVoice();if(v)u.voice=v;u.rate=.9;
    u.onend=u.onerror=()=>{if(RD&&RD.saying){RD.saying=false;$("rdSay").textContent="🔊 聞く"}};
    RD.saying=true;$("rdSay").textContent="■ 止める";speechSynthesis.speak(u)}catch(e){RD.saying=false}
}
/* 振り返りの全文読み上げ：1文ずつ順番に読む（一時停止は、その文の頭から再開） */
const RV={i:0,on:false,tok:0};
function rvStop(){RV.on=false;RV.tok++;try{speechSynthesis.cancel()}catch(e){}}
function rvUI(){const b=$("rvPlay");if(!b)return;
  b.textContent=RV.on?"⏸ 一時停止":RV.i>0?"▶ つづき":"▶ 最初から";
  document.querySelectorAll(".rvSen").forEach(el=>el.classList.toggle("on",RV.on&&+el.dataset.i===RV.i))}
function rvSpeak(){
  if(!RD||RV.i>=RD.sens.length){RV.on=false;RV.i=0;rvUI();return}
  const tok=++RV.tok;
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(RD.sens[RV.i].en);u.lang="en-US";const v=enVoice();if(v)u.voice=v;u.rate=.9;
    const nx=()=>{if(tok!==RV.tok||!RV.on)return;RV.i++;rvSpeak()};u.onend=nx;u.onerror=nx;
    RV.on=true;rvUI();
    const el=document.querySelector(`.rvSen[data-i="${RV.i}"]`);if(el&&el.scrollIntoView)el.scrollIntoView({block:"nearest",behavior:"smooth"});
    speechSynthesis.speak(u)}catch(e){RV.on=false;rvUI()}
}
function rvInit(){
  RV.i=0;RV.on=false;RV.tok++;rvUI();
  $("rvPlay").onclick=()=>{if(RV.on){rvStop();rvUI()}else rvSpeak()};
  document.querySelectorAll(".rvSen").forEach(el=>el.onclick=()=>{RV.i=+el.dataset.i;RV.tok++;rvSpeak()});
}
function rdSentence(d){
  const si=RD.si+d;if(si<0||si>=RD.sens.length)return;
  rdStopSay();RD.si=si;RD.p=0;RD.fullOpen=false;RD.start=null;if(RD.sel&&RD.sel.si!==si)RD.sel=null;rdRender(true);
  const lw=$("rdLane");lw.animate(reduce?[{opacity:.4},{opacity:1}]:[{transform:`translateY(${d*18}px)`,opacity:.3},{transform:"none",opacity:1}],{duration:220,easing:"ease-out"});
}
/* 読解モードの操作：左右ドラッグで位置、上下ドラッグで前後の文、タップで切る */
(()=>{
  const lane=$("rdGest");let d=null;
  $("rdSet").onclick=showRdSettings;
  $("rdLines").onclick=()=>{settings.rdLines=settings.rdLines>=3?1:settings.rdLines+1;saveSettings();rdRender(true)};
  $("rdSeg").querySelectorAll("button").forEach(b=>b.onclick=()=>{settings.rdView=b.dataset.v;saveSettings();RD.view=b.dataset.v;RD.sel=null;RD.start=null;RD.info=null;RD.hintOn=false;rdRender(true)});
  $("rdGram").onclick=()=>{RD.gramOn=!RD.gramOn;RD.info=null;rdRender(true)};
  $("rdJaBtn").onclick=()=>{RD.showJa=!RD.showJa;RD.fullOpen=false;rdRender(true)};
  lane.addEventListener("pointerdown",e=>{if(e.target.closest("button,#rdInfo"))return;
    const onBar=e.target.id==="rdBar";
    if(!onBar){e.preventDefault();try{lane.setPointerCapture(e.pointerId)}catch(_){}}
    d={onBar,onLane:!onBar,wi:(()=>{const w=document.elementsFromPoint(e.clientX,e.clientY).find(x=>x.classList&&x.classList.contains("w"));return w?[...$("rdStrip").querySelectorAll(".w")].indexOf(w):-1})(),x:e.clientX,y:e.clientY,p0:RD.p,g0:RD.gpos[RD.p],moved:false,axis:null}});
  lane.addEventListener("pointermove",e=>{
    if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;
    if(!d.axis&&(Math.abs(dx)>5||Math.abs(dy)>5))d.axis=Math.abs(dy)>=Math.abs(dx)*2?"y":"x";  // 縦は「はっきり縦」のときだけ
    if(d.axis==="x"&&!d.onBar){d.moved=true;const target=d.g0+dx;let best=0;RD.gpos.forEach((g,i)=>{if(Math.abs(g-target)<Math.abs(RD.gpos[best]-target))best=i});rdMove(best,true)}
    if(d.axis==="y"){d.moved=true;
      if(!d.done&&Math.abs(dy)>=20){d.done=true;rdSentence(dy<0?1:-1);   // 1回のドラッグで進むのは1文だけ
        $("rdSenNum").animate([{color:"var(--accent)",transform:"scale(1.25)"},{color:"var(--muted)",transform:"none"}],{duration:500})}}
  });
  const end=e=>{if(!d)return;
    if(!d.moved&&e.type==="pointerup"&&d.onLane){if(rdView()==="read")rdInfoTap(d.wi);else rdCut()}
    d=null};
  lane.addEventListener("pointerup",end);lane.addEventListener("pointercancel",end);
  $("rdBar").addEventListener("input",e=>rdMove(+e.target.value,true));
  $("rdSay").onclick=rdSay;
  $("rdUp").onclick=()=>rdSentence(-1);$("rdDown").onclick=()=>rdSentence(1);
  $("rdQPrev").onclick=()=>rdGoQ(RD.qi-1,-1);
  $("rdQNext").onclick=()=>rdGoQ(RD.qi+1,1);
  // 問題文の枠を左右にフリック・ドラッグで前後の問題へ
  (()=>{const box=$("rdQ").parentElement;let d=null;
    const st=(x,y)=>{d={x,y,done:false}},mv=(x,y)=>{if(!d||d.done)return;const dx=x-d.x,dy=y-d.y;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2){d.done=true;dx<0?rdGoQ(RD.qi+1,1):rdGoQ(RD.qi-1,-1)}};
    box.addEventListener("pointerdown",e=>st(e.clientX,e.clientY));box.addEventListener("pointermove",e=>mv(e.clientX,e.clientY));
    box.addEventListener("touchstart",e=>{const t=e.touches[0];st(t.clientX,t.clientY)},{passive:true});
    box.addEventListener("touchmove",e=>{const t=e.touches[0];mv(t.clientX,t.clientY)},{passive:true});
    ["pointerup","pointercancel","touchend","touchcancel"].forEach(ev=>box.addEventListener(ev,()=>{d=null}));})();
  $("rdBack").onclick=showTitle;
  const fk=Object.keys(FONT).reverse(); // xs→xl
  $("rdFontM").onclick=()=>{const i=fk.indexOf(settings.font);if(i>0){settings.font=fk[i-1];saveSettings();applyVisual();rdRender(true)}};
  $("rdFontP").onclick=()=>{const i=fk.indexOf(settings.font);if(i<fk.length-1){settings.font=fk[i+1];saveSettings();applyVisual();rdRender(true)}};
  // ヒント：答えが何文目か＋役割の色と区切りを表示（もう一度押すと消える）
  $("rdHint").onclick=()=>{
    if(RD.hintOn){RD.hintOn=false;rdRender(true);return}
    const q=RD.qs[RD.qi];
    if(q&&q.type==="choice"&&RD.hintPolicy!=="grammar"){rdToast("この問題では、ヒントは使えません");return}
    RD.hintOn=RD.hintPolicy==="grammar";   // 「何文目か」だけの設定なら、色と区切りは出さない
    if(!RD.hintQ.has(RD.qi)){RD.hintQ.add(RD.qi);RD.hints++}
    rdRender(true);
  };
  $("rdCheck").onclick=rdGrade;
})();
/* 範囲の問題の採点：◯＝想定どおり（別解も）、△＝中心は合っていて説明が足りない／同じ役割の分だけ長い、×＝それ以外 */
function gradeRange(sen,q,ans){
  const eq=(x,y)=>x&&y&&x.si===y.si&&x.a===y.a&&x.b===y.b,W=(a,b)=>sen.words.slice(a,b+1).join(" ");
  if(!ans)return {mark:"x",why:"未回答"};
  if(eq(ans,q)||(q.alts||[]).some(x=>x.a>=0&&eq(ans,x)))return {mark:"o",why:""};
  if((q.partials||[]).some(x=>eq(ans,x)))return {mark:"t",why:"部分点"};
  if(ans.si!==q.si)return {mark:"x",why:"別の文を選んでいる"};
  if(ans.b<q.a||ans.a>q.b)return {mark:"x",why:"答えと重なっていない"};
  const unitRole=i=>sen.units[sen.unitOf[i]].role;
  if(ans.a>=q.a&&ans.b<=q.b){   // 短い
    const u=sen.units[sen.unitOf[q.a]],part=u.subs?u.subs.find(p=>q.a>=p.s&&q.a<=p.e):u;
    const head={a:Math.max(q.a,part.s),b:Math.min(q.b,part.e)};
    const miss=[];for(let i=q.a;i<=q.b;i++)if(i<ans.a||i>ans.b)miss.push(i);
    if(ans.a<=head.a&&ans.b>=head.b)return {mark:"t",why:`短い（足りない：${miss.map(i=>sen.words[i]).join(" ")}）`};
    return {mark:"x",why:"答えの中心が入っていない"};
  }
  if(ans.a<=q.a&&ans.b>=q.b){   // 長い
    const roles=new Set();for(let i=q.a;i<=q.b;i++)roles.add(unitRole(i));
    const extra=[];for(let i=ans.a;i<=ans.b;i++)if(i<q.a||i>q.b)extra.push(i);
    const bad=extra.filter(i=>!roles.has(unitRole(i)));
    if(!bad.length)return {mark:"t",why:`長い（余分：${extra.map(i=>sen.words[i]).join(" ")}）`};
    const br=[...new Set(bad.map(unitRole))].map(r=>RN[r][1]).join("・");
    return {mark:"x",why:`長い（余分：${W(bad[0],bad[bad.length-1])} ＝${br}）`};
  }
  return {mark:"x",why:"範囲がずれている"};
}
function rdJudge(q){
  if(q.type==="choice")return q.ans&&q.ans.choice===q.correct?"o":"x";
  return gradeRange(RD.sens[q.si],q,q.ans).mark;
}
function spanHTML(sen,exp,mine){   // 想定の範囲（緑）と自分の範囲（オレンジ下線）を並べて見せる
  return sen.words.map((w,i)=>{const e=exp&&i>=exp.a&&i<=exp.b,m=mine&&mine.si===exp.si&&i>=mine.a&&i<=mine.b;
    return `<span class="spw${e?" spE":""}${m?" spM":""}">${esc(w)}</span>`}).join(" ");
}
function rdAnswersSummary(){
  return RD.qs.map((q,i)=>{
    if(q.type==="choice")return {q:q.q,mine:q.ans?q.options[q.ans.choice]:"",mark:rdJudge(q),why:"",pts:q.pts||100,hint:RD.hintQ.has(i)};
    const sen=RD.sens[q.si],g=gradeRange(sen,q,q.ans);
    return {q:q.q,mine:q.ans?RD.sens[q.ans.si].words.slice(q.ans.a,q.ans.b+1).join(" "):"",mark:g.mark,why:g.why,pts:q.pts||100,hint:RD.hintQ.has(i)};
  });
}
async function rdGrade(){
  // 未回答のチェック（範囲を選びかけ・決定し忘れも未回答として知らせる）
  const pending=RD.sel||RD.start?RD.qi:-1;
  const un=RD.qs.map((q,i)=>!q.ans?i:-1).filter(i=>i>=0);
  const names=un.map(i=>`Q${i+1}`).join("・");
  const pendNote=pending>=0&&!RD.qs[pending].ans?`<p class="note">Q${pending+1} は範囲を選びかけたまま「決定」されていません。</p>`:"";
  if(un.length&&RD.st.mode!=="test"){   // 学習用：全部答えてから
    openSheet(`<h2>まだ答えていない問題があります</h2><p class="note">${names} に答えてから、答え合わせをしましょう。</p>${pendNote}
      <div class="btns"><button class="primary" id="goUn">${names.split("・")[0]} へ</button></div>`);
    $("goUn").onclick=()=>{closeSheet();if(!(pending>=0&&un[0]===pending))rdGoQ(un[0],1)};return;
  }
  if(un.length&&RD.st.mode==="test"&&!RD._forceSubmit){   // テスト用：しつこく念押し
    openSheet(`<h2>未回答の問題があります</h2><p class="note"><b>${names}</b> が未回答です。<br>未回答の問題は点数が入りません。本当に提出しますか？</p>${pendNote}
      <div class="btns"><button class="primary" id="goUn">未回答の問題へ</button><button class="ghost" id="forceSub">それでも提出する</button></div>`);
    $("goUn").onclick=()=>{closeSheet();if(!(pending>=0&&un[0]===pending))rdGoQ(un[0],1)};
    $("forceSub").onclick=async()=>{if(!(await ask(`もう一度確認します。\n${names} は0点になります。提出すると答えは変えられません。提出しますか？`,"提出する")))return;
      closeSheet();RD._forceSubmit=true;rdGrade();RD._forceSubmit=false};
    return;
  }
  // テスト用：答えは見せず、提出だけ（結果はこの端末に保存。先生が My Texts の「提出結果」で見る）
  if(RD.st.mode==="test"){
    if(!RD._forceSubmit&&!(await ask("提出しますか？\n提出すると答えは変えられません。","提出する")))return;
    const sm=rdAnswersSummary(),list=loadSubs(),cost=RD.hintCost;
    const score=sm.reduce((a,x)=>a+Math.max(0,Math.round(x.pts*({o:1,t:.4,x:0})[x.mark])-(x.hint?cost:0)),0),max=sm.reduce((a,x)=>a+x.pts,0);
    list.push({textId:RD.st.id,title:RD.st.title,at:Date.now(),answers:sm,score,max});saveSubs(list);
    openSheet(`<h2>提出しました</h2><p class="note">答えは先生が確認します。</p>
      <div class="btns"><button class="primary" id="rdTitleBtn">タイトルへ</button></div>`,false);
    $("rdTitleBtn").onclick=showTitle;return;
  }
  const res=RD.qs.map(q=>rdJudge(q)),pts=res.reduce((a,r,i)=>a+Math.round((RD.qs[i].pts||100)*({o:1,t:.4,x:0})[r]),0);
  const lvMsg=RD.qs.length?adaptLevel(res.reduce((a,r)=>a+({o:1,t:.5,x:0})[r],0)/RD.qs.length,RD.st.level):"";
  hitSound(res.every(r=>r==="o")?"excellent":"great");
  const MK={o:["◯","k-excellent"],t:["△","k-good"],x:["×","k-miss"]};
  openSheet(`<h2>答え合わせ</h2>
    <div class="big">${Math.max(0,pts)} pt <span style="font-size:14px;color:var(--muted)">◯${res.filter(r=>r==="o").length}／${RD.qs.length}問　ヒント使用${RD.hints}問</span></div>
    ${lvMsg?`<p class="note" style="color:var(--accent);font-weight:800">${esc(lvMsg)}</p>`:""}
    ${RD.qs.map((q,i)=>{const r=res[i];
      if(q.type==="choice")return `<div class="rvw"><span class="lab">Q${i+1}. ${esc(q.q)}</span>
        <div class="en"><span class="mk ${MK[r][1]}">${MK[r][0]}</span>あなた：${q.ans?esc(q.options[q.ans.choice]):"（未回答）"}</div>
        <div class="en">答え：${esc(q.options[q.correct]||"")}</div></div>`;
      const sen=RD.sens[q.si],g=gradeRange(sen,q,q.ans);
      return `<div class="rvw"><span class="lab">Q${i+1}. ${esc(q.q)}</span>
        <div class="en"><span class="mk ${MK[g.mark][1]}">${MK[g.mark][0]}</span>${g.why?`<small class="why">${esc(g.why)}</small>`:""}</div>
        <div class="en spanView">${spanHTML(sen,q,q.ans)}</div>
        <small class="legendSp"><span class="spE">想定した答え</span>　<span class="spM">あなたの選択</span></small>
        <div class="ja">${esc(sen.ja)}</div></div>`}).join("")}
    ${canSpeak?`<div class="rvAll"><div class="rvAllHead"><b>全文を聞く</b><button class="primary" id="rvPlay">▶ 最初から</button></div>
      <small class="note">文をタップすると、そこから下を読みます。</small>
      ${RD.sens.map((sn,i)=>`<div class="rvSen" data-i="${i}"><div class="en">${esc(sn.en)}</div><div class="ja">${esc(sn.ja)}</div></div>`).join("")}</div>`:""}
    <div class="btns"><button class="ghost" id="rdTitleBtn">タイトルへ</button><button class="ghost" id="rdAgain">もう一度</button><button class="primary" id="rdNextStory">次のお話</button></div>`,false);
  if(canSpeak)rvInit();
  $("rdTitleBtn").onclick=showTitle;
  $("rdAgain").onclick=()=>{closeSheet();startRead(RD.st)};
  if(RD.st.my){$("rdNextStory").textContent="My Texts へ";$("rdNextStory").onclick=()=>{closeSheet();$("readView").hidden=true;openMyTexts()}}
  else $("rdNextStory").onclick=()=>{closeSheet();startRead()};
}

/* ===== Chunk Practice：切ったチャンクの役割を答える ===== */
const RG={S:"S",V:"V",O:"O",I:"O",C:"C",P:"P",T:"T",M:"M",R:"M",F:"M",X:"M"};
const RGN={S:"Subject",V:"Verb",O:"Object",C:"Complement",P:"Place",T:"Time",M:"Other"};
function expectedRoles(c){
  if(!c.roles)return null;
  if(c.kind==="good")return new Set(["S","V"]);
  if(c.roles[0]==="V")return new Set(["V"]);
  if(c.roles.every(r=>"PTMRF".includes(r)))return new Set(c.roles.map(r=>RG[r]));
  return new Set([RG[c.roles[0]]]);
}
function askRole(c){
  const exp=expectedRoles(c);if(!exp)return;
  const el=$("rolePick"),r=$("laneWrap").getBoundingClientRect();
  el.innerHTML=Object.keys(RGN).map(k=>`<button data-r="${k}" class="r${k}">${RGN[k]}</button>`).join("");
  el.style.left=(r.left+r.width/2)+"px";el.style.top=(r.bottom+6)+"px";el.hidden=false;
  el.querySelectorAll("button").forEach(b=>{
    b.addEventListener("pointerdown",e=>e.stopPropagation());
    b.onclick=()=>{
      const ok=exp.has(b.dataset.r);S.roleN=(S.roleN||0)+1;if(ok){S.roleOk=(S.roleOk||0)+1;addScore(50)}
      hitSound(ok?"great":"miss");el.hidden=true;
      showPop({kind:ok?"excellent":"miss",easy:ok?"役割も正解 +50":`正解：${[...exp].map(x=>RGN[x]).join(" / ")}`,gram:"",jp:"",roles:null,title:`${RGN[b.dataset.r]} ${ok?"✓":"✗"}`});
    };
  });
}

/* ===== My Texts：長文の登録・チャンク分け・問題作成（この端末のブラウザに保存） ===== */
/* ===== みんなの長文・難易度の共有（共有データベース）。使えない環境では何も出ない ===== */
let DB=null,DLC=null,IS_ADMIN=false,CAN_WRITE=null,MYID=null,SHARED=null,SHORTS=null;
async function loadShared(){
  if(!DB)return SHARED;
  try{const snap=await DB.collection("texts").get();SHARED=snap.docs.map(d=>({...d.data(),id:d.id}));}catch(e){SHARED=SHARED||[]}
  return SHARED;
}
async function initShared(){
  try{
    if(!window.claude||!claude.use)return;
    try{DLC=await claude.use("downloads")}catch(e){DLC=null}
    DB=await claude.use("db");if(!DB)return;
    const u=await claude.use("user");
    if(u){try{IS_ADMIN=!!(await u.canEdit())}catch(e){}try{CAN_WRITE=await u.can("data.write")}catch(e){}try{MYID=await u.id()}catch(e){}}
    try{const snap=await DB.collection("levels").get();snap.docs.forEach(d=>{const v=d.data();if(v&&v.level>=1&&v.level<=10)LVO[d.id]=v.level})}catch(e){}
    loadShared();loadShorts();
  }catch(e){DB=null}
}
const MYKEY="ccs-mytexts",ROLES="SVOICPTMRF".split("");
function loadMy(){try{return JSON.parse(localStorage.getItem(MYKEY)||"[]")}catch(e){return []}}
function saveMy(list){try{localStorage.setItem(MYKEY,JSON.stringify(list));return true}catch(e){return false}}
const TRASHKEY="ccs-trash",TRASH_DAYS=30;
function loadTrash(){try{const now=Date.now();return JSON.parse(localStorage.getItem(TRASHKEY)||"[]").filter(t=>now-t.deletedAt<TRASH_DAYS*864e5)}catch(e){return []}}
function saveTrash(l){try{localStorage.setItem(TRASHKEY,JSON.stringify(l));return true}catch(e){return false}}
const SUBKEY="ccs-submits";
function loadSubs(){try{return JSON.parse(localStorage.getItem(SUBKEY)||"[]")}catch(e){return []}}
function saveSubs(l){try{localStorage.setItem(SUBKEY,JSON.stringify(l));return true}catch(e){return false}}
function unitEnds(s){const n=s.words.length;return [...new Set([...(s.ends||[]),n-1])].filter(x=>x>=0&&x<n).sort((a,b)=>a-b)}
function unitStarts(s){return [0,...unitEnds(s).slice(0,-1).map(e=>e+1)]}
function myToStory(t){
  const clean=x=>x.replace(/[|=#{}]/g,"");
  const list=t.sents.map(s=>{let st=0;
    const parts=unitEnds(s).map(e=>{const role=(s.roleAt||{})[st]||"M";
      const w=s.words.slice(st,e+1).map(clean).filter(x=>x&&x!=="/").join(" ")||"…";
      const jp=((s.ujp||{})[st]||"").replace(/[|#{}]/g,"");st=e+1;return `${role}:${w}=${jp}`});
    return [parts.join(" | "),s.ja||""]});
  const questions=(t.questions||[]).map(q0=>{const q=normQ(q0,t.sents);
    if(q.type==="choice"){const opts=[];let corr=-1;(q.options||[]).forEach((o,i)=>{if(o&&o.trim()){if(i===q.correct)corr=opts.length;opts.push(o)}});
      return opts.length?{type:"choice",q:q.q||"",options:opts,correct:corr,...(+q0.pts>0?{pts:+q0.pts}:{})}:null}
    return t.sents[q.si]?cleanQ({type:"range",q:q.q||"",si:q.si,a:q.a,b:q.b,alts:q.alts||[],partials:q.partials||[],...(+q0.pts>0?{pts:+q0.pts}:{})}):null;
  }).filter(Boolean);
  return {title:t.title||"無題",list,questions,my:true,id:t.id,mode:t.mode||"learn",level:t.level||null,hint:t.hint||"none",hintCost:t.hintCost==null?20:+t.hintCost};
}
/* お手軽自動：単語リストの規則で分ける（あとで手直しする前提） */
const WS=str=>new Set(str.split(" "));
const AW={
 det:WS("a an the my your his her its our their this that these those some any every each many much few several no two three four five"),
 subj:WS("i you he she it we they there"),
 obj:WS("me you him her it us them"),
 aux:WS("am is are was were be been being do does did don't doesn't didn't have has had will would can could shall should may might must won't can't isn't aren't wasn't weren't haven't hasn't not never"),
 prep:WS("in on at to for with from by about of into near under over after before during without through across behind between around like than along"),
 sub:WS("when because if while although though since until unless"),
 freq:WS("always usually often sometimes never also just really already still even"),
 part:WS("up out off away back down"),
 timeN:WS("yesterday today tomorrow tonight now morning mornings afternoon evening night nights week weekend month year years summer winter spring autumn fall monday tuesday wednesday thursday friday saturday sunday sundays ago o'clock time day days hour hours minute minutes lunch breakfast dinner school first end"),
 verb:WS("go goes went come comes came see sees saw make makes made take takes took get gets got give gives gave know knows knew think thinks thought want wants wanted like likes liked love loves play plays played read reads eat eats ate drink drinks drank run runs ran walk walks swim swims swam study studies live lives lived work works help helps tell tells told say says said find finds found buy buys bought bring brings brought leave leaves left meet meets met speak speaks spoke write writes wrote sing sings sang sit sits sat stand stands stood teach teaches taught feel feels felt keep keeps kept begin begins began become becomes became grow grows grew wait waits watch watches listen listens look looks use uses call calls try tries need needs start starts show shows open opens close closes visit visits stay stays talk talks learn learns cook cooks clean cleans carry carries catch catches build builds send sends sleep sleeps win wins won lose loses lost hear hears heard belong belongs seem seems taste tastes tasted sound sounds smell smells borrow borrows join joins thank thanks pick picks forget forgets forgot enjoy enjoys decide decides")
};
const lw_=w=>w.toLowerCase().replace(/[^a-z']/g,"");
function chunkSentence(words){
  const lw=words.map(lw_),n=words.length,units=[];let i=0;
  const isVerb=k=>k<n&&(AW.aux.has(lw[k])||AW.verb.has(lw[k])||(/ed$/.test(lw[k])&&lw[k].length>3));
  const isTimeStart=k=>k<n&&(AW.timeN.has(lw[k])&&!["school","lunch","dinner","breakfast","time","first","end"].includes(lw[k])||(["every","last","next","this","that"].includes(lw[k])&&AW.timeN.has(lw[k+1]||""))||lw[k]==="ago");
  const comma=j=>{for(let k=j;k<n;k++)if(/,$/.test(words[k]))return k;return -1};
  const push=(role,end)=>{if(end<i)return;units.push({role,s:i,e:end});i=end+1};
  // 文頭の「〜,」（時・理由・条件・場所）
  const c0=comma(0);
  if(c0>=0&&c0<n-1&&(AW.sub.has(lw[0])||AW.prep.has(lw[0])||isTimeStart(0))){
    const r=["because","since"].includes(lw[0])?"R":["if","unless"].includes(lw[0])?"F":lw.slice(0,c0+1).some(x=>AW.timeN.has(x))||AW.sub.has(lw[0])?"T":"P";push(r,c0)}
  // There is/are
  if(lw[i]==="there"&&AW.aux.has(lw[i+1]||"")){push("V",i+1)}
  else{ // 主語：最初の動詞の手前まで
    let v=-1;for(let k=i+1;k<n;k++)if(isVerb(k)){v=k;break}
    while(v>i+1&&AW.freq.has(lw[v-1]))v--;   // I usually go → usually は動詞側
    if(v>i)push("S",v-1);
  }
  // 動詞のまとまり
  if(i<n&&(isVerb(i)||units.length&&units[units.length-1].role==="S")){
    let e=i;while(e+1<n&&AW.freq.has(lw[e])&&!isVerb(e))e++;
    while(e+1<n){const x=lw[e+1];
      if(AW.aux.has(x)||AW.freq.has(x)){e++;continue}
      if(isVerb(e+1)&&(AW.aux.has(lw[e])||AW.freq.has(lw[e])||lw[e]==="to")){e++;continue}
      if(x==="to"&&isVerb(e+2)){e++;continue}
      if(AW.part.has(x)&&!/[,.]$/.test(words[e])){e++;continue}
      if(/ing$/.test(x)&&AW.aux.has(lw[e])){e++;continue}
      if(["good","interested","afraid","proud","fond"].includes(x)&&AW.aux.has(lw[e])&&["at","in","of"].includes(lw[e+2]||"")){e+=2;continue}
      break}
    push("V",e);
  }
  const vUnit=units.find(u=>u.role==="V"),beOnly=vUnit&&words.slice(vUnit.s,vUnit.e+1).every(w=>AW.aux.has(lw_(w))||lw_(w)==="there");
  let objDone=false;
  // 残り：前置詞のまとまり・時のまとまり・名詞のまとまりに分ける
  while(i<n){
    const st=i;let e=i;
    const stopAt=k=>AW.prep.has(lw[k])&&lw[k]!=="of"||AW.sub.has(lw[k])||isTimeStart(k);
    if(AW.sub.has(lw[i])){e=comma(i);if(e<0)e=n-1;push(["because","since"].includes(lw[i])?"R":["if","unless"].includes(lw[i])?"F":"T",e);continue}
    if(isTimeStart(i)){while(e+1<n&&!/[,.!?]$/.test(words[e])&&(AW.timeN.has(lw[e+1])||AW.det.has(lw[e+1])||lw[e+1]==="ago"))e++;push("T",e);continue}
    if(AW.prep.has(lw[i])){while(e+1<n&&!/[,.!?]$/.test(words[e])&&!stopAt(e+1))e++;
      const ws=lw.slice(st,e+1),r=ws.some(x=>AW.timeN.has(x))&&!ws.includes("school")?"T":["with","by","for","about","like","without","than"].includes(lw[st])?"M":"P";push(r,e);continue}
    while(e+1<n&&!/[,.!?]$/.test(words[e])&&!stopAt(e+1)){ // 名詞のまとまり（me a present のような2つ目の目的語も分ける）
      if(!objDone&&AW.obj.has(lw[e])&&e===st&&!AW.prep.has(lw[e+1]))break;
      e++}
    const role=beOnly&&!objDone?"C":(!objDone&&AW.obj.has(lw[st])&&e===st&&e+1<n&&!stopAt(e+1)?"I":"O");
    push(role,e);if(role!=="I")objDone=true;
  }
  const roleAt={};units.forEach(u=>roleAt[u.s]=u.role);
  return {words,ends:units.map(u=>u.e),roleAt,ujp:{},ja:""};
}
function splitSentences(text){return text.replace(/\s+/g," ").trim().split(/(?<=[.!?]["']?)\s+(?=["']?[A-Z])/).filter(Boolean)}
function autoChunk(text){return splitSentences(text).map(t=>chunkSentence(t.split(" ").filter(Boolean)))}
/* AIへの指示文（ページから頼む時も、コピペ方式でも同じもの） */
function buildAIPrompt(text){
  const R=+settings.qRange||0,C=+settings.qChoice||0,lang=settings.qLang==="en"?"英語":"日本語";
  const qPart=R+C>0?`
また、長文の内容について問題を作り、"questions" に入れてください。
・範囲で答える問題：${R}問（本文の中から答えの部分を選ばせる問題）
・5択問題：${C}問（選択肢は5つ、正解は1つ）
・問題文と選択肢は${lang}で書く。
・accept（◯にする別の答え）と partial（△にする答え）は、本当にある時だけ入れる。無ければ空の配列 [] にする。answer と同じものは入れない。
・下の「問題：」に問題が貼り付けてあれば、新しく作らずにそれを使う（問題文はそのまま。答えの場所・選択肢・正解を読み取って、下の形に合わせる）。
範囲の問題の形：{"type":"range","q":"問題文","sentence":答えがある文の番号（1から）,"answer":"答えの部分（本文の英語そのまま）","accept":["◯にしてよい別の答え（本文の英語そのまま）"],"partial":["△にする答え（本文の英語そのまま）"]}
5択の問題の形：{"type":"choice","q":"問題文","options":["選択肢1","選択肢2","選択肢3","選択肢4","選択肢5"],"correct":正解の番号（0から）}`:"";
  return `英語の長文を、日本人学習者向けの「チャンク読み」アプリ用に、意味のまとまり（チャンク）に分けてください。
説明やコードブロック（\`\`\`）は付けず、次の形のJSONだけを返してください。
{"title":"タイトル","level":難易度の番号,"sentences":[{"ja":"文全体の自然な日本語訳","units":[{"role":"S","text":"元の英語そのまま","ja":"このチャンクの日本語"}]}]${R+C>0?',"questions":[ ... ]':""}}

ルール：
・title：英文にタイトルがあれば、それをそのまま入れる（タイトルは本文の文としては入れない）。なければ、内容に合う短いタイトルを付ける。
・level：長文の難易度を1〜10の番号で。1＝入門（小学校低〜中学年） 2＝小学校高学年 3＝中1・英検5級 4＝中2・英検4級 5＝中3・英検3級（CEFR A1） 6＝高1〜2・英検準2級（A2） 7＝高3・英検2級（B1） 8＝難関大・英検準1級（B2） 9＝大学・英検1級（C1） 10＝それ以上（C2）
・長文を1文ずつに分ける。各文の units には、その文の単語を順番どおりに、元の単語・記号のまま、もれなく入れる。
・role（役割）は次のどれか1つ。
  S＝主語（関係詞などの説明も主語に含める）
  V＝動詞のまとまり（助動詞、否定、usually などの頻度の副詞、句動詞の up・out など、to不定詞の動詞、take care of・look forward to・be good at などの熟語も含める）
  O＝目的語　I＝「誰に」にあたる目的語　C＝補語
  P＝場所　T＝時（when… や after… などの時の節も含む）
  M＝様子・手段・誰と・目的・その他　R＝理由（because… など）　F＝条件（if… など）
・チャンクの ja は、つなげて読める形にする（主語は「〜は／〜が」、目的語は「〜を」など）。${qPart}

長文：
${text?`"""${text}"""`:"（この下に英文を貼り付けてください）\n"}${R+C>0?`
問題：
（用意した問題があれば、この下に貼り付け。なければ空のまま）
`:""}`;
}
function aiResultToSents(out){
  const arr=v=>Array.isArray(v)?v:v==null?[]:[v];
  return arr(out&&out.sentences).map(x=>{const words=[],ends=[],roleAt={},ujp={};
    arr(x&&x.units).forEach(u=>{if(!u)return;const ws=String(u.text||"").trim().split(/\s+/).filter(Boolean);if(!ws.length)return;
      const st=words.length,r=String(u.role||"").trim().toUpperCase()[0];roleAt[st]=ROLES.includes(r)?r:"M";ujp[st]=String(u.ja||"");words.push(...ws);ends.push(words.length-1)});
    return {words,ends,roleAt,ujp,ja:String((x&&x.ja)||"")}}).filter(x=>x.words.length);
}
/* 指示文の枠を、今の英文に合わせる */
let lastPromptSrc=null;
function syncPrompt(force){
  const tx=$("edText"),pr=$("edPrompt");if(!tx||!pr)return;
  const t=tx.value.trim();if(!force&&t===lastPromptSrc)return;lastPromptSrc=t;
  pr.value=buildAIPrompt(t);
}
/* 本文の英語から、何文目の何語目〜何語目かを探す */
const normW=w=>String(w).toLowerCase().replace(/[^a-z0-9']/g,"");
function findSpan(sents,siHint,text){
  const tw=String(text||"").trim().split(/\s+/).map(normW).filter(Boolean);if(!tw.length)return null;
  const order=[siHint,...sents.map((_,i)=>i).filter(i=>i!==siHint)].filter(i=>i>=0&&i<sents.length);
  for(const si of order){const ws=sents[si].words.map(normW);
    for(let a=0;a+tw.length<=ws.length;a++){let ok=true;for(let k=0;k<tw.length;k++)if(ws[a+k]!==tw[k]){ok=false;break}
      if(ok)return {si,a,b:a+tw.length-1}}}
  return null;
}
/* 別解・△の答えから、未設定のもの・正解と同じもの・重複を取り除く */
function cleanQ(q){
  if(q.type!=="range")return q;
  const key=x=>`${x.si}:${x.a}:${x.b}`,valid=x=>x&&x.a>=0&&x.b>=0,seen=new Set([key(q)]);
  const alts=(q.alts||[]).filter(x=>valid(x)&&!seen.has(key(x))&&seen.add(key(x)));
  const partials=(q.partials||[]).filter(x=>valid(x)&&!seen.has(key(x))&&seen.add(key(x)));
  return {...q,alts,partials};
}
function aiResultToQuestions(out,sents){
  const arr=v=>Array.isArray(v)?v:v==null||v===""?[]:[v];
  return arr(out&&out.questions).map(q=>{try{
    if(!q||typeof q!=="object")return null;
    const type=String(q.type||"").toLowerCase();
    if(type==="choice"||Array.isArray(q.options)){const o=arr(q.options).map(String).slice(0,5);while(o.length<5)o.push("");
      let c=parseInt(q.correct,10);if(isNaN(c))c=Math.max(0,o.indexOf(String(q.correct)));
      return {type:"choice",q:String(q.q||q.question||""),options:o,correct:Math.max(0,Math.min(4,c))}}
    const hint=(parseInt(q.sentence,10)||1)-1,m=findSpan(sents,hint,q.answer);if(!m)return null;
    const alts=arr(q.accept).map(t=>findSpan(sents,m.si,t)).filter(Boolean);
    const partials=arr(q.partial).map(t=>findSpan(sents,m.si,t)).filter(Boolean);
    return cleanQ({type:"range",q:String(q.q||q.question||""),si:m.si,a:m.a,b:m.b,alts,partials});
  }catch(e){return null}}).filter(Boolean);
}
/* 古い形（チャンクの始まりだけ）の範囲問題を、何語目〜何語目の形にそろえる */
function normQ(q,sents){
  if(q.type!=="range"||q.a!=null)return q;
  const s=sents[q.si];if(!s)return q;const st=unitStarts(s),en=unitEnds(s);
  const k=Math.max(0,en.findIndex((e,i)=>q.w>=st[i]&&q.w<=e));
  return {...q,a:st[k],b:en[k],alts:q.alts||[],partials:q.partials||[]};
}
/* コピペ方式：AIの返事（前後に説明文や ``` が付いていてもよい）からJSONを取り出す */
function parsePastedAI(t){
  // 最初の「{」から、対応する「}」までを取り出す（文字列の中の { } は数えない）
  t=String(t).replace(/^﻿/,"");
  const a=t.indexOf("{");if(a<0)throw new Error("「{」で始まるデータが見つかりません");
  let depth=0,inStr=false,esc2=false,b=-1;
  for(let i=a;i<t.length;i++){const c=t[i];
    if(inStr){if(esc2)esc2=false;else if(c==="\\")esc2=true;else if(c==='"'||c==="”"||c==="“")inStr=false;continue}
    if(c==='"'||c==="“"||c==="”"){inStr=true;continue}
    if(c==="{")depth++;else if(c==="}"){depth--;if(depth===0){b=i;break}}}
  if(b<0)throw new Error("データの終わり「}」が見つかりません（返事の最後まで貼り付けたか確認）");
  const raw=t.slice(a,b+1);
  const tries=[raw,
    raw.replace(/,\s*([}\]])/g,"$1"),                                   // 最後の要素のあとのカンマ
    raw.replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/,\s*([}\]])/g,"$1"),  // 全角の引用符
    raw.replace(/[“”]/g,'"').replace(/,\s*([}\]])/g,"$1").replace(/\/\/[^\n"]*$/gm,"")]; // コメント
  let last;for(const x of tries){try{return JSON.parse(x)}catch(e){last=e}}
  throw new Error("データの形が崩れています（"+(last&&last.message||"")+"）");
}
async function copyText(t){
  try{await navigator.clipboard.writeText(t);return true}catch(e){}
  try{const ta=document.createElement("textarea");ta.value=t;ta.style.position="fixed";ta.style.opacity="0";document.body.append(ta);ta.select();const ok=document.execCommand("copy");ta.remove();return ok}catch(e){return false}
}
/* AIで分ける：ページからClaudeに頼む（使う人のアカウントの利用量を使う。初回は確認が出る） */
async function aiChunk(text){
  const sample=window.claude?await window.claude.use("sample"):null;
  if(!sample){edStatus("この画面ではAIが使えません。「お手軽自動」を使ってください。");return}
  edStatus("AIで分けています…（10〜60秒ほど）");$("edAI").disabled=true;
  const prompt=buildAIPrompt(text);
  try{
    const out=await sample.json(prompt,{modelTier:"default"});
    const sents=aiResultToSents(out),qs=aiResultToQuestions(out,sents);
    if(!sents.length)throw {message:"結果が空でした"};
    edCollect();ED.sents=sents;if(qs.length)ED.questions=qs;
    if(out&&out.title&&!String(ED.title||"").trim())ED.title=String(out.title).trim();
    if(!ED.level){const l=parseInt(out&&out.level,10);ED.level=l>=1&&l<=10?l:estimateLevel(sents)}
    renderEditor();edStatus(`AIで分けました（役割・訳つき${qs.length?`・問題${qs.length}問`:""}）。気になる所は直してください。`);
  }catch(e){edStatus(e&&e.code==="not_granted"?"AIの利用が許可されませんでした。":`AIで分けられませんでした（${esc((e&&(e.code||e.message))||"エラー")}）。「お手軽自動」を使ってください。`)}
  finally{const b=$("edAI");if(b)b.disabled=false}
}
let ED=null;
const edStatus=t=>{const el=$("edStatus");if(el)el.innerHTML=t};
function openMyTexts(){$("edView").hidden=false;ED=null;renderMyList()}
function showSubs(t){
  const subs=loadSubs().filter(x=>x.textId===t.id),MK={o:"◯",t:"△",x:"×"};
  openSheet(`<h2>提出結果：${esc(t.title||"無題")}</h2>
    ${subs.map((s,k)=>{const sc=s.answers.filter(a=>a.mark==="o").length;
      return `<div class="rvw"><span class="lab">${new Date(s.at).toLocaleString()}　◯${sc}／${s.answers.length}${s.score!=null?`　${s.score}／${s.max}点`:""}</span>
        ${s.answers.map((a,i)=>`<div class="en" style="font-size:13px">Q${i+1} ${MK[a.mark]}${a.hint?"💡":""} ${esc(a.mine||"（未回答）")}${a.why?` <small class="why">${esc(a.why)}</small>`:""}</div>`).join("")}</div>`}).reverse().join("")}
    <p class="note">いまは、この端末で提出された答えだけが見えます（共有はサイトへ引っ越してから）。</p>
    <div class="btns"><button class="ghost" id="subsClear">提出結果を消す</button><button class="primary" id="closeBtn">閉じる</button></div>`);
  $("closeBtn").onclick=closeSheet;
  $("subsClear").onclick=async()=>{if(await ask("この長文の提出結果を全部消しますか？","消す")){saveSubs(loadSubs().filter(x=>x.textId!==t.id));closeSheet();renderMyList()}};
}
function showTrash(){
  const tr=loadTrash();
  openSheet(`<h2>ゴミ箱</h2><p class="note">削除した長文は${TRASH_DAYS}日間ここに残ります。</p>
    ${tr.length?"":`<p class="note">ゴミ箱は空です。</p>`}
    ${tr.map((t,i)=>`<div class="rvw"><b>${esc(t.title||"（無題）")}</b><span class="lab">${(t.sents||[]).length}文・${(t.questions||[]).length}問・削除：${new Date(t.deletedAt).toLocaleDateString()}（あと${Math.max(0,Math.ceil(TRASH_DAYS-(Date.now()-t.deletedAt)/864e5))}日）</span>
      <div class="btns"><button class="primary" data-restore="${i}">元に戻す</button><button class="ghost" data-purge="${i}" style="color:var(--bad)">完全に削除</button></div></div>`).join("")}
    <div class="btns"><button class="ghost" id="closeBtn">閉じる</button></div>`);
  $("closeBtn").onclick=()=>{closeSheet();renderMyList()};
  $("sheet").querySelectorAll("[data-restore]").forEach(b=>b.onclick=()=>{const tr=loadTrash(),t=tr.splice(+b.dataset.restore,1)[0];delete t.deletedAt;
    const list=loadMy();list.unshift(t);saveMy(list);saveTrash(tr);toast("元に戻しました");showTrash()});
  $("sheet").querySelectorAll("[data-purge]").forEach(b=>b.onclick=async()=>{const tr=loadTrash(),t=tr[+b.dataset.purge];
    if(!(await ask(`「${t.title||"無題"}」を完全に削除しますか？`,"完全に削除")))return;
    if(!(await ask("完全に削除すると、もう元に戻せません。提出結果も一緒に消えます。\n本当に削除しますか？","本当に削除する")))return;
    tr.splice(+b.dataset.purge,1);saveTrash(tr);saveSubs(loadSubs().filter(x=>x.textId!==t.id));toast("完全に削除しました");showTrash()});
}
/* バックアップ：My Texts・みんなの長文・難易度の修正を1つのファイルに書き出す／My Texts に戻す */
async function exportBackup(){
  if(DB)await loadShared();
  const data=JSON.stringify({app:"chunkchunk",v:1,at:new Date().toISOString(),myTexts:loadMy(),shared:(SHARED||[]).map(({by,at,...t})=>t),levels:LVO},null,1);
  const fn=`chunkchunk-backup-${new Date().toISOString().slice(0,10)}.json`;
  if(DLC){try{await DLC.save({filename:fn,data:new Blob([data],{type:"application/json"})});toast("書き出しました");return}
    catch(e){if(e&&(e.code==="declined"||e.code==="rate_limited"))return}}
  openSheet(`<h2>バックアップ</h2><p class="note">ファイルとして保存できなかったので、下の文字を全部コピーして、メモなどに貼って保管してください。</p>
    <textarea id="bkText" readonly rows="8" style="width:100%;font-size:12px;background:var(--surface2);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px"></textarea>
    <div class="btns"><button class="ghost" id="closeBtn">閉じる</button><button class="primary" id="bkSel">全部選択</button></div>`);
  $("bkText").value=data;$("bkSel").onclick=()=>{$("bkText").focus();$("bkText").select()};$("closeBtn").onclick=closeSheet;
}
async function importBackup(text){
  let d;try{d=JSON.parse(text)}catch(e){await tell("読み込めませんでした。バックアップのファイルか確認してください。");return}
  if(!d||d.app!=="chunkchunk"){await tell("このアプリのバックアップではないようです。");return}
  const mine=loadMy(),ids=new Set(mine.map(t=>t.id));let n=0;
  [...(d.myTexts||[]),...(d.shared||[])].forEach(t=>{if(t&&t.id&&!ids.has(t.id)&&Array.isArray(t.sents)){ids.add(t.id);mine.push(t);n++}});
  saveMy(mine);
  let lv=0;
  if(DB&&IS_ADMIN&&d.levels)for(const [k,v] of Object.entries(d.levels)){if(v>=1&&v<=10&&LVO[k]==null){try{await DB.doc("levels/"+k).set({level:v});LVO[k]=v;lv++}catch(e){}}}
  toast(`戻しました：長文${n}本${lv?`・難易度の修正${lv}件`:""}`);renderMyList();
}
async function renderShared(){
  const box=$("edShared");if(!box)return;
  const list=await loadShared();if(!$("edShared"))return;
  if(!list.length){box.innerHTML=`<p class="edStatus">まだ共有された長文はありません。自分の長文の「共有に送る」で追加できます。</p>`;return}
  box.innerHTML=list.map((t,i)=>{const lv=LVO["t-"+t.id]!=null?LVO["t-"+t.id]:t.level,mine=MYID&&t.by===MYID;
    return `<div class="edItem"><b>${esc(t.title||"（無題）")}${mine?" （自分が送信）":""}</b><small>${esc(lvLabel(lv))}・${(t.sents||[]).length}文・${(t.questions||[]).length}問・${t.mode==="test"?"テスト用":"学習用"}</small>
      <div class="edRow"><button class="edBtn" data-s="read" data-i="${i}">${t.mode==="test"?"テストを受ける":"Reading"}</button><button class="edBtn" data-s="prac" data-i="${i}">Practice</button><button class="edBtn" data-s="copy" data-i="${i}">自分用にコピー</button>${mine||IS_ADMIN?`<button class="edBtn del" data-s="drop" data-i="${i}">取り下げ</button>`:""}</div></div>`}).join("");
  box.querySelectorAll("[data-s]").forEach(b=>b.onclick=async()=>{const t=list[+b.dataset.i],a=b.dataset.s;
    if(a==="copy"){const mine=loadMy(),c=JSON.parse(JSON.stringify(t));delete c.by;delete c.at;c.id="t"+Date.now();mine.unshift(c);saveMy(mine);toast("自分用にコピーしました（編集できます）");renderMyList();return}
    if(a==="drop"){if(!(await ask(`「${t.title||"無題"}」を、みんなの長文から取り下げますか？\n共有相手の画面から消えます。`,"取り下げる")))return;
      try{await DB.doc("texts/"+t.id).delete();SHARED=SHARED.filter(x=>x.id!==t.id);toast("取り下げました")}catch(e){await tell("取り下げできませんでした。")}
      renderShared();return}
    $("edView").hidden=true;const st={...myToStory(t),level:LVO["t-"+t.id]!=null?LVO["t-"+t.id]:t.level};
    if(a==="read")startRead(st);else startPractice(t)});
}
async function shareText(t){
  if(!DB)return;
  await loadShared();const exists=(SHARED||[]).some(x=>x.id===t.id);
  const msg=exists?`「${t.title||"無題"}」はすでに共有されています。今の内容で上書きしますか？`:`「${t.title||"無題"}」を「みんなの長文」に送りますか？\n共有相手の全員が読めるようになります。`;
  if(!(await ask(msg,exists?"上書きする":"送る")))return;
  const doc={id:t.id,title:t.title||"",text:t.text||"",sents:t.sents||[],questions:t.questions||[],level:t.level||null,mode:t.mode||"learn",by:MYID||null,at:Date.now()};
  try{await DB.doc("texts/"+t.id).set(doc);SHARED=(SHARED||[]).filter(x=>x.id!==t.id).concat([doc]);toast("みんなの長文に送りました");renderMyList()}
  catch(e){await tell(e&&e.code==="quota_exceeded"?"共有の保存数がいっぱいです。不要な長文を取り下げてください。":"送れませんでした。共有への書き込み権限がないか、通信の問題かもしれません。")}
}
function renderMyList(){
  const list=loadMy();$("edHead").textContent="My Texts";
  $("edBody").innerHTML=`<p class="edStatus">登録した長文は、この端末のブラウザに保存されます（共有は今後対応）。</p>
    <button class="edBtn pri" id="edNew">＋ 長文を登録する</button>
    <button class="edBtn" id="edShort">＋ 短文をまとめて入れる（自分の短文 ${loadMyShorts().length}文${DB&&SHORTS?`・みんなの短文 ${shortsShared().length}文`:""}）</button>
    ${list.length?"":`<p class="edStatus">まだ登録がありません。</p>`}
    ${list.map((t,i)=>{const subs=loadSubs().filter(x=>x.textId===t.id).length;
      return `<div class="edItem"><b>${esc(t.title||"（無題）")}</b><small>${esc(lvLabel(t.level))}・${(t.sents||[]).length}文・${(t.questions||[]).length}問・${t.mode==="test"?"テスト用":"学習用"}${subs?`・提出${subs}件`:""}</small>
      <div class="edRow"><button class="edBtn" data-a="read" data-i="${i}">${t.mode==="test"?"テストを受ける":"Reading"}</button><button class="edBtn" data-a="prac" data-i="${i}">Practice</button><button class="edBtn" data-a="edit" data-i="${i}">編集</button>${DB&&CAN_WRITE!==false&&(t.sents||[]).length?`<button class="edBtn" data-a="share" data-i="${i}">共有に送る</button>`:""}${subs?`<button class="edBtn" data-a="subs" data-i="${i}">提出結果</button>`:""}<button class="edBtn del" data-a="del" data-i="${i}">削除</button></div></div>`}).join("")}`;
  const tr=loadTrash();
  if(DB){$("edBody").insertAdjacentHTML("beforeend",`<h3 class="edSharedH">みんなの長文</h3><div id="edShared"><p class="edStatus">読み込み中…</p></div>`);renderShared()}
  $("edBody").insertAdjacentHTML("beforeend",`<button class="edBtn" id="edTrash" style="margin-top:12px">🗑 ゴミ箱（${tr.length}）</button>
    <div class="edRow" style="margin-top:8px"><button class="edBtn" id="edBackup">💾 バックアップを書き出す</button><button class="edBtn" id="edRestore">📥 バックアップから戻す</button><input type="file" id="edRestoreFile" accept=".json,application/json" hidden></div>`);
  $("edTrash").onclick=showTrash;
  $("edBackup").onclick=exportBackup;
  $("edRestore").onclick=()=>$("edRestoreFile").click();
  $("edRestoreFile").onchange=async e=>{const f=e.target.files[0];if(f)importBackup(await f.text());e.target.value=""};
  $("edNew").onclick=()=>{ED={id:"t"+Date.now(),title:"",text:"",sents:[],questions:[]};renderEditor()};
  $("edShort").onclick=()=>renderShortEditor();
  $("edBody").querySelectorAll("[data-a]").forEach(b=>b.onclick=async()=>{
    const t=list[+b.dataset.i],a=b.dataset.a;
    if(a==="edit"){ED=JSON.parse(JSON.stringify(t));ED.questions=(ED.questions||[]).map(q=>cleanQ(normQ(q,ED.sents||[])));renderEditor()}
    else if(a==="subs")showSubs(t);
    else if(a==="share")shareText(t);
    else if(a==="del"){
      if(!(await ask(`「${t.title||"無題"}」を削除しますか？`,"削除する")))return;
      if(!(await ask(`本文・チャンク分け・問題など、この長文の内容がすべて一覧から消えます。\n（ゴミ箱に${TRASH_DAYS}日間残るので、その間は元に戻せます）\n本当に削除しますか？`,"本当に削除する")))return;
      list.splice(+b.dataset.i,1);saveMy(list);const tr=loadTrash();tr.unshift({...t,deletedAt:Date.now()});saveTrash(tr);
      renderMyList();toast("ゴミ箱に移しました")}
    else if(!t.sents||!t.sents.length)tell("まだチャンク分けされていません。「編集」から分けてください。");
    else{$("edView").hidden=true;if(a==="read")startRead(myToStory(t));else startPractice(t)}
  });
}
function edCollect(){
  if(!ED||!$("edTitle"))return;
  ED.title=$("edTitle").value;ED.text=$("edText").value;
  if($("edMode"))ED.mode=$("edMode").value;
  if($("edLevel"))ED.level=+$("edLevel").value||null;
  if($("edHint")){ED.hint=$("edHint").value;ED.hintCost=+$("edHintCost").value}
  document.querySelectorAll(".qPts").forEach(x=>{const q=ED.questions[+x.dataset.q];if(q)q.pts=+x.value>0?+x.value:100});
  document.querySelectorAll(".spanPick").forEach(x=>{const q=ED.questions[+x.dataset.q];if(!q)return;
    const v={si:+x.querySelector(".spS").value,a:+x.querySelector(".spA").value,b:+x.querySelector(".spB").value};
    if(v.a>=0&&v.b<0)v.b=v.a;if(v.b>=0&&v.a<0)v.a=v.b;if(v.b<v.a)[v.a,v.b]=[v.b,v.a];
    if(x.dataset.kind==="main")Object.assign(q,v);else (q[x.dataset.kind]=q[x.dataset.kind]||[])[+x.dataset.k]=v});
  document.querySelectorAll(".edJa").forEach(x=>{const s=ED.sents[+x.dataset.si];if(s)s.ja=x.value});
  document.querySelectorAll(".qText").forEach(x=>{ED.questions[+x.dataset.q].q=x.value});
  document.querySelectorAll(".qOpt").forEach(x=>{ED.questions[+x.dataset.q].options[+x.dataset.i]=x.value});
  document.querySelectorAll(".qCorrect").forEach(x=>{if(x.checked)ED.questions[+x.dataset.q].correct=+x.dataset.i});
}
function spanPicker(qi,kind,k,v){   // 文・最初の語・最後の語を選ぶ。チャンクからまとめて選ぶこともできる
  const s=ED.sents[v.si]||ED.sents[0];if(!s)return "";
  const wopt=(sel)=>`<option value="-1" ${sel<0?"selected":""}>（選ぶ）</option>`+s.words.map((w,i)=>`<option value="${i}" ${i===sel?"selected":""}>${i+1}. ${esc(w)}</option>`).join("");
  const chunkOpts=ED.sents.map((ss,si)=>{const st=unitStarts(ss),en=unitEnds(ss);
    return st.map((a,j)=>`<option value="${si}:${a}:${en[j]}">文${si+1}: ${esc(ss.words.slice(a,en[j]+1).join(" "))}</option>`).join("")}).join("");
  return `<div class="spanPick" data-q="${qi}" data-kind="${kind}" data-k="${k}">
    <select class="spS">${ED.sents.map((_,si)=>`<option value="${si}" ${si===v.si?"selected":""}>文${si+1}</option>`).join("")}</select>
    <select class="spA">${wopt(v.a)}</select><span>〜</span><select class="spB">${wopt(v.b)}</select>
    <select class="spChunk"><option value="">チャンクから選ぶ</option>${chunkOpts}</select>
    ${kind!=="main"?`<button class="edBtn del spDel">✕</button>`:""}
    <div class="spPrev">${v.a>=0&&v.b>=0?esc(s.words.slice(Math.min(v.a,v.b),Math.max(v.a,v.b)+1).join(" ")):`<span style="color:#6b7686">まだ選んでいません（選ばないままなら保存時に消えます）</span>`}</div></div>`;
}
function renderEditor(){
  $("edHead").textContent=ED.title?`編集：${ED.title}`:"新しい長文";
  const sentHTML=ED.sents.map((s,si)=>{const en=new Set(unitEnds(s)),starts=new Set(unitStarts(s));
    return `<div class="edSent"><div class="edWords">${s.words.map((w,j)=>
      (starts.has(j)?`<button class="roleChip r${(s.roleAt||{})[j]||"M"}" data-si="${si}" data-u="${j}">${(s.roleAt||{})[j]||"M"}</button>`:"")+
      `<span class="edW">${esc(w)}</span>`+(j<s.words.length-1?`<button class="edGap ${en.has(j)?"on":""}" data-si="${si}" data-g="${j}">｜</button>`:"")).join("")}</div>
      <input type="text" class="edJa" data-si="${si}" placeholder="訳（任意）" value="${esc(s.ja||"")}"></div>`}).join("");
  const qHTML=ED.questions.map((q,qi)=>q.type==="choice"
    ?`<div class="edQ"><small>5択問題</small><input type="text" class="qText" data-q="${qi}" value="${esc(q.q||"")}" placeholder="問題文">
       ${[0,1,2,3,4].map(i=>`<div class="choiceRow"><input type="radio" name="qc${qi}" class="qCorrect" data-q="${qi}" data-i="${i}" ${q.correct===i?"checked":""} aria-label="正解"><input type="text" class="qOpt" data-q="${qi}" data-i="${i}" value="${esc((q.options||[])[i]||"")}" placeholder="選択肢 ${String.fromCharCode(65+i)}"></div>`).join("")}
       <small>左の丸で正解を選ぶ</small><label class="ptsRow">配点 <input type="number" class="qPts" data-q="${qi}" min="0" max="1000" value="${q.pts||100}" style="width:72px"> 点</label> <button class="edBtn del" data-delq="${qi}">この問題を削除</button></div>`
    :`<div class="edQ"><small>範囲で答える問題</small><input type="text" class="qText" data-q="${qi}" value="${esc(q.q||"")}" placeholder="問題文（例：〜したのは誰？）">
       <small>想定した答え（◯）</small>${spanPicker(qi,"main",0,q)}
       <small>◯にする別解：${(q.alts||[]).length?"":"なし"}</small>${(q.alts||[]).map((v,k)=>spanPicker(qi,"alts",k,v)).join("")}
       <small>△にする答え：${(q.partials||[]).length?"":"なし（自動で判定）"}</small>${(q.partials||[]).map((v,k)=>spanPicker(qi,"partials",k,v)).join("")}
       <div class="edRow"><button class="edBtn" data-addalt="${qi}">＋ ◯別解</button><button class="edBtn" data-addpart="${qi}">＋ △の答え</button></div>
       <small>登録がない時は自動で判定：中心が合っていて説明が足りないだけ／同じ役割の分だけ長い → △、ほかの役割まで入る → ×</small>
       <label class="ptsRow">配点 <input type="number" class="qPts" data-q="${qi}" min="0" max="1000" value="${q.pts||100}" style="width:72px"> 点</label> <button class="edBtn del" data-delq="${qi}">この問題を削除</button></div>`).join("");
  $("edBody").innerHTML=`<h3>TITLE</h3><input type="text" id="edTitle" value="${esc(ED.title||"")}" placeholder="タイトル">
    <h3>ENGLISH TEXT</h3><textarea id="edText" placeholder="英文を貼り付け">${esc(ED.text||"")}</textarea>
    <h3>SETTINGS</h3>
    <div class="edRow edSet"><label>難易度 <select id="edLevel"><option value="0" ${!ED.level?"selected":""}>未設定（全レベル対象）</option>${LV.slice(1).map((_,i)=>`<option value="${i+1}" ${ED.level===i+1?"selected":""}>${esc(lvLabel(i+1))}</option>`).join("")}</select></label>
      <button class="edBtn" id="edEstLv">自動で見積もる</button></div>
    <div class="edRow edSet"><label>使い方 <select id="edMode"><option value="learn" ${ED.mode!=="test"?"selected":""}>学習用（すぐ答え合わせ）</option><option value="test" ${ED.mode==="test"?"selected":""}>テスト用（答えるだけ）</option></select></label></div>
    <div class="edRow edSet"><label>テスト用：ヒント <select id="edHint"><option value="none" ${(ED.hint||"none")==="none"?"selected":""}>なし（標準）</option><option value="sentence" ${ED.hint==="sentence"?"selected":""}>何文目にあるかだけ</option><option value="grammar" ${ED.hint==="grammar"?"selected":""}>区切りと色まで</option></select></label>
      <label>減点 <select id="edHintCost">${[0,5,10,20,30,50].map(n=>`<option ${n===(ED.hintCost==null?20:+ED.hintCost)?"selected":""}>${n}</option>`).join("")}</select>点／問</label></div>
    <small class="edStatus">ヒントと減点は、テスト用のときだけ使われます。問題ごとの配点は、各問題の下で決めます。</small>
    <div class="edRow edSet"><label>AIに作らせる問題：範囲 <select id="edRangeN">${[0,1,2,3,4,5,6,8,10].map(n=>`<option ${n===+settings.qRange?"selected":""}>${n}</option>`).join("")}</select>問</label>
      <label>5択 <select id="edChoiceN">${[0,1,2,3,4,5,6,8,10].map(n=>`<option ${n===+settings.qChoice?"selected":""}>${n}</option>`).join("")}</select>問</label>
      <label>言語 <select id="edQLang"><option value="ja" ${settings.qLang!=="en"?"selected":""}>日本語</option><option value="en" ${settings.qLang==="en"?"selected":""}>英語</option></select></label></div>
    <div class="edRow"><button class="edBtn" id="edAuto">お手軽自動で分ける</button><button class="edBtn" id="edAI">AIで分ける（役割・訳つき）</button></div>
    <details class="edCopy" ${ED.copyOpen?"open":""}><summary>自分のAIで分ける（コピペ方式・無料）</summary>
      <ol class="edSteps"><li>「指示文をコピー」を押す</li><li>Claude や ChatGPT に貼り付け、続けて英文も貼り付けて送る（上の欄に英文を入れておけば、指示文に最初から入る）</li><li>返ってきた返事を全部コピーして、下に貼り付けて「読み込む」</li></ol>
      <div class="edRow"><button class="edBtn" id="edCopyPrompt">① 指示文をコピー</button><button class="edBtn" id="edSelPrompt">全部選択</button></div>
      <small class="edSteps">コピーできない時は、下の指示文を長押し →「すべてを選択」→「コピー」。</small>
      <textarea id="edPrompt" aria-label="AI用の指示文">${esc(buildAIPrompt((ED.text||"").trim()))}</textarea>
      <textarea id="edPaste" placeholder="③ AIの返事をここに貼り付け"></textarea>
      <div class="edRow"><button class="edBtn pri" id="edLoadPaste">読み込む</button></div>
    </details>
    <div class="edStatus" id="edStatus">お手軽自動：すぐ分けられるが一部は手直しが必要。コピペ方式：自分のAIで正確に・訳つきで分けられる（無料版のAIでも可）。</div>
    ${ED.sents.length?`<h3>CHUNKS</h3><p class="edStatus">「｜」をタップで区切りの追加・削除。役割の札（S・V・O…）をタップで役割を変える。</p>${sentHTML}
    <h3>QUESTIONS</h3>${qHTML}<div class="edRow"><button class="edBtn" id="edAddRange">＋ 範囲で答える問題</button><button class="edBtn" id="edAddChoice">＋ 5択問題</button></div>`:""}
    <div class="edRow" style="margin-top:8px"><button class="edBtn pri" id="edSave">保存</button><button class="edBtn" id="edCancel">一覧へ戻る</button></div>`;
  $("edAuto").onclick=async()=>{edCollect();if(!ED.text.trim()){edStatus("英文を入れてください。");return}
    if(ED.sents.length&&!(await ask("今のチャンク分けを作り直しますか？","作り直す")))return;
    ED.sents=autoChunk(ED.text);if(!ED.level)ED.level=estimateLevel(ED.sents);ED.questions=ED.questions.filter(q=>q.type==="choice"||(ED.sents[q.si]&&q.b<ED.sents[q.si].words.length));renderEditor();edStatus("お手軽自動で分けました。区切りと役割を確認して、必要なら直してください。")};
  $("edBody").querySelector(".edCopy").ontoggle=e=>{ED.copyOpen=e.target.open};
  $("edEstLv").onclick=()=>{edCollect();const src=ED.sents.length?ED.sents:autoChunk(ED.text||"");const lv=estimateLevel(src);
    if(!lv){edStatus("英文を入れてから見積もってください。");return}ED.level=lv;renderEditor();edStatus(`難易度を ${lvLabel(lv)} と見積もりました（AIなしの目安）。違えば選び直してください。`)};
  [["edRangeN","qRange"],["edChoiceN","qChoice"],["edQLang","qLang"]].forEach(([id,k])=>$(id).onchange=e=>{settings[k]=id==="edQLang"?e.target.value:+e.target.value;saveSettings();syncPrompt(true)});
  // 範囲の選び方
  $("edBody").querySelectorAll(".spanPick").forEach(x=>{
    x.querySelector(".spS").onchange=e=>{edCollect();const q=ED.questions[+x.dataset.q],v={si:+e.target.value,a:0,b:0};
      if(x.dataset.kind==="main")Object.assign(q,v);else q[x.dataset.kind][+x.dataset.k]=v;renderEditor()};
    x.querySelector(".spChunk").onchange=e=>{if(!e.target.value)return;edCollect();const [si,a,b]=e.target.value.split(":").map(Number),q=ED.questions[+x.dataset.q];
      if(x.dataset.kind==="main")Object.assign(q,{si,a,b});else q[x.dataset.kind][+x.dataset.k]={si,a,b};renderEditor()};
    [".spA",".spB"].forEach(c=>x.querySelector(c).onchange=()=>{edCollect();renderEditor()});
    const d=x.querySelector(".spDel");if(d)d.onclick=()=>{edCollect();ED.questions[+x.dataset.q][x.dataset.kind].splice(+x.dataset.k,1);renderEditor()};
  });
  $("edBody").querySelectorAll("[data-addalt],[data-addpart]").forEach(b=>b.onclick=()=>{edCollect();const q=ED.questions[+(b.dataset.addalt||b.dataset.addpart)],k=b.dataset.addalt!=null?"alts":"partials";
    (q[k]=q[k]||[]).push({si:q.si,a:-1,b:-1});renderEditor()});
  const selPrompt=()=>{syncPrompt(true);const ta=$("edPrompt");ta.focus();ta.select();try{ta.setSelectionRange(0,ta.value.length)}catch(e){}};
  // 英文が変わったら指示文を作り直す（入力・貼り付け・変換確定など、どの方法でも拾えるよう複数の合図＋定期確認）
  ["input","change","keyup","paste","compositionend","blur"].forEach(ev=>$("edText").addEventListener(ev,()=>setTimeout(()=>syncPrompt(),0)));
  $("edPrompt").addEventListener("focus",()=>syncPrompt());
  $("edBody").querySelector(".edCopy").addEventListener("toggle",()=>syncPrompt(true));
  clearInterval(window.__promptTimer);window.__promptTimer=setInterval(()=>{if($("edView").hidden||!$("edText")){clearInterval(window.__promptTimer);return}syncPrompt()},600);
  syncPrompt(true);
  $("edSelPrompt").onclick=selPrompt;
  $("edCopyPrompt").onclick=async()=>{edCollect();syncPrompt(true);
    const pr=$("edPrompt").value;
    let ok=false;try{await navigator.clipboard.writeText(pr);ok=true}catch(e){}
    selPrompt();if(!ok){try{ok=document.execCommand("copy")}catch(e){}}
    edStatus(ok?"コピーしました。AIに貼り付けて送ってください。（貼り付けられなかったら、選択された指示文をそのままコピーしてください）"
             :"この画面では自動でコピーできませんでした。指示文を選択したので、そのまま「コピー」してください。")};
  $("edLoadPaste").onclick=async()=>{const t=$("edPaste").value.trim();if(!t){edStatus("AIの返事を貼り付けてください。");return}
    let sents,qs,out;try{out=parsePastedAI(t);sents=aiResultToSents(out);qs=aiResultToQuestions(out,sents)}
    catch(e){edStatus(`読み込めませんでした：${esc(e.message||"")}`);tell("読み込めませんでした。\n"+(e.message||"")+"\n\nAIの返事を最初から最後まで全部貼り付けたか確認してください。");return}
    if(!sents.length){edStatus("文が見つかりませんでした（sentences が空です）。");tell("データは読めましたが、文（sentences）が入っていませんでした。");return}
    if((ED.sents.length||ED.questions.length)&&!(await ask("今のチャンク分けと問題を置き換えますか？","置き換える")))return;
    edCollect();ED.sents=sents;ED.questions=qs.length?qs:[];ED.copyOpen=false;
    const aiTitle=String(out.title||"").trim();
    if(aiTitle&&!String(ED.title||"").trim())ED.title=aiTitle;   // 自分で入れたタイトルは上書きしない
    const aiLv=parseInt(out.level,10)||0;
    if(!ED.level)ED.level=aiLv>=1&&aiLv<=10?aiLv:estimateLevel(sents);
    if(!ED.text.trim())ED.text=sents.map(x=>x.words.join(" ")).join(" ");   // 英文を向こうに直接貼った場合は、結果から英文欄を埋める
    renderEditor();
    edStatus(`読み込みました（${sents.length}文・役割と訳つき${qs.length?`・問題${qs.length}問`:""}）。気になる所は直してから保存してください。`)};
  $("edAI").onclick=async()=>{edCollect();if(!ED.text.trim()){edStatus("英文を入れてください。");return}
    if(ED.sents.length&&!(await ask("今のチャンク分けを作り直しますか？","作り直す")))return;aiChunk(ED.text)};
  $("edBody").querySelectorAll(".edGap").forEach(b=>b.onclick=()=>{edCollect();const s=ED.sents[+b.dataset.si],g=+b.dataset.g;s.roleAt=s.roleAt||{};s.ujp=s.ujp||{};
    const en=unitEnds(s);
    if(en.includes(g)){s.ends=en.filter(x=>x!==g);delete s.roleAt[g+1];delete s.ujp[g+1]}
    else{const st=unitStarts(s).filter(x=>x<=g).pop();s.ends=[...en,g].sort((a,b)=>a-b);s.roleAt[g+1]=s.roleAt[st]||"M"}
    renderEditor()});
  $("edBody").querySelectorAll(".roleChip").forEach(b=>b.onclick=()=>{edCollect();const s=ED.sents[+b.dataset.si],u=+b.dataset.u;s.roleAt=s.roleAt||{};
    s.roleAt[u]=ROLES[(ROLES.indexOf(s.roleAt[u]||"M")+1)%ROLES.length];renderEditor()});
  if($("edAddRange"))$("edAddRange").onclick=()=>{edCollect();ED.questions.push({type:"range",q:"",si:0,a:0,b:0,alts:[],partials:[]});renderEditor()};
  if($("edAddChoice"))$("edAddChoice").onclick=()=>{edCollect();ED.questions.push({type:"choice",q:"",options:["","","","",""],correct:0});renderEditor()};
  $("edBody").querySelectorAll("[data-delq]").forEach(b=>b.onclick=()=>{edCollect();ED.questions.splice(+b.dataset.delq,1);renderEditor()});
  $("edSave").onclick=()=>{edCollect();const list=loadMy(),i=list.findIndex(t=>t.id===ED.id);
    ED.questions=ED.questions.map(cleanQ);
    const data=JSON.parse(JSON.stringify(ED));if(i>=0)list[i]=data;else list.unshift(data);
    const ok=saveMy(list);
    edStatus(ok?"保存しました。":"保存できませんでした（ブラウザの保存が使えない環境です）。");$("edHead").textContent=`編集：${ED.title||"無題"}`;
    if(ok){toast("✓ 保存しました");const b=$("edSave");b.textContent="✓ 保存しました";b.classList.add("saved");
      setTimeout(()=>{if($("edSave")===b){b.textContent="保存";b.classList.remove("saved")}},1800)}
    else tell("保存できませんでした。この画面ではブラウザへの保存が使えないようです。")};
  $("edCancel").onclick=()=>{ED=null;renderMyList()};
}
$("edBack").onclick=()=>{if(ED){ED=null;renderMyList()}else showTitle()};
