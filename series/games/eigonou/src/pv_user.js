import { PVBASE } from './engine.js';
// ================= phrasal verbs from 「米国英語｜熟語と句動詞 分離版」 (★★★ all, ★★ most) =================
// base|particle|kind(t = little word after the verb, p = word before the object, tp = both e.g. catch up with)|fr|sep|和訳(辞書形)|活用|tags|同じ意味の動詞|コアからの意味|頻度
export let UPV_BASE;
export let UPV;
export function buildUPV(){
 const out=[];
 UPV.split('\n').forEach(line=>{ const [base,part,kind,fr,sep,ja,jt,tags,syn,mean,star]=line.split('|'); const b=Object.assign({},(typeof PVBASE!=='undefined'&&PVBASE[base])||{},UPV_BASE[base]||{});
  const words=part.split(' '); const p0=words[0];
  const v={id:'u_'+(base+'_'+part).replace(/[^a-z]+/g,'_'),en:base,past:b.past,pp:b.pp,s3:b.s3,dbl:b.dbl,pv:{base,p:p0},ja,jt,fr,e:'🎡',an:'bob',mean,star:+star,upv:1};
  if(kind==='t') v.tail=part; else if(kind==='p') v.prep=part; else { v.tail=p0; v.prep=words.slice(1).join(' '); }
  if(sep==='1') v.sep=1; if(v.syn){ v.syn=({understand:'x_understand',prepare:'x_prepare',cancel:'x_cancel',ruin:'c2_ruin'})[v.syn]||v.syn; }
  if(v.id==='u_feel_like'){ v.jaAdj=1; v.jaAdjT='na'; v.ja='気分'; v.part='の'; v.stative=1; }
  { const PT={u_hear_from:'から',u_take_after:'に',u_pay_for:'の代金を',u_call_up:'に',u_look_through:'に'}; if(PT[v.id]) v.part=PT[v.id]; if(v.id==='u_take_after') v.stative=1; }
  if(v.id==='u_get_into'){ v.part='に'; } if(v.id==='u_head_to'||v.id==='u_go_into'){ v.part='に'; } if(v.id==='u_catch_up_with'||v.id==='u_keep_up_with'||v.id==='u_get_back_to'){ v.part='に'; } if(v.id==='u_deal_with'||v.id==='u_act_on'||v.id==='u_work_on'){ v.part='に'; } if(v.id==='u_come_down_with'){ v.part='に'; v.ja='かかる'; } if(tags) v.t=tags.split(','); if(syn) v.syn=syn; if(fr==='intr') delete v.t;
  out.push(v); });
 return out;
}

