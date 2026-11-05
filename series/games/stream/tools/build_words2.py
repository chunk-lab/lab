# 単語データを作る（品詞ごとに別カード）。
#  words.js … 無料で遊べる分（初級・中級・上級）＋熟語
#  bank.js  … 全単語（2万語以上）。解放して遊ぶ分。ステージ順（よく使う順）
# 材料：英語脳アプリの辞書 big.js（EJDict/WordNet）、チャンクチャンクの dict.js（よく使う2000語・手直し済み）と dictx.js（約1万語・頻度順）、
#       自分で直した drill_fix.tsv、ChatGPT の見直し chatgpt_review.csv、熟語 idioms.txt
import re, json, csv, zlib, collections as C
import os
HERE = os.path.dirname(os.path.abspath(__file__)) + '/'   # tools/
os.chdir(HERE)
APP = HERE + '../data/'
DICT = HERE + '../../../data/dict/'   # 辞書の元データ（共通の辞書と同じ材料）
MAXJA = 12          # ボタン2行に収まる長さ。意味はこの長さに収まるだけ並べる
POSMAP = {'n': 'n', 'p': 'n', 'an': 'n', 'v': 'v', 'a': 'a', 'r': 'r', 'adj': 'a', 'adv': 'r', 'prep': 'pp', 'conj': 'cj', 'pr': 'pn', 'int': 'ij', 'num': 'n', 'det': 'a'}
JTAG = {'名': 'n', '動': 'v', '形': 'a', '副': 'r', '前': 'pp', '接': 'cj', '代': 'pn', '間': 'ij', '形・副': 'a', '名・形': 'n', '前・副': 'pp', '名・動': 'n', '名・副': 'n'}
BAD_W = set('fuck fucking fucker shit shitty cunt dick pussy bitch whore slut cock nigger nigga fag faggot fagot rape rapist porn porno penis vagina boob boobs tit tits horny dildo masturbate orgasm sperm semen bastard asshole ass arse damn goddamn piss crap gay queer homo lesbian tranny retard'.split())
# 出題しない語：単語表(data/words/dict_all_words.csv)の「出題＝×」(話しことばの断片・短すぎる略語・人名)と、
# 人名にもなる語のうち、ほぼ人名として使われる語(NAMES。見て選んだ。rose・ivy・jasmine のような本物の語は残す)。表は tools/build_wordtable.py が作る
NAMES = set("""benjamin burton chad charlotte don donna henry jonah kris marc marguerite morris phoebe rhea john johnny jenny sonny victoria graham nelson tom""".split())
def _excl():
    out = set(NAMES); path = HERE + '../../../data/words/dict_all_words.csv'
    if not os.path.exists(path): return out
    for r in csv.DictReader(open(path, encoding='utf-8-sig')):
        if r['出題'] == '×': out.add(r['単語'].lower())
    return out
EXCL = _excl()
BAD_J = re.compile('性交|売春|性器|陰茎|陰部|膣|精液|ペニス|大便|小便|くそ|ちくしょう|同性愛|乳房|強姦|ポルノ|自慰|淫|売女|娼婦|白痴|気違い|きちがい|めくら|つんぼ|おし（|かたわ|びっこ|黒んぼ')
BAD_W |= EXCL

def clean(m):
    m = re.sub(r'[（(][^）)]*[）)]', '', m).strip(' 　・')
    if re.match(r'^(?:を|に|から)', m) and re.search(r'[うくぐすつぬぶむる]$', m): m = '〜' + m   # 「を着る」→「〜を着る」（動詞のときだけ）
    return m
def ok(m):
    return m and not re.search(r'[A-Za-z=()（）]', m) and not re.match(r'^[っゃゅょぁぃぅぇぉんーゎ]', m) and len(m) <= MAXJA and not BAD_J.search(m)
def join(ms):
    out = []
    for m in ms:
        m = clean(m)
        if not ok(m) or m in out: continue
        if len('、'.join(out + [m])) <= MAXJA: out.append(m)
    return '、'.join(out)

