# ゆず浴衣の「体」を、ほかの浴衣と同じ向き(正面 +z)に、まとめて回して付けなおす(前もって1回だけ)。
#   python3 tools/fix_yuzu_skeleton.py assets/paid/yuzu_yk.glb [回す角度(度) 既定90]
# 理由: unify_bones.py は骨の「向き(回転の数値)」だけ self_mio にそろえ、骨の「位置」は元のまま。
#       ゆずの元の体は、世界で横向きに立っていた。回転の数値は全員同じなので、同じ動きを入れると腕や脚が前に出る。
# やること: 腰を軸に、骨の位置・頂点・逆バインド行列を、Y軸まわりに回す。骨の回転の数値(unify済み)は触らない。
import sys, json, struct, numpy as np
def rd(p):
    d = open(p, 'rb').read(); jl = struct.unpack('<I', d[12:16])[0]; J = json.loads(d[20:20 + jl]); o = 20 + jl; bl = struct.unpack('<I', d[o:o + 4])[0]; return J, bytearray(d[o + 8:o + 8 + bl])
def wr(p, J, B):
    while len(B) % 4: B.append(0)
    js = json.dumps(J, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    open(p, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(B)) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(B)) + b'BIN\0' + bytes(B))
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def view(J, B, i):
    a = J['accessors'][i]; v = J['bufferViews'][a['bufferView']]; assert a['componentType'] == 5126 and 'sparse' not in a and not v.get('byteStride')
    return a, np.frombuffer(B, '<f4', a['count'] * NC[a['type']], v.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(a['count'], NC[a['type']])
def q2m(q):
    x, y, z, w = q; return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
def trs(n):
    if 'matrix' in n: return np.array(n['matrix'], float).reshape(4, 4).T
    M = np.eye(4); M[:3, :3] = q2m(n.get('rotation', [0, 0, 0, 1])) @ np.diag(n.get('scale', [1, 1, 1])); M[:3, 3] = n.get('translation', [0, 0, 0]); return M
P = sys.argv[1]; deg = float(sys.argv[2]) if len(sys.argv) > 2 else 90.0
J, B = rd(P); N = J['nodes']; par = {}
for i, n in enumerate(N):
    for c in n.get('children', []): par[c] = i
W = {}
def g(i):
    if i not in W: W[i] = (g(par[i]) @ trs(N[i])) if i in par else trs(N[i])
    return W[i]
for i in range(len(N)): g(i)
s = J['skins'][0]; ia, m = view(J, B, s['inverseBindMatrices']); IBM = m.astype(float).reshape(-1, 4, 4).transpose(0, 2, 1)
mesh = [i for i, n in enumerate(N) if n.get('skin') == 0][0]; Mw = W[mesh]; Mi = np.linalg.inv(Mw)
nm = {n.get('name'): i for i, n in enumerate(N)}; hips = nm['mixamorig:Hips']; h = W[hips][:3, 3].copy()
th = np.radians(deg); Ry = np.array([[np.cos(th), 0, np.sin(th)], [0, 1, 0], [-np.sin(th), 0, np.cos(th)]])
rot = lambda p: h + Ry @ (p - h)   # 腰の位置を軸に回す
# 確かめ(前): 皮膚をつけた姿勢と、骨の初期の位置が同じか
Wb = [Mw @ np.linalg.inv(IBM[k]) for k in range(len(s['joints']))]
print('前: 皮膚の姿勢と初期の位置のずれ(最大)', round(max(float(np.abs(Wb[k][:3, 3] - W[j][:3, 3]).max()) for k, j in enumerate(s['joints'])), 6))
# 1) 骨の位置(親からのずれ)を回す。回転の数値は触らない
for i, n in enumerate(N):
    if not (n.get('name') or '').startswith('mixamorig:') or i not in par or i == hips: continue
    p = par[i]; Rp = W[p][:3, :3]; dp = rot(W[i][:3, 3]) - rot(W[p][:3, 3]); n.pop('matrix', None) if 'matrix' in n else None
    n['translation'] = (np.linalg.inv(Rp) @ dp).tolist()
# 2) 頂点・法線を回す(メッシュの場所から見た値 → 世界で回す → もどす)
for me in J['meshes']:
    for pr in me['primitives']:
        for key, pos in (('POSITION', True), ('NORMAL', False)):
            ac, arr = view(J, B, pr['attributes'][key]); V = arr.astype(float)
            Vw = V @ Mw[:3, :3].T + (Mw[:3, 3] if pos else 0)
            Vw = (Vw - h) @ Ry.T + h if pos else Vw @ Ry.T
            out = (Vw - (Mw[:3, 3] if pos else 0)) @ Mi[:3, :3].T
            if not pos: out /= np.maximum(np.linalg.norm(out, axis=1, keepdims=True), 1e-9)
            arr[:] = out.astype('<f4')
            if pos: ac['min'] = [float(x) for x in out.min(0)]; ac['max'] = [float(x) for x in out.max(0)]
# 3) 逆バインド行列: 骨の向きはそのまま、位置だけ回す
new = []
for k, j in enumerate(s['joints']):
    Wn = Wb[k].copy(); Wn[:3, 3] = rot(Wb[k][:3, 3]); new.append(np.linalg.inv(Wn) @ Mw)
m[:] = np.array(new).transpose(0, 2, 1).reshape(-1, 16).astype('<f4')
wr(P, J, B); print('書きました: 腰を軸に', deg, '度')
