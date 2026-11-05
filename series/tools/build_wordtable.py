#!/usr/bin/env python3
"""レベル・頻度つき単語表を作る。
   python3 tools/build_wordtable.py [en_full.txt]  →  data/words/word_levels.csv / word_levels.xlsx
 材料
  ・CEFR-J Wordlist 1.5（東京外大 投野研。商用可・出典を示すこと）／Octanove C1/C2（CC BY-SA 4.0）
  ・共通の辞書 core/dict/data.js（意味・変化形）
  ・頻度：FrequencyWords 2018 en_full.txt（hermitdave、OpenSubtitles由来。CC BY-SA 4.0）。
     ファイルがあるときは data/words/freq_counts.tsv を作り直す。なければ freq_counts.tsv をつかう。
 英検・TOEIC・学校の段階は CEFR からの「目安」（公式の対応ではない）。TOEIC頻出語(TSL)は未取りこみ。
 頻度は「原形＋変化形の合計」。Zipf=log10(10億語あたりの出現数)。"""
import csv, re, os, sys, math, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
# --- 共通の辞書 ---
src = open(P('core', 'dict', 'data.js'), encoding='utf8').read()
body = src[src.index('__csDictLoad("') + len('__csDictLoad("'):src.rindex('")')]
body = body.encode().decode('unicode_escape').encode('latin1').decode('utf8') if '\\u' in body or '\\n' in body else body
DICT = []   # (語, 品詞=意味, [変化形])
for l in body.split('\n'):
    f = l.split('\t')
    if len(f) < 2: continue
    DICT.append((f[0], f[1], [x for x in (f[2] if len(f) > 2 else '').split(',') if x]))
INDICT = {}
for i, (w, m, fo) in enumerate(DICT):
    INDICT.setdefault(w.lower(), i)
    for x in fo: INDICT.setdefault(x.lower(), i)
# --- 頻度 ---
FQ = P('data', 'words', 'freq_counts.tsv'); BIG = sys.argv[1] if len(sys.argv) > 1 else '/tmp/wl/en_full.txt'
TOTAL = 734777659
if os.path.exists(BIG):
    cnt = {}
    for l in open(BIG, encoding='utf8'):
        f = l.split()
        if len(f) == 2 and f[1].isdigit(): cnt[f[0]] = int(f[1])
    need = set(INDICT) | {w.lower() for w, _, _ in DICT}
    open(FQ, 'w', encoding='utf8').write('\n'.join(f'{w}\t{c}' for w, c in sorted(cnt.items(), key=lambda t: -t[1]) if c >= 20 or w in need) + '\n')
CNT = {}
for l in open(FQ, encoding='utf8'):
    w, c = l.rstrip('\n').split('\t'); CNT[w] = int(c)
def zipf(c): return round(math.log10(c / TOTAL * 1e9), 2) if c > 0 else None
def count_of(i):   # 辞書の i 番目の語の頻度＝原形＋変化形
    w, _, fo = DICT[i]; return sum(CNT.get(x.lower(), 0) for x in {w.lower(), *[f.lower() for f in fo]})
