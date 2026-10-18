# 2人で作るときの手引き

## 1. はじめる（毎回）
```
git clone https://github.com/chunk-lab/lab.git      # 初回だけ
cd lab && git pull                                   # 作業を始める前に、必ず最新を取り込む
cd series
npm install                                          # 初回だけ（esbuild が入る）
node build.mjs town                                  # 街アプリを組み立てる → dist/town/
```
- 必要なもの：Node.js 18以上、Python 3（辞書づくりの `tools/build_dict.py` が使う）。
- 動作確認：`python3 -m http.server 8770 --directory dist` を立てて `http://localhost:8770/town/index.html` を開く。
- `dist/` と `node_modules/` はコミットしない（`.gitignore` 済み）。

## 2. 作業のルール（同時には作業しない前提）
1. 始める前に `git pull`。終わったら **必ず** `git add -A && git commit && git push`。
2. 相手が作業中のときは触らない。引き継ぐときは「push したよ」と伝える。
3. 大きな変更の前に、相手と相談する（特に仕様・画面・データの形）。
4. 1回の変更は、1つの目的にまとめてコミットする。メッセージは日本語でよい。

## 3. 勝手に決めないこと（相談して決める）
- **コインの枚数・ダイヤや課金の値段・単語の解放のタイミング**（経済の数字は、2人で決めてから入れる）。
- ゲームの仕様の変更（遊び方・判定・画面の作り替え）。決まってから作る。
- アバターは仮のまま（最終版は作り直す予定）。

## 4. 公開（Claudeのアーティファクト）
- アーティファクトのURLは作った人のもの。各自が自分のアカウントで公開する。
- 公開用ファイルは `dist/<アプリ>/artifact.html`（同じフォルダの `app.js` `app.css` `g/` `img/` なども一緒に出す）。
- 売り出すアプリは Web / iOS / Android（Capacitor）。スマホで遊ぶ前提で作る。

## 5. 作りの要点（詳しくは README.md）
- 共通部品は `core/`、各ゲームは `games/<名前>/`。ゲームはセーブ・音・読み上げ・権利を自分で持たず、`ctx` 経由で使う。
- 画面の部品や CSS は、ほかのゲームに影響しないよう、ゲームごとの名前（`.ct-cc` など）で囲んである。
- 音：BGM・効果音・声は共通の音量（`core.sound`）に流す。音が大きい／小さいときは、チャンクチャンクなら `games/chunkchunk/src/sfx.js` の `FILE_GAIN` と `bgm.js` の `BGM_TARGET` を直す。
