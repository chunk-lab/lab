#!/usr/bin/env python3
"""チャンクタウン（統合アプリ）のビルド。  python3 build.py  →  dist/ に一式（index.html ＋ 画像・アプリのファイル）

 フォルダ
  core/            土台（全アプリ共通）：core.js（しくみ）・town.js（街の画面）・shell.html（画面の骨組みと見た目）・img/
  apps/adapters/   各アプリを土台につなぐ「組み込み口」
  apps/cb/         ぷにチャンク＋チャンク・カード（もとのプロジェクトのまま。単体でも apps/cb/build.py でビルドできる）
  apps/chunkchunk/ チャンクチャンク
  apps/stream/      チャンクストリーム（src/＝画面・見た目・動き、data/＝長文と単語、assets/＝画像と声、tools/＝データを作る道具）
"""
import os, re, shutil, subprocess, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'dist')
r = lambda *p: open(os.path.join(ROOT, *p), encoding='utf-8').read()

def scope_css(css, scope):
    """CSS をすべて scope の中だけに効くように直す（html/body/#app はその箱そのものに）"""
    out, i = [], 0
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    def sel(s):
        parts = []
        for x in s.split(','):
            x = x.strip()
            if not x: continue
            if x in ('html', 'body', 'html,body', ':root', '#app'): parts.append(scope); continue
            x = re.sub(r'^(html|body)\s*', '', x).replace('#app', scope)
            parts.append(x if x.startswith(scope) else scope + ' ' + x)
        return ','.join(parts)
    while i < len(css):
        j = css.find('{', i)
        if j < 0: break
        head = css[i:j].strip()
        if head.startswith('@media') or head.startswith('@supports'):
            depth, k = 1, j + 1
            while depth:
                depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
            out.append(head + '{' + scope_css(css[j + 1:k - 1], scope) + '}'); i = k; continue
        if head.startswith('@keyframes') or head.startswith('@font-face'):
            depth, k = 1, j + 1
            while depth:
                depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
            out.append(css[i:k].strip()); i = k; continue
        k = css.find('}', j)
        out.append(sel(head) + '{' + css[j + 1:k] + '}'); i = k + 1
    return '\n'.join(out)

def main():
    if os.path.isdir(DIST): shutil.rmtree(DIST)
    os.makedirs(os.path.join(DIST, 'apps'))
    shutil.copytree(os.path.join(ROOT, 'core', 'img'), os.path.join(DIST, 'img'))
    # ぷにチャンク（もとのビルドをそのまま使う）
    subprocess.run([sys.executable, os.path.join(ROOT, 'apps', 'cb', 'build.py')], check=True, cwd=os.path.join(ROOT, 'apps', 'cb'))
    shutil.copy(os.path.join(ROOT, 'apps', 'cb', 'dist', 'punichunk.js'), os.path.join(DIST, 'apps', 'punichunk.js'))
    # チャンク・カード：CSS を .ct-cards の中だけに効くようにして、JS に入れる
    shell = r('apps', 'cb', 'cards', 'shell.html')
    css = scope_css(re.search(r'<style>(.*?)</style>', shell, re.S).group(1), '.ct-cards')
    css += '\n.ct-cards{position:absolute;inset:0;background:#1e1633;color:#fff;font-family:"Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans JP",sans-serif;overflow:hidden}.ct-cards .cc-app{position:relative;max-width:480px;height:100%;margin:0 auto;background:radial-gradient(120% 80% at 50% 0%,#4b3a7a,#3d2f63 40%,#1e1633);overflow:hidden}'
    cards = ('(function(){var s=document.createElement("style");s.setAttribute("data-ct","cards");s.textContent=' + repr_js(css) + ';document.head.appendChild(s)})();\n'
             + r('apps', 'cb', 'cards', 'cards.js') + '\n' + r('apps', 'cb', 'cards', 'vs.js'))
    open(os.path.join(DIST, 'apps', 'cards.js'), 'w', encoding='utf-8').write(cards)
    # チャンクチャンク
    shutil.copytree(os.path.join(ROOT, 'apps', 'chunkchunk'), os.path.join(DIST, 'apps', 'chunkchunk'))
    build_stream()
    # 土台＋組み込み口 → index.html
    core = '\n'.join(r('core', f) for f in ('core.js', 'town.js')) + '\n' + '\n'.join(r('apps', 'adapters', f) for f in sorted(os.listdir(os.path.join(ROOT, 'apps', 'adapters'))) if f.endswith('.js'))
    html = r('core', 'shell.html').replace('/*@@CORE@@*/', core.replace('</script', '<\\/script')).replace('/*@@APPCSS@@*/', '')
    open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(html)
    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(DIST) for f in fs)
    print('dist/ %.1fMB, %d files' % (total / 1048576, sum(len(fs) for _, _, fs in os.walk(DIST))))

