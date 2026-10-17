import { pp } from './engine.js';
import { VX } from './vocab.js';
// ================= CEFR-J A1 additions (meanings, forms and usage added for the game) =================
// Source list: The CEFR-J Wordlist Version 1.6. Compiled by Yukio Tono, Tokyo University of Foreign Studies.
export let A1_VERBS;
export let A1_ADJ;
export let A1_FREQADV;
export let A1_TIMES;
// people: en=ja (my … = family, takes the subject's point of view)
export let A1_PEOPLE;
export let A1_PLACES;
// things: tag|word=和訳 (same marks as before; @ = body part, takes my/his/her …)
export let A1_NOUNS;
export let A1_ICON;
export function buildA1(){
 const L={things:[],people:[],verbs:[],states:[],places:[],times:[]}; const FQ={}; const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
 A1_VERBS.split('\n').forEach(line=>{ const [b,pa,pp,ja,jt,fr,tags]=line.split('|'); const id='c1_'+slug(b); const v={id,en:b,ja,jt,fr,e:'✨',an:fr==='intr'?'bob':'reach',cefr:1}; if(pa) v.past=pa; if(pp) v.pp=pp; if(tags) v.t=tags.split(','); if(b==='sit'){ v.an='sit'; v.e='🪑'; } if(b==='speak'){ v.e='🗣️'; v.an='talk'; } if(b==='become'){ v.hidden=1; } if(b==='want'){ v.jaAdj=1; v.jaAdjT='i'; v.part='が'; v.stative=1; v.e='🙏'; v.nopass=1; } L.verbs.push(v); FQ[id]=100; });
 A1_ADJ.split(',').forEach(it=>{ let [w,rest]=it.split('='); const more=w.includes('*'); w=w.replace('*',''); const clean=w.replace(/[0-9]+$/,''); const parts=rest.split(':'); const ja=parts[0]; let jt=parts[1]; const id='c1_'+slug(w); const s={id,en:clean,ja,jt,e:'💫',cefr:1}; if(jt==='v'){ s.vt=parts[2]; } if(jt==='ar'){ s.jt='raw'; s.ja=ja; } if(more) s.more=1; else { const b=clean; s.comp=/e$/.test(b)?b+'r':/[^aeiou]y$/.test(b)?b.slice(0,-1)+'ier':/[^aeiou][aeiou][^aeiouwy]$/.test(b)&&b.length<=4?b+b.slice(-1)+'er':b+'er'; s.sup=s.comp.replace(/er$/,'est'); } if(['OK','all right','true','false','real','ideal','correct','broken','awake','afraid','fair'].includes(clean)){ delete s.comp; delete s.sup; s.nocmp=1; } if(['black','blue','brown','gray','green','orange','pink','red','white','yellow','purple'].includes(clean)) s.e='🎨'; if(['sunny','cloudy','rainy','snowy','foggy','windy'].includes(clean)) s.weather=1; L.states.push(s); FQ[id]=100; });
 A1_TIMES.split(/,(?=[^,|]*=)/).forEach(it=>{ const [w,rest]=it.split('='); const [ja,ts]=rest.split('|'); const id='c1_'+slug(w); L.times.push({id,en:w,ja,e:'📅',ts:ts.split(','),sky:null,cefr:1}); FQ[id]=100; });
 A1_PEOPLE.split(',').forEach(it=>{ let [w,rest]=it.split('='); let [ja,kind]=rest.split(':'); let pl=false; if(w[0]==='+'){ pl=true; w=w.slice(1);} const id='c1_'+slug(w); const p={id,en:w,ja,e:kind==='animal'?'🐾':'🧑',p:3,pl:pl?1:0,cefr:1}; if(kind==='animal') p.animal=1; L.people.push(p); FQ[id]=100; });
 A1_PLACES.split(',').forEach(it=>{ const [w,ja]=it.split('='); const en=w.replace(/[0-9]+$/,''); const id='c1_'+slug(w); const to=/^(in|at|on) /.test(en)? en.replace(/^(in|at|on) /,'to ').replace(/^to (church|college|town)$/,'to $1') : en; const jn=ja.replace(/で$/,''); L.places.push({id,en,to,ja,jat:jn+'へ',jn,e:'📍',cefr:1}); FQ[id]=100; });
 A1_NOUNS.split('\n').forEach(line=>{ const [tag,list]=line.split('|'); list.split(',').forEach(it=>{ let [w,ja]=it.split('='); let unc=false, body=false; if(w[0]==='~'){ unc=true; w=w.slice(1);} if(w[0]==='@'){ body=true; w=w.slice(1);} const id='c1_'+slug(w); const en = body? 'my '+w : (unc||/^the /.test(w))? w : (/^[aeiou]/i.test(w)&&!/^(uni|use)/i.test(w)?'an ':'a ')+w; const t=[tag]; if(tag==='body') t.push('wash'); if(['album','CD','DVD'].includes(w)) t.push('music','thing'); const n={id,en,ja,e:A1_ICON[tag]||'📦',t,cefr:1}; if(body) n.bpart=1; if(/s$/.test(w)&&['hands','legs','eyes','teeth'].includes(w)) n.pl=1; L.things.push(n); FQ[id]=100; }); });
 return {lex:L,FQ};
}
export let VA1;

