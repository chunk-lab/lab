import { pp } from './engine.js';
// ================= EXTENDED VOCABULARY =================
// nouns:  tag|word=和訳,word=和訳 …   (~ uncountable, + plural, ! common, ? rare; "the " kept as written)
export let VX_NOUNS;
// animals / creatures as people-like subjects (the … = …)
export let VX_ANIMALS;
// people (the … = …)
export let VX_PEOPLE;
// verbs: base|past|pp|和訳(辞書形)|活用(g/i/s/k)|fr(intr/tr/both)|tags   (! common, ? rare)
export let VX_VERBS;
// adjectives: word=和訳:型(i/na)  (* = more/most, ! common, ? rare)
export let VX_ADJ;
// how (manner)
export let VX_MANNER;
// places: in/at/on … = …で
export let VX_PLACES;
// times (tenses they fit)
export let VX_TIMES;
export let VX_ICON;
export function vxSlug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
export function vxArticle(w){ return /^[aeiou]/i.test(w)&&!/^(uni|use|euro|one)/i.test(w)?'an ':'a '; }
export function vxMark(w){ let fq=35; if(w[0]==='!'){ fq=60; w=w.slice(1);} else if(w[0]==='?'){ fq=20; w=w.slice(1);} return [w,fq]; }
export function buildVX(){
 const out={things:[],people:[],verbs:[],states:[],manners:[],places:[],times:[]}, FQ={};
 VX_NOUNS.split('\n').forEach(line=>{ const [tag,list]=line.split('|'); (list||'').split(',').forEach(it=>{ if(!it) return; let [w,ja]=it.split('='); let fq; [w,fq]=vxMark(w); let unc=false, pl=false; if(w[0]==='~'){ unc=true; w=w.slice(1);} else if(w[0]==='+'){ pl=true; w=w.slice(1);} const en = unc||pl||/^the /.test(w)? w : (tag==='instr'? 'the '+w : vxArticle(w)+w); const id='x_'+vxSlug(w); if(out.things.find(x=>x.id===id)) { const x=out.things.find(x=>x.id===id); if(!x.t.includes(tag)) x.t.push(tag); return; } const tags=[tag]; out.things.push({id,en,ja,e:VX_ICON[tag]||'📦',t:tags,pl:pl?1:0,vx:1}); FQ[id]=fq; }); });
 VX_ANIMALS.split(',').forEach(it=>{ let [w,ja]=it.split('='); const id='x_'+vxSlug(w); out.people.push({id,en:'the '+w,ja,e:'🐾',p:3,pl:0,animal:1,vx:1}); FQ[id]=35; });
 VX_PEOPLE.split(',').forEach(it=>{ let [w,ja]=it.split('='); let fq; [w,fq]=vxMark(w); let pl=false; if(w[0]==='+'){ pl=true; w=w.slice(1);} const id='x_'+vxSlug(w); out.people.push({id,en:'the '+w,ja,e:'🧑',p:3,pl:pl?1:0,vx:1}); FQ[id]=fq; });
 VX_VERBS.split('\n').forEach(line=>{ let [b,pa,pp,ja,jt,fr,tags]=line.split('|'); let fq; [b,fq]=vxMark(b); const words=b.split(' '); const base=words[0], tail=words.slice(1).join(' '); const id='x_'+vxSlug(b); const v={id,en:base,ja,jt,fr,e:'✨',an:fr==='intr'?'bob':'reach',vx:1}; if(tail) v.tail=tail; if(pa) v.past=pa.split(' ')[0]; if(pp) v.pp=pp.split(' ')[0]; if(tags) v.t=tags.split(','); if(base==='thank'||base==='greet') v.part=base==='thank'?'に':'に'; if(/[^aeiou][aeiou][bdgmnprt]$/.test(base) && base.length<=4 && !pa) v.dbl=1; out.verbs.push(v); FQ[id]=fq; });
 VX_ADJ.split(',').forEach(it=>{ let [w,rest]=it.split('='); let fq; [w,fq]=vxMark(w); const more=w.includes('*'); w=w.replace('*',''); const clean=w.replace(/[0-9]+$/,''); const [ja,jt]=rest.split(':'); const id='x_'+vxSlug(w); const s={id,en:clean,ja,jt,e:'💫',vx:1}; if(more) s.more=1; else { const b=clean; s.comp = /e$/.test(b)? b+'r' : /[^aeiou]y$/.test(b)? b.slice(0,-1)+'ier' : /[^aeiou][aeiou][^aeiouwy]$/.test(b)&&b.length<=4? b+b.slice(-1)+'er' : b+'er'; s.sup=s.comp.replace(/er$/,'est'); if(clean==='good'){ s.comp='better'; s.sup='best'; } if(clean==='bad'){ s.comp='worse'; s.sup='worst'; } } out.states.push(s); FQ[id]=fq; });
 VX_MANNER.split(',').forEach(it=>{ let [w,ja]=it.split('='); let fq; [w,fq]=vxMark(w); const id='x_'+vxSlug(w); out.manners.push({id,en:w.replace(/[0-9]+$/,''),ja,e:'✨',vx:1}); FQ[id]=fq; });
 VX_PLACES.split(',').forEach(it=>{ let [w,ja]=it.split('='); let fq; [w,fq]=vxMark(w); const en=w.replace(/[0-9]+$/,''); const id='x_'+vxSlug(w); const to=/^(in|at|on|by|near|under) /.test(en)? en.replace(/^(in|at|on|by|near|under) /,'to ') : en; const jn=ja.replace(/で$/,''); const jto=/^(in|on) /.test(en)&&/の(中|上)$/.test(jn)? jn.replace(/の(中|上)$/,'のところ') : jn; out.places.push({id,en,to,ja,jat:jto+'へ',jn,jto,e:'📍',vx:1}); FQ[id]=fq; });
 VX_TIMES.split(',!').forEach((it,i)=>{ it=it.replace(/^!/,''); let [w,rest]=it.split('='); const [ja,ts]=rest.split('|'); const en=w.replace(/[0-9]+$/,''); const id='x_'+vxSlug(w); out.times.push({id,en,ja,e:'🕒',ts:ts.split(','),sky:null,vx:1}); FQ[id]=60; });
 return {lex:out,FQ};
}
export let VX;

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_vocab(){
VX_NOUNS = `food|!~rice=ごはん,!egg=たまご,!~meat=肉,!~fish=魚,!~chicken=鶏肉,~beef=牛肉,~pork=豚肉,!salad=サラダ,!~sushi=すし,~noodles=めん,+strawberries=いちご,orange=オレンジ,lemon=レモン,peach=もも,+grapes=ぶどう,melon=メロン,watermelon=すいか,pineapple=パイナップル,tomato=トマト,potato=じゃがいも,carrot=にんじん,onion=たまねぎ,cabbage=キャベツ,+mushrooms=きのこ,~corn=とうもろこし,~cheese=チーズ,~butter=バター,~jam=ジャム,~chocolate=チョコレート,~candy=あめ,~ice cream=アイスクリーム,donut=ドーナツ,pie=パイ,~pasta=パスタ,hamburger=ハンバーガー,hot dog=ホットドッグ,~steak=ステーキ,~toast=トースト,~cereal=シリアル,~yogurt=ヨーグルト,~popcorn=ポップコーン,+french fries=フライドポテト,~tofu=豆腐,~natto=納豆,~miso soup=みそ汁,~udon=うどん,~soba=そば,~tempura=天ぷら,~breakfast=朝ごはん,~dinner=夕ごはん,snack=おやつ,~dessert=デザート,~fruit=くだもの,+vegetables=野菜,pancake=パンケーキ,muffin=マフィン,bento=お弁当,~honey=はちみつ,~sugar=砂糖,~salt=塩
drink|~green tea=緑茶,~cola=コーラ,~soda=ソーダ,~hot chocolate=ココア,~lemonade=レモネード,~apple juice=りんごジュース,~milk tea=ミルクティー,smoothie=スムージー,~sports drink=スポーツドリンク
read|!newspaper=新聞,!magazine=雑誌,!dictionary=辞書,textbook=教科書,novel=小説,poem=詩,diary=日記,menu=メニュー,sign=看板,message=メッセージ,report=レポート,+instructions=説明書,recipe=レシピ,+comics=まんが
write|!note=メモ,!essay=作文,!postcard=はがき,card=カード,list=リスト,!answer=答え,question=質問,+words=言葉
thing|!pencil=えんぴつ,eraser=消しゴム,ruler=定規,+scissors=はさみ,~glue=のり,desk=机,chair=いす,table=テーブル,bed=ベッド,sofa=ソファー,clock=時計,!watch=腕時計,!cup=カップ,!glass=コップ,plate=皿,bowl=おわん,spoon=スプーン,fork=フォーク,knife=ナイフ,+chopsticks=はし,bottle=びん,!wallet=さいふ,!ticket=切符,coin=コイン,+glasses=めがね,ring=指輪,necklace=ネックレス,towel=タオル,~soap=せっけん,toothbrush=歯ブラシ,pillow=まくら,blanket=毛布,lamp=ランプ,mirror=鏡,!box=箱,basket=かご,!backpack=リュック,suitcase=スーツケース,!tablet=タブレット,laptop=ノートパソコン,+headphones=ヘッドホン,speaker=スピーカー,charger=充電器,battery=電池,remote=リモコン,fan=扇風機,heater=ヒーター,fridge=冷蔵庫,microwave=電子レンジ,oven=オーブン,rope=ロープ,bucket=バケツ,shovel=シャベル,flag=旗,balloon=風船,candle=ろうそく,gift=贈り物,doll=人形,puzzle=パズル,kite=たこ,sticker=シール,+crayons=クレヨン,paintbrush=絵筆,+paints=絵の具,tent=テント,flashlight=懐中電灯,+sunglasses=サングラス,+gloves=手袋,scarf=マフラー,+socks=くつ下,+boots=ブーツ,skirt=スカート,dress=ドレス,+pants=ズボン,+jeans=ジーンズ,sweater=セーター,coat=コート,cap=キャップ,uniform=制服,+pajamas=パジャマ,t-shirt=Tシャツ,belt=ベルト,button=ボタン,pocket=ポケット,trash can=ごみ箱,~trash=ごみ,plant=植物,flower pot=植木鉢,stone=石,stick=棒,leaf=葉っぱ,+leaves=落ち葉,shell=貝がら,+seeds=種
sport|~volleyball=バレーボール,~table tennis=卓球,~badminton=バドミントン,~golf=ゴルフ,~rugby=ラグビー,~judo=柔道,~karate=空手,~kendo=剣道,~swimming=水泳,~skiing=スキー,~skating=スケート,~surfing=サーフィン,~dodgeball=ドッジボール,~tag=鬼ごっこ,~hide-and-seek=かくれんぼ,~track and field=陸上
instr|violin=バイオリン,flute=フルート,drum=ドラム,+drums=ドラム,trumpet=トランペット,harmonica=ハーモニカ,recorder=リコーダー,ukulele=ウクレレ,keyboard=キーボード
game|board game=ボードゲーム,~chess=チェス,~shogi=将棋,card game=カードゲーム,video game=テレビゲーム,quiz=クイズ,riddle=なぞなぞ
music|~jazz=ジャズ,~rock=ロック,~pop music=ポップス,~classical music=クラシック,podcast=ポッドキャスト,concert=コンサート
lang|~science=理科,~history=歴史,~Japanese history=日本史,~art=美術,~P.E.=体育,~social studies=社会,~Chinese=中国語,~Korean=韓国語,~French=フランス語,~Spanish=スペイン語,~programming=プログラミング,~geography=地理
watch|~anime=アニメ,drama=ドラマ,cartoon=まんが映画,video=動画,show=番組,~the sunset=夕日,~the sunrise=日の出,~fireworks=花火,parade=パレード,~the game=試合,play=劇
ride|!car=車,taxi=タクシー,!plane=飛行機,ship=船,boat=ボート,subway=地下鉄,motorcycle=バイク,scooter=スクーター,skateboard=スケボー,unicycle=一輪車,roller coaster=ジェットコースター,elevator=エレベーター,escalator=エスカレーター
event|!test=テスト,exam=試験,class=授業,lesson=レッスン,festival=お祭り,wedding=結婚式,birthday party=誕生日会,sports day=運動会,school trip=修学旅行,vacation=休み,picnic=ピクニック,camp=キャンプ,show=ショー,match=試合,contest=コンテスト,interview=面接,appointment=予約
clean|!kitchen=台所,bathroom=浴室,classroom=教室,garden=庭,yard=庭,floor=床
wash|!face=顔,!+hands=手,~hair=髪,+clothes=服,+cups=カップ
device|!light switch=スイッチ,!air conditioner=エアコン,alarm=目覚まし,music player=音楽プレーヤー,printer=プリンター,game console=ゲーム機
draw|circle=円,line=線,star=星形,heart=ハート
word|~kanji=漢字,phrase=フレーズ,idiom=熟語,~spelling=つづり,meaning=意味
offer|!invitation card=招待状,job offer=仕事の話,idea=アイデア,plan=計画,proposal=提案,request=お願い
over|~fear=恐怖,~sadness=悲しみ,problem=問題,~jet lag=時差ぼけ,~the flu=インフルエンザ,breakup=失恋
build|model=模型,bridge=橋,tower=塔,igloo=かまくら,birdhouse=巣箱,fort=秘密基地
plant|!seeds=種,sunflower=ひまわり,tulip=チューリップ,rose=バラ,+vegetables=野菜,rice plant=稲
animal|~the animals=動物たち`;
VX_ANIMALS = `lion=ライオン,tiger=トラ,elephant=ゾウ,giraffe=キリン,monkey=サル,panda=パンダ,bear=クマ,penguin=ペンギン,koala=コアラ,kangaroo=カンガルー,zebra=シマウマ,cow=ウシ,pig=ブタ,sheep=ヒツジ,goat=ヤギ,chicken=ニワトリ,duck=アヒル,mouse=ネズミ,hamster=ハムスター,turtle=カメ,snake=ヘビ,frog=カエル,owl=フクロウ,crow=カラス,dolphin=イルカ,whale=クジラ,shark=サメ,octopus=タコ,crab=カニ,bee=ハチ,ant=アリ,dragon=ドラゴン,dinosaur=恐竜,ghost=おばけ,alien=宇宙人,monster=怪物,puppy=子犬,kitten=子ねこ,parrot=オウム,squirrel=リス`;
VX_PEOPLE = `!mother=母,!father=父,brother=兄弟,sister=姉妹,grandpa=おじいちゃん,uncle=おじ,aunt=おば,cousin=いとこ,!doctor=医者,nurse=看護師,cook=料理人,driver=運転手,police officer=警察官,firefighter=消防士,farmer=農家の人,shopkeeper=店員,clerk=店員,waiter=ウェイター,king=王様,queen=女王,prince=王子,princess=王女,neighbor=近所の人,guest=お客さん,captain=キャプテン,coach=コーチ,classmate=クラスメート,team=チーム,class=クラス,family=家族,man=男の人,woman=女の人,child=子ども,+children=子どもたち,kid=子,+kids=子どもたち,old man=おじいさん,old woman=おばあさん,singer=歌手,artist=画家,scientist=科学者,astronaut=宇宙飛行士`;
VX_VERBS = `!learn|||学ぶ|g|both|lang,sport,instr
!try|||やってみる|i|both|food,sport,game,thing
!stay|||とどまる|g|intr|
!live|||住む|g|intr|
!move|||動く|g|intr|
!stop|stopped|stopped|止まる|g|intr|
!change|||変わる|g|intr|
!begin|began|begun|始まる|g|intr|
!finish|||終える|i|both|homework,food,read,write,event
!feel|felt|felt|感じる|i|intr|
!hear|heard|heard|聞こえる|i|tr|music,any
!keep|kept|kept|とっておく|g|tr|thing,food
!let go|let|let|手放す|g|intr|
!pay|paid|paid|払う|g|both|thing,food,drink
!spend|spent|spent|過ごす|g|tr|event
!save|||とっておく|g|tr|thing,food
!miss|||恋しく思う|g|tr|person,animal,event
!understand|understood|understood|わかる|g|tr|word,lang,tell
!believe|||信じる|i|tr|person,tell
!explain|||説明する|s|tr|word,tell,event
!plan|planned|planned|計画する|s|tr|event
!prepare|||準備する|s|both|food,event
!decide|||決める|i|intr|
!worry|||心配する|s|intr|
!agree|||賛成する|s|intr|
!smell|||においをかぐ|g|tr|food,drink,plant
!taste|||味見する|s|tr|food,drink
!touch|||さわる|g|tr|thing,animal,any
!hold|held|held|持つ|g|tr|thing,animal,person
!drop|dropped|dropped|落とす|g|tr|thing,food
!fill|||満たす|s|tr|thing
!wrap|wrapped|wrapped|包む|g|tr|thing,present
!count|||数える|i|tr|thing,food
!collect|||集める|i|tr|thing,toy
!share|||分け合う|g|tr|food,thing
!order|||注文する|s|both|food,drink
!rent|||借りる|i|tr|ride,thing
!pack|||荷造りする|s|both|thing
!mix|||混ぜる|i|tr|food,drink
!bake|||焼く|g|tr|food
!boil|||ゆでる|i|tr|food
!fry|||いためる|i|tr|food
!pour|||注ぐ|g|tr|drink
!serve|||出す|g|tr|food,drink
!type|||入力する|s|tr|write,word
!print|||印刷する|s|tr|read,write
!record|||録音する|s|tr|music
!download|||ダウンロードする|s|tr|thing,music
!search|||検索する|s|intr|
!post|||投稿する|s|tr|write
!greet|||あいさつする|s|tr|person
!thank|||感謝する|s|tr|person
!kiss|||キスする|s|tr|person,animal
!marry|||結婚する|s|tr|person
!wave|||手をふる|g|intr|
!nod|nodded|nodded|うなずく|g|intr|
!yell|||大声を出す|s|intr|
!whisper|||ささやく|g|intr|
!sneeze|||くしゃみをする|s|intr|
!cough|||せきをする|s|intr|
!yawn|||あくびをする|s|intr|
!breathe|||息をする|s|intr|
!blink|||まばたきする|s|intr|
!shake|shook|shaken|ふる|g|tr|thing
!bite|bit|bitten|かむ|g|tr|food,thing
!lick|||なめる|i|tr|food
!chew|||かむ|g|tr|food
!swallow|||飲みこむ|g|tr|food
!stretch|||のびをする|s|intr|
!bow|||おじぎする|s|intr|
!kneel|knelt|knelt|ひざまずく|g|intr|
!crawl|||はう|g|intr|
!roll|||転がる|g|intr|
!slide|slid|slid|すべる|g|intr|
!float|||浮かぶ|g|intr|
!sink|sank|sunk|沈む|g|intr|
!shine|shone|shone|かがやく|g|intr|
!melt|||とける|i|intr|
!burn|||燃える|i|intr|
!freeze|froze|frozen|こおる|g|intr|
!ring|rang|rung|鳴る|g|intr|
!knock|||ノックする|s|intr|
!skip|skipped|skipped|スキップする|s|intr|
!hop|hopped|hopped|ぴょんと跳ぶ|g|intr|
!march|||行進する|s|intr|
!race|||競走する|s|intr|
!score|||得点する|s|intr|
!cheer|||応援する|s|intr|
!clap|clapped|clapped|手をたたく|g|intr|
!celebrate|||お祝いする|s|both|event
!pray|||祈る|g|intr|
!dream|||夢を見る|i|intr|
!hug each other|hugged each other|hugged each other|抱き合う|g|intr|
!sail|||航海する|s|intr|
!camp|||キャンプする|s|intr|
!fish|||つりをする|s|intr|
!hike|||ハイキングする|s|intr|
!ski|||スキーをする|s|intr|
!skate|||スケートをする|s|intr|
!surf|||サーフィンをする|s|intr|
!jog|jogged|jogged|ジョギングする|s|intr|
!paint pictures|painted pictures|painted pictures|絵を描く|g|intr|
!fight|fought|fought|けんかする|s|intr|
!argue|||言い争う|g|intr|
!complain|||文句を言う|g|intr|
!lie|lied|lied|うそをつく|g|intr|
!promise|||約束する|s|intr|
!guess|||当てる|i|intr|
!imagine|||想像する|s|intr|
!wonder|||不思議に思う|g|intr|
!notice|||気づく|g|intr|
!forgive|forgave|forgiven|許す|g|tr|person
!trust|||信頼する|s|tr|person
!respect|||尊敬する|s|tr|person
!hate|||大きらいだ|g|tr|food,any
!prefer|preferred|preferred|〜のほうが好きだ|g|tr|food,drink,any
!pass by|||通りすぎる|i|intr|
!attack|||攻撃する|s|tr|person,animal
!beat|beat|beaten|負かす|g|tr|person
!defeat|||打ち負かす|g|tr|person
!rescue|||救う|g|tr|person,animal
!save money|saved money|saved money|お金をためる|i|intr|
!earn|||かせぐ|g|intr|
!borrow money|borrowed money|borrowed money|お金を借りる|i|intr|
!introduce|||紹介する|s|tr|person
!recommend|||すすめる|i|tr|food,read,watch,thing
!compare|||比べる|i|tr|thing,food
!measure|||はかる|g|tr|thing
!weigh|||重さをはかる|g|tr|thing,food
!repair|||修理する|s|tr|thing,ride,device
!design|||デザインする|s|tr|thing,build
!create|||作り出す|s|tr|thing,build,write
!invent|||発明する|s|tr|thing
!solve|||解く|g|tr|word,over
!memorize|||暗記する|s|tr|word,lang
!review|||復習する|s|tr|lang,homework
!translate|||翻訳する|s|tr|write,word,read
!spell|||つづる|g|tr|word
!pronounce|||発音する|s|tr|word
!describe|||説明する|s|tr|thing,person,event
!report|||報告する|s|tr|event
!announce|||発表する|s|tr|event
!vote|||投票する|s|intr|
!join|||参加する|s|tr|event,sport
!leave the room|left the room|left the room|部屋を出る|i|intr|
!book|||予約する|s|tr|event,ride
!cancel|||キャンセルする|s|tr|event
!miss the bus|missed the bus|missed the bus|バスに乗りおくれる|i|intr|
!raise|||あげる|i|tr|thing
!lower|||下げる|i|tr|thing
!lift|||持ち上げる|i|tr|thing
!drag|dragged|dragged|引きずる|g|tr|thing
!tie|tied|tied|結ぶ|g|tr|thing
!fold|||折りたたむ|g|tr|thing,write
!tear|tore|torn|破る|g|tr|write,read
!turn back|||引き返す|g|intr|
!knit|knitted|knitted|編む|g|tr|thing
!sew|sewed|sewn|ぬう|g|tr|thing
!iron|||アイロンをかける|i|tr|thing
!sweep|swept|swept|はく|g|tr|clean
!vacuum|||掃除機をかける|i|tr|clean
!water|||水をやる|i|tr|plant
!grow plants|grew plants|grown plants|植物を育てる|i|intr|
!pick flowers|picked flowers|picked flowers|花をつむ|g|intr|
!feed the cat|fed the cat|fed the cat|ねこにえさをやる|i|intr|
!walk the dog|walked the dog|walked the dog|犬の散歩をする|s|intr|
?whistle|||口笛をふく|g|intr|
?tiptoe|||つま先で歩く|g|intr|
?giggle|||くすくす笑う|g|intr|
?sigh|||ため息をつく|g|intr|
?shiver|||ふるえる|i|intr|
?frown|||顔をしかめる|i|intr|
?gossip|||うわさ話をする|s|intr|
?wander|||ぶらぶら歩く|g|intr|
?explore|||探検する|s|both|place
?investigate|||調べる|i|tr|event,thing`;
VX_ADJ = `!big=大きい:i,!small=小さい:i,!long=長い:i,!short=短い:i,!new=新しい:i,!old=古い:i,!good=いい:i,!bad=悪い:i,!easy=かんたん:na,!difficult*=むずかしい:i,!interesting*=おもしろい:i,!boring*=たいくつ:na,!important*=大切:na,!expensive*=高い:i,!cheap=安い:i,!clean=きれい:na,!dirty=きたない:i,!warm=あたたかい:i,!cool2=すずしい:i,!fast2=速い:i,!slow=おそい:i,!heavy=重い:i,!light=軽い:i,!dark=暗い:i,!bright=明るい:i,!quiet2=静か:na,!loud=うるさい:i,!sweet=あまい:i,!spicy=からい:i,!delicious*=おいしい:i,!wonderful*=すばらしい:i,!great=すごい:i,!nice=すてき:na,!pretty=かわいい:i,!ugly=みにくい:i,!careful*=注意深い:i,!safe=安全:na,!dangerous*=危険:na,!sure=確か:na,!wrong=まちがい:na,!right=正しい:i,!different*=ちがう:na,!same2=同じ:na,!special*=特別:na,!perfect*=完ぺき:na,!lucky=運がいい:i,!unlucky=運が悪い:i,!glad=うれしい:i,!sorry=申し訳ない:i,!nervous*=緊張している:raw,!worried*=心配している:raw,!relaxed*=リラックスしている:raw,!confident*=自信たっぷり:na,!calm=落ち着いている:raw,!serious*=まじめ:na,!honest*=正直:na,!friendly=親しみやすい:i,!polite*=礼儀正しい:i,!rude=失礼:na,!lazy=なまけもの:na,!active*=活発:na,!gentle=おだやか:na,!wise=かしこい:i,!clever=りこう:na,!silly=ばか:na,!crazy=むちゃくちゃ:na,!weak=弱い:i,!fat=太っている:raw,!thin=細い:i,!wet=ぬれている:raw,!dry=かわいている:raw,!empty=からっぽ:na,!open2=開いている:raw,!closed=閉まっている:raw,!alone2=ひとり:na,!sleepy2=ねむたい:i,?amazing*=すばらしい:i,?terrible*=ひどい:i,?excellent*=優秀:na,?curious*=好奇心いっぱい:na,?jealous*=うらやましい:i,?embarrassed*=はずかしい:i,?grateful*=感謝している:raw,?shocked*=ショックを受けている:raw,?satisfied*=満足している:raw,?disappointed*=がっかりしている:raw,?cheerful*=明るい:i,?patient*=がまん強い:i,?generous*=気前がいい:i,?creative*=創造的:na,?talented*=才能豊か:na,?modern*=現代的:na,?traditional*=伝統的:na,?famous2*=有名:na`;
VX_MANNER = `!together2=いっしょに,!quickly=すばやく,!early=早く,!late2=おそくまで,!carefully2=注意して,!easily=かんたんに,!slowly and carefully=ゆっくりていねいに,!loudly2=大声で,!softly=やさしく,!politely=ていねいに,!kindly=親切に,!badly=下手に,!perfectly=完ぺきに,!safely=安全に,!quietly2=こっそり,!suddenly2=突然,!finally2=ついに,!alone3=ひとりで,?secretly=ひそかに,?proudly=得意げに,?angrily=怒って,?sadly2=悲しそうに,?silently=だまって,?patiently=がまん強く,?bravely=勇敢に,?gently=そっと`;
VX_PLACES = `!at the store=店で,!at the supermarket=スーパーで,!at the hospital=病院で,!at the airport=空港で,!at the restaurant=レストランで,!at the office=会社で,!in the gym=体育館で,!in the garden=庭で,!in the classroom2=教室で,!at the bus stop=バス停で,!at the museum=博物館で,!at the aquarium=水族館で,!at the post office=郵便局で,!at the bank=銀行で,!at the hotel=ホテルで,!at the mall=ショッピングモールで,!in the pool=プールで,!in the sea=海で,!in the mountains=山で,!in the city=街で,!in the country=いなかで,!in Japan=日本で,!in America=アメリカで,!in the car=車の中で,!on the train=電車の中で,!on the bus=バスの中で,!in bed=ベッドで,!in the bathroom=お風呂場で,!in the living room=リビングで,!at the door=ドアのところで,!at the station2=駅で,!at my grandma's house=おばあちゃんの家で,!at a friend's house=友だちの家で,!outside=外で,!inside=中で,!upstairs=二階で,!downstairs=一階で,!everywhere=どこでも,!near my house=家の近くで,?on the roof=屋根の上で,?under the tree=木の下で,?in the rain=雨の中で,?on the moon=月で,?in space=宇宙で,?at the festival=お祭りで,?at the concert=コンサートで,?at the stadium=競技場で,?at the temple=お寺で,?at the shrine=神社で`;
VX_TIMES = `!this afternoon=今日の午後|past,pres,fut,prog,!this evening=今晩|past,fut,prog,!this weekend=今週末|past,fut,prog,!next month=来月|fut,prog,!next year=来年|fut,prog,!last month=先月|past,pastprog,!last year=去年|past,pastprog,!three days ago=3日前|past,pastprog,!a long time ago=ずっと前|past,pastprog,!in the afternoon=午後に|pres,past,fut,!in the evening=夕方に|pres,past,fut,!after lunch=昼ごはんのあと|pres,past,fut,!before dinner=夕ごはんの前|pres,past,fut,!every week=毎週|pres,past,!every night=毎晩|pres,past,!every Sunday=毎週日曜日|pres,past,!on weekends2=週末に|pres,past,fut,!at noon=正午に|pres,past,fut,!at midnight=真夜中に|pres,past,fut,!someday=いつか|fut,!right away=すぐに|fut,past,!for a long time=長い間|perf,perfprog,past,!for a week=1週間|perf,perfprog,past,fut,!since yesterday=昨日から|perf,perfprog,!since last year=去年から|perf,perfprog,!never=一度も〜ない|perf,!once=一度|perf,past,!twice=二度|perf,past,!before2=以前に|perf,past`;
VX_ICON = {food:'🍽️',drink:'🥤',read:'📖',write:'✏️',thing:'📦',sport:'🏅',instr:'🎼',game:'🎲',music:'🎧',lang:'📘',watch:'📺',ride:'🚗',event:'📅',clean:'🧹',wash:'🧼',device:'🔌',draw:'🖼️',word:'🔤',offer:'📨',over:'💪',build:'🏗️',plant:'🌱',animal:'🐾'};
VX = buildVX();
}
