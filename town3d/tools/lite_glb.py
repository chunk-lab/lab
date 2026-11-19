# 3Dモデル(GLB)を軽くする。元のファイルは書き換えず、別の場所に書き出す(組み立てのときに使う)
#   python3 tools/lite_glb.py 入力.glb 出力.glb [--quant] [--tex 1024] [--webp]
#   --quant : 形のデータ(向き・UV・骨の番号と重み)を、見た目が変わらない粗さの形式に詰める(位置はそのまま)
#   --tex N : 絵の長い辺を N 以下にする / --webp : 絵を WebP にする
import sys, json, struct, io, numpy as np
from PIL import Image
args = sys.argv[1:]; src, dst = args[0], args[1]
Q = '--quant' in args; TEX = int(args[args.index('--tex') + 1]) if '--tex' in args else 0; WEBP = '--webp' in args
d = open(src, 'rb').read(); jl = struct.unpack('<I', d[12:16])[0]; J = json.loads(d[20:20 + jl]); B = d[20 + jl + 8:]
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def read(i):
    a = J['accessors'][i]; v = J['bufferViews'][a['bufferView']]; t = CT[a['componentType']]; n = NC[a['type']]
    st = v.get('byteStride', 0); off = v.get('byteOffset', 0) + a.get('byteOffset', 0); isz = np.dtype(t).itemsize
    if st and st != n * isz:
        raw = np.frombuffer(B, np.uint8, a['count'] * st, off).reshape(a['count'], st)[:, :n * isz].copy()
        return raw.view(t).reshape(a['count'], n)
    return np.frombuffer(B, t, a['count'] * n, off).reshape(a['count'], n).copy()
views = []   # (bytes, target)
newacc = {}   # 置きかえる accessor 番号 → (配列, componentType, normalized)
img_new = {}
if Q:
    for m in J['meshes']:
        for p in m['primitives']:
            at = p['attributes']
            if 'NORMAL' in at and at['NORMAL'] not in newacc:
                n = read(at['NORMAL']).astype(np.float32); n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-8)
                q = np.round(n * 127).astype(np.int8); newacc[at['NORMAL']] = (np.concatenate([q, np.zeros((len(q), 1), np.int8)], 1), 5120, True, 'VEC3')
            if 'TEXCOORD_0' in at and at['TEXCOORD_0'] not in newacc:
                uv = read(at['TEXCOORD_0']).astype(np.float64)
                if uv.min() >= -1e-6 and uv.max() <= 1 + 1e-6: newacc[at['TEXCOORD_0']] = (np.round(np.clip(uv, 0, 1) * 65535).astype(np.uint16), 5123, True, 'VEC2')
            if 'JOINTS_0' in at and at['JOINTS_0'] not in newacc:
                j = read(at['JOINTS_0'])
                if j.max() < 256: newacc[at['JOINTS_0']] = (j.astype(np.uint8), 5121, False, 'VEC4')
            if 'WEIGHTS_0' in at and at['WEIGHTS_0'] not in newacc:
                w = read(at['WEIGHTS_0']).astype(np.float64); w /= np.maximum(w.sum(1, keepdims=True), 1e-8)
                q = np.floor(w * 255).astype(np.int32); r = 255 - q.sum(1)   # 合計がちょうど255になるよう、大きいほうに足す
                fr = w * 255 - q
                for k in range(4):
                    idx = np.argsort(-fr, axis=1)[:, k]; add = (r > 0).astype(np.int32); q[np.arange(len(q)), idx] += add; r -= add
                newacc[at['WEIGHTS_0']] = (q.astype(np.uint8), 5121, True, 'VEC4')
    if any(v[1] == 5120 for v in newacc.values()):
        J.setdefault('extensionsUsed', []); J.setdefault('extensionsRequired', [])
        for k in ('extensionsUsed', 'extensionsRequired'):
            if 'KHR_mesh_quantization' not in J[k]: J[k].append('KHR_mesh_quantization')
