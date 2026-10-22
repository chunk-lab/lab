# ほしみや町(試作 v0.1)

パステル調の3D の町を歩き、住人と話し、建物に入って単発アプリを遊ぶ。ブラウザだけで動く(PC・スマホ)。
費用は 0 円構成:静的ファイルを置くだけ(GitHub Pages / Cloudflare Pages など)。同時接続だけ小さなサーバーが要る。

## 動かす
    npm i && node build.mjs      # dist/ ができる(dist/index.html を開くだけで遊べる)
    node server/relay.js 8787    # 他のプレイヤーを見せたいときだけ。index.html?server=ws://ホスト:8787
    node tests/shots.mjs && node tests/flows.mjs   # 画面撮影と通しテスト

## 構成(触る場所)
| 変えたいこと | ここ |
|---|---|
| 建物・広場・公園・神社の配置 | src/world/town_data.js |
| 住人・台詞・1日の予定・会話の選択肢 | src/game/npc.js |
| 建物や住人に結びつくアプリ | src/apps/registry.js |
| 色・時間帯の空 | src/world/kit.js / env.js |
| キャラの見た目(look の値だけで決まる) | src/world/character.js |
| 通信(ローカル住人 ⇔ 本物のサーバー) | src/core/net.js |

## 単発アプリを足す(Town App 契約 v1)
registry.js に1件足し、town_data.js の建物 `app:` か NPC の `menu` に id を書く。3 種類から選べる。
- **script**:`dist/apps/<id>/xxx.js` を読み込み `window[global].mount(el, options)` を呼ぶ(ぷにチャンク型。unmount 必須)
- **iframe**:HTML をそのまま入れる。`sdk/town-sdk.js` を読むと、コイン・保存・名前・終了がつながる(読まなくても単体で動く)
- **module**:町と一緒にビルドする JS(`mount(el, ctx)` → `{unmount}`)

町が渡す ctx:`player`(id/name/look)・`audio`・`storage`(アプリ専用に区切られる)・`wallet.add(n)`(共通コイン)・`emit()`・`close()`。
アプリ中は町の描画を止めるので電池を食わない。

### ぷにチャンクを入れる
`dist/punichunk.js` を `apps/punichunk/punichunk.js` に置いてビルドし直すだけ(registry.js に設定ずみ)。
スコア 200 点ごとに 1 コイン(上限 60)。ランキングは `services.ranking` に町のサーバーをつなげば店内の画面にも出せる。
### チャンク・カードを入れる
`apps/chunkcards/index.html` に置き、`<script src="../../sdk/town-sdk.js">` を足す。勝てば `TownSDK.addCoins(n)`。

## AIとおしゃべり(プレイヤー持ち込みキー)
運営は AI 代を払わない作り。プレイヤーが自分のキーを設定画面に貼ると、住人に話しかけて自由に会話できる(未設定なら今までの固定台詞)。
- 対応:Gemini(無料枠あり・既定)/ OpenAI / Claude。ブラウザから各社へ直接つなぐ(町のサーバーは通らない)。
- 画面内にキー取得ページへのリンクと3ステップの手順あり(設定 ⚙ → AIとおしゃべり、または住人の「AIでおしゃべり(設定)」)。
- キーは `localStorage` の `town:ai` にだけ保存。1日の上限回数(既定100)、返事は90字まで、1.2秒間隔。
- 住人の性格は `src/game/npc.js` の `persona`、共通ルール(AIと言わない・個人情報を聞かない等)は `src/core/ai.js` の `buildSystem`。
- モデル名は「くわしい設定」で変えられる(各社の更新で既定名が古くなったとき用)。
- 注意:ぷにチャンクのような同じページで動くアプリ(script型)は、理屈の上では保存領域を読める。信頼できる自作アプリだけを置くこと。他人のアプリは iframe 型で。
- テスト:`node tests/ai.mjs`(偽の応答で形を確認。実キーは使わない)。

