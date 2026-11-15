(async () => {
'use strict';
const T=window.MGStrings, art=window.MGArt, bridge=window.MergeBridge, mock=Boolean(window.MGPractice);
const app=document.querySelector('#mg-app'), sheet=document.querySelector('#mg-sheet'), content=sheet.querySelector('.mg-content');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=()=>new Date().toLocaleDateString('sv-SE');
const key='cs:merge:'+(mock?'practice:':'live:')+'v1';
const navPaths={bag:'M3 9h18v12H3z M2 5h20v4H2z M9 13h6',book:'M12 6Q7 2 2 5v15q5-3 10 0 5-3 10 0V5q-5-3-10 1zm0 0v14',study:'m2 9 10-5 10 5-10 5z M6 12v5q6 4 12 0v-5m3-2v7',hint:'M4 5h16v12H9l-5 4z M8 10h1m3 0h1m3 0h1'};
const svg=k=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+navPaths[k]+'"/></svg>';
let data,e,questions,game,s,aff={},coins=0,reaction=null,audioContext=null,busy=false,halted=false,choice=null,gesture=null,toastTimer,modal='',quiz=null,timer;
const button=(label,act,cls='mg-btn',extra='')=>'<button class="'+cls+'" data-act="'+act+'" '+extra+'>'+label+'</button>';
function fail(message){halted=true;clearInterval(timer);if(sheet.open)sheet.close();app.innerHTML='<section class="mg-content"><h2>'+T.workshop+'</h2><p role="alert">'+esc(message)+'</p>'+button(T.reload,'reload')+'</section>';}
function chime(event){
 if(!s.sound || !['merged','unlocked','gift','generated','correct'].includes(event))return;
 try{
   const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
   audioContext ||= new C();audioContext.resume().catch(()=>{});
   const notes=event==='generated'?[540]:event==='gift'?[523,659,784]:[587,784];
   notes.forEach((hz,i)=>{const start=audioContext.currentTime+i*.075,osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=hz;gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(.055,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+.16);osc.connect(gain);gain.connect(audioContext.destination);osc.start(start);osc.stop(start+.18);});
 }catch{/* Audio is optional on silent or restricted devices. */}
}
function toast(message){const el=document.querySelector('.mg-toast');el.textContent=message;el.classList.add('mg-show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('mg-show'),2100);}
function dialog(title,html,id){modal=id;sheet.querySelector('h2').textContent=title;sheet.querySelector('.mg-close').setAttribute('aria-label',T.close);content.innerHTML=html;if(!sheet.open)sheet.showModal();content.scrollTop=0;}
sheet.querySelector('.mg-close').onclick=()=>sheet.close();
sheet.addEventListener('close',()=>{modal='';quiz=null;});sheet.addEventListener('click',ev=>{if(ev.target===sheet){const r=sheet.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)sheet.close();}});
const resident=id=>data.residents.find(n=>n.id===id);
function portrait(id,cls){const n=resident(id);return '<img draggable="false" class="'+cls+'" src="'+esc(n.image)+'" alt="'+esc(n.name)+'">';}
function info(code){const o=game.parse(code);if(o.kind==='i') return data.lines[o.family].items[o.rank-1];const m=data.machines[o.family];return {name:o.kind==='p'?m.part:m.name};}
function icon(code){const {kind,family,rank}=game.parse(code),m=data.machines[family];let html;
 if(kind==='g')html=art.machine(m.art);
 else if(kind==='p')html='<span class="mg-emoji">'+['⚙️','🔩','🔧','🐚','🧵','🔑'][family]+'</span>';
 else html=art.item(family,rank)||'<span class="mg-emoji">'+esc(info(code).icon)+'</span>';
 return '<span class="mg-icon" aria-hidden="true">'+html+'</span>';
}
function number(v){if(!Number.isSafeInteger(v)||v<0)throw Error(T.error);return v;}
function save(){localStorage.setItem(key,JSON.stringify(s));}
async function refreshWallet(){coins=number(await bridge.coins.get());await Promise.all(data.residents.filter(r=>r.id!=='chunkkun').map(async n=>{aff[n.id]=number(await bridge.affection.get(n.id));}));}
async function balance(x){return number(await (x.type==='coins'?bridge.coins.get():bridge.affection.get(x.id)));}
async function settle(){
 const x=s.pending;if(!x)return;
 const current=await balance(x);
 if(current===x.before){
   if(x.type==='coins')await bridge.coins.add(x.n,'merge.sell');else await bridge.affection.add(x.id,x.n);
 }
 if(await balance(x)!==x.before+x.n)throw Error(T.resolve);
 delete s.pending;save();await refreshWallet();
}
async function action(fn){
 if(busy||halted)return;busy=true;
 try{const before=game.level(s);const r=await fn()||{};
   if(r.error){toast(T[r.error]);return;}
   game.discover(s);s.serial++;
   if(r.effect){s.pending={...r.effect,before:await balance(r.effect)};save();await settle();}
   else save();
   if(r.select!==undefined)choice=r.select;
   reaction=r.event==='gift'?{id:r.old,until:Date.now()+5500,text:T.gifted+' ♥ +'+r.gain+(r.part?'　'+info(r.part).name+' ×1':'')}:null;
   chime(r.event);
   if(r.close&&sheet.open)sheet.close();
   render();
   if(r.at!=null)animate([r.at],'mg-pop');
   if(r.message)toast(r.message+(game.level(s)>before?'　'+T.levelUp:''));
 }catch(err){console.error(err);fail(err.message===T.resolve?T.resolve:T.error);}finally{busy=false;}
}
function drawTop(){
 const lvl=game.level(s),p=s.xp%e.xpPerLevel;
 app.querySelector('.mg-level').innerHTML='<span>'+T.lv+lvl+'</span><span class="mg-xp"><i style="width:'+p/e.xpPerLevel*100+'%"></i></span><span>'+p+'/'+e.xpPerLevel+'</span>';
 app.querySelector('.mg-wallet').innerHTML=button('<span class="mg-zap">ϟ</span>'+s.energy,'study','mg-pill','aria-label="'+T.energy+' '+s.energy+'"')+button('<span class="mg-coin">★</span>'+coins,'stats','mg-pill','aria-label="'+T.coin+' '+coins+'"');
}
function drawOrders(){
 app.querySelector('.mg-orders').innerHTML=s.orders.map((q,i)=>{const n=resident(q.id),ready=game.available(s,q.want);return button(portrait(q.id,'mg-face')+'<span class="mg-bubble">'+icon(q.want)+'</span><strong>'+esc(n.name)+(ready?' · '+T.gift:'')+'</strong>','order:'+i,'mg-order'+(ready?' mg-ready':''),'aria-label="'+esc(n.name+'　'+info(q.want).name+'　'+(ready?T.gift:T.wish))+'"');}).join('');
}
function cell(t,i){
 let html='',label=T.empty,cls='mg-cell';if(t){const o=game.parse(t.code);cls+=' mg-occupied'+(t.locked?' mg-locked':'');label=info(t.code).name+' '+T.lv+o.rank+(t.locked?' '+T.lockedTag:'');
 html=icon(t.code)+'<span class="mg-rank">'+o.rank+'</span>';const mark=t.locked?'▧':o.kind==='g'?(t.rest>Date.now()?'◷':'ϟ'):o.kind==='p'?'✚':'';
 if(mark)html+='<span class="mg-mark">'+mark+'</span>';}
 return '<button class="'+cls+(choice===i?' mg-picked':'')+'" data-cell="'+i+'" aria-label="'+esc(label)+'">'+html+'</button>';
}
function panel(){
 const el=app.querySelector('.mg-panel'),t=choice!==null&&s.board[choice];
 if(!t&&reaction&&reaction.until>Date.now()){el.innerHTML=portrait(reaction.id,'mg-avatar')+'<div class="mg-blurb"><strong>'+esc(resident(reaction.id).name)+'</strong>'+esc(reaction.text)+'</div>';return;}
 if(!t){el.innerHTML=portrait('chunkkun','mg-avatar')+'<div class="mg-blurb"><strong>'+T.hint+'</strong>'+(s.gifts?T.guide:T.first)+'</div>'+button('？','help','mg-small','aria-label="'+T.how+'"');return;}
 const o=game.parse(t.code);let hint=t.locked?T.lockedInfo:o.kind==='g'?(t.rest>Date.now()?T.release+Math.ceil((t.rest-Date.now())/1000)+T.sec:T.use+' '+(e.machineUses[o.rank-1]-(t.rest?0:t.used))):o.kind==='p'?T.partTip:T.itemTip;
 el.innerHTML='<div class="mg-avatar">'+icon(t.code)+'</div><div class="mg-blurb"><strong>'+esc(info(t.code).name)+' · '+T.lv+o.rank+'</strong><small>'+hint+'</small></div><div class="mg-actions">'+(!t.locked&&o.kind!=='g'?button(T.bag,'stow','mg-small'):'')+(!t.locked&&o.kind==='i'?button(T.sell,'sell','mg-small'):'')+'</div>';
}
function render(){
 if(!app.querySelector('.mg-board'))app.innerHTML='<header class="mg-top"><div class="mg-logo"><span class="mg-medal" aria-hidden="true">⚓</span><div><h1>'+T.title+'</h1><div class="mg-level"></div></div></div><div class="mg-wallet"></div></header><section class="mg-harbor"><div class="mg-heading"><h2>'+T.requests+'</h2></div><div class="mg-orders"></div></section><section class="mg-work"><div class="mg-heading"><h2>⚓ '+T.workshop+'</h2><span class="mg-meta"></span></div><div class="mg-board" role="group" aria-label="'+T.board+'"></div></section><section class="mg-panel"></section><nav class="mg-nav">'+['bag','book','study','hint'].map(k=>button(svg(k)+T[k],k,'mg-navbtn')).join('')+'</nav>';
 drawTop();drawOrders();app.querySelector('.mg-meta').textContent=T.progress+' '+s.gifts+' '+T.times;
 app.querySelector('.mg-board').innerHTML=s.board.map(cell).join('');panel();
}
function animate(indices,cls){for(const i of indices){const b=app.querySelector('[data-cell="'+i+'"]');if(b){b.classList.remove(cls);void b.offsetWidth;b.classList.add(cls);}}}
function useCell(i){
 if(busy||halted)return;
 const t=s.board[i],a=choice!==null&&s.board[choice];
 if(a&&!a.locked&&choice!==i&&(!t||t.code===a.code)){move(choice,i);return;}
 choice=t?i:null;
 if(t&&!t.locked&&t.code[0]==='g'){
   action(()=>{const r=game.generate(s,i,Date.now());if(r.error){render();return r;}return {...r,message:T.generated+' · '+info(s.board[r.at].code).name};});return;
 }
 render();if(t?.locked)toast(T.locked);
}
function move(from,to){action(()=>{const r=game.move(s,from,to);return r.error?r:{...r,select:to,message:T[r.event]};});}
function orderPage(i){
 const q=s.orders[i],n=resident(q.id),o=game.parse(q.want),line=data.lines[o.family],ready=game.available(s,q.want);
 const chain=line.items.slice(0,o.rank).map((item,j)=>icon('i'+o.family+'.'+(j+1))).join(' › ');
 dialog(n.name,'<div class="mg-row">'+portrait(q.id,'mg-portrait')+'<div><span class="mg-chip">♥ '+T.aff+' '+aff[q.id]+'</span><h3>'+esc(info(q.want).name)+'</h3><small>'+T.lv+o.rank+' · '+esc(line.name)+'</small></div></div><p>'+T.from+' · '+esc(data.machines[line.machine].name)+'</p><div class="mg-lines">'+chain+'</div>'+button(ready?T.gift+'　♥ +'+(e.affectionBase+o.rank-1):T.details,ready?'give:'+i:'line:'+o.family,'mg-btn mg-primary'),'order');
}
function bagPage(){
 const tiles=s.bag.map((t,i)=>button(icon(t.code)+'<small>'+esc(info(t.code).name)+'<br>'+T.lv+game.parse(t.code).rank+'</small>','take:'+i,'mg-tile')).join('');
 dialog(T.bag+'　'+s.bag.length+'/'+game.capacity(s),'<p>'+(s.bag.length?T.bagHelp:T.bagEmpty)+'</p><div class="mg-grid">'+tiles+'</div>','bag');
}
function bookPage(){
 const count=Object.keys(s.known).length,total=data.lines.reduce((n,l)=>n+l.items.length,0);
 dialog(T.book,'<p>'+T.bookSub+'　<b>'+count+' / '+total+'</b> '+(count===total?T.completed:'')+'</p><div class="mg-list">'+data.lines.map((l,f)=>button(art.machine(data.machines[l.machine].art)+'<b>'+esc(l.name)+'</b><small>'+l.items.filter((_,i)=>s.known['i'+f+'.'+(i+1)]).length+'/'+l.items.length+' ›</small>','line:'+f,'mg-btn mg-bookrow')).join('')+'</div>','book');
}
function linePage(f){const l=data.lines[f];dialog(l.name,'<div class="mg-row">'+art.machine(data.machines[l.machine].art)+'<b>'+esc(data.machines[l.machine].name)+'</b></div><div class="mg-grid">'+l.items.map((it,i)=>{const c='i'+f+'.'+(i+1),known=s.known[c];return '<div class="mg-tile '+(known?'':'mg-faded')+'">'+icon(c)+'<small>'+T.lv+(i+1)+'<br>'+esc(it.name)+'<br>'+(known?T.made:T.undiscovered)+'</small></div>';}).join('')+'</div><p>'+T.madePair+'</p>'+button(T.back,'book','mg-btn mg-primary'),'line');}
function hint(){
 const ready=s.orders.findIndex(q=>game.available(s,q.want));if(ready>=0){orderPage(ready);return;}
 for(let i=0;i<s.board.length;i++){const a=s.board[i];if(!a||a.locked)continue;const o=game.parse(a.code);if(o.rank>=game.maxRank(o)&&o.kind!=='p')continue;const j=s.board.findIndex((b,k)=>k!==i&&b?.code===a.code);if(j>=0){animate([i,j],'mg-hinted');toast(T.mergeHint);return;}}
 const m=data.lines[game.parse(s.orders[0].want).family].machine,ids=s.board.map((t,i)=>t?.code.startsWith('g'+m+'.')?i:-1).filter(i=>i>=0);animate(ids,'mg-hinted');toast(s.board.every(Boolean)?T.noHint:T.makeHint);
}
function stats(){dialog(T.workshop,'<div class="mg-row">'+portrait('chunkkun','mg-portrait')+'<div><h3>'+T.level+' '+game.level(s)+'</h3><p>'+T.toLevel+' '+(e.xpPerLevel-s.xp%e.xpPerLevel)+' XP</p></div></div><p>'+T.giftCount+'　'+s.gifts+'　 ·　'+T.coin+'　'+coins+'</p><div class="mg-list">'+data.residents.filter(n=>n.id!=='chunkkun').map(n=>'<div class="mg-heading"><span>'+esc(n.name)+'</span><b>♥ '+aff[n.id]+'</b></div>').join('')+'</div>','stats');}
async function syncEnergy(){
 const answers=number(await bridge.english.solvedToday());
 if(game.tick(s,Date.now(),answers,day()))save();
 return answers;
}
async function study(){
 if(busy||halted)return;busy=true;
 try{const count=await syncEnergy();drawTop();quiz=questions.length?{q:questions[count%questions.length],done:false}:null;
 const rest=s.energy>=e.energyMax?T.energyFull:T.restoring+' '+Math.max(1,Math.ceil((s.energyAt+e.recoverySeconds*1000-Date.now())/1000))+T.sec;
 let html='<div class="mg-row">'+portrait('sora','mg-portrait')+'<div><h3>ϟ '+s.energy+' / '+e.energyMax+'</h3><small>'+rest+'</small></div></div>';
 if(mock&&quiz){html+='<p>'+T.quizLead+' <b>ϟ +'+e.perAnswer+'</b></p><h3 class="mg-question">'+esc(quiz.q.prompt)+'</h3>'+quiz.q.options.map((o,i)=>button(esc(o),'answer:'+i,'mg-btn mg-option')).join('')+'<div class="mg-result" role="status"></div>';}
 else html+='<p>'+(mock?T.noQuestions:T.baseEnglish)+'</p>'+button(T.sync,'study','mg-btn mg-primary');
 dialog(T.studyTitle,html,'study');
 }catch(err){fail(T.error);}finally{busy=false;}
}
async function answer(i){
 if(busy||halted||!mock||!quiz||quiz.done)return;const b=content.querySelector('[data-act="answer:'+i+'"]'),result=content.querySelector('.mg-result');
 if(i!==quiz.q.answer){b.disabled=true;b.classList.add('mg-wrong');result.textContent=T.wrong;return;}
 busy=true;quiz.done=true;
 try{const prior=s.energy;window.MGPractice.answer();await syncEnergy();drawTop();
 chime('correct');content.querySelectorAll('.mg-option').forEach(el=>el.disabled=true);b.classList.add('mg-correct');
 content.querySelector('h3').textContent='ϟ '+s.energy+' / '+e.energyMax;
 result.innerHTML=T.correct+' '+(s.energy>prior?'ϟ +'+(s.energy-prior):T.capMsg)+'<p>'+button(T.next,'study','mg-btn mg-primary')+'</p>';
 }catch(err){fail(T.error);}finally{busy=false;}
}
function dispatch(act){
 const [k,idx]=act.split(':'),i=Number(idx);if(k==='reload'){location.reload();return;}if(busy||halted)return;
 switch(k){
 case 'order':orderPage(i);break;
 case 'give':action(()=>{const r=game.gift(s,i,aff);return r.error?r:{...r,select:null,close:true,message:resident(r.old).name+'「'+T.gifted+'」 ♥ +'+r.gain+(r.part?'　'+T.partWon:'')};});break;
 case 'hint':hint();break;case 'book':bookPage();break;case 'line':linePage(i);break;case 'bag':bagPage();break;case 'stats':stats();break;case 'study':study();break;case 'answer':answer(i);break;
 case 'stow':action(()=>{const t=s.board[choice];if(!t||t.locked||t.code[0]==='g')return {error:'bagMachine'};if(s.bag.length>=game.capacity(s))return {error:'bagFull'};s.bag.push(t);s.board[choice]=null;return {select:null,message:T.stored};});break;
 case 'take':action(()=>{const idx=game.emptyNear(s,0);if(idx<0)return {error:'full'};s.board[idx]=s.bag.splice(i,1)[0];return {select:idx,at:idx,close:true,message:T.taken};});break;
 case 'sell':{const t=s.board[choice];if(!t||t.locked||t.code[0]!=='i')break;const value=e.sellByRank[game.parse(t.code).rank-1];dialog(T.sellConfirm,'<div class="mg-row">'+icon(t.code)+'<b>'+esc(info(t.code).name)+'</b></div>'+button(T.sell+'　🪙 +'+value,'confirmSale','mg-btn mg-primary'),'sell');break;}
 case 'confirmSale':action(()=>{const t=s.board[choice];if(!t||t.locked||t.code[0]!=='i')return {error:'missing'};const n=e.sellByRank[game.parse(t.code).rank-1];s.board[choice]=null;return {effect:{type:'coins',n},select:null,close:true,message:T.sold+'　+'+n};});break;
 case 'audio':action(()=>{s.sound=!s.sound;setTimeout(()=>dispatch('help'),0);return {};});break;
 case 'help':dialog(T.how,'<div class="mg-row">'+portrait('chunkkun','mg-portrait')+'<b>'+T.intro+'</b></div><p>'+T.helpText+'</p><p>'+T.start+'</p><p>'+button(T.sound+'　'+(s.sound?T.on:T.off),'audio','mg-btn')+'</p>'+button(T.close,'close','mg-btn mg-primary'),'help');break;
 case 'close':sheet.close();break;
 }
}
document.addEventListener('click',ev=>{const cmd=ev.target.closest('[data-act]');if(cmd){dispatch(cmd.dataset.act);return;}const cell=ev.target.closest('[data-cell]');if(cell&&!suppressClick)useCell(+cell.dataset.cell);});
let suppressClick=false;
const at=(x,y)=>document.elementFromPoint(x,y)?.closest('[data-cell]');
app.addEventListener('pointerdown',ev=>{const b=ev.target.closest('[data-cell]');if(!b||busy||halted||!ev.isPrimary||ev.button!==0)return;const from=+b.dataset.cell,t=s.board[from];if(!t||t.locked)return;gesture={id:ev.pointerId,from,x:ev.clientX,y:ev.clientY,source:b,ghost:null};b.setPointerCapture(ev.pointerId);});
app.addEventListener('pointermove',ev=>{const g=gesture;if(!g||ev.pointerId!==g.id)return;
 if(!g.ghost&&Math.hypot(ev.clientX-g.x,ev.clientY-g.y)>6){g.ghost=document.createElement('div');g.ghost.className='mg-ghost';g.ghost.innerHTML=icon(s.board[g.from].code);document.body.append(g.ghost);g.source.classList.add('mg-dragfrom');}
 if(g.ghost){g.ghost.style.left=ev.clientX+'px';g.ghost.style.top=ev.clientY+'px';app.querySelector('.mg-over')?.classList.remove('mg-over');at(ev.clientX,ev.clientY)?.classList.add('mg-over');}
});
function endDrag(ev,cancel=false){const g=gesture;if(!g||g.id!==ev.pointerId)return;gesture=null;app.querySelector('.mg-over')?.classList.remove('mg-over');g.source.classList.remove('mg-dragfrom');
 if(g.ghost){g.ghost.remove();suppressClick=true;setTimeout(()=>suppressClick=false,100);const b=at(ev.clientX,ev.clientY);if(!cancel&&b&&+b.dataset.cell!==g.from)move(g.from,+b.dataset.cell);}
}
app.addEventListener('pointerup',ev=>endDrag(ev));app.addEventListener('pointercancel',ev=>endDrag(ev,true));
async function boot(){
 try{
 const names=mock?['items','economy','questions']:['items','economy'];let config={};
 if(location.protocol==='file:') config=JSON.parse(document.getElementById('mg-offline').textContent);
 else await Promise.all(names.map(async k=>{const res=await fetch('data/'+k+'.json');if(!res.ok)throw Error();config[k]=await res.json();}));
 data=config.items;e=config.economy;questions=mock?config.questions:[];game=MGGame(data,e);
 const raw=localStorage.getItem(key);s=raw===null?game.initial():JSON.parse(raw);
 if(s.version!==1||s.board?.length!==e.height*e.width||!Array.isArray(s.orders)||!Array.isArray(s.bag))throw Error(T.broken);
 await settle();await refreshWallet();await syncEnergy();save();render();
 const poll=async()=>{if(busy||halted||gesture||document.hidden)return;busy=true;try{await syncEnergy();drawTop();panel();}catch(err){fail(T.error);}finally{busy=false;}};
 timer=setInterval(poll,4000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});
 }catch(err){console.error(err);fail(err.message===T.resolve?T.resolve:err.message===T.broken?T.broken:T.error);}
}
if(navigator.locks){navigator.locks.request(key,{ifAvailable:true},async lock=>{if(!lock){fail(T.conflict);return;}await boot();await new Promise(resolve=>window.addEventListener('pagehide',resolve,{once:true}));}).catch(()=>fail(T.error));window.addEventListener('pageshow',ev=>{if(ev.persisted)location.reload();});}
else{window.addEventListener('storage',ev=>{if(ev.key===key)fail(T.conflict);});await boot();}
})();