TIER = [(5.5, '1 超頻出'), (4.7, '2 頻出'), (3.9, '3 ふつう'), (3.1, '4 やや珍しい'), (-9, '5 珍しい')]
def tier(z): return next(t for th, t in TIER if z is not None and z >= th) if z is not None else ''
# --- CEFR ---
POSJ = {'noun': '名詞', 'verb': '動詞', 'adjective': '形容詞', 'adverb': '副詞', 'preposition': '前置詞', 'pronoun': '代名詞', 'conjunction': '接続詞', 'determiner': '限定詞', 'interjection': '間投詞', 'modal verb': '助動詞', 'auxiliary verb': '助動詞', 'number': '数詞', 'infinitive-to': '不定詞のto', 'be-verb': 'be動詞', 'do-verb': '助動詞', 'have-verb': '助動詞', 'article': '冠詞'}
LV = {'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6}
LVN = {v: k for k, v in LV.items()}
EIKEN = {'A1': '5〜3級', 'A2': '準2級', 'B1': '2級', 'B2': '準1級', 'C1': '1級', 'C2': '1級以上'}
TOEIC = {'A1': '〜220', 'A2': '225〜545', 'B1': '550〜780', 'B2': '785〜940', 'C1': '945〜', 'C2': '945〜'}
SCHOOL = {'A1': '中学', 'A2': '中学', 'B1': '高校', 'B2': '大学受験・大学', 'C1': '大学以上', 'C2': '大学以上'}
def base_in_dict(w):   # 語尾の変化だけなら、原形が辞書にあるか
    w = w.lower()
    for suf, rep in (('ing', ''), ('ing', 'e'), ('ed', ''), ('ed', 'e'), ('ies', 'y'), ('es', ''), ('s', ''), ('ly', ''), ('er', ''), ('est', ''), ('ied', 'y')):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            b = w[:-len(suf)] + rep
            if b in INDICT: return b
            if len(b) > 2 and b[-1] == b[-2] and b[:-1] in INDICT: return b[:-1]
    return ''

# --- 区分(出題していいか) ---
FIRST = {l.strip().lower() for l in open(P('data', 'words', 'src_first_names_us.txt'), encoding='utf8', errors='ignore') if l.strip()}   # 人名(名)。パブリックドメイン(smashew/NameDatabases)
FRAG = set("don won ll ve re isn aren wasn weren doesn didn hasn haven hadn couldn wouldn shouldn mustn ain gonna wanna gotta gimme lemme uh um hmm huh mm ah ha ya em cuz cos hm oop whoa woo".split())
SHORT = set('me an us am oh ex up so do go no to of in on it is as at be by he if my or we hi ok ah ox pa ma id'.split())   # 本物の短い語
NAMEWORD = re.compile(r'^[a-z]+=[(（](男|女)?性?の?(名|愛称|人名)[)）]|^[a-z]+=(男|女)(性)?の(名|愛称)([,;]|$)')   # 意味の先頭が「(男の)名」「男の愛称」など
PLACE = re.compile(r'国名|地名|都市|[〜…]州|州都|首都|\bの川|湖|山脈|半島|諸島|大陸|洋|海峡')
def classify(w, mean, cefr_known, z, is_phrase):
    wl = w.lower(); m0 = mean
    if is_phrase: return '熟語・複合語', '○'
    if wl in FRAG or re.search(r"[\d_]", w): return '話しことばの断片', '×'
    if len(wl) <= 2 and not cefr_known and wl not in SHORT: return '略語・短すぎる', '×'
    if NAMEWORD.search(m0): return '人名', '×'
    if wl in FIRST and not cefr_known: return '人名にもなる語', '△'
    if w[:1].isupper() or PLACE.search(m0): return '固有名詞(地名・国・言語など)', '△'
    if not cefr_known and z is not None and z < 2.3: return '専門・ほぼ使わない', '△'
    if not cefr_known and z is None: return '頻度なし', '△'
    return '通常', '○'

rows = []   # 単語表(CEFR-Jなど1行=単語×品詞)
best = {}   # 辞書の語 → 最小CEFR(数字)
def add(path, srcname):
    for r in csv.DictReader(open(path, encoding='utf8')):
        hw = r['headword'].strip(); lv = r['CEFR'].strip()
        if not hw or lv not in LV: continue
        main = re.split(r'[/]', hw)[0].strip(); pos = POSJ.get(r.get('pos', '').strip(), r.get('pos', '').strip())
        i = INDICT.get(main.lower()); status = '辞書にある' if i is not None else ''
        if i is None:
            b = base_in_dict(main)
            if b: i, status = INDICT[b], f'変化形（原形 {b} は辞書にある）'
            else: status = '辞書にない' + ('（熟語・複合語）' if re.search(r"[ \-.']", main) else '')
        if i is not None: best[i] = min(best.get(i, 9), LV[lv])
        c = count_of(i) if i is not None else CNT.get(main.lower(), 0); z = zipf(c)
        rows.append([main, hw if hw != main else '', pos, lv, LV[lv], EIKEN[lv], TOEIC[lv], SCHOOL[lv], tier(z), z if z else '', DICT[i][1].split(';')[0][:60] if i is not None else '', status, srcname, *classify(main, DICT[i][1] if i is not None else '', True, z, ' ' in main)])
add(P('data', 'words', 'src_cefrj_vocabulary_1.5.csv'), 'CEFR-J 1.5')
add(P('data', 'words', 'src_octanove_c1c2_1.0.csv'), 'Octanove C1/C2')
rows.sort(key=lambda r: (r[4], -(r[9] or 0), r[0].lower()))
HEAD = ['単語', '表記ゆれ', '品詞', 'CEFR', 'レベル(1-6)', '英検の目安', 'TOEIC(L&R)の目安', '学校の段階の目安', '頻度ランク', '頻度Zipf', 'いまの辞書の意味', '辞書との関係', '出典', '区分', '出題']
# --- 辞書全体：レベルがない語には、頻度から推定レベルを付ける ---
zs = collections.defaultdict(list)
for i, lv in best.items():
    z = zipf(count_of(i))
    if z: zs[lv].append(z)
med = {lv: sorted(v)[len(v) // 2] for lv, v in zs.items()}
cut = [(med[k] + med[k + 1]) / 2 for k in range(1, 6)]   # レベルの境目（中央値のまんなか）
def est(z):
    if z is None: return 6
    for k, c in enumerate(cut, 1):
        if z >= c: return k
    return 6
full = []
for i, (w, m, fo) in enumerate(DICT):
    isph = ' ' in w; c = 0 if isph else count_of(i); z = zipf(c) if c else None
    lv = best.get(i); how = ''
    if lv: how = 'CEFR-J'
    elif isph: lv, how = None, ''
    else: lv, how = est(z), '推定(頻度から)'
    full.append([w, m.split(';')[0][:60], ', '.join(fo[:6]), '熟語' if isph else '', LVN[lv] if lv else '', lv or '', how, EIKEN[LVN[lv]] if lv else '', TOEIC[LVN[lv]] if lv else '', SCHOOL[LVN[lv]] if lv else '', tier(z), z if z else '', c or '', *classify(w, m, bool(best.get(i)), z, isph)])
HEAD2 = ['単語', '意味(先頭)', '変化形', '熟語', 'CEFR', 'レベル(1-6)', 'レベルの出どころ', '英検の目安', 'TOEIC(L&R)の目安', '学校の段階の目安', '頻度ランク', '頻度Zipf', '出現数(原形+変化形)', '区分', '出題']
for r in full:   # 出題しない語(×)には、推定レベルを付けない
    if r[14] == '×':
        if r[6] == '推定(頻度から)': r[4] = r[5] = ''; r[6] = '推定しない(' + r[13] + ')'
        if r[14] == '×': r[7] = r[8] = r[9] = ''
full.sort(key=lambda r: (-(r[11] or 0) if r[11] != '' else 99, r[0].lower()))
with open(P('data', 'words', 'word_levels.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f); w.writerow(HEAD); w.writerows(rows)
with open(P('data', 'words', 'dict_all_words.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f); w.writerow(HEAD2); w.writerows(full)
import openpyxl
from openpyxl.styles import Font, PatternFill
wb = openpyxl.Workbook()
def sheet(ws, head, data, widths):
    ws.append(head); [ws.append(r) for r in data]
    for c in ws[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='5B4B8A')
    ws.freeze_panes = 'B2'; ws.auto_filter.ref = ws.dimensions
    for col, wd in zip('ABCDEFGHIJKLMNO', widths): ws.column_dimensions[col].width = wd
sheet(wb.active, HEAD, rows, [18, 22, 10, 7, 9, 11, 14, 16, 12, 9, 36, 28, 15, 22, 7]); wb.active.title = 'レベル表(CEFR-J)'
sheet(wb.create_sheet('辞書の全単語'), HEAD2, full, [20, 34, 26, 7, 7, 9, 14, 11, 14, 16, 12, 9, 12, 22, 7])
wb.save(P('data', 'words', 'word_levels.xlsx'))
print('levels', len(rows), 'dict', len(full), 'cuts', [round(c, 2) for c in cut], 'med', {LVN[k]: v for k, v in med.items()})
print(collections.Counter((r[13], r[14]) for r in rows).most_common(8), collections.Counter((r[13], r[14]) for r in full).most_common(12)); print(collections.Counter(r[6] for r in full)); print(collections.Counter((r[4], r[6]) for r in full if r[6]).most_common(14))
