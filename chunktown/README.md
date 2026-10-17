# チャンクタウン（統合アプリ）

街（自宅・学校・図書館・ショップ・ゲームセンター）を入口にして、全部のアプリを1つにまとめたアプリ。
各アプリは自分のフォルダで別々に直せる。共通のしくみ（土台）は1か所にある。

## 直し方
1. 直したいアプリのフォルダを直す（下の表）
2. `python3 build.py` を実行 → `dist/` に一式ができる
3. `dist/` を公開する

| 直したいもの | 場所 |
|---|---|
| 街の絵・建物の位置・見た目 | `core/shell.html`（位置は `#bSchool` などの left/top/width）、画像は `core/img/` |
| 施設に何を入れるか | `core/town.js` の `PLACES` |
| 全アプリ共通のしくみ（セーブ・設定・読み上げ・アプリの開け閉め） | `core/core.js` |
| ぷにチャンク | `apps/cb/src/`（もとの手順どおり。単体なら `apps/cb/build.py`） |
| チャンク・カード | `apps/cb/cards/`（cards.js・vs.js・見た目は shell.html の `<style>`） |
| チャンクチャンク | `apps/chunkchunk/` |
| チャンクストリーム | `apps/stream/src/`（stream.html＝画面、stream.css＝見た目、stream.js＝動き）。長文・単語のデータは `apps/stream/tools/` の道具で作る（下の「チャンクストリームのデータ」） |
| アプリと土台のつなぎ | `apps/adapters/`（1アプリ1ファイル） |

## アプリのつなぎ方（組み込み口）
`apps/adapters/<アプリ>.js` で登録する。

```js
ChunkTown.register({
  id: 'punichunk', name: 'ぷにチャンク',
  scripts: ['apps/punichunk.js'],            // 最初に開くときに読むファイル
  mount(el, ctx) { /* el の中に表示 */ return { unmount() { /* 片付け */ } }; }
});
```
`ctx` で使えるもの：`storage`（そのアプリ専用のセーブ）・`settings`（共通の音量・読み上げ）・`speak`・`showBack(true/false)`（「街へ」ボタン）・`exit()`・`opts`（施設から渡す指定）

## 進み具合
- [x] ステップ1：土台・街・ぷにチャンク・チャンク・カード
- [x] ステップ2：チャンクストリームを組み込み口で動くように
- [ ] ステップ3：チャンクチャンクを組み込み口で動くように・アバターを共通のプロフィールへ（今は仮に枠の中で表示）
- [ ] ステップ4：英語脳アプリ（公開ページを分けて、直しやすい形にしてから組み込む）
- [ ] 共通のしくみの中身（プロフィール・コイン・ダイヤ・レベル・課題・ショップ・ランキング）… 中身は相談して決める

## チャンクストリームのデータ（apps/stream/tools/）
| 直したいもの | 直すファイル | 実行 |
|---|---|---|
| 長文（チャンク・訳・選択肢） | `passages.txt` | `python3 build.py`（→ data/data.js）、`python3 reading_texts.py`（→ 予習・振り返り用） |
| 単語ドリルの訳 | `drill_fix.tsv`（ChatGPTの見直しは `chatgpt_review.csv`） | `python3 build_words2.py`（→ data/words.js・data/bank.js） |
| 熟語 | `idioms.txt` | `python3 build_words2.py` |

- 単語バンク（data/bank.js・2万語以上）は、データだけ用意してある。解放のしくみ（共通のしくみ）が決まったら画面に出す。
- チャンクストリームは1ページ用に書かれていたので、`build.py` の `STREAM_FIX` で「開け閉めできる部品」に置きかえて包んでいる（セーブは土台の保存場所、閉じたらタイマー・音・イベントを全部止める）。stream.js を直して置きかえ先が見つからないときは、build.py がそう教えてくれる。
