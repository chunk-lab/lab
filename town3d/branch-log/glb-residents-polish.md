# glb-residents-polish
- 最終更新: 2026-11-12 JST
- 土台: `polish`(b5336f8)の上に重ねたもの
- 入っている内容: 住人の3Dモデル(GLB)。`src/world/glbchar.js`(Mixamoリグ入りGLBを makeCharacter と同じ使い方で動かす。待機・歩き・お辞儀・手振り。読み込み前/失敗時は従来のコード製キャラ)、`assets/models/`(ミイ・男爵・ゴン・こはる・しおり・マル・ゆず・ルナ・哲学者=tetsu・潮見さん=suna)、`build.mjs` が `dist/models` にコピー、`npc.js` と `main.js`(名札の高さ)に小さな変更
- 手振りは頭や帽子に当たらないよう、手を肩の高さまでにした動き(全員共通)
- まだ: 大喜利チョコ・チャンクくん(モデルなし)、そら・はな(特別枠、組み込み方が未決)。確認用公開(lab-preview)の workflow は models をコピーしないので、公開側に反映するには `site/town3d/models` へのコピーが要る
- 補足: `node_modules/three` などは、ほかのAIがコミットした/tmp向けのシンボリックリンク。触っていない
