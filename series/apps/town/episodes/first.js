// 台本だけを置く。既存ゲームのデータ・解放条件は変更しない。
const say = (who, text, face = 'normal', en = '', ja = '') => ({ type: 'say', who, text, face, en, ja });
export const FIRST_EPISODE = {
  id: 'first', title: 'ちょっと、外に出たい', character: 'はな',
  steps: [
    { type: 'name', who: 'hana', text: 'はじめまして！ わたし、はな。あなたの名前を教えて？' },
    { type: 'level', who: 'sora', title: '英語の単語力をチェック', text: 'ぼくはそら。英語はどのくらい分かる？ 単語のテストで、ちょうどいい難しさを見つけよう。受けなくてもOK。その場合は、やさしい単語から始めるよ。' },
    say('hana', '今日はそらくんと、町に出かける約束をしてるんだ。\nまだ少し時間があるし、出かける前に英語を練習しておこうかな。\nまずは、知っている単語を確かめてみよう。', 'joy'),
    { type: 'game', game: 'stream', title: 'ストリームで単語練習', text: 'はなちゃんと、音を聞きながら意味を選んでみよう。初級の単語セットを1つ練習します。', opts: { fontSize: 1.4, wordset: { lv: 1, k: 0 } }, match: { name: 'done', play: 'stream.word' } },
    { type: 'game', game: 'chunkchunk', title: '読む・聞くレッスン 第1章', text: '二人の会話を聞きながら、英文を読む練習をしてみよう。', opts: { face: 'lesson', storyChapter: 1 }, match: { name: 'story_clear', chapter: 1 } },
    say('hana', 'さっきの文、最後まで読めた！', 'idea'),
    say('sora', 'いいね。少しずつ、読める文を増やしていこう。', 'joy'),
    say('hana', 'ちょっと分かった気がする。でも、今日はひと休みしたい。'),
    say('sora', '「休みたい」って、英語で何て言うか分かる？', 'idea'),
    say('hana', 'えっと……分かんない。', 'think'),
    say('sora', 'ヒントは want to。「〜したい」っていう形なんだ。英語脳アプリで、「私は休みたい」の文を見てみよう。', 'joy'),
    { type: 'game', game: 'eigonou', title: '英語脳アプリで「〜したい」', text: '英語脳アプリで「私は休みたい」の文を動かしてみよう。上のタブを押すとサイコロが出て、言葉をランダムに入れかえられるよ。', opts: { episodePractice: 'want-to' }, match: { name: 'episode_practice', exercise: 'want-to' } },
    say('hana', 'できた！ I want to rest!', 'joy', 'I want to rest.', '休みたい。'),
    say('sora', 'ほかにも、何かしたいことある？'),
    say('hana', '今は……外に出たい！', 'joy'),
    say('sora', '外に出る、は go out。I want to go out. だね。', 'idea', 'I want to go out.', '外に出たい。'),
    say('hana', 'I want to go out!', 'joy', 'I want to go out.', '外に出たい。'),
    say('sora', 'よし。じゃあ、ほんとに町に出かけよう！', 'joy'),
    { type: 'door' },
  ],
};
