#!/usr/bin/env python3
"""英ラボ「単語テスト」の出題用データを作る(games/eigonou/src/wq_data.js)。
  材料: data/words/word_levels.csv(英検の級・CEFR・頻度)、toeic_user_list.csv(TOEICの点数帯)、
        my_ja.tsv(自作の訳・優先)、core/dict/data.js(訳が表にない語の訳)
  1行 = 単語\t品詞\t訳\t英検の級\tTOEIC帯\t頻度ランク   (1語だけ・出題○のもの)"""
import csv, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
GR = {'5級': '5', '4級': '4', '3級': '3', '準2級': '準2', '準2級プラス': '準2+', '2級': '2', '準1級': '準1', '1級': '1'}
def meaning(s):   # 'n=海図,水路図;v=…' → (品詞, 先頭の2つの訳)
    g = s.split(';')[0]; i = g.find('=')
    if i < 0: return None
    pos, ms = g[:i], [m.strip() for m in re.split(r'[,、]', g[i + 1:]) if m.strip()]
    return (pos, '、'.join(ms[:2])) if ms else None
mine = {}
for l in open(P('data', 'words', 'my_ja.tsv'), encoding='utf-8'):
    if l.startswith('#') or not l.strip(): continue
    w, pos, ja = (l.rstrip('\n').split('\t') + ['', '', ''])[:3]
    if w and ja: mine[w.lower()] = (pos, ja)
raw = open(P('core', 'dict', 'data.js'), encoding='utf-8').read()
m = re.search(r'__csDictLoad\(("(?:[^"\\]|\\.)*")', raw); dic = {}
for l in json.loads(m.group(1)).split('\n'):
    p = l.split('\t')
    if len(p) > 1 and p[0]: dic.setdefault(p[0].lower(), p[1])
rows = {}
for x in csv.DictReader(open(P('data', 'words', 'word_levels.csv'), encoding='utf-8-sig')):
    w = x['単語'].strip().lower()
    if not w or ' ' in w or x['出題'] != '○' or not re.fullmatch(r"[a-z][a-z'-]*", w): continue
    rows[w] = x
toeic = {}
for x in csv.DictReader(open(P('data', 'words', 'toeic_user_list.csv'), encoding='utf-8-sig')):
    w = x['単語'].strip().lower()
    if w and ' ' not in w and re.fullmatch(r"[a-z][a-z'-]*", w): toeic[w] = x['難易度目安'].replace('点', '')
out = []; seen = set()
for w in list(rows) + [t for t in toeic if t not in rows]:
    if w in seen: continue
    seen.add(w); x = rows.get(w)
    mm = mine.get(w) or (meaning(x['いまの辞書の意味']) if x and x['いまの辞書の意味'] else None) or (meaning(dic[w]) if w in dic else None)
    if not mm: continue
    pos, ja = mm
    if not ja or re.search(r'[A-Za-z]{3,}', ja): continue
    eiken = GR.get(x['英検の級(実データ)'], '') if x else ''
    rank = (x['頻度ランク'].split(' ')[0] if x and x['頻度ランク'] else '')
    rank = rank if rank.isdigit() else ''
    out.append('\t'.join([w, pos, ja, eiken, toeic.get(w, ''), rank]))
open(P('games', 'eigonou', 'src', 'wq_data.js'), 'w', encoding='utf-8').write(
    '// 単語テストの出題データ(tools/build_wq.py が作る。手で直さない)\n// 出典: CEFR-J Wordlist 1.5(Tono)・自作の英検級表/TOEIC表・EJDict(CC0)ほか。詳しくは data/words/README.md\n'
    'export const WQ_TSV = ' + json.dumps('\n'.join(out), ensure_ascii=False) + ';\n')
print(len(out), '語')
