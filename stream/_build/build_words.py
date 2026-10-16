# 単語練習モード用：英語脳アプリの辞書（big.js）から、よく使われる度でレベル分けした単語リストを作る
import re,json
src=open('big.js',encoding='utf8').read()
secs=dict(re.findall(r'\n  (\w+):`(.*?)`',src,re.S))
P={'n':'n','p':'n','an':'n','v':'v','a':'a','r':'r'}
best={}
for k,v in secs.items():
    for i,l in enumerate(v.split('\n')):
        f=l.split('\t')
        if len(f)<3 or not re.fullmatch(r'[a-z]{2,}',f[0]):continue
        ja=re.split(r'[、,;；／/（(]',f[1])[0].strip()
        if not ja or len(ja)>12:continue
        sc=int(f[2]);w=f[0]
        if w not in best or sc>best[w][0]:best[w]=(sc,i,P[k],ja)
# 単語ドリル用の直し（drill_fix.tsv）：訳を「最初に習うふつうの意味」に。「-」は外す（変化形・めったに使わない語）
FIX={}
for l in open('drill_fix.tsv',encoding='utf8'):
    if l.startswith('#') or not l.strip():continue
    f=l.rstrip('\n').split('\t');FIX[f[0]]=None if f[1]=='-' else (f[1],f[2])
for w in list(best):
    if w in FIX:
        if FIX[w] is None:del best[w]
        else:sc,i,p,j=best[w];best[w]=(sc,i,FIX[w][0],FIX[w][1])
bad=[(w,j) for w,(s,i,p,j) in best.items() if len(j)>12]
assert not bad,bad[:5]
LV={1:lambda s:s>=80,2:lambda s:34<=s<80,3:lambda s:25<=s<34}
out={l:[[w,p,j] for w,(s,i,p,j) in sorted(best.items(),key=lambda x:(-x[1][0],x[1][1])) if f(s)] for l,f in LV.items()}
SET={1:20,2:25,3:30}
open('/home/claude/game/app/words.js','w',encoding='utf8').write('// 単語練習モード用（build/build_words.py で生成）。英語脳アプリの辞書（EJDict／WordNet由来）の「よく使われる度」でレベル分け\nconst WORDS='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\nconst WSET='+json.dumps(SET)+';\n')
ID={1:[],2:[],3:[]}
for l in open('idioms.txt',encoding='utf8'):
    if l.startswith('#') or not l.strip():continue
    lv,en,ja=l.rstrip('\n').split('\t');assert len(ja)<=12,ja;ID[int(lv)].append([en,'ph',ja])
open('/home/claude/game/app/words.js','a',encoding='utf8').write('const IDIOMS='+json.dumps(ID,ensure_ascii=False,separators=(',',':'))+';\n')
print({l:len(v) for l,v in ID.items()})
print({l:(len(v),-(-len(v)//SET[l])) for l,v in out.items()}, out[1][:5], out[3][:3])
