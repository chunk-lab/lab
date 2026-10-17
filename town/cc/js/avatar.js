/* チャンクチャンク：アバター（動く2D・上半身）とマイページ
 ============================================================
 ■ アバターのデータ（保存されるのはこれだけ。とても小さい）
   {v:1, parts:{face,eyes,brows,mouth,hairF,hairB,cloth,acc,bg}, colors:{skin,hair,eye,cloth,acc,bg}}
   → 2Dの絵を描き直しても、将来3Dにしても、選んだ内容はそのまま使える

 ■ 絵の差し替え（型紙）
   ・キャンバスは 400×480（描く時は2倍の大きさ。画面では 200×240 に縮めて使う）
   ・首の付け根（頭が回る中心）＝(200,300)。顔の中心＝(200,196)
   ・目の中心＝左(160,204)・右(240,204)、口の中心＝(200,252)、前髪の付け根＝(200,80)
   ・パーツごとに、同じ大きさの透明PNGで描く。状態があるパーツは状態ごとに1枚
       目：open / half / closed / happy / sad / wide　口：close / smile / open / sad / o　まゆ：normal / up / sad
   ・ファイル名：img/avatar/<パーツの種類>_<ID>_<状態>.png（状態がないパーツは _base）
   ・髪・服など色を変えるパーツは、白〜灰色で描く（プログラムで色を付ける）
   ・下の AV_PARTS の各パーツに img:true を付けると、その絵が使われる

 ■ ゲームとの連動
   ・ゲーム側は document に合図を出す：cc:judge（区切りの判定）/ cc:sentence（1文おわり）/ cc:challenge（チャレンジおわり）
   ・アバター側は AvatarAPI.react("happy"|"joy"|"sad"|"surprise"|"think"|"normal") で表情が変わる
   ・合図と表情の結びつけは AV_LINK で決める（いまは、表示中のアバターがあれば反応するだけ）

 ■ ガチャ・限定パーツ
   ・lock:"gacha" / lock:"rank" のパーツは、持っていないと選べない（AvatarAPI.grantPart(id) で持たせる）
   ・ガチャで出たアバターは AvatarAPI.addSaved(アバター, "gacha") で保存一覧に入る
 ============================================================ */

const AV_W=200,AV_H=240,AV_NECK=[100,150];
const AV_LINE="#4a3b5c";
const AV_PAL={
  skin:["#ffe7d6","#ffd9c0","#f5c7a1","#e0a878","#b87a52","#8a5634"],
  hair:["#3b2a2a","#6b4a3a","#a0704a","#e8c26a","#f2e2b0","#ff9ec4","#8cc8ff","#9b7fd4","#7fd4a8","#e8e8f0"],
  eye:["#3a2a4a","#5a3a2a","#2f6fb0","#3f9a6a","#8a4ac0","#c0506a","#d08a2a","#222222"],
  cloth:["#8cc8ff","#ff9ec4","#ffd166","#7fd4a8","#b89cf0","#ffffff","#4a4a6a","#ff8f6b","#6bb8ff","#f0a0c8"],
  acc:["#ff6b8a","#ffd166","#8cc8ff","#9b7fd4","#ffffff","#333344"],
  bg:["#fde3ee","#dff0ff","#fff3c4","#e3f7ec","#efe6ff","#ffe6d6","#e8ecf2","#2a3350"]
};
function avShade(hex,a){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;
  const f=v=>Math.max(0,Math.min(255,Math.round(a<0?v*(1+a):v+(255-v)*a)));return "#"+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,"0")).join("")}
const OUT=`stroke="${AV_LINE}" stroke-opacity=".35" stroke-width="1.6" stroke-linejoin="round"`;
const EYE_L=[80,102],EYE_R=[120,102];
const both=f=>f(EYE_L[0],EYE_L[1],-1)+f(EYE_R[0],EYE_R[1],1);
const line=(d,w=2.4,c=AV_LINE)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

