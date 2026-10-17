# チャンクタウン アバター 制作規格

## 決めたこと
- 全身・4.5頭身・アニメ調・正面の立ち姿。男女2人の素体。
- 絵は画像生成で作る。動きと着せ替えはアプリ側（PixiJS／WebGL）で行う。
- パーツの分け方は Spine と同じ考え方（後でプロに頼んでも移せる）。

## キャンバス（全部の絵で同じにする）
- 1024×1536px、背景は白一色（あとで切り抜く）。
- 体の位置は `guide/guide_4.5heads.png` に合わせる：頭の上 y=90、あご y=390、足の裏 y=1440、体の中心 x=512。
- 腕は体から少し離して下ろす（服の切り出しと、腕の揺れのため）。

## 作る順番（画像生成）
1. **素体**（男女それぞれ1枚）：ガイド画像を参考画像にして生成。肌着姿（白いタンクトップ＋短パン）、はだし、口を閉じた笑顔、目は開き。
   → これが全パーツの「土台」。以降は全部この絵の上に描き足す。
2. **顔の差分**（素体の上に描き足し＝インペイント。顔のまわりだけ塗って指示）
   - 目：半目／閉じ目（にっこり）／驚き
   - 口：あいた口（話す）／大きく笑う／への字
   - 眉は目と一緒に描かれてよい
3. **髪型**（素体の頭まわりを塗って描き足し）：女の子3種・男の子3種。前髪と後ろ髪がまとまった1枚でよい（分けるのは私がやる）。
4. **服**（素体の体を塗って描き足し）：上着・下・靴を、まず1セットずつ（無料の基本服）。
5. **有料向け**（あとで）：豪華な衣装・髪型・アクセサリー・羽などのエフェクト。

### コツ
- 素体と同じ画像の上で「インペイント」すると、ポーズも位置も変わらない。私は素体との差分を取り、服だけ・髪だけを切り出す。
- 新しく生成し直すと位置がずれるので、2以降は必ず素体の上で描き足す。
- 1枚ずつ PNG で保存（ファイル名は `girl_base.png`、`girl_eye_closed.png`、`girl_hair_02.png`、`girl_top_01.png` のように）。

## 素体のプロンプト（例）
女の子：
> full body, standing, front view, symmetrical pose, arms slightly away from body, anime style, cute and cool, 4.5 heads tall, girl, white tank top and white shorts, barefoot, gentle smile, closed mouth, clean lineart, soft cel shading, plain white background, game character sprite, centered

男の子：
> full body, standing, front view, symmetrical pose, arms slightly away from body, anime style, cute and cool, 4.5 heads tall, boy, white tank top and white shorts, barefoot, gentle smile, closed mouth, clean lineart, soft cel shading, plain white background, game character sprite, centered

（ガイド画像をポーズ・構図の参考として一緒に渡す。キャンバスは 1024×1536 か 2:3）

## アプリ側でやること（Claude）
- 切り抜き・位置合わせ・パーツ分け（髪の前後、腕、体）
- 動き：呼吸、まばたき、口パク、髪と服の揺れ、喜ぶ（ジャンプ＋笑顔）、驚く、歩く（その場で足踏み）
- タッチ：頭をなでる→照れる、体をつつく→驚く
- 着せ替え・保存と読み込み・無料／有料アイテムの管理・スマホ画面
- 街のアプリの自宅に組み込み（独立した部品として）

## 正直な限界
- 歩く動きは「その場の足踏みと上下の揺れ」まで。本格的な歩きのアニメは、足のパーツを描き分けた絵が必要。
- 画像生成の絵柄がぶれると、パーツどうしの雰囲気がそろわない。同じモデル・同じ設定で作るのが大事。
