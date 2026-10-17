#!/usr/bin/env python3
"""共通の辞書を作る（全アプリで1つ）。  python3 tools/build_dict.py  →  core/dict/data.js
 読む画面の単語タップ・熟語さがしで使う。単語ドリルのカード（短い訳）は games/stream/tools/build_words2.py が同じ材料から作る。

 材料（上ほど優先。同じ単語・同じ品詞なら上の意味を使う）
  1. data/dict/chunkchunk_dict.js  … よく使う2000語（手直し済み）
  2. data/dict/chunkchunk_dictx.js … 約1万語＋複合語・熟語（EJDict / WordNet / FrequencyWords）
  3. data/dict/big.js              … 英語脳アプリの辞書（約2.9万語・動詞の変化形つき）
  4. games/stream/tools/idioms.txt … 熟語（ドリル用に直した訳）
 書き出す形（1行1語）：単語<TAB>品詞=意味,意味;品詞=意味<TAB>変化形,変化形
"""
import os, re, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
OUT = P('core', 'dict', 'data.js')
BIGPOS = {'n': 'n', 'p': 'n', 'an': 'n', 'v': 'v', 'a': 'adj', 'r': 'adv'}

def js_strings(path):
    x = open(path, encoding='utf8').read()
    return [s.encode().decode('unicode_escape').encode('latin1').decode('utf8') for s in re.findall(r'"((?:[^"\\]|\\.)*)"', x)]

W = {}      # 単語 → {'pos': {品詞: [意味…]}, 'order': [品詞…], 'forms': [..]}
def add(w, pos, ms, forms=()):
    w = w.strip()
    if not w or not pos: return
    e = W.setdefault(w.lower(), {'w': w, 'pos': {}, 'order': [], 'forms': []})
    ms = [m.strip() for m in ms if m.strip()]
    if pos not in e['pos'] and ms:
        e['pos'][pos] = ms; e['order'].append(pos)
    for f in forms:
        f = f.strip()
        if f and f.lower() != w.lower() and f not in e['forms']: e['forms'].append(f)

def read_rows(src, skip=None):
    for l in src.split('\n'):
        f = l.split('\t')
        if len(f) < 2 or '=' not in f[1]: continue
        segs = [s.split('=', 1) for s in f[1].split(';') if '=' in s]
        forms = (f[2] if len(f) > 2 else '').split(',')
        if not segs: continue
        for p, m in segs:
            if skip and f[0].lower() in skip and p not in W[f[0].lower()]['pos']: continue
            add(f[0], p, m.split(','), forms)

# 1. 2000語（DICT_SRC）
read_rows(js_strings(P('data', 'dict', 'chunkchunk_dict.js'))[0])
CURATED = set(W)   # 手直し済みの語には、ほかの辞書の品詞は足さない（変化形だけもらう）（「make＝成功（名詞）」のような変な意味が出ないように）
# 2. 約1万語＋複合語・熟語
rows, phr = js_strings(P('data', 'dict', 'chunkchunk_dictx.js'))[:2]
read_rows(rows, CURATED)
PH = {}
for l in phr.split('\n'):
    f = l.split('\t')
    if len(f) == 2 and f[0] and f[1]: PH.setdefault(f[0].lower(), f[1])
# 3. 英語脳アプリの辞書
src = open(P('data', 'dict', 'big.js'), encoding='utf8').read()
for k, v in re.findall(r'\n  (\w+):`(.*?)`', src, re.S):
    if k not in BIGPOS: continue
    for l in v.split('\n'):
        f = l.split('\t')
        if len(f) < 3 or not re.fullmatch(r"[A-Za-z][A-Za-z'-]*", f[0]): continue
        forms = [x for x in f[5:7] if x and re.fullmatch(r"[A-Za-z'-]+", x)] if k == 'v' and len(f) > 6 else []
        if f[0].lower() in CURATED and BIGPOS[k] not in W[f[0].lower()]['pos']: add(f[0], BIGPOS[k], [], forms); continue   # 変化形だけもらう
        add(f[0], BIGPOS[k], [f[1]], forms)
# 4. 熟語（ドリル用の訳）：まだない熟語だけ足す
for l in open(P('games', 'stream', 'tools', 'idioms.txt'), encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    _, en, ja = l.rstrip('\n').split('\t')
    PH.setdefault(en.lower(), ja)

lines = []
for k, e in W.items():
    pos = ';'.join(p + '=' + ','.join(e['pos'][p]) for p in e['order'])
    lines.append(e['w'] + '\t' + pos + '\t' + ','.join(e['forms']))
phl = [k + '\t' + v for k, v in PH.items()]
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf8') as fp:
    fp.write('/* 共通の辞書（tools/build_dict.py が作る。手で直さない）\n'
             ' 出典：EJDict（CC0, kujirahand）／品詞：WordNet 3.1（Princeton University）・English WordNet（CC BY 4.0）／語の選定：FrequencyWords（hermitdave, CC BY-SA 4.0） */\n')
    fp.write('window.__csDictLoad(' + json.dumps('\n'.join(lines), ensure_ascii=False) + ',' + json.dumps('\n'.join(phl), ensure_ascii=False) + ');\n')
print('core/dict/data.js  %d語・熟語%d  %.1fMB' % (len(lines), len(phl), os.path.getsize(OUT) / 1048576))