/* ---------- パーツ（いまは仮の形。img:true にすると絵に変わる） ---------- */
const AV_PARTS={
  face:[
    {id:"f1",name:"まる",draw:c=>`<ellipse cx="51" cy="104" rx="7" ry="10" fill="${c.skin}" ${OUT}/><ellipse cx="149" cy="104" rx="7" ry="10" fill="${c.skin}" ${OUT}/><ellipse cx="100" cy="98" rx="50" ry="52" fill="${c.skin}" ${OUT}/>`},
    {id:"f2",name:"たまご",draw:c=>`<ellipse cx="55" cy="106" rx="6" ry="9" fill="${c.skin}" ${OUT}/><ellipse cx="145" cy="106" rx="6" ry="9" fill="${c.skin}" ${OUT}/><ellipse cx="100" cy="100" rx="45" ry="55" fill="${c.skin}" ${OUT}/>`},
    {id:"f3",name:"ふっくら",draw:c=>`<ellipse cx="47" cy="106" rx="7" ry="10" fill="${c.skin}" ${OUT}/><ellipse cx="153" cy="106" rx="7" ry="10" fill="${c.skin}" ${OUT}/><path d="M48 92 C48 50 152 50 152 92 C154 132 132 150 100 150 C68 150 46 132 48 92Z" fill="${c.skin}" ${OUT}/>`}
  ],
  eyes:[
    {id:"e1",name:"まる",states:{
      open:c=>both((x,y)=>`<ellipse cx="${x}" cy="${y}" rx="6.5" ry="8.5" fill="${c.eye}"/><circle cx="${x+2}" cy="${y-3}" r="2.2" fill="#fff"/>`),
      wide:c=>both((x,y)=>`<ellipse cx="${x}" cy="${y}" rx="7.5" ry="10" fill="${c.eye}"/><circle cx="${x+2.5}" cy="${y-3.5}" r="2.6" fill="#fff"/>`),
      half:c=>both((x,y)=>`<ellipse cx="${x}" cy="${y+2}" rx="6.5" ry="4" fill="${c.eye}"/>`),
      closed:c=>both((x,y)=>line(`M${x-7} ${y+1} Q${x} ${y+5} ${x+7} ${y+1}`)),
      happy:c=>both((x,y)=>line(`M${x-7} ${y+3} Q${x} ${y-6} ${x+7} ${y+3}`)),
      sad:c=>both((x,y,s)=>`<ellipse cx="${x}" cy="${y+2}" rx="6" ry="5.5" fill="${c.eye}"/>`+line(`M${x-8} ${y-5+(s<0?3:-1)} L${x+8} ${y-5+(s<0?-1:3)}`,2))}},
    {id:"e2",name:"きらきら",states:{
      open:c=>both((x,y)=>`<ellipse cx="${x}" cy="${y}" rx="8" ry="10.5" fill="${c.eye}"/><ellipse cx="${x}" cy="${y+2}" rx="5" ry="6.5" fill="${avShade(c.eye,-.35)}"/><circle cx="${x+3}" cy="${y-4}" r="3" fill="#fff"/><circle cx="${x-3}" cy="${y+4}" r="1.5" fill="#fff"/>`+line(`M${x-9} ${y-8} Q${x} ${y-13} ${x+9} ${y-8}`,2.2)),
      wide:c=>both((x,y)=>`<ellipse cx="${x}" cy="${y}" rx="9" ry="12" fill="${c.eye}"/><circle cx="${x+3}" cy="${y-4}" r="3.4" fill="#fff"/><circle cx="${x-3}" cy="${y+5}" r="1.8" fill="#fff"/>`),
      half:c=>both((x,y)=>`<ellipse cx="${x}" cy="${y+3}" rx="8" ry="5" fill="${c.eye}"/>`+line(`M${x-9} ${y-1} L${x+9} ${y-1}`,2.2)),
      closed:c=>both((x,y)=>line(`M${x-9} ${y+1} Q${x} ${y+6} ${x+9} ${y+1}`,2.6)),
      happy:c=>both((x,y)=>line(`M${x-9} ${y+4} Q${x} ${y-7} ${x+9} ${y+4}`,2.6)),
      sad:c=>both((x,y)=>`<ellipse cx="${x}" cy="${y+2}" rx="7.5" ry="8" fill="${c.eye}"/><circle cx="${x+2}" cy="${y-1}" r="2.4" fill="#fff"/>`)}},
    {id:"e3",name:"たれ目",states:{
      open:c=>both((x,y,s)=>`<ellipse cx="${x}" cy="${y+1}" rx="6" ry="7" fill="${c.eye}"/><circle cx="${x+1.5}" cy="${y-2}" r="1.8" fill="#fff"/>`+line(`M${x-7*s*-1} ${y-6} Q${x} ${y-9} ${x+7*s*-1} ${y-4}`,2)),
      wide:c=>both((x,y)=>`<ellipse cx="${x}" cy="${y}" rx="7" ry="9" fill="${c.eye}"/><circle cx="${x+2}" cy="${y-3}" r="2.2" fill="#fff"/>`),
      half:c=>both((x,y)=>`<ellipse cx="${x}" cy="${y+3}" rx="6" ry="3.5" fill="${c.eye}"/>`),
      closed:c=>both((x,y)=>line(`M${x-7} ${y+2} Q${x} ${y+5} ${x+7} ${y+3}`)),
      happy:c=>both((x,y)=>line(`M${x-7} ${y+3} Q${x} ${y-5} ${x+7} ${y+3}`)),
      sad:c=>both((x,y)=>`<ellipse cx="${x}" cy="${y+3}" rx="5.5" ry="5" fill="${c.eye}"/>`)}}
  ],
  brows:[
    {id:"w1",name:"ほそ",states:{
      normal:c=>both((x,y,s)=>line(`M${x-8} ${y-16} Q${x} ${y-19} ${x+8} ${y-16}`,2.2,avShade(c.hair,-.25))),
      up:c=>both((x,y)=>line(`M${x-8} ${y-21} Q${x} ${y-25} ${x+8} ${y-21}`,2.2,avShade(c.hair,-.25))),
      sad:c=>both((x,y,s)=>line(`M${x-8} ${y-16+(s<0?2:-3)} L${x+8} ${y-16+(s<0?-3:2)}`,2.2,avShade(c.hair,-.25)))}},
    {id:"w2",name:"ふと",states:{
      normal:c=>both((x,y)=>line(`M${x-7} ${y-16} Q${x} ${y-18} ${x+7} ${y-16}`,4.2,avShade(c.hair,-.2))),
      up:c=>both((x,y)=>line(`M${x-7} ${y-21} Q${x} ${y-24} ${x+7} ${y-21}`,4.2,avShade(c.hair,-.2))),
      sad:c=>both((x,y,s)=>line(`M${x-7} ${y-16+(s<0?2:-3)} L${x+7} ${y-16+(s<0?-3:2)}`,4.2,avShade(c.hair,-.2)))}}
  ],
  mouth:[
    {id:"m1",name:"にっこり",states:{
      close:c=>line("M94 125 Q100 130 106 125",2.2),
      smile:c=>`<path d="M90 122 Q100 136 110 122 Z" fill="#c0506a" ${OUT}/>`,
      open:c=>`<ellipse cx="100" cy="127" rx="5.5" ry="6.5" fill="#c0506a" ${OUT}/>`,
      sad:c=>line("M94 129 Q100 123 106 129",2.2),
      o:c=>`<ellipse cx="100" cy="127" rx="4" ry="4.8" fill="#c0506a" ${OUT}/>`}},
    {id:"m2",name:"ねこ口",states:{
      close:c=>line("M91 123 Q95.5 129 100 124 Q104.5 129 109 123",2.2),
      smile:c=>line("M91 123 Q95.5 129 100 124 Q104.5 129 109 123",2.2)+`<path d="M95 127 Q100 136 105 127Z" fill="#c0506a"/>`,
      open:c=>line("M91 122 Q95.5 128 100 123 Q104.5 128 109 122",2.2)+`<ellipse cx="100" cy="130" rx="4" ry="4.5" fill="#c0506a"/>`,
      sad:c=>line("M92 128 Q96 124 100 127 Q104 124 108 128",2.2),
      o:c=>`<ellipse cx="100" cy="127" rx="4" ry="4.8" fill="#c0506a" ${OUT}/>`}}
  ],
  hairF:[
    {id:"hf1",name:"ぱっつん",draw:c=>`<path d="M50 96 C48 55 72 36 100 36 C128 36 152 55 150 96 L140 80 L128 90 L118 76 L106 88 L94 76 L82 88 L72 76 L60 90 Z" fill="${c.hair}" ${OUT}/>`},
    {id:"hf2",name:"ななめ",draw:c=>`<path d="M50 98 C48 52 74 34 104 36 C134 38 154 58 150 100 L144 84 C136 66 110 64 70 90 L60 76 Z" fill="${c.hair}" ${OUT}/>`},
    {id:"hf3",name:"つんつん",draw:c=>`<path d="M50 96 L44 70 L60 64 L56 44 L74 50 L78 30 L94 44 L104 26 L114 44 L128 32 L130 52 L146 46 L142 66 L156 72 L150 96 L138 80 L122 88 L110 74 L96 86 L82 74 L70 88 Z" fill="${c.hair}" ${OUT}/>`},
    {id:"hf4",name:"アホ毛",lock:"gacha",draw:c=>`<path d="M50 96 C48 55 72 36 100 36 C128 36 152 55 150 96 L140 80 L128 90 L118 76 L106 88 L94 76 L82 88 L72 76 L60 90 Z" fill="${c.hair}" ${OUT}/>`+line("M100 38 C94 16 116 10 112 26",4,c.hair)}
  ],
  hairB:[
    {id:"hb0",name:"なし",draw:()=>""},
    {id:"hb1",name:"ショート",draw:c=>`<ellipse cx="100" cy="94" rx="58" ry="60" fill="${avShade(c.hair,-.12)}" ${OUT}/>`},
    {id:"hb2",name:"ロング",sway:1,draw:c=>`<path d="M44 92 C40 38 160 38 156 92 L164 204 C140 218 60 218 36 204 Z" fill="${avShade(c.hair,-.12)}" ${OUT}/>`},
    {id:"hb3",name:"ツイン",sway:1,draw:c=>`<ellipse cx="100" cy="94" rx="58" ry="60" fill="${avShade(c.hair,-.12)}" ${OUT}/><path d="M46 84 C16 96 14 160 28 196 C40 162 44 132 54 108Z" fill="${avShade(c.hair,-.12)}" ${OUT}/><path d="M154 84 C184 96 186 160 172 196 C160 162 156 132 146 108Z" fill="${avShade(c.hair,-.12)}" ${OUT}/>`},
    {id:"hb4",name:"ポニー",sway:1,draw:c=>`<ellipse cx="100" cy="94" rx="58" ry="60" fill="${avShade(c.hair,-.12)}" ${OUT}/><path d="M140 58 C180 58 188 124 170 176 C162 134 152 100 130 80Z" fill="${avShade(c.hair,-.12)}" ${OUT}/>`}
  ],
  cloth:[
    {id:"c1",name:"Tシャツ",draw:c=>`<path d="M34 240 C36 196 58 176 100 172 C142 176 164 196 166 240 Z" fill="${c.cloth}" ${OUT}/><path d="M86 172 Q100 188 114 172 Z" fill="${c.skin}" ${OUT}/>`},
    {id:"c2",name:"パーカー",draw:c=>`<path d="M34 240 C36 196 58 176 100 172 C142 176 164 196 166 240 Z" fill="${c.cloth}" ${OUT}/><path d="M68 178 Q100 150 132 178 Q100 196 68 178Z" fill="${avShade(c.cloth,-.15)}" ${OUT}/>`+line("M94 188 L94 210",2,"#fff")+line("M106 188 L106 210",2,"#fff")},
    {id:"c3",name:"セーラー",draw:c=>`<path d="M34 240 C36 196 58 176 100 172 C142 176 164 196 166 240 Z" fill="${c.cloth}" ${OUT}/><path d="M60 182 L100 216 L140 182 L128 176 L100 200 L72 176Z" fill="#fff" ${OUT}/><path d="M90 208 L100 214 L110 208 L110 220 L100 214 L90 220Z" fill="#e2586e" ${OUT}/>`},
    {id:"c4",name:"ほし",lock:"gacha",draw:c=>`<path d="M34 240 C36 196 58 176 100 172 C142 176 164 196 166 240 Z" fill="${c.cloth}" ${OUT}/><path d="M86 172 Q100 188 114 172 Z" fill="${c.skin}" ${OUT}/>`+[[70,212],[130,206],[100,226]].map(([x,y])=>`<path d="M${x} ${y-7} L${x+2} ${y-2} L${x+7} ${y-2} L${x+3} ${y+1} L${x+5} ${y+6} L${x} ${y+3} L${x-5} ${y+6} L${x-3} ${y+1} L${x-7} ${y-2} L${x-2} ${y-2}Z" fill="#fff"/>`).join("")},
    {id:"c5",name:"ネクタイ",lock:"rank",draw:c=>`<path d="M34 240 C36 196 58 176 100 172 C142 176 164 196 166 240 Z" fill="${c.cloth}" ${OUT}/><path d="M84 172 L100 186 L116 172 Z" fill="#fff" ${OUT}/><path d="M96 186 L104 186 L108 226 L100 234 L92 226Z" fill="#e2586e" ${OUT}/>`}
  ],
  acc:[
    {id:"a0",name:"なし",draw:()=>""},
    {id:"a1",name:"メガネ",depth:5,draw:c=>`<circle cx="80" cy="102" r="12" fill="rgba(255,255,255,.18)" stroke="${c.acc}" stroke-width="2.6"/><circle cx="120" cy="102" r="12" fill="rgba(255,255,255,.18)" stroke="${c.acc}" stroke-width="2.6"/>`+line("M92 101 L108 101",2.4,c.acc)},
    {id:"a2",name:"リボン",depth:2,draw:c=>`<path d="M136 52 L118 40 L120 64Z M136 52 L154 40 L152 64Z" fill="${c.acc}" ${OUT}/><circle cx="136" cy="52" r="5" fill="${avShade(c.acc,-.15)}" ${OUT}/>`},
    {id:"a3",name:"ねこみみ",lock:"gacha",depth:1,draw:c=>`<path d="M58 62 L64 24 L88 46Z M142 62 L136 24 L112 46Z" fill="${c.hair}" ${OUT}/><path d="M64 54 L67 34 L80 46Z M136 54 L133 34 L120 46Z" fill="#ffc2d6"/>`},
    {id:"a4",name:"王冠",lock:"rank",depth:1,draw:c=>`<path d="M72 44 L76 20 L88 34 L100 16 L112 34 L124 20 L128 44Z" fill="#ffd166" ${OUT}/><circle cx="100" cy="30" r="3.4" fill="#e2586e"/>`},
    {id:"a5",name:"お花",lock:"gacha",depth:2,draw:c=>[0,72,144,216,288].map(a=>{const r=a*Math.PI/180;return `<circle cx="${(62+Math.cos(r)*7).toFixed(1)}" cy="${(54+Math.sin(r)*7).toFixed(1)}" r="6" fill="${c.acc}" ${OUT}/>`}).join("")+`<circle cx="62" cy="54" r="4" fill="#ffd166"/>`}
  ],
  bg:[
    {id:"g1",name:"むじ",draw:c=>`<rect width="200" height="240" rx="28" fill="${c.bg}"/>`},
    {id:"g2",name:"ドット",draw:c=>`<rect width="200" height="240" rx="28" fill="${c.bg}"/>`+[...Array(16)].map((_,i)=>`<circle cx="${20+(i%4)*52+(Math.floor(i/4)%2)*26}" cy="${24+Math.floor(i/4)*60}" r="6" fill="#fff" opacity=".55"/>`).join("")},
    {id:"g3",name:"ほしぞら",lock:"gacha",draw:c=>`<rect width="200" height="240" rx="28" fill="#2a3350"/>`+[[24,30],[70,18],[170,40],[150,90],[30,120],[180,150],[60,70]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2" fill="#fff4b0"/>`).join("")},
    {id:"g4",name:"しましま",draw:c=>`<rect width="200" height="240" rx="28" fill="${c.bg}"/>`+[...Array(6)].map((_,i)=>`<rect x="${i*36}" width="18" height="240" fill="#fff" opacity=".35"/>`).join("")}
  ]
};
const AV_CATS=[
  {cat:"hairF",label:"前髪",color:"hair"},{cat:"hairB",label:"後ろ髪",color:"hair"},{cat:"face",label:"顔",color:"skin"},
  {cat:"eyes",label:"目",color:"eye"},{cat:"brows",label:"まゆ",color:"hair"},{cat:"mouth",label:"口"},
  {cat:"cloth",label:"服",color:"cloth"},{cat:"acc",label:"アクセ",color:"acc"},{cat:"bg",label:"背景",color:"bg"}
];
const AV_DEFAULT={v:1,parts:{face:"f1",eyes:"e1",brows:"w1",mouth:"m1",hairF:"hf1",hairB:"hb1",cloth:"c1",acc:"a0",bg:"g1"},
  colors:{skin:AV_PAL.skin[0],hair:AV_PAL.hair[1],eye:AV_PAL.eye[0],cloth:AV_PAL.cloth[0],acc:AV_PAL.acc[0],bg:AV_PAL.bg[0]}};
/* 表情：目・まゆ・口の状態と、動きのくせ */
const AV_EXPR={
  normal:{eyes:"open",brows:"normal",mouth:"close"},
  happy:{eyes:"happy",brows:"up",mouth:"smile",bounce:1},
  joy:{eyes:"happy",brows:"up",mouth:"open",bounce:2},
  sad:{eyes:"sad",brows:"sad",mouth:"sad",droop:1},
  surprise:{eyes:"wide",brows:"up",mouth:"o",bounce:1},
  think:{eyes:"half",brows:"normal",mouth:"close",tilt:7}
};
/* ゲームの合図 → 表情（あとで自由に変える） */
const AV_LINK={
  judge:{excellent:"happy",great:"happy",good:"normal",mini:"normal",miss:"sad",forgot:"surprise"},
  sentence:{perfect:"joy"},
  challenge:{best:"joy",done:"happy"}
};

/* ---------- データの確認（他の人のデータも表示するので、必ず通す） ---------- */
const avPart=(cat,id)=>AV_PARTS[cat].find(p=>p.id===id)||AV_PARTS[cat].find(p=>p.id===AV_DEFAULT.parts[cat]);
function normAvatar(a){
  const out={v:1,parts:{},colors:{}};a=a&&typeof a==="object"?a:{};
  for(const cat in AV_DEFAULT.parts){const id=a.parts&&a.parts[cat];out.parts[cat]=AV_PARTS[cat].some(p=>p.id===id)?id:AV_DEFAULT.parts[cat]}
  for(const k in AV_DEFAULT.colors){const v=a.colors&&a.colors[k];out.colors[k]=typeof v==="string"&&/^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():AV_DEFAULT.colors[k]}
  return out;
}
/* ---------- 持っているパーツ・保存したアバター（この端末） ---------- */
const AVOWNKEY="ccs-parts-owned",AVSAVEKEY="ccs-avatars",AV_SAVE_MAX=50;
function avOwned(){try{return new Set(JSON.parse(localStorage.getItem(AVOWNKEY)||"[]"))}catch(e){return new Set()}}
function avHas(p){return !p.lock||avOwned().has(p.id)}
function avLoadSaved(){try{return JSON.parse(localStorage.getItem(AVSAVEKEY)||"[]")}catch(e){return []}}
function avWriteSaved(l){try{localStorage.setItem(AVSAVEKEY,JSON.stringify(l));return true}catch(e){return false}}

/* ---------- 描く ---------- */
let avUid=0;
function avPartSVG(cat,a,state){
  const p=avPart(cat,a.parts[cat]);
  if(p.img){const st=state||"base";return `<image href="img/avatar/${cat}_${p.id}_${st}.png" x="0" y="0" width="${AV_W}" height="${AV_H}"/>`}
  if(p.states){const f=p.states[state]||p.states[Object.keys(p.states)[0]];return f(a.colors)}
  return p.draw(a.colors);
}
function avStaticSVG(a,size,expr){
  a=normAvatar(a);const e=AV_EXPR[expr||"normal"]||AV_EXPR.normal,s=size||80;
  return `<svg viewBox="0 0 ${AV_W} ${AV_H}" width="${s*AV_W/AV_H}" height="${s}" aria-hidden="true" style="display:block">${avPartSVG("bg",a)}${avPartSVG("hairB",a)}`
    +`<rect x="89" y="138" width="22" height="26" rx="6" fill="${a.colors.skin}"/>${avPartSVG("cloth",a)}${avPartSVG("face",a)}`
    +`${avPartSVG("eyes",a,e.eyes)}${avPartSVG("brows",a,e.brows)}${avPartSVG("mouth",a,e.mouth)}${avPartSVG("hairF",a)}${avPartSVG("acc",a)}</svg>`;
}

/* ---------- 動く表示 ---------- */
const AV_LIVE=new Set();
const avReduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
function avMount(el,a,opt){
  opt=opt||{};a=normAvatar(a);
  const id="av"+(++avUid),s=opt.size||200;
  el.innerHTML=`<svg viewBox="0 0 ${AV_W} ${AV_H}" width="${s*AV_W/AV_H}" height="${s}" role="img" aria-label="アバター" style="display:block;overflow:visible">
    <g data-l="bg">${avPartSVG("bg",a)}</g>
    <g data-l="root"><g data-l="hb">${avPartSVG("hairB",a)}</g>
      <rect x="89" y="138" width="22" height="26" rx="6" fill="${a.colors.skin}"/>
      <g data-l="cloth">${avPartSVG("cloth",a)}</g>
      <g data-l="head"><g data-l="face">${avPartSVG("face",a)}</g>
        <g data-l="eyes"></g><g data-l="brows"></g><g data-l="mouth"></g>
        <g data-l="hf">${avPartSVG("hairF",a)}</g><g data-l="acc">${avPartSVG("acc",a)}</g></g></g></svg>`;
  const g={};el.querySelectorAll("[data-l]").forEach(n=>g[n.dataset.l]=n);
  const inst={el,a,g,id,t:0,expr:"normal",exprUntil:0,cur:{},blinkAt:performance.now()+1500+Math.random()*2500,blinkT:-1,
    tilt:0,tiltTo:0,turn:0,turnTo:0,lag:0,nextLook:0,bounce:0,last:performance.now(),live:opt.live!==false};
  avSetFaceState(inst);
  if(inst.live){AV_LIVE.add(inst);avLoop()}
  if(opt.tapReact)el.addEventListener("click",()=>avReact(inst,["happy","joy","surprise"][Math.floor(Math.random()*3)]));
  return inst;
}
function avSetFaceState(inst,blink){
  const e=AV_EXPR[inst.expr]||AV_EXPR.normal,eyes=blink&&e.eyes==="open"?blink:e.eyes;
  const want={eyes,brows:e.brows,mouth:e.mouth};
  for(const k in want)if(inst.cur[k]!==want[k]){inst.cur[k]=want[k];inst.g[k].innerHTML=avPartSVG(k,inst.a,want[k])}
}
function avReact(inst,kind,ms){
  if(!AV_EXPR[kind])return;inst.expr=kind;inst.exprUntil=performance.now()+(ms||1400);
  const e=AV_EXPR[kind];if(e.bounce)inst.bounce=e.bounce;if(e.tilt)inst.tiltTo=e.tilt*(Math.random()<.5?-1:1);
  avSetFaceState(inst);
}
let avRAF=0;
function avLoop(){
  if(avRAF)return;
  const tick=now=>{
    avRAF=0;
    for(const inst of AV_LIVE){
      if(!inst.el.isConnected){AV_LIVE.delete(inst);continue}
      const dt=Math.min(50,now-inst.last);inst.last=now;inst.t+=dt/1000;
      if(inst.expr!=="normal"&&now>inst.exprUntil){inst.expr="normal";avSetFaceState(inst)}
      // まばたき
      if(inst.blinkT<0&&now>inst.blinkAt&&(AV_EXPR[inst.expr]||{}).eyes==="open")inst.blinkT=0;
      if(inst.blinkT>=0){inst.blinkT+=dt;const b=inst.blinkT;
        avSetFaceState(inst,b<50?"half":b<120?"closed":b<170?"half":null);
        if(b>=170){inst.blinkT=-1;inst.blinkAt=now+2200+Math.random()*3800;avSetFaceState(inst)}}
      if(avReduce){continue}
      // ときどき、よそ見・首かしげ
      if(now>inst.nextLook){inst.nextLook=now+2600+Math.random()*3400;inst.turnTo=(Math.random()*2-1)*.7;if(inst.expr==="normal")inst.tiltTo=(Math.random()*2-1)*4}
      const k=Math.min(1,dt/260);inst.turn+=(inst.turnTo-inst.turn)*k;inst.tilt+=(inst.tiltTo-inst.tilt)*k;
      inst.lag+=(inst.tilt-inst.lag)*Math.min(1,dt/420);
      inst.bounce=Math.max(0,inst.bounce-dt/450);
      const e=AV_EXPR[inst.expr]||{},breath=Math.sin(inst.t*2*Math.PI/3.4)*1.6,hop=-Math.abs(Math.sin(inst.t*14))*inst.bounce*5,droop=e.droop?4:0;
      const [nx,ny]=AV_NECK,tl=inst.tilt,tr=inst.turn;
      inst.g.root.setAttribute("transform",`translate(0 ${(breath+hop+droop).toFixed(2)})`);
      inst.g.head.setAttribute("transform",`rotate(${tl.toFixed(2)} ${nx} ${ny})`);
      inst.g.hb.setAttribute("transform",`rotate(${tl.toFixed(2)} ${nx} ${ny}) translate(${(-tr*3).toFixed(2)} 0)`+(avPart("hairB",inst.a.parts.hairB).sway?` rotate(${((inst.lag-tl)*1.4).toFixed(2)} 100 70)`:""));
      inst.g.face.setAttribute("transform",`translate(${(tr*1.5).toFixed(2)} 0)`);
      ["eyes","brows"].forEach(l=>inst.g[l].setAttribute("transform",`translate(${(tr*5).toFixed(2)} 0)`));
      inst.g.mouth.setAttribute("transform",`translate(${(tr*4).toFixed(2)} 0)`);
      inst.g.hf.setAttribute("transform",`translate(${(tr*3).toFixed(2)} 0) rotate(${((inst.lag-tl)*.9).toFixed(2)} 100 40)`);
      inst.g.acc.setAttribute("transform",`translate(${(tr*(avPart("acc",inst.a.parts.acc).depth||2)).toFixed(2)} 0)`);
    }
    if(AV_LIVE.size&&!document.hidden)avRAF=requestAnimationFrame(tick);
  };
  avRAF=requestAnimationFrame(tick);
}
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&AV_LIVE.size){AV_LIVE.forEach(i=>i.last=performance.now());avLoop()}});

