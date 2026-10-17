#!/usr/bin/env python3
"""ぷにチャンク・チャンク・カードを、シリーズ（共通部品の土台）用に組み立てる。
   python3 games/cb/tools/series_build.py  →  games/cb/out/punichunk.js, games/cb/out/cards.js
   （もとのビルド build.py / tools/build_cards.py はそのまま使える） """
import os, re, sys, json, subprocess, shutil
CB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(CB, '..', '..', 'tools'))
from scope_css import scope_css
r = lambda *p: open(os.path.join(CB, *p), encoding='utf-8').read()
subprocess.run([sys.executable, os.path.join(CB, 'build.py')], check=True, cwd=CB, stdout=subprocess.DEVNULL)
out = os.path.join(CB, 'out'); os.makedirs(out, exist_ok=True)
shutil.copy(os.path.join(CB, 'dist', 'punichunk.js'), os.path.join(out, 'punichunk.js'))
shell = r('cards', 'shell.html')
css = scope_css(re.search(r'<style>(.*?)</style>', shell, re.S).group(1), '.ct-cards')
css += '\n.ct-cards{position:absolute;inset:0;background:#1e1633;color:#fff;font-family:"Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans JP",sans-serif;overflow:hidden}.ct-cards .cc-app{position:relative;max-width:480px;height:100%;margin:0 auto;background:radial-gradient(120% 80% at 50% 0%,#4b3a7a,#3d2f63 40%,#1e1633);overflow:hidden}'
js = ('/* チャンク・カード（games/cb/tools/series_build.py が cards/ から作る。直すのは cards/ のほう） */\n'
      '(function(){if(document.querySelector(\'style[data-ct="cards"]\'))return;var s=document.createElement("style");s.setAttribute("data-ct","cards");s.textContent=' + json.dumps(css, ensure_ascii=False) + ';document.head.appendChild(s)})();\n'
      + r('cards', 'cards.js') + '\n' + r('cards', 'vs.js'))
open(os.path.join(out, 'cards.js'), 'w', encoding='utf-8').write(js)
print('cb: out/punichunk.js, out/cards.js')
