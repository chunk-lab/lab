import json,re,sys,numpy as np,onnxruntime as ort
G=json.load(open('misaki/misaki/data/us_gold.json'));S=json.load(open('misaki/misaki/data/us_silver.json'))
V=json.load(open('ko/src/kokoro_onnx/config.json'))['vocab']
def look(w):
    for D in (G,S):
        if w in D:
            v=D[w];return v if isinstance(v,str) else v.get('DEFAULT') or next(iter(v.values()))
    return None
VOICED=set('bdɡvðzʒʤmnŋlɹwjaeiouæɑɔəɛɪʊʌɜɚ')
def inflect(w):
    for suf,kind in (('ing','ing'),('ed','ed'),('es','s'),('s','s')):
        if w.endswith(suf) and len(w)>len(suf)+1:
            for base in (w[:-len(suf)],w[:-len(suf)]+'e',w[:-len(suf)-1] if len(w)>len(suf)+2 and w[-len(suf)-1]==w[-len(suf)-2] else None):
                if not base:continue
                b=look(base)
                if b:
                    last=b[-1]
                    if kind=='s':return b+('ɪz' if last in 'szʃʒʧʤ' else 'z' if last in VOICED else 's')
                    if kind=='ed':return b+('ɪd' if last in 'td' else 'd' if last in VOICED else 't')
                    return b+'ɪŋ'
    return None
HAND={'liam':'lˈiəm'}
def g2p_word(w):
    parts=[p for p in re.split(r"-",w) if p]
    out=[]
    for p in parts:
        b=re.sub(r"[^A-Za-z0-9']","",p).lower()
        ph=HAND.get(b) or look(b) or inflect(b)
        if ph is None:
            print('UNK',b,file=sys.stderr);ph=''
        out.append(ph)
    return ' '.join(out)
def phon(text):
    toks=[]
    for w in text.split():
        core=re.sub(r"[^A-Za-z0-9'\-]","",w);trail=''.join(ch for ch in w[w.rfind(core[-1])+1:] if ch in V) if core else ''
        lead=''.join(ch for ch in w[:w.find(core[0])] if ch in V) if core else ''
        toks.append(lead+g2p_word(core)+trail)
    return ' '.join(toks)
sess=ort.InferenceSession('kokoro_dur.onnx',providers=['CPUExecutionProvider'])
voices=np.load('voices-v1.0.bin',allow_pickle=True)
T=json.load(open('texts.json'))
for voice in sys.argv[1:]:
    for p in T:
        for i,text in enumerate(p['chunks']):
            ph=phon(text);ids=[0]+[V[ch] for ch in ph if ch in V]+[0]
            st=voices[voice][len(ids)-2]
            a,d=sess.run(None,{'tokens':np.array([ids],dtype=np.int64),'style':st.astype(np.float32),'speed':np.array([1],dtype=np.float32)})
            np.save(f"out/{voice}_{p['id']}_{i}.npy",a)
            json.dump(dict(text=text,ph=ph,ids=ids,dur=d[0].tolist(),sr=24000,spaceId=V[' ']),open(f"out/{voice}_{p['id']}_{i}.json",'w'))
    print(voice,'done')
