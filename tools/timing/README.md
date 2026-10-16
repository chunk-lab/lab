# 単語タイミングの自動検証

Kokoro が出す「単語の頭の時刻」が、実際の声の出だしと合っているかを、この環境（耳なし）で数字と波形の絵で確かめる道具。

## 結果（2026-10-16）
- 声：af_heart / am_michael、文章：6本×12チャンク＝144チャンク（int8モデル）
- モデルの単語の頭は、実際の声の出だしより **約40〜46ms遅い**（位置によらずほぼ一定）
- 破裂音ではじまる単語で測ると、補正前の中央値 −46ms → 補正後はほぼ0。補正後は半数が±11ms以内、4分の3が±26ms以内
- ゲームは `common.js` の `WSHIFT_DEFAULT`(46ms) を標準にし、準備のたびに端末で `autoShift()` が自動測定して補正を決める

## 再現手順（作業用フォルダで）
1. モデルと声を GitHub のリリースから取る（Hugging Face とPyPIはこの環境から届かない）
   - https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx
   - https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
2. `git clone --depth 1 https://github.com/hexgrad/misaki`（発音辞書 us_gold.json / us_silver.json）
3. `git clone --depth 1 https://github.com/thewh1teagle/kokoro-onnx ko`（config.json の語彙）
4. `pb.py` でモデルの出力に `/encoder/Clip_output_0`（発音ごとの長さ）を足して `kokoro_dur.onnx` を作る
   `python3 -c "import pb;m=open('kokoro-v1.0.int8.onnx','rb').read();open('kokoro_dur.onnx','wb').write(pb.add_outputs(m,['/encoder/Clip_output_0']))"`
5. `node texts.js` → `python3 synth.py af_heart am_michael`（約8分）→ `node wt.js`（ゲームの実コードで単語時刻を計算）
6. `python3 ana.py` / `ana2.py`（絵 wave1.png）/ `ana3.py` / `node meas.js`（ブラウザ側の測定コードの検算）/ `python3 after.py`

注意：この環境ではPyPIとnpmに `no_proxy` が効いて繋がらない。`export no_proxy= NO_PROXY=` でも 403。GitHub（git・リリース）だけ通る。
