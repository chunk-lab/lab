# 全員の骨の「初期の数値」を self_mio と完全に同じにする(前もって1回だけ。読みこみ時の計算はなし)
#   python3 tools/unify_bones.py            … assets/models/*.glb を書きかえる(元は git に残る)
# やること(見た目は1ミリも変えない):
#   1) 体が横を向いて出てくるモデル(潮見さん)は、モデルごと回して正面を +z にする(コードの rotY は 0 にする)
#   2) mixamo の骨は、体の根から見た向きを self_mio と同じにする → 親からの数値(初期の姿勢)が self_mio と同じ数値になる
#      骨の向きが変わったぶん、子の位置・皮膚の基準(IBM)・中に入っている動きの数値を、同じ見た目になるように書きなおす
#   3) 書いたあと、全部の骨の「皮膚を動かす行列」が前と同じか(初期の姿勢と、入っている動きの全コマ)を数値で確かめる
import os, sys, json, struct, numpy as np, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = 'self_mio.glb'
DIR = os.environ.get('DIR', 'assets/models')   # 対象のフォルダ(既定は assets/models。浴衣などは DIR=assets/paid)
FACE = {'shiomi.glb': np.pi / 2}   # 正面を +z に向ける回転(いまのコードの rotY と同じ値)
SKIP = {'chunkkun.glb', REF}
CT = {5126: np.float32}

def rd(p):
    d = open(p, 'rb').read(); jl = struct.unpack('<I', d[12:16])[0]; J = json.loads(d[20:20 + jl]); o = 20 + jl
    bl = struct.unpack('<I', d[o:o + 4])[0]; return J, bytearray(d[o + 8:o + 8 + bl])
def wr(p, J, B):
    while len(B) % 4: B.append(0)
    J['buffers'][0]['byteLength'] = len(B)
    js = json.dumps(J, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(B)) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(B)) + b'BIN\0' + bytes(B)
    open(p, 'wb').write(out)
NC = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def acc(J, B, i):
    a = J['accessors'][i]; v = J['bufferViews'][a['bufferView']]; assert a['componentType'] == 5126 and not v.get('byteStride') and 'sparse' not in a
    n = NC[a['type']]; off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    return np.frombuffer(bytes(B[off:off + a['count'] * n * 4]), np.float32).reshape(a['count'], n).astype(np.float64)
def newacc(J, B, arr, like):
    a = dict(J['accessors'][like]); off = len(B)
    while off % 4: B.append(0); off += 1
    B.extend(arr.astype(np.float32).tobytes())
    J['bufferViews'].append({'buffer': 0, 'byteOffset': off, 'byteLength': arr.size * 4})
    a['bufferView'] = len(J['bufferViews']) - 1; a.pop('byteOffset', None)
    if a['type'] != 'MAT4' and a['type'] != 'SCALAR': a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
    else: a.pop('min', None); a.pop('max', None)
    J['accessors'].append(a); return len(J['accessors']) - 1

def q2m(q):
    x, y, z, w = q; return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
def m2q(R):
    t = R[0, 0] + R[1, 1] + R[2, 2]
    if t > 0: s = np.sqrt(t + 1) * 2; q = [(R[2, 1] - R[1, 2]) / s, (R[0, 2] - R[2, 0]) / s, (R[1, 0] - R[0, 1]) / s, s / 4]
    elif R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]: s = np.sqrt(1 + R[0, 0] - R[1, 1] - R[2, 2]) * 2; q = [s / 4, (R[0, 1] + R[1, 0]) / s, (R[0, 2] + R[2, 0]) / s, (R[2, 1] - R[1, 2]) / s]
    elif R[1, 1] > R[2, 2]: s = np.sqrt(1 + R[1, 1] - R[0, 0] - R[2, 2]) * 2; q = [(R[0, 1] + R[1, 0]) / s, s / 4, (R[1, 2] + R[2, 1]) / s, (R[0, 2] - R[2, 0]) / s]
    else: s = np.sqrt(1 + R[2, 2] - R[0, 0] - R[1, 1]) * 2; q = [(R[0, 2] + R[2, 0]) / s, (R[1, 2] + R[2, 1]) / s, s / 4, (R[1, 0] - R[0, 1]) / s]
    q = np.array(q); q /= np.linalg.norm(q); return q if q[3] >= 0 else -q
def trs(n):
    if 'matrix' in n: return np.array(n['matrix'], float).reshape(4, 4).T
    M = np.eye(4); M[:3, :3] = q2m(n.get('rotation', [0, 0, 0, 1])) @ np.diag(n.get('scale', [1, 1, 1])); M[:3, 3] = n.get('translation', [0, 0, 0]); return M
def rot4(R): M = np.eye(4); M[:3, :3] = R; return M
def tree(J):
    par = {}
    for i, n in enumerate(J['nodes']):
        for c in n.get('children', []): par[c] = i
    return par
def worlds(J, L, par):
    W = {}
    def g(i):
        if i not in W: W[i] = (g(par[i]) @ L[i]) if i in par else L[i]
        return W[i]
    for i in range(len(J['nodes'])): g(i)
    return W
