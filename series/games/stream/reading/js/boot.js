/* 長文ゲーム（チャンクストリーム）から開くとき：タイトルは出さず、指定の長文をそのままリーディングで開く
   reading/index.html?id=<長文のid>&from=pre（予習）|post（振り返り）。id がなければ、ふつうのチャンクチャンクとして起動
   街（チャンクシリーズの街）からは ?go=study|game|avatar で、その画面を開いて起動 */
(()=>{
  const q=new URLSearchParams(location.search),id=q.get("id"),from=q.get("from")||"pre";
  const t=id&&typeof LS_TEXTS!=="undefined"?LS_TEXTS[id]:null;
  if(id&&!t&&window.parent!==window){window.parent.postMessage({type:"reading:missing"},"*");return}   // ゲームから開いたのに文章データがない
  if(!t){showTitle();initShared();   /* 街から開くとき：?go=study（学校・図書館）|game（ゲームセンター）|avatar（自宅） */
    const go=q.get("go");try{if(go==="avatar")mpOpen();else if(go==="study"||go==="game")setFace(go)}catch(e){}
    return}
  const close=()=>{try{speechSynthesis.cancel()}catch(e){}
    if(window.parent&&window.parent!==window)window.parent.postMessage({type:"reading:close"},"*");else history.back()};
  window.showTitle=close;   // 読み終わり・答え合わせのあとの「タイトルへ」は、ゲームに戻る
  const sens=t.list.map(([en,ja])=>parseSentence(en,ja));
  const story={title:t.title,list:t.list,level:t.level,
    questions:(t.q||[]).map(([si,ui,qq])=>{const u=sens[si].units[ui];return {type:"range",si,a:u.s,b:u.e,alts:[],partials:[],q:qq}})};
  startRead(story);
  $("rdTitle").textContent=`${from==="post"?"振り返り":"予習"}｜${t.title}`;
  $("rdBack").textContent=from==="post"?"← 結果へ":"← もどる";
  $("rdBack").onclick=close;
})();
