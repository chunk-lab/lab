# オカリナのポーズ(もらった glb)を、他のポーズと同じ道(retarget.js)に流すための決まったデータにする。1回だけ実行
# 元の体 = self_mio(皮膚を付けた時の姿勢)。rest=元の体の骨の向き(体の根から), top=腰の親の向き, tracks=ポーズの骨の向き(親から)
import sys, json, numpy as np
sys.path.insert(0, __import__('os').path.dirname(__file__)); from glbn import parse
A = parse(sys.argv[1]); P = parse(sys.argv[2])
nm = lambda s: s.replace(':', '')
bones = [k for k in A if k and k.startswith('mixamorig')]
r = lambda q: [round(float(x), 6) for x in q]
rest = {nm(k): r(A[k]['wq']) for k in bones}
top = {nm(k): r(A[A[k]['parent']]['wq']) for k in bones if not (A[k]['parent'] or '').startswith('mixamorig')}
tracks = {}
for k in bones:
    if abs(np.dot(A[k]['lq'], P[k]['lq'])) < 0.99999: tracks[nm(k)] = r(P[k]['lq'])
json.dump({'rest': rest, 'top': top, 'tracks': tracks}, open(sys.argv[3], 'w'), separators=(',', ':'))
print('changed', list(tracks))
