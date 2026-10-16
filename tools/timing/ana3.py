import json,glob,numpy as np
exec(open('ana2.py').read().split("d=np.array([r[2]")[0].replace("R=[];allr=[]","R=[];allr=[]"))
# 位置情報つきでもう一度集める
Rt=[]
for f in sorted(glob.glob('out/*.wt.json')):
    name=f.split('/')[-1].replace('.wt.json','');a,j,w=load(name)
    if not w['ok']:continue
    cut=trim_cut(a);e,hop=env(a,.002,.008);le=np.log(e+1e-4);de=np.diff(le,prepend=le[0]);phs=j['ph'].split(' ')
    if len(phs)!=len(w['t']):continue
    for k,(t,ph) in enumerate(zip(w['t'],phs)):
        ph2=ph.lstrip('ˈˌ,.!?;:"\'')
        if not ph2 or ph2[0] not in PLO:continue
        c=int(t['t']/hop);lo,hi=max(0,c-100),min(len(de),c+101);win=de[lo:hi]
        if win.max()<1.2:continue
        pk=lo+int(np.argmax(win));Rt.append((t['t'],k,(pk*hop-t['t'])*1000,len(phs)))
Rt=np.array(Rt);d=Rt[:,2]
sl,ic=np.polyfit(Rt[:,0],d,1);print('位置(秒)との関係：傾き %.1f ms/秒  切片 %.0f ms'%(sl,ic))
for lo,hi in ((0,.5),(.5,1),(1,1.5),(1.5,3)):
    m=(Rt[:,0]>=lo)&(Rt[:,0]<hi);print(f'  {lo}〜{hi}秒 n={m.sum()} 中央値 {np.median(d[m]):.0f}')
for k0,k1 in ((0,1),(1,2),(2,9)):
    m=(Rt[:,1]>=k0)&(Rt[:,1]<k1);print(f'  {k0+1}語目〜 n={m.sum()} 中央値 {np.median(d[m]):.0f}')
for sh in (0,-46):
    r=d+sh*-1*0  # placeholder
res=d-np.median(d)
print('一定(−%.0fms)で補正した後の残りのずれ：平均絶対 %.0f ms / 75%%点 %.0f ms / 90%%点 %.0f ms'%(-np.median(d),np.mean(np.abs(res)),np.percentile(np.abs(res),75),np.percentile(np.abs(res),90)))
print('補正しない場合の平均絶対ずれ %.0f ms'%np.mean(np.abs(d)))