def rnorm(M): R = M[:3, :3]; return R / np.linalg.norm(R, axis=0)
def skinmats(J, L, par, IB):   # 皮膚を動かす行列(メッシュの場所から見た 骨の世界 × IBM)
    W = worlds(J, L, par); out = []
    for si, s in enumerate(J['skins']):
        mesh = [i for i, n in enumerate(J['nodes']) if n.get('skin') == si]; Mi = np.linalg.inv(W[mesh[0]]) if mesh else np.eye(4)
        out += [Mi @ W[j] @ IB[si][k] for k, j in enumerate(s['joints'])]
    return np.array(out)
def anim_locals(J, B, L0, an, t):   # 動き an の時刻 t のときの、全部のノードの親からの行列
    L = {i: m.copy() for i, m in L0.items()}; T = {}
    for c in an['channels']:
        s = an['samplers'][c['sampler']]; ti = acc(J, B, s['input'])[:, 0]; v = acc(J, B, s['output']); k = int(np.argmin(abs(ti - t)))
        T.setdefault(c['target']['node'], {})[c['target']['path']] = v[k]
    for i, d in T.items():
        if 'rotation' not in d and 'translation' not in d: continue
        M = L[i]; sc = np.linalg.norm(M[:3, :3], axis=0); R = rnorm(M); tr = M[:3, 3]
        if 'rotation' in d: R = q2m(d['rotation'] / np.linalg.norm(d['rotation']))
        if 'translation' in d: tr = d['translation']
        N = np.eye(4); N[:3, :3] = R @ np.diag(sc); N[:3, 3] = tr; L[i] = N
    return L

# 基準(self_mio): 骨の名前 → 体の根から見た向き
RJ, RB = rd(f'{ROOT}/assets/models/{REF}'); Rpar = tree(RJ); RL = {i: trs(n) for i, n in enumerate(RJ['nodes'])}; RW = worlds(RJ, RL, Rpar)
REFW = {n.get('name'): rnorm(RW[i]) for i, n in enumerate(RJ['nodes']) if (n.get('name') or '').startswith('mixamorig:')}
REFL = {n.get('name'): m2q(rnorm(RL[i])) for i, n in enumerate(RJ['nodes']) if (n.get('name') or '').startswith('mixamorig:')}
REFP = {RJ['nodes'][i].get('name'): RJ['nodes'][Rpar[i]].get('name') for i in Rpar}
_rh = [i for i, n in enumerate(RJ['nodes']) if n.get('name') == 'mixamorig:Hips'][0]
REF_HP = rnorm(RW[Rpar[_rh]])   # 腰の親(Armature)の向きも同じにする(腰の初期の数値をそろえるため)