## 追加ずみの機能(v0.2)
- 住人: 気まぐれに止まる/動く、散歩、すれ違いで英語のヒント(日本語のつぶやき)、しおり/マルは本を持つ
- ハト(ambient.js): 歩く・つつく・飛び立つ・旋回・えさ。マップは「探す」ボタン、ダブルタップでそこへ移動(建物は入口の正面)
- 低負荷モード(設定): 30fps・解像度0.75・影/ブルーム/輪郭なし・噴水少・月は一枚絵。流れ星は残す
- 英語モード: 相手が英語で返す(easy/natural)、タップで訳、単語・フレーズを「ことばノート」に保存。アプリからは `ctx.notes.list()`
- おとなトーク: 生年月日の自己申告で18歳以上のみ。Gemini側のフィルターに任せ、こちらのプロンプトでは追加の制限をしない方針(`buildSystem` の adult 分岐)
- 会話の指示文は `src/core/ai.js` の `buildSystem`。長くすると返事が単調になるので、足すときは最小限に

## 別の Claude に渡すとき
1. ソースzip(このフォルダ一式)と、このREADMEを渡す。ビルドは `npm i && node build.mjs`、確認は `dist/index.html` を開く。
2. 別プロジェクトのアプリ(ぷにチャンク等)は、町本体に触らず `apps/<id>/` に成果物を置くだけ。契約は上の「Town App 契約 v1」。
3. 町本体を直す場合は、変えたい項目を上の表で探し、そのファイルだけ編集。編集後は必ず `node build.mjs`。
4. 未実装: ショップ/家の中身、ぷにチャンク・カード本体、本物の同時接続、ことばノートの復習(チャンクストリームで出す予定)。

## 公開とテストの方針(決定)
- 公開URLとコードは1つだけ。テストと本番は**部屋名だけ**で分ける(`?server=wss://…&room=名前`)。
  - 家族: `room=fam-` + 推測されにくい文字列 / 開発者のテスト: `room=test`
- 保存(コイン・ことばノート・AIキー)は同じURLなので共有される。
- 更新前は手元で `dist/index.html` を開いて確認。不具合時はGitHubで1つ前の版に戻す。
- 通信の形(`server/relay.js`)を変えるときは、古い版でも動くよう「足す」だけにする。
- 人数上限: 1部屋8人・全体40人(環境変数 `MAX_ROOM` / `MAX_ALL`)。

## 家具(ショップと家)
- データと保存: `src/game/furniture.js`(家具は `ITEMS` に1件足すだけ。見た目は箱や円柱の組み合わせ `build`)。保存キーは `town:furn:inv`(持ち物)・`town:furn:room`(配置)。
- アプリ: `src/apps/home.js`(ショップ=買う、あなたの家=3Dの部屋に置く)。部屋は8×8マス、同じ家具は5個まで、ラグは他の家具の下に重ねられる。
- 操作: 下の一覧から出す → ドラッグかゆかタップで移動 → まわす/しまう。
- テスト用にコインを増やす: 町のURLの末尾に `?coins=10000`(その端末の保存だけが変わる。URLの他の指定とは `&` でつなぐ)
- テスト: `node tests/furn.mjs`(コインを渡して買う→置く→ドラッグまで確認)。

## 公開手順(無料)
1. GitHub にこのフォルダを置く。町の画面: `dist/index.html` を `docs/index.html` にコピー → Settings → Pages → Branch main / `/docs`。
2. サーバー: Render で New → Blueprint → このリポジトリ(`render.yaml` を自動で読む)。できた URL が `https://xxxx.onrender.com`。
3. 遊ぶURL: `https://<ユーザー名>.github.io/<リポジトリ名>/?server=wss://xxxx.onrender.com&room=fam-…`
- Render 無料は15分アクセスがないと眠る(次の接続で起動に少しかかる)。`https://xxxx.onrender.com/` は「ok」を返す。

## 次の一歩(おすすめ順)
1. ぷにチャンクとカードを実際に置いて、ゲームセンターとカフェを通しで確認
2. ショップと家(コインで家具を買って部屋に置く)
3. 本物の同時接続:server/relay.js を無料枠にのせる(位置と吹き出しだけなので軽い)。ログインが要る機能(ランキング・購入)は別途
4. アバター作成:`look` を編集する画面を作り、見た目だけ glTF/VRM に差し替えられるよう character.js の makeCharacter を入口にする
