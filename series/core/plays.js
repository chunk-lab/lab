/* 遊びの属性表：どの遊びが「したいこと」「気分」「時間」「施設」のどこに入るか。
   勉強部屋の記録（したいこと別の時間）・「今日なにする?」・結果の帯の「次のおすすめ」が、この表だけを見る。
   新しい遊びを足すときは、ここに1行足すだけ（各アプリは report('done', {play:'<id>', …}) で知らせる）。
   want：word（単語）/ read（読む）/ make（文を作る）/ talk（話す・聞く）/ chill（まったり）
   mood：study（勉強）/ both（どちらも）/ game（ゲーム）
   time：向いている時間（5＝5分、15＝15分、30＝じっくり）
   go：開き方 { game, opts } ／ { to:'3d' }（3Dの町へ）／ { to:'note' }（勉強ノート） */
export const WANTS = [
  { k: 'word', n: '単語' }, { k: 'read', n: '読む' }, { k: 'make', n: '文を作る' }, { k: 'talk', n: '話す・聞く' }, { k: 'chill', n: 'まったり' },
];
export const MOODS = [{ k: 'study', n: '勉強' }, { k: 'game', n: 'ゲーム' }, { k: 'any', n: '決めてない' }];
export const TIMES = [{ k: 5, n: '5分' }, { k: 15, n: '15分' }, { k: 30, n: 'じっくり' }];
export const PLAYS = [
  { id: 'stream.word', n: '単語練習(ストリーム)', want: 'word', mood: 'both', time: [5, 15], place: 'school', go: { game: 'stream' } },
  { id: 'note.practice', n: 'まちがえた言葉のやり直し', want: 'word', mood: 'study', time: [5, 15, 30], place: 'home', go: { to: 'note' } },
  { id: 'test', n: '実力テスト', want: 'word', mood: 'study', time: [5, 15], place: 'school', go: { to: 'test' } },
  { id: 'eigo.prac', n: '熟語・句動詞のれんしゅう(英語脳)', want: 'word', mood: 'study', time: [15, 30], place: 'school', go: { game: 'eigonou' } },
  { id: 'lib.weekly', n: '課題図書を読む', want: 'read', mood: 'study', time: [15, 30], place: 'library', go: { game: 'library', opts: { tab: 'weekly' } } },
  { id: 'stream.read', n: '長文をストリームで読む', want: 'read', mood: 'both', time: [5, 15], place: 'library', go: { game: 'library', opts: { tab: 'level' } } },
  { id: 'cc.read', n: 'リーディング(読む・解く)', want: 'read', mood: 'study', time: [15, 30], place: 'library', go: { game: 'library', opts: { tab: 'featured' } } },
  { id: 'cc.game', n: 'チャンクチャンクのチャレンジ', want: 'read', mood: 'game', time: [5], place: 'game', go: { game: 'chunkchunk', opts: { face: 'arcade' } } },
  { id: 'cc.lesson', n: 'チャンクレッスン', want: 'make', mood: 'study', time: [15, 30], place: 'school', go: { game: 'chunkchunk', opts: { face: 'lesson' } } },
  { id: 'eigo', n: '英語脳で文を作る', want: 'make', mood: 'study', time: [15, 30], place: 'library', go: { game: 'eigonou' } },
  { id: 'cards', n: 'チャンク・カード', want: 'make', mood: 'game', time: [5, 15], place: 'game', go: { game: 'cards' } },
  { id: 'listen', n: 'ランダムチャンク(聞き取り)', want: 'talk', mood: 'game', time: [5, 15], place: 'game', go: { game: 'listen' } },
  { id: 'note.mimic', n: '聞いてまねる(勉強ノート)', want: 'talk', mood: 'study', time: [5, 15], place: 'home', go: { to: 'note', kind: 'short' } },
  { id: 'town.chat', n: '住人と英語でおしゃべり', want: 'talk', mood: 'both', time: [5, 15, 30], place: 'town', go: { to: '3d' } },
  { id: 'town.ogiri', n: '英語で大喜利', want: 'chill', mood: 'any', time: [15], place: 'town', go: { to: '3d' } },
  { id: 'town.walk', n: '町を散歩(格言・ハーモニカ・おみくじ)', want: 'chill', mood: 'any', time: [5, 15, 30], place: 'town', go: { to: '3d' } },
  { id: 'eigo.dict', n: '英語脳で気になる言葉を調べる', want: 'chill', mood: 'study', time: [5, 15], place: 'library', go: { game: 'eigonou' } },
];
export const playOf = id => PLAYS.find(p => p.id === id) || null;