for i, im in enumerate(J.get('images', [])):
    if 'bufferView' not in im or not (TEX or WEBP): continue
    v = J['bufferViews'][im['bufferView']]; raw = B[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
    I = Image.open(io.BytesIO(raw)); I.load()
    if TEX and max(I.size) > TEX: s = TEX / max(I.size); I = I.resize((max(1, round(I.size[0] * s)), max(1, round(I.size[1] * s))), Image.LANCZOS)
    o = io.BytesIO()
    if WEBP: I.save(o, 'WEBP', quality=88, method=6); mt = 'image/webp'
    else:
        fmt = 'PNG' if im.get('mimeType') == 'image/png' else 'JPEG'
        (I.save(o, fmt, optimize=True) if fmt == 'PNG' else I.convert('RGB').save(o, fmt, quality=90, optimize=True)); mt = im.get('mimeType', 'image/jpeg')
    img_new[i] = (o.getvalue(), mt)
if WEBP and img_new:
    for t in J.get('textures', []):
        if 'source' in t and t['source'] in img_new: t.setdefault('extensions', {})['EXT_texture_webp'] = {'source': t.pop('source')}
    for k in ('extensionsUsed', 'extensionsRequired'):
        J.setdefault(k, [])
        if 'EXT_texture_webp' not in J[k]: J[k].append('EXT_texture_webp')
# 書き出し: 使っている bufferView を詰めなおす
out = bytearray(); vmap = {}
def addview(data, extra):
    while len(out) % 4: out.extend(b'\0')
    nv = dict(extra); nv['byteOffset'] = len(out); nv['byteLength'] = len(data); nv.pop('byteStride', None); out.extend(data); return nv
nviews = []
acc_view_override = {}
for i, a in enumerate(J['accessors']):
    if i in newacc:
        arr, ct, norm, typ = newacc[i]; tgt = {'target': 34962}
        if arr.dtype.itemsize * arr.shape[1] % 4: pass
        nv = addview(arr.tobytes(), tgt)
        if arr.shape[1] * arr.dtype.itemsize % 4 == 0 and arr.shape[1] * arr.dtype.itemsize != NC[typ] * arr.dtype.itemsize: nv['byteStride'] = arr.shape[1] * arr.dtype.itemsize
        nviews.append(nv); acc_view_override[i] = len(nviews) - 1
        a['componentType'] = ct; a['normalized'] = norm; a['byteOffset'] = 0; a['type'] = typ
        if not norm: a.pop('normalized')
        if typ == 'VEC3' and ct == 5120: a['min'] = [-1, -1, -1]; a['max'] = [1, 1, 1]; a.pop('min'); a.pop('max')
        else: a.pop('min', None); a.pop('max', None)
used_views = set()
for i, a in enumerate(J['accessors']):
    if i not in acc_view_override and 'bufferView' in a: used_views.add(a['bufferView'])
for i, im in enumerate(J.get('images', [])):
    if 'bufferView' in im and i not in img_new: used_views.add(im['bufferView'])
for vi in sorted(used_views):
    v = J['bufferViews'][vi]; s = v.get('byteOffset', 0); nv = addview(B[s:s + v['byteLength']], {k: x for k, x in v.items() if k not in ('byteOffset', 'byteLength', 'buffer')})
    if 'byteStride' in v: nv['byteStride'] = v['byteStride']
    nviews.append(nv); vmap[vi] = len(nviews) - 1
for i, a in enumerate(J['accessors']):
    if i in acc_view_override: a['bufferView'] = acc_view_override[i]
    elif 'bufferView' in a: a['bufferView'] = vmap[a['bufferView']]
for i, im in enumerate(J.get('images', [])):
    if i in img_new: nviews.append(addview(img_new[i][0], {})); im['bufferView'] = len(nviews) - 1; im['mimeType'] = img_new[i][1]
    elif 'bufferView' in im: im['bufferView'] = vmap[im['bufferView']]
for v in nviews: v['buffer'] = 0
J['bufferViews'] = nviews
while len(out) % 4: out.extend(b'\0')
J['buffers'] = [{'byteLength': len(out)}]
js = json.dumps(J, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out)
open(dst, 'wb').write(glb); print(src.split('/')[-1], f'{len(d)/1e6:.2f}', '→', f'{len(glb)/1e6:.2f}', 'MB')
