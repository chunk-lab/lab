# 最小のprotobuf読み書き：ONNXのグラフ出力に、中間のテンソルを足すだけ
def rv(b,i):
    r=0;s=0
    while True:
        x=b[i];i+=1;r|=(x&127)<<s;s+=7
        if x<128:return r,i
def wv(n):
    o=bytearray()
    while True:
        x=n&127;n>>=7
        if n:o.append(x|128)
        else:o.append(x);return bytes(o)
def fields(b):
    i=0;out=[]
    while i<len(b):
        k,i=rv(b,i);f,t=k>>3,k&7
        if t==0:v,i=rv(b,i)
        elif t==2:
            l,i=rv(b,i);v=b[i:i+l];i+=l
        elif t==1:v=b[i:i+8];i+=8
        elif t==5:v=b[i:i+4];i+=4
        else:raise ValueError(t)
        out.append((f,t,v))
    return out
def enc(fs):
    o=bytearray()
    for f,t,v in fs:
        o+=wv(f<<3|t)
        if t==0:o+=wv(v)
        elif t==2:o+=wv(len(v))+v
        else:o+=v
    return bytes(o)
def nodes(model_bytes):
    top=fields(model_bytes);g=[v for f,t,v in top if f==7][0]
    res=[]
    for f,t,v in fields(g):
        if f==1:
            nf=fields(v);res.append(dict(op=[x for a,b,x in nf if a==4][0].decode(),ins=[x.decode() for a,b,x in nf if a==1],outs=[x.decode() for a,b,x in nf if a==2],name=[x for a,b,x in nf if a==3][0].decode() if any(a==3 for a,b,x in nf) else ''))
    return res
def add_outputs(model_bytes,names):
    top=fields(model_bytes);new=[]
    for f,t,v in top:
        if f==7:
            v=v+b''.join(enc([(12,2,enc([(1,2,n.encode())]))]) for n in names)
        new.append((f,t,v))
    return enc(new)
