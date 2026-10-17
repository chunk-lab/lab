import { pp } from './engine.js';
import { VX } from './vocab.js';
import { FREQADV, LINKV } from './vocab_a1.js';
// ================= CEFR-J A2 additions =================
export let A2_VERBS;
export let A2_ADJ;
export let A2_FREQADV;
export let A2_MANNER;
export let A2_PLACES;
export let A2_TIMES;
export let A2_PEOPLE;
export let A2_ROLES;
export let A2_NOUNS;
export let A2_ICON;
export function buildA2(){
 const L={things:[],people:[],verbs:[],states:[],manners:[],places:[],times:[]}; const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
 A2_VERBS.split('\n').forEach(line=>{ const [b,pa,pp,ja,jt,fr,tags]=line.split('|'); const id='c2_'+slug(b); const v={id,en:b,ja,jt,fr,e:'✨',an:fr==='intr'?'bob':'reach',cefr:2}; if(pa) v.past=pa; if(pp) v.pp=pp; if(tags) v.t=tags.split(','); if(fr==='cl'){ v.stative=1; v.clj='ことに'; v.e='💡'; } if(['rain','snow'].includes(b)){ v.weather=1; v.e=b==='rain'?'🌧️':'❄️'; } if(b==='offer'||b==='hand') v.dt='to'; if(b==='fail') v.part='に'; L.verbs.push(v); });
 A2_ADJ.split(',').forEach(it=>{ let [w,rest]=it.split('='); const more=w.includes('*'); w=w.replace('*',''); const parts=rest.split(':'); let ja=parts[0], jt=parts[1]; const id='c2_'+slug(w); const s={id,en:w,ja,jt,e:'💫',cefr:2}; if(jt==='v') s.vt=parts[2]; if(jt==='ar') s.jt='raw'; if(more) s.more=1; else { const b=w; s.comp=/e$/.test(b)?b+'r':/[^aeiou]y$/.test(b)?b.slice(0,-1)+'ier':/[^aeiou][aeiou][^aeiouwy]$/.test(b)&&b.length<=4?b+b.slice(-1)+'er':b+'er'; s.sup=s.comp.replace(/er$/,'est'); } if(['alive','dead','married','single','asleep','raw','whole','missing','lost','electric','magic','golden','silver','wooden','impossible','possible','necessary','unknown','illegal','ancient'].includes(w)){ delete s.comp; delete s.sup; s.more=0; s.nocmp=1; } L.states.push(s); });
 A2_ROLES.split(',').forEach(it=>{ const [w,ja]=it.split('='); const id='c2_r_'+slug(w); const noun=w.replace(/^(a|an) /,''); const pl=noun==='businessman'?'businessmen':noun.replace(/y$/,'ies').replace(/([^aeiou])ies$/,'$1ies')+(/y$/.test(noun)?'':'s'); L.states.push({id,en:w,pl:(pl==='businessmans'?'businessmen':pl),ja,jt:'na',e:'👔',noun:1,cefr:2}); });
 A2_MANNER.split(',').forEach(it=>{ const [w,ja]=it.split('='); L.manners.push({id:'c2_'+slug(w),en:w,ja,e:'✨',cefr:2}); });
 A2_PLACES.split(',').forEach(it=>{ const [w,ja]=it.split('='); const en=w; const id='c2_'+slug(w); const to=/^(in|at|on|by) /.test(en)? en.replace(/^(in|at|on|by) /,'to ').replace(/^to campus$/,'to campus') : en; const jn=ja.replace(/で$/,''); L.places.push({id,en,to,ja,jat:jn+'へ',jn,e:'📍',cefr:2}); });
 A2_TIMES.split(/,(?=[^,|]*=)/).forEach(it=>{ const [w,rest]=it.split('='); const [ja,ts]=rest.split('|'); L.times.push({id:'c2_'+slug(w),en:w,ja,e:'🕒',ts:ts.split(','),sky:null,cefr:2}); });
 A2_PEOPLE.split(',').forEach(it=>{ let [w,rest]=it.split('='); let [ja,kind]=rest.split(':'); let pl=false; if(w[0]==='+'){ pl=true; w=w.slice(1);} const id='c2_'+slug(w); const p={id,en:w,ja,e:kind==='animal'?'🐾':'🧑',p:3,pl:pl?1:0,cefr:2}; if(kind==='animal') p.animal=1; L.people.push(p); });
 A2_NOUNS.split('\n').forEach(line=>{ const [tag,list]=line.split('|'); list.split(',').forEach(it=>{ let [w,ja]=it.split('='); let unc=false, body=false, pl=false; if(w[0]==='~'){ unc=true; w=w.slice(1);} if(w[0]==='@'){ body=true; w=w.slice(1);} if(w[0]==='+'){ pl=true; w=w.slice(1);} const clean=w.replace(/[0-9]+$/,''); const id='c2_'+slug(w); const en = body? 'my '+clean : (unc||pl||/^the /.test(clean))? clean : (/^[aeiou]/i.test(clean)&&!/^(uni|use)/i.test(clean)?'an ':'a ')+clean; const t=[tag]; if(tag==='body') t.push('wash'); const n={id,en,ja,e:A2_ICON[tag]||'📦',t,cefr:2}; if(body) n.bpart=1; if(pl||(body&&/s$/.test(clean))) n.pl=1; L.things.push(n); }); });
 return {lex:L};
}
export let VA2;