# ---- 辞書を読む ----
src = open(DICT + 'big.js', encoding='utf8').read()
secs = dict(re.findall(r'\n  (\w+):`(.*?)`', src, re.S))
BIG = {}; SCORE = {}; ORD = {}; PAST = set(); HEAD = set()
for k, v in secs.items():
    for i, l in enumerate(v.split('\n')):
        f = l.split('\t')
        if len(f) < 3 or not re.fullmatch(r"[a-z][a-z'-]*", f[0]): continue
        w, p = f[0], POSMAP[k]; HEAD.add(w)
        if (w, p) not in BIG: BIG[(w, p)] = f[1]
        SCORE[w] = max(SCORE.get(w, 0), int(f[2])); ORD.setdefault(w, (k, i))
        if k == 'v' and len(f) > 6: PAST |= {f[5], f[6]} - {w}
def dsrc(path):
    x = open(path, encoding='utf8').read()
    body = re.search(r'"(.*)"', x, re.S).group(1).encode().decode('unicode_escape').encode('latin1').decode('utf8')
    return body
DX = {}; RANK = {}
for n, l in enumerate(dsrc(DICT + 'chunkchunk_dictx.js').split('\n')):
    f = l.split('\t')
    if len(f) < 2 or not re.fullmatch(r"[a-z][a-z'-]*", f[0]) or '=' not in f[1]: continue
    RANK.setdefault(f[0], 2000 + n)
    for seg in f[1].split(';'):
        if '=' in seg:
            p, ms = seg.split('=', 1)
            if p in POSMAP: DX.setdefault((f[0], POSMAP[p]), ms.split(','))
D2 = {}
for n, l in enumerate(dsrc(DICT + 'chunkchunk_dict.js').split('\n')):
    f = l.split('\t')
    if len(f) < 2 or not re.fullmatch(r"[a-z][a-z'-]*", f[0]): continue
    RANK[f[0]] = min(RANK.get(f[0], 9e9), n)
    for seg in f[1].split(';'):
        if '=' in seg:
            p, ms = seg.split('=', 1)
            if p in POSMAP and p not in ('art', 'det', 'num'): D2.setdefault((f[0], POSMAP[p]), ms.split(','))
# ---- 1語は「いちばんよく使う品詞」の1枚だけにする(exact を動詞「強要する」で出さない) ----
# 手直し済みの辞書(D2)→頻度順の辞書(DX)の、先に書いてある品詞を、その語の主な品詞とする。
CONTENT = {'n', 'v', 'a', 'r'}
PRIM = {}
for src_ in (D2, DX):
    for (w_, p_) in src_:
        if p_ in CONTENT: PRIM.setdefault(w_, p_)
BSC = {}
for k_, v_ in secs.items():
    for l_ in v_.split('\n'):
        f_ = l_.split('\t')
        if len(f_) >= 3 and re.fullmatch(r"[a-z][a-z'-]*", f_[0]):
            pp_ = POSMAP[k_]
            if pp_ in CONTENT: BSC[(f_[0], pp_)] = max(BSC.get((f_[0], pp_), 0), int(f_[2]))
def prim_of(w, cands):
    """主な品詞を返す。cands = いまカードがある(または候補の)内容語の品詞"""
    if w in PRIM and (not cands or PRIM[w] in cands or True): return PRIM[w]
    cands = [c for c in cands if c in CONTENT]
    return max(cands, key=lambda c: (BSC.get((w, c), 0), 'nvar'.index(c) * -1)) if cands else None
rank = lambda w: RANK.get(w, 20000 + (100 - SCORE.get(w, 0)) * 1000 + zlib.crc32(w.encode()) % 997)

