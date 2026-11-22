# オカリナのポーズ(もらった glb)を、骨ごとの数値の表にする。1回だけ実行
#   python3 tools/gen_oca.py もらった.glb src/world/oca_pose.json
# 全員の骨の初期の数値は self_mio と同じ(tools/unify_bones.py)なので、この数値をそのまま全員に入れれば同じ形になる(計算なし)
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from glbn import parse
P = parse(sys.argv[1])
out = {k.replace(':', ''): [round(float(x), 6) for x in P[k]['lq']] for k in P if k and k.startswith('mixamorig:')}
json.dump(out, open(sys.argv[2], 'w'), separators=(',', ':')); print(len(out), 'bones')