/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_vocab_a2(){
A2_VERBS = `accept|||受け入れる|i|tr|offer,abstract
achieve|||達成する|s|tr|abstract
admire|||尊敬する|s|tr|person
advise|||助言する|s|tr|person
annoy|||いらいらさせる|s|tr|person
apologize|||あやまる|g|intr|
apply|applied|applied|申し込む|g|intr|
appreciate|||感謝する|s|tr|abstract,help
avoid|||さける|i|tr|thing,person,food,abstract
bend|bent|bent|曲げる|i|tr|body,thing
blame|||責める|i|tr|person
bother|||じゃまする|s|tr|person
bury|buried|buried|うめる|i|tr|thing
chat|chatted|chatted|おしゃべりする|s|intr|
communicate|||意思を伝え合う|g|intr|
concentrate|||集中する|s|intr|
confuse|||混乱させる|s|tr|person
consider|||よく考える|i|tr|abstract,event,offer
contact|||連絡する|s|tr|person
copy|copied|copied|写す|g|tr|write,read
cover|||おおう|g|tr|thing,food,body
cross|||わたる|g|tr|road
destroy|||こわす|g|tr|thing,build
develop|||開発する|s|tr|thing,abstract
die|died|died|死ぬ|g|intr|
disagree|||反対する|s|intr|
disappear|||消える|i|intr|
disturb|||じゃまする|s|tr|person
divide|||分ける|i|tr|food,thing
dress|||服を着る|i|intr|
dry|dried|dried|乾かす|g|tr|body,wash,thing
email|||メールを送る|g|tr|person
encourage|||はげます|g|tr|person
end|||終わる|g|intr|
exist|||存在する|s|intr|
expect|||期待する|s|tr|abstract,event,present
fail|||落ちる|i|tr|event
frighten|||こわがらせる|s|tr|person,animal
gather|||集まる|g|intr|
graduate|||卒業する|s|intr|
hand|||手わたす|g|tr|thing,read,food
hit|hit|hit|打つ|g|tr|ball,thing,person
impress|||感動させる|s|tr|person
improve|||上達させる|s|tr|skill,lang,abstract
increase|||増える|i|intr|
injure|||けがする|s|tr|body
land|||着陸する|s|intr|
offer|||申し出る|i|tr|thing,food,drink,help
park|||駐車する|s|both|car
perform|||演じる|i|intr|
predict|||予想する|s|tr|event,abstract
produce|||生産する|s|tr|thing,food
publish|||出版する|s|tr|read
receive|||受け取る|g|tr|thing,present,read,offer
recycle|||リサイクルする|s|tr|thing
regret|regretted|regretted|後悔する|s|tr|abstract
replace|||取り替える|i|tr|thing,device
retire|||引退する|s|intr|
roast|||焼く|g|tr|food
ruin|||だめにする|s|tr|thing,event
shut|shut|shut|閉める|i|tr|door
spill|||こぼす|g|tr|drink
stand|stood|stood|立つ|g|intr|
steal|stole|stolen|盗む|g|tr|thing
succeed|||成功する|s|intr|
suggest|||提案する|s|tr|abstract,offer,event
survive|||生き残る|g|intr|
sweat|||汗をかく|g|intr|
tidy|tidied|tidied|片付ける|i|tr|clean
train|||トレーニングする|s|intr|
rain|||雨が降る|g|intr|
snow|||雪が降る|g|intr|
realize|||気づく|g|cl|`;
A2_ADJ = `alive=生きている:raw,ancient*=古代の:na,annoying*=うっとうしい:i,anxious*=不安:na,asleep=眠っている:raw,attractive*=魅力的:na,awful*=ひどい:i,brilliant*=すばらしい:i,certain*=確か:na,clear=はっきりしている:raw,colorful*=色とりどり:na,comfortable*=心地よい:i,common*=よくある:ar,confused*=混乱している:raw,convenient*=便利:na,crowded*=混んでいる:raw,dizzy=めまいがする:v:s,early=早い:i,embarrassing*=はずかしい:i,energetic*=元気いっぱい:na,enormous*=巨大:na,familiar*=よく知っている:raw,fancy=おしゃれ:na,fantastic*=すばらしい:i,fascinating*=とても興味深い:i,fit=元気:na,fresh=新鮮:na,frightened*=おびえている:raw,frightening*=おそろしい:i,golden=金色:na,good-looking*=かっこいい:i,greedy=欲ばり:na,helpful*=役に立つ:v:g,ill=病気:na,illegal*=違法:na,impatient*=せっかち:na,impossible*=不可能:na,intelligent*=頭がいい:i,international*=国際的:na,lively=にぎやか:na,local*=地元の:na,lost=迷子:na,low=低い:i,mad=怒っている:raw,married=結婚している:raw,marvelous*=すばらしい:i,mean=意地悪:na,missing=行方不明:na,mysterious*=なぞめいている:raw,natural*=自然:na,necessary*=必要:na,noisy=うるさい:i,normal*=ふつう:na,organized*=整理されている:raw,original*=独創的:na,peaceful*=平和:na,pleasant*=気持ちいい:i,pleased*=喜んでいる:raw,possible*=可能:na,powerful*=強力:na,private*=個人的:na,professional*=プロ:na,quick=速い:i,raw=生:na,regular*=いつもの:na,romantic*=ロマンチック:na,similar*=似ている:raw,simple=かんたん:na,single=独身:na,slim=ほっそりしている:raw,smooth=なめらか:na,soft=やわらかい:i,straight=まっすぐ:na,suitable*=ぴったり:na,surprising*=おどろくべき:na,tidy=きちんとしている:raw,uncomfortable*=居心地が悪い:i,unfair*=不公平:na,unforgettable*=忘れられない:i,unhappy=不幸せ:na,unhealthy=不健康:na,unknown*=知られていない:i,unnecessary*=不必要:na,unpleasant*=いやな:na,unusual*=めずらしい:i,upset=動揺している:raw,useful*=役に立つ:v:g,usual*=いつもどおり:na,well-known*=よく知られている:raw,wide=広い:i,wild=野生:na,wooden=木でできている:raw,human=人間らしい:i,dead=死んでいる:raw,electric*=電気の:na,magic*=魔法の:na,silver=銀色:na,whole=まるごと:na`;
A2_FREQADV = `ever=今までに,still=まだ,probably=たぶん,certainly=きっと,nearly=もう少しで,hardly=ほとんど,finally=ついに,actually=実は,already=もう`;
A2_MANNER = `clearly=はっきりと,correctly=正しく,deeply=深く,differently=ちがうふうに,gradually=だんだん,seriously=真剣に,strongly=強く,successfully=うまく,fully=十分に,exactly=正確に,heavily=激しく,simply=かんたんに,widely=広く,far=遠くまで,online=オンラインで`;
A2_PLACES = `abroad=海外で,downtown=街の中心で,somewhere=どこかで,in my apartment=アパートで,on the balcony=ベランダで,in the cafeteria=食堂で,on campus=キャンパスで,at the castle=城で,on the coast=海岸で,in the countryside=いなかで,in the desert=砂漠で,at the drugstore=ドラッグストアで,at the gallery=美術館で,in the garage=ガレージで,by the lake=湖のそばで,at the market=市場で,at the playground=遊び場で,at the police station=警察署で,on the road=道で,at the university=大学で,in the valley=谷で,in the village=村で,at the department store=デパートで,at the grocery store=食料品店で`;
A2_TIMES = `nowadays=最近は|pres,prog,recently=最近|past,perf,forever=ずっと|fut,perf,perfprog,at lunchtime=昼休みに|pres,past,fut,at midday=正午に|pres,past,fut,on weekdays=平日に|pres,past`;
A2_PEOPLE = `the adult=大人,the athlete=運動選手,the barber=床屋さん,the beginner=初心者,my boss=上司,the bride=花嫁,the chef=シェフ,the clown=ピエロ,the customer=お客さん,the dentist=歯医者さん,the director=監督,the expert=専門家,the fisherman=漁師,the guard=警備員,the host=司会者,the hunter=狩人,the lawyer=弁護士,the manager=店長,the member=メンバー,the painter=画家,the passenger=乗客,the patient=患者,the photographer=写真家,the receptionist=受付の人,the runner=ランナー,the soldier=兵士,the stranger=知らない人,the teenager=10代の子,the thief=どろぼう,the tourist=観光客,the traveler=旅行者,the visitor=訪問者,the winner=勝者,my grandchild=孫,+the couple=カップル,the crowd=人ごみ,+the police=警察,the insect=虫:animal,the chimpanzee=チンパンジー:animal`;
A2_ROLES = `a dentist=歯医者,a lawyer=弁護士,a chef=シェフ,an athlete=運動選手,a tourist=観光客,a beginner=初心者,a photographer=写真家,a businessman=会社員,a manager=店長,a painter=画家,an adult=大人,a member=メンバー,a winner=勝者,an expert=専門家,a fan=ファン`;
A2_NOUNS = `thing|alarm clock=目覚まし時計,armchair=ひじかけいす,bench=ベンチ,bill=請求書,blackboard=黒板,bookshelf=本棚,light bulb=電球,calendar=カレンダー,can=缶,~cash=現金,chain=くさり,comb=くし,container=容器,crown=王冠,cupboard=食器棚,diamond=ダイヤモンド,digital camera=デジカメ,drawer=引き出し,+earrings=イヤリング,envelope=封筒,feather=羽,folder=フォルダー,~furniture=家具,gate=門,globe=地球儀,guidebook=ガイドブック,handbag=ハンドバッグ,handle=取っ手,lock=錠,medal=メダル,mug=マグカップ,napkin=ナプキン,pan=フライパン,~perfume=香水,pill=錠剤,racket=ラケット,receipt=レシート,screen=画面,~shampoo=シャンプー,stamp=切手,stove=コンロ,tape=テープ,treasure=宝物,washing machine=洗濯機,wheelchair=車いす,~wood=木材,+tools=道具
wear|raincoat=レインコート,+shorts=短パン,suit=スーツ,swimsuit=水着,tie=ネクタイ,glove=手ぶくろ
food|~flour=小麦粉,~ham=ハム,~jelly=ゼリー,~oil=油,pear=洋ナシ,~pepper=コショウ,~sauce=ソース,sausage=ソーセージ,~spaghetti=スパゲッティ,~seafood=魚介類,~garlic=ニンニク,omelet=オムレツ,~fast food=ファストフード
drink|~mineral water=ミネラルウォーター,soft drink=ジュース類
instr|instrument=楽器
road|~the road=道,~the street=通り,~the bridge=橋,~the river2=川
event|accident=事故,adventure=冒険,anniversary=記念日,award=賞,barbecue=バーベキュー,challenge=挑戦,competition=大会,cruise=クルーズ,emergency=緊急事態,exhibition=展示会,flight=フライト,hike=ハイキング,journey=旅,performance=公演,reunion=同窓会,schedule=予定,tour=ツアー,~sightseeing=観光,~travel=旅行,~exercise=運動
abstract|chance=チャンス,choice=選択,diet=ダイエット,experience=経験,~fashion=流行,mistake=まちがい,mystery=なぞ,opinion=意見,opportunity=機会,promise=約束,tradition=伝統,~trouble=トラブル,~knowledge=知識,talent=才能,~success=成功,~happiness=幸せ,~freedom=自由,~friendship=友情,~nature=自然,fact=事実,solution=解決策,~weight=体重,~the temperature=気温,~the view=景色,~sunlight=日光,storm=嵐,earthquake=地震,~fog=霧,~energy=エネルギー
body|@ankle=足首,@cheeks=ほお,@chest=胸,@chin=あご,@lips=くちびる,@stomach=おなか,@toes=つま先,@voice=声`;
A2_ICON = {thing:'📦',wear:'👕',food:'🍽️',drink:'🥤',instr:'🎼',road:'🛣️',event:'📅',abstract:'💭',body:'✋'};
VA2 = buildA2();
if(typeof VX!=='undefined'){ for(const k in VA2.lex){ VX.lex[k]=(VX.lex[k]||[]).concat(VA2.lex[k]); } }
A2_FREQADV.split(',').forEach(x=>{ const [en,ja]=x.split('='); if(typeof FREQADV!=='undefined' && !FREQADV.find(f=>f.id===en)) FREQADV.push({id:en,en,ja}); });
if(typeof LINKV!=='undefined'){ LINKV.seem={en:'seem',ja:'思える',jt:'i',lab:'ように思える'}; LINKV.sound={en:'sound',ja:'聞こえる',jt:'i',lab:'聞こえる'}; }
}
