(async () => {
'use strict';
const T=window.MGStrings, art=window.MGArt, bridge=window.MergeBridge, mock=Boolean(window.MGPractice);
const app=document.querySelector('#mg-app'), sheet=document.querySelector('#mg-sheet'), content=sheet.querySelector('.mg-content');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=()=>new Date().toLocaleDateString('sv-SE');
const key='cs:merge:'+(mock?'practice:':'live:')+'v2',legacyKey=key.replace(/v2$/,'v1');
const navPaths={bag:'M3 9h18v12H3z M2 5h20v4H2z M9 13h6',book:'M12 6Q7 2 2 5v15q5-3 10 0 5-3 10 0V5q-5-3-10 1zm0 0v14',study:'m2 9 10-5 10 5-10 5z M6 12v5q6 4 12 0v-5m3-2v7',hint:'M4 5h16v12H9l-5 4z M8 10h1m3 0h1m3 0h1'};
const svg=k=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+navPaths[k]+'"/></svg>';
let data,e,questions,game,s,aff={},coins=0,reaction=null,audioContext=null,busy=false,departing=false,celebrating=false,halted=false,choice=null,gesture=null,toastTimer,modal='',quiz=null,timer;
const button=(label,act,cls='mg-btn',extra='')=>'<button class="'+cls+'" data-act="'+act+'" '+extra+'>'+label+'</button>';
function fail(message){halted=true;clearInterval(timer);if(sheet.open)sheet.close();app.innerHTML='<section class="mg-content"><h2>'+T.workshop+'</h2><p role="alert">'+esc(message)+'</p>'+button(T.reload,'reload')+'</section>';}
function chime(event){
 if(!s.sound || !['merged','unlocked','gift','generated','correct','scatter'].includes(event))return;
 try{
   const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
   audioContext ||= new C();audioContext.resume().catch(()=>{});
   const notes=event==='generated'?[380,620,840]:event==='scatter'?[490,620,740,930]:event==='gift'?[523,659,784]:[440,660,880,1175];
   notes.forEach((hz,i)=>{const start=audioContext.currentTime+i*(event==='generated'?.043:.065),osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=event==='generated'?'triangle':'sine';osc.frequency.setValueAtTime(hz,start);osc.frequency.exponentialRampToValueAtTime(hz*1.18,start+.11);gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(.065,start+.016);gain.gain.exponentialRampToValueAtTime(.001,start+.24);osc.connect(gain);gain.connect(audioContext.destination);osc.start(start);osc.stop(start+.25);});
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
 else if(kind==='p')html=art.part(family,rank);
 else html=art.item(family,rank)||'<span class="mg-emoji">'+esc(data.lines[family].items[rank-1].icon)+'</span>';
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
 if(busy||departing||celebrating||halted)return;busy=true;
 try{const before=game.level(s);const r=await fn()||{};
   if(r.error){toast(T[r.error]);return;}
   game.discover(s);s.serial++;
   if(r.effect){s.pending={...r.effect,before:await balance(r.effect)};save();await settle();}
   else save();
   if(r.select!==undefined)choice=r.select;
   reaction=r.newTurn?{id:'chunkkun',until:Date.now()+7000,text:s.turn+T.turnStart+'　'+r.drops.length+T.scatterCount}:r.event==='gift'?{id:r.old,until:Date.now()+5500,text:T.gifted+' ♥ +'+r.gain+(r.part?'　'+info(r.part).name+' ×1':'')}:null;
   chime(r.event);
   if(r.close&&sheet.open)sheet.close();
   render();
   if(r.event==='generated')leap(r.from,r.at,s.board[r.at].code,0);
   else if(r.at!=null)animate(r.other!=null?[r.at,r.other]:[r.at],r.event==='merged'||r.event==='unlocked'?'mg-combined':'mg-pop');
   if(r.newTurn){cycleCelebration(r.drops,r.part);chime('scatter');}
   if(r.event==='gift'){const at=s.orders.findIndex(q=>q.id===r.newArrival);app.querySelector('[data-act="order:'+at+'"]')?.classList.add('mg-arriving');}
   if(r.message)toast(r.message+(game.level(s)>before?'　'+T.levelUp:''));
 }catch(err){console.error(err);fail(err.message===T.resolve?T.resolve:T.error);}finally{busy=false;}
}
function drawTop(){
 const lvl=game.level(s),p=s.xp%e.xpPerLevel;
 app.querySelector('.mg-level').innerHTML='<span>'+T.lv+lvl+'</span><span class="mg-xp"><i style="width:'+p/e.xpPerLevel*100+'%"></i></span><span>'+p+'/'+e.xpPerLevel+'</span>';
 app.querySelector('.mg-wallet').innerHTML=button('<span class="mg-zap">ϟ</span>'+s.energy,'study','mg-pill','aria-label="'+T.energy+' '+s.energy+'"')+button('<span class="mg-coin">★</span>'+coins,'stats','mg-pill','aria-label="'+T.coin+' '+coins+'"');
}
function meter(id){
 const value=aff[id]||0,step=e.affectionMeterStep;
 const goal=Math.max(step,Math.ceil(value/step)*step);
 // Increase the scale only after the previous interval has filled.
 return '<span class="mg-meter" aria-label="'+T.aff+' '+value+'"><span>♥ '+value+'/'+goal+'</span><span class="mg-meter-track"><i style="width:'+(value/goal*100)+'%"></i></span></span>';
}
function drawOrders(){
 const list=app.querySelector('.mg-orders');
 const closeness=code=>{const want=game.parse(code),held=[...s.board,...s.bag].filter(t=>t&&!t.locked&&t.code[0]==='i').map(t=>game.parse(t.code)).filter(t=>t.family===want.family);
   return held.length?Math.max(0,want.rank-Math.max(...held.map(t=>t.rank))):want.rank+4;};
 const ranked=s.orders.map((q,i)=>({q,i,flags:game.checklist(s,q)})).sort((a,b)=>{
   const readyA=a.flags.filter(Boolean).length,readyB=b.flags.filter(Boolean).length;
   if(readyA!==readyB)return readyB-readyA;
   const distance=x=>x.q.wants.reduce((n,code,k)=>n+(x.flags[k]?0:closeness(code)),0);
   return distance(a)-distance(b)||a.i-b.i;
 });
 list.innerHTML=ranked.map(({q,i,flags})=>{
   const n=resident(q.id),ready=flags.every(Boolean);
   const bubbles=q.wants.map((code,k)=>'<span class="mg-mini-item '+(flags[k]?'mg-in-stock':'')+'">'+icon(code)+'<b>'+ (flags[k]?'✓':game.parse(code).rank)+'</b></span>').join('');
   const label=q.wants.map(code=>info(code).name).join('・');
   return button('<span class="mg-ticket">'+bubbles+'</span>'+portrait(q.id,'mg-face')+'<strong>'+esc(n.name)+'</strong>'+meter(q.id)+(ready?'<span class="mg-ready-tag">'+T.gift+'</span>':''),'order:'+i,'mg-order'+(ready?' mg-ready':'')+(s.focus===q.id?' mg-following':''),'aria-label="'+esc(n.name+'　'+label+'　'+(ready?T.gift:T.wish))+'"');
 }).join('');
 list.scrollLeft=0;
 const stage=e.chapterGifts.reduce((n,threshold,i)=>s.gifts>=threshold?i:n,0);
 app.querySelector('.mg-chapter').textContent=e.workshopNames[stage];
 app.querySelector('.mg-visitors').textContent=s.orders.length+' / '+e.activeLimit;
}
function focusOrder(){return s.orders.find(q=>q.id===s.focus)||s.orders[0];}
function firstHint(){
 const q=focusOrder(),ready=game.checklist(s,q);
 if(ready.every(Boolean))return resident(q.id).name+'　'+T.readyPair;
 if(s.gifts===0&&q.id==='hana'&&q.wants[0]==='i0.3'){
   if(s.board.filter(t=>t&&!t.locked&&t.code==='i0.1').length>=2)return T.first;
   if(s.board.filter(t=>t&&!t.locked&&t.code==='i0.2').length>=2)return T.nextBake;
 }
 const next=q.wants[ready.indexOf(false)];
 return resident(q.id).name+'　'+T.needed+' '+info(next).name+'。';
}
function cell(t,i){
 let html='',label=T.empty,cls='mg-cell';if(t){const o=game.parse(t.code);cls+=' mg-occupied'+(t.locked?' mg-locked':'');label=info(t.code).name+' '+T.lv+o.rank+(t.locked?' '+T.lockedTag:'');
 html=icon(t.code)+'<span class="mg-rank">'+o.rank+'</span>';
 if(o.kind==='g')html+='<span class="mg-produces" aria-hidden="true">'+icon('i'+(o.family*2)+'.1')+icon('i'+(o.family*2+1)+'.1')+'</span>';
 else if(o.kind==='i')html+='<span class="mg-family-mark" style="background:'+esc(data.machines[data.lines[o.family].machine].color)+'"></span>';
 const mark=t.locked?'▧':o.kind==='g'?(t.rest>Date.now()?'◷':'ϟ'):o.kind==='p'?'✚':'';
 if(mark)html+='<span class="mg-mark">'+mark+'</span>';
 if(o.kind==='g')label+='　'+T.produces+' '+data.lines[o.family*2].name+'・'+data.lines[o.family*2+1].name;}
 return '<button class="'+cls+(choice===i?' mg-picked':'')+'" data-cell="'+i+'" aria-label="'+esc(label)+'">'+html+'</button>';
}
function panel(){
 const el=app.querySelector('.mg-panel'),t=choice!==null&&s.board[choice];
 if(!t&&reaction&&reaction.until>Date.now()){el.innerHTML=portrait(reaction.id,'mg-avatar')+'<div class="mg-blurb"><strong>'+esc(resident(reaction.id).name)+'</strong>'+esc(reaction.text)+'</div>';return;}
 if(!t){el.innerHTML=portrait('chunkkun','mg-avatar')+'<div class="mg-blurb"><strong>'+T.hint+'</strong>'+firstHint()+'</div>'+button('？','help','mg-small','aria-label="'+T.how+'"');return;}
 const o=game.parse(t.code);let hint=t.locked?T.lockedInfo:o.kind==='g'?(t.rest>Date.now()?T.release+Math.ceil((t.rest-Date.now())/1000)+T.sec:T.use+' '+(e.machineUses[o.rank-1]-(t.rest?0:t.used))):o.kind==='p'?T.partTip:T.itemTip;
 if(o.kind==='g')hint=T.produces+' '+data.lines[o.family*2].name+'／'+data.lines[o.family*2+1].name+'。'+hint;
 if(o.kind==='i')hint=data.machines[data.lines[o.family].machine].name+'から。'+hint;
 el.innerHTML='<div class="mg-avatar">'+icon(t.code)+'</div><div class="mg-blurb"><strong>'+esc(info(t.code).name)+' · '+T.lv+o.rank+'</strong><small>'+hint+'</small></div><div class="mg-actions">'+(!t.locked&&o.kind!=='g'?button(T.bag,'stow','mg-small'):'')+(!t.locked&&o.kind==='i'?button(T.sell,'sell','mg-small'):'')+'</div>';
}
function render(){
 if(!app.querySelector('.mg-board')) app.innerHTML=
   '<header class="mg-top"><div class="mg-logo"><span class="mg-medal" aria-hidden="true">⚓</span><div><h1>'+T.title+'</h1><div class="mg-level"></div></div></div><div class="mg-wallet"></div></header>'+
   '<section class="mg-harbor"><div class="mg-heading"><h2 class="mg-chapter"></h2><div class="mg-turn">'+button('‹','prev','mg-arrow','aria-label="'+T.prevResident+'"')+'<span class="mg-visitors"></span>'+button('›','next','mg-arrow','aria-label="'+T.nextResident+'"')+'</div></div><div class="mg-orders"></div></section>'+
   '<section class="mg-work"><div class="mg-heading"><h2>'+T.workshop+'</h2><span class="mg-meta"></span></div><div class="mg-board" role="group" aria-label="'+T.board+'"></div></section>'+
   '<section class="mg-panel"></section><nav class="mg-nav">'+['bag','book','study','hint'].map(k=>button(svg(k)+T[k],k,'mg-navbtn')).join('')+'</nav>';
 drawTop();drawOrders();app.querySelector('.mg-meta').textContent=s.turn+T.turnLabel+' '+s.visited.length+'/13';
 app.querySelector('.mg-board').innerHTML=s.board.map(cell).join('');panel();
}
function animate(indices,cls){for(const i of indices){const b=app.querySelector('[data-cell="'+i+'"]');if(b){b.classList.remove(cls);void b.offsetWidth;b.classList.add(cls);}}}
function cycleCelebration(drops,part){
 celebrating=true;
 for(const drop of drops)app.querySelector('[data-cell="'+drop.at+'"]')?.classList.add('mg-awaiting');
 const scene=document.createElement('div');scene.className='mg-cycle';
 scene.innerHTML='<div class="mg-cycle-banner"><strong>'+T.cycleComplete+'</strong><span>'+T.cycleReward+' '+drops.length+T.scatterCount+(part?' · '+T.partWon:'')+'</span></div><div class="mg-cycle-chunk">'+portrait('chunkkun','mg-cycle-face')+'<span>'+T.scatterHello+'</span></div>';
 document.body.append(scene);
 setTimeout(()=>scene.classList.add('mg-cycle-toss'),650);
 setTimeout(()=>{drops.forEach((drop,i)=>leap(drop.from,drop.at,s.board[drop.at].code,i*105,true));chime('scatter');},750);
 setTimeout(()=>scene.classList.add('mg-cycle-leaving'),1850+drops.length*105);
 setTimeout(()=>{scene.remove();celebrating=false;},2650+drops.length*105);
}
function leap(from,to,code,delay=0,chunk=false){
 const source=chunk?document.querySelector('.mg-cycle-chunk'):app.querySelector('[data-cell="'+from+'"]');
 const target=app.querySelector('[data-cell="'+to+'"]');if(!source||!target)return;
 const a=source.getBoundingClientRect(),b=target.getBoundingClientRect(),size=Math.min(b.width,b.height);
 const sprite=document.createElement('span');sprite.className='mg-leap';sprite.innerHTML=icon(code);
 const x0=a.left+a.width/2,y0=a.top+a.height/2,x1=b.left+b.width/2,y1=b.top+b.height/2;
 sprite.style.width=size+'px';sprite.style.height=size+'px';
 if(!chunk){source.classList.remove('mg-launching');void source.offsetWidth;source.classList.add('mg-launching');}
 target.classList.add('mg-awaiting');document.body.append(sprite);
 const trails=Array.from({length:3},()=>{const dot=document.createElement('span');dot.className='mg-flight-trail';document.body.append(dot);return dot;});
 // Show the takeoff, high arc and landing as one continuous flight above the board.
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const duration=reduced?650:1150;
 const controlX=x0+(x1-x0)*.42,controlY=Math.min(y0,y1)-(reduced?180:280);
 let start=null;
 const finish=()=>{sprite.remove();trails.forEach(dot=>dot.remove());source.classList.remove('mg-launching');if(target.isConnected){target.classList.remove('mg-awaiting');animate([to],'mg-created');}};
 function position(t){
   if(t<.13){const p=t/.13;return {x:x0,y:y0-20*p*p};}
   const p=(t-.13)/.87,u=1-p;
   return {x:u*u*x0+2*u*p*controlX+p*p*x1,y:u*u*(y0-20)+2*u*p*controlY+p*p*y1};
 }
 function frame(now){
   if(!sprite.isConnected){trails.forEach(dot=>dot.remove());source.classList.remove('mg-launching');target.classList.remove('mg-awaiting');return;}
   if(start===null)start=now+delay;
   const t=Math.max(0,Math.min(1,(now-start)/duration));
   const {x,y}=position(t),scale=t<.13?.28+t/.13*.7:t<.52?.98+(t-.13)/.39*.82:1.8-(t-.52)/.48*.9;
   const angle=t<.13?-16:t<.6?-16+18*(t-.13)/.47:2+13*(t-.6)/.4;
   sprite.style.left=x+'px';sprite.style.top=y+'px';sprite.style.transform='translate(-50%,-50%) rotate('+angle+'deg) scale('+scale+')';
   sprite.style.opacity=t<.035?String(.3+t*20):'1';
   trails.forEach((dot,i)=>{const q=position(Math.max(0,t-(i+1)*.055));dot.style.left=q.x+'px';dot.style.top=q.y+'px';dot.style.opacity=t>.16&&t<.93?String(.85-i*.24):'0';dot.style.transform='translate(-50%,-50%) scale('+(1-i*.22)+')';});
   if(t<1)requestAnimationFrame(frame);else finish();
 }
 requestAnimationFrame(frame);
}
function useCell(i){
 if(busy||celebrating||halted)return;
 const t=s.board[i];
 choice=t?i:null;
 if(t&&!t.locked&&t.code[0]==='g'){
   action(()=>{const r=game.generate(s,i,Date.now());if(r.error){render();return r;}return {...r,message:T.generated+' · '+info(s.board[r.at].code).name};});return;
 }
 render();if(t?.locked)toast(T.locked);
}
function move(from,to){action(()=>{const r=game.move(s,from,to);return r.error?r:{...r,select:to,message:T[r.event]+' · '+info(s.board[to].code).name};});}
function orderPage(i){
 const q=s.orders[i],flags=game.checklist(s,q),ready=flags.every(Boolean),n=resident(q.id);
 const items=q.wants.map((code,k)=>{
   const o=game.parse(code),line=data.lines[o.family];
   return button('<span class="mg-dish">'+icon(code)+'</span><span><b>'+esc(info(code).name)+'</b><small>'+esc(data.machines[line.machine].name)+' · '+T.lv+o.rank+'</small></span><em>'+ (flags[k]?'✓':T.showRecipe+' ›')+'</em>','line:'+o.family,'mg-recipe-row');
 }).join('');
 const gain=e.affectionBase+q.wants.reduce((sum,c)=>sum+game.parse(c).rank-1,0);
 dialog(n.name,'<div class="mg-row">'+portrait(q.id,'mg-portrait')+'<div><b>'+T.orderTitle+'　'+flags.filter(Boolean).length+'/2</b>'+meter(q.id)+'</div></div><div class="mg-recipe-list">'+items+'</div><p>'+button(ready?T.readyPair+'　♥ +'+gain:T.follow,ready?'give:'+i:'follow:'+i,'mg-btn mg-primary')+'</p>'+button(T.visitors,'visitors:'+i,'mg-btn'),'order');
}
function visitorPage(slot,page=0){
 const waiting=data.residents.filter(n=>n.id!=='chunkkun'&&!s.visited.includes(n.id)&&!s.orders.some(q=>q.id===n.id));
 const pages=Math.ceil(waiting.length/e.activeLimit);
 const shown=waiting.slice(page*e.activeLimit,(page+1)*e.activeLimit);
 const paging=pages>1?button((page+1)+'/'+pages+'　›','guestPage:'+slot+':'+((page+1)%pages),'mg-small'):'';
 const list=shown.map(n=>button(portrait(n.id,'mg-guest-face')+esc(n.name),'invite:'+slot+':'+n.id,'mg-guest')).join('');
 dialog(T.visitors,'<p>'+T.visitorGuide+'</p><div class="mg-guest-grid">'+list+'</div>'+paging,'visitors');
}
function bagPage(){
 const tiles=s.bag.map((t,i)=>button(icon(t.code)+'<small>'+esc(info(t.code).name)+'<br>'+T.lv+game.parse(t.code).rank+'</small>','take:'+i,'mg-tile')).join('');
 dialog(T.bag+'　'+s.bag.length+'/'+game.capacity(s),'<p>'+(s.bag.length?T.bagHelp:T.bagEmpty)+'</p><div class="mg-grid">'+tiles+'</div>','bag');
}
function bookPage(){
 const count=Object.keys(s.known).length,total=data.lines.reduce((n,l)=>n+(l.mergeMaxRank||l.items.length),0);
 dialog(T.book,'<p>'+T.bookSub+'　<b>'+count+' / '+total+'</b> '+(count===total?T.completed:'')+'</p><div class="mg-list">'+data.lines.map((l,f)=>button(art.machine(data.machines[l.machine].art)+'<b>'+esc(l.name)+'</b><small>'+l.items.filter((_,i)=>i<(l.mergeMaxRank||l.items.length)&&s.known['i'+f+'.'+(i+1)]).length+'/'+(l.mergeMaxRank||l.items.length)+' ›</small>','line:'+f,'mg-btn mg-bookrow')).join('')+'</div>','book');
}
function linePage(f){const l=data.lines[f];dialog(l.name,'<div class="mg-row">'+art.machine(data.machines[l.machine].art)+'<b>'+esc(data.machines[l.machine].name)+'</b></div><div class="mg-grid">'+l.items.map((it,i)=>{const c='i'+f+'.'+(i+1),known=s.known[c];return '<div class="mg-tile '+(known?'':'mg-faded')+'">'+icon(c)+'<small>'+T.lv+(i+1)+'<br>'+esc(it.name)+'<br>'+(it.special?T.specialPending:known?T.made:T.undiscovered)+'</small></div>';}).join('')+'</div><p>'+T.madePair+(l.items.some(it=>it.special)?' '+T.specialGuide:'')+'</p>'+button(T.back,'book','mg-btn mg-primary'),'line');}
function hint(){
 const q=focusOrder(),flags=game.checklist(s,q);
 if(flags.every(Boolean)){orderPage(s.orders.indexOf(q));return;}
 const need=q.wants[flags.indexOf(false)],o=game.parse(need);
 for(let rank=o.rank-1;rank>=1;rank--){
   const c='i'+o.family+'.'+rank;
   const i=s.board.findIndex(t=>t&&!t.locked&&t.code===c);
   const j=s.board.findIndex((t,k)=>k!==i&&t?.code===c);
   if(i>=0&&j>=0){animate([i,j],'mg-hinted');toast(info(c).name+'　'+T.mergeHint);return;}
 }
 const m=data.lines[o.family].machine;
 const machines=s.board.map((t,i)=>t?.code.startsWith('g'+m+'.')?i:-1).filter(i=>i>=0);
 animate(machines,'mg-hinted');toast(s.board.every(Boolean)?T.noHint:data.machines[m].name+'　'+T.makeHint);
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
 const [k,idx]=act.split(':'),i=Number(idx);if(k==='reload'){location.reload();return;}if(busy||celebrating||halted)return;
 switch(k){
 case 'prev':case 'next':{
   const list=app.querySelector('.mg-orders');
   list.scrollBy({left:(k==='next'?1:-1)*list.clientWidth,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});break;
 }
 case 'order':if(game.checklist(s,s.orders[i]).every(Boolean))dispatch('give:'+i);else orderPage(i);break;
 case 'follow':action(()=>{s.focus=s.orders[i].id;choice=null;setTimeout(hint,160);return {close:true};});break;
 case 'visitors':visitorPage(i);break;
 case 'guestPage':visitorPage(i,Number(act.split(':')[2]));break;
 case 'invite':action(()=>({...game.invite(s,i,act.split(':')[2]),select:null,close:true}));break;
 case 'give':{
   if(departing)return;
   departing=true;sheet.close();
   const card=app.querySelector('[data-act="order:'+i+'"]');card?.classList.add('mg-departing');
   setTimeout(()=>{departing=false;action(()=>{const r=game.gift(s,i,aff);return r.error?r:{...r,select:null,close:true,message:r.newTurn?null:resident(r.old).name+'「'+T.gifted+'」 ♥ +'+r.gain+(r.part?'　'+T.partWon:'')};});},280);
   break;
 }
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
// Board taps only inspect the tile or activate a generator. Only a completed drag can move it.
document.addEventListener('click',ev=>{
 const command=ev.target.closest('[data-act]');
 if(command){dispatch(command.dataset.act);return;}
 const cell=ev.target.closest('[data-cell]');
 if(cell&&ev.detail===0&&!ev.pointerType)useCell(+cell.dataset.cell); // keyboard activation
});
function targetAt(x,y){
 const cell=document.elementFromPoint(x,y)?.closest('[data-cell]');
 return cell&&app.contains(cell)?cell:null;
}
function dropKind(from,to){
 const a=s.board[from],b=s.board[to];
 if(from===to)return '';
 if(!b)return 'empty';
 if(a.code!==b.code)return b.locked?'invalid':'swap';
 const o=game.parse(a.code);
 if(o.kind!=='p'&&o.rank>=game.maxRank(o))return 'invalid';
 return b.locked?'unlock':'match';
}
function clearTarget(g){
 if(g.target)g.target.classList.remove('mg-drop-empty','mg-drop-invalid','mg-drop-match','mg-drop-unlock','mg-drop-swap');
 g.target=null;
}
function showDrag(g,x,y){
 if(!g.ghost){
   g.ghost=document.createElement('div');
   g.ghost.className='mg-ghost';
   g.ghost.innerHTML=icon(s.board[g.from].code)+'<span class="mg-drop-label"></span>';
   g.ghost.setAttribute('aria-hidden','true');
   document.body.append(g.ghost);
   g.source.classList.add('mg-dragfrom');
 }
 g.ghost.style.left=x+'px';g.ghost.style.top=y+'px';
 const b=targetAt(x,y),kind=b?dropKind(g.from,+b.dataset.cell):'';
 if(b!==g.target){clearTarget(g);g.target=b;if(kind)b.classList.add('mg-drop-'+kind);}
 g.ghost.lastElementChild.textContent=({empty:T.dragEmpty,unlock:T.dragLocked,match:T.dragMatch,swap:T.dragSwap,invalid:T.dragInvalid})[kind]||'';
}
function endGesture(ev,cancel){
 const g=gesture;if(!g||ev.pointerId!==g.id)return;
 const traveled=Math.hypot(ev.clientX-g.x,ev.clientY-g.y);
 const dragged=Boolean(g.ghost)||traveled>=6;
 const target=cancel?null:targetAt(ev.clientX,ev.clientY);
 gesture=null;clearTarget(g);g.ghost?.remove();g.source.classList.remove('mg-dragfrom');
 if(g.source.hasPointerCapture(g.id))g.source.releasePointerCapture(g.id);
 if(cancel||!target)return;
 const to=+target.dataset.cell;
 if(dragged){if(!g.locked&&to!==g.from)move(g.from,to);}
 else if(to===g.from)useCell(to);
}
app.addEventListener('pointerdown',ev=>{
 const cell=ev.target.closest('[data-cell]');
 if(!cell||busy||halted||gesture||!ev.isPrimary||ev.button!==0)return;
 const from=+cell.dataset.cell;
 gesture={id:ev.pointerId,from,x:ev.clientX,y:ev.clientY,source:cell,locked:!s.board[from]||s.board[from].locked,target:null,ghost:null};
 cell.setPointerCapture(ev.pointerId);
});
app.addEventListener('pointermove',ev=>{
 const g=gesture;if(!g||ev.pointerId!==g.id||g.locked)return;
 if(g.ghost||Math.hypot(ev.clientX-g.x,ev.clientY-g.y)>=6)showDrag(g,ev.clientX,ev.clientY);
});
app.addEventListener('pointerup',ev=>endGesture(ev,false));
app.addEventListener('pointercancel',ev=>endGesture(ev,true));
app.addEventListener('lostpointercapture',ev=>endGesture(ev,true));
async function boot(){
 try{
 const names=mock?['items','economy','questions']:['items','economy'];let config={};
 if(location.protocol==='file:') config=JSON.parse(document.getElementById('mg-offline').textContent);
 else await Promise.all(names.map(async k=>{const res=await fetch('data/'+k+'.json');if(!res.ok)throw Error();config[k]=await res.json();}));
 data=config.items;e=config.economy;questions=mock?config.questions:[];game=MGGame(data,e);
 const raw=localStorage.getItem(key),legacy=raw===null?localStorage.getItem(legacyKey):null;
 s=raw!==null?JSON.parse(raw):legacy!==null?game.migrate(JSON.parse(legacy)):game.initial();
 if(s.version!==2||s.board?.length!==e.height*e.width||!Array.isArray(s.orders)||!Array.isArray(s.bag))throw Error(T.broken);
 game.completeOrders(s);await settle();await refreshWallet();await syncEnergy();save();render();
 const poll=async()=>{if(busy||halted||gesture||document.hidden)return;busy=true;try{await syncEnergy();drawTop();panel();}catch(err){fail(T.error);}finally{busy=false;}};
 timer=setInterval(poll,4000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});
 }catch(err){console.error(err);fail(err.message===T.resolve?T.resolve:err.message===T.broken?T.broken:T.error);}
}
if(navigator.locks){navigator.locks.request(key,{ifAvailable:true},async lock=>{if(!lock){fail(T.conflict);return;}await boot();await new Promise(resolve=>window.addEventListener('pagehide',resolve,{once:true}));}).catch(()=>fail(T.error));window.addEventListener('pageshow',ev=>{if(ev.persisted)location.reload();});}
else{window.addEventListener('storage',ev=>{if(ev.key===key)fail(T.conflict);});await boot();}
})();
