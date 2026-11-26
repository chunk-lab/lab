# ちょこ浴衣の「根元の骨2つ(Armature・BoneRoot)」の初期の数値を、ダンスのファイル(choco_dance.glb)と同じにする(前もって1回だけ)。
#   python3 tools/fix_choco_yk.py
# 根元の親(node_0・RootNode・Armature)は、ダンスのファイルでは回転なし。ちょこ浴衣は node_0 などで90度回して、BoneRoot で打ち消していた。親を回転なしにして、BoneRoot をダンスと同じ値にする。
# 理由: ダンスの動きは、骨の向きを「絶対の値」で入れる。根元だけ初期の数値が90〜120度ちがうと、体が横倒しになる。
#       → 使う側で直すのではなく、モデルの初期の数値を動きのファイルにそろえる(見た目は変えない。世界での骨の位置・向きが同じか数値で確かめる)
import os, sys, json, struct, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, ROOT + '/tools'); import glbn
P, D = f'{ROOT}/assets/paid/choco_yk.glb', f'{ROOT}/tools/src/choco_dance.glb'
def rd(p):
    d = open(p, 'rb').read(); jl = struct.unpack('<I', d[12:16])[0]; J = json.loads(d[20:20 + jl]); o = 20 + jl; bl = struct.unpack('<I', d[o:o + 4])[0]; return J, bytearray(d[o + 8:o + 8 + bl])
def wr(p, J, B):
    while len(B) % 4: B.append(0)
    js = json.dumps(J, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    open(p, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(B)) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(B)) + b'BIN\0' + bytes(B))
before = glbn.parse(P); J, B = rd(P); JD, _ = rd(D)
dn = {n.get('name'): n for n in JD['nodes']}; dn.setdefault('RootNode', {}); dn.setdefault('node_0', {})   # ダンスには RootNode・node_0 がない=回転なし
for n in J['nodes']:
    if n.get('name') in ('node_0', 'RootNode', 'Armature', 'BoneRoot'):
        L = glbn.local(dn[n['name']]); R = L[:3, :3]; sc = np.linalg.norm(R, axis=0)
        n.pop('matrix', None); n['translation'] = [float(v) for v in L[:3, 3]]; n['rotation'] = [float(v) for v in glbn.m2q(R / sc)]; n['scale'] = [float(v) for v in sc]
import tempfile; T = tempfile.mktemp(suffix='.glb'); wr(T, J, B); after = glbn.parse(T)
def ang(x, y): return 2 * np.arccos(min(1, abs(float(np.dot(x, y))))) * 180 / np.pi
JN = [J['nodes'][j].get('name') for j in J['skins'][0]['joints']]   # 皮膚の骨だけで確かめる(絵のノードの置き場所は、皮膚には効かない)
worst_p = max(float(np.linalg.norm(before[n]['wp'] - after[n]['wp'])) for n in JN)
worst_r = max(ang(before[n]['wq'], after[n]['wq']) for n in JN)
print('骨', len(JN), '本: 世界での位置のずれ(最大)', worst_p, ' 向きのずれ(度,最大)', round(worst_r, 4))
assert worst_p < 1e-5 and worst_r < 0.01
wr(P, J, B); print('書きました')
