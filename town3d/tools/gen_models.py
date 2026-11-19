# 画質モード用のモデルを作る(元の assets/models は書き換えない)。モデルを差し替えたら、これを1回動かす
#   python3 tools/gen_models.py
#   assets_gen/hi/   : 形のデータだけ詰めたもの(見た目は元と同じ。パソコン・高画質モード)
#   assets_gen/lite/ : 形を詰めて、絵を1024・WebPにしたもの(スマホ・軽量モード)
#   assets_gen/src.json : 元ファイルの印。組み立てのとき、元と印がちがう(作り直し忘れ)なら、元のファイルをそのまま使う(壊れない)
import os, sys, json, hashlib, subprocess
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
src = os.path.join(root, 'assets/models'); out = os.path.join(root, 'assets_gen')
os.makedirs(out + '/hi', exist_ok=True); os.makedirs(out + '/lite', exist_ok=True)
man_p = out + '/src.json'; man = json.load(open(man_p)) if os.path.exists(man_p) else {}
for f in sorted(os.listdir(src)):
    if not f.endswith('.glb'): continue
    h = hashlib.sha1(open(os.path.join(src, f), 'rb').read()).hexdigest()[:12]
    if man.get(f) == h and os.path.exists(f'{out}/hi/{f}') and os.path.exists(f'{out}/lite/{f}'): continue
    for d, opt in (('hi', ['--quant']), ('lite', ['--quant', '--tex', '1024', '--webp'])):
        subprocess.run([sys.executable, os.path.join(here, 'lite_glb.py'), os.path.join(src, f), f'{out}/{d}/{f}', *opt], check=True)
    man[f] = h
for d in ('hi', 'lite'):
    for f in os.listdir(f'{out}/{d}'):
        if f not in man: os.remove(f'{out}/{d}/{f}')
man = {k: v for k, v in man.items() if os.path.exists(os.path.join(src, k))}
json.dump(man, open(man_p, 'w'), indent=0, sort_keys=True)
