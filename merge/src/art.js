/* Original game pictograms, drawn on a common 64-unit grid. */
(()=>{
const common=(body)=>'<svg aria-hidden="true" viewBox="0 0 64 64" class="mg-art"><g stroke="#6b5047" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">'+body+'</g></svg>';
const path=(d,fill)=>'<path d="'+d+'" fill="'+fill+'"/>';
const circ=(x,y,r,c)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'"/>';
const rect=(x,y,w,h,r,c)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+c+'"/>';
const shine=path('M14 19q2-5 8-6','none');
const crate=(a,b)=>path('m6 23 29-9 23 8-28 12z',b)+path('m6 23 24 10v23L8 47z',a)+path('m30 33 28-11-2 25-26 10z',b)+path('m10 35 16 6m9-2 17-6','none');
const art={
cafe:rect(6,10,52,45,8,'#e4a569')+rect(10,14,44,36,6,'#fff2d1')+rect(13,5,38,10,3,'#6f9f96')+path('m19 10h26','none')+rect(14,29,36,18,3,'#ad7955')+path('M17 25h17l-2 12q-7 5-13 0z','#f9f2dd')+path('M34 27q9-3 6 5-1 4-7 4','none')+path('M41 39q3-9 7-3l3 6z','#e5b773')+circ(22,20,3,'#d8776a')+circ(41,20,3,'#d8776a'),
oven:rect(6,15,52,40,7,'#d46653')+rect(8,10,48,38,7,'#ffab85')+rect(13,23,38,21,5,'#536577')+rect(17,26,30,14,3,'#364c60')+path('M20 36q1-8 7-4 4-6 9-2 6-3 8 6z','#efb96c')+circ(17,17,2,'#fff0c9')+circ(26,17,2,'#fff0c9')+path('M39 17h9','none')+rect(15,51,6,5,2,'#8d6955')+rect(43,51,6,5,2,'#8d6955'),
drinks:rect(11,9,40,15,5,'#82c4bc')+path('M14 24h8v24h28v7H10l2-8z','#4d9b97')+rect(27,22,15,5,2,'#8f8c7e')+path('M33 27v6','none')+rect(25,34,18,14,5,'#fff0cd')+path('M43 36q11-2 5 7l-5 1','none')+circ(43,16,3,'#fff4d4')+path('M17 15h13','none'),
tools:crate('#d48749','#e5ad64')+path('m12 25 8-17 5 2-6 18z','#91adb0')+path('M17 8q4-7 11-3l-5 3 3 4-4 4z','#acc6c6')+path('m33 27 3-20 5 1-2 18z','#bd7945')+path('m32 5 15 2-1 7-15-3z','#69959d'),
sea:crate('#468f9f','#67b4b9')+path('m6 23q0-11 8-14l27-5q10 0 17 18l-28 11z','#73bec7')+path('m13 15 6-4 7 15-5 3zM40 7l5-1 8 16-5 2z','#f5ca77')+rect(28,29,9,10,2,'#ffdb85'),
sew:crate('#c883a5','#e8aac3')+path('m10 20 9-10 9 3-6 11z','#f6d1cf')+circ(34,13,8,'#eba9af')+path('m34 14 11-12m-6 19 12-12','none')+rect(40,14,10,10,2,'#94c9bf')+path('m43 18 5 1','none'),
goods:crate('#a18bc4','#c2a5d8')+path('m16 24-2-17 7-1 3 19z','#efe3b8')+path('m26 24 3-19 6 1-4 19z','#eab658')+path('m36 23 7-14 6 3-7 14z','#77b6bd')+path('m40 37 6-3-1 7-5 2z','#ffe29c'),
flour:path('m23 8 15 1 5-2-3 11q11 11 11 29 1 9-20 9T10 47q1-14 13-29z','#f4d9a0')+path('m22 18 18 1-1 5-18-1z','#cf7859')+path('m14 38 32 2 2 8q-15 9-35 1z','#fff2d4')+path('m29 46 9-14m-5 9-4-3m7-1 5-2','none'),
bowl:path('M5 31h53q-2 22-24 23T5 31z','#7dcac2')+path('M7 31q7-14 20-9 9-11 23 0 10 2 7 10z','#ffe6a6')+path('m33 24 15-19q4-4 7 0l-16 22z','#c98a5d')+path('M10 38q7 8 14 9','none'),
bread:path('M12 32q-8-15 6-18 10-10 19-2 18-1 17 16l-5 7v16q-15 6-36 0z','#e2a060')+path('M16 31q-5-10 5-13 9-8 16-1 14-1 14 10l-6 6v15q-10 3-28 0z','#ffe4ad'),
berry:path('M9 27q0-15 18-15 13-9 24 2 12 16-10 36-12 12-17 4Q11 41 9 27z','#ed7275')+path('m23 15-7-6 12 1 4-7 4 8 13-1-9 7-3 7-7-7-9 5z','#6ca882')+path('m18 26 2 3m8-6 2 3m11-3-1 4m-18 7 1 4m12-5-1 4m-6 5 1 3','none'),
orange:circ(32,34,22,'#ffb34b')+path('M31 13q4-12 17-9-3 10-17 9z','#78b68c')+shine,
bean:path('M13 43q-4-15 14-28 16-13 25-4 12 16-6 31-17 14-29 8z','#a97550')+path('M19 45q3-10 12-16t15-14','none'),
wood:path('m10 33 29-20 15 7 1 15-30 20-13-5z','#d09b69')+path('m11 33 15 6-1 16-13-5z','#edc990')+path('m29 39 20-14m-18 20 16-11','none'),
dough:path('M6 38q1-10 12-12 7-12 18-8 7-1 13 8 10 3 9 14-3 13-30 13Q8 51 6 38z','#f1c77c')+path('m18 31 5-6m6 7 6-8m5 11 6-6','none'),
cupcake:path('m11 31 42 1-7 23H19z','#dc91a7')+path('M9 32q-2-8 8-12-1-8 10-10 5 0 7-7 12 4 10 14 9-1 10 6 11 11-4 13-8 3-13-2-6 5-13 0-9 4-15-2z','#ffdfba')+circ(34,8,4,'#e77a7c')+path('m23 39 2 10m12-10-1 11','none')
};
window.MGArt={machine:k=>common(art[k]),item:(line,rank)=>{const key=({'0.1':'flour','0.2':'bowl','0.3':'cupcake','1.1':'dough','1.2':'bread','2.1':'bean','3.1':'berry','3.2':'orange','4.1':'wood'})[line+'.'+rank];return key?common(art[key]):''}};
})();
/* Hand-drawn inventory: shared ink weight, light from the upper left, one silhouette per recipe. */
(()=>{
const original=window.MGArt;
const ink='#684f48',cream='#fff2ca',straw='#e6b46e',rose='#ef91a4',leaf='#81b395',mint='#88c6bb',blue='#78b8cf',violet='#b19dce',wood='#c18a61',red='#e07669',coffee='#915e48',gold='#eec36e',paper='#fff6dc';
const P=(d,f='none')=>'<path d="'+d+'" fill="'+f+'"/>';
const R=(x,y,w,h,r,f)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+f+'"/>';
const O=(x,y,rx,ry,f)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+f+'"/>';
const G=(shape,t)=>'<g transform="'+t+'">'+shape+'</g>';
const shape=body=>'<svg aria-hidden="true" class="mg-art" viewBox="0 0 64 64"><ellipse cx="32" cy="54" rx="20" ry="3.5" fill="#637d8330"/><g stroke="'+ink+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>';
const spark=(x,y)=>G(P('m0-5 1.5 3.5L5 0 1.5 1.5 0 5-1.5 1.5-5 0l3.5-1.5z',cream),'translate('+x+' '+y+')');
const berry=O(36,14,5,5,red)+P('m35 10 5-6');
const plate=O(31,50,24,5,'#b4ced0')+O(31,48,21,4,cream);
const cake=(fill,top,tall=false)=>plate+R(12,tall?20:26,39,tall?26:20,5,fill)+P('M12 30q0-12 20-12t20 12q-4 5-8 3-4 6-8 1-4 3-9-1-5 4-9 0-4 1-6-3z',top)+P('M18 40h27')+berry;
const goblet=(fill,topping)=>P('M13 21h38q-2 22-16 26v5l9 3H20l9-3v-5Q14 42 13 21z','#c4e1db')+P('M16 27h32q-4 15-16 18-12-3-16-18z',fill)+topping;
const cup=(fill,drink,high=false)=>P('M44 25q17-5 12 9-3 8-15 8v-5q8-1 9-7l-6 1z',fill)+P(high?'M11 18h35l-4 31q-11 6-23 0z':'M9 25h37l-4 20q-14 11-27 0z',fill)+O(high?28:27,high?18:25,high?17:18,5,drink)+P('m18 31 2 8');
const tube=(drink,strawColor,layer='')=>P('m15 19 33 1-4 34H21z',drink)+P('m20 28 2 13')+layer+O(32,19,18,5,cream)+P('m33 18 5-15 5 2-6 14z',strawColor);
const bag=(c,w=38,extra='')=>P('M22 22q-2-15 9-15 12 0 11 15h-5q1-10-6-10-6 0-5 10z',wood)+R(32-w/2,21,w,31,6,c)+P('M17 44q13 5 28 2')+extra;
const boat=(c,flags=1)=>P('M5 39q26 6 54-1l-11 14H16z',c)+P('M31 39V7')+P('M28 10 9 34h19z',cream)+P('m34 14 15 21H34z',flags>1?red:blue)+(flags>1?P('M46 37V18l10 15h-9',gold):'')+P('m15 45 24 2');
const book=(c,wide=false)=>P(wide?'m6 15 24-5 26 6v35l-25-4-24 5z':'m10 17 33-8 12 8-2 32-34 8-9-6z',c)+(wide?P('m30 11 1 35m-19-23 12-3m13 1 12 3'):P('m17 22 34-8m-33 9 1 29m7-21 17-4m-16 10 11-3'));
const ribbon=(c)=>P('M29 26Q9 7 7 17l3 21q3 8 20-6l-9 18 8-3 5 6 1-20q17 15 21 5l2-19q0-11-23 7z',c)+O(32,29,5,5,gold);
const shirt=(c,long=false)=>P('M23 12q6 6 15 0l11 5 10 17-9 5-7-9 1 22H19l1-22-8 9-8-5 11-17z',c)+(long?P('m19 47 25 0m-22-10h18m-17-7h15'):P('M25 14q4 10 12 1'));
const dress=(c,frill)=>P('m23 9 6 0q1 8 7 0h6l-2 17q2 9 15 23-19 10-45 0 13-17 15-23z',c)+P('m24 26 16 0v5H23z',gold)+P('m24 45 5-10m12 10-5-10')+(frill?P('m15 47 7 3 7-2 6 3 6-3 8 0',cream):'');
const gem=c=>P('m8 24 10-12 27-1 12 13-24 30z',c)+P('m8 24 49 0m-38-11 6 11 8 30 8-30 5-12m-21 12 8-12 8 12');
const chair=(c,arms=false)=>P('m15 10 27 2v24l-25-2z',c)+P('m17 32 25 2 10 7-26 6-14-9z',c)+P('m15 39 2 12h4l-1-10m24 2-1 12h4l2-13',wood)+(arms?P('m13 23 10 6v11m18-14 11 5v11','none'):'');
const pencil=(c)=>P('m13 43 31-31 8 8-31 31-12 5z',c)+P('m13 43 8 8-12 5z',cream)+P('m42 14 6-6q4-3 8 2t-2 7l-4 4z',rose);
const vase=c=>P('m23 9 19 0-5 12q17 9 12 24-5 13-26 8-19-8-6-25l10-8z',c)+P('m19 34q10 5 25 1m-18-17h10');
const note=(c)=>P('m11 12 38-3 4 38-12 8-28-3z',c)+P('m41 55-1-12 13 3m-33-21 23-2m-22 8 19-2m-18 9 13-1');
const pack=(c,extra='')=>bag(c,33,R(19,36,24,12,4,cream)+P('M23 23h16')+extra);
const scarf=c=>P('M13 10q16 5 27-1l9 11-14 9 13 15-12 9-13-25-9 15-9-6 11-15z',c)+P('m32 43 7 6m-27-17 4 5');
const strand=(c,n)=>P('M9 15q2 32 24 33 21 1 24-33')+Array.from({length:n},(_,i)=>{let t=i/(n-1),x=10+44*t,y=18+29*Math.sin(t*Math.PI);return O(x.toFixed(1),y.toFixed(1),3.2,3.2,c);}).join('');
const fern=P('m31 26 1-18m0 10q-12 1-13-8 9-2 13 8m0 1q6-12 14-8-2 8-14 8',leaf);
const set=[
[null,null,null,plate+P('m17 40 5-20h21l6 20q-13 11-32 0z','#f5c879')+O(32,21,11,4,coffee),cake('#f3bd97','#fff3dd'),cake(coffee,'#bd8765',true),plate+P('m10 29 43 0-6 17q-16 5-33-1z',straw)+O(32,28,22,7,cream)+O(22,27,6,5,red)+O(34,24,7,6,red)+O(43,29,6,4,red),goblet(rose,O(24,22,10,8,cream)+O(36,18,10,9,'#f2bd98')+berry)],
[null,null,O(32,32,23,21,straw)+[[20,28],[29,16],[43,24],[35,37],[18,40],[45,40]].map(([x,y])=>O(x,y,3,2,coffee)).join(''),O(32,32,24,20,rose)+O(32,32,8,6,cream)+P('m15 27 4-3m14-6 5 2m6 14 4 2m-22 7 4 1'),P('M5 27q3 18 13 19 13 12 25 2 13-4 16-23l-10 6-7-10-10 4-9-4-9 12z',straw)+P('m15 33 7 10m2-19 5 20m12-18-4 18m13-14-7 13'),P('m7 43 19-29 30 22-6 14-36 2z',straw)+P('m9 42 18-24 25 17-25 7z',cream)+P('m12 46 8-4 11 3 12-7 9 0',leaf),O(32,36,21,13,'#df97a6')+R(12,30,40,7,3,cream)+O(32,28,21,12,'#f4acc0'),bag(straw,46,G(P('m10 20 8-17 4 2-2 14z',cream)+P('m27 20 0-13q7-7 11 1l-4 14z',straw),'translate(0 2)'))],
[null,cup('#f6dfae','#e0cba9'),cup('#b9dbd4',coffee),cup(rose,'#714331',true)+O(23,16,5,3,cream)+O(33,18,4,3,cream),cup('#e5b48c','#ba8964')+P('M21 23q3-6 7 0 6-6 8 0l-9 5z',cream),cup(mint,'#96b56e',true)+P('m20 17 14 2',cream),tube('#e8b978',coffee,P('m19 28 27 0-1 6-25 0z','#b98255')),tube('#f5cd88',red,O(32,39,6,6,cream))+spark(49,12)],
[null,null,tube('#fac162',mint),tube('#eebb86',leaf,O(33,38,6,6,red)),goblet('#eea484',P('m32 28 12-22 4 1-11 22z',mint)+O(18,21,6,6,gold)),tube('#e7a7bd',mint)+fern,goblet(rose,O(21,21,8,8,'#ffc493')+O(35,20,10,9,cream)+berry),tube(rose,violet,P('m19 28 27 0-1 7H20z',gold)+P('m21 38 23 0-1 7H22z',mint))+spark(49,11)],
[null,P('m6 34 34-20 18 6-34 22z',straw)+P('m6 34 18 8 34-22-1 9-33 22-18-9z',wood)+P('m14 34 22-13m-7 17 19-12'),chair(wood),chair('#cfac83',true),P('m6 28 30-11 23 9-30 12z',wood)+P('m10 32 2 18h4l1-16m30-2v15h5l2-17',wood),R(9,20,46,25,7,blue)+R(12,32,41,16,5,'#9dc8ca')+R(5,28,10,20,5,blue)+R(49,28,10,20,5,blue)+P('m13 48v6h5l1-6m28 0v6h5l1-7',wood),P('m4 22 28-12 28 12-29 15z',straw)+P('m7 25 2 24h5l1-20m15 9 2 18h4l1-20m15-10v23h5l1-25',wood)+P('m26 14 24 12-7 4-24-13z',rose),P('M9 15q25 6 34-6 13-4 13 8l-3 19-32 10-13-5z','#667483')+P('m10 35 30-11 14 5-32 13z',cream)+P('m16 43 2 11m29-20v14m-24-14 2 4m4-6 2 3m4-6 2 4')],
[P('M24 23h17v27H24z',cream)+O(32,50,17,4,straw)+P('M32 24q-11-7 1-20 9 14-1 20z',gold),P('m18 12 25 0 10 21H9z',gold)+P('M30 33h5v16h10v4H21v-4h9z',wood),vase(mint),O(32,33,25,17,rose)+O(32,33,18,11,cream)+O(32,33,11,6,rose),P('m21 8 22 0 8 15H14z',cream)+P('m30 24 4 0v26h9v4H22v-4h8z',wood),O(32,31,20,24,gold)+O(32,31,15,19,'#b4d8e4')+P('m24 30 12-13m-10 21 12-12'),R(6,16,51,32,6,'#697b92')+P('m13 37 9-13 7 15 11-18 10 12',rose),P('M6 13q24 15 51-1M7 28q21 16 48 1')+[[15,18],[29,21],[45,17],[17,35],[34,38],[49,33]].map(([x,y],i)=>O(x,y+4,3,5,[gold,rose,mint][i%3])).join('')],
[G(O(26,33,10,21,blue)+P('m18 36 8-12 8 11'),'rotate(16 32 32)')+G(O(44,35,8,18,mint)+P('m38 39 7-12 6 9'),'rotate(16 32 32)'),O(32,34,24,17,red)+O(32,32,11,7,cream)+P('m13 24 9 5m21-5-4 6m-18 13-5 4m26-5 6 3'),O(32,32,23,22,cream)+P('M14 18q13 1 18 15-17 6-20 13l9 6q2-12 11-19 14 3 21 10l2-12q-12-6-23 2 5-13 13-19z',blue),P('m30 22 4 0v32h-4z',wood)+P('M5 29q10-21 26-21 19 0 28 21-8-4-14 0-8-5-14 0-8-6-14 0-6-5-12 0z',red)+P('M31 8q-10 8-14 21m14-21q9 8 14 21'),P('m9 16 6-3 14 23 22-6 3 6-27 9z',blue)+P('m16 53 22-19m11 16L25 39'),P('M5 13q29 37 53 0-9 43-39 28z',mint)+P('m5 7 4 47m47-47-2 48m-44-33 34 14m-27-8 17 13'),P('m4 49 27-40 28 40z',mint)+P('m31 10 13 38-22 0z','#648d91')+P('m29 17-11 22'),P('m6 46 29-10 24 9-30 10z',straw)+G(P('M7 24q18-28 42 0-10-5-20 0-12-6-22 0z',red)+P('M27 24v23'),'translate(5 -3)')+R(11,39,18,6,2,blue)],
[O(30,33,8,18,cream)+P('m24 26 13 0v9H23z',red)+P('m30 14 1-9m0 46 1 6'),boat(wood),O(32,13,6,6,blue)+P('M32 19v32M21 25h22M9 35q0 14 23 17 23-3 23-17l-8 5m7-5 2 8m-46-9 7 6m-7-6-2 8','none'),boat(wood,2),P('m23 23 17 0 6 30H17z',cream)+P('m21 32 21 0 2 8H19z',red)+R(22,13,19,11,2,blue)+P('m18 14 14-9 15 9z',red),P('M8 29q0-15 13-17h24q11 1 12 17v19l-47 5z',wood)+P('m9 29 48-3m-35-12 1 36m18-36 1 35')+R(28,25,9,12,1,gold),boat(blue,2)+spark(53,9),boat(gold,2)+spark(12,8)+spark(52,12)],
[R(17,13,28,36,5,rose)+R(14,9,35,6,3,wood)+R(14,48,35,6,3,wood)+P('m19 20 24 4m-24 3 24 4m-24 3 24 4m-24 3 24 4'),P('m6 28 30-13 22 9-9 26-29 5z',mint)+P('m9 30 24 8 23-12m-22 13-5 12'),P('m23 9 23 0-2 23 10 8q5 8-3 12-8 5-17-1L20 41z',rose)+P('m23 16 21 0m-23 7 21 0'),shirt(blue),shirt(leaf,true),dress('#e0a08c'),dress(violet,true),dress(rose,true)+spark(48,14)+spark(12,28)],
[ribbon(rose),O(31,33,19,18,violet)+O(31,33,13,12,cream)+ribbon(rose).replaceAll('transform="','transform="'),P('m12 47 32-35q9-6 11 3 2 5-5 11L20 51q-6 4-8-4z',gold)+P('m20 44 28-26')+spark(44,14),P('M10 46q-8-37 20-39 31-2 25 37l-5 6q5-33-19-33-22 1-17 29z',rose)+spark(46,16),O(31,35,21,13,gold)+O(31,34,15,8,cream)+O(48,40,6,5,mint),strand(gold,9),strand(blue,7)+G(gem(blue),'translate(16 27) scale(.48)'),P('m6 19 13 12 12-21 12 21 15-13-6 29-40 1z',gold)+O(32,38,6,7,rose)+spark(31,10)],
[note(paper),note('#f4d39c')+P('m13 11 3 7m7-8 3 7m7-8 3 7'),book(blue),pencil(red)+G(pencil(blue),'translate(-5 -3) rotate(-14 32 32)'),R(7,22,49,24,8,mint)+P('m10 30 41-2')+R(42,30,7,6,2,gold),book(rose,true),book(leaf)+P('m28 19 13-3-1 8-5-2-7 5z',cream),book(violet)+spark(34,28)+spark(48,9)],
[P('m8 20 26-9 20 16-10 26-32-7z',rose)+P('m12 42 28 7 10-20m-36-5 26 7 9-5'),bag(mint,32),R(7,21,48,28,6,wood)+P('m8 24 46 0-5 13H16z',straw)+O(33,32,3,3,gold),bag(cream,44),pack(blue),bag(rose,37,R(28,25,10,8,2,gold)),R(10,17,44,36,6,'#ba906a')+P('M24 17v-7h17v7m-22 1v34m25-33v32')+R(15,50,6,6,2,ink)+R(43,50,6,6,2,ink),R(6,18,52,32,6,'#ae7962')+P('m21 18 0 31m22-31v31M24 17V9h16v8')+R(29,29,8,8,2,gold)+spark(52,15)]
];
set[9][1]=O(34,35,18,16,violet)+O(34,35,13,11,cream)+G(ribbon(rose),'translate(0 1) scale(.53)');
window.MGArt={machine:original.machine,item:(line,rank)=>original.item(line,rank)||shape(set[line][rank-1]),part:(f,r)=>shape(G([O(30,31,15,15,gold)+O(30,31,7,7,coffee)+P('m30 30 10-9'),R(19,13,23,18,4,mint)+P('m26 31 0 18h11V31z',gold),R(15,19,34,25,4,gold)+R(22,23,20,10,2,cream),P('M8 36q-4-19 11-17 4-15 15-6 13-11 15 5 13-3 10 13L36 51l-12-1z',rose)+P('m19 23 10 23m5-29-2 27m14-22-10 22'),set[8][0],P('m14 32 18-18 17 14-19 21z',gold)+O(32,30,4,4,cream)][f],r===1?'translate(2 2) scale(.91)':'translate(0 0)')+(r>1?spark(50,12):''))};
})();
/* Preserve illustrated menu and wardrobe pieces, with separate fallback art for v2 items. */
(()=>{
const legacy=window.MGArt;
const refs=[
 [[1,3],[0,3],[1,4],[0,4],[0,5],[0,6],[0,7],[0,8],null],
 [[2,3],[3,3],[2,4],[2,5],[1,5],[1,6],null,null,null],
 [[4,1],null,[4,3],[4,4],[4,6],[4,5],[4,7],[4,8]],
 [[5,1],[5,2],[5,5],null,null,[5,7],[5,8],null],
 [null,null,null,null,null,null,null,null],
 [null,null,null,null,null,null,null,null],
 [[8,3],[8,4],[8,4],null,[8,5],[8,5],null,null],
 [[9,1],[9,2],[8,4],null,[8,5],[8,6],[8,7],[8,8]]
];
window.MGArt={...legacy,item:(line,rank)=>{const ref=refs[line]?.[rank-1];return ref?legacy.item(...ref):'';}};
})();