/* ---------- 外から使う入口 ---------- */
window.AvatarAPI={
  svg:(a,o)=>avStaticSVG(a,(o&&o.size)||40,o&&o.expr),
  mount:avMount,
  react:(kind,ms)=>AV_LIVE.forEach(i=>avReact(i,kind,ms)),
  current:()=>normAvatar(settings.avatar),
  grantPart:id=>{const o=avOwned();o.add(id);try{localStorage.setItem(AVOWNKEY,JSON.stringify([...o]))}catch(e){}},
  addSaved:(a,from,name)=>{const l=avLoadSaved();if(l.length>=AV_SAVE_MAX)return false;l.unshift({id:"a"+Date.now(),name:name||"アバター",av:normAvatar(a),from:from||"make",at:Date.now()});return avWriteSaved(l)},
  parts:AV_PARTS,link:AV_LINK
};
/* ゲームの合図を受け取る（表示中のアバターがあれば反応。ゲーム画面に出すのはあとで） */
document.addEventListener("cc:judge",e=>{const k=AV_LINK.judge[e.detail&&e.detail.kind];if(k)AvatarAPI.react(k)});
document.addEventListener("cc:sentence",e=>{if(e.detail&&e.detail.perfect)AvatarAPI.react(AV_LINK.sentence.perfect,1800)});
document.addEventListener("cc:challenge",e=>AvatarAPI.react(e.detail&&e.detail.best?AV_LINK.challenge.best:AV_LINK.challenge.done,2200));

