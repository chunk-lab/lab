# ダンス(別の骨の形のglb)を、標準の骨(mixamorig)の数値の表にする。1回だけ実行
#   python3 tools/gen_dance.py tools/src/choco_dance.glb assets/models/self_mio.glb assets/paid/dance.json
# 両方とも初期はTポーズ・同じ向き。骨ごとに「初期からの世界での回転の差」を、標準の骨の初期にかけて、親の世界の回転で割って局所にする。
# 結果は表(時刻と4つの数値)。ゲームは、その数値をそのまま入れるだけ(計算なし)
import sys, os, json, struct, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from glbn import parse, load, q2m, m2q
dp, mp, outp = sys.argv[1:4]
J = load(dp); d = open(dp, 'rb').read(); jl = struct.unpack('<I', d[12:16])[0]; B = d[20 + jl + 8:]
def acc(i):
    a = J['accessors'][i]; v = J['bufferViews'][a['bufferView']]; n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
    o = v.get('byteOffset', 0) + a.get('byteOffset', 0); return np.frombuffer(B, '<f4', a['count'] * n, o).reshape(a['count'], n).astype(float)
N = J['nodes']; par = {}
for i, n in enumerate(N):
    for c in n.get('children', []): par[c] = i
name = {n['name']: i for i, n in enumerate(N)}
A = J['animations'][0]; rot = {}; raw = {}; T0 = None
for c in A['channels']:
    if c['target']['path'] != 'rotation': continue
    s = A['samplers'][c['sampler']]; t = acc(s['input'])[:, 0]; raw[c['target']['node']] = (t, acc(s['output']))
    if T0 is None or len(t) > len(T0): T0 = t
for n, (t, q) in raw.items():   # 2コマだけの骨(動かない骨)も、同じ時刻の並びにそろえる(線でつなぐ)
    if len(t) == len(T0): assert abs(t - T0).max() < 1e-6; rot[n] = q
    else: rot[n] = np.stack([np.interp(T0, t, q[:, i]) for i in range(4)], 1)
F = len(T0); print('frames', F, 'dur', T0[-1])
def qm(q): return q2m(np.array(q) / np.linalg.norm(q))
def chain(i):
    c = []
    while i is not None: c.append(i); i = par.get(i)
    return c[::-1]
def world(i, f):   # コマfでのiの世界の回転(f=None: 初期)
    R = np.eye(3)
    for k in chain(i): R = R @ qm(rot[k][f] if (f is not None and k in rot) else N[k].get('rotation', [0, 0, 0, 1]))
    return R
MAP = {'Hips': 'Hip', 'Spine': 'Waist', 'Spine1': 'Spine01', 'Spine2': 'Spine02', 'Neck': 'NeckTwist01', 'Head': 'Head'}
for L, S in (('Left', 'L_'), ('Right', 'R_')):
    for m, dn in (('Shoulder', 'Clavicle'), ('Arm', 'Upperarm'), ('ForeArm', 'Forearm'), ('Hand', 'Hand'), ('UpLeg', 'Thigh'), ('Leg', 'Calf'), ('Foot', 'Foot'), ('ToeBase', 'ToeBase')): MAP[L + m] = S + dn
    for m, dn in (('Thumb', 'Thumb'), ('Index', 'Index'), ('Middle', 'Mid'), ('Ring', 'Ring'), ('Pinky', 'Pinky')):
        for k in (1, 2, 3): MAP[f'{L}Hand{m}{k}'] = f'{S}{dn}{k}'
M = parse(mp); mpar = {k.replace('mixamorig:', ''): (v['parent'] or '').replace('mixamorig:', '') for k, v in M.items() if k and k.startswith('mixamorig:')}
Wm0 = {k: q2m(M['mixamorig:' + k]['wq']) for k in mpar}; Wm0['Armature'] = q2m(M['Armature']['wq'])
Wd0 = {k: world(name[v], None) for k, v in MAP.items()}
Wm = {k: np.zeros((F, 3, 3)) for k in MAP}
for f in range(F):
    for k, v in MAP.items(): Wm[k][f] = world(name[v], f) @ Wd0[k].T @ Wm0[k]
# 首: 頭の動き(NECK_K=1 で全部)を首の骨にも分ける。ちょこの首はひねり骨3本に分かれているが、標準の骨は首1本。首が動かないと、頭とのあいだで皮膚がねじれて顔がゆがむ
NECK_K = float(os.environ.get('NECK_K', '1.0'))
def slerpR(A, B, k): return q2m(m2q(A)) if k <= 0 else (lambda a, b: q2m(((np.sin((1 - k) * np.arccos(np.clip(abs(np.dot(a, b)), -1, 1))) * a + np.sin(k * np.arccos(np.clip(abs(np.dot(a, b)), -1, 1))) * np.sign(np.dot(a, b)) * b) / max(np.sin(np.arccos(np.clip(abs(np.dot(a, b)), -1, 1))), 1e-9)) if abs(np.dot(a, b)) < 0.99999 else a))(m2q(A), m2q(B))
for f in range(F): Wm['Neck'][f] = slerpR(Wm['Neck'][f], Wm['Head'][f], NECK_K)
out = {}
def worldM(k, f): return Wm[k][f] if k in MAP else Wm0[k]
for k in MAP:
    p = mpar[k]; q = []
    for f in range(F):
        Pw = worldM(p, f) if p in MAP else Wm0[p]; L = Pw.T @ Wm[k][f]; qq = m2q(L)
        if q and np.dot(qq, q[-1]) < 0: qq = -qq
        q.append(qq)
    out['mixamorig' + k] = np.array(q)
# 骨ごとにコマを間引く(線でつないだ値との差が0.2度以内の中間コマは捨てる)
TOL = 0.2
def simp(qs, lo, hi, K):
    if hi - lo < 2: return
    def e(c):
        w = (T0[c] - T0[lo]) / (T0[hi] - T0[lo]); p = qs[lo] * (1 - w) + qs[hi] * w; p /= np.linalg.norm(p)
        return 2 * np.degrees(np.arccos(min(1, abs(np.dot(p, qs[c])))))
    m = max(range(lo + 1, hi), key=e)
    if e(m) > TOL: K.add(m); simp(qs, lo, m, K); simp(qs, m, hi, K)
res = {'dur': round(float(T0[-1]), 4), 'rot': {}}; tot = 0
for b, qs in out.items():
    K = {0, F - 1}; simp(qs, 0, F - 1, K); ks = sorted(K); tot += len(ks)
    res['rot'][b] = {'t': [round(float(T0[i]), 4) for i in ks], 'v': [round(float(x), 5) for i in ks for x in qs[i]]}
json.dump(res, open(outp, 'w'), separators=(',', ':')); print('bones', len(out), 'keys', tot, 'of', F * len(out), 'bytes', os.path.getsize(outp))
