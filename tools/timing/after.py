import json,glob,numpy as np
exec(open('ana2.py').read().split("d=np.array([r[2]")[0])
SH=-41.0  # ブラウザ側が自動で決める補正（ms）
def run(shift):
    rows=[]
    for f in sorted(glob.glob('out/*.wt.json')):
        name=f.split('/')[-1].replace('.wt.json','');a,j,w=load(name)
        if not w['ok']:continue
        cut=trim_cut(a);e,hop=env(a,.002,.008);le=np.log(e+1e-4);de=np.diff(le,prepend=le[0])
        for k,t in enumerate(w['t']):
            c=int(max(0,t['t']+shift/1000)/hop);lo,hi=max(0,c-100),min(len(de),c+101)
            if hi<=lo:continue
            win=de[lo:hi]
            if win.max()<1.2:continue
            rows.append((name,(lo+int(np.argmax(win)))*hop-(t['t']+shift/1000)))
    return rows
# 「全単語」を対象に、補正前後の「声の出だし」と「単語の頭」のずれ（立ち上がりがはっきりした単語のみ）
for sh,lab in ((0,'補正なし'),(SH,'補正あり(自動測定の値)')):
    d=np.array([r[1] for r in run(sh)])*1000
    print(f'{lab:22s} n={len(d)}  中央値 {np.median(d):+.0f}ms  平均絶対 {np.mean(np.abs(d)):.0f}ms  75%点 {np.percentile(np.abs(d),75):.0f}ms  50ms以内 {np.mean(np.abs(d)<=50)*100:.0f}%')
