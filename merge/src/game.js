(() => {
'use strict';
const parse = code => { const [family,r] = code.slice(1).split('.'); return {kind:code[0], family:Number(family),rank:Number(r||1)}; };
function makeGame(data,e) {
 const rows=e.height, cols=e.width, cap=rows*cols;
 const npcs=data.residents.filter(n=>n.id!=='chunkkun');
 const encode=(kind,family,rank)=>kind+family+'.'+rank;
 const maxRank=o=>o.kind==='i'?data.lines[o.family].items.length:o.kind==='g'?e.machineMax:e.partRanks;
 const level=s=>1+Math.floor(s.xp/e.xpPerLevel);
 const capacity=s=>Math.min(e.maxStorage,e.initialStorage+level(s)-1);
 const tile=code=>({code,locked:false,used:0,rest:0});
 function initial(){
   const s={version:1,board:Array(cap).fill(null),bag:[],energy:e.energyMax,energyAt:Date.now(),english:{day:'',count:0},xp:0,gifts:0,orders:[],known:{},residentCursor:0,serial:0};
   for(const [idx,code] of Object.entries(e.starterTiles)) {s.board[idx]=tile(code);s.board[idx].locked=e.locked.includes(+idx);}
   completeOrders(s); discover(s); return s;
 }
 function starter(id){
   const index=e.starterResidents.indexOf(id);
   const pairs=e.starterRequests[index<0?npcs.findIndex(n=>n.id===id)%e.starterRequests.length:index];
   return pairs.map(([family,rank])=>encode('i',family,rank));
 }
 function completeOrders(s){
   s.away ||= {};
   // Preserve the two original tokens, the board, inventories and affection of older saves.
   for(const q of [...s.orders,...Object.values(s.away)]){
     if(!Array.isArray(q.wants)){const pair=starter(q.id);q.wants=[q.want||pair[0],pair.find(c=>c!==q.want)||'i1.1'];delete q.want;}
   }
   const seats=Math.min(e.activeLimit,e.counterUnlocks.filter(n=>s.gifts>=n).length);
   for(const q of s.orders.splice(seats))s.away[q.id]=q;
   for(const id of [...e.starterResidents,...npcs.map(n=>n.id)]){
     if(s.orders.length>=seats)break;
     if(!s.orders.some(q=>q.id===id)){
       s.orders.push(s.away[id]||{id,wants:starter(id),gifts:0});delete s.away[id];
     }
   }
   s.focus=s.orders.some(q=>q.id===s.focus)?s.focus:s.orders[0].id;
 }
 function invite(s,slot,id){
   if(!s.orders[slot]||!npcs.some(n=>n.id===id)||s.orders.some(q=>q.id===id))return {error:'missing'};
   const prior=s.orders[slot];s.away[prior.id]=prior;
   s.orders[slot]=s.away[id]||{id,wants:starter(id),gifts:0};
   delete s.away[id];s.focus=id;return {event:'invite'};
 }
 function discover(s){for(const t of [...s.board,...s.bag]) if(t && !t.locked && t.code[0]==='i') s.known[t.code]=true;}
 function tick(s, now, answers,day){
   const before=JSON.stringify([s.energy,s.energyAt,s.english]);
   const ms=e.recoverySeconds*1000;
   if(s.energy<e.energyMax){const elapsed=Math.floor(Math.max(0,now-s.energyAt)/ms);if(elapsed){s.energy=Math.min(e.energyMax,s.energy+elapsed);s.energyAt+=elapsed*ms;}}
   if(s.english.day!==day) s.english={day,count:0};
   if(Number.isSafeInteger(answers)&&answers>s.english.count){s.energy=Math.min(e.energyMax,s.energy+(answers-s.english.count)*e.perAnswer);s.english.count=answers;}
   return before!==JSON.stringify([s.energy,s.energyAt,s.english]);
 }
 function emptyNear(s,idx){let best=-1,distance=Infinity;s.board.forEach((t,i)=>{if(t)return;const d=Math.abs(i%cols-idx%cols)+Math.abs(Math.floor(i/cols)-Math.floor(idx/cols));if(d<distance){best=i;distance=d;}});return best;}
 function generate(s,idx,now){
   const t=s.board[idx];if(!t||t.locked||t.code[0]!=='g')return {error:'generator'};
   const o=parse(t.code),space=emptyNear(s,idx);
   if(space<0)return {error:'full'};if(t.rest>now)return {error:'rest'};if(s.energy<e.energyCost)return {error:'tired'};
   if(t.rest){t.used=0;t.rest=0;}
   const line=o.family*2+Math.floor(Math.random()*2);
   const higher=Math.random()<e.higherDropChance[o.rank-1];
   const rank=higher?2+Math.floor(Math.random()*Math.max(1,Math.floor(o.rank/2))):1;
   s.board[space]=tile(encode('i',line,rank));
   if(s.energy===e.energyMax)s.energyAt=now;s.energy-=e.energyCost;
   if(++t.used>=e.machineUses[o.rank-1])t.rest=now+e.restSeconds[o.rank-1]*1000;
   return {at:space,event:'generated'};
 }
 function move(s,from,to){
   if(from===to)return {};
   const a=s.board[from],b=s.board[to];if(!a||a.locked)return {error:'locked'};
   if(!b){s.board[to]=a;s.board[from]=null;return {at:to,event:'moved'};}
   if(a.code!==b.code)return {error:b.locked?'locked':'mismatch'};
   const o=parse(a.code);
   if(o.rank===maxRank(o)&&o.kind!=='p')return {error:'maxRank'};
   const next=o.kind==='p'&&o.rank===e.partRanks?encode('g',o.family,1):encode(o.kind,o.family,o.rank+1);
   s.board[to]=tile(next);s.board[from]=null;
   return {at:to,event:b.locked?'unlocked':'merged'};
 }
 const available=(s,code)=>s.board.some(t=>t&&!t.locked&&t.code===code)||s.bag.some(t=>t.code===code);
 function checklist(s,order){
   const counts=new Map();
   for(const t of [...s.board,...s.bag])if(t&&!t.locked)counts.set(t.code,(counts.get(t.code)||0)+1);
   return order.wants.map(code=>{
     const count=counts.get(code)||0;
     if(count)counts.set(code,count-1);
     return count>0;
   });
 }
 function nextPair(s,order,affection){
   const slot=s.orders.indexOf(order);
   const cap=Math.min(e.counterRankCaps[slot],e.maxRequestRank,e.requestBaseRank+
     Math.floor(level(s)/e.levelsPerRequestRank)+Math.floor(affection/e.affectionPerRequestRank));
   const stock=[...s.board,...s.bag].filter(t=>t&&!t.locked&&t.code[0]==='i').map(t=>parse(t.code));
   const stocked=[...new Set(stock.filter(t=>t.rank<=cap).map(t=>t.family))];
   const pick=values=>values[Math.floor(Math.random()*values.length)];
   const line=stocked.length&&Math.random()<e.stockedLineChance?pick(stocked):Math.floor(Math.random()*data.lines.length);
   const side=Math.random()<e.relatedSideChance?(line^1):(line+1+Math.floor(Math.random()*(data.lines.length-1)))%data.lines.length;
   const rank=limit=>1+Math.floor(Math.random()*limit);
   const main=encode('i',line,rank(cap)),small=encode('i',side,rank(Math.min(cap,e.sideRankCap)));
   if(order.wants.includes(main)&&order.wants.includes(small)){
     const alternate=[...data.lines.keys()].find(f=>f!==side&&f!==line);
     return [encode('i',alternate,cap),small];
   }
   return [main,small];
 }
 function gift(s,j,aff){
   const order=s.orders[j];
   if(!order||!checklist(s,order).every(Boolean))return {error:'missingPair'};
   const delivered=order.wants.slice();let vacated=0;
   for(const code of delivered){
     const at=s.board.findIndex(t=>t&&!t.locked&&t.code===code);
     if(at>=0){s.board[at]=null;vacated=at;}else s.bag.splice(s.bag.findIndex(t=>t.code===code),1);
   }
   const totalRank=delivered.reduce((sum,c)=>sum+parse(c).rank,0);
   const gain=e.affectionBase+totalRank-2,old=order.id;
   s.xp+=e.xpPerGiftRank*totalRank;s.gifts++;order.gifts++;s.focus=old;
   let part=null;
   if(Math.random()<e.partChance){
     part=tile(encode('p',Math.floor(parse(delivered[0]).family/2),1));
     const space=emptyNear(s,vacated);if(space>=0)s.board[space]=part;else s.bag.push(part);
   }
   order.wants=nextPair(s,order,(aff[old]||0)+gain);const seats=s.orders.length;completeOrders(s);
   return {event:'gift',gain,old,delivered,newArrival:s.orders.length>seats?s.orders.at(-1).id:null,part:part?.code,effect:{type:'affection',id:old,n:gain}};
 }
 return {initial,checklist,invite,completeOrders,level,capacity,discover,tick,generate,move,gift,available,emptyNear,maxRank,parse};
}
window.MGGame=makeGame;
})();
