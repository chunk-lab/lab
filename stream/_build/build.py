# 長文データ（passages.txt）＋ 英語脳アプリの辞書（big.js）→ app/data.js
import re, json, sys, random
B = '/home/claude/game/build/'
src = open(B + 'big.js', encoding='utf8').read()
D = {}  # section -> {word: (ja, sc, extra)}
for k, body in re.findall(r'\n  (\w+):`(.*?)`', src, re.S):
    d = {}
    for ln in body.split('\n'):
        f = ln.split('\t')
        if len(f) >= 3 and f[0] not in d:
            d[f[0]] = (f[1], int(f[2]), f[3:])
    D[k] = d
IRR = {}  # past/pp -> base
for w, (ja, sc, ex) in D['v'].items():
    for f in ex[2:4]:
        if f and f != w: IRR.setdefault(f, w)
IRR.update({'took': 'take', 'taken': 'take', 'found': 'find', 'felt': 'feel', 'went': 'go', 'gone': 'go', 'made': 'make', 'meant': 'mean',
            'told': 'tell', 'said': 'say', 'slept': 'sleep', 'saw': 'see', 'seen': 'see', 'shown': 'show', 'stolen': 'steal', 'came': 'come',
            'eaten': 'eat', 'grew': 'grow', 'learned': 'learn', 'became': 'become', 'thought': 'think', 'had': 'have', 'has': 'have'})

ART = {'a', 'an', 'the'}
FUNC = {
    'prep': 'in on at to for from with by of about into during through under behind near between without since until after before among within onto'.split(),
    'subj': 'I you he she we they it'.split(),
    'obj': 'me him her us them'.split(),
    'poss': 'my your his her our their its'.split(),
    'conj': 'and but or so because although when while if though unless'.split(),
    'wh': 'who which what where whose whom how why'.split(),
    'modal': 'can could will would may might should must'.split(),
    'be': 'is are was were be been being am'.split(),
    'have': 'have has had'.split(),
    'do': 'do does did'.split(),
    'quant': 'many much some any few little more less most every each all another other'.split(),
}
SAME = [{'that', 'which'}, {'that', 'who'}, {'while', 'when'}, {'though', 'although'}, {'many', 'some'}, {'much', 'more'}, {'can', 'could'}, {'will', 'would'}, {'may', 'might', 'could'}]
STOP = set(w.lower() for v in FUNC.values() for w in v) | ART | set('''that not no very also too just only even there then than this these those such so as up out
one two six ten eight twenty-four first second next last every now always also how why it's didn't don't can't go get make take
good bad big small large new old long hot cold day days year years time way people student students thing things man men woman
like know think say said see look want come came went give help use work find found tell told feel felt keep kept live lives
house town school class lunch shop food name month week weeks city country friend friends good best better life lives many
vending well kinds kind visit visits her leave leaves become teach eggs egg'''.split())
NAMES = {'Liam', 'Australia', 'Japan', 'Japanese', 'English', 'Russian', 'Plants'}

def lemmas(w):
    w = w.lower(); out = [w]
    if w in IRR: out.append(IRR[w])
    if w.endswith('ies'): out.append(w[:-3] + 'y')
    if w.endswith('es'): out.append(w[:-2])
    if w.endswith('s'): out.append(w[:-1])
    if w.endswith('ed'): out += [w[:-2], w[:-1], w[:-3] if len(w) > 4 and w[-3] == w[-4] else w[:-2]]
    if w.endswith('ied'): out.append(w[:-3] + 'y')
    if w.endswith('ing'): out += [w[:-3], w[:-3] + 'e', w[:-4] if len(w) > 5 and w[-4] == w[-5] else w[:-3]]
    return list(dict.fromkeys(out))

def form(w):
    w = w.lower()
    if w.endswith('ing'): return 'ing'
    if w.endswith('ed') or (w in IRR and IRR[w] != w): return 'ed'
    if w.endswith('ly'): return 'ly'
    if w.endswith('s') and not w.endswith('ss'): return 's'
    return 'base'

