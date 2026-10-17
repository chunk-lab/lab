#!/usr/bin/env python3
"""チャンクストリームを「開け閉めできる部品」に包む（進める順番5で共通部品を使う形に組み直すまでの、つなぎ）。
   python3 games/stream/tools/build_module.py  →  games/stream/out/stream.js
   直すのは src/（stream.html・stream.css・stream.js）。置きかえ先が見つからないときは止まって知らせる。 """
import os, sys, json
ST = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ST, '..', '..', 'tools'))
from scope_css import scope_css
r = lambda *p: open(os.path.join(ST, *p), encoding='utf-8').read()
FIX = [   # 元は1ページ用に書いてあるので、部品として動くように置きかえる
    ('localStorage', '__LS'),                                       # セーブは共通部品（ゲーム専用の保存場所）へ
    ('document.addEventListener(', '__docOn('),                    # 閉じるときに外せるように記録
    ('document.body.appendChild', '__root.appendChild'),           # 飛ぶ演出などは、このゲームの箱の中に出す
    ('document.documentElement.style.setProperty', '__root.style.setProperty'),
    ('document.documentElement.classList.toggle("fsb"', '__root.classList.toggle("fsb"'),
    ('`img/chara/', '`${__BASE}img/chara/'), ('src="img/chara/', 'src="${__BASE}img/chara/'),
    ('`audio/voice/', '`${__BASE}audio/voice/'),
]
js = r('src', 'stream.js')
for a, b in FIX:
    if a not in js: sys.exit('stream.js に「%s」が見つかりません（tools/build_module.py の FIX を直してください）' % a)
    js = js.replace(a, b)
css = scope_css(r('src', 'stream.css'), '.ct-stream')
html = r('src', 'stream.html')
mod = """/* チャンクストリーム（games/stream/tools/build_module.py が src/ から作る。直すのは src/ のほう） */
(function(){
var CSS=%s, HTML=%s, FONT="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=M+PLUS+Rounded+1c:wght@500;700;800&family=Lexend:wght@400;500;600;700&display=swap";
window.StreamApp=function(__root,ctx){
  if(!document.querySelector('style[data-ct="stream"]')){var st=document.createElement("style");st.setAttribute("data-ct","stream");st.textContent=CSS;document.head.appendChild(st)}
  if(!document.querySelector('link[data-ct="stream"]')){var lk=document.createElement("link");lk.rel="stylesheet";lk.href=FONT;lk.setAttribute("data-ct","stream");document.head.appendChild(lk)}
  const __BASE=ctx.base;
  __root.classList.add("ct-stream");__root.innerHTML=HTML.replace(/(src|href)="(img|audio)\\//g,(m,at,d)=>at+'="'+__BASE+d+'/');
  const __iv=[],__to=[],__ls=[];
  const setInterval=(f,t)=>{const i=window.setInterval(f,t);__iv.push(i);return i};
  const setTimeout=(f,t)=>{const i=window.setTimeout(f,t);__to.push(i);return i};
  const addEventListener=(t,f,o)=>{window.addEventListener(t,f,o);__ls.push([window,t,f,o])};
  const __docOn=(t,f,o)=>{document.addEventListener(t,f,o);__ls.push([document,t,f,o])};
  const __LS={getItem:k=>{const v=ctx.store.get(k);return v==null?null:v},setItem:(k,v)=>ctx.store.set(k,v)};
/* ===== ここから games/stream/src/stream.js ===== */
%s
/* ===== ここまで ===== */
  {const __show=show;show=function(id){__show(id);ctx.showBack(id==="sTitle"||id==="sHome")}}
  ctx.showBack(true);
  return {unmount(){
    try{ctx.core.reader.close()}catch(e){} try{endRun()}catch(e){} try{hush()}catch(e){} try{bgmStop()}catch(e){} try{AC&&AC.close()}catch(e){}
    try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}
    __iv.forEach(i=>window.clearInterval(i));__to.forEach(i=>window.clearTimeout(i));__ls.forEach(([o,t,f,op])=>o.removeEventListener(t,f,op));
    __root.innerHTML="";
  }};
};
})();
""" % (json.dumps(css, ensure_ascii=False).replace('</', '<\\/'), json.dumps(html, ensure_ascii=False).replace('</', '<\\/'), js)
os.makedirs(os.path.join(ST, 'out'), exist_ok=True)
open(os.path.join(ST, 'out', 'stream.js'), 'w', encoding='utf-8').write(mod)
print('stream: out/stream.js')
