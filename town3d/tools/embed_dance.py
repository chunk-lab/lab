# ちょこ浴衣(別の骨の形)に、ダンスの動きをモデルの中へ入れる(前もって1回だけ)。ゲームは、モデルの中の 'dance' をそのまま使う
#   python3 tools/embed_dance.py
import os, sys, json, struct
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P, D = f'{ROOT}/assets/paid/choco_yk.glb', f'{ROOT}/tools/src/choco_dance.glb'
def rd(p):
    d = open(p, 'rb').read(); jl = struct.unpack('<I', d[12:16])[0]; J = json.loads(d[20:20 + jl]); o = 20 + jl; bl = struct.unpack('<I', d[o:o + 4])[0]; return J, bytearray(d[o + 8:o + 8 + bl])
def wr(p, J, B):
    while len(B) % 4: B.append(0)
    js = json.dumps(J, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    open(p, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(B)) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(B)) + b'BIN\0' + bytes(B))
J, B = rd(P); JD, BD = rd(D)
J['animations'] = [a for a in J.get('animations', []) if a.get('name') != 'dance']
nid = {n.get('name'): i for i, n in enumerate(J['nodes'])}; A = JD['animations'][0]; acc = {}
def cp(i):
    if i in acc: return acc[i]
    a = dict(JD['accessors'][i]); v = JD['bufferViews'][a['bufferView']]; s = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = a['count'] * {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']] * 4
    while len(B) % 4: B.append(0)
    J['bufferViews'].append({'buffer': 0, 'byteOffset': len(B), 'byteLength': n}); B.extend(BD[s:s + n])
    a['bufferView'] = len(J['bufferViews']) - 1; a.pop('byteOffset', None); J['accessors'].append(a); acc[i] = len(J['accessors']) - 1; return acc[i]
smp = []; ch = []
for c in A['channels']:
    nm = JD['nodes'][c['target']['node']].get('name')
    if c['target']['path'] == 'scale' or nm not in nid: continue   # 大きさは動かさない(初期のまま)
    s = A['samplers'][c['sampler']]; smp.append({'input': cp(s['input']), 'output': cp(s['output']), 'interpolation': s.get('interpolation', 'LINEAR')})
    ch.append({'sampler': len(smp) - 1, 'target': {'node': nid[nm], 'path': c['target']['path']}})
J['animations'].append({'name': 'dance', 'samplers': smp, 'channels': ch})
J['buffers'][0]['byteLength'] = len(B); wr(P, J, B); print('入れました: 動き', len(ch), '本')
