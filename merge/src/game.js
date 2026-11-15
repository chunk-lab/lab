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
   s.orders=e.starterResidents.map((id,j)=>({id,want:encode('i',...e.starterRequests[j]),gifts:0}));
   discover(s); return s;
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
 function gift(s,j,aff){
   const order=s.orders[j],want=order.want;
   let space=s.board.findIndex(t=>t&&!t.locked&&t.code===want);
   if(space>=0)s.board[space]=null;else{const i=s.bag.findIndex(t=>t.code===want);if(i<0)return {error:'missing'};s.bag.splice(i,1);}
   const o=parse(want),gain=e.affectionBase+o.rank-1,old=order.id;
   s.xp+=e.xpPerGiftRank*o.rank;s.gifts++;order.gifts++;
   let part=null;
   if(Math.random()<e.partChance){
     part=tile(encode('p',Math.floor(o.family/2),1));space=emptyNear(s,Math.max(0,space));
     if(space>=0)s.board[space]=part;else s.bag.push(part);
   }
   if(order.gifts>=e.rotationEvery){
     for(let i=0;i<npcs.length;i++){const next=npcs[s.residentCursor++%npcs.length].id;if(!s.orders.some(q=>q.id===next)){order.id=next;break;}}
     order.gifts=0;
   }
   const max=Math.min(e.maxRequestRank,e.requestBaseRank+Math.floor(level(s)/e.levelsPerRequestRank)+Math.floor((aff[order.id]||0)/e.affectionPerRequestRank));
   const line=Math.floor(Math.random()*data.lines.length);
   order.want=encode('i',line,Math.min(max,1+Math.floor(Math.random()*max)));
   return {event:'gift',gain,old,part:part?.code,effect:{type:'affection',id:old,n:gain}};
 }
 return {initial,level,capacity,discover,tick,generate,move,gift,available,emptyNear,maxRank,parse};
}
window.MGGame=makeGame;
})();
