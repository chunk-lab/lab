#!/usr/bin/env python3
"""TOEIC例文づくりの「使った語・まだの語」を数える。
  python3 tools/toeic_cover.py <ユーザーの語表.csv> [帯 例:500点] [分類 例:重要]
 語表(単語,分類,難易度目安)はリポジトリに入れない(ユーザーの手元の表)。例文は data/sentences/toeic_sentences.tsv。
 英文の中に語(変化形も)があれば「使った」とする。"""
import csv, re, sys, os, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SENT = os.path.join(ROOT, 'data', 'sentences', 'toeic_sentences.tsv')
def forms(w):
    w = w.lower(); f = {w, w + 's', w + 'es', w + 'ed', w + 'd', w + 'ing', w + 'er', w + 'ly'}
    if w.endswith('y'): f |= {w[:-1] + 'ies', w[:-1] + 'ied'}
    if w.endswith('e'): f |= {w[:-1] + 'ing'}
    if re.search(r'[^aeiou][aeiou][bdgklmnprt]$', w): f |= {w + w[-1] + 'ed', w + w[-1] + 'ing'}
    return f
def main():
    rows = [r for r in csv.DictReader(open(sys.argv[1], encoding='utf-8-sig'))]
    band = sys.argv[2] if len(sys.argv) > 2 else None; cls = sys.argv[3] if len(sys.argv) > 3 else None
    S = [l.rstrip('\n').split('\t') for l in open(SENT, encoding='utf8') if l.strip() and l[0] != '#'] if os.path.exists(SENT) else []
    text = ' '.join(s[2].replace('/', ' ') for s in S).lower()
    toks = set(re.findall(r"[a-z][a-z'-]*", text)); low = ' ' + re.sub(r'[^a-z\' -]', ' ', text) + ' '
    def used(w):
        w = w.lower()
        return (' ' + w + ' ') in low if ' ' in w else bool(forms(w) & toks)
    # 各文の帯の語を数える(同じ帯の語が何語入っているか)
    B = {r['単語'].strip().lower(): r['難易度目安'] for r in rows}
    dup = [k for k, v in collections.Counter(s[2].lower() for s in S).items() if v > 1]
    print('例文', len(S), '重複', len(dup))
    tab = collections.defaultdict(lambda: [0, 0])
    for r in rows: k = (r['難易度目安'], r['分類']); tab[k][0] += 1; tab[k][1] += used(r['単語'])
    for k in sorted(tab, key=lambda k: (int(re.sub(r'\D', '', k[0])), k[1])): print(k[0], k[1], f'{tab[k][1]}/{tab[k][0]}')
    if band:
        rest = [r['単語'] for r in rows if r['難易度目安'] == band and (not cls or r['分類'] == cls) and not used(r['単語'])]
        print('まだ', len(rest)); print(' '.join(rest))
if __name__ == '__main__': main()
