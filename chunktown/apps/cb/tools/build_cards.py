#!/usr/bin/env python3
"""チャンク・カードのビルド:dist/punichunk.js(判定・辞書)+ cards/cards.js → out/chunkcards.html(1ファイル)"""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
r = lambda p: open(os.path.join(ROOT, p), encoding='utf-8').read()
core = r('dist/punichunk.js').replace('</script', '<\\/script')
cards = (r('cards/cards.js') + '\n' + r('cards/vs.js')).replace('</script', '<\\/script')
html = r('cards/shell.html').replace('/*@@CORE@@*/', core).replace('/*@@CARDS@@*/', cards)
os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
open(os.path.join(ROOT, 'out', 'chunkcards.html'), 'w', encoding='utf-8').write(html)
print('out/chunkcards.html %.1fKB' % (len(html.encode()) / 1024))
