/* どのアプリに、どのゲームを入れるか（売るアプリの一覧）と、ゲームごとに公開するファイル。
   新しく単体アプリを売るときは APPS に1つ足すだけ。 */
export const PREBUILD = [   // 組み立ての前に動かす道具
  'tools/build_dict.py',   // 共通の辞書
];
export const GAMES = {   // ゲーム → 公開するファイル [元, 公開先]（フォルダは中身ごと）
  punichunk: [],   // 全部 app.js / app.css に入る
  cards: [['games/chunkchunk/assets/img/chara', 'g/chunkchunk/img/chara']],   // 案内の2人の顔（ほかのゲームと同じ場所に置く）
  stream: [['games/stream/data', 'g/stream'], ['games/stream/assets', 'g/stream']],
  chunkchunk: [['games/chunkchunk/assets', 'g/chunkchunk']],   // 本体は app.js / app.css に入る。レッスンの2人の絵だけ別ファイル
  eigonou: [{ bundle: 'games/eigonou/src/main.js', out: 'g/eigonou/eigo.js' }],   // 大きいので、開いたときに読み込む別ファイル（eigo.js / eigo.css）
};
export const APPS = {
  town: { shell: 'town', title: 'チャンクタウン', theme: 'cute', games: ['stream', 'punichunk', 'cards', 'chunkchunk', 'eigonou'], grants: ['sub:all'], backButton: true, backLabel: '🏠 街へ', assets: [['apps/town/img', 'img']] },
  stream: { shell: 'solo', theme: 'chic', title: 'チャンクストリーム', games: ['stream'], grants: ['game:stream'] },
  punichunk: { shell: 'solo', theme: 'chic', title: 'ぷにチャンク', games: ['punichunk'], grants: ['game:punichunk'] },
  cards: { shell: 'solo', theme: 'chic', title: 'チャンク・カード', games: ['cards'], grants: ['game:cards'] },
  eigonou: { shell: 'solo', theme: 'chic', title: '英語脳アプリ', games: ['eigonou'], grants: ['game:eigonou'] },
  chunkchunk: { shell: 'solo', theme: 'chic', title: 'チャンクチャンク', games: ['chunkchunk'], grants: ['game:chunkchunk'], opts: { face: 'all' } },   // 単体：学校・図書館・ゲームセンターを下のタブで切りかえる
};