files = [a for a in sys.argv[1:] if not a.startswith('--')] or sorted(os.path.basename(f) for f in glob.glob(f'{ROOT}/assets/models/*.glb'))
ok_all = True
for f in files:
    if f in SKIP: continue
    p = f'{ROOT}/{DIR}/{f}'; J, B = rd(p); par = tree(J); N = J['nodes']
    L0 = {i: trs(n) for i, n in enumerate(N)}
    IB0 = [acc(J, B, s['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1) for s in J['skins']]
    before = [skinmats(J, L0, par, IB0)] + [skinmats(J, anim_locals(J, B, L0, an, t), par, IB0) for an in J.get('animations', []) for t in (0.0, 0.37, 0.81)]
    # 1) 正面を +z に(いちばん上のノードに回転を足す)
    L1 = {i: m.copy() for i, m in L0.items()}
    ry = FACE.get(f, 0.0); Ry = rot4(np.array([[np.cos(ry), 0, np.sin(ry)], [0, 1, 0], [-np.sin(ry), 0, np.cos(ry)]]))
    roots = [i for i in range(len(N)) if i not in par]
    W1 = worlds(J, {i: (Ry @ L1[i] if i in roots else L1[i]) for i in L1}, par)
    # 2) 骨ごとの向きの差 C(骨から見た回転): 新しい世界の向き = 前の世界の向き × C
    C = {}
    for i, n in enumerate(N):
        nm = n.get('name') or ''
        C[i] = rnorm(W1[i]).T @ REFW[nm] if nm in REFW else np.eye(3)
    hi = [i for i, n in enumerate(N) if n.get('name') == 'mixamorig:Hips'][0]; hp = par[hi]
    C[hp] = rnorm(W1[hp]).T @ REF_HP
    Ci = {i: rot4(c) for i, c in C.items()}
    for i in range(len(N)):
        Lp = Ry @ L0[i] if i in roots else L0[i]
        Ln = (rot4(C[par[i]].T) @ Lp if i in par else Lp) @ Ci[i]
        sc = np.linalg.norm(Ln[:3, :3], axis=0); assert max(sc) - min(sc) < 1e-4 * max(sc), (f, N[i].get('name'), sc)
        if np.allclose(Ln, L0[i], atol=1e-9) and 'matrix' not in N[i]: continue
        R = Ln[:3, :3] / sc; n = N[i]; n.pop('matrix', None)
        n['translation'] = Ln[:3, 3].tolist(); n['rotation'] = m2q(R).tolist(); n['scale'] = sc.tolist()
        for k, d in (('translation', [0, 0, 0]), ('scale', [1, 1, 1])):
            if np.allclose(n[k], d, atol=1e-9): n.pop(k)
        if np.allclose(n['rotation'], [0, 0, 0, 1], atol=1e-12): n.pop('rotation')
    # IBM: 新しい IBM = C⁻¹ × 前の IBM
    for si, s in enumerate(J['skins']):
        I = IB0[si].copy()
        for k, j in enumerate(s['joints']): I[k] = rot4(C[j].T) @ I[k]
        s['inverseBindMatrices'] = newacc(J, B, I.transpose(0, 2, 1).reshape(-1, 16), s['inverseBindMatrices'])
    # 中に入っている動き: 回転 q' = C親⁻¹ q C / 位置 t' = C親⁻¹ t(いちばん上のノードは Ry をかける)
    for an in J.get('animations', []):
        for c in an['channels']:
            i = c['target']['node']; pth = c['target']['path']; s = an['samplers'][c['sampler']]
            if pth not in ('rotation', 'translation'): continue
            P = C[par[i]].T if i in par else Ry[:3, :3]
            v = acc(J, B, s['output'])
            if pth == 'rotation': v = np.array([m2q(P @ q2m(q / np.linalg.norm(q)) @ C[i]) for q in v])
            else: v = v @ P.T
            # 前後のコマで向きの符号をそろえる(補間が遠回りしない)
            if pth == 'rotation':
                for k in range(1, len(v)):
                    if np.dot(v[k], v[k - 1]) < 0: v[k] = -v[k]
            s['output'] = newacc(J, B, v, s['output'])
    # 使わなくなったデータを捨てて詰める
    used = set()
    for a in J['accessors']: used.add(a.get('bufferView'))
    for im in J.get('images', []): used.add(im.get('bufferView'))
    nb = bytearray(); remap = {}
    for vi, v in enumerate(J['bufferViews']):
        if vi not in used: continue
        while len(nb) % 4: nb.append(0)
        o = v.get('byteOffset', 0); seg = B[o:o + v['byteLength']]; nv = dict(v); nv['byteOffset'] = len(nb); nb.extend(seg); remap[vi] = nv
    order = sorted(remap); idx = {vi: k for k, vi in enumerate(order)}; J['bufferViews'] = [remap[vi] for vi in order]
    for a in J['accessors']:
        if 'bufferView' in a: a['bufferView'] = idx[a['bufferView']]
    for im in J.get('images', []):
        if 'bufferView' in im: im['bufferView'] = idx[im['bufferView']]
    B = nb
    # 3) 確かめ
    L2 = {i: trs(n) for i, n in enumerate(N)}
    IB2 = [acc(J, B, s['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1) for s in J['skins']]
    ry_m = rot4(Ry[:3, :3])   # 回したぶん、見た目の比較は前の結果にも同じ回転をかける(メッシュの場所から見るので本来は不変)
    after = [skinmats(J, L2, par, IB2)] + [skinmats(J, anim_locals(J, B, L2, an, t), par, IB2) for an in J.get('animations', []) for t in (0.0, 0.37, 0.81)]
    err = max(float(np.abs(a - b).max() / (np.abs(b).max() + 1e-9)) for a, b in zip(after, before))
    W2 = worlds(J, L2, par)
    same = [nm for i, n in enumerate(N) if (nm := n.get('name') or '') in REFL and i in par and REFP.get(nm) == N[par[i]].get('name')]
    lerr = max((2 * np.degrees(np.arccos(min(1, abs(float(np.dot(m2q(rnorm(L2[i])), REFL[N[i]['name']])))))) for i, n in enumerate(N) if n.get('name') in same), default=0)
    werr = max((2 * np.degrees(np.arccos(min(1, abs(float(np.dot(m2q(rnorm(W2[i])), m2q(REFW[n['name']]))))))) for i, n in enumerate(N) if n.get('name') in REFW), default=0)
    miss = [k[10:] for k in REFW if k not in [n.get('name') for n in N]]
    difp = [n['name'][10:] for i, n in enumerate(N) if n.get('name') in REFL and i in par and REFP.get(n['name']) != N[par[i]].get('name')]
    good = err < 1e-4 and lerr < 0.01 and werr < 0.01
    ok_all &= good
    print(f.ljust(16), 'OK' if good else 'NG', f'皮膚の行列のずれ {err:.1e}  初期の数値のずれ(度) {lerr:.4f}  向きのずれ(度) {werr:.4f}  骨 {len(same)}/{len(REFL)}', ('ない骨 ' + str(len(miss))) if miss else '', ('親がちがう ' + ','.join(difp)) if difp else '')
    if good and '--dry' not in sys.argv: wr(p, J, B)
print('ALL OK' if ok_all else 'NG あり(NG のファイルは書いていない)')
