#!/usr/bin/env python3
"""v12単語帳(original_records.csv)から、語ごとの「英検の級」などの集計だけを取り出す。  python3 tools/build_v12_levels.py [original_records.csv]
 → data/words/v12_levels.csv（語・区分・最低の級・最高の級・意味の数・出典の数）。
 ※ 訳の文・出典の名前は書き出さない（出典サイトの利用条件を確認するまで、集計の数だけを使う）。"""
import csv, os, sys, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/v12/x/original_records.csv'
EIK = ['5級', '4級', '3級', '準2級', '準2級プラス', '2級', '準1級', '1級']
rk = lambda s: EIK.index(s) if s in EIK else None
g = collections.defaultdict(lambda: {'rk': [], 'rows': 0, 'src': set(), 'kind': collections.Counter(), 'pos': collections.Counter(), 'ja': set()})
for x in csv.DictReader(open(SRC, encoding='utf-8-sig')):
    w = x['単語'].strip().lower()
    if not w: continue
    e = g[w]; e['rows'] += 1
    for s in (x['代表レベル'] + '・' + x['登場レベル']).split('・'):
        i = rk(s.strip()) if s.strip() else None
        if i is not None: e['rk'].append(i)
    for s in x['出典'].split('・'):
        if s.strip(): e['src'].add(s.strip())
    e['kind'][x['区分'] or x['品詞']] += 1; e['pos'][x['品詞']] += 1; e['ja'].add(x['訳'].strip())
with open(os.path.join(ROOT, 'data', 'words', 'v12_levels.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f); w.writerow(['単語', '区分', '品詞(多い順)', '最低の級', '最高の級', '意味の数', '出典の数'])
    for k, e in sorted(g.items()):
        if not e['rk']: continue
        w.writerow([k, e['kind'].most_common(1)[0][0], '・'.join(p for p, _ in e['pos'].most_common(3) if p), EIK[min(e['rk'])], EIK[max(e['rk'])], len(e['ja']), len(e['src'])])
print(len(g), 'words')