POSFIX={'together':'r','recently':'r','moreover':'r','therefore':'r','instead':'r','rather':'r','local':'a','likely':'a','interested':'a','worried':'a','learning':'n','feeling':'n','influence':'v','concern':'v','visit':'v','display':'v','nervous':'a','alternative':'n'}
def look(w, gl):
    r = _look(w, gl)
    if r and r[0] in POSFIX: r = (r[0], POSFIX[r[0]], r[2], r[3])
    return r
def _look(w, gl):
    """(lemma, pos, ja, sc) を返す。辞書（big.js）優先、@gloss で上書き"""
    f = form(w); best = None
    for lm in lemmas(w):
        for pos in ('n', 'v', 'a', 'r'):
            if lm in D[pos]:
                ja, sc, _ = D[pos][lm]
                pri = sc + (60 if (f in ('ing', 'ed') and pos == 'v') or (f == 'ly' and pos == 'r') else 0) + (25 if lm == w.lower() else 0)
                if f == 's' and pos in ('a', 'r'): pri -= 80
                if best is None or pri > best[0]: best = (pri, lm, pos, ja, sc)
    if best is None:
        for lm in lemmas(w):
            if lm in gl: return (lm, 'n', gl[lm], 30)
        return None
    _, lm, pos, ja, sc = best
    if lm in gl: ja = gl[lm]
    elif w.lower() in gl: lm, ja = w.lower(), gl[w.lower()]
    return (lm, pos, ja, sc)

TOK = re.compile(r'^([“"(\'"]*)(.*?)([.,;:!?”")]*)$')

def parse_chunk(line):
    en, ja = [s.strip() for s in line.split('::')]
    m = re.search(r'\{([^}]*)\}', en)
    opts = m.group(1).split('|')
    plain = en[:m.start()] + opts[0] + en[m.end():]
    gs, ge = m.start(), m.start() + len(opts[0])
    toks = []; pos = 0
    for part in plain.split(' '):
        st = pos; pos += len(part) + 1
        pre, w, post = TOK.match(part).groups()
        ws = st + len(pre)
        toks.append([pre, w, post, ws < ge and ws + len(w) > gs])
    idx = [i for i, t in enumerate(toks) if t[3]]
    return {'tk': [t[:3] for t in toks], 'ja': ja, 'g': [idx[0], idx[-1] + 1, opts]}

passages = []; cur = None
for raw in open(B + 'passages.txt', encoding='utf8'):
    line = raw.rstrip('\n')
    if not line.strip() or line.startswith('#'): continue
    if line.startswith('@'):
        k, v = (line[1:].split(' ', 1) + [''])[:2]
        if k == 'id': cur = {'id': v, 'chunks': [], 'gloss': {}, 'skip': set()}; passages.append(cur)
        elif k == 'gloss':
            for kv in v.split(','):
                a, b = kv.strip().split('='); cur['gloss'][a.strip()] = b.strip()
        elif k == 'skip': cur['skip'] = set(v.split(','))
        else: cur[k] = int(v) if k == 'lv' else v
        continue
    cur['chunks'].append(parse_chunk(line))

# --- 第3段階：品詞・形のクラス分け ---
def cls(w, prev):
    lw = w.lower()
    if lw in ('eggs','egg','well','right','left','light','dark','free','cream') : return None
    if lw in ART or w in NAMES or not re.fullmatch(r"[A-Za-z][A-Za-z'-]*", w): return None
    if lw == 'her': return None
    for k, v in FUNC.items():
        if lw in [x.lower() for x in v]: return 'f:' + k
    r = look(w, {})
    if not r: return None
    lm, pos, ja, sc = r
    if sum(lm in D[k] for k in ('n', 'v', 'a')) != 1 and pos != 'r': return None
    if pos == 'r' and not lw.endswith('ly'): return None
    return pos + ':' + form(w)

