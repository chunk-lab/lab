# glb-residents-polish
- 最終更新: 2026-11-12 JST
- 土台: `polish`(b5336f8)の上に重ねたもの
- 入っている内容: 住人の3Dモデル(GLB)。`src/world/glbchar.js`(Mixamoリグ入りGLBを makeCharacter と同じ使い方で動かす。待機・歩き・お辞儀・手振り。読み込み前/失敗時は従来のコード製キャラ)、`assets/models/`(ミイ・男爵・ゴン・こはる・しおり・マル・ゆず・ルナ・哲学者=tetsu・潮見さん=suna)、`build.mjs` が `dist/models` にコピー、`npc.js` と `main.js`(名札の高さ)に小さな変更
- 手振りは頭や帽子に当たらないよう、手を肩の高さまでにした動き(全員共通)
- 大喜利チョコも追加(肩の位置を広げたもの)。まだ: チャンクくん(モデルなし)、そら・はな(特別枠、組み込み方が未決)。確認用公開(lab-preview)の workflow は models をコピーしないので、公開側に反映するには `site/town3d/models` へのコピーが要る
- 補足: `node_modules/three` などは、ほかのAIがコミットした/tmp向けのシンボリックリンク。触っていない
- 追加(2026-11-12 夜): 公開の仕組みを1本にした。素材は assets/ に置くだけで dist に全部入る(build.mjs)、統合アプリは town3d/dist をまるごと取りこむ(series/build.mjs)、モデルに版の印(versions.json と ?v=)、画面の版表示にブランチ名、town3d/index.html は build が自動で上書き。dist/・node_modules(他のAIの/tmp向けリンク)をGitの管理から外した。lab の series-build・town3d-build は手動だけに。確認用の公開と点検は lab-preview(10分ごと自動・点検OKだけ公開)。HANDOFF.md の「公開の仕組み」を書き換えた
- 追加: 確認用の公開は、プッシュしたときだけ呼ぶ(preview-trigger.yml と PREVIEW_TOKEN)。定期実行はしない
- 状態: polish に合流(早送り)
