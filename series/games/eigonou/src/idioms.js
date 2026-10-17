import { CONJS, FRONTS, MODALS, past } from './engine.js';
import { VX } from './vocab.js';
// ================= idioms from 「米国英語｜熟語と句動詞 分離版」 (★★★ first) =================
// 1) words that open a sentence

// 2) small sentences that join the main one

export let CONJ_SUF;
// 3) "feelings / plans" that sit before the verb (like can / want to)
export let MLEX;
export let JPT;
export let MPAT;

// 4) verb idioms (they behave like verbs)
export let IDV;
// 5) be + adjective + little word (good at / afraid of …)
export let SPREP;


// 5b) be + 前置詞の決まった言いまわし（in a hurry / out of order …）：日本語を決まった形にする


// 6) time and place idioms




/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_idioms(){
[['firstofall','First of all','まず第一に','🥇','link'],['intheend','In the end','結局','🏁','link'],['atfirst','At first','最初は','1️⃣','scene'],['infact','In fact','実際','☝️','stance'],['inotherwords','In other words','言いかえると','🔁','link'],['atthemoment','At the moment','今のところ','⏱️','scene'],['thesedays','These days','最近','📆','scene'],['sofar','So far','これまでのところ','🛤️','scene'],['asusual','As usual','いつものように','🔁','scene'],['asfarasiknow','As far as I know','わたしの知るかぎりでは','🧠','stance'],['asfarasicantell','As far as I can tell','わたしの見るかぎりでは','🔍','stance'],['asfarasicansee','As far as I can see','わたしの見るかぎりでは','👀','stance'],['tothebestofmyknowledge','To the best of my knowledge','わたしの知るかぎりでは','🧠','stance'],['inmyopinion','In my opinion','わたしの意見では','💭','stance'],['atleast','At least','少なくとも','👍','stance'],['inthemeantime','In the meantime','そのあいだに','⏳','link'],['atthispoint','At this point','この時点で','📍','scene'],['inthefirstplace','In the first place','そもそも','🎯','stance'],['tome','To me','わたしにとっては','🙋','stance'],['nowonder','No wonder','どうりで','💡','stance'],['butthenagain','But then again','でもまた一方で','🔀','link'],['imean','I mean','つまり','💬','link',1],['yousee','You see','ほらね','👀','link',1],['ohwell','Oh well','まあいいか','🤷','stance',1],['mostlikely','Most likely','たぶん','🤔','stance'],['bythetime2','Right now','今すぐ','⚡','scene'],['ofcourse2','Of course','もちろん','👌','stance'],['afterall','After all','結局のところ','🔚','link'],['atlast','At last','ついに','🎉','scene'],['asaresult','As a result','その結果','➡️','link'],['forinstance','For instance','たとえば','📝','link'],['onthe other hand','On the other hand','一方で','🔀','link'],['nodoubt','No doubt','まちがいなく','💯','stance'],['fromtimetotime','From time to time','ときどき','🎲','freq'],['onceagain','Once again','もう一度','🔁','link'],['thanksto','Thanks to you','あなたのおかげで','🙏','stance']].forEach(([id,en,ja,e,g,cas])=>{ if(typeof FRONTS!=='undefined' && !FRONTS.find(f=>f.en===en)) FRONTS.push({id:'i_'+id.replace(/[^a-z]/g,''),en,ja,e,g,casual:cas?1:0,idiom:1}); });
[['aslongas','as long as','〜する限り','🤝','if'],['eventhough','even though','〜なのに','🌗','reason'],['assoonas','as soon as','〜するとすぐに','⚡','time'],['asif','as if','まるで〜のように','🎭','co',1],['incase','in case','〜するといけないから','☂️','if'],['sothat','so that','〜するように','🎯','co',1],['bythetime','by the time','〜するころには','⏰','time'],['eversince','ever since','〜して以来','📌','time'],['nomatterwhat','no matter what','何があっても','💪','if'],['whenitcomes','whenever','〜するときはいつも','🔁','time'],['everytime','every time','〜するたびに','🔁','time'],['eachtime','each time','〜するたびに','🔁','time'],['thelasttime','the last time','〜した最後のとき','⏮️','time'],['thefirsttime','the first time','〜した最初のとき','1️⃣','time'],['thenexttime','the next time','〜する次のとき','⏭️','time'],['nexttime','next time','〜する次のとき','⏭️','time'],['lasttime','last time','〜した前のとき','⏮️','time'],['themoment','the moment','〜した瞬間に','⚡','time'],['theminute','the minute','〜したとたんに','⚡','time'],['nowthat','now that','〜なので（今や）','💡','reason']].forEach(([id,en,ja,e,kind,back])=>{ if(typeof CONJS!=='undefined' && !CONJS.find(c=>c.en===en)) CONJS.push({id:'i_'+id,en,ja,e,kind,back:back?1:0,idiom:1}); });
CONJ_SUF = {i_aslongas:'限り',i_eventhough:'のに',i_assoonas:'とすぐに',i_asif:'かのように',i_incase:'といけないから',i_sothat:'ように',i_bythetime:'ころには',i_eversince:'て以来',i_nomatterwhat:'としても',i_whenitcomes:'ときはいつも',i_everytime:'たびに',i_eachtime:'たびに',i_thelasttime:'最後のとき',i_thefirsttime:'最初のとき',i_thenexttime:'次のとき',i_nexttime:'次のとき',i_lasttime:'前のとき',i_themoment:'瞬間に',i_theminute:'とたんに',i_nowthat:'ので'};
MLEX = {need:{en:'need'},happen:{en:'happen'},get:{en:'get',past:'got',pp:'gotten',dbl:1},end:{en:'end'},tend:{en:'tend'},feel:{en:'feel',past:'felt',pp:'felt'},manage:{en:'manage'},mind:{en:'mind'}};
JPT = (tn,pres,past)=>tn==='past'?past:pres;
MPAT = {
 meaningto:{parts:[{aux:'have',role:'perf'},{aux:'be'},{lit:'meaning to'}],t:['pres','past'],noq:1,ja:(J,tn,n)=>'ずっと'+(n?J.na+'ない':J.d)+JPT(tn,'つもりだった','つもりだった')},
 endedup:{parts:[{lex:'end'},{lit:'up',ing:1}],t:['past','pres','fut'],noneg:1,ja:(J,tn)=>'結局'+J.d+JPT(tn,tn==='fut'?'ことになるだろう':'ことになる','ことになった')},
 needto:{parts:[{lex:'need'},{lit:'to'}],t:['pres','past'],ja:(J,tn,n)=>n?J.na+'なくてもいい':J.d+JPT(tn,'必要がある','必要があった')},
 tendto:{parts:[{lex:'tend'},{lit:'to'}],t:['pres','past'],ja:(J,tn,n)=>(n?J.na+'ない':J.d)+JPT(tn,'ことが多い','ことが多かった')},
 feellike:{parts:[{lex:'feel'},{lit:'like',ing:1}],t:['pres','past'],ja:(J,tn,n)=>J.ms+'たい気分'+(n?JPT(tn,'じゃない','じゃなかった'):JPT(tn,'だ','だった'))},
 thinkingof:{parts:[{aux:'be'},{lit:'thinking of',ing:1}],t:['pres','past'],noneg:1,ja:(J,tn)=>J.d+'ことを考えて'+JPT(tn,'いる','いた')},
 shouldhave:{parts:[{mod:'should'},{aux:'have',role:'perf'}],t:['pres'],noq:1,ja:(J,tn,n)=>n?J.na+'なければよかった':J.ta+'らよかった'},
 couldhave:{parts:[{mod:'could'},{aux:'have',role:'perf'}],t:['pres'],noq:1,ja:(J,tn,n)=>n?J.na+'かったかもしれない':J.ta+'かもしれない（できたのに）'.replace('（できたのに）','')},
 willhave:{parts:[{mod:'will'},{aux:'have',role:'perf'}],t:['pres'],noq:1,ja:(J,tn,n)=>J.st? 'もう'+(n?J.na+'ない':J.d)+'だろう' : 'もう'+J.te+(n?'いないだろう':'いるだろう')},
 wouldhave:{parts:[{mod:'would'},{aux:'have',role:'perf'}],t:['pres'],noq:1,ja:(J,tn,n)=>n?J.na+'なかっただろう':J.ta+'だろう'},
 mighthave:{parts:[{mod:'might'},{aux:'have',role:'perf'}],t:['pres'],noq:1,ja:(J,tn,n)=>n?J.na+'なかったかもしれない':J.ta+'かもしれない'},
 musthave:{parts:[{mod:'must'},{aux:'have',role:'perf'}],t:['pres'],noq:1,noneg:1,ja:(J,tn,n)=>J.ta+'にちがいない'},
 shall:{parts:[{mod:'shall'}],t:['pres'],ja:(J,tn,n,first,c)=>(c&&c.q)?(n?J.na+'ないでおきましょうか':J.ms+'ましょうか'):(n?J.na+'ないつもりだ':J.d+'つもりだ')},
 would:{parts:[{mod:'would'}],t:['pres'],ja:(J,tn,n,first,c)=>(c&&c.q)?(n?J.na+'ないでしょうか':J.te+'くれますか'):(n?J.na+'ないだろう':J.d+'だろう')},
 mightwant:{parts:[{mod:'might'},{lit:'want to'}],t:['pres'],noneg:1,noq:1,ja:(J)=>J.ta+'ほうがいいかも'},
 dontmind:{parts:[{lex:'mind',ing:1}],t:['pres','past'],neg:1,noq:1,ja:(J,tn)=>J.te+'も'+JPT(tn,'かまわない','かまわなかった')},
 managedto:{parts:[{lex:'manage'},{lit:'to'}],t:['past','pres'],ja:(J,tn,n)=>'なんとか'+(n?J.d+'ことができな'+JPT(tn,'い','かった'):J.pot.replace(/る$/,JPT(tn,'る','た')))},
 goingto:{parts:[{aux:'be'},{lit:'going to'}],t:['pres','past'],ja:(J,tn,n,first)=>(n?J.na+'ない':J.d)+(first?'つもり':'予定')+(tn==='past'?'だった':'だ')},
 usedto:{parts:[{lit:'used to'}],t:['pres'],noneg:1,noq:1,ja:(J,tn,n)=>'以前は'+(J.st? J.ta : J.te+'いた')},
 hadbetter:{parts:[{lit:'had better',canNeg:1}],t:['pres'],noq:1,ja:(J,tn,n)=>n?J.na+'ないほうがいい':J.ta+'ほうがいい'},
 supposedto:{parts:[{aux:'be'},{lit:'supposed to'}],t:['pres','past'],ja:(J,tn,n)=>(n?J.na+'ない':J.d)+'ことになって'+(tn==='past'?'いた':'いる')},
 aboutto:{parts:[{aux:'be'},{lit:'about to'}],t:['pres','past'],ja:(J,tn,n)=>J.d+(tn==='past'?'ところだった':'ところだ')},
 wouldlike:{parts:[{mod:'would'},{lit:'like to'}],t:['pres'],ja:(J,tn,n)=>J.ms+(n?'たくない':'たい')+'です'},
 mightaswell:{parts:[{mod:'might'},{lit:'as well'}],t:['pres'],noq:1,ja:(J,tn,n)=>J.ta+'ほうがましだ'},
 havegotto:{parts:[{aux:'have',role:'mhave'},{lit:'got to'}],t:['pres'],ja:(J,tn,n)=>J.na+'なきゃ'},
 happento:{parts:[{lex:'happen'},{lit:'to'}],t:['pres','past'],ja:(J,tn,n)=>'たまたま'+(tn==='past'?(n?J.na+'なかった':J.ta):(n?J.na+'ない':J.d))},
 getto:{parts:[{lex:'get'},{lit:'to'}],t:['pres','past','fut'],ja:(J,tn,n)=>J.d+'ことが'+(n?'できない':'できる').replace(/る$/,tn==='past'?'た':'る').replace(/ない$/,tn==='past'?'なかった':'ない')},
 affordto:{parts:[{mod:'can',past:'could'},{lit:'afford to'}],t:['pres','past'],ja:(J,tn,n)=>J.d+'余裕が'+(tn==='past'?(n?'なかった':'あった'):(n?'ない':'ある'))},
};
[['goingto','be going to','〜するつもり','📅'],['usedto','used to','よく〜したものだ','🕰️'],['hadbetter','had better','〜したほうがいい','☝️'],['supposedto','be supposed to','〜することになっている','📋'],['aboutto','be about to','まさに〜するところ','⏱️'],['wouldlike','would like to','〜したいです','🙏'],['mightaswell','might as well','〜したほうがまし','🤷'],['havegotto','have got to','〜しなきゃ','❗'],['happento','happen to','たまたま〜する','🎲'],['getto','get to','〜できる（機会）','🎟️'],['affordto','can afford to','〜する余裕がある','💰'],['meaningto','have been meaning to','ずっと〜しようと思ってた','💭'],['endedup','ended up …ing','結局〜することになった','🌀'],['tendto','tend to','〜しがち','📈'],['needto','need to','〜する必要がある','📝'],['feellike','feel like …ing','〜したい気分','😋'],['thinkingof','be thinking of …ing','〜しようかと思ってる','🤔'],['shouldhave','should have …ed','〜しとけばよかった','😣'],['couldhave','could have …ed','〜できたかも','🤔'],['wouldhave','would have …ed','〜しただろう','💭'],['willhave','will have …ed','もう〜しているだろう','⏳'],['mighthave','might have …ed','〜したかも','🤷'],['musthave','must have …ed','〜したにちがいない','🔎'],['mightwant','might want to','〜した方がいいかも','👉'],['would','would','〜だろう・〜してくれる？','🧭'],['shall','shall','〜しましょうか？','🤝'],['dontmind','don\'t mind …ing','〜しても別にいい','🙆'],['managedto','managed to','なんとか〜できた','💪']].forEach(([id,en,ja,e])=>{ if(typeof MODALS!=='undefined' && !MODALS.find(m=>m.id===id)) MODALS.push({id,en,ja,e,idiom:1}); });
IDV = [
 {id:'i_makesure',en:'make',past:'made',pp:'made',tail:'sure',ja:'確かめる',jt:'i',fr:'intr',e:'✅',an:'bob',pv:{base:'make',p:'idiom'},mean:'決まった言い方：確かめる・必ず〜する',star:3},
 {id:'i_makesense',en:'make',past:'made',pp:'made',tail:'sense',ja:'意味が通じる',jt:'i',fr:'intr',e:'💡',an:'bob',pv:{base:'make',p:'idiom'},mean:'決まった言い方：筋が通る',star:3},
 {id:'i_makeupmind',en:'make',past:'made',pp:'made',tail:'up {poss} mind',ja:'決心する',jt:'s',fr:'intr',e:'🧭',an:'bob',pv:{base:'make',p:'idiom'},mean:'決まった言い方：心を決める',star:3},
 {id:'i_believein',en:'believe',prep:'in',ja:'信じる',jt:'i',fr:'tr',t:['person','abstract'],e:'🙏',an:'bob',pv:{base:'believe',p:'in'},part:'を',stative:1,mean:'〜の中に信をおく → 〜の存在・力を信じる',star:3},
 {id:'i_thinkof',en:'think',past:'thought',pp:'thought',prep:'of',ja:'思いつく',jt:'g',fr:'tr',t:['any'],e:'💭',an:'think',pv:{base:'think',p:'of'},part:'のことを',mean:'〜のことを思いうかべる',star:3},
 {id:'i_dreamof',en:'dream',prep:'of',ja:'夢見る',jt:'i',fr:'tr',t:['any'],e:'💭',an:'bob',pv:{base:'dream',p:'of'},part:'を',mean:'〜を夢に見る',star:3},
 {id:'i_dreamabout',en:'dream',prep:'about',ja:'夢を見る',jt:'g',fr:'tr',t:['any'],e:'💭',an:'bob',pv:{base:'dream',p:'about'},part:'の',mean:'〜の夢を見る',star:3},
 {id:'i_askfor',en:'ask',prep:'for',ja:'たのむ',jt:'g',fr:'tr',t:['any'],e:'🙋',an:'bob',pv:{base:'ask',p:'for'},part:'を',mean:'〜を求める',star:3},
 {id:'i_hopefor',en:'hope',prep:'for',ja:'願う',jt:'g',fr:'tr',t:['any'],e:'🙏',an:'bob',pv:{base:'hope',p:'for'},part:'を',mean:'〜を願う',star:3},
 {id:'i_wishfor',en:'wish',prep:'for',ja:'願う',jt:'g',fr:'tr',t:['any'],e:'🌠',an:'bob',pv:{base:'wish',p:'for'},part:'を',mean:'〜を願う',star:3},
 {id:'i_prayfor',en:'pray',prep:'for',ja:'祈る',jt:'g',fr:'tr',t:['any'],e:'🙏',an:'bob',pv:{base:'pray',p:'for'},part:'を',mean:'〜を祈る',star:3},
 {id:'i_longfor',en:'long',prep:'for',ja:'あこがれる',jt:'i',fr:'tr',t:['any'],e:'💫',an:'bob',pv:{base:'long',p:'for'},part:'に',mean:'〜をほしがる',star:3},
 {id:'i_learnabout',en:'learn',prep:'about',ja:'学ぶ',jt:'g',fr:'tr',t:['any'],e:'📖',an:'bob',pv:{base:'learn',p:'about'},part:'について',mean:'〜について学ぶ',star:3},
 {id:'i_hearof',en:'hear',past:'heard',pp:'heard',prep:'of',ja:'聞く',jt:'g',fr:'tr',t:['any'],e:'👂',an:'bob',pv:{base:'hear',p:'of'},part:'のことを',mean:'〜のことを耳にする',star:3},
 {id:'i_hearabout',en:'hear',past:'heard',pp:'heard',prep:'about',ja:'聞く',jt:'g',fr:'tr',t:['any'],e:'👂',an:'bob',pv:{base:'hear',p:'about'},part:'のことを',mean:'〜のことを耳にする',star:3},
 {id:'i_thinkabout',en:'think',past:'thought',pp:'thought',prep:'about',ja:'考える',jt:'i',fr:'tr',t:['any'],e:'💭',an:'think',pv:{base:'think',p:'about'},part:'について',mean:'〜のまわりを思う → 〜について考える',star:3},
 {id:'i_takeadvantage',en:'take',past:'took',pp:'taken',prep:'advantage of',ja:'利用する',jt:'s',fr:'tr',t:['offer','abstract','event'],e:'🎯',an:'bob',pv:{base:'take',p:'idiom'},part:'を',mean:'決まった言い方：〜をうまく利用する',star:3},
 {id:'i_keepintouch',en:'keep',past:'kept',pp:'kept',tail:'in touch',ja:'連絡を取り合う',jt:'g',fr:'intr',e:'📱',an:'talk',pv:{base:'keep',p:'idiom'},mean:'決まった言い方：連絡を取り合う',star:3},
 {id:'i_haveagoodtime',en:'have',past:'had',pp:'had',s3:'has',tail:'a good time',ja:'楽しく過ごす',jt:'g',fr:'intr',e:'🥳',an:'dance',pv:{base:'have',p:'idiom'},mean:'決まった言い方：楽しく過ごす',star:3},
 {id:'i_lookforwardto',en:'look',prep:'forward to',ja:'楽しみにする',jt:'s',fr:'tr',t:['event'],e:'🤩',an:'dance',pv:{base:'look',p:'idiom'},part:'を',mean:'前のほうへ目を向ける → 楽しみにする',star:3},
 {id:'i_takepartin',en:'take',past:'took',pp:'taken',prep:'part in',ja:'参加する',jt:'s',fr:'tr',t:['event','sport'],e:'🙋',an:'dance',pv:{base:'take',p:'idiom'},part:'に',mean:'決まった言い方：〜に参加する',star:2},
 {id:'i_payattention',en:'pay',past:'paid',pp:'paid',prep:'attention to',ja:'注意を払う',jt:'g',fr:'tr',t:['any'],e:'👂',an:'bob',pv:{base:'pay',p:'idiom'},part:'に',mean:'決まった言い方：〜に注意を払う',star:2},
 {id:'i_takeplace',en:'take',past:'took',pp:'taken',tail:'place',ja:'行われる',jt:'i',fr:'intr',e:'📍',an:'bob',pv:{base:'take',p:'idiom'},mean:'決まった言い方：（行事が）行われる',star:2},
 {id:'i_focuson',en:'focus',prep:'on',ja:'集中する',jt:'s',fr:'tr',t:['homework','abstract','sport','lang'],e:'🎯',an:'bob',pv:{base:'focus',p:'on'},part:'に',mean:'〜にくっつける → 〜に集中する',star:2},
 {id:'i_relyon',en:'rely',prep:'on',ja:'頼る',jt:'g',fr:'tr',t:['person','thing'],e:'🤝',an:'bob',pv:{base:'rely',p:'on'},part:'に',mean:'〜にくっついて → 頼る',star:2},
 {id:'i_leadto',en:'lead',past:'led',pp:'led',prep:'to',ja:'つながる',jt:'g',fr:'tr',t:['abstract','event'],e:'➡️',an:'bob',pv:{base:'lead',p:'to'},part:'に',mean:'〜のほうへ導く → 〜につながる',star:2},
 {id:'i_looklike',en:'look',prep:'like',ja:'似ている',jt:'i',fr:'tr',t:['person','animal','thing'],e:'👯',an:'bob',pv:{base:'look',p:'like'},part:'に',stative:1,mean:'〜のように見える → 〜に似ている',star:3},
];
SPREP = {x_good:{p:'at',jp:'が',ja:'得意',jt:'na',t:['sport','instr','game','lang','any']},x_bad:{p:'at',jp:'が',ja:'苦手',jt:'na',t:['sport','instr','game','lang','any']},c1_interested:{p:'in',jp:'に',t:['any']},c1_afraid:{p:'of',jp:'が',ja:'こわい',jt:'i',t:['animal','person','any']},proud:{p:'of',jp:'が',t:['person','abstract','any']},famous:{p:'for',jp:'で',t:['food','thing','any']},full:{p:'of',jp:'で',ja:'いっぱい',jt:'na',t:['food','thing','any']},x_different:{p:'from',jp:'と',t:['person','thing','any']},c2_similar:{p:'to',jp:'に',t:['person','thing','any']},ready:{p:'for',jp:'の',t:['event','any']},late:{p:'for',jp:'に',t:['event','any']},kind:{p:'to',jp:'に',t:['person','animal']},angry:{p:'with',jp:'に',t:['person']},x_worried:{p:'about',jp:'を',t:['person','event','abstract','any']},busy:{p:'with',jp:'で',t:['homework','event','abstract','any']},x_nervous:{p:'about',jp:'で',t:['event','any']},excited:{p:'about',jp:'に',t:['event','any']},x_sorry:{p:'for',jp:'に',ja:'すまないと思っている',jt:'raw',t:['person']}};
if(typeof VX!=='undefined') VX.lex.states.push({id:'x_incharge',en:'in charge',ja:'担当',jt:'na',e:'🧑‍💼',cefr:2,idiom:1});
SPREP.x_incharge={p:'of',jp:'の',t:['any']};
[['up to date','最新','na'],['out of date','時代おくれ','na'],['out of order','故障している','raw'],['in a hurry','急いでいる','raw'],['in trouble','困っている','raw'],['in love','恋をしている','raw'],['on sale','セール中','na'],['on time','時間どおり','na'],['in time','間に合っている','raw'],['out of stock','品切れ','na'],['in stock','在庫がある','raw'],['on fire','燃えている','raw'],['in danger','危険な状態','na'],['on a diet','ダイエット中','na'],['on vacation','休暇中','na'],['on duty','勤務中','na'],['off duty','非番','na'],['out of breath','息が切れている','raw'],['in a good mood','きげんがいい','raw'],['in a bad mood','きげんが悪い','raw'],['out of work','失業中','na'],['under pressure','プレッシャーを受けている','raw'],['in pain','痛みがある','raw'],['in a rush','急いでいる','raw'],['on the phone','電話中','na'],['in a meeting','会議中','na'],['on business','仕事で出かけている','raw']].forEach(([en,ja,jt])=>{ if(typeof VX!=='undefined') VX.lex.states.push({id:'x_si_'+en.replace(/\W+/g,'_'),en,ja,jt,e:'🔖',cefr:3,idiom:1,sidiom:1}); });
[['i_rightnow','right now','今すぐ',['prog','fut','pres']],['i_atthemoment','at the moment','今のところ',['prog','pres']],['i_allthetime','all the time','いつも',['pres','past','prog']],['i_theotherday','the other day','先日',['past','pastprog']],['i_longago','long ago','ずっと昔',['past','pastprog']],['i_bynow','by now','今ごろは',['perf','pres']],['i_atthetime','at the time','その時',['past','pastprog']],['i_atthesametime','at the same time','同時に',['pres','past','fut','prog','pastprog']],['i_thesedays','these days','最近',['pres','prog']],['i_sofar','so far','これまでに',['perf','perfprog']],['i_inthemeantime','in the meantime','そのあいだに',['pres','past','fut']]].forEach(([id,en,ja,ts])=>{ if(typeof VX!=='undefined') VX.lex.times.push({id,en,ja,e:'🕒',ts,sky:null,cefr:1,idiom:1}); });
[['i_overthere','over there','向こうで'],['i_nextdoor','next door','となりで'],['i_allover','all over the world','世界じゅうで'],['i_ontheway','on the way','途中で'],['i_outthere','out there','世の中で']].forEach(([id,en,ja])=>{ if(typeof VX!=='undefined') VX.lex.places.push({id,en,to:en,ja,jat:ja.replace(/で$/,'へ'),jn:ja.replace(/で$/,''),e:'📍',cefr:1,idiom:1}); });
[['i_intime','in time','間に合って'],['i_asusual','as usual','いつものように'],['i_atonce','at once','すぐに'],['i_byfar','by far','ずば抜けて']].forEach(([id,en,ja])=>{ if(typeof VX!=='undefined') VX.lex.manners.push({id,en,ja,e:'✨',cefr:1,idiom:1}); });
}