/* ============ マイページ ============ */
(()=>{const st=document.createElement("style");st.textContent=`
.mpView{position:fixed;inset:0;z-index:68;overflow-y:auto;background:linear-gradient(180deg,#bfe0fb 0%,#f3e6f5 55%,#fde3ee 100%);color:#4a3b5c;font-family:var(--jp)}
.mpIn{max-width:460px;margin:0 auto;padding:12px 16px 28px;display:flex;flex-direction:column;gap:12px}
.mpTop{display:flex;align-items:center;gap:10px}
.mpTop b{flex:1;font-family:var(--disp);font-weight:400;font-size:20px}
.mpBtn{border:0;border-radius:999px;background:rgba(255,255,255,.8);color:#5a4470;font-weight:800;font-size:13px;padding:8px 14px}
.mpBtn.pri{background:#ff9ec4;color:#fff;box-shadow:0 3px 0 #e07aa6}
.mpBtn.b{background:#8cc8ff;color:#fff;box-shadow:0 3px 0 #5ea6e6}
.mpBtn:disabled{opacity:.45}
.mpCard{background:rgba(255,255,255,.88);border-radius:22px;padding:12px 14px;box-shadow:0 4px 0 rgba(160,130,190,.25);display:flex;flex-direction:column;gap:8px}
.mpCard h3{margin:0;font-size:13px;color:#8a7a9c}
.mpHero{display:flex;justify-content:center;padding:6px 0;cursor:pointer}
.mpRow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.mpRow input,.mpRow select{flex:1;min-width:0;border:1px solid #e3d6ee;border-radius:10px;padding:8px;font:inherit;color:#4a3b5c;background:#fff}
.mpStat{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mpStat div{background:#fbf6ff;border-radius:14px;padding:8px;text-align:center}
.mpStat small{display:block;font-size:11px;color:#8a7a9c;font-weight:700}
.mpStat b{font-family:var(--en);font-size:20px}
.mpTabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}
.mpTabs button{flex:none;border:0;border-radius:999px;padding:6px 12px;font-weight:800;font-size:12px;background:#f1ebf7;color:#8a7a9c}
.mpTabs button.on{background:#ff9ec4;color:#fff}
.mpGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px}
.mpItem{position:relative;border:2px solid transparent;border-radius:14px;background:#fbf6ff;padding:4px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;font-weight:700;color:#5a4470}
.mpItem.on{border-color:#ff9ec4}
.mpItem.lock{opacity:.5}
.mpItem .lk{position:absolute;top:4px;right:6px;font-size:10px}
.mpSw{display:flex;gap:6px;flex-wrap:wrap}
.mpSw button{width:28px;height:28px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #e3d6ee}
.mpSw button.on{box-shadow:0 0 0 3px #ff9ec4}
.mpSaved{display:flex;flex-direction:column;gap:6px}
.mpSv{display:flex;gap:10px;align-items:center;background:#fbf6ff;border-radius:14px;padding:6px 8px}
.mpSv span{flex:1;min-width:0;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpSv small{display:block;font-size:10px;color:#8a7a9c;font-weight:700}
.mpSv .mpBtn{padding:6px 10px;font-size:12px}
.mpMini{display:inline-flex;vertical-align:middle;border-radius:8px;overflow:hidden;flex:none}
.tCard.mpEntry{flex-direction:row;align-items:center;gap:12px;cursor:pointer;border:0;text-align:left;font:inherit;color:inherit}
.mpEntry .nm{font-weight:800;font-size:17px;color:#5a4470}
.mpEntry small{display:block;font-size:12px;font-weight:700;color:#8a7a9c}
`;document.head.appendChild(st)})();

