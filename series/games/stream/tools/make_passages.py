#!/usr/bin/env python3
"""新しい長文(passages_new/*.txt)から、ストミン用(passages.txt の自動生成部分)と読む画面用(reading_extra.json)を作る。
書式(1行1チャンク):  役割| 英語({正解|誤答|誤答|誤答}を1つ) :: 訳(12字まで)
  文の終わり:  == 全文訳
  問題:        ?? 文番号 チャンク番号 問題文   (答えはそのチャンク。番号は0から)
  見出し:      @id @lv(1-3) @level(読む画面 4/6/8) @title @ja @tag @gloss @skip
役割: S誰が V する O何を I誰に C どうだ P どこで T いつ M どうやって・つなぎ R なぜ F もし X 説明"""
import os, re, json, glob
H = os.path.dirname(os.path.abspath(__file__)) + '/'
BR = re.compile(r'\{([^}]*)\}')
out_p, out_r, errs = [], {}, []
for f in sorted(glob.glob(H + 'passages_new/*.txt')):
    cur = None
    for raw in open(f, encoding='utf8'):
        l = raw.rstrip('\n')
        if not l.strip() or l.startswith('#'): continue
        if l.startswith('@'):
            k, v = (l[1:].split(' ', 1) + [''])[:2]
            if k == 'id':
                cur = {'id': v, 'meta': [], 'chunks': [], 'sent': [], 'cur': [], 'q': []}; out_p.append(cur)
            if k != 'level': cur['meta'].append(l)
            else: cur['level'] = int(v)
            if k == 'title': cur['title'] = v
            continue
        if l.startswith('=='):
            cur['sent'].append([' | '.join(cur['cur']), l[2:].strip()]); cur['cur'] = []; continue
        if l.startswith('??'):
            a = l[2:].strip().split(' ', 2); cur['q'].append([int(a[0]), int(a[1]), a[2]]); continue
        role, rest = l.split('|', 1)
        en, ja = [x.strip() for x in rest.split('::')]
        m = BR.search(en)
        if len(BR.findall(en)) != 1: errs.append(f"{cur['id']}: {{}} が1つでない {en}")
        if not m or len(m.group(1).split('|')) != 4: errs.append(f"{cur['id']}: 選択肢が4つでない {en}")
        if len(ja) > 12: errs.append(f"{cur['id']}: 訳が12字超 {ja}")
        if role.strip() not in list('SVOICPTMRFX'): errs.append(f"{cur['id']}: 役割 {role}")
        cur['chunks'].append(f'{en} :: {ja}')
        plain = BR.sub(lambda m: m.group(1).split('|')[0], en)
        cur['cur'].append(f"{role.strip()}:{plain}={ja}")
    if cur and cur['cur']: errs.append(f"{cur['id']}: 最後の文に == がない")
for p in out_p:
    for s, c, q in p['q']:
        if s >= len(p['sent']) or c >= len(p['sent'][s][0].split(' | ')): errs.append(f"{p['id']}: 問題の番号 {s},{c}")
    out_r[p['id']] = dict(level=p['level'], title=p['title'], list=p['sent'], q=p['q'])
if errs: print('\n'.join(errs)); raise SystemExit(1)
# passages.txt の自動生成部分を差し替え
P = H + 'passages.txt'; t = open(P, encoding='utf8').read()
MK = '# ==== ここから下は make_passages.py が passages_new/ から作る(手で直さない) ===='
t = t.split(MK)[0].rstrip('\n') + '\n\n' + MK + '\n'
for p in out_p: t += '\n' + '\n'.join(p['meta']) + '\n' + '\n'.join(p['chunks']) + '\n'
open(P, 'w', encoding='utf8').write(t)
json.dump(out_r, open(H + 'reading_extra.json', 'w', encoding='utf8'), ensure_ascii=False, indent=0)
print('長文', len(out_p), {p['id']: (len(p['sent']), len(p['chunks']), len(p['q'])) for p in out_p})
