#!/usr/bin/env python3
"""辞書の「訳の候補」を、v12単語帳の訳と照らして、よく使われる意味の順に並べるための点数表を作る。
   python3 tools/build_sense_scores.py [original_records.csv]  →  data/words/sense_scores.tsv
 点数 = その訳(自分たちの辞書のもの)と重なる意味を書いている、v12の行の出典の数の合計。
 v12の訳の文は書き出さない(点数だけ)。games/stream/tools/build_words2.py が、これで訳の順を並べかえる。"""
import csv, os, re, sys, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V12 = sys.argv[1] if len(sys.argv) > 1 else '/tmp/v12/x/original_records.csv'
DICT = os.path.join(ROOT, 'data', 'dict') + '/'
POSMAP = {'n': 'n', 'p': 'n', 'an': 'n', 'v': 'v', 'a': 'a', 'r': 'r', 'adj': 'a', 'adv': 'r'}
V12POS = {'名詞': 'n', '動詞': 'v', '形容詞': 'a', '副詞': 'r'}
def dsrc(path):
    x = open(path, encoding='utf8').read()
    return re.search(r'"(.*)"', x, re.S).group(1).encode().decode('unicode_escape').encode('latin1').decode('utf8')
# 自分たちの辞書の訳の候補: (語,品詞) → [訳, ...]
CAND = collections.defaultdict(list)
def addc(w, p, ms):
    for m in ms:
        m = m.strip()
        if m and m not in CAND[(w, p)]: CAND[(w, p)].append(m)
for n, l in enumerate(dsrc(DICT + 'chunkchunk_dictx.js').split('\n')):
    f = l.split('\t')
    if len(f) < 2: continue
    for seg in f[1].split(';'):
        if '=' in seg:
            p, ms = seg.split('=', 1)
            if p in POSMAP: addc(f[0], POSMAP[p], ms.split(','))
big = open(DICT + 'big.js', encoding='utf8').read()
for k, v in re.findall(r'\n  (\w+):`(.*?)`', big, re.S):
    for l in v.split('\n'):
        f = l.split('\t')
        if len(f) >= 3 and k in POSMAP: addc(f[0], POSMAP[k], re.split(r'[、,]', f[1]))
# v12: 語 → [(訳, 出典の数, 品詞)]
CLEAN = re.compile(r'[（(][^）)]*[）)]|[〜～~]|[・\s]')
def core(s): return CLEAN.sub('', s)
V = collections.defaultdict(list)
for x in csv.DictReader(open(V12, encoding='utf-8-sig')):
    w = x['単語'].strip().lower()
    if ' ' in w: continue
    ns = len([s for s in x['出典'].split('・') if s.strip()]) or 1
    V[w].append((core(x['訳']), ns, V12POS.get(x['品詞'])))
KJ = re.compile(r'[一-龥ァ-ヶー]{2,}')
def overlap(m, t):
    m = core(m); 
    if not m or not t: return False
    if m == t or (len(m) >= 2 and (m in t or t in m)): return True
    return bool(set(KJ.findall(m)) & set(KJ.findall(t))) or any(g in t for k in KJ.findall(m) for g in {k[i:i + 2] for i in range(len(k) - 1)} if not re.fullmatch(r'[ぁ-ん]+', g))
HK = re.compile(r'[一-龥]'); COMMONK = set('的性者物事人用化式中内外上下大小')
def weak(m, t):   # 漢字を1字だけ共有(閉じる／閉める)。弱い一致として半分の点
    a = {c for c in HK.findall(core(m))} - COMMONK; b = {c for c in HK.findall(t)} - COMMONK
    return bool(a & b)
out = []; nz = 0; tot = 0
for (w, p), ms in sorted(CAND.items()):
    if w not in V: continue
    rows = [r for r in V[w] if r[2] in (None, p)] or V[w]
    for m in ms:
        s = sum(ns if overlap(m, t) else ns * 0.5 if weak(m, t) else 0 for t, ns, _ in rows); out.append((w, p, m, s)); tot += 1; nz += s > 0
with open(os.path.join(ROOT, 'data', 'words', 'sense_scores.tsv'), 'w', encoding='utf8') as f:
    f.write('# 語\\t品詞\\t訳(自分たちの辞書)\\tv12での点数(出典の数の合計)。build_sense_scores.py が作る\n')
    for w, p, m, s in out: f.write(f'{w}\t{p}\t{m}\t{s:g}\n')
print('candidates', tot, 'with score>0', nz, 'words', len({o[0] for o in out}))
