import json,glob,numpy as np
import matplotlib;matplotlib.use('Agg');import matplotlib.pyplot as plt
from scipy.signal import spectrogram
exec(open('ana.py').read().split("rows=[]")[0])
PLO=set('ptkbdɡʧʤ')
# 破裂音始まりの単語だけ：無音（閉鎖）→バースト。バースト＝「無音のあとで急にエネルギーが出る点」
R=[];allr=[]
for f in sorted(glob.glob('out/*.wt.json')):
    name=f.split('/')[-1].replace('.wt.json','');a,j,w=load(name)
    if not w['ok']:continue
    cut=trim_cut(a);e,hop=env(a,.002,.008);le=np.log(e+1e-4);de=np.diff(le,prepend=le[0])
    phs=j['ph'].split(' ')
    if len(phs)!=len(w['t']):continue
    for k,(t,ph) in enumerate(zip(w['t'],phs)):
        ph2=ph.lstrip('ˈˌ,.!?;:"\'')
        if not ph2 or ph2[0] not in PLO:continue
        c=int(t['t']/hop);lo,hi=max(0,c-100),min(len(de),c+101)   # ±200ms
        win=de[lo:hi]
        if win.max()<1.2:continue          # はっきりした立ち上がりがなければ除外
        pk=lo+int(np.argmax(win));R.append((name,k,(pk*hop-t['t'])*1000))
d=np.array([r[2] for r in R])
print('破裂音始まり',len(d),'単語  バースト−モデル頭(ms): 中央値 %.0f  25%%〜75%% %.0f〜%.0f  90%%点(絶対) %.0f'%(np.median(d),np.percentile(d,25),np.percentile(d,75),np.percentile(np.abs(d-np.median(d)),90)))
for v in ('af_heart','am_michael'):
    dd=np.array([r[2] for r in R if r[0].startswith(v)]);print(' ',v,len(dd),'中央値 %.0f'%np.median(dd))
# 絵
fig,axs=plt.subplots(4,1,figsize=(14,13))
for ax,name in zip(axs,['af_heart_beg1_0','af_heart_beg1_1','am_michael_int1_3','af_heart_adv2_5']):
    a,j,w=load(name);t=np.arange(len(a))/sr
    f,tt,Sx=spectrogram(a,sr,nperseg=512,noverlap=384);ax.pcolormesh(tt,f,10*np.log10(Sx+1e-12),shading='auto',cmap='magma',vmin=-110,vmax=-40);ax.set_ylim(0,8000)
    ax2=ax.twinx();ax2.plot(t,a,color='cyan',lw=.5,alpha=.8);ax2.set_ylim(-1,1)
    ws=j['text'].split();cut=0
    for k,x in enumerate(w['t']):
        ax.axvline(x['t'],color='lime',lw=1.6);ax.text(x['t']+.005,7500,ws[k],color='white',fontsize=12,va='top')
    ax.set_title(name+'   緑線＝モデルが出した単語の頭',fontsize=10)
plt.rcParams['font.family']='sans-serif';plt.tight_layout();plt.savefig('wave1.png',dpi=70)
