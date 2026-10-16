import json,glob,numpy as np,sys
sr=24000
def load(name):
    a=np.load(f'out/{name}.npy');j=json.load(open(f'out/{name}.json'));w=json.load(open(f'out/{name}.wt.json'));return a,j,w
def trim_cut(a):
    th=.012;idx=np.where(np.abs(a)>=th)[0];s=idx[0] if len(idx) else 0;return max(0,s-round(sr*.008))/sr
def env(a,hop=0.005,win=0.02):
    n=int(win*sr);h=int(hop*sr);x=np.pad(a,(n//2,n//2));e=np.array([np.sqrt(np.mean(x[i:i+n]**2)) for i in range(0,len(a),h)]);return e,hop
rows=[];first=[]
for f in sorted(glob.glob('out/*.wt.json')):
    name=f.split('/')[-1].replace('.wt.json','')
    a,j,w=load(name)
    if not w['ok']:continue
    cut=trim_cut(a);e,hop=env(a);de=np.diff(np.log(e+1e-4),prepend=np.log(e[0]+1e-4))
    first.append((w['t'][0]['t']-cut))
    for k,t in enumerate(w['t']):
        # 声の出だしらしさ＝エネルギーの立ち上がり。モデルの時刻の前後150msで一番立ち上がるところ
        c=int(t['t']/hop);lo,hi=max(0,c-30),min(len(de),c+31)
        if hi<=lo:continue
        pk=lo+int(np.argmax(de[lo:hi]));rows.append((name,k,t['t']-cut,(pk*hop)-t['t']))
d=np.array([r[3] for r in rows])*1000
print('単語数',len(rows))
print('最初の単語：モデルの時刻 − 声の出だし(秒) 中央値 %.3f  範囲 %.3f〜%.3f'%(np.median(first),min(first),max(first)))
print('各単語：「声の立ち上がり」−「モデルの単語頭」(ms)  中央値 %.0f / 平均絶対 %.0f / 90%%点 %.0f'%(np.median(d),np.mean(np.abs(d)),np.percentile(np.abs(d),90)))
for v in ('af_heart','am_michael'):
    dd=np.array([r[3] for r in rows if r[0].startswith(v)])*1000;print(v,'中央値 %.0f 平均絶対 %.0f'%(np.median(dd),np.mean(np.abs(dd))))