STREAM_FIX = [   # チャンクストリームを「開け閉めできる部品」にするための置きかえ（元は1ページ用に書いてある）
    ('localStorage', '__LS'),                                        # セーブは土台の保存場所へ
    ('document.addEventListener(', '__docOn('),                     # 閉じるときに外せるように記録
    ('document.body.appendChild', '__root.appendChild'),            # 飛ぶ演出などは、このアプリの箱の中に出す
    ('document.documentElement.style.setProperty', '__root.style.setProperty'),
    ('document.documentElement.classList.toggle("fsb"', '__root.classList.toggle("fsb"'),
    ('img/chara/', 'apps/stream/img/chara/'), ('audio/voice/', 'apps/stream/audio/voice/'),
    ('`reading/index.html', '`apps/stream/reading/index.html'),
]
def build_stream():
    S = os.path.join(ROOT, 'apps', 'stream')
    out = os.path.join(DIST, 'apps', 'stream'); os.makedirs(out)
    for f in os.listdir(os.path.join(S, 'data')): shutil.copy(os.path.join(S, 'data', f), out)
    for n in os.listdir(os.path.join(S, 'assets')): shutil.copytree(os.path.join(S, 'assets', n), os.path.join(out, n))
    shutil.copytree(os.path.join(S, 'reading'), os.path.join(out, 'reading'))
    js = r('apps', 'stream', 'src', 'stream.js')
    for a, b in STREAM_FIX:
        if a not in js: sys.exit('stream.js に「%s」が見つかりません（STREAM_FIX を直してください）' % a)
        js = js.replace(a, b)
    css = scope_css(r('apps', 'stream', 'src', 'stream.css'), '.ct-stream')
    html = r('apps', 'stream', 'src', 'stream.html')
    mod = """/* チャンクストリーム（build.py が apps/stream/src から作る。直すのは src のほう） */
(function(){
var CSS=%s, HTML=%s, FONT="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=M+PLUS+Rounded+1c:wght@500;700;800&family=Lexend:wght@400;500;600;700&display=swap";
window.StreamApp=function(__root,ctx){
  if(!document.querySelector('style[data-ct="stream"]')){var st=document.createElement("style");st.setAttribute("data-ct","stream");st.textContent=CSS;document.head.appendChild(st)}
  if(!document.querySelector('link[data-ct="stream"]')){var lk=document.createElement("link");lk.rel="stylesheet";lk.href=FONT;lk.setAttribute("data-ct","stream");document.head.appendChild(lk)}
  __root.classList.add("ct-stream");__root.innerHTML=HTML;
  const __iv=[],__to=[],__ls=[];
  const setInterval=(f,t)=>{const i=window.setInterval(f,t);__iv.push(i);return i};
  const setTimeout=(f,t)=>{const i=window.setTimeout(f,t);__to.push(i);return i};
  const addEventListener=(t,f,o)=>{window.addEventListener(t,f,o);__ls.push([window,t,f,o])};
  const __docOn=(t,f,o)=>{document.addEventListener(t,f,o);__ls.push([document,t,f,o])};
  const __LS={getItem:k=>{const v=ctx.storage.get(k);return v==null?null:v},setItem:(k,v)=>ctx.storage.set(k,v)};
/* ===== ここから apps/stream/src/stream.js ===== */
%s
/* ===== ここまで ===== */
  {const __show=show;show=function(id){__show(id);ctx.showBack(id==="sTitle"||id==="sHome")}}
  ctx.showBack(true);
  return {unmount(){
    try{endRun()}catch(e){} try{hush()}catch(e){} try{bgmStop()}catch(e){} try{AC&&AC.close()}catch(e){}
    try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}
    __iv.forEach(i=>window.clearInterval(i));__to.forEach(i=>window.clearTimeout(i));__ls.forEach(([o,t,f,op])=>o.removeEventListener(t,f,op));
    __root.innerHTML="";
  }};
};
})();
""" % (repr_js(css), repr_js(html), js)
    open(os.path.join(DIST, 'apps', 'stream.js'), 'w', encoding='utf-8').write(mod)

def repr_js(s):
    import json
    return json.dumps(s, ensure_ascii=False).replace('</', '<\\/')

if __name__ == '__main__':
    main()
