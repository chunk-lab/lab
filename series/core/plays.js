/* 遊びの属性表：どの遊びが「したいこと」「気分」「時間」「施設」のどこに入るか。
   勉強部屋の記録（したいこと別の時間）と、これから作る「今日なにする?」の両方がこの表を使う。
   新しい遊びを足すときは、ここに1行足すだけ（各アプリは report('done', {play:'<id>', …}) で知らせる）。
   want：word（単語）/ read（読む）/ make（文を作る）/ talk（話す・聞く）/ chill（まったり）
   mood：study（勉強）/ both（どちらも）/ game（ゲーム） */
export const WANTS = [
  { k: 'word', n: '単語' }, { k: 'read', n: '読む' }, { k: 'make', n: '文を作る' }, { k: 'talk', n: '話す・聞く' }, { k: 'chill', n: 'まったり' },
];
export const PLAYS = [
  { id: 'stream.word', n: '単語練習', want: 'word', mood: 'study', time: [5, 15], place: 'school', game: 'stream' },
  { id: 'stream.read', n: '長文を読む(ストリーム)', want: 'read', mood: 'both', time: [5, 15], place: 'library', game: 'stream' },
  { id: 'cc.lesson', n: 'チャンクレッスン', want: 'make', mood: 'study', time: [15, 30], place: 'school', game: 'chunkchunk', opts: { face: 'lesson' } },
  { id: 'cc.read', n: 'リーディング', want: 'read', mood: 'study', time: [15, 30], place: 'library', game: 'chunkchunk', opts: { face: 'library' } },
  { id: 'cc.game', n: 'チャンクチャンクのゲーム', want: 'make', mood: 'game', time: [5], place: 'game', game: 'chunkchunk', opts: { face: 'arcade' } },
  { id: 'eigo', n: '英語脳で文を作る', want: 'make', mood: 'study', time: [15, 30], place: 'library', game: 'eigonou' },
  { id: 'cards', n: 'チャンク・カード', want: 'make', mood: 'both', time: [5, 15], place: 'game', game: 'cards' },
  { id: 'town.chat', n: '住人とおしゃべり', want: 'talk', mood: 'both', time: [5, 15], place: 'town' },
];
export const playOf = id => PLAYS.find(p => p.id === id) || null;