export let UPVS;

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_pv_user(){
UPV_BASE = {blow:{past:'blew',pp:'blown'},wear:{past:'wore',pp:'worn'},sleep:{past:'slept',pp:'slept'},speak:{past:'spoke',pp:'spoken'},hear:{past:'heard',pp:'heard'},fit:{past:'fit',pp:'fit',dbl:1},let:{past:'let',pp:'let',dbl:1},stick:{past:'stuck',pp:'stuck'},think:{past:'thought',pp:'thought'},lie:{past:'lay',pp:'lain'},sell:{past:'sold',pp:'sold'},wrap:{dbl:1},plug:{dbl:1},log:{dbl:1},pop:{dbl:1},stay:{},try:{},tidy:{},dress:{},mix:{},wash:{},watch:{},brush:{},hand:{},cheer:{},line:{},pack:{},settle:{},warm:{},count:{},kick:{},jump:{},save:{},cool:{},talk:{},knock:{},back:{},call:{},calm:{},catch:{past:'caught',pp:'caught'},check:{},clean:{},deal:{past:'dealt',pp:'dealt'},drop:{dbl:1},eat:{past:'ate',pp:'eaten'},end:{},feel:{past:'felt',pp:'felt'},figure:{},fill:{},follow:{},head:{},hold:{past:'held',pp:'held'},hurry:{},keep:{past:'kept',pp:'kept'},move:{},open:{},reach:{},set:{past:'set',pp:'set',dbl:1},shut:{past:'shut',pp:'shut',dbl:1},sign:{},slow:{},throw:{past:'threw',pp:'thrown'},write:{past:'wrote',pp:'written'},act:{},carry:{},cut:{past:'cut',pp:'cut',dbl:1},fall:{past:'fell',pp:'fallen'},freak:{},lay:{past:'laid',pp:'laid'},mess:{},pass:{},pay:{past:'paid',pp:'paid'},point:{},pull:{},sort:{},start:{},step:{dbl:1},switch:{},stand:{past:'stood',pp:'stood'},sit:{past:'sat',pp:'sat',dbl:1}};
UPV = `back|up|t|tr|1|バックアップする|s|thing,device||上へ支える → 予備をとる・支える|3
bring|up|t|tr|1|話題に出す|s|abstract,event||上へ持ってくる → 話に出す|3
call|back|t|both|1|電話をかけ直す|s|person||元へ電話する → かけ直す|3
call|off|t|tr|1|中止する|s|event|cancel|予定からはなす → 中止する|3
calm|down|t|intr|0|落ち着く|g|||下へしずまる → 落ち着く|3
catch|up|t|intr|0|追いつく|g|||上まで追う → 追いつく|3
catch|up with|tp|tr|0|追いつく|g|person||上まで追う → 〜に追いつく|3
check|out|t|tr|1|チェックする|s|thing,read,watch,event|check|外まで確かめる → よく見てみる|3
clean|up|t|tr|1|きれいに片づける|i|clean,thing|clean|すっかり → きれいに片づける|3
come|on|t|intr|0|急ぐ|g|||くっついて来る → さあ・急いで|3
come|up with|tp|tr|0|思いつく|g|abstract,offer||上に出てくる → 思いつく|3
deal|with|p|tr|0|対処する|s|abstract,person,event||〜といっしょに扱う → 対処する|3
drop|off|t|tr|1|送り届ける|i|person,thing||落としてはなす → 送り届ける|3
eat|out|t|intr|0|外食する|s|||外で食べる → 外食する|3
end|up|t|intr|0|結局そうなる|g|||最後まで → 結局〜になる|3
feel|like|p|tr|0|〜したい気分だ|g|food,drink,abstract||〜のように感じる → 〜したい気分|3
figure|out|t|tr|1|理解する|s|abstract,word|understand|最後まで考える → わかる・解決する|3
fill|in|t|tr|1|書きこむ|g|write||中へ満たす → 書きこむ|3
fill|out|t|tr|1|記入する|s|write||最後まで満たす → 記入する|3
follow|up|t|intr|0|フォローする|s|||上まで追う → 引き続き対応する|3
get|away|t|intr|0|逃げる|g||escape|はなれていく → 逃げる・休みをとる|3
get|away with|tp|tr|0|まんまと逃れる|g|abstract||はなれていく → 〜を罰されずにすむ|3
get|back to|tp|tr|0|あとで連絡する|s|person||元へもどる → あとで返事する|3
get|in|t|intr|0|入る|g||enter|中へ → 入る・着く|3
get|into|p|tr|0|夢中になる|g|sport,game,music,lang,abstract||中へ入りこむ → はまる|3
get|out of|tp|tr|0|出る|i|ride,thing||外へ → 〜から出る|3
get|together|t|intr|0|集まる|g|||いっしょに → 集まる|3
go|ahead|t|intr|0|どうぞ進める|g|||前へ行く → どうぞ・始める|3
go|for|p|tr|0|〜をしに行く|g|food,drink,sport,event||〜を求めて行く → 選ぶ・しに行く|3
go|into|p|tr|0|入る|g|thing,event||中へ行く → 入る|3
head|out|t|intr|0|出かける|i||leave|外へ向かう → 出かける|3
head|to|p|tr|0|向かう|g|event||〜のほうへ → 向かう|3
hold|on|t|intr|0|ちょっと待つ|g||wait|くっついたまま → 待つ・つかまる|3
hurry|up|t|intr|0|急ぐ|g|||すっかり → 急ぐ|3
keep|on|t|intr|0|続ける|i||continue|くっついたまま → 続ける|3
keep|up|t|intr|0|ついていく|g|||上のまま → 遅れずについていく|3
keep|up with|tp|tr|0|ついていく|g|person,abstract||上のまま → 〜についていく|3
look|out for|tp|tr|0|気をつける|i|person,animal,thing||外に目を向けて → 〜に気をつける|3
make|out|t|tr|1|聞き取る|g|word,abstract|understand|外へ取り出す → 見分ける・聞き取る|3
make|up|t|tr|1|作り上げる|g|write,abstract||すっかり作る → 作り上げる・でっちあげる|3
move|on|t|intr|0|次へ進む|g|||くっついて進む → 次へ進む|3
open|up|t|intr|0|打ち明ける|g|||すっかり開く → 心を開く|3
put|back|t|tr|1|元に戻す|s|thing||元の場所へ置く → 戻す|3
reach|out|t|intr|0|連絡する|s|||外へ手をのばす → 連絡をとる|3
run|out|t|intr|0|なくなる|g|||外へ出つくす → 尽きる|3
set|up|t|tr|1|準備する|s|thing,event,device|prepare|上へ立てる → 設置する・準備する|3
shut|up|t|intr|0|だまる|g|||すっかり閉じる → だまる|3
sign|up|t|intr|0|申し込む|g|||上に名前を書く → 登録する|3
slow|down|t|intr|0|ゆっくりにする|s|||下へ → 速度を落とす|3
throw|away|t|tr|1|捨てる|i|thing,food||はなれた所へ投げる → 捨てる|3
turn|out|t|intr|0|結局〜とわかる|g|||外へ出てくる → 〜だとわかる|3
work|on|p|tr|0|取り組む|g|homework,write,thing,abstract||くっついて働く → 取り組む|3
write|down|t|tr|1|書きとめる|i|write,word||下に書く → 書きとめる|3
act|on|p|tr|0|〜にもとづいて行動する|s|offer,abstract||くっついて動く → 〜に従って行動する|2
back|out|t|intr|0|手を引く|g|||後ろへ外れる → 手を引く|2
call|for|p|tr|0|必要とする|s|abstract,help||〜を求めて呼ぶ → 必要とする|2
care|for|p|tr|0|世話をする|s|person,animal,plant||〜のために気にかける → 大事にする|2
carry|on|t|intr|0|続ける|i||continue|くっついて運ぶ → 続ける|2
carry|out|t|tr|1|実行する|s|event,abstract||最後まで運ぶ → やり遂げる|2
check|in|t|intr|0|チェックインする|s|||中へ確かめる → 手続きをする|2
come|around|t|intr|0|考えを変える|i|||ぐるっと回って来る → 考えを変える・立ち寄る|2
come|down with|tp|tr|0|〜にかかる|g|over||下へ来る → （病気に）かかる|2
cut|off|t|tr|1|切りはなす|g|thing,device||切ってはなす → 切る・止める|2
drop|by|t|intr|0|立ち寄る|g|||そばに落ちる → ちょっと立ち寄る|2
fall|apart|t|intr|0|ばらばらになる|i|||はなれて落ちる → くずれる|2
freak|out|t|intr|0|パニックになる|g|||外へ飛び出す → 取り乱す|2
get|through|p|tr|0|乗り切る|g|over,event||通りぬける → 乗り切る|2
go|off|t|intr|0|鳴り出す|g|||はなれて行く → 鳴る・出発する|2
hand|over|t|tr|1|引き渡す|s|thing,read||上をこえて手わたす → 引き渡す|2
hold|back|t|intr|0|ためらう|g|||後ろにとどめる → 控える|2
lay|out|t|tr|1|広げて並べる|i|thing,write||外へ広げる → 並べる・説明する|2
mess|up|t|tr|1|台無しにする|s|thing,event,abstract|ruin|すっかりちらかす → 台無しにする|2
move|in|t|intr|0|引っ越してくる|g|||中へ移る → 入居する|2
move|out|t|intr|0|引っ越して出る|g|||外へ移る → 出ていく|2
pass|out|t|intr|0|気を失う|g|||外へ去る → 気絶する|2
pay|back|t|tr|1|お金を返す|g|person,thing||元へ払う → 返済する|2
point|out|t|tr|1|指摘する|s|abstract,word||外へ指し示す → 指摘する|2
pull|over|t|intr|0|車を止める|i|||上をこえて寄せる → 路肩に止める|2
put|together|t|tr|1|組み立てる|i|thing,build||いっしょに置く → 組み立てる|2
put|up|t|tr|1|はり出す|g|read,thing||上へ置く → かかげる|2
set|off|t|intr|0|出発する|s||leave|はなれて出る → 出発する|2
shut|down|t|tr|1|電源を切る|g|device,thing||下へ閉じる → 停止させる|2
sit|back|t|intr|0|くつろぐ|g|||後ろにもたれる → くつろぐ|2
sort|out|t|tr|1|整理する|s|thing,abstract||分けて外へ → 整理・解決する|2
stand|out|t|intr|0|目立つ|g|||外へ立つ → 目立つ|2
start|out|t|intr|0|始める|i|||外へ出だす → 始める|2
step|back|t|intr|0|一歩下がる|g|||後ろへ → 一歩引く|2
take|on|t|tr|1|引き受ける|i|event,abstract||くっつけて取る → 引き受ける|2
take|over|t|tr|1|引き継ぐ|g|event,thing,abstract||上をこえて取る → 引き継ぐ|2
throw|out|t|tr|1|捨てる|i|thing,food||外へ投げる → 捨てる|2
turn|in|t|tr|1|提出する|s|homework,write,read||中へ回す → 提出する|2
switch|on|t|tr|1|スイッチを入れる|i|device||くっつける → スイッチを入れる|1
get|by|t|intr|0|なんとかやっていく|g|||そばを通りぬける → なんとかやっていく|2
get|along|t|intr|0|仲よくする|s|||並んで進む → 仲よくやる|3
get|lost|t|intr|0|道に迷う|g|||迷った状態になる|3
get|ready|t|intr|0|準備する|s|||用意ができた状態になる|3
get|married|t|intr|0|結婚する|s|||結婚した状態になる|3
get|better|t|intr|0|よくなる|g|||もっとよい状態になる|3
get|rid of|tp|tr|0|処分する|s|thing||取りのぞいた状態にする|2
go|up|t|intr|0|上がる|g|||上へ行く|3
go|down|t|intr|0|下がる|g|||下へ行く|3
go|by|t|intr|0|過ぎる|i|||そばを通りすぎる → 時が過ぎる|2
go|shopping|t|intr|0|買い物に行く|g|||〜しに行く（ing）|3
come|up|t|intr|0|話に出てくる|k|||上へ出てくる → 話題になる|3
come|true|t|intr|0|実現する|s|||本当の状態になる|3
take|in|t|tr|1|取り入れる|i|thing,abstract||中へ取る → 取り入れる|2
take|apart|t|tr|1|分解する|s|thing,device||ばらばらに取る|2
take|turns|t|intr|0|交代でする|s|||順番を取る|2
put|in|t|tr|1|入れる|i|thing||中へ置く|2
turn|over|t|tr|1|ひっくり返す|g|thing||ぐるっと上へ回す|2
look|back|t|intr|0|振り返る|g|||後ろを見る|3
look|through|p|tr|0|目を通す|g|read,write||通して見る → ざっと読む|2
look|over|t|tr|1|ざっと見直す|g|read,write,homework||上から全体を見る|2
look|up to|tp|tr|0|尊敬する|s|person||上に向かって見る|2
look|down on|tp|tr|0|見下す|g|person||下に向かって見る|2
give|out|t|tr|1|配る|g|thing,food,read||外へ与える → 配る|2
run|around|t|intr|0|走り回る|g|||まわりを走る|2
bring|in|t|tr|1|持ちこむ|g|thing,food||中へ持ってくる|2
bring|out|t|tr|1|引き出す|g|thing,abstract||外へ持ってくる|2
break|in|t|intr|0|押し入る|g|||こわして中へ|2
break|out|t|intr|0|起こる|g|||こわして外へ → 急に起こる|2
hang|around|t|intr|0|ぶらぶらする|s|||まわりにぶら下がる → うろうろする|2
show|off|t|tr|1|見せびらかす|g|thing||はなして見せる → 見せびらかす|2
show|around|t|tr|1|案内する|s|person||まわりを見せる|2
make|it|t|intr|0|間に合う|g|||それをやりとげる|3
make|fun of|tp|tr|0|からかう|g|person||〜で楽しむ → からかう|2
catch|on|t|intr|0|わかってくる|g|||くっついてつかむ → 理解する・流行る|2
clean|out|t|tr|1|中を片づける|g|clean||すっかり外へ出す|2
cheer|up|t|tr|1|元気づける|g|person||気持ちを上へ|3
dress|up|t|intr|0|おしゃれする|s|||すっかり着かざる|2
fill|up|t|tr|1|いっぱいにする|s|thing,drink||すっかり満たす|2
blow|up|t|tr|1|ふくらませる|i|thing||上へ吹く|2
blow|out|t|tr|1|吹き消す|g|thing||外へ吹く|2
count|on|p|tr|0|頼りにする|s|person||〜の上に数える → あてにする|3
hand|in|t|tr|1|提出する|s|homework,write,read||中へ手わたす|3
hand|out|t|tr|1|配る|g|thing,read,food||外へ手わたす|2
hear|from|p|tr|0|連絡をもらう|g|person||〜から聞く|3
kick|off|t|tr|1|始める|i|event||けって離す → 始める|2
lie|down|t|intr|0|横になる|g|||下へ横たわる|3
line|up|t|intr|0|列に並ぶ|g|||線の上へ|2
log|in|t|intr|0|ログインする|s|||中へ入る|3
log|out|t|intr|0|ログアウトする|s|||外へ出る|2
mix|up|t|tr|1|ごちゃまぜにする|s|thing||すっかり混ぜる|2
pack|up|t|intr|0|荷づくりする|s|||すっかりつめる|2
pick|on|p|tr|0|いじめる|i|person||〜にくっついてつつく|2
plug|in|t|tr|1|コンセントにさす|g|device,thing||中へさしこむ|2
pop|up|t|intr|0|ひょっこり出てくる|k|||ぽんと上へ|2
sell|out|t|intr|0|売り切れる|i|||すっかり売る|2
settle|down|t|intr|0|落ち着く|g|||下へ落ち着く|2
sleep|in|t|intr|0|朝寝坊する|s|||中で寝続ける|3
sleep|over|t|intr|0|泊まる|g|||向こうで寝る|2
speak|up|t|intr|0|はっきり言う|g|||声を上げる|2
stay|up|t|intr|0|夜ふかしする|s|||起きた（上の）ままでいる|3
stay|in|t|intr|0|家にいる|i|||中にいる|2
stay|out|t|intr|0|外に出たままでいる|i|||外にいる|2
stick|to|p|tr|0|守る|g|abstract,event||〜にくっつく → やり通す|2
stick|around|t|intr|0|そのへんにいる|i|||まわりにくっついている|2
think|over|t|tr|1|よく考える|i|abstract,event||上から全体を考える|2
try|on|t|tr|1|試着する|s|wear,thing||着てみる（くっつける）|3
try|out|t|tr|1|試してみる|i|thing,food,game,device||外に出して試す|2
tidy|up|t|intr|0|片づける|i|||すっかり整える|3
warm|up|t|intr|0|準備運動をする|s|||あたたまる（上へ）|2
cool|down|t|intr|0|冷める|i|||下がって冷える|2
fit|in|t|intr|0|なじむ|g|||中にぴったり入る|2
fall|asleep|t|intr|0|眠りこむ|g|||眠りの中に落ちる|3
fall|behind|t|intr|0|遅れる|i|||後ろに落ちる|2
fall|for|p|tr|0|好きになる|g|person||〜に向かって落ちる → ほれる|2
keep|going|t|intr|0|がんばり続ける|i|||行き続ける（ing）|3
let|down|t|tr|1|がっかりさせる|i|person||下へ落とす|2
let|in|t|tr|1|中に入れる|i|person,animal||中へ入らせる|2
pass|away|t|intr|0|亡くなる|g|||遠くへ過ぎ去る|2
pay|for|p|tr|0|払う|g|food,drink,thing||〜に対して払う|3
sit|up|t|intr|0|起き上がる|g|||上へ座る|2
stand|by|t|intr|0|待機する|s|||そばに立つ|2
stand|for|p|tr|0|表す|g|abstract||〜のために立つ → 表す|2
take|after|p|tr|0|似ている|i|person||〜のあとを取る → 似る|2
talk|over|t|tr|1|話し合う|g|abstract,event||上から全体を話す|2
throw|up|t|intr|0|吐く|g|||上へ投げる|2
watch|out|t|intr|0|気をつける|i|||外を見る → 用心する|3
wash|up|t|intr|0|手を洗う|g|||すっかり洗う|2
write|back|t|intr|0|返事を書く|g|||書いて返す|2
drop|out|t|intr|0|途中でやめる|i|||外へ落ちる|2
eat|up|t|tr|1|たいらげる|i|food||すっかり食べる|2
sign|in|t|intr|0|サインインする|s|||中へ入る|2
call|up|t|tr|1|電話する|s|person||呼び上げる|2
kick|out|t|tr|1|追い出す|g|person,animal||外へける|2
jump|in|t|intr|0|話に割りこむ|g|||中へ飛びこむ|2
save|up|t|intr|0|貯金する|s|||ためて上へ積む|3
switch|off|t|tr|1|スイッチを切る|g|device||はなす → 切る|3
wrap|up|t|tr|1|まとめる|i|event,abstract||すっかり包む → 終える|2
brush|up on|tp|tr|0|磨き直す|g|lang,sport,instr||上へみがく|2
knock|down|t|tr|1|たおす|g|thing||下へたたく|2
wear|out|t|intr|0|すり切れる|i|||すり減って外へ|2`;
if(typeof PVBASE!=='undefined') Object.assign(PVBASE,UPV_BASE);
UPVS = buildUPV();
}
