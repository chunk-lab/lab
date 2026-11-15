/* Original game pictograms, drawn on a common 64-unit grid. */
(()=>{
const common=(body)=>'<svg aria-hidden="true" viewBox="0 0 64 64" class="mg-art"><g stroke="#6b5047" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">'+body+'</g></svg>';
const path=(d,fill)=>'<path d="'+d+'" fill="'+fill+'"/>';
const circ=(x,y,r,c)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'"/>';
const rect=(x,y,w,h,r,c)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+c+'"/>';
const shine=path('M14 19q2-5 8-6','none');
const crate=(a,b)=>path('m6 23 29-9 23 8-28 12z',b)+path('m6 23 24 10v23L8 47z',a)+path('m30 33 28-11-2 25-26 10z',b)+path('m10 35 16 6m9-2 17-6','none');
const art={
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
