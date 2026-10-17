#!/usr/bin/env python3
"""ぷにチャンクのビルド。
  python3 build.py            → dist/punichunk.js(組み込み用) と dist/index.html(単体で遊べる1ファイル)
"""
import os, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
DIST = os.path.join(ROOT, 'dist')
ORDER = ['util.js', 'dict_data.js', 'dict.js', 'grammar.js', 'seed_data.js', 'seeds.js', 'supply.js', 'art.js', 'audio.js', 'game.js', 'tutorial.js', 'ui.js', 'app.js']

def read(n):
    with open(os.path.join(SRC, n), encoding='utf-8') as f:
        return f.read()

def build():
    body = '\n'.join('/* ===== FILE: %s ===== */\n%s' % (n, read(n)) for n in ORDER)
    js = ('/*! ぷにチャンク (PuniChunk) — 英語脳バブルパズル。外部ライブラリなし。 */\n'
          '(function (global) {\n"use strict";\n' + body +
          '\nglobal.PuniChunk = PuniChunk;\n'
          'if (typeof module !== "undefined" && module.exports) module.exports = PuniChunk;\n'
          '})(typeof window !== "undefined" ? window : this);\n')
    os.makedirs(DIST, exist_ok=True)
    with open(os.path.join(DIST, 'punichunk.js'), 'w', encoding='utf-8') as f:
        f.write(js)
    shell = read('shell.html')
    html = shell.replace('/*@@SCRIPT@@*/', js.replace('</script', '<\\/script'))
    with open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)
    print('dist/punichunk.js %.1fKB, dist/index.html %.1fKB' % (len(js.encode()) / 1024, len(html.encode()) / 1024))

if __name__ == '__main__':
    build()
