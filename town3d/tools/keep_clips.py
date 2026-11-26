# 3Dモデルの動き(アニメーション)を、必要な5つだけ残して軽くする: python3 tools/keep_clips.py assets/models/hana.glb ...
import sys, json, struct
KEEP = ['Breathing Idle', 'Standard Walk', 'Quick Formal Bow', 'Waving', 'Standard Run']
for path in sys.argv[1:]:
    d = open(path, 'rb').read(); jl = struct.unpack('<I', d[12:16])[0]
    J = json.loads(d[20:20 + jl]); B = d[20 + jl + 8:]
    J['animations'] = [a for a in J.get('animations', []) if a.get('name') in KEEP]
    accs = set()
    for m in J.get('meshes', []):
        for p in m['primitives']:
            accs.update(p['attributes'].values())
            if 'indices' in p: accs.add(p['indices'])
            for t in p.get('targets', []): accs.update(t.values())
    for s in J.get('skins', []):
        if 'inverseBindMatrices' in s: accs.add(s['inverseBindMatrices'])
    for a in J['animations']:
        for sm in a['samplers']: accs.add(sm['input']); accs.add(sm['output'])
    views = set(J['accessors'][i]['bufferView'] for i in accs if 'bufferView' in J['accessors'][i])
    for im in J.get('images', []):
        if 'bufferView' in im: views.add(im['bufferView'])
    # 使わない accessor は、そのまま(バッファが空なら参照されない)ではなく、消して番号を詰める
    amap = {}; newacc = []
    for i, a in enumerate(J['accessors']):
        if i in accs: amap[i] = len(newacc); newacc.append(a)
    vmap = {}; newviews = []; out = bytearray()
    for i, v in enumerate(J['bufferViews']):
        if i in views:
            vmap[i] = len(newviews); s = v.get('byteOffset', 0)
            while len(out) % 4: out += b'\0'
            nv = dict(v); nv['byteOffset'] = len(out); newviews.append(nv); out += B[s:s + v['byteLength']]
    for a in newacc:
        if 'bufferView' in a: a['bufferView'] = vmap[a['bufferView']]
    for im in J.get('images', []):
        if 'bufferView' in im: im['bufferView'] = vmap[im['bufferView']]
    for m in J.get('meshes', []):
        for p in m['primitives']:
            p['attributes'] = {k: amap[v] for k, v in p['attributes'].items()}
            if 'indices' in p: p['indices'] = amap[p['indices']]
            if 'targets' in p: p['targets'] = [{k: amap[v] for k, v in t.items()} for t in p['targets']]
    for s in J.get('skins', []):
        if 'inverseBindMatrices' in s: s['inverseBindMatrices'] = amap[s['inverseBindMatrices']]
    for a in J['animations']:
        for sm in a['samplers']: sm['input'] = amap[sm['input']]; sm['output'] = amap[sm['output']]
    J['accessors'] = newacc; J['bufferViews'] = newviews
    while len(out) % 4: out += b'\0'
    J['buffers'] = [{'byteLength': len(out)}]
    js = json.dumps(J, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out)
    open(path, 'wb').write(glb); print(path, len(d) // 1024, '→', len(glb) // 1024, 'KB', [a['name'] for a in J['animations']])