const mp=document.createElement("div");mp.className="mpView";mp.id="mpView";mp.hidden=true;document.body.appendChild(mp);
let MP={view:"home",edit:null,cat:"hairF",slot:null};
function mpOpen(){$("title").hidden=true;mp.hidden=false;MP={view:"home",edit:null,cat:"hairF",slot:null};mpRender()}
function mpClose(){mp.hidden=true;mp.innerHTML="";showTitle()}
function avName(){return settings.nick||"（名前なし）"}
async function mpSyncRank(){   // ランキングの名前とアバターも合わせる（記録がある人だけ）
  if(!DB||!MYID)return;
  try{const ref=DB.doc("ranks/"+MYID),s=await ref.get();if(s.exists)await ref.set({...s.data(),nick:settings.nick||s.data().nick,avatar:normAvatar(settings.avatar),at:Date.now()})}catch(e){}
}
function mpRender(){
  if(MP.view==="edit")return mpRenderEdit();
  const a=normAvatar(settings.avatar),bt=(settings.bestTimed&&settings.bestTimed.all)||{},saved=avLoadSaved();
  mp.innerHTML=`<div class="mpIn">
    <div class="mpTop"><button class="mpBtn" id="mpBack">← もどる</button><b>マイページ</b></div>
    <div class="mpCard"><div class="mpHero" id="mpHero" title="タップすると反応するよ"></div>
      <div class="mpRow"><button class="mpBtn pri" id="mpEdit" style="flex:1">アバターを着がえる</button></div></div>
    <div class="mpCard"><h3>名前（ランキングに出る名前）</h3>
      <div class="mpRow"><input type="text" id="mpNick" maxlength="12" value="${esc(settings.nick||"")}" placeholder="ニックネーム（12文字まで）"><button class="mpBtn b" id="mpNickOk">決める</button></div></div>
    <div class="mpCard"><h3>チャレンジの自己ベスト（この端末）</h3>
      <div class="mpStat"><div><small>30秒</small><b>${bt[30]||0}</b> pt</div><div><small>1分</small><b>${bt[60]||0}</b> pt</div></div>
      <div class="mpRow"><button class="mpBtn" id="mpRank" style="flex:1">ランキングを見る</button></div></div>
    <div class="mpCard"><h3>自分のランク</h3>
      <div class="mpRow"><select id="mpLv">${[["0","未登録"],...LV.slice(1).map((_,i)=>[String(i+1),lvLabel(i+1)])].map(([v,l])=>`<option value="${v}" ${String(settings.myLevel||0)===v?"selected":""}>${esc(l)}</option>`).join("")}</select></div></div>
    <div class="mpCard"><h3>保存したアバター（${saved.length} / ${AV_SAVE_MAX}）</h3>
      <div class="mpSaved">${saved.length?saved.map((s,i)=>`<div class="mpSv"><span class="mpMini">${avStaticSVG(s.av,52)}</span><span>${esc(s.name)}<small>${s.from==="gacha"?"ガチャ":"自分で作った"}・${new Date(s.at).toLocaleDateString()}</small></span>
        <button class="mpBtn b" data-use="${i}">使う</button><button class="mpBtn" data-ed="${i}">着がえ</button><button class="mpBtn" data-del="${i}">消す</button></div>`).join(""):`<small style="color:#8a7a9c">まだありません。「アバターを着がえる」で作って保存できます。</small>`}</div></div>
  </div>`;
  avMount($("mpHero"),a,{size:220,tapReact:true});
  $("mpBack").onclick=mpClose;
  $("mpEdit").onclick=()=>{MP.view="edit";MP.edit=normAvatar(settings.avatar);MP.slot=null;mpRender()};
  $("mpNickOk").onclick=async()=>{const n=cleanNick($("mpNick").value);if(!n){$("mpNick").focus();return}settings.nick=n;saveSettings();toast("名前を決めました");mpSyncRank()};
  $("mpRank").onclick=()=>showRanking(30);
  $("mpLv").onchange=e=>{settings.myLevel=+e.target.value;settings.lvUp=settings.lvDown=0;saveSettings()};
  mp.querySelectorAll("[data-use]").forEach(b=>b.onclick=()=>{const s=avLoadSaved()[+b.dataset.use];settings.avatar=normAvatar(s.av);saveSettings();toast("このアバターにしました");mpSyncRank();mpRender()});
  mp.querySelectorAll("[data-ed]").forEach(b=>b.onclick=()=>{const s=avLoadSaved()[+b.dataset.ed];MP.view="edit";MP.edit=normAvatar(s.av);MP.slot=s.id;mpRender()});
  mp.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{const l=avLoadSaved(),s=l[+b.dataset.del];
    if(!(await ask(`「${s.name}」を消しますか？\n消したアバターは元に戻せません。`,"消す")))return;
    l.splice(+b.dataset.del,1);avWriteSaved(l);mpRender()});
}
function mpRenderEdit(){
  const a=MP.edit,cat=AV_CATS.find(c=>c.cat===MP.cat)||AV_CATS[0],owned=avOwned();
  const slot=MP.slot&&avLoadSaved().find(s=>s.id===MP.slot);
  mp.innerHTML=`<div class="mpIn">
    <div class="mpTop"><button class="mpBtn" id="mpCancel">← やめる</button><b>着がえ</b><button class="mpBtn" id="mpRand">おまかせ</button></div>
    <div class="mpCard"><div class="mpHero" id="mpHero"></div></div>
    <div class="mpTabs">${AV_CATS.map(c=>`<button data-cat="${c.cat}" class="${c.cat===cat.cat?"on":""}">${c.label}</button>`).join("")}</div>
    <div class="mpCard">
      <div class="mpGrid">${AV_PARTS[cat.cat].map(p=>{const has=!p.lock||owned.has(p.id),on=a.parts[cat.cat]===p.id;
        const pv=normAvatar({...a,parts:{...a.parts,[cat.cat]:p.id}});
        return `<button class="mpItem${on?" on":""}${has?"":" lock"}" data-part="${p.id}" ${has?"":"disabled"}>${has?"":`<span class="lk">🔒</span>`}${avStaticSVG(pv,64)}${esc(p.name)}${has?"":`<small style="font-size:9px">${p.lock==="rank"?"ランキングで":"ガチャで"}手に入る</small>`}</button>`}).join("")}</div>
      ${cat.color?`<h3>色</h3><div class="mpSw">${AV_PAL[cat.color].map(c=>`<button data-col="${c}" class="${a.colors[cat.color]===c?"on":""}" style="background:${c}" aria-label="${c}"></button>`).join("")}</div>`:""}
    </div>
    <div class="mpCard"><h3>名前をつけて保存</h3>
      <div class="mpRow"><input type="text" id="mpAvName" maxlength="16" value="${esc(slot?slot.name:"")}" placeholder="例：いつもの私"></div>
      <div class="mpRow"><button class="mpBtn pri" id="mpUse" style="flex:1">保存して使う</button><button class="mpBtn" id="mpKeep" style="flex:1">保存だけ</button></div></div>
  </div>`;
  const inst=avMount($("mpHero"),a,{size:220,tapReact:true});
  $("mpCancel").onclick=()=>{MP.view="home";mpRender()};
  mp.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{MP.cat=b.dataset.cat;mpRenderEdit()});
  mp.querySelectorAll("[data-part]").forEach(b=>b.onclick=()=>{a.parts[cat.cat]=b.dataset.part;mpRenderEdit();AvatarAPI.react("happy",900)});
  mp.querySelectorAll("[data-col]").forEach(b=>b.onclick=()=>{a.colors[cat.color]=b.dataset.col;mpRenderEdit()});
  $("mpRand").onclick=()=>{for(const c in AV_PARTS){const ok=AV_PARTS[c].filter(p=>!p.lock||owned.has(p.id));a.parts[c]=ok[Math.floor(Math.random()*ok.length)].id}
    for(const k in AV_PAL)a.colors[k]=AV_PAL[k][Math.floor(Math.random()*AV_PAL[k].length)];mpRenderEdit();AvatarAPI.react("joy",1200)};
  const saveTo=use=>{
    const name=($("mpAvName").value||"").replace(/[<>]/g,"").trim().slice(0,16)||"アバター",l=avLoadSaved(),av=normAvatar(a);
    const i=MP.slot?l.findIndex(s=>s.id===MP.slot):-1;
    if(i>=0){l[i]={...l[i],name,av,at:Date.now()}}
    else{if(l.length>=AV_SAVE_MAX){tell(`保存できるのは${AV_SAVE_MAX}体までです。いらないアバターを消してください。`);return}
      l.unshift({id:"a"+Date.now(),name,av,from:"make",at:Date.now()})}
    if(!avWriteSaved(l)){tell("保存できませんでした。この画面ではブラウザへの保存が使えないようです。");return}
    if(use){settings.avatar=av;saveSettings();mpSyncRank()}
    toast(use?"保存して、このアバターにしました":"保存しました");MP.view="home";mpRender()};
  $("mpUse").onclick=()=>saveTo(true);$("mpKeep").onclick=()=>saveTo(false);
}
/* ---------- 入口：タイトルのマイページ ---------- */
(()=>{
  const gm=document.querySelector(".faceGame .gMenu");
  if(gm){const b=document.createElement("button");b.className="tCard mpEntry";b.dataset.mypage="1";
    b.innerHTML=`<span class="mpMini" id="mpTitleAv"></span><span><span class="nm" id="mpTitleName"></span><small>マイページ（名前・アバター・記録）</small></span>`;gm.prepend(b)}
  const sm=document.querySelector(".faceStudy .sMenu");
  if(sm){const b=document.createElement("button");b.dataset.mypage="1";b.innerHTML=`<b>My Page</b><small>名前・アバター・記録</small><i>→</i>`;sm.prepend(b)}
  document.querySelectorAll("[data-mypage]").forEach(b=>b.onclick=mpOpen);
})();
function mpTitleRefresh(){const av=$("mpTitleAv"),nm=$("mpTitleName");if(av)av.innerHTML=avStaticSVG(settings.avatar,56);if(nm)nm.textContent=avName()}
{const f=showTitle;showTitle=function(...x){const r=f(...x);$("mpView")&&($("mpView").hidden=true);mpTitleRefresh();return r}}
mpTitleRefresh();
