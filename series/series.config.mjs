/* どのアプリに、どのゲームを入れるか（売るアプリの一覧）と、ゲームごとに公開するファイル。
   新しく単体アプリを売るときは APPS に1つ足すだけ。 */
export const PREBUILD = [   // 組み立ての前に動かす道具
  'tools/build_dict.py',   // 共通の辞書
];
export const GAMES = {   // ゲーム → 公開するファイル [元, 公開先]（フォルダは中身ごと）
  punichunk: [],   // 全部 app.js / app.css に入る
  cards: [],
  stream: [['games/stream/data', 'g/stream'], ['games/stream/assets', 'g/stream']],
  chunkchunk: [],   // 全部 app.js / app.css に入る（共通の辞書・読む画面を使う）
};
export const APPS = {
  town: { shell: 'town', title: 'チャンクタウン', games: ['stream', 'punichunk', 'cards', 'chunkchunk'], grants: ['sub:all'], backButton: true, backLabel: '🏠 街へ', assets: [['apps/town/img', 'img']] },
  stream: { shell: 'solo', title: 'チャンクストリーム', games: ['stream'], grants: ['game:stream'] },
  punichunk: { shell: 'solo', title: 'ぷにチャンク', games: ['punichunk'], grants: ['game:punichunk'] },
  cards: { shell: 'solo', title: 'チャンク・カード', games: ['cards'], grants: ['game:cards'] },
};