pools = {}
for p in passages:
    for c in p['chunks']:
        for i, (pre, w, post) in enumerate(c['tk']):
            k = cls(w, c['tk'][i - 1][1].lower() if i else '')
            if k and not k.startswith('f:'): pools.setdefault(k, set()).add(w.lower())
for k in FUNC: pools['f:' + k] = set(x.lower() if x != 'I' else x for x in FUNC[k])

def friends(a, b):
    return any(a in s and b in s for s in SAME)

out = []
for p in passages:
    gl = p['gloss']
    words = {}
    for c in p['chunks']:
        # 第3段階の候補
        s3 = []
        g0, g1, gopts = c['g']
        for i, (pre, w, post) in enumerate(c['tk']):
            if g1 - g0 == 1 and i == g0 and all(' ' not in o for o in gopts):
                s3.append([i, gopts[1:]]); continue
            k = cls(w, c['tk'][i - 1][1].lower() if i else '')
            if not k: continue
            lw = w.lower()
            pool = [x for x in pools.get(k, ()) if x != lw and not friends(x, lw) and x not in [t[1].lower() for t in c['tk']]]
            if k.startswith('f:') and k[2:] in ('prep',): pool = [x for x in pool if x in ('in', 'on', 'at', 'to', 'for', 'from', 'with', 'by', 'of', 'about', 'into', 'under', 'during')]
            if len(pool) < 3: continue
            s3.append([i, k])
        c['s3'] = s3
        # 第1段階：単語
        for i, (pre, w, post) in enumerate(c['tk']):
            lw = w.lower()
            if w in NAMES or lw in STOP or len(lw) < 4 or not re.fullmatch(r'[a-z-]+', lw): continue
            r = look(w, gl)
            if not r: continue
            lm, pos, ja, sc = r
            if lm in p['skip'] or lw in p['skip'] or lm in STOP: continue
            pri = (0 if lm in gl else 1, sc, -len(lm))
            if lm not in words or pri < words[lm]['pri']:
                words[lm] = {'w': lm, 'pos': pos, 'ja': ja, 'pri': pri}
    n = {1: 14, 2: 18, 3: 20}[p['lv']]
    wl = sorted(words.values(), key=lambda x: x['pri'])[:n]
    out.append({'id': p['id'], 'lv': p['lv'], 'title': p['title'], 'ja': p['ja'], 'tag': p['tag'],
                'chunks': [{'tk': c['tk'], 'ja': c['ja'], 'g': c['g'], 's3': c['s3']} for c in p['chunks']],
                'words': [[x['w'], x['pos'], x['ja']] for x in wl]})
    if '-v' in sys.argv:
        print('==', p['id'], len(p['chunks']), 'chunks', sum(len(c['tk']) for c in p['chunks']), 'words')
        print('  ', ' / '.join(f"{x['w']}({x['pos']}){x['ja']}{'' if x['pri'][0]==0 else '*'}" for x in wl))
# 選択肢のボタンに収まるように、チャンクの訳は12字まで（AI登録の長文もここで止める）
JA_MAX = 12
too = [(p['id'], ' '.join(t[0]+t[1]+t[2] for t in c['tk']), c['ja']) for p in out for c in p['chunks'] if len(c['ja']) > JA_MAX]
if too:
    print(f'訳が{JA_MAX}字を超えるチャンクがあります。チャンクを分けるか、訳を短くしてください：')
    for x in too: print('  ', *x)
    sys.exit(1)
POOL = {k: sorted(v) for k, v in pools.items()}
open('/home/claude/game/app/data.js', 'w', encoding='utf8').write(
    '// 自動生成（build/build.py）。単語の訳は英語脳アプリの辞書（EJDict／WordNet由来 big.js）＋文脈の上書き\n'
    'const PASSAGES=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
    'const POOL=' + json.dumps(POOL, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('ok', len(out))