def inflected(w, p):
    if w in PAST: return True
    if p == 'a' and re.search(r'(ing|ed)$', w): return False      # boring・excited などの形容詞は残す
    for suf, rep in (('ies', 'y'), ('es', ''), ('s', ''), ('ied', 'y'), ('ed', ''), ('ed', 'e'), ('ing', ''), ('ing', 'e'), ('er', ''), ('est', ''), ('ier', 'y'), ('iest', 'y')):
        if w.endswith(suf):
            b = w[:-len(suf)] + rep
            if len(b) >= 3 and (b in HEAD or (len(b) > 3 and b[-1] == b[-2] and b[:-1] in HEAD)): return True
    return False

# ---- 無料分：今の単語（自分の直し）＋ChatGPTの見直し ----
FIX = {}
for l in open('drill_fix.tsv', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    f = l.rstrip('\n').split('\t'); FIX[f[0]] = None if f[1] == '-' else (f[1], f[2])
best = {}
for k, v in secs.items():
    for i, l in enumerate(v.split('\n')):
        f = l.split('\t')
        if len(f) < 3 or not re.fullmatch(r'[a-z]{2,}', f[0]): continue
        ja = re.split(r'[、,;；／/（(]', f[1])[0].strip()
        if not ja or len(ja) > 12: continue
        sc = int(f[2]); w = f[0]
        if w not in best or sc > best[w][0]: best[w] = (sc, i, POSMAP[k], ja)
OLDLV = lambda s: 1 if s >= 80 else 2 if s >= 34 else 3 if s >= 25 else None
GPT = {r['単語']: r for r in csv.DictReader(open('chatgpt_review.csv', encoding='utf-8-sig'))}
GLV = {'初級': 1, '中級': 2, '上級': 3, '上級・用途別': 0}
KEEP_MINE = set('sister cow bee recognize recognise harmonic slate capitalize crazy steward dwarf mode'.split())
REMOVE = {'gay'}
REVIVE = {('behind', 'pp'): ('〜の後ろに', 1), ('later', 'r'): ('後で', 1), ('worst', 'a'): ('最悪の', 1), ('following', 'a'): ('次の', 2)}

def jpos(j):
    j = j.rstrip('）)')
    if re.search(r'(ている|ていない|できる)$', j) or re.search(r'[一-龥]なる$', j): return 'a'
    if re.search(r'[うくぐすつぬぶむる]$', j): return 'v'
    if re.search(r'(い|な|の|的な)$', j): return 'a'
    if re.search(r'(に|で|く|と)$', j) and len(j) <= 4: return 'r'
    return 'n'

CARD = {}   # (w,pos) -> [meanings list, level]
def put(w, p, ms, lv):
    if w in REMOVE or w in BAD_W: return
    if (w, p) in CARD:
        CARD[(w, p)][0] += [m for m in ms if m not in CARD[(w, p)][0]]
        if lv and (not CARD[(w, p)][1] or lv < CARD[(w, p)][1]): CARD[(w, p)][1] = lv
    else: CARD[(w, p)] = [list(ms), lv]

for w, (sc, i, p, ja) in best.items():
    lv = OLDLV(sc)
    if lv is None: continue
    if w in FIX:
        if FIX[w] is None: continue
        p, ja = FIX[w]
    g = GPT.get(w)
    mine = ja.split('、')
    if g:
        glv = GLV.get(g['主訳の学習段階案'], lv)
        first = g['最初に見せる訳'].strip()
        if w in KEEP_MINE or not first or first == ja:
            put(w, p, mine, glv)
        elif jpos(first) == p or (p == 'n' and jpos(first) == 'n'):
            put(w, p, [first] + mine, glv)
        else:   # 品詞が違う → 自分の訳のカードと、ChatGPTの訳のカードを分ける
            put(w, p, mine, glv); put(w, jpos(first), [first], glv)
        for seg in re.split(r'[；;]', g['追加したい重要義（品詞付きは別用法）']):
            m = re.match(r'\s*([^：:]{1,3})[：:](.*)', seg)
            tag, body = (m.group(1), m.group(2)) if m else (None, seg)
            if tag and tag not in JTAG: continue
            ap = JTAG[tag] if tag else p
            ms = [x for x in re.split(r'[／/、]', body) if x.strip()]
            if not ms: continue
            if (w, ap) in CARD: put(w, ap, ms, None)
            else: put(w, ap, ms, (0 if glv == 0 else min(3, glv + 1)))
    else:
        r = RANK.get(w)
        lv2 = lv if r is None else (1 if r < 2500 else 2 if r < 6000 else 3)
        put(w, p, mine, lv2)
for (w, p), (ja, lv) in REVIVE.items(): put(w, p, [ja], lv)
# よく使う2000語（チャンクチャンクの辞書）で、まだない品詞のカードを足す
for (w, p), ms in D2.items():
    if (w, p) not in CARD and w not in BAD_W and not inflected(w, p) and len(w) > 1:
        put(w, p, ms, 1 if RANK[w] < 1200 else 2)

_cands = C.defaultdict(list)
for (w_, p_) in CARD:
    if p_ in CONTENT: _cands[w_].append(p_)
for (w_, p_) in list(CARD):
    if p_ in CONTENT and prim_of(w_, _cands[w_]) != p_: del CARD[(w_, p_)]
free = {}; usew = []
for (w, p), (ms, lv) in CARD.items():
    ja = join(ms)
    if not ja: continue
    if lv == 0: usew.append((w, p, ja)); continue
    free.setdefault(lv or 3, []).append((rank(w), w, p, ja))
WORDS = {l: [[w, p, ja] for _, w, p, ja in sorted(v)] for l, v in sorted(free.items())}
WSET = {1: 20, 2: 25, 3: 30}
ID = {1: [], 2: [], 3: []}
for l in open('idioms.txt', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    lv, en, ja = l.rstrip('\n').split('\t'); assert len(ja) <= 12, ja; ID[int(lv)].append([en, 'ph', ja])
with open(APP + 'words.js', 'w', encoding='utf8') as fp:
    fp.write('// 単語練習（無料分）。build/build_words2.py で生成。1カード＝1単語の1品詞\nconst WORDS=' + json.dumps(WORDS, ensure_ascii=False, separators=(',', ':')) +
             ';\nconst WSET=' + json.dumps(WSET) + ';\nconst IDIOMS=' + json.dumps(ID, ensure_ascii=False, separators=(',', ':')) + ';\n')

# ---- 訳の順：v12との照らし合わせ(data/words/sense_scores.tsv。tools/build_sense_scores.py が作る)で、主な意味を先に ----
SENSE = {}
_sp = HERE + '../../../data/words/sense_scores.tsv'
if os.path.exists(_sp):
    for l in open(_sp, encoding='utf8'):
        if l.startswith('#') or not l.strip(): continue
        w_, p_, m_, s_ = l.rstrip('\n').split('\t'); SENSE.setdefault((w_, p_), {})[m_] = float(s_)
# ---- 全単語バンク（解放して遊ぶ分） ----
have = set(CARD); FREEW = {w for (w, p) in CARD}
bank = []
MYJA = {}
_fl = {}
for _l in open(HERE + '../../../data/words/' + 'flag_translations.tsv', encoding='utf8'):
    _f = _l.rstrip('\n').split('\t')
    if _l[0] != '#' and len(_f) >= 6: _fl.setdefault(_f[2], []).append(_f[3])
for _l in open(HERE + '../../../data/words/' + 'my_ja.tsv', encoding='utf8'):
    _f = _l.rstrip('\n').split('\t')
    if _l[0] == '#' or len(_f) < 3: continue
    _o = _f[1] if _f[1] in _fl.get(_f[0], []) else (_fl.get(_f[0]) or [_f[1]])[0]
    MYJA[(_f[0], _o)] = (_f[1], _f[2])
for (w, p) in set(BIG) | set(DX):
    if (w, p) in have or w in BAD_W or len(w) < 2 or inflected(w, p): continue
    if w in FREEW and (w, p) not in DX and (w, p) not in D2: continue   # よく使う語の、辞書のおまけの品詞（say＝すれば など）は入れない
    if w in FIX and FIX[w] is None and (w in PAST or inflected(w, 'n')): continue
    if (w, p) in MYJA:   # 自分たちで書き直した訳(品詞が変わる語もある)
        p2, ja2 = MYJA[(w, p)]
        if p2 != p and ((w, p2) in BIG or (w, p2) in DX or (w, p2) in have): continue   # 同じ品詞の別カードがあるなら重複させない
        bank.append((rank(w), w, p2, join(ja2.split('、')) or ja2)); continue
    cands = DX.get((w, p), []) + [m for m in re.split(r'[、,]', BIG.get((w, p), '')) if m.strip()]
    if (w, p) in SENSE: cands = sorted(cands, key=lambda m: -SENSE[(w, p)].get(m.strip(), 0))   # v12で よく書かれている意味(主な意味)を先に
    _seen = set(); _c2 = []
    for m in cands:   # 「最高位の」と「最高位」のような、ほぼ同じ訳は1つに
        kk = re.sub(r'[〜～\s]|(的な|的に|的|する|した|して|な|の|に)$', '', m.strip())
        if kk and kk not in _seen: _seen.add(kk); _c2.append(m)
    ja = join(_c2)
    if not ja: continue
    bank.append((rank(w), w, p, ja))
for w, p, ja in usew: bank.append((rank(w), w, p, ja))
_bc = C.defaultdict(list)
for _r, w_, p_, _j in bank:
    if p_ in CONTENT: _bc[w_].append(p_)
bank = [x for x in bank if x[2] not in CONTENT or prim_of(x[1], _bc[x[1]]) == x[2]]
bank.sort()
seen = set(); b2 = []
for x in bank:            # 同じ語で訳が同じ品詞違い（eleven 形/名 など）は1枚に
    if (x[1], x[3]) in seen: continue
    seen.add((x[1], x[3])); b2.append(x)
bank = b2
with open(APP + 'bank.js', 'w', encoding='utf8') as fp:
    fp.write('// 全単語バンク（解放して遊ぶ分）。build/build_words2.py で生成。1行＝英語<TAB>品詞<TAB>訳。よく使う順。BANK_STAGE語で1ステージ\nconst BANK_STAGE=300;\nconst BANK_SRC=' +
             json.dumps('\n'.join(f'{w}\t{p}\t{ja}' for _, w, p, ja in bank), ensure_ascii=False) + ';\n')
print('free', {l: len(v) for l, v in WORDS.items()}, 'cards', sum(len(v) for v in WORDS.values()), 'usew', len(usew))
print('bank', len(bank), 'stages', -(-len(bank) // 300), 'pos', C.Counter(b[2] for b in bank))
print('sample free', WORDS[1][:12]); print('sample bank', [b[1:] for b in bank[:15]], [b[1:] for b in bank[5000:5010]], [b[1:] for b in bank[-8:]])

# ---- 単語ごとのレベル(CEFR 1=A1〜6=C2)：単語表 data/words/dict_all_words.csv から。レベル別の練習と、レベル診断の目安で使う ----
def _wlv():
    path = HERE + '../../../data/words/dict_all_words.csv'; out = {}
    if not os.path.exists(path): return out
    for r in csv.DictReader(open(path, encoding='utf-8-sig')):
        if r['レベル(1-6)'] and r['熟語'] == '' and re.fullmatch(r"[a-z][a-z'-]*", r['単語']): out[r['単語']] = r['レベル(1-6)']
    return out
WLV = _wlv()
with open(APP + 'wlv.js', 'w', encoding='utf8') as fp:
    fp.write('// 単語のレベル(CEFR 1=A1〜6=C2)。build/build_words2.py が 単語表(data/words)から作る。1語=「語:数字」を , でつなぐ\nconst WLV_SRC=' + json.dumps(','.join(f'{w}:{v}' for w, v in sorted(WLV.items())), ensure_ascii=False) + ';\n')
print('wlv', len(WLV))
