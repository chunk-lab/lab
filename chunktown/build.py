#!/usr/bin/env python3
"""チャンクタウン（統合アプリ）のビルド。  python3 build.py  →  dist/ に一式（index.html ＋ 画像・アプリのファイル）

 フォルダ
  core/            土台（全アプリ共通）：core.js（しくみ）・town.js（街の画面）・shell.html（画面の骨組みと見た目）・img/
  apps/adapters/   各アプリを土台につなぐ「組み込み口」
  apps/cb/         ぷにチャンク＋チャンク・カード（もとのプロジェクトのまま。単体でも apps/cb/build.py でビルドできる）
  apps/chunkchunk/ チャンクチャンク
  （チャンクストリームのソースは /home/claude/game。ステップ2で apps/stream に移す）
"""
import os, re, shutil, subprocess, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'dist')
GAME = '/home/claude/game'
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
    # チャンクストリーム（いまは /home/claude/game のビルド結果）
    st = os.path.join(DIST, 'apps', 'stream'); os.makedirs(st)
    for n in ('img', 'audio', 'reading'): shutil.copytree(os.path.join(GAME, 'app', n), os.path.join(st, n))
    for n in ('data.js', 'pool.js', 'words.js', 'bank.js'): shutil.copy(os.path.join(GAME, 'app', n), st)
    g = open(os.path.join(GAME, 'app', 'index.html'), encoding='utf-8').read()
    open(os.path.join(st, 'index.html'), 'w', encoding='utf-8').write('<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + g + '\n</body></html>')
    # 土台＋組み込み口 → index.html
    core = '\n'.join(r('core', f) for f in ('core.js', 'town.js')) + '\n' + '\n'.join(r('apps', 'adapters', f) for f in sorted(os.listdir(os.path.join(ROOT, 'apps', 'adapters'))) if f.endswith('.js'))
    html = r('core', 'shell.html').replace('/*@@CORE@@*/', core.replace('</script', '<\\/script')).replace('/*@@APPCSS@@*/', '')
    open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(html)
    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(DIST) for f in fs)
    print('dist/ %.1fMB, %d files' % (total / 1048576, sum(len(fs) for _, _, fs in os.walk(DIST))))

def repr_js(s):
    import json
    return json.dumps(s, ensure_ascii=False).replace('</', '<\\/')

if __name__ == '__main__':
    main()
