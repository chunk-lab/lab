#!/bin/sh
# 街（town）に各アプリを入れる。チャンクチャンク＝cc/、チャンクストリーム＝stream/（doctype付きの完全なページにする）
set -e
G=/home/claude/game; T=$G/town
rm -rf $T/cc $T/stream; mkdir -p $T/cc $T/stream
cp -r $G/app/reading/. $T/cc/
cp -r $G/app/img $G/app/audio $T/stream/
cp $G/app/data.js $G/app/pool.js $G/app/words.js $G/app/bank.js $T/stream/
cp -r $G/app/reading $T/stream/reading
python3 - <<'PY'
g=open('/home/claude/game/app/index.html',encoding='utf8').read()
open('/home/claude/game/town/stream/index.html','w',encoding='utf8').write('<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'+g+'\n</body></html>')
PY
grep -q '<!doctype' $T/cc/index.html || echo "cc/index.html に doctype がない"
du -sh $T
