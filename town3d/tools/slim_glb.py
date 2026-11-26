# 3Dモデルを町用に軽くする: python3 tools/slim_glb.py assets/models/*.glb
# テクスチャを 1024px・JPEG(品質85)にする。スマホの画面ではこれで十分で、
# 読みこみ量とスマホのメモリ(1体 16MB → 4MB)が大きく減る。何度かけても同じ結果になる。
import sys, io, json, struct
from PIL import Image
MAX = 1024
for path in sys.argv[1:]:
    d = open(path, 'rb').read(); jl = struct.unpack('<I', d[12:16])[0]
    J = json.loads(d[20:20 + jl]); B = d[20 + jl + 8:]
    views = J['bufferViews']; repl = {}
    for im in J.get('images', []):
        v = views[im['bufferView']]; s = v.get('byteOffset', 0)
        img = Image.open(io.BytesIO(B[s:s + v['byteLength']])).convert('RGB')
        if max(img.size) > MAX: img = img.resize((MAX, MAX * img.size[1] // img.size[0]), Image.LANCZOS)
        o = io.BytesIO(); img.save(o, 'JPEG', quality=85); repl[im['bufferView']] = o.getvalue(); im['mimeType'] = 'image/jpeg'
    out = bytearray()
    for i in sorted(range(len(views)), key=lambda i: views[i].get('byteOffset', 0)):
        v = views[i]; s = v.get('byteOffset', 0); data = repl.get(i, B[s:s + v['byteLength']])
        while len(out) % 4: out.append(0)
        v['byteOffset'] = len(out); v['byteLength'] = len(data); out += data
    while len(out) % 4: out.append(0)
    J['buffers'][0]['byteLength'] = len(out)
    js = json.dumps(J, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    open(path, 'wb').write(struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out))
    print(path, len(d) // 1024, '→', (36 + len(js) + len(out)) // 1024, 'KB')
