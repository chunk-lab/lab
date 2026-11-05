#!/usr/bin/env python3
"""レベルつき単語表を作る。  python3 tools/build_wordtable.py  →  data/words/word_levels.csv / word_levels.xlsx
 材料：CEFR-J Wordlist 1.5（東京外大 投野研。商用可・出典を示すこと）／Octanove C1/C2（CC BY-SA 4.0）
       ＋ 共通の辞書（core/dict/data.js）の意味・順位。
 英検・TOEIC・学校の段階は CEFR からの「目安」（公式の対応ではない）。TOEIC頻出語(TSL)は ライセンスがCC BY-SA のため未取りこみ。"""
import csv, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
# --- 共通の辞書：語 → (順位, 品詞=意味) ---
src = open(P('core', 'dict', 'data.js'), encoding='utf8').read()
body = src[src.index('__csDictLoad("') + len('__csDictLoad("'):src.rindex('")')]
body = body.encode().decode('unicode_escape').encode('latin1').decode('utf8') if '\\u' in body or '\\n' in body else body
rows = body.split('\n')
D = {}
for i, l in enumerate(rows):
    f = l.split('\t')
    if len(f) < 2: continue
    forms = [x for x in (f[2] if len(f) > 2 else '').split(',') if x]
    e = (i + 1, f[1])
    D.setdefault(f[0].lower(), e)
    for x in forms: D.setdefault(x.lower(), e)
POSJ = {'noun': '名詞', 'verb': '動詞', 'adjective': '形容詞', 'adverb': '副詞', 'preposition': '前置詞', 'pronoun': '代名詞', 'conjunction': '接続詞', 'determiner': '限定詞', 'interjection': '間投詞', 'modal verb': '助動詞', 'auxiliary verb': '助動詞', 'number': '数詞', 'infinitive-to': '不定詞のto', 'be-verb': 'be動詞', 'do-verb': '助動詞', 'have-verb': '助動詞', 'article': '冠詞'}
LV = {'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6}
EIKEN = {'A1': '5〜3級', 'A2': '準2級', 'B1': '2級', 'B2': '準1級', 'C1': '1級', 'C2': '1級以上'}
TOEIC = {'A1': '〜220', 'A2': '225〜545', 'B1': '550〜780', 'B2': '785〜940', 'C1': '945〜', 'C2': '945〜'}   # ETSのCEFR対応(L&R合計)の目安
SCHOOL = {'A1': '中学', 'A2': '中学', 'B1': '高校', 'B2': '大学受験・大学', 'C1': '大学以上', 'C2': '大学以上'}
out = []
def add(path, srcname, cefr_col='CEFR'):
    for r in csv.DictReader(open(path, encoding='utf8')):
        hw = r['headword'].strip(); lv = r[cefr_col].strip()
        if not hw or lv not in LV: continue
        main = re.split(r'[/]', hw)[0].strip()
        pos = r.get('pos', '').strip()
        d = D.get(main.lower())
        out.append([main, hw if hw != main else '', POSJ.get(pos, pos), lv, LV[lv], EIKEN[lv], TOEIC[lv], SCHOOL[lv], (r.get('Threshold') or '').strip() if False else '', d[1].split(';')[0][:60] if d else '', d[0] if d else '', '○' if d else '', srcname])
add(P('data', 'words', 'src_cefrj_vocabulary_1.5.csv'), 'CEFR-J 1.5')
add(P('data', 'words', 'src_octanove_c1c2_1.0.csv'), 'Octanove C1/C2')
HEAD = ['単語', '表記ゆれ', '品詞', 'CEFR', 'レベル(1-6)', '英検の目安', 'TOEIC(L&R)の目安', '学校の段階の目安', '', 'いまの辞書の意味', '辞書内の順位', '辞書にある', '出典']
HEAD.pop(8); out = [r[:8] + r[9:] for r in out]
out.sort(key=lambda r: (r[4], r[9] if isinstance(r[9], int) else 10 ** 9, r[0].lower()))
with open(P('data', 'words', 'word_levels.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f); w.writerow(HEAD); w.writerows(out)
import openpyxl
from openpyxl.styles import Font, PatternFill
wb = openpyxl.Workbook(); ws = wb.active; ws.title = '単語表'; ws.append(HEAD); [ws.append(r) for r in out]
for c in ws[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='5B4B8A')
ws.freeze_panes = 'B2'; ws.auto_filter.ref = ws.dimensions
for col, wd in zip('ABCDEFGHIJKL', [18, 22, 10, 7, 9, 11, 14, 16, 36, 10, 8, 16]): ws.column_dimensions[col].width = wd
wb.save(P('data', 'words', 'word_levels.xlsx'))
print(len(out), 'rows; in dict:', sum(1 for r in out if r[10] == '○'))
