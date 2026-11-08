#!/usr/bin/env python3
"""series/data/examples/*.txt (見出し語 | 品詞 | 英文 | 日本語訳) を core/dict/ex.js にまとめる。
形が崩れた行は捨てて、数を表示する。"""
import glob, os, json
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows, bad = [], 0
for f in sorted(glob.glob(os.path.join(root, 'data/examples/*.txt'))):
    for l in open(f, encoding='utf8').read().split('\n'):
        if not l.strip(): continue
        p = [x.strip() for x in l.split(' | ')]
        if len(p) != 4 or not all(p) or '\t' in l: bad += 1; continue
        rows.append('\t'.join(p))
open(os.path.join(root, 'core/dict/ex.js'), 'w', encoding='utf8').write('window.__csEx = ' + json.dumps('\n'.join(rows), ensure_ascii=False) + ';\n')
print(len(rows), 'rows,', bad, 'bad')
