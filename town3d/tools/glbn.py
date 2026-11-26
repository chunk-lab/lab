import json,struct,numpy as np
def load(p):
    d=open(p,'rb').read(); l=struct.unpack('<I',d[12:16])[0]; return json.loads(d[20:20+l])
def q2m(q):
    x,y,z,w=q; return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def m2q(R):
    t=R[0,0]+R[1,1]+R[2,2]
    if t>0: s=np.sqrt(t+1)*2; q=[(R[2,1]-R[1,2])/s,(R[0,2]-R[2,0])/s,(R[1,0]-R[0,1])/s,s/4]
    elif R[0,0]>R[1,1] and R[0,0]>R[2,2]: s=np.sqrt(1+R[0,0]-R[1,1]-R[2,2])*2; q=[s/4,(R[0,1]+R[1,0])/s,(R[0,2]+R[2,0])/s,(R[2,1]-R[1,2])/s]
    elif R[1,1]>R[2,2]: s=np.sqrt(1+R[1,1]-R[0,0]-R[2,2])*2; q=[(R[0,1]+R[1,0])/s,s/4,(R[1,2]+R[2,1])/s,(R[0,2]-R[2,0])/s]
    else: s=np.sqrt(1+R[2,2]-R[0,0]-R[1,1])*2; q=[(R[0,2]+R[2,0])/s,(R[1,2]+R[2,1])/s,s/4,(R[1,0]-R[0,1])/s]
    q=np.array(q); return q/np.linalg.norm(q)
def local(n):
    if 'matrix' in n: return np.array(n['matrix'],float).reshape(4,4).T
    M=np.eye(4); q=n.get('rotation',[0,0,0,1]); s=n.get('scale',[1,1,1]); M[:3,:3]=q2m(q)@np.diag(s); M[:3,3]=n.get('translation',[0,0,0]); return M
def parse(p):
    j=load(p); N=j['nodes']; par={}
    for i,n in enumerate(N):
        for c in n.get('children',[]): par[c]=i
    Wm={}
    def get(i):
        if i in Wm: return Wm[i]
        L=local(N[i]); Wm[i]=(get(par[i])@L) if i in par else L; return Wm[i]
    out={}
    for i,n in enumerate(N):
        W=get(i); R=W[:3,:3]; sc=np.linalg.norm(R,axis=0); Rn=R/sc
        L=local(n); Rl=L[:3,:3]/np.linalg.norm(L[:3,:3],axis=0)
        out[n.get('name')]=dict(wq=m2q(Rn),wp=W[:3,3],lq=m2q(Rl),lp=L[:3,3],sc=sc,parent=N[par[i]].get('name') if i in par else None)
    return out
if __name__=='__main__':
    import sys
    for p in sys.argv[1:]:
        o=parse(p); h=o.get('mixamorigHips'); print(p.split('/')[-1],len(o),'nodes'); print(' hips',h and (h['wp'].round(3),h['wq'].round(3),h['lp'].round(3),h['sc'].round(3),h['parent']))