// hidden helper verbs for "be"-like verbs (become / look / feel / get + adjective)
export let LINKV;
export let FREQADV;

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_vocab_a1(){
A1_VERBS = `add|||加える|i|tr|food,thing,word
become|became|become|なる|g|intr|
blow|blew|blown|吹く|g|intr|
brush|||みがく|g|tr|brush
color|||色をぬる|g|tr|draw
discuss|||話し合う|g|tr|event,abstract,word
focus|||集中する|s|intr|
grow|grew|grown|育てる|i|tr|plant
happen|||起こる|g|intr|
hurt|hurt|hurt|けがする|s|tr|body
mean|meant|meant|意味する|s|tr|word
phone|||電話する|s|tr|person
repeat|||くり返す|g|tr|word,thing
speak|spoke|spoken|話す|g|both|lang
welcome|||歓迎する|s|tr|person
sit|sat|sat|座る|g|intr|
want|||ほしい|i|tr|any`;
A1_ADJ = `black=黒い:i,blue=青い:i,brown=茶色い:i,gray=灰色:na,green=緑:na,orange2=オレンジ色:na,pink=ピンク:na,red=赤い:i,white=白い:i,yellow=黄色い:i,purple=むらさき:na,afraid*=こわがっている:raw,OK=大丈夫:na,all right=大丈夫:na,awake=起きている:raw,broken=こわれている:raw,cloudy=くもり:na,correct=正しい:i,exciting*=わくわくする:v:s,fair=公平:na,false=まちがい:na,foggy=霧が深い:i,fun*=楽しい:i,handsome=かっこいい:i,hard2=大変:na,high=高い:i,interested*=興味がある:ar,large=大きい:i,little=小さい:i,lovely*=すてき:na,poor=貧しい:i,rainy=雨:na,real=本物:na,snowy=雪:na,strange=変:na,strict=きびしい:i,successful*=成功している:raw,sunny=晴れ:na,super=最高:na,thick=厚い:i,tight=きつい:i,true=本当:na,ideal*=理想的:na,windy=風が強い:i,warm2=暖かい:i`;
A1_FREQADV = `always=いつも,usually=ふだん,often=よく,sometimes=ときどき,never=一度も,really=本当に,also=も,just=ちょうど`;
A1_TIMES = `later=あとで|pres,past,fut,on Monday=月曜日に|pres,past,fut,prog,pastprog,on Tuesday=火曜日に|pres,past,fut,prog,pastprog,on Wednesday=水曜日に|pres,past,fut,prog,pastprog,on Thursday=木曜日に|pres,past,fut,prog,pastprog,on Friday=金曜日に|pres,past,fut,prog,pastprog,on Saturday=土曜日に|pres,past,fut,prog,pastprog,on Sunday=日曜日に|pres,past,fut,prog,pastprog,in January=1月に|pres,past,fut,in February=2月に|pres,past,fut,in March=3月に|pres,past,fut,in April=4月に|pres,past,fut,in May=5月に|pres,past,fut,in June=6月に|pres,past,fut,in July=7月に|pres,past,fut,in August=8月に|pres,past,fut,in September=9月に|pres,past,fut,in October=10月に|pres,past,fut,in November=11月に|pres,past,fut,in December=12月に|pres,past,fut,in spring=春に|pres,past,fut,in summer=夏に|pres,past,fut,in autumn=秋に|pres,past,fut,in winter=冬に|pres,past,fut,on my birthday=誕生日に|pres,past,fut,on the weekend=週末に|pres,past,fut,prog`;
A1_PEOPLE = `my daughter=娘,my son=息子,my husband=夫,my wife=妻,my grandfather=祖父,my grandmother=祖母,+my parents=両親,my boyfriend=彼氏,my girlfriend=彼女,the actor=俳優,the engineer=エンジニア,the leader=リーダー,the musician=音楽家,the player=選手,the reporter=記者,the sailor=船乗り,the waitress=ウェイトレス,the worker=働く人,the writer=作家,the owner=持ち主,my partner=パートナー,the person=その人,the lady=女性,the guy=男の人,+people=人々,my pet=ペット:animal,the spy=スパイ`;
A1_PLACES = `at church=教会で,at the cinema=映画館で,on the farm=農場で,in the field=野原で,on the hill=丘の上で,on the island=島で,at the shop=店で,on the street=通りで,at the theater=劇場で,in town=町で,in the bedroom=寝室で,in the dining room=食堂で,at the bookstore=本屋で,at the factory=工場で,at college=大学で,in the hall=ホールで,at the palace=宮殿で,in the world=世界で,in my hometown=地元で,at the swimming pool=プールで,in the sky=空で,at the airport2=空港で`;
A1_NOUNS = `thing|album=アルバム,bell=ベル,board=板,bone=骨,brush=ブラシ,CD=CD,cloth=布,credit card=クレジットカード,file=ファイル,~money=お金,~jewelry=宝石,machine=機械,mobile phone=携帯電話,~paint=ペンキ,~paper=紙,poster=ポスター,ribbon=リボン,seat=席,shelf=棚,telephone=電話,tool=道具,vase=花びん,wheel=車輪,collection=コレクション,dollar=1ドル
wear|apron=エプロン
sport|bat=バット,~sports=スポーツ
food|bean=豆,biscuit=ビスケット,~cream=クリーム,~ice=氷,meal=食事,~food=食べ物
ride|bicycle=自転車,truck=トラック
music|DVD=DVD
watch|program=番組,~the sky=空,~the moon=月,~the sun=太陽,~the snow=雪,painting=絵,~the world=世界
read|~mail=郵便物,page=ページ,~information=情報
write|number=番号,sentence=文
lang|language=言語,~grammar=文法,subject=教科,~culture=文化
plant|~grass=草
clean|wall=壁
clock|~the time=時刻
event|birthday=誕生日,holiday=休日,celebration=お祝い,speech=スピーチ,~practice=練習,activity=活動,club=クラブ,conversation=会話
abstract|hobby=趣味,job=仕事,dream=夢,memory=思い出,~life=人生,~luck=運,~peace=平和,way=方法,rule=ルール,reason=理由,result=結果,example=例,~the weather=天気,~health=健康,~the future=未来,skill=技術,habit=習慣,feeling=気持ち,difference=ちがい,~time=時間,~fun=楽しいこと,~love=愛,~help=助け,~advice=アドバイス
body|@arm=腕,@ear=耳,@eyes=目,@hands=手,@head=頭,@legs=足,@mouth=口,@neck=首,@nose=鼻,@shoulder=肩,@teeth=歯,@knee=ひざ,@hair=髪,@face=顔,@body=体`;
A1_ICON = {thing:'📦',wear:'👕',sport:'🏅',food:'🍽️',ride:'🚗',music:'🎧',watch:'👀',read:'📖',write:'✏️',lang:'📘',plant:'🌱',clean:'🧹',event:'📅',abstract:'💭',body:'✋'};
VA1 = buildA1();
if(typeof VX!=='undefined'){ for(const k in VA1.lex){ VX.lex[k]=(VX.lex[k]||[]).concat(VA1.lex[k]); } Object.assign(VX.FQ,VA1.FQ); }
LINKV = {become:{en:'become',past:'became',pp:'become',ja:'なる',jt:'g',lab:'なる'},look:{en:'look',ja:'見える',jt:'i',lab:'見える'},feel:{en:'feel',past:'felt',pp:'felt',ja:'感じる',jt:'i',lab:'感じる'},get:{en:'get',past:'got',pp:'gotten',dbl:1,ja:'なる',jt:'g',lab:'なる'}};
FREQADV = A1_FREQADV.split(',').map(x=>{ const [en,ja]=x.split('='); return {id:en,en,ja}; });
}
